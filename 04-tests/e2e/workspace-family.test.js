// claude-drafted: 2026-10-29 — 작업실 개편 TASK PR ②(T05 · T03 · T13): C-62 머리 줄 하나 · 섬 단추 묶음은 섬 쪽 끝 · 메아리 색 대비, F-77 섬 옆 칸 420에서 칩이 잘리지 않는다(C-60 '더 보기' 하나),
//   C-58 섬이 펼쳐져 있으면 캔버스에 '지금 하는 일' · 작은 플로로 · 보드 · 배울 말 · 파일 카드가 없다. 작업실 창(win.html#quest)에 섬이 보내는 HTML을 넣어 1440 × 900 · 1280 × 800 · 1024 × 768에서 잰다.
//   FLOE_SHOTS=<폴더>를 주면 사진을 남긴다(PRD 3절과 맞대기). puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/workspace-family.test.js
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
if (skip) console.log(`⚠️ e2e/workspace-family: ${skip}`);
const SHOTS = process.env.FLOE_SHOTS || "";

// WCAG 대비 — rgb(…) 글자에서
const lum = (rgb) => { const c = rgb.match(/\d+/g).slice(0, 3).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// 섬이 작업실에 보내는 HTML — 3단계 연습 장면(#ex=2&q=quest)의 캔버스 탭: 머리 줄(.wh) · 판(.qwin) · 섬(.isl) · 접은 알약(.pill)
async function islandHTML(browser) {
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
  await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
  await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(400);
  if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(300); }
  await page.click("[data-act=qtab][data-tab=canvas]"); await wait(300);
  if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(400); }   // C-61(PR ③): 칸이 비어 섬이 가운데면 '옆으로' — 이 시험은 옆 칸의 섬을 잰다
  const h = await page.evaluate(() => ({ wh: document.querySelector(".wsx > .wh").outerHTML, qwin: document.querySelector(".qwin").outerHTML, isl: document.querySelector(".isl").outerHTML }));
  await page.click("[data-act=fold]"); await wait(400);
  h.pill = await page.evaluate(() => document.querySelector(".pill")?.outerHTML || "");
  // 접힌 섬(알약)일 때의 캔버스 — colFolded()가 참이면 '지금 하는 일' 줄이 돌아온다
  h.qwinFolded = await page.evaluate(() => document.querySelector(".qwin")?.outerHTML || "");
  await page.close();
  return h;
}
async function openWin(browser, h, { width, height, colW = 420, folded = false }) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((w) => { window.floeApp = { onWinHtml: (f) => { window.__h = f; }, onDock() {}, winEvent() {} }; try { localStorage.setItem("floe:col-w", String(w)); } catch {} }, colW);
  await page.setViewport({ width, height });
  await page.goto(url("navigator/win.html#quest"), { waitUntil: "load" });
  await page.evaluate((html) => window.__h(html), `${h.wh}${folded ? h.qwinFolded : h.qwin}<div class="isl-col side-right narrow${folded ? " folded" : ""}">${folded ? h.pill : h.isl}</div>`);
  await wait(500);
  return page;
}

test("C-62 — 1440 · 1280 · 1024 작업 중 화면: 위 줄은 하나(머리 .wh 하나, 옆 칸의 섬에는 .tb 없음), 창 전체 폭, 섬 단추 묶음(집 · 설정 · 열어 두기 · 접기)은 오른쪽 끝 · 섬 옆 칸 위. 메아리(고른 탭 · 지금 칩 · 파일 칸 지금) 대비 4.5:1 이상", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const h = await islandHTML(browser);
    assert.ok(h.wh.includes('class="hisl"') && h.wh.includes('data-act="fold"'), "머리 줄에 섬 단추 묶음");
    for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768]]) {
      const page = await openWin(browser, h, { width, height });
      const m = await page.evaluate(() => {
        const whs = document.querySelectorAll(".wh"), wh = whs[0], r = wh.getBoundingClientRect(), hisl = document.querySelector(".wh .hisl"), hr = hisl && hisl.getBoundingClientRect();
        const col = document.querySelector(".isl-col").getBoundingClientRect(), tabs = document.querySelector(".wh .wtabs").getBoundingClientRect();
        const cs = (sel, prop) => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : ""; };
        return { whs: whs.length, tbs: document.querySelectorAll(".isl-col .tb").length, whLeft: r.left, whRight: r.right, inner: innerWidth, hislRight: hr ? hr.right : -1, hislLeft: hr ? hr.left : -1, tabsRight: tabs.right, colLeft: col.left,
          tab: [cs(".wh .wtabs button[aria-selected=true]", "backgroundColor"), cs(".wh .wtabs button[aria-selected=true]", "color")], chip: [cs(".wh .cv-stg span.cur", "backgroundColor"), cs(".wh .cv-stg span.cur", "color")],
          now: [cs(".wnav .fn li.st-now", "backgroundColor"), cs(".wnav .fn li.st-now", "color")], islBg: cs(".isl-col .isl", "backgroundColor"), colBg: cs(".isl-col", "backgroundColor"), glass: cs(".isl", "backdropFilter"),
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      const tag = `${width}×${height}`;
      assert.equal(m.whs, 1, `${tag} — 머리 줄 하나(지금 ${m.whs})`); assert.equal(m.tbs, 0, `${tag} — 옆 칸의 섬에 위 줄 없음`);
      assert.ok(m.whLeft <= 1 && m.whRight >= m.inner - 1, `${tag} — 머리 줄이 창 전체 폭: ${m.whLeft} ~ ${m.whRight} / ${m.inner}`);
      assert.ok(m.hislRight > m.tabsRight && m.hislLeft >= m.colLeft - 120, `${tag} — 섬 단추 묶음은 탭 오른쪽 · 섬 옆 칸 가까이(묶음 ${m.hislLeft}~${m.hislRight}, 칸 ${m.colLeft})`);
      for (const [name, [bg, fg]] of [["고른 탭", m.tab], ["지금 칩", m.chip], ["파일 칸 지금", m.now]]) if (bg && fg) assert.ok(ratio(bg, fg) >= 4.5, `${tag} — ${name} 메아리 대비 ${ratio(bg, fg).toFixed(2)} (${bg} / ${fg})`);
      assert.equal(m.islBg, "rgb(54, 62, 98)", `${tag} — 섬 카드는 남색 #363E62`); assert.equal(m.colBg, "rgb(233, 238, 246)", `${tag} — 옆 칸은 작업실 바탕 #E9EEF6`);
      assert.ok(m.glass === "none" || m.glass === "", `${tag} — 유리 없음(backdrop-filter ${m.glass})`);
      assert.ok(!m.overflow, `${tag} — 옆으로 넘치지 않는다`);
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `family-${width}x${height}.png`) }); }
      await page.close();
    }
  } finally { await browser.close(); }
});

test("F-77 · C-60 — 섬 옆 칸 420(그리고 320)에서 칩 줄은 '더 보기' 하나라 글자가 잘리지 않고 넘치지 않는다. C-58 — 섬이 펼쳐져 있으면 캔버스에 '지금 하는 일' · 작은 플로로 · 보드 · 배울 말 · 파일 카드가 없고, 접히면 '지금 하는 일'이 돌아온다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const h = await islandHTML(browser);
    for (const colW of [420, 320]) {
      const page = await openWin(browser, h, { width: 1440, height: 900, colW });
      const m = await page.evaluate(() => {
        const col = document.querySelector(".isl-col"), more = document.querySelector(".isl-col .opts.more"), btn = more && more.querySelector(".mtg");
        const clipped = [...document.querySelectorAll(".isl-col .opts .b")].filter((b) => b.scrollWidth > b.clientWidth + 1).map((b) => b.textContent.trim());
        return { colW: Math.round(col.getBoundingClientRect().width), more: !!more, chips: more ? more.querySelectorAll(".b:not(.mtg)").length : -1, btn: btn ? btn.textContent.trim() : "", clipped, over: more ? more.scrollWidth > more.clientWidth + 1 : false,
          gone: ["cv-now", "cv-flo", "cv-bd", "cv-learn", "cv-file"].filter((c) => document.querySelector(`.cvb .${c}`)), tbOver: !![...document.querySelectorAll(".wh .ti")].find((b) => { const r = b.getBoundingClientRect(); return r.right > innerWidth; }) };
      });
      assert.ok(m.more && m.chips === 0 && /더 보기/.test(m.btn), `옆 칸 ${colW} — 칩은 '더 보기' 하나로 접힘: ${JSON.stringify(m)}`);
      assert.deepEqual(m.clipped, [], `옆 칸 ${colW} — 잘린 칩: ${m.clipped.join(", ")}`); assert.ok(!m.over, `옆 칸 ${colW} — 칩 줄이 넘치지 않는다`);
      assert.deepEqual(m.gone, [], `옆 칸 ${colW} — 섬이 펼쳐져 있으면 캔버스에 없어야 할 것: ${m.gone.join(", ")}`);
      assert.ok(!m.tbOver, "머리 줄 단추가 창 밖으로 나가지 않는다");
      await page.close();
    }
    const page = await openWin(browser, h, { width: 1440, height: 900, folded: true });
    const f = await page.evaluate(() => ({ now: !!document.querySelector(".cvb .cv-now"), flo: !!document.querySelector(".cvb .cv-flo"), colW: Math.round(document.querySelector(".isl-col").getBoundingClientRect().width) }));
    assert.ok(f.now && f.flo && f.colW === 56, `접히면 '지금 하는 일' 줄 · 작은 플로로가 돌아오고 칸은 56: ${JSON.stringify(f)}`);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "family-1440-folded.png") });
    await page.close();
  } finally { await browser.close(); }
});
