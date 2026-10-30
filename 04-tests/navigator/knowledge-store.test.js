// claude-drafted: 2026-10-30 — 지식 창고(세컨드 브레인) 연결(작업 보드 '지식 창고 연결' · 이재엽 "보드에서 없음 부분 전부 제작"). 요구: 책을 지식 창고와 얇은 경계로 잇는다.
// 얇은 경계 = 파일 모양만 — 채택한 '가져갈 것'(C-48)을 세컨드 브레인의 지식 문서 모양(05-projects/second-brain/implementations/skeleton/knowledge.py save_knowledge)
//   그대로 그 데이터 폴더의 vault/지식/작업/<이름>.md에 쓴다. 두 프로젝트는 서로의 코드를 부르지 않는다. 데이터 폴더는 SECOND_BRAIN_DATA(ADR-0010)일 때만.
// 규칙 03-backend/navigator/sbknow.js, 서버 GET · POST /api/knowledge-store, 화면 app/45-knowledge.js(가져갈 것 카드). 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/knowledge-store.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawnSync } = require("node:child_process");
const BACK = path.join(__dirname, "../../03-backend/navigator");
const SB = require(path.join(BACK, "sbknow.js"));

const ITEM = { id: "cabc1", text: "기능은 숫자로 끝 조건을 먼저 적는다", why: "빠르게라고만 적어 3단계에서 다시 정했다", stage: 2, review: "2027-01-10", from: [1, 2], project: "club-app", state: "adopted" };

test("채택한 가져갈 것 → 지식 문서 — 목적 '작업', 관찰 = 왜, 해석 = 언제 · 근거, 행동 = 다음엔 이렇게, 인용 0. 채택이 아니거나 비면 null", () => {
  const k = SB.toKnowledge(ITEM, { today: "2026-10-30" });
  assert.equal(k.purpose, "작업"); assert.equal(k.name, "기능은 숫자로 끝 조건을 먼저 적는다");
  assert.equal(k.text, "# 기능은 숫자로 끝 조건을 먼저 적는다\n- 목적: 작업\n- 출처: Floe 가져갈 것 · club-app\n- 만든 날: 2026-10-30\n- 인용: 0 (마지막 -)\n\n"
    + "## 관찰\n빠르게라고만 적어 3단계에서 다시 정했다\n\n## 해석\n3단계에서 다시 쓸 배움 — 근거 2단계 · 3단계, 다시 볼 날 2027-01-10\n\n## 행동\n기능은 숫자로 끝 조건을 먼저 적는다\n");
  assert.equal(SB.toKnowledge({ ...ITEM, state: "held" }, { today: "2026-10-30" }), null);
  assert.equal(SB.toKnowledge({ ...ITEM, text: " " }, { today: "2026-10-30" }), null);
  assert.match(SB.toKnowledge({ ...ITEM, why: "" }, { today: "2026-10-30" }).text, /## 관찰\n미정\n/, "빈 칸은 '미정'(세 칸이 다 찬 것만 지식으로 센다 — Q4)");
});

test("이름은 저장소 밖 경로 · 숨김 파일이 되지 못한다 — 슬래시 · 앞의 점 · 80자 넘음 · 못 찍는 글자", () => {
  const n = (text) => SB.toKnowledge({ ...ITEM, text }, { today: "2026-10-30" }).name;
  assert.equal(n("../../etc/passwd"), "etc passwd");
  assert.equal(n("a\\b"), "a b");
  assert.ok(!n(".숨김").startsWith("."));
  assert.ok(n("가".repeat(200)).length <= 80);
  assert.equal(n("줄\n바꿈\t탭"), "줄 바꿈 탭");
  assert.equal(n("a:b?c*d\"e<f>g|h"), "a b c d e f g h", "Windows가 받지 않는 글자");
  assert.equal(n("폭\u200b없는\u0085글자"), "폭 없는 글자", "못 찍는 글자(isprintable)");
  const emo = n("가".repeat(79) + "😀끝"); assert.equal(Array.from(emo).length, 80); assert.ok(emo.endsWith("😀"), "글자 단위로 자른다(반쪽 없음)");
});

test("세컨드 브레인의 파이썬(knowledge.py)이 그대로 읽는다 — 찾기 · 세 칸 · 인용 세기(python3이 없으면 건너뜀)", (t) => {
  const py = spawnSync("python3", ["--version"]); if (py.status !== 0) return t.skip("python3 없음");
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), "floe-sb-vault-")), k = SB.toKnowledge(ITEM, { today: "2026-10-30" });
  try {
    const f = path.join(vault, "지식", k.purpose, `${k.name}.md`); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, k.text);
    const code = "import sys,datetime;sys.path.insert(0,sys.argv[1]);import knowledge as K;h=K.find_knowledge(sys.argv[2],'끝 조건');t=open(h[0].path,encoding='utf-8').read();"
      + "print(len(h),h[0].purpose,h[0].cites,all(K._column(t,c) for c in K.COLUMNS),K.cite(h[0].path,'2026-10-31'))";
    const r = spawnSync("python3", ["-I", "-c", code, path.join(__dirname, "../../05-projects/second-brain/implementations/skeleton"), vault], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout.trim(), "1 작업 0 True 1");
  } finally { fs.rmSync(vault, { recursive: true, force: true }); }
});

// ── 서버 ──
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-sb-srv-"));
let Srv, srv, port;
before(async () => {
  fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
  Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
  for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL", "SECOND_BRAIN_DATA"]) delete process.env[k];
  port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken();
});
after(() => { if (srv) srv.close(); delete process.env.SECOND_BRAIN_DATA; fs.rmSync(TMP, { recursive: true, force: true }); });
async function call(method, p, body, tok = true) {
  const t = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method, headers: { "Content-Type": "application/json", ...(tok ? { "X-Nav-Token": t } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}

test("서버 — 데이터 폴더(SECOND_BRAIN_DATA)가 없으면 ready: false · 쓰지 않는다, 있으면 채택한 것만 vault/지식/작업/에 한 번(같은 이름은 409), 확인 값이 있어야", async () => {
  const proj = path.join(TMP, "proj"); fs.mkdirSync(proj); assert.equal(Srv.useProject(proj), true);
  const a = await call("POST", "/api/carry", { action: "adopt", item: { text: ITEM.text, why: ITEM.why, stage: 2, review: "2027-01-10", from: [1, 2] } });
  assert.equal(a.status, 200, a.text); const id = a.json.id;
  const h = await call("POST", "/api/carry", { action: "hold", item: { text: "보류한 것", why: "", stage: 1, from: [] } });
  assert.equal((await call("GET", "/api/knowledge-store", null, false)).status, 403);
  assert.deepEqual((await call("GET", "/api/knowledge-store")).json, { ok: true, ready: false });
  assert.equal((await call("POST", "/api/knowledge-store", { id })).status, 409, "폴더를 모르면 쓰지 않는다");
  process.env.SECOND_BRAIN_DATA = path.join(__dirname, "../..");
  assert.deepEqual((await call("GET", "/api/knowledge-store")).json, { ok: true, ready: false }, "이 레포 안이면 쓰지 않는다(개인 데이터는 레포에 두지 않는다)");
  const data = path.join(TMP, "sb-data"); fs.mkdirSync(data); process.env.SECOND_BRAIN_DATA = data;
  assert.deepEqual((await call("GET", "/api/knowledge-store")).json, { ok: true, ready: true });
  assert.equal((await call("POST", "/api/knowledge-store", { id: "c없음" })).status, 400);
  assert.equal((await call("POST", "/api/knowledge-store", { id: "czzzz" })).status, 404);
  assert.equal((await call("POST", "/api/knowledge-store", { id: h.json.id })).status, 404, "채택한 것만");
  const w = await call("POST", "/api/knowledge-store", { id });
  assert.equal(w.status, 200, w.text); assert.equal(w.json.name, ITEM.text);
  const f = path.join(data, "vault", "지식", "작업", `${ITEM.text}.md`);
  assert.match(fs.readFileSync(f, "utf8"), /^# 기능은 숫자로 끝 조건을 먼저 적는다\n- 목적: 작업\n- 출처: Floe 가져갈 것 · /);
  assert.ok(!JSON.stringify(w.json).includes(data), "폴더 경로는 화면에 주지 않는다");
  assert.equal((await call("POST", "/api/knowledge-store", { id })).status, 409, "같은 지식이 이미 있으면 덮지 않는다");
  if (process.platform !== "win32") {   // '지식' 폴더가 바로가기(심볼릭 링크)로 바깥을 가리키면 쓰지 않는다
    const data2 = path.join(TMP, "sb-data2"), out = path.join(TMP, "outside"); fs.mkdirSync(path.join(data2, "vault"), { recursive: true }); fs.mkdirSync(out);
    fs.symlinkSync(out, path.join(data2, "vault", "지식")); process.env.SECOND_BRAIN_DATA = data2;
    const a2 = await call("POST", "/api/carry", { action: "adopt", item: { text: "다른 배움", why: "x", stage: 1, from: [0, 1] } });
    const l = await call("POST", "/api/knowledge-store", { id: a2.json.id });
    assert.equal(l.status, 409, l.text); assert.equal(l.json.why, "link"); assert.deepEqual(fs.readdirSync(out), [], "바깥에 쓰지 않았다");
  }
});

test("화면 — 채택한 가져갈 것에 '지식 창고로' 단추(서버가 ready일 때만), 채택하면 장부 번호를 기억한다", () => {
  const k = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app/45-knowledge.js"), "utf8");
  assert.match(k, /if \(r\.id\) d\.id = r\.id;/);
  assert.match(k, /d\.state === "adopted" && st\.sbReady/);
  assert.match(k, /"carry-sb": async \(i\) => \{/);
  assert.match(k, /fetch\("\/api\/knowledge-store"/);
});
