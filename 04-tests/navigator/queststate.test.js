// claude-drafted: 2026-10-28 — C-56 R-3 · R-4(이재엽 "너무 지금 형식적인 질문이야 … 이미 있는 내용이라면 어떤식으로 작성할지", 버튼 "'옮김' 새 값"): 퀘스트 칸마다 상태 넷 — 쓰기 · 옮겨 옴 · 건너뜀 · 먼저.
//   규칙으로 정할 수 있는 상태는 코드가 정한다(넘김 문서 3절 ⓑ): 지난 칸과 같은 글 → 옮겨 옴, 기능 수 < 5 → 3단계 Ⅳ 건너뜀, 공개하지 않음 → 7단계 Ⅳ 건너뜀, 성공 숫자 빈칸 → 7단계 Ⅰ 먼저, 코드 파일 0개 → 6단계 먼저. 코드보다 먼저 썼다(code.md 1번)
// 실행: node --test 04-tests/navigator/queststate.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const Q = require("../../03-backend/navigator/quest.js");
const S = require("../../03-backend/navigator/queststate.js");

const crit = (n) => N.criteriaFor(n, "Xpress");
const R = (n, lines) => ({ stage: n, items: crit(n).map((c, i) => ({ name: c.text, lines: lines[i] === undefined ? [`${n + 1}단계 ${i + 1}번 줄`] : lines[i] })) });
const prev2 = [R(0, {}), R(1, { 1: ["3초 안에 '신청됨' · 마감 하루 전 알림 1번"], 3: ["학번은 운영진만 봐요 · 앱은 공개하지 않아요"] })];

test("factsFrom — 결과 · 받은 글 · 파일 목록에서 사실만 뽑는다: 기능 수(3단계 Ⅰ 줄 수), 공개 여부(2단계 Ⅳ 글), 성공 숫자가 있나(2단계 Ⅱ), 코드 파일 수. 모르면 null — 지어내지 않는다", () => {
  const results = { 0: R(0, {}), 1: prev2[1], 2: R(2, { 0: ["회원이 신청을 누르면, 앱은 신청서를 보인다", "운영진이 행사를 만들면, 앱은 목록에 올린다", "마감 하루 전이 되면, 앱은 알림을 보낸다", "명단을 내려받으면, 앱은 CSV를 준다"] }) };
  const f = S.factsFrom({ results, files: [{ path: "src/app.js", dir: false }, { path: "docs", dir: true }, { path: "README.md", dir: false }] });
  assert.deepEqual(f, { features: 4, publish: false, success: true, codeFiles: 1, pushed: null, dirty: null, codeless: false });
  assert.equal(S.factsFrom({ results: { 2: R(2, { 0: ["신청하면, 앱은 받는다 / 만들면, 앱은 올린다 / 마감 전이면, 앱은 알린다 / 내려받으면, 앱은 CSV를 준다 / 지우면, 앱은 지운다 / 바꾸면, 앱은 고친다"] }) } }).features, 6, "' / '로 이은 한 줄은 조각 수로(3단계 초안 지시 그대로 — 리뷰 막힘)");
  assert.deepEqual(S.factsFrom({ results: {}, files: null }), { features: null, publish: null, success: null, codeFiles: null, pushed: null, dirty: null, codeless: false }, "모르면 null");
  assert.equal(S.factsFrom({ results: { 1: R(1, { 1: ["언제 성공: 아직 모름"] }) } }).success, false, "'아직 모름' · 숫자 없음은 성공 숫자 빈칸");
  assert.equal(S.factsFrom({ results: { 1: R(1, { 3: ["누구나 쓰게 웹에 공개해요"] }) } }).publish, true);
  assert.equal(S.factsFrom({ results: { 1: R(1, { 3: ["이름만 다뤄요"] }) } }).publish, null, "공개 말이 없으면 모름");
});

test("stateOf — 옮겨 옴(지난 칸과 같은 글) · 건너뜀(기준의 조건이 안 맞음, 까닭) · 먼저(앞 칸이 비어 할 수 없음, 갈 곳) · 쓰기(기본)", () => {
  const same = S.stateOf({ stage: 2, i: 0, text: "3초 안에 '신청됨' · 마감 하루 전 알림 1번", prev: prev2, facts: {} });
  assert.deepEqual(same, { state: "moved", from: { s: 1, i: 1 }, why: "2단계 Ⅱ에서 정한 글 그대로" }, "지난 칸과 같은 글 — 다시 쓰지 않는다");
  assert.equal(S.stateOf({ stage: 2, i: 0, text: "새 글", prev: prev2, facts: {} }).state, "write");
  const skip3 = S.stateOf({ stage: 2, i: 3, text: "", prev: prev2, facts: { features: 4 } });
  assert.equal(skip3.state, "skip"); assert.match(skip3.why, /기능이 4개/, "3단계 Ⅳ(5개 이상일 때)는 기능이 넷이면 건너뜀");
  assert.equal(S.stateOf({ stage: 2, i: 3, text: "", prev: prev2, facts: { features: 6 } }).state, "write"); assert.equal(S.stateOf({ stage: 2, i: 3, text: "", prev: prev2, facts: { features: null } }).state, "write", "모르면 건너뛰지 않는다");
  const skip7 = S.stateOf({ stage: 6, i: 3, text: "", prev: prev2, facts: { publish: false } });
  assert.equal(skip7.state, "skip"); assert.match(skip7.why, /공개하지 않/);
  const first7 = S.stateOf({ stage: 6, i: 0, text: "", prev: prev2, facts: { success: false } });
  assert.equal(first7.state, "first"); assert.deepEqual(first7.go, { s: 1, i: 1, name: "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기" }); assert.match(first7.why, /언제 성공/);
  const first6 = S.stateOf({ stage: 5, i: 1, text: "", prev: prev2, facts: { codeFiles: 0 } });
  assert.equal(first6.state, "first"); assert.deepEqual(first6.go, { s: 4, i: 0 }); assert.match(first6.why, /코드 파일이 없/);
  assert.equal(first6.code, true, "코드 파일이 없어서 먼저 — 화면이 '코드 파일을 만드시겠습니까?'로 묻는다(A-04, F-70)");
  assert.equal(S.stateOf({ stage: 5, i: 1, text: "", prev: prev2, facts: { codeFiles: 0, codeless: true } }).state, "write", "아니요(코드 없이)를 골랐으면 막지 않는다 — 문서만 만드는 일일 수 있다");
  assert.equal(S.factsFrom({ results: {}, files: [], codeless: true }).codeless, true);
  assert.equal(first7.code, undefined, "다른 '먼저'에는 코드 물음 표시가 없다");
  assert.equal(S.stateOf({ stage: 5, i: 1, text: "", prev: prev2, facts: { codeFiles: null } }).state, "write");
});

test("questStates · gateOpen · allOkOnly — 퀘스트의 칸마다 상태, 먼저가 있으면 관문은 닫힘, '남은 칸 모두 맞아요'는 옮겨 온 칸에만", () => {
  const q = Q.makeQuest(N.STAGES[2], crit(2)), d = { items: crit(2).map((c, i) => ({ text: i === 0 ? "3초 안에 '신청됨' · 마감 하루 전 알림 1번" : `${i}번 초안` })) };
  const qq = Q.withDraft(q, d);
  const st = S.questStates(qq, { prev: prev2, facts: { features: 4 } });
  assert.deepEqual(st.map((x) => x.state), ["moved", "write", "write", "skip", "write"]);
  assert.equal(S.gateOpen(st), true); assert.deepEqual(S.allOkOnly(st), [0], "모두 맞아요는 옮겨 온 칸만");
  const st7 = S.questStates(Q.withDraft(Q.makeQuest(N.STAGES[6], crit(6)), { items: crit(6).map(() => ({ text: "x" })) }), { prev: prev2, facts: { success: false, publish: false } });
  assert.deepEqual(st7.map((x) => x.state), ["first", "write", "write", "skip"]); assert.equal(S.gateOpen(st7), false, "먼저는 관문을 닫는다");
  assert.deepEqual(S.STATE_WORD, { write: "쓰기", moved: "옮겨 옴", skip: "건너뜀", first: "먼저" });
  assert.ok(Q.BY.includes("moved") && Q.BY_WORD.moved === "옮김" && Q.BY.includes("skip") && Q.BY_WORD.skip === "건너뜀", "누가 정했나에 '옮김' · '건너뜀'(이재엽 버튼)");
});

// claude-drafted: 2026-11-07 — F-166-6(사용자 시험 셋째): 8단계 '저장소에 올리기'가 단계 문서만 올리고 코드는 커밋하지 않은 채 '했음'이 됐다
test("8단계 저장소에 올리기 — 문서를 올렸어도 커밋하지 않은 파일이 남으면 먼저(코드도 커밋 · 푸시)", () => {
  const COMMIT = 4;
  const on = (facts) => S.stateOf({ stage: 7, i: COMMIT, facts });
  const a = on(S.factsFrom({ pushed: true, dirty: 3 }));
  assert.equal(a.state, "first"); assert.equal(a.commit, true); assert.match(a.why, /커밋하지 않은 파일이 3개/);
  assert.equal(on(S.factsFrom({ pushed: true, dirty: 0 })).state, "write", "다 커밋했으면 적는다");
  assert.equal(on(S.factsFrom({ pushed: true, dirty: null })).state, "write", "모르면 막지 않는다");
  assert.equal(on(S.factsFrom({ pushed: false, dirty: 3 })).ship, true, "올린 적이 없으면 전처럼 문서 올리기부터");
  assert.equal(S.factsFrom({ dirty: -1 }).dirty, null);
});
