// claude-drafted: 2026-10-25 — C-38 시험판 "같이 쓸 앱"(두승현 "같이 쓸 앱으로 연결으로 해줘"). 처음 설정의 '같이 쓸 앱' 칸이 부른다(server.js /api/apps · /api/apps/link).
// Claude Desktop 설정 파일(claude_desktop_config.json)의 mcpServers에 floe 한 칸만 넣는다 — 내 컴퓨터 안 MCP(mcp-stdio.js), 터널 없음.
// 원래 설정의 다른 칸은 그대로, 처음 한 번 원본을 .floe-bak으로 남긴다. 깨진 설정이면 쓰지 않는다. 토큰 값은 넣지 않고 파일 자리만.
// 시험: 04-tests/navigator/app-link.test.js
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const NAME = "claude_desktop_config.json";
const listDir = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
// 설정 파일 자리 — 폴더가 있는 첫 후보(Claude Desktop을 한 번이라도 켰으면 생긴다). 없으면 null
function desktopConfig({ platform = process.platform, env = process.env, home = os.homedir(), exists = fs.existsSync, list = listDir } = {}) {
  const dirs = [];
  if (platform === "win32") {
    const local = env.LOCALAPPDATA || path.join(home, "AppData", "Local"), roaming = env.APPDATA || path.join(home, "AppData", "Roaming");
    for (const d of list(path.join(local, "Claude-Data"))) if (/^claude_/i.test(d)) dirs.push(path.join(local, "Claude-Data", d));   // 스토어(MSIX)판 — 2026-10-25 이 컴퓨터에서 확인
    dirs.push(path.join(roaming, "Claude"));
  } else if (platform === "darwin") dirs.push(path.join(home, "Library", "Application Support", "Claude"));
  else dirs.push(path.join(env.XDG_CONFIG_HOME || path.join(home, ".config"), "Claude"));
  const dir = dirs.find((d) => exists(d));
  return dir ? path.join(dir, NAME) : null;
}
// 넣을 한 칸 — Electron 앱이면 앱 실행 파일을 node로(ELECTRON_RUN_AS_NODE), 아니면 지금 node로 중계 파일을 켠다
// ponytail: 포트는 이은 때의 값 — 앱이 다른 포트로 켜지면(4317이 차 있을 때) 다시 이어야 한다. 자주 그러면 포트 파일을 둔다
function entry({ execPath = process.execPath, electron = !!process.versions.electron, port, tokenFile }) {
  const dir = __dirname.replace(/app\.asar(?=[\\/])/, "app.asar.unpacked");   // 묶은 앱 — 백엔드 .js는 asar 밖(electron package.json asarUnpack). Claude Desktop이 켤 수 있는 실제 파일 자리로
  return { command: execPath, args: [path.join(dir, "mcp-stdio.js")],
    env: { ...(electron ? { ELECTRON_RUN_AS_NODE: "1" } : {}), NAV_PORT: String(port), NAV_MCP_TOKEN_FILE: tokenFile } };
}
// 없는 파일은 null, 읽지 못한 파일(잠김 · 권한)은 undefined — F-144-3(2026-11-03): 전에는 둘 다 null이라 읽지 못한 설정을 백업 없이 덮어썼다
const read = (file) => { try { return fs.readFileSync(file, "utf8"); } catch (e) { return e && e.code === "ENOENT" ? null : undefined; } };
const parse = (text) => { const j = JSON.parse(text); if (!j || typeof j !== "object" || Array.isArray(j)) throw new Error("모양"); return j; };
function status(file) {
  if (!file) return { found: false, linked: false };
  const t = read(file);
  try { const j = parse(t); return { found: true, linked: !!(j.mcpServers && j.mcpServers.floe) }; } catch { return { found: true, linked: false }; }   // 없음 · 빈 파일 · 깨진 설정은 parse가 던진다
}
function link(file, e) {
  if (!file) return { ok: false, message: "Claude Desktop을 찾지 못했어요 — 설치하고 한 번 켠 뒤 다시 해 주세요" };
  const t = read(file);
  if (t === undefined) return { ok: false, message: "Claude Desktop 설정 파일을 읽지 못해 건드리지 않았어요 — Claude Desktop을 끈 뒤 다시 해 주세요" };
  let j = {};
  if (t && t.trim()) { try { j = parse(t); } catch { return { ok: false, message: "Claude Desktop 설정 파일이 깨져 있어 건드리지 않았어요" }; } }
  try {
    if (t !== null && !fs.existsSync(`${file}.floe-bak`)) fs.writeFileSync(`${file}.floe-bak`, t);
    const servers = j.mcpServers && typeof j.mcpServers === "object" && !Array.isArray(j.mcpServers) ? j.mcpServers : {};
    fs.writeFileSync(file, `${JSON.stringify({ ...j, mcpServers: { ...servers, floe: e } }, null, 2)}\n`);
  } catch { return { ok: false, message: "Claude Desktop 설정 파일에 쓰지 못했어요" }; }
  return { ok: true };
}

module.exports = { desktopConfig, entry, status, link };
