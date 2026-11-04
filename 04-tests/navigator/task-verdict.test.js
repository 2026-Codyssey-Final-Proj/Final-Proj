// claude-drafted: 2026-10-29 — C-50 맡긴 일의 남은 몫(지식 퀘스트 PRD 6절 C-50 · 9절 7 · 8번, 결정 모음 A-06 확인 ②~④). 코드보다 먼저 썼다(code.md 1번).
//   ① 미리 판정 — 보고의 해냄을 세어(AI를 더 부르지 않음) 다 됨 · 덜 됨 · 막힘 · 직접 확인 필요(navigator.js reportVerdict)
//   ② 다시 맡기면 앞에서 한 일(보고 · 바뀐 파일 이름 · 막힌 까닭)을 붙여 넘긴다 — 새로 맡기며 앞 보고만, 사람이 고른 다시 맡기기는 2번까지(①의 '카드 다시'는 세지 않는다)
//   ③ 실패는 기록에 남기고 조용히 '남음'으로 되돌리지 않는다(plan.js failed — 까닭 · 횟수)
// 실행: node --test 04-tests/navigator/task-verdict.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const N = require(path.join(BACK, "navigator.js"));
const B = require(path.join(BACK, "plan.js"));
const AP = require(path.join(BACK, "approve.js"));
const FAKE_KEY = "sk-" + "Vr9d".repeat(6);   // secret-check: allow — 시험 안에서만, 가려져야 한다

const rep = (dones, easy = "했어요") => ({ items: dones.map((d, i) => ({ check: `기준 ${i + 1}`, done: d, evidence: d ? "src/app.py" : "" })), easy, ask: "", done: dones.filter(Boolean).length, total: dones.length });

// ════════ ① 미리 판정 ════════
test("reportVerdict — 다 됨(모두 해냄) · 덜 됨(일부) · 막힘(state blocked) · 직접 확인 필요(보고 없음 · 기준 0 · 실패 · 멈춤)", () => {
  assert.deepEqual(N.reportVerdict(rep([true, true]), "done"), { kind: "done", word: "다 됨" });
  assert.deepEqual(N.reportVerdict(rep([true, false]), "done"), { kind: "partial", word: "덜 됨" });
  assert.deepEqual(N.reportVerdict(rep([false]), "done"), { kind: "partial", word: "덜 됨" });
  assert.deepEqual(N.reportVerdict(rep([true]), "blocked"), { kind: "blocked", word: "막힘" }, "막힘은 보고보다 먼저");
  assert.deepEqual(N.reportVerdict(null, "done"), { kind: "check", word: "직접 확인 필요" });
  assert.deepEqual(N.reportVerdict({ ...rep([]), total: 0 }, "done"), { kind: "check", word: "직접 확인 필요" });
  for (const s of ["failed", "stopped"]) assert.equal(N.reportVerdict(rep([true]), s).kind, "check", s);
  assert.equal(N.reportVerdict(rep([true])).kind, "done", "상태를 모르면 보고만으로");
});

// ════════ ③ 실패를 남긴다 · 다시 맡길 때 앞 보고 ════════
const PLAN = N.parsePlan({ problem: "신청을 종이로 받아요", have: "README뿐", missing: "화면이 없어요",
  items: [{ need: "회원이 신청한다", check: "목록에 한 줄이 생긴다" }], prep: [], ask: [], say: "봐 주세요" });
test("plan.failed — 남음(todo)으로 두되 실패 까닭 · 횟수를 남긴다(다시 맡길 수 있게, 조용히 되돌리지 않게)", () => {
  let b = B.start(B.confirm(B.mark(B.board(PLAN), "p1", "ok")), "p1", 5);
  b = B.failed(b, "p1", "허락을 못 받아 막혔어요");
  assert.equal(B.stateOf(b, "p1"), "todo"); assert.deepEqual(b.work.p1.fail, { why: "허락을 못 받아 막혔어요", n: 1 });
  b = B.failed(B.start(b, "p1", 6), "p1");
  assert.deepEqual(b.work.p1.fail, { why: "보고를 받지 못했어요", n: 2 }, "까닭이 없으면 기본 말, 횟수는 쌓인다");
  assert.ok(B.revive(JSON.parse(JSON.stringify(b))), "저장했다 다시 읽어도 된다");
  assert.match(B.taskFor(b, "p1").text, /지난번에 끝까지 못 했어요: 보고를 받지 못했어요 — 이미 끝낸 일은 다시 하지 말고 이어서/, "새로 맡겨도 실패 까닭을 붙인다");
  b = B.report(B.start(b, "p1", 7), "p1", rep([true]), { kind: "done", word: "다 됨" });
  assert.equal(b.work.p1.fail, undefined, "보고가 오면 실패 표시는 지운다"); assert.deepEqual(b.work.p1.verdict, { kind: "done", word: "다 됨" }, "서버가 센 미리 보기를 남긴다");
});
test("plan.taskFor — 다르게 봐요로 다시 맡기면 의견과 지난번 보고 한 줄을 붙인다", () => {
  let b = B.report(B.start(B.confirm(B.mark(B.board(PLAN), "p1", "ok")), "p1"), "p1", rep([false], "신청 칸만 만들었어요."));
  b = B.reject(b, "p1", "목록도 만들어 줘");
  assert.deepEqual(B.taskFor(b, "p1"), { text: "회원이 신청한다\n지난번에 사용자가 다르게 본 점: 목록도 만들어 줘\n지난번 보고: 신청 칸만 만들었어요. (끝 조건 0/1)", checks: ["목록에 한 줄이 생긴다"] });
});

// ════════ ② 서버 — 다시 맡길 때 앞에서 한 일 · 상한 · 판정 ════════
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-verdict-"));
const STUB = path.join(TMP, "claude-stub.js"), STUB_OUT = path.join(TMP, "stub-out.json"), PLANF = path.join(TMP, "plan.json");
fs.writeFileSync(STUB, `const fs = require("node:fs"); let i = ""; process.stdin.on("data", (d) => (i += d)); process.stdin.on("end", () => {
  const p = JSON.parse(fs.readFileSync(process.env.STUB_PLAN, "utf8")); fs.writeFileSync(${JSON.stringify(STUB_OUT)}, JSON.stringify({ stdin: i }));
  setTimeout(() => { process.stdout.write(JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "끝", usage: { input_tokens: 10, output_tokens: 5 },
    permission_denials: p.denials || [], ...(p.report ? { structured_output: p.report } : {}) })); process.exit(0); }, p.delay || 150); });`);
const stubPlan = (p) => fs.writeFileSync(PLANF, JSON.stringify(p));
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"),
  NAV_REPLAY: path.join(TMP, "replay.json"), NAV_APPROVAL_WAIT: "300", NAV_CLAUDE_BIN: STUB, STUB_PLAN: PLANF });
fs.writeFileSync(process.env.NAV_REPLAY, "{}");
for (const k of ["NAV_RECORD", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
let Srv, port, srv, dir;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const token = () => fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
fs.writeFileSync(process.env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-approve-auto"), "0");   // F-149 — 이 시험은 사람의 답을 기다리는 길을 본다
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken();
  dir = fs.mkdtempSync(path.join(TMP, "proj-")); Srv.useProject(dir);
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
function call(method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: { ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), "X-Nav-Token": token() } }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function settled() { for (let k = 0; k < 80; k++) { const t = (await call("GET", "/api/task")).json.task; if (t && t.state !== "running") return t; await wait(50); } return null; }

test("GET /api/task의 verdict — 끝나면 보고를 세어 미리 판정(도는 중이면 null)", async () => {
  stubPlan({ delay: 200, report: rep([true, false]) });
  const r = await call("POST", "/api/task/start", { text: "뼈대", checks: ["기준 1", "기준 2"] });
  assert.equal(r.status, 200, r.text); assert.equal(r.json.task.verdict, null, "도는 중");
  const t = await settled();
  assert.equal(t.state, "done"); assert.deepEqual(t.verdict, { kind: "partial", word: "덜 됨" });
  assert.equal(t.retries, 0); assert.equal(t.retryMax, 2);
});

test("다시 맡기면 앞에서 한 일(보고 · 바뀐 파일 이름 · 막힌 까닭)을 글 끝에 붙인다 — 사람이 고른 다시 맡기기는 2번까지, ①의 카드 다시(auto)는 세지 않는다", async () => {
  stubPlan({ delay: 600, denials: [{ tool_name: "Bash", tool_input: {} }], report: rep([false], "README만 썼어요.") });
  const r = await call("POST", "/api/task/start", { text: "뼈대 코드를 만들어 주세요", checks: ["기준 1"] });
  assert.equal(r.status, 200, r.text);
  // 그 일이 도는 동안 그 폴더에서 파일을 만들었다는 훅 알림
  await call("POST", "/api/event", { hook_event_name: "PostToolUse", session_id: "s-v", cwd: dir, tool: "claude", tool_name: "Write", step: { verb: "만들었어요", what: "README.md", add: 3, del: 0 } });
  // 그동안 허락 카드 하나가 답 없이 지났다(none) — ①(auto)은 이때만
  const ev = { hook_event_name: "PermissionRequest", session_id: "s-v", cwd: dir, tool_name: "Bash", tool_input: { command: "python3 app.py" } };
  assert.equal((await call("POST", "/api/approval", { id: "req-verdict-0001", sig: AP.sig(ev), session_id: "s-v", cwd: dir, tool: "claude", tool_name: "Bash", card: AP.card(ev) })).json.decision, "none");
  let t = await settled();
  assert.equal(t.state, "blocked"); assert.equal(t.verdict.kind, "blocked"); assert.equal(t.blocked.asks.none, 1);
  stubPlan({ delay: 100, denials: [{ tool_name: "Bash", tool_input: {} }] });
  const a = await call("POST", "/api/task/retry", { at: t.at, way: "again", auto: true });
  assert.equal(a.status, 200, a.text); assert.equal(a.json.task.retries, 0, "①의 카드 다시는 세지 않는다");
  let sent = "";   // 가짜 claude가 받은 글을 적을 때까지(맡긴 직후에는 아직 지난 글일 수 있다)
  for (let k = 0; k < 40 && !sent.includes("[앞에서 한 일]"); k++) { await wait(25); try { sent = JSON.parse(fs.readFileSync(STUB_OUT, "utf8")).stdin; } catch {} }
  assert.match(sent, /\[앞에서 한 일\]/); assert.match(sent, /README만 썼어요/); assert.match(sent, /바뀐 파일: README\.md/); assert.match(sent, /허락을 못 받았던 것: 명령 1/);
  assert.match(sent, /허락을 못 받았던 일은 다시 하면 허락 카드가 떠요/, "①의 목적 — 카드를 다시 띄우기와 부딪치지 않는 안내");
  assert.equal((sent.match(/뼈대 코드를 만들어 주세요/g) || []).length, 1, "처음 글은 한 번");
  t = await settled();
  assert.equal((await call("POST", "/api/task/retry", { at: t.at, way: "again", auto: true })).status, 409, "auto는 처음 막혔을 때 한 번만");
  for (const k of [1, 2]) {
    stubPlan({ delay: 100, denials: [{ tool_name: "Bash", tool_input: {} }] });
    const h = await call("POST", "/api/task/retry", { at: t.at, way: k === 1 ? "again" : "files-only" });
    assert.equal(h.status, 200, h.text); assert.equal(h.json.task.retries, k);
    t = await settled();
  }
  const over = await call("POST", "/api/task/retry", { at: t.at, way: "again" });
  assert.equal(over.status, 409); assert.equal(over.json.why, "cap"); assert.match(over.json.reason, /2번까지/);
  const brief = await call("POST", "/api/task/retry", { at: t.at, way: "brief" });
  assert.equal(brief.status, 200, "직접 하기 글은 상한이 없다");
});

test("auto는 카드에 답이 없었을 때만 — 사람이 거절했거나 카드가 안 떴으면 409(상한을 피하는 길이 아니다)", async () => {
  stubPlan({ delay: 150, denials: [{ tool_name: "Write", tool_input: {} }] });
  assert.equal((await call("POST", "/api/task/start", { text: "카드 없이 막힘" })).status, 200);
  const t = await settled(); assert.equal(t.state, "blocked"); assert.equal(t.blocked.asks.none, 0);
  const r = await call("POST", "/api/task/retry", { at: t.at, way: "again", auto: true });
  assert.equal(r.status, 409); assert.match(r.json.reason, /답이 없었을 때/);
});

test("앞에서 한 일 — 가린 뒤 600자에서 자르고 안내 문장은 늘 남는다, 작업 폴더 경로는 '.'", async () => {
  stubPlan({ delay: 400, denials: [{ tool_name: "Write", tool_input: {} }], report: { items: [{ check: "기준 1", done: false, evidence: "" }], easy: `키 ${FAKE_KEY}를 ${dir}/conf.json에 두려다 못 했어요. ${"가".repeat(150)}`, ask: "" } });
  const r = await call("POST", "/api/task/start", { text: "긴 일", checks: ["기준 1"] });
  assert.equal(r.status, 200, r.text);
  for (let k = 0; k < 12; k++) await call("POST", "/api/event", { hook_event_name: "PostToolUse", session_id: "s-long", cwd: dir, tool: "claude", tool_name: "Write", step: { verb: "만들었어요", what: `src/${"폴더".repeat(18)}${k}.js`, add: 1, del: 0 } });
  const t = await settled(); assert.equal(t.state, "blocked");
  stubPlan({ delay: 100 });
  assert.equal((await call("POST", "/api/task/retry", { at: t.at, way: "again" })).status, 200);
  let sent = ""; for (let k = 0; k < 40 && !sent.includes("[앞에서 한 일]"); k++) { await wait(25); try { sent = JSON.parse(fs.readFileSync(STUB_OUT, "utf8")).stdin; } catch {} }
  const note = sent.slice(sent.indexOf("[앞에서 한 일]"), sent.indexOf("허락 카드가 떠요.") + "허락 카드가 떠요.".length);
  assert.ok(note.length > 0 && note.length <= 600 + 120, `길이 ${note.length}`);
  assert.match(note, /…/, "넘쳐서 잘랐다"); assert.match(note, /허락을 못 받았던 일은 다시 하면 허락 카드가 떠요\.$/, "안내는 남는다");
  assert.ok(!note.includes(FAKE_KEY), "가린다"); assert.ok(!note.includes(dir), "경로는 '.'으로");
  await settled();
});
