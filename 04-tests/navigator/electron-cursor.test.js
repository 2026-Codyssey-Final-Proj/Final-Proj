// claude-drafted: 2026-10-19 — 이재엽 "플로로가 자기 오버레이가 아니면 마우스커서를 따라오지 못하는 문제".
// 화면은 자기 창 안의 mousemove만 받는데, 앱 창이 섬 크기로 줄어든 뒤(앱 3.0.1)로는 커서가 거의 늘 창 밖이다.
// 그래서 앱(main.js)이 바탕 화면의 커서를 1초에 20번까지 읽어 창 밖일 때만 화면에 보낸다(preload onCursor). electron 모듈 없이 돈다.
// 실행: node --test 04-tests/navigator/electron-cursor.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");

const WIN = { x: 400, y: 0, width: 952, height: 140 };   // 앱이 처음 뜨는 섬 크기 창

test("창 밖 커서는 창 왼쪽 위 기준 좌표로 — 위 · 아래 · 왼쪽 · 오른쪽 어디든(음수도)", () => {
  assert.deepEqual(L.cursorMsg({ x: 900, y: 600 }, WIN, null), { x: 500, y: 600 }, "창 아래(코딩 도구 위)");
  assert.deepEqual(L.cursorMsg({ x: 10, y: 50 }, WIN, null), { x: -390, y: 50 }, "창 왼쪽");
  assert.deepEqual(L.cursorMsg({ x: 1400, y: 20 }, WIN, null), { x: 1000, y: 20 }, "창 오른쪽");
  assert.deepEqual(L.cursorMsg({ x: 900.6, y: 300.4 }, WIN, null), { x: 501, y: 300 }, "반올림");
});

test("창 안이면 보내지 않는다 — 화면의 mousemove가 맡는다. 지난번과 같은 자리도 보내지 않는다", () => {
  assert.equal(L.cursorMsg({ x: 400, y: 0 }, WIN, null), null, "왼쪽 위 모서리는 창 안");
  assert.equal(L.cursorMsg({ x: 1351, y: 139 }, WIN, null), null);
  assert.deepEqual(L.cursorMsg({ x: 1352, y: 139 }, WIN, null), { x: 952, y: 139 }, "오른쪽 끝 바로 바깥");
  assert.equal(L.cursorMsg({ x: 900, y: 600 }, WIN, { x: 500, y: 600 }), null, "그대로면 보내지 않는다");
  assert.equal(L.cursorMsg(null, WIN, null), null);
  assert.equal(L.cursorMsg({ x: 1, y: 1 }, null, null), null);
});

test("앱이 커서를 보내고, 창이 닫히면 멈춘다 — 1초에 20번까지", () => {
  const main = read("electron/main.js");
  assert.match(main, /getCursorScreenPoint\(\)/);
  assert.match(main, /L\.cursorMsg\(/);
  assert.match(main, /webContents\.send\("floe:cursor"/);
  assert.match(main, /\}, 50\);/, "50ms마다");
  assert.match(main, /clearInterval\(cursorTick\)/, "창이 닫히면 멈춘다");
  assert.match(read("electron/preload.js"), /onCursor: \(cb\) =>[^\n]*ipcRenderer\.on\("floe:cursor"/);
});

test("내비게이터 · 서고 모두 창 밖 커서로 눈을 움직인다 — 졸음은 깨우지 않는다(activity는 이 창을 쓸 때만)", () => {
  for (const f of ["navigator/app.js", "library/library.js"]) {
    const line = read(f).split("\n").find((l) => l.includes("floeApp.onCursor"));
    assert.ok(line, `${f}에 onCursor`);
    assert.match(line, /follow\(/, `${f}: 눈을 움직인다`);
    assert.doesNotMatch(line, /activity\(/, `${f}: 창 밖 커서로 졸음을 깨우지 않는다`);
  }
});
