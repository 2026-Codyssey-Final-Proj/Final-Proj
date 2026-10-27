// claude-drafted: 2026-10-27 — C-42 R-1 · R-11(이재엽 버튼 "화면을 채움" · "줌 + 모자라면 다시 배치", F-61-1 · F-61-11): 작업실 창의 캔버스 판이 어느 화면 크기에서도 옆으로 넘치지 않는다.
//   앱을 띄우지 않고 같은 화면을 만든다(넘김 문서 fable-handoff-2026-10-27-workspace.md 5절): 섬(index.html)이 작업실에 보내는 HTML(작업실 판 + 섬 옆 칸)을 꺼내
//   작업실 창 화면(win.html#quest)에 window.floeApp 흉내로 넣고, 화면 크기 넷(1024 · 1280 · 1440 · 1728)과 섬 자리(옆 · 아래)에서 캔버스 칸을 잰다.
//   줌(판 1100×640을 0.85배 이상으로 담을 수 있을 때 — 칸 935×544 이상)과 다시 배치(격자 — 640 이상 두 줄 · 미만 세로 한 줄)가 규칙대로 갈리는지도 본다.
//   FLOE_SHOTS=<폴더>를 주면 화면마다 사진을 남긴다(PR의 비교 사진). responsive.test.js처럼 puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/workspace-layout.test.js
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
if (skip) console.log(`⚠️ e2e/workspace-layout: ${skip}`);
const SHOTS = process.env.FLOE_SHOTS || "";

const ZOOM_W = Math.ceil(1100 * 0.85), ZOOM_H = Math.ceil(640 * 0.85);   // 935 · 544 — app.css @container
// 섬이 작업실에 보내는 HTML — 3단계 연습 장면(#ex=2&q=quest)의 캔버스 탭
async function islandHTML(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
  await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
  await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(400);
  if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(300); }
  await page.click("[data-act=qtab][data-tab=canvas]"); await wait(300);
  const h = await page.evaluate(() => ({ qwin: document.querySelector(".qwin").outerHTML, isl: document.querySelector(".isl").outerHTML }));
  await page.close();
  return h;
}
// 작업실 창 화면에 넣고 재기 — side: right(옆 칸 420) | bottom(아래 칸 360)
async function measure(browser, h, { width, height, side }) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { window.floeApp = { onWinHtml: (f) => { window.__h = f; }, onDock() {}, winEvent() {} }; });
  await page.setViewport({ width, height });
  await page.goto(url("navigator/win.html#quest"), { waitUntil: "load" });
  const col = side === "bottom" ? "side-bottom wide" : "side-right narrow";
  await page.evaluate((html) => window.__h(html), `${h.qwin}<div class="isl-col ${col}">${h.isl}</div>`);
  await wait(250);
  const m = await page.evaluate(() => {
    const cv = document.querySelector(".cv"), b = document.querySelector(".cvb"), cs = getComputedStyle(b), nav = document.querySelector(".wnav");
    return { cw: cv.clientWidth, ch: cv.clientHeight, sw: cv.scrollWidth, bw: b.getBoundingClientRect().width, display: cs.display, cols: cs.gridTemplateColumns.split(" ").length,
      pageOverflow: document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth, nav: !!nav && getComputedStyle(nav).display !== "none",
      col: document.querySelector(".isl-col").getBoundingClientRect().width, font: parseFloat(getComputedStyle(document.querySelector(".cv-c.c2 p:not(.ch)")).fontSize) };
  });
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `ws-${width}x${height}-${side}.png`) }); }
  await page.close();
  return m;
}
const SCREENS = [[1024, 700], [1280, 760], [1440, 860], [1728, 1000]];

test("R-11 · R-1 — 화면 1024 · 1280 · 1440 · 1728, 섬 옆 · 아래: 캔버스 판이 옆으로 넘치지 않고, 칸이 935×544 이상이면 줌(판 ≥ .85배) · 아니면 격자(640 이상 두 줄 · 미만 세로 한 줄, 글자 크기 그대로)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const h = await islandHTML(browser);
    assert.ok(h.qwin.includes('class="cvb"'), "캔버스 탭의 판");
    const rows = [];
    for (const [width, height] of SCREENS) for (const side of ["right", "bottom"]) {
      const m = await measure(browser, h, { width, height, side });
      rows.push({ width, height, side, ...m });
      const tag = `${width}×${height} 섬 ${side}: 칸 ${m.cw}×${m.ch}`;
      assert.ok(m.sw <= m.cw + 1, `${tag} — 옆으로 넘침(scrollWidth ${m.sw})`);
      assert.ok(!m.pageOverflow, `${tag} — 창 자체가 옆으로 넘침`);
      const zoom = m.cw >= ZOOM_W && m.ch >= ZOOM_H;
      if (zoom) {
        assert.equal(m.display, "block", `${tag} — 줌이어야`);
        const u = Math.min(m.cw / 1100, m.ch / 640, 1);
        assert.ok(Math.abs(m.bw - 1100 * u) <= 2 && u >= 0.85, `${tag} — 판 ${m.bw}px(배율 ${(m.bw / 1100).toFixed(3)})는 칸에 맞춘 줌 ≥ .85여야`);
      } else {
        assert.equal(m.display, "grid", `${tag} — 다시 배치(격자)여야`);
        assert.equal(m.cols, m.cw >= 640 ? 5 : 1, `${tag} — ${m.cw >= 640 ? "두 줄(칸 셋 + 화살표 둘)" : "세로 한 줄"}`);
        assert.ok(Math.abs(m.font - 12.5) < 0.6, `${tag} — 글자 크기는 설정 그대로(12.5px), 지금 ${m.font}`);
        assert.ok(Math.abs(m.bw - m.cw) <= 1, `${tag} — 격자는 칸 너비만큼`);
      }
    }
    const big = rows.find((r) => r.width === 1728 && r.side === "bottom"), small = rows.find((r) => r.width === 1024 && r.side === "right");
    assert.equal(big.display, "block", "1728 · 섬 아래 — 넓으니 줌"); assert.equal(small.display, "grid", "1024 · 섬 옆 — 좁으니 다시 배치");
    console.log(`  잰 값: ${rows.map((r) => `${r.width}×${r.height}/${r.side} 칸 ${r.cw}×${r.ch} ${r.display === "block" ? `줌 ${(r.bw / 1100).toFixed(2)}` : `격자 ${r.cols === 5 ? "두 줄" : "한 줄"}`}${r.nav ? "" : " (파일 칸 숨김)"}`).join(" · ")}`);
  } finally { await browser.close(); }
});
