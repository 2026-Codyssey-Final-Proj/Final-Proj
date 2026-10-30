  // ── AI 호출 — 기다리는 동안 플로로가 "살펴보는 중" ──
  // 기다리는 시간 — AI는 얼마나 남았는지 알려 주지 않아서 퍼센트는 지어낸 숫자가 된다. 대신 지난 시간과 지난번에 걸린 시간을 보인다
  let waitFrom = 0, lastWait = 0, waitTimer = 0;
  const waitText = () => {
    // 예상 시간 = 지난번에 걸린 시간(처음엔 없음). 넘기면 '예상보다 길어져요'
    const s = Math.round((Date.now() - waitFrom) / 1000);
    if (!lastWait) return `${s}초`;
    return s <= lastWait ? `예상 ${lastWait}초 · ${s}초` : `예상보다 길어져요 · ${s}초`;
  };
  //   pending — 이미 보낸 요청(미리 부른 초안, C-40)을 같은 기다림 화면으로 기다린다
  //   이미 기다리는 중이면 보내지 않고 { busy } — 단추 더블클릭에 AI를 두 번 부르고(토큰 두 배 · 맡기기 409), 먼저 끝난 쪽이 바쁨 · 타이머를 풀던 것(F-103-5)
  async function callAI(url, body, pending = null) {
    if (st.busy) return { ok: false, busy: true, reason: "앞의 일을 아직 기다리고 있어요 — 끝난 뒤에 다시 눌러 주세요" };
    hold(); st.busy = true; waitFrom = Date.now(); render();
    waitTimer = setInterval(() => { const el = $nav.querySelector("[data-wait]"); if (el) el.textContent = waitText(); }, 1000);
    try {
      if (pending) return await pending;
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return await r.json();
    } catch { return { ok: false, reason: "AI에 연결하지 못했어요. server.js를 켜거나, 보기 방식을 '연습용 예시'로 바꿔 주세요" }; }
    finally { st.busy = false; clearInterval(waitTimer); lastWait = Math.round((Date.now() - waitFrom) / 1000); }
  }
  const WARN_NAME = { secret: "비밀번호나 비밀 열쇠", rrn: "주민등록번호", email: "이메일 주소", phone: "전화번호", ip: "인터넷 주소(IP)" };
  // 값은 다시 보이지 않고 종류만 말한다
  const sensitive = (text) => (window.NavSensitive ? [...new Set(window.NavSensitive.scan(text).findings.filter((x) => WARN_NAME[x.type]).map((x) => WARN_NAME[x.type]))] : []);
  // 진짜 AI로 보내기 전에 비밀번호 같은 게 보이면 멈추고 묻는다. "괜찮아요"를 누르면 RETRY[then]으로 다시 한다
  function guard(text, then) {
    const w = sensitive(text);
    if (!w.length) return false;
    st.warn = { w, then }; render();
    return true;
  }
  const RETRY = { chat: () => chatSend(chatText, true), start: () => startDraft(startText, true), stage: () => stageDraft(st.quest ? st.quest.chap : atStage(), true), judge: () => judge(true), draft: () => draft(true), review: () => review(true), plan: () => makePlan(true), planAgain: () => revisePlan(true), planAsk: () => { st.warn = null; askPlan(st.planAsk, true); } };   // plan* — 준비 계획판(C-34)
  // 새로 배운 말을 모은다. 돌려주는 것: 이번에 처음 배운 말들
  function learn(j) {
    const fresh = [];
    for (const c of j.criteria) if (c.met && c.term && !st.learned.some((x) => x.term === c.term)) { st.learned.push({ term: c.term, text: c.text }); fresh.push(c.term); }
    return fresh;
  }
  let pendingNotice = "";
  // sent: 살펴본 작업 글 — '물어보기'가 글 칸이 비었을 때 대신 보낸다(F-11)
  //   checkBy — 완료 기준을 누가 봤나(C-40 confirm — 초안을 칸마다 확인한 대로). 그 보고에만 붙는다(2026-10-26 리뷰 — 전역 값이 실패 뒤 다음 판정에 남을 수 있었다)
  // R-10(C-42 · F-60, 2026-10-27): 판정이 오면 코드 규칙(navigator.js gateRules)을 한 번 더 — 빈칸 표시 · 증거(그 장의 줄과 Claude Code가 파일을 고친 기록). 확인한 대로(C-40)도 같다
  //   증거는 진짜 세션(aiMode live)의 파일 기록만 — 서버 없이 열면 예시 세션이라 증거가 아니다. 연습 모드(fixture)는 증거 면제(빈칸 표시 규칙만 — 이재엽 버튼 2026-10-27 "연습은 증거 면제")
  const workEvidence = () => { if (st.mode === "fixture") return true; if (aiMode !== "live") return false; const s = latestSession(); return !!(s && (s.steps || []).some((x) => x.what && (x.add || x.del))); };
  const gateApply = (j) => { if (!j || !N.gateRules) return j; const q = st.quest && st.quest.chap === j.stage ? st.quest : null; const g = N.gateRules(j, { lines: q ? q.objs.map((_, i) => (q.lines[i] || []).join(" / ")) : [], work: workEvidence() });
    if (!q || !QS) return g;   // C-56: 건너뛴 칸의 기준은 넘김(까닭을 결정 기록 · 문서로, F-62와 같은 줄), 먼저인 칸은 '안 됨'(관문 닫힘)
    // 지금 장의 줄(기능 수 등)을 사실에 넣는다 — 첫 판정 때는 아직 st.results에 없다(새 맥락 리뷰 2026-10-28 막힘)
    const sts = qstates(q, { [q.chap]: QU.resultOf(q) }); return { ...g, criteria: g.criteria.map((c, i) => { const x = sts[i]; if (!x) return c; if (x.state === "skip") return { ...c, met: true, skipped: true, reason: x.why }; if (x.state === "first") return { ...c, met: false, why: "first" }; return c; }) }; };
  const skipOf = (j) => { const sk = (j && j.criteria ? j.criteria : []).filter((c) => c.skipped && c.reason); return sk.length ? { reason: [...new Set(sk.map((c) => c.reason))].join(" · ").slice(0, 200), items: sk.map((c) => c.text) } : null; };
  const checkOf = (j) => j.criteria.map((c) => ({ text: c.text, met: !!c.met, evidence: String(c.evidence || "").slice(0, 300), ...(c.why ? { why: c.why } : {}), ...(c.skipped ? { skipped: true } : {}) }));
  function landed(j0, tokens, sent = st.text, checkBy = "") {
    const j = gateApply(j0);
    const was = allDone();
    Object.assign(st, { j, tokens: tokens || 0, todos: null, openInput: false, choice: null, later: false, picking: false, back: "", notice: pendingNotice, finished: false, judged: sent });
    if (QU && st.quest && st.quest.phase === "quest" && QU.isDone(st.quest) && st.quest.chap === j.stage) {   // 다 적은 퀘스트를 살펴본 결과가 왔다 = 완료 보고가 됐다
      st.quest = { ...st.quest, phase: "done" };
      // 단계 결과(C-37) — 한곳에서 보기 · 도전과제 지도 · 다음 장 초안 · 문서. C-39: 칸을 다 확인한 날 · 완료 기준과 근거(문서의 증빙)
      st.results = { ...st.results, [st.quest.chap]: { ...QU.resultOf(st.quest), at: ymd(), check: checkOf(j), ...(checkBy ? { checkBy } : {}), ...(skipOf(j) ? { skip: skipOf(j) } : {}), ...(st.quest.chap === 5 && st.codeless && !(factsNow().codeFiles > 0) ? { nocode: true } : {}) } };   // 아니요 뒤에 코드가 생겼으면 '코드 없이'로 남기지 않는다   // skip — 건너뛴 기준의 까닭(C-56 · F-62)
    }
    // 다시 살펴본 결과 — 결정 기록의 '기준 n/m'이 관문을 연 살펴보기와 같게(F-60 ①: test-1은 첫 살펴보기 1/4만 남았다)
    else if (st.results[j.stage] && !st.results[j.stage].passed) st.results = { ...st.results, [j.stage]: { ...st.results[j.stage], check: checkOf(j), ...(checkBy ? { checkBy } : {}) } };
    pendingNotice = "";
    if (j.reason) logMsg("floro", esc(j.reason));   // 플로로의 쉬운 말 풀이(AI의 reason)는 채팅에 남긴다(C-22)
    const fresh = learn(j);
    // 다 했으면 스스로 펼쳐서 알린다(CouCou의 alert), 아니면 접혀 있던 것만 한 줄로 보인다
    if (allDone()) { view("alert"); if (!was) { if (fresh.length) logMsg("floro", `새 말을 배웠어요: ${esc(fresh.join(", "))}`); return celebrate("done"); } } else peek();   // 축하로 빠지기 전에 배운 말은 채팅에(F-103-25)
    if (fresh.length) requestAnimationFrame(() => say(`새 말을 배웠어요: ${fresh.join(", ")}`));
  }
  const stop = (msg) => { st.error = msg; pendingNotice = ""; render(); };   // 보낼 수 없을 때 — 이유를 보여 주고 멈춘다
  // 토큰 사용량(F-12) — 서버로 열었을 때만 /api/usage를 묻는다. 기록(save)에는 넣지 않는다(그때그때 서버에서 받는 값)
  function fetchUsage() {
    if (!canLive) return;
    usageLoading = true;
    fetch("/api/usage", { cache: "no-store" }).then((r) => r.json()).then((j) => { usage = j && j.ok ? j : { ok: false }; usageLoading = false; if (st.settings) render(); })
      .catch(() => { usage = { ok: false }; usageLoading = false; if (st.settings) render(); });   // 실패도 한 번만 — 다시 그릴 때마다 묻지 않게(설정을 다시 열면 다시 묻는다)
  }
  // 진짜 AI에게 묻는 네 가지(어디쯤·물어보기·초안·다시 봐 주기)가 같이 쓰는 흐름:
  // [check가 있으면 비밀번호 같은 게 보일 때 먼저 멈춤] → 호출 → 성공이면 done(r), 실패면 지어내지 않고 이유만 보여 준다
  async function askAI(url, body, what, done, check) {
    if (check && guard(...check)) return;
    const r = await callAI(url, body);
    if (r.busy) return;   // 더블클릭의 두 번째 — 오류가 아니라 앞 호출이 답을 그린다(F-103-5)
    if (r.ok) { st.tokens = r.tokens || 0; fetchUsage(); done(r); } else { st.error = `${what} — ${r.reason || "이유를 알 수 없어요"}. 지어내지 않고 비워 둘게요.`; pendingNotice = ""; }
    render();
  }
  // 연습용 예시는 정해진 글만 안다 — 선택지 대신 직접 쓴 답이면 첫 선택지를 고른 장면으로 보여 준다(연습용이라 내용은 반영되지 않는다)
  function fixtureFor(text) {
    const u = st.undo[st.undo.length - 1], n = u && u.j.next;
    if (S.judgeFixture(text, atStage()) || !n || n.options.includes(u.picked)) return text;
    return `${u.text.trim()}\n${N.decisionLine(n.question, n.options[0])}`;
  }
  function judge(skipCheck) {
    Object.assign(st, { error: "", warn: null });
    const text = st.text;
    if (!text.trim()) return stop("지금 만드는 걸 적어 주세요.");
    if (st.mode === "fixture") {
      const j = fixtureJudge(fixtureFor(text), atStage());
      return j ? landed(j, 0, text) : stop("연습용 예시는 정해진 장면만 알아요. 위의 연습 버튼으로 이 단계 장면을 보거나, 직접 쓴 글은 보기 방식을 '진짜 AI'로 바꿔 주세요.");
    }
    return askAI("/api/judge", { text, stage: atStage(), tier: st.tier }, "살펴보지 못했어요", (r) => landed(r.judgement, r.tokens, text), !skipCheck && [text, "judge"]);
  }
  // 연습 장면 살펴보기 — 장면은 Full 순서라 지금 등급의 할 일 자리만 남긴 뒤(tiers.js) 진짜 AI 결과와 같은 검사를 거친다
  function fixtureJudge(text, n) {
    const raw = S.judgeFixture(text, n);
    return raw && N.parseJudgement(T.fitJudgement(raw, n, st.tier), text, n, st.tier);
  }
  function answer() {
    const s = stage();
    st.error = "";
    if (st.mode === "fixture") {
      const a = (T.fit(S.answers[s.n] || [], s.n, st.tier) || [])[st.hard[0]];
      st.answer = a ? `${a} (연습용으로 미리 써 둔 답이라, 질문 내용은 반영되지 않아요)` : "연습용 답이 없어요. 보기 방식을 '진짜 AI'로 바꿔 물어보세요.";
      return render();
    }
    if (!st.question.trim()) return stop("궁금한 걸 적어 주세요.");
    // F-11: 작업 글이 비면 서버가 400으로 거절한다 — 글 칸이 비었으면 마지막으로 살펴본 글을 보내고, 그것도 없으면 보내지 않고 이유만 보인다
    const text = U.askText(st.text, st.judged);
    if (!text) return stop(U.NEED_TEXT);
    return askAI("/api/answer", { stage: s.n, hard: hardTexts(), question: st.question, text, tier: st.tier },
      "답을 받지 못했어요", (r) => { st.answer = r.answer; });
  }
  // 고른 것을 작업 글에 한 줄로 적고 다시 살펴본다 — 정하는 건 사용자, 받아 적는 건 플로로
  // own: 선택지 대신 직접 쓴 답. 고르기 전 상태를 undo에 남겨 '이전 선택 바꾸기'로 되돌릴 수 있다
  // (2026-10-18 임유정 요청: "골랐어요: … 다시 살펴봤어요" 알림은 뺐다)
  function decide(own) {
    const n = st.j.next, o = own || n.options[st.choice];
    hold();
    st.undo.push({ text: st.text, j: st.j, question: n.question, picked: o });
    st.text = `${st.text.trim()}\n${N.decisionLine(n.question, o)}`;
    Object.assign(st, { notice: "", choice: null, picking: false, own: false, ownText: "" });
    judge(false);
  }
  // 설계도 — 초안 받기 / 다시 봐 주세요. 연습용은 미리 써 둔 초안과 빈칸 확인만, 진짜 AI는 server.js를 거친다
  const newDoc = (n, text, say) => ({ stage: n, text, say, review: null, rounds: 0 });
  function draft(skipCheck) {
    const s = docStage(), made = (text, say) => { st.doc = newDoc(s.n, text, say); };   // 책 안에서 고른 단계(C-16), 아니면 지금 단계
    Object.assign(st, { error: "", warn: null, askConfirm: 0 });
    if (st.mode === "fixture") {
      const d = S.drafts[s.n];
      if (!d) return stop("이 단계는 연습용 초안이 없어요. 직접 쓴 작업은 보기 방식을 '진짜 AI'로 바꿔 주세요.");
      made(d.draft, d.say); return render();
    }
    if (!st.text.trim()) return stop("'이번 단계' 탭에서 만들고 있는 걸 먼저 보여 주세요.");
    return askAI("/api/draft", { stage: s.n, text: st.text, tier: st.tier }, "초안을 받지 못했어요", (r) => made(r.draft, r.say), !skipCheck && [st.text, "draft"]);
  }
  function review(skipCheck) {
    const d = st.doc, reviewed = (v) => { Object.assign(d, { review: v, say: "" }); d.rounds++; };
    Object.assign(st, { error: "", warn: null, askConfirm: 0 });
    if (!d.text.trim()) return stop("문서가 비어 있어요.");
    if (st.mode === "fixture") { reviewed(S.reviewFixture(d.text, d.stage)); return render(); }
    return askAI("/api/review", { stage: d.stage, text: st.text, doc: d.text, tier: st.tier }, "다시 봐 드리지 못했어요", (r) => reviewed(r.review),
      !skipCheck && [`${st.text}\n${d.text}`, "review"]);
  }
  // 확정은 사람만 한다(FR-3). 빈칸이 남았으면 한 번 더 묻는다(force: 그래도 확정). 같은 단계의 예전 확정본은 새것으로 바꾼다
  function confirmDoc(force) {
    const d = st.doc, s = N.STAGES[d.stage], left = N.blanks(d.text).length;
    if (left && !force) return set({ askConfirm: left });
    st.docs = st.docs.filter((x) => x.stage !== d.stage).concat({ stage: d.stage, name: s.doc, text: d.text, at: ymd() });
    Object.assign(st, { doc: null, warn: null, error: "", askConfirm: 0, notice: `${LB(s.n)} ${s.doc}${eul(s.doc)} 확정했어요 — 퀘스트 창의 서고 탭에서 다시 볼 수 있어요.` });
    render();
    celebrate("doc");
  }

  function advance() {
    if (st.finished || !N.canAdvance(met(), "yes")) return;   // 다 마친 뒤 두 번 들어와도 레벨 · 조개가 두 번 오르지 않게
    const s = stage(), nx = nextStage(), last = [...st.checks].reverse().find((c) => c.stage === s.n);
    st.history.push({ short: `${s.n}단계 ${s.title} 마침`, at: ymd(),   // at — 세션별 보기(C-3, my-books.js dated)가 읽는다(2026-10-20). 옛 기록은 글 끝의 날짜로
      text: `${s.n}단계 "${s.title}" → ${nx ? `${nx.n}단계로 넘어갔어요` : "마무리했어요"} · '잘 모르겠어요' ${st.noCount}번${
        last ? ` · 확인 질문 ${last.ok ? "맞힘" : "정답 보고 넘어감"}` : ""} · ${ymd()}` });
    Object.assign(st, { screen: "main", notice: "", tab: "today", showCrit: false, mapSel: null, hold: null, check: null, undo: [], own: false, libDoc: null });
    if (nx) st.j = { stage: nx.n, reason: `${LB(s.n)}를 마쳤어요! 이제 ${LB(nx.n)} "${nx.title}"예요. 정한 순서대로 하나씩 해 봐요.`,
      criteria: crits(nx.n).map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    else st.finished = true;
    // 퀘스트(C-22): 장을 지나면 무지개 조개 하나, 다음 장 퀘스트(받기 화면)를 만들고 퀘스트 창이 바로 뜬다(설정 '바로 뜨기'). 마지막이면 퀘스트 없이 마무리
    questStarted();   // C-61 — 새 단계: 섬은 가운데부터
    if (QU) { st.shells += 1; level = QU.levelUp(level); if (st.mode !== "fixture") writeLS(LEVEL_KEY, level); st.quest = nx ? QU.retitle(QU.makeQuest(nx, crits(nx.n)), st.topic) : null; if (nx && qauto) openQwin("quest"); }   // 다음 장도 주제를 제목으로(C-36)
    // 관문을 지난 날(C-39 — 문서의 증빙 · 결정 기록) + C-47 배운 것(비우면 '' — '비어 있음') · 처음 뜻(고르지 않았으면 남기지 않는다, 바뀌었어요인데 비우면 고르지 않은 것)
    const learned = String(st.learnDraft || "").trim().slice(0, 400), gd = st.goalDraft, goal = gd && gd.same ? { same: true } : gd && gd.changed && gd.changed.trim() ? { changed: gd.changed.trim().slice(0, 200) } : null;
    if (st.results[s.n]) st.results = { ...st.results, [s.n]: { ...st.results[s.n], passed: ymd(), learned, ...(goal && s.n >= 1 ? { goal } : {}) } };
    st.learnDraft = ""; st.goalDraft = null;
    if (st.qwin) loadFiles();   // 작업실 파일 칸 — 장이 바뀌면 '● 지금' · 펼친 폴더도 바뀐다(R-8, 새 맥락 리뷰)
    if (QU && FDOCS && s.n >= 1 && st.results[0] && st.results[1]) { st.ship = { phase: "offer" }; st.qfocus = "stage"; }   // 마지막(8단계) 관문도(2026-10-25 리뷰)   // 2단계부터 관문마다 — 단계 문서 · 기획서 · 결정 기록을 다시 묶어 올릴지 묻는다(C-37 → C-39 버튼 "2단계부터 관문마다")
    carryMaybe();   // C-48 8단계(돌아보기)에 오면 가져갈 것을 정리할지
    render();
    if (nx) carryLoad(nx.n);   // C-48 지난 프로젝트에서 그 단계에 가져온 것(있으면 카드)
    if (QU && nx && N.DRAFT_STAGES.includes(nx.n) && st.results[nx.n - 1]) stageDraft(nx.n);   // 지난 장 결과로 이 장의 초안 — 먼저 생각하고 동의를 구한다(C-37)
    else if (nx) questText();   // 다음 장의 퀘스트 글(진짜 AI)
    celebrate(nx ? "stage" : "finish");
  }
  // 글 칸으로 커서를 옮긴다 (다시 그린 뒤)
  const focusText = () => requestAnimationFrame(() => { const t = document.querySelector("[data-act=text]"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } });

