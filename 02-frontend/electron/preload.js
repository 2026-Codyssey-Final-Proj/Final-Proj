// claude-drafted: 2026-10-19 — 화면(app.js)이 앱에게 부탁할 수 있는 것 — 딱 셋. 화면은 Node를 직접 쓰지 못한다(contextIsolation)
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("floeApp", {
  connect: () => ipcRenderer.invoke("floe:connect"),          // 프로젝트 폴더 고르기 → 훅 더하기
  disconnect: () => ipcRenderer.invoke("floe:disconnect"),    // 프로젝트 폴더 고르기 → 훅 빼기
  openSettings: () => ipcRenderer.invoke("floe:open-settings"), // .env를 두는 앱 설정 폴더 열기
  resize: (w, h) => ipcRenderer.send("floe:resize", w, h),     // 창을 지금 보이는 섬(띠 · 한 줄 · 펼침) 크기에 맞춘다 — 투명한 빈 영역이 뒤 창의 클릭을 가로채지 않게
});
