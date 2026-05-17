---
name: seo-blog-plan
description: วาง content plan รายเดือนสำหรับ SEO blog — slot ตาม cadence + pillar-cluster ratio + map slot→keyword+category+internal-link target จาก research backlog. เขียน plans/<YYYY-MM>-plan.md. Trigger "วาง plan blog เดือนนี้", "content calendar seo", "วางแผนบทความเดือน", "plan blog". ห้ามใช้หา topic — ใช้ seo-blog-research; ห้ามใช้เขียน — ใช้ seo-blog-writer.
---

# seo-blog-plan

## Purpose
- จัด research backlog ลงปฏิทินรายเดือน
- คุมสัดส่วน pillar-cluster + cadence
- ❌ ไม่หา topic ❌ ไม่เขียน

## Prerequisite
- `seo-blog.config.yaml` valid
- มี research file ≥1 (`research/*.md`)

## Working Principles
- **Capability banner** ก่อนเริ่ม
- 🔒 **ถาม cadence (กี่บทความ) ก่อนเสมอ** — แม้ config มีค่าแล้วก็ต้อง AskUserQuestion ยืนยัน/override เดือนนี้ ห้ามคำนวณ slot เงียบจาก default
- ทุก slot ผูก keyword + category (whitelist) + internal-link target (≥1 pillar)
- breaking/ด่วน = **add slot ไม่ swap** ของเดิม
- ไม่ผลิตเกิน backlog ที่มี — ขาด → ชี้กลับ seo-blog-research

## Workflow
1. **Banner**
1b. **🔄 Reconcile (self-heal ของเก่า)**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/publish.mjs --list-slugs` + ดูโฟลเดอร์ `articles/<NN>-<slug>/` → slug ไหนที่ publish/มีอยู่แล้ว แต่ใน `research/_backlog.md` หรือ `plans/*-plan.md` ยัง status ≠ `done` → Edit เป็น `done` (sync ไฟล์ให้ตรงความจริงก่อนวางแผนต่อ — ของเก่าก่อน v0.1.12 จะถูกแก้ให้เองรอบนี้)
2. **โหลด backlog**: อ่าน `research/_backlog.md` (แหล่งหลัก — เอาแถว `status: backlog`) + `research/*.md` ที่ยังไม่ถูก plan
3. **cadence**: อ่าน `config.cadence` (mode+count) → AskUserQuestion ยืนยัน/override เดือนนี้ (preset รายเดือน12 / สัปดาห์3 / วันละ1 / กำหนดเอง)
4. **คำนวณ slot/เดือน**: monthly → `count` · weekly → `round(count*30/7)` · daily → `count*30` (ปัดตามจำนวนวันจริงของเดือนได้)
5. **จัดสัดส่วน pillar-cluster**: กระจาย topic ตาม pillar (อ้าง references)
6. **map slot**: แต่ละ slot = {วันที่, research file/keyword, category, internal-link targets ≥1 pillar}
7. **เขียน** `plans/<YYYY-MM>-plan.md` จาก template ด้วย Write tool
8. **มาร์ค backlog**: แถวใน `research/_backlog.md` ที่ลง slot แล้ว → เปลี่ยน `status` เป็น `planned` (Edit tool) กันหยิบซ้ำเดือนหน้า
9. ปิดท้าย `🔜 Next: run seo-blog-writer`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/monthly-plan.md` | Step 7 |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |

## Edge Cases
- backlog < slot → เติมเท่าที่มี + เตือนให้ research เพิ่ม
- ไม่มี research เลย → หยุด ชี้ไป seo-blog-research
- เดือนนี้ plan แล้ว → ถาม update / เดือนถัดไป

## Usage Example
"วาง plan blog เดือนนี้" → banner → backlog 12 → cadence 2/สัปดาห์ → 8 slot → map pillar 50/30/20 → เขียน `plans/2026-06-plan.md` → `🔜 Next: run seo-blog-writer`
