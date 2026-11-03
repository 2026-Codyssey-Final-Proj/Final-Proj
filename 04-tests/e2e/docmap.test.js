// claude-drafted: 2026-10-27 — C-45 문서 지도(이재엽 버튼 "작업실의 새 탭" · "앱에 한 벌 넣기") · C-44 맡기기 틀(버튼 "지금 자리에 더한다"):
//   서버를 다른 포트로 띄우고(시험 폴더 연결) 작업실의 '문서 지도' 탭을 열면 iframe에 archi-board 보드가 그려지고(엔진 사본 — 밖으로 요청 없음), 상자를 누르면 '파일 보기에서 열기'가 파일을 연다.
//   연 파일 머리에 '틀로 맡기기' 고르기가 있고 채팅에 '문서 틀' 칩이 있다(맡기기 자체는 claude가 필요해 여기서 돌리지 않는다). puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/docmap.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const ROOT = path.join(__dirname, "../..");
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
if (skip) console.log(`⚠️ e2e/docmap: ${skip}`);
const SHOTS = process.env.FLOE_SHOTS || "";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });

test("C-45 · C-44 — 문서 지도 탭에 보드(문서 상자 · 재료 선), 밖으로 요청 없음, 상자 → '파일 보기에서 열기' → 파일이 열린다; 연 파일 머리에 '틀로 맡기기', 채팅에 '문서 틀' 칩", { skip }, async () => {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-dm-")), PROJ = path.join(TMP, "my-club-app");
  fs.writeFileSync(path.join(TMP, "claude-stub.js"), `process.stdin.resume(); process.stdin.on("end", () => setTimeout(() => { process.stdout.write(JSON.stringify({ type: "result", result: "ok" })); process.exit(0); }, 300));`);   // 가짜 claude — 저장마다 커밋을 맡기므로, 진짜 Claude Code가 시험 폴더에서 돌지 않게(NAV_CLAUDE_BIN)
  Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("../navigator/hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "tok"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: path.join(TMP, "claude-stub.js") });
  fs.writeFileSync(process.env.NAV_REPLAY, "{}");
  const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
  w(path.join(PROJ, "README.md"), "# 앱\n[문서 목차](docs/README.md)\n"); w(path.join(PROJ, "docs/README.md"), "- [1단계](01-idea/idea.md)\n- [2단계](02-plan/plan.md)\n- [기획서](PRD.md)\n");
  w(path.join(PROJ, "docs/PRD.md"), "# 기획서\n[결정](decisions.md)\n"); w(path.join(PROJ, "docs/decisions.md"), "# 결정 기록\n");
  w(path.join(PROJ, "docs/01-idea/idea.md"), "# 1단계\n"); w(path.join(PROJ, "docs/02-plan/plan.md"), "# 2단계\n\n## 재료\n\n- [1단계](../01-idea/idea.md)\n\n## 본문\n\n[기획서](../PRD.md)\n");
  const port = await freePort(); process.env.NAV_PORT = String(port);
  const Srv = require(path.join(ROOT, "03-backend/navigator/server.js"));
  const srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken(); Srv.useProject(PROJ);
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: [`--user-data-dir=${path.join(TMP, "profile")}`] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    const errors = [], outside = []; page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${port}/`) && !u.startsWith("data:") && !u.startsWith("about:")) outside.push(u); });
    await page.goto(`http://127.0.0.1:${port}/#base`, { waitUntil: "load" });
    await page.evaluate(() => { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); sessionStorage.clear(); });
    await page.reload({ waitUntil: "load" }); await wait(500);
    await page.click(".tb [data-act=qwin-toggle]"); await wait(700);
    if (await page.$(".isl-col.center")) { await page.click(".wh [data-act=isl-big]"); await wait(300); }   // 1단계 시작은 ① 화면이 작업 칸을 덮는다(F-88) — 섬을 옆으로
    const tabs = await page.$$eval(".wsx > .wh .wtabs [data-act=qtab]", (bs) => bs.map((b) => b.textContent));
    assert.deepEqual(tabs, ["퀘스트", "책"], "문서 지도는 퀘스트 탭 안의 상자 보기(C-54 · C-65) — 캔버스 탭은 2026-11-02에 뺌");
    await page.click("[data-act=qtab][data-tab=quest]"); await wait(200); await page.click('[data-act="tree-view"][data-v="box"]'); await wait(300);   // C-54: 문서 지도는 도전과제 안의 '상자' 보기
    let frame = await (await page.waitForSelector("iframe.docmap", { timeout: 5000 })).contentFrame();
    // 처음 움직임(임유정 2026-11-03 "부드럽게 이동해서 마지막엔 가운데"): 카메라(#world의 transform)를 그림마다 적어 둔다 — 아래에서 한 번에 건너뛰지 않았는지 · 끝 자리를 본다
    await frame.waitForFunction(() => /docmap\.html$/.test(location.pathname), { timeout: 5000 });
    await frame.evaluate(() => { const log = window.__cam = [], t0 = performance.now();
      const tick = () => { const m = /translate\(([-\d.e]+)px,\s*([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec((document.getElementById("world") || {}).style?.transform || "");
        if (m) { const c = [+m[1], +m[2], +m[3]], l = log[log.length - 1]; if (!l || l.some((v, i) => v !== c[i])) log.push(c); }
        if (performance.now() - t0 < 3000) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); });
    await frame.waitForSelector("#panel, .floe-empty", { timeout: 8000 }); await wait(800);
    const s = await frame.evaluate(() => ({ title: document.querySelector("h1")?.textContent || "", boxes: window.BOARD ? window.BOARD.elements.map((e) => e.c) : [], rels: window.BOARD ? window.BOARD.relations.length : -1, empty: !!document.querySelector(".floe-empty") }));
    assert.ok(!s.empty, "보드가 그려졌다"); assert.equal(s.title, "my-club-app 문서 지도");
    assert.deepEqual(s.boxes.slice(0, 2), ["docs/01-idea/idea.md", "docs/02-plan/plan.md"], "단계 문서가 먼저, 차례로");
    assert.deepEqual([...s.boxes].sort(), ["README.md", "docs/01-idea/idea.md", "docs/02-plan/plan.md", "docs/PRD.md", "docs/README.md", "docs/decisions.md"], "md 문서가 모두 상자로(코드 파일은 없음)");
    assert.ok(s.rels >= 5, `선 ${s.rels}`);
    assert.deepEqual(outside, [], "밖으로 요청하지 않는다(엔진 사본)");
    // 엔진 1.4(2026-11-03): 떠 있는 '30초 흐름 따라가기' 띠 · '발표 모드' 단추는 작은 칸에서 숨기고, '흐름 따라가기' 단추는 남긴다
    const ui = await frame.evaluate(() => { const on = (q) => { const e = document.querySelector(q); return !!e && !e.hidden && getComputedStyle(e).display !== "none"; }; return { cta: on("#tourCta"), pres: on("#bPres"), tour: on("#bTour") }; });
    assert.deepEqual(ui, { cta: false, pres: false, tour: true }, JSON.stringify(ui));
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, "docmap.png") }); }
    // C-67(2026-10-30 목업 확정본 S6): 문서 지도는 작업 칸 가득(높이 ≥ 85% [해석]) · 상자 이름의 계산 글자(배율 곱) ≥ 12px [해석] — 1440 × 900과 1280 × 800 둘 다. 판 안의 판(.board 격자 칸) 없음
    const measure = async () => {
      const box = await page.evaluate(() => { const m = document.querySelector(".qwin iframe.docmap").getBoundingClientRect(), b = document.querySelector(".qwin .wbody").getBoundingClientRect(); return { w: innerWidth, ratio: m.height / b.height }; });
      const fr = await (await page.$("iframe.docmap")).contentFrame();   // 보기를 다시 열면 iframe이 새로 생긴다 — 매번 다시 잡는다
      const font = await fr.evaluate(() => { const el = [...document.querySelectorAll("*")].find((n) => n.textContent.trim() === "plan.md" && n.children.length <= 2); if (!el) return 0;
        const px = parseFloat(getComputedStyle(el).fontSize); let k = 1, w = el; while (w && w !== document.body) { const t = getComputedStyle(w).transform; if (t && t !== "none") { const m = /matrix\(([^,]+),/.exec(t); if (m) k *= parseFloat(m[1]); } w = w.parentElement; } return px * k; });
      console.log(`docmap 잰 값 ${JSON.stringify({ ...box, font: Math.round(font * 10) / 10 })}`); return { ...box, font };
    };
    await wait(1400);   // docmap.html이 첫 그림 뒤 지금 장 상자로 0.7초 동안 옮긴다(2026-11-03)
    let mm = await measure();
    assert.ok(mm.ratio >= 0.85, `1440 — 문서 지도 높이 / 작업 칸 ${mm.ratio.toFixed(2)} ≥ 0.85`); assert.ok(mm.font >= 12, `1440 — 상자 이름 ${mm.font.toFixed(1)}px ≥ 12`);
    // 처음 움직임: 맞춤에서 지금 장 상자(1단계 idea.md)로 이어서 움직인다 — 한 그림에서 전체 거리의 절반 넘게 뛰면 건너뛴 것. 끝에는 그 상자가 가운데(4px 안) · 100%
    const cams = await frame.evaluate(() => window.__cam), c0 = cams[0], c1 = cams[cams.length - 1];
    console.log(`docmap 카메라 ${cams.length}번 바뀜 — 처음 ${JSON.stringify(c0)} → 끝 ${JSON.stringify(c1)}`);
    assert.ok(cams.length > 5, `움직임을 적었다(${cams.length}번) — 적기 전에 끝났으면 아래 검사가 아무것도 보지 않는다(새 맥락 리뷰)`);
    [["x", (c) => c[0], 20], ["y", (c) => c[1], 20], ["배율", (c) => Math.log(c[2]), 0.05]].forEach(([name, f, min]) => {
      const total = Math.abs(f(c1) - f(c0)); if (total < min) return;
      const step = Math.max(...cams.slice(1).map((c, j) => Math.abs(f(c) - f(cams[j]))));
      assert.ok(step < total * 0.5, `${name} — 한 그림에 ${step.toFixed(2)} 움직임(전체 ${total.toFixed(2)}의 절반 미만이어야 이어서 움직인 것)`); });
    const ctr = await frame.evaluate(() => { const el = [...document.querySelectorAll("#els .el")].find((b) => b.querySelector(".en")?.textContent === "idea.md"), r = el.getBoundingClientRect(), b = document.getElementById("board").getBoundingClientRect();
      return { dx: r.left + r.width / 2 - (b.left + b.width / 2), dy: r.top + r.height / 2 - (b.top + b.height / 2) }; });
    assert.ok(Math.abs(ctr.dx) <= 4 && Math.abs(ctr.dy) <= 4, `지금 장 상자가 가운데 — 어긋남 ${JSON.stringify(ctr)}`); assert.ok(Math.abs(c1[2] - 1) < 0.01, `끝 배율 ${c1[2]} = 1`);
    // F-135(임유정 2026-11-03 "플로로 대화창을 우측에 띄우면 새로고침되듯이 모션이 반복돼"): 다시 그려도 문서 지도 iframe은 그대로 — 새로 만들면 다시 불러와 움직임이 처음부터
    await page.$eval("iframe.docmap", (f) => { f.__keep = 1; });
    await page.click('[data-act="tree-view"][data-v="box"]'); await wait(300);
    assert.equal(await page.$eval("iframe.docmap", (f) => f.__keep || 0), 1, "섬 화면 — 다시 그려도 같은 iframe");
    assert.ok(await page.$(".qwin .q-back"), "'퀘스트로' 알약");
    await page.setViewport({ width: 1280, height: 800 }); await wait(600); await page.click('[data-act="tree-view"][data-v="cards"]'); await wait(200); await page.click('[data-act="tree-view"][data-v="box"]'); await wait(2400); mm = await measure();
    assert.ok(mm.ratio >= 0.85, `1280 — 높이 비율 ${mm.ratio.toFixed(2)} ≥ 0.85`); assert.ok(mm.font >= 12, `1280 — 상자 이름 ${mm.font.toFixed(1)}px ≥ 12`);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "docmap-1280.png") });
    await page.setViewport({ width: 1440, height: 900 }); await wait(400);
    frame = await (await page.$("iframe.docmap")).contentFrame(); await frame.waitForSelector("#panel, .floe-empty", { timeout: 8000 }); await wait(600);   // 보기를 다시 열어 iframe이 새로 생겼다
    // 상자를 누르면 오른쪽 판 → '파일 보기에서 열기' → 작업실에 파일이 열린다
    const planId = await frame.evaluate(() => window.BOARD.elements.find((e) => e.c === "docs/02-plan/plan.md").id);
    await frame.evaluate((id) => { const box = [...document.querySelectorAll("[data-id], .el, .box")].find((b) => b.dataset.id === id || b.id === id); if (box) box.click(); else throw new Error("상자를 못 찾음"); }, planId).catch(async () => {
      await frame.evaluate((id) => { const all = [...document.querySelectorAll("*")].filter((n) => n.textContent.trim() === "plan.md" && n.children.length <= 2); if (!all.length) throw new Error("상자 글을 못 찾음"); all[0].click(); }, planId);
    });
    await wait(400);
    const open = await frame.waitForSelector("#pB .floe-open", { timeout: 5000 });
    assert.equal(await frame.$eval("#pB code", (e) => e.textContent.trim()), "docs/02-plan/plan.md", "오른쪽 판에 파일 위치");
    await open.click(); await wait(700);
    assert.equal(await page.$eval('.wtabs .ftab button[role=tab][aria-selected="true"]', (b) => b.textContent), "plan.md", "파일 보기로 열렸다");
    assert.equal(await page.$eval(".fv-md h1", (e) => e.textContent), "2단계");
    assert.deepEqual(await page.$$eval(".fpreset option", (os) => os.slice(0, 3).map((o) => o.textContent)), ["틀로 맡기기…", "단계 문서 칸 채우기", "요구 줄 더하기"], "연 파일 머리의 틀 고르기(C-44)");
    assert.deepEqual(errors, []);
    // F-134(임유정 2026-11-03 "내가 보낸 화면에서의 가운데"): 지금 장 문서가 없으면 상자 하나가 아니라 그 상자가 든 틀 전체를 가운데에
    const solo = await browser.newPage(); await solo.setViewport({ width: 1440, height: 900 });
    await solo.goto(`http://127.0.0.1:${port}/navigator/docmap.html#now=${encodeURIComponent("docs/없는.md")}`, { waitUntil: "load" }); await wait(1500);
    const fc = await solo.evaluate(() => { const f = [...document.querySelectorAll("#frames .fr")].find((s) => s.querySelector(".ft")?.textContent === "1단계부터 8단계까지"), r = f.getBoundingClientRect(), b = document.getElementById("board").getBoundingClientRect();
      return { dx: r.left + r.width / 2 - (b.left + b.width / 2), dy: r.top + r.height / 2 - (b.top + b.height / 2) }; });
    assert.ok(Math.abs(fc.dx) <= 4 && Math.abs(fc.dy) <= 4, `지금 장 문서가 없으면 첫 틀이 가운데 — 어긋남 ${JSON.stringify(fc)}`);
    await solo.close();
    // F-135 — 앱의 작업실 창(win.html, win.js draw)도: 섬이 보낸 화면을 다시 그려도 같은 iframe, 둘레(머리 글 · class)는 새 것으로
    const win = await browser.newPage();
    await win.evaluateOnNewDocument(() => { window.floeApp = { onWinHtml: (f) => { window.__h = f; }, onDock() {}, winEvent() {} }; });
    await win.goto(`http://127.0.0.1:${port}/navigator/win.html#quest`, { waitUntil: "load" });
    const box = (t, c) => `<div class="wh"><b>${t}</b></div><div class="qwin ${c}"><div class="wbody"><div class="qboard full view-box"><div class="board"><iframe class="docmap" src="about:blank#d"></iframe></div></div></div></div>`;
    await win.evaluate((h) => { window.__h(h); document.querySelector("iframe.docmap").__keep = 1; }, box("하나", "a"));
    const w2 = await win.evaluate((h) => { window.__h(h); const f = document.querySelector("iframe.docmap"); return { keep: f.__keep || 0, n: document.querySelectorAll("iframe").length, t: document.querySelector(".wh b").textContent, c: document.querySelector(".qwin").className }; }, box("둘", "b"));
    assert.deepEqual(w2, { keep: 1, n: 1, t: "둘", c: "qwin b" }, "작업실 창 — 같은 iframe, 둘레는 새 화면");
    await win.evaluate(() => window.__h('<div class="wh"><b>셋</b></div>')); assert.equal(await win.$("iframe.docmap"), null, "새 화면에 지도가 없으면 뺀다");
    await win.close();
  } finally { await browser.close(); srv.close(); Srv.dropProject(PROJ); fs.rmSync(TMP, { recursive: true, force: true }); }
});
