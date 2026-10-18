// claude-drafted: 2026-10-19 — 묶기 전에 화면 · 서버 코드를 payload/로 복사한다(electron-builder의 files는 이 폴더 안만 본다).
// payload/는 git에 올리지 않는다(.gitignore). 뺀 것: node_modules · .env*(키) · 문서(*.md) · 이 폴더(electron/) 자신
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "../..");
const OUT = path.join(__dirname, "payload");
const skip = (p) => /node_modules|\/\.env|\.md$|02-frontend\/electron/.test(p.replace(/\\/g, "/"));

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
