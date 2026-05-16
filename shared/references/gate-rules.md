# SEO gate rules (บังคับใน `seo-gate.mjs`)

ค่าทั้งหมดอ้างจาก `seo-blog.config.yaml` (ปรับต่อโปรเจคได้ แต่ห้ามหลวมกว่า data contract).

| rule | condition | severity |
|---|---|---|
| seo_title len | มี → ≤ seo_title_max; ไม่มี → title_th ≤ seo_title_max | error |
| seo_description len | min–max | error > max / warn < min / warn ว่าง |
| slug | ตรง convention (kebab-en regex / thai URL-safe) + ไม่ชน DB | error |
| body H1 | มี `#` เดียว | error |
| heading order | ไม่ข้ามชั้น | warn |
| internal links | ≥ min_total internal, ≥ min_pillar ตรง pillar | error |
| word count | ไทย ≥ word_count_min (Intl.Segmenter, fallback char/2.5) | error |
| category | ∈ taxonomy.whitelist | error |
| cannibalization | title similarity > threshold เทียบ corpus | warn |

โหมด CLI: `--block` (exit 1 ถ้ามี error) · `--warn` (exit 0 เสมอ) · `--json`. `runGate()` เป็น pure fn — writer/publisher/audit ใช้ตัวเดียวกัน ไม่ duplicate กฎ.
