#!/usr/bin/env node
import http from 'node:http';
import { spawnSync } from 'node:child_process';

const root = new URL('../..', import.meta.url).pathname;
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
function startFixtureServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/doc.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.end('%PDF-1.4\n% Nexurf carrier automation fixture\n');
      return;
    }
    if (req.url === '/bad') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><title>Bad Resource</title><button id="pdf-print" onclick="window.open('//example.test/pdbstaticsnull')">PDF版本</button>`);
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html>
      <title>Carrier Automation Fixture</title>
      <h1>Carrier Automation Fixture</h1>
      <p>Metadata-only page. The document body is behind a button.</p>
      <button id="pdf-print" onclick="window.open('/doc.pdf')">PDF版本</button>
      <button id="ofd-print" onclick="window.open('/doc.ofd')">OFD版本</button>
    `);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const doctor = spawnSync(process.execPath, ['runtime/doctor.mjs'], { cwd: root, encoding: 'utf8' });
  process.stdout.write(doctor.stdout || '');
  process.stderr.write(doctor.stderr || '');
  assert(doctor.status === 0, 'Runtime Doctor failed');

  const server = await startFixtureServer();
  const { port } = server.address();
  let pageId = null;
  let badPageId = null;
  try {
    const opened = await jsonFetch(`/new?url=${encodeURIComponent(`http://127.0.0.1:${port}/`)}`, { timeoutMs: 20000 });
    pageId = opened.pageId;
    const carrier = await jsonFetch(`/carrier?target=${pageId}`, { timeoutMs: 30000 });
    assert(carrier.ok, 'carrier failed');
    assert(carrier.carrier?.carrierKind === 'interactive', 'interactive carrier not detected');
    assert(carrier.carrier?.contentKind === 'pdf', 'pdf resource not promoted');
    assert(carrier.carrier?.resourceUrl === `http://127.0.0.1:${port}/doc.pdf`, 'unexpected pdf resource');
    assert((carrier.carrier?.interactiveDocumentResources?.captured || []).length >= 1, 'missing captured resources');
    console.log('ok carrier automation pdf button');

    const badOpened = await jsonFetch(`/new?url=${encodeURIComponent(`http://127.0.0.1:${port}/bad`)}`, { timeoutMs: 20000 });
    badPageId = badOpened.pageId;
    const badCarrier = await jsonFetch(`/carrier?target=${badPageId}`, { timeoutMs: 30000 });
    const hasMalformed = (badCarrier.carrier?.alternativeResources || []).some(item => item.issue === 'resource_malformed');
    assert(hasMalformed, 'malformed resource not classified');
    console.log('ok carrier automation malformed resource');
  } finally {
    if (pageId) await jsonFetch(`/close?target=${pageId}`, { timeoutMs: 10000 }).catch(() => null);
    if (badPageId) await jsonFetch(`/close?target=${badPageId}`, { timeoutMs: 10000 }).catch(() => null);
    server.close();
    setTimeout(() => process.exit(0), 50);
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
