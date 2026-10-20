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

// ── F-40(2026-10-20, 이재엽 "작아진 오버레이 상태일때에 플로로가 말하는 내용들이 … 짤려서 안보여", 버튼 "창을 잠깐 늘림") — 넘김 문서 fable-handoff-2026-10-20-petit-say.md 5절 ──
// 앱인 척(window.floeApp 흉내 — resize를 기록). #ex=1 → Esc(한 줄) 뒤 카드의 한마디가 플로로를 따라 한 줄 아래에 뜬다(약 4.2초).
const SHIM = () => {
  window.__resizes = [];
  const noop = () => {}, off = () => () => {};
  window.floeApp = { resize: (w, h) => window.__resizes.push([performance.now(), Math.round(w), Math.round(h)]), connect: noop, disconnect: noop, expand: noop, openHub: noop, openSettings: noop,
    saveKey: noop, clearKey: noop, onCursor: off, onEnter: off, onExpanded: off, onNotch: off };
};
test("F-40: 한 줄로 접힌 섬에서 말풍선이 뜨면 창이 말풍선 아래까지 늘고(가로는 그대로), 사라지면 한 줄 높이로 돌아온다. 펼친 섬에서는 창이 그대로", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluateOnNewDocument(SHIM);
    await page.goto(url("navigator/index.html#ex=1"), { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); });
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1"), { waitUntil: "load" }); await wait(900);
    await page.keyboard.press("Escape"); await wait(900);   // 한 줄 — 카드의 한마디가 플로로를 따라와 아래에 뜬다
    const mid = await page.evaluate(() => {
      const b = document.querySelector(".pop-say.show"), r = b && b.getBoundingClientRect(), last = window.__resizes.at(-1);
      const pill = document.querySelector(".pill").getBoundingClientRect();
      return { say: !!b, bottom: r && Math.round(r.bottom), right: r && Math.round(r.right), w: last && last[1], h: last && last[2], pillRight: Math.round(pill.right), widths: [...new Set(window.__resizes.slice(-3).map((x) => x[1]))] };
    });
    assert.ok(mid.say, "한 줄에서 말풍선이 떠 있어야 재는 뜻이 있다");
    assert.ok(mid.bottom <= mid.h, `말풍선 아래(${mid.bottom})가 창 높이(${mid.h}) 안에 있어야 — 넘김 문서: 전에는 112 > 60`);
    assert.ok(mid.right <= mid.w, `말풍선 오른쪽(${mid.right})이 창 너비(${mid.w}) 안에`);
    assert.ok(mid.w - mid.pillRight < 40, `창 가로는 한 줄 너비 그대로여야(창 ${mid.w} · 한 줄 오른쪽 ${mid.pillRight}) — 넓어지면 한 줄이 밀린다`);
    await wait(5500);   // 말풍선이 사라진 뒤
    const after = await page.evaluate(() => ({ say: !!document.querySelector(".pop-say.show"), h: window.__resizes.at(-1)[2] }));
    assert.ok(!after.say && after.h <= 70, `사라지면 한 줄 높이로 돌아와야: ${JSON.stringify(after)}`);
    // 펼친 섬 — 말풍선이 섬 안이라 창은 섬 크기 그대로
    await page.click(".pill"); await wait(500);
    const before = await page.evaluate(() => window.__resizes.at(-1)[2]);
    await page.click("[data-act=pet]"); await wait(400);
    const opened = await page.evaluate(() => ({ say: !!document.querySelector(".pop-say.show"), h: window.__resizes.at(-1)[2] }));
    assert.ok(opened.say && Math.abs(opened.h - before) < 2, `펼친 섬에서는 창이 그대로여야: 전 ${before} · 뒤 ${JSON.stringify(opened)}`);
  } finally { await browser.close(); }
});

// ── C-15 먹이 주기 · C-16 책 안의 단계 문서(2026-10-20, 넘김 문서 fable-handoff-2026-10-20-feed.md 4절) ──
test("C-15: 글 파일을 섬에 놓으면 주소가 그대로인 채 먹이 주기 정리 화면이 뜨고, 비밀번호 구간은 '못 먹어요', 확인하면 보내는 글에 그 구간이 없다. 그림 파일은 거절", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.evaluate(() => localStorage.removeItem("navigator-prototype:v1"));
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(300);
    const before = await page.evaluate(() => location.href);
    const r = await page.evaluate(async () => {
      const dt = new DataTransfer();
      dt.items.add(new File(["# 신청 화면\n회원이 행사를 보고 신청해요.\n\n# 서버\n비밀번호: 예시용-자리표시"], "memo.md", { type: "text/markdown" }));   // secret-check: allow
      const nav = document.getElementById("nav");
      nav.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
      nav.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
      await new Promise((r) => setTimeout(r, 500));
      return { href: location.href, rows: [...document.querySelectorAll(".feedlist li")].map((li) => [li.className, li.querySelector("small").textContent]), title: document.querySelector(".lvc .say")?.textContent || "" };
    });
    assert.equal(r.href, before, "파일로 넘어가지 않는다");
    assert.equal(r.rows.length, 2, `구간 둘: ${JSON.stringify(r)}`);
    assert.equal(r.rows[0][0], "keep"); assert.equal(r.rows[1][0], "skip"); assert.ok(r.rows[1][1].includes("비밀번호"), r.rows[1][1]);
    // 확인 → 연습 모드라 정해진 장면만 알지만, 보낼 글(기록 text)에 비밀번호 구간은 없어야 한다
    await page.click("[data-act=feed-confirm]"); await wait(400);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1") || "{}"));
    assert.ok(!String(saved.text).includes("자리표시") && !JSON.stringify(saved.fed || []).includes("자리표시"), "빠진 구간의 글이 어디에도 없다");
    assert.equal(saved.fed[0].left.length, 1); assert.equal(saved.fed[0].kept, 1);
    const said = await page.evaluate(async () => { const dt = new DataTransfer(); dt.items.add(new File(["x"], "photo.png", { type: "image/png" })); document.body.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt })); await new Promise((r) => setTimeout(r, 300)); return document.querySelector(".pop-say")?.textContent || ""; });
    assert.ok(said.includes("글 파일"), `그림 파일은 거절: "${said}"`);
  } finally { await browser.close(); }
});

test("C-16: 탭은 셋(이번 단계 · 단계 지도 · 도서관), #ex=1&tab=doc은 책 안 1단계 문서를 열고 초안 → 다시 봐 주세요 → 확정이 그 자리에서 된다, 책 목록에 '확정', 화면 글에 '설계도'가 없다", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&tab=doc"), { waitUntil: "load" }); await wait(400);
    const s = await page.evaluate(() => ({ tabs: [...document.querySelectorAll(".tabs .ti")].map((t) => t.dataset.tab), head: document.querySelector(".bdoc-head b")?.textContent || "", draft: !!document.querySelector("[data-act=draft]") }));
    assert.deepEqual(s.tabs, ["today", "map", "lib"]);
    assert.ok(s.head.includes("1단계") && s.draft, JSON.stringify(s));
    await page.click("[data-act=draft]"); await wait(400);
    await page.evaluate(() => { const t = document.querySelector("textarea[data-act=doc]"); t.value = t.value.replace(/\[채워 주세요: [^\]]*\]/g, "채움"); t.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.click("[data-act=review]"); await wait(400);
    await page.click("[data-act=confirm-doc]"); await wait(400);
    assert.ok(await page.evaluate(() => !!document.querySelector("[data-act=reopen-doc]")), "확정한 문서(고쳐 쓰기)");
    await page.click("[data-act=lib-doc-close]"); await wait(300);
    const ok = await page.evaluate(() => [...document.querySelectorAll(".bdoc.ok b")].map((b) => b.textContent));
    assert.deepEqual(ok, ["아이디어 정리표"]);
    const text = await page.evaluate(() => document.getElementById("nav").innerText);
    assert.ok(!text.includes("설계도"), "화면 글에 '설계도'가 없다");
  } finally { await browser.close(); }
});
