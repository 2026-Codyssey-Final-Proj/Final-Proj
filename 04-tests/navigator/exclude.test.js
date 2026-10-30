// claude-drafted: 2026-10-30 — C-52 '빼 둘 곳'(지식 퀘스트 PRD 6절 C-52 · 9절 10번 "설정 창의 '빼 둘 곳'", 이재엽 버튼 2026-10-30 "10/31까지"). 코드보다 먼저 썼다(code.md 1번).
// 사람이 고른 폴더 · 파일은 Floe가 읽지 않는다 — 파일 칸 · 찾기 · 문서 지도 · README 책 · 계획 AI에 가는 파일 이름 · 단계 문서 · 결정 기록 모두. 서버가 지킨다(화면을 믿지 않는다).
// 실행: node --test 04-tests/navigator/exclude.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const FRONT = path.join(__dirname, "../../02-frontend/navigator");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-exclude-"));
fs.writeFileSync(path.join(TMP, "claude-stub.js"), `process.stdin.resume(); process.stdin.on("end", () => { process.stdout.write(JSON.stringify({ type: "result", result: "ok" })); process.exit(0); });`);
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: `${process.execPath} ${path.join(TMP, "claude-stub.js")}` });
fs.writeFileSync(process.env.NAV_REPLAY, "{}");
const E = require(path.join(BACK, "exclude.js"));
const Files = require(path.join(BACK, "files.js"));

// ── 줄 고르기(clean) ──
test("clean — 한 줄에 하나: 빈 줄 · # 줄은 넘기고, \\는 /로, 앞의 ./는 떼고, 같은 줄은 하나로", () => {
  const r = E.clean(["secrets/", "", "# 메모", "./notes.txt", "a\\b.md", "secrets/", "  *.env  "]);
  assert.deepEqual(r.list, ["secrets/", "notes.txt", "a/b.md", "*.env"]);
  assert.deepEqual(r.bad, []);
  assert.deepEqual(E.clean("x/\ny.md").list, ["x/", "y.md"], "글 하나(줄바꿈)도 받는다");
});

test("clean — 폴더 밖(..) · 절대 경로 · 드라이브 · 모르는 기호 · 별 넷 이상 · 긴 줄은 거절하고 까닭을 준다", () => {
  const r = E.clean(["../up", "a/../b", "/etc/passwd", "C:\\Windows", "a?.md", "[ab].md", "{a,b}", "!keep.md", "a*b*c*d*.md", "가".repeat(E.LINE_MAX + 1), "ok.md"]);
  assert.deepEqual(r.list, ["ok.md"]);
  assert.equal(r.bad.length, 10);
  assert.ok(r.bad.every((b) => typeof b.line === "string" && b.why), "줄마다 까닭");
});

test(`clean — ${E.MAX_LINES}줄까지, 넘치면 나머지는 bad`, () => {
  const r = E.clean(Array.from({ length: E.MAX_LINES + 5 }, (_, i) => `f${i}.md`));
  assert.equal(r.list.length, E.MAX_LINES); assert.equal(r.bad.length, 5);
});

// ── 맞춰 보기(matcher) ──
test("matcher — 끝이 /면 폴더(그 안 전부), / 없는 이름은 어느 깊이에서든, / 있는 줄은 맨 위부터, *는 한 칸 안에서만, 대소문자 무시", () => {
  const m = E.matcher(["secrets/", "*.env", "notes.txt", "docs/private/", "Draft*.MD"]);
  assert.ok(m("secrets", true) && m("secrets/a.txt") && m("x/secrets/b.md"), "폴더와 그 안");
  assert.ok(!m("secrets", false), "같은 이름의 파일은 폴더가 아니다");
  assert.ok(m("prod.env") && m("a/b/local.env") && !m("env.md"), "*.env는 이름 끝");
  assert.ok(m("a.env", true) && m("a.env/x.md"), "이름이 맞는 폴더는 그 안까지 — 자기 또는 위 폴더가 맞으면 뺀다");
  assert.ok(m("notes.txt") && m("d/notes.txt") && !m("notes.txt.bak"));
  assert.ok(m("docs/private/x.md") && m("docs/private", true) && !m("x/docs/private/y.md"), "/가 든 줄은 맨 위부터");
  assert.ok(m("draft-1.md") && m("sub/DRAFT2.md"), "대소문자 무시");
  assert.ok(!m("README.md") && !m("src/app.js"));
  assert.equal(E.matcher([])("anything"), false);
});

test("matcher — 별이 많은 긴 경로도 맞게 답한다(정규식을 쓰지 않고 직접 맞춤)", () => {
  const m = E.matcher(["*a*a*a"]);
  assert.equal(m(`${"a".repeat(150)}b/${"a".repeat(150)}b`), false);
  assert.equal(m(`x/${"b".repeat(100)}aaa`), true);
  assert.equal(E.wild, undefined, "속 함수는 내보내지 않는다");
});

test("한글 이름은 NFC로 맞춘다 — macOS가 주는 NFD 이름도 같은 이름(새 맥락 리뷰)", () => {
  const nfd = "회원명단.csv".normalize("NFD");
  assert.ok(E.matcher(["회원명단.csv"])(nfd), "적은 줄 NFC · 경로 NFD");
  assert.ok(E.matcher([nfd])("회원명단.csv"), "적은 줄 NFD · 경로 NFC");
  assert.deepEqual(E.clean([nfd]).list, ["회원명단.csv"], "다듬을 때 NFC로");
  assert.ok(E.matcher(["비밀/"])("비밀/a.md".normalize("NFD")));
});

test("** 는 받지 않는다(gitignore와 뜻이 달라 헷갈린다) — 줄마다 까닭", () => {
  const r = E.clean(["**/x.md", "a/**", "ok/"]);
  assert.deepEqual(r.list, ["ok/"]); assert.equal(r.bad.length, 2); assert.match(r.bad[0].why, /\*\*/);
});

test("빈 줄 · # 줄은 줄 수에 세지 않는다 — 서버가 받는 줄(빈 줄 포함)은 RAW_MAX까지", () => {
  const lines = [...Array.from({ length: 100 }, () => ""), "a.md", "# 메모"];
  assert.deepEqual(E.clean(lines).list, ["a.md"]);
  assert.ok(E.RAW_MAX >= 200);
});

test("revive — 저장 파일의 이상한 값은 버린다(폴더 열쇠 모양 · 목록 모양)", () => {
  assert.deepEqual(E.revive({ "0123456789abcdef": ["a/", "../x", 3], bad: ["y"], "fedcba9876543210": "z" }), { "0123456789abcdef": ["a/"] });
  assert.deepEqual(E.revive(null), {}); assert.deepEqual(E.revive([1]), {});
});

// ── 파일 목록(files.js) ──
const PROJ = path.join(TMP, "proj"), OTHER = path.join(TMP, "other");
const w = (p, s = "") => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
w(path.join(PROJ, "README.md"), "# 책\n\n## 하나\n비밀 계획\n"); w(path.join(PROJ, "notes.txt"), "빼 둘 메모 — 회원 명단 줄"); w(path.join(PROJ, "keep.md"), "회원 명단 줄 — 보여도 되는 것");
w(path.join(PROJ, "secrets/plan.md"), "회원 명단 줄"); w(path.join(PROJ, "docs/decisions.md"), "# 결정 기록\n"); w(path.join(PROJ, "docs/private/x.md"), "[a](../decisions.md)\n");
w(path.join(PROJ, "src/app.js")); w(path.join(PROJ, "prod.env"), "K=1");
w(path.join(OTHER, "notes.txt"), "다른 폴더");

test("listFiles — exclude가 맞는 것과 그 안은 목록에 없다(폴더 안으로 내려가지도 않는다)", () => {
  const all = Files.listFiles(PROJ).files.map((f) => f.path);
  assert.ok(all.includes("notes.txt") && all.includes("secrets/plan.md"));
  const seen = [];
  const r = Files.listFiles(PROJ, { exclude: (rel, dir) => { seen.push(rel); return E.matcher(["secrets/", "notes.txt", "*.env"])(rel, dir); } });
  const paths = r.files.map((f) => f.path);
  assert.ok(!paths.some((p) => /^secrets|notes\.txt|\.env$/.test(p)), paths.join(","));
  assert.ok(paths.includes("README.md") && paths.includes("keep.md") && paths.includes("docs/private/x.md"));
  assert.ok(!seen.includes("secrets/plan.md"), "뺀 폴더 안은 읽지 않는다");
});

// ── 서버 ──
let port, srv, Srv;
const EX_FILE = () => process.env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-exclude.json");
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const token = () => fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); });
function call(method, url, { body, token: withTok = true, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const h = { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), ...(withTok ? { "X-Nav-Token": token() } : {}), ...headers };
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: h }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}

test("GET · POST /api/exclude — 확인 값 없으면 403, 폴더를 모르면 why 'folder'(쓰지 않음)", async () => {
  assert.equal((await call("GET", "/api/exclude", { token: false })).status, 403);
  assert.equal((await call("POST", "/api/exclude", { token: false, body: { lines: [] } })).status, 403);
  assert.deepEqual((await call("GET", "/api/exclude")).json, { ok: true, project: "", key: "", list: [], max: E.MAX_LINES, why: "folder" });
  const r = await call("POST", "/api/exclude", { body: { lines: ["a/"] } });
  assert.equal(r.status, 400); assert.equal(r.json.why, "folder");
});

test("POST /api/exclude — 거절할 줄이 있으면 400 + 줄마다 까닭(저장 안 함), 모양이 틀리면 400, 맞으면 다듬은 목록을 저장", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  const bad = await call("POST", "/api/exclude", { body: { lines: ["../x", "notes.txt"] } });
  assert.equal(bad.status, 400); assert.equal(bad.json.why, "bad"); assert.equal(bad.json.bad[0].line, "../x");
  assert.deepEqual((await call("GET", "/api/exclude")).json.list, [], "거절하면 아무것도 저장하지 않는다");
  assert.equal((await call("POST", "/api/exclude", { body: { lines: "notes.txt" } })).status, 400, "lines는 배열");
  assert.equal((await call("POST", "/api/exclude", { body: { lines: Array.from({ length: E.MAX_LINES + 1 }, (_, i) => `f${i}`) } })).status, 400);
  const ok = await call("POST", "/api/exclude", { body: { lines: ["secrets/", "./notes.txt", "*.env", "README.md", "docs/decisions.md", "docs/private/"] } });
  assert.equal(ok.status, 200); assert.deepEqual(ok.json.list, ["secrets/", "notes.txt", "*.env", "README.md", "docs/decisions.md", "docs/private/"]);
  const g = await call("GET", "/api/exclude");
  assert.deepEqual({ ...g.json, key: "" }, { ok: true, project: "proj", key: "", list: ok.json.list, max: E.MAX_LINES, why: "" });
  assert.match(g.json.key, /^[0-9a-f]{16}$/, "어느 폴더의 목록인지 — 열쇠(경로 지문)");
  const f = EX_FILE();
  const saved = fs.readFileSync(f, "utf8");
  assert.ok(!saved.includes(TMP) && !saved.includes("proj"), "폴더 경로 · 이름은 저장하지 않는다(열쇠는 지문)");
  if (process.platform !== "win32") assert.equal(fs.statSync(f).mode & 0o777, 0o600);
});

test("빼 둔 것은 서버가 읽지 않는다 — 파일 칸 · 찾기 · README 책 · 문서 지도 · 계획 AI의 파일 이름 · 결정 기록", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  const files = (await call("GET", "/api/files")).json;
  const paths = files.files.map((x) => x.path);
  assert.ok(!paths.some((p) => /^secrets|notes\.txt|\.env$|^README\.md$|^docs\/decisions\.md$|^docs\/private/.test(p)), paths.join(","));
  assert.ok(paths.includes("keep.md")); assert.equal(files.excluded, 6, "빼 둔 줄 수를 알린다(화면이 '빼 둔 것 n줄'로)");
  const find = (await call("GET", `/api/find?q=${encodeURIComponent("회원 명단")}`)).json;
  assert.ok(!JSON.stringify(find).includes("빼 둘 메모") && !JSON.stringify(find).includes("secrets"), "찾기도 빼 둔 파일을 열지 않는다");
  const book = (await call("GET", "/api/readme")).json;
  assert.equal(book.book, null); assert.equal(book.why, "excluded");
  const map = (await call("GET", "/api/docmap")).json;
  assert.ok(!JSON.stringify(map).includes("private") && !JSON.stringify(map).includes("decisions.md"), "문서 지도에도 없다");
  assert.deepEqual(Srv.topFiles(PROJ).filter((n) => /notes|secrets|README|\.env/.test(n)), [], "계획 AI에 가는 맨 위 이름에도 없다");
  assert.equal(Srv.decisionsText(PROJ), "", "결정 기록(docs/decisions.md)을 빼 두면 가져갈 것 초안에 보내지 않는다");
});

test("열 때 · 저장할 때 한 번 더 본다 — 목록을 받은 뒤 빼 둔 곳이 바뀌어도(다른 창 · 손으로 고친 파일) 그 번호로 열지도 쓰지도 않는다", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  await call("POST", "/api/exclude", { body: { lines: [] } });
  const list = (await call("GET", "/api/files")).json.files;
  const i = list.findIndex((x) => x.path === "keep.md");
  const opened = await call("GET", `/api/file?i=${i}`);
  assert.equal(opened.status, 200);
  const key = (await call("GET", "/api/exclude")).json.key;
  fs.writeFileSync(EX_FILE(), JSON.stringify({ [key]: ["keep.md"] }));   // 저장 요청 없이 — 옛 목록(lastFiles)이 그대로 남은 채
  const r = await call("GET", `/api/file?i=${i}`);
  assert.equal(r.status, 400); assert.equal(r.json.why, "excluded");
  const w = await call("POST", "/api/file", { body: { i, path: "keep.md", text: "덮어쓰기", mtime: opened.json.mtime, ignoreBusy: true } });
  assert.equal(w.status, 400); assert.equal(w.json.why, "excluded");
  assert.match(fs.readFileSync(path.join(PROJ, "keep.md"), "utf8"), /보여도 되는 것/, "쓰지 않았다");
  await call("POST", "/api/exclude", { body: { lines: [] } });
  assert.deepEqual((await call("GET", "/api/exclude")).json.list, [], "비우면 지운다");
});

test("어느 폴더의 목록인지 — 보낸 열쇠가 지금 폴더와 다르면 409 moved(저장하지 않음)", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  const r = await call("POST", "/api/exclude", { body: { lines: ["a.md"], key: "0000000000000000" } });
  assert.equal(r.status, 409); assert.equal(r.json.why, "moved");
  assert.deepEqual((await call("GET", "/api/exclude")).json.list, []);
  const key = (await call("GET", "/api/exclude")).json.key;
  assert.equal((await call("POST", "/api/exclude", { body: { lines: ["a.md"], key } })).status, 200, "맞는 열쇠면 저장");
  await call("POST", "/api/exclude", { body: { lines: [], key } });
});

test("저장 파일이 깨졌으면 조용히 넘기지 않는다 — GET why 'broken' · 파일 목록에도 알림, 다시 저장하면 새로", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  fs.writeFileSync(EX_FILE(), "{ 깨진");
  const g = (await call("GET", "/api/exclude")).json;
  assert.equal(g.why, "broken"); assert.match(g.reason, /깨/);
  assert.equal((await call("GET", "/api/files")).json.excludeBroken, true);
  assert.equal((await call("POST", "/api/exclude", { body: { lines: ["notes.txt"] } })).status, 200);
  assert.equal((await call("GET", "/api/exclude")).json.why, "");
  await call("POST", "/api/exclude", { body: { lines: [] } });
});

test("틀로 맡기기(path로 docs/ 문서를 고를 때)도 빼 둔 곳이면 맡기지 않는다", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  await call("POST", "/api/exclude", { body: { lines: ["docs/private/"] } });
  const r = await call("POST", "/api/preset", { body: { preset: "fill", path: "docs/private/x.md" } });
  assert.equal(r.status, 400); assert.equal(r.json.why, "excluded");
  await call("POST", "/api/exclude", { body: { lines: [] } });
});

test("훅 알림으로 바뀐 파일 — 빼 둔 곳이면 대화 목록(changes)에 쌓지 않고 AI 진행에는 이름을 감춘다", async () => {
  const Steps = require(path.join(BACK, "steps.js"));
  assert.equal(Srv.useProject(PROJ), true);
  await call("POST", "/api/exclude", { body: { lines: ["secrets/"] } });
  const hook = (tool_name, tool_input) => { const ev = { hook_event_name: "PostToolUse", session_id: "s-ex", cwd: PROJ, tool_name, tool_input };
    return call("POST", "/api/event", { body: { hook_event_name: "PostToolUse", session_id: "s-ex", cwd: PROJ, tool: "claude", tool_name, step: Steps.fromHook(ev), file: Steps.fileOf(ev) } }); };
  const h1 = await hook("Write", { file_path: path.join(PROJ, "secrets/token-note.md"), content: "a" }); assert.equal(h1.status, 200, h1.text);
  await hook("Write", { file_path: path.join(PROJ, "keep2.md"), content: "b" });
  const changes = (await call("GET", "/api/chatlog")).json.changes.map((c) => c.path);
  assert.ok(changes.includes("keep2.md") && !changes.some((p) => p.includes("token-note")), changes.join(","));
  const steps = JSON.stringify((await call("GET", "/api/steps")).json);
  assert.ok(!steps.includes("token-note"), "AI 진행에도 이름이 없다"); assert.match(steps, /빼 둔 곳/);
  await call("POST", "/api/exclude", { body: { lines: [] } });
});

test("문서 올리기 — 빼 둔 단계 문서 · 결정 기록은 읽지도 쓰지도 맡기지도 않는다(브라우저 기록이 없어도 사람이 고친 문서를 덮지 않는다)", async () => {
  const Nav = require(path.join(BACK, "navigator.js"));
  const SHIP = path.join(TMP, "ship"); fs.mkdirSync(path.join(SHIP, ".git"), { recursive: true });
  w(path.join(SHIP, "docs/01-idea/idea.md"), "# 사람이 고친 1단계\n손으로 쓴 글\n"); w(path.join(SHIP, "docs/decisions.md"), "# 내 결정 기록\n손으로\n");
  assert.equal(Srv.useProject(SHIP), true);
  assert.equal((await call("POST", "/api/exclude", { body: { lines: ["docs/01-idea/", "docs/decisions.md"] } })).status, 200);
  const R0 = { chap: 0, title: "앱", items: Nav.STAGES[0].criteria.map((c) => ({ name: c.text, lines: [`${c.text} 줄`] })) };
  const R1 = { chap: 1, title: "앱", items: Nav.criteriaFor(1, "Xpress").map((c) => ({ name: c.text, lines: [`${c.text} 줄`] })) };
  const r = await call("POST", "/api/docs", { body: { topic: "앱", results: { 0: R0, 1: R1 } } });   // 지문 없이 — 브라우저 기록을 지운 뒤
  assert.equal(r.status, 200, r.text);
  assert.ok(!r.json.files.some((p) => p.startsWith("docs/01-idea/") || p === "docs/decisions.md"), r.json.files.join(","));
  assert.deepEqual(r.json.excluded.sort(), ["docs/01-idea/idea.md", "docs/decisions.md"].sort());
  assert.equal(fs.readFileSync(path.join(SHIP, "docs/01-idea/idea.md"), "utf8"), "# 사람이 고친 1단계\n손으로 쓴 글\n");
  assert.equal(fs.readFileSync(path.join(SHIP, "docs/decisions.md"), "utf8"), "# 내 결정 기록\n손으로\n");
  for (let k = 0; k < 50; k++) { const tk = (await call("GET", "/api/task")).json.task; if (!tk || tk.state !== "running") break; await new Promise((res) => setTimeout(res, 100)); }
  Srv.dropProject(SHIP);
});

test("빼기를 거치지 않는 폴더 읽기가 새로 생기지 않게 — server.js의 listFiles · docTargets 부르는 곳마다 빼기를 거친다", () => {
  const lines = fs.readFileSync(path.join(BACK, "server.js"), "utf8").split("\n");
  lines.forEach((l, k) => {
    if (/Files\.listFiles\(/.test(l)) assert.match(l, /exclude:/, `server.js ${k + 1}줄 — listFiles에 exclude가 없다`);
    if (/docTargets\(/.test(l) && !/function docTargets/.test(l)) assert.ok(lines.slice(Math.max(0, k - 6), k + 1).some((x) => /excludeOf\(|\bex\(/.test(x)), `server.js ${k + 1}줄 — docTargets 앞에 빼기 확인이 없다`);
  });
});

test("폴더마다 따로 — 다른 폴더에는 이 목록이 걸리지 않는다", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  await call("POST", "/api/exclude", { body: { lines: ["notes.txt"] } });
  assert.equal(Srv.useProject(OTHER), true);
  assert.deepEqual((await call("GET", "/api/exclude")).json.list, []);
  assert.ok((await call("GET", "/api/files")).json.files.some((x) => x.path === "notes.txt"));
  assert.equal(Srv.useProject(PROJ), true);
  assert.deepEqual((await call("GET", "/api/exclude")).json.list, ["notes.txt"]);
  Srv.dropProject(PROJ); Srv.dropProject(OTHER);
});

// ── 화면에 이어짐(글자 모양) ──
test("화면 — 설정 '기록' 탭에 '빼 둘 곳' 묶음, 저장 누르기 · 글 칸 입력, 서버 주소 목록 · API 문서", () => {
  const frag = fs.readFileSync(path.join(FRONT, "app/59-exclude.js"), "utf8");
  assert.match(frag, /SET_PART\.keep = /);
  assert.match(frag, /Object\.assign\(ACT, \{[\s\S]*"ex-save"/);
  assert.match(frag, /\/api\/exclude/);
  assert.match(fs.readFileSync(path.join(FRONT, "app/92-basecard.js"), "utf8"), /a === "ex-text"/);
  const server = fs.readFileSync(path.join(BACK, "server.js"), "utf8");
  assert.match(server, /TOKEN_ROUTES\.push\([^)]*"\/api\/exclude"/); assert.match(server, /POST_ROUTES\.push\([^)]*"\/api\/exclude"/);
  assert.match(fs.readFileSync(path.join(BACK, "API.md"), "utf8"), /\/api\/exclude/);
});
