// claude-drafted: 2026-10-23 — C-30 배우기: 기능마다 튜토리얼(이재엽 "우리 작업들은 하나씩 나누어서 테스트를 할것이고 온보딩 자료처럼 하나씩 작업들을 어떻게 작동할것이고 어떻게 만들어야할지 예시들을").
// tutorial.js(자료)의 모양 시험 — 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/tutorial.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../../03-backend/navigator/tutorial.js");
const Nav = require("../../03-backend/navigator/navigator.js");

const WANT = ["quest", "handoff", "check", "card", "save", "level", "plan", "book", "feed", "study"];   // 요구서 C-30의 기능 목록 순서

test("기능 열 개가 요구서 C-30의 순서대로 있고 아이디는 겹치지 않는다", () => {
  assert.deepEqual(T.LIST.map((t) => t.id), WANT);
  assert.equal(T.byId("book").id, "book"); assert.equal(T.byId("없음"), null);
});

test("한 장의 모양: 이름 · 한 줄 · 순서 2~5칸 · 예시(적는 것 → 되는 것) · 막히면 · 상태(있음 / 만드는 중). 있는 기능은 '해 보기' 단추가 있다", () => {
  for (const t of T.LIST) {
    assert.ok(t.name && t.what, t.id);
    assert.ok(Array.isArray(t.steps) && t.steps.length >= 2 && t.steps.length <= 5, `${t.id} 순서 칸 수`);
    assert.ok(t.example && t.example.in && t.example.out, `${t.id} 예시`);
    assert.ok(t.stuck, `${t.id} 막히면`);
    assert.ok(["ready", "soon"].includes(t.state), `${t.id} 상태`);
    if (t.state === "ready") assert.ok(t.try && t.try.act && t.try.label, `${t.id} 해 보기`);
  }
  assert.ok(T.LIST.filter((t) => t.state === "ready").length >= 4, "있는 기능부터 시험할 수 있게");
});

test("'해 보기'의 이름은 화면(app.js)의 누르기(ACT)에 실제로 있다 — 틀리면 눌러도 조용히 아무 일도 없다(리뷰 2026-10-23)", () => {
  const app = require("node:fs").readFileSync(require("node:path").join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  for (const t of T.LIST.filter((x) => x.try)) assert.ok(app.includes(`"${t.try.act}": `) || app.includes(`    ${t.try.act}: `), `${t.id}의 ${t.try.act}`);
});

test("쉬운 말(FR-13) — 튜토리얼 글에 전문 용어가 없다", () => {
  for (const t of T.LIST) {
    const all = [t.name, t.what, ...t.steps, t.example.in, t.example.out, t.stuck, t.try ? t.try.label : ""].join(" ");
    for (const w of Nav.JARGON) assert.ok(!all.includes(w), `${t.id}에 ${w}`);
  }
});
