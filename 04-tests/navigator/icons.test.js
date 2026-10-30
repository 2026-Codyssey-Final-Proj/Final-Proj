// claude-drafted: 2026-10-30 — app.js 나누기 3차(이재엽 "그 순서대로 진행" · "자는 동안 차례대로"): 얽힘이 적은 아이콘을 진짜 모듈 icons.js(window.FloeIcons)로.
// 지키는 것: ① 선 아이콘(I) · 무지개 조개(SHELL_ICO · coin)는 icons.js 한 곳에만 있고 app.js는 그것을 받아 쓴다 ② 아이콘 글은 장식이라 화면 읽기에서 숨긴다(aria-hidden)
//   ③ 화면(index.html)이 app.js보다 먼저 부른다(서버가 내주는지는 static-files.test.js)
// 실행: node --test 04-tests/navigator/icons.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const NAV = path.join(__dirname, "../../02-frontend/navigator");
const IC = require(path.join(NAV, "icons.js"));

test("선 아이콘 — 이름마다 장식용 svg 하나, 크기를 받는다", () => {
  for (const k of ["up", "down", "pin", "back", "undo", "today", "map", "doc", "gear", "check", "arrow", "bubble", "all", "lib", "hand", "look", "bag", "moon", "home", "scroll"]) {
    assert.match(IC.I[k], /^<svg width="\d+" height="\d+" viewBox="0 0 24 24" fill="none" stroke="currentColor"[^>]* aria-hidden="true">.+<\/svg>$/, k);
  }
  assert.match(IC.icon('<path d="M1 1"></path>', 30), /^<svg width="30" height="30" /);
  assert.match(IC.icon('<path d="M1 1"></path>'), /^<svg width="16" height="16" /, "기본 크기 16");
});

test("무지개 조개 — 그림 하나(SHELL_ICO)를 coin()이 감싼다", () => {
  assert.match(IC.SHELL_ICO, /^<svg viewBox="0 0 24 24"/);
  assert.equal(IC.coin(), `<i class="coin" aria-hidden="true">${IC.SHELL_ICO}</i>`);
});

test("아이콘은 icons.js 한 곳에 — app.js는 받아 쓰고, 화면이 app.js보다 먼저 부른다", () => {
  const app = fs.readFileSync(path.join(NAV, "app.js"), "utf8");
  assert.match(app, /^  const \{ icon, I, SHELL_ICO, coin \} = window\.FloeIcons;/m, "app.js는 받아 쓴다");
  assert.doesNotMatch(app, /const (SHELL_ICO|I|icon|coin) = /, "app.js에 그림을 다시 두지 않는다");
  const html = fs.readFileSync(path.join(NAV, "index.html"), "utf8");
  assert.ok(html.indexOf('<script src="icons.js"></script>') > 0 && html.indexOf('<script src="icons.js"></script>') < html.indexOf('<script src="app.js"></script>'), "app.js보다 먼저");
  // 서버가 내주는지는 static-files.test.js가 화면의 script 목록과 맞대어 본다
});
