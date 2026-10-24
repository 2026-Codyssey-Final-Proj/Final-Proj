// claude-drafted: 2026-10-24 — C-34 준비 계획판 · C-32 맡길 일과 보고(이재엽 "한번에 내용들을 넣으면 … 기준들을 사람들이 확인해서 너한테 의견들을 바로바로").
// 섬의 계획판을 실제 브라우저로 눌러 본다: 한 번에 넣기 → 계획 세우기 → 줄마다 맞아요 / 고칠래요 · 의견 → 다시 세우기 → 확정 → 맡기기(기준과 함께) → 보고 → 맞아요(끝냄).
// 서버는 이 시험 안에서 켜고, /api/plan · /api/task/start · /api/task는 가로채 정해 둔 답을 준다(AI · Claude Code를 부르지 않는다). 연습(서버 없이)은 예시 계획 · 예시 보고.
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/plan-flow.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { pathToFileURL } = require("node:url");

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
if (skip) console.log(`⚠️ e2e/plan-flow: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-plan-e2e-"));
fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
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
  prep: ["신청 받을 칸 정하기"], ask: ["마감이 있나요?"], say: "계획을 세웠어요. 줄마다 봐 주세요." };
const PLAN2 = { ...PLAN, items: [PLAN.items[0], { id: "p2", need: "운영진이 목록을 보면, 앱은 이름과 연락처를 보여 준다", check: "목록 화면에 이름과 연락처가 보인다" }], ask: [], say: "의견대로 고쳤어요." };
const REPORT = { items: [{ check: PLAN.items[0].check, done: true, evidence: "form.html에 신청 칸을 만들었어요" }], easy: "신청하는 종이를 화면으로 만들었어요.", ask: "", done: 1, total: 1 };

async function openLive(browser) {
  const page = await browser.newPage();
  const seen = { plan: [], start: [], taskCalls: 0, errors: [], report: null, answer: null };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) seen.errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    const json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/plan") { const b = JSON.parse(req.postData() || "{}"); seen.plan.push(b); return json({ ok: true, plan: b.prev ? PLAN2 : PLAN, tokens: 1200 }); }
    if (p === "/api/task/start") { seen.start.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, project: "test-1", task: { state: "running" } }); }
    if (p === "/api/task") { seen.taskCalls += 1; return json({ ok: true, task: seen.taskCalls < 2 ? { state: "running" } : { state: "done", code: 0, report: seen.report || REPORT } }); }
    if (p === "/api/answer") { seen.answer = JSON.parse(req.postData() || "{}"); return json({ ok: true, answer: "목록은 list.html에서 봐요.", tokens: 300 }); }
    return req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live" })); sessionStorage.setItem("seeded", "1"); } } catch {}
  });
  await page.goto(`http://127.0.0.1:${port}/#base&pane=plan`, { waitUntil: "load" });
  await page.waitForSelector("#plan-text", { timeout: 8000 });
  return { page, seen };
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 5000 }); await page.click(sel); await wait(250); };

test("계획판 한 바퀴: 한 번에 넣기 → 계획 → 줄마다 맞아요 / 고칠래요 · 답 → 다시 세우기(의견이 서버로) → 확정 → 맡기기(기준과 함께) → 보고 → 맞아요", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    assert.equal(await page.$eval("[data-act=plan-make]", (e) => e.disabled), true, "비어 있으면 세우기 단추가 잠긴다");
    await page.type("#plan-text", "동아리 행사 신청 앱 — 회원이 신청하고 운영진이 목록을 봐요");
    await click(page, "[data-act=plan-make]");
    await page.waitForSelector(".pl-items", { timeout: 5000 });
    assert.deepEqual(seen.plan, [{ text: "동아리 행사 신청 앱 — 회원이 신청하고 운영진이 목록을 봐요", readme: true }]);
    assert.match(await page.$eval(".pl-sum", (e) => e.textContent), /행사 신청을 종이로 받아 헷갈려요/);
    assert.equal(await page.$eval("[data-act=plan-confirm]", (e) => e.disabled), true, "아직 안 본 줄이 있으면 확정이 잠긴다");
    await click(page, '[data-act=plan-ok][data-id="p1"]');
    await click(page, '[data-act=plan-fix][data-id="p2"]');
    await page.type('[data-act=plan-note][data-id="p2"]', "연락처도 보여 줘요");
    await page.type('[data-act=plan-answer][data-i="0"]', "금요일 6시");
    assert.equal(await page.$eval("[data-act=plan-again]", (e) => e.disabled), false, "의견이 생기면 다시 세우기가 켜진다");
    await click(page, "[data-act=plan-again]");
    await page.waitForFunction(() => document.querySelector(".pl-items")?.textContent.includes("연락처가 보인다"), { timeout: 5000 });
    assert.deepEqual(seen.plan[1].notes, [{ need: PLAN.items[1].need, check: PLAN.items[1].check, note: "연락처도 보여 줘요" }]);
    assert.deepEqual(seen.plan[1].answers, [{ q: "마감이 있나요?", a: "금요일 6시" }]);
    assert.equal(seen.plan[1].prev.items.length, 2);
    assert.match(await page.$eval(".ph", (e) => e.textContent), /2판/);
    await click(page, '[data-act=plan-ok][data-id="p1"]'); await click(page, '[data-act=plan-ok][data-id="p2"]');
    await click(page, "[data-act=plan-confirm]");
    await page.waitForSelector('[data-act=plan-hand][data-id="p1"]', { timeout: 5000 });
    assert.match(await page.$eval(".ph", (e) => e.textContent), /끝냄 0 \/ 2/);
    await click(page, '[data-act=plan-hand][data-id="p1"]');
    assert.deepEqual(seen.start, [{ text: PLAN.items[0].need, checks: [PLAN.items[0].check] }], "기준을 같이 넘긴다");
    assert.equal(await page.$eval('[data-act=plan-hand][data-id="p2"]', (e) => e.disabled), true, "한 번에 하나만");
    await page.waitForSelector("[data-act=plan-accept]", { timeout: 9000 });   // 3초마다 묻는다 — 두 번째에 보고
    assert.match(await page.$eval(".pl-rep", (e) => e.textContent), /신청하는 종이를 화면으로 만들었어요/);
    assert.match(await page.$eval(".pl-rep", (e) => e.textContent), /form\.html에 신청 칸을 만들었어요/);
    await click(page, '[data-act=plan-accept][data-id="p1"]');
    assert.match(await page.$eval(".ph", (e) => e.textContent), /끝냄 1 \/ 2/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).plan);
    assert.equal(saved.work.p1.state, "done", "판은 이 컴퓨터에 남는다(다시 켜도 이어진다)");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("다르게 봐요: 의견을 달면 그 의견을 붙여 다시 맡긴다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    await page.type("#plan-text", "동아리 행사 신청 앱");
    await click(page, "[data-act=plan-make]");
    await page.waitForSelector(".pl-items", { timeout: 5000 });
    await click(page, '[data-act=plan-ok][data-id="p1"]'); await click(page, '[data-act=plan-ok][data-id="p2"]');
    await click(page, "[data-act=plan-confirm]");
    await click(page, '[data-act=plan-hand][data-id="p1"]');
    await page.waitForSelector("[data-act=plan-rej-open]", { timeout: 9000 });
    await click(page, '[data-act=plan-rej-open][data-id="p1"]');
    await page.type("[data-act=plan-rej-note]", "목록에 아직 안 생겨요");
    await click(page, '[data-act=plan-reject][data-id="p1"]');
    assert.equal(seen.start.length, 2);
    assert.match(seen.start[1].text, /지난번에 사용자가 다르게 본 점: 목록에 아직 안 생겨요/);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("연습(서버 없이 · 파일로 연 화면): 예시 계획과 예시 보고 — AI를 부르지 않는다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    await page.goto(`${pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href}#base&pane=plan`, { waitUntil: "load" });
    await page.waitForSelector("#plan-text", { timeout: 8000 });
    await page.type("#plan-text", "아무 앱");
    await click(page, "[data-act=plan-make]");
    await page.waitForSelector(".pl-items", { timeout: 5000 });
    assert.match(await page.$eval(".ph", (e) => e.textContent), /예시예요/);
    for (const id of ["p1", "p2", "p3"]) await click(page, `[data-act=plan-ok][data-id="${id}"]`);
    await click(page, "[data-act=plan-confirm]");
    await click(page, '[data-act=plan-hand][data-id="p1"]');
    await page.waitForSelector("[data-act=plan-accept]", { timeout: 4000 });
    assert.match(await page.$eval(".pl-rep", (e) => e.textContent), /예시예요/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("보고에서 물어보기(플로로에게 — /api/answer, 보고 글만) · Claude Code가 물은 것에 답하고 이어서 맡기기(그 질문과 답을 붙여서)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    seen.report = { ...REPORT, ask: "목록은 운영진만 보나요?" };
    await page.type("#plan-text", "동아리 행사 신청 앱");
    await click(page, "[data-act=plan-make]");
    await page.waitForSelector(".pl-items", { timeout: 5000 });
    await click(page, '[data-act=plan-ok][data-id="p1"]'); await click(page, '[data-act=plan-ok][data-id="p2"]');
    await click(page, "[data-act=plan-confirm]");
    await click(page, '[data-act=plan-hand][data-id="p1"]');
    await page.waitForSelector("[data-act=plan-ask-open]", { timeout: 9000 });
    assert.match(await page.$eval(".pl-rep", (e) => e.textContent), /Claude Code가 물어요: 목록은 운영진만 보나요\?/);
    await click(page, '[data-act=plan-ask-open][data-id="p1"]');
    await page.type("[data-act=plan-q]", "목록은 어디서 봐요?");
    await click(page, '[data-act=plan-ask-send][data-id="p1"]');
    await page.waitForSelector(".pl-ans", { timeout: 5000 });
    assert.match(await page.$eval(".pl-ans", (e) => e.textContent), /list\.html/);
    assert.equal(seen.answer.question, "목록은 어디서 봐요?");
    assert.match(seen.answer.text, /Claude Code의 보고: 신청하는 종이를 화면으로 만들었어요/);
    await page.type('[data-act=plan-reply][data-id="p1"]', "네, 운영진만 봐요");
    await click(page, '[data-act=plan-reply-send][data-id="p1"]');
    assert.equal(seen.start.length, 2);
    assert.match(seen.start[1].text, /Claude Code가 "목록은 운영진만 보나요\?"라고 물었고, 사용자의 답: 네, 운영진만 봐요/);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
