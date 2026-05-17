---
name: seo-blog-writer
description: เขียนบทความ SEO ภาษาไทยจาก research/plan → markdown ตาม articles data contract (1×H1, ≥600 คำ, internal link ≥2 incl ≥1 pillar, seo_title≤43, seo_description 70-160) + humanize + pre-gate self-check (warn). save articles/<slug>.md. Trigger "เขียนบทความ blog", "write seo article", "draft บทความ", "เขียน blog". ห้ามใช้ publish — ใช้ seo-blog-publisher; ห้ามใช้หา topic — ใช้ seo-blog-research.
---

# seo-blog-writer

## Purpose
- เขียนบทความไทยตรง data contract + ผ่าน gate ระดับ warn ก่อนส่ง publisher
- ❌ ไม่ publish ❌ ไม่ใส่ค่า DB เอง (publisher ทำ)

## Prerequisite
- `seo-blog.config.yaml` valid
- มี research file (หรือ slot ใน plan) สำหรับ topic นี้

## Working Principles
- **Capability banner** ก่อนเริ่ม
- `author.name`/`image.strategy` = TBD ใน config → AskUserQuestion ตอน runtime แล้ว **เขียนกลับ config** (Edit tool)
- slug ผ่าน `slugify.mjs` ตาม convention — ไม่ตั้งเอง
- **voice**: ยึด `config.voice` (audience/formality/person/preferred/banned/sample) + อ่าน `voice/style-notes.md` ก่อนเขียนทุกครั้ง — เสียงต้องตรงแบรนด์ลูกค้า ไม่ใช่เสียงกลางๆ
- humanize ไทย: ห้ามอ้างงานวิจัยลอยๆ, เลี่ยงสำนวน AI ซ้ำ, ไม่ใช้ "อาทิตย์"(ใช้ "สัปดาห์"), ไม่ "555"
- gate เป็น `--warn` ที่นี่ (ไม่ block) — แก้จน clean ก่อนส่งต่อ
- internal link ต้อง resolve จริง (path มีอยู่) ≥2 และ ≥1 pillar

## Workflow
1. **Banner**
2. **🎯 หา "บทความถัดไป" แบบ deterministic** (สำคัญ — ทำงานข้าม session ได้): ถ้าผู้ใช้ไม่ได้ระบุหัวข้อชัด ให้ไล่ลำดับนี้
   - อ่าน `plans/<เดือนปัจจุบัน>-plan.md` → หา slot แรกที่ status ≠ `done`
   - ข้าม slot ที่มีโฟลเดอร์ `articles/<NN>-<slug>/` อยู่แล้ว และ slug นั้น publish แล้ว (`node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/publish.mjs --list-slugs`)
   - ไม่มี plan/slot ว่าง → ดู `research/_backlog.md` แถว status `backlog` ตัวบนสุด
   - ทั้งคู่ว่าง → หยุด ชี้ไป seo-blog-plan / seo-blog-research
   - ได้ผู้สมัคร → **AskUserQuestion ยืนยัน** "บทความถัดไป = <X> ใช่ไหม / เลือกอื่น" (ไม่เดาเงียบ)
3. **โหลด topic + voice**: อ่าน research file / slot ที่ยืนยัน + `config.voice` + `voice/style-notes.md` (ไม่มีไฟล์ → เตือน setup; ทำต่อด้วย voice จาก config)
4. **เติม TBD**: ถ้า config `author.name`/`image.strategy` ว่าง → AskUserQuestion → Edit config
5. **slug**: ถ้า `slug.convention=kebab-en` → คิด **วลีอังกฤษสั้น** จากหัวข้อ (เช่น "seo tips for sme") ห้ามป้อนหัวข้อไทยตรงๆ (อักษรไทยจะถูกตัดทิ้ง); ถ้า `=thai` → ป้อนหัวข้อไทยได้. รัน `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/slugify.mjs <convention> "<phrase>"` — ถ้าสคริปต์ exit 1/เตือน ให้แก้ input แล้วรันใหม่ (อย่าใช้ slug ที่ไม่ผ่าน)
6. **เลขลำดับ**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/next-num.mjs` → ได้ `NN` (เช่น `03`) — โฟลเดอร์บทความ = `articles/<NN>-<slug>/`
7. **เขียน frontmatter + body** จาก `templates/article.md`:
   - frontmatter: slug, title_th, excerpt_th, category(whitelist), tags, author_name, seo_title(≤max), seo_description(min–max), status: draft
   - **ไม่ต้องใส่ cover_image/og_image** — publisher จะ set จากไฟล์รูปในโฟลเดอร์
   - body: เขียนตาม **`references/structure-th.md`** (มาตรฐาน SEO ไทย) — บังคับ: 1×H1, keyword ใน ~100 คำแรก, H2/H3 เป็นชั้น, **มี bullet/numbered list ≥1 ชุด**, **ห้าม markdown table (ใช้ H3+bullet เทียบแทน — เว็บ render table ไม่ได้)**, **เน้นด้วย `**bold**` เฉพาะคำสำคัญพอประมาณ + callout ใช้ `>`/💡 ; ห้าม ==hl==/<mark>/HTML/สี/ตัวบาง (ดู structure-th.md §2b)**, **แตกย่อหน้าจริงตามจังหวะใน structure-th.md §0 — 1 แนวคิด/ย่อหน้า สั้น 1–3 ประโยค คั่นบรรทัดว่างทุกย่อหน้า**, ตอบ PAA เป็น FAQ, internal link ≥2 แนะนำ 4–5 (≥1 pillar), humanize. รูป in-article `![alt](01.png)` (placeholder ได้)
8. **save** `articles/<NN>-<slug>/<NN>-<slug>.md` ด้วย Write tool (1 โฟลเดอร์ = 1 บทความ ผู้ใช้จะเอารูปมาวางที่นี่)
9. **pre-gate**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/seo-gate.mjs articles/<NN>-<slug>/<NN>-<slug>.md --warn`
10. **loop แก้** จน error = 0 (warning โดยเฉพาะ `voice:` พิจารณาแก้)
11. **review + feedback loop**: ให้ผู้ใช้รีวิวโทน → ถ้าผู้ใช้แก้/ติงเรื่องเสียง → append บรรทัดลง `voice/style-notes.md` ด้วย Edit tool (`- [วันที่] <ผิด> → <แก้เป็น> (slug)`) เพื่อรอบหน้าเรียนรู้
12. ปิดท้าย `🔜 Next: run seo-blog-image-prompt`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/article.md` | Step 5 |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |
| `publish.mjs --list-slugs` | 2 (เช็คว่าอันไหน publish แล้ว) |
| `lib/slugify.mjs` | 5 |
| `lib/next-num.mjs` | 6 |
| `seo-gate.mjs --warn` | 9 |

## Edge Cases
- ไม่มี research/slot → หยุด ชี้ไป seo-blog-research/plan
- pillar ใน config เสีย (audit P0) → เตือนว่า internal-pillar link จะ gate ไม่ผ่าน
- title ยาวเกิน → เขียน `seo_title` สั้นแยกจาก `title_th`
- เนื้อบาง < min → ขยาย ไม่ยัด keyword (กัน thin/spam)

## Usage Example
"เขียนบทความ blog" → banner → โหลด research → author TBD → ถาม → slug `seo-สำหรับ-sme` → เขียน → save → gate --warn (0 error, 1 warn desc สั้น) → แก้ desc → `🔜 Next: run seo-blog-publisher`
