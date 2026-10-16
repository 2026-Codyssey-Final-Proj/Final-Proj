// claude-drafted: 2026-10-14, 2026-10-15, 2026-10-16(0~7단계 연습·마무리·빈칸 확인·지금 단계 계산·리퀴드 글래스 굴절) — Navigator 프로토타입 화면 동작.
// 규칙·문구 판단은 navigator.js, 연습 예시는 scenario.js, 몽돌 그림·교감 도구는 seal.js, 실제 Claude 호출은 server.js.
// 넓은 화면(PC) = 코딩 도구 창 위에 떠 있는 옆자리 동료. 2026-10-15 "가로 카드 시안대로" 다시 짬:
//   띠 → 한 줄 → 펼침(위: 아이콘 줄, 아래: 지금 결정할 것 하나를 담은 가로 카드). 카드는 상황마다 색·몽돌 표정·뱃지가 다르다
//   (골라 주세요=파랑, 다 했어요=초록, 넘어가기 전 확인=주황, 작업 알림·살펴보는 중=회색, 오류=빨강). 버튼마다 단축키(1·2·3, Enter, Esc, Y·N).
//   교감: 몽돌을 누르면(또는 좌우로 문지르면) 하트와 한마디, 친해진 정도가 쌓인다. 가만히 두면 졸다가 잠들고, 움직이면 깬다.
//   할 일을 다 하거나 단계를 넘어가면 별이 튀며 축하한다. 작은 소리는 설정에서 켠 사람에게만.
// 600px 이하 = iPhone: 오늘 / 설계도 / 단계 지도 / 내 배움 탭과 넘어가기 전 확인 화면 — 이번에 바꾸지 않았다(PC 먼저). 두 화면은 같은 상태(st)를 쓴다.
// 기록(작업 글·진행·배운 말·설계도·몽돌과 친해진 정도)은 이 브라우저(localStorage)에만 남는다.
(function () {
  const N = window.NavRules, S = window.NavScenario, C = window.NavSeal;
  const canLive = location.protocol.startsWith("http");
  const DELAY = { greet: 6000, home: 15000, petit: 30000 };   // 저절로 접히기까지(밀리초)
  const PHONE = matchMedia("(max-width: 600px)");
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const st = {
    ui: "greet", screen: "main", tab: "today", mode: canLive ? "live" : "fixture", text: canLive ? "" : S.first.text,
    j: null, tokens: 0, busy: false, error: "", notice: "", todos: null, userPin: false, ping: "", openInput: false,
    warn: null,                                    // 보내기 전 경고 {w: 보인 것들, then: 괜찮다고 하면 다시 할 일 judge·draft·review}
    choice: null, later: false, picking: false,
    step: "ask", hard: [], question: "", answer: "", noCount: 0, history: [], learned: [],
    auto: false, feed: { at: 0, project: "", tool: "" },   // Claude Code·Codex 연결: 자동으로 살펴보기(기본 꺼짐), 마지막 알림
    settings: false,                               // 설정(보기 방식·연결·자동 살펴보기·소리·기록)은 톱니를 눌러야 보인다
    doc: null, docs: [],                           // 설계도: 고치는 중인 것 {stage, text, say, review, rounds}, 확정한 것들
    project: "", back: "",                         // 알림에서 받은 프로젝트 폴더 이름, 다시 왔을 때 인사
    finished: false,                               // 7단계까지 모두 마쳤는가
    askConfirm: 0,                                 // 빈칸이 남은 설계도를 확정하려 할 때 — 남은 빈칸 수(한 번 더 묻는 중)
    pets: 0, since: "", sound: false,              // 몽돌과 교감: 쓰다듬은 횟수, 처음 만난 날, 작은 소리(기본 꺼짐)
    mapSel: null, showCrit: false,                 // 단계 지도에서 고른 단계, 펼침 카드 아래 '이 단계 할 일' 펼침
  };
  const $nav = document.getElementById("nav"), $phone = document.getElementById("phone"), $chat = document.getElementById("chat");
  const $fx = document.getElementById("fx");

  // ── 상태에서 바로 계산하는 것 ──
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const met = () => (st.j ? st.j.criteria.map((c) => c.met) : []);
  const metCount = () => met().filter(Boolean).length;
  const left = () => met().length - metCount();
  const allDone = () => !!st.j && left() === 0;
  const stage = () => st.j && N.STAGES[st.j.stage];
  const nextStage = () => st.j && N.STAGES[st.j.stage + 1];
  const isPhone = () => PHONE.matches;
  const isField = (el) => !!el && /^(TEXTAREA|INPUT|SELECT)$/.test(el.tagName);
  // 지금 글을 쓰는 중인가 — 쓰는 중에는 저절로 접히지 않는다
  const typing = () => { const a = document.activeElement; return isField(a) && $nav.contains(a); };
  // 답을 기다리는 중이면 저절로 접히지 않는다 (CouCou의 pinned). 할 일을 다 했으면 확인하러 가자고 펼쳐 둔다
  const pinned = () => st.userPin || st.screen === "gate" || !!st.warn || st.busy || allDone() || st.settings || st.openInput || typing();
  const face = () => N.face({ busy: st.busy, warn: st.warn, error: st.error, gate: st.screen === "gate", step: st.step,
    back: st.finished ? CHEER.finish : st.back, reason: st.j && st.j.reason, allDone: allDone() });
  const tick = () => N.ticker(st.j, st.todos, st.history.length ? st.history[st.history.length - 1].short : "");
  // 단계 n이 지금 단계보다 앞(done)인지, 지금(cur)인지 — 단계 막대·칩·단계 지도가 같이 쓴다
  const stepClass = (n) => { const cur = st.j ? st.j.stage : -1; return n < cur ? "done" : n === cur ? "cur" : ""; };
  const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `${s}초 전` : `${Math.round(s / 60)}분 전`; };
  const cat = C.svg;
  const toolName = (t) => ({ claude: "Claude Code", codex: "Codex" })[t] || "AI 코딩 도구";
  const ymd = () => new Date().toLocaleDateString("sv");   // 이 컴퓨터 시간으로 YYYY-MM-DD
  const project = () => st.project || (st.mode === "fixture" ? S.PROJECT : "내 프로젝트");
  const progress = () => `할 일 ${met().length}개 중 ${metCount()}개`;
  const hardTexts = () => st.hard.map((i) => stage().criteria[i].text);   // 넘어가기 전 확인에서 헷갈린다고 고른 할 일
  const docDone = (n) => st.docs.find((x) => x.stage === n);              // 그 단계에서 확정한 설계도
  const pingHead = () => st.ping.split(" — ")[0];
  // 지금 단계 — 코드가 정한다: 게이트를 통과한 다음 단계(처음엔 0단계). AI는 이 단계의 할 일만 본다
  const atStage = () => (st.j ? st.j.stage : 0);
  // 지금 단계의 연습 버튼
  const stageExamples = () => S.examples.filter((e) => !e.hidden && e.judgement.stage === atStage());
  const RESTART = { label: "연습 처음부터 다시", act: "restart" };
  // 화면 두 곳(PC·iPhone)이 같이 쓰는 문구
  const PLACEHOLDER = "예) 동아리 행사 등록 앱을 만들고 있어요. 필요한 기능을 문장으로 써 봤어요.";
  const SENT = "보여 주신 글은 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처는 빼 주세요.";
  const DOC = {
    first: "먼저 '지금'에서 어디쯤인지 봐요. 설계도는 그 단계에 맞춰 만들어요.",
    none: "설계도는 1~4단계에서 만들어요. 확정한 설계도는 '내 배움'에 모여 있어요.",
    draft: "지금까지 작업을 보고 AI가 초안을 먼저 써 드려요. 고치고 완성하는 건 직접 해요. 확정도 직접 눌러야만 돼요.",
  };
  // 7단계까지 마쳤을 때 — last: 마지막 확인에서 "예" 뒤, title·sub: 마무리 카드
  const END = { last: "좋아요! 이걸로 모든 단계를 마쳐요", title: "여덟 단계를 끝까지 왔어요!",
    sub: "지나온 단계와 배운 말, 확정한 설계도는 '내 배움'에 모여 있어요." };

  // ── 기록 — 이 브라우저에만. 못 쓰는 환경(사생활 보호 창 등)이면 조용히 기록 없이 동작한다 ──
  const KEY = "navigator-prototype:v1";
  const KEEP = ["mode", "text", "j", "todos", "history", "learned", "auto", "doc", "docs", "project", "pets", "since", "sound", "finished"];
  let forgotten = false;
  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return; }
    if (!s || typeof s !== "object") return;
    if (s.j && !(N.STAGES[s.j.stage] && Array.isArray(s.j.criteria))) delete s.j;   // 고장 난 기록은 버린다
    for (const k of KEEP) if (k in s) st[k] = s[k];
    if (st.mode === "live" && !canLive) st.mode = "fixture";
    st.pets = Math.max(0, Number(st.pets) || 0);
    st.back = N.welcome(s, Date.now());
  }
  function save() {
    if (forgotten) return;
    const o = { at: Date.now() };
    for (const k of KEEP) o[k] = st[k];
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {}
  }
  load();
  if (!st.since) st.since = ymd();

  // ── 아이콘 (선 그림) ──
  const icon = (d, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    up: icon('<path d="M6 15l6-6 6 6"></path>', 14), down: icon('<path d="M6 9l6 6 6-6"></path>', 14),
    pin: icon('<path d="M9 4h6l-1 6 3 3H7l3-3z"></path><path d="M12 13v7"></path>', 15),
    back: icon('<path d="M15 5l-7 7 7 7"></path>', 20),
    today: icon('<circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5z"></path>', 24),
    map: icon('<path d="M4 19h4V5H4zM10 19h4V9h-4zM16 19h4v-6h-4z"></path>', 24),
    learn: icon('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"></path>', 24),
    doc: icon('<path d="M6 3h8l5 5v13H6z"></path><path d="M14 3v5h5"></path><path d="M9 13h7M9 17h7"></path>', 24),
    gear: icon('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>', 16),
    check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', 14),
    arrow: icon('<path d="M5 12h14M13 6l6 6-6 6"></path>', 13),
    bubble: icon('<circle cx="12" cy="13" r="7"></circle><circle cx="9.5" cy="10.5" r="1.2"></circle><circle cx="19" cy="5" r="2"></circle>', 15),
  };
  const HEART = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M12 21C5 15.5 2 12 2 8.2 2 5.3 4.3 3 7.1 3c1.9 0 3.6 1 4.9 2.7C13.3 4 15 3 16.9 3 19.7 3 22 5.3 22 8.2 22 12 19 15.5 12 21z"></path></svg>';
  const hearts = (level) => `<span class="hearts">${[0, 1, 2, 3].map((i) => `<i class="${i <= level ? "on" : ""}">${HEART}</i>`).join("")}</span>`;

  // ── 접힘·펼침 (PC 화면만) ──
  let hovering = false, timer = null, idleAt = 0, lastUi = null;
  function clearIdle() { clearTimeout(timer); timer = null; }
  function scheduleIdle() {
    clearIdle();
    // 마우스가 올라가 있으면 인사도 접지 않는다(몽돌을 쓰다듬는 중에 사라지지 않게). 떠나면 다시 센다
    if (isPhone() || st.ui === "hidden" || hovering || (st.ui !== "greet" && pinned())) return;
    idleAt = Date.now();
    timer = setTimeout(() => { timer = null; view("idle"); }, DELAY[st.ui]);
  }
  function go(ui) { if (ui !== st.ui) { st.ui = ui; clearIdle(); } render(); }
  const view = (ev) => go(N.nextView(st.ui, ev, pinned()));   // 일(enter·click·esc·idle·alert)에 따라 다음 모습으로
  // 알릴 일이 생기면 접혀 있던 것(띠·인사)만 한 줄로 살짝 보인다 — 펼쳐져 있으면 그대로
  const peek = () => go(st.ui === "hidden" || st.ui === "greet" ? "petit" : st.ui);
  $nav.addEventListener("mouseenter", () => { hovering = true; clearIdle(); view("enter"); });
  $nav.addEventListener("mouseleave", () => { hovering = false; render(); });

  // ── 두 화면이 함께 쓰는 조각 (iPhone 화면과 PC의 설계도·내 배움·설정이 쓴다) ──
  const sayRow = (size, f = face()) => { const [mood, say] = f; return `<div class="say">${cat(mood, size)}<div class="bubble" aria-live="polite">${esc(say)}</div></div>`; };
  const seg = () => `<div class="seg" aria-hidden="true">${N.STAGES.map((x) => `<span class="${stepClass(x.n)}"></span>`).join("")}</div>`;
  // 카드 하나 — PC는 테두리 상자(.choose), iPhone은 흰 카드(.card). 넘기는 글은 이미 esc 한 것
  const box = (label, title, why, extra = "") => (isPhone()
    ? `<div class="card"><span class="kicker">${label}</span><span class="big">${title}</span>`
    : `<div class="choose"><span class="label">${label}</span><span class="q">${title}</span>`) + `${why ? `<span class="why">${why}</span>` : ""}${extra}</div>`;
  // 보내기 전 경고 — 값은 다시 보이지 않고 종류만 말한다
  const warnNote = (no, noLabel) => `<div class="note n-warn"><b>보내기 전에 잠깐!</b> 글 안에 ${esc(st.warn.w.join(", "))}처럼 보이는 게 있어요. 그래도 AI에게 보낼까요?
    <div class="row" style="margin-top:8px"><button class="btn" data-act="send-anyway">괜찮아요, 보낼게요</button><button class="btn pri" data-act="${no}">${noLabel}</button></div></div>`;
  const errorNote = () => (st.error ? `<div class="note n-bad">${esc(st.error)}</div>` : "");
  // 설계도 화면의 경고·오류 (작업 글의 경고는 글 칸 옆에 따로 뜬다)
  const docNotes = () => (st.askConfirm ? `<div class="note n-warn" data-ask-confirm><b>빈칸이 ${st.askConfirm}개 남았어요.</b> 그래도 이대로 확정할까요?
    <div class="row" style="margin-top:8px"><button class="btn" data-act="confirm-anyway">그래도 확정할게요</button><button class="btn pri" data-act="confirm-cancel">빈칸 채우러 가기</button></div></div>` : "")
    + (st.warn && st.warn.then !== "judge" ? warnNote("stop-send", "그만둘게요") : "") + errorNote();
  // 체크 표시 한 줄 — 할 일 목록·단계 지도·다시 봐 준 결과가 같이 쓴다. inner는 이미 esc 한 것
  const ckItem = (ok, inner) => `<li><span class="ck ${ok ? "y" : "n"}">${ok ? "✓" : "○"}</span><span>${inner}</span></li>`;
  const termTag = (t) => (t ? `<span class="tag" title="전문가들이 부르는 이름이에요">용어: ${esc(t)}</span>` : "");
  // 넘어가기 전 확인의 한 장 요약 — [이름, 내용]. iPhone은 줄로, PC는 표로 그린다
  function planRows() {
    const s = stage(), nx = nextStage();
    return [["받은 것", s.gets], ["한 일", s.does], ["만든 것", s.gives], ["헷갈렸던 부분", hardTexts().join(", ")], ["받은 답", st.answer],
      ...(nx ? [["다음 단계", `${nx.n}단계 ${nx.title} — ${nx.does}`]] : [])];
  }
  // 내가 정한 순서 — move면 위·아래 버튼까지
  const todoList = (move) => `<ol class="todo">${st.todos.map((t, i) => `<li><span class="i">${i + 1}</span><span>${esc(t)}</span>${move ? `
    <button class="round" data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? "disabled" : ""}>${I.up}</button>
    <button class="round" data-act="down" data-i="${i}" aria-label="아래로" ${i === st.todos.length - 1 ? "disabled" : ""}>${I.down}</button>` : ""}</li>`).join("")}</ol>`;
  // 골라 주세요(iPhone) — 고르는 건 사용자다. 고르면 작업 글에 한 줄로 적고 다시 살펴본다
  function chooseCard() {
    const n = st.j.next;
    if (st.later) return `<div class="row"><span class="meta grow">나중에 정하기로 했어요 — ${esc(n.question)}</span><button class="btn" data-act="again">다시 고르기</button></div>`;
    return `<div class="choose"><span class="label">골라 주세요</span><span class="q">${esc(n.question)}</span><span class="why">${esc(n.why)}</span>
      ${n.options.map((o, i) => `<button class="opt" data-act="opt" data-i="${i}" aria-pressed="${st.choice === i}"><span class="radio"></span>${esc(o)}</button>`).join("")}
      <div class="row"><button class="btn pri grow" data-act="decide" ${st.choice === null || st.busy ? "disabled" : ""}>이걸로 정할게요</button><button class="btn" data-act="later">나중에</button></div>
      <span class="meta">${esc(n.action)}</span></div>`;
  }
  const critList = (terms) => `<ul class="crit">${st.j.criteria.map((c) => ckItem(c.met, `${esc(c.text)}${terms ? termTag(c.term) : ""}${
    c.evidence ? `<span class="sub">적어 주신 글: "${esc(c.evidence)}"</span>` : ""}`)).join("")}</ul>`;
  const notes = () => (st.notice ? `<div class="note n-ok">${esc(st.notice)}</div>` : "");
  function inputBox() {
    let h = `<textarea data-act="text" aria-label="지금 만드는 것" placeholder="${PLACEHOLDER}">${esc(st.text)}</textarea>
      <div class="row">${stageExamples().map((e) => `<button class="btn" data-act="ex" data-i="${S.examples.indexOf(e)}">${esc(e.label)}</button>`).join("")}
      <span class="grow"></span><button class="btn pri" data-act="judge" ${st.busy ? "disabled" : ""}>어디쯤인지 보기</button></div>`;
    if (st.mode === "live") h += `<p class="meta" style="margin:0">${SENT}</p>`;
    if (st.warn && st.warn.then === "judge") h += warnNote("edit", "고칠게요");
    return `<div class="stack">${h}${errorNote()}</div>`;
  }
  const inputDetails = () => `<details ${st.error || st.warn || st.openInput ? "open" : ""}><summary>바뀐 작업 다시 보여 주기</summary>${inputBox()}</details>`;
  const modeBadge = () => (st.mode === "live"
    ? `<span class="badge live">진짜 AI(Claude)가 봐요${st.tokens ? ` · 지난번 읽고 쓴 양 약 ${st.tokens.toLocaleString()}토큰` : ""}</span>`
    : `<span class="badge fix">연습용 예시예요 — 진짜 AI가 아니에요</span>`);
  // 설정 — 보기 방식, Claude Code·Codex 연결 상태, 자동으로 살펴보기, 소리, 기록. PC·iPhone 모두 톱니 뒤에
  function settingsBody() {
    const link = canLive && st.mode === "live" ? `<div class="link"><div class="row"><span class="led ${st.feed.at ? "on" : ""}"></span><span class="grow">${st.feed.at
        ? `${toolName(st.feed.tool)}와 연결됨 · ${esc(st.feed.project || "프로젝트")} · 마지막 알림 ${ago(st.feed.at)}`
        : "Claude Code·Codex 알림을 기다리는 중 — connect.js로 연결해 주세요"}</span></div>
      <label class="chk"><input type="checkbox" data-act="auto" ${st.auto ? "checked" : ""}>AI 코딩 도구가 작업을 마치면 자동으로 살펴보기</label>
      <span>켜면 그때마다 최근 작업 대화가 AI(Claude)로 보내져요. 비밀번호처럼 보이는 게 있으면 보내기 전에 멈춰요.</span></div>` : "";
    const keep = `<div class="row"><span class="grow">기록은 이 컴퓨터의 브라우저에만 남아요.</span><button class="btn" data-act="forget">기록 지우기</button></div>`;
    return `${link}<div class="row">${modeBadge()}<span class="grow">안내 기준은 아직 시험판이에요</span></div>
      <div class="row">보기 방식 <select data-act="mode" aria-label="보기 방식">
        <option value="fixture" ${st.mode === "fixture" ? "selected" : ""}>연습용 예시</option>
        <option value="live" ${st.mode === "live" ? "selected" : ""} ${canLive ? "" : "disabled"}>진짜 AI (Claude)${canLive ? "" : " — server.js를 켜야 해요"}</option></select></div>
      <label class="chk"><input type="checkbox" data-act="sound" ${st.sound ? "checked" : ""}>몽돌이 작은 소리 내기 (쓰다듬을 때, 다 했을 때)</label>${keep}`;
  }
  const settingsCard = () => (st.settings ? `<div class="foot settings">${settingsBody()}</div>` : "");
  const gearBtn = () => `<button class="round" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 — 보기 방식, 연결, 기록">${I.gear}</button>`;

  // 단계 지도 · 내 배움 — iPhone 탭이 쓰고, PC는 내 배움 카드만 같이 쓴다
  const mapBody = () => `<div class="list">${N.STAGES.map((x) => `<div>
      <span class="dot ${stepClass(x.n)}"></span><span style="flex:1;padding:8px 0"><b>${x.n} · ${esc(x.title)}</b><span class="sub">${esc(x.does)}</span></span>
      ${stepClass(x.n) === "cur" ? `<span class="meta">${metCount()}/${met().length}</span>` : ""}</div>`).join("")}</div>`;
  // 카드 하나 — 제목, 목록(없으면 안내 한 줄)
  const section = (kicker, items, row, empty) =>
    `<div class="card"><span class="kicker">${kicker}</span>${items.length ? items.map(row).join("") : `<span class="meta">${empty}</span>`}</div>`;
  const learnBody = () =>
    section("지나온 단계", st.history, (x) => `<span class="meta">${esc(x.text)}</span>`, "아직 없어요. 한 단계를 마치면 여기 남아요.") +
    section("배운 말", st.learned, (x) => `<div><b>${esc(x.term)}</b><span class="sub">${esc(x.text)}</span></div>`,
      "할 일을 하나씩 마치면, 전문가들이 부르는 이름을 여기 모아 드려요.") +
    section("내가 확정한 설계도", st.docs, (x) => `<details><summary>${x.stage}단계 · ${esc(x.name)} · ${esc(x.at)}</summary><pre class="doc-view">${esc(x.text)}</pre></details>`,
      "설계도를 확정하면 여기 모여요.");
  const TABS = [["today", "지금", "오늘", "today"], ["doc", "설계도", "설계도", "doc"], ["map", "단계 지도", "단계 지도", "map"], ["learn", "내 배움", "내 배움", "learn"]];  // [id, PC 이름, iPhone 이름, 아이콘]
  // 설계도(FR-3, iPhone) — 초안은 AI가 먼저, 고치는 건 사용자, 다시 봐 주는 건 AI, 확정은 사용자만
  function docBody(size) {
    const s = st.j && stage();
    if (!s) return sayRow(size, ["idle", DOC.first]);
    const { done, d, face: f } = docState(s), say = sayRow(size, f), label = `설계도 · ${s.n}단계`;
    if (!s.doc) return say + box(label, `${s.n}단계는 설계도 없이 진행해요`, DOC.none);
    if (!d && done) return say + box(label, esc(s.doc), `${esc(done.at)}에 직접 확정했어요.`,
      `<details><summary>확정한 설계도 보기</summary><pre class="doc-view">${esc(done.text)}</pre></details><button class="btn wide" data-act="reopen-doc">고쳐 쓰기</button>`);
    if (!d) return say + box(label, esc(s.doc), DOC.draft,
      `${docNotes()}<button class="btn pri wide" data-act="draft" ${st.busy ? "disabled" : ""}>초안 받기</button>
      ${st.mode === "live" ? `<span class="meta">작업 글이 AI(Claude)에게 보내져요.</span>` : ""}`);
    const ready = d.review && d.review.ready;
    const confirm = `<button class="btn ${ready ? "pri" : ""}" data-act="confirm-doc">${ready ? "이걸로 확정할게요" : "이대로 확정"}</button>`;
    const again = `<button class="btn ${ready ? "" : "pri"} grow" data-act="review" ${st.busy ? "disabled" : ""}>다시 봐 주세요</button>`;
    return `${say}<div class="stack"><div class="stage-head"><span class="stage-title">${esc(s.doc)}</span>
      <span class="meta" data-blanks>${blankMeta(d)}</span></div>
      <textarea class="doc" data-act="doc" aria-label="설계도">${esc(d.text)}</textarea>
      ${reviewList(d.review)}${docNotes()}<div class="row">${again}${confirm}</div>
      <span class="meta">고친 뒤 '다시 봐 주세요'를 누르면 고칠 곳을 알려 드려요. 대신 고쳐 쓰지는 않아요.</span></div>`;
  }
  // 이 단계의 설계도 — 확정한 것(done), 고치는 중인 것(d), 몽돌의 표정과 한마디(face)
  function docState(s) {
    const done = docDone(s.n), d = st.doc && st.doc.stage === s.n ? st.doc : null;
    return { done, d, face: N.docFace({ busy: st.busy, warn: st.warn, error: st.error, review: d && d.review, draftSay: d && d.say, done }) };
  }
  const reviewList = (r) => (r ? `<div class="card review"><span class="kicker">다시 봐 드렸어요${st.mode === "fixture" ? " · 연습용이라 빈칸이 남았는지만 봐요" : ""}</span><ul class="crit">
      ${r.good.map((g) => ckItem(true, esc(g))).join("")}
      ${r.fix.map((f) => ckItem(false, `<b>"${esc(f.where)}"</b> — ${esc(f.why)}<span class="sub">고치는 방향: ${esc(f.hint)}</span>`)).join("")}</ul></div>` : "");
  const blankMeta = (d) => { const n = N.blanks(d.text).length; return `${n ? `빈칸 ${n}개` : "빈칸 없음"} · 봐 드린 횟수 ${d.rounds}번`; };

  // 넘어가기 전 확인(iPhone) — 단계마다 [내용, 버튼]. 버튼은 아래에 붙인다
  function checkStep() {
    const s = stage(), nx = nextStage();
    const yesNo = `<span class="ask">이번 단계에서 한 일, 이해되셨나요?</span>
      <button class="btn pri wide" data-act="yes">네, 이해했어요</button><button class="btn wide" data-act="no">아니요, 잘 모르겠어요</button>
      <span class="meta" style="text-align:center">"아니요"를 누르면 같이 풀어 봐요.${st.noCount ? ` · 다시 물어본 횟수 ${st.noCount}번` : ""}</span>`;
    if (st.step === "which") return [`<span class="ask">어디가 헷갈렸나요?</span><span class="meta">여러 개 골라도 돼요.</span>` +
      s.criteria.map((c, i) => `<label class="chk"><input type="checkbox" data-act="hard" data-i="${i}" ${st.hard.includes(i) ? "checked" : ""}>${esc(c.text)}</label>`).join(""),
      `<button class="btn pri wide" data-act="to-question" ${st.hard.length ? "" : "disabled"}>다음</button>`];
    if (st.step === "question") return [`<span class="ask">궁금한 걸 편하게 물어보세요</span>
      <textarea data-act="question" placeholder="예) 꼭 필요한지 표시하는 건 왜 해요?">${esc(st.question)}</textarea>
      ${st.answer ? `<div class="note n-acc">${esc(st.answer)}</div>` : ""}${errorNote()}`,
      `<button class="btn pri wide" data-act="answer" ${st.busy ? "disabled" : ""}>물어보기</button>${st.answer ? `<button class="btn wide" data-act="plan">한 장 요약 보기</button>` : ""}`];
    if (st.step === "plan") return [`<span class="ask">이번 단계 한 장 요약</span><div class="plan">
      ${planRows().map(([k, v]) => `<div><b>${k}</b> ${esc(v)}</div>`).join("")}</div>`, yesNo];
    if (st.step === "next" && !nx) return [`<span class="ask">${END.last}</span>`, `<button class="btn pri wide" data-act="go">마치기</button>`];
    if (st.step === "next") return [`<span class="ask">좋아요! 다음은 ${nx ? `${nx.n}단계 "${esc(nx.title)}"` : "마무리"}예요</span>
      <span class="meta">무엇부터 할지 순서를 정해 보세요.</span>${todoList(true)}`,
      `<button class="btn pri wide" data-act="go" ${N.canAdvance(met(), "yes") ? "" : "disabled"}>이 순서로 시작하기</button>`];
    return ["", yesNo];
  }
  const chips = () => `<div class="chips">${N.STAGES.map((x) => `<span class="chip ${stepClass(x.n)}">${stepClass(x.n) === "done" ? "✓ " : ""}${x.n} ${esc(x.short)}</span>`).join("")}</div>`;
  const flow = () => { const s = stage(); return `<div class="flow"><div class="box"><b>받은 것</b>${esc(s.gets)}</div><span class="arrow">→</span>
    <div class="box"><b>한 일</b>${esc(s.does)}</div><span class="arrow">→</span><div class="box"><b>만든 것</b>${esc(s.gives)}${
    docDone(s.n) ? `<span class="sub ok">✓ 설계도 확정함</span>` : ""}</div></div>`; };
  // iPhone의 지금 결정할 것 하나 — 다 했으면 "넘어가기", 순서를 정했으면 그 첫 일, 아니면 같이 정하기
  function focusCard() {
    const n = st.j.next, now = esc(tick().now);
    if (st.finished) return box("다 했어요", END.title, END.sub,
      st.mode === "fixture" ? `<button class="btn wide" data-act="${RESTART.act}">${RESTART.label}</button>` : "");
    if (allDone()) return box("다 했어요", `${stage().n}단계 할 일을 모두 했어요`, "넘어가기 전에 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      `<button class="btn pri wide" data-act="gate">다음 단계로 넘어가기</button>`);
    if (st.todos) return box("지금 할 일", esc(st.todos[0]), "정한 순서대로 하나씩 해 봐요. 하고 나서 바뀐 작업을 다시 보여 주세요.");
    if (!n) return box("지금 할 일", now, "");
    return st.picking || st.later ? box("지금 할 일", now, "", chooseCard())
      : box("지금 할 일", now, esc(n.why), `<button class="btn pri wide" data-act="pick">같이 정하기</button>`);
  }
  const more = () => `<div class="more">
    <details><summary>이 단계 할 일 ${met().length}개 보기</summary>${critList(true)}</details>
    ${st.todos ? `<details><summary>내가 정한 순서 보기</summary>${todoList(false)}</details>` : ""}
    ${inputDetails()}</div>`;

  // ── PC 화면 — 가로 카드 ──
  // 지금 보이는 카드의 단축키 { 키: 할 일 } — 카드를 그릴 때 채운다
  let deskKeys = {};
  const KEYCAP = { Enter: "Enter", Escape: "Esc", "c-Enter": "Ctrl+Enter" };
  const kbd = (k) => (k ? `<kbd aria-hidden="true">${KEYCAP[k] || k.toUpperCase()}</kbd>` : "");
  // 버튼 하나 {label, act, i, key, pri, kind, pressed}. kind에 opt가 있으면 선택지(단축키가 앞에)
  const isOpt = (a) => /opt/.test(a.kind || "");
  function btn(a) {
    const cls = ["b", a.pri && "pri", a.kind].filter(Boolean).join(" ");
    const data = `data-act="${a.act}"${a.i !== undefined ? ` data-i="${a.i}"` : ""}${a.pressed !== undefined ? ` aria-pressed="${a.pressed}"` : ""}`;
    const tip = a.key ? ` title="단축키 ${KEYCAP[a.key] || a.key.toUpperCase()}"` : "";
    return isOpt(a) ? `<button class="${cls}" ${data}${tip}>${kbd(a.key)}<span>${esc(a.label)}</span></button>`
      : `<button class="${cls}" ${data}${tip}>${esc(a.label)}${kbd(a.key)}</button>`;
  }

  // 몽돌 — 기분은 [잠깐 짓는 표정(쓰다듬기·축하) > 졸음 > 안내 화면의 표정] 순서. 졸음은 편한 표정일 때만
  let flashMood = { mood: "", until: 0 }, sleepState = "awake";
  const CALM = ["idle", "happy", "done"];
  const liveMood = (base) => (flashMood.until > Date.now() ? flashMood.mood : sleepState !== "awake" && CALM.includes(base) ? sleepState : base);
  // 쓰다듬을 수 있는 몽돌 — 누르거나 좌우로 문지르면 된다. data-live는 기분이 바뀌면 같이 바뀌는 몽돌
  const petCat = (mood, size, extra = "") => `<button class="pet" data-act="pet" data-pet data-live data-base="${mood}" aria-label="몽돌 쓰다듬기"
    title="몽돌 쓰다듬기 — 눌러도, 좌우로 문질러도 돼요">${cat(liveMood(mood), size, { extra, hole: true })}</button>`;

  const mini = () => `<span class="mini" aria-hidden="true">${met().map((m) => `<i class="${m ? "on" : ""}"></i>`).join("")}</span>`;
  const stageMeta = () => { const s = stage(); return `<span class="mm-stage">${s.n}단계 · ${esc(s.title)}</span><span>${allDone() ? `할 일 ${met().length}개 모두 했어요` : progress()}</span>${mini()}`; };
  const flowLine = () => { const s = stage(); return `<span class="flowline"><span>${esc(s.gets)}</span>${I.arrow}<span>${esc(s.does)}</span>${I.arrow}<span>${esc(s.gives)}</span>${
    docDone(s.n) ? `<span class="okchip">${I.check}설계도 확정함</span>` : ""}</span>`; };
  const dots = `<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const deskInput = () => `<textarea class="mc-input" data-act="text" rows="3" aria-label="지금 만드는 것"
    placeholder="${PLACEHOLDER}">${esc(st.text)}</textarea>${st.mode === "live" ? `<p class="mc-fine">${SENT}</p>` : ""}`;
  const exampleActs = () => stageExamples().map((e) => ({ label: e.label, act: "ex", i: S.examples.indexOf(e), kind: "soft" }));

  // 지금 결정할 것 하나 — 위에 있는 상황이 먼저다.
  // 돌려주는 것: {tone, mood, badge, say(몽돌의 한마디), meta, title, sub, body, acts, foot} — 글은 이미 esc 한 것
  function momentToday() {
    const s = st.j && stage(), f = face();
    if (st.busy) return { tone: "gray", mood: "look", badge: "…", meta: s ? stageMeta() : "", title: `살펴보고 있어요${dots}`,
      sub: st.mode === "live" ? "진짜 AI(Claude)가 글을 읽고 있어요. 잠깐만 기다려 주세요." : "잠깐만요!", acts: [] };
    if (st.warn) {
      const fix = st.warn.then === "judge";
      return { tone: "amber", mood: "alert", badge: "!", title: "보내기 전에 잠깐!",
        sub: `글 안에 ${esc(st.warn.w.join(", "))}처럼 보이는 게 있어요. 그래도 AI(Claude)에게 보낼까요?`,
        acts: [{ label: fix ? "고칠게요" : "그만둘게요", act: fix ? "edit" : "stop-send", key: "Enter", pri: true }, { label: "괜찮아요, 보낼게요", act: "send-anyway" }] };
    }
    if (st.error) return { tone: "red", mood: "think", extra: "oops", badge: "×", meta: s ? stageMeta() : "", title: "음, 잘 안 됐어요", sub: esc(st.error),
      acts: [{ label: "글 고쳐서 다시 해 보기", act: "retry-input", key: "Enter", pri: true }, { label: "닫기", act: "dismiss", key: "Escape", kind: "ghost" }] };
    if (st.screen === "gate") return momentGate();
    if (st.ping) return { tone: "gray", mood: "look", badge: "…",
      meta: `<span class="mm-stage">${esc(pingHead())}</span>${s ? `<span>${s.n}단계 · ${progress()}</span>${mini()}` : ""}`,
      title: "바뀐 작업을 보고, 어디쯤인지 알려 드릴까요?",
      sub: st.mode === "live" ? "최근 작업 대화가 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처처럼 보이는 게 있으면 보내기 전에 멈춰요."
        : "연습용 예시라서, 미리 만들어 둔 응답으로 살펴봐요.",
      acts: [{ label: "살펴봐 주세요", act: "look-now", key: "Enter", pri: true }, { label: "보낼 글 먼저 보기", act: "peek-text" },
        { label: "나중에", act: "ping-later", key: "Escape", kind: "ghost" }] };
    if (!st.j || st.openInput) {
      const first = !st.j;
      return { tone: "blue", mood: f[0], badge: "", say: first ? "" : f[1], meta: first ? `<span class="mm-stage">시작하기</span>` : stageMeta(),
        title: first ? "지금 만들고 있는 걸 보여 주세요" : "바뀐 작업을 보여 주세요",
        sub: first ? "무엇을 만들고 있는지, 어디까지 했는지 편하게 적어 주세요." : "하고 나서 바뀐 걸 덧붙여 주시면, 다시 어디쯤인지 봐 드려요.",
        body: deskInput(),
        acts: [...exampleActs(), { label: "어디쯤인지 보기", act: "judge", key: "c-Enter", pri: true },
          ...(first ? [] : [{ label: "닫기", act: "close-input", key: "Escape", kind: "ghost" }])] };
    }
    if (st.finished) return { tone: "green", mood: "happy", badge: "✓", meta: `<span class="mm-stage">모든 단계를 마쳤어요</span>`,
      title: END.title, sub: END.sub,
      acts: [{ label: "내 배움 보기", act: "tab", i: 3, key: "Enter", pri: true }, ...(st.mode === "fixture" ? [RESTART] : [])] };
    if (allDone()) return { tone: "green", mood: f[0], badge: "✓", meta: stageMeta(), title: `${s.n}단계 할 일을 모두 했어요!`,
      sub: "다음 단계로 가기 전에, 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      acts: [{ label: "확인하고 넘어가기", act: "gate", key: "Enter", pri: true }, { label: "나중에", act: "fold", key: "Escape", kind: "ghost" }] };
    if (st.todos) return { tone: "blue", mood: f[0], badge: "", say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(st.todos[0])}`,
      sub: "정한 순서대로 하나씩 해 봐요. 하고 나서 바뀐 작업을 보여 주세요.",
      body: `<ol class="steps">${st.todos.map((t, i) => `<li class="${i === 0 ? "now" : ""}"><b>${i + 1}</b>${esc(t)}</li>`).join("")}</ol>`,
      acts: [{ label: "하고 나서 바뀐 작업 보여 주기", act: "open-input", key: "Enter", pri: true }, { label: "나중에", act: "fold", key: "Escape", kind: "ghost" }] };
    const n = st.j.next;
    if (!n) return { tone: "blue", mood: f[0], badge: "", say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(tick().now)}`, sub: "",
      acts: [{ label: "바뀐 작업 보여 주기", act: "open-input", key: "Enter", pri: true }] };
    if (st.later) return { tone: "blue", mood: f[0], badge: "?", meta: stageMeta(), title: "나중에 정하기로 했어요", sub: esc(n.question),
      acts: [{ label: "지금 고르기", act: "again", key: "Enter", pri: true }, { label: "바뀐 작업 보여 주기", act: "open-input" }] };
    return { tone: "blue", mood: f[0], badge: "?", say: f[1], meta: stageMeta(), title: esc(n.question), sub: esc(n.why),
      acts: [...n.options.map((o, i) => ({ label: o, act: "pick-opt", i, key: String(i + 1), kind: "opt" })),
        { label: "나중에", act: "later", key: "Escape", kind: "ghost" }],
      foot: esc(n.action) };
  }
  // 넘어가기 전 확인 — 이해했나요? → (아니요) 헷갈린 곳 → 묻기 → 한 장 요약 → (예) 다음 단계 순서 정하기
  function momentGate() {
    const s = stage(), nx = nextStage(), meta = `<span class="mm-stage">${s.n}단계에서 한 일</span>${flowLine()}`;
    const yes = { label: "네, 이해했어요", act: "yes", key: "y", pri: true }, no = { label: "아니요, 같이 풀어요", act: "no", key: "n" };
    const later = { label: "나중에", act: "close-gate", key: "Escape", kind: "ghost" };
    if (st.step === "which") return { tone: "amber", mood: "think", badge: "?", meta, title: "어디가 헷갈렸나요?", sub: "여러 개 골라도 돼요. 고른 곳부터 같이 풀어요.",
      acts: [...s.criteria.map((c, i) => ({ label: c.text, act: "hard-t", i, key: String(i + 1), kind: "opt toggle", pressed: st.hard.includes(i) })),
        { label: "다음", act: "to-question", key: "Enter", pri: true }, later] };
    if (st.step === "question") return { tone: "amber", mood: face()[0], badge: "?", meta,
      title: "궁금한 걸 편하게 물어보세요", sub: `헷갈린 곳: ${esc(hardTexts().join(", "))}`,
      body: `<textarea class="mc-input" data-act="question" rows="2" aria-label="궁금한 것" placeholder="예) 꼭 필요한지 표시하는 건 왜 해요?">${esc(st.question)}</textarea>${
        st.answer ? `<div class="answer"><b>몽돌의 답</b>${esc(st.answer)}</div>` : ""}`,
      acts: [{ label: "물어보기", act: "answer", key: "c-Enter", pri: !st.answer }, ...(st.answer ? [{ label: "한 장 요약 보기", act: "plan", key: "Enter", pri: true }] : []), later] };
    if (st.step === "plan") return { tone: "amber", mood: face()[0], badge: "!", meta: `<span class="mm-stage">${s.n}단계 한 장 요약</span>`,
      title: "이렇게 정리해 봤어요. 이제 어때요?", sub: "",
      body: `<dl class="sheet">${planRows().map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`,
      acts: [yes, { ...no, label: "아직 잘 모르겠어요" }, later] };
    if (st.step === "next" && !nx) return { tone: "green", mood: "happy", badge: "✓", meta: `<span class="mm-stage">마무리</span>`,
      title: END.last, sub: "", acts: [{ label: "마치기", act: "go", key: "Enter", pri: true }, later] };
    if (st.step === "next") return { tone: "green", mood: "happy", badge: "✓", meta: `<span class="mm-stage">${nx ? `다음은 ${nx.n}단계 · ${esc(nx.title)}` : "마무리"}</span>`,
      title: "좋아요! 무엇부터 할지 순서를 정해 볼까요?", sub: "위아래 화살표로 순서를 바꿀 수 있어요. 정한 순서대로 하나씩 안내할게요.",
      body: todoList(true), acts: [{ label: "이 순서로 시작하기", act: "go", key: "Enter", pri: true }, later] };
    return { tone: "amber", mood: face()[0], badge: "!", meta, title: "이번 단계에서 한 일, 이해되셨나요?",
      sub: `잘 모르겠으면 헷갈린 곳을 골라 같이 풀어요. 몇 번이고 괜찮아요.${st.noCount ? ` (다시 물어본 횟수 ${st.noCount}번)` : ""}`,
      acts: [yes, no, later] };
  }
  // 가로 카드 하나 — 왼쪽 몽돌, 오른쪽 [한마디 · 작은 줄 · 굵은 제목 · 설명 · 선택지 · 버튼]
  function card(v) {
    for (const a of v.acts) if (a.key) deskKeys[a.key] = a;
    let opts = v.acts.filter(isOpt), rest = v.acts.filter((a) => !isOpt(a));
    // 선택지 뒤에 '나중에'만 남으면 같은 줄에 — 카드가 낮아진다
    if (opts.length && rest.every((a) => a.kind === "ghost")) { opts = opts.concat(rest); rest = []; }
    return `<section class="mc tone-${v.tone}">
      <div class="mc-cat">${petCat(v.mood, 108, v.extra)}${v.badge ? `<span class="mc-badge" aria-hidden="true">${v.badge}</span>` : ""}</div>
      <div class="mc-main">
        ${st.notice ? `<p class="mc-notice">${I.check}${esc(st.notice)}</p>` : ""}
        ${v.say ? `<p class="mc-say">${esc(v.say)}</p>` : ""}
        ${v.meta ? `<div class="mc-meta">${v.meta}</div>` : ""}
        <h2 class="mc-title" aria-live="polite">${v.title}</h2>
        ${v.sub ? `<p class="mc-sub">${v.sub}</p>` : ""}
        ${v.body || ""}
        ${opts.length ? `<div class="opts">${opts.map(btn).join("")}</div>` : ""}
        ${rest.length ? `<div class="acts">${rest.map(btn).join("")}</div>` : ""}
        ${v.foot ? `<p class="mc-foot">${v.foot}</p>` : ""}
      </div></section>`;
  }
  // 카드 아래 작은 줄 — 이 단계 할 일 펼치기, 바뀐 작업 다시 보여 주기
  function deskMore() {
    if (!st.j || st.busy || st.warn || st.error) return "";
    const open = st.showCrit;
    return `<div class="more-row"><button class="lnk" data-act="crit" aria-expanded="${open}">${open ? I.up : I.down}이 단계 할 일 ${met().length}개 ${open ? "접기" : "보기"}</button>${
      st.openInput || st.screen === "gate" ? "" : `<button class="lnk" data-act="open-input">바뀐 작업 다시 보여 주기</button>`}</div>${
      open ? `<div class="crit-grid">${critList(true)}</div>` : ""}`;
  }
  // 설계도 — 왼쪽 몽돌과 버튼, 오른쪽 글. 초안은 AI가 먼저, 고치는 건 사용자, 다시 봐 주는 건 AI, 확정은 사용자만
  const docShell = (mood, say, side, main) => `<div class="docx"><div class="doc-side">${petCat(mood, 92)}<p class="doc-say">${esc(say)}</p>
    <div class="doc-acts">${side}</div></div><div class="doc-main">${main}</div></div>`;
  function deskDoc() {
    const s = st.j && stage();
    if (!s) return docShell("idle", DOC.first, `<button class="b pri" data-act="tab" data-i="0">'지금'으로 가기</button>`,
      `<div class="doc-empty">${I.doc}<b>아직 설계도가 없어요</b><span>어디쯤인지 보고 나면, 그 단계에 맞는 설계도를 같이 만들어요.</span></div>`);
    const { done, d, face: [mood, say] } = docState(s);
    if (!s.doc) return docShell(mood, say, "", `<div class="doc-empty">${I.doc}<b>${s.n}단계는 설계도 없이 진행해요</b><span>${DOC.none}</span></div>`);
    if (!d && done) return docShell(mood, say, `<span class="meta">${esc(done.at)}에 직접 확정했어요</span><button class="b" data-act="reopen-doc">고쳐 쓰기</button>`,
      `<div class="doc-head"><h3>${esc(s.doc)}</h3><span class="okchip">${I.check}확정함</span></div><pre class="doc-view">${esc(done.text)}</pre>`);
    if (!d) return docShell(mood, say, `<button class="b pri" data-act="draft" ${st.busy ? "disabled" : ""}>초안 받기</button>${
      st.mode === "live" ? `<span class="meta">작업 글이 AI(Claude)에게 보내져요.</span>` : ""}`,
      `${docNotes()}<div class="doc-empty">${I.doc}<b>${esc(s.doc)}</b><span>${DOC.draft}</span></div>`);
    const ready = d.review && d.review.ready;
    return docShell(mood, say, `<span class="meta" data-blanks>${blankMeta(d)}</span>
        <button class="b ${ready ? "" : "pri"}" data-act="review" ${st.busy ? "disabled" : ""}>다시 봐 주세요</button>
        <button class="b ${ready ? "pri" : ""}" data-act="confirm-doc">${ready ? "이걸로 확정할게요" : "이대로 확정"}</button>
        <span class="meta">고칠 곳만 알려 드려요. 대신 고쳐 쓰지는 않아요.</span>`,
      `<div class="doc-head"><h3>${esc(s.doc)}</h3><span class="meta">${s.n}단계</span></div><textarea class="doc" data-act="doc" aria-label="설계도">${esc(d.text)}</textarea>${reviewList(d.review)}${docNotes()}`);
  }
  // 단계 지도 — 여덟 단계를 한 줄로. 몽돌은 지금 단계 위에 앉아 있다. 누르면 그 단계를 자세히 본다
  function deskMap() {
    const cur = st.j ? st.j.stage : -1, sel = st.mapSel ?? Math.max(cur, 0), s = N.STAGES[sel];
    const track = N.STAGES.map((x) => { const c = stepClass(x.n); return `<li class="node ${c}${x.n === sel ? " sel" : ""}">
      <button data-act="map-sel" data-i="${x.n}" aria-pressed="${x.n === sel}" aria-label="${x.n}단계 ${esc(x.title)}">${
        x.n === cur ? `<span class="perch">${cat(liveMood("happy"), 34, { paws: true, noTail: true })}</span>` : ""}
        <span class="dot">${c === "done" ? I.check : x.n}</span><span class="nm">${esc(x.short)}</span></button></li>`; }).join("");
    const crit = s.criteria.map((c, i) => ckItem(sel < cur || (sel === cur && st.j.criteria[i].met), esc(c.text) + termTag(c.term))).join("");
    const where = sel < cur ? `<span class="okchip">${I.check}마친 단계</span>` : sel === cur ? `<span class="nowchip">지금 여기 · ${progress()}</span>` : `<span class="meta">아직 안 온 단계</span>`;
    return `<div class="map"><ol class="track" aria-label="여덟 단계">${track}</ol>
      <div class="map-detail"><div class="md-head"><h3>${s.n}단계 · ${esc(s.title)}</h3>${where}</div>
        <p class="mc-sub">${esc(s.does)}</p>
        <span class="flowline"><span>받은 것 · ${esc(s.gets)}</span>${I.arrow}<span>만든 것 · ${esc(s.gives)}</span>${s.doc ? `<span class="meta">설계도: ${esc(s.doc)}</span>` : ""}</span>
        <ul class="crit">${crit}</ul></div></div>`;
  }
  // 내 배움 — 지나온 단계 · 배운 말 · 확정한 설계도 · 몽돌과 나
  function deskLearn() {
    const b = C.bond(st.pets);
    return `<div class="learn">${learnBody()}<div class="card bondcard"><span class="kicker">몽돌과 나</span>
      <div class="bond-row">${petCat("love", 64)}<div class="stack"><b>${esc(b.name)}</b>${hearts(b.level)}
        <span class="sub">쓰다듬은 횟수 ${st.pets}번${b.need ? ` · 더 친해지기까지 ${b.need}번` : ""}</span>
        <span class="sub">${esc(st.since)}부터 함께해요 · 마친 단계 ${st.history.length}개</span></div></div></div></div>`;
  }
  // 위쪽 아이콘 줄 — 지금·설계도·단계 지도·내 배움 | 연결·프로젝트·보기 방식·친해진 정도·설정·열어 두기·접기
  function topbar() {
    const b = C.bond(st.pets), tab = TABS.find((x) => x[0] === st.tab);
    return `<div class="tb"><div class="tabs" role="tablist" aria-label="보기">${TABS.map(([id, label, , ic], i) =>
      `<button class="ti" role="tab" data-act="tab" data-i="${i}" aria-selected="${st.tab === id}" aria-label="${label}" title="${label}">${I[ic]}</button>`).join("")}</div>
      <span class="tb-tab">${esc(tab[1])}</span><span class="grow"></span>
      ${st.feed.at ? `<span class="led on" title="${toolName(st.feed.tool)}와 연결됨 · 마지막 알림 ${ago(st.feed.at)}"></span>` : ""}
      <span class="tb-proj" title="지금 보고 있는 프로젝트">${esc(project())}</span>
      ${st.mode === "live" ? `<span class="mode live" title="보여 주신 글을 진짜 AI(Claude)가 읽어요">진짜 AI</span>` : `<span class="mode fix" title="미리 만들어 둔 응답으로 움직여요 — 진짜 AI가 아니에요">연습용 예시</span>`}
      <button class="ti bond" data-act="bond" aria-label="몽돌과 친해진 정도: ${esc(b.name)}" title="몽돌과 친해진 정도: ${esc(b.name)}">${hearts(b.level)}</button>
      <button class="ti" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 — 보기 방식, 연결, 소리, 기록">${I.gear}</button>
      <button class="ti" data-act="pin" aria-pressed="${st.userPin}" aria-label="열어 두기" title="열어 두기 — 저절로 접히지 않아요">${I.pin}</button>
      <button class="ti" data-act="fold" aria-label="접기" title="접기 (Esc)">${I.up}</button></div>`;
  }
  const settingsPop = () => (st.settings ? `<div class="pop" role="dialog" aria-label="설정">${settingsBody()}</div>` : "");
  const countdownOn = () => st.ui === "home" && !hovering && !pinned() && !!timer;
  const countdown = () => (countdownOn() ? `<div class="cd" title="곧 접혀요 — 핀을 누르면 열어 둬요"><i style="animation-duration:${DELAY.home}ms;animation-delay:-${Date.now() - idleAt}ms"></i></div>` : "");
  // 한 줄 — 몽돌이 앞지느러미를 걸치고 있다. 알릴 일이 있으면 파란 테두리로 살짝 흔든다
  function pillHTML() {
    const s = st.j && stage();
    let main;
    if (st.ping) main = `<b>${esc(pingHead())}</b><span class="pl-cta">볼까요?</span>`;
    else if (st.busy) main = `<b>살펴보는 중이에요</b>${dots}`;
    else if (st.warn) main = `<b>보내기 전에 잠깐!</b><span class="pl-cta">눌러서 보기</span>`;
    else if (st.finished) main = `<b>모든 단계를 마쳤어요</b>`;
    else if (!s) main = `<b>몽돌</b><span class="pl-now">눌러서 지금 만드는 걸 보여 주세요</span>`;
    else main = `<b>${allDone() ? "다 했어요! · " : ""}${s.n}단계</b>${mini()}<span class="pl-now">${st.screen === "gate" ? "넘어가기 전 확인 중" : `지금: ${esc(tick().now)}`}</span>`;
    const base = st.ping ? "look" : face()[0];
    return `<button class="pill${st.ping || st.warn ? " ping" : ""}" data-act="pill" aria-expanded="false" aria-label="몽돌 펼치기">
      <span class="pet" data-pet data-live data-base="${base}">${cat(liveMood(base), 36, { paws: true })}</span>${main}${st.feed.at ? `<span class="led on"></span>` : ""}</button>`;
  }
  // 띠 — 귀만 빼꼼. 마우스를 올리면 한 줄로 나온다
  const stripHTML = () => `<button class="strip" data-act="strip" aria-label="몽돌 부르기" title="마우스를 올리면 나와요"><span class="ears" aria-hidden="true"></span><span class="zz" aria-hidden="true">z<b>z</b></span><i></i></button>`;
  function greetHTML(enter) {
    deskKeys = { Enter: { act: "open" } };
    return `<div class="isl greet${enter}"><section class="mc tone-blue"><div class="mc-cat">${petCat("happy", 116)}</div>
      <div class="mc-main"><p class="mc-say">${esc(C.greeting(new Date().getHours()))}</p>
        <h2 class="mc-title">${st.back ? "다시 오셨네요!" : "안녕하세요! 저는 길잡이 물범 몽돌이에요."}</h2>
        <p class="mc-sub">${st.back ? esc(st.back) : "지금 만들고 있는 걸 보여 주시면, 몇 단계쯤인지와 다음에 할 일을 알려 드려요. 평소엔 화면 위에 작게 있을게요."}</p>
        <div class="acts"><button class="b pri" data-act="open">${st.back ? "이어서 하기" : "보여 주기"}<kbd aria-hidden="true">Enter</kbd></button>
          <span class="hint">${I.bubble}${st.pets ? `우리는 ${esc(C.bond(st.pets).name)}예요` : "몽돌을 눌러 쓰다듬어 보세요"}</span></div></div></section></div>`;
  }
  function islandHTML(enter) {
    let body;
    if (st.tab === "doc") body = deskDoc();
    else if (st.tab === "map") body = deskMap();
    else if (st.tab === "learn") body = deskLearn();
    else body = card(momentToday()) + deskMore();
    return `<div class="isl${enter}">${topbar()}${settingsPop()}${body}${countdown()}</div>`;
  }
  function renderDesk() {
    const moved = st.ui !== lastUi; lastUi = st.ui;
    const enter = moved ? " enter" : "";
    deskKeys = {};
    if (st.ui === "hidden") $nav.innerHTML = stripHTML();
    else if (st.ui === "greet") $nav.innerHTML = greetHTML(enter);
    else if (st.ui === "petit") $nav.innerHTML = `<div class="${enter.trim()}">${pillHTML()}</div>`;
    else $nav.innerHTML = islandHTML(enter);
  }

  // ── iPhone 화면 ──
  const today = () => new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  function ring() {
    const r = 25, len = 2 * Math.PI * r, part = len * metCount() / met().length;
    return `<svg class="ring" width="60" height="60" viewBox="0 0 60 60" role="img" aria-label="이 단계 ${progress()}">
      <circle cx="30" cy="30" r="${r}" fill="none" stroke="var(--seg)" stroke-width="7"></circle>
      <circle cx="30" cy="30" r="${r}" fill="none" stroke="var(--acc)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${part.toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 30 30)"></circle>
      <text x="30" y="35" text-anchor="middle">${metCount()}/${met().length}</text></svg>`;
  }
  // 집중 모드(iPhone) — [날짜·제목 + 톱니] · 몽돌 한마디 · 진행 카드 · 지금 결정할 것 하나. 나머지는 접힌 카드 하나에
  const phoneHead = (kicker, title) => `<div class="ph-top"><div class="ph-date">${esc(kicker)}</div>${gearBtn()}</div><h1 class="ph-title">${esc(title)}</h1>${settingsCard()}`;
  function phoneToday() {
    let h = phoneHead(today(), "오늘의 길잡이") + sayRow(72);
    if (!st.j) return h + box("시작하기", "지금 만들고 있는 걸 보여 주세요", "무엇을 만들고 있고, 어디까지 했는지 편하게 적어 주세요. 연습용 예시 버튼을 눌러 봐도 돼요.", inputBox());
    const s = stage();
    return h + `<div class="card"><div class="proj">${ring()}<div><div class="meta">${esc(project())}</div><div class="big" style="font-size:18px">${s.n}단계 · ${esc(s.title)}</div></div></div>
      ${seg()}<span class="meta">전체 8단계 중 ${s.n + 1}번째 단계예요</span></div>${notes()}${focusCard()}<div class="card">${more()}</div>`;
  }
  const phoneDoc = () => phoneHead("1~4단계에서 만들어요", "설계도") + docBody(72);
  const phoneMap = () => phoneHead("전체 8단계", "단계 지도") + mapBody();
  const phoneLearn = () => phoneHead("지나온 길과 배운 말", "내 배움") + learnBody();
  function phoneCheck() {
    const s = stage(), [body, actions] = checkStep();
    return `<button class="back" data-act="close-gate">${I.back}오늘</button>
      <div class="ph-head">${cat(face()[0], 64)}<div><div class="t">${s.n}단계를 다 했어요!</div><div class="meta">넘어가기 전에 함께 확인해요${st.mode === "fixture" ? " · 연습용 예시" : ""}</div></div></div>
      ${chips()}<div class="card"><span class="label">이번 단계에서 이렇게 했어요</span>${flow()}${critList(false)}</div>
      ${body ? `<div class="card">${body}</div>` : ""}<div class="bottom glass">${actions}</div>`;
  }
  function renderPhone() {
    const gate = st.screen === "gate";
    $phone.className = "phone" + (gate ? " check" : "");
    $phone.innerHTML = gate ? phoneCheck() : ({ today: phoneToday, doc: phoneDoc, map: phoneMap, learn: phoneLearn }[st.tab])() +
      `<nav class="tabbar glass" aria-label="화면">${TABS.map(([id, , label, ic], i) => `<button class="tab" data-act="tab" data-i="${i}" ${st.tab === id ? 'aria-current="page"' : ""}>${I[ic]}${label}</button>`).join("")}</nav>`;
  }

  // ── 리퀴드 글래스 굴절 (PC, 크롬 계열만) ──
  // 유리 가장자리에서 뒤 화면이 휘어 보이게 한다: 유리 크기에 맞춘 '밀어낼 방향 지도'(R=가로, G=세로, 128이 제자리)를 그려
  // SVG 필터(feDisplacementMap)에 넣고 app.css가 backdrop-filter로 건다. 다른 브라우저는 이 필터를 무시하거나 유리째 지워서 크롬 계열만 켠다.
  // 투명도 줄이기를 켠 사람에게는 켜지 않는다(app.css가 불투명한 판으로 바꾼다).
  const REFRACT = !!navigator.userAgentData?.brands?.some((b) => b.brand === "Chromium") && !matchMedia("(prefers-reduced-transparency: reduce)").matches;
  const BEZEL = 14, SCALE = 50;   // ponytail: 휘는 가장자리 폭(px)·가장 세게 미는 거리(SCALE/2 px) 하나로 고정 — 유리마다 다르게 하려면 refract의 표에 칸을 늘린다
  // 볼록한 가장자리(애플식 곡선 h=3·(1-(1-t)⁴)^¼ — 높이는 테두리 폭의 3배, t=가장자리에서 안쪽으로 0→1)를 지나는 빛이 유리(굴절률 1.5)에서 꺾이는 정도.
  // 바깥 끝에서 가장 세고 안쪽 끝에서 0 — 바깥 끝 값으로 나눠 0~1로 쓴다
  const bend = (t) => { const a = Math.atan(3 * (1 - t) ** 3 / (1 - (1 - t) ** 4) ** 0.75); return Math.tan(a - Math.asin(Math.sin(a) / 1.5)); };
  const BEND0 = bend(0);
  function lensMap(w, h, r) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), img = g.createImageData(w, h), d = img.data, hx = w / 2 - r, hy = h / 2 - r;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      // 둥근 사각형의 가장자리까지 안쪽으로 잰 거리(depth)와 가장자리에서 바깥을 향하는 방향(nx, ny)
      const dx = x + 0.5 - w / 2, dy = y + 0.5 - h / 2, px = Math.abs(dx) - hx, py = Math.abs(dy) - hy;
      let depth, nx = 0, ny = 0;
      if (px > 0 && py > 0) { const l = Math.hypot(px, py) || 1; depth = r - l; nx = px / l * Math.sign(dx); ny = py / l * Math.sign(dy); }
      else if (px > py) { depth = r - px; nx = Math.sign(dx); } else { depth = r - py; ny = Math.sign(dy); }
      const k = depth < BEZEL ? bend(Math.max(depth, 0) / BEZEL) / BEND0 : 0, i = (y * w + x) * 4;
      // 안쪽 화면을 끌어온다(- 방향) — 바깥은 유리 밖이라 필터가 볼 수 없어 바깥으로 끌면 거의 안 보였다(2026-10-16 화면 비교)
      d[i] = 128 - nx * k * 127; d[i + 1] = 128 - ny * k * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  const lensKey = {};
  if (REFRACT) {
    document.body.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${["isl", "pill"].map((k) =>
      `<filter id="lg-${k}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage result="map" preserveAspectRatio="none"></feImage>
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${SCALE}" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>`).join("")}</svg>`);
    document.documentElement.classList.add("lg-on");
  }
  // 다시 그린 뒤 유리 크기가 바뀌었으면 지도를 새로 그린다 [이름, 고르는 말, 모서리 반지름]
  function refract() {
    if (!REFRACT || isPhone()) return;
    for (const [k, sel, r] of [["isl", ".isl", 28], ["pill", ".pill", 25]]) {
      const el = $nav.querySelector(sel), w = el ? el.offsetWidth : 0, h = el ? el.offsetHeight : 0;
      if (!w || lensKey[k] === `${w}x${h}`) continue;
      lensKey[k] = `${w}x${h}`;
      const fe = document.querySelector(`#lg-${k} feImage`);
      fe.setAttribute("width", w); fe.setAttribute("height", h); fe.setAttribute("href", lensMap(w, h, Math.min(r, h / 2)));
    }
  }
  addEventListener("resize", refract);

  // 다시 그려도 쓰던 글 칸은 그대로 — 커서 자리와 스크롤까지 되돌린다
  function render() {
    save();
    if (!timer) scheduleIdle();
    const a = document.activeElement, keep = isField(a) && a.dataset.act ? a.dataset.act : "";
    const sel = keep ? [a.selectionStart, a.selectionEnd, a.scrollTop] : null;
    if (isPhone()) renderPhone(); else renderDesk();
    if (keep) {
      const b = document.querySelector(`[data-act="${keep}"]`);
      if (b && b !== a) { b.focus(); try { b.setSelectionRange(sel[0], sel[1]); } catch {} b.scrollTop = sel[2]; }
    }
    if (point) C.follow(isPhone() ? $phone : $nav, point);
    refract();
  }
  PHONE.addEventListener("change", render);

  // ── 몽돌과 교감 ──
  // 기분 바꾸기 — 다시 그리지 않고 그림의 class만 바꾼다(쓰다듬는 중에 그림이 사라지지 않게)
  function applyMood() {
    document.body.classList.toggle("dozing", sleepState === "sleep");   // 띠만 보일 때도 귀 옆에 z가 뜬다
    for (const b of document.querySelectorAll("[data-live]")) {
      const svg = b.querySelector("svg.cat");
      if (svg) svg.setAttribute("class", svg.getAttribute("class").replace(/\bm-[a-z]+/, `m-${liveMood(b.dataset.base)}`));
    }
  }
  function flash(mood, ms) { flashMood = { mood, until: Date.now() + ms }; applyMood(); setTimeout(applyMood, ms + 30); }
  const liveCat = () => (isPhone() ? $phone : $nav).querySelector("[data-live]");
  // 몽돌의 한마디 — 잠깐 떴다 사라지는 말풍선. 화면 위쪽에 있으면 아래로 띄운다
  let sayTimer = 0;
  function say(text) {
    const host = liveCat();
    if (!host || !$fx) return;
    const r = host.getBoundingClientRect();
    let b = $fx.querySelector(".pop-say");
    if (!b) { b = document.createElement("div"); b.className = "pop-say"; b.setAttribute("role", "status"); $fx.appendChild(b); }
    // 왼쪽에 빈자리가 있으면 몽돌 왼쪽(카드 글을 가리지 않게), 없으면 위, 화면 맨 위면 아래
    const side = r.left > 250, below = !side && r.top < 90;
    b.textContent = text;
    b.classList.toggle("side", side);
    b.classList.toggle("below", below);
    b.style.left = `${Math.round(side ? r.left - 6 : r.left + r.width * 0.66)}px`;
    b.style.top = `${Math.round(side ? r.top + r.height * 0.2 : below ? r.bottom + 6 : r.top + 6)}px`;
    b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => b.classList.remove("show"), 2900);
  }
  const playOn = (host, cls) => { if (STILL || !host) return; host.classList.remove("squish", "purring", "hop"); void host.offsetWidth; host.classList.add(cls); };
  const center = (el, fy = 0.5) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * fy]; };
  // 쓰다듬기 — 눌렀으면 하트 몇 개와 한마디, 문질렀으면 흥얼흥얼. 친해진 정도가 올라가면 별이 튄다
  function pet(kind) {
    activity();
    const before = C.bond(st.pets).level;
    st.pets += 1;
    const b = C.bond(st.pets), host = liveCat();
    save();
    flash(kind === "stroke" ? "purr" : "love", 1700);
    playOn(host, kind === "stroke" ? "purring" : "squish");
    if (host && !STILL) C.burst(...center(host, 0.3), "heart", kind === "stroke" ? 7 : 4);
    if (b.level > before) {
      say(`몽돌과 더 친해졌어요! 이제 '${b.name}'`);
      if (host && !STILL) C.burst(...center(host), "star", 14, 360);
      if (st.sound) C.chime("level");
      setTimeout(render, 1800);   // 위쪽 줄의 하트를 새로
    } else {
      say(kind === "stroke" ? "흥얼흥얼… 기분 좋아요" : C.petLine(st.pets));
      if (st.sound) C.chime("pet");
      if (st.tab === "learn") setTimeout(render, 1800);
    }
  }
  // 축하 — 할 일을 다 했을 때, 단계를 넘어갔을 때, 설계도를 확정했을 때
  const CHEER = { done: "와, 할 일을 다 했어요!", doc: "설계도 확정! 멋져요", finish: "끝까지 왔어요! 정말 멋져요" };
  function celebrate(kind) {
    requestAnimationFrame(() => {
      const host = liveCat();
      if (st.sound) C.chime(kind === "stage" || kind === "finish" ? "level" : "done");
      flash("happy", 1800);
      say(kind === "stage" ? `${stage().n}단계로 왔어요! 같이 가요` : CHEER[kind]);
      if (STILL || !host) return;
      const big = kind === "stage" || kind === "finish";
      C.burst(...center(host), "star", big ? 16 : 10, big ? 360 : 160);
      if (big) C.burst(...center(host), "bubble", 6, 220);
      playOn(host, "hop");
    });
  }

  // 눈은 마우스를 따라온다. 글 칸에 들어가면 글 칸을 본다. 깜빡임은 들쭉날쭉하게
  let point = null, raf = 0;
  if (!STILL) {
    document.addEventListener("mousemove", (e) => {
      point = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0; activity(); C.follow(isPhone() ? $phone : $nav, point);
      });
    });
    (function blink() {
      setTimeout(() => {
        document.body.classList.add("blink");
        setTimeout(() => document.body.classList.remove("blink"), 140);
        if (Math.random() < 0.2) setTimeout(() => { document.body.classList.add("blink"); setTimeout(() => document.body.classList.remove("blink"), 120); }, 320);
        blink();
      }, 2400 + Math.random() * 3800);
    })();
  }
  $nav.addEventListener("focusin", (e) => {
    if (STILL || e.target.tagName !== "TEXTAREA") return;
    const r = e.target.getBoundingClientRect();
    point = { x: r.left + r.width * 0.35, y: r.top + 20 };
    C.follow($nav, point);
  });
  // 좌우로 문지르면 쓰다듬은 것 (seal.js의 stroke가 센다)
  let strokeState = null;
  $nav.addEventListener("pointermove", (e) => {
    if (!e.target.closest("[data-pet]")) { strokeState = null; return; }
    strokeState = C.stroke(strokeState, e.clientX, e.timeStamp);
    if (strokeState.petted) pet("stroke");
  });
  // 가만히 두면 졸다가 잠든다. 움직이면 깬다
  let lastActive = Date.now();
  function activity() {
    lastActive = Date.now();
    if (sleepState === "awake") return;
    const was = sleepState;
    sleepState = "awake";
    if (was === "sleep") { flash("wow", 900); say("앗, 깜빡 졸았어요!"); } else applyMood();
  }
  setInterval(() => {
    if (isPhone() || st.busy) return;
    const s = C.sleepy(Date.now() - lastActive);
    if (s === sleepState) return;
    sleepState = s;
    applyMood();
    if (s === "sleep") say("쿨… 쿨…");
  }, 3000);

  // ── AI 호출 — 기다리는 동안 몽돌이 "살펴보는 중" ──
  async function callAI(url, body) {
    st.busy = true; render();
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return await r.json();
    } catch { return { ok: false, reason: "AI에 연결하지 못했어요. server.js를 켜거나, 보기 방식을 '연습용 예시'로 바꿔 주세요" }; }
    finally { st.busy = false; }
  }
  const WARN_NAME = { secret: "비밀번호나 비밀 열쇠", rrn: "주민등록번호", email: "이메일 주소", phone: "전화번호", ip: "인터넷 주소(IP)" };
  // 값은 다시 보이지 않고 종류만 말한다
  const sensitive = (text) => (window.ShareRules ? [...new Set(window.ShareRules.scan(text).findings.filter((x) => WARN_NAME[x.type]).map((x) => WARN_NAME[x.type]))] : []);
  // 진짜 AI로 보내기 전에 비밀번호 같은 게 보이면 멈추고 묻는다. "괜찮아요"를 누르면 RETRY[then]으로 다시 한다
  function guard(text, then) {
    const w = sensitive(text);
    if (!w.length) return false;
    st.warn = { w, then }; render();
    return true;
  }
  const RETRY = { judge: () => judge(true), draft: () => draft(true), review: () => review(true) };
  // 새로 배운 말을 모은다. 돌려주는 것: 이번에 처음 배운 말들
  function learn(j) {
    const fresh = [];
    for (const c of j.criteria) if (c.met && c.term && !st.learned.some((x) => x.term === c.term)) { st.learned.push({ term: c.term, text: c.text }); fresh.push(c.term); }
    return fresh;
  }
  let pendingNotice = "";
  function landed(j, tokens) {
    const was = allDone();
    Object.assign(st, { j, tokens: tokens || 0, todos: null, openInput: false, choice: null, later: false, picking: false, back: "", notice: pendingNotice, finished: false });
    pendingNotice = "";
    const fresh = learn(j);
    // 다 했으면 스스로 펼쳐서 알린다(CouCou의 alert), 아니면 접혀 있던 것만 한 줄로 보인다
    if (allDone()) { view("alert"); if (!was) return celebrate("done"); } else peek();
    if (fresh.length) requestAnimationFrame(() => say(`새 말을 배웠어요: ${fresh.join(", ")} — '내 배움'에 모아 둘게요`));
  }
  const stop = (msg) => { st.error = msg; pendingNotice = ""; render(); };   // 보낼 수 없을 때 — 이유를 보여 주고 멈춘다
  // 진짜 AI에게 묻는 네 가지(어디쯤·물어보기·초안·다시 봐 주기)가 같이 쓰는 흐름:
  // [check가 있으면 비밀번호 같은 게 보일 때 먼저 멈춤] → 호출 → 성공이면 done(r), 실패면 지어내지 않고 이유만 보여 준다
  async function askAI(url, body, what, done, check) {
    if (check && guard(...check)) return;
    const r = await callAI(url, body);
    if (r.ok) { st.tokens = r.tokens || 0; done(r); } else { st.error = `${what} — ${r.reason || "이유를 알 수 없어요"}. 지어내지 않고 비워 둘게요.`; pendingNotice = ""; }
    render();
  }
  function judge(skipCheck) {
    Object.assign(st, { error: "", warn: null });
    if (!st.text.trim()) return stop("지금 만드는 걸 적어 주세요.");
    if (st.mode === "fixture") {
      const raw = S.judgeFixture(st.text, atStage()), j = raw && N.parseJudgement(raw, st.text, atStage());
      return j ? landed(j, 0) : stop("연습용 예시는 정해진 장면만 알아요. 위의 연습 버튼으로 이 단계 장면을 보거나, 직접 쓴 글은 보기 방식을 '진짜 AI'로 바꿔 주세요.");
    }
    return askAI("/api/judge", { text: st.text, stage: atStage() }, "살펴보지 못했어요", (r) => landed(r.judgement, r.tokens), !skipCheck && [st.text, "judge"]);
  }
  function answer() {
    const s = stage();
    st.error = "";
    if (st.mode === "fixture") {
      const a = (S.answers[s.n] || [])[st.hard[0]];
      st.answer = a ? `${a} (연습용으로 미리 써 둔 답이라, 질문 내용은 반영되지 않아요)` : "연습용 답이 없어요. 보기 방식을 '진짜 AI'로 바꿔 물어보세요.";
      return render();
    }
    if (!st.question.trim()) return stop("궁금한 걸 적어 주세요.");
    return askAI("/api/answer", { stage: s.n, hard: hardTexts(), question: st.question, text: st.text },
      "답을 받지 못했어요", (r) => { st.answer = r.answer; });
  }
  // 고른 것을 작업 글에 한 줄로 적고 다시 살펴본다 — 정하는 건 사용자, 받아 적는 건 몽돌
  function decide() {
    const n = st.j.next, o = n.options[st.choice];
    st.text = `${st.text.trim()}\n${N.decisionLine(n.question, o)}`;
    // "다시 살펴봤어요"는 살펴보기가 성공했을 때만 보인다(landed에서)
    pendingNotice = `골랐어요: ${o} — 작업 글에 적어 두고 다시 살펴봤어요.`;
    Object.assign(st, { notice: "", choice: null, picking: false });
    judge(false);
  }
  // 설계도 — 초안 받기 / 다시 봐 주세요. 연습용은 미리 써 둔 초안과 빈칸 확인만, 진짜 AI는 server.js를 거친다
  const newDoc = (n, text, say) => ({ stage: n, text, say, review: null, rounds: 0 });
  function draft(skipCheck) {
    const s = stage(), made = (text, say) => { st.doc = newDoc(s.n, text, say); };
    Object.assign(st, { error: "", warn: null, askConfirm: 0 });
    if (st.mode === "fixture") {
      const d = S.drafts[s.n];
      if (!d) return stop("이 단계는 연습용 초안이 없어요. 직접 쓴 작업은 보기 방식을 '진짜 AI'로 바꿔 주세요.");
      made(d.draft, d.say); return render();
    }
    if (!st.text.trim()) return stop("'지금' 탭에서 만들고 있는 걸 먼저 보여 주세요.");
    return askAI("/api/draft", { stage: s.n, text: st.text }, "초안을 받지 못했어요", (r) => made(r.draft, r.say), !skipCheck && [st.text, "draft"]);
  }
  function review(skipCheck) {
    const d = st.doc, reviewed = (v) => { Object.assign(d, { review: v, say: "" }); d.rounds++; };
    Object.assign(st, { error: "", warn: null, askConfirm: 0 });
    if (!d.text.trim()) return stop("설계도가 비어 있어요.");
    if (st.mode === "fixture") { reviewed(S.reviewFixture(d.text, d.stage)); return render(); }
    return askAI("/api/review", { stage: d.stage, text: st.text, doc: d.text }, "다시 봐 드리지 못했어요", (r) => reviewed(r.review),
      !skipCheck && [`${st.text}\n${d.text}`, "review"]);
  }
  // 확정은 사람만 한다(FR-3). 빈칸이 남았으면 한 번 더 묻는다(force: 그래도 확정). 같은 단계의 예전 확정본은 새것으로 바꾼다
  function confirmDoc(force) {
    const d = st.doc, s = N.STAGES[d.stage], left = N.blanks(d.text).length;
    if (left && !force) return set({ askConfirm: left });
    st.docs = st.docs.filter((x) => x.stage !== d.stage).concat({ stage: d.stage, name: s.doc, text: d.text, at: ymd() });
    Object.assign(st, { doc: null, warn: null, error: "", askConfirm: 0, notice: `${s.n}단계 설계도를 확정했어요. '내 배움'에도 모아 뒀어요.` });
    render();
    celebrate("doc");
  }

  function advance() {
    if (!N.canAdvance(met(), "yes")) return;
    const s = stage(), nx = nextStage();
    st.history.push({ short: `${s.n}단계 ${s.title} 마침`,
      text: `${s.n}단계 "${s.title}" → ${nx ? `${nx.n}단계로 넘어갔어요` : "마무리했어요"} · '잘 모르겠어요' ${st.noCount}번 · ${ymd()}` });
    Object.assign(st, { screen: "main", notice: "", tab: "today", showCrit: false, mapSel: null });
    if (nx) st.j = { stage: nx.n, reason: `${s.n}단계를 마쳤어요! 이제 ${nx.n}단계 "${nx.title}"예요. 정한 순서대로 하나씩 해 봐요.`,
      criteria: nx.criteria.map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    else st.finished = true;
    render();
    celebrate(nx ? "stage" : "finish");
  }
  // 글 칸으로 커서를 옮긴다 (다시 그린 뒤)
  const focusText = () => requestAnimationFrame(() => { const t = document.querySelector("[data-act=text]"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } });

  // ── 누르기 — data-act 이름 → 할 일. (i: data-i, el: 누른 것) ──
  const set = (patch) => { Object.assign(st, patch); render(); };
  // 헷갈린 곳 고르기/빼기 (PC 단추·iPhone 체크 상자)
  const toggleHard = (i, on = !st.hard.includes(i)) => set({ hard: on ? [...new Set([...st.hard, i])].sort() : st.hard.filter((x) => x !== i) });
  const ACT = {
    strip: () => view("enter"),
    open: () => view("click"),
    pin: () => { clearIdle(); set({ userPin: !st.userPin }); say(st.userPin ? "여기 열어 둘게요" : "이제 잠시 뒤 작게 접힐게요"); },
    pill: () => view("click"),
    fold: () => go("petit"),
    pet: () => pet("tap"),
    // 연습용은 바로 살펴보고, 진짜 AI 모드에서는 글만 넣어 둔다(보내는 건 사용자가 '어디쯤인지 보기'를 누를 때)
    ex: (i) => {
      st.text = S.examples[i].text; st.notice = "";
      if (st.mode === "fixture") return judge(true);
      render(); focusText(); say("예시 글을 넣었어요. 보내려면 '어디쯤인지 보기'를 눌러요");
    },
    judge: () => { st.notice = ""; judge(false); },
    restart: () => { Object.assign(st, { j: null, finished: false, todos: null }); ACT.ex(S.examples.indexOf(S.first)); },
    "send-anyway": () => RETRY[st.warn.then](),
    "stop-send": () => set({ warn: null }),
    edit: () => { set({ warn: null, openInput: !!st.j }); focusText(); },
    // 선택지를 한 번 누르면 정해진다 — 누른 자리에서 물방울이 튄다
    "pick-opt": (i, el) => {
      if (st.busy || !st.j || !st.j.next) return;
      st.choice = i;
      const from = el || liveCat();
      if (from && !STILL) C.burst(...center(from, 0.2), "bubble", 5);
      flash("happy", 1300);
      decide();
    },
    opt: (i) => set({ choice: i }),
    decide: () => { if (st.choice !== null) decide(); },
    later: () => { set({ later: true, choice: null, picking: false }); say("좋아요, 나중에 같이 정해요"); },
    again: () => set({ later: false, picking: true }),
    pick: () => set({ picking: true }),
    settings: () => set({ settings: !st.settings }),
    bond: () => set({ tab: "learn", settings: false }),
    tab: (i) => set({ tab: TABS[i][0], error: "", warn: null, settings: false, askConfirm: 0 }),
    "map-sel": (i) => set({ mapSel: i }),
    crit: () => set({ showCrit: !st.showCrit }),
    "open-input": () => { set({ openInput: true, showCrit: false }); focusText(); },
    "close-input": () => set({ openInput: false }),
    "retry-input": () => { set({ error: "", openInput: !!st.j }); focusText(); },
    dismiss: () => set({ error: "" }),
    "look-now": () => { st.ping = ""; st.notice = ""; judge(false); },
    "peek-text": () => { set({ ping: "", openInput: !!st.j }); focusText(); },
    "ping-later": () => { st.ping = ""; go("petit"); },
    draft: () => draft(false),
    review: () => review(false),
    "confirm-doc": () => confirmDoc(false),
    "confirm-anyway": () => confirmDoc(true),
    "confirm-cancel": () => set({ askConfirm: 0 }),
    "reopen-doc": () => { const x = docDone(st.j.stage); set({ doc: newDoc(x.stage, x.text, "") }); },
    forget: () => { forgotten = true; try { localStorage.removeItem(KEY); } catch {} location.reload(); },
    gate: () => set({ screen: "gate", step: "ask", hard: [], question: "", answer: "", noCount: 0, error: "", showCrit: false }),
    "close-gate": () => set({ screen: "main" }),
    no: () => { set({ noCount: st.noCount + 1, step: "which", hard: [], answer: "", question: "" }); say("모르는 게 당연해요. 같이 풀어요"); },
    "hard-t": (i) => toggleHard(i),
    "to-question": () => {
      if (!st.hard.length) { flash("think", 1200); return say("헷갈린 곳을 하나 이상 골라 주세요"); }
      set({ step: "question" });
    },
    answer: () => answer(),
    plan: () => set({ step: "plan" }),
    yes: () => { const nx = nextStage(); set({ todos: nx ? nx.criteria.map((c) => c.text) : [], step: "next" }); flash("happy", 1200); },
    up: (i) => set({ todos: N.reorder(st.todos, i, -1) }),
    down: (i) => set({ todos: N.reorder(st.todos, i, 1) }),
    go: () => advance(),
  };
  const run = (a, el) => { if (ACT[a.act]) ACT[a.act](a.i, el); };
  for (const $root of [$nav, $phone]) {
    $root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-act]");
      if (!t || !ACT[t.dataset.act]) return;
      activity();
      run({ act: t.dataset.act, i: t.dataset.i === undefined ? undefined : Number(t.dataset.i) }, t);
    });
    $root.addEventListener("change", (e) => {
      const a = e.target.dataset.act;
      if (a === "mode") set({ mode: e.target.value, error: "", warn: null });
      if (a === "auto") set({ auto: e.target.checked });
      if (a === "sound") { set({ sound: e.target.checked }); if (st.sound) C.chime("pop"); }
      if (a === "hard") toggleHard(Number(e.target.dataset.i), e.target.checked);
    });
    $root.addEventListener("input", (e) => {
      activity();
      if (e.target.dataset.act === "text") {
        const grew = st.text.length < 200 && e.target.value.length >= 200;
        st.text = e.target.value;
        if (grew) say("와, 꼼꼼하게 쓰셨네요!");
      }
      if (e.target.dataset.act === "question") st.question = e.target.value;
      if (e.target.dataset.act === "doc" && st.doc) {
        st.doc.text = e.target.value; save();   // 글자를 칠 때는 다시 그리지 않는다(커서가 튄다) — 빈칸 개수만 바꾼다
        if (st.askConfirm) { st.askConfirm = 0; document.querySelector("[data-ask-confirm]")?.remove(); }   // 고치기 시작하면 다시 묻지 않는다
        const m = document.querySelector("[data-blanks]");
        if (m) m.textContent = blankMeta(st.doc);
      }
    });
  }

  // ── 단축키 (PC) — 카드 버튼에 적힌 키. 글을 쓰는 중에는 Esc와 Ctrl+Enter만. 한글 자판의 ㅛ·ㅜ도 Y·N으로 ──
  const ALIAS = { "ㅛ": "y", "ㅜ": "n" };
  document.addEventListener("keydown", (e) => {
    activity();
    if (isPhone() || e.isComposing) return;
    const t = e.target, writing = isField(t);
    if (e.key === "Escape") {
      if (st.settings) return set({ settings: false });
      if (deskKeys.Escape && st.ui === "home") { e.preventDefault(); return run(deskKeys.Escape); }
      return view("esc");
    }
    if (st.ui !== "home" && st.ui !== "greet") return;
    if (t.tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) return;   // 버튼 위의 Enter는 그 버튼을 누른 것
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      const a = deskKeys["c-Enter"] || deskKeys.Enter;
      if (a) { e.preventDefault(); run(a); }
      return;
    }
    if (writing || e.ctrlKey || e.altKey || e.metaKey) return;
    const k = e.key.length === 1 ? ALIAS[e.key] || e.key.toLowerCase() : e.key;
    const a = deskKeys[k];
    if (a) { e.preventDefault(); run(a); }
  });

  // ── Claude Code·Codex 연결 — 서버에 2초마다 새 알림을 묻는다(서버로 열었을 때만) ──
  let lastSeq = -1;   // -1: 아직 한 번도 안 물음 — 처음에는 지난 알림을 다시 띄우지 않고 기준만 잡는다
  async function poll() {
    let r;
    try { r = await (await fetch(`/api/events?since=${Math.max(lastSeq, 0)}`)).json(); } catch { return; }
    if (!r.ok) return;
    const first = lastSeq < 0, ev = r.events[r.events.length - 1];
    lastSeq = r.latest;
    if (!ev) return;
    st.feed = { at: ev.at, project: ev.project, tool: ev.tool };
    if (ev.project) st.project = ev.project;
    if (first) return render();
    onEvent(ev);
  }
  // 작업을 알아챈다: 글 칸에 최근 작업을 채우고 한 줄로 알린다. 자동으로 살펴보기를 켰으면 작업을 마칠 때 바로 살펴본다
  async function onEvent(ev) {
    if (st.busy) return render();
    if (ev.work) st.text = ev.work;
    activity();
    if (ev.kind === "stop" && st.auto && st.mode === "live") {
      st.ping = "";
      await judge(false);
      if (st.warn) view("alert");
      return;
    }
    const tool = toolName(ev.tool);
    st.ping = ev.kind === "stop" ? `${tool}가 방금 작업을 마쳤어요 — 눌러서 어디쯤인지 볼까요?` : `${tool}에서 새 작업을 시작했어요`;
    peek();
  }
  if (canLive) { poll(); setInterval(poll, 2000); }

  // ── 뒤쪽 예시 화면: AI 도구로 작업하는 장면 ──
  const LINES = [
    ["me", "› 동아리 행사 등록 앱 만들고 싶어. 회원이 행사 보고 신청하는 거"],
    ["", "좋아요. 먼저 필요한 기능부터 정리해 볼까요? 신청 화면, 행사 목록, 마감 알림…"],
    ["me", "› 필요한 기능 6개를 문장으로 정리해 줘"],
    ["", "1. 회원이 신청 버튼을 누르면, 앱은 신청서를 보여 준다."],
    ["", "2. 등록은 빠르게 끝나야 한다."],
    ["dim", "…"],
    ["me", "› 좋아, 바로 화면 만들자"],
  ];
  const line = ([cls, text]) => { const d = document.createElement("div"); d.className = cls; d.textContent = text; $chat.appendChild(d); };
  LINES.forEach(line);
  document.getElementById("play").addEventListener("click", () => {
    $chat.textContent = ""; let k = 0;
    const step = () => {
      if (k < LINES.length) { line(LINES[k++]); return setTimeout(step, 700); }
      // 작업이 바뀐 걸 알아채고 한 줄로 살짝 나타난다 — 글을 AI에게 보내는 건 사용자가 누를 때만
      st.text = stageExamples()[0].text; st.ping = "방금 작업이 바뀌었어요 — 눌러서 어디쯤인지 볼까요?";
      activity();
      peek();
    };
    step();
  });

  render();
})();
