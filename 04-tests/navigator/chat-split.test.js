// claude-drafted: 2026-10-29 — 작업실 개편 TASK PR ③(C-61 플로로 자리 · 대화 → 칸으로 정리, 두승현 PRD 2026-10-28 · 이재엽 승인 2026-10-29 "2차는 대회 뒤"). T14 · T15 · T18 · T20의 글자 모양 + navigator.js parseChat의 단위 시험.
//   화면에서 재는 것(보내기만으로는 정한 줄이 안 바뀜 · 정리 카드 → 적기 → 옆 칸 0.3초 · 움직임 줄이기)은 04-tests/e2e/chat-split.test.js, 서버 길(이재엽 쪽 #246)은 chat-api.test.js
// 실행: node --test 04-tests/navigator/chat-split.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../..", f), "utf8");
const a = read("02-frontend/navigator/app.js"), c = read("02-frontend/navigator/app.css"), h = read("02-frontend/navigator/win.html"), w = read("02-frontend/navigator/win.js");
const Nav = require("../../03-backend/navigator/navigator.js"), QU = require("../../03-backend/navigator/quest.js");

test("보내기는 칸에 적지 않는다 — 퀘스트 중(초안 확인이 아닐 때) 보낸 말은 chatSend로 가고, fillNow는 초안 확인(C-36 고쳐 적기)과 정리 카드의 [칸 n개에 적기]에서만", () => {
  assert.match(a, /if \(q && q\.phase === "quest" && QU\.curIdx\(q\) >= 0\) \{ if \(q\.draft\) return fillNow\(t\); return chatSend\(t\); \}/, "보내기 → chatSend");
  assert.ok(!a.includes('if (!q.draft) say("적었어요!"); return fillNow(t);'), "옛 '보내면 곧바로 적힘' 길은 없다");
  assert.match(a, /async function chatSend\(t, skipCheck\)/);
  assert.match(a, /callAI\("\/api\/chat", \{ stage: q\.chap, tier: st\.tier, idea: ideaNow\(\), talk: talkOf\(t\), lines: q\.lines \}\)/, "진짜 AI는 /api/chat(API.md 3-31 — 이재엽 쪽 서버)에 이 단계의 대화 · 적은 줄 · 처음 말한 것");
  assert.match(a, /if \(r\.ok && typeof r\.reply === "string"\) \{[^\n]*if \(slots\.length\) st\.tidy = \{ fills: slots, reply: r\.reply \}; else say\(r\.reply\);/, "답은 reply · slots · n — 칸 제안이 있으면 정리 카드, 없으면 말만");
  assert.match(a, /const talkOf = \(t\) => \{[^\n]*\(m\.who === "me" \|\| m\.who === "floro"\) && !m\.kind/, "대화는 사람 · 플로로의 말만(알림 · 구분선 빼고), 마지막은 내 말");
  assert.match(a, /if \(st\.mode !== "live" \|\| !canLive\) \{ st\.tidy = \{ fills: \[\{ i: QU\.curIdx\(q\), text: t \}\]/, "연습 · 서버 없음은 보낸 말을 지금 칸의 후보로(AI 없이)");
  assert.match(a, /if \(!skipCheck && guard\(t, "chat"\)\) return;/, "비밀값처럼 보이면 먼저 묻는다(받은 글과 같은 규칙)"); assert.match(a, /chat: \(\) => chatSend\(chatText, true\)/, "'괜찮아요, 보낼게요'로 이어진다");
  assert.match(a, /"tidy-fill": \(\) => \{ const t = st\.tidy; if \(!t \|\| !st\.quest\) return; st\.tidy = null; st\.islBig = false; let q = st\.quest; for \(const f of t\.fills\) q = QU\.fill\(q, f\.i, f\.text, "chat"\); st\.quest = q; afterFill\(\); \}/, "[칸 n개에 적기] — 누가 정했나 '대화', 섬은 옆으로");
  assert.match(a, /"tidy-more": \(\) => set\(\{ tidy: null \}\)/, "[더 이야기하기]");
  assert.match(a, /label: `칸 \$\{n\}개에 적기`, act: "tidy-fill", key: "Enter", pri: true \}, \{ label: "더 이야기하기", act: "tidy-more"/, "정리 카드의 단추 둘");
  assert.match(a, /<ol class="tidy">\$\{st\.tidy\.fills\.map\(\(f\) => `<li><b>\$\{ROMAN\(f\.i\)\} \$\{esc\(QU\.nameOf\(q, f\.i\)\)\}<\/b><span>\$\{esc\(f\.text\)\}<\/span><\/li>`\)/, "정리 카드 — 칸 이름 · 칸마다 한 줄");
});

test("섬 자리 — 칸이 하나도 적히지 않았고(또는 관문에서 물을 때) 섬이 펼쳐져 있으면 작업 칸 전체(center), 사람이 적기를 누르면 옆 칸으로 0.3초(움직임 줄이기면 바로). AI 판단으로는 안 옮긴다. 머리 줄의 '크게 · 옆으로'", () => {
  assert.match(a, /const bigAuto = \(\) => !!\(QU && st\.quest && st\.quest\.phase === "quest" && !st\.quest\.draft && !st\.quest\.objs\.some\(\(_, i\) => QU\.filled\(st\.quest, i\)\)\);/, "칸이 빈 동안만 — 관문 · 새 단계의 '다시 가운데'는 PRD 9절 미정이라 넣지 않았다");
  assert.match(a, /const islBig = \(\) => \(st\.islBig == null \? bigAuto\(\) : !!st\.islBig\);/, "사람이 고른 값이 먼저");
  assert.match(a, /\$\{!colFolded\(\) && islBig\(\) \? " center" : ""\}/, "옆 칸 class");
  assert.match(a, /<div class="isl-col side-right narrow\$\{islBig\(\) \? " center" : ""\}">/, "브라우저 판도");
  assert.match(a, /"isl-big": \(\) => set\(\{ islBig: !islBig\(\) \}\)/, "머리 줄 단추");
  assert.match(a, /data-act="isl-big" aria-pressed="\$\{islBig\(\)\}"/);
  assert.ok(!/st\.islBig = true/.test(a.replace(/"isl-big": [^\n]*/, "")), "코드(AI 답)가 스스로 섬을 크게 하지 않는다 — 사람이 누를 때만");
  assert.match(c, /@property --col-w\{syntax:"<length-percentage>";inherits:true;initial-value:420px\}/, "옆 칸 너비는 등록한 변수 하나 — 트랙 종류가 같아 0.3초가 보간된다(새 맥락 리뷰)");
  assert.match(c, /\.wsx:has\(>\.isl-col\.center\)\{--col-w:calc\(100% - 200px\)\}/, "가운데 — 왼쪽 파일 칸만 남기고 섬");
  assert.match(c, /\.wsx\{transition:--col-w \.3s cubic-bezier\(\.2,\.8,\.2,1\)\}/, "0.3초"); assert.match(c, /@media \(prefers-reduced-motion:reduce\)\{\.wsx\{transition:none\}\}/, "움직임 줄이기");
  assert.match(h, /#root\{[^}]*transition:--col-w \.3s/); assert.match(h, /@media \(prefers-reduced-motion:reduce\)\{#root\{transition:none\}\}/);
  assert.match(w, /h\.style\.setProperty\("--col-w", center \? \(root\.querySelector\("\.wnav"\) \? "calc\(100% - 200px\)" : "100%"\) :/, "앱 창은 win.js가 같은 값을");
  assert.match(c, /\.isl-col\.center \.mc\.chat:not\(\.hello\) \.who\{display:none\}/, "첫 말 뒤에는 플로로 그림 없이 채팅만");
  assert.match(w, /hd\.hidden = !side \|\| folded \|\| center;/, "가운데일 때는 손잡이 없음");
});

test("대화가 비어 있으면 플로로 · 질문 하나 · 입력 상자 하나만(칩 줄 없음) — 질문은 셋 중 하나(문구는 예시). 가운데 대화에는 늘 있는 칩 줄이 없다", () => {
  assert.match(a, /if \(islBig\(\) && st\.chat\.length <= \(st\.chatMark \|\| 0\) && !st\.pane && !st\.settings && st\.quest && !st\.quest\.draft && !st\.tidy\)/, "빈 대화 + 가운데(초안 확인 중에는 아님) — 구분선 뒤에 말이 없다(C-63 저장된 대화에도 맞게)");
  assert.match(a, /const qs = \["어떤 프로젝트를 구상하고 있나요\?", "어떤 미션을 수행하고 계시나요\?", "지금 작업 중인 내용을 공유해 주세요, 함께 논의해요~"\];/);
  assert.match(a, /<section class="mc chat hello tone-blue"><div class="who">\$\{petCat\("happy", 150\)\}<\/div><div class="main"><b class="say hello-q">/, "플로로 · 질문 · 입력 상자");
  assert.match(a, /const more = islBig\(\) \? \[\] : \[/, "가운데 대화에는 칩 줄 없음(C-60)");
  assert.match(a, /const questStarted = \(\) => \{[\s\S]*?st\.islBig = null; st\.chatMark = st\.chat\.length; st\.tidy = null; \};/, "새 단계를 시작하면 가운데로 · 대화 표시는 구분선 뒤부터(C-63)");
  assert.ok((a.match(/questStarted\(\);/g) || []).length >= 2, "퀘스트를 만드는 곳마다");
});

test("quest.js — 누가 정했나에 '대화'(chat)", () => {
  assert.ok(QU.BY.includes("chat")); assert.equal(QU.BY_WORD.chat, "대화");
  const q = QU.makeQuest({ n: 2, title: "t", criteria: [{ text: "기능 문장" }, { text: "숫자로" }] }, [{ text: "기능 문장" }, { text: "숫자로" }]);
  const f = QU.fill(q, 1, "회원 열두 명", "chat");
  assert.equal(f.by[1], "chat"); assert.deepEqual(f.lines[1], ["회원 열두 명"]);
});
