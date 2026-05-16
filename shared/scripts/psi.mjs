// PageSpeed Insights client (optional). Missing key -> exit 2 (audit skips CWV).
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadDotenv } from './lib/config.mjs';
import { request } from './lib/http.mjs';

const CACHE_DIR = resolve(process.cwd(), '.cache/psi');

export async function psi(url, strategy = 'mobile') {
  loadDotenv();
  const key = process.env.PSI_API_KEY;
  if (!key) {
    console.error('🔴 ขาด PSI_API_KEY — audit จะ skip CWV');
    process.exit(2);
  }
  const ck = createHash('sha1').update(url + strategy).digest('hex').slice(0, 16);
  const cp = resolve(CACHE_DIR, ck + '.json');
  if (existsSync(cp)) return JSON.parse(readFileSync(cp, 'utf8'));

  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&key=${key}`;
  const res = await request(api, { timeoutMs: 60000 });
  const j = await res.json();
  if (!res.ok) throw new Error(`PSI ${res.status} ${j.error?.message || ''}`);
  const lr = j.lighthouseResult || {};
  const audits = lr.audits || {};
  const out = {
    url,
    strategy,
    perf: Math.round((lr.categories?.performance?.score ?? 0) * 100),
    lcp: audits['largest-contentful-paint']?.numericValue ?? null,
    cls: audits['cumulative-layout-shift']?.numericValue ?? null,
    inp: audits['interaction-to-next-paint']?.numericValue ?? null,
  };
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cp, JSON.stringify(out));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const url = args.find((a) => !a.startsWith('--'));
  const si = args.indexOf('--strategy');
  const strategy = si >= 0 ? args[si + 1] : 'mobile';
  if (!url) { console.error('usage: psi.mjs <url> [--strategy mobile|desktop]'); process.exit(2); }
  psi(url, strategy).then((o) => console.log(JSON.stringify(o, null, 2)))
    .catch((e) => { console.error(`🔴 ${e.message}`); process.exit(1); });
}
