// claude-drafted: 2026-10-27 — 섬을 작업실 창의 가장자리에 붙이기(C-41 ②, 두승현 — 스토리보드 01-docs/04-pattern-implementation/stage-storyboard 화면 기준 4 · 5).
// lib.js dockBounds는 실제로 돌리고, main.js · app.js · win.js · 설정은 글자 모양으로 본다(electron 없이). 손잡이 · 띠 · 0.3초(기준 6 · 8)는 다음 묶음.
// 실행: node --test 04-tests/navigator/dock.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const Q = require("../../03-backend/navigator/quest.js");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");

test("lib.js dockBounds — 네 가장자리에 딱 붙고 그 가장자리를 따라 가운데, 섬이 작업실보다 크면 작업실 시작점에", () => {
  const WS = { x: 100, y: 200, width: 920, height: 640 }, I = { width: 420, height: 360 };
  assert.deepEqual(L.dockBounds("right", WS, I), { x: 600, y: 340, width: 420, height: 360 });
  assert.deepEqual(L.dockBounds("left", WS, I), { x: 100, y: 340, width: 420, height: 360 });
  assert.deepEqual(L.dockBounds("top", WS, I), { x: 350, y: 200, width: 420, height: 360 });
  assert.deepEqual(L.dockBounds("bottom", WS, I), { x: 350, y: 480, width: 420, height: 360 });
  assert.deepEqual(L.dockBounds("zzz", WS, I), L.dockBounds("right", WS, I), "모르는 값은 오른쪽");
  const big = { width: 952, height: 700 };
  assert.deepEqual(L.dockBounds("right", WS, big), { x: 100, y: 200, width: 952, height: 700 }, "작업실보다 크면 시작점에 — 넘치는 쪽은 밖으로");
  assert.equal(L.dockBounds("top", { x: -1800, y: 0, width: 1000, height: 600 }, I).x, -1510, "왼쪽 모니터(x < 0)");
});

test("quest.js — 섬 자리는 위 · 아래 · 왼쪽 · 오른쪽, 처음은 오른쪽", () => {
  assert.deepEqual(Q.SIDES, ["top", "bottom", "left", "right"]); assert.equal(Q.sideOf("nope"), "right");
});

test("main.js — 작업실이 열려 있으면 섬 창을 그 가장자리에(placeIsland), 작업실이 옮겨지거나 커지면 따라가고(move · resize), 닫히면 붙기 전 자리로(undockIsland). 섬 크기가 바뀌어도 붙은 채. 서고 · 처음 설정(expanded)이면 안 붙는다", () => {
  const m = read("electron/main.js");
  assert.match(m, /const DOCK_SIDES = \["top", "bottom", "left", "right"\];/);
  assert.match(m, /const docked = \(\) => !!\(wins\.quest && !wins\.quest\.isDestroyed\(\)\) && !expanded;/);
  assert.match(m, /function placeIsland\(\) \{[\s\S]*?const ws = w\.getContentBounds\(\), b = L\.dockBounds\(dockSide, ws, ib\)[\s\S]*?w\.webContents\.send\("floe:dock", \{ side: dockSide, size:/, "자리를 잡고 작업실 화면에 알린다");
  assert.match(m, /function undockIsland\(\)/);
  assert.match(m, /ipcMain\.on\("floe:dock-side", \(e, side\) => \{ if \(!fromIsland\(e\) \|\| !DOCK_SIDES\.includes\(side\)\) return; dockSide = side; placeIsland\(\); \}\)/, "섬에서만 · 아는 값만");
  assert.match(m, /if \(ws\) \{ w\.once\("ready-to-show", placeIsland\); w\.on\("move", placeIsland\); w\.on\("resize", placeIsland\); \}/);
  assert.match(m, /if \(ws\) undockIsland\(\);/, "닫히면 되돌린다");
  const resize = m.slice(m.indexOf('ipcMain.on("floe:resize"'), m.indexOf('ipcMain.on("floe:resize"') + 2600);
  assert.match(resize, /docked\(\) \? MIN_W : ISLAND_W/, "붙어 있으면 섬 폭 그대로");
  assert.match(resize, /docked\(\) \? L\.dockBounds\(dockSide, wins\.quest\.getContentBounds\(\), \{ width: W, height: H \}\)/, "새 크기로 가장자리에");
  assert.match(resize, /placeSideWins\(\);\n\s*placeIsland\(\);/);
  assert.match(m, /if \(kind === "quest"\) continue;/, "placeSideWins는 작업실을 옮기지 않는다");
  const p = read("electron/preload.js");
  assert.match(p, /dockSide: \(side\) => ipcRenderer\.send\("floe:dock-side", String\(side \|\| ""\)\)/);
  assert.match(p, /onDock: \(cb\) => \{[^\n]*"floe:dock"/);
});

test("app.js · app.css — 섬 머리의 네 칸(▲ ▼ ◀ ▶, 작업실이 열려 있을 때만) · 설정의 '섬 자리' · 고르면 앱에 알리고 · 켤 때도 알린다 · 옆에 붙으면 섬을 420으로 좁힌다", () => {
  const a = read("navigator/app.js"), c = read("navigator/app.css");
  assert.match(a, /const dockBtns = \(\) => \(WINS && QU && st\.qwin \? `<span class="dk" role="group" aria-label="섬 자리">/);
  assert.match(a, /data-act="side" data-v="\$\{s\}" aria-pressed="\$\{side === s\}"/);
  assert.match(a, /srow\("섬 자리", pick\("섬 자리", \[\["top", "위"\], \["bottom", "아래"\], \["left", "왼쪽"\], \["right", "오른쪽"\]\], side, "side"\)/);
  assert.match(a, /side: \(i, el\) => \{ if \(!QU \|\| !el\) return; side = QU\.sideOf\(el\.dataset\.v\); writeLS\(SIDE_KEY, side\); if \(WINS\) window\.floeApp\.dockSide\(side\); render\(\);/);
  assert.match(a, /window\.floeApp\.dockSide\(side\);\s+\/\/ 켤 때/);
  assert.match(a, /readLS\(SIDE_KEY, "right"\)/, "처음은 오른쪽");
  assert.match(a, /window\.floeApp\.onDockRoom\(applyDock\)/, "앱이 보낸 작업실 크기 안에서");
  const ad = a.slice(a.indexOf("function applyDock"), a.indexOf("function applyDock") + 900);
  assert.match(ad, /classList\.toggle\("dock-narrow", side === "left" \|\| side === "right"\)/); assert.match(ad, /classList\.toggle\("dock-wide", side === "top" \|\| side === "bottom"\)/);
  assert.match(ad, /setProperty\("--dock-h", room \? `\$\{Math\.max\(240, Math\.round\(room\.height\) \|\| 0\)\}px` : ""\)/); assert.match(ad, /queueSize\(\);/, "크기가 바뀌었으니 창을 다시 맞춘다");
  assert.match(c, /html\.in-app\.dock-narrow \.nav\{width:420px\}/);
  assert.match(c, /html\.in-app\.dock-narrow \.mc\.chat\{grid-template-columns:minmax\(0,1fr\)\}/, "플로로 위 · 대화 아래 한 열");
  assert.match(c, /html\.in-app\.dock-narrow \.isl\{max-height:var\(--dock-h,100vh\)\}/); assert.match(c, /html\.in-app\.dock-wide \.isl\{max-height:360px\}/);
  assert.match(c, /html\.in-app\.dock-narrow \.isl-body,html\.in-app\.dock-wide \.isl-body\{flex:1 1 auto;min-height:0;overflow:hidden auto\}/, "넘치면 몸통이 세로로만 스크롤");
  const m = read("electron/main.js"), p = read("electron/preload.js");
  assert.match(m, /win\.webContents\.send\("floe:dock-room", \{ side: dockSide, width: ws\.width, height: ws\.height \}\)/); assert.match(m, /win\.webContents\.send\("floe:dock-room", null\)/, "떼면 원래대로");
  assert.match(p, /onDockRoom: \(cb\) => \{[^\n]*"floe:dock-room"/);
  assert.doesNotMatch(a, /replaceWins\(\)/, "자리를 바꿀 때 작업실을 닫았다 다시 열지 않는다 — 앱이 섬 창을 옮긴다");
});

test("win.js · win.html — 작업실 화면은 섬이 붙은 가장자리만큼 비워 두고(padding), 0.3초로 움직이며 움직임 줄이기면 바로", () => {
  const j = read("navigator/win.js"), h = read("navigator/win.html");
  assert.match(j, /F\.onDock\(\(p\) => \{ const s = p && DOCK\.includes\(p\.side\) \? Math\.max\(0, Math\.round\(p\.size\) \|\| 0\) : 0; root\.style\.padding = DOCK\.map/);
  assert.match(h, /#root\{height:100vh;box-sizing:border-box;transition:padding \.3s cubic-bezier\(\.2,\.8,\.2,1\)\}/);
  assert.match(h, /@media \(prefers-reduced-motion:reduce\)\{#root\{transition:none\}\}/);
  assert.match(h, /#root>\.win\{width:100%!important;height:100%!important/, "padding 안에서 창 가득");
});
