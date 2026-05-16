# Image Prompts — {{TITLE_TH}}

วางไฟล์รูปชื่อตามตารางลงโฟลเดอร์นี้ แล้วรัน seo-blog-publisher
(publisher จะ upload ขึ้น Supabase Storage + set cover_image/og_image + แทน URL ในเนื้อให้)

| filename | ใช้ที่ | ขนาด | สถานะ |
|---|---|---|---|
| cover.png | cover บทความ | 16:9 (≥1600px) | ⬜ รอรูป |
| og.png | OG/social | 1200×630 | ⬜ รอรูป |
| 01.png | section: {{H2_1}} | 16:9 | ⬜ รอรูป |
| 02.png | section: {{H2_2}} | 16:9 | ⬜ รอรูป |

---

## cover.png
**prompt:** {{COVER_PROMPT}}
**alt (th):** {{COVER_ALT}}

## og.png
**prompt:** {{OG_PROMPT}}
**alt (th):** {{OG_ALT}}

## 01.png — {{H2_1}}
**prompt:** {{IMG1_PROMPT}}
**alt (th):** {{IMG1_ALT}}
**ใส่ในเนื้อ:** `![{{IMG1_ALT}}](01.png)` ใต้หัวข้อ {{H2_1}}

## 02.png — {{H2_2}}
**prompt:** {{IMG2_PROMPT}}
**alt (th):** {{IMG2_ALT}}
**ใส่ในเนื้อ:** `![{{IMG2_ALT}}](02.png)` ใต้หัวข้อ {{H2_2}}
