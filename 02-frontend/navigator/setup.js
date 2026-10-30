// claude-drafted: 2026-10-19 — 처음 켤 때 플로로가 반기고, AI를 어떻게 부를지(Claude Code / API 키) 하나를 골라 같이 준비한다.
// 이재엽 요청: "플로로가 켜졌을때 초기 세팅을 도와주는 내용 … api키를 받든 아니면 클로드코드로 연동이 되도록 하든 둘중 하나를 선택해서 설정 할 수 있도록
// 처음에 도와주도록 해주고 처음에 들어가면 반갑다고 해주는 내용도".
// 2026-10-24(C-31 시작하는 자리, 이재엽 "5분짜리 온보딩 시스템을 바탕으로 깃허브를 연동하고 클로드 코드나 api키를 받는거도 이어져서"):
//   칸이 다섯 — 인사 → AI 연결(고르기 → Claude Code: 찾기 · 로그인 · 연결 확인 | API 키: 키 넣기 · 연결 확인) → GitHub(gh 찾기 · 로그인) → 프로젝트(내 GitHub 저장소 가져오기 ·
//   새로 만들기 · 이 컴퓨터에 있는 폴더) → 준비 끝(요약 세 줄). 전에 AI 칸 안에 있던 '작업 폴더 연결'은 프로젝트 칸으로 옮겼다.
//   칸의 순서는 FLOW 한 줄 — 튜토리얼 같은 칸은 FloeSetup.addStage(이름, { after, view })로 끼운다(이재엽 "나중에 튜토리얼 내용이 생기면 … 확장성 기반으로").
// 2026-10-25(C-38 시험판, 두승현 "같이 쓸 앱으로 연결으로 해줘"): AI 연결 뒤에 '같이 쓸 앱' 칸 — Claude Desktop 설정 파일에 Floe를 잇는다(내 컴퓨터 안 MCP, 서버 /api/apps · /api/apps/link).
//   AI 연결을 대신하지 않는다 — Floe의 판정 · 초안은 여전히 Claude Code나 API 키. 건너뛰어도 된다. — claude-drafted: 2026-10-25
// 언제 뜨나: 이 브라우저(앱)에 끝낸 기록(floe:setup:v1)이 없고 주소 끝(#…)이 없을 때 — 켜자마자 인사 뒤(버튼 2026-10-24 "1번"). #setup이면 늘. 설정 톱니의 '처음 설정 다시 하기'로도.
// 키는 이 화면이 저장하지 않는다: 앱(Electron)이면 preload의 floeApp.saveKey로 앱이 설정 폴더의 .env(나만 읽기)에 쓴다. 브라우저로 연 화면은 키를 받지 않고 .env 안내만 한다.
// 폴더도 이 화면이 만들지 않는다: 이름 · 주소 글만 floeApp.newProject · cloneProject에 넘기고, 경로(홈의 Floe 폴더) · clone · 훅은 앱(project.js · main.js)이 한다.
// 서버: GET /api/setup(있다 · 없다만) · POST /api/setup/check(작은 요청 하나, 확인 값 쿠키) · GET /api/github(gh 상태) — API.md 3-10 · 3-11 · 3-19. 순수 함수는 04-tests/navigator/setup-ui.test.js가 본다.
(function (root) {
  "use strict";
  const KEY = "floe:setup:v1";

  // ── 순수 함수 ──
  const readSaved = (storage) => { try { const v = JSON.parse(storage.getItem(KEY) || "null"); return v && typeof v === "object" && !Array.isArray(v) ? v : null; } catch { return null; } };
  // 처음 설정을 띄울까 — #setup이면 늘, 다른 주소 끝(시연 장면)이면 안 띄움, 아니면 끝낸 기록이 없을 때
  function shouldOpen(saved, hash) {
    if (hash === "#setup") return true;
    if (hash && hash !== "#") return false;
    return !(saved && saved.done);
  }
  // 칸(stage)의 순서 — 고르기 · Claude Code · API 키는 'AI 연결' 칸 안의 걸음(step)이다
  const FLOW = ["hello", "ai", "apps", "github", "project", "done"];   // 계획 칸(모든 내용을 한 번에 넣는 칸, C-34)은 2026-10-25 C-36으로 뺐다 — 원하는 것은 시작한 뒤 채팅에서 플로로에게(이재엽 "처음 시작할때 모든 내용을 넣어달라는 페이지 삭제")
  const STEP_STAGE = { choose: "ai", cli: "ai", api: "ai" };
  const stageOf = (step) => STEP_STAGE[step] || step;
  const firstStep = (stage) => (stage === "ai" ? "choose" : stage);
  function nextStage(flow, step) { const i = flow.indexOf(stageOf(step)); return i >= 0 && i < flow.length - 1 ? flow[i + 1] : "done"; }
  function prevStage(flow, step) { const i = flow.indexOf(stageOf(step)); return i > 0 ? flow[i - 1] : flow[0]; }
  // 칸 끼우기 — after 뒤에(없거나 '준비 끝'이면 '준비 끝' 바로 앞에). 이미 있으면 그대로. 원래 줄은 바꾸지 않는다
  function insertStage(flow, key, after) {
    if (flow.includes(key)) return flow.slice();
    const out = flow.slice(), end = out.indexOf("done"), i = out.indexOf(after);
    out.splice(i < 0 || i >= end ? end : i + 1, 0, key);
    return out;
  }
  // 고르기 카드의 한 줄 — st: GET /api/setup의 답. 없으면(파일로 열었거나 서버가 옛 판) null
  function chipCli(st) {
    if (!st) return { tone: "dim", text: "앱이나 서버로 켜면 알 수 있어요" };
    const c = st.claude || {};
    if (!c.found) return { tone: "warn", text: "설치가 필요해요" };
    if (c.signedIn === false) return { tone: "warn", text: "로그인이 필요해 보여요" };
    return { tone: "ok", text: `찾았어요${c.version ? ` · ${c.version}` : ""}` };
  }
  function chipApi(st) {
    if (!st) return { tone: "dim", text: "앱이나 서버로 켜면 알 수 있어요" };
    return st.apiKey ? { tone: "ok", text: st.relay ? "키가 들어 있어요 · 중계 서버" : "키가 들어 있어요" } : { tone: "dim", text: "키를 넣어야 해요" };
  }
  // 추천 — 키가 이미 있으면 API 키, Claude Code를 찾았으면 Claude Code, 둘 다 아니면 없음(사람이 고른다)
  const recommend = (st) => (!st ? "" : st.apiKey ? "api" : st.claude && st.claude.found ? "cli" : "");
  const checkLine = (checked, idle) => (checked === true ? "됐어요! 정말 불러 봤어요"
    : checked && checked.error ? `안 됐어요 — ${checked.error}` : idle);
  // 할 일 — ctx: { app: 앱 안인가, live: 서버로 열었나, checked: true | {error} | null }
  function cliSteps(st, ctx) {
    const c = (st && st.claude) || {};
    return [
      { k: "find", title: "Claude Code 찾기", done: !!c.found,
        line: c.found ? `찾았어요${c.version ? ` (${c.version})` : ""}` : "이 컴퓨터에서 claude 명령을 못 찾았어요. Claude Code를 설치한 뒤 다시 확인해요." },
      { k: "login", title: "로그인", done: c.signedIn === true,
        line: c.signedIn === true ? "로그인되어 있어요" : c.signedIn === false ? "터미널에서 claude를 한 번 켜서 로그인해 주세요" : "로그인했는지는 마지막 '연결 확인'으로 알아봐요" },
      ...(st && st.apiKey ? [{ k: "unkey", title: "API 키 빼기", done: false, line: "지금은 API 키로 불러요. Claude Code로 부르려면 키를 빼야 해요." }] : []),
      { k: "check", title: "연결 확인", done: ctx.checked === true, line: checkLine(ctx.checked, "아주 작은 요청 하나로 정말 되는지 봐요") },
    ];
  }
  function apiSteps(st, ctx) {
    return [
      { k: "key", title: "API 키 넣기", done: !!(st && st.apiKey),
        line: st && st.apiKey ? `키가 들어 있어요${st.relay ? " · 중계 서버" : ""}` : ctx.app ? "키는 이 컴퓨터의 앱 설정 폴더에만 저장돼요(나만 읽기)" : "서버로 연 화면에서는 키를 받지 않아요. 아래처럼 .env에 넣고 다시 켜요." },
      { k: "check", title: "연결 확인", done: ctx.checked === true, line: checkLine(ctx.checked, "내 키로 아주 작은 요청 하나(수십 토큰)를 보내 봐요") },
    ];
  }
  // GitHub 칸 — gh: GET /api/github의 답(없으면 null). Floe는 비밀번호 · 토큰을 받지 않는다 — 이 컴퓨터의 gh가 로그인한다
  function githubSteps(gh) {
    if (!gh || !gh.ok || !gh.gh) return [{ k: "gh", title: "GitHub CLI(gh) 찾기", done: false, line: "앱이나 서버로 켜면 알 수 있어요" }, { k: "login", title: "GitHub 로그인", done: false, line: "앱이나 서버로 켜면 알 수 있어요" }];
    const g = gh.gh;
    return [
      { k: "gh", title: "GitHub CLI(gh) 찾기", done: !!g.found, line: g.found ? "찾았어요" : "이 컴퓨터에 gh가 없어요 — 설치하면 저장소를 가져오고 만들 수 있어요" },
      { k: "login", title: "GitHub 로그인", done: g.signedIn === true,
        line: g.signedIn === true ? "로그인되어 있어요" : "터미널에서 한 번만 gh auth login — 브라우저에서 GitHub에 로그인해요. 하고 나서 '다시 확인'" },
    ];
  }
  // 같이 쓸 앱 칸의 한 줄 — a: GET /api/apps의 답(없으면 null)
  function appsChip(a) {
    if (!a || !a.claudeDesktop) return { tone: "dim", text: "앱이나 서버로 켜면 알 수 있어요" };
    if (!a.claudeDesktop.found) return { tone: "warn", text: "찾지 못했어요 — 설치하고 한 번 켠 뒤 다시 와요" };
    return a.claudeDesktop.linked ? { tone: "ok", text: "이어져 있어요" } : { tone: "dim", text: "아직 잇지 않았어요" };
  }
  const githubReady = (gh) => !!(gh && gh.ok && gh.gh && gh.gh.found && gh.gh.signedIn === true);
  // 준비 끝의 요약 세 줄
  const VIA = { cli: "Claude Code로 연결", api: "API 키로 연결", practice: "연습용 예시(AI 없이)" };
  function summary(s) {
    const gh = githubReady(s.gh) ? "로그인됨" : s.ghSkip ? "건너뜀 — 나중에 설정에서" : "아직 로그인 전";
    const p = s.project ? `${s.project.name}${s.project.where ? ` · ${s.project.where}` : ""}` : "아직 안 골랐어요 — 설정에서 언제든";
    return [["AI", VIA[s.via] || "나중에"], ["GitHub", gh], ["프로젝트", p]];
  }
  // 새로 만든 빈 폴더면 GitHub 저장소도 만들지 묻는다 — 만들기는 사용자의 Claude Code가(C-25), 허락은 섬에서. Claude Code가 없으면 맡길 곳이 없어 묻지 않는다
  const offerRepo = (s) => !!(githubReady(s.gh) && s.st && s.st.claude && s.st.claude.found && s.project && s.project.made && !s.project.repo);
  const api = { KEY, readSaved, shouldOpen, FLOW, stageOf, firstStep, nextStage, prevStage, insertStage, chipCli, chipApi, recommend, cliSteps, apiSteps, githubSteps, githubReady, appsChip, summary, offerRepo };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  // ── 화면 (브라우저에서만) ──
  const doc = root.document, Seal = root.NavSeal;
  const STILL = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = root.location.protocol.startsWith("http"), app = !!root.floeApp;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const CMD = {
    connect: "node 03-backend/navigator/connect.js <내 프로젝트 폴더> --apply",
    env: "ANTHROPIC_API_KEY=<내 키>",
    start: "node 03-backend/navigator/floe.js <내 프로젝트 폴더>",
    ghlogin: "gh auth login",
  };
  const GH_CLI = "https://cli.github.com";
  let host = null, s = null, lastStep = "";
  let flow = FLOW.slice();
  const extra = {};   // addStage로 더한 칸 — { view(s) → HTML }
  const fresh = () => ({ step: "hello", via: "", st: null, checked: null, busy: "", note: "", gh: null, ghSkip: false, apps: null, repos: [], project: null, makeRepo: true, repoVis: "private" });

  function save(via) { try { root.localStorage.setItem(KEY, JSON.stringify({ done: true, via, at: new Date().toLocaleDateString("sv-SE") })); } catch {} }
  async function status() {
    if (!live) return null;
    try { const j = await (await fetch("/api/setup", { cache: "no-store" })).json(); return j && j.ok ? j : null; } catch { return null; }
  }
  async function appsStatus() {
    if (!live) return null;
    try { const j = await (await fetch("/api/apps", { cache: "no-store" })).json(); return j && j.ok ? j : null; } catch { return null; }
  }
  async function ghStatus() {
    if (!live) return null;
    try { const j = await (await fetch("/api/github", { cache: "no-store" })).json(); return j && j.ok ? j : null; } catch { return null; }
  }
  const floro = (mood, size) => (Seal ? Seal.svg(mood, size, { hole: true }) : "");
  const phone = () => !root.floeApp && root.matchMedia && root.matchMedia("(max-width:600px)").matches;   // 앱 안에서는 창이 좁아도 PC 모양(2026-10-19)
  const chip = (c) => `<span class="su-chip ${c.tone}">${esc(c.text)}</span>`;
  const code = (k) => `<span class="su-code"><code>${esc(CMD[k])}</code><button type="button" class="b ghost su-copy" data-s="copy" data-k="${k}">복사</button></span>`;
  const stepList = (steps) => `<ol class="su-steps">${steps.map((x) => `<li class="${x.done ? "ok" : ""}"><span class="su-ck" aria-hidden="true">${x.done ? "✓" : ""}</span>
        <div><b>${esc(x.title)}</b><span class="su-line">${esc(x.line)}</span>${tools(x)}</div></li>`).join("")}</ol>`;
  const note = () => (s.note ? `<p class="su-note" role="status">${esc(s.note)}</p>` : "");
  const back = (to, label = "‹ 뒤로") => `<button type="button" class="b ghost" data-s="go" data-to="${to}">${label}</button>`;

  const MOOD = { hello: "happy", choose: "look", cli: "idle", api: "idle", apps: "look", github: "idle", project: "look", done: "done" };
  function body() {
    if (s.step === "hello") return `
      <h2 id="su-title" class="mc-title">반가워요! 저는 길잡이 물범 플로로예요.</h2>
      <p class="mc-sub">처음이니까 같이 준비해요. AI 연결 → GitHub → 프로젝트 폴더, 세 가지만 정하면 돼요. 2분이면 끝나요.</p>
      <div class="su-acts"><button type="button" class="b pri" data-s="go" data-to="choose">준비 시작하기<kbd aria-hidden="true">Enter</kbd></button>
        <button type="button" class="b ghost" data-s="later">나중에 할게요</button></div>`;
    if (s.step === "choose") {
      const rec = recommend(s.st);
      const card = (via, title, line, c) => `<button type="button" class="su-pick${rec === via ? " rec" : ""}" data-s="pick" data-via="${via}">
        <span class="su-pick-t">${esc(title)}${rec === via ? '<span class="su-rec">추천</span>' : ""}</span><span class="su-pick-l">${esc(line)}</span>${chip(c)}</button>`;
      return `
      <h2 id="su-title" class="mc-title">AI를 어떻게 불러 올까요?</h2>
      <p class="mc-sub">둘 중 하나만 고르면 돼요. 나중에 설정(톱니)에서 바꿀 수 있어요.</p>
      <div class="su-picks">${card("cli", "Claude Code로 연결", "이 컴퓨터에 로그인된 Claude Code를 써요. 키를 넣지 않아도 되고, 내 구독 안에서 불러요.", chipCli(s.st))}
        ${card("api", "API 키 넣기", "내 Anthropic API 키로 불러요. 쓴 토큰은 내 키의 한도에서 빠져요.", chipApi(s.st))}</div>
      <p class="su-fine">어느 쪽이든 보여 준 글은 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처는 빼 주세요.</p>
      <div class="su-acts">${back("hello")}
        <button type="button" class="b soft" data-s="practice">AI 없이 연습용 예시로 둘러보기</button></div>`;
    }
    if (s.step === "cli" || s.step === "api") {
      const steps = s.step === "cli" ? cliSteps(s.st, { app, live, checked: s.checked }) : apiSteps(s.st, { app, live, checked: s.checked });
      const ready = s.checked === true;
      return `
      <h2 id="su-title" class="mc-title">${s.step === "cli" ? "Claude Code로 연결해요" : "API 키로 연결해요"}</h2>
      ${!live ? `<p class="mc-sub su-warn">지금은 서버 없이 파일로 열었어요. Floe 앱(.dmg)이나 터미널의 floe.js로 켜면 여기서 바로 연결할 수 있어요.</p>` : ""}
      ${stepList(steps)}${note()}
      <div class="su-acts">${back("choose", "‹ 다시 고르기")}
        <button type="button" class="b ${ready ? "pri" : ""}" data-s="next">${ready ? "다음: 같이 쓸 앱" : "확인 없이 다음으로"}${ready ? '<kbd aria-hidden="true">Enter</kbd>' : ""}</button></div>`;
    }
    if (s.step === "apps") {
      const cd = s.apps && s.apps.claudeDesktop, linked = !!(cd && cd.linked);
      return `
      <h2 id="su-title" class="mc-title">같이 쓸 앱이 있나요?</h2>
      <p class="mc-sub">Claude Desktop에서 대화하면서 Floe의 지금 할 일을 같이 볼 수 있어요. Claude가 적자고 한 한 줄은 섬에서 '맞아요'를 눌러야 적혀요. 건너뛰어도 돼요.</p>
      <div class="su-picks su-proj"><div class="su-pick su-card"><span class="su-pick-t">Claude Desktop${chip(appsChip(s.apps))}</span>
        <span class="su-pick-l">이 컴퓨터 안에서만 이어요 — 인터넷에 열지 않아요. 지금 할 일 · 적은 줄이 Claude(Anthropic)로 가요.</span>
        ${cd && cd.found && !linked ? `<span class="su-row"><button type="button" class="b" data-s="applink"${s.busy === "applink" ? " disabled" : ""}>${s.busy === "applink" ? "잇는 중…" : "Claude Desktop과 잇기"}</button></span>` : ""}</div></div>${note()}
      <div class="su-acts">${back(s.via === "cli" || s.via === "api" ? s.via : "choose")}
        <button type="button" class="b ${linked ? "pri" : ""}" data-s="next">${linked ? "다음: GitHub" : "건너뛰고 다음"}${linked ? '<kbd aria-hidden="true">Enter</kbd>' : ""}</button></div>`;
    }
    if (s.step === "github") {
      const ready = githubReady(s.gh);
      return `
      <h2 id="su-title" class="mc-title">GitHub와 이어요</h2>
      <p class="mc-sub">만든 것을 내 GitHub 저장소에 남기고, 있는 저장소를 가져올 때 써요. Floe는 GitHub 비밀번호 · 토큰을 받지 않아요 — 이 컴퓨터의 gh가 해요.</p>
      ${s.busy === "gh" ? `<p class="su-note" role="status">확인하는 중…</p>` : stepList(githubSteps(s.gh))}${note()}
      <div class="su-acts">${back("apps")}
        <button type="button" class="b ghost" data-s="ghskip">GitHub 없이 할래요</button>
        <button type="button" class="b ${ready ? "pri" : ""}" data-s="next"${ready ? "" : " disabled"}>다음: 프로젝트${ready ? '<kbd aria-hidden="true">Enter</kbd>' : ""}</button></div>`;
    }
    if (s.step === "project") return projectView();
    if (extra[s.step]) return `${extra[s.step].view(s)}<div class="su-acts">${back(prevStage(flow, s.step))}<button type="button" class="b pri" data-s="next">다음<kbd aria-hidden="true">Enter</kbd></button></div>`;
    const line = s.via === "cli" ? "앞으로 Claude Code로 일하면 제가 옆에서 알아채고, 지금 몇 단계인지와 다음에 할 일을 알려 드릴게요."
      : s.via === "api" ? "보여 주신 글을 내 API 키로 살펴볼게요. 쓴 토큰은 설정에서 볼 수 있어요."
        : "연습용 예시로 둘러봐요. 진짜 연결은 설정(톱니)의 '처음 설정 다시 하기'에서 언제든 할 수 있어요.";
    const rows = s.via === "practice" ? "" : `<dl class="su-sum">${summary(s).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
    const repo = offerRepo(s) ? `<div class="su-repo"><label class="chk"><input type="checkbox" data-s="makerepo" ${s.makeRepo ? "checked" : ""}>GitHub에 <b>${esc(s.project.name)}</b> 저장소도 만들기</label>
        <span class="su-vis" role="group" aria-label="공개 범위">${[["private", "비공개"], ["public", "공개"]].map(([v, n]) => `<button type="button" class="b ghost" data-s="repovis" data-v="${v}" aria-pressed="${s.repoVis === v}">${n}</button>`).join("")}</span>
        <span class="su-line">만드는 일은 내 Claude Code가 해요 — 허락을 구하면 섬에서 물어볼게요</span></div>` : "";
    return `
      <h2 id="su-title" class="mc-title">준비 끝!</h2>
      <p class="mc-sub">${esc(line)}</p>${rows}${repo}
      <div class="su-acts"><button type="button" class="b pri" data-s="done">시작하기<kbd aria-hidden="true">Enter</kbd></button></div>`;
  }
  // 프로젝트 칸 — 고른 폴더가 플로로와 Claude Code가 일하는 자리(C-31). 앱이면 셋을 앱에게 부탁하고, 브라우저면 명령 안내
  function projectView() {
    const busy = (k) => (s.busy === k ? " disabled" : "");
    const chosen = s.project ? `<p class="su-note su-ok" role="status">✓ <b>${esc(s.project.name)}</b>${s.project.where ? ` — ${esc(s.project.where)}` : ""} · 이 폴더에서 플로로와 Claude Code가 일해요</p>` : "";
    const repos = s.repos.length ? `<div class="su-repos" role="group" aria-label="내 저장소">${s.repos.slice(0, 8).map((r) => `<button type="button" class="b ghost" data-s="pickrepo" data-v="${esc(r.name)}"${busy("clone")}>${esc(r.name)}${r.private ? " · 비공개" : ""}</button>`).join("")}</div>` : "";
    const cards = app ? `<div class="su-picks su-proj">
        <form class="su-pick su-card" data-s="clone"><span class="su-pick-t">내 GitHub 저장소 가져오기</span><span class="su-pick-l">내가 쓸 수 있는 저장소를 적거나 아래에서 골라요. 홈의 Floe 폴더로 받고, 토큰은 들지 않아요.</span>
          <span class="su-row"><input name="repo" autocomplete="off" spellcheck="false" placeholder="예) gamercross/test-1" aria-label="가져올 저장소"><button type="submit" class="b"${busy("clone")}>${s.busy === "clone" ? "가져오는 중…" : "가져오기"}</button></span>${repos}</form>
        <form class="su-pick su-card" data-s="new"><span class="su-pick-t">새로 만들기</span><span class="su-pick-l">홈의 Floe 폴더 안에 빈 폴더를 만들어요. 이름은 저장소 이름으로도 써요.</span>
          <span class="su-row"><input name="pname" autocomplete="off" spellcheck="false" placeholder="영문 이름 — 예) club-app" aria-label="새 프로젝트 이름"><button type="submit" class="b"${busy("new")}>만들기</button></span></form>
        <div class="su-pick su-card"><span class="su-pick-t">이 컴퓨터에 있는 폴더</span><span class="su-pick-l">이미 작업하던 폴더를 골라요.</span>
          <span class="su-row"><button type="button" class="b" data-s="folder"${busy("folder")}>폴더 고르기</button></span></div></div>`
      : `<p class="mc-sub su-warn">앱(.dmg)으로 켜면 여기서 바로 가져오고 만들 수 있어요. 지금은 폴더를 이렇게 이어요:</p>${code("connect")}`;
    return `
      <h2 id="su-title" class="mc-title">어디서 만들까요?</h2>
      <p class="mc-sub">고른 폴더가 플로로와 Claude Code가 일하는 자리예요. 섬에서 맡긴 일 · 책(README) · 저장이 모두 이 폴더에서 돌아요.</p>
      ${cards}${chosen}${note()}
      <div class="su-acts">${s.busy ? back("github").replace("<button ", "<button disabled ") : back("github")}
        <button type="button" class="b ${s.project ? "pri" : ""}" data-s="next"${s.busy ? " disabled" : ""}>${s.project ? "다음" : "고르지 않고 넘어가기"}${s.project ? '<kbd aria-hidden="true">Enter</kbd>' : ""}</button></div>`;
  }
  // 할 일 줄 아래의 단추 · 명령
  function tools(x) {
    const busy = s.busy === x.k ? " disabled" : "";
    if (x.k === "find" && !x.done) return `<a class="su-link" href="https://claude.com/claude-code" target="_blank" rel="noopener">Claude Code 설치 안내 열기</a>
      <button type="button" class="b ghost" data-s="refresh"${busy}>다시 찾기</button>`;
    if (x.k === "unkey") return app ? `<button type="button" class="b" data-s="unkey"${busy}>키 빼기</button>` : `<span class="su-line">03-backend/navigator/.env에서 ANTHROPIC_API_KEY 줄을 지우고 floe.js를 다시 켜요.</span>`;
    if (x.k === "key") {
      if (x.done) return app ? `<button type="button" class="b ghost" data-s="rekey">다른 키 넣기</button>` : "";
      if (!app) return `${code("env")}<span class="su-line">.env는 03-backend/navigator 안에 두고(.env.example을 복사), 다시 켜요:</span>${code("start")}`;
      return `<form class="su-key" data-s="key"><label class="su-lab">API 키<span class="su-row"><input type="password" name="key" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" required>
        <button type="button" class="b ghost" data-s="peek" aria-pressed="false">보기</button></span></label>
        <details><summary>중계 서버를 써요 (코디세이 가상 키)</summary><label class="su-lab">중계 서버 주소<input type="url" name="base" autocomplete="off" spellcheck="false" placeholder="https://…"></label></details>
        <button type="submit" class="b pri"${busy}>저장하고 확인하기</button></form>`;
    }
    if (x.k === "check" && live) return `<button type="button" class="b${x.done ? " ghost" : ""}" data-s="check"${s.busy === "check" ? " disabled" : ""}>${s.busy === "check" ? "확인하는 중…" : x.done ? "다시 확인" : "연결 확인하기"}</button>`;
    if (x.k === "gh" && !x.done && live) return `<a class="su-link" href="${GH_CLI}" target="_blank" rel="noopener">GitHub CLI 설치 안내 열기</a><button type="button" class="b ghost" data-s="ghcheck">다시 확인</button>`;
    if (x.k === "login" && s.step === "github" && !x.done && live) return `${code("ghlogin")}<button type="button" class="b ghost" data-s="ghcheck">다시 확인</button>`;
    return "";
  }

  function render() {
    if (!host) return;   // 가져오는 중(최대 3분)에 닫혔다 — 끝난 뒤 빈 화면에 그리지 않는다
    const mood = s.busy === "check" || s.busy === "clone" ? "think" : s.checked && s.checked.error ? "alert" : s.checked === true && s.step !== "done" && stageOf(s.step) === "ai" ? "happy" : MOOD[s.step] || "idle";
    const at = flow.indexOf(stageOf(s.step));
    // 다시 그려도 치던 글 · 커서가 남게 — 글 칸이 상태에 묶여 있지 않아 응답(저장소 목록 · gh 상태)이 와서 다시 그리면 지워졌다(F-103-17)
    const typed = [...host.querySelectorAll("input[name]")].map((i) => [i.name, i.value]), was = doc.activeElement, caret = was && was.name && host.contains(was) ? [was.name, was.selectionStart, was.selectionEnd] : null;
    host.innerHTML = `<div class="su-back"></div><section class="su isl" role="dialog" aria-modal="true" aria-labelledby="su-title">
      <div class="su-cat">${floro(mood, phone() ? 84 : 124)}</div><div class="su-main">${body()}</div>
      <ol class="su-dots" aria-label="처음 설정 ${at + 1} / ${flow.length}">${flow.map((k) => `<li class="${stageOf(s.step) === k ? "on" : ""}"></li>`).join("")}</ol></section>`;
    for (const [n, v] of typed) { const i = host.querySelector(`input[name="${n}"]`); if (i && !i.value) i.value = v; }
    if (caret) { const i = host.querySelector(`input[name="${caret[0]}"]`); if (i) { i.focus({ preventScroll: true }); try { i.setSelectionRange(caret[1], caret[2]); } catch {} } }
    // 단계가 바뀌면 제목으로(화면 읽기 프로그램이 새 단계부터 읽는다), 같은 단계에서 다시 그리면 하던 자리 가까이로
    const title = host.querySelector("#su-title");
    if (title && s.step !== lastStep) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
    else if (!host.contains(doc.activeElement)) { const b = host.querySelector(".su-main .b.pri, .su-main .b"); if (b) b.focus({ preventScroll: true }); }
    lastStep = s.step;
  }
  async function refresh() { s.st = await status(); render(); }
  async function refreshGh() { s.busy = "gh"; render(); s.gh = await ghStatus(); s.busy = ""; render(); }
  async function loadRepos() { if (!app || !root.floeApp.myRepos || !githubReady(s.gh)) return; try { const r = await root.floeApp.myRepos(); s.repos = Array.isArray(r) ? r : []; } catch { s.repos = []; } render(); }
  // 칸으로 들어갈 때 필요한 것을 묻는다 — GitHub 칸은 gh 상태, 프로젝트 칸은 내 저장소 목록(gh에 로그인했을 때만 앱이 부른다)
  function enter(step) {
    s.step = step; s.note = ""; render();
    if (step === "github") refreshGh();
    if (step === "apps") appsStatus().then((a) => { if (!host || s.step !== "apps") return; s.apps = a; render(); });
    if (step === "project" && !s.repos.length) loadRepos();
  }
  function burst(kind, n) {
    if (!host || STILL || !Seal || !Seal.burst) return;
    const r = host.querySelector(".su-cat"); if (!r) return;
    const b = r.getBoundingClientRect(); Seal.burst(b.left + b.width / 2, b.top + b.height * 0.3, kind, n, kind === "star" ? 360 : 140);
  }
  async function check() {
    s.busy = "check"; s.checked = null; s.note = ""; render();
    try {
      const r = await fetch("/api/setup/check", { method: "POST" });
      const j = await r.json().catch(() => null);
      s.checked = r.ok && j && j.ok ? true : { error: (j && j.reason) || `서버가 ${r.status}로 답했어요` };
      if (s.checked === true && j.replay) s.note = "녹화를 재생하는 중이라 AI를 부르지 않고 넘어갔어요.";
    } catch { s.checked = { error: "서버에 닿지 않아요 — 앱이나 floe.js가 켜져 있는지 봐 주세요" }; }
    s.busy = ""; render();
    if (s.checked === true) burst("heart", 6);
  }
  // 닫기 — makeRepo: 새로 만든 폴더의 GitHub 저장소를 Claude Code에 맡길지(공개 범위) — 섬(app.js)이 받아 맡긴다
  function close(via, open) {
    save(via);
    const makeRepo = open && offerRepo(s) && s.makeRepo ? s.repoVis : "";
    host.remove(); host = null;
    doc.dispatchEvent(new CustomEvent("floe:setup-done", { detail: { via, open, makeRepo } }));
  }
  // 앱이 폴더를 정했다(가져오기 · 새로 만들기 · 고르기) — 받은 이름 · 자리를 보이고 플로로가 기뻐한다
  function chose(r, made) {
    if (r && r.ok) {
      s.project = { name: r.name || "", where: r.where || "", made: !!(r.made ?? made), repo: r.repo || "" };
      // 가져온 저장소에 Claude Code 설정(.claude/settings.json · .mcp.json)이 있으면 — 맡기는 claude -p는 폴더를 믿는지 묻지 않으므로 그 설정이 이 컴퓨터에서 돈다
      s.note = r.config ? "이 저장소에는 Claude Code 설정이 들어 있어요. 맡기면 그 설정이 이 컴퓨터에서 돌아요 — 내가 넣은 설정인지 한 번 봐 주세요." : "";
      burst("star", 10);
    }
    else if (r && r.message) s.note = r.message;
  }

  async function act(el, e) {
    const a = el.dataset.s;
    if (a === "go") { enter(firstStep(el.dataset.to)); return; }
    if (a === "next") { enter(firstStep(nextStage(flow, s.step))); if (stageOf(s.step) === "done") burst("star", 14); return; }
    if (a === "later") return close("later", false);
    if (a === "practice") { s.via = "practice"; enter("done"); burst("star", 12); return; }
    if (a === "pick") { s.via = el.dataset.via; s.checked = null; enter(s.via); refresh(); return; }
    if (a === "refresh") { s.busy = "find"; render(); await refresh(); s.busy = ""; render(); return; }
    if (a === "check") return check();
    if (a === "ghcheck") return refreshGh();
    if (a === "applink" && live && !s.busy) {   // 같이 쓸 앱 — 서버가 Claude Desktop 설정 파일에 floe 한 칸을 넣는다(app-link.js)
      s.busy = "applink"; s.note = ""; render();
      let j = null; try { j = await (await fetch("/api/apps/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ app: "claude-desktop" }) })).json(); } catch {}
      s.busy = ""; s.note = j && j.ok ? "넣었어요! Claude Desktop을 완전히 종료하고 다시 켜 주세요. 그다음 대화에서 'Floe에서 지금 뭐 해?'라고 물어보면 돼요." : (j && j.reason) || "잇지 못했어요 — 앱이 켜져 있는지 봐 주세요";
      s.apps = await appsStatus(); render(); if (j && j.ok) burst("heart", 6); return;
    }
    if (a === "ghskip") { s.ghSkip = true; enter("project"); return; }
    if (a === "done") return close(s.via || "later", true);
    if (a === "makerepo") { s.makeRepo = !!el.checked; return; }
    if (a === "repovis") { s.repoVis = el.dataset.v === "public" ? "public" : "private"; render(); return; }
    if (a === "pickrepo") { const f = host.querySelector('form[data-s="clone"] input[name="repo"]'); if (f) f.value = el.dataset.v; return cloneFrom(el.dataset.v); }
    if (a === "copy") {
      const t = CMD[el.dataset.k];
      try { await root.navigator.clipboard.writeText(t); el.textContent = "복사함"; } catch { el.textContent = "직접 골라 복사해요"; }
      return;
    }
    if (a === "peek") {
      const inp = host.querySelector('input[name="key"]'); if (!inp) return;
      const on = inp.type === "password"; inp.type = on ? "text" : "password"; el.setAttribute("aria-pressed", String(on)); el.textContent = on ? "가리기" : "보기"; return;
    }
    if (a === "folder" && app && !s.busy) {
      s.busy = "folder"; render();
      let r = null; try { r = await root.floeApp.connect(); } catch { r = { ok: false, message: "폴더를 잇지 못했어요" }; }
      s.busy = ""; chose(r, false); render(); return;
    }
    if (a === "unkey" && app) {
      s.busy = "unkey"; render();
      const r = await root.floeApp.clearKey().catch(() => ({ ok: false, message: "키를 빼지 못했어요" }));
      s.busy = ""; s.note = r && r.ok ? "키를 뺐어요. 이제 Claude Code로 불러요." : (r && r.message) || "키를 빼지 못했어요";
      await refresh(); return;
    }
    if (a === "rekey") { s.st = { ...s.st, apiKey: false }; render(); return; }
  }
  // 가져오는 중(최대 3분)에 처음 설정이 닫혔다 — 앱은 끝까지 가서 작업 폴더를 바꿨으니 섬(app.js)이 알린다
  const picked = (r) => { if (r && r.ok) doc.dispatchEvent(new CustomEvent("floe:project-picked", { detail: { name: r.name || "", config: !!r.config } })); };
  async function cloneFrom(text) {
    if (!app || !String(text || "").trim() || s.busy) return;
    s.busy = "clone"; s.note = ""; render();
    let r; try { r = await root.floeApp.cloneProject(text); } catch { r = { ok: false, message: "가져오지 못했어요" }; }
    if (!host) return picked(r);
    if (r && r.ok) clearTyped();
    s.busy = ""; chose(r, true); render();
  }
  async function makeNew(name) {
    if (!app || s.busy) return;
    s.busy = "new"; s.note = ""; render();
    let r; try { r = await root.floeApp.newProject(name); } catch { r = { ok: false, message: "폴더를 만들지 못했어요" }; }
    if (!host) return picked(r);
    if (r && r.ok) clearTyped();
    s.busy = ""; chose(r, true); render();
  }
  // 가져오기 · 새로 만들기가 됐으면 친 글을 비운다 — render가 다시 그릴 때 친 글을 남기므로(F-103-17) 성공 뒤에는 전처럼 빈 칸으로(새 맥락 리뷰)
  function clearTyped() { for (const i of host.querySelectorAll("input[name]")) i.value = ""; }
  async function submitKey(form) {
    const key = form.key.value.trim(), base = form.base ? form.base.value.trim() : "";
    if (!key) return;
    s.busy = "key"; s.note = ""; render();
    const r = await root.floeApp.saveKey(key, base).catch(() => ({ ok: false, message: "키를 저장하지 못했어요" }));
    s.busy = "";
    if (!r || !r.ok) { s.note = (r && r.message) || "키를 저장하지 못했어요"; render(); return; }
    s.note = "키를 저장했어요. 이제 정말 되는지 볼게요.";
    await refresh();
    return check();
  }

  // step — 처음부터가 아니라 어느 칸에서 열지(설정의 '프로젝트 바꾸기' → "project"). AI 연결은 끝난 것으로 본다
  function open({ step } = {}) {
    if (host) return;
    s = fresh();
    const at = typeof step === "string" && flow.includes(step) && step !== "hello" ? step : "";
    if (at) { s.step = at; s.resumed = true; const saved = readSaved(root.localStorage); s.via = (saved && saved.via) || ""; }   // 인사 화면을 먼저 그리지 않고 바로 그 칸 · 저장된 AI 연결 방식은 그대로
    host = doc.createElement("div"); host.id = "floe-setup";   // 앱 안이면 html.in-app(app.js) — 뒤를 어둡게 깔지 않는다(setup.css)
    doc.body.appendChild(host);
    host.addEventListener("click", (e) => { const el = e.target.closest("[data-s]"); if (el && el.tagName !== "FORM" && !el.disabled) act(el, e); });
    host.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target, k = f.dataset.s;
      if (k === "key" && app) submitKey(f);
      else if (k === "clone") cloneFrom(f.repo.value);
      else if (k === "new") makeNew(f.pname.value.trim());
    });
    host.addEventListener("keydown", (e) => {
      e.stopPropagation();   // 뒤의 오버레이 단축키가 같이 움직이지 않게
      if (e.key === "Escape") { e.preventDefault(); return close(s.resumed || s.step === "done" ? s.via || "later" : "later", false); }   // 설정에서 다시 연 것이면 저장된 AI 연결 방식을 덮지 않는다
      if (e.key === "Enter" && !e.isComposing && !/^(INPUT|TEXTAREA|BUTTON|A|SUMMARY)$/.test(e.target.tagName)) {
        const pri = host.querySelector(".su-main .su-acts .b.pri:not([disabled])"); if (pri) { e.preventDefault(); pri.click(); }
      }
    });
    render();
    doc.dispatchEvent(new CustomEvent("floe:setup-open"));   // 앱이면 app.js가 창을 넓힌다 — 섬 크기 창에 끼지 않게(KAN-57)
    if (s.step === "hello" && !at) setTimeout(() => burst("heart", 7), 250);
    refresh();
    if (at === "project") ghStatus().then((g) => { if (!host) return; s.gh = g; render(); loadRepos(); });
    else if (at) enter(firstStep(at));
  }
  // 칸 더하기 — 예: FloeSetup.addStage("tutorial", { after: "project", view: (s) => "<h2 id=\"su-title\" class=\"mc-title\">…</h2>…" }).
  // view는 제목(#su-title)과 내용만 그린다 — 뒤로 · 다음 단추와 아래 점(●)은 저절로 붙는다
  function addStage(key, { after = "project", view } = {}) {
    if (typeof view !== "function" || !/^[a-z][a-z0-9-]{0,30}$/.test(key) || FLOW.includes(key)) return false;
    extra[key] = { view }; flow = insertStage(flow, key, after);
    return true;
  }

  root.FloeSetup = { ...api, open, addStage };
  // 켤 때 인사(app.js, C-10 2026-10-20)가 돌고 있으면 그것이 끝난 뒤에 연다 — 인사가 두 번 나오지 않게(인사 움직임 → 처음 설정)
  const boot = () => {
    let saved = null; try { saved = readSaved(root.localStorage); } catch {}
    if (!shouldOpen(saved, root.location.hash)) return;
    if (doc.documentElement.classList.contains("greeting")) doc.addEventListener("floe:greet-done", () => open(), { once: true }); else open();
  };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
