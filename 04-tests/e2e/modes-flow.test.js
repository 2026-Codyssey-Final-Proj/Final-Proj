// claude-drafted: 2026-10-20 — PR #139 리뷰의 고침 셋(F-36 · F-37 · F-38, 넘김 문서 fable-handoff-2026-10-20-review139.md). 글을 맞대어 보는 시험이 못 잡던 것이라
// 상자 크기 · 주소 · 저장값을 실제 브라우저에서 잰다. responsive.test.js처럼 puppeteer · Chrome이 없으면 건너뛴다(팀원 컴퓨터에서 막히지 않게).
//   F-36 기본 화면 → 서재 → '← 작업 화면으로' = 기본 화면(움직임 줄이기 · 새로 고침에도), 바이브 코딩에서 갔으면 바이브 코딩, 주소로 연 #tab=lib는 바이브 코딩 그대로
//   F-37 서고로 잠수할 때 물이 다 커진 순간 판이 화면을 덮는다(섬이 가운데 · 왼쪽 · 오른쪽)
//   F-38 앱인 척(window.floeApp 흉내) 빠르게 펼쳤다 접으면 접기 움직임(0.24초) 안에 작은 크기로의 resize가 오지 않는다
//   C-9 · C-3 책 보기 설정(2026-10-20, 넘김 문서 c4-views ①) — 칸 끄기 · 탭 구조 · 세션별 · 새로 고침 유지 · '전체 화면'이면 서고의 펼친 책, 서고의 설정도 같은 저장
//   FR-17 섬에서 허용 · 거절(2026-10-20, 넘김 문서 c4-views ②) — 예시 승인 카드 둘, 거절하면 사라짐, 되돌리기 어려운 일은 '정말 허용'을 한 번 더, 할 일 적기 → 정리(연습) → 넘기기(연습은 보내지 않음)
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

// 서재 잠시 뺌(이재엽 2026-10-23, C-29 · FR-8) — app.js의 SHELF_ON이 false인 동안 서재로 들어가는 길(F-36 · 책 보기 '전체 화면')은 시험하지 않는다. true로 돌리면 다시 돈다
const shelfOff = /const SHELF_ON = false;/.test(fs.readFileSync(path.join(FRONT, "navigator/app.js"), "utf8"));
const noShelf = skip || (shelfOff && "서재 잠시 뺌(2026-10-23) — SHELF_ON이 true가 되면 다시 돈다");
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
// 2026-10-21 C-22(게임식 디자인 1차 뼈대): 기본 화면의 단추 넷 · 탭 넷은 없고 채팅 중심 섬(.mc.chat)이다. 서재는 설정 창의 '서재로 가기' · 퀘스트 창(.qwin)의 서고 탭, 탭은 퀘스트 창의 것(quest · tree · lib)
const placeOf = (page) => page.evaluate(() => ({
  chat: !!document.querySelector(".mc.chat") && !document.querySelector(".mc.base"), home: document.querySelector(".ti.home")?.getAttribute("aria-pressed") || "",
  qwin: !!document.querySelector(".qwin"), qtab: document.querySelector('.wsx > .wh .wtabs [aria-selected="true"]')?.dataset.tab || "", place: sessionStorage.getItem("floe:place"), hash: location.hash }));
// 서재로 — 보이는 '서재로 가기'(설정 창 · 퀘스트 창 서고 탭)가 없으면 설정 창을 열어서
async function toLibraryAndBack(page) {
  if (!(await page.$("[data-act=lib-enter]"))) { await page.click("[data-act=settings]"); await wait(300); }
  await page.click("[data-act=lib-enter]");
  await page.waitForFunction(() => location.href.includes("library/index.html"), { timeout: 6000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("dive-in"), { timeout: 8000 });
  await page.click("a.lib-out");
  await page.waitForFunction(() => location.href.includes("navigator/index.html"), { timeout: 6000 });
  await page.waitForFunction(() => !document.documentElement.classList.contains("surfacing"), { timeout: 6000 });
  await wait(300);
}

test("F-36: 채팅(기본) → 설정 창의 서재로 가기 → '← 작업 화면으로' → 채팅으로 돌아온다(집 눌림 · 창 닫힘 · 기록 base), 새로 고침해도 채팅", { skip: noShelf }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(300);
    await toLibraryAndBack(page);
    let s = await placeOf(page);
    assert.ok(s.chat && s.home === "true" && !s.qwin, `돌아온 뒤 채팅이어야: ${JSON.stringify(s)}`);
    assert.notEqual(s.place, "vibe", "기록이 바이브 코딩이면 안 된다");
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => !!document.querySelector(".mc.chat"), { timeout: 8000 });   // 주소 끝이 없으니 켤 때 인사(3.4초)가 돈 뒤
    await wait(200);
    s = await placeOf(page);
    assert.ok(s.chat && s.home === "true", `새로 고침 뒤에도 채팅이어야: ${JSON.stringify(s)}`);
  } finally { await browser.close(); }
});

test("F-36: 움직임 줄이기에서도 같다(&back 없이 가던 길)", { skip: noShelf }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser, true);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base"), { waitUntil: "load" }); await wait(300);
    await toLibraryAndBack(page);
    const s = await placeOf(page);
    assert.ok(s.chat && s.home === "true", `움직임 줄이기: 돌아온 뒤 채팅이어야: ${JSON.stringify(s)}`);
  } finally { await browser.close(); }
});

test("F-36: 장면(바이브 코딩)의 퀘스트 창 서고 탭에서 갔으면 돌아와도 기록은 바이브 코딩 그대로, 주소로 연 #tab=lib는 퀘스트 창의 서고 탭(녹화 · e2e 장면)", { skip: noShelf }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&tab=lib"), { waitUntil: "load" }); await wait(300);
    let s = await placeOf(page);
    assert.ok(s.chat && s.qwin && s.qtab === "lib" && s.place === "vibe", `#tab=lib는 퀘스트 창의 서고 탭 · 바이브 코딩이어야: ${JSON.stringify(s)}`);
    await toLibraryAndBack(page);
    s = await placeOf(page);
    assert.ok(s.chat && s.place === "vibe", `돌아와도 기록은 바이브 코딩: ${JSON.stringify(s)}`);
    await page.click(".tb [data-act=qwin-toggle]"); await wait(200);   // 2026-10-24 C-35: 명령 네 칸을 빼고 위 줄의 '퀘스트' 단추로 연다
    await page.click("[data-act=qtab][data-tab=quest]"); await wait(200);
    s = await placeOf(page);
    assert.ok(s.qwin && s.qtab === "quest" && (await page.evaluate(() => document.querySelectorAll(".qwin .vtabs").length)) === 0 && await page.$(".qwin .qboard"), `퀘스트 탭 — 세로 줄 없이 지도 띠 + 퀘스트 카드(C-65 · C-66, 2026-10-30): ${JSON.stringify(s)}`);
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
      window.floeApp = { resize: (w, h) => window.__resizes.push([performance.now(), Math.round(w), Math.round(h)]), connect: noop, disconnect: noop, expand: noop, openSettings: noop,
        saveKey: noop, clearKey: noop, onCursor: off, onExpanded: off, onNotch: off };
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
    const said = await page.evaluate(async () => { const dt = new DataTransfer(); dt.items.add(new File(["x"], "photo.png", { type: "image/png" })); document.body.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt })); await new Promise((r) => setTimeout(r, 300)); return [...document.querySelectorAll("[data-log] .msg.floro:not(.now)")].at(-1)?.textContent || ""; });   // 안내는 대화 기록에 남는다(2026-10-25 — 머리 위 말풍선을 뺌)
    assert.ok(said.includes("글 파일"), `그림 파일은 거절: "${said}"`);
  } finally { await browser.close(); }
});

test("C-16: 퀘스트 창의 탭은 셋(퀘스트 · 도전과제 · 책 — 배우기는 2026-10-24 C-35로 도전과제 안에), #ex=1&tab=doc은 서고 탭의 책 안 2단계(코드 1) 문서를 열고 초안 → 다시 봐 주세요 → 확정이 그 자리에서 된다, 책 목록에 '확정', 화면 글에 '설계도'가 없다", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&tab=doc"), { waitUntil: "load" }); await wait(400);
    const s = await page.evaluate(() => ({ tabs: [...document.querySelectorAll(".wsx > .wh .wtabs [role=tab]")].map((t) => t.dataset.tab), head: document.querySelector(".bdoc-head b")?.textContent || "", draft: !!document.querySelector("[data-act=draft]") }));
    assert.deepEqual(s.tabs, ["canvas", "quest", "lib"]);   // C-65(2026-10-30): 노트북 + 도전과제 → 퀘스트 하나   // C-54(2026-10-28): 문서 지도 탭(map)은 도전과제 안의 '상자' 보기로   // C-41 ①(2026-10-26)부터 캔버스가 먼저 — 이 단언은 #212까지 e2e를 못 돌려 낡아 있었다(2026-10-27 고침) · C-45(2026-10-27) 문서 지도 탭이 끝에
    assert.ok(s.head.includes("2단계") && s.draft, `단계 번호는 1~8로(코드 1 = 2단계): ${JSON.stringify(s)}`);
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

// 책 보기 설정(C-9 · C-3 → FR-8 세부, 2026-10-20) — 코드보다 먼저 썼다. 섬의 도서관 탭에서 칸을 끄면 숨기만 하고(내용은 그대로), 탭 구조 · 세션별이 되고, 새로 고침해도 같은 설정이며,
// '전체 화면'을 고르면 서고의 펼친 책으로 가고 서고의 '보기 설정'도 같은 저장(floe:book-view)을 읽고 쓴다
test("C-9 · C-3: 책 보기 설정 — 칸 끄기(내용은 그대로) · 탭 구조 · 세션별(기록 없는 예시 책은 책별로 알림) · 새로 고침 유지 · '전체 화면'이면 서고의 펼친 책 · 서고의 설정도 같은 저장", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.evaluate(() => { localStorage.removeItem("floe:book-view"); localStorage.removeItem("navigator-prototype:v1"); });
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&tab=lib&book=s1&view=1"), { waitUntil: "load" }); await wait(400);
    const keys = () => page.evaluate(() => [...document.querySelectorAll(".bv-sec")].map((x) => x.dataset.k));
    assert.deepEqual(await keys(), ["steps", "decided", "bookmarks", "todos"], "예시 책의 칸 넷 — FIELDS 차례");
    assert.ok(await page.evaluate(() => !!document.querySelector(".bv-panel") && document.querySelector('.bv-opt[data-bv="structure"][data-v="simple"]').getAttribute("aria-pressed") === "true"), "&view=1 — 판이 열리고 기본은 간결");
    await page.click('input[data-bv="field"][data-v="todos"]'); await wait(200);
    assert.deepEqual(await keys(), ["steps", "decided", "bookmarks"], "할 일 칸을 끄면 숨긴다");
    assert.equal(await page.evaluate(() => window.LibData.OPEN.find((b) => b.id === "s1").todos.length), 4, "책의 내용은 그대로");
    await page.click('.bv-opt[data-bv="structure"][data-v="tabs"]'); await wait(200);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".bv-tab")].map((x) => x.dataset.v)), ["steps", "decided", "bookmarks"]);
    assert.deepEqual(await keys(), ["steps"], "탭 구조 — 한 번에 한 칸");
    await page.click('.bv-tab[data-v="bookmarks"]'); await wait(200);
    assert.deepEqual(await keys(), ["bookmarks"]);
    await page.click('.bv-opt[data-bv="view"][data-v="session"]'); await wait(200);
    assert.ok(await page.evaluate(() => (document.querySelector(".bv-note")?.textContent || "").includes("책별로")), "기록이 없는 예시 책은 책별로 보이고 알린다");
    // 새로 고침 — 설정은 남고 판은 닫힌다
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&tab=lib&book=s1"), { waitUntil: "load" }); await wait(400);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("floe:book-view")));
    assert.equal(saved.structure, "tabs"); assert.equal(saved.view, "session"); assert.equal(saved.fields.todos, false);
    assert.ok(await page.evaluate(() => !document.querySelector(".bv-panel") && !!document.querySelector(".bv-note")));
    // '전체 화면' → 서고의 펼친 책(표지 없이), 서고의 보기 설정은 같은 저장을 읽는다
    await page.click("[data-act=bv-open]"); await wait(200);
    if (shelfOff) { assert.ok(!(await page.$('.bv-opt[data-bv="size"]')), "서재를 잠시 뺀 동안은 '전체 화면'(서고로 가는 길)이 없다"); return; }
    await page.click('.bv-opt[data-bv="size"][data-v="full"]');
    await page.waitForFunction(() => location.href.includes("library/index.html"), { timeout: 6000 });
    await page.waitForFunction(() => !document.documentElement.classList.contains("dive-in") && document.getElementById("reader").classList.contains("on"), { timeout: 8000 }); await wait(200);   // 펼친 책이 열릴 때까지(고정 300ms는 가끔 모자랐다, 2026-10-21)
    const rd = await page.evaluate(() => ({ hash: location.hash, on: document.getElementById("reader").classList.contains("on"), cover: document.getElementById("reader").classList.contains("cover"), note: !!document.querySelector("#rd-right .bv-note") }));
    assert.deepEqual(rd, { hash: "#lib-s1", on: true, cover: false, note: true });
    await page.click("#rd-view"); await wait(200);
    assert.equal(await page.evaluate(() => document.querySelector('#reader .bv-opt[data-bv="view"][data-v="session"]').getAttribute("aria-pressed")), "true", "서고의 판도 세션별이 눌려 있다");
    await page.click('#reader .bv-opt[data-bv="view"][data-v="book"]'); await wait(200);
    await page.click('#reader input[data-bv="field"][data-v="todos"]'); await wait(200);
    const after = await page.evaluate(() => ({ s: JSON.parse(localStorage.getItem("floe:book-view")), left: [...document.querySelectorAll("#rd-left .bv-sec")].map((x) => x.dataset.k), right: [...document.querySelectorAll("#rd-right .bv-sec")].map((x) => x.dataset.k) }));
    assert.equal(after.s.view, "book"); assert.equal(after.s.fields.todos, true);
    assert.deepEqual(after.left, ["steps"]); assert.deepEqual(after.right, ["decided"], "탭 구조 — 오른쪽은 고른 칸 하나(첫 칸)");
    // '짧게'를 고르면 열어 둔 책은 작업 화면의 도서관 탭으로
    await page.click('#reader .bv-opt[data-bv="size"][data-v="short"]');
    await page.waitForFunction(() => location.href.includes("navigator/index.html"), { timeout: 6000 }); await wait(400);
    assert.equal(await page.evaluate(() => `${location.hash} ${document.querySelector(".bv-head h3")?.textContent}`), "#tab=lib&book=s1 동아리 행사 등록 앱");
  } finally { await browser.close(); }
});

// FR-17 대화로 일 넘기기 · 섬에서 허용 · 거절(C-4, 2026-10-20) — 서버 없이(FR-10) 예시 카드와 연습 정리만. 진짜 Claude Code는 부르지 않는다
test("FR-17: #base&pane=ai&approve=1 — 승인 카드 둘(보통 · 되돌리기 어려운 일), 거절하면 사라지고, 위험한 일은 '정말 허용'을 한 번 더 묻는다. 할 일 적기 → 요구 문장(연습) → 고쳐서 넘기기(연습은 보내지 않고 예시 카드)", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#base&pane=ai&approve=1"), { waitUntil: "load" }); await wait(500);
    const cards = () => page.evaluate(() => [...document.querySelectorAll(".ap")].map((x) => ({ id: x.dataset.ap, danger: x.classList.contains("danger"), allow: x.querySelector("[data-act=ap-allow]")?.textContent })));
    let c = await cards();
    assert.equal(c.length, 2); assert.deepEqual(c.map((x) => x.danger), [false, true]);
    assert.ok(await page.evaluate(() => (document.querySelector(".aplist .note")?.textContent || "").includes("예시")), "예시라고 알린다");
    const text = await page.evaluate(() => document.getElementById("nav").innerText);
    for (const w of ["허락을 기다려요", "허용", "거절", "할 일 적기"]) assert.ok(text.includes(w), w);
    for (const w of ["diff", "permission", "설계도", "판정"]) assert.ok(!text.includes(w), `화면 글에 '${w}'`);
    // 보통 일 거절 → 사라진다
    await page.click(`.ap[data-ap="${c[0].id}"] [data-act=ap-deny]`); await wait(300);
    c = await cards(); assert.equal(c.length, 1); assert.equal(c[0].danger, true);
    // 위험한 일 허용 → 한 번 더 → 정말 허용 → 사라진다
    await page.click(`.ap[data-ap="${c[0].id}"] [data-act=ap-allow]`); await wait(300);
    c = await cards(); assert.equal(c.length, 1, "한 번 눌러서는 사라지지 않는다"); assert.equal(c[0].allow, "정말 허용");
    assert.ok(await page.evaluate(() => (document.querySelector(".ap-danger")?.textContent || "").includes("정말")));
    await page.click("[data-act=ap-unsure]"); await wait(200);
    assert.equal((await cards())[0].allow, "허용", "'아니요'면 되돌아온다");
    await page.click(`.ap[data-ap="${c[0].id}"] [data-act=ap-allow]`); await wait(200);
    await page.click(`.ap[data-ap="${c[0].id}"] [data-act=ap-allow]`); await wait(300);
    assert.equal((await cards()).length, 0);
    // 할 일 적기 → 정리(연습) → 줄 고치기 → 넘기기(연습) → 예시 카드가 다시 뜨고 '넘겼어요 — 연습'
    assert.ok(await page.evaluate(() => document.querySelector("[data-act=task-tidy]").disabled), "빈 글이면 정리 단추가 꺼져 있다");
    await page.type("#task-text", "회원 신청 화면 만들어 줘. 마감 알림도 넣어 줘"); await wait(100);
    await page.click("[data-act=task-tidy]"); await wait(300);
    const lines = await page.evaluate(() => document.querySelector("textarea[data-act=task-lines]")?.value || "");
    assert.deepEqual(lines.split("\n"), ["회원 신청 화면 만들어 줘", "마감 알림도 넣어 줘"]);
    await page.evaluate(() => { const t = document.querySelector("textarea[data-act=task-lines]"); t.value += "\n관리자가 승인하는 화면"; t.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.click("[data-act=task-send]"); await wait(400);
    assert.ok(await page.evaluate(() => (document.querySelector(".tbox.sent b")?.textContent || "").includes("연습")));
    assert.equal((await cards()).length, 2, "연습은 예시 카드를 보인다");
    await page.click("[data-act=task-reset]"); await wait(200);
    assert.ok(await page.evaluate(() => !!document.querySelector("#task-text")));
  } finally { await browser.close(); }
});

// ── 앱 9.0.0 섬 묶음(2026-10-20, 이재엽 "모든 요구사항들을 … 하나도 빠짐없이") — 코드보다 먼저 썼다 ──
test("C-20: 설정 '접히기까지' 단추(5 · 10 · 15 · 30 · 60초, 기본 15)를 고르면 이 컴퓨터에 남고, 마우스가 나가면 그 시간 뒤 접힌다 — 게이지바도 테두리 빛도 없다(빛은 2026-10-29 두승현 결정으로 뺌)", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.evaluate(() => localStorage.removeItem("floe:fold-delay"));
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1"), { waitUntil: "load" }); await wait(400);
    await page.click("[data-act=settings]"); await wait(300);
    await page.click("[data-act=set-tab][data-tab=view]"); await wait(200);   // 설정 판의 보기 탭(2026-10-25)
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".fold-opt")].map((x) => Number(x.dataset.i))), [5, 10, 15, 30, 60]);
    assert.equal(await page.evaluate(() => document.querySelector('.fold-opt[aria-pressed="true"]')?.dataset.i), "15", "기본 15초(지금 값)");
    await page.click('.fold-opt[data-i="5"]'); await wait(300);
    assert.equal(await page.evaluate(() => localStorage.getItem("floe:fold-delay")), "5");
    await page.click("[data-act=settings]"); await wait(200);
    await page.evaluate(() => { const p = document.querySelector('[data-act=pin][aria-pressed="true"]'); if (p) p.click(); });
    await page.mouse.move(5, 850); await wait(400);
    assert.ok(!(await page.$(".isl .glow")) && !(await page.$(".cd")), "테두리 빛도 게이지바도 없다");
    await wait(3000); assert.ok(await page.$(".isl"), "5초 전에는 펼친 그대로");
    await wait(2500); assert.ok(!(await page.$(".isl")) && (await page.$(".pill")), "마우스가 나간 뒤 5초가 지나면 접힌다");
    // 새로 고침해도 5초
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1"), { waitUntil: "load" }); await wait(400);
    await page.click("[data-act=settings]"); await wait(200);
    await page.click("[data-act=set-tab][data-tab=view]"); await wait(200);
    assert.equal(await page.evaluate(() => document.querySelector('.fold-opt[aria-pressed="true"]')?.dataset.i), "5");
  } finally { await browser.close(); }
});

test("C-18: 파일을 섬 위로 끌면 파란 먹이 층('플로로에게 먹이를 주세요' + 폴더 안 물고기)이 섬을 덮고, 자식을 지나도 깜빡이지 않으며, 벗어나거나 놓으면 거둔다", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1"), { waitUntil: "load" }); await wait(400);
    const drag = (type, sel) => page.evaluate((type, sel) => { const dt = new DataTransfer(); dt.items.add(new File(["# 글"], "a.md")); (sel ? document.querySelector(sel) : document.body).dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt })); }, type, sel);
    const shown = () => page.evaluate(() => { const l = document.querySelector(".feedlayer"); return l ? l.classList.contains("show") : false; });
    await drag("dragenter"); await wait(400);   // 나타남 움직임(0.24초)이 끝난 뒤 잰다
    assert.equal(await shown(), true);
    const s = await page.evaluate(() => { const l = document.querySelector(".feedlayer"), n = document.getElementById("nav").getBoundingClientRect(), r = l.getBoundingClientRect(); return { text: l.textContent, fish: !!l.querySelector(".fl-fish"), cover: Math.abs(r.left - n.left) < 2 && Math.abs(r.width - n.width) < 2 }; });
    assert.ok(s.text.includes("플로로에게 먹이를 주세요") && s.fish && s.cover, JSON.stringify(s));
    await drag("dragenter", ".isl"); await drag("dragleave", ".isl"); await wait(100);   // 자식을 지나는 짝 — 층은 그대로
    assert.equal(await shown(), true, "자식을 지날 때 깜빡이지 않는다");
    await drag("dragleave"); await wait(150);
    assert.equal(await shown(), false, "벗어나면 거둔다");
    await drag("dragenter"); await wait(100); await drag("drop"); await wait(500);
    assert.equal(await shown(), false, "놓으면 거두고 먹이 주기로");
    assert.ok(await page.evaluate(() => !!document.querySelector(".feedlist")), "먹이 정리 화면");
  } finally { await browser.close(); }
});

test("C-19: 먹이를 검사하는 동안 '어디쯤인지 보기'를 누르면 하지 않고 플로로가 까닭을 말하며 화난 눈 · X 표지판(m-angry), 먹이 화면은 그대로", { skip: skip || "C-66(2026-10-30) — 장 화면의 '해 보기' 단추를 뺐다. 살피기를 누르는 길이 화면에 없다" }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#feed"), { waitUntil: "load" }); await wait(400);
    // 2026-10-24 C-35: 명령 네 칸을 뺐다 — 살피기는 도전과제의 '알아 둘 것'에서 해 보기(먹이를 검사하는 중에도 보이고, 누르면 막는다)
    await page.click(".tb [data-act=qwin-toggle]"); await wait(200);
    if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); }   // 1단계 시작은 ① 화면이 작업 칸을 덮는다(F-88) — 섬을 옆으로
    await page.click("[data-act=qtab][data-tab=tree]"); await wait(200);
    await page.click('[data-act=tree-chap][data-i="0"]'); await wait(200);   // 도전과제의 기본은 지도(C-54 카드 — 흐름 보기가 C-37 한눈에 보기) — 장을 고르면 그 장의 알아 둘 것
    await page.click('.learnbox [data-act=tu-sel][data-v="check"]'); await wait(200);
    assert.ok(await page.$(".learnbox .tu [data-act=cmd-look]"), "살피기 해 보기");
    await page.click(".learnbox .tu [data-act=cmd-look]"); await wait(400);
    const s = await page.evaluate(() => { const svg = document.querySelector("[data-live] svg.cat"), sign = svg && svg.querySelector(".s-sign"), eyes = svg && svg.querySelector(".e-angry");
      return { angry: !!svg && /\bm-angry\b/.test(svg.getAttribute("class")), sign: sign && getComputedStyle(sign).display, eyes: eyes && getComputedStyle(eyes).display, say: [...document.querySelectorAll("[data-log] .msg.floro:not(.now)")].at(-1)?.textContent || "", meal: !!document.querySelector(".feedlist"), judged: !!document.querySelector(".mc-notice") };
    });
    assert.equal(s.angry, true); assert.equal(s.sign, "inline"); assert.equal(s.eyes, "inline");
    assert.ok(s.say.includes("검사하는 중"), s.say);
    assert.ok(s.meal && !s.judged, "먹이 화면은 그대로, 살펴보기는 안 했다");
  } finally { await browser.close(); }
});

// F-26(네 / 아니요가 밖의 칸 둘이 됨)은 2026-10-21 C-22로 명령 네 칸과 함께 뺐다 — 게이트의 네 / 아니요는 채팅의 칩 둘(y · n 키), 그 뒤 장면도 칩
test("C-22: 넘어가기 전 확인에서 네 / 아니요는 채팅의 칩 둘(y · n 키)이고, n 키로 '어디가 헷갈렸나요?'가 플로로의 마지막 말이 되며 지난 말은 위로 쌓인다", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&done&gate"), { waitUntil: "load" }); await wait(400);
    const chips = () => page.evaluate(() => [...document.querySelectorAll(".chat .opts [data-act]")].map((x) => x.dataset.act));
    assert.deepEqual(await chips(), ["yes", "no"]);
    assert.ok(!(await page.$(".cmds")), "명령 네 칸이 없다");
    await page.keyboard.press("n"); await wait(400);
    const s = await page.evaluate(() => ({ say: document.querySelector(".msg.now .say")?.textContent || "", past: [...document.querySelectorAll(".msg.floro:not(.now) .say")].map((x) => x.textContent) }));
    assert.ok(s.say.includes("헛갈렸나요") || s.say.includes("헷갈렸나요"), `n 키 = 아니요: ${s.say}`);
    assert.ok(s.past.some((t) => t.includes("이해되셨나요")), `지난 말이 위로: ${JSON.stringify(s.past)}`);
    assert.ok((await chips()).includes("hard-t") && (await chips()).includes("to-question"), "헷갈린 곳 고르기 칩");
  } finally { await browser.close(); }
});

test("FR-15 더함: 먹이 정리에서 먹는 구간마다 종류를 고르고, 확인하면 '확인할 먹이'가 도서관 탭 맨 위에 — '맞아요'를 누르면 그 종류로 내 책의 칸에 들어간다", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.evaluate(() => localStorage.removeItem("navigator-prototype:v1"));
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#feed&noex"), { waitUntil: "load" }); await wait(400);
    const sel = await page.evaluate(() => [...document.querySelectorAll(".feedlist select.kind")].map((s) => ({ i: s.dataset.i, v: s.value, n: s.options.length })));
    assert.deepEqual(sel, [{ i: "0", v: "req", n: 5 }], "먹는 구간 하나에만 종류 고르기(다섯 중 하나)");
    await page.select('.feedlist select.kind[data-i="0"]', "todo"); await wait(100);
    await page.click("[data-act=feed-confirm]"); await wait(600);
    await page.click(".tb [data-act=qwin-toggle]"); await wait(200); await page.click("[data-act=qtab][data-tab=lib]"); await wait(300);   // 2026-10-21 C-22: 도서관 탭 → 퀘스트 창의 서고 탭. 2026-10-24 C-35: 위 줄의 '퀘스트' 단추 → 책 탭
    const box = await page.evaluate(() => ({ n: document.querySelectorAll(".inboxlist li").length, title: document.querySelector(".inbox .stg")?.textContent || "", kind: document.querySelector(".inboxlist select.kind")?.value, text: document.getElementById("nav").innerText }));
    assert.equal(box.n, 1); assert.ok(box.title.includes("확인할 먹이 1개")); assert.equal(box.kind, "todo");
    assert.ok(!box.text.includes("분류함"));
    await page.click("[data-act=inbox-ok]"); await wait(300);
    assert.equal(await page.evaluate(() => document.querySelectorAll(".inboxlist li").length), 0);
    await page.click('[data-act=lib-book][data-id="me"]'); await wait(400);
    const todos = await page.evaluate(() => [...document.querySelectorAll('.bv-sec[data-k="todos"] li')].map((l) => l.textContent));
    assert.ok(todos.some((t) => t.includes("회원이 행사를 보고 신청하는 앱")), JSON.stringify(todos));
  } finally { await browser.close(); }
});

test("C-21: 서고의 책장은 내가 만든다 — 처음엔 '분류 안 함' 하나(예시 책도 거기), 떠 있는 배운 말 · 잇는 선 없음, 만들기 → 펼친 책에서 옮기기 → 이름 바꾸기 → 새로 고침해도 그대로 → 지우면 책은 '분류 안 함'으로", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url("library/index.html#lib"), { waitUntil: "load" }); await page.evaluate(() => localStorage.removeItem("floe:shelves")); await page.reload(); await wait(500);
    const shelvesOf = () => page.evaluate(() => [...document.querySelectorAll(".shelfbox")].map((x) => [x.querySelector(".label span").textContent, x.querySelectorAll(".front").length]));
    assert.deepEqual(await shelvesOf(), [["분류 안 함", 5]]);
    assert.equal(await page.evaluate(() => document.querySelectorAll("#s-lib .chip, #s-lib .arcs, #arcs").length), 0, "배운 말 표 · 잇는 선이 없다");
    assert.ok(!(await page.evaluate(() => document.body.innerText)).includes("EARS"), "서고 화면에 배운 말이 없다");
    await page.click("#shelf-add"); await wait(200); await page.type("#shelf-name", "알림"); await page.keyboard.press("Enter"); await wait(300);
    assert.deepEqual(await shelvesOf(), [["분류 안 함", 5], ["알림", 0]]);
    await page.click('[data-read="f1"]'); await wait(900); await page.click("#rd-cover"); await wait(1300);
    const opt = await page.evaluate(() => [...document.querySelectorAll("#rd-shelf option")].find((o) => o.textContent === "알림").value);
    await page.select("#rd-shelf", opt); await wait(300);
    await page.click("#rd-close"); await wait(300);
    assert.deepEqual(await shelvesOf(), [["분류 안 함", 4], ["알림", 1]]);
    await page.click('[data-act="shelf-rename"]'); await wait(200);
    await page.evaluate(() => { document.querySelector("form[data-rename] input").value = "알림 · 폼"; }); await page.keyboard.press("Enter"); await wait(300);
    await page.reload(); await wait(500);
    assert.deepEqual(await shelvesOf(), [["분류 안 함", 4], ["알림 · 폼", 1]], "이 브라우저에 남는다");
    await page.click('[data-act="shelf-remove"]'); await wait(300);
    assert.deepEqual(await shelvesOf(), [["분류 안 함", 5]], "지우면 책은 '분류 안 함'으로");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("floe:shelves")));
    assert.deepEqual(saved, { list: [], books: {} });
  } finally { await browser.close(); }
});

// C-22 게임식 디자인 1차 뼈대(2026-10-21, 이재엽 "지금부터 만들어서 릴리즈" · 창 셋 · 1단계부터) — 처음 실행의 퀘스트 흐름과 창 둘의 자리를 실제 브라우저에서 잇는다(연습 모드)
test("C-22 · C-36: 처음 실행 — 원하는 것을 플로로에게 말하면 1단계 초안(연습은 예시) → 퀘스트 창이 바로 떠 제목이 주제인 1단계 공책 → 칸마다 맞아요 · 크기 고르기 → 저절로 완료 보고 → 넘어가기 전 확인 → 조개 1 · 2단계 받기 화면(제목 = 주제) · 칭호", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.evaluate(() => localStorage.removeItem("navigator-prototype:v1"));
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#start"), { waitUntil: "load" }); await wait(400);
    const say = () => page.evaluate(() => document.querySelector(".msg.now .say")?.textContent || "");
    const band = () => page.evaluate(() => document.querySelector(".tb-stage")?.textContent || "");
    assert.ok((await say()).includes("원하는 것을 플로로에게"), await say());
    assert.ok(!(await page.$(".qwin")), "처음엔 퀘스트 창이 없다");
    await page.type("[data-act=say]", "동아리 행사 신청 앱을 만들고 싶어요"); await page.keyboard.press("Enter"); await wait(600);
    assert.ok((await page.evaluate(() => [...document.querySelectorAll(".msg.me .b")].map((x) => x.textContent))).includes("동아리 행사 신청 앱을 만들고 싶어요"), "내 말은 오른쪽에 남는다");
    assert.ok(await page.$(".qwin .qcard") && !(await page.$(".qwin .ev")), "퀘스트 창이 바로 떠서 퀘스트 카드(C-68 한 목록) — 받기 화면 · '시작하시겠습니까'는 없다");
    assert.equal(await band().then((b) => b.split("·")[0].trim()), "1단계", `위 줄은 1단계부터: ${await band()}`);
    assert.ok((await band()).includes("동아리 행사 신청 앱"), `제목은 주제: ${await band()}`);
    assert.ok((await say()).startsWith("Ⅰ."), `칸마다 확인: ${await say()}`);
    for (let k = 0; k < 3; k++) { await page.click(".mc.chat [data-act=draft-ok]"); await wait(300); }
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".mc.chat [data-act=draft-size]")].map((b) => b.textContent.replace(/\d/g, "").trim())), ["짧음", "보통", "긺"]);
    await page.click('.mc.chat [data-act=draft-size][data-i="1"]'); await wait(900);
    assert.ok((await say()).includes("모두 했어요") && await page.$("[data-act=gate]"), `넷 다 확인하면 저절로 완료 보고 → 넘어가기 전 확인 칩: ${await say()}`);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")).quest.lines.map((l) => l.length)), [1, 1, 1, 1], "칸마다 한 줄씩 적혔다");
    await page.click("[data-act=gate]"); await wait(300); await page.click("[data-act=yes]"); await wait(400);
    if (await page.$("[data-act=check-pick]")) { await page.click("[data-act=check-pick]"); await wait(400); if (await page.$("[data-act=check-go]")) { await page.click("[data-act=check-go]"); await wait(400); } }
    // 2단계는 1단계 결과로 만든 초안을 받기 화면 없이 바로 확인(C-37, 2026-10-25 — 연습은 예시 초안)
    const after = await page.evaluate(() => ({ band: document.querySelector(".tb-stage")?.textContent || "", shells: document.querySelector(".shells span")?.textContent, book: !!document.querySelector(".qwin .qcard"), ev: !!document.querySelector(".qwin .ev") }));
    assert.ok(after.band.startsWith("2단계 · 동아리 행사 신청 앱") && after.shells === "1" && after.book && !after.ev, JSON.stringify(after));
    assert.match(await say(), /^Ⅰ\./, "2단계도 칸마다 확인");
    assert.equal(await page.evaluate(() => localStorage.getItem("floe:level")), null, "연습 모드의 관문은 영구 레벨에 남기지 않는다(C-28 — 이 켜짐 동안만 오른다, 칭호는 위처럼 바뀐다)");
    // 받기 화면(3단계부터 — 초안이 없는 장) — 보상 칸 설명 · 고쳐서 받기 · 공책. 장면 주소로 연다(2단계 퀘스트를 받기 화면으로)
    // C-70(2026-10-30 목업 확정본 S1): 이벤트 창(그림 · REWARD 칸) 대신 다섯 칸 미리보기 카드 — 단추는 [나중에] [퀘스트 받기] 둘. 이름 · 개수 고치기는 섬 채팅의 '고쳐 주세요'로
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&q=draft"), { waitUntil: "load" }); await wait(400);
    assert.ok(await page.$(".qwin .qpre") && !(await page.$(".qwin .ev")), "받기 전 카드 — 이벤트 창은 없다");
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".qwin .qpre .pacts button")].map((b) => b.textContent)), ["나중에", "퀘스트 받기"], "단추 둘");
    assert.ok((await page.$$(".qwin .qpre .ln")).length >= 4 && (await page.$(".qwin .qpre .rw")), "다섯 칸 미리보기 · 보상은 글로만");
    const title0 = await page.$eval(".qwin .qpre .qhead h3", (e) => e.textContent);
    await page.click("[data-act=quest-ok]"); await wait(500);
    assert.ok(await page.$(".qwin .qcard:not(.qpre)") && (await page.$$(".qwin .qcard .ln")).length >= 4, "받으면 퀘스트 카드 — 다섯 칸(장면의 판정이 칸을 맞음으로 두면 끝낸 줄)");
    assert.equal(await page.evaluate(() => document.querySelector(".qwin .qhead h3")?.textContent), title0, "이름 그대로");
    // 설정 — 2026-10-25(두승현): 옆 창이 아니라 섬 안의 판(채팅 자리를 바꿔 끼움). 퀘스트 창은 섬 옆 — 기본은 오른쪽, '왼쪽'을 고르면 [퀘스트][섬]. 이 컴퓨터에 남는다
    //   F-86(2026-10-29 두승현 "별도의 모달창을 중앙에"): 작업실이 열려 있으면 설정은 섬이 아니라 작업실 위 가운데 모달 — 섬의 채팅은 그대로
    await page.click("[data-act=settings]"); await wait(300);
    assert.ok(await page.$(".set-modal .setp") && !(await page.$(".isl .setp")) && !(await page.$("#nav > .win.setwin")), "작업실이 열려 있으면 설정은 가운데 모달 — 섬 안이 아니다");
    // 칭호는 섬의 플로로 아래에서 뺐고(2026-10-25) 설정 판 왼쪽 칸에 있다 — 관문을 넘으면 바뀐다
    assert.ok((await page.evaluate(() => document.querySelector(".setp .who")?.textContent || "")).includes("적어 두는 사람"), "설정 판의 칭호가 바뀐다");
    const order = () => page.evaluate(() => [...document.querySelectorAll("#nav > .wsx > :not(.set-layer)")].map((x) => (x.classList.contains("wh") ? "wh" : x.classList.contains("qwin") ? "quest" : x.classList.contains("isl-col") ? "isl" : x.className)));
    assert.deepEqual(await order(), ["wh", "quest", "isl"], "머리 줄 하나 아래 작업실 판 · 섬 옆 칸(오른쪽) — C-62(PR ② 2026-10-29). 자리 바꾸기 단추는 2026-10-28 합의로 뺐다");
    assert.ok(!(await page.$("[data-act=side]")), "섬 자리 단추 없음");
    // 탭 — 하나씩 보인다
    await page.click("[data-act=set-tab][data-tab=view]"); await wait(200);
    assert.ok(await page.$(".set-body [data-act=mode]") && !(await page.$(".set-body [data-act=name]")), "보기 탭에는 보기 칸만");
    await page.keyboard.press("Escape"); await wait(200);
    assert.ok(!(await page.$(".setp")) && await page.$(".isl .mc.chat") && await page.$(".qwin"), "Esc는 설정 판부터 닫고 채팅으로");
    await page.keyboard.press("Escape"); await wait(200);
    assert.ok(!(await page.$(".qwin")), "한 번 더 Esc — 퀘스트 창");
  } finally { await browser.close(); }
});

// 2026-10-23 이재엽 결정(C-26 · C-28 · C-30) — 책 탭의 README · 레벨 누적 · 서재 단추 없음. 2026-10-24 C-35(이재엽 "버튼 4개의 기능들을 다른곳으로 이동" · "오버레이는 작업하는 공간") — 명령 네 칸을 뺐다
test("C-35 · C-26 · C-30 · C-28: 명령 네 칸이 없고 위 줄의 '퀘스트' 단추로 퀘스트 창(퀘스트 · 도전과제 · 책) — 책 탭에 README(연습 예시), 도전과제의 장마다 관문 전에 알아 둘 것(튜토리얼), 계획은 채팅의 칩, 레벨은 기록을 지워도 그대로, 서재 단추는 없다", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.evaluate(() => { localStorage.removeItem("navigator-prototype:v1"); localStorage.setItem("floe:level", "3"); });
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#start"), { waitUntil: "load" }); await wait(400);
    assert.ok(!(await page.$(".cmd4")) && !(await page.$("[data-act=cmd-hand]")), "오버레이에 명령 네 칸이 없다");
    assert.equal(await page.evaluate(() => document.querySelector(".tb [data-act=qwin-toggle]")?.textContent.trim()), "퀘스트", "위 줄의 '퀘스트' 단추(이재엽 그림 2026-10-24)");
    // F-85(#259)부터 작업실을 닫으면 알약이고 알약은 작업실을 다시 연다 — 떠 있는 섬의 칩은 작업실을 열기 전에 본다(F-102 고침 2026-10-30)
    // 계획 — 채팅의 늘 있는 칩으로 한 번에 넣기를 열고, '한 줄만 적어 맡기기'는 전의 할 일 칸(AI 진행 판)
    if (!(await page.$(".mc.chat [data-act=plan-open]"))) { await page.click(".mc.chat [data-act=more-toggle]"); await wait(300); }   // C-60(#248): 늘 있는 칩은 '더 보기' 안
    await page.click(".mc.chat [data-act=plan-open]"); await wait(300);
    assert.match(await page.evaluate(() => document.querySelector(".msg.now .say")?.textContent || ""), /한 번에/, "채팅의 지금 말이 한 번에 넣기");
    await page.click(".mc.chat [data-act=plan-direct]"); await wait(400);
    assert.ok(await page.$("#task-text") && !(await page.$(".cmd4")), "한 줄만 적어 맡기기 — AI 진행 판의 할 일 칸");
    await page.click("[data-act=base-back]"); await wait(300);
    // 퀘스트 단추 → 작업실 창(탭 다섯 — C-41 ① 2026-10-26: 캔버스 · 노트북(옛 퀘스트) · 도전과제 · 책, C-45 2026-10-27: 문서 지도). 한 번 더 누르면 닫힌다
    await page.click(".tb [data-act=qwin-toggle]"); await wait(300);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".wsx > .wh .wtabs [role=tab]")].map((t) => t.textContent)), ["캔버스", "퀘스트", "책"]);   // C-65(2026-10-30)   // C-54(2026-10-28): 문서 지도 탭은 도전과제 안의 '상자' 보기
    assert.ok(await page.$(".qwin"), "작업실이 열렸다(열린 동안 섬 옆 칸에는 위 줄이 없어 단추의 눌림은 볼 수 없다 — C-62)");
    // 책: 서버 없이 열었으니 연습 예시 README
    if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); }   // 칸을 하나도 안 적은 퀘스트면 섬이 작업 칸을 덮는다(C-61 bigAuto) — 시험은 섬을 옆으로
    await page.click("[data-act=qtab][data-tab=lib]"); await wait(400);
    const book = await page.evaluate(() => ({ toc: [...document.querySelectorAll(".rb-toc button")].map((b) => b.textContent), vers: document.querySelectorAll(".rb-vers li").length, from: document.querySelector(".rb-head small")?.textContent || "" }));
    assert.ok(book.toc.length >= 3 && book.vers >= 2 && book.from.includes("연습 예시"), JSON.stringify(book));
    await page.click('.rb-toc button[data-i="1"]'); await wait(200);
    assert.equal(await page.evaluate(() => document.querySelector(".rb-ch h4")?.textContent), book.toc[1], "목차를 누르면 그 장");
    // 도전과제: 지금 장(1단계)의 알아 둘 것 — 퀘스트 받기 · 맡기기와 허락이 있고, 고르면 그 튜토리얼과 '해 보기'. 다른 장을 고르면 그 장의 것
    await page.click("[data-act=qtab][data-tab=quest]"); await wait(300);
    assert.ok(await page.$(".qwin .sm-grid"), "퀘스트 탭의 기본은 지도 띠 + 퀘스트 카드(C-65) — 흐름 보기가 C-37 한눈에 보기");
    // C-66(2026-10-30): 장 화면(관문 전에 알아 둘 것 · 이 장에서 쓰는 말)은 뺐다 — 튜토리얼은 받기 전 카드의 '처음 쓰는 기능' 한 줄로(C-70)
    assert.equal((await page.$$(".qwin .learnbox, .qwin .vtabs, .qwin .chain")).length, 0, "장 화면 없음");
    if (false) {
    assert.deepEqual(await page.evaluate(() => ({ h: document.querySelector(".learnbox .tu-h b")?.textContent, st: document.querySelector(".learnbox .tu-st")?.textContent, tryAct: document.querySelector(".learnbox .tu [data-act=qwin-quest]") ? "qwin-quest" : "" })), { h: "퀘스트 받기", st: "있음", tryAct: "qwin-quest" });
    await page.click('[data-act=tree-chap][data-i="1"]'); await wait(200);
    assert.ok((await page.evaluate(() => [...document.querySelectorAll(".learnbox [data-act=tu-sel]")].map((b) => b.dataset.v))).includes("book"), "2단계에는 책");
    assert.match(await page.evaluate(() => document.querySelector(".learnbox h4")?.textContent || ""), /2단계/, "어느 장의 관문 전인지");
    }
    await page.click(".wh [data-act=qwin]"); await wait(200);   // 열린 동안 섬 옆 칸에는 위 줄(.tb)이 없다(C-62) — 머리 줄의 닫기로
    assert.ok(!(await page.$(".qwin")), "닫힌다");
    // 계획 — 채팅의 늘 있는 칩으로 한 번에 넣기를 열고, '한 줄만 적어 맡기기'는 전의 할 일 칸(AI 진행 판)
    await page.click(".mc.chat [data-act=plan-open]"); await wait(300);
    assert.match(await page.evaluate(() => document.querySelector(".msg.now .say")?.textContent || ""), /한 번에/, "채팅의 지금 말이 한 번에 넣기");
    await page.click(".mc.chat [data-act=plan-direct]"); await wait(400);
    assert.ok(await page.$("#task-text") && !(await page.$(".cmd4")), "한 줄만 적어 맡기기 — AI 진행 판의 할 일 칸");
    await page.click("[data-act=base-back]"); await wait(300);
    // 레벨 — 저장된 3이 설정 창에, 서재로 가는 단추는 없다. 기록을 지우고(새 프로젝트) 다시 열어도 그대로
    await page.click("[data-act=settings]"); await wait(300);
    assert.ok((await page.evaluate(() => document.querySelector(".setp .who")?.textContent || "")).includes("LV 3"), "설정 판에 레벨 3");
    assert.ok(!(await page.$("[data-act=lib-enter]")), "서재 잠시 뺌 — 서재로 가는 단추가 없다");
    await page.evaluate(() => localStorage.removeItem("navigator-prototype:v1"));
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#start&set=1"), { waitUntil: "load" }); await wait(400);
    assert.ok((await page.evaluate(() => document.querySelector(".setp .who")?.textContent || "")).includes("LV 3"), "새 프로젝트여도 레벨은 그대로");
  } finally { await browser.close(); }
});

test("C-22: 뽑기 · 꾸미기 — 조개 셋이면 위 줄의 조개로 뽑기 창, 열면 하나가 나와 플로로가 바로 쓰고(.deco) 기록에 남는다, 설정 창의 꾸미기 줄에서 벗는다. 곁 퀘스트는 Lite의 공책 목차 아래 · 도전과제 옆 가지. 서고 탭의 책도 1~8", { skip }, async () => {
  const browser = await launch();
  try {
    const page = await fresh(browser);
    await page.evaluate(() => localStorage.removeItem("navigator-prototype:v1"));
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&shells=6"), { waitUntil: "load" }); await wait(400);   // 여섯 — 두 번 잇달아 연다(F-114)
    // 위 줄의 조개 그림이 단추 앞에 보인다 — 2026-10-23 전에는 class 'shell'이 바탕 껍데기(.nav .shell, z-index -1)와 겹쳐 숨고 수만 보였다
    const coinSeen = await page.evaluate(() => { const c = document.querySelector(".shells .coin"); if (!c) return "none"; const r = c.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return r.width >= 16 && c.contains(hit) ? "ok" : `hidden ${r.width} ${hit && hit.tagName}`; });
    assert.equal(coinSeen, "ok", "위 줄의 무지개 조개 그림이 보인다");
    await page.click(".shells"); await wait(300);   // 작업실이 열려 있으면 조개는 머리 줄(C-62)
    assert.ok(await page.evaluate(() => { const b = document.querySelector(".gacha .bigshell"); const r = b && b.getBoundingClientRect(); return !!r && r.width >= 100 && b.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)); }), "뽑기 창의 큰 조개 그림이 보인다");
    assert.ok(await page.$(".gacha-layer") && !(await page.evaluate(() => document.querySelector("[data-act=gacha-roll]").disabled)), "뽑기 창 · 열 수 있다");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".odds span").length), 4, "확률표 넷");
    await page.click("[data-act=gacha-roll]"); await wait(1800);
    const s = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem("navigator-prototype:v1")); return { got: document.querySelector(".gacha .got")?.textContent || "", deco: !!document.querySelector(".pet .deco"), shells: document.querySelector(".shells span")?.textContent, owned: r.owned, wear: r.wear }; });
    assert.ok(s.got.includes("나왔어요") && s.deco && s.shells === "3" && s.owned.length === 1 && Object.values(s.wear)[0] === s.owned[0], JSON.stringify(s));
    // F-114(임유정 2026-11-01): 창을 닫지 않고 바로 한 번 더 — 전에는 '조개 열기'가 꺼져 있었다. 다 쓰면 꺼진다
    assert.equal(await page.evaluate(() => { const b = document.querySelector("[data-act=gacha-roll]"); return b && !b.disabled ? b.textContent : "off"; }), "한 번 더 열기");
    await page.click("[data-act=gacha-roll]"); await wait(1800);
    assert.deepEqual(await page.evaluate(() => ({ shells: document.querySelector(".shells span")?.textContent, off: document.querySelector("[data-act=gacha-roll]").disabled, got: (document.querySelector(".gacha .got")?.textContent || "").includes("나왔어요") })), { shells: "0", off: true, got: true }, "두 번째도 나오고, 조개를 다 쓰면 단추가 꺼진다");
    await page.keyboard.press("Escape"); await wait(200);
    assert.ok(!(await page.$(".gacha-layer")), "Esc로 닫힌다");
    await page.click("[data-act=settings]"); await wait(300);
    await page.click(".closet [data-act=wear]"); await wait(300);
    assert.ok(!(await page.$(".pet .deco")) && (await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("navigator-prototype:v1")).wear).length)) === 0, "벗으면 기록도");
    await page.goto("about:blank"); await page.goto(url("navigator/index.html#ex=1&tier=Lite&q=quest"), { waitUntil: "load" }); await wait(400);
    assert.ok(await page.$(".qwin .qside"), "곁 퀘스트 — 목록 아래 한 줄(C-68)");
    if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); }   // 칸을 하나도 안 적은 퀘스트면 섬이 작업 칸을 덮는다(C-61 bigAuto) — 시험은 섬을 옆으로
    await page.click("[data-act=qtab][data-tab=lib]"); await wait(300);
    if (shelfOff) {   // 서재를 잠시 뺀 동안(2026-10-23)은 책 표지 목록 대신 이 프로젝트의 책 하나 — 펼치면 단계가 1~8
      await page.click("[data-act=lib-book]"); await wait(300);
      assert.ok((await page.evaluate(() => document.querySelector(".bv-head .stg")?.textContent || "")).includes("2단계"), "책 탭의 책도 1~8(코드 1 = 2단계)");
    } else assert.ok((await page.evaluate(() => document.querySelector(".cover .s")?.textContent || "")).includes("2단계"), "서고 탭의 책도 1~8(코드 1 = 2단계)");
  } finally { await browser.close(); }
});
