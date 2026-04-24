#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const base = `http://127.0.0.1:${process.env.NEXURF_PORT || 3460}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function jsonFetch(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, { signal: AbortSignal.timeout(options.timeoutMs || 15000), ...options });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${pathname} failed HTTP ${response.status}: ${text}`);
  return data;
}
async function main() {
  const doctor = spawnSync(process.execPath, ['runtime/doctor.mjs'], { cwd: root, encoding: 'utf8' });
  process.stdout.write(doctor.stdout || '');
  process.stderr.write(doctor.stderr || '');
  assert(doctor.status === 0, 'Runtime Doctor failed');

  const health = await jsonFetch('/health', { timeoutMs: 5000 });
  assert(health.ok === true, 'health ok mismatch');
  assert(health.service === 'nexurf-runtime-service', 'service id mismatch');

  // Runtime Service may be shared by real tasks. The smoke test must verify
  // cleanup of the page it creates, without assuming it owns every page in
  // the long-lived service.
  const existingPageIds = new Set((health.pages?.items || []).map((item) => item.pageId));

  const opened = await jsonFetch(`/new?url=${encodeURIComponent('https://www.example.com/')}`, { timeoutMs: 20000 });
  assert(opened.ok === true, 'open failed');
  assert(opened.page?.title === 'Example Domain', 'unexpected title');
  const pageId = opened.pageId;

  const info = await jsonFetch(`/info?target=${pageId}`, { timeoutMs: 10000 });
  assert(info.ok === true, 'info failed');
  assert(info.page?.readyState === 'complete', 'page not complete');

  const evalResult = await jsonFetch(`/eval?target=${pageId}`, { method: 'POST', body: 'document.title', timeoutMs: 10000 });
  assert(evalResult.result === 'Example Domain', 'eval title mismatch');

  const carrier = await jsonFetch(`/carrier?target=${pageId}`, { timeoutMs: 10000 });
  assert(carrier.ok === true, 'carrier failed');
  assert(carrier.carrier?.contentKind === 'html', 'carrier kind mismatch');

  const extraction = await jsonFetch(`/extract?target=${pageId}`, { timeoutMs: 10000 });
  const text = extraction.extraction?.contentText || '';
  assert(extraction.ok === true, 'extract failed');
  assert(text.includes('Example Domain'), 'extract text mismatch');

  const scroll = await jsonFetch(`/scroll?target=${pageId}&direction=down&y=200`, { timeoutMs: 10000 });
  assert(scroll.ok === true, 'scroll failed');

  const snapPath = path.join(os.tmpdir(), `nexurf-smoke-${Date.now()}.png`);
  const snap = await jsonFetch(`/screenshot?target=${pageId}&file=${encodeURIComponent(snapPath)}`, { timeoutMs: 10000 });
  assert(snap.ok === true, 'screenshot failed');
  assert(fs.existsSync(snapPath) && fs.statSync(snapPath).size > 0, 'screenshot file missing');
  fs.rmSync(snapPath, { force: true });

  const close = await jsonFetch(`/close?target=${pageId}`, { timeoutMs: 10000 });
  assert(close.ok === true && close.closed === true, 'close failed');

  const finalHealth = await jsonFetch('/health', { timeoutMs: 5000 });
  const finalPageIds = new Set((finalHealth.pages?.items || []).map((item) => item.pageId));
  assert(!finalPageIds.has(pageId), 'created page not cleaned');
  for (const existingPageId of existingPageIds) {
    if (finalPageIds.has(existingPageId)) continue;
  }
  console.log('ok runtime smoke');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
