// claude-drafted: 2026-10-27 — C-46: ⓐ 켜면 큰 인사 카드 없이 알약, 인사는 알약 안에서(하루에 한 번), 누르면 펼침. ⓑ 작업실 창 안에서 섬이 접히면 옆 칸이 알약(옆은 세로 · 위아래는 가로)이 되고 작업실이 넓어진다.
//   ⓑ는 앱을 띄우지 않고 win.html에 섬이 보낼 HTML을 넣어 잰다(C-42 넘김 문서 5절 방법). puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/pill-overlay.test.js
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
if (skip) console.log(`⚠️ e2e/pill-overlay: ${skip}`);
const SHOTS = process.env.FLOE_SHOTS || "";
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };

test("R-1 — 주소 없이 켜면 알약 안에서 인사(html.greeting · .pill.greet · 시간대 인사 한 줄) → 끝나도 알약, 같은 날 다시 켜면 인사 없이 알약, 누르면 펼침. 주소 끝 장면은 전처럼 기본 화면", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.goto(url("navigator/index.html"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(150);
    let s = await page.evaluate(() => ({ greeting: document.documentElement.classList.contains("greeting"), pill: !!document.querySelector(".pill.greet"), hello: document.querySelector(".pill .pl-hello")?.textContent || "", isl: !!document.querySelector(".isl"), phase: document.documentElement.dataset.greet || "" }));
    assert.ok(s.greeting && s.pill && !s.isl, `켜면 알약 안에서 인사: ${JSON.stringify(s)}`);
    assert.ok(/아침|점심|오후|수고|밤/.test(s.hello), `시간대 인사 한 줄: ${s.hello}`);
    await shot(page, "pill-greet");
    await wait(2800);
    s = await page.evaluate(() => ({ greeting: document.documentElement.classList.contains("greeting"), pill: !!document.querySelector(".pill") && !document.querySelector(".pill.greet"), isl: !!document.querySelector(".isl"), day: localStorage.getItem("floe:greet-day") }));
    assert.ok(!s.greeting && s.pill && !s.isl, `끝나도 알약: ${JSON.stringify(s)}`);
    assert.match(s.day || "", /^\d{4}-\d{2}-\d{2}$/, "오늘 인사했다");
    await page.reload({ waitUntil: "load" }); await wait(150);
    s = await page.evaluate(() => ({ greeting: document.documentElement.classList.contains("greeting"), pill: !!document.querySelector(".pill:not(.greet)"), isl: !!document.querySelector(".isl") }));
    assert.ok(!s.greeting && s.pill && !s.isl, `같은 날 다시 켜면 인사 없이 알약: ${JSON.stringify(s)}`);
    await page.click(".pill"); await wait(400);
    assert.ok(await page.$(".isl .mc.chat"), "알약을 누르면 펼침");
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(150);
    assert.ok(await page.$(".isl .mc.chat") && !(await page.$(".pill")), "주소 끝 장면은 기본 화면(시험 · 녹화)");
  } finally { await browser.close(); }
});

// 작업실 창 재현 — 섬이 보내는 HTML(작업실 판 + 옆 칸)을 win.html에 넣고 잰다
async function islandHTML(browser) {
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
  await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
  await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(400);
  if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(300); }
  await page.click("[data-act=qtab][data-tab=canvas]"); await wait(300);
  const qwin = await page.evaluate(() => document.querySelector(".qwin").outerHTML), isl = await page.evaluate(() => document.querySelector(".isl").outerHTML);
  await page.click("[data-act=fold]"); await wait(400);   // 접기 → 알약
  const pill = await page.evaluate(() => document.querySelector(".pill")?.outerHTML || "");
  await page.close();
  return { qwin, isl, pill };
}
async function measure(browser, h, side, folded) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { window.floeApp = { onWinHtml: (f) => { window.__h = f; }, onDock() {}, winEvent() {} }; });
  await page.setViewport({ width: 1440, height: 860 });
  await page.goto(url("navigator/win.html#quest"), { waitUntil: "load" });
  const cls = `side-${side} ${side === "left" || side === "right" ? "narrow" : "wide"}${folded ? " folded" : ""}`;
  await page.evaluate((html) => window.__h(html), `${h.qwin}<div class="isl-col ${cls}">${folded ? h.pill : h.isl}</div>`);
  await wait(450);
  const m = await page.evaluate(() => { const c = document.querySelector(".isl-col").getBoundingClientRect(), cv = document.querySelector(".cv"), p = document.querySelector(".isl-col .pill"), hd = document.getElementById("hd");
    const pr = p && p.getBoundingClientRect(), inside = !!pr && pr.top >= c.top - 0.5 && pr.bottom <= c.bottom + 0.5 && pr.left >= c.left - 0.5 && pr.right <= c.right + 0.5;
    const col = document.querySelector(".isl-col");
    return { bg: getComputedStyle(col).backgroundColor, pillBg: p ? getComputedStyle(p).backgroundColor : "", w: Math.round(c.width), h: Math.round(c.height), cvw: cv.clientWidth, cvh: cv.clientHeight, pill: p ? { w: Math.round(pr.width), h: Math.round(pr.height), wm: getComputedStyle(p.querySelector(".pl-now") || p).writingMode, inside } : null, hd: !!hd && !hd.hidden, overflow: cv.scrollWidth > cv.clientWidth + 1 }; });
  await shot(page, `col-${side}-${folded ? "folded" : "open"}`);
  await page.close();
  return m;
}

test("R-2 — 작업실 창 안에서 섬을 접으면 옆 칸이 알약(두께 56 · 손잡이 없음 · 옆은 세로 알약)이고 캔버스가 넓어진다, 네 가장자리 모두 · 넘침 0", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const h = await islandHTML(browser);
    assert.ok(h.pill.includes('class="pill'), "접은 섬의 알약 HTML");
    for (const side of ["right", "left", "top", "bottom"]) {
      const o = await measure(browser, h, side, false), f = await measure(browser, h, side, true);
      const vertical = side === "left" || side === "right";
      assert.equal(vertical ? f.w : f.h, 56, `${side} 접힘 — 칸 두께 56: ${JSON.stringify(f)}`);
      assert.ok(!f.hd && o.hd, `${side} — 접히면 손잡이 없음`);
      assert.ok(vertical ? f.cvw > o.cvw + 200 : f.cvh > o.cvh + 200, `${side} — 캔버스가 넓어진다: 펼침 ${o.cvw}×${o.cvh} → 접힘 ${f.cvw}×${f.cvh}`);
      assert.ok(f.pill && (vertical ? f.pill.wm === "vertical-rl" && f.pill.w <= 56 : f.pill.wm === "horizontal-tb" && f.pill.h <= 56), `${side} — ${vertical ? "세로" : "가로"} 알약: ${JSON.stringify(f.pill)}`);
      assert.equal(f.bg, "rgba(0, 0, 0, 0)", `${side} — 접힌 칸의 바탕은 작업실 바탕이 비친다(F-65 파란 줄 없음): ${f.bg}`); assert.notEqual(o.bg, "rgba(0, 0, 0, 0)", `${side} — 펼친 칸은 네이비 그대로`);
      assert.ok(f.pillBg && f.pillBg !== "rgba(0, 0, 0, 0)", `${side} — 남색은 알약 하나: ${f.pillBg}`);
      assert.ok(!f.overflow && !o.overflow, `${side} — 넘침 0`); assert.ok(f.pill.inside, `${side} — 알약이 칸 안에 다 들어간다(잘리지 않음): ${JSON.stringify(f.pill)}`);
    }
  } finally { await browser.close(); }
});
