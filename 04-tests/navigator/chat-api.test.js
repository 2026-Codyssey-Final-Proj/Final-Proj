// claude-drafted: 2026-10-29 — 작업실 개편 C-61 2차 백엔드 T16(시험 먼저, code.md 1번): POST /api/chat — 플로로와 자유 대화(API.md 3-31 약속).
// 결정 모음 A-21(2차 백엔드는 이재엽 쪽 세션). 진짜 AI는 부르지 않는다 — 녹화 재생(NAV_REPLAY)으로 같은 요청문이면 정해 둔 답.
//   확인 값 · 본문 모양(단계 · 등급 · 대화 · 적은 줄 · 지난 단계) · 비밀값 가림(가린 요청문이어야 녹화가 맞는다) · 칸 다듬기(칸 밖 · 이미 적은 칸 · 두 번 · 빈 글은 버린다, 0부터)
//   · 칸에 적지 않는다(서버는 제안만) · /api/stagedraft의 talk 칸 · 누가 정했나 '대화'(chat)
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
const Q = require(path.join(BACK, "quest.js"));
const Sensitive = require(path.join(BACK, "sensitive.js"));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-chat-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
for (const k of ["NAV_RECORD", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL", "NAV_PROVIDER"]) delete process.env[k];

const IDEA = "동아리 행사 신청을 종이로 받아 헷갈려요";
const TALK = [{ who: "floro", text: "어떤 기능부터 생각하고 있어요?" }, { who: "me", text: "회원이 신청 단추를 누르면 신청이 되고, 마감 하루 전에 알림이 가면 좋겠어요" }];
const FAKE_KEY = "sk-" + "Qw7e".repeat(6);   // secret-check: allow — 시험 안에서만, 가려져야 한다
const SECRET_TALK = [{ who: "me", text: `키는 ${FAKE_KEY} 이거예요. 신청 기능부터 정리해 줘요` }];
const N2 = Nav.criteriaFor(2, "Xpress").length;
const LINES = Array.from({ length: N2 }, (_, i) => (i === 1 ? ["알림은 마감 하루 전 저녁 6시"] : []));
const ANSWER = { reply: "좋아요! 신청과 알림, 두 가지를 말해 줬어요.", slots: [
  { i: 1, text: "회원이 신청 단추를 누르면, 앱은 신청을 받는다 / 마감 하루 전이 되면, 앱은 신청한 회원에게 알림을 보낸다" },
  { i: 2, text: "이미 적은 칸이라 버려진다" }, { i: 1, text: "같은 칸 두 번 — 버려진다" }, { i: 99, text: "칸 밖 — 버려진다" }, { i: 3, text: "   " }, { i: 0, text: "칸 번호 0도 칸 밖(1부터)" }] };
const redactTalk = (t) => t.map((m) => ({ ...m, text: Sensitive.redact(m.text) }));
const BLANK = Array.from({ length: N2 }, () => []);
REC.save(process.env.NAV_REPLAY, {   // 녹화는 서버를 켤 때 한 번 읽는다 — 시험에 쓰는 것은 모두 여기에
  [REC.keyOf(Nav.chatPrompt(2, "Xpress", { idea: IDEA, talk: TALK, lines: BLANK }), Nav.CHAT_SCHEMA)]: ANSWER,
  [REC.keyOf(Nav.chatPrompt(2, "Xpress", { idea: IDEA, talk: TALK, lines: LINES }), Nav.CHAT_SCHEMA)]: ANSWER,
  [REC.keyOf(Nav.chatPrompt(2, "Xpress", { idea: "", talk: redactTalk(SECRET_TALK), lines: [] }), Nav.CHAT_SCHEMA)]: { reply: "신청부터 정리해요.", slots: [] },
  [REC.keyOf(Nav.chatPrompt(0, "Full", { talk: [{ who: "me", text: "빈 답" }] }), Nav.CHAT_SCHEMA)]: { reply: "  ", slots: [] },
  [REC.keyOf(Nav.stageDraftPrompt(1, "Xpress", { idea: IDEA, prev: [{ stage: 0, items: [{ name: "불편", lines: ["종이 신청이 헷갈림"] }] }], talk: TALK }), Nav.STAGE_DRAFT_SCHEMA)]:
    { items: Nav.criteriaFor(1, "Xpress").map((c) => ({ text: `${c.text} 초안`, alts: [], from: [] })), prep: [], say: "대화도 읽었어요" },
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
const refused = (r, status, re, what = "") => { assert.equal(r.status, status, `${what} ${r.text}`); assert.equal(r.json.ok, false); assert.match(r.json.reason, re, what); };
const chat = (body, o) => call("POST", "/api/chat", body, o);

test("확인 값이 없으면 403 — AI를 부르는 길(AI_ROUTES)", async () => {
  refused(await chat({ stage: 2, talk: TALK }, { withTok: false }), 403, /확인 값/);
});

test("본문 모양 — 단계 · 등급 · 대화(마지막은 사람, 40줄 · 줄 1,000자 · 합 8,000자) · 적은 줄(그 등급 칸 수) · 지난 단계", async () => {
  refused(await chat({ talk: TALK }), 400, /지금 단계가 없음/);
  refused(await chat({ stage: 9, talk: TALK }), 400, /지금 단계가 없음/);
  refused(await chat({ stage: "2", talk: TALK }), 400, /지금 단계가 없음/);
  refused(await chat({ stage: 2, tier: "Big", talk: TALK }), 400, /모르는 등급/);
  refused(await chat({ stage: 2, talk: [] }), 400, /대화가 비어 있음/);
  refused(await chat({ stage: 2, talk: [{ who: "me", text: "안녕" }, { who: "floro", text: "안녕하세요" }] }), 400, /마지막은 사람의 말/);
  refused(await chat({ stage: 2, talk: [{ who: "admin", text: "x" }] }), 400, /대화 모양이 맞지 않음/);
  refused(await chat({ stage: 2, talk: [{ who: "me", text: 3 }] }), 400, /대화 모양이 맞지 않음/);
  refused(await chat({ stage: 2, talk: Array.from({ length: 41 }, () => ({ who: "me", text: "a" })) }), 400, /대화가 너무 김/);
  refused(await chat({ stage: 2, talk: [{ who: "me", text: "가".repeat(1001) }] }), 400, /대화가 너무 김/);
  refused(await chat({ stage: 2, talk: Array.from({ length: 9 }, () => ({ who: "me", text: "가".repeat(900) })) }), 400, /대화가 너무 김/);
  refused(await chat({ stage: 2, tier: "Xpress", talk: TALK, lines: [[]] }), 400, /적은 줄의 모양이 맞지 않음/, "칸 수가 다르다");
  refused(await chat({ stage: 2, tier: "Xpress", talk: TALK, lines: LINES.map((l, i) => (i ? l : ["가".repeat(401)])) }), 400, /적은 줄의 모양이 맞지 않음/);
  refused(await chat({ stage: 2, talk: TALK, idea: "가".repeat(401) }), 400, /처음 말한 것/);
  refused(await chat({ stage: 2, tier: "Xpress", talk: TALK, prev: [{ stage: 5, items: [] }] }), 400, /지난 단계 결과의 모양/);
});

test("성공 — 플로로의 답 + 이 대화로 채울 수 있는 칸(0부터 · 칸 번호 순서). 칸 밖 · 이미 적은 칸 · 같은 칸 두 번 · 빈 글은 버린다, n = 칸 수. 서버는 적지 않는다(제안만)", async () => {
  const r = await chat({ stage: 2, tier: "Xpress", idea: IDEA, talk: TALK, lines: LINES });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(Object.keys(r.json).sort(), ["n", "ok", "reply", "slots", "tokens"]);
  assert.equal(r.json.reply, ANSWER.reply);
  assert.deepEqual(r.json.slots, [{ i: 0, text: ANSWER.slots[0].text }], "AI의 2번(0부터 1)은 이미 적은 칸이라 버린다 · 같은 칸 두 번 · 칸 밖 · 빈 글도 버린다");
  assert.equal(r.json.n, 1);
});

test("성공(빈 칸) — 이미 적은 칸이 없으면 AI의 1 · 2번 칸이 0 · 1로 남는다", async () => {
  const r = await chat({ stage: 2, tier: "Xpress", idea: IDEA, talk: TALK, lines: BLANK });
  assert.equal(r.status, 200, r.text);
  assert.deepEqual(r.json.slots, [{ i: 0, text: ANSWER.slots[0].text }, { i: 1, text: ANSWER.slots[1].text }], "AI의 1 · 2번 칸 → 0 · 1, 같은 칸 두 번 · 칸 밖 · 빈 글은 버림");
  assert.equal(r.json.n, 2);
});

test("비밀값처럼 보이는 글은 가린 뒤 AI에 넘긴다 — 가린 요청문이어야 녹화와 맞는다(원문이 나가면 녹화에 없어 실패)", async () => {
  const r = await chat({ stage: 2, tier: "Xpress", talk: SECRET_TALK });
  assert.equal(r.status, 200, r.text); assert.equal(r.json.reply, "신청부터 정리해요."); assert.equal(r.json.n, 0);
  assert.ok(!Nav.chatPrompt(2, "Xpress", { talk: redactTalk(SECRET_TALK) }).includes(FAKE_KEY), "가린 요청문에는 키가 없다");
});

test("AI 답이 비면 502 '대화 형식이 맞지 않음'", async () => {
  refused(await chat({ stage: 0, talk: [{ who: "me", text: "빈 답" }] }), 502, /대화 형식이 맞지 않음/);
});

test("/api/stagedraft — talk(대화)를 받아 요청문에 넣는다(받은 글처럼), 모양이 틀리면 400", async () => {
  const prev = [{ stage: 0, items: [{ name: "불편", lines: ["종이 신청이 헷갈림"] }] }];
  const r = await call("POST", "/api/stagedraft", { stage: 1, tier: "Xpress", idea: IDEA, prev, talk: TALK });
  assert.equal(r.status, 200, r.text); assert.equal(r.json.draft.say, "대화도 읽었어요");
  assert.match(Nav.stageDraftPrompt(1, "Xpress", { idea: IDEA, prev, talk: TALK }), /<대화>/);
  assert.doesNotMatch(Nav.stageDraftPrompt(1, "Xpress", { idea: IDEA, prev }), /<대화>/, "없으면 전과 같은 요청문");
  refused(await call("POST", "/api/stagedraft", { stage: 1, tier: "Xpress", idea: IDEA, prev, talk: [{ who: "x", text: "y" }] }), 400, /대화 모양이 맞지 않음/);
});

test("누가 정했나 새 값 — chat('대화'). 저장소에서 온 모르는 값은 지금처럼 버린다", () => {
  assert.ok(Q.BY.includes("chat")); assert.equal(Q.BY_WORD.chat, "대화");
});
