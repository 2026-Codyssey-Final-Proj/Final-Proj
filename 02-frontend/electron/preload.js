// claude-drafted: 2026-10-19 — 화면(app.js · setup.js)이 앱에게 부탁할 수 있는 것 — 다섯. 화면은 Node를 직접 쓰지 못한다(contextIsolation)
// saveKey · clearKey(처음 설정, 2026-10-19): 키는 앱이 설정 폴더의 .env(나만 읽기)에만 쓴다. 화면 · 브라우저 저장소 · 서버 주소에는 남지 않는다
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("floeApp", {
  connect: () => ipcRenderer.invoke("floe:connect"),          // 프로젝트 폴더 고르기 → 훅 더하기
  disconnect: () => ipcRenderer.invoke("floe:disconnect"),    // 프로젝트 폴더 고르기 → 훅 빼기
  openSettings: () => ipcRenderer.invoke("floe:open-settings"), // .env를 두는 앱 설정 폴더 열기
  saveKey: (key, baseUrl) => ipcRenderer.invoke("floe:save-key", { key, baseUrl }),   // API 키(와 중계 서버 주소)를 넣는다
  clearKey: () => ipcRenderer.invoke("floe:clear-key"),       // 키를 뺀다 — 그다음부터 이 컴퓨터의 Claude Code로
});
