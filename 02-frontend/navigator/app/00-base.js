// claude-drafted: 2026-10-14, 2026-10-15, 2026-10-18(임유정 요청 14가지 정리), 2026-10-16(0~7단계 연습·마무리·빈칸 확인·지금 단계 계산·리퀴드 글래스 굴절) — Navigator 프로토타입 화면 동작.
// 규칙·문구 판단은 navigator.js, 연습 예시는 scenario.js, 플로로 그림·교감 도구는 seal.js, 실제 Claude 호출은 server.js.
// 넓은 화면(PC) = 코딩 도구 창 위에 떠 있는 옆자리 동료. 2026-10-15 "가로 카드 시안대로" 다시 짬:
//   띠 → 한 줄 → 펼침(위: 아이콘 줄, 아래: 지금 결정할 것 하나를 담은 가로 카드). 카드는 상황마다 색·플로로 표정·뱃지가 다르다
//   (골라 주세요=파랑, 다 했어요=초록, 넘어가기 전 확인=주황, 작업 알림·살펴보는 중=회색, 오류=빨강). 버튼마다 단축키(1·2·3, Enter, Esc, Y·N).
//   교감: 플로로를 누르면(또는 좌우로 문지르면) 하트와 한마디, 친해진 정도가 쌓인다. 가만히 두면 졸다가 잠들고, 움직이면 깬다.
//   할 일을 다 하거나 단계를 넘어가면 별이 튀며 축하한다.
// 600px 이하 = iPhone: 오늘 / 설계도 / 단계 지도 탭과 넘어가기 전 확인 화면 — 이번에 바꾸지 않았다(PC 먼저). 두 화면은 같은 상태(st)를 쓴다.
// 기록(작업 글·진행·배운 말·설계도·플로로와 친해진 정도)은 이 브라우저(localStorage)에만 남는다.
// claude-drafted: 2026-10-18 — F-05(PRD 2-7, 이재엽 결정 "내배움 지우기 / 플로로와 처음 만난거 보여주는건 설정 처음에 / 내용들은 서재에서 /
//   오버레이에서는 간단하고 필요한 내용만, 자세한건 서재로"): '내 배움' 탭을 없앴다. '플로로와 나'(설정 맨 위)는 2026-10-24에 뺐다.
// 2026-10-19(이재엽): 서재의 '내 배움'(learn.js)도 지웠다 — "서재에서 자세히 보기"는 서고로 가고, 옛 주소 #tab=learn도 서고로 보낸다(fromHash).
// claude-drafted: 2026-10-18 — 화면 빈칸(이재엽 요청): 용어 풀이(FR-13, glossary.js) · '예' 뒤 확인 질문 1개와 '아니요' 3번 뒤 잠시 멈추기(FR-5, understand.js)
//   · 다음 할 일 꼭/나중에(FR-12, priority.js) · 작업 알림 기록과 연습 알림으로 할 일 끝 표시(FR-7, alerts.js) · 만드는 크기(tier)를 서버에 보내기.
// claude-drafted: 2026-10-19 — 실사용(이재엽 2026-10-18 "화면에서만 … 아니라 실질적으로 테스트 … 우리가 사용하면서 느끼고 싶어"):
//   도서관 탭의 첫 책이 예시(s1)를 빌려 쓰던 것을 **내 책**(이 화면의 단계 · 할 일 · 설계도 · 배운 말, ../library/my-books.js)으로 바꿨다 — 진짜 AI 모드이거나 예시 책을 지웠을 때.
//   연습 모드에서 예시가 보일 때는 전처럼 첫 책이 이 화면을 따른다(시연 장면 · GIF 그대로). 예시 책에는 '예시' 꼬리표, 도서관 탭 아래 '예시 책 지우기 / 다시 보기'.
//   설정에 '느낀 점'(notes.js) — 쓰다가 느낀 것을 한 줄 남기면 화면 · 단계 · 때가 저절로 붙고, 'Jira용 복사'로 모아 붙인다(이 컴퓨터에만 남는다).
// claude-drafted: 2026-10-20 — C-13 모드 둘 · C-14 섬의 움직임(이재엽, 넘김 문서 fable-handoff-2026-10-20-modes.md 3 · 4절):
//   켜면 늘 **기본 화면**(st.place "base" — 플로로와 지금 한 줄, 단추 넷: 바이브 코딩 · 서재 · 알림 · AI 진행. 알림 · AI 진행은 섬 안에서 바로 — hub.js의 순수 함수를 쓴다 — 따로 뜨던 모아 보기 창은 2026-10-23에 뺐다).
//   바이브 코딩 단추를 누르면 "vibe"(이번 단계 · 설계도 · 단계 지도 · 도서관)로, 접혔다 펼쳐지거나 서고에 다녀와도 그대로(sessionStorage — 켤 때마다 새 창이라 늘 기본), 위쪽 줄의 집 단추로 돌아온다.
//   규칙은 navigator.js nextPlace. 주소로 연 장면(#ex= …)은 바이브 코딩, #base(&pane=alerts|ai)는 기본 화면. 켤 때 인사가 끝나면 인사 카드 대신 기본 화면이 된다.
//   섬이 접히고 펼쳐질 때 모양을 갈아 끼우는 대신 바탕 껍데기(.shell)가 늘어나고 줄어든다(morph.js — FLIP · transform만, 창은 커질 때 먼저 · 작아질 때 나중에),
//   접힌 한 줄에 마우스를 올리면 살짝 커진다(창은 안 바꾼다 — 접힌 창에 여유). 움직임 줄이기면 전처럼 바로 바뀐다.
// claude-drafted: 2026-10-20 — C-15 플로로에게 먹이 주기 · C-16 도서관의 책(이재엽 "설계도는 너무 어려운 말 … 파일을 오버레이에 주면 … 분석을 시작하는거야 … 기능을 한곳에 통합시켜줘",
//   넘김 문서 fable-handoff-2026-10-20-feed.md): ① 처음 카드가 **먹이 주기** 화면 — 파일을 끌어다 놓거나 글을 붙여 넣으면 feed.js가 구간으로 나눠 주제 · 비밀값 · 개인적인 일을 표시하고,
//   사람이 구간마다 고친 뒤 확인하면 빠진 구간 없이 어디쯤인지 본다(정리는 책의 '받은 먹이'로 — 빠진 구간의 글은 어디에도 남기지 않는다) ② 단계 문서 탭을 없애고 도서관의 책 안에서
//   초안 · 고치기 · 다시 봐 줌 · 확정(FR-3 그대로, draft · review · confirmDoc) ③ 화면 글에서 '설계도'를 뺐다 — 단계 문서(아이디어 정리표 …)로. 코드 이름(doc · /api/draft)은 그대로.
// claude-drafted: 2026-10-21 — C-22 게임식 디자인 1차 뼈대(이재엽 "지금부터 만들어서 릴리즈", 결정: 창 셋 · 1단계부터 · 제자리에서 고치기. 설계는 game-overlay/quest-storyboard.md 10절):
//   ① 위 줄 하나(집 · 단계 띠 · 조개 · 📜 · 모아 보기 · ⚙ · 핀 · 접기) — 탭 넷 · 기본 화면의 단추 넷 · 레벨 오버레이(LV · EXP · 명령 네 칸)를 뺐다
//   ② 섬 = 왼쪽 큰 플로로(칭호 · 기분 글은 2026-10-25에 뺌) + 가운데 채팅(플로로 말 · 내 말 · 칩 · 입력 칸) — 지금 결정할 것 하나(momentToday · momentGate)가 플로로의 마지막 말, 단추가 칩
//   ③ 설정 창(⚙ · 자리 왼쪽 / 오른쪽) · 퀘스트 창(📜 · 반대쪽 · S/M/L · 탭 퀘스트 / 도전과제 / 서고) — 이 판은 섬 옆의 판(.win), Electron 둘째 · 셋째 창은 다음 판
//   ④ 처음 실행: 무엇을 만들지 말하기 → "퀘스트를 시작하시겠습니까?" → 1단계 퀘스트(받기 화면) → 받으면 공책 → 한 줄씩 묻기 → 완료 보고(판정은 전처럼 judge) → 넘어가기 전 확인 → 조개 +1 · 칭호 · 다음 장
//      → 2026-10-25 C-36: 원하는 것을 플로로에게(한 줄이 아니어도) → AI가 받은 글 전체로 1단계 초안(/api/start) → 제목이 주제인 1단계를 칸마다 확인만 → 저절로 완료 보고 → 관문 → 2단계(제목 = 주제)
//   규칙은 quest.js(순수) · navigator.js — 판정 · 넘어가기(FR-4) · 설계도 · 먹이 · 허락 카드 · 서고 · 모아 보기는 그대로 이어진다. 뽑기 · 꾸미기 · AI 퀘스트 제작은 다음 판
// claude-drafted: 2026-10-24 — C-35 오버레이는 일하는 자리(이재엽 "오버레이는 작업하는 공간이고 다른 곳들은 부가적인 기능" · "버튼 4개의 기능들을 다른곳으로 이동" ·
//   버튼 "맡길 일 퀘스트 하나로" · "채팅에서 전부"): 명령 네 칸을 뺐다 — 맡기기(준비 계획 · 맡길 일 · 허락 · 보고)는 채팅의 지금 말(momentPlan), 순서는 퀘스트 창의 '맡길 일' 퀘스트,
//   살피기는 위 줄(단계 띠 · '퀘스트' 단추) · 채팅의 완료 보고 칩, 책은 퀘스트 창의 책 탭, 배우기는 도전과제의 장마다 '관문 전에 알아 둘 것'(tutorial.js forChap)
(function () {
  const N = window.NavRules, S = window.NavScenario, C = window.NavSeal;
  // 새 규칙 파일 다섯(03-backend/navigator/glossary·understand·priority·alerts·tiers.js) — server.js가 내주는 목록에 있는지는 static-files.test.js가 확인한다
  const G = window.NavGlossary, U = window.NavUnderstand, P = window.NavPriority, A = window.NavAlerts, T = window.NavTiers;
  // 실사용(2026-10-19): 내 책 · 예시 책 지우기(../library/my-books.js), 느낀 점(notes.js). 둘 다 없어도 화면은 돈다(옛 동작)
  const M = window.FloeMine, NT = window.FloeNotes;
  const BV = window.FloeBookView;   // 책 보기 설정(C-9 · C-3, 2026-10-20) — ../library/book-view.js, 서고와 같은 설정을 읽는다
  // 기본 화면 · 섬의 움직임(2026-10-20): 알림 · AI 진행 판의 순수 함수(hub.js) · AI 진행의 한 줄 글(steps.js) · 움직임 규칙(morph.js). 없어도 화면은 돈다
  const HUB = window.FloeHub, STEPS = window.NavSteps, MO = window.FloeMorph;
  const CVP = window.FloeCanvas || null;   // 캔버스 끌어서 옮기기 · 크게 작게(F-66, canvas-pan.js) — 브라우저 판은 다시 그린 뒤 apply
  const FD = window.NavFeed;
  const QU = window.NavQuest;   // 퀘스트 규칙(C-22, 2026-10-21 — 03-backend/navigator/quest.js). 없으면 퀘스트 없이 전처럼 돈다
  // claude-drafted: 2026-10-23 — 이재엽 결정(C-26 · C-28 · C-29 · C-30): 책은 README를 받아 와 보여 주기만 · 레벨은 관문마다 +1 누적 · 명령 네 칸 맡기기 · 살피기 · 책 · 배우기 · 서재 잠시 뺌
  const RB = window.NavReadme;     // 내 작업 책(readme-book.js) — 없으면 책 탭에 README 칸이 없다
  const TU = window.NavTutorial;   // 배우기 — 기능마다 튜토리얼(tutorial.js)
  const SHELF_ON = false;          // 서재(서고 · 책장) 잠시 뺌 — 이재엽 2026-10-23 "서재는 지금은 못들어가고 버튼을 지우고 나중에 이 대회가 끝나면 열어서 작업". 대회 뒤 true로 다시 연다
  // 앱(Electron)이 옆 창 둘(설정 창 · 퀘스트 창)을 열 수 있으면(preload.js openWin, 2026-10-21 이재엽 "창 셋") 그 창으로, 아니면(브라우저 · 옛 앱) 섬 옆의 판으로
  const WINS = !!(window.floeApp && window.floeApp.openWin);
  const SM = window.NavStageMap;   // C-54 지도(stagemap.js, 2026-10-28) — 도전과제 탭의 카드 지도 · 준비된 퀘스트. 없으면 흐름(한눈에 보기)만
  const QS = window.NavQuestState;   // C-56 퀘스트 상태 넷(queststate.js, 2026-10-28 — 이재엽 버튼 "'옮김' 새 값"): 쓰기 · 옮겨 옴 · 건너뜀 · 먼저. 없으면 전처럼
  const BC = window.NavBaseCard;   // C-56 R-1 기준 카드(basecard.js, 2026-10-28 — 이재엽 버튼 "1단계 관문에서"): 1단계 관문의 카드 한 장 · docs/base.md
  const CY = window.FloeCarry;   // 지식 퀘스트 C-48 가져갈 것(carry.js, 2026-10-29) — 기준 다섯 · 오늘. 없으면 가져갈 것 카드 없이
  const FDOCS = window.FloeDocs;   // 단계 문서(C-37, 2026-10-25 — 03-backend/navigator/docs.js). 없으면 문서 올리기 없이
  const FP = window.FloePlan;   // 준비 계획 · 맡길 일 규칙(C-34 · C-32 · C-35, 2026-10-24 — 03-backend/navigator/plan.js). 없으면 채팅에 계획 칩이 없고 할 일 적기(AI 진행 판)만
  const AP = window.NavApprove;   // FR-17 승인 카드(2026-10-20) — 서버 없이 보일 예시 카드   // 먹이 주기(C-15, feed.js) — 없으면 글을 바로 본다
  const SESS = (() => { try { return window.sessionStorage; } catch { return null; } })();
  const PLACE_KEY = "floe:place", SEEN_KEY = "floe:alerts-seen";   // 이 창(섬)에만 — 기록(KEY)에는 넣지 않는다(다음에 켤 때는 늘 기본 화면)
  const STORE = (() => { try { return window.localStorage; } catch { return null; } })();
  const canLive = location.protocol.startsWith("http");
  // Electron 껍데기 안(2026-10-19, 02-frontend/electron — preload.js가 window.floeApp을 둔다): 뒤의 예시 코딩 도구 창을 숨기고 바탕을 투명하게(app.css .in-app)
  if (window.floeApp) document.documentElement.classList.add("in-app");
  if (window.floeApp && window.floeApp.platform) document.documentElement.classList.add(`plat-${window.floeApp.platform}`);   // 운영체제별 모양(app.css html.plat-win32)
  // 창의 투명한 자리(바탕 · 섬 바깥)에서는 클릭을 뒤 창으로 — Windows · Mac은 창 폭을 줄이지 않아(접힐 때 튀지 않게, 2026-10-22) 접힌 한 줄 양옆이 빈 창이다.
  // 앱이 통과시키는 동안에도 움직임은 오므로(forward) 섬 위로 오면 다시 끈다. Linux에서는 앱이 무시한다(main.js floe:thru)
  if (window.floeApp && window.floeApp.thru) {
    let thru = null;
    const bare = (t) => t === document.documentElement || t === document.body || t.id === "nav" || t.id === "fx";
    document.addEventListener("mousemove", (e) => { const on = bare(e.target); if (on !== thru) { thru = on; window.floeApp.thru(on); } }, { passive: true });
  }
  // Mac 노치(다이내믹 아일랜드, 2026-10-19 이재엽 결정): 앱이 노치 크기를 보내면 섬을 노치에 맞춘다(app.css html.notch). 브라우저 · 노치 없는 컴퓨터에는 오지 않는다
  if (window.floeApp && window.floeApp.onNotch) window.floeApp.onNotch((n) => {
    const h = document.documentElement;
    h.classList.add("notch"); h.style.setProperty("--notch-w", `${n.width}px`); h.style.setProperty("--notch-h", `${n.height}px`);
  });
  const DELAY = { greet: 6000, home: 15000, petit: 30000 };   // 저절로 접히기까지(밀리초). home은 설정 '접히기까지'(C-20)가 덮는다 — foldDelay()
  // C-20(2026-10-20, 이재엽 버튼 "단추로 고르기"): 펼친 섬이 접히기까지의 초 — 5 · 10 · 15 · 30 · 60, 기본 15(지금 값). 이 컴퓨터에만 저장. 한 줄 → 띠(30초)는 그대로 [제안]
  const FOLD_KEY = "floe:fold-delay", FOLD_CHOICES = [5, 10, 15, 30, 60];
  const readFold = () => { try { const v = Number(localStorage.getItem(FOLD_KEY)); return FOLD_CHOICES.includes(v) ? v : 15; } catch { return 15; } };
  let foldSec = readFold();
  const foldDelay = () => foldSec * 1000;
  // 창 자리 · 퀘스트 창 크기 · 받으면 바로 뜨기 · 이름(설정 창의 '○○ 님의 작업실') — 이 컴퓨터에만(C-22, 2026-10-21). 기록(KEY)에는 넣지 않는다
  const QAUTO_KEY = "floe:qwin-auto", NAME_KEY = "floe:name", LEVEL_KEY = "floe:level";
  const readLS = (k, d = "") => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } };
  const writeLS = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
  // 섬 자리(C-41 ②) — [말, 단추 그림]. 글자 기호(▲ ▼ ◀ ▶) 대신 선 아이콘(C-57, 2026-10-28)
  const CHEV = (deg) => `<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform:rotate(${deg}deg)"><path d="M5 12.5l5-5 5 5"/></svg>`;
  // 확인 · 빈 동그라미 · 지도 · 관문 아이콘 — 글자 기호(체크 · 동그라미 · 지도 · 문 모양 이모지) 대신 선 아이콘(C-57)
  const OK_ICON = '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>';
  const CIRCLE = '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="10" cy="10" r="6"/></svg>';
  const MAP_ICON = '<svg class="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg>';
  const GATE_ICON = '<svg class="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 20v-8.5a6 6 0 0 1 12 0V20"/><path d="M4 20h16"/><path d="M9.5 20v-7.5a2.5 2.5 0 0 1 5 0V20"/></svg>';
  const side = "right";   // 섬은 작업실 오른쪽만(2026-10-28 합의 — 위 · 아래 · 왼쪽 단추를 뺐다, C-62). quest.js SIDES는 저장값 호환용으로 남아 있다
  let qauto = readLS(QAUTO_KEY, "1") !== "0", userName = readLS(NAME_KEY, "").slice(0, 20);
  // C-53(2026-10-28): 작업실 세 칸 — 파일 칸 · 오른쪽 칸을 접었는지(이 컴퓨터에 기억), 글 칸의 줄 위치(상태 줄 — 다시 그릴 때만 보인다, 치는 동안은 그리지 않는다)
  let wnavOpen = readLS("floe:ws-nav", "1") !== "0", wsideOpen = readLS("floe:ws-side", "1") !== "0", caretLine = 0;
  const GR = window.FloeGreet;   // 켤 때 인사의 시간표 · 규칙(greet.js, C-10 2026-10-20). 없으면 인사 움직임 없이 카드만
  let greetSkip = null;         // 인사 움직임이 도는 동안만 — 누름 · Esc로 바로 끝낸다
  const PHONE = matchMedia("(max-width: 600px)");
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tocGo = 0, goShown = "";   // 목차 → 제목 줄 스크롤(ftoc-go)의 차례 번호 · 마지막으로 옮겨 간 번호
  const WS_PANES = [".wnav", ".wside"];   // 다시 그려도 스크롤을 지키는 작업실 옆 칸(파일 칸 · 오른쪽 칸). win.js에 같은 것
  // 파일 보기(.fv)의 글 칸 스크롤 — was 없이 부르면 읽고, was를 주면 같은 파일(data-f) · 같은 보기(코드 · md)일 때 되돌린다. win.js에 같은 것
  const fvScroll = (fv, was) => { const b = fv && fv.querySelector(".fv-code, .fv-md"); if (!was) return b ? { f: fv.dataset.f, c: b.className, top: b.scrollTop, left: b.scrollLeft } : null; if (b && b.className === was.c && fv.dataset.f === was.f) { b.scrollTop = was.top; b.scrollLeft = was.left; } };

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
    inbox: [], sorted: [],                         // FR-15 더함(2026-10-20): 확인할 먹이(종류를 붙였지만 아직 사람이 확인하지 않은 구간 — 글 포함, 이 브라우저에만) · 확인한 먹이(책의 칸으로)
    meal: null, fed: [],                           // 먹이 주기(C-15): 정리 중인 것(st.feed는 연결 — 이름이 겹쳐 meal) {sections, checks, marks, example}, 책에 꽂은 정리(주제 · 빠진 수 · 까닭 — 글은 없다)
    libDoc: null,                                  // 도서관의 책 안에서 여는 단계 문서(C-16) — 단계 번호
    project: "", back: "",                         // 알림에서 받은 프로젝트 폴더 이름, 다시 왔을 때 인사
    finished: false,                               // 7단계까지 모두 마쳤는가
    askConfirm: 0,                                 // 빈칸이 남은 단계 문서를 확정하려 할 때 — 남은 빈칸 수(한 번 더 묻는 중)
    textSize: 1,                                   // 글자 크기 배율(설정) — 브라우저 기본 글자 크기에 곱한다
    pets: 0, since: "",                            // 플로로와 교감: 쓰다듬은 횟수, 처음 만난 날
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
    place: "base", pane: "",                       // 기본 화면(base) · 바이브 코딩(vibe) — 펼친 섬에 어떤 판을 보이나(C-13, 2026-10-20). pane: 기본 화면 안의 알림 · AI 진행 판
    task: { text: "", lines: null, say: "", sent: "" }, apSure: "",   // FR-17(2026-10-20): 적은 할 일 · 정리한 요구 문장 · 한마디 · 넘긴 곳(프로젝트). apSure: 되돌리기 어려운 일에 '정말 허용'을 묻는 중인 카드
    // 퀘스트(C-22 1차 뼈대, 2026-10-21 — 규칙은 quest.js): 지금 퀘스트(장 하나 = 퀘스트 하나) · 처음 말한 것 · 무지개 조개. topic — 받은 글로 정한 주제(퀘스트 제목, C-36 2026-10-25)
    quest: null, idea: "", topic: "", shells: 0,
    results: {}, ship: null,                       // C-37(2026-10-25): 단계마다 보고한 결과(quest.js resultOf — 한곳에서 보기 · 도전과제 지도 · 문서) · 2단계를 마친 뒤 문서 올리기({phase: offer|sent, at}, 이 켜짐 동안만)
    docPrints: {}, restore: null,                  // C-49(2026-10-29): 쓴 단계 문서의 글 지문 {경로: 지문} · 폴더의 기록 카드({phase: offer|stale, …}, 이 켜짐 동안만)
    carry: null, carryOffer: null, carryUse: {}, carryDone: false,   // C-48(2026-10-29): carryDone — 이 프로젝트에서 가져갈 것을 다 정함. 8단계 가져갈 것 카드 · 단계에 들어설 때 지난 프로젝트에서 가져온 것 카드(이 켜짐 동안만) · 이번에 쓰기로 고른 것 {단계: [{id, text}]} — C-51 계획의 근거
    owned: [], wear: {}, gacha: null,               // 뽑기 · 꾸미기(C-22): 얻은 것(아이디) · 입은 것 {자리: 아이디} · 뽑기 창 {phase: ready|rolling|got, item}
    // 창 둘(설정 창 st.settings · 퀘스트 창 st.qwin) · 퀘스트 창의 탭 · 채팅 기록(이 켜짐 동안만 — 기록에는 안 남긴다) · 채팅 칸의 글
    qwin: false, qtab: "canvas", boot: null, prep: null, islBig: null, tidy: null, chatMark: 0, chatChanges: [], chatOpen: null, chatGo: null, fnAll: false, /* islBig · tidy · chatMark — C-61(2026-10-29): 섬을 크게(null이면 저절로) · 정리 카드 · 이 단계 대화가 시작된 자리 */ mapSel: null, card: null, cardEdits: {}, chat: [], say: "", rb: null, rbSel: 0, tuSel: "", files: null, fnOpen: [], fnFind: "", openFiles: [], fileSel: -1,   // files · fnOpen — 작업실 파일 칸(R-8)의 목록과 펼친 폴더, fnFind · openFiles · fileSel — 파일 찾기 · 열린 파일(C-43)(이 켜짐 동안만)   // rb · tuSel — 책 탭의 README · 도전과제의 '알아 둘 것'에서 펼친 기능(이 켜짐 동안만)
    gh: null, ghVis: "private", ghNote: "",         // 설정의 GitHub 칸(C-25, 2026-10-24): 서버가 본 상태(/api/github) · 새 저장소의 공개 범위 · 맡긴 뒤 한 줄(이 켜짐 동안만)
    plan: null, planDraft: "", planReadme: true, planRej: "", planRejNote: "", planBusy: "", planAsk: "", planQ: "", planAns: {}, planReply: {}, study: null, gpSel: null,   // planBusy: 무엇을 기다리나(make · hand · ask) · planAsk/planQ: 물어보는 줄과 질문 · planAns: 줄마다 받은 답 · planReply: Claude Code가 물은 것에 적는 답(이 켜짐 동안만)   // 준비 계획판(C-34 · C-32, 2026-10-24): 판(plan.js) · 한 번에 넣은 글 · README도 읽나 · '다르게 봐요'를 여는 줄과 그 의견
    qfocus: "stage", planSel: "",                   // C-35: 지금 할 퀘스트(stage 단계 퀘스트 · plan 준비 계획과 맡길 일 — 채팅의 지금 말이 이쪽을 따른다) · 퀘스트 창에서 고른 맡길 일(이 켜짐 동안만)
  };
  // 예시 책을 지웠나(my-books.js HIDE_KEY) — 기록(save)에 넣지 않고 따로 둔다: 서고 화면과 같은 열쇠를 읽는다. 주소 끝 &noex는 이 화면만 숨긴다(저장하지 않음)
  let exHidden = M ? M.readHidden(STORE) : false;
  // 책 보기 설정(C-9 · C-3) — 기록(save)에 넣지 않고 따로 둔다: 서고 화면과 같은 열쇠(book-view.js KEY)를 읽는다. bvOpen: 설정 판을 펼쳤나, bvTab: 탭 구조에서 고른 칸
  let bv = BV ? BV.read(STORE) : null;
  st.bvOpen = false; st.bvTab = "";
  // 느낀 점 목록 — 따로 둔다(기록 지우기와 별개). 새것이 위
  let noteList = NT ? NT.read(STORE) : [];
  // 만드는 크기 [보내는 값, 화면 이름] — tiers.js
  const TIERS = T.LABELS;
  // 지금 등급의 할 일 목록 — 단계 n
  const crits = (n) => N.criteriaFor(n, st.tier);
  const $nav = document.getElementById("nav"), $phone = document.getElementById("phone"), $chat = document.getElementById("chat");

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
  let colHover = false, colTyping = false;   // 작업실 옆 칸(win.js)에서 온 '마우스 올림' · '글 쓰는 중' — 섬 창의 hovering · typing과 같은 뜻(C-46, 새 맥락 리뷰 2026-10-27 막힘: 옆 칸에 글을 쓰는 중에도 접혔다)
  // apWait · blocked · stall — 허락 카드 · 막힌 일 · 멈춘 것 같은 일은 사람이 고를 때까지 접지 않는다(F-69 · C-50, 새 맥락 리뷰 2026-10-28 — 전에는 15초 뒤 알약으로 접혀 카드가 안 보였다)
  const pinned = () => st.userPin || !!st.apWait || !!(st.blocked && !st.blocked.retrying) || !!(st.stall && st.stall.lv !== "calm" && st.stall.wait !== st.stall.lv) || st.screen === "gate" || !!st.warn || st.busy || (allDone() && !holding()) || st.settings || (st.qwin && !WINS) || !!st.gacha || st.openInput || typing() || colTyping;   // 앱의 작업실(옆 칸)은 열려 있어도 접힌다 — C-46 R-2(이재엽 버튼 "설정의 시간대로"). 브라우저의 옆 판은 전처럼 붙든다
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
  // 단계 번호는 화면에 1~8로(이재엽 2026-10-21 "단계는 1단계부터 시작" — quest.js LABEL). 코드의 n(0~7) · 기록 · 서버는 그대로
  const LB = (n) => (QU ? QU.LABEL(n) : `${n}단계`);
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
    sub: SHELF_ON ? "다 만든 책은 서재의 서고에 꽂아 두고 언제든 다시 펼쳐 볼 수 있어요." : "다 만든 책은 위 줄의 '퀘스트' 단추 → 책 탭에서 언제든 다시 펼쳐 볼 수 있어요.", more: SHELF_ON ? "서재로 가기" : "책 보기" };
  const END_ACT = SHELF_ON ? "lib-enter" : "cmd-book";

  // ── 기록 — 이 브라우저에만. 못 쓰는 환경(사생활 보호 창 등)이면 조용히 기록 없이 동작한다 ──
  const KEY = "navigator-prototype:v1";
  // 서재의 '내 책'(../library/my-books.js)도 이 열쇠를 읽는다 — 바꾸면 my-books.js의 KEY도(my-books.test.js가 맞대어 본다)
  // 한 권으로 엮어 서고로 보낸 책 — 서고 시안(../library)도 같은 열쇠를 읽어 처음부터 책장에 꽂아 둔다
  const BOUND_KEY = "floe-demo:bound";
  const readBound = () => { try { const v = JSON.parse(localStorage.getItem(BOUND_KEY) || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
  const writeBound = (id) => { try { localStorage.setItem(BOUND_KEY, JSON.stringify([...new Set([...readBound(), id])])); } catch {} };
  const CHAT_KEY = `${KEY}:chat`;   // C-63 — 연습 모드의 대화는 따로 저장(넘쳐도 다른 저장을 막지 않게 — 새 맥락 리뷰)
  const KEEP = ["mode", "textSize", "text", "j", "todos", "history", "learned", "auto", "doc", "docs", "project", "pets", "since", "finished", "libGone",
    "checks", "hold", "todoLater", "alerts", "tier", "unplug", "judged", "fed", "inbox", "sorted", "quest", "idea", "shells", "owned", "wear", "plan", "planDraft", "planReadme", "qfocus", "topic", "results", "prep", "source", "card"];   // prep — 준비된 퀘스트(C-54)
  let forgotten = false;
  // 기능 조각이 저장할 것을 더한다(새 기능은 KEEP 한 줄 대신 자기 조각 맨 위에서 — 2026-10-29 나누기 2차). load는 이미 지나갔으니
  // load가 읽어 둔 기록(saved)에서 그 키의 값을 가져온다 — 그사이 save가 있었어도 잃지 않는다. save는 KEEP 전체를 쓴다
  let saved = null;
  function keep(keys) {
    for (const k of keys) { if (!KEEP.includes(k)) KEEP.push(k); if (saved && k in saved) st[k] = saved[k]; }
  }
  // 누르기 표 — data-act 이름 → 할 일. 공통은 90-acts.js, 기능의 누르기는 그 조각이 Object.assign(ACT, { … })로 더한다
  const ACT = {};
  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return; }
    if (!s || typeof s !== "object") return;
    saved = s;
    if (s.j && !(N.STAGES[s.j.stage] && Array.isArray(s.j.criteria))) delete s.j;   // 고장 난 기록은 버린다
    for (const k of KEEP) if (k in s) st[k] = s[k];
    try { st.chat = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]"); } catch { st.chat = []; }
    if (!Array.isArray(st.chat)) st.chat = [];   // C-63 — 저장된 대화. 고장 난 기록은 버린다
    st.chat = st.chat.filter((m) => m && typeof m.html === "string" && ["me", "floro", "sys"].includes(m.who));   // who는 class에 들어간다 — 셋만
    if (st.mode === "live" && !canLive) st.mode = "fixture";
    st.pets = Math.max(0, Number(st.pets) || 0);
    st.libGone = [...new Set([...(Array.isArray(st.libGone) ? st.libGone.map(String) : []), ...readBound()])];
    for (const k of ["checks", "todoLater", "alerts", "fed", "inbox", "sorted"]) if (!Array.isArray(st[k])) st[k] = [];
    st.plan = FP && st.plan ? FP.revive(st.plan) : null;   // 고장 난 계획판은 버린다
    if (typeof st.planDraft !== "string") st.planDraft = "";
    st.planReadme = st.planReadme !== false;
    if (st.qfocus !== "plan" || !FP) st.qfocus = "stage";
    if (!st.hold || typeof st.hold.when !== "string") st.hold = null;
    if (!TIERS.some(([v]) => v === st.tier)) st.tier = "Full";
    if (st.j) st.j = T.refit(st.j, st.tier);   // 할 일 목록이 바뀌었으면(등급·규칙) 지금 목록에 맞춘다 — 글자가 같은 할 일만 이어 간다
    st.unplug = !!st.unplug;
    if (typeof st.judged !== "string") st.judged = "";
    // 퀘스트(C-22) — 고장 난 기록은 버린다. 다 보고한 퀘스트(done)는 지금 단계 것이어야 한다
    if (st.quest && !(QU && N.STAGES[st.quest.chap] && Array.isArray(st.quest.objs) && Array.isArray(st.quest.lines) && st.quest.objs.length === st.quest.lines.length)) st.quest = null;
    if (st.quest) st.quest = { ...st.quest, edit: false };
    st.shells = Math.max(0, Number(st.shells) || 0);
    if (Array.isArray(st.alerts)) st.alerts = st.alerts.filter(A.notifies);   // 2026-10-23 전에 남은 '새 작업을 시작했어요'는 버린다 — 알림은 마칠 때만
    st.owned = QU ? QU.cleanOwned(st.owned) : []; st.wear = QU ? QU.cleanWear(st.wear) : {};
    if (typeof st.idea !== "string") st.idea = "";
    if (typeof st.source !== "string") st.source = "";
    if (st.card && typeof st.card !== "object") st.card = null; st.cardEdits = {};
    if (typeof st.topic !== "string") st.topic = "";
    st.results = st.results && typeof st.results === "object" && !Array.isArray(st.results)
      ? Object.fromEntries(Object.entries(st.results).filter(([k, r]) => N.STAGES[k] && r && Array.isArray(r.items) && r.items.every((x) => x && typeof x.name === "string" && Array.isArray(x.lines)))) : {};   // 고장 난 결과는 버린다
    st.back = N.welcome(s, Date.now());
  }
  function save() {
    if (forgotten) return;
    const o = { at: Date.now() };
    for (const k of KEEP) o[k] = st[k];
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {}
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(st.chat)); } catch { const over = st.chat.length - 100; st.chat = st.chat.slice(-100); if (over > 0) st.chatMark = Math.max(0, (st.chatMark || 0) - over); }   // 대화가 넘치면 대화만 줄인다 — 다른 저장은 그대로. 표시 자리도 같이 당긴다(logMsg와 같이, F-103-26)
    postState();
  }
  // C-38 시험판(2026-10-25, 두승현) — 서버에 지금 상태를 알린다: MCP로 이은 AI(Claude Desktop · 터널을 연 웹 GPT · 웹 Claude)가 floe_now로 읽는다. 바뀌었을 때만 보낸다
  let lastState = "";
  function postState() {
    if (!canLive || !QU) return;
    const q = st.quest, i = q ? QU.curIdx(q) : -1;
    const k = JSON.stringify({ project: project(), mode: st.mode, stage: q ? q.chap : st.j ? st.j.stage : null,
      quest: q ? { chap: q.chap, title: q.title, phase: q.phase, objs: q.objs.map((o) => ({ name: o.name, need: o.need })), lines: q.lines, cur: i, ask: i >= 0 ? QU.question(q, i) : "" } : null });
    if (k === lastState) return;
    lastState = k;
    fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: k, credentials: "same-origin" }).catch(() => {});
  }
  load();
  // 레벨은 사람에게(C-28, 이재엽 2026-10-23 버튼 "누적 — 관문마다 +1") — 기록(KEY)과 따로 이 컴퓨터에. 기록을 비워도 · 프로젝트를 바꿔도 줄지 않는다
  let level = QU ? QU.startLevel(Number.parseInt(readLS(LEVEL_KEY, ""), 10), st.j, st.finished) : 0;
  if (QU && st.mode !== "fixture") writeLS(LEVEL_KEY, level);   // 연습 모드(예시 기록)는 영구 레벨을 쓰지 않는다 — 이 켜짐 동안만
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
  const { icon, I, SHELL_ICO, coin } = window.FloeIcons;   // 선 아이콘 · 무지개 조개 — icons.js(2026-10-30 나누기 3차에서 떼어 냄)

  // ── 접힘·펼침 (PC 화면만) ──
  let hovering = false, timer = null, lastUi = null;
  function clearIdle() { clearTimeout(timer); timer = null; }
  function scheduleIdle() {
    if (greetSkip) return;   // 켜질 때 인사 움직임이 끝난 뒤부터 센다(C-10)
    clearIdle();
    // 마우스가 올라가 있으면 인사도 접지 않는다(플로로를 쓰다듬는 중에 사라지지 않게). 떠나면 다시 센다
    if (isPhone() || st.ui === "hidden" || hovering || colHover || (st.ui !== "greet" && pinned())) return;
    if (WINS && st.qwin && st.ui === "petit") return;   // 작업실 안의 접힌 알약은 더 접히지(hidden) 않는다 — 옆 칸은 마우스 올림을 보내지 않아 되살릴 길이 없다(새 맥락 리뷰 2026-10-27 막힘)
    timer = setTimeout(() => { timer = null; view("idle"); }, st.ui === "home" ? foldDelay() : DELAY[st.ui]);
  }
  function go(ui) { if (ui !== st.ui) { st.ui = ui; clearIdle(); } render(); }
  const view = (ev) => go(N.nextView(st.ui, ev, pinned()));   // 일(enter·click·esc·idle·alert)에 따라 다음 모습으로
  // 알릴 일이 생기면 접혀 있던 것(띠·인사)만 한 줄로 살짝 보인다 — 펼쳐져 있으면 그대로
  const peek = () => go(st.ui === "hidden" || st.ui === "greet" ? "petit" : WINS && st.qwin && st.ui === "petit" ? "home" : st.ui);   // 작업실 안의 접힌 알약은 알릴 일이 오면 펼친다(C-46 R-2 — 새 맥락 리뷰)
  // 모드 바꾸기(C-13) — 규칙은 navigator.js nextPlace. 바꾸면 이 창에 기억한다(판은 닫는다)
  function setPlace(ev) {
    const p = N.nextPlace(st.place, ev);
    if (p !== st.place) { st.place = p; st.pane = ""; try { if (SESS) SESS.setItem(PLACE_KEY, p); } catch {} }
  }
  $nav.addEventListener("mouseenter", () => { hovering = true; clearIdle(); view("enter"); });
  $nav.addEventListener("mouseleave", () => { hovering = false; render(); });

