// claude-drafted: 2026-10-30 — 퀘스트 탭 합치기 TASK T02(C-68, 두승현 목업 확정본 "공책 모양 — 모양까지 바꿈"): 공책 두 쪽 → 한 목록.
//   끝낸 줄은 체크 · 한 줄, 지금 줄만 펼침(면의 색으로만), 아직 줄은 흐리게. 완료 보고는 다 차기 전엔 보조 단추(C-60). 줄의 방법 이름 꼬리표(EARS …)는 그대로(C-66이 지킬 것).
// puppeteer · Chrome이 없으면 건너뛴다. 실행: PUPPETEER_PATH=<puppeteer-core 폴더> node --test 04-tests/e2e/quest-card.test.js
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
if (skip) console.log(`⚠️ e2e/quest-card: ${skip}`);
const launch = () => puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });

test("C-68 — 퀘스트 카드는 한 목록: 공책(.book · .page · .toc) 0, 줄 다섯 · 끝낸 줄 1 · 펼친 지금 줄 1(Ⅱ) · 아직 줄 3, 방법 꼬리표 있음, 완료 보고는 다 차기 전엔 보조 단추", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    // 처음 실행(#start) → 원하는 것을 말하면 1단계 초안 카드 → 칸 하나를 '맞아요'(끝낸 줄 하나) — 장면(#ex)의 판정은 칸을 '맞음'으로 두어 끝낸 줄 수를 정할 수 없었다
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#start"), { waitUntil: "load" }); await wait(400);
    await page.type("[data-act=say]", "동아리 행사 신청 앱을 만들고 싶어요"); await page.keyboard.press("Enter"); await wait(700);
    await page.click(".mc.chat [data-act=draft-ok]"); await wait(400);
    if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(600); }
    if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); }   // 1단계 시작 화면이 덮으면 섬을 옆으로(F-88)
    await page.click("[data-act=qtab][data-tab=quest]"); await wait(400);

    const n = (sel) => page.$$eval(sel, (ls) => ls.length);
    assert.equal(await n(".qwin .book, .qwin .page, .qwin .toc"), 0, "공책 두 쪽은 없다");
    assert.ok(await page.$(".qwin .qcard"), "퀘스트 카드 하나");
    const states = await page.$$eval(".qwin .qcard .ln", (ls) => ls.map((l) => (l.classList.contains("st-done") ? "done" : l.classList.contains("st-now") ? "now" : l.classList.contains("st-later") ? "later" : "?")));
    assert.ok(states.length >= 4, `줄이 칸 수만큼(1단계는 넷): ${states.length}`);
    assert.deepEqual(states, ["done", "now", ...states.slice(2).map(() => "later")], `끝낸 줄 1 · 지금 줄 1(Ⅱ) · 나머지 아직: ${states.join(",")}`);
    assert.ok(await page.$(".qwin .qcard .ln.st-done .lw"), "끝낸 줄은 적은 글 한 줄"); assert.match(await page.$eval(".qwin .qcard .ln.st-done .n", (e) => e.textContent), /그대로/, "끝낸 줄 끝에 누가 정했나");
    assert.ok(await page.$(".qwin .qcard .ln.st-now .easy"), "지금 줄만 쉬운 한 줄을 펼친다");
    assert.equal(await n(".qwin .qcard .ln.st-later .lw"), 0, "아직 줄은 이름만(적은 글 없음)");
    assert.ok((await n(".qwin .qcard .ln .method")) >= 1, "방법 이름 꼬리표(EARS …)는 그대로");
    assert.match(await page.$eval(".qwin .qprog", (e) => e.textContent.replace(/\s+/g, "")), /1\/\d/, "정한 줄 1/n");
    const bg = await page.$eval(".qwin .qcard .ln.st-now", (l) => { const s = getComputedStyle(l); return { bg: s.backgroundColor, bl: s.borderLeftWidth, ol: s.outlineStyle, sh: s.boxShadow }; });
    assert.equal(bg.bg, "rgb(211, 224, 243)", `지금 줄은 얼음 면(#D3E0F3): ${JSON.stringify(bg)}`);
    assert.ok(bg.bl === "0px" && (bg.ol === "none" || bg.ol === "") && bg.sh === "none", `지금 줄에 막대 · 테두리 · 그림자 강조 없음(C-59의 상태 선도 아님): ${JSON.stringify(bg)}`);
    const rep = await page.$eval("[data-act=quest-report]", (b) => ({ disabled: b.disabled, pri: b.classList.contains("pri") }));
    assert.ok(rep.disabled && !rep.pri, `완료 보고는 다 차기 전엔 보조 단추: ${JSON.stringify(rep)}`);
    assert.equal(await n(".qwin .piece"), 0, "보상은 글로만 — 금 테두리 조각 없음");
  } finally { await browser.close(); }
});
