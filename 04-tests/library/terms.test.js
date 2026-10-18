// claude-drafted: 2026-10-18 — 고칠 목록 F-10(이재엽 "나는 계속 GO야" — FR-13 "모르는 말은 그 자리에서 풀어 준다"를 서재에도):
// 서재 · 펼친 책 · 전체 돌아보기에 큰 글씨로 나오는 배운 말(EARS · MoSCoW …)은 그대로 두되, 누르면 쉬운 말 풀이가 나온다.
// 실행: node --test 04-tests/library/terms.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const D = require("../../02-frontend/library/books.js");
const N = require("../../03-backend/navigator/navigator.js");
const G = require("../../03-backend/navigator/glossary.js");
const LIB = path.join(__dirname, "../../02-frontend/library");

test("글 속의 배운 말을 찾는다 — 'EARS로 기능 한 줄씩'에서 EARS, 긴 말을 먼저(MoSCoW·Kano가 MoSCoW보다 먼저)", () => {
  assert.equal(G.find("EARS로 기능 한 줄씩").term, "EARS");
  assert.equal(G.find("MoSCoW·Kano로 나누기").term, "MoSCoW·Kano");
  assert.equal(G.find("MoSCoW로 줄이기").term, "MoSCoW");
  assert.ok(G.find("EARS").line.length > 0);
  assert.equal(G.find("숫자로 말하기"), null, "풀이할 말이 없으면 null — 화면은 누를 수 없는 표시로 둔다");
  assert.equal(G.find(""), null);
});

test("서재 데이터의 꼬리표 · 책갈피 가운데 전문 용어가 든 말은 모두 풀이가 있다", () => {
  const words = new Set();
  for (const b of [...D.SHELF, ...D.OPEN]) for (const t of [...(b.tags || []), ...(b.bookmarks || [])]) words.add(t);
  const library = fs.readFileSync(path.join(LIB, "library.js"), "utf8");
  for (const m of library.matchAll(/\["([^"]+)", "(?:left|right):/g)) words.add(m[1]);   // 책장 사이의 말 표시(CHIPS)
  const missing = [...words].filter((t) => N.JARGON.some((j) => t.includes(j)) && !G.find(t));
  assert.deepEqual(missing, [], "풀이가 없는 배운 말");
});

test("서재 화면이 풀이 파일을 서재 동작보다 먼저 불러온다", () => {
  const html = fs.readFileSync(path.join(LIB, "index.html"), "utf8");
  const g = html.indexOf("navigator/glossary.js"), l = html.indexOf('src="library.js"');
  assert.ok(g > 0 && l > g, "glossary.js가 library.js보다 먼저");
});
