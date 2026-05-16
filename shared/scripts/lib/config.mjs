// Loads + validates seo-blog.config.yaml from the current project (cwd),
// resolving ${ENV} placeholders against process.env (and a sibling .env).
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const CONFIG_NAME = 'seo-blog.config.yaml';

const schema = z.object({
  site: z.object({
    base_url: z.string().default(''),
    article_path_prefix: z.string().default('/blog/'),
  }).default({}),
  supabase: z.object({
    url: z.string().default('${SUPABASE_URL}'),
    project_ref: z.string().default(''),
    table: z.string().default('articles'),
  }).default({}),
  slug: z.object({
    convention: z.enum(['kebab-en', 'thai']).default('kebab-en'),
  }).default({}),
  author: z.object({ name: z.string().default('') }).default({}),
  image: z.object({
    strategy: z.enum(['none', 'default-og', 'html-shot', 'ai']).default('none'),
    og_image_base_url: z.string().default(''),
    in_article_max: z.number().int().default(2),
    storage_bucket: z.string().default('article-images'),
  }).default({}),
  taxonomy: z.object({ whitelist: z.array(z.string()).default([]) }).default({}),
  internal_links: z.object({
    pillars: z.array(z.string()).default([]),
    min_total: z.number().int().default(2),
    min_pillar: z.number().int().default(1),
  }).default({}),
  seo_limits: z.object({
    seo_title_max: z.number().int().default(43),
    seo_description_min: z.number().int().default(70),
    seo_description_max: z.number().int().default(160),
    word_count_min: z.number().int().default(600),
  }).default({}),
  dataforseo: z.object({
    location_code: z.number().int().default(2764),
    language_code: z.string().default('th'),
    enabled: z.boolean().default(true),
  }).default({}),
  audit: z.object({
    check_cwv: z.boolean().default(true),
    cwv_strategy: z.enum(['mobile', 'desktop']).default('mobile'),
    crawl_max: z.number().int().default(50),
  }).default({}),
  voice: z.object({
    audience: z.string().default(''),
    formality: z.enum(['formal', 'neutral', 'casual']).default('neutral'),
    person: z.string().default(''),
    preferred_words: z.array(z.string()).default([]),
    banned_words: z.array(z.string()).default([]),
    sample: z.string().default(''),
    style_notes_path: z.string().default('voice/style-notes.md'),
  }).default({}),
  gsc: z.object({ property: z.string().default('') }).default({}),
  cannibalization: z.object({
    enabled: z.boolean().default(true),
    title_similarity_threshold: z.number().default(0.85),
  }).default({}),
});

// Minimal .env loader (no dependency). Does not override real process.env.
export function loadDotenv(dir = process.cwd()) {
  const p = resolve(dir, '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function resolveEnvPlaceholders(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => process.env[k] ?? '');
  }
  if (Array.isArray(obj)) return obj.map(resolveEnvPlaceholders);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, resolveEnvPlaceholders(v)]));
  }
  return obj;
}

export function configPath(dir = process.cwd()) {
  return resolve(dir, CONFIG_NAME);
}

export function loadConfig(dir = process.cwd()) {
  loadDotenv(dir);
  const p = configPath(dir);
  if (!existsSync(p)) {
    throw new Error(`ไม่พบ ${CONFIG_NAME} ใน ${dir} — รัน skill seo-blog-setup ก่อน`);
  }
  const raw = parse(readFileSync(p, 'utf8')) ?? {};
  const parsed = schema.parse(raw);
  return resolveEnvPlaceholders(parsed);
}

// CLI: --validate
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];
  try {
    const cfg = loadConfig();
    if (arg === '--validate') {
      const issues = [];
      if (!cfg.site.base_url) issues.push('site.base_url ว่าง (audit จะใช้ไม่ได้)');
      if (!cfg.supabase.url) issues.push('supabase.url ว่าง / ${SUPABASE_URL} ไม่ถูก resolve');
      if (cfg.taxonomy.whitelist.length === 0) issues.push('taxonomy.whitelist ว่าง');
      if (cfg.internal_links.pillars.length === 0) issues.push('internal_links.pillars ว่าง');
      if (!cfg.author.name) issues.push('author.name = TBD (writer จะถามตอน runtime)');
      console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2));
      process.exit(0);
    }
    console.log(JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error(`🔴 ${e.message}`);
    process.exit(1);
  }
}
