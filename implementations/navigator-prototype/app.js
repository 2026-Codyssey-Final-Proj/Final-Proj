// claude-drafted: 2026-10-14 — Navigator 프로토타입 화면 동작. 목업(Mac·iPhone)을 따른다.
// 규칙·문구 판단은 navigator.js, 연습 예시는 scenario.js, 고양이는 cat.js, 실제 Claude 호출은 server.js.
// 넓은 화면 = Mac: 코딩 도구 창 위에 떠 있는 옆자리 동료(띠 → 한 줄 → 펼침, CouCou 동작을 따름 — 코드·캐릭터·소리는 가져오지 않음)
// 600px 이하 = iPhone: 오늘 / 설계도 / 단계 지도 / 내 배움 탭과 넘어가기 전 확인 화면. 두 화면은 같은 상태(st)를 쓴다.
// 기록(작업 글·진행·배운 말·설계도)은 이 브라우저(localStorage)에만 남는다 — 다시 열면 이어서 보고 "어제 ~까지 하셨어요"라고 인사한다.
(function () {
  const N = window.NavRules, S = window.NavScenario, C = window.NavCat;
  const canLive = location.protocol.startsWith("http");
  const DELAY = { greet: 6000, home: 15000, petit: 30000 };   // 저절로 접히기까지(밀리초)
  const PHONE = matchMedia("(max-width: 600px)");
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const st = {
    ui: "greet", screen: "main", tab: "today", mode: canLive ? "live" : "fixture", text: canLive ? "" : S.examples[0].text,
    j: null, tokens: 0, busy: false, error: "", notice: "", todos: null, userPin: false, ping: "", openInput: false,
    warn: null,                                    // 보내기 전 경고 {w: 보인 것들, then: 괜찮다고 하면 다시 할 일 judge·draft·review}
    choice: null, later: false, picking: false,
    step: "ask", hard: [], question: "", answer: "", noCount: 0, history: [], learned: [],
    auto: false, feed: { at: 0, project: "", tool: "" },   // Claude Code·Codex 연결: 자동으로 살펴보기(기본 꺼짐), 마지막 알림
    settings: false,                               // 설정(보기 방식·연결·자동 살펴보기·기록)은 톱니를 눌러야 보인다
    doc: null, docs: [],                           // 설계도: 고치는 중인 것 {stage, text, say, review, rounds}, 확정한 것들
    project: "", back: "",                         // 알림에서 받은 프로젝트 폴더 이름, 다시 왔을 때 인사
  };
  const $nav = document.getElementById("nav"), $phone = document.getElementById("phone"), $chat = document.getElementById("chat");

  // ── 상태에서 바로 계산하는 것 ──
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const met = () => (st.j ? st.j.criteria.map((c) => c.met) : []);
  const metCount = () => met().filter(Boolean).length;
  const left = () => met().length - metCount();
  const allDone = () => !!st.j && left() === 0;
  const stage = () => st.j && N.STAGES[st.j.stage];
  const nextStage = () => st.j && N.STAGES[st.j.stage + 1];
  const isPhone = () => PHONE.matches;
  // 답을 기다리는 중이면 저절로 접히지 않는다 (CouCou의 pinned). 할 일을 다 했으면 확인하러 가자고 펼쳐 둔다
  const pinned = () => st.userPin || st.screen === "gate" || !!st.warn || st.busy || allDone();
  const face = () => N.face({ busy: st.busy, warn: st.warn, error: st.error, gate: st.screen === "gate", step: st.step,
    back: st.back, reason: st.j && st.j.reason, allDone: allDone() });
  const tick = () => N.ticker(st.j, st.todos, st.history.length ? st.history[st.history.length - 1].short : "");
  // 단계 n이 지금 단계보다 앞(done)인지, 지금(cur)인지 — 단계 막대·칩·단계 지도가 같이 쓴다
  const stepClass = (n) => { const cur = st.j ? st.j.stage : -1; return n < cur ? "done" : n === cur ? "cur" : ""; };
  const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `${s}초 전` : `${Math.round(s / 60)}분 전`; };
  const reasonOf = (r) => r.reason || "이유를 알 수 없어요";
  const cat = C.svg;
  const toolName = (t) => ({ claude: "Claude Code", codex: "Codex" })[t] || "AI 코딩 도구";
  const ymd = () => new Date().toLocaleDateString("sv");   // 이 컴퓨터 시간으로 YYYY-MM-DD
  const project = () => st.project || (st.mode === "fixture" ? S.PROJECT : "내 프로젝트");

  // ── 기록 — 이 브라우저에만. 못 쓰는 환경(사생활 보호 창 등)이면 조용히 기록 없이 동작한다 ──
  const KEY = "navigator-prototype:v1";
  const KEEP = ["mode", "text", "j", "todos", "history", "learned", "auto", "doc", "docs", "project"];
  let forgotten = false;
  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return; }
    if (!s || typeof s !== "object") return;
    if (s.j && !(N.STAGES[s.j.stage] && Array.isArray(s.j.criteria))) delete s.j;   // 고장 난 기록은 버린다
    for (const k of KEEP) if (k in s) st[k] = s[k];
    if (st.mode === "live" && !canLive) st.mode = "fixture";
    st.back = N.welcome(s, Date.now());
  }
  function save() {
    if (forgotten) return;
    const o = { at: Date.now() };
    for (const k of KEEP) o[k] = st[k];
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {}
  }
  load();

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
  };

  // ── 접힘·펼침 (Mac 화면만) ──
  let hovering = false, timer = null, idleAt = 0, lastUi = null;
  function clearIdle() { clearTimeout(timer); timer = null; }
  function scheduleIdle() {
    clearIdle();
    if (isPhone() || st.ui === "hidden" || (st.ui !== "greet" && (hovering || pinned()))) return;
    idleAt = Date.now();
    timer = setTimeout(() => { timer = null; go(N.nextView(st.ui, "idle", pinned())); }, DELAY[st.ui]);
  }
  function go(ui) { if (ui !== st.ui) { st.ui = ui; clearIdle(); } render(); }
  // 알릴 일이 생기면 접혀 있던 것(띠·인사)만 한 줄로 살짝 보인다 — 펼쳐져 있으면 그대로
  const peek = () => go(st.ui === "hidden" || st.ui === "greet" ? "petit" : st.ui);
  $nav.addEventListener("mouseenter", () => { hovering = true; if (st.ui !== "greet") clearIdle(); go(N.nextView(st.ui, "enter", pinned())); });
  $nav.addEventListener("mouseleave", () => { hovering = false; render(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !isPhone()) go(N.nextView(st.ui, "esc", pinned())); });

  // ── 두 화면이 함께 쓰는 조각 ──
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
  // 내가 정한 순서 — move면 위·아래 버튼까지
  const todoList = (move) => `<ol class="todo">${st.todos.map((t, i) => `<li><span class="i">${i + 1}</span><span>${esc(t)}</span>${move ? `
    <button class="round" data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? "disabled" : ""}>${I.up}</button>
    <button class="round" data-act="down" data-i="${i}" aria-label="아래로" ${i === st.todos.length - 1 ? "disabled" : ""}>${I.down}</button>` : ""}</li>`).join("")}</ol>`;
  // 골라 주세요 — 고르는 건 사용자다. 고르면 작업 글에 한 줄로 적고 다시 살펴본다
  function chooseCard() {
    const n = st.j.next;
    if (st.later) return `<div class="row"><span class="meta grow">나중에 정하기로 했어요 — ${esc(n.question)}</span><button class="btn" data-act="again">다시 고르기</button></div>`;
    return `<div class="choose"><span class="label">골라 주세요</span><span class="q">${esc(n.question)}</span><span class="why">${esc(n.why)}</span>
      ${n.options.map((o, i) => `<button class="opt" data-act="opt" data-i="${i}" aria-pressed="${st.choice === i}"><span class="radio"></span>${esc(o)}</button>`).join("")}
      <div class="row"><button class="btn pri grow" data-act="decide" ${st.choice === null || st.busy ? "disabled" : ""}>이걸로 정할게요</button><button class="btn" data-act="later">나중에</button></div>
      <span class="meta">${esc(n.action)}</span></div>`;
  }
  const critList = (terms) => `<ul class="crit">${st.j.criteria.map((c) => `<li><span class="ck ${c.met ? "y" : "n"}">${c.met ? "✓" : "○"}</span><span>${esc(c.text)}${
    terms && c.term ? `<span class="tag" title="전문가들이 부르는 이름이에요">용어: ${esc(c.term)}</span>` : ""}${
    c.evidence ? `<span class="sub">적어 주신 글: "${esc(c.evidence)}"</span>` : ""}</span></li>`).join("")}</ul>`;
  const notes = () => (st.notice ? `<div class="note n-ok">${esc(st.notice)}</div>` : "");
  function inputBox() {
    let h = `<textarea data-act="text" aria-label="지금 만드는 것" placeholder="예) 동아리 행사 등록 앱을 만들고 있어요. 필요한 기능을 문장으로 써 봤어요.">${esc(st.text)}</textarea>
      <div class="row">${S.examples.filter((e) => !e.hidden).map((e) => `<button class="btn" data-act="ex" data-i="${S.examples.indexOf(e)}">${esc(e.label)}</button>`).join("")}
      <span class="grow"></span><button class="btn pri" data-act="judge" ${st.busy ? "disabled" : ""}>어디쯤인지 보기</button></div>`;
    if (st.mode === "live") h += `<p class="meta" style="margin:0">보여 주신 글은 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처는 빼 주세요.</p>`;
    if (st.warn && st.warn.then === "judge") h += warnNote("edit", "고칠게요");
    return `<div class="stack">${h}${errorNote()}</div>`;
  }
  const inputDetails = () => `<details ${st.error || st.warn || st.openInput ? "open" : ""}><summary>바뀐 작업 다시 보여 주기</summary>${inputBox()}</details>`;
  const modeBadge = () => (st.mode === "live"
    ? `<span class="badge live">진짜 AI(Claude)가 봤어요${st.tokens ? ` · 읽고 쓴 양 약 ${st.tokens.toLocaleString()}토큰` : ""}</span>`
    : `<span class="badge fix">연습용 예시예요 — 진짜 AI가 아니에요</span>`);
  // 설정 — 보기 방식, Claude Code·Codex 연결 상태, 자동으로 살펴보기, 기록. PC·iPhone 모두 톱니 뒤에
  function settingsBody() {
    const link = canLive ? `<div class="link"><div class="row"><span class="led ${st.feed.at ? "on" : ""}"></span><span class="grow">${st.feed.at
        ? `${toolName(st.feed.tool)}와 연결됨 · ${esc(st.feed.project || "프로젝트")} · 마지막 알림 ${ago(st.feed.at)}`
        : "Claude Code·Codex 알림을 기다리는 중 — connect.js로 연결해 주세요"}</span></div>
      <label class="chk"><input type="checkbox" data-act="auto" ${st.auto ? "checked" : ""}>AI 코딩 도구가 작업을 마치면 자동으로 살펴보기</label>
      <span>켜면 그때마다 최근 작업 대화가 AI(Claude)로 보내져요. 비밀번호처럼 보이는 게 있으면 보내기 전에 멈춰요.</span></div>` : "";
    const keep = `<div class="row"><span class="grow">기록은 이 컴퓨터의 브라우저에만 남아요.</span><button class="btn" data-act="forget">기록 지우기</button></div>`;
    return `${link}<div class="row">${modeBadge()}<span class="grow">안내 기준은 아직 시험판이에요</span></div>
      <div class="row">보기 방식 <select data-act="mode" aria-label="보기 방식">
        <option value="fixture" ${st.mode === "fixture" ? "selected" : ""}>연습용 예시</option>
        <option value="live" ${st.mode === "live" ? "selected" : ""} ${canLive ? "" : "disabled"}>진짜 AI (Claude)${canLive ? "" : " — server.js를 켜야 해요"}</option></select></div>${keep}`;
  }
  const settingsCard = () => (st.settings ? `<div class="foot settings">${settingsBody()}</div>` : "");
  const gearBtn = () => `<button class="round" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 — 보기 방식, 연결, 기록">${I.gear}</button>`;

  // 단계 지도 · 내 배움 — PC 패널의 탭과 iPhone 탭이 같이 쓴다
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
  // 설계도(FR-3) — 초안은 AI가 먼저, 고치는 건 사용자, 다시 봐 주는 건 AI, 확정은 사용자만. PC 패널과 iPhone 탭이 같이 쓴다
  function docBody(size) {
    const s = st.j && stage();
    if (!s) return sayRow(size, ["idle", "먼저 '지금'에서 어디쯤인지 봐요. 설계도는 그 단계에 맞춰 만들어요."]);
    const done = st.docs.find((x) => x.stage === s.n), d = st.doc && st.doc.stage === s.n ? st.doc : null, label = `설계도 · ${s.n}단계`;
    const say = sayRow(size, N.docFace({ busy: st.busy, warn: st.warn, error: st.error, review: d && d.review, draftSay: d && d.say, done }));
    const notesH = (st.warn && st.warn.then !== "judge" ? warnNote("stop-send", "그만둘게요") : "") + errorNote();
    if (!s.doc) return say + box(label, `${s.n}단계는 설계도 없이 진행해요`, "설계도는 1~4단계에서 만들어요. 확정한 설계도는 '내 배움'에 모여 있어요.");
    if (!d && done) return say + box(label, esc(s.doc), `${esc(done.at)}에 직접 확정했어요.`,
      `<details><summary>확정한 설계도 보기</summary><pre class="doc-view">${esc(done.text)}</pre></details><button class="btn wide" data-act="reopen-doc">고쳐 쓰기</button>`);
    if (!d) return say + box(label, esc(s.doc), "지금까지 작업을 보고 AI가 초안을 먼저 써 드려요. 고치고 완성하는 건 직접 해요. 확정도 직접 눌러야만 돼요.",
      `${notesH}<button class="btn pri wide" data-act="draft" ${st.busy ? "disabled" : ""}>초안 받기</button>
      ${st.mode === "live" ? `<span class="meta">작업 글이 AI(Claude)에게 보내져요.</span>` : ""}`);
    const r = d.review, ready = r && r.ready;
    const reviewH = r ? `<div class="card review"><span class="kicker">다시 봐 드렸어요${st.mode === "fixture" ? " · 연습용이라 빈칸이 남았는지만 봐요" : ""}</span><ul class="crit">
      ${r.good.map((g) => `<li><span class="ck y">✓</span><span>${esc(g)}</span></li>`).join("")}
      ${r.fix.map((f) => `<li><span class="ck n">○</span><span><b>"${esc(f.where)}"</b> — ${esc(f.why)}<span class="sub">고치는 방향: ${esc(f.hint)}</span></span></li>`).join("")}</ul></div>` : "";
    const confirm = `<button class="btn ${ready ? "pri" : ""}" data-act="confirm-doc">${ready ? "이걸로 확정할게요" : "이대로 확정"}</button>`;
    const again = `<button class="btn ${ready ? "" : "pri"} grow" data-act="review" ${st.busy ? "disabled" : ""}>다시 봐 주세요</button>`;
    return `${say}<div class="stack"><div class="stage-head"><span class="stage-title">${esc(s.doc)}</span>
      <span class="meta" data-blanks>${blankMeta(d)}</span></div>
      <textarea class="doc" data-act="doc" aria-label="설계도">${esc(d.text)}</textarea>
      ${reviewH}${notesH}<div class="row">${again}${confirm}</div>
      <span class="meta">고친 뒤 '다시 봐 주세요'를 누르면 고칠 곳을 알려 드려요. 대신 고쳐 쓰지는 않아요.</span></div>`;
  }
  const blankMeta = (d) => { const n = N.blanks(d.text).length; return `${n ? `빈칸 ${n}개` : "빈칸 없음"} · 봐 드린 횟수 ${d.rounds}번`; };

  const tabsBar = () => `<div class="segctl" role="tablist" aria-label="보기">${TABS.map(([id, label], i) =>
    `<button role="tab" data-act="tab" data-i="${i}" aria-selected="${st.tab === id}">${label}</button>`).join("")}</div>`;

  // 넘어가기 전 확인 — 단계마다 [내용, 버튼]. Mac은 이어서 보이고, iPhone은 버튼을 아래에 붙인다
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
      <div><b>받은 것</b> ${esc(s.gets)}</div><div><b>한 일</b> ${esc(s.does)}</div><div><b>만든 것</b> ${esc(s.gives)}</div>
      <div><b>헷갈렸던 부분</b> ${esc(st.hard.map((i) => s.criteria[i].text).join(", "))}</div>
      <div><b>받은 답</b> ${esc(st.answer)}</div>${nx ? `<div><b>다음 단계</b> ${nx.n}단계 ${esc(nx.title)} — ${esc(nx.does)}</div>` : ""}</div>`, yesNo];
    if (st.step === "next") return [`<span class="ask">좋아요! 다음은 ${nx ? `${nx.n}단계 "${esc(nx.title)}"` : "마무리"}예요</span>
      <span class="meta">무엇부터 할지 순서를 정해 보세요.</span>${todoList(true)}`,
      `<button class="btn pri wide" data-act="go" ${N.canAdvance(met(), "yes") ? "" : "disabled"}>이 순서로 시작하기</button>`];
    return ["", yesNo];
  }
  const chips = () => `<div class="chips">${N.STAGES.map((x) => `<span class="chip ${stepClass(x.n)}">${stepClass(x.n) === "done" ? "✓ " : ""}${x.n} ${esc(x.short)}</span>`).join("")}</div>`;
  const flow = () => { const s = stage(); return `<div class="flow"><div class="box"><b>받은 것</b>${esc(s.gets)}</div><span class="arrow">→</span>
    <div class="box"><b>한 일</b>${esc(s.does)}</div><span class="arrow">→</span><div class="box"><b>만든 것</b>${esc(s.gives)}${
    st.docs.some((x) => x.stage === s.n) ? `<span class="sub ok">✓ 설계도 확정함</span>` : ""}</div></div>`; };

  // ── Mac 화면 ──
  function pill() {
    let stageTxt, count = "", now = "";
    if (st.busy) stageTxt = "살펴보는 중이에요…";
    else if (st.ping) stageTxt = st.ping;
    else if (!st.j) { stageTxt = "Navigator"; now = "눌러서 지금 만드는 걸 보여 주세요"; }
    else { stageTxt = `${allDone() ? "다 했어요! · " : ""}${stage().n}단계`; count = `${metCount()}/${met().length}`; now = `지금: ${tick().now}`; }
    const open = st.ui === "home";
    return `<div class="pill glass">
      <button class="pill-main" data-act="pill" aria-expanded="${open}">${cat(st.ping ? "happy" : face()[0], 34)}
        <span class="pill-stage">${esc(stageTxt)}</span>${count ? `<span class="pill-count">${esc(count)}</span>` : ""}<span class="pill-now">${esc(now)}</span>
        ${st.feed.at ? `<span class="led on" title="${toolName(st.feed.tool)}와 연결됨"></span>` : ""}</button>
      ${open ? `<button class="round" data-act="pin" aria-pressed="${st.userPin}" aria-label="열어 두기" title="열어 두기 — 저절로 접히지 않아요">${I.pin}</button>` : ""}
      <button class="round" data-act="pill" aria-label="${open ? "접기" : "펼치기"}">${open ? I.up : I.down}</button></div>`;
  }
  // 집중 모드 — 처음 보이는 건 [나비 한마디 · 진행 한 줄 · 지금 결정할 것 하나]. 나머지는 눌러야 펼쳐진다
  const progressLine = () => `<div><div class="stage-head"><span class="stage-title">${stage().n}단계 · ${esc(stage().title)}</span>
    <span class="meta">할 일 ${met().length}개 중 ${metCount()}개</span></div>${seg()}</div>`;
  // 지금 결정할 것 하나 — 다 했으면 "넘어가기", 순서를 정했으면 그 첫 일, 아니면 골라 주세요. 파란 버튼은 이 카드에만.
  // PC·iPhone이 같이 쓴다. iPhone은 좁아서 "같이 정하기"를 누른 뒤에 선택지를 펼친다(목업)
  function focusCard() {
    const n = st.j.next, now = esc(tick().now);
    if (allDone()) return box("다 했어요", `${stage().n}단계 할 일을 모두 했어요`, "넘어가기 전에 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      `<button class="btn pri wide" data-act="gate">다음 단계로 넘어가기</button>`);
    if (st.todos) return box("지금 할 일", esc(st.todos[0]), "정한 순서대로 하나씩 해 봐요. 하고 나서 바뀐 작업을 다시 보여 주세요.");
    if (!n) return box("지금 할 일", now, "");
    if (!isPhone()) return chooseCard();
    return st.picking || st.later ? box("지금 할 일", now, "", chooseCard())
      : box("지금 할 일", now, esc(n.why), `<button class="btn pri wide" data-act="pick">같이 정하기</button>`);
  }
  const more = () => `<div class="more">
    <details><summary>이 단계 할 일 ${met().length}개 보기</summary>${critList(true)}</details>
    ${st.todos ? `<details><summary>내가 정한 순서 보기</summary>${todoList(false)}</details>` : ""}
    ${inputDetails()}</div>`;
  // 가상 데이터인지 진짜 AI인지는 늘 보인다(FR-10). 어느 프로젝트인지도
  const status = () => `<div class="status row">${modeBadge()}<span class="meta">${esc(project())}</span></div>`;
  const topRow = () => `<div class="tabs-row">${tabsBar()}${gearBtn()}</div>${settingsCard()}`;
  function deskMain() {
    if (st.tab === "doc") return topRow() + docBody(56) + status();
    if (st.tab === "map") return topRow() + mapBody() + status();
    if (st.tab === "learn") return topRow() + learnBody() + status();
    return topRow() + deskToday() + status();
  }
  function deskToday() {
    if (!st.j) return `${sayRow(56)}<div><div class="stage-title">지금 만들고 있는 걸 보여 주세요</div>
      <p class="meta" style="margin:4px 0 0">무엇을 만들고 있는지, 어디까지 했는지 편하게 적어 주세요.</p></div>${inputBox()}`;
    return sayRow(56) + progressLine() + notes() + focusCard() + more();
  }
  // 넘어가기 전 확인 — 처음에는 [한 일 그림 + 이해되셨나요?]만. 한 일 목록은 접어 두고, 다음 단계들에서는 그 단계 내용만
  function deskCheck() {
    const s = stage(), [body, actions] = checkStep(), first = st.step === "ask";
    return `<div class="row"><span class="meta grow">넘어가기 전에 함께 확인해요</span><button class="btn" data-act="close-gate">나중에 할게요</button></div>
      ${sayRow(56)}<div class="stage-title">${s.n}단계 "${esc(s.title)}"에서 이렇게 했어요</div>
      ${first ? `${flow()}<details><summary>이번 단계에서 한 일 ${met().length}개 보기</summary>${critList(false)}</details>` : ""}
      ${body ? `<div class="stack">${body}</div>` : ""}<div class="stack">${actions}</div>${status()}`;
  }
  const countdownOn = () => !isPhone() && st.ui === "home" && !hovering && !pinned() && !!timer;
  const countdown = () => (countdownOn() ? `<div class="countdown" title="곧 접혀요 — 핀을 누르면 열어 둬요"><i style="animation-duration:${DELAY.home}ms;animation-delay:-${Date.now() - idleAt}ms"></i></div>` : "");
  function renderDesk() {
    const moved = st.ui !== lastUi; lastUi = st.ui;
    const enter = moved ? " enter" : "";
    if (st.ui === "hidden") $nav.innerHTML = `<button class="strip" data-act="strip" aria-label="Navigator 열기" title="마우스를 올리면 나타나요"><i></i></button>`;
    else if (st.ui === "greet") $nav.innerHTML = `<div class="panel${enter}"><div class="say">${cat("happy", 64)}<div class="bubble">${st.back
      ? `<b>다시 오셨네요!</b><br>${esc(st.back)}`
      : `<b>안녕하세요! 저는 길잡이 고양이 나비예요.</b><br>지금 만들고 있는 걸 보여 주시면, 몇 단계쯤인지와 다음에 할 일을 알려 드려요. 평소엔 화면 위에 작게 있을게요.`}</div></div>
      <button class="btn pri" data-act="open" style="align-self:flex-start">${st.back ? "이어서 하기" : "보여 주기"}</button></div>`;
    else $nav.innerHTML = `<div class="${enter.trim()}" style="width:100%">${pill()}</div>` +
      (st.ui === "home" ? `<div class="panel${enter}">${st.screen === "gate" ? deskCheck() : deskMain()}${countdown()}</div>` : "");
  }

  // ── iPhone 화면 ──
  const today = () => new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  function ring() {
    const r = 25, len = 2 * Math.PI * r, part = len * metCount() / met().length;
    return `<svg class="ring" width="60" height="60" viewBox="0 0 60 60" role="img" aria-label="이 단계 할 일 ${met().length}개 중 ${metCount()}개">
      <circle cx="30" cy="30" r="${r}" fill="none" stroke="var(--seg)" stroke-width="7"></circle>
      <circle cx="30" cy="30" r="${r}" fill="none" stroke="var(--acc)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${part.toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 30 30)"></circle>
      <text x="30" y="35" text-anchor="middle">${metCount()}/${met().length}</text></svg>`;
  }
  // 집중 모드(iPhone) — [날짜·제목 + 톱니] · 나비 한마디 · 진행 카드 · 지금 결정할 것 하나. 나머지는 접힌 카드 하나에
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

  function render() {
    save();
    if (!timer) scheduleIdle();
    if (isPhone()) renderPhone(); else renderDesk();
    if (mouse) C.follow(isPhone() ? $phone : $nav, mouse);
  }
  PHONE.addEventListener("change", render);

  // ── 나비의 눈과 깜빡임 — 움직임 줄이기 설정이면 하지 않는다 ──
  let mouse = null, raf = 0;
  if (!STILL) {
    document.addEventListener("mousemove", (e) => {
      mouse = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; C.follow(isPhone() ? $phone : $nav, mouse); });
    });
    setInterval(() => { document.body.classList.add("blink"); setTimeout(() => document.body.classList.remove("blink"), 140); }, 3400);
  }

  // ── AI 호출 — 기다리는 동안 나비가 "살펴보는 중" ──
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
  function learn(j) {
    for (const c of j.criteria) if (c.met && c.term && !st.learned.some((x) => x.term === c.term)) st.learned.push({ term: c.term, text: c.text });
  }
  function landed(j, tokens) {
    Object.assign(st, { j, tokens: tokens || 0, todos: null, openInput: false, choice: null, later: false, picking: false, back: "" });
    learn(j);
    // 다 했으면 스스로 펼쳐서 알린다(CouCou의 alert), 아니면 접혀 있던 것만 한 줄로 보인다
    if (allDone()) go(N.nextView(st.ui, "alert", pinned())); else peek();
  }
  async function judge(skipCheck) {
    st.error = ""; st.warn = null;
    if (!st.text.trim()) { st.error = "지금 만드는 걸 적어 주세요."; return render(); }
    if (st.mode === "fixture") {
      const raw = S.judgeFixture(st.text), j = raw && N.parseJudgement(raw);
      if (!j) { st.error = "연습용 예시는 정해진 장면만 알아요. '연습 2 · 다 했어요'를 눌러 다음 장면을 보거나, 직접 쓴 글은 보기 방식을 '진짜 AI'로 바꿔 주세요."; return render(); }
      return landed(j, 0);
    }
    if (!skipCheck && guard(st.text, "judge")) return;
    const r = await callAI("/api/judge", { text: st.text });
    if (r.ok) return landed(r.judgement, r.tokens);
    st.error = `살펴보지 못했어요 — ${reasonOf(r)}. 아무 답이나 지어내지 않고 비워 둘게요.`;
    render();
  }
  async function answer() {
    st.error = "";
    const s = stage();
    if (st.mode === "fixture") {
      const a = (S.answers[s.n] || [])[st.hard[0]];
      st.answer = a ? `${a} (연습용으로 미리 써 둔 답이라, 질문 내용은 반영되지 않아요)` : "연습용 답이 없어요. 보기 방식을 '진짜 AI'로 바꿔 물어보세요.";
      return render();
    }
    if (!st.question.trim()) { st.error = "궁금한 걸 적어 주세요."; return render(); }
    const r = await callAI("/api/answer", { stage: s.n, hard: st.hard.map((i) => s.criteria[i].text), question: st.question, text: st.text });
    if (r.ok) { st.answer = r.answer; st.tokens = r.tokens; } else st.error = `답을 받지 못했어요 — ${reasonOf(r)}`;
    render();
  }
  // 고른 것을 작업 글에 한 줄로 적고 다시 살펴본다 — 정하는 건 사용자, 받아 적는 건 나비
  function decide() {
    const n = st.j.next, o = n.options[st.choice];
    st.text = `${st.text.trim()}\n${N.decisionLine(n.question, o)}`;
    Object.assign(st, { notice: `골랐어요: ${o} — 작업 글에 적어 두고 다시 살펴봤어요.`, choice: null, picking: false });
    judge(false);
  }
  // 설계도 — 초안 받기 / 다시 봐 주세요. 연습용은 미리 써 둔 초안과 빈칸 확인만, 진짜 AI는 server.js를 거친다
  const newDoc = (n, text, say) => ({ stage: n, text, say, review: null, rounds: 0 });
  async function draft(skipCheck) {
    const s = stage();
    Object.assign(st, { error: "", warn: null });
    if (st.mode === "fixture") {
      const d = S.drafts[s.n];
      if (!d) st.error = "연습용 초안은 2단계에만 있어요. 직접 쓴 작업은 보기 방식을 '진짜 AI'로 바꿔 주세요.";
      else st.doc = newDoc(s.n, d.draft, d.say);
      return render();
    }
    if (!st.text.trim()) { st.error = "'지금' 탭에서 만들고 있는 걸 먼저 보여 주세요."; return render(); }
    if (!skipCheck && guard(st.text, "draft")) return;
    const r = await callAI("/api/draft", { stage: s.n, text: st.text });
    if (r.ok) Object.assign(st, { doc: newDoc(s.n, r.draft, r.say), tokens: r.tokens });
    else st.error = `초안을 받지 못했어요 — ${reasonOf(r)}. 아무 내용이나 지어내지 않고 비워 둘게요.`;
    render();
  }
  async function review(skipCheck) {
    const d = st.doc;
    Object.assign(st, { error: "", warn: null });
    if (!d.text.trim()) { st.error = "설계도가 비어 있어요."; return render(); }
    if (st.mode === "fixture") { Object.assign(d, { review: S.reviewFixture(d.text), say: "" }); d.rounds++; return render(); }
    if (!skipCheck && guard(`${st.text}\n${d.text}`, "review")) return;
    const r = await callAI("/api/review", { stage: d.stage, text: st.text, doc: d.text });
    if (r.ok) { Object.assign(d, { review: r.review, say: "" }); d.rounds++; st.tokens = r.tokens; }
    else st.error = `다시 봐 드리지 못했어요 — ${reasonOf(r)}`;
    render();
  }
  // 확정은 사람만 한다(FR-3). 같은 단계의 예전 확정본은 새것으로 바꾼다
  function confirmDoc() {
    const d = st.doc, s = N.STAGES[d.stage];
    st.docs = st.docs.filter((x) => x.stage !== d.stage).concat({ stage: d.stage, name: s.doc, text: d.text, at: ymd() });
    Object.assign(st, { doc: null, warn: null, error: "", notice: `${s.n}단계 설계도를 확정했어요. '내 배움'에도 모아 뒀어요.` });
    render();
  }

  function advance() {
    const s = stage(), nx = nextStage();
    st.history.push({ short: `${s.n}단계 ${s.title} 마침`,
      text: `${s.n}단계 "${s.title}" → ${nx ? `${nx.n}단계로 넘어갔어요` : "마무리했어요"} · '잘 모르겠어요' ${st.noCount}번 · ${ymd()}` });
    Object.assign(st, { screen: "main", notice: "", tab: "today" });
    if (nx) st.j = { stage: nx.n, reason: `${s.n}단계를 마쳤어요! 이제 ${nx.n}단계 "${nx.title}"예요. 정한 순서대로 하나씩 해 봐요.`,
      criteria: nx.criteria.map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    render();
  }

  // ── 누르기 — data-act 이름 → 할 일 ──
  const set = (patch) => { Object.assign(st, patch); render(); };
  const ACT = {
    strip: () => go(N.nextView(st.ui, "enter", pinned())),
    open: () => go(N.nextView(st.ui, "click", pinned())),
    pin: () => { clearIdle(); set({ userPin: !st.userPin }); },
    pill: () => {
      // 한 줄 알림("작업이 바뀌었어요")을 누르면 알림은 지우고, 바뀐 작업을 보여 주는 칸을 펼쳐 둔다
      if (st.ping) Object.assign(st, { ping: "", openInput: true });
      go(st.ui === "home" ? "petit" : N.nextView(st.ui, "click", pinned()));
    },
    ex: (i) => { st.text = S.examples[i].text; st.notice = ""; judge(true); },
    judge: () => { st.notice = ""; judge(false); },
    "send-anyway": () => RETRY[st.warn.then](),
    "stop-send": () => set({ warn: null }),
    edit: () => { set({ warn: null }); const t = document.querySelector("[data-act=text]"); if (t) t.focus(); },
    opt: (i) => set({ choice: i }),
    decide: () => { if (st.choice !== null) decide(); },
    later: () => set({ later: true, choice: null, picking: false }),
    again: () => set({ later: false, picking: true }),
    pick: () => set({ picking: true }),
    settings: () => set({ settings: !st.settings }),
    tab: (i) => set({ tab: TABS[i][0], error: "", warn: null }),
    draft: () => draft(false),
    review: () => review(false),
    "confirm-doc": () => confirmDoc(),
    "reopen-doc": () => { const x = st.docs.find((d) => d.stage === st.j.stage); set({ doc: newDoc(x.stage, x.text, "") }); },
    forget: () => { forgotten = true; try { localStorage.removeItem(KEY); } catch {} location.reload(); },
    gate: () => set({ screen: "gate", step: "ask", hard: [], question: "", answer: "", noCount: 0, error: "" }),
    "close-gate": () => set({ screen: "main" }),
    no: () => set({ noCount: st.noCount + 1, step: "which", hard: [], answer: "", question: "" }),
    "to-question": () => set({ step: "question" }),
    answer: () => answer(),
    plan: () => set({ step: "plan" }),
    yes: () => { const nx = nextStage(); set({ todos: nx ? nx.criteria.map((c) => c.text) : [], step: "next" }); },
    up: (i) => set({ todos: N.reorder(st.todos, i, -1) }),
    down: (i) => set({ todos: N.reorder(st.todos, i, 1) }),
    go: () => advance(),
  };
  for (const $root of [$nav, $phone]) {
    $root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-act]");
      if (t && ACT[t.dataset.act]) ACT[t.dataset.act](Number(t.dataset.i));
    });
    $root.addEventListener("change", (e) => {
      const a = e.target.dataset.act;
      if (a === "mode") set({ mode: e.target.value, error: "", warn: null });
      if (a === "auto") set({ auto: e.target.checked });
      if (a === "hard") { const i = Number(e.target.dataset.i); set({ hard: e.target.checked ? [...st.hard, i].sort() : st.hard.filter((x) => x !== i) }); }
    });
    $root.addEventListener("input", (e) => {
      if (e.target.dataset.act === "text") st.text = e.target.value;
      if (e.target.dataset.act === "question") st.question = e.target.value;
      if (e.target.dataset.act === "doc" && st.doc) {
        st.doc.text = e.target.value; save();   // 글자를 칠 때는 다시 그리지 않는다(커서가 튄다) — 빈칸 개수만 바꾼다
        const m = document.querySelector("[data-blanks]");
        if (m) m.textContent = blankMeta(st.doc);
      }
    });
  }

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
    if (ev.kind === "stop" && st.auto && st.mode === "live") {
      st.ping = "";
      await judge(false);
      if (st.warn) go(N.nextView(st.ui, "alert", pinned()));
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
      st.text = S.examples[0].text; st.ping = "방금 작업이 바뀌었어요 — 눌러서 어디쯤인지 볼까요?";
      peek();
    };
    step();
  });

  render();
})();
