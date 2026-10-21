// claude-drafted: 2026-10-17 — 도서관 시안의 동작. 저장·서버·AI 호출 없음 — 더미 데이터(books.js)를 화면 안에서만 바꾼다.
// 장면: ① 입구(큰 책) → 도서관 두 가지 고르기 → ③ 플로로의 얼음 서고 → 펼친 책 · 전체 돌아보기.
// 2026-10-19(이재엽): '내 배움'(learn.js) · 역량 지도(skills.js)를 지웠고, 지식 은하(sky.html)는 들어가는 길을 막았다(코드는 남김 — 추후 작업).
// 같은 날: 작업 화면 위 위젯(지금·단계 지도·한곳에서 보기·도서관 탭)은 내비게이터(../navigator/app.js)의 탭으로 옮겼다 — 같은 화면이 둘이 되지 않게.
//   그쪽에서 "한 권의 책으로 엮기"를 누르면 #lib-bound-<id>로 이 화면에 와서 책장에 꽂힌다. 열어 둔 책 목록(D.OPEN)은 두 화면이 같이 읽는다.
// 2026-10-19(실사용): 내비게이터 기록이 있으면 열어 둔 책에 '내 책'을 더하고, "예시 책 지우기"(HIDE_KEY)를 눌렀으면 예시 책 · 레퍼런스 · 물어볼 것을 비운다(my-books.js).
//   그때 '오늘'은 시안의 고정 날짜가 아니라 실제 오늘이다. 주소 끝 &noex는 이 화면만 예시 없이(저장하지 않음). 책이 하나도 없어도 서고 · 전체 돌아보기가 멈추지 않는다.
(function () {
  const D = window.LibData, Seal = window.NavSeal, BV = window.FloeBookView, Shelves = window.FloeShelves;   // BV — 책 보기 설정(C-9 · C-3), Shelves — 내가 만드는 책장(C-21, 2026-10-20)
  const NAV = "../navigator/index.html";
  const $ = (id) => document.getElementById(id);
  // 내 책 · 예시 책 지우기 — 화면을 그리기 전에 데이터에 적용한다. 저장소를 못 쓰면(사생활 보호 창) 예시 그대로
  const Mine = window.FloeMine, NOEX = /(^|&)noex(&|$)/.test(location.hash.slice(1));
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  const mine = Mine ? Mine.read(storage) : { book: null, hidden: false };
  const exHidden = NOEX || mine.hidden;
  if (Mine) Mine.apply(D, { book: mine.book, hidden: exHidden });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const seal = (mood, size, opts) => (Seal ? Seal.svg(mood, size, opts) : "");
  // 배운 말 풀이(F-10, FR-13을 서재에도) — 풀이가 있는 말(EARS · MoSCoW …)은 버튼이 되고, 누르면 그 자리에 쉬운 말 한 줄. 없으면 그냥 글
  const termHtml = (text, cls = "") => {
    const f = window.NavGlossary && window.NavGlossary.find(text);
    if (!f) return `<span${cls ? ` class="${cls}"` : ""}>${esc(text)}</span>`;
    return `<button type="button" class="${cls ? `${cls} ` : ""}term" data-term aria-expanded="false">${esc(text)}<span class="term-line" role="note">${esc(f.line)}</span></button>`;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-term]");
    document.querySelectorAll('[data-term][aria-expanded="true"]').forEach((x) => { if (x !== b) x.setAttribute("aria-expanded", "false"); });
    if (b) { e.stopPropagation(); b.setAttribute("aria-expanded", String(b.getAttribute("aria-expanded") !== "true")); }
  }, true);

  // 화면 안에서만 바뀌는 상태 (새로 고침하면 처음으로)
  const st = { open: D.OPEN.map((b) => ({ ...b })), shelved: [], answer: null, reading: null, renaming: null };
  // C-21(2026-10-20 이재엽 버튼): 책장은 내가 만든다 — 처음엔 '분류 안 함' 하나, 개수 제한 없음, 예시 책도 같은 목록. 이 브라우저에 저장(shelves.js). 책을 지우는 길은 없다
  const NONE = Shelves ? Shelves.NONE : "none";
  let shelves = Shelves ? Shelves.read(storage) : { list: [{ id: NONE, name: "분류 안 함" }], books: {} };
  const saveShelves = (next) => { shelves = next; if (Shelves) Shelves.write(storage, shelves); };
  const shelfOf = (id) => (Shelves ? Shelves.shelfOf(shelves, id) : NONE);
  const shelfName = (id) => (shelves.list.find((x) => x.id === id) || shelves.list[0]).name;

  // ── 배경 별 ──
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  $("sky").innerHTML = Array.from({ length: 110 }, () => `<i style="left:${rnd() * 100}%;top:${rnd() * 80}%;opacity:${(rnd() * .6 + .2).toFixed(2)};transform:scale(${(rnd() * 1.2 + .4).toFixed(2)})"></i>`).join("");

  // ── 장면 전환 ── (2026-10-19 이재엽 "서재에 왜 아직도 온보딩 영상에 남아있는 잔재들이": 영상의 장면 설명 자막(아래 띠)과 정해 둔 질문 단추를 뺐다)
  function show(screen) { for (const s of ["hall", "lib"]) $(`s-${s}`).classList.toggle("on", s === screen); }
  function setHash(h) { history.replaceState(null, "", `#${h}`); }
  // 작업 화면 위 위젯은 내비게이터에 있다 — 열어 둔 책은 그쪽 도서관 탭에서 펼친다
  const toNav = (hash) => { location.href = `${NAV}#${hash}`; };

  function go(where, arg) {
    $("spread").classList.remove("on"); $("reader").classList.remove("on"); $("review").classList.remove("on");
    if (where === "hall") { show("hall"); setHash("hall"); $("tome").focus(); return; }
    if (where === "pick") { show("hall"); $("spread").classList.add("on"); setHash("pick"); $("spread").querySelector(".go").focus(); return; }
    if (where === "lib") { show("lib"); spot.clear(); spot.close(); st.answer = arg === "ask" ? D.ASK.find((a) => a.refs) || null : null; renderLib(); setHash(arg === "ask" ? "lib-ask" : "lib"); return; }
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); });
  // 작업 화면으로 돌아가기(2026-10-20 이재엽 "서재에서 오버레이로 넘어갈 때 애니메이션") — 물이 차오르고 플로로가 잠수한 뒤 내비게이터가 물속에서 떠오른다(주소 끝 &back → dive.js surface)
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a.lib-out, a.go[href*="navigator/index.html"]');
    // 움직임 줄이기도 같은 길로(&back) — leave()가 움직임 없이 바로 넘긴다. 전에는 &back 없이 가서 내비게이터가 장면(#tab=lib)으로 읽어 바이브 코딩이 됐다(F-36)
    if (!a || !window.FloeDive || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const seal = $("s-lib").classList.contains("on") ? $("lib-seal") : $("hall-seal");
    window.FloeDive.leave(`${a.getAttribute("href")}&back`, seal);
  });
  $("tome").onclick = () => go("pick");
  $("spread").addEventListener("click", (e) => { if (e.target === $("spread")) go("hall"); });

  // ── ① 입구 ──
  $("hall-seal").innerHTML = seal("happy", 150);
  // 얼음판 위 플로로(2026-10-17 자연스럽게) — 얼음판과 함께 둥실 뜨고(index.html의 .ice.bob), 눈은 마우스를 따라가며,
  // 12~20초마다 배로 통통(물범 걸음, ../navigator/seal.css)이나 두리번 중 하나를 한다. 움직임 줄이기면 하지 않는다
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let raf = 0, point = null, target = null;
    document.addEventListener("mousemove", (e) => {
      point = { x: e.clientX, y: e.clientY }; target = null;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; Seal.follow(document.body, point); });
    });
    // 앱 안이면 창 밖의 커서도(2026-10-19 — ../electron/preload.js onCursor). 1초에 30번만 오니 받은 점으로 바로 뛰지 않고 프레임마다 미끄러져 간다(Seal.glide, F-27)
    if (window.floeApp && window.floeApp.onCursor) {
      let glideRaf = 0, last = 0;
      const step = (now) => {
        glideRaf = 0;
        if (!target) return;
        const g = Seal.glide(point, target, now - last); last = now;
        point = { x: g.x, y: g.y }; Seal.follow(document.body, point);
        if (g.done) target = null; else glideRaf = requestAnimationFrame(step);
      };
      window.floeApp.onCursor((p) => { target = p; if (!glideRaf) { last = performance.now(); glideRaf = requestAnimationFrame(step); } });
    }
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
    // 꽂는 책장은 고르지 않으면 '분류 안 함'(C-21) — 펼친 책의 '책장' 고르기로 옮긴다. 잇는 선(links)은 없앴다
    D.SHELF.push({ id: fid, started: p.started, days: dayOf(p.started), title: p.title, date: D.TODAY.slice(5).replace("-", "."), tags, links: [],
      steps: p.steps, insights: p.insights || [], made: p.made || [], marks: p.bookmarks.length });
    st.open = st.open.filter((b) => b.id !== id); st.shelved.push({ ...p, bound: fid });
    return fid;
  }
  // 내비게이터에서 "한 권의 책으로 엮기"를 누르고 넘어온 길(#lib-bound-<id>) — 꽂고, 알리고, 표지를 연다
  function bound(id) {
    const fresh = st.open.some((b) => b.id === id), fid = bindInto(id);
    if (!fid) return go("lib");
    go("lib"); setHash(`lib-${fid}`);
    if (fresh) toast(`‘${D.SHELF.find((b) => b.id === fid).title}’ 한 권 완성! ‘${shelfName(NONE)}’에 꽂았어요 — 펼친 책에서 책장을 고를 수 있어요`);
    setTimeout(() => openReader(fid), fresh ? 500 : 0);
  }
  for (const id of readBound()) bindInto(id);   // 지난번에 엮은 책은 처음부터 책장에

  // ── ③ 내 서고 ──
  const SEAL = 190;   // 가운데 플로로 크기(2026-10-18 UI를 키우며 170 → 190)
  // 책장(C-21): 처음엔 '분류 안 함' 하나. 내가 만든 책장은 왼쪽 · 오른쪽 열에 번갈아 흐른다(가운데는 플로로). 고정 책장 넷('기록 · 폼' 등)과 떠 있는 배운 말 표 · 잇는 선은 2026-10-20에 뺐다
  function renderLib() {
    const marks = D.SHELF.reduce((n, b) => n + marksOf(b), 0);
    $("lib-count").textContent = `끝낸 프로젝트 ${D.SHELF.length}권 · 책갈피 ${marks}장 · 열어 둔 책 ${st.open.length}권 · 책장 ${shelves.list.length}개`;
    const stage = $("stage"), wrap = $("shelves");
    wrap.innerHTML = "";
    const groups = Shelves ? Shelves.groups(shelves, D.SHELF) : [{ shelf: shelves.list[0], books: D.SHELF }];
    groups.forEach((g, i) => {
      let h = 7; const spines = (k) => Array.from({ length: k }, () => `<i class="spine" style="height:${84 + ((h = (h * 37) % 41))}px"></i>`).join("");
      const mine = g.shelf.id !== NONE;
      const box = document.createElement("div"); box.className = "shelfbox"; box.dataset.shelf = g.shelf.id; box.style.gridColumn = i % 2 ? "3" : "1";
      const label = st.renaming === g.shelf.id
        ? `<form class="shelf-form" data-rename="${esc(g.shelf.id)}"><input value="${esc(g.shelf.name)}" maxlength="20" aria-label="책장 이름"><button class="pillbtn glass" type="submit">저장</button><button class="pillbtn glass" type="button" data-act="shelf-rename-cancel">닫기</button></form>`
        : `<span>${esc(g.shelf.name)}</span><small>${g.books.length}권</small>${mine ? `<button type="button" class="lnk" data-act="shelf-rename" data-id="${esc(g.shelf.id)}">이름 바꾸기</button><button type="button" class="lnk" data-act="shelf-remove" data-id="${esc(g.shelf.id)}">지우기</button>` : ""}`;
      box.innerHTML = `<div class="row">${spines(mine ? 2 : 3)}${g.books.map((b) => `<button class="front" data-read="${b.id}" aria-label="${esc(b.title)} 펼치기">${esc(b.title)}${b.sub ? ` ${esc(b.sub)}` : ""}</button>`).join("")}${spines(mine ? 3 : 4)}</div>
        <div class="board"></div><div class="label">${label}</div>`;
      wrap.appendChild(box);
    });
    const f = wrap.querySelector("form[data-rename] input"); if (f) { f.focus(); f.select(); }
    const last = st.shelved[st.shelved.length - 1];
    $("slot").innerHTML = last ? `방금 꽂은 책<br><b style="color:var(--ink)">${esc(last.title)}</b>` : `지금 쓰는 책 ${st.open.length}권<br>끝내면 여기 꽂혀요`;
    // 머리 표시 · 예시 책 단추(2026-10-19) — 예시가 보이면 "예시 데이터예요", 지웠으면 "내 기록이에요"
    document.querySelector(".lib-head .fake").textContent = exHidden ? "내 기록 · 예시 없음" : mine.book ? "예시 + 내 책 · 시연용" : "예시 데이터예요 · 시연용";
    $("ex-toggle").textContent = exHidden ? "예시 책 다시 보기" : "예시 책 지우기";
    $("ex-toggle").title = exHidden ? "예시(더미) 책 · 레퍼런스를 다시 꺼내요" : "예시(더미) 책 · 레퍼런스를 숨기고 내 기록만 봐요";
    stage.querySelectorAll("[data-read]").forEach((b) => { b.onclick = () => openReader(b.dataset.read, { from: b }); });
    st.results = st.search ? window.LibSearch.searchLibrary(st.search, D) : null;
    const none = st.results && !st.results.length;
    $("lib-seal").innerHTML = seal(none ? "think" : st.answer ? "look" : "idle", SEAL);
    $("floro-say").textContent = none ? `서고에는 ‘${st.search.trim()}’ 이야기가 없어요. 다른 말로 찾아볼까요?`
      : st.results ? `찾았어요! 검색창 밑에 ${st.results.length}곳을 펼쳐 뒀어요.` : st.answer ? "찾았어요! 오른쪽에 펼쳐 둘게요."
      : !D.SHELF.length ? (st.open.length ? "아직 꽂힌 책이 없어요. 지금 쓰는 책을 끝내면 여기 꽂혀요." : "아직 책이 없어요. 작업 화면에서 만드는 걸 보여 주면 내 책이 생겨요.")
      : "기억 안 나는 건 위 검색창에 적어 봐요.";
    renderAnswer(); litFound();
  }
  // 책장 만들기 · 이름 바꾸기 · 지우기(C-21) — 지우면 그 안의 책은 '분류 안 함'으로(shelves.js remove). 이름 바꾸기는 그 자리에서 입력
  $("shelf-add").onclick = () => { const f = $("shelf-form"); f.hidden = !f.hidden; $("shelf-add").setAttribute("aria-expanded", String(!f.hidden)); if (!f.hidden) $("shelf-name").focus(); };
  $("shelf-cancel").onclick = () => { $("shelf-form").hidden = true; $("shelf-add").setAttribute("aria-expanded", "false"); };
  $("shelf-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!Shelves) return;
    const name = $("shelf-name").value, next = Shelves.add(shelves, name);
    if (next === shelves) { toast("책장 이름을 적어 주세요"); return; }
    saveShelves(next); $("shelf-name").value = ""; $("shelf-form").hidden = true; $("shelf-add").setAttribute("aria-expanded", "false");
    renderLib(); toast(`‘${next.list[next.list.length - 1].name}’ 책장을 만들었어요 — 펼친 책에서 옮겨 꽂아요`);
  });
  $("stage").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b || !Shelves) return;
    const id = b.dataset.id;
    if (b.dataset.act === "shelf-rename") { st.renaming = id; renderLib(); }
    if (b.dataset.act === "shelf-rename-cancel") { st.renaming = null; renderLib(); }
    if (b.dataset.act === "shelf-remove") { const n = (Shelves.groups(shelves, D.SHELF).find((g) => g.shelf.id === id) || { books: [] }).books.length; saveShelves(Shelves.remove(shelves, id)); renderLib(); toast(n ? `책장을 지웠어요 — 책 ${n}권은 ‘${shelfName(NONE)}’으로 옮겼어요` : "책장을 지웠어요"); }
  });
  $("stage").addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-rename]"); if (!f || !Shelves) return;
    e.preventDefault();
    const next = Shelves.rename(shelves, f.dataset.rename, f.querySelector("input").value);
    if (next !== shelves) saveShelves(next);
    st.renaming = null; renderLib();
  });
  $("refs-btn").onclick = () => { spot.clear(); spot.close(); st.answer = D.ASK.find((a) => a.refs) || null; renderLib(); };
  // 예시 책 지우기 / 다시 보기 — 저장하고 같은 장면으로 다시 연다(화면 안 상태가 예시 책을 품고 있어서 다시 그리는 것보다 확실하다). &noex로 연 화면은 저장만 바꾼다
  $("ex-toggle").onclick = () => {
    if (!Mine) return;
    Mine.writeHidden(storage, !exHidden);
    const h = location.hash.slice(1).replace(/(^|&)noex(?=&|$)/, "").replace(/^&/, "");
    location.hash = h || "lib";
    location.reload();
  };

  // ── 서고에서 찾기 — 결과는 검색창 바로 밑에 펼친다(spotlight.js). 오른쪽 열은 "어디에 있는지" ──
  const KIND = { shelf: "끝낸 책", open: "열어 둔 책", ref: "레퍼런스" };
  const WHERE = (x) => x.kind === "shelf" ? `서고 › ${shelfName(shelfOf(x.id))} 책장` : x.kind === "open" ? "작업 화면 › 내비게이터 도서관 탭" : "서고 › 레퍼런스 서가";
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

  // 찾은 책 비추기 — 검색 결과의 책만 금빛(잇는 선 · 배운 말 답은 2026-10-20 C-21로 뺐다)
  const litFound = () => document.querySelectorAll(".front").forEach((f) => f.classList.toggle("lit", !!st.results && st.results.some((x) => x.kind === "shelf" && x.id === f.dataset.read)));

  function renderAnswer() {
    const box = $("answer"), a = st.answer;
    if (!a) { box.hidden = true; return; }
    box.hidden = false;
    if (a.refs) {
      box.innerHTML = `<h3>${seal("happy", 28)}플로로가 찾은 레퍼런스 ${D.REFS.length}개</h3><ul>${D.REFS.map((r) => `<li><button data-read="${r.used[0]}"><i></i><span>${esc(r.title)} · ${esc(r.kind)}</span><small>${esc(r.line)} — 쓰인 책: ${r.used.map((u) => esc(D.SHELF.find((b) => b.id === u).title)).join(", ")}</small></button></li>`).join("")}</ul>
        <div class="foot">링크와 한 줄만 모아 둬요. 본문은 열 때 원래 자리에서 가져와요.</div>`;
    } else { box.hidden = true; return; }   // 배운 말로 찾은 책 답은 뺐다(C-21)
    litFound();
    box.querySelectorAll("[data-read]").forEach((b) => (b.onclick = () => openReader(b.dataset.read)));
  }

  // ── 펼친 책 (영상 8번 장면) ──
  let lastFocus = null;
  const marksOf = (b) => b.marks || b.steps.length + b.insights.length;
  const ORD = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
  // 움직임을 쓸 수 있을 때만 — 책이 날아오고 펼쳐지는 것(2026-10-18, 목업 영상 40~42초)
  const MOVE = !matchMedia("(prefers-reduced-motion: reduce)").matches && typeof Element.prototype.animate === "function";
  // 끝낸 책(서고) 또는 열어 둔 책(내비게이터 도서관 탭의 '전체 화면' 보기, 2026-10-20 C-3)을 찾는다
  const bookOf = (id) => D.SHELF.find((x) => x.id === id) || st.open.find((x) => x.id === id) || D.OPEN.find((x) => x.id === id) || null;
  const isFin = (b) => D.SHELF.includes(b);
  let rdPanel = false, rdTab = "";   // 펼친 책의 보기 설정 판을 펼쳤나 · 탭 구조에서 고른 칸
  function openReader(id, { cover = true, from = null } = {}) {
    const b = bookOf(id); if (!b) return;
    const fin = isFin(b), marks = fin ? marksOf(b) : (b.bookmarks || []).length;
    if (!$("reader").classList.contains("on")) lastFocus = document.activeElement;
    st.reading = id;
    // 표지 — 영상 8번 장면: ○번째 책 · 기간 · 8단계 · 책갈피 수 · 완주 도장. 누르거나 Enter로 넘긴다. 열어 둔 책은 '지금 N단계'
    if (fin) {
      const order = [...D.SHELF].sort((x, y) => x.started.localeCompare(y.started)).findIndex((x) => x.id === id);
      const end = new Date(Date.parse(b.started) + (b.days - 1) * 864e5).toISOString().slice(0, 10);
      $("rd-cover").innerHTML = `<span class="kick">플로로의 얼음 서고 · ${ORD[order] || order + 1}번째 책</span><b>${esc(b.title)}${b.sub ? ` ${esc(b.sub)}` : ""}</b><i></i>
        <span>${b.started.replaceAll("-", ".")} — ${end.slice(5).replace("-", ".")}</span><span>8단계 · 책갈피 ${marks}장</span><span class="stamp">${b.date}<br>완주</span><em>눌러서 펼치기</em>`;
      $("rd-foot").textContent = `${b.days}일 · 단계 8개 · 책갈피 ${marks}장 · 만든 것 ${b.made.length}개`;
      $("rd-stamp").innerHTML = `${b.date}<br>완독`;
    } else {
      $("rd-cover").innerHTML = `<span class="kick">열어 둔 책${b.mine ? " · 내 책" : b.example ? " · 예시 책" : ""}</span><b>${esc(b.title)}</b><i></i>
        <span>${String(b.started || "").replaceAll("-", ".")}부터</span><span>지금 ${b.stage + 1}단계 · ${esc(D.STAGES[b.stage] || "")}</span><span class="stamp">${b.stage + 1}단계<br>진행 중</span><em>눌러서 펼치기</em>`;
      $("rd-foot").textContent = `지금 ${b.stage + 1}단계 ${D.STAGES[b.stage] || ""} · 책갈피 ${marks}장 · 할 일 ${(b.todos || []).filter((t) => t.done).length}/${(b.todos || []).length} · 덮고 꽂는 건 작업 화면의 도서관 탭에서`;
      $("rd-stamp").innerHTML = `${b.stage + 1}단계<br>진행 중`;   // 단계 번호는 화면에 1~8(C-22, 2026-10-21) — 자료의 stage(0~7)는 그대로
    }
    $("reader").classList.toggle("cover", cover);
    $("rd-title").textContent = `${b.title}${b.sub ? ` ${b.sub}` : ""} — ${fin ? "단계마다 내가 정한 것" : "지금까지 정한 것"}`;
    renderBook(b);
    $("rd-links-h").hidden = true; $("rd-links").hidden = true;   // 이어진 책(배운 말로 잇기)은 뺐다 — C-21
    // 책장 고르기(C-21) — 끝낸 책만. 고르면 바로 그 책장으로 옮기고 서고를 다시 그린다
    $("rd-shelf-row").hidden = !fin;
    if (fin) $("rd-shelf").innerHTML = shelves.list.map((s) => `<option value="${esc(s.id)}" ${shelfOf(b.id) === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("");
    show("lib"); $("reader").classList.add("on"); setHash(`lib-${id}`);
    (cover ? $("rd-cover") : $("rd-close")).focus();
    if (cover && from) flyFrom(from);
  }
  // 펼친 책의 두 쪽 — 보기 설정(book-view.js)대로. 왼쪽은 지나온 단계(단계 이름과 함께), 오른쪽은 나머지 칸 · 보기 설정 판. 세션별이면 오른쪽에 날짜 묶음만
  function renderBook(b) {
    const s = BV ? BV.read(storage) : null;
    if (!BV) { $("rd-left").innerHTML = `<ul class="bv-list">${(b.steps || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`; $("rd-right").innerHTML = ""; return; }
    const session = s.view === "session" && BV.sessions(b, s).length > 0;
    $("rd-kick").textContent = session ? "작업한 날짜별로" : "지나온 단계";
    const left = session ? "" : BV.bodyHTML(b, s, { only: ["steps"], stages: isFin(b) ? D.STAGES : null });
    $("rd-left").innerHTML = left || `<p class="bv-empty">${session ? "오른쪽에 날짜별로 모았어요" : "이 칸은 꺼 두었어요 — 보기 설정에서 켤 수 있어요"}</p>`;
    $("rd-view").setAttribute("aria-expanded", String(rdPanel));
    $("rd-right").innerHTML = `${rdPanel ? BV.panelHTML(s) : ""}${BV.bodyHTML(b, s, session ? {} : { except: ["steps"], tab: rdTab })}`;
  }
  // 보기 설정 손잡이(data-bv) — 섬의 도서관 탭과 같은 손잡이. 고르면 바로 저장하고 펼친 책을 다시 그린다. '짧게'를 고르면 열어 둔 책은 작업 화면의 도서관 탭으로
  $("rd-view").onclick = () => { rdPanel = !rdPanel; const b = bookOf(st.reading); if (b) renderBook(b); };
  $("reader").addEventListener("click", (e) => {
    const t = e.target.closest("[data-bv]");
    if (!t || !BV || t.dataset.bv === "field") return;
    const b = bookOf(st.reading); if (!b) return;
    if (t.dataset.bv === "tab") { rdTab = t.dataset.v; return renderBook(b); }
    const s = BV.choose(BV.read(storage), t.dataset.bv, t.dataset.v); BV.write(storage, s);
    if (t.dataset.bv === "size" && s.size === "short" && !isFin(b)) return toNav(`tab=lib&book=${b.id}`);
    renderBook(b);
  });
  $("reader").addEventListener("change", (e) => {
    if (!BV || e.target.dataset.bv !== "field") return;
    BV.write(storage, BV.toggle(BV.read(storage), e.target.dataset.v));
    const b = bookOf(st.reading); if (b) renderBook(b);
  });
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
      rd.classList.remove("opening", "cover"); bk.classList.remove("fresh"); void bk.offsetWidth; bk.classList.add("fresh"); $("rd-close").focus();
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
  $("rd-shelf").onchange = () => { if (!Shelves || !st.reading) return; saveShelves(Shelves.place(shelves, st.reading, $("rd-shelf").value)); renderLib(); toast(`‘${shelfName(shelfOf(st.reading))}’ 책장으로 옮겼어요`); };

  // ── 전체 돌아보기 — 끝낸 책과 열어 둔 책, 자주 쓴 배움, 되풀이한 인사이트 ──
  function openReview() {
    lastFocus = document.activeElement;
    const fin = D.SHELF, open = st.open, marks = fin.reduce((n, b) => n + marksOf(b), 0) + open.reduce((n, b) => n + b.bookmarks.length, 0);
    // 책이 하나도 없을 수 있다(예시를 지우고 아직 시작 전) — 그래도 멈추지 않고 빈 안내를 보인다(2026-10-19)
    const first = [...fin, ...open].map((b) => b.started).filter(Boolean).sort()[0];
    $("rv-seal").innerHTML = seal(fin.length || open.length ? "happy" : "idle", 72);
    $("rv-sub").textContent = first ? `${first.replaceAll("-", ".")}부터 오늘(${D.TODAY.replaceAll("-", ".")})까지 — 여기까지 왔어요!`
      : "아직 책이 없어요 — 작업 화면에서 만드는 걸 보여 주면 첫 책이 생겨요.";
    $("rv-tiles").innerHTML = [["끝낸 책", `${fin.length}권`], ["열어 둔 책", `${open.length}권`], ["모은 책갈피 (열어 둔 책 포함)", `${marks}장`], ["돌아보기까지 완주", `${fin.length}번`]]
      .map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("");
    const rows = [...fin.map((b) => ({ b, done: 8, fin: true })), ...open.map((b) => ({ b, done: b.stage + (b.stage === 7 ? 1 : 0), fin: false }))]
      .sort((x, y) => x.b.started.localeCompare(y.b.started));
    $("rv-paths").innerHTML = rows.map(({ b, done, fin }) => `<li><button data-rv="${fin ? "f" : "o"}:${b.id}">
        <span class="nm">${esc(b.title)}${b.sub ? ` ${esc(b.sub)}` : ""}</span>
        <span class="dots" aria-label="${fin ? "8단계 완주" : `지금 ${b.stage + 1}단계`}">${D.STAGES.map((_, i) => `<i class="${i < done ? "on" : i === b.stage && !fin ? "cur" : ""}"></i>`).join("")}</span>
        <span class="st">${fin ? `완주 · ${b.date}` : `${b.stage + 1}단계 ${D.STAGES[b.stage]} · 내비게이터에서`}</span></button></li>`).join("");
    // 끝낸 책은 여기서 펼치고, 열어 둔 책은 내비게이터로 — 이 화면의 책(내 책, 예시가 보일 때는 첫 책 s1)은 그쪽 단계 지도, 나머지는 도서관 탭
    $("rv-paths").querySelectorAll("[data-rv]").forEach((x) => (x.onclick = () => {
      const [k, id] = x.dataset.rv.split(":");
      const b = open.find((o) => o.id === id);
      if (k === "f") { closeReview(false); openReader(id); } else toNav((b && b.mine) || (id === "s1" && !mine.book) ? "tab=map" : `tab=lib&book=${id}`);
    }));
    $("rv-ins").innerHTML = fin.flatMap((b) => b.insights.map((t) => `<li>${esc(t)} <small>— ${esc(b.title)}</small></li>`)).slice(0, 5).join("");
    $("review").classList.add("on"); setHash("lib-review"); $("rv-close").focus();
  }
  function closeReview(back = true) { $("review").classList.remove("on"); if (back) { setHash("lib"); lastFocus?.focus?.(); } }
  $("review-btn").onclick = openReview;
  $("rv-close").onclick = () => closeReview();
  $("review").addEventListener("click", (e) => { if (e.target === $("review")) closeReview(); });
  function closeReader() { document.querySelectorAll(".front").forEach((f) => (f.style.visibility = "")); $("reader").style.animation = $("rd-cover").style.animation = ""; $("reader").classList.remove("on"); st.reading = null; setHash(st.answer ? "lib-ask" : "lib"); lastFocus?.focus?.(); }
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
    const h = location.hash.slice(1).replace(/(^|&)noex(?=&|$)/, "").replace(/^&/, "");   // &noex(예시 없이)는 위에서 읽었다 — 장면 이름만 남긴다
    if (h === "pick") return go("pick");
    if (h.startsWith("desk")) return toNav("tab=lib");   // 옛 주소(작업 화면 위젯) — 내비게이터로
    if (h === "lib") return go("lib");
    if (h === "lib-ask") return go("lib", "ask");
    if (h === "lib-dive") return arrive();
    if (h.startsWith("lib-dive-open-")) return arrive(() => openReader(h.slice(14), { cover: false }));   // 도서관 탭의 '전체 화면' 보기(C-3, 2026-10-20)
    if (h === "lib-dive-learn") return arrive();   // 옛 주소(내 배움, 2026-10-19 지움) — 서고로
    if (h === "lib-review") { go("lib"); return openReview(); }
    if (h === "lib-learn") return go("lib");   // 옛 주소(내 배움, 2026-10-19 지움)
    if (h.startsWith("lib-bound-")) return bound(h.slice(10));
    if (h.startsWith("lib-open-")) { go("lib"); return openReader(h.slice(9), { cover: false }); }
    if (h.startsWith("lib-q=")) { go("lib"); spot.set(decodeURIComponent(h.slice(6))); return $("q").focus(); }
    if (h.startsWith("lib-")) { go("lib"); return openReader(h.slice(4)); }
    go("hall");
  }
  // 내비게이터의 "내 서고 들어가기"로 물속에서 넘어왔을 때 — 서고가 다 읽히면 물이 위로 빠지고 플로로가 점프해 시작을 알린다(../navigator/dive.js)
  // then: 다 올라온 뒤 할 일
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
        then?.();
      },
    });
  }
  fromHash();
})();
