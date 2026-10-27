// claude-drafted: 2026-10-27 — F-66(이재엽 "캔버스가 움직이는것도 안되고"): 작업실 캔버스 탭을 끌어서 옮기고 ⌘/Ctrl+휠(트랙패드 오므리기) · 단추 · 키로 크게 · 작게.
//   canvas-pan.js(순수 계산)의 숫자와, app.js · win.js · win.html · index.html · app.css가 그 규칙대로 이어 붙였는지(글로)를 본다. 실제로 끌리는지는 e2e/workspace-layout.test.js
// 실행: node --test 04-tests/navigator/canvas-pan.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const CP = require("../../02-frontend/navigator/canvas-pan.js");
const read = (p) => fs.readFileSync(path.join(__dirname, "../../02-frontend", p), "utf8");

test("판은 목업과 같은 1100×640, 배율은 0.35 ~ 2.5 안에서만", () => {
  assert.equal(CP.W, 1100); assert.equal(CP.H, 640);
  assert.equal(CP.clampZ(0.1), CP.MIN); assert.equal(CP.clampZ(9), CP.MAX); assert.equal(CP.clampZ(1.3), 1.3);
  assert.equal(CP.clampZ(NaN), 1, "숫자가 아니면 1배");
});

test("zoomAt — 커서 아래의 판 자리는 그대로 두고 배율만 바꾼다", () => {
  const v = { free: true, x: 40, y: 30, z: 1 }, px = 300, py = 200;
  const board = (w) => [(px - w.x) / w.z, (py - w.y) / w.z];   // 커서 아래 판의 좌표
  const w = CP.zoomAt(v, 2, px, py);
  assert.equal(w.z, 2); assert.deepEqual(board(w), board(v));
  const lo = CP.zoomAt(v, 0.01, px, py);
  assert.equal(lo.z, CP.MIN, "바닥에서 멈춘다"); assert.deepEqual(board(lo).map(Math.round), board(v).map(Math.round));
});

test("fit — 칸 안에 판을 통째로, 가운데에(여백 16) · 1배보다 키우지 않는다(app.css 줌의 --u도 1px까지)", () => {
  const f = CP.fit(1200, 800);
  assert.ok(f.free); assert.equal(f.z, 1, "넓은 칸에서도 1배");
  assert.equal(CP.fit(800, 500).z, Math.min((800 - 32) / 1100, (500 - 32) / 640));
  assert.equal(Math.round(f.x * 2), Math.round(1200 - 1100 * f.z)); assert.equal(Math.round(f.y * 2), Math.round(800 - 640 * f.z));
  assert.equal(CP.fit(200, 120).z, CP.MIN, "아주 작은 칸에서도 바닥 아래로는 줄지 않는다");
});

test("keepIn — 판이 칸 밖으로 다 나가지 않게, 적어도 80px은 보인다", () => {
  const far = CP.keepIn({ free: true, x: 5000, y: -5000, z: 1 }, 900, 600);
  assert.equal(far.x, 900 - 80); assert.equal(far.y, 80 - 640);
  const ok = { free: true, x: 10, y: 20, z: 1 };
  assert.deepEqual(CP.keepIn(ok, 900, 600), ok, "보이는 판은 그대로");
});

test("pan — 끈 만큼 옮기고 keepIn으로 묶는다", () => {
  const v = CP.pan({ free: true, x: 0, y: 0, z: 1 }, 30, -20, 900, 600);
  assert.deepEqual([v.x, v.y], [30, -20]);
});

test("label — 맞춤이면 '맞춤', 옮기거나 키우면 몇 %", () => {
  assert.equal(CP.label({ free: false, z: 1 }), "맞춤"); assert.equal(CP.label({ free: true, z: 1.234 }), "123%");
});

test("서버는 canvas-pan.js를 내준다(정해진 파일만 — server.js STATIC)", () => {
  const s = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8");
  assert.match(s, /"02-frontend\/navigator": \[[^\]]*"canvas-pan\.js"/);
});

test("화면 — 캔버스는 .cvw 안에 .cv(포커스 · 설명) > .cvp(옮기는 층) > .cvb, 아래 단추 셋(data-cv — 섬으로 보내지 않고 작업실 안에서)", () => {
  const a = read("navigator/app.js"), cv = a.slice(a.indexOf("function canvasPane"), a.indexOf("function fileCard"));
  assert.ok(cv.includes('<div class="cvw"><div class="cv" tabindex="0" role="region" aria-label="${CV_HINT}"><div class="cvp"><div class="cvb" style="--fa:'), "판을 감싸는 층");
  assert.ok(cv.includes("</div></div></div>${CV_TOOLS}</div>"), "단추는 .cv 밖 — 스크롤 · 옮기기와 상관없이 오른쪽 아래");
  const tools = a.slice(a.indexOf("const CV_TOOLS"), a.indexOf("function canvasPane"));
  for (const s of ['data-cv="out"', 'data-cv="fit"', 'data-cv="in"']) assert.ok(tools.includes(s), s);
  assert.ok(!/data-act=/.test(tools), "단추에 data-act가 없다 — win.js가 섬으로 보내지 않는다");
  assert.match(a, /const CVP = window\.FloeCanvas \|\| null;/);
  assert.match(a, /if \(CVP\) CVP\.apply\(\$nav\);/, "브라우저 판 — 다시 그린 뒤 보던 자리로");
});

test("작업실 창(win.js) — 섬이 보낸 HTML로 바꾼 뒤 보던 자리 · 배율을 되돌리고, 옮긴 캔버스는 '지금' 칸으로 스크롤하지 않는다", () => {
  const w = read("navigator/win.js");
  assert.match(w, /root\.innerHTML = html \|\| "";\s*\n\s*if \(window\.FloeCanvas\) window\.FloeCanvas\.apply\(root\);/);
  assert.match(w, /!root\.querySelector\("\.cv\.free"\) && root\.querySelector\("\.cv-c\.now"\)/);
  for (const page of ["navigator/win.html", "navigator/index.html"]) {
    const h = read(page), at = h.indexOf('<script src="canvas-pan.js"></script>');
    assert.ok(at > 0, `${page}에 canvas-pan.js`); assert.ok(at < h.indexOf(page.endsWith("win.html") ? '<script src="win.js">' : '<script src="app.js">'), "먼저 읽는다");
  }
});

test("app.css — 옮기는 층은 판 크기(1100×640)의 컨테이너라 줌 배치(--u = 1px)를 그대로 쓰고, 움직임 줄이기면 바로", () => {
  const c = read("navigator/app.css");
  assert.match(c, /\.cvp\{display:contents\}/, "맞춤일 때는 층이 없는 것과 같다 — 줌 · 다시 배치 그대로");
  assert.match(c, /\.cv\.free>\.cvp\{display:block;position:absolute;left:0;top:0;width:1100px;height:640px;container-type:size;transform-origin:0 0;transform:translate\(var\(--cvx,0px\),var\(--cvy,0px\)\) scale\(var\(--cvz,1\)\)/);
  assert.match(c, /\.cv\.free\{overflow:hidden;/);
  assert.match(c, /@media \(prefers-reduced-motion:reduce\)\{\.cv\.free\.ease>\.cvp\{transition:none\}\}/);
  assert.match(c, /\.cv-tools button\{[^}]*min-width:44px;height:44px/, "누르는 곳 44px");
});
