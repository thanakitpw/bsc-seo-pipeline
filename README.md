# bsc-seo-pipeline

Claude Code marketplace plugin — end-to-end SEO pipeline ที่ publish ตรงลง Supabase (Option A, service-role, idempotent). Generic/portable: ค่าทั้งหมดอยู่ใน per-project `seo-blog.config.yaml` + `.env`. (เริ่มจาก blog content pipeline — ออกแบบให้ขยายครบ SEO ในอนาคต)

## Skills (chain)
setup → audit → research → plan → writer → image-prompt → (ใส่รูป) → publisher → (loop กลับ audit)

| skill | หน้าที่ |
|---|---|
| seo-blog-setup | สร้าง config + แนะนำ .env + tool readiness |
| seo-blog-audit | site-readiness + blog-content audit (P0/P1/P2) |
| seo-blog-research | DataForSEO keyword/SERP + gap + cannibalization |
| seo-blog-plan | content plan รายเดือน (pillar-cluster) |
| seo-blog-writer | เขียนไทยตาม contract → `articles/<NN>-<slug>/` + pre-gate (warn) |
| seo-blog-image-prompt | คิด prompt cover/OG/in-article + alt ไทย → prompts.md |
| seo-blog-publisher | gate (block) → upload รูป Storage → upsert Supabase |

ผู้ใช้วางไฟล์รูป (`cover.png`/`og.png`/`01.png`..) ลงโฟลเดอร์บทความเอง ระหว่าง image-prompt → publisher

## shared/scripts
`seo-gate.mjs` (pure runGate + CLI) · `publish.mjs` (service-role upsert + Storage upload) · `dataforseo.mjs` · `audit.mjs` (reuse runGate) · `psi.mjs` · `lib/{config,md,slugify,http,env-check,next-num,storage-check}.mjs`

## ติดตั้งในโปรเจคอื่น
```
/plugin marketplace add <path>/bsc-seo-pipeline
/plugin install bsc-seo-pipeline@bsc-seo-pipeline-automation
# ใน content-project:
"ตั้งค่า seo blog"        # สร้าง config + .env
"ตรวจเว็บก่อนเขียน"       # audit
"หาเรื่องเขียน blog" → "วาง plan blog เดือนนี้" → "เขียนบทความ blog" → "publish บทความ"
```

## env (.env, gitignored)
required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
optional: `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD`, `PSI_API_KEY`

## dev
```
npm install
npm test
```
