#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE_DIR = path.join(ROOT, 'references', 'site-profiles');
const query = (process.argv[2] || '').trim();

if (!query || !fs.existsSync(PROFILE_DIR)) process.exit(0);

for (const file of fs.readdirSync(PROFILE_DIR, { withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith('.md')) continue;
  const fullPath = path.join(PROFILE_DIR, file.name);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const domain = file.name.replace(/\.md$/, '');
  const aliasLine = raw.split(/\r?\n/).find(line => line.startsWith('aliases:')) || '';
  const aliases = aliasLine
    .replace(/^aliases:\s*/, '')
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  const escaped = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms = [domain, ...aliases].map(escaped).filter(Boolean);
  if (!terms.length) continue;
  if (!new RegExp(terms.join('|'), 'i').test(query)) continue;

  const fences = [...raw.matchAll(/^---\s*$/gm)];
  const body = fences.length >= 2
    ? raw.slice(fences[1].index + fences[1][0].length).replace(/^\r?\n/, '')
    : raw;

  console.log(`--- site-profile: ${domain} ---`);
  console.log(body.trimEnd());
  console.log('');
}
