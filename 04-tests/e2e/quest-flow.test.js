// claude-drafted: 2026-10-25 — C-37(이재엽 "1단계에서 플로로 채팅이 너무 많이 올라오는 문제 … 한곳에서 보이는 것들 … 도전과제 … 다이어그램 … 어느 곳이 부족한지 …
//   2단계에서도 초안들을 진행하며 … 동의들을 구한후 … 2단계가 끝나면 docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에" · 버튼 넷 — docs 단계 폴더 + CLAUDE.md · Floe가 만들고 커밋 · 푸시는 Claude Code ·
//   단계가 이어지는 흐름 · 한 PR). 실제 브라우저로: 1단계 확인은 카드 하나(채팅에 쌓이지 않음, 질문 → 답 순서) → 도전과제 지도(채운 칸 · 빈 칸 · 채우기) → 2단계 초안 확인 → 관문 → 문서 올리기.
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/quest-flow.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { pathToFileURL } = require("node:url");

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
const skip = !puppeteer || !chrome ? `건너뜀 — ${!puppeteer ? "puppeteer" : "Chrome"}를 찾지 못했어요` : false;
if (skip) console.log(`⚠️ e2e/quest-flow: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-quest-e2e-"));
fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
for (const k of ["NAV_RECORD", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
let srv, port;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
test.before(async () => {
  if (skip) return;
  port = await freePort(); process.env.NAV_PORT = String(port);
  const Srv = require("../../03-backend/navigator/server.js");
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken();
});
test.after(() => { if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });

const Nav = require("../../03-backend/navigator/navigator.js");
const DRAFT = { topic: "독서 모임 알림 앱", pain: "모임 날짜를 자꾸 잊어버려요", change: "모임 전날 알림이 와요", who: "독서 모임 회원 열두 명", size: "medium", sizeWhy: "알림 하나라 흔한 방법이에요" };
const judged = (stage, tier) => ({ stage, reason: `${stage + 1}단계 할 일을 다 했어요`, criteria: Nav.criteriaFor(stage, tier).map((c) => ({ text: c.text, term: c.term, met: true, evidence: `${c.text}: 적음` })),
  next: { what: "다음", why: "다 했어요", question: "다음은 무엇부터 할까요?", action: "고르면 적어 둬요", options: ["가", "나"] } });
const stageDraft = (stage, tier) => ({ items: Nav.criteriaFor(stage, tier).map((c) => (c.term === "PRD" ? { pick: "light", why: "짧게", from: [] } : { text: `${c.text} — 초안`, from: stage === 2 ? [{ s: 1, i: 0 }] : [{ s: 0, i: 0 }] })), prep: ["준비 하나"], say: `${stage + 1}단계 초안이에요` });

const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 5000 }); await page.click(sel); await wait(300); };
const nowSay = (page) => page.evaluate(() => document.querySelector(".msg.now")?.textContent || "");
const past = (page) => page.evaluate(() => [...document.querySelectorAll(".mc.chat .log .msg:not(.now):not(.sys)")].map((m) => `${m.classList.contains("me") ? "me" : "floro"}: ${m.textContent.trim()}`));
async function paste(page, text) {
  await page.click(".mc.chat [data-act=say]");
  await page.evaluate((t) => { const el = document.querySelector(".mc.chat [data-act=say]"); el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, text);
  await page.keyboard.press("Enter"); await wait(600);
}
async function passGate(page) {
  await click(page, "[data-act=gate]"); await click(page, "[data-act=yes]");
  if (await page.$("[data-act=check-pick]")) { await click(page, "[data-act=check-pick]"); if (await page.$("[data-act=check-go]")) await click(page, "[data-act=check-go]"); }
  if (await page.$(".mc.chat [data-act=go]")) await click(page, ".mc.chat [data-act=go]");   // 마지막(8단계) 관문의 '마치기'(C-40)
  await wait(600);
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")));

test("연습: 1단계 확인은 카드 하나로(채팅에 쌓이지 않음 · 질문 → 답 순서) → 도전과제 지도(1단계 채움 · 2단계 빈 칸) → 2단계 초안 확인 → 관문 → 문서로 묶기(연습은 올리지 않음)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    await page.goto(`${pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href}#start`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    await paste(page, "동아리 행사 신청 앱을 만들고 싶어요");
    let p = await past(page);
    assert.ok(p.findIndex((m) => m.startsWith("floro: 원하는 것을")) < p.findIndex((m) => m.startsWith("me: 동아리 행사")), `질문 → 답 순서: ${JSON.stringify(p)}`);
    await click(page, ".mc.chat [data-act=draft-ok]");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".msg.now .dchk li").length), 4, "지금 말 안에 넷을 한곳에");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".msg.now .dchk li.y").length), 1, "확인한 칸은 표시");
    await click(page, ".mc.chat [data-act=draft-ok]"); await click(page, ".mc.chat [data-act=draft-ok]");
    await click(page, '.mc.chat [data-act=draft-size][data-i="1"]'); await wait(600);
    p = await past(page);
    assert.ok(!p.some((m) => /^me: (맞아요|보통)$/.test(m)), `칸마다 맞아요가 쌓이지 않는다: ${JSON.stringify(p)}`);
    assert.ok(p.some((m) => m.includes("1단계 초안을 확인했어요")), "끝나면 한 줄로 정리");
    assert.ok(p.length <= 5, `1단계 뒤 지난 말은 다섯 줄 안: ${p.length} ${JSON.stringify(p)}`);
    // 도전과제 지도 — 기본이 '한눈에', 1단계 칸이 다 차고 2단계는 아직
    if (!(await page.$(".qwin"))) await click(page, ".tb [data-act=qwin-toggle]");   // 초안을 받으면 퀘스트 창이 이미 떠 있다
    await click(page, "[data-act=qtab][data-tab=tree]");
    assert.ok(await page.$(".qwin .jmap"), "도전과제의 기본은 지도");
    assert.equal(await page.$eval('.jmap .jm-stage[data-n="0"] .jm-count', (e) => e.textContent.trim()), "4/4");
    assert.ok((await page.$eval('.jmap .jm-stage[data-n="0"]', (e) => e.textContent)).includes("동아리 행사 신청을 종이로"), "채운 칸에는 적은 글");
    await passGate(page);
    // 2단계 — 1단계 결과로 만든 초안(연습 예시), 제목은 주제, 받기 화면 없이 확인
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /2단계 · 동아리 행사 신청 앱/);
    assert.match(await nowSay(page), /맞나요/); assert.match(await nowSay(page), /예시예요/);
    assert.ok(!(await page.$(".qwin .ev")), "받기 화면 없이");
    const s1 = await saved(page);
    assert.equal(s1.results["0"].items.length, 4, "1단계 결과를 남긴다(한곳에서 보기 · 문서)");
    await click(page, "[data-act=qtab][data-tab=tree]");
    assert.ok((await page.$$('.jmap .jm-stage[data-n="1"] .jm-miss')).length >= 1, "2단계의 빈 칸이 보인다");
    await click(page, '.jmap .jm-stage[data-n="1"] [data-act=jmap-fill]');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.dataset.act), "say", "채우기 — 채팅 칸으로");
    const n2 = (await saved(page)).quest.objs.length;
    for (let k = 0; k < n2; k++) { if (await page.$(".mc.chat [data-act=draft-ok]")) await click(page, ".mc.chat [data-act=draft-ok]"); else await click(page, '.mc.chat [data-act=draft-pick][data-i="0"]'); }
    await wait(600);
    assert.match(await nowSay(page), /모두 했어요/);
    await passGate(page);
    // 2단계가 끝나면 문서로 묶어 올릴지 묻는다 — 파일 목록 · 미리 보기, 연습은 올리지 않는다
    assert.match(await nowSay(page), /GitHub에 올릴까요/);
    const files = await page.evaluate(() => [...document.querySelectorAll(".msg.now .ship-files li")].map((li) => li.textContent));
    for (const f of ["docs/01-idea/idea.md", "docs/02-plan/plan.md", "CLAUDE.md", "README.md"]) assert.ok(files.some((x) => x.includes(f)), f);
    await click(page, ".mc.chat [data-act=ship-go]");
    assert.match(await page.evaluate(() => document.querySelector(".mc.chat .log")?.textContent || ""), /연습이라 올리지 않았어요/);
    // C-39 — 3단계도 1 · 2단계 결과로 만든 초안: 맨 위에 준비할 것, 칸마다 재료
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /3단계 · 동아리 행사 신청 앱/);
    assert.match(await nowSay(page), /맞나요/);
    assert.ok((await page.$$(".msg.now .dprep li")).length >= 1, "이 단계 전에 준비할 것");
    assert.match(await page.$eval(".msg.now .mc-foot", (e) => e.textContent), /재료 — 2단계/, "칸마다 재료(지난 단계 칸)");
    const s2 = await saved(page);
    assert.match(s2.results["1"].passed, /^\d{4}-\d{2}-\d{2}$/, "관문을 지난 날"); assert.match(s2.results["0"].at, /^\d{4}-/, "칸을 다 확인한 날");
    assert.equal(s2.results["0"].items[0].by, "ok", "맞아요 = 플로로 초안 그대로"); assert.equal(s2.results["0"].items[3].by, "pick", "크기는 고름");
    assert.ok(s2.results["0"].check.length === 4, "완료 기준과 근거");
    // 도전과제 — 네 칸 흐름 · 누가 정했나 · 재료(올리면 그 칸이 빛남)
    await click(page, "[data-act=qtab][data-tab=tree]");
    for (const k of ["in", "ai", "me", "gate"]) assert.ok(await page.$(`.jmap .jm-stage[data-n="0"] .jm-step.${k}`), `1단계 흐름 ${k}`);
    assert.match(await page.$eval('.jmap .jm-stage[data-n="0"] .jm-step.in', (e) => e.textContent), /처음 말한 것/);
    assert.match(await page.$eval('.jmap .jm-stage[data-n="1"] .jm-step.gate', (e) => e.textContent), /지났어요/);
    assert.equal(await page.$eval('.jmap .jm-stage[data-n="0"] .jm-cell[data-cell="0-0"] .jm-by', (e) => e.textContent), "그대로");
    const ref = await page.$('.jmap .jm-stage[data-n="2"] .jm-ref');
    assert.ok(ref, "3단계 칸의 재료");
    const id = await ref.evaluate((e) => e.dataset.ref);
    await ref.hover(); await wait(200);
    assert.notEqual(await page.$eval(`.jm-cell[data-cell="${id}"]`, (e) => getComputedStyle(e).outlineStyle), "none", "재료에 올리면 그 칸이 빛난다");
    const n3 = (await saved(page)).quest.objs.length;
    for (let k = 0; k < n3; k++) await click(page, ".mc.chat [data-act=draft-ok]");
    await wait(600);
    assert.match(await nowSay(page), /모두 했어요/);
    await passGate(page);
    assert.match(await nowSay(page), /1 ~ 3단계에서 정한 것을 문서로 묶었어요 — 내 GitHub에 올릴까요/, "3단계 관문에서도 다시 묻는다");
    const files3 = await page.evaluate(() => [...document.querySelectorAll(".msg.now .ship-files li")].map((li) => li.textContent));
    for (const f of ["docs/PRD.md", "docs/decisions.md", "docs/03-requirements/requirements.md"]) assert.ok(files3.some((x) => x.includes(f)), f);
    await click(page, '.msg.now [data-act=ship-peek][data-i="1"]');
    assert.match(await page.$eval(".msg.now .ship-peek pre", (e) => e.textContent), /\| 날짜 \| 단계 \| 할 일 \| 플로로 초안 \| 정한 것 \| 어떻게 \|/, "결정 기록 미리 보기");
    // C-40 — 4 ~ 8단계: 예시 셋 중 고르기 · 남은 칸 모두 맞아요 · 확인한 장은 AI 살펴보기 없이 · 퀘스트 창 쉬운 말 · 마지막 관문까지
    await click(page, ".mc.chat [data-act=ship-later]");
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /4단계 · /);
    assert.equal((await page.$$(".msg.now .dalt button")).length, 3, "칸마다 예시 셋");
    assert.match(await nowSay(page), /골라 주세요/); assert.match(await nowSay(page), /후보 찾기 — /, "제목은 짧은 이름 — 쉬운 한 줄");
    await click(page, '.msg.now .dalt [data-act=draft-alt][data-i="1"]');
    assert.equal((await saved(page)).quest.by[0], "pick", "예시를 고르면 고름");
    await click(page, "[data-act=qtab][data-tab=quest]");
    const toc = await page.$$eval(".qwin .toc button", (bs) => bs.map((b) => b.textContent));
    assert.ok(toc[0].includes("후보 찾기") && !toc[0].includes("흔히 쓰는 방법 목록에서"), `목차는 짧은 이름: ${toc[0]}`);
    assert.ok(await page.$(".qwin .ln .easy"), "쉬운 한 줄"); assert.equal(await page.$(".qwin .ln .full"), null, "원래 문장은 접혀 있다");
    await click(page, ".qwin [data-act=qmore]");
    assert.match(await page.$eval(".qwin .ln .full", (e) => e.textContent), /흔히 쓰는 방법 목록에서/, "자세히 보기 — 원래 할 일 문장");
    for (let n = 4; n <= 8; n++) {
      if (n > 4) await click(page, ".mc.chat [data-act=ship-later]");
      assert.match(await page.$eval(".tb-stage", (e) => e.textContent), new RegExp(`${n}단계 · `));
      await click(page, ".mc.chat [data-act=draft-all]");
      await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
      await passGate(page);
    }
    assert.match(await nowSay(page), /1 ~ 8단계에서 정한 것을 문서로 묶었어요/, "마지막 관문에서도 올릴지 묻는다");
    const s8 = await saved(page);
    assert.equal(s8.results["7"].checkBy, "confirm", "확인한 대로(AI 없이)"); assert.match(s8.results["7"].passed, /^\d{4}-/);
    assert.equal(s8.results["3"].items[0].by, "pick"); assert.ok(s8.results["3"].items.slice(1).every((x) => x.by === "ok"), "모두 맞아요 = 그대로");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("같은 플로로 말은 한 번만 쌓인다 — 같은 장면에서 내가 여러 번 말해도(2026-10-25 리뷰: 다시 그릴 때마다 '남겼음'이 지워져 같은 말이 또 쌓였다)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    await page.goto(`${pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href}#ex=1&q=draft`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    const first = (await page.$eval(".msg.now .say", (e) => e.textContent)).trim();
    for (const t of ["가", "나", "다"]) await paste(page, t);
    const p = await past(page);
    assert.equal(p.filter((m) => m.startsWith(`floro: ${first}`)).length, 1, `처음 플로로 말은 한 번만(고치기 전엔 내 말마다 또 쌓여 세 번): ${JSON.stringify(p)}`);
    assert.deepEqual(p.filter((m) => m.startsWith("me:")), ["me: 가", "me: 나", "me: 다"]);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("1단계 '남은 칸 모두 맞아요' — 줄만이 아니라 만드는 크기도 플로로가 권한 크기(보통)로, 2단계는 그 크기의 할 일 수로(2026-10-26 리뷰)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {} });
    await page.goto(`${pathToFileURL(path.join(__dirname, "../../02-frontend/navigator/index.html")).href}#start`, { waitUntil: "load" });
    await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
    await paste(page, "동아리 행사 신청 앱을 만들고 싶어요");
    assert.notEqual((await saved(page)).tier, "Xpress", "처음엔 기본 크기");
    await click(page, ".mc.chat [data-act=draft-all]");
    await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
    const s = await saved(page);
    assert.equal(s.tier, "Xpress", "권한 크기 '보통'이 만드는 크기가 된다 — 크기 칩을 누른 것과 같게");
    assert.equal(s.results["0"].items[3].lines[0].startsWith("크기: 보통"), true);
    await passGate(page);
    assert.equal((await saved(page)).quest.objs.length, Nav.criteriaFor(1, "Xpress").length, "2단계는 보통의 할 일 수로");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

async function openLive(browser, { stageFail = false } = {}) {
  const page = await browser.newPage();
  const seen = { stagedraft: [], docs: [], judge: [], errors: [] };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) seen.errors.push(m.text()); });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  let taskCalls = 0;
  const report = (pushed) => ({ items: [{ check: "위 파일들만 커밋했다", done: true, evidence: "커밋 1개" }, { check: "지금 브랜치를 원격(origin)에 푸시했다", done: pushed, evidence: pushed ? "푸시함" : "" }],
    easy: pushed ? "올렸어요" : "원격(origin)이 없어서 푸시하지 않았어요", ask: "", done: pushed ? 2 : 1, total: 2 });
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    const json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    const b = () => JSON.parse(req.postData() || "{}");
    if (p === "/api/start") return json({ ok: true, start: DRAFT, tokens: 900 });
    if (p === "/api/judge") { const x = b(); seen.judge.push(x); return json({ ok: true, judgement: judged(x.stage, x.tier), tokens: 500 }); }
    if (p === "/api/stagedraft") { const x = b(); seen.stagedraft.push(x); return json(stageFail ? { ok: false, reason: "AI에 연결하지 못했어요" } : { ok: true, draft: stageDraft(x.stage, x.tier), tokens: 700 }); }
    if (p === "/api/quest") return json({ ok: false, reason: "시험에서는 기본 글" });
    if (p === "/api/docs") { seen.docs.push(b()); taskCalls = 0; return json({ ok: true, project: "test-1", files: ["docs/README.md", "docs/02-plan/plan.md"], task: { state: "running", at: 7 } }); }
    if (p === "/api/task") { taskCalls += 1; return json({ ok: true, task: taskCalls < 2 ? { state: "running", at: 7 } : { state: "done", code: 0, at: 7, report: report(seen.docs.length < 2) } }); }   // 두 번째 올리기는 푸시를 못 한 보고
    return req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: "cli" })); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify({ mode: "live" })); sessionStorage.setItem("seeded", "1"); } } catch {}
  });
  await page.goto(`http://127.0.0.1:${port}/#start`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say]", { timeout: 8000 });
  return { page, seen };
}
// 1단계를 확인하고 관문을 지난다 — 돌려주는 것: 관문 전에 미리 부른 단계 초안 수(C-40 '다음 단계 초안 미리')
async function stageOne(page, seen) {
  await paste(page, "독서 모임 알림 앱을 만들고 싶어요. 모임 날짜를 자꾸 잊어요.");
  for (let k = 0; k < 3; k++) await click(page, ".mc.chat [data-act=draft-ok]");
  await click(page, '.mc.chat [data-act=draft-size][data-i="1"]');
  await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
  const before = seen ? seen.stagedraft.length : 0;
  await passGate(page);
  return before;
}

test("진짜 AI(가로챔): 관문을 지나면 1단계 결과 · 받은 글로 2단계 초안(/api/stagedraft)을 받고 칸마다 동의 → 관문 → 문서를 작업 폴더에 쓰고 커밋 · 푸시는 Claude Code(/api/docs)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser);
    assert.equal(await stageOne(page, seen), 1, "1단계 초안을 받자마자 2단계 초안을 뒤에서 미리 — 관문 전에 이미 불렀다(C-40)");
    assert.equal(seen.stagedraft.filter((x) => x.stage === 1).length, 1, "2단계 초안은 한 번 — 관문을 지나도 다시 부르지 않는다(모두 맞아요라면 결과가 같다)");
    const sd = seen.stagedraft[0];
    assert.equal(sd.stage, 1); assert.equal(sd.tier, "Xpress");
    assert.match(sd.idea, /독서 모임 알림 앱을 만들고 싶어요/, "받은 글");
    assert.deepEqual(sd.prev.map((p) => p.stage), [0], "지난 단계 결과 — 단계마다 { stage, items }(C-39)");
    assert.deepEqual(sd.prev[0].items.map((x) => x.lines[0]), [DRAFT.pain, DRAFT.change, DRAFT.who, `크기: 보통 — ${DRAFT.sizeWhy}`], "1단계 결과");
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /2단계 · 독서 모임 알림 앱/);
    for (let k = 0; k < Nav.criteriaFor(1, "Xpress").length; k++) await click(page, ".mc.chat [data-act=draft-ok]");
    await page.waitForFunction(() => document.querySelector(".msg.now .say")?.textContent.includes("모두 했어요"), { timeout: 5000 });
    assert.equal(seen.judge.length, 0, "초안을 칸마다 확인한 장은 AI가 다시 살펴보지 않는다(C-40, FR-1 · FR-2 바뀜)");
    await passGate(page);
    assert.match(await nowSay(page), /GitHub에 올릴까요/);
    await click(page, ".mc.chat [data-act=ship-go]");
    assert.equal(seen.docs.length, 1);
    assert.equal(seen.docs[0].topic, "독서 모임 알림 앱");
    assert.deepEqual(Object.keys(seen.docs[0].results).sort(), ["0", "1"], "1 · 2단계 결과");
    const d0 = seen.docs[0].results["0"];
    assert.match(seen.docs[0].idea, /독서 모임 알림 앱을 만들고 싶어요/, "처음 말한 것도(기획서 · 1단계 재료)");
    assert.equal(d0.items[0].by, "ok"); assert.equal(d0.items[0].draft, DRAFT.pain); assert.match(d0.passed, /^\d{4}-/); assert.equal(d0.check.length, 4);
    assert.deepEqual(seen.docs[0].results["1"].items[0].from, [{ s: 0, i: 0 }], "2단계 칸의 재료");
    assert.deepEqual(seen.stagedraft.map((x) => x.stage), [1, 2, 3], "2단계 초안을 받자마자 3단계를, 3단계가 열리자 4단계를 미리 — 같은 단계를 두 번 부르지 않는다");
    assert.deepEqual(seen.stagedraft[1].prev.map((p) => p.stage), [0, 1], "3단계 초안은 1 · 2단계 결과로");
    assert.match(await nowSay(page), /Claude Code에 맡겼어요/);
    await page.waitForFunction(() => document.querySelector(".mc.chat .log")?.textContent.includes("올리기를 마쳤어요"), { timeout: 9000 });
    // 도전과제 지도에서 다시 묶기 — 이번엔 Claude Code가 푸시를 못 했다고 보고하면 '마쳤어요'라고 하지 않는다(2026-10-25 리뷰)
    if (!(await page.$(".qwin"))) await click(page, ".tb [data-act=qwin-toggle]");
    await click(page, "[data-act=qtab][data-tab=tree]");
    await click(page, ".jmap [data-act=ship-open]");
    assert.match(await nowSay(page), /GitHub에 올릴까요/); assert.match(await nowSay(page), /test-1|작업 폴더\(/, "어느 폴더에 쓰는지 보인다");
    await click(page, ".mc.chat [data-act=ship-go]");
    await page.waitForFunction(() => document.querySelector(".mc.chat .log")?.textContent.includes("푸시는 못 했어요"), { timeout: 9000 });
    assert.match(await page.evaluate(() => document.querySelector(".mc.chat .log").textContent), /원격\(origin\)이 없어서/);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("2단계 초안을 못 받으면: 까닭을 말하고 전처럼 2단계 받기 화면(한 줄씩)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await openLive(browser, { stageFail: true });
    await stageOne(page);
    assert.match(await page.evaluate(() => document.querySelector(".mc.chat .log")?.textContent || ""), /2단계 초안은 만들지 못했어요/);
    assert.ok(await page.$(".qwin .ev"), "전처럼 받기 화면");
    assert.match(await page.$eval(".tb-stage", (e) => e.textContent), /2단계 · 독서 모임 알림 앱/, "제목은 주제 그대로");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
