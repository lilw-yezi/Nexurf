#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';

const PORT = Number(process.env.NEXURF_PORT || 3460);
const pages = new Map(); // pageId -> { targetId, sessionId, createdAt }
const guardedSessions = new Set();
let socket = null;
let browserPort = null;
let browserWsPath = null;
let nextCommandId = 1;
const inflight = new Map();
let connectingPromise = null;

let WS;
if (typeof globalThis.WebSocket !== 'undefined') {
  WS = globalThis.WebSocket;
} else {
  try {
    WS = (await import('ws')).default;
  } catch {
    console.error('[nexurf] Node.js < 22 需要 ws 模块支持');
    process.exit(1);
  }
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

function fail(res, status, code, message, details = null) {
  json(res, status, { ok: false, error: { code, message, details } });
}

function createPageId() {
  return `page_${crypto.randomUUID().slice(0, 8)}`;
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body;
}

function parseMaybeJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getRequestPayload(req) {
  const bodyText = await readBody(req);
  const bodyJson = parseMaybeJson(bodyText);
  return { bodyText, bodyJson };
}

function pickUrlInput(url, bodyJson, bodyText) {
  return bodyJson?.url || url.searchParams.get('url') || bodyText || '';
}

function tryDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeResourceUrl(raw, baseUrl = '') {
  if (!raw) return '';
  let value = String(raw).trim();
  value = value.replace(/^readfile/, 'https://');
  value = tryDecode(value);
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

function classifyResourceKind(resourceUrl = '', text = '') {
  const url = String(resourceUrl || '').toLowerCase();
  const label = String(text || '').toLowerCase();
  if (/\.pdf($|\?)/i.test(url) || /pdf/.test(label)) return 'pdf';
  if (/\.ofd($|\?)/i.test(url) || /ofd/.test(label)) return 'ofd';
  if (/\.(docx?|wps)($|\?)/i.test(url) || /wps|word|docx|doc/.test(label)) return 'office';
  if (/\.(png|jpe?g|webp|gif|bmp)($|\?)/i.test(url) || /图片|image|scan/.test(label)) return 'image';
  return 'resource';
}

function candidatePortFiles() {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || '';
  switch (os.platform()) {
    case 'darwin':
      return [
        path.join(home, 'Library/Application Support/Google/Chrome/DevToolsActivePort'),
        path.join(home, 'Library/Application Support/Google/Chrome Canary/DevToolsActivePort'),
        path.join(home, 'Library/Application Support/Chromium/DevToolsActivePort'),
      ];
    case 'linux':
      return [
        path.join(home, '.config/google-chrome/DevToolsActivePort'),
        path.join(home, '.config/chromium/DevToolsActivePort'),
      ];
    case 'win32':
      return [
        path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data/DevToolsActivePort'),
        path.join(process.env.LOCALAPPDATA || '', 'Chromium/User Data/DevToolsActivePort'),
      ];
    default:
      return [];
  }
}

function checkPort(port, host = '127.0.0.1', timeoutMs = 1500) {
  return new Promise((resolve) => {
    const probe = net.createConnection(port, host);
    const timer = setTimeout(() => {
      probe.destroy();
      resolve(false);
    }, timeoutMs);
    probe.once('connect', () => {
      clearTimeout(timer);
      probe.destroy();
      resolve(true);
    });
    probe.once('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function discoverBrowserEndpoint() {
  for (const file of candidatePortFiles()) {
    try {
      const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean);
      const port = Number(lines[0]);
      const wsPath = lines[1] || null;
      if (port > 0 && await checkPort(port)) return { port, wsPath };
    } catch {}
  }

  for (const port of [9222, 9229, 9333]) {
    if (await checkPort(port)) return { port, wsPath: null };
  }

  return null;
}

function getBrowserWsUrl(port, wsPath) {
  return `ws://127.0.0.1:${port}${wsPath || '/devtools/browser'}`;
}

async function reattachKnownPages() {
  const snapshot = Array.from(pages.entries());
  for (const [pageId, page] of snapshot) {
    if (!page?.targetId) continue;
    if (page.sessionId) continue;
    try {
      const sessionId = await attachToTarget(page.targetId);
      pages.set(pageId, {
        ...pages.get(pageId),
        sessionId,
        lastRecoveryAt: new Date().toISOString(),
      });
    } catch {
      // 目标页可能已不存在；保持空 session，等后续按需恢复或由 targetDestroyed 事件清理
    }
  }
}

async function ensureConnection() {
  if (socket && (socket.readyState === WS.OPEN || socket.readyState === 1)) return;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    if (!browserPort) {
      const discovered = await discoverBrowserEndpoint();
      if (!discovered) throw new Error('未发现可用浏览器调试端口，请先在 Chrome 中开启远程调试。');
      browserPort = discovered.port;
      browserWsPath = discovered.wsPath;
    }

    const wsUrl = getBrowserWsUrl(browserPort, browserWsPath);
    await new Promise((resolve, reject) => {
      socket = new WS(wsUrl);

      const onOpen = () => {
        cleanup();
        console.log(`[nexurf] connected browser (port ${browserPort})`);
        bindRuntimeEvents();
        Promise.resolve()
          .then(() => reattachKnownPages())
          .finally(() => {
            connectingPromise = null;
            resolve();
          });
      };
      const onError = (event) => {
        cleanup();
        connectingPromise = null;
        socket = null;
        browserPort = null;
        browserWsPath = null;
        const msg = event?.message || event?.error?.message || '浏览器连接失败';
        console.error('[nexurf] browser connect error:', msg, '（端口缓存已清除，下次将重新发现）');
        for (const [id, pending] of inflight.entries()) {
          clearTimeout(pending.timer);
          pending.reject(new Error(`浏览器连接失败: ${msg}`));
          inflight.delete(id);
        }
        reject(new Error(msg));
      };

      function cleanup() {
        socket.removeEventListener?.('open', onOpen);
        socket.removeEventListener?.('error', onError);
      }

      if (socket.on) {
        socket.on('open', onOpen);
        socket.on('error', onError);
      } else {
        socket.addEventListener('open', onOpen);
        socket.addEventListener('error', onError);
      }
    });
  })();

  return connectingPromise;
}

function bindRuntimeEvents() {
  const onClose = () => {
    console.log('[nexurf] browser connection closed');
    connectingPromise = null;
    socket = null;
    browserPort = null;
    browserWsPath = null;
    for (const [id, pending] of inflight.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('浏览器连接已断开'));
      inflight.delete(id);
    }
    guardedSessions.clear();
    for (const [pageId, page] of pages.entries()) {
      pages.set(pageId, { ...page, sessionId: null, lastDisconnectAt: new Date().toISOString() });
    }
  };

  const onMessage = (event) => {
    const raw = typeof event === 'string' ? event : (event.data || event);
    const message = JSON.parse(typeof raw === 'string' ? raw : raw.toString());

    if (message.method === 'Target.attachedToTarget') {
      const targetId = message.params?.targetInfo?.targetId;
      const sessionId = message.params?.sessionId;
      if (targetId && sessionId) {
        for (const [pageId, page] of pages.entries()) {
          if (page.targetId === targetId) {
            pages.set(pageId, { ...page, sessionId, lastAttachAt: new Date().toISOString() });
            break;
          }
        }
      }
    }

    if (message.method === 'Target.detachedFromTarget') {
      const sessionId = message.params?.sessionId;
      if (sessionId) {
        for (const [pageId, page] of pages.entries()) {
          if (page.sessionId === sessionId) {
            pages.set(pageId, { ...page, sessionId: null, lastDetachAt: new Date().toISOString() });
            break;
          }
        }
      }
    }

    if (message.method === 'Target.targetDestroyed') {
      const targetId = message.params?.targetId;
      if (targetId) {
        for (const [pageId, page] of pages.entries()) {
          if (page.targetId === targetId) {
            pages.delete(pageId);
            break;
          }
        }
      }
    }

    if (message.method === 'Fetch.requestPaused') {
      const requestId = message.params?.requestId;
      const sessionId = message.params?.sessionId;
      if (requestId && sessionId) {
        sendCommand('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' }, sessionId).catch(() => {});
      }
    }

    if (message.id && inflight.has(message.id)) {
      const { resolve, timer } = inflight.get(message.id);
      clearTimeout(timer);
      inflight.delete(message.id);
      resolve(message);
    }
  };

  if (socket.on) {
    socket.on('close', onClose);
    socket.on('message', onMessage);
  } else {
    socket.addEventListener('close', onClose);
    socket.addEventListener('message', onMessage);
  }
}

function sendCommand(method, params = {}, sessionId = null, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    if (!socket || (socket.readyState !== WS.OPEN && socket.readyState !== 1)) {
      reject(new Error('浏览器尚未连接'));
      return;
    }

    const id = nextCommandId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;

    const timer = setTimeout(() => {
      inflight.delete(id);
      reject(new Error(`命令超时: ${method}`));
    }, timeoutMs);

    inflight.set(id, { resolve, reject, timer });
    try {
      socket.send(JSON.stringify(payload));
    } catch (error) {
      clearTimeout(timer);
      inflight.delete(id);
      reject(error);
    }
  });
}

async function enablePortGuard(sessionId) {
  if (!browserPort || guardedSessions.has(sessionId)) return;
  try {
    await sendCommand('Fetch.enable', {
      patterns: [
        { urlPattern: `http://127.0.0.1:${browserPort}/*`, requestStage: 'Request' },
        { urlPattern: `http://localhost:${browserPort}/*`, requestStage: 'Request' },
      ],
    }, sessionId);
    guardedSessions.add(sessionId);
  } catch {}
}

async function attachToTarget(targetId) {
  const response = await sendCommand('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = response.result?.sessionId;
  if (!sessionId) throw new Error('无法附加到页面上下文');
  for (const [pageId, page] of pages.entries()) {
    if (page.targetId === targetId) {
      pages.set(pageId, { ...page, sessionId, lastAttachAt: new Date().toISOString() });
      break;
    }
  }
  await enablePortGuard(sessionId);
  return sessionId;
}

async function isSessionUsable(sessionId) {
  if (!sessionId) return false;
  try {
    const response = await sendCommand('Runtime.evaluate', {
      expression: '({ href: location.href, title: document.title, readyState: document.readyState })',
      returnByValue: true,
      awaitPromise: true,
    }, sessionId, 4000);
    return !response.result?.exceptionDetails;
  } catch {
    return false;
  }
}

async function ensurePage(pageId) {
  await ensureConnection();
  const page = pages.get(pageId);
  if (!page) throw new Error(`未知 pageId: ${pageId}`);

  if (page.sessionId) {
    const usable = await isSessionUsable(page.sessionId);
    if (usable) return page;
    pages.set(pageId, { ...page, sessionId: null, lastRecoveryAt: new Date().toISOString() });
  }

  try {
    const sessionId = await attachToTarget(page.targetId);
    const next = {
      ...pages.get(pageId),
      sessionId,
      lastRecoveryAt: new Date().toISOString(),
    };
    pages.set(pageId, next);
    return next;
  } catch (error) {
    await ensureConnection();
    const retrySessionId = await attachToTarget(page.targetId);
    const next = {
      ...pages.get(pageId),
      sessionId: retrySessionId,
      lastRecoveryAt: new Date().toISOString(),
    };
    pages.set(pageId, next);
    return next;
  }
}

async function waitUntilReady(sessionId, timeoutMs = 15000) {
  await sendCommand('Page.enable', {}, sessionId);

  return new Promise((resolve) => {
    let resolved = false;
    const done = (result) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      clearInterval(checkInterval);
      resolve(result);
    };

    const timer = setTimeout(() => done('timeout'), timeoutMs);
    const checkInterval = setInterval(async () => {
      try {
        const state = await sendCommand('Runtime.evaluate', {
          expression: 'document.readyState',
          returnByValue: true,
        }, sessionId, 5000);
        if (state.result?.result?.value === 'complete') {
          done('complete');
        }
      } catch {
        // 忽略，继续等下一轮
      }
    }, 500);
  });
}

async function pageSnapshot(sessionId) {
  const response = await sendCommand('Runtime.evaluate', {
    expression: `JSON.stringify({ title: document.title, url: location.href, readyState: document.readyState })`,
    returnByValue: true,
  }, sessionId);

  try {
    return JSON.parse(response.result?.result?.value || '{}');
  } catch {
    return {};
  }
}

async function ensureNavigated(sessionId, targetUrl, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const snap = await pageSnapshot(sessionId).catch(() => ({}));
    if (snap?.url === targetUrl) return snap;
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  return pageSnapshot(sessionId).catch(() => ({}));
}

async function ensureDom(sessionId) {
  await sendCommand('DOM.enable', {}, sessionId);
}

async function queryNode(sessionId, selector) {
  await ensureDom(sessionId);
  const doc = await sendCommand('DOM.getDocument', {}, sessionId);
  const node = await sendCommand('DOM.querySelector', {
    nodeId: doc.result.root.nodeId,
    selector,
  }, sessionId);
  const nodeId = node.result?.nodeId;
  if (!nodeId) throw new Error(`未找到元素: ${selector}`);
  return nodeId;
}

async function detectContentCarrier(sessionId) {
  const response = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const clean = s => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      const first = selectors => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el;
        }
        return null;
      };
      const frame = first(['iframe', 'frame']);
      const embed = first(['embed', 'object']);
      const htmlBody = clean((document.body && document.body.innerText) || '');
      const bodyNode = first(['.article-content','.content','.main-content','.TRS_Editor','#zoom','.zoom','article','.detail','.details','.xl_content','.wp_articlecontent']);
      const bodyText = clean((bodyNode && (bodyNode.innerText || bodyNode.textContent)) || '');
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: clean(a.textContent),
        href: a.href || ''
      })).filter(x => x.href).slice(0, 80);
      return {
        title: document.title,
        pageUrl: location.href,
        hasFrame: !!frame,
        frameSrc: frame ? (frame.src || '') : '',
        hasEmbed: !!embed,
        embedSrc: embed ? (embed.src || embed.data || '') : '',
        bodyText,
        bodyLength: bodyText.length,
        htmlBodyLength: htmlBody.length,
        links,
      };
    })()`,
    returnByValue: true,
  }, sessionId);

  const raw = response.result?.result?.value || {};
  let contentKind = 'html';
  let carrierKind = 'html';
  let resourceUrl = '';
  let viewerUrl = '';
  if (raw.frameSrc) {
    contentKind = 'iframe';
    carrierKind = 'frame';
    resourceUrl = raw.frameSrc;
    viewerUrl = raw.frameSrc;
  }
  if (raw.embedSrc) {
    contentKind = 'embed';
    carrierKind = 'embed';
    resourceUrl = raw.embedSrc;
    viewerUrl = raw.embedSrc;
  }
  const candidate = resourceUrl || '';
  let finalResourceUrl = normalizeResourceUrl(candidate, raw.pageUrl);
  if (/viewer\.html/i.test(finalResourceUrl) || /pdfjs/i.test(finalResourceUrl) || /\bfile=/.test(finalResourceUrl) || /filePath=/.test(finalResourceUrl)) {
    carrierKind = 'viewer';
    try {
      const parsed = new URL(finalResourceUrl);
      const fileParam = parsed.searchParams.get('file') || parsed.searchParams.get('filePath');
      if (fileParam) {
        finalResourceUrl = normalizeResourceUrl(fileParam, finalResourceUrl);
        const kind = classifyResourceKind(finalResourceUrl);
        contentKind = kind;
        if (kind !== 'resource') carrierKind = kind;
      }
    } catch {}
  } else {
    const kind = classifyResourceKind(finalResourceUrl);
    if (kind !== 'resource') {
      contentKind = kind;
      carrierKind = kind;
    }
  }

  const alternativeResources = (raw.links || [])
    .map(link => ({
      text: link.text || '',
      resourceUrl: normalizeResourceUrl(link.href, raw.pageUrl),
    }))
    .map(link => ({
      ...link,
      kind: classifyResourceKind(link.resourceUrl, link.text),
    }))
    .filter(link => link.kind !== 'resource')
    .slice(0, 20);

  return {
    ...raw,
    contentKind,
    carrierKind,
    viewerUrl,
    resourceUrl: finalResourceUrl,
    alternativeResources,
  };
}

function downloadToFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https://') ? https : http;
    const file = fs.createWriteStream(filePath);
    const request = mod.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(filePath, () => {
          const nextUrl = new URL(response.headers.location, url).href;
          downloadToFile(nextUrl, filePath).then(resolve).catch(reject);
        });
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filePath, () => reject(new Error(`下载失败: HTTP ${response.statusCode}`)));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve(filePath)));
    });
    request.on('error', (error) => {
      file.close();
      fs.unlink(filePath, () => reject(error));
    });
  });
}

async function downloadViaBrowser(sessionId, resourceUrl, filePath) {
  const response = await sendCommand('Runtime.evaluate', {
    expression: `fetch(${JSON.stringify(resourceUrl)}, { credentials: 'include' })
      .then(async (resp) => {
        const status = resp.status;
        if (!resp.ok) return { ok: false, status };
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.slice(i, i + chunk));
        }
        return { ok: true, status, base64: btoa(binary) };
      })`,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId, 120000);

  const result = response.result?.result?.value;
  if (!result?.ok || !result?.base64) {
    throw new Error(`浏览器上下文下载失败: HTTP ${result?.status || 'unknown'}`);
  }
  fs.writeFileSync(filePath, Buffer.from(result.base64, 'base64'));
  return filePath;
}

function runPythonPdfExtract(pdfPath) {
  const script = `
import json, sys
pdf_path = sys.argv[1]
result = {"ok": False, "engine": None, "text": ""}
try:
    import fitz
    doc = fitz.open(pdf_path)
    text = []
    for page in doc:
        text.append(page.get_text())
    result = {"ok": True, "engine": "fitz", "text": "\\n".join(text)}
except Exception:
    try:
        from pdfminer.high_level import extract_text
        result = {"ok": True, "engine": "pdfminer", "text": extract_text(pdf_path)}
    except Exception as e:
        result = {"ok": False, "engine": None, "text": "", "error": str(e)}
print(json.dumps(result, ensure_ascii=False))
`;
  return new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', script, pdfPath], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => stdout += chunk);
    child.stderr.on('data', chunk => stderr += chunk);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `python 提取失败: ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function runPythonDocxExtract(docxPath) {
  const script = `
import json, sys, zipfile, re
from xml.etree import ElementTree as ET
path = sys.argv[1]
result = {"ok": False, "engine": "python-stdlib-docx", "text": ""}
try:
    with zipfile.ZipFile(path, 'r') as z:
        xml = z.read('word/document.xml')
    root = ET.fromstring(xml)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = []
    for p in root.findall('.//w:p', ns):
        texts = []
        for t in p.findall('.//w:t', ns):
            if t.text:
                texts.append(t.text)
        line = ''.join(texts).strip()
        if line:
            paragraphs.append(line)
    text = '\n'.join(paragraphs)
    text = re.sub(r'\n{3,}', '\n\n', text)
    result = {"ok": True, "engine": "python-stdlib-docx", "text": text}
except Exception as e:
    result = {"ok": False, "engine": "python-stdlib-docx", "text": "", "error": str(e)}
print(json.dumps(result, ensure_ascii=False))
`;
  return new Promise((resolve, reject) => {
    const child = spawn('python3', ['-c', script, docxPath], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => stdout += chunk);
    child.stderr.on('data', chunk => stderr += chunk);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `python 提取失败: ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function downloadResourceWithFallback(resourceUrl, ext = 'bin', sessionId = null) {
  const tmpPath = path.join(os.tmpdir(), `nexurf-${crypto.randomUUID()}.${ext}`);
  let downloadMode = 'direct';
  try {
    await downloadToFile(resourceUrl, tmpPath);
  } catch (error) {
    if (!sessionId) throw error;
    downloadMode = 'browser';
    await downloadViaBrowser(sessionId, resourceUrl, tmpPath);
  }
  return { tmpPath, downloadMode };
}

function guessImageExtension(resourceUrl = '') {
  const lower = String(resourceUrl).toLowerCase();
  if (/\.png($|\?)/.test(lower)) return 'png';
  if (/\.jpe?g($|\?)/.test(lower)) return 'jpg';
  if (/\.webp($|\?)/.test(lower)) return 'webp';
  if (/\.gif($|\?)/.test(lower)) return 'gif';
  if (/\.bmp($|\?)/.test(lower)) return 'bmp';
  return 'img';
}

async function extractContentFromCarrier(carrier, sessionId = null) {
  const resourceUrl = carrier?.resourceUrl || '';
  const alternatives = carrier?.alternativeResources || [];

  if (carrier?.contentKind === 'html') {
    if (!sessionId) {
      return { ok: false, reason: 'html_session_required', contentKind: 'html' };
    }
    const response = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const clean = s => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        const candidates = [
          '.article-content','.content','.main-content','.TRS_Editor','#zoom','.zoom',
          'article','.detail','.details','.xl_content','.wp_articlecontent','main','body'
        ];
        let node = null;
        for (const sel of candidates) {
          node = document.querySelector(sel);
          if (node && clean(node.innerText || node.textContent || '').length >= 80) break;
        }
        if (!node) node = document.body;
        const text = clean((node && (node.innerText || node.textContent)) || '');
        return {
          ok: !!text,
          title: document.title || '',
          text,
          pageUrl: location.href,
          usedSelector: node === document.body ? 'body' : (node?.tagName || 'unknown')
        };
      })()`,
      returnByValue: true,
      awaitPromise: true,
    }, sessionId);
    const result = response.result?.result?.value || {};
    return {
      ok: Boolean(result?.ok),
      contentKind: 'html',
      contentSourceType: 'dom',
      resourceUrl: carrier?.pageUrl || '',
      contentText: (result?.text || '').slice(0, 30000),
      extractionConfidence: result?.ok ? 'medium' : 'low',
      title: result?.title || carrier?.title || '',
      usedSelector: result?.usedSelector || null,
    };
  }

  if (!resourceUrl) {
    return { ok: false, reason: 'no_resource_url', contentKind: carrier?.contentKind || 'unknown' };
  }
  if (carrier.contentKind === 'pdf') {
    const { tmpPath, downloadMode } = await downloadResourceWithFallback(resourceUrl, 'pdf', sessionId);
    const extracted = await runPythonPdfExtract(tmpPath);
    try { fs.unlinkSync(tmpPath); } catch {}
    return {
      ok: Boolean(extracted?.ok),
      contentKind: 'pdf',
      resourceUrl,
      engine: extracted?.engine || null,
      downloadMode,
      contentText: (extracted?.text || '').slice(0, 30000),
      extractionConfidence: extracted?.ok ? 'high' : 'low',
    };
  }
  if (carrier.contentKind === 'ofd') {
    const pdfAlternative = alternatives.find(item => item.kind === 'pdf');
    if (pdfAlternative) {
      const extraction = await extractContentFromCarrier({
        ...carrier,
        contentKind: 'pdf',
        carrierKind: 'pdf',
        resourceUrl: pdfAlternative.resourceUrl,
      }, sessionId);
      return {
        ...extraction,
        sourceContentKind: 'ofd',
        fallbackUsed: 'pdf_alternative',
        originalResourceUrl: resourceUrl,
      };
    }
    return {
      ok: false,
      reason: 'ofd_native_extractor_not_available',
      contentKind: 'ofd',
      resourceUrl,
      extractionConfidence: 'low',
      alternativeResources: alternatives,
      fallbackSuggestion: '优先寻找同页 PDF/HTML 预览或继续走浏览器截图/OCR 兜底',
    };
  }
  if (carrier.contentKind === 'office') {
    if (/\.docx($|\?)/i.test(resourceUrl)) {
      const tmpPath = path.join(os.tmpdir(), `nexurf-${crypto.randomUUID()}.docx`);
      let downloadMode = 'direct';
      try {
        await downloadToFile(resourceUrl, tmpPath);
      } catch (error) {
        if (!sessionId) throw error;
        downloadMode = 'browser';
        await downloadViaBrowser(sessionId, resourceUrl, tmpPath);
      }
      const extracted = await runPythonDocxExtract(tmpPath);
      try { fs.unlinkSync(tmpPath); } catch {}
      if (extracted?.ok && (extracted?.text || '').trim()) {
        return {
          ok: true,
          contentKind: 'office',
          resourceUrl,
          engine: extracted.engine || 'python-stdlib-docx',
          downloadMode,
          contentText: (extracted.text || '').slice(0, 30000),
          extractionConfidence: 'medium',
        };
      }
    }
    const pdfAlternative = alternatives.find(item => item.kind === 'pdf');
    if (pdfAlternative) {
      const extraction = await extractContentFromCarrier({
        ...carrier,
        contentKind: 'pdf',
        carrierKind: 'pdf',
        resourceUrl: pdfAlternative.resourceUrl,
      }, sessionId);
      return {
        ...extraction,
        sourceContentKind: 'office',
        fallbackUsed: 'pdf_alternative',
        originalResourceUrl: resourceUrl,
      };
    }
    return {
      ok: false,
      reason: 'office_native_extractor_not_available',
      contentKind: 'office',
      resourceUrl,
      extractionConfidence: 'low',
      alternativeResources: alternatives,
      fallbackSuggestion: 'DOCX 可优先走轻量原生提取；其他 Office 格式优先寻找 PDF/HTML 预览，没有再考虑浏览器截图或后续轻量解析器',
    };
  }
  if (carrier.contentKind === 'image') {
    const { tmpPath, downloadMode } = await downloadResourceWithFallback(resourceUrl, guessImageExtension(resourceUrl), sessionId);
    return {
      ok: true,
      contentKind: 'image',
      resourceUrl,
      savedPath: tmpPath,
      downloadMode,
      extractionConfidence: 'low',
      fallbackUsed: 'image_resource_saved',
      fallbackSuggestion: '当前先保存原图资源；后续可接 OCR / 视觉识别读取正文',
    };
  }
  return {
    ok: false,
    reason: 'extractor_not_implemented',
    contentKind: carrier.contentKind,
    resourceUrl,
    alternativeResources: alternatives,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const route = url.pathname;

  try {
    if (route === '/health') {
      const browserConnected = Boolean(socket && (socket.readyState === WS.OPEN || socket.readyState === 1));
      const pageEntries = Array.from(pages.entries());
      const pageChecks = await Promise.all(pageEntries.map(async ([pageId, page]) => {
        let usable = false;
        try {
          usable = page.sessionId ? await isSessionUsable(page.sessionId) : false;
        } catch {
          usable = false;
        }
        return {
          pageId,
          targetId: page.targetId,
          hasSession: Boolean(page.sessionId),
          usable,
          createdAt: page.createdAt,
          lastAttachAt: page.lastAttachAt || null,
          lastDetachAt: page.lastDetachAt || null,
          lastDisconnectAt: page.lastDisconnectAt || null,
          lastRecoveryAt: page.lastRecoveryAt || null,
        };
      }));
      json(res, 200, {
        ok: true,
        service: 'nexurf-bridge',
        port: PORT,
        browser: {
          connected: browserConnected,
          port: browserPort,
        },
        pages: {
          total: pages.size,
          usable: pageChecks.filter(v => v.usable).length,
          stale: pageChecks.filter(v => v.hasSession && !v.usable).length,
          detached: pageChecks.filter(v => !v.hasSession).length,
          items: pageChecks,
        },
      });
      return;
    }

    if (route === '/pages' || route === '/targets') {
      const items = [];
      for (const [pageId, page] of pages.entries()) {
        items.push({
          pageId,
          targetId: page.targetId,
          createdAt: page.createdAt,
          attached: Boolean(page.sessionId),
          lastAttachAt: page.lastAttachAt || null,
          lastDetachAt: page.lastDetachAt || null,
          lastDisconnectAt: page.lastDisconnectAt || null,
          lastRecoveryAt: page.lastRecoveryAt || null,
        });
      }
      json(res, 200, { ok: true, items });
      return;
    }

    if (route === '/open' || route === '/new') {
      await ensureConnection();
      const { bodyText, bodyJson } = await getRequestPayload(req);
      const targetUrl = pickUrlInput(url, bodyJson, bodyText) || 'about:blank';
      const response = await sendCommand('Target.createTarget', { url: targetUrl, background: true });
      const targetId = response.result?.targetId;
      if (!targetId) throw new Error('页面上下文创建失败');

      const pageId = createPageId();
      const sessionId = await attachToTarget(targetId);
      pages.set(pageId, { targetId, sessionId, createdAt: new Date().toISOString() });

      let snapshot = await pageSnapshot(sessionId).catch(() => ({}));
      if (targetUrl !== 'about:blank') {
        await waitUntilReady(sessionId);
        snapshot = await ensureNavigated(sessionId, targetUrl);
        if (snapshot?.url !== targetUrl) {
          await sendCommand('Page.navigate', { url: targetUrl }, sessionId);
          await waitUntilReady(sessionId);
          snapshot = await ensureNavigated(sessionId, targetUrl);
        }
      }

      json(res, 200, { ok: true, pageId, page: snapshot });
      return;
    }

    if (route === '/goto' || route === '/navigate') {
      const { bodyText, bodyJson } = await getRequestPayload(req);
      const pageId = bodyJson?.pageId || bodyJson?.target || url.searchParams.get('pageId') || url.searchParams.get('target');
      const targetUrl = bodyJson?.url || url.searchParams.get('url') || bodyJson?.targetUrl || bodyText;
      if (!pageId || !targetUrl) return fail(res, 400, 'bad_request', 'pageId 和 url 都是必填参数');
      const page = await ensurePage(pageId);
      const response = await sendCommand('Page.navigate', { url: targetUrl }, page.sessionId);
      await waitUntilReady(page.sessionId);
      let snapshot = await ensureNavigated(page.sessionId, targetUrl);
      if (snapshot?.url !== targetUrl) {
        await sendCommand('Page.navigate', { url: targetUrl }, page.sessionId);
        await waitUntilReady(page.sessionId);
        snapshot = await ensureNavigated(page.sessionId, targetUrl);
      }
      json(res, 200, { ok: true, navigation: response.result || {}, page: snapshot });
      return;
    }

    if (route === '/back') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const page = await ensurePage(pageId);
      await sendCommand('Runtime.evaluate', { expression: 'history.back()' }, page.sessionId);
      await waitUntilReady(page.sessionId);
      json(res, 200, { ok: true, pageId, page: await pageSnapshot(page.sessionId) });
      return;
    }

    if (route === '/inspect' || route === '/info') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const page = await ensurePage(pageId);
      json(res, 200, { ok: true, pageId, page: await pageSnapshot(page.sessionId) });
      return;
    }

    if (route === '/eval') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const bodyText = await readBody(req);
      const bodyJson = parseMaybeJson(bodyText);
      const expression = bodyJson?.expression || url.searchParams.get('expression') || url.searchParams.get('expr') || bodyText || 'document.title';
      const page = await ensurePage(pageId);
      const response = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      }, page.sessionId);
      if (response.result?.exceptionDetails) {
        return fail(res, 400, 'eval_failed', response.result.exceptionDetails.text || '页面脚本执行失败', response.result.exceptionDetails);
      }
      json(res, 200, { ok: true, pageId, result: response.result?.result?.value ?? response.result?.result ?? null });
      return;
    }

    if (route === '/tap' || route === '/click') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const bodyText = await readBody(req);
      const bodyJson = parseMaybeJson(bodyText);
      const selector = bodyJson?.selector || url.searchParams.get('selector') || bodyText;
      if (!selector) return fail(res, 400, 'bad_request', 'selector 是必填参数');
      const page = await ensurePage(pageId);
      const selectorJson = JSON.stringify(selector);
      const response = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector(${selectorJson});
          if (!el) return { ok: false, error: '未找到元素' };
          el.scrollIntoView({ block: 'center' });
          el.click();
          return { ok: true, tag: el.tagName, text: (el.textContent || '').slice(0, 100) };
        })()`,
        returnByValue: true,
        awaitPromise: true,
      }, page.sessionId);
      const result = response.result?.result?.value;
      if (!result?.ok) return fail(res, 400, 'tap_failed', result?.error || '点击失败');
      json(res, 200, { ok: true, pageId, action: result });
      return;
    }

    if (route === '/clickAt') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const bodyText = await readBody(req);
      const bodyJson = parseMaybeJson(bodyText);
      const selector = bodyJson?.selector || url.searchParams.get('selector') || bodyText;
      if (!selector) return fail(res, 400, 'bad_request', 'selector 是必填参数');
      const page = await ensurePage(pageId);
      const selectorJson = JSON.stringify(selector);
      const coordResponse = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector(${selectorJson});
          if (!el) return { ok: false, error: '未找到元素' };
          el.scrollIntoView({ block: 'center' });
          const rect = el.getBoundingClientRect();
          return { ok: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, tag: el.tagName, text: (el.textContent || '').slice(0, 100) };
        })()`,
        returnByValue: true,
        awaitPromise: true,
      }, page.sessionId);
      const coord = coordResponse.result?.result?.value;
      if (!coord?.ok) return fail(res, 400, 'click_at_failed', coord?.error || '无法定位元素');
      await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: coord.x, y: coord.y, button: 'left', clickCount: 1 }, page.sessionId);
      await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: coord.x, y: coord.y, button: 'left', clickCount: 1 }, page.sessionId);
      json(res, 200, { ok: true, pageId, action: coord });
      return;
    }

    if (route === '/upload' || route === '/setFiles') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const bodyText = await readBody(req);
      const bodyJson = parseMaybeJson(bodyText);
      const selector = bodyJson?.selector || url.searchParams.get('selector');
      const files = bodyJson?.files;
      if (!selector || !Array.isArray(files) || files.length === 0) return fail(res, 400, 'bad_request', 'upload 需要 selector 和 files[]');
      const page = await ensurePage(pageId);
      const nodeId = await queryNode(page.sessionId, selector);
      await sendCommand('DOM.setFileInputFiles', { nodeId, files }, page.sessionId);
      json(res, 200, { ok: true, pageId, uploaded: files.length });
      return;
    }

    if (route === '/scroll') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const direction = url.searchParams.get('direction') || 'down';
      const y = Number(url.searchParams.get('y') || '3000');
      const page = await ensurePage(pageId);
      let expression = `window.scrollBy(0, ${Math.abs(y)}); 'scrolled down';`;
      if (direction === 'up') expression = `window.scrollBy(0, -${Math.abs(y)}); 'scrolled up';`;
      if (direction === 'top') expression = `window.scrollTo(0, 0); 'scrolled to top';`;
      if (direction === 'bottom') expression = `window.scrollTo(0, document.body.scrollHeight); 'scrolled to bottom';`;
      const response = await sendCommand('Runtime.evaluate', { expression, returnByValue: true }, page.sessionId);
      await new Promise(resolve => setTimeout(resolve, 800));
      json(res, 200, { ok: true, pageId, result: response.result?.result?.value ?? null });
      return;
    }

    if (route === '/snap' || route === '/screenshot') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const format = url.searchParams.get('format') || 'png';
      const file = url.searchParams.get('file');
      const page = await ensurePage(pageId);
      const response = await sendCommand('Page.captureScreenshot', {
        format,
        quality: format === 'jpeg' ? 80 : undefined,
      }, page.sessionId);
      const data = response.result?.data;
      if (!data) return fail(res, 500, 'snap_failed', '截图失败');
      if (file) {
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        json(res, 200, { ok: true, pageId, saved: file });
        return;
      }
      json(res, 200, { ok: true, pageId, data });
      return;
    }

    if (route === '/carrier') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const page = await ensurePage(pageId);
      const carrier = await detectContentCarrier(page.sessionId);
      json(res, 200, { ok: true, pageId, carrier });
      return;
    }

    if (route === '/extract') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const page = await ensurePage(pageId);
      const carrier = await detectContentCarrier(page.sessionId);
      const extraction = await extractContentFromCarrier(carrier, page.sessionId);
      json(res, 200, { ok: true, pageId, carrier, extraction });
      return;
    }

    if (route === '/close') {
      const pageId = url.searchParams.get('pageId') || url.searchParams.get('target');
      if (!pageId) return fail(res, 400, 'bad_request', 'pageId 是必填参数');
      const page = pages.get(pageId);
      if (!page) return fail(res, 404, 'page_not_found', `未找到页面上下文: ${pageId}`);
      await ensureConnection();
      await sendCommand('Target.closeTarget', { targetId: page.targetId });
      pages.delete(pageId);
      json(res, 200, { ok: true, pageId, closed: true });
      return;
    }

    fail(res, 404, 'not_found', '未知路由', {
      endpoints: {
        '/health': 'GET - 健康检查',
        '/targets': 'GET - 列出所有页面上下文',
        '/new?url=': 'GET/POST - 创建新后台页面（自动等待加载）',
        '/close?target=': 'GET - 关闭页面上下文',
        '/navigate?target=&url=': 'GET/POST - 导航（自动等待加载）',
        '/back?target=': 'GET - 后退',
        '/info?target=': 'GET - 页面标题/URL/状态',
        '/eval?target=': 'POST body=JS表达式 - 执行 JS',
        '/click?target=': 'POST body=CSS选择器 - 点击元素',
        '/clickAt?target=': 'POST body=CSS选择器 - 浏览器级真实点击',
        '/scroll?target=&y=&direction=': 'GET - 滚动页面',
        '/screenshot?target=&file=': 'GET - 截图',
        '/setFiles?target=': 'POST body={selector,files} - 给 file input 设置文件',
      },
    });
  } catch (error) {
    fail(res, 500, 'bridge_error', error.message || 'bridge 执行失败');
  }
});

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => { s.close(); resolve(true); });
    s.listen(port, '127.0.0.1');
  });
}

async function main() {
  const available = await checkPortAvailable(PORT);
  if (!available) {
    try {
      const ok = await new Promise((resolve) => {
        http.get(`http://127.0.0.1:${PORT}/health`, { timeout: 2000 }, (res) => {
          let buf = '';
          res.on('data', c => buf += c);
          res.on('end', () => resolve(buf.includes('nexurf-bridge')));
        }).on('error', () => resolve(false));
      });
      if (ok) {
        console.log(`[nexurf] existing bridge detected on port ${PORT}, exit`);
        process.exit(0);
      }
    } catch {}
    console.error(`[nexurf] port ${PORT} is occupied`);
    process.exit(1);
  }

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[nexurf] bridge listening on http://127.0.0.1:${PORT}`);
    ensureConnection().catch(error => {
      console.error('[nexurf] initial browser connect failed:', error.message, '（将在首次请求时重试）');
    });
  });
}

process.on('uncaughtException', (error) => {
  console.error('[nexurf] uncaughtException:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('[nexurf] unhandledRejection:', error?.message || error);
});

await main();
