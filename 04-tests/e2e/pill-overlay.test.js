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

// C-55(2026-10-28): R-1(켤 때 위 가운데 알약 + 알약 안 인사)을 바꿈 — 켜면 바로 작업실(.qwin, 캔버스) + 접힌 알약 + 알약 옆 말풍선(.hello-bub). 인사 줄은 하루 한 번, 말풍선은 켤 때마다(8초 뒤 사라짐)
test("C-55 — 주소 없이 켜면 작업실이 바로 열리고 섬은 접힌 알약, 알약 옆 말풍선(시간대 인사 · 멈춘 곳 · 섬 펼치기 / 나중에). 같은 날 다시 켜면 인사 줄 없이. 주소 끝 장면 · 처음 설정 전은 전처럼", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.goto(url("navigator/index.html"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" });
    await page.evaluate(() => localStorage.removeItem("floe:greet-day")); await page.reload({ waitUntil: "load" }); await wait(400);   // 첫 켬 — 인사 줄은 켤 때 바로 '오늘 했다'로 적힌다(C-55)
    const look = () => page.evaluate(() => ({ qwin: !!document.querySelector(".qwin"), canvas: !!document.querySelector(".qwin .cv"), pill: !!document.querySelector(".pill"), isl: !!document.querySelector(".isl"),
      bub: document.querySelector(".hello-bub")?.textContent.replace(/\s+/g, " ").trim() || "", greeting: document.documentElement.classList.contains("greeting"),
      later: !!document.querySelector(".hello-bub [data-act=boot-later]"), open: !!document.querySelector(".hello-bub [data-act=pill]"), day: localStorage.getItem("floe:greet-day") }));
    let s = await look();
    assert.ok(s.qwin && s.canvas && s.pill && !s.isl, `켜면 작업실(캔버스) + 접힌 알약: ${JSON.stringify(s)}`);
    assert.ok(/아침|점심|오후|수고|밤/.test(s.bub), `말풍선에 시간대 인사 한 줄: ${s.bub}`); assert.match(s.bub, /멈춘 곳|시작 전/, "멈춘 곳 한 줄");
    assert.ok(s.later && s.open, "섬 펼치기 / 나중에 단추"); assert.ok(!s.greeting, "알약 안 인사 움직임은 없다(말풍선으로)");
    assert.match(s.day || "", /^\d{4}-\d{2}-\d{2}$/, "오늘 인사했다");
    const b = await page.$eval(".hello-bub", (el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, in: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }; });
    assert.ok(b.in && b.w > 120, `말풍선이 화면 안에: ${JSON.stringify(b)}`);
    for (const sel of [".hello-bub [data-act=boot-later]", ".hello-bub [data-act=pill]"]) { const h = await page.$eval(sel, (el) => el.getBoundingClientRect().height); assert.ok(h >= 44, `${sel} 44px: ${h}`); }
    await shot(page, "boot-workspace");
    await page.click(".hello-bub [data-act=boot-later]"); await wait(300);
    s = await look(); assert.ok(!s.bub && s.qwin && s.pill, `나중에 → 말풍선만 사라진다: ${JSON.stringify(s)}`);
    await page.reload({ waitUntil: "load" }); await wait(400);
    s = await look(); assert.ok(s.qwin && s.pill && s.bub && !/아침|점심|오후|수고|밤/.test(s.bub), `같은 날 다시 켜면 말풍선은 뜨되 인사 줄은 없음: ${s.bub}`);
    await page.click(".hello-bub [data-act=pill]"); await wait(500);
    assert.ok(await page.$(".isl .mc.chat"), "섬 펼치기 → 섬이 펼쳐진다"); assert.ok(!(await page.$(".hello-bub")), "펼치면 말풍선은 없다");
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(150);
    assert.ok((await page.$(".isl .mc.chat")) && !(await page.$(".pill")) && !(await page.$(".hello-bub")), "주소 끝 장면은 기본 화면(시험 · 녹화)");
    await page.evaluate(() => localStorage.removeItem("floe:setup:v1"));
    await page.goto(url("navigator/index.html"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(400);
    s = await look(); assert.ok(!s.qwin && !s.bub && (await page.$("#floe-setup")), `처음 설정이 필요하면 설정부터: ${JSON.stringify(s)}`);
  } finally { await browser.close(); }
});

// claude-drafted: 2026-10-29 — 두승현 "바 형 UI를 누르면 바로 작업실로": 작업실 밖에 떠 있는 알약을 누르면 섬 대화창을 거치지 않고 작업실(+ 접힌 알약)로. 작업실 안의 알약은 전처럼 섬을 펼친다
test("작업실 밖의 알약을 누르면 바로 작업실 — 섬은 접힌 알약 그대로, 작업실 안의 알약을 누르면 섬이 펼쳐진다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.reload({ waitUntil: "load" }); await wait(300);
    await page.keyboard.press("Escape"); await wait(500);   // 떠 있는 섬 → 알약(작업실 없음)
    const look = () => page.evaluate(() => ({ qwin: !!document.querySelector(".qwin"), pill: !!document.querySelector(".pill"), isl: !!document.querySelector(".isl") }));
    let s = await look(); assert.ok(s.pill && !s.qwin && !s.isl, `작업실 밖의 알약: ${JSON.stringify(s)}`);
    await page.click(".pill"); await wait(500);
    s = await look(); assert.ok(s.qwin && s.pill && !s.isl, `누르면 작업실 + 접힌 알약(섬 대화창은 안 펼침): ${JSON.stringify(s)}`);
    assert.ok(await page.$(".qwin .cv"), "작업실은 캔버스 탭부터");
    await page.click(".pill"); await wait(500);
    s = await look(); assert.ok(s.qwin && s.isl && !s.pill, `작업실 안의 알약은 섬을 펼친다: ${JSON.stringify(s)}`);
    await page.click("[data-act=qwin]"); await wait(500);   // 작업실 닫기(×) — 펼친 섬 대화창이 남지 않고 알약으로(두승현 2026-10-29 "복귀할 때 기존 UI가 그대로")
    s = await look(); assert.ok(s.pill && !s.qwin && !s.isl, `작업실을 닫으면 알약: ${JSON.stringify(s)}`);
  } finally { await browser.close(); }
});

// claude-drafted: 2026-10-29 — F-86: 작업실 + 접힌 알약에서 머리 줄 설정을 눌러도 설정 판이 안 보였다(설정 판은 펼친 섬 안에만 그려진다).
//   두승현 "별도의 모달창을 중앙에" — 작업실이 열려 있으면 설정은 작업실 위 가운데 모달(섬은 그대로). 닫기는 × · Esc · 바깥 누름
test("작업실에서 설정을 누르면 가운데 모달 — 섬은 그대로, ×  · Esc · 바깥을 누르면 닫히고 작업실은 남는다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("navigator/index.html#base"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.goto(url("navigator/index.html"), { waitUntil: "load" }); await page.reload({ waitUntil: "load" }); await wait(500);   // 켤 때 — 작업실 + 접힌 알약(C-55)
    const look = () => page.evaluate(() => ({ qwin: !!document.querySelector(".qwin"), pill: !!document.querySelector(".pill"), modal: !!document.querySelector(".set-modal [data-act=set-tab]"), inIsl: !!document.querySelector(".isl [data-act=set-tab]") }));
    const open = async () => { await page.click(".wh [data-act=settings]"); await wait(400); };
    let s = await look(); assert.ok(s.qwin && s.pill && !s.modal, `켤 때: ${JSON.stringify(s)}`);
    await open();
    s = await look(); assert.ok(s.qwin && s.pill && s.modal && !s.inIsl, `설정 → 가운데 모달, 섬은 알약 그대로: ${JSON.stringify(s)}`);
    // 모달 층은 작업실 전체를 덮고(앱 창에서는 창 전체 — win.html #root), 모달은 그 가운데. 브라우저 판은 .nav의 transform 때문에 층이 작업실 틀(.wsx) 크기다
    const box = await page.evaluate(() => { const m = document.querySelector(".set-modal").getBoundingClientRect(), l = document.querySelector(".set-layer").getBoundingClientRect(), w = document.querySelector(".wsx").getBoundingClientRect();
      return { dx: Math.abs((m.left + m.right) / 2 - (l.left + l.right) / 2), dy: Math.abs((m.top + m.bottom) / 2 - (l.top + l.bottom) / 2), covers: l.left <= w.left && l.top <= w.top && l.right >= w.right && l.bottom >= w.bottom, in: m.left >= 0 && m.top >= 0 && m.right <= innerWidth && m.bottom <= innerHeight }; });
    assert.ok(box.covers && box.in && box.dx < 2 && box.dy < 2, `작업실을 덮은 층의 가운데 · 화면 안: ${JSON.stringify(box)}`);
    await page.click(".set-modal [data-act=set-tab][data-tab=keep]"); await wait(300);
    assert.equal(await page.$eval(".set-modal [data-act=set-tab][data-tab=keep]", (el) => el.getAttribute("aria-selected")), "true", "모달 안의 탭이 바뀐다");
    await page.click(".set-modal .set-x"); await wait(300);
    s = await look(); assert.ok(s.qwin && !s.modal, `× → 닫힘, 작업실은 그대로: ${JSON.stringify(s)}`);
    await open(); await page.keyboard.press("Escape"); await wait(300);
    s = await look(); assert.ok(s.qwin && !s.modal, `Esc → 모달만 닫힘: ${JSON.stringify(s)}`);
    await open(); const l = await page.$eval(".set-layer", (el) => { const r = el.getBoundingClientRect(); return { x: r.left + 10, y: r.bottom - 10 }; });
    await page.mouse.click(l.x, l.y); await wait(300);   // 층 안 · 모달 바깥(왼쪽 아래 구석)
    s = await look(); assert.ok(s.qwin && !s.modal, `바깥 누름 → 닫힘: ${JSON.stringify(s)}`);
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
  const qwin = await page.evaluate(() => document.querySelector(".wsx > .wh").outerHTML + document.querySelector(".qwin").outerHTML), isl = await page.evaluate(() => document.querySelector(".isl").outerHTML);   // C-62(PR ②): 머리 줄 + 판
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
  const BUB = '<div class="hello-bub" role="status"><b class="hb-hi">좋은 오후예요!</b><span class="hb-now">멈춘 곳: 3단계 꼭 필요한 기능 정리하기 · 지금: 나온 곳 잇기</span><div class="hb-acts"><button type="button" data-act="pill">섬 펼치기</button><button type="button" class="ghost" data-act="boot-later">나중에</button></div></div>';   // C-55 켤 때 말풍선(app.js bootBubble과 같은 모양)
  await page.evaluate((html) => window.__h(html), `${h.qwin}<div class="isl-col ${cls}${folded ? " has-bub" : ""}">${folded ? h.pill + BUB : h.isl}</div>`);
  await wait(900);   // 0.3초 움직임 뒤 — 전체 시험(81개 파일)과 같이 돌 때 450ms로는 가끔 덜 끝났다(2026-10-28)
  const m = await page.evaluate(() => { const c = document.querySelector(".isl-col").getBoundingClientRect(), cv = document.querySelector(".cv"), p = document.querySelector(".isl-col .pill"), hd = document.getElementById("hd");
    const pr = p && p.getBoundingClientRect(), inside = !!pr && pr.top >= c.top - 0.5 && pr.bottom <= c.bottom + 0.5 && pr.left >= c.left - 0.5 && pr.right <= c.right + 0.5;
    const col = document.querySelector(".isl-col"), bb = document.querySelector(".hello-bub"), br = bb && bb.getBoundingClientRect();
    const bub = br ? { w: Math.round(br.width), in: br.left >= 0 && br.right <= innerWidth && br.top >= 0 && br.bottom <= innerHeight, over: !(br.right <= c.left || br.left >= c.right || br.bottom <= c.top || br.top >= c.bottom) && !(br.left >= c.left && br.right <= c.right && br.top >= c.top && br.bottom <= c.bottom) } : null;
    return { bub, bg: getComputedStyle(col).backgroundColor, pillBg: p ? getComputedStyle(p).backgroundColor : "", w: Math.round(c.width), h: Math.round(c.height), cvw: cv.clientWidth, cvh: cv.clientHeight, pill: p ? { w: Math.round(pr.width), h: Math.round(pr.height), wm: getComputedStyle(p.querySelector(".pl-now") || p).writingMode, inside } : null, hd: !!hd && !hd.hidden, overflow: cv.scrollWidth > cv.clientWidth + 1 }; });
  await shot(page, `col-${side}-${folded ? "folded" : "open"}`);
  await page.close();
  return m;
}

test("R-2 — 작업실 창 안에서 섬을 접으면 옆 칸이 알약(두께 56 · 손잡이 없음 · 세로 알약)이고 캔버스가 넓어진다, 오른쪽(2026-10-28 합의로 자리는 하나) · 넘침 0", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const h = await islandHTML(browser);
    assert.ok(h.pill.includes('class="pill'), "접은 섬의 알약 HTML");
    for (const side of ["right"]) {
      const o = await measure(browser, h, side, false), f = await measure(browser, h, side, true);
      const vertical = side === "left" || side === "right";
      assert.equal(vertical ? f.w : f.h, 56, `${side} 접힘 — 칸 두께 56: ${JSON.stringify(f)}`);
      assert.ok(!f.hd && o.hd, `${side} — 접히면 손잡이 없음`);
      assert.ok(vertical ? f.cvw > o.cvw + 200 : f.cvh > o.cvh + 200, `${side} — 캔버스가 넓어진다: 펼침 ${o.cvw}×${o.cvh} → 접힘 ${f.cvw}×${f.cvh}`);
      assert.ok(f.pill && (vertical ? f.pill.wm === "vertical-rl" && f.pill.w <= 56 : f.pill.wm === "horizontal-tb" && f.pill.h <= 56), `${side} — ${vertical ? "세로" : "가로"} 알약: ${JSON.stringify(f.pill)}`);
      assert.equal(f.bg, "rgb(226, 233, 244)", `${side} — 접힌 칸의 바탕은 오른쪽 칸과 같은 옆 칸 색(F-90, 2026-10-29 두승현) — 남색 띠는 아니다(F-65): ${f.bg}`); assert.notEqual(o.bg, "rgba(0, 0, 0, 0)", `${side} — 펼친 칸은 바탕이 있다(C-62부터 파스텔, 남색은 섬 카드만)`);
      assert.ok(f.pillBg && f.pillBg !== "rgba(0, 0, 0, 0)", `${side} — 남색은 알약 하나: ${f.pillBg}`);
      assert.ok(f.bub && f.bub.in && f.bub.w >= 200, `${side} — 켤 때 말풍선(C-55)이 접힌 칸 밖 · 창 안에 다 보인다: ${JSON.stringify(f.bub)}`);
      assert.ok(!f.overflow && !o.overflow, `${side} — 넘침 0`); assert.ok(f.pill.inside, `${side} — 알약이 칸 안에 다 들어간다(잘리지 않음): ${JSON.stringify(f.pill)}`);
    }
  } finally { await browser.close(); }
});

// claude-drafted: 2026-10-29 — 두승현 "초안 작성 시 플로로 눈동자가 이전 UI처럼 커서를 따라가지 않고 고정": 작업실이 열리면 섬은 작업실 창(win.html)의 옆 칸에 그려지는데,
//   눈 따라가기(seal.js follow)는 섬 창(app.js)에서만 돌았다 — 작업실 창은 seal.js를 불러오지도 않았다. 이제 작업실 창 안의 커서를 따라간다
test("작업실 창 — 옆 칸 섬의 플로로 눈이 커서를 따라가고, 섬이 다시 그려도 그 자리를 지킨다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const h = await islandHTML(browser);
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { window.floeApp = { onWinHtml: (f) => { window.__h = f; }, onDock() {}, winEvent() {} }; });
    await page.setViewport({ width: 1440, height: 860 });
    await page.goto(url("navigator/win.html#quest"), { waitUntil: "load" });
    const html = `${h.qwin}<div class="isl-col side-right narrow">${h.isl}</div>`;
    await page.evaluate((x) => window.__h(x), html); await wait(500);
    const eyes = () => page.evaluate(() => { const t = document.querySelector(".isl svg.cat .c-eyes")?.getAttribute("transform") || ""; const m = t.match(/^translate\(([-\d.]+) ([-\d.]+)\)/); return m ? { x: +m[1], y: +m[2] } : null; });
    assert.ok(await page.$(".isl svg.cat .c-eyes"), "옆 칸 섬에 플로로가 있다");
    await page.mouse.move(40, 430); await wait(200);
    const left = await eyes();
    await page.mouse.move(1430, 430); await wait(200);
    const right = await eyes();
    assert.ok(left && right && left.x < right.x - 2, `커서를 따라 눈이 옮겨 간다: 왼쪽 ${JSON.stringify(left)} · 오른쪽 ${JSON.stringify(right)}`);
    await page.evaluate((x) => window.__h(x), html); await wait(300);   // 섬이 다시 보냄(같은 내용)
    const again = await eyes();
    assert.ok(again && Math.abs(again.x - right.x) < 0.5, `다시 그려도 마지막 커서 쪽 그대로: ${JSON.stringify(again)}`);
  } finally { await browser.close(); }
});
