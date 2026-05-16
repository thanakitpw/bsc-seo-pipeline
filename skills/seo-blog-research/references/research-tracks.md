# research tracks + research file format

## 3 tracks
- **A keyword** — DataForSEO keyword_ideas(seed) + search_volume; seed = pillar/หมวด/บริการ
- **B SERP/PAA** — serp(keyword): organic top 10 (ใครครอง), people_also_ask (intent จริง)
- **C gap** — PAA/competitor ที่ corpus ยังไม่ครอบ = โอกาส

## research file: `research/<date>-<slug>.md`
```md
---
date: 2026-05-16
chosen_slug: seo-สำหรับ-sme
keyword: "seo สำหรับ sme"
volume: 1300            # N/A ถ้า degrade
intent: informational
category: "SEO"          # ต้องอยู่ใน whitelist
pillar: "/services/seo"  # internal-link target
---
## angle
...
## PAA ที่ต้องตอบ
- ...
## คู่แข่งที่ครอง SERP
- ...
## ทำไมไม่ชนของเดิม
- ...
```
