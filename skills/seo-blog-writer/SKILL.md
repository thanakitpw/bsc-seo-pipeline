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
2. **โหลด topic + voice**: อ่าน research file / slot + `config.voice` + `voice/style-notes.md` (ถ้าไม่มีไฟล์ → เตือนให้รัน seo-blog-setup; ทำต่อด้วย voice จาก config)
3. **เติม TBD**: ถ้า config `author.name`/`image.strategy` ว่าง → AskUserQuestion → Edit config
4. **slug**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/slugify.mjs <convention> "<title-en/th>"`
5. **เขียน frontmatter + body** จาก `templates/article.md`:
   - frontmatter: slug, title_th, excerpt_th, category(whitelist), tags, author_name, seo_title(≤max), seo_description(min–max), og_image/cover ตาม strategy, status: draft
   - body: 1×H1, heading เป็นชั้น, ไทย ≥ word_count_min, internal link ≥2 (≥1 pillar), humanize
6. **save** `articles/<slug>.md` ด้วย Write tool
7. **pre-gate**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/seo-gate.mjs articles/<slug>.md --warn`
8. **loop แก้** จน error = 0 (warning โดยเฉพาะ `voice:` พิจารณาแก้)
9. **review + feedback loop**: ให้ผู้ใช้รีวิวโทน → ถ้าผู้ใช้แก้/ติงเรื่องเสียง → append บรรทัดลง `voice/style-notes.md` ด้วย Edit tool (`- [วันที่] <ผิด> → <แก้เป็น> (slug)`) เพื่อรอบหน้าเรียนรู้
10. ปิดท้าย `🔜 Next: run seo-blog-publisher`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/article.md` | Step 5 |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |
| `lib/slugify.mjs` | 4 |
| `seo-gate.mjs --warn` | 7 |

## Edge Cases
- ไม่มี research/slot → หยุด ชี้ไป seo-blog-research/plan
- pillar ใน config เสีย (audit P0) → เตือนว่า internal-pillar link จะ gate ไม่ผ่าน
- title ยาวเกิน → เขียน `seo_title` สั้นแยกจาก `title_th`
- เนื้อบาง < min → ขยาย ไม่ยัด keyword (กัน thin/spam)

## Usage Example
"เขียนบทความ blog" → banner → โหลด research → author TBD → ถาม → slug `seo-สำหรับ-sme` → เขียน → save → gate --warn (0 error, 1 warn desc สั้น) → แก้ desc → `🔜 Next: run seo-blog-publisher`
