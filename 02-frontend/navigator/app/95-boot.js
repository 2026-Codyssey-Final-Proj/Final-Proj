  // ── 단축키 (PC) — 카드 버튼에 적힌 키. 글을 쓰는 중에는 Esc와 Ctrl+Enter만. 한글 자판의 ㅛ·ㅜ도 Y·N으로 ──
  const ALIAS = { "ㅛ": "y", "ㅜ": "n", "ㅗ": "h" };
  // Ctrl+Enter가 부를 카드 동작 — 글을 쓰는 중이면 그 카드(.mc) 안의 칸일 때만 카드의 Ctrl+Enter. Enter 동작으로 넘어가지 않는다
  //   (파일 편집기 · 설정 칸에서 Ctrl+Enter가 카드의 Enter — 커밋 · 푸시 맡기기 등 — 를 불렀다, F-122)
  function ctrlEnterAct(t, writing) {
    if (!writing) return deskKeys["c-Enter"] || deskKeys.Enter || null;
    return (t && t.closest && t.closest(".mc:not(.pane)") && deskKeys["c-Enter"]) || null;   // .pane — 설정 · 서재 판도 .mc다
  }
  document.addEventListener("keydown", (e) => {
    activity();
    if (isPhone() || e.isComposing) return;
    if (greetSkip) { greetSkip(); if (e.key === "Escape") { e.preventDefault(); return; } }   // 켤 때 인사 중: 어떤 키든 움직임을 끝내고, Esc는 그것만
    const t = e.target, writing = isField(t);
    if (t.dataset && t.dataset.act === "say" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); return send(); }   // 채팅 칸(C-22): Enter는 보내기, Shift+Enter는 줄 바꿈
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && st.qwin && st.qtab === "file") { e.preventDefault(); return ACT.fsave(); }   // 파일 저장(C-43)
    if (e.key === "Escape") {
      if (st.gacha) return set({ gacha: st.gacha.phase === "rolling" ? st.gacha : null });   // 뽑기 창(C-22)
      if (st.settings) return set({ settings: false });
      if (deskKeys.Escape && st.ui === "home") { e.preventDefault(); return run(deskKeys.Escape); }
      if (st.qwin) return closeQwin();   // 퀘스트 창(C-22)
      return view("esc");
    }
    if (st.ui !== "home" && st.ui !== "greet") return;
    if (t.tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) return;   // 버튼 위의 Enter는 그 버튼을 누른 것
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      const a = ctrlEnterAct(t, writing);
      if (a) { e.preventDefault(); run(a); }
      return;
    }
    if (writing || e.ctrlKey || e.altKey || e.metaKey) return;
    const k = e.key.length === 1 ? ALIAS[e.key] || e.key.toLowerCase() : e.key;
    const a = deskKeys[k];
    if (a) { e.preventDefault(); run(a); }
  });

  // ── Claude Code·Codex 연결 — 서버에 2초마다 새 알림을 묻는다(서버로 열었을 때만) ──
  let lastSeq = -1;   // -1: 아직 한 번도 안 물음 — 처음에는 지난 알림을 다시 띄우지 않고 기준만 잡는다
  let appName = "";   // 앱이 고른 작업 폴더 이름(서버 답의 project) — 있으면 이름은 이것만 따른다. 다른 폴더에서 쓴 Claude Code의 알림(here: false)이 이름을 바꾸지 않게(임유정 2026-10-28)
  async function poll() {
    let r;
    try { r = await (await fetch(`/api/events?since=${Math.max(lastSeq, 0)}`)).json(); } catch { return; }
    if (!r.ok) return;
    const was = st.project; appName = r.project || ""; if (appName) st.project = appName;
    if (appName && st.mode === "live" && appName !== docsFor) { docsFor = appName; docsCheck(); }   // C-49 폴더마다 한 번 — 단계 문서를 다시 읽는다
    const first = lastSeq < 0, ev = r.events[r.events.length - 1];
    lastSeq = r.latest;   // 연결을 끊은 동안에도 기준은 앞으로 — 다시 연결했을 때 지난 알림을 한꺼번에 받지 않는다
    if (!ev) return st.project !== was ? render() : undefined;
    if (!first) return onEvent(r.events.findLast(A.notifies) || ev);   // 2초 사이에 마침 · 시작이 같이 오면 마침을 알린다(2026-10-23 — 알림은 마칠 때만)
    if (!st.unplug) { st.feed = { at: ev.at, project: ev.project, tool: ev.tool }; if (ev.project && ev.here !== false && !appName) st.project = ev.project; }
    render();
  }
  // 작업을 알아챈다: 알림 기록에 한 줄 남기고(FR-7), 글 칸에 최근 작업을 채우고 한 줄로 알린다. 작업을 마쳤을 때 바로 살펴보는 건
  //   진짜 AI면 '자동으로 살펴보기'를 켰을 때만(작업 글이 밖으로 나가서), 연습 알림(작업 장면 보기)이면 이 화면 안에서만 살펴보니 늘
  let lastPing = { tool: "", kind: "" };
  async function onEvent(ev) {
    if (!A.accept(ev, st.unplug)) return;   // 연결을 끊은 동안 들어온 알림 — 글 칸 채우기·살펴보기·기록 모두 하지 않는다
    if (!ev.sim) { st.feed = { at: ev.at, project: ev.project, tool: ev.tool }; if (ev.project && ev.here !== false && !appName) st.project = ev.project; }
    // 연결한 폴더가 아닌 곳의 알림 — 연결 표시만 살고, 글 칸 · 살펴보기 · 알림 기록은 지금 폴더의 것이라 건드리지 않는다(채팅에 한 줄로 어디서 온 일인지만)
    if (ev.here === false) { if (A.notifies(ev)) logMsg("sys", `${esc(ev.project || "다른 폴더")}에서 ${esc(toolName(ev.tool))}가 일을 마쳤어요 — 지금 작업 폴더가 아니라 살펴보지 않아요`); return render(); }
    if (!A.notifies(ev)) return render();   // 새 작업을 시작했을 때는 알리지 않는다 — 연결 표시(마지막 소식 때)만(2026-10-23)
    if (st.settings && !ev.sim) fetchUsage();   // 일을 마쳤다 — 열려 있는 토큰 칸을 새 값으로(2026-10-24)
    if (!ev.sim && tw) twTick();   // 맡긴 일이 끝났을 수 있다 — 3초를 기다리지 않고 바로 묻는다(C-32 · F-69)
    st.alerts = A.add(st.alerts, ev, (t) => sensitive(t).length > 0);
    scheduleRefit(ev);   // C-56 R-5 — 몇 초 모아 지금 단계 초안을 다시 맞춘다
    if (st.busy) return render();
    if (ev.work) st.text = ev.work;
    activity();
    const tool = toolName(ev.tool);
    lastPing = { tool, kind: ev.kind };
    logMsg("sys", `${esc(tool)}가 일을 마쳤어요${ev.sim ? " · 연습 알림" : ""}`);   // 채팅에 한 줄(C-22)
    // F-153(임유정 2026-11-04 "8단계 … 관문을 통과했는데도 … 계속 루프가 돈다"): 다 마친 뒤의 알림(문서 올리기의 커밋 · 푸시도)은 채팅 한 줄로 끝 —
    //   '어디쯤인지 볼까요?'를 누르면 살펴보기가 끝난 상태를 풀어 8단계 관문이 다시 열렸다. claude-drafted: 2026-11-04
    if (st.finished) { st.ping = ""; return render(); }
    const auto = st.screen !== "gate" && (ev.sim ? st.mode === "fixture" : st.auto && st.mode === "live");
    if (auto) {
      await lookAfterWork(lastPing);
      if (ev.sim || st.warn) view("alert");
      return;
    }
    st.ping = `${tool}가 방금 작업을 마쳤어요 — 눌러서 어디쯤인지 볼까요?`;
    peek();
  }
  // 작업 알림 뒤 살펴보기 — 보통의 살펴보기(judge)를 그대로 쓰고, 새로 끝낸 할 일을 알림 기록과 카드에 붙인다(FR-7 '끝났다고 표시')
  async function lookAfterWork(p) {
    const before = st.j;
    st.ping = "";
    pendingNotice = p.kind === "stop" ? `${p.tool}가 작업을 마쳐서 다시 살펴봤어요.` : "";
    await judge(false);
    const done = st.j !== before ? A.newlyDone(before, st.j) : [];
    if (!done.length) return;
    st.alerts = A.markDone(st.alerts, done);
    st.notice = `${p.tool} 작업을 보고 끝냈다고 표시했어요: ${done.join(", ")}`;
    render();
  }
  if (canLive) { poll(); setInterval(poll, 2000); fetchUsage(); }
  // AI 진행(C-12) — 기본 화면의 '지금 한 줄' · AI 진행 판이 쓴다. 서버로 열렸으면 /api/steps?since=를 2초마다(기본 화면이 펼쳐져 있을 때만), 파일로 열렸거나 거절하면 예시
  async function pollSteps() {
    if (!HUB || !STEPS) { aiMode = "none"; return; }
    if (!canLive) { if (aiMode !== "example") { aiMode = "example"; aiSessions = HUB.exampleSessions(STEPS, Date.now()); } return; }
    try {
      const r = await fetch(`/api/steps?since=${aiLatest}`, { credentials: "same-origin" });
      const j = await r.json();
      if (!j || !j.ok) throw new Error("refused");
      aiMode = "live"; aiLatest = Number(j.latest) || aiLatest; aiSessions = HUB.mergeSessions(aiSessions, j.sessions);
    } catch { if (aiMode !== "live") { aiMode = "example"; aiSessions = HUB.exampleSessions(STEPS, Date.now()); } }
  }
  pollSteps().then(() => { if (st.place === "base" && st.ui === "home") render(); });
  chatlogLoad().then((ok) => { if (ok) render(); });   // C-63 — 켤 때 저장된 대화를 이어서(진짜 AI 모드)
  if (canLive) setInterval(async () => { const was = aiLatest, busy = working(); await pollSteps(); if (working() !== busy || (st.ui === "home" && aiLatest !== was)) render(); }, 2000);   // 채팅의 '일하고 있어요' 띠(C-22). 접혀 있어도 묻는다 — 알약의 플로로가 일하는 줄 알아야 한다(F-154). 일이 끝나면 새 줄이 없어도 다시 그린다 — 작업실 창은 다시 그려야 바뀐다

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
  // 연습 알림에 실을 작업 글 — 지금 단계 '하는 중' 예시에 그 질문의 첫 선택지를 고른 한 줄을 붙인 것(사용자가 직접 골랐을 때와 같은 글)
  function simWork() {
    const ex = stageExamples()[0];
    if (!ex) return { text: st.text, decided: "" };
    const q = ex.judgement.next, decided = N.decisionLine(q.question, q.options[0]);
    return { text: `${ex.text}\n${decided}`, decided };
  }
  // 작업 장면 보기 — 대화가 흐른 뒤 Claude가 작업을 마쳤다는 연습 알림(stop)을 보낸다. 받는 쪽은 진짜 알림과 같은 길(onEvent → 살펴보기)
  document.getElementById("play").addEventListener("click", () => {
    $chat.textContent = ""; let k = 0;
    const w = simWork();
    const lines = [...LINES, ...(w.decided ? [["me", `› ${w.decided}`], ["", "좋아요, 그렇게 적어 둘게요."]] : []), ["dim", "— Claude가 작업을 마쳤어요 (연습 알림)"]];
    const step = () => {
      if (k < lines.length) { line(lines[k++]); return setTimeout(step, 700); }
      onEvent({ kind: "stop", tool: "claude", at: Date.now(), project: S.PROJECT, work: w.text, sim: true });
    };
    step();
  });

  // ── 주소 끝으로 장면 바로 열기 (시연·녹화용). 진짜 AI를 부르지 않고 연습 예시로만 장면을 만든다 ──
  //   #start · #ex=<단계>(그 단계 '하는 중' 예시) · &done(그 단계를 다 한 예시) · &tab=<탭> · &crit(할 일 펼침) · &gate(넘어가기 전 확인) · &book=<책>
  //   · &tier=Lite|Xpress|Full(만드는 크기 — 장면보다 먼저 정한다) · &noex(예시 책 없이 — 내 책만, 2026-10-19)
  const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };   // 깨진 %(예: #book=50%)는 글자 그대로 — 던지면 시작 코드 전체가 멈춰 빈 화면(F-103-12)
  function fromHash() {
    const h = location.hash.slice(1);
    if (!h) return;
    const q = Object.fromEntries(h.split("&").map((kv) => kv.split("=").map(safeDecode)).map(([k, v]) => [k, v === undefined ? true : v]));
    Object.assign(st, { ui: "home", userPin: true, screen: "main", settings: false, warn: null, error: "", ping: "", showCrit: false, libSel: null, libConfirm: false, openInput: false,
      termOpen: "", check: null, undo: [], own: false, meal: null, libDoc: null, qwin: false, ...(q.back ? {} : { chat: [], chatMark: 0, chatChanges: [], chatOpen: null }) });   // 장면은 대화 · 대화 표시 자리도 처음부터(C-63). 서고에서 돌아온 &back은 장면이 아니라 그대로 — 비우면 다음 저장이 대화를 지웠다(F-126)
    lastLive = null;
    // 주소로 연 장면은 바이브 코딩(녹화 · 시험이 그대로), #base(&pane=alerts|ai)만 기본 화면(C-13, 넘김 문서 9절 7번)
    // 서고에서 돌아온 주소(&back)는 장면이 아니다 — 떠난 모드 그대로(F-36, PR #139 리뷰: 기본 화면에서 서재에 다녀오면 바이브 코딩이 됐다)
    if (q.base) { st.place = "base"; st.pane = ["alerts", "ai"].includes(q.pane) ? q.pane : ""; } else setPlace(q.back ? "library" : "scene");
    if (!q.back) st.qfocus = "stage";   // 주소로 연 장면은 단계 퀘스트 쪽(C-35) — 서고에서 돌아온 &back만 그대로
    if (FP && (q.pane === "plan" || q.plan)) st.qfocus = "plan";   // #base&plan — 채팅의 준비 계획. 옛 주소 &pane=plan(계획판, 2026-10-24)도 이리로
    if (q.approve && AP) { approvals = AP.EXAMPLE.map((a) => ({ ...a, at: Date.now() })); apMode = "example"; st.task = { text: "", lines: null, say: "", sent: "" }; st.apSure = ""; }   // &approve=1 — 예시 승인 카드(FR-17, 녹화 · 시험용)
    if (q.tier && TIERS.some(([v]) => v === q.tier)) { st.tier = q.tier; if (st.j) st.j = T.refit(st.j, st.tier); }
    if (q.noex) { exHidden = true; applyEx(); }   // 이 화면만 예시 책 없이(시험 · 시연용) — 저장하지 않는다
    if (q.start) Object.assign(st, { codeless: null, linesDone: [], carryUse: {}, carryDone: false, j: null, finished: false, todos: null, text: S.first.text, tab: "today", hold: null, quest: null, idea: "", topic: "", results: {}, mats: {}, ship: null, prep: null, mapSel: null });
    // #feed — 먹이 주기의 정리 장면(예시 먹이, C-15 — 녹화 · 시험용)
    if (q.feed && FD) Object.assign(st, { j: null, finished: false, todos: null, tab: "today", hold: null, text: FD.EXAMPLE, meal: feedState(FD.EXAMPLE, true) });
    if (q.ex !== undefined) {
      const n = Number(q.ex), mine = S.examples.filter((e) => e.judgement.stage === n);
      const ex = q.done ? mine.find((e) => e.judgement.criteria.every((c) => c.met)) : mine.find((e) => !e.hidden);
      if (ex) {
        const base = ex.from !== undefined ? S.examples[ex.from] : null, nx = base && base.judgement.next;
        const text = base ? `${base.text}\n${N.decisionLine(nx.question, nx.options[0])}` : ex.text;
        const j = fixtureJudge(text, n);
        if (j) { Object.assign(st, { text, judged: text, j, todos: null, todoLater: [], choice: null, later: false, picking: false, finished: false, notice: "", tab: "today", hold: null }); learn(j); }
      }
    }
    // 옛 주소 #tab=learn('내 배움' 탭 2026-10-18, 서재의 '내 배움' 2026-10-19에 지움) — 서고로 보낸다. 앞의 장면(ex= 등)을 먼저 기록해 두고 넘어간다
    if (q.tab === "learn") { if (SHELF_ON) { save(); location.replace(`${LIB_URL}#lib`); return; } st.qwin = true; st.qtab = "quest"; }   // 서재를 잠시 뺀 동안(2026-10-23)은 서고 대신 배우기 — 2026-10-24부터 도전과제 안(C-35), 2026-10-30부터 합친 퀘스트 탭(C-65)
    if (q.tab && TABS.some((t) => t[0] === q.tab)) st.tab = q.tab;
    // 퀘스트 창(C-22, 2026-10-21): &tab=map · lib는 PC에서 퀘스트 창의 도전과제 · 서고 탭, &q=draft|quest|done은 퀘스트 장면(시험 · 녹화용), &set=1 설정 창, &side=right
    if ((q.tab === "map" || q.tab === "lib") && !q.back) { st.qwin = true; st.qtab = q.tab === "map" ? "quest" : "lib"; }   // 서고에서 돌아올 때(&back)는 창을 열지 않는다 — 떠난 모습 그대로(F-36)
    if (q.set) st.settings = true;
    if (q.shells !== undefined) st.shells = Math.max(0, Number(q.shells) || 0);   // 시험 · 녹화용 — 조개 수
    if (q.q && QU) {
      const n = atStage(); st.idea = st.idea || S.first.text.split("\n")[0];
      let qq = QU.makeQuest(N.STAGES[n], crits(n));
      if (q.q !== "draft") { qq = { ...qq, phase: "quest" }; if (q.q === "done") qq.objs.forEach((o, i) => { qq = QU.fill(qq, i, QU.example(qq, i) || `${o.name} 적음`); }); }
      Object.assign(st, { quest: qq, qwin: true, qtab: "quest" });
    }
    if (q.book) st.libSel = String(q.book);
    st.bvOpen = !!q.view;   // &view — 책의 보기 설정 판을 펼친 채(C-9, 녹화 · 시험용)
    // 옛 주소 &tab=doc(단계 문서 탭, 2026-10-20 C-16에 뺌)은 도서관의 책 안 그 단계 문서로 — 녹화(record-demo-gifs.py)와 e2e 장면이 그대로 이어진다. &doc=<단계>도 같다
    if (q.tab === "doc" || q.doc !== undefined) {
      const b = openBooks().find((x) => x.mine) || openBooks()[0];
      Object.assign(st, { tab: "lib", libSel: b ? b.id : st.libSel, libDoc: q.doc !== undefined ? Number(q.doc) : st.j ? st.j.stage : 1, qwin: true, qtab: "lib" });   // 책은 퀘스트 창의 서고 탭에(C-22)
    }
    if (q.crit) st.showCrit = true;
    if (q.gate && st.j && allDone()) Object.assign(st, { screen: "gate", step: "ask", hard: [], question: "", answer: "", noCount: 0 });
  }
  fromHash();
  addEventListener("hashchange", () => { fromHash(); render(); });

  // ── 켤 때 인사(C-10, 2026-10-20 이재엽 "처음에 반갑다고 인사하고 하는 모습이랑 켜지는 모습들") — 시간표는 greet.js, 단계마다 모양은 app.css([data-greet]) ──
  // 켤 때마다. 주소 끝 장면 · 휴대폰 · 움직임 줄이기면 안 한다(greet.js shouldGreet). 처음 설정(setup.js)은 인사가 끝난 뒤 열린다(floe:greet-done)
  // C-46 R-1(2026-10-27 이재엽 "플로가 켜지면 … 알약" · 버튼 "알약 안에서 인사" · "하루에 한 번"): 켜면 큰 인사 카드 없이 알약(petit)으로, 인사는 알약 안에서(startGreeting — greet.js PILL_TIMELINE).
  //   같은 날 다시 켜면 인사 없이 알약만(floe:greet-day). 주소 끝 장면(시험 · 녹화)은 전처럼 기본 화면. 움직임 줄이기 · 휴대폰은 알약만
  const GREET_DAY = "floe:greet-day";
  // C-55(2026-10-28 이재엽 버튼 "접힌 알약 + 말풍선" · "켤 때마다"): 켜면 바로 작업실(퀘스트 탭 — 캔버스 탭은 2026-11-02 뺌) + 접힌 알약 + 알약 옆 말풍선(greet.js bootPlan). 처음 설정이 필요하면 전처럼(알약 안 인사 → 설정)
  const bootArgs = { hash: location.hash, still: STILL, phone: isPhone(), lastDay: readLS(GREET_DAY, ""), today: ymd(),
    setupNeeded: !!(window.FloeSetup && window.FloeSetup.shouldOpen(window.FloeSetup.readSaved(localStorage), location.hash)) };
  const boot = GR && st.ui === "greet" ? GR.bootPlan(bootArgs) : { workspace: false, bubble: false, greet: false };
  const greetNow = !!GR && st.ui === "greet" && !boot.workspace && GR.shouldGreet(bootArgs).greet;
  if (boot.workspace) { openQwin("quest"); st.ui = "petit"; st.boot = { greet: boot.greet, at: Date.now() }; if (boot.greet) writeLS(GREET_DAY, ymd()); setTimeout(() => { if (st.boot) { st.boot = null; render(); } }, GR.BUBBLE_MS); if (st.coach) { st.boot = null; st.ui = "home"; } }   // 첫 사용 안내 중에 껐다 켰으면 알약이 아니라 그 걸음으로(88-coach)
  else if (greetNow) { document.documentElement.classList.add("greeting"); st.ui = "petit"; }
  else if (st.ui === "greet") st.ui = location.hash && location.hash !== "#" ? "home" : "petit";
  function startGreeting() {
    const h = document.documentElement;
    const finish = () => {
      greetSkip = null; h.classList.remove("greeting"); delete h.dataset.greet;
      writeLS(GREET_DAY, ymd());   // 오늘은 인사했다(C-46 — 하루에 한 번)
      go("petit");   // 인사가 끝나도 알약 그대로(C-46 R-1) — 누르면 기본 화면. 전에는 기본 화면으로 펼쳤다(C-13)
      clearIdle(); scheduleIdle();
      document.dispatchEvent(new CustomEvent("floe:greet-done"));
    };
    const onPhase = (p) => {
      if (p === "done") return finish();
      h.dataset.greet = p;
      const host = liveCat();
      if (p === "pop" && host) C.burst(...center(host, 0.65), "bubble", 5, 120);   // 알약 크기의 거품(C-46)
      if (p === "settle") { document.body.classList.add("blink"); setTimeout(() => document.body.classList.remove("blink"), 140); }
    };
    const run = GR.play(GR.PILL_TIMELINE, { onPhase });   // 알약 안의 시간표(C-46) — 띠 · 열림 단계 없이 솟음 → 인사 → 자리 잡기
    greetSkip = () => run.skip();
    $nav.addEventListener("click", () => { if (greetSkip) greetSkip(); }, { capture: true });   // 누르면 바로 인사 카드로(누른 단추는 그대로 눌린다)
  }
  // 서고에서 돌아옴(2026-10-20) — 물이 빠지며 섬이 내려앉는다(index.html 머리가 html.surfacing을, 앱은 창을 먼저 섬 크기로)
  function startSurfacing() {
    // 새로 고침해도 또 떠오르지 않게. 기본 화면이면 주소 끝을 통째로 지운다(#tab=lib가 남으면 새로 고침 때 장면으로 읽혀 바이브 코딩이 된다 — F-36)
    history.replaceState(null, "", st.place === "base" ? location.pathname : `${location.pathname}${location.hash.replace(/&back(?=&|$)/, "").replace(/^#back$/, "")}`);
    window.FloeDive.surface({ cover: document.getElementById("dive-cover"), island: $nav.firstElementChild, done: () => reportSize() });
  }
  // 처음 설정(setup.js)이 끝나면 — 고른 길에 맞춰 보기 방식을 두고, '시작하기'를 눌렀으면 바로 보여 주기 화면으로 (2026-10-19)
  // 처음 설정을 닫은 뒤에 가져오기 · 새로 만들기가 끝났다(C-31) — 작업 폴더가 바뀌었으니 알린다
  window.addEventListener("message", (e) => { if (e.origin !== location.origin) return; const d = e.data; if (d && d.floe === "open" && typeof d.path === "string") clickAct({ dataset: { act: "map-open", v: d.path.slice(0, 500) } }); });   // 문서 지도의 '파일 보기에서 열기'(C-45) — 브라우저 판
  // C-53 상태 줄의 줄 위치 — 브라우저 판은 글 칸이 섬 안에 있어 여기서(앱의 작업실 창은 win.js가 같은 일을) 상태 줄 글만 바꾼다(전체 render 없이 — 치는 동안 글 칸이 흔들리지 않게)
  const caretHere = (e) => { const t = e.target; if (!t || !t.classList || !t.classList.contains("fv-edit")) return; caretLine = t.value.slice(0, t.selectionStart).split("\n").length; const pos = $nav.querySelector(".fv-st [data-pos]"); if (pos) pos.textContent = ` · 줄 ${caretLine}`; };
  $nav.addEventListener("keyup", caretHere); $nav.addEventListener("click", caretHere);
  // 작업 폴더가 바뀌면 옛 폴더에서 받아 둔 것을 잊고 다시 받는다 — 이름표(st.gh) · 파일 칸(작업실이 열려 있으면 바로). 처음 설정의 가져오기 · 새로 만들기와 앱 메뉴(F-72)가 같이 쓴다
  const forgetFolder = () => {
    docsFor = "";   // C-49 새 폴더의 단계 문서를 다시 읽게
    st.gh = null; st.openFiles = []; st.fileSel = -1; st.files = null; if (st.qtab === "file" || st.qtab === "map") st.qtab = "quest";   // 다른 폴더의 파일을 새 목록 번호에 잇지 않는다(새 맥락 리뷰 — 다른 프로젝트 파일을 덮을 수 있었다)
    if (canLive && !ghLoading) loadGithub();
    if (st.qwin) loadFiles();
    readmeAgain();   // 옛 폴더의 README 책 · 찾은 줄도(F-144-17)
  };
  window.floeUnsaved = () => st.openFiles.filter((f) => f.dirty).length;   // 앱(main.js pickAndConnect)이 폴더를 고르기 전에 묻는다 — 저장 안 한 파일이 있으면 한 번 더 확인(F-72)
  const projectPicked = (d) => {
    const n = String(d.name || "");
    forgetFolder(); chatRecheck();   // 새 폴더의 대화를 이어서 — 서버가 그 폴더를 알면 그때부터 쌓는다
    say(d.config ? "가져온 저장소에 Claude Code 설정이 있어요. 맡기기 전에 한 번 봐 주세요." : `${n.length > 20 ? `${n.slice(0, 19)}…` : n} 폴더로 바꿨어요. 이제 여기서 같이 일해요.`);
  };
  document.addEventListener("floe:project-picked", (e) => projectPicked((e && e.detail) || {}));
  // F-72(2026-10-28): 앱 메뉴(상단바 · 트레이)로 연결 · 연결 빼기 — 섬의 단추를 거치지 않아 앱이 끝난 뒤 알려 준다. 빼면 훅 알림으로 안 이름(st.project)도 잊는다(app-disconnect와 같이)
  //   섬의 '프로젝트 폴더 연결… · 연결 빼기…' 단추도 같은 길 — 전에는 이름표(st.gh)만 비워 파일 칸은 옛 폴더 그대로였다(F-72 새 맥락 리뷰)
  const connected = (r) => { forgetFolder(); chatRecheck(); say(r.config ? "이 폴더에 Claude Code 설정이 있어요. 맡기기 전에 한 번 봐 주세요." : `${r.name.length > 20 ? `${r.name.slice(0, 19)}…` : r.name} 폴더와 이었어요. 이제 여기서 같이 일해요.`); };
  const disconnected = () => { st.project = ""; forgetFolder(); render(); chatRecheck(); };   // 연결을 빼면 서버에 다시 묻는다 — 서버가 폴더를 모르면 보내지 않는다(폴더 없이 400)
  if (window.floeApp && window.floeApp.onProject) window.floeApp.onProject((d) => (d && d.add ? connected({ name: String(d.name || ""), config: !!d.config }) : disconnected()));
  document.addEventListener("floe:setup-done", (e) => {
    const d = (e && e.detail) || {};
    if (d.via === "practice") set({ mode: "fixture", error: "", warn: null });
    else if ((d.via === "cli" || d.via === "api") && canLive) { liveApprovals(); set({ mode: "live", error: "", warn: null }); }   // F-137 연습에서 띄운 예시 카드를 내리고 진짜로 묻는다
    readmeAgain();   // 연습 ↔ 진짜를 바꿨거나 폴더를 골랐을 수 있다 — 옛 README 책 · 찾은 줄을 잊는다(F-144-17 새 맥락 리뷰: toMode를 거치지 않는 길)
    chatRecheck();   // 처음 설정에서 폴더를 골랐을 수 있다 — 대화를 둘 폴더를 다시 묻는다(병합 뒤 고침 새 맥락 리뷰: 첫 실행에서 고른 폴더에 대화가 쌓이지 않았다)
    if (d.open) { setPlace("vibe"); st.tab = "today"; openQwin("quest"); st.islBig = null; go("home"); }   // '시작하기' — 작업실의 플로로 홈으로(F-146, 2026-11-04 두승현 "초기 설정 세팅 이후 … 작업실의 플로로 홈에서"): 섬을 펼친 채 작업실을 연다. 1단계 시작 전이면 가운데 큰 플로로와 입력 칸(bigAuto). 전에는 작업실 없는 옛 섬 화면으로 갔고, 작업실로 가려면 '퀘스트' 단추를 찾아 눌러야 했다
    st.gh = null;   // 처음 설정에서 프로젝트를 골랐으면 GitHub 칸을 다시 묻는다
    // C-31(2026-10-24): 처음 설정에서 새로 만든 폴더의 GitHub 저장소를 바랐으면 — 만드는 일은 사용자의 Claude Code에(C-25), 허락은 섬의 카드로
    if (d.makeRepo === "private" || d.makeRepo === "public") {
      st.ghVis = d.makeRepo;
      createRepo().then((r) => say(r && r.ok ? "저장소 만들기를 Claude Code에 맡겼어요. 허락을 구하면 여기서 물을게요." : "저장소를 맡기지 못했어요. 설정의 GitHub 칸에서 다시 해요."));
    }
  });

  render();
  if (greetNow) startGreeting();
  else if (document.documentElement.classList.contains("surfacing") && window.FloeDive && !isPhone()) startSurfacing();
  else document.documentElement.classList.remove("surfacing");
})();
