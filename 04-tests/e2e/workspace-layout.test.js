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

// ② 칸의 내용(R-5) · 단계 칩(R-9) — 3단계 연습 장면에서 글로 본다
test("R-9 · R-5 — 3단계 장면: 칩은 '시작 ✓ · 1 ✓ V.1 · 2 ✓ V.2 · 3 기능 정리 · 4 ~ 8', ④ 저장에 올라갈 파일 이름, 관문에 남은 기준 수, ③ 기록 카드는 정한 줄, 큰 글에 전문 용어 없음", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(400);
    if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(300); }
    await page.click("[data-act=qtab][data-tab=canvas]"); await wait(300);
    const s = await page.evaluate(() => ({
      chips: [...document.querySelectorAll(".cv-stg span")].map((x) => x.textContent.trim()),
      head: document.querySelector(".qwin .wh .wst")?.textContent || "",
      files: [...document.querySelectorAll(".cv-c.c4 .cv-files li")].map((x) => x.textContent),
      gate: document.querySelector(".cv-c.c6")?.textContent || "",
      cards: [...document.querySelectorAll(".cv-c.c3 .cv-cards span")].map((x) => x.textContent.trim()),
      big: [...document.querySelectorAll(".cvb .ch, .cvb .cv-now, .cv-stg")].map((x) => x.textContent).join(" "),
    }));
    assert.deepEqual(s.chips, ["시작 ✓", "1 ✓ V.1", "2 ✓ V.2", "3 기능 정리", "4 ~ 8"], `머리 '${s.head}'와 같은 번호`);
    assert.ok(s.head.startsWith("3단계"), s.head);
    assert.deepEqual(s.files, ["docs/03-requirements/requirements.md", "docs/PRD.md", "docs/decisions.md"], "④ 저장 — 단계 문서 · 기획서 · 결정 기록");
    assert.match(s.gate, /남은 기준 \d/, s.gate);
    assert.equal(s.cards.length, 5, "3단계 할 일 다섯 = 카드 다섯"); assert.ok(s.cards.every((x) => /^[ⅠⅡⅢⅣⅤ]/.test(x)), s.cards.join(" | "));
    for (const j of ["EARS", "MoSCoW", "Kano", "RTM", "PRD", "Planguage"]) assert.ok(!s.big.includes(j), `큰 글에 '${j}'`);
  } finally { await browser.close(); }
});

// F-66 · F-67(2026-10-27 이재엽 "캔버스가 움직이는것도 안되고" · "지금 폴더들도 폴더라는 느낌이 안들어") — 작업실 창(win.html)에서 실제로 끌고 · ⌘/Ctrl+휠로 키우고 · 맞춤으로 돌아오는지,
//   섬이 다시 그려 보내도(1초마다도 온다) 보던 자리인지, 예시 파일 칸의 폴더가 그림 · 꺾쇠 · 굵은 이름으로 보이는지 — claude-drafted: 2026-10-27
test("F-66 · F-67 — 캔버스: 끌면 옮겨지고 · ⌘/Ctrl+휠은 커서 자리에서 1.2배 · 섬이 다시 보내도 그 자리 · '맞춤'으로 처음처럼 · 키 + 0. 파일 칸: 폴더는 그림 · 꺾쇠 · 굵게", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const h = await islandHTML(browser), html = `${h.qwin}<div class="isl-col side-right narrow">${h.isl}</div>`;
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { window.floeApp = { onWinHtml: (f) => { window.__h = f; }, onDock() {}, winEvent() {} }; });
    await page.setViewport({ width: 1728, height: 1000 });
    await page.goto(url("navigator/win.html#quest"), { waitUntil: "load" });
    await page.evaluate((x) => window.__h(x), html); await wait(250);
    const now = () => page.evaluate(() => { const cv = document.querySelector(".cv"), r = (s) => document.querySelector(s).getBoundingClientRect();
      return { free: cv.classList.contains("free"), z: parseFloat(cv.style.getPropertyValue("--cvz")) || 0, c2: r(".cv-c.c2").left, c3: { x: r(".cv-c.c3").left, y: r(".cv-c.c3").top }, label: document.querySelector('[data-cv="fit"]').textContent }; });
    const box = await page.$eval(".cv", (cv) => { const r = cv.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const fit0 = await now();
    assert.ok(!fit0.free && fit0.label === "맞춤", "처음은 맞춤");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "pan-0-fit.png") });
    // 끌기 — 칸 아래쪽 가운데(단추는 오른쪽 아래)에서 왼쪽 위로 120 · 50
    const sx = box.x + box.w * 0.45, sy = box.y + box.h - 30;
    await page.mouse.move(sx, sy); await page.mouse.down(); await page.mouse.move(sx - 60, sy - 25, { steps: 5 }); await page.mouse.move(sx - 120, sy - 50, { steps: 5 }); await page.mouse.up(); await wait(50);
    const d = await now();
    assert.ok(d.free, "끌면 옮기기(.free)"); assert.ok(Math.abs(fit0.c2 - d.c2 - 120) <= 3, `끈 만큼 옮겨짐 — ② ${fit0.c2} → ${d.c2}`); assert.match(d.label, /^\d+%$/, d.label);
    // ⌘/Ctrl+휠 — 커서 아래의 판 자리는 그대로, 1.2배
    const at = { x: d.c3.x + 10, y: d.c3.y + 10 };
    await page.mouse.move(at.x, at.y); await page.keyboard.down("Control"); await page.mouse.wheel({ deltaY: -100 }); await page.keyboard.up("Control"); await wait(50);
    const z = await now();
    assert.ok(Math.abs(z.z / d.z - 1.2) < 0.01, `1.2배 — ${d.z} → ${z.z}`);
    assert.ok(Math.abs(z.c3.x - (d.c3.x - 10 * 0.2)) <= 1.5 && Math.abs(z.c3.y - (d.c3.y - 10 * 0.2)) <= 1.5, "커서 자리를 중심으로 커진다");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "pan-1-moved.png") });
    // 섬이 다시 그려 보내도 그 자리 · 배율
    await page.evaluate((x) => window.__h(x), html); await wait(100);
    const again = await now();
    assert.deepEqual([again.free, again.z, Math.round(again.c2)], [true, z.z, Math.round(z.c2)], "다시 그려도 그대로");
    // 맞춤 → 처음처럼
    await page.click('[data-cv="fit"]'); await wait(50);
    const back = await now();
    assert.ok(!back.free && back.label === "맞춤" && Math.abs(back.c2 - fit0.c2) <= 1, "맞춤으로 처음처럼");
    // 키 — 칸에 포커스: + 는 1.25배, 0은 맞춤
    await page.focus(".cv"); await page.keyboard.press("Equal"); await wait(300);
    const k = await now(); assert.ok(k.free && k.label !== "맞춤", "+ 키로 크게");
    await page.keyboard.press("Digit0"); await wait(50); assert.equal((await now()).label, "맞춤", "0 키로 맞춤");
    // F-67 — 예시 파일 칸(서버 없이 연 화면)의 폴더
    const dirs = await page.evaluate(() => [...document.querySelectorAll(".wnav .fn li.dir")].map((li) => ({ name: li.textContent.trim(), icon: !!li.querySelector(".fi svg"), chev: !!li.querySelector(".chev-w svg"),
      open: li.querySelector(".chev-w").classList.contains("on"), weight: getComputedStyle(li).fontWeight })));
    assert.deepEqual(dirs.map((x) => x.name), ["docs", "src"]);
    assert.ok(dirs.every((x) => x.icon && x.chev && x.weight === "600"), JSON.stringify(dirs)); assert.deepEqual(dirs.map((x) => x.open), [true, false], "docs는 펼침 · src는 접힘");
    const inner = await page.$$eval(".wnav .fn li.d2", (ls) => ls.map((l) => getComputedStyle(l, "::before").borderLeftStyle));
    assert.ok(inner.length === 4 && inner.every((s) => s === "solid"), "안쪽 파일에 안내선");
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "folders.png"), clip: { x: 0, y: 40, width: 260, height: 360 } });
  } finally { await browser.close(); }
});
