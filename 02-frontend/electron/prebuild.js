// claude-drafted: 2026-10-19 — 묶기 전에 화면 · 서버 코드를 payload/로 복사한다(electron-builder의 files는 이 폴더 안만 본다).
// payload/는 git에 올리지 않는다(.gitignore). 뺀 것: node_modules · .env*(키) · 문서(*.md) · 이 폴더(electron/) 자신 · 섬 화면 조각(navigator/app/ · app-parts.js — 앱은 묶은 app.js만 쓴다)
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "../..");
const OUT = path.join(__dirname, "payload");
const skip = (p) => /node_modules|\/\.env|\.md$|02-frontend\/electron|navigator\/app\/|app-parts\.js$/.test(p.replace(/\\/g, "/"));

fs.rmSync(OUT, { recursive: true, force: true });
for (const dir of ["02-frontend", "03-backend"]) {
  // 폴더째 복사하면 02-frontend가 자기 안(electron/payload)으로 들어가 Node가 거절한다 — 한 칸씩 복사하고 electron/은 뺀다
  for (const name of fs.readdirSync(path.join(ROOT, dir))) {
    const src = path.join(ROOT, dir, name);
    if (skip(src) || (dir === "02-frontend" && name === "electron")) continue;
    fs.cpSync(src, path.join(OUT, dir, name), { recursive: true, filter: (p) => !skip(p) });
  }
}
// 시연 입구가 가리키는 설계 목업 한 장 — 서버 목록(server.js FILES)에 있어 없으면 404 대신 스트림 오류가 난다
const mock = "01-docs/04-pattern-implementation/bookmark-constellation-mock.html";
fs.mkdirSync(path.dirname(path.join(OUT, mock)), { recursive: true });
fs.copyFileSync(path.join(ROOT, mock), path.join(OUT, mock));
console.log(`payload/ 준비: ${fs.readdirSync(OUT).join(", ")}`);

// Mac 노치 도우미(2026-10-19 이재엽 결정 "Swift 도우미로 정확히") — notch/notch-probe.swift를 build/notch-probe로 묶는다(package.json mac.extraResources가 Resources/로 넣는다).
// 이 Mac(2026-10-19)은 명령줄 도구의 기본 SDK가 컴파일러와 안 맞아 실패했다 — 그러면 설치된 SDK를 새것부터 하나씩 대 본다. 끝내 안 되거나 swiftc가 없으면 건너뛴다(앱은 노치 없이 전처럼 위쪽 가운데)
if (process.platform === "darwin") {
  const { spawnSync } = require("node:child_process");
  const out = path.join(__dirname, "build/notch-probe"), src = path.join(__dirname, "notch/notch-probe.swift");
  const sdkDir = "/Library/Developer/CommandLineTools/SDKs";
  let sdks = [];
  try { sdks = fs.readdirSync(sdkDir).filter((n) => /^MacOSX\d/.test(n)).sort().reverse().map((n) => path.join(sdkDir, n)); } catch {}
  let ok = false, why = "";
  for (const sdk of [null, ...sdks]) {
    const r = spawnSync("swiftc", ["-O", ...(sdk ? ["-sdk", sdk] : []), "-o", out, src], { encoding: "utf8", timeout: 120000 });
    if (r.error) { why = "swiftc 없음"; break; }
    if (r.status === 0) { ok = true; break; }
    why = "컴파일 실패";
  }
  console.log(ok ? "build/notch-probe 묶음(Mac 노치 도우미)" : `notch-probe 건너뜀(${why}) — 앱은 노치 없이 위쪽 가운데로 켜진다`);
}
