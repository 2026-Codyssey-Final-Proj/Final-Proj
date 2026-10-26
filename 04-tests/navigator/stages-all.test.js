// claude-drafted: 2026-10-26 — C-40 4~8단계 초안 · 예시 셋 중 고르기 · 빠르게 · 쉬운 퀘스트 창(이재엽 "지금 4번째 5번째 6번째 7번째 8번째 과정들을 한번에 작업하는건데 계속 예시를 만들어서 확인해서
//   우리가 선택해서 하는거로 만들어줘 / 그리고 지금 보통길이이고 작업들을 하나씩 하는건데 왜 그냥 넣었을때 보다 너무 느려... / 하나씩 하는것도 좋지만 … 퀘스트에서도 자세히 보이지만 어렵게 보이고 있어" ·
//   버튼 — 예시 셋 중 고르기 / 다음 단계 초안 미리 · 남은 칸 모두 맞아요 · 확인한 단계는 판정 AI 건너뛰기 · 초안은 빠른 모델로 / 짧은 이름 + 쉬운 한 줄). 코드보다 먼저 썼다(code.md 1번). AI는 부르지 않는다.
// 실행: node --test 04-tests/navigator/stages-all.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const Q = require("../../03-backend/navigator/quest.js");
const D = require("../../03-backend/navigator/docs.js");
const P = require("../../03-backend/navigator/provider.js");

const prevUpTo = (stage, tier = "Xpress") => Array.from({ length: stage }, (_, s) => ({ stage: s, items: N.criteriaFor(s, tier).map((c, i) => ({ name: c.text, lines: [`${s + 1}단계 줄 ${i + 1}`] })) }));
const answer = (stage, tier, over = {}) => ({ items: N.criteriaFor(stage, tier).map((c, i) => ({ text: `${c.text} — 권하는 예시`, alts: [`${i}번 다른 예시 가`, `${i}번 다른 예시 나`], from: ["1-1"] })), prep: ["준비 하나"], say: "초안이에요", ...over });

test("초안을 만드는 단계: 2 ~ 8단계 전부(코드 1 ~ 7) — 예시 셋 중 고르기는 4 ~ 8단계(코드 3 ~ 7)", () => {
  assert.deepEqual(N.DRAFT_STAGES, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(N.ALT_STAGES, [3, 4, 5, 6, 7]);
  for (let s = 3; s < 8; s++) for (const c of N.STAGES[s].criteria) assert.ok(N.STAGE_HINT[c.text], `할 일의 꼴이 있다: ${c.text}`);
});

test("4 ~ 8단계 요청문: 지난 단계 전부 · 그 단계 할 일 순서대로 · 칸마다 예시 셋(text = 권하는 것, alts = 다른 길 둘) · 잰 값 · 사실은 지어내지 않는다", () => {
  for (let s = 3; s < 8; s++) {
    const p = N.stageDraftPrompt(s, "Full", { idea: "동아리 행사 신청 앱", prev: prevUpTo(s, "Full") });
    for (const c of N.criteriaFor(s, "Full")) assert.ok(p.includes(c.text), `${s} ${c.text}`);
    assert.ok(p.includes(`[${s}-1]`), "바로 앞 단계 칸까지 번호"); assert.match(p, /alts/); assert.match(p, /지어내지 않는다/);
  }
  assert.ok(!/alts에/.test(N.stageDraftPrompt(1, "Xpress", { idea: "앱", prev: prevUpTo(1) })), "2 · 3단계는 지금처럼 초안 하나");
  const again = N.stageDraftPrompt(4, "Xpress", { idea: "앱", prev: prevUpTo(4), avoid: { i: 1, texts: ["이미 본 예시 A", "이미 본 예시 B"] } });
  assert.ok(again.includes("이미 본 예시 A") && again.includes("이미 본 예시 B") && /2번째 칸/.test(again), "다른 예시 — 이미 본 것과 다르게");
});

test("초안 모양: 칸마다 text · alts(0~2) · from — 다 적어야 하는 칸(required)", () => {
  assert.deepEqual([...N.STAGE_DRAFT_SCHEMA.properties.items.items.required].sort(), ["alts", "from", "text"]);
  assert.equal(N.STAGE_DRAFT_SCHEMA.properties.items.items.properties.alts.maxItems, 2);
});

test("4 ~ 8단계 초안 읽기: alts는 둘까지 · 짧게 · 권하는 것과 다른 것만, 2 · 3단계는 alts를 버린다(칸 모양 그대로)", () => {
  const r = N.parseStageDraft(answer(4, "Xpress"), 4, "Xpress", prevUpTo(4));
  assert.equal(r.items.length, N.criteriaFor(4, "Xpress").length);
  assert.deepEqual(r.items[0].alts, ["0번 다른 예시 가", "0번 다른 예시 나"]);
  const messy = N.parseStageDraft(answer(5, "Lite", { items: answer(5, "Lite").items.map((x, i) => (i ? x : { ...x, alts: [x.text, " ", "가".repeat(400), "나", "다"] })) }), 5, "Lite", prevUpTo(5, "Lite"));
  assert.equal(messy.items[0].alts.length, 2, "둘까지"); assert.ok(!messy.items[0].alts.includes(messy.items[0].text), "권하는 것과 같은 것은 버린다");
  assert.equal(messy.items[0].alts[0].length, 150, "한 예시 150자");
  const two = N.parseStageDraft({ items: N.criteriaFor(1, "Xpress").map(() => ({ text: "글", alts: ["다른"], from: [] })), prep: [], say: "한마디" }, 1, "Xpress", prevUpTo(1));
  assert.equal(two.items[0].alts, undefined, "2단계는 예시 하나 — 칸 모양은 { text, from }");
});

test("예시 셋(examplesOf) · 맞아요가 적을 줄(acceptedLine) · 남은 칸 모두 맞아요(fillAll — 누가 = 그대로)", () => {
  const d = N.parseStageDraft(answer(3, "Xpress"), 3, "Xpress", prevUpTo(3));
  let q = Q.withStageDraft(Q.makeQuest(N.STAGES[3], N.criteriaFor(3, "Xpress")), d);
  assert.deepEqual(Q.examplesOf(q, 0), [d.items[0].text, ...d.items[0].alts]);
  assert.equal(Q.acceptedLine(q, 0), d.items[0].text);
  q = Q.fill(q, 0, Q.examplesOf(q, 0)[2], "pick");
  q = Q.fillAll(q);
  assert.ok(Q.isDone(q)); assert.equal(q.by[0], "pick", "이미 고른 칸은 그대로 둔다"); assert.ok(q.by.slice(1).every((b) => b === "ok"), "나머지는 그대로");
  let one = Q.withDraft(Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full")), Q.EXAMPLE_DRAFT);
  assert.equal(Q.acceptedLine(one, Q.SIZE_AT), `크기: 보통 — ${Q.EXAMPLE_DRAFT.sizeWhy}`, "크기 칩에서 권한 것을 누른 줄과 같다");
  const nowho = Q.withDraft(Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full")), { ...Q.EXAMPLE_DRAFT, who: "" });
  assert.equal(Q.acceptedLine(nowho, Q.WHO_AT), "", "누가를 못 찾았으면 사람이 골라야");
  const part = Q.fillAll(nowho);
  assert.equal(Q.curIdx(part), Q.WHO_AT, "고를 칸 앞에서 멈춘다"); assert.equal(part.lines[0][0], Q.EXAMPLE_DRAFT.pain);
  const prd = Q.withStageDraft(Q.makeQuest(N.STAGES[1], N.criteriaFor(1, "Full")), Q.exampleStageDraft(1, N.criteriaFor(1, "Full"), prevUpTo(1, "Full")));
  assert.match(Q.acceptedLine(prd, 3), /^기획서: 경량 기획서로 — /);
});

test("다음 단계 초안 미리(expectedResult): 모두 맞아요라면 적힐 결과 — 적은 줄은 그대로, 빈 칸은 맞아요가 적을 줄, 사람이 골라야 하는 칸이 있으면 null", () => {
  const d = N.parseStageDraft(answer(3, "Xpress"), 3, "Xpress", prevUpTo(3));
  let q = Q.withStageDraft(Q.makeQuest(N.STAGES[3], N.criteriaFor(3, "Xpress")), d);
  q = Q.fill(q, 1, "내가 고친 줄");
  const g = Q.expectedResult(q);
  assert.deepEqual(g.items.map((x) => x.lines), q.objs.map((_, i) => [i === 1 ? "내가 고친 줄" : d.items[i].text]));
  assert.deepEqual(Q.resultOf(Q.fillAll(q)).items.map((x) => x.lines), g.items.map((x) => x.lines), "모두 맞아요를 누르면 미리 만든 것과 같은 결과");
  assert.equal(Q.expectedResult(Q.withDraft(Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full")), { ...Q.EXAMPLE_DRAFT, who: "" })), null);
});

test("퀘스트 창 쉬운 말: 모든 단계 · 모든 할 일에 짧은 이름과 쉬운 한 줄 — 전문 용어 없이 짧게", () => {
  for (const s of N.STAGES) for (const c of s.criteria) {
    const short = Q.shortOf(c.text), easy = Q.easyOf(c.text);
    assert.ok(short !== c.text && short.length <= 16, `짧은 이름: ${c.text} → ${short}`);
    assert.ok(easy && easy.length <= 30, `쉬운 한 줄: ${c.text} → ${easy}`);
    for (const j of N.JARGON) assert.ok(!short.includes(j) && !easy.includes(j), `${j} in ${short} / ${easy}`);
  }
});

test("연습 예시(4 ~ 8단계): 등급마다 할 일 개수 · 순서, 고르는 칸 아니면 예시 셋, 재료는 지난 단계의 있는 칸, 준비할 것, 쉬운 말", () => {
  for (const tier of N.TIERS) for (let s = 3; s < 8; s++) {
    const crit = N.criteriaFor(s, tier), prev = prevUpTo(s, tier), ex = Q.exampleStageDraft(s, crit, prev);
    assert.ok(ex, `${s} ${tier}`); assert.equal(ex.items.length, crit.length);
    assert.ok(ex.items.every((x) => x.text && Array.isArray(x.alts) && x.alts.length === 2), `${s} ${tier} 예시 셋`);
    assert.ok(ex.items.every((x) => x.from.every((r) => r.s < s && prev[r.s].items[r.i])), "재료는 지난 단계의 있는 칸");
    assert.ok(ex.prep.length >= 1 && ex.prep.length <= 3);
    const words = JSON.stringify(ex);
    for (const j of N.JARGON) assert.ok(!words.includes(j), `${s} ${j}`);
  }
});

test("확인한 단계는 판정 AI 없이(localJudgement + 까닭) — 문서의 완료 기준은 '확인한 대로'라고 적는다(checkBy confirm)", () => {
  let q = Q.withStageDraft(Q.makeQuest(N.STAGES[3], N.criteriaFor(3, "Lite")), Q.exampleStageDraft(3, N.criteriaFor(3, "Lite"), prevUpTo(3, "Lite")));
  q = Q.fillAll(q);
  const j = N.parseJudgement(Q.localJudgement(q, Q.CONFIRM_REASON), Q.textOf(q, "앱"), 3, "Lite");
  assert.ok(j && j.criteria.every((c) => c.met)); assert.equal(j.reason, Q.CONFIRM_REASON);
  for (const w of N.JARGON) assert.ok(!Q.CONFIRM_REASON.includes(w));
  const items = (s) => N.criteriaFor(s, "Lite").map((c) => ({ name: c.text, lines: ["줄"], by: "ok" }));
  const f = D.files({ topic: "앱", results: { 0: { items: items(0), check: [{ text: "가", met: true, evidence: "가: 줄" }], checkBy: "confirm" }, 1: { items: items(1), check: [{ text: "나", met: true, evidence: "" }] } } });
  assert.match(f.find((x) => x.path === "docs/01-idea/idea.md").text, /완료 기준 — 확인한 대로/);
  assert.match(f.find((x) => x.path === "docs/02-plan/plan.md").text, /완료 기준 — 살펴본 결과/);
});

test("초안은 빠른 모델로: claude -p는 --model sonnet --effort low(바꾸려면 NAV_DRAFT_MODEL), API는 빠른 모델 · 낮은 effort · 넉넉한 글 길이 — 판정은 그대로", async () => {
  const SCHEMA = { type: "object" };
  const fast = P.cliArgs(SCHEMA, { fast: true }), plain = P.cliArgs(SCHEMA);
  assert.equal(fast[fast.indexOf("--model") + 1], "sonnet"); assert.equal(fast[fast.indexOf("--effort") + 1], "low");
  assert.ok(!plain.includes("--model") && !plain.includes("--effort"), "판정 · 그 밖은 지금처럼");
  assert.equal(P.cliArgs(SCHEMA, { fast: true, model: "haiku" })[fast.indexOf("--model") + 1], "haiku");
  const seen = [];
  const viaCli = P.createCaller({ env: { NAV_DRAFT_MODEL: "haiku" }, callCli: async (p, s, o) => { seen.push(o); return { data: { ok: 1 }, tokens: 1 }; }, makeClient: () => null, meter: P.createMeter(null, { load: () => 0, save: () => {} }) });
  await viaCli("초안", SCHEMA, { fast: true }); await viaCli("판정", SCHEMA, {});
  assert.deepEqual(seen[0], { fast: true, model: "haiku" }); assert.ok(!seen[1] || !seen[1].fast);
  const calls = [], client = { messages: { create: async (r) => { calls.push(r); return { stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: {} }; } }, beta: { messages: { create: async (r) => { calls.push(r); return { stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: {} }; } } } };
  const viaApi = P.createCaller({ env: { ANTHROPIC_API_KEY: "k" }, callCli: async () => ({}), makeClient: () => client, meter: P.createMeter(null, { load: () => 0, save: () => {} }) });
  await viaApi("초안", SCHEMA, { fast: true, maxTokens: 4096 }); await viaApi("판정", SCHEMA, {});
  assert.equal(calls[0].model, "claude-sonnet-5-5"); assert.equal(calls[0].output_config.effort, "low"); assert.equal(calls[0].max_tokens, 4096);
  assert.equal(calls[1].model, "claude-opus-5-5", "판정은 기본 모델 그대로"); assert.equal(calls[1].max_tokens, 2048);
  const relay = []; const viaRelay = P.createCaller({ env: { ANTHROPIC_API_KEY: "k", ANTHROPIC_BASE_URL: "https://relay.example" }, callCli: async () => ({}), makeClient: () => ({ messages: { create: async (r) => { relay.push(r); return { stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: {} }; } }, beta: { messages: { create: async (r) => { relay.push(r); return { stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: {} }; } } } }), meter: P.createMeter(null, { load: () => 0, save: () => {} }) });
  await viaRelay("초안", SCHEMA, { fast: true });
  assert.ok(P.RELAY_MODELS.includes(relay[0].model), "중계 서버는 받는 모델만");
  const alias = []; const viaAlias = P.createCaller({ env: { ANTHROPIC_API_KEY: "k", NAV_DRAFT_MODEL: "haiku" }, callCli: async () => ({}), makeClient: () => ({ messages: { create: async (r) => { alias.push(r); return { stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: {} }; } }, beta: { messages: { create: async (r) => { alias.push(r); return { stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: {} }; } } } }), meter: P.createMeter(null, { load: () => 0, save: () => {} }) });
  await viaAlias("초안", SCHEMA, { fast: true });
  assert.equal(alias[0].model, "claude-haiku-5-5", "별명도 API에서는 전체 이름으로(리뷰)");
});
