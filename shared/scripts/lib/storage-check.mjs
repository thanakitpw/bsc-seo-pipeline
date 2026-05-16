// Verify the configured Storage bucket exists (publish ใช้รูป → bucket ต้องมีก่อน).
// Requires Supabase env. Missing bucket = exit 1 (setup เตือนให้สร้าง/แก้ config).
import { createClient } from '@supabase/supabase-js';
import { loadConfig } from './config.mjs';

export async function checkBucket(config) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, reason: 'no-env', vars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] };
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.storage.listBuckets();
  if (error) return { ok: false, reason: 'list-error', message: error.message };
  const want = config.image.storage_bucket;
  const names = (data || []).map((b) => b.name);
  return { ok: names.includes(want), bucket: want, available: names };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const r = await checkBucket(config);
  if (r.ok) {
    console.log(`✅ bucket "${r.bucket}" พร้อม`);
    process.exit(0);
  }
  if (r.reason === 'no-env') {
    console.error(`🔴 ตรวจ bucket ไม่ได้ — ขาด ${r.vars.join(', ')} ใน .env`);
  } else if (r.reason === 'list-error') {
    console.error(`🔴 list buckets ล้มเหลว: ${r.message}`);
  } else {
    console.error(`🔴 ไม่พบ bucket "${r.bucket}" — มีอยู่: ${r.available.join(', ') || '(ไม่มี)'}`);
    console.error('   แก้ image.storage_bucket ใน config ให้ตรง bucket ที่มี หรือสร้าง bucket นี้ (public) ใน Supabase ก่อน publish');
  }
  process.exit(1);
}
