  // ── 누르기 — data-act 이름 → 할 일. (i: data-i, el: 누른 것) ──
  const set = (patch) => { Object.assign(st, patch); render(); };
  // 헷갈린 곳 고르기/빼기 (PC 단추·iPhone 체크 상자)
  const toggleHard = (i, on = !st.hard.includes(i)) => set({ hard: on ? [...new Set([...st.hard, i])].sort() : st.hard.filter((x) => x !== i) });
  // 공통 누르기 — 기능의 누르기는 그 조각이 Object.assign(ACT, …)로 더한다(00-base의 ACT, 2026-10-29)
  Object.assign(ACT, {
    strip: () => view("enter"),
    open: () => view("click"),
    pin: () => { clearIdle(); set({ userPin: !st.userPin }); say(st.userPin ? "여기 열어 둘게요" : "이제 잠시 뒤 작게 접힐게요"); },
    pill: () => (QU && !st.qwin ? (openQwin("quest"), render()) : st.ui === "hidden" ? go("home") : view("click")),   // 작업실 밖의 알약은 누르면 바로 작업실(섬은 접힌 알약 그대로 — 두승현 2026-10-29). 작업실 안의 알약은 어느 상태든 누르면 펼침(C-46, 새 맥락 리뷰)
    fold: () => go(colFolded() ? "home" : "petit"),   // 머리 줄의 접기 단추는 오고 가는 단추 — 알약이면 접기 전 모습으로(크게 · 옆으로는 st.islBig 그대로, F-100 임유정 2026-10-29). 섬 위 줄(tbRight)의 접기는 펼친 섬에만 보여 그대로 접기
    "boot-later": () => { st.boot = null; render(); },   // C-55 말풍선의 '나중에' — 말풍선만 사라진다(작업실 · 알약은 그대로)
    pet: () => pet("tap"),
    // 연습용은 바로 살펴보고, 진짜 AI 모드에서는 글만 넣어 둔다(보내는 건 사용자가 '어디쯤인지 보기'를 누를 때)
    ex: (i) => {
      st.text = S.examples[i].text; st.notice = ""; st.undo = [];
      if (st.mode === "fixture") return judge(true);
      render(); focusText(); say("예시 글을 넣었어요. 보내려면 '어디쯤인지 보기'를 눌러요");
    },
    judge: () => { if (refuse(mealWhy())) return; st.notice = ""; judge(false); },
    "fill-example": () => { set({ text: S.first.text, error: "", warn: null }); focusText(); },
    restart: () => { Object.assign(st, { j: null, finished: false, todos: null, hold: null, todoLater: [], results: {}, mats: {}, carryUse: {}, carryDone: false, ship: null, topic: "", prep: null, mapSel: null, codeless: null, linesDone: [] }); ACT.ex(S.examples.indexOf(S.first)); },
    "send-anyway": () => { if (st.warn && RETRY[st.warn.then]) RETRY[st.warn.then](); },   // 두 번 누르면 둘째는 st.warn이 이미 없다(앱 작업실은 다시 그려 보내는 데 시간이 걸린다) — F-144-18
    "stop-send": () => set({ warn: null }),
    edit: () => { set({ warn: null, openInput: !!st.j }); focusText(); },
    // 선택지를 한 번 누르면 정해진다 — 누른 자리에서 물방울이 튄다
    "pick-opt": (i, el) => {
      if (st.busy || !st.j || !st.j.next) return;
      st.choice = i;
      const from = el || liveCat();
      if (from && !STILL) C.burst(...center(from, 0.2), "bubble", 5);
      flash("happy", 1300);
      decide();
    },
    opt: (i) => set({ choice: i }),
    decide: () => { if (st.choice !== null) decide(); },
    later: () => { set({ later: true, choice: null, picking: false }); say("좋아요, 나중에 같이 정해요"); },
    // 선택지에 원하는 게 없을 때 — 직접 써서 정한다
    own: () => { set({ own: true }); requestAnimationFrame(() => document.querySelector("[data-act=own-text]")?.focus()); },
    "own-cancel": () => set({ own: false }),
    "own-decide": () => {
      if (st.busy || !st.j || !st.j.next) return;
      if (!st.ownText.trim()) { flash("think", 1200); return say("어떻게 할지 한 줄 적어 주세요"); }
      decide(st.ownText.trim());
    },
    again: () => set({ later: false, picking: true }),
    pick: () => set({ picking: true }),
    settings: () => { if (!st.settings) { st.gh = null; usage = null; } set({ settings: !st.settings }); },   // 열 때마다 GitHub 칸 · 토큰 칸을 다시 확인한다(C-25, 2026-10-24). 작업실이 열려 있으면 가운데 모달(setModal — F-86)
    // ── 퀘스트(C-22, 2026-10-21) — 시작 · 받기 · 고치기 · 한 줄 · 완료 보고 · 창 ──
    send: () => send(),
    "idea-example": () => { st.say = S.first.text.split("\n")[0]; send(); },   // 연습 — 연습 첫 글의 첫 줄을 말한 것으로
    // 1단계 초안 확인(C-36) — 맞아요(초안 그대로) · 고칠래요(채팅 칸에 고쳐 적기) · 누가 고르기 · 크기 고르기(만드는 크기도 그 등급으로)
    qmore: () => { qmore = !qmore; render(); },
    "more-toggle": () => { moreOpen = !moreOpen; render(); },
    "draft-ok": () => { const q = st.quest, i = q ? QU.curIdx(q) : -1, t = i >= 0 ? QU.draftOf(q, i) : ""; if (t) fillNow(t); },
    // C-40 — 예시 셋 중 고르기(누가 = 고름) · 남은 칸 모두 맞아요(누가 = 그대로) · 다른 예시(그 칸만 다시 — 진짜 AI는 이미 본 예시를 피해 다시, 연습은 순서만)
    "draft-alt": (k) => { const q = st.quest, i = q ? QU.curIdx(q) : -1, ex = i >= 0 ? QU.examplesOf(q, i) : []; if (ex[k]) fillNow(ex[k], "pick"); },
    // 1단계에서 크기 칸까지 채우면 만드는 크기도 권한 크기로 — 크기 칩(draft-size)과 같게(2026-10-26 리뷰: 줄만 '보통'이고 등급은 Full로 남아 다음 장이 Full 할 일 수로 열렸다)
    "card-edit": () => { if (!BC || !st.card) return; st.card = BC.withEdits(st.card, st.cardEdits); st.cardEdits = {}; if (st.prep && SM) { const rule = SM.prepare({ stages: N.STAGES, slugs: FDOCS ? FDOCS.SLUGS : [], plan: st.results[1], criteria: crits }); st.prep = { ...st.prep, cards: st.prep.ai ? mergePrepared(rule.cards, st.prep.cards) : rule.cards, fix: false }; } save(); render(); say("기준을 고쳤어요 — 아직 안 한 단계의 퀘스트를 이 기준으로 다시 지어요"); },   // C-56 R-1: 카드를 고치면 아직 안 한 퀘스트를 다시(지금은 준비된 퀘스트 — AI 맞춤은 ⓓ)
    "first-go": () => { treeView = "flow"; openQwin("quest"); render(); say("한눈에 보기에서 그 칸을 찾아 채워요 — 지난 장의 칸은 '채우기'로 채팅에서 같이 적어요"); },   // C-56 먼저 → 갈 곳
    "first-notyet": () => { const q = st.quest, i = q ? QU.curIdx(q) : -1, x = i >= 0 ? qstates(q)[i] : null; if (!x || x.state !== "first") return; fillNow(`아직 못 함 — ${x.why}`, "me"); },   // 비워 두지 않고 적되 관문 규칙(evidence)이 막는다
    "draft-again": async () => {
      const q = st.quest, i = q ? QU.curIdx(q) : -1, ex = i >= 0 ? QU.examplesOf(q, i) : []; if (ex.length < 2) return;
      const swap = (it) => ({ ...st.quest, draft: { ...st.quest.draft, items: st.quest.draft.items.map((x, k) => (k === i ? it : x)) } });
      if (st.mode !== "live" || !canLive) { st.quest = swap({ ...q.draft.items[i], text: ex[1], alts: [...ex.slice(2), ex[0]] }); render(); return say("연습이라 예시 순서만 바꿨어요 — 진짜 AI면 새 예시를 만들어요"); }
      if (st.busy) return;   // 앞 호출의 '무엇을 기다리나'를 지우지 않게(F-103-5)
      Object.assign(st, { warn: null, error: "", planBusy: "again" });
      const r = await callAI("/api/stagedraft", { stage: q.chap, tier: st.tier, idea: ideaNow(), prev: prevOf(q.chap), base: baseText(), avoid: { i, texts: ex.slice(0, 3) } });
      st.planBusy = "";
      const it = r.ok && r.draft && r.draft.items[i];
      if (it && st.quest && st.quest.chap === q.chap && QU.curIdx(st.quest) === i) { st.quest = swap(it); st.tokens = r.tokens || 0; fetchUsage(); return render(); }   // 다음 장은 이 장을 다 적은 뒤에 미리(다른 예시를 누른 사람은 권한 것을 그대로 고르지 않을 때가 많다 — 2026-10-26 리뷰)
      render(); say(`다른 예시를 만들지 못했어요 — ${r.reason || "AI에 연결하지 못했어요"}`);
    },
    "refit-review": (i) => { st.refitPick = Number(i); render(); },   // C-56 R-5 — 적어 둔 칸의 두 줄 보기
    "refit-use": (i) => { const q = st.quest, x = st.refit && q && st.refit.chap === q.chap && st.refit.review.find((r) => r.i === Number(i)); if (!x) return;
      st.quest = QU.setLine(q, x.i, 0, x.text); st.refit = { ...st.refit, review: st.refit.review.filter((r) => r.i !== x.i) }; st.refitPick = null; logMsg("floro", `<b>${ROMAN(x.i)} 새 줄로 바꿨어요</b> — ${esc(x.text)}`); pre = null; prefetch(st.quest); render(); },
    "refit-keep": (i) => { if (!st.refit) return; st.refit = { ...st.refit, review: st.refit.review.filter((r) => r.i !== Number(i)) }; st.refitPick = null; render(); },
    "find-lines": async () => {   // C-56 R-4 — 폴더의 글 파일에서 이 칸의 답 후보 줄(API.md 3-30)
      const q = st.quest, i = q ? QU.curIdx(q) : -1; if (i < 0 || !canFind()) return;
      found = { chap: q.chap, i, busy: true, list: [], why: "" }; render();
      try { const r = await (await fetch(`/api/find?q=${encodeURIComponent(`${QU.nameOf(q, i)} ${QU.askOf(q, i) || ""}`.trim())}`, { cache: "no-store" })).json();
        found = { chap: q.chap, i, busy: false, list: (r && r.ok && r.found) || [], why: (r && r.why) || (r && r.ok ? "" : "server") };
      } catch { found = { chap: q.chap, i, busy: false, list: [], why: "server" }; }
      render();
    },
    "find-use": (k) => { const q = st.quest, x = found && q && found.chap === q.chap && found.list[k]; if (!x || QU.curIdx(q) !== found.i) return;
      logMsg("floro", `<b>옮겼어요</b> — ${esc(x.path)} ${x.line}줄: ${esc(x.text)}`); found = null; fillNow(x.text, "moved"); },   // 원문 그대로 · 누가 = 옮김(quest.js BY) · 어디서 왔는지 한 줄 남긴다
    "find-open": (k) => { const x = found && found.list[k]; if (x && Number.isInteger(x.i)) { if (!st.qwin) st.qwin = true; openFile(x.i); } },   // 원문은 파일 보기(C-43)로
    "draft-fix": () => { render(); focusAct("[data-act=say]"); },   // 앱의 작업실 창에서도(F-144-8)
    "draft-who": (i) => { const w = QU.WHO[i]; if (w && st.quest && QU.curIdx(st.quest) === QU.WHO_AT) fillNow(`쓰는 사람: ${w[0]} — ${w[1]}`, "pick"); },
    "draft-pick": (i) => {   // 기획서로 키울지(2단계, C-37) — 고른 것이 그 줄. 플로로가 권한 것을 고르면 까닭도
      const q = st.quest, pk = q ? QU.pickOf(q, QU.curIdx(q)) : null, x = QU.DOC_PICKS[i]; if (!pk || !x) return;
      fillNow(`기획서: ${x[1]}${x[0] === pk.pick && pk.why ? ` — ${pk.why}` : ""}`, "pick");
    },
    "draft-size": (i) => {
      const q = st.quest, k = QU.SIZE_KEYS[i]; if (!k || !q || !q.draft || QU.curIdx(q) !== QU.SIZE_AT) return;
      setTier(QU.SIZE_TIER[k]);
      fillNow(`크기: ${QU.SIZE_WORD[k]}${k === q.draft.size ? ` — ${q.draft.sizeWhy}` : ""}`, "pick");
    },
    "quest-ok": () => { const q = st.quest; if (!q || q.phase !== "draft") return; st.quest = { ...q, phase: "quest", edit: false, sel: 0 }; st.qtab = "quest"; set({ questUp: true }); say("받았어요! 퀘스트 카드에 다섯 칸이 열렸어요"); },
    "quest-fix": () => { if (!st.quest) return; st.quest = { ...st.quest, edit: true }; openQwin("quest"); render(); set({ questUp: true }); say("퀘스트 카드에서 이름과 할 일 수를 고친 뒤 '이대로 받기'를 눌러요"); },
    "quest-later": () => { set({ questUp: false }); say("그럼 쉬어요 — 지도를 보다가 '퀘스트 카드 올리기'를 누르면 다시 올라와요"); },   // C-69: 작업실을 닫지 않고 카드를 내린다(S4)
    "quest-example": () => { const q = st.quest, i = q ? QU.curIdx(q) : -1, ex = i >= 0 ? QU.example(q, i) : null; if (ex === null) return; if (q.draft) { st.say = ex; return send(); } logMe(ex); fillNow(ex, "ok"); },   // 예시는 플로로가 낸 것 그대로(ok) — C-61 뒤로 send()는 대화라 여기서 바로 적는다
    "quest-report": () => questReport(),
    "tidy-fill": () => { const t = st.tidy; if (!t || !st.quest) return; st.tidy = null; st.islBig = false; let q = st.quest; for (const f of t.fills) q = QU.fill(q, f.i, f.text, "chat"); st.quest = q; afterFill(); },   // 서버는 안 적은 칸만 제안한다(3-31)   // C-61 — 누가 정했나 '대화', 섬은 옆 칸으로(사람이 눌렀을 때만)
    "tidy-more": () => set({ tidy: null }),
    "chat-go": (i, el) => { const n = Number(el.dataset.v); st.chatOpen = st.chatOpen === n ? null : n; st.chatGo = n; goSeq += 1; render(); },   // C-63 대화 목록의 바로가기 — 펼침 · 접힘, 대화는 그 구분선으로
    "isl-big": () => { if (colFolded()) { st.islBig = true; return ACT.pill(); } set({ islBig: !islBig() }); },   // 머리 줄의 크게 · 옆으로 단추 — 알약일 때는 펼치면서 가운데(F-83: 값만 바뀌고 화면은 그대로였다)
    // 준비 계획 · 맡길 일(C-34 · C-32 → C-35, 2026-10-24): 채팅의 지금 말로 연다 — 계획이 없으면 한 번에 넣기(처음 말한 것이 있으면 넣는 글에 미리), 있으면 확인 · 지금 줄
    "plan-open": () => {
      if (!FP) return ACT["plan-direct"]();
      if (!st.plan && !st.planDraft.trim()) { const q = st.quest, t = q && QU ? QU.textOf(q, st.idea) : st.idea || ""; if (t.trim()) st.planDraft = t.slice(0, N.PLAN_MAX); }
      set({ qfocus: "plan", pane: "", settings: false });
      focusAct("[data-act=say]");   // 앱의 작업실 창에서도(F-144-8)
    },
    "plan-later": () => set({ qfocus: "stage" }),   // 나중에 · 단계 퀘스트로 — 계획 · 맡길 일은 그대로 남는다
    "plan-clear": () => set({ planDraft: "" }),
    "plan-sel": (i, el) => set({ planSel: (el && el.dataset.id) || "" }),   // 퀘스트 창의 맡길 일 목차 — 보기만
    qfocus: (i, el) => set({ qfocus: FP && el && el.dataset.v === "plan" ? "plan" : "stage", pane: "" }),   // 퀘스트 창의 '지금 할 퀘스트' — 채팅이 따른다
    // 한 줄만 적어 맡기기 — 전의 맡기기(FR-17): 적은 생각을 할 일 칸에 넣어 AI 진행 판에서 정리 → 고치기 → 허락
    "plan-direct": () => {
      if (!st.task.text.trim() && !st.task.lines && !st.task.sent) { const q = st.quest, t = q && QU ? QU.textOf(q, st.idea) : st.idea || ""; if (t.trim()) st.task.text = t.slice(0, 4000); }
      ACT["base-ai"](); focusAct("[data-act=task-text]");   // 앱의 작업실 창에서도(F-144-8 새 맥락 리뷰)
    },
    "plan-make": () => makePlan(false),
    "plan-ok": (i, el) => { st.plan = FP.mark(st.plan, el && el.dataset.id, "ok"); save(); render(); },
    "plan-follow": (i, el) => {   // C-51 앞의 결정대로 — 그 줄을 고칠래요로 두고 의견을 채운다(다시 세우기에서 고친다)
      const id = el && el.dataset.id, x = st.plan && st.plan.plan.items.find((y) => y.id === id); if (!x || !x.diff || st.plan.confirmed) return;
      const old = (st.plan.notes[id] || "").trim(), add = `앞의 결정('${x.diff.was}')에 맞춰 고쳐 주세요`;   // 이미 적은 의견은 지우지 않고 뒤에 붙인다
      st.plan = FP.note(FP.mark(st.plan, id, "fix"), id, old.includes(add) ? old : old ? `${old} / ${add}` : add); save(); render();
    },
    "plan-fix": (i, el) => { st.plan = FP.mark(st.plan, el && el.dataset.id, "fix"); save(); render(); focusAct(`[data-act=plan-note][data-id="${CSS.escape(String(el && el.dataset.id))}"]`); },
    "plan-confirm": () => { if (!FP.canConfirm(st.plan)) return; st.plan = FP.confirm(st.plan); st.qfocus = "plan"; st.planSel = ""; if (qauto) openQwin("quest"); save(); render(); say("확정했어요! 퀘스트 창에 맡길 일이 생겼어요"); },
    "plan-again": () => revisePlan(),
    "plan-reset": () => { st.plan = null; st.dbg = null; st.planRej = ""; st.qfocus = "plan"; save(); render(); },
    // 지금 줄에 하는 일 — 채팅의 칩에는 줄 이름이 없다(순서대로라 지금 줄 하나 — FP.next). 보고 안의 단추는 data-id
    "plan-hand": () => handPlan(),
    "plan-accept": (i, el) => { st.plan = FP.accept(st.plan, planId(el)); save(); const p = FP.progress(st.plan); render(); say(p.done === p.total ? "계획을 다 끝냈어요! 정말 멋져요." : `끝냈어요! ${p.done} / ${p.total}`); },
    "plan-rej-open": (i, el) => { st.planRej = planId(el); st.planRejNote = ""; render(); focusAct("[data-act=plan-rej-note]"); },
    "plan-rej-close": () => { st.planRej = ""; render(); },
    "plan-reject": (i, el) => { const id = planId(el); st.plan = FP.reject(st.plan, id, st.planRejNote); st.planRej = ""; st.planRejNote = ""; save(); handPlan(id); },
    // Claude Code가 물은 것에 답하고 이어서 맡기기(C-33) — 그 질문과 답을 다음 맡김 글에 붙인다
    "plan-reply-send": (i, el) => {
      const id = planId(el), w = st.plan && st.plan.work[id], ans = (st.planReply[id] || "").trim();
      if (!w || !w.report || !ans) return say("답을 먼저 적어 주세요");
      st.plan = FP.reject(st.plan, id, `Claude Code가 "${w.report.ask}"라고 물었고, 사용자의 답: ${ans}`); st.planReply = { ...st.planReply, [id]: "" }; save(); handPlan(id);
    },
    "plan-ask-open": (i, el) => { st.planAsk = planId(el); st.planQ = ""; render(); focusAct("[data-act=plan-q]"); },
    "plan-ask-close": () => { st.planAsk = ""; render(); },
    "plan-ask-send": (i, el) => askPlan(planId(el)),
    "plan-unwait": async () => { const id = FP.running(st.plan); if (!id || st.halting) return; const w = tw && tw.kind === "plan" ? tw : null; if (w) { st.halting = true; render(); const ok = await taskHalt(w.at); st.halting = false; if (!ok) { if (tw === w) twTimer = setInterval(twTick, 3000); render(); return say("Claude Code를 멈추지 못했어요 — 아직 일하는 중이라 조금 뒤 다시 눌러 주세요."); } if (tw === w) tw = null; st.stall = null; } if (FP.running(st.plan) !== id) return render(); st.plan = FP.failed(st.plan, id, "멈췄어요"); save(); render(); say(w ? "Claude Code도 멈췄어요 — 바로 다시 맡길 수 있어요." : "멈췄어요 — 다시 맡길 수 있어요."); },   // F-103-7(임유정 2026-10-30 '클로드 코드도 멈추는 거로'): 서버의 일을 끄고(taskHalt — 꺼진 걸 확인할 때까지) 그 줄을 끝맺는다. 그사이 보고가 와서 끝났으면 그대로 둔다
    // 살피기 · 책 — 옛 명령 칸(C-29)의 길. 지금은 도전과제의 '알아 둘 것'에서 해 보기 · 끝 카드의 책 보기가 부른다(C-35)
    "cmd-look": () => {
      const q = st.quest;
      if (q && q.phase === "quest" && QU && QU.isDone(q)) return questReport();
      if ((st.text.trim() || st.judged) && (!q || q.phase === "done")) return ACT.judge();
      openQwin("quest"); render();
      if (!q) return say(st.j ? "다음 퀘스트는 넘어가기 전 확인을 지나면 받아요" : "먼저 무엇을 만들고 싶은지 말해 주세요");
      if (q.phase === "draft") return say("퀘스트 창에서 퀘스트를 먼저 받아 주세요");
      const i = QU.curIdx(q); say(i >= 0 ? `남은 할 일 — ${q.objs[i].name}` : "다 적었어요! 완료 보고를 눌러요");
    },
    "cmd-book": () => { openQwin("lib"); set({ settings: false, libSel: null, libConfirm: false, libDoc: null }); loadReadme(); },
    "rb-sel": (i) => set({ rbSel: i | 0 }),
    "rb-reload": () => loadReadme(),
    "quest-edit": () => { if (st.quest) set({ quest: { ...st.quest, edit: true } }); },
    "quest-cancel": () => { if (st.quest) set({ quest: { ...st.quest, edit: false } }); },
    "quest-save": () => { if (!st.quest) return; const was = st.quest.phase; st.quest = { ...st.quest, edit: false }; if (was === "draft") return ACT["quest-ok"](); render(); say("퀘스트를 고쳐 적었어요 — 보상은 그대로예요"); },
    "quest-sel": (i) => { if (st.quest) set({ quest: { ...st.quest, sel: i, edit: false } }); },
    "quest-hint": () => { const q = st.quest, i = q ? QU.curIdx(q) : -1; say(i >= 0 ? `힌트: ${QU.question(q, i)}` : "힌트: 다 적었으면 완료 보고를 눌러요"); },
    // 빈 칸 채우기 — 지금 장의 칸은 채팅에서 차례로. 받기 전이면 퀘스트 탭(받기 화면)으로, 섬이 접혀 있으면 펼친다(앱의 옆 창에서 눌러도 섬에서 이어진다)
    "jmap-fill": () => {
      if (st.qfocus === "plan") st.qfocus = "stage";
      if (st.quest && st.quest.phase === "draft") { openQwin("quest"); st.qtab = "quest"; return render(); }
      if (st.ui !== "home") go("home"); else render();
      focusAct("[data-act=say]");   // 앱의 작업실 창에서도(F-144-8)
    },
    shells: () => openGacha(),   // 위 줄의 조개 → 뽑기 창(섬이 접혀 있으면 옆 칸으로 펼친 뒤)
    gacha: () => openGacha(),
    "gacha-close": () => { if (st.gacha && st.gacha.phase === "rolling") return; set({ gacha: null }); },   // 여는 중에는 닫지 않는다 — 조개만 빠지고 아이템을 못 받았다(F-120, Esc와 같이)
    "gacha-roll": () => gachaRoll(),
    wear: (i, el) => { if (!QU || !el) return; set({ wear: QU.toggleWear(st.wear, el.dataset.v) }); },
    qwin: () => closeQwin(),
    // R-10 관문 앞 멈춤(2026-10-27)
    "gate-fill": () => { if (!st.quest) return; st.quest = { ...st.quest, phase: "quest", edit: false }; st.skip = null; openQwin("quest"); set({ questUp: true }); say("퀘스트 카드에서 '안 됨'인 칸을 고치고 다시 완료 보고를 눌러요"); },
    "gate-skip": () => { st.skip = { reason: "" }; render(); },
    "goal-same": () => set({ goalDraft: st.goalDraft && st.goalDraft.same ? null : { same: true } }),   // C-47 처음 뜻 — 다시 누르면 고르지 않음
    "goal-changed": () => set({ goalDraft: st.goalDraft && st.goalDraft.changed != null ? null : { changed: "" } }),
    "gate-skip-back": () => { st.skip = null; render(); },
    "gate-skip-save": () => {
      const reason = String((st.skip && st.skip.reason) || "").trim().slice(0, 200); if (!reason) return say("까닭을 한 줄 적어 주세요");
      const items = st.j.criteria.filter((c) => !c.met).map((c) => c.text);
      st.j = { ...st.j, criteria: st.j.criteria.map((c) => (c.met ? c : { ...c, met: true, skipped: true, reason })) };
      const r = st.results[st.j.stage]; if (r) st.results = { ...st.results, [st.j.stage]: { ...r, check: checkOf(st.j), skip: { reason, items } } };
      st.skip = null; logMe(`넘겨요 — ${reason}`); save();
      if (allDone()) { view("alert"); return; } render();
    },   // 퀘스트 창의 ×(닫기만 — 옆 창에서 두 번 눌러도 다시 열리지 않게)
    "qwin-toggle": () => { if (st.qwin) return closeQwin(); openQwin("quest"); render(); },   // 위 줄의 '퀘스트' 단추(C-35, 이재엽 그림 2026-10-24) — 작업실은 퀘스트 탭부터(캔버스 탭은 2026-11-02 뺌)
    "qwin-quest": () => { openQwin("quest"); set({ questUp: true }); }, "qwin-tree": () => { openQwin("quest"); render(); },   // 섬 칩 '퀘스트 보기' — 합친 탭을 열고 카드를 올린다(C-65) "qwin-lib": () => { openQwin("lib"); render(); },
    qtab: (i, el) => { set({ qtab: (el && el.dataset.tab) || "quest", libSel: null, libConfirm: false, libDoc: null }); if (st.qtab === "lib") loadReadme(); },
    "set-tab": (i, el) => { setTab = (el && el.dataset.tab) || "room"; render(); },
    // 기본 화면(C-13, 2026-10-20) — 집 · 바이브 코딩 · 알림 판 · AI 진행 판 · 단추로 돌아가기
    base: () => { setPlace("home"); set({ settings: false, pane: "" }); },   // 집 — 기본 화면으로, 열어 둔 판도 닫는다
    "go-vibe": () => { setPlace("vibe"); set({ tab: "today", settings: false }); },
    "base-alerts": () => { seenAlerts = HUB ? HUB.latestAt(st.alerts) : Date.now(); try { if (SESS) SESS.setItem(SEEN_KEY, String(seenAlerts)); } catch {} set({ pane: "alerts" }); },
    "base-ai": () => { set({ pane: "ai" }); pollSteps().then(render); },
    "base-back": () => set({ pane: "" }),
    "fold-delay": (v) => { if (!FOLD_CHOICES.includes(v)) return; foldSec = v; try { localStorage.setItem(FOLD_KEY, String(v)); } catch {} render(); if (timer) scheduleIdle(); say(`${v}초 뒤에 접힐게요`); },
    // FR-17 할 일 적기 · 정리 · 넘기기 · 승인
    "task-tidy": async () => {
      const text = st.task.text.trim(); if (!text) return;
      if (!canLive || st.mode === "fixture") { const r = N.taskLines(text); return set({ task: { ...st.task, lines: r.lines, say: r.say } }); }
      const r = await callAI("/api/task/tidy", { text });
      if (r.ok) set({ task: { ...st.task, lines: r.lines, say: r.say } }); else { render(); say(r.reason || "정리하지 못했어요"); }
    },
    "task-send": async () => {
      const text = (st.task.lines || []).map((l) => l.trim()).filter(Boolean).join("\n"); if (!text) return say("요구 문장이 비어 있어요");
      if (!canLive || st.mode === "fixture") {
        if (AP) { approvals = AP.EXAMPLE.map((a) => ({ ...a, at: Date.now() })); apMode = "example"; }
        set({ task: { ...st.task, sent: "연습 · 보내지 않았어요" } }); return say("연습이라 Claude Code에 보내지 않았어요 — 승인 카드는 예시예요");
      }
      const r = await callAI("/api/task/start", { text });
      if (r.ok) { set({ task: { ...st.task, sent: r.project || "연결한 프로젝트" } }); watchTask(r.task, "send"); say("넘겼어요 — 허락이 필요하면 카드가 떠요"); pollSteps().then(render); } else { render(); say(r.reason || "넘기지 못했어요"); }
    },
    "task-reset": () => set({ task: { text: "", lines: null, say: "", sent: "" } }),
    "pr-ok": (i, el) => decideProposal(el && el.dataset.id, true),   // C-38 시험판 — 웹 AI의 제안
    "pr-no": (i, el) => decideProposal(el && el.dataset.id, false),
    "ap-allow": (i, el) => decideApproval(el && el.dataset.id, "allow"),
    "ap-deny": (i, el) => decideApproval(el && el.dataset.id, "deny"),
    "ap-unsure": () => set({ apSure: "" }),
    // 탭(PC): 단계 지도 · 도서관은 퀘스트 창의 도전과제 · 서고 탭으로(C-22). 휴대폰은 전처럼 탭을 바꾼다
    tab: (i) => { const id = TABS[i][0]; if (!isPhone() && id !== "today") { openQwin(id === "map" ? "tree" : "lib"); return set({ settings: false, libSel: null, libConfirm: false, libDoc: null }); }
      set({ tab: id, error: "", warn: null, settings: false, askConfirm: 0, libSel: null, libConfirm: false, libDoc: null }); },
    // 먹이 주기(C-15) — 예시 · 나눠 정리 · 구간 표시 바꾸기 · 확인 · 다시 쓰기
    // 확인할 먹이(FR-15 더함) — 맞아요: 그 종류로 책의 칸에, 빼기: 버림. 종류 고치기는 change 손잡이
    "inbox-ok": (i, el) => { const x = st.inbox[i]; if (!x || !inboxSame(x, el)) return; st.sorted = [{ at: ymd(), kind: x.kind, text: x.text, topic: x.topic }, ...st.sorted].slice(0, 200); st.inbox.splice(i, 1); render(); say(`'${FD ? FD.kindLabel(x.kind) : x.kind}' 칸에 넣었어요`); },
    "inbox-drop": (i, el) => { if (!st.inbox[i] || !inboxSame(st.inbox[i], el)) return; st.inbox.splice(i, 1); render(); say("뺐어요"); },
    "feed-example": () => { if (refuse(busyWhy())) return; if (FD) { st.text = FD.EXAMPLE; feedSort(FD.EXAMPLE, true); } },
    "feed-sort": () => feedSort(st.text),
    "feed-mark": (i) => { const fd = st.meal; if (!fd || !fd.checks[i]) return; fd.marks[i] = feedSkip(fd, i) ? "keep" : "skip"; render(); },
    "feed-confirm": () => feedConfirm(),
    "feed-back": () => set({ meal: null }),
    // 책 안의 단계 문서(C-16) — 열기 · 닫기 · 이번 단계 카드에서 바로
    "lib-doc": (i) => set({ libDoc: i, askConfirm: 0, libConfirm: false }),
    "lib-doc-close": () => set({ libDoc: null, askConfirm: 0 }),
    "lib-doc-now": () => openBookDoc(st.j ? st.j.stage : 1),
    // 도서관 탭 — 책 고르기 · 목록으로 · 서고에 보관(확인 뒤) · 한 권으로 엮기
    "lib-enter": () => { if (refuse(mealWhy())) return; if (!SHELF_ON) return ACT["cmd-book"](); enterLibrary(); },   // 서재를 잠시 뺀 동안(2026-10-23)은 책 탭으로
    "lib-book": (i, el) => {
      const id = (el && el.dataset.id) || openBooks()[i].id;
      if (SHELF_ON && BV && bv.size === "full") return enterLibrary(`open-${id}`);   // 보기 설정 '전체 화면' — 서고의 펼친 책으로(C-3). 서재를 잠시 뺀 동안은 섬 안에서
      set({ libSel: id, libConfirm: false, libDoc: null });
    },
    "bv-open": () => set({ bvOpen: !st.bvOpen }),
    "lib-close": () => set({ libSel: null, libConfirm: false, libDoc: null, bvOpen: false }),
    "lib-shelve-ask": () => set({ libConfirm: true }),
    "lib-shelve-no": () => set({ libConfirm: false }),
    "lib-shelve": () => shelveBook(),
    "lib-bind": () => bindBook(),
    crit: () => set({ showCrit: !st.showCrit }),
    "open-input": () => { set({ openInput: true, showCrit: false }); focusText(); },
    "close-input": () => set({ openInput: false }),
    // 넘어가기 전 확인 안에서는 글 칸이 안 보인다 — 보낼 작업 글이 없어 멈췄으면(F-11) 확인을 닫고 글 칸을 연다
    "retry-input": () => { const noText = st.screen === "gate" && !U.askText(st.text, st.judged); set({ error: "", openInput: !!st.j, ...(noText ? { screen: "main" } : {}) }); focusText(); },
    dismiss: () => set({ error: "", keyBad: false }),   // F-106 키 카드도 같이 — 같은 말의 오류 카드가 다시 뜨지 않게
    "look-now": () => { st.notice = ""; lookAfterWork(lastPing); },
    "peek-text": () => { set({ ping: "", openInput: !!st.j }); focusText(); },
    "ping-later": () => { st.ping = ""; go("petit"); },
    draft: () => { if (refuse(mealWhy())) return; draft(false); },
    review: () => { if (refuse(mealWhy())) return; review(false); },
    "confirm-doc": () => confirmDoc(false),
    "confirm-anyway": () => confirmDoc(true),
    "confirm-cancel": () => set({ askConfirm: 0 }),
    "reopen-doc": () => { const x = docDone(docStage().n); if (x) set({ doc: newDoc(x.stage, x.text, "") }); },
    // F-144-12(2026-11-03): 진짜 AI 모드의 대화는 서버(앱 저장 곳)에도 쌓여, 다시 켜면 chatlogLoad가 되살렸다 — 그 대화도 지운 뒤 다시 읽는다
    //   새 맥락 리뷰: 서버로 연 화면이면 지금 모드와 상관없이(진짜로 쓰다 연습으로 바꿨어도) 지금 폴더의 대화를 지운다. 못 지웠으면 숨기지 않고 멈춘다(security-records 6-1) — 폴더가 없으면(400) 지울 것이 없다
    forget: async () => {
      if (canLive) {
        let ok = false, none = false;
        try { const r = await fetch("/api/chatlog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true }), credentials: "same-origin" }); ok = !!r.ok; none = r.status === 400; } catch {}
        if (!ok && !none) return say("서버에 남은 대화를 지우지 못했어요 — 기록은 그대로 두었어요. 잠시 뒤 다시 눌러 주세요");
      }
      forgotten = true; try { localStorage.removeItem(KEY); localStorage.removeItem(BOUND_KEY); localStorage.removeItem("floe:setup:v1"); } catch {} location.reload(); },   // 처음 설정도 처음부터
    setup: () => { set({ settings: false, qwin: false }); if (window.FloeSetup) window.FloeSetup.open(); },   // 처음 설정은 섬 창에 뜬다 — 작업실이 열려 있으면 먼저 닫아 섬 창이 다시 보이게(C-41 ⑤, 새 맥락 리뷰 2026-10-27)
    "setup-project": () => { set({ settings: false, qwin: false }); if (window.FloeSetup) window.FloeSetup.open({ step: "project" }); },   // 처음 설정의 프로젝트 칸부터(2026-10-24 리뷰 — 새 프로젝트마다 AI 연결을 다시 거치지 않게). 작업실은 먼저 닫는다 — setup과 같이(F-123)
    gate: () => set({ screen: "gate", step: "ask", hard: [], question: "", answer: "", noCount: 0, error: "", showCrit: false, check: null }),
    "close-gate": () => set({ screen: "main" }),
    no: () => { set({ noCount: st.noCount + 1, step: "which", hard: [], answer: "", question: "" }); say("모르는 게 당연해요. 같이 풀어요"); reveal(".hold-offer"); },
    "hard-t": (i) => toggleHard(i),
    "to-question": () => {
      if (!st.hard.length) { flash("think", 1200); return say("헷갈린 곳을 하나 이상 골라 주세요"); }
      set({ step: "question" });
    },
    answer: () => answer(),
    plan: () => set({ step: "plan" }),
    // '예' → 확인 질문 하나(understand.js) → 바로 다음 단계(순서 정하기는 뺐다 — 2026-10-18 임유정 결정). 오답 거리가 없는 단계면 질문 없이 넘어간다
    yes: () => { const q = U.checkQuestion(stage().n); if (!q) return toNext(); set({ step: "check", check: { q, pick: null, ok: null } }); },
    // 맞히면 바로, 틀리면 정답과 한 줄 설명을 보인 뒤 '계속' — 어느 쪽이든 막지 않고 결과만 남긴다
    "check-pick": (i) => {
      const c = st.check;
      if (!c || c.pick !== null || !c.q.options[i]) return;
      const r = U.grade(c.q, i);
      st.checks = U.record(st.checks, c.q.stage, r.ok, ymd());
      st.check = { ...c, pick: i, ok: r.ok };
      if (r.ok) { toNext(); return say(U.FACE.right[1]); }
      render(); flash("think", 1200);
    },
    "check-go": () => toNext(),
    up: (i) => set({ todos: N.reorder(st.todos, i, -1) }),
    down: (i) => set({ todos: N.reorder(st.todos, i, 1) }),
    // 꼭 할 일 ↔ 나중에 (priority.js). 고른 쪽 단추를 누르면 그쪽으로
    prio: (i, el) => { const t = st.todos[i], want = el.dataset.later === "true"; if (t !== undefined && P.isLater(st.todoLater, t) !== want) set({ todoLater: P.toggle(st.todoLater, t) }); },
    go: () => advance(),
    // 잠시 멈추기(FR-5 보류) — 누가·언제 다시 볼지 적고 멈춰 둔다. 멈춰 둬도 넘어가는 규칙(canAdvance)은 그대로라 다음 단계로 가지 않는다
    hold: () => { set({ step: "hold", holdWho: st.holdWho || "나", holdWhen: "" }); reveal(".holdform"); },
    "hold-back": () => set({ step: "which" }),
    "hold-save": () => {
      const h = U.makeHold({ stage: stage().n, who: st.holdWho, when: st.holdWhen, today: ymd() });
      if (!h) { flash("think", 1200); return say("다시 볼 날을 오늘이나 그 뒤로 골라 주세요"); }
      set({ hold: h, screen: "main", step: "ask", tab: "today" });
      say("멈춰 둘게요. 그날 다시 같이 봐요");
    },
    "hold-resume": () => { st.hold = null; ACT.gate(); say("다시 같이 봐요!"); },
    // 용어 풀이 펼치기·접기 — 다시 그린 뒤에도 누른 단추에 머문다(키보드로 쓰는 사람)
    term: (i, el) => {
      const t = el.dataset.term;
      set({ termOpen: st.termOpen === t ? "" : t });
      const b = [...document.querySelectorAll('[data-act="term"]')].find((x) => x.dataset.term === t);
      if (b) b.focus();
    },
    // 예시 책 지우기 / 다시 보기(2026-10-19) — 두 화면이 같은 열쇠를 읽는다. 지우면 내 책만 남고, 선택은 풀어 둔다(지운 책이 펼쳐져 있을 수 있어서)
    "ex-hide": () => { exHidden = true; if (M) M.writeHidden(STORE, true); applyEx(); set({ libSel: null, libConfirm: false }); say("예시 책을 치웠어요. 이제 내 기록만 보여요"); },
    "ex-show": () => { exHidden = false; if (M) M.writeHidden(STORE, false); applyEx(); set({ libSel: null, libConfirm: false }); say("예시 책을 다시 꺼냈어요"); },
    // 느낀 점(2026-10-19) — 남기기 · 지우기 · Jira용 복사(가린 글을 클립보드에) · 전부 지우기
    notes: () => set({ notesOpen: !st.notesOpen, noteCopy: "" }),
    "note-add": () => {
      if (!NT || !st.noteText.trim()) return;
      noteList = NT.add(noteList, { text: st.noteText, ...noteCtx() }); NT.write(STORE, noteList);
      set({ noteText: "", noteCopy: "" }); say("남겨 뒀어요. 고마워요!");
      focusAct("[data-act=note-text]");
    },
    "note-del": (i, el) => { if (!NT || !el) return; noteList = NT.remove(noteList, el.dataset.id); NT.write(STORE, noteList); render(); },
    "notes-clear": () => { if (!NT) return; noteList = []; NT.write(STORE, noteList); set({ noteCopy: "" }); say("느낀 점을 모두 지웠어요"); },
    "notes-copy": async () => {
      if (!NT || !noteList.length) return;
      const text = NT.toJira(noteList, (t) => (window.NavSensitive ? window.NavSensitive.redact(t) : t));
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
      set({ noteCopy: ok ? "" : text }); say(ok ? `느낀 점 ${noteList.length}개를 복사했어요 — Jira에 붙여 넣어요` : "자동 복사가 안 돼서 글을 아래 두었어요");
    },
    // 자동 살펴보기 · 다음 장 미리 보기(퀘스트 창의 도전과제) · 느낀 점 열기
    "auto-toggle": () => { set({ auto: !st.auto }); say(st.auto ? "AI 코딩 도구가 일을 마치면 저절로 살펴볼게요" : "이제 눌러야 살펴봐요"); },
    peek: () => { const nx = nextStage() ? nextStage().n : null; st.qview = nx; st.mapSel = null; openQwin("quest"); set({ settings: false, questUp: true }); },   // 다음 장 미리 보기 — 합친 탭의 그 장 카드(C-66 장 화면 대신)
    "notes-open": () => set({ settings: true, notesOpen: true }),
    // Electron 앱(2026-10-19) — 폴더를 골라 훅을 더하거나 빼고, .env를 두는 설정 폴더를 연다. 앱 밖에서는 단추가 없다
    "app-connect": async () => {   // 고른 폴더가 곧 플로로가 움직이는 자리(C-31) — 앱이 서버에도 알린다. 경로 대신 폴더 이름만 말한다
      const r = await window.floeApp.connect();
      if (r && r.ok && r.name) connected(r); else if (r && r.message) say(r.message.split("\n")[0]);   // 말은 60자 안(SAY_MAX)
    },
    // 연결을 빼면 이름표의 옛 이름도 잊는다 — GitHub 칸(st.gh)은 다시 묻고(서버가 아는 다른 폴더가 있으면 그 이름), 훅 알림으로 안 이름(st.project)도 비운다.
    //   전에는 뺀 뒤에도 옛 폴더 · 저장소 이름이 남았다(F-58-5 새 맥락 리뷰, 2026-10-25) — claude-drafted: 2026-10-25
    "app-disconnect": async () => { const r = await window.floeApp.disconnect(); if (r && r.ok) disconnected(); if (r && r.message) say(r.message.split("\n")[0]); },
    "app-settings": () => window.floeApp.openSettings(),
    "gh-reload": () => { st.ghNote = ""; st.gh = null; loadGithub(); render(); },   // 설정의 GitHub 칸(C-25, 2026-10-24)
    "tokens-reset": () => resetTokens(),   // 토큰 칸 — 새로 재기(2026-10-24)
    "gh-vis": (i, el) => set({ ghVis: el && el.dataset.v === "public" ? "public" : "private" }),
    "gh-create": () => createRepo(),
    alog: () => set({ alogOpen: !st.alogOpen, alogNote: "" }),
    // 연결 끊기 — 끊은 동안 들어온 알림은 받지 않는다(alerts.js accept). 다시 연결하면 그 뒤의 알림부터 받는다
    unplug: () => { set({ unplug: !st.unplug, ping: st.unplug ? st.ping : "" }); say(st.unplug ? "연결을 끊었어요. 작업 알림을 받지 않아요" : "다시 연결했어요"); },
    "alog-clear": () => clearAlerts(),
  });
  // iPhone — 아래 막대 뒤나 스크롤 밖에 생긴 칸(잠시 멈추기 권유·적는 칸)을 보이는 곳으로 옮긴다. 없으면 아무것도 안 한다
  const reveal = (sel) => { if (isPhone()) requestAnimationFrame(() => { const el = $phone.querySelector(sel); if (el) el.scrollIntoView({ block: "center", behavior: STILL ? "auto" : "smooth" }); }); };
  // 넘어가기 전 확인의 마지막 — 다음 단계 할 일로 순서 정하기를 연다(꼭/나중에는 처음엔 모두 꼭)
  // 확인 질문 뒤 — 순서 정하기 없이 바로 다음 단계로(2026-10-18 임유정 결정, FR-12는 팀이 정한다 · PR #105). 마지막 단계만 '마치기'를 한 번 더 묻는다
