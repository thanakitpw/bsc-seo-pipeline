# config-fields — คำอธิบายทีละ field

- **site.base_url** — origin เว็บจริง audit ใช้ยิง pillar/robots/sitemap/article route
- **site.article_path_prefix** — path บทความ (ต่อ slug = URL บทความ)
- **supabase.project_ref** — ref ของ Supabase project (ใช้ในเอกสาร/ตรวจสอบ ไม่ใช่ secret)
- **supabase.table** — ปกติ `articles`
- **slug.convention** — `kebab-en` (แนะนำ อ่าน log/แชร์ง่าย) หรือ `thai`
- **author.name** — `""` = TBD; writer จะถามตอน runtime แล้วเขียนกลับ config
- **image.strategy** — `none` (ไม่ใส่รูป) / `default-og` / `html-shot` / `ai`
- **taxonomy.whitelist** — หมวดที่ตรง taxonomy เว็บจริง (gate บังคับ)
- **internal_links.pillars** — path เพจ pillar; writer ต้องลิงก์ไปอย่างน้อย `min_pillar`
- **seo_limits** — มิเรอร์ data contract; ปรับเข้มได้ ห้ามหลวมกว่า
- **dataforseo.enabled:false** — ตั้งใจ degrade → env-check ไม่ flag ว่าขาด
- **audit.check_cwv:false** — ข้าม PSI; `crawl_max` กันยิงเว็บหนักเกิน
- **cannibalization.title_similarity_threshold** — สูง = เข้มน้อย (0.85 = ค่าเริ่ม)

secret (`SUPABASE_SERVICE_ROLE_KEY`, `DATAFORSEO_*`, `PSI_API_KEY`) อยู่ `.env` เท่านั้น ไม่เข้า config นี้.
