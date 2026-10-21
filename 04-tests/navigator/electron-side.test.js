// claude-drafted: 2026-10-21 — 앱의 설정 창 · 퀘스트 창(C-22, 이재엽 "설정 창과 퀘스트 창 그리고 채팅을 입력하는 창 이렇게 3개"). 스토리보드 11-2의 1번.
// lib.js의 자리 계산(순수)은 그대로 돌리고, main.js · preload.js · win.html · win.js · app.js는 글로 맞대어 본다(electron-hub.test.js와 같은 방식 — electron 모듈 없이).
// 실행: node --test 04-tests/navigator/electron-side.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const { FILES } = require("../../03-backend/navigator/server.js");

const WA = { x: 0, y: 25, width: 2000, height: 875 }, ISL = { x: 524, y: 25, width: 952, height: 300 };

test("자리(sideWinBounds): 설정 창은 고른 쪽, 퀘스트 창은 반대쪽 — 섬 창과 8px 띄워 같은 높이에", () => {
  assert.deepEqual(L.sideWinBounds("settings", "left", ISL, WA, [380, 760]), { x: 524 - 380 - 8, y: 25, width: 380, height: 760 });
  assert.deepEqual(L.sideWinBounds("quest", "left", ISL, WA, [460, 640]), { x: 524 + 952 + 8, y: 25, width: 460, height: 640 });
  assert.deepEqual(L.sideWinBounds("settings", "right", ISL, WA, [380, 760]).x, 524 + 952 + 8);
  assert.deepEqual(L.sideWinBounds("quest", "right", ISL, WA, [460, 640]).x, 524 - 460 - 8);
  assert.equal(L.sideWinBounds("settings", "zzz", ISL, WA, [380, 760]).x, 524 - 380 - 8, "모르는 값은 왼쪽");
  assert.equal(L.SIDE_GAP, 8);
});

test("자리(sideWinBounds): 작업 영역 밖이면 안으로 당기고, 세로는 작업 영역만큼, 이상한 크기는 기본(460×640) · 최소 200×160", () => {
  const edge = L.sideWinBounds("settings", "left", { x: 0, y: 25, width: 952, height: 300 }, WA, [380, 760]);
  assert.deepEqual(edge, { x: 0, y: 25, width: 380, height: 760 }, "왼쪽 끝 — 섬을 덮더라도 화면 안에");
  const tall = L.sideWinBounds("quest", "left", ISL, { x: 0, y: 0, width: 1440, height: 500 }, [460, 900]);
  assert.equal(tall.height, 500);
  assert.deepEqual([L.sideWinBounds("quest", "left", ISL, WA, null).width, L.sideWinBounds("quest", "left", ISL, WA, null).height], [460, 640]);
  assert.deepEqual([L.sideWinBounds("quest", "left", ISL, WA, [10, 10]).width, L.sideWinBounds("quest", "left", ISL, WA, [10, 10]).height], [200, 160]);
  const second = L.sideWinBounds("settings", "left", { x: -1800, y: 100, width: 952, height: 300 }, { x: -1920, y: 0, width: 1920, height: 1080 }, [380, 760]);
  assert.equal(second.x, -1920, "왼쪽 화면(x가 음수)도 그 화면 안에서");
});

test("앱(main.js) — 창 둘은 테두리 없음 · 항상 위 · 불투명 네이비, 퀘스트 창만 크기 조절, 섬에서만 열고 · 내용을 보내고 · 닫고, 창의 누름은 섬으로, 사람이 닫으면 섬에 알림, 섬 창이 닫히거나 서고로 가면 같이 닫힘", () => {
  const m = read("electron/main.js");
  const at = m.indexOf("function openSideWin(kind, opt = {})"); assert.ok(at > 0);
  const block = m.slice(at, at + 2600);
  assert.match(block, /L\.sideWinBounds\(kind, opt\.side, isl, wa, opt\.size\)/);
  assert.match(block, /frame: false, transparent: false, backgroundColor: "#16225E", alwaysOnTop: true, resizable: kind === "quest"/);
  assert.match(block, /w\.setAlwaysOnTop\(true, "floating"\)/);
  assert.match(block, /w\.loadURL\(`\$\{URL_\}navigator\/win\.html#\$\{kind\}`\)/, "화면 파일은 서버 주소로");
  assert.match(block, /win\.webContents\.send\("floe:win-closed", kind\)/, "사람이 닫으면 섬에");
  assert.match(block, /contextIsolation: true, nodeIntegration: false, sandbox: true/);
  assert.match(m, /ipcMain\.on\("floe:win-open", \(e, kind, opt\) => \{ if \(fromIsland\(e\) && sideKind\(kind\)\) openSideWin/, "섬에서만 연다");
  assert.match(m, /ipcMain\.on\("floe:win-html", \(e, kind, html\) => \{[^\n]*fromIsland\(e\)/);
  assert.match(m, /ipcMain\.on\("floe:win-close", \(e, kind\) => \{[^\n]*fromIsland\(e\)/);
  assert.match(m, /ipcMain\.on\("floe:win-event", \(e, payload\) => \{ if \(fromSide\(e\) && win && !win\.isDestroyed\(\)\) win\.webContents\.send\("floe:win-event", payload\); \}\)/, "창에서만 · 섬으로만");
  assert.match(m, /win\.on\("closed", \(\) => \{ clearInterval\(cursorTick\); win = null; closeSideWins\(\); \}\)/);
  assert.match(m, /\{ closeSideWins\(\); expandWindow\(\); \}/, "서고로 가면 닫는다");
  const p = read("electron/preload.js");
  for (const k of ["openWin", "sendWin", "sizeWin", "closeWin", "onWinEvent", "onWinClosed", "onWinHtml", "winEvent"]) assert.ok(p.includes(`${k}:`), k);
});

test("창 화면(win.html · win.js) — 섬이 보낸 내용을 보이고, 누름 · 바뀜 · 입력 · Esc를 섬으로 돌려보낸다. 머리띠로 끈다. 앱 밖(브라우저)에서는 아무것도 하지 않는다. 서버가 내준다", () => {
  const html = read("navigator/win.html"), js = read("navigator/win.js");
  assert.match(html, /<script src="win\.js"><\/script>/);
  assert.match(html, /#root \.wh\{-webkit-app-region:drag/);
  assert.match(html, /#root \.wh button,#root \.wh select\{-webkit-app-region:no-drag\}/);
  assert.match(js, /if \(!F \|\| !F\.onWinHtml\) return;/, "브라우저에서는 멈춘다");
  assert.match(js, /F\.onWinHtml\(\(html\) => \{/);
  for (const t of ['type: "click"', 'type: "change"', 'type: "input"', 'type: "key", key: "Escape"']) assert.ok(js.includes(t), t);
  assert.match(js, /root\.innerHTML = html \|\| "";/);
  assert.ok(js.includes("b.setSelectionRange(sel[0], sel[1])"), "다시 그려도 커서는 그대로");
  assert.ok(FILES["/navigator/win.html"] && FILES["/navigator/win.js"], "서버 목록");
  assert.ok(!/fetch\(|XMLHttpRequest|https?:/.test(js), "창은 밖으로 아무것도 보내지 않는다 — 섬으로만");
});

test("섬(app.js) — 앱이 창을 열 수 있으면(WINS) 섬 옆의 판 대신 창 둘: 열림 · 닫힘 · 내용이 바뀐 것만 보낸다, 자리를 바꾸면 닫았다 다시 연다, 창의 누름은 섬의 같은 손잡이로, 서고로 가면 닫는다", () => {
  const app = read("navigator/app.js");
  assert.match(app, /const WINS = !!\(window\.floeApp && window\.floeApp\.openWin\);/);
  assert.match(app, /if \(WINS\) return isl;   \/\/ 앱: 창 둘은 따로 뜬다\(syncWins\)/);
  assert.match(app, /if \(on && !winOpen\[kind\]\) \{ winOpen\[kind\] = true; winHtml\[kind\] = html; window\.floeApp\.openWin\(kind, \{ side, size: winSize\(kind\), html, place: true \}\); \}/);
  assert.match(app, /else if \(on && html !== winHtml\[kind\]\) \{ winHtml\[kind\] = html; window\.floeApp\.sendWin\(kind, html\); \}/, "바뀐 것만");
  assert.match(app, /side = QU\.sideOf\(el\.dataset\.v\); writeLS\(SIDE_KEY, side\); replaceWins\(\); render\(\);/);
  assert.match(app, /if \(winClosing\[kind\]\) \{ winClosing\[kind\] = false; return; \}/, "내가 닫은 것은 상태를 끄지 않는다");
  assert.match(app, /if \(p\.type === "click"\) \{ if \(p\.bv\) return bvClick\(el\); return clickAct\(el\); \}/);
  assert.match(app, /if \(p\.type === "change"\) return onChange\(el\);/); assert.match(app, /if \(p\.type === "input"\) return onInput\(el\);/);
  assert.match(app, /if \(WINS && \(st\.settings \|\| st\.qwin\)\) \{ st\.settings = false; st\.qwin = false; syncWins\(\); \}/, "서고로 갈 때");
  assert.match(app, /\$root\.addEventListener\("change", \(e\) => onChange\(e\.target\)\);/, "섬도 같은 손잡이");
  assert.match(app, /if \(WINS && winOpen\.quest\) window\.floeApp\.sizeWin\("quest", QU\.SIZES\[qsize\]\);/, "S/M/L은 창 크기로");
});
