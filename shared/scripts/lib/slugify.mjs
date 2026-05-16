// Slug generation per config.slug.convention.
// kebab-en: ascii lowercase, words joined by '-'. thai: keep Thai chars, no spaces, URL-safe.

const TH_TRANSLIT = null; // intentionally no transliteration — kebab-en expects an EN source string.

export function slugify(input, convention = 'kebab-en') {
  const s = String(input || '').trim();
  if (convention === 'thai') {
    return s
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
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
    return !/\s/.test(slug) && slug === encodeURI(slug).replace(/%[0-9A-F]{2}/g, (m) => decodeURIComponent(m));
  }
  return KEBAB_EN_RE.test(slug);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , conv, ...rest] = process.argv;
  console.log(slugify(rest.join(' '), conv || 'kebab-en'));
}
