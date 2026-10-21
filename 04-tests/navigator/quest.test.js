// claude-drafted: 2026-10-21 — 퀘스트 규칙(03-backend/navigator/quest.js, C-22 게임식 디자인 1차 뼈대)의 순수 함수 시험.
//   이재엽 결정(2026-10-21): 창 셋(설정 창 · 퀘스트 창 · 채팅 창) · 단계는 1단계부터 · 지금부터 만들어 릴리즈. 설계는 game-overlay/quest-storyboard.md 10절.
//   장 하나 = 퀘스트 하나, 할 일은 STAGES 그대로(판정 규칙은 바꾸지 않는다), 적은 줄은 원본을 안 바꾸고 새 퀘스트를 돌려준다, 연습의 완료 보고는 parseJudgement를 그대로 지난다.
// 실행: node --test 04-tests/navigator/quest.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const Q = require("../../03-backend/navigator/quest.js");
const Nav = require("../../03-backend/navigator/navigator.js");

const mk = (n = 0, tier = "Full") => Q.makeQuest(Nav.STAGES[n], Nav.criteriaFor(n, tier));

test("단계 번호는 화면에 1~8로(정할 것 13 — 이재엽 '1단계부터'), 코드의 n(0~7)은 그대로", () => {
  assert.equal(Q.LABEL(0), "1단계"); assert.equal(Q.LABEL(7), "8단계");
  assert.equal(Nav.STAGES[0].n, 0, "코드의 번호는 바뀌지 않는다");
  assert.equal(Q.roman(0), "Ⅰ"); assert.equal(Q.roman(3), "Ⅳ"); assert.equal(Q.roman(9), "10");
});

test("장 하나 = 퀘스트 하나: 할 일은 그 단계 · 그 등급의 할 일 그대로(이름 · 용어 · 개수 1), 받기 전(draft), 줄은 비어 있다", () => {
  for (const s of Nav.STAGES) for (const tier of Nav.TIERS) {
    const q = Q.makeQuest(s, Nav.criteriaFor(s.n, tier)), todo = Nav.criteriaFor(s.n, tier);
    assert.equal(q.chap, s.n); assert.equal(q.title, s.title); assert.equal(q.phase, "draft");
    assert.deepEqual(q.objs.map((o) => o.name), todo.map((c) => c.text));
    assert.deepEqual(q.objs.map((o) => o.term), todo.map((c) => c.term));
    assert.ok(q.objs.every((o) => o.need === 1) && q.lines.every((l) => l.length === 0));
    assert.ok(q.objs.every((o) => o.icon), "할 일마다 그림(자리표시)");
    for (const k of ["cond", "when", "desc", "why"]) assert.ok(typeof q[k] === "string" && q[k].length, k);
  }
  assert.match(mk(0).cond, /처음 시작/); assert.match(mk(2).cond, /2단계을 지난/);
});

test("한 줄씩 적기 — 지금 할 일은 아직 안 적은 첫 것, 빈 줄은 적지 않는다, 원본은 안 바뀐다, 다 적으면 -1 · isDone", () => {
  const q0 = mk(0);
  assert.equal(Q.curIdx(q0), 0); assert.equal(Q.isDone(q0), false);
  const q1 = Q.fill(q0, 0, "  종이로 받아서 헷갈려요  ");
  assert.deepEqual(q0.lines[0], [], "원본은 그대로"); assert.deepEqual(q1.lines[0], ["종이로 받아서 헷갈려요"]);
  assert.equal(Q.curIdx(q1), 1); assert.equal(q1.sel, 0);
  assert.equal(Q.fill(q1, 1, "   "), q1, "빈 줄은 적지 않는다"); assert.equal(Q.fill(q1, 99, "x"), q1, "없는 할 일");
  let q = q1; for (let i = 1; i < q.objs.length; i++) q = Q.fill(q, i, `줄 ${i}`);
  assert.equal(Q.curIdx(q), -1); assert.ok(Q.isDone(q)); assert.equal(Q.got(q), Q.total(q));
  assert.deepEqual(Q.progress(q0), { n: 4, k: 1 }); assert.deepEqual(Q.progress(q), { n: 4, k: 4 }); assert.deepEqual(Q.progress(null), { n: 0, k: 0 });
});

test("개수를 늘리면 그 할 일은 그만큼 적어야 한다(1~5로 묶음), 이름 · 제목 고치기는 빈 글이면 그대로, 줄 고치기는 빈 글이면 그 줄을 지운다", () => {
  const q = Q.setNeed(mk(0), 0, 3);
  assert.equal(q.objs[0].need, 3); assert.equal(Q.setNeed(q, 0, 0).objs[0].need, 1); assert.equal(Q.setNeed(q, 0, 9).objs[0].need, 5);
  let f = Q.fill(q, 0, "하나"); assert.equal(Q.curIdx(f), 0, "3개 중 1개 — 아직 같은 할 일"); assert.ok(!Q.filled(f, 0));
  f = Q.fill(Q.fill(f, 0, "둘"), 0, "셋"); assert.equal(Q.curIdx(f), 1); assert.ok(Q.filled(f, 0));
  assert.equal(Q.retitle(q, "  ").title, q.title); assert.equal(Q.retitle(q, "첫 장").title, "첫 장");
  assert.equal(Q.rename(q, 1, "").objs[1].name, q.objs[1].name); assert.equal(Q.rename(q, 1, "달라지는 것").objs[1].name, "달라지는 것");
  assert.deepEqual(Q.setLine(f, 0, 1, "둘째").lines[0], ["하나", "둘째", "셋"]);
  assert.deepEqual(Q.setLine(f, 0, 1, "").lines[0], ["하나", "셋"], "빈 글이면 지운다");
  assert.deepEqual(f.lines[0], ["하나", "둘", "셋"], "원본은 그대로");
});

test("플로로의 질문은 할 일 이름 그대로(AI는 다음 판), 예시 답은 1단계만(연습) · 없으면 null, 적은 글은 처음 말한 것 + '할 일: 줄'", () => {
  const q = mk(0);
  assert.match(Q.question(q, 0), new RegExp(`^${q.objs[0].name}`)); assert.match(Q.question(Q.fill(Q.setNeed(q, 0, 2), 0, "a"), 0), /1개 됐어요/);
  assert.equal(Q.question(q, 99), "");
  assert.equal(typeof Q.example(q, 0), "string"); assert.equal(Q.example(mk(3), 0), null); assert.equal(Q.example(q, 99), null);
  const f = Q.fill(q, 0, "종이로 받아요");
  assert.equal(Q.textOf(f, "동아리 행사 등록 앱"), `동아리 행사 등록 앱\n${q.objs[0].name}: 종이로 받아요`);
  assert.equal(Q.textOf(null, ""), "");
});

test("연습의 완료 보고(localJudgement)는 서버 답의 모양이라 parseJudgement를 그대로 지난다 — 적은 할 일만 '했다', 근거는 적은 글에 있다", () => {
  for (const n of [0, 2, 5]) for (const tier of Nav.TIERS) {
    let q = Q.makeQuest(Nav.STAGES[n], Nav.criteriaFor(n, tier));
    q.objs.forEach((_, i) => { if (i !== 1) q = Q.fill(q, i, `줄 ${i}`); });
    const text = Q.textOf(q, "무언가"), j = Nav.parseJudgement(Q.localJudgement(q), text, n, tier);
    assert.ok(j, `${n} ${tier}`);
    assert.deepEqual(j.criteria.map((c) => c.met), q.objs.map((_, i) => i !== 1));
    assert.ok(j.criteria.every((c) => !c.met || text.includes(c.evidence)), "근거는 적은 글 안에");
    assert.ok(!Nav.JARGON.some((w) => j.reason.includes(w)), "쉬운 말");
  }
});

test("칭호 여덟 · 묶음 셋(초기 개발자 0~ · 중급자 3~ · 상급자 6~) · 레벨은 지금 단계(모두 마치면 8)", () => {
  assert.equal(Q.RANKS.length, 8); assert.equal(new Set(Q.RANKS).size, 8);
  assert.equal(Q.rankOf(0), Q.RANKS[0]); assert.equal(Q.rankOf(99), Q.RANKS[7]); assert.equal(Q.rankOf(-1), Q.RANKS[0]);
  assert.deepEqual(Q.BANDS.map((b) => b[1]), [0, 3, 6]);
  assert.equal(Q.bandOf(0), 0); assert.equal(Q.bandOf(2), 0); assert.equal(Q.bandOf(3), 1); assert.equal(Q.bandOf(6), 2); assert.equal(Q.bandOf(8), 2);
  assert.equal(Q.lvOf(null, false), 0); assert.equal(Q.lvOf({ stage: 4 }, false), 4); assert.equal(Q.lvOf({ stage: 7 }, true), 8);
});

test("창 자리: 설정 창이 왼쪽이면 퀘스트 창은 오른쪽, 반대도 — 모르는 값은 왼쪽. 크기는 S · M · L(모르면 M)", () => {
  assert.equal(Q.sideOf("right"), "right"); assert.equal(Q.sideOf("x"), "left"); assert.equal(Q.sideOf(undefined), "left");
  assert.equal(Q.otherSide("left"), "right"); assert.equal(Q.otherSide("right"), "left"); assert.equal(Q.otherSide("x"), "right");
  assert.deepEqual(Object.keys(Q.SIZES), ["s", "m", "l"]); assert.equal(Q.sizeOf("l"), "l"); assert.equal(Q.sizeOf("huge"), "m");
  assert.ok(Q.SIZES.s[0] < Q.SIZES.m[0] && Q.SIZES.m[0] < Q.SIZES.l[0]);
});

test("뽑기(다음 판에 쓸 규칙): 확률 합 100 · 늘 화면에 적을 수 있는 네 가지, 0~100 미만의 수로 하나를 고른다, 조개 셋에 한 번", () => {
  assert.ok(Q.oddsOk(Q.ITEMS)); assert.equal(Q.ITEMS.length, 4); assert.equal(Q.SHELL_COST, 3);
  assert.equal(Q.draw(Q.ITEMS, 0).id, "ribbon"); assert.equal(Q.draw(Q.ITEMS, 59.9).id, "ribbon"); assert.equal(Q.draw(Q.ITEMS, 60).id, "beanie");
  assert.equal(Q.draw(Q.ITEMS, 99).id, "crown"); assert.equal(Q.draw(Q.ITEMS, 99.99).id, "crown"); assert.equal(Q.draw(Q.ITEMS, 100).id, "crown", "넘치면 마지막 것");
  assert.ok(!Q.oddsOk([{ p: 50 }, { p: 40 }]));
});

test("쉬운 말(FR-13): 화면에 보이는 글(퀘스트 글 · 질문 · 칭호 · 묶음 · 보상 이름)에 전문 용어가 없다", () => {
  const texts = [...Q.RANKS, ...Q.BANDS.map((b) => b[0]), ...Q.ITEMS.map((it) => `${it.name} ${it.rar}`)];
  for (const s of Nav.STAGES) { const q = mk(s.n); texts.push(q.cond, q.when, q.desc, q.why, ...q.objs.map((_, i) => Q.question(q, i)), Q.localJudgement(q).reason); }
  for (const t of texts) for (const w of Nav.JARGON) assert.ok(!t.includes(w), `"${t}"에 ${w}`);
});
