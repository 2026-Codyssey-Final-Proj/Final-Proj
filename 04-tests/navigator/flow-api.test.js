// claude-drafted: 2026-10-25 — C-37 POST /api/stagedraft(2단계 초안) · POST /api/docs(단계 문서를 작업 폴더에 쓰고 커밋 · 푸시를 Claude Code에). 코드보다 먼저 썼다(code.md 1번).
// 진짜 AI · 진짜 Claude Code는 부르지 않는다 — 초안은 녹화 재생, 맡긴 일은 가짜 claude(받은 글을 파일로 남긴다).
// 실행: node --test 04-tests/navigator/flow-api.test.js
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-flowapi-"));
const DIR = path.join(TMP, "test-1"), OUTSIDE = path.join(TMP, "outside");
fs.mkdirSync(path.join(DIR, ".git"), { recursive: true }); fs.mkdirSync(OUTSIDE);
fs.writeFileSync(path.join(DIR, "README.md"), "# test-1\n\n내가 쓴 소개\n");
fs.mkdirSync(path.join(DIR, "docs")); fs.writeFileSync(path.join(DIR, "docs/README.md"), "# 내 문서\n\n내가 쓴 docs 안내\n");

// SLOW 파일이 있으면 늦게 끝난다(맡긴 일이 진행 중일 때의 409를 보려고)
const STUB = path.join(TMP, "claude-stub.js"), STUB_OUT = path.join(TMP, "stub-out.json"), SLOW = path.join(TMP, "slow");
fs.writeFileSync(STUB, `const fs = require("node:fs"); let i = ""; process.stdin.on("data", (d) => (i += d)); process.stdin.on("end", () => {
  fs.writeFileSync(${JSON.stringify(STUB_OUT)}, JSON.stringify({ argv: process.argv.slice(2), stdin: i }));
  process.stdout.write(JSON.stringify({ type: "result", is_error: false, result: "끝", total_cost_usd: 0.01, usage: { input_tokens: 10, output_tokens: 20 } }));
  setTimeout(() => process.exit(0), fs.existsSync(${JSON.stringify(SLOW)}) ? 1500 : 50); });`);
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: STUB });
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];

const IDEA = "동아리 행사 신청 앱을 만들고 싶어요";
const PREV = [{ name: "어떤 불편을 풀고 싶은지 한 문장으로 쓰기", lines: ["행사 신청을 종이로 받아서 헷갈려요"] }];
const ANSWER = { items: Nav.criteriaFor(1, "Xpress").map((c) => ({ text: `${c.text}의 초안` })), say: "2단계 초안이에요" };
REC.save(process.env.NAV_REPLAY, {
  [REC.keyOf(Nav.stageDraftPrompt(1, "Xpress", { idea: IDEA, prev: PREV }), Nav.STAGE_DRAFT_SCHEMA)]: ANSWER,
  [REC.keyOf(Nav.stageDraftPrompt(1, "Full", { idea: IDEA, prev: PREV }), Nav.STAGE_DRAFT_SCHEMA)]: ANSWER,   // Full인데 기획서 칸이 없는 답 — 502
});
const R0 = { chap: 0, title: "동아리 행사 신청 앱", items: Nav.STAGES[0].criteria.map((c) => ({ name: c.text, lines: [`${c.text} 줄`] })) };
const R1 = { chap: 1, title: "동아리 행사 신청 앱", items: Nav.criteriaFor(1, "Xpress").map((c) => ({ name: c.text, lines: [`${c.text} 줄`] })) };

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
async function untilDone() {
  for (let i = 0; i < 100; i++) { const t = (await call("GET", "/api/task")).json.task; if (t && t.state !== "running") return t; await wait(100); }
  throw new Error("맡긴 일이 끝나지 않음");
}

test("POST /api/stagedraft: 확인 값이 있어야 — 없으면 403(AI를 부르기 전)", async () => {
  assert.equal((await call("POST", "/api/stagedraft", { body: { stage: 1, idea: IDEA, prev: PREV }, token: false })).status, 403);
});

test("POST /api/stagedraft: 받은 글 · 1단계 결과로 2단계 초안 — { ok, draft: { items, say }, tokens }, 할 일 개수 · 순서는 그 등급", async () => {
  const r = await call("POST", "/api/stagedraft", { body: { stage: 1, tier: "Xpress", idea: IDEA, prev: PREV } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(Object.keys(r.json).sort(), ["draft", "ok", "tokens"]);
  assert.equal(r.json.draft.items.length, Nav.criteriaFor(1, "Xpress").length);
});

test("POST /api/stagedraft 거절: 초안을 만들지 않는 단계 · 빈 글 · 1단계 결과 모양 · 모르는 등급은 400(AI를 부르기 전), 할 일과 맞지 않는 답은 502", async () => {
  for (const [body, re] of [[{ stage: 2, idea: IDEA, prev: PREV }, /단계/], [{ stage: 1, idea: " ", prev: PREV }, /비어/], [{ stage: 1, idea: IDEA, prev: "x" }, /1단계 결과/],
    [{ stage: 1, idea: IDEA, prev: [{ name: 1, lines: [] }] }, /1단계 결과/], [{ stage: 1, tier: "Huge", idea: IDEA, prev: PREV }, /등급/]]) {
    const r = await call("POST", "/api/stagedraft", { body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60)); assert.match(r.json.reason, re);
  }
  const bad = await call("POST", "/api/stagedraft", { body: { stage: 1, tier: "Full", idea: IDEA, prev: PREV } });
  assert.equal(bad.status, 502); assert.match(bad.json.reason, /초안/);
});

test("POST /api/docs: 확인 값이 있어야 — 없으면 403 · 작업 폴더를 모르면 400(아무것도 쓰지 않는다)", async () => {
  assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 } }, token: false })).status, 403);
  const r = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 } } });
  assert.equal(r.status, 400); assert.match(r.json.reason, /폴더/);
});

test("POST /api/docs: 작업 폴더에 단계 문서를 쓰고(README는 내 글을 두고 절만 더함) 커밋 · 푸시를 Claude Code에 — 그 파일들만, 강제 푸시 없이", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const r = await call("POST", "/api/docs", { body: { topic: "동아리 행사 신청 앱", results: { 0: R0, 1: R1 } } });
  assert.equal(r.status, 200, r.text);
  assert.ok(r.json.files.includes("docs/02-plan/plan.md") && r.json.files.includes("CLAUDE.md"));
  assert.match(fs.readFileSync(path.join(DIR, "docs/01-idea/idea.md"), "utf8"), /동아리 행사 신청 앱/);
  assert.match(fs.readFileSync(path.join(DIR, "docs/02-plan/plan.md"), "utf8"), /왜 만드는지/);
  assert.ok(fs.existsSync(path.join(DIR, "docs/08-retro/README.md")), "아직인 단계도 틀");
  const readme = fs.readFileSync(path.join(DIR, "README.md"), "utf8");
  assert.ok(readme.startsWith("# test-1\n\n내가 쓴 소개"), "내 README 글은 그대로");
  assert.match(readme, /docs\/02-plan\/plan\.md/);
  const index = fs.readFileSync(path.join(DIR, "docs/README.md"), "utf8");
  assert.ok(index.startsWith("# 내 문서\n\n내가 쓴 docs 안내") && index.includes("<!-- floe:start -->"), "내 docs/README.md도 그대로 두고 절만 더함(2026-10-25 리뷰)");
  await untilDone();
  const out = JSON.parse(fs.readFileSync(STUB_OUT, "utf8"));
  assert.match(out.stdin, /docs\/02-plan\/plan\.md/); assert.match(out.stdin, /git add/); assert.match(out.stdin, /--force/);
  assert.ok(out.argv.includes("--json-schema"), "끝에 기준마다 보고하게(C-32) — 화면은 '푸시했다'는 보고로만 올라갔다고 말한다");
  assert.match(out.stdin, /원격\(origin\)에 푸시했다/);
  const again = await call("POST", "/api/docs", { body: { topic: "동아리 행사 신청 앱", results: { 0: R0, 1: R1 } } });
  assert.equal(again.status, 200, again.text);
  assert.equal(fs.readFileSync(path.join(DIR, "README.md"), "utf8").split("<!-- floe:start -->").length, 2, "두 번 올려도 README 절은 하나");
  await untilDone();
});

test("POST /api/docs: 맡긴 일이 진행 중이면 409 — 파일을 하나도 쓰지 않는다(쓰고 나서 못 맡기지 않게)", async () => {
  assert.equal(Srv.useProject(DIR), true);
  fs.writeFileSync(SLOW, "1");
  try {
    assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 } } })).status, 200);
    const plan = path.join(DIR, "docs/02-plan/plan.md"); fs.writeFileSync(plan, "건드리면 안 됨");
    const busy = await call("POST", "/api/docs", { body: { topic: "다른 앱", results: { 0: R0, 1: R1 } } });
    assert.equal(busy.status, 409, busy.text);
    assert.equal(fs.readFileSync(plan, "utf8"), "건드리면 안 됨", "409면 쓰지 않았다");
  } finally { fs.rmSync(SLOW, { force: true }); }
  await untilDone();
});

test("POST /api/docs 거절: 1 · 2단계 결과가 다 있어야 · 모양이 틀리면 400 · docs가 폴더 밖을 가리키는 바로가기면 쓰지 않는다", async () => {
  for (const [body, re] of [[{ topic: "앱", results: { 0: R0 } }, /1 · 2단계 결과가 다/], [{ topic: "앱", results: "x" }, /모양/], [{ topic: 3, results: { 0: R0, 1: R1 } }, /주제/],
    [{ topic: "앱", results: { 0: R0, 1: { ...R1, items: "x" } } }, /2단계 결과의 모양/], [{ topic: "앱", results: { 0: R0, 1: { ...R1, items: [{ name: "가", lines: ["나".repeat(2000)] }] } } }, /400자/]]) {
    const r = await call("POST", "/api/docs", { body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60)); assert.match(r.json.reason, re, "무엇이 틀렸는지 그대로(2026-10-25 리뷰)");
  }
  const link = path.join(TMP, "linked");
  fs.mkdirSync(path.join(link, ".git"), { recursive: true }); fs.symlinkSync(OUTSIDE, path.join(link, "docs"));
  assert.equal(Srv.useProject(link), true);
  const r = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 } } });
  assert.equal(r.status, 400, r.text); assert.match(r.json.reason, /바로가기/);
  assert.deepEqual(fs.readdirSync(OUTSIDE), [], "폴더 밖에는 아무것도 쓰지 않았다");
});
