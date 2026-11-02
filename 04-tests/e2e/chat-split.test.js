// claude-drafted: 2026-10-29 — 작업실 개편 TASK PR ③ C-61(T14 · T19 · T20): 실제 브라우저로 — 3단계 연습 장면(#ex=2&q=quest, 서버 · AI 없음)에서
//   ① 칸이 하나도 적히지 않았으니 섬은 작업 칸 전체(center) · 플로로 · 질문 하나 · 입력 상자 하나 ② '기능 정리가 막막해요'를 보내도 정한 줄 0/5 그대로, 마스코트 · 질문이 숨고 채팅만, 정리 카드
//   ③ [칸 1개에 적기] → 정한 줄 1/5 · 누가 정했나 '대화' · 섬은 옆 칸(center 아님) ④ 움직임 줄이기면 옮김 시간 0.
//   puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/chat-split.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const FRONT = path.join(__dirname, "../../02-frontend");
const url = (p) => { const [file, hash] = p.split("#"); return `${pathToFileURL(path.join(FRONT, file)).href}${hash ? `#${hash}` : ""}`; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// browser.close()가 이 컴퓨터(Windows · puppeteer-core 24)에서 가끔 끝나지 않는다 — 4초 안에 안 닫히면 프로세스를 끊는다(바탕 커밋에서도 같았다, 2026-10-29)
const shut = async (browser) => { await Promise.race([browser.close(), wait(4000)]); try { const pr = browser.process(); if (pr && pr.exitCode === null) pr.kill("SIGKILL"); } catch {} };
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
if (skip) console.log(`⚠️ e2e/chat-split: ${skip}`);

async function open(browser, { reduce = false } = {}) {
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
  if (reduce) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
  await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
  await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(500);
  if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(300); }
  return page;
}
const state = (page) => page.evaluate(() => { const q = JSON.parse(localStorage.getItem("navigator-prototype:v1") || "{}").quest || {}; const col = document.querySelector(".isl-col");
  return { lines: (q.lines || []).flat().length, by: q.by || [], center: !!col && col.classList.contains("center"), colW: col ? Math.round(col.getBoundingClientRect().width) : 0, hello: !!document.querySelector(".mc.chat.hello"),
    who: (() => { const w = document.querySelector(".isl .mc.chat .who"); return !!w && getComputedStyle(w).display !== "none"; })(), chips: document.querySelectorAll(".isl .opts .b").length, tidy: document.querySelector(".tidy") ? [...document.querySelectorAll(".tidy li span")].map((x) => x.textContent) : null,
    tidyBtn: (document.querySelector("[data-act=tidy-fill]")?.textContent || "").replace(/Enter$/, "").trim(), wbody: !!document.querySelector(".wbody") && getComputedStyle(document.querySelector(".wbody")).display !== "none", trans: col ? getComputedStyle(document.querySelector(".wsx")).transitionDuration : "",
    navW: (() => { const n = document.querySelector(".wnav"); return n && getComputedStyle(n).display !== "none" ? Math.round(n.getBoundingClientRect().width) : 0; })() }; });   // 가운데일 때도 왼쪽 대화 목록은 그대로(C-61 '머리 줄 · 왼쪽 칸은 그대로', F-81)
async function send(page, text) {
  await page.click(".isl [data-act=say]");
  await page.evaluate((t) => { const el = document.querySelector(".isl [data-act=say]"); el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, text);
  await page.keyboard.press("Enter"); await wait(500);
}

test("C-61 — 칸 0개 · 섬 펼침: 섬은 작업 칸 전체 · 플로로 · 질문 하나 · 입력 하나(칩 없음). '기능 정리가 막막해요'를 보내면 정한 줄 0/5 그대로, 마스코트 · 질문이 숨고 채팅 + 정리 카드. [칸 1개에 적기] → 정한 줄 1/5 · 누가 정했나 '대화' · 섬은 옆 칸 420", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await open(browser);
    let s = await state(page);
    assert.ok(s.center && s.hello && s.who && s.chips === 0 && !s.wbody && s.lines === 0, `처음: ${JSON.stringify(s)}`);
    assert.equal(s.navW, 200, `가운데일 때 왼쪽 대화 목록이 보인다 — 빈 띠가 아니다(F-81): ${JSON.stringify(s)}`);
    assert.equal(await page.$eval(".mc.chat.hello .hello-q", (e) => e.textContent), "지금 작업 중인 내용을 공유해 주세요, 함께 논의해요~", "3단계(코드 2)의 질문");
    await send(page, "기능 정리가 막막해요");
    s = await state(page);
    assert.equal(s.lines, 0, "보내기만으로는 정한 줄이 바뀌지 않는다"); assert.ok(!s.hello && !s.who && s.center, `첫 말 뒤: 채팅만, 아직 가운데 — ${JSON.stringify(s)}`);
    assert.deepEqual(s.tidy, ["기능 정리가 막막해요"], "연습: 보낸 말이 지금 칸의 후보"); assert.equal(s.tidyBtn, "칸 1개에 적기");
    assert.equal(s.chips, 2, "정리 카드의 단추 둘뿐(늘 있는 칩 줄 없음)");
    await page.click("[data-act=tidy-fill]"); await wait(600);
    s = await state(page);
    assert.equal(s.lines, 1, "정한 줄 1/5"); assert.equal(s.by[0], "chat", "누가 정했나 '대화'"); assert.ok(!s.center && s.wbody, "섬은 옆 칸으로, 작업 칸이 돌아온다");
    assert.equal(s.colW, 420, `옆 칸 420 — ${s.colW}`);
    assert.ok((await page.$eval(".wh [data-act=isl-big]", (e) => e.getAttribute("aria-pressed"))) === "false", "머리 줄 단추는 '크게'");
    await page.click(".wh [data-act=isl-big]"); await wait(400);
    s = await state(page); assert.ok(s.center && !s.wbody, "사람이 '크게'를 누르면 다시 가운데");
  } finally { await shut(browser); }
});

test("C-61 — 옆 칸으로 옮기는 시간: 보통은 0.3초, 움직임 줄이기면 0", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await open(browser);
    assert.equal((await state(page)).trans, "0.3s");
    await page.close();
    const p2 = await open(browser, { reduce: true });
    assert.equal((await state(p2)).trans, "0s");
  } finally { await shut(browser); }
});

// claude-drafted: 2026-10-29 — 두승현 "초안이 남아 있어도 오른쪽의 세션을 클릭하지 않으면 진행되지 않도록 · 반드시 1단계 화면이 나오도록":
//   주소 없이 켜면(C-55) 작업실 + 알약 — 알약을 누르면 ① 화면(가운데 · 1단계 질문 하나 · 입력 하나, 칩 없음). 첫 말로 1단계 초안 — 칸에는 아직 안 적힘, 초안 확인 카드.
//   ① 화면은 1단계 시작에만 — 초안이 있으면(다시 켤 때 · 2단계 이후) 전처럼 초안 확인 카드(같은 날 두승현 고름)
test("C-61 · 1단계 — 켜서 알약을 누르면 ① 화면, 첫 말로 초안(칸은 비어 있음). 다시 켜면 ① 화면이 아니라 초안 확인 카드", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    // 지난 대화가 남아 있어도(앱에서 본 것 — 전 프로젝트의 플로로 말 한 줄, 2026-10-29) 1단계 시작이면 ① 화면 — 구분선은 퀘스트가 생길 때부터다
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear();
      localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "fixture" }));   // 대화는 기본 저장이 있을 때만 되읽는다(app.js load)
      localStorage.setItem("navigator-prototype:v1:chat", JSON.stringify([{ who: "floro", html: "지난번에 남은 말", at: Date.now() - 60000, n: 0 }])); });
    await page.goto(url("navigator/index.html"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(500);
    let s = await state(page);
    assert.ok(!s.hello && (await page.$(".pill")), `켤 때는 알약 — 누르기 전에는 진행하지 않는다: ${JSON.stringify(s)}`);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1:chat") || "[]").length), 1, "지난 대화 한 줄이 남아 있는 채로 시작");
    await page.click(".isl-col .pill"); await wait(500);
    s = await state(page);
    assert.ok(s.center && s.hello && s.who && s.chips === 0 && !s.wbody, `알약 → ① 화면(가운데 · 플로로 · 질문 · 입력): ${JSON.stringify(s)}`);
    assert.equal(await page.$eval(".mc.chat.hello .hello-q", (e) => e.textContent), "어떤 프로젝트를 구상하고 있나요?", "1단계(코드 0)의 질문");
    await send(page, "동아리 행사 등록 앱을 만들고 싶어요");
    const q1 = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1") || "{}").quest || {});
    s = await state(page);
    assert.ok(q1.draft && q1.chap === 0 && !s.hello, `첫 말 → 1단계 초안: ${JSON.stringify({ chap: q1.chap, draft: !!q1.draft, hello: s.hello })}`);
    assert.equal(s.lines, 0, "칸에는 아직 안 적힘 — 사람이 맞아요를 눌러야");
    assert.ok(await page.$(".isl [data-act=draft-ok]"), "초안 확인 카드(맞아요 · 고칠래요)");
    // 다시 켜면 — 초안이 남아 있어도 알약을 누르기 전에는 그대로, 누르면 ① 화면이 아니라 초안 확인 카드(이미 말했으니 같은 질문을 두 번 묻지 않는다)
    await page.reload({ waitUntil: "load" }); await wait(500);
    assert.ok(await page.$(".isl-col .pill"), "다시 켜도 알약부터");
    await page.click(".isl-col .pill"); await wait(500);
    s = await state(page);
    assert.ok(!s.hello && s.lines === 0 && (await page.$(".isl [data-act=draft-ok]")), `다시 켜면 초안 확인 카드: ${JSON.stringify(s)}`);
  } finally { await shut(browser); }
});
