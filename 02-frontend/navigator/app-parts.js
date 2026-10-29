// claude-drafted: 2026-10-29 — app.js 나누기(이재엽 "기능들을 나뉘게 하면 더 효율적으로" · 버튼 "가장 문제가 덜하고 유지보수가 가능한 작업").
// 원본은 app/ 조각(00-base.js, 10-views.js …), app.js는 조각을 이름 차례로 묶은 릴리즈 파일이다 — 화면 · 서버 · 앱 묶기 · 시험은 그대로 app.js를 쓴다.
// 조각은 하나의 큰 함수 (() => { … })(); 를 순서대로 자른 것이라 서로의 이름을 그대로 쓴다(동작이 바뀌지 않는다). 그래서 조각만 따로 실행하지는 못한다.
//   node 02-frontend/navigator/app-parts.js join    조각을 고친 뒤 — app.js를 다시 묶는다
//   node 02-frontend/navigator/app-parts.js split   app.js를 직접 고쳤거나 옛 브랜치를 병합해 app.js에만 고침이 있을 때 — 조각으로 되돌린다
// join은 app.js에 조각에 없는 고침이 있으면 덮지 않고 멈춘다(마지막 커밋의 조각과 견준다). 시험: 04-tests/navigator/app-parts.test.js. 자세히: app/README.md
const fs = require("node:fs");
const path = require("node:path");

const HEAD = "// 묶은 파일 — 고치려면 app/ 조각을 고치고 `node 02-frontend/navigator/app-parts.js join` (직접 고쳤으면 split). 조각마다 아래 '━━ app/…' 줄에서 시작한다";
const MARK = /^\/\/ ━━ app\/(\d\d-[a-z0-9-]+\.js) ━━$/;
const mark = (name) => `// ━━ app/${name} ━━`;
const PART = /^\d\d-[a-z0-9-]+\.js$/;

// 조각 [{ name, text }] → app.js 글. 조각 끝에 줄바꿈이 없으면 붙인다(다음 표시 줄이 그 줄에 붙지 않게)
function join(parts) {
  return HEAD + "\n" + parts.map((p) => mark(p.name) + "\n" + (p.text.endsWith("\n") ? p.text : p.text + "\n")).join("");
}

// app.js 글 → 조각. 머리 줄 다음은 반드시 표시 줄 — 아니면 어느 조각인지 모를 글이라 멈춘다(조각을 잃지 않게)
function split(text) {
  const lines = String(text).split("\n");
  if (lines[0] === HEAD) lines.shift();
  if (!MARK.test(lines[0] || "")) throw new Error("app.js 첫 줄(머리 줄 다음)이 조각 표시('// ━━ app/NN-이름.js ━━')가 아니다 — 어느 조각에 넣을지 모르는 글");
  const parts = [];
  for (const l of lines) {
    const m = l.match(MARK);
    if (m) parts.push({ name: m[1], text: [] });
    else parts[parts.length - 1].text.push(l);
  }
  // 파일 끝 줄바꿈이 만든 마지막 빈 칸을 빼고, 조각마다 끝 줄바꿈 하나를 돌려놓는다(join이 붙인 그대로)
  const last = parts[parts.length - 1].text;
  if (last.length && last[last.length - 1] === "") last.pop();
  return parts.map((p) => ({ name: p.name, text: p.text.join("\n") + "\n" }));
}

// join이 덮으면 잃는 조각 이름들 — app.js의 그 칸이 지금 조각과도, 마지막 커밋의 조각과도 다르면 app.js에만 있는 고침이다
//   (app.js를 직접 고쳤거나, 옛 브랜치 병합으로 app.js에만 고침이 들어왔다). cur · now · committed는 { 이름: 글 }
function lostByJoin(cur, now, committed) {
  const names = new Set([...Object.keys(cur), ...Object.keys(now)]);
  return [...names].filter((n) => cur[n] !== now[n] && cur[n] !== committed[n]).sort();
}

function readParts(dir) {
  const names = fs.readdirSync(dir).filter((n) => n.endsWith(".js"));
  const bad = names.filter((n) => !PART.test(n));
  if (bad.length) throw new Error(`app/ 조각 이름은 '두 자리 번호-소문자.js'(예: 47-carry.js) — 묶이지 않을 파일: ${bad.join(", ")}`);
  return names.sort().map((name) => ({ name, text: fs.readFileSync(path.join(dir, name), "utf8") }));
}

// 조각을 쓰고, app.js에 없어진 조각 파일만 지운다(README 같은 다른 파일은 둔다)
function writeParts(dir, parts) {
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(parts.map((p) => p.name));
  for (const n of fs.readdirSync(dir)) if (PART.test(n) && !keep.has(n)) fs.rmSync(path.join(dir, n));
  for (const p of parts) fs.writeFileSync(path.join(dir, p.name), p.text);
}

module.exports = { join, split, lostByJoin, readParts, writeParts };

if (require.main === module) {
  const { execFileSync } = require("node:child_process");
  const DIR = path.join(__dirname, "app"), APP = path.join(__dirname, "app.js");
  const byName = (ps) => Object.fromEntries(ps.map((p) => [p.name, p.text]));
  const git = (...a) => execFileSync("git", ["-C", __dirname, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  // 마지막 커밋의 조각 — git이 없으면 null(검사 없이 묶는다)
  function committedParts() {
    try { git("rev-parse", "HEAD"); } catch { return null; }
    let names = [];
    try { names = git("ls-tree", "--name-only", "HEAD", "app/").split("\n").map((p) => path.basename(p)).filter((n) => PART.test(n)); } catch {}
    return Object.fromEntries(names.map((n) => [n, git("show", `HEAD:./app/${n}`)]));
  }
  const cmd = process.argv[2];
  if (cmd === "join") {
    const parts = readParts(DIR), committed = committedParts();
    if (committed && fs.existsSync(APP) && !process.argv.includes("--overwrite")) {
      const lost = lostByJoin(byName(split(fs.readFileSync(APP, "utf8"))), byName(parts), committed);
      if (lost.length) {
        console.error(`멈춤 — app.js의 ${lost.join(", ")} 칸에 조각에 없는 고침이 있다(직접 고쳤거나 옛 브랜치 병합).`);
        console.error("조각을 아직 안 고쳤으면 split으로 그 고침을 조각에 옮긴 뒤 다시 고친다. 둘 다 고쳤으면 app.js 쪽 고침을 조각에 손으로 옮기고 join --overwrite");
        process.exit(1);
      }
    }
    fs.writeFileSync(APP, join(parts));
    console.log(`app.js를 조각 ${parts.length}개로 묶었다`);
  } else if (cmd === "split") {
    const parts = split(fs.readFileSync(APP, "utf8"));
    writeParts(DIR, parts);
    console.log(`app.js를 조각 ${parts.length}개로 되돌렸다`);
  } else {
    console.log("쓰는 법: node 02-frontend/navigator/app-parts.js join [--overwrite] | split");
    process.exitCode = 1;
  }
}
