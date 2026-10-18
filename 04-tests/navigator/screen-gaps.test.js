// claude-drafted: 2026-10-18 — 화면 빈칸(이재엽 요청 2026-10-18): 용어 풀이(FR-13) · 확인 질문 · 보류(FR-5) · 꼭/나중에(FR-12) · 작업 알림 기록(FR-7)
// 실행: node --test 04-tests/navigator/screen-gaps.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const Nav = require("../../03-backend/navigator/navigator.js");
const G = require("../../03-backend/navigator/glossary.js");
const U = require("../../03-backend/navigator/understand.js");
const P = require("../../03-backend/navigator/priority.js");
const A = require("../../03-backend/navigator/alerts.js");
const T = require("../../03-backend/navigator/tiers.js");
const S = require("../../03-backend/navigator/scenario.js");
const Cat = require("../../02-frontend/navigator/seal.js");

const jargonIn = (text) => Nav.JARGON.filter((w) => String(text).includes(w));

// ── FR-13 모르는 말을 그 자리에서 풀어 주기 ──
// 이 시험은 다른 사람이 단계 표(STAGES)에 새 용어를 더하면 실패한다 — 풀이 한 줄을 같이 더하라는 뜻이다(의도한 것)
test("용어 풀이: 단계 표의 모든 용어(criteria[].term)에 한 줄 풀이가 있다", () => {
  const terms = [...new Set(Nav.STAGES.flatMap((s) => s.criteria.map((c) => c.term)).filter(Boolean))];
  assert.ok(terms.length > 10, "용어가 있어야 시험이 의미 있다");
  for (const t of terms) assert.ok(G.explain(t), `풀이 없음: ${t}`);
});

test("용어 풀이: 쉬운 말 규칙이 막는 말(JARGON)과 만드는 크기(Lite·Xpress·Full)도 풀이가 있다", () => {
  for (const w of Nav.JARGON) assert.ok(G.explain(w), `풀이 없음: ${w}`);
  for (const t of ["Lite", "Xpress", "Full"]) assert.ok(G.explain(t), t);
  // 쉬운 말 규칙에는 없지만 큰 글씨로 나오는 말 — 한곳에서 보기의 '토큰', 도서관의 '세션 덮기'(인수 시험에서 찾음, 2026-10-18)
  for (const t of ["토큰", "세션 덮기"]) assert.ok(G.explain(t), t);
});

test("용어 풀이: 풀이 줄은 한 줄이고 짧으며, 그 안에 다른 전문 용어가 없다", () => {
  for (const [term, line] of Object.entries(G.LINES)) {
    assert.deepEqual(jargonIn(line), [], `${term}: ${line}`);
    assert.ok(!/\n/.test(line) && line.length <= Nav.SAY_MAX, `${line.length}자: ${line}`);
  }
});

test("용어 풀이: 모르는 말이면 빈 글을 돌려준다(화면은 누를 수 없는 표시로 둔다)", () => {
  assert.equal(G.explain("없는 말"), "");
  assert.equal(G.explain(""), "");
  assert.equal(G.explain(undefined), "");
});

// ── '예만 누르기' 대책 — 짧은 확인 질문 1개 (이재엽 결정 2026-10-18) ──
test("확인 질문: 단계마다 선택지 3개가 서로 다르고, 정답(그 단계에서 만든 것)이 늘 들어 있다", () => {
  for (const s of Nav.STAGES) {
    const q = U.checkQuestion(s.n);
    assert.equal(q.ask, "이번 단계가 끝나면 무엇이 남나요?");
    assert.equal(q.options.length, 3, `${s.n}단계`);
    assert.equal(new Set(q.options).size, 3, `${s.n}단계 선택지가 겹침`);
    assert.equal(q.options[q.answer], s.gives, `${s.n}단계 정답`);
    const others = Nav.STAGES.filter((x) => x.n !== s.n).map((x) => x.gives);
    for (const o of q.options.filter((_, i) => i !== q.answer)) assert.ok(others.includes(o), `오답은 다른 단계에서 만든 것: ${o}`);
    assert.equal(q.why, s.does, "틀리면 보여 줄 한 줄 설명은 그 단계에서 한 일");
  }
});

test("확인 질문: 같은 단계면 늘 같은 질문(섞는 순서가 정해져 있다), 정답 자리는 단계마다 고르게 바뀐다", () => {
  for (const s of Nav.STAGES) assert.deepEqual(U.checkQuestion(s.n), U.checkQuestion(s.n));
  const spots = new Set(Nav.STAGES.map((s) => U.checkQuestion(s.n).answer));
  assert.ok(spots.size >= 2, `정답이 늘 같은 자리: ${[...spots]}`);
});

test("확인 질문: 오답 거리가 모자라거나 없는 단계면 묻지 않는다(null)", () => {
  const tiny = [{ n: 0, gives: "가", does: "x" }, { n: 1, gives: "가", does: "y" }, { n: 2, gives: "나", does: "z" }];
  assert.equal(U.checkQuestion(0, tiny), null, "다른 답이 하나뿐");
  assert.equal(U.checkQuestion(9), null);
});

test("확인 질문: 맞히면 ok, 틀려도 막지 않고 정답과 한 줄 설명을 준다 · 기록은 원본을 바꾸지 않는다", () => {
  const q = U.checkQuestion(2), wrong = (q.answer + 1) % 3;
  assert.deepEqual(U.grade(q, q.answer), { ok: true, right: q.options[q.answer], why: q.why });
  assert.deepEqual(U.grade(q, wrong), { ok: false, right: q.options[q.answer], why: q.why });
  const before = [{ stage: 1, ok: true, at: "2026-10-17" }];
  const after = U.record(before, 2, false, "2026-10-18");
  assert.deepEqual(after, [...before, { stage: 2, ok: false, at: "2026-10-18" }]);
  assert.equal(before.length, 1);
});

// 리뷰 지적(2026-10-18, 막힘): 확인 질문 바로 위의 그림(받은 것 → 한 일 → 만든 것)에 정답이 보였다 — 답하기 전에는 '만든 것'을 어디에도 두지 않는다
test("확인 질문: 답하기 전에는 질문 장면에 보이는 글(그림·말풍선·안내·할 일) 어디에도 정답이 없고, 답한 뒤에는 다시 보인다", () => {
  for (const s of Nav.STAGES) {
    const q = U.checkQuestion(s.n), right = q.options[q.answer], pending = { q, pick: null, ok: null };
    const shown = [s.gets, s.does, U.shownGives(s, pending), U.face(pending)[1], q.ask, ...Nav.STAGES[s.n].criteria.map((c) => c.text)];
    for (const t of shown) assert.ok(!String(t).includes(right), `${s.n}단계: "${t}"에 정답 "${right}"`);
    assert.equal(U.shownGives(s, { q, pick: 0, ok: q.answer === 0 }), s.gives, `${s.n}단계: 답한 뒤`);
    assert.equal(U.shownGives(s, null), s.gives, `${s.n}단계: 확인 질문이 없을 때`);
    const other = Nav.STAGES[(s.n + 1) % Nav.STAGES.length];
    assert.equal(U.shownGives(other, pending), other.gives, "묻는 단계가 아니면 가리지 않는다");
  }
});

test("확인 질문: 화면(app.js)은 '만든 것'(gives)을 직접 읽지 않고 늘 shownGives를 거친다 — 새로 그리는 곳이 생겨도 정답이 새지 않게", () => {
  const code = require("node:fs").readFileSync(require("node:path").join(__dirname, "../../02-frontend/navigator/app.js"), "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.deepEqual(code.match(/\.gives\b/g) || [], []);
  assert.ok(code.includes("U.shownGives("), "shownGives로 그린다");
});

test("확인 질문 플로로: 묻는 중·맞힘·틀림의 표정은 플로로에게 있고, 말은 짧고 쉬운 말이다", () => {
  const q = U.checkQuestion(1);
  for (const [mood, say] of [...[{ q }, { q, pick: q.answer, ok: true }, { q, pick: 0, ok: false }].map(U.face), ...Object.values(U.FACE)]) {
    assert.ok(Cat.MOODS.includes(mood), mood);
    assert.ok(say.length <= Nav.SAY_MAX, say);
    assert.deepEqual(jargonIn(say), [], say);
  }
  assert.equal(U.face({ q, pick: 0, ok: false })[0], "think");
  assert.equal(U.face({ q, pick: q.answer, ok: true })[0], "happy");
  for (const s of Nav.STAGES) assert.deepEqual(jargonIn(U.checkQuestion(s.n).ask), []);
});

// ── FR-5 보류(Hold) — "아니요" 3회 뒤 (이재엽 확정 2026-10-16, requirements.md 13-1) ──
test("보류: '아니요' 두 번까지는 권하지 않고, 세 번째부터 '잠시 멈추기'를 권한다", () => {
  assert.equal(U.HOLD_AFTER_NO, 3);
  assert.equal(U.offerHold(0), false);
  assert.equal(U.offerHold(1), false);
  assert.equal(U.offerHold(2), false);
  assert.equal(U.offerHold(3), true);
  assert.equal(U.offerHold(4), true);
});

test("보류: 누가(비우면 '나')·언제(오늘이나 그 뒤의 날짜)를 받아 기록을 만든다 — 날짜가 틀리면 만들지 않는다", () => {
  const today = "2026-10-18";
  assert.deepEqual(U.makeHold({ stage: 2, who: "  ", when: "2026-10-20", today }), { stage: 2, who: "나", when: "2026-10-20", at: today });
  assert.equal(U.makeHold({ stage: 2, who: "민수", when: "2026-10-18", today }).who, "민수", "오늘도 된다");
  assert.equal(U.makeHold({ stage: 2, who: "x".repeat(50), when: "2026-10-20", today }).who.length, 20, "이름은 20자까지");
  for (const when of ["", "2026-10-17", "10/20", "2026-13-01", "2026-02-30", undefined]) assert.equal(U.makeHold({ stage: 2, who: "나", when, today }), null, String(when));
});

test("보류: 오늘 카드의 띠 — 다시 볼 날(월/일)과, 내가 아니면 다시 볼 사람. 그날이 되면 알려 준다", () => {
  const h = { stage: 2, who: "나", when: "2026-10-20", at: "2026-10-18" };
  assert.equal(U.holdLine(h, "2026-10-18"), "보류 중 · 10/20에 다시 보기");
  assert.equal(U.holdLine({ ...h, who: "민수", when: "2026-11-03" }, "2026-10-18"), "보류 중 · 11/3에 다시 보기 · 다시 볼 사람: 민수");
  assert.equal(U.holdLine(h, "2026-10-20"), "보류 중 · 다시 보기로 한 날이 됐어요 (10/20)");
  assert.equal(U.holdLine(h, "2026-10-25"), "보류 중 · 다시 보기로 한 날이 됐어요 (10/20)");
  assert.deepEqual(jargonIn(U.holdLine(h, "2026-10-18")), []);
});

test("보류해도 넘어가는 규칙은 그대로다 — 할 일을 다 해도 '예'가 없으면 못 넘어간다", () => {
  assert.equal(Nav.canAdvance([true, true, true], "hold"), false);
  assert.equal(Nav.canAdvance([true, true, true], "yes"), true);
});

// ── FR-12 우선순위 — 꼭 할 일 / 나중에 (제안: 꼭·되도록·되면·안 함 넷을 둘로 줄인 것) ──
test("꼭/나중에: 기본은 모두 꼭 할 일이라 정한 순서 그대로, '나중에'는 뒤로 간다", () => {
  const todos = ["가", "나", "다"];
  assert.deepEqual(P.order(todos, []), todos);
  assert.deepEqual(P.order(todos, ["가"]), ["나", "다", "가"], "지금 할 일은 꼭 할 일 중 첫째");
  assert.deepEqual(P.order(todos, ["다", "가"]), ["나", "가", "다"], "나중에끼리는 정한 순서대로");
  assert.deepEqual(P.order(todos, ["가", "나", "다"]), todos, "나중에만 남으면 그 순서대로");
  assert.deepEqual(P.order(todos, ["없는 일"]), todos);
  assert.deepEqual(todos, ["가", "나", "다"], "원본은 안 바뀐다");
  assert.deepEqual(P.order(null, ["가"]), null);
});

test("꼭/나중에: 누를 때마다 바뀌고, 원본은 안 바뀐다 · 이름은 쉬운 말이다", () => {
  const later = ["가"];
  assert.deepEqual(P.toggle(later, "나"), ["가", "나"]);
  assert.deepEqual(P.toggle(later, "가"), []);
  assert.deepEqual(later, ["가"]);
  assert.equal(P.isLater(later, "가"), true);
  assert.equal(P.isLater(later, "나"), false);
  assert.deepEqual([P.LABEL.must, P.LABEL.later], ["꼭 할 일", "나중에"]);
  for (const t of Object.values(P.LABEL)) assert.deepEqual(jargonIn(t), []);
});

test("꼭/나중에: 진행 세 줄(ticker)의 '지금 할 일'이 나중에 미룬 일을 건너뛴다", () => {
  const j = { stage: 3, criteria: Nav.STAGES[3].criteria.map((c) => ({ ...c, met: false })), next: null };
  const todos = Nav.STAGES[4].criteria.map((c) => c.text);
  assert.equal(Nav.ticker(j, P.order(todos, [todos[0]]), "").now, todos[1]);
  assert.equal(Nav.ticker(j, P.order(todos, todos), "").now, todos[0], "나중에만 남으면 그중 첫째");
});

// ── FR-7 작업 알림 → 기록 ──
test("알림 기록: 새것이 위에, 20개까지만, 원본은 안 바뀐다", () => {
  let list = [];
  for (let i = 0; i < 25; i++) list = A.add(list, { at: i, kind: "stop", tool: "claude", project: "p", work: `[Claude] ${i}번째 답` });
  assert.equal(list.length, A.MAX);
  assert.equal(list[0].line, "[Claude] 24번째 답");
  const one = A.add([], { at: 1, kind: "prompt", tool: "codex", project: "club", work: "" });
  assert.deepEqual(one, [{ at: 1, kind: "prompt", tool: "codex", project: "club", line: "", hidden: false, sim: false, done: [] }]);
  const before = [...one];
  A.add(one, { at: 2, kind: "stop" });
  assert.deepEqual(one, before);
});

test("알림 기록: 한 줄 요약은 서버가 준 글 그대로 — summary가 있으면 그것, 없으면 작업 글의 마지막 줄을 줄여서", () => {
  assert.equal(A.summary({ summary: "기능 6개를 정리했어요", work: "다른 글" }), "기능 6개를 정리했어요");
  assert.equal(A.summary({ work: "[사용자] 정리해 줘\n[Claude]  기능 6개를\n  정리했어요\n\n" }), "정리했어요");
  assert.equal(A.summary({ work: "[Claude] " + "가".repeat(200) }).length, A.LINE_MAX);
  assert.match(A.summary({ work: "가".repeat(200) }), /…$/);
  assert.equal(A.summary({}), "");
});

test("알림 기록: 비밀번호·키처럼 보이는 글이면 내용을 남기지 않고 숨겼다고만 적는다", () => {
  const scan = (t) => /sk-[a-z0-9]{8,}/i.test(t);
  const [e] = A.add([], { at: 1, kind: "stop", tool: "claude", work: "[Claude] 키는 sk-abcdef123456 이에요" }, scan);
  assert.deepEqual([e.line, e.hidden], ["", true]);
  const [ok] = A.add([], { at: 1, kind: "stop", tool: "claude", work: "[Claude] 다 했어요" }, scan);
  assert.deepEqual([ok.line, ok.hidden], ["[Claude] 다 했어요", false]);
  assert.deepEqual(jargonIn(Object.values(A.KIND).join(" ")), []);
});

test("알림 기록: 연습 알림은 표시가 붙고, 살펴본 뒤 새로 끝낸 할 일을 붙일 수 있다", () => {
  const [e] = A.add([], { at: 1, kind: "stop", tool: "claude", sim: true, work: "x" });
  assert.equal(e.sim, true);
  const marked = A.markDone([e], ["기능 문장 쓰기"]);
  assert.deepEqual(marked[0].done, ["기능 문장 쓰기"]);
  assert.deepEqual(e.done, [], "원본은 안 바뀐다");
  assert.deepEqual(A.markDone([], ["x"]), []);
});

// ── 시연 안전장치 — 연결 끊기 · 알림 기록 비우기 ──
test("연결 끊기: 끊은 동안 들어온 알림은 받지 않고(글 칸 채우기·살펴보기 없음), 다시 연결하면 받는다", () => {
  const ev = { kind: "stop", tool: "claude", work: "[Claude] 다 했어요" };
  assert.equal(A.accept(ev, true), false);
  assert.equal(A.accept(ev, false), true);
  assert.equal(A.accept({ ...ev, sim: true }, true), true, "이 화면이 스스로 만든 연습 알림(작업 장면 보기)은 서버에서 온 게 아니라 받는다");
  assert.equal(A.accept(null, false), false);
});

test("알림 기록 비우기: 서버 답에 따라 쉬운 말로 알린다 — 이 화면의 기록은 늘 비운다", () => {
  assert.match(A.clearNote(200), /비웠어요/);
  assert.match(A.clearNote(204), /비웠어요/);
  for (const s of [404, 401, 403, 500, 0]) {
    const t = A.clearNote(s);
    assert.match(t, /^이 화면의 기록은 비웠어요/, `${s}: ${t}`);
    assert.match(t, /서버/, `${s}: ${t}`);
  }
  assert.notEqual(A.clearNote(404), A.clearNote(0), "없는 기능과 연결 실패는 다르게 말한다");
  assert.equal(A.clearNote(null), "이 화면의 알림 기록을 비웠어요.", "서버 없이 연 화면");
  for (const s of [200, 404, 401, 500, 0, null]) assert.deepEqual(jargonIn(A.clearNote(s)), []);
});

test("새로 끝낸 할 일: 같은 단계에서 전에는 안 했고 지금은 한 것만", () => {
  const j = (stage, mets) => ({ stage, criteria: mets.map((m, i) => ({ text: `할 일 ${i}`, met: m })) });
  assert.deepEqual(A.newlyDone(j(2, [true, false, false]), j(2, [true, true, false])), ["할 일 1"]);
  assert.deepEqual(A.newlyDone(j(2, [true, true]), j(2, [true, true])), []);
  assert.deepEqual(A.newlyDone(null, j(0, [true, false])), ["할 일 0"], "처음 살펴본 것");
  assert.deepEqual(A.newlyDone(j(1, [true, true]), j(2, [true, false])), ["할 일 0"], "단계가 바뀌면 지금 단계 것만");
  assert.deepEqual(A.newlyDone(j(2, [true]), null), []);
});

// ── 만드는 크기(등급) — 연습 장면·미리 만든 답은 Full 순서라 등급에 맞춰 같은 자리만 남긴다(v2/judge-rules-final의 criteriaFor) ──
test("등급 맞추기: Lite 1단계는 할 일 2개만 순서대로 남기고, Full은 그대로, 모르는 등급은 Full", () => {
  assert.deepEqual(T.keep(1, "Lite"), [2, 4]);
  assert.deepEqual(T.fit(["가", "나", "다", "라", "마"], 1, "Lite"), ["다", "마"]);
  assert.deepEqual(T.fit(["가", "나", "다", "라", "마"], 1, "Full"), ["가", "나", "다", "라", "마"]);
  assert.deepEqual(T.keep(1, "모름"), T.keep(1, "Full"));
  assert.deepEqual(T.fit(["가"], 1, "Lite"), ["가"], "Full 개수가 아닌 목록은 건드리지 않는다");
  for (const s of Nav.STAGES) for (const t of Nav.TIERS) {
    assert.deepEqual(T.keep(s.n, t).map((i) => s.criteria[i]), Nav.criteriaFor(s.n, t), `${s.n}단계 ${t}`);
  }
});

test("등급 맞추기: 연습 장면은 등급마다 살펴볼 수 있다(Lite·Xpress에서도 '살펴보지 못했어요'가 안 나온다)", () => {
  for (const ex of S.examples) {
    const base = ex.from !== undefined ? S.examples[ex.from] : ex, q = base.judgement.next, n = ex.judgement.stage;
    const text = ex.from !== undefined ? `${base.text}\n${Nav.decisionLine(q.question, q.options[0])}` : ex.text;
    for (const t of Nav.TIERS) {
      const j = Nav.parseJudgement(T.fitJudgement(S.judgeFixture(text, n), n, t), text, n, t);
      assert.ok(j, `${ex.label} ${t}`);
      assert.deepEqual(j.criteria.map((c) => c.text), Nav.criteriaFor(n, t).map((c) => c.text), `${ex.label} ${t}`);
    }
  }
  for (const s of Nav.STAGES) for (const t of Nav.TIERS) assert.equal(T.fit(S.answers[s.n], s.n, t).length, Nav.criteriaFor(s.n, t).length, `답 ${s.n}단계 ${t}`);
  const raw = S.judgeFixture(S.examples[0].text, 2);
  T.fitJudgement(raw, 1, "Lite");
  assert.equal(raw.criteria.length, Nav.STAGES[2].criteria.length, "원본은 안 바뀐다");
});

test("등급 바꾸기: 이미 본 결과는 글자로 맞춰 옮기고, 새로 생긴 할 일은 '아직'으로 둔다 — 원본은 안 바뀐다", () => {
  const full = { stage: 1, reason: "r", next: null, criteria: Nav.criteriaFor(1, "Full").map((c, i) => ({ text: c.text, term: c.term, met: i % 2 === 0, evidence: i % 2 === 0 ? "근거" : "" })) };
  const lite = T.refit(full, "Lite");
  assert.deepEqual(lite.criteria.map((c) => c.text), Nav.criteriaFor(1, "Lite").map((c) => c.text));
  assert.deepEqual(lite.criteria.map((c) => c.met), [true, true]);
  const back = T.refit(lite, "Full");
  assert.deepEqual(back.criteria.map((c) => c.met), [false, false, true, false, true]);
  assert.equal(full.criteria.length, 5);
  assert.equal(lite.reason, "r");
});

test("만드는 크기 이름: 서버가 아는 등급 셋이고, 화면 이름은 쉬운 말이다", () => {
  assert.deepEqual(T.LABELS.map(([v]) => v).sort(), [...Nav.TIERS].sort());
  assert.deepEqual(T.LABELS.map(([, l]) => l), ["작게", "보통", "크게"]);
  for (const [v] of T.LABELS) assert.ok(G.explain(v), v);
});
