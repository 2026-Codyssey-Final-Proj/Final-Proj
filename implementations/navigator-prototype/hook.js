// claude-drafted: 2026-10-14
// Claude Code 훅 → Navigator 서버. Claude Code가 요청을 받거나(UserPromptSubmit) 작업을 마치면(Stop) 이 파일을 부른다.
// 받은 알림에서 필요한 칸만 127.0.0.1의 Navigator 서버로 넘기고 바로 끝난다.
// 서버가 꺼져 있거나 늦어도 Claude Code를 막지 않는다 — 실패해도 조용히 0으로 끝낸다(CouCou와 같은 원칙).
// 아무것도 출력하지 않는다: UserPromptSubmit 훅의 출력은 Claude에게 전달되기 때문이다.
const http = require("node:http");
const PORT = Number(process.env.NAV_PORT) || 4317;

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let ev;
  try { ev = JSON.parse(input); } catch { return; }
  // 요청을 받을 때는 사용자의 요청(prompt), 작업을 마칠 때는 Claude의 마지막 답(last_assistant_message)만 넘긴다
  const body = JSON.stringify({
    hook_event_name: ev.hook_event_name, session_id: ev.session_id, cwd: ev.cwd,
    prompt: ev.prompt, last_assistant_message: ev.last_assistant_message,
  });
  const req = http.request({ host: "127.0.0.1", port: PORT, path: "/api/event", method: "POST", timeout: 1500,
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (res) => res.resume());
  req.on("error", () => {});
  req.on("timeout", () => req.destroy());
  req.end(body);
});
