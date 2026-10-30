// claude-drafted: 2026-10-24 — 토큰 장부(이재엽 "테스트를 진행하면서 토큰값도 계산을 할거야" · 버튼 "이번 PR에 같이"). 코드보다 먼저 썼다(code.md 1번).
// 03-backend/navigator/tokens.js — Floe의 AI(판정 · 퀘스트 · 정리)와 Claude Code에 맡긴 일이 쓴 토큰을 숫자로만 쌓는다. 무엇을 보냈는지 · 답은 적지 않는다.
// 실행: node --test 04-tests/navigator/tokens.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const T = require("../../03-backend/navigator/tokens.js");
const TV = require("../../03-backend/navigator/token-view.js");

const mem = (init = null) => { let v = init; return { load: () => v, save: (s) => { v = JSON.parse(JSON.stringify(s)); }, peek: () => v }; };

test("usage 합치기: 입력 · 출력 · 캐시 쓰기 · 캐시 읽기, 이상한 값은 0", () => {
  assert.deepEqual(T.usageOf({ input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 100, cache_read_input_tokens: 1000 }),
    { input: 10, output: 5, cacheWrite: 100, cacheRead: 1000, total: 1115 });
  assert.deepEqual(T.usageOf(null), { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, total: 0 });
  assert.equal(T.usageOf({ input_tokens: -3, output_tokens: "x" }).total, 0);
});

test("claude -p --output-format json의 답 읽기: usage · total_cost_usd만. 앞에 다른 줄이 있어도 마지막 JSON, 아니면 null", () => {
  const out = JSON.stringify({ type: "result", subtype: "success", is_error: false, duration_ms: 4200, num_turns: 3, result: "다 했어요", session_id: "s",
    total_cost_usd: 0.0123, usage: { input_tokens: 12, output_tokens: 300, cache_creation_input_tokens: 2000, cache_read_input_tokens: 9000 } });
  const r = T.parseResult(out);
  assert.deepEqual(r, { usage: { input: 12, output: 300, cacheWrite: 2000, cacheRead: 9000, total: 11312 }, cost: 0.0123 });
  assert.equal("result" in r, false, "답 글은 담지 않는다");
  assert.equal(T.parseResult(`경고 한 줄\n${out}\n`).usage.total, 11312);
  assert.equal(T.parseResult(JSON.stringify({ type: "result", cost_usd: 0.5, usage: {} })).cost, 0.5, "옛 이름 cost_usd도");
  assert.equal(T.parseResult(JSON.stringify({ type: "result", usage: {} })).cost, null);
  for (const bad of ["", "{깨짐", "[]", JSON.stringify({ type: "other" })]) assert.equal(T.parseResult(bad), null, bad);
});

test("장부: 쌓기 — 종류마다(floe · task) 번 수 · 토큰 · 비용, 최근 기록은 새것부터 30개, 저장소에 숫자만", () => {
  const store = mem();
  const L = T.createLedger(store, () => 1000);
  L.add("floe", "판정", T.usageOf({ input_tokens: 1500, output_tokens: 300 }), null);
  L.add("task", "저장소 만들기", T.usageOf({ input_tokens: 10, output_tokens: 90, cache_read_input_tokens: 900 }), 0.02);
  L.add("task", "맡긴 일", T.usageOf({ output_tokens: 1000 }), 0.01);
  const s = L.snapshot();
  assert.equal(s.since, 1000);
  assert.deepEqual(s.kinds.floe, { count: 1, tokens: 1800, cost: 0 });
  assert.deepEqual(s.kinds.task, { count: 2, tokens: 2000, cost: 0.03 });
  assert.deepEqual(s.total, { count: 3, tokens: 3800, cost: 0.03 });
  assert.equal(s.runs[0].label, "맡긴 일"); assert.equal(s.runs[2].label, "판정");
  assert.deepEqual(Object.keys(s.runs[1]).sort(), ["at", "cacheRead", "cacheWrite", "cost", "input", "kind", "label", "output", "total"]);
  assert.equal(s.runs[2].cost, null, "모르는 비용은 null(0으로 지어내지 않는다)");
  for (let i = 0; i < 40; i++) L.add("floe", "판정", T.usageOf({ output_tokens: 1 }), null);
  assert.equal(L.snapshot().runs.length, 30);
  assert.equal(L.snapshot().kinds.floe.count, 41, "합계는 버리지 않는다");
  assert.ok(!JSON.stringify(store.peek()).match(/다 했어요|prompt/), "글은 남지 않는다");
});

test("장부: 모르는 종류 · 이름은 버리고, 이상한 저장 값은 0에서 시작, 비우면 since가 지금으로", () => {
  let t = 5;
  const store = mem({ since: "x", kinds: { floe: { count: "a" } }, runs: "z" });
  const L = T.createLedger(store, () => t);
  assert.deepEqual(L.snapshot().total, { count: 0, tokens: 0, cost: 0 });
  L.add("hack", "판정", T.usageOf({ output_tokens: 9 }), null);
  L.add("floe", "<b>x</b>", T.usageOf({ output_tokens: 9 }), null);
  assert.equal(L.snapshot().total.count, 1); assert.equal(L.snapshot().runs[0].label, "AI");
  L.add("floe", "1단계 초안", T.usageOf({ output_tokens: 9 }), null);   // F-107 — /api/start의 이름. 숫자가 든 이름도 그대로(전에는 'AI')
  assert.equal(L.snapshot().runs[0].label, "1단계 초안");
  L.add("floe", "1단계 <b>", T.usageOf({ output_tokens: 9 }), null);
  assert.equal(L.snapshot().runs[0].label, "AI");
  t = 99; L.reset();
  assert.deepEqual(L.snapshot(), { since: 99, total: { count: 0, tokens: 0, cost: 0 }, kinds: { floe: { count: 0, tokens: 0, cost: 0 }, task: { count: 0, tokens: 0, cost: 0 } }, runs: [] });
  assert.equal(store.peek().since, 99);
});

test("장부 파일: 나만 읽기(600)로 쓰고, 없거나 깨진 파일은 빈 장부", { skip: process.platform === "win32" && "Windows는 chmod가 거의 효과가 없다" }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "floe-tokens-"));
  const file = path.join(dir, "t.json");
  const L = T.createLedger(T.fileStore(file), () => 1);
  assert.equal(L.snapshot().total.count, 0);
  L.add("task", "맡긴 일", T.usageOf({ output_tokens: 3 }), 0.001);
  assert.equal((fs.statSync(file).mode & 0o777).toString(8), "600");
  assert.equal(T.createLedger(T.fileStore(file)).snapshot().total.tokens, 3, "다시 켜도 이어진다");
  fs.writeFileSync(file, "{깨짐");
  assert.equal(T.createLedger(T.fileStore(file)).snapshot().total.count, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("장부 파일 자리: NAV_TOKENS_FILE > NAV_USAGE_FILE 옆(-tokens.json) > 홈의 .navigator-tokens.json — 시험이 홈에 쓰지 않게", () => {
  assert.equal(T.fileOf({ NAV_TOKENS_FILE: "/t/a.json" }, "/h"), "/t/a.json");
  assert.equal(T.fileOf({ NAV_USAGE_FILE: "/t/usage.json" }, "/h"), "/t/usage-tokens.json");
  assert.equal(T.fileOf({}, "/h"), path.join("/h", ".navigator-tokens.json"));
});

test("토큰 칸 보기(token-view ledgerView): 합계 · 종류 두 줄 · 최근 다섯 줄, 비용은 Claude Code가 알려 준 값만 · 모르면 비움", () => {
  const L = T.createLedger(mem(), () => new Date("2026-10-24T10:00:00").getTime());
  assert.deepEqual(TV.ledgerView(L.snapshot()).empty, true);
  L.add("floe", "판정", T.usageOf({ input_tokens: 1500, output_tokens: 300 }), null);
  L.add("task", "저장소 만들기", T.usageOf({ output_tokens: 1200 }), 0.0234);
  const v = TV.ledgerView(L.snapshot());
  assert.equal(v.empty, false);
  assert.equal(v.total, "3,000토큰 · 약 $0.023");
  assert.deepEqual(v.rows.map((r) => [r.name, r.value]), [["Floe의 AI (판정 · 퀘스트 · 정리)", "1,800토큰 · 1번"], ["Claude Code에 맡긴 일", "1,200토큰 · 1번 · 약 $0.023"]]);
  assert.equal(v.recent.length, 2);
  assert.match(v.recent[0], /저장소 만들기 · 1,200토큰 · 약 \$0\.023/);
  assert.match(v.recent[1], /판정 · 1,800토큰$/);
  assert.match(v.note, /터미널에서 직접 연 Claude Code/);
  assert.equal(TV.ledgerView(null), null);
});

test("장부 이름: 서버가 AI를 부를 때 넘기는 이름은 모두 그대로 남는다 — 이름을 바꿔도 'AI'로 뭉개지지 않게(F-107)", () => {
  const src = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8");
  const names = new Set();
  for (const m of src.matchAll(/\bask\(res,[^\n]*?, "([^"]+)"(?:, \{[^}\n]*\})?\);/g)) names.add(m[1]);
  for (const m of src.matchAll(/\{ label: "([^"]+)" \}/g)) names.add(m[1]);
  for (const m of src.matchAll(/LEDGER_LABEL = \{([^}]*)\}/g)) for (const v of m[1].matchAll(/: "([^"]+)"/g)) names.add(v[1]);
  for (const m of src.matchAll(/startTask\([^,\n]+, "([^"]+)"/g)) names.add(m[1]);
  assert.ok(names.has("1단계 초안") && names.has("판정") && names.size >= 8, `서버에서 이름을 찾는다 — ${[...names].join(", ")}`);
  const L = T.createLedger(mem(null), () => 1);
  for (const n of names) { L.add("floe", n, T.usageOf({ output_tokens: 1 }), null); assert.equal(L.snapshot().runs[0].label, n, `'${n}'이 'AI'가 됐다 — tokens.js LABEL`); }
});
