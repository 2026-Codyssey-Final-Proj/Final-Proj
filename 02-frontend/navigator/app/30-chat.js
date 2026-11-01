  // ── 채팅 중심 섬(C-22 1차 뼈대, claude-drafted: 2026-10-21 — 이재엽 "메인은 버튼이 아니라 플로로와 소통", 설계는 quest-storyboard.md 10절) ──
  //    레벨 오버레이(2026-10-19 LV · EXP · 명령 네 칸)는 뺐다 — 왼쪽 큰 플로로(칭호 · 기분 글은 2026-10-25에 뺌), 가운데 채팅(플로로 말 왼쪽 · 내 말 오른쪽 · 고르는 칩 · 입력 칸, 채팅 안에 플로로 그림 없음).
  //    규칙은 안 바뀐다: 지금 결정할 것 하나(momentToday · momentGate)가 플로로의 마지막 말이 되고, 그 단추들이 칩이 된다. 지나간 말은 위로 쌓인다(이 켜짐 동안만 — 기록에는 안 남긴다).
  keep(["chatMark", "chatOpen"]);   // C-63 — 대화 표시 자리 · 펼친 단계 바로가기는 다시 켜도
  const ROMAN = (i) => (QU ? QU.roman(i) : String(i + 1));
  let lastLive = null;   // 마지막으로 보인 플로로의 말 — 바뀌면 지난 말로 쌓는다
  let saidSince = 0;     // 그 말이 보이는 동안 say()가 기록에 남긴 말 수 — 지난 말은 그 앞에 끼운다(먼저 보인 말이 위에, 2026-10-25)
  // chatSeq — 지금까지 남긴 말 수(60개로 자른 뒤에도 늘어난다: 칸 수로는 새 말을 못 알아봤다). shownSeq — 마지막으로 그린 때의 수
  // logPin — 채팅이 맨 아래를 따라가는 중인가. 사람이 위로 올리면 false, 다시 맨 아래로 내리면 true(아래 scroll · wheel 듣기).
  //   전에는 다시 그릴 때마다 '지금 맨 아래에서 24px 안인가'로만 봤다 — 섬이 펼쳐지거나 지금 말풍선이 그린 뒤에 커지면 그 틈이 생겨,
  //   새 말 없이 바뀌는 선택지(맞아요 등)를 눌러도 아래로 안 내려갔다(임유정 2026-10-25, F-58-3) — claude-drafted: 2026-10-25
  let chatSeq = 0, shownSeq = 0, logPin = true;
  const logTop = new WeakMap();   // 채팅 칸마다 지난 스크롤 자리 — 위로 갔는지 보려고(아래 scroll 듣기). render가 새 칸을 그리면 그 자리부터 적는다
  // 따라가는 중이면 그린 뒤에 커져도(섬 펼침 · 말풍선이 자람) 맨 아래에 붙여 둔다 — render가 지금 칸과 마지막 말풍선을 다시 지켜본다
  //   처음 지켜볼 때의 알림은 건너뛴다(그때는 render의 부드러운 내려가기가 하고 있다) — 높이가 바뀐 때만
  const logH = new WeakMap();
  const logRO = typeof ResizeObserver === "function" ? new ResizeObserver((es) => {
    for (const e of es) {
      const h = e.contentRect.height, was = logH.get(e.target); logH.set(e.target, h);
      const l = e.target.closest("[data-log]");
      if (was !== undefined && was !== h && logPin && l) l.scrollTop = l.scrollHeight;
    }
  }) : null;
  // C-63(2026-10-29): 대화는 저장된다 — 400줄까지, 넘치면 오래된 것부터(단계 표시 자리 chatMark도 같이 당긴다). 내 말은 비밀값을 가려서 저장(보안 기준 3절). kind — stage(구분선) · carry(가져온 것)
  const CHAT_CAP = 400;
  // ── C-63 대화 저장(API.md 3-32 — 서버는 이재엽 쪽 #247, 결정 모음 A-20 '이 컴퓨터의 앱 저장 곳'): 진짜 AI 모드면 켤 때 GET /api/chatlog로 이어서 보이고 logMsg가 add로 쌓는다(20개씩).
  //   연습 · 서버 없이는 이 브라우저(localStorage KEEP)에만. 말 → { stage, who, text }, 구분선 → { stage, mark, title }, 가져온 것 → { stage, carry }. 서버가 가리고(sensitive.js) at을 붙인다 ──
  const chatLive = () => canLive && st.mode === "live";
  const turnOf = (m) => (m.kind === "stage" ? { stage: m.n, mark: true, title: String(m.title || "").slice(0, 60) } : m.kind === "carry" ? { stage: m.n, carry: textOf(m.html).slice(0, 2000) }
    : m.who === "me" || m.who === "floro" || m.who === "sys" ? { stage: Number.isInteger(m.n) ? m.n : atStage(), who: m.who, text: textOf(m.html).slice(0, 2000) } : null);
  const fromTurn = (t) => (t.mark ? { who: "sys", kind: "stage", n: t.stage, title: t.title, at: t.at, html: `<b>${LB(t.stage)} · ${esc(t.title)}</b><span>${new Date(t.at).toLocaleDateString("sv")}</span>` }
    : typeof t.carry === "string" ? { who: "floro", kind: "carry", n: t.stage, at: t.at, html: esc(t.carry).replace(/\n/g, "<br>") } : { who: t.who, n: t.stage, at: t.at, html: esc(t.text).replace(/\n/g, "<br>") });   // 줄바꿈은 줄바꿈으로(textOf가 br을 \n으로 남긴다)
  //   chatFolder — 서버가 대화를 둘 폴더(앱이 고른 폴더)를 아나(GET의 why). null이면 묻는 중(모아 둔다), false면 보내지 않는다 — 서버는 폴더 없이 POST를 400으로 거절한다(3-32).
  //   폴더를 고르면(connected · projectPicked) 다시 묻는다. 병합 뒤 고침(2026-10-29 — #247 서버 · #250 화면이 같이 들어간 main에서 브라우저로 연 화면이 말마다 400을 쌓았다)
  let chatQueue = [], chatFlushing = false, chatFolder = null, chatAsk = 0;
  function chatlogAdd(m) { if (!chatLive() || !Number.isInteger(m.n) || chatFolder === false) return; const t = turnOf(m); if (!t || !(t.text || t.title || t.carry)) return; chatQueue.push(t); if (!chatFlushing && chatFolder) setTimeout(chatlogFlush, 0); }
  async function chatlogFlush() {
    if (chatFlushing || !chatQueue.length || chatFolder !== true) return; chatFlushing = true; const add = chatQueue.splice(0, 20);
    try { await fetch("/api/chatlog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ add }), credentials: "same-origin" }); } catch { /* 못 쌓아도 화면은 계속 — 이 브라우저에는 남아 있다 */ }
    chatFlushing = false; if (chatQueue.length) chatlogFlush();
  }
  async function chatlogLoad() {
    if (!chatLive()) { ++chatAsk; chatFolder = false; chatQueue = []; return false; }   // 연습 · 서버 없이는 이 브라우저에만 — 진짜 AI 모드로 바꾸면 chatRecheck가 다시 묻는다. ++chatAsk: 묻던 진짜 쪽 답이 늦게 와도 덮지 않게(F-103-10)
    chatFolder = null; const ask = ++chatAsk, seq0 = chatSeq;   // seq0 — 묻는 동안 남긴 말을 세려고(logMsg가 하나마다 올린다)
    let r = null; try { r = await (await fetch("/api/chatlog", { credentials: "same-origin" })).json(); } catch { r = null; }
    if (ask !== chatAsk) return false;   // 그사이 다시 물었다 — 늦게 온 옛 답이 덮지 않게
    chatFolder = !!(r && r.ok && r.why !== "folder");
    if (!chatFolder) { chatQueue = []; return false; }   // 폴더를 모르면 모아 둔 말은 버린다(이 브라우저에는 남는다) — 나중에 고른 폴더의 대화에 섞지 않게
    setTimeout(chatlogFlush, 0);   // 묻는 동안 한 말
    if (!Array.isArray(r.turns)) return false;
    const fresh = st.chat.slice(Math.max(0, st.chat.length - (chatSeq - seq0)));   // 묻는 동안 남긴 말(인사 등) — 아직 서버에 없다(위 flush가 보낸다). 서버 대화 뒤에 그대로 둔다(F-103-10)
    st.chat = [...r.turns.filter((x) => x && (x.mark ? Number.isInteger(x.stage) && Number.isFinite(x.at) : typeof x.carry === "string" || (typeof x.text === "string" && ["me", "floro", "sys"].includes(x.who)))).map((x) => fromTurn({ at: Number.isFinite(x.at) ? x.at : 0, ...x })), ...fresh].slice(-CHAT_CAP);   // 덜어낸 수를 알리는 sys 줄(3-32)은 at이 없어도 보인다. 합친 뒤에도 상한(logMsg와 같이)
    st.chatChanges = Array.isArray(r.changes) ? r.changes.filter((c) => c && Number.isFinite(c.at) && typeof c.path === "string") : [];
    st.chatMark = st.chat.map((m) => !!m.kind).lastIndexOf(true) + 1;   // 대화 표시 자리는 마지막 구분선 · 가져온 것 뒤
    return true;
  }
  // 폴더 · 보기 방식이 바뀔 수 있는 곳(처음 설정을 마침 · 보기 방식 · 폴더 연결 · 연결 빼기)에서 서버에 다시 묻는다 — 저장할 곳을 서버의 답으로만 정한다
  const chatRecheck = () => chatlogLoad().then((ok) => { if (ok) render(); });
  // C-63 — 대화 목록의 바로가기: 같은 대화의 그 단계 구분선으로 옮기고 잠깐 강조. 값은 "단계:번호"라 같은 단계를 다시 눌러도 옮긴다. 앱 창은 win.js가 같은 값(data-go-stage)으로
  let goSeq = 0, goStageShown = "";
  const goStage = (root) => { const lg = root.querySelector("[data-log]"), v = lg ? lg.dataset.goStage || "" : ""; if (!v || v === goStageShown) return; goStageShown = v;
    const el = lg.querySelector(`[data-stage="${CSS.escape(v.split(":")[0])}"]`); if (!el) return; logPin = false; el.scrollIntoView({ block: "start" }); el.classList.add("hl"); setTimeout(() => el.classList.remove("hl"), 1200); };
  const logMsg = (who, html, extra = {}) => { const m = { who, html, at: Date.now(), n: st.quest ? st.quest.chap : atStage(), ...extra }; st.chat = [...st.chat, m]; const over = st.chat.length - CHAT_CAP; if (over > 0) { st.chat = st.chat.slice(over); st.chatMark = Math.max(0, (st.chatMark || 0) - over); } chatSeq += 1; chatlogAdd(m); };
  const logMe = (text) => { settleLive(); logMsg("me", esc(window.NavSensitive ? window.NavSensitive.redact(text) : text)); };
  // 지금 보이는 플로로의 말을 기록에(한 번만) — 내 말을 남기기 전에도 불러 질문 → 답 순서로 쌓인다(C-37, 2026-10-25 — 전에는 '맞아요'가 그 질문 위에 쌓였다).
  //   기다리는 동안만 보이는 말 · 초안 확인 카드(passing)는 남기지 않는다. 그 말이 보이는 동안 say()로 남긴 말(saidSince)보다는 앞에
  function settleLive() {
    if (!lastLive || lastLive.passing || lastLive.logged) return;
    const at = st.chat.length - saidSince, m = { who: "floro", html: lastLive.html, at: Date.now(), n: st.quest ? st.quest.chap : atStage() }; st.chat = [...st.chat.slice(0, at), m, ...st.chat.slice(at)].slice(-CHAT_CAP); lastLive.logged = true; chatlogAdd(m);   // 플로로의 지금 말도 서버에(C-63 — 새 맥락 리뷰)
  }
  // 퀘스트의 결정할 것 하나 — 받기 전(draft) · 한 줄씩 묻기 · 다 적음(완료 보고). momentToday가 알림 · 경고 · 오류 · 먹이 다음에 부른다
  const stageMetaQ = () => { const q = st.quest, p = QU.progress(q); return `<span class="mm-stage">${LB(q.chap)} · ${esc(q.title)}</span><span>${p.n}개 중 ${p.k}번째 할 일</span><span class="mini" aria-hidden="true">${q.objs.map((_, i) => `<i class="${i < p.k ? "on" : ""}"></i>`).join("")}</span>`; };
