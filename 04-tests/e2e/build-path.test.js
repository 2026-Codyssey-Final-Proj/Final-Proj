// claude-drafted: 2026-10-28 — F-70 앱으로 결과물이 나오게(결정 모음 A-02 · A-04 · A-05): 5 · 6 · 7단계 퀘스트에서 Claude Code에 코드를 맡긴다.
// 실제 브라우저로 섬의 채팅을 눌러 본다. 서버는 이 시험 안에서 켜고 /api/task/start · /api/task · /api/files · /api/file은 가로채 정해 둔 답을 준다(AI · Claude Code를 부르지 않는다).
//   ⓑ 5단계 '뼈대 코드 맡기기' → 글에 단계 요약 · 끝 조건 셋 → 보고가 채팅에
//   A-04 6단계에 코드 파일이 없으면 '코드 파일을 만드시겠습니까?' — 아니요: 코드 없이 · 예: 실행할 코드를 맡김
//   ⓒ 6단계 '기능 줄 맡기기' → 3단계 기능 줄마다 → 그 줄 하나만 맡기고 보고가 다 '해냄'이면 '보고 옴'
//   ⓓ '돌려 보기' → 보고 근거의 결과 파일(파일 목록에 있는 것만) → 열기
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/build-path.test.js
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
if (skip) console.log(`⚠️ e2e/build-path: ${skip}`);
const SHOTS = process.env.FLOE_SHOTS || "";
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-build-e2e-"));
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

const N = require("../../03-backend/navigator/navigator.js");
const FEAT = "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기";
const res = (n, lines) => ({ chap: n, title: "국내 여행 추천", items: N.criteriaFor(n, "Xpress").map((c, i) => ({ name: c.text, lines: [lines[i] || `${n + 1}단계 ${i + 1}번 줄`] })), at: "2026-10-28", passed: "2026-10-28" });
const RESULTS = { 0: res(0, ["여행 날짜를 정해도 갈 곳을 고르기 어렵다"]), 1: res(1, ["날짜를 넣으면 여행 리포트 파일이 나온다"]),
  2: { ...res(2, []), items: N.criteriaFor(2, "Xpress").map((c, i) => ({ name: c.text, lines: [c.text === FEAT ? "날짜를 넣으면, 앱은 추천지를 고른다 / 추천지를 고르면, 앱은 리포트 파일을 만든다" : `3단계 ${i + 1}번 줄`] })) },
  3: res(3, ["파이썬 명령줄 프로그램 — 화면 없이 파일로"]) };
const FILE = (p, depth = 1, dir = false) => ({ name: p.split("/").pop(), path: p, dir, depth });
const DOCS = [FILE("README.md"), FILE("docs", 1, true), FILE("docs/02-plan/plan.md", 3)];
const rep = (items, easy) => ({ items: items.map(([check, done, evidence]) => ({ check, done, evidence })), easy, ask: "", done: items.filter((x) => x[1]).length, total: items.length });

// kind마다 끝났을 때의 보고와 그 뒤 파일 목록
async function openLive(browser, hash) {
  const page = await browser.newPage();
  const seen = { start: [], files: DOCS, task: 0, errors: [], opened: [] };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) seen.errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const u = new URL(req.url()), p = u.pathname;
    const json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/files") return json({ ok: true, project: "test-2", files: seen.files, total: seen.files.length, cut: false, unread: 0, depth: 3, max: 200, why: "" });
    if (p === "/api/file") { const i = Number(u.searchParams.get("i")), f = seen.files[i]; seen.opened.push(f && f.path); return json({ ok: true, i, name: f.name, path: f.path, kind: "md", text: "# 여행 리포트\n\n제주 — 11월 1일", size: 30, mtime: 1, changed: [], eol: "lf" }); }
    if (p === "/api/task/start") { seen.start.push(JSON.parse(req.postData() || "{}")); seen.task = 0; return json({ ok: true, project: "test-2", task: { state: "running", at: 700 + seen.start.length, try: 0 } }); }
    if (p === "/api/task") {
      seen.task += 1; const at = 700 + seen.start.length, last = seen.start.at(-1) || { text: "" };
      if (seen.task < 2) return json({ ok: true, task: { state: "running", at, try: 0 } });
      let report;
      if (/돌려 보기예요/.test(last.text)) { seen.files = [...DOCS, FILE("out", 1, true), FILE("out/report.md", 2), FILE("src", 1, true), FILE("src/app.py", 2)]; report = rep([["실행 명령을 돌렸다", true, "python src/app.py --date 2026-11-01"], ["결과가 나왔다", true, "out/report.md 가 생겼어요"], ["오류 없이 끝났다", true, "오류 없음"]], "프로그램을 돌려 리포트 파일을 만들었어요."); }
      else if (/기능: /.test(last.text)) report = rep(last.checks.map((c) => [c, true, "src/app.py · tests/test_report.py"]), "리포트 파일을 만드는 기능을 넣었어요.");
      else { seen.files = [...DOCS, FILE("src", 1, true), FILE("src/app.py", 2)]; report = rep(last.checks.map((c) => [c, true, "src/app.py · README.md"]), "가장 단순한 뼈대를 만들었어요."); }
      return json({ ok: true, task: { state: "done", code: 0, at, try: 0, report, blocked: null } });
    }
    return req.continue();
  });
  await page.evaluateOnNewDocument((seed) => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify(seed)); sessionStorage.setItem("seeded", "1"); } } catch {}
  }, { at: Date.now(), mode: "live", tier: "Xpress", topic: "국내 여행 추천", results: RESULTS });
  await page.goto(`http://127.0.0.1:${port}/${hash}`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  await wait(500);
  return { page, seen };
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 6000 }); await page.click(sel); await wait(300); };
const nowSay = (page) => page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");
const chatText = (page) => page.evaluate(() => document.querySelector(".mc.chat .log")?.textContent || "");
async function openIsland(page) { if (await page.$(".pill")) { await page.click(".pill"); await wait(400); } }

test("ⓑ 5단계 '뼈대 코드 맡기기' — 단계 요약 · 끝 조건 셋으로 맡기고, 보고가 채팅에", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, "#ex=4&q=quest");
    await openIsland(page);
    await click(page, ".mc.chat [data-act=build-skeleton]");
    assert.equal(seen.start.length, 1);
    const s = seen.start[0];
    assert.match(s.text, /5단계/); assert.match(s.text, /'국내 여행 추천'/); assert.match(s.text, /여행 리포트 파일이 나온다/, "단계 요약"); assert.match(s.text, /지어내지/);
    assert.equal(s.checks.length, 3); assert.match(s.checks[0], /실행 명령/);
    await page.waitForFunction(() => document.querySelector(".mc.chat .log")?.textContent.includes("끝 조건 3/3"), { timeout: 12000 });
    assert.match(await chatText(page), /가장 단순한 뼈대를 만들었어요/);
    if (SHOTS) await shot(page, "build-skeleton");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("A-04 6단계에 코드 파일이 없으면 묻는다 — 아니요: 코드 없이 · ⓒ 기능 줄마다 맡기기 · ⓓ 돌려 보기 → 결과 파일 열기", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, "#ex=5&q=quest");
    await openIsland(page);
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("코드 파일을 만드시겠습니까?"), { timeout: 8000 });
    assert.ok(await page.$(".mc.chat [data-act=code-yes]") && await page.$(".mc.chat [data-act=code-no]"), "예 · 아니요");
    if (SHOTS) await shot(page, "code-ask");
    await click(page, ".mc.chat [data-act=code-no]");
    assert.doesNotMatch(await nowSay(page), /코드 파일을 만드시겠습니까/, "아니요 — 코드 없이 이 단계를 한다");
    assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).codeless)), "다시 켜도 묻지 않게 남긴다");
    // ⓒ 기능 줄마다
    await click(page, ".mc.chat [data-act=line-open]");
    const lines = await page.$$eval(".msg.now .lines-pick li span", (ls) => ls.map((l) => l.textContent));
    assert.deepEqual(lines, ["날짜를 넣으면, 앱은 추천지를 고른다", "추천지를 고르면, 앱은 리포트 파일을 만든다"]);
    await click(page, '.msg.now [data-act=line-go][data-i="1"]');
    assert.match(seen.start.at(-1).text, /기능: 추천지를 고르면, 앱은 리포트 파일을 만든다/);
    assert.doesNotMatch(seen.start.at(-1).text, /기능: 날짜를 넣으면/, "그 줄 하나만");
    await page.waitForFunction(() => document.querySelector(".mc.chat .log")?.textContent.includes("리포트 파일을 만드는 기능을 넣었어요"), { timeout: 12000 });
    await click(page, ".mc.chat [data-act=line-open]");
    assert.deepEqual(await page.$$eval(".msg.now .lines-pick li", (ls) => ls.map((l) => l.className)), ["", "y"], "보고가 다 '해냄'인 줄은 보고 옴");
    if (SHOTS) await shot(page, "line-pick");
    await click(page, ".mc.chat [data-act=line-x]");
    // ⓓ 돌려 보기 → 결과 파일
    await click(page, ".mc.chat [data-act=run-go]");
    assert.match(seen.start.at(-1).text, /돌려 보기예요/);
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("결과가 나왔어요"), { timeout: 12000 });
    assert.deepEqual(await page.$$eval(".msg.now .run-out code", (cs) => cs.map((c) => c.textContent)), ["out/report.md", "src/app.py"], "결과물이 먼저, 목록에 있는 것만");
    if (SHOTS) await shot(page, "run-out");
    await click(page, ".mc.chat [data-act=result-open]");
    await wait(500);
    assert.equal(seen.opened.at(-1), "out/report.md", "결과 파일을 연다(목록의 번호로)");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("A-04 예 — 실행할 수 있는 코드를 맡긴다('코드 파일이 없어요'로 시작하는 글), 코드가 생기면 물음이 사라진다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, "#ex=5&q=quest");
    await openIsland(page);
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("코드 파일을 만드시겠습니까?"), { timeout: 8000 });
    await click(page, ".mc.chat [data-act=code-yes]");
    assert.match(seen.start.at(-1).text, /코드 파일이 없어요/); assert.equal(seen.start.at(-1).checks.length, 3);
    await page.waitForFunction(() => document.querySelector(".mc.chat .log")?.textContent.includes("끝 조건 3/3"), { timeout: 12000 });
    await wait(500);
    assert.doesNotMatch(await nowSay(page), /코드 파일을 만드시겠습니까/, "코드 파일이 생기면 묻지 않는다");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("A-04 '아니요'는 그 프로젝트에서만 — 처음부터 다시 시작하면 6단계에서 다시 묻는다(새 맥락 리뷰 2026-10-28 막힘 2)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, "#ex=5&q=quest");
    await openIsland(page);
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("코드 파일을 만드시겠습니까?"), { timeout: 8000 });
    await click(page, ".mc.chat [data-act=code-no]");
    assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).codeless));
    await page.goto(`http://127.0.0.1:${port}/#start`, { waitUntil: "load" }); await wait(600);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).codeless), null, "새로 시작하면 지운다");
    await page.goto(`http://127.0.0.1:${port}/#ex=5&q=quest`, { waitUntil: "load" }); await wait(600);
    await openIsland(page);
    await page.waitForFunction(() => document.querySelector(".msg.now")?.textContent.includes("코드 파일을 만드시겠습니까?"), { timeout: 8000 });
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
