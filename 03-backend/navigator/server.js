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
//
// AI 진행(C-12, claude-drafted: 2026-10-20 — 이재엽 "이건 바이브 코딩이 아니야"): 도구를 쓴 뒤(PostToolUse) hook.js가 보낸 한 일(말 · 이름이나 첫 줄 · 줄 수)을
//   세션별로 메모리에만 모은다(50줄 · 세션 10개) — 알림 목록과 섞지 않고, 판정을 부르지 않고, 토큰을 쓰지 않는다. 화면은 GET /api/steps?since=로 본다. S4 가림 · S5 비우기가 같이 적용된다.
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Nav = require("./navigator.js");
const Sensitive = require("./sensitive.js");
const Steps = require("./steps.js");   // AI 진행(C-12) — 한 일의 말 · 80자 — claude-drafted: 2026-10-20
const AP = require("./approve.js");    // FR-17 승인 카드의 모양(2026-10-20)
const { callClaude, usage, claudeVersion, startTask: openClaude, ledger } = require("./provider.js");   // openClaude — FR-17 넘긴 일로 claude를 연다(외부 AI 호출은 provider.js 한 곳, code.md 6번) · ledger — 토큰 장부(2026-10-24, tokens.js)
const Files = require("./files.js");
const Project = require("./project.js");   // runCommand — 바뀐 줄을 git diff로(C-43, 읽기만)
const Docmap = require("./docmap.js");
const Presets = require("./presets.js");   // C-44 맡기기 틀 — 번호로 받은 파일을 raw 경로로 바꿔 Claude Code에 넘긴다(화면은 경로를 보내지 않는다) — claude-drafted: 2026-10-27   // C-45 문서 지도 — 문서와 링크를 보드 데이터로(읽기만) — claude-drafted: 2026-10-27   // C-42 R-8 작업실 파일 칸 — 연결한 폴더의 이름만(읽기만, 2026-10-27) — claude-drafted: 2026-10-27
const RB = require("./readme-book.js");   // C-26 내 작업 책 — README를 책으로 나눈다(읽기만) — claude-drafted: 2026-10-23
const GH = require("./github.js");   // 설정의 GitHub 칸(C-25, 2026-10-24) — git · gh에게 읽기만 묻는다 — claude-drafted: 2026-10-24
const Docs = require("./docs.js");   // C-37 단계 문서 — 단계 결과로 사용자 저장소에 둘 파일(순수 함수) — claude-drafted: 2026-10-25
const Setup = require("./setup-status.js");   // 처음 설정(GET /api/setup · POST /api/setup/check) — claude-drafted: 2026-10-19
const Mcp = require("./mcp.js");   // C-38 시험판 — MCP(웹 GPT · 웹 Claude · Claude Desktop)의 규칙. 이 컴퓨터 안에서는 늘, 밖(터널)에서는 NAV_MCP=1일 때만 /mcp/<토큰>을 받는다 — claude-drafted: 2026-10-25
const AppLink = require("./app-link.js");   // C-38 시험판 '같이 쓸 앱' — Claude Desktop 설정 파일에 Floe를 잇는다(GET /api/apps · POST /api/apps/link) — claude-drafted: 2026-10-25

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
const EVENT_ROUTES = ["/api/event", "/api/events", "/api/events/clear", "/api/steps"];   // /api/steps — AI 진행(C-12, 2026-10-20)
// F-04(이재엽 2026-10-18 "네 주소에도 거름"): AI를 부르는 네 주소도 같은 확인 값 — Origin 검사로는 다른 웹페이지만 막고,
// 같은 컴퓨터의 다른 프로그램(curl 등)은 내 구독으로 AI를 부를 수 있었다(API.md 4절 11번, 위협 표 T2)
// 2026-10-19: 처음 설정의 연결 확인(/api/setup/check)도 AI를 부르므로 같은 확인 값을 건다
const AI_ROUTES = ["/api/judge", "/api/answer", "/api/draft", "/api/review", "/api/setup/check", "/api/task/tidy", "/api/quest", "/api/plan", "/api/start", "/api/stagedraft"];   // /api/stagedraft — C-37 2단계 초안(2026-10-25) · /api/start — C-36 처음 한 바퀴의 1단계 초안(2026-10-25) · /api/plan — C-34 준비 계획판(2026-10-24)   // /api/task/tidy — FR-17 요구 문장 정리(2026-10-20), /api/quest — C-22 퀘스트 제작(2026-10-21)
// FR-17(2026-10-20): 승인(훅이 보내고 기다림 · 섬이 보고 누름)과 일 넘기기 — 모두 확인 값. 폴더 경로는 섬에 주지 않고, claude는 훅이 알려 준 폴더에서만 연다
const APPROVE_ROUTES = ["/api/approval", "/api/approvals", "/api/approvals/decide", "/api/task", "/api/task/start"];
// C-26(2026-10-23): 내 작업 책 — 연결한 폴더의 README를 읽어 준다. 폴더 이름 · 글이 나가므로 확인 값을 건다
const BOOK_ROUTES = ["/api/readme", "/api/files", "/api/file", "/api/docmap", "/api/preset", "/api/github", "/api/github/create", "/api/docs"];   // /api/file — C-43 파일 보기 · 고치기(2026-10-27): 목록의 번호로 열고 쓴다   // /api/files — C-42 R-8 작업실 파일 칸: 연결한 폴더의 파일 · 폴더 이름만(2026-10-27)   // /api/docs — C-37 단계 문서를 작업 폴더에 쓰고 커밋 · 푸시를 Claude Code에(2026-10-25)   // /api/github — 설정의 GitHub 칸(C-25, 2026-10-24): 폴더 이름 · 저장소 이름이 나가고, create는 Claude Code를 연다
const USAGE_ROUTES = ["/api/usage/reset"];   // 토큰 장부 새로 재기(2026-10-24) — 장부를 지우므로 확인 값. 읽기(GET /api/usage)는 전처럼 숫자만
const MCP_LOCAL_ROUTES = ["/api/state", "/api/proposals", "/api/proposals/decide", "/api/apps/link"];   // C-38 시험판(2026-10-25) — 화면이 상태를 보내고 웹 AI의 제안을 본다 · Claude Desktop 설정 파일에 잇는다. 밖(터널)에서는 받지 않는다(allowed)
const TOKEN_ROUTES = [...EVENT_ROUTES, ...AI_ROUTES, ...APPROVE_ROUTES, ...BOOK_ROUTES, ...USAGE_ROUTES, ...MCP_LOCAL_ROUTES];
const POST_ROUTES = ["/api/file", "/api/preset", "/api/event", "/api/judge", "/api/answer", "/api/draft", "/api/review", "/api/approval", "/api/approvals/decide", "/api/task/tidy", "/api/task/start", "/api/quest", "/api/github/create", "/api/plan", "/api/start", "/api/stagedraft", "/api/docs", "/api/state", "/api/proposals/decide", "/api/apps/link"];   // 본문(JSON)을 읽는 주소 — 이 밖은 본문을 읽기 전에 404
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

// ── C-38 시험판 — MCP(Claude Desktop은 이 컴퓨터 안에서, 웹 GPT · 웹 Claude는 터널로) — claude-drafted: 2026-10-25 (두승현 "이 브랜치에서 시험용으로 만들자" · "같이 쓸 앱으로 연결으로 해줘") ──
// /mcp/<MCP 토큰>은 이 컴퓨터 안(Claude Desktop의 중계 파일 mcp-stdio.js)에서는 늘 받고, 밖(Host가 터널)에서는 NAV_MCP=1일 때만 받는다. 나머지 주소는 지금처럼 allowed()가 막는다.
// MCP 토큰은 알림 확인 값과 따로(~/.floe-mcp-token, 나만 읽기) — 웹 AI의 설정 화면에 주소째 붙여 넣는 값이라, 새로 만들려면 파일을 지우고 다시 켠다.
// 화면이 보낸 상태(POST /api/state)와 AI의 제안(floe_start · floe_report)은 메모리에만 — 서버를 다시 켜면 빈다. 제안은 섬에서 사람이 정해야 시작되거나 적힌다
const MCP_TOKEN_FILE = process.env.NAV_MCP_TOKEN_FILE || path.join(os.homedir(), ".floe-mcp-token");
const mcpOn = () => process.env.NAV_MCP === "1";
let mcpTok = null;
const mcpToken = () => (mcpTok ??= eventToken(MCP_TOKEN_FILE));
const sameToken = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
let floeState = null;   // 화면이 보낸 지금 상태(Mcp.cleanState)
const proposals = [], MAX_PROPOSALS = 20;
const mcpCtx = { state: () => floeState, propose: (p) => { const item = { id: crypto.randomBytes(8).toString("hex"), at: Date.now(), ...p }; proposals.push(item); while (proposals.length > MAX_PROPOSALS) proposals.shift(); return item; } };
async function mcpRoute(req, res) {
  const tok = req.url.split("?")[0].slice("/mcp/".length);
  if (!sameToken(tok, mcpToken()) || (!mcpOn() && !allowed(req.headers))) return refuse(res, "없는 주소", 404);   // 토큰이 틀리거나, 밖(터널)인데 NAV_MCP가 꺼져 있으면 있는지조차 알리지 않는다. 이 컴퓨터 안(Claude Desktop의 중계 파일)은 늘
  if (req.method !== "POST") { res.writeHead(405, { Allow: "POST" }); return res.end(); }   // SSE(GET)는 열지 않는다
  const body = await readJson(req);
  if (body === TOO_BIG) return send(res, 413, { jsonrpc: "2.0", id: null, error: { code: -32600, message: "보낸 글이 너무 김" } });
  if (body === null) return send(res, 400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON이 아님" } });
  const out = Array.isArray(body) ? body.map((m) => Mcp.rpc(m, mcpCtx)).filter(Boolean) : Mcp.rpc(body, mcpCtx);
  if (!out || (Array.isArray(out) && !out.length)) { res.writeHead(202); return res.end(); }   // 알림뿐이면 답 없이 202
  return send(res, 200, out);
}

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
  // greet.js — 켤 때 인사의 시간표(C-10, 2026-10-20)
  // canvas-pan.js — 작업실 캔버스를 끌어서 옮기고 크게 · 작게(F-66, 2026-10-27)
  // morph.js — 섬의 움직임 규칙(C-14, 2026-10-20). 내비게이터는 hub.js(순수 함수) · steps.js도 부른다(C-13 기본 화면)
  "02-frontend/navigator": ["index.html", "app.css", "app.js", "seal.js", "seal.css", "setup.js", "setup.css", "library-tab.css", "dive.js", "dive.css", "notes.js", "greet.js", "morph.js", "win.html", "win.js", "docmap.html", "canvas-pan.js"],   // docmap.html — 문서 지도(C-45, 2026-10-27)
  "03-backend/navigator/board": ["board.js", "board.css"],   // archi-board 엔진 v1 사본(C-45) — docmap.html이 부른다   // win.html · win.js — 앱의 설정 창 · 퀘스트 창(C-22, 2026-10-21)
  // 서재는 용어 풀이(/03-backend/navigator/glossary.js)도 같이 부른다. 2026-10-19(이재엽): learn.js · skills.js를 지우고, 지식 은하(sky.*)는 내주지 않는다(길을 막음 — 파일은 남김)
  // my-books.js — 내 책 · 예시 책 지우기(2026-10-19 실사용). 내비게이터(`../library/my-books.js`)와 서고가 같이 쓴다
  // book-view.js · book-view.css — 책 보기 설정(C-9 · C-3, 2026-10-20). 내비게이터(`../library/book-view.js`)와 서고가 같이 쓴다
  // shelves.js — 내가 만드는 책장(C-21, 2026-10-20)
  "02-frontend/library": ["index.html", "library.css", "library.js", "books.js", "my-books.js", "book-view.js", "book-view.css", "shelves.js", "schedule.js", "search.js", "spotlight.js"],
  // hub.js — 섬의 알림 · AI 진행 판이 쓰는 순수 함수. 따로 뜨던 모아 보기 창(index.html · hub.css)은 2026-10-23에 뺐다
  "02-frontend/hub": ["hub.js"],
  // 화면 빈칸(2026-10-18): 용어 풀이 · 확인 질문과 잠시 멈추기 · 꼭/나중에 · 작업 알림 기록 · 만드는 크기. 화면이 부르는 파일은 static-files.test.js가 이 목록과 맞대어 본다
  // steps.js — AI 진행(C-12, 2026-10-20): 섬(내비게이터)이 `../../03-backend/navigator/steps.js`로 부른다(한 줄 글 · 서버 없이 보일 예시)
  // approve.js — 승인 카드(FR-17, 2026-10-20): 섬이 서버 없이 보일 예시 카드와 모양을 읽는다
  "03-backend/navigator": ["navigator.js", "scenario.js", "glossary.js", "understand.js", "priority.js", "alerts.js", "tiers.js", "token-view.js", "sensitive.js", "steps.js", "feed.js", "approve.js", "quest.js", "readme-book.js", "md-view.js", "stagemap.js", "presets.js", "tutorial.js", "plan.js", "docs.js"],   // plan.js — 준비 계획판 규칙(C-34, 2026-10-24)   // quest.js — 퀘스트 규칙(C-22, 2026-10-21)
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
function readJson(req, limit = MAX_BODY) {   // limit — 파일 저장(/api/file)은 글 파일 크기만큼(C-43)
  return new Promise((resolve) => {
    let body = "", big = false;
    req.setEncoding("utf8");
    req.on("data", (d) => { if (big) return; body += d; if (body.length > limit) { big = true; body = ""; } });
    req.on("end", () => { if (big) return resolve(TOO_BIG); try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    req.on("close", () => resolve(null));
  });
}

const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(obj)); };
const refuse = (res, reason, code = 400) => send(res, code, { ok: false, reason });
const as = (key, read) => (d) => { const v = read(d); return v && { [key]: v }; };   // 확인한 결과를 화면이 읽는 칸 이름으로
const stageOf = (v) => (Number.isInteger(v) ? Nav.STAGES[v] : undefined);   // 단계는 정수 0~7만 — "2"·"length" 같은 글자는 단계가 아니다

// Claude에게 묻고, 답의 모양을 확인한 것만 돌려준다. read: 확인해서 화면에 줄 칸들을 만든다(모양이 틀리면 null)
// 장부(tokens.js)에 남길 이름 — 실패 문구의 what을 짧은 말로
const LEDGER_LABEL = { "다시 봐 준 결과의": "다시 봐 주기" };
// meta — 초안은 빠른 모델로(C-40, provider.js FAST: fast · 예시 셋이라 글 길이 maxTokens)
async function ask(res, prompt, schema, read, what, meta = {}) {
  const r = await callClaude(prompt, schema, { label: LEDGER_LABEL[what] || what, ...meta });
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

// ── AI 진행(C-12) — 도구를 쓴 뒤 한 일을 세션별로, 메모리에만 — claude-drafted: 2026-10-20 ──
// 알림(events · sessions)과 따로 둔다: 알림 목록에 섞이지 않고, 판정을 부르지 않는다. 번호(stepSeq)도 알림 번호(seq)와 따로 센다 — /api/events의 latest가 한 일 때문에 늘지 않게
const MAX_STEPS = 50, MAX_WORK_SESSIONS = 10;   // 세션마다 최근 50줄 · 세션 10개 [제안 2026-10-20]
const work = new Map();   // id → {id, project, tool, state, at, steps[]} — 최근에 쓴 세션이 맨 뒤
let stepSeq = 0;
const VERB_OK = new Set(Object.values(Steps.VERBS));
const count = (v) => (Number.isInteger(v) && v > 0 ? v : 0);
const cut = (t) => (t.length > Steps.MAX ? `${t.slice(0, Steps.MAX - 1)}…` : t);
// 세션 표의 한 줄 — 없으면 만들고, 최근에 쓴 것을 맨 뒤로. 작업 폴더 이름은 가린다(S4)
function workSession(body, tool) {
  const id = `${tool}:${String(body.session_id || "")}`;
  const s = work.get(id) || { id, project: "", tool, state: "", at: 0, steps: [], dir: "" };
  s.project = Sensitive.redact(path.basename(String(body.cwd || ""))) || s.project;
  s.dir = String(body.cwd || "") || s.dir;   // FR-17 일 넘기기가 claude를 열 폴더 — 서버 메모리에만, 화면에는 주지 않는다(stepsSince가 뺀다)
  s.at = Date.now();
  work.delete(id); work.set(id, s);
  if (work.size > MAX_WORK_SESSIONS) work.delete(work.keys().next().value);
  return s;
}
// 훅이 보낸 step {verb, what, add, del}을 확인해서 쌓는다 — 말은 표의 값만, what은 가린 뒤 80자까지(비면 도구 이름), 줄 수는 0 이상 정수만. 그 밖의 칸은 버린다
function addStep(body, tool) {
  const s = workSession(body, tool);
  const raw = body.step && typeof body.step === "object" ? body.step : {};
  const what = typeof raw.what === "string" && raw.what.trim() ? raw.what.trim() : typeof body.tool_name === "string" ? body.tool_name.trim() : "";
  s.steps.push({ seq: ++stepSeq, at: Date.now(), verb: VERB_OK.has(raw.verb) ? raw.verb : Steps.OTHER, what: cut(Sensitive.redact(what)), add: count(raw.add), del: count(raw.del) });
  while (s.steps.length > MAX_STEPS) s.steps.shift();
  return { seq: stepSeq };
}
// 화면이 묻는 모양 — since보다 뒤의 한 일만, 세션은 최근 쓴 순
const stepsSince = (since) => ({ latest: stepSeq, sessions: [...work.values()].reverse().map(({ dir, ...s }) => ({ ...s, steps: s.steps.filter((st) => st.seq > since) })) });

// ── FR-17 섬에서 허용 · 거절 — claude-drafted: 2026-10-20 (이재엽 버튼 "섬에서 진짜 승인", 넘김 문서 c4-views 2절 ② · 3절) ──
// 훅(approve-hook.js)이 POST /api/approval로 승인 카드를 보내고 **답을 기다린다**(길게 여는 요청). 섬은 GET /api/approvals로 보고 POST /api/approvals/decide로 누른다.
// 결정은 그 요청(id · sig)과 짝이 맞을 때만 — 늦은 결정(404) · 다른 요청의 결정(409)은 버린다. 되돌리기 어려운 일(card.danger)은 sure:true가 있어야 허용(409로 한 번 더 묻는다).
// 아무도 누르지 않으면 APPROVAL_WAIT 뒤 none — 훅은 아무것도 출력하지 않아 Claude Code가 스스로 묻는다. **대신 허용하는 길이 없다.** 카드는 메모리에만, 결정하면 지운다(바뀔 내용을 저장 · 전송하지 않는다)
const APPROVAL_WAIT = Math.max(100, Number(process.env.NAV_APPROVAL_WAIT) || 90_000), MAX_PENDING = 20;   // [제안 2026-10-20] — 훅의 기다림(95초)보다 짧게
const pending = new Map();   // id → {item, res, timer}
const ID_SHAPE = /^[A-Za-z0-9_-]{8,64}$/, SIG_SHAPE = /^[0-9a-f]{64}$/, KINDS = new Set(["edit", "write", "run", "other"]);
const cutTo = (t, n) => { const s = Sensitive.redact(String(t)); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
// 훅이 보낸 카드를 믿지 않는다 — 칸마다 모양을 보고, 가리고, 자른다(S4). 모양이 아니면 null
function cleanCard(c) {
  if (!c || typeof c !== "object" || !Array.isArray(c.lines)) return null;
  return { tool_name: cutTo(c.tool_name || "", 40), verb: cutTo(c.verb || "", 20), what: cutTo(c.what || "", 200), kind: KINDS.has(c.kind) ? c.kind : "other",
    danger: cutTo(c.danger || "", 120), lines: c.lines.slice(0, 40).map((l) => cutTo(typeof l === "string" ? l : "", 200)) };
}
// 승인 요청 하나를 기다리는 표에 넣고 답을 붙들어 둔다. 돌려주는 것: 거절 이유(글) 또는 ""(붙들었다)
function holdApproval(body, req, res) {
  if (!body || typeof body !== "object" || !ID_SHAPE.test(String(body.id)) || !SIG_SHAPE.test(String(body.sig))) return "승인 요청 모양이 아님";
  const card = cleanCard(body.card);
  if (!card) return "승인 요청 모양이 아님 — card가 없음";
  if (pending.size >= MAX_PENDING) return "기다리는 승인 요청이 너무 많음";
  const id = String(body.id);
  const item = { id, sig: String(body.sig), at: Date.now(), project: Sensitive.redact(path.basename(String(body.cwd || ""))), tool: body.tool === "codex" ? "codex" : "claude", tool_name: card.tool_name, card };
  const finish = (decision) => { const p = pending.get(id); if (!p) return; pending.delete(id); clearTimeout(p.timer); send(p.res, 200, { ok: true, id, decision }); };
  pending.set(id, { item, res, timer: setTimeout(() => finish("none"), APPROVAL_WAIT), finish });
  req.on("close", () => { const p = pending.get(id); if (p && p.res === res) { pending.delete(id); clearTimeout(p.timer); } });   // 훅이 먼저 끊으면(시간 초과) 표에서 뺀다
  return "";
}
const listApprovals = () => ({ items: [...pending.values()].map((p) => p.item) });
// 섬이 누른 결정 — [상태 코드, 답]
function decideApproval(body) {
  const b = body && typeof body === "object" ? body : {};
  const p = pending.get(String(b.id));
  if (!p) return [404, { ok: false, reason: "기다리는 요청이 아님 — 늦었거나 이미 정해졌어요" }];
  if (String(b.sig) !== p.item.sig) return [409, { ok: false, reason: "결정이 요청과 짝이 맞지 않음 — 버렸어요" }];
  if (b.decision !== "allow" && b.decision !== "deny") return [400, { ok: false, reason: "decision은 allow 또는 deny" }];
  if (b.decision === "allow" && p.item.card.danger && b.sure !== true) return [409, { ok: false, reason: `되돌리기 어려운 일이에요 — ${p.item.card.danger}. 한 번 더 확인(sure)해 주세요` }];
  p.finish(b.decision);
  return [200, { ok: true, id: p.item.id, decision: b.decision }];
}
function clearApprovals() { for (const p of [...pending.values()]) p.finish("none"); }

// ── 작업 폴더 — C-31 시작하는 자리(2026-10-24, 이재엽 "C-31부터") · F-49(플로로가 프로젝트를 몰랐다) ──
// 전에는 훅 알림의 cwd로만 알았다 — 클론한 폴더를 연결만 하고 Claude Code를 그 폴더에서 열지 않으면 Floe는 그 프로젝트를 몰랐다.
// 이제 앱(Electron main.js)이 처음 설정 · 메뉴에서 고른 폴더를 **같은 프로세스에서** 알려 준다(useProject — HTTP 주소는 없다: 화면 · 다른 프로그램이 경로를 넣지 못하게).
// 앱이 정한 폴더가 있으면 그것이 먼저(사용자가 앱에서 고른 '플로로가 움직이는 자리'), 없으면 전처럼 가장 최근 훅 알림의 폴더. 경로는 서버 메모리에만 — 답에는 이름만
let appProject = null;   // { dir, project, at }
function useProject(dir) {
  const d = typeof dir === "string" ? dir : "";
  if (!d || !path.isAbsolute(d)) return false;
  try { if (!fs.statSync(d).isDirectory()) return false; } catch { return false; }
  appProject = { dir: d, project: Sensitive.redact(path.basename(d)), at: Date.now() };
  return true;
}
// 연결을 뺀 폴더는 잊는다(앱 main.js의 '연결 빼기') — 앱이 고른 폴더든, 훅 알림으로 안 폴더든(맡긴 일이 그 폴더에서 돌면 훅 알림이 쌓인다).
// AI 진행의 세션 줄은 남기고 그 폴더(dir)만 비운다 — 훅이 빠진 폴더에서 맡긴 일이 허락 카드 없이 멈추지 않게
function dropProject(dir) {
  const d = path.resolve(String(dir || ""));
  let hit = false;
  if (appProject && path.resolve(appProject.dir) === d) { appProject = null; hit = true; }
  for (const s of work.values()) if (s.dir && path.isAbsolute(s.dir) && path.resolve(s.dir) === d) { s.dir = ""; hit = true; }
  return hit;
}
const projectNow = () => appProject || [...work.values()].reverse().find((x) => x.dir && path.isAbsolute(x.dir)) || null;

// ── FR-17 대화로 일 넘기기 — 허락하면 연결한 폴더에서 claude를 연다(셸 없이, -p, 글은 표준 입력으로). 권한 건너뛰기 옵션은 쓰지 않는다 — 허락은 섬의 승인 카드(위)로 ──
// 폴더는 projectNow(앱이 고른 작업 폴더, 없으면 훅 알림의 cwd)에서만 고른다(화면이 보낸 경로는 받지 않는다). 한 번에 하나. 여는 법은 provider.js startTask(셸 없음 · -p · 표준 입력 · 권한 건너뛰기 없음)
const TASK_MAX = 4000;
let task = null;   // {state: running|done|failed, project, at, code, child, tokens, cost, report}
// tokens · cost — 끝났을 때 Claude Code가 알려 준 이번 일의 토큰 · 비용(토큰 장부, 2026-10-24). 모르면 null
// report — 기준(checks)을 같이 넘겼으면 Claude Code가 끝에 답한 기준마다 해냄 · 근거 · 쉬운 말 요약(C-32, navigator.js parseReport). 비밀값 모양은 가린다. 서버 메모리에만
const publicTask = () => (task ? { state: task.state, project: task.project, at: task.at, code: task.code, tokens: task.tokens ?? null, cost: task.cost ?? null, report: task.report ?? null } : null);
// 경로도 가린다(2026-10-24 리뷰) — 작업 폴더 앞부분은 '.'으로, 홈 폴더(/Users/이름 · /home/이름 · C:\Users\이름)는 '~'로. 보고는 화면에 보이고 이 컴퓨터의 브라우저 저장소에도 남는다
const hidePaths = (t, dir) => (dir ? String(t).split(dir).join(".") : String(t)).replace(/\/(?:Users|home)\/[^/\s]+/g, "~").replace(/[A-Za-z]:\\Users\\[^\\\s]+/gi, "~");
const hide = (t, dir) => Sensitive.redact(hidePaths(t, dir));
const hideReport = (r, dir) => (r ? { ...r, easy: hide(r.easy, dir), ask: hide(r.ask, dir), items: r.items.map((x) => ({ ...x, evidence: hide(x.evidence, dir) })) } : null);
const CHECK_LINE_MAX = 200;
// 기준 목록이 맞는 모양인가 — 1~12줄 · 글 · 한 줄 200자. 맞으면 다듬은 목록, 아니면 null
const checksOf = (c) => (Array.isArray(c) && c.length >= 1 && c.length <= Nav.CHECKS_MAX && c.every((x) => Nav.filled(x) && x.length <= CHECK_LINE_MAX) ? c.map((x) => x.trim()) : null);
const NO_FOLDER = "연결한 프로젝트 폴더를 아직 몰라요 — 처음 설정의 '프로젝트'에서 고르거나, 그 폴더에서 Claude Code를 한 번 열면 알게 돼요";
function startTask(text, label = "맡긴 일", checks = null) {
  if (String(text).length > TASK_MAX) return [400, { ok: false, reason: `넘긴 글이 너무 김 — ${TASK_MAX.toLocaleString()}자까지` }];
  const s = projectNow();
  if (!s) return [400, { ok: false, reason: NO_FOLDER }];
  if (task && task.state === "running") return [409, { ok: false, reason: "넘긴 일이 아직 진행 중이에요 — 끝난 뒤 다시 넘겨요" }];
  let child;
  // 끝나면(close 전에 provider가 부른다) 장부에 task로 — 토큰 · 비용만, 답 글은 받지 않는다
  const onResult = (r) => {
    if (!r) return;
    ledger.add("task", label, r.usage, r.cost);
    if (task && task.child === child) { task.tokens = r.usage.total; task.cost = r.cost; task.report = checks ? hideReport(Nav.parseReport(r.output, checks), s.dir) : null; }
  };
  try { child = openClaude({ dir: s.dir, text: checks ? Nav.taskBrief(text, checks) : text, onResult, schema: checks ? Nav.REPORT_SCHEMA : null }); }
  catch { return [502, { ok: false, reason: "claude를 열지 못함 — Claude Code가 설치됐는지 확인하세요" }]; }
  task = { state: "running", label, project: s.project, at: Date.now(), code: null, child, tokens: null, cost: null, report: null };   // label — 무슨 일인지(저장 커밋 · 문서 올리기 · 맡긴 일) — 파일 저장의 '맡긴 일이 도는 중' 판단에 쓴다(C-43)
  child.on("error", () => { if (task && task.child === child) task.state = "failed"; });
  child.on("close", (code) => { if (task && task.child === child) { task.state = code === 0 ? "done" : "failed"; task.code = code; } });
  return [200, { ok: true, project: s.project, task: publicTask() }];
}

// ── C-26 내 작업 책 — 연결한 폴더의 README.md를 읽어 책으로 나눠 준다(읽기만) — claude-drafted: 2026-10-23 (이재엽 "책의 작업들은 readme 에서 … 책에서 보여주는 역할만") ──
// 폴더는 일 넘기기와 같이 projectNow에서만 고른다(화면이 보낸 경로는 받지 않는다). 바로가기(심볼릭 링크)는 따라가지 않는다.
// 앞의 256KB만 읽고, 나누기 전에 비밀값을 가린다. 폴더 경로는 주지 않는다 — 이름만. 책이 없으면 why로 까닭만(folder: 폴더를 모름 · none: README 없음)
const README_MAX_BYTES = 256 * 1024;
// 그 폴더의 README.md — { text(가린 것), big } | null. 바로가기는 따라가지 않고 앞의 256KB만, 개인 키 덩어리는 통째로(sensitive.js는 BEGIN 줄만 가린다) · 그 밖은 sensitive.js로
function readmeText(dir) {
  if (!path.isAbsolute(dir)) return null;   // 훅이 보낸 cwd가 절대 경로가 아니면 읽지 않는다(서버의 작업 폴더를 읽지 않게)
  let text = "", big = false;
  try {
    const file = path.join(dir, "README.md");
    if (!fs.lstatSync(file).isFile()) return null;
    const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));   // 확인과 열기 사이에 바로가기로 바뀌어도 따라가지 않는다(Windows는 lstat만)
    try {
      const st = fs.fstatSync(fd);
      if (!st.isFile()) return null;
      big = st.size > README_MAX_BYTES;
      const buf = Buffer.alloc(Math.min(st.size, README_MAX_BYTES)); fs.readSync(fd, buf, 0, buf.length, 0); text = buf.toString("utf8");
    } finally { fs.closeSync(fd); }
  } catch { return null; }
  text = text.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g, "[가림: 개인 키]");
  return { text: Sensitive.redact(text), big };
}
// C-42 R-8(2026-10-27): 작업실 파일 칸 — 연결한 폴더(readme와 같은 '폴더 고르기')의 파일 · 폴더 이름만, 깊이 3 · 200개(files.js). 경로를 받지 않고 · 주지 않는다. 폴더를 모르면 files: null, why: "folder"
let lastFiles = null;   // 마지막 목록 { dir, list } — /api/file은 이 목록의 번호로만 연다(경로를 요청에서 받지 않는다, C-43)
function filesNow() {
  const s = projectNow();
  if (!s) { lastFiles = null; return { ok: true, project: "", files: null, why: "folder" }; }
  const r = Files.listFiles(s.dir, { redact: Sensitive.redact });
  lastFiles = { dir: s.dir, list: r.files };
  return { ok: true, project: s.project, files: r.files.map(({ raw, ...f }) => f), total: r.total, cut: r.cut, unread: r.unread, depth: Files.DEPTH, max: Files.MAX, why: "" };
}
// ── C-43 파일 보기 · 고치기(API.md 3-26, 2026-10-27 이재엽 버튼 "읽기 + 고치기" · "바로 저장 + 되돌리기" · "저장마다 커밋 맡기기" · "512KB · 내용으로 판단") ──
// 열기: 목록의 번호(i) → 그 폴더 안의 파일만(바로가기 없이), 512KB까지, 내용이 글이면(NUL 없음 · UTF-8). 바뀐 줄은 git diff의 덩어리 머리만(있으면). 경로는 답에 가린 것만
function fileEntry(i) {
  const n = i === null || i === undefined || i === "" ? NaN : Number(i);   // 번호가 없으면 없는 파일(0번으로 읽지 않는다)
  const s = projectNow();
  if (!lastFiles || !s || path.resolve(s.dir) !== path.resolve(lastFiles.dir)) return { code: 400, why: "folder", reason: "파일 목록을 먼저 받아야 해요(작업실을 다시 열어요)" };   // 폴더가 바뀌었거나 빠졌으면 옛 목록으로 열지 않는다
  const e = Number.isInteger(n) && n >= 0 && lastFiles.list[n];
  if (!e) return { code: 404, why: "none", reason: "그런 파일이 목록에 없어요 — 목록을 다시 받아요" };
  if (e.dir) return { code: 400, why: "dir", reason: "폴더는 열 수 없어요 — 안의 파일을 골라요" };
  const file = Files.safePath(lastFiles.dir, e.raw);
  if (!file) return { code: 400, why: "outside", reason: "작업 폴더 밖이거나 바로가기라 열지 않아요" };
  return { entry: e, file, rel: e.raw };
}
async function gitChanged(dir, rel) {
  try {
    const r = await Project.runCommand("git", ["diff", "--no-color", "-U0", "HEAD", "--", rel], { cwd: dir, timeout: 4000 });
    if (r.code !== 0) return [];
    if (!r.out.trim()) { const u = await Project.runCommand("git", ["ls-files", "--error-unmatch", "--", rel], { cwd: dir, timeout: 4000 }); return u.code === 0 ? [] : "new"; }   // 아직 git에 없는 파일은 전부 새 줄
    return Files.changedLines(r.out);
  } catch { return []; }
}
async function readFileNow(i) {
  const f = fileEntry(i); if (f.code) return [f.code, { ok: false, why: f.why, reason: f.reason }];
  let st; try { st = fs.statSync(f.file); } catch { return [404, { ok: false, why: "none", reason: "파일이 없어요 — 목록을 다시 받아요" }]; }
  if (!st.isFile()) return [400, { ok: false, why: "dir", reason: "파일이 아니에요" }];
  if (st.size > Files.FILE_MAX) return [200, { ok: false, why: "big", reason: `너무 커요 — ${Math.round(Files.FILE_MAX / 1024)}KB까지만 열어요(이 파일은 ${Math.round(st.size / 1024)}KB)` }];
  const buf = fs.readFileSync(f.file);
  if (!Files.isText(buf)) return [200, { ok: false, why: "binary", reason: Files.isUtf16(buf) ? "글자 방식이 UTF-8이 아니에요(UTF-16) — UTF-8로 저장하면 열려요" : "글 파일이 아니거나 글자 방식이 UTF-8이 아니에요(그림 · 압축 · 실행 파일, 또는 옛 한글 코드) — UTF-8 글 파일만 열어요" }];
  const changed = await gitChanged(lastFiles.dir, f.rel), text = buf.toString("utf8");
  return [200, { ok: true, i: Number(i), name: f.entry.name, path: f.entry.path, kind: Files.kindOf(f.rel), text, size: st.size, mtime: st.mtimeMs, changed, eol: /\r\n/.test(text) ? "crlf" : "lf" }];   // kind는 가리지 않은 이름으로(가린 이름은 확장자가 사라질 수 있다) · eol은 저장 때 되돌리려고
}
// C-45 문서 지도(API.md 3-27): 연결한 폴더의 md(docs/** · README.md · CLAUDE.md — 3-25의 목록 안에서)를 읽어(64KB까지, 링크만 보려고) 보드 데이터로. 지금 장 문서는 part, git에서 바뀐 문서는 cand. 경로는 폴더 안 상대 경로만
const DOCMAP_READ = 64 * 1024, DOCMAP_MAX = 100;   // 문서 100개까지(새 맥락 리뷰 — 200 × 64KB를 한 번에 읽지 않게), 비동기로
async function docmapNow(nowPath) {
  const s = projectNow();
  if (!s) return [200, { ok: false, why: "folder", reason: "연결한 폴더를 아직 몰라요 — 그 폴더에서 Claude Code를 한 번 열거나 설정에서 폴더를 골라요" }];
  const r = Files.listFiles(s.dir, { redact: Sensitive.redact });
  const docs = []; let cut = false;
  for (const e of r.files) {
    if (e.dir || !/\.md$/i.test(e.raw) || !(/^docs\//.test(e.raw) || /^(README|CLAUDE)\.md$/.test(e.raw))) continue;
    if (docs.length >= DOCMAP_MAX) { cut = true; break; }
    const file = Files.safePath(s.dir, e.raw); if (!file) continue;
    let text = ""; try { const fh = await fs.promises.open(file, "r"); try { const st = await fh.stat(); const buf = Buffer.alloc(Math.min(st.size, DOCMAP_READ)); await fh.read(buf, 0, buf.length, 0); text = buf.toString("utf8"); } finally { await fh.close(); } } catch { continue; }
    docs.push({ path: e.raw, text, name: e.name });
  }
  let changed = [];
  try { const g = await Project.runCommand("git", ["-c", "core.quotepath=false", "status", "--porcelain", "-z", "--", "docs", "README.md", "CLAUDE.md"], { cwd: s.dir, timeout: 4000 }); if (g.code === 0) changed = g.out.split("\0").map((l) => l.slice(3).trim()).filter(Boolean); } catch {}   // -z · quotepath=false — 한글 이름이 "\354…"로 인용되지 않게(새 맥락 리뷰)
  const board = Docmap.build(docs, { now: typeof nowPath === "string" ? nowPath : "", changed, project: s.project });
  if (cut) board.sub += ` · ${DOCMAP_MAX}개까지만 보여요`;
  return [200, { ok: true, project: s.project, board, cut }];
}
// C-44 틀로 맡기기(API.md 3-28): { i(목록 번호) 또는 path(docs/… 지금 장 문서 — 아직 없는 파일도 된다), preset(id), note? } → presets.js의 글과 끝 조건으로 startTask(허락은 섬, 끝에 기준마다 보고)
function presetStart(body) {
  if (!body || typeof body !== "object") return [400, { ok: false, reason: "보낼 것이 비어 있음" }];
  const p = Presets.byId(String(body.preset || "")); if (!p) return [400, { ok: false, reason: "그런 틀이 없어요" }];
  let rel = "";
  if (body.i !== undefined && body.i !== null) { const f = fileEntry(body.i); if (f.code) return [f.code, { ok: false, why: f.why, reason: f.reason }]; rel = f.rel; }
  else { rel = String(body.path || "").trim(); if (!/^docs\/[A-Za-z0-9._/-]+\.md$/.test(rel) || rel.split("/").some((x) => !x || x === "." || x === "..")) return [400, { ok: false, reason: "파일은 목록의 번호나 docs/ 안의 md 이름으로" }]; }
  const stage = typeof body.stage === "string" ? body.stage.slice(0, 60) : "지금 단계";
  const [code, out] = startTask(Presets.requestOf(p, { path: rel, stage, note: typeof body.note === "string" ? body.note.slice(0, 300) : "" }), "틀로 맡기기", Presets.checksOf(p));
  return [code, code === 200 ? { ...out, preset: p.id, name: p.name } : out];
}
// 쓰기: { i, path, text, mtime, eol?, force?, overwrite?, ignoreBusy?, commit? } — path(가린 경로)가 목록의 그것과 다르면(폴더가 바뀌었거나 다른 화면이 목록을 갈아끼움) 409 moved. mtime은 overwrite가 아니면 꼭.
//   비밀값 모양이면 멈추고 묻는다(force로 그대로), 연 뒤에 파일이 바뀌었으면(Claude Code가 고치는 중) 멈추고 묻는다(overwrite로 덮어쓰기), 맡긴 일이 돌면 멈추고 묻는다(ignoreBusy). eol "crlf"면 줄 끝을 CRLF로 되돌려 쓴다(화면의 글 칸은 LF로 바꾼다).
//   저장 뒤 commit이면 그 파일만 커밋 · 푸시를 Claude Code에 맡긴다(허락 카드는 섬에, 이재엽 버튼 "저장마다 커밋 맡기기"). 넘긴 일이 돌고 있으면 저장만 하고 까닭을 돌려준다
const SAVE_CHECKS = ["위 파일만 커밋했다", "지금 브랜치를 원격(origin)에 푸시했다"];
const saveRequest = (p) => ["Floe 작업실에서 사람이 이 파일을 고쳐 저장했어요. 이 파일만 올려 주세요:", `- ${p}`, "",
  "1. 이 파일만 git에 더해요(git add -- <위 파일>). 다른 파일은 더하거나 고치지 마세요.", `2. "docs: ${p} 고침(Floe 작업실)"으로 커밋해요.`,
  "3. 지금 브랜치를 원격(origin)에 푸시해요. 강제 푸시(--force)는 하지 마세요.", "원격(origin)이 없거나 푸시가 거절되면 푸시하지 말고 까닭만 알려 주세요."].join("\n");
function writeFileNow(body) {
  if (!body || typeof body !== "object") return [400, { ok: false, reason: "보낼 것이 비어 있음" }];
  const f = fileEntry(body.i); if (f.code) return [f.code, { ok: false, why: f.why, reason: f.reason }];
  if (typeof body.path === "string" && body.path !== f.entry.path) return [409, { ok: false, why: "moved", reason: "목록이 바뀌어 이 번호가 다른 파일이에요 — 작업실을 다시 열고 파일을 다시 열어요" }];
  if (typeof body.text !== "string") return [400, { ok: false, reason: "글이 비어 있음" }];
  const text = body.eol === "crlf" ? body.text.replace(/\r?\n/g, "\r\n") : body.text;
  if (Buffer.byteLength(text, "utf8") > Files.FILE_MAX) return [413, { ok: false, why: "big", reason: `너무 커요 — ${Math.round(Files.FILE_MAX / 1024)}KB까지만 써요` }];
  if (!body.force) { const sc = Sensitive.scan(text); if (sc.blocked) return [409, { ok: false, why: "sensitive", labels: [...new Set(sc.findings.filter((x) => x.severity === "block").map((x) => x.label))], reason: "비밀번호 · 키 모양이 있어요 — 그대로 저장할지 먼저 봐 주세요" }]; }
  let st = null; try { st = fs.statSync(f.file); } catch {}
  if (st && !st.isFile()) return [400, { ok: false, why: "dir", reason: "파일이 아니에요" }];
  if (!body.overwrite && st && !Number.isFinite(body.mtime)) return [400, { ok: false, reason: "연 때의 mtime이 있어야 해요(덮어쓰기가 아니면)" }];
  if (!body.overwrite && st && Math.abs(st.mtimeMs - body.mtime) > 1) return [409, { ok: false, why: "changed", reason: "연 뒤에 이 파일이 바뀌었어요(Claude Code가 고치는 중일 수 있어요) — 다시 열거나 덮어써요", mtime: st.mtimeMs }];
  if (!body.ignoreBusy && task && task.state === "running" && task.label !== "저장 커밋") return [409, { ok: false, why: "busy", reason: "맡긴 일이 아직 돌고 있어요 — Claude Code가 같은 파일을 고치는 중일 수 있어요. 끝난 뒤 저장하거나 그래도 저장해요" }];   // 앞선 저장의 커밋이 도는 중이면 저장은 막지 않는다(커밋만 '진행 중' 까닭으로 못 맡긴다)
  try { fs.writeFileSync(f.file, text); } catch { return [500, { ok: false, reason: "파일을 쓰지 못했어요 — 작업 폴더의 쓰기 권한을 봐 주세요" }]; }
  const mtime = fs.statSync(f.file).mtimeMs;
  if (!body.commit) return [200, { ok: true, mtime, task: null }];
  const [code, out] = startTask(saveRequest(f.rel), "저장 커밋", SAVE_CHECKS);
  return [200, { ok: true, mtime, task: code === 200 ? out.task : null, note: code === 200 ? "" : "저장했어요 · 커밋은 앞 일이 끝난 뒤 다시 저장하면 맡겨요" }];   // 커밋을 못 맡겨도 저장은 됐다 — 무엇이 빠졌는지 분명히(security-records 6-1)
}
function readmeBook() {
  const s = projectNow();
  if (!s) return { ok: true, project: "", book: null, why: "folder" };
  const r = readmeText(s.dir);
  if (!r) return { ok: true, project: s.project, book: null, why: "none" };
  const book = RB.parse(r.text);
  if (r.big) book.cut = true;
  return { ok: true, project: s.project, book, why: "" };
}

// ── C-34 준비 계획판(2026-10-24, 이재엽 버튼 "Floe의 AI 한 번") — 넣은 글 + 작업 폴더의 README(가림) · 맨 위 파일 이름만 AI에게. 도구 없이(callClaude) — 저장소의 설정 · 훅이 돌지 않는다 ──
// 다시 세울 때는 지난 계획(서버가 모양을 다시 확인) · 줄마다 의견 · 물은 것의 답 · 전체 의견을 같이. 폴더 경로는 보내지 않는다(파일 이름만, 점으로 시작하는 것 · node_modules 빼고 60개까지)
const PLAN_README_MAX = 6000, PLAN_FILES_MAX = 60, NOTE_MAX = 300;
function topFiles(dir) {
  try { return fs.readdirSync(dir).filter((n) => !n.startsWith(".") && n !== "node_modules").sort().slice(0, PLAN_FILES_MAX).map((n) => Sensitive.redact(n)); } catch { return []; }
}
const strOk = (v, max) => typeof v === "string" && v.length <= max;
function planAsk(res, body) {
  if (!Nav.filled(body.text)) return refuse(res, "넣은 글이 비어 있음");
  if (body.text.length > Nav.PLAN_MAX) return refuse(res, `넣은 글이 너무 김 — ${Nav.PLAN_MAX.toLocaleString()}자까지`);
  let prev = null;
  if (body.prev != null && !(prev = Nav.parsePlan(body.prev))) return refuse(res, "지난 계획의 모양이 맞지 않음");
  const notes = body.notes == null ? [] : body.notes, answers = body.answers == null ? [] : body.answers, general = body.general == null ? "" : body.general;
  if (!Array.isArray(notes) || notes.length > Nav.CHECKS_MAX || !notes.every((n) => n && strOk(n.need, NOTE_MAX) && strOk(n.check, NOTE_MAX) && Nav.filled(n.note) && strOk(n.note, NOTE_MAX))
    || !Array.isArray(answers) || answers.length > Nav.PLAN_SCHEMA.properties.ask.maxItems || !answers.every((a) => a && strOk(a.q, NOTE_MAX) && Nav.filled(a.a) && strOk(a.a, NOTE_MAX)) || !strOk(general, NOTE_MAX)) return refuse(res, "의견의 모양이 맞지 않음");
  const s = body.readme === false ? null : projectNow(), r = s && readmeText(s.dir);
  const readme = r ? r.text.slice(0, PLAN_README_MAX) : "", files = s ? topFiles(s.dir) : [];
  return ask(res, Nav.planPrompt({ text: body.text, readme, files, prev, notes: notes.map((n) => ({ need: n.need, check: n.check, note: n.note })), answers: answers.map((a) => ({ q: a.q, a: a.a })), general }),
    Nav.PLAN_SCHEMA, as("plan", Nav.parsePlan), "계획");
}

// ── C-37 단계 결과 · 단계 문서(2026-10-25) — claude-drafted: 2026-10-25 (이재엽 "2단계가 끝나면 … docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에" · 버튼 "Floe가 만들고, 커밋 · 푸시는 Claude Code") ──
// 단계 결과의 모양 — [{ name, lines[] }] 할 일 8개까지 · 이름 200자 · 줄 5개 · 줄 400자. 맞으면 다듬은 것, 아니면 null
const ITEM_NAME_MAX = 200, LINE_MAX = 400;
const itemsOf = (a) => (Array.isArray(a) && a.length >= 1 && a.length <= 8 && a.every((x) => x && strOk(x.name, ITEM_NAME_MAX) && Nav.filled(x.name) && Array.isArray(x.lines) && x.lines.length <= 5 && x.lines.every((l) => strOk(l, LINE_MAX)))
  ? a.map((x) => ({ name: x.name, lines: [...x.lines] })) : null);
// ── C-39 증빙(2026-10-25) — 칸마다 누가 정했나(by) · 플로로가 낸 것(draft) · 재료(from), 단계마다 준비할 것(prep) · 확인한 날(at) · 관문 지난 날(passed) · 완료 기준(check). 모두 없어도 된다 ──
const BY = require("./quest.js").BY, DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const refsOk = (a) => Array.isArray(a) && a.length <= Nav.FROM_MAX && a.every((x) => x && Number.isInteger(x.s) && Number.isInteger(x.i) && x.s >= 0 && x.s < Nav.STAGES.length && x.i >= 0 && x.i < 8);
const extraOk = (x) => (x.by == null || BY.includes(x.by)) && (x.draft == null || strOk(x.draft, LINE_MAX)) && (x.from == null || refsOk(x.from));
const extraOf = (x) => ({ ...(x.by != null ? { by: x.by } : {}), ...(x.draft != null && x.draft !== "" ? { draft: x.draft } : {}), ...(x.from && x.from.length ? { from: x.from.map((r) => ({ s: r.s, i: r.i })) } : {}) });
const checkOk = (a) => Array.isArray(a) && a.length <= 8 && a.every((c) => c && strOk(c.text, ITEM_NAME_MAX) && Nav.filled(c.text) && typeof c.met === "boolean" && (c.evidence == null || strOk(c.evidence, 300)) && (c.skipped == null || typeof c.skipped === "boolean"));   // skipped — 관문에서 까닭을 적고 넘긴 기준(F-62, 2026-10-28)
// F-62(2026-10-28): 넘긴 기준의 까닭 — 화면이 보내는 skip { reason(관문에서 사람이 적은 한 줄 · 200자), items(넘긴 기준 글) }. docs.js가 단계 문서 · 결정 기록에 '넘김(까닭)'으로 쓴다
const skipOk = (k) => k && typeof k === "object" && !Array.isArray(k) && strOk(k.reason, CHECK_LINE_MAX) && (k.items == null || (Array.isArray(k.items) && k.items.length <= 8 && k.items.every((x) => strOk(x, ITEM_NAME_MAX))));
const stageExtraOk = (v) => (v.prep == null || (Array.isArray(v.prep) && v.prep.length <= Nav.PREP_MAX && v.prep.every((x) => strOk(x, Nav.PREP_LINE))))
  && (v.at == null || (typeof v.at === "string" && DATE_RE.test(v.at))) && (v.passed == null || (typeof v.passed === "string" && DATE_RE.test(v.passed))) && (v.check == null || checkOk(v.check))
  && (v.checkBy == null || v.checkBy === "confirm")
  && (v.skip == null || skipOk(v.skip));   // C-40 — 완료 기준을 누가 봤나(confirm = 초안을 칸마다 확인, AI 판정 없이 · 없으면 AI가 살펴봄)
// 화면이 보낸 단계 결과들 — { "0": {title, items, …}, "1": … }. 1 · 2단계(0 · 1)가 다 있어야. 단계 번호 0~7만. 모르는 칸은 버린다
// 답: { results } 또는 { why } — 무엇이 틀렸는지 그대로 말한다(2026-10-25 리뷰)
function resultsOf(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return { why: "단계 결과의 모양이 맞지 않음" };
  if (!r[0] || !r[1]) return { why: "1 · 2단계 결과가 다 있어야 해요" };
  const out = {};
  for (const [k, v] of Object.entries(r)) {
    const n = Number(k), items = v && itemsOf(v.items);
    if (!Number.isInteger(n) || !stageOf(n) || !items || !v.items.every(extraOk) || !stageExtraOk(v))
      return { why: `${n + 1}단계 결과의 모양이 맞지 않음 — 할 일 8개 · 줄 5개 · 줄 ${LINE_MAX}자까지, 준비할 것 ${Nav.PREP_MAX}줄, 날짜는 YYYY-MM-DD` };
    out[n] = { items: items.map((x, i) => ({ ...x, ...extraOf(v.items[i]) })),
      ...(v.prep && v.prep.length ? { prep: [...v.prep] } : {}), ...(v.at ? { at: v.at } : {}), ...(v.passed ? { passed: v.passed } : {}),
      ...(v.check && v.check.length ? { check: v.check.map((c) => ({ text: c.text, met: c.met, evidence: c.evidence || "", ...(c.skipped ? { skipped: true } : {}) })) } : {}), ...(v.checkBy ? { checkBy: v.checkBy } : {}),
      ...(v.skip ? { skip: { reason: v.skip.reason, items: Array.isArray(v.skip.items) ? [...v.skip.items] : [] } } : {}) };
  }
  return { results: out };
}
// 지난 단계 결과들(/api/stagedraft) — [{ stage, items }] 이 단계보다 앞 단계만 · 한 번씩 · 바로 앞 단계는 꼭. 맞으면 다듬은 것(단계 순서), 아니면 null
function prevStagesOf(p, stage) {
  if (!Array.isArray(p) || !p.length || p.length > Nav.STAGES.length) return null;
  const out = [];
  for (const x of p) {
    const items = x && itemsOf(x.items);
    if (!items || !Number.isInteger(x.stage) || x.stage < 0 || x.stage >= stage || out.some((y) => y.stage === x.stage)) return null;
    out.push({ stage: x.stage, items });
  }
  return out.some((y) => y.stage === stage - 1) ? out.sort((a, b) => a.stage - b.stage) : null;
}
// 쓸 자리 — 작업 폴더 안의 정해진 이름만. 가는 길에 바로가기가 있거나 파일 자리가 폴더면 쓰지 않는다(폴더 밖으로 새지 않게). 모두 본 뒤에 쓴다
function docTargets(dir, files) {
  const root = path.resolve(dir), out = [];
  for (const f of files) {
    const parts = f.path.split("/");
    if (!/^[A-Za-z0-9._/-]+$/.test(f.path) || parts.some((x) => !x || x === "." || x === "..")) return { why: "문서 이름이 맞지 않음" };
    let cur = root;
    for (const part of parts) {
      cur = path.join(cur, part);
      let st = null; try { st = fs.lstatSync(cur); } catch { break; }
      if (st.isSymbolicLink()) return { why: `'${path.relative(root, cur)}'가 바로가기예요 — 작업 폴더 밖에 쓸 수 있어 쓰지 않았어요` };
      if (cur !== path.join(root, ...parts) && !st.isDirectory()) return { why: `'${path.relative(root, cur)}'가 폴더가 아니에요` };
      if (cur === path.join(root, ...parts) && !st.isFile()) return { why: `'${f.path}' 자리에 파일이 아닌 것이 있어요` };
    }
    out.push({ ...f, file: path.join(root, ...parts) });
  }
  return { list: out };
}
function shipDocs(body) {
  const got = resultsOf(body && body.results), topic = body && body.topic != null ? body.topic : "", idea = body && body.idea != null ? body.idea : "";
  if (got.why) return [400, { ok: false, reason: got.why }];
  if (!strOk(topic, 60)) return [400, { ok: false, reason: "주제는 60자까지" }];
  if (!strOk(idea, Nav.IDEA_MAX)) return [400, { ok: false, reason: `처음 말한 것은 ${Nav.IDEA_MAX}자까지` }];
  const results = got.results;
  const s = projectNow();
  if (!s) return [400, { ok: false, reason: NO_FOLDER }];
  if (task && task.state === "running") return [409, { ok: false, reason: "넘긴 일이 아직 진행 중이에요 — 끝난 뒤 다시 올려요" }];   // 쓰기 전에(쓰고 나서 못 맡기지 않게)
  const files = Docs.files({ topic, idea, results, redact: Sensitive.redact });
  const t = docTargets(s.dir, files);
  if (t.why) return [400, { ok: false, reason: t.why }];
  try {
    for (const f of t.list) {
      fs.mkdirSync(path.dirname(f.file), { recursive: true });
      fs.writeFileSync(f.file, f.merge ? Docs.mergeSection(fs.existsSync(f.file) ? fs.readFileSync(f.file, "utf8") : "", f.text) : f.text);
    }
  } catch { return [500, { ok: false, reason: "문서를 쓰지 못했어요 — 작업 폴더의 쓰기 권한을 봐 주세요" }]; }
  // 끝에 기준마다 보고하게 한다(C-32) — 화면이 '올라갔다'를 Claude Code의 답(푸시함)으로만 말하게
  const paths = files.map((f) => f.path), [code, out] = startTask(Docs.shipRequest(paths), "문서 올리기", Docs.SHIP_CHECKS);
  return [code, { ...out, files: paths }];
}

// ── 설정의 GitHub 칸(C-25) — claude-drafted: 2026-10-24 (이재엽 "깃허브을 연동하는 곳을 설정창에") ──
// 폴더는 README와 같이 projectNow에서만 고른다. 저장소 만들기는 Floe가 하지 않고 일 넘기기(3-16)로 사용자의 Claude Code에 맡긴다 — 글은 github.js createRequest가 정한다(화면이 글을 보내지 않는다)
function githubNow() { const s = projectNow(); return GH.status(s ? s.dir : "", s ? s.project : ""); }
function githubCreate(body) {
  const vis = body && body.visibility != null ? body.visibility : "private";
  if (!GH.VIS.includes(vis)) return [400, { ok: false, reason: "공개 범위는 private · public 중 하나" }];
  const s = projectNow();
  if (!s) return [400, { ok: false, reason: NO_FOLDER }];
  const now = GH.status(s.dir, s.project);
  if (now.remote) return [409, { ok: false, reason: "이 폴더는 이미 원격 저장소와 이어져 있어요" }];
  return startTask(GH.createRequest(s.project, vis), "저장소 만들기");
}

function addEvent(body) {
  // Codex(GPT)도 Claude Code와 같은 모양으로 알린다(2026-10-14 실측) — 어느 도구인지만 hook.js가 붙여 준다
  const tool = body.tool === "codex" ? "codex" : "claude";
  if (body.hook_event_name === "PostToolUse") return addStep(body, tool);   // C-12: 한 일 — 알림 목록에는 넣지 않는다
  const kind = HOOK_KINDS[body.hook_event_name];
  if (!kind) return null;
  workSession(body, tool).state = kind === "prompt" ? "working" : "done";   // C-12: 세션 상태 — 요청 받음이면 일하는 중, 작업 마침이면 마쳤어요
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
  work.clear();   // C-12: 한 일과 세션 상태도 같이(stepSeq는 되돌리지 않는다 — 섬의 AI 진행 판이 since로 묻는다)
  clearApprovals();   // FR-17: 기다리던 승인 요청에는 none — 훅이 빈 출력으로 끝나 Claude Code가 스스로 묻는다
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
  const r = await callClaude(Setup.CHECK_PROMPT, Setup.CHECK_SCHEMA, { label: "연결 확인" });
  if (r.data && r.data.ok === true) return send(res, 200, { ok: true, provider, tokens: r.tokens || 0 });
  return refuse(res, r.error || "답의 모양이 맞지 않음", 502);
}

async function handle(req, res) {
  if (req.url.startsWith("/mcp/")) return mcpRoute(req, res);   // C-38 시험판 — allowed()보다 먼저: 밖(터널)에서도 받을 수 있는 주소는 이것뿐(NAV_MCP=1일 때). 출처는 mcpRoute가 본다
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
  if (req.method === "GET" && route === "/api/steps") {   // C-12 AI 진행(API.md 3-12) — 섬의 AI 진행 판이 쿠키로 묻는다
    const since = Number(new URL(req.url, "http://localhost").searchParams.get("since")) || 0;
    return send(res, 200, { ok: true, ...stepsSince(since) });
  }
  if (req.method === "POST" && route === "/api/events/clear") return send(res, 200, { ok: true, cleared: clearEvents() });   // S5
  if (req.method === "GET" && route === "/api/approvals") return send(res, 200, { ok: true, ...listApprovals() });   // FR-17 섬이 기다리는 승인 요청을 본다(API.md 3-14)
  if (req.method === "GET" && route === "/api/task") return send(res, 200, { ok: true, task: publicTask() });   // FR-17 넘긴 일의 상태(API.md 3-16)
  if (req.method === "GET" && route === "/api/proposals") return send(res, 200, { ok: true, items: proposals });   // C-38 시험판 — 섬이 웹 AI의 제안을 본다
  if (req.method === "GET" && route === "/api/apps") return send(res, 200, { ok: true, claudeDesktop: AppLink.status(AppLink.desktopConfig()) });   // 같이 쓸 앱 — 찾았다 · 이었다만(경로는 보이지 않는다)
  if (req.method === "GET" && route === "/api/readme") return send(res, 200, readmeBook());   // C-26 내 작업 책(API.md 3-18) — 읽기만
  if (req.method === "GET" && route === "/api/files") return send(res, 200, filesNow());   // C-42 R-8 작업실 파일 칸(API.md 3-25) — 이름만, 읽기만
  if (req.method === "GET" && route === "/api/docmap") { const [code, out] = await docmapNow(new URL(req.url, "http://localhost").searchParams.get("now") || ""); return send(res, code, out); }   // C-45 문서 지도(API.md 3-27) — 읽기만
  if (req.method === "GET" && route === "/api/file") { const [code, out] = await readFileNow(new URL(req.url, "http://localhost").searchParams.get("i")); return send(res, code, out); }   // C-43 파일 열기(API.md 3-26)
  if (req.method === "POST" && route === "/api/preset") { const body = await readJson(req); if (body === TOO_BIG) return refuse(res, "너무 커요", 413); const [code, out] = presetStart(body); return send(res, code, out); }   // C-44 틀로 맡기기(API.md 3-28)
  if (req.method === "POST" && route === "/api/file") { const body = await readJson(req, Files.FILE_MAX * 2 + 1000); if (body === TOO_BIG) return refuse(res, `너무 커요 — ${Math.round(Files.FILE_MAX / 1024)}KB까지만 써요`, 413); const [code, out] = writeFileNow(body); return send(res, code, out); }   // C-43 파일 저장
  if (req.method === "GET" && route === "/api/github") return send(res, 200, githubNow());   // 설정의 GitHub 칸(API.md 3-19) — 읽기만
  if (req.method === "GET" && route === "/api/usage") return send(res, 200, { ok: true, ...usage(), ledger: ledger.snapshot() });   // 어느 공급자·모델·얼마나 썼는지 — 키는 없다. ledger: 토큰 장부(숫자 · 이름만, 2026-10-24)
  if (req.method === "POST" && route === "/api/usage/reset") { ledger.reset(); return send(res, 200, { ok: true, ledger: ledger.snapshot() }); }   // 토큰 장부 새로 재기 — 본문 없음, 확인 값
  if (req.method === "GET" && route === "/api/setup") return send(res, 200, { ok: true, ...setupNow() });   // 처음 설정 — 있다 · 없다만(API.md 3-10)
  if (req.method === "POST" && route === "/api/setup/check") return checkAi(res);   // 연결 확인(API.md 3-11) — 본문 없음
  if (req.method !== "POST" || !POST_ROUTES.includes(route)) return refuse(res, "없는 주소", 404);   // 본문을 읽기 전에(전에는 빈 본문이면 400이었다)
  const body = await readJson(req);
  if (body === TOO_BIG) return refuse(res, `보낸 글이 너무 김 — ${MAX_BODY.toLocaleString()}자까지`, 413);
  if (route === "/api/event") {
    const ev = body && addEvent(body);
    return ev ? send(res, 200, { ok: true, seq: ev.seq }) : refuse(res, "알 수 없는 알림");
  }
  if (route === "/api/approval") { const why = holdApproval(body, req, res); return why ? refuse(res, why, why.includes("너무 많") ? 429 : 400) : undefined; }   // FR-17 훅 — 답은 결정이 오거나 시간이 지나면(3-13)
  if (route === "/api/github/create") { const [code, out] = githubCreate(body); return send(res, code, out); }   // 저장소 만들기를 Claude Code에 맡기기(3-19)
  if (route === "/api/approvals/decide") { const [code, out] = decideApproval(body); return send(res, code, out); }   // FR-17 섬의 결정(3-15)
  if (route === "/api/quest") {   // C-22 퀘스트 제작(API.md 3-17, 2026-10-21) — AI 한 번. 할 일 이름 · 개수는 코드, AI는 설명 · 질문 · 예시만(navigator.js questPrompt · parseQuest)
    if (!body || !Nav.filled(body.idea)) return refuse(res, "만들고 싶은 것이 비어 있음");
    if (body.idea.length > Nav.IDEA_MAX) return refuse(res, `만들고 싶은 것이 너무 김 — ${Nav.IDEA_MAX}자까지`);
    if (body.tier != null && !Nav.TIERS.includes(body.tier)) return refuse(res, "모르는 등급");
    if (!stageOf(body.stage)) return refuse(res, "지금 단계가 없음");
    return ask(res, Nav.questPrompt(body.stage, body.idea, body.tier), Nav.QUEST_SCHEMA, as("quest", (d) => Nav.parseQuest(d, body.stage, body.tier)), "퀘스트");
  }
  if (route === "/api/state") { const s = Mcp.cleanState(body); if (!s) return refuse(res, "상태의 모양이 맞지 않음"); floeState = s; return send(res, 200, { ok: true }); }   // C-38 시험판 — 메모리에만
  if (route === "/api/apps/link") { if (!body || body.app !== "claude-desktop") return refuse(res, "모르는 앱"); mcpToken(); const r = AppLink.link(AppLink.desktopConfig(), AppLink.entry({ port: PORT, tokenFile: MCP_TOKEN_FILE })); return r.ok ? send(res, 200, { ok: true }) : refuse(res, r.message, 409); }   // 같이 쓸 앱 — 토큰 파일을 먼저 만든다(값은 설정 파일에 넣지 않는다)
  if (route === "/api/proposals/decide") { const k = proposals.findIndex((x) => body && x.id === body.id); if (k < 0) return refuse(res, "기다리는 제안이 아님", 404); proposals.splice(k, 1); return send(res, 200, { ok: true }); }   // 맞아요 · 아니요 — 적는 일은 화면이
  if (route === "/api/plan") return planAsk(res, body || {});   // C-34 준비 계획판(API.md 3-20) — AI 한 번
  if (route === "/api/docs") { const [code, out] = shipDocs(body); return send(res, code, out); }   // C-37 단계 문서를 작업 폴더에 쓰고 커밋 · 푸시를 Claude Code에(API.md 3-23)
  if (route === "/api/stagedraft") {   // C-37 2단계 · C-39 3단계 초안(API.md 3-22, 2026-10-25) — AI 한 번. 받은 글 · 지난 단계 결과들로 그 등급의 할 일마다 글 · 재료(기획서 칸은 고르기) · 준비할 것
    if (!body || !Nav.DRAFT_STAGES.includes(body.stage)) return refuse(res, `초안을 만드는 단계가 아님 — 지금은 ${Nav.DRAFT_STAGES.map((n) => n + 1).join(" · ")}단계만`);
    if (body.tier != null && !Nav.TIERS.includes(body.tier)) return refuse(res, "모르는 등급");
    if (!Nav.filled(body.idea)) return refuse(res, "받은 글이 비어 있음");
    if (body.idea.length > Nav.IDEA_MAX) return refuse(res, `받은 글이 너무 김 — ${Nav.IDEA_MAX}자까지`);
    const prev = prevStagesOf(body.prev, body.stage);
    if (!prev) return refuse(res, `지난 단계 결과의 모양이 맞지 않음 — [{ stage, items }], 바로 앞 단계는 꼭 · 할 일 8개 · 줄 5개 · 줄 ${LINE_MAX}자까지`);
    // 다른 예시(C-40) — { i, texts }: 그 칸은 이미 본 예시와 다르게. 칸 자리 0~7 · 예시 1~3개 · 한 예시 300자
    const avoid = body.avoid;
    if (avoid && !(typeof avoid === "object" && Number.isInteger(avoid.i) && avoid.i >= 0 && avoid.i < 8 && Array.isArray(avoid.texts) && avoid.texts.length >= 1 && avoid.texts.length <= 3 && avoid.texts.every((t) => strOk(t, 300) && Nav.filled(t))))
      return refuse(res, "다른 예시 요청의 모양이 맞지 않음 — { i: 칸 자리, texts: 이미 본 예시 1~3개 }");
    return ask(res, Nav.stageDraftPrompt(body.stage, body.tier, { idea: body.idea, prev, ...(avoid ? { avoid: { i: avoid.i, texts: avoid.texts } } : {}) }), Nav.STAGE_DRAFT_SCHEMA,
      as("draft", (d) => Nav.parseStageDraft(d, body.stage, body.tier, prev)), "단계 초안", { fast: true, maxTokens: 4096 });
  }
  if (route === "/api/start") {   // C-36 처음 한 바퀴(API.md 3-21, 2026-10-25) — AI 한 번. 받은 글 전체로 1단계 초안(제목 · 불편 · 달라지는 것 · 누가 · 크기). 도구 없이, 글만
    if (!body || !Nav.filled(body.text)) return refuse(res, "받은 글이 비어 있음");
    if (body.text.length > Nav.START_MAX) return refuse(res, `받은 글이 너무 김 — ${Nav.START_MAX.toLocaleString()}자까지`);
    return ask(res, Nav.startPrompt(body.text), Nav.START_SCHEMA, as("start", Nav.parseStart), "1단계 초안", { fast: true });   // 초안은 빠른 모델로(C-40)
  }
  if (!body || !Nav.filled(body.text)) return refuse(res, "작업 내용이 비어 있음");
  if (route === "/api/task/start") {   // FR-17 허락하고 넘기기(3-16) — checks를 주면 기준과 함께 넘기고 끝에 보고를 받는다(C-32, 2026-10-24)
    const checks = body.checks == null ? null : checksOf(body.checks);
    if (body.checks != null && !checks) return refuse(res, `기준의 모양이 맞지 않음 — 1~${Nav.CHECKS_MAX}줄, 한 줄 ${CHECK_LINE_MAX}자까지`);
    const [code, out] = startTask(body.text, "맡긴 일", checks); return send(res, code, out);
  }
  if (route === "/api/task/tidy") {   // FR-17 요구 문장으로 정리(3-16) — AI 한 번
    if (body.text.length > TASK_MAX) return refuse(res, `넘긴 글이 너무 김 — ${TASK_MAX.toLocaleString()}자까지`);
    return ask(res, Nav.taskPrompt(body.text), Nav.TASK_SCHEMA, Nav.parseTask, "정리");
  }
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
  // FR-3 단계 문서(2026-10-20까지 '설계도' — 화면 글에서 뺐다, C-16) — 문서를 만드는 단계(1~4)만. 남은 주소는 /api/draft와 /api/review뿐이다(POST_ROUTES)
  const s = stageOf(body.stage);
  if (!s || !s.doc) return refuse(res, "단계 문서를 만드는 단계가 아님");
  if (route === "/api/draft") return ask(res, Nav.draftPrompt(s.n, body.text, tier), Nav.DRAFT_SCHEMA, Nav.parseDraft, "초안");
  if (!Nav.filled(body.doc)) return refuse(res, "단계 문서가 비어 있음");
  return ask(res, Nav.reviewPrompt(s.n, body.text, body.doc, tier), Nav.REVIEW_SCHEMA, as("review", Nav.parseReview), "다시 봐 준 결과의");
}

if (require.main === module) {
  theToken();   // 켜자마자 만든다 — 화면을 열기 전에 온 훅 알림도 받게. 값은 출력하지 않는다
  if (mcpOn()) { mcpToken(); console.log(`원격 MCP(C-38 시험판): 켜짐 — 주소는 https://<터널 주소>/mcp/<${MCP_TOKEN_FILE}의 값>. 값은 보여 주지 않아요. 터널 예: cloudflared tunnel --url http://127.0.0.1:${PORT}`); }
  http.createServer(handle).listen(PORT, "127.0.0.1", () => {
    const u = usage();
    console.log(`Floe 시연 화면: http://127.0.0.1:${PORT}`);
    console.log(`알림 확인 값: ${TOKEN_FILE} (나만 읽기 — 값은 보여 주지 않아요. 기록 비우기: 서버를 다시 켜거나 README "시연 전 한 줄 점검")`);
    if (u.replay) console.log("AI: 녹화본 재생 — 토큰도 키도 쓰지 않아요 (녹화에 없는 요청은 오류로 알려 줘요)");
    else if (u.record) console.log("AI: 진짜로 부른 답을 녹화하는 중이에요");
    if (!u.replay) console.log(u.provider === "api" ? `AI: 내 API 키(${u.model} · 보내는 곳 ${u.host}${u.compat ? " · 호환 모드" : ""}) — 지금까지 ${u.used.toLocaleString()} 토큰${u.budget ? ` / 한도 ${u.budget.toLocaleString()}` : " (한도 없음 — NAV_TOKEN_BUDGET으로 정할 수 있어요)"}` : "AI: 이 컴퓨터에 로그인된 Claude Code(claude -p) — 내 API 키로 쓰려면 ANTHROPIC_API_KEY를 설정하세요");
  });
}
module.exports = { allowed, recent, addEvent, clearEvents, handle, eventToken, mcpToken, build, useProject, dropProject, TOKEN_FILE, DEFAULT_TOKEN_FILE, FILES };   // useProject · dropProject — 앱(main.js)만 부른다
