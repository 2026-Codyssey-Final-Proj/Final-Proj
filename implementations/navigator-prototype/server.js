// claude-drafted: 2026-10-14
// 로컬 서버 — 화면을 열고, 실제 Claude 판정을 붙인다. **외부 AI 호출은 이 파일 한 곳에서만** 한다(implementations.md 6번, 테스트로 확인).
//
//   node implementations/navigator-prototype/server.js   →  http://127.0.0.1:4317
//
// API 키를 쓰지 않는다. 이 컴퓨터에 로그인된 Claude Code(`claude -p`)의 구독으로 부른다.
// 잠금: 도구 없음, MCP 없음, 사용자 설정 안 읽음, 대화 기록 안 남김 — 입력 글만 판정한다.
// 입력 글은 Claude(AI 서비스)로 전송된다(security-records.md 1절). 서버가 꺼져 있으면 화면은 미리 만든 응답으로 움직인다.
// 사용자 설정을 안 읽으므로(--setting-sources "") 여기서 부르는 claude는 사용자가 단 Navigator 훅을 다시 부르지 않는다.
//
// Claude Code·Codex 연결(connect.js로 훅을 단 경우): hook.js가 /api/event로 "요청 받음(사용자의 요청)·작업 마침(AI의 마지막 답)"을
// 알리면 세션마다 최근 대화를 메모리에만 모아 둔다 — 파일을 읽지도 남기지도 않는다.
// 화면은 /api/events를 2초마다 물어 새 알림을 받는다. 알림만으로는 AI에 보내지 않는다 — 보내는 건 화면에서 사용자가 정한다.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const Nav = require("./navigator.js");

const PORT = Number(process.env.NAV_PORT) || 4317;
const TIMEOUT_MS = 90_000;
const MAX_BODY = 40_000;   // 작업 글 + 설계도
const MAX_WORK = 4000;   // 알림 하나에 담는 작업 글 최대 글자 수
const HOOK_KINDS = { UserPromptSubmit: "prompt", Stop: "stop" };

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
const refuse = (res, reason, code = 400) => send(res, code, { ok: false, reason });
const as = (key, read) => (d) => { const v = read(d); return v && { [key]: v }; };   // 확인한 결과를 화면이 읽는 칸 이름으로

// Claude에게 묻고, 답의 모양을 확인한 것만 돌려준다. read: 확인해서 화면에 줄 칸들을 만든다(모양이 틀리면 null)
async function ask(res, prompt, schema, read, what) {
  const r = await callClaude(prompt, schema);
  const out = r.data && read(r.data);
  return out ? send(res, 200, { ok: true, ...out, tokens: r.tokens }) : refuse(res, r.error || `${what} 형식이 맞지 않음`, 502);
}

// ── Claude Code 연결 ──
// 최근 말부터 max 글자까지 — 넘치면 오래된 것부터 버린다
function recent(log, max = MAX_WORK) {
  const out = [];
  let n = 0;
  for (let i = log.length - 1; i >= 0 && n < max; i--) { const m = log[i].slice(0, max - n); out.unshift(m); n += m.length; }
  return out.join("\n");
}
const sessions = new Map();   // 세션별 최근 대화 — 메모리에만. 세션 10개·말 20개까지
const events = [];
let seq = 0;
function addEvent(body) {
  const kind = HOOK_KINDS[body.hook_event_name];
  if (!kind) return null;
  // Codex(GPT)도 Claude Code와 같은 모양으로 알린다(2026-10-14 실측) — 어느 도구인지만 hook.js가 붙여 준다
  const tool = body.tool === "codex" ? "codex" : "claude";
  const id = `${tool}:${String(body.session_id || "")}`, log = sessions.get(id) || [];
  for (const [who, said] of [["사용자", body.prompt], [tool === "codex" ? "Codex" : "Claude", body.last_assistant_message]]) {
    if (typeof said === "string" && said.trim()) log.push(`[${who}] ${said.trim()}`);
  }
  if (log.length > 20) log.shift();
  sessions.delete(id); sessions.set(id, log);   // 최근에 쓴 세션을 맨 뒤로
  if (sessions.size > 10) sessions.delete(sessions.keys().next().value);
  const ev = { seq: ++seq, at: Date.now(), kind, tool, project: path.basename(String(body.cwd || "")), work: recent(log) };
  events.push(ev);
  if (events.length > 20) events.shift();
  return ev;
}

async function handle(req, res) {
  if (!allowed(req.headers)) return refuse(res, "이 컴퓨터의 화면에서만 부를 수 있음", 403);
  if (req.method === "GET" && FILES[req.url]) {
    const [file, type] = FILES[req.url];
    res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
    return fs.createReadStream(path.join(__dirname, file)).pipe(res);
  }
  if (req.method === "GET" && req.url.startsWith("/api/events")) {
    const since = Number(new URL(req.url, "http://localhost").searchParams.get("since")) || 0;
    return send(res, 200, { ok: true, latest: seq, events: events.filter((e) => e.seq > since) });
  }
  if (req.method !== "POST") return refuse(res, "없는 주소", 404);
  const body = await readJson(req);
  if (req.url === "/api/event") {
    const ev = body && addEvent(body);
    return ev ? send(res, 200, { ok: true, seq: ev.seq }) : refuse(res, "알 수 없는 알림");
  }
  if (!body || !Nav.filled(body.text)) return refuse(res, "작업 내용이 비어 있음");

  if (req.url === "/api/judge") return ask(res, Nav.judgePrompt(body.text), Nav.JUDGE_SCHEMA, as("judgement", Nav.parseJudgement), "판정");
  if (req.url === "/api/answer") {
    const hard = Array.isArray(body.hard) ? body.hard.map(String) : [];
    if (!Nav.STAGES[body.stage] || !Nav.filled(body.question)) return refuse(res, "질문이 비어 있음");
    return ask(res, Nav.answerPrompt(body.stage, hard, body.question, body.text), Nav.ANSWER_SCHEMA, as("answer", (d) => d.answer), "답");
  }
  // FR-3 설계도 — 설계도를 만드는 단계(1~4)만
  if (req.url === "/api/draft" || req.url === "/api/review") {
    const s = Nav.STAGES[body.stage];
    if (!s || !s.doc) return refuse(res, "설계도를 만드는 단계가 아님");
    if (req.url === "/api/draft") return ask(res, Nav.draftPrompt(s.n, body.text), Nav.DRAFT_SCHEMA, Nav.parseDraft, "초안");
    if (!Nav.filled(body.doc)) return refuse(res, "설계도가 비어 있음");
    return ask(res, Nav.reviewPrompt(s.n, body.text, body.doc), Nav.REVIEW_SCHEMA, as("review", Nav.parseReview), "다시 봐 준 결과의");
  }
  refuse(res, "없는 주소", 404);
}

if (require.main === module) {
  http.createServer(handle).listen(PORT, "127.0.0.1", () => console.log(`Navigator 프로토타입: http://127.0.0.1:${PORT}`));
}
module.exports = { allowed, recent, addEvent };
