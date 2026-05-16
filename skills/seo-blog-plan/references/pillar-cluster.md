# pillar-cluster model

- **pillar** = เพจบริการหลัก (`internal_links.pillars`) — บทความ cluster ลิงก์เข้าเสมอ
- **cluster** = บทความ topic ย่อยที่ตอบ intent รอบ pillar เดียวกัน
- กระจาย slot ตามน้ำหนัก pillar (เช่น SEO 50% / Paid Ads 30% / อื่น 20%) — ปรับตามเป้าธุรกิจ
- แต่ละบทความ: internal link ≥ `min_total`, ไป pillar ≥ `min_pillar` (gate บังคับ)
- breaking = add slot เพิ่ม ไม่ดึง slot เดิมออก (กัน backlog เลื่อนรัว)
