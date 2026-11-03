// claude-drafted: 2026-10-20 — FR-17 섬에서 허용 · 거절(C-4). Claude Code의 **PermissionRequest** 훅 — 파일을 고치거나 명령을 쓰기 전에 허락을 구할 때 불린다.
// 지켜보기 훅(hook.js — 답을 기다리지 않는다)과 **따로** 둔다: 이 훅은 섬의 결정을 기다린다(넘김 문서 3절 "기다리는 훅은 새로 두고, 지금 훅의 원칙은 바꾸지 않는다").
//   1. 입력(session_id · cwd · tool_name · tool_input)으로 승인 카드(approve.js card)와 지문(sig)을 만든다 — tool_input 원문은 보내지 않는다
//   2. 127.0.0.1의 Floe 서버 POST /api/approval에 보내고 답을 기다린다(NAV_APPROVAL_WAIT, 기본 95초 — connect.js의 훅 시간 상한 120초보다 짧게)
//   3. 서버가 allow · deny라고 하면 그 JSON을 출력한다. 그 밖(none · 서버 꺼짐 · 오류 · 시간 초과 · 이상한 답)은 **아무것도 출력하지 않고 0으로 끝난다**
//      → Claude Code는 보통 흐름(터미널에서 스스로 묻기, -p면 거절)으로 간다. 저절로 허용하는 길이 없다(요구서 FR-17 "대신 허용하지 않는다").
// Claude Code 훅 문서(2026-10-20 확인): 결정은 hookSpecificOutput.decision.behavior allow|deny뿐, exit 2는 이 훅에서 무시되고, 시간이 넘으면 출력은 버려진다.
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const AP = require("./approve.js");
const TOOL = process.argv[2] === "codex" ? "codex" : "claude";
const TOKEN_FILE = process.env.NAV_EVENT_TOKEN_FILE || path.join(os.homedir(), ".navigator-event-token");
// 앱은 4317이 차면 옆 포트로 켜진다 — NAV_PORT가 없으면 서버가 확인 값 파일 옆에 적은 포트(server.js announcePort, F-104-3)
const PORT = Number(process.env.NAV_PORT) || (() => { try { return Number(fs.readFileSync(`${TOKEN_FILE}.port`, "utf8").trim()) || 4317; } catch { return 4317; } })();
const WAIT = Math.max(100, Number(process.env.NAV_APPROVAL_WAIT) || 95_000);

let input = "";
process.stdin.setEncoding("utf8");   // 조각 경계의 한글이 '�'로 깨지지 않게(F-144-6 새 맥락 리뷰 — 긴 Write 글 · 도구 결과)
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let ev;
  try { ev = JSON.parse(input); } catch { return; }
  if (!ev || typeof ev !== "object" || typeof ev.tool_name !== "string") return;
  const body = JSON.stringify({ id: crypto.randomBytes(12).toString("base64url"), sig: AP.sig(ev), session_id: String(ev.session_id || ""), cwd: String(ev.cwd || ""), tool: TOOL, tool_name: ev.tool_name, card: AP.card(ev) });
  let token = "";
  try { token = fs.readFileSync(TOKEN_FILE, "utf8").trim(); } catch {}
  let done = false;
  const finish = (decision) => { if (done) return; done = true; const out = AP.decisionOutput(decision); if (out) process.stdout.write(out); process.exit(0); };
  const timer = setTimeout(() => finish(""), WAIT);
  const req = http.request({ host: "127.0.0.1", port: PORT, path: "/api/approval", method: "POST", timeout: WAIT,
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...(token && { "X-Nav-Token": token }) } }, (res) => {
    let text = "";
    res.setEncoding("utf8");
    res.on("data", (d) => (text += d));
    res.on("end", () => { clearTimeout(timer); let j = null; try { j = JSON.parse(text); } catch {} finish(res.statusCode === 200 && j && j.ok === true ? j.decision : ""); });
  });
  req.on("error", () => { clearTimeout(timer); finish(""); });
  req.on("timeout", () => { req.destroy(); clearTimeout(timer); finish(""); });
  req.end(body);
});
