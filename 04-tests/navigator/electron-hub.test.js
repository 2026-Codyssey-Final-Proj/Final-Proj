// claude-drafted: 2026-10-23 — 이재엽 결정("퀘스트도 지우고 브라우저 창도 켜지는거 지워줘 그리고 브라우저 나오는건 기능자체를 빼줘").
// 모아 보기 창(C-11 · C-12, 2026-10-20)을 뺐다 — 앱(main.js)이 따로 뜨는 창 · 브라우저를 열지 않고, 트레이 · Dock을 누르면 섬 창이 앞으로 온다.
// 섬(app.js) 위쪽 줄에는 퀘스트 창 단추 · 모아 보기 단추가 없다. 알림 · AI 진행은 섬 안의 판에만 있고, hub.js는 그 판이 쓰는 순수 함수만 남는다.
// electron 모듈 없이 — main.js · preload.js · app.js는 글로 맞대어 본다(electron-cursor.test.js와 같은 방식).
// 실행: node --test 04-tests/navigator/electron-hub.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const code = (s) => s.replace(/(^|\s)\/\/[^\n]*/g, "$1");   // 주석은 뺀다(https:// 는 남긴다) — 옛 이름이 설명에 남아도 된다

test("main.js — 모아 보기 창이 없다: openHub · floe:open-hub · floe:enter · hub/index.html을 부르지 않는다", () => {
  const main = code(read("electron/main.js"));
  for (const bad of ["openHub", "floe:open-hub", "floe:enter", "hub/index.html", "hubBounds"]) assert.ok(!main.includes(bad), `main.js에 ${bad}가 없어야`);
  assert.equal(L.hubBounds, undefined, "lib.js의 창 크기 함수도 뺐다");
});

test("main.js — 메뉴 '모아 보기 열기'가 없다. '브라우저로 열기' · '새 버전 확인(Releases)'은 남는다(이재엽 2026-10-23 \"이 기능만 지우고 싶었어\")", () => {
  const main = read("electron/main.js");
  assert.doesNotMatch(main, /label: "모아 보기 열기"/);
  assert.match(main, /\{ label: "브라우저로 열기", click: \(\) => shell\.openExternal\(`http:\/\/127\.0\.0\.1:\$\{PORT\}\/`\) \},/);
  assert.match(main, /새 버전 확인 \(Releases\)/);
});

test("main.js — 트레이 클릭 · Dock(activate) · 메뉴 '창 다시 열기'는 섬 창을 앞으로(없으면 만든다)", () => {
  const main = read("electron/main.js");
  assert.match(main, /function showIsland\(\) \{\n  const w = workspaceOpen\(\) \? wins\.quest : win;/);
  assert.match(main, /tray\.on\("click", showIsland\)/);
  assert.match(main, /app\.on\("activate", showIsland\)/);
  assert.match(main, /label: "창 다시 열기", click: showIsland/);
});

test("main.js — 창 크기 함수들(createWindow · expandWindow · floe:resize)은 그대로 있다", () => {
  const main = read("electron/main.js");
  for (const s of ["function createWindow()", "function expandWindow()", 'ipcMain.on("floe:resize"', 'ipcMain.on("floe:expand"']) assert.ok(main.includes(s), s);
});

test("preload.js — openHub · enter · onEnter가 없다", () => {
  const pre = code(read("electron/preload.js"));
  for (const bad of ["openHub", "floe:open-hub", "floe:enter", "onEnter"]) assert.ok(!pre.includes(bad), `preload.js에 ${bad}가 없어야`);
});

test("섬(app.js) — 위쪽 줄에 퀘스트 창 단추 · 모아 보기 단추가 없고, 판에 '크게 보기'가 없다. 퀘스트 창은 명령 칸 · '공책 보기'로 연다", () => {
  const app = read("navigator/app.js");
  const tb = app.slice(app.indexOf("const tbRight = () =>"), app.indexOf("function stageBand()"));
  assert.ok(tb.length > 100, "tbRight");
  assert.doesNotMatch(tb, /data-act="qwin"/, "퀘스트 창 단추가 없다");
  assert.doesNotMatch(tb, /data-act="hub"/, "모아 보기 단추가 없다");
  assert.match(tb, /data-act="shells"/, "조개는 남는다");
  assert.match(tb, /data-act="settings"/, "설정 단추는 남는다");
  const c = code(app);
  for (const bad of ["openHub", "hub/index.html", "floe-hub", "onEnter", '"hub-alerts"', "data-act=\"hub-"]) assert.ok(!c.includes(bad), `app.js에 ${bad}가 없어야`);
  assert.match(app, /"qwin-quest": \(\) => \{ openQwin\("quest"\); render\(\); \}/, "'공책 보기'로 퀘스트 창");
  assert.match(app, /data-act="qwin" aria-label="작업실 창 닫기"/, "퀘스트 창(2026-10-26부터 작업실 창, C-41) 안의 닫기는 남는다");
  assert.match(app, /qwin: \(\) => set\(\{ qwin: false \}\),/, "×는 닫기만(켜고 끄기가 아니다)");
});

test("서버(server.js)는 모아 보기 창의 화면 파일을 내주지 않는다 — 섬이 쓰는 hub.js(순수 함수)만", () => {
  const { FILES } = require("../../03-backend/navigator/server.js");
  assert.ok(FILES["/hub/hub.js"], "/hub/hub.js");
  for (const f of ["index.html", "hub.css"]) assert.ok(!FILES[`/hub/${f}`], `/hub/${f}가 없어야`);
  for (const f of ["index.html", "hub.css"]) assert.ok(!fs.existsSync(path.join(FRONT, "hub", f)), `02-frontend/hub/${f}를 지웠다`);
});
