// claude-drafted: 2026-10-25 — C-38 시험판 "같이 쓸 앱": Claude Desktop · VS Code(내 컴퓨터 안 MCP, stdio) ↔ 켜져 있는 Floe의 /mcp/<토큰>. 한 줄에 JSON-RPC 한 통.
// Claude Desktop이 이 파일을 켠다(app-link.js가 설정 파일에 넣은 칸). 규칙은 mcp.js 그대로 — 여기서는 넘기기만 한다.
// Floe가 꺼져 있으면 mcp.js가 직접 답한다(도구 목록 · "Floe 앱이 열려 있지 않아요") — Claude Desktop이 연결 실패로 보지 않게.
// 시험: 04-tests/navigator/app-link.test.js
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");
const Mcp = require("./mcp.js");

const PORT = Number(process.env.NAV_PORT) || 4317;
const TOKEN_FILE = process.env.NAV_MCP_TOKEN_FILE || path.join(os.homedir(), ".floe-mcp-token");
const token = () => { try { return fs.readFileSync(TOKEN_FILE, "utf8").trim(); } catch { return ""; } };
const out = (o) => process.stdout.write(`${JSON.stringify(o)}\n`);

async function relay(msg) {
  const t = token();
  if (t) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/mcp/${t}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(msg) });
      if (r.status === 202) return null;
      if (r.ok) return await r.json();
    } catch {}
  }
  return Mcp.rpc(msg, { state: () => null, propose: () => {} });
}

readline.createInterface({ input: process.stdin }).on("line", async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return out({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON이 아님" } }); }
  const r = await relay(msg);
  if (r) out(r);
});
