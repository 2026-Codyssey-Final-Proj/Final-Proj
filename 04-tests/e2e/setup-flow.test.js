// claude-drafted: 2026-10-24 — C-31 시작하는 자리(이재엽 "5분짜리 온보딩 시스템을 바탕으로 깃허브를 연동하고 클로드 코드나 api키를 받는거도 이어져서 만들어지면 좋겠어").
// 처음 설정이 인사 → AI 연결 → GitHub → 프로젝트 → 준비 끝으로 한 번에 이어지는지 실제 브라우저에서 눌러 본다. 서버를 이 시험 안에서 켜고(진짜 AI는 부르지 않는다 — 녹화 재생),
// 앱인 척(window.floeApp 흉내)해 가져오기 · 새로 만들기를 기록한다. gh 상태(/api/github) · Claude Code 상태(/api/setup)는 가로채 정해 둔 답을 준다(이 컴퓨터와 상관없이).
// responsive.test.js처럼 puppeteer · Chrome이 없으면 건너뛴다.
// 실행: node --test 04-tests/e2e/setup-flow.test.js
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
const skip = !puppeteer || !chrome ? `건너뜀 — ${!puppeteer ? "puppeteer" : "Chrome"}를 찾지 못했어요(PUPPETEER_PATH · CHROME_PATH로 알려 줄 수 있어요)` : false;
if (skip) console.log(`⚠️ e2e/setup-flow: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-setup-e2e-"));
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

const SETUP = { ok: true, provider: "cli", apiKey: false, relay: false, claude: { found: true, version: "2.1.30", signedIn: true }, replay: true, build: "e2e" };
// 가로채기 — gh 상태 · Claude Code 상태는 정해 둔 답, 저장소 만들기는 받은 본문만 적는다
async function open(browser, { gh = { found: true, signedIn: true }, apps = { found: true, linked: false } } = {}) {
  const page = await browser.newPage();
  const seen = { create: [], link: [], errors: [] };
  page.on("pageerror", (e) => seen.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon\.ico$/.test((m.location() && m.location().url) || "")) seen.errors.push(m.text()); });   // 서버는 favicon을 내주지 않는다(전부터)
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    const json = (o) => req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify(o) });
    if (p === "/api/github") return json({ ok: true, project: "", gh, git: false, remote: null, why: "folder" });
    if (p === "/api/setup") return json(SETUP);
    if (p === "/api/apps") return json({ ok: true, claudeDesktop: apps });   // 같이 쓸 앱(C-38 시험판) — 진짜 Claude Desktop 설정 파일은 건드리지 않는다
    if (p === "/api/apps/link") { seen.link.push(JSON.parse(req.postData() || "{}")); apps = { found: true, linked: true }; return json({ ok: true }); }
    if (p === "/api/github/create") { seen.create.push(JSON.parse(req.postData() || "{}")); return json({ ok: true, project: "club-app", task: { state: "running" } }); }
    return req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    const noop = () => {}, off = () => () => {};
    window.__calls = [];
    const rec = (name, answer) => async (arg) => { window.__calls.push([name, arg]); return answer(arg); };
    window.floeApp = { platform: "darwin", resize: noop, thru: noop, expand: noop, openSettings: noop, disconnect: async () => ({ ok: false, message: "" }), saveKey: noop, clearKey: noop,
      onCursor: off, onExpanded: off, onNotch: off,
      connect: rec("connect", () => ({ ok: true, message: "연결했어요", name: "old-app", where: "~/work/old-app" })),
      myRepos: rec("myRepos", () => [{ name: "gamercross/test-1", private: false }, { name: "gamercross/secret", private: true }]),
      cloneProject: rec("clone", (t) => (/test-1/.test(t) ? { ok: true, name: "test-1", where: "~/Floe/test-1", made: true, repo: "gamercross/test-1" } : { ok: false, message: "가져오지 못했어요 — 저장소 이름을 확인해 주세요." })),
      newProject: rec("new", (n) => ({ ok: true, name: n, where: `~/Floe/${n}`, made: true, repo: "" })) };
    try { localStorage.removeItem("floe:setup:v1"); } catch {}
  });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load" });
  await page.waitForSelector("#floe-setup .su", { timeout: 12000 });
  return { page, seen };
}
const title = (page) => page.$eval("#su-title", (e) => e.textContent.trim());
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: 5000 }); await page.click(sel); await wait(250); };
const dots = (page) => page.$eval(".su-dots", (e) => [e.getAttribute("aria-label"), [...e.children].findIndex((li) => li.classList.contains("on"))]);
async function throughAiAndGithub(page) {
  await click(page, '[data-s="go"][data-to="choose"]');
  assert.equal(await title(page), "AI를 어떻게 불러 올까요?");
  await click(page, '[data-s="pick"][data-via="cli"]');
  await click(page, '[data-s="check"]');
  await page.waitForFunction(() => document.querySelector('[data-s="next"]')?.textContent.includes("다음: 같이 쓸 앱"), { timeout: 5000 });
  await click(page, '[data-s="next"]');
  assert.equal(await title(page), "같이 쓸 앱이 있나요?");
  await page.waitForSelector('[data-s="applink"]', { timeout: 5000 });
  assert.match(await page.$eval('[data-s="next"]', (e) => e.textContent), /건너뛰고 다음/, "잇지 않아도 넘어간다");
  await click(page, '[data-s="next"]');
  assert.equal(await title(page), "GitHub와 이어요");
  await page.waitForFunction(() => !document.querySelector('[data-s="next"]')?.disabled, { timeout: 5000 });
}

test("한 번에 이어진다: 인사 → AI 연결(Claude Code) → GitHub(로그인됨) → 프로젝트(내 저장소 단추로 test-1 가져오기) → 준비 끝 요약 세 줄 — 점은 여섯 칸(같이 쓸 앱은 건너뜀)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await open(browser);
    assert.match(await title(page), /반가워요/);
    assert.deepEqual(await dots(page), ["처음 설정 1 / 6", 0]);
    await throughAiAndGithub(page);
    assert.deepEqual(await dots(page), ["처음 설정 4 / 6", 3]);
    const steps = await page.$$eval(".su-steps li", (ls) => ls.map((l) => l.className));
    assert.deepEqual(steps, ["ok", "ok"], "gh 찾기 · 로그인 둘 다 체크");
    await click(page, '[data-s="next"]');
    assert.equal(await title(page), "어디서 만들까요?");
    assert.equal(await page.$$eval(".su-proj .su-card", (c) => c.length), 3, "가져오기 · 새로 만들기 · 있는 폴더");
    await page.waitForSelector('[data-s="pickrepo"]', { timeout: 5000 });
    assert.deepEqual(await page.$$eval('[data-s="pickrepo"]', (b) => b.map((x) => x.textContent)), ["gamercross/test-1", "gamercross/secret · 비공개"]);
    await click(page, '[data-s="pickrepo"][data-v="gamercross/test-1"]');
    await page.waitForSelector(".su-ok", { timeout: 5000 });
    assert.match(await page.$eval(".su-ok", (e) => e.textContent), /test-1 — ~\/Floe\/test-1/);
    assert.deepEqual(await page.evaluate(() => window.__calls.filter((c) => c[0] === "clone")), [["clone", "gamercross/test-1"]]);
    await click(page, '[data-s="next"]');   // 계획 칸(모든 내용을 한 번에 넣는 칸)은 2026-10-25 C-36으로 뺐다 — 프로젝트 다음은 준비 끝
    assert.equal(await title(page), "준비 끝!");
    assert.deepEqual(await page.$$eval(".su-sum div", (d) => d.map((x) => [x.querySelector("dt").textContent, x.querySelector("dd").textContent])),
      [["AI", "Claude Code로 연결"], ["GitHub", "로그인됨"], ["프로젝트", "test-1 · ~/Floe/test-1"]]);
    assert.equal(await page.$(".su-repo"), null, "가져온 저장소는 다시 만들자고 하지 않는다");
    const box = await page.$eval("#floe-setup .su", (e) => { const r = e.getBoundingClientRect(); return { w: r.width, overflow: document.documentElement.scrollWidth > innerWidth }; });
    assert.equal(box.overflow, false, "가로로 넘치지 않는다");
    await click(page, '[data-s="done"]');
    assert.equal(await page.$("#floe-setup"), null);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("floe:setup:v1")).via), "cli");
    await page.waitForSelector(".msg.now .say", { timeout: 5000 });
    assert.match(await page.$eval(".msg.now .say", (e) => e.textContent), /원하는 것을 플로로에게/, "시작하면 채팅이 원하는 것을 받는다(C-36) — AI는 아직 부르지 않는다");
    assert.deepEqual(seen.create, [], "저장소 만들기는 부르지 않았다");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("같이 쓸 앱: 'Claude Desktop과 잇기'를 누르면 서버에 잇기를 부탁하고(/api/apps/link), 이어지면 '이어져 있어요' · 다시 켜라는 안내 · '다음: GitHub'(C-38 시험판)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await open(browser);
    await click(page, '[data-s="go"][data-to="choose"]');
    await click(page, '[data-s="pick"][data-via="cli"]');
    await click(page, '[data-s="next"]');
    assert.equal(await title(page), "같이 쓸 앱이 있나요?");
    await click(page, '[data-s="applink"]');
    await page.waitForFunction(() => /이어져 있어요/.test(document.querySelector(".su-chip.ok")?.textContent || ""), { timeout: 5000 });
    assert.deepEqual(seen.link, [{ app: "claude-desktop" }]);
    assert.match(await page.$eval(".su-note", (e) => e.textContent), /다시 켜 주세요/);
    assert.equal(await page.$('[data-s="applink"]'), null, "이어지면 단추가 사라진다");
    assert.match(await page.$eval('[data-s="next"]', (e) => e.textContent), /다음: GitHub/);
    await click(page, '[data-s="next"]');
    assert.equal(await title(page), "GitHub와 이어요");
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("새로 만들기면 준비 끝에서 GitHub 저장소도 만들지 묻고(비공개 기본), 시작하기를 누르면 섬이 Claude Code에 맡긴다(/api/github/create)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await open(browser);
    await throughAiAndGithub(page);
    await click(page, '[data-s="next"]');
    await page.type('form[data-s="new"] input[name="pname"]', "club-app");
    await page.click('form[data-s="new"] button[type="submit"]'); await wait(300);
    assert.deepEqual(await page.evaluate(() => window.__calls.filter((c) => c[0] === "new")), [["new", "club-app"]]);
    await click(page, '[data-s="next"]');
    assert.ok(await page.$(".su-repo"), "저장소도 만들지 묻는다");
    assert.equal(await page.$eval('.su-repo input[data-s="makerepo"]', (e) => e.checked), true);
    assert.equal(await page.$eval('[data-s="repovis"][data-v="private"]', (e) => e.getAttribute("aria-pressed")), "true");
    await click(page, '[data-s="done"]');
    await page.waitForFunction(() => true); await wait(500);
    assert.deepEqual(seen.create, [{ visibility: "private" }]);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("GitHub 없이: gh가 없으면 다음은 잠기고 설치 안내 · '다시 확인'이 보이며, 'GitHub 없이 할래요' → 프로젝트 → 고르지 않고 넘어가기 → 요약에 건너뜀", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await open(browser, { gh: { found: false, signedIn: null } });
    await click(page, '[data-s="go"][data-to="choose"]');
    await click(page, '[data-s="pick"][data-via="cli"]');
    await click(page, '[data-s="next"]');   // 확인 없이 다음으로
    await click(page, '[data-s="next"]');   // 같이 쓸 앱 — 건너뛰고 다음(C-38 시험판)
    assert.equal(await title(page), "GitHub와 이어요");
    await page.waitForSelector('a.su-link[href="https://cli.github.com"]', { timeout: 5000 });
    assert.equal(await page.$eval('[data-s="next"]', (e) => e.disabled), true);
    await click(page, '[data-s="ghskip"]');
    assert.equal(await title(page), "어디서 만들까요?");
    assert.equal(await page.$('[data-s="pickrepo"]'), null, "gh가 없으면 내 저장소 단추도 없다(앱이 빈 목록)") ;
    await click(page, '[data-s="next"]');
    assert.deepEqual(await page.$$eval(".su-sum dd", (d) => d.map((x) => x.textContent)), ["Claude Code로 연결", "건너뜀 — 나중에 설정에서", "아직 안 골랐어요 — 설정에서 언제든"]);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});

test("설정의 '프로젝트 바꾸기'는 처음 설정을 프로젝트 칸부터 연다 — 가져온 저장소에 Claude Code 설정이 있으면 알린다(2026-10-24 리뷰)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const { page, seen } = await open(browser);
    await page.keyboard.press("Escape"); await wait(300);   // 처음 설정을 닫고(나중에)
    if (await page.$(".pill")) await click(page, ".pill");   // C-46(2026-10-27): 켜면 알약 — 설정 단추는 펼친 섬에 있다
    await page.evaluate(() => { window.floeApp.cloneProject = async (t) => { window.__calls.push(["clone", t]); return { ok: true, name: "test-1", where: "~/Floe/test-1", made: false, repo: "gamercross/test-1", config: true }; }; });
    await click(page, "[data-act=settings]");
    await click(page, "[data-act=set-tab][data-tab=keep]");   // 설정 판의 기록 탭(2026-10-25)
    await click(page, "[data-act=setup-project]");
    await page.waitForSelector("#floe-setup .su", { timeout: 5000 });
    assert.equal(await title(page), "어디서 만들까요?");
    await page.waitForSelector('[data-s="pickrepo"]', { timeout: 5000 });
    await click(page, '[data-s="pickrepo"][data-v="gamercross/test-1"]');
    await page.waitForSelector(".su-note", { timeout: 5000 });
    assert.match(await page.$eval(".su-main", (e) => e.textContent), /Claude Code 설정이 들어 있어요/);
    assert.deepEqual(seen.errors, []);
  } finally { await browser.close(); }
});
