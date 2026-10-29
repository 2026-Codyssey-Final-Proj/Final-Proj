// 묶은 파일 — 고치려면 app/ 조각을 고치고 `node 02-frontend/navigator/app-parts.js join` (직접 고쳤으면 split). 조각마다 아래 '━━ app/…' 줄에서 시작한다
// ━━ app/00-base.js ━━
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
    plan: null, planDraft: "", planReadme: true, planRej: "", planRejNote: "", planBusy: "", planAsk: "", planQ: "", planAns: {}, planReply: {},   // planBusy: 무엇을 기다리나(make · hand · ask) · planAsk/planQ: 물어보는 줄과 질문 · planAns: 줄마다 받은 답 · planReply: Claude Code가 물은 것에 적는 답(이 켜짐 동안만)   // 준비 계획판(C-34 · C-32, 2026-10-24): 판(plan.js) · 한 번에 넣은 글 · README도 읽나 · '다르게 봐요'를 여는 줄과 그 의견
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
  const KEEP = ["chatMark", "chatOpen", "mode", "textSize", "text", "j", "todos", "history", "learned", "auto", "doc", "docs", "project", "pets", "since", "finished", "libGone",
    "checks", "hold", "todoLater", "alerts", "tier", "unplug", "judged", "fed", "inbox", "sorted", "quest", "idea", "shells", "owned", "wear", "plan", "planDraft", "planReadme", "qfocus", "topic", "codeless", "linesDone", "carryDone", "carryUse", "docPrints", "results", "prep", "source", "card"];   // prep — 준비된 퀘스트(C-54)
  let forgotten = false;
  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return; }
    if (!s || typeof s !== "object") return;
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
    if (!st.docPrints || typeof st.docPrints !== "object" || Array.isArray(st.docPrints)) st.docPrints = {};
    if (!st.carryUse || typeof st.carryUse !== "object" || Array.isArray(st.carryUse)) st.carryUse = {};
    st.carryDone = st.carryDone === true;
    st.results = st.results && typeof st.results === "object" && !Array.isArray(st.results)
      ? Object.fromEntries(Object.entries(st.results).filter(([k, r]) => N.STAGES[k] && r && Array.isArray(r.items) && r.items.every((x) => x && typeof x.name === "string" && Array.isArray(x.lines)))) : {};   // 고장 난 결과는 버린다
    st.back = N.welcome(s, Date.now());
  }
  function save() {
    if (forgotten) return;
    const o = { at: Date.now() };
    for (const k of KEEP) o[k] = st[k];
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {}
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(st.chat)); } catch { st.chat = st.chat.slice(-100); }   // 대화가 넘치면 대화만 줄인다 — 다른 저장은 그대로
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
    // 기본 화면(2026-10-20, C-13) — 위쪽 줄 맨 왼쪽의 집 단추
    home: icon('<path d="M4 11l8-7 8 7"></path><path d="M6 10v10h12V10"></path><path d="M10 20v-6h4v6"></path>', 20),
    // 퀘스트 창(C-22, 2026-10-21) — 두루마리. 설정 창의 '창 · 퀘스트' 머리에 쓴다(위쪽 줄의 단추는 2026-10-23에 뺐다)
    scroll: icon('<path d="M6 3h11a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2z"></path><path d="M8 8h8M8 12h6"></path>', 18),
  };
  // 무지개 조개 — 우리 재화의 그림(2026-10-23, 이재엽 "무지개 조개를 이미지를 만들어서 우리만의 재화를 보여줘"). 무지개 여섯 빛의 부채꼴 조개.
  //   class는 'coin' — 'shell'은 섬의 바탕 껍데기(.nav .shell, 단추 뒤로 숨는다)라 겹치면 위 줄에 수만 보였다
  const SHELL_ICO = '<svg viewBox="0 0 24 24" stroke="#33406E" stroke-width=".85" stroke-linejoin="round"><path fill="#FF9AA2" d="M12 19.9L23.6 14.7Q24.2 11.4 20.8 10.8Z"/><path fill="#FFC48A" d="M12 19.9L20.8 10.8Q20.1 7.4 16.8 8.1Z"/><path fill="#FFE38A" d="M12 19.9L16.8 8.1Q14.8 5.3 12.0 7.2Z"/><path fill="#B8EFA0" d="M12 19.9L12.0 7.2Q9.2 5.3 7.2 8.1Z"/><path fill="#9ADFFF" d="M12 19.9L7.2 8.1Q3.9 7.4 3.2 10.8Z"/><path fill="#C9B2FF" d="M12 19.9L3.2 10.8Q-0.2 11.4 0.4 14.7Z"/><path fill="#C9B2FF" d="M8.6 18.3h6.8l1.5 3.4a.8.8 0 0 1-.7 1.1H7.8a.8.8 0 0 1-.7-1.1z"/></svg>';
  const coin = () => `<i class="coin" aria-hidden="true">${SHELL_ICO}</i>`;

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

// ━━ app/10-views.js ━━
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
  const ckItem = (ok, inner) => `<li><span class="ck ${ok ? "y" : "n"}">${ok ? OK_ICON : CIRCLE}</span><span>${inner}</span></li>`;
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
      ...(nx ? [["다음 단계", `${LB(nx.n)} ${nx.title} — ${nx.does}`]] : [])];
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
  // 설정 — 묶음별로 나눠 한눈에(6.2.0, 이재엽 2026-10-19 "설정창도 직관적으로"): 연결 · GitHub · 토큰 · 보기 · 알림 · 느낀 점 · 기록. PC·iPhone 모두 톱니 뒤에
  // '플로로와 나' 카드는 뺐다(2026-10-24 두승현 — 설정 창 머리와 겹침). 처음 만난 날(st.since)은 저장만 남긴다
  // 설정 칸 조각 — 묶음 · 한 줄(이름 + 작은 설명) · 단추 고르기 · 동그라미 고르기 · 상태 불 한 줄(2026-10-25 두승현 리팩토링: 같은 HTML을 칸마다 따로 찍던 것을 모음)
  const sgrp = (ic, title, body) => `<section class="sgrp"><h3 class="sg-h">${ic}${title}</h3>${body}</section>`;
  const srow = (label, control, small = "") => `<div class="srow"><span>${label}${small ? `<small>${small}</small>` : ""}</span>${control}</div>`;
  const pick = (label, items, cur, act) => `<span class="pick" role="group" aria-label="${label}">${items.map(([v, name]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${v === cur}">${name}</button>`).join("")}</span>`;
  const radios = (name, label, items, cur, tail = "") => `<span class="row tiers" role="radiogroup" aria-label="${label}">${items.map(([v, text]) =>
    `<label class="chk"><input type="radio" name="${name}" data-act="${name}" value="${v}" ${cur === v ? "checked" : ""}>${text}</label>`).join("")}${tail}</span>`;
  const ledRow = (led, text, tail = "") => `<div class="row"><span class="led${led ? ` ${led}` : ""}"></span><span class="grow">${text}</span>${tail}</div>`;
  const SG = {
    link: icon('<path d="M10 14a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1"></path><path d="M14 10a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1"></path>', 14),
    eye: icon('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle>', 14),
    box: icon('<path d="M4 7h16v13H4z"></path><path d="M4 7l2-3h12l2 3"></path><path d="M10 11h4"></path>', 14),
    bell: icon('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"></path><path d="M10 20a2 2 0 0 0 4 0"></path>', 14),
    git: icon('<circle cx="6" cy="6" r="2"></circle><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="8" r="2"></circle><path d="M6 8v8"></path><path d="M18 10a6 6 0 0 1-6 6H8"></path>', 14),
  };
  // GitHub 칸(C-25, claude-drafted: 2026-10-24 — 이재엽 "깃허브을 연동하는 곳을 설정창에") — Floe는 토큰을 받지 않는다. 서버가 이 컴퓨터의 git · gh에게 읽기만 묻고(/api/github, API.md 3-19),
  // 저장소 만들기는 사람이 누를 때만 사용자의 Claude Code에 맡긴다(/api/github/create → 일 넘기기 3-16). 서버 없이 열면 안내만
  let ghLoading = false;
  async function loadGithub() {
    if (!canLive) return;
    ghLoading = true;
    try { st.gh = await (await fetch("/api/github", { cache: "no-store" })).json(); } catch { st.gh = { ok: false }; }
    ghLoading = false; render();
  }
  async function createRepo() {
    st.ghNote = "Claude Code에 맡기는 중…"; render();
    let r;
    try { r = await (await fetch("/api/github/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibility: st.ghVis }) })).json(); }
    catch { r = { ok: false, reason: "서버에 닿지 않았어요" }; }
    st.ghNote = r && r.ok ? "Claude Code에 맡겼어요 — 허락을 구하면 섬에 떠요. 끝나면 '다시 확인'을 눌러요." : `맡기지 못했어요 — ${(r && r.reason) || "까닭을 모름"}`;
    if (r && r.ok) watchTask(r.task, "repo");
    render();
    return r;   // 처음 설정에서 부른 쪽(floe:setup-done)이 맡겼는지 보고 말한다
  }
  const GH_CLI = "https://cli.github.com";
  function githubGroup() {
    const box = (body) => sgrp(SG.git, "GitHub", body);
    if (!canLive) return box(`<span>서버로 열면(앱 · floe.js) 연결한 프로젝트 폴더가 GitHub 저장소와 이어졌는지 보여요. Floe는 GitHub 비밀번호 · 토큰을 받지 않아요.</span>`);
    if (!st.gh && !ghLoading) setTimeout(loadGithub, 0);
    const g = st.gh;
    const again = `<button type="button" class="btn" data-act="gh-reload">다시 확인</button>`;
    if (!g) return box(ledRow("", "확인하는 중…"));
    if (!g.ok) return box(ledRow("off", "서버에 닿지 않았어요", again));
    const cli = !g.gh.found ? ledRow("off", "GitHub CLI(gh)가 없어요 — 설치하면 저장소 만들기를 Claude Code에 맡길 수 있어요", `<a class="btn" href="${GH_CLI}" target="_blank" rel="noopener">설치 안내</a>`)
      : !g.gh.signedIn ? ledRow("off", "GitHub에 로그인이 필요해 보여요 — 터미널에서 <code>gh auth login</code> 한 번")
      : ledRow("on", "GitHub CLI에 로그인됨");
    const where = g.project ? `${esc(g.project)} 폴더` : "프로젝트 폴더";
    let repo;
    if (g.why === "folder") repo = `<span>작업 폴더를 아직 몰라요 — 처음 설정의 '프로젝트'나 위의 '프로젝트 폴더 연결…'로 골라요.</span>`;
    else if (g.why === "no-git") repo = `<span>이 컴퓨터에 git이 없어요 — Claude Code에 "git 설치를 도와줘"라고 물어봐요.</span>`;
    else if (g.remote && g.remote.kind === "github") repo = `${ledRow("on", `${where} → <b>${esc(g.remote.owner)}/${esc(g.remote.repo)}</b>`, `<a class="btn" href="${esc(g.remote.web)}" target="_blank" rel="noopener">GitHub에서 열기</a>`)}
      <span class="meta">기록 · 저장은 이 저장소의 README와 커밋으로 남아요. 올리는 일은 Claude Code가 하고, Floe는 읽기만 해요.</span>`;
    else if (g.remote) repo = ledRow("", `${where}는 GitHub가 아닌 곳과 이어져 있어요 — 그대로 써도 되고, 책(README)은 똑같이 읽혀요.`);
    else {
      const can = g.gh.found && g.gh.signedIn, live = st.mode === "live";
      repo = `${ledRow("off", `${where}는 ${g.why === "not-repo" ? "아직 git 저장소가 아니에요" : "아직 GitHub 저장소와 이어지지 않았어요"}`)}
      ${srow("공개 범위", pick("새 저장소의 공개 범위", [["private", "비공개"], ["public", "공개"]], st.ghVis, "gh-vis"))}
      <div class="row"><button type="button" class="btn pri" data-act="gh-create" ${can && live ? "" : "disabled"}>저장소 만들어 달라고 Claude Code에 맡기기</button></div>
      <span class="meta">${!can ? "위의 GitHub CLI 준비가 먼저예요. " : !live ? "보기 방식을 '진짜 AI'로 바꾸면 맡길 수 있어요(Claude Code가 움직여요). " : ""}README 첫 장을 만들고 .env 같은 비밀값 파일은 빼고 올려요. 강제 푸시 · 지우기는 하지 않아요.</span>`;
    }
    return box(`${cli}${repo}${st.ghNote ? `<span class="meta" role="status">${esc(st.ghNote)}</span>` : ""}<div class="row"><span class="grow"></span>${again}</div>`);
  }
  // 토큰 칸(2026-10-24, 이재엽 "테스트를 진행하면서 토큰값도 계산을 할거야") — 서버의 토큰 장부(/api/usage의 ledger, tokens.js)를 보이기만 한다.
  // Floe의 AI와 Claude Code에 맡긴 일을 따로, 비용은 Claude Code가 알려 준 값만. '새로 재기'는 테스트를 시작할 때 0부터(POST /api/usage/reset)
  let usage = null, usageLoading = false;   // /api/usage의 답 — 설정을 열 때 · AI를 부른 뒤 · Claude Code가 일을 마쳤을 때 다시 묻는다
  function tokenGroup() {
    if (!canLive) return "";
    if (!usage && !usageLoading) setTimeout(fetchUsage, 0);
    const v = usage && window.NavTokenView && window.NavTokenView.ledgerView ? window.NavTokenView.ledgerView(usage.ledger) : null;
    const box = (body) => sgrp(SG.box, "토큰", body);
    if (!v) return box(`<span>${!usage ? "확인하는 중…" : usage.ok === false ? "서버에 닿지 않았어요 — 설정을 다시 열면 다시 물어요" : "이 서버는 아직 토큰을 세지 않아요"}</span>`);
    const reset = `<button type="button" class="btn" data-act="tokens-reset">새로 재기</button>`;
    if (v.empty) return box(`<div class="row"><span class="grow">${v.since} 뒤로 아직 쓴 토큰이 없어요. Floe의 AI를 부르거나 Claude Code에 일을 맡기면 여기 쌓여요.</span>${reset}</div><span class="meta">${esc(v.note)}</span>`);
    return box(`<div class="row"><span class="grow"><b>${esc(v.total)}</b> <span class="meta">${v.since}부터</span></span>${reset}</div>
      ${v.rows.map((r) => srow(esc(r.name), `<span>${esc(r.value)}</span>`)).join("")}
      <ul class="tok-runs">${v.recent.map((line) => `<li class="meta">${esc(line)}</li>`).join("")}</ul><span class="meta">${esc(v.note)}</span>`);
  }
  async function resetTokens() {
    try { const j = await (await fetch("/api/usage/reset", { method: "POST" })).json(); if (j && j.ok && usage) usage = { ...usage, ledger: j.ledger }; } catch {}
    render();
  }
  // 묶음 하나씩 — 휴대폰은 settingsBody로 전부 이어서, PC 설정 판(settingsPane)은 고른 탭의 것만 부른다
  function linkGroup() {
    // 연결 칸 — 서버로 열었으면 보기 방식과 상관없이 보인다(연습 중에도 알림은 들어오니까). '연결 끊기'를 누르면 들어온 알림을 받지 않는다
    const link = canLive ? sgrp(SG.link, "연결", `${ledRow(conn(), st.unplug
        ? "연결을 끊었어요 — 작업 알림이 와도 글 칸을 채우거나 살펴보지 않아요"
        : st.feed.at ? `${toolName(st.feed.tool)}와 연결됨 · ${esc(wsFull() || st.feed.project || "프로젝트")} · 마지막 알림 ${ago(st.feed.at)}${st.feed.project && wsFull() && st.feed.project !== wsFull() ? `(${esc(st.feed.project)}에서)` : ""}`   // 이름은 연결한 폴더 먼저 — 마지막 알림이 다른 폴더에서 왔으면 그 이름은 뒤에(F-73)
        : "Claude Code·Codex 알림을 기다리는 중 — connect.js로 연결해 주세요",
        `<button type="button" class="btn" data-act="unplug" aria-pressed="${st.unplug}">${st.unplug ? "다시 연결" : "연결 끊기"}</button>`)}
      ${st.mode === "live" ? `<label class="chk"><input type="checkbox" data-act="auto" ${st.auto ? "checked" : ""} ${st.unplug ? "disabled" : ""}>AI 코딩 도구가 작업을 마치면 자동으로 살펴보기</label>
      <span>켜면 그때마다 최근 작업 대화가 AI(Claude)로 보내져요. 비밀번호처럼 보이는 게 있으면 보내기 전에 멈춰요.</span>` : ""}${
      // 앱 안에서는 폴더 고르기로 훅을 더하고 뺀다(터미널의 floe.js · connect.js와 같은 일) — preload.js가 열어 준 셋만
      window.floeApp ? `<div class="row"><button type="button" class="btn" data-act="app-connect">프로젝트 폴더 연결…</button><button type="button" class="btn" data-act="app-disconnect">연결 빼기…</button><button type="button" class="btn" data-act="app-settings">.env 폴더 열기</button></div>` : ""}`) : "";
    return link;
  }
  function keepGroup() {
    // 처음 설정(setup.js) 다시 하기 — Claude Code / API 키를 바꿀 때 (2026-10-19)
    const keep = sgrp(SG.box, "기록 · 처음 설정", `${window.FloeSetup ? `<div class="row"><span class="grow">AI를 어떻게 부를지(Claude Code / API 키) 다시 고를 수 있어요.</span><button class="btn" data-act="setup">처음 설정 다시 하기</button></div>
      <div class="row"><span class="grow">다른 프로젝트로 — 내 GitHub 저장소를 가져오거나 새로 만들어요(C-31).</span><button class="btn" data-act="setup-project">프로젝트 바꾸기</button></div>` : ""}<div class="row"><span class="grow">기록은 이 컴퓨터의 브라우저에만 남아요.</span><button class="btn" data-act="forget">기록 지우기</button></div>`);
    return keep;
  }
  function viewGroup() {
    // 만드는 크기 — 진짜 AI에게 물을 때 같이 보낸다(tier). 고르는 건 사용자
    const tier = srow("만드는 크기", radios("tier", "만드는 크기", TIERS, st.tier, termTag(st.tier)));
    const view = sgrp(SG.eye, "보기", `${srow("보기 방식", `<select data-act="mode" aria-label="보기 방식">
        <option value="fixture" ${st.mode === "fixture" ? "selected" : ""}>연습용 예시</option>
        <option value="live" ${st.mode === "live" ? "selected" : ""} ${canLive ? "" : "disabled"}>진짜 AI (Claude)${canLive ? "" : " — server.js를 켜야 해요"}</option></select>`)}
      ${srow("글자 크기", `<select data-act="text-size" aria-label="글자 크기">${TEXT_SIZES.map(([v, name]) =>
        `<option value="${v}" ${st.textSize === v ? "selected" : ""}>${name}</option>`).join("")}</select>`)}
      ${srow("접히기까지", `<span class="row tiers fold" role="group" aria-label="펼친 섬이 접히기까지">${FOLD_CHOICES.map((v) => `<button type="button" class="b fold-opt" data-act="fold-delay" data-i="${v}" aria-pressed="${foldSec === v}">${v}초</button>`).join("")}<span class="meta">마우스가 나간 뒤 그 시간이 지나면 접혀요</span></span>`)}
      ${tier}
      <div class="row">${modeBadge()}<span class="grow">안내 기준은 아직 시험판이에요</span></div>`);
    return view;
  }
  const logGroup = () => sgrp(SG.bell, "알림 · 느낀 점", `${alertLog()}${notesCard()}`);
  const settingsBody = () => `${linkGroup()}${githubGroup()}${tokenGroup()}${viewGroup()}${logGroup()}${keepGroup()}`;
  // 알림 기록(FR-7) — [때 · 도구 · 무슨 알림 · 서버가 준 한 줄 · 이 알림으로 끝낸 할 일]. 비밀번호처럼 보이는 글은 숨긴 채로 남는다(alerts.js)
  const clock = (t) => (Number.isFinite(t) ? new Date(t).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }) : "");
  const alertItem = (a) => `<li><span class="meta">${clock(a.at)}</span> <b>${esc(toolName(a.tool))}${a.sim ? " · 연습 알림" : ""}</b> ${esc(A.KIND[a.kind] || "알림을 보냈어요")}${
    a.hidden ? `<span class="sub">비밀번호처럼 보이는 글이 있어 내용은 숨겼어요</span>` : a.line ? `<span class="sub">${esc(a.line)}</span>` : ""}${
    a.done && a.done.length ? `<span class="sub ok">${OK_ICON} 끝냈다고 표시함: ${esc(a.done.join(", "))}</span>` : ""}</li>`;
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
      <span class="dot ${stepClass(x.n)}"></span><span style="flex:1;padding:8px 0"><b>${LB(x.n)} · ${esc(x.title)}</b><span class="sub">${esc(x.does)}</span></span>
      ${stepClass(x.n) === "cur" ? `<span class="meta">${metCount()}/${met().length}</span>` : ""}</div>`).join("")}</div>`;
  // [id, PC 이름, iPhone 이름, 아이콘]. 마지막(도서관)은 PC에만 있다 — iPhone은 앞의 셋. 탭 순서가 바뀌면 고른 동그라미(.ti-ind)는 순서(tabIdx)를 따라간다
  // '내 배움' 탭은 2026-10-18에 뺐다(F-05, PRD 2-7) — '플로로와 나'(설정 맨 위)도 2026-10-24에 뺐다. 서재의 '내 배움'도 2026-10-19에 지움.
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
    if (st.step === "next") return [`<span class="ask">좋아요! 다음은 ${nx ? `${LB(nx.n)} "${esc(nx.title)}"` : "마무리"}예요</span>
      <span class="meta">무엇부터 할지 순서를 정해 보세요. 지금 안 해도 되는 일은 '나중에'로 미뤄 둬요.</span>${todoList(true)}`,
      `<button class="btn pri wide" data-act="go" ${N.canAdvance(met(), "yes") ? "" : "disabled"}>이 순서로 시작하기</button>`];
    return [learnBox(s.n), yesNo];   // C-47 배운 것 · 처음 뜻 — 좁은 화면에서도(새 맥락 리뷰: 칸 없이 '비어 있음'이 남았다)
  }
  const chips = () => `<div class="chips">${N.STAGES.map((x) => `<span class="chip ${stepClass(x.n)}">${stepClass(x.n) === "done" ? `${OK_ICON} ` : ""}${x.n + 1} ${esc(x.short)}</span>`).join("")}</div>`;
  const flow = () => { const s = stage(); return `<div class="flow"><div class="box"><b>받은 것</b>${esc(s.gets)}</div><span class="arrow">→</span>
    <div class="box"><b>한 일</b>${esc(s.does)}</div><span class="arrow">→</span><div class="box"><b>만든 것</b>${esc(gv(s))}${
    docDone(s.n) ? `<span class="sub ok">${OK_ICON} 문서 확정함</span>` : ""}</div></div>`; };
  // iPhone의 지금 결정할 것 하나 — 다 했으면 "넘어가기", 순서를 정했으면 그 첫 일, 아니면 같이 정하기
  function focusCard() {
    const n = st.j.next, now = esc(tick().now);
    if (st.finished) return box("다 했어요", END.title, END.sub, `<button class="btn pri wide" data-act="${END_ACT}">${END.more}</button>${
      st.mode === "fixture" ? `<button class="btn wide" data-act="${RESTART.act}">${RESTART.label}</button>` : ""}`);
    if (holding()) return box(esc(U.holdLine(st.hold, ymd())), "잠시 멈춰 뒀어요", HOLD.later, `<button class="btn pri wide" data-act="hold-resume">다시 이어 하기</button>`);
    if (allDone()) return box("다 했어요", `${LB(stage().n)} 할 일을 모두 했어요`, "넘어가기 전에 이번 단계를 이해했는지 한 번만 같이 확인해요.",
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
  const KEYCAP = { Enter: "Enter", Escape: "Esc", "c-Enter": "Ctrl+Enter" };
  const kbd = (k) => (k ? `<kbd aria-hidden="true">${KEYCAP[k] || k.toUpperCase()}</kbd>` : "");
  // 버튼 하나 {label, act, i, key, pri, kind, pressed, disabled}. kind에 opt가 있으면 선택지(단축키가 앞에)
  const isOpt = (a) => /opt/.test(a.kind || "");
  function btn(a) {
    const cls = ["b", a.pri && "pri", a.kind].filter(Boolean).join(" ");
    const data = `data-act="${a.act}"${a.i !== undefined ? ` data-i="${a.i}"` : ""}${a.pressed !== undefined ? ` aria-pressed="${a.pressed}"` : ""}${a.chip ? ` data-label="${esc(a.label)}"` : ""}${a.disabled ? " disabled" : ""}`;
    const k = a.disabled ? "" : a.key;   // 잠긴 칩에는 단축키를 걸지도 보이지도 않는다
    const tip = k ? ` title="단축키 ${KEYCAP[k] || k.toUpperCase()}"` : "";
    return isOpt(a) ? `<button class="${cls}" ${data}${tip}>${kbd(k)}<span>${esc(a.label)}</span></button>`
      : `<button class="${cls}" ${data}${tip}>${esc(a.label)}${kbd(k)}</button>`;
  }

  // 플로로 — 기분은 [잠깐 짓는 표정(쓰다듬기·축하) > 졸음 > 안내 화면의 표정] 순서. 졸음은 편한 표정일 때만
  let flashMood = { mood: "", until: 0 }, sleepState = "awake";
  const CALM = ["idle", "happy", "done"];
  const liveMood = (base) => (flashMood.until > Date.now() ? flashMood.mood : sleepState !== "awake" && CALM.includes(base) ? sleepState : base);
  // 쓰다듬을 수 있는 플로로 — 누르거나 좌우로 문지르면 된다. data-live는 기분이 바뀌면 같이 바뀌는 플로로
  // 꾸미기(C-22): 입은 것(st.wear)을 플로로 위에 겹친다 — 모자 자리 · 목 자리. 그림(이모지)은 자리표시, 진짜 그림은 고한결
  const deco = () => (QU ? Object.values(st.wear).map(QU.itemOf).filter(Boolean).map((it) => `<span class="deco ${it.slot}" aria-hidden="true">${it.emoji}</span>`).join("") : "");
  const petCat = (mood, size, extra = "") => `<button class="pet" data-act="pet" data-pet data-live data-base="${mood}" aria-label="플로로 쓰다듬기" style="--fs:${size}px"
    title="플로로 쓰다듬기 — 눌러도, 좌우로 문질러도 돼요">${cat(liveMood(mood), size, { extra, hole: true })}${deco()}</button>`;

  // 칸 — 지나온 것과 지금 하는 것까지 밝게, 남은 것은 어둡게
  const mini = () => `<span class="mini" aria-hidden="true">${met().map((_, i) => `<i class="${i < nowAt() ? "on" : ""}"></i>`).join("")}</span>`;
  const stageMeta = () => { const s = stage(); return `<span class="mm-stage">${LB(s.n)} · ${esc(s.title)}</span><span>${allDone() ? `할 일 ${met().length}개 모두 했어요` : progress()}</span>${mini()}`; };
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
  // 돌려주는 것: {tone, mood, say(플로로의 한마디), meta, title, sub, body, acts, foot} — 글은 이미 esc 한 것
  function momentToday() {
    const s = st.j && stage(), f = face();
    if (st.busy) return { tone: "gray", mood: "look", meta: s && !st.planBusy ? stageMeta() : "", title: `${st.planBusy ? PL_BUSY[st.planBusy] : "살펴보고 있어요"}${dots}`,
      sub: `<span data-wait>${waitText()}</span>`, acts: [], passing: true };   // passing: 기다리는 동안만 보이는 말 — 지난 말로 쌓지 않는다(chatCard)
    if (st.warn) {
      const fix = st.warn.then === "judge";
      return { tone: "amber", mood: "alert", title: "보내기 전에 잠깐!",
        sub: `글 안에 ${esc(st.warn.w.join(", "))}처럼 보이는 게 있어요. 그래도 AI(Claude)에게 보낼까요?`,
        acts: [{ label: fix ? "고칠게요" : "그만둘게요", act: fix ? "edit" : "stop-send", key: "Enter", pri: true }, { label: "괜찮아요, 보낼게요", act: "send-anyway" }] };
    }
    if (st.error) return { tone: "red", mood: "think", extra: "oops", meta: s ? stageMeta() : "", title: "음, 잘 안 됐어요", sub: esc(st.error),
      acts: [{ label: "글 고쳐서 다시 해 보기", act: "retry-input", key: "Enter", pri: true }, { label: "닫기", act: "dismiss", key: "Escape", kind: "ghost" }] };
    if (st.blocked && !st.blocked.retrying) return momentBlocked();   // F-69 맡긴 일이 허락을 못 받아 막혔다 — 사람이 길을 고른다
    if (stallShown()) return momentStall();   // C-50 맡긴 일이 멈춘 것 같다 — 끄지 않고 사람이 고른다
    if (st.screen === "gate") return momentGate();
    if (st.meal) return feedSortMoment();   // 먹이를 나눠 정리하는 중(C-15)
    if (st.presetPick) return momentPreset();   // 문서 틀 고르기(C-44)
    if (st.linePick && BUILD) return momentLines();   // 6단계 기능 줄 고르기(F-70 ⓒ)
    if (st.runOut) return momentRun();   // 돌려 본 결과(F-70 ⓓ)
    if (planNow()) return momentPlan();   // 준비 계획 · 맡길 일(C-35) — 퀘스트 창에서 '맡길 일'을 고르거나 계획 칩을 누르면
    if (st.restore && FDOCS) return momentRestore();   // C-49 폴더의 기록 — 되살리기 · 다시 읽기 · 근거 없음
    if (st.ship && FDOCS) return momentShip();   // 2단계를 마친 뒤 문서 올리기(C-37)
    if (st.carry && CY) return momentCarry();   // C-48 8단계 — 다음 프로젝트에 가져갈 것
    if (st.carryOffer && CY) return momentCarryOffer();   // C-48 단계에 들어서면 — 지난 프로젝트에서 가져온 것
    if (gateStop()) return momentStop();   // R-10: 보고했는데 '안 됨'이 남았다 — 관문 앞에서 멈춘다
    if (QU && st.quest && st.quest.phase !== "done" && !st.openInput) return momentQuest();   // 퀘스트(C-22): 받기 전 · 한 줄씩 · 완료 보고
    if (st.ping) return { tone: "gray", mood: "look",
      meta: `<span class="mm-stage">${esc(pingHead())}</span>${s ? `<span>${LB(s.n)} · ${progress()}</span>${mini()}` : ""}`,
      title: "바뀐 작업을 보고, 어디쯤인지 알려 드릴까요?",
      sub: st.mode === "live" ? "최근 작업 대화가 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처처럼 보이는 게 있으면 보내기 전에 멈춰요."
        : "연습용 예시라서, 미리 만들어 둔 응답으로 살펴봐요.",
      acts: [{ label: "살펴봐 주세요", act: "look-now", key: "Enter", pri: true }, { label: "보낼 글 먼저 보기", act: "peek-text" }] };
    // 처음(C-22 → C-36, 2026-10-25 이재엽 "원하는 내용을 한줄로 작성해달라고 하지말고 원하는 내용을 플로로에게 받는걸로"): 원하는 것을 받으면 AI가 1단계 초안 → 제목이 주제인 1단계(startDraft).
    //   먹이 주기(파일 · 붙여 넣기)는 칩 · 끌어다 놓기로 그대로
    if (!st.j && !st.openInput && QU) {
      return { tone: "blue", mood: f[0], meta: `<span class="mm-stage">처음 만나요</span>`, title: st.back ? "다시 오셨네요! 원하는 것을 플로로에게 알려 주세요" : "원하는 것을 플로로에게 알려 주세요",
        sub: "만들고 싶은 것 · 필요한 기능 · 과제 글을 그대로 적거나 붙여 넣어도 돼요. 플로로가 다 읽고 1단계 초안을 만들어 와요.", foot: esc(nowLine()),
        acts: st.mode === "fixture" ? [{ label: "동아리 행사 등록 앱을 만들고 싶어요", act: "idea-example", key: "1", kind: "soft" }, ...(FD ? [{ label: "예시 먹이 주기", act: "feed-example", key: "2", kind: "soft" }] : [])] : [] };
    }
    if (!st.j || st.openInput) {
      const first = !st.j;
      // 처음 카드는 먹이 주기 화면(C-15, 2026-10-20) — 파일 · 붙여 넣기 한곳. '예시 먹이 주기'는 서버 없이 보이는 예시(FR-10). 글을 바로 보내지 않고 나눠 정리한 뒤 확인하면 보낸다
      return { tone: "blue", mood: f[0], say: first ? "" : f[1], meta: first ? `<span class="mm-stage">플로로에게 먹이 주기</span>` : stageMeta(),
        title: first ? "플로로에게 먹이를 주세요" : "보낼 글을 확인해 주세요",
        sub: first ? "파일을 끌어다 놓거나 글을 붙여 넣으면 플로로가 읽고 나눠 정리해요. 비밀번호 · 개인적인 일 같은 구간은 빼고 보내요." : "AI 코딩 도구에서 가져온 작업이에요. 고칠 곳이 있으면 고친 뒤 보내 주세요.",
        body: deskInput(),
        acts: [...(first && FD && st.mode === "fixture" ? [{ label: "예시 먹이 주기", act: "feed-example", kind: "soft" }] : first ? [] : exampleActs()),
          ...(first && FD ? [{ label: "나눠 정리하기", act: "feed-sort", key: "c-Enter", pri: true }] : [{ label: "어디쯤인지 보기", act: "judge", key: "c-Enter", pri: true }]),
          ...(first ? [] : [{ label: "닫기", act: "close-input", key: "Escape", kind: "ghost" }])] };
    }
    if (st.finished) return { tone: "green", mood: "happy", meta: `<span class="mm-stage">모든 단계를 마쳤어요</span>`,
      title: END.title, sub: END.sub,
      acts: [{ label: END.more, act: END_ACT, key: "Enter", pri: true }, ...(st.mode === "fixture" ? [RESTART] : [])] };
    if (holding()) return { tone: "gray", mood: f[0], say: f[1], meta: stageMeta(), banner: U.holdLine(st.hold, ymd()),
      title: "잠시 멈춰 뒀어요", sub: HOLD.later,
      acts: [{ label: "다시 이어 하기", act: "hold-resume", key: "Enter", pri: true }] };
    if (allDone()) return { tone: "green", mood: f[0], meta: stageMeta(), title: `${LB(s.n)} 할 일을 모두 했어요!`,
      sub: "다음 단계로 가기 전에, 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      acts: [{ label: "확인하고 넘어가기", act: "gate", key: "Enter", pri: true }] };
    if (st.todos) return { tone: "blue", mood: f[0], say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(todosNow()[0])}`,
      sub: WORK_NOTE,
      body: `<ol class="steps">${todosNow().map((t, i) => `<li class="${[i === 0 && "now", P.isLater(st.todoLater, t) && "later"].filter(Boolean).join(" ")}"><b>${i + 1}</b>${esc(t)}${
        P.isLater(st.todoLater, t) ? `<small>${P.LABEL.later}</small>` : ""}</li>`).join("")}</ol>`,
      acts: [] };
    const n = st.j.next;
    if (!n) return { tone: "blue", mood: f[0], say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(tick().now)}`, sub: WORK_NOTE, acts: [] };
    if (st.later) return { tone: "blue", mood: f[0], meta: stageMeta(), title: "나중에 정하기로 했어요", sub: esc(n.question),
      acts: [{ label: "지금 고르기", act: "again", key: "Enter", pri: true }, { label: "바뀐 작업 보여 주기", act: "open-input" }] };
    // 선택지에 원하는 게 없으면 직접 쓴다 (2026-10-18 임유정 요청: '나중에'는 창을 닫는 것과 같아서 뺐다)
    if (st.own) return { tone: "blue", mood: f[0], meta: stageMeta(), title: esc(n.question), sub: "어떻게 할지 직접 적어 주세요. 한 줄이면 충분해요.",
      body: `<textarea class="mc-input" data-act="own-text" rows="2" aria-label="직접 쓴 답" placeholder="예) ${esc(n.options[0])}">${esc(st.ownText)}</textarea>`,
      acts: [{ label: "이걸로 정할게요", act: "own-decide", key: "c-Enter", pri: true }, { label: "선택지로 돌아가기", act: "own-cancel", key: "Escape", kind: "ghost" }] };
    // 왜 묻는지와 고르면 무엇을 하는지를 한 문단으로 (2026-10-18 임유정 요청: 위아래로 나뉘어 읽기 불편)
    return { tone: "blue", mood: f[0], say: f[1], meta: stageMeta(), title: esc(n.question), sub: esc([n.why, n.action].filter(Boolean).map((x) => (/[.!?…]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`)).join(" ")),
      acts: [...n.options.map((o, i) => ({ label: o, act: "pick-opt", i, key: String(i + 1), kind: "opt" })),
        { label: "직접 쓸게요", act: "own", key: String(n.options.length + 1), kind: "opt" }] };
  }
// ━━ app/20-feed.js ━━
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
    if (dragDepth++ === 0) { if (st.ui === "hidden") go("petit"); requestAnimationFrame(() => feedLayer(true)); }
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
// ━━ app/30-chat.js ━━
  // ── 채팅 중심 섬(C-22 1차 뼈대, claude-drafted: 2026-10-21 — 이재엽 "메인은 버튼이 아니라 플로로와 소통", 설계는 quest-storyboard.md 10절) ──
  //    레벨 오버레이(2026-10-19 LV · EXP · 명령 네 칸)는 뺐다 — 왼쪽 큰 플로로(칭호 · 기분 글은 2026-10-25에 뺌), 가운데 채팅(플로로 말 왼쪽 · 내 말 오른쪽 · 고르는 칩 · 입력 칸, 채팅 안에 플로로 그림 없음).
  //    규칙은 안 바뀐다: 지금 결정할 것 하나(momentToday · momentGate)가 플로로의 마지막 말이 되고, 그 단추들이 칩이 된다. 지나간 말은 위로 쌓인다(이 켜짐 동안만 — 기록에는 안 남긴다).
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
    : typeof t.carry === "string" ? { who: "floro", kind: "carry", n: t.stage, at: t.at, html: esc(t.carry).replace(/\n/g, "<br>") } : { who: t.who, n: t.stage, at: t.at, html: esc(t.text) });
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
    if (!chatLive()) { chatFolder = false; chatQueue = []; return false; }   // 연습 · 서버 없이는 이 브라우저에만 — 진짜 AI 모드로 바꾸면 chatRecheck가 다시 묻는다
    chatFolder = null; const ask = ++chatAsk;
    let r = null; try { r = await (await fetch("/api/chatlog", { credentials: "same-origin" })).json(); } catch { r = null; }
    if (ask !== chatAsk) return false;   // 그사이 다시 물었다 — 늦게 온 옛 답이 덮지 않게
    chatFolder = !!(r && r.ok && r.why !== "folder");
    if (!chatFolder) { chatQueue = []; return false; }   // 폴더를 모르면 모아 둔 말은 버린다(이 브라우저에는 남는다) — 나중에 고른 폴더의 대화에 섞지 않게
    setTimeout(chatlogFlush, 0);   // 묻는 동안 한 말
    if (!Array.isArray(r.turns)) return false;
    st.chat = r.turns.filter((x) => x && (x.mark ? Number.isInteger(x.stage) && Number.isFinite(x.at) : typeof x.carry === "string" || (typeof x.text === "string" && ["me", "floro", "sys"].includes(x.who)))).map((x) => fromTurn({ at: Number.isFinite(x.at) ? x.at : 0, ...x }));   // 덜어낸 수를 알리는 sys 줄(3-32)은 at이 없어도 보인다
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
// ━━ app/40-quest.js ━━
  // ── C-56 R-4 이미 있는 내용 옮겨 적기(2026-10-28 — 이재엽 버튼 "'옮김' 새 값"): 묻는 카드 · 확인 카드의 '폴더에서 찾기' 칩 → /api/find(API.md 3-30)로 후보 줄 셋을 받아 원문(파일 · 줄)과 나란히 보이고,
  //   '이 줄로'를 누르면 그 줄 그대로 그 칸에(누가 = 옮김). 원문끼리 다르면 사람이 고른다 — 플로로는 합치거나 지어내지 않는다. 연결한 폴더가 있는 진짜 AI 모드에서만(연습 · 서버 없이는 칩이 없다)
  let found = null;   // { chap, i, q, busy, list, why }
  const canFind = () => canLive && st.mode !== "fixture" && !!(st.files && st.files.src === "mine" && st.files.list && st.files.list.length);
  const findChip = (q, i) => (canFind() ? [{ label: found && found.chap === q.chap && found.i === i && found.busy ? "찾는 중…" : "폴더에서 찾기", act: "find-lines", kind: "ghost", disabled: !!(found && found.busy) }] : []);
  function foundHTML(q, i) {
    if (!found || found.chap !== q.chap || found.i !== i || found.busy) return "";
    if (!found.list.length) return `<p class="found-none">${found.why === "folder" ? "폴더 목록을 아직 못 받았어요 — 작업실을 열고 다시 눌러요" : "폴더의 글 파일에서 비슷한 줄을 못 찾았어요 — 아래 칸에 적어요"}</p>`;
    return `<ol class="found" aria-label="폴더에서 찾은 줄"><li class="found-h">폴더에서 찾았어요 — 맞는 줄을 고르면 그대로 옮겨요</li>${found.list.map((x, k) => `<li><span>${esc(x.text)}</span><small>${esc(x.path)} ${x.line}줄</small><span class="found-acts"><button type="button" class="b" data-act="find-use" data-i="${k}">이 줄로</button>${Number.isInteger(x.i) ? `<button type="button" class="b ghost" data-act="find-open" data-i="${k}">원문 보기</button>` : ""}</span></li>`).join("")}</ol>`;
  }
  let filesAsked = false;
  function momentQuest() {
    const q = st.quest, f = face(), meta = stageMetaQ();
    if (q.phase === "draft") return { tone: "blue", mood: "happy", meta, title: `${LB(q.chap)} 퀘스트를 만들었어요`,
      sub: `퀘스트 창에서 조건 · 할 일 ${q.objs.length}개 · 보상을 보고 큰 단추로 받아 주세요. 이름이나 할 일 수는 거기서 고칠 수 있어요.`,
      acts: [{ label: "퀘스트 받기", act: "quest-ok", key: "Enter", pri: true }, { label: "고쳐 주세요", act: "quest-fix" }, { label: "나중에", act: "quest-later", key: "Escape", kind: "ghost" }] };
    const i = QU.curIdx(q);
    if (i < 0) return { tone: "green", mood: "wow", meta, title: "다 됐어요! 완료 보고할까요?",
      sub: st.mode === "live" ? "적은 글을 AI(Claude)가 보고 어디쯤인지 봐요. 고칠 곳이 있으면 퀘스트 창(공책)에서 먼저 고쳐요." : "연습이라 적은 대로 한 것으로 봐요. 고칠 곳이 있으면 퀘스트 창(공책)에서 먼저 고쳐요.",
      acts: [{ label: "완료 보고", act: "quest-report", key: "Enter", pri: true }, { label: "공책 보기", act: "qwin-quest", kind: "ghost" }] };
    if (q.chap === 5 && canLive && st.mode === "live" && !st.files && !filesAsked) { filesAsked = true; setTimeout(loadFiles, 0); }   // 6단계 — 코드 파일 수를 알아야 A-04를 묻는다(작업실을 열지 않았어도 목록을 한 번, F-70)
    const fx = QS ? qstates(q)[i] : null;   // C-56 먼저 — 앞 칸이 비어 할 수 없다: 갈 곳을 말하고, 관문은 닫힌 채(적지 않으면 완료 보고가 안 된다)
    // A-04(2026-10-28 이재엽 "그냥 md파일을 만드는 작업일 수 있기 때문임"): 6단계에 코드 파일이 없으면 닫지 않고 묻는다 — 예: Claude Code에 실행할 수 있는 코드를 맡김 · 아니요: 코드 없이 지남(결정 기록에 남김)
    if (fx && fx.state === "first" && fx.code) return { tone: "amber", mood: "think", meta, title: "코드 파일을 만드시겠습니까?",
      sub: "이 폴더에 코드 파일이 아직 없어요. 프로그램을 만드는 일이면 '예', 문서만 만드는 일이면 '아니요'예요.",
      foot: "아니요 — 결정 기록에 '코드 없이 지남'으로 남아요",
      acts: [...(canLive && st.mode !== "fixture" ? [{ label: "예 — Claude Code에 맡기기", act: "code-yes", key: "Enter", pri: true }] : []), { label: "아니요 — 코드 없이 하기", act: "code-no", ...(canLive && st.mode !== "fixture" ? {} : { key: "Enter", pri: true }) }, { label: "공책 보기", act: "qwin-quest", kind: "ghost" }] };
    if (fx && fx.state === "first") return { tone: "amber", mood: "think", meta, title: `먼저 — ${esc(QU.shortOf(q.objs[i].name))}은 아직 할 수 없어요`, sub: `${esc(fx.why)}. 그 칸을 채운 뒤에 돌아와요 — 지금 적어도 관문은 닫혀 있어요.`,
      acts: [{ label: `${LB(fx.go.s)} ${ROMAN(fx.go.i)} 보기`, act: "first-go", kind: "soft" }, { label: "아직 못 함으로 적기", act: "first-notyet", kind: "ghost" }, { label: "공책 보기", act: "qwin-quest", kind: "ghost" }] };
    const rv = st.refit && st.refit.chap === q.chap && st.refit.review.find((x) => x.i === st.refitPick);   // C-56 R-5 — 적어 둔 칸이 방금 한 일과 달라졌다: 두 줄을 보이고 사람이 고른다
    if (rv) return { tone: "amber", mood: "think", meta, title: `${ROMAN(rv.i)}. ${esc(QU.nameOf(q, rv.i))} — 적어 둔 줄과 달라요`,
      sub: `적어 둔 줄 “${esc((q.lines[rv.i] || [])[0] || "")}” · ${esc(st.refit.tool)}가 한 일로 본 새 줄 “${esc(rv.text)}”`, foot: "새 줄로 바꾸거나 적어 둔 줄을 그대로 둬요 — 플로로는 적은 줄을 덮지 않아요",
      acts: [{ label: "새 줄로", act: "refit-use", i: rv.i, key: "Enter", pri: true }, { label: "그대로 둘래요", act: "refit-keep", i: rv.i, key: "Escape" }] };
    if (q.draft) { const c = momentConfirm(q, i, meta); return { ...c, ...refitBanner(q), acts: [...c.acts, ...buildActs(q.chap)] }; }   // F-70 — 초안을 확인하는 중에도 코드 맡기기(A-02)   // 받은 글로 만든 1단계 초안(C-36) · 1단계 결과로 만든 2단계 초안(C-37) — 칸마다 확인만
    if (st.tidy && st.tidy.fills.length) { const n = st.tidy.fills.length; return { tone: "green", mood: "happy", meta, title: `칸 ${n}개로 정리했어요`, sub: esc(st.tidy.reply),
      body: `<ol class="tidy">${st.tidy.fills.map((f) => `<li><b>${ROMAN(f.i)} ${esc(QU.nameOf(q, f.i))}</b><span>${esc(f.text)}</span></li>`).join("")}</ol>`, foot: "맞으면 적고, 아니면 더 이야기해요 — 플로로가 먼저 적지 않아요",
      acts: [{ label: `칸 ${n}개에 적기`, act: "tidy-fill", key: "Enter", pri: true }, { label: "더 이야기하기", act: "tidy-more", key: "Escape", kind: "ghost" }] }; }   // C-61 정리 카드
    const o = q.objs[i], ex = QU.example(q, i);   // 연습은 1단계의 연습 글, 진짜 AI는 AI가 만든 예시(/api/quest)
    return { tone: "blue", mood: f[0], meta, ...refitBanner(q), title: `${ROMAN(i)}. ${esc(QU.nameOf(q, i))}`, sub: `${esc(QU.askOf(q, i))}${QU.doneOf(q, i) ? ` <small class="done-when">끝: ${esc(QU.doneOf(q, i))}</small>` : ""}${o.term ? ` ${termTag(o.term)}` : ""}`,
      body: foundHTML(q, i), foot: "아래 칸에 한 줄 적고 보내기를 눌러요", acts: [...(ex ? [{ label: "예시로 적어 줘", act: "quest-example", key: "1", kind: "soft" }] : []), ...findChip(q, i), ...refitChips(q), ...buildActs(q.chap), { label: "공책 보기", act: "qwin-quest", kind: "ghost" }] };
  }
  // 1단계 초안 확인(C-36, 2026-10-25 — 이재엽 "불편한게 맞는 내용은 이게 플로로가 생각한 내용인데 맞나요 … 누가 쓰는 내용은 … 사람에 대한 내용이 있으면 이 내용이 맞는지 요청을 보내고
  //   없다면 본인 / 소수 / 불특정다수 … 얼마 크게도 … 짧음 / 보통 / 긺"): Ⅰ 불편 · Ⅱ 달라지는 것 · Ⅲ 누가(글에 사람이 있으면) — 맞나요, Ⅲ 사람이 없으면 셋 중 고르기, Ⅳ 플로로가 본 크기 + 셋 중 고르기.
  //   고칠래요 · 다른 답은 채팅 칸에 적으면 그 줄이 된다(send — 지금 할 일에 적기)
  //   C-37(2026-10-25 — 이재엽 "1단계에서 플로로 채팅이 너무 많이 올라오는 문제 … 한곳에서 보이는 것들"): 칸마다 지난 말 · '맞아요'로 쌓지 않고 이 카드 하나에 넷을 한곳에(.dchk), 끝나면 한 줄로 정리(fillNow).
  //   2단계부터는 초안의 칸마다 맞나요, 기획서로 키울지(PRD)는 플로로가 권한 것 + 셋 중 고르기
  //   C-39(2026-10-25 — 이재엽 "무엇들을 준비해야하는지 생각해서 초안들 보여줘" · 버튼 "할 일 초안 + 준비할 것" · "흐름 + 칸마다 재료까지"): 카드 맨 위에 이 단계 전에 준비할 것, 칸마다 재료(플로로가 본 지난 단계 칸)
  const refLabel = (x) => { const r = st.results[x.s], it = r && r.items[x.i]; return `${LB(x.s)} ${ROMAN(x.i)}${it ? ` ${QU.shortOf(it.name)}` : ""}`; };
  function momentConfirm(q, i, meta) {
    const d = q.draft, o = q.objs[i], text = QU.draftOf(q, i), first = q.chap === 0, pk = QU.pickOf(q, i);
    const rows = q.objs.map((x, k) => { const line = (q.lines[k] || [])[0]; return `<li class="${line ? "y" : k === i ? "now" : ""}"><b>${ROMAN(k)}</b> ${esc(QU.shortOf(x.name))}${line ? `<span>${esc(line)}</span>` : ""}</li>`; }).join("");
    const prep = d.prep && d.prep.length ? `<div class="dprep"><b>이 단계 전에 준비할 것</b><ul>${d.prep.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
    const from = QU.fromOf(q, i), mat = from.length ? `재료 — ${from.map((x) => esc(refLabel(x))).join(" · ")}` : "";
    // C-40(2026-10-26 — 버튼 "짧은 이름 + 쉬운 한 줄"): 제목은 짧은 이름 — 쉬운 한 줄(긴 할 일 문장은 퀘스트 창의 '자세히')
    const easy = QU.easyOf(o.name), title = `${ROMAN(i)}. ${esc(QU.nameOf(q, i))}${easy && !QU.nameOf(q, i).includes(easy) ? ` — ${esc(easy)}` : ""}${o.term ? ` <small class="method">${esc(o.term)}</small>` : ""}`;
    const ex = QU.examplesOf(q, i);
    const opts = ex.length > 1 ? `<ol class="dalt" aria-label="플로로의 예시">${ex.map((t, k) => `<li><button type="button" data-act="draft-alt" data-i="${k}"${k ? "" : ' class="rec"'}>${k ? "" : "<small>플로로가 권해요</small>"}${esc(t)}</button></li>`).join("")}</ol>` : "";
    const head = { tone: "blue", mood: "look", meta: `${meta}${d.example ? `<span class="note">예시예요 · 연습</span>` : ""}`, title,
      passing: true, // 초안 확인은 카드 하나 — 칸마다 지난 말로 쌓지 않는다
      body: `${prep}${opts}${foundHTML(q, i)}<ol class="dchk" aria-label="이 장의 초안">${rows}</ol>` };
    const quiet = (acts) => acts.map((a) => ({ ...a, quiet: true }));
    // '남은 칸 모두 맞아요'(C-40)는 C-56 R-3으로 뺐다(2026-10-28 새 맥락 리뷰 막힘): 옮겨 온 칸은 applyStates가 이미 채우므로 남은 칸은 늘 사람이 볼 칸 — 하나씩 확인한다
    const all = [];
    // 4 ~ 8단계(C-40 버튼 "예시 셋 중 고르기") — 셋 중 하나를 누르면 그 줄(누가 = 고름), 다 아니면 적거나 '다른 예시'(그 칸만 다시)
    if (ex.length > 1) return { ...head, sub: "플로로가 예시를 셋 만들었어요 — 맞는 것을 골라 주세요", foot: `${mat ? `${mat} · ` : ""}다 아니면 아래 칸에 적어요`,
      acts: quiet([{ label: "다른 예시", act: "draft-again" }, { label: "고칠래요", act: "draft-fix" }, ...all]) };
    if (first && i === QU.SIZE_AT) return { ...head, sub: `플로로는 '${QU.SIZE_WORD[d.size]}'으로 봤어요 — ${esc(d.sizeWhy)}`, foot: "고른 크기에 맞춰 다음 단계부터 할 일 수가 바뀌어요",
      acts: quiet([...QU.SIZE_KEYS.map((k, n) => ({ label: QU.SIZE_WORD[k], act: "draft-size", i: n, key: String(n + 1), kind: k === d.size ? "opt pri" : "opt" })), ...all]) };
    if (first && i === QU.WHO_AT && !text) return { ...head, sub: `글에서는 누가 쓰는지 못 찾았어요 — 누가 쓰나요? ${QU.WHO.map(([w, line]) => `${w}: ${line}`).join(" · ")}`, foot: "다르면 아래 칸에 적어요",
      acts: quiet(QU.WHO.map(([w], n) => ({ label: w, act: "draft-who", i: n, key: String(n + 1), kind: "opt" }))) };
    if (pk) { const rec = QU.DOC_PICKS.find(([k]) => k === pk.pick);
      return { ...head, sub: `플로로는 '${rec[1]}'을 권해요${pk.why ? ` — ${esc(pk.why)}` : ""}. 기획서로 키울지는 직접 정해요`, foot: `고른 것이 이 칸의 답이 돼요${mat ? ` · ${mat}` : ""}`,
        acts: quiet([...QU.DOC_PICKS.map(([k, label], n) => ({ label, act: "draft-pick", i: n, key: String(n + 1), kind: k === pk.pick ? "opt pri" : "opt" })), ...all]) }; }
    if (!text) return { ...head, sub: "이 칸은 초안이 없어요 — 아래 칸에 한 줄 적어 주세요", acts: quiet(findChip(q, i)) };
    return { ...head, sub: `${first && i === QU.WHO_AT ? "글에서 쓰는 사람을 이렇게 봤어요 — 맞나요?" : "플로로가 생각한 내용인데 맞나요?"} “${esc(text)}”`, ...(mat ? { foot: mat } : {}),
      acts: quiet([{ label: "맞아요", act: "draft-ok", key: "Enter", pri: true }, { label: "고칠래요", act: "draft-fix" }, ...all, ...findChip(q, i), ...refitChips(q)]) };
  }
  // 늘 있는 칩 — 지금 결정할 것 밑에 작게: 먹이 주기 · 바뀐 작업 보여 주기 · 계획(맡길 일) · 알림. 상황에 맞는 것만
  //   어디쯤인지 보기는 위 줄(단계 띠 · '퀘스트' 단추)과 완료 보고 칩, 도전과제 · 책은 퀘스트 창의 탭(C-35, 2026-10-24 — 명령 네 칸을 뺐다)
  function moreActs(v) {
    const out = [];
    if (planNow()) out.push({ label: (st.quest && st.quest.phase !== "done") || st.j ? "단계 퀘스트로" : "나중에", act: "plan-later", kind: "ghost" });   // 계획 · 맡길 일에서 나가는 길은 이 칩 하나
    else {
      if (!st.j && !st.quest && FD && st.mode === "live") out.push({ label: "먹이 주기(파일 · 글)", act: "open-input", kind: "ghost" });
      if (st.j && !st.openInput) out.push({ label: "바뀐 작업 보여 주기", act: "open-input", kind: "ghost" });
      if (FP) out.push(planChip());
      if (PR && st.j && canLive && st.mode !== "fixture" && !st.presetPick) out.push({ label: "문서 틀", act: "preset-open", kind: "ghost" });   // C-44 — 지금 장 문서를 틀로 맡기기
      if (!(QU && st.quest && st.quest.phase !== "done")) out.push(...buildActs(nowStage()));   // F-70 — 퀘스트 카드가 없을 때(퀘스트를 마친 뒤)만 여기에. 있으면 퀘스트 카드의 답 줄에(A-02)
    }
    out.push({ label: unreadN() ? `알림 ${unreadN()}` : "알림", act: "base-alerts", kind: "ghost" });
    return out;
  }
  const sayHint = () => (planNow() ? (!st.plan ? "만들고 싶은 것 · 요구 · 문제 글을 붙여 넣어요" : !st.plan.confirmed ? "전체 의견을 적어도 돼요" : "보고에 대해 묻거나 답해요") : !st.j && !st.quest ? "원하는 것을 적거나 붙여 넣어요" : st.quest && st.quest.phase === "quest" && !QU.isDone(st.quest) ? (st.quest.draft ? "다르면 고쳐 적어 주세요" : "한 줄로 적어 주세요") : st.screen === "gate" && st.step === "question" ? "궁금한 걸 적어 주세요" : "플로로에게 말하기");
  // 채팅 카드 — v는 momentToday()/momentGate()가 준 것(글은 이미 esc 한 것)
  function chatCard(v) {
    // C-61: 섬이 가운데이고 이 단계의 대화가 아직 비어 있으면 플로로 · 질문 하나 · 입력 상자 하나만(칩 없음). 질문은 셋 중 하나 — 문구는 예시(기획안)
    //   1단계 시작(퀘스트 전)도 — 두승현 2026-10-29 "반드시 1단계 화면이 나오도록". 초안이 있는 장은 전처럼 초안 확인 카드(같은 날 두승현: 1단계에만)
    //   1단계 시작은 사람이 아직 말하지 않았으면 — 구분선(chatMark)은 퀘스트가 생길 때부터라, 플로로 말이 한 줄 남아 있으면 ① 화면이 안 떴다(앱에서 봄). 사람이 한 말이 있으면 그 대화를 이어서 보인다(C-63)
    if (islBig() && !st.pane && !st.settings && (st.quest ? !st.quest.draft && st.chat.length <= (st.chatMark || 0) : !st.j && !st.chat.some((m) => m.who === "me")) && !st.tidy) { /* 구분선 뒤에 말이 없다 — 상한을 넘기면 logMsg가 chatMark도 당긴다(C-63) */ const qs = ["어떤 프로젝트를 구상하고 있나요?", "어떤 미션을 수행하고 계시나요?", "지금 작업 중인 내용을 공유해 주세요, 함께 논의해요~"];
      return `<section class="mc chat hello tone-blue"><div class="who">${petCat("happy", 150)}</div><div class="main"><b class="say hello-q">${qs[(st.quest ? st.quest.chap : 0) % 3]}</b><div class="cin"><textarea class="mc-input" data-act="say" rows="3" aria-label="채팅 입력" placeholder="묻거나 적어요">${esc(st.say)}</textarea><button type="button" class="b pri" data-act="send" ${st.busy ? "disabled" : ""}>보내기</button></div></div></section>`; }   // 안내 글은 작업실 개편 기획안 3-1 사진대로
    for (const a of v.acts) if (a.key && !a.disabled) deskKeys[a.key] = a;
    const live = `${v.banner ? `<p class="mc-hold">${esc(v.banner)}</p>` : ""}<b class="say">${v.title}</b>${v.sub ? `<span class="mc-sub">${v.sub}</span>` : ""}`;
    const key = `${v.title}|${v.sub || ""}`;
    // 지난 말은 위로 — 단, '살펴보고 있어요'처럼 기다리는 동안만 보이는 말(passing)은 쌓지 않는다. 경과 초가 바뀔 때마다 다른 말로 보여 같은 말이 계속 쌓였다(임유정 2026-10-22)
    if (lastLive && lastLive.key !== key) settleLive();
    if (!lastLive || lastLive.key !== key) saidSince = 0;
    lastLive = lastLive && lastLive.key === key ? { ...lastLive, html: live, passing: !!v.passing } : { key, html: live, passing: !!v.passing };   // 같은 말이면 '남겼음'(logged)을 지킨다 — 내 말마다 같은 플로로 말이 또 쌓이지 않게(2026-10-25 리뷰)
    // 답할 칩(v.acts)과 늘 있는 칩(moreActs)을 두 줄로 — 섞여 있으면 늘 있는 칩이 답 사이에 끼어 줄이 들쭉날쭉했다(임유정 2026-10-22). 늘 있는 칩은 아랫줄 한 줄
    // '공책 보기'(퀘스트 창 열기)는 답이 아니라 늘 있는 칩과 같은 길이라, 나올 때는 아랫줄 맨 앞에 둔다(임유정 2026-10-22). 단축키(deskKeys)는 위에서 v.acts로 그대로
    const FIXED_ACTS = ["qwin-quest"];
    const answers = v.acts.filter((a) => !FIXED_ACTS.includes(a.act));
    const more = islBig() ? [] : [...v.acts.filter((a) => FIXED_ACTS.includes(a.act)), ...(st.screen === "gate" || st.busy || st.warn || st.error || st.ping ? [] : moreActs(v))];   // 가운데 대화에는 늘 있는 칩 줄이 없다(C-60 · C-61)
    const chip = (a) => btn({ ...a, chip: !a.quiet });   // quiet — 눌러도 내 말로 쌓지 않는 칩(초안 확인 — 결과는 끝나면 한 줄로, C-37)
    // 플로로 아래 칭호 · 기분 글은 뺐다(2026-10-25 두승현) — 칭호는 설정 창 머리에 있다
    return `<section class="mc chat tone-${v.tone}"><div class="who">${petCat(v.mood, 150, v.extra)}</div>
      <div class="main"><div class="log" data-log data-go-stage="${st.chatGo == null ? "" : `${st.chatGo}:${goSeq}`}">${st.chat.map((m) => (m.kind === "stage" ? `<div class="msg stage" data-stage="${m.n}"><div class="b">${m.html}</div></div>` : `<div class="msg ${m.who}${m.kind ? ` ${m.kind}` : ""}"><div class="b">${m.html}</div></div>`)).join("")}${
        working() ? `<div class="msg sys"><div class="b">Claude Code가 일하고 있어요${aiLast(mine()) ? ` — ${esc(stepLine(aiLast(mine())))}` : ""}<span class="bar" aria-hidden="true"><i></i></span></div></div>` : ""}
        ${proposalsHTML()}${approvalsHTML()}<div class="msg floro now"><div class="b" aria-live="polite">${st.notice ? `<p class="mc-notice">${I.check}${esc(st.notice)}</p>` : ""}${v.meta ? `<div class="mc-meta">${v.meta}</div>` : ""}${live}${v.body || ""}${v.foot ? `<p class="mc-foot">${v.foot}</p>` : ""}</div></div></div>
        ${answers.length ? `<div class="opts">${answers.map(chip).join("")}</div>` : ""}${more.length ? `<div class="opts more" id="more-chips">${moreOpen ? more.map(chip).join("") : ""}<button type="button" class="b ghost mtg" data-act="more-toggle" aria-expanded="${moreOpen}" aria-controls="more-chips">${moreOpen ? "접기" : `더 보기${unreadN() ? ` · 알림 ${unreadN()}` : ""}`}</button></div>` : ""}
        <div class="cin"><textarea class="mc-input" data-act="say" rows="1" aria-label="채팅 입력" placeholder="${esc(sayHint())}">${esc(st.say)}</textarea><button type="button" class="b pri" data-act="send" ${st.busy ? "disabled" : ""}>보내기</button></div></div></section>`;
  }
  // 채팅 입력(C-22) — 상황에 따라: 준비 계획 · 맡길 일(C-35, planSay) / 처음 — 원하는 것(C-36, startDraft) / 퀘스트 한 줄 적기 · 고쳐 적기 / 궁금한 것 / 직접 쓴 답 / 바뀐 작업(진짜 AI)
  function send() {
    const t = st.say.trim(); if (!t || st.busy) return;
    st.say = ""; logMe(t.length > 200 ? `${t.slice(0, 200)}… (글 ${t.length.toLocaleString()}자)` : t); activity();   // 붙여 넣은 긴 글은 앞부분만 내 말로
    if (planNow()) return planSay(t);   // 준비 계획 · 맡길 일(C-35)
    const q = st.quest;
    if (!st.j && !q && QU) return startDraft(t);    if (q && q.phase === "draft") { render(); return say("먼저 퀘스트 창에서 퀘스트를 받아 주세요"); }
    if (q && q.draft && q.phase === "quest" && QU.pickOf(q, QU.curIdx(q))) {   // 기획서로 키울지(2단계)는 셋 중 하나로 — 글로 답해도 맞춰 고른다
      const k = /경량|가볍|짧/.test(t) ? 0 : /상세|자세/.test(t) ? 1 : /안 함|않|없|아니/.test(t) ? 2 : -1;
      if (k < 0) { render(); return say("경량 · 상세 · 키우지 않아요 중에서 골라 주세요"); }
      return ACT["draft-pick"](k);
    }
    if (q && q.draft && q.chap === 0 && q.phase === "quest" && QU.curIdx(q) === QU.SIZE_AT) {   // Ⅳ 크기는 셋 중 하나로 — 글로 답해도 맞춰 고른다(만드는 크기가 그 등급으로)
      const k = /짧/.test(t) ? 0 : /보통|중간/.test(t) ? 1 : /긺|길|크|많/.test(t) ? 2 : -1;
      if (k < 0) { render(); return say("짧음 · 보통 · 긺 중에서 골라 주세요"); }
      return ACT["draft-size"](k);
    }
    if (q && q.phase === "quest" && QU.curIdx(q) >= 0) { if (q.draft) return fillNow(t); return chatSend(t); }   // C-61(2026-10-29): 보내기는 칸에 적지 않는다 — 플로로가 정리 카드로 돌려주고 사람이 [칸 n개에 적기]를 누른다. 초안 확인(draft)은 C-36대로 그 줄 고쳐 적기
    if (st.screen === "gate" && st.step === "question") { st.question = t; return answer(); }
    if (st.j && st.j.next && st.screen !== "gate" && !st.todos) { st.ownText = t; return decide(t); }
    if (st.j && st.mode === "live") { st.text = `${st.text.trim()}\n${t}`; return judge(false); }
    render(); say(st.j ? "연습에서는 칩으로 해요 — 진짜 AI면 적은 글을 보고 어디쯤인지 봐요" : "먼저 무엇을 만들고 싶은지 말해 주세요");
  }
  // 지금 할 일에 한 줄 — 다 적었으면: 초안을 확인한 1단계는 저절로 완료 보고(C-36 — 넷 다 확인하면 관문으로), 아니면 축하하고 완료 보고 칩
  //   by — 누가 정했나(C-39): 고르는 칩은 "pick", 아니면 quest.js가 플로로 초안과 맞대어 그대로 · 고침 · 직접
  //   at — MCP로 이은 AI의 제안처럼 지금 할 일이 아닌 칸에 적을 때(C-38 시험판)
  function fillNow(t, by, at = QU.curIdx(st.quest)) {
    st.quest = QU.fill(st.quest, at, t, by);
    afterFill();
  }
  // 칸을 적은 뒤 — 다 적었으면 다음 장 초안을 실제 결과로 미리 부르고(C-40), 초안을 확인한 장은 한 줄로 정리해 저절로 완료 보고
  function afterFill() {
    if (!QU.isDone(st.quest)) return render();
    prefetch(st.quest);
    if (st.quest.draft) {   // 초안을 다 확인했다 — 한 줄로 정리해 남기고(칸마다 쌓지 않은 대신) 저절로 완료 보고
      const q = st.quest;
      logMsg("floro", `<b>${LB(q.chap)} 초안을 확인했어요</b><br>${q.objs.map((o, k) => `${ROMAN(k)} ${esc(QU.nameOf(q, k))} — ${esc((q.lines[k] || [])[0] || "")}`).join("<br>")}`);
      return questReport();
    }
    render(); celebrate("done");
  }
  // ── C-61 대화 → 칸으로 정리(2026-10-29, 두승현 PRD 2026-10-28 · 이재엽 승인 — 작업실 개편 PR ③) ──
  //   보낸 말은 칸에 적지 않는다. 진짜 AI면 POST /api/chat(API.md 3-31)에 지금 칸 · 최근 말을 주고 답 + '칸 n개를 채울 수 있나'(fills)를 받아 정리 카드(st.tidy)로.
  //   연습 · 서버 없음은 보낸 말을 지금 칸의 후보로(AI 없이). 적는 것 · 섬 자리를 옆으로 옮기는 것은 사람이 [칸 n개에 적기]를 누를 때뿐(FR-17과 같은 방향)
  const textOf = (html) => { const d = document.createElement("div"); d.innerHTML = html; return (d.textContent || "").trim(); };
  // 이 단계의 대화(3-31 talk): 사람 · 플로로의 말만(알림 · 구분선 빼고), 40줄 · 줄 1,000자 · 합 8,000자 안에서 최근 것부터, 마지막은 방금 보낸 내 말(logMe가 먼저 쌓았다)
  const talkOf = (t) => { const all = st.chat.filter((m) => (m.who === "me" || m.who === "floro") && !m.kind).map((m) => ({ who: m.who, text: textOf(m.html).slice(0, 1000) })).filter((m) => m.text);
    const me = { who: "me", text: t.slice(0, 1000) };   // 마지막 내 말은 원문으로 — 채팅에는 긴 글이 앞 200자만 보인다(send의 logMe, F-103-4)
    if (all.length && all[all.length - 1].who === "me") all[all.length - 1] = me; else all.push(me);
    let out = all.slice(-40); while (out.length > 1 && out.reduce((n, m) => n + m.text.length, 0) > 8000) out = out.slice(1); return out; };
  let chatText = "";
  // 새 단계(C-61 · C-63, 2026-10-29): 대화에 구분선(단계 · 이름 · 날짜)과 '지난 단계에서 가져온 것'(정한 줄 요약 — 틀리면 말로 고친다), 섬은 저절로 가운데(칸이 비었으니), 대화 표시 자리는 구분선 뒤. islBig은 저장하지 않는다 — 다시 켜면 칸 상태대로 저절로
  const questStarted = () => {
    const n = st.quest ? st.quest.chap : atStage();
    logMsg("sys", `<b>${LB(n)} · ${esc(N.STAGES[n].title)}</b><span>${ymd()}</span>`, { kind: "stage", n, title: N.STAGES[n].title });
    const prev = n > 0 ? st.results[n - 1] : null, got = prev ? prev.items.filter((x) => (x.lines || [])[0]) : [];
    if (got.length) logMsg("floro", `<b>지난 단계에서 가져온 것</b>${got.map((x) => `<br>${esc(QU.shortOf(x.name))} — ${esc(x.lines[0])}`).join("")}<br><small>틀리면 말로 고쳐 주세요</small>`, { kind: "carry", n });
    st.islBig = null; st.chatMark = st.chat.length; st.tidy = null; };
  async function chatSend(t, skipCheck) {
    const q = st.quest; st.tidy = null;
    if (st.mode !== "live" || !canLive) { st.tidy = { fills: [{ i: QU.curIdx(q), text: t }], reply: "연습이라 AI 없이 — 보낸 말을 지금 칸에 이렇게 적을 수 있어요" }; return render(); }
    chatText = t;   // guard 앞에서 — 경고 뒤 '보낼게요'(RETRY.chat)가 그 전 메시지가 아니라 이 글을 다시 보낸다(F-103-1)
    if (!skipCheck && guard(t, "chat")) return;
    st.warn = null;   // 보낸 뒤 경고 카드를 걷는다 — 남으면 '보낼게요'를 또 눌러 같은 글이 두 번 간다(startDraft와 같이, 새 맥락 리뷰 2026-10-29 막힘)
    const r = await callAI("/api/chat", { stage: q.chap, tier: st.tier, idea: ideaNow(), talk: talkOf(t), lines: q.lines });   // API.md 3-31(이재엽 쪽 서버 #246): 이 단계의 대화 · 적은 줄 · 처음 말한 것 → { reply, slots, n }
    if (!st.quest || st.quest.chap !== q.chap) return render();
    if (r.ok && typeof r.reply === "string") { st.tokens = r.tokens || 0; fetchUsage(); const slots = Array.isArray(r.slots) ? r.slots : []; if (slots.length) st.tidy = { fills: slots, reply: r.reply }; else say(r.reply); return render(); }
    render(); say(`답을 받지 못했어요 — ${r.reason || "AI에 연결하지 못했어요"}`);
  }
  // ── 다음 단계 초안 미리(C-40, 2026-10-26 — 이재엽 "보통길이이고 작업들을 하나씩 하는건데 왜 그냥 넣었을때 보다 너무 느려" · 버튼 "다음 단계 초안 미리") ──
  //   지금 장 초안을 받자마자 '모두 맞아요라면' 결과(expectedResult)로, 지금 장을 다 적으면 실제 결과로 다음 장 초안을 뒤에서 부른다(화면을 막지 않는다).
  //   관문을 지나 지난 단계 결과가 같으면(key) 기다리지 않고 바로 연다 — 다르면 그때 다시 부른다. 진짜 AI 모드에서만, 비밀값처럼 보이면 미리 보내지 않는다(관문 뒤 guard가 묻는다)
  let pre = null;   // { key, p: Promise, r }
  const ideaNow = () => (st.idea || st.topic || "").slice(0, N.IDEA_MAX);
  // ── C-56 R-3 · R-4 상태 넷(2026-10-28): 퀘스트가 생기거나 초안이 오면 칸마다 상태를 매긴다(queststate.js — 규칙으로 정할 수 있는 것만). 옮겨 온 칸은 그 글을 '옮김'으로 미리 적고, 건너뛸 칸은 '건너뜀 — 까닭'으로 적어 둔다(판정에서 넘김으로, F-62와 같은 줄).
  //   먼저인 칸은 비워 두고 채팅 카드가 갈 곳을 말한다(관문은 닫힌 채). 사람이 적은 줄은 덮지 않는다
  const factsNow = (extra = null) => (QS ? QS.factsFrom({ results: extra ? { ...st.results, ...extra } : st.results, source: st.source, files: st.files && st.files.src === "mine" ? st.files.list : null, codeless: !!st.codeless }) : {});   // extra — 아직 결과로 남기 전의 지금 장(관문을 볼 때, 새 맥락 리뷰 2026-10-28 막힘)
  const qstates = (q = st.quest, extra = null) => (QS && q ? QS.questStates(q, { prev: prevOf(q.chap), facts: factsNow(extra), draftOf: QU.draftOf }) : []);
  function applyStates(q) {
    if (!QS || !q || q.phase === "done") return q;
    let out = q; const states = qstates(q);
    for (const x of states) {
      if (QU.filled(out, x.i)) continue;
      if (x.state === "moved") { const r = st.results[x.from.s], line = r && r.items[x.from.i] ? (r.items[x.from.i].lines || [])[0] : ""; if (line) out = QU.fill(out, x.i, line, "moved"); }
      else if (x.state === "skip") out = QU.fill(out, x.i, `건너뜀 — ${x.why}`, "skip");
    }
    return { ...out, states };
  }
  // C-56 R-2(2026-10-28): 기준 카드를 초안 · 준비 요청에 '칸: 내용' 줄로 — 빈칸은 넘기지 않는다(지어내지 않게)
  const baseText = () => (BC && st.card ? BC.FIELDS.map((f) => { const x = st.card[f.key]; return x && x.text ? `${f.label}: ${x.text}` : ""; }).filter(Boolean).join("\n").slice(0, 1500) : "");
  const prevOf = (n, extra) => { const all = { ...st.results, ...(extra ? { [extra.chap]: extra } : {}) };
    return Object.keys(all).map(Number).filter((k) => k < n).sort((a, b) => a - b).map((k) => ({ stage: k, items: all[k].items.map((x) => ({ name: x.name, lines: x.lines })) })); };
  const preKey = (n, prev, tier = st.tier) => JSON.stringify([n, tier, ideaNow(), prev]);
  // ── C-56 R-5 작업을 따라(2026-10-28 — 이재엽 버튼 "다음 단계 미리까지"): 코딩 도구가 일을 마쳤어요 알림 뒤 몇 초 모아, 지금 단계 초안을 방금 한 일로 다시 받는다(/api/stagedraft work, 화면을 막지 않는다).
  //   사람이 적은 칸은 덮지 않고 '다시 볼까요?'만(quest.js refit), 안 적은 칸만 바뀐다. '방금 바뀜' 띠 한 줄. 다음 단계 초안도 다시 미리 부른다. 진짜 AI 모드 · 초안이 있는 2 ~ 8단계 퀘스트에서만
  const REFIT_MS = 4000;
  let refitTimer = null, refitWork = [], refitTool = "";
  const refitOk = () => canLive && st.mode === "live" && !!(st.quest && QU && st.quest.phase === "quest" && st.quest.draft && st.quest.chap >= 1 && !QU.isDone(st.quest));
  function scheduleRefit(ev) {
    if (ev.sim || st.mode !== "live" || !refitOk() || !ev.work) return;
    refitWork.push(String(ev.work).trim()); refitTool = toolName(ev.tool);
    clearTimeout(refitTimer); refitTimer = setTimeout(refitNow, REFIT_MS);
  }
  async function refitNow() {
    refitTimer = null;
    const q = st.quest, work = refitWork.join("\n").slice(-(N.WORK_MAX || 600)); refitWork = [];
    if (!work || !refitOk() || st.busy) return;
    const idea = ideaNow(), prev = prevOf(q.chap);
    if (sensitive([idea, work, baseText(), ...prev.flatMap((p) => p.items.flatMap((x) => x.lines))].join("\n")).length) return;   // 비밀값처럼 보이면 밖에 보내지 않는다(관문의 guard와 같은 생각 — 지난 줄 · 기준 카드까지, 새 맥락 리뷰 2026-10-28)
    try {
      const r = await (await fetch("/api/stagedraft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: q.chap, tier: st.tier, idea, prev, base: baseText(), work }) })).json();
      if (!r || !r.ok || !r.draft || !st.quest || st.quest.chap !== q.chap || st.quest.phase !== "quest") return;
      const f = QU.refit(st.quest, r.draft);
      if (!f.changed.length && !f.review.length) return;
      st.quest = applyStates(f.q); st.tokens = r.tokens || 0; fetchUsage();
      st.refit = { chap: q.chap, tool: refitTool, at: Date.now(), changed: f.changed, review: f.review };
      pre = null; prefetch(st.quest);   // 다음 단계 초안도 다시 미리(버튼 "다음 단계 미리까지")
      render();
    } catch { /* 다시 맞추기는 덤 — 못 받으면 조용히(다음 알림에 다시) */ }
  }
  const refitBanner = (q) => (st.refit && q && st.refit.chap === q.chap ? { banner: `방금 바뀜 — ${st.refit.tool}가 한 일로 ${LB(q.chap)} 퀘스트를 다시 맞췄어요${st.refit.changed.length ? ` · 바뀐 칸 ${st.refit.changed.map(ROMAN).join(" · ")}` : ""}${st.refit.review.length ? ` · 적어 둔 칸 ${st.refit.review.map((x) => ROMAN(x.i)).join(" · ")}은 다시 볼까요?` : ""}` } : {});
  const refitChips = (q) => (st.refit && q && st.refit.chap === q.chap ? st.refit.review.map((x) => ({ label: `${ROMAN(x.i)} 다시 볼까요?`, act: "refit-review", i: x.i, kind: "soft" })) : []);
  function prefetch(q) {
    if (!q || !QU || st.mode !== "live" || !canLive) return;
    const n = q.chap + 1, r = N.DRAFT_STAGES.includes(n) ? (QU.isDone(q) ? QU.resultOf(q) : QU.expectedResult(q)) : null; if (!r) return;
    // 1단계를 하는 중이면 플로로가 권한 크기의 등급으로(맞아요면 만드는 크기가 그것이 된다 — 다음 장 할 일 수가 등급마다 다르다)
    const tier = q.chap === 0 && !QU.isDone(q) && q.draft && QU.SIZE_TIER[q.draft.size] ? QU.SIZE_TIER[q.draft.size] : st.tier;
    const prev = prevOf(n, r), key = preKey(n, prev, tier);
    if ((pre && pre.key === key) || sensitive([ideaNow(), ...prev.flatMap((x) => x.items.flatMap((y) => y.lines))].join("\n")).length) return;
    const mine = { key, r: null };
    mine.p = fetch("/api/stagedraft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: n, tier, idea: ideaNow(), prev, base: baseText() }) })
      .then((x) => x.json()).catch(() => ({ ok: false })).then((x) => { mine.r = x; return x; });
    pre = mine;
  }
  // 처음 한 바퀴(C-36, 2026-10-25 — 이재엽 "원하는 내용을 받으면 너가 전체적으로 글들을 확인해서 어떤 내용이고 우리 내용들에 맞춰서 너가 초안을 백엔드로 제작을 해 그리고 이 주제에 대한 내용을 제목으로"):
  //   받은 글 전체를 AI가 한 번 읽고(/api/start — 도구 없이 글만) 1단계 초안을 만든다 → 제목이 주제인 1단계 퀘스트를 받기 화면 없이 바로, 칸마다 확인만. 연습(서버 없이)은 예시 초안.
  //   초안을 못 받으면 까닭을 말하고 전처럼 1단계를 한 줄씩(받은 글이 처음 말한 것)
  let startText = "";
  async function startDraft(text, skipCheck) {
    if (st.busy) return say("앞의 일을 아직 기다리고 있어요 — 끝난 뒤에 다시 해 주세요");   // 다른 호출이 도는 중(웹 AI 제안 '시작' 등) — 빈 퀘스트를 만들지 않는다(F-103-5)
    startText = text; st.source = text;   // F-68(2026-10-28 이재엽 버튼 "통째로 파일에"): 받은 글 전부를 기록에 — 문서로 묶을 때 docs/00-source/idea.md로. AI · 문서의 '처음 말한 것'은 앞 400자(idea) 그대로
    if (st.mode !== "live" || !canLive) return beginQuest({ ...QU.EXAMPLE_DRAFT, example: true });
    if (!skipCheck && guard(text, "start")) return;
    Object.assign(st, { warn: null, error: "" });
    const r = await callAI("/api/start", { text });
    if (r.ok && r.start) { st.tokens = r.tokens || 0; fetchUsage(); return beginQuest(r.start); }
    st.idea = text.slice(0, N.IDEA_MAX);
    st.quest = { ...QU.makeQuest(N.STAGES[0], crits(0)), phase: "quest" }; questStarted();
    if (qauto) openQwin("quest");
    render(); say(`초안은 만들지 못했어요 — ${r.reason || "AI에 연결하지 못했어요"}. 한 줄씩 같이 적어요`); questText();
  }
  function beginQuest(d) {
    st.topic = d.topic; st.idea = startText.slice(0, N.IDEA_MAX);   // 처음 말한 것은 받은 글 그대로(앞 400자) — 다음 장 퀘스트 글 · 계획 세우기가 쓴다
    st.quest = applyStates(QU.withDraft(QU.makeQuest(N.STAGES[0], crits(0)), d)); questStarted();
    if (qauto) openQwin("quest");
    prefetch(st.quest);   // 2단계 초안을 뒤에서 미리(C-40)
    render();
    if (startText.length > N.IDEA_MAX) say(`받은 글은 통째로 두고(문서로 묶을 때 docs/00-source/idea.md), 다음 장 초안에는 앞 ${N.IDEA_MAX}자만 넘겨요`);   // F-68 — 잘라 넘기면 화면에 한 줄
  }
  // 2단계 초안(C-37, 2026-10-25 — 이재엽 "1단계에서 받은 내용들을 2단계에서도 초안들을 진행하며 생각들을 2단계 진행하기 전에 먼저 생각하고 동의들을 구한후"):
  //   받은 글(처음 말한 것) · 지난 장 결과로 이 장의 할 일마다 초안(/api/stagedraft, AI 한 번) → 받기 화면 없이 칸마다 확인. 못 받으면 까닭을 말하고 전처럼 받기 화면 · 한 줄씩. 연습은 예시 초안
  //   C-39(2026-10-25): 3단계도 — 지난 단계 결과를 전부([{ stage, items }]) 넘기고 칸마다 재료 · 이 단계 전에 준비할 것을 같이 받는다
  //   C-40: 2 ~ 8단계 모두. 미리 부른 초안(prefetch)이 같은 지난 결과로 만든 것이면 그것을 쓴다(받는 중이면 기다리고, 실패했으면 다시 부른다)
  async function stageDraft(n, skipCheck) {
    const prev = prevOf(n), idea = ideaNow();
    if (st.mode !== "live" || !canLive) { const ex = QU.exampleStageDraft(n, crits(n), prev); if (ex && st.quest) st.quest = applyStates(QU.withStageDraft(st.quest, ex)); return render(); }
    if (!skipCheck && guard([idea, baseText(), ...prev.flatMap((p) => p.items.flatMap((x) => x.lines))].join("\n"), "stage")) return;   // 기준 카드 줄도 같이 본다(새 맥락 리뷰 2026-10-28)
    if (st.busy) return say("앞의 일을 아직 기다리고 있어요 — 끝난 뒤에 다시 해 주세요");   // 미리 받은 초안(pre)을 버리거나 앞 호출의 planBusy를 지우지 않게(F-103-5)
    Object.assign(st, { warn: null, error: "", planBusy: "stage" });
    const hit = pre && pre.key === preKey(n, prev) ? pre : null; pre = null;
    let r = hit && hit.r && hit.r.ok ? hit.r : null;
    if (hit && !hit.r) { r = await callAI(null, null, hit.p); if (!r || !r.ok) r = null; }   // 미리 부른 것을 받는 중 — 같은 기다림 화면으로 기다린다
    if (!r) r = await callAI("/api/stagedraft", { stage: n, tier: st.tier, idea, prev, base: baseText() });
    st.planBusy = "";
    if (r.ok && r.draft && st.quest && st.quest.chap === n) { st.quest = applyStates(QU.withStageDraft(st.quest, r.draft)); st.tokens = r.tokens || 0; fetchUsage(); prefetch(st.quest); render(); return say(r.draft.say); }
    render(); say(`${LB(n)} 초안은 만들지 못했어요 — ${r.reason || "AI에 연결하지 못했어요"}. 받기 화면에서 한 줄씩 해요`); questText();
  }
  // ── 2단계를 마치면 계획서와 단계 폴더를 GitHub에(C-37, 이재엽 "2단계가 끝나면 … docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에" · 버튼 "docs 단계 폴더 + CLAUDE.md" ·
  //    "Floe가 만들고, 커밋 · 푸시는 Claude Code") — 파일은 docs.js(서버가 같은 것으로 작업 폴더에 쓴다 — 화면은 결과만 보낸다), 커밋 · 푸시는 사용자의 Claude Code(허락 카드는 채팅에) ──
  //   C-39: 결과 그대로(칸마다 누가 · 플로로 초안 · 재료, 준비할 것 · 확인한 날 · 관문 지난 날 · 완료 기준) + 처음 말한 것 — 서버가 증빙 칸 · 기획서 · 결정 기록을 만든다
  const shipResults = () => Object.fromEntries(Object.entries(st.results).map(([k, { chap, ...r }]) => [k, r]));
  const shipFiles = () => (FDOCS ? FDOCS.files({ topic: st.topic, idea: st.idea || "", results: st.results, redact: (t) => (window.NavSensitive ? window.NavSensitive.redact(t) : t) }) : []);
  const nosrcAt = (p) => { const n = FDOCS.SLUGS ? N.STAGES.findIndex((_, i) => FDOCS.stagePath(i) === p) : -1; return n >= 0 && st.results[n] && st.results[n].nosrc; };   // C-49 근거 없음 — 올리기 카드의 파일 목록에 보인다
  function momentShip() {
    if (st.ship.phase === "sent") return { tone: "green", mood: "happy", meta: `<span class="mm-stage">문서 올리기</span>`, title: "올리기를 Claude Code에 맡겼어요",
      sub: "커밋 · 푸시 전에 허락 카드가 이 위에 떠요. 끝나면 알려 드릴게요.", acts: [{ label: "진행 보기", act: "base-ai", kind: "ghost" }, { label: "확인했어요", act: "ship-done", kind: "ghost" }] };
    if (st.ship.phase === "public") return { tone: "amber", mood: "think", meta: `<span class="mm-stage">문서 올리기 · 한 번 더 확인</span>`, title: "누구나 볼 수 있는 저장소일 수 있어요",
      sub: esc(st.ship.reason || ""), foot: "이 저장소는 한 번만 물어요. 비밀로 둘 글이 있으면 '나중에'를 누르고 문서를 먼저 고쳐요.",
      acts: [{ label: "올릴게요", act: "ship-public", pri: true }, { label: "나중에", act: "ship-later", kind: "ghost" }] };   // 단축키 없음 — 앞 카드의 '올리기'(Enter)를 습관처럼 눌러 공개 푸시를 확인하지 않게(새 맥락 리뷰)
    // C-39(2026-10-25 — 버튼 "2단계부터 관문마다" · "증빙 칸 + 기획서 + 결정 기록"): 관문을 지날 때마다 다시 묶는다 — 같은 파일을 고쳐 쓰고 커밋 하나 더. 미리 보기는 기획서 · 결정 기록
    const files = shipFiles(), upto = Math.max(...Object.keys(st.results).map(Number)), peeks = [[FDOCS.MAIN_DOC, "기획서"], [FDOCS.LOG_DOC, "결정 기록"]];
    const peek = st.ship.peek != null && peeks[st.ship.peek] ? files.find((f) => f.path === peeks[st.ship.peek][0]) : null, tag = (p) => (peeks.find(([x]) => x === p) || [])[1];   // 파일 이름 옆 쉬운 이름(기획서 · 결정 기록)
    return { tone: "blue", mood: "happy", meta: `<span class="mm-stage">${LB(upto)}까지 정했어요</span>`, title: `1 ~ ${LB(upto)}에서 정한 것을 문서로 묶었어요 — 내 GitHub에 올릴까요?`,
      sub: `작업 폴더(${esc(wsShort())})에 단계 문서 · 기획서 · 결정 기록을 만들어요 — 칸마다 누가 어떻게 정했는지와 관문을 지난 날이 증빙으로 남아요. 커밋 · 푸시는 내 Claude Code가 해요(허락 카드가 떠요). README · CLAUDE.md · 목차 · 기획서 · 결정 기록은 Floe 절만 바꿔요.`,
      body: `<ul class="ship-files">${files.map((f) => `<li>${tag(f.path) ? `<b>${tag(f.path)}</b> ` : ""}${esc(f.path)}${f.merge ? " <small>절만 바꿈</small>" : ""}${nosrcAt(f.path) ? " <small>폴더에 없어요 — 다시 만들어요(근거 없음)</small>" : ""}</li>`).join("")}</ul><div class="ship-peek">${peeks.map(([, label], k) => `<button type="button" class="lnk" data-act="ship-peek" data-i="${k}" aria-expanded="${st.ship.peek === k}">${label} 미리 보기</button>`).join("")}${peek ? `<pre>${esc(peek.text)}</pre>` : ""}</div>`,
      acts: [{ label: "올리기", act: "ship-go", key: "Enter", pri: true }, { label: "나중에", act: "ship-later", kind: "ghost" }] };
  }
// ━━ app/45-knowledge.js ━━
  // ── 지식 퀘스트 C-49(2026-10-29 — PRD 6절 · 9절 3 · 4번 "사람이 확인한 기록만" · "글 지문"): 기록의 원본은 프로젝트 폴더 ──
  //   폴더를 알면(진짜 AI 모드 · 앱이 고른 폴더) 그 폴더마다 한 번 단계 문서를 다시 읽는다(GET /api/docs). 이 브라우저에 기록이 없으면 되살릴지 묻고,
  //   본 뒤 글 지문이 바뀐 문서는 '낡음' — 다시 읽을지 묻는다(나중에면 다음에 열 때 다시). 없어진 문서의 기록은 지우지 않고 '근거 없음'(nosrc).
  //   지문 st.docPrints = { project: 폴더 열쇠(실제 경로의 지문 — 이름이 같은 다른 폴더와 견주지 않게), wrote: {단계: Floe가 마지막에 쓴 글 — 이것과 같을 때만 다시 덮는다},
  //     own: {단계: 사람 것 — 되읽어 다시 쓰면 다른 글 · 읽을 수 없는 글, 덮지 않는다}, seen: {단계: 마지막으로 본 폴더 글}, dirty: 다시 읽은 기록으로 기획서 · 결정 기록을 아직 안 고침, declined: 되살리지 않고 새로 시작 }
  let docsFor = "", docsKey = "";
  const DP = () => (st.docPrints && typeof st.docPrints === "object" && !Array.isArray(st.docPrints) ? st.docPrints : {});
  const stageOfPath = (p) => N.STAGES.findIndex((_, i) => FDOCS.stagePath(i) === p);
  const byStage = (o) => Object.fromEntries(Object.entries(o || {}).map(([p, v]) => [stageOfPath(p), v]).filter(([n]) => n >= 0));
  // 올릴 때 서버에 줄 것 — 이 폴더에서 Floe가 쓴 지문(prints)과 사람 것(keep). 모르면(옛 기록 · 새로 시작 · 다른 폴더) 주지 않는다 → 전처럼 쓴다
  const shipKnown = () => { const P = DP(), at = (n) => FDOCS.stagePath(Number(n)); return P.project && P.project === docsKey && !P.declined ? { prints: Object.fromEntries(Object.entries(P.wrote || {}).map(([n, v]) => [at(n), v])), keep: Object.keys(P.own || {}).map(at) } : null; };
  async function docsCheck() {
    if (!canLive || st.mode !== "live" || !FDOCS) return;
    let r; try { r = await (await fetch("/api/docs", { cache: "no-store" })).json(); } catch { return; }
    if (!r || !r.ok || r.why === "folder" || !r.stages || typeof r.stages !== "object") return;
    if (!st.carry) { carryMaybe(); if (st.carry) render(); }   // C-48
    const got = Object.keys(r.stages).map(Number).filter((n) => N.STAGES[n] && r.stages[n].result).sort((a, b) => a - b);
    docsKey = r.key || "";
    const P = DP(), mine = !!r.key && P.project === r.key;
    if (!Object.keys(st.results).length) { if (got.length && !(mine && P.declined)) { st.restore = { phase: "offer", got, data: r }; render(); } else carryLoad(0); return; }   // 새 프로젝트(또는 새로 시작) — C-48 1단계에 가져온 것 · 보류한 것
    if (st.j) carryLoad(st.j.stage);   // C-48 지금 단계에 가져온 것 — 이 프로젝트에서 그 단계를 고르기 전이면(닫았다 다시 켜도)
    if (!mine) return;   // 다른 폴더(또는 지문을 남기기 전)의 기록 — 견주지 않는다(같은 경로라도 다른 프로젝트의 문서다)
    const stale = [], gone = [];
    for (const [k, print] of Object.entries(P.seen || {})) {
      const n = Number(k), f = r.stages[n];
      if (!st.results[n]) continue;
      if (!f) { if (!st.results[n].nosrc) gone.push(n); } else if (f.print !== print) stale.push(n);
    }
    if (gone.length) { st.results = { ...st.results, ...Object.fromEntries(gone.map((n) => [n, { ...st.results[n], nosrc: true }])) }; save(); }
    if (stale.length || gone.length) { st.restore = { phase: "stale", stale, gone, data: r }; render(); }
    else if (P.dirty && st.results[0] && st.results[1] && !st.ship) { st.ship = { phase: "offer" }; render(); }   // 다시 읽은 기록으로 기획서 · 결정 기록을 아직 고쳐 쓰지 않았다
  }
  // 되살린 뒤 이어 할 단계 — 관문을 지난(또는 다음 단계 기록이 있는) 마지막 단계의 다음
  const resumeStage = (stages) => { const has = (n) => !!(stages[n] && stages[n].result); let last = -1; for (let n = 0; n < N.STAGES.length; n++) if (has(n) && (stages[n].result.passed || has(n + 1))) last = n; return last + 1; };
  // 1단계 '크기' 칸의 글('크기: 보통 — …') → 만드는 크기(quest.js SIZE_AT · SIZE_WORD · SIZE_TIER)
  const tierOf = (r0) => { const it = QU && r0 && r0.items[QU.SIZE_AT], w = String((it && it.lines[0]) || "").replace(/^크기: /, ""); const k = it ? Object.keys(QU.SIZE_WORD).find((x) => w.startsWith(QU.SIZE_WORD[x])) : null; return k ? QU.SIZE_TIER[k] : ""; };
  function momentRestore() {
    const R = st.restore, list = (ns) => ns.map((n) => LB(n)).join(" · "), meta = `<span class="mm-stage">폴더의 기록</span>`;
    if (R.phase === "offer") {
      const nx = resumeStage(R.data.stages);
      return { tone: "blue", mood: "happy", meta, title: "작업 폴더에 남은 기록이 있어요 — 되살릴까요?",
        sub: `작업 폴더의 단계 문서에서 ${list(R.got)} 기록을 찾았어요. 이 브라우저에는 기록이 없어요. 되살리면 ${N.STAGES[nx] ? `${LB(nx)}부터 이어서 해요` : "끝낸 기록을 다시 볼 수 있어요"}.`,
        acts: [{ label: "되살리기", act: "restore-go", key: "Enter", pri: true }, { label: "새로 시작", act: "restore-later", kind: "ghost" }] };
    }
    const unread = R.stale.filter((n) => !R.data.stages[n].result), read = R.stale.filter((n) => R.data.stages[n].result);
    const lines = [...(read.length ? [`${list(read)} 문서를 폴더에서 고쳤어요 — 이 기록과 그 글로 만든 기획서 · 결정 기록이 낡았어요.`] : []),
      ...(unread.length ? [`${list(unread)} 문서는 Floe가 읽을 수 없게 바뀌었어요 — 기록은 그대로 두고 그 문서는 덮지 않아요.`] : []),
      ...(R.gone.length ? [`${list(R.gone)} 문서가 폴더에 없어요 — 기록은 지우지 않고 '근거 없음'으로 두었어요.`] : [])];
    return { tone: "amber", mood: "think", meta, title: read.length ? "폴더의 단계 문서가 바뀌었어요 — 다시 읽어 올까요?" : "폴더의 단계 문서가 달라졌어요",
      sub: esc(lines.join(" ")), ...(read.length ? { foot: "다시 읽으면 기록을 폴더의 글로 바꾸고, 기획서 · 결정 기록도 같은 파일에 고쳐 쓸지 물어요. 사람이 고친 단계 문서는 Floe가 덮지 않아요." } : {}),
      acts: R.stale.length ? [{ label: read.length ? "다시 읽기" : "확인했어요", act: "restore-read", key: "Enter", pri: true }, { label: "나중에", act: "restore-later", kind: "ghost" }] : [{ label: "확인했어요", act: "restore-later", key: "Enter", pri: true }] };
  }
  // 되살린 단계부터 — advance처럼 그 장의 할 일 · 퀘스트를 세운다(레벨 · 조개는 올리지 않는다 — 이미 지난 관문)
  function resumeAt(n) {
    const s = N.STAGES[n];
    if (!s) { st.finished = true; return; }
    st.j = { stage: n, reason: `폴더의 기록으로 ${LB(n)} "${s.title}"부터 이어서 해요.`, criteria: crits(n).map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    if (QU) st.quest = QU.retitle(QU.makeQuest(s, crits(n)), st.topic);
  }

  // ── 지식 퀘스트 C-48(2026-10-29 — PRD 6절 · 9절 1 · 2번): 다음 프로젝트로 가져가기 ──
  //   8단계(돌아보기)에 오면 단계마다 적은 배운 것으로 가져갈 것 초안(1 ~ 3개, AI 한 번 — 서버가 기준을 못 채운 초안은 한 번만 다시)을 만들지 묻고,
  //   초안마다 기준 다섯을 보이고 사람이 고쳐 채택 · 반려(까닭) · 보류를 고른다(장부는 이 컴퓨터의 Floe 폴더 — 서버). 단계에 들어서면 다른 프로젝트에서 채택한 것 중
  //   그 단계에 닿는 것을 최대 3개 보이고 이번에 쓸지 고른다(st.carryUse — C-51 계획의 근거). 진짜 AI 모드만(연습은 장부가 없다)
  const CARRY_WORD = { saving: "남기는 중…", adopted: "채택했어요", rejected: "반려했어요(보관)", held: "보류했어요 — 다음 프로젝트를 시작할 때 다시 물어요" };
  const learnedList = () => Object.entries(st.results).filter(([, r]) => typeof r.learned === "string" && r.learned.trim()).map(([k, r]) => ({ stage: Number(k), text: r.learned.trim().slice(0, 400) }));
  // 8단계에 있으면 켤 때마다 한 번 묻는다 — 이 프로젝트에서 다 정했으면(st.carryDone) 다시 묻지 않는다. 초안 전 '나중에'면 다음에 열 때 다시
  let carryAsked = false;
  function carryMaybe() { if (CY && !carryAsked && !st.carryDone && st.j && st.j.stage === 7 && !st.finished && st.mode === "live" && canLive) { carryAsked = true; st.carry = { phase: "offer" }; } }
  // 단계에 들어설 때 — 이 프로젝트에서 그 단계를 이미 골랐으면(carryUse에 있으면) 다시 묻지 않는다
  async function carryLoad(n) {
    if (!CY || !canLive || st.mode !== "live" || String(n) in (st.carryUse || {})) return;
    let r; try { r = await (await fetch(`/api/carry?stage=${n}`, { cache: "no-store" })).json(); } catch { return; }
    if (!r || !r.ok) return;
    const items = Array.isArray(r.items) ? r.items : [], held = n === 0 && Array.isArray(r.held) ? r.held : [];
    if (items.length || held.length) { st.carryOffer = { n, items, held, pick: items.map((x) => x.id) }; render(); }
  }
  const carryPost = async (body) => { try { return await (await fetch("/api/carry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json(); } catch { return { ok: false, reason: "서버에 닿지 못했어요" }; } };
  // 초안 하나를 장부에 — 누르는 동안(saving) 두 번 보내지 않고, 초안마다 id를 보내 같은 줄을 고쳐 쓴다(새 맥락 리뷰: 두 번 누르면 두 줄)
  async function carryDecide(k, action, reason = "") {
    const d = st.carry && st.carry.drafts && st.carry.drafts[k]; if (!d || d.state) return;
    d.state = "saving"; render();
    const r = await carryPost({ action, id: d.id, item: { text: d.text, why: d.why, stage: d.stage, review: d.review, from: d.from }, ...(reason ? { reason } : {}) });
    if (!r.ok) { d.state = ""; render(); return say(r.reason || "남기지 못했어요"); }
    d.state = { adopt: "adopted", reject: "rejected", hold: "held" }[action]; d.rejecting = false;
    if (st.carry.drafts.every((x) => x.state && x.state !== "saving")) { st.carryDone = true; save(); }   // 이 프로젝트에서 다 정했다 — 8단계 카드를 다시 띄우지 않는다
    render();
  }
  function momentCarry() {
    const C = st.carry, meta = `<span class="mm-stage">${LB(7)} · 가져갈 것</span>`, n = learnedList().length;
    if (C.phase === "offer") return { tone: "blue", mood: "happy", meta, title: "다음 프로젝트에 가져갈 것을 정리해 볼까요?",
      sub: n ? `단계마다 적은 배운 것 ${n}개와 결정 기록으로 초안을 1 ~ 3개 만들어요. 고쳐서 채택하거나 버려도 돼요 — 정하는 건 나예요.` : "관문에서 적은 배운 것이 없어요 — 작업 폴더의 결정 기록만으로 만들어 볼 수 있어요. 고쳐서 채택하거나 버려도 돼요.",
      acts: [{ label: "초안 만들기", act: "carry-draft", key: "Enter", pri: true }, { label: "나중에", act: "carry-later", kind: "ghost" }] };
    const rows = C.drafts.map((d, k) => {
      const miss = CY.missing(CY.measure(d, CY.today()));
      if (d.state) return `<li class="carry-d"><p><b>${esc(d.text)}</b> — ${CARRY_WORD[d.state]}</p></li>`;
      const stageSel = `<select data-act="carry-stage" data-i="${k}" aria-label="언제 쓰나(단계)"><option value="-1"${d.stage < 0 ? " selected" : ""}>언제 쓰나 — 고르기</option>${N.STAGES.map((x) => `<option value="${x.n}"${d.stage === x.n ? " selected" : ""}>${LB(x.n)} · ${esc(x.title)}</option>`).join("")}</select>`;
      const fromBtns = N.STAGES.map((x) => `<button type="button" class="b opt toggle" data-act="carry-from" data-i="${k}" data-v="${x.n}" aria-pressed="${d.from.includes(x.n)}">${x.n + 1}</button>`).join("");
      return `<li class="carry-d">
        <input class="mc-input" data-act="carry-text" data-i="${k}" maxlength="${CY.TEXT_MAX}" aria-label="다음엔 이렇게" value="${esc(d.text)}">
        <input class="mc-input" data-act="carry-why" data-i="${k}" maxlength="${CY.WHY_MAX}" aria-label="왜(무슨 일이 있었나)" placeholder="왜 — 이번에 무슨 일이 있었나요?" value="${esc(d.why)}">
        <p class="mc-sub">${stageSel} · 다시 볼 날 <input type="date" data-act="carry-review" data-i="${k}" value="${esc(d.review)}" aria-label="다시 볼 날"></p>
        <p class="mc-sub">근거 단계 <span class="opts" role="group" aria-label="근거 단계">${fromBtns}</span></p>
        <p class="mc-sub">${miss.length ? `못 채운 기준: ${miss.join(" · ")}` : "기준 다섯을 다 채웠어요"}</p>
        ${d.rejecting ? `<input class="mc-input" data-act="carry-reason" data-i="${k}" maxlength="${CY.REASON_MAX}" aria-label="버리는 까닭" placeholder="왜 버리나요?" value="${esc(d.reason || "")}">` : ""}
        <div class="opts">${btn({ label: "채택", act: "carry-adopt", i: k, kind: "opt", disabled: d.stage < 0 })}${btn({ label: "보류", act: "carry-hold", i: k, kind: "opt" })}${btn({ label: d.rejecting ? "이 까닭으로 반려" : "반려", act: "carry-reject", i: k, kind: "opt" })}</div></li>`;
    }).join("");
    const left = C.drafts.filter((d) => !d.state).length;
    return { tone: "blue", mood: "happy", meta, title: left ? `가져갈 것 초안 ${C.drafts.length}개 — 고쳐서 고르세요` : "가져갈 것을 다 정했어요",
      sub: esc(C.say || ""), body: `<ol class="carry">${rows}</ol>`,
      acts: left ? [{ label: "남은 것은 보류하기", act: "carry-hold-rest", kind: "ghost" }] : [{ label: "확인했어요", act: "carry-later", key: "Enter", pri: true }] };
  }
  function momentCarryOffer() {
    const O = st.carryOffer, meta = `<span class="mm-stage">${LB(O.n)} · 지난 프로젝트에서</span>`;
    const whence = (x) => [x.why ? `왜: ${esc(x.why)}` : "", x.project ? esc(x.project) : "", x.from && x.from.length ? `근거 ${x.from.map((n) => LB(n)).join(" · ")} 문서` : ""].filter(Boolean).join(" · ");   // 근거 단계 문서를 잇는다(새 맥락 리뷰)
    const items = O.items.map((x, k) => `<li>${btn({ label: x.text, act: "carry-use", i: k, kind: "opt toggle", pressed: O.pick.includes(x.id) })}${whence(x) ? `<small class="mc-fine">${whence(x)}</small>` : ""}</li>`).join("");
    const held = O.held.map((x, k) => `<li>${esc(x.text)}${whence(x) ? ` <small class="mc-fine">${whence(x)}</small>` : ""} ${btn({ label: "채택", act: "carry-held-adopt", i: k, kind: "opt", disabled: !(x.stage >= 0) })}</li>`).join("");
    return { tone: "blue", mood: "happy", meta, title: O.items.length ? "지난 프로젝트에서 가져온 것이 있어요 — 이번에 쓸까요?" : "보류해 둔 가져갈 것이 있어요",
      sub: O.items.length ? "고른 것은 이 단계의 준비 계획에 근거로 들어가요." : "채택하면 다음 프로젝트부터 그 단계에서 보여요.",
      body: `${items ? `<ul class="carry">${items}</ul>` : ""}${held ? `<p class="mc-sub">보류한 것</p><ul class="carry">${held}</ul>` : ""}`,
      acts: [{ label: "이대로", act: "carry-use-done", key: "Enter", pri: true }, { label: "이번엔 안 써요", act: "carry-use-none", kind: "ghost" }] };
  }

  async function shipGo(publicOk = false) {
    if (!st.ship || !(st.ship.phase === "offer" || (publicOk && st.ship.phase === "public"))) return;
    if (st.mode !== "live" || !canLive) { st.ship = null; render(); return say("연습이라 올리지 않았어요 — 진짜 AI 모드에서 작업 폴더에 만들고 올려요"); }
    if (st.busy) return;   // 앞 호출의 '무엇을 기다리나'를 지우지 않게(F-103-5)
    st.planBusy = "ship";
    const known = shipKnown();
    const r = await callAI("/api/docs", { topic: st.topic, idea: st.idea || "", source: st.source || "", results: shipResults(), card: st.card || null, ...(publicOk ? { publicOk: true } : {}), ...(known ? { prints: known.prints, keep: known.keep } : {}) });   // source — 받은 글 전부(F-68), card — 기준 카드(C-56)
    st.planBusy = "";
    // C-52(2026-10-29): 공개(또는 모름) 저장소 — 저장소마다 처음 한 번 더 묻는다. 서버는 아직 아무것도 쓰지 않았다
    if (!r.ok && r.why === "public") { st.ship = { ...st.ship, phase: "public", reason: r.reason || "" }; return render(); }
    // C-49: 쓴 단계 문서의 지문을 기억한다(맡기기가 실패해도 파일은 썼다) — 다음에 열 때 폴더의 글이 바뀌었는지(낡음) 본다. 다시 쓴 단계는 '근거 없음'도 걷는다
    if (r.prints) {
      if (r.key) docsKey = r.key;
      const P = DP(), same = P.project === docsKey && !P.declined, w = byStage(r.prints), own = { ...(same ? P.own : {}) };
      for (const n of Object.keys(w)) delete own[n];   // Floe가 방금 쓴 문서는 Floe 것
      st.docPrints = { project: docsKey, wrote: { ...(same ? P.wrote : {}), ...w }, seen: { ...(same ? P.seen : {}), ...w }, own, dirty: false };
      st.results = Object.fromEntries(Object.entries(st.results).map(([k, x]) => { if (!(k in w) || !x.nosrc) return [k, x]; const { nosrc, ...rest } = x; return [k, rest]; }));
      save();
    }
    if (!r.ok) { render(); return say(r.reason || "문서를 올리지 못했어요"); }
    st.ship = { phase: "sent", at: r.task && r.task.at }; render(); watchTask(r.task, "ship");
    const kept = (r.kept || []).map(stageOfPath).filter((n) => n >= 0);
    if (kept.length) say(`${kept.map((n) => LB(n)).join(" · ")} 문서는 폴더에서 고친 글이라 덮지 않았어요`);   // C-49 기록의 원본은 폴더
  }
  // 맡긴 올리기가 끝났나 — 맡긴 일 지켜보기(watchTask, F-69)가 끝나면 부른다. 막히면 막힘 카드가 먼저(다시 맡기면 같은 번호라 그대로 이어진다)
  function shipEnd(t) {
    if (!st.ship) return;
    st.ship = null;
    // Claude Code가 기준(커밋 · 푸시)마다 보고한다(C-32) — 끝났다(0)는 것만으로 올라갔다고 말하지 않는다(푸시를 건너뛰거나 허락을 거절해도 0으로 끝난다, 2026-10-25 리뷰)
    const r = t.report, pushed = !!(r && r.items[1] && r.items[1].done);
    say(t.state !== "done" ? "올리기가 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요" : pushed ? "올리기를 마쳤어요 — GitHub에서 docs 폴더를 볼 수 있어요"
      : r ? `푸시는 못 했어요 — ${r.easy}` : "Claude Code가 일을 마쳤어요 — 푸시됐는지 진행 보기에서 봐 주세요");
  }
  // 퀘스트 글 받기(C-22, API.md 3-17) — 진짜 AI 모드에서만. 설명 · 질문 · 예시만 받고 할 일 이름 · 개수는 코드 그대로. 못 받으면 기본 글(quest.js)로 두고 까닭만 말한다
  async function questText() {
    const q = st.quest; if (!q || !QU || st.mode !== "live" || !canLive) return;
    const idea = (st.idea || project() || "").trim(); if (!idea) return;
    if (sensitive(idea).length) return say("만들고 싶은 것에 비밀번호처럼 보이는 게 있어 AI에 보내지 않았어요 — 기본 글로 둘게요");
    const r = await callAI("/api/quest", { idea, stage: q.chap, tier: st.tier });
    if (r.ok && st.quest && st.quest.chap === q.chap) { st.quest = QU.withAI(st.quest, r.quest); st.tokens = r.tokens || 0; fetchUsage(); }
    render();
    if (!r.ok) say(`퀘스트 글은 기본 글로 둘게요 — ${r.reason || "AI에 연결하지 못했어요"}`);
  }
  // 완료 보고(C-22) — 적은 줄을 작업 글로 모아 어디쯤인지 본다. 진짜 AI는 서버(/api/judge)가, 연습은 적은 대로(quest.js localJudgement). 판정 규칙은 그대로
  function questReport() {
    const q = st.quest; if (!q || !QU.isDone(q)) return;
    if (refuse(mealWhy())) return;
    const text = QU.textOf(q, st.idea);
    st.quest = { ...q, edit: false }; st.text = text; st.notice = ""; st.undo = [];   // '보고했어요'(done)는 살펴본 결과를 받은 뒤 landed가 — 실패하면 완료 보고 칩이 다시 보인다(2026-10-25 리뷰)
    Object.assign(st, { error: "", warn: null });
    // C-40(2026-10-26 — 이재엽 버튼: 확인한 단계는 AI 살펴보기를 건너뛰기, FR-1 · FR-2가 바뀜): 초안을 칸마다 확인한 장은 AI가 다시 살펴보지 않고 확인한 대로 본다 — 문서에는 '확인한 대로'(checkBy confirm)
    if (st.mode === "fixture" || q.draft) {
      const j = N.parseJudgement(QU.localJudgement(q, q.draft ? QU.CONFIRM_REASON : undefined), text, q.chap, st.tier);
      return j ? landed(j, 0, text, q.draft ? "confirm" : "") : stop("적은 글을 보지 못했어요. 만드는 크기를 바꿨으면 퀘스트를 다시 받아 주세요.");
    }
    return askAI("/api/judge", { text, stage: q.chap, tier: st.tier }, "살펴보지 못했어요", (r) => landed(r.judgement, r.tokens, text), [text, "judge"]);
  }
  // 퀘스트 창(C-22) — 머리띠(제목 · 프로젝트 · 크기 S/M/L · 닫기) · 탭(퀘스트 · 도전과제 · 책) · 판. 위 줄의 '퀘스트' 단추로 켜고 끈다(C-35). 끌어 옮기기는 Electron 창으로 만들 때(다음 판, 정할 것 10)
  let qpop = false;
  const openQwin = (tab) => { if (!st.qwin) { qpop = true; loadFiles(); } st.qwin = true; st.qtab = tab || st.qtab; };   // 열 때 파일 칸의 목록도(R-8)
  const closeQwin = () => { st.qwin = false; go("petit"); };   // 작업실을 닫으면 섬은 알약으로 — 펼친 섬 대화창이 따로 남지 않게(F-85, 두승현 2026-10-29). 처음 설정 · 서고 · 장면 바꾸기는 섬이 필요하거나 화면을 떠나 그대로
  const QTABS = [["canvas", "캔버스"], ["quest", "노트북"], ["tree", "도전과제"], ["lib", SHELF_ON ? "서고" : "책"]];   // 문서 지도 탭(C-45)은 2026-10-28 C-54로 도전과제 안의 '상자' 보기가 됐다(이재엽 버튼 "'도전과제' 그대로")   // 문서 지도 — C-45(2026-10-27, 이재엽 버튼 "작업실의 새 탭")   // 작업실 창(C-41, 2026-10-26): 캔버스가 먼저, 옛 퀘스트 탭은 노트북. 책 — C-26(2026-10-23). 배우기 탭은 2026-10-24 C-35로 도전과제의 장마다
  // 캔버스 판 — 작업실 창의 첫 탭(C-41 ① 2026-10-26 · ⑥ 2026-10-27 두승현 "의도했던 것은 첨부한 이미지처럼 펼쳐져 있는 환경" — 디자인 캔버스 DockPrototype의 판 그대로):
  //   1100×640 판을 칸(.cv)에 맞춰 줌한다(app.css .cvb의 --u — 컨테이너 단위라 스크립트 없이, 앱의 창이든 브라우저의 판이든). 2026-10-27 C-42 R-11(이재엽 "줌 + 모자라면 다시 배치"): 0.85배 아래로 줄어야 하면
  //   줌하지 않고 격자로 다시 배치한다 — 두 줄(① ② ③ / ④ ⑤ 관문) · 640 미만은 세로 한 줄, 글자 크기는 설정 그대로(app.css @container). 지금 하는 일 · 단계 칩 · 왼쪽에 지난 장 / 다음 장 보드 ·
  //   틀 안에 ① 생각(포스트잇) · 파일 카드 · 배울 말 · 화살표 → ② 행동 → ③ 기록(적은 칸 카드) → ④ 저장 → ⑤ 버전 → 관문, 작은 플로로는 첫 '지금' 칸 옆(FLO_AT).
  //   칸의 글은 지금 상태에서만 — 생각: 퀘스트의 지금 칸(quest.js), 행동: 맡긴 일(plan.js), 기록: 적은 칸 · 살펴본 결과(st.results), 저장: 단계 문서(st.docs · docs.js), 버전: 대회 뒤(C-23), 관문: 지난 날.
  const FLO_AT = { c1: [420, 100], c2: [640, 92], c3: [1040, 92], c4: [690, 382], c5: [920, 382], c6: [1040, 382] };   // 작은 플로로가 서는 자리(판 좌표) — 목업의 FLO
  const FLO_MINI = '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="38" rx="22" ry="20" fill="#EEF5FD" stroke="#9FB5D9" stroke-width="2"></ellipse><circle cx="24" cy="34" r="3" fill="#1A2350"></circle><circle cx="40" cy="34" r="3" fill="#1A2350"></circle><ellipse cx="32" cy="40" rx="2.6" ry="1.8" fill="#1A2350"></ellipse><ellipse cx="20" cy="42" rx="3" ry="1.6" fill="#F4C9CF"></ellipse><ellipse cx="44" cy="42" rx="3" ry="1.6" fill="#F4C9CF"></ellipse></svg>';
  const ARROW = (cls, w, h, d) => `<svg class="cv-ar ${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  const ARROWS = ARROW("a1", 40, 20, "M2 10h30M26 4l7 6-7 6") + ARROW("a2", 40, 20, "M2 10h30M26 4l7 6-7 6") + ARROW("a3", 130, 60, "M120 4 C 110 40, 60 46, 14 48 M22 41 L12 48 L22 55") + ARROW("a4", 40, 20, "M2 10h30M26 4l7 6-7 6") + ARROW("a5", 30, 20, "M2 10h20M17 4l7 6-7 6");
  // F-66(2026-10-27 이재엽 "캔버스가 움직이는것도 안되고"): 캔버스를 끌어서 옮기고 크게 · 작게 — canvas-pan.js가 작업실 안에서 한다(단추는 data-cv라 섬으로 보내지 않는다).
  //   처음은 '맞춤'(줌 · 다시 배치, R-11). 가운데 단추의 글(맞춤 · n%)은 canvas-pan.js가 바꾼다
  const CV_HINT = "캔버스 — 끌어서 옮겨요. ⌘ 또는 Ctrl을 누른 채 휠(트랙패드는 두 손가락 오므리기)로 크게 · 작게, 키보드는 + − 0과 화살표";
  const CV_TOOLS = `<div class="cv-tools" role="group" aria-label="캔버스 크기"><button type="button" data-cv="out" aria-label="작게" title="작게 (−)">−</button><button type="button" class="cv-z" data-cv="fit" aria-pressed="true" aria-label="화면에 맞춤 (지금 맞춤)" title="화면에 맞춤 (0)">맞춤</button><button type="button" data-cv="in" aria-label="크게" title="크게 (+)">+</button></div>`;
  function canvasPane(n) {
    const q = st.quest && st.quest.chap === n ? st.quest : null, r = st.results[n], ci = q ? QU.curIdx(q) : -1;
    let floAt = "";
    const cell = (pos, k, no, name, body, ft, extra) => { if (k === "now" && !floAt) floAt = pos; return `<div class="cv-c ${pos} ${k} st-${k}${pos === "c6" ? " st-gate" : ""}"><p class="ch">${no ? `${no} ` : ""}${name}<em>${{ now: "지금", done: "끝" }[k] || ""}</em></p><p>${esc(body)}</p>${extra || ""}${ft ? `<p class="ft">${esc(ft)}</p>` : ""}</div>`; };
    const p = q ? QU.progress(q) : null;
    const now = st.busy ? "플로로가 살펴보는 중" : st.finished ? "모든 장을 끝냈어요" : !q && !st.j ? "채팅에서 원하는 것을 말하면 1단계 초안을 만들어요" : q && q.phase === "draft" ? "퀘스트를 받기 전 — 노트북 탭에서 받아요" : q && q.phase === "done" ? "보고했어요 — 넘어가기 전 확인은 섬에서" : q && ci >= 0 ? `${p.n}개 중 ${p.k}번째 칸 — ${QU.shortOf(q.objs[ci].name)}` : q ? "칸을 다 적었어요 — 완료 보고" : progress();
    const line = q && ci >= 0 ? (q.lines[ci] || [])[0] : "", draft = q && ci >= 0 ? QU.proposalOf(q, ci) : "";
    const prepC = st.prep && st.prep.ok && st.prep.cards ? st.prep.cards[n] : null, prepThink = prepC ? prepC.think : "";   // C-54 준비된 퀘스트 — 그 장에 들어서면 ① 생각의 초안 자리에
    const think = q && ci >= 0 ? cell("c1", "now", "①", "생각", line || draft || prepThink || "비었어요 — 채팅에서 같이 적어요", !line && draft ? "플로로 초안 — 채팅에서 맞는지 봐요" : !line && prepThink ? `준비된 퀘스트 — ${prepC.from}` : "")
      : q || r ? cell("c1", "done", "①", "생각", "칸을 다 적었어요") : cell("c1", st.idea ? "done" : "now", "①", "생각", st.idea ? st.idea.slice(0, 80) : "무엇을 만들고 싶은지 말해요");
    const b = FP && st.plan, run = b && FP.running(b), pg = b ? FP.progress(b) : null;
    // R-5 ② 행동(C-42, 2026-10-27): 지금 맡긴(또는 다음에 맡길) 일의 이름과 진행 n/m — 상태 글 대신 내용
    const wst = (id) => (b && b.work && b.work[id] ? b.work[id].state : "todo");
    const curItem = b ? b.plan.items.find((x) => wst(x.id) === "running") || b.plan.items.find((x) => wst(x.id) === "todo") : null, itemName = curItem ? String(curItem.need || curItem.check || "").slice(0, 60) : "";
    const act = run ? cell("c2", "now", "②", "행동", `${itemName ? `${itemName} — ` : ""}Claude Code가 하는 중 · 맡긴 일 ${pg.done}/${pg.total}`, "다 되면 채팅에 보고가 와요") : b && b.confirmed ? cell("c2", pg.done === pg.total ? "done" : "later", "②", "행동", `${itemName ? `다음: ${itemName} · ` : ""}맡긴 일 ${pg.done}/${pg.total}`, "채팅의 '맡기기'로 다음 줄을") : cell("c2", "later", "②", "행동", "Claude Code에 맡김", "준비 계획을 확정하면 맡겨요");
    const ck = r && r.check;
    // R-5 ③ 기록(C-42): 적은 칸은 카드에 그 줄(정한 것)을 보인다 — 아직인 칸은 짧은 이름. 3단계의 '꼭 / 있으면 좋음'은 한 칸(Ⅲ)에 적는다 [해석: 스토리보드의 두 칸 → 한 줄]
    const cards = q ? `<div class="cv-cards">${q.objs.map((o, i) => { const ln = (q.lines[i] || [])[0] || ""; return `<span class="${QU.filled(q, i) ? "y" : ""}" title="${ROMAN(i)} ${esc(QU.nameOf(q, i))}">${ROMAN(i)} ${esc(QU.filled(q, i) && ln ? ln : QU.nameOf(q, i))}</span>`; }).join("")}</div>` : "";
    const rec = r ? cell("c3", "done", "③", "기록", `확인 ${r.at || ""}${ck ? ` · 기준 ${ck.filter((x) => x.met).length}/${ck.length}` : ""}`, "도전과제 탭에서 칸마다 누가 정했는지") : q ? cell("c3", QU.isDone(q) ? "now" : "later", "③", "기록", `정한 줄 ${q.objs.filter((_, i) => QU.filled(q, i)).length}/${q.objs.length}`, QU.isDone(q) ? "완료 보고를 하면 플로로가 살펴봐요" : "", cards) : cell("c3", "later", "③", "기록", "① 생각이 끝나면 칸이 생겨요");
    // R-5 ④ 저장(C-42): 올라갈 파일 이름 — 이 장의 단계 문서 · 기획서 · 결정 기록(docs.js가 만드는 것과 같은 이름)
    const slug = FDOCS ? FDOCS.SLUGS[n] : "", files = slug ? [`docs/${slug}/${slug.slice(3)}.md`, FDOCS.MAIN_DOC, FDOCS.LOG_DOC] : [];
    const fl = files.length ? `<ul class="cv-files">${files.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : "";
    const save = docDone(n) ? cell("c4", "done", "④", "저장", "단계 문서를 확정했어요", "", fl) : FDOCS && st.results[0] && st.results[1] ? cell("c4", "now", "④", "저장", "문서로 묶어 GitHub에", "도전과제 탭의 한눈에 보기에서", fl) : cell("c4", "later", "④", "저장", "아직 — 관문 뒤에", "", fl);
    const ver = cell("c5", "later", "⑤", "버전", `${LB(n)}를 넘으면 책에 V.${n + 1}`, "대회 뒤 (C-23)");
    // R-5 관문(C-42): 남은 기준 수와 '안 됨'인 기준 이름(짧은 이름) — 셋까지, 나머지는 +n
    const unmet = st.j && !st.finished && st.j.stage === n ? st.j.criteria.filter((x) => !x.met).map((x) => QU.shortOf(x.text)) : [];
    const ul = unmet.length ? `<details class="cv-unmet-d"><summary>남은 기준 ${unmet.length}</summary><ul class="cv-unmet">${unmet.slice(0, 3).map((x) => `<li>안 됨 · ${esc(x)}</li>`).join("")}${unmet.length > 3 ? `<li>+${unmet.length - 3}</li>` : ""}</ul></details>` : "";   // C-60: 처음엔 접혀 있다
    const gate = r && r.passed ? cell("c6", "done", "", "관문", `지났어요 ${r.passed.slice(5)}`) : holding() ? cell("c6", "later", "", "관문", "멈춰 둔 단계 — 섬에서 다시 열어요") : allDone() ? cell("c6", "now", "", "관문", "넘어가기 전 확인 — 섬에서") : cell("c6", "later", "", "관문", st.j ? (unmet.length ? "넘어가기 전 확인" : `남은 기준 ${left()}`) : "할 일을 다 하면 열려요", "", ul);   // 남은 기준 수는 접힌 줄(details)에 한 번만
    const [fx, fy] = FLO_AT[floAt || "c1"];
    // C-58(2026-10-29): 정보마다 집 하나 — 단계 이름은 머리 줄(stageHead — 단계 칩은 2026-10-29 두승현 결정으로 뺐다), '지금 하는 일' · 작은 플로로는 섬 카드가 보이는 동안 그리지 않는다(섬이 접혔을 때만), 보드 · 배울 말 · 파일 카드는 뺐다
    return `<div class="cvw"><div class="cv" tabindex="0" role="region" aria-label="${CV_HINT}"><div class="cvp"><div class="cvb" style="--fa:${floAt || "c1"}">${colFolded() ? `<div class="cv-now">지금 하는 일 <b>${esc(now)}</b></div>` : ""}<div class="cv-frame"></div><div class="cv-bh"><span>퀘스트 한 바퀴 — 다섯 칸</span></div>
      ${think}${ARROWS}${act}${rec}${save}${ver}${gate}${colFolded() ? `<div class="cv-flo" style="--fx:${fx};--fy:${fy}" title="플로로 — 지금 칸 옆에">${FLO_MINI}</div>` : ""}</div></div></div>${CV_TOOLS}</div>`;
  }
  // 파일 칸(C-41 ⑥ → C-42 R-8, 2026-10-27 이재엽 버튼 "전부" · "깊이 3 · 200개"): 작업실 왼쪽의 폴더 트리. 서버로 연 화면은 GET /api/files(API.md 3-25 — 연결한 폴더의 이름만, 읽기만)로 진짜 목록을,
  //   서버 없이 · 연습 모드 · 폴더를 모르면 아래 예시 그대로(목업의 예시 — [이름, 안쪽인가, 상태 글, 모양])에 '예시' 표시. 지금 장 문서는 '● 지금', 지난 장 문서는 '읽음', 폴더는 눌러 접고 펼친다
  //   예시 한 줄 = [이름, 안쪽인가, 상태 글, 모양, 펼친 폴더인가]
  const FILES_DUMMY = [["README.md", 0, "고침 · 책", "fix"], ["CLAUDE.md", 0, "", ""], ["docs", 0, "", "dir", 1], ["01-idea.md", 1, "읽음", ""], ["03-requirements.md", 1, "지금", "now"], ["decisions.md", 1, "새로", "new"], ["기획서.md", 1, "", ""], ["src", 0, "", "dir"]];
  // F-67(2026-10-27 이재엽 "지금 폴더들도 폴더라는 느낌이 안들어"): 폴더는 꺾쇠(펼치면 아래로) + 폴더 그림(접힘 · 펼침) + 굵은 이름 + 안의 개수, 파일은 종류 그림(md · 코드 · 그 밖).
  //   깊이마다 들여쓰기 안내선(app.css). 그림은 파스텔 — 이름 글자가 뜻을 갖고 그림은 거든다
  const FN_PAGE = (fill, line, glyph) => `<svg viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="${fill}" stroke="${line}" stroke-linejoin="round"/><path d="M9.5 1.5v3h3" fill="none" stroke="${line}" stroke-linejoin="round"/>${glyph}</svg>`;
  const FN_ICON = { dir: '<svg viewBox="0 0 16 16"><path d="M1.5 4.25c0-.69.56-1.25 1.25-1.25h3.4l1.5 1.5h5.6c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H2.75c-.69 0-1.25-.56-1.25-1.25z" fill="#F2DC94" stroke="#B48A2C"/></svg>',
    open: '<svg viewBox="0 0 16 16"><path d="M1.5 12.5V4.25c0-.69.56-1.25 1.25-1.25h3.4l1.5 1.5h5.1c.69 0 1.25.56 1.25 1.25V7" fill="#E8CD7A" stroke="#B48A2C" stroke-linejoin="round"/><path d="M3.9 7h10.9l-2.3 5.75H1.5z" fill="#F7E6AE" stroke="#B48A2C" stroke-linejoin="round"/></svg>',
    md: FN_PAGE("#E6EEFB", "#6F86C2", '<path d="M5.5 8h5M5.5 10.5h5M5.5 13h3" stroke="#6F86C2" stroke-linecap="round"/>'),
    code: FN_PAGE("#E3F4EA", "#4E8E6A", '<path d="M6.5 8.5 5 10l1.5 1.5M9.5 8.5 11 10l-1.5 1.5" fill="none" stroke="#4E8E6A" stroke-linecap="round" stroke-linejoin="round"/>'),
    file: FN_PAGE("#F1F3F8", "#8E9AB6", "") };
  const FN_CHEV = '<svg viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const fIcon = (k) => `<i class="fi" aria-hidden="true">${FN_ICON[k] || FN_ICON.file}</i>`;
  const fKind = (name) => (/\.(md|mdx|markdown|txt)$/i.test(name) ? "md" : /\.(m?[jt]sx?|cjs|py|java|kt|go|rb|rs|c|h|cc|cpp|cs|php|swift|html?|css|scss|json|ya?ml|toml|sh|sql|vue|svelte)$/i.test(name) ? "code" : "file");
  const exRow = ([name, inner, tag, k, open]) => { const dir = k === "dir";
    return `<li class="${k === "now" ? "st-now" : k} d${inner ? 2 : 1}"><span class="fn-x">${dir ? `<i class="chev-w${open ? " on" : ""}" aria-hidden="true">${FN_CHEV}</i>${fIcon(open ? "open" : "dir")}` : `<i class="chev-w"></i>${fIcon(fKind(name))}`}<span>${esc(name)}</span></span>${tag ? `<small>${esc(tag)}</small>` : ""}</li>`; };
  async function loadFiles() {
    if (!canLive || st.mode === "fixture") { st.files = { src: "example", why: canLive ? "연습 모드예요" : "서버 없이 열었어요" }; return; }   // 연습 모드는 진짜 폴더를 섞지 않는다(README와 같이)
    try {
      const r = await (await fetch("/api/files", { cache: "no-store" })).json();
      if (r && r.ok && r.files) {
        const n = st.finished ? N.STAGES.length - 1 : atStage(), slug = FDOCS ? FDOCS.SLUGS[n] : "";
        st.fnOpen = r.files.map((f, i) => (f.dir && (f.path === "docs" || (slug && f.path === `docs/${slug}`)) ? String(i) : "")).filter(Boolean);   // 지금 장의 폴더는 펼쳐 둔다 — 열쇠는 목록의 번호(가린 이름끼리 경로가 겹칠 수 있다, 새 맥락 리뷰)
        st.files = { src: "mine", project: r.project, list: r.files, total: r.total, cut: !!r.cut, unread: r.unread || 0, depth: r.depth, why: "" };
        for (const f of st.openFiles) f.i = r.files.findIndex((x) => !x.dir && x.path === f.path);   // 열린 파일은 새 목록의 번호로 다시 잇는다(없어졌으면 -1 — 저장하지 못한다)
      } else st.files = { src: "example", why: "연결한 폴더를 아직 몰라요" };
    } catch { st.files = { src: "example", why: "서버에 닿지 않았어요" }; }
    render();
  }
// ━━ app/50-chatlist.js ━━
  // ── C-63 왼쪽 대화 목록(2026-10-29, 두승현 PRD 3-2 · 이재엽 승인): 프로젝트 이름 → 단계 바로가기(최근이 위 — 지금 / 그 단계를 이야기한 날) → 맨 아래 '전체 파일'(지금의 폴더 모양, 한 칸 들여서).
  //   바로가기를 누르면 새 대화를 열지 않고 같은 대화의 그 구분선으로 옮겨 잠깐 강조하며, 그 단계가 만든 · 고친 파일('새로' · '고침')을 펼친다. 다시 누르면 접힌다 ──
  const dateOf = (n) => { const m = [...st.chat].reverse().find((x) => x.kind === "stage" && x.n === n); return m && m.at ? new Date(m.at).toLocaleDateString("sv").slice(5).replace("-", "/") : ""; };
  // 그 단계의 파일 — 서버가 쌓은 바뀐 파일(3-32 changes — 훅 알림의 Write · Edit)을 이 단계 구분선과 다음 구분선의 at 사이로 나누고(new → 새로, edit → 고침), 단계 문서(폴더에 있을 때)를 더한다. 두승현 2026-10-28 "둘 다"
  function stageFilesOf(n) {
    const marks = st.chat.filter((m) => m.kind === "stage"), me = [...marks].reverse().find((m) => m.n === n), start = me ? me.at : null, next = me ? marks.find((m) => m.at > me.at && m.n !== n) : null, end = next ? next.at : Infinity;
    const got = {};
    if (start !== null) for (const c of st.chatChanges || []) { if (c.at < start || c.at >= end) continue; got[c.path] = got[c.path] === "새로" ? "새로" : c.how === "new" ? "새로" : "고침"; }
    const out = Object.entries(got).map(([path, tag]) => ({ path, tag }));
    const doc = nowDocPath(n); if (doc && !got[doc] && haveDocs().has(doc)) out.push({ path: doc, tag: "새로" });
    return out.sort((a, b) => a.path.localeCompare(b.path, "en"));
  }
  const fileBtn = (path) => { const i = st.files && st.files.src === "mine" && st.files.list ? st.files.list.findIndex((x) => x.path === path) : -1; return i >= 0 ? `<button type="button" class="fn-file" data-act="fn-open" data-v="${i}">${esc(path.split("/").pop())}</button>` : `<span>${esc(path.split("/").pop())}</span>`; };
  function chatNav() {
    const cur = st.finished ? N.STAGES.length - 1 : atStage();
    const seen = new Set(st.chat.filter((m) => m.kind === "stage").map((m) => m.n)); seen.add(cur); for (const k of Object.keys(st.results)) seen.add(Number(k));
    const stages = [...seen].filter((n) => N.STAGES[n]).sort((a, b) => b - a);
    const rows = stages.map((n) => { const open = st.chatOpen === n, files = stageFilesOf(n);
      return `<li class="cn${n === cur ? " st-now" : ""}"><button type="button" data-act="chat-go" data-v="${n}" aria-expanded="${open}"><i class="chev-w${open ? " on" : ""}">${FN_CHEV}</i><span>${n + 1} · ${esc(N.STAGES[n].short || N.STAGES[n].title)}</span><small>${n === cur ? "지금" : dateOf(n)}</small></button>${
        open ? `<ul class="cn-files">${files.length ? files.map((f) => `<li>${fileBtn(f.path)}<small>${f.tag}</small></li>`).join("") : "<li><span>아직 바뀐 파일이 없어요</span></li>"}</ul>` : ""}</li>`; }).join("");
    return `<p class="fn-h"><b>${fIcon("open")}<span>${esc(project() || "예시 프로젝트")}</span></b></p><ul class="fn cn-list">${rows}</ul><details class="fn-all"${st.fnAll ? " open" : ""}><summary>전체 파일</summary>${fileNav()}</details>`;
  }
  function fileNav() {
    const f = st.files, mine = f && f.src === "mine" && f.list;
    if (!mine) return `<p class="fn-h"><b>${fIcon("open")}<span>${esc(project() || "예시 프로젝트")}</span></b><em title="${esc(f && f.why ? `${f.why} — 폴더를 연결하면 진짜 목록이 와요` : "폴더를 연결하면 진짜 목록이 와요")}">예시</em></p><ul class="fn">${FILES_DUMMY.map(exRow).join("")}</ul><p class="fn-ft">폴더를 연결하면 그 폴더의 진짜 파일 이름이 여기에 와요 — Claude Code가 고친 파일은 캔버스의 파일 카드에</p>`;
    const n = st.finished ? N.STAGES.length - 1 : atStage(), slugs = FDOCS ? FDOCS.SLUGS : [], nowDir = slugs[n] ? `docs/${slugs[n]}/` : "";
    const tagOf = (x) => { if (x.dir) return ""; if (nowDir && x.path.startsWith(nowDir)) return "지금"; const k = slugs.findIndex((s, i) => i < n && x.path.startsWith(`docs/${s}/`)); return k >= 0 && st.results[k] ? "읽음" : ""; };
    const kids = {}, up = [];   // 폴더마다 바로 아래의 수(F-67) — 목록은 깊이 순서라 쌓아 가며 센다
    f.list.forEach((x, i) => { while (up.length && f.list[up[up.length - 1]].depth >= x.depth) up.pop(); if (up.length) kids[up[up.length - 1]] = (kids[up[up.length - 1]] || 0) + 1; if (x.dir) up.push(i); });
    const open = new Set(st.fnOpen); let closedAt = 0;   // 접힌 폴더의 안쪽(더 깊은 것)은 건너뛴다 — 깊이로 본다(경로 글에 기대지 않는다)
    const q = st.fnFind.trim().toLowerCase(), cur = st.openFiles[st.fileSel];   // 찾기(C-43): 글이 있으면 접힘과 상관없이 이름에 그 글이 든 파일만 한 줄로
    const rows = f.list.map((x, i) => {
      if (q) { if (x.dir || !x.path.toLowerCase().includes(q)) return ""; }
      else { if (closedAt && x.depth > closedAt) return ""; closedAt = 0; }
      const isOpen = x.dir && open.has(String(i)); if (x.dir && !isOpen) closedAt = x.depth;
      const tag = tagOf(x), sel = !!cur && cur.path === x.path && st.qtab === "file";
      return `<li class="${x.dir ? "dir" : tag === "지금" ? "st-now" : ""}${sel ? " sel" : ""} ${q ? "d1" : `d${x.depth}`}">${x.dir ? `<button type="button" data-act="fn-dir" data-v="${i}" aria-expanded="${isOpen}"><i class="chev-w${isOpen ? " on" : ""}">${FN_CHEV}</i>${fIcon(isOpen ? "open" : "dir")}<span>${esc(x.name)}</span>${kids[i] ? `<small class="fn-n">${kids[i]}</small>` : ""}</button>` : `<button type="button" class="fn-file" data-act="fn-open" data-v="${i}" aria-current="${sel ? "true" : "false"}"><i class="chev-w"></i>${fIcon(fKind(x.name))}<span>${esc(q ? x.path : x.name)}</span></button>`}${tag ? `<small>${tag}</small>` : ""}</li>`;
    }).join("");
    const ft = f.total ? `${f.total}개 · 깊이 ${f.depth}까지 · 이름만 봐요${f.cut ? " · 더 있어요(200개까지만)" : ""}${f.unread ? ` · 읽지 못한 폴더 ${f.unread}` : ""}` : "비어 있어요 — 이 폴더에 보일 파일이 없어요";
    return `<p class="fn-h"><b>${fIcon("open")}<span>${esc(f.project || project() || "")}</span></b></p><input class="fn-find" type="search" data-act="fn-find" value="${esc(st.fnFind)}" placeholder="파일 이름 찾기" aria-label="파일 이름 찾기"><ul class="fn">${rows || (q ? `<li class="d1"><span>'${esc(st.fnFind)}'이 든 파일이 없어요</span></li>` : "")}</ul><p class="fn-ft">${ft}</p>`;
  }
// ━━ app/55-files.js ━━
  // ── 파일 보기 · 고치기(C-43, 2026-10-27 이재엽 "orca를 인용해서 코드나 md 파일을 확인" · 버튼 "읽기 + 고치기" · "바로 저장 + 되돌리기" · "저장마다 커밋 맡기기" · "512KB · 내용으로 판단") ──
  //   파일 칸에서 누르면 서버가 목록의 번호로 연다(GET /api/file?i — API.md 3-26, 경로를 보내지 않는다). md는 보기 좋게(md-view.js) · 원문으로, 코드 · 글은 줄 번호와 함께, git과 다른 줄은 표시.
  //   고치기 → 글 칸, 저장(단추 · ⌘/Ctrl+S)은 바로 쓰고 그 파일만 커밋 · 푸시를 Claude Code에 맡긴다(허락 카드는 채팅에). 비밀값 모양 · 연 뒤에 바뀜 · 맡긴 일이 도는 중이면 서버가 멈추고(409) 여기서 묻는다.
  //   저장 이력은 이 켜짐 동안 열린 파일마다 20번까지(되돌리기) — 이 컴퓨터에만. 열린 파일 탭 · 이름 찾기. 서버 없이 · 연습 모드는 예시 목록이라 열지 못한다
  const MDV = window.FloeMd || null, FHIST_MAX = 20;
  const fileTabs = () => st.openFiles.map((f, k) => `<span class="ftab${f.dirty ? " dirty" : ""}"><button type="button" role="tab" data-act="ftab" data-v="${k}" aria-selected="${st.qtab === "file" && st.fileSel === k}" title="${esc(f.path)}">${esc(f.name)}${f.dirty ? " •" : ""}</button><button type="button" class="ftab-x" data-act="fclose" data-v="${k}" aria-label="${esc(f.name)} 닫기" title="닫기">×</button></span>`).join("");
  async function openFile(i) {
    const n = Number(i), x = st.files && st.files.list && st.files.list[n]; if (!x || x.dir) return;
    const k = st.openFiles.findIndex((f) => f.path === x.path);
    if (k >= 0) { st.fileSel = k; st.qtab = "file"; return render(); }
    try {
      const r = await (await fetch(`/api/file?i=${n}`, { cache: "no-store" })).json();
      if (!r || !r.ok) return say(`'${x.name}'은 열지 않았어요 — ${(r && r.reason) || "서버가 답하지 않았어요"}`);
      const again = st.openFiles.findIndex((f) => f.path === r.path);   // 기다리는 동안 같은 파일이 열렸으면(빠른 두 번 누름) 그 탭으로 — 탭 둘이면 한쪽 저장 뒤 다른 쪽 409(F-103-6)
      if (again >= 0) { st.fileSel = again; st.qtab = "file"; return render(); }
      if (st.openFiles.length >= 12) return say("연 파일이 12개예요 — 하나를 닫고 열어요");   // 저장 이력(20번 × 512KB)이 파일 수만큼 늘지 않게(새 맥락 리뷰)
      const text = r.text.replace(/\r\n/g, "\n");   // 글 칸은 LF — 저장할 때 eol로 되돌린다(CRLF 파일이 LF로 바뀌지 않게)
      st.openFiles.push({ i: n, path: r.path, name: r.name, kind: r.kind, eol: r.eol || "lf", text, saved: text, mtime: r.mtime, changed: r.changed, dirty: false, edit: false, raw: false, hist: [], note: null });
      st.fileSel = st.openFiles.length - 1; st.qtab = "file"; render();
    } catch { say("서버에 닿지 않았어요"); }
  }
  async function reloadFile(k) {
    const f = st.openFiles[k]; if (!f || f.i < 0) return;
    try { const r = await (await fetch(`/api/file?i=${f.i}`, { cache: "no-store" })).json(); if (r && r.ok) { const text = r.text.replace(/\r\n/g, "\n"); Object.assign(f, { text, saved: text, mtime: r.mtime, changed: r.changed, eol: r.eol || "lf", dirty: false, note: null }); } else f.note = { kind: "bad", text: (r && r.reason) || "다시 열지 못했어요" }; }
    catch { f.note = { kind: "bad", text: "서버에 닿지 않았어요" }; }
    render();
  }
  async function saveFile(k, opt = {}) {
    const f = st.openFiles[k]; if (!f || f.saving || (!f.dirty && !opt.overwrite)) return;   // 고친 것이 없으면 쓰지도 커밋을 맡기지도 않는다(새 맥락 리뷰). 저장 중이면 또 보내지 않는다(⌘S 두 번 → 409, F-103-3)
    if (f.i < 0) { f.note = { kind: "bad", text: "이 파일이 목록에서 사라졌어요 — 작업실을 다시 열어요" }; return render(); }
    const sent = f.text; f.saving = true;   // 보낸 글 — 저장하는 동안 더 친 글은 저장된 것으로 치지 않는다(F-103-3)
    try {
      const res = await fetch("/api/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ i: f.i, path: f.path, text: sent, mtime: f.mtime, eol: f.eol, commit: true, ...opt }) });
      const r = await res.json();
      if (r && r.ok) {
        if (f.saved !== sent) { f.hist.push({ at: Date.now(), text: f.saved }); if (f.hist.length > FHIST_MAX) f.hist.shift(); }
        Object.assign(f, { saved: sent, mtime: r.mtime, dirty: f.text !== sent, note: { kind: "ok", text: r.task ? "저장했어요 — 이 파일의 커밋 · 푸시를 Claude Code에 맡겼어요(허락 카드는 채팅에)" : `저장했어요${r.note ? ` — ${r.note}` : ""}` } });
        if (r.task) watchTask(r.task, "commit");
        render(); reloadChanged(k); return;
      }
      const why = r && r.why;
      if (why === "sensitive") f.note = { kind: "ask", text: `${(r.labels || []).join(" · ")} 모양이 있어요 — 그대로 저장할까요?`, acts: [["그대로 저장", "fsave-force"], ["고칠게요", "fnote-x"]] };
      else if (why === "changed") f.note = { kind: "ask", text: "연 뒤에 이 파일이 바뀌었어요(Claude Code가 고치는 중일 수 있어요)", acts: [["다시 열기", "freload"], ["덮어쓰기", "fsave-over"]] };
      else if (why === "busy") f.note = { kind: "ask", text: "맡긴 일이 아직 돌고 있어요 — Claude Code가 같은 파일을 고치는 중일 수 있어요", acts: [["그래도 저장", "fsave-busy"], ["기다릴게요", "fnote-x"]] };
      else if (why === "moved") { f.i = -1; f.note = { kind: "bad", text: (r && r.reason) || "목록이 바뀌었어요 — 파일을 다시 열어요" }; }
      else f.note = { kind: "bad", text: (r && r.reason) || "저장하지 못했어요" };
    } catch { f.note = { kind: "bad", text: "서버에 닿지 않았어요" }; }
    finally { f.saving = false; }
    render();
  }
  async function reloadChanged(k) { const f = st.openFiles[k]; if (!f || f.i < 0) return; try { const r = await (await fetch(`/api/file?i=${f.i}`, { cache: "no-store" })).json(); if (r && r.ok) { f.changed = r.changed; render(); } } catch {} }   // 저장 뒤 바뀐 줄 표시를 다시
  const changedSet = (f) => { if (f.changed === "new") return null; const s = new Set(); for (const [a, n] of f.changed || []) for (let j = 0; j < n; j++) s.add(a + j); return s; };
  function filePane() {
    const k = st.fileSel, f = st.openFiles[k];
    if (!f) return `<div class="qempty"><b>연 파일이 없어요</b>왼쪽 파일 칸에서 파일을 누르면 여기에 열려요.</div>`;
    const chg = changedSet(f), nChg = f.changed === "new" ? "새 파일" : chg && chg.size ? `바뀐 줄 ${chg.size}` : "";
    const note = f.note ? `<div class="fv-note ${f.note.kind}" role="status" aria-live="polite"><span>${esc(f.note.text)}</span>${(f.note.acts || []).map(([l, a]) => `<button type="button" class="lnk" data-act="${a}" data-v="${k}">${l}</button>`).join("")}${f.note.kind !== "ask" ? `<button type="button" class="lnk" data-act="fnote-x" data-v="${k}" aria-label="알림 닫기">×</button>` : ""}</div>` : "";
    const head = `<div class="fv-h"><b title="${esc(f.path)}">${esc(f.path)}</b><small>${{ md: "글(md)", code: "코드", text: "글" }[f.kind] || "글"}${nChg ? ` · ${nChg}` : ""}${f.hist.length ? ` · 저장 ${f.hist.length}번` : ""}</small><span class="grow"></span>
      ${f.kind === "md" && !f.edit ? `<button type="button" class="lnk" data-act="fraw" data-v="${k}" aria-pressed="${f.raw}">${f.raw ? "보기 좋게" : "원문"}</button>` : ""}
      <button type="button" class="lnk" data-act="fedit" data-v="${k}" aria-pressed="${f.edit}">${f.edit ? "보기" : "고치기"}</button>
      ${f.hist.length ? `<button type="button" class="lnk" data-act="fundo" data-v="${k}" title="마지막으로 저장하기 전 글로">되돌리기</button>` : ""}
      ${PR && canLive && st.mode !== "fixture" ? presetOpts(k) : ""}
      <button type="button" class="b pri sm" data-act="fsave" data-v="${k}" ${f.dirty ? "" : "disabled"} title="⌘/Ctrl+S">저장</button></div>`;
    // C-53 문서 도구 줄(목업 ②): 서식(제목 · 굵게 · 목록 · 넣기 · 머리말 — 고치는 중에만, 원문에 기호를 넣는다 md-view.js format) · 글 크기 · 목차(오른쪽 칸) · 찾기(그 글이 든 줄 표시 — 원문 · 코드 보기에서)
    const FMT = [["h2", "제목", "이 줄을 ## 제목으로"], ["bold", "굵게", "고른 글을 **로"], ["list", "목록", "고른 줄마다 '- '"], ["link", "넣기", "[글](주소)"], ["front", "머리말", "맨 위에 title · date"]];
    const tools = `<div class="fv-tools" role="toolbar" aria-label="문서 도구">${f.edit && f.kind !== "code" ? FMT.map(([id, l, tip]) => `<button type="button" data-act="ffmt" data-fmt="${id}" data-v="${k}" title="${tip}">${l}</button>`).join("") : ""}
      <span class="fv-sz"><button type="button" data-act="fsize" data-v="-" data-i="${k}" aria-label="글 작게">−</button><span>${Math.round((f.zoom || 1) * 100)}%</span><button type="button" data-act="fsize" data-v="+" data-i="${k}" aria-label="글 크게">+</button></span>
      <button type="button" data-act="ftoc" data-v="${k}" aria-pressed="${sideOn()}" title="오른쪽 칸의 목차">목차</button>
      <input class="fv-find" type="search" data-act="ffind" data-v="${k}" value="${esc(f.find || "")}" placeholder="이 문서에서 찾기" aria-label="이 문서에서 찾기"></div>`;
    const q = (f.find || "").trim().toLowerCase(), hit = (l) => !!q && l.toLowerCase().includes(q);
    let body;
    if (f.edit) body = `<textarea class="fv-edit" data-act="ftext" data-v="${k}" spellcheck="false" aria-label="${esc(f.name)} 고치기">${esc(f.text)}</textarea>`;
    else if (f.kind === "md" && !f.raw && MDV) body = `<div class="fv-md mdv">${MDV.toHtml(f.text)}</div>`;
    else body = `<pre class="fv-code"><ol>${f.text.replace(/\n$/, "").split("\n").map((l, j) => { const cls = [chg === null || (chg && chg.has(j + 1)) ? "chg" : "", hit(l) ? "hit" : ""].filter(Boolean).join(" "); return `<li${cls ? ` class="${cls}"` : ""}${f.go && f.go.seq === tocGo && f.go.line === j + 1 ? ` data-go="${f.go.seq}"` : ""}><span>${esc(l) || " "}</span></li>`; }).join("")}</ol></pre>`;
    // 상태 줄(C-53): 저장 수 · Claude Code가 바꾼 줄(git과 다른 줄) / 내가 바꾼 줄(저장한 글과 다른 줄 — 색으로 나눔) · 줄 수 · 줄 위치 · 줄 끝
    const mineChg = (() => { if (!f.dirty) return 0; const A = f.saved.split("\n"), B = f.text.split("\n"); let p = 0; while (p < A.length && p < B.length && A[p] === B[p]) p++; let q = 0; while (q < A.length - p && q < B.length - p && A[A.length - 1 - q] === B[B.length - 1 - q]) q++; return Math.max(A.length, B.length) - p - q; })();   // 앞뒤 공통 줄을 뺀 나머지 — 맨 위에 한 줄 넣어도 전체가 '바꾼 줄'이 되지 않게(새 맥락 리뷰)
    const stl = `<div class="fv-st" aria-label="문서 상태">${f.hist.length ? `<span>저장 ${f.hist.length}번</span>` : ""}${f.changed === "new" ? `<span class="st-ai">새 파일</span>` : chg && chg.size ? `<span class="st-ai">Claude Code가 바꾼 줄 ${chg.size}</span>` : ""}${mineChg ? `<span class="st-me">내가 바꾼 줄 ${mineChg}</span>` : ""}<span class="grow"></span><span>${f.text.split("\n").length}줄<span data-pos>${f.edit && caretLine ? ` · 줄 ${caretLine}` : ""}</span></span><span>UTF-8</span><span>${f.eol === "crlf" ? "CRLF" : "LF"}</span></div>`;
    return `<div class="fv" data-f="${esc(f.path)}" style="--fz:${f.zoom || 1}">${head}${tools}${note}${body}${stl}</div>`;
  }
  // ── 문서 지도(C-45, 2026-10-27 이재엽 "아치보드로 문서들이 이어지고 확인" · 버튼 "작업실의 새 탭" · "앱에 한 벌 넣기"): docmap.html을 iframe으로 — 서버 GET /api/docmap(API.md 3-27)이 보드 데이터를, 엔진은 앱 안의 archi-board v1 사본.
  //   상자의 '파일 보기에서 열기'는 postMessage → win.js · 아래 message 듣기 → ACT map-open(경로로 목록의 번호를 찾아 파일 보기로). 서버 없이 · 연습 모드는 지도가 없다(까닭을 쓴다)
  const nowDocPath = (n) => { const slug = FDOCS ? FDOCS.SLUGS[n] : ""; return slug ? `docs/${slug}/${slug.slice(3)}.md` : ""; };
  function mapPane(n) {
    if (!canLive || st.mode === "fixture") return `<div class="qempty"><b>문서 지도는 폴더를 연결한 앱에서 보여요</b>${canLive ? "연습 모드예요 — 진짜 폴더를 연결하면 문서가 이어진 모습이 여기에 와요." : "서버 없이 열었어요 — 앱으로 열면 보여요."}</div>`;
    return `<iframe class="docmap" src="/navigator/docmap.html#now=${encodeURIComponent(nowDocPath(n))}" title="문서 지도 — 상자를 누르면 오른쪽에 설명, '파일 보기에서 열기'로 열어요"></iframe>`;   // 지금 장 문서는 주소 끝(#)으로 — 서버의 화면 파일 찾기는 정확한 경로만(물음표 뒤가 있으면 404)
  }
  // ── 문서 고치기 맡기기 틀(C-44, 2026-10-27 이재엽 "md파일을 수정하거나 다른 문서들을 수정하기 위한 프리셋들" · 버튼 "Floe의 맡기기 틀" · "지금 자리에 더한다"): 틀은 presets.js 한 파일(사람이 더하고 고친다).
  //   연 파일의 머리 '틀로 맡기기'(고르면 바로) · 채팅의 '문서 틀' 칩(지금 장 문서, 카드에서 고름) → Claude Code에 맡긴다(/api/task/start + 틀의 끝 조건 — 허락은 섬, 끝에 기준마다 보고 C-32). 보고가 오면 열린 파일의 바뀐 줄을 다시 읽는다
  const PR = window.FloePresets || null;
  const BUILD = window.FloeBuild || null;   // F-70 코드 맡기기 — 뼈대 · 기능 줄 · 돌려 보기의 글과 끝 조건(build.js)
  const presetOpts = (k) => `<select class="fpreset" data-act="preset-pick" data-v="${k}" aria-label="틀로 맡기기"><option value="">틀로 맡기기…</option>${(PR ? PR.PRESETS : []).map((p) => `<option value="${p.id}" title="${esc(p.what)}">${esc(p.name)}</option>`).join("")}</select>`;
  // target: { i }(연 파일 — 목록 번호) 또는 { path }(지금 장 문서 — docs/ 안 이름). 글 · 끝 조건은 서버가 presets.js로 만든다(API.md 3-28 — 화면은 가린 경로를 보내지 않는다)
  async function presetGo(id, target) {
    const p = PR && PR.byId(id); if (!p || !target) return;
    if (!canLive || st.mode === "fixture") return say("연습 모드라 맡기지 않아요 — 진짜 폴더를 연결한 앱에서 돼요");
    const n = st.finished ? N.STAGES.length - 1 : atStage(), shown = target.path || (st.openFiles.find((f) => f.i === target.i) || {}).path || "";
    st.presetPick = null; render();
    try {
      const r = await (await fetch("/api/preset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, preset: p.id, stage: `${LB(n)} · ${N.STAGES[n].title}` }) })).json();
      if (r && r.ok) { st.presetTask = { path: shown, name: p.name, at: Date.now() }; watchTask(r.task, "preset"); say(`'${p.name}' 틀로 ${shown}를 Claude Code에 맡겼어요 — 허락 카드가 뜨면 허용해 주세요. 끝나면 보고가 와요.`); }
      else say(`맡기지 못했어요 — ${(r && r.reason) || "서버가 답하지 않았어요"}`);
    } catch { say("서버에 닿지 않았어요"); }
  }
  // ── F-70 코드 맡기기(2026-10-28 — 이재엽 "결과물이 안나오는 문제 해결", 결정 모음 A-02 · A-04 · A-05): 5단계 뼈대 · 6단계 기능 줄마다 · 6 · 7단계 돌려 보기 ──
  //   글과 끝 조건은 build.js가 단계 결과로 짓고, 맡기기는 같은 길(/api/task/start — 허락은 섬, 끝에 기준마다 보고). 끝나면 파일 칸을 다시 읽고(코드 수 · 결과 파일), 보고를 채팅에.
  //   맡긴 일은 F-69 지켜보기(watchTask)가 맡는다 — 막히면 막힘 카드. 연습 · 서버 없이는 맡기지 않는다(FR-10)
  // 6단계 Ⅰ('확인 방법을 먼저 정하고 만들기')에 사람이 적은 줄 — 지금 퀘스트, 없으면 6단계 결과에서(ⓒ 끝 조건으로)
  const CHECK_FIRST = "확인 방법을 먼저 정하고 만들기";
  const checksNote = () => { const q = st.quest && st.quest.chap === 5 ? st.quest : null, k = q ? q.objs.findIndex((o) => o.name === CHECK_FIRST) : -1;
    if (k >= 0) return [...(q.lines[k] || [])]; const r = st.results[5], it = r && r.items ? r.items.find((x) => x.name === CHECK_FIRST) : null; return it ? [...it.lines] : []; };
  const nowStage = () => (st.quest && st.quest.phase !== "done" ? st.quest.chap : st.finished ? N.STAGES.length - 1 : atStage());
  // 5단계 '뼈대 코드 맡기기' · 6단계 '기능 줄 맡기기' · 6 · 7단계 '돌려 보기'(A-02 — 퀘스트 안의 버튼). 진짜 폴더 · 진짜 AI 모드에서만
  const buildActs = (n) => (!BUILD || !canLive || st.mode === "fixture" ? [] : [...(n === 4 ? [{ label: "뼈대 코드 맡기기", act: "build-skeleton", kind: "soft" }] : []),
    ...(n === 5 ? [{ label: "기능 줄 맡기기", act: "line-open", kind: "soft" }] : []), ...(n === 5 || n === 6 ? [{ label: "돌려 보기", act: "run-go", kind: "ghost" }] : [])]);
  const BUILD_SAID = { build: "뼈대 코드를 Claude Code에 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요", code: "실행할 수 있는 코드를 Claude Code에 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요",
    line: "이 기능 줄을 Claude Code에 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요", run: "돌려 보기를 Claude Code에 맡겼어요 — 명령 허락 카드가 뜨면 '허용'을 눌러 주세요" };
  async function buildGo(kind, job, extra = {}) {
    if (!BUILD || !job) return;
    if (!canLive || st.mode === "fixture") return say("연습 모드라 맡기지 않아요 — 진짜 폴더를 연결한 앱에서 돼요");
    if (tw && !(st.blocked && st.blocked.at === tw.at)) return say("맡긴 일이 아직 돌고 있어요 — 끝난 뒤에 맡겨요");   // 막혀 있는 일은 새로 맡기면 끝맺는다(watchTask)
    const w = sensitive(job.text); if (w.length) return say(`보낼 글에 ${w.join(", ")}처럼 보이는 게 있어 맡기지 않았어요 — 그 칸을 고친 뒤 다시`);
    if (st.busy) return;   // 앞 호출의 '무엇을 기다리나'를 지우지 않게(F-103-5)
    st.planBusy = "hand";
    const r = await callAI("/api/task/start", { text: job.text, checks: job.checks });
    st.planBusy = "";
    if (!r.ok) { render(); return say(r.reason || "맡기지 못했어요"); }
    st.build = { kind, ...extra }; st.linePick = false; watchTask(r.task, kind); render(); say(BUILD_SAID[kind]);
  }
  // 끝나면 — 파일 칸을 다시 읽고(코드 파일 수가 바뀌면 6단계 '코드 물음'도 풀린다) 보고를 채팅에. 기능 줄은 보고가 다 '해냄'이면 그 줄에 표시
  async function buildEnd(t) {
    const b = st.build; st.build = null;
    await loadFiles();
    if (t.state !== "done") return say("맡긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요");
    const r = t.report;
    if (b && b.kind === "line" && r && r.total && r.done === r.total) { st.linesDone = [...new Set([...(st.linesDone || []), b.line])]; save(); }
    if (r) logMsg("sys", `Claude Code가 보고를 보냈어요 — 끝 조건 ${r.done}/${r.total}${t.verdict ? ` · 세어 보니 ${t.verdict.word}` : ""}${repChecks(r)}`);
    peek(); say(r ? (r.easy.length > N.SAY_MAX ? `${r.easy.slice(0, N.SAY_MAX - 1)}…` : r.easy) : "Claude Code가 일을 마쳤어요 — 파일 칸에서 바뀐 파일을 봐요");
  }
  // 돌려 본 뒤 — 보고 근거에 나온 결과 파일(파일 목록에 있는 것만)을 열 수 있게
  async function runEnd(t) {
    st.build = null;
    await loadFiles();
    if (t.state !== "done") return say("돌려 보기가 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요");
    const r = t.report, list = st.files && st.files.src === "mine" ? st.files.list : [];
    st.runOut = { report: r, files: BUILD.resultFiles(r, list) };
    peek(); render();
  }
  function momentLines() {
    const lines = BUILD.features(st.results), done = st.linesDone || [], meta = `<span class="mm-stage">${LB(5)} · 기능 줄 맡기기</span>`;
    if (!lines.length) return { tone: "amber", mood: "think", meta, title: `${LB(2)} 기능 줄이 아직 없어요`,
      sub: `${LB(2)} '꼭 필요한 기능 정리하기'에 '~하면, 앱은 ~한다' 줄을 적으면 줄마다 맡길 수 있어요.`, acts: [{ label: "닫기", act: "line-x", key: "Escape", kind: "ghost" }] };
    return { tone: "blue", mood: "look", meta, title: "어느 기능을 Claude Code에 맡길까요?",
      sub: "한 줄씩 맡겨요 — Claude Code가 그 줄의 확인 방법을 먼저 적고 만든 뒤 끝 조건마다 보고해요. 허락 카드는 여기 채팅에 떠요.",
      body: `<ol class="lines-pick" aria-label="${LB(2)} 기능 줄">${lines.map((l, i) => { const y = done.includes(l); return `<li class="${y ? "y" : ""}"><span>${esc(l)}</span>${y ? `<small>${OK_ICON} 보고 옴</small>` : ""}<button type="button" class="b${y ? " ghost" : ""}" data-act="line-go" data-i="${i}">${y ? "다시 맡기기" : "이 줄 맡기기"}</button></li>`; }).join("")}</ol>`,
      acts: [{ label: "닫기", act: "line-x", key: "Escape", kind: "ghost" }] };
  }
  function momentRun() {
    const o = st.runOut, r = o.report, meta = `<span class="mm-stage">돌려 보기</span>`;
    const ok = !!(r && r.items[1] && r.items[1].done);
    return { tone: ok ? "green" : "amber", mood: ok ? "happy" : "think", meta, title: ok ? "돌려 봤어요 — 결과가 나왔어요" : "돌려 봤는데 결과를 못 봤어요",
      sub: r ? esc(r.easy) : "보고를 받지 못했어요 — 진행 보기에서 봐 주세요",
      body: `${r ? repChecks(r) : ""}${o.files.length ? `<ul class="run-out" aria-label="결과 파일">${o.files.map((f, k) => `<li><code>${esc(f.path)}</code><button type="button" class="b" data-act="result-open" data-i="${k}">열기</button></li>`).join("")}</ul>` : ""}`,
      acts: [...(o.files.length ? [{ label: "결과 파일 열기", act: "result-open", i: 0, key: "Enter", pri: true }] : []), { label: "다시 돌려 보기", act: "run-go" }, { label: "확인했어요", act: "run-done", kind: "ghost" }] };
  }
  // 틀로 맡긴 일이 끝났다 — 열린 파일의 바뀐 줄을 다시 읽고 보고 한 줄(C-44, 전에는 계획 줄을 지켜볼 때만 다시 읽었다 — F-69에서 한 지켜보기로)
  function presetEnd(t) {
    const pt = st.presetTask; st.presetTask = null; if (!pt) return;
    const k = st.openFiles.findIndex((f) => f.path === pt.path); if (k >= 0) reloadFile(k);
    say(t.state !== "done" ? `'${pt.name}' 틀로 맡긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요` : t.report ? (t.report.easy.length > N.SAY_MAX ? `${t.report.easy.slice(0, N.SAY_MAX - 1)}…` : t.report.easy) : `'${pt.name}' 틀로 맡긴 일을 마쳤어요`);
  }
  function momentPreset() {
    const pk = st.presetPick, n = st.finished ? N.STAGES.length - 1 : atStage();
    return { tone: "blue", mood: "think", meta: `<span class="mm-stage">${LB(n)} · 문서 틀</span>`, title: `어느 틀로 맡길까요? — ${esc(pk.path)}`,
      sub: "틀을 고르면 플로로가 지시를 적어 Claude Code에 맡겨요. 허락 카드는 여기 채팅에 떠요. 틀은 Floe의 틀 파일에서 더하고 고칠 수 있어요.",
      acts: [...(PR ? PR.PRESETS : []).map((p) => ({ label: p.name, act: "preset-go", kind: "opt", i: p.id })), { label: "그만둘게요", act: "preset-x", key: "Escape", kind: "ghost" }] };
  }
  const BROWSER_WIN = [920, 640];   // 브라우저 판(섬 옆)의 크기 — 앱의 창 크기는 main.js(R-1)
  const FULL_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5"/></svg>';
// ━━ app/58-workspace.js ━━
  // ── C-53 작업실 세 칸(2026-10-28, 이재엽 버튼 "오른쪽 칸은 섬을 펼치면 접힘" · "서식 단추는 만든다", 목업 캔버스 ②): 파일 칸 | 작업 칸 | 오른쪽 칸(위: 이 문서 — 목차 · 칸 채움 · 재료, 아래: 퀘스트 — 지금 단계 · 다섯 칸 · 관문 남은 기준).
  //   파일 칸 · 오른쪽 칸은 머리 줄 단추로 접는다(이 컴퓨터에 기억). 앱에서 섬을 펼치면(접힌 알약이 아니면) 오른쪽 칸이 접혀 작업실이 비킬 자리를 만든다 — 섬을 접으면 다시 보인다
  const sideOn = () => wsideOpen && (!WINS || colFolded());
  const PANE_L = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4" width="15" height="12" rx="2.5"/><path d="M7.5 4v12"/></svg>', PANE_R = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4" width="15" height="12" rx="2.5"/><path d="M12.5 4v12"/></svg>';
  function wsideHTML(n) {
    const f = st.qtab === "file" ? st.openFiles[st.fileSel] : null;
    let doc = "", head = "이 문서";
    if (st.qtab === "tree" && st.mapSel != null && SM) { const m0 = stageMap(), c0 = m0 && m0.cards[st.mapSel]; if (c0) head = `${LB(c0.n)} · ${esc(c0.title)} — ${STATE_WORD[c0.state]}`; }
    if (f) {
      const toc = f.kind === "md" && MDV ? MDV.outline(f.text) : [], empty = toc.filter((h) => h.empty).length;
      const mats = [n > 0 ? `${LB(n - 1)} 문서 — ${nowDocPath(n - 1)}` : "", st.idea ? "처음 말한 것(01-idea/idea.md)" : ""].filter(Boolean);
      doc = `<section class="ws-doc"><h4>${head}</h4><p class="ws-sum">${esc(f.name)}${toc.length ? ` · 절 ${toc.length}개${empty ? ` · <b>빈 절 ${empty}</b> — 비었어요` : " · 다 채웠어요"}` : f.kind === "md" ? " · 제목 줄이 없어요" : ` · ${f.text.split("\n").length}줄`}</p>${
        toc.length ? `<p class="ws-h">목차</p><ul class="ws-toc">${toc.map((h) => `<li class="l${h.level}${h.empty ? " empty" : ""}"><button type="button" data-act="ftoc-go" data-v="${esc(h.text)}" data-line="${h.line}" title="${h.empty ? "비었어요 — 눌러서 이 절을 찾기" : "눌러서 이 절을 찾기"}">${esc(h.text)}${h.empty ? "<small>비었어요</small>" : ""}</button></li>`).join("")}</ul>` : ""}${
        mats.length ? `<p class="ws-h">재료가 온 곳</p><ul class="ws-mat">${mats.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</section>`;
    } else doc = `<section class="ws-doc"><h4>${head}</h4><p class="ws-sum">파일을 열면 목차와 빈 절이 여기에 와요</p></section>`;
    // C-54: 도전과제의 카드를 눌렀으면 그 카드의 퀘스트(준비된 다섯 칸) · 문서 · 재료
    if (st.qtab === "tree" && st.mapSel != null && SM) {
      const m = stageMap(), c = m && m.cards[st.mapSel]; if (c) {
        // C-54 ⑧(2026-10-28): 큰 카드의 줄을 눌렀다 — 누가 정했나(플로로 초안 → 고침 · 고름 · 직접 · 옮김) · 재료가 온 곳 · 이 줄을 쓰는 다음 단계 · 파일 보기 / 틀로 맡기기. 빈 칸은 플로로 초안 + 채팅에서 같이 적기
        if (st.mapLine && st.mapLine.n === c.n) { const x = stageCells(c.n)[st.mapLine.k];
          if (x) { const uses = SM.usedBy({ s: c.n, i: st.mapLine.k }, st.results, st.quest), who = x.line ? `${QU.BY_WORD[x.by] || "적음"}${x.draft && x.draft !== x.line && (x.by === "edit" || x.by === "pick") ? ` — 플로로 초안: ${esc(x.draft)}` : x.by === "ok" ? " — 플로로 초안 그대로" : ""}` : "";
            const open = c.doc.has ? `<button type="button" class="b sm" data-act="map-open" data-v="${esc(c.doc.path)}">파일 보기</button>` : "", preset = PR && canLive && st.mode !== "fixture" && c.doc.has ? `<button type="button" class="b sm ghost" data-act="preset-open">틀로 맡기기</button>` : "";
            return `${doc}<section class="ws-line"><h4>${ROMAN(st.mapLine.k)} ${esc(QU.shortOf(x.name))}</h4><p class="ws-sum">${x.line ? `“${esc(x.line)}”` : x.draft ? `비었어요 — 플로로 초안: “${esc(x.draft)}”` : "비었어요"}</p>
              ${x.line ? `<p class="ws-h">누가 정했나</p><p class="ws-sum">${who}</p>` : `<p class="ws-sum"><button type="button" class="b sm" data-act="map-chat">채팅에서 같이 적기</button></p>`}
              <p class="ws-h">재료가 온 곳</p><ul class="ws-mat">${x.from.length ? x.from.map((f) => `<li>${esc(refLabel(f))}</li>`).join("") : "<li>받은 글만 봤어요</li>"}</ul>
              <p class="ws-h">이 줄을 쓰는 다음 단계</p><ul class="ws-mat">${uses.length ? uses.map((u) => `<li>${LB(u.s)} ${ROMAN(u.i)} ${esc(QU.shortOf(u.name))}</li>`).join("") : "<li>아직 없어요 — 다음 단계가 이 줄을 재료로 쓰면 여기에 와요</li>"}</ul>
              <p class="ws-h">문서</p><p class="ws-sum"><code>${esc(c.doc.path)}</code> ${open}${preset}${c.doc.has ? "" : " 아직 없어요"}</p></section>`; } }
        const p = c.prepared, cells = p ? [["① 생각", p.think], ["② 행동", p.act], ["③ 기록", p.record.map((x) => QU.shortOf(x)).join(" · ")], ["④ 저장", p.save], ["⑤ 버전", p.ver]] : null;
        return `${doc}<section class="ws-q"><h4>퀘스트</h4>${cells ? `<ol class="ws-cells">${cells.map(([k, v]) => `<li><b>${k}</b> ${esc(v || "—")}</li>`).join("")}</ol><p class="ws-h">재료</p><p class="ws-sum">${esc(p.from)}</p>` : `<p class="ws-sum">${c.state === "later" ? "2단계에서 그려져요" : c.q ? `다섯 칸 ${c.q.k}/${c.q.n}` : "아직"}</p>`}
          <p class="ws-h">문서</p><p class="ws-sum"><code>${esc(c.doc.path)}</code> ${c.doc.has ? `<button type="button" class="lnk" data-act="map-open" data-v="${esc(c.doc.path)}">파일 보기로 열기</button>` : "아직 없어요"}</p></section>`;
      }
    }
    const base = st.card && BC ? `<section class="ws-card"><h4>이 프로젝트의 기준</h4>${baseCardHTML(BC.withEdits(st.card, st.cardEdits), true)}<button type="button" class="b sm" data-act="card-edit">고친 것 적용</button></section>` : "";   // C-56 R-1 — 고치면 아직 안 한 퀘스트를 다시
    const q = st.quest && st.quest.chap === n ? st.quest : null, p = q ? QU.progress(q) : null, s = N.STAGES[n];
    const unmet = st.j && !st.finished && st.j.stage === n ? st.j.criteria.filter((x) => !x.met) : [];
    const cells = q ? `<ol class="ws-cells">${q.objs.map((o, i) => `<li class="${QU.filled(q, i) ? "y" : i === QU.curIdx(q) ? "now" : ""}">${ROMAN(i)} ${esc(QU.nameOf(q, i))}</li>`).join("")}</ol>` : `<p class="ws-sum">${st.j ? "퀘스트를 받기 전이에요 — 노트북 탭에서 받아요" : "채팅에서 원하는 것을 말하면 1단계 퀘스트가 생겨요"}</p>`;
    const quest = `<section class="ws-q"><h4>퀘스트</h4><p class="ws-sum"><b>${LB(n)} · ${esc(s.title)}</b>${p ? ` — 다섯 칸 중 ${p.k}번째, 정한 줄 ${q.objs.filter((_, i) => QU.filled(q, i)).length}/${q.objs.length}` : ""}</p>${cells}
      <p class="ws-h">관문</p><p class="ws-sum">${st.finished ? "모든 장을 마쳤어요" : st.results[n] && st.results[n].passed ? `지났어요 ${esc(st.results[n].passed.slice(5))}` : st.j && st.j.stage === n ? (unmet.length ? `남은 기준 ${unmet.length}개` : "기준을 다 채웠어요 — 섬에서 넘어가기 전 확인") : "아직 — 칸을 다 채우면"}</p>${
      unmet.length ? `<ul class="ws-unmet">${unmet.slice(0, 4).map((x) => `<li>${esc(QU.shortOf(x.text))}</li>`).join("")}${unmet.length > 4 ? `<li>+${unmet.length - 4}</li>` : ""}</ul>` : ""}</section>`;
    return doc + base + quest;
  }
  function qwinHTML() {
    if (!st.qwin || !QU) return "";
    const pop = qpop ? " winpop" : ""; qpop = false;   // 처음 열 때 한 번의 움직임. 이름은 winpop — "pop"은 말풍선 판(.pop — 14px 안쪽 여백 · 아래 정렬)의 이름이라 작업실 창이 처음 열릴 때 그 모양을 뒤집어썼다(⑥ 2026-10-27, 앱에서 처음 열면 창이 아래에 148px로 붙었다)
    const n = st.finished ? N.STAGES.length - 1 : atStage();
    const pane = st.qtab === "canvas" ? canvasPane(n) : st.qtab === "tree" ? treePane() : st.qtab === "lib" ? bookPane() : st.qtab === "file" ? filePane() : st.qtab === "map" ? mapPane(n) : questTab();
    // 머리 한 줄(⑥, 목업): 프로젝트 · 단계 이름 · 탭 · LV · 조개 · 크기 · 닫기. 왼쪽 파일 칸(.wnav)은 탭에 상관없이 — 펼쳐진 환경
    // 크기(R-1, 2026-10-27 이재엽 버튼 "'화면 가득' 하나로"): 앱에서는 창이 작업 영역 가득 · 사람이 바꾼 크기를 기억(main.js) — 아래 style은 브라우저 판에서만 쓰인다(win.html은 auto!important로 덮는다). S/M/L은 뺐다
    // C-62 머리 줄 하나(2026-10-29): 머리(.wh)는 판(.win) 밖의 형제 — 창 전체 폭의 첫 줄(win.html #root · 브라우저 .wsx 격자). 단계 이름 한 번 + 단계 칩(C-58), 탭, LV · 조개, 섬 단추 묶음(hisl — 집 · 설정 · 열어 두기 · 접기)은 섬 쪽(오른쪽) 끝
    const wh = `<div class="wh"><span class="ttl">작업실</span><span class="meta">${esc(project() || "")}</span><span class="tb-stage" aria-live="polite">${stageHead()}</span>
        <div class="wtabs" role="tablist" aria-label="작업실 창">${QTABS.map(([id, label]) => `<button type="button" role="tab" data-act="qtab" data-tab="${id}" aria-selected="${st.qtab === id}">${label}</button>`).join("")}${fileTabs()}</div>
        <span class="wtgs"><button type="button" class="wtg" data-act="wnav-toggle" aria-pressed="${wnavOpen}" aria-label="파일 칸 ${wnavOpen ? "접기" : "펼치기"}" title="파일 칸 ${wnavOpen ? "접기" : "펼치기"}">${PANE_L}</button><button type="button" class="wtg" data-act="wside-toggle"${WINS && !colFolded() ? " disabled" : ""} aria-pressed="${wsideOpen}" aria-label="오른쪽 칸 ${wsideOpen ? "접기" : "펼치기"}" title="${WINS && !colFolded() ? "오른쪽 칸 — 섬을 접으면 나와요" : `오른쪽 칸 ${wsideOpen ? "접기" : "펼치기"}`}">${PANE_R}</button></span><span class="grow"></span>
        <span class="wlv" title="칭호 · ${esc(QU.rankOf(Math.min(level, 7)))}">LV ${level} · <button type="button" class="shells" data-act="shells" title="무지개 조개 — 장을 지나면 하나. 셋이면 열어요" aria-label="무지개 조개 ${st.shells}개">${coin()}<span>${st.shells}</span></button></span>${hisl()}
        <button type="button" class="ti" data-act="qwin" aria-label="작업실 창 닫기" title="닫기">${X_ICON}</button></div>`;
    return `${wh}<div class="win qwin${pop}" role="dialog" aria-label="작업실 창" style="width:${BROWSER_WIN[0]}px;height:${BROWSER_WIN[1]}px">
      <div class="wmain">${wnavOpen ? `<nav class="wnav" aria-label="대화 · 파일">${chatNav()}</nav>` : ""}<div class="wbody" data-view="${esc(`${st.qtab}|${st.qtab === "lib" ? `${st.libSel || ""}|${st.libDoc ?? ""}` : st.qtab === "file" ? `${st.fileSel}|${(st.openFiles[st.fileSel] || {}).edit ? "e" : "v"}` : ""}`)}">${pane}</div>${sideOn() ? `<aside class="wside" aria-label="이 문서 · 퀘스트">${wsideHTML(n)}</aside>` : ""}</div></div>${setModal()}`;
  }
  // F-86(2026-10-29 두승현 "별도의 모달창을 중앙에"): 작업실이 열려 있으면 설정은 섬이 아니라 작업실 위 가운데 모달 — 섬은 접혀 있든 펼쳐져 있든 그대로. 바깥(바탕)을 누르면 닫힌다
  const setModal = () => (st.settings && QU ? `<div class="set-layer"><button type="button" class="set-bg" data-act="settings" tabindex="-1" aria-label="설정 닫기"></button><div class="set-modal" role="dialog" aria-modal="true" aria-label="설정">${settingsPane(true)}</div></div>` : "");
  // 받기 화면의 그림 — 자리표시(밤하늘 · 얼음 · 공책). 진짜 그림은 고한결 [정할 것 2 · 5]
  const PIC = `<svg viewBox="0 0 320 140" aria-hidden="true"><defs><linearGradient id="q-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1550"></stop><stop offset="1" stop-color="#2A4AC8"></stop></linearGradient><linearGradient id="q-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3BA6"></stop><stop offset="1" stop-color="#0E1A4F"></stop></linearGradient></defs><rect width="320" height="140" fill="url(#q-sky)"></rect><g fill="#fff"><circle cx="30" cy="22" r="1.4"></circle><circle cx="80" cy="40" r="1"></circle><circle cx="140" cy="18" r="1.6"></circle><circle cx="200" cy="34" r="1"></circle><circle cx="260" cy="16" r="1.3"></circle><circle cx="300" cy="46" r="1"></circle></g><circle cx="262" cy="36" r="16" fill="#FFF3C4"></circle><circle cx="268" cy="31" r="14" fill="url(#q-sky)"></circle><path d="M0 95 Q 80 80 160 95 T 320 95 V140 H0z" fill="url(#q-sea)"></path><path d="M70 100 L 110 78 L 200 76 L 250 100 Z" fill="#E6F6FF"></path><path d="M70 100 L 250 100 L 240 112 L 85 112 Z" fill="#A9DDFF"></path><rect x="130" y="52" width="60" height="30" rx="4" fill="#F3EBD8" stroke="#6B5B3E" stroke-width="2"></rect><path d="M138 60h44M138 67h36M138 74h40" stroke="#B99A4F" stroke-width="2" stroke-linecap="round"></path></svg>`;
  const rewardSlots = (q) => `<i class="has" tabindex="0" aria-label="무지개 조개 ×1" data-tt="무지개 조개 ×1|장을 지나면 하나. 셋이면 열어요(뽑기는 다음 판)">${coin()}</i><i class="has" tabindex="0" data-tt="책갈피|직접 쓴 말은 책에 남아요">▮</i><i class="has" tabindex="0" data-tt="칭호 '${esc(QU.rankOf(Math.min(7, q.chap + 1)))}'|이 장을 지나면 칭호가 바뀌어요">🏅</i><i></i><i></i><i></i><i></i>`;
  // 퀘스트 판 — 없음 · 받기 화면(이벤트 창 짜임: 제목 띠 + ? · 그림 · 참여 조건 · 할 일 · 기간 · REWARD · 큰 받기 단추) · 공책(왼쪽 목차 · 오른쪽 줄 — 여기서 고친다)
  // 퀘스트 창 쉬운 말(C-40, 2026-10-26 — 이재엽 "퀘스트에서도 자세히 보이지만 어렵게 보이고 있어" · 버튼 "짧은 이름 + 쉬운 한 줄"): 목차 · 공책은 짧은 이름과 쉬운 한 줄, 원래 할 일 문장 · 용어는 '자세히 보기'에서
  let qmore = false, moreOpen = false;   // moreOpen — 늘 있는 칩 줄을 펼쳤나(C-60, 2026-10-29: 주 단추는 '보내기' 하나, 칩은 '더 보기' 뒤에)
  function questPane() {
    const q = st.quest;
    if (!q || q.phase === "done") return `<div class="qempty"><b>${st.finished ? "모든 장을 끝냈어요" : q ? `${LB(q.chap)} 퀘스트를 보고했어요` : st.j ? "다음 퀘스트는 넘어가기 전 확인을 지나면 받아요" : "아직 퀘스트가 없어요"}</b>${
      !q && !st.j ? "채팅에서 원하는 것을 플로로에게 알려 주면 1단계 초안을 만들어요.<br>그러면 이 창에 1단계 퀘스트가 떠요." : st.finished ? (SHELF_ON ? "책은 서재의 서고에 꽂아 두고 언제든 다시 펼쳐요." : "책은 이 창의 책 탭에서 언제든 다시 펼쳐요.") : "할 일을 다 하면 플로로가 '이해되셨나요?'를 묻고, 지나면 다음 장 퀘스트를 받아요."}</div>`;
    const ed = q.edit, done = QU.isDone(q), ci = QU.curIdx(q), metOf = (i) => !!(st.j && st.j.stage === q.chap && st.j.criteria[i] && st.j.criteria[i].met);
    if (q.phase === "draft") return `<div class="ev">
        <div class="ttl"><span></span><span>${ed ? `<input data-act="quest-title" value="${esc(q.title)}" aria-label="퀘스트 이름" maxlength="40">` : esc(q.title)}</span><button type="button" class="q" data-tt="이 퀘스트가 왜 있나요|${esc(q.why)}" aria-label="왜 하나요">?</button></div>
        <div class="pic">${PIC}<div class="cap">${LB(q.chap)} · ${esc(q.title)}${q.title !== N.STAGES[q.chap].title ? ` — ${esc(N.STAGES[q.chap].title)}` : ""}</div></div>
        <div class="box"><h4>참여 조건</h4><p>${esc(q.cond)}</p></div>
        <div class="box${ed ? " edit" : ""}"><h4>할 일${ed ? " — 고치는 중" : ""}</h4><p>${q.objs.map((o, i) => (ed ? `${esc(o.name)} <input type="number" min="1" max="5" value="${o.need}" data-act="quest-need" data-i="${i}" aria-label="${esc(o.name)} 개수">개` : `${esc(o.name)} ${o.need}개`)).join(" · ")}</p></div>
        <div class="box"><h4>기간</h4><p>${esc(q.when)}</p></div>
        <div class="box"><h4>REWARD</h4><div class="slots">${rewardSlots(q)}</div></div>
        <button type="button" class="join" data-act="${ed ? "quest-save" : "quest-ok"}">${ed ? "이대로 받기" : "퀘스트 받기"}</button>
        <div class="sub"><button type="button" data-act="${ed ? "quest-cancel" : "quest-fix"}">${ed ? "고치기 취소" : "고쳐 주세요"}</button><button type="button" data-act="quest-later">나중에</button></div></div>`;
    const toc = q.objs.map((o, i) => { const cls = metOf(i) || QU.filled(q, i) ? "done" : i === ci ? "" : "lock";
      return `<button type="button" data-act="quest-sel" data-i="${i}" aria-pressed="${q.sel === i}" class="st-${cls === "done" ? "done" : cls === "lock" ? "later" : "now"}" data-tt="${esc(QU.nameOf(q, i))}|${esc(QU.easyOf(o.name))}">${ROMAN(i)}. ${esc(QU.nameOf(q, i))}<small>${cls === "done" ? (metOf(i) ? "끝냄 ✓" : "적음") : cls === "lock" ? "★ 아직" : "지금"}</small></button>`; }).join("")
      + ((q.side || []).length ? `<div class="side-h">곁 퀘스트 — 안 해도 돼요</div>${q.side.map((s) => `<button type="button" class="lock" disabled title="만드는 크기를 키우면 할 일이 돼요">${s.icon} ${esc(s.name)}<small>★ 더 크게 만들 때</small></button>`).join("")}` : "");
    const sts = qstates(q), badge = (i) => { const x = sts[i]; if (!x || x.state === "write") return ""; const w = QS.STATE_WORD[x.state]; return `<small class="qs qs-${x.state}" title="${esc(x.why || "")}">${w}${x.from ? ` · ${LB(x.from.s)} ${ROMAN(x.from.i)}` : ""}</small>`; };   // C-56 상태 넷
    const lines = q.objs.map((o, i) => { const ls = q.lines[i] || [], ok = metOf(i);
      return `<div class="ln${ok ? " done" : ""}${q.sel === i ? " sel" : ""}"><span class="ck">${ok ? OK_ICON : ""}</span><span class="lt">${ed ? `<input data-act="quest-name" data-i="${i}" value="${esc(o.name)}" aria-label="할 일 이름" maxlength="60">` : `<b>${esc(QU.nameOf(q, i))}</b>${o.term ? `<small class="method">${esc(o.term)}</small>` : ""}${badge(i)}${QU.easyOf(o.name) ? `<span class="easy">${esc(QU.easyOf(o.name))}</span>` : ""}${qmore ? `<span class="full">${esc(o.name)}${o.term ? ` ${termTag(o.term)}` : ""}</span>` : ""}`}${
        ls.map((l, k) => (ed ? `<input data-act="quest-line" data-i="${i}" data-k="${k}" value="${esc(l)}" aria-label="적은 줄" maxlength="200">` : `<span class="lw">${esc(l)}</span>`)).join("")}${!ls.length && !ed ? `<span class="lw empty">${q.draft ? "아직 — 채팅에서 맞는지 봐요" : "아직 — 채팅에서 한 줄 적어요"}</span>` : ""}</span><span class="n">${ed ? `${ls.length} / <input type="number" min="1" max="5" value="${o.need}" data-act="quest-need" data-i="${i}" aria-label="개수">` : o.need > 1 ? `${ls.length} / ${o.need}` : ls.length ? "✓" : ""}</span></div>`; }).join("");
    return `<div class="book"><div class="page l"><h4>목차 · ${LB(q.chap)}</h4><div class="toc">${toc}</div></div>
      <div class="page r"><h3>${ed ? `<input data-act="quest-title" value="${esc(q.title)}" aria-label="퀘스트 이름" maxlength="40">` : esc(q.title)}</h3><div class="meta">${LB(q.chap)}${q.title !== N.STAGES[q.chap].title ? ` ${esc(N.STAGES[q.chap].title)}` : ""} · 플로로가 만들었어요 · ${done ? "다 적음" : "하는 중"}</div>
        <div class="lines">${lines}</div><details class="qdesc"><summary>자세히 보기 · 왜 하나요</summary><p>${esc(q.desc)}</p><p><b>왜 하나요</b> — ${esc(q.why)}</p><button type="button" class="lnk qmore" data-act="qmore" aria-expanded="${qmore}">${qmore ? "간단히 보기" : "원래 할 일 문장 · 용어 보기"}</button></details>
        <div class="rw"><span>보상</span><span class="piece">${coin()}무지개 조개 ×1</span><span class="piece">🏅 ${esc(QU.rankOf(Math.min(7, q.chap + 1)))}</span></div>
        <div class="pacts">${ed ? `<button type="button" class="pri" data-act="quest-save">저장</button><button type="button" data-act="quest-cancel">취소</button><span></span>` : `<button type="button" class="${done ? "pri" : ""}" data-act="quest-report" ${done ? "" : "disabled"}>완료 보고</button><button type="button" data-act="quest-hint">힌트</button><button type="button" data-act="quest-edit">고치기</button>`}</div></div></div>`;
  }
  // 도전과제 판(C-22) — 세로 탭 = 장(여덟), 그림만 크게, 마우스를 올리면 설명(data-tt). 상태는 지금 단계(st.j)와 퀘스트(적은 줄)에서 — 단계 · 할 일 · 판정 규칙은 그대로
  //   나무 위에 그 장의 '관문 전에 알아 둘 것'(C-35, 2026-10-24 — 옛 배우기 탭): 그 장에서 처음 쓰는 기능의 튜토리얼(tutorial.js forChap) · 이 장에서 쓰는 말(용어 풀이)
  let treeChap = null;   // null — 한눈에 보기(C-37, 기본), 숫자 — 그 장
  let treeView = "cards";   // 한눈에 보기의 보기(C-54): cards 지도 · flow 흐름 · box 상자
  // ── C-54 카드 지도(stagemap.js) — 카드 = 그 단계의 퀘스트(다섯 칸 · 관문)와 문서, 2단계 칸을 다 채우면 기획서로 3 ~ 8단계를 그리고 준비된 퀘스트를 미리 채운다(맞아요 한 번에 / 고칠래요) ──
  const haveDocs = () => { const h = new Set(); if (st.files && st.files.src === "mine" && st.files.list) for (const x of st.files.list) if (!x.dir) h.add(x.path); for (const d of st.docs) if (FDOCS && FDOCS.SLUGS[d.stage]) h.add(nowDocPath(d.stage)); return h; };
  const stageMap = () => (SM ? SM.build({ stages: N.STAGES, slugs: FDOCS ? FDOCS.SLUGS : [], results: st.results, j: st.j, quest: st.quest, finished: st.finished, have: haveDocs(), prep: st.prep }) : null);
  const STATE_WORD = { done: "끝남", now: "지금", ready: "준비됨", pending: "준비됨 — 확인 전", later: "2단계에서 그려져요" };
  // 규칙 카드(stagemap.prepare) + AI 카드(/api/prepare) — AI가 낸 이름 · ① 생각 · ② 행동 · 근거만 덮고, ③ 기록 · ④ 저장 · ⑤ 버전은 규칙 그대로(C-56 R-2)
  const mergePrepared = (rule, ai) => Object.fromEntries(Object.entries(rule).map(([n, c]) => { const x = ai && ai[n]; return [n, x ? { ...c, think: x.think || c.think, act: x.act || c.act, from: x.from || c.from, ...(x.title ? { title: x.title } : {}) } : c]; }));
  // C-54 ⑧(2026-10-28 디자인 넘김 ⓔ+, 이재엽 버튼 "둘다 할것" — 누르기 + 확대): 한 단계의 칸들 — 이름 · 적은 줄 · 누가 · 플로로 초안 · 재료. 하는 중인 퀘스트가 먼저, 다음은 결과, 그 뒤는 할 일 이름만(흐름 보기의 cellOf와 같은 규칙)
  function stageCells(n) {
    const r = st.results[n], q = st.quest && st.quest.chap === n ? st.quest : null;
    const names = q ? q.objs.map((o, i) => QU.nameOf(q, i)) : r ? r.items.map((x) => x.name) : crits(n).map((c) => c.text);
    return names.map((name, k) => (q ? { name, line: (q.lines[k] || [])[0] || "", by: (q.by || [])[k] || "", draft: QU.proposalOf(q, k), from: QU.fromOf(q, k) }
      : r && r.items[k] ? { name, line: (r.items[k].lines || [])[0] || "", by: r.items[k].by || "", draft: r.items[k].draft || "", from: r.items[k].from || [] } : { name, line: "", by: "", draft: "", from: [] }))
      .map((c) => ({ ...c, by: QU.BY.includes(c.by) ? c.by : "", from: (c.from || []).filter((x) => x && Number.isInteger(x.s) && Number.isInteger(x.i)) }));   // 저장소에서 온 값은 믿지 않는다(class에 들어간다)
  }
  function cardsMap(cur) {
    const m = stageMap(); if (!m) return treeMap(cur);
    const fix = st.prep && !st.prep.ok && st.prep.fix;
    // ⑧ 고른 끝난 · 지금 카드는 그 자리에서 커진다 — 줄 하나 = 할 일 → 문서의 절 ← 재료. 줄을 누르면 오른쪽 칸(wsideHTML .ws-line)
    const big = (c) => { const cells = stageCells(c.n), doc = c.doc.path.replace(/^docs\//, "");
      const rows = cells.map((x, k) => `<li class="sm-row${x.line ? "" : " miss"}${x.by ? ` by-${x.by}` : ""}${st.mapLine && st.mapLine.n === c.n && st.mapLine.k === k ? " sel" : ""}"><button type="button" data-act="map-line" data-i="${c.n}" data-k="${k}" aria-pressed="${!!(st.mapLine && st.mapLine.n === c.n && st.mapLine.k === k)}"><b>${ROMAN(k)}</b><span class="sm-rn">${esc(QU.shortOf(x.name))}</span><span class="sm-rl">${x.line ? esc(x.line) : x.draft ? `플로로 초안: ${esc(x.draft)}` : "비었어요"}</span><small>→ ${esc(doc)} ${esc(QU.shortOf(x.name))} 절${x.from.length ? ` · ← ${x.from.map((f) => esc(refLabel(f))).join(" · ")}` : ""}</small></button></li>`).join("");
      return `<div class="sm-cell big"><button type="button" class="sm-card st-${c.state} sel big" data-act="map-card" data-i="${c.n}" aria-pressed="true" aria-label="${LB(c.n)} ${esc(c.title)} — 가까이 보고 있어요. 다시 누르면 작아져요"><span class="sm-no">${c.label}</span><span class="sm-t">${esc(c.title)}</span><span class="sm-line">${c.state === "done" ? "지났어요" : "지금"} · 줄을 누르면 오른쪽 칸에 누가 정했나 · 재료 · 다음 단계</span></button><ol class="sm-rows" aria-label="${LB(c.n)}의 칸">${rows}</ol></div>`; };
    const card = (c) => { const p = c.prepared, sel = st.mapSel === c.n;
      if (sel && (c.state === "done" || c.state === "now")) return big(c);
      const body = c.state === "later" ? `<span class="sm-note">2단계에서 그려져요</span>`
        : c.state === "done" ? `<span class="sm-line">${c.q ? `퀘스트 ${c.q.k}/${c.q.n}` : "지났어요"}</span>`
        : c.state === "now" ? `<span class="sm-line">${c.q ? `다섯 칸 중 ${Math.min(c.q.k + 1, c.q.n)}번째 · ${c.q.k}/${c.q.n}` : "퀘스트 받기 전"}${c.gateLeft ? ` · 관문 남은 ${c.gateLeft}` : ""}</span>`
        : `<span class="sm-line">${p ? esc(p.think.length > 48 ? `${p.think.slice(0, 47)}…` : p.think) : ""}</span><span class="sm-from">${p ? esc(p.from) : ""}</span>`;
      const docLine = `<span class="sm-doc"><code>${esc(c.doc.path.replace(/^docs\//, ""))}</code> ${c.doc.has ? "있음" : c.state === "done" || c.state === "now" ? "아직" : ""}</span>`;
      const input = fix && p ? `<input type="text" data-act="prep-think" data-i="${c.n}" value="${esc(p.think)}" aria-label="${LB(c.n)} ① 생각" maxlength="120">` : "";
      return `<div class="sm-cell"><button type="button" class="sm-card st-${c.state}${sel ? " sel" : ""}${c.state === "pending" ? " pending" : ""}" data-act="map-card" data-i="${c.n}" aria-pressed="${sel}" aria-label="${LB(c.n)} ${esc(c.title)} — ${STATE_WORD[c.state]}">
        <span class="sm-no">${c.label}</span><span class="sm-t">${esc(c.title)}</span>${body}${docLine}${c.state === "now" ? `<span class="sm-flo" aria-hidden="true">${cat("idle", 30, { face: true })}</span>` : ""}</button>${input}</div>`; };
    const row1 = m.cards.slice(0, 4).map(card).join(""), row2 = m.cards.slice(4).reverse().map(card).join("");
    const ban = m.canDraw ? `<div class="sm-ban"><b>2단계 칸을 다 채웠어요</b><span>기획서(2단계에서 정한 것)로 3 ~ 8단계의 퀘스트와 문서를 한 번에 그려요</span><button type="button" class="b" data-act="prep-draw">기획서로 3 ~ 8단계 그리기</button></div>`
      : m.drawn && !m.confirmed ? `<div class="sm-ban"><b>퀘스트 ${Object.keys(st.prep.cards).length}개를 준비했어요</b><span>${fix ? "카드마다 ① 생각을 고친 뒤 '맞아요'를 눌러요" : "카드마다 어느 절에서 왔는지 적었어요 — 맞으면 한 번에 넘어가요"}</span><button type="button" class="b" data-act="prep-ok">맞아요 — 이대로 준비해요</button>${fix ? "" : `<button type="button" class="b ghost" data-act="prep-fix">고칠래요</button>`}</div>`
      : m.cur < 2 ? `<div class="sm-ban soft"><span>1단계에서는 길이 한 칸만 보여요. 2단계 칸을 다 채우면 3단계부터 8단계까지의 퀘스트와 문서가 한 번에 그려져요</span></div>` : "";
    const legend = `<p class="sm-legend">${["done", "now", "ready", "later"].map((k) => `<span><i class="st-${k}" aria-hidden="true"></i>${STATE_WORD[k]}</span>`).join("")}<small>카드를 누르면 오른쪽 칸에 그 퀘스트와 문서 — 끝난 · 지금 카드는 커져서 줄마다 보여요</small></p>`;
    const docs = `<ul class="sm-docs">${m.docs.map((d) => `<li class="${d.has ? "has" : ""}"><code>${esc(d.path)}</code><span>${esc(d.what)}</span><small>${d.has ? "있음" : "아직"}</small></li>`).join("")}</ul>`;
    const ship = FDOCS && st.results[0] && st.results[1] ? `<p class="sm-ship"><button type="button" class="b" data-act="ship-open">문서로 묶어 GitHub에</button><small>지금까지 정한 것을 단계 문서 · 기획서 · 결정 기록으로</small></p>` : "";   // 흐름 보기(jmap)와 같은 단추
    return `<div class="sm">${ban}<div class="sm-grid">${row1}</div><div class="sm-grid back">${row2}</div>${docs}${legend}${ship}</div>`;
  }
  function treePane() {
    const cur = st.finished ? N.STAGES.length : st.j ? st.j.stage : st.quest ? st.quest.chap : 0;
    const mapTab = `<button type="button" role="tab" aria-selected="${treeChap === null}" class="map" data-act="tree-map" data-tt="한눈에 보기|단계마다 정한 것이 이어지는 지도 — 빈 칸을 채워요" aria-label="한눈에 보기">${MAP_ICON}</button>`;
    const chapTabs = () => N.STAGES.map((x) => { const k = x.n < cur ? "done" : x.n === cur ? "cur" : "lock";
      return `<button type="button" role="tab" aria-selected="${x.n === treeChap}" class="${k}" data-act="tree-chap" data-i="${x.n}" data-tt="${LB(x.n)} · ${esc(x.title)}|${k === "done" ? "끝낸 장 — 도장을 받았어요" : k === "cur" ? "지금 하는 장" : "아직 — 앞 장을 끝내면 열려요"}" aria-label="${LB(x.n)} ${esc(x.title)}">${QU.chapIcon(x.n)}</button>`; }).join("");
    // C-54(2026-10-28): 한눈에 보기 = 보기 셋 — 지도(카드, 기본) · 흐름(C-39 jmap) · 상자(C-45 문서 지도)
    const views = [["cards", "지도"], ["flow", "흐름"], ["box", "상자"]], viewBar = `<div class="sm-views" role="tablist" aria-label="보기">${views.map(([v, l]) => `<button type="button" role="tab" data-act="tree-view" data-v="${v}" aria-selected="${treeView === v}">${l}</button>`).join("")}</div>`;
    if (treeChap === null) return `<div class="adv"><div class="vtabs" role="tablist" aria-label="장">${mapTab}${chapTabs()}</div><div class="board${treeView === "cards" ? " sea" : ""}">${viewBar}${treeView === "flow" ? treeMap(cur) : treeView === "box" ? mapPane(Math.min(cur, N.STAGES.length - 1)) : cardsMap(cur)}</div></div>`;
    const n = treeChap, s = N.STAGES[n], q = st.quest && st.quest.chap === n ? st.quest : null;
    const state = n < cur ? "done" : n === cur ? "cur" : "lock";
    const list = n === cur && st.j ? st.j.criteria.map((c) => ({ text: c.text, met: c.met })) : crits(n).map((c) => ({ text: c.text, met: n < cur }));
    const ci = q ? QU.curIdx(q) : -1;
    const kind = (i) => (state === "done" || list[i].met || (q && QU.filled(q, i)) ? "done" : state === "lock" ? "lock" : i === ci || (!q && i === 0) ? "cur" : "lock");
    const tt = (label, k) => `${esc(label)}|${k === "done" ? "끝냈어요" : k === "cur" ? "지금 하는 할 일 — 채팅에서 플로로와 같이 해요" : "아직 열리지 않았어요 — 앞의 할 일을 먼저 해요"}`;
    const tabs = mapTab + chapTabs();
    const sides = (s.criteria || []).filter((c) => !list.some((x) => x.text === c.text));   // 곁 퀘스트 — 이 등급에서 빠진 할 일, 첫 가지 옆에
    const tus = TU ? TU.forChap(n) : [], terms = [...new Set(crits(n).map((c) => c.term).filter(Boolean))], tu = tus.find((t) => t.id === st.tuSel);
    const chain = list.map((c, i) => { const k = kind(i); return `<div class="chain"><div><span class="bn ${k}" tabindex="0" data-tt="${tt(c.text, k)}">${QU.iconOf(n, i)}</span><div class="vline"></div></div>${
      i === 0 && sides.length ? `<div class="sides">${sides.map((x, j) => `<span class="hl" aria-hidden="true"></span><span class="bn sidebn ${state === "done" ? "done" : "lock"}" tabindex="0" data-tt="${esc(x.text)} (곁 퀘스트)|${state === "done" ? "지난 장의 곁 퀘스트" : "골라서 하는 퀘스트 — 만드는 크기를 키우면 할 일이 돼요. 안 해도 관문은 열려요"}">${QU.iconOf(n, list.length + j)}</span>`).join("")}</div>` : "<div></div>"}</div>`; }).join("")
      + `<div class="chain"><div><span class="bn gate ${state === "done" ? "done" : "lock"}" tabindex="0" data-tt="관문 — 이해되셨나요?|${state === "done" ? "지났어요 — 칭호가 바뀌었어요" : "이 장의 할 일을 다 하면 플로로가 '이해되셨나요?'를 물어요. 지나면 칭호가 바뀌어요"}">${GATE_ICON}</span></div><div></div></div>`;
    const learn = tus.length || terms.length ? `<section class="learnbox" aria-label="관문 전에 알아 둘 것"><h4>${LB(n)} 관문 전에 알아 둘 것</h4>${
      tus.length ? `<div class="tu-chips">${tus.map((t) => `<button type="button" data-act="tu-sel" data-v="${t.id}" aria-pressed="${!!tu && tu.id === t.id}">${esc(t.name)}${t.state === "soon" ? "<small>만드는 중</small>" : ""}</button>`).join("")}</div>` : ""}${tu ? tuCard(tu) : ""}${
      terms.length ? `<p class="lb-terms"><b>이 장에서 쓰는 말</b>${terms.map(termTag).join("")}</p>` : ""}</section>` : "";
    return `<div class="adv"><div class="vtabs" role="tablist" aria-label="장">${tabs}</div><div class="board"><p class="bt">${LB(n)} · ${esc(s.title)} — 그림에 마우스를 올리면 설명이 떠요</p>${learn}${chain}</div></div>`;   // 알아 둘 것은 나무 위 — 판 안의 스크롤은 다시 그리면 맨 위로 돌아가 아래에 두면 펼친 장이 가려졌다
  }
  // 한눈에 보기(C-37, 2026-10-25 — 이재엽 "1단계 결과들을 정리해서 한번에 보는 곳 … 이어지는 다이어그램을 이용해 도전과제들을 보여주는 공간 … 우리가 어느 곳이 부족한지 보여주고 이 다이어그램들을 채워 나가도록" ·
  //   버튼 "단계가 이어지는 흐름"): 위에서 아래로 단계 블록, 사이 화살표에 넘겨주는 것(STAGES gives). 지금 장의 빈 칸은 점선 + 채우기. 1 · 2단계를 마쳤으면 문서로 묶어 올리기.
  // C-39(2026-10-25 — 이재엽 "도전과제에서 1단계 2단계에 맞춰진 다이어그램으로 너가 어떻게 넣고 어떤 부분을 했는지 이어져서 보도록 시각화된 자료로 자세히" · 버튼 "흐름 + 칸마다 재료까지"):
  //   끝낸 장 · 지금 장은 네 칸 흐름 — 넣은 것(처음 말한 것 · 지난 단계) → 플로로가 한 것(초안 · 준비할 것) → 내가 정한 것(칸마다 그대로 · 고침 · 직접 · 고름, 고쳤으면 플로로 초안도) → 관문(지난 날 · 기준).
  //   칸마다 재료(플로로가 초안을 쓸 때 본 지난 단계 칸) — 올리면 그 칸이 빛나고(CSS :has — 앱의 옆 창에서도 스크립트 없이) 풍선에 그 칸의 글. 다음 장은 할 일만 미리, 그 뒤는 머리만
  function treeMap(cur) {
    let filled = 0, open = 0;
    const refs = new Set(), lineAt = (x) => { const r = st.results[x.s], it = r && r.items[x.i]; return (it && (it.lines || [])[0]) || ""; };
    const cellOf = (q, r, k) => (q ? { line: (q.lines[k] || [])[0] || "", by: (q.by || [])[k] || "", draft: QU.proposalOf(q, k), from: QU.fromOf(q, k) }
      : r && r.items[k] ? { line: (r.items[k].lines || [])[0] || "", by: r.items[k].by || "", draft: r.items[k].draft || "", from: r.items[k].from || [] } : { line: "", by: "", draft: "", from: [] });
    const step = (k, label, body) => `<li class="jm-step ${k}"><i>${label}</i><div class="jm-sb">${body}</div></li>`;
    const blocks = N.STAGES.map((s, n) => {
      const state = n < cur ? "done" : n === cur ? "cur" : "lock", r = st.results[n], q = st.quest && st.quest.chap === n ? st.quest : null;
      const names = q ? q.objs.map((o) => o.name) : r ? r.items.map((x) => x.name) : crits(n).map((c) => c.text);   // 지금 장은 하는 중인 퀘스트가 먼저
      const got = names.filter((_, k) => cellOf(q, r, k).line).length;
      const date = r && (r.at || r.passed) ? `<span class="jm-date">${r.at ? `확인 ${esc(r.at.slice(5))}` : ""}${r.passed ? ` · 관문 ${esc(r.passed.slice(5))}` : ""}</span>` : "";
      // C-54 ⑨(2026-10-28 버튼 "'흐름 따라가기'에서만"): 짝 선 — 세로 길 셋(a 1↔8 · b 2↔7 · c 3↔6)이 정한 곳에서 확인하는 곳까지 오른쪽을 따라 내려간다. 짝 단추를 누르면 두 칸 나란히
      const pr = SM ? SM.pairOf(n) : null, rails = SM ? `<span class="jm-rails" aria-hidden="true">${SM.PAIRS.map(([k, a, b]) => (n >= a && n <= b ? `<i class="${k}${n === a ? " s" : ""}${n === b ? " e" : ""}"></i>` : "<i></i>")).join("")}</span>` : "";
      const pairBtn = pr ? `<button type="button" class="jm-pair ${pr.key}" data-act="pair-sel" data-v="${pr.key}" aria-pressed="${st.pair === pr.key}" title="두 칸 나란히 보기">${pr.role === "decide" ? `정한 것 → ${LB(pr.to)}에서 확인` : `← ${LB(pr.from)}에서 정한 것 확인`}</button>` : "";
      const head = `<div class="jm-h"><b>${LB(n)} · ${esc(s.title)}</b>${date}<span class="jm-count">${got}/${names.length}</span>${pairBtn}</div>`;
      if (state === "lock") return `<section class="jm-stage lock" data-n="${n}">${rails}${head}${n > cur + 1 ? "" : `<details class="jm-peek"><summary>할 일 미리 보기</summary><ul class="jm-cells">${names.map((name) => `<li class="jm-lock"><b>${esc(QU.shortOf(name))}</b></li>`).join("")}</ul></details>`}</section>`;
      const before = Object.keys(st.results).map(Number).filter((k) => k < n).sort((x, y) => x - y);
      const input = n === 0 ? `처음 말한 것${st.idea ? ` “${esc(st.idea.length > 90 ? `${st.idea.slice(0, 90)}…` : st.idea)}”` : ""}`
        : before.length ? before.map((k) => `<span class="jm-pill">${LB(k)}에서 정한 것 ${st.results[k].items.length}칸</span>`).join("") : "지난 단계에서 정한 것";
      const prep = (q && q.draft && q.draft.prep) || (r && r.prep) || [], drafted = names.filter((_, k) => cellOf(q, r, k).draft).length;
      const ai = drafted ? `초안 ${drafted}칸${prep.length ? ` · 준비할 것 ${prep.length}줄` : ""}${prep.length ? `<ul class="jm-prep">${prep.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}` : state === "cur" ? "초안 없이 — 한 줄씩 같이 적어요" : "초안 없이 — 한 줄씩 같이 적었어요";
      const cells = names.map((name, k) => {
        const c = cellOf(q, r, k), id = `${n}-${k}`, nm = `<b>${ROMAN(k)} ${esc(QU.shortOf(name))}</b>`;
        if (!QU.BY.includes(c.by)) c.by = "";   // 저장소에서 온 값은 믿지 않는다 — class · <style>에 들어가는 값은 정해진 것 · 숫자만(2026-10-25 리뷰)
        const okRefs = c.from.filter((x) => x && Number.isInteger(x.s) && Number.isInteger(x.i));
        const ref = okRefs.length ? `<span class="jm-refs">재료 ${okRefs.map((x) => { refs.add(`${x.s}-${x.i}`); return `<span class="jm-ref" tabindex="0" data-ref="${x.s}-${x.i}" data-tt="${esc(refLabel(x))}|${esc(lineAt(x) || "적은 글이 남아 있지 않아요")}">← ${esc(refLabel(x))}</span>`; }).join("")}</span>` : "";
        const was = c.by === "edit" && c.draft ? `<span class="jm-was">플로로 초안: ${esc(c.draft)}</span>` : c.by === "pick" && c.draft ? `<span class="jm-was">플로로가 권한 것: ${esc(c.draft)}</span>` : "";
        if (c.line) { filled += 1; return `<li class="jm-cell jm-fill${c.by ? ` by-${c.by}` : ""}" data-cell="${id}">${nm}${QU.BY_WORD[c.by] ? `<span class="jm-by">${QU.BY_WORD[c.by]}</span>` : ""}<span class="jm-line">${esc(c.line)}</span>${was}${ref}</li>`; }
        if (state === "cur") { open += 1; return `<li class="jm-cell jm-miss" data-cell="${id}">${nm}<span class="jm-line">${c.draft ? `${q && QU.examplesOf(q, k).length > 1 ? `플로로 예시 ${QU.examplesOf(q, k).length}개 — 권하는 것: ` : "플로로 초안: "}${esc(c.draft)}` : "비었어요"}</span>${ref}<button type="button" data-act="jmap-fill">채우기</button></li>`; }
        return `<li class="jm-cell jm-old" data-cell="${id}">${nm}<span class="jm-line">지났어요 — 적은 글이 남아 있지 않아요</span></li>`;
      }).join("");
      const ck = r && r.check ? r.check : null, met = ck ? `기준 ${ck.filter((x) => x.met).length}/${ck.length}` : "";
      const gate = r && r.passed ? `지났어요 ${esc(r.passed.slice(5))} — 이해했어요${met ? ` · ${met}` : ""}` : state === "done" ? "지났어요 — 날짜는 남아 있지 않아요" : r ? `칸을 다 확인했어요${met ? ` · ${met}` : ""} — 관문은 아직` : "아직 — 칸을 다 채우면 완료 보고 → 관문";   // 증빙 전(C-37)에 지난 장은 날짜가 없다
      return `<section class="jm-stage ${state}" data-n="${n}">${rails}${head}<ol class="jm-flow">${step("in", "넣은 것", input)}${step("ai", "플로로가 한 것", ai)}${step("me", "내가 정한 것", `<ul class="jm-cells">${cells}</ul>`)}${step("gate", "관문", gate)}</ol></section>`;
    });
    const arrows = blocks.map((b, n) => `${b}${n < N.STAGES.length - 1 ? `<div class="jm-arrow" aria-hidden="true">↓ <span>${esc(gv(N.STAGES[n]))}</span></div>` : ""}`).join("");
    const glow = refs.size ? `<style>${[...refs].map((id) => `.jmap:has(.jm-ref[data-ref="${id}"]:is(:hover,:focus)) .jm-cell[data-cell="${id}"]`).join(",")}{outline:2px solid #2F7BD6;outline-offset:2px;background:#EAF3FF}</style>` : "";
    const legend = `<p class="jm-legend">${QU.BY.map((b) => `<span class="by-${b}"><i aria-hidden="true"></i>${QU.BY_WORD[b]}</span>`).join("")}<small>재료에 올리면 그 칸이 빛나요</small></p>`;
    const ship = FDOCS && st.results[0] && st.results[1] ? `<button type="button" class="b" data-act="ship-open">문서로 묶어 GitHub에</button>` : "";
    const pairSel = SM && st.pair ? SM.PAIRS.find(([k]) => k === st.pair) : null;
    const sideCol = (n, role) => { const cs = stageCells(n); return `<div class="jm-sc"><b>${LB(n)} · ${esc(N.STAGES[n].title)}</b><small>${role === "decide" ? "정한 곳" : "확인하는 곳"}</small><ul>${cs.map((x, k) => `<li class="${x.line ? "" : "miss"}"><b>${ROMAN(k)}</b> ${esc(QU.shortOf(x.name))}<span>${x.line ? esc(x.line) : n > cur ? "아직" : "비었어요"}</span></li>`).join("")}</ul></div>`; };
    const side = pairSel ? `<section class="jm-side ${pairSel[0]}" aria-label="두 칸 나란히"><div class="jm-sh"><b>두 칸 나란히 — ${LB(pairSel[1])}에서 정한 것을 ${LB(pairSel[2])}에서 확인해요</b><button type="button" class="b sm ghost" data-act="pair-sel" data-v="${pairSel[0]}">닫기</button></div><div class="jm-sg">${sideCol(pairSel[1], "decide")}<span class="jm-sl" aria-hidden="true">→</span>${sideCol(pairSel[2], "check")}</div></section>` : "";
    return `<div class="jmap">${glow}${side}<div class="jm-top"><b>${esc(st.topic || "내 프로젝트")}</b><span>채운 칸 ${filled} · ${open ? `빈 칸 ${open} — '채우기'로 채워요` : "지금 빈 칸 없음"}</span>${ship}</div>${legend}${arrows}</div>`;
  }
  // 설명 풍선(C-22) — data-tt="제목|설명". 마우스를 올리거나 키보드로 고르면 그 위에 뜬다(맨 위면 아래)
  const $tt = document.createElement("div"); $tt.className = "tt"; $tt.setAttribute("role", "tooltip"); document.body.appendChild($tt);
  function showTT(el) {
    const [h, b] = (el.dataset.tt || "").split("|");
    $tt.innerHTML = `<b>${esc(h)}</b>${esc(b || "")}`; $tt.classList.add("on");
    const r = el.getBoundingClientRect(), w = $tt.offsetWidth;
    $tt.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`; $tt.style.top = `${r.top > 90 ? r.top - $tt.offsetHeight - 8 : r.bottom + 8}px`;
  }
  document.addEventListener("mouseover", (e) => { const el = e.target.closest && e.target.closest("[data-tt]"); if (el) showTT(el); else $tt.classList.remove("on"); });
  document.addEventListener("focusin", (e) => { const el = e.target.closest && e.target.closest("[data-tt]"); if (el) showTT(el); });
  document.addEventListener("focusout", () => $tt.classList.remove("on"));
  // 뽑기(C-22, 둘째 레프런스 "무지개 조개로 확률형 아이템 · 플로로를 꾸밀 수"): 조개 셋에 한 번, 확률은 늘 화면에(quest.js ITEMS · draw). 돈으로 사는 것은 없다. 섬 위를 덮는 층
  function gachaHTML() {
    const g = st.gacha; if (!g || !QU) return "";
    const can = st.shells >= QU.SHELL_COST && g.phase === "ready";
    const stage = g.phase === "got" ? `<span class="big" aria-hidden="true">${g.item.emoji}</span>` : `<i class="coin bigshell" aria-hidden="true">${SHELL_ICO}</i>`;   // 열기 전의 큰 조개 — 위 줄과 같은 무지개 조개 그림(2026-10-23)
    const got = g.phase === "got" ? `<b>${esc(g.item.name)}</b>(${esc(g.item.rar)})이 나왔어요! 플로로가 바로 써 봤어요` : g.phase === "rolling" ? "조개를 여는 중…" : st.shells >= QU.SHELL_COST ? "조개를 열면 플로로를 꾸밀 것이 하나 나와요" : `조개가 ${QU.SHELL_COST - st.shells}개 더 있어야 열 수 있어요 — 장을 지나면 받아요`;
    return `<div class="gacha-layer"><section class="gacha${g.phase === "rolling" ? " rolling" : ""}" role="dialog" aria-label="무지개 조개 뽑기"><h3>무지개 조개 뽑기</h3>
      <button type="button" class="ti gx" data-act="gacha-close" aria-label="뽑기 창 닫기" title="닫기 (Esc)">${X_ICON}</button>
      <div class="have">가진 조개 <span class="shells">${coin()}${st.shells}</span> · 한 번에 ${QU.SHELL_COST}개</div>
      <div class="stage">${stage}</div><p class="got" role="status">${got}</p>
      <div class="acts"><button type="button" class="b pri" data-act="gacha-roll" ${can ? "" : "disabled"}>조개 열기</button></div>
      <div class="odds" aria-label="나올 확률">${QU.ITEMS.map((it) => `<span><b>${it.emoji} ${esc(it.name)}</b>${esc(it.rar)} ${it.p}%</span>`).join("")}</div>
      <p class="fine">나올 확률은 여기에 늘 적어 둬요. 돈으로 사는 것은 없어요 — 조개는 장을 지날 때만 받아요.</p></section></div>`;
  }
  // 뽑기 창은 섬 위에 겹쳐 뜨는데(.gacha-layer — 섬 안에 꽉) 섬보다 키가 커 위아래가 잘렸다(임유정 2026-10-22). 뽑기 창이 들어갈 만큼 섬을 늘린다 — 앱이면 창도 따라 커진다(measureSize)
  function fitGacha() {
    const isl = $nav.querySelector(".isl"), g = isl && isl.querySelector(".gacha");
    if (!g) return;
    const need = g.offsetHeight + 32;   // .gacha-layer 위아래 padding 16씩
    if (isl.offsetHeight < need) isl.style.minHeight = `${need}px`;
  }
  function gachaRoll() {
    const g = st.gacha; if (!g || !QU || g.phase !== "ready" || st.shells < QU.SHELL_COST) return;
    st.shells -= QU.SHELL_COST; st.gacha = { phase: "rolling" }; render();
    setTimeout(() => {
      if (!st.gacha) return;
      const it = QU.draw(QU.ITEMS, Math.random() * 100);
      st.owned = QU.cleanOwned([...st.owned, it.id]); st.wear = { ...st.wear, [it.slot]: it.id }; st.gacha = { phase: "got", item: it };
      logMsg("floro", `${it.emoji} <b>${esc(it.name)}</b>을 받았어요! 설정 창의 꾸미기 줄에서 벗거나 바꿀 수 있어요`);
      render(); flash("wow", 1500);
      const host = liveCat(); if (host && !STILL) C.burst(...center(host), "star", 14, 300);
    }, STILL ? 50 : 1200);
  }
  // 설정 판(2026-10-25 두승현 — 옆에 따로 뜨던 설정 창을 섬 안으로: 채팅 자리를 통째로 바꿔 끼운다, 알림 · AI 진행 판과 같은 틀).
  //   왼쪽 칸 = 플로로 · 작업실 · 칭호 · 등급, 오른쪽 = '← 채팅으로' · 탭(묶음 하나씩) · 그 묶음. Esc · 톱니 · '채팅으로'로 닫는다
  let setTab = "room";
  const SET_TABS = () => [["room", "작업실"], ["link", "연결"], ["view", "보기"], ...(canLive ? [["token", "토큰"]] : []), ["log", "알림 · 느낀 점"], ["keep", "기록"]];
  function roomGroup() {
    return `${SHELF_ON ? `<button type="button" class="golib" data-act="lib-enter"><span class="bk">${I.lib}</span><span>서재로 가기<small>끝낸 책 · 서고 — 지금 책은 퀘스트 창의 서고 탭에</small></span></button>` : ""}
      ${sgrp(I.scroll, "작업실 · 퀘스트 창", `${srow("이름", `<input class="name-in" data-act="name" value="${esc(userName)}" maxlength="20" placeholder="이름" aria-label="이름">`, "작업실 이름에 보여요 · 이 컴퓨터에만")}
        <label class="chk"><input type="checkbox" data-act="qauto" ${qauto ? "checked" : ""}>퀘스트를 받으면 작업실이 바로 뜨기</label>`)}
      ${sgrp(coin(), "꾸미기", `<span class="closet">${st.owned.map(QU.itemOf).filter(Boolean).map((it) => `<button type="button" data-act="wear" data-v="${it.id}" aria-pressed="${st.wear[it.slot] === it.id}">${it.emoji} ${esc(it.name)}</button>`).join("")}<button type="button" data-act="gacha">조개 열기 <span class="shells">${coin()}${st.shells}</span></button></span>
        <span class="meta">뽑기로 얻은 것 · 조개 ${st.shells}개</span>`)}`;
  }
  const SET_PART = { room: roomGroup, link: () => `${linkGroup()}${githubGroup()}`, view: viewGroup, token: tokenGroup, log: logGroup, keep: keepGroup };
  function settingsPane(modal = false) {
    deskKeys.Escape = { act: "settings" };
    const tabs = SET_TABS(); if (!tabs.some(([id]) => id === setTab)) setTab = "room";
    const lv = level, bi = QU.bandOf(lv), nx = QU.BANDS[bi + 1];
    return `<section class="mc base pane setp tone-gray" aria-label="설정"><div class="who">${petCat(st.finished ? "happy" : "look", 92)}<b class="pj">${esc(userName || "나")} 님의 작업실</b><span class="tl">${esc(project() || "아직 프로젝트가 없어요")}</span>
        <span class="rk">칭호 · ${esc(QU.rankOf(Math.min(lv, 7)))} <b>LV ${lv}</b></span>
        <div class="bands">${QU.BANDS.map((b, i) => `<span class="t${i === bi ? " on" : i < bi ? " done" : ""}">${b[0]}</span>`).join("")}<small>${nx ? `레벨 ${nx[1]}이 되면 ${nx[0]} — 관문마다 +1, 프로젝트를 바꿔도 그대로` : "상급자예요 — 레벨은 계속 올라요"}</small></div></div>
      <div class="main"><div class="row ph">${modal ? `<b class="grow">설정</b><button type="button" class="ti set-x" data-act="settings" aria-label="설정 닫기" title="닫기 (Esc)">${X_ICON}</button>` : `<button type="button" class="lnk" data-act="settings" title="채팅으로 돌아가기 (Esc)">${I.back}채팅으로</button><b class="grow">설정</b>`}</div>
        <div class="wtabs" role="tablist" aria-label="설정 묶음">${tabs.map(([id, label]) => `<button type="button" role="tab" data-act="set-tab" data-tab="${id}" aria-selected="${setTab === id}">${label}</button>`).join("")}</div>
        <div class="set-body" role="tabpanel" aria-label="${esc((tabs.find(([id]) => id === setTab) || tabs[0])[1])}">${SET_PART[setTab]()}</div></div></section>`;
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
    if (!s.doc) return docShell(mood, say, "", `<div class="doc-empty">${I.doc}<b>${LB(s.n)}는 문서 없이 진행해요</b><span>${DOC.none}</span></div>`);
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
      `<div class="doc-head"><h3>${esc(s.doc)}</h3><span class="meta">${LB(s.n)}</span></div><textarea class="doc" data-act="doc" aria-label="단계 문서">${esc(d.text)}</textarea>${reviewList(d.review)}${docNotes()}`);
  }
  // 단계 지도(deskMap)는 2026-10-21 C-22로 퀘스트 창의 도전과제 판(treePane)이 됐다. 휴대폰의 단계 지도(mapBody)는 그대로
// ━━ app/60-library.js ━━
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
  function bookPane() {
    if (libSelected()) return deskLib();
    if (SHELF_ON) return `${readmeBox()}${deskLib()}`;
    const mine = L() && SCH() ? openBooks().find((b) => b.mine) : null;
    return `${readmeBox()}<div class="libtab">${inboxBox()}${mine ? `<div class="ob-foot"><button type="button" class="b" data-act="lib-book" data-id="${esc(mine.id)}">이 프로젝트의 단계 문서 · 정한 것 펼치기</button></div>` : ""}</div>`;
  }
  function readmeBox() {
    if (!RB) return "";
    const r = st.rb || { book: RB.parse(RB.EXAMPLE), src: "example", why: "" };
    const b = r.book, sel = Math.min(Math.max(0, st.rbSel | 0), Math.max(0, b.chapters.length - 1)), ch = b.chapters[sel];
    const from = r.src === "mine" ? `내 저장소 README · ${esc(r.project || "")}` : `연습 예시 책${r.why ? ` — ${esc(r.why)}` : ""}`;
    return `<section class="rbook" aria-label="내 작업 책"><div class="rb-head"><div class="grow"><b>${esc(b.title || "제목 없는 책")}</b><small>${from}</small></div>${
        canLive ? `<button type="button" class="b ghost" data-act="rb-reload" title="README를 다시 읽어요">다시 읽기</button>` : ""}</div>
      ${b.intro ? `<p class="rb-intro">${esc(b.intro)}</p>` : ""}
      ${b.versions.length ? `<ol class="rb-vers" aria-label="버전">${[...b.versions].sort((x, y) => parseInt(x.v.slice(2), 10) - parseInt(y.v.slice(2), 10)).map((v) => `<li><b>${esc(v.v)}</b><span>${esc(v.date)}</span>${esc(v.title)}</li>`).join("")}</ol>` : ""}
      ${ch ? `<div class="rb-body"><nav class="rb-toc" aria-label="목차">${b.chapters.map((c, i) => `<button type="button" data-act="rb-sel" data-i="${i}" aria-current="${i === sel}">${esc(c.title)}</button>`).join("")}</nav>
        <article class="rb-ch" id="${esc(ch.id)}"><h4>${esc(ch.title)}</h4><div class="rb-text">${esc(ch.body)}</div></article></div>`
      : `<p class="meta">README에 ## 제목이 아직 없어요 — 퀘스트를 마치면 한 장씩 생겨요.</p>`}
      <p class="meta">${b.cut ? "README가 길어 앞부분만 보여요. " : ""}고치는 곳은 README예요 — 책은 받아 와 보여 주기만 해요.</p></section>`;
  }
  // README 읽기(API.md 3-18) — 서버로 연 화면에서만. 서버 없이 · 폴더를 모름 · README 없음이면 연습 예시 책과 까닭 한 줄
  async function loadReadme() {
    if (!RB) return;
    const example = (why) => ({ book: RB.parse(RB.EXAMPLE), src: "example", why });
    if (!canLive || st.mode === "fixture") { st.rb = example(canLive ? "연습 모드예요" : "서버 없이 열었어요"); return render(); }   // 연습 모드는 진짜 README를 섞지 않는다(API.md 3-18)
    try {
      const r = await (await fetch("/api/readme", { cache: "no-store" })).json();
      st.rb = r && r.ok && r.book ? { book: r.book, src: "mine", project: r.project, why: "" }
        : example(r && r.why === "none" ? "이 폴더에 README.md가 없어요" : "연결한 폴더를 아직 몰라요 — 그 폴더에서 Claude Code를 한 번 열어요");
    } catch { st.rb = example("서버에 닿지 않았어요"); }
    render();
  }
  // 튜토리얼 한 장(C-30, 2026-10-23) — 어떻게 움직이나 · 예시 · 막히면. 있는 기능은 '해 보기'로 바로. 도전과제의 '관문 전에 알아 둘 것'에서 고르면 펼친다(C-35)
  function tuCard(t) {
    return `<article class="tu"><div class="tu-h"><b>${esc(t.name)}</b><span class="tu-st ${t.state}">${t.state === "ready" ? "있음" : "만드는 중"}</span></div><p>${esc(t.what)}</p>
        <h5>어떻게 움직이나</h5><ol>${t.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
        <h5>예시</h5><div class="tu-ex"><span>${esc(t.example.in)}</span><i aria-hidden="true">→</i><span>${esc(t.example.out)}</span></div>
        <h5>막히면</h5><p>${esc(t.stuck)}</p>
        ${!t.try ? "" : t.try.ai && st.mode !== "fixture" ? `<div class="row"><button type="button" class="b" disabled>${esc(t.try.label)}</button><span class="meta">진짜 AI 모드에서는 토큰이 들어요 — 연습 모드에서 해 봐요</span></div>`
          : `<div class="row"><button type="button" class="b pri" data-act="${esc(t.try.act)}">${esc(t.try.label)}</button></div>`}</article>`;
  }
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
  function inboxBox() {
    if (!FD || !st.inbox.length) return "";
    const rows = st.inbox.slice(0, 5).map((x, i) => `<li><span class="ft"><b>${esc(x.topic)}</b>${x.example ? " <small>· 예시</small>" : ""}<small>${esc(String(x.text || "").replace(/\s+/g, " ").slice(0, 90))}</small></span>${kindSelect("inbox-kind", i, x.kind)}
      <button type="button" class="b pri" data-act="inbox-ok" data-i="${i}">맞아요 → 책에</button><button type="button" class="b ghost" data-act="inbox-drop" data-i="${i}">빼기</button></li>`).join("");
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
  const wsFull = () => { if (canLive && !st.gh && !ghLoading) setTimeout(loadGithub, 0); return (st.gh && st.gh.project) || project(); };
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
// ━━ app/70-tasks.js ━━
  // ── 준비 계획(C-34) · 맡길 일과 보고(C-32) — claude-drafted: 2026-10-24 (이재엽 "한번에 내용들을 넣으면 어떻게 준비하고 기준들을 사람들이 확인해서 너한테 의견들을 바로바로" ·
  //    버튼 "처음 설정 새 칸 + 맡기기" · "Floe의 AI 한 번" · "Claude Code가 기준마다 보고" · "맡길 일 목록으로") ──
  // 같은 날 C-35(이재엽 "맡기기의 기능은 … 우리 오버레이에서 확인이 가능하게 그리고 이것들을 순차적으로 할려면 퀘스트내용에서 진행" · 버튼 "맡길 일 퀘스트 하나로" · "채팅에서 전부"):
  // 계획판(판)을 없애고 채팅의 지금 말로 — 채팅 칸에 한 번에 붙여 넣기 → 계획 세우기(/api/plan — AI 한 번, 도구 없이) → 플로로의 말 안에서 줄마다 맞아요 / 고칠래요 · 의견 · 답 → 다시 세우기 또는 확정 →
  // 퀘스트 창의 '맡길 일' 퀘스트(순서대로) → 지금 줄 맡기기(/api/task/start + checks — 그 기준으로 Claude Code가 끝에 보고) → 허락 카드 · 보고도 채팅에 → 맞아요(끝냄) / 다르게 봐요(의견 달고 다시) → 다음 줄.
  // 규칙은 plan.js, 서버 없이(연습)는 예시 계획 · 예시 보고
  const PL_BUSY = { make: "플로로가 계획을 세우는 중이에요", hand: "Claude Code에 넘기는 중이에요", ask: "플로로가 답을 찾는 중이에요", stage: "플로로가 다음 장 초안을 만드는 중이에요", ship: "문서를 만드는 중이에요", again: "플로로가 다른 예시를 만드는 중이에요" };   // stage · ship — C-37(기다리는 말만 같이 쓴다)
  const planLive = () => canLive && st.mode === "live";
  // 채팅이 지금 준비 계획 · 맡길 일을 보이나 — 맡길 일을 골랐어도 경고 · 오류 · 관문 · 먹이 정리가 먼저(momentToday 순서). 지금 말 · 입력 칸 · 힌트 · 위 줄이 같이 쓴다(2026-10-24 리뷰)
  const planNow = () => !!FP && st.qfocus === "plan" && !st.warn && !st.error && st.screen !== "gate" && !st.meal;
  const planPractice = (b) => !planLive() || !!(b && b.example);   // 예시 계획은 모드를 바꿔도 연습으로(진짜 Claude Code로 넘기지 않는다 — FR-10, 2026-10-24 리뷰)
  const repChecks = (r) => `<ul>${r.items.map((c) => `<li class="${c.done ? "y" : "n"}">${c.done ? OK_ICON : CIRCLE} ${esc(c.check)}${c.evidence ? ` <span class="meta">— ${esc(c.evidence)}</span>` : ""}</li>`).join("")}</ul>`;
  const planMini = (b, i) => `<span class="mini" aria-hidden="true">${b.plan.items.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</span>`;
  // 단계 퀘스트 쪽에서 맡길 일로 가는 칩 — 보고가 와 있으면 눈에 띄게(보고가 와도 지금 할 퀘스트를 저절로 바꾸지 않는다 — 고르는 것은 사람, 2026-10-24 리뷰)
  const planChip = () => { const b = st.plan, p = b && b.confirmed ? FP.progress(b) : null, rep = !!b && FP.stateOf(b, FP.next(b)) === "report";
    return { label: !b ? "계획 세우기" : !b.confirmed ? "계획 확인 이어 하기" : rep ? "맡길 일 — 보고가 왔어요" : p.done < p.total ? `맡길 일 ${p.done + 1} / ${p.total}` : "맡길 일 다 끝냈어요", act: "plan-open", kind: rep ? "soft" : "ghost" }; };
  // 채팅의 지금 말 — 넣기 → 확인 → 확정 → 지금 줄 맡기기 → 맡김 중 → 보고 → 다음 줄. momentToday가 st.qfocus === "plan"이면 부른다
  function momentPlan() {
    const b = st.plan, ex = b && planPractice(b) ? `<span class="note">예시예요 · 연습</span>` : "";
    if (!b) {
      const has = st.planDraft.trim() !== "";
      return { tone: "blue", mood: has ? "happy" : "look", meta: `<span class="mm-stage">준비 계획</span><span>한 번에 넣기</span>`,
        title: has ? "받은 글로 계획을 세울까요?" : "만들고 싶은 것 · 요구 · 문제 글을 한 번에 붙여 넣어요",
        sub: has ? `글 ${st.planDraft.length.toLocaleString()}자 — 더 붙여 넣으면 이어 붙여요.` : "아래 칸에 붙여 넣고 보내요. 여러 번 나눠 보내도 하나로 모아요.",
        body: `${has ? `<blockquote class="pl-draft">${esc(st.planDraft.length > 400 ? `${st.planDraft.slice(0, 400)}…` : st.planDraft)}</blockquote>` : ""}${
          canLive ? `<label class="chk"><input type="checkbox" data-act="plan-readme" ${st.planReadme ? "checked" : ""}>작업 폴더의 README · 파일 이름 · 단계 문서에서 정한 것도 같이 읽어요</label>` : ""}<p class="mc-fine">${
          planLive() ? "계획 세우기를 누르면 AI를 한 번 불러요 — 넣은 글(같이 읽기를 켜면 README · 파일 이름 · 단계 문서에서 정한 것도)과 이번에 고른 가져온 것만 보내고, 파일을 고치지 않아요." : "연습이라 예시 계획을 보여 줘요(AI를 부르지 않아요)."}</p>`,
        acts: [...(has ? [{ label: "계획 세우기", act: "plan-make", key: "c-Enter", pri: true }, { label: "글 비우기", act: "plan-clear" }] : []), { label: "한 줄만 적어 맡기기", act: "plan-direct" }] };
    }
    if (!b.confirmed) {
      const left = FP.unmarked(b);
      return { tone: "blue", mood: "look", meta: `<span class="mm-stage">준비 계획 · ${b.v}판</span><span>${left ? `아직 안 본 줄 ${left}개` : "다 봤어요"}</span>${ex}`,
        title: esc(b.plan.say || "계획을 세웠어요. 줄마다 맞는지 봐 주세요"), sub: "맞으면 맞아요, 다르면 고칠래요를 누르고 어떻게 고칠지 적어요. 모두 맞아요면 확정해요.",
        body: planReviewBody(b),
        acts: [{ label: "이대로 확정", act: "plan-confirm", key: "c-Enter", pri: true, disabled: !FP.canConfirm(b) }, { label: "의견 보내고 다시 세우기", act: "plan-again", disabled: !(FP.hasFeedback(b) && planLive()) },
          { label: "처음부터 다시 적기", act: "plan-reset" }] };
    }
    const id = FP.running(b) || FP.next(b), p = FP.progress(b);   // 맡김 중인 줄이 먼저(예전 판은 순서 밖의 줄이 맡김 중일 수 있다)
    if (!id) return { tone: "green", mood: "wow", meta: `<span class="mm-stage">맡길 일</span><span>${p.total}개 모두 끝냈어요</span>${ex}`, title: "맡길 일을 다 끝냈어요!",
      sub: "끝낸 줄과 보고는 퀘스트 창의 맡길 일에 남아 있어요.", acts: [{ label: "새 계획 적기", act: "plan-reset", pri: true }] };
    const i = b.plan.items.findIndex((x) => x.id === id), x = b.plan.items[i], w = b.work[id] || {}, s = FP.stateOf(b, id);
    const meta = `<span class="mm-stage">맡길 일 · ${p.total}개 중 ${i + 1}번째</span>${planMini(b, i)}${ex}`;
    if (s === "running") return { tone: "gray", mood: "think", meta, title: `Claude Code가 일하고 있어요${dots}`, sub: `${ROMAN(i)}. ${esc(x.need)}`, passing: true,
      body: `<p class="mc-fine">허락이 필요하면 이 말 위에 카드가 떠요. 끝나면 기준마다 해냈는지 알려 줘요.</p>`, acts: [{ label: "진행 보기", act: "base-ai", kind: "ghost" }, { label: "기다리지 않기", act: "plan-unwait", kind: "ghost" }] };   // 진행 보기 — Claude Code가 한 일 한 줄씩(AI 진행 판)
    if (s === "report" && w.report) { const v = w.verdict || N.reportVerdict(w.report, "done");   // C-50 서버가 기준을 세어 준 미리 보기(없던 옛 기록만 화면이 센다)
      return { tone: v.kind === "done" ? "green" : "amber", mood: v.kind === "done" ? "happy" : "think", meta, title: `보고가 왔어요 — 세어 보니 ${v.word} (기준 ${Number(w.report.total) || 0}개 중 ${Number(w.report.done) || 0}개)`, sub: esc(w.report.easy),
        body: planReportBody(b, id), acts: planReportActs(id, !!w.report.ask, v.kind === "done") }; }
    return { tone: "blue", mood: face()[0], meta, title: `${ROMAN(i)}. ${esc(x.need)}`, sub: `다 됐는지 보는 기준 — ${esc(x.check)}`,
      body: `${w.fail ? `<p class="pl-ans"><b>지난번에 끝까지 못 했어요${w.fail.n > 1 ? `(${w.fail.n}번)` : ""}</b> ${esc(w.fail.why)}</p>` : ""}${w.note ? `<p class="pl-ans"><b>지난번 의견</b> ${esc(w.note)}</p>` : ""}`,   // C-50 실패는 남겨 보인다(조용히 '남음'으로 되돌리지 않는다)
      foot: planPractice(b) ? "연습이라 Claude Code에 보내지 않고 예시 보고를 받아요" : "맡기면 Claude Code가 이 폴더에서 일하고, 끝나면 기준마다 해냈는지 알려 줘요",
      acts: [{ label: w.note || w.fail ? "다시 맡기기" : "맡기기", act: "plan-hand", key: "Enter", pri: true }, { label: "새 계획 적기", act: "plan-reset", kind: "ghost" }] };
  }
  // 지식 퀘스트 C-51(2026-10-29 — PRD 6절 · 9절 9번): 줄마다 근거 한 줄(없으면 '새로 정함'), 앞의 결정과 다르면 그 표시와 어느 쪽을 따를지(이 줄대로 = 맞아요 · 앞의 결정대로 = 고칠래요 + 의견)
  const planBasisHTML = (x) => `${x.basis ? `<span class="meta">근거 — ${esc(x.basis)}</span>` : ""}${x.diff ? `<span class="meta pl-diff"><b>앞의 결정과 다름</b> — 앞에서 정한 것은 '${esc(x.diff.was)}', 이 줄은 '${esc(x.diff.now)}'. 어느 쪽을 따를까요?
    <button type="button" class="btn" data-act="plan-ok" data-id="${esc(x.id)}" aria-pressed="${(st.plan && st.plan.marks[x.id]) === "ok"}">이 줄대로</button><button type="button" class="btn" data-act="plan-follow" data-id="${esc(x.id)}">앞의 결정대로</button></span>` : ""}`;
  // 확인하는 중 — 이해한 것 셋 · 줄마다 맞아요 / 고칠래요(+ 의견) · 준비할 것 · 물을 것(답) · 전체 의견(채팅 칸에 적어도 여기로)
  function planReviewBody(b) {
    const p = b.plan;
    const sum = `<dl class="pl-sum"><div><dt>풀려는 문제</dt><dd>${esc(p.problem)}</dd></div><div><dt>이미 있는 것</dt><dd>${esc(p.have)}</dd></div><div><dt>아직 없는 것</dt><dd>${esc(p.missing)}</dd></div></dl>`;
    const items = `<ol class="pl-items">${p.items.map((x) => { const m = b.marks[x.id] || ""; return `<li class="pl-it ${m}"><div class="pl-txt"><b>${esc(x.need)}</b><span class="meta">기준 — ${esc(x.check)}</span>${planBasisHTML(x)}</div>
      <div class="pl-btns" role="group" aria-label="이 줄이 맞나요"><button type="button" class="btn" data-act="plan-ok" data-id="${esc(x.id)}" aria-pressed="${m === "ok"}">맞아요</button><button type="button" class="btn" data-act="plan-fix" data-id="${esc(x.id)}" aria-pressed="${m === "fix"}">고칠래요</button></div>${
      m === "fix" ? `<textarea class="mc-input" data-act="plan-note" data-id="${esc(x.id)}" rows="2" aria-label="어떻게 고칠까요" placeholder="어떻게 고칠까요? 예) 연락처 칸은 빼요">${esc(b.notes[x.id] || "")}</textarea>` : ""}</li>`; }).join("")}</ol>`;
    const prep = p.prep.length ? `<p class="kicker">준비할 것</p><ul class="pl-prep">${p.prep.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    const ask = p.ask.length ? `<p class="kicker">플로로가 물어요</p>${p.ask.map((q, i) => `<label class="pl-ask"><span>${esc(q)}</span><input class="mc-input" data-act="plan-answer" data-i="${i}" value="${esc(b.answers[i] || "")}" placeholder="답 — 모르면 비워 둬요"></label>`).join("")}` : "";
    return `${sum}${items}${prep}${ask}<label class="pl-ask"><span>전체 의견(있으면) — 채팅 칸에 적어도 여기로 와요</span><textarea class="mc-input" data-act="plan-general" rows="2">${esc(b.general)}</textarea></label>`;
  }
  // 보고 — 기준마다 해냄 · 근거. Claude Code가 물은 것이 있으면 답 칸(답하면 그 답을 붙여 이어서 맡긴다 — C-33), 다르게 봐요 · 물어보기를 누르면 적는 칸
  function planReportBody(b, id) {
    const r = b.work[id].report, ans = st.planAns[id];
    return `<div class="pl-rep">${repChecks(r)}${r.ask ? `<label class="pl-ask"><span>Claude Code가 물어요: ${esc(r.ask)}</span><input class="mc-input" data-act="plan-reply" data-id="${esc(id)}" value="${esc(st.planReply[id] || "")}" placeholder="답을 적고 '답하고 이어서 맡기기'(Ctrl+Enter)"></label>` : ""}${
      ans ? `<p class="pl-ans"><b>플로로의 답</b> ${esc(ans)}</p>` : ""}${
      st.planRej === id ? `<textarea class="mc-input" data-act="plan-rej-note" rows="2" aria-label="어디가 다른가요" placeholder="어디가 다른가요? 예) 목록 화면은 아직 없어요">${esc(st.planRejNote)}</textarea>`
      : st.planAsk === id ? `<input class="mc-input" data-act="plan-q" value="${esc(st.planQ)}" aria-label="플로로에게 물어볼 것" placeholder="이 보고에서 궁금한 것 — 예) 목록은 어디서 봐요?">` : ""}</div>`;
  }
  // 보고의 칩 — 맞아요(끝냄) / 다르게 봐요(의견 달고 다시) / 물어보기(이 보고에 대해 플로로에게 — Floe의 AI 한 번, C-32).
  //   Claude Code가 물었으면 답하고 이어서 맡기기가 먼저(Ctrl+Enter) — 답 칸에서 Ctrl+Enter가 Enter의 '맞아요'로 넘어가 줄을 끝내던 것(2026-10-24 리뷰)
  // C-50(2026-10-29): '맞아요'는 미리 판정이 '다 됨'일 때만 큰 단추(done) — 덜 됐으면 '다르게 봐요'와 같은 크기
  const planReportActs = (id, asked, done = true) => (st.planRej === id ? [{ label: "의견 달고 다시 맡기기", act: "plan-reject", key: "c-Enter", pri: true }, { label: "그만두기", act: "plan-rej-close", kind: "ghost" }]
    : st.planAsk === id ? [{ label: "물어보기", act: "plan-ask-send", key: "c-Enter", pri: true }, { label: "그만두기", act: "plan-ask-close", kind: "ghost" }]
    : asked ? [{ label: "답하고 이어서 맡기기", act: "plan-reply-send", key: "c-Enter", pri: true }, { label: "맞아요 — 끝냈어요", act: "plan-accept" }, { label: "다르게 봐요", act: "plan-rej-open" }, { label: "물어보기", act: "plan-ask-open" }]
    : [{ label: "맞아요 — 끝냈어요", act: "plan-accept", ...(done ? { key: "Enter", pri: true } : {}) }, { label: "다르게 봐요", act: "plan-rej-open", ...(done ? {} : { key: "Enter" }) }, { label: "물어보기", act: "plan-ask-open" }]);
  // 채팅 칸에 적은 말 — 계획이 없으면 넣는 글에 이어 붙이고, 확인하는 중이면 전체 의견, 보고가 왔으면 Claude Code의 물음에 답하거나 플로로에게 묻기
  function planSay(t) {
    const b = st.plan, id = b && FP.next(b), w = id && b.work[id];
    if (!b) {
      const all = `${st.planDraft.trim() ? `${st.planDraft.trim()}\n` : ""}${t}`;
      st.planDraft = all.slice(0, N.PLAN_MAX); save(); render();
      return say(all.length > N.PLAN_MAX ? `${N.PLAN_MAX.toLocaleString()}자까지만 받아요 — 뒷부분은 잘렸어요` : `받았어요 — 글 ${st.planDraft.length.toLocaleString()}자예요`);
    }
    if (!b.confirmed) { st.plan = { ...b, general: `${b.general.trim() ? `${b.general.trim()} ` : ""}${t}`.slice(0, 300) }; save(); render(); return say("전체 의견에 적었어요 — 다시 세울 때 같이 보내요"); }
    if (w && w.state === "report" && w.report) {
      if (w.report.ask) { st.planReply = { ...st.planReply, [id]: t }; return ACT["plan-reply-send"](); }
      st.planAsk = id; st.planQ = t; return askPlan(id);
    }
    render(); say(w && w.state === "running" ? "Claude Code가 일하는 중이에요 — 끝나면 보고가 와요" : "지금 줄을 맡기려면 '맡기기'를 눌러요");
  }
  // 퀘스트 탭(C-35) — 계획이 있으면 위에 '지금 할 퀘스트' 둘(단계 퀘스트 · 맡길 일). 고른 쪽을 채팅이 따른다
  function questTab() {
    if (!FP || !st.plan) return questPane();
    const q = st.quest, b = st.plan, p = b.confirmed ? FP.progress(b) : null, qp = q && q.phase === "quest" ? QU.progress(q) : null;
    const stageName = q && q.phase !== "done" ? `${LB(q.chap)} · ${esc(q.title)}` : st.j ? `${LB(st.j.stage)} · ${esc(stage().title)}` : "단계 퀘스트 — 아직 없어요";
    const opt = (v, name, sub) => `<button type="button" data-act="qfocus" data-v="${v}" aria-pressed="${st.qfocus === v}"><b>${name}</b><small>${sub}</small></button>`;
    return `<div class="qsel" role="group" aria-label="지금 할 퀘스트">${opt("stage", stageName, qp ? `${qp.n}개 중 ${qp.k}번째 할 일` : "채팅에서 이어 해요")}${
      opt("plan", "맡길 일", p ? `${p.total}개 중 ${p.done}개 끝냄` : `계획 ${b.v}판 · 확인하는 중`)}</div>${st.qfocus === "plan" ? planQuestPane(b) : questPane()}`;
  }
  // 맡길 일 퀘스트 — 왼쪽 목차(순서대로 끝냄 · 지금 · 아직), 오른쪽 고른 줄(요구 · 기준 · 받은 보고). 맡기기 · 보고 확인은 채팅에서 — 여기는 보기만
  function planQuestPane(b) {
    if (!b.confirmed) return `<div class="qempty"><b>계획을 확인하는 중이에요 (${b.v}판)</b>채팅에서 줄마다 맞아요 / 고칠래요를 누르고 확정하면, 이 창에 맡길 일이 순서대로 생겨요.</div>`;
    const items = b.plan.items, cur = FP.next(b), sel = items.some((x) => x.id === st.planSel) ? st.planSel : cur || items[items.length - 1].id;
    const word = (id) => { const s = FP.stateOf(b, id); return s === "done" ? "끝냄 ✓" : id !== cur ? "★ 아직" : s === "running" ? "맡김 중" : s === "report" ? "보고 왔어요" : (b.work[id] || {}).fail ? "다시" : "지금"; };   // 다시 — 지난번에 끝까지 못 한 줄(C-50)
    const toc = items.map((x, i) => `<button type="button" data-act="plan-sel" data-id="${esc(x.id)}" aria-pressed="${x.id === sel}" class="${FP.stateOf(b, x.id) === "done" ? "done" : x.id === cur ? "" : "lock"}">${ROMAN(i)}. ${esc(x.need)}<small>${word(x.id)}</small></button>`).join("");
    const k = items.findIndex((x) => x.id === sel), x = items[k], w = b.work[sel] || {};
    return `<div class="book"><div class="page l"><h4>목차 · 맡길 일</h4><div class="toc">${toc}</div></div>
      <div class="page r"><h3>${esc(x.need)}</h3><div class="meta">맡길 일 · ${items.length}개 중 ${k + 1}번째 · ${word(sel)}${planPractice(b) ? " · 예시예요" : ""}</div>
        <p><b>다 됐는지 보는 기준</b> — ${esc(x.check)}</p>${w.fail ? `<p><b>지난번에 끝까지 못 했어요${w.fail.n > 1 ? `(${w.fail.n}번)` : ""}</b> — ${esc(w.fail.why)}</p>` : ""}${w.note ? `<p><b>지난번 의견</b> — ${esc(w.note)}</p>` : ""}${w.report ? `<div class="pl-rep"><p>${esc(w.report.easy)}</p>${repChecks(w.report)}</div>` : ""}
        <p class="meta">${sel === cur ? "맡기기 · 보고 확인은 채팅에서 해요." : FP.stateOf(b, sel) === "done" ? "끝낸 줄이에요." : "앞 줄을 끝내면 열려요."}</p>
        <p><b>풀려는 문제</b> — ${esc(b.plan.problem)}</p></div></div>`;
  }
  // AI에게 묻는 것들 — 무엇을 기다리는지(planBusy)를 같이 보인다
  const planId = (el) => (el && el.dataset && el.dataset.id) || (st.plan ? FP.next(st.plan) : "");   // 보고 안의 단추는 data-id, 채팅의 칩은 지금 줄
  const planCall = async (kind, url, body) => { if (st.busy) return callAI(url, body); st.planBusy = kind; try { return await callAI(url, body); } finally { st.planBusy = ""; } };   // 바쁠 때는 앞 일의 '무엇을 기다리나'를 지우지 않는다(F-103-5)
  const carryTexts = () => (((st.carryUse || {})[st.j ? st.j.stage : 0]) || []).map((x) => x && x.text).filter(Boolean).slice(0, 3);   // C-51
  const carryBody = () => { const c = carryTexts(); return c.length ? { carry: c } : {}; };   // 고른 것이 없으면 보내지 않는다(전과 같은 본문)
  async function makePlan(skipCheck) {
    const text = st.planDraft.trim(); if (!text) return;
    if (!planLive()) { st.plan = FP.board(FP.EXAMPLE_PLAN, null, { example: true }); save(); render(); return say("연습이라 예시 계획이에요. 줄마다 맞는지 봐 주세요."); }
    if (!skipCheck && guard(text, "plan")) return;
    st.warn = null;
    const r = await planCall("make", "/api/plan", { text, readme: st.planReadme, ...carryBody() });   // carry — C-51 이번 단계에 쓰기로 고른 가져온 것(C-48)
    if (r.ok) { st.plan = FP.board(r.plan); save(); render(); fetchUsage(); return say(r.plan.say); }
    render(); say(r.reason || "계획을 세우지 못했어요");
  }
  // 다시 세우기 — 의견 · 답 · 전체 의견도 보내기 전에 비밀값 모양을 본다(2026-10-24 리뷰)
  async function revisePlan(skipCheck) {
    const b = st.plan; if (!b || !planLive() || !FP.hasFeedback(b)) return;
    const fb = FP.feedback(b);
    if (!skipCheck && guard([...fb.notes.map((n) => n.note), ...fb.answers.map((x) => x.a), fb.general].join("\n"), "planAgain")) return;
    st.warn = null;
    const r = await planCall("make", "/api/plan", { text: st.planDraft.trim() || b.plan.problem, readme: st.planReadme, prev: b.plan, ...fb, ...carryBody() });
    if (r.ok) { st.plan = FP.board(r.plan, b); save(); render(); fetchUsage(); return say(r.plan.say); }
    render(); say(r.reason || "다시 세우지 못했어요");
  }
  // 물어보기 — 이 보고에 대해 플로로에게(Floe의 AI 한 번, /api/answer). 맡긴 일 · 기준 · 보고 글만 보낸다
  //   skipCheck — 경고 뒤 '보낼게요'(RETRY.planAsk)로 다시 올 때는 guard를 또 지나지 않는다(F-103-2 — 같은 경고만 되풀이됐다)
  async function askPlan(id, skipCheck) {
    const b = st.plan, q = st.planQ.trim(), w = b && b.work[id], x = b && b.plan.items.find((i) => i.id === id);
    if (!q || !w || !w.report || !x) return;
    if (planPractice(b)) { st.planAns = { ...st.planAns, [id]: "연습이라 답하지 않아요 — 진짜 AI로 바꾸면 이 보고를 보고 답해 줘요." }; st.planAsk = ""; return render(); }
    if (!skipCheck && guard(q, "planAsk")) return;
    st.warn = null;
    const text = [`맡긴 일: ${x.need}`, `다 됐는지 보는 기준: ${x.check}`, `Claude Code의 보고: ${w.report.easy}`, ...w.report.items.map((c) => `- ${c.check}: ${c.done ? "해냄" : "아직"}${c.evidence ? ` (${c.evidence})` : ""}`)].join("\n");
    const r = await planCall("ask", "/api/answer", { stage: atStage(), hard: [], question: q, text, tier: st.tier });
    if (r.ok) { st.planAns = { ...st.planAns, [id]: r.answer }; st.planAsk = ""; st.planQ = ""; fetchUsage(); } else say(r.reason || "답하지 못했어요");
    render();
  }
  // 지금 줄 맡기기 — 진짜면 서버가 기준과 함께 Claude Code에 넘기고(그 실행이 끝에 기준마다 보고), 연습이면 잠시 뒤 예시 보고. 순서대로라 지금 줄(next)만(C-35)
  async function handPlan(id = st.plan && FP.next(st.plan)) {
    const b = st.plan; if (!b || !b.confirmed || FP.running(b) || !id || id !== FP.next(b)) return;
    const t = FP.taskFor(b, id);
    if (planPractice(b)) {
      st.plan = FP.start(b, id); render();
      setTimeout(() => { st.plan = FP.report(st.plan, id, FP.exampleReport(t.checks)); save(); render(); say("예시 보고가 왔어요. 맞는지 봐 주세요."); }, 900);
      return;
    }
    // C-50: 지난번에 끝까지 못 한 줄이 아직 서버의 그 일이면 같은 일로 다시 — 서버가 앞에서 한 일을 붙이고 다시 맡기기 상한(2번)을 센다(새 맥락 리뷰 2026-10-29 막힘)
    const w = b.work[id] || {};
    let r = w.fail && Number.isFinite(w.at) ? await planCall("hand", "/api/task/retry", { at: w.at, way: "again" }) : null;
    if (r && !r.ok && r.why === "cap") { render(); return say(r.reason); }
    if (!r || !r.ok) r = await planCall("hand", "/api/task/start", { text: t.text, checks: t.checks });   // 다른 일이 지나갔으면 새로 — 글에 '지난번에 끝까지 못 했어요'가 붙는다(taskFor)
    if (!r.ok) { render(); return say(r.reason || "맡기지 못했어요"); }
    st.plan = FP.start(b, id, r.task && r.task.at); save(); render(); say("맡겼어요 — 허락이 필요하면 카드가 떠요");
    watchTask(r.task, "plan");
  }
  // 맡긴 줄이 끝났나 — 맡긴 일 지켜보기(watchTask, F-69)가 부른다. 끝나면 보고(report)를 판에 붙이고 쉬운 말 요약을 플로로가 말한다. 보고가 없으면 다시 맡길 수 있게
  function planEnd(t) {
    const id = st.plan && FP.running(st.plan); if (!id) return;
    // 보고는 맡길 일의 지금 말로(C-35). 단계 퀘스트를 보고 있으면 지금 할 퀘스트는 그대로 두고 채팅에 한 줄 · 칩(planChip)으로 알린다 — 고르는 것은 사람(2026-10-24 리뷰). 접혀 있으면 살짝 보인다
    if (t && t.report) { st.plan = FP.report(st.plan, id, t.report, t.verdict || null); logMsg("sys", `Claude Code가 보고를 보냈어요${st.qfocus === "plan" ? "" : " — '맡길 일'에서 봐요"}`); peek(); say(t.report.easy.length > N.SAY_MAX ? `${t.report.easy.slice(0, N.SAY_MAX - 1)}…` : t.report.easy); }
    else { const why = t && t.state === "failed" ? "끝까지 가지 못했어요" : "보고를 받지 못했어요"; st.plan = FP.failed(st.plan, id, why); peek(); say(`${why} — 다시 맡길 수 있어요`); }
    save(); render(); fetchUsage();
  }
  // 다른 일(저장소 만들기 등)이 이 줄의 자리를 차지했다 — 이 줄의 보고는 잃었으니 다시 맡길 수 있게
  const planLost = () => { const id = st.plan && FP.running(st.plan); if (!id) return; st.plan = FP.failed(st.plan, id, "다른 일이 자리를 차지했어요"); peek(); say("보고를 받지 못했어요 — 다시 맡길 수 있어요"); save(); render(); };
  // ── F-69 맡긴 일 지켜보기 · 막힘(2026-10-28 — 이재엽 "결과물이 안나오는 문제 해결", 결정 모음 A-03 "허락 팝업을 다시 → 선택창 → 까닭과 가장 가까운 길") ──
  //   맡긴 일(계획 줄 · 문서 올리기 · 문서 틀 · 저장 커밋 · 저장소 만들기 · 일 넘기기 · 뼈대 · 요구 줄 · 돌려 보기)을 한 곳에서 3초마다 묻는다(/api/task — 그 일의 번호 at가 맞을 때만).
  //   끝나면 그 일의 끝(TASK_END[kind].end). claude -p는 허락을 못 받아도 끝 코드 0이라, 서버가 거절된 도구를 세어 state blocked로 준다 —
  //   ① 처음 막혔고 허락 카드에 답이 없었으면(못 누름) 카드를 다시 띄운다(같은 일을 같은 번호로) ② 또 막히거나 · 거절했거나 · 카드가 안 떴으면 선택창(다시 맡기기 · 직접 하기 · 그만두기)
  //   ③ 또 막히면 까닭(무엇이 · 왜)과 결과에 가장 가까운 길(명령 없이 파일만 · 한 번 더 · 직접 하기 · 그만두기). 고르는 것은 사람 — 대신 허용하는 길은 없다(FR-17)
  const TASK_END = {
    ship: { end: shipEnd, stop: () => { st.ship = null; } },
    plan: { end: planEnd, lost: planLost, stop: (why) => { const id = st.plan && FP.running(st.plan); if (id) { st.plan = FP.failed(st.plan, id, why || "그만뒀어요"); save(); } } },
    preset: { end: (t) => presetEnd(t) },
    send: { end: (t) => say(t.state === "done" ? "Claude Code가 넘긴 일을 마쳤어요" : "넘긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요") },
    commit: { end: (t) => { if (t.state !== "done") say("커밋을 맡긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요"); } },
    repo: { end: () => { st.gh = null; loadGithub(); } },   // 저장소가 생겼는지 다시 묻는다(설정의 GitHub 칸)
    build: { end: buildEnd, stop: () => { st.build = null; } }, code: { end: buildEnd, stop: () => { st.build = null; } },   // F-70 뼈대 · 6단계 코드 물음 '예'
    line: { end: buildEnd, stop: () => { st.build = null; } }, run: { end: runEnd, stop: () => { st.build = null; } },   // F-70 기능 줄 · 돌려 보기
  };
  let tw = null, twTimer = null, twBusy = false;   // tw — 지금 지켜보는 맡긴 일 { at, kind }
  function watchTask(task, kind) {
    if (!task || !Number.isFinite(task.at) || !canLive) return;
    if (tw && tw.at !== task.at) { const h = TASK_END[tw.kind] || {}; st.stall = null; if (h.lost) h.lost(); else if (h.stop) h.stop(); }   // 다른 일이 덮었다 — 앞 일을 끝맺는다(계획 줄을 다시 맡길 수 있게, 새 맥락 리뷰 2026-10-28)
    tw = { at: task.at, kind };
    if (st.blocked && st.blocked.at !== task.at) st.blocked = null;
    clearInterval(twTimer); twTimer = setInterval(twTick, 3000);
  }
  function twStop() { clearInterval(twTimer); twTimer = null; tw = null; }
  async function twTick() {
    if (!tw) { twStop(); return; }
    if (twBusy) return;
    twBusy = true;   // 3초 타이머와 훅 알림이 겹쳐 두 번 묻지 않게
    let t = null; try { t = (await (await fetch("/api/task", { cache: "no-store" })).json()).task; } catch { return; } finally { twBusy = false; }
    if (!tw) return;
    const w = tw, h = TASK_END[w.kind] || {};
    if (!t || t.at !== w.at) { twStop(); st.blocked = null; st.stall = null; if (h.lost) h.lost(); else if (h.stop) h.stop(); render(); return; }   // 다른 일 — 이 일의 결과는 잃었다
    if (t.state === "running") { stallCheck(t, w.kind); return; }
    st.stall = null;
    if (t.state === "blocked" && st.blocked && st.blocked.at === t.at && !st.blocked.retrying) return;   // 이미 카드로 물었다 — 훅 알림이 또 깨워도 단계를 올리지 않는다(새 맥락 리뷰 2026-10-28)
    if (t.state === "blocked") { clearInterval(twTimer); twTimer = null; onBlocked(t, w.kind); return; }
    if (t.state === "stopped") { twStop(); st.blocked = null; if (h.stop) h.stop("다른 화면에서 멈췄어요"); render(); return; }   // C-50 사람이 멈췄다(다른 화면에서)
    twStop(); st.blocked = null;
    if (t.state === "done" && t.denied > 0) logMsg("sys", `허락 카드에서 거절한 ${t.denied}번은 하지 않았어요`);   // 사람이 고른 거절뿐이라 끝남 — 그래도 빠진 것은 말한다(security-records 6-1)
    if (h.end) h.end(t);
    render();
  }
  // ── C-50 맡긴 일이 멈추면(2026-10-28 — 결정 모음 A-06): 서버가 준 조용한 시간(quiet — 그 폴더의 훅 알림 · 허락 카드가 마지막으로 온 뒤)으로
  //   2분 조용함(한 줄) · 5분 멈춘 것 같음 · 15분 시간 초과(카드). 값은 임시 — 리허설에서 재서 정한다. 끄지 않고 A-03 선택창으로: 더 기다리기 · 멈추고 다시 맡기기 · 직접 하기 · 멈추고 그만두기(멈추기는 사람이 고를 때만)
  const QUIET = { calm: 120, stuck: 300, over: 900 }, QLV = { calm: 1, stuck: 2, over: 3 };
  function stallCheck(t, kind) {
    const q = t.quiet || 0, lv = q >= QUIET.over ? "over" : q >= QUIET.stuck ? "stuck" : q >= QUIET.calm ? "calm" : "", prev = st.stall && st.stall.at === t.at ? st.stall : null;
    if (!lv) { if (prev) { st.stall = null; render(); } return; }   // 다시 움직인다
    if (prev && QLV[prev.lv] >= QLV[lv]) { prev.q = q; return; }
    st.stall = { at: t.at, kind, lv, q, wait: prev ? prev.wait : "", cap: (t.retries || 0) >= (t.retryMax || 2) };   // cap — 다시 맡기기 상한에 닿았으면 '멈추고 다시 맡기기'를 숨긴다
    if (lv === "calm") return say("Claude Code가 2분째 조용해요 — 조금 더 기다려 볼게요");
    if (st.ui !== "home") go("home"); else render();
  }
  const stallShown = () => !!(st.stall && st.stall.lv !== "calm" && st.stall.wait !== st.stall.lv);
  function momentStall() {
    const s = st.stall, over = s.lv === "over", min = Math.max(1, Math.floor(s.q / 60));
    return { tone: "amber", mood: "think", meta: `<span class="mm-stage">맡긴 일 · ${over ? "시간 초과" : "멈춘 것 같아요"}</span>`,
      title: over ? `${min}분 넘게 아무 소식이 없어요` : `Claude Code가 ${min}분째 조용해요 — 멈춘 것 같아요`,
      sub: "허락을 기다리거나 오래 걸리는 일일 수 있어요. 끄지 않고 더 기다릴 수도, 멈추고 다시 맡기거나 직접 할 수도 있어요.",
      acts: [{ label: "더 기다리기", act: "stall-wait", key: "Enter", pri: true }, ...(s.cap ? [] : [{ label: "멈추고 다시 맡기기", act: "stall-again" }]), { label: "멈추고 직접 하기", act: "stall-self" }, { label: "멈추고 그만두기", act: "stall-stop", kind: "ghost" }] };
  }
  // 사람이 고르면 멈춘다 — 지켜보기를 잠시 세우고(멈춘 결과를 끝으로 읽지 않게) 서버가 그 일을 끌 때까지 기다린다
  async function stallHalt() {
    const s = st.stall; if (!s) return null;
    clearInterval(twTimer); twTimer = null; st.stall = null;
    try { await fetch("/api/task/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ at: s.at }) }); } catch {}
    for (let k = 0; k < 40; k++) { let t = null; try { t = (await (await fetch("/api/task", { cache: "no-store" })).json()).task; } catch {} if (!t || t.at !== s.at || t.state !== "running") break; await new Promise((r) => setTimeout(r, 250)); }
    return s;
  }
  // 막혔다 — ①이면 바로 다시 맡기고, ② · ③이면 카드(momentBlocked). 접혀 있어도 펼친다(허락 카드와 같이 — 사람이 골라야 이어진다)
  function onBlocked(t, kind) {
    const prev = st.blocked && st.blocked.at === t.at ? st.blocked : null, b = t.blocked || { count: 0, kinds: [], asks: { allow: 0, deny: 0, none: 0 } };
    const cap = (t.retries || 0) >= (t.retryMax || 2);   // C-50 사람이 고른 다시 맡기기는 2번까지(①은 세지 않는다)
    if (!prev && !t.try && b.asks.none > 0 && !b.asks.deny) { st.blocked = { at: t.at, kind, step: 1, b, brief: "", cap }; retryBlocked("again", true); return; }   // ① 카드를 못 눌렀다 — 다시 띄운다
    st.blocked = { at: t.at, kind, step: prev ? Math.min(3, prev.step + 1) : 2, b, brief: "", cap };
    if (st.ui !== "home") go("home"); else render();
  }
  async function retryBlocked(way, auto = false) {
    const b = st.blocked; if (!b || b.retrying) return;
    if (way !== "brief") st.blocked = { ...b, retrying: true, brief: "" };   // 기다리는 동안 카드를 감춰 두 번 누르지 않게
    let r; try { r = await (await fetch("/api/task/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ at: b.at, way, ...(auto ? { auto: true } : {}) }) })).json(); } catch { r = { ok: false, reason: "서버에 닿지 않았어요" }; }
    if (!r || !r.ok) {
      const cap = !!(r && r.why === "cap");
      if (b.stall && !cap) { st.blocked = null; watchTask({ at: b.at }, b.kind); } else st.blocked = { ...b, stall: false, ...(cap ? { cap: true } : {}) };   // 상한이면 직접 하기 · 그만두기만(멈춘 일이어도 — 직접 하기 글은 멈춘 일에서도 된다)   // 멈춤에서 온 다시 맡기기가 안 되면 지켜보기로 돌아간다(엉뚱한 '0번 막힘' 카드를 남기지 않게)
      render(); return say((r && r.reason) || "다시 맡기지 못했어요");
    }
    if (way === "brief") { st.blocked = { ...b, brief: r.brief || "" }; return render(); }
    watchTask(r.task, b.kind);
    render();
    say(b.step === 1 ? "허락을 못 받아 막혔어요 — 허락 카드를 다시 띄울게요. 카드가 뜨면 '허용'을 눌러 주세요"
      : way === "files-only" ? "명령 없이 파일만 만들도록 다시 맡겼어요 — 카드가 뜨면 '허용'을 눌러 주세요" : "다시 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요");
  }
  function endBlocked(msg, why) { const b = st.blocked; st.blocked = null; twStop(); const h = b && TASK_END[b.kind]; if (h && h.stop) h.stop(why); render(); say(msg); }
  const askWhy = (a) => (a.deny ? "허락 카드에서 '거절'을 눌렀어요" : a.none ? "허락 카드에 답이 없었어요(90초 안에 못 누름)" : a.allow ? "허용한 뒤에도 다른 일이 막혔어요" : "허락 카드가 뜨지 않았어요");
  function momentBlocked() {
    const b = st.blocked, k = b.b, kinds = k.kinds.map((x) => `${x.what} ${x.n}`).join(" · ") || "도구", meta = `<span class="mm-stage">맡긴 일 · 막힘</span>`;
    if (b.brief) return { tone: "blue", mood: "look", meta, title: "직접 하기 — 이 글을 Claude Code에 붙여 넣어요",
      sub: "그 폴더에서 Claude Code를 열고 아래 글을 붙여 넣어요. 허락은 Claude Code가 직접 물어요 — 플로로는 진행을 따라가요.",
      body: `<textarea class="mc-input brief" readonly rows="6" aria-label="맡길 글">${esc(b.brief)}</textarea>`,
      acts: [{ label: "글 복사", act: "blocked-copy", key: "Enter", pri: true }, { label: "다 했어요", act: "blocked-done", kind: "ghost" }] };
    const files = k.kinds.some((x) => x.what === "파일 쓰기"), cmd = k.kinds.some((x) => x.what === "명령");
    if (b.cap) return { tone: "amber", mood: "think", meta, title: `다시 맡기기는 2번까지예요 — ${esc(kinds)}`, sub: `${esc(askWhy(k.asks))}. 여기서부터는 직접 이어 가거나 그만둬요.`,
      acts: [{ label: "직접 하기", act: "blocked-self", key: "Enter", pri: true }, { label: "그만두기", act: "blocked-stop", kind: "ghost" }] };   // C-50 상한
    if (b.step >= 3) {   // ③ 까닭과 가장 가까운 길 — 명령만 막혔으면 '명령 없이 파일만'이 먼저
      const why = [files ? "파일 쓰기가 막혀 파일이 생기지 않았어요" : "", cmd ? "명령이 막혀 실행 · 시험을 못 했어요" : "", askWhy(k.asks)].filter(Boolean).join(" · ");
      const near = cmd && !files;
      return { tone: "amber", mood: "think", meta, title: `또 막혔어요 — ${esc(kinds)}`, sub: `${esc(why)}. 원하는 결과에 가장 가까운 길을 골라 주세요.`,
        acts: [...(near ? [{ label: "명령 없이 파일만 만들기", act: "blocked-files", key: "Enter", pri: true }] : []), { label: "한 번 더 — 카드를 꼭 눌러요", act: "blocked-again", ...(near ? {} : { key: "Enter", pri: true }) },
          { label: "직접 하기", act: "blocked-self" }, { label: "그만두기", act: "blocked-stop", kind: "ghost" }] };
    }
    return { tone: "amber", mood: "think", meta, title: `허락을 못 받아 ${k.count}번 막혔어요`, sub: `${esc(kinds)} — ${esc(askWhy(k.asks))}. 일은 끝났지만 막힌 것은 하지 못했어요.`,
      acts: [{ label: "다시 맡기기", act: "blocked-again", key: "Enter", pri: true }, { label: "직접 하기", act: "blocked-self" }, { label: "그만두기", act: "blocked-stop", kind: "ghost" }] };
  }
  // ── FR-17 대화로 일 넘기기 · 섬에서 허용 · 거절(C-4, 2026-10-20 — 이재엽 버튼 "섬에서 진짜 승인" · "허락하면 세션이 진행하는 내용을 오버레이에서도") ──
  // 할 일 적기 → 요구 문장으로 정리(진짜 AI면 /api/task/tidy, 연습이면 navigator.js taskLines) → 사람이 고쳐 확정 → 허락하고 넘기기(/api/task/start — 서버가 연결한 폴더에서 claude를 연다).
  // 연습 · 서버 없이(FR-10)는 넘기지 않고 예시 승인 카드를 보인다
  function taskBox() {
    const t = st.task;
    if (t.sent) return `<div class="tbox sent"><b>넘겼어요 — ${esc(t.sent)}</b><p class="meta">진행은 아래에 한 줄씩 쌓여요. 파일을 고치거나 명령을 쓰기 전에 허락을 구하면 위에 카드가 떠요.</p><div class="row"><button type="button" class="btn" data-act="task-reset">다른 일 적기</button></div></div>`;
    if (t.lines) return `<div class="tbox"><b>요구 문장으로 정리했어요 — 고쳐서 확정해요</b>
      <textarea class="mc-input" data-act="task-lines" rows="4" aria-label="요구 문장">${esc(t.lines.join("\n"))}</textarea>${t.say ? `<p class="meta">${esc(t.say)}</p>` : ""}
      <div class="row"><button type="button" class="btn pri" data-act="task-send">허락하고 넘기기</button><button type="button" class="btn" data-act="task-reset">그만두기</button></div></div>`;
    return `<div class="tbox"><label class="kicker" for="task-text">할 일 적기 — Claude Code에 시킬 일</label>
      <textarea id="task-text" class="mc-input" data-act="task-text" rows="2" placeholder="예) 회원 신청 화면 만들고 마감 알림도 넣어 줘">${esc(t.text)}</textarea>
      <div class="row"><button type="button" class="btn pri" data-act="task-tidy" ${t.text.trim() ? "" : "disabled"}>요구 문장으로 정리</button><span class="meta">정리 → 고치기 → 허락하면 Claude Code가 이어서 해요</span></div></div>`;
  }
  // C-38 시험판(2026-10-25) — MCP로 이은 AI의 제안: 퀘스트 시작(floe_start, kind "start") · 할 일에 적을 한 줄(floe_report). 사람이 "맞아요"를 눌러야 시작되거나 적히고, 판정은 그 뒤 평소대로
  let proposals = [];
  const proposalsHTML = () => (!proposals.length ? "" : `<div class="aplist" role="region" aria-label="웹 AI의 제안">${proposals.map((p) => { const go = p.kind === "start"; return `<section class="ap" data-pr="${esc(p.id)}"><div class="row ap-h">${I.look}<b class="grow">${go ? "웹 AI가 이 글로 퀘스트를 시작하자고 해요" : `웹 AI가 ${esc(ROMAN(p.todo))} '${esc(QU.shortOf(p.name))}'에 이렇게 적자고 해요`}</b></div>
      <p class="ap-what">${esc(p.text)}</p><div class="row"><button type="button" class="btn pri" data-act="pr-ok" data-id="${esc(p.id)}">${go ? "맞아요, 시작해요" : "맞아요, 적어요"}</button><button type="button" class="btn" data-act="pr-no" data-id="${esc(p.id)}">아니요</button></div></section>`; }).join("")}</div>`);
  async function pollProposals() {
    postState();   // 켜자마자(퀘스트가 없어도) 서버가 알게 — 바뀌었을 때만 보낸다
    let j;
    try { j = await (await fetch("/api/proposals", { credentials: "same-origin" })).json(); } catch { return; }
    if (!j || !j.ok || !Array.isArray(j.items)) return;
    const was = proposals.map((p) => p.id).join();
    proposals = j.items;
    if (proposals.map((p) => p.id).join() === was) return;
    if (proposals.length && st.ui !== "home") { st.ping = "웹 AI가 퀘스트에 적자고 해요 — 눌러서 볼까요?"; peek(); } else render();
  }
  async function decideProposal(id, ok) {
    const p = proposals.find((x) => x.id === id); if (!p) return;
    proposals = proposals.filter((x) => x.id !== id);
    try { await fetch("/api/proposals/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), credentials: "same-origin" }); } catch {}
    const q = st.quest;
    if (!ok) { render(); return say(p.kind === "start" ? "시작하지 않았어요" : "적지 않았어요"); }
    if (p.kind === "start") {   // floe_start — 섬 채팅에 처음 한 줄을 보낸 것과 같은 길(startDraft). 그사이 퀘스트가 생겼으면 하지 않는다
      if (q || st.j || !QU) { render(); return say("이미 퀘스트가 있어 시작하지 않았어요"); }
      logMsg("floro", `웹 AI가 건넨 글로 퀘스트를 시작해요 — ${esc(p.text.length > 200 ? `${p.text.slice(0, 200)}…` : p.text)}`);
      return startDraft(p.text);
    }
    if (!q || q.phase !== "quest" || q.chap !== p.chap || !q.objs[p.todo]) { render(); return say("지금 퀘스트와 맞지 않아 적지 않았어요"); }
    logMsg("floro", `웹 AI의 제안을 ${esc(ROMAN(p.todo))}에 적었어요 — ${esc(p.text)}`);
    fillNow(p.text, undefined, p.todo);
  }
  if (canLive) setInterval(pollProposals, 2000);
  // 기다리는 승인 요청(approve.js 카드) — 서버가 2초마다 알려 준다. 연습 · 주소 &approve=1이면 예시 카드
  let approvals = [], apMode = "none", apKnown = new Set();
  const approvalsHTML = () => (!approvals.length ? "" : `<div class="aplist" role="region" aria-label="허락이 필요해요">${apMode === "example" ? `<p class="note" role="status">예시 데이터예요 · 시연용</p>` : ""}${approvals.map(apCard).join("")}</div>`);
  function apCard(a) {
    const c = a.card || {}, sure = st.apSure === a.id, lines = Array.isArray(c.lines) ? c.lines : [];
    return `<section class="ap${c.danger ? " danger" : ""}" data-ap="${esc(a.id)}"><div class="row ap-h">${I.look}<b class="grow">${esc(toolName(a.tool))}가 허락을 기다려요</b><span class="meta">${esc(a.project || "")}</span></div>
      <p class="ap-what"><b>${esc(c.verb || "")}</b> · ${esc(c.what || c.tool_name || "")}</p>${lines.length ? `<pre class="ap-lines">${lines.map(esc).join("\n")}</pre>` : ""}${
      c.danger ? `<p class="ap-danger">⚠ ${esc(c.danger)}${sure ? " — 정말 허용할까요?" : ""}</p>` : ""}
      <div class="row"><button type="button" class="btn pri" data-act="ap-allow" data-id="${esc(a.id)}">${sure ? "정말 허용" : "허용"}</button><button type="button" class="btn" data-act="ap-deny" data-id="${esc(a.id)}">거절</button>${sure ? `<button type="button" class="btn" data-act="ap-unsure">아니요</button>` : ""}</div></section>`;
  }
  async function decideApproval(id, decision) {
    const a = approvals.find((x) => x.id === id); if (!a) return;
    if (decision === "allow" && a.card && a.card.danger && st.apSure !== id) return set({ apSure: id });   // 되돌리기 어려운 일 — 한 번 더 묻는다
    const sure = st.apSure === id; st.apSure = "";
    approvals = approvals.filter((x) => x.id !== id);
    if (apMode !== "live") { say(decision === "allow" ? "연습이라 실제로 허용하지는 않았어요" : "연습이라 실제로 거절하지는 않았어요"); return render(); }
    render();
    try {
      const r = await (await fetch("/api/approvals/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, sig: a.sig, decision, sure }) })).json();
      say(r && r.ok ? (decision === "allow" ? "허용했어요 — Claude Code가 이어서 해요" : "거절했어요") : (r && r.reason) || "보내지 못했어요");
    } catch { say("서버에 연결하지 못했어요 — Claude Code가 터미널에서 물어요"); }
    pollApprovals();
  }
  // 서버에 기다리는 승인 요청이 있나 — 새 요청이 오면 한 줄로 알리고(접혀 있으면 살짝), AI 진행 판을 보이게
  async function pollApprovals() {
    if (!canLive || apMode === "example") return;
    let j;
    try { j = await (await fetch("/api/approvals", { credentials: "same-origin" })).json(); } catch { return; }
    if (!j || !j.ok || !Array.isArray(j.items)) return;
    const before = approvals.map((a) => a.id).join(), fresh = j.items.filter((a) => !apKnown.has(a.id));
    apMode = "live"; approvals = j.items.filter((a) => st.apSure !== a.id || true); st.apWait = approvals.length > 0;
    for (const a of j.items) apKnown.add(a.id);
    if (fresh.length) {
      // 허락 카드는 채팅의 지금 말 위에(C-35, 2026-10-24 — 오버레이가 일하는 자리). AI 진행 판을 보고 있으면 거기에도 있으니 그대로, 다른 판은 닫는다
      st.place = "base"; if (st.pane !== "ai") st.pane = "";
      // F-69(2026-10-28): 접혀 있어도(알약 · 숨김) 펼친다 — 전에는 알약에 한 줄(ping)만 떠서 90초 안에 못 누르면 일이 허락 없이 막혔다
      activity(); if (st.ui !== "home") go("home"); say(`${toolName(fresh[0].tool)}가 허락을 기다려요 — 채팅의 카드를 봐 주세요`);
    }
    if (approvals.map((a) => a.id).join() !== before && st.ui === "home") render();
  }
  if (canLive) setInterval(pollApprovals, 2000);
  if (st.plan && FP && FP.running(st.plan)) setTimeout(() => { const id = FP.running(st.plan), w = st.plan.work && st.plan.work[id]; if (planLive() && w && Number.isFinite(w.at)) watchTask({ at: w.at }, "plan"); else st.plan = FP.failed(st.plan, id); }, 0);   // 다시 켰는데 맡김 중인 줄이 있으면 서버에 다시 묻는다(연습이면 다시 맡길 수 있게)
  // 섬(C-22): 위 줄 + [설정 판 | 알림 · AI 진행 판 | 채팅]. 퀘스트 창은 섬 옆에(.nav.side — 가로로 나란히): side의 반대쪽
  // inCol — 작업실 옆 칸 안의 섬(C-62, 2026-10-29): 위 줄(.tb)은 그리지 않는다 — 집 · 설정 · 열어 두기 · 접기는 작업실 머리 줄의 섬 단추 묶음(hisl)에
  function islandHTML(enter, inCol = false) {
    const body = st.settings && QU && !st.qwin ? settingsPane() : st.pane ? basePane(st.pane) : chatCard(momentToday());
    const isl = `<div class="isl${enter}">${inCol ? "" : topbar()}<div class="isl-body">${body}</div>${gachaHTML()}</div>`;
    if (WINS || !st.qwin || inCol) return isl;   // 앱: 작업실은 따로 뜬다(syncWins). inCol이면 섬만(아래 격자가 부른다)
    return `<div class="wsx">${qwinHTML()}<div class="isl-col side-right narrow${islBig() ? " center" : ""}">${islandHTML(enter, true)}</div></div>`;   // 브라우저 판: 앱 창(win.html #root)과 같은 격자 — 머리 줄 한 줄 아래 작업실 판 · 섬 옆 칸
  }
// ━━ app/80-island.js ━━
  // ── 앱의 옆 창 둘(C-22): 섬이 창의 내용을 그려 보내고, 창의 누름은 돌아온다(win.js). 열림 · 닫힘 · 내용이 바뀐 것만 보낸다 ──
  const winOpen = { settings: false, quest: false }, winHtml = { settings: "", quest: "" };
  let winClosing = { settings: false, quest: false };   // 내가 닫는 중(자리를 바꿀 때) — 창의 '닫힘' 알림으로 상태를 끄지 않게
  const winSize = (kind) => (kind === "quest" ? null : [Math.round(380 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui-scale")) || 1)), 760]);
  // 작업실에 보내는 것 = 작업실 판(qwinHTML) + 섬의 옆 칸(.isl-col — 플로로 · 채팅 · 판, C-41 ⑤). 자리(side-…) · 좁은지(narrow — 옆 자리)는 class로, 칸의 크기는 작업실(win.js)이 갖는다
  // C-46 R-2(2026-10-27 이재엽 버튼 "펼치면 비킴 · 접으면 알약" · "고른 가장자리에" · 세로 알약 · 설정의 시간대로): 섬이 접혀 있으면(petit · hidden) 옆 칸은 그 가장자리의 알약(folded — 왼쪽 · 오른쪽은 세로)이고 작업실이 넓어진다(win.js · win.html).
  //   알약을 누르면(ACT pill) 펼쳐지고 작업실이 비킨다. 알릴 일(허락 카드 · 보고 · 질문 · 오류)은 peek · alert로 저절로 펼친다(peek는 앱의 작업실 안이면 home으로). 저절로 접히기는 설정 '접히기까지' 그대로(pinned에서 st.qwin을 앱에서는 빼서) — 단 옆 칸에 마우스가 있거나 글을 쓰는 중(colHover · colTyping)이면 안 접히고, 접힌 알약은 더 접히지 않는다
  const colFolded = () => st.ui === "petit" || st.ui === "hidden";
  // C-61 섬 자리(2026-10-29): 그 단계의 칸이 하나도 적히지 않았거나 관문에서 물을 때, 섬이 펼쳐져 있으면 작업 칸 전체(center). 사람이 [칸 n개에 적기]를 누르면 옆 칸으로 — AI의 판단으로는 옮기지 않는다. 머리 줄의 '크게 · 옆으로'로 직접도
  //   1단계 시작(퀘스트 전)도 작업실 안이면 가운데 — 두승현 2026-10-29 "반드시 1단계 화면이 나오도록". 초안이 있는 장은 전처럼 옆(같은 날 두승현: 1단계에만). 떠 있는 섬(주소 장면 · 알림)은 그대로
  const bigAuto = () => !!(QU && ((!st.j && !st.quest && st.qwin) || (st.quest && st.quest.phase === "quest" && !st.quest.draft && !st.quest.objs.some((_, i) => QU.filled(st.quest, i)))));   // 관문 · 새 단계 시작의 '다시 가운데'는 기획안 9절 미정 — 사람이 머리 줄 단추로
  const islBig = () => (st.islBig == null ? bigAuto() : !!st.islBig);
  const islCol = () => `<div class="isl-col side-${side} ${side === "left" || side === "right" ? "narrow" : "wide"}${!colFolded() && islBig() ? " center" : ""}${colFolded() ? " folded" : ""}${colFolded() && st.boot ? " has-bub" : ""}">${colFolded() ? pillHTML() + bootBubble() : islandHTML("", true)}</div>`;
  // C-55(2026-10-28 이재엽 버튼 "접힌 알약 + 말풍선"): 켤 때 알약 옆 말풍선 — 시간대 인사 한 줄(하루 한 번) · 멈춘 곳(단계 · 지금 칸) · 섬 펼치기 / 나중에. 몇 초 뒤(greet.js BUBBLE_MS) 사라진다
  const bootBubble = () => {
    if (!st.boot || !colFolded()) return "";
    const s = st.j && stage();
    const now = s ? `멈춘 곳: ${LB(s.n)} ${esc(s.title)} · 지금: ${esc(tick().now)}` : "시작 전이에요 — 무엇을 만들지부터 같이 정해요";
    return `<div class="hello-bub" role="status" aria-live="polite">${st.boot.greet ? `<b class="hb-hi">${esc(C.greeting(new Date().getHours()))}</b>` : ""}<span class="hb-now">${now}</span>
      <div class="hb-acts"><button type="button" data-act="pill">섬 펼치기</button><button type="button" class="ghost" data-act="boot-later">나중에</button></div></div>`;
  };
  function syncWins() {
    if (!WINS || !QU) return;
    for (const [kind, on, html] of [["quest", st.qwin, st.qwin ? qwinHTML() + islCol() : ""]]) {
      if (on && !winOpen[kind]) { winOpen[kind] = true; winHtml[kind] = html; window.floeApp.openWin(kind, { side, size: winSize(kind), html, place: true }); }
      else if (!on && winOpen[kind]) { winOpen[kind] = false; winHtml[kind] = ""; winClosing[kind] = true; window.floeApp.closeWin(kind); }
      else if (on && html !== winHtml[kind]) { winHtml[kind] = html; window.floeApp.sendWin(kind, html); }
    }
  }
  if (WINS) {
    window.floeApp.onWinClosed((kind) => {
      if (winClosing[kind]) { winClosing[kind] = false; return; }   // 내가 닫은 것
      winOpen[kind] = false; winHtml[kind] = "";
      if (kind === "quest" && st.qwin) closeQwin();
    });
    window.floeApp.onWinEvent((p) => winEvent(p));
  }
  // 창에서 온 누름 · 바뀜 · 입력 · Esc — 섬의 같은 손잡이(clickAct · bvClick · onChange · onInput)로. 창의 요소 대신 그 요소의 data · 값만 온다
  function winEvent(p) {
    if (!p || typeof p !== "object") return;
    activity();
    const el = { dataset: p.data && typeof p.data === "object" ? p.data : {}, value: p.value, checked: !!p.checked, tagName: p.tag || "BUTTON", classList: { contains: (c) => c === "ghost" && !!p.ghost }, disabled: false, focus() {} };
    if (p.type === "click") { if (p.bv) return bvClick(el); return clickAct(el); }
    if (p.type === "change") return onChange(el);
    if (p.type === "input") { if (st.ui === "home" && timer) { clearIdle(); scheduleIdle(); } return onInput(el); }   // 글을 치는 동안 접히는 시계를 되돌린다(C-46)
    if (p.type === "key" && p.key === "Enter" && p.act === "say") return send();   // 작업실 옆 칸의 채팅 입력에서 Enter(C-41 ⑤) — 섬의 채팅 칸과 같이 보내기
    if (p.type === "key" && p.key === "s" && p.mod) { if (st.qtab === "file") ACT.fsave(); return; }   // 작업실 창의 ⌘/Ctrl+S(C-43)
    if (p.type === "caret") { caretLine = Number(p.line) || 0; return; }
    if (p.type === "toggle") { st.fnAll = !!p.open; return; }   // 작업실 창의 '전체 파일' 접고 펼침(C-63) — 다시 그려도 그대로
    // 글 칸의 줄 위치(C-53 상태 줄) — 다시 그리지 않는다(치는 동안 글 칸이 흔들리지 않게), 다음 그릴 때 보인다
    // 작업실 창에서 움직이거나 누르면(poke — win.js가 1초에 한 번까지, 섬이 펼쳐져 있을 때만) 접히는 시계를 처음부터(임유정 2026-10-28)
    if (p.type === "poke") { if (st.ui === "home" && timer) { clearIdle(); scheduleIdle(); } return; }
    // 옆 칸에 마우스를 올리거나 글을 쓰는 동안은 접히지 않는다(C-46) — 떠나면 접히는 시계를 다시 센다
    if (p.type === "col") { if (typeof p.hover === "boolean") { colHover = p.hover; if (p.hover) clearIdle(); else scheduleIdle(); }   // 들어오면 시계를 멈추고 나가면 다시 센다(접히기 전 표시는 2026-10-29 두승현 결정으로 뺐다)
    if (typeof p.typing === "boolean") { colTyping = p.typing; if (!p.typing) scheduleIdle(); } return; }
    // Esc — 옆 칸이 펼쳐져 있으면 먼저 접고(알약), 접혀 있으면 작업실을 닫는다(C-46, 새 맥락 리뷰 — 접기 단추의 '(Esc)'와 맞춤)
    if (p.type === "key" && p.key === "Escape") { if (p.kind === "quest" && st.qwin && st.settings) return set({ settings: false }); if (deskKeys.Escape && st.ui === "home" && p.kind === "quest") return run(deskKeys.Escape); if (p.kind === "quest" && st.qwin) { if (!colFolded()) return go("petit"); return closeQwin(); } }
  }
  // ── 섬의 움직임(C-14, 2026-10-20 — 규칙 · 숫자는 morph.js) ──
  // 바탕(배경 · 그림자)을 가진 요소 — 섬(.isl) · 한 줄(.pill) · 띠(.strip — 바탕 없음)
  const shapeEl = () => { const el = $nav.querySelector(":scope > .isl, :scope > .wsx .isl") || $nav.querySelector(":scope > :not(.shell):not(.win):not(.wsx)"); return el ? (el.classList.contains("isl") ? el : el.querySelector(".pill, .strip") || el) : null; };
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
    // F-45(2026-10-20): 기준점은 섬의 위 가운데 — 전 상자와 새 상자의 가운데를 맞춘다. 창이 커지고 줄며 섬이 창 안에서 옮겨 가도(가운데 맞춤) 화면에서는 같은 자리라, 잰 x 대신 가운데로 계산한다.
    //   설정 창이 옆에 열린 때(side — 왼쪽 고정)는 잰 그대로. 커질 때는 창을 먼저 키운다(morph.js plan "resize-then-animate" — 전에는 움직임이 먼저 시작돼 한 번 튀었다)
    const from = $nav.classList.contains("side") ? prev : { ...prev, x: to.left + (to.width - prev.w) / 2 };
    if (p.order === "resize-then-animate" && !morphHold) measureSize();
    const f = MO.flip(from, { x: to.left, y: to.top, w: to.width, h: to.height }), cs = getComputedStyle(el), nr = $nav.getBoundingClientRect();
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
    deskKeys = {};
    document.documentElement.classList.toggle("ws-away", WINS && !!st.qwin);   // 앱: 작업실이 열린 동안 섬은 작업실 옆 칸에 — 섬 창은 숨기 전 첫 그림부터 보이지 않게(F-101 켤 때 깜박임)
    if (st.ui === "hidden") { $nav.innerHTML = stripHTML(); }
    else if (st.ui === "petit") $nav.innerHTML = !WINS && st.qwin ? `<div class="wsx">${qwinHTML()}<div class="isl-col side-right narrow folded${st.boot ? " has-bub" : ""}">${pillHTML()}${bootBubble()}</div></div>` : `<div class="${enter.trim()}">${pillHTML()}${bootBubble()}</div>`;   // 브라우저 판(C-55): 켤 때 작업실이 열린 채 알약이면 작업실 판도 함께(앱은 창으로 — syncWins)
    else $nav.innerHTML = islandHTML(enter);
    $nav.classList.toggle("side", !!$nav.querySelector(":scope > .win, :scope > .wsx"));   // 창(설정 · 퀘스트)이 열리면 섬 옆에 나란히(C-22) — 아래에 열리면 글자를 키웠을 때 바로 안 보였다(6.2.0)
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
    return h + `<div class="card"><div class="proj">${ring()}<div><div class="meta">${esc(project())}</div><div class="big" style="font-size:18px">${LB(s.n)} · ${esc(s.title)}</div></div></div>
      ${seg()}<span class="meta">전체 8단계 중 ${s.n + 1}번째 단계예요</span></div>${notes()}${focusCard()}<div class="card">${more()}</div>`;
  }
  const phoneMap = () => phoneHead("전체 8단계", "단계 지도") + mapBody();
  function phoneCheck() {
    const s = stage(), [body, actions] = checkStep();
    return `<button class="back" data-act="close-gate">${I.back}오늘</button>
      <div class="ph-head">${cat(face()[0], 64)}<div><div class="t">${LB(s.n)}를 다 했어요!</div><div class="meta">넘어가기 전에 함께 확인해요${st.mode === "fixture" ? " · 연습용 예시" : ""}</div></div></div>
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
  $nav.addEventListener("toggle", (e) => { if (e.target && e.target.classList && e.target.classList.contains("fn-all")) st.fnAll = !!e.target.open; }, true);   // 브라우저 판의 '전체 파일'(C-63)

  // 설계도 글 칸은 글 길이만큼 늘어난다 — 확정한 뒤 보기(pre)와 같은 크기로. 섬 전체가 화면 높이를 넘으면 섬 안에서 스크롤 (2026-10-18 임유정 요청)
  function grow(t) { const y = t.closest(".isl")?.scrollTop; t.style.height = "auto"; t.style.height = `${t.scrollHeight + 2}px`; if (y !== undefined) t.closest(".isl").scrollTop = y; }
  // 선택지를 누르고 → 살펴보는 중 → 결과까지는 한 흐름이라 섬 크기를 그대로 둔다. 결과가 나오면 새 크기로 한 번만 부드럽게 바뀐다
  // (2026-10-18 임유정 요청: 이어지는 과정에서 크기가 계속 바뀌어 정신없음)
  let holdH = 0;
  const hold = () => { const el = $nav.querySelector(".isl"); if (el && !holdH) holdH = el.offsetHeight; };
  function holdSize() {
    const el = $nav.querySelector(".isl");
    if (!holdH || !el) return;
    // holding: 붙든 높이에서 칩이 빠진 만큼을 채팅 칸이 채운다 — 입력 칸 아래가 비어 보였다(임유정 2026-10-22, app.css .isl.holding)
    if (st.busy) { el.style.minHeight = `${holdH}px`; el.classList.add("holding"); return; }
    const from = holdH, to = el.offsetHeight; holdH = 0;
    // 앱 안에서는 높이 애니메이션을 하지 않는다 — 창은 바로 새 크기가 되는데 섬만 늦게 커져 "따라오는 게 버벅"으로 보였다(6.2.0)
    if (!STILL && !window.floeApp && Math.abs(to - from) > 4) el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  // 다시 그려도 쓰던 글 칸은 그대로 — 커서 자리와 스크롤까지 되돌린다
  // F-46(2026-10-20): 지금 모습을 html에 적어 둔다 — 띠로 접혀 있거나 창이 안 보일 때 물범의 무한 움직임을 멈춘다(app.css [data-ui="hidden"] · .page-hidden)
  document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("page-hidden", document.hidden));
  function render() {
    document.documentElement.dataset.ui = st.ui;
    save();
    if (!timer) scheduleIdle();
    // 같은 이름의 칸이 여럿이면(계획판의 줄마다 의견 · 물을 것마다 답 — 2026-10-24 리뷰) data-id · data-i까지 맞춰 그 칸으로 돌아간다
    const a = document.activeElement, keep = isField(a) && a.dataset.act ? `[data-act="${a.dataset.act}"]${a.dataset.id ? `[data-id="${CSS.escape(a.dataset.id)}"]` : ""}${a.dataset.i !== undefined ? `[data-i="${CSS.escape(a.dataset.i)}"]` : ""}` : "";
    const sel = keep ? [a.selectionStart, a.selectionEnd, a.scrollTop] : null;
    // 채팅 칸의 스크롤 — 다시 그리면 칸이 새로 생겨 맨 위로 간다. 1초마다 바뀌는 '살펴보고 있어요 16초' 때문에 올려 둔 스크롤이 계속 아래로 끌려갔다(임유정 2026-10-22)
    const og = $nav.querySelector("[data-log]");
    const logWas = og ? { top: og.scrollTop } : null;
    // 브라우저 판의 작업실 몸통(.qwin .wbody)도 같은 화면(data-view)이면 스크롤을 되돌린다 — 앱 창은 win.js가 하지만 브라우저 판은 아무도 안 해서, 마우스가 섬에 들어오기만 해도(mouseenter → render)
    //   받기 화면이 맨 위로 튀어 아래의 '고쳐 주세요'를 누를 수 없었다(e2e C-22 · C-36이 #212부터 깨져 있던 까닭, 2026-10-27) — claude-drafted: 2026-10-27
    const ob = $nav.querySelector(".qwin .wbody"), bodyWas = ob ? { view: ob.dataset.view, top: ob.scrollTop } : null;
    const fvWas = fvScroll($nav.querySelector(".qwin .fv"));   // 파일 보기 안의 스크롤도(같은 파일 · 같은 보기일 때) — 다시 그리면 1줄로 돌아갔다(임유정 2026-10-28)
    const sideWas = WS_PANES.map((c) => { const e = $nav.querySelector(`.qwin ${c}`); return e ? e.scrollTop : null; });   // 파일 칸 · 오른쪽 칸 — 아래쪽 목차를 누르면 칸이 맨 위로 올라갔다(임유정 2026-10-28)
    if (isPhone()) renderPhone(); else { renderDesk(); holdSize(); fitGacha(); }
    const nb = bodyWas && $nav.querySelector(".qwin .wbody"); if (nb && nb.dataset.view === bodyWas.view) nb.scrollTop = bodyWas.top;
    if (CVP) CVP.apply($nav);
    fvScroll($nav.querySelector(".qwin .fv"), fvWas);
    WS_PANES.forEach((c, j) => { const e = $nav.querySelector(`.qwin ${c}`); if (e && sideWas[j] != null) e.scrollTop = sideWas[j]; });
    const go = $nav.querySelector(".qwin [data-go]"); if (go && go.dataset.go !== goShown) { goShown = go.dataset.go; const p = go.closest(".fv-code"); if (p) p.scrollTop = go.offsetTop - (p.clientHeight - go.offsetHeight) / 2; }   // 목차로 고른 제목 줄로 한 번만(ftoc-go) — 다음 그리기에서 다시 끌어가지 않게. 글 칸만 옮긴다(scrollIntoView는 바깥 칸 · 페이지까지 움직였다 — 새 맥락 리뷰)
    if (keep) {
      const b = document.querySelector(keep);
      if (b && b !== a) { b.focus(); try { b.setSelectionRange(sel[0], sel[1]); } catch {} b.scrollTop = sel[2]; }
    }
    if (point) C.follow(isPhone() ? $phone : $nav, point);
    for (const t of document.querySelectorAll("textarea.doc")) grow(t);
    // 채팅은 마지막 말이 보이게(C-22) — 단, 맨 아래를 따라가는 중(logPin)이거나 새 말이 왔을 때만. 위로 올려 읽는 중이면 그 자리 그대로
    const lg = $nav.querySelector("[data-log]");
    if (lg && chatSeq !== shownSeq) logPin = true;
    if (lg && !logWas) { lg.scrollTop = lg.scrollHeight; logTop.set(lg, lg.scrollTop); }
    else if (lg) { lg.scrollTop = logWas.top; logTop.set(lg, lg.scrollTop); if (logPin) lg.scrollTo({ top: lg.scrollHeight, behavior: STILL ? "auto" : "smooth" }); }
    shownSeq = chatSeq;
    goStage($nav);   // C-63 — 대화 목록의 바로가기를 눌렀으면 그 단계 구분선으로
    if (logRO) { logRO.disconnect(); if (lg) { logRO.observe(lg); if (lg.lastElementChild) logRO.observe(lg.lastElementChild); } }
    syncWins();
    refract();
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
  // 플로로의 한마디 — 2026-10-25(두승현): 머리 위에 떴다 사라지던 말풍선(.pop-say)을 뺐다. 안내 · 오류는 섬의 대화 기록에 플로로의 말로 남긴다
  //   (실패를 숨기지 않는다 — security-records.md 6-1). 쓰다듬기 · 졸기 · 축하 같은 꾸밈 말은 부르지 않는다. ponytail: 휴대폰 화면은 대화 기록이 없어 보이지 않는다(PC 먼저)
  function say(text) { if (!text) return; logMsg("floro", esc(text)); saidSince += 1; requestAnimationFrame(render); }
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
      if (host && !STILL) C.burst(...center(host), "star", 14, 360);
      setTimeout(render, 1800);   // 위쪽 줄의 하트를 새로
    }
  }
  // 축하 — 할 일을 다 했을 때, 단계를 넘어갔을 때, 설계도를 확정했을 때
  const CHEER = { done: "와, 할 일을 다 했어요!", doc: "문서 확정! 멋져요", finish: "끝까지 왔어요! 정말 멋져요" };
  function celebrate(kind) {
    requestAnimationFrame(() => {
      const host = liveCat();
      flash("happy", 1800);
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
  // 채팅의 따라가기(logPin, F-58-3) — 맨 아래에 닿으면 다시 따라가고, 위로 올라가면 멈춘다.
  //   앱이 내리는 스크롤(부드러운 내려가기 · 다시 그린 칸의 자리 되돌리기 · 커진 뒤 붙이기)은 늘 아래로만 가므로, 위로 가는 스크롤은 사람이 한 것이다 —
  //   휠 · 터치 · 스크롤바 · 키보드 무엇으로 올려도 같다. 전에는 휠 · 터치 · 스크롤바만 봐서 키보드로 올리면 다시 끌려 내려갔다(새 맥락 리뷰, 2026-10-25) — claude-drafted: 2026-10-25
  $nav.addEventListener("scroll", (e) => {
    const l = e.target;
    if (!(l instanceof Element) || !l.matches("[data-log]")) return;
    const was = logTop.get(l); logTop.set(l, l.scrollTop);
    if (l.scrollHeight - l.scrollTop - l.clientHeight < 2) logPin = true;
    else if (was !== undefined && l.scrollTop < was - 1) logPin = false;
  }, true);
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
    if (was === "sleep") { flash("wow", 900); } else applyMood();
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
  }, 3000);

// ━━ app/85-ai.js ━━
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
    if (allDone()) { view("alert"); if (!was) return celebrate("done"); } else peek();
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

// ━━ app/90-acts.js ━━
  // ── 누르기 — data-act 이름 → 할 일. (i: data-i, el: 누른 것) ──
  const set = (patch) => { Object.assign(st, patch); render(); };
  // 헷갈린 곳 고르기/빼기 (PC 단추·iPhone 체크 상자)
  const toggleHard = (i, on = !st.hard.includes(i)) => set({ hard: on ? [...new Set([...st.hard, i])].sort() : st.hard.filter((x) => x !== i) });
  const ACT = {
    strip: () => view("enter"),
    open: () => view("click"),
    pin: () => { clearIdle(); set({ userPin: !st.userPin }); say(st.userPin ? "여기 열어 둘게요" : "이제 잠시 뒤 작게 접힐게요"); },
    pill: () => (QU && !st.qwin ? (openQwin("canvas"), render()) : st.ui === "hidden" ? go("home") : view("click")),   // 작업실 밖의 알약은 누르면 바로 작업실(섬은 접힌 알약 그대로 — 두승현 2026-10-29). 작업실 안의 알약은 어느 상태든 누르면 펼침(C-46, 새 맥락 리뷰)
    fold: () => go(colFolded() ? "home" : "petit"),   // 머리 줄의 접기 단추는 오고 가는 단추 — 알약이면 접기 전 모습으로(크게 · 옆으로는 st.islBig 그대로, F-100 임유정 2026-10-29). 섬 위 줄(tbRight)의 접기는 펼친 섬에만 보여 그대로 접기
    "boot-later": () => { st.boot = null; render(); },   // C-55 말풍선의 '나중에' — 말풍선만 사라진다(작업실 · 알약은 그대로)
    // C-53 작업실 세 칸 — 칸 접기(이 컴퓨터에 기억), 글 크기, 목차(오른쪽 칸 펼치기), 서식(브라우저 판 — 글 칸의 고른 자리에; 앱은 win.js가 창 안에서 같은 함수로 넣고 input으로 보낸다)
    "wnav-toggle": () => { wnavOpen = !wnavOpen; writeLS("floe:ws-nav", wnavOpen ? "1" : "0"); render(); },
    "wside-toggle": () => { wsideOpen = !wsideOpen; writeLS("floe:ws-side", wsideOpen ? "1" : "0"); render(); },
    fsize: (i, el) => { const f = st.openFiles[Number(el && el.dataset.i)]; if (!f) return; f.zoom = Math.round(Math.min(1.6, Math.max(0.8, (f.zoom || 1) + (el.dataset.v === "+" ? 0.1 : -0.1))) * 10) / 10; render(); },
    ftoc: () => { if (!wsideOpen) { wsideOpen = true; writeLS("floe:ws-side", "1"); } render(); },
    "ftoc-go": (i, el) => { const f = st.openFiles[st.fileSel]; if (!f) return; f.find = String((el && el.dataset.v) || "").slice(0, 60); if (f.kind === "md" && !f.edit) f.raw = true; f.go = f.edit ? null : { line: Number(el && el.dataset.line) || 0, seq: ++tocGo }; render(); },   // 그 절의 제목을 찾기 칸에 — 원문 보기에서 그 줄이 표시되고, 그 제목 줄로 스크롤(전에는 표시만 되고 옮기지 않았다 — 임유정 2026-10-28)
    ffmt: (i, el) => { const k = Number(el && el.dataset.v), f = st.openFiles[k], ta = $nav.querySelector(`.fv-edit[data-v="${k}"]`); if (!f || !ta || !MDV) return;
      const r = MDV.format(ta.value, ta.selectionStart, ta.selectionEnd, el.dataset.fmt); ta.value = r.text; f.text = r.text; f.dirty = f.text !== f.saved; render();
      const t2 = $nav.querySelector(`.fv-edit[data-v="${k}"]`); if (t2) { t2.focus(); t2.setSelectionRange(r.start, r.end); } },
    pet: () => pet("tap"),
    // 연습용은 바로 살펴보고, 진짜 AI 모드에서는 글만 넣어 둔다(보내는 건 사용자가 '어디쯤인지 보기'를 누를 때)
    ex: (i) => {
      st.text = S.examples[i].text; st.notice = ""; st.undo = [];
      if (st.mode === "fixture") return judge(true);
      render(); focusText(); say("예시 글을 넣었어요. 보내려면 '어디쯤인지 보기'를 눌러요");
    },
    judge: () => { if (refuse(mealWhy())) return; st.notice = ""; judge(false); },
    "fill-example": () => { set({ text: S.first.text, error: "", warn: null }); focusText(); },
    restart: () => { Object.assign(st, { j: null, finished: false, todos: null, hold: null, todoLater: [], results: {}, carryUse: {}, carryDone: false, ship: null, topic: "", prep: null, mapSel: null, codeless: null, linesDone: [] }); ACT.ex(S.examples.indexOf(S.first)); },
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
    "first-go": () => { treeChap = null; treeView = "flow"; openQwin("tree"); render(); say("한눈에 보기에서 그 칸을 찾아 채워요 — 지난 장의 칸은 '채우기'로 채팅에서 같이 적어요"); },   // C-56 먼저 → 갈 곳
    // F-70 코드 맡기기 — 5단계 뼈대 · 6단계 기능 줄(고르기 · 맡기기 · 닫기) · 돌려 보기 · 결과 파일 열기 · 6단계 코드 물음(A-04 예 · 아니요)
    "build-skeleton": () => buildGo("build", BUILD && BUILD.skeletonTask({ results: st.results, topic: st.topic })),
    "line-open": () => { st.linePick = true; render(); },
    "line-x": () => { st.linePick = false; render(); },
    "line-go": (i) => { const l = BUILD ? BUILD.features(st.results)[i] : ""; if (l) buildGo("line", BUILD.lineTask({ line: l, results: st.results, checksNote: checksNote() }), { line: l }); },
    "run-go": () => { st.runOut = null; buildGo("run", BUILD && BUILD.runTask()); },
    "run-done": () => { st.runOut = null; render(); },
    "result-open": (k) => { const f = st.runOut && st.runOut.files[k || 0]; if (!f) return; const i = st.files && st.files.list ? st.files.list.findIndex((x) => !x.dir && x.path === f.path) : -1; if (i < 0) return say("파일 목록에서 그 파일을 못 찾았어요 — 작업실을 다시 열어요"); openQwin("quest"); openFile(i); },
    "code-yes": () => buildGo("code", BUILD && BUILD.skeletonTask({ results: st.results, topic: st.topic, why: "code" })),
    "code-no": () => { st.codeless = { at: ymd() }; save(); if (st.quest) st.quest = applyStates(st.quest); render(); say("코드 없이 이 단계를 해요 — 결정 기록에 '코드 없이 지남'으로 남겨요"); },
    // C-50 멈춘 것 같을 때(A-06) — 더 기다리기(다음 단계까지 묻지 않음) · 멈추고 다시 맡기기 · 직접 하기(멈추고 맡길 글) · 멈추고 그만두기
    "stall-wait": () => { if (!st.stall) return; st.stall.wait = st.stall.lv; render(); say("더 기다릴게요 — 소식이 오면 알려 드려요"); },
    "stall-again": async () => { const s = await stallHalt(); if (!s) return; st.blocked = { at: s.at, kind: s.kind, step: 2, stall: true, b: { count: 0, kinds: [], asks: { allow: 0, deny: 0, none: 0 } }, brief: "" }; retryBlocked("again"); },
    "stall-self": async () => { const s = await stallHalt(); if (!s) return; st.blocked = { at: s.at, kind: s.kind, step: 2, stall: true, b: { count: 0, kinds: [], asks: { allow: 0, deny: 0, none: 0 } }, brief: "" }; retryBlocked("brief"); },
    "stall-stop": async () => { const s = await stallHalt(); if (!s) return; tw = null; const h = TASK_END[s.kind]; if (h && h.stop) h.stop("오래 조용해서 멈췄어요"); render(); say("멈췄어요 — 언제든 다시 맡길 수 있어요"); },
    // F-69 막힌 일(A-03) — 다시 맡기기 · 명령 없이 파일만 · 직접 하기(맡길 글) · 글 복사 · 다 했어요 · 그만두기
    "blocked-again": () => retryBlocked("again"),
    "blocked-files": () => retryBlocked("files-only"),
    "blocked-self": () => retryBlocked("brief"),
    "blocked-copy": async () => { const t = st.blocked && st.blocked.brief; if (!t) return; try { await navigator.clipboard.writeText(t); say("복사했어요 — Claude Code에 붙여 넣어요"); } catch { say("복사하지 못했어요 — 글을 골라 직접 복사해요"); } },
    "blocked-done": () => endBlocked("직접 해 보세요 — 그 폴더에서 Claude Code가 일하면 플로로가 진행을 따라가요", "직접 하기로 했어요"),
    "blocked-stop": () => endBlocked("그만뒀어요 — 언제든 다시 맡길 수 있어요", "허락을 못 받아 그만뒀어요"),
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
    "draft-fix": () => { render(); requestAnimationFrame(() => { const t = $nav.querySelector("[data-act=say]"); if (t) t.focus(); }); },
    "draft-who": (i) => { const w = QU.WHO[i]; if (w && st.quest && QU.curIdx(st.quest) === QU.WHO_AT) fillNow(`쓰는 사람: ${w[0]} — ${w[1]}`, "pick"); },
    "draft-pick": (i) => {   // 기획서로 키울지(2단계, C-37) — 고른 것이 그 줄. 플로로가 권한 것을 고르면 까닭도
      const q = st.quest, pk = q ? QU.pickOf(q, QU.curIdx(q)) : null, x = QU.DOC_PICKS[i]; if (!pk || !x) return;
      fillNow(`기획서: ${x[1]}${x[0] === pk.pick && pk.why ? ` — ${pk.why}` : ""}`, "pick");
    },
    // 문서 올리기(C-37) — 올리기 · 나중에(도전과제 지도에서 다시) · 확인 · 지도에서 열기
    "ship-go": () => shipGo(),
    "ship-public": () => shipGo(true),   // C-52 공개 저장소 — 저장소마다 처음 한 번
    // C-48 가져갈 것 — 8단계 초안(AI 한 번) · 채택 · 반려(까닭) · 보류, 단계에 들어서면 지난 프로젝트에서 가져온 것 고르기
    "carry-draft": async () => {
      if (!st.carry || st.carry.phase !== "offer") return;
      const r = await callAI("/api/carry/draft", { topic: st.topic || "", lessons: learnedList() });
      if (!r.ok) { render(); return say(r.reason || "초안을 만들지 못했어요"); }
      const tag = Date.now().toString(36);
      st.carry = { phase: "drafts", drafts: r.drafts.map((d, k) => ({ id: `c${tag}${k}`, text: d.text, why: d.why || "", stage: Number.isInteger(d.stage) ? d.stage : -1, review: d.review || "", from: Array.isArray(d.from) ? d.from : [] })), say: r.say || "" };
      st.tokens = r.tokens || 0; fetchUsage(); render();
    },
    "carry-adopt": (i) => carryDecide(i, "adopt"),
    "carry-hold": (i) => carryDecide(i, "hold"),
    "carry-reject": (i) => {
      const d = st.carry && st.carry.drafts && st.carry.drafts[i]; if (!d || d.state) return;
      if (!d.rejecting) { d.rejecting = true; return render(); }
      if (!String(d.reason || "").trim()) return say("버리는 까닭을 한 줄 적어 주세요 — 반려도 지우지 않고 남겨요");
      carryDecide(i, "reject", d.reason.trim());
    },
    "carry-from": (i, el) => { const d = st.carry && st.carry.drafts && st.carry.drafts[i], v = Number(el && el.dataset.v); if (!d || d.state || !N.STAGES[v]) return; d.from = d.from.includes(v) ? d.from.filter((x) => x !== v) : [...d.from, v].sort((a, b) => a - b); render(); },
    "carry-hold-rest": async () => { const C = st.carry; if (!C || !C.drafts) return; for (let k = 0; k < C.drafts.length; k++) if (!C.drafts[k].state) await carryDecide(k, "hold"); },   // 미루면 보류(지식 퀘스트 9절 2번) — 다음 프로젝트를 시작할 때 다시 묻는다
    "carry-later": () => set({ carry: null }),
    "carry-use": (i) => { const O = st.carryOffer, x = O && O.items[i]; if (!x) return; O.pick = O.pick.includes(x.id) ? O.pick.filter((y) => y !== x.id) : [...O.pick, x.id]; render(); },
    "carry-held-adopt": async (i) => {
      const O = st.carryOffer, x = O && O.held[i]; if (!x || x.saving) return;
      x.saving = true;
      const r = await carryPost({ action: "adopt", item: x, id: x.id });
      x.saving = false;
      if (!r.ok) return say(r.reason || "남기지 못했어요");
      O.held = O.held.filter((y) => y.id !== x.id);
      if (!O.items.length && !O.held.length) st.carryOffer = null;
      render(); say("채택했어요 — 다음 프로젝트부터 그 단계에서 보여요");
    },
    "carry-use-done": () => { const O = st.carryOffer; if (!O) return; st.carryUse = { ...st.carryUse, [O.n]: O.items.filter((x) => O.pick.includes(x.id)).map((x) => ({ id: x.id, text: x.text })) }; st.carryOffer = null; save(); render(); },
    "carry-use-none": () => { const O = st.carryOffer; if (O) st.carryUse = { ...st.carryUse, [O.n]: [] }; st.carryOffer = null; save(); render(); },
    // C-49 폴더의 기록 — 되살리기(이 브라우저에 기록이 없을 때) · 다시 읽기(낡음) · 나중에(다음에 열 때 다시)
    "restore-go": () => {
      const R = st.restore; if (!R || R.phase !== "offer") return;
      const d = R.data, nx = resumeStage(d.stages);
      st.results = Object.fromEntries(R.got.map((n) => [n, { chap: n, title: d.topic || "", ...d.stages[n].result }]));
      if (!st.topic && d.topic) st.topic = d.topic;
      if (!st.idea && d.idea) st.idea = d.idea;   // 처음 말한 것 — 되살리지 않으면 다음 올리기에서 기획서의 처음 말이 지워진다(새 맥락 리뷰)
      if (!st.source && d.source) st.source = d.source;
      const all = Object.entries(d.stages);   // 읽을 수 없는 문서(result null)도 — 사람 것으로 두고 덮지 않는다
      st.docPrints = { project: d.key || "", seen: Object.fromEntries(all.map(([n, x]) => [n, x.print])), wrote: Object.fromEntries(all.filter(([, x]) => x.lossless).map(([n, x]) => [n, x.print])), own: Object.fromEntries(all.filter(([, x]) => !x.lossless).map(([n, x]) => [n, x.print])), dirty: false };
      const t = tierOf(st.results[0]); if (t) st.tier = t;
      st.restore = null;
      if (nx > 0) resumeAt(nx);
      save(); render(); say(`${R.got.map((n) => LB(n)).join(" · ")} 기록을 폴더에서 되살렸어요.`);
      if (N.STAGES[nx]) carryLoad(nx);   // C-48
      if (QU && st.j && st.j.stage === nx && N.DRAFT_STAGES.includes(nx) && st.results[nx - 1]) stageDraft(nx); else if (st.j && st.j.stage === nx) questText();
    },
    "restore-read": () => {
      const R = st.restore; if (!R || R.phase !== "stale") return;
      const d = R.data, read = R.stale.filter((n) => d.stages[n].result && st.results[n]), P = DP(), wrote = { ...(P.wrote || {}) }, own = { ...(P.own || {}) };
      // 그 단계 기록을 폴더의 글로 바꾼다(문서에 없는 칸 — 제목 · 코드 없이 지남 — 만 남긴다). 사람이 칸을 비웠으면 비운 대로
      st.results = { ...st.results, ...Object.fromEntries(read.map((n) => { const old = st.results[n]; return [n, { chap: n, title: old.title, ...(old.nocode ? { nocode: true } : {}), ...d.stages[n].result }]; })) };
      for (const n of R.stale) { if (d.stages[n].lossless) { wrote[n] = d.stages[n].print; delete own[n]; } else { own[n] = d.stages[n].print; delete wrote[n]; } }   // 다시 써도 같은 글일 때만 Floe가 덮는다 — 아니면 그 문서는 사람 것(올릴 때 keep → kept)
      st.docPrints = { ...P, wrote, own, seen: { ...(P.seen || {}), ...Object.fromEntries(R.stale.map((n) => [n, d.stages[n].print])) }, dirty: !!read.length || !!P.dirty };
      st.restore = null;
      if (read.length && st.results[0] && st.results[1]) st.ship = { phase: "offer" };   // 그 글로 만든 기획서 · 결정 기록도 같은 파일에 고쳐 쓸지(새 파일을 쌓지 않는다)
      save(); render(); if (read.length) say(`${read.map((n) => LB(n)).join(" · ")} 기록을 폴더의 글로 다시 읽었어요.`);
    },
    "restore-later": () => {   // 새로 시작(되살리기를 고르지 않음)이면 이 폴더에서는 다시 묻지 않는다. 낡음 · 근거 없음은 다음에 열 때 다시
      const R = st.restore;
      if (R && R.phase === "offer") { st.docPrints = { project: R.data.key || "", wrote: {}, seen: {}, own: {}, declined: true }; save(); }
      set({ restore: null });
      if (R && R.phase === "offer") carryLoad(0);   // C-48 새로 시작 — 1단계에 가져온 것 · 보류한 것
    },
    "ship-later": () => { st.ship = null; render(); say("나중에 도전과제의 한눈에 보기에서 올릴 수 있어요"); },
    "ship-done": () => set({ ship: null }),
    "ship-peek": (i) => { if (st.ship) set({ ship: { ...st.ship, peek: st.ship.peek === i ? null : i } }); },   // 기획서 · 결정 기록 미리 보기(C-39) — 다시 그려도 펼친 채로(<details>는 다시 그릴 때마다 닫혔다)
    "ship-open": () => set({ ship: { phase: "offer" }, qfocus: "stage", pane: "" }),
    "draft-size": (i) => {
      const q = st.quest, k = QU.SIZE_KEYS[i]; if (!k || !q || !q.draft || QU.curIdx(q) !== QU.SIZE_AT) return;
      setTier(QU.SIZE_TIER[k]);
      fillNow(`크기: ${QU.SIZE_WORD[k]}${k === q.draft.size ? ` — ${q.draft.sizeWhy}` : ""}`, "pick");
    },
    "quest-ok": () => { const q = st.quest; if (!q || q.phase !== "draft") return; st.quest = { ...q, phase: "quest", edit: false, sel: 0 }; st.qtab = "quest"; render(); say("받았어요! 퀘스트 창이 공책으로 바뀌었어요"); },
    "quest-fix": () => { if (!st.quest) return; st.quest = { ...st.quest, edit: true }; openQwin("quest"); render(); say("퀘스트 창에서 이름과 할 일 수를 고친 뒤 '이대로 받기'를 눌러요"); },
    "quest-later": () => { closeQwin(); say("그럼 쉬어요. 다시 오면 여기서 이어서 해요"); },
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
      requestAnimationFrame(() => { const t = $nav.querySelector("[data-act=say]"); if (t) t.focus(); });
    },
    "plan-later": () => set({ qfocus: "stage" }),   // 나중에 · 단계 퀘스트로 — 계획 · 맡길 일은 그대로 남는다
    "plan-clear": () => set({ planDraft: "" }),
    "plan-sel": (i, el) => set({ planSel: (el && el.dataset.id) || "" }),   // 퀘스트 창의 맡길 일 목차 — 보기만
    qfocus: (i, el) => set({ qfocus: FP && el && el.dataset.v === "plan" ? "plan" : "stage", pane: "" }),   // 퀘스트 창의 '지금 할 퀘스트' — 채팅이 따른다
    // 한 줄만 적어 맡기기 — 전의 맡기기(FR-17): 적은 생각을 할 일 칸에 넣어 AI 진행 판에서 정리 → 고치기 → 허락
    "plan-direct": () => {
      if (!st.task.text.trim() && !st.task.lines && !st.task.sent) { const q = st.quest, t = q && QU ? QU.textOf(q, st.idea) : st.idea || ""; if (t.trim()) st.task.text = t.slice(0, 4000); }
      ACT["base-ai"](); requestAnimationFrame(() => { const t = document.getElementById("task-text"); if (t) t.focus(); });
    },
    "plan-make": () => makePlan(false),
    "plan-ok": (i, el) => { st.plan = FP.mark(st.plan, el && el.dataset.id, "ok"); save(); render(); },
    "plan-follow": (i, el) => {   // C-51 앞의 결정대로 — 그 줄을 고칠래요로 두고 의견을 채운다(다시 세우기에서 고친다)
      const id = el && el.dataset.id, x = st.plan && st.plan.plan.items.find((y) => y.id === id); if (!x || !x.diff || st.plan.confirmed) return;
      const old = (st.plan.notes[id] || "").trim(), add = `앞의 결정('${x.diff.was}')에 맞춰 고쳐 주세요`;   // 이미 적은 의견은 지우지 않고 뒤에 붙인다
      st.plan = FP.note(FP.mark(st.plan, id, "fix"), id, old.includes(add) ? old : old ? `${old} / ${add}` : add); save(); render();
    },
    "plan-fix": (i, el) => { st.plan = FP.mark(st.plan, el && el.dataset.id, "fix"); save(); render(); requestAnimationFrame(() => { const t = $nav.querySelector(`[data-act=plan-note][data-id="${el && el.dataset.id}"]`); if (t) t.focus(); }); },
    "plan-confirm": () => { if (!FP.canConfirm(st.plan)) return; st.plan = FP.confirm(st.plan); st.qfocus = "plan"; st.planSel = ""; if (qauto) openQwin("quest"); save(); render(); say("확정했어요! 퀘스트 창에 맡길 일이 생겼어요"); },
    "plan-again": () => revisePlan(),
    "plan-reset": () => { st.plan = null; st.planRej = ""; st.qfocus = "plan"; save(); render(); },
    // 지금 줄에 하는 일 — 채팅의 칩에는 줄 이름이 없다(순서대로라 지금 줄 하나 — FP.next). 보고 안의 단추는 data-id
    "plan-hand": () => handPlan(),
    "plan-accept": (i, el) => { st.plan = FP.accept(st.plan, planId(el)); save(); const p = FP.progress(st.plan); render(); say(p.done === p.total ? "계획을 다 끝냈어요! 정말 멋져요." : `끝냈어요! ${p.done} / ${p.total}`); },
    "plan-rej-open": (i, el) => { st.planRej = planId(el); st.planRejNote = ""; render(); requestAnimationFrame(() => { const t = $nav.querySelector("[data-act=plan-rej-note]"); if (t) t.focus(); }); },
    "plan-rej-close": () => { st.planRej = ""; render(); },
    "plan-reject": (i, el) => { const id = planId(el); st.plan = FP.reject(st.plan, id, st.planRejNote); st.planRej = ""; st.planRejNote = ""; save(); handPlan(id); },
    // Claude Code가 물은 것에 답하고 이어서 맡기기(C-33) — 그 질문과 답을 다음 맡김 글에 붙인다
    "plan-reply-send": (i, el) => {
      const id = planId(el), w = st.plan && st.plan.work[id], ans = (st.planReply[id] || "").trim();
      if (!w || !w.report || !ans) return say("답을 먼저 적어 주세요");
      st.plan = FP.reject(st.plan, id, `Claude Code가 "${w.report.ask}"라고 물었고, 사용자의 답: ${ans}`); st.planReply = { ...st.planReply, [id]: "" }; save(); handPlan(id);
    },
    "plan-ask-open": (i, el) => { st.planAsk = planId(el); st.planQ = ""; render(); requestAnimationFrame(() => { const q = $nav.querySelector("[data-act=plan-q]"); if (q) q.focus(); }); },
    "plan-ask-close": () => { st.planAsk = ""; render(); },
    "plan-ask-send": (i, el) => askPlan(planId(el)),
    "plan-unwait": () => { st.plan = FP.failed(st.plan, FP.running(st.plan), "기다리지 않기로 했어요"); save(); render(); say("기다리지 않을게요. 다시 맡길 수 있어요."); },
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
    "tu-sel": (i, el) => { const v = (el && el.dataset.v) || ""; set({ tuSel: st.tuSel === v ? "" : v }); },   // 다시 누르면 접는다
    "rb-sel": (i) => set({ rbSel: i | 0 }),
    "rb-reload": () => loadReadme(),
    // 문서 지도(C-45) · 맡기기 틀(C-44)
    "map-open": (i, el) => { const p = el && el.dataset.v; if (!p || !st.files || !st.files.list) return; const k = st.files.list.findIndex((x) => !x.dir && (x.path === p || (window.NavSensitive && window.NavSensitive.redact(p) === x.path))); if (k >= 0) openFile(k); else say(`'${p}'은 파일 목록에 없어요 — 깊이 3 · 200개 안의 글 파일만 열어요`); },
    "preset-open": () => { const n = st.finished ? N.STAGES.length - 1 : atStage(); st.presetPick = { path: nowDocPath(n) }; render(); },
    "preset-x": () => { st.presetPick = null; render(); },
    "preset-go": (i, el) => { const id = el && el.dataset.i; if (st.presetPick) presetGo(id, { path: st.presetPick.path }); },
    "preset-pick": () => {},
    // 파일 보기 · 고치기(C-43)
    "fn-open": (i, el) => { if (el && el.dataset.v !== undefined) openFile(el.dataset.v); },
    ftab: (i, el) => { const k = Number(el && el.dataset.v); if (st.openFiles[k]) { st.fileSel = k; st.qtab = "file"; render(); } },
    fclose: (i, el) => { const k = Number(el && el.dataset.v), f = st.openFiles[k]; if (!f) return; if (f.dirty && !f.closing) { f.closing = true; f.note = { kind: "ask", text: "고친 것을 저장하지 않았어요 — 한 번 더 닫기를 누르면 버려요", acts: [["저장", "fsave"], ["그냥 둘게요", "fnote-x"]] }; st.fileSel = k; st.qtab = "file"; return render(); } st.openFiles.splice(k, 1); if (k < st.fileSel) st.fileSel--; if (st.fileSel >= st.openFiles.length) st.fileSel = st.openFiles.length - 1; if (st.fileSel < 0) st.qtab = "canvas"; render(); },
    fedit: (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (f) { f.edit = !f.edit; render(); } },
    fraw: (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (f) { f.raw = !f.raw; render(); } },
    fsave: (i, el) => { const k = el && el.dataset.v !== undefined ? Number(el.dataset.v) : st.fileSel; const f = st.openFiles[k]; if (f) { f.closing = false; saveFile(k); } },
    "fsave-force": (i, el) => saveFile(Number(el && el.dataset.v), { force: true }),
    "fsave-over": (i, el) => saveFile(Number(el && el.dataset.v), { overwrite: true }),   // 연 뒤 바뀐 파일을 덮어쓴다(비밀값 검사는 그대로 — 깃발을 나눴다, 새 맥락 리뷰)
    "fsave-busy": (i, el) => saveFile(Number(el && el.dataset.v), { ignoreBusy: true }),
    freload: (i, el) => reloadFile(Number(el && el.dataset.v)),
    fundo: (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (!f || !f.hist.length) return; const h = f.hist.pop(); f.text = h.text; f.dirty = f.text !== f.saved; f.edit = true; f.note = { kind: "ok", text: "마지막으로 저장하기 전 글로 되돌렸어요 — 저장을 누르면 그대로 써요" }; render(); },
    "fnote-x": (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (f) { f.note = null; f.closing = false; render(); } },
    "fn-dir": (i, el) => { const v = el && el.dataset.v; if (!v) return; const s = new Set(st.fnOpen); if (s.has(v)) s.delete(v); else s.add(v); st.fnOpen = [...s]; render(); },   // 파일 칸의 폴더 접고 펼치기(R-8)
    "quest-edit": () => { if (st.quest) set({ quest: { ...st.quest, edit: true } }); },
    "quest-cancel": () => { if (st.quest) set({ quest: { ...st.quest, edit: false } }); },
    "quest-save": () => { if (!st.quest) return; const was = st.quest.phase; st.quest = { ...st.quest, edit: false }; if (was === "draft") return ACT["quest-ok"](); render(); say("퀘스트를 고쳐 적었어요 — 보상은 그대로예요"); },
    "quest-sel": (i) => { if (st.quest) set({ quest: { ...st.quest, sel: i, edit: false } }); },
    "quest-hint": () => { const q = st.quest, i = q ? QU.curIdx(q) : -1; say(i >= 0 ? `힌트: ${QU.question(q, i)}` : "힌트: 다 적었으면 완료 보고를 눌러요"); },
    "tree-chap": (i) => { treeChap = i; render(); },
    "tree-map": () => { treeChap = null; render(); },   // 도전과제의 한눈에 보기(C-37)
    // C-54 지도 — 보기 셋 · 기획서로 그리기 · 맞아요(한 번에) · 고칠래요 · 카드 누름(오른쪽 칸 + 문서가 있으면 파일 보기)
    "tree-view": (i, el) => { const v = el && el.dataset.v; if (["cards", "flow", "box"].includes(v)) treeView = v; render(); },
    "prep-draw": async () => { if (!SM || !st.results[1] || st.prep || st.busy) return;   // 바쁠 때 누르면 바쁨을 실패로 읽어 규칙 카드를 저장하던 것(F-103-5 새 맥락 리뷰)
      const rule = SM.prepare({ stages: N.STAGES, slugs: FDOCS ? FDOCS.SLUGS : [], plan: st.results[1], criteria: crits });
      let ai = null;   // C-56 R-2(2026-10-28): 진짜 AI면 한 번에 이 프로젝트의 말로(/api/prepare) — 못 받으면 규칙(기획서의 절)으로만, 연습은 규칙
      if (st.mode === "live" && canLive) { const r = await callAI("/api/prepare", { tier: st.tier, idea: ideaNow(), prev: prevOf(2), base: baseText() }); if (r.ok && r.prepare) { ai = r.prepare.cards; st.tokens = r.tokens || 0; fetchUsage(); } else say(`AI가 맞춰 짓지는 못했어요 — ${r.reason || "연결하지 못했어요"}. 기획서의 절에서 규칙으로 그렸어요`); }
      st.prep = { cards: mergePrepared(rule.cards, ai), ok: false, fix: false, at: ymd(), ...(ai ? { ai: true } : {}) }; save(); render(); say(ai ? "이 프로젝트의 말로 3단계부터 8단계까지 그렸어요 — 카드마다 근거 절을 적었어요. 맞으면 '맞아요'로 한 번에 넘어가요" : "기획서로 3단계부터 8단계까지 그렸어요 — 카드마다 어느 절에서 왔는지 적었어요. 맞으면 '맞아요'로 한 번에 넘어가요"); },
    "prep-ok": () => { if (!st.prep) return; st.prep = { ...st.prep, ok: true, fix: false }; save(); render(); say("준비된 퀘스트로 가요 — 그 단계에 들어서면 준비한 칸으로 시작해요"); },
    "prep-fix": () => { if (!st.prep) return; st.prep = { ...st.prep, fix: true }; render(); },
    "map-line": (i, el) => { const k = Number(el && el.dataset.k); if (!Number.isInteger(k)) return; st.mapLine = st.mapLine && st.mapLine.n === Number(i) && st.mapLine.k === k ? null : { n: Number(i), k }; if (st.mapLine && !wsideOpen) { wsideOpen = true; writeLS("floe:ws-side", "1"); } render(); },   // C-54 ⑧ 줄 하나 → 오른쪽 칸
    "map-chat": () => { st.qtab = "quest"; ACT["draft-fix"](); },   // C-54 ⑧ 빈 칸 — 채팅에서 같이 적기(공책을 열고 채팅 칸에 커서)
    "pair-sel": (_, el) => { const v = el && el.dataset.v; if (!SM || !SM.PAIRS.some(([k]) => k === v)) return; st.pair = st.pair === v ? null : v; render(); },   // C-54 ⑨ 두 칸 나란히
    "map-card": (i) => { const m = stageMap(), c = m && m.cards[i]; if (!c) return; st.mapSel = st.mapSel === i ? null : i; if (!st.mapLine || st.mapLine.n !== i) st.mapLine = null; if (st.mapSel != null && !wsideOpen) { wsideOpen = true; writeLS("floe:ws-side", "1"); } render(); if (st.mapSel != null && c.doc.has) ACT["map-open"](null, { dataset: { act: "map-open", v: c.doc.path } }); },
    // 빈 칸 채우기 — 지금 장의 칸은 채팅에서 차례로. 받기 전이면 퀘스트 탭(받기 화면)으로, 섬이 접혀 있으면 펼친다(앱의 옆 창에서 눌러도 섬에서 이어진다)
    "jmap-fill": () => {
      if (st.qfocus === "plan") st.qfocus = "stage";
      if (st.quest && st.quest.phase === "draft") { openQwin("quest"); st.qtab = "quest"; return render(); }
      if (st.ui !== "home") go("home"); else render();
      requestAnimationFrame(() => { const t = $nav.querySelector("[data-act=say]"); if (t) t.focus(); });
    },
    shells: () => set({ gacha: { phase: "ready" } }),   // 위 줄의 조개 → 뽑기 창
    gacha: () => set({ gacha: { phase: "ready" } }),
    "gacha-close": () => set({ gacha: null }),
    "gacha-roll": () => gachaRoll(),
    wear: (i, el) => { if (!QU || !el) return; set({ wear: QU.toggleWear(st.wear, el.dataset.v) }); },
    qwin: () => closeQwin(),
    // R-10 관문 앞 멈춤(2026-10-27)
    "gate-fill": () => { if (!st.quest) return; st.quest = { ...st.quest, phase: "quest", edit: false }; st.skip = null; openQwin("quest"); render(); say("공책에서 '안 됨'인 칸을 고치고 다시 완료 보고를 눌러요"); },
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
    "qwin-toggle": () => { if (st.qwin) return closeQwin(); openQwin("canvas"); render(); },   // 위 줄의 '퀘스트' 단추(C-35, 이재엽 그림 2026-10-24) — 작업실은 캔버스 탭부터(C-41, 2026-10-26)
    "qwin-quest": () => { openQwin("quest"); render(); }, "qwin-tree": () => { openQwin("tree"); render(); }, "qwin-lib": () => { openQwin("lib"); render(); },
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
    "inbox-ok": (i) => { const x = st.inbox[i]; if (!x) return; st.sorted = [{ at: ymd(), kind: x.kind, text: x.text, topic: x.topic }, ...st.sorted].slice(0, 200); st.inbox.splice(i, 1); render(); say(`'${FD ? FD.kindLabel(x.kind) : x.kind}' 칸에 넣었어요`); },
    "inbox-drop": (i) => { if (!st.inbox[i]) return; st.inbox.splice(i, 1); render(); say("뺐어요"); },
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
    dismiss: () => set({ error: "" }),
    "look-now": () => { st.notice = ""; lookAfterWork(lastPing); },
    "peek-text": () => { set({ ping: "", openInput: !!st.j }); focusText(); },
    "ping-later": () => { st.ping = ""; go("petit"); },
    draft: () => { if (refuse(mealWhy())) return; draft(false); },
    review: () => { if (refuse(mealWhy())) return; review(false); },
    "confirm-doc": () => confirmDoc(false),
    "confirm-anyway": () => confirmDoc(true),
    "confirm-cancel": () => set({ askConfirm: 0 }),
    "reopen-doc": () => { const x = docDone(docStage().n); if (x) set({ doc: newDoc(x.stage, x.text, "") }); },
    forget: () => { forgotten = true; try { localStorage.removeItem(KEY); localStorage.removeItem(BOUND_KEY); localStorage.removeItem("floe:setup:v1"); } catch {} location.reload(); },   // 처음 설정도 처음부터
    setup: () => { set({ settings: false, qwin: false }); if (window.FloeSetup) window.FloeSetup.open(); },   // 처음 설정은 섬 창에 뜬다 — 작업실이 열려 있으면 먼저 닫아 섬 창이 다시 보이게(C-41 ⑤, 새 맥락 리뷰 2026-10-27)
    "setup-project": () => { set({ settings: false }); if (window.FloeSetup) window.FloeSetup.open({ step: "project" }); },   // 처음 설정의 프로젝트 칸부터(2026-10-24 리뷰 — 새 프로젝트마다 AI 연결을 다시 거치지 않게)
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
    // 자동 살펴보기 · 다음 장 미리 보기(퀘스트 창의 도전과제) · 느낀 점 열기
    "auto-toggle": () => { set({ auto: !st.auto }); say(st.auto ? "AI 코딩 도구가 일을 마치면 저절로 살펴볼게요" : "이제 눌러야 살펴봐요"); },
    peek: () => { treeChap = nextStage() ? nextStage().n : null; openQwin("tree"); set({ settings: false }); },
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
  };
  // iPhone — 아래 막대 뒤나 스크롤 밖에 생긴 칸(잠시 멈추기 권유·적는 칸)을 보이는 곳으로 옮긴다. 없으면 아무것도 안 한다
  const reveal = (sel) => { if (isPhone()) requestAnimationFrame(() => { const el = $phone.querySelector(sel); if (el) el.scrollIntoView({ block: "center", behavior: STILL ? "auto" : "smooth" }); }); };
  // 넘어가기 전 확인의 마지막 — 다음 단계 할 일로 순서 정하기를 연다(꼭/나중에는 처음엔 모두 꼭)
  // 확인 질문 뒤 — 순서 정하기 없이 바로 다음 단계로(2026-10-18 임유정 결정, FR-12는 팀이 정한다 · PR #105). 마지막 단계만 '마치기'를 한 번 더 묻는다
// ━━ app/92-basecard.js ━━
  // ── C-56 R-1 기준 카드(2026-10-28): 1단계 관문의 카드 — 옮겨 온 줄은 출처 칩, 받은 글에서 온 줄은 줄 번호, 사람만 아는 칸은 빈칸(입력) + 성공의 '아직 모름'이면 무엇이 막히는지 한 줄. edit — 입력 칸을 보일지(관문 · 오른쪽 칸) ──
  const BC_EX = { what: "예: 신청이 한곳에 모이고 마감 전에 알림이 가요", success: "예: 신청 40건이 한곳에 모이면 · '신청됨'까지 3초 안", data: "예: 회원 이름 · 학번(운영진만)", out: "예: 알림 서비스로 이름만" };
  function baseCardHTML(card, edit) {
    if (!BC || !card) return "";
    const chip = (f) => (f.by === "me" ? `<small class="bc-from me">직접</small>` : f.src && f.lines && f.lines.length ? `<small class="bc-from">옮겨 옴 · 받은 글 ${f.lines.map((x) => `${x.line}줄`).join(" · ")}</small>` : f.from && f.from.length ? `<small class="bc-from">옮겨 옴 · ${f.from.map((x) => `${LB(x.s)} ${ROMAN(x.i)}`).join(" · ")}</small>` : "");
    return `<dl class="bc" aria-label="이 프로젝트의 기준">${BC.FIELDS.map((fd) => { const f = card[fd.key] || { text: "", blank: true }; const canEdit = edit && (f.blank || f.by === "me");
      return `<div class="bc-row${f.blank ? " blank" : ""}"><dt>${fd.label}</dt><dd>${canEdit ? `<input type="text" data-act="card-field" data-v="${fd.key}" value="${esc(f.text || "")}" placeholder="${esc(f.note || BC_EX[fd.key] || "비었어요 — 알면 적어요")}" aria-label="${fd.label}" maxlength="200">` : f.blank ? `<span class="bc-blank">비었어요</span>` : esc(f.text)}${chip(f)}</dd></div>`; }).join("")}</dl>`;
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
    if (a === "mode") { set({ mode: t.value, error: "", warn: null }); chatRecheck(); }   // 진짜 AI 모드로 바꾸면 대화를 둘 폴더를 다시 묻는다
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
    if (a === "prep-think") { const c = st.prep && st.prep.cards && st.prep.cards[Number(t.dataset.i)]; if (c) c.think = t.value.slice(0, 120); return; }   // C-54 고칠래요 — ① 생각(다시 그리지 않는다, '맞아요'에서 저장)
    if (a === "ffind") { const f = st.openFiles[Number(t.dataset.v)]; if (!f) return; f.find = t.value.slice(0, 60); if (f.kind === "md" && !f.edit && !f.raw && f.find) f.raw = true; render(); return; }   // C-53 문서 안 찾기 — 그 글이 든 줄 표시(원문 · 코드 보기)   // R-10 넘기는 까닭 — 다시 그리지 않는다(글 칸이 흔들리지 않게)
    // FR-17 할 일 · 요구 문장 — 글자를 칠 때는 다시 그리지 않고(커서가 튄다) '정리' 단추만 켠다
    if (a === "task-text") { st.task.text = t.value; const b = $nav.querySelector("[data-act=task-tidy]"); if (b) b.disabled = !st.task.text.trim(); }
    if (a === "task-lines") st.task.lines = t.value.split("\n");
    // 준비 계획(C-34) — 글자를 칠 때는 다시 그리지 않고(커서가 튄다) 단추만 켠다
    if (st.plan && FP && /^plan-(note|answer|general)$/.test(a || "")) {
      st.plan = a === "plan-note" ? FP.note(st.plan, t.dataset.id, t.value) : a === "plan-answer" ? FP.answer(st.plan, Number(t.dataset.i), t.value) : { ...st.plan, general: t.value.slice(0, 300) };
      const b = $nav.querySelector("[data-act=plan-again]"); if (b) b.disabled = !(FP.hasFeedback(st.plan) && planLive());
      save();
    }
    if (a === "plan-rej-note") st.planRejNote = t.value.slice(0, 300);
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
    if (a === "note-text") { st.noteText = t.value; const b = document.querySelector("[data-act=note-add]"); if (b) b.disabled = !st.noteText.trim(); }
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

// ━━ app/95-boot.js ━━
  // ── 단축키 (PC) — 카드 버튼에 적힌 키. 글을 쓰는 중에는 Esc와 Ctrl+Enter만. 한글 자판의 ㅛ·ㅜ도 Y·N으로 ──
  const ALIAS = { "ㅛ": "y", "ㅜ": "n", "ㅗ": "h" };
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
    const auto = !st.finished && st.screen !== "gate" && (ev.sim ? st.mode === "fixture" : st.auto && st.mode === "live");
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
  if (canLive) setInterval(async () => { if (st.ui !== "home") return; const was = aiLatest; await pollSteps(); if (aiLatest !== was) render(); }, 2000);   // 펼쳐져 있으면 늘(C-22 — 채팅의 '일하고 있어요' 띠)

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
      termOpen: "", check: null, undo: [], own: false, meal: null, libDoc: null, qwin: false, chat: [], chatMark: 0, chatChanges: [], chatOpen: null });   // 장면은 대화 · 대화 표시 자리도 처음부터(C-63)
    lastLive = null;
    // 주소로 연 장면은 바이브 코딩(녹화 · 시험이 그대로), #base(&pane=alerts|ai)만 기본 화면(C-13, 넘김 문서 9절 7번)
    // 서고에서 돌아온 주소(&back)는 장면이 아니다 — 떠난 모드 그대로(F-36, PR #139 리뷰: 기본 화면에서 서재에 다녀오면 바이브 코딩이 됐다)
    if (q.base) { st.place = "base"; st.pane = ["alerts", "ai"].includes(q.pane) ? q.pane : ""; } else setPlace(q.back ? "library" : "scene");
    if (!q.back) st.qfocus = "stage";   // 주소로 연 장면은 단계 퀘스트 쪽(C-35) — 서고에서 돌아온 &back만 그대로
    if (FP && (q.pane === "plan" || q.plan)) st.qfocus = "plan";   // #base&plan — 채팅의 준비 계획. 옛 주소 &pane=plan(계획판, 2026-10-24)도 이리로
    if (q.approve && AP) { approvals = AP.EXAMPLE.map((a) => ({ ...a, at: Date.now() })); apMode = "example"; st.task = { text: "", lines: null, say: "", sent: "" }; st.apSure = ""; }   // &approve=1 — 예시 승인 카드(FR-17, 녹화 · 시험용)
    if (q.tier && TIERS.some(([v]) => v === q.tier)) { st.tier = q.tier; if (st.j) st.j = T.refit(st.j, st.tier); }
    if (q.noex) { exHidden = true; applyEx(); }   // 이 화면만 예시 책 없이(시험 · 시연용) — 저장하지 않는다
    if (q.start) Object.assign(st, { codeless: null, linesDone: [], carryUse: {}, carryDone: false, j: null, finished: false, todos: null, text: S.first.text, tab: "today", hold: null, quest: null, idea: "", topic: "", results: {}, ship: null, prep: null, mapSel: null });
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
    if (q.tab === "learn") { if (SHELF_ON) { save(); location.replace(`${LIB_URL}#lib`); return; } st.qwin = true; st.qtab = "tree"; }   // 서재를 잠시 뺀 동안(2026-10-23)은 서고 대신 배우기 — 2026-10-24부터 도전과제 안(C-35)
    if (q.tab && TABS.some((t) => t[0] === q.tab)) st.tab = q.tab;
    // 퀘스트 창(C-22, 2026-10-21): &tab=map · lib는 PC에서 퀘스트 창의 도전과제 · 서고 탭, &q=draft|quest|done은 퀘스트 장면(시험 · 녹화용), &set=1 설정 창, &side=right
    if ((q.tab === "map" || q.tab === "lib") && !q.back) { st.qwin = true; st.qtab = q.tab === "map" ? "tree" : "lib"; }   // 서고에서 돌아올 때(&back)는 창을 열지 않는다 — 떠난 모습 그대로(F-36)
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
  // C-55(2026-10-28 이재엽 버튼 "접힌 알약 + 말풍선" · "켤 때마다"): 켜면 바로 작업실(캔버스 = 지금 단계의 퀘스트 보드) + 접힌 알약 + 알약 옆 말풍선(greet.js bootPlan). 처음 설정이 필요하면 전처럼(알약 안 인사 → 설정)
  const bootArgs = { hash: location.hash, still: STILL, phone: isPhone(), lastDay: readLS(GREET_DAY, ""), today: ymd(),
    setupNeeded: !!(window.FloeSetup && window.FloeSetup.shouldOpen(window.FloeSetup.readSaved(localStorage), location.hash)) };
  const boot = GR && st.ui === "greet" ? GR.bootPlan(bootArgs) : { workspace: false, bubble: false, greet: false };
  const greetNow = !!GR && st.ui === "greet" && !boot.workspace && GR.shouldGreet(bootArgs).greet;
  if (boot.workspace) { openQwin("canvas"); st.ui = "petit"; st.boot = { greet: boot.greet, at: Date.now() }; if (boot.greet) writeLS(GREET_DAY, ymd()); setTimeout(() => { if (st.boot) { st.boot = null; render(); } }, GR.BUBBLE_MS); }
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
    st.gh = null; st.openFiles = []; st.fileSel = -1; st.files = null; if (st.qtab === "file" || st.qtab === "map") st.qtab = "canvas";   // 다른 폴더의 파일을 새 목록 번호에 잇지 않는다(새 맥락 리뷰 — 다른 프로젝트 파일을 덮을 수 있었다)
    if (canLive && !ghLoading) loadGithub();
    if (st.qwin) loadFiles();
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
    else if ((d.via === "cli" || d.via === "api") && canLive) set({ mode: "live", error: "", warn: null });
    chatRecheck();   // 처음 설정에서 폴더를 골랐을 수 있다 — 대화를 둘 폴더를 다시 묻는다(병합 뒤 고침 새 맥락 리뷰: 첫 실행에서 고른 폴더에 대화가 쌓이지 않았다)
    if (d.open) { setPlace("vibe"); st.tab = "today"; go("home"); }   // '시작하기' — 바이브 코딩으로(C-13: 보여 주기는 바이브 코딩 안에)
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
