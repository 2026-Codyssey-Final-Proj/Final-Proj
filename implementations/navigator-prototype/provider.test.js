// claude-drafted: 2026-10-17 — 각자 자기 API 키로 쓰기. 실제 API는 부르지 않는다(가짜 클라이언트).
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("./provider.js");

const SCHEMA = { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false };
const KEY = "sk-ant-TESTKEY-do-not-leak-0000"; // secret-check: allow — 시험용 가짜 값(오류·로그에 새지 않는지 확인하는 용도)

// 가짜 클라이언트: 요청을 기록하고, 정해 둔 응답이나 오류를 돌려준다
function fake(answer) {
  const calls = [];
  const run = async (req) => { calls.push(req); if (answer instanceof Error) throw answer; return answer; };
  return { calls, client: { messages: { create: (r) => run({ ...r, via: "messages" }) }, beta: { messages: { create: (r) => run({ ...r, via: "beta" }) } } } };
}
const ok = (extra = {}) => ({
  stop_reason: "end_turn",
  content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify({ ok: true }) }],
  usage: { input_tokens: 100, output_tokens: 40, cache_creation_input_tokens: 10, cache_read_input_tokens: 5 },
  ...extra,
});
const memStore = (n = 0) => { const s = { n, load: () => s.n, save: (v) => { s.n = v; } }; return s; };
const make = (env, answer, { budget = null, used = 0, callCli } = {}) => {
  const f = fake(answer);
  const meter = P.createMeter(budget, memStore(used));
  const cli = callCli || (async () => ({ data: { via: "cli" }, tokens: 7 }));
  const callClaude = P.createCaller({ env, callCli: cli, makeClient: () => f.client, meter });
  return { callClaude, meter, ...f };
};

test("공급자 선택: 키가 있으면 api, 없으면 cli", () => {
  assert.equal(P.providerOf({ ANTHROPIC_API_KEY: KEY }), "api");
  assert.equal(P.providerOf({}), "cli");
  assert.equal(P.providerOf({ ANTHROPIC_API_KEY: "" }), "cli");
});

test("키가 없으면 지금처럼 claude -p(callCli)로 부른다 — 한도도 세지 않는다", async () => {
  const t = make({}, ok(), { budget: 1000 });
  const r = await t.callClaude("프롬프트", SCHEMA);
  assert.deepEqual(r.data, { via: "cli" });
  assert.equal(t.calls.length, 0);
  assert.equal(t.meter.used, 0);
});

test("API 요청 모양: 기본 모델, 구조화 출력, 낮은 effort, 폴백", async () => {
  const t = make({ ANTHROPIC_API_KEY: KEY }, ok());
  await t.callClaude("작업 글", SCHEMA);
  const req = t.calls[0];
  assert.equal(req.via, "beta");
  assert.equal(req.model, "claude-opus-5-5");
  assert.equal(req.max_tokens, 2048);
  assert.deepEqual(req.output_config, { effort: "low", format: { type: "json_schema", schema: SCHEMA } });
  assert.deepEqual(req.messages, [{ role: "user", content: "작업 글" }]);
  assert.deepEqual(req.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(req.fallbacks, "default");
  assert.equal(req.thinking, undefined, "Opus 5.5는 thinking을 끌 수 없다 — 보내지 않는다");
  assert.equal(req.tool_choice, undefined, "강제 tool_choice는 400");
});

test("환경변수로 모델·최대 토큰·effort를 바꾸고, 폴백을 끌 수 있다", async () => {
  const t = make({ ANTHROPIC_API_KEY: KEY, NAV_MODEL: "claude-haiku-5-5", NAV_MAX_TOKENS: "900", NAV_EFFORT: "medium", NAV_FALLBACK: "off" }, ok());
  await t.callClaude("x", SCHEMA);
  const req = t.calls[0];
  assert.equal(req.via, "messages");
  assert.equal(req.model, "claude-haiku-5-5");
  assert.equal(req.max_tokens, 900);
  assert.equal(req.output_config.effort, "medium");
  assert.equal(req.betas, undefined);
  assert.equal(req.fallbacks, undefined);
});

test("답 읽기: 글 칸만 JSON으로 읽고, 토큰은 입력·출력·캐시를 합친다", async () => {
  const t = make({ ANTHROPIC_API_KEY: KEY }, ok());
  const r = await t.callClaude("x", SCHEMA);
  assert.deepEqual(r.data, { ok: true });
  assert.equal(r.tokens, 155);
  assert.equal(t.meter.used, 155);
});

test("거절(refusal)과 잘림(max_tokens)은 이유를 알려 주고 데이터를 주지 않는다", async () => {
  for (const [reason, want] of [["refusal", /답하지 않/], ["max_tokens", /잘렸/]]) {
    const t = make({ ANTHROPIC_API_KEY: KEY }, ok({ stop_reason: reason }));
    const r = await t.callClaude("x", SCHEMA);
    assert.equal(r.data, undefined);
    assert.match(r.error, want);
    assert.equal(t.meter.used, 155, "물었으면 토큰은 쓴 것이다");
  }
});

test("JSON이 아니면 형식 오류", async () => {
  const t = make({ ANTHROPIC_API_KEY: KEY }, ok({ content: [{ type: "text", text: "그냥 글" }] }));
  const r = await t.callClaude("x", SCHEMA);
  assert.match(r.error, /형식/);
});

test("오류: 401은 키 확인, 429는 잠시 뒤, 그 밖은 연결 실패 — 키 값은 어디에도 나오지 않는다", async () => {
  for (const [status, want] of [[401, /키/], [403, /키/], [429, /잠시/], [500, /연결/]]) {
    const err = Object.assign(new Error(`boom ${KEY}`), { status });
    const t = make({ ANTHROPIC_API_KEY: KEY }, err);
    const r = await t.callClaude("x", SCHEMA);
    assert.match(r.error, want, String(status));
    assert.ok(!JSON.stringify(r).includes(KEY), "오류 결과에 키가 새면 안 된다");
  }
});

test("한도: 80%에서 warn, 100%에서 full — full이면 API를 부르지 않는다", async () => {
  const t = make({ ANTHROPIC_API_KEY: KEY }, ok(), { budget: 1000, used: 700 });
  assert.equal(t.meter.state(), "ok");
  await t.callClaude("x", SCHEMA);          // +155 → 855
  assert.equal(t.meter.state(), "warn");
  t.meter.add(145);                          // → 1000
  assert.equal(t.meter.state(), "full");
  const before = t.calls.length;
  const r = await t.callClaude("x", SCHEMA);
  assert.equal(t.calls.length, before, "한도가 차면 부르지 않는다");
  assert.match(r.error, /한도/);
});

test("한도가 없으면(NAV_TOKEN_BUDGET 미설정) 막지 않는다", () => {
  const m = P.createMeter(null, memStore(10 ** 9));
  assert.equal(m.state(), "ok");
});

test("사용량은 저장소에 남아 서버를 다시 켜도 이어진다", () => {
  const s = memStore(0);
  const a = P.createMeter(1000, s); a.add(300);
  const b = P.createMeter(1000, s);
  assert.equal(b.used, 300);
});

test("파일 저장소: 없거나 깨진 파일은 0에서 시작하고, 저장은 토큰 수만 쓴다", () => {
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "nav-usage-")), "u.json");
  const st = P.fileStore(file);
  assert.equal(st.load(), 0);
  fs.writeFileSync(file, "깨진 파일");
  assert.equal(st.load(), 0);
  st.save(1234);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { used: 1234 });
});

test("SDK가 없으면 npm install 안내를 준다", async () => {
  const meter = P.createMeter(null, memStore());
  const callClaude = P.createCaller({ env: { ANTHROPIC_API_KEY: KEY }, callCli: async () => ({}), makeClient: () => { throw new Error("Cannot find module"); }, meter });
  const r = await callClaude("x", SCHEMA);
  assert.match(r.error, /npm install/);
});

test("describe: 어느 공급자·모델·사용량인지 알려 주되 키는 담지 않는다", () => {
  const meter = P.createMeter(2000, memStore(500));
  const d = P.describe({ ANTHROPIC_API_KEY: KEY, NAV_TOKEN_BUDGET: "2000" }, meter);
  assert.deepEqual(d, { provider: "api", model: "claude-opus-5-5", host: "api.anthropic.com", compat: false, used: 500, budget: 2000, state: "ok" });
  assert.ok(!JSON.stringify(d).includes(KEY));
});

// ── 중계 서버(코디세이 가상 키) · 호환 모드 — 2026-10-17 ──
const PROXY = { ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: "https://proxy.example.test", NAV_MODEL: "claude-sonnet-4" };

test("호환 모드: 주소(ANTHROPIC_BASE_URL)를 바꾸면 자동으로 켜진다 — 새 기능 없이 JSON만 요청한다", async () => {
  const t = make(PROXY, ok());
  await t.callClaude("작업 글", SCHEMA);
  const req = t.calls[0];
  assert.equal(req.via, "messages", "베타·폴백을 쓰지 않는다");
  assert.equal(req.model, "claude-sonnet-4");
  assert.equal(req.output_config, undefined, "구조화 출력·effort는 새 모델에만 있다");
  assert.equal(req.betas, undefined);
  assert.equal(req.fallbacks, undefined);
  const sent = req.messages[0].content;
  assert.ok(sent.startsWith("작업 글"));
  assert.ok(sent.includes(JSON.stringify(SCHEMA)), "스키마를 글로 알려 준다");
});

test("호환 모드: NAV_COMPAT=0이면 주소가 있어도 끄고, =1이면 주소가 없어도 켠다", async () => {
  const off = make({ ...PROXY, NAV_COMPAT: "0" }, ok());
  await off.callClaude("x", SCHEMA);
  assert.equal(off.calls[0].via, "beta");
  assert.ok(off.calls[0].output_config);
  const on = make({ ANTHROPIC_API_KEY: KEY, NAV_COMPAT: "1" }, ok());
  await on.callClaude("x", SCHEMA);
  assert.equal(on.calls[0].via, "messages");
  assert.equal(on.calls[0].output_config, undefined);
});

test("호환 모드 답 읽기: 코드 블록이나 앞뒤 설명이 붙어도 JSON만 꺼낸다", async () => {
  for (const text of ["```json\n{\"ok\": true}\n```", "답입니다: {\"ok\": true} 끝", "{\"ok\": true}"]) {
    const t = make(PROXY, ok({ content: [{ type: "text", text }] }));
    const r = await t.callClaude("x", SCHEMA);
    assert.deepEqual(r.data, { ok: true }, text);
  }
});

test("호환 모드: JSON이 하나도 없으면 형식 오류", async () => {
  const t = make(PROXY, ok({ content: [{ type: "text", text: "죄송해요, 모르겠어요" }] }));
  assert.match((await t.callClaude("x", SCHEMA)).error, /형식/);
});

test("오류 문구에 응답 코드가 붙고, 400·404는 모델 이름과 호환 모드를 안내한다 — 키·메시지는 안 나온다", async () => {
  for (const [status, want] of [[401, /\(401\)/], [403, /\(403\)/], [400, /\(400\).*(모델|호환)/], [404, /\(404\).*(모델|호환)/]]) {
    const err = Object.assign(new Error(`boom ${KEY}`), { status });
    const r = await make(PROXY, err).callClaude("x", SCHEMA);
    assert.match(r.error, want, String(status));
    assert.ok(!JSON.stringify(r).includes(KEY));
  }
});

test("describe: 어느 주소로 보내는지(호스트만)와 호환 모드 여부를 알린다 — 주소 전체나 키는 담지 않는다", () => {
  const meter = P.createMeter(null, memStore(0));
  const d = P.describe({ ...PROXY, ANTHROPIC_BASE_URL: "https://proxy.example.test/v1?token=SECRET" }, meter);
  assert.equal(d.host, "proxy.example.test");
  assert.equal(d.compat, true);
  assert.ok(!JSON.stringify(d).includes("SECRET") && !JSON.stringify(d).includes(KEY));
  assert.equal(P.describe({ ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: "이상한 값" }, meter).host, "(주소 형식 오류)");
});

// ── 비밀값 파일이 실수로 올라가지 않게 ──
test(".gitignore는 .env뿐 아니라 .envtab·.env.bak 같은 변형도 막고, 틀 파일만 허용한다", () => {
  const fs = require("node:fs"), path = require("node:path");
  const lines = fs.readFileSync(path.join(__dirname, "../../.gitignore"), "utf8").split("\n").map((l) => l.trim());
  assert.ok(lines.includes(".env*"), ".env* 규칙이 있어야 한다");
  for (const keep of ["!.env.example", "!.env.sample", "!.env.template"]) assert.ok(lines.includes(keep), keep);
});

test(".env.example은 키 칸이 비어 있고 키처럼 생긴 값이 없다", () => {
  const fs = require("node:fs"), path = require("node:path");
  const text = fs.readFileSync(path.join(__dirname, ".env.example"), "utf8");
  assert.match(text, /^ANTHROPIC_API_KEY=\s*$/m);
  assert.ok(!/sk-[A-Za-z0-9_-]{10,}/.test(text));
});
