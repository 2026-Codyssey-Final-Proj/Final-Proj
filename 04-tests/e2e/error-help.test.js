// claude-drafted: 2026-10-30 — C-64 오류에 막혔을 때(이재엽 버튼 "10/31까지 작게" — 맡긴 일 실패(C-50)에서 이어지는 질문 셋).
// 실제 브라우저로 눌러 본다: 끝까지 못 간 맡길 일 한 줄(저장소에 심음) → '오류 같이 보기' → 한 번에 하나씩(오류 글 · 모름 · 예) → 줄에 답이 붙음
// → '다시 맡기기'가 옛 일을 잇지 않고(/api/task/retry 없음) 답이 든 새 글 + 기준 둘(원래 기준 · 다시 안 나는지 보는 시험)로 /api/task/start. 키 모양 · 홈 폴더 이름은 가려서 간다.
// 서버는 이 시험 안에서 켜고, /api/task* 는 가로채 정해 둔 답을 준다(Claude Code를 부르지 않는다). puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/error-help.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const FP = require("../../03-backend/navigator/plan.js");

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
if (skip) console.log(`⚠️ e2e/error-help: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-dbg-e2e-"));
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

const PLAN = { problem: "행사 신청을 종이로 받아 헷갈려요", have: "README에 문제 글이 있어요", missing: "신청 화면이 없어요",
  items: [{ id: "p1", need: "회원이 신청 단추를 누르면, 앱은 신청을 받는다", check: "신청 단추를 누르면 목록에 한 줄이 생긴다" }, { id: "p2", need: "운영진이 목록을 보면, 앱은 신청한 사람을 보여 준다", check: "목록 화면에 이름이 보인다" }],
  prep: [], ask: [], say: "계획을 세웠어요." };
// 확정한 판에서 첫 줄이 맡김 중이다가 끝까지 못 갔다(C-50) — 저장소에 이 모양으로 남는다
const failedBoard = () => FP.failed(FP.start(FP.confirm(FP.mark(FP.mark(FP.board(PLAN), "p1", "ok"), "p2", "ok")), "p1", 77), "p1", "끝까지 가지 못했어요");

async function openLive(browser) {
  const page = await browser.newPage();
  const seen = { start: [], retry: 0, errors: [] };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) seen.errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    const json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/task/retry") { seen.retry += 1; return json({ ok: false, reason: "시험: 부르면 안 됨" }); }
    if (p === "/api/task/start") { seen.start.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, project: "test-1", task: { state: "running", at: 200 } }); }
    if (p === "/api/task") return json({ ok: true, task: { state: "running", at: 200, quiet: 0 } });
    return req.continue();
  });
  const saved = JSON.stringify({ mode: "live", plan: failedBoard(), qfocus: "plan" });
  await page.evaluateOnNewDocument((s) => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", s); sessionStorage.setItem("seeded", "1"); } } catch {}
  }, saved);
  await page.goto(`http://127.0.0.1:${port}/#base&plan`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  return { page, seen };
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 5000 }); await page.click(sel); await wait(250); };
const nowText = (page) => page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");

test("C-64 — 끝까지 못 간 줄에서 '오류 같이 보기' → 하나씩 묻고(모름 · 그만두기) → 답과 시험 하나를 붙여 새로 맡긴다, 키 · 홈 폴더 이름은 가린다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    assert.match(await nowText(page), /지난번에 끝까지 못 했어요/, "실패는 남아 보인다(C-50)");
    // 그만두기 — 아무것도 붙지 않는다
    await click(page, ".mc.chat [data-act=dbg-open]");
    assert.match(await nowText(page), /오류 같이 보기 — 1 \/ 3/);
    await click(page, ".mc.chat [data-act=dbg-close]");
    assert.doesNotMatch(await nowText(page), /오류 같이 본 것/, "그만두면 붙이지 않는다");
    // 다시 열어 셋을 답한다 — ① 오류 글(키 · 홈 경로가 섞임) ② 모름 ③ 예
    await click(page, ".mc.chat [data-act=dbg-open]");
    await page.waitForSelector(".msg.now textarea[data-act=dbg-text]", { timeout: 5000 });
    const key = "sk-" + "c".repeat(24);
    await page.type(".msg.now textarea[data-act=dbg-text]", `TypeError: name is undefined ${key} at /Users/minji/club-app/form.js:12`);
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT.replace(/\.png$/, "-q1.png") });
    await click(page, ".mc.chat [data-act=dbg-next]");
    assert.match(await nowText(page), /오류 같이 보기 — 2 \/ 3/);
    assert.match(await nowText(page), /바로 전에 무엇을 바꿨나요/);
    await click(page, ".mc.chat [data-act=dbg-skip]");
    assert.match(await nowText(page), /오류 같이 보기 — 3 \/ 3/);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".mc.chat [data-act=dbg-pick]")].map((b) => b.textContent.trim())), ["예", "아니요", "모름"]);
    await click(page, '.mc.chat [data-act=dbg-pick][data-i="0"]');
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT.replace(/\.png$/, "-done.png") });
    const card = await nowText(page);
    assert.match(card, /오류 같이 본 것/); assert.match(card, /바로 전에 바꾼 것: 모름/); assert.match(card, /다시 하면 또 나나: 예/);
    assert.ok(!card.includes("minji") && !card.includes(key), "화면에도 가린 글만");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).plan.work.p1.debug);
    assert.equal(stored.changed, "모름"); assert.match(stored.err, /~\/club-app\/form\.js:12/); assert.match(stored.err, /\[비밀값\]/);
    // 다시 맡기기 — 옛 일을 잇지 않고 답이 든 새 글로
    await click(page, ".mc.chat [data-act=plan-hand]");
    assert.equal(seen.retry, 0, "답을 붙인 줄은 /api/task/retry를 부르지 않는다");
    assert.equal(seen.start.length, 1);
    assert.deepEqual(seen.start[0].checks, [PLAN.items[0].check, FP.DEBUG_CHECK], "기준에 다시 안 나는지 보는 시험 하나");
    assert.match(seen.start[0].text, /오류 글\(고치지 않은 그대로\): TypeError: name is undefined \[비밀값\] at ~\/club-app\/form\.js:12/);
    assert.ok(!seen.start[0].text.includes("minji"), "홈 폴더 이름은 나가지 않는다");
    assert.match(await nowText(page), /일하고 있어요/);
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
