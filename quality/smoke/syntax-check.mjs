#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const files = [
  'runtime/service.mjs',
  'runtime/doctor.mjs',
  'runtime/profile-engine.mjs',
  'runtime/bridge.mjs',
  'runtime/check.mjs',
  'runtime/profile-match.mjs',
  'scripts/browser-bridge.mjs',
  'scripts/check-runtime.mjs',
  'scripts/match-profile.mjs',
  'quality/smoke/runtime-smoke.mjs',
  'quality/smoke/profile-smoke.mjs',
  'quality/smoke/scan-sensitive.mjs',
  'quality/smoke/syntax-check.mjs',
];
let failed = false;
for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`missing ${file}`);
    failed = true;
    continue;
  }
  const result = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`syntax failed ${file}`);
    process.stderr.write(result.stderr || result.stdout || '');
    failed = true;
  } else {
    console.log(`ok ${file}`);
  }
}
if (failed) process.exit(1);
