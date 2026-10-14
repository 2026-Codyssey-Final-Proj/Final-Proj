// claude-drafted: 2026-10-14
// 로컬 서버 — 화면을 열고, 실제 Claude 판정을 붙인다. **외부 AI 호출은 이 파일 한 곳에서만** 한다(implementations.md 6번, 테스트로 확인).
//
//   node implementations/navigator-prototype/server.js   →  http://127.0.0.1:4317
//
// API 키를 쓰지 않는다. 이 컴퓨터에 로그인된 Claude Code(`claude -p`)의 구독으로 부른다.
// 잠금: 도구 없음, MCP 없음, 사용자 설정 안 읽음, 대화 기록 안 남김 — 입력 글만 판정한다.
// 입력 글은 Claude(AI 서비스)로 전송된다(security-records.md 1절). 서버가 꺼져 있으면 화면은 미리 만든 응답으로 움직인다.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const Nav = require("./navigator.js");

const PORT = Number(process.env.NAV_PORT) || 4317;
const TIMEOUT_MS = 90_000;
const MAX_BODY = 20_000;

// 정해진 파일만 내준다 — 경로를 요청에서 만들지 않는다.
const FILES = {
  "/": ["index.html", "text/html"],
  "/app.css": ["app.css", "text/css"],
  "/app.js": ["app.js", "text/javascript"],
  "/cat.js": ["cat.js", "text/javascript"],
  "/navigator.js": ["navigator.js", "text/javascript"],
  "/scenario.js": ["scenario.js", "text/javascript"],
  "/share-rules.js": ["../share-prototype/share-rules.js", "text/javascript"],
};

// 다른 웹페이지가 내 구독으로 Claude를 부르지 못하게: Host는 이 컴퓨터, Origin은(있으면) 이 서버만.
function allowed(headers, port = PORT) {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!hosts.includes(headers.host)) return false;
  return !headers.origin || hosts.some((h) => headers.origin === `http://${h}`);
}

function callClaude(prompt, schema) {
  return new Promise((resolve) => {
    const args = ["-p", "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--no-session-persistence",
      "--output-format", "json", "--json-schema", JSON.stringify(schema)];
    const child = spawn("claude", args, { env: { ...process.env, ENABLE_CLAUDEAI_MCP_SERVERS: "false" }, windowsHide: true });
    let out = "";
    const timer = setTimeout(() => { child.kill(); resolve({ error: "시간 초과" }); }, TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d));
    child.on("error", () => { clearTimeout(timer); resolve({ error: "claude 명령을 찾지 못함 — Claude Code가 설치·로그인됐는지 확인" }); });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const r = JSON.parse(out);
        if (r.is_error || !r.structured_output) return resolve({ error: "Claude가 정해진 형식으로 답하지 않음" });
        const u = r.usage || {};
        const tokens = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
        resolve({ data: r.structured_output, tokens });
      } catch { resolve({ error: "Claude 응답을 읽지 못함" }); }
    });
    child.stdin.end(prompt);
  });
}

// 너무 크거나 끊긴 요청은 null — 끊겨도 기다리던 쪽이 멈춰 있지 않게 close에서도 끝낸다
function readJson(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (d) => { body += d; if (body.length > MAX_BODY) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    req.on("close", () => resolve(null));
  });
}

const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(obj)); };

async function handle(req, res) {
  if (!allowed(req.headers)) return send(res, 403, { ok: false, reason: "이 컴퓨터의 화면에서만 부를 수 있음" });
  if (req.method === "GET" && FILES[req.url]) {
    const [file, type] = FILES[req.url];
    res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
    return fs.createReadStream(path.join(__dirname, file)).pipe(res);
  }
  if (req.method !== "POST") return send(res, 404, { ok: false });
  const body = await readJson(req);
  if (!body || typeof body.text !== "string" || !body.text.trim()) return send(res, 400, { ok: false, reason: "작업 내용이 비어 있음" });

  if (req.url === "/api/judge") {
    const r = await callClaude(Nav.judgePrompt(body.text), Nav.JUDGE_SCHEMA);
    const j = r.data && Nav.parseJudgement(r.data);
    return j ? send(res, 200, { ok: true, judgement: j, tokens: r.tokens }) : send(res, 502, { ok: false, reason: r.error || "판정 형식이 맞지 않음" });
  }
  if (req.url === "/api/answer") {
    const stage = body.stage, hard = Array.isArray(body.hard) ? body.hard.map(String) : [];
    if (!Nav.STAGES[stage] || typeof body.question !== "string" || !body.question.trim()) return send(res, 400, { ok: false, reason: "질문이 비어 있음" });
    const r = await callClaude(Nav.answerPrompt(stage, hard, body.question, body.text), Nav.ANSWER_SCHEMA);
    return r.data && typeof r.data.answer === "string" ? send(res, 200, { ok: true, answer: r.data.answer, tokens: r.tokens }) : send(res, 502, { ok: false, reason: r.error || "답 형식이 맞지 않음" });
  }
  send(res, 404, { ok: false });
}

if (require.main === module) {
  http.createServer(handle).listen(PORT, "127.0.0.1", () => console.log(`Navigator 프로토타입: http://127.0.0.1:${PORT}`));
}
module.exports = { allowed };
