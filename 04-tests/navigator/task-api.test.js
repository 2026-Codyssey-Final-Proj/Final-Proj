// claude-drafted: 2026-10-20 — FR-17 대화로 일 넘기기 · 섬에서 허용 · 거절(C-4, 넘김 문서 fable-handoff-2026-10-20-c4-views.md 2절 ②). 코드보다 먼저 썼다(code.md 1번).
// 서버(server.js)의 새 주소 여섯을 API.md 3-13~3-16대로 보는 시험 — 진짜 AI · 진짜 Claude Code는 부르지 않는다.
//   승인: POST /api/approval(훅이 보내고 답을 기다린다) · GET /api/approvals(섬이 본다) · POST /api/approvals/decide(섬이 누른다)
//     — 결정은 그 요청(id · sig)과 짝이 맞을 때만, 늦은 결정은 버린다, 되돌리기 어려운 일은 sure가 있어야, 답이 없으면 none(대신 허용하지 않는다)
//   일 넘기기: POST /api/task/tidy(요구 문장으로 정리 — 재생 녹화) · POST /api/task/start(연결한 폴더에서 claude를 셸 없이 실행 — 가짜 claude로) · GET /api/task
// 실행: node --test 04-tests/navigator/task-api.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const Nav = require(path.join(BACK, "navigator.js"));
const REC = require(path.join(BACK, "recording.js"));
const AP = require(path.join(BACK, "approve.js"));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-task-"));
const FAKE_KEY = "sk-" + "Zq9x".repeat(6);   // secret-check: allow — 시험 안에서만, 실행할 때 만든다
const STUB = path.join(TMP, "claude-stub.js"), STUB_OUT = path.join(TMP, "stub-out.json");
// 가짜 claude — 받은 인자 · 작업 폴더 · 표준 입력을 적고 잠깐 뒤 끝난다(그동안 '진행 중'을 볼 수 있게)
fs.writeFileSync(STUB, `const fs = require("node:fs"); let i = ""; process.stdin.on("data", (d) => (i += d)); process.stdin.on("end", () => {
  fs.writeFileSync(${JSON.stringify(STUB_OUT)}, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), stdin: i, env: { skip: process.env.CLAUDE_SKIP || "" } }));
  setTimeout(() => process.exit(0), 400); });`);

Object.assign(process.env, {
  CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP),   // F-69 — 맡기기 전에 서버가 허락 훅을 본다(가짜 사용자 설정에 단다, hook-home.js)
  NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"),
  ANTHROPIC_API_KEY: FAKE_KEY, ANTHROPIC_BASE_URL: "http://127.0.0.1:9/closed",
  NAV_APPROVAL_WAIT: "1500",   // 서버가 결정을 기다리는 시간 — 시험이라 짧게
  NAV_CLAUDE_BIN: STUB,
});
for (const k of ["NAV_RECORD", "NAV_PLAN", "NAV_TOKEN_BUDGET", "NAV_TESTER", "NAV_TESTER_BUDGET", "NAV_MODEL", "NAV_COMPAT", "NAV_PURPOSE", "NAV_USE_RESERVE"]) delete process.env[k];

const TIDY_TEXT = "회원 신청 화면 만들고 마감 알림도 넣어 줘";
const TIDY_ANSWER = { lines: ["회원이 신청 단추를 누르면, 앱은 신청서를 보여 준다", "마감 하루 전에, 앱은 신청한 회원에게 알림을 보낸다"], say: "두 줄로 정리했어요. 고쳐서 확정해요." };
REC.save(process.env.NAV_REPLAY, { [REC.keyOf(Nav.taskPrompt(TIDY_TEXT), Nav.TASK_SCHEMA)]: TIDY_ANSWER,
  [REC.keyOf(Nav.taskPrompt("모양이 틀린 답"), Nav.TASK_SCHEMA)]: { lines: [], say: "x" } });

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

function call(method, url, { headers = {}, body, raw, token: withTok = true, timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const data = raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body);
    const h = { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), ...(withTok ? { "X-Nav-Token": token() } : {}), ...headers };
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: h, timeout }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, headers: res.headers, json, text }); });
    });
    req.on("error", reject); req.on("timeout", () => req.destroy(new Error(`${method} ${url} 응답 없음`))); req.end(data);
  });
}
const refused = (r, status, re, what = "") => { assert.equal(r.status, status, `${what} ${r.text}`); assert.deepEqual(Object.keys(r.json).sort(), ["ok", "reason"], what); assert.equal(r.json.ok, false); assert.match(r.json.reason, re, what); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CWD = "/Users/me/club-app";
let n = 0;
// 훅이 보내는 승인 요청 — 카드는 approve.js가 만든 모양 그대로
const request = (over = {}) => {
  const ev = { hook_event_name: "PermissionRequest", session_id: "s-1", cwd: CWD, tool_name: "Bash", tool_input: { command: `npm test -- ${++n}` }, ...over.ev };
  return { id: `req-${n}-${"x".repeat(8)}`, sig: AP.sig(ev), session_id: ev.session_id, cwd: ev.cwd, tool: "claude", tool_name: ev.tool_name, card: AP.card(ev), ...over.body };
};
const approval = (body, opts = {}) => call("POST", "/api/approval", { body, ...opts });
const approvals = () => call("GET", "/api/approvals");
const decide = (body) => call("POST", "/api/approvals/decide", { body });

// ════════ 확인 값 — 여섯 주소 모두 ════════
test("새 주소 여섯은 확인 값이 없거나 틀리면 403, 본문을 읽기 전에", async () => {
  const no = /확인 값이 없거나 맞지 않음/;
  for (const [m, u] of [["POST", "/api/approval"], ["GET", "/api/approvals"], ["POST", "/api/approvals/decide"], ["GET", "/api/task"], ["POST", "/api/task/tidy"], ["POST", "/api/task/start"]]) {
    refused(await call(m, u, { token: false, body: m === "POST" ? {} : undefined }), 403, no, u);
    refused(await call(m, u, { token: false, headers: { "X-Nav-Token": "wrong" }, body: m === "POST" ? {} : undefined }), 403, no, u);
  }
});

// ════════ 3-13 · 3-14 · 3-15 승인 ════════
test("승인: 훅의 요청이 기다리는 동안 섬이 목록에서 보고 허용하면 훅이 allow를 받는다 — 목록에는 id · sig · 카드, 결정 뒤에는 비운다", async () => {
  const q = request();
  const held = approval(q);
  await wait(80);
  const list = await approvals();
  assert.equal(list.status, 200); assert.equal(list.json.ok, true);
  const item = list.json.items.find((x) => x.id === q.id);
  assert.ok(item, "기다리는 요청이 목록에");
  assert.deepEqual(Object.keys(item).sort(), ["at", "card", "id", "project", "sig", "tool", "tool_name"]);
  assert.equal(item.project, "club-app"); assert.deepEqual(item.card, q.card); assert.equal(item.sig, q.sig);
  const d = await decide({ id: q.id, sig: q.sig, decision: "allow" });
  assert.equal(d.status, 200); assert.deepEqual(d.json, { ok: true, id: q.id, decision: "allow" });
  const r = await held;
  assert.equal(r.status, 200); assert.deepEqual(r.json, { ok: true, id: q.id, decision: "allow" });
  assert.ok(!(await approvals()).json.items.some((x) => x.id === q.id), "결정한 요청은 목록에서 빠진다");
});

test("승인: 거절하면 훅이 deny를 받는다. 같은 결정을 다시 보내면(늦은 결정) 404 — 기다리는 요청이 아니다", async () => {
  const q = request();
  const held = approval(q);
  await wait(50);
  assert.deepEqual((await decide({ id: q.id, sig: q.sig, decision: "deny" })).json, { ok: true, id: q.id, decision: "deny" });
  assert.equal((await held).json.decision, "deny");
  refused(await decide({ id: q.id, sig: q.sig, decision: "deny" }), 404, /기다리는 요청이 아님/);
  refused(await decide({ id: "never-sent-xxxxxxx", sig: q.sig, decision: "allow" }), 404, /기다리는 요청이 아님/);
});

test("승인: 지문(sig)이 다르면 409 — 다른 요청의 결정은 버린다(C-4 ③). decision이 allow · deny가 아니면 400", async () => {
  const q = request();
  const held = approval(q);
  await wait(50);
  refused(await decide({ id: q.id, sig: "0".repeat(64), decision: "allow" }), 409, /짝이 맞지 않음/);
  refused(await decide({ id: q.id, sig: q.sig, decision: "yes" }), 400, /allow 또는 deny/);
  refused(await decide({ id: q.id, sig: q.sig }), 400, /allow 또는 deny/);
  assert.ok((await approvals()).json.items.some((x) => x.id === q.id), "틀린 결정으로는 요청이 사라지지 않는다");
  await decide({ id: q.id, sig: q.sig, decision: "deny" });
  assert.equal((await held).json.decision, "deny");
});

test("승인: 되돌리기 어려운 일(danger)은 sure:true 없이 허용하면 409 — 한 번 더 묻는다. 거절은 바로 된다", async () => {
  const q = request({ ev: { tool_input: { command: "git push --force origin main" } } });
  assert.ok(q.card.danger);
  const held = approval(q);
  await wait(50);
  refused(await decide({ id: q.id, sig: q.sig, decision: "allow" }), 409, /한 번 더/);
  assert.deepEqual((await decide({ id: q.id, sig: q.sig, decision: "allow", sure: true })).json, { ok: true, id: q.id, decision: "allow" });
  assert.equal((await held).json.decision, "allow");
  const q2 = request({ ev: { tool_input: { command: "rm -rf dist" } } });
  const held2 = approval(q2);
  await wait(50);
  assert.equal((await decide({ id: q2.id, sig: q2.sig, decision: "deny" })).json.decision, "deny");
  assert.equal((await held2).json.decision, "deny");
});

test("승인: 아무도 누르지 않으면 기다린 뒤(NAV_APPROVAL_WAIT) none — 대신 허용하지 않고, 목록에서도 빠진다", async () => {
  const q = request();
  const t0 = Date.now();
  const r = await approval(q, { timeout: 5000 });
  assert.deepEqual(r.json, { ok: true, id: q.id, decision: "none" });
  assert.ok(Date.now() - t0 >= 1400, "기다렸다");
  assert.ok(!(await approvals()).json.items.some((x) => x.id === q.id));
});

test("승인: 본문 모양 — id · sig · card가 없거나 이상하면 400. 카드의 줄은 저장하기 전에 다시 가리고(S4) 수와 길이를 자른다 — 비밀값이 목록에 나오지 않는다", async () => {
  refused(await approval({}), 400, /승인 요청 모양/);
  refused(await approval({ ...request(), id: "bad id!" }), 400, /승인 요청 모양/);
  refused(await approval({ ...request(), sig: "short" }), 400, /승인 요청 모양/);
  refused(await approval({ ...request(), card: "x" }), 400, /승인 요청 모양/);
  const q = request({ body: { card: { tool_name: "Bash", verb: "실행했어요", what: `export K=${FAKE_KEY}`, kind: "run", danger: "", lines: Array.from({ length: 80 }, () => `echo ${FAKE_KEY} ${"가".repeat(400)}`) } } });   // secret-check: allow
  const held = approval(q);
  await wait(60);
  const item = (await approvals()).json.items.find((x) => x.id === q.id);
  assert.ok(item);
  const s = JSON.stringify(item);
  assert.ok(!s.includes(FAKE_KEY) && s.includes("[비밀값]"));
  assert.ok(item.card.lines.length <= 40 && item.card.lines.every((l) => l.length <= 200));
  await decide({ id: q.id, sig: q.sig, decision: "deny" }); await held;
});

test("승인: 기다리는 요청은 20개까지 — 넘치면 429, 기록 비우기(/api/events/clear)는 기다리던 요청에 none을 준다", async () => {
  const held = [];
  for (let i = 0; i < 20; i++) held.push(approval(request(), { timeout: 5000 }));
  await wait(80);
  refused(await approval(request()), 429, /너무 많/);
  const c = await call("POST", "/api/events/clear");
  assert.equal(c.json.ok, true);
  const rs = await Promise.all(held);
  assert.ok(rs.every((r) => r.json.decision === "none"));
  assert.deepEqual((await approvals()).json.items, []);
});

// ════════ 3-16 일 넘기기 ════════
test("일 넘기기: 연결한 폴더를 아직 모르면(훅 알림이 온 적 없음) 400, 글이 비면 400", async () => {
  await call("POST", "/api/events/clear");
  refused(await call("POST", "/api/task/start", { body: { text: "회원 신청 화면" } }), 400, /폴더/);
  assert.deepEqual((await call("GET", "/api/task")).json, { ok: true, task: null });
});

test("일 넘기기: 훅 알림으로 폴더를 안 뒤 — claude를 셸 없이 그 폴더에서 -p로 실행하고 글은 표준 입력으로, 권한 건너뛰기 · 설정 끄기 옵션은 없다. 진행 중이면 409, 끝나면 done", async () => {
  const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "floe-task-cwd-"));
  assert.equal((await call("POST", "/api/event", { body: { hook_event_name: "UserPromptSubmit", session_id: "s-9", cwd: stubDir, prompt: "안녕" } })).json.ok, true);
  refused(await call("POST", "/api/task/start", { body: { text: "  " } }), 400, /비어/);
  const text = "회원이 신청 단추를 누르면, 앱은 신청서를 보여 준다\n마감 하루 전에 알림";
  const r = await call("POST", "/api/task/start", { body: { text } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(Object.keys(r.json).sort(), ["ok", "project", "task"]);
  assert.equal(r.json.project, path.basename(stubDir)); assert.equal(r.json.task.state, "running");
  refused(await call("POST", "/api/task/start", { body: { text } }), 409, /진행 중/);
  assert.equal((await call("GET", "/api/task")).json.task.state, "running");
  await wait(700);
  const out = JSON.parse(fs.readFileSync(STUB_OUT, "utf8"));
  assert.equal(fs.realpathSync(out.cwd), fs.realpathSync(stubDir), "연결한 폴더 안에서만");
  assert.ok(out.argv.includes("-p"), out.argv.join(" "));
  for (const bad of ["--dangerously-skip-permissions", "--allow-dangerously-skip-permissions", "--setting-sources", "bypassPermissions", "--permission-prompts", "--resume", "-c", "--continue"]) assert.ok(!out.argv.includes(bad), `${bad}가 있다`);
  assert.ok(out.stdin.includes("신청서를 보여 준다") && out.stdin.includes("Floe"), "글은 표준 입력으로, Floe가 넘겼다는 말과 함께");
  assert.ok(!out.argv.some((a) => a.includes("신청서")), "글을 인자로 넘기지 않는다(프로세스 목록에 보인다)");
  const t = (await call("GET", "/api/task")).json.task;
  assert.equal(t.state, "done"); assert.equal(t.code, 0); assert.equal(t.project, path.basename(stubDir));
  assert.equal((await call("POST", "/api/task/start", { body: { text } })).status, 200, "끝났으면 다시 넘길 수 있다");
  await wait(700);
  fs.rmSync(stubDir, { recursive: true, force: true });
});

test("정리하기: 요구 문장으로 — AI 답(재생)의 lines · say를 돌려준다, 모양이 틀리면 502, 글이 비면 400 · 4,000자 넘으면 400", async () => {
  const r = await call("POST", "/api/task/tidy", { body: { text: TIDY_TEXT } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(Object.keys(r.json).sort(), ["lines", "ok", "say", "tokens"]);
  assert.deepEqual(r.json.lines, TIDY_ANSWER.lines); assert.equal(r.json.say, TIDY_ANSWER.say);
  refused(await call("POST", "/api/task/tidy", { body: { text: "모양이 틀린 답" } }), 502, /정리 형식/);
  refused(await call("POST", "/api/task/tidy", { body: { text: "" } }), 400, /비어/);
  refused(await call("POST", "/api/task/tidy", { body: { text: "가".repeat(4001) } }), 400, /4,000자/);
});

test("일 넘기기 · 승인 주소는 AI 진행(/api/steps)에 폴더 경로를 내지 않는다 — project 이름만", async () => {
  const s = (await call("GET", "/api/steps?since=0")).json;
  assert.ok(s.ok);
  for (const x of s.sessions) { assert.ok(!("dir" in x) && !("cwd" in x), "폴더 경로 칸이 없다"); assert.ok(!JSON.stringify(x).includes(os.tmpdir())); }
});
