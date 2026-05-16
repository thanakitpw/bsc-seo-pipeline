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
- in-article: ผูกกับ H2 หลัก (เลือกหัวข้อที่ได้ภาพประกอบจริง ไม่ใส่ครบทุก H2)
- ไม่มีตัวอักษรในรูป (กัน localize), อัตราส่วน: cover 16:9, OG 1200×630
- alt text = ไทย อธิบายภาพเพื่อ a11y/SEO ไม่ยัด keyword

## Workflow
1. **Banner**
2. **อ่านบทความ**: โฟลเดอร์ล่าสุด/ที่ระบุ → ดึง H1, H2, ใจความ, voice
3. **กำหนดจำนวน**: cover 1 + og 1 + in-article = min(จำนวน H2 ที่เหมาะ, `image.in_article_max`)
4. **เขียน prompt** แต่ละรูป (อังกฤษสำหรับ image model + บริบทไทย) ลง `templates/prompts.md`:
   - filename, ใช้ที่ไหน (cover/og/section), prompt, alt_th, ขนาด/อัตราส่วน
5. **save** `articles/<NN>-<slug>/prompts.md` ด้วย Write tool
6. แจ้งผู้ใช้: วางไฟล์รูปชื่อตรง `prompts.md` ลงโฟลเดอร์เดียวกัน แล้วค่อย publish
7. ปิดท้าย `🔜 Next: เอารูปใส่โฟลเดอร์ → run seo-blog-publisher`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/prompts.md` | Step 4–5 |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |

## Edge Cases
- `image.strategy: none` → เตือนว่าโปรเจคตั้งใจไม่ใช้รูป; ถามว่าจะทำ prompt ต่อไหม
- `image.in_article_max: 0` → ออกแค่ cover + og
- บทความสั้น/ไม่มี H2 → ออกแค่ cover + og + เตือน

## Usage Example
"คิด prompt รูป" → banner → อ่าน `articles/03-seo-สำหรับ-sme/` → cover+og+2 in-article → เขียน `prompts.md` → บอกวางไฟล์ `cover.png/og.png/01.png/02.png` → `🔜 Next: run seo-blog-publisher`
