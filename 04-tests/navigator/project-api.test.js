// claude-drafted: 2026-10-24 — C-31 시작하는 자리 · F-49(플로로가 프로젝트를 몰랐다) · 토큰 장부. 코드보다 먼저 썼다(code.md 1번).
// 서버(server.js)가 작업 폴더를 **앱에게서** 바로 안다(useProject — 같은 프로세스에서만, HTTP로는 받지 않는다). 그래서 Claude Code를 그 폴더에서 한 번 열지 않아도
// 일 넘기기 · 책(README) · GitHub 칸이 그 폴더에서 돈다. 맡긴 일이 끝나면 Claude Code의 결과(가짜)에서 토큰 · 비용만 장부에 남는다.
// 실행: node --test 04-tests/navigator/project-api.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-projapi-"));
const STUB = path.join(TMP, "claude-stub.js"), STUB_OUT = path.join(TMP, "stub-out.json");
// 가짜 claude — 받은 것을 적고, Claude Code처럼 결과 한 덩이(JSON)를 내고 끝난다
fs.writeFileSync(STUB, `const fs = require("node:fs"); let i = ""; process.stdin.on("data", (d) => (i += d)); process.stdin.on("end", () => {
  fs.writeFileSync(${JSON.stringify(STUB_OUT)}, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), stdin: i }));
  process.stdout.write(JSON.stringify({ type: "result", subtype: "success", is_error: false, num_turns: 2, duration_ms: 300, result: "비밀 답 글", total_cost_usd: 0.0042,
    usage: { input_tokens: 20, output_tokens: 80, cache_creation_input_tokens: 400, cache_read_input_tokens: 1500 } }));
  setTimeout(() => process.exit(0), 150); });`);

Object.assign(process.env, {
  NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: STUB,
});
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];

let Srv, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const token = () => fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
function call(method, url, { body, token: withTok = true } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const h = { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), ...(withTok ? { "X-Nav-Token": token() } : {}) };
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: h, timeout: 5000 }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("useProject: 절대 경로의 있는 폴더만 받는다 — HTTP 주소로는 열지 않는다(내보내기만)", () => {
  assert.equal(typeof Srv.useProject, "function");
  assert.equal(Srv.useProject("relative/dir"), false);
  assert.equal(Srv.useProject(path.join(TMP, "없는-폴더")), false);
  assert.equal(Srv.useProject(STUB), false, "파일은 안 된다");
  assert.equal(Srv.useProject(""), false);
});

test("앱이 정한 폴더로 바로 — 훅 알림 없이도 GitHub 칸 · 책(README) · 일 넘기기가 그 폴더에서, 경로는 답에 나가지 않는다", async () => {
  const dir = path.join(TMP, "test-1");
  fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, "README.md"), "# test-1\n\n미션 1을 기록해요\n");
  assert.equal((await call("GET", "/api/readme")).json.why, "folder", "아직 모른다");
  assert.equal(Srv.useProject(dir), true);
  const g = (await call("GET", "/api/github")).json;
  assert.equal(g.project, "test-1"); assert.notEqual(g.why, "folder");
  const book = (await call("GET", "/api/readme")).json;
  assert.equal(book.project, "test-1"); assert.ok(book.book, "README를 읽는다");
  for (const r of [g, book]) assert.ok(!JSON.stringify(r).includes(TMP), "폴더 경로는 나가지 않는다");
  const start = await call("POST", "/api/task/start", { body: { text: "README에 미션 1 문제를 한 줄로 적어 줘" } });
  assert.equal(start.status, 200, start.text); assert.equal(start.json.project, "test-1");
  await wait(600);
  const out = JSON.parse(fs.readFileSync(STUB_OUT, "utf8"));
  assert.equal(fs.realpathSync(out.cwd), fs.realpathSync(dir), "그 폴더에서 Claude Code를 연다");
  assert.ok(out.argv.includes("-p") && out.argv.join(" ").includes("--output-format json"), out.argv.join(" "));
});

test("앱이 정한 폴더가 훅으로 안 다른 폴더보다 먼저다(사용자가 앱에서 고른 자리 — C-31 '플로로가 움직이는 자리')", async () => {
  const other = fs.mkdtempSync(path.join(TMP, "other-"));
  assert.equal((await call("POST", "/api/event", { body: { hook_event_name: "UserPromptSubmit", session_id: "s-2", cwd: other, prompt: "안녕" } })).json.ok, true);
  assert.equal((await call("GET", "/api/github")).json.project, "test-1");
});

test("맡긴 일이 끝나면 장부에 task로 — Claude Code가 알려 준 토큰 · 비용만, 답 글은 남지 않는다. /api/task에도 이번 토큰", async () => {
  const t = (await call("GET", "/api/task")).json.task;
  assert.equal(t.state, "done"); assert.equal(t.tokens, 2000); assert.equal(t.cost, 0.0042);
  const u = (await call("GET", "/api/usage")).json;
  assert.deepEqual(u.ledger.kinds.task, { count: 1, tokens: 2000, cost: 0.0042 });
  assert.equal(u.ledger.runs[0].label, "맡긴 일");
  assert.ok(!JSON.stringify(u).includes("비밀 답 글"));
  const file = fs.readFileSync(path.join(TMP, "usage-tokens.json"), "utf8");
  assert.ok(file.includes("2000") && !file.includes("비밀 답 글") && !file.includes(TMP), "파일에도 숫자 · 이름만");
});

test("저장소 만들기를 맡기면 장부 이름이 '저장소 만들기'", async () => {
  const r = await call("POST", "/api/github/create", { body: { visibility: "private" } });
  assert.equal(r.status, 200, r.text);
  await wait(600);
  assert.equal((await call("GET", "/api/usage")).json.ledger.runs[0].label, "저장소 만들기");
  assert.match(JSON.parse(fs.readFileSync(STUB_OUT, "utf8")).stdin, /gh repo create test-1 --private/);
});

test("dropProject: 연결을 뺀 폴더가 앱이 고른 폴더면 잊는다 — 다른 폴더는 그대로, 그 뒤로는 훅 알림의 폴더로", async () => {
  assert.equal(Srv.dropProject(path.join(TMP, "다른-폴더")), false, "다른 폴더면 그대로");
  assert.equal((await call("GET", "/api/github")).json.project, "test-1");
  assert.equal(Srv.dropProject(path.join(TMP, "test-1")), true);
  assert.notEqual((await call("GET", "/api/github")).json.project, "test-1", "잊은 뒤에는 훅 알림의 폴더(other-…)");
  assert.equal(Srv.useProject(path.join(TMP, "test-1")), true, "다시 고를 수 있다");
});

test("dropProject: 훅 알림으로 안 같은 폴더도 잊는다 — 맡긴 일이 그 폴더에서 돌면 훅 알림이 쌓이므로(2차 리뷰)", async () => {
  const dir = path.join(TMP, "test-1");
  assert.equal((await call("POST", "/api/event", { body: { hook_event_name: "UserPromptSubmit", session_id: "s-3", cwd: dir, prompt: "안녕" } })).json.ok, true);
  assert.equal(Srv.dropProject(dir), true);
  assert.notEqual((await call("GET", "/api/github")).json.project, "test-1", "앱이 고른 폴더도 훅 알림의 같은 폴더도 잊었다");
  assert.equal(Srv.useProject(dir), true);
});

test("새로 재기: POST /api/usage/reset — 확인 값이 있어야, 장부를 0부터", async () => {
  assert.equal((await call("POST", "/api/usage/reset", { token: false })).status, 403);
  const r = await call("POST", "/api/usage/reset");
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.ledger.total.count, 0);
  assert.equal((await call("GET", "/api/usage")).json.ledger.total.tokens, 0);
});
