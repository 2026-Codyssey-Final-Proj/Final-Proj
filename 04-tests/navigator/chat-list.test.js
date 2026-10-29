// claude-drafted: 2026-10-29 — 작업실 개편 TASK PR ④(C-63 대화는 하나, 단계는 바로가기 — 두승현 PRD 2026-10-28 · 이재엽 승인 2026-10-29 "저장은 이 컴퓨터의 앱 저장 곳" · "2차는 대회 뒤"). T22 ~ T26의 글자 모양.
//   화면에서 재는 것(보낸 말이 다시 켜도 남음 · 바로가기 누름 → 펼침 · 다시 누르면 접힘)은 04-tests/e2e/chat-list.test.js
// 실행: node --test 04-tests/navigator/chat-list.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../..", f), "utf8");
const a = read("02-frontend/navigator/app.js"), c = read("02-frontend/navigator/app.css"), w = read("02-frontend/navigator/win.js");

test("T23 대화 저장 — 진짜 AI 모드는 서버(API.md 3-32 /api/chatlog — 이재엽 쪽 #247, A-20 '이 컴퓨터의 앱 저장 곳')에: 켤 때 GET으로 이어서, logMsg가 add로(20개씩). 연습 · 서버 없이는 이 브라우저(localStorage)에만. 400줄 상한, 내 말은 가려서", () => {
  const keep = (a.match(/const KEEP = \[[^\]]*\]/) || [""])[0];
  for (const k of ['"chatMark"', '"chatOpen"']) assert.ok(keep.includes(k), `${k}는 이 브라우저에도(KEEP)`);
  assert.ok(!keep.includes('"chat"') && a.includes("const CHAT_KEY = `${KEY}:chat`;") && a.includes('localStorage.setItem(CHAT_KEY, JSON.stringify(st.chat)); } catch { st.chat = st.chat.slice(-100); }'), "대화는 따로 저장 — 넘치면 대화만 줄이고 다른 저장은 막지 않는다");
  assert.ok(!keep.includes("stageFiles"), "바뀐 파일은 서버가 쌓는다(3-32 changes) — 저장하지 않는다");
  assert.match(a, /const CHAT_CAP = 400;/);
  assert.match(a, /const logMsg = \(who, html, extra = \{\}\) => \{ const m = \{ who, html, at: Date\.now\(\), n: st\.quest \? st\.quest\.chap : atStage\(\), \.\.\.extra \}; st\.chat = \[\.\.\.st\.chat, m\]; const over = st\.chat\.length - CHAT_CAP; if \(over > 0\) \{ st\.chat = st\.chat\.slice\(over\); st\.chatMark = Math\.max\(0, \(st\.chatMark \|\| 0\) - over\); \} chatSeq \+= 1; chatlogAdd\(m\); \};/, "말마다 단계 번호 · 서버에 쌓기, 상한을 넘기면 오래된 것부터(단계 표시 자리도 같이)");
  assert.match(a, /const logMe = \(text\) => \{ settleLive\(\); logMsg\("me", esc\(window\.NavSensitive \? window\.NavSensitive\.redact\(text\) : text\)\); \};/, "내 말은 가려서(보안 기준 3절)");
  assert.ok(!a.includes("].slice(-60)"), "옛 60개 상한은 없다");
  assert.match(a, /if \(!Array\.isArray\(st\.chat\)\) st\.chat = \[\];/, "고장 난 기록은 버린다(load)");
  assert.match(a, /const chatLive = \(\) => canLive && st\.mode === "live";/, "서버 저장은 진짜 AI 모드에서만(연습은 FR-10)");
  assert.match(a, /const turnOf = \(m\) => \(m\.kind === "stage" \? \{ stage: m\.n, mark: true, title: String\(m\.title \|\| ""\)\.slice\(0, 60\) \} : m\.kind === "carry" \? \{ stage: m\.n, carry: textOf\(m\.html\)\.slice\(0, 2000\) \}/, "3-32의 세 모양(말 · 구분선 · 가져온 것)");
  assert.match(a, /const add = chatQueue\.splice\(0, 20\);/, "한 번에 20개"); assert.match(a, /fetch\("\/api\/chatlog", \{ method: "POST"/, "add로 쌓는다");
  assert.match(a, /async function chatlogLoad\(\)/); assert.match(a, /const chatRecheck = \(\) => chatlogLoad\(\)\.then/, "폴더 · 보기 방식이 바뀌면 다시 묻는다"); assert.match(a, /chatFolder = !!\(r && r\.ok && r\.why !== "folder"\);/, "폴더를 모르면 이 브라우저 것 그대로"); assert.match(a, /if \(!chatFolder\) \{ chatQueue = \[\]; return false; \}/, "폴더를 모르면 서버에 보내지 않는다(병합 뒤 고침 — 400이 쌓였다)");
  assert.match(a, /st\.chatMark = st\.chat\.map\(\(m\) => !!m\.kind\)\.lastIndexOf\(true\) \+ 1;/, "이어서 볼 때 대화 표시 자리는 마지막 구분선 뒤");
  assert.match(a, /chatlogLoad\(\)\.then\(\(ok\) => \{ if \(ok\) render\(\); \}\);   \/\/ C-63 — 켤 때/, "켤 때"); assert.match(a, /const connected = \(r\) => \{ forgetFolder\(\); chatRecheck\(\);/, "폴더를 바꿔도");
});

test("T24 단계 구분선 · 가져온 것 — 새 단계가 시작되면 대화에 구분선(단계 · 이름 · 날짜)과 '지난 단계에서 가져온 것' 카드(정한 줄 요약)를 넣는다. 대화가 비었나는 구분선 뒤 내 말이 있나로", () => {
  assert.match(a, /logMsg\("sys", `<b>\$\{LB\(n\)\} · \$\{esc\(N\.STAGES\[n\]\.title\)\}<\/b><span>\$\{ymd\(\)\}<\/span>`, \{ kind: "stage", n, title: N\.STAGES\[n\]\.title \}\);/, "구분선(서버에는 { stage, mark, title }로)");
  assert.match(a, /logMsg\("floro", `<b>지난 단계에서 가져온 것<\/b>/, "가져온 것 카드");
  assert.match(a, /<small>틀리면 말로 고쳐 주세요<\/small>/, "사용자는 말로 고칠 수 있다");
  assert.match(a, /const questStarted = \(\) => \{[\s\S]*?st\.chatMark = st\.chat\.length; st\.tidy = null; \};/, "대화 표시 자리는 구분선 뒤");
  assert.match(a, /if \(islBig\(\) && !st\.pane && !st\.settings && \(st\.quest \? !st\.quest\.draft && st\.chat\.length <= \(st\.chatMark \|\| 0\) : !st\.j && !st\.chat\.some\(\(m\) => m\.who === "me"\)\) && !st\.tidy\)/, "빈 대화 = 구분선 뒤에 말이 없다(저장된 대화에도 맞는 기준)");
  assert.match(a, /m\.kind === "stage" \? `<div class="msg stage" data-stage="\$\{m\.n\}"><div class="b">\$\{m\.html\}<\/div><\/div>`/, "구분선은 가운데 줄로");
  assert.match(c, /\.msg\.stage > \.b\{[^}]*border-top:1px solid var\(--line\)/, "구분선 모양");
});

test("T25 왼쪽 대화 목록 — 프로젝트 이름 → 단계 바로가기(최근이 위, 지금 / 날짜) → 전체 파일(접힘). 누르면 같은 대화의 그 구분선으로 옮겨 잠깐 강조 · 그 단계 파일 펼침, 다시 누르면 접힘", () => {
  assert.match(a, /function chatNav\(\)/); assert.match(a, /<nav class="wnav" aria-label="대화 · 파일">\$\{chatNav\(\)\}<\/nav>/, "파일 칸 자리에 대화 목록");
  assert.match(a, /const stages = \[\.\.\.seen\]\.filter\(\(n\) => N\.STAGES\[n\]\)\.sort\(\(a, b\) => b - a\);/, "최근 단계가 위");
  assert.match(a, /<small>\$\{n === cur \? "지금" : dateOf\(n\)\}<\/small>/, "지금 · 날짜");
  assert.match(a, /"chat-go": \(i, el\) => \{ const n = Number\(el\.dataset\.v\); st\.chatOpen = st\.chatOpen === n \? null : n; st\.chatGo = n; goSeq \+= 1; render\(\); \}/, "누르면 펼침 · 다시 누르면 접힘, 대화는 그 구분선으로");
  assert.match(a, /<div class="log" data-log data-go-stage="\$\{st\.chatGo == null \? "" : `\$\{st\.chatGo\}:\$\{goSeq\}`\}">/, "옮길 구분선을 HTML에(단계:번호 — 같은 단계를 다시 눌러도) — 앱 창(win.js)도 같은 값으로 옮긴다");
  assert.match(a, /const goStage = \(root\) => \{[\s\S]*?\.scrollIntoView\(\{ block: "start" \}\)[\s\S]*?classList\.add\("hl"\)/, "구분선으로 옮기고 잠깐 강조(브라우저 판)");
  assert.match(w, /data-go-stage/, "앱 창도");
  assert.match(a, /<details class="fn-all"\$\{st\.fnAll \? " open" : ""\}><summary>전체 파일<\/summary>\$\{fileNav\(\)\}<\/details>/, "맨 아래 '전체 파일' — 지금의 폴더 모양 그대로, 한 칸 들여서");
  assert.match(c, /\.fn-all \.fn\{padding-left:12px\}/, "한 칸 들여서");
  assert.match(a, /if \(p\.type === "toggle"\) \{ st\.fnAll = !!p\.open; return; \}/, "앱 창의 접고 펼침을 기억");
  assert.match(c, /\.cn-list \.cn\.st-now/, "지금 단계 줄은 C-59 모양");
  assert.match(a, /aria-current="\$\{sel \? "true" : "false"\}"/, "파일 칸(전체 파일)의 열린 파일 표시는 그대로");
});

// claude-drafted: 2026-10-29 — F-95(임유정 "마우스 올리면 흰색으로 변해서 글자가 안보이고 클릭해도 반응이 없어"): 지금 단계 줄(남색 · 흰 글자)은 마우스를 올려도 밝은 바탕이 되지 않고,
//   펼친 파일 목록은 버튼 옆(49px에 '아...')이 아니라 아래로 — `.wnav .fn li{display:flex}`가 `.cn-list .cn{display:block}`을 이겼다
test("F-95 대화 목록의 지금 단계 줄 — 마우스를 올려도 글자가 보이고, 펼친 파일은 버튼 아래로", () => {
  assert.match(c, /\.wnav \.fn li:not\(\.sel\):not\(\.st-now\):has\(button\):hover\{background:var\(--card\)\}/, "지금 단계 줄(.st-now)은 밝은 바탕으로 바뀌지 않는다");
  assert.match(c, /\.wnav \.cn-list \.cn\{display:block;/, "`.wnav .fn li`보다 앞서게 — 펼친 목록이 버튼 아래로");
  assert.match(c, /\.cn-list \.cn\.st-now>button\{background:var\(--isl\);color:#EEF1FA;/, "남색은 버튼 줄에");
  assert.match(c, /\.wnav \.cn-list \.cn\.st-now\{background:none;color:inherit;font-weight:inherit;box-shadow:none\}/, "펼친 파일은 보통 바탕 · 글자 · 굵기");
  assert.match(c, /\.wnav \.fn li\.st-now>small\{color:#EEF1FA\}/, "흰 글자는 그 줄의 꼬리표에만 — 펼친 파일의 '새로' · '고침'은 밝은 바탕 위라 흰색이면 안 보인다(새 맥락 리뷰)");
});

test("T26 단계별 만든 · 고친 파일 — 서버가 쌓은 changes(3-32, 훅 알림의 Write · Edit — new → 새로, edit → 고침)를 그 단계 구분선과 다음 구분선의 at 사이로 나누고, 단계 문서도 같이(두승현 2026-10-28 '둘 다')", () => {
  assert.match(a, /function stageFilesOf\(n\)/);
  assert.match(a, /const marks = st\.chat\.filter\(\(m\) => m\.kind === "stage"\), me = \[\.\.\.marks\]\.reverse\(\)\.find\(\(m\) => m\.n === n\), start = me \? me\.at : null, next = me \? marks\.find\(\(m\) => m\.at > me\.at && m\.n !== n\) : null, end = next \? next\.at : Infinity;/, "구분선 사이");
  assert.match(a, /got\[c\.path\] = got\[c\.path\] === "새로" \? "새로" : c\.how === "new" \? "새로" : "고침";/, "new → 새로(한 번 새로면 그대로), edit → 고침");
  assert.match(a, /const doc = nowDocPath\(n\); if \(doc && !got\[doc\] && haveDocs\(\)\.has\(doc\)\) out\.push\(\{ path: doc, tag: "새로" \}\);/, "단계 문서는 폴더에 있을 때");
  assert.ok(!a.includes("function collectStageFiles"), "화면이 걸음을 세지 않는다 — 서버가 쌓는다(3-32)");
});
