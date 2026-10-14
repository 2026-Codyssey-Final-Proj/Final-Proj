// claude-drafted: 2026-10-14
// 실행: node --test implementations/navigator-prototype/navigator.test.js  (Node 24는 폴더가 아니라 파일 경로를 줘야 한다)
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Nav = require("./navigator.js");
const S = require("./scenario.js");
const Cat = require("./cat.js");
const { allowed } = require("./server.js");

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
  for (const a of S.answers[2]) assert.deepEqual(jargonIn(a), [], a);
});

test("쉬운 말: 화면 파일(index.html·app.js·cat.js)에 전문 용어가 없다 (주석 제외)", () => {
  for (const f of ["index.html", "app.js", "cat.js"]) {
    const code = fs.readFileSync(path.join(__dirname, f), "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.deepEqual(jargonIn(code), [], f);
  }
});

test("쉬운 말: 나비의 말풍선에 전문 용어가 없다", () => {
  const says = Object.keys({ ask: 1, which: 1, question: 1, plan: 1, next: 1 }).map((step) => Nav.face({ gate: true, step })[1]);
  says.push(Nav.face({ busy: true })[1], Nav.face({ warn: ["x"] })[1], Nav.face({ error: "x" })[1], Nav.face({})[1], Nav.face({ reason: "r", allDone: true })[1]);
  for (const t of says) assert.deepEqual(jargonIn(t), [], t);
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
    assert.ok(Cat.MOODS.includes(m), `나비에게 없는 표정: ${m}`);
  }
});

test("ticker: 방금 한 일 / 지금 할 일 / 그다음", () => {
  const j = Nav.parseJudgement(S.examples[0].judgement);
  const t = Nav.ticker(j, null, "");
  assert.equal(t.done, Nav.STAGES[2].criteria[0].text);
  assert.equal(t.now, j.next.what, "지금 할 일은 AI가 고른 것");
  assert.equal(t.after, Nav.STAGES[2].criteria[2].text);
  const mine = Nav.ticker({ ...j, next: null }, ["나", "가"], "");
  assert.deepEqual([mine.now, mine.after], ["나", "가"], "사용자가 정한 순서를 따른다");
  const done = Nav.ticker(Nav.parseJudgement(S.examples[1].judgement), null, "");
  assert.equal(done.after, "3단계 만드는 방법 고르기");
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
    const j = Nav.parseJudgement(ex.judgement);
    assert.ok(j, ex.label);
    assert.deepEqual(j.criteria.map((c) => c.text), Nav.STAGES[ex.judgement.stage].criteria.map((c) => c.text));
    assert.ok(j.next.options.length >= 2 && j.next.options.length <= 4, ex.label);
  }
});

test("parseJudgement: 모양이 틀린 Claude 응답은 버린다(살펴보지 못함)", () => {
  const ok = S.examples[0].judgement;
  const bad = [
    null, "문자열", {},
    { ...ok, stage: 9 },
    { ...ok, stage: 1.5 },
    { ...ok, criteria: ok.criteria.slice(1) },
    { ...ok, criteria: [{ met: "yes" }, ...ok.criteria.slice(1)] },
    { ...ok, reason: " " },
    { ...ok, next: { ...ok.next, question: "" } },
    { ...ok, next: { ...ok.next, options: ["하나뿐"] } },
    { ...ok, next: { ...ok.next, options: ["가", "나", "다", "라", "마"] } },
    { ...ok, next: { ...ok.next, options: ["가", " "] } },
    { ...ok, next: { ...ok.next, options: "가/나" } },
  ];
  for (const b of bad) assert.equal(Nav.parseJudgement(b), null, JSON.stringify(b));
});

test("parseJudgement: Claude가 보낸 선택지 목록을 바꿔도 우리 쪽 결과는 그대로다", () => {
  const raw = JSON.parse(JSON.stringify(S.examples[0].judgement));
  const j = Nav.parseJudgement(raw);
  raw.next.options.push("나중에 끼어든 것");
  assert.equal(j.next.options.length, 3);
});

test("가상 시나리오: 보완 전은 못 넘어가고, 보완 후는 '예'면 넘어간다", () => {
  const met = (i) => S.examples[i].judgement.criteria.map((c) => c.met);
  assert.equal(Nav.canAdvance(met(0), "yes"), false);
  assert.equal(Nav.canAdvance(met(1), "yes"), true);
});

test("가상 시나리오: 미리 만든 응답에 없는 입력은 살펴보지 않는다", () => {
  assert.equal(S.judgeFixture("아무 글"), null);
  assert.ok(S.judgeFixture(S.examples[1].text + "\n"));
});

test("가상 시나리오: 연습 1에서 선택지를 하나 고르면 '하나 정함' 장면(2/4)으로 간다", () => {
  const base = S.examples[0], q = base.judgement.next;
  for (const o of q.options) {
    const j = S.judgeFixture(`${base.text}\n${Nav.decisionLine(q.question, o)}`);
    assert.ok(j, o);
    assert.equal(j.criteria.filter((c) => c.met).length, 2);
  }
  assert.equal(S.judgeFixture(`${base.text}\n${Nav.decisionLine(q.question, "목록에 없는 답")}`), null);
  assert.equal(S.examples.filter((e) => !e.hidden).length, 2, "버튼으로 보이는 연습은 두 개");
});

test("미리 만든 답은 2단계 할 일과 개수가 같다", () => {
  assert.equal(S.answers[2].length, Nav.STAGES[2].criteria.length);
});

test("judgePrompt: 모든 단계와 사용자 글이 들어가고, 고른 줄을 읽는 법을 알려 준다", () => {
  const p = Nav.judgePrompt("동아리 앱");
  for (const s of Nav.STAGES) assert.ok(p.includes(`${s.n}단계 ${s.title}`));
  assert.ok(p.includes("동아리 앱"));
  assert.ok(p.includes("로 정했어요."));
});

test("나비: 표정 이름이 그림에 들어가고, 작으면 입을 빼고, 모르는 표정은 기본으로", () => {
  assert.match(Cat.svg("done", 64), /class="cat m-done"/);
  assert.match(Cat.svg("idle", 28), /class="cat m-idle small"/);
  assert.match(Cat.svg("없는표정", 64), /m-idle/);
});

test("나비: 눈은 커서 쪽으로 가되 7칸을 넘지 않고, 커서가 가까우면 조금만 움직인다", () => {
  const far = Cat.gaze(1000, 0), near = Cat.gaze(22, 0), still = Cat.gaze(0, 0);
  assert.ok(Math.abs(far.x - 7) < 1e-9 && far.y === 0);
  assert.ok(near.x > 0 && near.x < 1);
  assert.deepEqual([still.x, still.y], [0, 0]);
});

test("서버는 이 컴퓨터의 화면에서 온 요청만 받는다", () => {
  assert.equal(allowed({ host: "127.0.0.1:4317" }, 4317), true);
  assert.equal(allowed({ host: "localhost:4317", origin: "http://localhost:4317" }, 4317), true);
  assert.equal(allowed({ host: "127.0.0.1:4317", origin: "https://evil.example" }, 4317), false, "다른 사이트");
  assert.equal(allowed({ host: "evil.example:4317" }, 4317), false, "DNS 리바인딩");
});

test("외부 AI(claude) 호출은 server.js 한 곳에서만 한다", () => {
  const dir = __dirname;
  const callers = fs.readdirSync(dir).filter((f) => f.endsWith(".js") || f.endsWith(".html"))
    .filter((f) => /child_process|spawn\(|api\.anthropic\.com/.test(fs.readFileSync(path.join(dir, f), "utf8")))
    .filter((f) => f !== path.basename(__filename));
  assert.deepEqual(callers, ["server.js"]);
});
