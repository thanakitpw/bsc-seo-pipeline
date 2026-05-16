import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { loadConfig } from '../shared/scripts/lib/config.mjs';

let dir;
const cwd0 = process.cwd();

before(() => {
  dir = mkdtempSync(resolve(tmpdir(), 'bscseo-'));
  writeFileSync(resolve(dir, 'seo-blog.config.yaml'),
    'site: { base_url: "https://e.com", article_path_prefix: "/blog/" }\n' +
    'supabase: { url: "${SUPABASE_URL}", project_ref: "ref", table: "articles" }\n' +
    'taxonomy: { whitelist: ["SEO"] }\n' +
    'internal_links: { pillars: ["/services/seo"] }\n' +
    'voice: { banned_words: ["555"] }\n');
  writeFileSync(resolve(dir, '.env'), 'SUPABASE_URL=https://from-dotenv.supabase.co\n');
  process.chdir(dir);
});

after(() => {
  process.chdir(cwd0);
  rmSync(dir, { recursive: true, force: true });
});

test('loadConfig applies zod defaults', () => {
  const c = loadConfig();
  assert.equal(c.slug.convention, 'kebab-en');
  assert.equal(c.seo_limits.seo_title_max, 43);
  assert.equal(c.audit.crawl_max, 50);
});

test('loadConfig resolves ${SUPABASE_URL} from .env', () => {
  const c = loadConfig();
  assert.equal(c.supabase.url, 'https://from-dotenv.supabase.co');
});

test('loadConfig keeps provided values', () => {
  const c = loadConfig();
  assert.deepEqual(c.taxonomy.whitelist, ['SEO']);
  assert.deepEqual(c.voice.banned_words, ['555']);
});

test('loadConfig throws when config missing', () => {
  const empty = mkdtempSync(resolve(tmpdir(), 'bscseo-empty-'));
  process.chdir(empty);
  assert.throws(() => loadConfig(), /seo-blog\.config\.yaml/);
  process.chdir(dir);
  rmSync(empty, { recursive: true, force: true });
});
