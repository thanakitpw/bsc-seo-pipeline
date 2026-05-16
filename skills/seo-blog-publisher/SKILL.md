---
name: seo-blog-publisher
description: Publish บทความลง Supabase ตรง (service-role upsert by slug, idempotent) — บังคับผ่าน SEO gate (block) ก่อน upsert, dry-run ยืนยันก่อนจริง. Trigger "publish บทความ", "ลง supabase blog", "ส่งบทความขึ้นเว็บ", "เผยแพร่บทความ". ห้ามใช้เขียน — ใช้ seo-blog-writer; ห้ามใช้หา topic — ใช้ seo-blog-research.
---

# seo-blog-publisher

## Purpose
- ส่งบทความที่ผ่าน gate ลง Supabase `articles` (Option A, idempotent)
- ❌ ไม่เขียน/แก้เนื้อหา ❌ ไม่ publish ถ้า gate error

## Prerequisite
- `seo-blog.config.yaml` valid
- มี draft `articles/<slug>.md`
- `.env`: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (required)

## Working Principles
- **Capability banner** ก่อนเริ่ม — Supabase ขาด → หยุด บอกชื่อ var ที่ต้องใส่ **ไม่ print ค่า key**
- gate `--block`: มี error → abort พิมพ์ rule + ค่า + วิธีแก้ → ชี้กลับ seo-blog-writer
- `--dry-run` เสมอก่อน upsert จริง → ให้ผู้ใช้ยืนยัน
- upsert `onConflict slug` = idempotent (รันซ้ำ id เดิม ไม่สร้างซ้ำ)
- service-role key อยู่ server-side script เท่านั้น ไม่เข้า log/แชร์

## Workflow
1. **Banner**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/env-check.mjs --banner`. Supabase ขาด → หยุด
2. **gate block**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/seo-gate.mjs articles/<slug>.md --block`
   - exit 1 → แสดง error, ชี้กลับ seo-blog-writer, **จบ**
3. **dry-run**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/publish.mjs articles/<slug>.md --dry-run` → แสดง row + warnings
4. **ยืนยัน**: AskUserQuestion {publish จริง / แก้ก่อน}
5. **upsert**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/publish.mjs articles/<slug>.md` → `{id,slug,warnings}`
6. **verify**: แนะนำเช็ค row ใน Supabase + บทความขึ้น sitemap/route (ตามที่ audit ตรวจ)
7. ปิดท้าย `🔜 Next: run seo-blog-audit` (loop รอบถัดไป)

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |
| `seo-gate.mjs --block` | 2 |
| `publish.mjs [--dry-run]` | 3, 5 |

## Edge Cases
- `.env` ขาด → publish.mjs exit 1 บอกชื่อ var (ไม่ echo) → หยุด
- slug ชน DB → gate จับเป็น error (ตั้งใจ — กันทับบทความผิด); ถ้าตั้งใจ update ใช้ slug เดิมจริง
- Supabase error (network/RLS) → แสดง message ไม่ retry เงียบ
- status=published → publish.mjs set `published_at` ISO อัตโนมัติ

## Usage Example
"publish บทความ" → banner ✅ Supabase → gate --block (0 error) → dry-run แสดง row → ผู้ใช้ยืนยัน → upsert `{id:..,slug:seo-สำหรับ-sme}` → แนะนำ verify → `🔜 Next: run seo-blog-audit`
