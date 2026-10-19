// claude-drafted: 2026-10-20 — 이재엽: "오버레이가 작아졌다가 다시 켜지는 애니메이션", "서재에서 오버레이로 넘어갈 때 애니메이션",
// "플로로가 잠수해서 들어가는 곳이 오버레이 중앙에서", "오버레이 크기에 따라서 플로로 크기 조정", "서재에 들어갈 때 로딩이 느린 문제".
// dive.js는 브라우저 안에서만 돌아(Web Animations) 글로 맞대어 본다 — 때(ms) · 출발 자리 · 서로 이어 붙인 주소(&back) · 크기 규칙.
// 실행: node --test 04-tests/navigator/dive.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const num = (src, name) => Number((new RegExp(`${name} = (\\d+)`).exec(src) || [])[1]);

test("서고로 들어가기 — 플로로는 섬 한가운데에서 출발해 그 자리에서 곧게 내려가고, 크기는 창의 짧은 변을 따른다", () => {
  const d = read("navigator/dive.js");
  assert.match(d, /function out\(from, href\) \{/, "출발 자리를 따로 받지 않는다 — 섬 가운데");
  assert.match(d, /const x0 = r\.left \+ r\.width \/ 2 - w \/ 2, y0 = r\.top \+ r\.height \/ 2 - w \/ 2;/);
  assert.doesNotMatch(d, /x1 = W \/ 2/, "화면 가운데로 옮겨 가지 않는다");
  assert.match(d, /const floroSize = \(W, H\) => Math\.round\(Math\.min\(150, Math\.max\(90, Math\.min\(W, H\) \* 0\.16\)\)\)/);
  assert.match(read("navigator/app.js"), /window\.FloeDive\.out\(\$nav\.querySelector\("\.isl"\), href\)/, "app.js도 섬을 넘긴다");
});

test("느리던 것 — 나가기 1.2초 · 서고 기다림 150ms · 물 빠짐 750ms · 끝 1.3초 (전: 1.7 · 0.45 · 1.1 · 1.95초)", () => {
  const d = read("navigator/dive.js");
  assert.ok(num(d, "OUT_MS") <= 1200 && num(d, "OUT_GO") <= num(d, "OUT_MS"), "나가기");
  assert.ok(num(d, "ARRIVE_WAIT") <= 200, "다 읽힌 뒤 기다림");
  assert.ok(num(d, "ARRIVE_MS") <= 800 && num(d, "ARRIVE_END") <= 1400, "물 빠짐 · 끝");
  assert.ok(num(d, "ARRIVE_JUMP") < num(d, "ARRIVE_END"), "점프는 끝나기 전에");
  const total = num(d, "OUT_GO") + num(d, "ARRIVE_WAIT") + num(d, "ARRIVE_END");
  assert.ok(total <= 2700, `누르고 서고를 쓸 수 있기까지 ${total}ms`);
});

test("서고 → 작업 화면 — 물이 차오르고 플로로가 잠수한 뒤 &back으로 넘어가고, 작업 화면은 처음부터 물이 덮였다가 빠지며 섬이 내려앉는다", () => {
  const d = read("navigator/dive.js"), lib = read("library/library.js"), nav = read("navigator/index.html"), app = read("navigator/app.js");
  assert.match(d, /function leave\(href, seal\)/);
  assert.match(d, /function surface\(\{ cover, island, done \}\)/);
  assert.match(d, /window\.FloeDive = \{ out, arrive, jump, leave, surface, floroSize \}/);
  assert.match(lib, /a\.lib-out, a\.go\[href\*="navigator\/index\.html"\]/, "서고의 '작업 화면으로' · 입구의 링크를 가로챈다");
  assert.match(lib, /window\.FloeDive\.leave\(`\$\{a\.getAttribute\("href"\)\}&back`, seal\)/);
  assert.match(lib, /prefers-reduced-motion: reduce\)"\)\.matches\) return;/, "움직임 줄이기면 그냥 넘어간다");
  assert.match(nav, /if \(\/\[#&\]back\(&\|\$\)\/\.test\(location\.hash\)\) document\.documentElement\.classList\.add\("surfacing"\)/, "머리에서 바로");
  assert.match(nav, /<div class="dive" id="dive-cover" aria-hidden="true"><\/div>/);
  assert.match(read("navigator/dive.css"), /html:not\(\.dive-in\):not\(\.surfacing\) #dive-cover\{display:none\}/);
  assert.match(app, /history\.replaceState\(null, "", `\$\{location\.pathname\}\$\{location\.hash\.replace\(\/&back/, "새로 고침하면 또 떠오르지 않게");
  assert.match(app, /window\.FloeDive\.surface\(\{ cover: document\.getElementById\("dive-cover"\), island: \$nav\.firstElementChild/);
});

test("앱 — 창을 먼저 넓힌 뒤(floe:expanded) 섬을 제자리에 붙든 채 잠수하고, 그동안 섬 크기를 보내지 않는다", () => {
  const app = read("navigator/app.js"), css = read("navigator/app.css");
  assert.match(app, /window\.floeApp\.onExpanded\(\(d\) => \{ off\(\); go\(d\); \}\)/);
  assert.match(app, /setTimeout\(\(\) => go\(null\), 400\)/, "앱이 답하지 않아도 0.4초 뒤에는 간다");
  assert.match(app, /\$nav\.style\.setProperty\("--dy", `\$\{Math\.max\(0, Math\.round\(d\.dy\)\)\}px`\)/, "위로는 못 올린다(창 밖)");
  assert.match(app, /if \(h\.classList\.contains\("diving"\) \|\| h\.classList\.contains\("surfacing"\)\) return;/);
  assert.match(css, /html\.in-app\.diving \.nav\{transform:translate\(var\(--dx,0px\),var\(--dy,0px\)\)\}/);
});

test("플로로 크기 — 서고는 창의 짧은 변(vmin), 섬은 글자 크기(--ui-scale)를 따른다", () => {
  assert.match(read("library/library.css"), /#lib-seal svg\.cat\{width:clamp\(120px,17vmin,260px\);height:auto\}/);
  assert.match(read("library/library.css"), /#hall-seal svg\.cat\{width:clamp\(96px,14vmin,210px\);height:auto\}/);
  const css = read("navigator/app.css");
  assert.match(css, /\.isl \.mc-cat svg\.cat\{width:calc\(116px \* var\(--ui-scale,1\)\);height:auto\}/);
  assert.match(css, /\.mc-cat\{position:relative;flex:none;width:calc\(124px \* var\(--ui-scale,1\)\)/);
});
