// claude-drafted: 2026-10-27 — C-43 파일 보기 · 고치기(이재엽 버튼 "읽기 + 고치기" · "바로 저장 + 되돌리기" · "저장마다 커밋 맡기기" · "512KB · 내용으로 판단"):
//   서버를 다른 포트로 띄우고(시험 폴더를 useProject로 연결 — 실행 중인 앱 · 저장값은 건드리지 않음) 브라우저로 작업실을 열어 파일 칸에서 파일을 누른다 →
//   md는 보기 좋게 · 원문 전환, 코드는 줄 번호, 이름 찾기, 고치기 → 저장(⌘S) → 파일에 쓰임 · 되돌리기, 비밀값 모양이면 멈추고 묻기 → 그대로 저장. puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/file-view.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const ROOT = path.join(__dirname, "../..");
function findPuppeteer() {
  const tries = [process.env.PUPPETEER_PATH, "puppeteer"];
  const npx = path.join(os.homedir(), ".npm", "_npx");
  try { for (const d of fs.readdirSync(npx)) tries.push(path.join(npx, d, "node_modules", "puppeteer")); } catch {}
  for (const t of tries.filter(Boolean)) { try { return require(t); } catch {} }
  return null;
}
function findChrome() {
  const tries = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  return tries.filter(Boolean).find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}
const puppeteer = findPuppeteer(), chrome = findChrome();
const skip = !puppeteer || !chrome ? `건너뜀 — ${!puppeteer ? "puppeteer" : "Chrome"}를 찾지 못했어요(PUPPETEER_PATH · CHROME_PATH로 알려 줄 수 있어요)` : false;
if (skip) console.log(`⚠️ e2e/file-view: ${skip}`);
const SHOTS = process.env.FLOE_SHOTS || "";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });

test("C-43 — 파일 칸에서 누르면 작업실에 열린다(md 보기 좋게 · 원문 · 코드 줄 번호 · 찾기), 고쳐 저장하면 파일에 쓰이고 되돌리기, 비밀값 모양이면 멈추고 묻는다", { skip }, async () => {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-fv-")), PROJ = path.join(TMP, "my-club-app");
  fs.writeFileSync(path.join(TMP, "claude-stub.js"), `process.stdin.resume(); process.stdin.on("end", () => setTimeout(() => { process.stdout.write(JSON.stringify({ type: "result", result: "ok" })); process.exit(0); }, 300));`);   // 가짜 claude — 저장마다 커밋을 맡기므로, 진짜 Claude Code가 시험 폴더에서 돌지 않게(NAV_CLAUDE_BIN)
  Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("../navigator/hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "tok"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: path.join(TMP, "claude-stub.js") });
  fs.writeFileSync(process.env.NAV_REPLAY, "{}");
  const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
  w(path.join(PROJ, "README.md"), "# 동아리 앱\n\n- **신청** 받기\n- 마감 알림\n\n| 기능 | 꼭 |\n|---|---|\n| 신청 | 꼭 |\n" + Array.from({ length: 30 }, (_, n) => `\n## 절 ${n + 1}\n\n글 ${n + 1}\n`).join("") + "\n## 끝 절\n```\n코드만\n```\n");   // 목차가 길어 오른쪽 칸이 스크롤되고, 마지막 절은 코드 블록만
  w(path.join(PROJ, "docs/01-idea/idea.md"), "# 아이디어\n"); w(path.join(PROJ, "src/app.js"), "const a = 1;\nconsole.log(a);\n"); w(path.join(PROJ, ".env"), "KEY=1");
  const port = await freePort(); process.env.NAV_PORT = String(port);
  const Srv = require(path.join(ROOT, "03-backend/navigator/server.js"));
  const srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken(); Srv.useProject(PROJ);
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: [`--user-data-dir=${path.join(TMP, "profile")}`] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    const errors = []; page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${port}/#base`, { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.reload({ waitUntil: "load" }); await wait(500);
    await page.click(".tb [data-act=qwin-toggle]"); await wait(700);
    const rows = await page.$$eval(".wnav .fn li", (ls) => ls.map((l) => l.textContent.trim()));
    assert.ok(rows.includes("README.md") && !rows.some((r) => r.includes(".env")), `진짜 목록: ${rows.join(" | ")}`);
    // md 열기 → 보기 좋게 → 원문
    await page.click('.wnav .fn-file[data-v="' + (await page.$$eval(".wnav .fn-file:not(.fn-opened)", (bs) => bs.findIndex((b) => b.textContent.trim() === "README.md"))) + '"]'); await wait(500);
    let s = await page.evaluate(() => ({ tab: document.querySelector('.wtabs .ftab button[role=tab][aria-selected="true"]')?.textContent, h1: document.querySelector(".fv-md h1")?.textContent, b: document.querySelector(".fv-md li b")?.textContent, table: !!document.querySelector(".fv-md table"), head: document.querySelector(".fv-h b")?.textContent }));
    assert.deepEqual(s, { tab: "README.md", h1: "동아리 앱", b: "신청", table: true, head: "README.md" });
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, "file-md.png") }); }
    await page.click("[data-act=fraw]"); await wait(300);
    assert.ok(await page.$(".fv-code"), "원문은 줄 번호로"); assert.equal(await page.$eval(".fv-code li:first-child span", (e) => e.textContent), "# 동아리 앱");
    // 목차 — 코드 블록만 있는 절도 채운 절, 아래쪽 목차를 누르면 그 줄로 옮겨 가고 오른쪽 칸은 그 자리(임유정 2026-10-28)
    const sideAt = await page.evaluate(() => { const sd = document.querySelector(".qwin .wside"); sd.scrollTop = sd.scrollHeight; return sd.scrollTop; });
    assert.ok(sideAt > 0, "목차가 길어 오른쪽 칸이 스크롤된다");
    assert.equal(await page.$eval(".ws-toc li:last-child", (l) => l.classList.contains("empty")), false, "코드 블록만 있는 '끝 절'은 비지 않았다");
    await page.click(".ws-toc li:last-child button"); await wait(400);
    s = await page.evaluate(() => { const c = document.querySelector(".fv-code"), g = c.querySelector("[data-go]"), cr = c.getBoundingClientRect(), gr = g.getBoundingClientRect(); return { side: document.querySelector(".qwin .wside").scrollTop, codeTop: c.scrollTop > 0, line: g.textContent, inView: gr.top >= cr.top && gr.bottom <= cr.bottom }; });
    assert.deepEqual(s, { side: sideAt, codeTop: true, line: "## 끝 절", inView: true }, JSON.stringify(s));
    // 코드 열기 — 줄 번호, git이 아니라 바뀐 줄 없음
    await page.type(".fn-find", "app"); await wait(400);
    const found = await page.$$eval(".wnav .fn-file:not(.fn-opened)", (bs) => bs.map((b) => b.textContent.trim()));
    assert.deepEqual(found, ["src/app.js"], `찾기: ${found.join(",")}`);
    await page.click(".wnav .fn-file:not(.fn-opened)"); await wait(500);
    assert.equal((await page.$$eval(".wtabs .ftab button[role=tab]", (bs) => bs.map((b) => b.textContent))).join(","), "README.md,app.js", "열린 파일 탭 둘");
    const xAt = await page.$$eval(".wtabs .ftab", (ts) => ts.map((t) => { const a = t.getBoundingClientRect(), x = t.querySelector(".ftab-x").getBoundingClientRect(), cx = x.left + x.width / 2, cy = x.top + x.height / 2; return cx > a.left && cx < a.right && cy > a.top && cy < a.bottom; }));
    assert.deepEqual(xAt, [true, true], "닫기 ×는 제 탭 안에 — 반짝이 효과(.fx)와 이름이 겹쳐 왼쪽 위로 밀렸다(2026-10-28)");
    assert.equal(await page.$$eval(".fv-code li", (ls) => ls.length), 2); assert.equal(await page.$$eval(".fv-code li.chg", (ls) => ls.length), 0, "git이 아니면 바뀐 줄 없음");
    // 고치기 → 저장(⌘S) → 파일에 쓰임 · 되돌리기
    await page.click("[data-act=fedit]"); await wait(300);
    await page.click(".fv-edit"); await page.keyboard.press("End"); await page.keyboard.type("\nconsole.log('둘');"); await wait(300);
    assert.equal(await page.$eval(".wtabs .ftab.dirty button[role=tab]", (b) => b.textContent), "app.js •", "고치면 탭에 표시");
    await page.keyboard.down("Meta"); await page.keyboard.press("s"); await page.keyboard.up("Meta"); await wait(700);
    assert.equal(fs.readFileSync(path.join(PROJ, "src/app.js"), "utf8"), "const a = 1;\nconsole.log(a);\n\nconsole.log('둘');", "파일에 쓰였다(End는 마지막 빈 줄 끝)");
    s = await page.evaluate(() => ({ note: document.querySelector(".fv-note")?.textContent || "", dirty: !!document.querySelector(".wtabs .ftab.dirty"), undo: !!document.querySelector("[data-act=fundo]") }));
    assert.match(s.note, /저장했어요/, s.note); assert.ok(!s.dirty && s.undo, JSON.stringify(s));
    await page.click("[data-act=fundo]"); await wait(300);
    assert.equal(await page.$eval(".fv-edit", (e) => e.value), "const a = 1;\nconsole.log(a);\n", "되돌리기 — 저장 전 글");
    await page.click("[data-act=fsave]"); await wait(600);
    assert.equal(fs.readFileSync(path.join(PROJ, "src/app.js"), "utf8"), "const a = 1;\nconsole.log(a);\n", "되돌린 글을 저장");
    // 비밀값 모양 → 멈추고 묻기 → 그대로 저장
    await page.click(".fv-edit"); await page.keyboard.press("End"); await page.keyboard.type("\n// password: hunter22"); await wait(200);
    await page.click("[data-act=fsave]"); await wait(600);
    assert.match(await page.$eval(".fv-note.ask", (e) => e.textContent), /비밀번호·키 대입 모양이 있어요/); assert.ok(!fs.readFileSync(path.join(PROJ, "src/app.js"), "utf8").includes("hunter22"), "아직 쓰지 않았다");
    await page.click("[data-act=fsave-force]"); await wait(600);
    assert.ok(fs.readFileSync(path.join(PROJ, "src/app.js"), "utf8").includes("hunter22"), "그대로 저장");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "file-edit.png") });
    // 닫기 — 고친 것이 없으니 바로
    await page.click('.wtabs .ftab .ftab-x[data-v="1"]'); await wait(300);
    assert.equal((await page.$$eval(".wtabs .ftab button[role=tab]", (bs) => bs.map((b) => b.textContent))).join(","), "README.md");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); srv.close(); Srv.dropProject(PROJ); fs.rmSync(TMP, { recursive: true, force: true }); }
});
