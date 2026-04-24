#!/usr/bin/env node
import http from 'node:http';
import { spawnSync } from 'node:child_process';

const root = new URL('../..', import.meta.url).pathname;
const base = `http://127.0.0.1:${process.env.NEXURF_PORT || 3460}`;
function assert(condition, message) { if (!condition) throw new Error(message); }
async function jsonFetch(pathname, body, timeoutMs = 120000) {
  const response = await fetch(`${base}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${pathname} HTTP ${response.status}: ${text}`);
  return data;
}
function startFixtureServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/doc.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.end('%PDF-1.4\n% task fixture\n');
      return;
    }
    if (req.url === '/detail1') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><title>Detail One</title><article><h1>Detail One</h1><p>Detail one body text for Nexurf task smoke.</p></article>');
      return;
    }
    if (req.url === '/detail2') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><title>Detail Two</title><button id="pdf-print" onclick="window.open(\'/doc.pdf\')">PDF版本</button>');
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><title>List Fixture</title><a href="/detail1">Policy One</a><a href="/detail2">Policy Two</a>');
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function main() {
  const doctor = spawnSync(process.execPath, ['runtime/doctor.mjs'], { cwd: root, encoding: 'utf8' });
  process.stdout.write(doctor.stdout || '');
  process.stderr.write(doctor.stderr || '');
  assert(doctor.status === 0, 'Runtime Doctor failed');
  const server = await startFixtureServer();
  const { port } = server.address();
  try {
    const url = `http://127.0.0.1:${port}/`;
    const inspect = await jsonFetch('/task', { url, goal: 'inspect-site' });
    assert(inspect.ok && inspect.result?.carrier, 'inspect task failed');
    console.log('ok task inspect-site');
    const page = await jsonFetch('/task', { url: `${url}detail1`, goal: 'extract-page' });
    assert(page.ok && page.result?.extraction?.contentText?.includes('Detail one body text'), 'extract-page task failed');
    console.log('ok task extract-page');
    const docs = await jsonFetch('/task', { url: `${url}detail2`, goal: 'extract-documents' });
    assert(docs.ok && docs.result?.carrier?.resourceUrl === `${url}doc.pdf`, 'extract-documents task failed');
    console.log('ok task extract-documents');
    const list = await jsonFetch('/task', { url, goal: 'extract-list', limit: 2 });
    assert(list.ok && list.items?.length === 2, 'extract-list task failed');
    console.log('ok task extract-list');
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 50);
  }
}
main().catch(error => { console.error(error.stack || error.message); process.exit(1); });
