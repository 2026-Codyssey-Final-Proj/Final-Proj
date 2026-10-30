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

test("matcher — 별이 많은 긴 경로도 빨리 끝난다(되돌아가기 폭주 없음)", () => {
  const m = E.matcher(["*a*a*a"]); const t = Date.now();
  for (let i = 0; i < 200; i++) m(`${"a".repeat(150)}b/${"a".repeat(150)}b`);
  assert.ok(Date.now() - t < 1000);
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
  assert.deepEqual((await call("GET", "/api/exclude")).json, { ok: true, project: "", list: [], why: "folder" });
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
  assert.deepEqual(g.json, { ok: true, project: "proj", list: ok.json.list, why: "" });
  const f = process.env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-exclude.json");
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

test("빼 둔 뒤에는 옛 목록 번호로도 못 연다 — 저장하면 목록을 다시 받아야 하고, 열 때도 한 번 더 본다", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  await call("POST", "/api/exclude", { body: { lines: [] } });
  const list = (await call("GET", "/api/files")).json.files;
  const i = list.findIndex((x) => x.path === "keep.md");
  assert.equal((await call("GET", `/api/file?i=${i}`)).status, 200);
  await call("POST", "/api/exclude", { body: { lines: ["keep.md"] } });
  const r = await call("GET", `/api/file?i=${i}`);
  assert.equal(r.status, 400); assert.equal(r.json.why, "folder", "저장하면 옛 목록은 버린다");
  assert.deepEqual((await call("GET", "/api/exclude")).json.list, ["keep.md"]);
  await call("POST", "/api/exclude", { body: { lines: [] } });
  assert.deepEqual((await call("GET", "/api/exclude")).json.list, [], "비우면 지운다");
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
