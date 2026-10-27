// claude-drafted: 2026-10-27 — C-42 R-8: GET /api/files(API.md 3-25). 코드보다 먼저 썼다(code.md 1번).
// 연결한 폴더(앱이 useProject로 알려 준 것)의 파일 · 폴더 **이름만** — 경로를 받지 않고 · 주지 않고, 숨김 · 비밀값 · node_modules · 바로가기는 빼고, 깊이 3 · 200개까지. 읽기만.
// 실행: node --test 04-tests/navigator/files-api.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-files-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
fs.writeFileSync(process.env.NAV_REPLAY, "{}");
const Files = require(path.join(BACK, "files.js"));

// 시험용 폴더 — 보여야 하는 것과 빠져야 하는 것을 섞는다
const PROJ = path.join(TMP, "proj"), OUT = path.join(TMP, "outside");
function makeTree() {
  const w = (p, s = "") => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
  w(path.join(PROJ, "README.md"), "# a"); w(path.join(PROJ, "CLAUDE.md")); w(path.join(PROJ, "기획서.md"));
  w(path.join(PROJ, "docs/01-idea/idea.md")); w(path.join(PROJ, "docs/03-requirements/requirements.md")); w(path.join(PROJ, "docs/03-requirements/deep/too-deep.md"));
  w(path.join(PROJ, "src/app.js")); w(path.join(PROJ, "src/lib/util.js")); w(path.join(PROJ, "src/lib/inner/x.js"));
  w(path.join(PROJ, ".env"), "KEY=1"); w(path.join(PROJ, ".env.local"), "KEY=1"); w(path.join(PROJ, ".env.example"), "KEY="); w(path.join(PROJ, ".git/HEAD")); w(path.join(PROJ, ".claude/settings.json"));
  w(path.join(PROJ, "server.key")); w(path.join(PROJ, "cert.pem")); w(path.join(PROJ, "id_rsa")); w(path.join(PROJ, "credentials.json")); w(path.join(PROJ, "node_modules/x/index.js"));
  w(path.join(OUT, "secret.txt"), "밖");
  fs.symlinkSync(OUT, path.join(PROJ, "link-out"));
  fs.symlinkSync(path.join(PROJ, "README.md"), path.join(PROJ, "link-file.md"));
}
makeTree();

test("files.js listFiles — 이름만, 파일 먼저 · 이름순 · 깊이 우선, 숨김 · 비밀값 · node_modules · 바로가기는 빼고, 깊이 3까지", () => {
  const r = Files.listFiles(PROJ);
  const paths = r.files.map((f) => f.path);
  assert.deepEqual(paths, ["CLAUDE.md", "README.md", "기획서.md", "docs", "docs/01-idea", "docs/01-idea/idea.md", "docs/03-requirements", "docs/03-requirements/requirements.md", "docs/03-requirements/deep", "src", "src/app.js", "src/lib", "src/lib/util.js", "src/lib/inner"]);
  assert.ok(!paths.some((p) => /^\.|\.env|\.key$|\.pem$|id_rsa|credentials|node_modules|link-/.test(p)), "빠져야 할 것이 없다");
  assert.ok(!paths.includes("docs/03-requirements/deep/too-deep.md") && !paths.includes("src/lib/inner/x.js"), "깊이 4는 없다(폴더 자체는 깊이 3으로 보인다)");
  assert.equal(r.files.find((f) => f.path === "docs").dir, true); assert.equal(r.files.find((f) => f.path === "README.md").dir, false);
  assert.deepEqual(r.files.map((f) => f.depth).slice(0, 6), [1, 1, 1, 1, 2, 3]);
  assert.equal(r.cut, false); assert.equal(r.total, 14); assert.equal(r.unread, 0);
  assert.ok(!JSON.stringify(r).includes(TMP), "절대 경로는 어디에도 없다");
  assert.equal(Files.DEPTH, 3); assert.equal(Files.MAX, 200);
  assert.ok(Files.SECRET.test(".env.local") && !Files.SECRET.test(".env.example") && Files.SECRET.test("a.p12") && !Files.SECRET.test("keys.md"), "비밀값 모양은 check-secrets.sh와 같다");
});

test("files.js listFiles — 200개를 넘으면 자르고 cut, 없는 폴더는 빈 목록, 이름은 redact를 거친다", () => {
  const many = path.join(TMP, "many"); fs.mkdirSync(many);
  for (let i = 0; i < 230; i++) fs.writeFileSync(path.join(many, `f${String(i).padStart(3, "0")}.txt`), "");
  const r = Files.listFiles(many);
  assert.equal(r.files.length, 200); assert.equal(r.cut, true); assert.equal(r.total, 200);
  assert.deepEqual(Files.listFiles(path.join(TMP, "nope")), { files: [], total: 0, cut: false, unread: 1 }, "읽지 못한 폴더는 센다(빈 폴더와 구분)");
  const red = Files.listFiles(PROJ, { redact: (s) => s.replace(/README/, "***") });
  assert.ok(red.files.some((f) => f.name === "***.md" && f.path === "***.md"));
});

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
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
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

test("GET /api/files — 확인 값이 없으면 403, POST는 404, 폴더를 모르면 files: null · why 'folder'", async () => {
  assert.equal((await call("GET", "/api/files", { token: false })).status, 403);
  assert.equal((await call("GET", "/api/files", { headers: { Origin: "http://evil.example" } })).status, 403, "다른 출처는 확인 값이 맞아도 403(allowed)");
  assert.equal((await call("GET", "/api/files", { headers: { Host: "evil.example" } })).status, 403, "다른 Host도 403 — 다른 컴퓨터에서 오는 요청을 받지 않는다");
  assert.equal((await call("POST", "/api/files", { body: {} })).status, 404);
  const r = await call("GET", "/api/files");
  assert.equal(r.status, 200); assert.deepEqual(r.json, { ok: true, project: "", files: null, why: "folder" });
});

test("GET /api/files — 앱이 알려 준 폴더의 이름만(경로 없음), 물음표 뒤의 경로는 무시한다, 읽기만(파일이 바뀌지 않는다)", async () => {
  assert.equal(Srv.useProject(PROJ), true);
  const before = fs.readdirSync(PROJ).length;
  const r = await call("GET", `/api/files?dir=${encodeURIComponent(OUT)}&path=..`);
  assert.equal(r.status, 200); assert.equal(r.json.ok, true); assert.equal(r.json.project, "proj"); assert.equal(r.json.why, "");
  assert.deepEqual(r.json.files.slice(0, 4).map((f) => f.path), ["CLAUDE.md", "README.md", "기획서.md", "docs"]);
  assert.ok(!r.json.files.some((f) => f.path.includes("secret") || f.path.includes("link")), "밖의 폴더 · 바로가기는 없다");
  assert.ok(!r.text.includes(TMP), "절대 경로는 답에 없다");
  assert.equal(r.json.depth, 3); assert.equal(r.json.max, 200); assert.equal(r.json.cut, false); assert.equal(r.json.total, 14);
  assert.equal(fs.readdirSync(PROJ).length, before, "읽기만");
  Srv.dropProject(PROJ);
  assert.deepEqual((await call("GET", "/api/files")).json, { ok: true, project: "", files: null, why: "folder" });
});
