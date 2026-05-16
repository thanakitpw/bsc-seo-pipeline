# voice + feedback loop

## ก่อนเขียน — โหลด voice
1. `config.voice`: audience, formality, person (สรรพนาม), preferred_words, banned_words, sample
2. `voice/style-notes.md`: do/don't + บันทึก feedback สะสม
ปรับน้ำเสียง/คำ ให้ตรงทั้งสองก่อนลงมือ ไม่ใช้เสียงกลางๆ default

## gate voice check (warn-only, ใน seo-gate.mjs)
- `config.voice.banned_words` เจอในเนื้อ/หัว/desc → warn
- AI-pattern ไทยซ้ำ ≥2 แบบ → warn
- "อาทิตย์" (เวลา) → warn (ใช้ "สัปดาห์")
ไม่ block — โทน subjective; ผู้เขียนตัดสินใจแก้

## หลังเขียน — feedback loop
ผู้ใช้ติง/แก้โทน → append 1 บรรทัดลง `voice/style-notes.md`:
`- [2026-05-16] เป็นทางการเกิน → ใช้ "เรา" แทน "บริษัทฯ" (slug: seo-สำหรับ-sme)`
รอบถัดไป writer อ่านก่อนเขียน = เรียนรู้สะสม ไม่ลืม
