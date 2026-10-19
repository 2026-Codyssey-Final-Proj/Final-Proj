// claude-drafted: 2026-10-19 — 화면(app.js · setup.js)이 앱에게 부탁할 수 있는 것 — 다섯. 화면은 Node를 직접 쓰지 못한다(contextIsolation)
// saveKey · clearKey(처음 설정, 2026-10-19): 키는 앱이 설정 폴더의 .env(나만 읽기)에만 쓴다. 화면 · 브라우저 저장소 · 서버 주소에는 남지 않는다
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("floeApp", {
  connect: () => ipcRenderer.invoke("floe:connect"),          // 프로젝트 폴더 고르기 → 훅 더하기
  disconnect: () => ipcRenderer.invoke("floe:disconnect"),    // 프로젝트 폴더 고르기 → 훅 빼기
  openSettings: () => ipcRenderer.invoke("floe:open-settings"), // .env를 두는 앱 설정 폴더 열기
  saveKey: (key, baseUrl) => ipcRenderer.invoke("floe:save-key", { key, baseUrl }),   // API 키(와 중계 서버 주소)를 넣는다
  clearKey: () => ipcRenderer.invoke("floe:clear-key"),       // 키를 뺀다 — 그다음부터 이 컴퓨터의 Claude Code로
  // 창 밖의 커서 — 플로로의 눈이 따라오게(2026-10-19). 돌려주는 함수를 부르면 그만 듣는다
  onCursor: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:cursor", h); return () => ipcRenderer.removeListener("floe:cursor", h); },
  // Mac 노치(다이내믹 아일랜드, 2026-10-19) — 앱이 노치 크기 {width, height}(pt)를 보내면 화면이 띠를 노치에 맞춘다. 노치가 없으면 오지 않는다
  onNotch: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:notch", h); return () => ipcRenderer.removeListener("floe:notch", h); },
  resize: (w, h, anchor) => ipcRenderer.send("floe:resize", w, h, anchor),   // 창을 지금 보이는 섬(띠 · 한 줄 · 펼침 · 옆의 설정 창) 크기에 맞춘다. anchor "left"면 왼쪽을 고정
  expand: () => ipcRenderer.send("floe:expand"),                // 서고로 들어갈 때 — 창을 화면만큼 넓힌다(6.2.0). 넓히면 floe:expanded가 온다
  // 창을 넓힌 뒤(2026-10-20) — 앱이 {dx, dy}(섬 창이 있던 자리에서 넓힌 창까지 옮긴 거리)를 보내면 화면이 섬을 제자리에 붙들고 잠수한다
  onExpanded: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:expanded", h); return () => ipcRenderer.removeListener("floe:expanded", h); },
  // 모아 보기 창(2026-10-20, C-11) — 섬의 단추가 연다. enter: 모아 보기 창의 '들어가기'가 섬을 앞으로 · '이번 단계'로. onEnter: 섬이 그 신호를 받는다(떼는 함수를 돌려줌)
  openHub: (space) => ipcRenderer.send("floe:open-hub", space || ""),   // space(2026-10-20, C-13): "alerts" · "ai"면 그 칸으로(기본 화면의 '크게 보기')
  enter: () => ipcRenderer.send("floe:enter"),
  onEnter: (cb) => { const h = (_e, p) => cb(p); ipcRenderer.on("floe:enter", h); return () => ipcRenderer.removeListener("floe:enter", h); },
});
