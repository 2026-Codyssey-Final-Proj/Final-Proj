// claude-drafted: 2026-10-25 — C-38 시험판 "같이 쓸 앱"(두승현 "같이 쓸 앱으로 연결으로 해줘"): 처음 설정에서 Claude Desktop에 Floe를 잇는다(내 컴퓨터 안 MCP, 터널 없음).
// 코드보다 먼저 썼다(code.md 1번). 진짜 Claude Desktop 설정 파일은 건드리지 않는다 — 임시 폴더에서만.
// 실행: node --test 04-tests/navigator/app-link.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawn } = require("node:child_process");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const Link = require(path.join(BACK, "app-link.js"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-applink-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_MCP_TOKEN_FILE: path.join(TMP, "mcp-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json") });
delete process.env.NAV_MCP;   // 터널(밖)은 꺼진 채 — 내 컴퓨터 안 연결만

test("app-link — 설정 파일 자리: Windows 스토어판(Claude-Data/claude_*) → 일반판(AppData/Roaming/Claude) 순, Mac은 Application Support. 폴더가 없으면 null", () => {
  const has = (...ds) => (d) => ds.includes(d);
  const win = { platform: "win32", env: { LOCALAPPDATA: "L", APPDATA: "R" }, home: "H" };
  const store = path.join("L", "Claude-Data", "claude_abc");
  assert.equal(Link.desktopConfig({ ...win, exists: has(store, path.join("R", "Claude")), list: () => ["claude_abc", "other"] }), path.join(store, "claude_desktop_config.json"));
  assert.equal(Link.desktopConfig({ ...win, exists: has(path.join("R", "Claude")), list: () => [] }), path.join("R", "Claude", "claude_desktop_config.json"));
  assert.equal(Link.desktopConfig({ ...win, exists: () => false, list: () => [] }), null);
  assert.equal(Link.desktopConfig({ platform: "darwin", env: {}, home: "H", exists: () => true, list: () => [] }), path.join("H", "Library", "Application Support", "Claude", "claude_desktop_config.json"));
});

test("app-link — 넣을 줄: 이 실행 파일로 중계 파일(mcp-stdio.js)을 켠다. Electron이면 ELECTRON_RUN_AS_NODE. 토큰 값은 넣지 않고 파일 자리만", () => {
  const e = Link.entry({ execPath: "/x/electron", electron: true, port: 4320, tokenFile: "/h/.floe-mcp-token" });
  assert.equal(e.command, "/x/electron"); assert.equal(path.basename(e.args[0]), "mcp-stdio.js"); assert.ok(fs.existsSync(e.args[0]), "중계 파일이 있다");
  assert.deepEqual(e.env, { ELECTRON_RUN_AS_NODE: "1", NAV_PORT: "4320", NAV_MCP_TOKEN_FILE: "/h/.floe-mcp-token" });
  assert.equal(Link.entry({ execPath: "/x/node", electron: false, port: 4317, tokenFile: "t" }).env.ELECTRON_RUN_AS_NODE, undefined);
});

test("app-link — 잇기: 원래 설정(다른 칸 · 다른 MCP 서버)은 그대로, mcpServers.floe만 넣고, 처음 한 번은 원본을 .floe-bak으로 남긴다. 깨진 JSON이면 쓰지 않는다", () => {
  const dir = path.join(TMP, "claude"); fs.mkdirSync(dir);
  const file = path.join(dir, "claude_desktop_config.json");
  const orig = JSON.stringify({ preferences: { a: 1 }, mcpServers: { other: { command: "x" } } });
  fs.writeFileSync(file, orig);
  const e = Link.entry({ execPath: "n", electron: false, port: 4317, tokenFile: "t" });
  assert.deepEqual(Link.status(file), { found: true, linked: false });
  assert.equal(Link.link(file, e).ok, true);
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.deepEqual(j.preferences, { a: 1 }); assert.deepEqual(j.mcpServers.other, { command: "x" }); assert.deepEqual(j.mcpServers.floe, e);
  assert.equal(fs.readFileSync(`${file}.floe-bak`, "utf8"), orig, "원본을 남긴다");
  assert.deepEqual(Link.status(file), { found: true, linked: true });
  Link.link(file, { ...e, args: ["다른"] });
  assert.equal(fs.readFileSync(`${file}.floe-bak`, "utf8"), orig, "두 번째에는 원본을 덮지 않는다");
  fs.writeFileSync(file, "{ 깨짐");
  const bad = Link.link(file, e);
  assert.equal(bad.ok, false); assert.equal(fs.readFileSync(file, "utf8"), "{ 깨짐", "깨진 설정은 건드리지 않는다");
  const none = path.join(TMP, "claude2", "claude_desktop_config.json"); fs.mkdirSync(path.dirname(none));
  assert.equal(Link.link(none, e).ok, true, "파일이 없으면 새로"); assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(none, "utf8")).mcpServers), ["floe"]);
  assert.deepEqual(Link.status(null), { found: false, linked: false });
});

// ── 서버 + 중계 파일 ──
let Srv, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken(); Srv.mcpToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
// 중계 파일에 줄을 보내고 답 줄을 받는다
function bridge(lines, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(BACK, "mcp-stdio.js")], { env: { ...process.env, ...env } });
    let out = ""; p.stdout.on("data", (d) => (out += d)); p.on("error", reject);
    p.stdin.write(lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
    setTimeout(() => { p.kill(); resolve(out.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))); }, 1500);
  });
}
test("서버 — 이 컴퓨터 안에서는 NAV_MCP 없이도 /mcp/<토큰>을 받는다(토큰은 그대로 필요). 밖(터널)에서는 여전히 404", async () => {
  const tok = fs.readFileSync(process.env.NAV_MCP_TOKEN_FILE, "utf8").trim();
  const go = (host, t = tok) => new Promise((resolve) => {
    const d = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" });
    const r = http.request({ host: "127.0.0.1", port, path: `/mcp/${t}`, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(d), ...(host ? { Host: host } : {}) } }, (s) => { s.resume(); s.on("end", () => resolve(s.statusCode)); });
    r.end(d);
  });
  assert.equal(await go(), 200);
  assert.equal(await go(undefined, "x".repeat(43)), 404);
  assert.equal(await go("floe-test.trycloudflare.com"), 404, "밖은 NAV_MCP=1일 때만");
});
test("중계 파일 — Floe가 켜져 있으면 그대로 넘기고(floe_now), 꺼져 있으면 mcp.js가 직접 답한다(도구 목록 · 'Floe 앱이 열려 있지 않아요')", async () => {
  const msgs = [{ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }, { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "floe_now", arguments: {} } }];
  const on = await bridge(msgs, { NAV_PORT: String(port) });
  assert.deepEqual(on.map((m) => m.id), [1, 2], "알림에는 답하지 않는다");
  assert.equal(on[0].result.serverInfo.name, "floe");
  assert.match(on[1].result.content[0].text, /Floe 앱이 열려 있지 않아요/, "화면이 상태를 보내기 전");
  const off = await bridge(msgs.concat([{ jsonrpc: "2.0", id: 3, method: "tools/list" }]), { NAV_PORT: String(await freePort()) });
  assert.equal(off.find((m) => m.id === 3).result.tools.length, 4, "꺼져 있어도 도구 목록은 보인다");
  assert.match(off.find((m) => m.id === 2).result.content[0].text, /Floe 앱이 열려 있지 않아요/);
});
test("서버 — GET /api/apps는 Claude Desktop을 찾았는지 · 이었는지만, POST /api/apps/link는 확인 값이 있어야", async () => {
  const ev = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
  const call = (method, url, body, tok) => new Promise((resolve) => {
    const d = body ? JSON.stringify(body) : undefined;
    const r = http.request({ host: "127.0.0.1", port, path: url, method, headers: { ...(d ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(d) } : {}), ...(tok ? { "X-Nav-Token": tok } : {}) } }, (s) => { let t = ""; s.on("data", (c) => (t += c)); s.on("end", () => resolve({ status: s.statusCode, json: JSON.parse(t || "null") })); });
    r.end(d);
  });
  const g = await call("GET", "/api/apps");
  assert.equal(g.status, 200); assert.deepEqual(Object.keys(g.json.claudeDesktop).sort(), ["found", "linked"]);
  assert.equal((await call("POST", "/api/apps/link", { app: "claude-desktop" })).status, 403, "확인 값 없이는 남의 설정 파일을 고치지 않는다");
  assert.equal((await call("POST", "/api/apps/link", { app: "vscode" }, ev)).status, 400, "모르는 앱");
});
