// claude-drafted: 2026-10-20 — 앱 9.0.0 섬 묶음(C-17 · C-18 · C-19 · C-20 · F-26 · F-45 · F-46)의 글 · 규칙 시험. 동작은 e2e modes-flow.test.js가 본다.
// 실행: node --test 04-tests/navigator/app-9.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const Seal = require(path.join(FRONT, "navigator/seal.js"));
const app = read("navigator/app.js"), css = read("navigator/app.css"), sealCss = read("navigator/seal.css");

test("C-20: 접히기까지 단추 다섯(5 · 10 · 15 · 30 · 60) · 기본 15 · 이 컴퓨터에 저장(floe:fold-delay). 아래 게이지바(.cd)는 없고 테두리 빛(.glow)이 있다 — 각도(--glow-p)만 움직인다", () => {
  assert.match(app, /FOLD_CHOICES = \[5, 10, 15, 30, 60\]/);
  assert.match(app, /FOLD_KEY = "floe:fold-delay"/);
  assert.ok(!/class="cd"/.test(app) && !/\.cd\{/.test(css) && !/@keyframes shrink/.test(css), "옛 게이지바가 없다");
  assert.match(css, /@property --glow-p/);
  assert.match(css, /\.isl \.glow\{[^}]*conic-gradient\(from 0deg/);
  assert.match(css, /@keyframes glow\{from\{--glow-p:0\}to\{--glow-p:1\}\}/);
  assert.match(css, /prefers-reduced-motion:reduce\)\{[^}]*\}[^@]*\.isl \.glow\{animation:none/, "움직임 줄이기면 빛이 움직이지 않는다");
  assert.match(app, /st\.ui === "home" \? foldDelay\(\) : DELAY\[st\.ui\]/, "펼친 섬만 설정을 따른다 — 한 줄 → 띠는 그대로");
});

test("C-18: 파란 먹이 층 — 끌고 있는 동안만(dragenter · dragleave 횟수), 글 '플로로에게 먹이를 주세요', 폴더 안 물고기 그림, 움직임 줄이기면 나타남 움직임 없음", () => {
  assert.match(app, /addEventListener\("dragenter"/); assert.match(app, /addEventListener\("dragleave"/);
  assert.match(app, /dragDepth/);
  assert.ok(app.includes("플로로에게 먹이를 주세요") && app.includes("fl-fish") && app.includes("fl-folder"));
  assert.match(css, /\.feedlayer\.show\{/);
  assert.match(css, /\.feedlayer\.show\{animation:none\}/);
});

test("C-19: 막는 조건은 상태 둘(st.meal · st.busy)뿐 — 판정 규칙을 화면에서 다시 만들지 않는다. 플로로에 화난 표정(angry)과 X 표지판(s-sign)이 있고 막을 때만 보인다", () => {
  assert.match(app, /const mealWhy = \(\) => \(st\.meal \?/); assert.match(app, /const busyWhy = \(\) => \(st\.busy \?/);
  for (const act of ["judge", "draft", "review", '"lib-enter"']) assert.ok(new RegExp(`${act}: \\(\\) => \\{ if \\(refuse\\(mealWhy\\(\\)\\)\\) return;`).test(app), `${act}는 먹이 검사 중에 막힌다`);
  assert.match(app, /"feed-example": \(\) => \{ if \(refuse\(busyWhy\(\)\)\) return;/);
  assert.match(app, /if \(refuse\(busyWhy\(\)\)\) return;   \/\/ C-19: 살펴보는 중에는 먹이를 받지 않는다/);
  assert.ok(Seal.MOODS.includes("angry"));
  const svg = Seal.svg("angry", 100);
  assert.ok(svg.includes('class="cat m-angry"') && svg.includes("s-sign") && svg.includes("e-angry"));
  assert.match(sealCss, /\.m-angry \.e-angry,\.m-angry \.s-sign\{display:inline\}/);
  const hide = sealCss.indexOf('.cat [class^="s-"]{display:none}'), show = sealCss.indexOf(".m-angry .e-angry,.m-angry .s-sign{display:inline}");
  assert.ok(hide > 0 && show > hide, "보이는 규칙이 숨기는 규칙 뒤에 있다");
  assert.ok(!Seal.svg("idle", 36, { face: true }).includes("s-sign"), "얼굴만 그릴 때는 표지판이 없다");
  assert.match(app, /angry: "안 돼요!"/, "기분 말");
});

test("F-26: 네 / 아니요 둘뿐인 게이트 장면에서 밖의 칸이 그 둘(1 · 2 키)이 된다", () => {
  assert.match(app, /const pair = inGate && v\.acts\.length === 2 && v\.acts\.every\(\(a\) => a\.act === "yes" \|\| a\.act === "no"\)/);
  assert.match(app, /class="cmds two"/);
  assert.match(css, /\.lvc \.cmds\.two\{grid-template-columns:repeat\(2/);
});

test("F-45: 기준점 하나 — 앱 안의 섬은 창 가운데(left:50% + translate), 설정 창이 옆에 열릴 때만 왼쪽 고정, 접힌 창 여유는 대칭. 움직임 키프레임에 -50% 가운데 맞춤이 없다", () => {
  assert.match(css, /\.in-app \.nav\{left:50%;top:0;transform:none;translate:-50% 0;/);
  assert.match(css, /\.in-app \.nav\.side\{[^}]*left:0;translate:0 0/);
  assert.match(css, /\.in-app \.nav\.peekroom\{padding:0 12px 8px\}/);
  assert.ok(!/@keyframes fly\{[^}]*translate\(-50%/.test(css), "fly 키프레임에 가운데 맞춤이 없다");
  const lib = read("library/library.css");
  assert.ok(!/@keyframes say-pop \{[^}]*translateX\(-50%\)/.test(lib) && !/@keyframes spin \{[^}]*translate\(-50%/.test(lib));
  assert.match(app, /const from = \$nav\.classList\.contains\("side"\) \? prev : \{ \.\.\.prev, x: to\.left \+ \(to\.width - prev\.w\) \/ 2 \}/, "가운데를 맞춘다");
  assert.match(app, /if \(p\.order === "resize-then-animate" && !morphHold\) measureSize\(\);/, "커질 때는 창을 먼저");
  assert.match(css, /--t-short:\.16s; --t-base:\.24s; --t-long:\.4s;/, "시간 · 곡선 묶음");
});

test("F-46: 배치를 바꾸는 움직임을 줄였다 — 경험치 막대는 transform(scaleX), 보이지 않을 때 물범 움직임 멈춤(data-ui · page-hidden)", () => {
  assert.match(css, /\.lvc \.xp i\{[^}]*transition:transform/); assert.ok(!/\.lvc \.xp i\{[^}]*transition:width/.test(css));
  assert.match(app, /transform:scaleX\(\$\{\(xp \/ max\)\.toFixed\(3\)\}\)/);
  assert.match(app, /document\.documentElement\.dataset\.ui = st\.ui;/);
  assert.match(sealCss, /html\[data-ui="hidden"\] \.cat \*, html\.page-hidden \.cat \* \{ animation-play-state: paused; \}/);
});
