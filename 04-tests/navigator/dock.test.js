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
  assert.match(m, /const docked = \(\) => !!\(wins\.quest && !wins\.quest\.isDestroyed\(\) && !wins\.quest\.isMinimized\(\)\) && !expanded;/);
  assert.match(m, /function placeIsland\(animate\) \{[\s\S]*?const ws = w\.getContentBounds\(\), b = L\.dockBounds\(dockSide, ws, ib\)[\s\S]*?w\.webContents\.send\("floe:dock", \{ side: dockSide, size:/, "자리를 잡고 작업실 화면에 알린다");
  assert.match(m, /function undockIsland\(\)/);
  assert.match(m, /if \(expanded\) \{ expanded\.from = \{ \.\.\.expanded\.from, x: Math\.round\(undock\.cx - expanded\.from\.width \/ 2\), y: undock\.y \}; undock = null; return; \}/, "서고로 넓힌 창은 건드리지 않고 돌아올 자리만(새 맥락 리뷰)");
  assert.match(m, /if \(key === lastDock\) return;/, "같은 값은 안 보낸다 — 되먹임이 여기서 멈춘다");
  assert.match(m, /if \(docked\(\)\) rememberUndock\(b\);/, "floe:resize가 먼저 붙여도 붙기 전 자리를 기억");
  assert.match(m, /if \(!w\.floeMoved && !\(kind === "quest" && docked\(\)\)\) \{/, "붙어 있는 작업실은 S · M · L로도 제자리에서 크기만");
  assert.match(m, /ipcMain\.on\("floe:dock-side", \(e, side\) => \{ if \(!fromIsland\(e\) \|\| !DOCK_SIDES\.includes\(side\)\) return; dockSide = side; placeIsland\(true\); \}\)/, "섬에서만 · 아는 값만 — 자리를 바꿀 때만 움직임(Mac)");
  assert.match(m, /w\.once\("ready-to-show", placeIsland\); w\.on\("move", placeIsland\); w\.on\("resize", placeIsland\);/);
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
  const ad = a.slice(a.indexOf("function applyDock"), a.indexOf("function applyDock") + 1600);
  assert.match(ad, /classList\.toggle\("dock-narrow", side === "left" \|\| side === "right"\)/); assert.match(ad, /classList\.toggle\("dock-wide", side === "top" \|\| side === "bottom"\)/);
  assert.match(ad, /setProperty\("--room-h", room \? `\$\{Math\.max\(240, Math\.round\(room\.height\) \|\| 0\)\}px` : ""\)/); assert.match(ad, /queueSize\(\);/, "크기가 바뀌었으니 창을 다시 맞춘다");
  assert.match(c, /html\.in-app\.dock-narrow \.nav\{width:min\(var\(--dock-w,420px\),var\(--room-w,100vw\)\)\}/, "옆은 고른 너비(처음 420) · 작업실 너비까지");
  assert.match(c, /html\.in-app\.dock-narrow \.mc\.chat\{grid-template-columns:minmax\(0,1fr\)\}/, "플로로 위 · 대화 아래 한 열");
  assert.match(c, /html\.in-app\.dock-narrow \.isl\{max-height:var\(--room-h,100vh\)\}/); assert.match(c, /html\.in-app\.dock-wide \.isl\{height:min\(var\(--dock-h,360px\),var\(--room-h,100vh\)\)\}/, "위아래는 고른 높이(처음 360) · 작업실 높이까지 — 내용이 짧아도 그 높이");
  assert.match(c, /html\.in-app\.dock-narrow \.isl-body,html\.in-app\.dock-wide \.isl-body\{flex:1 1 auto;min-height:0;overflow:hidden auto\}/, "넘치면 몸통이 세로로만 스크롤");
  const m = read("electron/main.js"), p = read("electron/preload.js");
  assert.match(m, /win\.webContents\.send\("floe:dock-room", \{ side: dockSide, width: ws\.width, height: ws\.height \}\)/); assert.match(m, /win\.webContents\.send\("floe:dock-room", null\)/, "떼면 원래대로");
  assert.match(p, /onDockRoom: \(cb\) => \{[^\n]*"floe:dock-room"/);
  assert.doesNotMatch(a, /replaceWins\(\)/, "자리를 바꿀 때 작업실을 닫았다 다시 열지 않는다 — 앱이 섬 창을 옮긴다");
});

test("win.js · win.html — 작업실 화면은 섬이 붙은 가장자리만큼 비워 두고(padding), 0.3초로 움직이며 움직임 줄이기면 바로", () => {
  const j = read("navigator/win.js"), h = read("navigator/win.html");
  assert.match(j, /const DOCK = \["top", "right", "bottom", "left"\];/, "CSS padding 축약 순서(위 · 오른쪽 · 아래 · 왼쪽) — main.js DOCK_SIDES 순서로 바꾸면 padding이 다른 변에 간다");
  assert.match(j, /F\.onDock\(\(p\) => \{ const s = p && DOCK\.includes\(p\.side\) \? Math\.max\(0, Math\.round\(p\.size\) \|\| 0\) : 0; dock = s \? \{ side: p\.side, size: s, inner: Math\.round\(p\.inner\) \|\| s, max: Math\.round\(p\.max\) \|\| 0 \} : null; root\.style\.padding = DOCK\.map/);
  assert.match(h, /#root\{height:100vh;box-sizing:border-box;transition:padding \.3s cubic-bezier\(\.2,\.8,\.2,1\)\}/);
  assert.match(h, /@media \(prefers-reduced-motion:reduce\)\{#root\{transition:none\}\}/);
  assert.match(h, /#root>\.win\{width:100%!important;height:100%!important/, "padding 안에서 창 가득");
});

// ── C-41 ③(2026-10-27): 손잡이로 섬 크기 — 옆 320 ~ 760(처음 420) · 위아래 240 ~ 480(처음 360), 화살표 20 · Home · End · 두 번 누르거나 Enter로 처음 (스토리보드 기준 6) ──
test("quest.js dockSizeOf — 범위로 맞추고, 빈 값 · 이상한 값은 처음 크기", () => {
  assert.deepEqual(Q.DOCK_RANGE, { w: [320, 760, 420], h: [320, 480, 360] }, "위아래 가장 작게 240 → 320(두승현 결정 2026-10-27)");
  assert.equal(Q.dockSizeOf("w", 100), 320); assert.equal(Q.dockSizeOf("w", "900"), 760); assert.equal(Q.dockSizeOf("w", 500.4), 500);
  assert.equal(Q.dockSizeOf("h", 300), 320, "320 아래는 320");
  assert.equal(Q.dockSizeOf("w", 700, 460), 460, "cap(작업실 반)이 760보다 작으면 그것이 가장 크게"); assert.equal(Q.dockSizeOf("w", "", 400), 400, "처음 420도 cap 안으로"); assert.equal(Q.dockSizeOf("w", 500, 100), 320, "cap이 가장 작게보다 작아도 320은 지킨다"); assert.equal(Q.dockSizeOf("w", 700, 2000), 700, "cap이 760보다 크면 760까지"); assert.equal(Q.dockSizeOf("h", ""), 360, "저장값이 없으면 처음"); assert.equal(Q.dockSizeOf("h", "abc"), 360); assert.equal(Q.dockSizeOf("w", null), 420);
});

test("app.js · win.js · win.html — 손잡이는 작업실 화면에(섬이 붙은 안쪽 가장자리), 값은 섬이 범위로 맞춰 기억하고(이 컴퓨터에만) 다시 잰다. 끌기 · 화살표 20 · Home · End · Enter · 두 번 누르기. 범위 숫자는 quest.js와 같다", () => {
  const a = read("navigator/app.js"), j = read("navigator/win.js"), h = read("navigator/win.html");
  assert.match(a, /DOCK_W_KEY = "floe:dock-w", DOCK_H_KEY = "floe:dock-h"/);
  assert.match(a, /let dockW = QU \? QU\.dockSizeOf\("w", readLS\(DOCK_W_KEY, ""\)\) : 420, dockH = QU \? QU\.dockSizeOf\("h", readLS\(DOCK_H_KEY, ""\)\) : 360;/);
  assert.match(a, /if \(p\.type === "dock-size"\) return setDockSize\(p\);/);
  const sd = a.slice(a.indexOf("function setDockSize"), a.indexOf("function setDockSize") + 900);
  assert.match(sd, /const v = p\.reset \? QU\.dockSizeOf\(axis, QU\.DOCK_RANGE\[axis\]\[2\], cap\) : Number\.isFinite\(p\.delta\) \? QU\.dockSizeOf\(axis, cur \+ p\.delta, cap\) : QU\.dockSizeOf\(axis, p\.value, cap\)/, "처음으로 · 화살표 ±20은 섬 자기 크기에 · 끈 자리는 그대로 — 셋 다 cap(작업실 반) 안으로"); assert.match(sd, /writeLS\(DOCK_W_KEY, v\)/); assert.match(sd, /applyDock\(dockRoom\)/);
  assert.match(a, /h\.style\.setProperty\("--dock-w", `\$\{dockW\}px`\); h\.style\.setProperty\("--dock-h", `\$\{dockH\}px`\);/);
  assert.match(j, /const RANGE = \{ w: \[320, 760\], h: \[320, 480\] \};/, "quest.js DOCK_RANGE와 같은 값");
  assert.match(j, /const maxOf = \(\) => \(dock && dock\.max\) \|\| RANGE\[axisOf\(dock\.side\)\]\[1\];/, "가장 크게는 섬이 보낸 max(옆은 작업실 반까지)"); assert.match(j, /e\.key === "End"\) send\(\{ value: maxOf\(\) \}\)/);
  assert.match(a, /const capW = \(\) => \(QU && dockRoom \? Math\.min\(QU\.DOCK_RANGE\.w\[1\], Math\.floor\(dockRoom\.width \/ 2\)\) : undefined\);/, "작업실이 1520을 넘어도 760(새 맥락 리뷰)"); assert.match(a, /if \(QU && room\) dockW = QU\.dockSizeOf\("w", dockWant, capW\(\)\);/, "작업실이 좁아지면 고른 너비도, 넓히면 원하는 값으로");
  assert.match(a, /if \(inner !== lastInner && window\.floeApp\.dockInner\) \{ lastInner = inner; window\.floeApp\.dockInner\(dockW, dockH, capW\(\)\); \}/, "같은 값이면 안 보낸다 — 되먹임이 섬 쪽에서 멈춘다");
  assert.match(read("electron/main.js"), /\|\$\{dockInner\.w\}x\$\{dockInner\.h\}x\$\{dockInner\.maxW\}`;/, "앱 쪽 키에도 섬이 보낸 값 — 둘째 바퀴에서 멈춘다"); assert.doesNotMatch(read("electron/main.js"), /lastDock = ""; placeIsland\(\)/, "dock-inner가 lastDock을 비우지 않는다");
  assert.match(read("electron/main.js"), /max: vert \? dockInner\.maxW : 0/, "위아래는 보내지 않는다 — win.js maxOf가 RANGE.h로");
  const fc = a.slice(a.indexOf("function fileCard"), a.indexOf("function fileCard") + 1200);
  assert.match(fc, /if \(!x\.what \|\| !\(x\.add \|\| x\.del\)\) continue;/, "파일 카드는 이름과 +/− 줄 수만(두승현 결정 2026-10-27) — 줄 내용은 서버가 받지 않는다"); assert.match(fc, /if \(seen\.size >= 5\) continue;/, "최근 다섯 파일 — 더 오래된 걸음의 줄 수도 그 다섯에 더한다"); assert.match(a, /\$\{fileCard\(\)\}<\/div>/);
  assert.match(j, /hd\.setAttribute\("role", "separator"\); hd\.tabIndex = 0;/);
  assert.match(j, /const send = \(p\) => \{ if \(dock\) F\.winEvent\(\{ type: "dock-size", axis: axisOf\(dock\.side\), \.\.\.p \}\); \};/);
  assert.match(j, /\{ left: e\.clientX, right: innerWidth - e\.clientX, top: e\.clientY, bottom: innerHeight - e\.clientY \}\[dock\.side\]; send\(\{ value: edge - \(dock\.size - dock\.inner\) \}\)/, "끈 자리(창) → 섬 크기 — 여백을 뺀다(새 맥락 리뷰: 단위 어긋남)");
  assert.match(j, /hd\.setAttribute\("aria-valuenow", dock\.inner\)/, "aria 값도 섬 크기 단위 — 범위 320~760 안");
  assert.match(read("electron/main.js"), /inner: vert \? dockInner\.w : dockInner\.h/); assert.match(read("electron/main.js"), /ipcMain\.on\("floe:dock-inner", \(e, w, h, maxW\) => \{ if \(!fromIsland\(e\)\) return;/);
  assert.match(a, /const latestSession = \(\) => \[\.\.\.aiSessions\]\.sort/, "가장 최근 세션은 한 곳에서");
  assert.match(j, /grow = \{ right: "ArrowLeft", left: "ArrowRight", top: "ArrowDown", bottom: "ArrowUp" \}\[dock\.side\]/);
  assert.match(j, /e\.key === "Enter"\) send\(\{ reset: true \}\); else if \(e\.key === grow\) send\(\{ delta: 20 \}\); else if \(e\.key === shrink\) send\(\{ delta: -20 \}\)/, "화살표는 delta — 창 크기(섬 + 여백)에 20을 더해 보내면 한 번에 31이 늘었다"); assert.match(j, /hd\.addEventListener\("dblclick", \(\) => send\(\{ reset: true \}\)\)/);
  assert.match(j, /else if \(e\.key === "Home"\) send\(\{ value: r\[0\] \}\); else if \(e\.key === "End"\) send\(\{ value: maxOf\(\) \}\)/);
  assert.match(h, /#hd\{position:fixed;z-index:5;/); assert.match(h, /#hd\[hidden\]\{display:none\}/, "display:grid가 [hidden]을 이기지 않게"); assert.match(h, /html\.hd-drag #root,html\.hd-drag #hd\{transition:none\}/, "끄는 동안은 바로");
  assert.match(read("electron/main.js"), /win\.setContentBounds\(b, animate === true && process\.platform === "darwin"\)/, "자리를 바꿀 때만 0.3초 — Mac만");
});

test("main.js — 작업실이 작업 표시줄로 내려가면(minimize) 섬은 붙기 전 자리로 비켜 두고(parkIsland), 다시 올라오거나 최대화 · 되돌리면 다시 붙는다. 내려간 작업실(상자가 -32000)은 따라가지 않는다", () => {
  const m = read("electron/main.js");
  assert.match(m, /const docked = \(\) => !!\(wins\.quest && !wins\.quest\.isDestroyed\(\) && !wins\.quest\.isMinimized\(\)\) && !expanded;/, "내려간 작업실에는 붙지 않는다 — placeIsland · floe:resize 둘 다 이 한 곳을 본다(2026-10-27 잼: -32000)");
  assert.match(m, /function parkIsland\(\) \{[\s\S]*?win\.webContents\.send\("floe:dock-room", null\);[\s\S]*?x: Math\.round\(undock\.cx - ib\.width \/ 2\), y: undock\.y/, "붙기 전 자리로 · 섬 화면은 원래 크기로 · undock은 남긴다");
  assert.match(m, /w\.on\("minimize", parkIsland\); for \(const ev of \["restore", "maximize", "unmaximize"\]\) w\.on\(ev, \(\) => placeIsland\(\)\);/);
});
