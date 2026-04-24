#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE_DIR = path.join(ROOT, 'profiles', 'site');
const query = (process.argv[2] || '').trim();

if (!query || !fs.existsSync(PROFILE_DIR)) process.exit(0);

function parseAliases(raw) {
  const line = raw.split(/\r?\n/).find((item) => item.startsWith('aliases:')) || '';
  const value = line.replace(/^aliases:\s*/, '').trim();
  if (!value) return [];
  if (value.startsWith('[')) {
    return value.replace(/^\[/, '').replace(/\]$/, '').split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [value].filter(Boolean);
}

function bodyWithoutFrontmatter(raw) {
  const fences = [...raw.matchAll(/^---\s*$/gm)];
  return fences.length >= 2
    ? raw.slice(fences[1].index + fences[1][0].length).replace(/^\r?\n/, '')
    : raw;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scoreProfile({ domain, aliases, body }, input) {
  let score = 0;
  if (new RegExp(escapeRegExp(domain), 'i').test(input)) score += 100;
  for (const alias of aliases) {
    if (alias && new RegExp(escapeRegExp(alias), 'i').test(input)) score += 60;
  }
  const hostLike = input.match(/[a-z0-9.-]+\.[a-z]{2,}/ig) || [];
  for (const host of hostLike) {
    if (host.endsWith(domain) || domain.endsWith(host)) score += 40;
  }
  for (const token of input.split(/\s+/).filter((v) => v.length >= 2)) {
    if (body.includes(token)) score += 3;
  }
  return score;
}

const matches = [];
for (const file of fs.readdirSync(PROFILE_DIR, { withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith('.md') || file.name.startsWith('_')) continue;
  const fullPath = path.join(PROFILE_DIR, file.name);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const domain = file.name.replace(/\.md$/, '');
  const aliases = parseAliases(raw);
  const body = bodyWithoutFrontmatter(raw);
  const score = scoreProfile({ domain, aliases, body }, query);
  if (score <= 0) continue;
  matches.push({ domain, score, body });
}

for (const match of matches.sort((a, b) => b.score - a.score).slice(0, 3)) {
  console.log(`--- site-profile: ${match.domain} (score=${match.score}) ---`);
  console.log(match.body.trimEnd());
  console.log('');
}
