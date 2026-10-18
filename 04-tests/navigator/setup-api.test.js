// claude-drafted: 2026-10-19 — 처음 설정이 부르는 두 주소(API.md 3-10 · 3-11)와, 고친 뒤에도 옛 파일이 보이지 않게 하는 캐시 머리글.
// api-contract.test.js와 같은 방식: 진짜 AI는 부르지 않는다(재생 모드 + 가짜 키 + 닫힌 로컬 주소). claude 명령도 이 시험에서는 부르지 않아도 된다(답 모양만 본다).
// 실행: node --test 04-tests/navigator/setup-api.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-setup-api-"));
const FAKE_KEY = "sk-" + "Vb3n".repeat(6);
const URL_SECRET = "relay-" + "q8rt".repeat(3);
Object.assign(process.env, {
  NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"),
  ANTHROPIC_API_KEY: FAKE_KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:9/${URL_SECRET}`,
});
fs.writeFileSync(process.env.NAV_REPLAY, JSON.stringify({ items: {} }));

let Srv, srv, port;
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
function call(method, url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers, timeout: 15_000 }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, headers: res.headers, json, text }); });
    });
    req.on("error", reject); req.on("timeout", () => req.destroy(new Error(`${url} 응답 없음`)));
    req.end();
  });
}

test("GET /api/setup — 있다 · 없다와 claude 판, 서버 코드의 지문만. 키 · 중계 서버 주소의 값은 없다", async () => {
  const r = await call("GET", "/api/setup");
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.json).sort(), ["apiKey", "build", "claude", "ok", "provider", "relay", "replay"]);
  assert.equal(r.json.ok, true);
  assert.equal(r.json.provider, "api");
  assert.equal(r.json.apiKey, true);
  assert.equal(r.json.relay, true);
  assert.equal(r.json.replay, true);
  assert.deepEqual(Object.keys(r.json.claude).sort(), ["found", "signedIn", "version"]);
  assert.equal(typeof r.json.claude.found, "boolean");
  assert.match(r.json.build, /^[0-9a-f]{12}$/);
  assert.equal(r.json.build, Srv.build(), "앱(Electron)이 맞대어 볼 지문과 같다");
  assert.ok(!r.text.includes(FAKE_KEY) && !r.text.includes(URL_SECRET));
});

test("POST /api/setup/check — 확인 값이 없으면 403(본문 · AI 전에). 있으면 재생 중이라 부르지 않고 200", async () => {
  const no = await call("POST", "/api/setup/check");
  assert.equal(no.status, 403);
  assert.equal(no.json.ok, false);
  const ok = await call("POST", "/api/setup/check", { "X-Nav-Token": token() });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.json, { ok: true, provider: "api", replay: true, tokens: 0 });
  assert.equal((await call("GET", "/api/setup/check", { "X-Nav-Token": token() })).status, 404, "GET은 없는 주소");
  assert.equal((await call("POST", "/api/setup", { "X-Nav-Token": token() })).status, 404, "/api/setup은 GET만");
});

test("다른 웹페이지(Origin)에서는 둘 다 403", async () => {
  for (const [m, u] of [["GET", "/api/setup"], ["POST", "/api/setup/check"]]) {
    const r = await call(m, u, { Origin: "https://evil.example", "X-Nav-Token": token() });
    assert.equal(r.status, 403, `${m} ${u}`);
  }
});

test("화면 파일: html은 저장하지 않고(no-store), 스크립트 · 스타일은 늘 다시 묻는다(no-cache) — 고친 뒤 옛 파일이 보이지 않게", async () => {
  const html = await call("GET", "/");
  assert.equal(html.headers["cache-control"], "no-store");
  for (const u of ["/app.js", "/app.css", "/setup.js", "/setup.css"]) {
    const r = await call("GET", u);
    assert.equal(r.status, 200, u);
    assert.equal(r.headers["cache-control"], "no-cache", u);
  }
});
