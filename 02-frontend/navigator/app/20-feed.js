  // ── 먹이 주기(C-15, 2026-10-20 — 규칙은 feed.js) ──
  const feedState = (text, example = false) => { const sections = FD ? FD.split(text) : []; return sections.length ? { sections, checks: sections.map(FD.check), marks: [], kinds: sections.map(FD.guessKind), example } : null; };   // kinds — 구간마다 종류(FR-15 더함)
  const feedSkip = (fd, i) => { const c = fd.checks[i], m = fd.marks[i]; return m === "skip" || (m !== "keep" && (c.secret || c.personal)); };
  // 정리 화면 — 구간마다 주제 · 표시(못 먹어요 / 안 먹을게요 / 먹어요), 사람이 구간마다 고치고 확인하면 빠진 구간 없이 보낸다
  function feedSortMoment() {
    const fd = st.meal, packed = FD.pack(fd.sections, fd.marks);
    const rows = fd.sections.map((s, i) => { const c = fd.checks[i], skip = feedSkip(fd, i);
      return `<li class="${skip ? "skip" : "keep"}"><span class="fi">${i + 1}</span><span class="ft"><b>${esc(c.topic)}</b><small>${esc(skip ? (fd.marks[i] === "skip" ? "빼 달라고 하셨어요" : c.why) : "먹어요")}</small></span>${
        skip ? "" : kindSelect("feed-kind", i, fd.kinds[i])}
        <button type="button" class="b ghost" data-act="feed-mark" data-i="${i}" aria-pressed="${skip}">${skip ? "먹어도 돼요" : "빼 주세요"}</button></li>`; }).join("");
    return { tone: "blue", mood: "look", meta: `<span class="mm-stage">먹이 ${fd.sections.length}구간${fd.example ? " · 예시예요 · 시연용" : ""}</span>`,
      title: packed.kept ? `${packed.kept}구간을 먹을게요${packed.left.length ? ` — ${packed.left.length}구간은 빼요` : ""}` : "먹을 수 있는 구간이 없어요",
      sub: "빠진 구간의 글은 AI에게 보내지 않고 책에도 남기지 않아요. 구간마다 바꿀 수 있어요.",
      body: `<ol class="feedlist" aria-label="나눈 구간">${rows}</ol>`,
      acts: [{ label: "확인하고 어디쯤인지 보기", act: "feed-confirm", key: "c-Enter", pri: true }, { label: "다시 쓰기", act: "feed-back", key: "Escape", kind: "ghost" }] };
  }
  // 종류 고르기(FR-15 더함) — 요구 · 결정 · 배운 것 · 할 일 · 참고. 먹이 정리 화면과 확인할 먹이가 같이 쓴다
  const kindSelect = (act, i, cur) => `<select class="kind" data-act="${act}" data-i="${i}" aria-label="종류">${FD.KINDS.map(([k, label]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${label}</option>`).join("")}</select>`;
  // 글을 구간으로 나눠 표시 — AI에게 보내기 전, 이 컴퓨터에서만
  function feedSort(text, example = false) {
    if (!FD) return judge(false);
    const fd = feedState(text, example);
    if (!fd) return stop("먹일 글이 없어요. 파일을 끌어다 놓거나 글을 붙여 넣어 주세요.");
    Object.assign(st, { meal: fd, error: "", warn: null, openInput: false });
    render();
    const p = FD.pack(fd.sections);
    say(p.left.length ? `${p.left.length}구간은 빼고 먹을게요` : "다 먹을 수 있어요!");
  }
  // 확인 — 빠진 구간 없이 보낼 글을 만들어 어디쯤인지 보고, 정리(주제 · 빠진 수 · 까닭 — 글은 없다)는 책의 '받은 먹이'로
  function feedConfirm() {
    const fd = st.meal; if (!fd || !FD) return;
    const p = FD.pack(fd.sections, fd.marks);
    if (!p.kept) { flash("think", 1200); return say("먹을 구간이 하나는 있어야 해요"); }
    const topics = fd.sections.map((_, i) => fd.checks[i].topic).filter((_, i) => !p.left.some((l) => l.i === i));
    st.fed = [{ at: Date.now(), topics, left: p.left.map((l) => ({ topic: l.topic, why: l.why })), kept: p.kept, example: !!fd.example }, ...st.fed].slice(0, 20);
    // 종류를 붙인 구간은 '확인할 먹이'로(FR-15 더함) — 사람이 확인하기 전에는 책의 칸에 넣지 않는다(C-8 ②). 퀘스트 창의 '책' 탭(README 책 아래)에서 확인한다 — 서재가 있으면(SHELF_ON) 도서관 탭 맨 위
    const items = FD.inbox(fd.sections, fd.marks, fd.kinds).map((x) => ({ ...x, at: Date.now(), example: !!fd.example }));
    st.inbox = [...items, ...st.inbox].slice(0, 60);
    if (items.length) setTimeout(() => say(`확인할 먹이 ${items.length}개는 ${SHELF_ON ? "도서관 탭 맨 위" : "위 줄 '퀘스트' 창의 '책' 탭"}에 두었어요`), 3200);
    // 연습 모드의 예시 먹이는 정해진 장면(연습 첫 글)으로 이어진다 — 연습용 예시는 정해진 글만 알아서(FR-10). 진짜 AI면 먹은 글 그대로
    Object.assign(st, { text: fd.example && st.mode === "fixture" ? S.first.text : p.text, meal: null, undo: [] });
    judge(false);
  }
  // ── C-19 먹이 검사와 다른 작업은 서로 막는다(2026-10-20, 이재엽 "내용물을 검사하고 있으면 작업을 실행하지 못하게 하고 다른 작업들을 하고 있으면 내용물 검사하지 못하게") ──
  // 막는 조건은 상태 둘뿐: 먹이를 검사하는 중(st.meal — 나눈 구간을 확인하는 화면이 떠 있는 동안 전부 [제안]) · 다른 작업 중(st.busy — AI 판정 · 초안 · 다시 봐 주기).
  // 막을 때 플로로가 까닭을 말하고(말풍선) 화난 눈으로 X 표지판을 든다(seal.js angry). 끝나면 다시 하면 된다 — 이어서 하지 않는다 [제안]
  const mealWhy = () => (st.meal ? "지금은 먹이를 검사하는 중이에요 — 구간을 확인하고 나서 해요" : "");
  const busyWhy = () => (st.busy ? "지금은 살펴보는 중이에요 — 끝나면 먹이를 줄 수 있어요" : "");
  function refuse(why) { if (!why) return false; activity(); render(); flash("angry", 2600); say(why); return true; }   // 하던 화면 그대로 — 고른 명령 칸(cmd) · 버튼 말(words)은 명령 네 칸(C-35)이 빠진 뒤 쓰는 곳이 없어 2026-10-25에 뺐다
  // ── C-18 파란 먹이 층(2026-10-20, 이재엽 "파란색 레이어가 나와서 플로로에게 먹이를 주세요라고 중앙에 메세지와 폴더 모양안에 물고기 모양") ──
  // 파일을 섬 위로 끌고 있는 동안만. dragenter · dragleave는 자식을 지날 때마다 번갈아 오므로 횟수를 센다(넘김 문서 7절 함정). 놓거나 벗어나면 거둔다.
  // 띠로 접혀 있으면 한 줄로 살짝 열어 받을 자리를 만든다 [제안 — 요구서 C-18 ①]. 글이 아닌 파일도 같은 층(놓으면 "아직 글 파일만")
  const FISH = `<svg class="fl-pic" viewBox="0 0 120 90" aria-hidden="true"><path class="fl-folder" d="M8 22 Q8 14 16 14 H44 L54 24 H104 Q112 24 112 32 V72 Q112 80 104 80 H16 Q8 80 8 72 Z"></path><path class="fl-flap" d="M8 36 H112 V72 Q112 80 104 80 H16 Q8 80 8 72 Z"></path><g class="fl-fish"><path d="M44 58 Q58 42 78 58 Q58 74 44 58 Z"></path><path d="M78 58 L90 50 L88 58 L90 66 Z"></path><circle cx="54" cy="56" r="2.2"></circle></g></svg>`;
  let dragDepth = 0, $feedlayer = null;
  const hasFiles = (e) => !!(e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files"));
  function feedLayer(on) {
    if (!$feedlayer) { $feedlayer = document.createElement("div"); $feedlayer.className = "feedlayer"; $feedlayer.setAttribute("role", "status"); $feedlayer.innerHTML = `${FISH}<b>플로로에게 먹이를 주세요</b><small>글 파일(.md · .txt)을 여기에 놓아요</small>`; document.body.appendChild($feedlayer); }
    if (on) { const r = $nav.getBoundingClientRect(); $feedlayer.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; }
    $feedlayer.classList.toggle("show", on);
  }
  document.addEventListener("dragenter", (e) => {
    if (!hasFiles(e) || isPhone()) return;
    if (dragDepth++ === 0) { if (st.ui === "hidden") go("petit"); requestAnimationFrame(() => { if (dragDepth > 0) feedLayer(true); }); }   // 미룬 사이 이미 떠났으면(빠르게 넣었다 뺌) 켜지 않는다(F-103-28)
  });
  document.addEventListener("dragleave", (e) => { if (!hasFiles(e)) return; if (--dragDepth <= 0) { dragDepth = 0; feedLayer(false); } });
  // 파일 끌어다 놓기 — 띠 · 한 줄 · 펼침 어디에 놓아도 펼쳐서 먹이 주기로. 글 파일(.md · .txt) 1MB 아래만, 내용은 file.text()로 읽는다(경로가 필요 없어 앱을 고치지 않는다).
  // 앱 창은 파일을 놓으면 그 파일 주소로 넘어가므로 섬 밖에 놓아도 먼저 막는다(넘김 문서 7절)
  document.addEventListener("dragover", (e) => { e.preventDefault(); });
  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragDepth = 0; feedLayer(false);
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f || !FD || isPhone()) return;
    if (refuse(busyWhy())) return;   // C-19: 살펴보는 중에는 먹이를 받지 않는다
    activity(); setPlace("vibe");
    Object.assign(st, { tab: "today", screen: "main", settings: false, openInput: false, libDoc: null });
    go("home");
    const why = FD.accept(f.name, f.size);
    if (why) { flash("think", 1500); return say(why); }
    let text = "";
    try { text = await f.text(); } catch { flash("think", 1500); return say("파일을 읽지 못했어요"); }
    st.text = text; feedSort(text);
  });

  // 넘어가기 전 확인 — 이해했나요? → (아니요) 헷갈린 곳 → 묻기 → 한 장 요약 → (예) 다음 단계 순서 정하기
  // R-10 멈춤(C-42 · F-60, 2026-10-27 이재엽 버튼 "Go"): 완료 보고 뒤 '안 됨'이 남으면 관문이 열리지 않는다 — 채우러 가기(공책으로) / 까닭 적고 넘기기(까닭은 결정 기록의 관문 줄에).
  //   넘긴 기준은 '됨' 수에 들지 않고 '넘김'으로 남는다(docs.js). 이해했어요(예)는 그 뒤 전처럼
  const gateStop = () => !!(QU && st.quest && st.quest.phase === "done" && st.j && st.j.stage === st.quest.chap && !st.finished && !holding() && !st.openInput && left() > 0);   // 멈춰 둔 단계 · 글 칸을 연 동안은 그 카드가 먼저(새 맥락 리뷰)
  function momentStop() {
    const s = stage(), meta = `<span class="mm-stage">${LB(s.n)} · 관문 앞</span>${flowLine()}`;
    const un = st.j.criteria.filter((c) => !c.met);
    const rows = `<ul class="unmet">${un.map((c) => `<li><b>${esc(QU.shortOf(c.text))}</b>${c.why && N.GATE_WHY && N.GATE_WHY[c.why] ? ` <small>${esc(N.GATE_WHY[c.why])}</small>` : ""}</li>`).join("")}</ul>`;
    if (st.skip) return { tone: "amber", mood: "think", meta, title: "왜 넘기는지 한 줄 적어 주세요", sub: "이 까닭은 결정 기록의 관문 줄에 남아요 — 나중에 읽는 사람이 알 수 있게",
      body: `${rows}<textarea class="mc-input" data-act="skip-reason" rows="2" aria-label="넘기는 까닭" placeholder="예) 아직 잴 수 없어요 — 발표 뒤에 재요">${esc(st.skip.reason || "")}</textarea>`,
      acts: [{ label: "이 까닭으로 넘기기", act: "gate-skip-save", key: "c-Enter", pri: true }, { label: "돌아가기", act: "gate-skip-back", key: "Escape", kind: "ghost" }] };
    return { tone: "amber", mood: "think", meta, title: `아직 '안 됨'이 ${un.length}개 있어요 — 관문 앞에서 멈췄어요`,
      sub: "채우러 가면 공책에서 그 칸을 고치고 다시 완료 보고를 해요. 넘기려면 까닭 한 줄이 결정 기록에 남아요.",
      body: rows, acts: [{ label: "채우러 가기", act: "gate-fill", key: "Enter", pri: true }, { label: "까닭 적고 넘기기", act: "gate-skip" }] };
  }
  // 지식 퀘스트 C-47(2026-10-29 — 지식 퀘스트 PRD 6절, 결정 모음 A-13): 관문 카드의 '배운 것' 칸. 사람이 자기 말로 적는다(플로로 · AI는 이 칸을 쓰지 않는다), 비워도 관문은 열린다.
  //   2단계부터 1단계에서 적은 원하는 결과(앞 관문에서 바꿨으면 바꾼 말)를 다시 보이고 아직 같은지 묻는다. 지나면 advance가 그 단계 결과에 learned · goal로 남긴다 → docs.js
  const WANT = "다 만들면 무엇이 달라지는지 쓰기";
  function wantNow(n) {
    const it = st.results[0] && st.results[0].items.find((x) => x.name === WANT), first = it ? it.lines.filter((l) => l && l.trim()).join(" / ") : "";
    for (let k = n - 1; k >= 1; k--) { const g = st.results[k] && st.results[k].goal; if (g && g.changed) return { text: g.changed, from: `${LB(k)} 관문에서 바꾼 원하는 결과` }; }
    return first ? { text: first, from: "처음 원한 결과" } : null;
  }
  function learnBox(n) {
    if (!st.results[n]) return "";   // 남길 단계 결과가 없으면 적은 글이 버려진다 — 칸을 보이지 않는다(새 맥락 리뷰)
    const w = n >= 1 ? wantNow(n) : null, g = st.goalDraft;
    return `<div class="learn"><p class="mc-sub">이번 단계에서 배운 것을 내 말로 한 줄 적어요. 비워도 넘어가요 — 비우면 문서에 '비어 있음'으로 남아요.</p>
      <textarea class="mc-input" data-act="learned" rows="2" maxlength="400" aria-label="이번 단계에서 배운 것" placeholder="이번 단계에서 새로 알게 된 것은 무엇인가요?">${esc(st.learnDraft || "")}</textarea>${w ? `
      <p class="mc-sub">${w.from}: “${esc(w.text)}” — 아직 같은가요?</p>
      <div class="opts">${btn({ label: "아직 같아요", act: "goal-same", kind: "opt toggle", pressed: !!(g && g.same) })}${btn({ label: "바뀌었어요", act: "goal-changed", kind: "opt toggle", pressed: !!(g && g.changed != null) })}</div>${g && g.changed != null ? `
      <input class="mc-input" data-act="goal-new" maxlength="200" aria-label="지금 원하는 결과" placeholder="지금 원하는 결과는 무엇인가요?" value="${esc(g.changed)}">` : ""}` : ""}</div>`;
  }
  function momentGate() {
    const s = stage(), nx = nextStage(), meta = `<span class="mm-stage">${LB(s.n)}에서 한 일</span>${flowLine()}`;
    const yes = { label: "네, 이해했어요", act: "yes", key: "y", pri: true }, no = { label: "아니요, 같이 풀어요", act: "no", key: "n" };
    // '나중에'(접기와 같음)는 뺐다 — 접기는 오른쪽 위 ^ 버튼과 Esc가 한다 (2026-10-18 임유정 요청)
    // '아니요' 세 번째부터 잠시 멈추기(FR-5 보류) — 헷갈린 곳 고르기에서는 눈에 띄게, 그 뒤 장면에서는 조용한 버튼으로
    const holdAct = U.offerHold(st.noCount) ? [{ label: "잠시 멈추기", act: "hold", key: "h", kind: "ghost" }] : [];
    if (st.step === "which") return { tone: "amber", mood: "think", meta, title: "어디가 헷갈렸나요?", sub: "여러 개 골라도 돼요. 고른 곳부터 같이 풀어요.",
      body: holdOffer(),
      acts: [...st.j.criteria.map((c, i) => ({ label: c.text, act: "hard-t", i, key: String(i + 1), kind: "opt toggle", pressed: st.hard.includes(i) })),
        { label: "다음", act: "to-question", key: "Enter", pri: true }] };
    if (st.step === "question") return { tone: "amber", mood: face()[0], meta,
      title: "궁금한 걸 편하게 물어보세요", sub: `헷갈린 곳: ${esc(hardTexts().join(", "))}`,
      body: `<textarea class="mc-input" data-act="question" rows="2" aria-label="궁금한 것" placeholder="예) 꼭 필요한지 표시하는 건 왜 해요?">${esc(st.question)}</textarea>${
        st.answer ? `<div class="answer"><b>플로로의 답</b>${esc(st.answer)}</div>` : ""}`,
      acts: [{ label: "물어보기", act: "answer", key: "c-Enter", pri: !st.answer }, ...(st.answer ? [{ label: "한 장 요약 보기", act: "plan", key: "Enter", pri: true }] : []), ...holdAct] };
    if (st.step === "plan") return { tone: "amber", mood: face()[0], meta: `<span class="mm-stage">${LB(s.n)} 한 장 요약</span>`,
      title: "이렇게 정리해 봤어요. 이제 어때요?", sub: "",
      body: `<dl class="sheet">${planRows().map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`,
      acts: [yes, { ...no, label: "아직 잘 모르겠어요" }, ...holdAct] };
    if (st.step === "hold") return { tone: "gray", mood: face()[0], say: face()[1], meta: `<span class="mm-stage">${LB(s.n)} · 잠시 멈추기</span>`,
      title: HOLD.title, sub: HOLD.sub, body: holdForm(),
      acts: [{ label: "이렇게 멈춰 둘게요", act: "hold-save", key: "c-Enter", pri: true }, { label: "돌아가기", act: "hold-back", key: "Escape", kind: "ghost" }] };
    // '예' 뒤 확인 질문 하나 — 고르면 맞았는지 보이고, 틀려도 정답과 한 줄 설명을 본 뒤 넘어간다
    if (st.step === "check") {
      const { q, pick } = st.check, m = `<span class="mm-stage">${LB(s.n)} · 확인 질문 하나</span>${flowLine()}`;
      if (pick === null) return { tone: "amber", mood: face()[0], say: face()[1], meta: m, title: esc(q.ask), sub: CHECK.sub,
        acts: [...q.options.map((o, i) => ({ label: o, act: "check-pick", i, key: String(i + 1), kind: "opt" }))] };
      return { tone: "amber", mood: face()[0], say: face()[1], meta: m, title: `정답: ${esc(q.options[q.answer])}`, sub: "", body: checkWhy(q),
        acts: [{ label: CHECK.go, act: "check-go", key: "Enter", pri: true }] };
    }
    if (st.step === "next" && !nx) return { tone: "green", mood: "happy", meta: `<span class="mm-stage">마무리</span>`,
      title: END.last, sub: "", acts: [{ label: "마치기", act: "go", key: "Enter", pri: true }] };
    if (st.step === "next") return { tone: "green", mood: "happy", meta: `<span class="mm-stage">${nx ? `다음은 ${LB(nx.n)} · ${esc(nx.title)}` : "마무리"}</span>`,
      title: "좋아요! 무엇부터 할지 순서를 정해 볼까요?", sub: "위아래 화살표로 순서를 바꾸고, 지금 안 해도 되는 일은 '나중에'로 미뤄 둬요. 꼭 할 일부터 하나씩 안내할게요.",
      body: todoList(true), acts: [{ label: "이 순서로 시작하기", act: "go", key: "Enter", pri: true }] };
    return { tone: "amber", mood: face()[0], meta, title: s.n === 0 && BC ? "이 프로젝트의 기준 — 맞나요?" : "이번 단계에서 한 일, 이해되셨나요?",
      sub: s.n === 0 && BC ? "1단계 칸과 받은 글로 기준 한 장을 만들었어요. 옮겨 온 줄은 어디서 왔는지 적혀 있고, 사람만 아는 칸(성공)은 비워 두었어요 — 채워 주면 다음 단계 퀘스트가 이 기준으로 지어져요." : `잘 모르겠으면 헷갈린 곳을 골라 같이 풀어요. 몇 번이고 괜찮아요.${st.noCount ? ` (다시 물어본 횟수 ${st.noCount}번)` : ""}`,
      body: `${s.n === 0 && BC ? baseCardHTML(BC.withEdits(BC.build({ results: st.results, source: st.source }), st.cardEdits), true) : ""}${learnBox(s.n)}`,   // C-56 R-1 기준 카드(목업 ③) + C-47 배운 것
      acts: [yes, no] };
  }
  // 가로 카드 하나 — 왼쪽 플로로, 오른쪽 [한마디 · 작은 줄 · 굵은 제목 · 설명 · 선택지 · 버튼]
  function card(v) {
    for (const a of v.acts) if (a.key) deskKeys[a.key] = a;
    let opts = v.acts.filter(isOpt), rest = v.acts.filter((a) => !isOpt(a));
    // 선택지 뒤에 '나중에'만 남으면 같은 줄에 — 카드가 낮아진다
    if (opts.length && rest.every((a) => a.kind === "ghost")) { opts = opts.concat(rest); rest = []; }
    return `<section class="mc tone-${v.tone}">
      <div class="mc-cat">${petCat(v.mood, 108, v.extra)}</div>
      <div class="mc-main">
        ${st.notice ? `<p class="mc-notice">${I.check}${esc(st.notice)}</p>` : ""}
        ${v.banner ? `<p class="mc-hold">${esc(v.banner)}</p>` : ""}
        ${v.meta ? `<div class="mc-meta">${v.meta}</div>` : ""}
        <h2 class="mc-title" aria-live="polite">${v.title}</h2>
        ${v.sub ? `<p class="mc-sub">${v.sub}</p>` : ""}
        ${v.body || ""}
        ${opts.length ? `<div class="opts">${opts.map(btn).join("")}</div>` : ""}
        ${rest.length ? `<div class="acts">${rest.map(btn).join("")}</div>` : ""}
        ${v.foot ? `<p class="mc-foot">${v.foot}</p>` : ""}
      </div></section>`;
  }
