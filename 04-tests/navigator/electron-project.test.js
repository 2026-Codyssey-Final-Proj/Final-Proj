// claude-drafted: 2026-10-24 — C-31 시작하는 자리의 앱 쪽(main.js · preload.js). electron 모듈 없이 글로 맞대어 본다(electron-side.test.js와 같은 방식).
// 화면은 이름 · 주소 글만 보내고, 폴더 만들기 · 가져오기 · 훅 더하기 · 서버에 알리기는 앱이 한다. 서버 주소(HTTP)로는 열지 않는다.
// 실행: node --test 04-tests/navigator/electron-project.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../..", f), "utf8");
const main = read("02-frontend/electron/main.js"), pre = read("02-frontend/electron/preload.js"), server = read("03-backend/navigator/server.js");

test("preload: 화면이 부탁할 수 있는 셋 — 새로 만들기(이름) · 가져오기(주소 글) · 내 저장소 목록. 경로를 보내는 길은 없다", () => {
  assert.match(pre, /newProject: \(name\) => ipcRenderer\.invoke\("floe:project-new", String\(name \|\| ""\)\)/);
  assert.match(pre, /cloneProject: \(text\) => ipcRenderer\.invoke\("floe:project-clone", String\(text \|\| ""\)\)/);
  assert.match(pre, /myRepos: \(\) => ipcRenderer\.invoke\("floe:project-repos"\)/);
});

test("main.js: 셋 모두 섬 창에서 온 것만, 자리는 홈/Floe(project.js) — 끝나면 같은 길(useFolder)로 훅 · 올리지 않을 설정 · 서버 · 다음 켤 때", () => {
  for (const ch of ["floe:project-new", "floe:project-clone", "floe:project-repos"]) {
    const at = main.indexOf(`ipcMain.handle("${ch}"`); assert.ok(at > 0, ch);
    assert.match(main.slice(at, at + 400), /fromIsland\(e\)/, `${ch}는 섬 창에서만`);
  }
  assert.match(main, /Project\.newFolder\(os\.homedir\(\), name\)/);
  assert.match(main, /Project\.cloneRepo\(os\.homedir\(\), text, \{ ghReady: await Project\.ghReady\(\) \}\)/);
  assert.match(main, /Project\.myRepos\(\{ ghReady: await Project\.ghReady\(\) \}\)/);
  const use = main.slice(main.indexOf("function useFolder(dir)"), main.indexOf("function useFolder(dir)") + 900);
  assert.match(use, /L\.connectDir\(dir, P\.backend, true\)/);
  assert.match(use, /Project\.excludeLocal\(dir\)/);
  assert.match(use, /Server\.useProject\(dir\)/);
  assert.match(use, /projectFile\(\)/);
  assert.match(use, /config: Project\.hasClaudeConfig\(dir\)/, "있는 폴더를 골라도 그 폴더의 Claude Code 설정을 알린다(2차 리뷰)");
  assert.match(main, /const afterPick = \(r\) => \(r\.ok \? \{ \.\.\.useFolder\(r\.dir\), made: r\.made, repo: r\.repo \|\| "", config: !!r\.config \|\| /, "가져오기가 본 config를 버리지 않는다(2차 리뷰 막힘)");
});

test("main.js: 메뉴 · 설정의 '프로젝트 폴더 연결'도 같은 길(useFolder) — 고른 폴더가 곧 플로로가 움직이는 자리. '연결 빼기'는 그 폴더면 잊는다(서버 · project.json)", () => {
  const pick = main.slice(main.indexOf("async function pickAndConnect(add)"), main.indexOf("async function pickAndConnect(add)") + 700);
  assert.match(pick, /add \? useFolder\(r\.filePaths\[0\]\) : dropFolder\(r\.filePaths\[0\]\)/);
  const drop = main.slice(main.indexOf("function dropFolder(dir)"), main.indexOf("function dropFolder(dir)") + 700);
  assert.match(drop, /L\.connectDir\(dir, P\.backend, false\)/);
  assert.match(drop, /Server\.dropProject\(dir\)/);
  assert.match(drop, /projectFile\(\)/);
});

test("main.js: server.js는 한 번만 읽는다(startServer) — 서버를 켜기 전에 폴더를 고르면 project.json에만 남기고, 켠 뒤 restoreProject가 알린다(포트가 굳지 않게)", () => {
  assert.equal((main.match(/require\(path\.join\(P\.backend, "server\.js"\)\)/g) || []).length, 1);
  assert.match(main, /if \(Server\) Server\.useProject\(dir\)/);
});

test("main.js: 다시 켜면 지난번 폴더를 서버에 다시 알린다(서버를 켠 뒤) — 폴더가 없어졌으면 조용히 넘어간다", () => {
  const ready = main.slice(main.indexOf("app.whenReady()"));
  const at = ready.indexOf("serverState = await startServer()"), back = ready.indexOf("restoreProject()");
  assert.ok(at > 0 && back > at, "서버를 켠 뒤에");
  assert.match(main, /function restoreProject\(\)/);
  const rp = main.slice(main.indexOf("function restoreProject()"), main.indexOf("function restoreProject()") + 400);
  assert.match(rp, /L\.refreshDir\(dir, P\.backend\)/, "다시 켤 때 그 폴더의 훅이 지금 앱 자리를 가리키게(F-69 — 옛 자리 훅이면 맡긴 일이 모두 막힌다)");
});

test("main.js: 대화 저장 곳은 이 컴퓨터의 앱 저장 곳 — 서버를 읽기 전에 NAV_CHAT_DIR을 userData/chats로(작업실 개편 C-63, 결정 모음 A-20)", () => {
  const st = main.slice(main.indexOf("async function startServer()"), main.indexOf("async function startServer()") + 600);
  const at = st.indexOf('process.env.NAV_CHAT_DIR = path.join(app.getPath("userData"), "chats")'), req = st.indexOf('require(path.join(P.backend, "server.js"))');
  assert.ok(at > 0 && req > at, "서버를 읽기 전에");
});

test("서버에는 폴더를 받는 HTTP 주소가 없다 — useProject는 내보내기로만(앱만 부른다)", () => {
  assert.doesNotMatch(server, /route === "\/api\/project/);
  assert.match(server, /module\.exports = \{[^}]*useProject/);
});
