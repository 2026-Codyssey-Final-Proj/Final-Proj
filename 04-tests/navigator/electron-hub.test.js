// claude-drafted: 2026-10-20 — 이재엽 요청(C-11 모아 보기 창). 페이블 넘김 문서 6절 "앱 창" 줄.
// 앱(main.js)이 모아 보기 창을 여는 길 — 메뉴 "모아 보기 열기" · 트레이 · Dock(activate) · 섬의 단추(IPC floe:open-hub) — 와, 창이 보통 창(항상 위 아님)인 것,
// 바이브 코딩 '들어가기'가 섬으로 가는 IPC(floe:enter), preload의 openHub · enter · onEnter, lib.js의 창 크기 순수 함수를 본다.
// electron 모듈 없이 — main.js · preload.js · app.js는 글로 맞대어 본다(electron-cursor.test.js와 같은 방식).
// 실행: node --test 04-tests/navigator/electron-hub.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");

test("창 크기(hubBounds): 기본 900×600을 작업 영역 가운데에", () => {
  const b = L.hubBounds({ x: 0, y: 25, width: 1440, height: 875 }, null);
  assert.deepEqual(b, { x: 270, y: 25 + Math.round((875 - 600) / 2), width: 900, height: 600 });
});

test("창 크기(hubBounds): 작업 영역이 더 작으면 그만큼 줄이고 안에 둔다 — 두 번째 화면(x·y가 0이 아님)도", () => {
  const b = L.hubBounds({ x: -800, y: 100, width: 800, height: 500 }, null);
  assert.deepEqual(b, { x: -800, y: 100, width: 800, height: 500 });
});

test("창 크기(hubBounds): 지난 크기 · 자리(saved)가 있으면 그것을 쓰되 작업 영역 안으로 당긴다", () => {
  const wa = { x: 0, y: 0, width: 1440, height: 900 };
  assert.deepEqual(L.hubBounds(wa, { x: 100, y: 80, width: 700, height: 500 }), { x: 100, y: 80, width: 700, height: 500 });
  assert.deepEqual(L.hubBounds(wa, { x: 1200, y: -50, width: 700, height: 500 }), { x: 740, y: 0, width: 700, height: 500 }, "오른쪽 · 위 밖이면 안으로");
  assert.deepEqual(L.hubBounds(wa, { x: 0, y: 0, width: 3000, height: 3000 }), { x: 0, y: 0, width: 1440, height: 900 }, "너무 크면 작업 영역만큼");
  assert.equal(L.hubBounds(wa, { x: "a", width: 0 }).width, 900, "이상한 saved는 기본값");
  assert.ok(L.hubBounds(wa, { width: 100, height: 100 }).width >= 480 && L.hubBounds(wa, { width: 100, height: 100 }).height >= 420, "최소 크기보다 작게는 안 된다");
});

test("main.js — 모아 보기 창은 보통 창(테두리 · 항상 위 아님 · 최소 480×420), 하나만, 닫으면 null. 섬 창과 같은 preload · 격리", () => {
  const main = read("electron/main.js");
  const at = main.indexOf("function openHub(space = \"\")");   // 2026-10-20 C-13: space("alerts" · "ai")면 그 칸으로
  assert.ok(at > 0, "openHub");
  const block = main.slice(at, at + 2200);
  assert.match(block, /alwaysOnTop: false/);
  assert.match(block, /minWidth: 480/);
  assert.match(block, /minHeight: 420/);
  assert.match(block, /L\.hubBounds\(/);
  assert.match(block, /hub\/index\.html/);
  assert.match(block, /contextIsolation: true, nodeIntegration: false, sandbox: true/);
  assert.match(block, /hub = null/);
  assert.match(block, /if \(hub\)[\s\S]{0,80}focus\(\)/, "이미 열려 있으면 앞으로");
  assert.doesNotMatch(block, /frame: false/);
  assert.doesNotMatch(block, /transparent: true/);
});

test("main.js — 여는 길 넷: 메뉴 '모아 보기 열기'(버전 줄 다음) · 트레이 클릭 · Dock(activate) · 섬 단추(IPC floe:open-hub)", () => {
  const main = read("electron/main.js");
  assert.match(main, /새 버전 확인 \(Releases\)[^\n]*\n[^\n]*모아 보기 열기[^\n]*openHub\(\)/, "메뉴 — 버전 줄 바로 다음");
  assert.match(main, /tray\.on\("click", \(\) => \{[^\n]*createWindow\(\);[^\n]*openHub\(\)/);
  assert.match(main, /app\.on\("activate", \(\) => \{[^\n]*createWindow\(\);[^\n]*openHub\(\)/);
  assert.match(main, /ipcMain\.on\("floe:open-hub", \(_e, space\) => openHub\(space\)\)/, "섬 단추 · 기본 화면의 크게 보기(그 칸으로, 2026-10-20)");
  assert.match(main, /hub\.loadURL\(`\$\{URL_\}hub\/index\.html\$\{hubSpace\(space\) \? `#\$\{hubSpace\(space\)\}` : ""\}`\)/, "주소 끝으로 그 칸을 연다");
  assert.match(main, /if \(hubSpace\(space\)\) hub\.webContents\.executeJavaScript/, "이미 열려 있으면 주소 끝만 바꾼다");
});

test("main.js — '들어가기'(IPC floe:enter)는 섬 창을 앞으로 보이고 화면에 floe:enter를 보낸다. 섬 창이 없으면 만든다", () => {
  const main = read("electron/main.js");
  const at = main.indexOf('ipcMain.on("floe:enter"');
  assert.ok(at > 0);
  const block = main.slice(at, at + 400);
  assert.match(block, /createWindow\(\)/);
  assert.match(block, /win\.show\(\)/);
  assert.match(block, /win\.focus\(\)/);
  assert.match(block, /win\.webContents\.send\("floe:enter"\)/);
});

test("main.js — 창 크기 함수들(createWindow · expandWindow · floe:resize)은 그대로 있다(다른 세션이 고치는 중 — 건드리지 않는다)", () => {
  const main = read("electron/main.js");
  for (const s of ["function createWindow()", "function expandWindow()", 'ipcMain.on("floe:resize"', 'ipcMain.on("floe:expand"']) assert.ok(main.includes(s), s);
});

test("preload.js — openHub · enter · onEnter(onCursor와 같은 모양, 떼는 함수를 돌려준다)", () => {
  const pre = read("electron/preload.js");
  assert.match(pre, /openHub: \(space\) => ipcRenderer\.send\("floe:open-hub", space \|\| ""\)/, "2026-10-20: 칸을 같이 보낸다");
  assert.match(pre, /enter: \(\) => ipcRenderer\.send\("floe:enter"\)/);
  assert.match(pre, /onEnter: \(cb\) => \{ const h = \(_e, p\) => cb\(p\); ipcRenderer\.on\("floe:enter", h\); return \(\) => ipcRenderer\.removeListener\("floe:enter", h\); \}/);
});

test("섬(app.js) — 위쪽 줄의 설정 단추 앞에 '모아 보기' 단추, 앱이면 openHub · 브라우저면 새 탭. floe:enter가 오면 '이번 단계'로", () => {
  const app = read("navigator/app.js");
  assert.match(app, /<button class="ti" data-act="hub" aria-label="모아 보기"[^\n]*\n?[^\n]*<button class="ti" data-act="settings"/, "설정 단추 바로 앞");
  assert.match(app, /grid: icon\(/, "격자 아이콘");
  assert.match(app, /hub: \(\) => \(window\.floeApp && window\.floeApp\.openHub \? window\.floeApp\.openHub\(\) : window\.open\("\.\.\/hub\/index\.html", "floe-hub"\)\)/);
  assert.match(app, /window\.floeApp\.onEnter\(\(\) => \{ setPlace\("enter"\); st\.tab = "today"; go\("home"\); \}\)/, "2026-10-20 C-13: 바이브 코딩 모드로");
});

test("서버(server.js)가 모아 보기 창의 파일을 내준다 — 앱은 서버 주소로 연다(넘김 문서 10절 함정)", () => {
  const { FILES } = require("../../03-backend/navigator/server.js");
  for (const f of ["index.html", "hub.css", "hub.js"]) assert.ok(FILES[`/hub/${f}`], `/hub/${f}`);
});
