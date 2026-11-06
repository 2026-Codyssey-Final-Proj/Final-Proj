// 크롬 헤드리스를 띄우고 DevTools 프로토콜(CDP)로 한 페이지를 다룬다 — npm 의존성 없이 Node 내장 WebSocket만 쓴다.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';

const DEFAULT_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.once('error', reject);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

async function waitJson(url, ms = 20000) {
  const until = Date.now() + ms;
  for (;;) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch { /* 아직 안 떴음 */ }
    if (Date.now() > until) throw new Error(`크롬이 응답하지 않음: ${url}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}

export async function launchChrome({ chromePath = process.env.CHROME_PATH || DEFAULT_CHROME } = {}) {
  const port = await freePort();
  const profile = mkdtempSync(path.join(tmpdir(), 'floe-intro-chrome-'));
  const proc = spawn(chromePath, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '--force-device-scale-factor=1', '--window-size=1920,1080', 'about:blank',
  ], { stdio: 'ignore' });

  const pages = await waitJson(`http://127.0.0.1:${port}/json/list`);
  const page = pages.find((p) => p.type === 'page');
  if (!page) throw new Error('크롬 페이지를 찾지 못함');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('CDP 연결 실패')); });

  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`)); else resolve(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      for (const fn of listeners.get(msg.method)) fn(msg.params);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const once = (method) => new Promise((resolve) => {
    const fn = (p) => { listeners.get(method).delete(fn); resolve(p); };
    if (!listeners.has(method)) listeners.set(method, new Set());
    listeners.get(method).add(fn);
  });
  // 페이지 안에서 식을 계산 — Promise면 기다리고 값을 돌려준다
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`페이지 오류: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  };
  const close = async () => {
    try { ws.close(); } catch { /* 이미 닫힘 */ }
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
    else proc.kill('SIGKILL');
    await new Promise((r) => setTimeout(r, 300));
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* 크롬이 아직 잡고 있으면 남겨 둔다 */ }
  };
  return { send, once, evaluate, close };
}
