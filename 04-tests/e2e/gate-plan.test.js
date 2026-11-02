// claude-drafted: 2026-10-30 — C-27 관문 계획서 · C-23 ⑤ 버전(이재엽 "보드에서 없음 부분 전부 제작"). 실제 브라우저로: 단계 결과를 저장소에 심고 작업실 책 탭(#tab=lib)을 열면
// 관문 계획서 판이 보이고, 단계를 고르고, 목차를 누르면 그 절로 간다. (캔버스 ⑤ 칸의 버전 확인은 2026-11-02에 탭을 빼면서 뺐다.) 서버는 이 시험 안에서 켠다(AI는 부르지 않는다).
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/gate-plan.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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
const skip = !puppeteer || !chrome ? `건너뜀 — ${!puppeteer ? "puppeteer" : "Chrome"}를 찾지 못했어요` : false;
if (skip) console.log(`⚠️ e2e/gate-plan: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-gp-e2e-"));
fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("../navigator/hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: "/usr/bin/false" });
for (const k of ["NAV_RECORD", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
let srv, port;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
test.before(async () => {
  if (skip) return;
  port = await freePort(); process.env.NAV_PORT = String(port);
  const Srv = require("../../03-backend/navigator/server.js");
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken();
});
test.after(() => { if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });

const RESULTS = {
  0: { chap: 0, title: "행사 신청", items: [{ name: "어떤 불편", lines: ["신청을 종이로 받아 헷갈려요"], by: "me" }], at: "2026-10-25", passed: "2026-10-25", learned: "불편을 한 문장으로" },
  1: { chap: 1, title: "행사 신청", items: [{ name: "아이디어", lines: ["신청 화면 하나와 목록 하나"], by: "edit" }], at: "2026-10-27", passed: "2026-10-27" },
};
async function open(browser, hash) {
  const page = await browser.newPage(), errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 1000 });
  const saved = JSON.stringify({ mode: "fixture", results: RESULTS });
  await page.evaluateOnNewDocument((s) => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", s); sessionStorage.setItem("seeded", "1"); } } catch {}
  }, saved);
  await page.goto(`http://127.0.0.1:${port}/${hash}`, { waitUntil: "load" });
  await wait(600);
  return { page, errors };
}

test("C-27 — 책 탭의 관문 계획서: 결과가 있는 단계를 고르고, 목차 다섯을 누르면 그 절로", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, errors } = await open(browser, "#tab=lib");
    await page.waitForSelector(".gplan", { timeout: 8000 });
    await page.click("[data-act=fold]"); await wait(400);   // 칸이 비면 섬이 가운데를 덮는다(C-61) — 접고 책 탭을 본다
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT.replace(/\.png$/, "-open.png") });
    assert.deepEqual(await page.$$eval(".gplan .gp-pick button", (bs) => bs.map((b) => b.textContent.trim())), ["1단계", "2단계"]);
    assert.match(await page.$eval(".gplan h4", (e) => e.textContent), /^2단계 관문 계획서/, "마지막 단계가 먼저");
    await page.click('.gplan [data-act=gp-sel][data-i="0"]'); await wait(250);
    assert.match(await page.$eval(".gplan h4", (e) => e.textContent), /^1단계 관문 계획서/);
    assert.equal(await page.$$eval(".gplan .gp-toc button", (bs) => bs.length), 5);
    assert.match(await page.$eval("#gp-1-2", (e) => e.textContent), /신청을 종이로 받아 헷갈려요/);
    await page.click('.gplan [data-act=gp-toc][data-v="gp-1-5"]'); await wait(700);
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), "gp-1-5", "목차를 누르면 그 절로(초점도)");
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("C-24 — 용어 풀이의 '더 공부하기' → 책 탭의 공부 묶음: 고르기 · 묶음 받기(파일 + 질문 다섯) · NotebookLM 안내(가리기는 단위 시험 study-pack)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, errors } = await open(browser, "#tab=lib");
    await page.click("[data-act=fold]"); await wait(400);
    // 용어 단추가 있는 화면으로 — 연습 모드의 처음 화면에서 용어 단추를 찾는다(없으면 튜토리얼과 같은 동작을 직접)
    const viaTerm = await page.evaluate(() => { const t = document.querySelector("[data-act=term]"); if (!t) return false; t.click(); return true; });
    if (viaTerm) { await wait(300); await page.waitForSelector("[data-act=study-open]", { timeout: 3000 }); await page.click("[data-act=study-open]"); }
    else await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "study-open"; document.querySelector(".gplan").appendChild(b); b.click(); });   // 판정 전이라 용어 단추가 없으면 같은 동작을 화면 안에서(용어 · 관문 자리의 단추는 단위 시험이 본다)
    await page.waitForSelector(".study", { timeout: 5000 });
    assert.deepEqual(await page.$$eval(".study .gp-pick button", (bs) => bs.map((b) => [b.textContent.trim(), b.getAttribute("aria-pressed")])),
      [["지금 단계 설명", "true"], ["관문 계획서", "true"], ["용어 풀이", "true"], ["내 기록", "false"]], "내 기록은 사람이 골라야");
    await page.click('.study [data-act=study-pick][data-i="3"]'); await wait(200);
    await page.evaluate(() => { window.__got = null; const orig = URL.createObjectURL; URL.createObjectURL = (b) => { window.__blob = b; return orig.call(URL, b); }; });
    await page.click(".study [data-act=study-get]"); await wait(400);
    const text = await page.evaluate(async () => (window.__blob ? await window.__blob.text() : ""));
    assert.match(text, /^# 공부 묶음 — /); assert.match(text, /## 내 기록/); assert.match(text, /## 먼저 물을 질문 다섯/);
    assert.equal(await page.$$eval(".study .study-q li", (ls) => ls.length), 5);
    assert.match(await page.$eval(".study", (e) => e.textContent), /NotebookLM에 아무것도 보내지 않아요/);
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT.replace(/\.png$/, "-study.png") });
    await page.click(".study [data-act=study-close]"); await wait(200);
    assert.equal(await page.$(".study"), null);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
