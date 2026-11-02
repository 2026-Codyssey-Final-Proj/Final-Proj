// claude-drafted: 2026-10-29 — 작업실 개편 C-63 2차 백엔드 T22(시험 먼저, code.md 1번): 대화 저장 · 단계별 바뀐 파일(API.md 3-32 약속).
// 결정 모음 A-20(이 컴퓨터의 앱 저장 곳) · A-21(2차 백엔드는 이재엽 쪽 세션). 화면(T24 · T25 · T26 목록)은 두승현 쪽.
//   chatlog.js — 자리(NAV_CHAT_DIR · NAV_USAGE_FILE 옆 · 홈) · 파일 이름(경로 sha256 — 폴더 이름이 드러나지 않게) · 말 모양 · 가림 · 2,000개 덜기 · 바뀐 파일 new/edit
//   server.js — GET · POST /api/chatlog(확인 값, 폴더를 모르면 why folder, 쌓기 · 지우기, 60개 상한 없음, 작업 폴더에 쓰지 않음) · 훅 알림(PostToolUse)으로 그 폴더의 바뀐 파일
// 실행: node --test 04-tests/navigator/chat-store.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const CL = require(path.join(BACK, "chatlog.js"));
const Steps = require(path.join(BACK, "steps.js"));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-chatstore-"));
const CHATS = path.join(TMP, "app-data", "chats");
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CHAT_DIR: CHATS });
fs.writeFileSync(process.env.NAV_REPLAY, "{}");
for (const k of ["NAV_RECORD", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
const FAKE_KEY = "sk-" + "Hn4t".repeat(6);   // secret-check: allow — 시험 안에서만, 가려져야 한다

// ════════ chatlog.js ════════
test("자리 — NAV_CHAT_DIR, 없으면 NAV_USAGE_FILE 옆(시험이 홈에 쓰지 않게), 없으면 홈의 .navigator-chats", () => {
  assert.equal(CL.dirOf({ NAV_CHAT_DIR: "/a/chats", NAV_USAGE_FILE: "/b/u.json" }, "/home/x"), "/a/chats");
  assert.equal(CL.dirOf({ NAV_USAGE_FILE: "/b/usage.json" }, "/home/x"), "/b/usage-chats");
  assert.equal(CL.dirOf({}, "/home/x"), path.join("/home/x", ".navigator-chats"));
});

test("파일 이름 — 작업 폴더 실제 경로의 sha256 앞 16자. 폴더 이름이 드러나지 않고, 같은 폴더(바로가기 포함)는 같은 파일", () => {
  const proj = fs.mkdtempSync(path.join(TMP, "my-club-app-")), link = path.join(TMP, "club-link");
  fs.symlinkSync(proj, link, "junction");   // Windows는 권한 없이 심볼릭 링크를 못 만든다 — junction(flow-api.test.js와 같다)
  const f = CL.fileOf(CHATS, proj);
  assert.match(path.basename(f), /^[0-9a-f]{16}\.json$/); assert.ok(!f.includes("my-club-app"), "폴더 이름이 파일 이름에 없다");
  assert.equal(CL.fileOf(CHATS, link), f, "바로가기도 같은 파일");
  assert.notEqual(CL.fileOf(CHATS, TMP), f);
});

test("말 모양 — 말(me · floro · sys + text) · 구분선(mark + title) · 가져온 것(carry), stage 0 ~ 7. 틀리면 null, 맞으면 가린 것", () => {
  assert.ok(!CL.cleanTurn({ stage: 1, who: "me", text: `키 ${FAKE_KEY}` }).text.includes(FAKE_KEY), "검사하며 가린다");
  assert.deepEqual(CL.cleanTurn({ stage: 2, who: "me", text: " 신청부터 " }), { stage: 2, who: "me", text: "신청부터" });
  assert.deepEqual(CL.cleanTurn({ stage: 3, mark: true, title: "4단계 · 방법 고르기" }), { stage: 3, mark: true, title: "4단계 · 방법 고르기" });
  assert.deepEqual(CL.cleanTurn({ stage: 3, carry: "정한 칸: 신청 · 알림" }), { stage: 3, carry: "정한 칸: 신청 · 알림" });
  for (const bad of [null, {}, { stage: 8, who: "me", text: "a" }, { stage: "2", who: "me", text: "a" }, { stage: 2, who: "admin", text: "a" }, { stage: 2, who: "me", text: "" },
    { stage: 2, who: "me", text: "가".repeat(2001) }, { stage: 2, mark: true, title: "가".repeat(61) }, { stage: 2, mark: true }, { stage: 2, carry: 3 }, { stage: 2, who: "me", text: "a", at: 1 }])
    assert.equal(CL.cleanTurn(bad), null, JSON.stringify(bad));
});

test("쌓기 — at은 서버 시각, 2,000개를 넘으면 앞에서 덜고 덜어낸 수(dropped)를 센다. 화면에 줄 때(publicOf) 맨 앞 한 줄", () => {
  const add = (d, list, at) => CL.addTurns(d, list.map((t) => CL.cleanTurn(t)), { now: () => at });
  let d = add(CL.blank("club"), [{ stage: 1, who: "me", text: "처음" }], 7);
  assert.equal(d.turns[0].at, 7);
  d = add(d, Array.from({ length: 20 }, (_, i) => ({ stage: 1, who: "floro", text: `말 ${i}` })), 8);
  for (let k = 0; k < 100; k++) d = add(d, Array.from({ length: 20 }, (_, i) => ({ stage: 2, who: "me", text: `${k}-${i}` })), 9);
  assert.equal(d.turns.length, CL.TURNS_MAX); assert.equal(d.dropped, 21, "1 + 20 + 2,000 = 2,021 — 21개를 덜었다");
  assert.equal(d.turns.at(-1).text, "99-19", "새 말은 뒤에 남는다");
  const pub = CL.publicOf(d);
  assert.equal(pub.turns.length, CL.TURNS_MAX + 1); assert.deepEqual({ who: pub.turns[0].who, text: pub.turns[0].text }, { who: "sys", text: "앞 대화 21개를 덜어냈어요" });
  assert.ok(!("dropped" in pub), "덜어낸 수 칸은 화면에 주지 않는다");
});

test("바뀐 파일 — 이 기록에서 처음 보는 Write는 new, 아니면 edit. 2,000개까지", () => {
  let d = CL.blank("club");
  d = CL.addChange(d, { path: "src/app.js", tool: "Write" }, { now: () => 1 });
  d = CL.addChange(d, { path: "src/app.js", tool: "Edit" }, { now: () => 2 });
  d = CL.addChange(d, { path: "src/app.js", tool: "Write" }, { now: () => 3 });
  d = CL.addChange(d, { path: "README.md", tool: "MultiEdit" }, { now: () => 4 });
  assert.deepEqual(d.changes, [{ at: 1, path: "src/app.js", how: "new" }, { at: 2, path: "src/app.js", how: "edit" }, { at: 3, path: "src/app.js", how: "edit" }, { at: 4, path: "README.md", how: "edit" }]);
  for (let k = 0; k < CL.CHANGES_MAX + 5; k++) d = CL.addChange(d, { path: `f${k}.md`, tool: "Write" }, { now: () => 5 });
  assert.equal(d.changes.length, CL.CHANGES_MAX);
});

test("읽기 · 쓰기 — 없으면 빈 기록, 깨진 · 다른 판 파일은 .bak으로 남기고 빈 기록(덮어쓰지 않는다). 덜어낸 수도 저장된다. 폴더는 700 · 파일은 600", () => {
  const dir = path.join(TMP, "store-unit"), f = path.join(dir, "x.json");
  assert.deepEqual(CL.load(f, "club"), CL.blank("club"));
  CL.save(f, { ...CL.addTurns(CL.blank("club"), [CL.cleanTurn({ stage: 0, who: "me", text: "안녕" })], { now: () => 1 }), dropped: 5 });
  assert.equal(CL.load(f, "club").turns.length, 1); assert.equal(CL.load(f, "club").dropped, 5);
  if (process.platform !== "win32") { assert.equal(fs.statSync(dir).mode & 0o777, 0o700); assert.equal(fs.statSync(f).mode & 0o777, 0o600); }
  fs.writeFileSync(f, JSON.stringify({ v: 2, turns: [{ at: 1, stage: 0, who: "me", text: "새 판의 말" }], changes: [] }));
  assert.deepEqual(CL.load(f, "club"), CL.blank("club"));
  const bak = fs.readdirSync(dir).filter((x) => x.startsWith("x.json.bak-"));
  assert.equal(bak.length, 1, "다른 판은 .bak으로"); assert.match(fs.readFileSync(path.join(dir, bak[0]), "utf8"), /새 판의 말/, "내용을 잃지 않는다");
  fs.writeFileSync(f, "{ 깨진");
  assert.deepEqual(CL.load(f, "club"), CL.blank("club")); assert.equal(fs.readdirSync(dir).filter((x) => x.startsWith("x.json.bak-")).length, 2);
});

// claude-drafted: 2026-11-02 — F-119: 없는 것(ENOENT)이 아닌데 못 읽으면(Windows 백신 · 색인이 잠깐 잠금 · 권한) 빈 기록으로 보고 다음 저장이 대화를 덮어 지웠다
test("읽기 — 없는 게 아니라 못 읽으면 던진다(빈 기록으로 덮어쓰지 않게 · F-119)", () => {
  const f = path.join(TMP, "store-busy", "x.json");
  fs.mkdirSync(f, { recursive: true });   // 파일 자리에 폴더 — 읽기가 ENOENT 아닌 오류(EISDIR)
  assert.throws(() => CL.load(f, "club"));
  assert.ok(fs.statSync(f).isDirectory(), "그대로 둔다");
  // 깨진 · 다른 판 파일을 .bak으로 못 옮기면 빈 기록을 주지 않는다 — 주면 다음 저장이 그 파일(새 판의 대화)을 덮었다(새 맥락 리뷰 — 장부 carryRead와 같이)
  const g = path.join(TMP, "store-busy", "y.json");
  fs.writeFileSync(g, JSON.stringify({ v: 2, turns: [], changes: [] }));
  const rename = fs.renameSync;
  fs.renameSync = () => { throw Object.assign(new Error("잠김"), { code: "EBUSY" }); };
  try { assert.throws(() => CL.load(g, "club")); } finally { fs.renameSync = rename; }
  assert.match(fs.readFileSync(g, "utf8"), /"v":2/, "그대로 둔다");
});

// ════════ server.js ════════
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
function call(method, url, body, { withTok = true } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: { ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), ...(withTok ? { "X-Nav-Token": token() } : {}) } }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}

test("확인 값이 없으면 403 — 대화 글이 오간다", async () => {
  assert.equal((await call("GET", "/api/chatlog", undefined, { withTok: false })).status, 403);
  assert.equal((await call("POST", "/api/chatlog", { add: [] }, { withTok: false })).status, 403);
});

test("앱이 고른 작업 폴더가 없으면 GET은 빈 기록 · why folder, POST는 400 — 훅 알림으로 안 폴더로 대신하지 않는다(대화가 섞이지 않게)", async () => {
  await call("POST", "/api/event", { hook_event_name: "UserPromptSubmit", session_id: "s-x", cwd: fs.mkdtempSync(path.join(TMP, "hookonly-")), prompt: "안녕" });
  const g = await call("GET", "/api/chatlog");
  assert.equal(g.status, 200); assert.deepEqual(g.json, { ok: true, project: "", turns: [], changes: [], why: "folder" });
  const p = await call("POST", "/api/chatlog", { add: [{ stage: 0, who: "me", text: "안녕" }] });
  assert.equal(p.status, 400); assert.match(p.json.reason, /폴더/);
  assert.ok(!fs.existsSync(CHATS) || !fs.readdirSync(CHATS).length, "아무 파일도 만들지 않았다");
});

let PROJ;
test("쌓기 · 읽기 — 이 컴퓨터의 앱 저장 곳에 프로젝트마다 파일 하나, 작업 폴더에는 쓰지 않는다. 60개 상한이 없다, 가림", async () => {
  PROJ = fs.mkdtempSync(path.join(TMP, "proj-"));
  assert.equal(Srv.useProject(PROJ), true);
  assert.deepEqual((await call("GET", "/api/chatlog")).json, { ok: true, project: path.basename(PROJ), turns: [], changes: [], why: "" });
  const r = await call("POST", "/api/chatlog", { add: [{ stage: 0, mark: true, title: "1단계 · 무엇을 만들지 정하기" }, { stage: 0, who: "me", text: `행사 신청 앱 — 키 ${FAKE_KEY}` }] });
  assert.equal(r.status, 200, r.text); assert.deepEqual(r.json, { ok: true, n: 2 });
  for (let k = 0; k < 4; k++) assert.equal((await call("POST", "/api/chatlog", { add: Array.from({ length: 20 }, (_, i) => ({ stage: 1, who: i % 2 ? "floro" : "me", text: `${k}-${i}` })) })).json.n, 2 + (k + 1) * 20);
  const g = (await call("GET", "/api/chatlog")).json;
  assert.equal(g.turns.length, 82, "60개 상한이 없다"); assert.equal(g.turns[0].mark, true); assert.ok(Number.isFinite(g.turns[0].at));
  assert.ok(!JSON.stringify(g).includes(FAKE_KEY), "가린 뒤 저장");
  assert.ok(fs.existsSync(CL.fileOf(CHATS, PROJ)), "앱 저장 곳에"); assert.deepEqual(fs.readdirSync(PROJ), [], "작업 폴더에는 아무것도 쓰지 않는다");
});

test("POST 모양 — add는 1 ~ 20개 · 말 모양, 아니면 400 '대화 모양이 맞지 않음'. 하나라도 틀리면 아무것도 쌓지 않는다", async () => {
  const before = (await call("GET", "/api/chatlog")).json.turns.length;
  for (const body of [{}, { add: [] }, { add: Array.from({ length: 21 }, () => ({ stage: 0, who: "me", text: "a" })) }, { add: [{ stage: 0, who: "me", text: "a" }, { stage: 0, who: "x", text: "b" }] }, { add: "x" }]) {
    const r = await call("POST", "/api/chatlog", body);
    assert.equal(r.status, 400, JSON.stringify(body)); assert.match(r.json.reason, /대화 모양이 맞지 않음/);
  }
  assert.equal((await call("GET", "/api/chatlog")).json.turns.length, before);
});

test("훅 알림(PostToolUse)으로 그 폴더 안 파일이 바뀌면 changes에 — 훅이 보내는 모양 그대로(steps.js fromHook · fileOf), 작업 폴더 기준 경로, 처음 Write는 new · 그다음 edit. 세션 폴더 밖 · 다른 폴더 · 읽기는 넣지 않는다", async () => {
  fs.mkdirSync(path.join(PROJ, "src"));
  // hook.js와 같은 본문 — step(이름 · 첫 줄 · 줄 수)과 file(세션 폴더 안의 상대 경로, 밖이면 "")
  const hook = (cwd, tool_name, tool_input) => { const ev = { hook_event_name: "PostToolUse", session_id: "s-c", cwd, tool_name, tool_input };
    return call("POST", "/api/event", { hook_event_name: "PostToolUse", session_id: "s-c", cwd, tool: "claude", tool_name, step: Steps.fromHook(ev), file: Steps.fileOf(ev) }); };
  const src = path.join(PROJ, "src");
  assert.equal((await hook(src, "Write", { file_path: path.join(src, "app.js"), content: "a" })).status, 200);
  await hook(PROJ, "Edit", { file_path: path.join(PROJ, "src", "app.js"), old_string: "a", new_string: "b" });
  await hook(src, "Write", { file_path: path.join(PROJ, "README.md"), content: "x" });   // 세션 폴더(src) 밖 — 이름만 오던 때에는 src/README.md로 잘못 쌓였다
  await hook(PROJ, "Write", { file_path: path.join(os.homedir(), ".claude", "projects", "x", "memory", "MEMORY.md"), content: "m" });   // 자동 메모리 — 밖
  await hook(PROJ, "NotebookEdit", { notebook_path: path.join(PROJ, "analysis.ipynb"), new_source: "print(1)" });
  await hook(PROJ, "Read", { file_path: path.join(PROJ, "README.md") });
  await hook(fs.mkdtempSync(path.join(TMP, "other-")), "Write", { file_path: "x.js", content: "y" });
  await hook(PROJ, "Write", { file_path: "../outside.js", content: "z" });
  await hook("relative/dir", "Write", { file_path: "rel.js", content: "z" });   // 상대 경로 cwd는 버린다
  const c = (await call("GET", "/api/chatlog")).json.changes;
  assert.deepEqual(c.map((x) => [x.path, x.how]), [["src/app.js", "new"], ["src/app.js", "edit"], ["analysis.ipynb", "edit"]]);
  assert.ok(c.every((x) => Number.isFinite(x.at)));
});

test("약속한 최대(20개 × 2,000자)는 받는다 — 본문 한도에 걸리지 않게", async () => {
  const r = await call("POST", "/api/chatlog", { add: Array.from({ length: 20 }, () => ({ stage: 1, who: "me", text: "가".repeat(2000) })) });
  assert.equal(r.status, 200, r.text.slice(0, 200)); assert.equal(r.json.n, 102);
});

test("앱을 껐다 켜도 남는다 — 서버는 기억하지 않고 파일에서 읽는다. 못 지우면 500(지웠다고 하지 않는다), clear는 그 프로젝트 파일을 지운다", async () => {
  if (process.platform !== "win32") {
    fs.chmodSync(CHATS, 0o500);
    const bad = await call("POST", "/api/chatlog", { clear: true });
    fs.chmodSync(CHATS, 0o700);
    assert.equal(bad.status, 500, bad.text); assert.match(bad.json.reason, /지우지 못했어요/);
  }
  const f = CL.fileOf(CHATS, PROJ), saved = JSON.parse(fs.readFileSync(f, "utf8"));
  assert.equal(saved.v, 1); assert.equal(saved.turns.length, 102);
  const r = await call("POST", "/api/chatlog", { clear: true });
  assert.equal(r.status, 200); assert.deepEqual(r.json, { ok: true, n: 0 });
  assert.ok(!fs.existsSync(f)); assert.deepEqual((await call("GET", "/api/chatlog")).json.turns, []);
});
