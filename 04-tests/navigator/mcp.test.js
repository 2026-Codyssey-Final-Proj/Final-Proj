// claude-drafted: 2026-10-25 — C-38 시험판(두승현 "이 브랜치에서 시험용으로 만들자"): Floe를 원격 MCP로 웹 GPT · 웹 Claude에 잇는다.
// 코드보다 먼저 썼다(code.md 1번). 진짜 AI · 진짜 웹 AI는 부르지 않는다 — 가짜 웹 AI처럼 JSON-RPC를 직접 보낸다.
// 실행: node --test 04-tests/navigator/mcp.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const Mcp = require(path.join(BACK, "mcp.js"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-mcp-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_MCP_TOKEN_FILE: path.join(TMP, "mcp-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_MCP: "1" });

// 화면이 보내는 상태 — 2단계 퀘스트, 할 일 둘 중 첫째는 적음
const STATE = { project: "test-1", mode: "live", stage: 1, quest: { chap: 1, title: "아이디어 적어 두기", phase: "quest",
  objs: [{ name: "누가 쓰는지 쓰기", need: 1 }, { name: "왜 만드는지 쓰기", need: 1 }], lines: [["동아리 회원"], []], cur: 1, ask: "왜 만들고 싶나요?" } };

// ── 순수 함수(mcp.js) ──
const ctx = (state) => { const got = []; return { got, state: () => state, propose: (p) => { got.push(p); return { id: "p1" }; } }; };
test("mcp.js — initialize는 같은 판(protocolVersion)으로 답하고, 도구만 있다고 알리며, 일하는 순서를 안내문에 담는다", () => {
  const r = Mcp.rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "x", version: "1" } } }, ctx(null));
  assert.equal(r.id, 1); assert.equal(r.result.protocolVersion, "2025-03-26");
  assert.ok(r.result.capabilities.tools && !r.result.capabilities.resources, "도구만");
  assert.match(r.result.instructions, /floe_now/); assert.match(r.result.instructions, /floe_report/);
  assert.equal(Mcp.rpc({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } }, ctx(null)).result.protocolVersion, Mcp.VERSIONS[0], "모르는 판이면 우리가 아는 최신");
});
test("mcp.js — 알림(id 없음)에는 답하지 않고, 모르는 방법은 -32601", () => {
  assert.equal(Mcp.rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, ctx(null)), null);
  assert.equal(Mcp.rpc({ jsonrpc: "2.0", id: 3, method: "resources/list" }, ctx(null)).error.code, -32601);
  assert.deepEqual(Mcp.rpc({ jsonrpc: "2.0", id: 4, method: "ping" }, ctx(null)).result, {});
});
test("mcp.js — 도구는 셋(floe_now · floe_style · floe_report)뿐: 일 넘기기 · 문서 쓰기 · 허용 · 거절은 없다", () => {
  const names = Mcp.rpc({ jsonrpc: "2.0", id: 5, method: "tools/list" }, ctx(null)).result.tools.map((t) => t.name);
  assert.deepEqual(names, ["floe_now", "floe_style", "floe_report"]);
});
test("mcp.js — floe_now: 화면 단계 번호(1부터) · 퀘스트 · 할 일마다 ✓/○ · 지금 할 일과 질문. 상태가 없으면 섬을 열라고", () => {
  const text = (s) => Mcp.rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "floe_now", arguments: {} } }, ctx(s)).result.content[0].text;
  const t = text(Mcp.cleanState(STATE));
  assert.match(t, /2단계/); assert.match(t, /아이디어 적어 두기/);
  assert.match(t, /✓ 누가 쓰는지 쓰기 — "동아리 회원"/); assert.match(t, /○ 왜 만드는지 쓰기/);
  assert.match(t, /지금 할 일: 2번/); assert.match(t, /왜 만들고 싶나요\?/);
  assert.match(text(null), /Floe 앱/);
});
test("mcp.js — floe_report: 할 일 번호 · 한 줄을 제안으로만 넘긴다. 번호가 없거나 글이 비면 isError", () => {
  const c = ctx(Mcp.cleanState(STATE));
  const ok = Mcp.rpc({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "floe_report", arguments: { todo: 2, text: "행사 신청을 종이로 받아 헷갈려서" } } }, c);
  assert.ok(!ok.result.isError, JSON.stringify(ok)); assert.match(ok.result.content[0].text, /맞아요/);
  assert.deepEqual(c.got, [{ chap: 1, todo: 1, name: "왜 만드는지 쓰기", text: "행사 신청을 종이로 받아 헷갈려서" }]);
  for (const a of [{ todo: 9, text: "x" }, { todo: 1, text: "  " }, { text: "x" }]) assert.equal(Mcp.rpc({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "floe_report", arguments: a } }, c).result.isError, true, JSON.stringify(a));
  assert.equal(Mcp.rpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "floe_report", arguments: { todo: 1, text: "x" } } }, ctx(null)).result.isError, true, "퀘스트가 없으면");
});
test("mcp.js — cleanState: 모양이 틀리면 null, 글은 가리고(비밀값) 자른다", () => {
  assert.equal(Mcp.cleanState(null), null); assert.equal(Mcp.cleanState({ quest: { objs: "x" } }), null);
  const s = Mcp.cleanState({ ...STATE, quest: { ...STATE.quest, lines: [["키: sk-ant-api03-" + "x".repeat(40)], ["y".repeat(900)]] } });   // secret-check: allow — 가림을 보는 가짜 값
  assert.ok(!JSON.stringify(s).includes("sk-ant-api03"), "비밀값은 가린다"); assert.ok(s.quest.lines[1][0].length <= Mcp.LINE_MAX);
});

// ── 서버(server.js) ──
let Srv, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const eventTok = () => fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
const mcpTok = () => fs.readFileSync(process.env.NAV_MCP_TOKEN_FILE, "utf8").trim();
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken(); Srv.mcpToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
function call(method, url, { body, local = true, host } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const h = { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), ...(local ? { "X-Nav-Token": eventTok() } : {}), ...(host ? { Host: host } : {}) };
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: h, timeout: 5000 }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}
const TUNNEL = "floe-test.trycloudflare.com";   // 터널을 거치면 Host가 이 컴퓨터가 아니다
const rpc = (msg, tok = mcpTok()) => call("POST", `/mcp/${tok}`, { body: msg, local: false, host: TUNNEL });

test("서버 — /mcp/<토큰>은 터널(다른 Host)에서도 받고, 토큰이 틀리면 404. 다른 주소는 터널에서 여전히 403", async () => {
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" })).status, 200);
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, "x".repeat(43))).status, 404);
  assert.equal((await call("POST", "/api/judge", { body: { text: "x", stage: 0 }, host: TUNNEL })).status, 403, "판정은 이 컴퓨터만");
  assert.equal((await call("GET", "/api/proposals", { host: TUNNEL })).status, 403, "제안 목록도 이 컴퓨터만");
  assert.equal((await call("GET", `/mcp/${mcpTok()}`, { local: false, host: TUNNEL })).status, 405, "GET은 받지 않는다(SSE 없음)");
});
test("서버 — NAV_MCP가 없으면 /mcp는 없는 주소(404) — 기본은 꺼짐", async () => {
  delete process.env.NAV_MCP;
  try { assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" })).status, 404); } finally { process.env.NAV_MCP = "1"; }
});
test("서버 — 화면이 상태를 보내면(POST /api/state) floe_now가 그 상태로, floe_report는 제안 목록에 → 섬이 보고(GET /api/proposals) 정한다(POST /api/proposals/decide)", async () => {
  assert.equal((await call("POST", "/api/state", { body: STATE, local: false })).status, 403, "상태는 확인 값이 있어야");
  assert.equal((await call("POST", "/api/state", { body: STATE })).status, 200);
  const now = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "floe_now", arguments: {} } });
  assert.match(now.json.result.content[0].text, /왜 만드는지 쓰기/);
  const rep = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "floe_report", arguments: { todo: 2, text: "종이 신청이 헷갈려서" } } });
  assert.ok(!rep.json.result.isError, rep.text);
  const list = (await call("GET", "/api/proposals")).json;
  assert.equal(list.items.length, 1); assert.equal(list.items[0].text, "종이 신청이 헷갈려서"); assert.equal(list.items[0].todo, 1);
  assert.equal((await call("POST", "/api/proposals/decide", { body: { id: list.items[0].id } })).status, 200);
  assert.equal((await call("GET", "/api/proposals")).json.items.length, 0, "정하면 목록에서 빠진다");
  assert.equal((await call("POST", "/api/proposals/decide", { body: { id: "nope" } })).status, 404);
});
test("서버 — 알림(id 없음)은 202 · 본문 없음, 깨진 JSON은 -32700", async () => {
  const n = await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(n.status, 202); assert.equal(n.text, "");
  const bad = await new Promise((resolve) => {
    const req = http.request({ host: "127.0.0.1", port, path: `/mcp/${mcpTok()}`, method: "POST", headers: { Host: TUNNEL, "Content-Type": "application/json" } }, (res) => { let t = ""; res.on("data", (d) => (t += d)); res.on("end", () => resolve({ status: res.statusCode, t })); });
    req.end("{ 깨짐");
  });
  assert.equal(bad.status, 400); assert.equal(JSON.parse(bad.t).error.code, -32700);
});
