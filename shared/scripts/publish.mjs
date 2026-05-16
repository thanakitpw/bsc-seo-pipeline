// Idempotent service-role upsert into Supabase `articles` (Option A).
// SERVICE_ROLE_KEY lives ONLY in the project .env (gitignored). Never printed.
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import { loadConfig } from './lib/config.mjs';
import { runGate } from './seo-gate.mjs';
import { wordCount } from './lib/md.mjs';

const AUTO_COLS = ['id', 'created_at', 'updated_at'];

function client(config) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('🔴 ขาด env: ' + ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !process.env[k]).join(', ') + ' — ใส่ใน .env (gitignored) ก่อน');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function listSlugs(config) {
  const sb = client(config);
  const { data, error } = await sb.from(config.supabase.table).select('slug,title_th');
  if (error) throw new Error(error.message);
  return data || [];
}

function rowFromFile(path, config) {
  const { data: fm, content } = matter(readFileSync(path, 'utf8'));
  const row = { ...fm };
  for (const c of AUTO_COLS) delete row[c];
  row.body_md_th = content.trim();
  if (!row.status) row.status = 'draft';
  if (row.status === 'published' && !row.published_at) row.published_at = new Date().toISOString();
  if (!row.reading_time) row.reading_time = Math.max(1, Math.round(wordCount(content) / 200));
  if (!row.author_name && config.author.name) row.author_name = config.author.name;
  return { row, fm, content };
}

export async function publish(path, config, { dryRun = false } = {}) {
  const sb = client(config);
  const { row, fm, content } = rowFromFile(path, config);

  // Defense-in-depth: never upsert ungated content.
  const existing = await listSlugs(config);
  const others = existing.filter((e) => e.slug !== row.slug);
  const gate = runGate({
    frontmatter: fm, body: content, config,
    existingSlugs: others.map((e) => e.slug),
    existingTitles: others.map((e) => e.title_th).filter(Boolean),
  });
  if (gate.errors.length) {
    const err = new Error('SEO gate ไม่ผ่าน:\n' + gate.errors.map((e) => '  🔴 ' + e).join('\n'));
    err.gate = gate;
    throw err;
  }

  if (dryRun) return { dryRun: true, row, warnings: gate.warnings };

  const { data, error } = await sb
    .from(config.supabase.table)
    .upsert(row, { onConflict: 'slug' })
    .select('id,slug')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, slug: data.slug, warnings: gate.warnings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const config = loadConfig();
  (async () => {
    try {
      if (args.includes('--list-slugs')) {
        console.log(JSON.stringify(await listSlugs(config), null, 2));
        return;
      }
      const file = args.find((a) => !a.startsWith('--'));
      if (!file) { console.error('usage: publish.mjs <file.md> [--dry-run] | --list-slugs'); process.exit(2); }
      const res = await publish(file, config, { dryRun: args.includes('--dry-run') });
      console.log(JSON.stringify(res, null, 2));
    } catch (e) {
      console.error(`🔴 ${e.message}`);
      process.exit(1);
    }
  })();
}
