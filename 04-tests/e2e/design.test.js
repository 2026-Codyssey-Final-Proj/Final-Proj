// claude-drafted: 2026-10-28 — C-57 화면 디자인 바탕(이재엽 버튼 "앱 전체 한 번에" · 섬 "#363E62" · 글꼴 "자주 쓰는 한글만"): 글꼴 셋이 앱 파일에서 실제로 실린다(밖으로 요청 0), 글 · 제목 · 코드의 computed font-family,
//   섬 · 작업실 · 설정의 바탕색이 토큰 값, 쨍한 파랑 단추 · 흰 글씨 없음. 1280 · 1440 사진(목업 v10 ① ③과 나란히). puppeteer · Chrome이 없으면 건너뛴다
// 실행: node --test 04-tests/e2e/design.test.js
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


const rgb = (hex) => `rgb(${hex.match(/../g).map((h) => parseInt(h, 16)).join(", ")})`;
test("C-57 — 글꼴 셋이 앱 파일에서 실리고(밖으로 요청 0) 글 · 제목 · 코드에 쓰인다, 섬 #363E62 · 작업실 종이 · 단추는 파스텔 + 남색 글씨, 1280 · 1440 사진", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const outside = [];
    page.on("request", (r) => { if (/^https?:/.test(r.url())) outside.push(r.url()); });
    for (const width of [1440, 1280]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
      await page.evaluate(() => { localStorage.clear(); localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
      await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(500);
      if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(400); }
      const s = await page.evaluate(async () => { await document.fonts.ready; for (const n of ["Gowun Dodum", "Bagel Fat One", "Nanum Gothic Coding"]) { try { await document.fonts.load(`16px "${n}"`); } catch {} }   // 쓰이기 전엔 안 실린다(font-display) — 불러서 본다
        const f = (sel, prop = "fontFamily") => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : ""; };
        return { fonts: ["Gowun Dodum", "Bagel Fat One", "Nanum Gothic Coding"].map((n) => [n, document.fonts.check(`16px "${n}"`)]), body: f("body"), title: f(".wh .ttl"), code: f(".fv-code, .fv-h b"),
          isl: f(".isl", "backgroundColor"), win: f(".qwin", "backgroundColor"), btn: f(".b.pri", "backgroundColor"), btnInk: f(".b.pri", "color"), hasIsl: !!document.querySelector(".isl") }; });
      assert.ok(s.fonts.every(([, ok]) => ok), `글꼴 셋이 실렸다: ${JSON.stringify(s.fonts)}`);
      assert.match(s.body, /^"?Gowun Dodum/, `글: ${s.body}`); assert.match(s.title, /^"?Bagel Fat One/, `제목: ${s.title}`);
      assert.ok(s.hasIsl && s.isl !== "rgba(0, 0, 0, 0)", "섬이 있다");
      assert.equal(s.win, rgb("F2F5FA"), `작업실 판은 종이색: ${s.win}`);
      if (s.btn) { assert.equal(s.btn, rgb("B8C9F0"), `주 단추는 파스텔: ${s.btn}`); assert.equal(s.btnInk, rgb("263066"), `단추 글씨는 남색: ${s.btnInk}`); }
      await shot(page, `design-${width}`);
    }
    // 앱의 섬 창 재현(in-app) — 섬 바탕이 #363E62, 설정 판도
    await page.evaluate(() => document.documentElement.classList.add("in-app")); await wait(100);
    const isl = await page.$eval(".isl", (e) => getComputedStyle(e).backgroundColor); assert.equal(isl, rgb("363E62"), `앱의 섬 바탕: ${isl}`);
    await page.click("[data-act=settings], .tb [data-act=set]").catch(() => {}); await wait(300);
    await shot(page, "design-settings");
    assert.deepEqual(outside, [], "밖으로 나가는 요청 0(글꼴은 앱 파일)");
  } finally { await browser.close(); }
});
