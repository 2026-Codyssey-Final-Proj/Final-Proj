// claude-drafted: 2026-10-18 — 고칠 목록 F-15(checklist.md 4·5단계 5번 "휴대폰 폭(390px)에서 가로 스크롤이 없는지 E2E 하나로")의 앞 절반.
// 시연 페이지를 파일로 바로 열어(서버 · AI 없음) 390px 폭에서 문서가 화면보다 넓어지지 않는지 본다. 이재엽 "다 GO"(2026-10-18).
// 브라우저가 있어야 한다: puppeteer(PUPPETEER_PATH 또는 npx 캐시)와 Chrome(CHROME_PATH 또는 기본 위치). 없으면 실패하지 않고 "건너뜀"을 크게 알린다 —
// 팀원 컴퓨터(Windows 등)에서 전체 시험이 이것 때문에 막히지 않게. 접근성 자동 검사(axe)는 도구를 들이는 판정 뒤에 더한다(F-15 뒤 절반).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.join(__dirname, "../..");
const FRONT = path.join(ROOT, "02-frontend");
// 시연 길잡이 9장면이 지나는 페이지와 주소 끝 — 화면이 바뀌면 여기도
const PAGES = ["index.html", "navigator/index.html#ex=1", "navigator/index.html#ex=1&done&gate", "navigator/index.html#tab=all", "navigator/index.html#tab=lib",
  "library/index.html#lib", "library/index.html#lib-f1", "library/index.html#lib-review", "library/sky.html#year", "share/index.html"];
const WIDTH = 390;

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
if (skip) console.log(`⚠️ e2e/responsive: ${skip}`);

test(`휴대폰 폭(${WIDTH}px): 시연 페이지마다 가로 스크롤이 생기지 않는다`, { skip }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: 844, isMobile: true, hasTouch: true });
    const wide = [];
    for (const p of PAGES) {
      const [file, hash] = p.split("#");
      await page.goto(`${pathToFileURL(path.join(FRONT, file)).href}${hash ? `#${hash}` : ""}`, { waitUntil: "load" });
      await new Promise((r) => setTimeout(r, 400));
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > WIDTH) wide.push(`${p} (문서 폭 ${sw}px)`);
    }
    assert.deepEqual(wide, [], `화면보다 넓은 페이지: ${wide.join(", ")}`);
  } finally { await browser.close(); }
});
