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
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: STUB });
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];

const IDEA = "동아리 행사 신청 앱을 만들고 싶어요";
const PREV = [{ stage: 0, items: [{ name: "어떤 불편을 풀고 싶은지 한 문장으로 쓰기", lines: ["행사 신청을 종이로 받아서 헷갈려요"] }] }];   // 지난 단계 결과들(C-39 — 단계마다 { stage, items })
const PREV3 = [...PREV, { stage: 1, items: [{ name: "한 문장에 한 가지 일만, 애매한 말 없이 쓰기", lines: ["신청 단추를 누르면, 앱은 신청을 받는다"] }] }];
const ANSWER3 = { items: Nav.criteriaFor(2, "Xpress").map((c) => ({ text: `${c.text}의 초안`, from: ["2-1"] })), prep: ["기능 개수 세기"], say: "3단계 초안이에요" };
// C-40 — 4단계(코드 3): 1 ~ 3단계 결과로, 칸마다 예시 셋
const PREV4 = [...PREV3, { stage: 2, items: [{ name: "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", lines: ["신청하면, 앱은 받는다"] }] }];
const ANSWER4 = { items: Nav.criteriaFor(3, "Xpress").map((c, i) => ({ text: `${c.text} — 권함`, alts: [`${i} 다른 가`, `${i} 다른 나`], from: ["3-1"] })), prep: ["후보 떠올리기"], say: "4단계 초안이에요" };
const AVOID = { i: 1, texts: ["이미 본 예시"] };
const ANSWER = { items: Nav.criteriaFor(1, "Xpress").map((c) => ({ text: `${c.text}의 초안` })), say: "2단계 초안이에요" };
const PREP_ANSWER = { items: [2, 3, 4, 5, 6, 7].map((n) => ({ stage: n + 1, title: n === 2 ? "행사 신청 기능 여섯을 문장으로" : "", think: `생각 ${n}`, act: `맡길 일 ${n}`, from: n === 2 ? "기획서 3절 '한 문장에 한 가지'" : "" })), say: "준비했어요" };   // C-56 R-2 /api/prepare
REC.save(process.env.NAV_REPLAY, {
  [REC.keyOf(Nav.preparePrompt("Xpress", { idea: IDEA, prev: PREV3, base: "" }), Nav.PREPARE_SCHEMA)]: PREP_ANSWER,
  [REC.keyOf(Nav.stageDraftPrompt(1, "Xpress", { idea: IDEA, prev: PREV }), Nav.STAGE_DRAFT_SCHEMA)]: ANSWER,
  [REC.keyOf(Nav.stageDraftPrompt(1, "Xpress", { idea: IDEA, prev: PREV, work: "src/apply.js를 만들었어요" }), Nav.STAGE_DRAFT_SCHEMA)]: { ...ANSWER, say: "다시 맞췄어요" },   // C-56 R-5 방금 한 일
  [REC.keyOf(Nav.stageDraftPrompt(1, "Full", { idea: IDEA, prev: PREV }), Nav.STAGE_DRAFT_SCHEMA)]: ANSWER,   // Full인데 기획서 칸이 없는 답 — 502
  [REC.keyOf(Nav.stageDraftPrompt(2, "Xpress", { idea: IDEA, prev: PREV3 }), Nav.STAGE_DRAFT_SCHEMA)]: ANSWER3,   // 3단계(C-39) — 1 · 2단계 결과로
  [REC.keyOf(Nav.stageDraftPrompt(3, "Xpress", { idea: IDEA, prev: PREV4 }), Nav.STAGE_DRAFT_SCHEMA)]: ANSWER4,   // 4단계(C-40) — 예시 셋
  [REC.keyOf(Nav.stageDraftPrompt(3, "Xpress", { idea: IDEA, prev: PREV4, avoid: AVOID }), Nav.STAGE_DRAFT_SCHEMA)]: ANSWER4,   // 다른 예시(그 칸만 다시)
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

test("POST /api/stagedraft 3단계(C-39): 1 · 2단계 결과로 — 칸마다 재료({s, i}) · 준비할 것. 지난 단계(2단계)가 빠지면 400", async () => {
  const r = await call("POST", "/api/stagedraft", { body: { stage: 2, tier: "Xpress", idea: IDEA, prev: PREV3 } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.draft.items.length, Nav.criteriaFor(2, "Xpress").length);
  assert.deepEqual(r.json.draft.items[0].from, [{ s: 1, i: 0 }]); assert.deepEqual(r.json.draft.prep, ["기능 개수 세기"]);
  const miss = await call("POST", "/api/stagedraft", { body: { stage: 2, tier: "Xpress", idea: IDEA, prev: PREV } });
  assert.equal(miss.status, 400); assert.match(miss.json.reason, /지난 단계 결과/);
  const ahead = await call("POST", "/api/stagedraft", { body: { stage: 1, tier: "Xpress", idea: IDEA, prev: PREV3 } });
  assert.equal(ahead.status, 400, "지금 단계 이후의 결과는 받지 않는다");
});

test("POST /api/stagedraft 4단계(C-40): 칸마다 예시 셋(text · alts) · '다른 예시'(avoid — 이미 본 예시를 피해 다시) · avoid 모양이 틀리면 400", async () => {
  const r = await call("POST", "/api/stagedraft", { body: { stage: 3, tier: "Xpress", idea: IDEA, prev: PREV4 } });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(r.json.draft.items[0].alts, ["0 다른 가", "0 다른 나"]); assert.deepEqual(r.json.draft.items[0].from, [{ s: 2, i: 0 }]);
  const again = await call("POST", "/api/stagedraft", { body: { stage: 3, tier: "Xpress", idea: IDEA, prev: PREV4, avoid: AVOID } });
  assert.equal(again.status, 200, again.text);
  for (const avoid of [{ i: 9, texts: ["가"] }, { i: 1, texts: [] }, { i: 1, texts: ["가".repeat(400)] }, "x"]) {
    const b = await call("POST", "/api/stagedraft", { body: { stage: 3, tier: "Xpress", idea: IDEA, prev: PREV4, avoid } });
    assert.equal(b.status, 400, JSON.stringify(avoid)); assert.match(b.json.reason, /다른 예시/);
  }
});

test("POST /api/stagedraft 거절: 초안을 만들지 않는 단계 · 빈 글 · 1단계 결과 모양 · 모르는 등급은 400(AI를 부르기 전), 할 일과 맞지 않는 답은 502", async () => {
  for (const [body, re] of [[{ stage: 3, idea: IDEA, prev: PREV3 }, /단계/], [{ stage: 1, idea: " ", prev: PREV }, /비어/], [{ stage: 1, idea: IDEA, prev: "x" }, /지난 단계 결과/],
    [{ stage: 1, idea: IDEA, prev: [{ stage: 0, items: [{ name: 1, lines: [] }] }] }, /지난 단계 결과/], [{ stage: 1, idea: IDEA, prev: [{ name: "옛 모양", lines: [] }] }, /지난 단계 결과/],
    [{ stage: 1, tier: "Huge", idea: IDEA, prev: PREV }, /등급/]]) {
    const r = await call("POST", "/api/stagedraft", { body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60)); assert.match(r.json.reason, re);
  }
  const bad = await call("POST", "/api/stagedraft", { body: { stage: 1, tier: "Full", idea: IDEA, prev: PREV } });
  assert.equal(bad.status, 502); assert.match(bad.json.reason, /초안/);
});

// C-56 R-2(2026-10-28): 2단계 끝 준비된 퀘스트 — AI 한 번(재생), 1 · 2단계 결과가 다 있어야, 전문 용어 이름은 비움 · 근거 없으면 새로 정함
test("POST /api/prepare: 1 · 2단계 결과 · 받은 글(· 기준)로 3 ~ 8단계 카드 여섯 — 이름 · 생각 · 행동 · 근거; 1단계만 있으면 400", async () => {
  const r = await call("POST", "/api/prepare", { body: { tier: "Xpress", idea: IDEA, prev: PREV3 } });
  assert.equal(r.status, 200, r.text); assert.deepEqual(Object.keys(r.json.prepare.cards), ["2", "3", "4", "5", "6", "7"]);
  assert.equal(r.json.prepare.cards["2"].title, "행사 신청 기능 여섯을 문장으로"); assert.equal(r.json.prepare.cards["3"].from, "새로 정함");
  assert.equal((await call("POST", "/api/prepare", { body: { tier: "Xpress", idea: IDEA, prev: PREV } })).status, 400, "2단계 결과가 없으면");
  assert.equal((await call("POST", "/api/prepare", { body: { tier: "Xpress", idea: IDEA, prev: PREV3 }, token: false })).status, 403, "확인 값이 없으면 AI를 부르기 전에 403(새 맥락 리뷰 2026-10-28)");
  assert.equal((await call("POST", "/api/prepare", { body: { tier: "Xpress", idea: IDEA, prev: PREV3, base: "가".repeat(2000) } })).status, 400, "기준 카드 글은 1,500자까지");
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

test("POST /api/docs(C-39): 누가 정했나 · 플로로 초안 · 재료 · 준비할 것 · 날짜 · 완료 기준을 받아 증빙 칸 · 기획서(docs/PRD.md) · 결정 기록(docs/decisions.md)을 쓴다 — 모양이 틀리면 400", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const check = (r) => r.items.map((x) => ({ text: x.name, met: true, evidence: `${x.name}: 적음` }));
  const E0 = { ...R0, at: "2026-10-25", passed: "2026-10-25", check: check(R0), items: R0.items.map((x, i) => ({ ...x, by: i ? "ok" : "edit", draft: `${x.name} 초안` })) };
  const E1 = { ...R1, at: "2026-10-25", prep: ["1단계 불편 다시 읽기"], check: check(R1), items: R1.items.map((x) => ({ ...x, by: "ok", draft: x.lines[0], from: [{ s: 0, i: 0 }] })) };
  const r = await call("POST", "/api/docs", { body: { topic: "동아리 행사 신청 앱", idea: IDEA, results: { 0: E0, 1: E1 } } });
  assert.equal(r.status, 200, r.text);
  for (const f of ["docs/PRD.md", "docs/decisions.md"]) assert.ok(r.json.files.includes(f), f);
  const prd = fs.readFileSync(path.join(DIR, "docs/PRD.md"), "utf8"), dec = fs.readFileSync(path.join(DIR, "docs/decisions.md"), "utf8"), idea = fs.readFileSync(path.join(DIR, "docs/01-idea/idea.md"), "utf8");
  assert.ok(prd.includes(IDEA), "기획서에 처음 말한 것"); assert.match(dec, /고침/); assert.match(idea, /## 증빙/); assert.match(idea, /2026-10-25/);
  assert.match(fs.readFileSync(path.join(DIR, "docs/02-plan/plan.md"), "utf8"), /재료: 1단계 Ⅰ 불편/);
  await untilDone();
  for (const bad of [{ ...E1, items: E1.items.map((x) => ({ ...x, by: "ai" })) }, { ...E1, items: E1.items.map((x) => ({ ...x, from: [{ s: 9, i: 0 }] })) }, { ...E1, at: "어제" },
    { ...E1, prep: ["가", "나", "다", "라"] }, { ...E1, check: [{ text: "가", met: "yes", evidence: "" }] }]) {
    const b = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: E0, 1: bad } } });
    assert.equal(b.status, 400, JSON.stringify(bad).slice(0, 80)); assert.match(b.json.reason, /2단계 결과의 모양/);
  }
  assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", idea: "가".repeat(1000), results: { 0: E0, 1: E1 } } })).status, 400, "처음 말한 것은 400자까지");
});

// F-62(2026-10-28): 관문에서 까닭을 적고 넘긴 기준(check[].skipped · skip{reason, items})이 단계 문서의 완료 기준 표에 '넘김(까닭: …)', 결정 기록의 관문 줄에 '넘김 n — 까닭: …'으로 남는다 — 서버가 버리지 않게
test("POST /api/docs(F-62): 넘긴 기준의 까닭이 단계 문서 · 결정 기록에 남는다, 까닭이 너무 길면 400", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const check = (r) => r.items.map((x) => ({ text: x.name, met: true, evidence: `${x.name}: 적음` }));
  const E0 = { ...R0, at: "2026-10-28", passed: "2026-10-28", check: check(R0) };
  const c1 = check(R1); c1[1] = { text: c1[1].text, met: true, skipped: true, evidence: "" };
  const E1 = { ...R1, at: "2026-10-28", passed: "2026-10-28", check: c1, skip: { reason: "이번 미션은 공개하지 않아요", items: [c1[1].text] } };
  const r = await call("POST", "/api/docs", { body: { topic: "동아리 행사 신청 앱", results: { 0: E0, 1: E1 } } });
  assert.equal(r.status, 200, r.text);
  const plan = fs.readFileSync(path.join(DIR, "docs/02-plan/plan.md"), "utf8"), dec = fs.readFileSync(path.join(DIR, "docs/decisions.md"), "utf8");
  assert.match(plan, /넘김\(까닭: 이번 미션은 공개하지 않아요\)/, "단계 문서의 완료 기준 표"); assert.ok(!plan.includes(`| ${c1[1].text} | 됨 |`), "넘긴 기준이 '됨'으로 적히지 않는다");
  assert.match(dec, /기준 \d+\/\d+ · 넘김 1 — 까닭: 이번 미션은 공개하지 않아요/, "결정 기록 관문 줄");
  await untilDone();
  assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: E0, 1: { ...E1, skip: { reason: "가".repeat(300), items: [] } } } } })).status, 400, "까닭은 200자까지");
  assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: E0, 1: { ...E1, check: c1.map((c) => ({ ...c, skipped: "yes" })) } } } })).status, 400, "skipped는 참 · 거짓만");
});

// F-70(2026-10-28, 결정 모음 A-04): 6단계에서 '코드 파일을 만드시겠습니까?'에 아니요 — 서버는 결과의 nocode(true만)를 받아 결정 기록 관문 줄에 남긴다
test("POST /api/docs(F-70): 6단계를 코드 없이 지났으면(nocode) 결정 기록 관문 줄에 '코드 없이 지남', nocode는 true만", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const R5 = { items: [{ name: "확인 방법을 먼저 정하고 만들기", lines: ["목차 문서로 확인"] }], at: "2026-10-28", passed: "2026-10-28", nocode: true };
  const r = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1, 5: R5 } } });
  assert.equal(r.status, 200, r.text);
  assert.match(fs.readFileSync(path.join(DIR, "docs/decisions.md"), "utf8"), /6단계 \| 관문 \|[^\n]*코드 없이 지남/);
  await untilDone();
  assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1, 5: { ...R5, nocode: "yes" } } } })).status, 400, "nocode는 true만");
});

// 지식 퀘스트 C-47(2026-10-29): 관문에서 적은 배운 것(learned — 400자, 빈 글이면 '비어 있음')과 처음 뜻(goal — { same: true } | { changed })을 받는다
test("POST /api/docs(C-47): learned · goal을 받아 단계 문서의 '배운 것' · 기획서의 바뀐 뜻에 쓴다, 모양이 틀리면 400", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const E0 = { ...R0, at: "2026-10-29", passed: "2026-10-29", learned: "기준을 먼저 적으니 쉬웠다" }, E1 = { ...R1, at: "2026-10-29", passed: "2026-10-29", learned: "", goal: { changed: "출석까지" } };
  const r = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: E0, 1: E1 } } });
  assert.equal(r.status, 200, r.text);
  assert.match(fs.readFileSync(path.join(DIR, "docs/01-idea/idea.md"), "utf8"), /기준을 먼저 적으니 쉬웠다/);
  assert.match(fs.readFileSync(path.join(DIR, "docs/02-plan/plan.md"), "utf8"), /비어 있음 — 관문에서 적지 않았어요/);
  assert.match(fs.readFileSync(path.join(DIR, "docs/PRD.md"), "utf8"), /바뀐 뜻 — 2단계 관문/);
  await untilDone();
  for (const bad of [{ ...E0, learned: "가".repeat(401) }, { ...E0, learned: 3 }, { ...E0, goal: { same: "yes" } }, { ...E0, goal: { changed: "" } }, { ...E0, goal: { same: true, changed: "x" } }])
    assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: bad, 1: E1 } } })).status, 400, JSON.stringify(bad.goal || bad.learned).slice(0, 40));
});

// 지식 퀘스트 C-52(2026-10-29, PRD 9절 10번): 공개인지 모르는 저장소(원격이 GitHub가 아님 — gh가 답하지 못한다, 밖으로 묻지 않는다)면 쓰기 전에 409 why public,
//   publicOk와 다시 보내면 쓰고, 그 저장소는 다음부터 묻지 않는다(열쇠는 NAV_USAGE_FILE 옆 파일)
const HAS_GIT = require("node:child_process").spawnSync("git", ["--version"]).status === 0;
test("POST /api/docs(C-52): 공개이거나 공개인지 모르는 저장소면 쓰기 전에 한 번 묻는다 — publicOk면 쓰고 다음부터 묻지 않는다", { skip: !HAS_GIT && "git 없음" }, async () => {
  const { spawnSync } = require("node:child_process"), REPO = path.join(TMP, "pub-repo");
  fs.mkdirSync(REPO); spawnSync("git", ["init", "-q"], { cwd: REPO }); spawnSync("git", ["remote", "add", "origin", path.join(TMP, "elsewhere.git")], { cwd: REPO });
  assert.equal(Srv.useProject(REPO), true);
  const body = { topic: "앱", results: { 0: R0, 1: R1 } };
  const r1 = await call("POST", "/api/docs", { body });
  assert.equal(r1.status, 409, r1.text); assert.equal(r1.json.why, "public"); assert.match(r1.json.reason, /공개인지 확인하지 못했어요/);
  assert.ok(!fs.existsSync(path.join(REPO, "docs")), "묻는 동안은 아무것도 쓰지 않는다");
  const r2 = await call("POST", "/api/docs", { body: { ...body, publicOk: true } });
  assert.equal(r2.status, 200, r2.text); assert.ok(fs.existsSync(path.join(REPO, "docs/PRD.md")));
  await untilDone();
  const saved = JSON.parse(fs.readFileSync(path.join(TMP, "usage-public-ok.json"), "utf8"));
  assert.equal(saved.keys.length, 1); assert.ok(!JSON.stringify(saved).includes("elsewhere"), "주소는 남기지 않는다");
  assert.equal((await call("POST", "/api/docs", { body })).status, 200, "같은 저장소는 다시 묻지 않는다");
  await untilDone();
  assert.equal(Srv.useProject(DIR), true);
});

// F-68(2026-10-28): 받은 글 전부(source)를 받아 docs/00-source/idea.md에 쓴다 — 64KB까지, 넘으면 400(잘라 쓰지 않는다 — 화면이 알린다)
test("POST /api/docs(F-68): source(받은 글 전부)를 docs/00-source/idea.md에 통째로, 1단계 문서는 줄로 가리킨다, 64KB 넘으면 400", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const long = Array.from({ length: 40 }, (_, i) => `${i + 1}줄 ${"나".repeat(15)}`).join("\n");
  const r = await call("POST", "/api/docs", { body: { topic: "앱", idea: long.slice(0, 400), source: long, results: { 0: R0, 1: R1 } } });
  assert.equal(r.status, 200, r.text); assert.ok(r.json.files.includes("docs/00-source/idea.md"), r.json.files.join(","));
  assert.match(fs.readFileSync(path.join(DIR, "docs/00-source/idea.md"), "utf8"), /40 \| 40줄/);
  assert.match(fs.readFileSync(path.join(DIR, "docs/01-idea/idea.md"), "utf8"), /1 ~ 40줄/);
  await untilDone();
  const big = await call("POST", "/api/docs", { body: { topic: "앱", idea: "x", source: "z".repeat(64 * 1024 + 1), results: { 0: R0, 1: R1 } } }); assert.ok([400, 413].includes(big.status), `64KB까지 — 거절(본문 자체가 크면 413): ${big.status}`); assert.ok(!fs.existsSync(path.join(DIR, "docs/00-source/idea.md")) || !fs.readFileSync(path.join(DIR, "docs/00-source/idea.md"), "utf8").includes("zzzz"), "잘라 쓰지 않는다");
});

// C-56 R-1(2026-10-28): 기준 카드 — 칸마다 { text(200자), by(moved · me · null), blank } · 받은 글 줄(lines). 모양이 틀리면 400
test("POST /api/docs(C-56): card(기준 카드)를 받아 docs/base.md를 쓴다, 모양이 틀리면 400", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const B = require(path.join(BACK, "basecard.js")), card = B.withEdits(B.build({ results: { 0: R0 }, source: "" }), { success: "신청 40건" });
  const r = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 }, card } });
  assert.equal(r.status, 200, r.text); assert.ok(r.json.files.includes("docs/base.md"));
  assert.match(fs.readFileSync(path.join(DIR, "docs/base.md"), "utf8"), /\| 성공 \| 신청 40건 \| 직접 \|/);
  await untilDone();
  assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 }, card: { success: { text: "가".repeat(300), by: "me", blank: false } } } })).status, 400);
  assert.equal((await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 }, card: { success: { text: "x", by: "ai", blank: false } } } })).status, 400, "누가는 moved · me만");
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
  fs.mkdirSync(path.join(link, ".git"), { recursive: true }); fs.symlinkSync(OUTSIDE, path.join(link, "docs"), "junction");   // Windows는 폴더 바로가기(junction)만 권한 없이 만든다 — 다른 OS에서는 무시되는 인자(두승현 2026-10-26, EPERM)
  assert.equal(Srv.useProject(link), true);
  const r = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 } } });
  assert.equal(r.status, 400, r.text); assert.match(r.json.reason, /바로가기/);
  assert.deepEqual(fs.readdirSync(OUTSIDE), [], "폴더 밖에는 아무것도 쓰지 않았다");
});

// C-56 R-5(2026-10-28): 작업을 따라 — 본문 work(방금 한 일, WORK_MAX까지)를 주면 요청문에 들어가 다시 맞춘 초안이 온다. 너무 길면 400
test("POST /api/stagedraft work(C-56 R-5): 방금 한 일을 넣으면 그 요청문으로(재생 답 '다시 맞췄어요'), WORK_MAX를 넘으면 400", async () => {
  const r = await call("POST", "/api/stagedraft", { body: { stage: 1, tier: "Xpress", idea: IDEA, prev: PREV, work: "src/apply.js를 만들었어요" } });
  assert.equal(r.status, 200, r.text); assert.equal(r.json.draft.say, "다시 맞췄어요");
  assert.equal((await call("POST", "/api/stagedraft", { body: { stage: 1, tier: "Xpress", idea: IDEA, prev: PREV, work: "x".repeat(Nav.WORK_MAX + 1) } })).status, 400);
});
