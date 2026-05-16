// Slug generation per config.slug.convention.
// kebab-en: ascii lowercase, words joined by '-'. thai: keep Thai chars, no spaces, URL-safe.

const TH_TRANSLIT = null; // intentionally no transliteration — kebab-en expects an EN source string.

export function slugify(input, convention = 'kebab-en') {
  const s = String(input || '').trim();
  if (convention === 'thai') {
    return s
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\p{M}-]/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }
  // kebab-en
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const KEBAB_EN_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug, convention = 'kebab-en') {
  if (!slug) return false;
  if (convention === 'thai') {
    // ไทย/ตัวเลข, คั่นด้วย '-', ไม่มี space/อักขระพิเศษ (URL-safe หลัง encode)
    return /^[\p{L}\p{N}\p{M}]+(?:-[\p{L}\p{N}\p{M}]+)*$/u.test(slug);
  }
  return KEBAB_EN_RE.test(slug);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , conv, ...rest] = process.argv;
  const input = rest.join(' ');
  const convention = conv || 'kebab-en';
  const out = slugify(input, convention);
  // Guard: kebab-en fed a Thai phrase drops Thai chars → poor slug.
  if (convention === 'kebab-en' && /[฀-๿]/.test(input)) {
    console.error('🔴 kebab-en: input มีอักษรไทย (จะถูกตัดทิ้งได้ slug แย่) — ป้อน "วลีอังกฤษ" เช่น "seo tips for sme" หรือใช้ convention: thai');
    process.exit(1);
  }
  if (!out || !isValidSlug(out, convention)) {
    console.error(`🔴 slug ที่ได้ ("${out}") ไม่ผ่าน convention ${convention} — แก้ input`);
    process.exit(1);
  }
  console.log(out);
}
