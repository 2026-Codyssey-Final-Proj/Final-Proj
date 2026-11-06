import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer } from '../serve.mjs';

const srv = await startServer({ port: 0 });
after(() => srv.close());

// fetch는 '..'을 미리 정리해 버리므로 경로를 그대로 보내는 http.get으로 잰다
const status = (path) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port: srv.port, path }, (res) => { res.resume(); resolve(res.statusCode); }).on('error', reject);
});

test('영상 페이지를 연다', async () => {
  assert.equal(await status('/intro-video/video/index.html'), 200);
});

test('팀 저장소의 플로로 코드를 연다(읽기만)', async () => {
  assert.equal(await status('/Final-Proj/02-frontend/navigator/seal.js'), 200);
});

test('뿌리 밖으로 나가는 경로는 404 — 그 밖에 실제 파일이 있어도', async () => {
  assert.equal(await status('/../../CLAUDE.md'), 404);
  assert.equal(await status('/..%2f..%2fCLAUDE.md'), 404);
  assert.equal(await status('/intro-video/%2e%2e/%2e%2e/%2e%2e/CLAUDE.md'), 404);
});

test('없는 파일은 404', async () => {
  assert.equal(await status('/intro-video/video/nothing-here.html'), 404);
});
