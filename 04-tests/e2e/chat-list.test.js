// claude-drafted: 2026-10-29 — 작업실 개편 TASK PR ④ C-63(T22 · T23 · T25 · T26): 실제 브라우저로.
//   ① 파일로 연 화면(연습): 왼쪽 칸은 대화 목록(프로젝트 이름 · 지금 단계 '지금' · 맨 아래 '전체 파일' 접힘), 보낸 말은 주소 없이 다시 켜도 이 브라우저에 남는다, 바로가기 펼침 · 접힘.
//   ② 서버로 연 화면(진짜 AI 모드, 서버 길 /api/chatlog은 가짜 답 — API.md 3-32 모양): 켤 때 저장된 대화(구분선 둘 · 바뀐 파일)를 이어서 보이고, 바로가기를 누르면 그 구분선으로 옮겨 강조하며 그 단계의 파일('새로' · '고침')을 펼친다. 보낸 말은 add로 서버에 간다.
//   puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/chat-list.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { pathToFileURL } = require("node:url");

const FRONT = path.join(__dirname, "../../02-frontend");
const url = (p) => { const [file, hash] = p.split("#"); return `${pathToFileURL(path.join(FRONT, file)).href}${hash ? `#${hash}` : ""}`; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shut = async (browser) => { await Promise.race([browser.close(), wait(4000)]); try { const pr = browser.process(); if (pr && pr.exitCode === null) pr.kill("SIGKILL"); } catch {} };   // browser.close()가 이 컴퓨터에서 가끔 끝나지 않는다(2026-10-29)
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
if (skip) console.log(`⚠️ e2e/chat-list: ${skip}`);

const nav = (page) => page.evaluate(() => { const rows = [...document.querySelectorAll(".wnav .cn-list .cn")].map((li) => ({ label: li.querySelector("button > span")?.textContent, tag: li.querySelector("button > small")?.textContent, now: li.classList.contains("st-now"), open: li.querySelector("button")?.getAttribute("aria-expanded"), files: [...li.querySelectorAll(".cn-files li")].map((x) => x.textContent.trim()) }));
  const all = document.querySelector(".wnav details.fn-all"); return { project: document.querySelector(".wnav .fn-h span")?.textContent, rows, all: !!all, allOpen: !!all && all.open, tree: !!document.querySelector(".wnav details.fn-all .fn li"), hello: !!document.querySelector(".mc.chat.hello"), me: [...document.querySelectorAll(".isl .msg.me")].map((m) => m.textContent.trim()), stageLines: [...document.querySelectorAll(".isl .msg.stage")].map((m) => m.textContent.trim()) }; });
const tap = (page, sel) => page.evaluate((q) => { const el = document.querySelector(q); if (!el) throw new Error(`없음: ${q}`); el.click(); }, sel);   // 다시 그려지는 사이에 잡은 요소가 떨어지지 않게 그 자리에서 누른다
const openWs = async (page) => { if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(300); } };

test("C-63 ① 연습(파일로 연 화면) — 왼쪽 칸은 대화 목록: 프로젝트 이름 · 지금 단계('지금', C-59 모양) · '전체 파일'(접힘, 펼치면 폴더 모양). 보낸 말은 주소 없이 다시 켜도 이 브라우저에 남는다. 바로가기 누르면 펼침 · 다시 누르면 접힘", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(500);
    await openWs(page);
    let s = await nav(page);
    assert.ok(s.project && s.rows.length >= 1 && s.rows[0].now && s.rows[0].tag === "지금" && /^3 · /.test(s.rows[0].label), `지금 단계가 맨 위: ${JSON.stringify(s.rows)}`);
    assert.ok(s.all && !s.allOpen, `전체 파일은 접혀 있다: ${JSON.stringify({ all: s.all, allOpen: s.allOpen })}`); assert.ok(s.hello, "처음엔 플로로 질문");
    await tap(page, ".wnav details.fn-all > summary"); await wait(300);
    s = await nav(page); assert.ok(s.allOpen && s.tree, "펼치면 지금의 폴더 모양(예시 목록)");
    // 바로가기 — 펼침 · 접힘
    await tap(page, ".wnav .cn-list .cn button[data-act=chat-go]"); await wait(300);
    s = await nav(page); assert.equal(s.rows[0].open, "true"); assert.deepEqual(s.rows[0].files, ["아직 바뀐 파일이 없어요"], JSON.stringify(s.rows[0]));
    await tap(page, ".wnav .cn-list .cn button[data-act=chat-go]"); await wait(300);
    s = await nav(page); assert.equal(s.rows[0].open, "false", "다시 누르면 접힘");
    // 보내기 → 이 브라우저에 저장 → 주소 없이 다시 켜면(장면 주소는 대화를 비운다) 남아 있다 — 켤 때는 알약이라 펼쳐서 본다(C-55)
    await page.click(".isl [data-act=say]");
    await page.evaluate(() => { const el = document.querySelector(".isl [data-act=say]"); el.value = "기능 정리가 막막해요"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.keyboard.press("Enter"); await wait(500);
    await page.goto(url("navigator/index.html"), { waitUntil: "load" }); await wait(800);
    if (await page.$(".pill")) { await tap(page, "[data-act=pill]"); await wait(500); }
    s = await nav(page);
    assert.deepEqual(s.me, ["기능 정리가 막막해요"], `다시 켜도 내 말이 남아 있다: ${JSON.stringify(s.me)}`); assert.ok(!s.hello, "다시 켜면 질문이 아니라 채팅");
  } finally { await shut(browser); }
});

// ② 서버로 연 화면 — 진짜 AI 모드. /api/chatlog은 가짜 답(3-32 모양), 그 밖의 AI 길은 부르지 않는다
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-chatlist-e2e-"));
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
test.after(() => { if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); });

test("C-63 ② 서버(진짜 AI 모드) — 켤 때 /api/chatlog의 대화(2단계 · 3단계 구분선 · 가져온 것)를 이어서 보이고, 왼쪽 목록은 최근 단계가 위(지금 / 날짜), 바로가기를 누르면 그 구분선으로 옮겨 강조 · 그 단계의 바뀐 파일(새로 · 고침, 구분선 사이의 at)을 펼친다. 보낸 말은 add로 서버에", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    const at2 = new Date("2026-10-26T10:00:00").getTime(), at3 = Date.now() - 60000, posted = [];
    const turns = [{ at: at2, stage: 1, mark: true, title: "적어 두기" }, { at: at2 + 1, stage: 1, who: "me", text: "2단계 이야기" }, { at: at2 + 2, stage: 1, who: "floro", text: "좋아요" },
      { at: at3, stage: 2, mark: true, title: "기능 정리" }, { at: at3 + 1, stage: 2, carry: "불편 — 날짜를 잊어요\n달라지는 것 — 알림이 와요" }, { at: at3 + 2, stage: 2, who: "me", text: "지금 이야기" }];
    const changes = [{ at: at2 + 5, path: "src/app.js", how: "new" }, { at: at2 + 6, path: "src/app.js", how: "edit" }, { at: at2 + 7, path: "docs/02-plan/plan.md", how: "edit" }, { at: at3 + 3, path: "src/list.js", how: "new" }];
    await page.setRequestInterception(true);
    page.on("request", (req) => { const p = new URL(req.url()).pathname, json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
      if (p === "/api/chatlog" && req.method() === "GET") return json({ ok: true, project: "test-1", turns, changes, why: "" });
      if (p === "/api/chatlog" && req.method() === "POST") { posted.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, n: 9 }); }
      if (p === "/api/chat") return json({ ok: true, reply: "그렇군요", slots: [], n: 0, tokens: 1 });
      return req.continue(); });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live" })); sessionStorage.setItem("seeded", "1"); } } catch {} });
    await page.goto(`http://127.0.0.1:${port}/#start`, { waitUntil: "load" }); await wait(900);
    await openWs(page);
    let s = await nav(page);
    assert.equal(s.stageLines.length, 2, `구분선 둘: ${JSON.stringify(s.stageLines)}`); assert.ok(s.stageLines[0].includes("2단계") && s.stageLines[1].includes("3단계"));
    assert.ok(!s.hello && s.me.includes("지금 이야기"), `이어서 보인다: ${JSON.stringify(s.me)}`);
    assert.ok(await page.$(".isl .msg.carry"), "가져온 것 카드");
    const today = new Date().toLocaleDateString("sv").slice(5).replace("-", "/");   // #start 장면은 1단계가 지금 — 저장된 2 · 3단계는 날짜로, 최근이 위
    assert.deepEqual(s.rows.map((r) => [r.label, r.tag]), [["3 · 기능 정리", today], ["2 · 적어 두기", "10/26"], ["1 · 정하기", "지금"]], JSON.stringify(s.rows));
    // 2단계 바로가기 — 그 단계의 파일(구분선 사이의 at): src/app.js는 new 뒤 edit라 '새로', plan.md는 '고침'. 3단계 것(list.js)은 안 섞인다
    await tap(page, '.wnav .cn-list .cn button[data-act=chat-go][data-v="1"]'); await wait(400);
    s = await nav(page); const r2 = s.rows.find((r) => /^2 · /.test(r.label));
    assert.equal(r2.open, "true"); assert.deepEqual(r2.files, ["plan.md고침", "app.js새로"], JSON.stringify(r2.files));
    const hl = await page.evaluate(() => { const lg = document.querySelector(".isl [data-log]"), el = lg.querySelector('[data-stage="1"]'); const a = el.getBoundingClientRect(), b = lg.getBoundingClientRect(); return { hl: el.classList.contains("hl"), visible: a.top >= b.top - 2 && a.top < b.bottom }; });
    assert.ok(hl.visible && hl.hl, `2단계 구분선으로 옮겨 강조: ${JSON.stringify(hl)}`);
    await tap(page, '.wnav .cn-list .cn button[data-act=chat-go][data-v="2"]'); await wait(300);
    s = await nav(page); const r3 = s.rows.find((r) => /^3 · /.test(r.label)); assert.deepEqual(r3.files, ["list.js새로"], JSON.stringify(r3.files));
    // 보내기 → 이 브라우저에 쌓고 서버에도 add(마지막은 내 말)
    await page.click(".isl [data-act=say]");
    await page.evaluate(() => { const el = document.querySelector(".isl [data-act=say]"); el.value = "회원 열두 명"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.keyboard.press("Enter"); await wait(900);
    assert.ok(posted.some((b) => (b.add || []).some((t) => t.who === "me" && t.text === "회원 열두 명" && t.stage === 0)), `add로 서버에(#start 장면은 1단계 = 0): ${JSON.stringify(posted).slice(0, 300)}`);
  } finally { await shut(browser); }
});

// ③ 병합 뒤 고침(2026-10-29, 이재엽 "#251부터 차례대로 병합 문제 해결" — #247 서버 · #250 화면이 같이 들어간 main에서 plan-flow e2e가 400으로 깨졌다):
//   서버는 앱이 고른 폴더가 없으면 POST /api/chatlog을 400으로 거절한다(API.md 3-32). 화면은 GET이 폴더를 안다고 할 때까지 보내지 않고 모아 두었다가,
//   폴더를 모르면 버리고(이 브라우저에는 남는다), 폴더를 고르면 다시 물어 그때부터 보낸다
test("C-63 ③ 서버(진짜 AI 모드) — 앱이 고른 폴더가 없으면 대화를 서버에 보내지 않는다(400이 쌓이지 않게), 폴더를 고르면(앱 메뉴 · 처음 설정) 다시 묻고 그때부터 보낸다", { skip }, async () => {
  const Srv = require("../../03-backend/navigator/server.js");
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  const dirs = [];
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    const posts = [], errors = [], gets = [];
    page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) errors.push(m.text()); });
    page.on("request", (req) => { const p = new URL(req.url()).pathname; if (p === "/api/chatlog" && req.method() === "POST") posts.push(JSON.parse(req.postData() || "{}")); if (p === "/api/chatlog" && req.method() === "GET") gets.push(Date.now()); });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live" })); sessionStorage.setItem("seeded", "1"); } } catch {} });
    await page.goto(`http://127.0.0.1:${port}/#start`, { waitUntil: "load" });
    const until = async (fn, what) => { for (let k = 0; k < 200; k++) { if (fn()) return; await wait(100); } assert.fail(what); };   // 20초까지 — 전체 시험이 같이 돌 때 느리다
    await until(() => gets.length >= 1, "켤 때 GET으로 묻는다");
    const send = async (t) => {
      await page.waitForSelector(".isl [data-act=say]", { timeout: 20000 });
      await page.waitForSelector(".isl [data-act=send]:not([disabled])", { timeout: 20000 });   // 앞 말의 AI 부르기(1단계 초안)가 끝나야 보낸다 — 전체 시험이 같이 돌면 느려 다음 말이 '앞의 일을 기다려요'로 버려졌다(F-102 고침 2026-10-30)
      await page.click(".isl [data-act=say]");
      await page.evaluate((x) => { const el = document.querySelector(".isl [data-act=say]"); el.value = x; el.dispatchEvent(new Event("input", { bubbles: true })); }, t);
      await page.keyboard.press("Enter");
    };
    const posted = (t) => posts.some((b) => (b.add || []).some((x) => x.who === "me" && x.text === t));
    await send("폴더 없이 한 말"); await wait(800);
    assert.deepEqual(posts, [], "폴더를 모르면 보내지 않는다");
    // 앱 메뉴로 폴더를 고르면(floe:project-picked) 다시 묻고 그때부터 보낸다
    const A = fs.mkdtempSync(path.join(TMP, "proj-")); dirs.push(A); assert.equal(Srv.useProject(A), true);
    const g1 = gets.length;
    await page.evaluate((name) => document.dispatchEvent(new CustomEvent("floe:project-picked", { detail: { name } })), path.basename(A));
    await until(() => gets.length > g1, "폴더를 고르면 다시 묻는다"); await wait(300);
    await send("폴더를 고른 뒤 한 말");
    await until(() => posted("폴더를 고른 뒤 한 말"), `폴더를 고르면 보낸다: ${JSON.stringify(posts).slice(0, 300)}`);
    assert.ok(!posted("폴더 없이 한 말"), "폴더를 모를 때 한 말은 고른 폴더의 대화에 섞지 않는다");
    // 연결을 빼면(서버도 폴더를 잊으면) 다시 묻고 보내지 않는다 · 처음 설정에서 폴더를 고르면(floe:setup-done) 다시 묻고 보낸다(첫 실행 — 새 맥락 리뷰 막힘)
    Srv.dropProject(A); const g2 = gets.length, p2 = posts.length;
    await page.evaluate(() => document.dispatchEvent(new CustomEvent("floe:setup-done", { detail: { via: "cli" } })));
    await until(() => gets.length > g2, "처음 설정을 마치면 다시 묻는다"); await wait(300);
    await send("다시 폴더 없이"); await wait(800);
    assert.equal(posts.length, p2, "서버가 폴더를 모르면 보내지 않는다");
    const B = fs.mkdtempSync(path.join(TMP, "proj-")); dirs.push(B); assert.equal(Srv.useProject(B), true);
    const g3 = gets.length;
    await page.evaluate(() => document.dispatchEvent(new CustomEvent("floe:setup-done", { detail: { via: "cli" } })));
    await until(() => gets.length > g3, "처음 설정에서 폴더를 고르면 다시 묻는다"); await wait(300);
    await send("처음 설정 뒤 한 말");
    await until(() => posted("처음 설정 뒤 한 말"), "처음 설정에서 고른 폴더에 쌓인다");
    assert.deepEqual(errors.filter((e) => /400/.test(e)), [], "400이 쌓이지 않는다");
  } finally { for (const d of dirs) Srv.dropProject(d); await shut(browser); }
});
