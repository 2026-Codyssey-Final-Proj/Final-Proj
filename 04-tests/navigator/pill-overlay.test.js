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
  assert.match(a, /pill: \(\) => \(st\.ui === "hidden" \? go\("home"\) : view\("click"\)\)/, "알약 누름 = 펼침(hidden이어도)"); assert.match(a, /fold: \(\) => go\("petit"\)/, "접기 단추");
  // 새 맥락 리뷰(2026-10-27) 막힘 둘 · 보완: 접힌 알약은 더 접히지 않는다, 옆 칸에 마우스 · 글 쓰는 중에는 안 접힌다, 알릴 일이 오면 펼친다, Esc는 먼저 접기
  assert.match(a, /if \(WINS && st\.qwin && st\.ui === "petit"\) return;   \/\/ 작업실 안의 접힌 알약은 더 접히지\(hidden\) 않는다/);
  assert.match(a, /\|\| st\.openInput \|\| typing\(\) \|\| colTyping;/, "옆 칸에 글 쓰는 중은 pinned"); assert.match(a, /hovering \|\| colHover \|\|/, "옆 칸에 마우스가 있으면 접히는 시계를 걸지 않는다");
  assert.match(a, /if \(p\.type === "col"\) \{ if \(typeof p\.hover === "boolean"\)/, "옆 칸의 올림 · 글 쓰는 중을 받는다");
  assert.match(a, /WINS && st\.qwin && st\.ui === "petit" \? "home" : st\.ui\);   \/\/ 작업실 안의 접힌 알약은 알릴 일이 오면 펼친다/, "peek가 펼친다");
  assert.match(a, /if \(p\.kind === "quest" && st\.qwin\) \{ if \(!colFolded\(\)\) return go\("petit"\); return set\(\{ qwin: false \}\); \}/, "Esc는 먼저 접기, 접혀 있으면 작업실 닫기");
  const w = read("navigator/win.js");
  assert.match(w, /F\.winEvent\(\{ type: "col", hover: on \}\)/); assert.match(w, /F\.winEvent\(\{ type: "col", typing: true \}\)/); assert.ok(!w.includes("col-folded"), "쓰지 않는 class는 없다");
  assert.match(read("navigator/app.css"), /\.isl-col\.folded\{padding:3px;/, "56 − 6 = 50 = 알약 높이"); assert.match(read("navigator/app.css"), /\.isl-col\.folded \.pill:hover\{transform:none\}/);
});

test("win.js · win.html · app.css — 접힌 칸은 두께 56(손잡이 없음), 왼쪽 · 오른쪽은 세로 알약(글은 세로쓰기), 0.3초로 넓어진다", () => {
  const w = read("navigator/win.js"), h = read("navigator/win.html"), c = read("navigator/app.css");
  assert.match(w, /FOLD = 56;/); assert.match(w, /const foldedCol = \(\) => \{ const c = root\.querySelector\("\.isl-col"\); return !!c && c\.classList\.contains\("folded"\); \};/);
  assert.match(w, /hd\.hidden = !side \|\| folded \|\| center;/, "접히면 손잡이 없음");
  assert.match(w, /h\.style\.setProperty\("--col-w", center \? \(root\.querySelector\("\.wnav"\) \? "calc\(100% - 200px\)" : "100%"\) : `\$\{folded \? FOLD : col\.w\}px`\); h\.style\.setProperty\("--col-h", `\$\{folded \? FOLD : col\.h\}px`\);/);
  assert.match(h, /#root\{[^}]*grid-template-columns:minmax\(0,1fr\) var\(--col-w,420px\);[^}]*transition:--col-w \.3s/, "0.3초 — 격자 칸 너비로(C-62 머리 줄 하나)");
  assert.match(c, /\.isl-col\.folded\.side-left \.pill,\.isl-col\.folded\.side-right \.pill\{height:auto;max-height:100%;width:48px;flex-direction:column/, "세로 알약");
  assert.match(c, /\.isl-col\.folded\.side-right \.pill \.mini\{writing-mode:vertical-rl/, "글은 세로쓰기");
});

test("작업실 안의 접힌 알약은 진한 남색 판 · 칸 안에 드는 작은 그림자 — 앱 창(.in-app)의 규칙이 작업실 창에는 없어 유리(반투명)로 그려져 파스텔 바탕이 비쳐 흐렸다(임유정 2026-10-28 Windows)", () => {
  const c = read("navigator/app.css");
  assert.match(c, /\.isl-col\.folded \.pill\{max-width:100%;flex:none;background:var\(--isl\);-webkit-backdrop-filter:none;backdrop-filter:none\}/, "섬 · 앱의 알약과 같은 남색(섬 토큰 --isl — C-57), 뒤를 비추지 않는다");
  assert.match(c, /\.isl-col\.folded \.pill:not\(\.ping\)\{box-shadow:[^}]*0 1px 2px rgba\(0,4,30,\.35\)\}/, "바깥 그림자는 1+2 = 3px — 칸의 안쪽 여백(3px) 안에서 잘리지 않게");
});
