// claude-drafted: 2026-10-30 — 퀘스트 탭 합치기 TASK T09(C-65 · C-69 · C-70 · C-72, 두승현 목업 확정본): 노트북 + 도전과제 → '퀘스트' 탭 하나.
//   받기 전 카드(단추 둘) → 받기 → 지금 줄, '나중에'면 카드를 내려 지도 여덟 장 + 아래 띠, 끝낸 장 카드는 읽기만, 6단계면 5 ~ 8 줄, 이 탭에서는 오른쪽 칸이 접힘,
//   섬 칩 '퀘스트 보기'와 옛 저장 값(tree)은 합친 탭으로.
// puppeteer · Chrome이 없으면 건너뛴다. 실행: PUPPETEER_PATH=<puppeteer-core 폴더> node --test 04-tests/e2e/quest-tab.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const FRONT = path.join(__dirname, "../../02-frontend");
const url = (p) => { const [file, hash] = p.split("#"); return `${pathToFileURL(path.join(FRONT, file)).href}${hash ? `#${hash}` : ""}`; };
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
const skip = !puppeteer || !chrome ? `건너뜀 — ${!puppeteer ? "puppeteer" : "Chrome"}를 찾지 못했어요(PUPPETEER_PATH · CHROME_PATH로 알려 줄 수 있어요)` : false;
if (skip) console.log(`⚠️ e2e/quest-tab: ${skip}`);
const launch = () => puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
async function fresh(browser) {
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
  await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
  return page;
}
const n = (page, sel) => page.$$eval(sel, (ls) => ls.length);
const scene = async (page, hash) => { await page.goto("about:blank"); await page.goto(url(`navigator/index.html#${hash}`), { waitUntil: "load" }); await wait(400); if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); } };

test("C-65 · C-70 · C-69 · C-72 — 탭 셋 · 받기 전 카드(단추 둘) → 받기 → 지금 줄 · '나중에'면 카드 내림(여덟 장 + 아래 띠 + 범례) → 올리기 · 끝낸 장은 읽기만 · 오른쪽 칸은 이 탭에서 접힘", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await scene(page, "ex=1&q=draft");   // 2단계 퀘스트 받기 전
    assert.deepEqual(await page.$$eval(".wsx > .wh .wtabs [data-act=qtab]", (bs) => bs.map((b) => b.textContent)), ["캔버스", "퀘스트", "책"], "탭 셋");
    assert.equal(await n(page, ".qwin .vtabs, .qwin .learnbox, .qwin .chain, .qwin .bn"), 0, "세로 줄 · 장 화면 없음(C-66)");
    // ② 받기 전 카드
    assert.ok(await page.$(".qwin .qboard.up .qstack .qcard.qpre") && !(await page.$(".qwin .ev")), "지도 띠 위에 받기 전 카드 — 이벤트 창 없음");
    assert.equal(await n(page, ".qwin .qpre .pic, .qwin .qpre .slots"), 0, "그림 · 보상 칸 없음");
    assert.deepEqual(await page.$$eval(".qwin .qpre .pacts button", (bs) => bs.map((b) => b.textContent)), ["나중에", "퀘스트 받기"]);
    assert.ok((await n(page, ".qwin .qpre .ln")) >= 4, "다섯 칸 미리보기");
    assert.equal(await n(page, ".qwin .sm-grid.one .sm-card"), 4, "카드가 올라와 있으면 지도는 지금 장이 있는 줄 하나");
    assert.ok(!(await page.$(".qwin .sm-legend")), "카드가 올라와 있을 땐 범례 없음(PRD 9절 7번)");
    // ⑨ 오른쪽 칸은 이 탭에서 접힘 → 단추로 켬 → 캔버스 탭은 전 상태
    assert.equal(await n(page, ".qwin .wside"), 0, "오른쪽 칸 접힘(C-72)");
    await page.click("[data-act=wside-toggle]"); await wait(300); assert.equal(await n(page, ".qwin .wside"), 1, "단추로 켠다");
    await page.click("[data-act=qtab][data-tab=canvas]"); await wait(300); assert.equal(await n(page, ".qwin .wside"), 1, "캔버스 탭은 전 상태(열림)");
    await page.click("[data-act=qtab][data-tab=quest]"); await wait(300);
    // ④ '나중에' → 작업실은 열린 채 카드 내림 — 여덟 장 · 아래 띠 · 범례 · 끝낸 카드에 누가 정했나 칩
    await page.click("[data-act=quest-later]"); await wait(400);
    assert.ok(await page.$(".qwin") && !(await page.$(".qwin .qpre")) && await page.$(".qwin .qdown"), "작업실은 열린 채 카드만 내려간다(S4)");
    assert.equal(await n(page, ".qwin .sm-grid .sm-card"), 8, "여덟 장");
    assert.ok(await page.$(".qwin .sm-legend.by") && (await n(page, ".qwin .sm-card.st-done .sm-chips i")) >= 1, "범례 · 끝낸 카드의 누가 정했나 칩");
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem("navigator-prototype:v1"))).questUp, false, "내린 상태는 이 컴퓨터에 기억(두승현 2026-10-30)");
    // ⑥ 끝낸 장(1단계) 카드 → 읽기만 카드가 올라온다 · 다시 지금 퀘스트로
    await page.click('.sm-card[data-i="0"]'); await wait(400);
    assert.ok(await page.$(".qwin .qcard.readonly") && !(await page.$(".qwin .qcard.readonly [data-act=quest-edit]")) && !(await page.$(".qwin .qcard.readonly [data-act=quest-report]")), "읽기만 — 단추 없음");
    await page.click("[data-act=quest-view-off]"); await wait(300);
    assert.ok(await page.$(".qwin .qpre"), "'지금 퀘스트로' → 받기 전 카드");
    // ③ 받기 → 지금 줄 Ⅰ 펼침
    await page.click("[data-act=quest-ok]"); await wait(500);
    assert.ok(await page.$(".qwin .qcard:not(.qpre)") && (await n(page, ".qwin .qcard:not(.qpre) .ln")) >= 4 && !(await page.$(".qwin .qpre")), "받으면 다섯 칸 카드(장면의 판정이 칸을 맞음으로 두면 끝낸 줄)");
    // ⑦ '지도 보기' → 내림 → '퀘스트 카드 올리기' → 올림
    if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); }   // 받은 직후(칸 0개)는 섬이 다시 작업 칸을 덮는다(C-61 bigAuto)
    await page.click(".qtop [data-act=quest-down]"); await wait(300); assert.ok(await page.$(".qwin .qdown") && !(await page.$(".qwin .qstack")), "지도 보기");
    await page.click("[data-act=quest-up]"); await wait(300); assert.ok(await page.$(".qwin .qstack .qcard"), "올리기");
  } finally { await browser.close(); }
});

test("C-65 · C-69 — 6단계면 지도 띠는 5 ~ 8 줄, 섬 칩 '퀘스트 보기'가 합친 탭을 열고 카드를 올린다, 옛 저장 값(qtab = tree)도 합친 탭", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await scene(page, "ex=5&q=quest");   // 6단계
    assert.deepEqual(await page.$$eval(".qwin .sm-grid.one .sm-card", (cs) => cs.map((c) => c.dataset.i)), ["4", "5", "6", "7"], "지금 장이 둘째 줄이면 그 줄(5 ~ 8)");
    // 섬 칩 '퀘스트 보기'(qwin-quest → 합친 탭 · 카드 올림)는 글자 시험(modes.test.js)으로 — 장면(#ex)에서는 그 칩이 뜨는 카드를 재현하지 못했다(2026-10-30)
    await scene(page, "ex=1&q=done");
    // 옛 저장 값 tree
    await page.evaluate(() => { const k = "navigator-prototype:v1", s = JSON.parse(localStorage.getItem(k)); s.qtab = "tree"; s.qwin = true; localStorage.setItem(k, JSON.stringify(s)); });
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(500);
    if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(400); }
    if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); }
    await page.click("[data-act=qtab][data-tab=quest]"); await wait(300);
    assert.ok(await page.$(".qwin .qboard") && !(await page.$(".qwin .vtabs")), "옛 값으로도 합친 탭이 그려진다");
  } finally { await browser.close(); }
});
