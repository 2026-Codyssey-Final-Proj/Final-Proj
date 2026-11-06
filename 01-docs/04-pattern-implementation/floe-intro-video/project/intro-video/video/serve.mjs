// 미리 보기 · 렌더용 작은 파일 서버. 뿌리는 codyssey/final-project/ — 영상(/intro-video/...)과
// 팀 저장소의 플로로 · 글꼴(/Final-Proj/...)을 한 출처에서 열기 위해서다. 뿌리 밖은 열지 않는다.
// 실행: node video/serve.mjs  →  미리 보기 주소를 출력한다
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.webp': 'image/webp',
};

function resolveInside(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  const full = path.resolve(ROOT, '.' + path.posix.normalize('/' + decoded).replace(/^\/+/, '/'));
  const raw = path.resolve(ROOT, '.' + (decoded.startsWith('/') ? decoded : '/' + decoded));
  // 정리하기 전 경로가 뿌리를 벗어나면(..) 정리 결과와 상관없이 막는다
  if (!raw.startsWith(ROOT + path.sep) || !full.startsWith(ROOT + path.sep)) return null;
  return raw === full ? full : null;
}

export function startServer({ port = 4410 } = {}) {
  const server = http.createServer(async (req, res) => {
    const file = resolveInside(req.url || '/');
    if (!file) { res.writeHead(404); res.end('not found'); return; }
    try {
      const s = await stat(file);
      if (!s.isFile()) throw new Error('not a file');
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const p = server.address().port;
      resolve({ url: `http://127.0.0.1:${p}`, port: p, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await startServer({ port: Number(process.env.PORT) || 4410 });
  console.log(`미리 보기: ${url}/intro-video/video/index.html`);
}
