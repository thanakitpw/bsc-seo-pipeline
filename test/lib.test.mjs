import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, isValidSlug, KEBAB_EN_RE } from '../shared/scripts/lib/slugify.mjs';
import { h1Count, headingOrderViolation, links, wordCount, similarity, headings } from '../shared/scripts/lib/md.mjs';
import { envCheck } from '../shared/scripts/lib/env-check.mjs';

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

test('md wordCount Thai is reasonable', () => {
  assert.ok(wordCount('การทำ SEO ช่วยให้เว็บไซต์ติดอันดับ') >= 3);
  assert.ok(wordCount('คำ '.repeat(100)) >= 80);
});

test('md similarity', () => {
  assert.ok(similarity('คู่มือ SEO สำหรับ SME', 'คู่มือ SEO สำหรับ SME ฉบับเต็ม') > 0.7);
  assert.ok(similarity('abc', 'xyz') < 0.2);
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
