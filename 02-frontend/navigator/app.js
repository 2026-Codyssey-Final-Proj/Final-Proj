// claude-drafted: 2026-10-14, 2026-10-15, 2026-10-18(임유정 요청 14가지 정리), 2026-10-16(0~7단계 연습·마무리·빈칸 확인·지금 단계 계산·리퀴드 글래스 굴절) — Navigator 프로토타입 화면 동작.
// 규칙·문구 판단은 navigator.js, 연습 예시는 scenario.js, 플로로 그림·교감 도구는 seal.js, 실제 Claude 호출은 server.js.
// 넓은 화면(PC) = 코딩 도구 창 위에 떠 있는 옆자리 동료. 2026-10-15 "가로 카드 시안대로" 다시 짬:
//   띠 → 한 줄 → 펼침(위: 아이콘 줄, 아래: 지금 결정할 것 하나를 담은 가로 카드). 카드는 상황마다 색·플로로 표정·뱃지가 다르다
//   (골라 주세요=파랑, 다 했어요=초록, 넘어가기 전 확인=주황, 작업 알림·살펴보는 중=회색, 오류=빨강). 버튼마다 단축키(1·2·3, Enter, Esc, Y·N).
//   교감: 플로로를 누르면(또는 좌우로 문지르면) 하트와 한마디, 친해진 정도가 쌓인다. 가만히 두면 졸다가 잠들고, 움직이면 깬다.
//   할 일을 다 하거나 단계를 넘어가면 별이 튀며 축하한다. 작은 소리는 설정에서 켠 사람에게만.
// 600px 이하 = iPhone: 오늘 / 설계도 / 단계 지도 탭과 넘어가기 전 확인 화면 — 이번에 바꾸지 않았다(PC 먼저). 두 화면은 같은 상태(st)를 쓴다.
// 기록(작업 글·진행·배운 말·설계도·플로로와 친해진 정도)은 이 브라우저(localStorage)에만 남는다.
// claude-drafted: 2026-10-18 — F-05(PRD 2-7, 이재엽 결정 "내배움 지우기 / 플로로와 처음 만난거 보여주는건 설정 처음에 / 내용들은 서재에서 /
//   오버레이에서는 간단하고 필요한 내용만, 자세한건 서재로"): '내 배움' 탭을 없앴다. 플로로와 나는 설정 맨 위(bondCard).
// 2026-10-19(이재엽): 서재의 '내 배움'(learn.js)도 지웠다 — "서재에서 자세히 보기"는 서고로 가고, 옛 주소 #tab=learn도 서고로 보낸다(fromHash).
// claude-drafted: 2026-10-18 — 화면 빈칸(이재엽 요청): 용어 풀이(FR-13, glossary.js) · '예' 뒤 확인 질문 1개와 '아니요' 3번 뒤 잠시 멈추기(FR-5, understand.js)
//   · 다음 할 일 꼭/나중에(FR-12, priority.js) · 작업 알림 기록과 연습 알림으로 할 일 끝 표시(FR-7, alerts.js) · 만드는 크기(tier)를 서버에 보내기.
// claude-drafted: 2026-10-19 — 실사용(이재엽 2026-10-18 "화면에서만 … 아니라 실질적으로 테스트 … 우리가 사용하면서 느끼고 싶어"):
//   도서관 탭의 첫 책이 예시(s1)를 빌려 쓰던 것을 **내 책**(이 화면의 단계 · 할 일 · 설계도 · 배운 말, ../library/my-books.js)으로 바꿨다 — 진짜 AI 모드이거나 예시 책을 지웠을 때.
//   연습 모드에서 예시가 보일 때는 전처럼 첫 책이 이 화면을 따른다(시연 장면 · GIF 그대로). 예시 책에는 '예시' 꼬리표, 도서관 탭 아래 '예시 책 지우기 / 다시 보기'.
//   설정에 '느낀 점'(notes.js) — 쓰다가 느낀 것을 한 줄 남기면 화면 · 단계 · 때가 저절로 붙고, 'Jira용 복사'로 모아 붙인다(이 컴퓨터에만 남는다).
// claude-drafted: 2026-10-20 — C-13 모드 둘 · C-14 섬의 움직임(이재엽, 넘김 문서 fable-handoff-2026-10-20-modes.md 3 · 4절):
//   켜면 늘 **기본 화면**(st.place "base" — 플로로와 지금 한 줄, 단추 넷: 바이브 코딩 · 서재 · 알림 · AI 진행. 알림 · AI 진행은 섬 안에서 바로 — 모아 보기 창(hub.js)의 순수 함수를 그대로 쓴다).
//   바이브 코딩 단추를 누르면 "vibe"(이번 단계 · 설계도 · 단계 지도 · 도서관)로, 접혔다 펼쳐지거나 서고에 다녀와도 그대로(sessionStorage — 켤 때마다 새 창이라 늘 기본), 위쪽 줄의 집 단추로 돌아온다.
//   규칙은 navigator.js nextPlace. 주소로 연 장면(#ex= …)은 바이브 코딩, #base(&pane=alerts|ai)는 기본 화면. 켤 때 인사가 끝나면 인사 카드 대신 기본 화면이 된다.
//   섬이 접히고 펼쳐질 때 모양을 갈아 끼우는 대신 바탕 껍데기(.shell)가 늘어나고 줄어든다(morph.js — FLIP · transform만, 창은 커질 때 먼저 · 작아질 때 나중에),
//   접힌 한 줄에 마우스를 올리면 살짝 커진다(창은 안 바꾼다 — 접힌 창에 여유). 움직임 줄이기면 전처럼 바로 바뀐다.
// claude-drafted: 2026-10-20 — C-15 플로로에게 먹이 주기 · C-16 도서관의 책(이재엽 "설계도는 너무 어려운 말 … 파일을 오버레이에 주면 … 분석을 시작하는거야 … 기능을 한곳에 통합시켜줘",
//   넘김 문서 fable-handoff-2026-10-20-feed.md): ① 처음 카드가 **먹이 주기** 화면 — 파일을 끌어다 놓거나 글을 붙여 넣으면 feed.js가 구간으로 나눠 주제 · 비밀값 · 개인적인 일을 표시하고,
//   사람이 구간마다 고친 뒤 확인하면 빠진 구간 없이 어디쯤인지 본다(정리는 책의 '받은 먹이'로 — 빠진 구간의 글은 어디에도 남기지 않는다) ② 단계 문서 탭을 없애고 도서관의 책 안에서
//   초안 · 고치기 · 다시 봐 줌 · 확정(FR-3 그대로, draft · review · confirmDoc) ③ 화면 글에서 '설계도'를 뺐다 — 단계 문서(아이디어 정리표 …)로. 코드 이름(doc · /api/draft)은 그대로.
(function () {
  const N = window.NavRules, S = window.NavScenario, C = window.NavSeal;
  // 새 규칙 파일 다섯(03-backend/navigator/glossary·understand·priority·alerts·tiers.js) — server.js가 내주는 목록에 있는지는 static-files.test.js가 확인한다
  const G = window.NavGlossary, U = window.NavUnderstand, P = window.NavPriority, A = window.NavAlerts, T = window.NavTiers;
  // 실사용(2026-10-19): 내 책 · 예시 책 지우기(../library/my-books.js), 느낀 점(notes.js). 둘 다 없어도 화면은 돈다(옛 동작)
  const M = window.FloeMine, NT = window.FloeNotes;
  // 기본 화면 · 섬의 움직임(2026-10-20): 모아 보기 창의 순수 함수(hub.js) · AI 진행의 한 줄 글(steps.js) · 움직임 규칙(morph.js). 없어도 화면은 돈다
  const HUB = window.FloeHub, STEPS = window.NavSteps, MO = window.FloeMorph;
  const FD = window.NavFeed;   // 먹이 주기(C-15, feed.js) — 없으면 글을 바로 본다
  const SESS = (() => { try { return window.sessionStorage; } catch { return null; } })();
  const PLACE_KEY = "floe:place", SEEN_KEY = "floe:alerts-seen";   // 이 창(섬)에만 — 기록(KEY)에는 넣지 않는다(다음에 켤 때는 늘 기본 화면)
  const STORE = (() => { try { return window.localStorage; } catch { return null; } })();
  const canLive = location.protocol.startsWith("http");
  // Electron 껍데기 안(2026-10-19, 02-frontend/electron — preload.js가 window.floeApp을 둔다): 뒤의 예시 코딩 도구 창을 숨기고 바탕을 투명하게(app.css .in-app)
  if (window.floeApp) document.documentElement.classList.add("in-app");
  // Mac 노치(다이내믹 아일랜드, 2026-10-19 이재엽 결정): 앱이 노치 크기를 보내면 섬을 노치에 맞춘다(app.css html.notch). 브라우저 · 노치 없는 컴퓨터에는 오지 않는다
  if (window.floeApp && window.floeApp.onNotch) window.floeApp.onNotch((n) => {
    const h = document.documentElement;
    h.classList.add("notch"); h.style.setProperty("--notch-w", `${n.width}px`); h.style.setProperty("--notch-h", `${n.height}px`);
  });
  const DELAY = { greet: 6000, home: 15000, petit: 30000 };   // 저절로 접히기까지(밀리초)
  const GR = window.FloeGreet;   // 켤 때 인사의 시간표 · 규칙(greet.js, C-10 2026-10-20). 없으면 인사 움직임 없이 카드만
  let greetSkip = null;         // 인사 움직임이 도는 동안만 — 누름 · Esc로 바로 끝낸다
  const PHONE = matchMedia("(max-width: 600px)");
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const st = {
    ui: "greet", screen: "main", tab: "today", mode: canLive ? "live" : "fixture", text: canLive ? "" : S.first.text,
    j: null, tokens: 0, busy: false, error: "", notice: "", todos: null, userPin: false, ping: "", openInput: false,
    warn: null,                                    // 보내기 전 경고 {w: 보인 것들, then: 괜찮다고 하면 다시 할 일 judge·draft·review}
    choice: null, later: false, picking: false, own: false, ownText: "",   // own: 선택지 대신 직접 쓰는 중
    undo: [],                                      // 고른 선택지 {text, j, question, picked} — 연습용에서 직접 쓴 답을 첫 선택지 장면으로 보여 줄 때 쓴다
    step: "ask", hard: [], question: "", answer: "", noCount: 0, history: [], learned: [],
    auto: false, feed: { at: 0, project: "", tool: "" },   // Claude Code·Codex 연결: 자동으로 살펴보기(기본 꺼짐), 마지막 알림
    settings: false,                               // 설정(보기 방식·연결·자동 살펴보기·소리·기록)은 톱니를 눌러야 보인다
    doc: null, docs: [],                           // 단계 문서: 고치는 중인 것 {stage, text, say, review, rounds}, 확정한 것들
    meal: null, fed: [],                           // 먹이 주기(C-15): 정리 중인 것(st.feed는 연결 — 이름이 겹쳐 meal) {sections, checks, marks, example}, 책에 꽂은 정리(주제 · 빠진 수 · 까닭 — 글은 없다)
    libDoc: null,                                  // 도서관의 책 안에서 여는 단계 문서(C-16) — 단계 번호
    project: "", back: "",                         // 알림에서 받은 프로젝트 폴더 이름, 다시 왔을 때 인사
    finished: false,                               // 7단계까지 모두 마쳤는가
    askConfirm: 0,                                 // 빈칸이 남은 단계 문서를 확정하려 할 때 — 남은 빈칸 수(한 번 더 묻는 중)
    textSize: 1,                                   // 글자 크기 배율(설정) — 브라우저 기본 글자 크기에 곱한다
    pets: 0, since: "", sound: false,              // 플로로와 교감: 쓰다듬은 횟수, 처음 만난 날, 작은 소리(기본 꺼짐)
    mapSel: null, showCrit: false,                 // 단계 지도에서 고른 단계, 펼침 카드 아래 '이 단계 할 일' 펼침
    libSel: null, libConfirm: false, libGone: [],  // 도서관 탭: 펼친 책, 세션 덮기 확인 중, 서고로 보낸 책 (2026-10-17 서고 시안의 위젯을 옮김)
    termOpen: "",                                  // 풀이를 펼친 용어(한 번에 하나)
    check: null, checks: [],                       // '예' 뒤 확인 질문 {q, pick, ok}, 지난 결과 {stage, ok, at}
    hold: null, holdWho: "나", holdWhen: "",        // 보류 {stage, who, when, at} — 있으면 그 단계는 멈춰 둔 것. 적는 중인 두 칸
    todoLater: [],                                 // 다음 할 일 중 '나중에'로 미룬 것(글자로 — 순서를 바꿔도 따라간다)
    alerts: [], alogOpen: false,                   // 작업 알림 기록(새것이 위), 설정에서 펼쳤나
    tier: "Full",                                  // 만드는 크기 — 할 일 목록이 이 등급을 따르고(criteriaFor), 서버 요청에 tier로 같이 보낸다(기본: 크게)
    unplug: false, alogNote: "",                   // 연결 끊기(끊은 동안 들어온 알림은 받지 않는다), 알림 기록 비우기 결과 한 줄
    judged: "",                                    // 마지막으로 살펴본 작업 글 — 글 칸을 비운 뒤 '물어보기'를 눌러도 이 글을 보낸다(F-11, understand.js askText)
    noteText: "", notesOpen: false, noteCopy: "",  // 느낀 점(2026-10-19): 적는 중인 글, 설정에서 펼쳤나, 'Jira용 복사'가 실패했을 때 손으로 복사할 글
    cmd: null, words: "work",                      // 레벨 오버레이(2026-10-19): 고른 명령 칸(0~3 · null이면 지금 하는 일), 버튼 말(work 일 말 · game 게임 말)
    place: "base", pane: "",                       // 기본 화면(base) · 바이브 코딩(vibe) — 펼친 섬에 어떤 판을 보이나(C-13, 2026-10-20). pane: 기본 화면 안의 알림 · AI 진행 판
  };
  // 예시 책을 지웠나(my-books.js HIDE_KEY) — 기록(save)에 넣지 않고 따로 둔다: 서고 화면과 같은 열쇠를 읽는다. 주소 끝 &noex는 이 화면만 숨긴다(저장하지 않음)
  let exHidden = M ? M.readHidden(STORE) : false;
  // 느낀 점 목록 — 따로 둔다(기록 지우기와 별개). 새것이 위
  let noteList = NT ? NT.read(STORE) : [];
  // 만드는 크기 [보내는 값, 화면 이름] — tiers.js
  const TIERS = T.LABELS;
  // 지금 등급의 할 일 목록 — 단계 n
  const crits = (n) => N.criteriaFor(n, st.tier);
  const $nav = document.getElementById("nav"), $phone = document.getElementById("phone"), $chat = document.getElementById("chat");
  const $fx = document.getElementById("fx");

  // ── 상태에서 바로 계산하는 것 ──
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const met = () => (st.j ? st.j.criteria.map((c) => c.met) : []);
  const metCount = () => met().filter(Boolean).length;
  const left = () => met().length - metCount();
  const allDone = () => !!st.j && left() === 0;
  const stage = () => st.j && N.STAGES[st.j.stage];
  const nextStage = () => st.j && N.STAGES[st.j.stage + 1];
  // 휴대폰 화면(600px 이하)은 브라우저에서만 — Electron 앱은 창이 섬 크기를 따라 좁아져도 PC 화면 그대로(2026-10-19 이재엽: 앱이 휴대폰 화면으로 넘어가 버림, 휴대폰 화면은 아직 만들지 않는다)
  const isPhone = () => PHONE.matches && !window.floeApp;
  const isField = (el) => !!el && /^(TEXTAREA|INPUT|SELECT)$/.test(el.tagName);
  // 지금 글을 쓰는 중인가 — 쓰는 중에는 저절로 접히지 않는다
  const typing = () => { const a = document.activeElement; return isField(a) && $nav.contains(a); };
  // 답을 기다리는 중이면 저절로 접히지 않는다 (CouCou의 pinned). 할 일을 다 했으면 확인하러 가자고 펼쳐 둔다
  // 멈춰 둔 단계인가(FR-5 보류) — 멈춰 두면 다 했어도 펼쳐 두지 않는다
  const holding = () => !!(st.hold && st.j && st.hold.stage === st.j.stage && !st.finished);
  const pinned = () => st.userPin || st.screen === "gate" || !!st.warn || st.busy || (allDone() && !holding()) || st.settings || st.openInput || typing();
  // 플로로의 [표정, 말] — 기다림·경고·오류가 먼저, 그다음 확인 질문·잠시 멈추기(understand.js), 나머지는 navigator.js
  function face() {
    const base = N.face({ busy: st.busy, warn: st.warn, error: st.error, gate: st.screen === "gate", step: st.step,
      back: st.finished ? CHEER.finish : st.back, reason: st.j && st.j.reason, allDone: allDone() });
    if (st.busy || st.warn || st.error) return base;
    if (st.screen === "gate") return st.step === "check" ? U.face(st.check) : st.step === "hold" ? U.FACE.hold : base;
    return holding() ? U.FACE.hold : base;
  }
  // 지금 할 일 순서 — 꼭 할 일이 먼저, '나중에'로 미룬 일은 뒤(나중에만 남으면 그 순서대로)
  const todosNow = () => P.order(st.todos, st.todoLater);
  const tick = () => N.ticker(st.j, todosNow(), st.history.length ? st.history[st.history.length - 1].short : "");
  // 단계 n이 지금 단계보다 앞(done)인지, 지금(cur)인지 — 단계 막대·칩·단계 지도가 같이 쓴다
  const stepClass = (n) => { const cur = st.j ? st.j.stage : -1; return n < cur ? "done" : n === cur ? "cur" : ""; };
  const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `${s}초 전` : `${Math.round(s / 60)}분 전`; };
  const cat = C.svg;
  const toolName = (t) => ({ claude: "Claude Code", codex: "Codex" })[t] || "AI 코딩 도구";
  const ymd = () => new Date().toLocaleDateString("sv");   // 이 컴퓨터 시간으로 YYYY-MM-DD
  const eul = (w) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? "을" : "를"; };   // 받침에 따라 을/를
  // 프로젝트 이름 — 연결된 AI 코딩 도구가 알려 준 폴더 이름, 연습용이면 예시 이름. 모르면 빈칸(위쪽 줄에 안 보인다)
  const project = () => st.project || (st.mode === "fixture" ? S.PROJECT : "");
  // 지금 몇 번째 할 일을 하는가 — 한 것 다음이 지금(2026-10-18 임유정 요청: "4개 중 3개"는 남은 수로 읽혀서)
  const nowAt = () => (allDone() ? met().length : metCount() + 1);
  const progress = () => (allDone() ? `할 일 ${met().length}개 모두 했어요` : `${met().length}개 중 ${nowAt()}번째 할 일`);
  // 그 단계에서 만든 것 — 확인 질문에 답하기 전에는 정답이라 '?'로 가린다(understand.js). 만든 것을 그리는 곳은 모두 이것을 쓴다
  const gv = (s) => U.shownGives(s, st.screen === "gate" && st.step === "check" ? st.check : null);
  const hardTexts = () => st.hard.map((i) => st.j.criteria[i].text);   // 넘어가기 전 확인에서 헷갈린다고 고른 할 일(이 등급의 목록에서)
  const docDone = (n) => st.docs.find((x) => x.stage === n);              // 그 단계에서 확정한 단계 문서
  const pingHead = () => st.ping.split(" — ")[0];
  // 지금 단계 — 코드가 정한다: 게이트를 통과한 다음 단계(처음엔 0단계). AI는 이 단계의 할 일만 본다
  const atStage = () => (st.j ? st.j.stage : 0);
  // 지금 단계의 연습 버튼
  const stageExamples = () => S.examples.filter((e) => !e.hidden && e.judgement.stage === atStage());
  const RESTART = { label: "연습 처음부터 다시", act: "restart" };
  // 화면 두 곳(PC·iPhone)이 같이 쓰는 문구
  const PLACEHOLDER = "예) 동아리 행사 등록 앱을 만들고 있어요. 필요한 기능을 문장으로 써 봤어요.";
  const SENT = "보여 주신 글은 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처는 빼 주세요.";
  const DOC = {
    first: "먼저 '이번 단계'에서 어디쯤인지 봐요. 단계 문서는 그 단계에 맞춰 만들어요.",
    none: "단계 문서는 1~4단계에서 만들어요. 확정한 문서는 단계 지도와 책에서 다시 볼 수 있어요.",
    draft: "지금까지 작업을 보고 AI가 초안을 먼저 써 드려요. 고치고 완성하는 건 직접 해요. 확정도 직접 눌러야만 돼요.",
  };
  // 7단계까지 마쳤을 때 — last: 마지막 확인에서 "예" 뒤, title·sub: 마무리 카드
  const END = { last: "좋아요! 이걸로 모든 단계를 마쳐요", title: "여덟 단계를 끝까지 왔어요!",
    sub: "다 만든 책은 서재의 서고에 꽂아 두고 언제든 다시 펼쳐 볼 수 있어요.", more: "서재로 가기" };

  // ── 기록 — 이 브라우저에만. 못 쓰는 환경(사생활 보호 창 등)이면 조용히 기록 없이 동작한다 ──
  const KEY = "navigator-prototype:v1";
  // 서재의 '내 책'(../library/my-books.js)도 이 열쇠를 읽는다 — 바꾸면 my-books.js의 KEY도(my-books.test.js가 맞대어 본다)
  // 한 권으로 엮어 서고로 보낸 책 — 서고 시안(../library)도 같은 열쇠를 읽어 처음부터 책장에 꽂아 둔다
  const BOUND_KEY = "floe-demo:bound";
  const readBound = () => { try { const v = JSON.parse(localStorage.getItem(BOUND_KEY) || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
  const writeBound = (id) => { try { localStorage.setItem(BOUND_KEY, JSON.stringify([...new Set([...readBound(), id])])); } catch {} };
  const KEEP = ["mode", "textSize", "text", "j", "todos", "history", "learned", "auto", "doc", "docs", "project", "pets", "since", "sound", "finished", "libGone",
    "checks", "hold", "todoLater", "alerts", "tier", "unplug", "judged", "words", "fed"];
  let forgotten = false;
  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return; }
    if (!s || typeof s !== "object") return;
    if (s.j && !(N.STAGES[s.j.stage] && Array.isArray(s.j.criteria))) delete s.j;   // 고장 난 기록은 버린다
    for (const k of KEEP) if (k in s) st[k] = s[k];
    if (st.mode === "live" && !canLive) st.mode = "fixture";
    st.pets = Math.max(0, Number(st.pets) || 0);
    st.libGone = [...new Set([...(Array.isArray(st.libGone) ? st.libGone.map(String) : []), ...readBound()])];
    for (const k of ["checks", "todoLater", "alerts", "fed"]) if (!Array.isArray(st[k])) st[k] = [];
    if (!st.hold || typeof st.hold.when !== "string") st.hold = null;
    if (!TIERS.some(([v]) => v === st.tier)) st.tier = "Full";
    if (st.j) st.j = T.refit(st.j, st.tier);   // 할 일 목록이 바뀌었으면(등급·규칙) 지금 목록에 맞춘다 — 글자가 같은 할 일만 이어 간다
    st.unplug = !!st.unplug;
    if (typeof st.judged !== "string") st.judged = "";
    st.back = N.welcome(s, Date.now());
  }
  function save() {
    if (forgotten) return;
    const o = { at: Date.now() };
    for (const k of KEEP) o[k] = st[k];
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {}
  }
  load();
  // 모드는 이 창에만(sessionStorage) — 서고에 다녀와도 남고, 앱을 다시 켜면 기본 화면(C-13). 읽지 않은 알림의 기준(마지막으로 알림 판을 본 때)도 같은 곳
  st.place = N.nextPlace(SESS && SESS.getItem(PLACE_KEY) === "vibe" ? "vibe" : "base", "");
  let seenAlerts = Number(SESS && SESS.getItem(SEEN_KEY)) || 0;
  if (!st.since) st.since = ymd();
  // 글자 크기 — 브라우저(또는 운영체제)에서 정한 기본 글자 크기를 따르고, 설정에서 한 번 더 키우거나 줄인다
  const TEXT_SIZES = [[0.9, "작게"], [1, "보통"], [1.15, "크게"], [1.3, "아주 크게"]];
  if (!TEXT_SIZES.some(([v]) => v === st.textSize)) st.textSize = 1;
  function browserScale() {
    const p = document.createElement("div"); p.style.cssText = "position:absolute;visibility:hidden;font-size:medium";
    document.documentElement.appendChild(p); const px = parseFloat(getComputedStyle(p).fontSize) || 16; p.remove();
    return px / 16;
  }
  const applyScale = () => document.documentElement.style.setProperty("--ui-scale", String(Math.round(browserScale() * st.textSize * 100) / 100));
  applyScale();

  // ── 아이콘 (선 그림) ──
  const icon = (d, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    up: icon('<path d="M6 15l6-6 6 6"></path>', 14), down: icon('<path d="M6 9l6 6 6-6"></path>', 14),
    pin: icon('<path d="M9 4h6l-1 6 3 3H7l3-3z"></path><path d="M12 13v7"></path>', 15),
    back: icon('<path d="M15 5l-7 7 7 7"></path>', 20),
    undo: icon('<path d="M15 5l-7 7 7 7"></path>', 14),
    today: icon('<circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5z"></path>', 24),
    map: icon('<path d="M4 19h4V5H4zM10 19h4V9h-4zM16 19h4v-6h-4z"></path>', 24),
    doc: icon('<path d="M6 3h8l5 5v13H6z"></path><path d="M14 3v5h5"></path><path d="M9 13h7M9 17h7"></path>', 24),
    gear: icon('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>', 16),
    check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', 14),
    arrow: icon('<path d="M5 12h14M13 6l6 6-6 6"></path>', 13),
    bubble: icon('<circle cx="12" cy="13" r="7"></circle><circle cx="9.5" cy="10.5" r="1.2"></circle><circle cx="19" cy="5" r="2"></circle>', 15),
    all: icon('<rect x="4" y="4" width="7" height="7" rx="1.5"></rect><rect x="13" y="4" width="7" height="7" rx="1.5"></rect><rect x="4" y="13" width="7" height="7" rx="1.5"></rect><rect x="13" y="13" width="7" height="7" rx="1.5"></rect>', 24),
    lib: icon('<path d="M3.5 6.5C6 5.5 9 5.5 12 7c3-1.5 6-1.5 8.5-.5V18c-2.5-1-5.5-1-8.5.5-3-1.5-6-1.5-8.5-.5z"></path><path d="M12 7v11.5"></path>', 24),
    // 레벨 오버레이의 명령 네 칸(2026-10-19, 목업 level-overlay.html 그대로) — 맡기기 · 살피기 · 꺼내기 · 쉬어 가기
    hand: icon('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"></path><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"></path>', 22),
    look: icon('<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path>', 22),
    bag: icon('<path d="M5 8h14l-1 12H6z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path>', 22),
    moon: icon('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path>', 22),
    // 모아 보기 창(2026-10-20, C-11) — 위쪽 줄의 단추. 네 칸 격자
    grid: icon('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"></rect><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"></rect><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"></rect><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"></rect>', 20),
    // 기본 화면(2026-10-20, C-13) — 위쪽 줄 맨 왼쪽의 집 단추
    home: icon('<path d="M4 11l8-7 8 7"></path><path d="M6 10v10h12V10"></path><path d="M10 20v-6h4v6"></path>', 20),
  };
  // 하트 — 설정 맨 위 '플로로와 나'가 쓴다(위쪽 줄의 하트는 2026-10-18에 뺐다)
  const HEART = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M12 21C5 15.5 2 12 2 8.2 2 5.3 4.3 3 7.1 3c1.9 0 3.6 1 4.9 2.7C13.3 4 15 3 16.9 3 19.7 3 22 5.3 22 8.2 22 12 19 15.5 12 21z"></path></svg>';
  const hearts = (level) => `<span class="hearts">${[0, 1, 2, 3].map((i) => `<i class="${i <= level ? "on" : ""}">${HEART}</i>`).join("")}</span>`;

  // ── 접힘·펼침 (PC 화면만) ──
  let hovering = false, timer = null, idleAt = 0, lastUi = null;
  function clearIdle() { clearTimeout(timer); timer = null; }
  function scheduleIdle() {
    if (greetSkip) return;   // 켜질 때 인사 움직임이 끝난 뒤부터 센다(C-10)
    clearIdle();
    // 마우스가 올라가 있으면 인사도 접지 않는다(플로로를 쓰다듬는 중에 사라지지 않게). 떠나면 다시 센다
    if (isPhone() || st.ui === "hidden" || hovering || (st.ui !== "greet" && pinned())) return;
    idleAt = Date.now();
    timer = setTimeout(() => { timer = null; view("idle"); }, DELAY[st.ui]);
  }
  function go(ui) { if (ui !== st.ui) { st.ui = ui; clearIdle(); } render(); }
  const view = (ev) => go(N.nextView(st.ui, ev, pinned()));   // 일(enter·click·esc·idle·alert)에 따라 다음 모습으로
  // 알릴 일이 생기면 접혀 있던 것(띠·인사)만 한 줄로 살짝 보인다 — 펼쳐져 있으면 그대로
  const peek = () => go(st.ui === "hidden" || st.ui === "greet" ? "petit" : st.ui);
  // 모드 바꾸기(C-13) — 규칙은 navigator.js nextPlace. 바꾸면 이 창에 기억한다(판은 닫는다)
  function setPlace(ev) {
    const p = N.nextPlace(st.place, ev);
    if (p !== st.place) { st.place = p; st.pane = ""; try { if (SESS) SESS.setItem(PLACE_KEY, p); } catch {} }
  }
  $nav.addEventListener("mouseenter", () => { hovering = true; clearIdle(); view("enter"); });
  $nav.addEventListener("mouseleave", () => { hovering = false; render(); });

  // ── 두 화면이 함께 쓰는 조각 (iPhone 화면과 PC의 설계도·설정이 쓴다) ──
  const sayRow = (size, f = face()) => { const [mood, say] = f; return `<div class="say">${cat(mood, size)}<div class="bubble" aria-live="polite">${esc(say)}</div></div>`; };
  const seg = () => `<div class="seg" aria-hidden="true">${N.STAGES.map((x) => `<span class="${stepClass(x.n)}"></span>`).join("")}</div>`;
  // 카드 하나 — PC는 테두리 상자(.choose), iPhone은 흰 카드(.card). 넘기는 글은 이미 esc 한 것
  const box = (label, title, why, extra = "") => (isPhone()
    ? `<div class="card"><span class="kicker">${label}</span><span class="big">${title}</span>`
    : `<div class="choose"><span class="label">${label}</span><span class="q">${title}</span>`) + `${why ? `<span class="why">${why}</span>` : ""}${extra}</div>`;
  // 보내기 전 경고 — 값은 다시 보이지 않고 종류만 말한다
  const warnNote = (no, noLabel) => `<div class="note n-warn"><b>보내기 전에 잠깐!</b> 글 안에 ${esc(st.warn.w.join(", "))}처럼 보이는 게 있어요. 그래도 AI에게 보낼까요?
    <div class="row" style="margin-top:8px"><button class="btn" data-act="send-anyway">괜찮아요, 보낼게요</button><button class="btn pri" data-act="${no}">${noLabel}</button></div></div>`;
  const errorNote = () => (st.error ? `<div class="note n-bad">${esc(st.error)}</div>` : "");
  // 설계도 화면의 경고·오류 (작업 글의 경고는 글 칸 옆에 따로 뜬다)
  const docNotes = () => (st.askConfirm ? `<div class="note n-warn" data-ask-confirm><b>빈칸이 ${st.askConfirm}개 남았어요.</b> 그래도 이대로 확정할까요?
    <div class="row" style="margin-top:8px"><button class="btn" data-act="confirm-anyway">그래도 확정할게요</button><button class="btn pri" data-act="confirm-cancel">빈칸 채우러 가기</button></div></div>` : "")
    + (st.warn && st.warn.then !== "judge" ? warnNote("stop-send", "그만둘게요") : "") + errorNote();
  // 체크 표시 한 줄 — 할 일 목록·단계 지도·다시 봐 준 결과가 같이 쓴다. inner는 이미 esc 한 것
  const ckItem = (ok, inner) => `<li><span class="ck ${ok ? "y" : "n"}">${ok ? "✓" : "○"}</span><span>${inner}</span></li>`;
  // 용어 표시 — 풀이가 있으면 누르면 그 자리에 한 줄이 펼쳐지고, 마우스를 올리면 같은 줄이 뜬다(FR-13). 풀이가 없으면 누를 수 없는 표시
  function termTag(t) {
    if (!t) return "";
    const line = G.explain(t), open = st.termOpen === t;
    if (!line) return `<span class="tag" title="전문가들이 부르는 이름이에요">용어: ${esc(t)}</span>`;
    return `<button type="button" class="tag term" data-act="term" data-term="${esc(t)}" aria-expanded="${open}" title="${esc(line)}">용어: ${esc(t)}</button>${
      open ? `<span class="term-say" role="note">${esc(line)}</span>` : ""}`;
  }
  // 넘어가기 전 확인의 한 장 요약 — [이름, 내용]. iPhone은 줄로, PC는 표로 그린다
  function planRows() {
    const s = stage(), nx = nextStage();
    return [["받은 것", s.gets], ["한 일", s.does], ["만든 것", gv(s)], ["헷갈렸던 부분", hardTexts().join(", ")], ["받은 답", st.answer],
      ...(nx ? [["다음 단계", `${nx.n}단계 ${nx.title} — ${nx.does}`]] : [])];
  }
  // 내가 정한 순서 — move면 꼭 할 일/나중에 고르기와 위·아래 버튼까지
  // 제안(MoSCoW를 둘로 줄인 것, priority.js) — 기본은 모두 꼭 할 일. 나중에로 미루면 '지금 할 일'이 건너뛴다
  const prioSeg = (i, later) => `<span class="prio" role="group" aria-label="${i + 1}번 할 일은 얼마나 급한가요">${[["must", false], ["later", true]].map(([k, v]) =>
    `<button type="button" class="pr" data-act="prio" data-i="${i}" data-later="${v}" aria-pressed="${later === v}">${P.LABEL[k]}</button>`).join("")}</span>`;
  const todoList = (move) => `<ol class="todo">${st.todos.map((t, i) => { const later = P.isLater(st.todoLater, t); return `<li class="${later ? "later" : ""}"><span class="i">${i + 1}</span><span class="t">${esc(t)}</span>${move ? `
    ${prioSeg(i, later)}<button class="round" data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? "disabled" : ""}>${I.up}</button>
    <button class="round" data-act="down" data-i="${i}" aria-label="아래로" ${i === st.todos.length - 1 ? "disabled" : ""}>${I.down}</button>` : later ? `<span class="tag">${P.LABEL.later}</span>` : ""}</li>`; }).join("")}</ol>`;
  // 골라 주세요(iPhone) — 고르는 건 사용자다. 고르면 작업 글에 한 줄로 적고 다시 살펴본다
  function chooseCard() {
    const n = st.j.next;
    if (st.later) return `<div class="row"><span class="meta grow">나중에 정하기로 했어요 — ${esc(n.question)}</span><button class="btn" data-act="again">다시 고르기</button></div>`;
    return `<div class="choose"><span class="label">골라 주세요</span><span class="q">${esc(n.question)}</span><span class="why">${esc(n.why)}</span>
      ${n.options.map((o, i) => `<button class="opt" data-act="opt" data-i="${i}" aria-pressed="${st.choice === i}"><span class="radio"></span>${esc(o)}</button>`).join("")}
      <div class="row"><button class="btn pri grow" data-act="decide" ${st.choice === null || st.busy ? "disabled" : ""}>이걸로 정할게요</button><button class="btn" data-act="later">나중에</button></div>
      <span class="meta">${esc(n.action)}</span></div>`;
  }
  const critList = (terms) => `<ul class="crit">${st.j.criteria.map((c) => ckItem(c.met, `${esc(c.text)}${terms ? termTag(c.term) : ""}${
    c.evidence ? `<span class="sub">적어 주신 글: "${esc(c.evidence)}"</span>` : ""}`)).join("")}</ul>`;
  const notes = () => (st.notice ? `<div class="note n-ok">${esc(st.notice)}</div>` : "");
  function inputBox() {
    let h = `<textarea data-act="text" aria-label="지금 만드는 것" placeholder="${PLACEHOLDER}">${esc(st.text)}</textarea>
      <div class="row">${stageExamples().map((e) => `<button class="btn" data-act="ex" data-i="${S.examples.indexOf(e)}">${esc(e.label)}</button>`).join("")}
      <span class="grow"></span><button class="btn pri" data-act="judge" ${st.busy ? "disabled" : ""}>어디쯤인지 보기</button></div>`;
    if (st.mode === "live") h += `<p class="meta" style="margin:0">${SENT}</p>`;
    if (st.warn && st.warn.then === "judge") h += warnNote("edit", "고칠게요");
    return `<div class="stack">${h}${errorNote()}</div>`;
  }
  const inputDetails = () => `<details ${st.error || st.warn || st.openInput ? "open" : ""}><summary>바뀐 작업 다시 보여 주기</summary>${inputBox()}</details>`;
  const modeBadge = () => (st.mode === "live"
    ? `<span class="badge live">진짜 AI(Claude)가 봐요${st.tokens ? ` · 지난번 읽고 쓴 양 약 ${st.tokens.toLocaleString()}토큰` : ""}</span>`
    : `<span class="badge fix">연습용 예시예요 — 진짜 AI가 아니에요</span>`);
  // 플로로와 나 — 친해진 정도 · 쓰다듬은 횟수 · 처음 만난 날 · 마친 단계 수. 설정 맨 위에 둔다(F-05, PRD 2-7 "플로로와 처음 만난거 보여주는건 설정 처음에").
  function bondCard() {
    const b = C.bond(st.pets);
    return `<div class="bondcard"><div class="bond-row">${petCat("love", 56)}<div class="stack"><span class="kicker">플로로와 나</span><b>${esc(b.name)} ${hearts(b.level)}</b>
        <span class="sub">쓰다듬은 횟수 ${st.pets}번${b.need ? ` · 더 친해지기까지 ${b.need}번` : ""}</span>
        <span class="sub">${esc(st.since)}부터 함께해요 · 마친 단계 ${st.history.length}개</span></div></div></div>`;
  }
  // 설정 — 플로로와 나, 보기 방식, Claude Code·Codex 연결 상태, 자동으로 살펴보기, 소리, 기록. PC·iPhone 모두 톱니 뒤에
  // 설정 — 묶음별로 나눠 한눈에(6.2.0, 이재엽 2026-10-19 "설정창도 직관적으로"): 플로로와 나 · 연결 · 보기 · 알림 기록 · 느낀 점 · 기록. PC에서는 섬 옆(오른쪽)에 열린다(settingsPop · .nav.side)
  const SG = {
    link: icon('<path d="M10 14a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1"></path><path d="M14 10a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1"></path>', 14),
    eye: icon('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle>', 14),
    box: icon('<path d="M4 7h16v13H4z"></path><path d="M4 7l2-3h12l2 3"></path><path d="M10 11h4"></path>', 14),
    bell: icon('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"></path><path d="M10 20a2 2 0 0 0 4 0"></path>', 14),
  };
  const sgrp = (ic, title, body) => `<section class="sgrp"><h3 class="sg-h">${ic}${title}</h3>${body}</section>`;
  const srow = (label, control) => `<div class="srow"><span>${label}</span>${control}</div>`;
  function settingsBody() {
    // 연결 칸 — 서버로 열었으면 보기 방식과 상관없이 보인다(연습 중에도 알림은 들어오니까). '연결 끊기'를 누르면 들어온 알림을 받지 않는다
    const link = canLive ? sgrp(SG.link, "연결", `<div class="row"><span class="led ${conn() === "on" ? "on" : conn()}"></span><span class="grow">${st.unplug
        ? "연결을 끊었어요 — 작업 알림이 와도 글 칸을 채우거나 살펴보지 않아요"
        : st.feed.at ? `${toolName(st.feed.tool)}와 연결됨 · ${esc(st.feed.project || "프로젝트")} · 마지막 알림 ${ago(st.feed.at)}`
        : "Claude Code·Codex 알림을 기다리는 중 — connect.js로 연결해 주세요"}</span>
        <button type="button" class="btn" data-act="unplug" aria-pressed="${st.unplug}">${st.unplug ? "다시 연결" : "연결 끊기"}</button></div>
      ${st.mode === "live" ? `<label class="chk"><input type="checkbox" data-act="auto" ${st.auto ? "checked" : ""} ${st.unplug ? "disabled" : ""}>AI 코딩 도구가 작업을 마치면 자동으로 살펴보기</label>
      <span>켜면 그때마다 최근 작업 대화가 AI(Claude)로 보내져요. 비밀번호처럼 보이는 게 있으면 보내기 전에 멈춰요.</span>` : ""}${
      // 앱 안에서는 폴더 고르기로 훅을 더하고 뺀다(터미널의 floe.js · connect.js와 같은 일) — preload.js가 열어 준 셋만
      window.floeApp ? `<div class="row"><button type="button" class="btn" data-act="app-connect">프로젝트 폴더 연결…</button><button type="button" class="btn" data-act="app-disconnect">연결 빼기…</button><button type="button" class="btn" data-act="app-settings">.env 폴더 열기</button></div>` : ""}`) : "";
    // 처음 설정(setup.js) 다시 하기 — Claude Code / API 키를 바꿀 때 (2026-10-19)
    const keep = sgrp(SG.box, "기록 · 처음 설정", `${window.FloeSetup ? `<div class="row"><span class="grow">AI를 어떻게 부를지(Claude Code / API 키) 다시 고를 수 있어요.</span><button class="btn" data-act="setup">처음 설정 다시 하기</button></div>` : ""}<div class="row"><span class="grow">기록은 이 컴퓨터의 브라우저에만 남아요.</span><button class="btn" data-act="forget">기록 지우기</button></div>`);
    // 만드는 크기 — 진짜 AI에게 물을 때 같이 보낸다(tier). 고르는 건 사용자
    const tier = srow("만드는 크기", `<span class="row tiers" role="radiogroup" aria-label="만드는 크기">${TIERS.map(([v, label]) =>
      `<label class="chk"><input type="radio" name="tier" data-act="tier" value="${v}" ${st.tier === v ? "checked" : ""}>${label}</label>`).join("")}${termTag(st.tier)}</span>`);
    const view = sgrp(SG.eye, "보기", `${srow("보기 방식", `<select data-act="mode" aria-label="보기 방식">
        <option value="fixture" ${st.mode === "fixture" ? "selected" : ""}>연습용 예시</option>
        <option value="live" ${st.mode === "live" ? "selected" : ""} ${canLive ? "" : "disabled"}>진짜 AI (Claude)${canLive ? "" : " — server.js를 켜야 해요"}</option></select>`)}
      ${srow("글자 크기", `<select data-act="text-size" aria-label="글자 크기">${TEXT_SIZES.map(([v, name]) =>
        `<option value="${v}" ${st.textSize === v ? "selected" : ""}>${name}</option>`).join("")}</select>`)}
      ${tier}${srow("버튼 말", `<span class="row tiers" role="radiogroup" aria-label="명령 칸의 말">${[["work", "일 말 (맡기기 · 살피기)"], ["game", "게임 말 (공격 · 행동)"]].map(([v, label]) =>
        `<label class="chk"><input type="radio" name="words" data-act="words" value="${v}" ${st.words === v ? "checked" : ""}>${label}</label>`).join("")}</span>`)}
      <label class="chk"><input type="checkbox" data-act="sound" ${st.sound ? "checked" : ""}>플로로가 작은 소리 내기 (쓰다듬을 때, 다 했을 때)</label>
      <div class="row">${modeBadge()}<span class="grow">안내 기준은 아직 시험판이에요</span></div>`);
    const log = sgrp(SG.bell, "알림 · 느낀 점", `${alertLog()}${notesCard()}`);
    return `${bondCard()}${link}${view}${log}${keep}`;
  }
  // 알림 기록(FR-7) — [때 · 도구 · 무슨 알림 · 서버가 준 한 줄 · 이 알림으로 끝낸 할 일]. 비밀번호처럼 보이는 글은 숨긴 채로 남는다(alerts.js)
  const clock = (t) => (Number.isFinite(t) ? new Date(t).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }) : "");
  const alertItem = (a) => `<li><span class="meta">${clock(a.at)}</span> <b>${esc(toolName(a.tool))}${a.sim ? " · 연습 알림" : ""}</b> ${esc(A.KIND[a.kind] || "알림을 보냈어요")}${
    a.hidden ? `<span class="sub">비밀번호처럼 보이는 글이 있어 내용은 숨겼어요</span>` : a.line ? `<span class="sub">${esc(a.line)}</span>` : ""}${
    a.done && a.done.length ? `<span class="sub ok">✓ 끝냈다고 표시함: ${esc(a.done.join(", "))}</span>` : ""}</li>`;
  const alertLog = () => `<div class="alog"><div class="row"><button type="button" class="lnk grow" data-act="alog" aria-expanded="${st.alogOpen}">${st.alogOpen ? I.up : I.down}알림 기록 ${st.alerts.length}개</button>${
    st.alogOpen && (st.alerts.length || canLive) ? `<button type="button" class="btn" data-act="alog-clear">알림 기록 비우기</button>` : ""}</div>${
    st.alogNote ? `<span class="meta" role="status">${esc(st.alogNote)}</span>` : ""}${
    !st.alogOpen ? "" : st.alerts.length ? `<ol>${st.alerts.map(alertItem).join("")}</ol>`
      : `<span class="meta">아직 받은 알림이 없어요.${st.mode === "fixture" && !isPhone() ? " 뒤 화면의 '▶ 작업 장면 보기'를 누르면 연습 알림이 와요." : ""}</span>`}</div>`;
  // 느낀 점(2026-10-19 실사용) — 설정 안. 한 줄 남기면 어디서(화면 · 단계 · 탭 · 보기 방식)와 때가 저절로 붙는다(notes.js where). 이 컴퓨터에만 남고,
  // 'Jira용 복사'가 모아 클립보드에 넣는다 — 그때 비밀값 · 연락처 모양은 가린다(sensitive와 같은 sensitive.js)
  const noteCtx = () => ({ screen: st.screen, stage: st.j ? st.j.stage : undefined, tab: st.tab, mode: st.mode, project: project() });
  const noteItem = (n) => `<li><span class="meta">${esc(NT.stamp(n.at))}${n.where ? ` · ${esc(n.where)}` : ""}</span><button type="button" class="lnk" data-act="note-del" data-id="${esc(n.id)}" aria-label="이 느낀 점 지우기">지우기</button><span class="ntext">${esc(n.text)}</span></li>`;
  const notesCard = () => (!NT ? "" : `<div class="alog notes"><div class="row"><button type="button" class="lnk grow" data-act="notes" aria-expanded="${st.notesOpen}">${st.notesOpen ? I.up : I.down}느낀 점 ${noteList.length}개</button>${
    st.notesOpen && noteList.length ? `<button type="button" class="btn" data-act="notes-copy">Jira용 복사</button><button type="button" class="btn" data-act="notes-clear">전부 지우기</button>` : ""}</div>${
    !st.notesOpen ? "" : `<textarea class="mc-input" data-act="note-text" rows="2" aria-label="느낀 점" placeholder="예) 2단계 할 일 문장이 어려웠어요">${esc(st.noteText)}</textarea>
      <div class="row"><span class="meta grow">어디서(화면 · 단계) 언제 쓴 느낌인지는 저절로 붙어요. 이 컴퓨터에만 남아요.</span><button type="button" class="btn pri" data-act="note-add" ${st.noteText.trim() ? "" : "disabled"}>남기기</button></div>${
      st.noteCopy ? `<textarea class="mc-input" data-act="note-copy" rows="4" readonly aria-label="복사할 글">${esc(st.noteCopy)}</textarea><span class="meta">자동 복사가 안 돼서 여기 두었어요 — 전체 선택해서 복사하세요.</span>` : ""}${
      noteList.length ? `<ol>${noteList.map(noteItem).join("")}</ol>` : `<span class="meta">아직 남긴 느낀 점이 없어요. 쓰다가 걸리는 게 있으면 바로 적어 두세요.</span>`}`}</div>`);
  const settingsCard = () => (st.settings ? `<div class="foot settings">${settingsBody()}</div>` : "");
  const gearBtn = () => `<button class="round" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 — 보기 방식, 연결, 기록">${I.gear}</button>`;

  // 단계 지도 — iPhone 탭이 쓴다
  const mapBody = () => `<div class="list">${N.STAGES.map((x) => `<div>
      <span class="dot ${stepClass(x.n)}"></span><span style="flex:1;padding:8px 0"><b>${x.n} · ${esc(x.title)}</b><span class="sub">${esc(x.does)}</span></span>
      ${stepClass(x.n) === "cur" ? `<span class="meta">${metCount()}/${met().length}</span>` : ""}</div>`).join("")}</div>`;
  // [id, PC 이름, iPhone 이름, 아이콘]. 마지막(도서관)은 PC에만 있다 — iPhone은 앞의 셋. 탭 순서가 바뀌면 고른 동그라미(.ti-ind)는 순서(tabIdx)를 따라간다
  // '내 배움' 탭은 2026-10-18에 뺐다(F-05, PRD 2-7) — 플로로와 나는 설정 맨 위. 서재의 '내 배움'도 2026-10-19에 지움.
  // 2026-10-18 임유정 요청: 첫 탭 이름 '지금' → '이번 단계', '한곳에서 보기' 탭(FR-6)도 뺐다 — FR-6 등급은 팀이 정한다(PR #105)
  // 2026-10-20(C-16, 이재엽 "우리 도서관이 있잖아 책들로 정리를 해서 거기에 저장을 하고 책에 들어가서 내용 확인 후 작업"): 단계 문서 탭을 뺐다 — 문서는 도서관의 책 안에서(bookDocs · deskDoc)
  const TABS = [["today", "이번 단계", "오늘", "today"], ["map", "단계 지도", "단계 지도", "map"], ["lib", "도서관", "도서관", "lib"]];
  const PHONE_TABS = TABS.slice(0, 2);
  // 이 단계의 단계 문서 — 확정한 것(done), 고치는 중인 것(d), 플로로의 표정과 한마디(face)
  function docState(s) {
    const done = docDone(s.n), d = st.doc && st.doc.stage === s.n ? st.doc : null;
    return { done, d, face: N.docFace({ busy: st.busy, warn: st.warn, error: st.error, review: d && d.review, draftSay: d && d.say, done }) };
  }
  const reviewList = (r) => (r ? `<div class="card review"><span class="kicker">다시 봐 드렸어요${st.mode === "fixture" ? " · 연습용이라 빈칸이 남았는지만 봐요" : ""}</span><ul class="crit">
      ${r.good.map((g) => ckItem(true, esc(g))).join("")}
      ${r.fix.map((f) => ckItem(false, `<b>"${esc(f.where)}"</b> — ${esc(f.why)}<span class="sub">고치는 방향: ${esc(f.hint)}</span>`)).join("")}</ul></div>` : "");
  const blankMeta = (d) => { const n = N.blanks(d.text).length; return `${n ? `빈칸 ${n}개` : "빈칸 없음"} · 봐 드린 횟수 ${d.rounds}번`; };

  // 넘어가기 전 확인에 더한 두 장면이 PC·iPhone에서 같이 쓰는 글과 조각 — 확인 질문(CHECK)과 잠시 멈추기(HOLD)
  const CHECK = { sub: "맞든 틀리든 그대로 넘어가요. 가볍게 골라 보세요.", go: "알겠어요, 계속할게요" };
  const HOLD = { title: "잠시 멈추고, 다시 볼 날을 정해 둘까요?", sub: "멈춰 둬도 다음 단계로는 넘어가지 않아요. 정한 날에 다시 같이 풀어요.",
    later: "준비되면 언제든 이어서 해요. 그때까지 다음 단계로는 넘어가지 않아요." };
  const checkWhy = (q) => `<div class="answer"><b>이번 단계에서 한 일</b>${esc(q.why)}</div>`;
  const holdOffer = () => (U.offerHold(st.noCount) ? `<div class="hold-offer"><span><b>벌써 ${st.noCount}번째 같이 풀고 있어요.</b> 오늘은 잠시 멈추고, 다시 볼 날을 정해 둬도 돼요.</span>
    <button type="button" class="${isPhone() ? "btn" : "b"}" data-act="hold">잠시 멈추기</button></div>` : "");
  const holdForm = () => `<div class="holdform"><label><span>누가 다시 볼까요?</span><input data-act="hold-who" value="${esc(st.holdWho)}" maxlength="20" autocomplete="off"></label>
    <label><span>언제 다시 볼까요?</span><input type="date" data-act="hold-when" value="${esc(st.holdWhen)}" min="${ymd()}"></label></div>`;
  // 넘어가기 전 확인(iPhone) — 단계마다 [내용, 버튼]. 버튼은 아래에 붙인다
  function checkStep() {
    const s = stage(), nx = nextStage();
    const yesNo = `<span class="ask">이번 단계에서 한 일, 이해되셨나요?</span>
      <button class="btn pri wide" data-act="yes">네, 이해했어요</button><button class="btn wide" data-act="no">아니요, 잘 모르겠어요</button>
      <span class="meta" style="text-align:center">"아니요"를 누르면 같이 풀어 봐요.${st.noCount ? ` · 다시 물어본 횟수 ${st.noCount}번` : ""}</span>`;
    // '아니요' 세 번째부터 잠시 멈추기를 권한다(understand.js HOLD_AFTER_NO)
    const holdBtn = U.offerHold(st.noCount) ? `<button class="btn wide" data-act="hold">잠시 멈추기</button>` : "";
    if (st.step === "which") return [`${holdOffer()}<span class="ask">어디가 헷갈렸나요?</span><span class="meta">여러 개 골라도 돼요.</span>` +
      st.j.criteria.map((c, i) => `<label class="chk"><input type="checkbox" data-act="hard" data-i="${i}" ${st.hard.includes(i) ? "checked" : ""}>${esc(c.text)}</label>`).join(""),
      `<button class="btn pri wide" data-act="to-question" ${st.hard.length ? "" : "disabled"}>다음</button>`];
    if (st.step === "question") return [`<span class="ask">궁금한 걸 편하게 물어보세요</span>
      <textarea data-act="question" placeholder="예) 꼭 필요한지 표시하는 건 왜 해요?">${esc(st.question)}</textarea>
      ${st.answer ? `<div class="note n-acc">${esc(st.answer)}</div>` : ""}${errorNote()}`,
      `<button class="btn pri wide" data-act="answer" ${st.busy ? "disabled" : ""}>물어보기</button>${st.answer ? `<button class="btn wide" data-act="plan">한 장 요약 보기</button>` : ""}${holdBtn}`];
    if (st.step === "plan") return [`<span class="ask">이번 단계 한 장 요약</span><div class="plan">
      ${planRows().map(([k, v]) => `<div><b>${k}</b> ${esc(v)}</div>`).join("")}</div>`, yesNo + holdBtn];
    if (st.step === "hold") return [`<span class="ask">${HOLD.title}</span><span class="meta">${HOLD.sub}</span>${holdForm()}`,
      `<button class="btn pri wide" data-act="hold-save">이렇게 멈춰 둘게요</button><button class="btn wide" data-act="hold-back">돌아가기</button>`];
    // 확인 질문은 질문과 선택지를 아래 막대에 같이 둔다 — 질문이 스크롤 밖에 있으면 무엇을 고르는지 안 보여서
    if (st.step === "check") {
      const { q, pick } = st.check;
      if (pick === null) return ["", `<span class="ask">${esc(q.ask)}</span><span class="meta" style="text-align:center">${CHECK.sub}</span>` +
        q.options.map((o, i) => `<button class="opt" data-act="check-pick" data-i="${i}"><span class="radio"></span>${esc(o)}</button>`).join("")];
      return ["", `<span class="ask">정답: ${esc(q.options[q.answer])}</span>${checkWhy(q)}<button class="btn pri wide" data-act="check-go">${CHECK.go}</button>`];
    }
    if (st.step === "next" && !nx) return [`<span class="ask">${END.last}</span>`, `<button class="btn pri wide" data-act="go">마치기</button>`];
    if (st.step === "next") return [`<span class="ask">좋아요! 다음은 ${nx ? `${nx.n}단계 "${esc(nx.title)}"` : "마무리"}예요</span>
      <span class="meta">무엇부터 할지 순서를 정해 보세요. 지금 안 해도 되는 일은 '나중에'로 미뤄 둬요.</span>${todoList(true)}`,
      `<button class="btn pri wide" data-act="go" ${N.canAdvance(met(), "yes") ? "" : "disabled"}>이 순서로 시작하기</button>`];
    return ["", yesNo];
  }
  const chips = () => `<div class="chips">${N.STAGES.map((x) => `<span class="chip ${stepClass(x.n)}">${stepClass(x.n) === "done" ? "✓ " : ""}${x.n} ${esc(x.short)}</span>`).join("")}</div>`;
  const flow = () => { const s = stage(); return `<div class="flow"><div class="box"><b>받은 것</b>${esc(s.gets)}</div><span class="arrow">→</span>
    <div class="box"><b>한 일</b>${esc(s.does)}</div><span class="arrow">→</span><div class="box"><b>만든 것</b>${esc(gv(s))}${
    docDone(s.n) ? `<span class="sub ok">✓ 문서 확정함</span>` : ""}</div></div>`; };
  // iPhone의 지금 결정할 것 하나 — 다 했으면 "넘어가기", 순서를 정했으면 그 첫 일, 아니면 같이 정하기
  function focusCard() {
    const n = st.j.next, now = esc(tick().now);
    if (st.finished) return box("다 했어요", END.title, END.sub, `<button class="btn pri wide" data-act="lib-enter">${END.more}</button>${
      st.mode === "fixture" ? `<button class="btn wide" data-act="${RESTART.act}">${RESTART.label}</button>` : ""}`);
    if (holding()) return box(esc(U.holdLine(st.hold, ymd())), "잠시 멈춰 뒀어요", HOLD.later, `<button class="btn pri wide" data-act="hold-resume">다시 이어 하기</button>`);
    if (allDone()) return box("다 했어요", `${stage().n}단계 할 일을 모두 했어요`, "넘어가기 전에 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      `<button class="btn pri wide" data-act="gate">다음 단계로 넘어가기</button>`);
    if (st.todos) return box("지금 할 일", esc(todosNow()[0]), "정한 순서대로 하나씩 해 봐요. 하고 나서 바뀐 작업을 다시 보여 주세요.");
    if (!n) return box("지금 할 일", now, "");
    return st.picking || st.later ? box("지금 할 일", now, "", chooseCard())
      : box("지금 할 일", now, esc(n.why), `<button class="btn pri wide" data-act="pick">같이 정하기</button>`);
  }
  // 용어 풀이를 펼치면 다시 그려도 이 단계 할 일 목록이 접히지 않게 열어 둔다
  const more = () => `<div class="more">
    <details ${st.j.criteria.some((c) => c.term && c.term === st.termOpen) ? "open" : ""}><summary>이 단계 할 일 ${met().length}개 보기</summary>${critList(true)}</details>
    ${st.todos ? `<details><summary>내가 정한 순서 보기</summary>${todoList(false)}</details>` : ""}
    ${inputDetails()}</div>`;

  // ── PC 화면 — 가로 카드 ──
  // 지금 보이는 카드의 단축키 { 키: 할 일 } — 카드를 그릴 때 채운다
  let deskKeys = {};
  // 카드가 플로로에게 맡긴 한마디(2026-10-18 임유정 요청: 카드 위 말풍선과 잠깐 뜨는 말풍선을 하나로) — 그린 뒤 say()로 띄운다
  let cardSay = "", lastCardSay = "";
  const KEYCAP = { Enter: "Enter", Escape: "Esc", "c-Enter": "Ctrl+Enter" };
  const kbd = (k) => (k ? `<kbd aria-hidden="true">${KEYCAP[k] || k.toUpperCase()}</kbd>` : "");
  // 버튼 하나 {label, act, i, key, pri, kind, pressed}. kind에 opt가 있으면 선택지(단축키가 앞에)
  const isOpt = (a) => /opt/.test(a.kind || "");
  function btn(a) {
    const cls = ["b", a.pri && "pri", a.kind].filter(Boolean).join(" ");
    const data = `data-act="${a.act}"${a.i !== undefined ? ` data-i="${a.i}"` : ""}${a.pressed !== undefined ? ` aria-pressed="${a.pressed}"` : ""}`;
    const tip = a.key ? ` title="단축키 ${KEYCAP[a.key] || a.key.toUpperCase()}"` : "";
    return isOpt(a) ? `<button class="${cls}" ${data}${tip}>${kbd(a.key)}<span>${esc(a.label)}</span></button>`
      : `<button class="${cls}" ${data}${tip}>${esc(a.label)}${kbd(a.key)}</button>`;
  }

  // 플로로 — 기분은 [잠깐 짓는 표정(쓰다듬기·축하) > 졸음 > 안내 화면의 표정] 순서. 졸음은 편한 표정일 때만
  let flashMood = { mood: "", until: 0 }, sleepState = "awake";
  const CALM = ["idle", "happy", "done"];
  const liveMood = (base) => (flashMood.until > Date.now() ? flashMood.mood : sleepState !== "awake" && CALM.includes(base) ? sleepState : base);
  // 쓰다듬을 수 있는 플로로 — 누르거나 좌우로 문지르면 된다. data-live는 기분이 바뀌면 같이 바뀌는 플로로
  const petCat = (mood, size, extra = "") => `<button class="pet" data-act="pet" data-pet data-live data-base="${mood}" aria-label="플로로 쓰다듬기"
    title="플로로 쓰다듬기 — 눌러도, 좌우로 문질러도 돼요">${cat(liveMood(mood), size, { extra, hole: true })}</button>`;

  // 칸 — 지나온 것과 지금 하는 것까지 밝게, 남은 것은 어둡게
  const mini = () => `<span class="mini" aria-hidden="true">${met().map((_, i) => `<i class="${i < nowAt() ? "on" : ""}"></i>`).join("")}</span>`;
  const stageMeta = () => { const s = stage(); return `<span class="mm-stage">${s.n}단계 · ${esc(s.title)}</span><span>${allDone() ? `할 일 ${met().length}개 모두 했어요` : progress()}</span>${mini()}`; };
  const flowLine = () => { const s = stage(); return `<span class="flowline"><span>${esc(s.gets)}</span>${I.arrow}<span>${esc(s.does)}</span>${I.arrow}<span>${esc(gv(s))}</span>${
    docDone(s.n) ? `<span class="okchip">${I.check}문서 확정함</span>` : ""}</span>`; };
  const dots = `<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const deskInput = () => `<textarea class="mc-input" data-act="text" rows="3" aria-label="지금 만드는 것"
    placeholder="${PLACEHOLDER}">${esc(st.text)}</textarea>${st.mode === "live" ? `<p class="mc-fine">${SENT}</p>` : ""}`;
  // 연습 버튼('0단계 · 하는 중' 등)은 미리 써 둔 글을 넣는 시연용이라 연습용 예시 모드에서만 보인다. 지금 단계는 카드 위 작은 줄이 알려 준다
  // 바뀐 작업은 직접 써서 보내지 않는다 — AI 코딩 도구에서 작업하면 플로로가 알아채고 묻는다(onEvent → ping). (2026-10-18 임유정 요청:
  // '새로 한 것만 덧붙여 주세요' 칸을 뺐다. 설계도 탭을 없애거나 설계도를 단계 질문에 반영하게 되면 다시 볼 것 — 기획 문서 1번)
  const WORK_NOTE = "AI 코딩 도구에서 작업하면 플로로가 알아채고 어디쯤인지 봐 드릴지 물어요.";
  const exampleActs = () => (st.mode === "live" ? [] : stageExamples()).map((e) => ({ label: e.label, act: "ex", i: S.examples.indexOf(e), kind: "soft" }));

  // 지금 결정할 것 하나 — 위에 있는 상황이 먼저다.
  // 돌려주는 것: {tone, mood, badge, say(플로로의 한마디), meta, title, sub, body, acts, foot} — 글은 이미 esc 한 것
  function momentToday() {
    const s = st.j && stage(), f = face();
    if (st.busy) return { tone: "gray", mood: "look", badge: "…", meta: s ? stageMeta() : "", title: `살펴보고 있어요${dots}`,
      sub: `<span data-wait>${waitText()}</span>`, acts: [] };
    if (st.warn) {
      const fix = st.warn.then === "judge";
      return { tone: "amber", mood: "alert", badge: "!", title: "보내기 전에 잠깐!",
        sub: `글 안에 ${esc(st.warn.w.join(", "))}처럼 보이는 게 있어요. 그래도 AI(Claude)에게 보낼까요?`,
        acts: [{ label: fix ? "고칠게요" : "그만둘게요", act: fix ? "edit" : "stop-send", key: "Enter", pri: true }, { label: "괜찮아요, 보낼게요", act: "send-anyway" }] };
    }
    if (st.error) return { tone: "red", mood: "think", extra: "oops", badge: "×", meta: s ? stageMeta() : "", title: "음, 잘 안 됐어요", sub: esc(st.error),
      acts: [{ label: "글 고쳐서 다시 해 보기", act: "retry-input", key: "Enter", pri: true }, { label: "닫기", act: "dismiss", key: "Escape", kind: "ghost" }] };
    if (st.screen === "gate") return momentGate();
    if (st.meal) return feedSortMoment();   // 먹이를 나눠 정리하는 중(C-15)
    if (st.ping) return { tone: "gray", mood: "look", badge: "…",
      meta: `<span class="mm-stage">${esc(pingHead())}</span>${s ? `<span>${s.n}단계 · ${progress()}</span>${mini()}` : ""}`,
      title: "바뀐 작업을 보고, 어디쯤인지 알려 드릴까요?",
      sub: st.mode === "live" ? "최근 작업 대화가 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처처럼 보이는 게 있으면 보내기 전에 멈춰요."
        : "연습용 예시라서, 미리 만들어 둔 응답으로 살펴봐요.",
      acts: [{ label: "살펴봐 주세요", act: "look-now", key: "Enter", pri: true }, { label: "보낼 글 먼저 보기", act: "peek-text" }] };
    if (!st.j || st.openInput) {
      const first = !st.j;
      // 처음 카드는 먹이 주기 화면(C-15, 2026-10-20) — 파일 · 붙여 넣기 한곳. '예시 먹이 주기'는 서버 없이 보이는 예시(FR-10). 글을 바로 보내지 않고 나눠 정리한 뒤 확인하면 보낸다
      return { tone: "blue", mood: f[0], badge: "", say: first ? "" : f[1], meta: first ? `<span class="mm-stage">플로로에게 먹이 주기</span>` : stageMeta(),
        title: first ? "플로로에게 먹이를 주세요" : "보낼 글을 확인해 주세요",
        sub: first ? "파일을 끌어다 놓거나 글을 붙여 넣으면 플로로가 읽고 나눠 정리해요. 비밀번호 · 개인적인 일 같은 구간은 빼고 보내요." : "AI 코딩 도구에서 가져온 작업이에요. 고칠 곳이 있으면 고친 뒤 보내 주세요.",
        body: deskInput(),
        acts: [...(first && FD && st.mode === "fixture" ? [{ label: "예시 먹이 주기", act: "feed-example", kind: "soft" }] : first ? [] : exampleActs()),
          ...(first && FD ? [{ label: "나눠 정리하기", act: "feed-sort", key: "c-Enter", pri: true }] : [{ label: "어디쯤인지 보기", act: "judge", key: "c-Enter", pri: true }]),
          ...(first ? [] : [{ label: "닫기", act: "close-input", key: "Escape", kind: "ghost" }])] };
    }
    if (st.finished) return { tone: "green", mood: "happy", badge: "✓", meta: `<span class="mm-stage">모든 단계를 마쳤어요</span>`,
      title: END.title, sub: END.sub,
      acts: [{ label: END.more, act: "lib-enter", key: "Enter", pri: true }, ...(st.mode === "fixture" ? [RESTART] : [])] };
    if (holding()) return { tone: "gray", mood: f[0], badge: "‖", say: f[1], meta: stageMeta(), banner: U.holdLine(st.hold, ymd()),
      title: "잠시 멈춰 뒀어요", sub: HOLD.later,
      acts: [{ label: "다시 이어 하기", act: "hold-resume", key: "Enter", pri: true }] };
    if (allDone()) return { tone: "green", mood: f[0], badge: "✓", meta: stageMeta(), title: `${s.n}단계 할 일을 모두 했어요!`,
      sub: "다음 단계로 가기 전에, 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      acts: [{ label: "확인하고 넘어가기", act: "gate", key: "Enter", pri: true }] };
    if (st.todos) return { tone: "blue", mood: f[0], badge: "", say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(todosNow()[0])}`,
      sub: WORK_NOTE,
      body: `<ol class="steps">${todosNow().map((t, i) => `<li class="${[i === 0 && "now", P.isLater(st.todoLater, t) && "later"].filter(Boolean).join(" ")}"><b>${i + 1}</b>${esc(t)}${
        P.isLater(st.todoLater, t) ? `<small>${P.LABEL.later}</small>` : ""}</li>`).join("")}</ol>`,
      acts: [] };
    const n = st.j.next;
    if (!n) return { tone: "blue", mood: f[0], badge: "", say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(tick().now)}`, sub: WORK_NOTE, acts: [] };
    if (st.later) return { tone: "blue", mood: f[0], badge: "?", meta: stageMeta(), title: "나중에 정하기로 했어요", sub: esc(n.question),
      acts: [{ label: "지금 고르기", act: "again", key: "Enter", pri: true }, { label: "바뀐 작업 보여 주기", act: "open-input" }] };
    // 선택지에 원하는 게 없으면 직접 쓴다 (2026-10-18 임유정 요청: '나중에'는 창을 닫는 것과 같아서 뺐다)
    if (st.own) return { tone: "blue", mood: f[0], badge: "?", meta: stageMeta(), title: esc(n.question), sub: "어떻게 할지 직접 적어 주세요. 한 줄이면 충분해요.",
      body: `<textarea class="mc-input" data-act="own-text" rows="2" aria-label="직접 쓴 답" placeholder="예) ${esc(n.options[0])}">${esc(st.ownText)}</textarea>`,
      acts: [{ label: "이걸로 정할게요", act: "own-decide", key: "c-Enter", pri: true }, { label: "선택지로 돌아가기", act: "own-cancel", key: "Escape", kind: "ghost" }] };
    // 왜 묻는지와 고르면 무엇을 하는지를 한 문단으로 (2026-10-18 임유정 요청: 위아래로 나뉘어 읽기 불편)
    return { tone: "blue", mood: f[0], badge: "?", say: f[1], meta: stageMeta(), title: esc(n.question), sub: esc([n.why, n.action].filter(Boolean).map((x) => (/[.!?…]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`)).join(" ")),
      acts: [...n.options.map((o, i) => ({ label: o, act: "pick-opt", i, key: String(i + 1), kind: "opt" })),
        { label: "직접 쓸게요", act: "own", key: String(n.options.length + 1), kind: "opt" }] };
  }
  // ── 먹이 주기(C-15, 2026-10-20 — 규칙은 feed.js) ──
  const feedState = (text, example = false) => { const sections = FD ? FD.split(text) : []; return sections.length ? { sections, checks: sections.map(FD.check), marks: [], example } : null; };
  const feedSkip = (fd, i) => { const c = fd.checks[i], m = fd.marks[i]; return m === "skip" || (m !== "keep" && (c.secret || c.personal)); };
  // 정리 화면 — 구간마다 주제 · 표시(못 먹어요 / 안 먹을게요 / 먹어요), 사람이 구간마다 고치고 확인하면 빠진 구간 없이 보낸다
  function feedSortMoment() {
    const fd = st.meal, packed = FD.pack(fd.sections, fd.marks);
    const rows = fd.sections.map((s, i) => { const c = fd.checks[i], skip = feedSkip(fd, i);
      return `<li class="${skip ? "skip" : "keep"}"><span class="fi">${i + 1}</span><span class="ft"><b>${esc(c.topic)}</b><small>${esc(skip ? (fd.marks[i] === "skip" ? "빼 달라고 하셨어요" : c.why) : "먹어요")}</small></span>
        <button type="button" class="b ghost" data-act="feed-mark" data-i="${i}" aria-pressed="${skip}">${skip ? "먹어도 돼요" : "빼 주세요"}</button></li>`; }).join("");
    return { tone: "blue", mood: "look", badge: "", meta: `<span class="mm-stage">먹이 ${fd.sections.length}구간${fd.example ? " · 예시예요 · 시연용" : ""}</span>`,
      title: packed.kept ? `${packed.kept}구간을 먹을게요${packed.left.length ? ` — ${packed.left.length}구간은 빼요` : ""}` : "먹을 수 있는 구간이 없어요",
      sub: "빠진 구간의 글은 AI에게 보내지 않고 책에도 남기지 않아요. 구간마다 바꿀 수 있어요.",
      body: `<ol class="feedlist" aria-label="나눈 구간">${rows}</ol>`,
      acts: [{ label: "확인하고 어디쯤인지 보기", act: "feed-confirm", key: "c-Enter", pri: true }, { label: "다시 쓰기", act: "feed-back", key: "Escape", kind: "ghost" }] };
  }
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
    // 연습 모드의 예시 먹이는 정해진 장면(연습 첫 글)으로 이어진다 — 연습용 예시는 정해진 글만 알아서(FR-10). 진짜 AI면 먹은 글 그대로
    Object.assign(st, { text: fd.example && st.mode === "fixture" ? S.first.text : p.text, meal: null, undo: [] });
    judge(false);
  }
  // 파일 끌어다 놓기 — 띠 · 한 줄 · 펼침 어디에 놓아도 펼쳐서 먹이 주기로. 글 파일(.md · .txt) 1MB 아래만, 내용은 file.text()로 읽는다(경로가 필요 없어 앱을 고치지 않는다).
  // 앱 창은 파일을 놓으면 그 파일 주소로 넘어가므로 섬 밖에 놓아도 먼저 막는다(넘김 문서 7절)
  document.addEventListener("dragover", (e) => { e.preventDefault(); });
  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f || !FD || isPhone()) return;
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
  function momentGate() {
    const s = stage(), nx = nextStage(), meta = `<span class="mm-stage">${s.n}단계에서 한 일</span>${flowLine()}`;
    const yes = { label: "네, 이해했어요", act: "yes", key: "y", pri: true }, no = { label: "아니요, 같이 풀어요", act: "no", key: "n" };
    // '나중에'(접기와 같음)는 뺐다 — 접기는 오른쪽 위 ^ 버튼과 Esc가 한다 (2026-10-18 임유정 요청)
    // '아니요' 세 번째부터 잠시 멈추기(FR-5 보류) — 헷갈린 곳 고르기에서는 눈에 띄게, 그 뒤 장면에서는 조용한 버튼으로
    const holdAct = U.offerHold(st.noCount) ? [{ label: "잠시 멈추기", act: "hold", key: "h", kind: "ghost" }] : [];
    if (st.step === "which") return { tone: "amber", mood: "think", badge: "?", meta, title: "어디가 헷갈렸나요?", sub: "여러 개 골라도 돼요. 고른 곳부터 같이 풀어요.",
      body: holdOffer(),
      acts: [...st.j.criteria.map((c, i) => ({ label: c.text, act: "hard-t", i, key: String(i + 1), kind: "opt toggle", pressed: st.hard.includes(i) })),
        { label: "다음", act: "to-question", key: "Enter", pri: true }] };
    if (st.step === "question") return { tone: "amber", mood: face()[0], badge: "?", meta,
      title: "궁금한 걸 편하게 물어보세요", sub: `헷갈린 곳: ${esc(hardTexts().join(", "))}`,
      body: `<textarea class="mc-input" data-act="question" rows="2" aria-label="궁금한 것" placeholder="예) 꼭 필요한지 표시하는 건 왜 해요?">${esc(st.question)}</textarea>${
        st.answer ? `<div class="answer"><b>플로로의 답</b>${esc(st.answer)}</div>` : ""}`,
      acts: [{ label: "물어보기", act: "answer", key: "c-Enter", pri: !st.answer }, ...(st.answer ? [{ label: "한 장 요약 보기", act: "plan", key: "Enter", pri: true }] : []), ...holdAct] };
    if (st.step === "plan") return { tone: "amber", mood: face()[0], badge: "!", meta: `<span class="mm-stage">${s.n}단계 한 장 요약</span>`,
      title: "이렇게 정리해 봤어요. 이제 어때요?", sub: "",
      body: `<dl class="sheet">${planRows().map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`,
      acts: [yes, { ...no, label: "아직 잘 모르겠어요" }, ...holdAct] };
    if (st.step === "hold") return { tone: "gray", mood: face()[0], badge: "‖", say: face()[1], meta: `<span class="mm-stage">${s.n}단계 · 잠시 멈추기</span>`,
      title: HOLD.title, sub: HOLD.sub, body: holdForm(),
      acts: [{ label: "이렇게 멈춰 둘게요", act: "hold-save", key: "c-Enter", pri: true }, { label: "돌아가기", act: "hold-back", key: "Escape", kind: "ghost" }] };
    // '예' 뒤 확인 질문 하나 — 고르면 맞았는지 보이고, 틀려도 정답과 한 줄 설명을 본 뒤 넘어간다
    if (st.step === "check") {
      const { q, pick } = st.check, m = `<span class="mm-stage">${s.n}단계 · 확인 질문 하나</span>${flowLine()}`;
      if (pick === null) return { tone: "amber", mood: face()[0], badge: "?", say: face()[1], meta: m, title: esc(q.ask), sub: CHECK.sub,
        acts: [...q.options.map((o, i) => ({ label: o, act: "check-pick", i, key: String(i + 1), kind: "opt" }))] };
      return { tone: "amber", mood: face()[0], badge: "!", say: face()[1], meta: m, title: `정답: ${esc(q.options[q.answer])}`, sub: "", body: checkWhy(q),
        acts: [{ label: CHECK.go, act: "check-go", key: "Enter", pri: true }] };
    }
    if (st.step === "next" && !nx) return { tone: "green", mood: "happy", badge: "✓", meta: `<span class="mm-stage">마무리</span>`,
      title: END.last, sub: "", acts: [{ label: "마치기", act: "go", key: "Enter", pri: true }] };
    if (st.step === "next") return { tone: "green", mood: "happy", badge: "✓", meta: `<span class="mm-stage">${nx ? `다음은 ${nx.n}단계 · ${esc(nx.title)}` : "마무리"}</span>`,
      title: "좋아요! 무엇부터 할지 순서를 정해 볼까요?", sub: "위아래 화살표로 순서를 바꾸고, 지금 안 해도 되는 일은 '나중에'로 미뤄 둬요. 꼭 할 일부터 하나씩 안내할게요.",
      body: todoList(true), acts: [{ label: "이 순서로 시작하기", act: "go", key: "Enter", pri: true }] };
    return { tone: "amber", mood: face()[0], badge: "!", meta, title: "이번 단계에서 한 일, 이해되셨나요?",
      sub: `잘 모르겠으면 헷갈린 곳을 골라 같이 풀어요. 몇 번이고 괜찮아요.${st.noCount ? ` (다시 물어본 횟수 ${st.noCount}번)` : ""}`,
      acts: [yes, no] };
  }
  // 가로 카드 하나 — 왼쪽 플로로, 오른쪽 [한마디 · 작은 줄 · 굵은 제목 · 설명 · 선택지 · 버튼]
  function card(v) {
    cardSay = v.say || "";
    for (const a of v.acts) if (a.key) deskKeys[a.key] = a;
    let opts = v.acts.filter(isOpt), rest = v.acts.filter((a) => !isOpt(a));
    // 선택지 뒤에 '나중에'만 남으면 같은 줄에 — 카드가 낮아진다
    if (opts.length && rest.every((a) => a.kind === "ghost")) { opts = opts.concat(rest); rest = []; }
    return `<section class="mc tone-${v.tone}">
      <div class="mc-cat">${petCat(v.mood, 108, v.extra)}${v.badge ? `<span class="mc-badge" aria-hidden="true">${v.badge}</span>` : ""}</div>
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
  // ── 레벨 오버레이 (claude-drafted: 2026-10-19 — 이재엽이 고른 목업 3번 level-overlay.html을 제품에 넣음: "작업하는것들을 가볍게 보이게만 …
  //    검은 사각형에서 작업들을 선택 … 단계가 레벨로 … 체력바는 경험치바로") — PC '이번 단계' 탭의 카드.
  //    왼쪽 플로로, 오른쪽에 [상자(지금 하는 일 — momentToday의 제목 · 설명 · 글 칸 · 선택지가 그대로 들어간다) · LV와 EXP 줄 · 명령 네 칸].
  //    명령을 고르면 상자 안에 '길'이 펼쳐진다 — 길마다 무슨 일이 생기는지(토큰 · 책갈피)를 먼저 보이고, 누르면 기존 동작(ACT)을 그대로 부른다.
  //    규칙은 안 바뀐다: LV = 지금 단계(코드가 정한다), EXP = 한 할 일 × 10, 다 차도 레벨은 '확인하고 넘어가기'(게이트 · 확인 질문)를 지나야 오른다(FR-4 · 목업 "정할 것" 1번은 그대로 둠).
  const XP_EACH = 10;
  const CMD = { work: ["맡기기", "살피기", "꺼내기", "쉬어 가기"], game: ["공격", "행동", "아이템", "자비"] };
  const CMD_IC = ["hand", "look", "bag", "moon"];
  const MOOD_WORD = { idle: "같이 보고 있어요", look: "귀 기울이는 중", think: "살펴보는 중", happy: "신났어요", done: "뿌듯해요", wow: "레벨 업!", sleep: "쉬는 중", love: "기분 좋아요", purr: "기분 좋아요", alert: "잠깐!", dozy: "졸려요" };
  const cmdWords = () => CMD[st.words] || CMD.work;
  const tokFmt = (n) => (n >= 10000 ? `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만` : n.toLocaleString());
  let lvPop = false;
  // Claude Code에서 온 마지막 알림 한두 줄 — 상자 아래
  const feedHtml = () => {
    const rows = st.alerts.slice(0, 2);
    if (!rows.length) return canLive ? `<div class="feed"><div><span class="dot wait"></span><b>Claude Code</b><span>알림을 기다리는 중</span></div></div>` : "";
    return `<div class="feed">${rows.map((a) => `<div><span class="dot"></span><b>${esc(toolName(a.tool))}</b><span>${esc(a.hidden ? "내용은 숨겼어요" : a.line || A.KIND[a.kind] || "")}</span><time>${clock(a.at)}</time></div>`).join("")}</div>`;
  };
  // 상자 — 지금 하는 일(momentToday · momentGate가 준 것을 그대로). 살피기 → '이 단계 할 일'을 고르면 할 일 목록을 같이 편다
  function momentBox(v) {
    let opts = v.acts.filter(isOpt), rest = v.acts.filter((a) => !isOpt(a));
    if (opts.length && rest.every((a) => a.kind === "ghost")) { opts = opts.concat(rest); rest = []; }
    return `${st.notice ? `<p class="mc-notice">${I.check}${esc(st.notice)}</p>` : ""}${v.banner ? `<p class="mc-hold">${esc(v.banner)}</p>` : ""}
      ${v.meta ? `<div class="mc-meta">${v.meta}</div>` : ""}<h2 class="say" aria-live="polite">${v.title}</h2>${v.sub ? `<p class="mc-sub">${v.sub}</p>` : ""}${v.body || ""}
      ${opts.length ? `<div class="opts">${opts.map(btn).join("")}</div>` : ""}${rest.length ? `<div class="acts">${rest.map(btn).join("")}</div>` : ""}${v.foot ? `<p class="mc-foot">${v.foot}</p>` : ""}
      ${st.showCrit && st.j && st.screen !== "gate" ? `<div class="critbox"><div class="row"><b class="grow">이 단계 할 일 ${met().length}개 · ${progress()}</b><button type="button" class="lnk" data-act="crit">접기</button></div>${critList(true)}</div>` : ""}
      ${st.screen === "gate" ? "" : feedHtml()}`;
  }
  // 명령마다 길 — {b: 이름, sm: 무슨 일이 생기나, act, i}. 누르면 기존 동작(ACT)을 그대로 부른다
  function pathsFor(c) {
    const j = st.j, n = j && j.next, live = st.mode === "live", tok = live ? "토큰 약 8,000" : "연습용 · 보내지 않아요";
    if (c === 0) {
      if (!j) return [{ b: "지금 만드는 걸 보여 주기", sm: "글 한 번 — 몇 단계인지 알려 줘요", act: "open-input" }, { b: "예시 글 넣기", sm: "연습용 예시 글을 넣기만 해요", act: "fill-example" }];
      if (holding()) return [{ b: "다시 이어 하기", sm: "멈춰 둔 확인을 다시 열어요", act: "hold-resume" }];
      if (allDone()) return [{ b: "확인하고 넘어가기", sm: `이해했는지 한 번 확인 → LV ${j.stage + 1}`, act: "gate" }];
      const out = [];
      if (n && !st.todos) { n.options.forEach((o, k) => out.push({ b: o, sm: k === 0 ? `${n.question} — 고르면 글에 적고 다시 살펴봐요 · ${tok}` : `고르면 글에 적고 다시 살펴봐요 · ${tok}`, act: "pick-opt", i: k })); out.push({ b: "직접 쓸게요", sm: "선택지에 없으면 한 줄로", act: "own" }); }
      out.push({ b: "바뀐 작업 보여 주기", sm: `AI 코딩 도구에서 한 것을 붙여 넣고 다시 살펴봐요 · ${tok}`, act: "open-input" });
      if (live && canLive) out.push({ b: st.auto ? "자동으로 살펴보기 끄기" : "자동으로 살펴보기 켜기", sm: "AI 코딩 도구가 일을 마칠 때마다 저절로 · 그때마다 토큰", act: "auto-toggle" });
      return out;
    }
    if (c === 1) {
      const out = [];
      if (j) out.push({ b: `이 단계 할 일 ${met().length}개`, sm: `${metCount()}개 했어요 · 용어는 눌러서 풀이`, act: "crit-box" });
      if (st.text.trim() || st.judged) out.push({ b: "어디쯤인지 보기", sm: live ? `보여 준 글을 AI(Claude)가 봐요 · ${tok}` : "연습용 예시로 봐요", act: "judge" });
      if (j && stage().doc) out.push({ b: `${stage().doc} · 책에서`, sm: docDone(j.stage) ? "확정함 — 다시 보기 · 고쳐 쓰기" : "초안 받기 → 고치기 → 확정", act: "lib-doc-now" });
      out.push({ b: "단계 지도", sm: "여덟 단계 중 어디까지 왔나", act: "tab", i: 1 });
      return out;
    }
    if (c === 2) return [
      ...(st.mode === "fixture" ? stageExamples().map((e) => ({ b: e.label, sm: "연습 장면 — 미리 써 둔 글", act: "ex", i: S.examples.indexOf(e) })) : []),
      { b: "도서관 · 내 책", sm: "열어 둔 책 · 단계 문서 · 서고", act: "tab", i: 2 },
      { b: END.more, sm: "서고로 내려가요 — 엮은 책 · 예시 책이 꽂혀 있어요", act: "lib-enter" },
      { b: "느낀 점 남기기", sm: "쓰다가 걸린 것 한 줄 · Jira용 복사", act: "notes-open" }];
    return [{ b: "접기", sm: "띠로 작게 — 마우스를 올리면 나와요", act: "fold" },
      ...(j && nextStage() ? [{ b: "다음 레벨 미리 보기", sm: `LV ${j.stage + 1} ${nextStage().title}`, act: "peek" }] : []),
      ...(st.mode === "fixture" ? [{ b: RESTART.label, sm: "연습용 예시 처음 장면 · 기록은 그대로", act: RESTART.act }] : []),
      { b: "설정", sm: "보기 방식 · 연결 · 버튼 말 · 느낀 점", act: "settings" }];
  }
  const pathsBox = (c) => `<p class="say">${esc(cmdWords()[c])} — 어느 길로 갈까요?</p><div class="paths" role="group" aria-label="${esc(cmdWords()[c])}">${pathsFor(c).map((p, i) =>
    `<button type="button" class="path" data-act="path" data-i="${i}"><span class="h">${I.arrow}</span><b>${esc(p.b)}</b><small>${esc(p.sm)}</small></button>`).join("")}</div><p class="hint">Esc 뒤로 · 1~4 다른 칸</p>`;
  // 레벨 오버레이 카드 — v는 momentToday()/momentGate()가 준 것(글은 이미 esc 한 것)
  function levelCard(v) {
    cardSay = v.say || "";
    for (const a of v.acts) if (a.key) deskKeys[a.key] = a;
    const inGate = st.screen === "gate", locked = st.busy || !!st.warn || !!st.error || inGate || !!st.ping;
    const s = st.j && stage(), n = st.j ? met().length : 0, done = st.j ? metCount() : 0, max = Math.max(1, n) * XP_EACH, xp = done * XP_EACH;
    if (!locked) { for (let i = 0; i < 4; i++) deskKeys[String(i + 1)] = { act: "cmd", i }; }
    if (st.cmd !== null) deskKeys.Escape = { act: "cmd-close" };
    const ticks = Array.from({ length: Math.max(0, n - 1) }, (_, k) => `<span class="tick" style="left:${((k + 1) / n) * 100}%"></span>`).join("");
    const stats = st.j ? `<div class="stats"><span class="me">나</span><span class="lv"><b class="${lvPop ? "pop" : ""}">LV ${st.j.stage}</b><span>${esc(s.short)}</span></span>
        <span class="xp-l">EXP</span><span class="xp${done === n ? " full" : ""}" role="progressbar" aria-label="경험치" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${xp}"><i style="width:${(xp / max) * 100}%"></i>${ticks}</span><span class="xp-n">${xp} / ${max}</span>
        <span class="chip" style="margin-left:auto">책갈피 <b>${st.learned.length}</b></span>${st.tokens ? `<span class="chip">토큰 <b>${tokFmt(st.tokens)}</b></span>` : ""}</div>` : "";
    const cmds = `<div class="cmds" role="group" aria-label="할 일 고르기">${cmdWords().map((w, i) => `<button type="button" class="cmd${st.cmd === i ? " sel" : ""}" data-act="cmd" data-i="${i}" aria-pressed="${st.cmd === i}" ${locked ? "disabled" : ""}><span class="ic">${I[CMD_IC[i]]}</span><span>${esc(w)}</span><kbd>${i + 1}</kbd></button>`).join("")}</div>`;
    const box = st.cmd !== null && !locked ? pathsBox(st.cmd) : momentBox(v);
    return `<section class="mc lvc tone-${v.tone}"><div class="who">${petCat(v.mood, 150, v.extra)}${v.badge ? `<span class="mc-badge" aria-hidden="true">${v.badge}</span>` : ""}<span class="mood">${esc(MOOD_WORD[v.mood] || "")}</span></div>
      <div class="main"><div class="box">${box}</div>${stats}${cmds}</div></section>`;
  }

  // 단계 문서 — 왼쪽 플로로와 버튼, 오른쪽 글. 초안은 AI가 먼저, 고치는 건 사용자, 다시 봐 주는 건 AI, 확정은 사용자만. 2026-10-20(C-16): 도서관의 책 안에서 연다(deskLib → bookDocs)
  const docShell = (mood, say, side, main) => `<div class="docx"><div class="doc-side">${petCat(mood, 92)}<p class="doc-say">${esc(say)}</p>
    <div class="doc-acts">${side}</div></div><div class="doc-main">${main}</div></div>`;
  // 지금 여는 단계 문서의 단계 — 책 안에서 고른 단계(libDoc), 아니면 지금 단계
  const docStage = () => (Number.isInteger(st.libDoc) ? N.STAGES[st.libDoc] : stage());
  function deskDoc(s = st.j && docStage()) {
    if (!s) return docShell("idle", DOC.first, `<button class="b pri" data-act="tab" data-i="0">'이번 단계'로 가기</button>`,
      `<div class="doc-empty">${I.doc}<b>아직 단계 문서가 없어요</b><span>어디쯤인지 보고 나면, 그 단계에 맞는 문서를 같이 만들어요.</span></div>`);
    const { done, d, face: [mood, say] } = docState(s);
    if (!s.doc) return docShell(mood, say, "", `<div class="doc-empty">${I.doc}<b>${s.n}단계는 문서 없이 진행해요</b><span>${DOC.none}</span></div>`);
    if (!d && done) return docShell(mood, say, `<span class="meta">${esc(done.at)}에 직접 확정했어요</span><button class="b" data-act="reopen-doc">고쳐 쓰기</button>`,
      `<div class="doc-head"><h3>${esc(s.doc)}</h3><span class="okchip">${I.check}확정함</span></div><pre class="doc-view">${esc(done.text)}</pre>`);
    if (!d) return docShell(mood, say, `<button class="b pri" data-act="draft" ${st.busy ? "disabled" : ""}>초안 받기</button>${
      st.mode === "live" ? `<span class="meta">작업 글이 AI(Claude)에게 보내져요.</span>` : ""}`,
      `${docNotes()}<div class="doc-empty">${I.doc}<b>${esc(s.doc)}</b><span>${DOC.draft}</span></div>`);
    const ready = d.review && d.review.ready;
    return docShell(mood, say, `<span class="meta" data-blanks>${blankMeta(d)}</span>
        <button class="b ${ready ? "" : "pri"}" data-act="review" ${st.busy ? "disabled" : ""}>다시 봐 주세요</button>
        <button class="b ${ready ? "pri" : ""}" data-act="confirm-doc">${ready ? "이걸로 확정할게요" : "이대로 확정"}</button>
        <span class="meta">고칠 곳만 알려 드려요. 대신 고쳐 쓰지는 않아요.</span>`,
      `<div class="doc-head"><h3>${esc(s.doc)}</h3><span class="meta">${s.n}단계</span></div><textarea class="doc" data-act="doc" aria-label="단계 문서">${esc(d.text)}</textarea>${reviewList(d.review)}${docNotes()}`);
  }
  // 단계 지도 — 여덟 단계를 한 줄로. 플로로는 지금 단계 위에 앉아 있다. 누르면 그 단계를 자세히 본다
  function deskMap() {
    const cur = st.j ? st.j.stage : -1, sel = st.mapSel ?? Math.max(cur, 0), s = N.STAGES[sel];
    const track = N.STAGES.map((x) => { const c = stepClass(x.n); return `<li class="node ${c}${x.n === sel ? " sel" : ""}">
      <button data-act="map-sel" data-i="${x.n}" aria-pressed="${x.n === sel}" aria-label="${x.n}단계 ${esc(x.title)}">${
        x.n === cur ? `<span class="perch">${cat(liveMood("happy"), 34, { paws: true, noTail: true })}</span>` : ""}
        <span class="dot">${c === "done" ? I.check : x.n}</span><span class="nm">${esc(x.short)}</span></button></li>`; }).join("");
    const crit = (sel === cur ? st.j.criteria : crits(sel)).map((c) => ckItem(sel < cur || (sel === cur && c.met), esc(c.text) + termTag(c.term))).join("");
    const where = sel < cur ? `<span class="okchip">${I.check}마친 단계</span>` : sel === cur ? `<span class="nowchip">지금 여기 · ${progress()}</span>` : `<span class="meta">아직 안 온 단계</span>`;
    return `<div class="map"><ol class="track" aria-label="여덟 단계">${track}</ol>
      <div class="map-detail"><div class="md-head"><h3>${s.n}단계 · ${esc(s.title)}</h3>${where}</div>
        <p class="mc-sub">${esc(s.does)}</p>
        <span class="flowline"><span>받은 것 · ${esc(s.gets)}</span>${I.arrow}<span>만든 것 · ${esc(gv(s))}</span>${s.doc ? `<span class="meta">단계 문서: ${esc(s.doc)}</span>` : ""}</span>
        <ul class="crit">${crit}</ul>${docDone(sel) ? `<details><summary>확정한 문서 보기 · ${esc(docDone(sel).at)}</summary><pre class="doc-view">${esc(docDone(sel).text)}</pre></details>` : ""}</div></div>`;
  }
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
  const coverBtn = (b, i) => `<button class="cover${isEx(b) ? " ex" : ""}" style="--tone:${b.tone}" data-act="lib-book" data-i="${i}" data-id="${b.id}" aria-label="${esc(b.title)}${isEx(b) ? " (예시 책)" : ""}, ${b.stage}단계 ${esc(L().STAGES[b.stage])}, 책갈피 ${b.bookmarks.length}장">
    <span class="t">${esc(b.title)}</span><span class="s">${b.mine ? "이 화면 · " : ""}${b.stage}단계 · ${esc(L().STAGES[b.stage])}</span>
    <span class="m"><span>▮ ${b.bookmarks.length}장</span>${isEx(b) ? '<span class="extag">예시</span>' : ""}${bookDone(b) ? '<span class="due ok">완주 · 엮기 대기</span>' : dueChip(b.dues && b.dues[b.stage])}</span></button>`;
  // 예시 책 지우기 / 다시 보기 — 지울 예시가 있을 때만, 다시 보기는 지운 뒤에만
  const exToggle = () => (!M ? "" : exHidden ? `<button class="b ghost" data-act="ex-show">예시 책 다시 보기</button>` : hasExamples() ? `<button class="b ghost" data-act="ex-hide" title="예시(더미) 책 · 레퍼런스를 숨기고 내 기록만 봐요">예시 책 지우기</button>` : "");
  function deskLib() {
    if (!L() || !SCH()) return libMissing();
    const books = openBooks(), b = libSelected();
    if (!b) return `<div class="libtab"><div class="ob-body"><div class="who">${petCat(books.length ? "idle" : "sleep", 100)}</div><div>
        <div class="ob-say">열어 둔 책 ${books.length}권${exHidden ? " · 내 기록만" : ""}</div>
        <p class="ob-title">${books.length ? "어떤 책을 볼까요?" : exHidden && !st.j ? "아직 책이 없어요" : "열어 둔 책을 모두 서고에 꽂았어요"}</p>
        ${books.length ? `<div class="shelf4">${books.map(coverBtn).join("")}</div>` : `<p class="mc-sub">${exHidden && !st.j ? "'이번 단계'에서 지금 만드는 걸 보여 주면 내 책이 생겨요." : "새로 시작하면 여기에 책이 생겨요. 지난 책은 서고에서 다시 펼칠 수 있어요."}</p>`}</div></div>
      <div class="ob-foot">${exToggle()}<span class="grow"></span>
        <button class="enter-lib" data-act="lib-enter"><span class="mb"></span>내 서고 들어가기</button></div></div>`;
    const fin = bookDone(b);
    // 책 안의 단계 문서(C-16) — 하나를 열면 그 자리에서 초안 · 고치기 · 다시 봐 줌 · 확정
    if (b.mine && Number.isInteger(st.libDoc) && N.STAGES[st.libDoc]) {
      deskKeys.Escape = { act: "lib-doc-close" };
      const s = N.STAGES[st.libDoc];
      return `<div class="libtab"><div class="row bdoc-head"><button type="button" class="b" data-act="lib-doc-close">‹ 책으로${kbd("Escape")}</button><b class="grow">${esc(b.title)} · ${s.n}단계 ${esc(s.doc || "")}</b>${
        st.j && s.n > st.j.stage ? `<span class="meta">아직 안 온 단계예요 — 지금은 ${st.j.stage}단계</span>` : ""}</div>${deskDoc(s)}</div>`;
    }
    deskKeys.Escape = { act: "lib-close" };
    deskKeys.Enter = { act: st.libConfirm ? "lib-shelve" : fin ? "lib-bind" : "lib-shelve-ask" };
    return `<div class="libtab"><div class="minispread" data-spread>
        <section><div class="stg">${fin ? "돌아보기까지 끝" : `지금 ${b.stage}단계 · ${esc(L().STAGES[b.stage])}`}${b.mine ? " · 이 화면의 프로젝트" : isEx(b) ? " · 예시 책" : ""}</div><h3>${esc(b.title)}</h3>
          <div class="stg soft">이 세션에서 정한 것</div><ul>${b.decided.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></section>
        <section><div class="stg">꽂은 책갈피 ${b.bookmarks.length}장</div><h3>배운 것</h3>
          <div class="marks">${b.bookmarks.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
          <div class="stg soft" style="margin-top:12px">마지막으로 연 때 · ${esc(b.updated)}</div></section></div>
      ${b.mine ? bookDocs() : ""}
      ${st.libConfirm ? `<div class="confirm" role="alertdialog" aria-label="서고에 보관 확인">${cat("think", 34)}<span><b>‘${esc(b.title)}’</b>을 서고에 보관할까요? 언제든 다시 꺼내 펼칠 수 있어요.</span><span class="grow"></span>
          <button class="b pri" data-act="lib-shelve">보관하기${kbd("Enter")}</button><button class="b" data-act="lib-shelve-no">그대로 두기</button></div>`
        : `<div class="ob-foot"><button class="b" data-act="lib-close">‹ 목록으로${kbd("Escape")}</button>
          ${fin ? `<button class="b pri" data-act="lib-bind">📖 한 권으로 엮어 서고에 꽂기${kbd("Enter")}</button>` : `<button class="b pri" data-act="lib-shelve-ask">서고에 보관하기${kbd("Enter")}</button>`}</div>`}</div>`;
  }
  // 책 안의 단계 문서 목록(C-16) — 단계마다 문서 이름 · 상태(아직 · 초안 · 다시 봐 줌 · 확정). 받은 먹이(C-15)도 여기에
  const docStatus = (n) => (docDone(n) ? "확정" : st.doc && st.doc.stage === n ? (st.doc.review ? "다시 봐 줌" : "초안") : "아직");
  function bookDocs() {
    const cur = st.j ? st.j.stage : -1;
    const rows = N.STAGES.filter((s) => s.doc).map((s) => { const stt = docStatus(s.n);
      return `<button type="button" class="bdoc${stt === "확정" ? " ok" : ""}${s.n === cur ? " cur" : ""}" data-act="lib-doc" data-i="${s.n}" aria-label="${s.n}단계 ${esc(s.doc)} — ${stt}">
        <span class="n">${s.n}</span><span class="t"><b>${esc(s.doc)}</b><small>${stt}${s.n === cur ? " · 지금 단계" : s.n > cur ? " · 아직 안 온 단계" : ""}</small></span></button>`; }).join("");
    const fed = st.fed.length ? `<div class="stg soft" style="margin-top:10px">받은 먹이 ${st.fed.length}번</div><ul class="fedlist">${st.fed.slice(0, 3).map((f) =>
      `<li>${esc(f.topics.join(" · ") || "(빠진 구간뿐)")}${f.left.length ? ` <small>· ${f.left.length}구간 뺌</small>` : ""}${f.example ? " <small>· 예시</small>" : ""}</li>`).join("")}</ul>` : "";
    return `<section class="bdocs"><div class="stg">단계 문서 — 들어가서 확인하고 작업해요</div><div class="bdoc-grid">${rows}</div>${fed}</section>`;
  }
  // 이번 단계 카드에서 '단계 문서'를 누르면 — 도서관 탭 · 내 책(없으면 첫 책) · 그 단계 문서를 연다
  function openBookDoc(n) {
    const b = openBooks().find((x) => x.mine) || openBooks()[0];
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
    if (st.sound) C.chime("level");
    setTimeout(open, 950);
  }
  // 내 서고 들어가기 — 오버레이가 화면 가득 물속이 되고, 책을 안은 플로로가 내려간 뒤 서고가 물속에서 떠오른다(dive.js, 목업 영상 24~28초)
  // then: 서고에 올라온 뒤 열 장면 이름(#lib-dive-<then>). iPhone은 물속 없이 바로 #lib-<then>으로
  function enterLibrary(then = "") {
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
  // 위쪽 아이콘 줄 — 이번 단계·설계도·단계 지도·도서관 | 연결·프로젝트·설정·열어 두기·접기
  // (2026-10-18 임유정 요청: 보기 방식 표시·친해진 정도 하트를 뺐다 — 보기 방식은 설정에 남는다)
  // 아이콘을 누르면 고른 동그라미(.ti-ind)가 지난 아이콘에서 새 아이콘으로 미끄러지고, 내용은 그쪽 방향에서 들어온다(renderDesk).
  // 누른 뒤 곧바로 한 번 더 그려지는 일이 있어서, 움직임은 시작한 때(tabMove.at)를 기억해 다시 그려도 이어서 움직인다
  let tabFrom = null, tabMove = null;
  const tabIdx = () => TABS.findIndex((x) => x[0] === st.tab);
  // 위쪽 제목 — '이번 단계' 탭이면 지금 단계 이름("0단계 · 무엇을 만들지 정하기"), 다른 탭은 탭 이름 (2026-10-18 임유정 요청)
  const tabTitle = (tab) => (tab[0] === "today" && st.j && !st.finished ? `${stage().n}단계 · ${stage().title}` : tab[1]);
  // 집 단추(C-13) — 맨 왼쪽. 기본 화면에서는 눌린 모양, 바이브 코딩 모드에서는 누르면 기본 화면으로
  const homeBtn = (on) => `<button class="ti home" data-act="base" aria-pressed="${on}" aria-label="기본 화면" title="기본 화면 — 바이브 코딩 · 서재 · 알림 · AI 진행">${I.home}</button>`;
  // 오른쪽 — 연결 표시 · 프로젝트 · 모아 보기 · 설정 · 열어 두기 · 접기(두 모드가 같다)
  const tbRight = () => `${st.unplug && canLive ? `<span class="led off" title="연결 끊음 — 작업 알림을 받지 않아요. 설정에서 다시 연결해요"></span>`
        : st.feed.at ? `<span class="led on" title="${toolName(st.feed.tool)}와 연결됨 · 마지막 알림 ${ago(st.feed.at)}"></span>` : ""}
      ${project() ? `<span class="tb-proj" title="지금 보고 있는 프로젝트">${esc(project())}</span>` : ""}
      <button class="ti" data-act="hub" aria-label="모아 보기" title="모아 보기 — 바이브 코딩 · 알림 · AI 진행">${I.grid}</button>
      <button class="ti" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 — 보기 방식, 연결, 소리, 기록">${I.gear}</button>
      <button class="ti" data-act="pin" aria-pressed="${st.userPin}" aria-label="열어 두기" title="열어 두기 — 저절로 접히지 않아요">${I.pin}</button>
      <button class="ti" data-act="fold" aria-label="접기" title="접기 (Esc)">${I.up}</button></div>`;
  function topbar() {
    if (st.place === "base") return `<div class="tb">${homeBtn(true)}<span class="tb-tab">Floe</span><span class="grow"></span>${tbRight()}`;
    const tab = TABS.find((x) => x[0] === st.tab);
    return `<div class="tb">${homeBtn(false)}<div class="tabs" role="tablist" aria-label="보기"><span class="ti-ind" style="--i:${tabIdx()}" aria-hidden="true"></span>${TABS.map(([id, label, , ic], i) =>
      `<button class="ti" role="tab" data-act="tab" data-i="${i}" data-tab="${id}" aria-selected="${st.tab === id}" aria-label="${label}" title="${label}">${I[ic]}</button>`).join("")}</div>
      <span class="tb-tab">${esc(tabTitle(tab))}</span><span class="grow"></span>${tbRight()}`;
  }
  const X_ICON = icon('<path d="M6 6l12 12M18 6L6 18"></path>', 16);
  const settingsPop = () => (st.settings ? `<div class="pop" role="dialog" aria-label="설정"><div class="pop-h"><b>설정</b><span class="grow"></span><button type="button" class="ti" data-act="settings" aria-label="설정 닫기" title="닫기 (Esc)">${X_ICON}</button></div>${settingsBody()}</div>` : "");
  const countdownOn = () => st.ui === "home" && !hovering && !pinned() && !!timer;
  const countdown = () => (countdownOn() ? `<div class="cd" title="곧 접혀요 — 핀을 누르면 열어 둬요"><i style="animation-duration:${DELAY.home}ms;animation-delay:-${Date.now() - idleAt}ms"></i></div>` : "");
  // 한 줄 — 플로로가 앞지느러미를 걸치고 있다. 알릴 일이 있으면 파란 테두리로 살짝 흔든다
  function pillHTML() {
    const s = st.j && stage();
    let main;
    if (st.ping) main = `<b>${esc(pingHead())}</b><span class="pl-cta">볼까요?</span>`;
    else if (st.busy) main = `<b>살펴보는 중이에요</b>${dots}`;
    else if (st.warn) main = `<b>보내기 전에 잠깐!</b><span class="pl-cta">눌러서 보기</span>`;
    else if (st.finished) main = `<b>모든 단계를 마쳤어요</b>`;
    else if (!s) main = `<b>플로로</b><span class="pl-now">눌러서 지금 만드는 걸 보여 주세요</span>`;
    else if (holding() && st.screen !== "gate") main = `<b>${s.n}단계 · 보류 중</b><span class="pl-now">${esc(U.holdLine(st.hold, ymd()).replace(/^보류 중 · /, ""))}</span>`;
    else main = `<b>${allDone() ? "다 했어요! · " : ""}${s.n}단계</b>${mini()}<span class="pl-now">${st.screen === "gate" ? "넘어가기 전 확인 중" : `지금: ${esc(tick().now)}`}</span>`;
    const base = st.ping ? "look" : face()[0];
    return `<button class="pill${st.ping || st.warn ? " ping" : ""}" data-act="pill" aria-expanded="false" aria-label="플로로 펼치기 · ${esc(stateWords())}">
      <span class="pet" data-pet data-live data-base="${base}">${cat(liveMood(base), 36, { face: true })}</span>${main}${modeChip()}${connLed()}</button>`;
  }
  // 접혀 있을 때도 보이는 작은 표시(시연 안전장치) — 연습인지 진짜 AI인지, Claude Code·Codex와 연결됐는지
  const conn = () => (!canLive ? "" : st.unplug ? "off" : st.feed.at ? "on" : "wait");
  const CONN_WORD = { on: "연결됨", off: "연결 끊음", wait: "알림 기다리는 중" };
  const stateWords = () => [st.mode === "live" ? "진짜 AI" : "연습용 예시", CONN_WORD[conn()]].filter(Boolean).join(" · ");
  const modeChip = () => `<span class="pl-mode ${st.mode}" title="${st.mode === "live" ? "보여 주신 글을 진짜 AI(Claude)가 읽어요" : "미리 만들어 둔 응답으로 움직여요 — 진짜 AI가 아니에요"}">${st.mode === "live" ? "진짜 AI" : "연습"}</span>`;
  const connLed = () => (conn() ? `<span class="led ${conn() === "on" ? "on" : conn()}" title="${CONN_WORD[conn()]}"></span>` : "");
  // 띠 — 물결 선 위로 얼굴 위쪽만 빼꼼. 마우스를 올리면 한 줄로 나온다. 졸면 body.dozing으로 눈을 감는다(app.css)
  const WAVE = `<svg class="wl" viewBox="0 0 150 12" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="strip-wl" x2="1"><stop offset="0" stop-color="#A9DDFF" stop-opacity="0"></stop><stop offset=".5" stop-color="#A9DDFF" stop-opacity=".9"></stop><stop offset="1" stop-color="#A9DDFF" stop-opacity="0"></stop></linearGradient></defs>
    <path d="M6 5 Q40 2 75 5 Q110 8 144 5" fill="none" stroke="url(#strip-wl)" stroke-width="2" stroke-linecap="round"></path><path d="M40 9 Q58 7.5 72 9 M84 9.5 Q98 8 112 9.5" fill="none" stroke="#A9DDFF" stroke-width="1" opacity=".45" stroke-linecap="round"></path></svg>`;
  const stripHTML = () => `<button class="strip" data-act="strip" aria-label="플로로 부르기 · ${esc(stateWords())}" title="마우스를 올리면 나와요 · ${esc(stateWords())}"><span class="head" aria-hidden="true">${cat("idle", 58, { face: true })}</span>${WAVE}<span class="zz" aria-hidden="true">z<b>z</b></span>
    <span class="st-mode ${st.mode}${conn() === "off" ? " off" : ""}" aria-hidden="true">${st.mode === "live" ? "진짜 AI" : "연습"}${conn() === "off" ? " · 끊음" : ""}</span></button>`;
  // 켤 때 인사의 물결 선(C-10) — 띠(stripHTML)의 WAVE와 같은 선을 pathLength로 그어 그려지게 한다(app.css .greet-wl)
  const GREET_WAVE = () => WAVE.replace('class="wl"', 'class="wl greet-wl"').replace(/<path /g, '<path pathLength="100" ');
  function greetHTML(enter) {
    deskKeys = { Enter: { act: "open" } };
    const greeting = document.documentElement.classList.contains("greeting");
    cardSay = greeting ? "" : C.greeting(new Date().getHours());   // 인사 움직임 중에는 hello 단계에서 말한다
    return `<div class="isl greet${enter}">${greeting ? GREET_WAVE() : ""}<section class="mc tone-blue"><div class="mc-cat">${petCat("happy", 116)}</div>
      <div class="mc-main">
        <h2 class="mc-title">${st.back ? "다시 오셨네요!" : "안녕하세요! 저는 길잡이 물범 플로로예요."}</h2>
        <p class="mc-sub">${st.back ? esc(st.back) : "지금 만들고 있는 걸 보여 주시면, 몇 단계쯤인지와 다음에 할 일을 알려 드려요. 평소엔 화면 위에 작게 있을게요."}</p>
        <div class="acts"><button class="b pri" data-act="open">${st.back ? "이어서 하기" : "보여 주기"}<kbd aria-hidden="true">Enter</kbd></button>
          <span class="hint">${I.bubble}${st.pets ? `우리는 ${esc(C.bond(st.pets).name)}예요` : "플로로를 눌러 쓰다듬어 보세요"}</span></div></div></section></div>`;
  }
  // ── 기본 화면(C-13, 2026-10-20 — 이재엽 "버튼식으로 준비가 되어있는 공간이 기본값") — 플로로와 지금 한 줄, 단추 넷. 알림 · AI 진행은 섬 안에서 바로(모아 보기 창의 순수 함수 FloeHub 그대로) ──
  let aiSessions = [], aiMode = "none", aiLatest = 0;   // AI 진행(C-12)의 세션 · 어디서 왔나(none · example · live) · 마지막 번호
  const aiLast = () => { let best = null; for (const s of aiSessions) for (const x of s.steps || []) if (!best || (x.at || 0) > (best.at || 0)) best = { ...x, project: s.project }; return best; };
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
  const working = () => (HUB ? HUB.anyWorking(aiSessions) : false);
  // 단추 넷 — [할 일, 이름, 한 줄, 아이콘]. 1~4 키
  const BASE_BTNS = [["go-vibe", "바이브 코딩", "단계마다 길 안내", "today"], ["lib-enter", "서재", "끝낸 책 · 서고", "lib"], ["base-alerts", "알림", "AI 코딩 도구가 보낸 것", "bubble"], ["base-ai", "AI 진행", "Claude Code가 한 일", "look"]];
  function baseBody() {
    if (st.pane) return basePane(st.pane);
    BASE_BTNS.forEach(([act], i) => { deskKeys[String(i + 1)] = { act }; });
    const mark = (act) => (act === "base-alerts" && unreadN() ? `<span class="cnt" aria-label="읽지 않은 알림 ${unreadN()}개">${unreadN()}</span>`
      : act === "base-ai" && working() ? `<i class="dot" title="일하는 중"></i>` : "");
    return `<section class="mc base tone-blue"><div class="who">${petCat("happy", 116)}</div>
      <div class="main"><div class="box"><span class="kicker">지금</span><p class="say now-line">${esc(nowLine())}</p></div>
      <div class="grid4" role="group" aria-label="무엇을 할까요">${BASE_BTNS.map(([act, label, sub, ic], i) => `<button type="button" class="bb" data-act="${act}"><span class="ic">${I[ic]}</span><span class="t"><b>${esc(label)}${mark(act)}</b><small>${esc(sub)}</small></span><kbd aria-hidden="true">${i + 1}</kbd></button>`).join("")}</div></div></section>`;
  }
  // 알림 판 · AI 진행 판 — 왼쪽: 플로로 · 프로젝트 · 도구 이름 · (AI 진행) 상태와 한 일의 종류별 수, 오른쪽: 줄 목록(모아 보기 창과 같은 글 · 같은 기록). 집(또는 '단추로')으로 돌아온다.
  //   AI 진행은 C-12 규칙 그대로 — 파일 이름 · 첫 줄 · 줄 수뿐, 파일 내용은 받지도 보이지도 않는다
  const PANE = { alerts: ["알림", "AI 코딩 도구가 보낸 알림이에요 — 새것이 위예요"], ai: ["AI 진행", "Claude Code가 한 일을 한 줄씩 — 파일 내용은 받지 않아요"] };
  function basePane(kind) {
    deskKeys.Escape = { act: "base-back" };
    const now = Date.now(), [title, lead] = PANE[kind] || PANE.alerts;
    const last = kind === "ai" ? [...aiSessions].sort((a, b) => (b.at || 0) - (a.at || 0))[0] : null;
    const tool = toolName(kind === "ai" ? (last && last.tool) || "claude" : st.feed.tool || (st.alerts[0] && st.alerts[0].tool));
    const proj = kind === "ai" && last ? last.project : project();
    const counts = kind === "ai" && last ? Object.entries((last.steps || []).reduce((m, s) => { m[s.verb || ""] = (m[s.verb || ""] || 0) + 1; return m; }, {})) : [];
    const body = !HUB ? `<p class="empty">아직 준비 중이에요</p>` : kind === "ai" ? HUB.aiHTML(aiSessions, aiMode, STEPS, now) : HUB.alertsHTML(st.alerts, now);
    return `<section class="mc base pane tone-gray"><div class="who">${petCat("look", 92)}<b class="pj">${esc(proj || "프로젝트")}</b><span class="tl">${esc(tool)}</span>${
        kind === "ai" && last && HUB && HUB.STATE_WORD[last.state] ? `<span class="st ${esc(last.state)}">${esc(HUB.STATE_WORD[last.state])}</span>` : ""}${
        counts.length ? `<ul class="verbs">${counts.map(([v, n]) => `<li><span>${esc(v)}</span><b>${n}</b></li>`).join("")}</ul>` : ""}</div>
      <div class="main"><div class="row ph"><button type="button" class="lnk" data-act="base-back" title="단추로 돌아가기 (Esc)">${I.back}단추로</button><b class="grow">${esc(title)}</b>
        <button type="button" class="btn" data-act="hub-${kind}" title="모아 보기 창에서 크게 봐요">크게 보기</button></div><p class="meta">${esc(lead)}</p><div class="pane-body">${body}</div></div></section>`;
  }
  function islandHTML(enter) {
    let body;
    if (st.place === "base") body = baseBody();
    else if (st.tab === "doc") body = deskDoc();
    else if (st.tab === "map") body = deskMap();
    else if (st.tab === "lib") body = deskLib();
    else body = levelCard(momentToday());   // 레벨 오버레이(2026-10-19) — 옛 가로 카드(card)는 쓰지 않는다
    return `<div class="isl${enter}">${topbar()}<div class="isl-body">${body}</div>${countdown()}</div>${settingsPop()}`;
  }
  // ── 섬의 움직임(C-14, 2026-10-20 — 규칙 · 숫자는 morph.js) ──
  // 바탕(배경 · 그림자)을 가진 요소 — 섬(.isl) · 한 줄(.pill) · 띠(.strip — 바탕 없음)
  const shapeEl = () => { const el = $nav.querySelector(":scope > :not(.shell)"); return el ? (el.classList.contains("isl") ? el : el.querySelector(".pill, .strip") || el) : null; };
  const opaque = (c) => !!c && c !== "transparent" && !/^rgba\([^)]*,\s*0\)$/.test(c);
  // 갈아 끼우기 전의 상자 — 자리 · 크기 · 바탕색 · 모서리 · 그림자
  function snapShape() {
    const el = shapeEl(); if (!el) return null;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height, bg: cs.backgroundColor, shadow: cs.boxShadow } : null;
  }
  // 모양이 바뀌면(띠 ↔ 한 줄 ↔ 펼침) 바탕 껍데기(.shell)가 처음 상자에서 끝 상자로 늘어나고 줄어든다(FLIP — transform · opacity만, 합성만으로 돈다).
  // 그동안 새 모양의 바탕은 숨기고(.morph-bg) 내용은 바탕이 reveal만큼 자란 뒤 나타난다. 줄어들 때는 움직임이 끝난 뒤 창을 줄인다(morphHold → measureSize).
  // 켤 때 인사 · 잠수 · 떠오름 · 움직임 줄이기 · 휴대폰에서는 하지 않는다(그쪽은 저마다의 움직임이 있다)
  let morphHold = false, morphShell = null;
  function morphFrom(prev) {
    const h = document.documentElement, el = shapeEl();
    if (!MO || !el || !el.animate || STILL || isPhone() || greetSkip || h.classList.contains("greeting") || h.classList.contains("surfacing") || h.classList.contains("diving")) return;
    const to = el.getBoundingClientRect(); if (!to.width || !to.height) return;
    const p = MO.plan({ w: prev.w, h: prev.h }, { w: to.width, h: to.height }, { still: STILL });
    if (!p.ms) return;
    const f = MO.flip(prev, { x: to.left, y: to.top, w: to.width, h: to.height }), cs = getComputedStyle(el), nr = $nav.getBoundingClientRect();
    if (morphShell) morphShell.remove();
    const shell = morphShell = document.createElement("div");
    shell.className = "shell"; shell.setAttribute("aria-hidden", "true");
    const fromOn = opaque(prev.bg), toOn = opaque(cs.backgroundColor);
    shell.style.cssText = `left:${to.left - nr.left}px;top:${to.top - nr.top}px;width:${to.width}px;height:${to.height}px;border-radius:${cs.borderRadius};background:${toOn ? cs.backgroundColor : prev.bg};box-shadow:${toOn ? cs.boxShadow : prev.shadow}`;
    $nav.prepend(shell);
    el.classList.add("morph-bg");
    morphHold = p.order === "animate-then-resize";
    const a = shell.animate([{ transform: `translate(${f.dx}px,${f.dy}px) scale(${f.sx},${f.sy})`, opacity: fromOn ? 1 : 0 }, { transform: "none", opacity: toOn ? 1 : 0 }], { duration: p.ms, easing: p.easing, fill: "both" });
    shell.nextElementSibling?.animate([{ opacity: 0 }, { opacity: 0, offset: p.reveal || 0.5 }, { opacity: 1 }], { duration: p.ms, easing: "ease-out", fill: "both" });
    // 마지막 움직임만 미룸을 푼다(F-38, PR #139 리뷰) — 펼치기가 끝나기 전에 접기를 시작하면 펼치기의 done이 접기의 미룸을 풀어 창이 움직임보다 먼저 줄어들었다
    const done = () => { const last = morphShell === shell; if (last) morphShell = null; shell.remove(); el.classList.remove("morph-bg"); if (last && morphHold) { morphHold = false; lastSize = ""; queueSize(); } };
    a.finished.then(done, done);
  }
  // 접힌 한 줄에 마우스를 올리면 살짝 커진다(세로 +6 · 가로 +24) — 비율은 크기마다 달라 그릴 때 잰다(app.css .pill:hover). 창은 그대로(접힌 창에 여유 — measureSize)
  function peekReady() {
    const pill = $nav.querySelector(".pill");
    if (!pill || !MO) return;
    const { sx, sy } = MO.peekScale(pill.offsetWidth, pill.offsetHeight);
    pill.style.setProperty("--px", sx.toFixed(3)); pill.style.setProperty("--py", sy.toFixed(3));
  }
  let placeFrom = null, paneFrom = null;
  function renderDesk() {
    const moved = st.ui !== lastUi; lastUi = st.ui;
    const enter = moved ? " enter" : "";
    const prev = moved ? snapShape() : null;   // 움직임(C-14): 갈아 끼우기 전의 상자
    const slid = placeFrom !== null && !moved && (placeFrom !== st.place || paneFrom !== st.pane);   // 모드 · 판이 바뀌면 판만 옆으로 밀려 바뀐다(탭 바뀜과 같은 움직임)
    placeFrom = st.place; paneFrom = st.pane;
    deskKeys = {}; cardSay = "";
    if (st.ui === "hidden") { $nav.innerHTML = stripHTML(); hideSay(); }
    else if (st.ui === "greet") $nav.innerHTML = greetHTML(enter);
    else if (st.ui === "petit") $nav.innerHTML = `<div class="${enter.trim()}">${pillHTML()}</div>`;
    else $nav.innerHTML = islandHTML(enter);
    $nav.classList.toggle("side", !!$nav.querySelector(":scope > .pop"));   // 설정 창은 섬 옆(오른쪽)에 — 아래에 열리면 글자를 키웠을 때 설정이 바로 안 보였다(6.2.0)
    $nav.classList.toggle("peekroom", !!window.floeApp && (st.ui === "hidden" || st.ui === "petit"));   // 접힌 창의 여유 — 올리면 커질 자리(C-14)
    if (prev) morphFrom(prev);
    peekReady();
    if (slid && !STILL) $nav.querySelector(".isl-body")?.animate([{ opacity: 0, transform: `translateX(${st.place === "vibe" || st.pane ? 36 : -36}px)` }, { opacity: 1, transform: "none" }], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" });
    const ind = $nav.querySelector(".ti-ind"), to = tabIdx();
    if (!ind) return;
    if (tabFrom !== null && tabFrom !== to) tabMove = { from: tabFrom, to, at: performance.now() };
    tabFrom = to;
    const t = tabMove && tabMove.to === to ? performance.now() - tabMove.at : Infinity;
    if (STILL || t > 400 || !ind.animate) { tabMove = null; return; }
    const go = (el, frames, ms, ease) => { if (el) el.animate(frames, { duration: ms, easing: ease }).currentTime = t; };
    const dx = to > tabMove.from ? 36 : -36;
    go(ind, [{ transform: `translateX(${tabMove.from * 42}px) scaleX(1)` }, { transform: `translateX(${(tabMove.from + to) * 21}px) scaleX(1.25)`, offset: 0.4 }, { transform: `translateX(${to * 42}px) scaleX(1)` }], 380, "cubic-bezier(.3,1.25,.5,1)");
    go($nav.querySelector(".isl-body"), [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: "none" }], 340, "cubic-bezier(.2,.8,.2,1)");
    go($nav.querySelector(".tb-tab"), [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], 260, "ease-out");
    go($nav.querySelector(".tabs .ti[aria-selected=true] svg"), [{ transform: "none" }, { transform: "scale(1.22) translateY(-2px)", offset: 0.4 }, { transform: "none" }], 400, "cubic-bezier(.3,1.5,.5,1)");
  }

  // ── iPhone 화면 ──
  const today = () => new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  function ring() {
    const r = 25, len = 2 * Math.PI * r, part = len * metCount() / met().length;
    return `<svg class="ring" width="60" height="60" viewBox="0 0 60 60" role="img" aria-label="이 단계 ${progress()}">
      <circle cx="30" cy="30" r="${r}" fill="none" stroke="var(--seg)" stroke-width="7"></circle>
      <circle cx="30" cy="30" r="${r}" fill="none" stroke="var(--acc)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${part.toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 30 30)"></circle>
      <text x="30" y="35" text-anchor="middle">${metCount()}/${met().length}</text></svg>`;
  }
  // 집중 모드(iPhone) — [날짜·제목 + 톱니] · 플로로 한마디 · 진행 카드 · 지금 결정할 것 하나. 나머지는 접힌 카드 하나에
  const phoneHead = (kicker, title) => `<div class="ph-top"><div class="ph-date">${esc(kicker)}</div>${gearBtn()}</div><h1 class="ph-title">${esc(title)}</h1>${settingsCard()}`;
  function phoneToday() {
    let h = phoneHead(today(), "오늘의 길잡이") + sayRow(72);
    if (!st.j) return h + box("시작하기", "지금 만들고 있는 걸 보여 주세요", "무엇을 만들고 있고, 어디까지 했는지 편하게 적어 주세요. 연습용 예시 버튼을 눌러 봐도 돼요.", inputBox());
    const s = stage();
    return h + `<div class="card"><div class="proj">${ring()}<div><div class="meta">${esc(project())}</div><div class="big" style="font-size:18px">${s.n}단계 · ${esc(s.title)}</div></div></div>
      ${seg()}<span class="meta">전체 8단계 중 ${s.n + 1}번째 단계예요</span></div>${notes()}${focusCard()}<div class="card">${more()}</div>`;
  }
  const phoneMap = () => phoneHead("전체 8단계", "단계 지도") + mapBody();
  function phoneCheck() {
    const s = stage(), [body, actions] = checkStep();
    return `<button class="back" data-act="close-gate">${I.back}오늘</button>
      <div class="ph-head">${cat(face()[0], 64)}<div><div class="t">${s.n}단계를 다 했어요!</div><div class="meta">넘어가기 전에 함께 확인해요${st.mode === "fixture" ? " · 연습용 예시" : ""}</div></div></div>
      ${chips()}<div class="card"><span class="label">이번 단계에서 이렇게 했어요</span>${flow()}${critList(false)}</div>
      ${body ? `<div class="card">${body}</div>` : ""}<div class="bottom glass">${actions}</div>`;
  }
  function renderPhone() {
    const gate = st.screen === "gate";
    $phone.className = "phone" + (gate ? " check" : "");
    const views = { today: phoneToday, map: phoneMap }, tab = views[st.tab] ? st.tab : "today";   // 한곳에서 보기·도서관 · 단계 문서는 PC에서만(C-16)
    $phone.innerHTML = gate ? phoneCheck() : views[tab]() +
      `<nav class="tabbar glass" aria-label="화면">${PHONE_TABS.map(([id, , label, ic], i) => `<button class="tab" data-act="tab" data-i="${i}" data-tab="${id}" ${tab === id ? 'aria-current="page"' : ""}>${I[ic]}${label}</button>`).join("")}</nav>`;
  }

  // ── 리퀴드 글래스 굴절 (PC, 크롬 계열만) ──
  // 유리 가장자리에서 뒤 화면이 휘어 보이게 한다: 유리 크기에 맞춘 '밀어낼 방향 지도'(R=가로, G=세로, 128이 제자리)를 그려
  // SVG 필터(feDisplacementMap)에 넣고 app.css가 backdrop-filter로 건다. 다른 브라우저는 이 필터를 무시하거나 유리째 지워서 크롬 계열만 켠다.
  // 투명도 줄이기를 켠 사람에게는 켜지 않는다(app.css가 불투명한 판으로 바꾼다).
  // Electron 앱의 투명 창에서는 끈다 — 뒤가 페이지가 아니라 다른 창이라 굴절할 것이 없고, 필터만 무거워 랙이 심했다(2026-10-19 이재엽 보고)
  const REFRACT = !!navigator.userAgentData?.brands?.some((b) => b.brand === "Chromium") && !matchMedia("(prefers-reduced-transparency: reduce)").matches && !window.floeApp;
  const BEZEL = 14, SCALE = 50;   // ponytail: 휘는 가장자리 폭(px)·가장 세게 미는 거리(SCALE/2 px) 하나로 고정 — 유리마다 다르게 하려면 refract의 표에 칸을 늘린다
  // 볼록한 가장자리(애플식 곡선 h=3·(1-(1-t)⁴)^¼ — 높이는 테두리 폭의 3배, t=가장자리에서 안쪽으로 0→1)를 지나는 빛이 유리(굴절률 1.5)에서 꺾이는 정도.
  // 바깥 끝에서 가장 세고 안쪽 끝에서 0 — 바깥 끝 값으로 나눠 0~1로 쓴다
  const bend = (t) => { const a = Math.atan(3 * (1 - t) ** 3 / (1 - (1 - t) ** 4) ** 0.75); return Math.tan(a - Math.asin(Math.sin(a) / 1.5)); };
  const BEND0 = bend(0);
  function lensMap(w, h, r) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), img = g.createImageData(w, h), d = img.data, hx = w / 2 - r, hy = h / 2 - r;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      // 둥근 사각형의 가장자리까지 안쪽으로 잰 거리(depth)와 가장자리에서 바깥을 향하는 방향(nx, ny)
      const dx = x + 0.5 - w / 2, dy = y + 0.5 - h / 2, px = Math.abs(dx) - hx, py = Math.abs(dy) - hy;
      let depth, nx = 0, ny = 0;
      if (px > 0 && py > 0) { const l = Math.hypot(px, py) || 1; depth = r - l; nx = px / l * Math.sign(dx); ny = py / l * Math.sign(dy); }
      else if (px > py) { depth = r - px; nx = Math.sign(dx); } else { depth = r - py; ny = Math.sign(dy); }
      const k = depth < BEZEL ? bend(Math.max(depth, 0) / BEZEL) / BEND0 : 0, i = (y * w + x) * 4;
      // 안쪽 화면을 끌어온다(- 방향) — 바깥은 유리 밖이라 필터가 볼 수 없어 바깥으로 끌면 거의 안 보였다(2026-10-16 화면 비교)
      d[i] = 128 - nx * k * 127; d[i + 1] = 128 - ny * k * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  const lensKey = {};
  if (REFRACT) {
    document.body.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${["isl", "pill"].map((k) =>
      `<filter id="lg-${k}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage result="map" preserveAspectRatio="none"></feImage>
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${SCALE}" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>`).join("")}</svg>`);
    document.documentElement.classList.add("lg-on");
  }
  // 다시 그린 뒤 유리 크기가 바뀌었으면 지도를 새로 그린다 [이름, 고르는 말, 모서리 반지름]
  function refract() {
    if (!REFRACT || isPhone()) return;
    for (const [k, sel, r] of [["isl", ".isl", 28], ["pill", ".pill", 25]]) {
      const el = $nav.querySelector(sel), w = el ? el.offsetWidth : 0, h = el ? el.offsetHeight : 0;
      if (!w || lensKey[k] === `${w}x${h}`) continue;
      lensKey[k] = `${w}x${h}`;
      const fe = document.querySelector(`#lg-${k} feImage`);
      fe.setAttribute("width", w); fe.setAttribute("height", h); fe.setAttribute("href", lensMap(w, h, Math.min(r, h / 2)));
    }
  }
  addEventListener("resize", refract);

  // 설계도 글 칸은 글 길이만큼 늘어난다 — 확정한 뒤 보기(pre)와 같은 크기로. 섬 전체가 화면 높이를 넘으면 섬 안에서 스크롤 (2026-10-18 임유정 요청)
  function grow(t) { const y = t.closest(".isl")?.scrollTop; t.style.height = "auto"; t.style.height = `${t.scrollHeight + 2}px`; if (y !== undefined) t.closest(".isl").scrollTop = y; }
  // 선택지를 누르고 → 살펴보는 중 → 결과까지는 한 흐름이라 섬 크기를 그대로 둔다. 결과가 나오면 새 크기로 한 번만 부드럽게 바뀐다
  // (2026-10-18 임유정 요청: 이어지는 과정에서 크기가 계속 바뀌어 정신없음)
  let holdH = 0;
  const hold = () => { const el = $nav.querySelector(".isl"); if (el && !holdH) holdH = el.offsetHeight; };
  function holdSize() {
    const el = $nav.querySelector(".isl");
    if (!holdH || !el) return;
    if (st.busy) { el.style.minHeight = `${holdH}px`; return; }
    const from = holdH, to = el.offsetHeight; holdH = 0;
    // 앱 안에서는 높이 애니메이션을 하지 않는다 — 창은 바로 새 크기가 되는데 섬만 늦게 커져 "따라오는 게 버벅"으로 보였다(6.2.0)
    if (!STILL && !window.floeApp && Math.abs(to - from) > 4) el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  // 다시 그려도 쓰던 글 칸은 그대로 — 커서 자리와 스크롤까지 되돌린다
  function render() {
    save();
    if (!timer) scheduleIdle();
    const a = document.activeElement, keep = isField(a) && a.dataset.act ? a.dataset.act : "";
    const sel = keep ? [a.selectionStart, a.selectionEnd, a.scrollTop] : null;
    if (isPhone()) renderPhone(); else { renderDesk(); holdSize(); }
    if (keep) {
      const b = document.querySelector(`[data-act="${keep}"]`);
      if (b && b !== a) { b.focus(); try { b.setSelectionRange(sel[0], sel[1]); } catch {} b.scrollTop = sel[2]; }
    }
    if (point) C.follow(isPhone() ? $phone : $nav, point);
    for (const t of document.querySelectorAll("textarea.doc")) grow(t);
    refract();
    // 카드의 한마디도 다른 한마디처럼 플로로 옆에 잠깐 떴다 사라진다 — 같은 말은 한 번만
    if (cardSay !== lastCardSay) { lastCardSay = cardSay; if (cardSay) { const t = cardSay; requestAnimationFrame(() => say(t)); } }
    reportSize();
  }
  // Electron 앱(2026-10-19): 지금 보이는 것(띠 · 한 줄 · 펼침 · 옆의 설정 창까지)의 크기를 앱에 알려 창을 딱 맞춘다 — 투명한 빈 영역이 뒤 창의 클릭을 가로채지 않게.
  // 6.2.0: 시간을 정해 두 번 재는 대신 ResizeObserver가 크기가 바뀔 때마다(글 칸이 늘어나거나 글자 크기를 바꿀 때) 한 프레임에 한 번만 보낸다 — 같은 크기면 보내지 않는다.
  // 설정 창이 옆에 열려 있거나 막 닫혔으면 왼쪽을 고정(anchor "left")해 섬이 제자리에 있고 창만 오른쪽으로 넓어진다
  let sizeRaf = 0, lastSize = "", sideWas = false, sizeObs = null;
  function measureSize() {
    sizeRaf = 0;
    if (!window.floeApp || isPhone()) return;
    // 처음 설정(setup.js)이 떠 있으면 섬이 아니라 그 창을 담도록 넓힌다 — 섬 크기 창(391×60)에 끼어 보였다(두승현 2026-10-19 "설정 창이 매우 작게", KAN-57)
    if (document.getElementById("floe-setup")) { if (lastSize !== "setup") { lastSize = "setup"; window.floeApp.expand(); } return; }
    const h = document.documentElement;
    if (h.classList.contains("diving") || h.classList.contains("surfacing")) return;   // 창은 서고 크기(넓힘) · 섬 크기(돌아옴)로 앱이 먼저 맞춰 둔다
    if (morphHold) return;   // 줄어드는 움직임이 끝난 뒤 창을 줄인다(C-14 — 움직이는 동안 창을 바꾸면 F-24의 버벅임이 돌아온다)
    let r = 0, b = 0;
    for (const el of $nav.children) { if (el.classList.contains("shell")) continue; const q = el.getBoundingClientRect(); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
    if (!r || !b) return;
    // 떠 있는 말풍선(#fx의 .pop-say)의 아래쪽까지 — 한 줄로 접혀 있을 때 말이 창 밖에서 잘렸다(F-40, 이재엽 버튼 "창을 잠깐 늘림"). 가로는 넓히지 않는다(islandX가 가운데로 다시 놓아 한 줄이 밀린다)
    const pop = $fx && $fx.querySelector(".pop-say.show");
    if (pop) b = Math.max(b, pop.getBoundingClientRect().bottom);
    if ($nav.classList.contains("peekroom") && MO) { r += MO.RESERVE.w / 2; b += MO.RESERVE.h; }   // 접힌 창의 여유 — 올리면 커질 자리(왼쪽 여유는 .nav.peekroom의 padding)
    const side = $nav.classList.contains("side"), anchor = side || sideWas ? "left" : "center";
    sideWas = side;
    const key = `${Math.ceil(r)}x${Math.ceil(b)}:${anchor}`;
    if (key === lastSize) return;
    lastSize = key;
    window.floeApp.resize(r, b, anchor);
  }
  const queueSize = () => { if (!sizeRaf) sizeRaf = requestAnimationFrame(measureSize); };
  function reportSize() {
    if (!window.floeApp || isPhone()) return;
    if (!sizeObs && "ResizeObserver" in window) sizeObs = new ResizeObserver(queueSize);
    if (sizeObs) { sizeObs.disconnect(); for (const el of $nav.children) sizeObs.observe(el); }   // 다시 그릴 때마다 새 자식을 본다
    queueSize(); setTimeout(queueSize, 300);   // 300ms 뒤 한 번 더 — 글꼴 · 그림이 늦게 오는 경우
  }
  // 처음 설정이 뜨거나 닫히면('나중에 할게요' · Esc 포함) 다시 잰다 — 닫히면 섬 크기로 돌아온다(KAN-57)
  document.addEventListener("floe:setup-open", queueSize);
  document.addEventListener("floe:setup-done", queueSize);
  PHONE.addEventListener("change", render);

  // ── 플로로와 교감 ──
  // 기분 바꾸기 — 다시 그리지 않고 그림의 class만 바꾼다(쓰다듬는 중에 그림이 사라지지 않게)
  function applyMood() {
    document.body.classList.toggle("dozing", sleepState === "sleep");   // 띠만 보일 때도 귀 옆에 z가 뜬다
    for (const b of document.querySelectorAll("[data-live]")) {
      const svg = b.querySelector("svg.cat");
      if (svg) svg.setAttribute("class", svg.getAttribute("class").replace(/\bm-[a-z]+/, `m-${liveMood(b.dataset.base)}`));
    }
  }
  function flash(mood, ms) { flashMood = { mood, until: Date.now() + ms }; applyMood(); setTimeout(applyMood, ms + 30); }
  const liveCat = () => (isPhone() ? $phone : $nav).querySelector("[data-live]");
  // 플로로의 한마디 — 잠깐 떴다 사라지는 말풍선. 화면 위쪽에 있으면 아래로 띄운다
  let sayTimer = 0, sayRaf = 0;
  // 말풍선 자리 — 플로로 옆. 왼쪽에 빈자리가 있으면 플로로 왼쪽(카드 글을 가리지 않게), 없으면 위, 화면 맨 위면 아래
  function placeSay(b) {
    const host = liveCat();
    if (!host) return;
    // 레벨 오버레이에서는 플로로가 왼쪽 칸에 있어 위로 띄우면 상자 제목을 덮는다 — 아래(기분 말 자리)로
    const r = host.getBoundingClientRect(), side = r.left > 250, below = !side && (r.top < 90 || !!host.closest(".lvc"));
    b.classList.toggle("side", side);
    b.classList.toggle("below", below);
    b.style.left = `${Math.round(side ? r.left - 6 : r.left + r.width * 0.66)}px`;
    b.style.top = `${Math.round(side ? r.top + r.height * 0.2 : below ? r.bottom + 6 : r.top + 6)}px`;
    // 한 줄(.pill) 안의 플로로면 말풍선을 한 줄 폭 안에 — 창 가로가 말풍선 때문에 바뀌지 않게(F-40). 아니면 평소대로
    const pill = host.closest(".pill");
    b.style.maxWidth = pill ? `${Math.max(120, Math.min(280, Math.round(pill.getBoundingClientRect().right - (r.left + r.width * 0.66) - 4)))}px` : "";
  }
  function say(text) {
    if (!liveCat() || !$fx) return;
    let b = $fx.querySelector(".pop-say");
    if (!b) { b = document.createElement("div"); b.className = "pop-say"; b.setAttribute("role", "status"); $fx.appendChild(b); }
    b.textContent = text;
    placeSay(b);
    // 떠 있는 동안 플로로를 따라간다 — 카드 크기가 바뀌어 플로로 자리가 옮겨져도 (2026-10-18 임유정 요청)
    cancelAnimationFrame(sayRaf);
    const follow = () => { if (!b.classList.contains("show")) return; placeSay(b); sayRaf = requestAnimationFrame(follow); };
    // 긴 말은 더 오래 — 글자당 70ms, 2.9초~7초
    const ms = Math.min(7000, Math.max(2900, 1500 + text.length * 70));
    b.style.animationDuration = `${ms}ms`;
    b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
    sayRaf = requestAnimationFrame(follow);
    clearTimeout(sayTimer);
    queueSize();   // 접힌 한 줄이면 창을 말풍선 아래까지(F-40) — 크기가 같으면 보내지 않는다
    sayTimer = setTimeout(() => { b.classList.remove("show"); queueSize(); }, ms);   // 사라지면 한 줄 높이로
  }
  // 띠로 접히면 떠 있던 말풍선을 닫는다 — 띠에는 플로로가 없어 말풍선이 제자리에 남은 채 창만 줄어든다(F-40 4번)
  function hideSay() { const b = $fx && $fx.querySelector(".pop-say.show"); if (b) { b.classList.remove("show"); clearTimeout(sayTimer); } }
  // 한 번 하는 움직임(seal.css · app.css). 끝나면 떼어 낸다 — 헤엄의 물방울처럼 붙어 있는 동안 계속 보이는 것이 있어서
  const playOn = (host, cls) => {
    if (STILL || !host) return;
    host.classList.remove("squish", "purring", "hop", "swim"); void host.offsetWidth; host.classList.add(cls);
    setTimeout(() => host.classList.remove(cls), 3600);
  };
  const center = (el, fy = 0.5) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * fy]; };
  // 쓰다듬기 — 눌렀으면 하트 몇 개와 한마디, 문질렀으면 흥얼흥얼. 친해진 정도가 올라가면 별이 튄다
  function pet(kind) {
    activity();
    const before = C.bond(st.pets).level;
    st.pets += 1;
    const b = C.bond(st.pets), host = liveCat();
    save();
    flash(kind === "stroke" ? "purr" : "love", 1700);
    playOn(host, kind === "stroke" ? "purring" : "squish");
    if (host && !STILL) C.burst(...center(host, 0.3), "heart", kind === "stroke" ? 7 : 4);
    if (b.level > before) {
      say(`플로로와 더 친해졌어요! 이제 '${b.name}'`);
      if (host && !STILL) C.burst(...center(host), "star", 14, 360);
      if (st.sound) C.chime("level");
      setTimeout(render, 1800);   // 위쪽 줄의 하트를 새로
    } else {
      say(kind === "stroke" ? "흥얼흥얼… 기분 좋아요" : C.petLine(st.pets));
      if (st.sound) C.chime("pet");
      if (st.settings) setTimeout(render, 1800);   // 설정 맨 위 '플로로와 나'의 쓰다듬은 횟수를 새로
    }
  }
  // 축하 — 할 일을 다 했을 때, 단계를 넘어갔을 때, 설계도를 확정했을 때
  const CHEER = { done: "와, 할 일을 다 했어요!", doc: "문서 확정! 멋져요", finish: "끝까지 왔어요! 정말 멋져요" };
  function celebrate(kind) {
    requestAnimationFrame(() => {
      const host = liveCat();
      if (st.sound) C.chime(kind === "stage" || kind === "finish" ? "level" : "done");
      flash("happy", 1800);
      say(kind === "stage" ? `${stage().n}단계로 왔어요! 같이 가요` : CHEER[kind]);
      if (STILL || !host) return;
      const big = kind === "stage" || kind === "finish";
      C.burst(...center(host), "star", big ? 16 : 10, big ? 360 : 160);
      if (big) C.burst(...center(host), "bubble", 6, 220);
      playOn(host, "hop");
    });
  }

  // 눈은 마우스를 따라온다. 글 칸에 들어가면 글 칸을 본다. 깜빡임은 들쭉날쭉하게
  let point = null, raf = 0, target = null;
  if (!STILL) {
    document.addEventListener("mousemove", (e) => {
      point = { x: e.clientX, y: e.clientY }; target = null;   // 창 안이면 바로 — 미끄러지던 것은 멈춘다
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0; activity(); C.follow(isPhone() ? $phone : $nav, point);
      });
    });
    // 앱(Electron) 안이면 창 밖의 커서도 — 창이 섬 크기라 커서는 거의 늘 창 밖이다(2026-10-19). 눈만 따라오고, 졸음을 깨우지는 않는다(activity는 이 창을 쓸 때만).
    // 앱은 1초에 30번만 보내 주니 받은 점으로 바로 뛰지 않고 프레임마다 미끄러져 간다(C.glide — F-27, 창 안의 mousemove는 위처럼 바로)
    if (window.floeApp && window.floeApp.onCursor) {
      let glideRaf = 0, last = 0;
      const step = (now) => {
        glideRaf = 0;
        if (!target) return;
        const g = C.glide(point, target, now - last); last = now;
        point = { x: g.x, y: g.y }; C.follow(isPhone() ? $phone : $nav, point);
        if (g.done) target = null; else glideRaf = requestAnimationFrame(step);
      };
      window.floeApp.onCursor((p) => { target = p; if (!glideRaf) { last = performance.now(); glideRaf = requestAnimationFrame(step); } });
    }
    (function blink() {
      setTimeout(() => {
        document.body.classList.add("blink");
        setTimeout(() => document.body.classList.remove("blink"), 140);
        if (Math.random() < 0.2) setTimeout(() => { document.body.classList.add("blink"); setTimeout(() => document.body.classList.remove("blink"), 120); }, 320);
        blink();
      }, 2400 + Math.random() * 3800);
    })();
  }
  $nav.addEventListener("focusin", (e) => {
    if (STILL || e.target.tagName !== "TEXTAREA") return;
    const r = e.target.getBoundingClientRect();
    point = { x: r.left + r.width * 0.35, y: r.top + 20 };
    C.follow($nav, point);
  });
  // 좌우로 문지르면 쓰다듬은 것 (seal.js의 stroke가 센다)
  let strokeState = null;
  $nav.addEventListener("pointermove", (e) => {
    if (!e.target.closest("[data-pet]")) { strokeState = null; return; }
    strokeState = C.stroke(strokeState, e.clientX, e.timeStamp);
    if (strokeState.petted) pet("stroke");
  });
  function lookAround() {
    const host = liveCat();
    if (!host) return;
    const [x, y] = center(host, 0.4);
    [[-400, -40], [400, -40], [0, 0]].forEach(([dx, dy], i) => setTimeout(() => { if (!looked) return; C.follow(host, { x: x + dx, y: y + dy }); }, i * 900));
  }
  // 가만히 두면 졸다가 잠든다. 움직이면 깬다
  let lastActive = Date.now(), swam = false, looked = false;
  function activity() {
    lastActive = Date.now();
    swam = false; looked = false;
    if (sleepState === "awake") return;
    const was = sleepState;
    sleepState = "awake";
    if (was === "sleep") { flash("wow", 900); say("앗, 깜빡 졸았어요!"); } else applyMood();
  }
  setInterval(() => {
    if (isPhone() || st.busy) return;
    // 20초쯤 가만히 있으면 졸기 전에 숨구멍에서 한 바퀴 헤엄친다(쉴 때마다 한 번)
    if (!swam && sleepState === "awake" && Date.now() - lastActive >= 20_000) { swam = true; playOn(liveCat(), "swim"); }
    // 8초쯤 가만히 있으면 두리번 — 왼쪽 → 오른쪽 → 앞(쉴 때마다 한 번). 마우스를 움직이면 눈이 다시 마우스를 따라간다
    if (!looked && !STILL && sleepState === "awake" && Date.now() - lastActive >= 8_000) { looked = true; lookAround(); }
    const s = C.sleepy(Date.now() - lastActive);
    if (s === sleepState) return;
    sleepState = s;
    applyMood();
    if (s === "sleep") say("쿨… 쿨…");
  }, 3000);

  // ── AI 호출 — 기다리는 동안 플로로가 "살펴보는 중" ──
  // 기다리는 시간 — AI는 얼마나 남았는지 알려 주지 않아서 퍼센트는 지어낸 숫자가 된다. 대신 지난 시간과 지난번에 걸린 시간을 보인다
  let waitFrom = 0, lastWait = 0, waitTimer = 0;
  const waitText = () => {
    // 예상 시간 = 지난번에 걸린 시간(처음엔 없음). 넘기면 '예상보다 길어져요'
    const s = Math.round((Date.now() - waitFrom) / 1000);
    if (!lastWait) return `${s}초`;
    return s <= lastWait ? `예상 ${lastWait}초 · ${s}초` : `예상보다 길어져요 · ${s}초`;
  };
  async function callAI(url, body) {
    hold(); st.busy = true; waitFrom = Date.now(); render();
    waitTimer = setInterval(() => { const el = $nav.querySelector("[data-wait]"); if (el) el.textContent = waitText(); }, 1000);
    try {
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
  const RETRY = { judge: () => judge(true), draft: () => draft(true), review: () => review(true) };
  // 새로 배운 말을 모은다. 돌려주는 것: 이번에 처음 배운 말들
  function learn(j) {
    const fresh = [];
    for (const c of j.criteria) if (c.met && c.term && !st.learned.some((x) => x.term === c.term)) { st.learned.push({ term: c.term, text: c.text }); fresh.push(c.term); }
    return fresh;
  }
  let pendingNotice = "";
  // sent: 살펴본 작업 글 — '물어보기'가 글 칸이 비었을 때 대신 보낸다(F-11)
  function landed(j, tokens, sent = st.text) {
    const was = allDone();
    Object.assign(st, { j, tokens: tokens || 0, todos: null, openInput: false, choice: null, later: false, picking: false, back: "", notice: pendingNotice, finished: false, judged: sent });
    pendingNotice = "";
    const fresh = learn(j);
    // 다 했으면 스스로 펼쳐서 알린다(CouCou의 alert), 아니면 접혀 있던 것만 한 줄로 보인다
    if (allDone()) { view("alert"); if (!was) return celebrate("done"); } else peek();
    if (fresh.length) requestAnimationFrame(() => say(`새 말을 배웠어요: ${fresh.join(", ")}`));
  }
  const stop = (msg) => { st.error = msg; pendingNotice = ""; render(); };   // 보낼 수 없을 때 — 이유를 보여 주고 멈춘다
  // 토큰 사용량(F-12) — 서버로 열었을 때만 /api/usage를 묻는다. 기록(save)에는 넣지 않는다(그때그때 서버에서 받는 값)
  let usage = null;
  function fetchUsage() {
    if (!canLive) return;
    fetch("/api/usage").then((r) => r.json()).then((j) => { usage = j && j.ok ? j : null; if (st.tab === "all" && !isPhone()) render(); }).catch(() => { usage = null; });
  }
  // 진짜 AI에게 묻는 네 가지(어디쯤·물어보기·초안·다시 봐 주기)가 같이 쓰는 흐름:
  // [check가 있으면 비밀번호 같은 게 보일 때 먼저 멈춤] → 호출 → 성공이면 done(r), 실패면 지어내지 않고 이유만 보여 준다
  async function askAI(url, body, what, done, check) {
    if (check && guard(...check)) return;
    const r = await callAI(url, body);
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
    Object.assign(st, { doc: null, warn: null, error: "", askConfirm: 0, notice: `${s.n}단계 ${s.doc}${eul(s.doc)} 확정했어요 — 도서관의 책과 단계 지도에서 다시 볼 수 있어요.` });
    render();
    celebrate("doc");
  }

  function advance() {
    if (!N.canAdvance(met(), "yes")) return;
    const s = stage(), nx = nextStage(), last = [...st.checks].reverse().find((c) => c.stage === s.n);
    st.history.push({ short: `${s.n}단계 ${s.title} 마침`,
      text: `${s.n}단계 "${s.title}" → ${nx ? `${nx.n}단계로 넘어갔어요` : "마무리했어요"} · '잘 모르겠어요' ${st.noCount}번${
        last ? ` · 확인 질문 ${last.ok ? "맞힘" : "정답 보고 넘어감"}` : ""} · ${ymd()}` });
    Object.assign(st, { screen: "main", notice: "", tab: "today", showCrit: false, mapSel: null, hold: null, check: null, undo: [], own: false, cmd: null, libDoc: null });
    if (nx) st.j = { stage: nx.n, reason: `${s.n}단계를 마쳤어요! 이제 ${nx.n}단계 "${nx.title}"예요. 정한 순서대로 하나씩 해 봐요.`,
      criteria: crits(nx.n).map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    else st.finished = true;
    lvPop = true; setTimeout(() => { lvPop = false; }, 1200);   // 레벨 오버레이의 LV 글자가 튄다
    render();
    celebrate(nx ? "stage" : "finish");
  }
  // 글 칸으로 커서를 옮긴다 (다시 그린 뒤)
  const focusText = () => requestAnimationFrame(() => { const t = document.querySelector("[data-act=text]"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } });

  // ── 누르기 — data-act 이름 → 할 일. (i: data-i, el: 누른 것) ──
  const set = (patch) => { Object.assign(st, patch); render(); };
  // 헷갈린 곳 고르기/빼기 (PC 단추·iPhone 체크 상자)
  const toggleHard = (i, on = !st.hard.includes(i)) => set({ hard: on ? [...new Set([...st.hard, i])].sort() : st.hard.filter((x) => x !== i) });
  const ACT = {
    strip: () => view("enter"),
    open: () => view("click"),
    pin: () => { clearIdle(); set({ userPin: !st.userPin }); say(st.userPin ? "여기 열어 둘게요" : "이제 잠시 뒤 작게 접힐게요"); },
    pill: () => view("click"),
    fold: () => go("petit"),
    pet: () => pet("tap"),
    // 연습용은 바로 살펴보고, 진짜 AI 모드에서는 글만 넣어 둔다(보내는 건 사용자가 '어디쯤인지 보기'를 누를 때)
    ex: (i) => {
      st.text = S.examples[i].text; st.notice = ""; st.undo = [];
      if (st.mode === "fixture") return judge(true);
      render(); focusText(); say("예시 글을 넣었어요. 보내려면 '어디쯤인지 보기'를 눌러요");
    },
    judge: () => { st.notice = ""; judge(false); },
    "fill-example": () => { set({ text: S.first.text, error: "", warn: null }); focusText(); },
    restart: () => { Object.assign(st, { j: null, finished: false, todos: null, hold: null, todoLater: [] }); ACT.ex(S.examples.indexOf(S.first)); },
    "send-anyway": () => RETRY[st.warn.then](),
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
    settings: () => set({ settings: !st.settings }),
    // 모아 보기 창(2026-10-20, C-11) — 앱이면 보통 창 하나(main.js openHub), 브라우저면 새 탭 하나(같은 이름이라 두 번 눌러도 하나)
    hub: () => (window.floeApp && window.floeApp.openHub ? window.floeApp.openHub() : window.open("../hub/index.html", "floe-hub")),
    // 기본 화면(C-13, 2026-10-20) — 집 · 바이브 코딩 · 알림 판 · AI 진행 판 · 단추로 돌아가기 · 크게 보기(모아 보기 창의 그 칸)
    base: () => { setPlace("home"); set({ settings: false, pane: "" }); },   // 집 — 기본 화면으로, 열어 둔 판도 닫는다
    "go-vibe": () => { setPlace("vibe"); set({ tab: "today", settings: false }); },
    "base-alerts": () => { seenAlerts = HUB ? HUB.latestAt(st.alerts) : Date.now(); try { if (SESS) SESS.setItem(SEEN_KEY, String(seenAlerts)); } catch {} set({ pane: "alerts" }); },
    "base-ai": () => { set({ pane: "ai" }); pollSteps().then(render); },
    "base-back": () => set({ pane: "" }),
    "hub-alerts": () => openHub("alerts"), "hub-ai": () => openHub("ai"),
    bond: () => set({ settings: !st.settings }),   // 하트 — 설정 맨 위의 '플로로와 나'(F-05). 위쪽 줄의 하트는 뺐지만 설정에서 같은 자리로 간다
    tab: (i) => set({ tab: TABS[i][0], error: "", warn: null, settings: false, askConfirm: 0, libSel: null, libConfirm: false, libDoc: null }),
    // 먹이 주기(C-15) — 예시 · 나눠 정리 · 구간 표시 바꾸기 · 확인 · 다시 쓰기
    "feed-example": () => { if (FD) { st.text = FD.EXAMPLE; feedSort(FD.EXAMPLE, true); } },
    "feed-sort": () => feedSort(st.text),
    "feed-mark": (i) => { const fd = st.meal; if (!fd || !fd.checks[i]) return; fd.marks[i] = feedSkip(fd, i) ? "keep" : "skip"; render(); },
    "feed-confirm": () => feedConfirm(),
    "feed-back": () => set({ meal: null }),
    // 책 안의 단계 문서(C-16) — 열기 · 닫기 · 이번 단계 카드에서 바로
    "lib-doc": (i) => set({ libDoc: i, askConfirm: 0, libConfirm: false }),
    "lib-doc-close": () => set({ libDoc: null, askConfirm: 0 }),
    "lib-doc-now": () => openBookDoc(st.j ? st.j.stage : 1),
    // 도서관 탭 — 책 고르기 · 목록으로 · 서고에 보관(확인 뒤) · 한 권으로 엮기
    "lib-enter": () => enterLibrary(),
    "lib-book": (i, el) => set({ libSel: (el && el.dataset.id) || openBooks()[i].id, libConfirm: false, libDoc: null }),
    "lib-close": () => set({ libSel: null, libConfirm: false, libDoc: null }),
    "lib-shelve-ask": () => set({ libConfirm: true }),
    "lib-shelve-no": () => set({ libConfirm: false }),
    "lib-shelve": () => shelveBook(),
    "lib-bind": () => bindBook(),
    "map-sel": (i) => set({ mapSel: i }),
    crit: () => set({ showCrit: !st.showCrit }),
    "open-input": () => { set({ openInput: true, showCrit: false }); focusText(); },
    "close-input": () => set({ openInput: false }),
    // 넘어가기 전 확인 안에서는 글 칸이 안 보인다 — 보낼 작업 글이 없어 멈췄으면(F-11) 확인을 닫고 글 칸을 연다
    "retry-input": () => { const noText = st.screen === "gate" && !U.askText(st.text, st.judged); set({ error: "", openInput: !!st.j, ...(noText ? { screen: "main" } : {}) }); focusText(); },
    dismiss: () => set({ error: "" }),
    "look-now": () => { st.notice = ""; lookAfterWork(lastPing); },
    "peek-text": () => { set({ ping: "", openInput: !!st.j }); focusText(); },
    "ping-later": () => { st.ping = ""; go("petit"); },
    draft: () => draft(false),
    review: () => review(false),
    "confirm-doc": () => confirmDoc(false),
    "confirm-anyway": () => confirmDoc(true),
    "confirm-cancel": () => set({ askConfirm: 0 }),
    "reopen-doc": () => { const x = docDone(docStage().n); if (x) set({ doc: newDoc(x.stage, x.text, "") }); },
    forget: () => { forgotten = true; try { localStorage.removeItem(KEY); localStorage.removeItem(BOUND_KEY); localStorage.removeItem("floe:setup:v1"); } catch {} location.reload(); },   // 처음 설정도 처음부터
    setup: () => { set({ settings: false }); if (window.FloeSetup) window.FloeSetup.open(); },
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
      requestAnimationFrame(() => document.querySelector("[data-act=note-text]")?.focus());
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
    // 레벨 오버레이(2026-10-19) — 명령 칸 고르기/닫기, 길 누르기(기존 동작을 그대로 부른다), 살피기의 할 일 목록, 자동 살펴보기, 다음 레벨 미리 보기, 느낀 점 열기
    cmd: (i) => set({ cmd: st.cmd === i ? null : i }),
    "cmd-close": () => set({ cmd: null }),
    path: (i) => { const p = pathsFor(st.cmd)[i]; st.cmd = null; if (p) run({ act: p.act, i: p.i }); else render(); },
    "crit-box": () => set({ showCrit: true }),
    "auto-toggle": () => { set({ auto: !st.auto }); say(st.auto ? "AI 코딩 도구가 일을 마치면 저절로 살펴볼게요" : "이제 눌러야 살펴봐요"); },
    peek: () => set({ tab: "map", mapSel: nextStage() ? nextStage().n : null, settings: false }),
    "notes-open": () => set({ settings: true, notesOpen: true }),
    // Electron 앱(2026-10-19) — 폴더를 골라 훅을 더하거나 빼고, .env를 두는 설정 폴더를 연다. 앱 밖에서는 단추가 없다
    "app-connect": async () => { const r = await window.floeApp.connect(); if (r && r.message) say(r.message.split("\n")[0]); },
    "app-disconnect": async () => { const r = await window.floeApp.disconnect(); if (r && r.message) say(r.message.split("\n")[0]); },
    "app-settings": () => window.floeApp.openSettings(),
    alog: () => set({ alogOpen: !st.alogOpen, alogNote: "" }),
    // 연결 끊기 — 끊은 동안 들어온 알림은 받지 않는다(alerts.js accept). 다시 연결하면 그 뒤의 알림부터 받는다
    unplug: () => { set({ unplug: !st.unplug, ping: st.unplug ? st.ping : "" }); say(st.unplug ? "연결을 끊었어요. 작업 알림을 받지 않아요" : "다시 연결했어요"); },
    "alog-clear": () => clearAlerts(),
  };
  // iPhone — 아래 막대 뒤나 스크롤 밖에 생긴 칸(잠시 멈추기 권유·적는 칸)을 보이는 곳으로 옮긴다. 없으면 아무것도 안 한다
  const reveal = (sel) => { if (isPhone()) requestAnimationFrame(() => { const el = $phone.querySelector(sel); if (el) el.scrollIntoView({ block: "center", behavior: STILL ? "auto" : "smooth" }); }); };
  // 넘어가기 전 확인의 마지막 — 다음 단계 할 일로 순서 정하기를 연다(꼭/나중에는 처음엔 모두 꼭)
  // 확인 질문 뒤 — 순서 정하기 없이 바로 다음 단계로(2026-10-18 임유정 결정, FR-12는 팀이 정한다 · PR #105). 마지막 단계만 '마치기'를 한 번 더 묻는다
  function toNext() {
    const nx = nextStage();
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
    st.tier = v;
    if (st.j) {
      st.j = T.refit(st.j, v);
      Object.assign(st, { hard: [], todos: null, todoLater: [], notice: `만드는 크기를 '${TIERS.find(([x]) => x === v)[1]}'로 바꿔서, 이 단계 할 일이 ${st.j.criteria.length}개가 됐어요.` });
      if (st.screen === "gate" && !allDone()) st.screen = "main";
    }
    render();
  }
  // 모아 보기 창을 그 칸(#alerts · #ai)으로 — 앱이면 main.js openHub(space), 브라우저면 같은 이름의 탭(주소 끝만 바뀐다)
  const openHub = (space) => (window.floeApp && window.floeApp.openHub ? window.floeApp.openHub(space) : window.open(`../hub/index.html#${space}`, "floe-hub"));
  const run = (a, el) => { if (ACT[a.act]) ACT[a.act](a.i, el); };
  for (const $root of [$nav, $phone]) {
    $root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-act]");
      if (!t || !ACT[t.dataset.act]) return;
      activity();
      run({ act: t.dataset.act, i: t.dataset.i === undefined ? undefined : Number(t.dataset.i) }, t);
    });
    $root.addEventListener("change", (e) => {
      const a = e.target.dataset.act;
      if (a === "mode") set({ mode: e.target.value, error: "", warn: null });
      if (a === "auto") set({ auto: e.target.checked });
      if (a === "text-size") { set({ textSize: Number(e.target.value) || 1 }); applyScale(); }
      if (a === "sound") { set({ sound: e.target.checked }); if (st.sound) C.chime("pop"); }
      if (a === "hard") toggleHard(Number(e.target.dataset.i), e.target.checked);
      if (a === "tier") setTier(e.target.value);
      if (a === "words" && CMD[e.target.value]) set({ words: e.target.value });
    });
    $root.addEventListener("input", (e) => {
      activity();
      if (e.target.dataset.act === "hold-who") st.holdWho = e.target.value;
      if (e.target.dataset.act === "hold-when") st.holdWhen = e.target.value;
      if (e.target.dataset.act === "text") {
        const grew = st.text.length < 200 && e.target.value.length >= 200;
        st.text = e.target.value;
        if (grew) say("와, 꼼꼼하게 쓰셨네요!");
      }
      if (e.target.dataset.act === "question") st.question = e.target.value;
      if (e.target.dataset.act === "own-text") st.ownText = e.target.value;
      // 느낀 점 — 글자를 칠 때는 다시 그리지 않고(커서가 튄다) '남기기' 단추만 켠다
      if (e.target.dataset.act === "note-text") { st.noteText = e.target.value; const b = document.querySelector("[data-act=note-add]"); if (b) b.disabled = !st.noteText.trim(); }
      if (e.target.dataset.act === "doc" && st.doc) {
        st.doc.text = e.target.value; save(); grow(e.target);   // 글자를 칠 때는 다시 그리지 않는다(커서가 튄다) — 빈칸 개수만 바꾼다
        if (st.askConfirm) { st.askConfirm = 0; document.querySelector("[data-ask-confirm]")?.remove(); }   // 고치기 시작하면 다시 묻지 않는다
        const m = document.querySelector("[data-blanks]");
        if (m) m.textContent = blankMeta(st.doc);
      }
    });
  }

  // ── 단축키 (PC) — 카드 버튼에 적힌 키. 글을 쓰는 중에는 Esc와 Ctrl+Enter만. 한글 자판의 ㅛ·ㅜ도 Y·N으로 ──
  const ALIAS = { "ㅛ": "y", "ㅜ": "n", "ㅗ": "h" };
  document.addEventListener("keydown", (e) => {
    activity();
    if (isPhone() || e.isComposing) return;
    if (greetSkip) { greetSkip(); if (e.key === "Escape") { e.preventDefault(); return; } }   // 켤 때 인사 중: 어떤 키든 움직임을 끝내고, Esc는 그것만
    const t = e.target, writing = isField(t);
    if (e.key === "Escape") {
      if (st.settings) return set({ settings: false });
      if (deskKeys.Escape && st.ui === "home") { e.preventDefault(); return run(deskKeys.Escape); }
      return view("esc");
    }
    if (st.ui !== "home" && st.ui !== "greet") return;
    if (t.tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) return;   // 버튼 위의 Enter는 그 버튼을 누른 것
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      const a = deskKeys["c-Enter"] || deskKeys.Enter;
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
  async function poll() {
    let r;
    try { r = await (await fetch(`/api/events?since=${Math.max(lastSeq, 0)}`)).json(); } catch { return; }
    if (!r.ok) return;
    const first = lastSeq < 0, ev = r.events[r.events.length - 1];
    lastSeq = r.latest;   // 연결을 끊은 동안에도 기준은 앞으로 — 다시 연결했을 때 지난 알림을 한꺼번에 받지 않는다
    if (!ev) return;
    if (!first) return onEvent(ev);
    if (!st.unplug) { st.feed = { at: ev.at, project: ev.project, tool: ev.tool }; if (ev.project) st.project = ev.project; }
    render();
  }
  // 작업을 알아챈다: 알림 기록에 한 줄 남기고(FR-7), 글 칸에 최근 작업을 채우고 한 줄로 알린다. 작업을 마쳤을 때 바로 살펴보는 건
  //   진짜 AI면 '자동으로 살펴보기'를 켰을 때만(작업 글이 밖으로 나가서), 연습 알림(작업 장면 보기)이면 이 화면 안에서만 살펴보니 늘
  let lastPing = { tool: "", kind: "" };
  async function onEvent(ev) {
    if (!A.accept(ev, st.unplug)) return;   // 연결을 끊은 동안 들어온 알림 — 글 칸 채우기·살펴보기·기록 모두 하지 않는다
    if (!ev.sim) { st.feed = { at: ev.at, project: ev.project, tool: ev.tool }; if (ev.project) st.project = ev.project; }
    st.alerts = A.add(st.alerts, ev, (t) => sensitive(t).length > 0);
    if (st.busy) return render();
    if (ev.work) st.text = ev.work;
    activity();
    const tool = toolName(ev.tool);
    lastPing = { tool, kind: ev.kind };
    const auto = ev.kind === "stop" && !st.finished && st.screen !== "gate" && (ev.sim ? st.mode === "fixture" : st.auto && st.mode === "live");
    if (auto) {
      await lookAfterWork(lastPing);
      if (ev.sim || st.warn) view("alert");
      return;
    }
    st.ping = ev.kind === "stop" ? `${tool}가 방금 작업을 마쳤어요 — 눌러서 어디쯤인지 볼까요?` : `${tool}에서 새 작업을 시작했어요`;
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
  // AI 진행(C-12) — 기본 화면의 '지금 한 줄' · AI 진행 판이 쓴다. 서버로 열렸으면 /api/steps?since=를 2초마다(기본 화면이 펼쳐져 있을 때만), 파일로 열렸거나 거절하면 예시(모아 보기 창과 같은 규칙)
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
  if (canLive) setInterval(async () => { if (st.place !== "base" || st.ui !== "home") return; const was = aiLatest; await pollSteps(); if (aiLatest !== was) render(); }, 2000);

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
  function fromHash() {
    const h = location.hash.slice(1);
    if (!h) return;
    const q = Object.fromEntries(h.split("&").map((kv) => kv.split("=").map(decodeURIComponent)).map(([k, v]) => [k, v === undefined ? true : v]));
    Object.assign(st, { ui: "home", userPin: true, screen: "main", settings: false, warn: null, error: "", ping: "", showCrit: false, libSel: null, libConfirm: false, openInput: false,
      termOpen: "", check: null, undo: [], own: false, meal: null, libDoc: null });
    // 주소로 연 장면은 바이브 코딩(녹화 · 시험이 그대로), #base(&pane=alerts|ai)만 기본 화면(C-13, 넘김 문서 9절 7번)
    // 서고에서 돌아온 주소(&back)는 장면이 아니다 — 떠난 모드 그대로(F-36, PR #139 리뷰: 기본 화면에서 서재에 다녀오면 바이브 코딩이 됐다)
    if (q.base) { st.place = "base"; st.pane = q.pane === "alerts" || q.pane === "ai" ? q.pane : ""; } else setPlace(q.back ? "library" : "scene");
    if (q.tier && TIERS.some(([v]) => v === q.tier)) { st.tier = q.tier; if (st.j) st.j = T.refit(st.j, st.tier); }
    if (q.noex) { exHidden = true; applyEx(); }   // 이 화면만 예시 책 없이(시험 · 시연용) — 저장하지 않는다
    if (q.start) Object.assign(st, { j: null, finished: false, todos: null, text: S.first.text, tab: "today", hold: null });
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
    if (q.tab === "learn") { save(); location.replace(`${LIB_URL}#lib`); return; }
    if (q.tab && TABS.some((t) => t[0] === q.tab)) st.tab = q.tab;
    if (q.book) st.libSel = String(q.book);
    // 옛 주소 &tab=doc(단계 문서 탭, 2026-10-20 C-16에 뺌)은 도서관의 책 안 그 단계 문서로 — 녹화(record-demo-gifs.py)와 e2e 장면이 그대로 이어진다. &doc=<단계>도 같다
    if (q.tab === "doc" || q.doc !== undefined) {
      const b = openBooks().find((x) => x.mine) || openBooks()[0];
      Object.assign(st, { tab: "lib", libSel: b ? b.id : st.libSel, libDoc: q.doc !== undefined ? Number(q.doc) : st.j ? st.j.stage : 1 });
    }
    if (q.crit) st.showCrit = true;
    if (q.gate && st.j && allDone()) Object.assign(st, { screen: "gate", step: "ask", hard: [], question: "", answer: "", noCount: 0 });
  }
  fromHash();
  addEventListener("hashchange", () => { fromHash(); render(); });

  // ── 켤 때 인사(C-10, 2026-10-20 이재엽 "처음에 반갑다고 인사하고 하는 모습이랑 켜지는 모습들") — 시간표는 greet.js, 단계마다 모양은 app.css([data-greet]) ──
  // 켤 때마다. 주소 끝 장면 · 휴대폰 · 움직임 줄이기면 안 한다(greet.js shouldGreet). 처음 설정(setup.js)은 인사가 끝난 뒤 열린다(floe:greet-done)
  const greetNow = !!GR && st.ui === "greet" && GR.shouldGreet({ hash: location.hash, still: STILL, phone: isPhone() }).greet;
  if (greetNow) document.documentElement.classList.add("greeting");
  else if (st.ui === "greet") st.ui = "home";   // 인사 움직임이 없으면(움직임 줄이기 등) 바로 기본 화면 — 인사 카드는 이제 없다(C-13)
  function startGreeting() {
    const h = document.documentElement;
    const finish = () => {
      greetSkip = null; h.classList.remove("greeting"); delete h.dataset.greet;
      go("home");   // 인사가 끝나면 인사 카드 대신 기본 화면(C-13, 넘김 문서 9절 3번) — 바이브 코딩 단추가 '이어서 하기'를 맡는다
      clearIdle(); scheduleIdle();
      document.dispatchEvent(new CustomEvent("floe:greet-done"));
    };
    const onPhase = (p) => {
      if (p === "done") return finish();
      h.dataset.greet = p;
      const host = liveCat();
      if (p === "pop" && host) C.burst(...center(host, 0.65), "bubble", 7, 160);
      if (p === "hello") { say(C.greeting(new Date().getHours())); if (st.sound) C.chime("pop"); }
      if (p === "settle") { document.body.classList.add("blink"); setTimeout(() => document.body.classList.remove("blink"), 140); }
    };
    const run = GR.play(GR.TIMELINE, { onPhase });
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
  document.addEventListener("floe:setup-done", (e) => {
    const d = (e && e.detail) || {};
    if (d.via === "practice") set({ mode: "fixture", error: "", warn: null });
    else if ((d.via === "cli" || d.via === "api") && canLive) set({ mode: "live", error: "", warn: null });
    if (d.open) { setPlace("vibe"); st.tab = "today"; go("home"); }   // '시작하기' — 바이브 코딩으로(C-13: 보여 주기는 바이브 코딩 안에)
  });
  // 모아 보기 창의 바이브 코딩 '들어가기'(2026-10-20, C-11) — 앱이 섬 창을 앞으로 보내고 이 신호를 주면 '이번 단계'로
  if (window.floeApp && window.floeApp.onEnter) window.floeApp.onEnter(() => { setPlace("enter"); st.tab = "today"; go("home"); });

  render();
  if (greetNow) startGreeting();
  else if (document.documentElement.classList.contains("surfacing") && window.FloeDive && !isPhone()) startSurfacing();
  else document.documentElement.classList.remove("surfacing");
})();
