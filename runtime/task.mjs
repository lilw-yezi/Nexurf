#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const port = Number(process.env.NEXURF_PORT || 3460);
const base = `http://127.0.0.1:${port}`;

function usage() {
  console.error('Usage: node runtime/task.mjs <url> [--goal inspect-site|extract-page|extract-documents|extract-list] [--limit N]');
}

function parseArgs(argv) {
  const args = [...argv];
  const input = { url: '', goal: 'inspect-site', limit: undefined };
  while (args.length) {
    const arg = args.shift();
    if (arg === '--goal') input.goal = args.shift() || input.goal;
    else if (arg === '--limit') input.limit = Number(args.shift() || 0) || undefined;
    else if (!input.url) input.url = arg;
    else input.hint = [input.hint, arg].filter(Boolean).join(' ');
  }
  return input;
}

async function main() {
  const input = parseArgs(process.argv.slice(2));
  if (!input.url) {
    usage();
    process.exit(1);
  }
  const doctor = spawnSync(process.execPath, ['runtime/doctor.mjs'], { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
  process.stderr.write(doctor.stdout || '');
  process.stderr.write(doctor.stderr || '');
  if (doctor.status !== 0) process.exit(doctor.status || 1);

  const response = await fetch(`${base}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(180000),
  });
  const text = await response.text();
  process.stdout.write(text + '\n');
  if (!response.ok) process.exit(1);
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
