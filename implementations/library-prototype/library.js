// claude-drafted: 2026-10-17 — 도서관 시안의 동작. 저장·서버·AI 호출 없음 — 더미 데이터(books.js)를 화면 안에서만 바꾼다.
// 장면: ① 입구(큰 책) → 도서관 두 가지 고르기 → ③ 플로로의 얼음 서고 → 펼친 책 · 전체 돌아보기 · 지식 은하(sky.html).
// 같은 날: 작업 화면 위 위젯(지금·단계 지도·한곳에서 보기·도서관 탭)은 내비게이터(../navigator-prototype/app.js)의 탭으로 옮겼다 — 같은 화면이 둘이 되지 않게.
//   그쪽에서 "한 권의 책으로 엮기"를 누르면 #lib-bound-<id>로 이 화면에 와서 책장에 꽂힌다. 열어 둔 책 목록(D.OPEN)은 두 화면이 같이 읽는다.
(function () {
  const D = window.LibData, Seal = window.NavSeal;
  const NAV = "../navigator-prototype/index.html";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const seal = (mood, size, opts) => (Seal ? Seal.svg(mood, size, opts) : "");

  // 화면 안에서만 바뀌는 상태 (새로 고침하면 처음으로)
  const st = { open: D.OPEN.map((b) => ({ ...b })), shelved: [], answer: null, reading: null };

  // ── 배경 별 ──
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  $("sky").innerHTML = Array.from({ length: 110 }, () => `<i style="left:${rnd() * 100}%;top:${rnd() * 80}%;opacity:${(rnd() * .6 + .2).toFixed(2)};transform:scale(${(rnd() * 1.2 + .4).toFixed(2)})"></i>`).join("");

  // ── 장면 전환 ──
  const CAPTIONS = {
    hall: "큰 책을 누르면 도서관 두 가지가 펼쳐져요",
    pick: "① 작업 화면 위 위젯(내비게이터의 도서관 탭) · ② 나만의 서고",
    lib: "내 서고 — 같은 배움을 쓴 책끼리 별자리처럼 이어져요",
    read: "책을 펼치면 단계마다 정한 것 · 배운 것이 그대로",
    ask: "기억 안 날 땐 플로로에게 — 찾은 책을 바로 펼쳐요",
    search: "서고에서 찾기 — 끝낸 책 · 열어 둔 책 · 레퍼런스를 한 번에",
    cover: "서고에 꽂힌 책 — 표지를 넘기면 단계마다 정한 것이 그대로",
    review: "전체 돌아보기 — 끝낸 책과 열어 둔 책, 역량 지도를 한눈에",
    bound: "완주한 책이 한 권으로 엮여 서고에 꽂혔어요",
  };
  function caption(key) { $("caption").textContent = CAPTIONS[key]; }
  function show(screen) { for (const s of ["hall", "lib"]) $(`s-${s}`).classList.toggle("on", s === screen); }
  function setHash(h) { history.replaceState(null, "", `#${h}`); }
  // 작업 화면 위 위젯은 내비게이터에 있다 — 열어 둔 책은 그쪽 도서관 탭에서 펼친다
  const toNav = (hash) => { location.href = `${NAV}#${hash}`; };

  function go(where, arg) {
    $("spread").classList.remove("on"); $("reader").classList.remove("on"); $("review").classList.remove("on");
    if (where === "hall") { show("hall"); caption("hall"); setHash("hall"); $("tome").focus(); return; }
    if (where === "pick") { show("hall"); $("spread").classList.add("on"); caption("pick"); setHash("pick"); $("spread").querySelector(".go").focus(); return; }
    if (where === "lib") { show("lib"); spot.clear(); spot.close(); st.answer = arg === "ask" ? D.ASK[0] : null; renderLib(); setHash(arg === "ask" ? "lib-ask" : "lib"); return; }
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); });
  $("tome").onclick = () => go("pick");
  $("spread").addEventListener("click", (e) => { if (e.target === $("spread")) go("hall"); });

  // ── ① 입구 ──
  $("hall-seal").innerHTML = seal("happy", 150);
  $("mini-a").innerHTML = `<div style="display:flex;gap:8px">${D.OPEN.map((b) => `<span style="width:44px;height:60px;border-radius:3px 6px 6px 3px;background:${b.tone};box-shadow:inset 3px 0 0 rgba(0,0,0,.18)"></span>`).join("")}</div>`;
  $("mini-b").innerHTML = `<div style="display:flex;align-items:flex-end;gap:22px">${[0, 1].map(() => `<div style="display:flex;gap:3px;align-items:flex-end;border-bottom:5px solid #cdd8f5;padding:0 4px">${[46, 38, 52, 30, 44].map((h) => `<i style="width:7px;height:${h}px;background:#7d9df0;border-radius:1px"></i>`).join("")}</div>`).join(`<div>${seal("idle", 64)}</div>`)}</div>`;

  const dayOf = (date) => Math.round((Date.parse(D.TODAY) - Date.parse(date)) / 864e5) + 1;
  let toastTimer;
  function toast(text) { const t = $("toast"); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600); }

  // 엮은 책의 기록 — 내비게이터와 같은 열쇠를 읽는다(두 페이지가 같은 브라우저 기록을 본다). 지우는 건 내비게이터 설정의 "기록 지우기"
  const BOUND_KEY = "floe-demo:bound";
  const readBound = () => { try { const v = JSON.parse(localStorage.getItem(BOUND_KEY) || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
  // 열어 둔 책 하나를 책장에 꽂는다 — 같은 배움을 쓴 책과 잇는다. 돌려주는 것: 꽂힌 책의 id
  function bindInto(id) {
    const p = st.open.find((b) => b.id === id);
    if (!p) return st.shelved.find((b) => b.id === id)?.bound || null;
    const fid = `f${D.SHELF.length + 1}`, tags = p.tags || [];
    const links = D.SHELF.filter((b) => b.tags.some((t) => tags.includes(t))).map((b) => b.id).slice(0, 2);
    D.SHELF.push({ id: fid, started: p.started, days: dayOf(p.started), title: p.title, shelf: 2, date: D.TODAY.slice(5).replace("-", "."), tags, links,
      steps: p.steps, insights: p.insights || [], made: p.made || [], marks: p.bookmarks.length });
    st.open = st.open.filter((b) => b.id !== id); st.shelved.push({ ...p, bound: fid });
    return fid;
  }
  // 내비게이터에서 "한 권의 책으로 엮기"를 누르고 넘어온 길(#lib-bound-<id>) — 꽂고, 알리고, 표지를 연다
  function bound(id) {
    const fresh = st.open.some((b) => b.id === id), fid = bindInto(id);
    if (!fid) return go("lib");
    go("lib"); caption("bound"); setHash(`lib-${fid}`);
    if (fresh) toast(`‘${D.SHELF.find((b) => b.id === fid).title}’ 한 권 완성! 서고 ‘숫자 · 돈’ 책장에 꽂았어요`);
    setTimeout(() => openReader(fid), fresh ? 500 : 0);
  }
  for (const id of readBound()) bindInto(id);   // 지난번에 엮은 책은 처음부터 책장에

  // ── ③ 내 서고 ──
  const SHELVES = [
    { label: "기록 · 폼", style: "left:5vw;top:2%" }, { label: "알림", style: "right:5vw;top:2%" },
    { label: "숫자 · 돈", style: "left:2vw;top:40%" }, { label: "정리 도구", style: "right:2vw;top:40%" },
  ];
  const CHIPS = [["EARS", "left:24vw;top:30%"], ["MoSCoW", "left:22vw;top:66%"], ["숫자로 말하기", "left:30vw;top:12%"], ["얼음 보내기", "right:26vw;top:28%"],
    ["재시도", "right:23vw;top:12%"], ["한 번에 하나만", "right:24vw;top:66%"]];
  function renderLib() {
    const marks = D.SHELF.reduce((n, b) => n + marksOf(b), 0);
    $("lib-count").textContent = `끝낸 프로젝트 ${D.SHELF.length}권 · 책갈피 ${marks}장 · 열어 둔 책 ${st.open.length}권`;
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
  const WHERE = (x) => x.kind === "shelf" ? `서고 › ${SHELVES[D.SHELF.find((b) => b.id === x.id).shelf].label} 책장` : x.kind === "open" ? "작업 화면 › 내비게이터 도서관 탭" : "서고 › 레퍼런스 서가";
  const ICON = (x) => x.kind === "ref" ? '<span class="ic-ref">🔖</span>'
    : `<i class="ic-book" style="background:linear-gradient(160deg,${x.kind === "open" ? D.OPEN.find((b) => b.id === x.id).tone : "#cfe6ff"},#6f9cf0)"></i>`;
  const spot = window.Spotlight.attach({
    form: $("search"), input: $("q"), placeholderHint: "펼치기",
    search: (q) => window.LibSearch.searchLibrary(q, D).map((x) => ({
      icon: ICON(x), plain: x.title, hint: x.kind === "open" ? "내비게이터로" : "펼치기",
      title: window.LibSearch.highlight(x.title, q),
      sub: `${KIND[x.kind]} · ${x.byTitle ? "이름에 있어요" : `${esc(x.where)} · ${window.LibSearch.highlight(x.text, q)}`}${x.count > 1 ? ` 외 ${x.count - 1}곳` : ""}`,
      right: esc(WHERE(x)),
      open: () => x.kind === "shelf" ? openReader(x.id) : x.kind === "open" ? toNav(`tab=lib&book=${x.id}`) : openReader(D.REFS.find((r) => r.id === x.id).used[0]),
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
      box.innerHTML = `<h3>${seal("happy", 28)}플로로가 찾은 책 ${found.length}권</h3><ul>${found.map((b) => `<li><button data-read="${b.id}"><i></i><span>${esc(b.title)} · ${D.STAGES.length - 1}단계까지</span><small>${esc(b.insights[0] || "")}</small></button></li>`).join("")}</ul>
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
    $("rv-sub").textContent = `${first.replaceAll("-", ".")}부터 오늘(${D.TODAY.replaceAll("-", ".")})까지 — 여기까지 왔어요!`;
    $("rv-tiles").innerHTML = [["끝낸 책", `${fin.length}권`], ["열어 둔 책", `${open.length}권`], ["모은 책갈피 (열어 둔 책 포함)", `${marks}장`], ["돌아보기까지 완주", `${fin.length}번`]]
      .map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("");
    const rows = [...fin.map((b) => ({ b, done: 8, fin: true })), ...open.map((b) => ({ b, done: b.stage + (b.stage === 7 ? 1 : 0), fin: false }))]
      .sort((x, y) => x.b.started.localeCompare(y.b.started));
    $("rv-paths").innerHTML = rows.map(({ b, done, fin }) => `<li><button data-rv="${fin ? "f" : "o"}:${b.id}">
        <span class="nm">${esc(b.title)}${b.sub ? ` ${esc(b.sub)}` : ""}</span>
        <span class="dots" aria-label="${fin ? "8단계 완주" : `지금 ${b.stage}단계`}">${D.STAGES.map((_, i) => `<i class="${i < done ? "on" : i === b.stage && !fin ? "cur" : ""}"></i>`).join("")}</span>
        <span class="st">${fin ? `완주 · ${b.date}` : `${b.stage}단계 ${D.STAGES[b.stage]} · 내비게이터에서`}</span></button></li>`).join("");
    // 끝낸 책은 여기서 펼치고, 열어 둔 책은 내비게이터로 — 첫 책(s1)은 그쪽 단계 지도, 나머지는 도서관 탭
    $("rv-paths").querySelectorAll("[data-rv]").forEach((x) => (x.onclick = () => {
      const [k, id] = x.dataset.rv.split(":");
      if (k === "f") { closeReview(false); openReader(id); } else toNav(id === "s1" ? "tab=map" : `tab=lib&book=${id}`);
    }));
    // FR-8 역량 지도 — 배운 것마다 레벨 4단계와 노력(책 수 · 날 수). 레벨 규칙은 가설(skills.js)
    const SK = window.Skills;
    $("rv-tags").innerHTML = SK.skillMap(fin, open).slice(0, 7).map((x) => `<li><span>${esc(x.skill)}</span>
      <span class="lv" aria-label="${SK.LEVELS[x.level]}">${SK.LEVELS.map((_, i) => `<i class="${i <= x.level ? "on" : ""}"></i>`).join("")}<em>${SK.LEVELS[x.level]}</em></span>
      <b>${x.books ? `${x.books}권 · ${x.days}일` : "열어 둔 책"}</b></li>`).join("");
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

  // ── 키보드: Esc는 한 겹씩 닫고, /는 찾기 ──
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ($("review").classList.contains("on")) return closeReview();
      if ($("reader").classList.contains("on")) return closeReader();
      if ($("spread").classList.contains("on")) return go("hall");
    }
    if (e.key === "/" && $("s-lib").classList.contains("on") && !$("reader").classList.contains("on") && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { e.preventDefault(); $("q").focus(); }
  });

  // ── 주소 끝으로 장면 바로 열기 (시연·녹화용) ──
  function fromHash() {
    const h = location.hash.slice(1);
    if (h === "pick") return go("pick");
    if (h.startsWith("desk")) return toNav("tab=lib");   // 옛 주소(작업 화면 위젯) — 내비게이터로
    if (h === "lib") return go("lib");
    if (h === "lib-ask") return go("lib", "ask");
    if (h === "lib-hover") { go("lib"); return drawArcs("f1"); }
    if (h === "lib-review") { go("lib"); return openReview(); }
    if (h.startsWith("lib-bound-")) return bound(h.slice(10));
    if (h.startsWith("lib-open-")) { go("lib"); return openReader(h.slice(9), { cover: false }); }
    if (h.startsWith("lib-q=")) { go("lib"); spot.set(decodeURIComponent(h.slice(6))); return $("q").focus(); }
    if (h.startsWith("lib-")) { go("lib"); return openReader(h.slice(4)); }
    go("hall");
  }
  fromHash();
})();
