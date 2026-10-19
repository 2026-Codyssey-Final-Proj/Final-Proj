// claude-drafted: 2026-10-19 — 이재엽 결정 "Mac에서는 섬이 노치(다이내믹 아일랜드) 자리에 붙는다 · 노치 크기는 Swift 도우미로 정확히".
// Electron은 노치 크기를 안 알려 줘 Swift 도우미(notch/notch-probe.swift)가 JSON 한 줄을 찍고, 앱(main.js)은 lib.js의 순수 함수로
// 그 JSON을 읽어 창을 노치 가운데 · 화면 맨 위에 둔다. 노치가 없는 Mac · 리눅스 · 윈도우는 전처럼 위쪽 가운데. electron 모듈 없이 돈다.
// 실행: node --test 04-tests/navigator/electron-notch.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");

// 2026-10-19 이재엽의 Mac(14인치, 2056×1329pt)에서 도우미가 실제로 찍은 줄
const PROBE = '{"menuBar":39,"notch":{"height":38,"width":220,"x":918},"screen":{"height":1329,"width":2056}}';
const DISPLAY = { x: 0, y: 0, width: 2056, height: 1329 };
const WORK = { x: 0, y: 39, width: 2056, height: 1290 };

test("도우미 출력 읽기 — 노치가 있으면 x · 폭 · 높이, 없으면 notch null, 모양이 이상하면 null", () => {
  const p = L.parseNotchProbe(PROBE);
  assert.deepEqual(p.notch, { x: 918, width: 220, height: 38 });
  assert.equal(p.menuBar, 39);
  assert.deepEqual(p.screen, { width: 2056, height: 1329 });
  assert.equal(L.parseNotchProbe('{"menuBar":25,"notch":null,"screen":{"width":1440,"height":900}}').notch, null);
  for (const bad of ["", "not json", "{}", '{"notch":{"x":"a","width":220,"height":38}}', '{"notch":{"x":1,"width":0,"height":38}}', '{"notch":{"x":1,"width":220,"height":-1}}', "[]"]) {
    assert.equal(L.parseNotchProbe(bad), null, bad);
  }
});

test("노치가 있으면 창을 노치 가운데 · 화면 맨 위에, 메뉴 줄보다 위 레벨로", () => {
  const lay = L.notchLayout(L.parseNotchProbe(PROBE), DISPLAY, 952, 140);
  assert.deepEqual(lay, { x: 552, y: 0, width: 952, height: 140, level: "screen-saver", cx: 1028 });   // 918 + 220/2 = 1028, 1028 - 476 = 552
});

test("노치가 없거나(일반 Mac · 리눅스 · 윈도우) 도우미가 실패하면 null — 전처럼 위쪽 가운데", () => {
  assert.equal(L.notchLayout(null, DISPLAY, 952, 140), null);
  assert.equal(L.notchLayout(L.parseNotchProbe('{"notch":null,"screen":{"width":1440,"height":900},"menuBar":25}'), DISPLAY, 952, 140), null);
});

test("노치 자리는 두 번째 화면이 왼쪽에 있어도(x가 음수가 아닌 화면 좌표로) 그 화면 안에서 센다", () => {
  const lay = L.notchLayout(L.parseNotchProbe(PROBE), { x: 1920, y: 0, width: 2056, height: 1329 }, 540, 60);
  assert.equal(lay.x, 1920 + 1028 - 270);
  assert.equal(lay.y, 0);
});

test("창 크기가 바뀔 때의 x — 왼쪽 고정이면 그대로, 노치가 있으면 노치 가운데, 아니면 창 가운데를 지킨다", () => {
  const b = { x: 552, y: 0, width: 952, height: 140 };
  assert.equal(L.islandX("left", b, 1338, 1028, WORK), 552);
  assert.equal(L.islandX("center", b, 540, 1028, WORK), 1028 - 270);
  assert.equal(L.islandX("center", b, 540, null, WORK), 552 + (952 - 540) / 2);
});

test("창 크기가 바뀔 때의 x — 화면 밖으로 나가면 안쪽으로 당긴다(노치가 있어도)", () => {
  const wa = { x: 0, y: 39, width: 1440, height: 861 };
  assert.equal(L.islandX("center", { x: 100, y: 0, width: 200, height: 60 }, 1500, 720, wa), 0);   // 화면보다 넓으면 왼쪽 끝
  assert.equal(L.islandX("left", { x: 1300, y: 0, width: 100, height: 60 }, 400, null, wa), 1040);   // 1440 - 400
  assert.equal(L.islandX("center", { x: 0, y: 0, width: 100, height: 60 }, 300, 1400, wa), 1140);   // 노치가 오른쇽 끝이어도 안으로
});

test("앱 → 화면: preload가 노치 구독(onNotch)을 두고, 화면은 그걸 받아 .notch와 --notch-w · --notch-h를 둔다", () => {
  const pre = read("electron/preload.js"), app = read("navigator/app.js"), css = read("navigator/app.css");
  assert.match(pre, /onNotch:/);
  assert.match(pre, /"floe:notch"/);
  assert.match(app, /floeApp\.onNotch/);
  assert.match(app, /classList\.add\("notch"\)/);
  assert.match(app, /--notch-w/);
  assert.match(app, /--notch-h/);
  assert.match(css, /html\.notch \.strip\{[^}]*#000/);   // 띠는 노치와 같은 검정
  assert.match(css, /html\.notch \.strip\{[^}]*var\(--notch-w/);   // 폭은 노치 폭 이상
  assert.match(css, /html\.notch \.pill,html\.notch \.isl\{[^}]*border-radius:0 0 /);   // 위 모서리는 각지게(화면 위에 붙음)
});

test("앱(main.js) — Mac에서만 도우미를 한 번 돌리고, 노치가 있을 때만 메뉴 줄보다 위(screen-saver)에, 전체 화면 보조 창 옵션은 그대로 꺼져 있다", () => {
  const main = read("electron/main.js");
  assert.match(main, /notch-probe/);
  assert.match(main, /parseNotchProbe/);
  assert.match(main, /notchLayout/);
  assert.match(main, /islandX/);
  assert.match(main, /"floe:notch"/);
  assert.doesNotMatch(main, /visibleOnFullScreen\s*:\s*true/);
});

test("묶기 — prebuild가 swiftc로 도우미를 만들고(없으면 건너뜀), 묶음에 extraResources로 들어가며, 산출물은 git에 올리지 않는다", () => {
  const pre = read("electron/prebuild.js"), pkg = JSON.parse(read("electron/package.json"));
  assert.match(pre, /swiftc/);
  assert.match(pre, /notch-probe/);
  assert.ok(JSON.stringify(pkg.build.mac.extraResources || []).includes("notch-probe"), "mac.extraResources에 notch-probe가 있어야 한다");
  const ignore = fs.readFileSync(path.join(__dirname, "../../.gitignore"), "utf8");
  assert.match(ignore, /electron\/build\/notch-probe/);
});
