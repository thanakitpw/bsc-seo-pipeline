// Site-readiness + blog-content auditor. Reuses runGate (no rule duplication).
// Report-only: always exit 0. The skill decides how to act on P0/P1/P2.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from './lib/config.mjs';
import { head, getText } from './lib/http.mjs';
import { runGate } from './seo-gate.mjs';
import { listSlugs } from './publish.mjs';

const today = () => new Date().toISOString().slice(0, 10);

function joinUrl(base, path) {
  if (/^https?:\/\//i.test(path)) return path;
  return base.replace(/\/$/, '') + '/' + String(path).replace(/^\//, '');
}

// Extract first JSON-LD block whose @type includes Article.
function articleJsonLd(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const json = JSON.parse(m[1].trim());
      const nodes = Array.isArray(json) ? json : (json['@graph'] || [json]);
      for (const n of nodes) {
        const t = n['@type'];
        const types = Array.isArray(t) ? t : [t];
        if (types.some((x) => /Article/i.test(String(x)))) return n;
      }
    } catch { /* skip malformed block */ }
  }
  return null;
}

export async function readiness(config) {
  const base = config.site.base_url;
  const findings = [];
  if (!base) {
    findings.push({ sev: 'P0', area: 'config', msg: 'site.base_url ว่าง — audit readiness ทำไม่ได้' });
    return findings;
  }

  for (const p of config.internal_links.pillars) {
    const u = joinUrl(base, p);
    const r = await head(u);
    if (r.status !== 200) findings.push({ sev: 'P0', area: 'pillar', msg: `pillar ${u} → ${r.status || 'unreachable'} (writer internal link จะพัง)` });
  }

  const robots = await getText(joinUrl(base, '/robots.txt'));
  if (!robots.ok) findings.push({ sev: 'P1', area: 'robots', msg: `robots.txt → ${robots.status}` });
  else if (/Disallow:\s*\/\s*$/im.test(robots.text)) findings.push({ sev: 'P0', area: 'robots', msg: 'robots.txt Disallow: / (บล็อกทั้งเว็บ)' });

  const sm = await getText(joinUrl(base, '/sitemap.xml'));
  if (!sm.ok) findings.push({ sev: 'P0', area: 'sitemap', msg: `sitemap.xml → ${sm.status}` });
  else if (!sm.text.includes(config.site.article_path_prefix)) {
    findings.push({ sev: 'P1', area: 'sitemap', msg: `sitemap ไม่มี path "${config.site.article_path_prefix}" (อาจยังไม่มีบทความ หรือ sitemap ไม่รวม blog)` });
  }

  // Sample one published article route for render + JSON-LD.
  let slugs = [];
  try { slugs = await listSlugs(config); } catch (e) { findings.push({ sev: 'P1', area: 'db', msg: `list-slugs: ${e.message}` }); }
  if (slugs.length) {
    const sample = joinUrl(base, config.site.article_path_prefix + slugs[0].slug);
    const pg = await getText(sample);
    if (!pg.ok) findings.push({ sev: 'P0', area: 'route', msg: `article route ${sample} → ${pg.status}` });
    else if (!articleJsonLd(pg.text)) findings.push({ sev: 'P1', area: 'schema', msg: `${sample}: ไม่พบ JSON-LD @type Article ที่ valid` });
  }

  // CWV (optional).
  if (config.audit.check_cwv) {
    try {
      const { psi } = await import('./psi.mjs');
      const target = slugs.length ? joinUrl(base, config.site.article_path_prefix + slugs[0].slug) : base;
      const c = await psi(target, config.audit.cwv_strategy);
      if (c.perf < 80) findings.push({ sev: 'P1', area: 'cwv', msg: `Perf ${c.perf} (<80) @ ${target}` });
      if (c.cls != null && c.cls > 0.1) findings.push({ sev: 'P2', area: 'cwv', msg: `CLS ${c.cls}` });
    } catch {
      findings.push({ sev: 'P2', area: 'cwv', msg: 'ข้าม CWV (ไม่มี PSI_API_KEY หรือ PSI error)' });
    }
  }
  return findings;
}

export async function contentAudit(config) {
  const findings = [];
  let rows = [];
  try { rows = await listSlugs(config); } catch (e) {
    findings.push({ sev: 'P0', area: 'db', msg: `list-slugs: ${e.message}` });
    return findings;
  }
  const base = config.site.base_url;
  const max = config.audit.crawl_max;
  const sample = rows.slice(0, max);

  for (const { slug, title_th } of sample) {
    const url = joinUrl(base, config.site.article_path_prefix + slug);
    const pg = await getText(url);
    if (!pg.ok) { findings.push({ sev: 'P1', area: 'crawl', msg: `${url} → ${pg.status}` }); continue; }
    if (!articleJsonLd(pg.text)) findings.push({ sev: 'P2', area: 'schema', msg: `${slug}: JSON-LD Article หาย` });
  }

  // Corpus-level cannibalization via title similarity (reuse runGate machinery).
  for (let i = 0; i < sample.length; i++) {
    const others = sample.filter((_, j) => j !== i);
    const g = runGate({
      frontmatter: { slug: sample[i].slug + '-x', title_th: sample[i].title_th, seo_title: 'x', category: (config.taxonomy.whitelist[0] || 'x') },
      body: '# x\n[a](' + (config.internal_links.pillars[0] || '/') + ')\n[b](/y)\n' + 'ก'.repeat(2000),
      config,
      existingSlugs: [],
      existingTitles: others.map((o) => o.title_th).filter(Boolean),
    });
    for (const w of g.warnings) if (w.startsWith('cannibalization')) {
      findings.push({ sev: 'P2', area: 'cannibalization', msg: `${sample[i].slug}: ${w}` });
    }
  }
  return findings;
}

export async function audit(config, { mode = 'all' } = {}) {
  const out = [];
  if (mode === 'all' || mode === 'readiness') out.push(...await readiness(config));
  if (mode === 'all' || mode === 'content') out.push(...await contentAudit(config));
  return out;
}

function toMarkdown(findings) {
  const by = (s) => findings.filter((f) => f.sev === s);
  const sec = (s, label) => {
    const items = by(s);
    return `## ${label} (${items.length})\n` + (items.length
      ? items.map((f) => `- [${f.area}] ${f.msg}`).join('\n')
      : '- ไม่มี') + '\n';
  };
  return `# SEO Audit — ${today()}\n\n` +
    sec('P0', 'P0 — ต้องแก้ก่อน research') +
    '\n' + sec('P1', 'P1 — ควรแก้') +
    '\n' + sec('P2', 'P2 — เฝ้าดู') + '\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const mode = args.includes('--readiness') ? 'readiness' : args.includes('--content') ? 'content' : 'all';
  const config = loadConfig();
  (async () => {
    const findings = await audit(config, { mode });
    if (args.includes('--json')) {
      console.log(JSON.stringify(findings, null, 2));
    } else {
      const md = toMarkdown(findings);
      const dir = resolve(process.cwd(), 'audit');
      mkdirSync(dir, { recursive: true });
      const path = resolve(dir, `${today()}-audit.md`);
      writeFileSync(path, md);
      const c = (s) => findings.filter((f) => f.sev === s).length;
      console.log(`เขียน ${path}`);
      console.log(`P0:${c('P0')}  P1:${c('P1')}  P2:${c('P2')}`);
    }
    process.exit(0); // report-only
  })();
}
