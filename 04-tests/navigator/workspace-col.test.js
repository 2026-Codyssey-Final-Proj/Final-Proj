// claude-drafted: 2026-10-27 — 작업실 안의 섬 옆 칸(C-41 ⑤, 두승현 "퀘스트뿐 아니라 다른 창도 큰 화면에서 진행, 그 옆에 플로로가 배치되는 형식" · 결정 1번 "작업실을 닫으면 작은 섬이 다시 뜬다").
// 작업실이 열려 있는 동안 섬 창은 숨고, 섬의 내용은 작업실 HTML 끝의 .isl-col로 같이 간다. 칸의 자리는 섬이 class로, 크기 · 손잡이는 작업실(win.js)이. 글자 모양으로 본다(electron 없이).
// 실행: node --test 04-tests/navigator/workspace-col.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");

test("main.js — 작업실이 뜨면 섬 창은 숨고(hide), 닫히면 다시 뜬다(show). 트레이 · 두 번째 실행은 작업실이 열려 있으면 작업실을 앞으로. 창 좌표로 붙이던 길(placeIsland · dockBounds · floe:dock-*)은 없다", () => {
  const m = read("electron/main.js"), p = read("electron/preload.js"), L = require("../../02-frontend/electron/lib.js");
  assert.match(m, /const workspaceOpen = \(\) => !!\(wins\.quest && !wins\.quest\.isDestroyed\(\)\);/);
  assert.match(m, /if \(ws\) w\.once\("ready-to-show", \(\) => \{ if \(win && !win\.isDestroyed\(\)\) win\.hide\(\); \}\);/, "작업실이 뜨면 섬 창은 숨는다");
  assert.match(m, /if \(win && !win\.isDestroyed\(\)\) \{ if \(ws\) win\.show\(\); win\.webContents\.send\("floe:win-closed", kind\); \}/, "닫히면 섬 창이 다시 뜬다");
  assert.match(m, /function showIsland\(\) \{\n  const w = workspaceOpen\(\) \? wins\.quest : win;\n  if \(!w \|\| w\.isDestroyed\(\)\) return createWindow\(\);\n  if \(w\.isMinimized\(\)\) w\.restore\(\);/, "작업실이 열려 있으면 작업실을, 내려가 있으면 올려서");
  assert.match(m, /app\.on\("second-instance", showIsland\);/, "두 번째 실행도 같은 길 — 숨은 섬을 띄우지 않는다(새 맥락 리뷰)");
  assert.match(read("navigator/app.js"), /setup: \(\) => \{ set\(\{ settings: false, qwin: false \}\); if \(window\.FloeSetup\) window\.FloeSetup\.open\(\); \}/, "처음 설정 다시 하기는 작업실을 먼저 닫는다 — 숨은 섬 창에 뜨지 않게");
  for (const gone of ["function placeIsland", "L.dockBounds(", 'ipcMain.on("floe:dock-side"', 'ipcMain.on("floe:dock-inner"', "parkIsland(", "docked() ?"]) assert.ok(!m.includes(gone), `${gone} — 창 둘을 좌표로 맞추던 길은 뺐다(두승현 PC에서 두 번 다 안 붙었다)`);
  for (const gone of ["dockSide:", "dockInner:", "onDock:", "onDockRoom:"]) assert.ok(!p.includes(gone), gone);
  assert.equal(L.dockBounds, undefined);
  assert.match(m, /if \(kind === "quest"\) \{ if \(size === "full"\)/, "작업실 크기는 '화면 가득'(R-1, 2026-10-27)만 — S · M · L은 뺐다");
});

test("app.js — 작업실에 보내는 HTML = 작업실 판 + 섬의 옆 칸(.isl-col side-… narrow|wide). 자리를 바꾸면 다시 그릴 뿐(앱에 보내지 않음). 옆 칸의 채팅 Enter는 섬의 send()로", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const islCol = \(\) => `<div class="isl-col side-\$\{side\} \$\{side === "left" \|\| side === "right" \? "narrow" : "wide"\}\$\{!colFolded\(\) && islBig\(\) \? " center" : ""\}\$\{colFolded\(\) \? " folded" : ""\}\$\{colFolded\(\) && st\.boot \? " has-bub" : ""\}">\$\{colFolded\(\) \? pillHTML\(\) \+ bootBubble\(\) : islandHTML\("", true\)\}<\/div>`;/, "작업실 판 + 섬의 옆 칸(접혀 있으면 알약 — C-46 R-2, 2026-10-27 · 켤 때는 알약 옆 말풍선 — C-55, 2026-10-28)");
  assert.match(a, /\[\["quest", st\.qwin, st\.qwin \? qwinHTML\(\) \+ islCol\(\) : ""\]\]/);
  assert.match(a, /if \(p\.type === "key" && p\.key === "Enter" && p\.act === "say"\) return send\(\);/);
  assert.match(a, /const side = "right";/, "섬은 오른쪽만(2026-10-28 합의)");
  for (const gone of ["applyDock", "setDockSize", "dockInner", "DOCK_W_KEY", "floeApp.dockSide"]) assert.ok(!a.includes(gone), gone);
  assert.ok(!a.includes("const dockBtns"), "섬 머리의 자리 네 칸은 뺐다(PR ②)");
});

test("win.js · win.html — 옆 칸의 자리는 html[data-side], 크기는 --col-w(320 ~ 760 · 창 너비의 반까지, 처음 420) · --col-h(320 ~ 480, 처음 360). 손잡이: 끌기 · 화살표 20 · Home · End · Enter/두 번 누르기. Enter는 채팅 보내기. 대화 기록은 맨 아래를 따라간다", () => {
  const j = read("navigator/win.js"), h = read("navigator/win.html");
  assert.match(j, /const RANGE = \{ w: \[320, 760, 420\], h: \[320, 480, 360\] \}, FOLD = 56;/);
  assert.match(j, /const hiOf = \(axis\) => \(axis === "w" \? Math\.max\(RANGE\.w\[0\], Math\.min\(RANGE\.w\[1\], Math\.floor\(innerWidth \/ 2\)\)\) : RANGE\.h\[1\]\);/, "옆은 760과 창 너비의 반 중 작은 것(두승현 결정 2026-10-27)");
  assert.match(j, /const sideOf = \(\) => \{ const c = root\.querySelector\("\.isl-col"\);/);
  assert.match(j, /h\.dataset\.side = side; hd\.hidden = !side \|\| folded \|\| center;/);
  assert.match(j, /localStorage\.setItem\(axis === "w" \? "floe:col-w" : "floe:col-h", col\[axis\]\)/, "크기는 작업실이 이 컴퓨터에 기억");
  assert.match(j, /if \(e\.key === "Enter"\) reset\(\); else if \(e\.key === grow\) setCol\(col\[axis\] \+ 20\); else if \(e\.key === shrink\) setCol\(col\[axis\] - 20\); else if \(e\.key === "Home"\) setCol\(RANGE\[axis\]\[0\]\); else if \(e\.key === "End"\) setCol\(hiOf\(axis\)\);/);
  assert.match(j, /hd\.addEventListener\("dblclick", reset\)/);
  assert.match(j, /e\.key === "Enter" && !e\.shiftKey && !e\.isComposing && e\.target && e\.target\.dataset && e\.target\.dataset\.act === "say"\) \{ e\.preventDefault\(\); F\.winEvent\(\{ type: "key", key: "Enter", act: "say", kind \}\); \}/, "한글 조합 중의 Enter는 보내지 않는다");
  assert.match(j, /const ls = \(k\) => \{ try \{ return \+localStorage\.getItem\(k\) \|\| 0; \} catch \{ return 0; \} \};/, "저장소가 막혀도 창은 돈다");
  assert.match(j, /lg2\.scrollTop = lgTop === null \|\| lgEnd \? lg2\.scrollHeight : lgTop;/, "대화 기록 — 맨 아래를 보고 있었으면 새 말도 맨 아래");
  assert.match(j, /layoutCol\(\);\n  \}\);/, "다시 그릴 때마다 칸을 다시 잰다");
  assert.match(h, /#root\{height:100vh;box-sizing:border-box;display:grid;grid-template-columns:minmax\(0,1fr\) var\(--col-w,420px\);grid-template-rows:auto minmax\(0,1fr\);grid-template-areas:"wh wh" "win isl";transition:--col-w \.3s cubic-bezier\(\.2,\.8,\.2,1\)\}/, "격자 — 머리 줄 하나 아래 판 · 옆 칸(오른쪽만), 0.3초(기준 8)");
  assert.ok(!h.includes("data-side"), "위 · 아래 · 왼쪽 자리 규칙은 뺐다(2026-10-28 합의)");
  assert.match(h, /@media \(prefers-reduced-motion:reduce\)\{#root\{transition:none\}\}/);
  assert.ok(!j.includes("onDock") && !j.includes("dock-size"), "창 간 통신은 없다");
});

test("app.css — 옆 칸은 작업실 바탕(남색은 그 안의 섬 카드만 — C-62), 옆(narrow)이면 플로로 위 · 대화 아래 · 위 줄 두 줄 · 몸통 세로 스크롤", () => {
  const c = read("navigator/app.css");
  assert.match(c, /html\.in-win:not\(\.win-quest\)\{/, "설정 창만 남색");
  assert.match(c, /\.isl-col\{display:flex;flex-direction:column;min-width:0;min-height:0;padding:10px;background:var\(--desk\)\}/, "옆 칸은 파스텔(C-62)");
  assert.match(c, /\.isl-col \.isl-body\{flex:1 1 auto;min-height:0;overflow:hidden auto\}/);
  assert.match(c, /\.isl-col\.narrow \.mc\.chat\{grid-template-columns:minmax\(0,1fr\)\}/); assert.match(c, /\.isl-col\.narrow \.tb\{flex-wrap:wrap\}/);
  assert.ok(!c.includes("dock-narrow") && !c.includes("dock-wide"));
});
