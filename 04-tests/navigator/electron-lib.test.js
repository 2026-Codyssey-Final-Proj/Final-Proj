// claude-drafted: 2026-10-19 — Floe 오버레이 앱(02-frontend/electron)의 순수 함수(lib.js). electron 모듈 없이 돈다.
// .env 읽기(값은 출력하지 않음) · PATH 합치기 · 훅 명령(app.asar → app.asar.unpacked) · 프로젝트 폴더 연결(임시 폴더, connect.js와 같은 모양) · 코드 자리.
// 실행: node --test 04-tests/navigator/electron-lib.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const BACK = path.join(__dirname, "../../03-backend/navigator");

test(".env 읽기: KEY=VALUE만, 주석 · 빈 줄 · 따옴표 처리. 이미 있는 환경 값은 덮지 않는다", () => {
  // 아래 키는 가짜(시험 입력) — 읽히는지만 본다. secret-check: allow
  const parsed = L.parseEnv(`# 주석\n\nANTHROPIC_API_KEY=sk-test-123\nexport NAV_MODEL="claude-x"\nNAV_EFFORT='low'\n이상한 줄\nNAV_TOKEN_BUDGET = 900000\n`);   // secret-check: allow
  assert.deepEqual(parsed, { ANTHROPIC_API_KEY: "sk-test-123", NAV_MODEL: "claude-x", NAV_EFFORT: "low", NAV_TOKEN_BUDGET: "900000" });   // secret-check: allow (가짜 키)
  const env = L.applyEnv({ NAV_MODEL: "from-shell", NAV_EFFORT: "" }, parsed);
  assert.equal(env.NAV_MODEL, "from-shell", "터미널 값이 먼저");
  assert.equal(env.NAV_EFFORT, "low", "빈 값은 채운다");
  assert.equal(env.ANTHROPIC_API_KEY, "sk-test-123");
  assert.deepEqual(L.parseEnv(""), {}); assert.deepEqual(L.parseEnv(null), {});
});

test("로그인 셸 PATH는 Mac · Linux에서만 합치고, 셸은 SHELL 환경 → 없으면 zsh(Mac) · bash(Linux)", () => {
  assert.equal(L.wantsShellPath("darwin"), true);
  assert.equal(L.wantsShellPath("linux"), true, "Linux 앱 메뉴 · AppImage로 연 앱도 PATH가 짧다(6.0.0)");
  assert.equal(L.wantsShellPath("win32"), false);
  assert.equal(L.loginShell("linux", {}), "/bin/bash");
  assert.equal(L.loginShell("darwin", {}), "/bin/zsh");
  assert.equal(L.loginShell("linux", { SHELL: "/usr/bin/fish" }), "/usr/bin/fish");
});

test("PATH 합치기: 로그인 셸의 PATH가 앞에, 겹치면 하나만", () => {
  assert.equal(L.mergePath("/usr/bin:/bin", "/Users/me/.local/bin:/usr/bin", ":"), "/Users/me/.local/bin:/usr/bin:/bin");
  assert.equal(L.mergePath("/usr/bin", "", ":"), "/usr/bin");
  assert.equal(L.mergePath("", "/a;/b", ";"), "/a;/b");
});

test("훅 명령: 묶은 앱 안(app.asar)의 hook.js는 풀어 둔 자리(app.asar.unpacked)를 가리키고, 개발 중 경로는 그대로", () => {
  assert.equal(L.hookCommand("/Applications/Floe.app/Contents/Resources/app.asar/payload/03-backend/navigator/hook.js"),
    'node "/Applications/Floe.app/Contents/Resources/app.asar.unpacked/payload/03-backend/navigator/hook.js"');
  assert.equal(L.hookCommand("C:\\Users\\me\\AppData\\Local\\Programs\\Floe\\resources\\app.asar\\payload\\03-backend\\navigator\\hook.js"),
    'node "C:/Users/me/AppData/Local/Programs/Floe/resources/app.asar.unpacked/payload/03-backend/navigator/hook.js"');
  assert.equal(L.hookCommand("/repo/03-backend/navigator/hook.js"), 'node "/repo/03-backend/navigator/hook.js"');
});

test("코드 자리: 개발 중은 저장소, 묶은 뒤는 payload/", () => {
  const dev = L.paths(false, "/repo/02-frontend/electron"), packed = L.paths(true, "/app/app.asar");
  assert.equal(dev.backend, path.normalize("/repo/03-backend/navigator"));
  assert.equal(packed.backend, path.normalize("/app/app.asar/payload/03-backend/navigator"));
  assert.equal(packed.frontend, path.normalize("/app/app.asar/payload/02-frontend"));
});

test("폴더 연결: 훅을 더하고(connect.js와 같은 모양 · 백업) 빼며, JSON이 아닌 설정은 건드리지 않는다", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "floe-app-")), file = path.join(tmp, ".claude/settings.local.json");
  const r1 = L.connectDir(tmp, BACK, true, { now: new Date("2026-10-19T00:00:00Z") });
  assert.equal(r1.ok, true); assert.ok(r1.message.includes("연결했어요"));
  const s = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const e of ["UserPromptSubmit", "Stop", "PostToolUse"]) assert.ok(s.hooks[e].some((g) => g.hooks.some((h) => h.command.includes("03-backend/navigator/hook.js"))), e);   // PostToolUse — 2026-10-20 C-12
  // 두 번째 연결은 또 더하지 않고 백업을 남긴다
  L.connectDir(tmp, BACK, true, { now: new Date("2026-10-19T00:01:00Z") });
  const s2 = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(s2.hooks.Stop.length, 1);
  assert.ok(fs.readdirSync(path.join(tmp, ".claude")).some((f) => f.startsWith("settings.local.json.bak-")), "백업");
  const r2 = L.connectDir(tmp, BACK, false);
  assert.equal(r2.ok, true); assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).hooks, undefined);
  fs.writeFileSync(file, "{ 깨진 json");
  const r3 = L.connectDir(tmp, BACK, true);
  assert.equal(r3.ok, false); assert.ok(r3.message.includes("JSON 모양이 아니에요"));
  assert.equal(fs.readFileSync(file, "utf8"), "{ 깨진 json", "아무것도 바꾸지 않았다");
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("앱 껍데기는 AI를 부르지 않는다 — 외부 호출은 provider.js 하나", () => {
  const dir = path.join(__dirname, "../../02-frontend/electron");
  for (const f of ["main.js", "preload.js", "lib.js", "prebuild.js"]) {
    assert.doesNotMatch(fs.readFileSync(path.join(dir, f), "utf8"), /claude -p|callClaude|api\.anthropic\.com|@anthropic-ai\/sdk/, f);
  }
});
