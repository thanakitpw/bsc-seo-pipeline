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
- มีโฟลเดอร์บทความ `articles/<NN>-<slug>/<NN>-<slug>.md`
- (ถ้ามีรูป) ผู้ใช้วาง `cover.*`, `og.*`, `01.*`..`NN.*` ในโฟลเดอร์เดียวกันแล้ว
- `.env`: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (required)

## Working Principles
- **Capability banner** ก่อนเริ่ม — Supabase ขาด → หยุด บอกชื่อ var ที่ต้องใส่ **ไม่ print ค่า key**
- gate `--block`: มี error → abort พิมพ์ rule + ค่า + วิธีแก้ → ชี้กลับ seo-blog-writer
- `--dry-run` เสมอก่อน upsert จริง → ให้ผู้ใช้ยืนยัน
- upsert `onConflict slug` = idempotent (รันซ้ำ id เดิม ไม่สร้างซ้ำ)
- **รูป (อัตโนมัติใน publish.mjs)**: ทุกรูปในโฟลเดอร์ → แปลง **webp** (ถ้า `image.convert` + มี sharp) → **rename เป็นชื่อ SEO** `<slug>-cover.webp` / `<slug>-og.webp` / `<slug>-NN.webp` → upload `config.image.storage_bucket` path `<slug>/...` (upsert) → set `cover_image`/`og_image` (og ไม่มี → ใช้ cover แทน) → แทน `![](ไฟล์)` ในเนื้อเป็น public URL
- **role จากชื่อไฟล์**: `cover.*`→cover · `og.*`→og · `01.*`/`02.*`→in-article · ชื่ออื่น → ถือเป็น cover + เตือน
- **OG = jpg/png เสมอ** (Facebook/LINE มัก render webp OG ไม่ขึ้น): cover/in-article แปลง webp ได้ แต่ og เก็บเป็น jpg/png; ไม่มีไฟล์ og แยก → publisher สร้าง og จาก cover เป็น jpg ให้ → set `og_image`
- หลัง publish: ถ้าเคยแชร์ URL นี้มาก่อน FB cache OG เก่า → ต้อง re-scrape ใน **Facebook Sharing Debugger** (`developers.facebook.com/tools/debug`) แปะ URL กด "Scrape Again"
- alt text รูปในเนื้อ = ข้อความใน `![alt](..)` ที่ writer/ผู้ใช้ใส่ (สำคัญต่อ SEO/a11y — ให้สื่อภาพจริง)
- service-role key อยู่ server-side script เท่านั้น ไม่เข้า log/แชร์

## Workflow
1. **Banner**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/env-check.mjs --banner`. Supabase ขาด → หยุด
2. **gate block**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/seo-gate.mjs articles/<NN>-<slug>/<NN>-<slug>.md --block`
   - exit 1 → แสดง error, ชี้กลับ seo-blog-writer, **จบ**
3. **dry-run**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/publish.mjs articles/<NN>-<slug>/<NN>-<slug>.md --dry-run` → แสดง row + `images_to_upload`
4. **ยืนยัน**: AskUserQuestion {publish จริง / แก้ก่อน} — ถ้ายังไม่ใส่รูปแต่อยากมีรูป เตือนก่อน
5. **upsert**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/publish.mjs articles/<NN>-<slug>/<NN>-<slug>.md` → upload รูป + `{id,slug,images,warnings}`
6. **มาร์ค progress (สำคัญ — ให้ session ใหม่รู้ว่าทำถึงไหน)**: publish สำเร็จ → Edit
   - `research/_backlog.md`: แถว slug นี้ → `status: done`
   - `plans/<เดือน>-plan.md`: slot ของ slug นี้ → `status: done` (ถ้ามี plan)
7. **verify**: แนะนำเช็ค row + รูปใน Storage + บทความขึ้น sitemap/route
8. ปิดท้าย `🔜 Next: run seo-blog-fb-post` (ทำแคปชั่นแชร์ FB) → แล้ว `seo-blog-audit` (loop รอบถัดไป)

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
