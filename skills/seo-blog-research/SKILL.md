---
name: seo-blog-research
description: หา topic ideas สำหรับ SEO blog — DataForSEO (search volume + keyword ideas + SERP/PAA) + competitor gap + เช็ค cannibalization กับ slug ใน DB. ส่ง 5-10 topic ให้เลือก save research/<date>-<slug>.md. Trigger "หาเรื่องเขียน blog", "research seo topic", "หา keyword บทความ", "หา topic blog". ห้ามใช้วาง calendar — ใช้ seo-blog-plan; ห้ามใช้เขียน — ใช้ seo-blog-writer.
---

# seo-blog-research

## Purpose
- หาหัวข้อบทความที่มี demand + ไม่ชนของเดิม
- 3 tracks: DataForSEO keyword, SERP/PAA, competitor gap
- ❌ ไม่วาง calendar ❌ ไม่เขียนบทความ

## Prerequisite
- `seo-blog.config.yaml` valid
- มี audit report ล่าสุด (`audit/<date>-audit.md`) — ถ้าไม่มี เตือนให้รัน seo-blog-audit ก่อน (ไม่ hard-block)

## Working Principles
- **Capability banner** ก่อนเริ่ม
- DataForSEO ไม่พร้อม (`enabled:false` หรือ exit 2) → degrade เป็น WebSearch qualitative + แจ้งชัดว่าข้อมูล volume ไม่มี
- อ้าง cannibalization findings จาก audit report + `publish.mjs --list-slugs`
- เสนอ topic แล้วให้ผู้ใช้เลือกผ่าน AskUserQuestion ไม่เลือกเอง
- ทุก topic ต้อง map เข้า `taxonomy.whitelist` + pillar อย่างน้อย 1

## Workflow
1. **Banner** + เช็ค audit report ล่าสุด
2. **โหลด corpus**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/publish.mjs --list-slugs` → slug/title เดิม
3. **Track A keyword**: `dataforseo.mjs ideas <seed>` + `volume <kw...>` (seed จาก pillar/หมวด). degrade → WebSearch
4. **Track B SERP/PAA**: `dataforseo.mjs serp <kw>` เก็บ organic top + people_also_ask. degrade → WebSearch
5. **Track C gap**: เทียบ PAA/competitor กับ corpus → หาช่องที่ยังไม่มีบทความ
6. **คัด cannibalization**: ตัด topic ที่ title ใกล้ของเดิม (เทียบ similarity)
7. **จำนวนรอบนี้**: default = `config.research.keywords_per_round` → AskUserQuestion ยืนยัน/เปลี่ยน (preset 5/10/20/กำหนดเอง). เสนอ topic จำนวนนั้น (title, keyword, volume, intent, category, pillar fit, source) → ผู้ใช้เลือกตัวที่จะเขียน (เลือกได้หลายตัว)
8. **เติม backlog**: ถ้าไม่มี `research/_backlog.md` → copy จาก `templates/keyword-backlog.md`. **append ทุก topic ที่เจอรอบนี้** (รวมที่ไม่ได้เลือก) เป็นแถว `status: backlog`; ตัวที่ผู้ใช้เลือก → มาร์คแถวนั้น `status: planned`; ที่ผู้ใช้ปัดทิ้ง → `skip` (ใช้ Edit tool, อย่าทับของเดิม — เช็ค keyword ซ้ำก่อน append)
9. **บันทึกที่เลือก**: เขียน `research/<date>-<slug>.md` (โครงใน references) เฉพาะ topic ที่เลือก
10. ปิดท้าย `🔜 Next: run seo-blog-plan`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/keyword-backlog.md` | Step 8 (สร้าง `research/_backlog.md` ครั้งแรก) |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |
| `publish.mjs --list-slugs` | 2, 6 |
| `dataforseo.mjs ideas/volume/serp` | 3, 4 |

## Edge Cases
- DataForSEO quota/credential หาย → degrade WebSearch, ระบุใน research file ว่า volume = N/A
- corpus ว่าง → ข้าม cannibalization, เน้น pillar coverage
- ทุก topic ชนของเดิม → เสนอ angle ใหม่ / อัปเดตบทความเก่าแทน (แจ้งผู้ใช้)

## Usage Example
"หาเรื่องเขียน blog" → banner → list-slugs → ideas "รับทำ seo" → serp + PAA → เสนอ 8 topic → ผู้ใช้เลือก 1 → เขียน `research/2026-05-16-seo-สำหรับ-sme.md` → `🔜 Next: run seo-blog-plan`
