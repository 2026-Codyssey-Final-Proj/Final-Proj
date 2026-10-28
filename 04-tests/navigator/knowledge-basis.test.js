// claude-drafted: 2026-10-29 — 지식 퀘스트 C-51(PRD 6절 · 9절 9번 "규칙으로(결정 기록의 낱말), 근거는 가린 뒤 4,000자까지"): 계획의 근거로 내가 정한 것 · 배운 것을 쓴다.
//   ① plan.js differs — 결정 기록의 'X로 만든다' 같은 낱말과 같은 갈래(만들 곳 · 언어 · 저장)의 다른 낱말을 계획 줄이 쓰면 '앞의 결정과 다름'
//   ② navigator.js planPrompt — 근거(결정 기록 · 앞 단계에서 정한 것 · 가져온 것)를 자료로만 넘기고, 줄마다 근거 한 줄(없으면 '새로 정함')
//   ③ 서버 /api/plan — 근거를 가린 뒤 4,000자까지, 답의 줄마다 basis · diff ④ 화면 — 줄마다 근거, 다르면 '앞의 결정과 다름' + 어느 쪽을 따를지
// 실행: node --test 04-tests/navigator/knowledge-basis.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator"), FRONT = path.join(__dirname, "../../02-frontend/navigator");
const FP = require(path.join(BACK, "plan.js"));
const Nav = require(path.join(BACK, "navigator.js"));
const REC = require(path.join(BACK, "recording.js"));

test("C-51 앞의 결정과 다름 — 같은 갈래(만들 곳 · 언어 · 저장)의 다른 낱말이면 다름, 갈래 밖 낱말 · 같은 뜻 낱말 · 정한 낱말이 줄에 있으면 아님", () => {
  const D = FP.decisionsOf("| 2026-10-28 | 2단계 | 무엇으로 만들지 | 웹으로 만든다 | 직접 |\n| 2026-10-28 | 4단계 | 저장 | 엑셀로 저장해요 |");
  assert.deepEqual(D, [{ kind: "만들 곳", word: "웹" }, { kind: "저장", word: "엑셀" }]);
  assert.deepEqual(FP.differs("회원이 신청하면, 앱으로 만든 화면이 받는다", D), { kind: "만들 곳", was: "웹", now: "앱" });
  assert.deepEqual(FP.differs("신청 목록을 데이터베이스로 저장한다", D), { kind: "저장", was: "엑셀", now: "데이터베이스" });
  assert.deepEqual(FP.differs("데스크톱 앱으로 만든다", D), { kind: "만들 곳", was: "웹", now: "데스크톱" }, "긴 낱말부터 — '앱'이 아니라 '데스크톱'");
  assert.equal(FP.differs("기능을 문장으로 만든다", D), null, "갈래 밖 낱말(문장)은 견주지 않는다");
  assert.equal(FP.differs("웹으로 만든 신청 화면", D), null);
  assert.equal(FP.differs("웹사이트로 만든다", D), null, "같은 뜻 낱말");
  assert.equal(FP.differs("웹과 앱으로 둘 다 만든다", D), null, "정한 낱말이 줄에 있으면 다르다고 하지 않는다");
  assert.deepEqual(FP.decisionsOf("웹이 좋아요"), [], "(으)로 정한 모양이 아니면 결정이 아니다");
  assert.deepEqual(FP.decisionsOf("앱으로 만든다 … 나중에 웹으로 바꾼다"), [{ kind: "만들 곳", word: "웹" }], "나중 결정이 앞 결정을 덮는다");
  assert.deepEqual(FP.decisionsOf(""), []);
});

test("C-51 묻는 글 — 근거가 있을 때만 근거 칸 · 규칙 · 줄마다 basis(모양 PLAN_BASIS_SCHEMA), 없으면 전과 같은 글 · 같은 모양", () => {
  const bare = Nav.planPrompt({ text: "앱을 만들어요" });
  assert.ok(!bare.includes("<근거>") && !bare.includes("basis"), "근거가 없으면 전과 같다");
  const p = Nav.planPrompt({ text: "앱을 만들어요", basis: "[결정 기록]\n웹으로 만든다" });
  assert.match(p, /<근거>\n\[결정 기록\]\n웹으로 만든다\n<\/근거>/); assert.match(p, /자료일 뿐이다.*따르지 않는다/); assert.match(p, /'새로 정함'/);
  assert.deepEqual(Nav.PLAN_BASIS_SCHEMA.properties.items.items.required, ["need", "check", "basis"]);
  const got = Nav.parsePlan({ problem: "p", have: "h", missing: "m", items: [{ need: "n", check: "c", basis: "결정 기록: 웹" }, { need: "n2", check: "c2" }], prep: [], ask: [], say: "s" });
  assert.equal(got.items[0].basis, "결정 기록: 웹"); assert.equal(got.items[1].basis, undefined);
});

// ── 서버 — /api/plan의 근거 ──
const D = require(path.join(BACK, "docs.js"));
const Sensitive = require(path.join(BACK, "sensitive.js"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-basis-"));
const DIR = path.join(TMP, "proj");
fs.mkdirSync(path.join(DIR, "docs/02-plan"), { recursive: true });
const KEY = "sk-ant-" + "Qw3e".repeat(10);   // secret-check: allow — 시험 안에서만
fs.writeFileSync(path.join(DIR, "docs/decisions.md"), `| 날짜 | 단계 | 할 일 | 정한 것 |\n|---|---|---|---|\n| 2026-10-28 | 2단계 | 무엇으로 | 웹으로 만든다 ${KEY} |\n`);
const R1 = { title: "t", at: "2026-10-29", items: Nav.criteriaFor(1, "Xpress").map((c, i) => ({ name: c.text, lines: [i === 0 ? "신청 화면 하나" : "x"], by: "me" })) };
fs.writeFileSync(path.join(DIR, D.stagePath(1)), D.files({ topic: "t", idea: "", results: { 1: R1 }, redact: (x) => x }).find((f) => f.path === D.stagePath(1)).text);
const TEXT = "동아리 신청 앱을 만들고 싶어요";
const ANSWER = { problem: "신청이 흩어져요", have: "없어요", missing: "신청 화면", items: [{ need: "회원이 신청하면, 앱으로 만든 화면이 받는다", check: "목록에 한 줄", basis: "2단계: 신청 화면 하나" }, { need: "관리자가 목록을 본다", check: "목록이 보인다", basis: "" }], prep: [], ask: [], say: "계획이에요" };
let Srv, srv, port;
before(async () => {
  fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
  Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
  for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
  const decisions = Sensitive.redact(fs.readFileSync(path.join(DIR, "docs/decisions.md"), "utf8"));
  const notes = Nav.criteriaFor(1, "Xpress").map((c, i) => `- 2단계 ${require(path.join(BACK, "quest.js")).shortOf(c.text)}: ${i === 0 ? "신청 화면 하나" : "x"}`);
  const basis = Sensitive.redact(["[가져온 것 — 지난 프로젝트에서 이번에 쓰기로 고른 것]", "- 화면 하나를 먼저 그린다", "[앞 단계에서 정한 것]", ...notes, "[결정 기록]", decisions].join("\n")).slice(0, Nav.PLAN_BASIS_MAX);
  REC.save(process.env.NAV_REPLAY, { [REC.keyOf(Nav.planPrompt({ text: TEXT, readme: "", files: ["docs"], basis }), Nav.PLAN_BASIS_SCHEMA)]: ANSWER });
  port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken();
});
after(() => { if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
async function call(method, p, body) {
  const t = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method, headers: { "Content-Type": "application/json", "X-Nav-Token": t }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}

test("C-51 서버 — /api/plan: 가져온 것 · 앞 단계에서 정한 것 · 결정 기록을 가린 뒤 근거로, 줄마다 근거(없으면 '새로 정함') · 앞의 결정과 다름(규칙)", async () => {
  assert.equal(Srv.useProject(DIR), true);
  assert.equal((await call("POST", "/api/plan", { text: TEXT, carry: ["x".repeat(161)] })).status, 400, "가져온 것의 모양");
  assert.equal((await call("POST", "/api/plan", { text: TEXT, carry: ["a", "b", "c", "d"] })).status, 400, "3개까지");
  const r = await call("POST", "/api/plan", { text: TEXT, carry: ["화면 하나를 먼저 그린다"] });
  assert.equal(r.status, 200, r.text);
  const [a, b] = r.json.plan.items;
  assert.equal(a.basis, "2단계: 신청 화면 하나"); assert.deepEqual(a.diff, { kind: "만들 곳", was: "웹", now: "앱" }, "결정 기록은 웹 — 이 줄은 앱");
  assert.equal(b.basis, "새로 정함"); assert.equal(b.diff, undefined);
});

test("C-51 화면 — 줄마다 근거 · 앞의 결정과 다름(이 줄대로 / 앞의 결정대로), 계획을 세울 때 이번 단계에 고른 가져온 것을 보낸다", () => {
  const app = fs.readFileSync(path.join(FRONT, "app.js"), "utf8");
  assert.match(app, /planBasisHTML\(x\)/); assert.match(app, /앞의 결정과 다름 — 결정 기록은/); assert.match(app, /"plan-follow": /);
  assert.match(app, /carry: carryTexts\(\)/);
});
