// claude-drafted: 2026-10-25 — C-36 처음 한 바퀴(이재엽 "원하는 내용을 플로로에게 받는걸로 … 초안을 백엔드로 제작 … 불편한게 맞는 내용은 이게 플로로가 생각한 내용인데 맞나요 …
//   누가 쓰는 내용은 … 사람에 대한 내용이 있으면 이 내용이 맞는지 … 없다면 본인 / 소수 / 불특정다수 … 얼마 크게도 … 짧음 / 보통 / 긺" · 버튼 "1단계는 확인만 → 관문 → 2단계" · "규모 판단표").
// 실제 브라우저로: 채팅에 원하는 것(긴 글)을 붙여 넣기 → /api/start(가로채 정해 둔 초안) → 제목이 주제인 1단계 → 맞아요 · 고칠래요 · 누가 고르기 · 크기 고르기 → 저절로 완료 보고(/api/judge 가로챔).
// 연습(서버 없이)은 예시 초안. 초안을 못 받으면 전처럼 한 줄씩. puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/start-flow.test.js
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
if (skip) console.log(`⚠️ e2e/start-flow: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-start-e2e-"));
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

const Nav = require("../../03-backend/navigator/navigator.js");
const DRAFT = { topic: "독서 모임 알림 앱", pain: "모임 날짜를 자꾸 잊어버려요", change: "모임 전날 알림이 와요", who: "", size: "long", sizeWhy: "알림과 사람 목록, 저장이 필요해요" };
const LONG = `${"독서 모임을 매달 해요. ".repeat(18)}모임 전날 알림을 받고 싶어요. 누가 오는지도 보고 싶어요.`;
const judged = (tier) => ({ stage: 0, reason: "1단계 할 일을 다 했어요", criteria: Nav.criteriaFor(0, tier).map((c) => ({ text: c.text, term: c.term, met: true, evidence: `${c.text}: 적음` })),
  next: { what: "다음", why: "다 했어요", question: "다음은 무엇부터 할까요?", action: "고르면 적어 둬요", options: ["가", "나"] } });

async function openLive(browser, startReply, { judgeFails = 0 } = {}) {
  const page = await browser.newPage();
  const seen = { start: [], judge: [], errors: [] };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) seen.errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    const json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/start") { seen.start.push(JSON.parse(req.postData() || "{}")); return json(startReply); }
    if (p === "/api/judge") { const b = JSON.parse(req.postData() || "{}"); seen.judge.push(b); return json(seen.judge.length <= judgeFails ? { ok: false, reason: "AI에 연결하지 못했어요" } : { ok: true, judgement: judged(b.tier), tokens: 500 }); }
    if (p === "/api/quest") return json({ ok: false, reason: "시험에서는 기본 글" });
    return req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live" })); sessionStorage.setItem("seeded", "1"); } } catch {}
  });
  await page.goto(`http://127.0.0.1:${port}/#start`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  return { page, seen };
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 5000 }); await page.click(sel); await wait(300); };
const nowSay = (page) => page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");
async function paste(page, text) {
  await page.click(".mc.chat [data-act=say]");
  await page.evaluate((t) => { const el = document.querySelector(".mc.chat [data-act=say]"); el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, text);
  await page.keyboard.press("Enter"); await wait(500);
}
const lines = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).quest.lines.flat());   // 완료 보고 뒤에는 퀘스트 창이 '보고했어요'라 저장한 줄로 본다

test("진짜 AI(가로챔): 긴 글을 통째로 한 번 보내 초안 → 제목이 주제 · 맞나요 둘 → 글에 사람이 없으면 본인 · 소수 · 불특정다수 → 크기는 플로로가 본 것을 알리고 고른다 → 저절로 완료 보고 · 넘어가기 전 확인", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, { ok: true, start: DRAFT, tokens: 900 });
    assert.match(await nowSay(page), /원하는 것을 플로로에게/);
    assert.doesNotMatch(await nowSay(page), /한 줄/, "한 줄로 적으라고 하지 않는다");
    await paste(page, LONG);
    assert.deepEqual(seen.start, [{ text: LONG }], "받은 글 전체를 한 번에(잘라 보내지 않는다)");
    assert.match(await page.evaluate(() => [...document.querySelectorAll(".msg.me")].pop()?.textContent || ""), /… \(글 [\d,]+자\)/, "긴 글은 내 말에 앞부분만");
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /1단계 · 독서 모임 알림 앱/, "제목은 주제");
    assert.match(await nowSay(page), /플로로가 생각한 내용인데 맞나요\?/); assert.match(await nowSay(page), /모임 날짜를 자꾸 잊어버려요/);
    await click(page, ".mc.chat [data-act=draft-ok]");
    assert.match(await nowSay(page), /모임 전날 알림이 와요/, "Ⅱ 달라지는 것도 맞나요");
    await click(page, ".mc.chat [data-act=draft-ok]");
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".mc.chat [data-act=draft-who]")].map((b) => b.textContent.replace(/^\d/, "").trim())), ["본인", "소수", "불특정다수"], "글에 사람이 없으면 고르기");
    await click(page, '.mc.chat [data-act=draft-who][data-i="1"]');
    assert.match(await nowSay(page), /플로로는 '긺'으로 봤어요/); assert.match(await nowSay(page), /알림과 사람 목록, 저장이 필요해요/);
    assert.equal(await page.$eval('.mc.chat [data-act=draft-size][data-i="2"]', (e) => e.classList.contains("pri")), true, "플로로가 본 크기가 눈에 띈다");
    await click(page, '.mc.chat [data-act=draft-size][data-i="1"]');
    await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
    assert.equal(seen.judge.length, 1, "넷 다 확인하면 저절로 완료 보고(판정은 서버 그대로)");
    assert.equal(seen.judge[0].tier, "Xpress", "보통 = Xpress — 만드는 크기도 바뀐다");
    assert.match(seen.judge[0].text, /쓰는 사람: 소수/);
    assert.deepEqual(await lines(page), [DRAFT.pain, DRAFT.change, "쓰는 사람: 소수 — 아는 몇 사람이 써요", "크기: 보통"]);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")));
    assert.equal(saved.topic, "독서 모임 알림 앱"); assert.equal(saved.tier, "Xpress");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("고칠래요 · 다르게 적기: 채팅 칸에 적으면 그 줄이 된다 — 글에 사람이 있으면 '맞나요'(고르기 칩 없이)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, { ok: true, start: { ...DRAFT, who: "독서 모임 회원 열두 명", size: "short" }, tokens: 900 });
    await paste(page, "독서 모임 알림 앱");
    await click(page, ".mc.chat [data-act=draft-fix]");
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.dataset.act), "say", "고칠래요 — 채팅 칸으로");
    await paste(page, "모임 날짜를 단톡방에서 놓쳐요");
    await click(page, ".mc.chat [data-act=draft-ok]");
    assert.match(await nowSay(page), /독서 모임 회원 열두 명/); assert.match(await nowSay(page), /맞나요/);
    assert.equal(await page.$(".mc.chat [data-act=draft-who]"), null, "사람이 있으면 고르기 칩 없이 맞나요");
    await click(page, ".mc.chat [data-act=draft-ok]");
    assert.match(await nowSay(page), /플로로는 '짧음'으로 봤어요/);
    await click(page, '.mc.chat [data-act=draft-size][data-i="0"]');
    await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
    assert.deepEqual(await lines(page), ["모임 날짜를 단톡방에서 놓쳐요", DRAFT.change, "독서 모임 회원 열두 명", `크기: 짧음 — ${DRAFT.sizeWhy}`]);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("초안을 못 받으면: 까닭을 말하고 전처럼 1단계를 한 줄씩(받은 글이 첫 말)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, { ok: false, reason: "AI에 연결하지 못했어요" });
    await paste(page, "독서 모임 알림 앱을 만들고 싶어요");
    assert.match(await page.evaluate(() => document.querySelector(".mc.chat .log")?.textContent || ""), /AI에 연결하지 못했어요/);
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /1단계 · 무엇을 만들지 정하기/, "제목은 단계 이름 그대로");
    assert.match(await nowSay(page), /한 줄이면 돼요/, "한 줄씩 묻기로");
    assert.equal(await page.$(".mc.chat [data-act=draft-ok]"), null);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("연습(서버 없이 · 파일로 연 화면): 예시 초안 — '예시예요'가 보이고 AI를 부르지 않는다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    await page.goto(`${pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href}#start`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    await paste(page, "아무 앱");
    assert.match(await nowSay(page), /예시예요/);
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /동아리 행사 신청 앱/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ── 새 맥락 리뷰(2026-10-25) 뒤에 더한 것 ──
test("저절로 한 완료 보고가 실패해도 갇히지 않는다 — 오류를 닫으면 '완료 보고' 칩이 다시 있고, 누르면 이어진다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, { ok: true, start: DRAFT, tokens: 900 }, { judgeFails: 1 });
    await paste(page, "독서 모임 알림 앱");
    await click(page, ".mc.chat [data-act=draft-ok]"); await click(page, ".mc.chat [data-act=draft-ok]");
    await click(page, '.mc.chat [data-act=draft-who][data-i="0"]');
    await click(page, '.mc.chat [data-act=draft-size][data-i="2"]');
    await page.waitForSelector(".mc.chat [data-act=dismiss]", { timeout: 5000 });
    await click(page, ".mc.chat [data-act=dismiss]");
    assert.match(await nowSay(page), /완료 보고할까요/, "처음 화면으로 돌아가지 않는다");
    await click(page, ".mc.chat [data-act=quest-report]");
    await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
    assert.equal(seen.judge.length, 2);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("보내기 전 확인: 받은 글에 전화번호처럼 보이는 게 있으면 묻고, '괜찮아요, 보낼게요'면 그 글 그대로 초안을 받는다 · Ⅳ 크기를 글로 답해도 셋 중 하나로 맞춘다 · 설정에서 크기를 바꿔도 1단계 줄은 남는다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, { ok: true, start: DRAFT, tokens: 900 });
    const text = "독서 모임 알림 앱 — 모임장 연락처 010-1234-5678";
    await paste(page, text);
    assert.equal(seen.start.length, 0, "묻기 전에는 보내지 않는다");
    await click(page, ".mc.chat [data-act=send-anyway]");
    assert.deepEqual(seen.start, [{ text }], "괜찮다고 하면 그 글 그대로");
    await click(page, ".mc.chat [data-act=draft-ok]");
    const tap = (sel) => page.evaluate((q) => document.querySelector(q).click(), sel);   // 다시 그려지는 사이에 잡은 요소가 떨어지지 않게 그 자리에서 누른다
    await tap(".tb [data-act=settings]"); await wait(400);
    await tap("[data-act=set-tab][data-tab=view]"); await wait(200);   // 설정 판의 보기 탭(2026-10-25 F-56)
    await tap('input[data-act=tier][value="Lite"]'); await wait(400);
    await tap(".tb [data-act=settings]"); await wait(400);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).quest.lines[0]), [DRAFT.pain], "1단계는 크기와 상관없이 넷 — 적은 줄 · 제목을 둔다");
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /독서 모임 알림 앱/);
    await click(page, ".mc.chat [data-act=draft-ok]");
    await click(page, '.mc.chat [data-act=draft-who][data-i="2"]');
    await paste(page, "음… 보통으로 할래요");
    // 완료 보고 글에는 받은 글(처음 말한 것)이 같이 가서 전화번호를 한 번 더 묻는다 — 보낼 때마다 묻는 규칙 그대로
    await click(page, ".mc.chat [data-act=send-anyway]");
    await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
    assert.equal(seen.judge[0].tier, "Xpress", "글로 답한 '보통'도 만드는 크기가 된다");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
