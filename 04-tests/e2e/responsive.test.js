// claude-drafted: 2026-10-18 — 고칠 목록 F-15(checklist.md 4·5단계 5번 "휴대폰 폭(390px)에서 가로 스크롤이 없고 접근성 자동 검사(axe, WCAG 2 AA) 위반이 0인지 E2E 하나로").
// 시연 페이지를 파일로 바로 열어(서버 · AI 없음) 390px 폭에서 문서가 화면보다 넓어지지 않는지 본다. 이재엽 "다 GO"(2026-10-18).
// 브라우저가 있어야 한다: puppeteer(PUPPETEER_PATH 또는 npx 캐시)와 Chrome(CHROME_PATH 또는 기본 위치). 없으면 실패하지 않고 "건너뜀"을 크게 알린다 —
// 팀원 컴퓨터(Windows 등)에서 전체 시험이 이것 때문에 막히지 않게. axe-core(4.13.0, MPL-2.0)도 같은 방식으로 찾는다 — AXE_PATH 또는 npx 캐시
// (`npx -y -p axe-core@4.13.0 node -e 0`으로 받는다). 판정: external-tools.md 카탈로그(채택 — 시험에서만, 저장소 파일을 고치지 않음).
// 유리판(backdrop-filter)은 axe가 뒤의 색을 잘못 계산해 대비 경보가 잘못 뜬다 — '투명도 줄이기'를 흉내 내 불투명한 판으로 잰다(app.css가 이미 그 판을 둔다).
// preload는 끈다 — 페이지가 자기 스타일 파일을 다시 읽는 기능이고, 꺼 두면 검사가 브라우저 안에서만 돈다.
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
  "library/index.html#lib", "library/index.html#lib-f1", "library/index.html#lib-review", "library/index.html#lib-learn", "library/sky.html#year", "share/index.html"];
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

function findAxe() {
  const tries = [process.env.AXE_PATH];
  const npx = path.join(os.homedir(), ".npm", "_npx");
  try { for (const d of fs.readdirSync(npx)) tries.push(path.join(npx, d, "node_modules", "axe-core", "axe.min.js")); } catch {}
  return tries.filter(Boolean).find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}

const puppeteer = findPuppeteer(), chrome = findChrome(), axe = findAxe();
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

// 시연 장면마다 — 밝은 · 어두운 설정 × PC · 휴대폰. 2026-10-18 처음 잴 때 실제 위반 5곳(색 대비)을 app.css에서 고쳐 0으로 만들었다
const SCENES = ["index.html", "navigator/index.html#start", "navigator/index.html#ex=1", "navigator/index.html#ex=0&crit", "navigator/index.html#ex=1&tab=doc",
  "navigator/index.html#ex=1&done&gate", "navigator/index.html#tab=all", "navigator/index.html#tab=lib", "library/index.html#lib", "library/index.html#lib-f1",
  "library/index.html#lib-review", "library/index.html#lib-learn", "library/sky.html#year", "share/index.html"];
const skipAxe = skip || (!axe && "건너뜀 — axe-core를 찾지 못했어요(`npx -y -p axe-core@4.13.0 node -e 0` 또는 AXE_PATH)");
if (!skip && !axe) console.log(`⚠️ e2e/responsive: ${skipAxe}`);

test("접근성 자동 검사(axe, WCAG 2 A·AA): 시연 장면마다 위반이 0이다 — 밝은 · 어두운 설정, PC · 휴대폰", { skip: skipAxe }, async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files"] });
  try {
    const found = [];
    for (const scheme of ["light", "dark"]) for (const vp of [{ width: 1440, height: 900 }, { width: WIDTH, height: 844, isMobile: true, hasTouch: true }]) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      await page.emulateMediaFeatures([{ name: "prefers-reduced-transparency", value: "reduce" }, { name: "prefers-color-scheme", value: scheme }]);
      for (const p of SCENES) {
        const [file, hash] = p.split("#");
        await page.goto(`${pathToFileURL(path.join(FRONT, file)).href}${hash ? `#${hash}` : ""}`, { waitUntil: "load" });
        await new Promise((r) => setTimeout(r, 400));
        await page.addScriptTag({ path: axe });
        const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, preload: false, resultTypes: ["violations"] }))
          .violations.map((x) => `${x.id}×${x.nodes.length}(${x.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(", ")})`));
        if (v.length) found.push(`${scheme} ${vp.width}px ${p}: ${v.join("; ")}`);
      }
      await page.close();
    }
    assert.deepEqual(found, [], `접근성 위반:\n${found.join("\n")}`);
  } finally { await browser.close(); }
});
