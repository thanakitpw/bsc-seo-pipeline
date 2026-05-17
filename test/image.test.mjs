import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { nextNum, pad } from '../shared/scripts/lib/next-num.mjs';
import { findByStem, rewriteBodyImages, imageRole, seoObjectName } from '../shared/scripts/publish.mjs';

let dir;
before(() => {
  dir = mkdtempSync(resolve(tmpdir(), 'bscseo-img-'));
  mkdirSync(resolve(dir, 'articles/01-a'), { recursive: true });
  mkdirSync(resolve(dir, 'articles/03-c'), { recursive: true });
  mkdirSync(resolve(dir, 'articles/02-b'), { recursive: true });
});
after(() => rmSync(dir, { recursive: true, force: true }));

test('nextNum = max(existing)+1', () => {
  assert.equal(nextNum(resolve(dir, 'articles')), 4);
});

test('nextNum = 1 when no articles dir', () => {
  assert.equal(nextNum(resolve(dir, 'nope')), 1);
});

test('pad zero-fills to 2 digits', () => {
  assert.equal(pad(3), '03');
  assert.equal(pad(10), '10');
});

test('findByStem matches case-insensitively, ignores ext', () => {
  const map = { 'cover.png': 'u/cover', 'og.jpg': 'u/og', '01.webp': 'u/01' };
  assert.equal(findByStem(map, 'cover'), 'u/cover');
  assert.equal(findByStem(map, 'og'), 'u/og');
  assert.equal(findByStem(map, 'missing'), null);
});

test('imageRole detects cover/og/in-article; unknown → assumed cover', () => {
  assert.deepEqual(imageRole('cover.png'), { role: 'cover' });
  assert.deepEqual(imageRole('OG.jpg'), { role: 'og' });
  assert.deepEqual(imageRole('01.webp'), { role: 'in-article', idx: 1 });
  assert.deepEqual(imageRole('12.png'), { role: 'in-article', idx: 12 });
  assert.deepEqual(imageRole('01-what-is-seo-for-sme.png'), { role: 'cover', assumed: true });
});

test('seoObjectName builds slug-keyworded names', () => {
  assert.equal(seoObjectName('seo-for-sme', 'cover', undefined, '.webp'), 'seo-for-sme-cover.webp');
  assert.equal(seoObjectName('seo-for-sme', 'og', undefined, '.webp'), 'seo-for-sme-og.webp');
  assert.equal(seoObjectName('seo-for-sme', 'in-article', 3, '.webp'), 'seo-for-sme-03.webp');
});

test('rewriteBodyImages swaps relative refs to public URLs', () => {
  const map = { '01.png': 'https://cdn/x/01.png' };
  const body = 'a\n![ภาพ](01.png)\n![keep](./02.png)\n![ext](https://other/03.png)';
  const out = rewriteBodyImages(body, map);
  assert.ok(out.includes('![ภาพ](https://cdn/x/01.png)'));
  assert.ok(out.includes('![keep](./02.png)')); // not in map → unchanged
  assert.ok(out.includes('![ext](https://other/03.png)')); // absolute → unchanged
});
