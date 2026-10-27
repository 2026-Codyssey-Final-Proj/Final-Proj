// claude-drafted: 2026-10-27 — C-42 R-10(F-60, 이재엽 버튼 "Go" · "증거가 있어야 됨"): 완료 보고 뒤 '안 됨'이 남으면 관문 앞에서 멈춘다 — 채우러 가기 / 까닭 적고 넘기기.
//   3단계 연습 장면(#ex=2&q=quest)에서 다섯 줄을 적되 하나에 빈칸 표시 '(재고 적기)'를 남기고 보고한다 → 코드 규칙(gateRules)이 그 칸을 '안 됨'으로 → 멈춤 카드 →
//   까닭을 적고 넘기면 관문(이해되셨나요)이 열리고, 채팅에 '넘겨요 — 까닭'이 남는다. 채우러 가기는 공책으로 돌아간다. puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/gate-stop.test.js
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
if (skip) console.log(`⚠️ e2e/gate-stop: ${skip}`);

const card = (page) => page.evaluate(() => ({ title: [...document.querySelectorAll(".isl .mc.chat .say")].pop()?.textContent || "", acts: [...document.querySelectorAll(".isl .mc.chat [data-act]")].map((b) => b.dataset.act), unmet: [...document.querySelectorAll(".isl .unmet li b")].map((b) => b.textContent) }));
async function sayLine(page, text) { await page.click("[data-act=say]"); await page.type("[data-act=say]", text); await page.keyboard.press("Enter"); await wait(350); }

test("R-10 — 빈칸 표시가 남은 채 보고하면 관문 앞에서 멈추고, 까닭을 적고 넘기면 관문이 열린다 · 채우러 가기는 공책으로", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(400);
    for (const line of ["회원이 신청 단추를 누르면, 앱은 신청을 받는다", "마감 전 → (재고 적기)", "신청 받기: 꼭", "기능이 셋이라 표는 아직", "남이 목록을 열면, 앱은 연락처를 보여 주지 않는다"]) await sayLine(page, line);
    let c = await card(page);
    assert.match(c.title, /완료 보고/, `다 적으면 보고 카드: ${JSON.stringify(c)}`);
    await page.click("[data-act=quest-report]"); await wait(600);
    c = await card(page);
    assert.match(c.title, /'안 됨'이 1개 있어요 — 관문 앞에서 멈췄어요/, JSON.stringify(c));
    assert.deepEqual(c.unmet, ["숫자로"], "빈칸 표시가 남은 Ⅱ 숫자로만 '안 됨'(코드 규칙)");
    assert.ok(c.acts.includes("gate-fill") && c.acts.includes("gate-skip"), c.acts.join(","));
    // 채우러 가기 → 공책(노트북 탭) · 보고 카드로 돌아온다
    await page.click("[data-act=gate-fill]"); await wait(400);
    assert.ok(await page.$(".qwin .book"), "공책으로");
    c = await card(page); assert.match(c.title, /완료 보고/, "다시 보고할 수 있다");
    await page.click("[data-act=quest-report]"); await wait(600);
    // 까닭 적고 넘기기 — 빈 까닭은 안 되고, 적으면 관문이 열린다
    await page.click("[data-act=gate-skip]"); await wait(300);
    c = await card(page); assert.match(c.title, /왜 넘기는지/, JSON.stringify(c));
    await page.click("[data-act=gate-skip-save]"); await wait(300);
    assert.match((await card(page)).title, /왜 넘기는지/, "빈 까닭으로는 넘어가지 않는다");
    await page.type("[data-act=skip-reason]", "숫자는 발표 뒤에 재요"); await wait(100);
    await page.click("[data-act=gate-skip-save]"); await wait(600);
    c = await card(page);
    assert.match(c.title, /모두 했어요/, `넘기면 '모두 했어요' — 관문 단추가 생긴다: ${JSON.stringify(c)}`); assert.ok(c.acts.includes("gate"), c.acts.join(","));
    await page.click("[data-act=gate]"); await wait(400);
    assert.match((await card(page)).title, /이해되셨나요/, "관문(넘어가기 전 확인)");
    const me = await page.evaluate(() => [...document.querySelectorAll(".isl .msg.me")].map((m) => m.textContent.trim()));
    assert.ok(me.some((x) => /넘겨요 — 숫자는 발표 뒤에 재요/.test(x)), `채팅에 내 말로 남는다: ${me.join(" | ")}`);
  } finally { await browser.close(); }
});
