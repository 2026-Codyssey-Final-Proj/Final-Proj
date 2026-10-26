// claude-drafted: 2026-10-19 — 화면(app.js · setup.js)이 앱에게 부탁할 수 있는 것. 화면은 Node를 직접 쓰지 못한다(contextIsolation)
// saveKey · clearKey(처음 설정, 2026-10-19): 키는 앱이 설정 폴더의 .env(나만 읽기)에만 쓴다. 화면 · 브라우저 저장소 · 서버 주소에는 남지 않는다
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("floeApp", {
  platform: process.platform,                                 // "win32" · "darwin" · "linux" — 운영체제마다 다른 모양(app.css html.plat-win32, 2026-10-22)
  connect: () => ipcRenderer.invoke("floe:connect"),          // 프로젝트 폴더 고르기 → 훅 더하기
  disconnect: () => ipcRenderer.invoke("floe:disconnect"),    // 프로젝트 폴더 고르기 → 훅 빼기
  // C-31 시작하는 자리(2026-10-24) — 홈/Floe/이름에 새 폴더 · 내 GitHub 저장소를 가져오기(clone) · 내 저장소 목록. 화면은 이름 · 주소 글만 보내고 경로는 앱이 만든다
  newProject: (name) => ipcRenderer.invoke("floe:project-new", String(name || "")),
  cloneProject: (text) => ipcRenderer.invoke("floe:project-clone", String(text || "")),
  myRepos: () => ipcRenderer.invoke("floe:project-repos"),
  openSettings: () => ipcRenderer.invoke("floe:open-settings"), // .env를 두는 앱 설정 폴더 열기
  saveKey: (key, baseUrl) => ipcRenderer.invoke("floe:save-key", { key, baseUrl }),   // API 키(와 중계 서버 주소)를 넣는다
  clearKey: () => ipcRenderer.invoke("floe:clear-key"),       // 키를 뺀다 — 그다음부터 이 컴퓨터의 Claude Code로
  // 창 밖의 커서 — 플로로의 눈이 따라오게(2026-10-19). 돌려주는 함수를 부르면 그만 듣는다
  onCursor: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:cursor", h); return () => ipcRenderer.removeListener("floe:cursor", h); },
  // Mac 노치(다이내믹 아일랜드, 2026-10-19) — 앱이 노치 크기 {width, height}(pt)를 보내면 화면이 띠를 노치에 맞춘다. 노치가 없으면 오지 않는다
  onNotch: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:notch", h); return () => ipcRenderer.removeListener("floe:notch", h); },
  resize: (w, h, anchor) => ipcRenderer.send("floe:resize", w, h, anchor),   // 창을 지금 보이는 섬(띠 · 한 줄 · 펼침 · 옆의 설정 창) 크기에 맞춘다. anchor "left"면 왼쪽을 고정
  thru: (on) => ipcRenderer.send("floe:thru", !!on),           // 창의 투명한 자리 클릭을 뒤 창으로 통과(Windows · Mac — 2026-10-22). 섬 위면 false
  expand: () => ipcRenderer.send("floe:expand"),                // 서고로 들어갈 때 — 창을 화면만큼 넓힌다(6.2.0). 넓히면 floe:expanded가 온다
  // 창을 넓힌 뒤(2026-10-20) — 앱이 {dx, dy}(섬 창이 있던 자리에서 넓힌 창까지 옮긴 거리)를 보내면 화면이 섬을 제자리에 붙들고 잠수한다
  onExpanded: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:expanded", h); return () => ipcRenderer.removeListener("floe:expanded", h); },
  // 설정 창 · 퀘스트 창(C-22, 2026-10-21) — 섬: 열기(kind, {side, size, html, place}) · 내용 보내기 · 크기 · 닫기 · 창의 누름 받기 · 창이 닫힘 알림. 창(win.html): 내용 받기 · 누름 보내기
  openWin: (kind, opt) => ipcRenderer.send("floe:win-open", kind, opt || {}),
  dockSide: (side) => ipcRenderer.send("floe:dock-side", String(side || "")),   // 섬을 작업실 창의 어느 가장자리에 붙일지(C-41 ②, 2026-10-27) — 섬이 보낸다
  onDock: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:dock", h); return () => ipcRenderer.removeListener("floe:dock", h); },   // 작업실 창(win.js)이 받는다 — {side, size}: 그쪽에 섬이 있으니 내용이 비켜선다
  onDockRoom: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:dock-room", h); return () => ipcRenderer.removeListener("floe:dock-room", h); },   // 섬(app.js)이 받는다 — {side, width, height}: 작업실 크기 안에서 스크롤, null이면 원래대로
  sendWin: (kind, html) => ipcRenderer.send("floe:win-html", kind, html),
  sizeWin: (kind, size) => ipcRenderer.send("floe:win-size", kind, size),
  closeWin: (kind) => ipcRenderer.send("floe:win-close", kind),
  onWinEvent: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:win-event", h); return () => ipcRenderer.removeListener("floe:win-event", h); },
  onWinClosed: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:win-closed", h); return () => ipcRenderer.removeListener("floe:win-closed", h); },
  onWinHtml: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:win-html", h); return () => ipcRenderer.removeListener("floe:win-html", h); },
  winEvent: (p) => ipcRenderer.send("floe:win-event", p),
});
