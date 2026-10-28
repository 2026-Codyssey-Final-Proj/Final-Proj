// claude-drafted: 2026-10-28 — F-72(임유정 "화면에 나타난 폴더명이 바뀌진 않아 … 새로고침 눌러도 안바뀌던데 수정해줘").
// 앱 메뉴(상단바 · 트레이)의 '프로젝트 폴더 연결… · 연결 빼기…'는 섬의 단추를 거치지 않는다 — 앱(main.js)이 끝난 뒤 floe:project로 알리면
// 섬이 옛 이름(/api/github)을 잊고 다시 묻는지 실제 브라우저에서 본다. 앱인 척(window.floeApp.onProject 흉내), /api/github는 가로채 정해 둔 이름을 준다.
// puppeteer · Chrome이 없으면 건너뛴다. 실행: node --test 04-tests/e2e/project-menu.test.js
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
if (skip) console.log(`⚠️ e2e/project-menu: ${skip}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-project-menu-e2e-"));
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

test("메뉴로 다른 폴더를 이으면 섬이 이름을 다시 묻고 새 이름으로 말한다 · 연결을 빼도 다시 묻는다 (F-72)", { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
  try {
    const page = await browser.newPage();
    const errors = [], asked = [];
    let name = "old-app";
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setViewport({ width: 1440, height: 900 });
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (new URL(req.url()).pathname !== "/api/github") return req.continue();
      asked.push(name);
      req.respond({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify({ ok: true, project: name, gh: { found: true, signedIn: true }, git: false, remote: null, why: "folder" }) });
    });
    await page.evaluateOnNewDocument(() => {
      const noop = () => {}, off = () => () => {};
      window.floeApp = { platform: "win32", resize: noop, thru: noop, expand: noop, openSettings: noop, saveKey: noop, clearKey: noop,
        onCursor: off, onExpanded: off, onNotch: off, connect: async () => ({ ok: false, message: "" }), disconnect: async () => ({ ok: false, message: "" }),
        onProject: (cb) => { window.__project = cb; return () => {}; } };
      try { localStorage.setItem("floe:setup:v1", JSON.stringify({ done: true })); } catch {}
    });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load" });
    await page.waitForFunction(() => typeof window.__project === "function", { timeout: 8000 });
    await wait(400);
    assert.equal(await page.evaluate(() => window.floeUnsaved()), 0, "앱이 폴더를 고르기 전에 묻는 '저장 안 한 파일 수' — 열린 파일이 없으면 0");
    const before = asked.length;

    // 켤 때는 접힌 알약(C-55, 2026-10-28) — 플로로의 말은 채팅에 쌓이니 섬을 펼쳐 둔다(전에는 펼친 섬을 가정해 이 Mac에서 늘 실패했다)
    if (await page.$(".pill")) { await page.click(".pill"); await wait(300); }
    name = "samsung-stock-ai";
    await page.evaluate(() => window.__project({ add: true, name: "samsung-stock-ai", config: false }));
    await page.waitForFunction(() => document.body.innerText.includes("samsung-stock-ai 폴더와 이었어요"), { timeout: 5000 });
    assert.ok(asked.length > before && asked.at(-1) === "samsung-stock-ai", "이은 뒤 /api/github를 다시 묻는다 — 옛 이름을 붙들지 않는다");

    const afterAdd = asked.length;
    name = "";
    await page.evaluate(() => window.__project({ add: false }));
    await wait(400);
    assert.ok(asked.length > afterAdd, "연결을 빼도 다시 묻는다");
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
