// claude-drafted: 2026-10-28 — C-53 작업실 세 칸(이재엽 버튼 "오른쪽 칸은 섬을 펼치면 접힘" · "서식 단추는 만든다", 목업 캔버스 ②):
//   서버를 다른 포트로 띄우고 작업실을 1280 · 1440 · 1728에서 열어 세 칸(파일 · 작업 · 오른쪽)이 넘침 없이 보이는지, 칸 접기, 파일을 열면 문서 도구 줄(서식 · 글 크기 · 찾기) · 상태 줄 · 오른쪽 칸의 목차 · 칸 채움을 잰다. puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/workspace-md.test.js
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

test("C-53 — 작업실 세 칸(1280 · 1440 · 1728) · 칸 접기 · 문서 도구 줄(서식 넣기 · 글 크기 · 찾기) · 상태 줄 · 오른쪽 칸(목차 · 칸 채움 · 퀘스트)", { skip }, async () => {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-wsmd-")), PROJ = path.join(TMP, "my-club-app");
  fs.writeFileSync(path.join(TMP, "claude-stub.js"), `process.stdin.resume(); process.stdin.on("end", () => setTimeout(() => { process.stdout.write(JSON.stringify({ type: "result", result: "ok" })); process.exit(0); }, 300));`);
  Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("../navigator/hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "tok"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: path.join(TMP, "claude-stub.js") });
  fs.writeFileSync(process.env.NAV_REPLAY, "{}");
  const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
  w(path.join(PROJ, "README.md"), "# 동아리 앱\n\n소개\n");
  w(path.join(PROJ, "docs/03-requirements/requirements.md"), "# 3단계 꼭 필요한 기능\n\n## 기능 문장\n1. 회원이 신청을 누르면, 앱은 신청서를 보인다.\n\n## 나온 곳\n\n## 막을 일\n\n");
  const port = await freePort(); process.env.NAV_PORT = String(port);
  const Srv = require(path.join(ROOT, "03-backend/navigator/server.js"));
  const srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken(); Srv.useProject(PROJ);
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: [`--user-data-dir=${path.join(TMP, "profile")}`] });
  try {
    const page = await browser.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(String(e)));
    const cols = () => page.evaluate(() => { const g = (s) => { const el = document.querySelector(s); const r = el && el.getBoundingClientRect(); return el && getComputedStyle(el).display !== "none" && r.width > 0 ? Math.round(r.width) : 0; };
      const q = document.querySelector(".qwin"); return { nav: g(".wnav"), body: g(".wbody"), side: g(".wside"), win: q ? Math.round(q.getBoundingClientRect().width) : 0, over: q ? q.scrollWidth > q.clientWidth + 1 : false, pageOver: document.documentElement.scrollWidth > innerWidth + 1 }; });
    for (const width of [1728, 1440, 1280]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(`http://127.0.0.1:${port}/#base`, { waitUntil: "load" });   // 기본 화면(진짜 폴더 모드) — 장면(#ex)은 연습 모드라 파일 칸이 예시다
      await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); localStorage.removeItem("floe:ws-nav"); localStorage.removeItem("floe:ws-side"); });
      await page.reload({ waitUntil: "load" }); await wait(500);
      if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(600); }
      const c = await cols();
      assert.ok(c.nav > 0 && c.body > 300 && c.side > 0 && !c.over && !c.pageOver, `${width} — 세 칸이 다 보이고 넘침 0: ${JSON.stringify(c)}`);
      assert.ok(c.nav + c.body + c.side <= c.win + 2, `${width} — 세 칸이 작업실 폭 안에: ${JSON.stringify(c)}`);
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `ws-${width}.png`) }); }
    }
    // 칸 접기 — 파일 칸 · 오른쪽 칸을 접으면 작업 칸이 넓어진다, 다시 펼침
    const before = await cols();
    await page.click("[data-act=wnav-toggle]"); await wait(300); let c = await cols(); assert.ok(!c.nav && c.body > before.body, `파일 칸 접음: ${JSON.stringify(c)}`);
    await page.click("[data-act=wside-toggle]"); await wait(300); c = await cols(); assert.ok(!c.side && c.body > before.body + 100, `오른쪽 칸 접음: ${JSON.stringify(c)}`);
    await page.click("[data-act=wnav-toggle]"); await page.click("[data-act=wside-toggle]"); await wait(300); c = await cols(); assert.ok(c.nav && c.side, "다시 펼침");
    // 오른쪽 칸 — 퀘스트(지금 단계 · 다섯 칸 · 관문)
    const side = await page.$eval(".wside", (el) => el.textContent.replace(/\s+/g, " "));
    assert.match(side, /퀘스트/, "오른쪽 칸 아래 — 퀘스트"); assert.match(side, /관문/, "관문 남은 기준");
    // 파일을 열면 — 도구 줄 · 상태 줄 · 오른쪽 칸 '이 문서'(목차 · 빈 절)
    await page.type(".fn-find", "requirements"); await wait(400);   // 3단계 폴더는 접혀 있다(지금 장은 2단계) — 찾기로 한 줄로
    await page.click(".wnav .fn .fn-file:not(.fn-opened)"); await wait(600);
    await page.$eval(".fn-find", (el) => { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); }); await wait(300);
    const open = await page.$$eval(".wh .ftab", (ls) => ls.map((l) => l.textContent.trim()));   // 연 파일은 머리 줄 파일 탭에만(F-82 — 왼쪽 '열어 둔 파일' 묶음을 뺌)
    assert.ok(open.some((x) => x.includes("requirements.md")), `머리 줄 파일 탭: ${open.join(",")}`);
    assert.equal(await page.$(".wnav .fn-open"), null, "왼쪽에 '열어 둔 파일' 묶음이 없다");
    const toc = await page.$$eval(".wside .ws-toc li", (ls) => ls.map((l) => `${l.querySelector("button").childNodes[0].textContent.trim()}${l.classList.contains("empty") ? "!" : ""}`));
    assert.deepEqual(toc, ["3단계 꼭 필요한 기능", "기능 문장", "나온 곳!", "막을 일!"], "목차 — 빈 절은 표시");
    assert.match(await page.$eval(".wside", (el) => el.textContent), /비었어요|빈 절 2/, "칸 채움 — 빈 절 수");
    let st = await page.$eval(".fv-st", (el) => el.textContent.replace(/\s+/g, " "));
    assert.match(st, /LF/, "줄 끝"); assert.match(st, /줄/, "줄 수");
    // 고치기 → 굵게 · 목록 · 제목 — 글 칸의 고른 자리에 기호가 들어가고 바뀜 표시
    await page.click("[data-act=fedit]"); await wait(300);
    await page.evaluate(() => { const t = document.querySelector(".fv-edit"); t.focus(); const i = t.value.indexOf("소개") < 0 ? t.value.indexOf("회원") : 0; t.setSelectionRange(i, i + 2); });
    await page.click('[data-fmt="bold"]'); await wait(300);
    let v = await page.$eval(".fv-edit", (t) => t.value); assert.ok(v.includes("**회원**"), `굵게: ${v.slice(0, 80)}`);
    await page.click('[data-fmt="list"]'); await wait(200); v = await page.$eval(".fv-edit", (t) => t.value); assert.ok(/^- \d\. \*\*회원\*\*|\n- 1\. \*\*회원\*\*/.test(v), `목록: ${v.slice(0, 120)}`);
    await page.click('[data-fmt="h2"]'); await wait(200); v = await page.$eval(".fv-edit", (t) => t.value); assert.ok(v.includes("## - 1. **회원**"), `제목: ${v.slice(0, 120)}`);
    st = await page.$eval(".fv-st", (el) => el.textContent.replace(/\s+/g, " ")); assert.match(st, /내가 바꾼 줄 1/, `상태 줄 — 내가 바꾼 줄: ${st}`);
    assert.ok(await page.$(".wtabs .ftab.dirty"), "바뀜 표시");
    // 글 크기 · 찾기
    const fs0 = await page.$eval(".fv-edit", (t) => parseFloat(getComputedStyle(t).fontSize));
    await page.click('[data-act="fsize"][data-v="+"]'); await wait(200);
    assert.ok((await page.$eval(".fv-edit", (t) => parseFloat(getComputedStyle(t).fontSize))) > fs0, "글 크기 +");
    await page.click("[data-act=fedit]"); await wait(300); await page.click("[data-act=fraw]"); await wait(300);
    await page.type(".fv-tools [data-act=ffind]", "막을"); await wait(400);
    const hits = await page.$$eval(".fv-code li.hit", (ls) => ls.map((l) => l.textContent.trim()));
    assert.deepEqual(hits, ["## 막을 일"], `찾기 — 그 글이 든 줄만 표시: ${hits.join("|")}`);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "ws-doc.png") });
    assert.deepEqual(errors, [], "화면 오류 0");
    // 앱의 작업실 창 재현(win.html — 창 가득, 섬은 옆 칸의 접힌 알약): 1280 · 1440 · 1728에서 세 칸이 다 보이고 넘침 0, 사진은 목업 ②와 나란히
    await page.click("[data-act=fedit]"); await wait(300);   // 보기로(글 칸 없이) — 창에 넣을 HTML
    const qwin = await page.evaluate(() => document.querySelector(".qwin").outerHTML), pill = await page.evaluate(() => document.querySelector(".pill")?.outerHTML || "");
    for (const width of [1728, 1440, 1280]) {
      const win = await browser.newPage();
      await win.evaluateOnNewDocument(() => { window.floeApp = { onWinHtml: (f) => { window.__h = f; }, onDock() {}, winEvent() {} }; });
      await win.setViewport({ width, height: 900 });
      await win.goto(`http://127.0.0.1:${port}/navigator/win.html#quest`, { waitUntil: "load" });
      await win.evaluate((html) => window.__h(html), `${qwin}<div class="isl-col side-right narrow folded">${pill}</div>`); await wait(450);
      const c = await win.evaluate(() => { const g = (sel) => { const el = document.querySelector(sel); const r = el && el.getBoundingClientRect(); return el && getComputedStyle(el).display !== "none" && r.width > 0 ? Math.round(r.width) : 0; };
        const q = document.querySelector(".qwin"); return { nav: g(".wnav"), body: g(".wbody"), side: g(".wside"), win: Math.round(q.getBoundingClientRect().width), over: q.scrollWidth > q.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1, fmd: !!window.FloeMd }; });
      assert.ok(c.nav === 200 && c.side === 280 && c.body >= width - 56 - 480 - 40 && !c.over && c.fmd, `앱 ${width} — 세 칸(200 · 넓은 작업 칸 · 280) · 넘침 0 · 서식 도우미 있음: ${JSON.stringify(c)}`);
      if (SHOTS) await win.screenshot({ path: path.join(SHOTS, `ws-app-${width}.png`) });
      await win.close();
    }
  } finally { await browser.close(); srv.close(); }
});
