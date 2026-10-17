// claude-drafted: 2026-10-17 — 실제 AI 점검 도구의 핵심(runChecks)을 가짜 호출로 시험한다. 실제 호출은 하지 않는다.
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../../03-backend/navigator/live-check.js");

const cases = [
  { label: "A", text: "글 A", stage: 1, expect: [true, false] },
  { label: "B", text: "글 B", stage: 2, expect: [true, true, false] },
  { label: "C", text: "글 C", stage: 3, expect: [false] },
];
const parsed = (met) => ({ stage: 1, reason: "r", criteria: met.map((m) => ({ met: m })), next: { what: "다음 할 일" } });

test("정상: 형식이 맞고 예시 정답과 같으면 일치 수가 센다", async () => {
  const call = async () => ({ data: { x: 1 }, tokens: 100 });
  const parse = (d, text, stage) => parsed(cases.find((c) => c.stage === stage).expect);
  const r = await L.runChecks(cases, { call, parse, buildPrompt: () => "p" });
  assert.equal(r.rows.length, 3);
  assert.deepEqual(r.rows.map((x) => x.status), ["ok", "ok", "ok"]);
  assert.deepEqual(r.rows.map((x) => `${x.agree}/${x.total}`), ["2/2", "3/3", "1/1"]);
  assert.equal(r.tokens, 300);
});

test("정답과 다르면 어느 칸이 다른지 알려 준다", async () => {
  const call = async () => ({ data: {}, tokens: 50 });
  const parse = () => parsed([false, false]);          // A의 기대 [true,false]와 첫 칸이 다름
  const r = await L.runChecks([cases[0]], { call, parse, buildPrompt: () => "p" });
  assert.equal(r.rows[0].agree, 1);
  assert.deepEqual(r.rows[0].diff, [1]);               // 1번(1부터)
});

test("형식 오류: AI는 답했지만 우리 검증을 못 통과하면 format", async () => {
  const call = async () => ({ data: { 엉뚱: true }, tokens: 80 });
  const r = await L.runChecks([cases[0]], { call, parse: () => null, buildPrompt: () => "p" });
  assert.equal(r.rows[0].status, "format");
  assert.equal(r.tokens, 80, "답을 받았으면 토큰은 쓴 것이다");
});

test("호출 실패: 오류 문구를 그대로 보여 주고 이어서 다음 글로 간다", async () => {
  let n = 0;
  const call = async () => (++n === 1 ? { error: "잠시 너무 많이 불렀어요 (429)" } : { data: {}, tokens: 10 });
  const r = await L.runChecks(cases.slice(0, 2), { call, parse: () => parsed([true, false]), buildPrompt: () => "p" });
  assert.equal(r.rows[0].status, "error");
  assert.match(r.rows[0].error, /429/);
  assert.equal(r.rows[1].status, "ok");
});

test("인증·한도 오류는 같은 오류를 되풀이하지 않고 멈춘다", async () => {
  let n = 0;
  const call = async () => { n++; return { error: "API 키가 맞지 않거나 권한이 없어요 (401) — …" }; };
  const r = await L.runChecks(cases, { call, parse: () => null, buildPrompt: () => "p" });
  assert.equal(n, 1, "401이면 한 번만 부른다");
  assert.equal(r.stoppedEarly, true);
});

test("요약: 평균 토큰과 성공 수, 남은 한도로 몇 번 더 부를 수 있는지", async () => {
  const call = async () => ({ data: {}, tokens: 1000 });
  const r = await L.runChecks(cases, { call, parse: () => parsed([true, false]), buildPrompt: () => "p" });
  const s = L.summarize(r, { budget: 100_000, used: 20_000 });
  assert.equal(s.ok, 3);
  assert.equal(s.avgTokens, 1000);
  assert.equal(s.callsLeft, 80);                       // (100000-20000)/1000
  assert.equal(L.summarize(r, { budget: null, used: 0 }).callsLeft, null, "한도를 모르면 말하지 않는다");
});

test("고르기: 기본은 적게(3개), --all은 전부, --stage는 그 단계만 — 글이 있는 예시만", () => {
  const all = [{ label: "x", text: "", stage: 0 }, ...cases, { label: "D", text: "글 D", stage: 3, expect: [true] }];
  assert.equal(L.pick(all, {}).length, 3);
  assert.equal(L.pick(all, { all: true }).length, 4, "글이 없는 예시는 뺀다");
  assert.deepEqual(L.pick(all, { stage: 3, all: true }).map((c) => c.label), ["C", "D"]);
  assert.equal(L.pick(all, { max: 2 }).length, 2);
});

test("사례는 연습 예시에서 만든다 — 글이 있는 예시마다 단계와 기대 판정이 있다", () => {
  const list = L.casesFromExamples();
  assert.ok(list.length >= 5);
  for (const c of list) {
    assert.ok(c.text.length > 0 && Number.isInteger(c.stage) && Array.isArray(c.expect) && c.expect.length > 0, c.label);
  }
});

// ── --report: 결과를 기록 파일로 — 2026-10-17 ──
const baseEnv = { provider: "api", model: "claude-sonnet-4", relay: true, compat: true };
const sampleResult = {
  rows: [
    { label: "연습 1 · 하는 중", stage: 2, status: "ok", agree: 4, total: 4, diff: [], next: "'빠르게'를 숫자로 바꾸기", tokens: 1800 },
    { label: "3단계 · 하는 중", stage: 3, status: "ok", agree: 1, total: 2, diff: [2], next: "x", tokens: 1700 },
    { label: "4단계 · 하는 중", stage: 4, status: "format", tokens: 1500 },
    { label: "5단계 · 하는 중", stage: 5, status: "error", error: "잠시 너무 많이 불렀어요 (429) — 조금 뒤에 다시 눌러 주세요", tokens: 0 },
  ],
  tokens: 5000, stoppedEarly: false,
};

test("기록: 환경·결과표·요약과 사람이 채울 두 칸이 있다", () => {
  const sum = L.summarize(sampleResult, { budget: 100000, used: 5000 });
  const md = L.reportMarkdown({ date: "2026-10-17", env: baseEnv, result: sampleResult, summary: sum, stages: [2, 3, 4, 5] });
  assert.match(md, /^# 실제 AI 판정 점검 — 2026-10-17/m);
  assert.match(md, /\| 모델 \| claude-sonnet-4 \|/);
  assert.match(md, /\| 보내는 곳 \| 중계 서버 \|/);
  assert.match(md, /\| 호환 모드 \| 예 \|/);
  assert.match(md, /\| 2 \| 연습 1 · 하는 중 \| ✅ \| 4\/4 \| — \| 1,800 \|/);
  assert.match(md, /\| 3 \| 3단계 · 하는 중 \| 🟡 \| 1\/2 \| 2번 \| 1,700 \|/);
  assert.match(md, /\| 4 \| 4단계 · 하는 중 \| ❌ 형식 \|/);
  assert.match(md, /\| 5 \| 5단계 · 하는 중 \| ❌ 호출 실패 \(429\)/);
  assert.match(md, /성공 2 · 형식 오류 1 · 호출 실패 1/);
  assert.match(md, /평균 1,250토큰/);
  assert.match(md, /^## 발견해 고친 것/m);
  assert.match(md, /^## 하지 못한 것/m);
});

test("기록에는 주소(호스트)·키·글 내용이 들어가지 않는다 — 중계 서버인지만 적는다", () => {
  const md = L.reportMarkdown({ date: "2026-10-17", env: { ...baseEnv, host: "copa.example.test", key: "sk-ant-SECRET" }, result: sampleResult, summary: L.summarize(sampleResult, {}), stages: [2] });
  assert.ok(!md.includes("copa.example.test") && !md.includes("sk-ant"));
  const official = L.reportMarkdown({ date: "d", env: { ...baseEnv, relay: false, compat: false }, result: sampleResult, summary: L.summarize(sampleResult, {}), stages: [2] });
  assert.match(official, /\| 보내는 곳 \| 공식 주소 \|/);
  assert.match(official, /\| 호환 모드 \| 아니오 \|/);
});

test("기록: 중간에 멈췄으면 그 사실을 적는다", () => {
  const md = L.reportMarkdown({ date: "d", env: baseEnv, result: { ...sampleResult, stoppedEarly: true }, summary: L.summarize(sampleResult, {}), stages: [2] });
  assert.match(md, /되풀이될 것 같아 남은 예시는 부르지 않았/);
});

test("파일 쓰기: 이미 있으면 덮어쓰지 않고, --force면 덮어쓰고, 없는 폴더는 만든다", () => {
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "nav-rep-")), "docs", "v", "r.md");
  assert.equal(L.writeReport(file, "첫째").ok, true);
  assert.equal(fs.readFileSync(file, "utf8"), "첫째");
  const again = L.writeReport(file, "둘째");
  assert.equal(again.ok, false);
  assert.match(again.reason, /이미 있는/);
  assert.equal(fs.readFileSync(file, "utf8"), "첫째", "덮어쓰지 않았다");
  assert.equal(L.writeReport(file, "둘째", { force: true }).ok, true);
  assert.equal(fs.readFileSync(file, "utf8"), "둘째");
});
