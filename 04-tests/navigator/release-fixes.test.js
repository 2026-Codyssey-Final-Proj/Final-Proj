// claude-drafted: 2026-10-20 — 앱 9.0.0 묶음(이재엽 "모든 요구사항들을 … 하나도 빠짐없이 … 우리 앱을 만들어줘"). 코드보다 먼저 썼다(code.md 1번).
// 받은 앱이 열리지 않는 것(F-41 간이 서명 · F-42 한 번에 하나 · F-44 dmg 안내), 노치 띠 바탕(F-47), CI 머리 주석의 비용(F-32)을 본다 — 넘김 문서 mac-open · motion.
// 묶은 앱을 실제로 만들거나 열지는 않는다(설정 · 코드 · 그림 파일만 본다). 실제로 열리는지는 사람이 Mac에서 본다.
// 실행: node --test 04-tests/navigator/release-fixes.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const pkg = JSON.parse(read("02-frontend/electron/package.json"));

test("F-41: Mac은 간이 서명(ad-hoc, identity '-')으로 묶고 hardenedRuntime은 끈다(electron-builder 안내 — 켜 두면 켜지지 않는다). 비밀값 · Apple 계정은 없다", () => {
  assert.equal(pkg.build.mac.identity, "-");
  assert.equal(pkg.build.mac.hardenedRuntime, false);
  assert.ok(!("notarize" in pkg.build.mac) || pkg.build.mac.notarize === false, "공증은 Hold");
  const yml = read(".github/workflows/app-release.yml");
  assert.ok(!/CSC_LINK|CSC_KEY_PASSWORD|APPLE_ID/.test(yml), "서명 비밀값 없음");
});

test("F-41: CI Mac 단계가 묶은 앱을 codesign --verify --deep --strict로 검사하고, 실패하면 올리지 않는다(검사 단계가 올리기보다 앞)", () => {
  const yml = read(".github/workflows/app-release.yml");
  const verify = yml.indexOf("codesign --verify --deep --strict"), upload = yml.indexOf("gh release upload");
  assert.ok(verify > 0 && upload > verify, "검사가 올리기 앞에 있다");
  assert.ok(/if:\s*runner\.os == 'macOS'|if:\s*matrix\.os == 'macos-latest'/.test(yml), "Mac에서만 검사");
});

test("F-42: 앱은 한 번에 하나만 켜진다 — requestSingleInstanceLock, 두 번째는 켜진 쪽을 앞으로 불러 주고 알린 뒤 끝난다", () => {
  const main = read("02-frontend/electron/main.js");
  assert.ok(main.includes("requestSingleInstanceLock()"), "잠금");
  assert.ok(/on\("second-instance"/.test(main), "두 번째가 켜지면 알림");
  const lock = main.indexOf("requestSingleInstanceLock()"), ready = main.indexOf("app.whenReady()");
  assert.ok(lock > 0 && lock < ready, "켜지기 전에 잠근다");
  assert.ok(/이미 켜져/.test(main), "두 번째 앱이 쉬운 말로 알린다");
});

test("F-44: dmg 창에 배경 그림('응용 프로그램으로 끌어 놓으세요')과 아이콘 둘(앱 · 응용 프로그램)이 있다", () => {
  const dmg = pkg.build.dmg;
  assert.ok(dmg && typeof dmg.background === "string" && dmg.background.endsWith(".png"));
  assert.ok(fs.existsSync(path.join(ROOT, "02-frontend/electron", dmg.background)), "배경 그림 파일");
  assert.ok(pkg.build.files.includes("build/icon.png"), "icon은 그대로");
  assert.equal(dmg.contents.length, 2);
  assert.ok(dmg.contents.some((c) => c.type === "link" && c.path === "/Applications") && dmg.contents.some((c) => c.type === "file"));
  assert.ok(dmg.window && dmg.window.width >= 500 && dmg.window.height >= 300);
});

test("F-47: 노치 띠(html.notch .strip)의 바탕을 검게 칠하지 않는다 — 크기는 그대로", () => {
  const css = read("02-frontend/navigator/app.css");
  const rule = /html\.notch \.strip\{([^}]*)\}/.exec(css);
  assert.ok(rule, "규칙이 있다");
  assert.ok(!/background:\s*#000/.test(rule[1]), "검정 바탕이 없다");
  assert.ok(/width:max\(150px/.test(rule[1]) && /height:calc\(var\(--notch-h/.test(rule[1]), "크기는 그대로");
});

test("F-32: CI 머리 주석의 비용이 실제(Mac 빌드 1분 미만 · 릴리스 한 번 20~23분어치)와 맞다", () => {
  const yml = read(".github/workflows/app-release.yml");
  assert.ok(!yml.includes("한 번에 약 5분 → 50분어치"), "옛 숫자가 없다");
  assert.ok(/1분 미만|20~23분/.test(yml), "실측 숫자");
});
