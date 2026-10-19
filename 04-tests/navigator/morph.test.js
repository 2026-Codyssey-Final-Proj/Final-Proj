// claude-drafted: 2026-10-20 — C-14 섬의 움직임(이재엽 "마우스를 가져다가 두면 조금 커져서 … 높이는 조금 높이고 옆으로 늘어나는 에니메이션", 버튼 "섬이 접히고 펼쳐질 때").
// 넘김 문서(fable-handoff-2026-10-20-modes.md) 6절 — morph.js(순수)의 숫자 · 순서와, app.js · app.css가 그 규칙대로 이어 붙였는지(글로)를 본다.
// 실행: node --test 04-tests/navigator/morph.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const MO = require("../../02-frontend/navigator/morph.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");

test("올리면 커지는 크기 — 세로 +6 · 가로 +24, 비율은 크기에 따라(0이면 1)", () => {
  assert.deepEqual(MO.PEEK, { w: 24, h: 6 });
  assert.deepEqual(MO.peekSize(400, 50), { w: 424, h: 56 });
  const s = MO.peekScale(400, 50);
  assert.ok(Math.abs(s.sx - 1.06) < 1e-9 && Math.abs(s.sy - 1.12) < 1e-9);
  assert.deepEqual(MO.peekScale(0, 0), { sx: 1, sy: 1 });
  assert.deepEqual(MO.RESERVE, { w: 24, h: 8 }, "접힌 창의 여유 — 올림 커짐이 창 크기를 바꾸지 않게");
});

test("순서 — 커질 때는 창을 먼저 키우고 움직이고(0.3초, 살짝 튕김), 작아질 때는 움직임이 끝난 뒤 창을 줄인다(0.24초). 움직임 줄이기면 0ms", () => {
  const up = MO.plan({ w: 150, h: 52 }, { w: 940, h: 420 });
  assert.equal(up.order, "resize-then-animate");
  assert.equal(up.ms, 300);
  assert.equal(up.easing, MO.EASE.expand);
  assert.ok(up.reveal > 0 && up.reveal < 1, "내용은 바탕이 자란 뒤 나타난다");
  const down = MO.plan({ w: 940, h: 420 }, { w: 400, h: 50 });
  assert.equal(down.order, "animate-then-resize");
  assert.equal(down.ms, 240);
  assert.equal(down.easing, MO.EASE.collapse);
  assert.equal(MO.plan({ w: 150, h: 52 }, { w: 940, h: 420 }, { still: true }).ms, 0, "움직임 줄이기 — 바로");
  assert.equal(MO.plan(null, { w: 1, h: 1 }).order, "resize-then-animate", "이상한 값은 커지는 쪽");
});

test("FLIP — 끝 상자에 둔 바탕이 처음 상자처럼 보이려면 얼마나 옮기고 늘려야 하나(왼쪽 위 기준)", () => {
  const f = MO.flip({ x: 100, y: 0, w: 150, h: 52 }, { x: 20, y: 0, w: 940, h: 416 });
  assert.equal(f.dx, 80); assert.equal(f.dy, 0);
  assert.ok(Math.abs(f.sx - 150 / 940) < 1e-9 && Math.abs(f.sy - 0.125) < 1e-9);
  assert.deepEqual(MO.flip({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 0, w: 0, h: 0 }), { dx: 0, dy: 0, sx: 1, sy: 1 }, "0으로 나누지 않는다");
});

test("app.js — 모양이 바뀌면 바탕 껍데기(.shell)가 FLIP으로 움직이고(transform · opacity만), 줄어드는 동안은 창 크기를 보내지 않으며, 접힌 창에 여유를 둔다", () => {
  const app = read("navigator/app.js"), css = read("navigator/app.css");
  assert.match(app, /const prev = moved \? snapShape\(\) : null;/, "갈아 끼우기 전에 상자를 잰다");
  assert.match(app, /if \(prev\) morphFrom\(prev\);/);
  assert.match(app, /shell\.animate\(\[\{ transform: `translate\(\$\{f\.dx\}px,\$\{f\.dy\}px\) scale\(\$\{f\.sx\},\$\{f\.sy\}\)`/, "껍데기는 transform으로");
  const block = app.slice(app.indexOf("function morphFrom"), app.indexOf("function peekReady"));
  assert.doesNotMatch(block, /animate\(\[[^\]]*(width|height|clipPath|filter|borderRadius)/, "너비 · 높이 · clip-path · filter를 움직이지 않는다(껍데기 크기는 처음에 한 번 둔다)");
  assert.match(app, /morphHold = p\.order === "animate-then-resize";/);
  assert.match(app, /if \(morphHold\) return;/, "measureSize — 줄어드는 동안 보내지 않는다");
  assert.match(app, /if \(morphHold\) \{ morphHold = false; lastSize = ""; queueSize\(\); \}/, "끝나면 한 번 보낸다");
  assert.match(app, /greetSkip \|\| h\.classList\.contains\("greeting"\) \|\| h\.classList\.contains\("surfacing"\) \|\| h\.classList\.contains\("diving"\)\) return;/, "인사 · 잠수 · 떠오름 중에는 하지 않는다");
  assert.match(app, /\$nav\.classList\.toggle\("peekroom", !!window\.floeApp && \(st\.ui === "hidden" \|\| st\.ui === "petit"\)\)/);
  assert.match(app, /r \+= MO\.RESERVE\.w \/ 2; b \+= MO\.RESERVE\.h;/, "접힌 창의 여유");
  assert.match(css, /\.nav \.shell\{position:absolute;z-index:-1;transform-origin:0 0;will-change:transform;pointer-events:none\}/);
  assert.match(css, /\.nav \.morph-bg\{background:transparent!important;box-shadow:none!important/);
  assert.match(css, /\.in-app \.nav\.peekroom\{padding:0 0 8px 12px\}/);
});

test("app.css — 접힌 한 줄에 올리면 살짝 커진다(0.2초 튕김, 떠나면 0.16초), 움직임 줄이기면 그대로", () => {
  const css = read("navigator/app.css"), app = read("navigator/app.js");
  assert.match(css, /\.pill\{transform-origin:50% 0;transition:transform \.16s ease-out\}/);
  assert.match(css, /\.pill:hover\{transform:scale\(var\(--px,1\.06\),var\(--py,1\.12\)\);transition:transform \.2s cubic-bezier\(\.3,1\.4,\.5,1\)\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.pill,\.pill:hover\{transform:none;transition:none\}\}/);
  assert.match(app, /const \{ sx, sy \} = MO\.peekScale\(pill\.offsetWidth, pill\.offsetHeight\);/, "비율은 크기마다 잰다");
  assert.match(read("navigator/index.html"), /<script src="morph\.js"><\/script>/);
});
