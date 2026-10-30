// claude-drafted: 2026-10-30 — 이재엽 "빠진 시험 채우기": 2026-10-30에 만든 넷을 실제 브라우저로 본다(그때까지는 글자 모양 · 단위 시험만).
//   ① C-38 넘김 카드(#283) ② F-106 키 거절 → 연습 단추(#285) ③ C-52 빼 둘 곳(#287) ④ C-47 한 장(#286)
//   서버는 이 시험 안에서 켜고, AI 주소(server.js AI_ROUTES)는 가로채 정해 둔 답을 준다 — AI를 부르지 않고 밖으로 나가는 요청이 없다.
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/features-1030.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

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
if (skip) console.log(`⚠️ e2e/features-1030: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-1030-e2e-"));
fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("../navigator/hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });
for (const k of ["NAV_RECORD", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
// ③의 프로젝트 폴더 — 빼 둘 파일 둘과 남길 파일 하나
const PROJ = path.join(TMP, "club-app");
fs.mkdirSync(path.join(PROJ, "secrets"), { recursive: true });
fs.writeFileSync(path.join(PROJ, "README.md"), "# 동아리 앱\n");
fs.writeFileSync(path.join(PROJ, "secrets", "plan.md"), "비밀 계획\n");
fs.writeFileSync(path.join(PROJ, "회원명단.csv".normalize("NFD")), "이름\n");   // macOS가 주는 NFD 이름(새 맥락 리뷰)
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
test.after(() => { if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); });

const AI = ["/api/judge", "/api/answer", "/api/draft", "/api/review", "/api/setup/check", "/api/task/tidy", "/api/quest", "/api/plan", "/api/start", "/api/stagedraft", "/api/prepare", "/api/chat"];
const KEY_BAD = { ok: false, kind: "key", reason: "API 키가 맞지 않거나 권한이 없어요 (401) — 키와 ANTHROPIC_BASE_URL(중계 서버를 쓴다면)을 확인하세요" };
const FAKE_KEY = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789";   // secret-check: allow — 가짜 키(가리기 시험)

// via: practice(연습) · cli(진짜 AI), ai(path) → 그 AI 주소의 답(없으면 '시험 — AI 없음'), seed — 처음 한 번 넣을 기록
async function open(browser, { via, hash = "#base", ai = () => null, seed = null }) {
  const page = await browser.newPage(); const errors = [], called = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    if (req.method() === "POST" && AI.includes(p)) { called.push(p); const o = ai(p) || { ok: false, reason: "시험 — AI 없음" }; return req.respond({ status: o.ok ? 200 : 502, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) }); }
    return req.continue();
  });
  await page.evaluateOnNewDocument((v, s) => { try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true, via: v })); if (s && !sessionStorage.getItem("seeded")) { localStorage.setItem("navigator-prototype:v1", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); } } catch {} }, via, seed);
  await page.goto(`http://127.0.0.1:${port}/${hash}`, { waitUntil: "load" });
  await page.waitForSelector(".mc.chat [data-act=say], .mc [data-act=say]", { timeout: 8000 });
  return { page, errors, called };
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("navigator-prototype:v1")));
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 8000 }); await page.click(sel); await wait(300); };
const say = async (page, text) => {
  await page.$eval("[data-act=say]", (el, t) => { el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, text);
  await click(page, "[data-act=send]");
};

test("① C-38 넘김 카드 — '더 보기' → '다른 AI에 넘기기' → 지금 단계 · 할 일이 든 글(비밀값은 가림), 닫기", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, errors } = await open(browser, { via: "practice", hash: "#ex=1&q=draft", seed: { mode: "fixture", idea: `동아리 신청 앱 — 시험 키 ${FAKE_KEY} · 메일 a.b@example.com` } });
    await click(page, "[data-act=more-toggle]");
    await click(page, "[data-act=handoff-copy]");
    await page.waitForSelector(".msg.ho textarea.ho-text", { timeout: 5000 });
    const card = await page.$eval(".msg.ho", (el) => ({ lead: el.querySelector("p").textContent, text: el.querySelector("textarea").value }));
    assert.match(card.lead, /복사했어요|복사가 막혔어요/, "클립보드가 막혀도(headless) 글은 카드에 남는다");
    assert.match(card.text, /^\[Floe 넘김 카드\]/);
    assert.match(card.text, /지금 단계: \d단계 · /);
    assert.match(card.text, /이 단계의 할 일 \(✓ 채움 · ▶ 지금 · ○ 아직\)\n[▶✓○] /);
    assert.match(card.text, /끝났는지는 Floe가 판단해요/);
    assert.match(card.text, /만들고 싶은 것: 동아리 신청 앱/);
    assert.doesNotMatch(card.text, /sk-ant-api03|a\.b@example\.com/, "비밀값 · 메일은 가린다");
    await click(page, ".msg.ho [data-act=handoff-close]");
    assert.equal(await page.$(".msg.ho"), null, "닫기");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("② F-106 키 거절 — 카드 → '연습용 예시로 둘러보기'면 연습 모드, 다음 AI 답이 키 거절이 아니면 카드가 꺼진다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    // 가: 키 거절 → 카드 → 연습으로
    const a = await open(browser, { via: "cli", ai: () => KEY_BAD });
    assert.equal((await saved(a.page)).mode, "live");
    await say(a.page, "동아리 행사 신청을 한곳에 모으는 앱을 만들고 싶어요");
    await a.page.waitForSelector("[data-act=practice-now]", { timeout: 10000 });
    assert.match(await a.page.$eval(".msg.now", (el) => el.textContent), /API 키가 거절됐어요/);
    assert.ok(a.called.includes("/api/start"), a.called.join(","));
    await click(a.page, "[data-act=practice-now]");
    assert.equal((await saved(a.page)).mode, "fixture", "사람이 누르면 연습 모드");
    assert.equal(await a.page.$("[data-act=practice-now]"), null, "카드가 닫힌다");
    assert.deepEqual(a.errors, []);
    await a.page.close();
    // 나: 키 거절 → 카드 → 다음 AI 답이 키 거절이 아니면(다른 실패여도) 표시가 꺼진다 — 눌러서 바꾸지 않아도
    let good = false;
    const b = await open(browser, { via: "cli", seed: { mode: "live" }, ai: () => (good ? { ok: false, reason: "시험 — 다른 실패" } : KEY_BAD) });   // 같은 브라우저라 앞 장면의 연습 모드 기록이 남아 있다 — 진짜 AI 모드로 시작
    await say(b.page, "동아리 행사 신청을 한곳에 모으는 앱을 만들고 싶어요");
    await b.page.waitForSelector("[data-act=practice-now]", { timeout: 10000 });
    good = true; const before = b.called.length;
    await say(b.page, "단톡방에서 신청을 놓쳐요");
    await b.page.waitForFunction((n) => !document.querySelector("[data-act=practice-now]"), { timeout: 10000 }, before);
    assert.ok(b.called.length > before, `다음 AI 부르기가 있었다: ${b.called.join(",")}`);
    assert.equal((await saved(b.page)).mode, "live", "저절로 연습으로 바꾸지 않는다");
    assert.deepEqual(b.errors, []);
  } finally { await browser.close(); }
});

// ③은 서버가 폴더를 알아야 한다 — 훅 알림 하나로 그 폴더(PROJ)에서 Claude Code가 일한다고 알린다
const Steps = require("../../03-backend/navigator/steps.js");
function hookEvent(cwd) {
  const ev = { hook_event_name: "PostToolUse", session_id: "s-1030", cwd, tool_name: "Read", tool_input: { file_path: path.join(cwd, "README.md") } };
  const body = JSON.stringify({ ...ev, tool: "claude", step: Steps.fromHook(ev), file: Steps.fileOf(ev) });
  const token = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: "/api/event", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), "X-Nav-Token": token } }, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); });
    req.on("error", reject); req.end(body);
  });
}
const filePaths = (page) => page.evaluate(async () => { const r = await (await fetch("/api/files", { cache: "no-store" })).json(); return { project: r.project, paths: (r.files || []).filter((f) => !f.dir).map((f) => f.path), excluded: r.excluded }; });
const typeLines = (page, text) => page.$eval(".ex-text", (el, t) => { el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, text);

test("③ C-52 빼 둘 곳 — 설정 '기록' 탭에 적고 저장하면 그 파일 · 폴더가 파일 목록에서 빠진다, 틀린 줄은 까닭과 함께 거절", { skip }, async () => {
  assert.equal(await hookEvent(PROJ), 200);
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, errors } = await open(browser, { via: "cli", seed: { mode: "live" } });
    const before = await filePaths(page);
    assert.equal(before.project, "club-app");
    assert.ok(before.paths.includes("secrets/plan.md") && before.paths.some((p) => p.normalize("NFC") === "회원명단.csv"), before.paths.join(","));
    await click(page, "[data-act=settings]");
    await click(page, "[data-act=set-tab][data-tab=keep]");
    await page.waitForSelector(".ex-text", { timeout: 8000 });
    await page.waitForFunction(() => /'club-app' 폴더의 목록이에요/.test(document.querySelector(".set-body")?.textContent || ""), { timeout: 5000 });   // 어느 폴더의 목록인지 보인다
    // 틀린 줄 — 아무것도 바꾸지 않고 줄마다 까닭
    await typeLines(page, "../밖\n**/x.md");
    await click(page, "[data-act=ex-save]");
    await page.waitForSelector(".ex-bad li", { timeout: 5000 });
    const bad = await page.$$eval(".ex-bad li", (ls) => ls.map((l) => l.textContent));
    assert.equal(bad.length, 2, bad.join(" / "));
    assert.ok(bad[0].includes("../밖") && bad[1].includes("**/x.md"), bad.join(" / "));
    assert.equal((await filePaths(page)).excluded, 0, "거절이면 바꾸지 않는다");
    // 맞는 줄 — 저장하면 목록에서 빠진다(한글 이름은 NFC로 적어도 NFD 파일이 빠진다)
    await typeLines(page, "secrets/\n회원명단.csv");
    await click(page, "[data-act=ex-save]");
    await page.waitForFunction(() => /저장했어요 — 빼 둔 곳 2줄/.test(document.querySelector(".set-body")?.textContent || ""), { timeout: 5000 });
    const after = await filePaths(page);
    assert.equal(after.excluded, 2);
    assert.ok(after.paths.includes("README.md"), after.paths.join(","));
    assert.ok(!after.paths.some((p) => p.startsWith("secrets/") || p.normalize("NFC") === "회원명단.csv"), after.paths.join(","));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test("④ C-47 한 장 — 완료 보고 뒤 '③ 기록' 카드(칸 다섯) → 고칠래요 · 저장하면 그 단계 결과에 한 장이 남고 카드가 닫힌다", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, errors } = await open(browser, { via: "practice", hash: "#ex=1&q=done", seed: { mode: "fixture" } });
    await click(page, "[data-act=quest-report]");
    await page.waitForSelector("[data-act=sheet-ok]", { timeout: 8000 });
    const card = await page.$eval("[data-act=sheet-ok]", (b) => (b.closest(".msg") || b.closest("section")).textContent);
    for (const f of ["생각", "한 일", "정한 것", "배운 말", "다음 할 일"]) assert.ok(card.includes(f), `칸 '${f}': ${card.slice(0, 200)}`);
    await click(page, "[data-act=sheet-edit]");
    assert.equal((await page.$$("[data-act=sheet-field]")).length, 5, "고칠래요 — 칸 다섯");
    await page.$eval("[data-act=sheet-field]", (el) => { el.value = "시험 — 손으로 고친 생각"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await click(page, "[data-act=sheet-save]");
    const s = await saved(page);
    const n = Object.keys(s.results || {}).find((k) => s.results[k] && s.results[k].sheet);
    assert.ok(n !== undefined, "그 단계 결과에 한 장");
    assert.ok(Object.values(s.results[n].sheet).some((v) => String(v).includes("손으로 고친 생각")), JSON.stringify(s.results[n].sheet).slice(0, 300));
    assert.equal(await page.$("[data-act=sheet-ok]"), null, "카드가 닫힌다");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
