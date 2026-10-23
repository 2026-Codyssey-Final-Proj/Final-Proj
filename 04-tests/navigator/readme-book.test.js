// claude-drafted: 2026-10-23 — C-26 내 작업 책: README를 받아 와 보여 주기만(이재엽 "책의 작업들은 readme 에서 작업해서 우리가 그 내용들을 받아서 오고 책에서 보여주는 역할만").
// readme-book.js의 순수 함수 시험 — 코드보다 먼저 썼다(code.md 1번). 책은 README를 고치지 않는다: 나누기만 한다.
// 실행: node --test 04-tests/navigator/readme-book.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const RB = require("../../03-backend/navigator/readme-book.js");

const SAMPLE = [
  "# 동아리 행사 신청 앱", "부원이 행사에 신청하는 앱", "",
  "## 버전", "- V.2 · 2026-10-25 · 꼭 필요한 기능 셋", "- V.1 · 2026-10-24 · 누가 어떤 불편을 겪나", "",
  "## 1단계 · 무엇을 만들지 정하기", "생각: 회장이 신청을 손으로 받는다", "```", "## 코드 안의 줄은 제목이 아니다", "```", "### 배운 말", "- 범위", "",
  "## 2단계 · 적어 두기", "한 일: 문제를 한 문장으로", "",
].join("\n");

test("README 나누기: # 제목 · 그 아래 한 줄 · ## 마다 한 장(목차). ### 는 장 안에 남고, 코드 칸 안의 ## 는 제목이 아니다", () => {
  const b = RB.parse(SAMPLE);
  assert.equal(b.title, "동아리 행사 신청 앱");
  assert.equal(b.intro, "부원이 행사에 신청하는 앱");
  assert.deepEqual(b.chapters.map((c) => c.title), ["1단계 · 무엇을 만들지 정하기", "2단계 · 적어 두기"]);
  assert.deepEqual(b.chapters.map((c) => c.id), ["ch-1", "ch-2"], "목차에서 누르면 갈 자리");
  assert.match(b.chapters[0].body, /코드 안의 줄은 제목이 아니다/);
  assert.match(b.chapters[0].body, /### 배운 말/);
});

test("'## 버전' 장은 장이 아니라 버전 줄 — V.n · 날짜 · 제목, 적힌 순서 그대로(맨 위가 최근)", () => {
  const b = RB.parse(SAMPLE);
  assert.deepEqual(b.versions, [{ v: "V.2", date: "2026-10-25", title: "꼭 필요한 기능 셋" }, { v: "V.1", date: "2026-10-24", title: "누가 어떤 불편을 겪나" }]);
  assert.ok(!b.chapters.some((c) => c.title === "버전"));
  assert.deepEqual(RB.parse("## 버전 기록\n- V.3 · 2026-10-26 · 뼈대\n- 아무 말\n").versions, [{ v: "V.3", date: "2026-10-26", title: "뼈대" }], "모양이 아닌 줄은 버린다");
});

test("빈 글 · 글이 아닌 것 · 제목만 있는 글도 깨지지 않는다. 너무 긴 글은 잘라 읽고 잘랐다고 알린다", () => {
  for (const x of [undefined, null, 3, {}, ""]) assert.deepEqual(RB.parse(x), { title: "", intro: "", versions: [], chapters: [], cut: false });
  assert.deepEqual(RB.parse("# 제목만").chapters, []);
  const long = "# 긴 책\n" + "## 장\n" + "가".repeat(RB.MAX + 10);
  const b = RB.parse(long);
  assert.equal(b.cut, true); assert.ok(b.chapters[0].body.length <= RB.MAX);
  const many = RB.parse("## 하나\n가\n".repeat(RB.MAX_CHAPTERS + 5));
  assert.equal(many.chapters.length, RB.MAX_CHAPTERS, "장은 정한 수까지"); assert.equal(many.cut, true, "장을 버렸으면 잘랐다고 알린다");
  assert.deepEqual(RB.parse("## 장\n~~~\n## 물결 코드 칸\n~~~\n").chapters.map((c) => c.title), ["장"], "~~~ 코드 칸 안의 ## 도 제목이 아니다");
});

test("연습 예시 README(동아리 행사 등록 앱) — 버전 줄과 장 셋 이상, 쉬운 말", () => {
  const b = RB.parse(RB.EXAMPLE);
  assert.ok(b.title); assert.ok(b.versions.length >= 2); assert.ok(b.chapters.length >= 3);
  const Nav = require("../../03-backend/navigator/navigator.js");
  for (const w of Nav.JARGON) assert.ok(!RB.EXAMPLE.includes(w), `예시 README에 ${w}`);
});
