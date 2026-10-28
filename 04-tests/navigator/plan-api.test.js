// claude-drafted: 2026-10-24 — C-34 준비 계획판(POST /api/plan) · C-32 해낸 것 확인(POST /api/task/start의 checks → GET /api/task의 report). 코드보다 먼저 썼다(code.md 1번).
// 진짜 AI · 진짜 Claude Code는 부르지 않는다 — 계획은 녹화 재생, 맡긴 일은 가짜 claude(결과 한 덩이에 structured_output).
// 실행: node --test 04-tests/navigator/plan-api.test.js
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-planapi-"));
const DIR = path.join(TMP, "test-1");
fs.mkdirSync(path.join(DIR, "src"), { recursive: true });
fs.mkdirSync(path.join(DIR, ".git"));
const README = "# test-1\n\n코디세이 미션 1 — 동아리 행사 신청을 받는 앱\n키: sk-ant-api03-" + "x".repeat(40) + "\n";   // secret-check: allow — 가림을 보는 가짜 값
fs.writeFileSync(path.join(DIR, "README.md"), README);
fs.writeFileSync(path.join(DIR, ".env"), "SECRET=1");

const STUB = path.join(TMP, "claude-stub.js"), STUB_OUT = path.join(TMP, "stub-out.json");
const REPORT = { items: [{ check: "x", done: true, evidence: `${DIR}/src/form.html에 신청 칸을 만들었어요` }, { check: "y", done: false, evidence: "" }], easy: "신청하는 종이를 화면으로 만들었어요. 목록은 아직이에요.", ask: "/Users/someone/notes.txt도 볼까요?" };
fs.writeFileSync(STUB, `const fs = require("node:fs"); let i = ""; process.stdin.on("data", (d) => (i += d)); process.stdin.on("end", () => {
  const argv = process.argv.slice(2); fs.writeFileSync(${JSON.stringify(STUB_OUT)}, JSON.stringify({ argv, stdin: i }));
  const out = { type: "result", is_error: false, result: "끝", total_cost_usd: 0.01, usage: { input_tokens: 10, output_tokens: 90 } };
  if (argv.includes("--json-schema")) out.structured_output = ${JSON.stringify(REPORT)};
  process.stdout.write(JSON.stringify(out)); setTimeout(() => process.exit(0), 100); });`);

Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: STUB });
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];

const TEXT = "동아리 행사 신청 앱을 만들고 싶어요. 회원이 신청하고 운영진이 목록을 봐요.";
const PLAN = { problem: "행사 신청을 종이로 받아 헷갈려요", have: "README에 문제 글이 있어요", missing: "신청 화면이 없어요",
  items: [{ need: "회원이 신청 단추를 누르면, 앱은 신청을 받는다", check: "신청 단추를 누르면 목록에 한 줄이 생긴다" }, { need: "운영진이 목록을 보면, 앱은 신청한 사람을 보여 준다", check: "목록 화면에 이름이 보인다" }],
  prep: ["신청 받을 칸 정하기"], ask: ["마감이 있나요?"], say: "계획을 세웠어요. 줄마다 봐 주세요." };
const REDACTED = require(path.join(BACK, "sensitive.js")).redact(README);
const FIRST = Nav.planPrompt({ text: TEXT, readme: REDACTED, files: ["README.md", "src"] });
const BARE = Nav.planPrompt({ text: TEXT });
const NOTES = [{ need: PLAN.items[0].need, check: PLAN.items[0].check, note: "연락처 칸도" }];
const AGAIN = Nav.planPrompt({ text: TEXT, readme: REDACTED, files: ["README.md", "src"], prev: Nav.parsePlan(PLAN), notes: NOTES, answers: [{ q: "마감이 있나요?", a: "금요일" }], general: "" });
REC.save(process.env.NAV_REPLAY, { [REC.keyOf(FIRST, Nav.PLAN_SCHEMA)]: PLAN, [REC.keyOf(BARE, Nav.PLAN_SCHEMA)]: PLAN, [REC.keyOf(AGAIN, Nav.PLAN_SCHEMA)]: { ...PLAN, ask: [], say: "고쳤어요." } });

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
// 맡긴 일이 끝날 때까지(고정 대기는 부하가 있으면 모자란다 — 전체 시험에서 한 번 실패) — 10초까지 0.1초마다 /api/task
async function untilDone() {
  for (let i = 0; i < 100; i++) { const t = (await call("GET", "/api/task")).json.task; if (t && t.state !== "running") return t; await wait(100); }
  throw new Error("맡긴 일이 끝나지 않음");
}

test("POST /api/plan: 확인 값이 있어야 — 없으면 403(AI를 부르기 전)", async () => {
  assert.equal((await call("POST", "/api/plan", { body: { text: TEXT }, token: false })).status, 403);
});

test("POST /api/plan: 작업 폴더를 모르면 넣은 글만으로 — { ok, plan, tokens }, 요구마다 id", async () => {
  const r = await call("POST", "/api/plan", { body: { text: TEXT } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(Object.keys(r.json).sort(), ["ok", "plan", "tokens"]);
  assert.deepEqual(r.json.plan.items.map((x) => x.id), ["p1", "p2"]);
});

test("POST /api/plan: 작업 폴더를 알면 README(비밀값은 가림) · 맨 위 파일 이름(점으로 시작하는 것 빼고)도 읽는다 — readme: false면 넣은 글만", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const r = await call("POST", "/api/plan", { body: { text: TEXT } });
  assert.equal(r.status, 200, r.text);   // 녹화의 열쇠가 FIRST(가린 README + ["README.md", "src"])와 같아야 재생된다
  assert.ok(!FIRST.includes("sk-ant-api03-xxxx"), "가린 뒤 보낸다");
  assert.equal((await call("POST", "/api/plan", { body: { text: TEXT, readme: false } })).status, 200, "BARE로 재생");
});

test("POST /api/plan 다시 세우기: 지난 계획 · 의견 · 답을 받아 다시 — 지난 계획은 서버가 모양을 다시 확인한다", async () => {
  const r = await call("POST", "/api/plan", { body: { text: TEXT, prev: PLAN, notes: NOTES, answers: [{ q: "마감이 있나요?", a: "금요일" }] } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.plan.say, "고쳤어요.");
  const bad = await call("POST", "/api/plan", { body: { text: TEXT, prev: { items: "x" } } });
  assert.equal(bad.status, 400); assert.match(bad.json.reason, /지난 계획/);
});

test("POST /api/plan 거절: 빈 글 400 · 8,000자 넘으면 400 · 의견 모양이 틀리면 400", async () => {
  for (const [body, re] of [[{ text: " " }, /비어/], [{ text: "가".repeat(Nav.PLAN_MAX + 1) }, /너무 김/], [{ text: TEXT, prev: PLAN, notes: "x" }, /의견/], [{ text: TEXT, prev: PLAN, notes: [{ need: 1 }] }, /의견/]]) {
    const r = await call("POST", "/api/plan", { body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60)); assert.match(r.json.reason, re);
  }
});

test("맡기기 + 기준(checks): 기준을 넘긴 글에 넣고 --json-schema로 연다 → 끝나면 /api/task에 report(기준 순서대로 · 근거 없는 해냄은 안 됨)", async () => {
  const checks = PLAN.items.map((x) => x.check);
  const r = await call("POST", "/api/task/start", { body: { text: PLAN.items[0].need, checks } });
  assert.equal(r.status, 200, r.text);
  const t = await untilDone();
  const out = JSON.parse(fs.readFileSync(STUB_OUT, "utf8"));
  assert.ok(out.argv.includes("--json-schema"), out.argv.join(" "));
  assert.deepEqual(JSON.parse(out.argv[out.argv.indexOf("--json-schema") + 1]), Nav.REPORT_SCHEMA);
  assert.match(out.stdin, /다 됐는지 보는 기준:\n\(1\) 신청 단추를 누르면 목록에 한 줄이 생긴다/);
  assert.equal(t.state, "done");
  assert.deepEqual(t.report.items, [{ check: checks[0], done: true, evidence: "./src/form.html에 신청 칸을 만들었어요" }, { check: checks[1], done: false, evidence: "" }], "작업 폴더 경로는 떼고 그 안의 이름만(2026-10-24 리뷰)");
  assert.equal(t.report.easy, REPORT.easy); assert.equal(t.report.ask, "~/notes.txt도 볼까요?", "홈 폴더 경로도 ~로"); assert.deepEqual([t.report.done, t.report.total], [1, 2]);
});

test("맡기기: 기준 없이 넘기면 전처럼(--json-schema 없음 · report null), 기준 모양이 틀리면 400", async () => {
  assert.equal((await call("POST", "/api/task/start", { body: { text: "그냥 일" } })).status, 200);
  assert.equal((await untilDone()).report, null);
  assert.ok(!JSON.parse(fs.readFileSync(STUB_OUT, "utf8")).argv.includes("--json-schema"));
  for (const checks of ["x", [1], Array(Nav.CHECKS_MAX + 1).fill("a"), ["가".repeat(300)]]) {
    const r = await call("POST", "/api/task/start", { body: { text: "일", checks } });
    assert.equal(r.status, 400, JSON.stringify(checks).slice(0, 40)); assert.match(r.json.reason, /기준/);
  }
});
