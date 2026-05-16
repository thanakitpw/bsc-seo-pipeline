// Central tool/credential readiness check.
// required missing -> blocking:true. optional missing -> degrade (unless config opted out).
import { loadDotenv } from './config.mjs';

export function envCheck(cfg = {}) {
  loadDotenv();
  const has = (k) => typeof process.env[k] === 'string' && process.env[k].length > 0;

  const supabaseOk = has('SUPABASE_URL') && has('SUPABASE_SERVICE_ROLE_KEY');
  const dfsOptOut = cfg?.dataforseo?.enabled === false;
  const dfsOk = has('DATAFORSEO_LOGIN') && has('DATAFORSEO_PASSWORD');
  const psiOptOut = cfg?.audit?.check_cwv === false;
  const psiOk = has('PSI_API_KEY');

  const tools = {
    supabase: { required: true, ok: supabaseOk, vars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
    dataforseo: { required: false, ok: dfsOk, optedOut: dfsOptOut, vars: ['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD'] },
    psi: { required: false, ok: psiOk, optedOut: psiOptOut, vars: ['PSI_API_KEY'] },
    websearch: { required: false, ok: true, vars: [] },
  };

  const missingRequired = Object.entries(tools)
    .filter(([, v]) => v.required && !v.ok)
    .map(([k, v]) => ({ tool: k, vars: v.vars }));

  return { tools, blocking: missingRequired.length > 0, missingRequired };
}

function icon(v) {
  if (v.ok) return '✅';
  if (v.optedOut) return '⏭️'; // intentional degrade
  if (v.required) return '🔴';
  return '⚠️';
}

export function banner(result) {
  const t = result.tools;
  const parts = [
    `${icon(t.supabase)} Supabase`,
    `${icon(t.dataforseo)} DataForSEO${!t.dataforseo.ok && !t.dataforseo.optedOut ? '(degrade→WebSearch)' : ''}`,
    `${icon(t.psi)} PSI${!t.psi.ok && !t.psi.optedOut ? '(skip CWV)' : ''}`,
  ];
  return parts.join('  ');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let cfg = {};
  try { cfg = (await import('./config.mjs')).loadConfig(); } catch { /* config optional for banner */ }
  const r = envCheck(cfg);
  if (process.argv.includes('--banner')) {
    console.log(banner(r));
    process.exit(r.blocking ? 1 : 0);
  }
  // --json (default): never echo secret values, only var names.
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.blocking ? 1 : 0);
}
