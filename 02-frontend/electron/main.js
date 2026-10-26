// claude-drafted: 2026-10-19 — Floe 오버레이 앱의 껍데기(Electron). 이재엽 요청("dmg로 하나 만들어서 여기서라도 한번 테스트").
// 하는 일: ① 앱 설정 폴더의 .env(내 키, 있으면) → ② Mac에서 로그인 셸의 PATH(claude 명령) → ③ 같은 프로세스에서 Floe 서버(server.js handle)를
// 127.0.0.1에 띄우고 → ④ 항상 위에 뜨는 투명 창으로 그 주소를 연다. 메뉴에서 프로젝트 폴더에 훅을 더하거나 뺀다(lib.js connectDir).
// 화면 · 서버 코드는 손대지 않고 그대로 감쌌다(02-frontend/README.md 2절의 Electron 오버레이 계획). AI를 부르는 곳은 여전히 provider.js 하나.
// 개발 중: `npm start`(저장소 코드를 바로 읽음) · 묶기: `npm run dist`(prebuild.js가 payload/로 복사 → dmg) · `dist:win`(exe) · `dist:linux`(AppImage · deb, 6.0.0 — 이재엽 "우분투에서도 돌아가는 버전")
// Mac이 아니면(Windows · Linux) 테두리 없는 창에는 메뉴 줄이 없다 — 같은 메뉴를 **창 우클릭**과 **알림 영역(트레이) 아이콘**에 둔다.
// 2026-10-20(이재엽, C-10 · 서재 전환): ① 창을 **먼저** 만들어 '켜지는 중'(lib.js bootPage)을 보이고 서버가 켜지면 화면을 연다(빈 화면 없이)
//   ② 서고에 있는 동안은 창을 사람이 조절할 수 있고(resizable) 조절한 크기를 기억한다 ③ 작업 화면으로 돌아오면 섬 자리로 되돌린다(Mac은 줄어드는 것이 보인다)
const { app, BrowserWindow, Menu, Tray, nativeImage, dialog, ipcMain, shell, screen } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawnSync, execFile } = require("node:child_process");
const L = require("./lib.js");
// Windows 아이콘(F-59, 2026-10-26 — 이재엽 "윈도우 환경에서 앱이 우리 플로 사진이 아닌 문제"): 앱 ID를 설치 바로 가기와 같은 값(L.APP_ID = package.json appId — electron-builder가 바로 가기에 쓴다)으로 정해
//   작업 표시줄이 고정한 바로 가기 · 플로로 아이콘과 묶이게 하고, 창마다 아이콘을 준다(개발 실행도 Electron 기본 그림 대신 플로로)
const ICON = L.appIcon(process.platform, __dirname), ICON_OPT = ICON ? { icon: ICON } : {};
// 개발 실행은 제 경로를 앱 ID로 — 설치본을 작업 표시줄에 고정한 PC에서 npm start 창이 설치본 단추에 묶이지 않게(2026-10-26 리뷰). package.json을 읽지 않는다 — 묶은 앱에서는 build가 지워진다
if (process.platform === "win32") app.setAppUserModelId(app.isPackaged ? L.APP_ID : process.execPath);

// F-42(2026-10-20): 한 번에 하나만 — 옛 앱이 켜진 채 새 것을 열면 둘이 다른 포트로 떠 섬이 겹치고 훅은 옛 쪽으로 갔다. 두 번째는 켜진 쪽을 앞으로 부르고 쉬운 말로 알린 뒤 끝난다.
//   켜진 쪽이 옛 버전이어도 바꿔 켜지 않는다 [제안] — 사람이 옛 것을 끝내고 새 것을 연다(알림 글에 적는다)
if (!app.requestSingleInstanceLock()) {
  dialog.showErrorBox("Floe", "Floe가 이미 켜져 있어요. 켜진 Floe를 먼저 끝낸 뒤(메뉴 Floe → 끝내기) 새 것을 열어 주세요.");
  app.quit();
}
app.on("second-instance", () => { if (win && !win.isDestroyed()) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
const P = L.paths(app.isPackaged, __dirname);
const WANT = Number(process.env.NAV_PORT) || 4317;
const RELEASES = "https://github.com/2026-Codyssey-Final-Proj/Final-Proj/releases";
let PORT = WANT, URL_ = "", win = null, tray = null, serverState = "", Server = null;   // Server — server.js(startServer가 한 번 읽는다 — 그 전에 읽으면 포트 값이 굳는다)
const LINUX = process.platform === "linux";
// Linux: 투명 창은 ARGB 비주얼을 켜 달라고 미리 말해야 한다(아니면 뒤가 검게 나올 수 있다). 창은 ready 뒤 잠깐 기다려 만든다(아래)
if (LINUX) app.commandLine.appendSwitch("enable-transparent-visuals");
// 앱은 늘 자기 서버를 켠다 — 같은 포트에 다른 서버(터미널의 옛 server.js 등)가 있으면 그쪽에 붙지 않고 옆 빈 포트를 쓴다.
// (2026-10-19 첫 알파에서 옛 서버에 붙어 옛 화면 · 배경이 보였다 — 이재엽 보고)
const freePort = (from) => new Promise((resolve) => {
  const s = net.createServer(); s.unref();
  s.on("error", () => resolve(freePort(from + 1)));
  s.listen(from, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
});

// ① .env — 앱 설정 폴더(이 사용자만)에 둔다. 저장소 · 앱 묶음 안에는 없다
const envFile = () => path.join(app.getPath("userData"), ".env");
function loadEnv() {
  const file = envFile();
  try { L.applyEnv(process.env, L.parseEnv(fs.readFileSync(file, "utf8"))); return file; } catch { return ""; }
}
// ② Mac 더블클릭 앱 · Linux 앱 메뉴(AppImage · deb)로 연 앱의 PATH는 짧다 — 로그인 셸의 PATH를 합쳐 `claude`(~/.local/bin 등)를 찾게
// 2026-10-20: 기다리지 않는다(execFile) — 창을 먼저 띄운 뒤 셸을 묻는 4초 동안 메인 프로세스가 멈추면 '켜지는 중'도 멈춘다
function fixPath() {
  if (!L.wantsShellPath(process.platform)) return Promise.resolve();
  return new Promise((resolve) => {
    execFile(L.loginShell(process.platform, process.env), ["-ilc", "echo $PATH"], { encoding: "utf8", timeout: 4000 }, (err, stdout) => {
      if (!err && stdout) process.env.PATH = L.mergePath(process.env.PATH, stdout.trim().split("\n").pop());
      resolve();
    });
  });
}
// ③ 서버 — 빈 포트를 찾아 같은 프로세스에서 켠다(server.js의 handle). 포트는 server.js가 읽기 전에 환경에 넣는다
async function startServer() {
  PORT = await freePort(WANT);
  URL_ = `http://127.0.0.1:${PORT}/`;   // 화면 파일은 정확한 경로만(API 약속) — 앱 안임은 preload.js가 둔 window.floeApp으로 안다
  process.env.NAV_PORT = String(PORT);
  Server = require(path.join(P.backend, "server.js"));
  return new Promise((resolve) => {
    const s = http.createServer(Server.handle);
    s.on("error", (e) => resolve(`error:${e.code || e.message}`));
    s.listen(PORT, "127.0.0.1", () => { try { Server.eventToken(); } catch {} resolve("ok"); });
  });
}
// ④ 창 — 테두리 없음 · 투명 · 항상 위 · 모든 작업 공간. 위쪽 가운데에서 시작한다.
// 크기는 화면(app.js)이 지금 보이는 섬의 크기를 보내 주면 그때그때 맞춘다(floe:resize) — 첫 알파(3.0.0)에서 1040×760 투명 창의 빈 영역이
// 뒤 창(VS Code · 터미널)의 클릭을 전부 가로채고 그리기도 무거웠다(이재엽 보고 2026-10-19 "클릭이 안 된다" · "랙")
const PAD = 6, MIN_W = 240, MIN_H = 60;
const ISLAND_W = 940 + PAD * 2;   // 펼친 섬(app.css .in-app .nav 940px)이 가운데 놓이는 창 폭 — Windows · Mac은 이보다 좁히지 않는다(lib.js islandWidth)
// Mac 노치(다이내믹 아일랜드) — 이재엽 결정 2026-10-19 "Mac에서는 노치 자리에 붙인다 · 노치 크기는 Swift 도우미로 정확히".
// Electron은 노치 크기를 안 알려 줘 작은 Swift 도우미(notch/notch-probe.swift → prebuild.js가 build/notch-probe로 묶음, 묶은 앱은 Resources/notch-probe)를
// 앱이 켜질 때 한 번 돌려 JSON 한 줄을 읽는다(lib.js parseNotchProbe). 도우미가 없거나 · 실패하거나 · 노치가 없으면 null — 전처럼 위쪽 가운데(floating).
let PROBE = null;   // 도우미가 읽은 것 { notch: {x, width, height} | null, screen, menuBar }
let NOTCH = null;   // 창 자리 { x, y, width, height, level, cx } — 노치가 있을 때만. cx = 노치 가운데(화면 좌표), 크기가 바뀌어도 여기에 맞춘다
function probeNotch() {
  if (process.platform !== "darwin") return null;
  const bin = app.isPackaged ? path.join(process.resourcesPath, "notch-probe") : path.join(__dirname, "build/notch-probe");
  try {
    const r = spawnSync(bin, [], { encoding: "utf8", timeout: 2000 });
    return r.status === 0 ? L.parseNotchProbe(r.stdout) : null;
  } catch { return null; }
}
function createWindow() {
  const disp = screen.getPrimaryDisplay(), { width } = disp.workAreaSize, W = 952, H = 140;
  PROBE = probeNotch();
  NOTCH = L.notchLayout(PROBE, disp.bounds, W, H);
  win = new BrowserWindow({ ...ICON_OPT, width: W, height: H, x: NOTCH ? NOTCH.x : Math.max(0, Math.round((width - W) / 2)), y: NOTCH ? NOTCH.y : 0, frame: false, transparent: true, hasShadow: false,
    alwaysOnTop: true, resizable: false, minimizable: true, title: "Floe", useContentSize: true,
    // backgroundThrottling 끔(F-27): 사용자는 거의 늘 다른 창(코딩 도구)을 쓰고 있어 이 창은 포커스가 없다 — 그때 화면의 requestAnimationFrame이 느려지면 눈이 미끄러져 가는 것이 끊긴다
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  // 노치가 있으면 메뉴 줄보다 위 레벨(screen-saver)로 올린 뒤 자리를 다시 둔다 — floating 레벨의 창은 메뉴 줄 아래로 밀린다. 레벨을 먼저 올리고 자리를 놓는다
  if (NOTCH) { win.setAlwaysOnTop(true, NOTCH.level); win.setContentBounds({ x: NOTCH.x, y: NOTCH.y, width: W, height: H }, false); }
  else win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);   // visibleOnFullScreen 옵션은 뺐다(3.0.2) — 전체 화면 보조 창으로 만들면 입력이 이상해질 수 있어서. 노치 모양에서도 켜지 않는다(사람이 켜 본 뒤 정한다)
  // 노치 크기를 화면에 — 띠를 노치와 같은 검정 · 노치 폭으로(app.css .notch). 서고에 갔다 돌아와도(다시 load) 매번 보낸다
  // 페이지가 바뀌면(서고 · 다시 읽기) 클릭 통과를 끈다 — 새 페이지는 통과를 켠 줄 모른다(floe:thru)
  win.webContents.on("did-start-navigation", (_e, _url, inPlace, isMain) => { if (isMain && !inPlace && win) win.setIgnoreMouseEvents(false); });
  win.webContents.on("did-finish-load", () => { if (NOTCH && win) win.webContents.send("floe:notch", { width: PROBE.notch.width, height: PROBE.notch.height }); });
  // 창 밖 커서를 화면에 알린다 — 플로로의 눈이 바탕 화면 어디든 따라오게(2026-10-19). 1초에 30번까지(F-22는 20번 — F-27에서 올림, 화면은 받은 점 사이를 미끄러져 간다),
  // 창 안이거나 그대로면 보내지 않는다
  let lastCursor = null;
  const cursorTick = setInterval(() => {
    if (!win || win.isDestroyed() || !win.isVisible() || win.isMinimized()) return;
    const m = L.cursorMsg(screen.getCursorScreenPoint(), win.getContentBounds(), lastCursor);
    if (m) { lastCursor = m; win.webContents.send("floe:cursor", m); }
  }, 33);
  win.on("closed", () => { clearInterval(cursorTick); win = null; closeSideWins(); });   // 섬 창이 닫히면 옆 창 둘도(C-22)
  // 화면의 바깥 링크(처음 설정의 'Claude Code 설치 안내' 등)는 앱 창이 아니라 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  // Windows · Linux: 창 우클릭 → 같은 메뉴(메뉴 줄이 없으니). Mac은 위 메뉴 줄 그대로
  if (process.platform !== "darwin") win.webContents.on("context-menu", () => Menu.buildFromTemplate(floeItems()).popup({ window: win }));
  // 서고 주소로 넘어가기 시작하면 창을 먼저 넓힌다(내비게이터의 '내 서고 들어가기' · '내 배움'은 화면이 floeApp.expand로도 부른다 — 둘 중 먼저 온 것이 넓힌다)
  win.webContents.on("did-start-navigation", (ev, legacyUrl, _inPlace, legacyMain) => {
    const url = typeof ev.url === "string" ? ev.url : legacyUrl, main = typeof ev.isMainFrame === "boolean" ? ev.isMainFrame : legacyMain;
    const same = typeof ev.isSameDocument === "boolean" ? ev.isSameDocument : false;
    if (main && !same && /\/library\//.test(String(url || ""))) { closeSideWins(); expandWindow(); }   // 서고로 가면 옆 창 둘은 닫는다(C-22)
    else if (main && !same && expanded) restoreWindow();   // 서고에서 작업 화면으로 — 섬 자리로 되돌린다(2026-10-20)
  });
  // 서버가 아직이면 '켜지는 중'(물결 선) — 서버가 켜지면 whenReady가 loadURL(URL_)로 바꾼다(C-10)
  win.loadURL(URL_ || L.bootUrl(PROBE && PROBE.notch));
}
// 화면이 알려 준 섬 크기로 창을 맞춘다 — 가로가 바뀌면 가운데를 유지하고(사용자가 옮긴 자리 기준), 세로는 위를 고정.
// anchor="left"면 왼쪽 가장자리를 고정한다(설정 창이 섬 오른쪽에 열릴 때 — 섬은 그 자리에 있고 창만 오른쪽으로 넓어진다, 6.2.0).
// 크기와 자리를 한 번에(setBounds) 바꾼다 — 따로 두 번 바꾸면 그 사이 한 프레임이 어긋나 보여 "따라오는 게 버벅"였다(이재엽 2026-10-19). 화면 밖으로 나가면 안쪽으로 당긴다
ipcMain.on("floe:resize", (e, w, h, anchor) => {
  if (!win || e.sender !== win.webContents) return;
  // 서고에 있는 동안(넓힌 창)은 섬 크기를 따르지 않는다. 서고가 아닌데 넓혀져 있으면(처음 설정이 떠 있는 동안 넓혔다가 닫힘 — KAN-57 F-39-1, 병합 2026-10-20)
  // 조절 · 서고 크기 기억 없이 섬 창으로 돌아와 아래에서 섬 크기를 맞춘다
  if (expanded) { if (/\/library\//.test(win.webContents.getURL())) return; expanded = null; win.setResizable(false); win.setMinimumSize(MIN_W, MIN_H); }
  const W = L.islandWidth(Math.max(MIN_W, Math.ceil(Number(w) || 0) + PAD), process.platform, ISLAND_W), H = Math.max(MIN_H, Math.ceil(Number(h) || 0) + PAD);
  const b = win.getContentBounds();
  if (Math.abs(b.width - W) < 2 && Math.abs(b.height - H) < 2) return;
  const wa = screen.getDisplayMatching(b).workArea;
  // 노치가 있으면 가로는 늘 노치 가운데, 세로는 화면 맨 위(서고에서 돌아와도 노치로) — 없으면 지금 창의 가운데 · 지금 y
  const x = L.islandX(anchor, b, W, NOTCH ? NOTCH.cx : null, wa);
  win.setContentBounds({ x, y: NOTCH ? NOTCH.y : b.y, width: W, height: H }, false);
  placeSideWins();
});
// 서고로 들어갈 때(…/library/) 창을 화면만큼 넓힌다 — 섬 크기에 묶인 창에서는 서고가 커질 수 없었다(이재엽 2026-10-19 "서재도 오버레이가 커져야 하는데 커지지 못하는 상태").
// 내비게이터로 돌아오면 화면이 다시 섬 크기를 보내 창이 줄어든다(floe:resize)
// 2026-10-20(이재엽 "서재에서 들어갈 때 오버레이 크기를 조정할 수 있도록"): 서고에 있는 동안은 창을 사람이 조절할 수 있다(resizable, 최소 640×480). 조절한 크기는 다음에 들어갈 때 그대로(이 켜짐 동안, libSize).
// 넓힌 창은 작업 영역 위쪽 가운데(lib.js libraryBounds) — 세로 가운데에 두면 맨 위에 있던 섬이 창 밖으로 나가 잠수를 제자리에서 이어 갈 수 없다.
// 화면에는 floe:expanded로 {dx, dy}(섬 창 → 넓힌 창의 옮긴 거리)를 알려 섬을 제자리에 붙든 채 잠수하게 한다(app.js enterLibrary)
let expanded = null;   // 서고에 있는 동안 { from: 섬 창의 자리 } — 돌아오면 그 자리로
let libSize = null;    // 사람이 조절한 서고 창 크기
function expandWindow() {
  if (!win || expanded) return;
  const b = win.getContentBounds(), wa = screen.getDisplayMatching(b).workArea;
  const r = L.libraryBounds(wa, libSize);
  expanded = { from: b };
  win.setResizable(true);
  win.setMinimumSize(L.LIB_MIN.width, L.LIB_MIN.height);
  win.setContentBounds(r, false);
  win.webContents.send("floe:expanded", { dx: b.x - r.x, dy: b.y - r.y });
}
// 작업 화면으로 돌아올 때(2026-10-20 "오버레이가 작아졌다가 다시 켜지는 애니메이션") — 섬이 있던 자리 · 크기로. Mac은 창이 줄어드는 것을 보여 준다(setContentBounds의 animate).
// 그다음 화면이 물속에서 떠오른다(dive.js surface — 주소 끝 &back). 조절한 서고 창 크기는 기억해 둔다
function restoreWindow() {
  if (!win || !expanded) return;
  const now = win.getContentBounds();
  libSize = { width: now.width, height: now.height };
  const { from } = expanded; expanded = null;
  win.setResizable(false);
  win.setMinimumSize(MIN_W, MIN_H);
  win.setContentBounds(from, process.platform === "darwin");
}
// 창의 투명한 자리는 클릭을 뒤 창으로(Windows · Mac — 창 폭을 줄이지 않아 접힌 한 줄 양옆이 비어 있다). forward: 통과시키는 동안에도 마우스 움직임은 화면에 와서
// 섬 위로 오면 화면이 다시 끈다(app.js). Linux는 창이 섬 크기라 통과시킬 자리가 없다
ipcMain.on("floe:thru", (e, on) => {
  if (!L.keepsWidth(process.platform) || !win || e.sender !== win.webContents) return;
  win.setIgnoreMouseEvents(!!on, { forward: true });
});
ipcMain.on("floe:expand", (e) => { if (win && e.sender === win.webContents) expandWindow(); });
async function pickAndConnect(add) {
  const r = await dialog.showOpenDialog(win, { title: add ? "Claude Code로 작업하는 프로젝트 폴더" : "연결을 뺄 프로젝트 폴더", properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return { ok: false, message: "" };
  try { return add ? useFolder(r.filePaths[0]) : dropFolder(r.filePaths[0]); }
  catch (e) { return { ok: false, message: `바꾸지 못했어요: ${e.message}` }; }
}
// ── C-31 시작하는 자리(2026-10-24, 이재엽 "C-31부터 만들어줘") — 처음 설정의 '프로젝트' 칸: 새로 만들기 · 내 GitHub 저장소 가져오기 · 이 컴퓨터에 있는 폴더 ──
// 자리는 홈/Floe/이름(버튼 "홈/Floe/이름"), 가져오기는 앱이 바로(버튼 "Floe 앱이 바로" — gh · git, 토큰 0). 저장소 만들기 · 커밋은 여전히 사용자의 Claude Code(C-25).
// 화면은 이름 · 주소 글만 보낸다 — 경로는 project.js가 만든다. 고른 폴더는 한 길(useFolder)로: 훅을 더하고(connectDir) · 훅 경로가 든 설정 파일을 올리지 않게(.git/info/exclude)
// · 서버에 같은 프로세스로 알리고(server.js useProject — HTTP 주소는 없다) · 다음 켤 때도(설정 폴더의 project.json, 나만 읽기)
const Project = require(path.join(P.backend, "project.js"));
const projectFile = () => path.join(app.getPath("userData"), "project.json");
const tilde = (dir) => { const h = os.homedir(); return dir === h || dir.startsWith(h + path.sep) ? `~${dir.slice(h.length)}` : dir; };
const savedProject = () => { try { return JSON.parse(fs.readFileSync(projectFile(), "utf8")).dir || ""; } catch { return ""; } };
function useFolder(dir) {
  const c = L.connectDir(dir, P.backend, true);
  if (!c.ok) return c;
  Project.excludeLocal(dir);
  if (Server) Server.useProject(dir);   // 서버를 켜기 전(켜지는 몇 초)이면 아래 파일에만 — 켠 뒤 restoreProject가 알린다
  try { fs.writeFileSync(projectFile(), JSON.stringify({ dir }), { mode: 0o600 }); } catch {}
  // config — 그 폴더에 Claude Code 설정(.claude/settings.json · .mcp.json)이 있나. 맡긴 일(Claude Code의 비대화 실행)은 폴더를 믿는지 묻지 않으므로 화면이 알린다(2차 리뷰 — 있는 폴더를 골라도)
  return { ...c, name: path.basename(dir), where: tilde(dir), config: Project.hasClaudeConfig(dir) };
}
// '연결 빼기' — 훅을 빼고, 그 폴더가 앱이 고른 작업 폴더면 서버와 project.json에서도 잊는다(훅 없는 폴더에서 맡긴 일이 허락 카드 없이 멈추지 않게)
function dropFolder(dir) {
  const c = L.connectDir(dir, P.backend, false);
  if (c.ok && Server) Server.dropProject(dir);
  if (c.ok && savedProject() && path.resolve(savedProject()) === path.resolve(dir)) { try { fs.rmSync(projectFile(), { force: true }); } catch {} }
  return c;
}
// 다시 켜면(서버를 켠 뒤) 지난번 폴더를 서버에 다시 알린다 — 폴더가 없어졌으면 조용히 넘어간다(useProject가 false)
function restoreProject() { const dir = savedProject(); if (dir && Server) Server.useProject(dir); }
const afterPick = (r) => (r.ok ? { ...useFolder(r.dir), made: r.made, repo: r.repo || "", config: !!r.config || Project.hasClaudeConfig(r.dir) } : r);   // 가져온 직후에 본 config(커밋돼 온 settings.local.json 포함)를 버리지 않는다   // 만들거나 가져왔으면 같은 길로
// 섬 창을 앞으로(없으면 만든다) — 메뉴 '창 다시 열기' · 트레이 클릭 · Mac Dock 클릭이 같이 쓴다. 따로 뜨던 모아 보기 창은 2026-10-23에 뺐다
function showIsland() { if (!win) createWindow(); else win.show(); }
// 메뉴 항목 하나 — Mac은 위 메뉴 줄, Windows · Linux는 창 우클릭 · 트레이에서 같은 것을 본다
function floeItems() {
  const say = async (add) => { const r = await pickAndConnect(add); if (r.message) dialog.showMessageBox(win, { message: r.message }); };
  return [
    { label: `Floe ${app.getVersion()} · 새 버전 확인 (Releases)`, click: () => shell.openExternal(RELEASES) },
    { type: "separator" },
    { label: "프로젝트 폴더 연결…", click: () => say(true) },
    { label: "연결 빼기…", click: () => say(false) },
    { type: "separator" },
    { label: "설정 폴더 열기 (.env를 두는 곳)", click: () => shell.openPath(app.getPath("userData")) },
    { label: "브라우저로 열기", click: () => shell.openExternal(`http://127.0.0.1:${PORT}/`) },
    { type: "separator" },
    { label: "창 다시 열기", click: showIsland },
    { role: "reload", label: "새로 고침" }, { role: "toggleDevTools", label: "개발자 도구" },
    { type: "separator" }, { role: "quit", label: "Floe 끄기" },
  ];
}
function menu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: "Floe", submenu: floeItems() }, { role: "editMenu", label: "편집" }]));
  if (process.platform === "darwin") return;
  // Windows · Linux: 테두리 없는 창에는 메뉴 줄이 안 보인다 → 알림 영역(트레이) 아이콘. 아이콘은 묶음 안의 build/icon.ico · icon.png(package.json files)
  //   Windows는 여러 크기가 든 .ico를 그대로(화면 배율에 맞는 크기를 고른다 — 1024px 그림을 22px로 줄이면 흐려 플로로로 안 보였다, F-59), Linux는 22px로 줄인다
  try {
    const img = nativeImage.createFromPath(ICON), icon = process.platform === "win32" ? img : img.resize({ width: 22, height: 22 });
    tray = new Tray(icon);
    tray.setToolTip(`Floe ${app.getVersion()}`);
    tray.setContextMenu(Menu.buildFromTemplate(floeItems()));
    tray.on("click", showIsland);   // 트레이 클릭 → 섬 창
  } catch (e) { console.log(`트레이 아이콘을 못 만들었어요(${e.message}) — 창 우클릭 메뉴로`); }
}

ipcMain.handle("floe:connect", () => pickAndConnect(true));
ipcMain.handle("floe:project-new", async (e, name) => { if (!fromIsland(e)) return { ok: false, message: "" }; return afterPick(await Project.newFolder(os.homedir(), name)); });
ipcMain.handle("floe:project-clone", async (e, text) => { if (!fromIsland(e)) return { ok: false, message: "" }; return afterPick(await Project.cloneRepo(os.homedir(), text, { ghReady: await Project.ghReady() })); });
ipcMain.handle("floe:project-repos", async (e) => (fromIsland(e) ? Project.myRepos({ ghReady: await Project.ghReady() }) : []));
ipcMain.handle("floe:disconnect", () => pickAndConnect(false));
ipcMain.handle("floe:open-settings", () => shell.openPath(app.getPath("userData")));
// ── 설정 창 · 퀘스트 창(C-22, 2026-10-21 이재엽 "설정 창과 퀘스트 창 그리고 채팅을 입력하는 창 이렇게 3개") — 섬 창 옆에 뜨는 창 둘 ──
// 상태는 섬(app.js) 하나가 갖는다: 섬이 창의 내용(HTML)을 그려 보내고(floe:win-html), 창의 누름 · 바뀜 · 입력은 섬으로 돌아가(floe:win-event) 섬이 처리하고 다시 그려 보낸다.
// 창은 테두리 없음 · 항상 위(섬처럼) · 불투명 네이비, 머리띠를 잡고 끌고(win.html의 app-region), 퀘스트 창은 모서리로 크기를 바꾼다. 자리는 섬 창 옆(lib.js sideWinBounds — 설정 창은 고른 쪽, 퀘스트 창은 반대쪽).
// 2026-10-26 C-41(두승현 — 스토리보드 stage-storyboard, 이재엽 · 두승현 결정): 퀘스트 창은 **작업실**이 됐다 — 테두리 있는 보통 창(늘 위 아님 · 작업 표시줄에 뜸 · 파스텔), 사람이 편집기 옆에 둔다. 섬이 그 가장자리에 붙는 것은 다음 PR. kind 이름은 "quest" 그대로(IPC · 상태 st.qwin)
// 사람이 창을 닫으면 섬에 알린다(floe:win-closed). 섬 창이 닫히거나 서고로 가면 같이 닫는다. 화면 파일은 서버 주소로(navigator/win.html — STATIC에 있어야 한다)
const wins = { settings: null, quest: null };
const sideKind = (k) => (k === "settings" || k === "quest" ? k : null);
const boundsFor = (kind, side, isl, wa, size) => (kind === "quest" ? L.workBounds(isl, wa, size) : L.sideWinBounds(kind, side, isl, wa, size));   // 작업실은 섬 아래에 달라는 크기 그대로(C-41), 설정 창은 옆자리
function openSideWin(kind, opt = {}) {
  if (!win || win.isDestroyed()) return;
  const isl = win.getContentBounds(), wa = screen.getDisplayMatching(isl).workArea;
  const b = boundsFor(kind, opt.side, isl, wa, opt.size);
  let w = wins[kind];
  if (w && !w.isDestroyed()) { if (opt.place) { w.setBounds(b); Object.assign(w, { floeSide: opt.side, floeSize: opt.size, floeMoved: false }); } w.show(); if (typeof opt.html === "string") w.webContents.send("floe:win-html", opt.html); return; }
  const ws = kind === "quest";   // 작업실(C-41) — 보통 창. 바탕색은 win.html · app.css(html.win-quest)와 같은 값
  w = wins[kind] = new BrowserWindow({ ...ICON_OPT, ...b, frame: ws, transparent: false, backgroundColor: ws ? "#E9EEF6" : "#16225E", alwaysOnTop: !ws, resizable: ws, minimizable: ws, hasShadow: true, show: false,
    minWidth: ws ? 640 : 260, minHeight: ws ? 480 : 200, title: ws ? "Floe — 작업실" : "Floe — 설정",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  if (!ws) w.setAlwaysOnTop(true, "floating");
  Object.assign(w, { floeSide: opt.side, floeSize: opt.size, floeMoved: false });   // 다시 둘 때(placeSideWins · floe:win-size) 같은 규칙으로
  w.on("will-move", () => { w.floeMoved = true; });   // 사람이 머리띠를 잡고 옮겼다(앱이 옮길 때는 오지 않는다) — 그 뒤로는 앱이 자리를 바꾸지 않는다. Electron은 Windows · Mac에서만 이 알림을 준다 — Linux는 옮긴 창도 다시 둘 수 있다
  w.once("ready-to-show", () => { if (wins[kind] === w) w.show(); });
  w.webContents.on("did-finish-load", () => { if (wins[kind] === w && typeof opt.html === "string") w.webContents.send("floe:win-html", opt.html); });
  w.on("closed", () => { if (wins[kind] === w) wins[kind] = null; if (win && !win.isDestroyed()) win.webContents.send("floe:win-closed", kind); });
  w.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  w.loadURL(`${URL_}navigator/win.html#${kind}`);
}
// 2026-10-24(이재엽 "지금 오버레이가 겹치지 않도록") — 섬 창의 크기가 바뀌어 옆 창과 겹치면 같은 규칙(lib.js sideWinBounds — 옆자리가 좁으면 줄이고, 없으면 섬 아래)으로 다시 둔다.
// 겹치지 않으면 그대로 둔다(섬이 펼쳐지고 접힐 때마다 옆 창이 흔들리지 않게). 사람이 끌어 옮긴 창도 그대로
function placeSideWins() {
  if (!win || win.isDestroyed()) return;
  const isl = win.getContentBounds(), wa = screen.getDisplayMatching(isl).workArea;
  for (const kind of Object.keys(wins)) {
    const w = wins[kind];
    if (!w || w.isDestroyed() || w.floeMoved || !L.overlaps(w.getBounds(), isl)) continue;
    w.setBounds(boundsFor(kind, w.floeSide, isl, wa, w.floeSize));
  }
}
const closeSideWins = () => { for (const k of Object.keys(wins)) { const w = wins[k]; if (w && !w.isDestroyed()) w.close(); } };
const fromIsland = (e) => !!win && !win.isDestroyed() && e.sender === win.webContents;
const fromSide = (e) => Object.values(wins).some((w) => w && !w.isDestroyed() && e.sender === w.webContents);
ipcMain.on("floe:win-open", (e, kind, opt) => { if (fromIsland(e) && sideKind(kind)) openSideWin(kind, opt || {}); });
ipcMain.on("floe:win-html", (e, kind, html) => { const w = sideKind(kind) && wins[kind]; if (fromIsland(e) && w && !w.isDestroyed()) w.webContents.send("floe:win-html", String(html || "")); });
ipcMain.on("floe:win-close", (e, kind) => { const w = sideKind(kind) && wins[kind]; if (fromIsland(e) && w && !w.isDestroyed()) w.close(); });
ipcMain.on("floe:win-size", (e, kind, size) => {
  const w = sideKind(kind) && wins[kind];
  if (!fromIsland(e) || !w || w.isDestroyed() || !Array.isArray(size)) return;
  // 사람이 옮기지 않았으면 같은 자리 규칙으로(커진 창이 섬을 덮지 않게, 2026-10-24) — 옮겼으면 그 자리에서 크기만
  if (!w.floeMoved) { const isl = win.getContentBounds(); w.floeSize = size; return w.setBounds(boundsFor(kind, w.floeSide, isl, screen.getDisplayMatching(isl).workArea, size)); }
  const b = w.getBounds(); w.setBounds({ ...b, width: Math.max(260, Math.round(size[0]) || b.width), height: Math.max(200, Math.round(size[1]) || b.height) });
});
ipcMain.on("floe:win-event", (e, payload) => { if (fromSide(e) && win && !win.isDestroyed()) win.webContents.send("floe:win-event", payload); });   // 창의 누름은 섬으로
// 처음 설정(setup.js) — 키를 설정 폴더의 .env(나만 읽기 600)에 쓰고 이 프로세스의 환경에도 넣는다. 서버가 이 앱 안에 있으니 다시 켜지 않아도
// 다음 AI 호출부터 그 키로 부른다(provider.js는 부를 때마다 환경을 본다). 값은 어디에도 출력하지 않는다
function writeEnv(updates) {
  let text = "";
  try { text = fs.readFileSync(envFile(), "utf8"); } catch {}
  fs.mkdirSync(path.dirname(envFile()), { recursive: true });
  fs.writeFileSync(envFile(), L.setEnvLines(text, updates), { mode: 0o600 });
  try { fs.chmodSync(envFile(), 0o600); } catch {}
  for (const [k, v] of Object.entries(updates)) { if (v == null) delete process.env[k]; else process.env[k] = v; }
}
// 앱은 늘 자기 서버를 켜므로(빈 포트, #115) 보통 "ok"다 — 서버를 못 켰을 때만 막는다
const OTHER_SERVER = "앱의 서버가 켜지지 않아 키를 바꿀 수 없어요. 앱을 다시 켜 주세요.";
ipcMain.handle("floe:save-key", (_e, p) => {
  if (serverState !== "ok") return { ok: false, message: OTHER_SERVER };
  const key = String((p && p.key) || "").trim(), base = L.relayUrl(p && p.baseUrl);
  if (!L.looksLikeKey(key)) return { ok: false, message: "키 모양이 아니에요. 띄어쓰기 없이 통째로 붙여 넣어 주세요." };
  if (base === null) return { ok: false, message: "중계 서버 주소는 https://로 시작해야 해요." };
  try { writeEnv({ ANTHROPIC_API_KEY: key, ANTHROPIC_BASE_URL: base || null }); } catch (e) { return { ok: false, message: `저장하지 못했어요: ${e.code || "알 수 없는 까닭"}` }; }
  return { ok: true };
});
ipcMain.handle("floe:clear-key", () => {
  if (serverState !== "ok") return { ok: false, message: OTHER_SERVER };
  try { writeEnv({ ANTHROPIC_API_KEY: null, ANTHROPIC_BASE_URL: null }); } catch (e) { return { ok: false, message: `키를 빼지 못했어요: ${e.code || "알 수 없는 까닭"}` }; }
  return { ok: true };
});

app.whenReady().then(async () => {
  menu();
  const icon = L.devIcon(app.isPackaged, __dirname);   // 개발 실행도 Dock에 플로로(묶은 앱과 같은 그림)
  if (icon && process.platform === "darwin" && app.dock) app.dock.setIcon(icon);
  // Linux: ready 직후 바로 만들면 투명 창이 검게 나오는 일이 있어(Electron 안내) 잠깐 기다린다
  if (LINUX) await new Promise((r) => setTimeout(r, 300));
  createWindow();   // 먼저 — '켜지는 중'(물결 선)을 보이는 동안 아래에서 PATH · 서버를 준비한다(C-10, 2026-10-20)
  const loaded = loadEnv();
  await fixPath();
  serverState = await startServer();
  if (serverState.startsWith("error:")) { dialog.showErrorBox("Floe", `서버를 켜지 못했어요 (${serverState.slice(6)}).`); return app.quit(); }
  restoreProject();   // C-31 — 지난번에 고른 작업 폴더를 서버에 다시(2026-10-24)
  if (win && !win.isDestroyed()) win.loadURL(URL_);
  console.log(`Floe ${app.getVersion()}: ${URL_}${PORT !== WANT ? ` (${WANT}은 다른 서버가 써서 ${PORT}로)` : ""} · .env ${loaded ? "읽음" : "없음(이 컴퓨터의 Claude Code 구독)"}`);
  app.on("activate", showIsland);   // Mac Dock 클릭 → 섬 창
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
