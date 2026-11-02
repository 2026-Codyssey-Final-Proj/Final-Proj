// claude-drafted: 2026-10-26 — 작업실 창(C-41 PR①, 두승현 · 이재엽 · 두승현 결정 2026-10-26): 퀘스트 창을 테두리 있는 보통 창(늘 위 아님 · 파스텔)으로, 첫 탭 캔버스(지금 하는 일 · 단계 칩 · 지난 장 / 다음 장 · 다섯 칸) — 캔버스 탭은 2026-11-02 두승현 결정으로 뺐다.
// 기준은 스토리보드 01-docs/04-pattern-implementation/stage-storyboard/index.html(화면 기준 1 · 2 · 7 · 9). 글자 모양으로 본다 — electron 없이 돈다.
// 실행: node --test 04-tests/navigator/workspace.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");

test("main.js — 작업실 창은 테두리 있는 보통 창: 늘 위 아님 · 작업 표시줄에 뜸 · 640×480보다 작아지지 않음 · 제목 '작업실'. 설정 창의 모양은 그대로", () => {
  const m = read("electron/main.js");
  assert.match(m, /frame: ws, transparent: false, backgroundColor: ws \? "#E9EEF6" : "#363E62", alwaysOnTop: !ws, resizable: ws, minimizable: ws/);
  assert.match(m, /minWidth: ws \? 640 : 260, minHeight: ws \? 480 : 200, title: ws \? "Floe — 작업실" : "Floe — 설정"/);
  assert.match(m, /if \(!ws\) w\.setAlwaysOnTop\(true, "floating"\)/, "늘 위는 설정 창만");
});

// R-1(C-42, 이재엽 2026-10-27 버튼 "화면을 채움"): 작업실은 섬이 있는 화면의 작업 영역 가득 — 사람이 줄이거나 옮긴 크기 · 자리(saved)가 있으면 그대로(작업 영역 안으로 당김, 가장 작게 640×480). 섬 아래에 S/M/L로 두던 길은 뺐다
test("lib.js workBounds — 작업실은 작업 영역 가득, 기억한 크기 · 자리가 있으면 그대로(작업 영역 안으로 · 가장 작게 640×480)", () => {
  const L = require("../../02-frontend/electron/lib.js");
  const WA = { x: 0, y: 25, width: 1440, height: 875 };
  assert.deepEqual(L.workBounds(WA), { x: 0, y: 25, width: 1440, height: 875 }, "처음 열면 작업 영역 가득");
  assert.deepEqual(L.workBounds(WA, null), { x: 0, y: 25, width: 1440, height: 875 });
  assert.deepEqual(L.workBounds(WA, { x: 100, y: 80, width: 900, height: 600 }), { x: 100, y: 80, width: 900, height: 600 }, "기억한 크기 · 자리 그대로");
  assert.deepEqual(L.workBounds(WA, { x: 900, y: 600, width: 900, height: 600 }), { x: 540, y: 300, width: 900, height: 600 }, "작업 영역 밖이면 안으로 당긴다");
  assert.deepEqual(L.workBounds(WA, { x: 10, y: 30, width: 100, height: 100 }), { x: 10, y: 30, width: 640, height: 480 }, "가장 작게 640×480");
  assert.deepEqual(L.workBounds(WA, { x: 0, y: 25, width: 3000, height: 3000 }), { x: 0, y: 25, width: 1440, height: 875 }, "작업 영역보다 크면 작업 영역만큼");
  assert.deepEqual(L.workBounds(WA, { x: "a", width: 900 }), { x: 0, y: 25, width: 1440, height: 875 }, "모양이 안 맞는 저장값은 없는 것으로");
  assert.deepEqual(L.workBounds({ x: -1920, y: 0, width: 1920, height: 1080 }), { x: -1920, y: 0, width: 1920, height: 1080 }, "왼쪽 모니터(wa.x < 0)에서도 그 화면 가득");
  assert.deepEqual(L.workBounds({ x: 0, y: 0, width: 500, height: 300 }), { x: 0, y: 0, width: 640, height: 480 }, "작업 영역이 640×480보다 작아도 창은 그보다 작아지지 않는다(main.js minWidth · minHeight와 같다)");
  assert.match(fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/win.js"), "utf8"), /document\.title = kind === "quest" \? "Floe — 작업실" : "Floe — 설정"/, "OS 제목 줄");
});

test("main.js — 작업실 창: 처음은 작업 영역 가득(workBounds(wa, 기억)), 사람이 옮기거나 늘리면 기억(설정 폴더 workspace.json). '화면 가득' 단추는 2026-10-29 두승현 결정으로 뺐다(OS 창의 최대화가 같은 일) — S/M/L도 없다", () => {
  const m = read("electron/main.js");
  assert.match(m, /const workFile = \(\) => path\.join\(app\.getPath\("userData"\), "workspace\.json"\);/, "기억은 설정 폴더의 workspace.json(project.json과 같은 자리)");
  assert.match(m, /const boundsFor = \(kind, side, isl, wa, size\) => \(kind === "quest" \? workBoundsNow\(wa\) : L\.sideWinBounds\(kind, side, isl, wa, size\)\);/, "작업실은 작업 영역 가득 · 기억한 자리(R-1), 설정 창은 옆자리");
  assert.match(m, /screen\.getDisplayMatching\(s\)\.workArea : wa, s\)/, "기억한 자리는 그 자리가 있는 화면의 작업 영역으로(둘째 모니터 — 새 맥락 리뷰)");
  assert.match(m, /w\.on\("will-resize", \(\) => \{ w\.floeUser = true; \}\); w\.on\("resize", rememberWork\); w\.on\("move", rememberWork\);/, "사람이 바꾼 크기 · 자리만 기억한다(이재엽 버튼 2026-10-27)");
  assert.match(m, /if \(!w \|\| w\.isDestroyed\(\) \|\| !w\.floeUser/, "앱이 둔 크기는 적지 않는다"); assert.ok(!/forgetWork/.test(m), "'화면 가득'에만 쓰던 기억 지우기는 없다");
  assert.ok(!/size === "full"/.test(m), "작업실을 '화면 가득'으로 맞추는 갈래는 없다");
  assert.ok(!m.includes("floeSize: opt.size"), "작업실 · 설정 창 모두 S/M/L 크기 기억(floeSize)은 없다 — 설정 창은 2026-10-25부터 열리지 않고, 작업실은 자리 · 크기를 workspace.json에");
});

test("app.js — 작업실 창: 탭은 퀘스트 → 책, 처음 여는 탭은 퀘스트. 캔버스 탭(C-41 · C-42 · C-23 ⑤ 버전 칸)은 2026-11-02 두승현 결정으로 뺐다 — canvasPane · canvas-pan.js · .cv 모양이 남아 있지 않고, 저장된 옛 탭 값 canvas는 quest로", () => {
  const a = read("navigator/app.js"), c = read("navigator/app.css");
  assert.match(a, /const QTABS = \[\["quest", "퀘스트"\], \["lib", SHELF_ON \? "서고" : "책"\]\];/, "탭 둘");
  assert.match(a, /qwin: false, qtab: "quest"/, "처음 여는 탭은 퀘스트");
  assert.match(a, /<span class="ttl">작업실<\/span>/);
  assert.match(a, /if \(st\.qtab === "tree" \|\| st\.qtab === "canvas"\) st\.qtab = "quest";/, "저장된 옛 탭 값(도전과제 · 캔버스)은 퀘스트로");
  for (const s of ["canvasPane", "FloeCanvas", "canvas-pan", 'openQwin("canvas")', 'class="cv-', "cv-stg", "stageChips", "prepThink"]) assert.ok(!a.includes(s), `${s} 없음`);
  assert.ok(!/\.cv\b|\.cvb|\.cvw|\.cvp|\.cv-/.test(c), "캔버스 모양(.cv*) 없음");
  assert.ok(!c.includes("@container (min-width:935px) and (min-height:544px)"), "판 1100×640 줌 블록 없음");
  assert.ok(!fs.existsSync(path.join(__dirname, "../../02-frontend/navigator/canvas-pan.js")), "canvas-pan.js 삭제");
  for (const f of ["navigator/index.html", "navigator/win.html", "navigator/win.js"]) assert.ok(!read(f).includes("canvas-pan") && !read(f).includes("FloeCanvas"), `${f}에 캔버스 없음`);
  assert.ok(!fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8").includes("canvas-pan"), "서버 STATIC 목록에 없음");
});

// ⑥(2026-10-27 두승현 "의도했던 것은 첨부한 이미지처럼 펼쳐져 있는 환경 … 3번은 이재엽 몫으로 남기고 더미 데이터로 UI 출력만"): 머리 한 줄(단계 · 탭 · LV · 조개) · 왼쪽 파일 칸(예시) · 캔버스는 목업의 1100×640 판을 줌
test("app.js · app.css — ⑥ 펼쳐진 환경: 머리 한 줄에 단계 · 탭 · LV · 조개, 왼쪽 파일 칸은 예시 데이터(API는 이재엽 몫), (캔버스 판은 2026-11-02에 뺐다)", () => {
  const a = read("navigator/app.js"), c = read("navigator/app.css");
  assert.match(a, /<span class="tb-stage" aria-live="polite">\$\{stageHead\(\)\}<\/span>/, "머리에 단계 이름 한 번(C-58) — 단계 칩은 2026-10-29에 뺐다");
  assert.match(a, /<span class="wlv" title="칭호 · \$\{esc\(QU\.rankOf\(Math\.min\(level, 7\)\)\)\}">LV \$\{level\} · <button type="button" class="shells" data-act="shells"/, "머리에 LV · 조개(조개는 뽑기 단추 — 섬 위 줄이 머리 줄로 합쳐진 뒤, C-62)");
  assert.match(a, /<div class="wmain">\$\{wnavOpen \? `<nav class="wnav" aria-label="대화 · 파일">\$\{chatNav\(\)\}<\/nav>` : ""\}<div class="wbody"/, "왼쪽 칸은 탭에 상관없이 — C-63(PR ④)부터 대화 목록, 파일 칸은 그 안의 '전체 파일'");
  assert.match(a, /const FILES_DUMMY = \[\["README\.md", 0, "고침 · 책", "fix"\]/, "예시 데이터 — API가 생기면 지운다"); assert.match(a, /\$\{esc\(project\(\) \|\| "예시 프로젝트"\)\}/, "더미 이름이 진짜 프로젝트처럼 보이지 않게(새 맥락 리뷰 2026-10-27)");
  assert.match(a, /폴더를 연결하면 진짜 목록이 와요"\)\}">예시<\/em>/, "서버 없이 · 연습 · 폴더를 모르면 화면에 예시 표시(R-8)");
  assert.match(c, /\.wnav\{width:200px;flex:none;/); assert.match(c, /\.qwin\{min-width:260px;container-type:inline-size\}/); assert.match(c, /@container \(max-width:760px\)\{:is\(#root,\.wsx\):not\(:has\(>\.isl-col\.center\)\) \.wnav\{display:none\}\}/, "좁은 작업실은 파일 칸을 숨긴다(단계 칩은 2026-10-29에 뺐다) — 섬이 가운데일 때는 파일 칸을 숨기지 않는다(F-81)(760은 두승현 확인 전 — 출처 없는 값)");
  assert.ok(!c.includes("@container cvboard"), "너비로 칸 배치를 다시 잡던 길(① · 900)은 뺐다 — 줌이 대신한다");
  assert.ok(!a.includes('data-act="qsize"') && !a.includes("작업실 처음 크기"), "S/M/L 단추 · 설정 줄은 없다(R-1, 이재엽 버튼 2026-10-27 \"'화면 가득' 하나로\")");
  assert.ok(!/qfull|wfull|sizeWin\("quest"/.test(a) && !/\.wfull/.test(c), "머리 줄의 '화면 가득' 단추 · 처리 · 모양은 없다(두승현 2026-10-29)");
  assert.match(a, /pop = qpop \? " winpop" : ""/, "처음 열 때의 움직임 class는 winpop"); assert.match(c, /\.win\.winpop\{animation:winpop/); assert.ok(!c.includes(".win.pop{"), "'pop'은 말풍선 판(.pop)의 이름 — 겹치면 작업실 창이 처음 열릴 때 14px 여백 · 아래 정렬 · 내용 높이(148px)로 뒤집어썼다(⑥ 앱에서 실측 2026-10-27)");
});

test("app.css · win.html — 작업실은 파스텔(네이비 면 없음). 설정 창의 네이비는 그대로", () => {
  const c = read("navigator/app.css"), w = read("navigator/win.html");
  assert.match(c, /html\.in-win:not\(\.win-quest\)\{/, "네이비 토큰은 설정 창에만 — 옆 칸은 파스텔, 섬 카드만 남색(C-62)");
  assert.match(c, /html\.in-win:not\(\.win-quest\) \.win\{background:var\(--isl\)\}/);
  assert.match(c, /html\.win-quest,\.nav \.wsx\{[^}]*--card:#F2F5FA/, "브라우저 판(.nav .wsx — C-62 격자)도 같은 파스텔 — ⑥ 캔버스의 밝은 면은 고정값이라 네이비 토큰 위에서는 흰 글씨가 흰 면에 왔다(새 맥락 리뷰 2026-10-27)");
  for (const t of ["--ok:#2B3463", "--okbg:#A9E2C4", "--acc-ink:#263066", "--mute:#5B6491", "--win:#F2F5FA", "--t-blue-ink:#2B3463", "--bad:#8E3A52"])   // C-57(2026-10-28): 웹사이트 토큰 assert.ok(/html\.win-quest,\.nav\.side>\.qwin\{[^}]*\}/.exec(c)[0].includes(t), `${t} — 601px 이상의 네이비 토큰을 덮어야 ✓ 글씨가 파스텔 위에서 4.5:1(새 맥락 리뷰 2026-10-26: 빠지면 1.38:1)`);
  assert.match(c, /html\.win-quest \.win,\.nav \.wsx \.qwin\{background:var\(--card\)/);
  assert.match(w, /html\.in-win\.win-quest,html\.in-win\.win-quest body\{background:#E9EEF6\}/);
  assert.match(read("electron/main.js"), /backgroundColor: ws \? "#E9EEF6"/, "창 바탕색이 셋 다 같다");
});

test("app.js render — 브라우저 판의 작업실 몸통(.qwin .wbody)은 같은 화면이면 스크롤을 되돌린다(마우스가 섬에 들어오면 mouseenter가 다시 그린다 — 받기 화면이 맨 위로 튀던 것, 2026-10-27)", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const ob = \$nav\.querySelector\("\.qwin \.wbody"\), bodyWas = ob \? \{ view: ob\.dataset\.view, top: ob\.scrollTop \} : null;/);
  assert.match(a, /const nb = bodyWas && \$nav\.querySelector\("\.qwin \.wbody"\); if \(nb && nb\.dataset\.view === bodyWas\.view\) nb\.scrollTop = bodyWas\.top;/);
});

// R-8(C-42, 2026-10-27 이재엽 버튼 "전부" · "깊이 3 · 200개") — 진짜 파일 목록: 서버 GET /api/files(이름만 · 읽기만, API.md 3-25), 화면은 작업실을 열 때 받는다
test("app.js — R-8 파일 칸: 작업실을 열 때 /api/files를 받아 진짜 이름(지금 장 '● 지금' · 지난 장 '읽음' · 폴더 접고 펼치기), 서버 없이 · 연습 · 폴더 모름이면 예시. 서버는 경로를 받지 않는다", () => {
  const a = read("navigator/app.js"), s = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8");
  assert.match(a, /const openQwin = \(tab\) => \{ if \(!st\.qwin\) \{ qpop = true; loadFiles\(\); \}/, "열 때 받는다");
  assert.match(a, /if \(!canLive \|\| st\.mode === "fixture"\) \{ st\.files = \{ src: "example"/, "연습 · 서버 없음은 예시");
  assert.match(a, /await fetch\("\/api\/files", \{ cache: "no-store" \}\)/);
  assert.ok(a.includes('return "지금"') && a.includes('? "읽음" : ""'), "지금 장 · 지난 장 표시(C-57: ● 글자 대신 CSS 점)");
  assert.match(a, /"fn-dir": \(i, el\) => \{/, "폴더 접고 펼치기"); assert.match(a, /data-act="fn-dir" data-v="\$\{i\}"/, "열쇠는 번호 — 가린 이름끼리 경로가 겹쳐도(새 맥락 리뷰)");
  assert.match(a, /if \(closedAt && x\.depth > closedAt\) return "";/, "접힌 폴더의 안쪽은 깊이로 건너뛴다"); assert.ok(a.includes("비어 있어요 — 이 폴더에 보일 파일이 없어요") && a.includes("읽지 못한 폴더 ${f.unread}"), "빈 폴더 · 읽지 못한 폴더");
  assert.match(read("navigator/app.css"), /\.wnav \.fn li\.dir button\{all:unset;cursor:pointer;min-height:44px;/, "폴더 단추는 44px(이재엽 버튼 2026-10-27)");
  assert.ok(!a.includes("진짜 파일 목록은 다음 판에"), "'다음 판' 글은 없다 — 이 판이다");
  assert.match(s, /const BOOK_ROUTES = \["\/api\/readme", "\/api\/files",/, "확인 값이 필요한 주소");
  assert.match(s, /if \(req\.method === "GET" && route === "\/api\/files"\) return send\(res, 200, filesNow\(\)\);/);
  assert.match(s, /const r = Files\.listFiles\(s\.dir, \{ redact: Sensitive\.redact, exclude: Exclude\.matcher\(ex\) \}\);/, "이름은 가린다 · 폴더는 서버가 아는 것만(요청의 경로 없음) · C-52 빼 둔 곳은 목록에 없다(#287 뒤 맞춤, 2026-10-30)");
});

// R-10(C-42 · F-60, 2026-10-27): 판정이 오면 코드 규칙(gateRules)을 한 번 더 거치고, '안 됨'이 남으면 관문 앞에서 멈춰 '채우러 가기 / 까닭 적고 넘기기'를 묻는다 — 넘기면 까닭이 결정 기록 관문 줄에
test("app.js — R-10: landed는 gateRules를 거친다(빈칸 · 증거 — 그 장의 줄과 Claude Code 파일 기록), 보고한 뒤 '안 됨'이 남으면 멈춤 카드(채우러 가기 · 까닭 적고 넘기기), 넘기면 까닭과 함께 '됨'으로 · 결과의 check도 최신 판정으로", () => {
  const a = read("navigator/app.js");
  assert.match(a, /function landed\(j0, tokens, sent = st\.text, checkBy = ""\) \{\n\s+const j = gateApply\(j0\);/, "판정 뒤 코드 규칙");
  assert.match(a, /const workEvidence = \(\) => \{ if \(st\.mode === "fixture"\) return true; if \(aiMode !== "live"\) return false; const s = latestSession\(\);/, "증거 = 진짜 세션의 파일 기록만, 연습은 면제(이재엽 버튼 2026-10-27)");
  assert.match(a, /!holding\(\) && !st\.openInput && left\(\) > 0\);/, "멈춰 둔 단계 · 글 칸 연 동안은 멈춤 카드가 서지 않는다");
  assert.match(a, /N\.gateRules\(j, \{ lines: q \? q\.objs\.map\(\(_, i\) => \(q\.lines\[i\] \|\| \[\]\)\.join\(" \/ "\)\) : \[\], work: workEvidence\(\) \}\)/);
  assert.match(a, /if \(gateStop\(\)\) return momentStop\(\);/, "멈춤 카드가 먼저");
  assert.match(a, /const gateStop = \(\) => !!\(QU && st\.quest && st\.quest\.phase === "done" && st\.j && st\.j\.stage === st\.quest\.chap && !st\.finished && !holding\(\) && !st\.openInput && left\(\) > 0\);/);
  for (const s of ['"gate-fill": () =>', '"gate-skip": () =>', '"gate-skip-save": () =>', '"gate-skip-back": () =>', 'label: "채우러 가기", act: "gate-fill"', 'label: "까닭 적고 넘기기", act: "gate-skip"', 'if (a === "skip-reason")']) assert.ok(a.includes(s), s);
  assert.match(a, /skipped: true, reason/, "넘긴 기준은 까닭과 함께");
  assert.match(a, /skip: \{ reason, items/, "결과에 까닭 · 넘긴 기준 이름");
  assert.match(a, /else if \(st\.results\[j\.stage\] && !st\.results\[j\.stage\]\.passed\) st\.results = \{ \.\.\.st\.results, \[j\.stage\]: \{ \.\.\.st\.results\[j\.stage\], check: checkOf\(j\)/, "다시 살펴본 결과가 오면 결정 기록의 기준 n/m도 그것으로(F-60 ①)");
});

// F-67(2026-10-27 이재엽 "지금 폴더들도 폴더라는 느낌이 안들어") — 파일 칸: 폴더는 꺾쇠 + 폴더 그림(접힘 · 펼침) + 굵은 이름 + 안의 개수, 파일은 종류 그림, 깊이마다 안내선. 예시도 같은 모양
test("app.js · app.css — F-67 파일 칸이 폴더 트리처럼: 꺾쇠 · 폴더 그림 · 안의 개수 · 파일 종류 그림 · 안내선", () => {
  const a = read("navigator/app.js"), c = read("navigator/app.css");
  const nav = a.slice(a.indexOf("const FILES_DUMMY"), a.indexOf("// ── 파일 보기 · 고치기"));
  assert.ok(!/[▸▾]/.test(nav), "글자 화살표(▸ ▾) 대신 그림");
  assert.match(a, /const FN_ICON = \{ dir: '<svg/); for (const k of ["open:", "md:", "code:", "file:"]) assert.ok(a.slice(a.indexOf("const FN_ICON"), a.indexOf("const FN_CHEV")).includes(k), k);
  assert.match(a, /const fKind = \(name\) =>/, "파일 종류 — md · 코드 · 그 밖");
  assert.ok(nav.includes('<i class="chev-w${isOpen ? " on" : ""}">${FN_CHEV}</i>${fIcon(isOpen ? "open" : "dir")}<span>${esc(x.name)}</span>'), "폴더 행: 꺾쇠 · 폴더 그림 · 이름");
  assert.ok(nav.includes('${kids[i] ? `<small class="fn-n">${kids[i]}</small>` : ""}'), "안의 개수(바로 아래만)");
  assert.ok(nav.includes('<i class="chev-w"></i>${fIcon(fKind(x.name))}'), "파일 행: 꺾쇠 자리를 비워 폴더 이름과 줄을 맞춘다");
  assert.match(a, /\["docs", 0, "", "dir", 1\]/, "예시의 펼친 폴더"); assert.match(a, /\["src", 0, "", "dir"\]/, "예시의 접힌 폴더");
  assert.match(c, /\.wnav \.fn li\.dir\{color:var\(--ink\);font-weight:600\}/, "폴더 이름은 굵게 · 진하게(전에는 흐린 회색)");
  assert.match(c, /\.wnav \.fn \.chev-w\.on svg\{transform:rotate\(90deg\)\}/);
  assert.match(c, /\.wnav \.fn li\.d2::before,\.wnav \.fn li\.d3::before,\.wnav \.fn li\.d3::after\{content:"";position:absolute;/, "깊이마다 안내선");
  assert.match(c, /\.wnav \.fn li\.dir button\{all:unset;cursor:pointer;min-height:44px;/, "누르는 곳 44px 그대로");
});
