// claude-drafted: 2026-10-27 — C-43 파일 보기 · 고치기의 글 모양(electron · 브라우저 없이). 동작은 e2e/file-view.test.js · 서버는 files-api.test.js
// 실행: node --test 04-tests/navigator/file-view.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");

test("app.js — 파일 칸의 파일은 단추(번호로 연다), 찾기 칸, 열린 파일 탭 · 판(file), 저장은 commit: true(저장마다 커밋 맡기기), 409마다 묻는 알림, 이력 20번 · 되돌리기, ⌘/Ctrl+S", () => {
  const a = read("navigator/app.js");
  assert.match(a, /class="fn-file" data-act="fn-open" data-v="\$\{i\}"/, "파일 행은 번호로 연다 — 경로를 보내지 않는다");
  assert.match(a, /<input class="fn-find" type="search" data-act="fn-find"/, "이름 찾기");
  assert.match(a, /await fetch\(`\/api\/file\?i=\$\{n\}`, \{ cache: "no-store" \}\)/);
  assert.match(a, /body: JSON\.stringify\(\{ i: f\.i, path: f\.path, text: f\.text, mtime: f\.mtime, eol: f\.eol, commit: true, \.\.\.opt \}\)/, "저장마다 커밋 맡기기(이재엽 버튼) · 경로 확인 · 줄 끝 되돌리기");
  assert.match(a, /if \(!f \|\| \(!f\.dirty && !opt\.overwrite\)\) return;/, "고친 것이 없으면 쓰지 않는다(빈 커밋 없음)"); assert.match(a, /if \(k < st\.fileSel\) st\.fileSel--;/, "앞 탭을 닫으면 선택 보정");
  assert.match(a, /st\.gh = null; st\.openFiles = \[\]; st\.fileSel = -1; st\.files = null;/, "폴더가 바뀌면 열린 파일을 비운다"); assert.match(a, /if \(e\.origin !== location\.origin\) return;/, "postMessage 출처 확인");
  assert.match(a, /"fsave-busy": \(i, el\) => saveFile\(Number\(el && el\.dataset\.v\), \{ ignoreBusy: true \}\)/, "깃발을 나눴다");
  for (const s of ['why === "sensitive"', 'why === "changed"', 'why === "busy"', '["그대로 저장", "fsave-force"]', '["다시 열기", "freload"], ["덮어쓰기", "fsave-over"]']) assert.ok(a.includes(s), s);
  assert.match(a, /const MDV = window\.FloeMd \|\| null, FHIST_MAX = 20;/); assert.match(a, /f\.hist\.push\(\{ at: Date\.now\(\), text: f\.saved \}\); if \(f\.hist\.length > FHIST_MAX\) f\.hist\.shift\(\);/, "저장 이력 20번");
  assert.match(a, /fundo: \(i, el\) => \{/, "되돌리기"); assert.match(a, /st\.qtab === "file" \? filePane\(\)/);
  assert.match(a, /\(e\.metaKey \|\| e\.ctrlKey\) && e\.key\.toLowerCase\(\) === "s" && st\.qwin && st\.qtab === "file"/, "브라우저의 ⌘S"); assert.match(a, /if \(p\.type === "key" && p\.key === "s" && p\.mod\) \{ if \(st\.qtab === "file"\) ACT\.fsave\(\); return; \}/, "작업실 창의 ⌘S");
  assert.match(a, /\$\{MDV\.toHtml\(f\.text\)\}/, "md는 md-view.js로"); assert.match(a, /<pre class="fv-code"><ol>/, "코드는 줄 번호");
  assert.match(read("navigator/win.js"), /if \(\(e\.metaKey \|\| e\.ctrlKey\) && e\.key\.toLowerCase\(\) === "s"\) \{ e\.preventDefault\(\); return F\.winEvent\(\{ type: "key", key: "s", mod: true, kind \}\); \}/);
  assert.match(read("navigator/index.html"), /<script src="\.\.\/\.\.\/03-backend\/navigator\/md-view\.js" onerror="this\.remove\(\)"><\/script>/);
  const c = read("navigator/app.css");
  assert.match(c, /\.wnav \.fn li \.fn-file\{all:unset;cursor:pointer;flex:1;min-height:44px;/, "파일 행도 44px"); assert.match(c, /\.wtabs \.ftab \.ftab-x\{position:absolute;top:-7px;right:-5px;[^}]*width:16px;height:16px/, "닫기 ×는 탭 오른쪽 위 작은 배지"); assert.match(c, /\.wtabs \.ftab \.ftab-x::after\{[^}]*inset:-4px/, "누르는 곳은 24px — 탭 이름을 덮지 않게"); assert.doesNotMatch(c, /\.ftab \.fx\b/, "닫기 단추가 반짝이 효과(.fx — position:fixed)와 이름을 나누면 ×가 왼쪽 위로 밀린다"); assert.match(c, /\.fpreset\{min-height:44px;/); assert.match(c, /\.fv-code li::before\{content:counter\(ln\)/, "줄 번호"); assert.match(c, /\.fv-code li\.chg\{background:var\(--okbg\)\}/, "바뀐 줄");
});

test("server.js — /api/file은 확인 값(BOOK_ROUTES) · POST_ROUTES, 열기는 목록 번호로만(경로 없음), 저장 본문은 파일 크기만큼, md-view.js는 서버가 내준다", () => {
  const s = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8");
  assert.match(s, /const BOOK_ROUTES = \["\/api\/readme", "\/api\/files", "\/api\/file",/); assert.match(s, /const POST_ROUTES = \["\/api\/file",/);
  assert.match(s, /const file = Files\.safePath\(lastFiles\.dir, e\.raw\);/, "그 폴더 안 · 바로가기 없이"); assert.match(s, /readJson\(req, Files\.FILE_MAX \* 2 \+ 1000\)/);
  assert.match(s, /"readme-book\.js", "md-view\.js",/);
});

// C-44 맡기기 틀(이재엽 버튼 "지금 자리에 더한다") · C-45 문서 지도(버튼 "작업실의 새 탭" · "앱에 한 벌 넣기")
test("app.js — 연 파일 머리의 '틀로 맡기기' 고르기 · 채팅의 '문서 틀' 칩 → presets.js의 글 · 끝 조건으로 /api/task/start, 보고가 오면 파일을 다시 읽는다; '문서 지도' 탭은 docmap.html iframe, 상자의 열기는 map-open", () => {
  const a = read("navigator/app.js"), s = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8");
  assert.match(a, /const QTABS = \[\["canvas", "캔버스"\], \["quest", "노트북"\], \["tree", "도전과제"\], \["lib", SHELF_ON \? "서고" : "책"\]\];/);
  assert.match(a, /<iframe class="docmap" src="\/navigator\/docmap\.html#now=\$\{encodeURIComponent\(nowDocPath\(n\)\)\}"/, "지금 장 문서는 주소 끝(#)으로 — 물음표 뒤가 붙으면 화면 파일을 못 찾는다");
  assert.match(a, /"map-open": \(i, el\) => \{/, "상자의 '파일 보기에서 열기' → 목록의 번호로 연다"); assert.match(a, /window\.addEventListener\("message", \(e\) => \{ if \(e\.origin !== location\.origin\) return; const d = e\.data; if \(d && d\.floe === "open"/);
  assert.match(a, /const PR = window\.FloePresets \|\| null;/); assert.match(a, /data-act="preset-pick"/, "연 파일 머리의 틀 고르기"); assert.match(a, /\{ label: "문서 틀", act: "preset-open", kind: "ghost" \}/, "채팅 칩");
  assert.match(a, /await fetch\("\/api\/preset", \{ method: "POST"/, "틀은 서버가 번호 → 경로로 바꿔 맡긴다(화면은 가린 경로를 보내지 않는다)"); assert.match(s, /route === "\/api\/preset"/); assert.match(a, /watchTask\(r\.task, "preset"\)/, "맡긴 일 지켜보기로(F-69 — 전에는 계획 줄을 지켜볼 때만 다시 읽었다)"); assert.match(a, /function presetEnd\(t\) \{[^}]*reloadFile\(k\)/, "끝나면 다시 읽기");
  assert.match(read("navigator/win.js"), /d\.floe === "open" && typeof d\.path === "string"\) F\.winEvent\(\{ type: "click", act: "map-open"/);
  assert.match(s, /"03-backend\/navigator\/board": \["board\.js", "board\.css"\]/, "엔진 사본을 서버가 내준다"); assert.match(s, /route === "\/api\/docmap"/);
  assert.match(read("navigator/docmap.html"), /\.\.\/\.\.\/03-backend\/navigator\/board\/board\.js/, "엔진은 앱 안의 사본 — 밖으로 요청하지 않는다");
  assert.ok(fs.existsSync(path.join(__dirname, "../../03-backend/navigator/board/LICENSE")), "MIT 라이선스 사본");
});

// C-53(2026-10-28 이재엽 버튼: 오른쪽 칸은 섬을 펼치면 접힘 · 서식 단추는 만든다): 작업실 세 칸 — 파일 칸(.wnav: 열어 둔 파일 묶음 · 찾기 · 목록) | 작업 칸(.wbody: 보기 고르기 · 문서 도구 줄 · 상태 줄) | 오른쪽 칸(.wside: 이 문서 — 목차 · 칸 채움 · 재료 / 퀘스트 — 다섯 칸 · 관문)
test("app.js · win.js · app.css — 작업실 세 칸(파일 · 작업 · 오른쪽), 칸 접기 단추, 섬을 펼치면 오른쪽 칸이 접힘, 문서 도구 줄(서식 · 글 크기 · 목차 · 찾기) · 상태 줄(저장 수 · 바뀐 줄 · 줄 위치 · 줄 끝)", () => {
  const a = read("navigator/app.js"), w = read("navigator/win.js"), c = read("navigator/app.css");
  assert.match(a, /<aside class="wside"/, "오른쪽 칸"); assert.match(a, /data-act="wnav-toggle"/, "파일 칸 접기"); assert.match(a, /data-act="wside-toggle"/, "오른쪽 칸 접기");
  assert.match(a, /const sideOn = \(\) => wsideOpen && \(!WINS \|\| colFolded\(\)\);/, "앱에서 섬을 펼치면(접힌 알약이 아니면) 오른쪽 칸이 접힌다 — 이재엽 버튼");
  assert.match(a, /class="fn fn-open"/, "파일 칸 맨 위 '열어 둔 파일' 묶음");
  for (const k of ["h2", "bold", "list", "link", "front"]) assert.match(a, new RegExp(`\\["${k}", "`), `서식 단추 ${k}`); assert.match(a, /data-act="ffmt" data-fmt="\$\{id\}"/, "서식 단추는 ffmt + 종류");
  assert.match(a, /data-act="fsize" data-v="[-+]"/, "글 크기"); assert.match(a, /data-act="ffind"/, "문서 안 찾기"); assert.match(a, /data-act="ftoc"/, "목차(오른쪽 칸으로)");
  assert.match(a, /class="fv-st"/, "상태 줄"); assert.match(a, /eol === "crlf" \? "CRLF" : "LF"/, "줄 끝");
  assert.match(a, /MDV\.format\(/, "서식은 md-view.js format 하나로(브라우저 판)"); assert.match(w, /FloeMd\.format\(/, "앱의 작업실 창도 같은 함수로(글 칸은 창 안에 있다)");
  assert.match(w, /F\.winEvent\(\{ type: "caret"/, "글 칸의 줄 위치를 섬으로 보낸다");
  assert.match(c, /\.wside\{/, "오른쪽 칸 모양"); assert.match(c, /@container \(max-width:899px\)\{[^}]*\.wside/, "좁으면(900 아래) 오른쪽 칸은 숨는다");
  assert.match(c, /\.fv-tools button\{[^}]*min-height:44px/, "도구 줄 단추 44px");
});

// C-54(2026-10-28, 이재엽 버튼 "탭 이름은 '도전과제' 그대로" · "준비된 퀘스트 확인은 한 번에"): 도전과제 탭 = 카드 지도(stagemap.js) + 흐름(C-39 jmap) + 상자(C-45 문서 지도 iframe) — 보기 셋. 2단계 칸을 다 채우면 '기획서로 3 ~ 8단계 그리기' → 준비된 퀘스트 → 맞아요(한 번에) / 고칠래요
test("app.js — 도전과제 탭의 보기 셋(지도 · 흐름 · 상자), 카드 지도는 stagemap.js, 그리기 · 맞아요 · 고칠래요, 카드를 누르면 오른쪽 칸에 그 퀘스트 · 문서, 준비된 ① 생각은 캔버스의 초안으로", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const SM = window\.NavStageMap/, "규칙은 stagemap.js"); assert.match(a, /"prep", "source", "card"\]/, "준비된 퀘스트는 기록(KEEP)에");
  assert.match(a, /const views = \[\["cards", "지도"\], \["flow", "흐름"\], \["box", "상자"\]\]/, "보기 셋"); assert.match(a, /data-act="tree-view" data-v="\$\{v\}"/);
  for (const act of ["prep-draw", "prep-ok", "prep-fix", "map-card"]) assert.match(a, new RegExp(`"${act}": `), act);
  assert.match(a, /SM\.build\(\{/); assert.match(a, /SM\.prepare\(\{/);
  assert.match(a, /st\.qtab === "tree" && st\.mapSel != null/, "오른쪽 칸 — 누른 카드의 퀘스트 · 문서");
  assert.match(a, /prepThink/, "준비된 ① 생각은 캔버스 ① 생각의 초안 자리에");
  assert.ok(!a.includes('["map", "문서 지도"]'), "문서 지도 탭은 도전과제 안의 '상자' 보기로");
  assert.match(read("navigator/index.html"), /03-backend\/navigator\/stagemap\.js/); assert.match(read("../03-backend/navigator/server.js"), /"stagemap\.js"/, "서버가 내준다");
});

test("목차를 누르면 그 제목 줄로 옮겨 간다 — 줄 번호를 실어 보내고, 섬 · 앱 창 둘 다 한 번만 스크롤(임유정 2026-10-28 '하이라이팅은 되는데 이동은 안 함')", () => {
  const a = read("navigator/app.js"), w = read("navigator/win.js");
  assert.match(a, /data-act="ftoc-go" data-v="\$\{esc\(h\.text\)\}" data-line="\$\{h\.line\}"/, "목차 단추에 제목 줄 번호");
  assert.match(a, /f\.go = f\.edit \? null : \{ line: Number\(el && el\.dataset\.line\) \|\| 0, seq: \+\+tocGo \}/, "누를 때마다 새 차례 번호 — 고치는 중엔 남기지 않는다(끝내면 옛 제목으로 끌려갔다)");
  assert.match(a, /f\.go && f\.go\.seq === tocGo && f\.go\.line === j \+ 1 \? ` data-go="\$\{f\.go\.seq\}"`/, "마지막으로 누른 것만 표시 — 다른 파일로 갔다 오면 옛 제목으로 끌려가지 않게");
  for (const [name, s] of [["섬(브라우저 판)", a], ["앱 창", w]]) assert.ok(s.includes('if (go && go.dataset.go !== goShown) { goShown = go.dataset.go; const p = go.closest(".fv-code"); if (p) p.scrollTop = go.offsetTop - (p.clientHeight - go.offsetHeight) / 2; }'), `${name} — 같은 번호로는 다시 끌어가지 않고, 글 칸만 옮긴다`);
  assert.match(read("navigator/app.css"), /\.fv-code\{position:relative;/, "줄의 offsetTop이 글 칸 기준이 되게");
});

test("파일 보기의 글 칸 스크롤은 다시 그려도 그 자리 — 같은 파일 · 같은 보기일 때만(섬 · 앱 창 둘 다)", () => {
  const a = read("navigator/app.js"), w = read("navigator/win.js");
  assert.match(a, /<div class="fv" data-f="\$\{esc\(f\.path\)\}"/, "어느 파일인지 표시");
  for (const [name, s] of [["섬(브라우저 판)", a], ["앱 창", w]]) assert.ok(s.includes('if (b && b.className === was.c && fv.dataset.f === was.f) { b.scrollTop = was.top; b.scrollLeft = was.left; }'), `${name} — 같은 파일 · 보기일 때만 되돌린다`);
  assert.ok(a.indexOf('fvScroll($nav.querySelector(".qwin .fv"), fvWas);') < a.indexOf('const go = $nav.querySelector(".qwin [data-go]")'), "되돌린 뒤에 목차 스크롤 — 목차로 고른 줄이 이긴다");
  assert.ok(w.indexOf('fvScroll(root.querySelector(".fv"), fvWas);') < w.indexOf('const go = root.querySelector("[data-go]")'), "앱 창도 같은 차례");
});

test("파일 칸 · 오른쪽 칸의 스크롤도 다시 그려도 그 자리 — 아래쪽 목차를 누르면 맨 위로 올라갔다(임유정 2026-10-28)", () => {
  const a = read("navigator/app.js"), w = read("navigator/win.js");
  for (const [name, s] of [["섬(브라우저 판)", a], ["앱 창", w]]) { assert.ok(s.includes('const WS_PANES = [".wnav", ".wside"];'), `${name} — 지키는 칸`); assert.match(s, /WS_PANES\.forEach\(\(c, j\) => \{ const e = [^;]+; if \(e && sideWas\[j\] != null\) e\.scrollTop = sideWas\[j\]; \}\);/, `${name} — 되돌린다`); }
});
