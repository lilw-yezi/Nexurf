#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRIDGE_PORT = Number(process.env.NEXURF_PORT || 3460);
const SERVICE_SCRIPT = path.join(ROOT, 'runtime', 'service.mjs');

function checkNode() {
  const major = Number(process.versions.node.split('.')[0]);
  return { ok: major >= 22, version: process.versions.node };
}

function checkPort(port, host = '127.0.0.1', timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, host);
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.once('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.once('error', () => { clearTimeout(timer); resolve(false); });
  });
}

function candidatePortFiles() {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || '';
  const files = [];
  if (process.env.NEXURF_DEVTOOLS_ACTIVE_PORT_FILE) files.push(process.env.NEXURF_DEVTOOLS_ACTIVE_PORT_FILE);
  switch (os.platform()) {
    case 'darwin':
      files.push(
        path.join(home, 'Library/Application Support/Google/Chrome/DevToolsActivePort'),
        path.join(home, 'Library/Application Support/Google/Chrome Canary/DevToolsActivePort'),
        path.join(home, 'Library/Application Support/Chromium/DevToolsActivePort'),
      );
      break;
    case 'linux':
      files.push(
        path.join(home, '.config/google-chrome/DevToolsActivePort'),
        path.join(home, '.config/chromium/DevToolsActivePort'),
      );
      break;
    case 'win32':
      files.push(
        path.join(localAppData, 'Google/Chrome/User Data/DevToolsActivePort'),
        path.join(localAppData, 'Chromium/User Data/DevToolsActivePort'),
      );
      break;
  }
  return files;
}


async function detectBrowserDebugPort() {
  const preferredPort = Number(process.env.NEXURF_BROWSER_PORT || 0);
  if (preferredPort > 0 && await checkPort(preferredPort)) return { port: preferredPort, wsPath: null };

  for (const file of candidatePortFiles()) {
    try {
      const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean);
      const port = parseInt(lines[0], 10);
      if (port > 0 && await checkPort(port)) return { port, wsPath: lines[1] || null };
    } catch {}
  }
  for (const port of [Number(process.env.NEXURF_BROWSER_PORT || 0), 9333, 9222, 9229].filter(Boolean)) {
    if (await checkPort(port)) return { port, wsPath: null };
  }
  return null;
}

async function httpGetJson(url, timeoutMs = 3000) {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    .then(async (res) => {
      try { return JSON.parse(await res.text()); } catch { return null; }
    })
    .catch(() => null);
}

function startServiceDetached() {
  const logFile = path.join(os.tmpdir(), 'nexurf-runtime-service.log');
  const logFd = fs.openSync(logFile, 'a');
  const child = spawn(process.execPath, [SERVICE_SCRIPT], {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, NEXURF_PORT: String(BRIDGE_PORT) },
    ...(os.platform() === 'win32' ? { windowsHide: true } : {}),
  });
  child.unref();
  fs.closeSync(logFd);
  return logFile;
}

async function ensureRuntimeService() {
  const healthUrl = `http://127.0.0.1:${BRIDGE_PORT}/health`;
  const current = await httpGetJson(healthUrl);
  if (current?.service === 'nexurf-runtime-service') {
    console.log(`runtime-service: alive (${BRIDGE_PORT})`);
    return true;
  }

  console.log(`runtime-service: starting (${BRIDGE_PORT})`);
  const logFile = startServiceDetached();
  await new Promise(resolve => setTimeout(resolve, 1200));

  for (let i = 0; i < 12; i++) {
    const health = await httpGetJson(healthUrl, 2500);
    if (health?.service === 'nexurf-runtime-service') {
      console.log(`runtime-service: ready (${BRIDGE_PORT})`);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 700));
  }

  console.log(`runtime-service: failed (${BRIDGE_PORT})`);
  console.log(`runtime-service-log: ${logFile}`);
  return false;
}

async function main() {
  const node = checkNode();
  console.log(`node: ${node.ok ? 'ok' : 'warn'} (${node.version})`);

  const browser = await detectBrowserDebugPort();
  if (!browser) {
    console.log('browser: not-ready');
    console.log('请先打开 Chrome，并在 chrome://inspect/#remote-debugging 中允许当前浏览器实例远程调试。');
    process.exit(1);
  }
  console.log(`browser: ok (${browser.port})`);

  const bridgeOk = await ensureRuntimeService();
  if (!bridgeOk) process.exit(1);

  const profilesDir = path.join(ROOT, 'profiles', 'site');
  try {
    const profiles = fs.readdirSync(profilesDir).filter(v => v.endsWith('.md')).map(v => v.replace(/\.md$/, ''));
    if (profiles.length) console.log(`site-profiles: ${profiles.join(', ')}`);
  } catch {}
}

await main();
