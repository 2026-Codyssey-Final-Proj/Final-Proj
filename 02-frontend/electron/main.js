// claude-drafted: 2026-10-19 — Floe 오버레이 앱의 껍데기(Electron). 이재엽 요청("dmg로 하나 만들어서 여기서라도 한번 테스트").
// 하는 일: ① 앱 설정 폴더의 .env(내 키, 있으면) → ② Mac에서 로그인 셸의 PATH(claude 명령) → ③ 같은 프로세스에서 Floe 서버(server.js handle)를
// 127.0.0.1에 띄우고 → ④ 항상 위에 뜨는 투명 창으로 그 주소를 연다. 메뉴에서 프로젝트 폴더에 훅을 더하거나 뺀다(lib.js connectDir).
// 화면 · 서버 코드는 손대지 않고 그대로 감쌌다(02-frontend/README.md 2절의 Electron 오버레이 계획). AI를 부르는 곳은 여전히 provider.js 하나.
// 개발 중: `npm start`(저장소 코드를 바로 읽음) · 묶기: `npm run dist`(prebuild.js가 payload/로 복사 → dmg)
const { app, BrowserWindow, Menu, dialog, ipcMain, shell, screen } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const L = require("./lib.js");

const P = L.paths(app.isPackaged, __dirname);
const WANT = Number(process.env.NAV_PORT) || 4317;
const RELEASES = "https://github.com/2026-Codyssey-Final-Proj/Final-Proj/releases";
let PORT = WANT, URL_ = "", win = null, serverState = "";
// 앱은 늘 자기 서버를 켠다 — 같은 포트에 다른 서버(터미널의 옛 server.js 등)가 있으면 그쪽에 붙지 않고 옆 빈 포트를 쓴다.
// (2026-10-19 첫 알파에서 옛 서버에 붙어 옛 화면 · 배경이 보였다 — 이재엽 보고)
const freePort = (from) => new Promise((resolve) => {
  const s = net.createServer(); s.unref();
  s.on("error", () => resolve(freePort(from + 1)));
  s.listen(from, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
});

// ① .env — 앱 설정 폴더(이 사용자만)에 둔다. 저장소 · 앱 묶음 안에는 없다
function loadEnv() {
  const file = path.join(app.getPath("userData"), ".env");
  try { L.applyEnv(process.env, L.parseEnv(fs.readFileSync(file, "utf8"))); return file; } catch { return ""; }
}
// ② Mac 더블클릭 앱의 PATH는 짧다 — 로그인 셸의 PATH를 합쳐 `claude`(~/.local/bin 등)를 찾게
function fixPath() {
  if (process.platform !== "darwin") return;
  const r = spawnSync(process.env.SHELL || "/bin/zsh", ["-ilc", "echo $PATH"], { encoding: "utf8", timeout: 4000 });
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
// ④ 창 — 테두리 없음 · 투명 · 항상 위 · 모든 작업 공간. 위쪽 가운데에서 시작한다
function createWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize, W = 1040, H = 760;
  win = new BrowserWindow({ width: W, height: H, x: Math.max(0, Math.round((width - W) / 2)), y: 0, frame: false, transparent: true, hasShadow: false,
    alwaysOnTop: true, resizable: true, minimizable: true, title: "Floe",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.on("closed", () => { win = null; });
  win.loadURL(URL_);
}
async function pickAndConnect(add) {
  const r = await dialog.showOpenDialog(win, { title: add ? "Claude Code로 작업하는 프로젝트 폴더" : "연결을 뺄 프로젝트 폴더", properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return { ok: false, message: "" };
  try { return L.connectDir(r.filePaths[0], P.backend, add); }
  catch (e) { return { ok: false, message: `바꾸지 못했어요: ${e.message}` }; }
}
function menu() {
  const say = async (add) => { const r = await pickAndConnect(add); if (r.message) dialog.showMessageBox(win, { message: r.message }); };
  const tpl = [
    { label: "Floe", submenu: [
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
    ] },
    { role: "editMenu", label: "편집" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

ipcMain.handle("floe:connect", () => pickAndConnect(true));
ipcMain.handle("floe:disconnect", () => pickAndConnect(false));
ipcMain.handle("floe:open-settings", () => shell.openPath(app.getPath("userData")));

app.whenReady().then(async () => {
  const envFile = loadEnv();
  fixPath();
  serverState = await startServer();
  if (serverState.startsWith("error:")) { dialog.showErrorBox("Floe", `서버를 켜지 못했어요 (${serverState.slice(6)}).`); return app.quit(); }
  menu();
  createWindow();
  console.log(`Floe ${app.getVersion()}: ${URL_}${PORT !== WANT ? ` (${WANT}은 다른 서버가 써서 ${PORT}로)` : ""} · .env ${envFile ? "읽음" : "없음(이 컴퓨터의 Claude Code 구독)"}`);
  app.on("activate", () => { if (!win) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
