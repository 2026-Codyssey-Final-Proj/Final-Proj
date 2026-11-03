// claude-drafted: 2026-10-28 — F-69 맡긴 일이 허락을 못 받으면 '끝남'이 아니라 '막힘'(이재엽 "결과물이 안나오는 문제 해결", 결정 모음 A-03).
// 코드보다 먼저 썼다(code.md 1번). 진짜 AI · 진짜 Claude Code는 부르지 않는다 — 가짜 claude가 결과 한 덩이(permission_denials 포함)를 낸다.
//   ① tokens.js denialsOf — 거절된 도구의 이름 · 개수만(도구 입력은 읽지 않는다)
//   ② connect.js hookReady — 폴더 · 사용자 설정에 우리 허락 훅이 있고 그 파일이 있나(없음 none · 옛 자리 moved)
//   ③ server.js — 훅이 없으면 맡기지 않는다(409 why hook) · 거절이 있으면 state blocked + 까닭(종류 · 개수 · 카드에 어떻게 답했나) · 같은 일을 같은 번호로 다시(again · files-only) · 직접 하기 글(brief)
// 실행: node --test 04-tests/navigator/task-blocked.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const Tokens = require(path.join(BACK, "tokens.js"));
const C = require(path.join(BACK, "connect.js"));
const AP = require(path.join(BACK, "approve.js"));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-blocked-"));
const STUB = path.join(TMP, "claude-stub.js"), STUB_OUT = path.join(TMP, "stub-out.json"), PLAN = path.join(TMP, "plan.json");
// 가짜 claude — 받은 글을 적고, plan.json대로 결과 한 덩이를 낸다(거절 목록 · 기다림 · 끝 코드)
fs.writeFileSync(STUB, `const fs = require("node:fs"); let i = ""; process.stdin.on("data", (d) => (i += d)); process.stdin.on("end", () => {
  const p = JSON.parse(fs.readFileSync(process.env.STUB_PLAN, "utf8"));
  fs.writeFileSync(${JSON.stringify(STUB_OUT)}, JSON.stringify({ stdin: i, n: (p.n || 0) }));
  setTimeout(() => { process.stdout.write(JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "끝", usage: { input_tokens: 10, output_tokens: 5 },
    permission_denials: p.denials || [], ...(p.report ? { structured_output: p.report } : {}), ...(p.isError ? { is_error: true, subtype: "error_during_execution" } : {}) })); process.exit(p.exit || 0); }, p.delay || 300); });`);
const plan = (p) => fs.writeFileSync(PLAN, JSON.stringify(p));

const HOME = path.join(TMP, "claude-home-empty");   // 사용자 설정에 훅이 없는 컴퓨터
fs.mkdirSync(HOME);
Object.assign(process.env, {
  NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"),
  NAV_APPROVAL_WAIT: "300", NAV_CLAUDE_BIN: STUB, STUB_PLAN: PLAN, CLAUDE_CONFIG_DIR: HOME,
});
fs.writeFileSync(process.env.NAV_REPLAY, "{}");
for (const k of ["NAV_RECORD", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];

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
function call(method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: { ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), "X-Nav-Token": token() }, timeout: 5000 }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const task = async () => (await call("GET", "/api/task")).json.task;
async function until(fn, ms = 4000) { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v || Date.now() > end) return v; await wait(60); } }
const hooked = (dir) => { fs.mkdirSync(path.join(dir, ".claude"), { recursive: true }); fs.writeFileSync(path.join(dir, ".claude", "settings.local.json"), JSON.stringify(C.addHooks({}, C.COMMAND))); return dir; };

// ════════ ① 거절 목록 ════════
test("denialsOf — 거절된 도구의 이름 · 개수만 센다. 도구 입력(명령 · 파일 글)은 담지 않는다, 이상한 이름은 other", () => {
  const j = { type: "result", permission_denials: [
    { tool_name: "Write", tool_use_id: "a", tool_input: { file_path: "/Users/me/x.js", content: "비밀 sk-abc" } },
    { tool_name: "Bash", tool_use_id: "b", tool_input: { command: "rm -rf /" } },
    { tool_name: "Write", tool_use_id: "c", tool_input: {} }, { tool_name: "이상한 이름 <script>", tool_input: {} }, null] };
  const d = Tokens.denialsOf(j);
  assert.deepEqual(d, { count: 5, tools: { Write: 2, Bash: 1, other: 2 } });
  assert.ok(!JSON.stringify(d).includes("rm -rf") && !JSON.stringify(d).includes("sk-abc"));
  assert.deepEqual(Tokens.denialsOf({ type: "result" }), { count: 0, tools: {} }, "거절 목록이 없으면 0");
  assert.deepEqual(Tokens.denialsOf(null), { count: 0, tools: {} });
});

// ════════ ② 허락 훅이 있나 ════════
test("hookReady — 폴더의 settings.local.json · settings.json, 사용자 설정(configDir) 중 하나에 우리 허락 훅이 있고 그 파일이 있으면 ok", () => {
  const d = fs.mkdtempSync(path.join(TMP, "proj-")), home = fs.mkdtempSync(path.join(TMP, "home-"));
  assert.deepEqual(C.hookReady(d, { configDir: home }), { ok: false, why: "none" }, "아무 데도 없으면 none");
  fs.mkdirSync(path.join(d, ".claude"));
  fs.writeFileSync(path.join(d, ".claude", "settings.local.json"), JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: C.COMMAND }] }] } }));
  assert.equal(C.hookReady(d, { configDir: home }).why, "none", "알림 훅만 있고 허락 훅이 없으면 none");
  fs.writeFileSync(path.join(d, ".claude", "settings.local.json"), "{ 깨진 JSON");
  assert.equal(C.hookReady(d, { configDir: home }).why, "none", "읽지 못하는 파일은 없는 것으로");
  hooked(d);
  assert.deepEqual(C.hookReady(d, { configDir: home }), { ok: true });
  const old = C.addHooks({}, 'node "/없는/자리/03-backend/navigator/hook.js"');
  fs.writeFileSync(path.join(d, ".claude", "settings.local.json"), JSON.stringify(old));
  assert.deepEqual(C.hookReady(d, { configDir: home }), { ok: false, why: "moved" }, "훅이 가리키는 파일이 없으면(앱 자리가 바뀜) moved");
  fs.writeFileSync(path.join(home, "settings.json"), JSON.stringify(C.addHooks({}, C.COMMAND)));
  assert.deepEqual(C.hookReady(d, { configDir: home }), { ok: true }, "사용자 설정에 있으면 ok");
});

// ════════ ③ 서버 ════════
test("훅이 없는 폴더에는 맡기지 않는다 — 409 why hook, 까닭은 다시 연결하라는 말. 맡긴 일도 생기지 않는다", async () => {
  const d = fs.mkdtempSync(path.join(TMP, "nohook-"));
  assert.equal(Srv.useProject(d), true);
  plan({ delay: 50 });
  const r = await call("POST", "/api/task/start", { text: "뼈대 코드를 만들어 주세요" });
  assert.equal(r.status, 409, r.text);
  assert.equal(r.json.ok, false); assert.equal(r.json.why, "hook"); assert.match(r.json.reason, /허락/); assert.match(r.json.reason, /연결/);
  assert.equal(await task(), null, "맡긴 일이 없다");
  const old = C.addHooks({}, 'node "/없는/자리/03-backend/navigator/hook.js"');
  fs.mkdirSync(path.join(d, ".claude")); fs.writeFileSync(path.join(d, ".claude", "settings.local.json"), JSON.stringify(old));
  const m = await call("POST", "/api/task/start", { text: "뼈대 코드를 만들어 주세요" });
  assert.equal(m.status, 409); assert.equal(m.json.why, "hook"); assert.match(m.json.reason, /옛 자리|다시 연결/);
});

let dir;
test("거절이 있으면 끝 코드 0이어도 state blocked — 까닭은 종류(파일 쓰기 · 명령) · 개수 · 카드에 답이 없었는지. 도구 입력은 나가지 않는다", async () => {
  dir = hooked(fs.mkdtempSync(path.join(TMP, "proj-")));
  assert.equal(Srv.useProject(dir), true);
  plan({ delay: 900, n: 1, denials: [{ tool_name: "Write", tool_input: { file_path: `${dir}/app.js`, content: "비밀 문장" } }, { tool_name: "Bash", tool_input: { command: "npm test" } }, { tool_name: "Edit", tool_input: {} }] });
  const r = await call("POST", "/api/task/start", { text: "뼈대 코드를 만들어 주세요", checks: ["README에 실행 명령 한 줄"] });
  assert.equal(r.status, 200, r.text);
  const at = r.json.task.at;
  assert.equal(r.json.task.try, 0); assert.equal(r.json.task.blocked, null);
  // 그동안 허락 카드 하나가 왔는데 아무도 누르지 않았다(none) — 까닭에 '카드를 못 누름'으로 센다
  const ev = { hook_event_name: "PermissionRequest", session_id: "s-1", cwd: dir, tool_name: "Write", tool_input: { file_path: `${dir}/app.js`, content: "x" } };
  const held = call("POST", "/api/approval", { id: "req-blocked-0001", sig: AP.sig(ev), session_id: "s-1", cwd: dir, tool: "claude", tool_name: "Write", card: AP.card(ev) });
  assert.equal((await held).json.decision, "none");
  const t = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t.state, "blocked", JSON.stringify(t)); assert.equal(t.code, 0); assert.equal(t.at, at);
  assert.deepEqual(t.blocked, { count: 3, kinds: [{ what: "파일 쓰기", n: 2 }, { what: "명령", n: 1 }], asks: { allow: 0, deny: 0, none: 1 } });
  const all = JSON.stringify(t);
  assert.ok(!all.includes("비밀 문장") && !all.includes("npm test") && !all.includes(dir), "도구 입력 · 경로는 나가지 않는다");
});

test("다시 맡기기 — 같은 일을 같은 번호(at)로 다시 연다(try 1). 명령 없이(files-only)는 끝에 한 줄을 더한다. 진행 중 · 다른 번호 · 모르는 길은 거절", async () => {
  const t0 = await task();
  assert.equal((await call("POST", "/api/task/retry", { at: t0.at + 1, way: "again" })).status, 409, "다른 번호");
  assert.equal((await call("POST", "/api/task/retry", { at: t0.at, way: "몰래 허용" })).status, 400, "모르는 길");
  plan({ delay: 500, n: 2, denials: [{ tool_name: "Bash", tool_input: {} }] });
  const r = await call("POST", "/api/task/retry", { at: t0.at, way: "again" });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.task.at, t0.at, "같은 번호 — 지켜보던 화면이 그대로 따라간다"); assert.equal(r.json.task.try, 1); assert.equal(r.json.task.state, "running");
  assert.equal((await call("POST", "/api/task/retry", { at: t0.at, way: "again" })).status, 409, "진행 중이면 다시 못 맡김");
  const t1 = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t1.state, "blocked"); assert.deepEqual(t1.blocked.kinds, [{ what: "명령", n: 1 }]); assert.deepEqual(t1.blocked.asks, { allow: 0, deny: 0, none: 0 }, "카드 수는 이번 시도만");
  const first = JSON.parse(fs.readFileSync(STUB_OUT, "utf8"));
  assert.match(first.stdin, /뼈대 코드를 만들어 주세요/); assert.match(first.stdin, /README에 실행 명령 한 줄/, "기준도 그대로");
  plan({ delay: 200, n: 3 });
  const f = await call("POST", "/api/task/retry", { at: t0.at, way: "files-only" });
  assert.equal(f.status, 200, f.text); assert.equal(f.json.task.try, 2);
  const t2 = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t2.state, "done", "거절이 없으면 끝남"); assert.equal(t2.blocked, null);
  const sent = JSON.parse(fs.readFileSync(STUB_OUT, "utf8")).stdin;
  assert.match(sent, /명령/); assert.match(sent, /README/); assert.equal((sent.match(/뼈대 코드를 만들어 주세요/g) || []).length, 1);
  assert.equal((await call("POST", "/api/task/retry", { at: t0.at, way: "again" })).status, 409, "끝난 일은 다시 맡기지 않는다(새로 맡긴다)");
});

test("직접 하기 — brief는 맡길 글과 끝 조건을 돌려주고 아무것도 열지 않는다. 경로는 가린다", async () => {
  plan({ delay: 200, denials: [{ tool_name: "Write", tool_input: {} }] });
  const r = await call("POST", "/api/task/start", { text: `${dir}/src 아래에 뼈대를 만들어 주세요`, checks: ["README에 실행 명령 한 줄"] });
  assert.equal(r.status, 200, r.text);
  const t = await until(async () => { const x = await task(); return x && x.state === "blocked" ? x : null; });
  const b = await call("POST", "/api/task/retry", { at: t.at, way: "brief" });
  assert.equal(b.status, 200, b.text); assert.deepEqual(Object.keys(b.json).sort(), ["brief", "ok"]);
  assert.match(b.json.brief, /뼈대를 만들어 주세요/); assert.match(b.json.brief, /README에 실행 명령 한 줄/);
  assert.ok(!b.json.brief.includes(dir), "작업 폴더 경로는 '.'으로");
  assert.equal((await task()).state, "blocked", "직접 하기는 아무것도 열지 않는다");
});

test("허락 카드에 사람이 답하면 그 답을 센다 — 거절(deny)은 deny로, 허용은 allow로(거절 둘 중 하나만 사람이 눌렀으니 막힘)", async () => {
  plan({ delay: 900, denials: [{ tool_name: "Bash", tool_input: {} }, { tool_name: "Bash", tool_input: {} }] });
  const r = await call("POST", "/api/task/start", { text: "돌려 보기" });
  assert.equal(r.status, 200, r.text);
  const mk = (id, cmd) => { const ev = { hook_event_name: "PermissionRequest", session_id: "s-2", cwd: dir, tool_name: "Bash", tool_input: { command: cmd } }; return { id, sig: AP.sig(ev), session_id: "s-2", cwd: dir, tool: "claude", tool_name: "Bash", card: AP.card(ev) }; };
  const a = mk("req-blocked-0002", "node app.js"), b = mk("req-blocked-0003", "ls");
  const ha = call("POST", "/api/approval", a), hb = call("POST", "/api/approval", b);
  await wait(80);
  assert.equal((await call("POST", "/api/approvals/decide", { id: a.id, sig: a.sig, decision: "deny" })).status, 200);
  assert.equal((await call("POST", "/api/approvals/decide", { id: b.id, sig: b.sig, decision: "allow" })).status, 200);
  await ha; await hb;
  const t = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t.state, "blocked"); assert.deepEqual(t.blocked.asks, { allow: 1, deny: 1, none: 0 });
});

// 진짜 Claude Code로 본 일(2026-10-28): 사람이 섬에서 위험해 보이는 명령 둘을 '거절'했지만 다른 길로 일을 해냈다 — 사람이 고른 거절만 있으면 막힘 카드를 띄우지 않는다.
//   기계 신호로만 가른다(모델의 보고를 믿지 않는다 — 새 맥락 리뷰 2026-10-28): 거절 수가 섬에서 누른 '거절' 수 안이면 done(+ denied 수), 답이 없거나 카드가 안 뜬 거절이 있으면 blocked
test("거절이 모두 사람이 섬에서 누른 '거절'이면 done(denied에 수), 하나라도 답 없이 막혔으면 보고가 다 해냄이어도 blocked", async () => {
  const ok = { items: [{ check: "README에 실행 명령 한 줄", done: true, evidence: "README.md" }], easy: "뼈대를 만들었어요.", ask: "" };
  plan({ delay: 700, denials: [{ tool_name: "Bash", tool_input: {} }, { tool_name: "Bash", tool_input: {} }], report: ok });
  assert.equal((await call("POST", "/api/task/start", { text: "뼈대", checks: ["README에 실행 명령 한 줄"] })).status, 200);
  const mk = (id) => { const ev = { hook_event_name: "PermissionRequest", session_id: "s-d", cwd: dir, tool_name: "Bash", tool_input: { command: `rm -rf ${id}` } }; return { id, sig: AP.sig(ev), session_id: "s-d", cwd: dir, tool: "claude", tool_name: "Bash", card: AP.card(ev) }; };
  const a = mk("req-deny-00001"), b = mk("req-deny-00002"), ha = call("POST", "/api/approval", a), hb = call("POST", "/api/approval", b);
  await wait(80);
  for (const x of [a, b]) assert.equal((await call("POST", "/api/approvals/decide", { id: x.id, sig: x.sig, decision: "deny" })).status, 200);
  await ha; await hb;
  let t = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t.state, "done", JSON.stringify(t)); assert.equal(t.blocked, null); assert.equal(t.denied, 2, "화면이 '거절한 2번은 하지 않았어요'를 말할 수 있게");
  plan({ delay: 150, denials: [{ tool_name: "Write", tool_input: {} }], report: ok });
  assert.equal((await call("POST", "/api/task/start", { text: "뼈대", checks: ["README에 실행 명령 한 줄"] })).status, 200);
  t = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t.state, "blocked", "카드에 답이 없었던 거절 — 보고가 '해냄'이어도 막힘(모델의 보고를 믿지 않는다)");
});

test("결과가 is_error면 끝 코드 0이어도 failed, 다른 폴더에서 누른 허락 답은 이 일의 수로 세지 않는다", async () => {
  plan({ delay: 150, isError: true });
  assert.equal((await call("POST", "/api/task/start", { text: "오류 나는 일" })).status, 200);
  assert.equal((await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; })).state, "failed");
  plan({ delay: 700, denials: [{ tool_name: "Bash", tool_input: {} }] });
  assert.equal((await call("POST", "/api/task/start", { text: "다른 폴더 답" })).status, 200);
  const other = fs.mkdtempSync(path.join(TMP, "elsewhere-"));
  const ev = { hook_event_name: "PermissionRequest", session_id: "s-o", cwd: other, tool_name: "Bash", tool_input: { command: "ls" } };
  const x = { id: "req-other-0001", sig: AP.sig(ev), session_id: "s-o", cwd: other, tool: "claude", tool_name: "Bash", card: AP.card(ev) }, h = call("POST", "/api/approval", x);
  await wait(80); await call("POST", "/api/approvals/decide", { id: x.id, sig: x.sig, decision: "deny" }); await h;
  const t = await until(async () => { const y = await task(); return y && y.state !== "running" ? y : null; });
  assert.equal(t.state, "blocked"); assert.deepEqual(t.blocked.asks, { allow: 0, deny: 0, none: 0 }, "다른 폴더의 거절은 세지 않는다");
});

test("끝 코드가 0이 아니면 전처럼 failed — 막힘(blocked)은 끝 코드 0 + 거절일 때만", async () => {
  plan({ delay: 100, exit: 1, denials: [{ tool_name: "Write", tool_input: {} }] });
  assert.equal((await call("POST", "/api/task/start", { text: "실패하는 일" })).status, 200);
  const t = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t.state, "failed"); assert.equal(t.blocked, null);
  const r = await call("POST", "/api/task/retry", { at: t.at, way: "again" });
  assert.equal(r.status, 200, "실패한 일도 다시 맡길 수 있다"); await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
});

// ════════ C-50 맡긴 일이 멈추면(결정 모음 A-06 — 시간 값은 리허설에서 재서 정함, 그때까지 2분 · 5분 · 15분. 끄지 않고 A-03의 선택창으로) ════════
test("C-50 조용한 시간(quiet, 초) — 도는 동안 늘고, 그 폴더의 훅 알림 · 허락 카드가 오면 0으로. 끝나면 0", async () => {
  plan({ delay: 4000 });
  const r = await call("POST", "/api/task/start", { text: "오래 걸리는 일" });
  assert.equal(r.status, 200, r.text); assert.equal(r.json.task.quiet, 0);
  await wait(1300);
  assert.ok((await task()).quiet >= 1, "조용하면 는다");
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });   // Claude Code는 있는 폴더(실제 경로)를 보낸다
  assert.equal((await call("POST", "/api/event", { hook_event_name: "PostToolUse", session_id: "s-q", cwd: path.join(dir, "src"), tool_name: "Write", tool_input: { file_path: "a.js" } })).status, 200);
  assert.equal((await task()).quiet, 0, "그 폴더(안)의 훅 알림이 오면 0");
  await wait(1100);
  await call("POST", "/api/event", { hook_event_name: "PostToolUse", session_id: "s-x", cwd: fs.mkdtempSync(path.join(TMP, "other-")), tool_name: "Write", tool_input: { file_path: "b.js" } });
  assert.ok((await task()).quiet >= 1, "다른 폴더의 알림은 세지 않는다");
});

test("C-50 멈추기 — 사람이 고를 때만(stop): 그 번호의 도는 일만 끄고 state stopped, 다시 맡길 수 있다. 직접 하기 글은 도는 중에도", async () => {
  const t0 = await task(); assert.equal(t0.state, "running");
  const b = await call("POST", "/api/task/retry", { at: t0.at, way: "brief" });
  assert.equal(b.status, 200, "직접 하기 글은 도는 중에도(멈췄다고 본 때 선택창에서)"); assert.match(b.json.brief, /오래 걸리는 일/);
  assert.equal((await call("POST", "/api/task/stop", { at: t0.at + 1 })).status, 409, "다른 번호");
  const s = await call("POST", "/api/task/stop", { at: t0.at });
  assert.equal(s.status, 200, s.text);
  const t = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t.state, "stopped"); assert.equal(t.blocked, null);
  assert.equal((await call("POST", "/api/task/stop", { at: t0.at })).status, 409, "이미 멈춘 일");
  plan({ delay: 100 });
  const again = await call("POST", "/api/task/retry", { at: t0.at, way: "again" });
  assert.equal(again.status, 200, again.text); assert.equal(again.json.task.try, 1);
  assert.equal((await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; })).state, "done");
});

// claude-drafted: 2026-11-02 — F-118: 앱(트레이 'Floe 끄기')을 꺼도 맡긴 claude와 그 자식(npm · 개발 서버)이 남아 폴더를 고치고 포트를 붙잡았다.
//   끌 때(before-quit) 서버의 stopTasks가 도는 일을 나무째 끈다. 도는 일이 없으면 아무것도 하지 않는다
test("앱을 끄면 도는 일을 끈다(stopTasks · F-118)", async () => {
  assert.equal(Srv.stopTasks(), null, "도는 일이 없으면 기다릴 것도 없다 — 끄기를 늦추지 않는다");
  plan({ delay: 4000 });
  const r = await call("POST", "/api/task/start", { text: "끄기 전에 도는 일" });
  assert.equal(r.status, 200, r.text);
  const ended = Srv.stopTasks();
  assert.ok(ended && typeof ended.then === "function", "도는 일이 있으면 끝날 때까지 기다릴 약속");
  await ended;   // claude가 끝난 뒤에 풀린다 — 앱은 그때 끈다(먼저 끄면 Windows의 taskkill /T가 claude를 못 찾아 손자 프로세스가 남는다, 새 맥락 리뷰)
  assert.equal((await task()).state, "stopped", "기다림이 풀렸을 때는 이미 끝났다");
  const main = fs.readFileSync(path.join(__dirname, "../../02-frontend/electron/main.js"), "utf8");
  const at = main.indexOf('app.on("before-quit"');
  assert.ok(at >= 0, "앱이 끌 때 부른다");
  assert.match(main.slice(at, at + 600), /Server\.stopTasks\(\)[\s\S]*e\.preventDefault\(\)[\s\S]*app\.quit\(\)/, "도는 일이 있으면 끄기를 멈추고 끝난 뒤 다시 끈다");
});

test("화면: 허락 카드 · 막힌 일 · 멈춘 것 같은 일이 있으면 섬을 저절로 접지 않는다(pinned) — 사람이 고를 때까지(새 맥락 리뷰 2026-10-28 막힘 3)", () => {
  const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  const pin = a.slice(a.indexOf("const pinned = () =>"), a.indexOf("\n", a.indexOf("const pinned = () =>")));
  assert.match(pin, /st\.apWait/); assert.match(pin, /st\.blocked && !st\.blocked\.retrying/); assert.match(pin, /st\.stall && st\.stall\.lv !== "calm"/);
  assert.match(a, /st\.apWait = approvals\.length > 0;/, "허락 카드가 있는 동안");
});

// claude-drafted: 2026-11-03 — F-139 다시 맡기기는 처음 맡긴 폴더에서만. 전에는 그때 연결된 폴더(projectNow)를 다시 골라 A 폴더의 요구가 B 저장소에서 돌았다
test("F-139 그사이 연결한 폴더가 바뀌면 다시 맡기지 않는다(409) — 처음 폴더로 돌아오면 다시 맡긴다", async () => {
  await until(async () => { const x = await task(); return !x || x.state !== "running"; });
  const a = hooked(fs.mkdtempSync(path.join(TMP, "proj-a-"))), b = hooked(fs.mkdtempSync(path.join(TMP, "proj-b-")));
  assert.equal(Srv.useProject(a), true);
  plan({ delay: 100, exit: 1 });
  const r = await call("POST", "/api/task/start", { text: "A 폴더 일" });
  assert.equal(r.status, 200, r.text);
  const t = await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
  assert.equal(t.state, "failed");
  assert.equal(Srv.useProject(b), true);
  plan({ delay: 100 });
  const moved = await call("POST", "/api/task/retry", { at: t.at, way: "again" });
  assert.equal(moved.status, 409, moved.text); assert.match(moved.json.reason, /폴더/);
  assert.equal((await task()).state, "failed", "B 폴더에서 열지 않았다");
  // 같은 폴더를 다른 글자로(Windows의 대소문자 · 끝의 구분자) 연결해도 같은 폴더다 — 글자 그대로 견주면 409가 났다(새 맥락 리뷰 보완)
  assert.equal(Srv.useProject(process.platform === "win32" ? `${a.toUpperCase()}${path.sep}` : `${a}${path.sep}`), true);
  const back = await call("POST", "/api/task/retry", { at: t.at, way: "again" });
  assert.equal(back.status, 200, back.text);
  await until(async () => { const x = await task(); return x && x.state !== "running" ? x : null; });
});

test("F-139 화면 — 계획 줄의 다시 맡기기가 폴더가 바뀌어 거절되면(why folder) 그 글을 새 폴더에 새로 맡기지 않는다", () => {
  const app = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  assert.match(app, /if \(r && !r\.ok && \(r\.why === "cap" \|\| r\.why === "folder"\)\) \{ render\(\); return say\(r\.reason\); \}/);
});
