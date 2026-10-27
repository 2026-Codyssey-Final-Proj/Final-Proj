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
  assert.match(a, /body: JSON\.stringify\(\{ i: f\.i, text: f\.text, mtime: f\.mtime, commit: true, \.\.\.opt \}\)/, "저장마다 커밋 맡기기(이재엽 버튼)");
  for (const s of ['why === "sensitive"', 'why === "changed"', 'why === "busy"', '["그대로 저장", "fsave-force"]', '["다시 열기", "freload"], ["덮어쓰기", "fsave-over"]']) assert.ok(a.includes(s), s);
  assert.match(a, /const MDV = window\.FloeMd \|\| null, FHIST_MAX = 20;/); assert.match(a, /f\.hist\.push\(\{ at: Date\.now\(\), text: f\.saved \}\); if \(f\.hist\.length > FHIST_MAX\) f\.hist\.shift\(\);/, "저장 이력 20번");
  assert.match(a, /fundo: \(i, el\) => \{/, "되돌리기"); assert.match(a, /st\.qtab === "file" \? filePane\(\)/);
  assert.match(a, /\(e\.metaKey \|\| e\.ctrlKey\) && e\.key\.toLowerCase\(\) === "s" && st\.qwin && st\.qtab === "file"/, "브라우저의 ⌘S"); assert.match(a, /if \(p\.type === "key" && p\.key === "s" && p\.mod\) \{ if \(st\.qtab === "file"\) ACT\.fsave\(\); return; \}/, "작업실 창의 ⌘S");
  assert.match(a, /\$\{MDV\.toHtml\(f\.text\)\}/, "md는 md-view.js로"); assert.match(a, /<pre class="fv-code"><ol>/, "코드는 줄 번호");
  assert.match(read("navigator/win.js"), /if \(\(e\.metaKey \|\| e\.ctrlKey\) && e\.key\.toLowerCase\(\) === "s"\) \{ e\.preventDefault\(\); return F\.winEvent\(\{ type: "key", key: "s", mod: true, kind \}\); \}/);
  assert.match(read("navigator/index.html"), /<script src="\.\.\/\.\.\/03-backend\/navigator\/md-view\.js" onerror="this\.remove\(\)"><\/script>/);
  const c = read("navigator/app.css");
  assert.match(c, /\.wnav \.fn li \.fn-file\{all:unset;cursor:pointer;flex:1;min-height:44px;/, "파일 행도 44px"); assert.match(c, /\.fv-code li::before\{content:counter\(ln\)/, "줄 번호"); assert.match(c, /\.fv-code li\.chg\{background:var\(--okbg\)\}/, "바뀐 줄");
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
  assert.match(a, /const QTABS = \[\["canvas", "캔버스"\], \["quest", "노트북"\], \["tree", "도전과제"\], \["lib", SHELF_ON \? "서고" : "책"\], \["map", "문서 지도"\]\];/);
  assert.match(a, /<iframe class="docmap" src="\/navigator\/docmap\.html#now=\$\{encodeURIComponent\(nowDocPath\(n\)\)\}"/, "지금 장 문서는 주소 끝(#)으로 — 물음표 뒤가 붙으면 화면 파일을 못 찾는다");
  assert.match(a, /"map-open": \(i, el\) => \{/, "상자의 '파일 보기에서 열기' → 목록의 번호로 연다"); assert.match(a, /window\.addEventListener\("message", \(e\) => \{ const d = e\.data; if \(d && d\.floe === "open"/);
  assert.match(a, /const PR = window\.FloePresets \|\| null;/); assert.match(a, /data-act="preset-pick"/, "연 파일 머리의 틀 고르기"); assert.match(a, /\{ label: "문서 틀", act: "preset-open", kind: "ghost" \}/, "채팅 칩");
  assert.match(a, /body: JSON\.stringify\(\{ text, checks: PR\.checksOf\(p\) \}\)/, "틀의 글과 끝 조건으로 맡긴다(FR-17 그대로)"); assert.match(a, /if \(t && t\.report && st\.presetTask\)/, "보고가 오면 다시 읽기");
  assert.match(read("navigator/win.js"), /d\.floe === "open" && typeof d\.path === "string"\) F\.winEvent\(\{ type: "click", act: "map-open"/);
  assert.match(s, /"03-backend\/navigator\/board": \["board\.js", "board\.css"\]/, "엔진 사본을 서버가 내준다"); assert.match(s, /route === "\/api\/docmap"/);
  assert.match(read("navigator/docmap.html"), /\.\.\/\.\.\/03-backend\/navigator\/board\/board\.js/, "엔진은 앱 안의 사본 — 밖으로 요청하지 않는다");
  assert.ok(fs.existsSync(path.join(__dirname, "../../03-backend/navigator/board/LICENSE")), "MIT 라이선스 사본");
});
