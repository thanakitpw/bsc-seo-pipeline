# site-readiness checks (`audit.mjs --readiness`)

| check | วิธี | sev ถ้าพัง |
|---|---|---|
| pillar URL | HEAD ทุก path ใน `internal_links.pillars` ต้อง 200 | P0 |
| robots.txt | GET; `Disallow: /` = บล็อกทั้งเว็บ | P0 (block-all) / P1 (เข้าไม่ได้) |
| sitemap.xml | GET 200 + มี `article_path_prefix` | P0 (เข้าไม่ได้) / P1 (ไม่มี path) |
| article route | sample 1 slug จาก DB → GET 200 | P0 |
| JSON-LD Article | parse `<script type=ld+json>` หา @type Article | P1 |
| CWV | `psi.mjs` (ถ้ามี key) Perf<80 | P1 / ข้าม = P2 |

pillar พัง = ผลกระทบหนักสุด เพราะ writer บังคับ internal-pillar link → บทความใหม่จะ gate ไม่ผ่านทั้งชุด.
