// claude-drafted: 2026-10-24 — C-34 준비 계획판 · C-32 맡길 일과 보고(이재엽 "한번에 내용들을 넣으면 … 기준들을 사람들이 확인해서 너한테 의견들을 바로바로").
// 같은 날 C-35(이재엽 "맡기기의 기능은 … 우리 오버레이에서 확인이 가능하게 … 순차적으로 할려면 퀘스트내용에서 진행" · 버튼 "맡길 일 퀘스트 하나로" · "채팅에서 전부"):
// 계획판 대신 섬의 채팅에서 실제 브라우저로 눌러 본다: 채팅 칸에 한 번에 붙여 넣기 → 계획 세우기 → 플로로의 말 안에서 줄마다 맞아요 / 고칠래요 · 의견 → 다시 세우기 → 확정
// → 퀘스트 창에 '맡길 일' 퀘스트(순서대로) → 채팅에서 지금 줄 맡기기(기준과 함께) → 보고가 채팅에 → 맞아요(끝냄) → 다음 줄.
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
  items: [{ id: "p1", need: "회원이 신청 단추를 누르면, 앱은 신청을 받는다", check: "신청 단추를 누르면 목록에 한 줄이 생긴다" }, { id: "p2", need: "운영진이 목록을 보면, 앱은 신청한 사람을 보여 준다", check: "목록 화면에 이름이 보인다" }],
  prep: ["신청 받을 칸 정하기"], ask: ["마감이 있나요?"], say: "계획을 세웠어요. 줄마다 봐 주세요." };
const PLAN2 = { ...PLAN, items: [PLAN.items[0], { id: "p2", need: "운영진이 목록을 보면, 앱은 이름과 연락처를 보여 준다", check: "목록 화면에 이름과 연락처가 보인다" }], ask: [], say: "의견대로 고쳤어요." };
const REPORT = { items: [{ check: PLAN.items[0].check, done: true, evidence: "form.html에 신청 칸을 만들었어요" }], easy: "신청하는 종이를 화면으로 만들었어요.", ask: "", done: 1, total: 1 };

async function openLive(browser, hash = "#base&plan") {
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
    if (p === "/api/task/start") { seen.start.push(JSON.parse(req.postData() || "{}")); seen.taskCalls = 0; return json({ ok: true, project: "test-1", task: { state: "running", at: 100 + seen.start.length } }); }
    if (p === "/api/task") { seen.taskCalls += 1; const at = 100 + seen.start.length; return json({ ok: true, task: seen.taskCalls < 2 ? { state: "running", at } : { state: "done", code: 0, at, report: seen.report || REPORT } }); }
    if (p === "/api/answer") { seen.answer = JSON.parse(req.postData() || "{}"); return json({ ok: true, answer: "목록은 list.html에서 봐요.", tokens: 300 }); }
    return req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live" })); sessionStorage.setItem("seeded", "1"); } } catch {}
  });
  await page.goto(`http://127.0.0.1:${port}/${hash}`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  return { page, seen };
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 5000 }); await page.click(sel); await wait(250); };
const nowSay = (page) => page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");
// 채팅 칸에 붙여 넣고 보내기(Enter)
async function paste(page, text) {
  await page.click(".mc.chat [data-act=say]");
  await page.evaluate((t) => { const el = document.querySelector(".mc.chat [data-act=say]"); el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, text);
  await page.keyboard.press("Enter"); await wait(250);
}
// 계획을 세우고 줄마다 맞아요 → 확정
async function confirmAll(page, ids) {
  await page.waitForSelector(".msg.now .pl-items", { timeout: 5000 });
  for (const id of ids) await click(page, `.msg.now [data-act=plan-ok][data-id="${id}"]`);
  await click(page, ".mc.chat [data-act=plan-confirm]");
}

test("채팅에서 한 바퀴: 붙여 넣기 → 계획 → 줄마다 맞아요 / 고칠래요 · 답 → 다시 세우기(의견이 서버로) → 확정 → 맡길 일 퀘스트(순서대로) → 맡기기(기준과 함께) → 보고 → 맞아요 → 다음 줄", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    assert.match(await nowSay(page), /한 번에/, "채팅의 지금 말이 한 번에 넣기");
    assert.ok(!(await page.$(".mc.chat [data-act=plan-make]")), "넣은 글이 없으면 세우기 칩이 없다");
    await paste(page, "동아리 행사 신청 앱 — 회원이 신청하고 운영진이 목록을 봐요");
    assert.match(await page.evaluate(() => [...document.querySelectorAll(".msg.me")].pop()?.textContent || ""), /동아리 행사 신청 앱/, "붙여 넣은 글은 내 말로");
    await click(page, ".mc.chat [data-act=plan-make]");
    await page.waitForSelector(".msg.now .pl-items", { timeout: 5000 });
    assert.deepEqual(seen.plan, [{ text: "동아리 행사 신청 앱 — 회원이 신청하고 운영진이 목록을 봐요", readme: true }]);
    assert.match(await page.$eval(".msg.now .pl-sum", (e) => e.textContent), /행사 신청을 종이로 받아 헷갈려요/);
    assert.equal(await page.$eval(".mc.chat [data-act=plan-confirm]", (e) => e.disabled), true, "아직 안 본 줄이 있으면 확정이 잠긴다");
    await click(page, '.msg.now [data-act=plan-ok][data-id="p1"]');
    await click(page, '.msg.now [data-act=plan-fix][data-id="p2"]');
    await page.type('.msg.now [data-act=plan-note][data-id="p2"]', "연락처도 보여 줘요");
    await page.type('.msg.now [data-act=plan-answer][data-i="0"]', "금요일 6시");
    assert.equal(await page.$eval(".mc.chat [data-act=plan-again]", (e) => e.disabled), false, "의견이 생기면 다시 세우기가 켜진다");
    await click(page, ".mc.chat [data-act=plan-again]");
    await page.waitForFunction(() => document.querySelector(".msg.now .pl-items")?.textContent.includes("연락처가 보인다"), { timeout: 5000 });
    assert.deepEqual(seen.plan[1].notes, [{ need: PLAN.items[1].need, check: PLAN.items[1].check, note: "연락처도 보여 줘요" }]);
    assert.deepEqual(seen.plan[1].answers, [{ q: "마감이 있나요?", a: "금요일 6시" }]);
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /2판/, "위 줄에 판 번호");
    assert.equal(await page.$eval('.msg.now [data-act=plan-ok][data-id="p1"]', (e) => e.getAttribute("aria-pressed")), "true", "바뀌지 않은 줄의 맞아요는 그대로");
    await click(page, '.msg.now [data-act=plan-ok][data-id="p2"]');
    await click(page, ".mc.chat [data-act=plan-confirm]");
    // 확정 → 퀘스트 창에 '맡길 일' 퀘스트 · 채팅은 지금 줄(Ⅰ)
    await page.waitForSelector(".qwin .qsel [data-v=plan][aria-pressed=true]", { timeout: 5000 });
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".qwin .toc button")].map((b) => b.querySelector("small")?.textContent)), ["지금", "★ 아직"], "순서대로 — 지금 줄만 열린다");
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /맡길 일/);
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /2개 중 1번째/);
    assert.match(await nowSay(page), /회원이 신청 단추를 누르면/);
    await click(page, ".mc.chat [data-act=plan-hand]");
    assert.deepEqual(seen.start, [{ text: PLAN.items[0].need, checks: [PLAN.items[0].check] }], "기준을 같이 넘긴다");
    assert.match(await nowSay(page), /일하고 있어요/, "맡김 중 — 채팅에서 기다린다");
    await page.waitForSelector(".msg.now .pl-rep", { timeout: 15000 });   // 3초마다 묻는다 — 두 번째에 보고
    assert.match(await page.$eval(".msg.now .pl-rep", (e) => e.textContent), /form\.html에 신청 칸을 만들었어요/);
    assert.match(await nowSay(page), /신청하는 종이를 화면으로 만들었어요/, "쉬운 말 요약이 플로로의 말");
    await click(page, ".mc.chat [data-act=plan-accept]");
    assert.match(await nowSay(page), /운영진이 목록을 보면/, "맞아요 → 다음 줄이 지금 줄");
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".qwin .toc button")].map((b) => b.querySelector("small")?.textContent)), ["끝냄 ✓", "지금"]);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")));
    assert.equal(saved.plan.work.p1.state, "done", "판은 이 컴퓨터에 남는다(다시 켜도 이어진다)");
    assert.equal(saved.qfocus, "plan", "지금 할 퀘스트도");
    // 단계 퀘스트로 돌아갔다가 퀘스트 창에서 다시 맡길 일로
    await click(page, ".qwin .qsel [data-v=stage]");
    assert.doesNotMatch(await nowSay(page), /운영진이 목록을 보면/, "단계 퀘스트를 고르면 채팅도 그쪽");
    await click(page, ".qwin .qsel [data-v=plan]");
    assert.match(await nowSay(page), /운영진이 목록을 보면/);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("다르게 봐요: 채팅에서 의견을 달면 그 의견을 붙여 같은 줄을 다시 맡긴다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    await paste(page, "동아리 행사 신청 앱");
    await click(page, ".mc.chat [data-act=plan-make]");
    await confirmAll(page, ["p1", "p2"]);
    await click(page, ".mc.chat [data-act=plan-hand]");
    await page.waitForSelector(".mc.chat [data-act=plan-rej-open]", { timeout: 15000 });
    await click(page, ".mc.chat [data-act=plan-rej-open]");
    await page.type(".msg.now [data-act=plan-rej-note]", "목록에 아직 안 생겨요");
    await click(page, ".mc.chat [data-act=plan-reject]");
    assert.equal(seen.start.length, 2);
    assert.match(seen.start[1].text, /지난번에 사용자가 다르게 본 점: 목록에 아직 안 생겨요/);
    assert.equal(seen.start[1].checks[0], PLAN.items[0].check, "같은 줄(순서대로)");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("연습(서버 없이 · 파일로 연 화면): 예시 계획과 예시 보고 — AI를 부르지 않는다, 옛 주소 &pane=plan도 채팅으로", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    await page.goto(`${pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href}#base&pane=plan`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    assert.ok(!(await page.$(".mc.base.plan")), "계획판(판)은 없다");
    await paste(page, "아무 앱");
    await click(page, ".mc.chat [data-act=plan-make]");
    await page.waitForSelector(".msg.now .pl-items", { timeout: 5000 });
    assert.match(await page.$eval(".msg.now", (e) => e.textContent), /예시예요/);
    await confirmAll(page, ["p1", "p2", "p3"]);
    await click(page, ".mc.chat [data-act=plan-hand]");
    await page.waitForSelector(".msg.now .pl-rep", { timeout: 4000 });
    assert.match(await page.$eval(".msg.now .pl-rep", (e) => e.textContent), /예시/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("보고에서 물어보기(플로로에게 — /api/answer, 보고 글만) · Claude Code가 물은 것에 답하고 이어서 맡기기(그 질문과 답을 붙여서)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    seen.report = { ...REPORT, ask: "목록은 운영진만 보나요?" };
    await paste(page, "동아리 행사 신청 앱");
    await click(page, ".mc.chat [data-act=plan-make]");
    await confirmAll(page, ["p1", "p2"]);
    await click(page, ".mc.chat [data-act=plan-hand]");
    await page.waitForSelector(".mc.chat [data-act=plan-ask-open]", { timeout: 15000 });
    assert.match(await page.$eval(".msg.now .pl-rep", (e) => e.textContent), /Claude Code가 물어요: 목록은 운영진만 보나요\?/);
    await click(page, ".mc.chat [data-act=plan-ask-open]");
    await page.type(".msg.now [data-act=plan-q]", "목록은 어디서 봐요?");
    await click(page, ".mc.chat [data-act=plan-ask-send]");
    await page.waitForSelector(".msg.now .pl-ans", { timeout: 5000 });
    assert.match(await page.$eval(".msg.now .pl-ans", (e) => e.textContent), /list\.html/);
    assert.equal(seen.answer.question, "목록은 어디서 봐요?");
    assert.match(seen.answer.text, /Claude Code의 보고: 신청하는 종이를 화면으로 만들었어요/);
    await page.type(".msg.now [data-act=plan-reply]", "네, 운영진만 봐요");
    await page.keyboard.down("Control"); await page.keyboard.press("Enter"); await page.keyboard.up("Control"); await wait(300);   // 답 칸의 Ctrl+Enter는 답하기 — '맞아요'(끝냄)로 넘어가지 않는다(2026-10-24 리뷰)
    assert.equal(seen.start.length, 2);
    assert.match(seen.start[1].text, /Claude Code가 "목록은 운영진만 보나요\?"라고 물었고, 사용자의 답: 네, 운영진만 봐요/);
    assert.notEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).plan.work.p1.state), "done", "끝냄이 아니라 다시 맡김");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("허락 카드는 채팅에 뜬다 — 판으로 옮기지 않는다(예시 카드 &approve=1)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    await page.goto(`${pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href}#base&approve=1`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat .aplist .ap", { timeout: 8000 });
    assert.ok(!(await page.$(".mc.base")), "AI 진행 판이 아니라 채팅");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("관문 · 경고가 먼저 — 맡길 일을 골라 둬도 관문이 떠 있으면 채팅 · 입력 칸 · 위 줄은 관문 쪽(2026-10-24 리뷰), Esc는 계획에서 빼내지 않는다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    const base = pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href;
    await page.goto(`${base}#ex=1&done&gate&plan`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    assert.match(await nowSay(page), /이해되셨나요/, "관문이 먼저");
    assert.doesNotMatch(await page.$eval(".mc.chat [data-act=say]", (e) => e.placeholder), /붙여 넣어요/, "입력 칸도 관문 쪽");
    assert.doesNotMatch(await page.$eval(".tb-stage", (e) => e.textContent), /준비 계획/, "위 줄도");
    await page.goto("about:blank"); await page.goto(`${base}#base&plan`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Escape"); await wait(300);
    await page.mouse.move(700, 300); await wait(200);
    assert.match(await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).qfocus), /plan/, "Esc로 계획에서 빠지지 않는다 — 나가는 길은 칩 하나");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
