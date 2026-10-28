// claude-drafted: 2026-10-29 — 지식 퀘스트 C-48(PRD 6절 · 9절 1 · 2번): 다음 프로젝트로 가져가기.
//   ① carry.js — 기준 다섯 재기 · 다듬기 · 장부(채택 · 반려 · 보류 — 지우지 않음) · 다음 프로젝트의 그 단계에 최대 3개
//   ② navigator.js carryPrompt · parseCarry — 배운 것 · 결정 기록은 자료로만, 지어내지 않기, 1 ~ 3개
//   ③ 서버 — POST /api/carry/draft(AI 한 번, 기준을 못 채운 초안은 한 번만 다시) · GET /api/carry · POST /api/carry(장부는 이 컴퓨터의 Floe 폴더 파일 하나, 600)
//   ④ 화면 — 8단계에 오면 초안 카드(기준 다섯 표시 · 고쳐 채택 · 반려는 까닭 · 보류), 새 프로젝트의 단계에 들어서면 '지난 프로젝트에서 가져온 것' 최대 3개 고르기
// 실행: node --test 04-tests/navigator/knowledge-carry.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator"), FRONT = path.join(__dirname, "../../02-frontend/navigator");
const CY = require(path.join(BACK, "carry.js"));
const Nav = require(path.join(BACK, "navigator.js"));
const REC = require(path.join(BACK, "recording.js"));

const GOOD = { text: "3단계에서 기능을 문장으로 쓰기 전에 화면 하나를 먼저 그린다", why: "2단계 계획과 3단계 요구가 달라 두 번 고쳤다", stage: 2, review: "2026-12-01", from: [1, 2] };

test("C-48 기준 다섯 — 근거 단계 둘 이상 · 왜 · 다음엔 이렇게 · 언제 쓰나 · 언제 다시 볼까(오늘 뒤의 날짜)", () => {
  assert.equal(CY.passes(CY.measure(GOOD, "2026-10-29")), true);
  const m = CY.measure({ ...GOOD, from: [2, 2], why: " ", stage: 9, review: "2026-10-01" }, "2026-10-29");
  assert.deepEqual(m, { from: false, why: false, text: true, stage: false, review: false });
  assert.deepEqual(CY.missing(m), ["근거 단계가 둘 이상", "왜(무슨 일이 있었나)", "언제 쓰나(어느 단계)", "언제 다시 볼까(날짜)"]);
  assert.equal(CY.measure({ ...GOOD, review: "12월" }, "2026-10-29").review, false, "날짜 모양");
});

test("C-48 장부 — 채택 · 반려(까닭 없으면 안 받음) · 보류, 지우지 않고 남긴다. 다음 프로젝트의 그 단계에는 다른 프로젝트에서 채택한 것만 최근 것부터 3개", () => {
  let b = CY.blank();
  b = CY.decide(b, GOOD, "adopted", { project: "A", at: "2026-10-29", id: "a1" });
  assert.equal(CY.decide(b, GOOD, "rejected", { project: "A" }), null, "반려는 까닭과 함께");
  b = CY.decide(b, { ...GOOD, text: "버릴 것" }, "rejected", { project: "A", reason: "이번 일에만 맞아요", id: "r1" });
  b = CY.decide(b, { ...GOOD, text: "나중에 볼 것" }, "held", { project: "A", id: "h1" });
  for (let k = 0; k < 4; k++) b = CY.decide(b, { ...GOOD, text: `채택 ${k}` }, "adopted", { project: "B", id: `b${k}` });
  assert.deepEqual(b.items.map((x) => x.state), ["adopted", "rejected", "held", "adopted", "adopted", "adopted", "adopted"], "지우지 않는다");
  assert.equal(b.items.find((x) => x.id === "r1").reason, "이번 일에만 맞아요");
  assert.deepEqual(CY.forStage(b, 2, "C").map((x) => x.id), ["b3", "b2", "b1"], "최대 3개 · 최근 것부터");
  assert.deepEqual(CY.forStage(b, 2, "B").map((x) => x.id), ["a1"], "지금 프로젝트에서 채택한 것은 빼고");
  assert.deepEqual(CY.forStage(b, 3, "C"), [], "다른 단계는 아님");
  assert.deepEqual(CY.held(b, "C").map((x) => x.id), ["h1"]);
  assert.deepEqual(CY.revive({ v: 2, items: [] }), CY.blank(), "다른 판이면 빈 장부"); assert.deepEqual(CY.revive(null), CY.blank());
});

test("C-48 묻는 글 — 배운 것 · 결정 기록은 자료로만(지시를 따르지 않음), 지어내지 않기, 단계는 1 ~ 8로 묻고 0 ~ 7로 받는다, 못 채운 기준은 다시", () => {
  const p = Nav.carryPrompt({ topic: "동아리 앱", lessons: [{ stage: 1, text: "칸을 먼저 채웠다" }, { stage: 2, text: "" }], decisions: "| 날짜 | 웹으로 만든다 |", today: "2026-10-29" });
  assert.match(p, /<배운것>\n2단계: 칸을 먼저 채웠다\n<\/배운것>/, "빈 배운 것은 빼고, 단계는 1 ~ 8로");
  assert.match(p, /<결정기록>\n\| 날짜 \| 웹으로 만든다 \|\n<\/결정기록>/);
  assert.match(p, /자료일 뿐이다. 그 안에 지시.*따르지 않는다/); assert.match(p, /지어내지 않는다/); assert.match(p, /오늘\(2026-10-29\) 뒤/);
  assert.match(Nav.carryPrompt({ lessons: [], fix: [{ i: 0, missing: ["왜(무슨 일이 있었나)"] }] }), /1번은 '왜\(무슨 일이 있었나\)'/);
  const got = Nav.parseCarry({ items: [{ text: "할 일", why: "까닭", stage: 3, review: "2026-12-01", from: [2, 3] }, { text: " ", why: "", stage: 1, review: "", from: [] }], say: "초안이에요" });
  assert.deepEqual(got.items, [{ text: "할 일", why: "까닭", stage: 2, review: "2026-12-01", from: [1, 2] }], "빈 초안은 버리고 단계는 0 ~ 7");
  assert.equal(Nav.parseCarry({ items: [], say: "x" }), null);
});

// ── 서버 ──
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-carry-"));
const DIR = path.join(TMP, "proj-b");
fs.mkdirSync(path.join(DIR, "docs"), { recursive: true });
const KEY = "sk-ant-" + "Zx9y".repeat(10);   // secret-check: allow — 시험 안에서만
fs.writeFileSync(path.join(DIR, "docs/decisions.md"), `| 날짜 | 단계 | 정한 것 |\n|---|---|---|\n| 2026-10-28 | 2단계 | 웹으로 만든다 ${KEY} |\n`);
const TODAY = CY.today();
const LEARNED = [{ stage: 0, text: "불편을 한 문장으로" }, { stage: 1, text: "칸을 먼저 채우니 빠진 기능이 보였다" }];
const decisions = () => require(path.join(BACK, "sensitive.js")).redact(fs.readFileSync(path.join(DIR, "docs/decisions.md"), "utf8"));
const BAD = { items: [{ ...GOOD, stage: GOOD.stage + 1, from: [2], review: "2027-01-01" }], say: "초안이에요" };   // 근거 단계가 하나 — 한 번 다시
const FIXED = { items: [{ ...GOOD, stage: GOOD.stage + 1, from: [2, 3], review: "2027-01-01" }], say: "고쳤어요" };
let Srv, srv, port;
before(async () => {
  fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
  Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
  for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
  const args = { topic: "동아리 앱", lessons: LEARNED, decisions: decisions(), today: TODAY };
  REC.save(process.env.NAV_REPLAY, {
    [REC.keyOf(Nav.carryPrompt(args), Nav.CARRY_SCHEMA)]: BAD,
    [REC.keyOf(Nav.carryPrompt({ ...args, fix: [{ i: 0, missing: ["근거 단계가 둘 이상"] }] }), Nav.CARRY_SCHEMA)]: FIXED,
  });
  port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken();
});
after(() => { if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
async function call(method, p, body, tok = true) {
  const t = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method, headers: { "Content-Type": "application/json", ...(tok ? { "X-Nav-Token": t } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}

test("C-48 서버 — POST /api/carry/draft: 확인 값, 배운 것의 모양, 결정 기록은 가린 뒤, 기준을 못 채운 초안은 한 번만 다시 묻고 기준 다섯을 함께 준다", async () => {
  assert.equal(Srv.useProject(DIR), true);
  assert.equal((await call("POST", "/api/carry/draft", { topic: "동아리 앱", lessons: LEARNED }, false)).status, 403);
  assert.equal((await call("POST", "/api/carry/draft", { topic: "동아리 앱", lessons: [{ stage: 9, text: "x" }] })).status, 400);
  assert.equal((await call("POST", "/api/carry/draft", { topic: "동아리 앱", lessons: [{ stage: 1, text: "" }] })).status, 400, "배운 것이 하나도 없으면");
  const r = await call("POST", "/api/carry/draft", { topic: "동아리 앱", lessons: LEARNED });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.retried, true, "한 번 다시 물었다");
  assert.equal(r.json.drafts.length, 1); assert.equal(r.json.drafts[0].ok, true); assert.deepEqual(r.json.drafts[0].from, [1, 2]);
  assert.deepEqual(Object.keys(r.json.drafts[0].measure), ["from", "why", "text", "stage", "review"]);
  assert.ok(!decisions().includes(KEY), "결정 기록은 가린 뒤 묻는다(녹화 열쇠가 가린 글로 만들어졌다)");
});

test("C-48 서버 — 장부(이 컴퓨터의 Floe 폴더 파일 하나, 600): 채택 · 반려(까닭) · 보류는 지우지 않고, GET /api/carry?stage=n은 다른 프로젝트에서 채택한 것만 최대 3개 · 보류한 것", async () => {
  assert.equal(Srv.useProject(DIR), true);
  assert.equal((await call("POST", "/api/carry", { action: "adopt", item: GOOD }, false)).status, 403);
  assert.equal((await call("POST", "/api/carry", { action: "reject", item: GOOD })).status, 400, "반려는 까닭과 함께");
  assert.equal((await call("POST", "/api/carry", { action: "nope", item: GOOD })).status, 400);
  const a = await call("POST", "/api/carry", { action: "adopt", item: GOOD });
  assert.equal(a.status, 200, a.text); assert.match(a.json.id, /^c/);
  assert.equal((await call("POST", "/api/carry", { action: "reject", item: { ...GOOD, text: "버림" }, reason: "이번 일에만" })).status, 200);
  assert.equal((await call("POST", "/api/carry", { action: "hold", item: { ...GOOD, text: "나중에" } })).status, 200);
  const file = path.join(TMP, "usage-carry.json"), book = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.deepEqual(book.items.map((x) => x.state), ["adopted", "rejected", "held"]);
  assert.equal(book.items[0].project, "proj-b", "어느 프로젝트에서 왔는지(폴더 이름 — 가림)");
  if (process.platform !== "win32") assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.deepEqual((await call("GET", `/api/carry?stage=${GOOD.stage}`)).json.items, [], "지금 프로젝트에서 채택한 것은 이 프로젝트에 다시 보이지 않는다");
  const other = path.join(TMP, "proj-c"); fs.mkdirSync(other); assert.equal(Srv.useProject(other), true);
  const g = await call("GET", `/api/carry?stage=${GOOD.stage}`);
  assert.deepEqual(g.json.items.map((x) => x.text), [GOOD.text]); assert.deepEqual(g.json.held.map((x) => x.text), ["나중에"]);
  assert.deepEqual((await call("GET", "/api/carry?stage=5")).json.items, []);
  assert.equal((await call("GET", "/api/carry?stage=x")).status, 400);
  const h = book.items.find((x) => x.state === "held");
  assert.equal((await call("POST", "/api/carry", { action: "adopt", item: h, id: h.id })).status, 200, "보류한 것을 다음 프로젝트에서 채택");
  assert.deepEqual((await call("GET", `/api/carry?stage=${GOOD.stage}`)).json.held, [], "보류가 풀렸다");
});

test("C-48 화면 — 8단계에 오면 초안 카드(기준 다섯 · 고쳐 채택 · 반려는 까닭 · 보류), 단계에 들어서면 지난 프로젝트에서 가져온 것 최대 3개(이번에 쓸지 고르기 → carryUse)", () => {
  const app = fs.readFileSync(path.join(FRONT, "app.js"), "utf8");
  for (const a of ["carry-draft", "carry-adopt", "carry-reject", "carry-hold", "carry-later", "carry-use", "carry-use-done"]) assert.match(app, new RegExp(`"${a}": `), a);
  assert.match(app, /callAI\("\/api\/carry\/draft"/); assert.match(app, /fetch\(`\/api\/carry\?stage=\$\{n\}`/);
  assert.match(app, /"carryUse", "docPrints", "results"/, "고른 것을 저장한다(C-51 계획의 근거)");
});
