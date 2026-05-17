---
name: seo-blog-audit
description: ตรวจ SEO ก่อนเริ่ม research — site-readiness (pillar URL 200, robots, sitemap, article route render, JSON-LD Article, CWV ผ่าน PSI) + blog-content audit (crawl published จาก DB, ตรวจ corpus, cannibalization) จัด P0/P1/P2 เขียน audit/<date>-audit.md. Trigger "audit blog", "ตรวจเว็บก่อนเขียน", "seo audit", "เช็คเว็บพร้อมไหม", "ตรวจ blog". ห้ามใช้หา topic — ใช้ seo-blog-research; ห้ามใช้เขียน — ใช้ seo-blog-writer.
---

# seo-blog-audit

## Purpose
- เป็น **gate ก่อน research** (รันทุกรอบก่อนเริ่ม cycle)
- site-readiness: เว็บจริงพร้อมรับบทความใหม่ไหม
- blog-content: บทความที่ publish ไปแล้วมีปัญหา corpus ไหม
- ❌ ไม่ hard-block (รายงาน + เตือน ผู้ใช้ตัดสิน) ❌ ไม่หา topic ❌ ไม่เขียน

## Prerequisite
- `seo-blog.config.yaml` valid (รัน seo-blog-setup แล้ว)
- Supabase env พร้อม (required) — ไม่งั้น content audit ทำไม่ได้

## Working Principles
- **Capability banner** ก่อนเริ่ม (`env-check.mjs --banner`)
- รายงานอย่างเดียว: `audit.mjs` exit 0 เสมอ — **skill** เป็นคนเตือน ไม่ใช่ script บล็อก
- P0 = ควรแก้ก่อน research (pillar/route/sitemap พัง) → เตือนชัด + ถามผู้ใช้จะไปต่อไหม
- P1/P2 = สรุปให้เห็น ไม่ขวาง flow
- ไม่มี PSI key → ข้าม CWV + warn (ไม่ถือเป็น fail)
- reuse `runGate` (กฎเดียวกับ writer/publisher — ไม่มีกฎซ้อน)

## Workflow
1. **Banner**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/lib/env-check.mjs --banner`. Supabase ขาด → หยุด ชี้ไป setup
1b. **🔄 Reconcile progress**: `publish.mjs --list-slugs` + โฟลเดอร์ `articles/` → slug ที่ publish/มีแล้วแต่ `research/_backlog.md`/`plans/*-plan.md` ยัง status ≠ `done` → Edit เป็น `done` (sync ของเก่าให้ตรงความจริง ทุกต้นรอบ)
2. **รัน audit**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/audit.mjs` (โหมด all) → เขียน `audit/<date>-audit.md`, พิมพ์ P0/P1/P2 count
3. **อ่านรายงาน**: Read `audit/<date>-audit.md` สรุปให้ผู้ใช้แบบเข้าใจง่าย (เรียง P0 ก่อน)
4. **ถ้ามี P0**: อธิบายผลกระทบ (เช่น pillar พัง → writer สร้าง internal link เสีย) → AskUserQuestion {แก้ก่อน / รับทราบแล้วไปต่อ}
5. **ถ้าไม่มี P0**: สรุปสั้น → ไปต่อได้
6. ปิดท้าย `🔜 Next: run seo-blog-research`

## Templates
| file | ใช้ที่ |
|---|---|
| `templates/audit-report.md` | โครงรายงาน (อ้างอิง; `audit.mjs` generate เอง) |

## Scripts
| script | step |
|---|---|
| `lib/env-check.mjs --banner` | 1 |
| `audit.mjs` (`--readiness`/`--content`/all, `--json`) | 2 |

## Edge Cases
- DB ว่าง (ยังไม่มีบทความ) → content audit ข้าม, readiness ยังรันได้ → ปกติสำหรับโปรเจคใหม่
- site.base_url ว่าง → readiness รายงาน P0 ทันที, แนะนำกลับ setup
- เว็บ block bot/HEAD → http.mjs fallback GET; ถ้ายัง 0 → รายงานเป็น P1 reachability
- PSI quota หมด → ข้าม CWV + P2 note ไม่ fail

## Usage Example
ผู้ใช้: "ตรวจเว็บก่อนเขียน"
→ banner → `audit.mjs` → P0:1 (pillar `/services/seo` → 404) P1:0 P2:2 → เตือน + ถาม → ผู้ใช้ "รับทราบ ไปต่อ" → `🔜 Next: run seo-blog-research`
