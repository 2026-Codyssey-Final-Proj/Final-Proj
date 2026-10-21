// claude-drafted: 2026-10-20 — C-13 모드 둘(이재엽 "버튼식으로 준비가 되어있는 공간이 기본값" · "모드를 넣는다는게 맞는 표현", 버튼 "섬 안에서 바로").
// 넘김 문서(fable-handoff-2026-10-20-modes.md) 6절 — 모드 규칙(navigator.js nextPlace, 순수)과 app.js가 그 규칙대로 이어 붙였는지(글로), 섬의 알림 · AI 진행 판이
// 모아 보기 창의 순수 함수(hub.js)를 그대로 쓰며 C-12 규칙(파일 내용을 받지 않음)을 지키는지, hub.js의 화면 코드가 섬에서는 돌지 않는지를 본다.
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

test("nextPlace — 켤 때 기본, 바이브 코딩 단추 · 주소 장면 · 모아 보기의 들어가기는 바이브 코딩, 집은 기본. 접힘 · 펼침 · 서고 다녀옴으로는 바뀌지 않는다", () => {
  assert.deepEqual(Nav.PLACES, ["base", "vibe"]);
  assert.equal(Nav.nextPlace("vibe", "start"), "base");
  assert.equal(Nav.nextPlace("base", "vibe"), "vibe");
  assert.equal(Nav.nextPlace("base", "scene"), "vibe");
  assert.equal(Nav.nextPlace("base", "enter"), "vibe");
  assert.equal(Nav.nextPlace("vibe", "home"), "base");
  for (const ev of ["fold", "unfold", "library", "idle", "", undefined]) {
    assert.equal(Nav.nextPlace("vibe", ev), "vibe", `${ev}: 바이브 코딩 그대로`);
    assert.equal(Nav.nextPlace("base", ev), "base", `${ev}: 기본 그대로`);
  }
  assert.equal(Nav.nextPlace("zzz", ""), "base", "모르는 값은 기본");
});

test("app.js — 모드는 st.place(mode · home이라는 이름은 쓰지 않는다), 이 창의 sessionStorage에만(기록 KEY에는 없음), 집 단추 · 바이브 코딩 단추 · 들어가기 · 주소 장면이 규칙을 부른다", () => {
  assert.match(app, /place: "base", pane: "",/);
  assert.doesNotMatch(app, /st\.place === "home"|place: "home"|placeMode/, "이름 겹침(넘김 문서 10절)");
  assert.match(app, /const PLACE_KEY = "floe:place", SEEN_KEY = "floe:alerts-seen";/);
  assert.match(app, /st\.place = N\.nextPlace\(SESS && SESS\.getItem\(PLACE_KEY\) === "vibe" \? "vibe" : "base", ""\);/, "켤 때 — 이 창에 남은 것만, 없으면 기본");
  const keep = /const KEEP = \[([^\]]+)\]/.exec(app)[1];
  assert.ok(!keep.includes('"place"') && !keep.includes('"pane"'), "기록(localStorage)에는 넣지 않는다 — 다음에 켤 때는 늘 기본");
  assert.match(app, /base: \(\) => \{ setPlace\("home"\); set\(\{ settings: false, pane: "" \}\); \}/, "집 — 열어 둔 판도 닫는다");
  assert.match(app, /"go-vibe": \(\) => \{ setPlace\("vibe"\); set\(\{ tab: "today"/, "바이브 코딩 단추 → 이번 단계");
  assert.match(app, /if \(q\.base\) \{ st\.place = "base"; st\.pane = q\.pane === "alerts" \|\| q\.pane === "ai" \? q\.pane : ""; \} else setPlace\(q\.back \? "library" : "scene"\);/, "주소 장면은 바이브 코딩, #base만 기본, 서고에서 돌아온 &back은 떠난 모드 그대로(F-36)");
  assert.match(app, /setPlace\("enter"\); st\.tab = "today"; go\("home"\);/, "모아 보기의 들어가기");
  assert.match(app, /const body = st\.pane \? basePane\(st\.pane\) : chatCard\(momentToday\(\)\);/, "판(알림 · AI 진행)이 아니면 채팅(C-22, 2026-10-21 — 기본 화면의 단추 넷은 뺐다)");
});

// 2026-10-21 C-22(게임식 디자인 1차 뼈대): 기본 화면의 단추 넷(바이브 코딩 · 서재 · 알림 · AI 진행)과 바이브 코딩의 탭 넷은 뺐다 — 위 줄 하나, 채팅 중심 섬.
//   알림 · AI 진행 판은 그대로(채팅의 칩 '알림' · 허락 카드가 오면 저절로), 서재는 설정 창의 '서재로 가기' · 퀘스트 창의 서고 탭
test("app.js — 채팅 중심 섬(C-22): 위 줄 하나(집 · 단계 띠 · 조개 · 퀘스트 창 · 모아 보기 · 설정 · 핀 · 접기, 탭 없음) · 지금 한 줄은 첫 카드의 작은 줄 · 알림은 칩. 인사가 끝나면 채팅", () => {
  assert.ok(!app.includes("BASE_BTNS") && !app.includes("function baseBody") && !app.includes('<div class="tabs"'), "단추 넷 · 탭 넷이 없다");
  assert.match(app, /return `<div class="tb">\$\{homeBtn\(!st\.pane\)\}<span class="tb-stage" aria-live="polite">\$\{stageBand\(\)\}<\/span>/, "위 줄 하나 — 집은 판을 열었을 때만 눌리지 않은 모양");
  assert.match(app, /<button class="ti" data-act="qwin" aria-pressed="\$\{st\.qwin\}" aria-label="퀘스트 창"/, "퀘스트 창 단추");
  assert.match(app, /out\.push\(\{ label: unreadN\(\) \? `알림 \$\{unreadN\(\)\}` : "알림", act: "base-alerts", kind: "ghost" \}, \{ label: "도전과제", act: "qwin-tree", kind: "ghost" \}\);/, "알림 · 도전과제 칩");
  assert.match(app, /return st\.back \|\| C\.greeting\(new Date\(\)\.getHours\(\)\);/, "지금 한 줄 — 알림 · AI가 한 일이 없으면 인사");
  assert.match(app, /foot: esc\(nowLine\(\)\)/, "지금 한 줄은 첫 카드의 작은 줄");
  assert.match(app, /go\("home"\);   \/\/ 인사가 끝나면 인사 카드 대신 기본 화면/);
  assert.match(app, /else if \(st\.ui === "greet"\) st\.ui = "home";/, "인사 움직임이 없어도 기본 화면");
  assert.match(app, /if \(d\.open\) \{ setPlace\("vibe"\); st\.tab = "today"; go\("home"\); \}/, "처음 설정의 '시작하기'는 바이브 코딩으로");
});

test("app.js — 알림 · AI 진행 판은 섬 안에서 바로, 모아 보기 창의 순수 함수(FloeHub)와 한 줄 글(NavSteps)을 그대로 쓴다. '크게 보기'는 모아 보기 창의 그 칸", () => {
  assert.match(app, /const HUB = window\.FloeHub, STEPS = window\.NavSteps, MO = window\.FloeMorph;/);
  assert.match(app, /kind === "ai" \? HUB\.aiHTML\(aiSessions, aiMode, STEPS, now\) : HUB\.alertsHTML\(st\.alerts, now\)/);
  assert.match(app, /HUB\.unread\(st\.alerts, seenAlerts\)/, "읽지 않은 수");
  assert.match(app, /HUB\.anyWorking\(aiSessions\)/, "일하는 중 점");
  assert.match(app, /"hub-alerts": \(\) => openHub\("alerts"\), "hub-ai": \(\) => openHub\("ai"\),/);
  assert.match(app, /fetch\(`\/api\/steps\?since=\$\{aiLatest\}`/, "AI 진행만 묻는다");
  assert.match(app, /if \(st\.ui !== "home"\) return; const was = aiLatest;/, "펼쳐져 있을 때만 2초마다(C-22부터는 채팅의 '일하고 있어요' 띠가 쓴다)");
  assert.match(app, /aiSessions = HUB\.exampleSessions\(STEPS, Date\.now\(\)\)/, "서버 없이는 예시(FR-10)");
  // C-12 규칙 — 파일 내용 · 고친 글 · 명령 결과를 다루는 이름이 섬에 없다
  for (const bad of ["tool_input", "tool_response", "old_string", "new_string", "content:"]) assert.ok(!app.includes(bad), `app.js에 ${bad}가 없어야`);
  const html = read("navigator/index.html");
  assert.match(html, /<script src="\.\.\/hub\/hub\.js"><\/script>\s*<script src="\.\.\/\.\.\/03-backend\/navigator\/steps\.js" onerror="this\.remove\(\)"><\/script>/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), /data-space/, "섬에는 모아 보기 창의 왼쪽 칸이 없다(주석 빼고) — hub.js의 화면 코드가 돌지 않는 조건");
});

test("hub.js — 화면 코드는 왼쪽 칸([data-space])이 있는 페이지에서만 돈다. 순수 함수는 그대로(require로도 열린다)", () => {
  const js = read("hub/hub.js");
  assert.match(js, /if \(typeof document === "undefined" \|\| !document\.querySelector\("\[data-space\]"\)\) return;/);
  assert.ok(js.indexOf("root.FloeHub = api") < js.indexOf('document.querySelector("[data-space]")'), "순수 함수는 그 전에 내보낸다");
  assert.equal(typeof H.alertsHTML, "function");
  assert.equal(typeof H.aiHTML, "function");
  assert.ok(read("hub/index.html").includes('data-space="vibe"'), "모아 보기 창에는 있다");
});

test("쉬운 말(FR-13) — 알림 · AI 진행 판과 채팅 중심 섬의 화면 글에 전문 용어가 없다 (navigator.test.js의 app.js 전체 검사와 별개로 새 글만 한 번 더)", () => {
  // 화면에 보이는 글만(따옴표 · 역따옴표 안) — 주석의 '판정' 같은 코드 설명은 보지 않는다
  const strings = (s) => [...s.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map((m) => m[2]).join("\n");
  const pane = app.slice(app.indexOf("const PANE = {"), app.indexOf("function islandHTML")), chat = app.slice(app.indexOf("// ── 채팅 중심 섬(C-22"), app.indexOf("// 단계 문서 — 왼쪽 플로로와 버튼"));
  for (const w of Nav.JARGON) assert.ok(!strings(pane).includes(w) && !strings(chat).includes(w), `전문 용어 ${w}`);
  for (const word of ["알림", "AI 진행", "크게 보기", "단추로"]) assert.ok(pane.includes(word), word);
  for (const word of ["퀘스트 받기", "완료 보고", "보내기", "도전과제", "퀘스트를 시작하시겠습니까?"]) assert.ok(chat.includes(word), word);
});
