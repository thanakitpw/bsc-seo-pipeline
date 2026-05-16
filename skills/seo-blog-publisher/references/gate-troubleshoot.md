# gate error → วิธีแก้ (ชี้กลับ seo-blog-writer)

| error | แก้ |
|---|---|
| seo_title len > max | เขียน `seo_title` สั้นแยกจาก `title_th` |
| seo_description > max | ตัดให้ ≤ max |
| slug ผิด convention | ใช้ `slugify.mjs` ตาม convention |
| slug ชน DB | ตั้งใจ update? ใช้ slug เดิมจริง : เปลี่ยน slug ใหม่ |
| H1 ≠ 1 | ให้มี `#` เดียว เป็นชื่อบทความ |
| internal links < min | เพิ่ม link ภายใน, ≥1 ไป pillar |
| word count < min | ขยายเนื้อให้ครบ intent (ไม่ยัดน้ำ/keyword) |
| category ไม่อยู่ whitelist | แก้ให้ตรง taxonomy ใน config |

warning (cannibalization/heading order/desc สั้น) ไม่ block — พิจารณาแก้เพื่อคุณภาพ.
