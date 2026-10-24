// claude-drafted: 2026-10-24 — 설정의 GitHub 칸(C-25): github.js와 GET /api/github · POST /api/github/create(API.md 3-19).
// Floe는 토큰을 받지 않고 git · gh에게 읽기만 묻는다. 폴더 경로 · 원격 주소 안의 토큰은 내지 않는다. 저장소 만들기는 일 넘기기(3-16)로 Claude Code에 맡긴다.
// 실행: node --test 04-tests/navigator/github-api.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawnSync } = require("node:child_process");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const GH = require(path.join(BACK, "github.js"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-github-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
fs.writeFileSync(process.env.NAV_REPLAY, "{}");
const HAS_GIT = spawnSync("git", ["--version"]).status === 0;

// ── github.js — 서버 없이 ──
test("원격 주소: github.com이면 주인 · 저장소 · 웹 주소, 토큰 칸은 버린다", () => {
  const tok = "ghp_" + "Z9y8".repeat(9);   // secret-check: allow — 시험 안에서만, 실행할 때 만든다
  for (const u of ["git@github.com:mina/club-app.git", "https://github.com/mina/club-app", `https://${tok}@github.com/mina/club-app.git`, `https://mina:${tok}@github.com/mina/club-app.git/`, "ssh://git@github.com/mina/club-app.git"]) {
    const r = GH.parseRemote(u);
    assert.deepEqual(r, { kind: "github", owner: "mina", repo: "club-app", web: "https://github.com/mina/club-app" }, u);
    assert.ok(!JSON.stringify(r).includes(tok), "토큰을 내지 않는다");
  }
});

test("원격 주소: GitHub가 아니거나 모양이 이상하면 other — 주소를 그대로 내지 않는다", () => {
  for (const u of ["https://gitlab.com/a/b.git", "/Users/me/backup.git", "git@github.com:a", "https://github.com/a/b c", "not a url"]) {
    assert.deepEqual(GH.parseRemote(u), { kind: "other", owner: "", repo: "", web: "" }, u);
  }
  assert.equal(GH.parseRemote(""), null);
});

// 가짜 git · gh — 명령마다 답을 정해 둔다
const fake = (table) => (cmd, args) => table[`${cmd} ${args.join(" ")}`] || { found: true, code: 1, out: "" };
const GH_OK = { "gh --version": { found: true, code: 0, out: "gh version 2.60.0" }, "gh auth status --hostname github.com": { found: true, code: 0, out: "" } };

test("상태: 폴더를 모르면 why 'folder' — gh 있음 · 로그인은 따로 보인다", () => {
  assert.deepEqual(GH.status("", "", fake(GH_OK)), { ok: true, project: "", gh: { found: true, signedIn: true }, git: false, remote: null, why: "folder" });
});

test("상태: gh가 없으면 found false · signedIn null, 로그인 안 했으면 signedIn false", () => {
  const none = (cmd) => (cmd === "gh" ? { found: false, code: -1, out: "" } : { found: true, code: 1, out: "" });
  assert.deepEqual(GH.status("/p", "p", none).gh, { found: false, signedIn: null });
  const out = fake({ "gh --version": GH_OK["gh --version"], "gh auth status --hostname github.com": { found: true, code: 1, out: "" } });
  assert.deepEqual(GH.status("/p", "p", out).gh, { found: true, signedIn: false });
});

test("상태: 저장소가 아니면 not-repo, 원격이 없으면 no-remote, 있으면 remote", () => {
  const inside = { "git rev-parse --is-inside-work-tree": { found: true, code: 0, out: "true" } };
  assert.equal(GH.status("/p", "p", fake(GH_OK)).why, "not-repo");
  assert.deepEqual(GH.status("/p", "p", fake({ ...GH_OK, ...inside })), { ok: true, project: "p", gh: { found: true, signedIn: true }, git: true, remote: null, why: "no-remote" });
  const r = GH.status("/p", "p", fake({ ...GH_OK, ...inside, "git remote get-url origin": { found: true, code: 0, out: "git@github.com:mina/club-app.git" } }));
  assert.equal(r.why, ""); assert.equal(r.remote.web, "https://github.com/mina/club-app");
  assert.equal(GH.status("/p", "p", (cmd) => (cmd === "git" ? { found: false, code: -1, out: "" } : GH_OK["gh --version"])).why, "no-git");
});

test("runner: 셸 없이 · 비밀번호를 묻지 않게 · 시간 제한, 명령이 없으면 found false", () => {
  let seen;
  const run = GH.runner((cmd, args, o) => { seen = o; return { status: 0, stdout: "true\nmore" }; });
  assert.deepEqual(run("git", ["x"], "/p"), { found: true, code: 0, out: "true" });
  assert.equal(seen.shell, false); assert.equal(seen.env.GIT_TERMINAL_PROMPT, "0"); assert.equal(seen.timeout, GH.TIMEOUT_MS); assert.equal(seen.cwd, "/p");
  const missing = GH.runner(() => ({ error: Object.assign(new Error("x"), { code: "ENOENT" }) }));
  assert.equal(missing("gh", []).found, false);
});

test("맡길 글: 기본 비공개, 이름은 안전한 글자만, 비밀값 파일 빼기 · 강제 푸시 금지를 적는다", () => {
  const t = GH.createRequest("동아리 앱 club; rm -rf /");
  assert.match(t, /비공개 저장소/);
  assert.match(t, /gh repo create club-rm-rf --private --source \. --remote origin --push/);
  assert.match(t, /\.env/); assert.match(t, /강제 푸시/); assert.match(t, /## 버전/);
  assert.match(t, /\.claude\/settings\.local\.json/, "이 컴퓨터의 설정(훅 경로)도 올리지 않는다(2026-10-24)");
  assert.match(GH.createRequest("x", "public"), /--public/);
  assert.match(GH.createRequest("x", "weird"), /--private/);
  assert.match(GH.createRequest(""), /my-floe-project/);
  assert.ok(t.length < 4000, "일 넘기기 글 상한(4,000자) 안");
});

// ── 서버 주소 ──
let port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const token = () => fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  const Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
function call(method, url, { body, token: withTok = true } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const h = { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), ...(withTok ? { "X-Nav-Token": token() } : {}) };
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: h }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}
const hook = (cwd, id) => call("POST", "/api/event", { body: { hook_event_name: "UserPromptSubmit", session_id: id, cwd, prompt: "안녕" } });

test("서버: 확인 값이 없으면 두 주소 모두 403", async () => {
  assert.equal((await call("GET", "/api/github", { token: false })).status, 403);
  assert.equal((await call("POST", "/api/github/create", { token: false, body: {} })).status, 403);
});

test("서버: 폴더를 모르면 why 'folder', 맡기기는 400", async () => {
  const r = await call("GET", "/api/github");
  assert.equal(r.status, 200); assert.equal(r.json.why, "folder"); assert.equal(r.json.remote, null);
  const c = await call("POST", "/api/github/create", { body: {} });
  assert.equal(c.status, 400); assert.match(c.json.reason, /폴더를 아직 몰라요/);
});

test("서버: 공개 범위가 이상하면 400", async () => {
  assert.equal((await call("POST", "/api/github/create", { body: { visibility: "everyone" } })).status, 400);
});

test("서버: 연결한 폴더의 원격을 이름만 보인다 — 경로 · 토큰은 내지 않고, 이미 이어졌으면 맡기기 409", { skip: !HAS_GIT && "git이 없는 컴퓨터" }, async () => {
  const dir = fs.mkdtempSync(path.join(TMP, "club-"));
  const plain = await (async () => { await hook(dir, "s-1"); return call("GET", "/api/github"); })();
  assert.equal(plain.json.why, "not-repo"); assert.equal(plain.json.project, path.basename(dir));
  spawnSync("git", ["init", "-q"], { cwd: dir });
  assert.equal((await call("GET", "/api/github")).json.why, "no-remote");
  const tok = "ghp_" + "Q1w2".repeat(9);   // secret-check: allow — 시험 안에서만
  spawnSync("git", ["remote", "add", "origin", `https://${tok}@github.com/mina/club-app.git`], { cwd: dir });
  const r = await call("GET", "/api/github");
  assert.equal(r.json.git, true); assert.equal(r.json.why, "");
  assert.deepEqual(r.json.remote, { kind: "github", owner: "mina", repo: "club-app", web: "https://github.com/mina/club-app" });
  assert.ok(!r.text.includes(tok), "토큰을 내지 않는다"); assert.ok(!r.text.includes(TMP), "폴더 경로를 내지 않는다");
  const c = await call("POST", "/api/github/create", { body: { visibility: "private" } });
  assert.equal(c.status, 409);
});
