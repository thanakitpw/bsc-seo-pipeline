import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, isValidSlug, KEBAB_EN_RE } from '../shared/scripts/lib/slugify.mjs';
import { h1Count, headingOrderViolation, links, wordCount, similarity, headings, hasList, longestParagraphChars, paragraphCount, hasMarkdownTable, boldStats, hasUnsupportedStyling } from '../shared/scripts/lib/md.mjs';
import { envCheck } from '../shared/scripts/lib/env-check.mjs';
import { parseImgMeta } from '../shared/scripts/lib/img-size.mjs';

test('slugify kebab-en', () => {
  assert.equal(slugify('SEO For SME 2026!', 'kebab-en'), 'seo-for-sme-2026');
  assert.ok(KEBAB_EN_RE.test('seo-for-sme-2026'));
  assert.ok(!isValidSlug('Bad Slug!', 'kebab-en'));
  assert.ok(isValidSlug('seo-for-sme', 'kebab-en'));
});

test('slugify thai keeps Thai, drops spaces', () => {
  const s = slugify('คู่มือ SEO สำหรับ SME', 'thai');
  assert.ok(!/\s/.test(s));
  assert.ok(s.length > 0);
});

test('isValidSlug thai: valid Thai slug passes, no crash', () => {
  const s = slugify('คู่มือ seo สำหรับ sme', 'thai');
  assert.equal(isValidSlug(s, 'thai'), true);
  assert.equal(isValidSlug('คู่มือ seo', 'thai'), false); // has space
  assert.equal(isValidSlug('seo-สำหรับ-sme', 'thai'), true);
  assert.equal(isValidSlug('bad/slug', 'thai'), false);
});

test('md headings + h1Count', () => {
  const body = '# A\n## B\n### C';
  assert.equal(h1Count(body), 1);
  assert.equal(headings(body).length, 3);
});

test('md headings ignore code fences', () => {
  const body = '# A\n```\n# not heading\n```\n## B';
  assert.equal(h1Count(body), 1);
});

test('md heading order violation', () => {
  assert.ok(headingOrderViolation('# A\n### C'));
  assert.equal(headingOrderViolation('# A\n## B\n### C'), null);
});

test('md links internal detection', () => {
  const ls = links('[a](/x) [b](https://example.com/y) [c](https://other.com/z) [d](#frag)', 'https://example.com');
  const internal = ls.filter((l) => l.internal).map((l) => l.href);
  assert.deepEqual(internal.sort(), ['/x', 'https://example.com/y']);
});

test('hasList detects bullet/numbered, ignores code fence', () => {
  assert.equal(hasList('ย่อหน้า\n\n- ข้อ 1\n- ข้อ 2'), true);
  assert.equal(hasList('1. หนึ่ง\n2. สอง'), true);
  assert.equal(hasList('ไม่มีลิสต์เลย ย่อหน้าเดียว'), false);
  assert.equal(hasList('```\n- ในโค้ดไม่นับ\n```'), false);
});

test('longestParagraphChars ignores headings/lists/code', () => {
  const body = '# หัว\n\n' + 'ก'.repeat(50) + '\n\n- ลิสต์ยาว ' + 'ข'.repeat(900);
  assert.ok(longestParagraphChars(body) < 100); // list line excluded
  const wall = '# หัว\n\n' + 'ค'.repeat(800);
  assert.ok(longestParagraphChars(wall) >= 800);
});

test('paragraphCount counts prose blocks only', () => {
  const body = '# หัว\n\nย่อหน้าหนึ่ง\n\nย่อหน้าสอง\n\n- ลิสต์ไม่นับ\n\n## H2 ไม่นับ\n\nย่อหน้าสาม';
  assert.equal(paragraphCount(body), 3);
  assert.equal(paragraphCount('เขียนรวดเดียวไม่เว้นบรรทัด'), 1);
});

test('boldStats counts spans + max length', () => {
  const s = boldStats('ปกติ **คำสำคัญ** ต่อ **อีกคำ** จบ');
  assert.equal(s.count, 2);
  assert.equal(s.maxLen, 'คำสำคัญ'.length);
  assert.equal(boldStats('ไม่มีตัวหนา').count, 0);
});

test('hasUnsupportedStyling flags ==hl==/<mark>/style, not plain bold', () => {
  assert.equal(hasUnsupportedStyling('นี่ ==ไฮไลต์=='), true);
  assert.equal(hasUnsupportedStyling('<mark>เน้น</mark>'), true);
  assert.equal(hasUnsupportedStyling('<span style="color:red">x</span>'), true);
  assert.equal(hasUnsupportedStyling('**ตัวหนา** *เอียง* > quote'), false);
});

test('hasMarkdownTable detects pipe tables, not plain pipes', () => {
  assert.equal(hasMarkdownTable('| a | b |\n|---|---|\n| 1 | 2 |'), true);
  assert.equal(hasMarkdownTable('ข้อความมี | คั่น แต่ไม่ใช่ตาราง'), false);
  assert.equal(hasMarkdownTable('- ข้อ 1\n- ข้อ 2'), false);
  assert.equal(hasMarkdownTable('```\n| a |\n|---|\n```'), false);
});

test('md wordCount Thai is reasonable', () => {
  assert.ok(wordCount('การทำ SEO ช่วยให้เว็บไซต์ติดอันดับ') >= 3);
  assert.ok(wordCount('คำ '.repeat(100)) >= 80);
});

test('md similarity', () => {
  assert.ok(similarity('คู่มือ SEO สำหรับ SME', 'คู่มือ SEO สำหรับ SME ฉบับเต็ม') > 0.7);
  assert.ok(similarity('abc', 'xyz') < 0.2);
});

test('parseImgMeta extracts og:image + size (attr order agnostic)', () => {
  const html = `<meta property="og:image" content="https://x/og.png">
    <meta content="1200" property="og:image:width">
    <meta property="og:image:height" content="630">
    <meta name="twitter:image" content="https://x/tw.png">`;
  const r = parseImgMeta(html);
  assert.equal(r.og_image, 'https://x/og.png');
  assert.equal(r.og_size, '1200x630');
  assert.equal(r.twitter_image, 'https://x/tw.png');
});

test('parseImgMeta: no dimensions → og_size null, falls back to twitter image', () => {
  const r = parseImgMeta('<meta name="twitter:image" content="https://x/t.png">');
  assert.equal(r.og_size, null);
  assert.equal(r.og_image, 'https://x/t.png');
});

test('envCheck: required missing → blocking', () => {
  const save = { ...process.env };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = envCheck({ dataforseo: { enabled: false }, audit: { check_cwv: false } });
  assert.equal(r.blocking, true);
  assert.ok(r.missingRequired.some((m) => m.tool === 'supabase'));
  process.env = save;
});

test('envCheck: opt-out not flagged as missing', () => {
  const save = { ...process.env };
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
  delete process.env.DATAFORSEO_LOGIN;
  const r = envCheck({ dataforseo: { enabled: false }, audit: { check_cwv: false } });
  assert.equal(r.blocking, false);
  assert.equal(r.tools.dataforseo.optedOut, true);
  process.env = save;
});
