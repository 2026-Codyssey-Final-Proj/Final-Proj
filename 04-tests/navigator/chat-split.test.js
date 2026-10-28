// claude-drafted: 2026-10-29 — 작업실 개편 TASK PR ③(C-61 플로로 자리 · 대화 → 칸으로 정리, 두승현 PRD 2026-10-28 · 이재엽 승인 2026-10-29 "2차는 대회 뒤"). T14 · T15 · T18 · T20의 글자 모양 + navigator.js parseChat의 단위 시험.
//   화면에서 재는 것(보내기만으로는 정한 줄이 안 바뀜 · 정리 카드 → 적기 → 옆 칸 0.3초 · 움직임 줄이기)은 04-tests/e2e/chat-split.test.js, 서버 길은 chat-api.test.js
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
  assert.match(a, /callAI\("\/api\/chat", \{ text: t, stage: q\.chap, tier: st\.tier, quest: \{ objs: q\.objs\.map\(\(o\) => \(\{ name: o\.name \}\)\), lines: q\.lines \}, history:/, "진짜 AI는 /api/chat에 지금 칸 · 최근 말과 함께");
  assert.match(a, /if \(st\.mode !== "live" \|\| !canLive\) \{ st\.tidy = \{ fills: \[\{ i: QU\.curIdx\(q\), text: t \}\]/, "연습 · 서버 없음은 보낸 말을 지금 칸의 후보로(AI 없이)");
  assert.match(a, /if \(!skipCheck && guard\(t, "chat"\)\) return;/, "비밀값처럼 보이면 먼저 묻는다(받은 글과 같은 규칙)"); assert.match(a, /chat: \(\) => chatSend\(chatText, true\)/, "'괜찮아요, 보낼게요'로 이어진다");
  assert.match(a, /"tidy-fill": \(\) => \{ const t = st\.tidy; if \(!t \|\| !st\.quest\) return; st\.tidy = null; st\.islBig = false; let q = st\.quest; for \(const f of t\.fills\) q = QU\.fill\(q, f\.i, f\.text, "chat"\); st\.quest = q; afterFill\(\); \}/, "[칸 n개에 적기] — 누가 정했나 '대화', 섬은 옆으로");
  assert.match(a, /"tidy-more": \(\) => set\(\{ tidy: null \}\)/, "[더 이야기하기]");
  assert.match(a, /label: `칸 \$\{n\}개에 적기`, act: "tidy-fill", key: "Enter", pri: true \}, \{ label: "더 이야기하기", act: "tidy-more"/, "정리 카드의 단추 둘");
  assert.match(a, /<ol class="tidy">\$\{st\.tidy\.fills\.map\(\(f\) => `<li><b>\$\{ROMAN\(f\.i\)\} \$\{esc\(QU\.nameOf\(q, f\.i\)\)\}<\/b><span>\$\{esc\(f\.text\)\}<\/span><\/li>`\)/, "정리 카드 — 칸 이름 · 칸마다 한 줄");
});

test("섬 자리 — 칸이 하나도 적히지 않았고(또는 관문에서 물을 때) 섬이 펼쳐져 있으면 작업 칸 전체(center), 사람이 적기를 누르면 옆 칸으로 0.3초(움직임 줄이기면 바로). AI 판단으로는 안 옮긴다. 머리 줄의 '크게 · 옆으로'", () => {
  assert.match(a, /const bigAuto = \(\) => !!\(QU && \(\(st\.quest && st\.quest\.phase === "quest" && !st\.quest\.draft && !st\.quest\.objs\.some\(\(_, i\) => QU\.filled\(st\.quest, i\)\)\) \|\| st\.screen === "gate"\)\);/);
  assert.match(a, /const islBig = \(\) => \(st\.islBig == null \? bigAuto\(\) : !!st\.islBig\);/, "사람이 고른 값이 먼저");
  assert.match(a, /\$\{!colFolded\(\) && islBig\(\) \? " center" : ""\}/, "옆 칸 class");
  assert.match(a, /<div class="isl-col side-right narrow\$\{islBig\(\) \? " center" : ""\}">/, "브라우저 판도");
  assert.match(a, /"isl-big": \(\) => set\(\{ islBig: !islBig\(\) \}\)/, "머리 줄 단추");
  assert.match(a, /data-act="isl-big" aria-pressed="\$\{islBig\(\)\}"/);
  assert.ok(!/st\.islBig = true/.test(a.replace(/"isl-big": [^\n]*/, "")), "코드(AI 답)가 스스로 섬을 크게 하지 않는다 — 사람이 누를 때만");
  for (const css of [c, h]) {
    assert.match(css, /:has\(>\.isl-col\.center\)\{grid-template-columns:auto minmax\(0,1fr\)\}/, "가운데 — 작업 칸 전체");
  }
  assert.match(c, /\.wsx\{transition:grid-template-columns \.3s cubic-bezier\(\.2,\.8,\.2,1\)\}/, "0.3초"); assert.match(c, /@media \(prefers-reduced-motion:reduce\)\{\.wsx\{transition:none\}\}/, "움직임 줄이기");
  assert.match(h, /#root\{[^}]*transition:grid-template-columns \.3s/); assert.match(h, /@media \(prefers-reduced-motion:reduce\)\{#root\{transition:none\}\}/);
  assert.match(c, /\.isl-col\.center \.mc\.chat:not\(\.hello\) \.who\{display:none\}/, "첫 말 뒤에는 플로로 그림 없이 채팅만");
  assert.match(w, /hd\.hidden = !side \|\| folded \|\| center;/, "가운데일 때는 손잡이 없음");
});

test("대화가 비어 있으면 플로로 · 질문 하나 · 입력 상자 하나만(칩 줄 없음) — 질문은 셋 중 하나(문구는 예시). 가운데 대화에는 늘 있는 칩 줄이 없다", () => {
  assert.match(a, /if \(islBig\(\) && st\.chat\.length <= \(st\.chatMark \|\| 0\) && !st\.pane && !st\.settings && st\.quest && !st\.tidy\)/, "빈 대화 + 가운데");
  assert.match(a, /const qs = \["어떤 프로젝트를 구상하고 있나요\?", "어떤 미션을 수행하고 계시나요\?", "지금 작업 중인 내용을 공유해 주세요, 함께 논의해요~"\];/);
  assert.match(a, /<section class="mc chat hello tone-blue"><div class="who">\$\{petCat\("happy", 150\)\}<\/div><div class="main"><b class="say hello-q">/, "플로로 · 질문 · 입력 상자");
  assert.match(a, /const more = islBig\(\) \? \[\] : \[/, "가운데 대화에는 칩 줄 없음(C-60)");
  assert.match(a, /const questStarted = \(\) => \{ st\.islBig = null; st\.chatMark = st\.chat\.length; st\.tidy = null; \};/, "새 단계를 시작하면 가운데로 · 대화 표시 처음부터");
  assert.ok((a.match(/questStarted\(\);/g) || []).length >= 2, "퀘스트를 만드는 곳마다");
});

test("quest.js — 누가 정했나에 '대화'(chat)", () => {
  assert.ok(QU.BY.includes("chat")); assert.equal(QU.BY_WORD.chat, "대화");
  const q = QU.makeQuest({ n: 2, title: "t", criteria: [{ text: "기능 문장" }, { text: "숫자로" }] }, [{ text: "기능 문장" }, { text: "숫자로" }]);
  const f = QU.fill(q, 1, "회원 열두 명", "chat");
  assert.equal(f.by[1], "chat"); assert.deepEqual(f.lines[1], ["회원 열두 명"]);
});

test("navigator.js — chatPrompt · CHAT_SCHEMA · parseChat: 답은 reply + fills(i는 지금 칸 안 · 한 칸에 하나 · 빈 글 버림 · 400자), 모양이 틀리면 null", () => {
  assert.equal(Nav.CHAT_MAX, 2000); assert.equal(Nav.CHAT_HISTORY_MAX, 12); assert.equal(Nav.CHAT_LINE_MAX, 300);
  const p = Nav.chatPrompt(2, "Xpress", { text: "기능 정리가 막막해요", cells: [{ name: "기능 문장", line: "" }, { name: "숫자로", line: "열두 명" }], history: [{ who: "me", text: "안녕" }, { who: "floro", text: "안녕하세요" }], idea: "독서 모임 알림 앱" });
  for (const s of ["3단계", "(1) 기능 문장 — 비었음", "(2) 숫자로 — 적은 줄: 열두 명", "<보낸말>", "기능 정리가 막막해요", "<최근대화>", "사용자: 안녕", "플로로: 안녕하세요", "<처음말한것>", "fills"]) assert.ok(p.includes(s), s);
  assert.equal(Nav.CHAT_SCHEMA.required.join(","), "reply,fills");
  const r = Nav.parseChat({ reply: " 칸 둘에 적을 수 있어요 ", fills: [{ i: 0, text: " 신청하면, 앱은 받는다 " }, { i: 0, text: "겹침" }, { i: 5, text: "밖" }, { i: 1, text: "  " }, { i: "1", text: "글자 번호" }] }, 2);
  assert.deepEqual(r, { reply: "칸 둘에 적을 수 있어요", fills: [{ i: 0, text: "신청하면, 앱은 받는다" }] });
  assert.deepEqual(Nav.parseChat({ reply: "답만", fills: [] }, 5), { reply: "답만", fills: [] });
  assert.equal(Nav.parseChat({ reply: "", fills: [] }, 5), null); assert.equal(Nav.parseChat({ reply: "a" }, 5), null); assert.equal(Nav.parseChat(null, 5), null);
  assert.equal(Nav.parseChat({ reply: "x", fills: [{ i: 0, text: "가".repeat(500) }] }, 1).fills[0].text.length, 400, "줄은 400자까지");
});
