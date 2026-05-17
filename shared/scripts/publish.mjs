// Idempotent service-role upsert into Supabase `articles` (Option A).
// SERVICE_ROLE_KEY lives ONLY in the project .env (gitignored). Never printed.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, basename, extname } from 'node:path';
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

const IMG_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

// pure: role ของไฟล์รูปจากชื่อ (cover/og/in-article) — ชื่ออื่น = ถือเป็น cover
export function imageRole(file) {
  const stem = basename(file, extname(file)).toLowerCase();
  if (stem === 'cover') return { role: 'cover' };
  if (stem === 'og') return { role: 'og' };
  const n = stem.match(/^(\d{1,3})$/);
  if (n) return { role: 'in-article', idx: parseInt(n[1], 10) };
  return { role: 'cover', assumed: true };
}

// pure: ชื่อ object บน Storage แบบ SEO (slug-รวม-keyword + role, ตัวเล็ก, ขีดกลาง)
export function seoObjectName(slug, role, idx, ext) {
  if (role === 'og') return `${slug}-og${ext}`;
  if (role === 'in-article') return `${slug}-${String(idx).padStart(2, '0')}${ext}`;
  return `${slug}-cover${ext}`;
}

async function loadSharp() {
  try { return (await import('sharp')).default; } catch { return null; }
}

// Upload + (optional) webp convert + SEO rename → {byFile, cover, og, inArticle, warnings}
async function uploadImages(folder, slug, sb, config) {
  const bucket = config.image.storage_bucket;
  const out = { byFile: {}, cover: null, og: null, inArticle: [], warnings: [] };
  if (!existsSync(folder)) return out;
  const imgs = readdirSync(folder).filter((f) => IMG_EXT[extname(f).toLowerCase()]);
  const wantWebp = config.image.convert !== false && (config.image.format || 'webp') === 'webp';
  const sharp = wantWebp ? await loadSharp() : null;
  if (wantWebp && !sharp) out.warnings.push('image.convert=true แต่ไม่พบ sharp — อัปโหลดไฟล์เดิม (รัน `npm install` ใน plugin เพื่อแปลง webp)');
  let coverDone = false;
  for (const f of imgs.sort()) {
    let buf = readFileSync(`${folder}/${f}`);
    let ext = extname(f).toLowerCase();
    let ct = IMG_EXT[ext];
    if (sharp && ext !== '.webp' && ext !== '.gif') {
      buf = await sharp(buf).webp({ quality: 82 }).toBuffer();
      ext = '.webp'; ct = 'image/webp';
    }
    const r = imageRole(f);
    if (r.role === 'cover' && coverDone) { out.warnings.push(`"${f}" ชื่อไม่ชัดและมี cover แล้ว — ข้าม (ตั้งชื่อ cover.* / og.* / 01.*)`); continue; }
    const obj = `${slug}/${seoObjectName(slug, r.role, r.idx, ext)}`;
    const { error } = await sb.storage.from(bucket).upload(obj, buf, { contentType: ct, upsert: true });
    if (error) throw new Error(`storage upload ${obj}: ${error.message}`);
    const url = sb.storage.from(bucket).getPublicUrl(obj).data.publicUrl;
    out.byFile[f] = url;
    if (r.role === 'cover') { out.cover = url; coverDone = true; if (r.assumed) out.warnings.push(`"${f}" ไม่มี role ชัด → ใช้เป็น cover`); }
    else if (r.role === 'og') out.og = url;
    else out.inArticle.push({ idx: r.idx, url });
  }
  return out;
}

export function findByStem(map, stem) {
  const k = Object.keys(map).find((f) => basename(f, extname(f)).toLowerCase() === stem);
  return k ? map[k] : null;
}

// Rewrite relative image refs in markdown body to their uploaded public URLs.
export function rewriteBodyImages(body, map) {
  return body.replace(/!\[([^\]]*)\]\((\.\/)?([^)\/]+\.(?:png|jpe?g|webp|gif))\)/gi,
    (m, alt, _dot, file) => (map[file] ? `![${alt}](${map[file]})` : m));
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

  const folder = dirname(path);
  const localImgs = existsSync(folder)
    ? readdirSync(folder).filter((f) => IMG_EXT[extname(f).toLowerCase()])
    : [];

  if (dryRun) {
    return { dryRun: true, row, images_to_upload: localImgs, warnings: gate.warnings };
  }

  // Upload (+webp+SEO rename) then map URLs into the row + body.
  const up = await uploadImages(folder, row.slug, sb, config);
  if (up.cover && !row.cover_image) row.cover_image = up.cover;
  if (up.og && !row.og_image) row.og_image = up.og;
  if (!row.og_image && up.cover) row.og_image = up.cover; // og ไม่มี → ใช้ cover แทน
  if (Object.keys(up.byFile).length) row.body_md_th = rewriteBodyImages(row.body_md_th, up.byFile);
  gate.warnings.push(...up.warnings);

  const { data, error } = await sb
    .from(config.supabase.table)
    .upsert(row, { onConflict: 'slug' })
    .select('id,slug')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, slug: data.slug, images: Object.keys(up.byFile), warnings: gate.warnings };
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
