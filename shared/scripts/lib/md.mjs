// Markdown analysis helpers used by the SEO gate and the auditor.

export function headings(body) {
  const out = [];
  const fence = /^```/;
  let inFence = false;
  for (const line of body.split('\n')) {
    if (fence.test(line.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim() });
  }
  return out;
}

// มี bullet/numbered list ไหม (ข้าม code fence)
export function hasList(body) {
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^```/.test(line.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^\s*([-*+]|\d+\.)\s+\S/.test(line)) return true;
  }
  return false;
}

// ย่อหน้าที่ยาวเกิน (กำแพงตัวอักษร) — คืนความยาวสูงสุดของ paragraph
export function longestParagraphChars(body) {
  const blocks = body
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/);
  let max = 0;
  for (const b of blocks) {
    const t = b.trim();
    if (!t || /^#{1,6}\s/.test(t) || /^\s*([-*+]|\d+\.|>|\|)/.test(t)) continue;
    max = Math.max(max, t.replace(/\s+/g, ' ').length);
  }
  return max;
}

// จำนวนย่อหน้า prose (บล็อกคั่นด้วยบรรทัดว่าง ที่ไม่ใช่ heading/list/code/quote/table)
export function paragraphCount(body) {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !/^#{1,6}\s/.test(b) && !/^\s*([-*+]|\d+\.|>|\|)/.test(b))
    .length;
}

// สถิติตัวหนา **...** — count + ช่วงที่ยาวสุด (กัน bold ทั้งย่อหน้า = spammy)
export function boldStats(body) {
  const src = body.replace(/```[\s\S]*?```/g, '');
  let count = 0, maxLen = 0;
  const re = /\*\*([^*\n]+)\*\*/g;
  let m;
  while ((m = re.exec(src))) { count++; maxLen = Math.max(maxLen, m[1].trim().length); }
  return { count, maxLen };
}

// ไฮไลต์/สี/HTML ที่ renderer มักไม่รองรับ (==hl==, <mark>, style=, <span>)
export function hasUnsupportedStyling(body) {
  const src = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  return /==[^=]+==|<mark\b|<span\b|style\s*=|<font\b/i.test(src);
}

// ตรวจ markdown table (pipe + แถว separator |---|) — renderer หลายตัวไม่รองรับ GFM table
export function hasMarkdownTable(body) {
  const lines = body.replace(/```[\s\S]*?```/g, '').split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (/\|/.test(lines[i]) && /^\s*\|?\s*:?-{2,}\s*(\|\s*:?-{2,}\s*)+\|?\s*$/.test(lines[i + 1])) {
      return true;
    }
  }
  return false;
}

export function h1Count(body) {
  return headings(body).filter((h) => h.level === 1).length;
}

// Returns first heading-order violation (skipped a level going deeper), or null.
export function headingOrderViolation(body) {
  const hs = headings(body);
  let prev = 0;
  for (const h of hs) {
    if (prev && h.level > prev + 1) return { from: prev, to: h.level, text: h.text };
    prev = h.level;
  }
  return null;
}

// All markdown links [text](href). Internal = relative or same-origin as base_url.
export function links(body, baseUrl = '') {
  const out = [];
  const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  let host = '';
  try { host = baseUrl ? new URL(baseUrl).host : ''; } catch { host = ''; }
  while ((m = re.exec(body))) {
    const href = m[1];
    let internal = false;
    if (href.startsWith('/')) internal = true;
    else if (/^https?:\/\//i.test(href)) {
      try { internal = host && new URL(href).host === host; } catch { internal = false; }
    } else if (!href.startsWith('#') && !/^[a-z]+:/i.test(href)) {
      internal = true; // relative path
    }
    out.push({ href, internal });
  }
  return out;
}

export function pathOf(href, baseUrl = '') {
  try {
    if (href.startsWith('/')) return href;
    if (/^https?:\/\//i.test(href)) return new URL(href).pathname;
    return '/' + href.replace(/^\.?\//, '');
  } catch { return href; }
}

// Thai-aware word count. Uses Intl.Segmenter when available, else char/2.5 heuristic.
export function wordCount(text) {
  const stripped = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .trim();
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const seg = new Intl.Segmenter('th', { granularity: 'word' });
      let n = 0;
      for (const s of seg.segment(stripped)) if (s.isWordLike) n++;
      if (n > 0) return n;
    } catch { /* fall through */ }
  }
  const thaiChars = (stripped.match(/[฀-๿]/g) || []).length;
  const asciiWords = (stripped.match(/[A-Za-z0-9]+/g) || []).length;
  return Math.round(thaiChars / 2.5) + asciiWords;
}

// Dice coefficient on bigrams — cheap title-similarity for cannibalization.
export function similarity(a, b) {
  const bg = (s) => {
    s = String(s).toLowerCase().replace(/\s+/g, ' ').trim();
    const g = new Set();
    for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2));
    return g;
  };
  const A = bg(a), B = bg(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size);
}
