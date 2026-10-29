// claude-drafted: 2026-10-24 — C-34 준비 계획판 · C-32 맡길 일 목록의 규칙(03-backend/navigator/plan.js, 화면과 시험이 같이 쓴다). 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/plan-board.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const B = require("../../03-backend/navigator/plan.js");
const N = require("../../03-backend/navigator/navigator.js");

const PLAN = N.parsePlan({ problem: "신청을 종이로 받아요", have: "README뿐", missing: "화면이 없어요",
  items: [{ need: "회원이 신청한다", check: "목록에 한 줄이 생긴다" }, { need: "운영진이 목록을 본다", check: "이름이 보인다" }], prep: ["칸 정하기"], ask: ["마감이 있나요?"], say: "봐 주세요" });

test("새 계획판: 판 1, 표시 · 의견 · 답은 비어 있고 확정 전 — 다시 세우면 판 번호 +1(같은 줄의 맞아요는 아래 시험처럼 옮긴다)", () => {
  const b = B.board(PLAN);
  assert.equal(b.v, 1); assert.equal(b.confirmed, false);
  assert.deepEqual(b.marks, {}); assert.deepEqual(b.answers, [""]); assert.equal(b.general, "");
  const b2 = B.board(PLAN, B.mark(b, "p2", "fix"));
  assert.equal(b2.v, 2); assert.deepEqual(b2.marks, {}, "고칠래요는 옮기지 않는다");
});

test("맞아요 / 고칠래요 · 의견 · 답 — 원래 판은 바꾸지 않는다", () => {
  const b = B.board(PLAN);
  const b1 = B.note(B.mark(b, "p1", "fix"), "p1", "연락처 칸도");
  assert.deepEqual(b.marks, {}, "원래 판은 그대로");
  assert.equal(b1.marks.p1, "fix"); assert.equal(b1.notes.p1, "연락처 칸도");
  assert.equal(B.mark(b, "p9", "ok").marks.p9, undefined, "없는 줄은 무시");
  assert.equal(B.mark(b, "p1", "maybe").marks.p1, undefined, "모르는 표시는 무시");
  assert.equal(B.answer(b, 0, "금요일").answers[0], "금요일");
  assert.equal(B.answer(b, 5, "x").answers.length, 1);
});

test("확정할 수 있나: 모든 줄이 맞아요일 때만. 다시 세울 거리: 고칠래요 줄의 의견 · 답 · 전체 의견", () => {
  let b = B.board(PLAN);
  assert.equal(B.canConfirm(b), false); assert.equal(B.unmarked(b), 2);
  b = B.mark(B.mark(b, "p1", "ok"), "p2", "ok");
  assert.equal(B.canConfirm(b), true); assert.equal(B.hasFeedback(b), false);
  b = B.note(B.mark(b, "p2", "fix"), "p2", "  ");
  assert.equal(B.canConfirm(b), false); assert.equal(B.hasFeedback(b), false, "빈 의견은 의견이 아니다");
  b = B.answer(B.note(b, "p2", "운영진은 나중에"), 0, "금요일 6시");
  assert.deepEqual(B.feedback(b), { notes: [{ need: "운영진이 목록을 본다", check: "이름이 보인다", note: "운영진은 나중에" }], answers: [{ q: "마감이 있나요?", a: "금요일 6시" }], general: "" });
  assert.equal(B.hasFeedback(b), true);
  assert.equal(B.hasFeedback({ ...B.board(PLAN), general: "전체적으로 좋아요" }), true);
});

test("확정하면 맡길 일 목록 — 줄마다 남음 → 맡김 중 → 보고 옴 → 끝냄, 다르게 봐요는 의견을 달고 다시 남음", () => {
  let b = B.confirm(B.mark(B.mark(B.board(PLAN), "p1", "ok"), "p2", "ok"));
  assert.equal(b.confirmed, true);
  assert.deepEqual(B.progress(b), { done: 0, total: 2 });
  assert.deepEqual(B.taskFor(b, "p1"), { text: "회원이 신청한다", checks: ["목록에 한 줄이 생긴다"] });
  b = B.start(b, "p1"); assert.equal(B.stateOf(b, "p1"), "running"); assert.equal(B.running(b), "p1");
  const rep = { items: [{ check: "목록에 한 줄이 생긴다", done: false, evidence: "" }], easy: "신청 칸만 만들었어요.", ask: "", done: 0, total: 1 };
  b = B.report(b, "p1", rep); assert.equal(B.stateOf(b, "p1"), "report"); assert.equal(B.running(b), "");
  b = B.reject(b, "p1", "목록도 만들어 줘");
  assert.equal(B.stateOf(b, "p1"), "todo");
  assert.deepEqual(B.taskFor(b, "p1"), { text: "회원이 신청한다\n지난번에 사용자가 다르게 본 점: 목록도 만들어 줘\n지난번 보고: 신청 칸만 만들었어요. (끝 조건 0/1)", checks: ["목록에 한 줄이 생긴다"] });   // 지난번 보고 — C-50(2026-10-29)
  b = B.accept(B.report(B.start(b, "p1"), "p1", { ...rep, done: 1 }), "p1");
  assert.equal(B.stateOf(b, "p1"), "done"); assert.deepEqual(B.progress(b), { done: 1, total: 2 });
  assert.equal(B.confirm(B.board(PLAN)).confirmed, false, "모든 줄이 맞아요가 아니면 확정하지 않는다");
});

test("한 번에 하나만 맡긴다 — 맡김 중이면 다른 줄을 시작하지 않는다", () => {
  let b = B.confirm(B.mark(B.mark(B.board(PLAN), "p1", "ok"), "p2", "ok"));
  b = B.start(b, "p1");
  assert.equal(B.stateOf(B.start(b, "p2"), "p2"), "todo");
});

test("저장했던 판 읽기(revive): 모양이 틀리면 null — 고장 난 기록으로 화면이 깨지지 않게", () => {
  const b = B.confirm(B.mark(B.mark(B.board(PLAN), "p1", "ok"), "p2", "ok"));
  assert.deepEqual(B.revive(JSON.parse(JSON.stringify(b))), b);
  for (const bad of [null, "x", {}, { v: 1, plan: { items: "x" } }, { ...b, marks: [] }]) assert.equal(B.revive(bad), null, JSON.stringify(bad).slice(0, 40));
  const stuck = B.revive({ ...B.start(b, "p1") });
  assert.equal(B.stateOf(stuck, "p1"), "running", "맡김 중은 그대로(화면이 서버에 다시 묻는다)");
});

test("연습(서버 없이 FR-10): 예시 계획 · 예시 보고 — 쉬운 말 규칙을 지킨다", () => {
  assert.ok(N.parsePlan(B.EXAMPLE_PLAN), "예시 계획도 같은 모양");
  const r = B.exampleReport(["목록에 한 줄이 생긴다"]);
  assert.equal(r.total, 1); assert.ok(r.easy.length <= 120);
  const words = JSON.stringify([B.EXAMPLE_PLAN, r]);
  for (const j of N.JARGON) assert.ok(!words.includes(j), j);
});

// ── 새 맥락 리뷰(2026-10-24) 뒤에 더한 것 ──
test("다시 세워도 바뀌지 않은 줄(요구 · 기준이 같은)의 맞아요는 그대로 — 바뀐 줄만 다시 본다", () => {
  const b = B.mark(B.mark(B.board(PLAN), "p1", "ok"), "p2", "fix");
  const next = N.parsePlan({ ...PLAN, items: [{ need: "회원이 신청한다", check: "목록에 한 줄이 생긴다" }, { need: "운영진이 목록을 본다", check: "이름과 연락처가 보인다" }] });
  const b2 = B.board(next, b);
  assert.deepEqual(b2.marks, { p1: "ok" });
});

test("예시 계획은 판에 example로 남는다 — 모드를 바꿔도 예시라고 보이고, 진짜 Claude Code로 넘기지 않게(FR-10)", () => {
  const b = B.board(B.EXAMPLE_PLAN, null, { example: true });
  assert.equal(b.example, true);
  assert.equal(B.board(PLAN).example, false);
  assert.equal(B.board(PLAN, b).example, false, "새로 세운 계획은 예시가 아니다");
});

test("맡김에는 시작한 때(at)를 남기고, 보고는 맡김 중일 때만 붙는다 — 두 번 와도 한 번", () => {
  let b = B.confirm(B.mark(B.mark(B.board(PLAN), "p1", "ok"), "p2", "ok"));
  b = B.start(b, "p1", 123);
  assert.equal(b.work.p1.at, 123);
  const rep = { items: [], easy: "a", ask: "", done: 0, total: 1 };
  b = B.report(b, "p1", rep);
  assert.equal(B.report(b, "p1", { ...rep, easy: "b" }).work.p1.report.easy, "a", "보고 온 뒤에는 다시 붙지 않는다");
  assert.equal(B.report(b, "p2", rep), b, "맡기지 않은 줄에는 붙지 않는다");
});

test("저장했던 판 읽기: 이해한 것 · 준비할 것 · 물을 것의 모양도 본다", () => {
  const b = B.board(PLAN);
  for (const bad of [{ ...b, plan: { ...b.plan, prep: "x" } }, { ...b, plan: { ...b.plan, ask: [1] } }, { ...b, plan: { ...b.plan, problem: 3 } }]) assert.equal(B.revive(JSON.parse(JSON.stringify(bad))), null);
});

// ── 오버레이는 일하는 자리(C-35, 2026-10-24 — 이재엽 "이것들을 순차적으로 할려면 퀘스트내용에서 진행" · 버튼 "맡길 일 퀘스트 하나로") ──
test("맡길 일은 순서대로: 지금 줄(next)은 아직 안 끝낸 첫 줄이고, 그 줄만 맡길 수 있다 — 앞 줄이 끝나야 다음 줄이 열린다", () => {
  const P3 = N.parsePlan({ ...PLAN, items: [...PLAN.items, { need: "마감이 지나면 막는다", check: "마감 뒤에는 '마감됐어요'가 뜬다" }] });
  let b = B.confirm(["p1", "p2", "p3"].reduce((x, id) => B.mark(x, id, "ok"), B.board(P3)));
  assert.equal(B.next(b), "p1");
  assert.equal(B.stateOf(B.start(b, "p2"), "p2"), "todo", "앞 줄이 안 끝났으면 다음 줄은 맡기지 않는다");
  b = B.start(b, "p1"); assert.equal(B.next(b), "p1", "맡김 중이어도 지금 줄");
  b = B.reject(B.report(b, "p1", { items: [], easy: "a", ask: "", done: 0, total: 1 }), "p1", "다시");
  assert.equal(B.next(b), "p1", "다르게 봐요면 그 줄이 다시 지금 줄");
  b = B.accept(B.report(B.start(b, "p1"), "p1", { items: [], easy: "a", ask: "", done: 1, total: 1 }), "p1");
  assert.equal(B.next(b), "p2");
  assert.equal(B.stateOf(B.start(b, "p2"), "p2"), "running");
  assert.equal(B.next(B.board(P3)), "", "확정 전에는 지금 줄이 없다");
  const all = ["p2", "p3"].reduce((x, id) => B.accept(B.report(B.start(x, id), id, { items: [], easy: "a", ask: "", done: 1, total: 1 }), id), b);
  assert.equal(B.next(all), "", "다 끝냈으면 없다");
  assert.deepEqual(B.progress(all), { done: 3, total: 3 });
});
