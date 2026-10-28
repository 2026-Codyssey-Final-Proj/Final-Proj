// claude-drafted: 2026-10-29 — C-61 POST /api/chat(플로로와 자유 대화 → 칸으로 정리, API.md 3-31). 진짜 AI는 부르지 않는다 — 녹화 재생. 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/chat-api.test.js
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-chatapi-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];

const OBJS = [{ name: "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기" }, { name: "숫자로 적기" }];
const CELLS = [{ name: OBJS[0].name, line: "" }, { name: OBJS[1].name, line: "" }];
const TEXT = "회원이 신청 단추를 누르면 접수되게 하고 싶어요";
const HIST = [{ who: "me", text: "기능 정리가 막막해요" }, { who: "floro", text: "하나씩 같이 봐요" }];
const ANSWER = { reply: "칸 하나에 적을 수 있어요", fills: [{ i: 0, text: "회원이 신청 단추를 누르면, 앱은 접수한다" }, { i: 9, text: "밖" }] };
// 가림 시험 — 서버가 보낸 요청문이 가린 글의 녹화 키와 같아야 200. 녹화는 서버가 켜질 때 한 번 읽으니 처음부터 넣어 둔다
const Sens = require(path.join(BACK, "sensitive.js")), RAW = "연락은 min@example.com 아니면 010-1234-5678로요", RAW_H = "내 번호 010-9876-5432";
REC.save(process.env.NAV_REPLAY, {
  [REC.keyOf(Nav.chatPrompt(2, { text: Sens.redact(RAW), cells: CELLS, history: [{ who: "me", text: Sens.redact(RAW_H) }], idea: "" }), Nav.CHAT_SCHEMA)]: { reply: "연락처는 적지 않을게요", fills: [] },
  [REC.keyOf(Nav.chatPrompt(2, { text: TEXT, cells: CELLS, history: HIST, idea: "" }), Nav.CHAT_SCHEMA)]: ANSWER,
  [REC.keyOf(Nav.chatPrompt(2, { text: "그냥 궁금해서요 — EARS가 뭐예요?", cells: CELLS, history: [], idea: "" }), Nav.CHAT_SCHEMA)]: { reply: "기능을 한 문장 틀로 쓰는 방법이에요", fills: [] },
  [REC.keyOf(Nav.chatPrompt(2, { text: "모양이 틀린 답", cells: CELLS, history: [], idea: "" }), Nav.CHAT_SCHEMA)]: { reply: "", fills: [] },
});

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
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); });
function call(body, { token: withTok = true } = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: "127.0.0.1", port, path: "/api/chat", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...(withTok ? { "X-Nav-Token": token() } : {}) } }, (res) => {
      let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => { try { resolve({ status: res.statusCode, json: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, json: null, text: b }); } });
    });
    req.on("error", reject); req.end(data);
  });
}
const body = (over = {}) => ({ text: TEXT, stage: 2, tier: "Xpress", quest: { objs: OBJS, lines: [[], []] }, history: HIST, ...over });

test("POST /api/chat: 확인 값이 있어야 — 없으면 403(AI를 부르기 전)", async () => {
  assert.equal((await call(body(), { token: false })).status, 403);
});

test("POST /api/chat: 보낸 말 · 지금 칸 · 최근 말로 답 + fills — { ok, chat: { reply, fills }, tokens }. 칸 밖 번호는 버린다", async () => {
  const r = await call(body());
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.deepEqual(r.json.chat, { reply: "칸 하나에 적을 수 있어요", fills: [{ i: 0, text: "회원이 신청 단추를 누르면, 앱은 접수한다" }] });
  assert.equal(r.json.tokens, 0, "재생이라 토큰 0");
});

test("POST /api/chat: 그냥 묻는 말이면 fills가 비어 있다 — 칸에 적을 것이 없다(C-61: 보내기만으로는 정한 줄이 바뀌지 않는다)", async () => {
  const r = await call(body({ text: "그냥 궁금해서요 — EARS가 뭐예요?", history: [] }));
  assert.equal(r.status, 200); assert.deepEqual(r.json.chat.fills, []); assert.match(r.json.chat.reply, /한 문장 틀/);
});

test("POST /api/chat: 거절 — 빈 말 400 · 2,000자 넘김 400 · 단계 없음 400 · 칸 모양 400 · 최근 말 13줄 400 · 답 모양 틀림 502", async () => {
  assert.equal((await call(body({ text: " " }))).status, 400);
  assert.equal((await call(body({ text: "가".repeat(2001) }))).status, 400);
  assert.equal((await call(body({ stage: "2" }))).status, 400); assert.equal((await call(body({ stage: 99 }))).status, 400);
  assert.equal((await call(body({ quest: { objs: [] } }))).status, 400); assert.equal((await call(body({ quest: { objs: OBJS, lines: [["가".repeat(401)]] } }))).status, 400);
  assert.equal((await call(body({ history: Array.from({ length: 13 }, () => ({ who: "me", text: "x" })) }))).status, 400);
  assert.equal((await call(body({ history: [{ who: "bot", text: "x" }] }))).status, 400);
  const bad = await call(body({ text: "모양이 틀린 답", history: [] })); assert.equal(bad.status, 502);
});

test("POST /api/chat: 비밀값처럼 보이는 글(이메일 · 전화번호)은 가려서 보낸다 — 서버가 보낸 요청문이 가린 글의 녹화 키와 같다(원문 키에는 답이 없다)", async () => {
  assert.notEqual(Sens.redact(RAW), RAW, "가림 규칙이 이메일 · 전화번호를 가린다");
  const r = await call(body({ text: RAW, history: [{ who: "me", text: RAW_H }] }));
  assert.equal(r.status, 200, JSON.stringify(r.json)); assert.equal(r.json.chat.reply, "연락처는 적지 않을게요");
});
