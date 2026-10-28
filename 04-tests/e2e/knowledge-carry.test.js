// claude-drafted: 2026-10-29 — 지식 퀘스트 C-48(PRD 6절 · 9절 1 · 2번): 다음 프로젝트로 가져가기. 실제 브라우저로 섬의 채팅을 본다.
//   서버는 이 시험 안에서 켜고 /api/events · /api/docs · /api/carry/draft · /api/carry는 가로채 정해 둔 답을 준다(AI를 부르지 않는다).
//   ① 8단계에 있으면 '가져갈 것을 정리해 볼까요?' → 초안 만들기(배운 것을 보낸다) → 기준 다섯 표시 · 고쳐 채택 · 반려는 까닭이 있어야 · 다 정했어요
//   ② 새 프로젝트를 시작하면 지난 프로젝트에서 그 단계에 채택한 것(최대 3개) · 보류한 것 → 이번에 쓸 것 고르기 → carryUse(계획의 근거)
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/knowledge-carry.test.js
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
if (skip) console.log(`⚠️ e2e/knowledge-carry: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-carry-e2e-"));
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

const Nav = require("../../03-backend/navigator/navigator.js");
const it = (name, lines) => ({ name, lines, by: "ok" });
const RESULTS = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((n) => [n, { chap: n, title: "동아리 앱", at: "2026-10-29", passed: "2026-10-29", learned: n === 1 ? "칸을 먼저 채우니 빠진 기능이 보였다" : n === 3 ? "예시 셋을 보고 고르니 빨랐다" : "", items: Nav.criteriaFor(n, "Xpress").map((c) => it(c.text, ["줄"])) }]));
const DRAFTS = [
  { text: "3단계 전에 화면 하나를 먼저 그린다", why: "2단계 계획과 3단계 요구가 달랐다", stage: 2, review: "2027-01-10", from: [1, 2] },
  { text: "예시 셋을 먼저 본다", why: "", stage: 3, review: "2027-01-10", from: [3] },
  { text: "버릴 초안", why: "왜", stage: 1, review: "2027-01-10", from: [0, 1] },
];

async function open(browser, seedState, { carry = { items: [], held: [] } } = {}) {
  const page = await browser.newPage(); const seen = { draft: [], post: [], errors: [] };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname, json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/events") return json({ ok: true, latest: 0, project: "club-app-2", events: [] });
    if (p === "/api/docs" && req.method() === "GET") return json({ ok: true, project: "club-app-2", topic: "", idea: "", source: "", stages: {} });
    if (p === "/api/carry/draft") { seen.draft.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, drafts: DRAFTS, say: "가져갈 것 초안이에요. 고쳐서 골라요.", tokens: 10 }); }
    if (p === "/api/carry" && req.method() === "POST") { seen.post.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, id: `c${seen.post.length}` }); }
    if (p === "/api/carry") return json({ ok: true, ...carry });
    if (["/api/stagedraft", "/api/quest", "/api/prepare"].includes(p)) return json({ ok: false, reason: "시험 — AI 없음" });
    return req.continue();
  });
  await page.evaluateOnNewDocument((s) => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); } } catch {} }, seedState);
  await page.goto(`http://127.0.0.1:${port}/#base`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  return { page, seen };
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")));
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 8000 }); await page.click(sel); await wait(300); };
const nowSay = (page) => page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");

test("① 8단계 — 가져갈 것 초안(배운 것을 보낸다) → 기준 다섯 · 고쳐 채택 · 반려는 까닭이 있어야 → 다 정했어요", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const j = { stage: 7, reason: "", criteria: Nav.criteriaFor(7, "Xpress").map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    const { page, seen } = await open(browser, { mode: "live", tier: "Xpress", topic: "동아리 앱", j, results: RESULTS });
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("가져갈 것을 정리해 볼까요"), { timeout: 10000 });
    assert.match(await nowSay(page), /배운 것 2개/);
    await click(page, ".mc.chat [data-act=carry-draft]");
    assert.deepEqual(seen.draft[0].lessons, [{ stage: 1, text: "칸을 먼저 채우니 빠진 기능이 보였다" }, { stage: 3, text: "예시 셋을 보고 고르니 빨랐다" }], "사람이 쓴 배운 것만 보낸다");
    let say = await nowSay(page);
    assert.match(say, /기준 다섯을 다 채웠어요/); assert.match(say, /못 채운 기준: 근거 단계가 둘 이상 · 왜\(무슨 일이 있었나\)/);
    // 첫째 — 고쳐서 채택
    await page.evaluate(() => { const el = document.querySelector('.mc.chat [data-act=carry-text][data-i="0"]'); el.value = "3단계 전에 화면 그림 하나"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await click(page, '.mc.chat [data-act=carry-adopt][data-i="0"]');
    assert.equal(seen.post[0].action, "adopt"); assert.equal(seen.post[0].item.text, "3단계 전에 화면 그림 하나", "고친 글로 채택"); assert.match(seen.post[0].id, /^c[0-9a-z]+$/, "초안마다 id — 두 번 눌러도 한 줄");
    // 둘째 — 못 채운 기준(왜 · 근거 단계)을 고쳐서 채택
    await page.type('.mc.chat [data-act=carry-why][data-i="1"]', "예시를 먼저 보니 빨랐다");
    await click(page, '.mc.chat [data-act=carry-from][data-i="1"][data-v="2"]');
    assert.ok(!(await nowSay(page)).includes("못 채운 기준"), "고치면 기준 다섯을 다 채운다");
    await click(page, '.mc.chat [data-act=carry-adopt][data-i="1"]');
    assert.deepEqual([seen.post[1].item.why, seen.post[1].item.from], ["예시를 먼저 보니 빨랐다", [2, 3]]);
    // 셋째 — 반려는 까닭이 있어야(지우지 않고 남긴다)
    await click(page, '.mc.chat [data-act=carry-reject][data-i="2"]');
    await click(page, '.mc.chat [data-act=carry-reject][data-i="2"]');
    assert.equal(seen.post.length, 2, "까닭 없이는 보내지 않는다");
    await page.type('.mc.chat [data-act=carry-reason][data-i="2"]', "이번 일에만 맞아요");
    await click(page, '.mc.chat [data-act=carry-reject][data-i="2"]');
    assert.deepEqual([seen.post[2].action, seen.post[2].reason], ["reject", "이번 일에만 맞아요"]);
    assert.match(await nowSay(page), /가져갈 것을 다 정했어요/);
    assert.equal((await saved(page)).carryDone, true, "다 정했다 — 다음에 열어도 다시 묻지 않는다");
    await click(page, ".mc.chat [data-act=carry-later]");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("② 새 프로젝트 — 지난 프로젝트에서 그 단계에 채택한 것 · 보류한 것 → 이번에 쓸 것 고르기 → carryUse(계획의 근거)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const carry = { items: [{ id: "ca", text: "불편을 숫자로 적는다", stage: 0, why: "불편이 막연했다", project: "club-app", from: [0, 1] }, { id: "cb", text: "누가 쓰는지 먼저 묻는다", stage: 0 }], held: [{ id: "ch", text: "보류한 것", stage: 0 }] };
    const { page, seen } = await open(browser, { mode: "live" }, { carry });
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("지난 프로젝트에서 가져온 것이 있어요"), { timeout: 10000 });
    assert.match(await nowSay(page), /왜: 불편이 막연했다 · club-app · 근거 1단계 · 2단계 문서/, "근거 단계 문서를 잇는다");
    await click(page, '.mc.chat [data-act=carry-use][data-i="1"]');   // 둘째는 이번엔 안 쓴다
    await click(page, '.mc.chat [data-act=carry-held-adopt][data-i="0"]');
    assert.deepEqual([seen.post[0].action, seen.post[0].id], ["adopt", "ch"], "보류한 것을 채택");
    await click(page, ".mc.chat [data-act=carry-use-done]");
    assert.deepEqual((await saved(page)).carryUse, { 0: [{ id: "ca", text: "불편을 숫자로 적는다" }] });
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("③ 남은 것은 보류하기 — 정하지 않은 초안을 보류로 남기고(지우지 않음), 다시 열어도 8단계 카드를 다시 띄우지 않는다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const j = { stage: 7, reason: "", criteria: Nav.criteriaFor(7, "Xpress").map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    const { page, seen } = await open(browser, { mode: "live", tier: "Xpress", topic: "동아리 앱", j, results: RESULTS });
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("가져갈 것을 정리해 볼까요"), { timeout: 10000 });
    await click(page, ".mc.chat [data-act=carry-draft]");
    await click(page, ".mc.chat [data-act=carry-hold-rest]");
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("가져갈 것을 다 정했어요"), { timeout: 5000 });
    assert.deepEqual(seen.post.map((p) => p.action), ["hold", "hold", "hold"], "미루면 보류(PRD 9절 2번)");
    assert.equal((await saved(page)).carryDone, true);
    await page.reload({ waitUntil: "load" }); await wait(3500);
    assert.ok(!(await nowSay(page)).includes("가져갈 것을 정리해 볼까요"), "다 정했으면 다시 묻지 않는다");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
