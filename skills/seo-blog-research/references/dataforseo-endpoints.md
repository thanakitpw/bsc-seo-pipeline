# DataForSEO endpoints ที่ใช้

| cmd | endpoint | คืนอะไร |
|---|---|---|
| `volume <kw...>` | `/keywords_data/google_ads/search_volume/live` | search_volume, cpc, competition |
| `ideas <seed>` | `/dataforseo_labs/google/keyword_ideas/live` | keyword + volume + competition (≤50) |
| `serp <kw>` | `/serp/google/organic/live/advanced` | organic[], people_also_ask[] |

- auth = Basic (`DATAFORSEO_LOGIN:DATAFORSEO_PASSWORD` จาก .env)
- location/language จาก config (`location_code` 2764=TH, `language_code` th)
- cache `.cache/dataforseo/` (sha1 ของ path+payload) กันยิงซ้ำเสีย cost
- ไม่มี cred → exit 2 → skill degrade เป็น WebSearch (ไม่หยุดงาน)
