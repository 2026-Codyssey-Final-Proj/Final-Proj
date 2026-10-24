// claude-drafted: 2026-10-24 — C-34 준비 계획판 · C-32 해낸 것 확인 · C-33 초등학생 말(이재엽 "C-32 만들어줘" · "한번에 내용들을 넣으면 어떻게 준비하고 기준들을 사람들이 확인해서").
// navigator.js의 요청문 · 답 모양 · 답 읽기 — 코드보다 먼저 썼다(code.md 1번). AI는 부르지 않는다.
// 실행: node --test 04-tests/navigator/plan-rules.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");

const PLAN = {
  problem: "동아리 행사 신청을 종이로 받아서 헷갈려요", have: "README에 문제 글만 있어요", missing: "신청 화면과 신청 목록이 없어요",
  items: [{ need: "회원이 이름과 연락 방법을 적어 신청한다", check: "신청 단추를 누르면 목록에 한 줄이 생긴다" }, { need: "운영진이 신청 목록을 본다", check: "목록 화면에 이름이 보인다" }],
  prep: ["신청 받을 칸 정하기"], ask: ["마감 시간이 있나요?"], say: "계획을 세웠어요. 줄마다 맞는지 봐 주세요.",
};

test("계획 모양(PLAN_SCHEMA): 이해한 것 셋 · 요구와 기준 1~12 · 준비할 것 0~6 · 물을 것 0~4 · 한마디 — 칸은 모두 꼭", () => {
  const s = N.PLAN_SCHEMA;
  assert.deepEqual(s.required.sort(), ["ask", "have", "items", "missing", "prep", "problem", "say"]);
  assert.deepEqual([s.properties.items.minItems, s.properties.items.maxItems], [1, 12]);
  assert.deepEqual(s.properties.items.items.required.sort(), ["check", "need"]);
  assert.equal(s.properties.prep.maxItems, 6); assert.equal(s.properties.ask.maxItems, 4);
});

test("계획 요청문(planPrompt): 넣은 글 · README · 파일 이름을 따로 싸서 넘기고, 초등학생 말 · 지어내지 않기 · 눈으로 볼 수 있는 기준 · 모르면 물을 것으로", () => {
  const p = N.planPrompt({ text: "동아리 행사 신청 앱", readme: "# test-1\n미션 1", files: ["README.md", "src"] });
  for (const s of ["<넣은글>", "동아리 행사 신청 앱", "<README>", "미션 1", "<파일이름>", "README.md, src"]) assert.ok(p.includes(s), s);
  assert.ok(p.includes(N.FLORO_VOICE), "초등학생도 알아듣는 말(C-33)");
  assert.match(p, /지어내지 않는다/); assert.match(p, /눈으로/); assert.match(p, /ask/);
  const bare = N.planPrompt({ text: "앱" });
  assert.ok(!bare.includes("<README>") && !bare.includes("<파일이름>"), "없으면 싸지 않는다");
});

test("다시 세우기(planPrompt prev · notes): 지난 계획 · 줄마다 의견 · 물은 것의 답 · 전체 의견을 넣고, 의견이 없는 줄은 그대로 두라고", () => {
  const p = N.planPrompt({ text: "앱", prev: PLAN, notes: [{ need: PLAN.items[0].need, check: PLAN.items[0].check, note: "연락 방법은 빼요" }], answers: [{ q: "마감 시간이 있나요?", a: "금요일 6시" }], general: "운영진 화면은 나중에" });
  for (const s of ["<지난계획>", "<의견>", "연락 방법은 빼요", "금요일 6시", "운영진 화면은 나중에"]) assert.ok(p.includes(s), s);
  assert.match(p, /의견이 없는 줄은 그대로/);
});

test("계획 읽기(parsePlan): 모양이 맞으면 id(p1…)를 코드가 붙이고 글은 잘라 쓴다 · 틀리면 null", () => {
  const r = N.parsePlan(PLAN);
  assert.deepEqual(r.items.map((x) => x.id), ["p1", "p2"]);
  assert.equal(r.items[0].need, PLAN.items[0].need); assert.equal(r.say, PLAN.say);
  const long = N.parsePlan({ ...PLAN, problem: "가".repeat(500), items: Array.from({ length: 15 }, (_, i) => ({ need: `요구 ${i}`, check: "나".repeat(400) })) });
  assert.equal(long.problem.length, 200); assert.equal(long.items.length, 12); assert.equal(long.items[0].check.length, 160);
  for (const bad of [null, {}, { ...PLAN, items: [] }, { ...PLAN, items: [{ need: "a" }] }, { ...PLAN, problem: "" }, { ...PLAN, prep: "x" }, { ...PLAN, ask: [1] }]) assert.equal(N.parsePlan(bad), null, JSON.stringify(bad).slice(0, 60));
});

test("보고 모양(REPORT_SCHEMA): 기준마다 해냄 · 근거, 초등학생 말 요약, 물을 것", () => {
  const s = N.REPORT_SCHEMA;
  assert.deepEqual(s.required.sort(), ["ask", "easy", "items"]);
  assert.deepEqual(s.properties.items.items.required.sort(), ["check", "done", "evidence"]);
  assert.equal(s.properties.items.items.properties.done.type, "boolean");
});

test("맡길 글(taskBrief): 요구 문장 · 기준 목록 · 끝나면 기준마다 보고하라는 말 · 쉬운 말 요약 — 기준이 없으면 요구 문장 그대로", () => {
  const t = N.taskBrief("회원이 신청한다", ["신청 단추를 누르면 목록에 한 줄이 생긴다", "목록 화면에 이름이 보인다"]);
  for (const s of ["회원이 신청한다", "(1) 신청 단추를 누르면 목록에 한 줄이 생긴다", "(2) 목록 화면에 이름이 보인다", "초등학생"]) assert.ok(t.includes(s), s);
  assert.match(t, /기준마다/); assert.match(t, /지어내지 않/);
  assert.equal(N.taskBrief("그냥 일", []), "그냥 일");
  assert.equal(N.CHECKS_MAX, 12);
});

test("보고 읽기(parseReport): 기준 순서대로 맞춘다 — 빠진 줄은 '안 됨', 남는 줄은 버림, 글은 잘라 쓴다 · 모양이 틀리면 null", () => {
  const checks = ["신청 단추를 누르면 목록에 한 줄이 생긴다", "목록 화면에 이름이 보인다"];
  const r = N.parseReport({ items: [{ check: "아무 말", done: true, evidence: "src/form.js에 신청 칸을 만들었어요" }], easy: "신청하는 종이를 화면으로 만들었어요. 목록은 아직이에요.", ask: "" }, checks);
  assert.deepEqual(r.items, [{ check: checks[0], done: true, evidence: "src/form.js에 신청 칸을 만들었어요" }, { check: checks[1], done: false, evidence: "" }]);
  assert.equal(r.easy, "신청하는 종이를 화면으로 만들었어요. 목록은 아직이에요."); assert.equal(r.ask, "");
  assert.equal(r.done, 1); assert.equal(r.total, 2);
  const noEv = N.parseReport({ items: [{ check: "x", done: true, evidence: "" }, { check: "y", done: true, evidence: "  " }], easy: "다 했어요", ask: "" }, checks);
  assert.deepEqual(noEv.items.map((x) => x.done), [false, false], "근거 없는 '해냄'은 해냄으로 치지 않는다");
  for (const bad of [null, {}, { items: "x", easy: "a", ask: "" }, { items: [], easy: "", ask: "" }, { items: [{ check: "x", done: "yes", evidence: "" }], easy: "a", ask: "" }]) assert.equal(N.parseReport(bad, checks), null, JSON.stringify(bad));
  assert.equal(N.parseReport({ items: [], easy: "a", ask: "" }, []), null, "기준이 없으면 보고도 없다");
});
