// claude-drafted: 2026-10-19 — 오버레이 앱(02-frontend/electron/lib.js)의 처음 설정 · 옛 서버 알아보기. electron 모듈 없이 돈다.
// 2026-10-19 dmg가 옛 화면을 보인 일: 전날 다른 폴더에서 켠 server.js가 4317을 잡고 있었고, 앱은 그 서버를 그대로 썼다 — 이제 지문을 맞대어 본다.
// 실행: node --test 04-tests/navigator/electron-setup.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/electron/lib.js");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");

const KEY = "sk-" + "Hy4d".repeat(6);   // 시험에서만

test(".env 고치기: 키를 넣으면 그 줄만 바뀌고 다른 줄 · 주석은 그대로, 겹친 줄은 하나로. null이면 그 줄을 지운다", () => {
  assert.equal(L.setEnvLines("# 내 설정\nNAV_MODEL=a\nANTHROPIC_API_KEY=old\nANTHROPIC_API_KEY=dup\n", { ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: null }),
    `# 내 설정\nNAV_MODEL=a\nANTHROPIC_API_KEY=${KEY}\n`);
  assert.equal(L.setEnvLines("", { ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: "https://relay.example" }), `ANTHROPIC_API_KEY=${KEY}\nANTHROPIC_BASE_URL=https://relay.example\n`);
  assert.equal(L.setEnvLines("NAV_MODEL=a\n\n\n", { ANTHROPIC_API_KEY: KEY }), `NAV_MODEL=a\nANTHROPIC_API_KEY=${KEY}\n`, "끝의 빈 줄 뒤에 붙지 않는다");
  assert.equal(L.setEnvLines(`ANTHROPIC_API_KEY=${KEY}\nANTHROPIC_BASE_URL=https://r\n`, { ANTHROPIC_API_KEY: null, ANTHROPIC_BASE_URL: null }), "");
  assert.equal(L.setEnvLines("export ANTHROPIC_API_KEY=old\n", { ANTHROPIC_API_KEY: KEY }), `ANTHROPIC_API_KEY=${KEY}\n`);
  assert.deepEqual(L.parseEnv(L.setEnvLines("NAV_MODEL=a\n", { ANTHROPIC_API_KEY: KEY })), { NAV_MODEL: "a", ANTHROPIC_API_KEY: KEY }, "고친 글을 앱이 다시 읽을 수 있다");
});

test("키 모양: 띄어쓰기 · 따옴표 없는 20~400자 — 중계 서버의 가상 키도 받는다", () => {
  assert.equal(L.looksLikeKey(KEY), true);
  assert.equal(L.looksLikeKey("virtual-" + "k".repeat(30)), true);
  for (const bad of ["", "짧아요", `${KEY} 뒤에 말`, `"${KEY}"`, "x".repeat(401), null, 42]) assert.equal(L.looksLikeKey(bad), false, String(bad));
});

test("중계 서버 주소: 비면 공식 주소(\"\"), https만 받고 끝의 /는 뗀다. http · 아이디가 든 주소 · 주소가 아닌 것은 받지 않는다(null)", () => {
  assert.equal(L.relayUrl(""), "");
  assert.equal(L.relayUrl("  "), "");
  assert.equal(L.relayUrl("https://relay.example/v1/"), "https://relay.example/v1");
  for (const bad of ["http://relay.example", "https://user:pw@relay.example", "relay.example", "javascript:alert(1)"]) assert.equal(L.relayUrl(bad), null, bad);
});

// KAN-57(두승현 2026-10-19 "floe 초기 실행시 설정 창이 매우 작게 보여진다"): 창은 섬 크기만 따라가서(measureSize) 처음 설정이 391×60 창에 끼어 보였다
test("처음 설정이 떠 있는 동안은 섬을 재지 않고 창을 넓히고(expand), 뜰 때 · 닫힐 때 다시 잰다 — 닫히면 섬 크기로", () => {
  const app = read("navigator/app.js");
  const measure = app.slice(app.indexOf("function measureSize"), app.indexOf("const queueSize"));
  assert.match(measure, /getElementById\("floe-setup"\)[^\n]*floeApp\.expand\(\)/, "설정이 떠 있으면 넓힌다");
  assert.ok(measure.indexOf("floe-setup") < measure.indexOf("getBoundingClientRect"), "섬을 재기 전에 본다");
  assert.match(read("navigator/setup.js"), /dispatchEvent\(new CustomEvent\("floe:setup-open"/, "설정이 뜨면 알린다");
  assert.match(app, /addEventListener\("floe:setup-open", queueSize\)/, "뜨면 다시 잰다");
  assert.match(app, /addEventListener\("floe:setup-done", queueSize\)/, "닫히면('나중에 할게요' · Esc 포함) 다시 재서 섬 크기로");
});
