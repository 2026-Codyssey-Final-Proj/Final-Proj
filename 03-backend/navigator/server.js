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
const FindLines = require("./findlines.js");   // C-56 R-4 — 폴더의 글 파일에서 칸의 답 후보 줄(2026-10-28)
const Project = require("./project.js");   // runCommand — 바뀐 줄을 git diff로(C-43, 읽기만)
const Docmap = require("./docmap.js");
const Presets = require("./presets.js");   // C-44 맡기기 틀 — 번호로 받은 파일을 raw 경로로 바꿔 Claude Code에 넘긴다(화면은 경로를 보내지 않는다) — claude-drafted: 2026-10-27   // C-45 문서 지도 — 문서와 링크를 보드 데이터로(읽기만) — claude-drafted: 2026-10-27   // C-42 R-8 작업실 파일 칸 — 연결한 폴더의 이름만(읽기만, 2026-10-27) — claude-drafted: 2026-10-27
const RB = require("./readme-book.js");   // C-26 내 작업 책 — README를 책으로 나눈다(읽기만) — claude-drafted: 2026-10-23
const PublicOk = require("./publicok.js");   // C-52 공개 저장소면 저장소마다 처음 한 번 묻는다(2026-10-29)
const GH = require("./github.js");   // 설정의 GitHub 칸(C-25, 2026-10-24) — git · gh에게 읽기만 묻는다 — claude-drafted: 2026-10-24
const Carry = require("./carry.js");   // 지식 퀘스트 C-48 가져갈 것 — 기준 다섯 · 장부의 규칙(순수, 2026-10-29)
const Plan = require("./plan.js");   // C-51 앞의 결정과 다름(규칙) — 계획판 규칙(순수)과 같은 파일
const Quest = require("./quest.js");   // C-51 근거 줄의 칸 이름(짧은 이름)
const Docs = require("./docs.js");   // C-37 단계 문서 — 단계 결과로 사용자 저장소에 둘 파일(순수 함수) — claude-drafted: 2026-10-25
const Setup = require("./setup-status.js");   // 처음 설정(GET /api/setup · POST /api/setup/check) — claude-drafted: 2026-10-19
const Mcp = require("./mcp.js");   // C-38 시험판 — MCP(웹 GPT · 웹 Claude · Claude Desktop)의 규칙. 이 컴퓨터 안에서는 늘, 밖(터널)에서는 NAV_MCP=1일 때만 /mcp/<토큰>을 받는다 — claude-drafted: 2026-10-25
const Connect = require("./connect.js");   // F-69 맡기기 전에 그 폴더에서 허락 훅이 도는지(hookReady — 읽기만, 2026-10-28)
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
const AI_ROUTES = ["/api/judge", "/api/answer", "/api/draft", "/api/review", "/api/setup/check", "/api/task/tidy", "/api/quest", "/api/plan", "/api/start", "/api/stagedraft", "/api/prepare", "/api/chat"];   // /api/chat — 작업실 개편 C-61 플로로와 자유 대화(2026-10-29)   // /api/prepare — C-56 R-2 준비된 퀘스트(새 맥락 리뷰 2026-10-28 막힘: 토큰 없이 불렸다)   // /api/stagedraft — C-37 2단계 초안(2026-10-25) · /api/start — C-36 처음 한 바퀴의 1단계 초안(2026-10-25) · /api/plan — C-34 준비 계획판(2026-10-24)   // /api/task/tidy — FR-17 요구 문장 정리(2026-10-20), /api/quest — C-22 퀘스트 제작(2026-10-21)
// FR-17(2026-10-20): 승인(훅이 보내고 기다림 · 섬이 보고 누름)과 일 넘기기 — 모두 확인 값. 폴더 경로는 섬에 주지 않고, claude는 훅이 알려 준 폴더에서만 연다
const APPROVE_ROUTES = ["/api/approval", "/api/approvals", "/api/approvals/decide", "/api/task", "/api/task/start", "/api/task/retry", "/api/task/stop"];   // /api/task/retry — F-69 막힌 일을 다시 · 직접 하기 글, /api/task/stop — C-50 사람이 고르면 멈추기(2026-10-28)
// C-26(2026-10-23): 내 작업 책 — 연결한 폴더의 README를 읽어 준다. 폴더 이름 · 글이 나가므로 확인 값을 건다
const BOOK_ROUTES = ["/api/readme", "/api/files", "/api/file", "/api/find", "/api/docmap", "/api/preset", "/api/github", "/api/github/create", "/api/docs"];   // /api/file — C-43 파일 보기 · 고치기(2026-10-27): 목록의 번호로 열고 쓴다   // /api/files — C-42 R-8 작업실 파일 칸: 연결한 폴더의 파일 · 폴더 이름만(2026-10-27)   // /api/docs — C-37 단계 문서를 작업 폴더에 쓰고 커밋 · 푸시를 Claude Code에(2026-10-25)   // /api/github — 설정의 GitHub 칸(C-25, 2026-10-24): 폴더 이름 · 저장소 이름이 나가고, create는 Claude Code를 연다
const USAGE_ROUTES = ["/api/usage/reset"];   // 토큰 장부 새로 재기(2026-10-24) — 장부를 지우므로 확인 값. 읽기(GET /api/usage)는 전처럼 숫자만
const MCP_LOCAL_ROUTES = ["/api/state", "/api/proposals", "/api/proposals/decide", "/api/apps/link"];   // C-38 시험판(2026-10-25) — 화면이 상태를 보내고 웹 AI의 제안을 본다 · Claude Desktop 설정 파일에 잇는다. 밖(터널)에서는 받지 않는다(allowed)
const TOKEN_ROUTES = [...EVENT_ROUTES, ...AI_ROUTES, ...APPROVE_ROUTES, ...BOOK_ROUTES, ...USAGE_ROUTES, ...MCP_LOCAL_ROUTES];
const POST_ROUTES = ["/api/file", "/api/preset", "/api/event", "/api/judge", "/api/answer", "/api/draft", "/api/review", "/api/approval", "/api/approvals/decide", "/api/task/tidy", "/api/task/start", "/api/task/retry", "/api/task/stop", "/api/quest", "/api/github/create", "/api/plan", "/api/start", "/api/stagedraft", "/api/prepare", "/api/chat", "/api/docs", "/api/state", "/api/proposals/decide", "/api/apps/link"];   // 본문(JSON)을 읽는 주소 — 이 밖은 본문을 읽기 전에 404
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43,}$/;   // randomBytes(32)의 base64url = 43자
// 지식 퀘스트 C-48(2026-10-29) — 따로 더해 둔다(다른 갈래가 고치는 위 목록 줄과 부딪치지 않게). 가져갈 것 초안(AI 한 번) · 장부(이 컴퓨터) 모두 확인 값
TOKEN_ROUTES.push("/api/carry/draft", "/api/carry");
POST_ROUTES.push("/api/carry/draft");

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
const TYPES = { html: "text/html", css: "text/css", js: "text/javascript", woff: "font/woff", txt: "text/plain; charset=utf-8" };   // woff — 글꼴 셋(C-57)
const STATIC = {
  // dive.js·dive.css — 내비게이터(`dive.js` → /dive.js)와 서고(`../navigator/dive.js` → /navigator/dive.js)가 같이 쓴다. 2026-10-18까지 빠져 있었다
  // notes.js — 실사용의 '느낀 점 남기기'(2026-10-19)
  // setup.js · setup.css — 처음 켤 때 반기고 연결(Claude Code / API 키)을 돕는 화면(2026-10-19)
  // greet.js — 켤 때 인사의 시간표(C-10, 2026-10-20)
  // canvas-pan.js — 작업실 캔버스를 끌어서 옮기고 크게 · 작게(F-66, 2026-10-27)
  // morph.js — 섬의 움직임 규칙(C-14, 2026-10-20). 내비게이터는 hub.js(순수 함수) · steps.js도 부른다(C-13 기본 화면)
  "02-frontend/navigator": ["fonts.css", "index.html", "app.css", "app.js", "seal.js", "seal.css", "setup.js", "setup.css", "library-tab.css", "dive.js", "dive.css", "notes.js", "greet.js", "morph.js", "win.html", "win.js", "docmap.html", "canvas-pan.js"],   // docmap.html — 문서 지도(C-45, 2026-10-27)
  "03-backend/navigator/board": ["board.js", "board.css"],   // archi-board 엔진 v1 사본(C-45) — docmap.html이 부른다   // win.html · win.js — 앱의 설정 창 · 퀘스트 창(C-22, 2026-10-21)
  // 서재는 용어 풀이(/03-backend/navigator/glossary.js)도 같이 부른다. 2026-10-19(이재엽): learn.js · skills.js를 지우고, 지식 은하(sky.*)는 내주지 않는다(길을 막음 — 파일은 남김)
  // my-books.js — 내 책 · 예시 책 지우기(2026-10-19 실사용). 내비게이터(`../library/my-books.js`)와 서고가 같이 쓴다
  // book-view.js · book-view.css — 책 보기 설정(C-9 · C-3, 2026-10-20). 내비게이터(`../library/book-view.js`)와 서고가 같이 쓴다
  // shelves.js — 내가 만드는 책장(C-21, 2026-10-20)
  "02-frontend/library": ["index.html", "library.css", "library.js", "books.js", "my-books.js", "book-view.js", "book-view.css", "shelves.js", "schedule.js", "search.js", "spotlight.js"],
  // hub.js — 섬의 알림 · AI 진행 판이 쓰는 순수 함수. 따로 뜨던 모아 보기 창(index.html · hub.css)은 2026-10-23에 뺐다
  "02-frontend/hub": ["hub.js"],
  // 글꼴 셋(C-57, 2026-10-28) — fonts.css가 부른다. 앱 안 파일이라 밖으로 나가는 요청이 없다
  "02-frontend/assets/fonts": ["BagelFatOne-Regular.woff", "GowunDodum-Regular.woff", "NanumGothicCoding-Regular.woff", "NanumGothicCoding-Bold.woff"],
  // 화면 빈칸(2026-10-18): 용어 풀이 · 확인 질문과 잠시 멈추기 · 꼭/나중에 · 작업 알림 기록 · 만드는 크기. 화면이 부르는 파일은 static-files.test.js가 이 목록과 맞대어 본다
  // steps.js — AI 진행(C-12, 2026-10-20): 섬(내비게이터)이 `../../03-backend/navigator/steps.js`로 부른다(한 줄 글 · 서버 없이 보일 예시)
  // approve.js — 승인 카드(FR-17, 2026-10-20): 섬이 서버 없이 보일 예시 카드와 모양을 읽는다
  "03-backend/navigator": ["navigator.js", "scenario.js", "glossary.js", "understand.js", "priority.js", "alerts.js", "tiers.js", "token-view.js", "sensitive.js", "steps.js", "feed.js", "approve.js", "quest.js", "readme-book.js", "md-view.js", "stagemap.js", "queststate.js", "basecard.js", "build.js", "presets.js", "tutorial.js", "plan.js", "docs.js", "carry.js"],   // plan.js — 준비 계획판 규칙(C-34, 2026-10-24)   // quest.js — 퀘스트 규칙(C-22, 2026-10-21)
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
// 작업실 개편 C-61(2026-10-29, API.md 3-31) — 대화 모양이 틀린 까닭(navigator.js talkOf) → 거절 말, 대화의 말마다 비밀값 가림
const TALK_WHY = { empty: "대화가 비어 있음 — 마지막은 사람의 말", shape: "대화 모양이 맞지 않음 — [{ who: me | floro, text }]",
  long: `대화가 너무 김 — ${Nav.CHAT_TURNS_MAX}줄 · 줄 ${Nav.CHAT_LINE_MAX.toLocaleString()}자 · 합 ${Nav.CHAT_TOTAL_MAX.toLocaleString()}자까지` };
const redactTalk = (talk) => talk.map((m) => ({ ...m, text: Sensitive.redact(m.text) }));
const redactPrev = (prev) => prev.map((p) => ({ stage: p.stage, items: p.items.map((x) => ({ ...x, name: Sensitive.redact(x.name), lines: (x.lines || []).map((l) => Sensitive.redact(l)) })) }));   // 지난 단계 결과도 가린 뒤 AI에(새 맥락 리뷰 2026-10-29 막힘)
const none = (v) => v == null || (Array.isArray(v) && !v.length);   // 빈 목록은 '없음'과 같다 — 화면이 [ ]을 보내도 거절하지 않게
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
// here: 그 세션이 앱이 고른 폴더(또는 그 안)에서 도나 — 아니면 화면은 판정의 '일한 증거' · 작업실 파일 카드 · '일하고 있어요'에 쓰지 않는다(F-73, 새 맥락 리뷰). 연결을 뺀 폴더(dir 비움)는 그 자리가 아니다
const stepsSince = (since) => ({ latest: stepSeq, sessions: [...work.values()].reverse().map(({ dir, ...s }) => ({ ...s, here: appProject ? !!dir && inAppProject(dir) : true, steps: s.steps.filter((st) => st.seq > since) })) });

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
  const finish = (decision) => { const p = pending.get(id); if (!p) return; pending.delete(id); clearTimeout(p.timer); countAsk(decision, body.cwd); send(p.res, 200, { ok: true, id, decision }); };
  pending.set(id, { item, res, timer: setTimeout(() => finish("none"), APPROVAL_WAIT), finish });
  touchTask(body.cwd);   // C-50 허락을 구하는 것도 일하고 있다는 표시
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
// 이 알림이 앱이 고른 폴더(또는 그 안)에서 왔나 — 훅은 연결했던 폴더마다 남아서, 플로로가 A를 보는 동안 B에서 쓴 Claude Code의 알림도 온다(임유정 2026-10-28
//   "폴더를 바꿔 열기 전까지는 그냥 폴더 A를 띄워야지"). 앱이 고른 폴더가 없으면 전처럼 모두 그 자리. 바로 가기(심볼릭 링크)는 실제 경로로 맞춘다 — Claude Code는 실제 경로를 보낸다(새 맥락 리뷰)
const realDir = (p) => { try { return fs.realpathSync.native(String(p)); } catch { return path.resolve(String(p)); } };
const inAppProject = (cwd) => {
  if (!appProject || !cwd) return true;
  const rel = path.relative(realDir(appProject.dir), realDir(cwd));   // Windows의 path.relative는 대소문자를 가리지 않는다
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));   // A 안의 '..cache' 같은 폴더는 A
};

// ── FR-17 대화로 일 넘기기 — 허락하면 연결한 폴더에서 claude를 연다(셸 없이, -p, 글은 표준 입력으로). 권한 건너뛰기 옵션은 쓰지 않는다 — 허락은 섬의 승인 카드(위)로 ──
// 폴더는 projectNow(앱이 고른 작업 폴더, 없으면 훅 알림의 cwd)에서만 고른다(화면이 보낸 경로는 받지 않는다). 한 번에 하나. 여는 법은 provider.js startTask(셸 없음 · -p · 표준 입력 · 권한 건너뛰기 없음)
const TASK_MAX = 4000;
let task = null;   // {state: running|done|failed|blocked, project, at, try, code, child, tokens, cost, report, denied, asks, req, dir}
// tokens · cost — 끝났을 때 Claude Code가 알려 준 이번 일의 토큰 · 비용(토큰 장부, 2026-10-24). 모르면 null
// report — 기준(checks)을 같이 넘겼으면 Claude Code가 끝에 답한 기준마다 해냄 · 근거 · 쉬운 말 요약(C-32, navigator.js parseReport). 비밀값 모양은 가린다. 서버 메모리에만
// try — 같은 일을 몇 번째로 다시 맡겼나(F-69 다시 맡기기, 처음은 0). blocked — 끝 코드 0인데 허락을 못 받은 도구가 있으면 그 까닭(아래 blockedOf)
const publicTask = () => (task ? { state: task.state, project: task.project, at: task.at, code: task.code, tokens: task.tokens ?? null, cost: task.cost ?? null, report: task.report ?? null,
  try: task.try || 0, blocked: task.state === "blocked" ? blockedOf(task) : null, denied: task.denied ? task.denied.count : 0, quiet: task.state === "running" ? Math.max(0, Math.floor((Date.now() - (task.lastAt || task.at)) / 1000)) : 0 } : null);
// C-50 맡긴 일이 멈추면(2026-10-28 — 결정 모음 A-06 "시간 값은 리허설에서 재서 정함, 그때까지 2분 · 5분 · 15분, 멈추면 끄지 않고 A-03의 선택창으로"):
//   quiet — 그 일의 폴더(안)에서 훅 알림 · 허락 카드가 마지막으로 온 뒤 지난 초. 몇 초에 무엇을 할지는 화면이 정한다. 서버는 저절로 끄지 않는다 — 끄기는 사람이 고를 때만(stopTask)
const inDir = (dir, cwd) => { if (!dir || !cwd) return false; const rel = path.relative(realDir(dir), realDir(cwd)); return rel === "" || (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel)); };
function touchTask(cwd) { if (task && task.state === "running" && inDir(task.dir, cwd)) task.lastAt = Date.now(); }
// ── F-69 막힘(2026-10-28 — 이재엽 "결과물이 안나오는 문제 해결", 결정 모음 A-03 "허락 팝업을 다시 → 선택창 → 까닭과 가장 가까운 길"): claude -p는 허락을 못 받아도 끝 코드 0 · subtype success다.
//   결과의 permission_denials에서 도구 이름 · 개수만 읽고(tokens.js denialsOf) 0이 아니면 state blocked — 화면이 '끝남' 대신 막혔다고 말하고 사람이 길을 고른다. **대신 허용하는 길은 없다**(FR-17)
//   asks — 그 일이 도는 동안 섬의 허락 카드에 어떻게 답했나(허용 · 거절 · 답 없음 none). 카드를 못 눌렀는지, 거절했는지, 카드가 뜨지도 않았는지를 가른다
const DENY_KIND = { Write: "파일 쓰기", Edit: "파일 쓰기", MultiEdit: "파일 쓰기", NotebookEdit: "파일 쓰기", Bash: "명령", WebFetch: "인터넷", WebSearch: "인터넷" };
function blockedOf(t) {
  const kinds = [];
  for (const [tool, n] of Object.entries((t.denied && t.denied.tools) || {})) { const what = DENY_KIND[tool] || "다른 도구", k = kinds.find((x) => x.what === what); if (k) k.n += n; else kinds.push({ what, n }); }
  return { count: (t.denied && t.denied.count) || 0, kinds, asks: { ...t.asks } };
}
// 그 일의 폴더(안)에서 온 허락 답만 센다 — 같은 때 다른 폴더의 Claude Code에서 누른 답이 섞이지 않게(새 맥락 리뷰 2026-10-28)
function countAsk(decision, cwd) { if (task && task.state === "running" && task.asks && Object.prototype.hasOwnProperty.call(task.asks, decision) && inDir(task.dir, cwd)) { task.asks[decision] += 1; task.lastAt = Date.now(); } }
// 경로도 가린다(2026-10-24 리뷰) — 작업 폴더 앞부분은 '.'으로, 홈 폴더(/Users/이름 · /home/이름 · C:\Users\이름)는 '~'로. 보고는 화면에 보이고 이 컴퓨터의 브라우저 저장소에도 남는다
const hidePaths = (t, dir) => (dir ? String(t).split(dir).join(".") : String(t)).replace(/\/(?:Users|home)\/[^/\s]+/g, "~").replace(/[A-Za-z]:\\Users\\[^\\\s]+/gi, "~");
const hide = (t, dir) => Sensitive.redact(hidePaths(t, dir));
const hideReport = (r, dir) => (r ? { ...r, easy: hide(r.easy, dir), ask: hide(r.ask, dir), items: r.items.map((x) => ({ ...x, evidence: hide(x.evidence, dir) })) } : null);
const CHECK_LINE_MAX = 200;
// 기준 목록이 맞는 모양인가 — 1~12줄 · 글 · 한 줄 200자. 맞으면 다듬은 목록, 아니면 null
const checksOf = (c) => (Array.isArray(c) && c.length >= 1 && c.length <= Nav.CHECKS_MAX && c.every((x) => Nav.filled(x) && x.length <= CHECK_LINE_MAX) ? c.map((x) => x.trim()) : null);
const NO_FOLDER = "연결한 프로젝트 폴더를 아직 몰라요 — 처음 설정의 '프로젝트'에서 고르거나, 그 폴더에서 Claude Code를 한 번 열면 알게 돼요";
const NO_HOOK = { none: "이 폴더에는 허락 카드를 띄우는 연결이 없어요 — 맡기면 파일 쓰기 · 명령이 모두 막혀요. Floe 앱 메뉴의 '프로젝트 폴더 연결…'로 이 폴더를 다시 연결해 주세요",
  moved: "이 폴더의 허락 연결이 옛 자리(앱을 옮기기 전)를 가리켜요 — Floe 앱 메뉴의 '프로젝트 폴더 연결…'로 이 폴더를 다시 연결해 주세요" };
// 다시 맡기기(F-69) — again: 같은 글 그대로(허락 카드가 다시 뜬다), files-only: 명령 없이 파일만(명령이 막혔을 때 결과에 가장 가까운 길)
const FILES_ONLY = "\n\n[다시 맡김 — 명령 없이] 터미널 명령(Bash)은 쓰지 말고 파일만 만들거나 고쳐 주세요. 실행 · 설치 명령이 필요하면 README의 '실행하는 법'에 적기만 해요.";
// opts.at · opts.try — 다시 맡기기는 같은 번호(at)로(지켜보던 화면 — 계획 줄 · 문서 올리기 — 이 그대로 따라간다), opts.note — 글 끝에 더할 한 줄(길이 제한 밖)
function startTask(text, label = "맡긴 일", checks = null, opts = {}) {
  if (String(text).length > TASK_MAX) return [400, { ok: false, reason: `넘긴 글이 너무 김 — ${TASK_MAX.toLocaleString()}자까지` }];
  const s = projectNow();
  if (!s) return [400, { ok: false, reason: NO_FOLDER }];
  if (task && task.state === "running") return [409, { ok: false, reason: "넘긴 일이 아직 진행 중이에요 — 끝난 뒤 다시 넘겨요" }];
  const hk = Connect.hookReady(s.dir);
  if (!hk.ok) return [409, { ok: false, why: "hook", reason: NO_HOOK[hk.why] || NO_HOOK.none }];
  let child;
  // 끝나면(close 전에 provider가 부른다) 장부에 task로 — 토큰 · 비용 · 거절된 도구의 이름 · 개수만, 답 글은 받지 않는다
  const onResult = (r) => {
    if (!r) return;
    ledger.add("task", label, r.usage, r.cost);
    if (task && task.child === child) { task.tokens = r.usage.total; task.cost = r.cost; task.denied = r.denials || null; task.isError = !!r.isError; task.report = checks ? hideReport(Nav.parseReport(r.output, checks), s.dir) : null; }
  };
  const body = opts.note ? `${String(text).trim()}${opts.note}` : text;
  try { child = openClaude({ dir: s.dir, text: checks ? Nav.taskBrief(body, checks) : body, onResult, schema: checks ? Nav.REPORT_SCHEMA : null }); }
  catch { return [502, { ok: false, reason: "claude를 열지 못함 — Claude Code가 설치됐는지 확인하세요" }]; }
  // label — 무슨 일인지(저장 커밋 · 문서 올리기 · 맡긴 일) — 파일 저장의 '맡긴 일이 도는 중' 판단에 쓴다(C-43). req — 다시 맡기기 · 직접 하기에 쓸 처음 글(메모리에만)
  task = { state: "running", label, project: s.project, at: Number.isFinite(opts.at) ? opts.at : Date.now(), lastAt: Date.now(), try: opts.try || 0, code: null, child, tokens: null, cost: null, report: null,
    denied: null, asks: { allow: 0, deny: 0, none: 0 }, req: { text: String(text), label, checks }, dir: s.dir };
  child.on("error", () => { if (task && task.child === child) task.state = "failed"; });
  // 막힘은 기계 신호로만 — 거절 수가 그 일 동안 섬에서 사람이 누른 '거절' 수보다 많으면(답이 없었거나 카드가 안 뜬 거절이 있으면) blocked.
  //   사람이 고른 거절뿐이면 done(denied에 수 — 화면이 한 줄로 말한다). 모델의 보고(해냄)는 믿지 않는다(진짜 Claude Code로 본 일 · 새 맥락 리뷰 2026-10-28)
  const unasked = () => (task.denied ? task.denied.count : 0) > (task.asks ? task.asks.deny : 0);
  child.on("close", (code) => { if (task && task.child === child) { task.state = task.stopped ? "stopped" : code !== 0 || task.isError ? "failed" : unasked() ? "blocked" : "done"; task.code = code; } });
  return [200, { ok: true, project: s.project, task: publicTask() }];
}
// C-50 멈추기 — 본문 { at }. 사람이 선택창에서 '다시 맡기기' · '그만두기'를 고를 때만 부른다(서버는 저절로 끄지 않는다). 그 번호의 도는 일만, 끝나면 state stopped
function stopTask(body) {
  const b = body && typeof body === "object" ? body : {};
  if (!task || b.at !== task.at) return [409, { ok: false, reason: "다른 일이에요 — 화면을 새로 보고 다시 눌러요" }];
  if (task.state !== "running") return [409, { ok: false, reason: "도는 일이 아니에요" }];
  task.stopped = true;
  try { task.child.kill(); } catch {}
  return [200, { ok: true, task: publicTask() }];
}
// 막힌 · 실패한 · 멈춘 일을 다시(F-69) — 본문 { at, way: again | files-only | brief }. brief는 아무것도 열지 않고 맡길 글 + 끝 조건을 돌려준다(직접 하기 — 사람이 Claude Code에 붙여 넣는다)
function retryTask(body) {
  const b = body && typeof body === "object" ? body : {};
  if (!task || !task.req) return [404, { ok: false, reason: "다시 맡길 일이 없어요" }];
  if (b.at !== task.at) return [409, { ok: false, reason: "다른 일이에요 — 화면을 새로 보고 다시 눌러요" }];
  if (b.way === "brief") {   // 직접 하기 글 — 아무것도 열지 않으니 도는 중에도(C-50 멈춘 것 같을 때의 선택창)
    const c = task.req.checks || [];
    return [200, { ok: true, brief: hide([task.req.text.trim(), ...(c.length ? ["", "끝 조건:", ...c.map((x, i) => `(${i + 1}) ${x}`)] : [])].join("\n"), task.dir) }];
  }
  if (task.state === "running") return [409, { ok: false, reason: "넘긴 일이 아직 진행 중이에요 — 끝난 뒤 다시 넘겨요" }];
  if (task.state === "done") return [409, { ok: false, reason: "이미 끝난 일이에요 — 새로 맡겨요" }];
  if (b.way !== "again" && b.way !== "files-only") return [400, { ok: false, reason: "way는 again · files-only · brief 중 하나" }];
  return startTask(task.req.text, task.req.label, task.req.checks, { at: task.at, try: (task.try || 0) + 1, note: b.way === "files-only" ? FILES_ONLY : "" });
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
// ── C-56 R-4 이미 있는 내용 옮겨 적기(API.md 3-30, 2026-10-28 — 이재엽 버튼 "'옮김' 새 값"): 마지막 목록(3-25)의 글 파일(md · txt, 64KB까지, 20개까지)에서 그 칸의 답 후보 줄을 찾는다 ──
//   답은 가린 경로 · 줄 번호 · 원문(가린 것) · 목록 번호(파일 보기로 열 수 있게). 경로를 요청에서 받지 않는다(C-43과 같은 규칙). 읽기만
const FIND_FILES_MAX = 20, FIND_FILE_MAX = 64 * 1024;
function findNow(q) {
  const s = projectNow();
  if (!lastFiles || !s || path.resolve(s.dir) !== path.resolve(lastFiles.dir)) return { ok: true, found: [], why: "folder", reason: "파일 목록을 먼저 받아야 해요(작업실을 다시 열어요)" };
  const docs = [];
  for (let i = 0; i < lastFiles.list.length && docs.length < FIND_FILES_MAX; i++) {
    const e = lastFiles.list[i]; if (e.dir || !["md", "text"].includes(Files.kindOf(e.raw))) continue;
    const file = Files.safePath(lastFiles.dir, e.raw); if (!file) continue;
    try { const st = fs.statSync(file); if (!st.isFile() || st.size > FIND_FILE_MAX) continue; const buf = fs.readFileSync(file); if (!Files.isText(buf)) continue; docs.push({ i, path: e.path, text: buf.toString("utf8") }); } catch { /* 못 읽는 파일은 건너뛴다 */ }
  }
  const found = FindLines.find(docs, { name: q }).map((x) => ({ ...x, text: Sensitive.redact(x.text) }));
  return { ok: true, found, files: docs.length, why: "" };
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
  return [200, { ok: true, mtime, task: code === 200 ? out.task : null, note: code === 200 ? "" : out.why === "hook" ? `커밋은 맡기지 못했어요 — ${out.reason}` : "저장했어요 · 커밋은 앞 일이 끝난 뒤 다시 저장하면 맡겨요" }];   // why hook — 허락 연결이 없는 폴더(F-69)   // 커밋을 못 맡겨도 저장은 됐다 — 무엇이 빠졌는지 분명히(security-records 6-1)
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
  const carry = body.carry == null ? [] : body.carry;   // C-51 — 이번 단계에 쓰기로 고른 가져온 것(C-48 carryUse, 3개 · 160자)
  if (!Array.isArray(carry) || carry.length > 3 || !carry.every((x) => strOk(x, Carry.TEXT_MAX) && Nav.filled(x))) return refuse(res, "가져온 것의 모양이 맞지 않음");
  const s = body.readme === false ? null : projectNow(), r = s && readmeText(s.dir);
  const readme = r ? r.text.slice(0, PLAN_README_MAX) : "", files = s ? topFiles(s.dir) : [];
  // C-51: 근거 — 폴더를 읽어도 될 때만(readme false면 넣은 글 · 가져온 것만) 단계 문서에서 정한 줄을 읽는다. 규칙은 그 줄 전부(오래된 것부터 — 뒤가 앞을 덮는다), AI에는 가린 뒤 4,000자(새 것부터)
  const decided = s ? decidedLines(s.dir) : [], basis = planBasis(decided, carry), D = Plan.decisionsOf(decided.map((x) => x.text).join("\n"));
  // C-51: 근거가 있으면 줄마다 근거(없으면 '새로 정함')와 앞의 결정과 다름(규칙 — plan.js differs)을 붙인다
  const read = (d) => { const p = Nav.parsePlan(d); if (!p) return null; if (basis) p.items = p.items.map((x) => { const diff = Plan.differs(`${x.need} ${x.check}`, D); return { ...x, basis: x.basis || "새로 정함", ...(diff ? { diff } : {}) }; }); return { plan: p }; };
  return ask(res, Nav.planPrompt({ text: body.text, readme, files, prev, notes: notes.map((n) => ({ need: n.need, check: n.check, note: n.note })), answers: answers.map((a) => ({ q: a.q, a: a.a })), general, ...(basis ? { basis } : {}) }),
    basis ? Nav.PLAN_BASIS_SCHEMA : Nav.PLAN_SCHEMA, read, "계획");
}
// ── 지식 퀘스트 C-51(2026-10-29 — PRD 6절 · 9절 9번 "근거는 가린 뒤 4,000자까지"): 계획의 근거 ──
// 사람이 정한 줄 — 폴더의 단계 문서(원본, C-49)에서 칸마다 '정한 것'(결정 기록의 '정한 것' 칸과 같은 줄 — docs.js가 같은 기록으로 둘을 쓴다). 단계 순서(오래된 것부터)
function decidedLines(dir) {
  const out = [];
  Docs.SLUGS.forEach((_, n) => {
    const t = docTargets(dir, [{ path: Docs.stagePath(n) }]);
    if (t.why) return;
    let text; try { const st = fs.lstatSync(t.list[0].file); if (!st.isFile() || st.size > DOC_READ_MAX) return; text = fs.readFileSync(t.list[0].file, "utf8"); } catch { return; }
    const p = Docs.parseStage(text);
    if (p && p.n === n) for (const it of p.result.items) for (const line of it.lines) if (line.trim()) out.push({ n, text: line, label: `${n + 1}단계 ${Quest.shortOf(it.name)}` });
  });
  return out;
}
// 근거 글 — 가져온 것 → 정한 줄(새 단계부터)을 가린 뒤 4,000자까지(넘치면 오래된 단계의 줄이 잘린다). 둘 다 없으면 ""
function planBasis(notes, carry) {
  const parts = [...(carry.length ? ["[가져온 것 — 지난 프로젝트에서 이번에 쓰기로 고른 것]", ...carry.map((x) => `- ${x}`)] : []),
    ...(notes.length ? ["[앞에서 정한 것 — 새 단계부터]", ...[...notes].reverse().map((x) => `- ${x.label}: ${x.text}`.slice(0, 200))] : [])];
  return parts.length ? Sensitive.redact(parts.join("\n")).slice(0, Nav.PLAN_BASIS_MAX) : "";
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
//   items는 화면이 같이 보내는 값이라 모양만 검사해 넘긴다 — 지금 docs.js는 reason과 check[].skipped만 읽는다(새 맥락 리뷰 2026-10-28: 읽는 곳이 생기기 전까지는 쓰지 않는 값)
const skipOk = (k) => k && typeof k === "object" && !Array.isArray(k) && strOk(k.reason, CHECK_LINE_MAX) && (k.items == null || (Array.isArray(k.items) && k.items.length <= 8 && k.items.every((x) => strOk(x, ITEM_NAME_MAX))));
// 지식 퀘스트 C-47(2026-10-29): 관문에서 사람이 적은 배운 것(learned — 400자, ""는 '비어 있음' · A-13 막지 않음)과 처음 뜻(goal — { same: true } 또는 { changed: 새 말 200자 })
const LEARNED_MAX = 400;
const goalOk = (g) => g && typeof g === "object" && !Array.isArray(g) && (Object.keys(g).join() === "same" ? g.same === true : Object.keys(g).join() === "changed" && strOk(g.changed, CHECK_LINE_MAX) && Nav.filled(g.changed));
const stageExtraOk = (v) => (v.prep == null || (Array.isArray(v.prep) && v.prep.length <= Nav.PREP_MAX && v.prep.every((x) => strOk(x, Nav.PREP_LINE))))
  && (v.at == null || (typeof v.at === "string" && DATE_RE.test(v.at))) && (v.passed == null || (typeof v.passed === "string" && DATE_RE.test(v.passed))) && (v.check == null || checkOk(v.check))
  && (v.checkBy == null || v.checkBy === "confirm")
  && (v.skip == null || skipOk(v.skip)) && (v.nocode == null || v.nocode === true)
  && (v.learned == null || strOk(v.learned, LEARNED_MAX)) && (v.goal == null || goalOk(v.goal));   // nocode — 6단계를 코드 없이 지남(A-04 '아니요', F-70)   // C-40 — 완료 기준을 누가 봤나(confirm = 초안을 칸마다 확인, AI 판정 없이 · 없으면 AI가 살펴봄)
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
      ...(v.skip ? { skip: { reason: v.skip.reason, items: Array.isArray(v.skip.items) ? [...v.skip.items] : [] } } : {}), ...(v.nocode === true ? { nocode: true } : {}),
      ...(typeof v.learned === "string" ? { learned: v.learned } : {}), ...(v.goal ? { goal: v.goal.same ? { same: true } : { changed: v.goal.changed } } : {}) };
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
const SOURCE_MAX = 64 * 1024, BASE_MAX = 1500;
const CARD_KEYS = ["what", "who", "size", "fixed", "materials", "data", "out", "success"];
const cardFieldOk = (f) => f && typeof f === "object" && strOk(f.text || "", 200) && (f.by == null || f.by === "moved" || f.by === "me") && (f.note == null || strOk(f.note, 120))
  && (f.lines == null || (Array.isArray(f.lines) && f.lines.length <= 8 && f.lines.every((x) => x && strOk(x.text, 200) && Number.isInteger(x.line)))) && (f.from == null || (Array.isArray(f.from) && f.from.length <= 4));
const cardOk = (c) => c && typeof c === "object" && !Array.isArray(c) && Object.keys(c).every((k) => CARD_KEYS.includes(k)) && Object.values(c).every(cardFieldOk);
const cardClean = (c) => Object.fromEntries(CARD_KEYS.filter((k) => c[k]).map((k) => { const f = c[k]; return [k, { text: f.text || "", by: f.by || null, blank: !f.text, ...(f.note ? { note: f.note } : {}), ...(f.lines ? { lines: f.lines.map((x) => ({ text: x.text, line: x.line })), src: f.lines.length > 0 } : {}), ...(f.from ? { from: f.from.filter((x) => x && Number.isInteger(x.s) && Number.isInteger(x.i)).map((x) => ({ s: x.s, i: x.i })) } : {}) }]; }));
function shipDocs(body) {
  const got = resultsOf(body && body.results), topic = body && body.topic != null ? body.topic : "", idea = body && body.idea != null ? body.idea : "";
  if (got.why) return [400, { ok: false, reason: got.why }];
  if (!strOk(topic, 60)) return [400, { ok: false, reason: "주제는 60자까지" }];
  if (!strOk(idea, Nav.IDEA_MAX)) return [400, { ok: false, reason: `처음 말한 것은 ${Nav.IDEA_MAX}자까지` }];
  const source = body && body.source != null ? body.source : "";   // F-68 — 받은 글 전부(docs/00-source/idea.md에 통째로). 64KB까지 — 넘으면 잘라 쓰지 않고 거절한다(화면이 알린다)
  if (!strOk(source, SOURCE_MAX)) return [400, { ok: false, reason: `받은 글 전부는 ${SOURCE_MAX / 1024}KB까지` }];
  const card = body && body.card != null ? body.card : null;   // C-56 R-1 기준 카드 — 칸마다 { text, by, blank, lines?, note? }, 모양이 틀리면 400
  if (card !== null && !cardOk(card)) return [400, { ok: false, reason: "기준 카드의 모양이 맞지 않음 — 칸마다 글 200자 · 누가는 moved · me" }];
  const results = got.results;
  const s = projectNow();
  if (!s) return [400, { ok: false, reason: NO_FOLDER }];
  if (task && task.state === "running") return [409, { ok: false, reason: "넘긴 일이 아직 진행 중이에요 — 끝난 뒤 다시 올려요" }];   // 쓰기 전에(쓰고 나서 못 맡기지 않게)
  { const hk = Connect.hookReady(s.dir); if (!hk.ok) return [409, { ok: false, why: "hook", reason: NO_HOOK[hk.why] || NO_HOOK.none }]; }   // 허락 연결도 쓰기 전에(F-69 — 커밋 · 푸시가 모두 막힌 채 문서만 남지 않게)
  // C-52(2026-10-29, 지식 퀘스트 PRD 9절 10번): 푸시할 곳(origin)이 공개(또는 모름)면 저장소마다 처음 한 번 묻는다 — 쓰기 전에. 화면이 '올릴게요'면 publicOk: true로 다시 보낸다.
  //   이미 '올릴게요'를 받은 저장소는 gh를 부르지 않는다(서버를 붙잡지 않게)
  { const o = GH.originKey(s.dir);
    if (o && !PublicOk.has(o.key)) {
      const vis = GH.visibility(o);
      if (vis !== "private") {
        if (body.publicOk !== true) return [409, { ok: false, why: "public", reason: PublicOk.say(vis) }];
        try { PublicOk.remember(o.key); } catch { return [500, { ok: false, reason: "올려도 된다는 답을 이 컴퓨터에 남기지 못했어요 — 다시 해 주세요" }]; }
      }
    } }
  // C-49(2026-10-29): 화면이 아는 단계 문서 지문({ 경로: 지문 } — Floe가 마지막에 쓴 것). 주면 지금 폴더의 글이 그 지문과 다른(사람이 고친 · Floe가 쓰지 않은) 단계 문서는
  //   덮지 않고 kept로 알린다 — 기록의 원본은 폴더다. 주지 않으면(옛 기록 · 새로 시작) 전처럼 쓴다
  //   keep(경로 목록)은 화면이 사람 것으로 아는 단계 문서(되읽어 다시 쓰면 다른 글 · 읽을 수 없는 글) — 있으면 덮지 않는다. 화면이 모르는(지문도 keep도 없는) 문서는 Floe 것으로 보고 쓴다
  const known = body && body.prints != null ? body.prints : null, keep = body && body.keep != null ? body.keep : [];
  const isStagePath = (k) => Docs.SLUGS.some((_, n) => Docs.stagePath(n) === k);
  if ((known !== null && !(known && typeof known === "object" && !Array.isArray(known) && Object.entries(known).every(([k, v]) => isStagePath(k) && typeof v === "string" && /^[0-9a-f]{16}$/.test(v))))
    || !Array.isArray(keep) || keep.length > Docs.SLUGS.length || !keep.every((k) => typeof k === "string" && isStagePath(k)))
    return [400, { ok: false, reason: "문서 지문의 모양이 맞지 않음" }];
  const files = Docs.files({ topic, idea, source, results, card: card ? cardClean(card) : null, redact: Sensitive.redact });
  const t = docTargets(s.dir, files);
  if (t.why) return [400, { ok: false, reason: t.why }];
  const isStage = (f) => !f.merge && !!Docs.parseStage(f.text);
  const kept = t.list.filter((f) => isStage(f) && fs.existsSync(f.file) && (keep.includes(f.path) || (known && known[f.path] && (() => { try { return printOf(fs.readFileSync(f.file, "utf8")) !== known[f.path]; } catch { return true; } })()))).map((f) => f.path);
  const writes = t.list.filter((f) => !kept.includes(f.path));
  try {
    for (const f of writes) {
      fs.mkdirSync(path.dirname(f.file), { recursive: true });
      fs.writeFileSync(f.file, f.merge ? Docs.mergeSection(fs.existsSync(f.file) ? fs.readFileSync(f.file, "utf8") : "", f.text) : f.text);
    }
  } catch { return [500, { ok: false, reason: "문서를 쓰지 못했어요 — 작업 폴더의 쓰기 권한을 봐 주세요" }]; }
  // 끝에 기준마다 보고하게 한다(C-32) — 화면이 '올라갔다'를 Claude Code의 답(푸시함)으로만 말하게
  // C-49(2026-10-29): 쓴 단계 문서마다 글 지문 — 화면이 기억해 두었다가 폴더의 글이 바뀌면 '낡음'으로 알아본다(GET /api/docs)
  const prints = Object.fromEntries(writes.filter(isStage).map((f) => [f.path, printOf(f.text)]));
  const paths = writes.map((f) => f.path), [code, out] = startTask(Docs.shipRequest(paths), "문서 올리기", Docs.SHIP_CHECKS);
  return [code, { ...out, files: paths, prints, kept, key: folderKey(s.dir) }];
}

// ── 지식 퀘스트 C-49(2026-10-29 — PRD 6절 · 9절 3 · 4번 "사람이 확인한 기록만" · "글 지문"): 기록의 원본은 프로젝트 폴더 ──
// 폴더의 단계 문서를 다시 읽어 단계마다 { path, print, result } — 브라우저 기록을 지웠으면 되살리고, 지문이 다르면 '낡음'. 읽기만.
//   바로가기 · 파일이 아닌 것 · 256KB 넘는 것은 읽지 않는다. 손으로 넣은 비밀값도 가린 뒤 준다(이 결과는 뒤에 AI 묻는 글의 재료가 된다 — C-52)
const DOC_READ_MAX = 256 * 1024;
// 폴더 열쇠 — 이름이 같은 다른 폴더의 지문과 견주지 않게(폴더 이름이 아니라 실제 경로의 sha256 앞 16자 — 경로는 내지 않는다)
const folderKey = (dir) => crypto.createHash("sha256").update(realDir(dir)).digest("hex").slice(0, 16);
const printOf = (text) => crypto.createHash("sha256").update(String(text).replace(/\r\n?/g, "\n")).digest("hex").slice(0, 16);   // 줄 끝(CRLF)만 다른 것은 같은 글 — git이 줄 끝을 바꿔도 낡음이 아니다
const redactDeep = (v) => (typeof v === "string" ? Sensitive.redact(v) : Array.isArray(v) ? v.map(redactDeep) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redactDeep(x)])) : v);
function docsRead() {
  const s = projectNow();
  if (!s) return { ok: true, project: "", topic: "", idea: "", source: "", stages: {}, why: "folder" };
  const readDoc = (p) => { const t = docTargets(s.dir, [{ path: p }]); if (t.why) return null; try { const st = fs.lstatSync(t.list[0].file); return st.isFile() && st.size <= DOC_READ_MAX ? fs.readFileSync(t.list[0].file, "utf8") : null; } catch { return null; } };
  const stages = {}, got = {}; let topic = "", idea = "";
  Docs.SLUGS.forEach((_, n) => {
    const p = Docs.stagePath(n), text = readDoc(p);
    if (text == null) return;
    const r = Docs.parseStage(text);
    if (!r || r.n !== n) { stages[n] = { path: p, print: printOf(text), result: null }; return; }   // 있지만 Floe가 읽을 수 없게 바뀐 문서 — 지우지도 덮지도 않는다(화면이 낡음으로)
    got[n] = { text, r };
    if (!topic && r.topic) topic = r.topic;
    if (n === 0 && r.idea != null) idea = r.idea;
  });
  const source = Docs.parseSource(readDoc(Docs.SOURCE_DOC) || "") || "";   // 받은 글 전부(F-68)
  // 되읽은 것으로 다시 쓰면 같은 글인가(lossless) — 같을 때만 화면이 'Floe가 덮어도 되는 문서'로 기억한다(사람이 더한 글을 다음 올리기에서 잃지 않게)
  const again = Docs.files({ topic, idea, source, results: Object.fromEntries(Object.entries(got).map(([n, x]) => [n, x.r.result])), redact: (x) => x });
  const norm = (t) => String(t).replace(/\r\n?/g, "\n");
  for (const [n, x] of Object.entries(got)) {
    const f = again.find((y) => y.path === Docs.stagePath(Number(n)));
    stages[n] = { path: Docs.stagePath(Number(n)), print: printOf(x.text), result: redactDeep(x.r.result), lossless: !!f && norm(f.text) === norm(x.text) };
  }
  return { ok: true, project: s.project, key: folderKey(s.dir), topic: Sensitive.redact(topic), idea: Sensitive.redact(idea), source: Sensitive.redact(source), stages };
}

// ── 지식 퀘스트 C-48(2026-10-29 — PRD 6절 · 9절 1 · 2번 이재엽 버튼 "이 컴퓨터의 Floe 폴더" · "기준 다섯 · 3개 · 미루면 보류"): 다음 프로젝트로 가져가기 ──
// 장부는 여러 프로젝트에 걸치므로 저장소가 아니라 이 컴퓨터의 파일 하나(NAV_USAGE_FILE 옆 -carry.json, 없으면 홈의 .navigator-carry.json, 600). 규칙은 carry.js
const carryFile = () => (process.env.NAV_USAGE_FILE ? process.env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-carry.json") : path.join(os.homedir(), ".navigator-carry.json"));
function carryBook() { try { return Carry.revive(JSON.parse(fs.readFileSync(carryFile(), "utf8"))); } catch { return Carry.blank(); } }
function carrySave(book) {
  const f = carryFile(), tmp = `${f}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(book), { mode: 0o600 });
  fs.renameSync(tmp, f);
}
// 결정 기록 — 작업 폴더의 docs/decisions.md, 가린 뒤 4,000자까지(PRD 9절 9번). 바로가기 · 파일이 아닌 것 · 너무 큰 것은 읽지 않는다
function decisionsText(dir) {
  const t = docTargets(dir, [{ path: Docs.LOG_DOC }]);
  if (t.why) return "";
  try { const st = fs.lstatSync(t.list[0].file); if (!st.isFile() || st.size > DOC_READ_MAX) return ""; return Sensitive.redact(fs.readFileSync(t.list[0].file, "utf8")).slice(0, Nav.CARRY_DECISIONS_MAX); } catch { return ""; }
}
// POST /api/carry/draft { topic, lessons: [{ stage, text }] } — 단계마다 사람이 쓴 배운 것(관문의 칸)과 결정 기록으로 초안. 둘 다 가린 뒤 자료로만(C-52)
async function carryDraft(res, body) {
  const lessons = body.lessons, topic = body.topic != null ? body.topic : "";
  if (!Array.isArray(lessons) || lessons.length > Nav.STAGES.length || !lessons.every((x) => x && Number.isInteger(x.stage) && x.stage >= 0 && x.stage < Nav.STAGES.length && strOk(x.text, LEARNED_MAX)))
    return refuse(res, "배운 것의 모양이 맞지 않음 — 단계마다 400자까지");
  if (!strOk(topic, 60)) return refuse(res, "주제는 60자까지");
  const s = projectNow(), today = Carry.today(), decisions = s ? decisionsText(s.dir) : "";
  if (!lessons.some((x) => Nav.filled(x.text)) && !decisions) return refuse(res, "배운 것도 결정 기록도 없어요 — 관문에서 적은 배운 것이나 결정 기록으로 초안을 만들어요");
  const args = { topic: Sensitive.redact(topic), lessons: lessons.map((x) => ({ stage: x.stage, text: Sensitive.redact(x.text) })), decisions, today };
  const r = await callClaude(Nav.carryPrompt(args), Nav.CARRY_SCHEMA, { label: "가져갈 것" });
  let got = r.data && Nav.parseCarry(r.data), tokens = r.tokens || 0;
  if (!got) return refuse(res, r.error || "가져갈 것 형식이 맞지 않음", 502);
  const fix = got.items.map((d, i) => ({ i, missing: Carry.missing(Carry.measure(d, today)) })).filter((f) => f.missing.length);
  if (fix.length) {   // 한 번만 다시(PRD 6절) — 지난 초안을 같이 보이고, 초안마다 기준을 더 채운 쪽을 남긴다. 그래도 못 채우면 그대로 보이고 사람이 고친다
    const r2 = await callClaude(Nav.carryPrompt({ ...args, fix, prev: got.items }), Nav.CARRY_SCHEMA, { label: "가져갈 것" });
    const again = r2.data && Nav.parseCarry(r2.data);
    tokens += r2.tokens || 0;
    if (again) got = { say: again.say, items: got.items.map((d, i) => (again.items[i] && Carry.score(again.items[i], today) > Carry.score(d, today) ? again.items[i] : d)) };
  }
  return send(res, 200, { ok: true, drafts: got.items, say: got.say, tokens, retried: fix.length > 0 });
}
// GET /api/carry?stage=n — 다른 프로젝트에서 채택한 것 중 그 단계에 닿는 것(최대 3개) · 보류한 것
function carryGet(q) {
  const stage = Number(q);
  if (q == null || q === "" || !Number.isInteger(stage) || stage < 0 || stage >= Nav.STAGES.length) return { ok: false, why: "stage", reason: "단계 번호(0 ~ 7)가 필요해요" };
  const s = projectNow(), key = s ? folderKey(s.dir) : "", book = carryBook();
  return { ok: true, items: Carry.forStage(book, stage, key), held: Carry.held(book, key) };
}
// POST /api/carry { action: adopt | reject | hold, item, reason?, id? } — 사람이 고른 것을 장부에. 반려는 까닭과 함께, 지우지 않는다. 글은 가린 뒤
function carryPost(body) {
  const state = { adopt: "adopted", reject: "rejected", hold: "held" }[body.action];
  if (!state) return [400, { ok: false, reason: "action은 adopt · reject · hold 중 하나" }];
  const it = body.item, reason = body.reason != null ? body.reason : "", id = body.id != null ? body.id : "";
  if (!it || typeof it !== "object" || !strOk(it.text, Carry.TEXT_MAX) || (it.why != null && !strOk(it.why, Carry.WHY_MAX)) || !strOk(reason, Carry.REASON_MAX) || !(id === "" || (typeof id === "string" && /^c[0-9a-z]{1,30}$/.test(id)))
    || (it.stage != null && !Number.isInteger(it.stage)) || (it.review != null && !strOk(it.review, 10)) || (it.from != null && !(Array.isArray(it.from) && it.from.length <= Nav.STAGES.length)))
    return [400, { ok: false, reason: "가져갈 것의 모양이 맞지 않음" }];
  const s = projectNow(), book = carryBook(), from = (Carry.clean(it) || { from: [] }).from;
  const next = Carry.decide(book, { ...it, text: Sensitive.redact(it.text), why: Sensitive.redact(String(it.why || "")) }, state,
    { reason: Sensitive.redact(reason), project: s ? s.project : "", key: s ? folderKey(s.dir) : "", docs: from.map((n) => Docs.stagePath(n)), at: Carry.today(), id });   // docs — 근거 단계 문서를 잇는다(그 프로젝트 안의 경로)
  if (!next) return [400, { ok: false, reason: state === "rejected" ? "반려는 까닭을 한 줄 적어야 해요 — 반려도 지우지 않고 남겨요(이미 반려한 것은 다시 고르지 않아요)" : state === "adopted" ? "언제 쓰는지(단계)를 골라야 채택할 수 있어요" : "가져갈 것의 모양이 맞지 않음" }];
  try { carrySave(next); } catch { return [500, { ok: false, reason: "이 컴퓨터에 남기지 못했어요 — 다시 해 주세요" }]; }
  return [200, { ok: true, id: next.items[next.items.length - 1].id }];
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
  const ev = { seq: ++seq, at: Date.now(), kind, tool, project: Sensitive.redact(path.basename(String(body.cwd || ""))), here: inAppProject(body.cwd), work: recent(log) };
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
    return send(res, 200, { ok: true, latest: seq, project: appProject ? appProject.project : "", events: events.filter((e) => e.seq > since) });   // project: 앱이 고른 폴더 이름 — 화면의 이름은 이것만 따른다(없으면 전처럼 알림의 폴더)
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
  if (req.method === "GET" && route === "/api/docs") return send(res, 200, docsRead());   // C-49 폴더의 단계 문서를 다시 읽는다(API.md 3-23-1) — 읽기만
  if (req.method === "GET" && route === "/api/carry") { const r = carryGet(new URL(req.url, "http://localhost").searchParams.get("stage")); return send(res, r.ok ? 200 : 400, r); }   // C-48 그 단계에 가져온 것(API.md 3-33) — 읽기만
  if (req.method === "POST" && route === "/api/carry") { const body = await readJson(req); if (body === TOO_BIG) return refuse(res, "너무 커요", 413); const [code, out] = carryPost(body || {}); return send(res, code, out); }   // C-48 채택 · 반려 · 보류
  if (req.method === "GET" && route === "/api/files") return send(res, 200, filesNow());   // C-42 R-8 작업실 파일 칸(API.md 3-25) — 이름만, 읽기만
  if (req.method === "GET" && route === "/api/docmap") { const [code, out] = await docmapNow(new URL(req.url, "http://localhost").searchParams.get("now") || ""); return send(res, code, out); }   // C-45 문서 지도(API.md 3-27) — 읽기만
  if (req.method === "GET" && route === "/api/find") { const q = String(new URL(req.url, "http://localhost").searchParams.get("q") || "").trim().slice(0, 200); if (!q) return send(res, 400, { ok: false, why: "q", reason: "무엇을 찾을지가 없어요" }); return send(res, 200, findNow(q)); }   // C-56 R-4 폴더에서 후보 줄(API.md 3-30) — 읽기만
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
    if (ev) touchTask(body.cwd);   // C-50 그 일의 폴더에서 온 알림 — 아직 일하고 있다
    return ev ? send(res, 200, { ok: true, seq: ev.seq }) : refuse(res, "알 수 없는 알림");
  }
  if (route === "/api/approval") { const why = holdApproval(body, req, res); return why ? refuse(res, why, why.includes("너무 많") ? 429 : 400) : undefined; }   // FR-17 훅 — 답은 결정이 오거나 시간이 지나면(3-13)
  if (route === "/api/github/create") { const [code, out] = githubCreate(body); return send(res, code, out); }   // 저장소 만들기를 Claude Code에 맡기기(3-19)
  if (route === "/api/approvals/decide") { const [code, out] = decideApproval(body); return send(res, code, out); }
  if (route === "/api/task/retry") { const [code, out] = retryTask(body); return send(res, code, out); }
  if (route === "/api/task/stop") { const [code, out] = stopTask(body); return send(res, code, out); }   // C-50 사람이 고르면 멈추기(API.md 3-16)   // F-69 막힌 일을 다시 · 명령 없이 · 직접 하기 글(API.md 3-16)   // FR-17 섬의 결정(3-15)
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
  if (route === "/api/carry/draft") return carryDraft(res, body || {});   // 지식 퀘스트 C-48(API.md 3-33) — AI 한 번(기준을 못 채운 초안이 있으면 한 번만 다시)
  if (route === "/api/docs") { const [code, out] = shipDocs(body); return send(res, code, out); }   // C-37 단계 문서를 작업 폴더에 쓰고 커밋 · 푸시를 Claude Code에(API.md 3-23)
  if (route === "/api/prepare") {   // C-56 R-2 + C-54(API.md 3-29, 2026-10-28) — 2단계 끝에 3 ~ 8단계 준비된 퀘스트를 AI 한 번으로(빠른 모델). 받은 글 · 기준 카드 · 1 · 2단계 결과
    if (!body || !Nav.filled(body.idea)) return refuse(res, "받은 글이 비어 있음");
    if (body.idea.length > Nav.IDEA_MAX) return refuse(res, `받은 글이 너무 김 — ${Nav.IDEA_MAX}자까지`);
    if (body.tier != null && !Nav.TIERS.includes(body.tier)) return refuse(res, "모르는 등급");
    if (body.base != null && !strOk(body.base, BASE_MAX)) return refuse(res, `기준 카드 글은 ${BASE_MAX}자까지`);
    const prev = prevStagesOf(body.prev, 2);
    if (!prev || !prev.some((p) => p.stage === 0)) return refuse(res, "1 · 2단계 결과가 다 있어야 해요 — [{ stage, items }]");
    return ask(res, Nav.preparePrompt(body.tier, { idea: body.idea, prev, base: body.base || "" }), Nav.PREPARE_SCHEMA, as("prepare", (d) => Nav.parsePrepare(d)), "준비된 퀘스트", { fast: true, maxTokens: 4096 });
  }
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
    if (body.base != null && !strOk(body.base, BASE_MAX)) return refuse(res, `기준 카드 글은 ${BASE_MAX}자까지`);   // C-56 R-2 — 기준 카드(한 줄씩 '칸: 내용')
    if (body.work != null && !strOk(body.work, Nav.WORK_MAX)) return refuse(res, `방금 한 일 글은 ${Nav.WORK_MAX}자까지`);   // C-56 R-5 — 작업을 따라 다시 맞추기(훅 알림의 작업 글)
    const tk = none(body.talk) ? { talk: [] } : Nav.talkOf(body.talk, { lastMe: false });   // 작업실 개편 C-61 — 그 단계의 대화(받은 글처럼, 가린 뒤)
    if (!tk.talk) return refuse(res, TALK_WHY[tk.why]);
    return ask(res, Nav.stageDraftPrompt(body.stage, body.tier, { idea: body.idea, prev, base: body.base || "", work: body.work || "", ...(avoid ? { avoid: { i: avoid.i, texts: avoid.texts } } : {}), ...(tk.talk.length ? { talk: redactTalk(tk.talk) } : {}) }), Nav.STAGE_DRAFT_SCHEMA,
      as("draft", (d) => Nav.parseStageDraft(d, body.stage, body.tier, prev)), "단계 초안", { fast: true, maxTokens: 4096 });
  }
  if (route === "/api/chat") {   // 작업실 개편 C-61(API.md 3-31, 2026-10-29) — AI 한 번. 플로로와 자유 대화: 답 + 이 대화로 채울 수 있는 칸(제안만 — 칸에 적지 않는다, 섬 자리도 바꾸지 않는다)
    if (!body || !stageOf(body.stage)) return refuse(res, "지금 단계가 없음");
    if (body.tier != null && !Nav.TIERS.includes(body.tier)) return refuse(res, "모르는 등급");
    const tk = Nav.talkOf(body.talk);
    if (!tk.talk) return refuse(res, TALK_WHY[tk.why]);
    if (body.idea != null && !strOk(body.idea, Nav.IDEA_MAX)) return refuse(res, `처음 말한 것은 ${Nav.IDEA_MAX}자까지`);
    const n = Nav.criteriaFor(body.stage, body.tier).length;   // 적은 줄 — 그 등급의 칸 수와 같은 길이, 칸마다 줄 5개 · 줄 400자(없거나 빈 목록이면 모두 빈칸)
    const lines = none(body.lines) ? [] : body.lines;
    if (lines.length && !(lines.length === n && lines.every((l) => Array.isArray(l) && l.length <= 5 && l.every((x) => strOk(x, LINE_MAX)))))
      return refuse(res, `적은 줄의 모양이 맞지 않음 — 그 등급의 칸 ${n}개, 칸마다 줄 5개 · 줄 ${LINE_MAX}자까지`);
    const prev = none(body.prev) ? [] : prevStagesOf(body.prev, body.stage);
    if (!prev) return refuse(res, `지난 단계 결과의 모양이 맞지 않음 — [{ stage, items }], 바로 앞 단계는 꼭 · 할 일 8개 · 줄 5개 · 줄 ${LINE_MAX}자까지`);
    // 비밀값처럼 보이는 글은 가린 뒤 AI에 넘긴다(sensitive.js) — 화면도 보내기 전에 묻지만 서버가 한 번 더(API.md 3-31)
    const safeLines = lines.map((l) => l.map((x) => Sensitive.redact(x)));
    return ask(res, Nav.chatPrompt(body.stage, body.tier, { idea: Sensitive.redact(body.idea || ""), talk: redactTalk(tk.talk), lines: safeLines, prev: redactPrev(prev) }), Nav.CHAT_SCHEMA,
      (d) => Nav.parseChat(d, body.stage, body.tier, safeLines), "대화", { fast: true, maxTokens: 4096 });   // 답 400자 + 칸 한 줄 400자 × 여러 칸 — 기본 길이에서 잘리지 않게
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
