// claude-drafted: 2026-10-19 — 처음 설정의 서버 쪽 규칙(03-backend/navigator/setup-status.js)과, 처음 설정에서 키를 넣고 빼면 다시 켜지 않아도 바뀌는 provider.js.
// claude 명령 · 홈 폴더 파일은 가짜로 바꿔 끼운다 — 진짜 claude를 부르지 않고, 진짜 ~/.claude.json을 읽지 않는다.
// 실행: node --test 04-tests/navigator/setup-status.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Setup = require("../../03-backend/navigator/setup-status.js");
const P = require("../../03-backend/navigator/provider.js");   // claude 명령을 띄우는 곳은 provider.js 하나

const FAKE_KEY = "sk-" + "Kp7w".repeat(6);   // 시험에서만 — 소스에 키 모양이 남지 않게 실행할 때 만든다

test("claude 명령(provider.js claudeVersion): 있으면 판(版)까지, 없거나 실패하면 '없음' — --version만 묻는다(토큰 0)", () => {
  const seen = [];
  const ok = P.claudeVersion((cmd, args) => { seen.push([cmd, ...args]); return { status: 0, stdout: "2.1.30 (Claude Code)\n" }; });
  assert.deepEqual(ok, { found: true, version: "2.1.30" });
  assert.deepEqual(seen, [["claude", "--version"]]);
  assert.deepEqual(P.claudeVersion(() => ({ error: Object.assign(new Error("ENOENT"), { code: "ENOENT" }) })), { found: false, version: "" });
  assert.deepEqual(P.claudeVersion(() => ({ status: 1, stdout: "" })), { found: false, version: "" });
  assert.deepEqual(P.claudeVersion(() => { throw new Error("boom"); }), { found: false, version: "" });
  assert.deepEqual(P.claudeVersion(() => ({ status: 0, stdout: "알 수 없는 글" })), { found: true, version: "" }, "판을 못 읽어도 찾은 것은 찾은 것");
});

test("로그인: ~/.claude.json에 계정 칸이 있으면 true, 없으면 false, 파일이 없거나 깨졌으면 모름(null) — 내용은 내주지 않는다", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "floe-setup-"));
  try {
    assert.equal(Setup.signedIn(home), null);
    fs.writeFileSync(path.join(home, ".claude.json"), "{깨진");
    assert.equal(Setup.signedIn(home), null);
    fs.writeFileSync(path.join(home, ".claude.json"), JSON.stringify({ projects: {} }));
    assert.equal(Setup.signedIn(home), false);
    fs.writeFileSync(path.join(home, ".claude.json"), JSON.stringify({ oauthAccount: { emailAddress: "a@example.com" } }));
    assert.equal(Setup.signedIn(home), true);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("상태: 키 · 중계 서버 주소는 있다 · 없다만 — 값은 어디에도 없다. claude를 못 찾으면 로그인은 모름", () => {
  const env = { ANTHROPIC_API_KEY: FAKE_KEY, ANTHROPIC_BASE_URL: "https://relay.example/secret-path" };
  const st = Setup.status(env, { claude: { found: true, version: "2.1.30" }, login: true, build: "abc123def456" });
  assert.deepEqual(st, { provider: "api", apiKey: true, relay: true, claude: { found: true, version: "2.1.30", signedIn: true }, replay: false, build: "abc123def456" });
  const text = JSON.stringify(st);
  assert.ok(!text.includes(FAKE_KEY) && !text.includes("secret-path") && !text.includes("relay.example"));
  assert.deepEqual(Setup.status({}, { claude: { found: false, version: "" }, login: true }).claude, { found: false, version: "", signedIn: null });
  assert.equal(Setup.status({}).provider, "cli");
});

test("공급자 규칙은 provider.js와 같다 — 키가 있으면 api, 없으면 cli", () => {
  for (const env of [{}, { ANTHROPIC_API_KEY: FAKE_KEY }, { ANTHROPIC_API_KEY: "" }]) assert.equal(Setup.providerOf(env), P.providerOf(env));
});

test("지문(build): 같은 코드면 놓인 자리가 달라도 같고, 한 글자만 바뀌어도 다르다", () => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), "floe-build-a-")), b = fs.mkdtempSync(path.join(os.tmpdir(), "floe-build-b-"));
  try {
    for (const root of [a, b]) {
      fs.mkdirSync(path.join(root, "navigator"), { recursive: true });
      fs.writeFileSync(path.join(root, "navigator", "app.js"), "화면 1");
      fs.writeFileSync(path.join(root, "navigator", "server.js"), "서버 1");
    }
    const files = (root) => ["app.js", "server.js"].map((f) => path.join(root, "navigator", f));
    const id = Setup.buildId(files(a));
    assert.match(id, /^[0-9a-f]{12}$/);
    assert.equal(Setup.buildId(files(b)), id, "저장소에서 켜든 앱 묶음(payload/)에서 켜든 같은 코드면 같은 지문");
    assert.equal(Setup.buildId([...files(a)].reverse()), id, "순서와 상관없다");
    fs.writeFileSync(path.join(b, "navigator", "app.js"), "화면 2");
    assert.notEqual(Setup.buildId(files(b)), id, "옛 코드는 다른 지문");
  } finally { for (const d of [a, b]) fs.rmSync(d, { recursive: true, force: true }); }
});

test("처음 설정에서 키 · 중계 서버를 바꾸면 다시 켜지 않아도 다음 호출부터 그 값으로 — 클라이언트를 새로 만든다", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "floe-provider-"));
  try {
    const reply = { stop_reason: "end_turn", usage: { input_tokens: 5, output_tokens: 2 }, content: [{ type: "text", text: JSON.stringify({ ok: true }) }] };
    const asks = [];
    const env = { ANTHROPIC_API_KEY: FAKE_KEY };
    let made = 0;
    const makeClient = () => { made++; const create = async (a) => { asks.push(a.model); return reply; }; return { beta: { messages: { create } }, messages: { create } }; };
    const call = P.createCaller({ env, makeClient, meter: P.createMeter(null, P.fileStore(path.join(tmp, "u.json"))) });
    assert.deepEqual((await call(Setup.CHECK_PROMPT, Setup.CHECK_SCHEMA)).data, { ok: true });
    await call(Setup.CHECK_PROMPT, Setup.CHECK_SCHEMA);
    assert.equal(made, 1, "같은 키면 클라이언트를 다시 만들지 않는다");
    env.ANTHROPIC_API_KEY = FAKE_KEY + "2";
    await call(Setup.CHECK_PROMPT, Setup.CHECK_SCHEMA);
    assert.equal(made, 2, "키가 바뀌면 새 클라이언트");
    env.ANTHROPIC_BASE_URL = "https://relay.example";
    await call(Setup.CHECK_PROMPT, Setup.CHECK_SCHEMA);
    assert.equal(made, 3, "중계 서버 주소가 바뀌어도 새 클라이언트");
    assert.notEqual(asks[asks.length - 1], asks[0], "중계 서버로 바뀌면 그에 맞는 모델로(설정을 부를 때마다 다시 읽는다)");
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
