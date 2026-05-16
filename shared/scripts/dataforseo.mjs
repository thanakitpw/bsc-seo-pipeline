// DataForSEO REST client (Basic auth from .env). Optional — missing creds -> exit 2.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadConfig, loadDotenv } from './lib/config.mjs';
import { request } from './lib/http.mjs';

const BASE = 'https://api.dataforseo.com/v3';
const CACHE_DIR = resolve(process.cwd(), '.cache/dataforseo');

function auth() {
  loadDotenv();
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error('🔴 ขาด DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD — research จะ degrade เป็น WebSearch');
    process.exit(2);
  }
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

function cacheGet(key) {
  const p = resolve(CACHE_DIR, key + '.json');
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  return null;
}
function cacheSet(key, val) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(resolve(CACHE_DIR, key + '.json'), JSON.stringify(val));
}

async function post(path, payload) {
  const key = createHash('sha1').update(path + JSON.stringify(payload)).digest('hex').slice(0, 16);
  const cached = cacheGet(key);
  if (cached) return cached;
  const res = await request(BASE + path, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  });
  const json = await res.json();
  if (!res.ok || json.status_code >= 40000) {
    throw new Error(`DataForSEO ${res.status} ${json.status_message || ''}`);
  }
  cacheSet(key, json);
  return json;
}

const loc = (cfg) => ({ location_code: cfg.dataforseo.location_code, language_code: cfg.dataforseo.language_code });

export async function searchVolume(keywords, cfg) {
  const j = await post('/keywords_data/google_ads/search_volume/live', [{ ...loc(cfg), keywords }]);
  return (j.tasks?.[0]?.result || []).map((r) => ({ keyword: r.keyword, volume: r.search_volume, cpc: r.cpc, competition: r.competition }));
}

export async function keywordIdeas(seed, cfg) {
  const j = await post('/dataforseo_labs/google/keyword_ideas/live', [{ ...loc(cfg), keywords: [seed], limit: 50 }]);
  return (j.tasks?.[0]?.result?.[0]?.items || []).map((i) => ({
    keyword: i.keyword,
    volume: i.keyword_info?.search_volume,
    competition: i.keyword_info?.competition,
  }));
}

export async function serp(keyword, cfg) {
  const j = await post('/serp/google/organic/live/advanced', [{ ...loc(cfg), keyword, depth: 20 }]);
  const items = j.tasks?.[0]?.result?.[0]?.items || [];
  return {
    organic: items.filter((i) => i.type === 'organic').map((i) => ({ rank: i.rank_absolute, title: i.title, url: i.url })),
    people_also_ask: items.filter((i) => i.type === 'people_also_ask').flatMap((i) => (i.items || []).map((q) => q.title)),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , cmd, ...rest] = process.argv;
  const cfg = loadConfig();
  (async () => {
    try {
      let out;
      if (cmd === 'volume') out = await searchVolume(rest, cfg);
      else if (cmd === 'ideas') out = await keywordIdeas(rest.join(' '), cfg);
      else if (cmd === 'serp') out = await serp(rest.join(' '), cfg);
      else { console.error('usage: dataforseo.mjs volume <kw...> | ideas <seed> | serp <kw>'); process.exit(2); }
      console.log(JSON.stringify(out, null, 2));
    } catch (e) {
      console.error(`🔴 ${e.message}`);
      process.exit(1);
    }
  })();
}
