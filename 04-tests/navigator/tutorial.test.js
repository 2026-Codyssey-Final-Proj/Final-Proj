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

// ── 배우기는 도전과제에서(C-35, 2026-10-24 — 이재엽 "배우기 내용은 게이트마다 필요한것들은 도전과제에서 확인이 가능하도록") ──
test("기능마다 처음 쓰는 장(chap 0~7)이 있고, forChap(n)은 그 장의 관문 전에 알아 둘 기능을 목록 순서대로 준다 [제안 — 장 배치는 이재엽이 고친다]", () => {
  for (const t of T.LIST) assert.ok(Number.isInteger(t.chap) && t.chap >= 0 && t.chap <= 7, `${t.id}의 장`);
  assert.deepEqual(T.forChap(0).map((t) => t.id), T.LIST.filter((t) => t.chap === 0).map((t) => t.id));
  assert.ok(T.forChap(0).some((t) => t.id === "quest"), "1단계에 퀘스트 받기");
  assert.ok(T.forChap(0).some((t) => t.id === "handoff"), "맡기기는 계획을 확정하면 어느 단계에서든 — 처음 장에서 알아 둔다");
  assert.deepEqual(T.forChap(9), [], "없는 장은 빈 목록");
  const all = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((n) => T.forChap(n).map((t) => t.id));
  assert.deepEqual([...all].sort(), [...WANT].sort(), "기능 열 개가 한 번씩 어느 장에든 있다");
});

test("튜토리얼 글은 옛 명령 칸(맡기기(1) · 살피기(2) · 책(3) · 배우기)을 가리키지 않는다 — 네 칸은 2026-10-24에 오버레이에서 뺐다", () => {
  for (const t of T.LIST) {
    const all = [t.what, ...t.steps, t.stuck].join(" ");
    assert.ok(!/명령 칸|\([1-4]\)를 눌러요|\([1-4]\)을 눌러요|두루마리/.test(all), `${t.id}: ${all.slice(0, 60)}`);
  }
  assert.notEqual(T.byId("handoff").try.act, "cmd-hand", "맡기기 해 보기는 채팅의 계획 세우기로");
});
