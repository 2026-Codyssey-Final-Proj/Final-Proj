// claude-drafted: 2026-10-20 — PR #139 리뷰의 고침 셋(F-36 · F-37 · F-38, 넘김 문서 fable-handoff-2026-10-20-review139.md). 글을 맞대어 보는 시험이 못 잡던 것이라
// 상자 크기 · 주소 · 저장값을 실제 브라우저에서 잰다. responsive.test.js처럼 puppeteer · Chrome이 없으면 건너뛴다(팀원 컴퓨터에서 막히지 않게).
//   F-36 기본 화면 → 서재 → '← 작업 화면으로' = 기본 화면(움직임 줄이기 · 새로 고침에도), 바이브 코딩에서 갔으면 바이브 코딩, 주소로 연 #tab=lib는 바이브 코딩 그대로
//   F-37 서고로 잠수할 때 물이 다 커진 순간 판이 화면을 덮는다(섬이 가운데 · 왼쪽 · 오른쪽)
//   F-38 앱인 척(window.floeApp 흉내) 빠르게 펼쳤다 접으면 접기 움직임(0.24초) 안에 작은 크기로의 resize가 오지 않는다
// 실행: node --test 04-tests/e2e/modes-flow.test.js
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
if (skip) console.log(`⚠️ e2e/modes-flow: ${skip}`);

const launch = () => puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
// 처음 설정을 끝낸 상태로(인사 · 처음 설정 창이 끼어들지 않게)
async function fresh(browser, reduced = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
  await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
  return page;
}
const placeOf = (page) => page.evaluate(() => ({
  base: !!document.querySelector(".mc.base") && !!document.querySelector(".grid4"), home: document.querySelector(".ti.home")?.getAttribute("aria-pressed") || "",
  tab: document.querySelector('.tabs .ti[aria-selected="true"]')?.dataset.tab || "", place: sessionStorage.getItem("floe:place"), hash: location.hash }));
async function toLibraryAndBack(page) {
  await page.click("[data-act=lib-enter]");
  await page.waitForFunction(() => location.href.includes("library/index.html"), { timeout: 6000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("dive-in"), { timeout: 8000 });
  await page.click("a.lib-out");
  await page.waitForFunction(() => location.href.includes("navigator/index.html"), { timeout: 6000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("surfacing"), { timeout: 6000 });
  await wait(300);
}

test("F-36: 기본 화면 → 서재 → '← 작업 화면으로' → 기본 화면으로 돌아온다(집 눌림 · 단추 넷 · 기록 base), 새로 고침해도 기본 화면", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(300);
    await toLibraryAndBack(page);
    let s = await placeOf(page);
    assert.ok(s.base && s.home === "true", `돌아온 뒤 기본 화면이어야: ${JSON.stringify(s)}`);
    assert.notEqual(s.place, "vibe", "기록이 바이브 코딩이면 안 된다");
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => !!document.querySelector(".mc.base, .tabs"), { timeout: 8000 });   // 주소 끝이 없으니 켤 때 인사(3.4초)가 돈 뒤
    await wait(200);
    s = await placeOf(page);
    assert.ok(s.base && s.home === "true", `새로 고침 뒤에도 기본 화면이어야: ${JSON.stringify(s)}`);
  } finally { await browser.close(); }
});

test("F-36: 움직임 줄이기에서도 같다(&back 없이 가던 길)", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser, true);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(300);
    await toLibraryAndBack(page);
    const s = await placeOf(page);
    assert.ok(s.base && s.home === "true", `움직임 줄이기: 돌아온 뒤 기본 화면이어야: ${JSON.stringify(s)}`);
  } finally { await browser.close(); }
});

test("F-36: 바이브 코딩(도서관 탭)에서 갔으면 바이브 코딩 · 도서관 탭으로, 주소로 연 #tab=lib는 바이브 코딩 그대로(녹화 · e2e 장면)", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(300);
    await page.click("[data-act=go-vibe]"); await wait(200);
    await page.click("[data-act=tab][data-tab=lib]"); await wait(300);
    await toLibraryAndBack(page);
    let s = await placeOf(page);
    assert.ok(!s.base && s.home === "false" && s.tab === "lib", `바이브 코딩 · 도서관 탭이어야: ${JSON.stringify(s)}`);
    await page.evaluate(() => sessionStorage.clear());
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#tab=lib"), { waitUntil: "load" }); await wait(300);
    s = await placeOf(page);
    assert.ok(!s.base && s.tab === "lib", `#tab=lib는 바이브 코딩이어야: ${JSON.stringify(s)}`);
  } finally { await browser.close(); }
});

test("F-37: 서고로 잠수할 때 물이 다 커진 순간(0.76초) 판이 화면을 덮는다 — 섬이 가운데 · 왼쪽 끝 · 오른쪽 끝", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    const short = [];
    for (const [name, css] of [["가운데", ""], ["왼쪽", "left:0;transform:none"], ["오른쪽", "left:auto;right:0;transform:none"]]) {
      await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(300);
      const box = await page.evaluate(async (css) => {
        const nav = document.getElementById("nav"); nav.style.cssText = css;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        window.FloeDive.out(document.querySelector(".isl"), "#stay");
        await new Promise((r) => setTimeout(r, 760));
        const r = document.querySelector(".dive.out .pane").getBoundingClientRect();
        return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), W: innerWidth, H: innerHeight };
      }, css);
      if (!(box.left <= 0 && box.top <= 0 && box.right >= box.W && box.bottom >= box.H)) short.push(`${name}: ${JSON.stringify(box)}`);
    }
    assert.deepEqual(short, [], `물이 화면을 다 덮지 못한 자리: ${short.join(" · ")}`);
  } finally { await browser.close(); }
});

test("F-38: 앱인 척 — 빠르게 펼쳤다 접으면 접기 움직임(0.24초) 안에 작은 크기로의 resize가 오지 않는다", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluateOnNewDocument(() => {
      window.__resizes = [];
      const noop = () => {}, off = () => () => {};
      window.floeApp = { resize: (w, h) => window.__resizes.push([performance.now(), Math.round(w), Math.round(h)]), connect: noop, disconnect: noop, expand: noop, openHub: noop, openSettings: noop,
        saveKey: noop, clearKey: noop, onCursor: off, onEnter: off, onExpanded: off, onNotch: off };
    });
    await page.goto(url("navigator/index.html#ex=1"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); });
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1"), { waitUntil: "load" }); await wait(400);
    await page.keyboard.press("Escape"); await wait(600);   // 한 줄로
    const r = await page.evaluate(async () => {
      const before = window.__resizes.length;
      document.querySelector(".pill").click();            // 펼침(0.3초)
      await new Promise((r) => setTimeout(r, 100));
      const t0 = performance.now();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));   // 0.1초 뒤 접힘(0.24초)
      await new Promise((r) => setTimeout(r, 450));
      const after = window.__resizes.slice(before).map(([t, w, h]) => [Math.round(t - t0), w, h]);
      const pill = document.querySelector(".pill");
      return { after, pillNow: !!pill, isl: !!document.querySelector(".isl") };
    });
    assert.ok(r.pillNow && !r.isl, `접힌 상태여야: ${JSON.stringify(r)}`);
    // 접기 시작 뒤 240ms 안에 온 resize 중 폭이 펼친 섬(940+)보다 작은 것 = 움직임보다 먼저 줄인 것
    const early = r.after.filter(([t, w]) => t >= 0 && t < 240 && w < 900);
    assert.deepEqual(early, [], `접기 움직임 안에 작은 크기로 줄였다: ${JSON.stringify(r.after)}`);
  } finally { await browser.close(); }
});
