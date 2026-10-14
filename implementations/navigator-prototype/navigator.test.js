// claude-drafted: 2026-10-14
// 실행: node --test implementations/navigator-prototype/navigator.test.js  (Node 24는 폴더가 아니라 파일 경로를 줘야 한다)
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Nav = require("./navigator.js");
const S = require("./scenario.js");
const { allowed } = require("./server.js");

test("단계 0~7이 순서대로 있고 단계마다 완료 기준이 있다", () => {
  assert.deepEqual(Nav.STAGES.map((s) => s.n), [0, 1, 2, 3, 4, 5, 6, 7]);
  for (const s of Nav.STAGES) assert.ok(s.criteria.length > 0, s.name);
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

test("parseJudgement: 가상 시나리오의 응답은 모두 통과하고 기준 문장은 우리 데이터로 채워진다", () => {
  for (const ex of S.examples) {
    const j = Nav.parseJudgement(ex.judgement);
    assert.ok(j, ex.label);
    assert.deepEqual(j.criteria.map((c) => c.text), Nav.STAGES[ex.judgement.stage].criteria);
  }
});

test("parseJudgement: 모양이 틀린 Claude 응답은 버린다(판정 못 함)", () => {
  const ok = S.examples[0].judgement;
  const bad = [
    null, "문자열", {},
    { ...ok, stage: 9 },
    { ...ok, stage: 1.5 },
    { ...ok, criteria: ok.criteria.slice(1) },
    { ...ok, criteria: [{ met: "yes" }, ...ok.criteria.slice(1)] },
    { ...ok, reason: " " },
    { ...ok, next: { ...ok.next, decision: "" } },
  ];
  for (const b of bad) assert.equal(Nav.parseJudgement(b), null, JSON.stringify(b));
});

test("가상 시나리오: 보완 전은 못 넘어가고, 보완 후는 '예'면 넘어간다", () => {
  const met = (i) => S.examples[i].judgement.criteria.map((c) => c.met);
  assert.equal(Nav.canAdvance(met(0), "yes"), false);
  assert.equal(Nav.canAdvance(met(1), "yes"), true);
});

test("가상 시나리오: 미리 만든 응답에 없는 입력은 판정하지 않는다", () => {
  assert.equal(S.judgeFixture("아무 글"), null);
  assert.ok(S.judgeFixture(S.examples[1].text + "\n"));
});

test("미리 만든 답은 2단계 완료 기준과 개수가 같다", () => {
  assert.equal(S.answers[2].length, Nav.STAGES[2].criteria.length);
});

test("judgePrompt: 모든 단계와 사용자 글이 들어간다", () => {
  const p = Nav.judgePrompt("동아리 앱");
  for (const s of Nav.STAGES) assert.ok(p.includes(`${s.n} ${s.name}`));
  assert.ok(p.includes("동아리 앱"));
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
