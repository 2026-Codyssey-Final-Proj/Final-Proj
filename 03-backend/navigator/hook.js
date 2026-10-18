// claude-drafted: 2026-10-14
// Claude Code·Codex 훅 → Navigator 서버. 요청을 받거나(UserPromptSubmit) 작업을 마치면(Stop) 이 파일을 부른다.
// Codex(GPT)도 같은 모양의 알림을 보낸다(2026-10-14 실측). Codex에서 부를 때는 `node hook.js codex`로 도구 이름만 붙인다.
// 받은 알림에서 필요한 칸만 127.0.0.1의 Navigator 서버로 넘기고 바로 끝난다.
// 서버가 꺼져 있거나 늦어도 Claude Code를 막지 않는다 — 실패해도 조용히 0으로 끝낸다(CouCou와 같은 원칙).
// 아무것도 출력하지 않는다: UserPromptSubmit 훅의 출력은 Claude에게 전달되기 때문이다.
// 확인 값(S3, claude-drafted: 2026-10-18): 서버가 만든 홈 폴더 파일(~/.navigator-event-token)을 부를 때마다 읽어 X-Nav-Token으로 보낸다.
// 파일이 없으면(서버를 한 번도 안 켰으면) 값 없이 보내고 서버가 거절한다 — 그래도 조용히 끝난다.
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const PORT = Number(process.env.NAV_PORT) || 4317;
const TOOL = process.argv[2] === "codex" ? "codex" : "claude";
const TOKEN_FILE = process.env.NAV_EVENT_TOKEN_FILE || path.join(os.homedir(), ".navigator-event-token");

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let ev;
  try { ev = JSON.parse(input); } catch { return; }
  // 요청을 받을 때는 사용자의 요청(prompt), 작업을 마칠 때는 Claude의 마지막 답(last_assistant_message)만 넘긴다
  const body = JSON.stringify({
    hook_event_name: ev.hook_event_name, session_id: ev.session_id, cwd: ev.cwd,
    prompt: ev.prompt, last_assistant_message: ev.last_assistant_message, tool: TOOL,
  });
  let token = "";
  try { token = fs.readFileSync(TOKEN_FILE, "utf8").trim(); } catch {}
  const req = http.request({ host: "127.0.0.1", port: PORT, path: "/api/event", method: "POST", timeout: 1500,
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...(token && { "X-Nav-Token": token }) } }, (res) => res.resume());
  req.on("error", () => {});
  req.on("timeout", () => req.destroy());
  req.end(body);
});
