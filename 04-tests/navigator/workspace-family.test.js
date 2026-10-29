// claude-drafted: 2026-10-29 — 작업실 개편 TASK PR ②(두승현 PRD 2026-10-28 · 이재엽 승인 2026-10-29): C-62 한 가족 테마 · 머리 줄 하나, C-59 상태는 한 가지 모양, C-58 정보마다 집 하나, C-60 주 단추 하나.
//   글자 모양으로 본다(브라우저 없이). 화면에서 재는 것(위 줄 수 · 대비 · 칩 잘림 F-77)은 04-tests/e2e/workspace-family.test.js
// 실행: node --test 04-tests/navigator/workspace-family.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");
const a = read("navigator/app.js"), c = read("navigator/app.css"), h = read("navigator/win.html");

test("C-62 테마 — 섬의 어두운 토큰은 :root가 아니라 섬 카드(.isl · .pill)에만, 별 · 유리(backdrop-filter) · 점 격자 · 판 안의 판은 없다, 섬 옆 칸의 바탕은 작업실 바탕", () => {
  assert.ok(!/@media \(min-width:601px\)\{\s*:root\{/.test(c), "601px 위 :root 어두운 토큰 묶음은 뺐다 — :root는 파스텔 하나");
  assert.match(c, /\.isl,\.pill\{[^}]*--ink:#EEF1FA/, "어두운 글자 토큰은 섬 카드에만");
  assert.ok(!/radial-gradient\(1\.5px 1\.5px/.test(c), "별 없음");
  assert.ok(!/backdrop-filter:blur\(14px\)/.test(c) && !/backdrop-filter:blur\(30px\)/.test(c), "유리(블러) 없음 — 섬은 불투명 남색 카드");
  assert.ok(!/\.lg-on/.test(c), "굴절 유리 없음");
  assert.ok(!/\.cv\{[^}]*radial-gradient\(var\(--seg\) 1px/.test(c), "캔버스 점 격자 없음");
  assert.match(c, /\.isl \.mc\.chat \.main\{background:transparent;border:0/, "섬 안의 채팅 판은 판 안의 판이 아니다");
  assert.match(c, /\.isl-col\{[^}]*background:var\(--desk\)/, "옆 칸은 작업실 바탕 — 섬 카드만 남색");
  assert.ok(!/html\.win-quest \.isl-col\{/.test(c), "옆 칸에 어두운 토큰을 통째로 칠하지 않는다");
});

test("C-62 — 글꼴 · 주 단추 · 색의 메아리(두승현 결정 · 이재엽 승인 2026-10-29): 노트북 '완료 보고' · 퀘스트 받기도 같은 하늘색 알약, 고른 탭 · 단계 칩 · 파일 칸 '지금' · 지도의 장 탭은 섬 색", () => {
  assert.match(c, /\.pacts button\.pri\{background:var\(--acc-btn\);border-color:var\(--acc-btn\);color:var\(--acc-ink\)\}/, "완료 보고 = 하늘색 알약");
  assert.match(c, /\.ev \.join\{[^}]*background:var\(--acc-btn\)[^}]*color:var\(--acc-ink\)/, "퀘스트 받기 = 하늘색");
  for (const s of [".wtabs button[aria-selected=true]", ".wh .cv-stg span.cur", ".wnav .fn li.st-now", ".vtabs button[aria-selected=true]"]) assert.match(c, new RegExp(`${s.replace(/[.[\]*+?]/g, "\\$&")}\\{[^}]*background:var\\(--isl\\)`), `${s} — 메아리`);
  assert.match(c, /\.wtabs button\[aria-selected=true\]\{[^}]*color:#EEF1FA/, "메아리 위 글자는 눈색(대비 9.20)");
});

test("C-62 — 머리 줄 하나: 작업실 머리(.wh)가 창 전체 폭(격자 첫 줄)이고 섬 단추 묶음(.hisl — 집 · 설정 · 열어 두기 · 접기)이 그 안 오른쪽 끝, 옆 칸의 섬은 위 줄(.tb)을 그리지 않는다. 섬 자리(위 · 아래 · 왼쪽) 단추는 뺐다", () => {
  assert.match(a, /function islandHTML\(enter, inCol = false\)/, "옆 칸에서는 위 줄 없이");
  assert.match(a, /\$\{inCol \? "" : topbar\(\)\}/);
  assert.match(a, /: islandHTML\("", true\)\}<\/div>`;/, "옆 칸의 섬은 inCol");
  assert.match(a, /const hisl = \(\) => `<span class="hisl" role="group" aria-label="섬">/, "섬 단추 묶음");
  assert.ok(a.indexOf('const wh = `<div class="wh">') > 0 && a.indexOf("${hisl()}") > a.indexOf('const wh = `<div class="wh">') && a.indexOf("${hisl()}") < a.indexOf("return `${wh}<div class=\"win qwin"), "머리 줄 안에");
  assert.match(a, /return `\$\{wh\}<div class="win qwin/, "머리 줄은 작업실 판 밖(형제) — 창 전체 폭으로 펼 수 있게");
  assert.match(h, /#root\{[^}]*display:grid;grid-template-columns:minmax\(0,1fr\) var\(--col-w,420px\);grid-template-rows:auto minmax\(0,1fr\);grid-template-areas:"wh wh" "win isl"/, "앱 창: 머리 줄이 첫 줄 전체");
  assert.match(c, /\.wsx\{display:grid;grid-template-columns:minmax\(0,1fr\) var\(--col-w,420px\);grid-template-rows:auto minmax\(0,1fr\);grid-template-areas:"wh wh" "win isl"\}/, "브라우저 판도 같은 격자(옆 칸 너비는 --col-w — C-61 PR ③부터)");
  assert.ok(!a.includes("const dockBtns") && !a.includes('data-act="side"') && !a.includes("SIDE_UI"), "섬 자리 단추 · 설정 줄 없음(2026-10-28 합의 — 섬은 오른쪽만)");
  assert.ok(!h.includes('html[data-side="left"]') && !h.includes("flex-direction:row-reverse"), "위 · 아래 · 왼쪽 자리 규칙 없음");
});

test("C-59 상태는 한 가지 모양 — st-now · st-done · st-ready · st-later · st-gate · st-bad를 한 번 정의하고 캔버스 칸 · 노트북 목차 · 지도 카드 · 파일 칸이 같은 class를 쓴다. 포스트잇 · 연두 칩 · 점은 없다", () => {
  for (const k of ["now", "done", "ready", "later", "gate", "bad"]) assert.equal((c.match(new RegExp(`^\\.st-${k}\\{`, "gm")) || []).length, 1, `.st-${k} 한 번`);
  assert.match(c, /^\.st-now\{background:#F2F5FA;box-shadow:inset 0 0 0 2px #4D66B5/m, "지금 = 바다색 테두리");
  assert.match(c, /^\.st-done\{background:#F2F5FA;box-shadow:inset 0 0 0 1px #C5CEE2/m, "끝남 = 종이 카드");
  assert.match(c, /^\.st-later\{background:#E2E9F4;[^}]*color:#5B6491/m, "아직 = 흐린 면");
  assert.match(c, /^\.st-gate\{box-shadow:inset 0 0 0 2px #C9A43A\}/m, "관문 = 금색 테두리");
  assert.match(c, /^\.st-bad\{color:#8E3A52\}/m, "문제 = 볼색 글자");
  assert.match(a, /<div class="cv-c \$\{pos\} \$\{k\} st-\$\{k\}\$\{pos === "c6" \? " st-gate" : ""\}">/, "캔버스 칸");
  assert.match(a, /class="st-\$\{cls === "done" \? "done" : cls === "lock" \? "later" : "now"\}"/, "노트북 목차");
  assert.match(a, /class="sm-card st-\$\{c\.state\}\$\{sel \? " sel" : ""\}\$\{c\.state === "pending" \? " pending" : ""\}"/, "지도 카드");
  assert.match(a, /<li class="\$\{x\.dir \? "dir" : tag === "지금" \? "st-now" : ""\}/, "파일 칸 '지금'");
  assert.match(a, /<p class="sm-legend">\$\{\["done", "now", "ready", "later"\]\.map\(\(k\) => `<span><i class="st-\$\{k\}" aria-hidden="true"><\/i>\$\{STATE_WORD\[k\]\}<\/span>`\)/, "범례도 같은 class");
  assert.ok(!/#F7EDC0/.test(c), "노란 포스트잇 없음");
  assert.ok(!/\.cv-stg span\.done\{background:var\(--okbg\)/.test(c), "연두 칩 없음");
  assert.ok(!/\.cv-c\.now \.ch em::before/.test(c) && !/\.wnav \.fn li\.now small::before/.test(c) && !/\.cv-now::before/.test(c), "● 점 없음");
  assert.ok(!/\.cv-c\.now\{background:#DCE8F8/.test(c) && !/\.sm-card\.now\{box-shadow/.test(c) && !/\.toc button\.lock\{color:#5E543F/.test(c), "옛 상태 모양(세 곳의 제각각)은 지웠다");
});

test("C-58 정보마다 집 하나 — 캔버스에서 지난 · 다음 보드 · 배울 말 · 파일 카드를 지우고, '지금 하는 일' 줄 · 작은 플로로는 섬이 접혔을 때만. 단계 칩은 머리 줄(한 번)", () => {
  const cv = a.slice(a.indexOf("function canvasPane"), a.indexOf("// 파일 칸(C-41 ⑥"));
  for (const s of ["cv-bd", "cv-learn", "fileCard()", 'class="cv-file"']) assert.ok(!cv.includes(s), `${s} 없음`);   // cv-files(④ 저장의 파일 이름, R-5)는 남는다
  assert.ok(!a.includes("function fileCard"), "파일 카드 함수도 지웠다 — 바뀐 파일은 왼쪽 대화 목록(C-63)으로");
  assert.match(cv, /\$\{colFolded\(\) \? `<div class="cv-now">지금 하는 일 <b>\$\{esc\(now\)\}<\/b><\/div>` : ""\}/, "섬이 접혔을 때만");
  assert.match(cv, /\$\{colFolded\(\) \? `<div class="cv-flo"/, "작은 플로로도");
  assert.ok(!cv.includes('class="cv-stg"'), "단계 칩은 캔버스에 없다");
  assert.match(a, /function stageChips\(n\)/, "칩은 함수로 — 머리 줄에서 쓴다");
  assert.match(a, /<span class="tb-stage" aria-live="polite">\$\{stageHead\(\)\}<\/span>\$\{stageChips\(n\)\}/, "머리 줄: 단계 이름 한 번 + 칩");
  assert.ok(!a.includes('<span class="wst">'), "머리 줄의 단계 이름 둘째 자리(wst)는 뺐다");
  assert.match(cv, /<div class="cv-bh"><span>퀘스트 한 바퀴 — 다섯 칸<\/span><\/div>/, "판 제목에는 단계 이름을 다시 쓰지 않는다");
  assert.ok(!c.includes(".cv-bd{") && !c.includes(".cv-learn{") && !c.includes(".cv-file{"), "css도");
  assert.match(c, /grid-template-areas:"now now now now now" "bh bh bh bh bh" "c1 a1 c2 a2 c3" "\. \. a3 a3 a3" "c4 a4 c5 a5 c6"/, "격자에서도 빠진 자리 없음");
});

test("C-60 주 단추 하나 · 덜 펼치기 — 섬 칩은 '더 보기' 하나로 접히고, 노트북 '완료 보고'는 다 채우기 전엔 보조 단추, '자세히 보기 · 왜 하나요' · 남은 기준 · 안 그려진 단계의 할 일은 details로 접힘", () => {
  assert.match(a, /<div class="opts more" id="more-chips">\$\{moreOpen \? more\.map\(chip\)\.join\(""\) : ""\}<button type="button" class="b ghost mtg" data-act="more-toggle" aria-expanded="\$\{moreOpen\}" aria-controls="more-chips">/, "더 보기 하나");
  assert.match(a, /"more-toggle": \(\) => \{ moreOpen = !moreOpen; render\(\); \}/);
  assert.ok(!a.includes('<div class="opts fixed">'), "옛 고정 칩 줄 없음");
  assert.match(a, /<button type="button" class="\$\{done \? "pri" : ""\}" data-act="quest-report" \$\{done \? "" : "disabled"\}>완료 보고<\/button>/, "완료 보고는 다 채웠을 때만 주 단추");
  assert.match(a, /<details class="qdesc"><summary>자세히 보기 · 왜 하나요<\/summary>/, "노트북");
  assert.match(a, /<details class="cv-unmet-d"><summary>남은 기준 \$\{unmet\.length\}<\/summary><ul class="cv-unmet">/, "관문의 남은 기준");
  assert.match(a, /<details class="jm-peek"><summary>할 일 미리 보기<\/summary><ul class="jm-cells">/, "안 그려진 단계");
});

// claude-drafted: 2026-10-29 — 두승현 "작업실 상단 바의 색상이 다른 UI와 같아 계층 구분이 쉽지 않다": 머리 줄은 한 단계 진한 연파랑(--acc-mid, C-57 토큰) + 아래 경계선 — 같은 날 "조금은 진하게 · 진하기를 중요도 기준으로"로 --acc-soft에서 한 단계 더.
//   그 바탕에서 흐린 글자(--mute 3.85:1)는 기준 4.5:1에 못 미쳐 머리 줄 안에서만 진한 남색(--ink, 7.98:1)으로
test("머리 줄은 다른 칸과 구분되는 바탕(--acc-mid) · 아래 경계선, 그 안의 흐린 글자는 진한 남색 — 앱 창(win.html) · 브라우저 판 둘 다", () => {
  assert.match(c, /^\.wh\{[^}]*background:var\(--acc-mid\);[^}]*border-bottom:1px solid var\(--line\)/m, "머리 줄 바탕 · 경계선");
  assert.match(c, /^\.wh\{[^}]*--mute:var\(--ink\);--sub:var\(--ink\)/m, "흐린 글자는 머리 줄 안에서 진하게(대비 4.5:1 이상)");
  assert.match(c, /html\.win-quest \.wh,\.nav \.wsx \.wh\{background:var\(--acc-mid\)\}/, "작업실 창 · 브라우저 판의 덮어쓰기도 같은 색");
  assert.match(h, /html\.in-win\.win-quest #root>\.wh\{background:var\(--acc-mid\)\}/, "앱 창의 머리 줄도 같은 색");
});
