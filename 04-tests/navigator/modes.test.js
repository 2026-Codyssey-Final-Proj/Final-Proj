// claude-drafted: 2026-10-20 — C-13 모드 둘(이재엽 "버튼식으로 준비가 되어있는 공간이 기본값" · "모드를 넣는다는게 맞는 표현", 버튼 "섬 안에서 바로").
// 넘김 문서(fable-handoff-2026-10-20-modes.md) 6절 — 모드 규칙(navigator.js nextPlace, 순수)과 app.js가 그 규칙대로 이어 붙였는지(글로), 섬의 알림 · AI 진행 판이
// hub.js의 순수 함수를 그대로 쓰며 C-12 규칙(파일 내용을 받지 않음)을 지키는지 본다. 따로 뜨던 모아 보기 창은 2026-10-23에 뺐다(hub.js에는 순수 함수만).
// 실행: node --test 04-tests/navigator/modes.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Nav = require("../../03-backend/navigator/navigator.js");
const H = require("../../02-frontend/hub/hub.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const app = read("navigator/app.js");

test("nextPlace — 켤 때 기본, 바이브 코딩 단추 · 주소 장면은 바이브 코딩(모아 보기의 들어가기는 2026-10-23에 창째 뺐다), 집은 기본. 접힘 · 펼침 · 서고 다녀옴으로는 바뀌지 않는다", () => {
  assert.deepEqual(Nav.PLACES, ["base", "vibe"]);
  assert.equal(Nav.nextPlace("vibe", "start"), "base");
  assert.equal(Nav.nextPlace("base", "vibe"), "vibe");
  assert.equal(Nav.nextPlace("base", "scene"), "vibe");
  assert.equal(Nav.nextPlace("base", "enter"), "base", "enter는 이제 모르는 일 — 그대로");
  assert.equal(Nav.nextPlace("vibe", "home"), "base");
  for (const ev of ["fold", "unfold", "library", "idle", "", undefined]) {
    assert.equal(Nav.nextPlace("vibe", ev), "vibe", `${ev}: 바이브 코딩 그대로`);
    assert.equal(Nav.nextPlace("base", ev), "base", `${ev}: 기본 그대로`);
  }
  assert.equal(Nav.nextPlace("zzz", ""), "base", "모르는 값은 기본");
});

test("app.js — 모드는 st.place(mode · home이라는 이름은 쓰지 않는다), 이 창의 sessionStorage에만(기록 KEY에는 없음), 집 단추 · 바이브 코딩 단추 · 주소 장면이 규칙을 부른다(모아 보기의 들어가기는 2026-10-23에 창째 뺐다)", () => {
  assert.match(app, /place: "base", pane: "",/);
  assert.doesNotMatch(app, /st\.place === "home"|place: "home"|placeMode/, "이름 겹침(넘김 문서 10절)");
  assert.match(app, /const PLACE_KEY = "floe:place", SEEN_KEY = "floe:alerts-seen";/);
  assert.match(app, /st\.place = N\.nextPlace\(SESS && SESS\.getItem\(PLACE_KEY\) === "vibe" \? "vibe" : "base", ""\);/, "켤 때 — 이 창에 남은 것만, 없으면 기본");
  const keep = [...app.matchAll(/const KEEP = \[[^\]]*\]|^  keep\(\[[^\]]*\]/gm)].map((m) => m[0]).join(" ");   // 공통 KEEP + 조각의 keep([...])(app.js 나누기 2차)
  assert.ok(!keep.includes('"place"') && !keep.includes('"pane"'), "기록(localStorage)에는 넣지 않는다 — 다음에 켤 때는 늘 기본");
  assert.match(app, /base: \(\) => \{ setPlace\("home"\); set\(\{ settings: false, pane: "" \}\); \}/, "집 — 열어 둔 판도 닫는다");
  assert.match(app, /"go-vibe": \(\) => \{ setPlace\("vibe"\); set\(\{ tab: "today"/, "바이브 코딩 단추 → 이번 단계");
  assert.match(app, /if \(q\.base\) \{ st\.place = "base"; st\.pane = \["alerts", "ai"\]\.includes\(q\.pane\) \? q\.pane : ""; \} else setPlace\(q\.back \? "library" : "scene"\);/, "주소 장면은 바이브 코딩, #base만 기본(&pane=alerts|ai), 서고에서 돌아온 &back은 떠난 모드 그대로(F-36)");
  assert.match(app, /if \(FP && \(q\.pane === "plan" \|\| q\.plan\)\) st\.qfocus = "plan";/, "옛 주소 &pane=plan(계획판, 2026-10-24)은 채팅의 준비 계획으로(C-35)");
  assert.match(app, /const body = st\.settings && QU && !st\.qwin \? settingsPane\(\) : st\.pane \? basePane\(st\.pane\) : chatCard\(momentToday\(\)\);/, "판(알림 · AI 진행)이 아니면 채팅(C-22, 2026-10-21 — 기본 화면의 단추 넷은 뺐다)");
});

// 2026-10-21 C-22(게임식 디자인 1차 뼈대): 기본 화면의 단추 넷(바이브 코딩 · 서재 · 알림 · AI 진행)과 바이브 코딩의 탭 넷은 뺐다 — 위 줄 하나, 채팅 중심 섬.
//   알림 · AI 진행 판은 그대로(채팅의 칩 '알림' · 허락 카드가 오면 저절로), 서재는 설정 창의 '서재로 가기' · 퀘스트 창의 서고 탭
test("app.js — 채팅 중심 섬(C-22): 위 줄 하나(집 · 단계 띠 · 조개 · 설정 · 핀 · 접기, 탭 없음 — 퀘스트 창 · 모아 보기 단추는 2026-10-23에 뺐다) · 지금 한 줄은 첫 카드의 작은 줄 · 알림은 칩. 인사가 끝나면 채팅", () => {
  assert.ok(!app.includes("BASE_BTNS") && !app.includes("function baseBody") && !app.includes('<div class="tabs"'), "단추 넷 · 탭 넷이 없다");
  assert.match(app, /return `<div class="tb">\$\{homeBtn\(!st\.pane\)\}<span class="tb-stage" aria-live="polite">\$\{stageBand\(\)\}<\/span>/, "위 줄 하나 — 집은 판을 열었을 때만 눌리지 않은 모양");
  assert.doesNotMatch(app, /<button class="ti" data-act="qwin" aria-pressed=/, "두루마리 아이콘 단추(2026-10-23에 뺌)는 다시 두지 않는다 — 퀘스트 창은 위 줄의 '퀘스트' 글자 단추로(C-35)");
  // 2026-10-23 C-29: 어디쯤인지 보기 · 도전과제 칩은 명령 네 칸(살피기)과 퀘스트 창의 탭으로 — 늘 있는 칩은 알림 하나. 2026-10-24 C-35: 네 칸은 뺐다(아래 시험)
  assert.match(app, /out\.push\(\{ label: unreadN\(\) \? `알림 \$\{unreadN\(\)\}` : "알림", act: "base-alerts", kind: "ghost" \}\);/, "알림 칩");
  assert.match(app, /return st\.back \|\| C\.greeting\(new Date\(\)\.getHours\(\)\);/, "지금 한 줄 — 알림 · AI가 한 일이 없으면 인사");
  assert.match(app, /foot: esc\(nowLine\(\)\)/, "지금 한 줄은 첫 카드의 작은 줄");
  assert.match(app, /go\("petit"\);   \/\/ 인사가 끝나도 알약 그대로\(C-46 R-1\)/, "2026-10-27 C-46: 인사가 끝나면 알약(전에는 기본 화면)");
  assert.match(app, /else if \(st\.ui === "greet"\) st\.ui = location\.hash && location\.hash !== "#" \? "home" : "petit";/, "인사 움직임이 없어도 알약(C-46) — 주소 끝 장면은 기본 화면");
  assert.match(app, /if \(d\.open\) \{ setPlace\("vibe"\); st\.tab = "today"; go\("home"\); \}/, "처음 설정의 '시작하기'는 바이브 코딩으로");
});

test("app.js — 알림 · AI 진행 판은 섬 안에서 바로, hub.js의 순수 함수(FloeHub)와 한 줄 글(NavSteps)을 그대로 쓴다. '크게 보기'(모아 보기 창)는 2026-10-23에 뺐다", () => {
  assert.match(app, /const HUB = window\.FloeHub, STEPS = window\.NavSteps, MO = window\.FloeMorph;/);
  assert.match(app, /kind === "ai" \? HUB\.aiHTML\(aiSessions, aiMode, STEPS, now\) : HUB\.alertsHTML\(st\.alerts, now\)/);
  assert.match(app, /HUB\.unread\(st\.alerts, seenAlerts\)/, "읽지 않은 수");
  assert.match(app, /HUB\.anyWorking\(mine\(\)\)/, "일하는 중 점 — 연결한 폴더의 세션만(F-73)");
  assert.ok(!app.includes('"hub-alerts"') && !app.includes("크게 보기"), "크게 보기 · 모아 보기 창이 없다");
  assert.match(app, /fetch\(`\/api\/steps\?since=\$\{aiLatest\}`/, "AI 진행만 묻는다");
  assert.match(app, /if \(st\.ui !== "home"\) return; const was = aiLatest;/, "펼쳐져 있을 때만 2초마다(C-22부터는 채팅의 '일하고 있어요' 띠가 쓴다)");
  assert.match(app, /aiSessions = HUB\.exampleSessions\(STEPS, Date\.now\(\)\)/, "서버 없이는 예시(FR-10)");
  // C-12 규칙 — 파일 내용 · 고친 글 · 명령 결과를 다루는 이름이 섬에 없다
  for (const bad of ["tool_input", "tool_response", "old_string", "new_string", "content:"]) assert.ok(!app.includes(bad), `app.js에 ${bad}가 없어야`);
  const html = read("navigator/index.html");
  assert.match(html, /<script src="\.\.\/hub\/hub\.js"><\/script>\s*<script src="\.\.\/\.\.\/03-backend\/navigator\/steps\.js" onerror="this\.remove\(\)"><\/script>/);
});

test("hub.js — 순수 함수만 남았다(2026-10-23 모아 보기 창을 뺌): 화면 · 저장소 · 서버를 건드리지 않고, 섬이 쓰는 함수는 그대로(require로도 열린다)", () => {
  const js = read("hub/hub.js").replace(/\/\/[^\n]*/g, "");
  for (const bad of ["document.", "location.", "localStorage", "sessionStorage", "fetch(", "setInterval"]) assert.ok(!js.includes(bad), `hub.js에 ${bad}가 없어야`);
  for (const f of ["alertsHTML", "aiHTML", "unread", "latestAt", "anyWorking", "mergeSessions", "exampleSessions"]) assert.equal(typeof H[f], "function", f);
});

test("쉬운 말(FR-13) — 알림 · AI 진행 판과 채팅 중심 섬의 화면 글에 전문 용어가 없다 (navigator.test.js의 app.js 전체 검사와 별개로 새 글만 한 번 더)", () => {
  // 화면에 보이는 글만(따옴표 · 역따옴표 안) — 주석의 '판정' 같은 코드 설명은 보지 않는다
  const strings = (s) => [...s.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2]).join("\n");
  const pane = app.slice(app.indexOf("const PANE = {"), app.indexOf("function islandHTML")), chat = app.slice(app.indexOf("// ── 채팅 중심 섬(C-22"), app.indexOf("// 단계 문서 — 왼쪽 플로로와 버튼"));
  for (const w of Nav.JARGON) assert.ok(!strings(pane).includes(w) && !strings(chat).includes(w), `전문 용어 ${w}`);
  for (const word of ["알림", "AI 진행", "단추로"]) assert.ok(pane.includes(word), word);
  for (const word of ["퀘스트 받기", "완료 보고", "보내기", "도전과제", "플로로가 생각한 내용인데 맞나요?"]) assert.ok(chat.includes(word), word);
});

test("채팅 — '살펴보고 있어요'(기다리는 동안 경과 초가 바뀌는 말)는 지난 말로 쌓지 않는다(임유정 2026-10-22, 다시 그릴 때마다 같은 말이 쌓였다)", () => {
  assert.match(app, /title: `\$\{st\.planBusy \? PL_BUSY\[st\.planBusy\] : "살펴보고 있어요"\}\$\{dots\}`,\s*\n\s*sub: `<span data-wait>[^\n]*passing: true/, "기다리는 말에 passing 표시(계획을 기다릴 때는 그 말 — C-35)");
  assert.match(app, /if \(lastLive && lastLive\.key !== key\) settleLive\(\);/, "말이 바뀌면 지난 말로");
  assert.match(app, /if \(!lastLive \|\| lastLive\.passing \|\| lastLive\.logged\) return;/, "passing인 말은 쌓지 않는다(C-37 settleLive)");
  assert.match(app, /function say\(text\) \{ if \(!text\) return; logMsg\("floro", esc\(text\)\); saidSince \+= 1;/, "안내 · 오류는 대화 기록에 — 지난 말은 그 앞에 끼운다(2026-10-25)");
});

// ── C-35 오버레이는 일하는 자리(2026-10-24, 이재엽 "오버레이는 작업하는 공간이고 다른 곳들은 부가적인 기능" · 버튼 "맡길 일 퀘스트 하나로" · "채팅에서 전부") ──
test("app.js — C-35: 명령 네 칸은 오버레이에서 뺐다. 퀘스트 창은 위 줄의 '퀘스트' 단추, 배우기 탭은 도전과제로, 계획 · 맡기기 · 보고는 채팅의 지금 말(momentPlan)", () => {
  for (const gone of ["const CMD4", "cmd4HTML", "function planPane", "function learnPane", '["teach", "배우기"]']) assert.ok(!app.includes(gone), `${gone}가 없어야`);
  assert.ok(!/\.cmd4\b/.test(read("navigator/app.css")), "명령 네 칸 CSS도 없다");
  assert.match(app, /<button type="button" class="tb-q" data-act="qwin-toggle" aria-pressed="\$\{st\.qwin\}"[^>]*>퀘스트<\/button>/, "위 줄의 '퀘스트' 단추 — 이재엽 그림(2026-10-24)");
  assert.match(app, /"qwin-toggle": \(\) => \{ if \(st\.qwin\) return closeQwin\(\); openQwin\("canvas"\); render\(\); \}/, "켜고 끈다 — 작업실은 캔버스 탭부터(C-41, 2026-10-26)");
  assert.match(app, /const QTABS = \[\["canvas", "캔버스"\], \["quest", "퀘스트"\], \["lib", SHELF_ON \? "서고" : "책"\]\];/, "작업실 창의 탭 셋 — 캔버스 · 퀘스트(노트북 + 도전과제, C-65 2026-10-30) · 책");
  assert.match(app, /if \(planNow\(\)\) return momentPlan\(\);/, "맡길 일 퀘스트를 고르면 채팅의 지금 말이 계획 · 맡기기 · 보고");
  assert.match(app, /const body = st\.settings && QU && !st\.qwin \? settingsPane\(\) : st\.pane \? basePane\(st\.pane\) : chatCard\(momentToday\(\)\);/, "판은 알림 · AI 진행 둘 — 계획판은 채팅으로 옮겼다");
  const keep = /const KEEP = \[([^\]]+)\]/.exec(app)[1];
  assert.ok(keep.includes('"qfocus"'), "지금 할 퀘스트(단계 · 맡길 일)는 다시 켜도 이어진다");
});

test("app.js — C-35: 허락 카드는 채팅에 뜬다(판으로 옮기지 않는다) · 보고 · 허락이 와도 지금 할 퀘스트는 사람이 고른다(칩으로 알림) · 관문 · 경고가 먼저 · 도전과제의 장마다 관문 전에 알아 둘 것(tutorial.js forChap)", () => {
  assert.match(app, /\$\{approvalsHTML\(\)\}<div class="msg floro now">/, "허락 카드 — 채팅의 지금 말 바로 위");
  assert.doesNotMatch(app, /st\.pane = st\.pane === "plan" \? "plan" : "ai";/, "허락 카드가 와도 AI 진행 판으로 옮기지 않는다");
  assert.doesNotMatch(app, /st\.qfocus = "plan"; st\.plan = FP\.(report|failed)/, "보고가 와도 지금 할 퀘스트를 저절로 바꾸지 않는다(2026-10-24 리뷰)");
  assert.match(app, /rep \? "맡길 일 — 보고가 왔어요"/, "단계 퀘스트 쪽에서는 칩으로 알린다");
  assert.match(app, /const planNow = \(\) => !!FP && st\.qfocus === "plan" && !st\.warn && !st\.error && st\.screen !== "gate" && !st\.meal;/, "경고 · 오류 · 관문 · 먹이 정리가 먼저");
  for (const use of ["if (planNow()) return momentPlan();", "if (planNow()) return planSay(t);", "const sayHint = () => (planNow() ?"]) assert.ok(app.includes(use), `지금 말 · 입력 · 힌트가 같은 판정: ${use}`);
  assert.match(app, /TU \? TU\.forChap\(n\)/, "도전과제 판 — 그 장의 배울 것");
});

// ── C-36 처음 한 바퀴(2026-10-25, 이재엽 "원하는 내용을 한줄로 작성해달라고 하지말고 원하는 내용을 플로로에게 받는걸로 … 초안을 백엔드로 제작 … 이 주제에 대한 내용을 제목으로") ──
test("app.js — C-36: 처음 말은 '한 줄로' 대신 원하는 것을 플로로에게, 보내면 AI가 1단계 초안(/api/start) → 제목이 주제인 1단계 퀘스트로 바로(시작하시겠습니까 · 받기 화면 없이). 칸마다 맞나요 · 누가 · 크기", () => {
  assert.doesNotMatch(app, /한 줄로 적으면 퀘스트로/, "처음 말에 '한 줄로'가 없다");
  assert.match(app, /원하는 것을 플로로에게 알려 주세요/);
  assert.match(app, /if \(!st\.j && !q && QU\) return startDraft\(t\);/, "처음 보낸 말은 초안으로");
  for (const gone of ["st.qask", "\"quest-start\":", "\"quest-notyet\":", 'title: "퀘스트를 시작하시겠습니까']) assert.ok(!app.includes(gone), `${gone}가 없어야`);
  assert.match(app, /callAI\("\/api\/start", \{ text \}\)/, "받은 글 전체를 한 번에");
  assert.match(app, /QU\.withDraft\(QU\.makeQuest\(N\.STAGES\[0\], crits\(0\)\)/, "1단계 퀘스트에 초안 — 제목은 주제");
  assert.match(app, /QU\.retitle\(QU\.makeQuest\(nx, crits\(nx\.n\)\), st\.topic\)/, "다음 장 퀘스트도 주제를 제목으로");
  const keep = /const KEEP = \[([^\]]+)\]/.exec(app)[1];
  assert.ok(keep.includes('"topic"'), "주제는 다시 켜도 남는다");
  for (const act of ["draft-ok", "draft-fix", "draft-who", "draft-size"]) assert.ok(app.includes(`"${act}": `), act);
});

// 접힌 섬 · 띠의 작업 자리 표시(2026-10-25 두승현 — 옛 "진짜 AI" 표시 대신)
test("접힌 섬의 표시 — 진짜 AI 모드면 '진짜 AI' 대신 이 컴퓨터의 폴더 이름(글자 수 제한 없음 — F-55), GitHub 저장소는 title에만. 연습이면 '연습' 그대로", () => {
  assert.doesNotMatch(app, /\? "진짜 AI" : "연습"/, "옛 표시가 남지 않는다");
  // F-58-5(2026-10-25 임유정): 앱에서 고른 폴더 이름(/api/github의 project)을 먼저, 그다음 훅 알림의 폴더 — claude-drafted: 2026-10-25
  // F-73(2026-10-28 임유정 "어떤 형태든 로컬 폴더 이름을 최우선으로"): 저장소 이름을 먼저 보이던 것(F-54)을 바꿨다 — 저장소(주인/이름)는 title · aria-label에만
  assert.match(app, /const wsFull = \(\) => \{[^\n]*return \(st\.gh && st\.gh\.project\) \|\| project\(\); \};/, "보이는 이름은 앱에서 고른 폴더 이름, 그다음 훅 알림의 폴더");
  assert.doesNotMatch(app, /\$\{st\.mode === "live" \? esc\(wsRepo\(\)\)/, "저장소 이름을 보이는 글자로 쓰지 않는다");
  assert.match(app, /const wsShort = \(\) => wsFull\(\) \|\| "폴더 없음";/, "알약 · 띠도 폴더 이름 그대로(저장소 이름으로 바꾸지 않는다)");
  assert.match(app, /작업 자리 — \$\{wsFull\(\)\}\$\{wsRepo\(\) \? ` · GitHub \$\{wsRepo\(\)\}` : ""\}/, "저장소는 마우스를 올리면");
  assert.doesNotMatch(app, /s\.length > 14/, "글자 수로 자르지 않는다(띠 폭을 넘으면 CSS가 … 로)");
  assert.match(app, /\$\{st\.mode === "live" \? esc\(wsShort\(\)\) : "연습"\}/, "연습이면 그대로");
});

// ── C-37(2026-10-25, 이재엽 "1단계에서 플로로 채팅이 너무 많이 올라오는 문제 … 한곳에서 보이는 것들 … 도전과제 … 다이어그램 … 2단계에서도 초안 … docs … 깃허브") ──
test("app.js — C-37: 내 말보다 먼저 지금 보이는 플로로의 말을 기록에(질문 → 답 순서) · 초안 확인은 지나는 말(passing) · 칩은 내 말로 쌓지 않는다(quiet) · 끝나면 한 줄로 정리", () => {
  assert.match(app, /const logMe = \(text\) => \{ settleLive\(\); logMsg\("me", esc\(window\.NavSensitive \? window\.NavSensitive\.redact\(text\) : text\)\); \};/, "내 말을 남기기 전에 지금 말부터");
  assert.match(app, /function settleLive\(\) \{/);
  assert.match(app, /const chip = \(a\) => btn\(\{ \.\.\.a, chip: !a\.quiet \}\);/, "quiet 칩은 내 말로 쌓지 않는다");
  assert.match(app, /passing: true, \/\/ 초안 확인은 카드 하나/, "초안 확인 말은 지나는 말");
  assert.match(app, /초안을 확인했어요/, "끝나면 한 줄");
});

test("app.js — C-37: 단계 결과(results)를 남기고 도전과제의 기본은 한눈에 보기(jmap) · 2단계 초안(/api/stagedraft) · 2단계가 끝나면 문서 올리기(/api/docs, docs.js)", () => {
  const keep = /const KEEP = \[([^\]]+)\]/.exec(app)[1];
  assert.ok(keep.includes('"results"'), "단계 결과는 다시 켜도 남는다");
  assert.match(app, /st\.results = \{ \.\.\.st\.results, \[st\.quest\.chap\]: \{ \.\.\.QU\.resultOf\(st\.quest\), at: ymd\(\), check: checkOf\(j\)/, "보고가 된 퀘스트의 결과 + 확인한 날 · 완료 기준(C-39 — R-10부터 checkOf: why · skipped도)");
  assert.match(app, /function treeMap\(cur\)/); assert.match(app, /"jmap-fill": /);
  assert.match(app, /callAI\("\/api\/stagedraft", \{ stage: n, tier: st\.tier, idea, prev, base: baseText\(\) \}\)/, "2단계 초안 — 받은 글 · 1단계 결과");
  assert.match(app, /callAI\("\/api\/docs", \{ topic: st\.topic, idea: st\.idea \|\| "", source: st\.source \|\| "", results: shipResults\(\), card: st\.card \|\| null, /, "문서 올리기 — 결과 · 처음 말한 것만 보낸다(경로 · 글은 서버가 docs.js로)");
  assert.match(read("navigator/index.html"), /docs\.js/, "미리 보기도 같은 docs.js");
});

// ── C-39(2026-10-25, 이재엽 "3단계에서 … 초안들 보여줘 · PRD처럼 공식문서들로 … 증빙 · 도전과제에서 … 어떻게 넣고 어떤 부분을 했는지 이어져서") ──
test("app.js — C-39: 고르는 칩은 누가 정했나 = 고름(pick) · 관문을 지난 날(passed) · 2단계부터 관문마다 문서 올리기 · 3단계 초안은 지난 단계 전부 · 도전과제는 네 칸 흐름과 재료", () => {
  for (const a of ["draft-who", "draft-pick", "draft-size"]) assert.match(app.slice(app.indexOf(`"${a}": `), app.indexOf(`"${a}": `) + 400), /"pick"\)/, `${a}는 고름`);
  assert.match(app, /\[s\.n\]: \{ \.\.\.st\.results\[s\.n\], passed: ymd\(\), learned/, "관문을 지난 날");
  assert.match(app, /FDOCS && s\.n >= 1 && st\.results\[0\] && st\.results\[1\]\) \{ st\.ship = \{ phase: "offer" \}/, "2단계부터 관문마다 — 마지막(8단계) 관문도(다음 단계가 없어도)");
  assert.match(app, /filter\(\(k\) => k < n\)\.sort\(\(a, b\) => a - b\)\.map\(\(k\) => \(\{ stage: k, items:/, "초안에는 지난 단계 결과 전부");
  for (const k of ["넣은 것", "플로로가 한 것", "내가 정한 것", "관문", "jm-ref", "이 단계 전에 준비할 것"]) assert.ok(app.includes(k), k);
});

// ── C-40(2026-10-26, 이재엽 "4 ~ 8단계 … 예시 … 선택 · 너무 느려 · 퀘스트에서도 … 어렵게") — 새 맥락 리뷰 뒤 ──
test("app.js — C-40: 1단계 '남은 칸 모두 맞아요'는 만드는 크기도 권한 크기로 · 미리 부른 초안은 같은 기다림 화면(callAI pending) · 확인한 대로(checkBy)는 그 보고에만", () => {
  assert.ok(!app.includes('"draft-all"') && !app.includes('act: "draft-all"'), "C-56 R-3(새 맥락 리뷰 2026-10-28): '남은 칸 모두 맞아요'는 뺐다 — 옮겨 온 칸은 미리 채워지므로 남은 칸은 하나씩");
  assert.match(app, /async function callAI\(url, body, pending = null\)/); assert.match(app, /callAI\(null, null, hit\.p\)/);
  assert.match(app, /function landed\(j0, tokens, sent = st\.text, checkBy = ""\)/);   // R-10(2026-10-27): 들어온 판정 j0에 코드 규칙(gateRules)을 거친 j를 쓴다 assert.ok(!app.includes("checkByNext"), "전역 값 없음");
});

// F-68(2026-10-28, 이재엽 버튼 "통째로 파일에"): 받은 글은 자르지 않고 기록(source)에 두고 문서로 묶을 때 docs/00-source/idea.md로. AI에 넘기는 앞 400자(idea)는 그대로 — 잘라 넘기면 화면에 한 줄
test("app.js — 받은 글 전부(source)를 기록에 두고 /api/docs에 보낸다, 400자를 넘으면 '앞 400자만 넘겨요' 한 줄, API.md 3-23에 source", () => {
  const a = read("navigator/app.js");
  assert.match(a, /"results", "prep", "source", "card"\]/, "source는 기록(KEEP)에");
  assert.match(a, /st\.source = text;/, "처음 말한 글 전부"); assert.match(a, /source: st\.source \|\| ""/, "/api/docs에 source");
  assert.match(a, /앞 \$\{N\.IDEA_MAX\}자만/, "잘라 넘기면 화면에 한 줄");
  assert.match(fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/API.md"), "utf8"), /`source`[^\n]*64KB/, "API.md 3-23");
});

// C-56 R-3(2026-10-28): 상태 넷을 화면에 — 초안이 오면 applyStates(옮겨 온 칸은 '옮김'으로 미리, 건너뛸 칸은 '건너뜀 — 까닭'), 판정에서 건너뜀은 넘김(까닭) · 먼저는 안 됨, '남은 칸 모두 맞아요'는 옮겨 온 칸에만, 공책 줄의 꼬리표, 서버가 queststate.js를 내준다
test("app.js — 상태 넷: applyStates가 초안 뒤에 붙고, gateApply가 건너뜀 → 넘김(까닭) · 먼저 → 안 됨, 모두 맞아요는 옮겨 온 칸에만, 먼저 카드(갈 곳 · 아직 못 함)", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const QS = window\.NavQuestState/); assert.match(a, /applyStates\(QU\.withDraft\(/); assert.equal((a.match(/applyStates\(QU\.withStageDraft\(/g) || []).length, 2, "연습 · 진짜 초안 둘 다");
  assert.match(a, /if \(x\.state === "skip"\) return \{ \.\.\.c, met: true, skipped: true, reason: x\.why \}; if \(x\.state === "first"\) return \{ \.\.\.c, met: false, why: "first" \};/);
  assert.match(a, /\.\.\.\(skipOf\(j\) \? \{ skip: skipOf\(j\) \} : \{\}\)/, "결과에 건너뜀 까닭(F-62와 같은 줄)");
  assert.ok(!/act: "draft-all"/.test(a), "'남은 칸 모두 맞아요' 단추 없음 — 옮겨 온 칸은 미리 채워지니 남은 칸은 하나씩(새 맥락 리뷰 2026-10-28)"); assert.match(a, /"first-go": /); assert.match(a, /"first-notyet": /); assert.match(a, /class="qs qs-\$\{x\.state\}"/);
  assert.match(read("navigator/index.html"), /queststate\.js/); assert.match(fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8"), /"queststate\.js"/);
});

// C-56 R-1(2026-10-28, 이재엽 버튼 "1단계 관문에서"): 1단계 관문 카드에 기준 카드(옮겨 온 줄은 출처 칩 · 성공은 사람이 채우는 빈칸) → 지나면 st.card(기록)에, /api/docs에 card로, 카드를 고치면 준비된 퀘스트를 다시 짓는다
test("app.js — 기준 카드: 1단계 관문에 보이고(basecard.js), 성공 칸을 적으면 '직접', 지나면 기록 · 문서로, 고치면 준비된 퀘스트 다시", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const BC = window\.NavBaseCard/); assert.match(a, /"prep", "source", "card"\]/, "기록(KEEP)에");
  assert.match(a, /s\.n === 0 && BC \? baseCardHTML\(/, "1단계 관문 카드의 몸통"); assert.match(a, /data-act="card-field"/, "사람이 채우는 칸");
  assert.match(a, /st\.card = BC\.withEdits\(BC\.build\(\{ results: st\.results, source: st\.source \}\), st\.cardEdits\)/, "지날 때 카드를 기록에");
  assert.match(a, /card: st\.card \|\| null/, "/api/docs에 card"); assert.match(a, /"card-edit": /, "고치면 다시 짓는다");
  assert.match(read("navigator/index.html"), /basecard\.js/); assert.match(fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8"), /"basecard\.js"/);
});

// C-56 R-2(2026-10-28): 화면은 이름을 크게(nameOf) · 방법 이름은 회색 꼬리표, 초안 요청에 기준 카드(base)를, 2단계 끝 그리기는 진짜 AI면 /api/prepare(한 번)로 — 못 받으면 규칙(stagemap)으로
test("app.js — 이름은 nameOf로(공책 · 확인 카드 · 캔버스 ③ · 오른쪽 칸), 초안 요청에 base, prep-draw는 live면 /api/prepare → 규칙 카드와 합침", () => {
  const a = read("navigator/app.js");
  assert.ok((a.match(/QU\.nameOf\(q, i\)/g) || []).length >= 4, "이름은 nameOf"); assert.match(a, /class="method"/, "방법 이름 꼬리표");
  assert.match(a, /callAI\("\/api\/stagedraft", \{ stage: n, tier: st\.tier, idea, prev, base: baseText\(\) \}\)/, "초안 요청에 기준 카드");
  assert.match(a, /callAI\("\/api\/prepare", \{ tier: st\.tier, idea: ideaNow\(\), prev: prevOf\(2\), base: baseText\(\) \}\)/, "준비 요청은 AI 한 번"); assert.match(a, /mergePrepared\(/, "규칙 카드와 합침");
  assert.match(fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/API.md"), "utf8"), /POST \/api\/prepare/, "API.md");
});

// C-56 R-4(2026-10-28): 묻는 카드 · 확인 카드에 '폴더에서 찾기' 칩 — /api/find로 후보 줄을 받아 원문(파일 · 줄)과 나란히, '이 줄로'를 누르면 그 줄 그대로 '옮김'(by moved), 원문은 파일 보기로 연다. 서버 없이 · 연습은 칩이 없다
test("app.js — 폴더에서 찾기: 칩 → /api/find → 후보 줄 카드(파일 · 줄 · 원문) → '이 줄로' = fillNow(text, 'moved')", () => {
  const a = read("navigator/app.js");
  assert.match(a, /act: "find-lines"/, "칩"); assert.match(a, /fetch\(`\/api\/find\?q=\$\{encodeURIComponent\(/, "서버에서 찾는다"); assert.match(a, /"find-use": /, "이 줄로");
  assert.match(a, /fillNow\(x\.text, "moved"\)/, "그 줄 그대로 옮김"); assert.match(a, /class="found"/, "후보 줄 카드"); assert.match(a, /canLive && st\.mode !== "fixture"/, "연습 · 서버 없이는 없다");
  assert.match(fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/API.md"), "utf8"), /GET \/api\/find/, "API.md");
});

// C-56 R-5(2026-10-28, 이재엽 버튼 "다음 단계 미리까지"): 훅 알림(일을 마쳤어요) 뒤 몇 초 모아 지금 단계 초안을 방금 한 일로 다시 맞추고(/api/stagedraft work), 다음 단계 초안도 다시 미리 부른다. '방금 바뀜' 띠 한 줄, 사람이 적은 칸은 덮지 않고 '다시 볼까요?'
test("app.js — 작업을 따라: onEvent → scheduleRefit(몇 초 모음) → /api/stagedraft에 work → QU.refit → 띠 + 다시 볼까요 칩 → 다음 단계 미리(prefetch). 진짜 AI 모드만", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const REFIT_MS = \d+/, "모으는 시간"); assert.match(a, /scheduleRefit\(ev\)/, "알림에서"); assert.match(a, /QU\.refit\(/, "덮지 않는 규칙은 quest.js");
  assert.match(a, /body: JSON\.stringify\(\{ stage: q\.chap, [^}]*work[^}]*\}\)/, "방금 한 일을 보낸다"); assert.match(a, /방금 바뀜/, "띠"); assert.match(a, /"refit-use": /, "새 줄로"); assert.match(a, /"refit-keep": /, "그대로");
  assert.ok(/pre = null;\s*prefetch\(st\.quest\)/.test(a.slice(a.indexOf("function refitNow"))), "다음 단계 초안도 다시 미리(버튼 '다음 단계 미리까지')");
  assert.match(a.slice(a.indexOf("function scheduleRefit")), /st\.mode !== "live"/, "연습은 하지 않는다");
});

// C-54 ⑧ ⑨(2026-10-28, 디자인 넘김 ⓔ+ · 이재엽 버튼 "둘다 할것" · "'흐름 따라가기'에서만"): 지도의 끝난 · 지금 카드를 누르면 그 자리에서 커져(누르기 + 확대) 줄 하나 = 할 일 → 문서의 절 ← 재료, 줄을 누르면 오른쪽 칸에
//   누가 정했나 · 재료가 온 곳 · 이 줄을 쓰는 다음 단계 · 파일 보기 / 틀로 맡기기(빈 칸은 플로로 초안 + '채팅에서 같이 적기'). 흐름 보기에만 짝 선(세로 길 셋)과 '두 칸 나란히'
test("app.js — 얼음 조각 가까이: 고른 끝난 · 지금 카드는 big + 줄(.sm-row, map-line) → wside .ws-line(누가 · 재료 · 다음 단계 · 열기 · 채팅); 흐름 보기에 .jm-rails + pair-sel → .jm-side", () => {
  const a = read("navigator/app.js"), c = read("navigator/app.css");
  assert.match(a, /class="qcard readonly"/, "끝낸 장 카드를 누르면 읽기만 카드가 올라온다(C-69, 2026-10-30 — 전에는 그 자리에서 커졌다)"); assert.match(a, /act: done \? "map-line" : ""/, "줄 하나 = 할 일"); assert.match(a, /"map-line": /); assert.match(a, /"map-chat": /, "채팅에서 같이 적기");
  assert.match(a, /class="ws-line"/, "오른쪽 칸"); assert.match(a, /SM\.usedBy\(/, "이 줄을 쓰는 다음 단계"); assert.match(a, /class="jm-rails"/, "짝 선"); assert.match(a, /"pair-sel": /); assert.match(a, /class="jm-side \$\{pairSel\[0\]\}"/, "두 칸 나란히");
  assert.ok(!/cardsMap[\s\S]*?jm-rails/.test(a.slice(a.indexOf("function cardsMap"), a.indexOf("function questBoard"))), "짝 선은 지도(카드)에는 없다 — 흐름 따라가기에서만");
  assert.ok(!c.includes(".sm-cell.big{") && !c.includes("@keyframes sm-zoom"), "그 자리에서 커지는 카드 규칙은 뺐다(C-69 — 끝낸 장은 읽기만 카드가 올라온다, 2026-10-30)"); assert.match(c, /\.jm-rails i\.a\{/, "길 셋의 색");
});

// claude-drafted: 2026-10-30 — 퀘스트 탭 합치기 TASK T08(C-65 · C-66): 탭 셋, 세로 줄 · 장 화면 없음, 옛 길(tree · tab=learn)은 합친 탭으로
test("app.js — C-65 · C-66: 탭 셋(캔버스 · 퀘스트 · 책), 세로 줄(.vtabs) · 장 화면(.learnbox · .tu-chips · .chain · .bn) · treeChap · tuCard 없음, tree-chap · tree-map · tu-sel 누르기 없음, openQwin(\"tree\") 0곳, 옛 값 tree · tab=learn · tab=map은 quest로", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const QTABS = \[\["canvas", "캔버스"\], \["quest", "퀘스트"\], \["lib"/, "탭 셋");
  for (const gone of ['class="vtabs', 'class="learnbox', 'class="tu-chips', 'class="chain', 'class="bn ', "treeChap", "tuCard", "function treePane", 'openQwin("tree")', '"tree-chap": ', '"tree-map": ', '"tu-sel": ', 'class="ev"', "rewardSlots"]) assert.ok(!a.includes(gone), `${gone} — 뺐다(C-66 · C-70)`);
  assert.match(a, /st\.qtab = \(tab === "tree" \? "quest" : tab\) \|\| st\.qtab;/, "openQwin: 옛 도전과제는 합친 탭으로");
  assert.match(a, /if \(st\.qtab === "tree"\) st\.qtab = "quest";/, "저장된 옛 탭 값도");
  assert.match(a, /st\.qtab = q\.tab === "map" \? "quest" : "lib";/, "#tab=map도");
  assert.match(a, /function questBoard\(\)/); assert.match(a, /data-act="quest-down"/); assert.match(a, /data-act="quest-up"/); assert.match(a, /keep\(\["questUp", "qview"\]\)/, "카드 올림 · 내림은 이 컴퓨터에 기억(두승현 2026-10-30)");
  assert.match(a, /class="qcard qpre"/, "받기 전 카드(C-70)"); assert.match(a, /TU \? TU\.forChap\(n\)/, "'처음 쓰는 기능' 한 줄(PRD 9절 3번 기본값)");
  assert.match(a, /termTag\(o\.term\)/, "용어 풀이(FR-13)는 줄의 '용어:' 칩으로 남는다");
});
