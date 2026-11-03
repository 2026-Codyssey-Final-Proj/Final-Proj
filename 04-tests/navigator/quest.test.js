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
  assert.match(mk(0).cond, /처음 시작/); assert.match(mk(2).cond, /2단계를 지난/);   // 받침에 맞는 조사(F-144-25 — 전에는 '2단계을')
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

// claude-drafted: 2026-10-23 — C-28 레벨은 사람에게(이재엽 버튼 "누적 — 관문마다 +1"). 코드보다 먼저 썼다(code.md 1번)
test("레벨 누적(C-28): 처음은 지금 단계에서 시작하고(이미 넘은 관문), 한 번 저장된 레벨은 새 프로젝트(0단계)여도 그대로, 관문마다 +1", () => {
  assert.equal(Q.startLevel(null, { stage: 3 }, false), 3, "저장된 값이 없으면 지금 단계 = 이미 넘은 관문 수");
  assert.equal(Q.startLevel(undefined, null, false), 0);
  assert.equal(Q.startLevel(5, { stage: 0 }, false), 5, "새 프로젝트를 시작해도 줄지 않는다");
  assert.equal(Q.startLevel(2, { stage: 6 }, false), 2, "저장된 값이 있으면 그대로 — 판정으로 단계가 뛰어도 관문 없이 오르지 않는다(리뷰 막힘 2026-10-23)");
  for (const bad of [-1, 1.5, "3", NaN, {}]) assert.equal(Q.startLevel(bad, { stage: 1 }, false), 1, `이상한 값 ${String(bad)}은 버린다`);
  assert.equal(Q.levelUp(0), 1); assert.equal(Q.levelUp(7), 8); assert.equal(Q.levelUp(12), 13, "끝없이 오른다");
  assert.equal(Q.levelUp(-3), 1); assert.equal(Q.levelUp("x"), 1);
  assert.equal(Q.rankOf(Q.levelUp(20)), Q.RANKS[7], "칭호는 여덟을 넘으면 마지막 칭호 그대로(정할 것 ①의 기본)");
  assert.equal(Q.bandOf(15), 2, "묶음도 누적 레벨로");
});

test("섬 자리(C-41 ②): 위 · 아래 · 왼쪽 · 오른쪽, 모르는 값은 오른쪽 — 옛 저장값 left · right도 읽힌다. 크기 S · M · L은 없다(R-1)", () => {
  assert.deepEqual(Q.SIDES, ["top", "bottom", "left", "right"]);
  assert.equal(Q.sideOf("right"), "right"); assert.equal(Q.sideOf("top"), "top"); assert.equal(Q.sideOf("left"), "left", "옛 값"); assert.equal(Q.sideOf("x"), "right"); assert.equal(Q.sideOf(undefined), "right");
  assert.equal(Q.otherSide, undefined, "반대쪽은 2026-10-27에 뺐다 — 쓰는 곳이 없었다");
  assert.equal(Q.SIZES, undefined, "S/M/L은 2026-10-27 R-1로 뺐다 — 작업실은 화면 가득, 사람이 바꾼 크기를 기억(main.js)"); assert.equal(Q.sizeOf, undefined);
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

test("곁 퀘스트: 그 단계의 할 일 가운데 이 등급의 목록에 없는 것 — Full은 없고, Lite의 2단계(코드 1)에는 있다. 안 해도 되고 적는 자리도 없다", () => {
  assert.deepEqual(Q.makeQuest(Nav.STAGES[1], Nav.criteriaFor(1, "Full")).side, []);
  const lite = Q.makeQuest(Nav.STAGES[1], Nav.criteriaFor(1, "Lite"));
  assert.ok(lite.side.length >= 1 && lite.side.every((s) => s.icon && s.name && !("need" in s)));
  assert.ok(lite.side.every((s) => !lite.objs.some((o) => o.name === s.name)), "할 일과 겹치지 않는다");
  assert.equal(lite.objs.length + lite.side.length, Nav.STAGES[1].criteria.length, "할 일 + 곁 = 그 단계의 전부");
});

test("AI 글 얹기(withAI): 설명 · 왜 · 질문 · 예시가 퀘스트에 들어가고, qa 개수가 다르면 qa는 안 받는다, 원본은 그대로. 질문 · 예시는 AI 것이 먼저", () => {
  const q = mk(0), n = q.objs.length;
  const ai = { desc: "설명이에요", why: "왜냐하면", qa: q.objs.map((o, i) => ({ question: `${o.name}는요?`, examples: [`보기 ${i}`, `보기 ${i}-2`] })) };
  const w = Q.withAI(q, ai);
  assert.equal(w.desc, "설명이에요"); assert.equal(w.why, "왜냐하면"); assert.equal(w.qa.length, n); assert.notEqual(q.desc, "설명이에요", "원본은 그대로");
  assert.equal(Q.question(w, 0), `${q.objs[0].name}는요?`); assert.equal(Q.example(w, 0), "보기 0");
  assert.equal(Q.example(Q.fill(w, 0, "하나"), 0), "보기 0-2", "적은 만큼 다음 예시");
  const bad = Q.withAI(q, { desc: "  ", why: "", qa: ai.qa.slice(1) });
  assert.equal(bad.desc, q.desc); assert.equal(bad.why, q.why); assert.ok(!bad.qa, "개수가 다르면 안 받는다");
  assert.equal(Q.withAI(q, null), q); assert.equal(Q.withAI(null, ai), null);
});

test("꾸미기: 같은 자리를 다시 고르면 벗는다, 모르는 아이디는 그대로, 기록을 읽을 때 이상한 값은 버린다", () => {
  let w = Q.toggleWear({}, "ribbon"); assert.deepEqual(w, { hat: "ribbon" });
  w = Q.toggleWear(w, "scarf"); assert.deepEqual(w, { hat: "ribbon", neck: "scarf" });
  w = Q.toggleWear(w, "beanie"); assert.deepEqual(w, { hat: "beanie", neck: "scarf" }, "같은 자리는 바꿔 쓴다");
  w = Q.toggleWear(w, "beanie"); assert.deepEqual(w, { neck: "scarf" }, "다시 고르면 벗는다");
  assert.deepEqual(Q.toggleWear(w, "x"), w); assert.deepEqual(Q.toggleWear(undefined, "x"), {});
  assert.deepEqual(Q.cleanWear({ hat: "scarf", neck: "scarf", x: "crown" }), { neck: "scarf" }, "자리가 맞는 것만");
  assert.deepEqual(Q.cleanOwned(["ribbon", "ribbon", "zzz", 3]), ["ribbon"]);
  assert.equal(Q.itemOf("crown").slot, "hat"); assert.equal(Q.itemOf("nope"), null);
});

test("퀘스트 제작 요청문(navigator.js questPrompt): 말한 것 · 번호 1~8 · 할 일 개수 · 플로로 말투가 들어가고, parseQuest는 개수가 다르거나 칸이 비면 null", () => {
  const p = Nav.questPrompt(0, "독서 모임 알림 앱", "Full");
  assert.ok(p.includes("독서 모임 알림 앱") && p.includes("1단계") && p.includes(`${Nav.criteriaFor(0).length}개`) && p.includes(Nav.FLORO_VOICE));
  assert.ok(p.includes("<만들고싶은것>"), "넘길 글은 꼬리표 안에");
  const good = { desc: "설명", why: "왜", qa: Nav.criteriaFor(0).map(() => ({ question: "무엇을?", examples: ["예", "예2", "예3", "예4"] })) };
  const r = Nav.parseQuest(good, 0, "Full");
  assert.ok(r && r.qa.length === Nav.criteriaFor(0).length && r.qa[0].examples.length === 3, "예시는 셋까지");
  assert.equal(Nav.parseQuest({ ...good, qa: good.qa.slice(1) }, 0, "Full"), null);
  assert.equal(Nav.parseQuest({ ...good, desc: " " }, 0, "Full"), null);
  assert.equal(Nav.parseQuest({ ...good, qa: good.qa.map((x) => ({ ...x, examples: [] })) }, 0, "Full"), null);
  assert.ok(Nav.parseQuest({ ...good, qa: Nav.criteriaFor(0, "Lite").map(() => ({ question: "q", examples: ["e"] })) }, 0, "Lite"), "등급의 개수로");
  assert.equal(Nav.IDEA_MAX, 400); assert.ok(Nav.QUEST_SCHEMA.required.includes("qa"));
});

// C-56 R-2(2026-10-28): 칸의 이름 — 초안에 이 프로젝트의 말로 된 이름(title)이 있으면 그것, 없으면 짧은 이름. 방법 이름은 꼬리표(termOf)
test("nameOf · askOf · doneOf — 초안의 title · ask · done이 있으면 그것, 없으면 짧은 이름 · 질문 · 빈 글", () => {
  const N = require("../../03-backend/navigator/navigator.js");
  const stage = N.STAGES[2], crit = N.criteriaFor(2, "Xpress"), q0 = Q.makeQuest(stage, crit);
  assert.equal(Q.nameOf(q0, 0), Q.shortOf(crit[0].text), "초안 전엔 짧은 이름");
  const q = Q.withStageDraft(q0, { items: crit.map((c, i) => ({ text: "글", title: i === 0 ? "프롬프트 저장하기 요구 문장" : undefined, ask: i === 0 ? "무엇을 저장하나요?" : undefined, done: i === 0 ? "문장 셋" : undefined })), prep: [] });
  assert.equal(Q.nameOf(q, 0), "프롬프트 저장하기 요구 문장"); assert.equal(Q.nameOf(q, 1), Q.shortOf(crit[1].text));
  assert.equal(Q.askOf(q, 0), "무엇을 저장하나요?"); assert.equal(Q.askOf(q, 1), Q.question(q, 1)); assert.equal(Q.doneOf(q, 0), "문장 셋"); assert.equal(Q.doneOf(q, 1), "");
});

// C-56 R-5(2026-10-28): 다시 맞춘 초안을 지금 퀘스트에 — 사람이 적은 칸은 덮지 않고(review에 새 글만), 아직 안 적은 칸만 바꾼다(changed). 같은 글이면 아무것도 없고, 개수가 다르면 그대로
test("refit — 아직 안 적은 칸은 새 초안으로(changed), 적은 칸은 덮지 않고 다른 글만 review에, 같은 글은 빼고, 개수가 다르면 그대로", () => {
  const crit = Nav.criteriaFor(1, "Xpress"), q0 = Q.makeQuest(Nav.STAGES[1], crit);
  const q1 = Q.withStageDraft(q0, { items: crit.map((c, i) => ({ text: `글 ${i}`, from: [] })), prep: ["준비"] });
  const q2 = Q.fill(q1, 0, "글 0", "ok");   // 0번은 사람이 확인했다
  const r = Q.refit(q2, { items: crit.map((c, i) => ({ text: i === 0 ? "새 글 0" : i === 1 ? "새 글 1" : `글 ${i}`, from: [] })), prep: ["준비 둘"], say: "다시 맞췄어요" });
  assert.deepEqual(r.changed, [1], "안 적은 칸 중 글이 달라진 것만"); assert.deepEqual(r.review, [{ i: 0, text: "새 글 0" }], "적은 칸은 덮지 않고 새 글만");
  assert.equal(Q.draftOf(r.q, 1), "새 글 1"); assert.equal(Q.draftOf(r.q, 0), "글 0", "적은 칸의 초안은 그대로"); assert.deepEqual(r.q.lines[0], ["글 0"], "적은 줄 그대로");
  assert.deepEqual(r.q.draft.prep, ["준비 둘"]); assert.equal(r.q.phase, "quest"); assert.equal(r.q.sel, q2.sel, "고른 칸은 안 움직인다");
  const same = Q.refit(q2, { items: crit.map((c, i) => ({ text: `글 ${i}`, from: [] })), prep: [] }); assert.deepEqual([same.changed, same.review], [[], []]); assert.equal(same.q, q2, "같으면 그 객체 그대로");
  assert.equal(Q.refit(q2, { items: [{ text: "x" }] }).q, q2, "개수가 다르면 그대로"); assert.equal(Q.refit(q0, { items: crit.map(() => ({ text: "x" })) }).q, q0, "초안이 없던 퀘스트는 그대로");
});
