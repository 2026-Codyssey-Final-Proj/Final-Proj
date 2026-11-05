  // ── 앱의 옆 창 둘(C-22): 섬이 창의 내용을 그려 보내고, 창의 누름은 돌아온다(win.js). 열림 · 닫힘 · 내용이 바뀐 것만 보낸다 ──
  const winOpen = { settings: false, quest: false }, winHtml = { settings: "", quest: "" };
  let winClosing = { settings: false, quest: false };   // 내가 닫는 중(자리를 바꿀 때) — 창의 '닫힘' 알림으로 상태를 끄지 않게
  const winSize = (kind) => (kind === "quest" ? null : [Math.round(380 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui-scale")) || 1)), 760]);
  // 작업실에 보내는 것 = 작업실 판(qwinHTML) + 섬의 옆 칸(.isl-col — 플로로 · 채팅 · 판, C-41 ⑤). 자리(side-…) · 좁은지(narrow — 옆 자리)는 class로, 칸의 크기는 작업실(win.js)이 갖는다
  // C-46 R-2(2026-10-27 이재엽 버튼 "펼치면 비킴 · 접으면 알약" · "고른 가장자리에" · 세로 알약 · 설정의 시간대로): 섬이 접혀 있으면(petit · hidden) 옆 칸은 그 가장자리의 알약(folded — 왼쪽 · 오른쪽은 세로)이고 작업실이 넓어진다(win.js · win.html).
  //   알약을 누르면(ACT pill) 펼쳐지고 작업실이 비킨다. 알릴 일(허락 카드 · 보고 · 질문 · 오류)은 peek · alert로 저절로 펼친다(peek는 앱의 작업실 안이면 home으로). 저절로 접히기는 설정 '접히기까지' 그대로(pinned에서 st.qwin을 앱에서는 빼서) — 단 옆 칸에 마우스가 있거나 글을 쓰는 중(colHover · colTyping)이면 안 접히고, 접힌 알약은 더 접히지 않는다
  const colFolded = () => st.ui === "petit" || st.ui === "hidden";
  // C-61 섬 자리(2026-10-29): 그 단계의 칸이 하나도 적히지 않았거나 관문에서 물을 때, 섬이 펼쳐져 있으면 작업 칸 전체(center). 사람이 [칸 n개에 적기]를 누르면 옆 칸으로 — AI의 판단으로는 옮기지 않는다. 머리 줄의 '크게 · 옆으로'로 직접도
  //   1단계 시작(퀘스트 전)도 작업실 안이면 가운데 — 두승현 2026-10-29 "반드시 1단계 화면이 나오도록". 초안이 있는 장은 전처럼 옆(같은 날 두승현: 1단계에만). 떠 있는 섬(주소 장면 · 알림)은 그대로
  const bigAuto = () => !!(QU && ((!st.j && !st.quest && st.qwin) || (st.quest && st.quest.phase === "quest" && !st.quest.draft && !st.quest.objs.some((_, i) => QU.filled(st.quest, i)))));   // 관문 · 새 단계 시작의 '다시 가운데'는 기획안 9절 미정 — 사람이 머리 줄 단추로
  const islBig = () => (st.islBig == null ? bigAuto() : !!st.islBig);
  const islCol = () => `<div class="isl-col side-${side} ${side === "left" || side === "right" ? "narrow" : "wide"}${!colFolded() && islBig() ? " center" : ""}${colFolded() ? " folded" : ""}${colFolded() && st.boot ? " has-bub" : ""}">${colFolded() ? pillHTML() + bootBubble() : islandHTML("", true)}</div>`;
  // C-55(2026-10-28 이재엽 버튼 "접힌 알약 + 말풍선"): 켤 때 알약 옆 말풍선 — 시간대 인사 한 줄(하루 한 번) · 멈춘 곳(단계 · 지금 칸) · 섬 펼치기 / 나중에. 몇 초 뒤(greet.js BUBBLE_MS) 사라진다
  const bootBubble = () => {
    if (!st.boot || !colFolded()) return "";
    const s = st.j && stage();
    const now = s ? `멈춘 곳: ${LB(s.n)} ${esc(s.title)} · 지금: ${esc(tick().now)}` : "시작 전이에요 — 무엇을 만들지부터 같이 정해요";
    return `<div class="hello-bub" role="status" aria-live="polite">${st.boot.greet ? `<b class="hb-hi">${esc(C.greeting(new Date().getHours()))}</b>` : ""}<span class="hb-now">${now}</span>
      <div class="hb-acts"><button type="button" data-act="pill">섬 펼치기</button><button type="button" class="ghost" data-act="boot-later">나중에</button></div></div>`;
  };
  // F-144-8(2026-11-03): 앱에서 작업실이 열려 있으면 보이는 칸은 작업실 창(win.js)에 있고 섬 창은 숨는다 — 섬의 요소를 켜거나 focus()해도 아무 일이 없었다.
  //   단추 켜고 끄기(liveBtn)는 상태가 바뀔 때만 다시 그려 보내고, 칸에 커서 두기(focusAct)는 보낼 내용 끝에 한 번만 쓰는 신호(data-want-focus)를 실어 창이 그 칸에 둔다
  //   lastOff — 창에 마지막으로 보낸 단추 상태. 다른 일로 다시 보내면(남기기 뒤 빈 칸 등) 잊는다 — 남아 있으면 다음 글자에 단추가 다시 켜지지 않았다(새 맥락 리뷰)
  let focusSeq = 0, focusWant = "";
  const lastOff = {};
  function liveBtn(act, off) {
    const b = $nav.querySelector(`[data-act=${act}]`) || document.querySelector(`[data-act=${act}]`); if (b) b.disabled = off;
    if (winOpen.quest && lastOff[act] !== off) { syncWins(); lastOff[act] = off; }
  }
  function focusAct(sel) {
    requestAnimationFrame(() => {
      if (winOpen.quest) { focusWant = `${++focusSeq}|${sel}`; syncWins(); return; }
      const t = $nav.querySelector(sel) || document.querySelector(sel); if (t) t.focus();
    });
  }
  const focusTag = () => (focusWant ? `<i hidden data-want-focus="${esc(focusWant)}"></i>` : "");
  function syncWins() {
    if (!WINS || !QU) return;
    for (const [kind, on, html] of [["quest", st.qwin, st.qwin ? qwinHTML() + islCol() + focusTag() : ""]]) {
      if (on && !winOpen[kind]) { winOpen[kind] = true; winHtml[kind] = html; clearLive(); window.floeApp.openWin(kind, { side, size: winSize(kind), html, place: true }); }
      else if (!on && winOpen[kind]) { winOpen[kind] = false; winHtml[kind] = ""; winClosing[kind] = true; focusWant = ""; window.floeApp.closeWin(kind); }
      else if (on && html !== winHtml[kind]) { winHtml[kind] = html; clearLive(); window.floeApp.sendWin(kind, html); }
    }
  }
  // 보낸 뒤 — 단추 상태 기억을 비운다. 창을 닫으면 커서 신호도(다시 열린 창이 옛 칸으로 커서를 옮기지 않게, 새 맥락 리뷰)
  function clearLive() { for (const k of Object.keys(lastOff)) delete lastOff[k]; }
  if (WINS) {
    window.floeApp.onWinClosed((kind) => {
      if (winClosing[kind]) { winClosing[kind] = false; return; }   // 내가 닫은 것
      winOpen[kind] = false; winHtml[kind] = ""; focusWant = "";
      if (kind === "quest" && st.qwin) closeQwin();
    });
    window.floeApp.onWinEvent((p) => winEvent(p));
  }
  // 창에서 온 누름 · 바뀜 · 입력 · Esc — 섬의 같은 손잡이(clickAct · bvClick · onChange · onInput)로. 창의 요소 대신 그 요소의 data · 값만 온다
  function winEvent(p) {
    if (!p || typeof p !== "object") return;
    activity();
    const el = { dataset: p.data && typeof p.data === "object" ? p.data : {}, value: p.value, checked: !!p.checked, tagName: p.tag || "BUTTON", classList: { contains: (c) => c === "ghost" && !!p.ghost }, disabled: false, focus() {} };
    if (p.type === "click") { if (p.bv) return bvClick(el); return clickAct(el); }
    if (p.type === "change") return onChange(el);
    if (p.type === "input") { if (st.ui === "home" && timer) { clearIdle(); scheduleIdle(); } return onInput(el); }   // 글을 치는 동안 접히는 시계를 되돌린다(C-46)
    if (p.type === "key" && p.key === "Enter" && p.act === "say") return send();   // 작업실 옆 칸의 채팅 입력에서 Enter(C-41 ⑤) — 섬의 채팅 칸과 같이 보내기
    if (p.type === "key" && p.key === "s" && p.mod) { if (st.qtab === "file") ACT.fsave(); return; }   // 작업실 창의 ⌘/Ctrl+S(C-43)
    if (p.type === "caret") { caretLine = Number(p.line) || 0; return; }
    if (p.type === "toggle") { st.fnAll = !!p.open; return; }   // 작업실 창의 '전체 파일' 접고 펼침(C-63) — 다시 그려도 그대로
    // 글 칸의 줄 위치(C-53 상태 줄) — 다시 그리지 않는다(치는 동안 글 칸이 흔들리지 않게), 다음 그릴 때 보인다
    // 작업실 창에서 움직이거나 누르면(poke — win.js가 1초에 한 번까지, 섬이 펼쳐져 있을 때만) 접히는 시계를 처음부터(임유정 2026-10-28)
    if (p.type === "poke") { if (st.ui === "home" && timer) { clearIdle(); scheduleIdle(); } return; }
    // 옆 칸에 마우스를 올리거나 글을 쓰는 동안은 접히지 않는다(C-46) — 떠나면 접히는 시계를 다시 센다
    if (p.type === "col") { if (typeof p.hover === "boolean") { colHover = p.hover; if (p.hover) clearIdle(); else scheduleIdle(); }   // 들어오면 시계를 멈추고 나가면 다시 센다(접히기 전 표시는 2026-10-29 두승현 결정으로 뺐다)
    if (typeof p.typing === "boolean") { colTyping = p.typing; if (!p.typing) scheduleIdle(); } return; }
    // Esc — 옆 칸이 펼쳐져 있으면 먼저 접고(알약), 접혀 있으면 작업실을 닫는다(C-46, 새 맥락 리뷰 — 접기 단추의 '(Esc)'와 맞춤)
    if (p.type === "key" && p.key === "Escape") { if (p.kind === "quest" && st.qwin && st.settings) return set({ settings: false }); if (deskKeys.Escape && st.ui === "home" && p.kind === "quest") return run(deskKeys.Escape); if (p.kind === "quest" && st.qwin) { if (!colFolded()) return go("petit"); return closeQwin(); } }
  }
  // ── 섬의 움직임(C-14, 2026-10-20 — 규칙 · 숫자는 morph.js) ──
  // 바탕(배경 · 그림자)을 가진 요소 — 섬(.isl) · 한 줄(.pill) · 띠(.strip — 바탕 없음)
  const shapeEl = () => { const el = $nav.querySelector(":scope > .isl, :scope > .wsx .isl") || $nav.querySelector(":scope > :not(.shell):not(.win):not(.wsx)"); return el ? (el.classList.contains("isl") ? el : el.querySelector(".pill, .strip") || el) : null; };
  const opaque = (c) => !!c && c !== "transparent" && !/^rgba\([^)]*,\s*0\)$/.test(c);
  // 갈아 끼우기 전의 상자 — 자리 · 크기 · 바탕색 · 모서리 · 그림자
  function snapShape() {
    const el = shapeEl(); if (!el) return null;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height, bg: cs.backgroundColor, shadow: cs.boxShadow } : null;
  }
  // 모양이 바뀌면(띠 ↔ 한 줄 ↔ 펼침) 바탕 껍데기(.shell)가 처음 상자에서 끝 상자로 늘어나고 줄어든다(FLIP — transform · opacity만, 합성만으로 돈다).
  // 그동안 새 모양의 바탕은 숨기고(.morph-bg) 내용은 바탕이 reveal만큼 자란 뒤 나타난다. 줄어들 때는 움직임이 끝난 뒤 창을 줄인다(morphHold → measureSize).
  // 켤 때 인사 · 잠수 · 떠오름 · 움직임 줄이기 · 휴대폰에서는 하지 않는다(그쪽은 저마다의 움직임이 있다)
  let morphHold = false, morphShell = null;
  function morphFrom(prev) {
    const h = document.documentElement, el = shapeEl();
    if (!MO || !el || !el.animate || STILL || isPhone() || greetSkip || h.classList.contains("greeting") || h.classList.contains("surfacing") || h.classList.contains("diving")) return;
    const to = el.getBoundingClientRect(); if (!to.width || !to.height) return;
    const p = MO.plan({ w: prev.w, h: prev.h }, { w: to.width, h: to.height }, { still: STILL });
    if (!p.ms) return;
    // F-45(2026-10-20): 기준점은 섬의 위 가운데 — 전 상자와 새 상자의 가운데를 맞춘다. 창이 커지고 줄며 섬이 창 안에서 옮겨 가도(가운데 맞춤) 화면에서는 같은 자리라, 잰 x 대신 가운데로 계산한다.
    //   설정 창이 옆에 열린 때(side — 왼쪽 고정)는 잰 그대로. 커질 때는 창을 먼저 키운다(morph.js plan "resize-then-animate" — 전에는 움직임이 먼저 시작돼 한 번 튀었다)
    const from = $nav.classList.contains("side") ? prev : { ...prev, x: to.left + (to.width - prev.w) / 2 };
    if (p.order === "resize-then-animate" && !morphHold) measureSize();
    const f = MO.flip(from, { x: to.left, y: to.top, w: to.width, h: to.height }), cs = getComputedStyle(el), nr = $nav.getBoundingClientRect();
    if (morphShell) morphShell.remove();
    const shell = morphShell = document.createElement("div");
    shell.className = "shell"; shell.setAttribute("aria-hidden", "true");
    const fromOn = opaque(prev.bg), toOn = opaque(cs.backgroundColor);
    shell.style.cssText = `left:${to.left - nr.left}px;top:${to.top - nr.top}px;width:${to.width}px;height:${to.height}px;border-radius:${cs.borderRadius};background:${toOn ? cs.backgroundColor : prev.bg};box-shadow:${toOn ? cs.boxShadow : prev.shadow}`;
    $nav.prepend(shell);
    el.classList.add("morph-bg");
    morphHold = p.order === "animate-then-resize";
    const a = shell.animate([{ transform: `translate(${f.dx}px,${f.dy}px) scale(${f.sx},${f.sy})`, opacity: fromOn ? 1 : 0 }, { transform: "none", opacity: toOn ? 1 : 0 }], { duration: p.ms, easing: p.easing, fill: "both" });
    shell.nextElementSibling?.animate([{ opacity: 0 }, { opacity: 0, offset: p.reveal || 0.5 }, { opacity: 1 }], { duration: p.ms, easing: "ease-out", fill: "both" });
    // 마지막 움직임만 미룸을 푼다(F-38, PR #139 리뷰) — 펼치기가 끝나기 전에 접기를 시작하면 펼치기의 done이 접기의 미룸을 풀어 창이 움직임보다 먼저 줄어들었다
    const done = () => { const last = morphShell === shell; if (last) morphShell = null; shell.remove(); el.classList.remove("morph-bg"); if (last && morphHold) { morphHold = false; lastSize = ""; queueSize(); } };
    a.finished.then(done, done);
  }
  // 접힌 한 줄에 마우스를 올리면 살짝 커진다(세로 +6 · 가로 +24) — 비율은 크기마다 달라 그릴 때 잰다(app.css .pill:hover). 창은 그대로(접힌 창에 여유 — measureSize)
  function peekReady() {
    const pill = $nav.querySelector(".pill");
    if (!pill || !MO) return;
    const { sx, sy } = MO.peekScale(pill.offsetWidth, pill.offsetHeight);
    pill.style.setProperty("--px", sx.toFixed(3)); pill.style.setProperty("--py", sy.toFixed(3));
  }
  let placeFrom = null, paneFrom = null;
  function renderDesk() {
    const moved = st.ui !== lastUi; lastUi = st.ui;
    const enter = moved ? " enter" : "";
    const prev = moved ? snapShape() : null;   // 움직임(C-14): 갈아 끼우기 전의 상자
    const slid = placeFrom !== null && !moved && (placeFrom !== st.place || paneFrom !== st.pane);   // 모드 · 판이 바뀌면 판만 옆으로 밀려 바뀐다(탭 바뀜과 같은 움직임)
    placeFrom = st.place; paneFrom = st.pane;
    deskKeys = {};
    document.documentElement.classList.toggle("ws-away", WINS && !!st.qwin);   // 앱: 작업실이 열린 동안 섬은 작업실 옆 칸에 — 섬 창은 숨기 전 첫 그림부터 보이지 않게(F-101 켤 때 깜박임)
    const put = (h) => { if (window.FloeKeepFrame) window.FloeKeepFrame.put($nav, h); else $nav.innerHTML = h; };   // 문서 지도 iframe은 그대로 — 다시 불러오면 움직임이 처음부터(F-135)
    if (st.ui === "hidden") { $nav.innerHTML = stripHTML(); }
    else if (st.ui === "petit") put(!WINS && st.qwin ? `<div class="wsx">${qwinHTML()}<div class="isl-col side-right narrow folded${st.boot ? " has-bub" : ""}">${pillHTML()}${bootBubble()}</div></div>` : `<div class="${enter.trim()}">${pillHTML()}${bootBubble()}</div>`);   // 브라우저 판(C-55): 켤 때 작업실이 열린 채 알약이면 작업실 판도 함께(앱은 창으로 — syncWins)
    else put(islandHTML(enter));
    $nav.classList.toggle("side", !!$nav.querySelector(":scope > .win, :scope > .wsx"));   // 창(설정 · 퀘스트)이 열리면 섬 옆에 나란히(C-22) — 아래에 열리면 글자를 키웠을 때 바로 안 보였다(6.2.0)
    $nav.classList.toggle("peekroom", !!window.floeApp && (st.ui === "hidden" || st.ui === "petit"));   // 접힌 창의 여유 — 올리면 커질 자리(C-14)
    if (prev) morphFrom(prev);
    peekReady();
    if (slid && !STILL) $nav.querySelector(".isl-body")?.animate([{ opacity: 0, transform: `translateX(${st.place === "vibe" || st.pane ? 36 : -36}px)` }, { opacity: 1, transform: "none" }], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" });
    const ind = $nav.querySelector(".ti-ind"), to = tabIdx();
    if (!ind) return;
    if (tabFrom !== null && tabFrom !== to) tabMove = { from: tabFrom, to, at: performance.now() };
    tabFrom = to;
    const t = tabMove && tabMove.to === to ? performance.now() - tabMove.at : Infinity;
    if (STILL || t > 400 || !ind.animate) { tabMove = null; return; }
    const go = (el, frames, ms, ease) => { if (el) el.animate(frames, { duration: ms, easing: ease }).currentTime = t; };
    const dx = to > tabMove.from ? 36 : -36;
    go(ind, [{ transform: `translateX(${tabMove.from * 42}px) scaleX(1)` }, { transform: `translateX(${(tabMove.from + to) * 21}px) scaleX(1.25)`, offset: 0.4 }, { transform: `translateX(${to * 42}px) scaleX(1)` }], 380, "cubic-bezier(.3,1.25,.5,1)");
    go($nav.querySelector(".isl-body"), [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: "none" }], 340, "cubic-bezier(.2,.8,.2,1)");
    go($nav.querySelector(".tb-tab"), [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], 260, "ease-out");
    go($nav.querySelector(".tabs .ti[aria-selected=true] svg"), [{ transform: "none" }, { transform: "scale(1.22) translateY(-2px)", offset: 0.4 }, { transform: "none" }], 400, "cubic-bezier(.3,1.5,.5,1)");
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
  // 집중 모드(iPhone) — [날짜·제목 + 톱니] · 플로로 한마디 · 진행 카드 · 지금 결정할 것 하나. 나머지는 접힌 카드 하나에
  const phoneHead = (kicker, title) => `<div class="ph-top"><div class="ph-date">${esc(kicker)}</div>${gearBtn()}</div><h1 class="ph-title">${esc(title)}</h1>${settingsCard()}`;
  function phoneToday() {
    let h = phoneHead(today(), "오늘의 길잡이") + sayRow(72);
    if (!st.j) return h + box("시작하기", "지금 만들고 있는 걸 보여 주세요", "무엇을 만들고 있고, 어디까지 했는지 편하게 적어 주세요. 연습용 예시 버튼을 눌러 봐도 돼요.", inputBox());
    const s = stage();
    return h + `<div class="card"><div class="proj">${ring()}<div><div class="meta">${esc(project())}</div><div class="big" style="font-size:18px">${LB(s.n)} · ${esc(s.title)}</div></div></div>
      ${seg()}<span class="meta">전체 8단계 중 ${s.n + 1}번째 단계예요</span></div>${notes()}${focusCard()}<div class="card">${more()}</div>`;
  }
  const phoneMap = () => phoneHead("전체 8단계", "단계 지도") + mapBody();
  function phoneCheck() {
    const s = stage(), [body, actions] = checkStep();
    return `<button class="back" data-act="close-gate">${I.back}오늘</button>
      <div class="ph-head">${cat(face()[0], 64)}<div><div class="t">${LB(s.n)}를 다 했어요!</div><div class="meta">넘어가기 전에 함께 확인해요${st.mode === "fixture" ? " · 연습용 예시" : ""}</div></div></div>
      ${chips()}<div class="card"><span class="label">이번 단계에서 이렇게 했어요</span>${flow()}${critList(false)}</div>
      ${body ? `<div class="card">${body}</div>` : ""}<div class="bottom glass">${actions}</div>`;
  }
  function renderPhone() {
    const gate = st.screen === "gate";
    $phone.className = "phone" + (gate ? " check" : "");
    const views = { today: phoneToday, map: phoneMap }, tab = views[st.tab] ? st.tab : "today";   // 한곳에서 보기·도서관 · 단계 문서는 PC에서만(C-16)
    $phone.innerHTML = gate ? phoneCheck() : views[tab]() +
      `<nav class="tabbar glass" aria-label="화면">${PHONE_TABS.map(([id, , label, ic], i) => `<button class="tab" data-act="tab" data-i="${i}" data-tab="${id}" ${tab === id ? 'aria-current="page"' : ""}>${I[ic]}${label}</button>`).join("")}</nav>`;
  }

  // ── 리퀴드 글래스 굴절 (PC, 크롬 계열만) ──
  // 유리 가장자리에서 뒤 화면이 휘어 보이게 한다: 유리 크기에 맞춘 '밀어낼 방향 지도'(R=가로, G=세로, 128이 제자리)를 그려
  // SVG 필터(feDisplacementMap)에 넣고 app.css가 backdrop-filter로 건다. 다른 브라우저는 이 필터를 무시하거나 유리째 지워서 크롬 계열만 켠다.
  // 투명도 줄이기를 켠 사람에게는 켜지 않는다(app.css가 불투명한 판으로 바꾼다).
  // Electron 앱의 투명 창에서는 끈다 — 뒤가 페이지가 아니라 다른 창이라 굴절할 것이 없고, 필터만 무거워 랙이 심했다(2026-10-19 이재엽 보고)
  const REFRACT = !!navigator.userAgentData?.brands?.some((b) => b.brand === "Chromium") && !matchMedia("(prefers-reduced-transparency: reduce)").matches && !window.floeApp;
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
  $nav.addEventListener("toggle", (e) => { if (e.target && e.target.classList && e.target.classList.contains("fn-all")) st.fnAll = !!e.target.open; }, true);   // 브라우저 판의 '전체 파일'(C-63)

  // 설계도 글 칸은 글 길이만큼 늘어난다 — 확정한 뒤 보기(pre)와 같은 크기로. 섬 전체가 화면 높이를 넘으면 섬 안에서 스크롤 (2026-10-18 임유정 요청)
  function grow(t) { const y = t.closest(".isl")?.scrollTop; t.style.height = "auto"; t.style.height = `${t.scrollHeight + 2}px`; if (y !== undefined) t.closest(".isl").scrollTop = y; }
  // 선택지를 누르고 → 살펴보는 중 → 결과까지는 한 흐름이라 섬 크기를 그대로 둔다. 결과가 나오면 새 크기로 한 번만 부드럽게 바뀐다
  // (2026-10-18 임유정 요청: 이어지는 과정에서 크기가 계속 바뀌어 정신없음)
  let holdH = 0;
  const hold = () => { const el = $nav.querySelector(".isl"); if (el && !holdH) holdH = el.offsetHeight; };
  function holdSize() {
    const el = $nav.querySelector(".isl");
    if (!holdH || !el) return;
    // holding: 붙든 높이에서 칩이 빠진 만큼을 채팅 칸이 채운다 — 입력 칸 아래가 비어 보였다(임유정 2026-10-22, app.css .isl.holding)
    if (st.busy) { el.style.minHeight = `${holdH}px`; el.classList.add("holding"); return; }
    const from = holdH, to = el.offsetHeight; holdH = 0;
    // 앱 안에서는 높이 애니메이션을 하지 않는다 — 창은 바로 새 크기가 되는데 섬만 늦게 커져 "따라오는 게 버벅"으로 보였다(6.2.0)
    if (!STILL && !window.floeApp && Math.abs(to - from) > 4) el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  // 다시 그려도 쓰던 글 칸은 그대로 — 커서 자리와 스크롤까지 되돌린다
  // F-46(2026-10-20): 지금 모습을 html에 적어 둔다 — 띠로 접혀 있거나 창이 안 보일 때 물범의 무한 움직임을 멈춘다(app.css [data-ui="hidden"] · .page-hidden)
  document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("page-hidden", document.hidden));
  // F-144-13(2026-11-03): 한글을 조합하는 동안 친 글자로 다시 그리면(파일 이름 찾기 · 문서 안 찾기 · 파일 고치기) 칸이 새로 생겨 조합이 낱자로 쪼개졌다 —
  //   조합 중의 입력이 부른 그리기는 미루고 조합이 끝나면 한 번(작업실 창 win.js와 같은 뜻, F-103-18)
  //   새 맥락 리뷰: 입력이 부른 그리기만이 아니라 조합하는 동안의 모든 그리기(1초 타이머 · say의 다음 그리기)를 — 섬의 글 칸에 커서가 있을 때만
  let imeOn = false, imeSkipped = false;
  function render() {
    const ae = document.activeElement;
    if (imeOn && isField(ae) && ($nav.contains(ae) || $phone.contains(ae))) { imeSkipped = true; return; }
    document.documentElement.dataset.ui = st.ui;
    save();
    if (!timer) scheduleIdle();
    // 같은 이름의 칸이 여럿이면(계획판의 줄마다 의견 · 물을 것마다 답 — 2026-10-24 리뷰) data-id · data-i까지 맞춰 그 칸으로 돌아간다
    //   data-k(퀘스트 줄) · data-v(기준 카드의 빈칸 · 열린 파일)도 — 빼면 두 번째 칸을 쓰다가 다시 그려지면 첫 칸으로 튀었다(F-144-9)
    const a = document.activeElement, keep = isField(a) && a.dataset.act ? `[data-act="${a.dataset.act}"]${a.dataset.id ? `[data-id="${CSS.escape(a.dataset.id)}"]` : ""}${["i", "k", "v"].map((d) => (a.dataset[d] !== undefined ? `[data-${d}="${CSS.escape(a.dataset[d])}"]` : "")).join("")}` : "";
    const sel = keep ? [a.selectionStart, a.selectionEnd, a.scrollTop] : null;
    // 채팅 칸의 스크롤 — 다시 그리면 칸이 새로 생겨 맨 위로 간다. 1초마다 바뀌는 '살펴보고 있어요 16초' 때문에 올려 둔 스크롤이 계속 아래로 끌려갔다(임유정 2026-10-22)
    const og = $nav.querySelector("[data-log]");
    const logWas = og ? { top: og.scrollTop } : null;
    // 브라우저 판의 작업실 몸통(.qwin .wbody)도 같은 화면(data-view)이면 스크롤을 되돌린다 — 앱 창은 win.js가 하지만 브라우저 판은 아무도 안 해서, 마우스가 섬에 들어오기만 해도(mouseenter → render)
    //   받기 화면이 맨 위로 튀어 아래의 '고쳐 주세요'를 누를 수 없었다(e2e C-22 · C-36이 #212부터 깨져 있던 까닭, 2026-10-27) — claude-drafted: 2026-10-27
    const ob = $nav.querySelector(".qwin .wbody"), bodyWas = ob ? { view: ob.dataset.view, top: ob.scrollTop } : null;
    const fvWas = fvScroll($nav.querySelector(".qwin .fv"));   // 파일 보기 안의 스크롤도(같은 파일 · 같은 보기일 때) — 다시 그리면 1줄로 돌아갔다(임유정 2026-10-28)
    const sideWas = WS_PANES.map((c) => { const e = $nav.querySelector(`.qwin ${c}`); return e ? e.scrollTop : null; });   // 파일 칸 · 오른쪽 칸 — 아래쪽 목차를 누르면 칸이 맨 위로 올라갔다(임유정 2026-10-28)
    if (isPhone()) renderPhone(); else { renderDesk(); holdSize(); fitGacha(); }
    const nb = bodyWas && $nav.querySelector(".qwin .wbody"); if (nb && nb.dataset.view === bodyWas.view) nb.scrollTop = bodyWas.top;
    fvScroll($nav.querySelector(".qwin .fv"), fvWas);
    WS_PANES.forEach((c, j) => { const e = $nav.querySelector(`.qwin ${c}`); if (e && sideWas[j] != null) e.scrollTop = sideWas[j]; });
    const go = $nav.querySelector(".qwin [data-go]"); if (go && go.dataset.go !== goShown) { goShown = go.dataset.go; const p = go.closest(".fv-code"); if (p) p.scrollTop = go.offsetTop - (p.clientHeight - go.offsetHeight) / 2; }   // 목차로 고른 제목 줄로 한 번만(ftoc-go) — 다음 그리기에서 다시 끌어가지 않게. 글 칸만 옮긴다(scrollIntoView는 바깥 칸 · 페이지까지 움직였다 — 새 맥락 리뷰)
    if (keep) {
      const b = document.querySelector(keep);
      if (b && b !== a) { b.focus(); try { b.setSelectionRange(sel[0], sel[1]); } catch {} b.scrollTop = sel[2]; }
    }
    if (point) C.follow(isPhone() ? $phone : $nav, point);
    for (const t of document.querySelectorAll("textarea.doc")) grow(t);
    // 채팅은 마지막 말이 보이게(C-22) — 단, 맨 아래를 따라가는 중(logPin)이거나 새 말이 왔을 때만. 위로 올려 읽는 중이면 그 자리 그대로
    const lg = $nav.querySelector("[data-log]");
    if (lg && chatSeq !== shownSeq) logPin = true;
    if (lg && !logWas) { lg.scrollTop = lg.scrollHeight; logTop.set(lg, lg.scrollTop); }
    else if (lg) { lg.scrollTop = logWas.top; logTop.set(lg, lg.scrollTop); if (logPin) lg.scrollTo({ top: lg.scrollHeight, behavior: STILL ? "auto" : "smooth" }); }
    shownSeq = chatSeq;
    goStage($nav);   // C-63 — 대화 목록의 바로가기를 눌렀으면 그 단계 구분선으로
    if (logRO) { logRO.disconnect(); if (lg) { logRO.observe(lg); if (lg.lastElementChild) logRO.observe(lg.lastElementChild); } }
    syncWins();
    if (window.FloeCoach) window.FloeCoach.sync();   // 브라우저 판의 첫 사용 안내(앱은 win.js)
    refract();
    reportSize();
  }
  // Electron 앱(2026-10-19): 지금 보이는 것(띠 · 한 줄 · 펼침 · 옆의 설정 창까지)의 크기를 앱에 알려 창을 딱 맞춘다 — 투명한 빈 영역이 뒤 창의 클릭을 가로채지 않게.
  // 6.2.0: 시간을 정해 두 번 재는 대신 ResizeObserver가 크기가 바뀔 때마다(글 칸이 늘어나거나 글자 크기를 바꿀 때) 한 프레임에 한 번만 보낸다 — 같은 크기면 보내지 않는다.
  // 설정 창이 옆에 열려 있거나 막 닫혔으면 왼쪽을 고정(anchor "left")해 섬이 제자리에 있고 창만 오른쪽으로 넓어진다
  let sizeRaf = 0, lastSize = "", sideWas = false, sizeObs = null;
  function measureSize() {
    sizeRaf = 0;
    if (!window.floeApp || isPhone()) return;
    // 처음 설정(setup.js)이 떠 있으면 섬이 아니라 그 창을 담도록 넓힌다 — 섬 크기 창(391×60)에 끼어 보였다(두승현 2026-10-19 "설정 창이 매우 작게", KAN-57)
    if (document.getElementById("floe-setup")) { if (lastSize !== "setup") { lastSize = "setup"; window.floeApp.expand(); } return; }
    const h = document.documentElement;
    if (h.classList.contains("diving") || h.classList.contains("surfacing")) return;   // 창은 서고 크기(넓힘) · 섬 크기(돌아옴)로 앱이 먼저 맞춰 둔다
    if (h.classList.contains("island-drag")) return;   // 끄는 동안은 앱이 자리를 정한다(C-74) — 놓으면 다시 잰다
    if (morphHold) return;   // 줄어드는 움직임이 끝난 뒤 창을 줄인다(C-14 — 움직이는 동안 창을 바꾸면 F-24의 버벅임이 돌아온다)
    let r = 0, b = 0;
    for (const el of $nav.children) { if (el.classList.contains("shell")) continue; const q = el.getBoundingClientRect(); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
    if (!r || !b) return;
    if ($nav.classList.contains("peekroom") && MO) { r += MO.RESERVE.w / 2; b += MO.RESERVE.h; }   // 접힌 창의 여유 — 올리면 커질 자리(왼쪽 여유는 .nav.peekroom의 padding)
    const side = $nav.classList.contains("side"), anchor = side || sideWas ? "left" : "center";
    sideWas = side;
    const key = `${Math.ceil(r)}x${Math.ceil(b)}:${anchor}`;
    if (key === lastSize) return;
    lastSize = key;
    window.floeApp.resize(r, b, anchor, $nav.classList.contains("peekroom") ? ($nav.querySelector(".pill, .strip") || {}).offsetWidth || 0 : 0);
  }
  const queueSize = () => { if (!sizeRaf) sizeRaf = requestAnimationFrame(measureSize); };
  function reportSize() {
    if (!window.floeApp || isPhone()) return;
    if (!sizeObs && "ResizeObserver" in window) sizeObs = new ResizeObserver(queueSize);
    if (sizeObs) { sizeObs.disconnect(); for (const el of $nav.children) sizeObs.observe(el); }   // 다시 그릴 때마다 새 자식을 본다
    queueSize(); setTimeout(queueSize, 300);   // 300ms 뒤 한 번 더 — 글꼴 · 그림이 늦게 오는 경우
  }
  // 처음 설정이 뜨거나 닫히면('나중에 할게요' · Esc 포함) 다시 잰다 — 닫히면 섬 크기로 돌아온다(KAN-57)
  document.addEventListener("floe:setup-open", queueSize);
  // 알약을 끌어 옮긴다(C-74, 2026-11-05 두승현 "상단 고정이 아니라 유저가 위치를 이동"). 4px 넘게 움직여야 끌기 — 그 전에 떼면 그대로 누름. 띠(대기 플로로)는 알약과 같은 창이라 같이 옮겨진다
  if (window.floeApp && window.floeApp.dragIsland) {
    const root = document.documentElement;
    let press = null, eatClick = false;
    $nav.addEventListener("pointerdown", (e) => {
      eatClick = false;
      const t = e.button === 0 && !root.classList.contains("notch") && e.target.closest(".pill, .strip");
      press = t ? { x: e.screenX, y: e.screenY } : null;
      if (t) window.floeApp.dragIsland("start", t.offsetWidth);   // 누른 순간의 자리를 앱이 기억한다 — 움직인 뒤에 재면 알약이 커서보다 밀린다
    });
    const drop = () => {
      press = null;
      if (!root.classList.contains("island-drag")) return;
      root.classList.remove("island-drag"); window.floeApp.dragIsland("end"); eatClick = true; lastSize = ""; queueSize();
    };
    document.addEventListener("pointermove", (e) => {
      if (!press) return;
      if (!(e.buttons & 1)) return drop();   // 뗀 신호를 놓쳤다(창 밖에서 뗌 등) — 안 누른 커서를 알약이 따라오지 않게
      if (!root.classList.contains("island-drag")) {
        if (Math.hypot(e.screenX - press.x, e.screenY - press.y) < 4) return;
        root.classList.add("island-drag");
      }
      window.floeApp.dragIsland("move");
    });
    document.addEventListener("pointerup", drop); document.addEventListener("pointercancel", drop);
    document.addEventListener("click", (e) => { if (eatClick) { eatClick = false; e.stopPropagation(); e.preventDefault(); } }, true);   // 끈 뒤의 누름이 작업실을 열지 않게
  }
  document.addEventListener("floe:setup-done", queueSize);
  PHONE.addEventListener("change", render);

  // ── 플로로와 교감 ──
  // 기분 바꾸기 — 다시 그리지 않고 그림의 class만 바꾼다(쓰다듬는 중에 그림이 사라지지 않게)
  function applyMood() {
    document.body.classList.toggle("dozing", sleepState === "sleep");   // 띠만 보일 때도 귀 옆에 z가 뜬다
    for (const b of document.querySelectorAll("[data-live]")) {
      const svg = b.querySelector("svg.cat");
      if (!svg) continue;
      const m = liveMood(b.dataset.base), moved = moodIn(m, svg.getAttribute("width"));
      svg.setAttribute("class", `${svg.getAttribute("class").replace(/\s*(mood-in|from-[a-z]+)/g, "").replace(/\bm-[a-z]+/, `m-${m}`)}${moved ? ` ${moved}` : ""}`);
    }
  }
  function flash(mood, ms) { flashMood = { mood, until: Date.now() + ms }; applyMood(); setTimeout(applyMood, ms + 30); }
  const liveCat = () => (isPhone() ? $phone : $nav).querySelector("[data-live]");
  // 플로로의 한마디 — 2026-10-25(두승현): 머리 위에 떴다 사라지던 말풍선(.pop-say)을 뺐다. 안내 · 오류는 섬의 대화 기록에 플로로의 말로 남긴다
  //   (실패를 숨기지 않는다 — security-records.md 6-1). 쓰다듬기 · 졸기 · 축하 같은 꾸밈 말은 부르지 않는다. ponytail: 휴대폰 화면은 대화 기록이 없어 보이지 않는다(PC 먼저)
  function say(text) { if (!text) return; logMsg("floro", esc(endDot(text))); saidSince += 1; requestAnimationFrame(render); }
  // 플로로 대화 답(줄바꿈이 있는 글) — esc한 뒤 줄바꿈만 <br>로(F-144-23: 번호 목록 답이 한 줄로 붙었다). 그 밖은 say와 같다
  function sayLines(text) { if (!text) return; logMsg("floro", esc(endDot(text)).split("\n").join("<br>")); saidSince += 1; requestAnimationFrame(render); }
  // 한 번 하는 움직임(seal.css · app.css). 끝나면 떼어 낸다 — 헤엄의 물방울처럼 붙어 있는 동안 계속 보이는 것이 있어서
  const playOn = (host, cls) => {
    if (STILL || !host) return;
    host.classList.remove("squish", "purring", "hop", "swim"); void host.offsetWidth; host.classList.add(cls);
    setTimeout(() => host.classList.remove(cls), 3600);
  };
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
      if (host && !STILL) C.burst(...center(host), "star", 14, 360);
      setTimeout(render, 1800);   // 위쪽 줄의 하트를 새로
    }
  }
  // 축하 — 할 일을 다 했을 때, 단계를 넘어갔을 때, 설계도를 확정했을 때
  const CHEER = { done: "와, 할 일을 다 했어요!", doc: "문서 확정! 멋져요", finish: "끝까지 왔어요! 정말 멋져요" };
  function celebrate(kind) {
    requestAnimationFrame(() => {
      const host = liveCat();
      flash("happy", 1800);
      if (STILL || !host) return;
      const big = kind === "stage" || kind === "finish";
      C.burst(...center(host), "star", big ? 16 : 10, big ? 360 : 160);
      if (big) C.burst(...center(host), "bubble", 6, 220);
      playOn(host, "hop");
    });
  }

  // 눈은 마우스를 따라온다. 글 칸에 들어가면 글 칸을 본다. 깜빡임은 들쭉날쭉하게
  let point = null, raf = 0, target = null;
  if (!STILL) {
    document.addEventListener("mousemove", (e) => {
      point = { x: e.clientX, y: e.clientY }; target = null;   // 창 안이면 바로 — 미끄러지던 것은 멈춘다
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0; activity(); C.follow(isPhone() ? $phone : $nav, point);
      });
    });
    // 앱(Electron) 안이면 창 밖의 커서도 — 창이 섬 크기라 커서는 거의 늘 창 밖이다(2026-10-19). 눈만 따라오고, 졸음을 깨우지는 않는다(activity는 이 창을 쓸 때만).
    // 앱은 1초에 30번만 보내 주니 받은 점으로 바로 뛰지 않고 프레임마다 미끄러져 간다(C.glide — F-27, 창 안의 mousemove는 위처럼 바로)
    if (window.floeApp && window.floeApp.onCursor) {
      let glideRaf = 0, last = 0;
      const step = (now) => {
        glideRaf = 0;
        if (!target) return;
        const g = C.glide(point, target, now - last); last = now;
        point = { x: g.x, y: g.y }; C.follow(isPhone() ? $phone : $nav, point);
        if (g.done) target = null; else glideRaf = requestAnimationFrame(step);
      };
      window.floeApp.onCursor((p) => { target = p; if (!glideRaf) { last = performance.now(); glideRaf = requestAnimationFrame(step); } });
    }
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
  // 채팅의 따라가기(logPin, F-58-3) — 맨 아래에 닿으면 다시 따라가고, 위로 올라가면 멈춘다.
  //   앱이 내리는 스크롤(부드러운 내려가기 · 다시 그린 칸의 자리 되돌리기 · 커진 뒤 붙이기)은 늘 아래로만 가므로, 위로 가는 스크롤은 사람이 한 것이다 —
  //   휠 · 터치 · 스크롤바 · 키보드 무엇으로 올려도 같다. 전에는 휠 · 터치 · 스크롤바만 봐서 키보드로 올리면 다시 끌려 내려갔다(새 맥락 리뷰, 2026-10-25) — claude-drafted: 2026-10-25
  $nav.addEventListener("scroll", (e) => {
    const l = e.target;
    if (!(l instanceof Element) || !l.matches("[data-log]")) return;
    const was = logTop.get(l); logTop.set(l, l.scrollTop);
    if (l.scrollHeight - l.scrollTop - l.clientHeight < 2) logPin = true;
    else if (was !== undefined && l.scrollTop < was - 1) logPin = false;
  }, true);
  // 좌우로 문지르면 쓰다듬은 것 (seal.js의 stroke가 센다)
  let strokeState = null;
  $nav.addEventListener("pointermove", (e) => {
    if (!e.target.closest("[data-pet]")) { strokeState = null; return; }
    strokeState = C.stroke(strokeState, e.clientX, e.timeStamp);
    if (strokeState.petted) pet("stroke");
  });
  function lookAround() {
    const host = liveCat();
    if (!host) return;
    const [x, y] = center(host, 0.4);
    [[-400, -40], [400, -40], [0, 0]].forEach(([dx, dy], i) => setTimeout(() => { if (!looked) return; C.follow(host, { x: x + dx, y: y + dy }); }, i * 900));
  }
  // 가만히 두면 졸다가 잠든다. 움직이면 깬다
  let lastActive = Date.now(), swam = false, looked = false;
  function activity() {
    lastActive = Date.now();
    swam = false; looked = false;
    if (sleepState === "awake") return;
    const was = sleepState;
    sleepState = "awake";
    if (was === "sleep") { flash("wow", 900); } else applyMood();
  }
  setInterval(() => {
    if (isPhone() || st.busy) return;
    if (working()) activity();   // F-154 일하는 동안은 졸거나 헤엄치지 않는다
    // 20초쯤 가만히 있으면 졸기 전에 숨구멍에서 한 바퀴 헤엄친다(쉴 때마다 한 번)
    if (!swam && sleepState === "awake" && Date.now() - lastActive >= 20_000) { swam = true; playOn(liveCat(), "swim"); }
    // 8초쯤 가만히 있으면 두리번 — 왼쪽 → 오른쪽 → 앞(쉴 때마다 한 번). 마우스를 움직이면 눈이 다시 마우스를 따라간다
    if (!looked && !STILL && sleepState === "awake" && Date.now() - lastActive >= 8_000) { looked = true; lookAround(); }
    const s = C.sleepy(Date.now() - lastActive);
    if (s === sleepState) return;
    sleepState = s;
    applyMood();
  }, 3000);

