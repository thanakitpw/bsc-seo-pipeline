// SEO gate validator. Rules ported verbatim from 06-content-pipeline-architecture.md.
// Pure runGate() for unit tests; CLI wraps file parse + config load.
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { loadConfig } from './lib/config.mjs';
import { h1Count, headingOrderViolation, links, wordCount, similarity } from './lib/md.mjs';
import { isValidSlug } from './lib/slugify.mjs';

/**
 * @param {{frontmatter:object, body:string, config:object,
 *          existingSlugs?:string[], existingTitles?:string[]}} input
 * @returns {{errors:string[], warnings:string[]}}
 */
export function runGate({ frontmatter = {}, body = '', config, existingSlugs = [], existingTitles = [] }) {
  const errors = [];
  const warnings = [];
  const L = config.seo_limits;
  const fm = frontmatter;

  // seo_title: present -> <= max; absent -> title_th must be <= max
  const titleForLen = fm.seo_title ? fm.seo_title : fm.title_th || '';
  if (!titleForLen) {
    errors.push('seo_title/title_th: ไม่มีทั้งคู่');
  } else if (titleForLen.length > L.seo_title_max) {
    errors.push(`seo_title len: "${titleForLen}" = ${titleForLen.length} ตัว > ${L.seo_title_max}`);
  }

  // seo_description: 70-160 (>max error, <min warn)
  const desc = fm.seo_description || '';
  if (desc.length > L.seo_description_max) {
    errors.push(`seo_description len: ${desc.length} > ${L.seo_description_max}`);
  } else if (desc && desc.length < L.seo_description_min) {
    warnings.push(`seo_description len: ${desc.length} < ${L.seo_description_min}`);
  } else if (!desc) {
    warnings.push('seo_description: ว่าง (จะ fallback เป็น excerpt)');
  }

  // slug: valid + not duplicated in DB
  const conv = config.slug.convention;
  if (!fm.slug) errors.push('slug: ไม่มี');
  else if (!isValidSlug(fm.slug, conv)) errors.push(`slug: "${fm.slug}" ผิด convention ${conv}`);
  else if (existingSlugs.includes(fm.slug)) errors.push(`slug: "${fm.slug}" ชนกับบทความเดิมใน DB`);

  // body H1: exactly one
  const h1 = h1Count(body);
  if (h1 !== 1) errors.push(`H1: เจอ ${h1} ตัว (ต้องมี 1)`);

  // heading order: no skipped level
  const ord = headingOrderViolation(body);
  if (ord) warnings.push(`heading order: ข้ามจาก H${ord.from} → H${ord.to} ("${ord.text}")`);

  // internal links
  const ls = links(body, config.site?.base_url || '');
  const internal = ls.filter((l) => l.internal);
  const pillars = config.internal_links.pillars || [];
  const pillarHits = internal.filter((l) => pillars.some((p) => l.href.includes(p))).length;
  if (internal.length < config.internal_links.min_total) {
    errors.push(`internal links: ${internal.length} < ${config.internal_links.min_total}`);
  }
  if (pillarHits < config.internal_links.min_pillar) {
    errors.push(`internal pillar link: ${pillarHits} < ${config.internal_links.min_pillar} (ต้องลิงก์ไป pillar อย่างน้อย ${config.internal_links.min_pillar})`);
  }

  // word count (Thai)
  const wc = wordCount(body);
  if (wc < L.word_count_min) errors.push(`word count: ~${wc} คำ < ${L.word_count_min} (thin)`);

  // category whitelist
  const wl = config.taxonomy.whitelist || [];
  if (!fm.category) errors.push('category: ไม่มี');
  else if (wl.length && !wl.includes(fm.category)) errors.push(`category: "${fm.category}" ไม่อยู่ใน whitelist`);

  // cannibalization (warn)
  if (config.cannibalization.enabled) {
    const th = config.cannibalization.title_similarity_threshold;
    for (const t of existingTitles) {
      if (fm.title_th && similarity(fm.title_th, t) > th) {
        warnings.push(`cannibalization: title ใกล้กับบทความเดิม "${t}"`);
        break;
      }
    }
  }

  // voice / AI-pattern (warn-only — โทนเป็น subjective ไม่ hard-block)
  const voice = config.voice || {};
  const hay = `${fm.title_th || ''}\n${fm.seo_description || ''}\n${body}`;
  for (const w of voice.banned_words || []) {
    if (w && hay.includes(w)) warnings.push(`voice: เจอคำต้องห้าม "${w}" (config.voice.banned_words)`);
  }
  const AI_PATTERNS = [
    /ในยุค(ปัจจุบัน|ดิจิทัล)/,
    /อย่างไรก็ตาม[, ]/,
    /จากงานวิจัย(พบว่า|ชี้ว่า)/,
    /ผลสำรวจ(พบว่า|ชี้ว่า)/,
    /กล่าวโดยสรุป/,
    /สิ่งสำคัญที่สุดคือ/,
  ];
  const hits = AI_PATTERNS.filter((re) => re.test(body)).length;
  if (hits >= 2) warnings.push(`voice: พบสำนวน AI ซ้ำ ${hits} แบบ (พิจารณา humanize)`);
  if (/อาทิตย์(นี้|หน้า|ที่แล้ว|ก่อน)/.test(body)) warnings.push('voice: ใช้ "อาทิตย์" — ควรใช้ "สัปดาห์"');

  return { errors, warnings };
}

export function gateFile(path, config, extra = {}) {
  const raw = readFileSync(path, 'utf8');
  const { data, content } = matter(raw);
  return runGate({ frontmatter: data, body: content, config, ...extra });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  const file = fileIdx >= 0 ? args[fileIdx + 1] : args.find((a) => !a.startsWith('--'));
  const mode = args.includes('--block') ? 'block' : 'warn';
  const asJson = args.includes('--json');
  if (!file) { console.error('usage: seo-gate.mjs <file.md> [--block|--warn] [--json]'); process.exit(2); }
  try {
    const config = loadConfig();
    const res = gateFile(file, config);
    if (asJson) {
      console.log(JSON.stringify(res, null, 2));
    } else {
      for (const e of res.errors) console.log(`🔴 ERROR  ${e}`);
      for (const w of res.warnings) console.log(`⚠️  WARN   ${w}`);
      if (!res.errors.length && !res.warnings.length) console.log('✅ ผ่านทุกกฎ');
    }
    const fail = mode === 'block' && res.errors.length > 0;
    process.exit(fail ? 1 : 0);
  } catch (e) {
    console.error(`🔴 ${e.message}`);
    process.exit(2);
  }
}
