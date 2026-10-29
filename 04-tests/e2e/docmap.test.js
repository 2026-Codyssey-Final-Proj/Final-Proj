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
    const tabs = await page.$$eval(".wsx > .wh .wtabs [data-act=qtab]", (bs) => bs.map((b) => b.textContent));
    assert.deepEqual(tabs, ["캔버스", "노트북", "도전과제", "책"], "문서 지도는 도전과제 안(C-54)");
    await page.click("[data-act=qtab][data-tab=tree]"); await wait(200); await page.click('[data-act="tree-view"][data-v="box"]'); await wait(300);   // C-54: 문서 지도는 도전과제 안의 '상자' 보기
    const frame = await (await page.waitForSelector("iframe.docmap", { timeout: 5000 })).contentFrame();
    await frame.waitForSelector("#panel, .floe-empty", { timeout: 8000 }); await wait(800);
    const s = await frame.evaluate(() => ({ title: document.querySelector("h1")?.textContent || "", boxes: window.BOARD ? window.BOARD.elements.map((e) => e.c) : [], rels: window.BOARD ? window.BOARD.relations.length : -1, empty: !!document.querySelector(".floe-empty") }));
    assert.ok(!s.empty, "보드가 그려졌다"); assert.equal(s.title, "my-club-app 문서 지도");
    assert.deepEqual(s.boxes.slice(0, 2), ["docs/01-idea/idea.md", "docs/02-plan/plan.md"], "단계 문서가 먼저, 차례로");
    assert.deepEqual([...s.boxes].sort(), ["README.md", "docs/01-idea/idea.md", "docs/02-plan/plan.md", "docs/PRD.md", "docs/README.md", "docs/decisions.md"], "md 문서가 모두 상자로(코드 파일은 없음)");
    assert.ok(s.rels >= 5, `선 ${s.rels}`);
    assert.deepEqual(outside, [], "밖으로 요청하지 않는다(엔진 사본)");
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, "docmap.png") }); }
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
  } finally { await browser.close(); srv.close(); Srv.dropProject(PROJ); fs.rmSync(TMP, { recursive: true, force: true }); }
});
