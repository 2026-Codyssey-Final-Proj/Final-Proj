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
//
// 시연 안전장치(2026-10-18, navigator-prototype-rules-review.md 6절 S3~S5) — claude-drafted: 2026-10-18
//   S3 알림 주소(/api/event·/api/events·/api/events/clear)는 확인 값(토큰)이 맞을 때만 받는다. 아래 "확인 값" 참고.
//   S4 받은 알림 글은 저장하기 전에 민감 패턴(sensitive.js)으로 가린다 — 키 모양은 [비밀값], 이메일·전화·IP는 [… 가림].
//   S5 POST /api/events/clear로 알림과 세션 대화를 비운다. 메모리에만 두므로 서버를 다시 켜도 빈다.
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Nav = require("./navigator.js");
const Sensitive = require("./sensitive.js");
const { callClaude, usage, claudeVersion } = require("./provider.js");
const Setup = require("./setup-status.js");   // 처음 설정(GET /api/setup · POST /api/setup/check) — claude-drafted: 2026-10-19

const PORT = Number(process.env.NAV_PORT) || 4317;
const MAX_BODY = 40_000;   // 작업 글 + 설계도
const MAX_WORK = 4000;   // 알림 하나에 담는 작업 글 최대 글자 수
const HOOK_KINDS = { UserPromptSubmit: "prompt", Stop: "stop" };

// ── 확인 값(S3) — claude-drafted: 2026-10-18 ──
// 고른 방식: 서버가 홈 폴더 파일(~/.navigator-event-token, 나만 읽기 600)에 긴 임의 값을 만들어 둔다. 훅(hook.js)은 그 파일을 읽어
// X-Nav-Token 머리글로 보내고, 화면은 서버가 페이지(html)를 줄 때 같이 주는 쿠키로 보낸다 — HttpOnly(스크립트가 못 읽음),
// SameSite=Strict, Path=/api(알림 주소와 AI 주소에 실림 — 2026-10-18 F-04로 /api/events에서 넓힘). 그래서 화면 코드(app.js)는 고치지 않는다: 같은 서버로 부르는 fetch는 쿠키를 저절로 싣는다.
// 다른 방식을 버린 이유: 환경변수로 받으면 훅을 띄우는 Claude Code·Codex에도 같은 값을 넣어야 하고, 페이지 글에 값을 박으면 스크립트가 읽을 수 있다.
// 파일이 있으면 그대로 쓴다 — 서버를 다시 켜도(S5) 열어 둔 화면의 쿠키와 훅이 계속 맞는다. 바꾸려면 파일을 지우고 다시 켠다.
// 쿠키는 포트를 가리지 않아 같은 컴퓨터의 다른 로컬 서버(127.0.0.1:다른 포트)의 /api/events 요청에도 실린다 — 그 서버도 같은 사용자의
// 프로그램이라 이 파일을 읽을 수 있는 쪽이므로 새로 열리는 문은 아니다. 값은 어디에도 출력하지 않는다.
const DEFAULT_TOKEN_FILE = path.join(os.homedir(), ".navigator-event-token");
const TOKEN_FILE = process.env.NAV_EVENT_TOKEN_FILE || DEFAULT_TOKEN_FILE;
const COOKIE = "nav_event_token";
const EVENT_ROUTES = ["/api/event", "/api/events", "/api/events/clear"];
// F-04(이재엽 2026-10-18 "네 주소에도 거름"): AI를 부르는 네 주소도 같은 확인 값 — Origin 검사로는 다른 웹페이지만 막고,
// 같은 컴퓨터의 다른 프로그램(curl 등)은 내 구독으로 AI를 부를 수 있었다(API.md 4절 11번, 위협 표 T2)
// 2026-10-19: 처음 설정의 연결 확인(/api/setup/check)도 AI를 부르므로 같은 확인 값을 건다
const AI_ROUTES = ["/api/judge", "/api/answer", "/api/draft", "/api/review", "/api/setup/check"];
const TOKEN_ROUTES = [...EVENT_ROUTES, ...AI_ROUTES];
const POST_ROUTES = ["/api/event", "/api/judge", "/api/answer", "/api/draft", "/api/review"];   // 본문(JSON)을 읽는 주소 — 이 밖은 본문을 읽기 전에 404
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43,}$/;   // randomBytes(32)의 base64url = 43자

// 있으면 나만 읽게(600) 고친 뒤 읽고, 없거나 모양이 이상하면 새로 만든다. Windows에서는 chmod가 거의 효과가 없다 — 홈 폴더의 기본 권한(그 사용자만)에 기댄다
function eventToken(file = TOKEN_FILE) {
  let t = "";
  try { fs.chmodSync(file, 0o600); t = fs.readFileSync(file, "utf8").trim(); } catch {}
  if (TOKEN_SHAPE.test(t)) return t;
  t = crypto.randomBytes(32).toString("base64url");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.rmSync(file, { force: true });
  fs.writeFileSync(file, `${t}\n`, { mode: 0o600, flag: "wx" });   // 처음부터 600으로 만든다(남이 읽을 수 있는 틈이 없게)
  return t;
}
let token = null;
const theToken = () => (token ??= eventToken());   // 시험이 server.js를 불러오기만 할 때는 파일을 만들지 않는다

const cookieOf = (header, name) => String(header || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);
// 머리글(훅) 또는 쿠키(화면) — 길이가 같을 때만 비교하고, 비교 시간으로 값을 알아낼 수 없게 timingSafeEqual
function hasToken(headers) {
  const got = Buffer.from(String(headers["x-nav-token"] || cookieOf(headers.cookie, COOKIE) || "")), want = Buffer.from(theToken());
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

// 정해진 파일만 내준다 — 경로를 요청에서 만들지 않는다. 시연 페이지 전부(내비게이터·서고·입구)를 같이 내준다(2026-10-17 시연 연결).
// 주소는 화면(index.html)의 상대 경로가 서버 기준으로 풀린 모양이다: 내비게이터는 `/`에 있어 `../library/x` → `/library/x`, `../../03-backend/…` → `/03-backend/…`.
//   /                 내비게이터        /index.html         시연 입구(02-frontend/index.html)
//   /library/…  /navigator/…   02-frontend의 화면들   /03-backend/…   규칙
const ROOT = "../../";
const TYPES = { html: "text/html", css: "text/css", js: "text/javascript" };
const STATIC = {
  // dive.js·dive.css — 내비게이터(`dive.js` → /dive.js)와 서고(`../navigator/dive.js` → /navigator/dive.js)가 같이 쓴다. 2026-10-18까지 빠져 있었다
  // notes.js — 실사용의 '느낀 점 남기기'(2026-10-19)
  // setup.js · setup.css — 처음 켤 때 반기고 연결(Claude Code / API 키)을 돕는 화면(2026-10-19)
  "02-frontend/navigator": ["index.html", "app.css", "app.js", "seal.js", "seal.css", "setup.js", "setup.css", "library-tab.css", "dive.js", "dive.css", "notes.js"],
  // 서재는 용어 풀이(/03-backend/navigator/glossary.js)도 같이 부른다. 2026-10-19(이재엽): learn.js · skills.js를 지우고, 지식 은하(sky.*)는 내주지 않는다(길을 막음 — 파일은 남김)
  // my-books.js — 내 책 · 예시 책 지우기(2026-10-19 실사용). 내비게이터(`../library/my-books.js`)와 서고가 같이 쓴다
  "02-frontend/library": ["index.html", "library.css", "library.js", "books.js", "my-books.js", "schedule.js", "search.js", "spotlight.js"],
  // 모아 보기 창(2026-10-20, C-11 · C-12) — 섬과 따로 뜨는 보통 창. 앱은 서버 주소(/hub/index.html)로 연다
  "02-frontend/hub": ["index.html", "hub.css", "hub.js"],
  // 화면 빈칸(2026-10-18): 용어 풀이 · 확인 질문과 잠시 멈추기 · 꼭/나중에 · 작업 알림 기록 · 만드는 크기. 화면이 부르는 파일은 static-files.test.js가 이 목록과 맞대어 본다
  // steps.js — AI 진행의 줄 글(2026-10-20, C-12). 모아 보기 창이 부른다
  "03-backend/navigator": ["navigator.js", "scenario.js", "glossary.js", "understand.js", "priority.js", "alerts.js", "tiers.js", "token-view.js", "sensitive.js", "steps.js"],
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

// 형식이 틀리거나 끊긴 요청은 null — 끊겨도 기다리던 쪽이 멈춰 있지 않게 close에서도 끝낸다
// 2026-10-18 API 약속(API.md)을 맞추며 고침 — claude-drafted: 2026-10-18
//   글자 단위로 읽는다: 조각(64KB) 경계에 걸린 한글이 깨져 판정 글·녹화 지문이 달라지던 것을 막는다.
//   너무 크면 TOO_BIG(413으로 이유를 알린다): 전에는 연결을 끊어 화면이 "서버를 켜 주세요"로 잘못 안내했다. 넘친 뒤는 쌓지 않고 끝까지 받아 버린다.
const TOO_BIG = Symbol("too big");
function readJson(req) {
  return new Promise((resolve) => {
    let body = "", big = false;
    req.setEncoding("utf8");
    req.on("data", (d) => { if (big) return; body += d; if (body.length > MAX_BODY) { big = true; body = ""; } });
    req.on("end", () => { if (big) return resolve(TOO_BIG); try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    req.on("close", () => resolve(null));
  });
}

const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(obj)); };
const refuse = (res, reason, code = 400) => send(res, code, { ok: false, reason });
const as = (key, read) => (d) => { const v = read(d); return v && { [key]: v }; };   // 확인한 결과를 화면이 읽는 칸 이름으로
const stageOf = (v) => (Number.isInteger(v) ? Nav.STAGES[v] : undefined);   // 단계는 정수 0~7만 — "2"·"length" 같은 글자는 단계가 아니다

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
  // S4: 저장하기 전에 가린다 — 메모리의 대화에도, 화면에 줄 글에도 원래 값이 남지 않는다(자르기 전에 가려서 키가 반쯤 남지 않는다)
  for (const [who, said] of [["사용자", body.prompt], [tool === "codex" ? "Codex" : "Claude", body.last_assistant_message]]) {
    if (typeof said === "string" && said.trim()) log.push(`[${who}] ${Sensitive.redact(said.trim())}`);
  }
  while (log.length > 20) log.shift();   // 한 알림에 두 말이 오면 둘 다 넘칠 수 있다
  sessions.delete(id); sessions.set(id, log);   // 최근에 쓴 세션을 맨 뒤로
  if (sessions.size > 10) sessions.delete(sessions.keys().next().value);
  const ev = { seq: ++seq, at: Date.now(), kind, tool, project: Sensitive.redact(path.basename(String(body.cwd || ""))), work: recent(log) };
  events.push(ev);
  if (events.length > 20) events.shift();
  return ev;
}
// S5: 알림과 세션 대화를 비운다. 번호(seq)는 되돌리지 않는다 — 열어 둔 화면은 since=마지막 번호로 묻기 때문에 되돌리면 새 알림을 놓친다
function clearEvents() {
  const n = events.length;
  events.length = 0;
  sessions.clear();
  return n;
}

// ── 처음 설정 — claude-drafted: 2026-10-19 ──
// claude 명령은 묻는 데 시간이 들어(--version) 10초 동안은 지난 답을 쓴다. 지문(build)은 화면 · 서버 파일이 바뀌지 않는 한 같아서 한 번만 센다
let claudeSeen = { at: 0, info: null, login: null }, buildMemo = "";
function build() {
  return (buildMemo ||= Setup.buildId([...Object.values(FILES).map(([f]) => path.join(__dirname, f)), __filename,
    path.join(__dirname, "provider.js"), path.join(__dirname, "setup-status.js")]));
}
function setupNow() {
  if (!claudeSeen.info || Date.now() - claudeSeen.at > 10_000) claudeSeen = { at: Date.now(), info: claudeVersion(), login: Setup.signedIn() };
  return Setup.status(process.env, { claude: claudeSeen.info, login: claudeSeen.login, build: build() });
}
// 연결 확인 — 아주 작은 요청 하나. 재생 중이면 부르지 않고 그렇다고 알린다
async function checkAi(res) {
  const provider = Setup.providerOf(process.env);
  if (process.env.NAV_REPLAY) return send(res, 200, { ok: true, provider, replay: true, tokens: 0 });
  const r = await callClaude(Setup.CHECK_PROMPT, Setup.CHECK_SCHEMA);
  if (r.data && r.data.ok === true) return send(res, 200, { ok: true, provider, tokens: r.tokens || 0 });
  return refuse(res, r.error || "답의 모양이 맞지 않음", 502);
}

async function handle(req, res) {
  if (!allowed(req.headers)) return refuse(res, "이 컴퓨터의 화면에서만 부를 수 있음", 403);
  if (req.method === "GET" && FILES[req.url]) {
    const [file, type] = FILES[req.url];
    const head = { "Content-Type": `${type}; charset=utf-8` };
    // S3: 페이지(html)를 줄 때 확인 값 쿠키를 같이 준다. 캐시에서 다시 꺼낸 페이지는 쿠키를 다시 못 주므로 저장하지 않게 한다
    if (type === TYPES.html) Object.assign(head, { "Set-Cookie": `${COOKIE}=${theToken()}; Path=/api; HttpOnly; SameSite=Strict`, "Cache-Control": "no-store" });
    // 스크립트 · 스타일은 늘 서버에 다시 묻는다 — 앱(Electron) · 브라우저가 고친 뒤에도 옛 파일을 꺼내 쓰지 않게(2026-10-19)
    else head["Cache-Control"] = "no-cache";
    res.writeHead(200, head);
    return fs.createReadStream(path.join(__dirname, file)).pipe(res);
  }
  const route = req.url.split("?")[0];
  if (TOKEN_ROUTES.includes(route) && !hasToken(req.headers)) return refuse(res, "확인 값이 없거나 맞지 않음 — 화면은 서버 주소로 다시 열고, 훅은 서버를 켠 뒤 다시 보내요", 403);   // S3: 본문을 읽기 전에
  if (req.method === "GET" && route === "/api/events") {
    const since = Number(new URL(req.url, "http://localhost").searchParams.get("since")) || 0;
    return send(res, 200, { ok: true, latest: seq, events: events.filter((e) => e.seq > since) });
  }
  if (req.method === "POST" && route === "/api/events/clear") return send(res, 200, { ok: true, cleared: clearEvents() });   // S5
  if (req.method === "GET" && route === "/api/usage") return send(res, 200, { ok: true, ...usage() });   // 어느 공급자·모델·얼마나 썼는지 — 키는 없다
  if (req.method === "GET" && route === "/api/setup") return send(res, 200, { ok: true, ...setupNow() });   // 처음 설정 — 있다 · 없다만(API.md 3-10)
  if (req.method === "POST" && route === "/api/setup/check") return checkAi(res);   // 연결 확인(API.md 3-11) — 본문 없음
  if (req.method !== "POST" || !POST_ROUTES.includes(route)) return refuse(res, "없는 주소", 404);   // 본문을 읽기 전에(전에는 빈 본문이면 400이었다)
  const body = await readJson(req);
  if (body === TOO_BIG) return refuse(res, `보낸 글이 너무 김 — ${MAX_BODY.toLocaleString()}자까지`, 413);
  if (route === "/api/event") {
    const ev = body && addEvent(body);
    return ev ? send(res, 200, { ok: true, seq: ev.seq }) : refuse(res, "알 수 없는 알림");
  }
  if (!body || !Nav.filled(body.text)) return refuse(res, "작업 내용이 비어 있음");
  // 규모 등급 — 안 보내면 Full(navigator.js). 보냈는데 Full·Xpress·Lite가 아니면 거절한다(즉시 처리는 밟을 단계가 없다)
  const { tier } = body;
  if (tier != null && !Nav.TIERS.includes(tier)) return refuse(res, "모르는 등급");

  if (route === "/api/judge") {
    if (!stageOf(body.stage)) return refuse(res, "지금 단계가 없음");
    return ask(res, Nav.judgePrompt(body.text, body.stage, tier), Nav.JUDGE_SCHEMA, as("judgement", (d) => Nav.parseJudgement(d, body.text, body.stage, tier)), "판정");
  }
  if (route === "/api/answer") {
    const hard = Array.isArray(body.hard) ? body.hard.map(String) : [];
    if (!stageOf(body.stage)) return refuse(res, "지금 단계가 없음");   // 전에는 STAGES["length"]도 통과해 "undefined단계"로 AI를 불렀다
    if (!Nav.filled(body.question)) return refuse(res, "질문이 비어 있음");
    return ask(res, Nav.answerPrompt(body.stage, hard, body.question, body.text), Nav.ANSWER_SCHEMA, as("answer", (d) => (Nav.filled(d.answer) ? d.answer : null)), "답");   // 다른 답처럼 모양을 본다(호환 모드는 스키마를 강제하지 않는다)
  }
  // FR-3 설계도 — 설계도를 만드는 단계(1~4)만. 남은 주소는 /api/draft와 /api/review뿐이다(POST_ROUTES)
  const s = stageOf(body.stage);
  if (!s || !s.doc) return refuse(res, "설계도를 만드는 단계가 아님");
  if (route === "/api/draft") return ask(res, Nav.draftPrompt(s.n, body.text, tier), Nav.DRAFT_SCHEMA, Nav.parseDraft, "초안");
  if (!Nav.filled(body.doc)) return refuse(res, "설계도가 비어 있음");
  return ask(res, Nav.reviewPrompt(s.n, body.text, body.doc, tier), Nav.REVIEW_SCHEMA, as("review", Nav.parseReview), "다시 봐 준 결과의");
}

if (require.main === module) {
  theToken();   // 켜자마자 만든다 — 화면을 열기 전에 온 훅 알림도 받게. 값은 출력하지 않는다
  http.createServer(handle).listen(PORT, "127.0.0.1", () => {
    const u = usage();
    console.log(`Floe 시연 화면: http://127.0.0.1:${PORT}`);
    console.log(`알림 확인 값: ${TOKEN_FILE} (나만 읽기 — 값은 보여 주지 않아요. 기록 비우기: 서버를 다시 켜거나 README "시연 전 한 줄 점검")`);
    if (u.replay) console.log("AI: 녹화본 재생 — 토큰도 키도 쓰지 않아요 (녹화에 없는 요청은 오류로 알려 줘요)");
    else if (u.record) console.log("AI: 진짜로 부른 답을 녹화하는 중이에요");
    if (!u.replay) console.log(u.provider === "api" ? `AI: 내 API 키(${u.model} · 보내는 곳 ${u.host}${u.compat ? " · 호환 모드" : ""}) — 지금까지 ${u.used.toLocaleString()} 토큰${u.budget ? ` / 한도 ${u.budget.toLocaleString()}` : " (한도 없음 — NAV_TOKEN_BUDGET으로 정할 수 있어요)"}` : "AI: 이 컴퓨터에 로그인된 Claude Code(claude -p) — 내 API 키로 쓰려면 ANTHROPIC_API_KEY를 설정하세요");
  });
}
module.exports = { allowed, recent, addEvent, clearEvents, handle, eventToken, build, TOKEN_FILE, DEFAULT_TOKEN_FILE, FILES };
