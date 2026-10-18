// claude-drafted: 2026-10-19 — Floe 오버레이 앱의 껍데기(Electron). 이재엽 요청("dmg로 하나 만들어서 여기서라도 한번 테스트").
// 하는 일: ① 앱 설정 폴더의 .env(내 키, 있으면) → ② Mac에서 로그인 셸의 PATH(claude 명령) → ③ 같은 프로세스에서 Floe 서버(server.js handle)를
// 127.0.0.1에 띄우고 → ④ 항상 위에 뜨는 투명 창으로 그 주소를 연다. 메뉴에서 프로젝트 폴더에 훅을 더하거나 뺀다(lib.js connectDir).
// 화면 · 서버 코드는 손대지 않고 그대로 감쌌다(02-frontend/README.md 2절의 Electron 오버레이 계획). AI를 부르는 곳은 여전히 provider.js 하나.
// 개발 중: `npm start`(저장소 코드를 바로 읽음) · 묶기: `npm run dist`(prebuild.js가 payload/로 복사 → dmg)
const { app, BrowserWindow, Menu, dialog, ipcMain, shell, screen } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const L = require("./lib.js");

const P = L.paths(app.isPackaged, __dirname);
const PORT = Number(process.env.NAV_PORT) || 4317;
const URL_ = `http://127.0.0.1:${PORT}/`;   // 화면 파일은 정확한 경로만(API 약속) — 앱 안임은 preload.js가 둔 window.floeApp으로 안다
let win = null, serverState = "";

// ① .env — 앱 설정 폴더(이 사용자만)에 둔다. 저장소 · 앱 묶음 안에는 없다
const envFile = () => path.join(app.getPath("userData"), ".env");
function loadEnv() {
  const file = envFile();
  try { L.applyEnv(process.env, L.parseEnv(fs.readFileSync(file, "utf8"))); return file; } catch { return ""; }
}
// ② Mac 더블클릭 앱의 PATH는 짧다 — 로그인 셸의 PATH를 합쳐 `claude`(~/.local/bin 등)를 찾게
function fixPath() {
  if (process.platform !== "darwin") return;
  const r = spawnSync(process.env.SHELL || "/bin/zsh", ["-ilc", "echo $PATH"], { encoding: "utf8", timeout: 4000 });
  if (r.status === 0 && r.stdout) process.env.PATH = L.mergePath(process.env.PATH, r.stdout.trim().split("\n").pop());
}
// ③ 서버 — 이미 같은 포트에 Floe가 켜져 있으면(터미널의 floe.js 등) 그쪽을 쓴다
function startServer() {
  process.env.NAV_PORT = String(PORT);
  const Server = require(path.join(P.backend, "server.js"));
  return new Promise((resolve) => {
    const s = http.createServer(Server.handle);
    s.on("error", (e) => resolve(e.code === "EADDRINUSE" ? "busy" : `error:${e.code || e.message}`));
    s.listen(PORT, "127.0.0.1", () => { try { Server.eventToken(); } catch {} resolve("ok"); });
  });
}
// ③-1 먼저 떠 있는 서버가 옛 코드면 알린다 — 2026-10-19 이재엽 "UI들이 dmg 파일에 업데이트가 안된 상태"의 원인:
// 전날 저녁 다른 폴더(옛 checkout)에서 켠 server.js가 4317을 잡고 있어서, 앱이 새로 켜지 않고 그 서버의 옛 화면을 열었다.
// 지문(/api/setup의 build)을 이 앱이 가진 코드와 맞대어 보고, 다르면 고르게 한다: 끄고 새로 켜기(node로 띄운 Floe 서버만) · 그대로 쓰기 · 끄기
const getJson = (url) => new Promise((resolve) => {
  const req = http.get(url, { timeout: 2000 }, (res) => { let t = ""; res.setEncoding("utf8"); res.on("data", (d) => (t += d)); res.on("end", () => { try { resolve(res.statusCode === 200 ? JSON.parse(t) : null); } catch { resolve(null); } }); });
  req.on("error", () => resolve(null)); req.on("timeout", () => { req.destroy(); resolve(null); });
});
// 그 포트를 잡은 프로세스 — Mac · Linux만(lsof). [{pid, cmd}]
function holders() {
  if (process.platform === "win32") return [];
  const r = spawnSync("lsof", ["-nP", `-tiTCP:${PORT}`, "-sTCP:LISTEN"], { encoding: "utf8", timeout: 3000 });
  return String(r.stdout || "").split(/\s+/).filter(Boolean).map((pid) => ({ pid: Number(pid),
    cmd: String(spawnSync("ps", ["-o", "command=", "-p", pid], { encoding: "utf8", timeout: 3000 }).stdout || "").trim() }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function resolveBusy() {
  const mine = require(path.join(P.backend, "server.js")).build();
  const info = await getJson(`${URL_}api/setup`);
  if (!L.staleServer(info, mine)) return "busy";   // 같은 코드 — 그대로 쓴다(터미널의 floe.js와 같이 써도 된다)
  const ours = holders().filter((h) => L.isFloeServer(h.cmd));
  const r = await dialog.showMessageBox({ type: "warning", title: "Floe", message: "이 컴퓨터에 옛 Floe 서버가 먼저 켜져 있어요",
    detail: `포트 ${PORT}을 다른 곳에서 켠 Floe 서버가 쓰고 있어요. 그대로 쓰면 이 앱이 아니라 그 서버의 옛 화면이 보여요.\n` +
      (ours.length ? `그 서버를 끄고 이 앱의 새 서버를 켤까요? (그 서버를 켠 터미널은 멈춰요)\n${ours.map((h) => `· ${h.cmd}`).join("\n")}`
        : "그 서버는 앱이 끌 수 없어요(node로 켠 Floe 서버가 아니에요). 켠 곳에서 끈 뒤 앱을 다시 켜 주세요."),
    buttons: ours.length ? ["옛 서버 끄고 새로 켜기", "그대로 쓰기", "Floe 끄기"] : ["그대로 쓰기", "Floe 끄기"], defaultId: 0, cancelId: ours.length ? 1 : 0 });
  const pick = ours.length ? ["kill", "keep", "quit"][r.response] : ["keep", "quit"][r.response];
  if (pick === "quit") return "quit";
  if (pick === "keep") return "busy";
  for (const h of ours) { try { process.kill(h.pid, "SIGTERM"); } catch {} }
  for (let i = 0; i < 15; i++) {   // 포트가 풀릴 때까지 4.5초까지 기다렸다 켠다
    await sleep(300);
    const st = await startServer();
    if (st !== "busy") return st;
  }
  return "busy";
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
  // 화면의 바깥 링크(처음 설정의 'Claude Code 설치 안내' 등)는 앱 창이 아니라 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
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
const OTHER_SERVER = "이 앱이 아니라 다른 곳에서 켠 Floe 서버를 쓰는 중이라 여기서 키를 바꿀 수 없어요. 그 서버의 .env에 넣거나, 그 서버를 끄고 앱을 다시 켜 주세요.";
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
  if (serverState === "busy") serverState = await resolveBusy();
  if (serverState === "quit") return app.quit();
  if (serverState.startsWith("error:")) { dialog.showErrorBox("Floe", `서버를 켜지 못했어요 (${serverState.slice(6)}).`); return app.quit(); }
  menu();
  createWindow();
  console.log(`Floe 앱: ${URL_} · 서버 ${serverState === "busy" ? "이미 켜진 것을 씀" : "켬"} · .env ${loaded ? "읽음" : "없음(이 컴퓨터의 Claude Code 구독)"}`);
  app.on("activate", () => { if (!win) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
