#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const profileDir = path.join(root, 'profiles', 'site');
const requiredSections = ['## Platform Type', '## Content Carrier Pattern', '## Effective Entry', '## Known Traps', '## Verification'];
let failed = false;
for (const name of fs.readdirSync(profileDir).filter(v => v.endsWith('.md') && !v.startsWith('_'))) {
  const full = path.join(profileDir, name);
  const raw = fs.readFileSync(full, 'utf8');
  if (!/^---\s*[\s\S]*?---/m.test(raw)) {
    console.error(`missing frontmatter: ${name}`);
    failed = true;
  }
  if (!/^aliases:\s*/m.test(raw)) {
    console.error(`missing aliases: ${name}`);
    failed = true;
  }
  for (const section of requiredSections) {
    if (!raw.includes(section)) {
      console.error(`missing section ${section}: ${name}`);
      failed = true;
    }
  }
}
const checks = [
  ['政务 pdf viewer iframe 规范性文件', 'gov-viewer'],
  ['小红书 xiaohongshu 笔记页面', 'xiaohongshu'],
  ['github repository pull request issue', 'github'],
  ['pdf viewer filePath iframe document', 'generic-pdf-viewer'],
  ['湖北省法规规章规范性文件数据库 PDF版本', 'hubei-pdb'],
  ['点击 PDF版本 WPS版本 OFD版本 document button', 'button-document-resource'],
  ['javascript 分页 搜索 空参数', 'js-pagination-search'],
  ['政府信息公开 附件 政务公开', 'government-info-disclosure'],
  ['pdbstaticsnull null resource malformed URL', 'error-resource'],
];
for (const [query, expected] of checks) {
  const result = spawnSync(process.execPath, ['runtime/profile-engine.mjs', query], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout.includes(`site-profile: ${expected}`)) {
    console.error(`profile match failed: ${expected}`);
    console.error(result.stdout || result.stderr);
    failed = true;
  } else {
    console.log(`ok profile ${expected}`);
  }
}
if (failed) process.exit(1);
