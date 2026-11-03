  // ── C-56 R-1 기준 카드(2026-10-28): 1단계 관문의 카드 — 옮겨 온 줄은 출처 칩, 받은 글에서 온 줄은 줄 번호, 사람만 아는 칸은 빈칸(입력) + 성공의 '아직 모름'이면 무엇이 막히는지 한 줄. edit — 입력 칸을 보일지(관문 · 오른쪽 칸) ──
  const BC_EX = { what: "예: 신청이 한곳에 모이고 마감 전에 알림이 가요", success: "예: 신청 40건이 한곳에 모이면 · '신청됨'까지 3초 안", data: "예: 회원 이름 · 학번(운영진만)", out: "예: 알림 서비스로 이름만" };
  function baseCardHTML(card, edit) {
    if (!BC || !card) return "";
    const chip = (f) => (f.by === "me" ? `<small class="bc-from me">직접</small>` : f.src && f.lines && f.lines.length ? `<small class="bc-from">옮겨 옴 · 받은 글 ${f.lines[0].line}줄${f.lines.length > 1 ? ` 외 ${f.lines.length - 1}` : ""}</small>` : f.from && f.from.length ? `<small class="bc-from">옮겨 옴 · ${f.from.map((x) => `${LB(x.s)} ${ROMAN(x.i)}`).join(" · ")}</small>` : "");
    return `<dl class="bc" aria-label="이 프로젝트의 기준">${BC.FIELDS.map((fd) => { const f = card[fd.key] || { text: "", blank: true }; const canEdit = edit && (f.blank || f.by === "me");
      return `<div class="bc-row${f.blank ? " blank" : ""}"><dt>${fd.label}</dt><dd>${canEdit ? `<input type="text" data-act="card-field" data-v="${fd.key}" value="${esc(f.text || "")}" placeholder="${esc(f.note || BC_EX[fd.key] || "비었어요 — 알면 적어요")}" aria-label="${fd.label}" maxlength="200">` : f.blank ? `<span class="bc-blank">비었어요</span>` : `<span title="${esc(f.text)}">${esc(preview1(f.text, 60))}</span>`}${chip(f)}</dd></div>`; }).join("")}</dl>`;
  }
  function toNext() {
    const nx = nextStage();
    if (BC && stage() && stage().n === 0) { st.card = BC.withEdits(BC.build({ results: st.results, source: st.source }), st.cardEdits); st.cardEdits = {}; }   // 1단계 관문을 지나며 기준 카드를 기록에(C-56 R-1) — docs/base.md로 나간다
    if (!nx) { set({ step: "next", todos: [], todoLater: [] }); return flash("happy", 1200); }
    Object.assign(st, { todos: crits(nx.n).map((c) => c.text), todoLater: [] });
    advance();
  }
  // 알림 기록 비우기 — 이 화면의 기록은 바로 비우고, 서버에 남은 작업 글도 지워 달라고 한다(서버가 쿠키로 이 화면을 알아본다)
  async function clearAlerts() {
    st.alerts = [];
    let status = null;
    if (canLive) {
      try { status = (await fetch("/api/events/clear", { method: "POST" })).status; } catch { status = 0; }
    }
    set({ alogNote: A.clearNote(status) });
  }
  // 만드는 크기 바꾸기 — 이미 본 결과는 글자가 같은 할 일로 옮기고(tiers.js refit), 새로 생긴 할 일은 '아직'. 진짜 AI를 다시 부르지 않는다
  function setTier(v) {
    if (!TIERS.some(([x]) => x === v) || v === st.tier) return;
    const todo = () => (st.quest ? crits(st.quest.chap).map((c) => c.text).join("|") : ""), before = todo();
    st.tier = v;
    if (st.j) {
      st.j = T.refit(st.j, v);
      Object.assign(st, { hard: [], todos: null, todoLater: [], notice: `만드는 크기를 '${TIERS.find(([x]) => x === v)[1]}'으로 바꿔서, 이 단계 할 일이 ${st.j.criteria.length}개가 됐어요.` });   // 짧음 · 보통 · 긺 — 셋 다 받침이 있어 으로
      if (st.screen === "gate" && !allDone()) st.screen = "main";
    }
    // 퀘스트(C-22) — 할 일이 바뀌면 적은 줄은 비운다. 할 일이 그대로면(1단계는 크기와 상관없이 넷) 적은 줄 · 초안 · 제목을 둔다(C-36 — 1단계 Ⅳ에서 크기를 고를 때)
    if (QU && st.quest && st.quest.phase !== "done" && todo() !== before) st.quest = QU.retitle(QU.makeQuest(N.STAGES[st.quest.chap], crits(st.quest.chap)), st.topic);
    render();
  }
  const run = (a, el) => { if (ACT[a.act]) ACT[a.act](a.i, el); };
  // 손잡이 넷 — 섬 · 휴대폰 화면의 요소와, 앱의 옆 창(win.js)이 보낸 {dataset, value, checked}가 같이 쓴다(C-22)
  function clickAct(t) {
    if (!t || !ACT[t.dataset.act]) return;
    if (t.dataset.label && !t.classList.contains("ghost")) logMe(t.dataset.label);   // 채팅의 칩을 누르면 내 말로 남는다(C-22)
    run({ act: t.dataset.act, i: t.dataset.i === undefined ? undefined : Number(t.dataset.i) }, t);
  }
  // 책 보기 설정(C-9 · C-3) — 판의 단추(구조 · 보기 · 크기 · 탭)와 칸 체크. 고르면 바로 저장하고 다시 그린다. '전체 화면'을 고르면 지금 책을 서고에서 연다
  function bvClick(t) {
    if (!t || !BV || t.dataset.bv === "field") return;
    if (t.dataset.bv === "tab") return set({ bvTab: t.dataset.v });
    bv = BV.choose(bv, t.dataset.bv, t.dataset.v); BV.write(STORE, bv);
    const b = libSelected();
    if (SHELF_ON && t.dataset.bv === "size" && bv.size === "full" && b) return enterLibrary(`open-${b.id}`);
    render();
  }
  function onChange(t) {
    const a = t.dataset.act;
    if (t.dataset.bv === "field" && BV) { bv = BV.toggle(bv, t.dataset.v); BV.write(STORE, bv); return render(); }
    if (a === "mode") toMode(t.value);   // 연습 단추(F-106)와 같은 길 — 85-ai.js
    if (a === "auto") set({ auto: t.checked });
    if (a === "text-size") { set({ textSize: Number(t.value) || 1 }); applyScale(); }
    if ((a === "carry-review" || a === "carry-stage") && st.carry && st.carry.drafts) { const d = st.carry.drafts[Number(t.dataset.i)]; if (d && !d.state) { if (a === "carry-review") d.review = t.value; else d.stage = Number(t.value); render(); } }   // C-48 기준을 다시 잰다
    if (a === "hard") toggleHard(Number(t.dataset.i), t.checked);
    if (a === "tier") setTier(t.value);
    if (a === "qauto") { qauto = t.checked; writeLS(QAUTO_KEY, qauto ? "1" : "0"); }
    if (a === "preset-pick") { const f = st.openFiles[Number(t.dataset.v)]; const id = t.value; if (f && id && f.i >= 0) { t.value = ""; presetGo(id, { i: f.i }); } return; }   // 연 파일을 틀로 맡기기(C-44) — 번호로   // 퀘스트를 받으면 퀘스트 창이 바로 뜨기(C-22)
    if (a === "plan-readme") { st.planReadme = t.checked; save(); }   // 준비 계획 — 작업 폴더의 README도 읽나(C-34)
    if (a === "feed-kind" && st.meal) st.meal.kinds[Number(t.dataset.i)] = t.value;   // FR-15 더함 — 구간의 종류를 고친다(다시 그리지 않는다)
    if (a === "inbox-kind" && st.inbox[Number(t.dataset.i)]) { st.inbox[Number(t.dataset.i)].kind = t.value; save(); }
  }
  function onInput(t) {
    const a = t.dataset.act;
    if (a === "hold-who") st.holdWho = t.value;
    if (a === "hold-when") st.holdWhen = t.value;
    if (a === "text") st.text = t.value;
    if (a === "ex-text") { exText = t.value.slice(0, EX_TEXT_MAX); exDirty = true; return; }   // C-52 빼 둘 곳(59-exclude) — 치는 동안 다시 그리지 않는다(저장에서 보낸다)
    if (a === "question") st.question = t.value;
    if (a === "skip-reason") { st.skip = { ...(st.skip || {}), reason: t.value.slice(0, 200) }; return; }
    if (a === "learned") { st.learnDraft = t.value.slice(0, 400); return; }   // C-47 배운 것 — 다시 그리지 않는다(관문 '네'를 지나며 저장)
    if (a === "carry-text" || a === "carry-why" || a === "carry-review" || a === "carry-reason") {   // C-48 — 치는 동안 다시 그리지 않는다(날짜 · 단계는 바꾸고 나서 기준을 다시 잰다 — onChange)
      const d = st.carry && st.carry.drafts && st.carry.drafts[Number(t.dataset.i)]; if (!d) return;
      if (a === "carry-text") d.text = t.value.slice(0, CY.TEXT_MAX); else if (a === "carry-why") d.why = t.value.slice(0, CY.WHY_MAX); else if (a === "carry-review") d.review = t.value; else d.reason = t.value.slice(0, CY.REASON_MAX);
      return;
    }
    if (a === "goal-new") { st.goalDraft = { changed: t.value.slice(0, 200) }; return; }
    if (a === "ftext") { const f = st.openFiles[Number(t.dataset.v)]; if (!f) return; f.text = t.value; const d = f.text !== f.saved; if (d !== f.dirty) { f.dirty = d; render(); } return; }   // 파일 고치기(C-43) — 바뀜 표시만 다시 그린다(글 칸이 흔들리지 않게)
    if (a === "fn-find") { st.fnFind = t.value.slice(0, 60); render(); return; }
    if (a === "card-field") { st.cardEdits = { ...st.cardEdits, [String(t.dataset.v)]: t.value.slice(0, 200) }; return; }   // C-56 기준 카드의 빈칸 — 다시 그리지 않는다(관문 '네' 또는 '고친 것 적용'에서 저장)
    if (a === "sheet-field") { sheetInput(t.dataset.k, t.value); return; }   // C-47 한 장 고칠래요 — 다시 그리지 않는다('이대로 저장'에서)
    if (a === "prep-think") { const c = st.prep && st.prep.cards && st.prep.cards[Number(t.dataset.i)]; if (c) c.think = t.value.slice(0, 120); return; }   // C-54 고칠래요 — ① 생각(다시 그리지 않는다, '맞아요'에서 저장)
    if (a === "ffind") { const f = st.openFiles[Number(t.dataset.v)]; if (!f) return; f.find = t.value.slice(0, 60); if (f.kind === "md" && !f.edit && !f.raw && f.find) f.raw = true; render(); return; }   // C-53 문서 안 찾기 — 그 글이 든 줄 표시(원문 · 코드 보기)   // R-10 넘기는 까닭 — 다시 그리지 않는다(글 칸이 흔들리지 않게)
    // FR-17 할 일 · 요구 문장 — 글자를 칠 때는 다시 그리지 않고(커서가 튄다) '정리' 단추만 켠다
    if (a === "task-text") { st.task.text = t.value; liveBtn("task-tidy", !st.task.text.trim()); }   // 앱의 작업실 창에서도(F-144-8)
    if (a === "task-lines") st.task.lines = t.value.split("\n");
    // 준비 계획(C-34) — 글자를 칠 때는 다시 그리지 않고(커서가 튄다) 단추만 켠다
    if (st.plan && FP && /^plan-(note|answer|general)$/.test(a || "")) {
      st.plan = a === "plan-note" ? FP.note(st.plan, t.dataset.id, t.value) : a === "plan-answer" ? FP.answer(st.plan, Number(t.dataset.i), t.value) : { ...st.plan, general: t.value.slice(0, 300) };
      liveBtn("plan-again", !(FP.hasFeedback(st.plan) && planLive()));
      save();
    }
    if (a === "plan-rej-note") st.planRejNote = t.value.slice(0, 300);
    if (a === "dbg-text" && st.dbg) { const q = FP.DEBUG_QS[st.dbg.i]; st.dbg = { ...st.dbg, a: { ...st.dbg.a, [q.key]: t.value.slice(0, 20000) } }; }   // C-64 — 글자를 칠 때는 다시 그리지 않는다. 자르기는 가린 뒤 한 곳(plan.js withDebug)에서만 — 넉넉한 상한만
    if (a === "plan-q") st.planQ = t.value.slice(0, 300);
    if (a === "plan-reply") st.planReply = { ...st.planReply, [t.dataset.id]: t.value.slice(0, 300) };
    if (a === "own-text") st.ownText = t.value;
    // 채팅 칸(C-22) — 글자를 칠 때는 다시 그리지 않는다. 이름 · 퀘스트 고치기(이름 · 할 일 · 줄 · 개수)도 같다(quest.js — 원본은 안 바꾼다)
    if (a === "say") st.say = t.value;
    if (a === "name") { userName = t.value.slice(0, 20); writeLS(NAME_KEY, userName); }
    if (QU && st.quest && /^quest-(title|name|line|need)$/.test(a || "")) {
      const i = Number(t.dataset.i), k = Number(t.dataset.k);
      st.quest = a === "quest-title" ? QU.retitle(st.quest, t.value) : a === "quest-name" ? QU.rename(st.quest, i, t.value) : a === "quest-line" ? QU.setLine(st.quest, i, k, t.value) : QU.setNeed(st.quest, i, t.value);
      save();
    }
    // 느낀 점 — 글자를 칠 때는 다시 그리지 않고(커서가 튄다) '남기기' 단추만 켠다
    if (a === "note-text") { st.noteText = t.value; liveBtn("note-add", !st.noteText.trim()); }
    if (a === "doc" && st.doc) {
      st.doc.text = t.value; save(); if (t instanceof Element) grow(t);   // 글자를 칠 때는 다시 그리지 않는다(커서가 튄다) — 빈칸 개수만 바꾼다
      if (st.askConfirm) { st.askConfirm = 0; document.querySelector("[data-ask-confirm]")?.remove(); }   // 고치기 시작하면 다시 묻지 않는다
      const m = document.querySelector("[data-blanks]");
      if (m) m.textContent = blankMeta(st.doc);
    }
  }
  for (const $root of [$nav, $phone]) {
    $root.addEventListener("click", (e) => { const t = e.target.closest("[data-act]"); if (!t || !ACT[t.dataset.act]) return; activity(); clickAct(t); });
    $root.addEventListener("click", (e) => { const t = e.target.closest("[data-bv]"); if (!t || !BV || t.dataset.bv === "field") return; activity(); bvClick(t); });
    $root.addEventListener("change", (e) => onChange(e.target));
    $root.addEventListener("input", (e) => { activity(); onInput(e.target); });
  }

