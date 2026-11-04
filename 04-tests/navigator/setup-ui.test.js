// claude-drafted: 2026-10-19 — 처음 설정 화면(02-frontend/navigator/setup.js)의 순수 함수와, 화면이 키를 직접 저장하지 않는다는 약속.
// 실행: node --test 04-tests/navigator/setup-ui.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const U = require("../../02-frontend/navigator/setup.js");
const NAV = path.join(__dirname, "../../02-frontend/navigator");

const st = (o = {}) => ({ ok: true, provider: "cli", apiKey: false, relay: false, claude: { found: true, version: "2.1.30", signedIn: true }, replay: false, build: "x", ...o });

test("언제 뜨나: 끝낸 기록이 없고 주소 끝이 없을 때. #setup이면 늘, 시연 장면 주소(#ex=1 등)면 막지 않는다", () => {
  assert.equal(U.shouldOpen(null, ""), true);
  assert.equal(U.shouldOpen(null, "#"), true);
  assert.equal(U.shouldOpen({ done: true, via: "cli" }, ""), false);
  assert.equal(U.shouldOpen({ done: true }, "#setup"), true);
  for (const h of ["#ex=1", "#ex=1&done&gate", "#tab=all", "#start"]) assert.equal(U.shouldOpen(null, h), false, h);
});

test("끝낸 기록 읽기: 고장 난 값 · 배열 · 못 쓰는 저장소는 기록 없음", () => {
  const store = (v) => ({ getItem: () => v });
  assert.deepEqual(U.readSaved(store(JSON.stringify({ done: true, via: "api" }))), { done: true, via: "api" });
  for (const v of [null, "{깨짐", "[1]", "3"]) assert.equal(U.readSaved(store(v)), null, String(v));
  assert.equal(U.readSaved({ getItem: () => { throw new Error("막힘"); } }), null);
});

test("고르기 카드의 한 줄: Claude Code는 찾았나 · 로그인했나, API 키는 들어 있나. 서버 없이 연 화면이면 그렇다고", () => {
  assert.deepEqual(U.chipCli(st()), { tone: "ok", text: "찾았어요 · 2.1.30" });
  assert.equal(U.chipCli(st({ claude: { found: false, version: "", signedIn: null } })).tone, "warn");
  assert.match(U.chipCli(st({ claude: { found: true, version: "", signedIn: false } })).text, /로그인/);
  assert.equal(U.chipApi(st()).text, "키를 넣어야 해요");
  assert.equal(U.chipApi(st({ apiKey: true, relay: true })).text, "키가 들어 있어요 · 중계 서버");
  for (const f of [U.chipCli, U.chipApi]) assert.match(f(null).text, /앱이나 서버로 켜면/);
});

test("추천: 키가 이미 있으면 API 키, Claude Code를 찾았으면 Claude Code, 둘 다 아니면 추천하지 않는다(사람이 고른다)", () => {
  assert.equal(U.recommend(st({ apiKey: true })), "api");
  assert.equal(U.recommend(st()), "cli");
  assert.equal(U.recommend(st({ claude: { found: false, version: "", signedIn: null } })), "");
  assert.equal(U.recommend(null), "");
});

test("Claude Code로 연결할 때의 할 일: 찾기 · 로그인 · (키가 있으면 빼기) · 확인 — 끝난 것만 체크. 폴더는 '프로젝트' 칸으로 옮겼다(C-31)", () => {
  const ctx = { app: true, live: true, checked: null };
  assert.deepEqual(U.cliSteps(st(), ctx).map((x) => [x.k, x.done]), [["find", true], ["login", true], ["check", false]]);
  assert.deepEqual(U.cliSteps(st({ apiKey: true }), ctx).map((x) => x.k), ["find", "login", "unkey", "check"]);
  const done = U.cliSteps(st(), { ...ctx, checked: true });
  assert.ok(done.every((x) => x.done));
  const failed = U.cliSteps(st(), { ...ctx, checked: { error: "시간 초과" } }).find((x) => x.k === "check");
  assert.equal(failed.done, false); assert.match(failed.line, /안 됐어요 — 시간 초과/);
  assert.match(U.cliSteps(null, ctx)[0].line, /못 찾았어요/);
});

test("API 키로 연결할 때의 할 일: 앱이면 키를 앱 설정 폴더에, 브라우저로 연 화면이면 키를 받지 않고 .env 안내", () => {
  assert.match(U.apiSteps(st(), { app: true, live: true }).find((x) => x.k === "key").line, /앱 설정 폴더/);
  assert.match(U.apiSteps(st(), { app: false, live: true }).find((x) => x.k === "key").line, /키를 받지 않아요/);
  assert.equal(U.apiSteps(st({ apiKey: true }), { app: true }).find((x) => x.k === "key").done, true);
  assert.deepEqual(U.apiSteps(st(), {}).map((x) => x.k), ["key", "check"]);
});

// ── C-31 시작하는 자리(2026-10-24, 이재엽 "5분짜리 온보딩 시스템을 바탕으로 깃허브를 연동하고 클로드 코드나 api키를 받는거도 이어져서") ──
test("같이 쓸 앱 칸의 한 줄(appsChip, C-38 시험판 2026-10-25): 모름 · 못 찾음 · 아직 · 이어짐", () => {
  assert.equal(U.appsChip(null).tone, "dim");
  assert.equal(U.appsChip({ claudeDesktop: { found: false, linked: false } }).tone, "warn");
  assert.deepEqual(U.appsChip({ claudeDesktop: { found: true, linked: false } }), { tone: "dim", text: "아직 잇지 않았어요" });
  assert.deepEqual(U.appsChip({ claudeDesktop: { found: true, linked: true } }), { tone: "ok", text: "이어져 있어요" });
});
test("칸의 순서: 인사 → AI 연결 → 같이 쓸 앱 → GitHub → 프로젝트 → 준비 끝(계획 칸은 2026-10-25 C-36으로 뺐다 — 원하는 것은 채팅에서 플로로에게). 고르기 · Claude Code · API 키는 AI 연결 칸 안의 걸음", () => {
  assert.deepEqual(U.FLOW, ["hello", "ai", "apps", "github", "project", "done"]);
  for (const s of ["choose", "cli", "api"]) assert.equal(U.stageOf(s), "ai", s);
  assert.equal(U.stageOf("github"), "github");
  assert.equal(U.nextStage(U.FLOW, "cli"), "apps", "AI 연결 다음은 같이 쓸 앱(C-38 시험판)"); assert.equal(U.nextStage(U.FLOW, "apps"), "github"); assert.equal(U.nextStage(U.FLOW, "github"), "project"); assert.equal(U.nextStage(U.FLOW, "project"), "done");
  assert.equal(U.nextStage(U.FLOW, "done"), "done"); assert.equal(U.nextStage(U.FLOW, "모름"), "done");
  assert.equal(U.prevStage(U.FLOW, "github"), "apps"); assert.equal(U.prevStage(U.FLOW, "apps"), "ai"); assert.equal(U.prevStage(U.FLOW, "hello"), "hello");
  assert.equal(U.firstStep("ai"), "choose", "AI 칸에 들어가면 고르기부터"); assert.equal(U.firstStep("github"), "github");
});

test("칸 더하기(insertStage): 나중에 튜토리얼 같은 칸을 원하는 칸 뒤에 끼운다 — '준비 끝' 뒤로는 가지 않고, 이미 있으면 그대로, 원래 줄은 바꾸지 않는다(이재엽 '확장성 기반으로')", () => {
  const f = U.insertStage(U.FLOW, "tutorial", "project");
  assert.deepEqual(f, ["hello", "ai", "apps", "github", "project", "tutorial", "done"]);
  assert.deepEqual(U.FLOW, ["hello", "ai", "apps", "github", "project", "done"], "원래 줄은 그대로");
  assert.deepEqual(U.insertStage(f, "tutorial", "hello"), f, "이미 있으면 그대로");
  assert.deepEqual(U.insertStage(U.FLOW, "x", "done"), ["hello", "ai", "apps", "github", "project", "x", "done"], "'준비 끝' 뒤는 안 된다 — 그 앞에");
  assert.deepEqual(U.insertStage(U.FLOW, "x", "없는칸"), ["hello", "ai", "apps", "github", "project", "x", "done"]);
  assert.equal(U.nextStage(f, "project"), "tutorial");
});

test("GitHub 칸의 할 일: gh 찾기 · 로그인 — 서버가 본 상태(/api/github)로 체크, 서버 없이 연 화면이면 그렇다고. Floe는 비밀번호 · 토큰을 받지 않는다", () => {
  const gh = (found, signedIn) => ({ ok: true, gh: { found, signedIn } });
  assert.deepEqual(U.githubSteps(gh(true, true)).map((x) => [x.k, x.done]), [["gh", true], ["login", true]]);
  assert.equal(U.githubReady(gh(true, true)), true);
  const nogh = U.githubSteps(gh(false, null));
  assert.equal(nogh[0].done, false); assert.match(nogh[0].line, /설치/);
  assert.equal(U.githubReady(gh(false, null)), false);
  const nologin = U.githubSteps(gh(true, false));
  assert.equal(nologin[1].done, false); assert.match(nologin[1].line, /gh auth login/);
  assert.match(U.githubSteps(null)[0].line, /앱이나 서버로 켜면/);
  assert.equal(U.githubReady(null), false);
});

test("준비 끝의 요약 세 줄: AI · GitHub · 프로젝트 — 고른 그대로, 건너뛴 것은 건너뛰었다고", () => {
  const gh = { ok: true, gh: { found: true, signedIn: true } };
  assert.deepEqual(U.summary({ via: "cli", gh, ghSkip: false, project: { name: "test-1", where: "~/Floe/test-1" } }),
    [["AI", "Claude Code로 연결"], ["GitHub", "로그인됨"], ["프로젝트", "test-1 · ~/Floe/test-1"]]);
  assert.deepEqual(U.summary({ via: "api", gh: null, ghSkip: true, project: null }), [["AI", "API 키로 연결"], ["GitHub", "건너뜀 — 나중에 설정에서"], ["프로젝트", "아직 안 골랐어요 — 설정에서 언제든"]]);
  assert.equal(U.summary({ via: "", gh: { ok: true, gh: { found: true, signedIn: false } }, ghSkip: false, project: null })[1][1], "아직 로그인 전");
});

test("새로 만든 폴더면 GitHub 저장소도 만들지 묻는다 — GitHub가 준비됐고 · Claude Code가 있고 · 새 폴더이고 · 가져온 저장소가 아닐 때만(만들기는 Claude Code가, 허락은 섬에서)", () => {
  const ready = { ok: true, gh: { found: true, signedIn: true } }, cc = st();
  const base = { st: cc, gh: ready, project: { name: "club-app", made: true, repo: "" } };
  assert.equal(U.offerRepo(base), true);
  assert.equal(U.offerRepo({ ...base, project: { name: "test-1", made: true, repo: "gamercross/test-1" } }), false, "가져온 저장소");
  assert.equal(U.offerRepo({ ...base, project: { name: "old", made: false, repo: "" } }), false, "있던 폴더");
  assert.equal(U.offerRepo({ ...base, gh: { ok: true, gh: { found: true, signedIn: false } } }), false);
  assert.equal(U.offerRepo({ ...base, project: null }), false);
  assert.equal(U.offerRepo({ ...base, st: st({ claude: { found: false, version: "", signedIn: null } }) }), false, "Claude Code가 없으면 맡길 곳이 없다(2026-10-24 리뷰)");
  assert.equal(U.offerRepo({ ...base, st: null }), false);
});

test("화면(setup.js): 프로젝트 칸은 앱이면 가져오기 · 새로 만들기 · 있는 폴더 셋을 앱(floeApp)에게 부탁하고 경로를 만들지 않는다. 끝나면 저장소 만들기를 바라는지 섬에 알린다", () => {
  const src = fs.readFileSync(path.join(NAV, "setup.js"), "utf8");
  for (const f of ["floeApp.cloneProject(", "floeApp.newProject(", "floeApp.connect(", "floeApp.myRepos("]) assert.ok(src.includes(f), f);
  assert.ok(!/\/Floe\//.test(src.replace(/~\/Floe/g, "")), "홈/Floe 경로는 앱(project.js)이 만든다");
  assert.match(src, /makeRepo/);
  assert.match(src, /function render\(\) \{\n    if \(!host\) return;/, "가져오는 중에 닫혀도 빈 화면에 그리지 않는다(2026-10-24 리뷰)");
  assert.match(src, /r\.config/, "가져온 저장소에 Claude Code 설정이 있으면 알린다");
  assert.match(src, /function open\(\{ step \} = \{\}\)/, "설정의 '프로젝트 바꾸기'는 프로젝트 칸부터");
  assert.match(src, /if \(at\) \{ s\.step = at; s\.resumed = true;/, "인사 화면을 먼저 그리지 않고 바로 그 칸(2차 리뷰)");
  assert.match(src, /floe:project-picked/, "가져오는 중에 닫혔어도 끝나면 섬에 알린다");
  assert.match(src, /if \(a === "folder" && app && !s\.busy\)/, "바쁠 때 폴더 고르기를 또 하지 않는다");
  assert.doesNotMatch(src, /planText|plantext|"plan"/, "계획 칸(모든 내용을 한 번에 넣는 칸)은 뺐다(2026-10-25 C-36 — 원하는 것은 채팅에서 플로로에게)");
  assert.doesNotMatch(src, /\/api\/plan|\/api\/start/, "처음 설정은 AI를 부르지 않는다(첫 5분 0절 4번)");
  assert.match(src, /fetch\("\/api\/github"/);
  assert.match(src, /https:\/\/cli\.github\.com/);
});

test("화면은 키를 저장하지 않는다 — 브라우저 저장소에는 '끝냈다' 기록만, 키는 앱(floeApp.saveKey)으로만 넘긴다", () => {
  const src = fs.readFileSync(path.join(NAV, "setup.js"), "utf8");
  const sets = [...src.matchAll(/localStorage\.setItem\(([^,]+),/g)].map((m) => m[1].trim());
  assert.deepEqual(sets, ["KEY"], "localStorage에 쓰는 것은 처음 설정의 끝낸 기록(floe:setup:v1) 하나");
  assert.ok(!/fetch\([^)]*key/i.test(src), "키를 서버 주소로 보내지 않는다");
  assert.match(src, /floeApp\.saveKey\(/);
  assert.match(src, /type="password"/, "키 칸은 가린다");
});

test("내비게이터 화면이 처음 설정을 부른다 — 플로로 그림(seal.js) 뒤, app.js 앞. 스타일도", () => {
  const html = fs.readFileSync(path.join(NAV, "index.html"), "utf8");
  const at = (s) => html.indexOf(s);
  assert.ok(at('src="seal.js"') > 0 && at('src="setup.js"') > at('src="seal.js"') && at('src="app.js"') > at('src="setup.js"'));
  assert.ok(at('href="setup.css"') > 0);
});

// F-146(2026-11-04 두승현 "초기 설정 세팅 이후 … 작업실의 플로로 홈에서"): 시작하기 뒤 옛 섬 화면으로 가면 작업실로 가는 길('퀘스트' 단추)을 새 사용자가 알 수 없다
test("처음 설정의 시작하기(open) — 작업실을 열고 섬을 펼친다, 가운데 큰 플로로는 bigAuto가 정한다(1단계 시작 전이면 플로로 홈)", () => {
  const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  assert.match(a, /if \(d\.open\) \{ setPlace\("vibe"\); st\.tab = "today"; openQwin\("quest"\); st\.islBig = null; go\("home"\); \}/);
  assert.match(a, /const bigAuto = \(\) => !!\(QU && \(\(!st\.j && !st\.quest && st\.qwin\)/, "1단계 시작 전 + 작업실이면 가운데");
});
