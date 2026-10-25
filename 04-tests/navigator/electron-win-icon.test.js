// claude-drafted: 2026-10-26 — 이재엽 "윈도우 환경에서 앱이 우리 플로 사진이 아닌 문제 해결" (F-59).
//   원인: Windows용 아이콘 파일(.ico)이 없고(build/icon.png만 — 맥 모양이라 둘레가 비어 작은 크기에서 흐림), 창에 아이콘을 주지 않고(npm start면 Electron 기본 그림),
//   앱 ID(AppUserModelId)를 정하지 않아 작업 표시줄이 설치한 바로 가기와 묶이지 않고, 트레이는 1024px 그림을 22px로 줄였다.
// lib.js의 순수 함수는 그대로 돌리고, main.js · package.json은 글로 맞대어 본다(electron 모듈 없이). 아이콘 파일은 ICO 머리를 읽어 크기를 본다.
// 실행: node --test 04-tests/navigator/electron-win-icon.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const DIR = path.join(__dirname, "../../02-frontend/electron");
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const PKG = JSON.parse(read("package.json"));

// ICO 파일의 그림 크기들 — 머리(6바이트) 뒤 칸마다 16바이트, 첫 바이트가 가로(0이면 256)
function icoSizes(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.readUInt16LE(0), 0, "ICO 머리"); assert.equal(b.readUInt16LE(2), 1, "아이콘 형식(1)");
  const n = b.readUInt16LE(4), out = [];
  for (let i = 0; i < n; i++) { const w = b[6 + i * 16] || 256, h = b[6 + i * 16 + 1] || 256; out.push([w, h]); }
  return out;
}

test("Windows 아이콘 파일 build/icon.ico — 작은 크기부터 256까지 여러 장(작업 표시줄 · 트레이 · 바탕 화면이 화면 배율에 맞는 것을 고른다)", () => {
  const file = path.join(DIR, "build/icon.ico");
  assert.ok(fs.existsSync(file), "build/icon.ico가 있어야 한다");
  const sizes = icoSizes(file).map(([w, h]) => { assert.equal(w, h, "정사각형"); return w; });
  for (const s of [16, 24, 32, 48, 64, 128, 256]) assert.ok(sizes.includes(s), `${s}px`);
});

test("어느 아이콘을 쓰나(appIcon): Windows는 build/icon.ico, Linux는 build/icon.png, 맥은 null(묶은 앱의 icns · 개발 실행은 Dock — devIcon)", () => {
  assert.equal(L.appIcon("win32", DIR), path.join(DIR, "build/icon.ico"));
  assert.equal(L.appIcon("linux", DIR), path.join(DIR, "build/icon.png"));
  assert.equal(L.appIcon("darwin", DIR), null);
  for (const p of ["win32", "linux"]) assert.ok(fs.existsSync(L.appIcon(p, DIR)), p);
});

test("묶는 설정(package.json): Windows 프로그램 · 설치 · 지우기 아이콘은 build/icon.ico, 묶음 안에도 넣는다(창 · 트레이가 읽는다)", () => {
  const b = PKG.build;
  assert.equal(b.win.icon, "build/icon.ico");
  for (const k of ["installerIcon", "uninstallerIcon", "installerHeaderIcon"]) assert.equal(b.nsis[k], "build/icon.ico", k);
  assert.ok(b.files.includes("build/icon.ico") && b.files.includes("build/icon.png"));
});

test("main.js: Windows는 앱 ID를 설치 바로 가기와 같게(appId) · 창 둘(섬 · 옆 창)에 아이콘 · 트레이는 Windows에서 .ico를 줄이지 않고", () => {
  const main = read("main.js");
  assert.match(main, /app\.setAppUserModelId\(/, "앱 ID를 정한다");
  assert.match(main, /app\.setAppUserModelId\(app\.isPackaged \? L\.APP_ID : process\.execPath\)/, "묶은 앱은 appId, 개발 실행은 제 경로(설치본 단추에 묶이지 않게)");
  assert.equal(L.APP_ID, PKG.build.appId, "앱 ID는 package.json의 appId — electron-builder가 바로 가기에 쓰는 값과 같게");
  assert.ok(!/require\("\.\/package\.json"\)\.build/.test(main), "묶은 앱의 package.json에는 build가 없다(electron-builder가 지운다) — 읽으면 켜지다 멈춘다");
  assert.equal((main.match(/new BrowserWindow\(\{/g) || []).length, 2, "창은 둘");
  assert.equal((main.match(/\.\.\.ICON_OPT/g) || []).length, 2, "두 창 모두 아이콘");
  assert.match(main, /const ICON = L\.appIcon\(process\.platform, __dirname\)/);
  assert.match(main, /process\.platform === "win32" \? img : img\.resize/, "Windows 트레이는 여러 크기가 든 .ico 그대로(화면 배율에 맞는 것을 고른다)");
});
