// claude-drafted: 2026-10-14 — Navigator 프로토타입 화면 동작. 목업(Mac·iPhone)을 따른다.
// 규칙·문구 판단은 navigator.js, 연습 예시는 scenario.js, 고양이는 cat.js, 실제 Claude 호출은 server.js.
// 넓은 화면 = Mac: 코딩 도구 창 위에 떠 있는 옆자리 동료(띠 → 한 줄 → 펼침, CouCou 동작을 따름 — 코드·캐릭터·소리는 가져오지 않음)
// 600px 이하 = iPhone: 오늘 / 단계 지도 / 내 배움 탭과 넘어가기 전 확인 화면. 두 화면은 같은 상태(st)를 쓴다.
(function () {
  const N = window.NavRules, S = window.NavScenario, C = window.NavCat;
  const canLive = location.protocol.startsWith("http");
  const DELAY = { greet: 6000, home: 15000, petit: 30000 };   // 저절로 접히기까지(밀리초)
  const PHONE = matchMedia("(max-width: 600px)");
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const st = {
    ui: "greet", screen: "main", tab: "today", mode: canLive ? "live" : "fixture", text: S.examples[0].text,
    j: null, tokens: 0, busy: false, error: "", warn: null, notice: "", todos: null, userPin: false, ping: "", openInput: false,
    choice: null, later: false, picking: false,
    step: "ask", hard: [], question: "", answer: "", noCount: 0, history: [], learned: [],
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
    reason: st.j && st.j.reason, allDone: allDone() });
  const tick = () => N.ticker(st.j, st.todos, st.history.length ? st.history[st.history.length - 1].short : "");
  const cat = (mood, size) => C.svg(mood, size);

  // ── 아이콘 (선 그림) ──
  const icon = (d, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    up: icon('<path d="M6 15l6-6 6 6"></path>', 14), down: icon('<path d="M6 9l6 6 6-6"></path>', 14),
    pin: icon('<path d="M9 4h6l-1 6 3 3H7l3-3z"></path><path d="M12 13v7"></path>', 15),
    back: icon('<path d="M15 5l-7 7 7 7"></path>', 20),
    today: icon('<circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5z"></path>', 24),
    map: icon('<path d="M4 19h4V5H4zM10 19h4V9h-4zM16 19h4v-6h-4z"></path>', 24),
    learn: icon('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"></path>', 24),
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
  $nav.addEventListener("mouseenter", () => { hovering = true; if (st.ui !== "greet") clearIdle(); go(N.nextView(st.ui, "enter", pinned())); });
  $nav.addEventListener("mouseleave", () => { hovering = false; render(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !isPhone()) go(N.nextView(st.ui, "esc", pinned())); });

  // ── 두 화면이 함께 쓰는 조각 ──
  const sayRow = (size, m) => { const [mood, say] = face(); return `<div class="say">${cat(m || mood, size)}<div class="bubble" aria-live="polite">${esc(say)}</div></div>`; };
  const seg = () => `<div class="seg" aria-hidden="true">${N.STAGES.map((x) => `<span class="${x.n < stage().n ? "done" : x.n === stage().n ? "cur" : ""}"></span>`).join("")}</div>`;
  const stageBlock = () => `<div><div class="stage-head"><span class="stage-title">${esc(stage().title)}</span><span class="meta">${stage().n} / 7단계</span></div>
    ${seg()}<span class="meta">이 단계에서 할 일 ${met().length}개 중 ${metCount()}개 했어요</span></div>`;
  function tickerBlock() {
    const t = tick();
    return `<div class="ticker">${t.done ? `<div class="past"><span class="k">✓ 방금 한 일</span><span>${esc(t.done)}</span></div>` : ""}
      <div class="now"><span class="k">● 지금 할 일</span><span>${esc(t.now)}</span></div>
      <div class="past"><span class="k">○ 그다음</span><span>${esc(t.after)}</span></div></div>`;
  }
  // 골라 주세요 — 고르는 건 사용자다. 고르면 작업 글에 한 줄로 적고 다시 살펴본다
  function chooseCard() {
    if (st.todos) return `<div><p class="label">내가 정한 순서</p><ol class="todo">${st.todos.map((x, i) => `<li><span class="i">${i + 1}</span><span>${esc(x)}</span></li>`).join("")}</ol></div>`;
    const n = st.j.next;
    if (!n) return "";
    if (st.later) return `<div class="row"><span class="meta grow">나중에 정하기로 했어요 — ${esc(n.question)}</span><button class="btn" data-act="again">다시 고르기</button></div>`;
    return `<div class="choose"><span class="label" style="margin:0">골라 주세요</span><span class="q">${esc(n.question)}</span><span class="why">${esc(n.why)}</span>
      ${n.options.map((o, i) => `<button class="opt" data-act="opt" data-i="${i}" aria-pressed="${st.choice === i}"><span class="radio"></span>${esc(o)}</button>`).join("")}
      <div class="row"><button class="btn pri grow" data-act="decide" ${st.choice === null || st.busy ? "disabled" : ""}>이걸로 정할게요</button><button class="btn" data-act="later">나중에</button></div>
      <span class="meta">${esc(n.action)}</span></div>`;
  }
  const critList = (terms) => `<ul class="crit">${st.j.criteria.map((c) => `<li><span class="ck ${c.met ? "y" : "n"}">${c.met ? "✓" : "○"}</span><span>${esc(c.text)}${
    terms && c.term ? `<span class="tag" title="전문가들이 부르는 이름이에요">용어: ${esc(c.term)}</span>` : ""}${
    c.evidence ? `<span class="sub">적어 주신 글: "${esc(c.evidence)}"</span>` : ""}</span></li>`).join("")}</ul>`;
  const critBlock = () => `<div><p class="label">이 단계에서 할 일 ${met().length}개</p>${critList(true)}</div>`;
  const gateButton = () => `<div><button class="btn pri wide" data-act="gate" ${allDone() ? "" : "disabled"}>다음 단계로 넘어가기</button>
    <p class="meta" style="text-align:center;margin:6px 0 0">${allDone() ? "할 일을 다 했어요. 넘어가기 전에 한 번만 같이 확인해요." : `아직 ${left()}개 남았어요. 다 하면 넘어갈 수 있어요.`}</p></div>`;
  const soon = () => `<div><p class="label">설계도 함께 쓰기</p><div class="soon"><span class="badge tmp">곧 열려요</span> AI가 설계도 초안을 먼저 써 드리고, 고치시면 다시 봐 드리는 자리예요.</div></div>`;
  const notes = () => (st.notice ? `<div class="note n-ok">${esc(st.notice)}</div>` : "");
  function inputBox() {
    let h = `<textarea data-act="text" aria-label="지금 만드는 것">${esc(st.text)}</textarea>
      <div class="row">${S.examples.filter((e) => !e.hidden).map((e) => `<button class="btn" data-act="ex" data-i="${S.examples.indexOf(e)}">${esc(e.label)}</button>`).join("")}
      <span class="grow"></span><button class="btn pri" data-act="judge" ${st.busy ? "disabled" : ""}>어디쯤인지 보기</button></div>`;
    if (st.mode === "live") h += `<p class="meta" style="margin:0">보여 주신 글은 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처는 빼 주세요.</p>`;
    if (st.warn) h += `<div class="note n-warn"><b>보내기 전에 잠깐!</b> 글 안에 ${esc(st.warn.join(", "))}처럼 보이는 게 있어요. 그래도 AI에게 보낼까요?
      <div class="row" style="margin-top:8px"><button class="btn" data-act="send-anyway">괜찮아요, 보낼게요</button><button class="btn pri" data-act="edit">고칠게요</button></div></div>`;
    if (st.error) h += `<div class="note n-bad">${esc(st.error)}</div>`;
    return `<div style="display:flex;flex-direction:column;gap:8px">${h}</div>`;
  }
  const inputDetails = () => `<details ${st.error || st.warn || st.openInput ? "open" : ""}><summary>바뀐 작업 다시 보여 주기</summary>${inputBox()}</details>`;
  const historyBlock = () => (st.history.length ? `<div><p class="label">지나온 단계</p>${st.history.map((x) => `<div class="meta">${esc(x.text)}</div>`).join("")}</div>` : "");
  function footer() {
    const b = st.mode === "live"
      ? `<span class="badge live">진짜 AI(Claude)가 봤어요${st.tokens ? ` · 읽고 쓴 양 약 ${st.tokens.toLocaleString()}토큰` : ""}</span>`
      : `<span class="badge fix">연습용 예시예요 — 진짜 AI가 아니에요</span>`;
    return `<div class="foot"><div class="row">${b}<span class="grow">안내 기준은 아직 시험판이에요</span>${countdownOn() ? "<span>곧 접혀요</span>" : ""}</div>
      <div class="row">보기 방식 <select data-act="mode" aria-label="보기 방식">
        <option value="fixture" ${st.mode === "fixture" ? "selected" : ""}>연습용 예시</option>
        <option value="live" ${st.mode === "live" ? "selected" : ""} ${canLive ? "" : "disabled"}>진짜 AI (Claude)${canLive ? "" : " — server.js를 켜야 해요"}</option></select></div></div>`;
  }

  // 단계 지도 · 내 배움 — PC 패널의 탭과 iPhone 탭이 같이 쓴다
  function mapBody() {
    const cur = st.j ? st.j.stage : -1;
    return `<div class="list">${N.STAGES.map((x) => `<div>
      <span class="dot ${x.n < cur ? "y" : x.n === cur ? "c" : ""}"></span><span style="flex:1;padding:8px 0"><b>${x.n} · ${esc(x.title)}</b><span class="sub">${esc(x.does)}</span></span>
      ${x.n === cur ? `<span class="meta">${metCount()}/${met().length}</span>` : ""}</div>`).join("")}</div>`;
  }
  const learnBody = () => `<div class="card"><span class="kicker">지나온 단계</span>${st.history.length ? st.history.map((x) => `<span class="meta">${esc(x.text)}</span>`).join("") : `<span class="meta">아직 없어요. 한 단계를 마치면 여기 남아요.</span>`}</div>
    <div class="card"><span class="kicker">배운 말</span>${st.learned.length ? st.learned.map((x) => `<div><b>${esc(x.term)}</b><span class="sub">${esc(x.text)}</span></div>`).join("")
      : `<span class="meta">할 일을 하나씩 마치면, 전문가들이 부르는 이름을 여기 모아 드려요.</span>`}</div>`;
  const TABS = [["today", "지금", "오늘", "today"], ["map", "단계 지도", "단계 지도", "map"], ["learn", "내 배움", "내 배움", "learn"]];  // [id, PC 이름, iPhone 이름, 아이콘]
  const tabsBar = () => `<div class="segctl" role="tablist" aria-label="보기">${TABS.map(([id, label], i) =>
    `<button role="tab" data-act="tab" data-i="${i}" aria-selected="${st.tab === id}">${label}</button>`).join("")}</div>`;

  // 넘어가기 전 확인 — 단계마다 [내용, 버튼]. Mac은 이어서 보이고, iPhone은 버튼을 아래에 붙인다
  function checkStep() {
    const s = stage(), nx = nextStage();
    const yesNo = `<span class="ask">이번 단계에서 한 일, 이해되셨나요?</span>
      <button class="btn pri wide" data-act="yes">네, 이해했어요</button><button class="btn wide" data-act="no">아니요, 잘 모르겠어요</button>
      <span class="meta" style="text-align:center">모르는 게 당연해요. "아니요"를 누르면 헷갈린 부분을 같이 풀어 봐요.${st.noCount ? ` · 다시 물어본 횟수 ${st.noCount}번` : ""}</span>`;
    if (st.step === "which") return [`<span class="ask">어디가 헷갈렸나요?</span><span class="meta">여러 개 골라도 돼요.</span>` +
      s.criteria.map((c, i) => `<label class="chk"><input type="checkbox" data-act="hard" data-i="${i}" ${st.hard.includes(i) ? "checked" : ""}>${esc(c.text)}</label>`).join(""),
      `<button class="btn pri wide" data-act="to-question" ${st.hard.length ? "" : "disabled"}>다음</button>`];
    if (st.step === "question") return [`<span class="ask">궁금한 걸 편하게 물어보세요</span>
      <textarea data-act="question" placeholder="예) 꼭 필요한지 표시하는 건 왜 해요?">${esc(st.question)}</textarea>
      ${st.answer ? `<div class="note n-acc">${esc(st.answer)}</div>` : ""}${st.error ? `<div class="note n-bad">${esc(st.error)}</div>` : ""}`,
      `<button class="btn pri wide" data-act="answer" ${st.busy ? "disabled" : ""}>물어보기</button>${st.answer ? `<button class="btn wide" data-act="plan">한 장 요약 보기</button>` : ""}`];
    if (st.step === "plan") return [`<span class="ask">이번 단계 한 장 요약</span><div class="plan">
      <div><b>받은 것</b> ${esc(s.gets)}</div><div><b>한 일</b> ${esc(s.does)}</div><div><b>만든 것</b> ${esc(s.gives)}</div>
      <div><b>헷갈렸던 부분</b> ${esc(st.hard.map((i) => s.criteria[i].text).join(", "))}</div>
      <div><b>받은 답</b> ${esc(st.answer)}</div>${nx ? `<div><b>다음 단계</b> ${nx.n}단계 ${esc(nx.title)} — ${esc(nx.does)}</div>` : ""}</div>`, yesNo];
    if (st.step === "next") return [`<span class="ask">좋아요! 다음은 ${nx ? `${nx.n}단계 "${esc(nx.title)}"` : "마무리"}예요</span>
      <span class="meta">무엇부터 할지 순서를 정해 보세요.</span>
      <ol class="todo">${st.todos.map((t, i) => `<li><span class="i">${i + 1}</span><span>${esc(t)}</span>
        <button class="round" data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? "disabled" : ""}>${I.up}</button>
        <button class="round" data-act="down" data-i="${i}" aria-label="아래로" ${i === st.todos.length - 1 ? "disabled" : ""}>${I.down}</button></li>`).join("")}</ol>`,
      `<button class="btn pri wide" data-act="go" ${N.canAdvance(met(), "yes") ? "" : "disabled"}>이 순서로 시작하기</button>`];
    return ["", yesNo];
  }
  const chips = () => `<div class="chips">${N.STAGES.map((x) => `<span class="chip ${x.n < stage().n ? "done" : x.n === stage().n ? "cur" : ""}">${x.n < stage().n ? "✓ " : ""}${x.n} ${esc(x.short)}</span>`).join("")}</div>`;
  const flow = () => { const s = stage(); return `<div class="flow"><div class="box"><b>받은 것</b>${esc(s.gets)}</div><span class="arrow">→</span>
    <div class="box"><b>한 일</b>${esc(s.does)}</div><span class="arrow">→</span><div class="box"><b>만든 것</b>${esc(s.gives)}</div></div>`; };

  // ── Mac 화면 ──
  function pill() {
    let stageTxt, count = "", now = "";
    if (st.busy) stageTxt = "살펴보는 중이에요…";
    else if (st.ping) stageTxt = st.ping;
    else if (!st.j) { stageTxt = "Navigator"; now = "눌러서 지금 만드는 걸 보여 주세요"; }
    else { stageTxt = `${allDone() ? "할 일을 다 했어요! · " : ""}${stage().n}단계 · ${stage().short}`; count = `${met().length}개 중 ${metCount()}개 했어요`; now = `지금: ${tick().now}`; }
    const open = st.ui === "home";
    return `<div class="pill glass">
      <button class="pill-main" data-act="pill" aria-expanded="${open}">${cat(st.ping ? "happy" : face()[0], 34)}
        <span class="pill-stage">${esc(stageTxt)}</span>${count ? `<span class="pill-count">${esc(count)}</span>` : ""}<span class="pill-now">${esc(now)}</span></button>
      ${open ? `<button class="round" data-act="pin" aria-pressed="${st.userPin}" aria-label="열어 두기" title="열어 두기 — 저절로 접히지 않아요">${I.pin}</button>` : ""}
      <button class="round" data-act="pill" aria-label="${open ? "접기" : "펼치기"}">${open ? I.up : I.down}</button></div>`;
  }
  function deskMain() {
    if (st.tab === "map") return tabsBar() + mapBody() + footer();
    if (st.tab === "learn") return tabsBar() + learnBody() + footer();
    return tabsBar() + deskToday();
  }
  function deskToday() {
    if (!st.j) return `${sayRow(64)}<div><div class="stage-title">지금 만들고 있는 걸 보여 주세요</div>
      <p class="meta" style="margin:4px 0 0">무엇을 만들고 있고, 어디까지 했는지 편하게 적어 주세요. 연습용 예시 버튼을 눌러 봐도 돼요.</p></div>
      <div><p class="label">${esc(S.PROJECT)} (연습용 예시)</p>${inputBox()}</div>${footer()}`;
    return sayRow(64) + stageBlock() + tickerBlock() + notes() + chooseCard() + critBlock() + gateButton() + soon() + inputDetails() + historyBlock() + footer();
  }
  function deskCheck() {
    const s = stage(), [body, actions] = checkStep();
    return `<div class="row"><span class="meta grow">넘어가기 전에 함께 확인해요${st.mode === "fixture" ? " · 연습용 예시" : ""}</span><button class="btn" data-act="close-gate">나중에 할게요</button></div>
      ${sayRow(64)}<div class="stage-title">${s.n}단계 "${esc(s.title)}"에서 이렇게 했어요</div>${chips()}${flow()}${critList(false)}
      ${body ? `<div style="display:flex;flex-direction:column;gap:10px">${body}</div>` : ""}<div style="display:flex;flex-direction:column;gap:8px">${actions}</div>`;
  }
  const countdownOn = () => !isPhone() && st.ui === "home" && !hovering && !pinned() && !!timer;
  const countdown = () => (countdownOn() ? `<div class="countdown" title="곧 접혀요 — 핀을 누르면 열어 둬요"><i style="animation-duration:${DELAY.home}ms;animation-delay:-${Date.now() - idleAt}ms"></i></div>` : "");
  function renderDesk() {
    const moved = st.ui !== lastUi; lastUi = st.ui;
    const enter = moved ? " enter" : "";
    if (st.ui === "hidden") $nav.innerHTML = `<button class="strip" data-act="strip" aria-label="Navigator 열기" title="마우스를 올리면 나타나요"><i></i></button>`;
    else if (st.ui === "greet") $nav.innerHTML = `<div class="panel${enter}"><div class="say">${cat("happy", 64)}<div class="bubble">
      <b>안녕하세요! 저는 길잡이 고양이 나비예요.</b><br>지금 만들고 있는 걸 보여 주시면, 몇 단계쯤인지와 다음에 할 일을 알려 드려요. 평소엔 화면 위에 작게 있을게요.</div></div>
      <button class="btn pri" data-act="open" style="align-self:flex-start">보여 주기</button></div>`;
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
  function phoneToday() {
    let h = `<div class="ph-date">${esc(today())}</div><h1 class="ph-title">오늘의 길잡이</h1>${sayRow(72)}`;
    if (!st.j) return h + `<div class="card"><span class="kicker">시작하기</span><span class="big">지금 만들고 있는 걸 보여 주세요</span>
      <span class="meta">무엇을 만들고 있고, 어디까지 했는지 편하게 적어 주세요. 연습용 예시 버튼을 눌러 봐도 돼요.</span>${inputBox()}</div>${footer()}`;
    const s = stage(), t = tick();
    h += `<div class="card"><div class="proj">${ring()}<div><div class="meta">${esc(S.PROJECT)}</div><div class="big" style="font-size:18px">${s.n}단계 · ${esc(s.title)}</div></div></div>
      ${seg()}<span class="meta">전체 8단계 중 ${s.n + 1}번째 단계예요</span></div>`;
    h += notes();
    if (allDone()) h += `<div class="card"><span class="kicker">다 했어요</span><span class="big">${s.n}단계 할 일을 다 했어요!</span>
      <span class="why">넘어가기 전에 이번 단계를 이해했는지 같이 확인해요.</span><button class="btn pri wide" data-act="gate">확인하러 가기</button></div>`;
    else if (st.todos || !st.j.next) h += `<div class="card"><span class="kicker">지금 할 일</span><span class="big">${esc(t.now)}</span>${chooseCard()}</div>`;
    else h += `<div class="card"><span class="kicker">지금 할 일</span><span class="big">${esc(t.now)}</span>
      ${st.picking ? chooseCard() : `<span class="why">${esc(st.j.next.why)}</span><button class="btn pri wide" data-act="pick">같이 정하기</button>`}</div>`;
    const rest = st.j.criteria.filter((c) => !c.met).map((c) => c.text).slice(st.todos ? 0 : 1);
    if (rest.length && !st.todos) h += `<p class="label">그다음</p><div class="list">${rest.map((x) => `<div><span class="dot"></span><span>${esc(x)}</span></div>`).join("")}</div>`;
    return h + `<div class="card">${inputDetails()}</div>${footer()}`;
  }
  const phoneMap = () => `<div class="ph-date">전체 8단계</div><h1 class="ph-title">단계 지도</h1>${mapBody()}`;
  const phoneLearn = () => `<div class="ph-date">지나온 길과 배운 말</div><h1 class="ph-title">내 배움</h1>${learnBody()}`;
  function phoneCheck() {
    const s = stage(), [body, actions] = checkStep();
    return `<button class="back" data-act="close-gate">${I.back}오늘</button>
      <div class="ph-head">${cat(face()[0], 64)}<div><div class="t">${s.n}단계를 다 했어요!</div><div class="meta">넘어가기 전에 함께 확인해요${st.mode === "fixture" ? " · 연습용 예시" : ""}</div></div></div>
      ${chips()}<div class="card"><span class="label" style="margin:0">이번 단계에서 이렇게 했어요</span>${flow()}${critList(false)}</div>
      ${body ? `<div class="card">${body}</div>` : ""}<div class="bottom glass">${actions}</div>`;
  }
  function renderPhone() {
    const gate = st.screen === "gate";
    $phone.className = "phone" + (gate ? " check" : "");
    $phone.innerHTML = gate ? phoneCheck() : ({ today: phoneToday, map: phoneMap, learn: phoneLearn }[st.tab])() +
      `<nav class="tabbar glass" aria-label="화면">${TABS.map(([id, , label, ic], i) => `<button class="tab" data-act="tab" data-i="${i}" ${st.tab === id ? 'aria-current="page"' : ""}>${I[ic]}${label}</button>`).join("")}</nav>`;
  }

  function render() {
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
  function learn(j) {
    for (const c of j.criteria) if (c.met && c.term && !st.learned.some((x) => x.term === c.term)) st.learned.push({ term: c.term, text: c.text });
  }
  function landed(j, tokens) {
    Object.assign(st, { j, tokens: tokens || 0, todos: null, openInput: false, choice: null, later: false, picking: false });
    learn(j);
    // 다 했으면 스스로 펼쳐서 알린다(CouCou의 alert), 아니면 접혀 있던 것만 한 줄로 보인다
    go(allDone() ? N.nextView(st.ui, "alert", pinned()) : st.ui === "hidden" ? "petit" : st.ui);
  }
  async function judge(skipCheck) {
    st.error = ""; st.warn = null;
    if (!st.text.trim()) { st.error = "지금 만드는 걸 적어 주세요."; return render(); }
    if (st.mode === "fixture") {
      const raw = S.judgeFixture(st.text), j = raw && N.parseJudgement(raw);
      if (!j) { st.error = "연습용 예시는 정해진 장면만 알아요. '연습 2 · 다 했어요'를 눌러 다음 장면을 보거나, 직접 쓴 글은 보기 방식을 '진짜 AI'로 바꿔 주세요."; return render(); }
      return landed(j, 0);
    }
    if (!skipCheck) { const w = sensitive(st.text); if (w.length) { st.warn = w; return render(); } }
    const r = await callAI("/api/judge", { text: st.text });
    if (r.ok) return landed(r.judgement, r.tokens);
    st.error = `살펴보지 못했어요 — ${r.reason || "이유를 알 수 없어요"}. 아무 답이나 지어내지 않고 비워 둘게요.`;
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
    if (r.ok) { st.answer = r.answer; st.tokens = r.tokens; } else st.error = `답을 받지 못했어요 — ${r.reason || "이유를 알 수 없어요"}`;
    render();
  }
  // 고른 것을 작업 글에 한 줄로 적고 다시 살펴본다 — 정하는 건 사용자, 받아 적는 건 나비
  function decide() {
    const n = st.j.next, o = n.options[st.choice];
    st.text = `${st.text.trim()}\n${N.decisionLine(n.question, o)}`;
    Object.assign(st, { notice: `골랐어요: ${o} — 작업 글에 적어 두고 다시 살펴봤어요.`, choice: null, picking: false });
    judge(false);
  }
  function advance() {
    const s = stage(), nx = nextStage();
    st.history.push({ short: `${s.n}단계 ${s.title} 마침`,
      text: `${s.n}단계 "${s.title}" → ${nx ? `${nx.n}단계로 넘어갔어요` : "마무리했어요"} · '잘 모르겠어요' ${st.noCount}번 · ${new Date().toISOString().slice(0, 10)}` });
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
    "send-anyway": () => judge(true),
    edit: () => { set({ warn: null }); const t = document.querySelector("[data-act=text]"); if (t) t.focus(); },
    opt: (i) => set({ choice: i }),
    decide: () => { if (st.choice !== null) decide(); },
    later: () => set({ later: true, choice: null, picking: false }),
    again: () => set({ later: false, picking: true }),
    pick: () => set({ picking: true }),
    tab: (i) => set({ tab: TABS[i][0] }),
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
      if (a === "hard") { const i = Number(e.target.dataset.i); set({ hard: e.target.checked ? [...st.hard, i].sort() : st.hard.filter((x) => x !== i) }); }
    });
    $root.addEventListener("input", (e) => {
      if (e.target.dataset.act === "text") st.text = e.target.value;
      if (e.target.dataset.act === "question") st.question = e.target.value;
    });
  }

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
      go(st.ui === "hidden" || st.ui === "greet" ? "petit" : st.ui);
    };
    step();
  });

  render();
})();
