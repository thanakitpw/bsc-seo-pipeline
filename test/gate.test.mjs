import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runGate } from '../shared/scripts/seo-gate.mjs';
import { cfg, goodFm, goodBody } from './helpers.mjs';

test('accept: valid article → no errors', () => {
  const r = runGate({ frontmatter: goodFm, body: goodBody, config: cfg() });
  assert.deepEqual(r.errors, [], JSON.stringify(r));
});

test('reject: seo_title too long', () => {
  const r = runGate({ frontmatter: { ...goodFm, seo_title: 'ก'.repeat(50) }, body: goodBody, config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('seo_title len')));
});

test('reject: seo_description > max', () => {
  const r = runGate({ frontmatter: { ...goodFm, seo_description: 'ก'.repeat(180) }, body: goodBody, config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('seo_description len')));
});

test('warn: seo_description < min', () => {
  const r = runGate({ frontmatter: { ...goodFm, seo_description: 'สั้นไป' }, body: goodBody, config: cfg() });
  assert.ok(r.warnings.some((w) => w.includes('seo_description len')));
  assert.deepEqual(r.errors, []);
});

test('reject: invalid slug (kebab-en)', () => {
  const r = runGate({ frontmatter: { ...goodFm, slug: 'Bad Slug!' }, body: goodBody, config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('slug')));
});

test('reject: duplicate slug in DB', () => {
  const r = runGate({ frontmatter: goodFm, body: goodBody, config: cfg(), existingSlugs: ['seo-for-sme'] });
  assert.ok(r.errors.some((e) => e.includes('ชนกับบทความเดิม')));
});

test('reject: two H1', () => {
  const r = runGate({ frontmatter: goodFm, body: '# หนึ่ง\n# สอง\n[a](/services/seo) [b](/contact) ' + 'คำ '.repeat(60), config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('H1')));
});

test('reject: no H1', () => {
  const r = runGate({ frontmatter: goodFm, body: 'ไม่มีหัวเลย [a](/services/seo) [b](/contact) ' + 'คำ '.repeat(60), config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('H1')));
});

test('reject: missing pillar internal link', () => {
  const r = runGate({ frontmatter: goodFm, body: '# หัว\n[a](/about) [b](/contact) ' + 'คำ '.repeat(60), config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('pillar')));
});

test('reject: too few internal links', () => {
  const r = runGate({ frontmatter: goodFm, body: '# หัว\n[a](/services/seo) ' + 'คำ '.repeat(60), config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('internal links')));
});

test('reject: thin content', () => {
  const r = runGate({ frontmatter: goodFm, body: '# หัว\n[a](/services/seo) [b](/contact) สั้น', config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('word count')));
});

test('reject: category not whitelisted', () => {
  const r = runGate({ frontmatter: { ...goodFm, category: 'Unknown' }, body: goodBody, config: cfg() });
  assert.ok(r.errors.some((e) => e.includes('category')));
});

test('warn: heading order skip', () => {
  const body = '# หัว\n### ข้าม\n[a](/services/seo) [b](/contact) ' + 'คำ '.repeat(60);
  const r = runGate({ frontmatter: goodFm, body, config: cfg() });
  assert.ok(r.warnings.some((w) => w.includes('heading order')));
});

test('warn: cannibalization by title similarity', () => {
  const r = runGate({
    frontmatter: goodFm, body: goodBody, config: cfg(),
    existingTitles: ['คู่มือ SEO สำหรับธุรกิจ SME ฉบับเต็ม'],
  });
  assert.ok(r.warnings.some((w) => w.includes('cannibalization')));
});

test('warn: voice banned word', () => {
  const body = '# หัว\n[a](/services/seo) [b](/contact) เนื้อหา 555 ' + 'คำ '.repeat(60);
  const r = runGate({ frontmatter: goodFm, body, config: cfg() });
  assert.ok(r.warnings.some((w) => w.includes('คำต้องห้าม')));
  assert.deepEqual(r.errors, []);
});

test('warn: AI pattern repeated', () => {
  const body = '# หัว\nในยุคปัจจุบัน สำคัญมาก อย่างไรก็ตาม ต้องทำ [a](/services/seo) [b](/contact) ' + 'คำ '.repeat(60);
  const r = runGate({ frontmatter: goodFm, body, config: cfg() });
  assert.ok(r.warnings.some((w) => w.includes('สำนวน AI')));
});

test('warn: "อาทิตย์" instead of สัปดาห์', () => {
  const body = '# หัว\nอาทิตย์หน้าเจอกัน [a](/services/seo) [b](/contact) ' + 'คำ '.repeat(60);
  const r = runGate({ frontmatter: goodFm, body, config: cfg() });
  assert.ok(r.warnings.some((w) => w.includes('อาทิตย์')));
});
