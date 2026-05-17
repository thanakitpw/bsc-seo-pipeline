---
name: seo-blog-setup
description: ตั้งค่าโปรเจค SEO blog ใหม่ — สร้าง seo-blog.config.yaml (Supabase ref, taxonomy, pillars, author, slug, image, audit, DataForSEO) + แนะนำ .env, เช็ค tool readiness. Trigger "ตั้งค่า seo blog", "setup seo blog", "init blog pipeline", "เริ่มโปรเจค blog". ห้ามใช้ตอนหา topic/เขียน/publish — ใช้ seo-blog-research / seo-blog-writer / seo-blog-publisher.
---

# seo-blog-setup

## Purpose
- สร้าง `seo-blog.config.yaml` ที่ root ของ content-project (generic + ต่อโปรเจค)
- สร้าง `.env` โครงเปล่า (ค่าว่าง ไม่มี secret) + กัน gitignore ให้ — ผู้ใช้แค่เติมค่า key เอง; ถ้ามี `.env` อยู่แล้วห้ามทับ
- เช็ค tool readiness (Supabase required; DataForSEO/PSI optional)
- ❌ ไม่หา topic ❌ ไม่เขียน ❌ ไม่ publish ❌ ไม่ commit secret

## Prerequisite
- รันใน root ของ content-project ปลายทาง (ไม่ใช่ repo plugin-dev)
- plugin ติดตั้งแล้ว (`${CLAUDE_PLUGIN_ROOT}` ใช้ได้)

## Working Principles
- **Capability banner** ก่อนเริ่ม: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/env-check.mjs --banner --soft` — setup เป็น skill เดียวที่ **ไม่ block ตอน Supabase ขาด** (หน้าที่มันคือสร้าง config + แนะนำ .env ก่อนจะมี .env ด้วยซ้ำ)
- ถามผ่าน **AskUserQuestion** ทุกครั้ง ไม่เดาค่า
- มี config อยู่แล้ว → ถามก่อนว่า update / keep (ไม่ทับเงียบ)
- 3 decisions ที่ค้าง (author/image/slug) ถาม runtime → เขียนลง config; ถ้าผู้ใช้ยังไม่ตัดสิน → ปล่อย TBD (`author.name:""`) ให้ writer ถามภายหลัง
- secret อยู่ `.env` เท่านั้น — gitignored, ไม่ echo, ไม่ใส่ใน config
- optional tool ขาด → ถามว่าใส่ตอนนี้ / degrade; degrade → เขียน `dataforseo.enabled:false` หรือ `audit.check_cwv:false`

## Workflow
1. **Banner**: รัน `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/env-check.mjs --banner --soft` — **`--soft` exit 0 เสมอ**. ตอน setup ยังไม่มี `.env` เป็นเรื่องปกติ 🔴 Supabase ที่นี่ = แค่บอกสถานะ **ห้ามหยุด** ทำ Step ต่อไปทันที
2. **ตรวจ config เดิม**: ถ้ามี `seo-blog.config.yaml` → AskUserQuestion {update / keep}
3. **เก็บค่าโครงสร้าง** (AskUserQuestion ทีละกลุ่ม):
   - 3.1 site: `base_url`, `article_path_prefix`
   - 3.2 supabase: `project_ref`, `table` (default `articles`)
   - 3.3 taxonomy `whitelist[]`, internal_links `pillars[]` (path เช่น `/services/seo`)
   - 3.4 decisions: `author.name` (หรือ TBD), `image.strategy`, `slug.convention`
   - 3.5 **cadence** (AskUserQuestion preset): `รายเดือน 12 บทความ` (monthly,12) / `สัปดาห์ละ 3` (weekly,3) / `วันละ 1` (daily,1) / กำหนดเอง → เขียน `cadence.mode`+`cadence.count`
   - 3.6 **research.keywords_per_round** (preset): `5` / `10` / `20` / กำหนดเอง
   - 3.7 dataforseo: `location_code`/`language_code` (default 2764/th)
   - 3.8 voice: `audience`, `formality`, `person`(สรรพนามแบรนด์), `preferred_words[]`, `banned_words[]`, `sample`(1-2 ประโยคน้ำเสียง)
4. **เขียน config**: เอา `templates/seo-blog.config.yaml` เติมค่า (รวม voice) → write ที่ root ด้วย native Write tool
4b. **สร้าง voice/style-notes.md**: ถ้ายังไม่มี → copy `templates/style-notes.md` ไป `voice/style-notes.md` (feedback loop ของ writer)
5. **สร้าง `.env` โครงเปล่า + กัน git**:
   - **ถ้ามี `.env` อยู่แล้ว → ห้ามแตะ/ห้ามทับ** (อาจมี key จริงของผู้ใช้) แค่แจ้งว่ามีแล้ว
   - ถ้ายังไม่มี → Write `.env` จาก `templates/env.example` (ค่าว่างทั้งหมด ไม่มี secret) เติม `SUPABASE_URL` จาก `supabase.project_ref` ให้ (`https://<ref>.supabase.co`) ที่เหลือเว้นว่าง
   - เช็ค `.gitignore` ที่ root: ถ้าไม่มีบรรทัด `.env` → append `.env` ด้วย Edit tool (ถ้าไม่มีไฟล์ `.gitignore` → Write ใหม่ มี `.env`, `node_modules/`, `.cache/`)
   - บอกผู้ใช้ "เปิด `.env` เติม `SUPABASE_SERVICE_ROLE_KEY` (+ `DATAFORSEO_*`/`PSI_API_KEY` ถ้ามี) — ไฟล์ถูก gitignore แล้ว ไม่หลุด repo"
5b. **เช็ค deps ของ plugin**: ถ้า `${CLAUDE_PLUGIN_ROOT}/node_modules` ไม่มี → บอกผู้ใช้รัน `cd "${CLAUDE_PLUGIN_ROOT}" && npm install --omit=dev` (script ทุกตัวพึ่ง deps นี้ ไม่มี = รันไม่ได้)
6. **Tool readiness**: รัน `lib/env-check.mjs --json --soft` (exit 0 เสมอ — รายงานอย่างเดียว ไม่ abort)
   - Supabase ขาด → 🔴 แจ้งว่า "ต้องสร้าง `.env` ใส่ key ก่อนรัน seo-blog-audit/publisher" (setup จบได้ ไม่ต้องรอ .env)
   - DataForSEO/PSI ขาด → AskUserQuestion {ใส่ตอนนี้ / degrade ไปก่อน}; degrade → เขียน flag ลง config (Edit tool)
6b. **เช็ค Storage bucket**: ถ้า Supabase พร้อม → รัน `lib/storage-check.mjs`
   - ไม่พบ bucket → 🔴 แสดง bucket ที่มี, AskUserQuestion {แก้ `image.storage_bucket` ให้ตรง bucket เดิม / จะสร้าง bucket ใหม่เอง} แล้ว Edit config ตามเลือก
   - Supabase ยังไม่พร้อม → ข้าม (เตือนว่าต้องเช็คก่อน publish)
7. **Validate**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/config.mjs --validate` → สรุป ok/issues
8. ปิดท้ายสรุป + `🔜 Next: run seo-blog-audit`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/seo-blog.config.yaml` | Step 4 |
| `templates/style-notes.md` | Step 4b |
| `templates/env.example` | Step 5 |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner / --json` | 1, 6 |
| `lib/storage-check.mjs` | 6b |
| `lib/config.mjs --validate` | 7 |

## Edge Cases
- ไม่ได้อยู่ root ของ content-project (ไม่มี package/route) → เตือนแต่ทำต่อได้
- ผู้ใช้ไม่มี pillar เลย → เตือน writer จะ fail internal-pillar gate; แนะนำใส่อย่างน้อย 1
- รันใน repo plugin-dev → เตือนว่า skill นี้ใช้ที่ content-project ปลายทาง

## Usage Example
ผู้ใช้: "ตั้งค่า seo blog"
→ banner `🔴 Supabase ⚠️ DataForSEO ⚠️ PSI` → ถามค่าโครงสร้าง → เขียน config → บอกใส่ `.env` → degrade DataForSEO ไปก่อน → validate ok → `🔜 Next: run seo-blog-audit`
