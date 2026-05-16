# blog-content checks (`audit.mjs --content`)

- ดึง published ทั้งหมดจาก DB (`publish.mjs` listSlugs) — จำกัด `audit.crawl_max`
- crawl แต่ละ article URL: reachable? มี JSON-LD Article?
- corpus cannibalization: เทียบ title ทุกคู่ด้วย `runGate` (similarity > threshold = warn → P2)

หมายเหตุ: gate ระดับ field (seo_title/desc/H1/word) ถูกบังคับตอน publish อยู่แล้ว — content audit เน้น **ปัญหาที่เกิดหลัง publish / ข้ามบทความ** (route ตาย, schema หาย, แข่งกันเอง) ที่ gate ตอนเขียนมองไม่เห็น.
