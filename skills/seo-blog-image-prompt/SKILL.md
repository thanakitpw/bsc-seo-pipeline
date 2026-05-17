---
name: seo-blog-image-prompt
description: คิด prompt รูปสำหรับบทความที่เขียนเสร็จ — cover + OG + in-article (ตาม image.in_article_max) พร้อม alt text ไทย + ชื่อไฟล์ที่ publisher รู้จัก (cover/og/01..NN) เขียนลง prompts.md ในโฟลเดอร์บทความ. Trigger "คิด prompt รูป", "image prompt", "ทำ prompt ภาพ", "gen prompt รูปบทความ". ห้ามใช้เขียนบทความ — ใช้ seo-blog-writer; ห้ามใช้ publish — ใช้ seo-blog-publisher.
---

# seo-blog-image-prompt

## Purpose
- ออก prompt รูปต่อ 1 บทความ: **cover** 1, **OG** 1, **in-article** ตาม `config.image.in_article_max` (0 = ปิด)
- ตั้งชื่อไฟล์ที่ publisher map ได้ (`cover.*`, `og.*`, `01.*`..`NN.*`) + alt text ไทย
- ❌ ไม่ generate รูปเอง (ผู้ใช้เอา prompt ไปสร้าง/วาดเอง) ❌ ไม่ publish

## Prerequisite
- มีโฟลเดอร์บทความ `articles/<NN>-<slug>/<NN>-<slug>.md` (จาก seo-blog-writer)
- `seo-blog.config.yaml` valid

## Working Principles
- **Capability banner** ก่อนเริ่ม
- prompt อิง **เนื้อบทความจริง + `config.voice` + `image.strategy`** ไม่ใช่รูปทั่วไป
- 🎨 **ฉีด `config.image.brand` เข้าทุก prompt**: primary/secondary/accent (hex), style, avoid — ให้ภาพทุกบทความเป็นชุด CI เดียวกัน (brand ว่าง → generic ได้ ไม่ฝืน). `font` ใส่เฉพาะ asset ที่มี text (ปกติ prompt = no text in image จึงไม่ค่อยใช้)
- 📐 **ขนาดดึงจากหน้าเว็บจริง**: ถ้า `config.image.sizes.*` ว่าง → รัน `lib/img-size.mjs <article-url>` เอา `og_size` จริงมาใช้ (OG ตามที่เว็บ render จริง), cover/in-article ใช้สัดส่วน 16:9 อิงความกว้าง og; ถ้า config ระบุ size ไว้ → ใช้ตาม config
- in-article: ผูกกับ H2 หลัก (เลือกหัวข้อที่ได้ภาพประกอบจริง ไม่ใส่ครบทุก H2)
- alt text = ไทย อธิบายภาพเพื่อ a11y/SEO ไม่ยัด keyword

## Workflow
1. **Banner**
2. **อ่านบทความ**: โฟลเดอร์ล่าสุด/ที่ระบุ → ดึง H1, H2, ใจความ, voice
3. **กำหนดขนาด**: ถ้า `image.sizes.*` ว่าง → หา URL บทความ published ตัวอย่าง (`publish.mjs --list-slugs` → `site.base_url`+`article_path_prefix`+slug) แล้ว `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/img-size.mjs <url>` → ใช้ `og_size` จริง; ไม่มี slug/เว็บ → fallback OG 1200x630, cover/in-article 1600x900
4. **กำหนดจำนวน**: cover 1 + og 1 + in-article = min(จำนวน H2 ที่เหมาะ, `image.in_article_max`)
5. **เขียน prompt** แต่ละรูป (อังกฤษสำหรับ image model + บริบทไทย) — **ผนวก brand block**: `palette: <primary>,<secondary>,<accent>; style: <style>; avoid: <avoid>` ต่อท้ายทุก prompt → ลง `templates/prompts.md`:
   - filename, ใช้ที่ไหน (cover/og/section), prompt (+brand), alt_th, ขนาดจริง
6. **save** `articles/<NN>-<slug>/prompts.md` ด้วย Write tool
7. แจ้งผู้ใช้: วางไฟล์รูปชื่อตรง `prompts.md` ลงโฟลเดอร์เดียวกัน แล้วค่อย publish
8. ปิดท้าย `🔜 Next: เอารูปใส่โฟลเดอร์ → run seo-blog-publisher`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/prompts.md` | Step 5–6 |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |
| `publish.mjs --list-slugs` + `lib/img-size.mjs` | 3 (ดึงขนาดจากเว็บ) |

## Edge Cases
- `image.strategy: none` → เตือนว่าโปรเจคตั้งใจไม่ใช้รูป; ถามว่าจะทำ prompt ต่อไหม
- `image.in_article_max: 0` → ออกแค่ cover + og
- บทความสั้น/ไม่มี H2 → ออกแค่ cover + og + เตือน

## Usage Example
"คิด prompt รูป" → banner → อ่าน `articles/03-seo-สำหรับ-sme/` → cover+og+2 in-article → เขียน `prompts.md` → บอกวางไฟล์ `cover.png/og.png/01.png/02.png` → `🔜 Next: run seo-blog-publisher`
