// claude-drafted: 2026-10-14
// 로컬 서버 — 화면을 열고, 실제 Claude 판정을 붙인다. **외부 AI 호출은 provider.js 한 곳에서만** 한다(code.md 6번, 테스트로 확인).
//
//   node 03-backend/navigator/server.js   →  http://127.0.0.1:4317
//
// 누구의 것으로 부르는지는 provider.js가 정한다 — 각자 자기 ANTHROPIC_API_KEY, 없으면 이 컴퓨터에 로그인된 Claude Code(`claude -p`).
// claude -p 잠금: 도구 없음, MCP 없음, 사용자 설정 안 읽음, 대화 기록 안 남김 — 입력 글만 판정한다.
// 입력 글은 Claude(AI 서비스)로 전송된다(security-records.md 1절). 서버가 꺼져 있으면 화면은 미리 만든 응답으로 움직인다.
// 사용자 설정을 안 읽으므로(--setting-sources "") 여기서 부르는 claude는 사용자가 단 Navigator 훅을 다시 부르지 않는다.
//
// Claude Code·Codex 연결(connect.js로 훅을 단 경우): hook.js가 /api/event로 "요청 받음(사용자의 요청)·작업 마침(AI의 마지막 답)"을
// 알리면 세션마다 최근 대화를 메모리에만 모아 둔다 — 파일을 읽지도 남기지도 않는다.
// 화면은 /api/events를 2초마다 물어 새 알림을 받는다. 알림만으로는 AI에 보내지 않는다 — 보내는 건 화면에서 사용자가 정한다.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const Nav = require("./navigator.js");
const { callClaude, usage } = require("./provider.js");

const PORT = Number(process.env.NAV_PORT) || 4317;
const MAX_BODY = 40_000;   // 작업 글 + 설계도
const MAX_WORK = 4000;   // 알림 하나에 담는 작업 글 최대 글자 수
const HOOK_KINDS = { UserPromptSubmit: "prompt", Stop: "stop" };

// 정해진 파일만 내준다 — 경로를 요청에서 만들지 않는다. 시연 페이지 전부(내비게이터·서고·공유 시험·입구)를 같이 내준다(2026-10-17 시연 연결).
// 주소는 화면(index.html)의 상대 경로가 서버 기준으로 풀린 모양이다: 내비게이터는 `/`에 있어 `../library/x` → `/library/x`, `../../03-backend/…` → `/03-backend/…`.
//   /                 내비게이터        /index.html         시연 입구(02-frontend/index.html)
//   /library/…  /navigator/…  /share/…   02-frontend의 화면들   /03-backend/…   규칙·공유 규칙
const ROOT = "../../";
const TYPES = { html: "text/html", css: "text/css", js: "text/javascript" };
const STATIC = {
  "02-frontend/navigator": ["index.html", "app.css", "app.js", "seal.js", "tour.js", "tour.css", "library-tab.css"],
  "02-frontend/library": ["index.html", "library.css", "library.js", "books.js", "schedule.js", "skills.js", "search.js", "spotlight.js",
    "sky.html", "sky.css", "sky.js", "knowledge-sky.js", "sky-data.js"],
  "02-frontend/share": ["index.html"],
  "03-backend/navigator": ["navigator.js", "scenario.js"],
  "03-backend/share": ["share-rules.js", "scenarios.js", "environment-checks.js"],
};
const FILES = {};
for (const [dir, names] of Object.entries(STATIC)) for (const f of names) {
  const entry = [`${ROOT}${dir}/${f}`, TYPES[f.split(".").pop()]];
  FILES[`/${dir}/${f}`] = entry;
  if (dir.startsWith("02-frontend/")) FILES[`/${dir.slice("02-frontend/".length)}/${f}`] = entry;   // 화면끼리 `../library/x`처럼 부른다
  if (dir === "02-frontend/navigator") FILES[`/${f}`] = entry;
}
FILES["/"] = FILES["/navigator/index.html"];
FILES["/index.html"] = [`${ROOT}02-frontend/index.html`, TYPES.html];
FILES["/01-docs/04-pattern-implementation/bookmark-constellation-mock.html"] = [`${ROOT}01-docs/04-pattern-implementation/bookmark-constellation-mock.html`, TYPES.html];   // 입구의 설계 목업 링크

// 다른 웹페이지가 내 구독으로 Claude를 부르지 못하게: Host는 이 컴퓨터, Origin은(있으면) 이 서버만.
function allowed(headers, port = PORT) {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!hosts.includes(headers.host)) return false;
  return !headers.origin || hosts.some((h) => headers.origin === `http://${h}`);
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
  if (req.method === "GET" && req.url === "/api/usage") return send(res, 200, { ok: true, ...usage() });   // 어느 공급자·모델·얼마나 썼는지 — 키는 없다
  if (req.method !== "POST") return refuse(res, "없는 주소", 404);
  const body = await readJson(req);
  if (req.url === "/api/event") {
    const ev = body && addEvent(body);
    return ev ? send(res, 200, { ok: true, seq: ev.seq }) : refuse(res, "알 수 없는 알림");
  }
  if (!body || !Nav.filled(body.text)) return refuse(res, "작업 내용이 비어 있음");

  if (req.url === "/api/judge") {
    if (!Number.isInteger(body.stage) || !Nav.STAGES[body.stage]) return refuse(res, "지금 단계가 없음");
    return ask(res, Nav.judgePrompt(body.text, body.stage), Nav.JUDGE_SCHEMA, as("judgement", (d) => Nav.parseJudgement(d, body.text, body.stage)), "판정");
  }
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
  http.createServer(handle).listen(PORT, "127.0.0.1", () => {
    const u = usage();
    console.log(`Floe 시연 화면: http://127.0.0.1:${PORT}`);
    if (u.replay) console.log("AI: 녹화본 재생 — 토큰도 키도 쓰지 않아요 (녹화에 없는 요청은 오류로 알려 줘요)");
    else if (u.record) console.log("AI: 진짜로 부른 답을 녹화하는 중이에요");
    if (!u.replay) console.log(u.provider === "api" ? `AI: 내 API 키(${u.model} · 보내는 곳 ${u.host}${u.compat ? " · 호환 모드" : ""}) — 지금까지 ${u.used.toLocaleString()} 토큰${u.budget ? ` / 한도 ${u.budget.toLocaleString()}` : " (한도 없음 — NAV_TOKEN_BUDGET으로 정할 수 있어요)"}` : "AI: 이 컴퓨터에 로그인된 Claude Code(claude -p) — 내 API 키로 쓰려면 ANTHROPIC_API_KEY를 설정하세요");
  });
}
module.exports = { allowed, recent, addEvent };
