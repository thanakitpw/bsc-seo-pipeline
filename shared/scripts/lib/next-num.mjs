// Next sequential post number. Scans articles/ for folders like "<N>-<slug>".
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function nextNum(dir = resolve(process.cwd(), 'articles')) {
  if (!existsSync(dir)) return 1;
  let max = 0;
  for (const name of readdirSync(dir)) {
    const m = name.match(/^(\d+)-/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

// zero-padded to 2 digits for stable sort (01, 02 ... 10).
export function pad(n) {
  return String(n).padStart(2, '0');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(pad(nextNum()));
}
