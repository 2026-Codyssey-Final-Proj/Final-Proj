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
    await page.click("[data-act=qtab][data-tab=canvas]"); await wait(300);   // 장면은 노트북 탭으로 열린다 — 캔버스의 ③ 기록 칸으로 본다
    assert.match(await page.$eval(".cv-c.c3", (e) => e.textContent), /정한 줄 1\/5/);
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
