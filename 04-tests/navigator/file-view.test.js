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
