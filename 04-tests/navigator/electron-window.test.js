// claude-drafted: 2026-10-20 — 이재엽: "서재에서 들어갈 때 오버레이가 우리가 크기를 조정할 수 있도록", "오버레이가 작아졌다가 다시 켜지는 애니메이션",
// C-10 "켜지는 모습"(서버를 기다리는 동안 빈 화면 대신 켜지는 중). lib.js의 순수 함수는 그대로 돌리고, main.js · preload.js는 글로 맞대어 본다(electron 모듈 없이).
// 실행: node --test 04-tests/navigator/electron-window.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend/electron", f), "utf8");

const WA = { x: 0, y: 25, width: 2056, height: 1304 };   // 메뉴 줄 아래 작업 영역

test("서고 창 — 작업 영역 위쪽 가운데, 최대 1440×960, 작은 화면이면 24px 여백 안으로", () => {
  assert.deepEqual(L.libraryBounds(WA, null), { x: 308, y: 25, width: 1440, height: 960 });
  const small = L.libraryBounds({ x: 0, y: 0, width: 1280, height: 720 }, null);
  assert.deepEqual(small, { x: 12, y: 0, width: 1256, height: 696 });
  const second = L.libraryBounds({ x: -1920, y: 0, width: 1920, height: 1080 }, null);
  assert.equal(second.x, -1920 + 240, "왼쪽 화면(x가 음수)도 그 화면 안에서");
});

test("서고 창 — 사람이 조절한 크기를 기억해 그대로, 작업 영역보다 크면 당기고 최소 640×480", () => {
  assert.deepEqual(L.libraryBounds(WA, { width: 1000, height: 700 }), { x: 528, y: 25, width: 1000, height: 700 });
  assert.deepEqual(L.libraryBounds(WA, { width: 5000, height: 5000 }), { x: 12, y: 25, width: 2032, height: 1280 });
  assert.deepEqual(L.libraryBounds(WA, { width: 10, height: 10 }), { x: 708, y: 25, width: 640, height: 480 });
  assert.deepEqual(L.libraryBounds(WA, { width: "a" }), L.libraryBounds(WA, null), "이상한 값은 기본");
  assert.deepEqual(L.LIB_MIN, { width: 640, height: 480 });
});

test("켜지는 중 — 투명 바탕에 띠 자리의 물결 선, 노치가 있으면 노치 폭 · 검정. 밖의 파일 · 주소 없음", () => {
  const plain = L.bootPage(null), notch = L.bootPage({ width: 220, height: 38 });
  for (const h of [plain, notch]) {
    assert.match(h, /background:transparent/);
    assert.match(h, /<svg class="wl"/);
    assert.match(h, /stroke-dashoffset:100;animation:draw/, "숨 쉬듯 그어진다");
    assert.match(h, /prefers-reduced-motion:reduce/);
    assert.doesNotMatch(h, /https?:|src=|href=/, "밖의 것을 부르지 않는다");
  }
  assert.match(plain, /width:150px;height:52px;\}/);
  assert.doesNotMatch(plain, /#000/);
  assert.match(notch, /width:248px;height:56px;background:#000;border-radius:0 0 18px 18px/);
  assert.match(L.bootUrl(null), /^data:text\/html;charset=utf-8,/);
});

test("앱(main.js) — 창을 먼저 만들어 켜지는 중을 보이고, 서버가 켜진 뒤 화면을 연다. 셸 PATH는 기다리지 않고 묻는다", () => {
  const m = read("main.js");
  assert.match(m, /win\.loadURL\(URL_ \|\| L\.bootUrl\(PROBE && PROBE\.notch\)\)/);
  const ready = m.slice(m.indexOf("app.whenReady()"));
  assert.ok(ready.indexOf("createWindow();") < ready.indexOf("await startServer()"), "창이 서버보다 먼저");
  assert.ok(ready.indexOf("await startServer()") < ready.indexOf("win.loadURL(URL_)"), "서버 뒤에 화면");
  assert.match(m, /await fixPath\(\)/);
  assert.match(m, /execFile\(L\.loginShell/, "spawnSync로 메인을 멈추지 않는다");
});

test("앱(main.js) — 서고에 있는 동안 창을 조절할 수 있고(최소 640×480) 크기를 기억하며, 작업 화면으로 돌아오면 섬 자리로(Mac은 줄어드는 게 보임)", () => {
  const m = read("main.js");
  const expand = m.slice(m.indexOf("function expandWindow()"), m.indexOf("function restoreWindow()"));
  assert.match(expand, /L\.libraryBounds\(wa, libSize\)/);
  assert.match(expand, /win\.setResizable\(true\)/);
  assert.match(expand, /win\.setMinimumSize\(L\.LIB_MIN\.width, L\.LIB_MIN\.height\)/);
  assert.match(expand, /webContents\.send\("floe:expanded", \{ dx: b\.x - r\.x, dy: b\.y - r\.y \}\)/);
  const restore = m.slice(m.indexOf("function restoreWindow()"), m.indexOf("ipcMain.on(\"floe:expand\""));
  assert.match(restore, /libSize = \{ width: now\.width, height: now\.height \}/, "조절한 크기를 기억");
  assert.match(restore, /win\.setResizable\(false\)/);
  assert.match(restore, /win\.setContentBounds\(from, process\.platform === "darwin"\)/, "Mac은 animate");
  assert.match(m, /else if \(main && !same && expanded\) restoreWindow\(\)/, "서고 밖 주소로 가면 되돌린다");
  assert.match(m, /if \(expanded\) \{ if \(\/\\\/library\\\/\/\.test\(win\.webContents\.getURL\(\)\)\) return; expanded = null;/, "서고에 있는 동안 섬 크기를 따르지 않는다 — 서고가 아닌데 넓혀져 있으면(처음 설정, KAN-57) 섬 창으로 돌아온다");
  assert.match(read("preload.js"), /onExpanded: \(cb\) =>[^\n]*ipcRenderer\.on\("floe:expanded"/);
});
