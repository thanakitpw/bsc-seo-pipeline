// ดึงขนาด/URL รูปจากหน้าเว็บจริง (og:image + dimensions) ให้ image-prompt ใช้
// อ้างอิงขนาดจากเว็บ ไม่ต้องเดา. ไม่มี dep — ใช้ fetch + regex.
import { getText } from './http.mjs';

function meta(html, prop) {
  // รองรับทั้ง property= และ name= , ลำดับ attr สลับได้
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i');
  const m = html.match(re) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'));
  return m ? m[1] : null;
}

export function parseImgMeta(html) {
  const w = meta(html, 'og:image:width');
  const h = meta(html, 'og:image:height');
  return {
    og_image: meta(html, 'og:image') || meta(html, 'twitter:image'),
    og_size: w && h ? `${w}x${h}` : null,
    twitter_image: meta(html, 'twitter:image'),
  };
}

export async function imgSizeFromPage(url) {
  const { ok, status, text } = await getText(url);
  if (!ok) return { ok: false, status, url };
  return { ok: true, url, ...parseImgMeta(text) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2];
  if (!url) { console.error('usage: img-size.mjs <article-url>'); process.exit(2); }
  const r = await imgSizeFromPage(url);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
