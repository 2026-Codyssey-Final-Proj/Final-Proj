// claude-drafted: 2026-10-28 — F-69 맡긴 일이 허락을 못 받으면 화면이 '막힘'을 말하고 사람이 길을 고른다(결정 모음 A-03 — 이재엽 "허락 팝업을 다시 → 선택창 → 까닭과 가장 가까운 길").
// 실제 브라우저로 섬의 채팅을 눌러 본다. 서버는 이 시험 안에서 켜고 /api/plan · /api/task/start · /api/task · /api/task/retry는 가로채 정해 둔 답을 준다(AI · Claude Code를 부르지 않는다).
//   ① 처음 막혔고 카드에 답이 없었으면(none) 카드를 다시 띄운다 — 사람이 누르지 않아도 같은 일을 다시(again)
//   ② 또 막히면 선택창(다시 맡기기 · 직접 하기 · 그만두기) ③ 또 막히면 까닭 + 가장 가까운 길(명령만 막혔으면 '명령 없이 파일만') → 고른 길로 끝까지(보고)
//   직접 하기 — 맡길 글(brief)과 복사, 그만두기 — 그 줄을 다시 맡길 수 있게
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/task-blocked.test.js
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
if (skip) console.log(`⚠️ e2e/task-blocked: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-blocked-e2e-"));
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

const PLAN = { problem: "행사 신청을 종이로 받아 헷갈려요", have: "README에 문제 글이 있어요", missing: "신청 화면이 없어요",
  items: [{ id: "p1", need: "회원이 신청 단추를 누르면, 앱은 신청을 받는다", check: "신청 단추를 누르면 목록에 한 줄이 생긴다" }], prep: [], ask: [], say: "계획을 세웠어요." };
const REPORT = { items: [{ check: PLAN.items[0].check, done: true, evidence: "form.html에 신청 칸을 만들었어요" }], easy: "신청하는 종이를 화면으로 만들었어요.", ask: "", done: 1, total: 1 };
const AT = 4242;
const blocked = (kinds, asks, tryN) => ({ state: "blocked", code: 0, at: AT, try: tryN, report: null, blocked: { count: kinds.reduce((t, k) => t + k.n, 0), kinds, asks } });

// steps — /api/task가 차례로 줄 답(마지막은 계속). /api/task/retry가 오면 다음 묶음으로
async function openLive(browser, rounds) {
  const page = await browser.newPage();
  const seen = { start: [], retry: [], stops: [], stopped: false, errors: [], round: 0 };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) seen.errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    const json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/plan") return json({ ok: true, plan: PLAN, tokens: 100 });
    if (p === "/api/task/start") { seen.start.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, project: "test-1", task: { state: "running", at: AT, try: 0 } }); }
    if (p === "/api/task/retry") {
      const b = JSON.parse(req.postData() || "{}"); seen.retry.push(b);
      if (b.way === "brief") return json({ ok: true, brief: "회원이 신청 단추를 누르면, 앱은 신청을 받는다\n\n끝 조건:\n(1) 신청 단추를 누르면 목록에 한 줄이 생긴다" });
      seen.round += 1; seen.stopped = false; return json({ ok: true, project: "test-1", task: { state: "running", at: AT, try: seen.round } });
    }
    if (p === "/api/task/stop") { seen.stops.push(JSON.parse(req.postData() || "{}")); seen.stopped = true; return json({ ok: true, task: { state: "running", at: AT } }); }
    if (p === "/api/task") return json({ ok: true, task: seen.stopped ? { state: "stopped", code: null, at: AT, try: seen.round, report: null, blocked: null, quiet: 0 } : rounds[Math.min(seen.round, rounds.length - 1)] });
    return req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live" })); sessionStorage.setItem("seeded", "1"); } } catch {}
  });
  await page.goto(`http://127.0.0.1:${port}/#base&plan`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  return { page, seen };
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 5000 }); await page.click(sel); await wait(250); };
const nowSay = (page) => page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");
async function handFirst(page) {
  await page.click(".mc.chat [data-act=say]");
  await page.evaluate((t) => { const el = document.querySelector(".mc.chat [data-act=say]"); el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, "동아리 행사 신청 앱");
  await page.keyboard.press("Enter"); await wait(250);
  await click(page, ".mc.chat [data-act=plan-make]");
  await click(page, '.msg.now [data-act=plan-ok][data-id="p1"]');
  await click(page, ".mc.chat [data-act=plan-confirm]");
  await click(page, ".mc.chat [data-act=plan-hand]");
}

test("① 카드를 못 눌러 막히면 다시 띄운다 → ② 또 막히면 선택창 → 다시 맡기기 → ③ 또 막히면 까닭과 '명령 없이 파일만' → 그 길로 끝까지(보고)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const rounds = [blocked([{ what: "파일 쓰기", n: 1 }, { what: "명령", n: 1 }], { allow: 0, deny: 0, none: 2 }, 0),
      blocked([{ what: "파일 쓰기", n: 1 }, { what: "명령", n: 1 }], { allow: 0, deny: 1, none: 0 }, 1),
      blocked([{ what: "명령", n: 2 }], { allow: 1, deny: 1, none: 0 }, 2),
      { state: "done", code: 0, at: AT, try: 3, report: REPORT, blocked: null }];
    const { page, seen } = await openLive(browser, rounds);
    await handFirst(page);
    // ① 첫 막힘 — 카드에 답이 없었다: 사람이 누르지 않아도 같은 일을 다시(again)
    await page.waitForFunction(() => document.body.innerText.includes("허락 카드를 다시 띄울게요"), { timeout: 12000 });
    assert.deepEqual(seen.retry, [{ at: AT, way: "again" }]);
    // ② 또 막힘(거절) — 선택창
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("허락을 못 받아 2번 막혔어요"), { timeout: 12000 });
    const two = await nowSay(page);
    assert.match(two, /파일 쓰기 1 · 명령 1/); assert.match(two, /거절/);
    for (const a of ["blocked-again", "blocked-self", "blocked-stop"]) assert.ok(await page.$(`.mc.chat [data-act=${a}]`), a);
    assert.ok(!(await page.$(".mc.chat [data-act=blocked-files]")), "② 선택창에는 셋만");
    await click(page, ".mc.chat [data-act=blocked-again]");
    assert.deepEqual(seen.retry.at(-1), { at: AT, way: "again" });
    // ③ 또 막힘(명령만) — 까닭과 가장 가까운 길
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("또 막혔어요"), { timeout: 12000 });
    const three = await nowSay(page);
    assert.match(three, /명령이 막혀 실행/); assert.match(three, /가장 가까운 길/);
    assert.equal(await page.$eval(".mc.chat [data-act=blocked-files]", (e) => e.classList.contains("pri") || e.className.includes("pri")), true, "명령만 막혔으면 '명령 없이 파일만'이 먼저");
    await click(page, ".mc.chat [data-act=blocked-files]");
    assert.deepEqual(seen.retry.at(-1), { at: AT, way: "files-only" });
    // 그 길로 끝까지 — 보고가 오면 맡길 일의 보고
    await page.waitForSelector(".msg.now .pl-rep", { timeout: 12000 });
    assert.match(await nowSay(page), /신청하는 종이를 화면으로 만들었어요/);
    assert.ok(!(await page.$(".mc.chat [data-act=blocked-again]")), "막힘 카드는 사라진다");
    assert.equal(seen.start.length, 1, "새로 맡기지 않고 같은 일을 다시(같은 번호)");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("직접 하기 — 맡길 글과 복사 · 다 했어요, 그만두기 — 그 줄은 다시 맡길 수 있다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, [blocked([{ what: "파일 쓰기", n: 3 }], { allow: 0, deny: 0, none: 0 }, 0)]);
    await handFirst(page);
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("허락을 못 받아 3번 막혔어요"), { timeout: 12000 });
    assert.match(await nowSay(page), /허락 카드가 뜨지 않았어요/, "카드가 안 떴으면 저절로 다시 하지 않고 선택창");
    assert.deepEqual(seen.retry, []);
    await click(page, ".mc.chat [data-act=blocked-self]");
    assert.deepEqual(seen.retry, [{ at: AT, way: "brief" }]);
    await page.waitForSelector(".msg.now textarea.brief", { timeout: 5000 });
    assert.match(await page.$eval(".msg.now textarea.brief", (e) => e.value), /끝 조건/);
    assert.equal(await page.$eval(".msg.now textarea.brief", (e) => e.readOnly), true);
    assert.ok(await page.$(".mc.chat [data-act=blocked-copy]"));
    await click(page, ".mc.chat [data-act=blocked-done]");
    assert.ok(!(await page.$(".mc.chat [data-act=blocked-copy]")), "다 했어요 → 카드가 닫힌다");
    assert.ok(await page.$(".mc.chat [data-act=plan-hand]"), "그 줄을 다시 맡길 수 있다");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("C-50 멈춘 것 같으면(5분) 카드 — 더 기다리기 → 15분(시간 초과)에 다시 묻는다 → 멈추고 다시 맡기기(멈춤 → 같은 일 다시) → 보고", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const running = { state: "running", at: AT, try: 0, report: null, blocked: null, quiet: 320 };
    const { page, seen } = await openLive(browser, [running, { state: "done", code: 0, at: AT, try: 1, report: REPORT, blocked: null, quiet: 0 }]);
    await handFirst(page);
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("멈춘 것 같아요"), { timeout: 12000 });
    assert.match(await nowSay(page), /5분째 조용해요/);
    for (const a of ["stall-wait", "stall-again", "stall-self", "stall-stop"]) assert.ok(await page.$(`.mc.chat [data-act=${a}]`), a);
    await click(page, ".mc.chat [data-act=stall-wait]");
    assert.doesNotMatch(await nowSay(page), /멈춘 것 같아요/, "더 기다리기 — 카드를 닫는다");
    await wait(3500);
    assert.doesNotMatch(await nowSay(page), /멈춘 것 같아요/, "같은 단계에서는 다시 묻지 않는다");
    assert.deepEqual(seen.stops, [], "저절로 끄지 않는다");
    running.quiet = 930;
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("넘게 아무 소식이 없어요"), { timeout: 12000 });
    await click(page, ".mc.chat [data-act=stall-again]");
    await page.waitForSelector(".msg.now .pl-rep", { timeout: 12000 });
    assert.deepEqual(seen.stops, [{ at: AT }], "사람이 고를 때만 그 일을 멈춘다");
    assert.deepEqual(seen.retry, [{ at: AT, way: "again" }], "멈춘 뒤 같은 일을 다시");
    assert.match(await nowSay(page), /신청하는 종이를 화면으로 만들었어요/);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
