// claude-drafted: 2026-10-19 — 화면(app.js)이 앱에게 부탁할 수 있는 것 — 딱 셋. 화면은 Node를 직접 쓰지 못한다(contextIsolation)
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("floeApp", {
  connect: () => ipcRenderer.invoke("floe:connect"),          // 프로젝트 폴더 고르기 → 훅 더하기
  disconnect: () => ipcRenderer.invoke("floe:disconnect"),    // 프로젝트 폴더 고르기 → 훅 빼기
  openSettings: () => ipcRenderer.invoke("floe:open-settings"), // .env를 두는 앱 설정 폴더 열기
});
