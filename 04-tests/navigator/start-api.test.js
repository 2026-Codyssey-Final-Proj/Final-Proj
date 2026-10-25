// claude-drafted: 2026-10-25 — C-36 처음 한 바퀴: POST /api/start — 받은 글 전체로 1단계 초안(제목 · 불편 · 달라지는 것 · 누가 · 크기). 코드보다 먼저 썼다(code.md 1번).
// 진짜 AI는 부르지 않는다 — 녹화 재생(NAV_REPLAY).
// 실행: node --test 04-tests/navigator/start-api.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const Nav = require(path.join(BACK, "navigator.js"));
const REC = require(path.join(BACK, "recording.js"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-startapi-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];

const TEXT = "동아리 행사 신청 앱을 만들고 싶어요. 지금은 종이로 받아서 누가 냈는지 헷갈려요. 운영진 셋이 목록을 봐요.";
const BAD = "모양이 틀린 답을 받는 글";
const DRAFT = { topic: "동아리 행사 신청 앱", pain: "행사 신청을 종이로 받아서 헷갈려요", change: "신청이 한곳에 모여요", who: "동아리 운영진 셋", size: "medium", sizeWhy: "흔한 기능 두 가지예요" };
REC.save(process.env.NAV_REPLAY, { [REC.keyOf(Nav.startPrompt(TEXT), Nav.START_SCHEMA)]: DRAFT, [REC.keyOf(Nav.startPrompt(BAD), Nav.START_SCHEMA)]: { ...DRAFT, size: "huge" } });

let srv, port;
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
function call(body, withTok = true) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const h = { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...(withTok ? { "X-Nav-Token": token() } : {}) };
    const req = http.request({ host: "127.0.0.1", port, path: "/api/start", method: "POST", headers: h, timeout: 5000 }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}

test("POST /api/start: 확인 값이 있어야 — 없으면 403(AI를 부르기 전)", async () => {
  assert.equal((await call({ text: TEXT }, false)).status, 403);
});

test("POST /api/start: 받은 글 전체로 1단계 초안 — { ok, start: { topic, pain, change, who, size, sizeWhy }, tokens }", async () => {
  const r = await call({ text: TEXT });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(Object.keys(r.json).sort(), ["ok", "start", "tokens"]);
  assert.deepEqual(r.json.start, DRAFT);
});

test("POST /api/start 거절: 빈 글 400 · 8,000자 넘으면 400(AI를 부르기 전) · 모양이 틀린 답은 502", async () => {
  for (const [body, re] of [[{ text: " " }, /비어/], [{}, /비어/], [{ text: "가".repeat(Nav.START_MAX + 1) }, /너무 김/]]) {
    const r = await call(body);
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 40)); assert.match(r.json.reason, re);
  }
  const bad = await call({ text: BAD });
  assert.equal(bad.status, 502); assert.match(bad.json.reason, /초안/);
});
