// claude-drafted: 2026-10-14
// 실행: node --test 04-tests/navigator/navigator.test.js  (Node 24는 폴더가 아니라 파일 경로를 줘야 한다)
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Nav = require("../../03-backend/navigator/navigator.js");
const S = require("../../03-backend/navigator/scenario.js");
const Cat = require("../../02-frontend/navigator/seal.js");
// 확인 값 파일은 시험용 임시 파일로 — 사용자의 홈 폴더 파일을 건드리지 않는다
process.env.NAV_EVENT_TOKEN_FILE = process.env.NAV_EVENT_TOKEN_FILE || path.join(require("node:os").tmpdir(), `nav-test-token-${process.pid}`);
const { allowed, recent, addEvent, handle, eventToken } = require("../../03-backend/navigator/server.js");
const Connect = require("../../03-backend/navigator/connect.js");
const BACK = path.join(__dirname, "../../03-backend/navigator");
const FRONT = path.join(__dirname, "../../02-frontend/navigator");

test("단계 0~7이 순서대로 있고 단계마다 할 일이 있다", () => {
  assert.deepEqual(Nav.STAGES.map((s) => s.n), [0, 1, 2, 3, 4, 5, 6, 7]);
  for (const s of Nav.STAGES) assert.ok(s.criteria.length > 0, s.name);
});

// 비개발자 대상 — 크게 보이는 말에 전문 용어가 없어야 한다. 용어는 term 칸에만.
const jargonIn = (text) => Nav.JARGON.filter((w) => String(text).includes(w));

test("쉬운 말: 단계 이름·설명·할 일에 전문 용어가 없다", () => {
  for (const s of Nav.STAGES) {
    for (const t of [s.title, s.short, s.gets, s.does, s.gives, ...s.criteria.map((x) => x.text)]) {
      assert.deepEqual(jargonIn(t), [], `${s.n}단계: ${t}`);
    }
  }
});

test("쉬운 말: 연습 예시의 안내·선택지와 미리 만든 답에 전문 용어가 없다", () => {
  for (const ex of S.examples) {
    const j = ex.judgement;
    for (const t of [ex.label, ex.text || "", j.reason, ...Object.values(j.next).flat(), ...j.criteria.map((x) => x.evidence)]) {
      assert.deepEqual(jargonIn(t), [], t);
    }
  }
  for (const a of Object.values(S.answers).flat()) assert.deepEqual(jargonIn(a), [], a);
});

test("쉬운 말: 화면 파일(index.html·app.js·seal.js)에 전문 용어가 없다 (주석 제외)", () => {
  for (const f of ["index.html", "app.js", "seal.js"]) {
    const code = fs.readFileSync(path.join(FRONT, f), "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.deepEqual(jargonIn(code), [], f);
  }
});

test("쉬운 말: 플로로의 말풍선에 전문 용어가 없다", () => {
  const says = Object.keys({ ask: 1, which: 1, question: 1, plan: 1, next: 1 }).map((step) => Nav.face({ gate: true, step })[1]);
  says.push(Nav.face({ busy: true })[1], Nav.face({ warn: ["x"] })[1], Nav.face({ error: "x" })[1], Nav.face({})[1], Nav.face({ reason: "r", allDone: true })[1]);
  for (const t of says) assert.deepEqual(jargonIn(t), [], t);
});

test("집중: 플로로 말풍선(미리 만든 말·연습 예시의 설명)은 한 번에 읽히는 길이다", () => {
  const says = ["ask", "which", "question", "plan", "next"].map((step) => Nav.face({ gate: true, step })[1]);
  says.push(Nav.face({ busy: true })[1], Nav.face({ warn: ["x"] })[1], Nav.face({ error: "x" })[1], Nav.face({})[1], Nav.face({ reason: "r", allDone: true })[1]);
  for (const ex of S.examples) says.push(ex.judgement.reason);
  for (const t of says) assert.ok(t.length <= Nav.SAY_MAX, `${t.length}자: ${t}`);
  assert.ok(Nav.judgePrompt("x", 0).includes(`${Nav.SAY_MAX}자 안쪽`), "AI에게도 같은 길이를 알려 준다");
});

test("nextView: 띠 → 한 줄 → 펼침, 시간이 지나면 한 칸씩 접힌다 (CouCou 방식)", () => {
  assert.equal(Nav.nextView("hidden", "enter", false), "petit");
  assert.equal(Nav.nextView("petit", "click", false), "home");
  assert.equal(Nav.nextView("greet", "idle", false), "petit");
  assert.equal(Nav.nextView("home", "idle", false), "petit");
  assert.equal(Nav.nextView("petit", "idle", false), "hidden");
  assert.equal(Nav.nextView("home", "esc", false), "petit");
});

test("nextView: 답을 기다리는 중이면 저절로 접히지 않고, 알릴 일은 어디서든 펼친다", () => {
  assert.equal(Nav.nextView("home", "idle", true), "home");
  assert.equal(Nav.nextView("petit", "idle", true), "petit");
  for (const v of ["hidden", "petit", "greet", "home"]) assert.equal(Nav.nextView(v, "alert", false), "home");
});

test("nextPlace(C-13, 2026-10-20): 모드는 접힘과 따로 — 접히고 펼쳐져도 바뀌지 않는다(자세한 것은 modes.test.js)", () => {
  assert.equal(Nav.nextPlace("vibe", "fold"), "vibe");
  assert.equal(Nav.nextPlace("vibe", "home"), "base");
  assert.equal(Nav.nextPlace("base", "vibe"), "vibe");
});

test("face: 살펴보는 중 > 잠깐! > 오류 > 확인 화면 > 시작 > 다 했어요 > 평소 순서로 표정이 정해진다", () => {
  assert.equal(Nav.face({ busy: true, warn: ["x"], error: "e", gate: true, reason: "r" })[0], "look");
  assert.equal(Nav.face({ warn: ["x"], error: "e", gate: true })[0], "alert");
  assert.equal(Nav.face({ error: "e", gate: true, step: "next" })[0], "think");
  assert.deepEqual(Nav.face({ gate: true, step: "ask" })[0], "done");
  assert.deepEqual(Nav.face({ gate: true, step: "next" })[0], "happy");
  assert.equal(Nav.face({})[0], "idle", "아직 보여 준 게 없음");
  assert.equal(Nav.face({ reason: "r", allDone: true })[0], "done");
  assert.deepEqual(Nav.face({ reason: "잘 써 두셨어요" }), ["idle", "잘 써 두셨어요"]);
  for (const m of [...new Set(["ask", "which", "question", "plan", "next"].map((step) => Nav.face({ gate: true, step })[0]))]) {
    assert.ok(Cat.MOODS.includes(m), `플로로에게 없는 표정: ${m}`);
  }
});

test("ticker: 방금 한 일 / 지금 할 일 / 그다음", () => {
  const j = Nav.parseJudgement(S.examples[0].judgement, S.examples[0].text, 2);
  const t = Nav.ticker(j, null, "");
  assert.equal(t.done, Nav.STAGES[2].criteria[0].text);
  assert.equal(t.now, j.next.what, "지금 할 일은 AI가 고른 것");
  assert.equal(t.after, Nav.STAGES[2].criteria[2].text);
  const mine = Nav.ticker({ ...j, next: null }, ["나", "가"], "");
  assert.deepEqual([mine.now, mine.after], ["나", "가"], "사용자가 정한 순서를 따른다");
  const done = Nav.ticker(Nav.parseJudgement(S.examples[1].judgement, S.examples[1].text, 2), null, "");
  assert.equal(done.after, "4단계 만드는 방법 고르기", "화면처럼 1 ~ 8로(F-128 — 코드 단계 3)");
});

test("canAdvance: 완료 기준을 다 채우고 '예'일 때만 다음 단계로", () => {
  assert.equal(Nav.canAdvance([true, true], "yes"), true);
  assert.equal(Nav.canAdvance([true, false], "yes"), false, "기준 하나 미충족");
  assert.equal(Nav.canAdvance([true, true], "no"), false, "이해 '아니요'");
  assert.equal(Nav.canAdvance([true, true], null), false, "아직 안 물음");
  assert.equal(Nav.canAdvance([], "yes"), false, "기준이 없으면 넘어가지 않음");
});

test("reorder: 사용자가 정한 대로 한 칸 옮기고, 끝에서는 그대로, 원본은 안 바뀜", () => {
  const a = ["가", "나", "다"];
  assert.deepEqual(Nav.reorder(a, 2, -1), ["가", "다", "나"]);
  assert.deepEqual(Nav.reorder(a, 0, -1), a);
  assert.deepEqual(Nav.reorder(a, 2, 1), a);
  assert.deepEqual(a, ["가", "나", "다"]);
});

test("parseJudgement: 연습 예시의 응답은 모두 통과하고 할 일 문장은 우리 데이터로 채워진다", () => {
  for (const ex of S.examples) {
    const j = Nav.parseJudgement(ex.judgement, ex.text, ex.judgement.stage);
    assert.ok(j, ex.label);
    assert.deepEqual(j.criteria.map((c) => c.text), Nav.STAGES[ex.judgement.stage].criteria.map((c) => c.text));
    assert.ok(j.next.options.length >= 2 && j.next.options.length <= 4, ex.label);
  }
});

test("parseJudgement: 모양이 틀린 Claude 응답은 버린다(살펴보지 못함)", () => {
  const ok = S.examples[0].judgement;
  const bad = [
    null, "문자열", {},
    { ...ok, criteria: ok.criteria.slice(1) },
    { ...ok, criteria: [{ met: "yes" }, ...ok.criteria.slice(1)] },
    { ...ok, reason: " " },
    { ...ok, next: { ...ok.next, question: "" } },
    { ...ok, next: { ...ok.next, options: ["하나뿐"] } },
    { ...ok, next: { ...ok.next, options: ["가", "나", "다", "라", "마"] } },
    { ...ok, next: { ...ok.next, options: ["가", " "] } },
    { ...ok, next: { ...ok.next, options: "가/나" } },
  ];
  for (const b of bad) assert.equal(Nav.parseJudgement(b, S.examples[0].text, 2), null, JSON.stringify(b));
  for (const n of [9, 1.5, -1, undefined]) assert.equal(Nav.parseJudgement(ok, S.examples[0].text, n), null, `단계 ${n}`);
});

// 판정 규칙 ①(navigator-prototype-rules-review.md 4절): 근거 구절이 사용자 글에 실제로 있어야만 '했다'로 친다
test("parseJudgement: 지어낸 근거를 주면 거부된다 — 글에 없는 구절·빈 근거로는 '했다'가 되지 않는다", () => {
  const ex = S.examples[0], raw = JSON.parse(JSON.stringify(ex.judgement));
  raw.criteria[1] = { met: true, evidence: "30초 안에 제출" };          // 연습 1 글에는 없는 구절
  raw.criteria[2] = { met: true, evidence: "" };                        // 근거 없이 '했다'
  raw.criteria[3] = { met: true, evidence: "필요한  기능을\n6개" };      // 띄어쓰기·줄바꿈만 다른 실제 구절
  const j = Nav.parseJudgement(raw, ex.text, 2);
  assert.deepEqual(j.criteria.map((c) => c.met), [true, false, false, true, false]);
  assert.equal(j.criteria[1].evidence, "", "지어낸 구절은 화면에 보이지 않는다");
  assert.equal(Nav.parseJudgement(raw, "", 2).criteria.some((c) => c.met), false, "글이 없으면 아무것도 '했다'가 아니다");
});

test("가상 시나리오: 연습 장면의 근거 구절은 모두 그 장면의 글에 실제로 있다", () => {
  for (const ex of S.examples) {
    const base = ex.from !== undefined ? S.examples[ex.from] : ex, q = base.judgement.next;
    const text = ex.from !== undefined ? `${base.text}\n${Nav.decisionLine(q.question, q.options[0])}` : ex.text;
    const j = Nav.parseJudgement(ex.judgement, text, ex.judgement.stage);
    assert.deepEqual(j.criteria.map((c) => c.met), ex.judgement.criteria.map((c) => c.met), ex.label);
  }
});

test("parseJudgement: Claude가 보낸 선택지 목록을 바꿔도 우리 쪽 결과는 그대로다", () => {
  const raw = JSON.parse(JSON.stringify(S.examples[0].judgement));
  const j = Nav.parseJudgement(raw, S.examples[0].text, 2);
  raw.next.options.push("나중에 끼어든 것");
  assert.equal(j.next.options.length, 3);
});

test("가상 시나리오: 보완 전은 못 넘어가고, 보완 후는 '예'면 넘어간다", () => {
  const met = (i) => S.examples[i].judgement.criteria.map((c) => c.met);
  assert.equal(Nav.canAdvance(met(0), "yes"), false);
  assert.equal(Nav.canAdvance(met(1), "yes"), true);
});

test("가상 시나리오: 미리 만든 응답에 없는 입력은 살펴보지 않는다", () => {
  assert.equal(S.judgeFixture("아무 글", 2), null);
  assert.ok(S.judgeFixture(S.examples[1].text + "\n", 2));
  assert.equal(S.judgeFixture(S.examples[1].text, 0), null, "다른 단계의 장면은 고르지 않는다");
});

test("가상 시나리오: 연습 1에서 선택지를 하나 고르면 '하나 정함' 장면(2/5)으로 간다", () => {
  const base = S.examples[0], q = base.judgement.next;
  for (const o of q.options) {
    const j = S.judgeFixture(`${base.text}\n${Nav.decisionLine(q.question, o)}`, 2);
    assert.ok(j, o);
    assert.equal(j.criteria.filter((c) => c.met).length, 2);
  }
  assert.equal(S.judgeFixture(`${base.text}\n${Nav.decisionLine(q.question, "목록에 없는 답")}`, 2), null);
  assert.equal(S.examples.filter((e) => !e.hidden && e.judgement.stage === 2).length, 2, "2단계 버튼으로 보이는 연습은 두 개");
});

test("미리 만든 답은 0~7단계마다 할 일과 개수가 같다", () => {
  for (let n = 0; n <= 7; n++) assert.equal((S.answers[n] || []).length, Nav.STAGES[n].criteria.length, `${n}단계`);
});

test("가상 시나리오: 2단계 밖의 0~7단계마다 '하는 중'은 못 넘어가고, 선택지를 고르면 '다 했어요'가 되어 넘어갈 수 있다", () => {
  assert.equal(S.first.judgement.stage, 0, "시연은 0단계에서 시작");
  for (const n of [0, 1, 3, 4, 5, 6, 7]) {
    const shown = S.examples.filter((e) => !e.hidden && e.judgement.stage === n);
    assert.equal(shown.length, 1, `${n}단계 버튼 하나`);
    const base = shown[0], q = base.judgement.next;
    assert.equal(Nav.canAdvance(base.judgement.criteria.map((c) => c.met), "yes"), false, `${n}단계 하는 중`);
    for (const o of q.options) {
      const text = `${base.text}\n${Nav.decisionLine(q.question, o)}`;
      const j = Nav.parseJudgement(S.judgeFixture(text, n), text, n);
      assert.ok(j && j.stage === n, `${n}단계: ${o}`);
      assert.equal(Nav.canAdvance(j.criteria.map((c) => c.met), "yes"), true, `${n}단계: ${o}`);
    }
  }
});

// 판정 규칙 ②(rules-review 4절, 두승현 결정 2026-10-16): 지금 단계는 코드가 정한다 — 게이트를 통과한 다음 단계. AI는 그 단계만 본다
test("parseJudgement: AI가 다른 단계를 말해도 코드가 넘긴 단계로 판정한다", () => {
  const ex = S.examples[0], raw = { ...ex.judgement, stage: 5 };
  assert.equal(Nav.parseJudgement(raw, ex.text, 2).stage, 2);
  assert.deepEqual(Nav.parseJudgement(raw, ex.text, 2).criteria.map((c) => c.text), Nav.STAGES[2].criteria.map((c) => c.text));
  assert.ok(!("stage" in Nav.JUDGE_SCHEMA.properties), "AI에게 단계를 묻지 않는다");
});

test("judgePrompt: 코드가 정한 단계와 그 할 일, 사용자 글이 들어가고, 고른 줄을 읽는 법을 알려 준다", () => {
  const p = Nav.judgePrompt("동아리 앱", 3);
  assert.ok(p.includes("3단계 \"만드는 방법 고르기\""));
  for (const c of Nav.STAGES[3].criteria) assert.ok(p.includes(c.text), c.text);
  assert.ok(!p.includes(Nav.STAGES[5].title), "다른 단계는 판정하지 않는다");
  assert.ok(p.includes("동아리 앱"));
  assert.ok(p.includes("로 정했어요."));
});

// 판정 규칙 ③·④(rules-review 4절) — 확정 후보 2026-10-18, 이재엽 확인 대기
// ③ 빠진 할 일: 3단계 흔히 쓰는 방법 목록·원칙 대조, 5단계 막을 일 일부러 어겨 보기, 1~7단계 보안 점검 한 줄(checklist.md)
test("판정 규칙 ③: 3단계에 흔히 쓰는 방법 목록·원칙 대조가, 5단계에 일부러 어겨 보기가, 1~7단계마다 보안 점검이 있다", () => {
  const terms = (n) => Nav.STAGES[n].criteria.map((c) => c.term).join(" | ");
  for (const t of [/표준 카탈로그/, /원칙표/, /화면 원칙/]) assert.match(terms(3), t);
  for (const t of [/Unwanted/, /위반 시도/]) assert.match(terms(5), t);
  for (let n = 1; n <= 7; n++) assert.ok(Nav.STAGES[n].criteria.some((c) => c.term.startsWith("보안 점검")), `${n}단계 보안 점검`);
});

test("판정 규칙 ③: 등급마다 단계의 할 일은 1~5개다 — 한 번에 볼 수 있는 만큼", () => {
  for (const s of Nav.STAGES) for (const t of Nav.TIERS) {
    const n = Nav.criteriaFor(s.n, t).length;
    assert.ok(n >= 1 && n <= 5, `${s.n}단계 ${t}: ${n}개`);
  }
});

// ④ 등급별 할 일 — tiers가 없으면 모든 등급. 등급 이름은 scope-tiers.md
test("판정 규칙 ④: 등급은 Full·Xpress·Lite이고, 할 일에 단 등급은 모두 아는 이름이다", () => {
  assert.deepEqual(Nav.TIERS, ["Full", "Xpress", "Lite"]);
  for (const s of Nav.STAGES) for (const c of s.criteria) if ("tiers" in c) {
    assert.ok(c.tiers.length > 0 && c.tiers.every((t) => Nav.TIERS.includes(t)), `${s.n}단계: ${c.text}`);
  }
});

test("판정 규칙 ④: Lite·Xpress 등급이면 5단계에 '일부러 어겨 보기'가 없고, Full에는 있다", () => {
  const has = (t) => Nav.criteriaFor(5, t).some((c) => c.text.includes("일부러 어겨"));
  assert.deepEqual([has("Full"), has("Xpress"), has("Lite")], [true, false, false]);
  assert.ok(Nav.judgePrompt("동아리 앱", 5, "Full").includes("일부러 어겨"));
  assert.ok(!Nav.judgePrompt("동아리 앱", 5, "Lite").includes("일부러 어겨"), "AI에게도 묻지 않는다");
});

test("판정 규칙 ④: 등급을 안 주거나 모르는 등급이면 Full과 같다 — Full은 STAGES의 할 일 전부", () => {
  for (const s of Nav.STAGES) {
    assert.deepEqual(Nav.criteriaFor(s.n, "Full"), s.criteria, `${s.n}단계: 등급 없이 STAGES를 쓰는 화면도 그대로 맞는다`);
    for (const t of [undefined, null, "엉뚱", "full"]) assert.deepEqual(Nav.criteriaFor(s.n, t), s.criteria, `${s.n}단계 ${t}`);
  }
  assert.equal(Nav.judgePrompt("x", 5), Nav.judgePrompt("x", 5, "Full"));
  assert.equal(Nav.draftPrompt(1, "x"), Nav.draftPrompt(1, "x", "Full"));
  assert.deepEqual(Nav.criteriaFor(9, "Full"), [], "없는 단계");
});

test("판정 규칙 ④: 등급에 맞는 할 일 개수만 받는다 — Lite 5단계 응답에 Full 개수를 주면 버린다", () => {
  const lite = Nav.criteriaFor(5, "Lite"), full = Nav.criteriaFor(5, "Full"), text = "확인할 방법부터 정하고 만들었어요";
  assert.ok(lite.length < full.length);
  const raw = (n) => ({ reason: "r", criteria: Array.from({ length: n }, (_, i) => ({ met: i === 0, evidence: i === 0 ? text : "" })),
    next: { what: "w", why: "y", question: "q", options: ["가", "나"], action: "a" } });
  const j = Nav.parseJudgement(raw(lite.length), text, 5, "Lite");
  assert.deepEqual(j.criteria.map((c) => c.text), lite.map((c) => c.text));
  assert.deepEqual(j.criteria.map((c) => c.met), lite.map((_, i) => i === 0));
  assert.equal(Nav.parseJudgement(raw(full.length), text, 5, "Lite"), null);
  assert.equal(Nav.parseJudgement(raw(lite.length), text, 5), null, "등급이 없으면 Full 개수를 받는다");
  assert.ok(Nav.parseJudgement(raw(full.length), text, 5));
  assert.ok(Nav.judgePrompt(text, 5, "Lite").includes(`같은 개수(${lite.length}개)`));
});

test("판정 규칙 ④: 설계도 초안·다시 보기 요청에도 그 등급의 할 일만 넣는다", () => {
  const prd = Nav.STAGES[1].criteria.find((c) => c.term === "PRD").text;
  assert.ok(Nav.draftPrompt(1, "동아리 앱").includes(prd));
  assert.ok(!Nav.draftPrompt(1, "동아리 앱", "Xpress").includes(prd));
  assert.ok(Nav.reviewPrompt(1, "동아리 앱", "1. 신청", "Full").includes(prd));
  assert.ok(!Nav.reviewPrompt(1, "동아리 앱", "1. 신청", "Lite").includes(prd));
});

test("서버: 모르는 등급을 보내면 AI를 부르지 않고 거절한다 (즉시 처리는 밟을 단계가 없다)", async () => {
  assert.equal(typeof handle, "function", "server.js가 요청 처리기를 내보낸다");
  const http = require("node:http");
  const srv = http.createServer(handle);
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const host = `127.0.0.1:${Number(process.env.NAV_PORT) || 4317}`;   // allowed()가 보는 주소
  const post = (url, body) => new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: "127.0.0.1", port: srv.address().port, path: url, method: "POST",
      headers: { host, "content-type": "application/json", "content-length": Buffer.byteLength(data), "x-nav-token": eventToken() } },   // F-04: AI 주소도 확인 값
    (res) => { let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => resolve([res.statusCode, JSON.parse(b)])); });
    req.on("error", reject);
    req.end(data);
  });
  try {
    for (const url of ["/api/judge", "/api/answer", "/api/draft", "/api/review"]) {
      for (const tier of ["Huge", "full", "즉시처리", 3, ""]) {
        const got = await post(url, { text: "동아리 앱", stage: 2, question: "q", doc: "1. 신청", tier });
        assert.deepEqual(got, [400, { ok: false, reason: "모르는 등급" }], `${url} ${JSON.stringify(tier)}`);
      }
    }
  } finally { srv.close(); }
});

test("플로로: 표정 이름이 그림에 들어가고, 작으면 입을 빼고, 모르는 표정은 기본으로", () => {
  assert.match(Cat.svg("done", 64), /class="cat m-done"/);
  assert.match(Cat.svg("idle", 28), /class="cat m-idle small"/);
  assert.match(Cat.svg("없는표정", 64), /m-idle/);
  // 얼굴만(접힌 알약): 얼굴 쪽만 보이고, 머리 밖 표시(s-)는 없다
  const face = Cat.svg("idle", 36, { face: true });
  assert.match(face, /class="cat m-idle face" width="36" height="36" viewBox="18 8 64 64"/);
  assert.doesNotMatch(face, /class="s-/);
  // 숨구멍: 표정 동작(seal.css)이 붙도록 hole 표시가 있고, 머리 밖 표시는 내려간 머리를 따라 함께 내려간다
  const hole = Cat.svg("think", 64, { hole: true });
  assert.match(hole, /class="cat m-think hole"/);
  assert.match(hole, /<g transform="translate\(-2 12\)">\s*<g class="s-dots"/);
});

test("플로로: 눈은 커서 쪽으로 가되 7칸을 넘지 않고, 커서가 가까우면 조금만 움직인다", () => {
  const far = Cat.gaze(1000, 0), near = Cat.gaze(22, 0), still = Cat.gaze(0, 0);
  assert.ok(Math.abs(far.x - 7) < 1e-9 && far.y === 0);
  assert.ok(near.x > 0 && near.x < 1);
  assert.deepEqual([still.x, still.y], [0, 0]);
});

test("플로로: 창 밖 커서로는 미끄러져 간다 — 80ms에 남은 거리의 63%, 0.5px 안이면 딱 맞추고 끝, 처음이면 바로 (F-27)", () => {
  const to = { x: 100, y: 0 };
  assert.deepEqual(Cat.glide(null, to, 16), { x: 100, y: 0, done: true }, "처음(from 없음)은 바로");
  const a = Cat.glide({ x: 0, y: 0 }, to, 80);
  assert.ok(Math.abs(a.x - 63.2) < 0.1 && a.y === 0 && !a.done, JSON.stringify(a));
  assert.ok(Cat.glide({ x: 0, y: 0 }, to, 40).x < a.x, "짧은 프레임은 덜 간다");
  assert.deepEqual(Cat.glide({ x: 0, y: 0 }, to, 0), { x: 0, y: 0, done: false }, "시간이 안 흘렀으면 그대로");
  assert.deepEqual(Cat.glide({ x: 0, y: 0 }, to, 5000), { x: 100, y: 0, done: true }, "오래 걸렸으면 목표에");
  assert.deepEqual(Cat.glide({ x: 99.8, y: 0.2 }, to, 16), { x: 100, y: 0, done: true }, "0.5px 안이면 딱 맞추고 끝");
  let p = { x: 0, y: 0 }, n = 0;
  while (!(p = Cat.glide(p, to, 16)).done) n++;
  assert.ok(n > 10 && n < 40, `60fps에서 ${n}프레임 만에 닿는다(약 0.3초)`);
});

test("플로로: 고개를 돌리면 얼굴이 그쪽으로 가며 가로로 좁아지고, 가운데를 보면 그대로다", () => {
  assert.deepEqual(Cat.turn({ x: 0, y: 0 }), { x: 0, y: 0, sx: 1, sy: 1 });
  const right = Cat.turn(Cat.gaze(1000, 0)), down = Cat.turn(Cat.gaze(0, 1000));
  assert.ok(right.x > 9 && right.x < 11 && right.sx < 1 && right.sx > 0.9, JSON.stringify(right));
  assert.ok(down.y > 0 && down.sy < 1 && down.x === 0);
  assert.equal(Cat.turn(Cat.gaze(-1000, 0)).x, -right.x);
  // 마리마다 그러데이션 이름이 달라야 한 화면의 여러 마리가 서로의 그늘을 빌려 쓰지 않는다
  const ids = [Cat.svg("idle", 64), Cat.svg("idle", 64)].map((s) => s.match(/radialGradient id="(\w+)v"/)[1]);
  assert.notEqual(ids[0], ids[1]);
});

// ── 플로로와 교감 — 2026-10-15 "캐릭터와 교감 요소를 많이" (2026-10-15 고양이 나비 → 물범 플로로) ──
test("플로로 장식(F-148): 뽑기의 모든 물건이 머리 그룹 안에 자기 자리로 그려져 플로로와 같이 움직이고, 모르는 것은 뺀다", () => {
  const { ITEMS } = require("../../03-backend/navigator/quest.js");
  for (const it of ITEMS) {
    const s = Cat.svg("idle", 108, { hole: true, wear: [it.id] });
    assert.match(s, new RegExp(`w-move w-${it.slot}`), it.id);
    assert.ok(s.indexOf('class="c-head"') < s.indexOf('class="c-wear"') && s.indexOf('class="c-wear"') < s.indexOf("h-line") , `${it.id} — 머리 그룹 안, 물 띠보다 앞`);
    assert.doesNotMatch(s, new RegExp(it.emoji), `${it.id} — 이모지가 아니라 그림`);
  }
  assert.doesNotMatch(Cat.svg("idle", 108, { hole: true }), /c-wear/, "안 입으면 없다");
  assert.doesNotMatch(Cat.svg("idle", 108, { hole: true, wear: ["없는것"] }), /c-wear/, "모르는 것은 뺀다");
  const css = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/seal.css"), "utf8");
  const moving = css.slice(css.indexOf("prefers-reduced-motion: no-preference"), css.indexOf("F-46(2026-10-20)"));
  assert.match(moving, /\.w-move/, "장식의 움직임은 '움직임 줄이기'를 켠 사람에게 하지 않는다");
  assert.match(moving, /\.landing \.w-move/, "받는 순간");
});

test("플로로 열중(F-154): Claude Code가 일하는 동안의 표정 — 내리깐 눈으로 노트북에 코드를 친다(번갈아 치는 지느러미 · 끄덕임 · 떠오르는 코드 글자), 움직임 줄이기면 멈춘다", () => {
  assert.ok(Cat.MOODS.includes("work"));
  assert.match(Cat.svg("work", 108, { hole: true }), /class="cat m-work hole"/);
  assert.match(Cat.svg("work", 108), /class="e-work"/);
  const hole = Cat.svg("work", 108, { hole: true, wear: ["scarf"] });
  assert.ok(hole.indexOf('class="c-wear"') < hole.indexOf('class="c-lap"') && hole.indexOf('class="c-lap"') < hole.indexOf("h-line"), "노트북은 목도리 앞, 물 띠 뒤");
  assert.match(hole, /class="s-code"/, "머리 위 코드 글자");
  const css = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/seal.css"), "utf8");
  assert.match(css, /\.m-work \.e-work/, "눈");
  assert.match(css, /\.cat \.c-lap\{display:none\}/, "노트북은 평소에 보이지 않는다");
  assert.match(css, /\.m-work \.c-lap,\.m-work \.s-code\{display:inline\}/, "열중일 때만 노트북 · 코드 글자");
  assert.match(css, /\.m-work \.c-fin\{display:none\}/, "가슴의 지느러미 선 대신 타이핑하는 지느러미");
  assert.match(css, /\.small \.c-lap/, "아주 작으면 노트북을 뺀다");
  const moving = css.slice(css.indexOf("prefers-reduced-motion: no-preference"), css.indexOf("F-46(2026-10-20)"));
  for (const part of [/\.m-work \.lap-l \{[^}]*work-tap/, /\.m-work \.lap-r \{[^}]*work-tap[^}]*animation-delay|\.m-work \.lap-r \{[^}]*work-tap/, /\.m-work \.c-body[^{]*\{[^}]*work-nod/, /\.m-work \.s-code text \{[^}]*work-code/]) assert.match(moving, part);
  const app = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  assert.match(app, /const liveMood = \(base\) => \(flashMood\.until > Date\.now\(\) \? flashMood\.mood : working\(\) && CALM\.includes\(base\) \? "work" : sleepState/, "일하는 동안은 편한 표정 · 졸음 대신 열중");
  assert.match(app, /if \(isPhone\(\) \|\| st\.busy\) return;\n\s*if \(working\(\)\) activity\(\);/, "일하는 동안은 졸거나 헤엄치지 않는다");
  assert.match(app, /const was = aiLatest, busy = working\(\); await pollSteps\(\); if \(working\(\) !== busy \|\| \(st\.ui === "home" && aiLatest !== was\)\) render\(\);/, "접혀 있어도 알아채고, 일이 끝나면 새 줄이 없어도 다시 그린다");
  assert.match(app, /if \(s === "running"\) return \{ tone: "gray", mood: "work", meta,/, "맡긴 일이 도는 카드도 열중");
});

test("플로로 표정 바뀜(F-154): 바뀐 직후의 그림에만 mood-in · from-표정을 붙여 한 번만 움직이고, 노트북은 물에서 올라와 열리고 끝나면 닫혀 내려간다", () => {
  const app = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  const src = /const moodIn = \(m, size\) => \{[^\n]*\n/.exec(app);
  assert.ok(src, "moodIn");
  let now = 1000; const realNow = Date.now; Date.now = () => now;
  try {
    const moodIn = new Function(`const moodSeen = {}; ${src[0]}; return moodIn;`)();
    assert.equal(moodIn("idle", 150), "", "처음 그릴 때는 움직이지 않는다");
    assert.equal(moodIn("idle", 150), "", "표정이 그대로면 다시 그려도 움직이지 않는다");
    assert.equal(moodIn("work", 150), "mood-in from-idle", "바뀌면");
    now += 500; assert.equal(moodIn("work", 150), "mood-in from-idle", "움직임이 끝나기 전에 다시 그려도 잃지 않는다");
    now += 500; assert.equal(moodIn("work", 150), "", "끝나면 뺀다 — 2초마다 다시 그려도 노트북이 또 올라오지 않는다");
    assert.equal(moodIn("look", 92), "", "크기가 다른 플로로(설정 창)는 따로 센다");
    assert.equal(moodIn("work", 150), "", "그쪽 때문에 이쪽이 바뀐 것으로 보지 않는다");
    assert.equal(moodIn("idle", 150), "mood-in from-work", "돌아갈 때");
  } finally { Date.now = realNow; }
  assert.match(app, /cat\(m, size, \{ extra: \[extra, moodIn\(m, size\)\]\.filter\(Boolean\)\.join\(" "\), hole: true, wear: Object\.values\(st\.wear\) \}\)/, "플로로 그림에 붙인다");
  assert.match(app, /replace\(\/\\s\*\(mood-in\|from-\[a-z\]\+\)\/g, ""\)/, "표정만 바꿀 때도 옛 표시를 지운다");
  const css = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/seal.css"), "utf8");
  const moving = css.slice(css.indexOf("prefers-reduced-motion: no-preference"), css.indexOf("F-46(2026-10-20)"));
  for (const part of [/\.mood-in\.m-work \.c-lap \{[^}]*lap-rise/, /\.mood-in\.m-work \.lap-top \{[^}]*lap-open/, /\.mood-in\.from-work:not\(\.m-work\):not\(\.small\) \.c-lap \{[^}]*display: inline;[^}]*lap-sink/, /\.mood-in\.from-work:not\(\.m-work\):not\(\.small\) \.lap-top \{[^}]*lap-close/, /\.mood-in \.c-eyes>\* \{[^}]*eye-in/]) assert.match(moving, part);
  assert.match(Cat.svg("work", 108), /<g class="lap-top">/, "뚜껑은 한 덩이로 열리고 닫힌다");
});

test("플로로: 안내 화면이 쓰는 표정과 교감 표정이 모두 그림에 있고, 앞지느러미·땀방울을 붙일 수 있다", () => {
  for (const m of ["idle", "happy", "look", "done", "think", "alert", "love", "purr", "sleep", "yawn", "wow"]) {
    assert.ok(Cat.MOODS.includes(m), m);
    assert.match(Cat.svg(m, 64), new RegExp(`class="cat m-${m}"`));
  }
  assert.match(Cat.svg("think", 108, { extra: "oops" }), /class="cat m-think oops"/);
  assert.doesNotMatch(Cat.svg("think", 108), /e-think/, "생각 표정: 한쪽 눈만 사선인 그림을 쓰지 않는다(F-147)");
  assert.match(fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/seal.css"), "utf8"), /\.m-think \.e-dot/, "생각 표정: 두 눈 다 평소 눈(F-147)");
  assert.match(Cat.svg("idle", 36, { paws: true }), /c-paws/);
  assert.doesNotMatch(Cat.svg("idle", 36), /c-paws/);
  assert.match(Cat.svg("idle", 64), /c-tail/, "크면 꼬리");
  assert.doesNotMatch(Cat.svg("idle", 40), /c-tail/, "작으면 꼬리 없음");
});

test("쓰다듬기: 좌우로 네 번 오가면 한 번 쓰다듬은 것, 작게 떨거나 멈췄다 하면 세지 않는다", () => {
  const rub = (xs, gap = 50) => { let s = null, n = 0; xs.forEach((x, i) => { s = Cat.stroke(s, x, i * gap); if (s.petted) n++; }); return n; };
  assert.equal(rub([0, 20, 0, 20, 0, 20]), 1, "네 번 방향을 바꿈");
  assert.equal(rub([0, 20, 0, 20, 0]), 0, "세 번은 아직");
  assert.equal(rub([0, 5, 0, 5, 0, 5, 0, 5, 0]), 0, "12px보다 작게 떠는 건 쓰다듬기가 아님");
  assert.equal(rub([0, 20, 0, 20, 0, 20], 800), 0, "0.7초 넘게 멈추면 처음부터");
  assert.equal(rub([0, 20, 0, 20, 0, 20, 0, 20, 0, 20]), 2, "계속 문지르면 또 센다");
});

test("친해진 정도: 쓰다듬은 횟수로 네 칸, 다음 칸까지 남은 횟수를 안다", () => {
  assert.deepEqual(Cat.bond(0), { level: 0, name: "처음 만난 사이", need: 5 });
  assert.deepEqual(Cat.bond(5), { level: 1, name: "친해지는 중", need: 15 });
  assert.equal(Cat.bond(49).level, 2);
  assert.deepEqual(Cat.bond(50), { level: 3, name: "둘도 없는 단짝", need: 0 });
  assert.equal(Cat.bond(-3).level, 0, "이상한 값은 0으로");
});

test("플로로의 한마디(쓰다듬기·인사)는 짧고 쉬운 말이다", () => {
  const lines = [...Cat.PET_LINES.flat(), ...[0, 6, 12, 16, 20, 23].map(Cat.greeting)];
  for (const t of lines) {
    assert.ok(t.length <= 24, `${t.length}자: ${t}`);
    assert.deepEqual(jargonIn(t), [], t);
  }
  assert.equal(Cat.petLine(0), Cat.PET_LINES[0][0]);
  assert.equal(Cat.petLine(21), Cat.PET_LINES[2][0], "단짝이 되면 단짝의 말");
});

test("인사: 시간에 맞는 말을 한다(경계 포함)", () => {
  assert.equal(Cat.greeting(5), "좋은 아침이에요!");
  assert.equal(Cat.greeting(10), "좋은 아침이에요!");
  assert.equal(Cat.greeting(11), "점심은 드셨어요?");
  assert.equal(Cat.greeting(14), "오후도 같이 힘내요!");
  assert.equal(Cat.greeting(18), "오늘 하루도 수고했어요!");
  assert.equal(Cat.greeting(22), "늦은 밤이네요, 무리하지 마요.");
  assert.equal(Cat.greeting(3), "늦은 밤이네요, 무리하지 마요.");
});

test("졸음: 1분 가만히 있으면 하품, 1분 30초면 잠든다", () => {
  assert.equal(Cat.sleepy(59_999), "awake");
  assert.equal(Cat.sleepy(60_000), "yawn");
  assert.equal(Cat.sleepy(90_000), "sleep");
});

test("서버는 이 컴퓨터의 화면에서 온 요청만 받는다", () => {
  assert.equal(allowed({ host: "127.0.0.1:4317" }, 4317), true);
  assert.equal(allowed({ host: "localhost:4317", origin: "http://localhost:4317" }, 4317), true);
  assert.equal(allowed({ host: "127.0.0.1:4317", origin: "https://evil.example" }, 4317), false, "다른 사이트");
  assert.equal(allowed({ host: "evil.example:4317" }, 4317), false, "DNS 리바인딩");
});

// ── Claude Code 연결 ──
test("연결: 세션마다 사용자의 요청과 Claude의 마지막 답을 차례로 모은다", () => {
  const a1 = addEvent({ hook_event_name: "UserPromptSubmit", session_id: "t-a", cwd: "/work/club-app", prompt: "기능 정리해 줘" });
  assert.deepEqual([a1.kind, a1.project, a1.work], ["prompt", "club-app", "[사용자] 기능 정리해 줘"]);
  addEvent({ hook_event_name: "UserPromptSubmit", session_id: "t-b", prompt: "다른 세션" });
  const a2 = addEvent({ hook_event_name: "Stop", session_id: "t-a", cwd: "/work/club-app", last_assistant_message: "기능 6개를 정리했어요." });
  assert.equal(a2.kind, "stop");
  assert.equal(a2.work, "[사용자] 기능 정리해 줘\n[Claude] 기능 6개를 정리했어요.", "다른 세션 말은 섞이지 않는다");
  assert.ok(a2.seq > a1.seq);
  assert.equal(addEvent({ hook_event_name: "PreToolUse", session_id: "t-a" }), null, "모르는 알림은 받지 않는다");
  assert.equal(addEvent({ hook_event_name: "Stop", session_id: "t-c" }).work, "", "답이 없으면 빈 글");
});

test("연결: 글자 수가 넘치면 오래된 말부터 버린다", () => {
  const cut = recent(["1".repeat(50), "2".repeat(50), "3".repeat(50)], 70);
  assert.equal(cut, "2".repeat(20) + "\n" + "3".repeat(50));
  assert.equal(recent([], 70), "");
});

test("연결: 훅은 네 개만 더하고(2026-10-20 C-12로 PostToolUse, FR-17로 PermissionRequest 추가), 두 번 해도 하나씩이고, 다른 설정·훅은 그대로 둔다", () => {
  const mine = { hooks: [{ type: "command", command: "echo 내 훅" }] };
  const before = { model: "sonnet", hooks: { Stop: [mine] } };
  const once = Connect.addHooks(before), twice = Connect.addHooks(once);
  assert.deepEqual(Object.keys(once.hooks).sort(), ["PermissionRequest", "PostToolUse", "Stop", "UserPromptSubmit"]);
  assert.deepEqual(twice, once, "두 번 해도 같다");
  assert.equal(once.model, "sonnet");
  assert.deepEqual(once.hooks.Stop[0], mine, "원래 있던 훅은 그대로");
  assert.equal(before.hooks.Stop.length, 1, "원본은 안 바뀐다");
  const removed = Connect.removeHooks(once);
  assert.deepEqual(removed, before, "빼면 원래대로");
  assert.deepEqual(Connect.removeHooks({ model: "x" }), { model: "x" });
  assert.deepEqual(Connect.removeHooks(Connect.addHooks({})), {}, "우리 것만 있었으면 hooks 칸까지 지운다");
});

test("연결: 옛 위치(implementations/navigator-prototype)에 단 훅은 다시 연결하면 새 경로로 바뀌고, 빼기로도 빠진다", () => {
  const old = { hooks: [{ type: "command", command: 'node "C:/x/implementations/navigator-prototype/hook.js"', timeout: 5 }] };
  const before = { hooks: { Stop: [old], UserPromptSubmit: [old] } };
  const after = Connect.addHooks(before);
  for (const e of Connect.EVENTS) assert.deepEqual(after.hooks[e].flatMap((g) => g.hooks.map((h) => h.command)), [Connect.COMMAND], e);
  assert.deepEqual(Connect.removeHooks(before), {}, "옛 훅도 우리 것으로 알아본다");
});

test("연결: Navigator 서버가 꺼져 있어도 훅은 Claude Code를 막지 않는다(바로, 조용히, 0으로 끝남)", () => {
  const { spawnSync } = require("node:child_process");
  const input = JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "안녕", cwd: "/x" });
  for (const stdin of [input, "깨진 입력"]) {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [path.join(BACK, "hook.js")], { input: stdin, env: { ...process.env, NAV_PORT: "9" }, timeout: 10_000 });
    assert.equal(r.status, 0);
    assert.equal(r.stdout.toString(), "", "출력이 있으면 Claude에게 전달된다");
    assert.ok(Date.now() - t0 < 5000, `너무 오래 걸림: ${Date.now() - t0}ms`);
  }
});

test("외부 AI(claude·API) 호출은 provider.js 한 곳에서만 한다", () => {
  const callers = [BACK, FRONT].flatMap((dir) => fs.readdirSync(dir).filter((f) => f.endsWith(".js") || f.endsWith(".html"))
    .filter((f) => /child_process|spawn\(|https?:\/\/api\.anthropic\.com|@anthropic-ai\/sdk/.test(fs.readFileSync(path.join(dir, f), "utf8"))));
  // floe.js(2026-10-19, 한 줄로 켜기)도 child_process를 쓰지만 server.js · connect.js · 브라우저를 켤 뿐이다 — AI를 부르는 말이 없는지 따로 본다
  // github.js(2026-10-24, 설정의 GitHub 칸)도 child_process를 쓰지만 git · gh에게 읽기만 묻는다 — 저장소 만들기는 server.js가 일 넘기기(provider.js startTask)로 맡긴다
  // project.js(2026-10-24, C-31 시작하는 자리)도 child_process를 쓰지만 git · gh로 폴더를 가져오기만 한다(clone · 원격 읽기 · 저장소 목록) — 앱(main.js)만 부른다
  // app-parts.js(2026-10-29, 섬 화면 조각 묶기 도구)도 child_process를 쓰지만 git에게 마지막 커밋의 조각을 읽기만 묻는다 — 사람이 명령줄에서 돌린다(화면은 부르지 않는다)
  assert.deepEqual(callers, ["floe.js", "github.js", "project.js", "provider.js", "app-parts.js"]);
  assert.doesNotMatch(fs.readFileSync(path.join(FRONT, "app-parts.js"), "utf8"), /(spawn|execFile)\w*\(\s*["']claude|callClaude|api\.anthropic|ANTHROPIC_API_KEY/i, "app-parts.js는 AI를 부르지 않는다(git 읽기만)");
  assert.doesNotMatch(fs.readFileSync(path.join(BACK, "project.js"), "utf8"), /spawn\(\s*["']claude|callClaude|api\.anthropic|ANTHROPIC_API_KEY/i, "project.js는 AI를 부르지 않는다(git · gh만)");
  assert.doesNotMatch(fs.readFileSync(path.join(BACK, "floe.js"), "utf8"), /claude -p|callClaude|anthropic|ANTHROPIC_API_KEY=/i, "floe.js는 AI를 부르지 않는다(server.js · connect.js · 브라우저만 켠다)");
  assert.doesNotMatch(fs.readFileSync(path.join(BACK, "github.js"), "utf8"), /spawnSync\(\s*["']claude|callClaude|api\.anthropic|ANTHROPIC_API_KEY/i, "github.js는 AI를 부르지 않는다(git · gh만)");
});

// ── 설계도(FR-3) · 기록 · Codex — 2026-10-14 "아직 안 된 것도 모두 만들어" ──
test("설계도: 1~4단계만 설계도가 있고, 이름은 쉬운 말이다", () => {
  assert.deepEqual(Nav.STAGES.filter((s) => s.doc).map((s) => s.n), [1, 2, 3, 4]);
  for (const s of Nav.STAGES.filter((x) => x.doc)) assert.deepEqual(jargonIn(s.doc), [], s.doc);
});

test("설계도: 빈칸 [채워 주세요: …]을 찾아낸다", () => {
  assert.deepEqual(Nav.blanks("마감 [채워 주세요: 몇 시간] 전, [채워 주세요:누구]"), ["몇 시간", "누구"]);
  assert.deepEqual(Nav.blanks("빈칸 없음"), []);
});

test("설계도 연습: 1~4단계 초안마다 빈칸이 남으면 고칠 곳으로 알려 주고, 다 채우면 확정해도 된다고 한다", () => {
  assert.deepEqual(Object.keys(S.drafts).map(Number), Nav.STAGES.filter((s) => s.doc).map((s) => s.n));
  for (const [n, d] of Object.entries(S.drafts)) {
  assert.equal(Nav.blanks(d.draft).length, 3);
  const first = S.reviewFixture(d.draft, n);
  assert.equal(first.ready, false);
  assert.equal(first.fix.length, 3);
  const filled = d.draft.replace(/\[채워 주세요:[^\]]*\]/g, "아직 모름 — 회의 뒤 정함");
  const second = S.reviewFixture(filled, n);
  assert.deepEqual([second.ready, second.fix.length], [true, 0]);
  assert.ok(Nav.parseReview(first) && Nav.parseReview(second), "연습용 결과도 진짜 AI 결과와 같은 모양");
  for (const t of [d.say, first.say, second.say, ...first.good, ...second.good, ...first.fix.map((f) => f.hint), d.draft]) assert.deepEqual(jargonIn(t), [], t);
  }
});

test("설계도: AI의 초안·다시 봐 준 결과는 모양이 맞을 때만 쓰고, 고칠 곳이 있으면 '확정해도 됨'을 믿지 않는다", () => {
  assert.deepEqual(Nav.parseDraft({ draft: "1. 기능", say: "써 봤어요" }), { draft: "1. 기능", say: "써 봤어요" });
  for (const bad of [null, {}, { draft: " ", say: "x" }, { draft: "x" }]) assert.equal(Nav.parseDraft(bad), null);
  const fix = [{ where: "빠르게", why: "애매해요", hint: "숫자로" }];
  assert.equal(Nav.parseReview({ say: "s", good: [], fix, ready: true }).ready, false, "고칠 곳이 있는데 ready=true");
  assert.equal(Nav.parseReview({ say: "s", good: ["a"], fix: [], ready: true }).ready, true);
  assert.equal(Nav.parseReview({ say: "s", good: [], fix: [{ where: "x", why: "", hint: "h" }], ready: false }), null, "빈 칸이 있는 지적");
  assert.equal(Nav.parseReview({ say: "s", good: "a", fix: [], ready: true }), null);
  assert.equal(Nav.parseReview({ say: "s", good: [], fix: [], ready: "yes" }), null);
});

test("설계도: 요청문에 단계·작업 글·빈칸 표시가 들어가고, 다시 봐 줄 때 대신 고쳐 쓰지 않게 한다", () => {
  const d = Nav.draftPrompt(2, "동아리 앱");
  assert.ok(d.includes("꼭 필요한 기능 목록") && d.includes("동아리 앱") && d.includes("[채워 주세요:"));
  assert.ok(d.includes(`${Nav.SAY_MAX}자 안쪽`));
  const r = Nav.reviewPrompt(2, "동아리 앱", "1. 신청");
  assert.ok(r.includes("<설계도>") && r.includes("1. 신청") && r.includes("대신 고쳐 쓰지 않는다"));
});

test("설계도 플로로: 상황마다 말이 짧고 쉬운 말이며, 표정은 플로로에게 있는 것이다", () => {
  const vs = [{ busy: true }, { warn: ["x"] }, { error: "e" }, { review: { ready: true, say: "좋아요" } }, { review: { ready: false, say: "음" } },
    { draftSay: "써 봤어요" }, { done: true }, {}];
  for (const v of vs) {
    const [mood, say] = Nav.docFace(v);
    assert.ok(Cat.MOODS.includes(mood), mood);
    assert.ok(say.length <= Nav.SAY_MAX, say);
    assert.deepEqual(jargonIn(say), [], say);
  }
  assert.equal(Nav.docFace({ busy: true, review: { ready: true, say: "x" } })[0], "look", "읽는 중이 먼저");
});

test("다시 왔을 때 인사: 언제였는지와 몇 개까지 했는지 말하고, 기록이 이상하면 말하지 않는다", () => {
  const j = Nav.parseJudgement(S.examples[0].judgement, S.examples[0].text, 2), now = new Date(2026, 9, 14, 21).getTime();
  const at = (d, h) => new Date(2026, 9, d, h).getTime();
  assert.equal(Nav.welcome({ j, at: at(13, 23) }, now), "어제 3단계 할 일 5개 중 1개까지 하셨어요. 이어서 해요!", "화면처럼 1 ~ 8로(F-128 — 코드 단계 2)");
  assert.match(Nav.welcome({ j, at: at(14, 9) }, now), /^아까 /);
  assert.match(Nav.welcome({ j, at: at(11, 9) }, now), /^3일 전에 /);
  assert.match(Nav.welcome({ j: Nav.parseJudgement(S.examples[1].judgement, S.examples[1].text, 2), at: at(13, 9) }, now), /다 하셨어요/);
  const none = { ...j, criteria: j.criteria.map((c) => ({ ...c, met: false })) };
  assert.equal(Nav.welcome({ j: none, at: at(13, 9) }, now), "어제 3단계를 시작하셨어요. 첫 할 일부터 해 봐요!", "0개까지 하셨어요라고 하지 않는다");
  for (const bad of [null, {}, { j, at: 0 }, { j: { stage: 9, criteria: [] }, at: at(13, 9) }, { j: { stage: 2 }, at: at(13, 9) }]) assert.equal(Nav.welcome(bad, now), "");
  assert.ok(Nav.welcome({ j, at: at(1, 9) }, now).length <= Nav.SAY_MAX);
  assert.deepEqual(Nav.face({ back: "어제 …", reason: "r" }), ["happy", "어제 …"], "돌아온 인사가 평소 말보다 먼저");
  assert.equal(Nav.face({ back: "어제 …", busy: true })[0], "look");
});

test("연결: Codex(GPT) 알림도 받고, 말한 쪽을 Codex로 적고, Claude Code 세션과 섞지 않는다", () => {
  addEvent({ hook_event_name: "UserPromptSubmit", session_id: "same", tool: "codex", cwd: "C:\work\club", prompt: "목록 만들어 줘" });
  const ev = addEvent({ hook_event_name: "Stop", session_id: "same", tool: "codex", cwd: "C:\work\club", last_assistant_message: "만들었어요" });
  assert.equal(ev.tool, "codex");
  assert.equal(ev.work, "[사용자] 목록 만들어 줘\n[Codex] 만들었어요");
  assert.equal(addEvent({ hook_event_name: "Stop", session_id: "same", last_assistant_message: "다른 도구" }).work, "[Claude] 다른 도구", "같은 세션 번호라도 도구가 다르면 따로");
  assert.equal(addEvent({ hook_event_name: "Stop", session_id: "x", tool: "이상한값" }).tool, "claude");
});

test("연결: hook.js에 codex를 붙이면 서버로 도구 이름이 같이 간다", async () => {
  const http = require("node:http"), { spawn } = require("node:child_process");
  let got;
  const srv = http.createServer((req, res) => { let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => { got = JSON.parse(b); res.end("{}"); }); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const run = (args) => new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(BACK, "hook.js"), ...args], { env: { ...process.env, NAV_PORT: String(srv.address().port) } });
    c.on("close", resolve);
    c.stdin.end(JSON.stringify({ hook_event_name: "Stop", session_id: "s", cwd: "/w", last_assistant_message: "끝", turn_id: "t" }));
  });
  try {
    await run(["codex"]);
    assert.deepEqual([got.tool, got.last_assistant_message, got.turn_id], ["codex", "끝", undefined], "필요한 칸만 넘긴다");
    await run([]);
    assert.equal(got.tool, "claude");
  } finally { srv.close(); }
});

test("연결: Codex용 명령(… hook.js codex)도 우리 것으로 알아보고 뺄 수 있다", () => {
  const once = Connect.addHooks({}, `${Connect.COMMAND} codex`);
  assert.match(once.hooks.Stop[0].hooks[0].command, /hook\.js" codex$/);
  assert.deepEqual(Connect.addHooks(once, `${Connect.COMMAND} codex`), once);
  assert.deepEqual(Connect.removeHooks(once), {});
});

// F-03(이재엽 2026-10-18 "둘로 나눔"): 6단계의 '잰 값과 못 한 것'은 한 항목에 두 가지가 묶여 실제 AI와 예시 정답이 갈렸다 — 둘로 나눈다
test("6단계: '잰 값 적어 두기'와 '못 한 것 적어 두기'가 따로 있고, 한 항목에 둘을 묶지 않는다", () => {
  const texts = Nav.STAGES[6].criteria.map((c) => c.text);
  assert.ok(texts.some((t) => t.includes("잰 값") && !/못\s?한/.test(t)), "잰 값 항목");
  assert.ok(texts.some((t) => /못\s?한/.test(t) && !t.includes("잰 값")), "못 한 것 항목");
  assert.ok(!texts.some((t) => t.includes("잰 값") && /못\s?한/.test(t)), "둘을 묶은 항목이 남아 있다");
});

test("6단계 연습 예시: 글에 잰 값은 있고 못 한 것은 없다 — 정답도 그대로(잰 값 ✔ · 못 한 것 ✘)", () => {
  const ex = S.examples.find((e) => e.text && e.judgement && e.judgement.stage === 6);
  const crit = Nav.STAGES[6].criteria, met = ex.judgement.criteria.map((c) => c.met);
  assert.equal(met.length, crit.length, "예시의 칸 수가 할 일 수와 같다");
  assert.equal(met[crit.findIndex((c) => c.text.includes("잰 값"))], true, "잰 값은 했다");
  assert.equal(met[crit.findIndex((c) => /못\s?한/.test(c.text))], false, "못 한 것은 안 했다");
});

// FR-17 대화로 일 넘기기(C-4, 2026-10-20 — 넘김 문서 c4-views ②): 섬에 적은 할 일 → 요구 문장으로 정리 → 사람이 고쳐 확정. 코드보다 먼저 썼다
test("일 넘기기: 요청문은 적은 글을 넘기고 지어내지 말라고 하며, 답은 줄(lines) · 말(say)만 쓴다. 모양이 틀리면 null. 줄은 12개 · 200자까지", () => {
  const p = Nav.taskPrompt("회원 신청 화면 만들고 마감 알림도 넣어 줘");
  assert.ok(p.includes("회원 신청 화면") && p.includes("지어내지") && /한 줄에 한 가지/.test(p));
  assert.deepEqual(jargonIn(p.replace(/<[^>]+>/g, "")), []);
  assert.deepEqual(Nav.TASK_SCHEMA.required.sort(), ["lines", "say"]);
  assert.deepEqual(Nav.parseTask({ lines: ["회원이 신청 단추를 누르면, 앱은 신청서를 보여 준다", " "], say: "정리했어요" }), { lines: ["회원이 신청 단추를 누르면, 앱은 신청서를 보여 준다"], say: "정리했어요" });
  assert.equal(Nav.parseTask({ lines: Array.from({ length: 20 }, (_, i) => `줄 ${i}`), say: "s" }).lines.length, 12);
  assert.equal(Nav.parseTask({ lines: ["가".repeat(300)], say: "s" }).lines[0].length, 200);
  for (const bad of [null, {}, { lines: [], say: "x" }, { lines: ["a"] }, { lines: "a", say: "x" }, { lines: [1], say: "x" }]) assert.equal(Nav.parseTask(bad), null, JSON.stringify(bad));
});

test("일 넘기기(연습): 서버 없이도 적은 글을 줄로 나눈다 — 줄 · 문장마다 하나, 빈 줄은 빼고 6줄까지, 말은 연습이라고 알린다", () => {
  const t = Nav.taskLines("회원 신청 화면 만들어 줘. 마감 알림도 넣어 줘\n\n관리자가 승인하는 화면");
  assert.deepEqual(t.lines, ["회원 신청 화면 만들어 줘", "마감 알림도 넣어 줘", "관리자가 승인하는 화면"]);
  assert.ok(t.say.includes("연습") && !t.say.includes("설계도"));
  assert.equal(Nav.taskLines(Array.from({ length: 10 }, (_, i) => `일 ${i}`).join("\n")).lines.length, 6);
  assert.deepEqual(Nav.taskLines("").lines, []); assert.deepEqual(Nav.taskLines(null).lines, []);
});

// C-42 R-10(F-60, 2026-10-27 이재엽 버튼 "Go" · "증거가 있어야 됨"): 판정(AI · 연습 · 확인한 대로) 뒤에 코드가 한 번 더 본다(ADR-0003) —
//   빈칸 표시가 남은 칸은 '됨'이 아니고, 증거가 있어야 하는 칸(5단계 도는지 · 6단계 작은 확인 — 그 장에서 Claude Code가 파일을 고친 기록, 7단계 잰 값 — 숫자)은 증거 없이는 '됨'이 아니다
test("gateRules: 빈칸 표시('(재고 적기)' · '[채워 주세요: …]')가 남은 칸은 '됨'이 아니다 — 이미 '안 됨'인 칸과 다른 칸은 그대로", () => {
  const j = { stage: 6, reason: "r", criteria: Nav.STAGES[6].criteria.map((c) => ({ text: c.text, term: c.term, met: true, evidence: "e" })), next: null };
  const lines = ["30초 안에", "알림 시각: (재고 적기) · 잰 날: (재고 적기)", "아직 못 함: 없음", "로그인: 있음"];
  const g = Nav.gateRules(j, { lines, work: true });
  assert.deepEqual(g.criteria.map((c) => c.met), [true, false, true, true]);
  assert.equal(g.criteria[1].why, "blank");
  assert.equal(Nav.gateRules(j, { lines: ["[채워 주세요: 숫자]", "12초", "x", "y"], work: true }).criteria[0].why, "blank");
  const off = { ...j, criteria: j.criteria.map((c, i) => ({ ...c, met: i !== 0 })) };
  assert.deepEqual(Nav.gateRules(off, { lines: ["a", "12", "b", "c"], work: true }).criteria.map((c) => c.met), [false, true, true, true], "안 됨은 그대로");
  assert.equal(Nav.gateRules(null, {}), null); assert.equal(Nav.GATE_WHY.blank, "빈칸 표시가 남았어요");
});

test("gateRules: 7단계 '잰 값'은 숫자가 있어야, 5단계 '도는지' · 6단계 '작은 확인'은 Claude Code가 파일을 고친 기록(work)이 있어야 '됨' — 다른 장 · 다른 칸은 안 건드린다", () => {
  const mk = (n, lines) => Nav.gateRules({ stage: n, reason: "r", criteria: Nav.STAGES[n].criteria.map((c) => ({ text: c.text, term: c.term, met: true, evidence: "e" })), next: null }, { lines });
  const m7 = mk(6, ["30초 안에", "알림 시각: 곧", "없음", "있음"]);
  assert.equal(m7.criteria[1].met, false); assert.equal(m7.criteria[1].why, "evidence"); assert.ok(m7.criteria[0].met && m7.criteria[2].met);
  assert.equal(mk(6, ["30초 안에", "알림 시각: 2026-10-27 12초", "없음", "있음"]).criteria[1].met, true, "숫자가 있으면 됨");
  const m5 = Nav.gateRules({ stage: 4, reason: "r", criteria: Nav.STAGES[4].criteria.map((c) => ({ text: c.text, term: c.term, met: true, evidence: "e" })), next: null }, { lines: ["a", "b", "c", "d"], work: false });
  assert.deepEqual(m5.criteria.map((c) => c.met), [true, false, true, true], "5단계 도는지 — 기록 없으면 안 됨"); assert.equal(m5.criteria[1].why, "evidence");
  assert.deepEqual(Nav.gateRules({ ...m5, criteria: m5.criteria.map((c) => ({ ...c, met: true, why: undefined })) }, { lines: ["a", "b", "c", "d"], work: true }).criteria.map((c) => c.met), [true, true, true, true]);
  const m6 = Nav.gateRules({ stage: 5, reason: "r", criteria: Nav.STAGES[5].criteria.map((c) => ({ text: c.text, term: c.term, met: true, evidence: "e" })), next: null }, { lines: ["a", "b", "c", "d", "e"], work: false });
  assert.equal(m6.criteria.find((c) => c.text === "작은 부분마다 확인 통과하기").met, false);
  const m3 = Nav.gateRules({ stage: 2, reason: "r", criteria: Nav.STAGES[2].criteria.map((c) => ({ text: c.text, term: c.term, met: true, evidence: "e" })), next: null }, { lines: ["a", "b", "c", "d", "e"], work: false });
  assert.ok(m3.criteria.every((c) => c.met), "3단계는 증거 칸이 없다");
  assert.deepEqual(Nav.EVIDENCE_CRITERIA, { 4: ["이어진 게 실제로 도는지 확인하기"], 5: ["작은 부분마다 확인 통과하기"], 6: ["잰 값을 그대로 적어 두기"] });
  // 경계(새 맥락 리뷰 2026-10-27): 숫자가 섞인 '아직 못 잼'은 잰 값이 아니다 · 줄이 기준보다 짧으면 판정의 근거 글로 본다 · 빈 줄은 증거 칸에서만 걸린다
  assert.equal(mk(6, ["30초", "2단계 숫자를 아직 못 잼", "없음", "있음"]).criteria[1].met, false, "'아직 못 잼'");
  assert.equal(mk(6, ["30초", "알림 시각: 12초 — 모르겠어요", "없음", "있음"]).criteria[1].met, false, "'모르겠'");
  const short = Nav.gateRules({ stage: 6, reason: "r", criteria: Nav.STAGES[6].criteria.map((c, i) => ({ text: c.text, term: c.term, met: true, evidence: i === 1 ? "잰 값 (재고 적기)" : "e" })), next: null }, { lines: ["30초"] });
  assert.equal(short.criteria[1].why, "blank", "줄이 없으면 근거 글을 본다"); assert.equal(short.criteria[0].met, true);
  assert.equal(mk(6, ["30초", "", "없음", "있음"]).criteria[1].why, "evidence", "빈 줄 — 잰 값 없음"); assert.equal(mk(2, ["", "", "", "", ""]).criteria.every((c) => c.met), true, "증거 칸이 아니면 빈 줄도 건드리지 않는다(적은 적 없는 칸은 애초에 met이 아니다)");
});
