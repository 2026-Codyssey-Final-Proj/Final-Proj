  // ── 도서관(FR-8 위젯) — 서고 시안(../library)의 더미 책(books.js)과 마감 계산(schedule.js)을 같이 쓴다.
  // 같은 화면이 둘이 되지 않게 서고 시안의 작업 화면 위젯을 여기로 옮겼다(2026-10-17). 첫 책(s1)은 이 화면의 단계·할 일을 그대로 따른다.
  const L = () => window.LibData, SCH = () => window.Schedule;
  const LIB_URL = "../library/index.html";
  const libMissing = () => `<div class="libtab"><div class="doc-empty">${I.lib}<b>서고 데이터를 못 읽었어요</b><span>../library/books.js와 schedule.js가 같이 있어야 해요.</span></div></div>`;
  // 예시 책 숨기기/보이기(2026-10-19) — 데이터(window.LibData)에 적용한다. 서고 화면도 같은 열쇠를 읽어 같은 모습이 된다
  const applyEx = () => { if (M && L()) M.apply(L(), { hidden: exHidden, today: ymd() }); };
  applyEx();
  // 내 책 — 이 화면의 상태에서 그때그때 만든다(저장된 기록이 아니라 지금 상태). 진짜 AI 모드이거나 예시를 지웠을 때만 — 연습 모드에서 예시가 보일 때는 첫 예시(s1)가 이 화면을 따른다(시연 장면 그대로)
  const myBook = () => (M && st.j && (st.mode === "live" || exHidden) && !(st.libGone.includes(M.ME) && st.finished)
    ? M.fromState({ ...st, project: project(), at: Date.now() }, ymd()) : null);   // 이름은 위쪽 줄과 같은 것(연습이면 예시 이름)
  // 열어 둔 책 — 서고로 보낸 책은 빼고, 내 책이 있으면 맨 앞에. 내 책이 없으면(연습 · 예시 보임) 첫 예시 책이 지금 이 화면의 단계·할 일·확정한 설계도를 따른다
  function openBooks() {
    const mine = myBook(), meId = M ? M.ME : "me";
    const rest = L().OPEN.filter((b) => b.id !== meId && !st.libGone.includes(b.id)).map((b) => (!mine && b.id === "s1" && st.j
      ? { ...b, mine: true, stage: st.j.stage, todos: st.j.criteria.map((c) => ({ t: c.text, done: c.met })),
          decided: st.docs.length ? st.docs.map((d) => `${d.stage}단계 ${d.name} — ${d.at}에 확정`) : b.decided }
      : b));
    return mine ? [mine, ...rest] : rest;
  }
  const hasExamples = () => !!(M && L() && L().EXAMPLES && (L().EXAMPLES.OPEN || []).some((b) => !st.libGone.includes(b.id)));
  const isEx = (b) => !!(M && M.isExample(b));
  const bookDone = (b) => b.stage === 7 && b.todos.every((t) => t.done);
  const libSelected = () => openBooks().find((b) => b.id === st.libSel);
  const mmdd = (d) => d.slice(5).replace("-", "/");
  // 마감 칩 — 지남(금 간 얼음) · 오늘 · 3일 이내 · 여유. 마감이 없는 책(내 책)은 칩을 그리지 않는다
  const dueChip = (due) => { if (!due) return ""; const d = SCH().dueStatus(due, L().TODAY); return `<span class="due ${d.state}">${d.state === "late" ? "❄ " : ""}${mmdd(due)} · ${d.label}</span>`; };
  const coverBtn = (b, i) => `<button class="cover${isEx(b) ? " ex" : ""}" style="--tone:${b.tone}" data-act="lib-book" data-i="${i}" data-id="${b.id}" aria-label="${esc(b.title)}${isEx(b) ? " (예시 책)" : ""}, ${LB(b.stage)} ${esc(L().STAGES[b.stage])}, 책갈피 ${b.bookmarks.length}장">
    <span class="t">${esc(b.title)}</span><span class="s">${b.mine ? "이 화면 · " : ""}${LB(b.stage)} · ${esc(L().STAGES[b.stage])}</span>
    <span class="m"><span>▮ ${b.bookmarks.length}장</span>${isEx(b) ? '<span class="extag">예시</span>' : ""}${bookDone(b) ? '<span class="due ok">완주 · 엮기 대기</span>' : dueChip(b.dues && b.dues[b.stage])}</span></button>`;
  // 예시 책 지우기 / 다시 보기 — 지울 예시가 있을 때만, 다시 보기는 지운 뒤에만
  const exToggle = () => (!M ? "" : exHidden ? `<button class="b ghost" data-act="ex-show">예시 책 다시 보기</button>` : hasExamples() ? `<button class="b ghost" data-act="ex-hide" title="예시(더미) 책 · 레퍼런스를 숨기고 내 기록만 봐요">예시 책 지우기</button>` : "");
  // 책 탭(C-26, 2026-10-23) — 내 저장소 README를 받아 와 보여 주기만(고치는 곳은 README). 아래는 전부터 있던 이 화면의 책(단계 문서 · 확인할 먹이 — FR-3 · FR-15)
  // README 칸은 책을 고르지 않았을 때(책 탭의 첫 화면)만 — 단계 문서를 펼치면 그 책에 집중한다.
  //   서재를 잠시 뺀 동안은 열어 둔 책 목록(작은 서재)을 보이지 않고, 확인할 먹이와 이 프로젝트의 책 하나만 — "서재 없이 지금 프로젝트의 책 한 권"(C-26)
  // ── C-27 관문 계획서(2026-10-30 — gateplan.js): 단계마다 한 권 — 결과가 있는 단계와 지금 관문의 단계. 목차를 누르면 그 절로, 파일로도 받는다 ──
  //   글은 규칙으로(AI 없음). 가리기(sensitive.js)를 거친다. 어느 단계를 펼쳤나(st.gpSel)는 이 켜짐 동안만
  const GPL = window.FloeGatePlan;
  const gpStages = () => N.STAGES.map((s) => s.n).filter((n) => st.results[n] || (st.j && st.j.stage === n));
  const gpNow = (list = gpStages()) => (list.includes(st.gpSel) ? st.gpSel : list[list.length - 1]);   // 펼친 단계 — 고른 것, 없으면 마지막
  const gpBook = (n) => GPL.build(n, { results: st.results, tier: st.tier, hide: (t) => (window.NavSensitive ? window.NavSensitive.redact(t) : t) });
  function gatePlanBox() {
    if (!GPL) return "";
    const list = gpStages(); if (!list.length) return "";
    const sel = gpNow(list), b = gpBook(sel);
    return `<section class="gplan" aria-label="관문 계획서"><div class="stg">관문 계획서 — 지금까지 한 것과 다음에 할 것</div>
      <div class="gp-pick" role="group" aria-label="어느 단계">${list.map((n) => `<button type="button" class="b${n === sel ? " pri" : " ghost"}" data-act="gp-sel" data-i="${n}" aria-pressed="${n === sel}">${LB(n)}</button>`).join("")}</div>
      <h4>${esc(b.title)}</h4><nav class="gp-toc" aria-label="계획서 목차">${b.toc.map((t, k) => `<button type="button" class="lnk" data-act="gp-toc" data-v="${esc(t.id)}">${k + 1}. ${esc(t.title)}</button>`).join("")}</nav>
      ${b.sections.map((s, k) => `<article class="gp-sec" id="${esc(s.id)}" tabindex="-1"><h5>${k + 1}. ${esc(s.title)}</h5><ul>${s.rows.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></article>`).join("")}
      <div class="ob-foot"><button type="button" class="b" data-act="gp-file">파일로 받기 (.md)</button></div></section>`;
  }
  // ── C-24 공부 묶음(2026-10-30 — studypack.js): 고른 것(지금 단계 · 관문 계획서 · 용어 풀이 · 내 기록)을 파일 하나 + 질문 다섯으로 내려받는다 ──
  //   '더 공부하기'(용어 풀이 · 관문의 '아니요' 뒤 · 튜토리얼)에서 열린다(st.study — 이 켜짐 동안만). 가리기가 없으면 묶지 않는다(실패하면 닫힌 쪽).
  //   NotebookLM에는 보내지 않는다 — 올리는 법 한 장만 보인다
  const SPK = window.FloeStudyPack;
  const studyN = () => (st.j ? st.j.stage : atStage());
  const studyPack = () => SPK.build({ n: studyN(), pick: st.study.pick, results: st.results, tier: st.tier, term: st.study.term, hide: (t) => window.NavSensitive.redact(t), scan: (t) => window.NavSensitive.scan(t) });
  function studyBox() {
    if (!SPK || !st.study) return "";
    const d = st.study, g = d.got;
    return `<section class="gplan study" aria-label="공부 묶음"><div class="stg">공부 묶음 — ${LB(studyN())}${d.term ? ` · ${esc(d.term)}` : ""}</div>
      <p class="meta">넣을 것을 고르면 글 파일 하나와 먼저 물을 질문 다섯을 만들어요. 내 NotebookLM에 직접 올려 물어봐요.</p>
      <div class="gp-pick" role="group" aria-label="넣을 것">${SPK.SOURCES.map(([k, w], i) => `<button type="button" class="b${d.pick.includes(k) ? " pri" : " ghost"}" data-act="study-pick" data-i="${i}" aria-pressed="${d.pick.includes(k)}">${w}</button>`).join("")}</div>
      ${g ? `<p class="meta"><b>받았어요 — ${esc(g.file)}</b>${g.masked.length ? ` · 가린 것: ${esc(g.masked.join(", "))}` : " · 가린 것 없음"}</p><ol class="study-q">${g.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>` : ""}
      <div class="gp-sec"><h5>NotebookLM에 올리는 법</h5><ol>${SPK.GUIDE.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
      <div class="ob-foot"><button type="button" class="b pri" data-act="study-get" ${d.pick.length ? "" : "disabled"}>묶음 받기 (.md)</button><button type="button" class="b ghost" data-act="study-close">닫기</button></div></section>`;
  }
  function bookPane() {
    if (libSelected()) return deskLib();
    if (SHELF_ON) return `${studyBox()}${readmeBox()}${gatePlanBox()}${deskLib()}`;
    const mine = L() && SCH() ? openBooks().find((b) => b.mine) : null;
    return `${studyBox()}${readmeBox()}${gatePlanBox()}<div class="libtab">${inboxBox()}${mine ? `<div class="ob-foot"><button type="button" class="b" data-act="lib-book" data-id="${esc(mine.id)}">이 프로젝트의 단계 문서 · 정한 것 펼치기</button></div>` : ""}</div>`;
  }
  function readmeBox() {
    if (!RB) return "";
    const r = st.rb || { book: RB.parse(RB.EXAMPLE), src: "example", why: "" };
    const b = r.book, sel = Math.min(Math.max(0, st.rbSel | 0), Math.max(0, b.chapters.length - 1)), ch = b.chapters[sel];
    const from = r.src === "mine" ? `내 저장소 README · ${esc(r.project || "")}` : `연습 예시 책${r.why ? ` — ${esc(r.why)}` : ""}`;
    // claude-drafted: 2026-11-01 — 보여 주는 곳이라 마크다운 기호(** · > · | 표)를 그대로 두지 않고 파일 보기와 같은 변환기(md-view.js)로 그린다. 변환기가 없으면 전처럼 글 그대로
    const md = (t) => (MDV ? MDV.toHtml(t) : `<p class="rb-plain">${esc(t)}</p>`), mdLine = (t) => (MDV ? MDV.inline(t) : esc(t));
    const tocLine = (t) => mdLine(t).replace(/<[^>]+>/g, "");   // 목차는 단추라 안에 링크(a)를 두지 않는다 — 기호만 뗀 글(가린 글자는 그대로)
    return `<section class="rbook" aria-label="내 작업 책"><div class="rb-head"><div class="grow"><b>${b.title ? mdLine(b.title) : "제목 없는 책"}</b><small>${from}</small></div>${
        canLive ? `<button type="button" class="b ghost" data-act="rb-reload" title="README를 다시 읽어요">다시 읽기</button>` : ""}</div>
      ${b.intro ? `<div class="rb-intro mdv">${md(b.intro)}</div>` : ""}
      ${b.versions.length ? `<ol class="rb-vers" aria-label="버전">${[...b.versions].sort((x, y) => parseInt(x.v.slice(2), 10) - parseInt(y.v.slice(2), 10)).map((v) => `<li><b>${esc(v.v)}</b><span>${esc(v.date)}</span>${esc(v.title)}</li>`).join("")}</ol>` : ""}
      ${ch ? `<div class="rb-body"><nav class="rb-toc" aria-label="목차">${b.chapters.map((c, i) => `<button type="button" data-act="rb-sel" data-i="${i}" aria-current="${i === sel}">${tocLine(c.title)}</button>`).join("")}</nav>
        <article class="rb-ch" id="${esc(ch.id)}"><h4>${mdLine(ch.title)}</h4><div class="rb-text mdv">${md(ch.body)}</div></article></div>`
      : `<p class="meta">README에 ## 제목이 아직 없어요 — 퀘스트를 마치면 한 장씩 생겨요.</p>`}
      <p class="meta">${b.cut ? "README가 길어 앞부분만 보여요. " : ""}고치는 곳은 README예요 — 책은 받아 와 보여 주기만 해요.</p></section>`;
  }
  // README 읽기(API.md 3-18) — 서버로 연 화면에서만. 서버 없이 · 폴더를 모름 · README 없음이면 연습 예시 책과 까닭 한 줄
  // 폴더 · 보기 방식이 바뀌면 받아 둔 README 책과 찾은 줄을 잊는다(F-144-17, 2026-11-03) — 전에는 옛 프로젝트의 README가 '내 저장소 README'로 남고,
  //   연습 모드에도 진짜 README가 섞였으며(API.md 3-18), 옛 '찾은 줄'의 열기가 옛 목록 번호로 새 폴더의 엉뚱한 파일을 열었다. 책 탭이 열려 있으면 바로 다시 읽는다
  function readmeAgain() {
    st.rb = null; found = null;
    if (st.qwin && st.qtab === "lib") loadReadme();
  }
  async function loadReadme() {
    if (!RB) return;
    const example = (why) => ({ book: RB.parse(RB.EXAMPLE), src: "example", why });
    if (!canLive || st.mode === "fixture") { st.rb = example(canLive ? "연습 모드예요" : "서버 없이 열었어요"); return render(); }   // 연습 모드는 진짜 README를 섞지 않는다(API.md 3-18)
    try {
      const r = await (await fetch("/api/readme", { cache: "no-store" })).json();
      st.rb = r && r.ok && r.book ? { book: r.book, src: "mine", project: r.project, why: "" }
        : example(r && r.why === "excluded" ? "README.md는 빼 둔 곳이라 읽지 않아요 — 설정 '기록'의 빼 둘 곳에서 풀 수 있어요" : r && r.why === "none" ? "이 폴더에 README.md가 없어요" : "연결한 폴더를 아직 몰라요 — 그 폴더에서 Claude Code를 한 번 열어요");
    } catch { st.rb = example("서버에 닿지 않았어요"); }
    render();
  }
  // 튜토리얼 한 장(C-30, 2026-10-23) — 어떻게 움직이나 · 예시 · 막히면. 있는 기능은 '해 보기'로 바로. 도전과제의 '관문 전에 알아 둘 것'에서 고르면 펼친다(C-35)
  function deskLib() {
    if (!L() || !SCH()) return libMissing();
    const books = openBooks(), b = libSelected();
    if (!b) return `<div class="libtab">${inboxBox()}<div class="ob-body"><div class="who">${petCat(books.length ? "idle" : "sleep", 100)}</div><div>
        <div class="ob-say">열어 둔 책 ${books.length}권${exHidden ? " · 내 기록만" : ""}</div>
        <p class="ob-title">${books.length ? "어떤 책을 볼까요?" : exHidden && !st.j ? "아직 책이 없어요" : "열어 둔 책을 모두 서고에 꽂았어요"}</p>
        ${books.length ? `<div class="shelf4">${books.map(coverBtn).join("")}</div>` : `<p class="mc-sub">${exHidden && !st.j ? "'이번 단계'에서 지금 만드는 걸 보여 주면 내 책이 생겨요." : (SHELF_ON ? "새로 시작하면 여기에 책이 생겨요. 지난 책은 서고에서 다시 펼칠 수 있어요." : "새로 시작하면 여기에 책이 생겨요.")}</p>`}</div></div>
      <div class="ob-foot">${exToggle()}<span class="grow"></span>
        ${SHELF_ON ? `<button class="enter-lib" data-act="lib-enter"><span class="mb"></span>내 서고 들어가기</button>` : ""}</div></div>`;
    const fin = bookDone(b);
    // 책 안의 단계 문서(C-16) — 하나를 열면 그 자리에서 초안 · 고치기 · 다시 봐 줌 · 확정
    if (b.mine && Number.isInteger(st.libDoc) && N.STAGES[st.libDoc]) {
      deskKeys.Escape = { act: "lib-doc-close" };
      const s = N.STAGES[st.libDoc];
      return `<div class="libtab"><div class="row bdoc-head"><button type="button" class="b" data-act="lib-doc-close">‹ 책으로${kbd("Escape")}</button><b class="grow">${esc(b.title)} · ${LB(s.n)} ${esc(s.doc || "")}</b>${
        st.j && s.n > st.j.stage ? `<span class="meta">아직 안 온 단계예요 — 지금은 ${LB(st.j.stage)}</span>` : ""}</div>${deskDoc(s)}</div>`;
    }
    deskKeys.Escape = { act: "lib-close" };
    if (SHELF_ON) deskKeys.Enter = { act: st.libConfirm ? "lib-shelve" : fin ? "lib-bind" : "lib-shelve-ask" };
    // 책의 칸 · 구조 · 보기는 보기 설정(book-view.js)대로 — 왼쪽은 책의 머리(단계 · 이름 · 연 때 · 보기 설정 단추), 오른쪽은 켜 둔 칸들(C-9 · C-3, 2026-10-20)
    return `<div class="libtab"><div class="minispread" data-spread>
        <section class="bv-head"><div class="stg">${fin ? "돌아보기까지 끝" : `지금 ${LB(b.stage)} · ${esc(L().STAGES[b.stage])}`}${b.mine ? " · 이 화면의 프로젝트" : isEx(b) ? " · 예시 책" : ""}</div><h3>${esc(b.title)}</h3>
          <div class="stg soft">꽂은 책갈피 ${b.bookmarks.length}장 · 마지막으로 연 때 ${esc(b.updated)}</div>
          ${BV ? `<button type="button" class="bv-btn" data-act="bv-open" aria-expanded="${st.bvOpen}" title="구조 · 칸 · 보기 · 크기 — 이 컴퓨터에 저장돼요">보기 설정</button>` : ""}</section>
        <section class="bv">${BV ? `${st.bvOpen ? BV.panelHTML(bv, { noSize: !SHELF_ON }) : ""}${BV.bodyHTML(b, bv, { tab: st.bvTab })}`
          : `<div class="stg soft">정한 것</div><ul>${b.decided.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`}</section></div>
      ${b.mine ? bookDocs() : ""}
      ${st.libConfirm ? `<div class="confirm" role="alertdialog" aria-label="서고에 보관 확인">${cat("think", 34)}<span><b>‘${esc(b.title)}’</b>을 서고에 보관할까요? 언제든 다시 꺼내 펼칠 수 있어요.</span><span class="grow"></span>
          <button class="b pri" data-act="lib-shelve">보관하기${kbd("Enter")}</button><button class="b" data-act="lib-shelve-no">그대로 두기</button></div>`
        : `<div class="ob-foot"><button class="b" data-act="lib-close">‹ 목록으로${kbd("Escape")}</button>
          ${!SHELF_ON ? "" : fin ? `<button class="b pri" data-act="lib-bind">📖 한 권으로 엮어 서고에 꽂기${kbd("Enter")}</button>` : `<button class="b pri" data-act="lib-shelve-ask">서고에 보관하기${kbd("Enter")}</button>`}</div>`}</div>`;
  }
  // 확인할 먹이(FR-15 더함 2026-10-20 — 이재엽 버튼 "먹이 주기에 더하기"): 종류를 붙였지만 아직 확인하지 않은 구간. 도서관 탭 맨 위 [제안 ⑦]. 맞아요 → 그 종류로 내 책의 칸(my-books.js), 빼기 → 버림.
  //   이름은 '확인할 먹이' [제안 ⑧] — C-21의 '분류 안 함' 책장(책을 꽂는 곳)과 헷갈리지 않게. 예시 먹이의 것은 '예시'라고 표시
  // 누른 단추의 항목이 아직 그 자리에 있나 — 번호로만 찾으면 두 번 누를 때 둘째가 당겨진 다음 항목(확인하지 않은 것)을 넣거나 뺐다(F-144-10)
  const inboxSig = (x) => { let h = 0; for (const c of `${x.topic}\n${x.text}`) h = (h * 31 + c.codePointAt(0)) | 0; return String(h >>> 0); };
  const inboxSame = (x, el) => !!x && !!el && !!el.dataset && el.dataset.k === inboxSig(x);
  function inboxBox() {
    if (!FD || !st.inbox.length) return "";
    const rows = st.inbox.slice(0, 5).map((x, i) => `<li><span class="ft"><b>${esc(x.topic)}</b>${x.example ? " <small>· 예시</small>" : ""}<small>${esc(String(x.text || "").replace(/\s+/g, " ").slice(0, 90))}</small></span>${kindSelect("inbox-kind", i, x.kind)}
      <button type="button" class="b pri" data-act="inbox-ok" data-i="${i}" data-k="${inboxSig(x)}">맞아요 → 책에</button><button type="button" class="b ghost" data-act="inbox-drop" data-i="${i}" data-k="${inboxSig(x)}">빼기</button></li>`).join("");
    return `<section class="inbox" aria-label="확인할 먹이"><div class="stg">확인할 먹이 ${st.inbox.length}개 — 종류가 맞는지 보고 책에 넣어요</div><ol class="inboxlist">${rows}</ol>${st.inbox.length > 5 ? `<p class="meta">먼저 온 5개만 보여요 — 확인하면 다음 것이 올라와요</p>` : ""}</section>`;
  }
  // 책 안의 단계 문서 목록(C-16) — 단계마다 문서 이름 · 상태(아직 · 초안 · 다시 봐 줌 · 확정). 받은 먹이(C-15)도 여기에
  const docStatus = (n) => (docDone(n) ? "확정" : st.doc && st.doc.stage === n ? (st.doc.review ? "다시 봐 줌" : "초안") : "아직");
  function bookDocs() {
    const cur = st.j ? st.j.stage : -1;
    const rows = N.STAGES.filter((s) => s.doc).map((s) => { const stt = docStatus(s.n);
      return `<button type="button" class="bdoc${stt === "확정" ? " ok" : ""}${s.n === cur ? " cur" : ""}" data-act="lib-doc" data-i="${s.n}" aria-label="${LB(s.n)} ${esc(s.doc)} — ${stt}">
        <span class="n">${s.n + 1}</span><span class="t"><b>${esc(s.doc)}</b><small>${stt}${s.n === cur ? " · 지금 단계" : s.n > cur ? " · 아직 안 온 단계" : ""}</small></span></button>`; }).join("");
    const fed = st.fed.length ? `<div class="stg soft" style="margin-top:10px">받은 먹이 ${st.fed.length}번</div><ul class="fedlist">${st.fed.slice(0, 3).map((f) =>
      `<li>${esc(f.topics.join(" · ") || "(빠진 구간뿐)")}${f.left.length ? ` <small>· ${f.left.length}구간 뺌</small>` : ""}${f.example ? " <small>· 예시</small>" : ""}</li>`).join("")}</ul>` : "";
    const inboxNote = st.inbox.length ? `<p class="meta"><button type="button" class="lnk" data-act="lib-close">확인할 먹이 ${st.inbox.length}개 — 목록 맨 위에서 확인해요</button></p>` : "";
    return `<section class="bdocs"><div class="stg">단계 문서 — 들어가서 확인하고 작업해요</div><div class="bdoc-grid">${rows}</div>${fed}${inboxNote}</section>`;
  }
  // 이번 단계 카드에서 '단계 문서'를 누르면 — 도서관 탭 · 내 책(없으면 첫 책) · 그 단계 문서를 연다
  function openBookDoc(n) {
    const b = openBooks().find((x) => x.mine) || openBooks()[0];
    openQwin("lib");
    set({ tab: "lib", libSel: b ? b.id : null, libDoc: n, libConfirm: false, settings: false, askConfirm: 0 });
  }
  // 한 권의 책으로 엮기 — 책이 작아지며 서고로 넘어간다(서고 시안이 #lib-bound-<id>로 받아 책장에 꽂는다)
  function bindBook() {
    const b = libSelected(); if (!b || !bookDone(b)) return;
    st.libGone.push(b.id); save(); writeBound(b.id);
    const open = () => { location.href = `${LIB_URL}#lib-bound-${b.id}`; };
    const el = $nav.querySelector("[data-spread]");
    if (!el || STILL) return open();
    el.classList.add("binding"); C.burst(...center(el), "star", 16, 360);
    setTimeout(open, 950);
  }
  // 내 서고 들어가기 — 오버레이가 화면 가득 물속이 되고, 책을 안은 플로로가 내려간 뒤 서고가 물속에서 떠오른다(dive.js, 목업 영상 24~28초)
  // then: 서고에 올라온 뒤 열 장면 이름(#lib-dive-<then>). iPhone은 물속 없이 바로 #lib-<then>으로
  function enterLibrary(then = "") {
    if (WINS && (st.settings || st.qwin)) { st.settings = false; st.qwin = false; syncWins(); }   // 옆 창 둘은 닫는다(C-22)
    if (then && isPhone()) { location.href = `${LIB_URL}#lib-${then}`; return; }
    const href = `${LIB_URL}#lib-dive${then ? `-${then}` : ""}`;
    if (!window.FloeDive || STILL) { if (window.floeApp) window.floeApp.expand(); location.href = href; return; }
    const dive = () => window.FloeDive.out($nav.querySelector(".isl"), href);   // 플로로는 섬 한가운데에서(2026-10-20)
    if (!window.floeApp) return dive();
    // 앱(6.2.0 → 2026-10-20): 창을 먼저 화면만큼 넓히고(floe:expand → floe:expanded) 섬을 **제자리에 붙든 채**(--dx · --dy, app.css html.diving) 잠수한다.
    // 넓히기 전에 재면 물과 플로로의 길이 작은 창 기준으로 계산돼 플로로가 창 중간에 멈춰 있었다. 창이 넓어지면서 섬이 창의 왼쪽 위로 뛰던 것도 이 옮김이 막는다
    let went = false;
    const go = (d) => {
      if (went) return; went = true;
      if (d) { $nav.style.setProperty("--dx", `${Math.round(d.dx)}px`); $nav.style.setProperty("--dy", `${Math.max(0, Math.round(d.dy))}px`); }
      document.documentElement.classList.add("diving");
      requestAnimationFrame(() => requestAnimationFrame(dive));
    };
    if (window.floeApp.onExpanded) { const off = window.floeApp.onExpanded((d) => { off(); go(d); }); setTimeout(() => go(null), 400); }
    else setTimeout(() => go(null), 150);
    window.floeApp.expand();
  }
  // 서고에 보관하기(옛 이름 '세션 덮기', 2026-10-18 임유정 요청으로 버튼 이름을 바꾸고 설명 줄을 뺐다) — 목록으로 돌아가 그 책이 작아지며 사라진다
  function shelveBook() {
    const b = libSelected(); if (!b) return;
    set({ libSel: null, libConfirm: false });
    const el = $nav.querySelector(`[data-act="lib-book"][data-id="${b.id}"]`);
    const finish = () => { st.libGone.push(b.id); render(); say(`‘${b.title}’ 책을 서고에 꽂았어요`); };
    if (el && !STILL) { el.classList.add("leaving"); setTimeout(finish, 480); } else finish();
  }
  // 위쪽 줄 — 홈과 바이브 코딩이 하나(C-22, 2026-10-21 이재엽 "홈의 하나와 바이브 코딩의 넷을 하나로"): 집 · 단계 띠("N단계 · 제목 · M개 중 k번째 할 일 ●○○") · 조개 · ⚙ · 핀 · 접기.
  // 탭 넷(이번 단계 · 단계 지도 · 도서관)은 퀘스트 창의 탭(퀘스트 · 도전과제 · 서고)으로 갔다. 휴대폰의 탭 둘(TABS 앞의 둘)은 그대로
  let tabFrom = null, tabMove = null;
  const tabIdx = () => TABS.findIndex((x) => x[0] === st.tab);
  // 집 단추 — 알림 · AI 진행 판을 열었으면 눌리지 않은 모양, 누르면 채팅으로
  const homeBtn = (on) => `<button class="ti home" data-act="base" aria-pressed="${on}" aria-label="처음으로" title="처음으로 — 플로로와 대화">${I.home}</button>`;
  // 오른쪽 — 연결 표시 · 프로젝트 · 조개 · 설정 창 · 열어 두기 · 접기. 퀘스트 창 단추 · 모아 보기 단추는 2026-10-23에 뺐다(이재엽) — 퀘스트 창은 명령 칸의 책 · 배우기와 '공책 보기'로 연다
  // 섬 자리 네 칸(C-41 ②, 2026-10-27 — 스토리보드 기준 4): 작업실 창이 열려 있을 때만, 앱에서만
  // 작업실 머리 줄의 섬 단추 묶음(C-62): 옆 칸의 섬에는 위 줄이 없으니 집 · 설정 · 열어 두기 · 접기 · 연결 표시를 여기에 — 같은 ACT
  const hisl = () => `<span class="hisl" role="group" aria-label="섬">${st.unplug && canLive ? `<span class="led off" title="연결 끊음 — 작업 알림을 받지 않아요. 설정에서 다시 연결해요"></span>` : st.feed.at ? `<span class="led on" title="${toolName(st.feed.tool)}와 연결됨 · 마지막 소식 ${ago(st.feed.at)}"></span>` : ""}<button class="ti" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 — 작업실 · 보기 방식 · 연결 · 기록">${I.gear}</button><button class="ti" data-act="pin" aria-pressed="${st.userPin}" aria-label="열어 두기" title="열어 두기 — 저절로 접히지 않아요">${I.pin}</button><button class="ti" data-act="isl-big" aria-pressed="${!colFolded() && islBig()}" aria-label="섬을 크게 · 옆으로" title="${!colFolded() && islBig() ? "섬을 옆으로" : "섬을 크게 — 작업 칸 전체에서 이야기해요"}">${FULL_ICON}</button><button class="ti" data-act="fold" aria-pressed="${colFolded()}" aria-label="${colFolded() ? "펼치기" : "접기"}" title="${colFolded() ? "펼치기 — 접기 전 모습으로" : "접기 (Esc)"}">${colFolded() ? I.down : I.up}</button></span>`;
  const tbRight = () => `${QU ? `<button type="button" class="tb-q" data-act="qwin-toggle" aria-pressed="${st.qwin}" title="작업실 켜기 · 끄기 — 캔버스 · 노트북(퀘스트 · 맡길 일) · 도전과제 · 책">퀘스트</button>` : ""}${st.unplug && canLive ? `<span class="led off" title="연결 끊음 — 작업 알림을 받지 않아요. 설정에서 다시 연결해요"></span>`
        : st.feed.at ? `<span class="led on" title="${toolName(st.feed.tool)}와 연결됨 · 마지막 소식 ${ago(st.feed.at)}"></span>` : ""}
      ${project() ? `<span class="tb-proj" title="지금 보고 있는 프로젝트">${esc(project())}</span>` : ""}
      ${QU ? `<button type="button" class="shells" data-act="shells" title="무지개 조개 — 장을 지나면 하나. 셋이면 열어요" aria-label="무지개 조개 ${st.shells}개">${coin()}<span>${st.shells}</span></button>` : ""}
      <button class="ti" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 창 켜기 · 끄기 — 작업실 · 창 자리 · 보기 방식 · 연결 · 기록">${I.gear}</button>
      <button class="ti" data-act="pin" aria-pressed="${st.userPin}" aria-label="열어 두기" title="열어 두기 — 저절로 접히지 않아요">${I.pin}</button>
      <button class="ti" data-act="fold" aria-label="접기" title="접기 (Esc)">${I.up}</button></div>`;
  // 단계 띠 — 퀘스트를 받는 중이면 퀘스트(적은 줄), 아니면 살펴본 결과(st.j). 둘 다 없으면 시작 전
  const stageHead = () => stageBand().replace(/<span[\s\S]*$/, "");   // 단계 이름(<b>)만 — 진행은 섬 카드가 보인다(C-58)
  function stageBand() {
    const s = st.j && stage(), q = st.quest;
    if (planNow()) {   // 준비 계획 · 맡길 일(C-35) — 지금 할 퀘스트로 고른 쪽
      const b = st.plan;
      if (!b) return `<b>준비 계획</b><span>한 번에 붙여 넣기</span>`;
      if (!b.confirmed) return `<b>준비 계획 · ${b.v}판</b><span>줄마다 확인하는 중</span>`;
      const id = FP.next(b), i = b.plan.items.findIndex((x) => x.id === id);
      return id ? `<b>맡길 일 · ${esc(b.plan.items[i].need)}</b><span>${b.plan.items.length}개 중 ${i + 1}번째 맡길 일</span>${planMini(b, i)}` : `<b>맡길 일</b><span>${b.plan.items.length}개 모두 끝냈어요</span>`;
    }
    if (st.finished) return `<b>모든 단계를 마쳤어요</b>`;
    if (QU && q && q.phase !== "done") { const p = QU.progress(q), sn = N.STAGES[q.chap].title; return `<b>${LB(q.chap)} · ${esc(q.title)}</b><span>${q.title !== sn ? `${esc(sn)} · ` : ""}${p.n}개 중 ${p.k}번째 할 일</span><span class="mini" aria-hidden="true">${q.objs.map((_, i) => `<i class="${i < p.k ? "on" : ""}"></i>`).join("")}</span>`; }
    if (s) return `<b>${LB(s.n)} · ${esc(s.title)}</b><span>${allDone() ? `할 일 ${met().length}개 모두 했어요` : progress()}</span>${mini()}`;
    return `<b>시작 전</b><span>무엇을 만들까요</span>`;
  }
  function topbar() {
    return `<div class="tb">${homeBtn(!st.pane)}<span class="tb-stage" aria-live="polite">${stageBand()}</span><span class="grow"></span>${tbRight()}`;
  }
  const X_ICON = icon('<path d="M6 6l12 12M18 6L6 18"></path>', 16);
  // 한 줄 — 플로로가 앞지느러미를 걸치고 있다. 알릴 일이 있으면 파란 테두리로 살짝 흔든다
  function pillHTML() {
    const s = st.j && stage();
    let main;
    if (st.ping) main = `<b>${esc(pingHead())}</b><span class="pl-cta">볼까요?</span>`;
    else if (st.busy) main = `<b>살펴보는 중이에요</b>${dots}`;
    else if (st.warn) main = `<b>보내기 전에 잠깐!</b><span class="pl-cta">눌러서 보기</span>`;
    else if (st.finished) main = `<b>모든 단계를 마쳤어요</b>`;
    else if (!s) main = `<b>플로로</b><span class="pl-now">눌러서 지금 만드는 걸 보여 주세요</span>`;
    else if (holding() && st.screen !== "gate") main = `<b>${LB(s.n)} · 보류 중</b><span class="pl-now">${esc(U.holdLine(st.hold, ymd()).replace(/^보류 중 · /, ""))}</span>`;
    else main = `<b>${allDone() ? "다 했어요! · " : ""}${LB(s.n)}</b>${mini()}<span class="pl-now">${st.screen === "gate" ? "넘어가기 전 확인 중" : `지금: ${esc(tick().now)}`}</span>`;
    // C-46 R-1: 켤 때 인사는 알약 안에서 — 인사 중이면 플로로가 솟아 손을 흔들고(app.css [data-greet]) 글은 시간대 인사 한 줄(다시 온 사람에게는 그 말)
    const greeting = document.documentElement.classList.contains("greeting");
    if (greeting) main = `<b>플로로</b><span class="pl-now pl-hello" aria-live="polite">${esc(st.back || C.greeting(new Date().getHours()))}</span>`;
    const base = st.ping ? "look" : greeting ? "happy" : face()[0];
    return `<button class="pill${st.ping || st.warn ? " ping" : ""}${greeting ? " greet" : ""}" data-act="pill" aria-expanded="false" aria-label="플로로 펼치기 · ${esc(stateWords())}">
      <span class="pet" data-pet data-live data-base="${base}">${cat(liveMood(base), 36, { face: true })}</span>${main}${modeChip()}${connLed()}</button>`;
  }
  // 접혀 있을 때도 보이는 작은 표시(시연 안전장치) — 연습인지 진짜 AI인지, Claude Code·Codex와 연결됐는지
  const conn = () => (!canLive ? "" : st.unplug ? "off" : st.feed.at ? "on" : "wait");
  const CONN_WORD = { on: "연결됨", off: "연결 끊음", wait: "알림 기다리는 중" };
  // 작업 자리 이름(2026-10-25 두승현 — 옛 "진짜 AI" 표시 대신). 연습이면 그대로 "연습". 글자 수 제한은 뺐다(F-55로 띠의 이름표가 물결 아래로 가서, 두승현 2026-10-25)
  //   앱에서 고른 폴더 이름(/api/github의 project — git이 아니어도 온다)을 먼저, 그다음 훅 알림의 폴더 — 전에는 훅 알림의 폴더(st.project)만 봐서
  //   일반 폴더 · 원격 없는 git 폴더는 Claude Code를 한 번 쓰기 전까지 '폴더 없음'이었다(임유정 2026-10-25, F-58-5) — claude-drafted: 2026-10-25
  // 2026-10-28 임유정 "폴더 이름 뜨는거 어떤 형태든 로컬 폴더 이름을 최우선으로"(F-73): 보이는 이름은 늘 이 컴퓨터의 폴더 이름 — GitHub 저장소(주인/이름)는 title · aria-label에만 덧붙인다(F-54의 '저장소 먼저'를 바꿈)
  const wsFull = () => { ghSoon(); return (st.gh && st.gh.project) || project(); };
  const wsRepo = () => { const r = st.gh && st.gh.remote; return r && r.kind === "github" ? `${r.owner}/${r.repo}` : ""; };
  const wsShort = () => wsFull() || "폴더 없음";
  const wsTitle = () => (wsFull() ? `작업 자리 — ${wsFull()}${wsRepo() ? ` · GitHub ${wsRepo()}` : ""}` : "연결한 폴더가 없어요");
  const stateWords = () => [st.mode === "live" ? `작업 자리 ${wsFull() || "없음"}${wsRepo() ? ` · GitHub ${wsRepo()}` : ""}` : "연습용 예시", CONN_WORD[conn()]].filter(Boolean).join(" · ");
  const modeChip = () => `<span class="pl-mode ${st.mode}" title="${st.mode === "live" ? esc(wsTitle()) : "미리 만들어 둔 응답으로 움직여요 — 진짜 AI가 아니에요"}">${st.mode === "live" ? esc(wsShort()) : "연습"}</span>`;
  const connLed = () => (conn() ? `<span class="led ${conn() === "on" ? "on" : conn()}" title="${CONN_WORD[conn()]}"></span>` : "");
  // 띠 — 물결 선 위로 얼굴 위쪽만 빼꼼. 마우스를 올리면 한 줄로 나온다. 졸면 body.dozing으로 눈을 감는다(app.css)
  const WAVE = `<svg class="wl" viewBox="0 0 150 12" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="strip-wl" x2="1"><stop offset="0" stop-color="#A9DDFF" stop-opacity="0"></stop><stop offset=".5" stop-color="#A9DDFF" stop-opacity=".9"></stop><stop offset="1" stop-color="#A9DDFF" stop-opacity="0"></stop></linearGradient></defs>
    <path d="M6 5 Q40 2 75 5 Q110 8 144 5" fill="none" stroke="url(#strip-wl)" stroke-width="2" stroke-linecap="round"></path><path d="M40 9 Q58 7.5 72 9 M84 9.5 Q98 8 112 9.5" fill="none" stroke="#A9DDFF" stroke-width="1" opacity=".45" stroke-linecap="round"></path></svg>`;
  const stripHTML = () => `<button class="strip" data-act="strip" aria-label="플로로 부르기 · ${esc(stateWords())}" title="마우스를 올리면 나와요 · ${esc(stateWords())}"><span class="head" aria-hidden="true">${cat("idle", 58, { face: true })}</span>${WAVE}<span class="zz" aria-hidden="true">z<b>z</b></span>
    <span class="st-mode ${st.mode}${conn() === "off" ? " off" : ""}" aria-hidden="true">${st.mode === "live" ? esc(wsShort()) : "연습"}${conn() === "off" ? " · 끊음" : ""}</span></button>`;
  // 켤 때의 큰 인사 카드(greetHTML · 물결 선)는 2026-10-27 C-46으로 뺐다 — 인사는 알약(pillHTML) 안에서
  // ── 기본 화면(C-13, 2026-10-20 — 이재엽 "버튼식으로 준비가 되어있는 공간이 기본값") — 플로로와 지금 한 줄, 단추 넷. 알림 · AI 진행은 섬 안에서 바로(hub.js의 순수 함수 FloeHub) ──
  let aiSessions = [], aiMode = "none", aiLatest = 0;   // AI 진행(C-12)의 세션 · 어디서 왔나(none · example · live) · 마지막 번호
  const mine = () => aiSessions.filter((s) => s.here !== false);   // 연결한 폴더(또는 그 안)의 세션 — 서버가 here를 붙인다(F-73). AI 진행 판의 목록은 다른 폴더 것도 이름을 붙여 그대로 보인다
  const latestSession = () => [...mine()].sort((a, b) => (b.at || 0) - (a.at || 0))[0];   // 연결한 폴더의 가장 최근 세션 — AI 진행 판 머리 · 작업실 파일 카드 · 살펴보기의 일한 증거(workEvidence)가 같이 쓴다
  const aiLast = (list = aiSessions) => { let best = null; for (const s of list) for (const x of s.steps || []) if (!best || (x.at || 0) > (best.at || 0)) best = { ...x, project: s.project }; return best; };
  const stepLine = (s) => (STEPS ? STEPS.line(s) : `${s.verb || ""} ${s.what || ""}`.trim());
  // 지금 한 줄 — 알림과 AI가 한 일 중 더 최근 것, 없으면 다시 온 인사 또는 시간대 인사(넘김 문서 9절 2번 기본값)
  function nowLine() {
    const a = st.alerts[0], s = aiLast();
    const at = (x) => (x && Number.isFinite(x.at) ? x.at : 0);
    if (a && at(a) >= at(s)) return `${toolName(a.tool)}가 ${A.KIND[a.kind] || "알림을 보냈어요"}${a.line && !a.hidden ? ` — ${a.line}` : ""} · ${ago(a.at)}`;
    if (s) return `${aiMode === "example" ? "예시 · " : ""}${s.project || "Claude Code"}에서 ${stepLine(s)} · ${ago(s.at)}`;   // 서버 없이 보이는 예시는 예시라고(FR-10)
    return st.back || C.greeting(new Date().getHours());
  }
  const unreadN = () => (HUB ? HUB.unread(st.alerts, seenAlerts) : 0);
  const working = () => (HUB ? HUB.anyWorking(mine()) : false);   // 연결한 폴더의 세션만 — 다른 폴더의 Claude Code가 일해도 A의 채팅에 '일하고 있어요'를 띄우지 않는다(F-73)
  // 기본 화면의 단추 넷(C-13 baseBody)은 2026-10-21 C-22로 채팅(chatCard)이 됐다 — 알림 · AI 진행 판은 아래 그대로, 채팅의 칩(알림 · 도전과제)으로 연다
  // 알림 판 · AI 진행 판 — 왼쪽: 플로로 · 프로젝트 · 도구 이름 · (AI 진행) 상태와 한 일의 종류별 수, 오른쪽: 줄 목록(hub.js가 만드는 글 · 섬의 기록). 집(또는 '단추로')으로 돌아온다.
  //   AI 진행은 C-12 규칙 그대로 — 파일 이름 · 첫 줄 · 줄 수뿐, 파일 내용은 받지도 보이지도 않는다
  const PANE = { alerts: ["알림", "AI 코딩 도구가 보낸 알림이에요 — 새것이 위예요"], ai: ["AI 진행", "Claude Code가 한 일을 한 줄씩 — 파일 내용은 받지 않아요"] };
  function basePane(kind) {
    deskKeys.Escape = { act: "base-back" };
    const now = Date.now(), [title, lead] = PANE[kind] || PANE.alerts;
    const last = kind === "ai" ? latestSession() : null;
    const tool = toolName(kind === "ai" ? (last && last.tool) || "claude" : st.feed.tool || (st.alerts[0] && st.alerts[0].tool));
    const proj = wsFull() || (kind === "ai" && last ? last.project : "");   // 연결한 폴더 이름 먼저 — A 안의 backend에서 연 Claude Code도 머리는 A(F-73, 새 맥락 리뷰)
    const counts = kind === "ai" && last ? Object.entries((last.steps || []).reduce((m, s) => { m[s.verb || ""] = (m[s.verb || ""] || 0) + 1; return m; }, {})) : [];
    const body = !HUB ? `<p class="empty">아직 준비 중이에요</p>` : kind === "ai" ? HUB.aiHTML(aiSessions, aiMode, STEPS, now) : HUB.alertsHTML(st.alerts, now);
    const top = kind === "ai" ? `${approvalsHTML()}${taskBox()}` : "";   // FR-17: 허락이 필요한 카드(맨 위) · 할 일 적기
    return `<section class="mc base pane tone-gray"><div class="who">${petCat("look", 92)}<b class="pj">${esc(proj || "프로젝트")}</b><span class="tl">${esc(tool)}</span>${
        kind === "ai" && last && HUB && HUB.STATE_WORD[last.state] ? `<span class="st ${esc(last.state)}">${esc(HUB.STATE_WORD[last.state])}</span>` : ""}${
        counts.length ? `<ul class="verbs">${counts.map(([v, n]) => `<li><span>${esc(v)}</span><b>${n}</b></li>`).join("")}</ul>` : ""}</div>
      <div class="main"><div class="row ph"><button type="button" class="lnk" data-act="base-back" title="단추로 돌아가기 (Esc)">${I.back}단추로</button><b class="grow">${esc(title)}</b></div><p class="meta">${esc(lead)}</p>${top}<div class="pane-body">${body}</div></div></section>`;
  }
  const download = (name, text) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  // C-27 관문 계획서 — 관문 카드의 '계획서 보기' · 단계 고르기 · 목차 → 그 절 · 파일로 받기 / C-24 공부 묶음 — 열기 · 고르기 · 받기 · 닫기
  Object.assign(ACT, {
    "study-open": (i, el) => { if (!SPK) return; st.study = { term: (el && el.dataset && el.dataset.term) || "", pick: [...SPK.DEFAULT_PICK], got: null }; st.libSel = null; openQwin("lib"); render(); },
    "study-pick": (i) => { const d = st.study, k = SPK && SPK.SOURCES[i] && SPK.SOURCES[i][0]; if (!d || !k) return; st.study = { ...d, got: null, pick: d.pick.includes(k) ? d.pick.filter((x) => x !== k) : [...d.pick, k] }; render(); },
    "study-get": () => {
      if (!SPK || !st.study) return;
      if (!window.NavSensitive) return say("가리는 도구(sensitive.js)를 불러오지 못해서 묶지 않았어요 — 화면을 다시 열어 주세요");
      const p = studyPack(); if (!p) return say("넣을 것을 하나 이상 골라요");
      download(p.file, p.text); st.study = { ...st.study, got: { file: p.file, questions: p.questions, masked: p.masked } }; render();
      say(p.masked.length ? `받았어요 — 가린 것: ${p.masked.join(", ")}` : "받았어요 — 내 NotebookLM에 직접 올려 질문 다섯부터 물어봐요");
    },
    "study-close": () => { st.study = null; render(); },
    "gp-open": () => { const n = st.j ? st.j.stage : atStage(); st.gpSel = n; st.libSel = null; openQwin("lib"); render(); },   // libSel — 서고 책을 펼쳐 두었으면 책 탭이 그 책만 그린다
    "gp-sel": (i) => { st.gpSel = i | 0; render(); },
    "gp-toc": (i, el) => { const id = el && el.dataset.v, t = id && document.getElementById(id); if (t) { t.scrollIntoView({ block: "start", behavior: "smooth" }); t.focus({ preventScroll: true }); } },
    "gp-file": () => {
      if (!GPL) return; const n = gpNow(); if (n == null) return;
      download(`${String(n + 1).padStart(2, "0")}-gate-plan.md`, GPL.toMarkdown(gpBook(n)));
      say("계획서를 파일로 내려받았어요 — 공부 묶음이나 NotebookLM에 같이 넣을 수 있어요");
    },
  });
