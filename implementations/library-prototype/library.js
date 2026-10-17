// claude-drafted: 2026-10-17 — 도서관 시안의 동작. 저장·서버·AI 호출 없음 — 더미 데이터(books.js)를 화면 안에서만 바꾼다.
// 장면: ① 입구(큰 책) → 시안 고르기 → ② 작업 화면 위 오버레이의 도서관 위젯 → ③ 플로로의 얼음 서고 → 펼친 책.
(function () {
  const D = window.LibData, Seal = window.NavSeal;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const seal = (mood, size, opts) => (Seal ? Seal.svg(mood, size, opts) : "");

  // 화면 안에서만 바뀌는 상태 (새로 고침하면 처음으로)
  const st = { open: D.OPEN.map((b) => ({ ...b })), shelved: [], tab: "lib", sel: null, confirm: false, answer: null, reading: null, proj: "s1", mapSel: null };

  // ── 배경 별 ──
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  $("sky").innerHTML = Array.from({ length: 110 }, () => `<i style="left:${rnd() * 100}%;top:${rnd() * 80}%;opacity:${(rnd() * .6 + .2).toFixed(2)};transform:scale(${(rnd() * 1.2 + .4).toFixed(2)})"></i>`).join("");

  // ── 장면 전환 ──
  const CAPTIONS = {
    hall: "큰 책을 누르면 도서관 시안 두 가지가 펼쳐져요",
    pick: "시안 ① 오버레이의 작은 도서관 · 시안 ② 나만의 서고",
    desk: "오버레이의 도서관 — 열어 둔 책 4권 중 하나를 골라요",
    deskOpen: "펼쳐 보고 덮거나, 세션을 덮어 서고에 꽂아요",
    lib: "내 서고 — 같은 배움을 쓴 책끼리 별자리처럼 이어져요",
    read: "책을 펼치면 단계마다 정한 것 · 배운 것이 그대로",
    ask: "기억 안 날 땐 플로로에게 — 찾은 책을 바로 펼쳐요",
    search: "서고에서 찾기 — 끝낸 책 · 열어 둔 책 · 레퍼런스를 한 번에",
    now: "단계를 마치면 플로로가 도장을 쾅 찍어 줘요",
    map: "단계 지도 — 0단계부터 7단계 돌아보기까지 지나온 길",
    bind: "끝낸 프로젝트는 한 권의 책으로 엮여요",
    cover: "서고에 꽂힌 책 — 표지를 넘기면 단계마다 정한 것이 그대로",
    review: "전체 돌아보기 — 끝낸 책과 열어 둔 책을 한눈에",
  };
  const ORDER = ["hall", "pick", "now", "map", "bind", "desk", "deskOpen", "lib", "cover", "read", "ask", "search", "review"];
  function caption(key) { $("caption").innerHTML = `<b>${ORDER.indexOf(key) + 1}</b>${CAPTIONS[key]}`; }
  function show(screen) { for (const s of ["hall", "desk", "lib"]) $(`s-${s}`).classList.toggle("on", s === screen); }
  function setHash(h) { history.replaceState(null, "", `#${h}`); }

  function go(where, arg) {
    $("spread").classList.remove("on"); $("reader").classList.remove("on"); $("review")?.classList.remove("on");
    if (where === "hall") { show("hall"); caption("hall"); setHash("hall"); $("tome").focus(); return; }
    if (where === "pick") { show("hall"); $("spread").classList.add("on"); caption("pick"); setHash("pick"); $("spread").querySelector(".go").focus(); return; }
    if (where === "desk") { show("desk"); st.tab = "lib"; st.sel = arg || null; st.confirm = false; renderDesk(); setHash(arg ? `desk-${arg}` : "desk"); return; }
    if (where === "now" || where === "map") { show("desk"); st.tab = where; if (arg) st.proj = arg; st.mapSel = null; renderDesk(); setHash(`desk-${where}${arg ? `-${arg}` : ""}`); return; }
    if (where === "lib") { show("lib"); spot.clear(); spot.close(); st.answer = arg === "ask" ? D.ASK[0] : null; renderLib(); setHash(arg === "ask" ? "lib-ask" : "lib"); return; }
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); });
  $("tome").onclick = () => go("pick");
  $("spread").addEventListener("click", (e) => { if (e.target === $("spread")) go("hall"); });

  // ── ① 입구 ──
  $("hall-seal").innerHTML = seal("happy", 150);
  $("mini-a").innerHTML = `<div style="display:flex;gap:8px">${D.OPEN.map((b) => `<span style="width:44px;height:60px;border-radius:3px 6px 6px 3px;background:${b.tone};box-shadow:inset 3px 0 0 rgba(0,0,0,.18)"></span>`).join("")}</div>`;
  $("mini-b").innerHTML = `<div style="display:flex;align-items:flex-end;gap:22px">${[0, 1].map(() => `<div style="display:flex;gap:3px;align-items:flex-end;border-bottom:5px solid #cdd8f5;padding:0 4px">${[46, 38, 52, 30, 44].map((h) => `<i style="width:7px;height:${h}px;background:#7d9df0;border-radius:1px"></i>`).join("")}</div>`).join(`<div>${seal("idle", 64)}</div>`)}</div>`;

  // ── ② 오버레이 위젯 ──
  const ICONS = {
    now: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/></svg>',
    map: '<svg viewBox="0 0 24 24"><path d="M4 18h3V11H4zM10.5 18h3V6h-3zM17 18h3V13h-3z"/></svg>',
    lib: '<svg viewBox="0 0 24 24"><path d="M3.5 6.5C6 5.5 9 5.5 12 7c3-1.5 6-1.5 8.5-.5V18c-2.5-1-5.5-1-8.5.5-3-1.5-6-1.5-8.5-.5z"/><path d="M12 7v11.5"/></svg>',
  };
  const TABS = [["now", "지금"], ["doc", "설계도"], ["map", "단계 지도"], ["lib", "도서관"]];
  function renderTabs() {
    $("tabs").innerHTML = TABS.map(([id, name]) => `<button role="tab" aria-selected="${st.tab === id}" aria-label="${name}" title="${name}" data-tab="${id}">${ICONS[id]}</button>`).join("");
    $("tab-name").textContent = TABS.find((t) => t[0] === st.tab)[1];
  }
  $("tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (!b) return; st.tab = b.dataset.tab; st.sel = null; st.confirm = false; renderDesk(); });

  function renderDesk() {
    renderTabs();
    const ob = $("ob");
    if (st.tab === "now") return renderNow(ob);
    if (st.tab === "map") return renderMap(ob);
    if (st.tab !== "lib") {
      ob.innerHTML = `<div class="ob-body"><div class="who">${seal("look", 110, { hole: true })}</div><div>
        <div class="ob-say">설계도</div><p class="ob-title">설계도는 내비게이터 프로토타입에 있어요</p>
        <button class="pillbtn pri" data-tab-go="map">단계 지도 보기</button></div></div>`;
      ob.querySelector("[data-tab-go]").onclick = () => { st.tab = "map"; renderDesk(); };
      caption("desk"); return;
    }
    const book = st.open.find((b) => b.id === st.sel);
    if (!book) { renderShelf4(ob); caption("desk"); return; }
    caption("deskOpen");
    ob.innerHTML = `<div class="minispread" aria-label="${esc(book.title)} 펼침">
        <section><div class="stg">지금 ${book.stage}단계 · ${D.STAGES[book.stage]}</div><h3>${esc(book.title)}</h3>
          <div class="ob-say" style="color:#5b6789">이 세션에서 정한 것</div><ul>${book.decided.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></section>
        <section><div class="stg">꽂은 책갈피 ${book.bookmarks.length}장</div><h3>배운 것</h3>
          <div class="marks">${book.bookmarks.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
          <div class="ob-say" style="color:#5b6789;margin-top:12px">마지막으로 연 때 · ${esc(book.updated)}</div></section>
      </div>
      ${st.confirm ? `<div class="confirm" role="alertdialog" aria-label="세션 덮기 확인">${seal("think", 34)}<span><b>‘${esc(book.title)}’</b> 세션을 덮고 서고에 꽂을까요? 언제든 다시 펼칠 수 있어요.</span><span style="flex:1"></span>
          <button class="pillbtn pri" id="do-shelve">덮고 꽂기<span class="kbd">Enter</span></button><button class="pillbtn" id="no-shelve">그대로 두기</button></div>`
        : `<div class="ob-foot"><button class="pillbtn" id="close-book">책 덮기<span class="kbd">Esc</span></button>
          <button class="pillbtn pri" id="ask-shelve">세션 덮기</button><span class="grow"></span><span class="note">책 덮기는 목록으로 · 세션 덮기는 서고로</span></div>`}`;
    if (st.confirm) { $("do-shelve").onclick = shelve; $("no-shelve").onclick = () => { st.confirm = false; renderDesk(); $("ask-shelve").focus(); }; $("do-shelve").focus(); }
    else { $("close-book").onclick = closeBook; $("ask-shelve").onclick = () => { st.confirm = true; renderDesk(); }; }
  }
  // ── 지금 · 단계 지도 — 영상 1~4번 장면 (단계를 마치면 도장, 0단계부터 7단계 돌아보기, 끝나면 한 권의 책으로) ──
  const proj = () => st.open.find((b) => b.id === st.proj) || st.open[0];
  const pills = () => `<div class="pills" role="group" aria-label="프로젝트 고르기">${st.open.map((b) => `<button class="pillbtn${b.id === proj()?.id ? " pri" : ""}" data-proj="${b.id}">${esc(b.title)}</button>`).join("")}</div>`;
  const wirePills = (ob) => ob.querySelectorAll("[data-proj]").forEach((b) => (b.onclick = () => { st.proj = b.dataset.proj; st.mapSel = null; setHash(`desk-${st.tab}-${st.proj}`); renderDesk(); }));
  const dayOf = (date) => Math.round((Date.parse("2026-10-17") - Date.parse(date)) / 864e5) + 1;
  const S = window.Schedule;
  const doneCount = (p) => p.todos.filter((t) => t.done).length;
  // 마감 칩 — 지남(금 간 얼음) · 오늘 · 3일 이내 · 여유
  const dueChip = (due) => { const d = S.dueStatus(due, D.TODAY); return `<span class="due ${d.state}">${d.state === "late" ? "❄ " : ""}${due.slice(5).replace("-", "/")} · ${d.label}</span>`; };
  const pinLine = (p) => {
    const pins = S.pinsFrom(D.TEAM_PINS, D.TODAY), clash = S.pinClashes(p.dues, D.TEAM_PINS).filter((c) => c.stage >= p.stage && p.stage < 7);
    return `<div class="pins">${pins.map((x) => `<span class="pin">📌 ${x.date.slice(5).replace("-", "/")} 팀 ${esc(x.label)} · ${x.days}일 남음</span>`).join("")}
      ${clash.length ? `<span class="pin warn">⚠ ${clash.map((c) => `${c.stage}단계`).join(" · ")} 마감이 ${esc(clash[0].pin)}(${clash[0].pinDate.slice(5).replace("-", "/")}) 뒤예요</span>` : ""}</div>`;
  };
  function renderNow(ob) {
    const p = proj();
    if (!p) { ob.innerHTML = `<div class="ob-body"><div class="who">${seal("sleep", 110, { hole: true })}</div><div><p class="ob-title">열어 둔 프로젝트가 없어요</p><button class="pillbtn pri" data-go="lib">서고 가기</button></div></div>`; caption("now"); return; }
    if (p.stage === 7 && doneCount(p) === p.todos.length) {
      caption("bind");
      ob.innerHTML = `${pills()}<div class="ob-body now"><div class="who">${seal("happy", 110, { hole: true })}</div><div>
          <div class="ob-say">돌아보기까지 끝 · ${dayOf(p.started)}일 동안 8단계 · 마감 ${p.dues[7].slice(5).replace("-", "/")}에 맞춰 완주 · 책갈피 ${p.bookmarks.length}장</div>
          <p class="ob-title">${esc(p.title)},<br>한 권의 책으로 엮을까요?</p>
          <p class="ob-sub">단계마다 정한 것 · 배운 것 · 만든 것이 한 권에 담겨 도서관에 꽂혀요.</p>
          <div class="ob-foot" style="margin-top:8px"><button class="pillbtn pri" id="bind">📖 도서관에 꽂으러 가기<span class="kbd">Enter</span></button><button class="pillbtn" data-tab-go="map">단계 지도로 돌아보기</button></div>
        </div><div class="papers" id="papers" aria-hidden="true">${p.steps.map((_, i) => `<i style="--i:${i}"></i>`).join("")}</div></div>`;
      $("bind").onclick = () => bindBook(p); $("bind").focus();
    } else {
      caption("now");
      const all = p.todos.length, done = doneCount(p), full = done >= all, due = p.dues[p.stage];
      const alerts = S.alertsFor(due, D.TODAY);
      ob.innerHTML = `${pills()}<div class="ob-body now"><div class="who">${seal(full ? "done" : S.dueStatus(due, D.TODAY).state === "late" ? "alert" : "idle", 110, { hole: true })}</div><div>
          <div class="ob-say">${p.stage}단계 · ${D.STAGES[p.stage]} · 마감 ${dueChip(due)}</div>
          <p class="ob-title">${full ? `${p.stage}단계 할 일을 모두 했어요!` : `할 일 ${all}개 중 ${done}개 — ${all - done}개 남았어요`}</p>
          <ul class="todos">${p.todos.map((t, i) => `<li class="${t.done ? "on" : ""}"><span aria-hidden="true">${t.done ? "✓" : "○"}</span>${esc(t.t)}${!t.done && i === done ? ' <small>다음</small>' : ""}</li>`).join("")}</ul>
          <div class="alerts">알림 ${alerts.map((a) => `<span class="${a.past ? "past" : ""}">${a.when.slice(5).replace("-", "/")} ${a.label}</span>`).join("")}</div>
          <div class="ob-foot" style="margin-top:8px">${full ? "" : `<button class="pillbtn pri" id="claude-done" title="시연: Claude 작업이 끝났다는 알림이 왔다고 친다">Claude 작업 끝남 (시연)</button>`}
            <button class="pillbtn${full ? " pri" : ""}" data-tab-go="map">단계 지도 보기</button><button class="pillbtn" data-tab-go="lib">도서관 보기</button></div>
        </div>${full ? `<div class="stamp-now pop">${p.stage}단계<br>${D.STAGES[p.stage]}</div>` : ""}</div>${pinLine(p)}`;
      // FR-7: Claude 작업이 끝나면 다음 할 일을 끝났다고 표시한다 — 다 하면 플로로가 도장을 찍는다
      $("claude-done")?.addEventListener("click", () => {
        const next = p.todos.find((t) => !t.done); if (next) next.done = true;
        toast(`Claude 작업 끝남 — 할 일 ‘${next.t}’ 끝났다고 표시했어요`);
        renderDesk();
      });
    }
    ob.querySelectorAll("[data-tab-go]").forEach((b) => (b.onclick = () => { st.tab = b.dataset.tabGo; st.mapSel = null; renderDesk(); }));
    wirePills(ob);
  }
  function renderMap(ob) {
    const p = proj(); caption("map");
    if (!p) { ob.innerHTML = `<p class="ob-title">열어 둔 프로젝트가 없어요</p>`; return; }
    const sel = st.mapSel ?? p.stage;
    const finished = p.stage === 7 && doneCount(p) === p.todos.length;
    const node = (i) => {
      const cls = i < p.stage || finished ? "done" : i === p.stage ? "cur" : "todo";
      const late = cls === "cur" && S.dueStatus(p.dues[i], D.TODAY).state === "late";
      return `<li class="${cls}${late ? " late" : ""}${i === sel ? " sel" : ""}"><button data-node="${i}" ${i > p.stage ? "disabled" : ""} aria-label="${i}단계 ${D.STAGES[i]}, 마감 ${p.dues[i]}${cls === "done" ? ", 지남" : cls === "cur" ? ", 지금" : ", 아직"}">${i}</button>
        <span>${D.STAGES[i]}</span><em>${p.dues[i].slice(5).replace("-", "/")}</em>${i === p.stage ? `<div class="here">${seal(finished ? "happy" : late ? "alert" : "idle", 34)}</div>` : ""}</li>`;
    };
    const detail = sel === 7 && finished
      ? `<div class="mapnote review"><b>7단계 돌아보기 — 0단계부터 7단계까지 완주! (${p.started.slice(5).replace("-", "/")} → ${p.dues[7].slice(5).replace("-", "/")})</b>
          <ol>${p.steps.map((x, i) => `<li><span>${i} ${D.STAGES[i]}</span>${esc(x)}</li>`).join("")}</ol>
          ${p.insights ? `<p>남긴 인사이트: ${p.insights.map(esc).join(" · ")}</p>` : ""}
          <button class="pillbtn pri" data-tab-go="now">📖 한 권의 책으로 엮기</button></div>`
      : `<div class="mapnote"><b>${sel}단계 ${D.STAGES[sel]}${sel === p.stage ? " — 지금 여기" : ""}</b> ${sel === p.stage ? dueChip(p.dues[sel]) : `<span class="due">${p.dues[sel].slice(5).replace("-", "/")}까지</span>`} 정한 것: ${esc(p.steps[sel] || "아직 정하지 않았어요")}</div>`;
    ob.innerHTML = `${pills()}
      <div class="mapline">${dayOf(p.started)}일째 · ${p.started.slice(5).replace("-", ".")} 시작 · <b>${esc(p.title)}</b> · 지금 ${p.stage}단계 · 할 일 ${doneCount(p)}/${p.todos.length} · 책갈피 ${p.bookmarks.length}장</div>
      <ol class="stagemap" style="--prog:${(Math.min(p.stage, 7) / 7) * 100}%">${D.STAGES.map((_, i) => node(i)).join("")}</ol>${detail}${pinLine(p)}`;
    ob.querySelectorAll("[data-node]").forEach((b) => (b.onclick = () => { st.mapSel = +b.dataset.node; renderDesk(); ob.querySelector(`[data-node="${b.dataset.node}"]`)?.focus(); }));
    ob.querySelectorAll("[data-tab-go]").forEach((b) => (b.onclick = () => { st.tab = b.dataset.tabGo; renderDesk(); }));
    wirePills(ob);
  }
  // 한 권의 책으로 엮기 — 종이가 모여 책이 되고, 서고에 꽂힌다
  function bindBook(p) {
    const papers = $("papers");
    const done = () => {
      const id = `f${D.SHELF.length + 1}`;
      D.SHELF.push({ id, started: p.started, days: dayOf(p.started), title: p.title, shelf: 2, date: "10.17", tags: ["MoSCoW", "숫자로 말하기"], links: ["f4"],
        steps: p.steps, insights: p.insights || [], made: p.made || [], marks: p.bookmarks.length });
      st.open = st.open.filter((b) => b.id !== p.id); st.shelved.push({ ...p, bound: id }); st.proj = st.open[0]?.id;
      go("lib"); toast(`‘${p.title}’ 한 권 완성! 서고 ‘숫자 · 돈’ 책장에 꽂았어요`);
      setTimeout(() => openReader(id), 350);
    };
    if (papers && !matchMedia("(prefers-reduced-motion: reduce)").matches) { papers.classList.add("binding"); setTimeout(done, 1100); } else done();
  }

  function renderShelf4(ob) {
    const n = st.open.length;
    ob.innerHTML = `<div class="ob-body"><div class="who">${seal(n ? "idle" : "sleep", 110, { hole: true })}</div><div>
        <div class="ob-say">도서관 · 열어 둔 책 ${n}권</div>
        <p class="ob-title">${n ? "어떤 책을 볼까요?" : "열어 둔 책을 모두 서고에 꽂았어요"}</p>
        ${n ? `<div class="shelf4">${st.open.map((b) => `<button class="cover" style="--tone:${b.tone}" data-book="${b.id}" aria-label="${esc(b.title)}, ${b.stage}단계 ${D.STAGES[b.stage]}, 책갈피 ${b.bookmarks.length}장">
            <span class="t">${esc(b.title)}</span><span class="s">${b.stage}단계 · ${D.STAGES[b.stage]}</span><span class="m"><span>▮ ${b.bookmarks.length}장</span>${b.stage === 7 && b.todos.every((t) => t.done) ? '<span class="due ok">완주 · 엮기 대기</span>' : dueChip(b.dues[b.stage])}</span></button>`).join("")}</div>`
          : `<p style="margin:0;color:var(--ink-2)">새 세션을 열면 여기에 책이 생겨요. 지난 책은 서고에서 다시 펼칠 수 있어요.</p>`}
      </div></div>
      <div class="ob-foot"><span class="note">책을 고르면 펼쳐져요 · 세션을 덮으면 서고에 꽂혀요</span><span class="grow"></span>
        <button class="enter-lib" data-go="lib"><span class="mb"></span>내 서고 들어가기</button></div>`;
    ob.querySelectorAll("[data-book]").forEach((b) => (b.onclick = () => { st.sel = b.dataset.book; st.confirm = false; setHash(`desk-${st.sel}`); renderDesk(); $("close-book").focus(); }));
  }
  function closeBook() { const id = st.sel; st.sel = null; st.confirm = false; setHash("desk"); renderDesk(); document.querySelector(`[data-book="${id}"]`)?.focus(); }
  function shelve() {
    const book = st.open.find((b) => b.id === st.sel);
    st.sel = null; st.confirm = false; renderDesk();
    const el = document.querySelector(`[data-book="${book.id}"]`);
    const finish = () => { st.open = st.open.filter((b) => b.id !== book.id); st.shelved.push(book); setHash("desk"); renderDesk(); toast(`‘${book.title}’ 책을 서고에 꽂았어요 · 열어 둔 책 ${st.open.length}권`); };
    if (el && !matchMedia("(prefers-reduced-motion: reduce)").matches) { el.classList.add("leaving"); setTimeout(finish, 480); } else finish();
  }
  let toastTimer;
  function toast(text) { const t = $("toast"); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600); }

  // ── ③ 내 서고 ──
  const SHELVES = [
    { label: "기록 · 폼", style: "left:5vw;top:2%" }, { label: "알림", style: "right:5vw;top:2%" },
    { label: "숫자 · 돈", style: "left:2vw;top:40%" }, { label: "정리 도구", style: "right:2vw;top:40%" },
  ];
  const CHIPS = [["EARS", "left:24vw;top:30%"], ["MoSCoW", "left:22vw;top:66%"], ["숫자로 말하기", "left:30vw;top:12%"], ["얼음 보내기", "right:26vw;top:28%"],
    ["재시도", "right:23vw;top:12%"], ["한 번에 하나만", "right:24vw;top:66%"]];
  function renderLib() {
    const loose = st.shelved.filter((b) => !b.bound);   // 세션만 덮은 책 — 책으로 엮은 것은 이미 D.SHELF에 있다
    const marks = D.SHELF.reduce((n, b) => n + marksOf(b), 0) + loose.reduce((n, b) => n + b.bookmarks.length, 0);
    $("lib-count").textContent = `끝낸 프로젝트 ${D.SHELF.length + loose.length}권 · 책갈피 ${marks}장`;
    const stage = $("stage");
    stage.querySelectorAll(".shelfbox,.chip").forEach((n) => n.remove());
    SHELVES.forEach((sh, i) => {
      let h = 7; const spines = (k) => Array.from({ length: k }, () => `<i class="spine" style="height:${60 + ((h = (h * 37) % 41))}px"></i>`).join("");
      const box = document.createElement("div"); box.className = "shelfbox"; box.style.cssText = sh.style;
      const books = D.SHELF.filter((b) => b.shelf === i);
      box.innerHTML = `<div class="row">${spines(3)}${books.map((b) => `<button class="front" data-read="${b.id}" aria-label="${esc(b.title)} 펼치기">${esc(b.title)}${b.sub ? ` ${esc(b.sub)}` : ""}</button>`).join("")}${spines(4)}</div>
        <div class="board"></div><div class="label">${sh.label}</div>`;
      stage.appendChild(box);
    });
    CHIPS.forEach(([t, s]) => { const c = document.createElement("span"); c.className = "chip"; c.style.cssText = s; c.textContent = t; stage.appendChild(c); });
    const last = st.shelved[st.shelved.length - 1];
    $("slot").innerHTML = last ? `방금 꽂은 책<br><b style="color:var(--ink)">${esc(last.title)}</b>` : `지금 쓰는 책 ${st.open.length}권<br>끝내면 여기 꽂혀요`;
    stage.querySelectorAll("[data-read]").forEach((b) => {
      b.onclick = () => openReader(b.dataset.read);
      b.onmouseenter = b.onfocus = () => drawArcs(b.dataset.read);
      b.onmouseleave = b.onblur = () => drawArcs(null);
    });
    st.results = st.search ? window.LibSearch.searchLibrary(st.search, D) : null;
    const none = st.results && !st.results.length;
    $("lib-seal").innerHTML = seal(none ? "think" : st.answer ? "look" : "idle", 170);
    $("floro-say").textContent = none ? `서고에는 ‘${st.search.trim()}’ 이야기가 없어요. 다른 말로 찾아볼까요?`
      : st.results ? `찾았어요! 검색창 밑에 ${st.results.length}곳을 펼쳐 뒀어요.` : st.answer ? "찾았어요! 오른쪽에 펼쳐 둘게요." : "기억 안 나는 게 있으면 저한테 물어봐요.";
    $("asks").innerHTML = D.ASK.map((a, i) => `<button class="pillbtn glass" data-ask="${i}">${esc(a.q)}</button>`).join("");
    $("asks").querySelectorAll("[data-ask]").forEach((b) => (b.onclick = () => { spot.clear(); spot.close(); st.answer = D.ASK[+b.dataset.ask]; renderLib(); setHash("lib-ask"); }));
    renderAnswer();
    caption(st.results ? "search" : st.answer ? "ask" : "lib");
    drawArcs(null);
  }
  $("refs-btn").onclick = () => { spot.clear(); spot.close(); st.answer = D.ASK.find((a) => a.refs); renderLib(); };

  // ── 서고에서 찾기 — 결과는 검색창 바로 밑에 펼친다(spotlight.js). 오른쪽 열은 "어디에 있는지" ──
  const KIND = { shelf: "끝낸 책", open: "열어 둔 책", ref: "레퍼런스" };
  const WHERE = (x) => x.kind === "shelf" ? `서고 › ${SHELVES[D.SHELF.find((b) => b.id === x.id).shelf].label} 책장` : x.kind === "open" ? "작업 화면 › 도서관 위젯" : "서고 › 레퍼런스 서가";
  const ICON = (x) => x.kind === "ref" ? '<span class="ic-ref">🔖</span>'
    : `<i class="ic-book" style="background:linear-gradient(160deg,${x.kind === "open" ? D.OPEN.find((b) => b.id === x.id).tone : "#cfe6ff"},#6f9cf0)"></i>`;
  const spot = window.Spotlight.attach({
    form: $("search"), input: $("q"), placeholderHint: "펼치기",
    search: (q) => window.LibSearch.searchLibrary(q, D).map((x) => ({
      icon: ICON(x), plain: x.title, hint: "펼치기",
      title: window.LibSearch.highlight(x.title, q),
      sub: `${KIND[x.kind]} · ${x.byTitle ? "이름에 있어요" : `${esc(x.where)} · ${window.LibSearch.highlight(x.text, q)}`}${x.count > 1 ? ` 외 ${x.count - 1}곳` : ""}`,
      right: esc(WHERE(x)),
      open: () => x.kind === "shelf" ? openReader(x.id) : x.kind === "open" ? go("desk", x.id) : openReader(D.REFS.find((r) => r.id === x.id).used[0]),
    })),
    onChange: (q) => { st.search = q.trim() ? q : ""; if (st.search) st.answer = null; renderLib(); },
  });

  // 같은 배움(태그)을 쓴 책끼리 금빛 선으로 잇는다 — 영상 7번 장면
  function drawArcs(id) {
    const svg = $("arcs"), box = $("stage").getBoundingClientRect();
    const found = (fid) => (st.results ? st.results.some((x) => x.kind === "shelf" && x.id === fid) : Boolean(st.answer && st.answer.tag && D.SHELF.find((b) => b.id === fid)?.tags.includes(st.answer.tag)));
    document.querySelectorAll(".front").forEach((f) => f.classList.toggle("lit", found(f.dataset.read)));
    if (!id) { svg.innerHTML = ""; return; }
    const from = D.SHELF.find((b) => b.id === id);
    document.querySelectorAll(".front").forEach((f) => { if (f.dataset.read === id || from.links.includes(f.dataset.read)) f.classList.add("lit"); });
    const at = (bid) => { const r = document.querySelector(`[data-read="${bid}"]`)?.getBoundingClientRect(); return r && { x: r.left + r.width / 2 - box.left, y: r.top - box.top }; };
    const a = at(id);
    svg.innerHTML = from.links.map((lid) => {
      const to = D.SHELF.find((b) => b.id === lid), b = at(lid); if (!a || !b) return "";
      const shared = from.tags.find((t) => to.tags.includes(t)) || "이어짐", n = D.SHELF.filter((x) => x.tags.includes(shared)).length;
      const mx = (a.x + b.x) / 2, my = Math.max(-40, Math.min(a.y, b.y) - 60), ly = Math.max(14, (Math.min(a.y, b.y) + my) / 2 + 4);   // 선 꼭대기는 화면 안, 이름표는 선 위에
      return `<path d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}"></path><text x="${mx}" y="${ly}" text-anchor="middle">★ ${esc(shared)} · ${n}권</text>`;
    }).join("");
  }

  function renderAnswer() {
    const box = $("answer"), a = st.answer;
    if (!a) { box.hidden = true; return; }
    box.hidden = false;
    if (a.refs) {
      box.innerHTML = `<h3>${seal("happy", 28)}플로로가 찾은 레퍼런스 ${D.REFS.length}개</h3><ul>${D.REFS.map((r) => `<li><button data-read="${r.used[0]}"><i></i><span>${esc(r.title)} · ${esc(r.kind)}</span><small>${esc(r.line)} — 쓰인 책: ${r.used.map((u) => esc(D.SHELF.find((b) => b.id === u).title)).join(", ")}</small></button></li>`).join("")}</ul>
        <div class="foot">링크와 한 줄만 모아 둬요. 본문은 열 때 원래 자리에서 가져와요.</div>`;
    } else {
      const found = D.SHELF.filter((b) => b.tags.includes(a.tag));
      box.innerHTML = `<h3>${seal("happy", 28)}플로로가 찾은 책 ${found.length}권</h3><ul>${found.map((b) => `<li><button data-read="${b.id}"><i></i><span>${esc(b.title)} · ${D.STAGES.length - 1}단계까지</span><small>${esc(b.insights[0])}</small></button></li>`).join("")}</ul>
        <div class="foot">모두 <b>‘${esc(a.tag)}’</b> 책갈피가 꽂힌 책이에요. 이번 책에도 꺼내 쓸까요? <button class="pillbtn" id="ans-close" style="margin-left:6px">닫기</button></div>`;
      $("ans-close").onclick = () => { st.answer = null; renderLib(); setHash("lib"); };
    }
    box.querySelectorAll("[data-read]").forEach((b) => (b.onclick = () => openReader(b.dataset.read)));
  }

  // ── 펼친 책 (영상 8번 장면) ──
  let lastFocus = null;
  const marksOf = (b) => b.marks || b.steps.length + b.insights.length;
  const ORD = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
  function openReader(id, { cover = true } = {}) {
    const b = D.SHELF.find((x) => x.id === id); if (!b) return;
    if (!$("reader").classList.contains("on")) lastFocus = document.activeElement;
    st.reading = id;
    // 표지 — 영상 8번 장면: ○번째 책 · 기간 · 8단계 · 책갈피 수 · 완주 도장. 누르거나 Enter로 넘긴다
    const order = [...D.SHELF].sort((x, y) => x.started.localeCompare(y.started)).findIndex((x) => x.id === id);
    const end = new Date(Date.parse(b.started) + (b.days - 1) * 864e5).toISOString().slice(0, 10);
    $("rd-cover").innerHTML = `<span class="kick">플로로의 얼음 서고 · ${ORD[order] || order + 1}번째 책</span><b>${esc(b.title)}${b.sub ? ` ${esc(b.sub)}` : ""}</b><i></i>
      <span>${b.started.replaceAll("-", ".")} — ${end.slice(5).replace("-", ".")}</span><span>8단계 · 책갈피 ${marksOf(b)}장</span><span class="stamp">${b.date}<br>완주</span><em>눌러서 펼치기</em>`;
    $("rd-foot").textContent = `${b.days}일 · 단계 8개 · 책갈피 ${marksOf(b)}장 · 만든 것 ${b.made.length}개`;
    $("reader").classList.toggle("cover", cover);
    $("rd-title").textContent = `${b.title}${b.sub ? ` ${b.sub}` : ""} — 단계마다 내가 정한 것`;
    $("rd-steps").innerHTML = b.steps.map((s, i) => `<li><b>${i}</b><span>${D.STAGES[i]}</span><em>${esc(s)}</em></li>`).join("");
    $("rd-tags").innerHTML = b.tags.map((t) => `<span>${esc(t)}</span>`).join("");
    $("rd-ins").innerHTML = b.insights.map((t) => `<li>${esc(t)}</li>`).join("");
    $("rd-made").innerHTML = b.made.map((t) => `<span>${esc(t)}</span>`).join("");
    $("rd-links").innerHTML = b.links.map((l) => `<button data-read="${l}">${esc(D.SHELF.find((x) => x.id === l).title)}</button>`).join("");
    $("rd-links").querySelectorAll("[data-read]").forEach((x) => (x.onclick = () => openReader(x.dataset.read, { cover: false })));
    $("rd-stamp").innerHTML = `${b.date}<br>완독`;
    show("lib"); $("reader").classList.add("on"); caption(cover ? "cover" : "read"); setHash(`lib-${id}`);
    (cover ? $("rd-cover") : $("rd-close")).focus();
  }
  $("rd-cover").onclick = () => { $("reader").classList.remove("cover"); caption("read"); $("rd-close").focus(); };

  // ── 전체 돌아보기 — 끝낸 책과 열어 둔 책, 자주 쓴 배움, 되풀이한 인사이트 ──
  function openReview() {
    lastFocus = document.activeElement;
    const fin = D.SHELF, open = st.open, marks = fin.reduce((n, b) => n + marksOf(b), 0) + open.reduce((n, b) => n + b.bookmarks.length, 0);
    const first = [...fin, ...open].map((b) => b.started).sort()[0];
    $("rv-seal").innerHTML = seal("happy", 72);
    $("rv-sub").textContent = `${first.replaceAll("-", ".")}부터 오늘(2026.10.17)까지 — 여기까지 왔어요!`;
    $("rv-tiles").innerHTML = [["끝낸 책", `${fin.length}권`], ["열어 둔 책", `${open.length}권`], ["모은 책갈피 (열어 둔 책 포함)", `${marks}장`], ["돌아보기까지 완주", `${fin.length}번`]]
      .map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("");
    const rows = [...fin.map((b) => ({ b, done: 8, fin: true })), ...open.map((b) => ({ b, done: b.stage + (b.stage === 7 ? 1 : 0), fin: false }))]
      .sort((x, y) => x.b.started.localeCompare(y.b.started));
    $("rv-paths").innerHTML = rows.map(({ b, done, fin }) => `<li><button data-rv="${fin ? "f" : "o"}:${b.id}">
        <span class="nm">${esc(b.title)}${b.sub ? ` ${esc(b.sub)}` : ""}</span>
        <span class="dots" aria-label="${fin ? "8단계 완주" : `지금 ${b.stage}단계`}">${D.STAGES.map((_, i) => `<i class="${i < done ? "on" : i === b.stage && !fin ? "cur" : ""}"></i>`).join("")}</span>
        <span class="st">${fin ? `완주 · ${b.date}` : `${b.stage}단계 ${D.STAGES[b.stage]}`}</span></button></li>`).join("");
    $("rv-paths").querySelectorAll("[data-rv]").forEach((x) => (x.onclick = () => {
      const [k, id] = x.dataset.rv.split(":"); closeReview(false);
      if (k === "f") openReader(id); else go("map", id);
    }));
    const count = {};
    for (const b of fin) for (const t of b.tags) count[t] = (count[t] || 0) + 1;
    const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5), max = top[0]?.[1] || 1;
    $("rv-tags").innerHTML = top.map(([t, n]) => `<li><span>${esc(t)}</span><i style="width:${(n / max) * 100}%"></i><b>${n}권</b></li>`).join("");
    $("rv-ins").innerHTML = fin.flatMap((b) => b.insights.map((t) => `<li>${esc(t)} <small>— ${esc(b.title)}</small></li>`)).slice(0, 5).join("");
    $("review").classList.add("on"); caption("review"); setHash("lib-review"); $("rv-close").focus();
  }
  function closeReview(back = true) { $("review").classList.remove("on"); if (back) { caption("lib"); setHash("lib"); lastFocus?.focus?.(); } }
  $("review-btn").onclick = openReview;
  $("rv-close").onclick = () => closeReview();
  $("review").addEventListener("click", (e) => { if (e.target === $("review")) closeReview(); });
  function closeReader() { $("reader").classList.remove("on"); st.reading = null; caption(st.results ? "search" : st.answer ? "ask" : "lib"); setHash(st.answer ? "lib-ask" : "lib"); lastFocus?.focus?.(); }
  $("rd-close").onclick = closeReader;
  $("reader").addEventListener("click", (e) => { if (e.target === $("reader")) closeReader(); });

  // ── 키보드: Esc는 한 겹씩 닫고, Enter는 세션 덮기 확인 ──
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ($("review").classList.contains("on")) return closeReview();
      if ($("reader").classList.contains("on")) return closeReader();
      if ($("spread").classList.contains("on")) return go("hall");
      if (st.confirm) { st.confirm = false; return renderDesk(); }
      if (st.sel && $("s-desk").classList.contains("on")) return closeBook();
    }
    if (e.key === "/" && $("s-lib").classList.contains("on") && !$("reader").classList.contains("on") && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { e.preventDefault(); $("q").focus(); }
    if (e.key === "Enter" && st.confirm && document.activeElement?.id !== "no-shelve") { e.preventDefault(); shelve(); }
  });

  // ── 주소 끝으로 장면 바로 열기 (시연·녹화용) ──
  function fromHash() {
    const h = location.hash.slice(1);
    if (h === "pick") return go("pick");
    if (h === "desk") return go("desk");
    let mt; if ((mt = /^desk-(now|map)(?:-(s\d))?$/.exec(h))) return go(mt[1], mt[2]);
    if (h.startsWith("desk-")) return go("desk", h.slice(5));
    if (h === "lib") return go("lib");
    if (h === "lib-ask") return go("lib", "ask");
    if (h === "lib-hover") { go("lib"); return drawArcs("f1"); }
    if (h === "lib-review") { go("lib"); return openReview(); }
    if (h.startsWith("lib-open-")) { go("lib"); return openReader(h.slice(9), { cover: false }); }
    if (h.startsWith("lib-q=")) { go("lib"); spot.set(decodeURIComponent(h.slice(6))); return $("q").focus(); }
    if (h.startsWith("lib-")) { go("lib"); return openReader(h.slice(4)); }
    go("hall");
  }
  fromHash();
})();
