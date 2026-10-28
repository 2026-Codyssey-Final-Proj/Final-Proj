// claude-drafted: 2026-10-29 — 지식 퀘스트 C-51(PRD 6절 · 9절 9번): 계획의 근거로 내가 정한 것 · 배운 것을 쓴다. 실제 브라우저로 섬의 채팅을 본다.
//   /api/plan은 가로채 근거 · 앞의 결정과 다름이 붙은 계획을 준다(AI를 부르지 않는다). 계획을 세울 때 이번 단계에 고른 가져온 것(carryUse)을 보내는지,
//   줄마다 근거와 '앞의 결정과 다름'이 보이는지, '앞의 결정대로'면 그 줄을 고칠래요 + 의견으로 두는지 본다.
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/knowledge-basis.test.js
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
if (skip) console.log(`⚠️ e2e/knowledge-basis: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-basis-e2e-"));
fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("../navigator/hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
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

const PLAN = { problem: "신청이 흩어져요", have: "없어요", missing: "신청 화면",
  items: [{ id: "p1", need: "회원이 신청하면, 앱으로 만든 화면이 받는다", check: "목록에 한 줄", basis: "2단계: 신청 화면 하나", diff: { kind: "만들 곳", was: "웹", now: "앱" } },
    { id: "p2", need: "관리자가 목록을 본다", check: "목록이 보인다", basis: "새로 정함" }], prep: [], ask: [], say: "계획을 세웠어요." };

test("계획의 근거 — 고른 가져온 것을 보내고, 줄마다 근거 · 앞의 결정과 다름(이 줄대로 / 앞의 결정대로)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const page = await browser.newPage(); const errors = [], sent = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const p = new URL(req.url()).pathname, json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
      if (p === "/api/plan") { sent.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, plan: PLAN, tokens: 10 }); }
      if (p === "/api/carry") return json({ ok: true, items: [], held: [] });
      return req.continue();
    });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live", carryUse: { 0: [{ id: "ca", text: "화면 하나를 먼저 그린다" }] } })); sessionStorage.setItem("seeded", "1"); } } catch {} });
    await page.goto(`http://127.0.0.1:${port}/#base&plan`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    await page.click(".mc.chat [data-act=say]");
    await page.evaluate((t) => { const el = document.querySelector(".mc.chat [data-act=say]"); el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, "동아리 신청 앱");
    await page.keyboard.press("Enter"); await wait(250);
    await page.waitForSelector(".mc.chat [data-act=plan-make]", { timeout: 5000 }); await page.click(".mc.chat [data-act=plan-make]"); await wait(400);
    assert.deepEqual(sent[0].carry, ["화면 하나를 먼저 그린다"], "이번 단계에 고른 가져온 것");
    const now = await page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");
    assert.match(now, /근거 — 2단계: 신청 화면 하나/); assert.match(now, /근거 — 새로 정함/);
    assert.match(now, /앞의 결정과 다름 — 앞에서 정한 것은 '웹', 이 줄은 '앱'/);
    await page.click('.msg.now [data-act=plan-follow][data-id="p1"]'); await wait(300);
    const plan = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).plan);
    assert.equal(plan.marks.p1, "fix"); assert.match(plan.notes.p1, /앞의 결정\('웹'\)에 맞춰 고쳐 주세요/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
