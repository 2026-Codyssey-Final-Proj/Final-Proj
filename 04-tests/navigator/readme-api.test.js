// claude-drafted: 2026-10-23 — C-26 내 작업 책: GET /api/readme(API.md 3-18). 코드보다 먼저 썼다(code.md 1번).
// 연결한 폴더(훅 알림이 알려 준 세션의 cwd)의 README.md만 읽어 책으로 나눠 준다 — 화면이 보낸 경로는 받지 않고, 폴더 경로는 주지 않고, 비밀값은 가린다. 읽기만 한다.
// 실행: node --test 04-tests/navigator/readme-api.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-readme-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
fs.writeFileSync(process.env.NAV_REPLAY, "{}");

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
const hook = (cwd, id = "s-1") => call("POST", "/api/event", { body: { hook_event_name: "UserPromptSubmit", session_id: id, cwd, prompt: "안녕" } });

test("확인 값이 없으면 403 — 본문을 읽기 전에", async () => {
  const r = await call("GET", "/api/readme", { token: false });
  assert.equal(r.status, 403); assert.equal(r.json.ok, false);
});

test("연결한 폴더를 아직 모르면 book 없이 why 'folder' — 연습 예시 책으로 넘어가게", async () => {
  const r = await call("GET", "/api/readme");
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true, project: "", book: null, why: "folder" });
});

test("폴더는 알지만 README.md가 없으면 why 'none' · 이름만(경로는 주지 않는다)", async () => {
  const dir = fs.mkdtempSync(path.join(TMP, "no-readme-"));
  await hook(dir, "s-2");
  const r = await call("GET", "/api/readme");
  assert.deepEqual(r.json, { ok: true, project: path.basename(dir), book: null, why: "none" });
  assert.ok(!r.text.includes(TMP), "폴더 경로를 내지 않는다");
});

test("README.md가 있으면 책으로 나눠 준다 — 장 · 버전 줄, 비밀값은 가리고, 폴더 경로는 내지 않는다", async () => {
  const dir = fs.mkdtempSync(path.join(TMP, "club-"));
  const secret = "sk-ant-" + "A1b2".repeat(10);   // secret-check: allow — 시험 안에서만, 실행할 때 만든다
  const pem = ["-----BEGIN RSA PRIVATE KEY-----", "MIIEpAIBAAKCAQEAzz" + "Q".repeat(40), "-----END RSA PRIVATE KEY-----"].join("\n");   // secret-check: allow — 시험 안에서만
  fs.writeFileSync(path.join(dir, "README.md"), `# 동아리 앱\n한 줄\n\n## 버전\n- V.1 · 2026-10-24 · 문제 한 문장\n\n## 1단계 · 문제\n키: ${secret}\n${pem}\n`);
  await hook(dir, "s-3");
  const r = await call("GET", "/api/readme");
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.ok, true); assert.equal(r.json.project, path.basename(dir)); assert.equal(r.json.why, "");
  assert.equal(r.json.book.title, "동아리 앱");
  assert.deepEqual(r.json.book.versions, [{ v: "V.1", date: "2026-10-24", title: "문제 한 문장" }]);
  assert.deepEqual(r.json.book.chapters.map((c) => c.title), ["1단계 · 문제"]);
  assert.ok(!r.text.includes(secret), "비밀값은 가린다");
  assert.ok(!r.text.includes("MIIEpAIBAAKCAQEAzz"), "개인 키는 덩어리째 가린다");
  assert.ok(!r.text.includes(TMP), "폴더 경로를 내지 않는다");
});

test("README.md가 바로가기(심볼릭 링크)거나 너무 크면 — 링크는 따라가지 않고, 큰 글은 앞부분만 읽고 cut", async () => {
  const dir = fs.mkdtempSync(path.join(TMP, "link-"));
  const outside = path.join(TMP, "outside.md"); fs.writeFileSync(outside, "# 밖의 글\n## 장\n비밀\n");
  try { fs.symlinkSync(outside, path.join(dir, "README.md")); } catch { return; }   // 링크를 못 만드는 컴퓨터(Windows 권한)는 건너뛴다
  await hook(dir, "s-4");
  assert.deepEqual((await call("GET", "/api/readme")).json, { ok: true, project: path.basename(dir), book: null, why: "none" });
  const big = fs.mkdtempSync(path.join(TMP, "big-"));
  fs.writeFileSync(path.join(big, "README.md"), "# 큰 책\n## 장\n" + "가".repeat(400_000));
  await hook(big, "s-5");
  const r = await call("GET", "/api/readme");
  assert.equal(r.json.book.cut, true); assert.equal(r.json.book.chapters.length, 1);
});

test("POST는 받지 않는다 — 읽기만", async () => {
  const r = await call("POST", "/api/readme", { body: { path: "/etc" } });
  assert.equal(r.status, 404);
});
