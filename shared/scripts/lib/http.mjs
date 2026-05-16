// Tiny fetch wrapper with timeout + retry. No external deps.
export async function request(url, { method = 'GET', headers = {}, body, timeoutMs = 15000, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, body, signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(t);
      return res;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function head(url, opts = {}) {
  try {
    const res = await request(url, { ...opts, method: 'HEAD' });
    // Some servers reject HEAD — fall back to GET.
    if (res.status === 405 || res.status === 501) {
      const g = await request(url, { ...opts, method: 'GET' });
      return { status: g.status, ok: g.ok };
    }
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: 0, ok: false, error: String(e) };
  }
}

export async function getText(url, opts = {}) {
  const res = await request(url, opts);
  return { status: res.status, ok: res.ok, text: await res.text() };
}
