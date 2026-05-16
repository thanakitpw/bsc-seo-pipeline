// Shared test config — mirrors loadConfig() output shape (post zod defaults).
export function cfg(over = {}) {
  return {
    site: { base_url: 'https://example.com', article_path_prefix: '/blog/' },
    supabase: { url: 'https://x.supabase.co', project_ref: 'x', table: 'articles' },
    slug: { convention: 'kebab-en' },
    author: { name: 'ทีม Best Solutions' },
    image: { strategy: 'none', og_image_base_url: '' },
    taxonomy: { whitelist: ['SEO', 'Paid Ads'] },
    internal_links: { pillars: ['/services/seo'], min_total: 2, min_pillar: 1 },
    seo_limits: { seo_title_max: 43, seo_description_min: 70, seo_description_max: 160, word_count_min: 50 },
    dataforseo: { location_code: 2764, language_code: 'th', enabled: false },
    audit: { check_cwv: false, cwv_strategy: 'mobile', crawl_max: 10 },
    voice: { audience: '', formality: 'neutral', person: '', preferred_words: [], banned_words: ['555', 'ปัง'], sample: '', style_notes_path: 'voice/style-notes.md' },
    gsc: { property: '' },
    cannibalization: { enabled: true, title_similarity_threshold: 0.85 },
    ...over,
  };
}

export const goodFm = {
  slug: 'seo-for-sme',
  title_th: 'คู่มือ SEO สำหรับธุรกิจ SME',
  excerpt_th: 'เริ่มทำ SEO',
  category: 'SEO',
  seo_title: 'คู่มือ SEO สำหรับ SME',
  seo_description: 'คู่มือเริ่มต้นทำ SEO สำหรับธุรกิจ SME ตั้งแต่พื้นฐานจนถึงการวัดผล เข้าใจง่ายและทำตามได้จริงทันที',
  status: 'draft',
};

export const goodBody = `# คู่มือ SEO สำหรับธุรกิจ SME

การทำ SEO ช่วยให้ธุรกิจขนาดเล็กถูกค้นเจอบนกูเกิลได้โดยไม่ต้องจ่ายค่าโฆษณาเลยแม้แต่บาทเดียว

## เริ่มจากคีย์เวิร์ด

เลือกคำที่ลูกค้าค้นหาจริง ดูบริการที่ [บริการ SEO](/services/seo) และ [ติดต่อเรา](/contact)

## วัดผล

ติดตามอันดับและทราฟฟิกทุกสัปดาห์ ปรับปรุงต่อเนื่องให้ดีขึ้นเรื่อย ๆ อย่างสม่ำเสมอ`;
