// claude-drafted: 2026-10-25 — C-36 처음 한 바퀴: 받은 글 전체로 1단계 초안(이재엽 "원하는 내용을 플로로에게 받는걸로 … 너가 전체적으로 글들을 확인해서 … 초안을 백엔드로 제작 …
//   이 주제에 대한 내용을 제목으로" · 버튼 "1단계는 확인만 → 관문 → 2단계" · "규모 판단표 scope-tiers"). 코드보다 먼저 썼다(code.md 1번). AI는 부르지 않는다.
//   navigator.js startPrompt · START_SCHEMA · parseStart(요청문 · 답 모양), quest.js withDraft · draftOf · 크기 · 누가(화면이 쓰는 규칙)
// 실행: node --test 04-tests/navigator/start-draft.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const Q = require("../../03-backend/navigator/quest.js");
const T = require("../../03-backend/navigator/tiers.js");

const DRAFT = { topic: "동아리 행사 신청 앱", pain: "행사 신청을 종이로 받아서 헷갈려요", change: "신청이 한곳에 모여요", who: "동아리 운영진과 회원", size: "medium", sizeWhy: "흔한 기능 두 가지예요" };
const mk = () => Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full"));

test("초안 모양(START_SCHEMA): 제목 · 불편 · 달라지는 것 · 누가 · 크기 · 크기 까닭 — 칸은 모두 꼭(누가는 빈 글자도 된다)", () => {
  const s = N.START_SCHEMA;
  assert.deepEqual([...s.required].sort(), ["change", "pain", "size", "sizeWhy", "topic", "who"]);
  assert.equal(s.properties.who.minLength, undefined, "글에 사람이 없으면 빈 글자");
  assert.deepEqual(s.properties.size.enum, ["short", "medium", "long"], "크기는 셋 중 하나로만 답하게");
  assert.equal(N.START_MAX, N.PLAN_MAX, "받는 글은 계획과 같은 8,000자까지");
});

test("초안 요청문(startPrompt): 받은 글을 싸서 넘기고 — 1단계 할 일 넷 · 초등학생 말 · 지어내지 않기 · 사람이 없으면 빈 글자 · 규모 판단표(short · medium · long)", () => {
  const p = N.startPrompt("동아리 행사 신청 앱을 만들고 싶어요. 종이로 받아서 헷갈려요.");
  for (const s of ["<넣은글>", "동아리 행사 신청 앱을 만들고 싶어요", ...N.STAGES[0].criteria.map((c) => c.text), N.FLORO_VOICE, "short", "medium", "long"]) assert.ok(p.includes(s), s);
  assert.match(p, /지어내지 않는다/); assert.match(p, /빈 문자열/); assert.match(p, /topic/);
  assert.match(p, /① 흔히 쓰는 방법\(표준 패턴\) 하나로 바로 풀리는 일이면 medium ② 아니고, 작은 버그 고치기나 한 파일짜리 스크립트 수준이면 short ③ 둘 다 아니면 long/, "규모 판단표의 순서 그대로(scope-tiers.md — Xpress 먼저, 그다음 Lite)");
});

test("초안 읽기(parseStart): 맞으면 글을 잘라 쓰고, 크기는 short · medium · long만, 누가는 빈 글자도 된다 · 틀리면 null", () => {
  assert.deepEqual(N.parseStart(DRAFT), DRAFT);
  assert.equal(N.parseStart({ ...DRAFT, who: "  " }).who, "", "사람이 없으면 빈 글자");
  for (const none of ["없음", "모름", "없어요.", "-"]) assert.equal(N.parseStart({ ...DRAFT, who: none }).who, "", `'${none}'도 사람이 없는 것(2026-10-25 리뷰)`);
  const long = N.parseStart({ ...DRAFT, topic: "가".repeat(80), pain: "나".repeat(400) });
  assert.equal(long.topic.length, 30); assert.equal(long.pain.length, N.LEN.pain);   // 2026-10-30 퀘스트 글 짧게(quest-short.test.js)
  for (const bad of [null, {}, { ...DRAFT, size: "huge" }, { ...DRAFT, topic: "" }, { ...DRAFT, who: 3 }, { ...DRAFT, pain: " " }, { ...DRAFT, sizeWhy: undefined }]) assert.equal(N.parseStart(bad), null, JSON.stringify(bad).slice(0, 60));
});

test("withDraft: 1단계 퀘스트에 초안을 얹으면 제목은 주제, 받기 화면 없이 바로 확인(phase quest) — 원본은 그대로, 초안이 없으면 그대로", () => {
  const q0 = mk(), q = Q.withDraft(q0, DRAFT);
  assert.equal(q.title, "동아리 행사 신청 앱"); assert.equal(q.phase, "quest"); assert.deepEqual(q.draft, DRAFT);
  assert.equal(q0.title, N.STAGES[0].title, "원본은 그대로"); assert.equal(q0.phase, "draft");
  assert.ok(q.lines.every((l) => l.length === 0), "확인 전에는 줄이 비어 있다 — 맞아요를 눌러야 적힌다");
  assert.equal(Q.withDraft(q0, null), q0);
});

test("draftOf: Ⅰ 불편 · Ⅱ 달라지는 것 · Ⅲ 누가(글에 있을 때만) — Ⅳ 크기는 고르는 칸이라 초안 글이 없다, 1단계가 아니거나 초안이 없으면 빈 글", () => {
  const q = Q.withDraft(mk(), DRAFT);
  assert.deepEqual([0, 1, 2, 3].map((i) => Q.draftOf(q, i)), [DRAFT.pain, DRAFT.change, DRAFT.who, ""]);
  assert.equal(Q.draftOf(Q.withDraft(mk(), { ...DRAFT, who: "" }), 2), "", "사람이 없으면 고르는 칸(본인 · 소수 · 불특정다수)");
  assert.equal(Q.draftOf(mk(), 0), "", "초안이 없으면");
  const q2 = { ...Q.makeQuest(N.STAGES[1], N.criteriaFor(1, "Full")), draft: DRAFT };
  assert.equal(Q.draftOf(q2, 0), "", "1단계에서만");
});

test("크기: 짧음 · 보통 · 긺 = Lite · Xpress · Full(규모 판단표) — 만드는 크기의 화면 이름도 같다. 누가 고르기는 본인 · 소수 · 불특정다수", () => {
  assert.deepEqual(Q.SIZE_KEYS, ["short", "medium", "long"]);
  assert.deepEqual(Q.SIZE_KEYS.map((k) => [Q.SIZE_TIER[k], Q.SIZE_WORD[k]]), T.LABELS, "설정의 만드는 크기와 같은 순서 · 같은 이름");
  assert.deepEqual(Q.WHO.map(([w]) => w), ["본인", "소수", "불특정다수"]);
  assert.ok(Q.WHO.every(([, line]) => line && line.length <= 20), "고르는 칩 옆의 쉬운 말 한 줄");
});

test("연습 예시 초안(EXAMPLE_DRAFT)은 서버 답과 같은 모양이고 쉬운 말 — 전문 용어가 없다", () => {
  assert.deepEqual(N.parseStart(Q.EXAMPLE_DRAFT), Q.EXAMPLE_DRAFT);
  assert.ok(Q.EXAMPLE_DRAFT.who, "예시는 글에 사람이 있는 경우");
  const words = JSON.stringify([Q.EXAMPLE_DRAFT, Q.WHO, Q.SIZE_WORD]);
  for (const j of N.JARGON) assert.ok(!words.includes(j), j);
});
