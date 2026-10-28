// claude-drafted: 2026-10-28 — C-54 지도(이재엽 버튼 "'도전과제' 그대로" · "한 번에"): 도전과제 탭의 카드 지도 — 1 · 2단계 done, 3단계 now, 4 ~ 8은 '2단계에서 그려져요' → 기획서로 그리기 → 준비된 퀘스트 → 맞아요 → 준비됨, 카드를 누르면 오른쪽 칸, 보기 셋(지도 · 흐름 · 상자). puppeteer · Chrome이 없으면 건너뛴다
// 실행: node --test 04-tests/e2e/stage-map.test.js
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
const ROOT = path.join(__dirname, "../..");
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };


test("C-54 — 도전과제 탭의 카드 지도 · 기획서로 3 ~ 8단계 그리기 · 준비된 퀘스트 한 번에 확인 · 카드 → 오른쪽 칸 · 보기 셋", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 900 });
    // 기록 씨앗 — 1 · 2단계 결과(2단계 칸을 다 채운 상태). 화면이 뜨기 전에 심는다(뜬 뒤에 심으면 화면의 저장이 덮어쓴다). 장면 #ex=2&q=quest가 3단계(코드 2)의 퀘스트를 연다
    const N = require(path.join(ROOT, "03-backend/navigator/navigator.js")), crit = (n) => N.criteriaFor(n, "Xpress");
    const seed = { at: Date.now(), tier: "Xpress", results: { 0: { chap: 0, title: "동아리 앱", items: N.STAGES[0].criteria.map((c) => ({ name: c.text, lines: ["종이 신청이 헷갈려요"] })), at: "2026-10-28", passed: "2026-10-28" },
      1: { chap: 1, title: "동아리 앱", items: crit(1).map((c, i) => ({ name: c.text, lines: [`기획서 ${i + 1}절의 줄`] })), at: "2026-10-28", passed: "2026-10-28" } } };
    await page.evaluateOnNewDocument((seed) => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify(seed)); sessionStorage.setItem("seeded", "1"); } } catch {} }, seed);
    await page.goto(url("navigator/index.html#ex=2&q=quest"), { waitUntil: "load" }); await wait(400);
    if (!(await page.$(".qwin"))) { await page.click(".tb [data-act=qwin-toggle]"); await wait(300); }
    await page.click("[data-act=qtab][data-tab=tree]"); await wait(300);
    const tabs = await page.$$eval(".qwin .wtabs [data-act=qtab]", (bs) => bs.map((b) => b.textContent));
    assert.ok(!tabs.includes("문서 지도") && tabs.includes("도전과제"), `문서 지도 탭은 도전과제 안으로: ${tabs.join(",")}`);
    const cards = () => page.$$eval(".sm-grid .sm-card", (cs) => cs.map((c) => ({ n: c.dataset.i, state: [...c.classList].find((k) => ["done", "now", "later", "pending", "ready"].includes(k)), text: c.textContent.replace(/\s+/g, " ").trim() })));
    let cs = await cards();
    assert.equal(cs.length, 8, "카드 여덟"); assert.deepEqual(cs.map((c) => c.state), ["done", "done", "now", "later", "later", "later", "later", "later"]);
    assert.match(cs[2].text, /3단계|기능 정리/); assert.match(cs[3].text, /2단계에서 그려져요/);
    assert.deepEqual(cs.map((c) => c.n), ["0", "1", "2", "3", "7", "6", "5", "4"], "둘째 줄은 8 → 5(길이 돌아온다)");
    const docs = await page.$$eval(".sm-docs li", (ls) => ls.map((l) => l.textContent.replace(/\s+/g, " ").trim()));
    assert.ok(docs.some((d) => d.includes("README.md")) && docs.some((d) => d.includes("decisions.md")), `아래 줄 문서: ${docs.join("|")}`);
    if (SHOTS) await shot(page, "map-stage1");
    // 기획서로 그리기 → 준비된 퀘스트(확인 전) → 맞아요 → 준비됨
    await page.click("[data-act=prep-draw]"); await wait(300);
    cs = await cards(); assert.deepEqual(cs.map((c) => c.state).slice(3), ["pending", "pending", "pending", "pending", "pending"], "그렸지만 확인 전");
    assert.match(cs[3].text, /기획서 \d절/, "근거 절 — 씨앗에 줄이 있는 칸은 절 번호"); assert.ok(!/새로 정함/.test(cs[3].text), "지어내지 않음 표시는 줄이 없을 때만");
    assert.ok(await page.$("[data-act=prep-ok]"), "맞아요(한 번에)"); assert.ok(await page.$("[data-act=prep-fix]"), "고칠래요");
    await page.click("[data-act=prep-fix]"); await wait(200);
    assert.ok((await page.$$(".sm-cell input[data-act=prep-think]")).length >= 5, "고칠래요 — 카드마다 ① 생각 칸");
    await page.click("[data-act=prep-ok]"); await wait(300);
    cs = await cards(); assert.deepEqual(cs.map((c) => c.state).slice(3), ["ready", "ready", "ready", "ready", "ready"], "준비됨");
    assert.ok(!(await page.$("[data-act=prep-draw]")), "다시 그리기 단추는 없다");
    if (SHOTS) await shot(page, "map-stage2");
    // 카드 → 오른쪽 칸
    await page.click('.sm-card[data-i="3"]'); await wait(300);
    const side = await page.$eval(".wside", (el) => el.textContent.replace(/\s+/g, " "));
    assert.match(side, /4단계/); assert.match(side, /① 생각/); assert.match(side, /design\.md/); assert.match(side, /기획서 \d절/);
    // 캔버스의 ① 생각 — 지금 장(3단계)은 준비된 생각이 초안 자리에
    await page.click("[data-act=qtab][data-tab=canvas]"); await wait(300);
    assert.match(await page.$eval(".cv-c.c1", (e) => e.textContent), /기획서 3절의 줄|준비된/, "준비된 ① 생각");
    // 보기 셋
    await page.click("[data-act=qtab][data-tab=tree]"); await wait(200);
    // C-54 ⑧ 얼음 조각 가까이(2026-10-28 버튼 "둘다 할것" — 누르기 + 확대): 끝난 카드(1단계)를 누르면 커져 줄마다 할 일 → 문서 ← 재료, 줄을 누르면 오른쪽 칸에 누가 정했나 · 다음 단계
    await page.click('.sm-card[data-i="0"]'); await wait(350);
    assert.ok(await page.$(".sm-cell.big .sm-card.big"), "고른 끝난 카드가 커진다"); const rows = await page.$$(".sm-cell.big .sm-row"); assert.ok(rows.length >= 1, "줄 하나 = 할 일");
    await page.click('.sm-cell.big .sm-row [data-act="map-line"]'); await wait(300);
    const line = await page.$eval(".wside .ws-line", (el) => el.textContent.replace(/\s+/g, " ")); assert.match(line, /누가 정했나/); assert.match(line, /종이 신청이 헷갈려요/);
    await page.click('.sm-card[data-i="0"]'); await wait(350); assert.ok(!(await page.$(".sm-card.big")), "다시 누르면 작아진다");
    if (SHOTS) { await page.click('.sm-card[data-i="0"]'); await wait(350); await shot(page, "map-zoom"); await page.click('.sm-card[data-i="0"]'); await wait(200); }
    await page.click('[data-act="tree-view"][data-v="flow"]'); await wait(200); assert.ok(await page.$(".qwin .jmap"), "흐름 = 한눈에 보기(C-39)");
    // C-54 ⑨ 짝 선(버튼 "'흐름 따라가기'에서만"): 1↔8 · 2↔7 · 3↔6 길 셋, 짝 단추 → 두 칸 나란히
    assert.ok((await page.$$(".jmap .jm-rails")).length === 8, "단계마다 길 자리"); assert.ok((await page.$$(".jmap .jm-rails i.a")).length === 8, "1↔8 길은 여덟 단계를 다 지난다");
    await page.click('.jmap [data-act="pair-sel"][data-v="a"]'); await wait(250);
    const side2 = await page.$eval(".jmap .jm-side", (el) => el.textContent.replace(/\s+/g, " ")); assert.match(side2, /1단계/); assert.match(side2, /8단계/); assert.match(side2, /종이 신청이 헷갈려요/);
    if (SHOTS) await shot(page, "map-pairs");
    await page.click('.jmap .jm-side [data-act="pair-sel"]'); await wait(200); assert.ok(!(await page.$(".jm-side")), "닫기");
    const rail = await page.$eval('.jm-stage[data-n="0"] .jm-rails i.a', (el) => { const r = el.getBoundingClientRect(), b = el.closest(".board").getBoundingClientRect(); return { w: r.width, h: r.height, inside: r.right <= b.right && r.left >= b.left }; });
    assert.ok(rail.w >= 3 && rail.h > 20 && rail.inside, `길이 보인다 ${JSON.stringify(rail)}`);
    if (SHOTS) { await page.$eval('.jm-stage[data-n="1"]', (el) => el.scrollIntoView({ block: "start" })); await wait(150); await shot(page, "map-rails"); }
    await page.click('[data-act="tree-view"][data-v="box"]'); await wait(200); assert.ok(await page.$(".qwin .qempty, .qwin iframe.docmap"), "상자 = 문서 지도(서버 없이는 까닭)");
    await page.click('[data-act="tree-view"][data-v="cards"]'); await wait(200); assert.ok(await page.$(".sm-grid"), "다시 지도");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")));
    assert.ok(saved.prep && saved.prep.ok && saved.prep.cards["2"], "준비된 퀘스트는 기록에 남는다");
  } finally { await browser.close(); }
});
