---
name: seo-blog-fb-post
description: เขียนแคปชั่น Facebook teaser จากบทความที่ publish แล้ว — hook + value เป็น bullet อิโมจิ + ผลลัพธ์ + CTA "อ่านต่อ" แนบลิงก์บทความ + ช่องทางติดต่อ + hashtags → fb.md ในโฟลเดอร์บทความ. Trigger "เขียนโพสต์ facebook", "fb post", "แคปชั่นแชร์บทความ", "ทำโพสต์เฟส", "repurpose บทความลง fb". ห้ามใช้เขียนบทความ — ใช้ seo-blog-writer; ห้ามใช้ publish DB — ใช้ seo-blog-publisher.
---

# seo-blog-fb-post

## Purpose
- แปลงบทความที่ publish แล้ว → แคปชั่น FB ที่ teaser แล้วชวนกดลิงก์ "อ่านต่อ"
- ❌ ไม่เขียนบทความใหม่ ❌ ไม่ publish DB ❌ ไม่โพสต์เอง (ผู้ใช้ copy ไปโพสต์)

## Prerequisite
- มีบทความ `articles/<NN>-<slug>/<NN>-<slug>.md`
- `site.base_url` + `article_path_prefix` ใน config (ไว้ประกอบลิงก์อ่านต่อ)
- เหมาะรันหลัง publish (บทความ live แล้ว ลิงก์ใช้ได้จริง)

## Working Principles
- **Capability banner** ก่อนเริ่ม
- โทนตาม `config.voice` + `voice/style-notes.md` (เสียงเดียวกับบทความ/แบรนด์)
- humanize: ไม่อ้างวิจัยลอย, ไม่ "555"/"อาทิตย์", เลี่ยงสำนวน AI ซ้ำ, เคารพ `voice.banned_words`
- โครงตาม `references/fb-structure.md` — hook → value bullets → ผลลัพธ์ → CTA+ลิงก์ → ช่องทาง → hashtags
- ลิงก์อ่านต่อ = `site.base_url` + `article_path_prefix` + slug (ตรวจ slug จาก frontmatter)
- ดึงเฉพาะ "ของเด็ด" จากบทความมา teaser — **ห้าม spoil หมด** ต้องเหลือเหตุผลให้กดอ่าน
- `social.channels`/`hashtags` ว่าง → ข้ามบล็อกนั้น (ไม่ใส่ค่าปลอม)

## Workflow
1. **Banner**
2. **เลือกบทความ**: โฟลเดอร์ล่าสุด/ที่ระบุ → อ่าน frontmatter (slug, title_th) + body + voice
3. **ประกอบลิงก์**: `<site.base_url><article_path_prefix><slug>` (ตัด/รวม slash ให้ถูก)
4. **สกัดแก่น**: hook 1 อัน + 3–5 value points (อิโมจินำ) + 1 ผลลัพธ์/บทสรุปสั้น จากเนื้อบทความ
5. **เขียนแคปชั่น** จาก `templates/fb-post.md`:
   - เว้นบรรทัดเป็นจังหวะ (FB อ่านง่าย), อิโมจินำ bullet, ไม่ใส่ markdown (FB ไม่ render)
   - CTA "อ่านบทความฉบับเต็ม 👇" + บรรทัดลิงก์ล้วน
   - **CTA block ตาม pattern บังคับใน `references/fb-structure.md`**: `Inbox : / Line : / Call :` (เว้นวรรคก่อน `:`), บรรทัด `.` spacer, แล้ว hashtags — ช่อง config ว่าง = ตัดทั้งบรรทัด
   - ถ้า `social.max_chars` > 0 → คุมความยาวไม่เกิน
6. **save** `articles/<NN>-<slug>/fb.md` ด้วย Write tool (ผู้ใช้ copy ไปโพสต์เอง)
7. ปิดท้าย `🔜 Next: run seo-blog-audit` (วนรอบถัดไป)

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/fb-post.md` | Step 5–6 |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |

## Edge Cases
- บทความยังไม่ publish (slug อาจ 404) → เตือนว่า ลิงก์จะใช้ได้หลัง publish
- `social.fb_enabled:false` → แจ้งว่าโปรเจคปิด FB repurpose, ถามว่าจะทำต่อไหม
- ไม่มี channels/hashtags → ข้ามบล็อก ไม่เดาเบอร์/ไลน์เอง
- บทความยาว → teaser แค่ 1 มุมที่คมสุด ไม่สรุปทั้งบทความ

## Usage Example
"เขียนโพสต์ facebook" → banner → อ่าน `articles/03-seo-สำหรับ-sme/` → ลิงก์ = base+/blog/seo-สำหรับ-sme → hook + 4 bullets + ผลลัพธ์ + "อ่านต่อ 👇" + ลิงก์ + Inbox/Line + #hashtags → save `fb.md` → `🔜 Next: run seo-blog-audit`
