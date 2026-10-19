// claude-drafted: 2026-10-19 — Floe 오버레이 앱의 껍데기(Electron). 이재엽 요청("dmg로 하나 만들어서 여기서라도 한번 테스트").
// 하는 일: ① 앱 설정 폴더의 .env(내 키, 있으면) → ② Mac에서 로그인 셸의 PATH(claude 명령) → ③ 같은 프로세스에서 Floe 서버(server.js handle)를
// 127.0.0.1에 띄우고 → ④ 항상 위에 뜨는 투명 창으로 그 주소를 연다. 메뉴에서 프로젝트 폴더에 훅을 더하거나 뺀다(lib.js connectDir).
// 화면 · 서버 코드는 손대지 않고 그대로 감쌌다(02-frontend/README.md 2절의 Electron 오버레이 계획). AI를 부르는 곳은 여전히 provider.js 하나.
// 개발 중: `npm start`(저장소 코드를 바로 읽음) · 묶기: `npm run dist`(prebuild.js가 payload/로 복사 → dmg) · `dist:win`(exe) · `dist:linux`(AppImage · deb, 6.0.0 — 이재엽 "우분투에서도 돌아가는 버전")
// Mac이 아니면(Windows · Linux) 테두리 없는 창에는 메뉴 줄이 없다 — 같은 메뉴를 **창 우클릭**과 **알림 영역(트레이) 아이콘**에 둔다.
const { app, BrowserWindow, Menu, Tray, nativeImage, dialog, ipcMain, shell, screen } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const L = require("./lib.js");

const P = L.paths(app.isPackaged, __dirname);
const WANT = Number(process.env.NAV_PORT) || 4317;
const RELEASES = "https://github.com/2026-Codyssey-Final-Proj/Final-Proj/releases";
let PORT = WANT, URL_ = "", win = null, tray = null, serverState = "";
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
function fixPath() {
  if (!L.wantsShellPath(process.platform)) return;
  const r = spawnSync(L.loginShell(process.platform, process.env), ["-ilc", "echo $PATH"], { encoding: "utf8", timeout: 4000 });
  if (r.status === 0 && r.stdout) process.env.PATH = L.mergePath(process.env.PATH, r.stdout.trim().split("\n").pop());
}
// ③ 서버 — 빈 포트를 찾아 같은 프로세스에서 켠다(server.js의 handle). 포트는 server.js가 읽기 전에 환경에 넣는다
async function startServer() {
  PORT = await freePort(WANT);
  URL_ = `http://127.0.0.1:${PORT}/`;   // 화면 파일은 정확한 경로만(API 약속) — 앱 안임은 preload.js가 둔 window.floeApp으로 안다
  process.env.NAV_PORT = String(PORT);
  const Server = require(path.join(P.backend, "server.js"));
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
function createWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize, W = 952, H = 140;
  win = new BrowserWindow({ width: W, height: H, x: Math.max(0, Math.round((width - W) / 2)), y: 0, frame: false, transparent: true, hasShadow: false,
    alwaysOnTop: true, resizable: false, minimizable: true, title: "Floe", useContentSize: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);   // visibleOnFullScreen 옵션은 뺐다(3.0.2) — 전체 화면 보조 창으로 만들면 입력이 이상해질 수 있어서
  // 창 밖 커서를 화면에 알린다 — 플로로의 눈이 바탕 화면 어디든 따라오게(2026-10-19). 1초에 20번까지, 창 안이거나 그대로면 보내지 않는다
  let lastCursor = null;
  const cursorTick = setInterval(() => {
    if (!win || win.isDestroyed() || !win.isVisible() || win.isMinimized()) return;
    const m = L.cursorMsg(screen.getCursorScreenPoint(), win.getContentBounds(), lastCursor);
    if (m) { lastCursor = m; win.webContents.send("floe:cursor", m); }
  }, 50);
  win.on("closed", () => { clearInterval(cursorTick); win = null; });
  // 화면의 바깥 링크(처음 설정의 'Claude Code 설치 안내' 등)는 앱 창이 아니라 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  // Windows · Linux: 창 우클릭 → 같은 메뉴(메뉴 줄이 없으니). Mac은 위 메뉴 줄 그대로
  if (process.platform !== "darwin") win.webContents.on("context-menu", () => Menu.buildFromTemplate(floeItems()).popup({ window: win }));
  win.loadURL(URL_);
}
// 화면이 알려 준 섬 크기로 창을 맞춘다 — 가로가 바뀌면 가운데를 유지하고(사용자가 옮긴 자리 기준), 세로는 위를 고정
ipcMain.on("floe:resize", (e, w, h) => {
  if (!win || e.sender !== win.webContents) return;
  const W = Math.max(MIN_W, Math.ceil(Number(w) || 0) + PAD), H = Math.max(MIN_H, Math.ceil(Number(h) || 0) + PAD);
  const [cw, ch] = win.getContentSize();
  if (Math.abs(cw - W) < 2 && Math.abs(ch - H) < 2) return;
  const [x, y] = win.getPosition();
  win.setContentSize(W, H, false);
  win.setPosition(Math.max(0, Math.round(x + (cw - W) / 2)), y, false);
});
async function pickAndConnect(add) {
  const r = await dialog.showOpenDialog(win, { title: add ? "Claude Code로 작업하는 프로젝트 폴더" : "연결을 뺄 프로젝트 폴더", properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return { ok: false, message: "" };
  try { return L.connectDir(r.filePaths[0], P.backend, add); }
  catch (e) { return { ok: false, message: `바꾸지 못했어요: ${e.message}` }; }
}
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
    { label: "창 다시 열기", click: () => { if (!win) createWindow(); else win.show(); } },
    { role: "reload", label: "새로 고침" }, { role: "toggleDevTools", label: "개발자 도구" },
    { type: "separator" }, { role: "quit", label: "Floe 끄기" },
  ];
}
function menu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: "Floe", submenu: floeItems() }, { role: "editMenu", label: "편집" }]));
  if (process.platform === "darwin") return;
  // Windows · Linux: 테두리 없는 창에는 메뉴 줄이 안 보인다 → 알림 영역(트레이) 아이콘. 아이콘은 묶음 안의 build/icon.png(package.json files)
  try {
    const icon = nativeImage.createFromPath(path.join(__dirname, "build/icon.png")).resize({ width: 22, height: 22 });
    tray = new Tray(icon);
    tray.setToolTip(`Floe ${app.getVersion()}`);
    tray.setContextMenu(Menu.buildFromTemplate(floeItems()));
    tray.on("click", () => { if (!win) createWindow(); else win.show(); });
  } catch (e) { console.log(`트레이 아이콘을 못 만들었어요(${e.message}) — 창 우클릭 메뉴로`); }
}

ipcMain.handle("floe:connect", () => pickAndConnect(true));
ipcMain.handle("floe:disconnect", () => pickAndConnect(false));
ipcMain.handle("floe:open-settings", () => shell.openPath(app.getPath("userData")));
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
  const loaded = loadEnv();
  fixPath();
  serverState = await startServer();
  if (serverState.startsWith("error:")) { dialog.showErrorBox("Floe", `서버를 켜지 못했어요 (${serverState.slice(6)}).`); return app.quit(); }
  menu();
  // Linux: ready 직후 바로 만들면 투명 창이 검게 나오는 일이 있어(Electron 안내) 잠깐 기다린다
  if (LINUX) await new Promise((r) => setTimeout(r, 300));
  createWindow();
  console.log(`Floe ${app.getVersion()}: ${URL_}${PORT !== WANT ? ` (${WANT}은 다른 서버가 써서 ${PORT}로)` : ""} · .env ${loaded ? "읽음" : "없음(이 컴퓨터의 Claude Code 구독)"}`);
  app.on("activate", () => { if (!win) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
