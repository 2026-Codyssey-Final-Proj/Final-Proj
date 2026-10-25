// claude-drafted: 2026-10-25 — C-37 2단계 초안 · 단계 결과 모음(이재엽 "1단계에서 받은 내용들을 2단계에서도 초안들을 진행하며 생각들을 2단계 진행하기 전에 먼저 생각하고 동의들을 구한후" ·
//   "1단계 결과들을 정리해서 한번에 보는 곳"). 코드보다 먼저 썼다(code.md 1번). AI는 부르지 않는다.
//   navigator.js stageDraftPrompt · STAGE_DRAFT_SCHEMA · parseStageDraft(요청문 · 답 모양), quest.js withStageDraft · draftOf · pickOf · resultOf · shortOf · exampleStageDraft(화면이 쓰는 규칙)
// 실행: node --test 04-tests/navigator/stage-draft.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const Q = require("../../03-backend/navigator/quest.js");

const PREV = [{ name: "어떤 불편을 풀고 싶은지 한 문장으로 쓰기", lines: ["행사 신청을 종이로 받아서 헷갈려요"] }, { name: "누가 쓰는지 쓰기", lines: ["쓰는 사람: 소수 — 아는 몇 사람이 써요"] }];
const mk = (n, tier) => Q.makeQuest(N.STAGES[n], N.criteriaFor(n, tier));
const answer = (tier) => ({ items: N.criteriaFor(1, tier).map((c) => ({ text: c.term === "PRD" ? "경량 — 기능이 몇 개뿐이라 짧은 기획서면 돼요" : `${c.text}의 초안` })), say: "2단계 초안을 만들었어요" });

test("초안을 만드는 단계: 지금은 2단계(코드 1)만 — 1단계는 /api/start(C-36)", () => {
  assert.deepEqual(N.DRAFT_STAGES, [1]);
});

test("2단계 초안 요청문(stageDraftPrompt): 받은 글 · 1단계 결과를 싸서 넘기고, 그 등급의 할 일을 순서대로 — 초등학생 말 · 지어내지 않기 · 기획서 칸은 경량 / 상세 / 안 함 중 하나로 시작", () => {
  const p = N.stageDraftPrompt(1, "Full", { idea: "동아리 행사 신청 앱을 만들고 싶어요", prev: PREV });
  for (const s of ["<받은글>", "동아리 행사 신청 앱을 만들고 싶어요", "<1단계결과>", "행사 신청을 종이로 받아서 헷갈려요", "쓰는 사람: 소수", N.FLORO_VOICE, ...N.criteriaFor(1, "Full").map((c) => c.text)]) assert.ok(p.includes(s), s);
  assert.match(p, /지어내지 않는다/); assert.match(p, /경량/); assert.match(p, /상세/); assert.match(p, /안 함/);
  const lite = N.stageDraftPrompt(1, "Lite", { idea: "앱", prev: PREV });
  assert.ok(!lite.includes("정해진 빈칸에 아이디어 채우기"), "등급에 없는 할 일은 묻지 않는다");
});

test("2단계 초안 모양(STAGE_DRAFT_SCHEMA): 할 일마다 글 하나 · 한마디", () => {
  assert.deepEqual([...N.STAGE_DRAFT_SCHEMA.required].sort(), ["items", "say"]);
  assert.deepEqual(N.STAGE_DRAFT_SCHEMA.properties.items.items.required, ["text"]);
});

test("2단계 초안 읽기(parseStageDraft): 할 일 개수 · 순서대로, 기획서 칸은 고르기(pick light · full · none + 까닭)로 · 글은 잘라 쓴다 · 개수가 다르거나 기획서 칸이 셋 밖이면 null", () => {
  const r = N.parseStageDraft(answer("Full"), 1, "Full");
  assert.equal(r.items.length, 5);
  assert.deepEqual(r.items[3], { pick: "light", why: "기능이 몇 개뿐이라 짧은 기획서면 돼요" });
  assert.equal(r.items[0].text, "정해진 빈칸에 아이디어 채우기의 초안"); assert.equal(r.say, "2단계 초안을 만들었어요");
  assert.equal(N.parseStageDraft({ ...answer("Full"), items: answer("Full").items.map((x, i) => (i === 3 ? { text: "상세 기획서로 — 사람이 여럿이에요" } : x)) }, 1, "Full").items[3].pick, "full");
  assert.equal(N.parseStageDraft({ ...answer("Full"), items: answer("Full").items.map((x, i) => (i === 3 ? { text: "안 함" } : x)) }, 1, "Full").items[3].pick, "none");
  assert.equal(N.parseStageDraft(answer("Xpress"), 1, "Xpress").items.length, 4, "보통에는 기획서 칸이 없다");
  const long = N.parseStageDraft({ ...answer("Lite"), items: [{ text: "가".repeat(900) }, { text: "나" }] }, 1, "Lite");
  assert.equal(long.items[0].text.length, 300);
  const prdAs = (t) => ({ ...answer("Full"), items: answer("Full").items.map((x, i) => (i === 3 ? { text: t } : x)) });
  for (const [bad, stage, tier] of [[null, 1, "Full"], [{}, 1, "Full"], [{ ...answer("Full"), items: answer("Full").items.slice(1) }, 1, "Full"], [prdAs("몰라요"), 1, "Full"],
    [{ ...answer("Lite"), items: [{ text: " " }, { text: "a" }] }, 1, "Lite"], [answer("Full"), 2, "Full"]]) assert.equal(N.parseStageDraft(bad, stage, tier), null, `${JSON.stringify(bad).slice(0, 50)} · ${stage}`);
});

test("withStageDraft: 2단계 퀘스트에 초안을 얹으면 받기 화면 없이 바로 확인(phase quest) · 초안 글(draftOf) · 고르기 칸(pickOf). 개수가 다르면 그대로", () => {
  const q0 = Q.retitle(mk(1, "Full"), "동아리 행사 신청 앱"), d = N.parseStageDraft(answer("Full"), 1, "Full");
  const q = Q.withStageDraft(q0, d);
  assert.equal(q.phase, "quest"); assert.equal(q.title, "동아리 행사 신청 앱");
  assert.equal(Q.draftOf(q, 0), "정해진 빈칸에 아이디어 채우기의 초안");
  assert.equal(Q.draftOf(q, 3), "", "고르기 칸에는 초안 글이 없다");
  assert.deepEqual(Q.pickOf(q, 3), { pick: "light", why: "기능이 몇 개뿐이라 짧은 기획서면 돼요" });
  assert.equal(Q.pickOf(q, 0), null);
  assert.equal(Q.withStageDraft(q0, { items: d.items.slice(1) }), q0, "할 일 개수와 다르면 얹지 않는다");
  assert.equal(q0.phase, "draft", "원본은 그대로");
  assert.deepEqual(Q.DOC_PICKS.map(([k]) => k), ["light", "full", "none"]);
});

test("단계 결과(resultOf): 보고한 퀘스트의 할 일 이름과 적은 줄을 그대로 — 한곳에서 보기 · 도전과제 지도 · 문서가 쓴다. 짧은 이름(shortOf)", () => {
  let q = Q.retitle(mk(0, "Full"), "동아리 행사 신청 앱");
  ["불편 줄", "달라짐 줄", "누가 줄", "크기: 보통"].forEach((t, i) => { q = Q.fill(q, i, t); });
  const r = Q.resultOf(q);
  assert.deepEqual(r, { chap: 0, title: "동아리 행사 신청 앱", items: q.objs.map((o, i) => ({ name: o.name, lines: q.lines[i] })) });
  r.items[0].lines.push("x"); assert.deepEqual(q.lines[0], ["불편 줄"], "원본과 따로");
  assert.deepEqual(N.STAGES[0].criteria.map((c) => Q.shortOf(c.text)), ["불편", "달라지는 것", "누가", "크기"]);
  assert.deepEqual(N.criteriaFor(1, "Full").map((c) => Q.shortOf(c.text)), ["빈칸 채우기", "왜 · 어디까지 · 언제 성공", "한 문장 한 가지", "기획서로 키울지", "남의 정보 · 밖으로"]);
  assert.equal(Q.shortOf("모르는 할 일"), "모르는 할 일");
  assert.equal(Q.fill(q, 0, "가".repeat(900)).lines[0].at(-1).length, 400, "한 줄은 400자까지 — 서버가 단계 결과 · 문서에서 받는 길이(2026-10-25 리뷰)");
});

test("연습(서버 없이)의 2단계 예시 초안 — 등급마다 그 할 일 개수 · 순서, 서버 답과 같은 모양, 쉬운 말", () => {
  for (const tier of N.TIERS) {
    const ex = Q.exampleStageDraft(1, N.criteriaFor(1, tier));
    assert.equal(ex.items.length, N.criteriaFor(1, tier).length, tier); assert.equal(ex.example, true);
  }
  assert.equal(Q.exampleStageDraft(2, N.criteriaFor(2, "Full")), null, "예시가 없는 단계");
  const words = JSON.stringify([Q.exampleStageDraft(1, N.criteriaFor(1, "Full")), Q.DOC_PICKS]);
  for (const j of N.JARGON) assert.ok(!words.includes(j), j);
});
