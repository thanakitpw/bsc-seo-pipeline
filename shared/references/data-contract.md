# Data contract — ตาราง `articles` (read-only knowledge)

Source of truth = `06-content-pipeline-architecture.md` ของ content-project. plugin อ้างอิงแบบ read-only — schema/migration เป็นเจ้าของโดย repo เว็บหลัก.

| column | type | required | หมายเหตุ |
|---|---|---|---|
| `slug` | text | ✅ unique | ตาม `slug.convention` ใน config |
| `title_th` | text | ✅ | KW-front |
| `title_en` | text | – | เว้นได้ |
| `excerpt_th` | text | ควรมี | meta desc fallback |
| `body_md_th` | text | ✅ | Markdown, 1×H1 |
| `cover_image` | text | – | URL |
| `category` | text | ✅ | ตรง `taxonomy.whitelist` |
| `tags` | text[] | – | default `{}` |
| `author_name` | text | – | จาก `author.name` |
| `reading_time` | int | – | คำนวณ ~words/200 |
| `published_at` | timestamptz | set เมื่อ publish | ISO |
| `status` | enum | ✅ | draft\|published\|archived |
| `seo_title` | text | ควรมี | ≤ `seo_limits.seo_title_max` |
| `seo_description` | text | ควรมี | ≤ `seo_limits.seo_description_max` |
| `og_image` | text | – | ใช้ก่อน cover_image |
| `id/created_at/updated_at` | – | auto | **อย่าส่ง** |

RLS: anon SELECT เฉพาะ `status='published'`. เขียนต้อง service-role (server-side). upsert `onConflict: slug` = idempotent.
