// claude-drafted: 2026-10-17 — 도서관 시안의 동작. 저장·서버·AI 호출 없음 — 더미 데이터(books.js)를 화면 안에서만 바꾼다.
// 장면: ① 입구(큰 책) → 도서관 두 가지 고르기 → ③ 플로로의 얼음 서고 → 펼친 책 · 전체 돌아보기 · 지식 은하(sky.html).
// 같은 날: 작업 화면 위 위젯(지금·단계 지도·한곳에서 보기·도서관 탭)은 내비게이터(../navigator/app.js)의 탭으로 옮겼다 — 같은 화면이 둘이 되지 않게.
//   그쪽에서 "한 권의 책으로 엮기"를 누르면 #lib-bound-<id>로 이 화면에 와서 책장에 꽂힌다. 열어 둔 책 목록(D.OPEN)은 두 화면이 같이 읽는다.
// 2026-10-18(F-05, PRD 2-7): 내비게이터의 '내 배움' 탭을 여기 '내 배움' 창으로 옮겼다(#lib-learn) — 이 창만 더미가 아니라 이 브라우저에 남은 내비게이터 기록을 읽는다(learn.js).
(function () {
  const D = window.LibData, Seal = window.NavSeal;
  const NAV = "../navigator/index.html";
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
    arrive: "플로로를 따라 물속에서 서고로 올라왔어요",
    learn: "내 배움 — 지나온 단계 · 배운 말 · 설계도",
  };
  function caption(key) { $("caption").textContent = CAPTIONS[key]; }
  function show(screen) { for (const s of ["hall", "lib"]) $(`s-${s}`).classList.toggle("on", s === screen); }
  function setHash(h) { history.replaceState(null, "", `#${h}`); }
  // 작업 화면 위 위젯은 내비게이터에 있다 — 열어 둔 책은 그쪽 도서관 탭에서 펼친다
  const toNav = (hash) => { location.href = `${NAV}#${hash}`; };

  function go(where, arg) {
    $("spread").classList.remove("on"); $("reader").classList.remove("on"); $("review").classList.remove("on"); $("learn").classList.remove("on");
    if (where === "hall") { show("hall"); caption("hall"); setHash("hall"); $("tome").focus(); return; }
    if (where === "pick") { show("hall"); $("spread").classList.add("on"); caption("pick"); setHash("pick"); $("spread").querySelector(".go").focus(); return; }
    if (where === "lib") { show("lib"); spot.clear(); spot.close(); st.answer = arg === "ask" ? D.ASK[0] : null; renderLib(); setHash(arg === "ask" ? "lib-ask" : "lib"); return; }
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); });
  $("tome").onclick = () => go("pick");
  $("spread").addEventListener("click", (e) => { if (e.target === $("spread")) go("hall"); });

  // ── ① 입구 ──
  $("hall-seal").innerHTML = seal("happy", 150);
  // 얼음판 위 플로로(2026-10-17 자연스럽게) — 얼음판과 함께 둥실 뜨고(index.html의 .ice.bob), 눈은 마우스를 따라가며,
  // 12~20초마다 배로 통통(물범 걸음, ../navigator/seal.css)이나 두리번 중 하나를 한다. 움직임 줄이기면 하지 않는다
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let raf = 0, point = null;
    document.addEventListener("mousemove", (e) => {
      point = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; Seal.follow(document.body, point); });
    });
    const play = () => {
      for (const h of [$("hall-seal"), $("lib-seal")]) {
        if (Math.random() < 0.5) { h.classList.remove("galumph"); void h.offsetWidth; h.classList.add("galumph"); continue; }
        // 두리번: 왼쪽 → 오른쪽 → 다시 마우스 쪽(없으면 앞)
        const b = h.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height * 0.4;
        [{ x: x - 400, y: y - 40 }, { x: x + 400, y: y - 40 }, point || { x, y }].forEach((p, i) => setTimeout(() => Seal.follow(h, p), i * 900));
      }
      setTimeout(play, 12000 + Math.random() * 8000);
    };
    setTimeout(play, 6000);
  }
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
  const SEAL = 190;   // 가운데 플로로 크기(2026-10-18 UI를 키우며 170 → 190)
  const SHELVES = [
    { label: "기록 · 폼", style: "left:5vw;top:2%" }, { label: "알림", style: "right:5vw;top:2%" },
    { label: "숫자 · 돈", style: "left:2vw;top:40%" }, { label: "정리 도구", style: "right:2vw;top:40%" },
  ];
  // 책장을 키우며(2026-10-18) 책장과 겹치지 않게 가운데 쪽으로 옮겼다
  const CHIPS = [["EARS", "left:31vw;top:32%"], ["MoSCoW", "left:28vw;top:68%"], ["숫자로 말하기", "left:30vw;top:12%"], ["얼음 보내기", "right:31vw;top:30%"],
    ["재시도", "right:30vw;top:12%"], ["한 번에 하나만", "right:28vw;top:68%"]];
  function renderLib() {
    const marks = D.SHELF.reduce((n, b) => n + marksOf(b), 0);
    $("lib-count").textContent = `끝낸 프로젝트 ${D.SHELF.length}권 · 책갈피 ${marks}장 · 열어 둔 책 ${st.open.length}권`;
    const stage = $("stage");
    stage.querySelectorAll(".shelfbox,.chip").forEach((n) => n.remove());
    SHELVES.forEach((sh, i) => {
      let h = 7; const spines = (k) => Array.from({ length: k }, () => `<i class="spine" style="height:${84 + ((h = (h * 37) % 41))}px"></i>`).join("");
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
      b.onclick = () => openReader(b.dataset.read, { from: b });
      b.onmouseenter = b.onfocus = () => drawArcs(b.dataset.read);
      b.onmouseleave = b.onblur = () => drawArcs(null);
    });
    st.results = st.search ? window.LibSearch.searchLibrary(st.search, D) : null;
    const none = st.results && !st.results.length;
    $("lib-seal").innerHTML = seal(none ? "think" : st.answer ? "look" : "idle", SEAL);
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
  // 움직임을 쓸 수 있을 때만 — 책이 날아오고 펼쳐지는 것(2026-10-18, 목업 영상 40~42초)
  const MOVE = !matchMedia("(prefers-reduced-motion: reduce)").matches && typeof Element.prototype.animate === "function";
  function openReader(id, { cover = true, from = null } = {}) {
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
    if (cover && from) flyFrom(from);
  }
  // 책장의 책이 화면 가운데로 날아와 크게 보인다 — 책장 자리는 비워 두고, 책을 덮으면 돌아온다
  function flyFrom(src) {
    if (!MOVE) return;
    const c = $("rd-cover"), a = src.getBoundingClientRect(), b = c.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    src.style.visibility = "hidden";
    // 기본 흐려짐(fade)은 날아오는 책까지 비쳐 보이게 해서 끄고, 뒤 어둠만 짙어지게 한다 — 책을 덮으면 되돌린다(closeReader)
    const rd = $("reader"); rd.style.animation = c.style.animation = "none";
    rd.animate([{ backgroundColor: "rgba(4, 10, 40, 0)" }, { backgroundColor: "rgba(4, 10, 40, .6)" }], { duration: 350, easing: "ease-out" });
    c.animate([
      { transform: `translate(${dx}px,${dy}px) scale(${a.width / b.width},${a.height / b.height})`, opacity: 1 },
      { transform: "translate(0,-14px) rotate(-4deg) scale(1.03)", offset: 0.72 },
      { transform: "none", opacity: 1 },
    ], { duration: 700, easing: "cubic-bezier(.3,.7,.3,1)" });
  }
  // 표지를 누르면 책이 펼쳐진다 — 표지가 오른쪽 쪽 자리로 옮겨 가 책등을 축으로 왼쪽으로 넘어가고, 그 뒷면이 왼쪽 쪽이 된다.
  // 넓은 화면에서만(좁으면 한 쪽씩 세로로 놓여 넘길 책등이 없다)
  function openBook() {
    const rd = $("reader"), c = $("rd-cover"), bk = rd.querySelector(".book");
    const done = () => {
      rd.classList.remove("opening", "cover"); bk.classList.remove("fresh"); void bk.offsetWidth; bk.classList.add("fresh");
      caption("read"); $("rd-close").focus();
    };
    if (!MOVE || innerWidth <= 760) return done();
    rd.classList.add("opening");
    const [L, R] = bk.querySelectorAll("section"), half = R.getBoundingClientRect().width / 2, P = "perspective(1800px)";
    const o = { duration: 1050, easing: "cubic-bezier(.45,.05,.3,1)" };
    c.animate([{ transform: `${P} translateX(0) rotateY(0)` }, { transform: `${P} translateX(${half}px) rotateY(0)`, offset: 0.3 }, { transform: `${P} translateX(${half}px) rotateY(-180deg)` }], o);
    L.animate([{ transform: `${P} rotateY(180deg)` }, { transform: `${P} rotateY(180deg)`, offset: 0.3 }, { transform: `${P} rotateY(0)` }], o);
    R.animate([{ opacity: 0 }, { opacity: 0, offset: 0.28 }, { opacity: 1, offset: 0.32 }, { opacity: 1 }], o).onfinish = done;
  }
  $("rd-cover").onclick = openBook;

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
  function closeReader() { document.querySelectorAll(".front").forEach((f) => (f.style.visibility = "")); $("reader").style.animation = $("rd-cover").style.animation = ""; $("reader").classList.remove("on"); st.reading = null; caption(st.results ? "search" : st.answer ? "ask" : "lib"); setHash(st.answer ? "lib-ask" : "lib"); lastFocus?.focus?.(); }
  $("rd-close").onclick = closeReader;
  $("reader").addEventListener("click", (e) => { if (e.target === $("reader")) closeReader(); });

  // ── 내 배움 (claude-drafted: 2026-10-18, F-05 — PRD 2-7 "내용들은 서재에서 확인이 가능하도록 / 오버레이에서는 간단하고 필요한 내용만, 자세한건 서재로") ──
  // 오버레이의 '내 배움' 탭이 보여 주던 지나온 단계 · 배운 말 · 확정한 설계도를 여기서 본다. 책장의 더미 책과 달리 이 브라우저에 남은 내비게이터 기록이다(learn.js).
  // 기록이 없거나 못 읽으면(사생활 보호 창 등) 빈 안내를 보인다
  const NAV_HOME = NAV;   // 이어 하기 — 주소 끝 없이 열면 내비게이터가 남은 기록에서 이어 간다
  const explain = (t) => (window.NavGlossary ? window.NavGlossary.explain(t) : "");
  function savedLearn() {
    let store = null;
    try { store = window.localStorage; } catch { store = null; }
    return window.LibLearn.read(store);
  }
  function openLearn() {
    lastFocus = document.activeElement;
    const d = savedLearn(), none = (t) => `<p class="lr-none">${t}</p>`;
    $("lr-seal").innerHTML = seal(d.empty ? "idle" : "happy", 72);
    $("lr-sub").textContent = d.empty ? "아직 쌓인 기록이 없어요"
      : `${d.project ? `${d.project} · ` : ""}${d.since ? `${d.since.replaceAll("-", ".")}부터 ` : ""}이 브라우저에 남은 기록이에요${d.practice ? " · 연습용 예시로 쌓았어요" : ""}`;
    $("lr-body").innerHTML = d.empty
      ? `<div class="lr-empty"><b>아직 쌓인 배움이 없어요</b><span>작업 화면(내비게이터)에서 할 일을 마치거나 설계도를 확정하면, 지나온 단계 · 배운 말 · 설계도가 여기 모여요.</span>
          <a class="pillbtn pri" href="${NAV_HOME}">작업 화면에서 시작하기 →</a></div>`
      : `<div class="tiles lr-tiles">${[["마친 단계", `${d.history.length}개`], ["배운 말", `${d.learned.length}개`], ["확정한 설계도", `${d.docs.length}개`]]
          .map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div>
        ${d.finished ? `<p class="lr-done">여덟 단계를 끝까지 왔어요!</p>` : ""}
        <div class="lr-grid">
          <section><h3>지나온 단계</h3>${d.history.length ? `<ol class="lr-path">${d.history.map((x) => `<li>${esc(x.text)}</li>`).join("")}</ol>` : none("아직 없어요. 한 단계를 마치면 여기 남아요.")}
            <h3>내가 확정한 설계도</h3>${d.docs.length ? d.docs.map((x) => `<details class="lr-doc"><summary>${x.stage}단계${x.name ? ` · ${esc(x.name)}` : ""}${x.at ? ` · ${esc(x.at)}` : ""}</summary><pre>${esc(x.text)}</pre></details>`).join("")
              : none("설계도를 확정하면 여기 모여요.")}</section>
          <section><h3>배운 말</h3>${d.learned.length ? `<ul class="lr-terms">${d.learned.map((x) => `<li><b>${esc(x.term)}</b>${explain(x.term) ? `<span>${esc(explain(x.term))}</span>` : ""}${
              x.text ? `<small>만난 곳 · ${esc(x.text)}</small>` : ""}</li>`).join("")}</ul>` : none("할 일을 하나씩 마치면, 전문가들이 부르는 이름을 여기 모아 드려요.")}</section>
        </div>
        <a class="pillbtn lr-back" href="${NAV_HOME}">← 작업 화면으로 돌아가 이어 하기</a>`;
    show("lib"); $("learn").classList.add("on"); caption("learn"); setHash("lib-learn"); $("lr-close").focus();
  }
  function closeLearn() { $("learn").classList.remove("on"); caption("lib"); setHash("lib"); lastFocus?.focus?.(); }
  $("learn-btn").onclick = openLearn;
  $("lr-close").onclick = closeLearn;
  $("learn").addEventListener("click", (e) => { if (e.target === $("learn")) closeLearn(); });

  // ── 키보드: Esc는 한 겹씩 닫고, /는 찾기 ──
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ($("learn").classList.contains("on")) return closeLearn();
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
    if (h === "lib-dive") return arrive();
    if (h === "lib-dive-learn") return arrive(openLearn);   // 내비게이터의 "서재에서 자세히 보기" — 물속으로 들어온 뒤 내 배움(F-05)
    if (h === "lib-hover") { go("lib"); return drawArcs("f1"); }
    if (h === "lib-review") { go("lib"); return openReview(); }
    if (h === "lib-learn") { go("lib"); return openLearn(); }
    if (h.startsWith("lib-bound-")) return bound(h.slice(10));
    if (h.startsWith("lib-open-")) { go("lib"); return openReader(h.slice(9), { cover: false }); }
    if (h.startsWith("lib-q=")) { go("lib"); spot.set(decodeURIComponent(h.slice(6))); return $("q").focus(); }
    if (h.startsWith("lib-")) { go("lib"); return openReader(h.slice(4)); }
    go("hall");
  }
  // 내비게이터의 "내 서고 들어가기"로 물속에서 넘어왔을 때 — 서고가 다 읽히면 물이 위로 빠지고 플로로가 점프해 시작을 알린다(../navigator/dive.js)
  // then: 다 올라온 뒤 할 일(내 배움 열기 등)
  function arrive(then) {
    go("lib"); setHash("lib");
    if (!window.FloeDive) { document.documentElement.classList.remove("dive-in"); return then?.(); }
    const say = $("floro-say"), q = (s) => document.querySelector(s);
    say.style.visibility = "hidden";
    window.FloeDive.arrive({
      cover: $("dive-cover"), seal: $("lib-seal"),
      layers: [[$("sky"), 6], [q(".arches"), 26], [q(".floor"), 18], [$("s-lib"), 20]],
      done: () => {
        $("lib-seal").innerHTML = seal("happy", SEAL);
        say.textContent = "서고에 온 걸 환영해요! 지난 책을 같이 찾아봐요.";
        say.style.visibility = ""; say.classList.add("hello");
        caption("arrive");
        then?.();
      },
    });
  }
  fromHash();
})();
