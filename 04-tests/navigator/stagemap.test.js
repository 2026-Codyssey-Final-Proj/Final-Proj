// claude-drafted: 2026-10-28 — C-54 지도(stagemap.js): 도전과제 탭의 카드 지도 — 카드 하나 = 한 단계의 퀘스트(다섯 칸 · 관문 남은 기준)와 그 단계 문서. 2단계 칸을 다 채우면 기획서(2단계 결과)로 3 ~ 8단계를 한 번에 그리고
//   '준비된 퀘스트'(① 생각 · ② 행동 · ③ 기록 · ④ 저장 · ⑤ 버전 + 근거 절)를 미리 채운다(이재엽 버튼: 탭 이름은 '도전과제' 그대로 · 확인은 한 번에). 코드보다 먼저 썼다(code.md 1번).
//   AI로 채우는 것은 뒤로(넘김 문서 2절 "모자라면 … 'AI로 미리 채우기'만 뒤로" · questfit 넘김 "C-54의 준비된 퀘스트는 C-56 규칙으로") — 지금은 기획서의 절(2단계 칸)에서 규칙으로 짓는다
// 실행: node --test 04-tests/navigator/stagemap.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const D = require("../../03-backend/navigator/docs.js");
const SM = require("../../03-backend/navigator/stagemap.js");

const crit = (n) => N.criteriaFor(n, "Xpress");
const r0 = { items: [{ name: "불편", lines: ["종이 신청이 헷갈려요"] }] };
const r1 = { items: crit(1).map((c, i) => ({ name: c.text, lines: [`2단계 ${i + 1}번 칸의 줄`] })) };
const base = { stages: N.STAGES, slugs: D.SLUGS, results: { 0: r0, 1: r1 }, j: { stage: 2, criteria: [{ met: false }, { met: true }, { met: false }] },
  quest: { chap: 2, objs: [{ need: 1 }, { need: 1 }, { need: 1 }], lines: [["적음"], [], []] }, have: new Set(["README.md", "docs/01-idea/idea.md", "docs/02-plan/plan.md"]), prep: null, finished: false };

test("build — 카드 여덟: 지난 장 done · 지금 장 now(다섯 칸 k/n · 관문 남은 기준) · 그 뒤는 later('2단계에서 그려져요'), 단계 문서의 있음 · 아직, 아래 줄 문서 셋, 2단계 결과가 있으면 그릴 수 있다", () => {
  const m = SM.build(base);
  assert.equal(m.cur, 2); assert.equal(m.cards.length, 8);
  assert.deepEqual(m.cards.map((c) => c.state), ["done", "done", "now", "later", "later", "later", "later", "later"]);
  assert.deepEqual(m.cards[2].q, { k: 1, n: 3 }, "지금 장 — 다섯 칸 중 몇 번째"); assert.equal(m.cards[2].gateLeft, 2, "관문 남은 기준");
  assert.deepEqual(m.cards[0].doc, { path: "docs/01-idea/idea.md", has: true }); assert.deepEqual(m.cards[2].doc, { path: "docs/03-requirements/requirements.md", has: false });
  assert.equal(m.cards[3].label, 4); assert.equal(m.cards[3].title, N.STAGES[3].title);
  assert.deepEqual(m.docs, [{ path: "README.md", what: "소개", has: true }, { path: "CLAUDE.md", what: "AI 안내", has: false }, { path: "docs/decisions.md", what: "결정 기록", has: false }]);
  assert.ok(m.canDraw && !m.drawn && !m.confirmed, "2단계 결과가 있고 아직 안 그렸다");
  const early = SM.build({ ...base, results: { 0: r0 }, j: { stage: 1, criteria: [] }, quest: null });
  assert.ok(!early.canDraw, "2단계 전에는 못 그린다"); assert.deepEqual(early.cards.map((c) => c.state).slice(0, 3), ["done", "now", "later"]);
  assert.equal(SM.build({ ...base, finished: true }).cards.every((c) => c.state === "done"), true, "다 마치면 전부 done");
});

test("prepare — 기획서(2단계 결과)의 절에서 3 ~ 8단계의 준비된 퀘스트: ① 생각(그 절의 줄) · ② 행동(맡길 일) · ③ 기록(그 단계 기준) · ④ 저장(문서 이름) · ⑤ 버전 · 근거 절. 절이 비었으면 '새로 정함'", () => {
  const p = SM.prepare({ stages: N.STAGES, slugs: D.SLUGS, plan: r1, criteria: crit });
  assert.deepEqual(Object.keys(p.cards).map(Number), [2, 3, 4, 5, 6, 7]);
  const c = p.cards[2];
  assert.equal(c.think, "2단계 3번 칸의 줄", "3단계 기능 정리 ← 기획서 3절(한 문장에 한 가지)"); assert.equal(c.act, N.STAGES[2].does);
  assert.deepEqual(c.record, crit(2).map((x) => x.text)); assert.equal(c.save, "docs/03-requirements/requirements.md"); assert.equal(c.ver, "V.3");
  assert.equal(c.from, `기획서 3절 '${r1.items[2].name}'`);
  assert.equal(p.cards[6].think, "2단계 2번 칸의 줄", "7단계 재 보기 ← 기획서 2절(언제 성공)");
  const empty = SM.prepare({ stages: N.STAGES, slugs: D.SLUGS, plan: { items: r1.items.map((x) => ({ ...x, lines: [] })) }, criteria: crit });
  assert.equal(empty.cards[2].from, "새로 정함"); assert.equal(empty.cards[2].think, N.STAGES[2].gets, "절이 비면 그 단계가 받는 것으로");
  const m = SM.build({ ...base, prep: { ...p, ok: false } });
  assert.deepEqual(m.cards.map((c) => c.state), ["done", "done", "now", "pending", "pending", "pending", "pending", "pending"], "그렸지만 확인 전"); assert.ok(m.drawn && !m.confirmed && !m.canDraw);
  assert.equal(m.cards[3].prepared.from, `기획서 1절 '${r1.items[0].name}'`);
  const ok = SM.build({ ...base, prep: { ...p, ok: true } });
  assert.deepEqual(ok.cards.map((c) => c.state).slice(3), ["ready", "ready", "ready", "ready", "ready"], "맞아요 — 준비됨"); assert.ok(ok.confirmed);
  assert.equal(SM.build({ ...base, prep: { ...p, ok: true }, j: { stage: 4, criteria: [] }, quest: null }).cards[4].state, "now", "들어선 장은 준비됨이 아니라 지금");
});
