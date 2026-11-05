// claude-drafted: 2026-10-27 — C-46 R-2(이재엽 버튼 "펼치면 비킴 · 접으면 알약" · "고른 가장자리에" · "세로 알약" · "설정의 시간대로"): 작업실이 열린 동안 섬을 접으면 옆 칸이 그 가장자리의 알약이 되고 작업실이 넓어진다.
//   글자 모양으로 본다(electron 없이). 화면에서 재는 것은 04-tests/e2e/pill-overlay.test.js
// 실행: node --test 04-tests/navigator/pill-overlay.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");

test("app.js — 섬이 접혀 있으면(petit · hidden) 옆 칸은 알약(folded), 아니면 섬 그대로. 앱의 작업실은 열려 있어도 저절로 접힌다(pinned에서 뺌), 알약을 누르면 펼친다", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const colFolded = \(\) => st\.ui === "petit" \|\| st\.ui === "hidden";/);
  assert.match(a, /\$\{colFolded\(\) \? pillHTML\(\) \+ bootBubble\(\) : islandHTML\("", true\)\}<\/div>`;/, "접힘이면 알약 하나(+ 켤 때 말풍선 C-55), 펼침이면 위 줄 없는 섬(C-62 inCol)");
  assert.match(a, /\|\| st\.settings \|\| \(st\.qwin && !WINS\) \|\| !!st\.gacha/, "앱의 작업실은 섬을 붙들지 않는다(설정의 시간대로) — 브라우저의 옆 판은 전처럼");
  assert.match(a, /pill: \(\) => \(QU && !st\.qwin \? \(openQwin\("quest"\), render\(\)\) : st\.ui === "hidden" \? go\("home"\) : view\("click"\)\)/, "알약 누름 = 작업실 밖이면 바로 작업실(F-85), 안이면 펼침(hidden이어도)"); assert.match(a, /fold: \(\) => go\(colFolded\(\) \? "home" : "petit"\)/, "접기 단추 — 알약이면 다시 펼침(F-100)");
  // 새 맥락 리뷰(2026-10-27) 막힘 둘 · 보완: 접힌 알약은 더 접히지 않는다, 옆 칸에 마우스 · 글 쓰는 중에는 안 접힌다, 알릴 일이 오면 펼친다, Esc는 먼저 접기
  assert.match(a, /if \(WINS && st\.qwin && st\.ui === "petit"\) return;   \/\/ 작업실 안의 접힌 알약은 더 접히지\(hidden\) 않는다/);
  assert.match(a, /\|\| st\.openInput \|\| typing\(\) \|\| colTyping;/, "옆 칸에 글 쓰는 중은 pinned"); assert.match(a, /hovering \|\| colHover \|\|/, "옆 칸에 마우스가 있으면 접히는 시계를 걸지 않는다");
  assert.match(a, /if \(p\.type === "col"\) \{ if \(typeof p\.hover === "boolean"\)/, "옆 칸의 올림 · 글 쓰는 중을 받는다");
  assert.match(a, /WINS && st\.qwin && st\.ui === "petit" \? "home" : st\.ui\);   \/\/ 작업실 안의 접힌 알약은 알릴 일이 오면 펼친다/, "peek가 펼친다");
  assert.match(a, /if \(p\.kind === "quest" && st\.qwin\) \{ if \(!colFolded\(\)\) return go\("petit"\); return closeQwin\(\); \}/, "Esc는 먼저 접기, 접혀 있으면 작업실 닫기");
  assert.match(a, /const closeQwin = \(\) => \{ st\.qwin = false; go\("petit"\); \};/, "작업실을 닫으면 섬은 알약 — 펼친 섬 대화창이 따로 남지 않는다(F-85)");
  // F-86 — 작업실이 열려 있으면 설정은 작업실 위 가운데 모달(섬 몸통에는 그리지 않는다). 앱 창(win.html)과 브라우저 판이 같은 qwinHTML을 쓴다
  assert.match(a, /const body = st\.settings && QU && !st\.qwin \? settingsPane\(\)/, "작업실이 열려 있으면 섬 몸통에 설정 판을 그리지 않는다");
  assert.match(a, /const setModal = \(\) => \(st\.settings && QU \? `<div class="set-layer"><button type="button" class="set-bg" data-act="settings"/, "모달 바깥(바탕)을 누르면 닫힌다");
  assert.match(a, /\$\{setModal\(\)\}`;\n  \}/, "작업실 HTML 끝에 모달");
  assert.match(a, /if \(p\.type === "key" && p\.key === "Escape"\) \{ if \(p\.kind === "quest" && st\.qwin && st\.settings\) return set\(\{ settings: false \}\);/, "앱 작업실 창의 Esc는 설정 모달부터 닫는다");
  const w = read("navigator/win.js");
  assert.match(w, /F\.winEvent\(\{ type: "col", hover: on \}\)/); assert.match(w, /F\.winEvent\(\{ type: "col", typing: true \}\)/); assert.ok(!w.includes("col-folded"), "쓰지 않는 class는 없다");
  assert.match(read("navigator/app.css"), /\.isl-col\.folded\{padding:3px;/, "56 − 6 = 50 = 알약 높이"); assert.match(read("navigator/app.css"), /\.isl-col\.folded \.pill:hover\{transform:none\}/);
  // 2026-10-29 두승현 "우측의 모든 색은 동일한 색으로 · 플로로를 그 위에 띄어" — 알약 칸과 오른쪽 칸(이 문서 · 퀘스트)이 같은 옆 칸 색(--side) 하나. 전에는 알약 칸이 투명해 창 바탕(--desk)이 비쳐 두 띠로 보였다
  assert.match(read("navigator/app.css"), /\.isl-col\.folded\{[^}]*background:var\(--side\)\}/, "알약 칸 = 옆 칸 색");
  assert.match(read("navigator/app.css"), /\.wside\{[^}]*background:var\(--side\);/, "오른쪽 칸 = 옆 칸 색");
});

test("win.js · win.html · app.css — 접힌 칸은 두께 56(손잡이 없음), 왼쪽 · 오른쪽은 세로 알약(글은 세로쓰기), 0.3초로 넓어진다", () => {
  const w = read("navigator/win.js"), h = read("navigator/win.html"), c = read("navigator/app.css");
  assert.match(w, /FOLD = 56;/); assert.match(w, /const foldedCol = \(\) => \{ const c = root\.querySelector\("\.isl-col"\); return !!c && c\.classList\.contains\("folded"\); \};/);
  assert.match(w, /hd\.hidden = !side \|\| folded \|\| center;/, "접히면 손잡이 없음");
  assert.match(w, /h\.style\.setProperty\("--col-w", center \? \(root\.querySelector\("\.wnav"\) \? "calc\(100% - 200px\)" : "100%"\) : `\$\{folded \? FOLD : axis === "w" \? v : col\.w\}px`\); h\.style\.setProperty\("--col-h", `\$\{folded \? FOLD : axis === "h" \? v : col\.h\}px`\);/);   // 펼친 칸은 보이는 값 v(F-103-21)
  assert.match(h, /#root\{[^}]*grid-template-columns:minmax\(0,1fr\) var\(--col-w,420px\);[^}]*transition:--col-w \.3s/, "0.3초 — 격자 칸 너비로(C-62 머리 줄 하나)");
  assert.match(c, /\.isl-col\.folded\.side-left \.pill,\.isl-col\.folded\.side-right \.pill\{height:auto;max-height:100%;width:48px;flex-direction:column/, "세로 알약");
  assert.match(c, /\.isl-col\.folded\.side-right \.pill \.mini\{writing-mode:vertical-rl/, "글은 세로쓰기");
});

test("작업실 안의 접힌 알약은 진한 남색 판 · 칸 안에 드는 작은 그림자 — 앱 창(.in-app)의 규칙이 작업실 창에는 없어 유리(반투명)로 그려져 파스텔 바탕이 비쳐 흐렸다(임유정 2026-10-28 Windows)", () => {
  const c = read("navigator/app.css");
  assert.match(c, /\.isl-col\.folded \.pill\{max-width:100%;flex:none;background:var\(--isl\);-webkit-backdrop-filter:none;backdrop-filter:none\}/, "섬 · 앱의 알약과 같은 남색(섬 토큰 --isl — C-57), 뒤를 비추지 않는다");
  assert.match(c, /\.isl-col\.folded \.pill:not\(\.ping\)\{box-shadow:[^}]*0 1px 2px rgba\(0,4,30,\.35\)\}/, "바깥 그림자는 1+2 = 3px — 칸의 안쪽 여백(3px) 안에서 잘리지 않게");
});

// claude-drafted: 2026-10-29 — 두승현 "플로로 눈동자가 커서를 따라가지 않고 고정": 작업실 창(win.html)이 seal.js를 불러 옆 칸 섬의 플로로 눈을 따라가게(화면 확인은 e2e/pill-overlay)
test("작업실 창 — seal.js를 win.js보다 먼저 불러오고, 창 안의 마우스 움직임 · 다시 그릴 때 눈을 커서 쪽으로(움직임 줄이기면 안 함)", () => {
  const h = read("navigator/win.html"), w = read("navigator/win.js");
  assert.ok(h.indexOf('<script src="seal.js"></script>') > -1 && h.indexOf('<script src="seal.js"></script>') < h.indexOf('<script src="win.js"></script>'), "seal.js가 win.js보다 먼저");
  assert.match(w, /const S = window\.NavSeal, STILL = matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches;/);
  assert.match(w, /if \(S && !STILL\) document\.addEventListener\("mousemove", /, "창 안의 커서");
  assert.match(w, /if \(S && eyeAt\) S\.follow\(root, eyeAt\);/, "다시 그려도 마지막 커서 쪽");
});

// F-158(두승현 2026-11-05 "알약부분 작업해줘"): 앱의 처음 설정 창은 투명해서 뒤의 알약이 카드 위로 삐져나와 보였다 — 설정이 떠 있는 동안 섬을 감춘다
test("F-158 — 앱에서 처음 설정이 떠 있는 동안 섬(#nav)을 감춘다. 자리는 그대로 두고(display:none이 아니라 visibility) 브라우저 판은 그대로", () => {
  const su = read("navigator/setup.css");
  assert.match(su, /html\.in-app:has\(#floe-setup\) #nav\{visibility:hidden\}/);
});

// C-74(두승현 2026-11-05 "알약상태일때 상단 고정이 아니라 유저가 위치를 이동"): 자리 계산은 순수 함수로, 잇는 곳은 글자로. 진짜 끌기는 격리한 앱에서 사람 입력으로 잼
const L = require("../../02-frontend/electron/lib.js");
const WA = { x: 0, y: 0, width: 1680, height: 1010 };
test("C-74 islandSpot — 접히면 창 폭이 밖으로 나가도 알약만 화면 안, 펼치면 창 전체를 안으로. 세로는 작업 영역 안", () => {
  assert.deepEqual(L.islandSpot({ cx: 800, y: 300 }, 952, 65, WA, 392), { x: 324, y: 300 }, "화면 가운데는 그대로");
  assert.deepEqual(L.islandSpot({ cx: 0, y: 0 }, 952, 65, WA, 392), { x: 196 - 476, y: 0 }, "왼쪽 끝 — 창은 밖으로 나가고 알약은 끝에 붙는다");
  assert.deepEqual(L.islandSpot({ cx: 5000, y: 5000 }, 952, 65, WA, 392), { x: 1680 - 196 - 476, y: 1010 - 65 }, "오른쪽 아래 끝");
  assert.deepEqual(L.islandSpot({ cx: 0, y: 900 }, 952, 600, WA, 0), { x: 0, y: 410 }, "펼치면 창 전체가 안으로 — 아래쪽 알약은 위로 자란다");
  assert.deepEqual(L.islandSpot({ cx: 840, y: 0 }, 2000, 2000, WA, 0), { x: 0, y: 0 }, "화면보다 크면 왼쪽 위");
  assert.deepEqual(L.islandSpot({ cx: 2500, y: 100 }, 952, 65, { x: 1680, y: 0, width: 1920, height: 1040 }, 392), { x: 2024, y: 100 }, "두 번째 화면의 좌표");
});
test("C-74 parseSpot — 저장한 자리를 읽고, 망가진 글은 없는 셈", () => {
  assert.deepEqual(L.parseSpot('{"cx":120.5,"y":30}'), { cx: 120.5, y: 30 });
  for (const bad of ["", "{", "null", "[]", '{"cx":"1","y":2}', '{"cx":1}']) assert.equal(L.parseSpot(bad), null, bad);
});
test("C-74 앱 — 화면은 시작 · 움직임 · 끝만 보내고 자리는 앱이 커서로 잰다. 노치 · 넓힌 창에서는 옮기지 않고, 끝나면 저장한다", () => {
  const m = read("electron/main.js"), pre = read("electron/preload.js");
  assert.match(pre, /dragIsland: \(phase, pillW\) => ipcRenderer\.send\("floe:drag", phase, pillW\)/);
  const d = m.slice(m.indexOf('ipcMain.on("floe:drag"'), m.indexOf('ipcMain.on("floe:drag"') + 900);
  assert.match(d, /if \(!fromIsland\(e\) \|\| NOTCH \|\| expanded\) return;/);
  assert.match(d, /screen\.getCursorScreenPoint\(\)/);
  assert.match(d, /fs\.writeFile\(homeFile\(\)/);
  assert.match(m, /L\.islandSpot\(home, W, H, homeArea\(\), Number\(pillW\) \|\| 0\)/, "크기가 바뀌어도 옮긴 자리를 기준으로 — 펼쳤다 접으면 돌아온다");
  assert.match(m, /win\.on\("will-move", \(\) => \{ home = null; \}\)/, "펼친 섬의 머리 줄로 직접 옮기면 그 자리를 따른다");
});
test("C-74 화면 — 4px 넘게 움직여야 끌기, 끈 뒤의 누름은 먹는다, 끄는 동안 클릭 통과 · 창 크기 맞춤을 멈춘다. 띠는 알약과 같은 창이라 따로 옮기지 않는다", () => {
  const a = read("navigator/app.js");
  assert.match(a, /e\.target\.closest\("\.pill, \.strip"\)/);
  assert.match(a, /if \(!\(e\.buttons & 1\)\) return drop\(\);/, "뗀 신호를 놓쳐도 안 누른 커서를 따라오지 않는다");
  assert.match(a, /Math\.hypot\(e\.screenX - press\.x, e\.screenY - press\.y\) < 4/);
  assert.match(a, /if \(eatClick\) \{ eatClick = false; e\.stopPropagation\(\); e\.preventDefault\(\); \}/);
  assert.match(a, /addEventListener\("mousemove", \(e\) => \{ if \(document\.documentElement\.classList\.contains\("island-drag"\)\) return; const on = bare\(e\.target\);/);
  assert.match(a, /if \(h\.classList\.contains\("island-drag"\)\) return;/);
});
