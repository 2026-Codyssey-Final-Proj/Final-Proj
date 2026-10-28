// claude-drafted: 2026-10-29 — 지식 퀘스트 C-49(PRD 6절 · 9절 3 · 4번): 기록의 원본은 프로젝트 폴더. 실제 브라우저로 섬의 채팅을 본다.
//   서버는 이 시험 안에서 켜고 /api/events(폴더 이름) · /api/docs(폴더의 단계 문서) · AI 주소는 가로채 정해 둔 답을 준다(AI를 부르지 않는다).
//   ① 이 브라우저에 기록이 없으면 '되살릴까요?' → 되살리기 → 기록 · 지문 · 다음 단계부터
//   ② Floe가 쓴 뒤 손으로 고친 문서(지문이 다름) → '다시 읽어 올까요?' → 다시 읽기 → 기록이 폴더의 글로, 기획서 · 결정 기록을 고쳐 쓸지(올리기 카드)
//   ③ 없어진 문서 → '근거 없음'(기록은 지우지 않는다)
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/knowledge-restore.test.js
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
if (skip) console.log(`⚠️ e2e/knowledge-restore: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-restore-e2e-"));
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

const D = require("../../03-backend/navigator/docs.js");
const Nav = require("../../03-backend/navigator/navigator.js");
const it = (name, lines, by = "ok") => ({ name, lines, by });
const R0 = { title: "동아리 앱", at: "2026-10-28", passed: "2026-10-28", learned: "", items: Nav.STAGES[0].criteria.map((c, i) => it(c.text, [i === 3 ? "크기: 보통 — 기능 몇 개" : `${c.text} 줄`])) };
const R1 = { title: "동아리 앱", at: "2026-10-29", passed: "2026-10-29", learned: "칸을 먼저 채웠다", items: Nav.criteriaFor(1, "Xpress").map((c) => it(c.text, [`${c.text} 정함`])) };
const IDEA = "신청을 한곳에 모으고 싶어요";
const files = (results) => D.files({ topic: "동아리 앱", idea: IDEA, results, redact: (x) => x });
const stagesOf = (results, prints = {}) => Object.fromEntries(Object.keys(results).map((n) => { const p = D.stagePath(Number(n)), t = files(results).find((f) => f.path === p).text; return [n, { path: p, print: prints[n] || `print-${n}`, result: D.parseStage(t).result, lossless: true }]; }));

async function open(browser, seedState, docs) {
  const page = await browser.newPage(); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname, json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/events") return json({ ok: true, latest: 0, project: "club-app", events: [] });
    if (p === "/api/docs" && req.method() === "GET") return json({ ok: true, project: "club-app", topic: "동아리 앱", idea: IDEA, source: "", stages: docs });
    if (["/api/stagedraft", "/api/quest", "/api/prepare"].includes(p)) return json({ ok: false, reason: "시험 — AI 없음" });
    return req.continue();
  });
  await page.evaluateOnNewDocument((s) => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); } } catch {} }, seedState);
  await page.goto(`http://127.0.0.1:${port}/#base`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  return { page, errors };
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")));
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 8000 }); await page.click(sel); await wait(300); };

test("① 브라우저에 기록이 없으면 폴더의 단계 문서로 되살린다 — 기록 · 지문 · 크기 · 다음 단계부터", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, errors } = await open(browser, { mode: "live" }, stagesOf({ 0: R0, 1: R1 }));
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("작업 폴더에 남은 기록이 있어요"), { timeout: 10000 });
    assert.match(await page.evaluate(() => document.querySelector(".msg.now").textContent), /1단계 · 2단계 기록을 찾았어요.*3단계부터 이어서/);
    await click(page, ".mc.chat [data-act=restore-go]");
    const s = await saved(page);
    assert.deepEqual(Object.keys(s.results).sort(), ["0", "1"]);
    assert.equal(s.results["1"].learned, "칸을 먼저 채웠다", "배운 것도 되살아난다");
    assert.deepEqual(s.results["0"].items.map((x) => x.lines[0]), R0.items.map((x) => x.lines[0]));
    assert.deepEqual(s.docPrints, { project: "club-app", seen: { 0: "print-0", 1: "print-1" }, wrote: { 0: "print-0", 1: "print-1" }, dirty: false }, "지문을 기억한다(다시 써도 같은 글이라 Floe가 덮어도 된다)");
    assert.equal(s.j.stage, 2, "3단계부터"); assert.equal(s.tier, "Xpress", "1단계 크기 '크기: 보통' → 등급"); assert.equal(s.topic, "동아리 앱");
    assert.equal(s.idea, IDEA, "처음 말한 것도 되살린다 — 다음 올리기에서 기획서의 처음 말이 지워지지 않게");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("④ 다른 폴더의 지문이면 견주지 않는다 — 같은 경로라도 '근거 없음' · '낡음'을 붙이지 않는다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const seed = { mode: "live", tier: "Xpress", topic: "동아리 앱", results: { 0: { chap: 0, ...R0 }, 1: { chap: 1, ...R1 } }, docPrints: { project: "other-app", wrote: { 0: "x", 1: "y" }, seen: { 0: "x", 1: "y" } } };
    const { page, errors } = await open(browser, seed, {});
    await wait(3500);
    const s = await saved(page);
    assert.ok(!s.results["0"].nosrc && !s.results["1"].nosrc, "근거 없음을 붙이지 않는다");
    assert.ok(!(await page.evaluate(() => document.querySelector(".msg.now")?.textContent || "")).includes("폴더"), "폴더의 기록 카드가 뜨지 않는다");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("② 손으로 고친 문서(지문이 다름)는 '낡음' — 다시 읽기 → 기록이 폴더의 글로, 기획서 · 결정 기록을 같은 파일에 고쳐 쓸지 묻는다 · ③ 없어진 문서는 '근거 없음'(지우지 않음)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const edited = { ...R1, items: R1.items.map((x, i) => (i === 0 ? { ...x, lines: ["손으로 고친 줄"] } : x)) };
    const R2 = { title: "동아리 앱", at: "2026-10-29", items: Nav.criteriaFor(2, "Xpress").map((c) => it(c.text, ["셋째"])) };
    const seed = { mode: "live", tier: "Xpress", topic: "동아리 앱", results: { 0: { chap: 0, ...R0 }, 1: { chap: 1, ...R1 }, 2: { chap: 2, ...R2 } },
      docPrints: { project: "club-app", wrote: { 0: "print-0", 1: "old-1", 2: "print-2" }, seen: { 0: "print-0", 1: "old-1", 2: "print-2" } } };
    const { page, errors } = await open(browser, seed, stagesOf({ 0: R0, 1: edited }));   // 3단계 문서는 폴더에 없다
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("다시 읽어 올까요"), { timeout: 10000 });
    const say = await page.evaluate(() => document.querySelector(".msg.now").textContent);
    assert.match(say, /2단계 문서를 폴더에서 고쳤어요/); assert.match(say, /3단계 문서가 폴더에 없어요 — 기록은 지우지 않고 '근거 없음'/);
    let s = await saved(page);
    assert.equal(s.results["2"].nosrc, true, "근거 없음 표시"); assert.deepEqual(s.results["2"].items.map((x) => x.lines), R2.items.map((x) => x.lines), "기록은 그대로");
    await click(page, ".mc.chat [data-act=restore-read]");
    s = await saved(page);
    assert.deepEqual(s.results["1"].items[0].lines, ["손으로 고친 줄"], "폴더의 글로");
    assert.equal(s.docPrints.seen[1], "print-1", "새 지문"); assert.equal(s.docPrints.wrote[1], "print-1", "다시 써도 같은 글이면 Floe가 덮어도 된다"); assert.equal(s.docPrints.dirty, true, "기획서 · 결정 기록을 아직 고쳐 쓰지 않았다");
    assert.match(await page.evaluate(() => document.querySelector(".msg.now")?.textContent || ""), /문서로 묶었어요 — 내 GitHub에 올릴까요/, "같은 파일을 고쳐 쓸지");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
