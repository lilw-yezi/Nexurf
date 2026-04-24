#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const terms = [
  'web-access', 'web access', 'WEB_FOUNDATION', 'web_foundation',
  'CDP Proxy', 'cdp-proxy', 'match-site', 'site-patterns', 'legacy',
  '迁移', '抄', '搬', '对齐', '源于', 'web-access-main',
];
const ignoredDirs = new Set(['.git', 'node_modules']);
const ignoredFiles = new Set(['quality/smoke/scan-sensitive.mjs']);
const hits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    const file = path.join(dir, entry.name);
    const rel = path.relative(root, file);
    if (ignoredFiles.has(rel)) continue;
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const term of terms) {
        if (line.includes(term)) hits.push(`${rel}:${index + 1}: ${term}`);
      }
    });
  }
}
walk(root);
if (hits.length) {
  console.error('sensitive scan failed');
  for (const hit of hits) console.error(hit);
  process.exit(1);
}
console.log('ok sensitive scan');
