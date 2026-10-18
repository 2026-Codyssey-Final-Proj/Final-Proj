// claude-drafted: 2026-10-19 — 처음 설정 화면(02-frontend/navigator/setup.js)의 순수 함수와, 화면이 키를 직접 저장하지 않는다는 약속.
// 실행: node --test 04-tests/navigator/setup-ui.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const U = require("../../02-frontend/navigator/setup.js");
const NAV = path.join(__dirname, "../../02-frontend/navigator");

const st = (o = {}) => ({ ok: true, provider: "cli", apiKey: false, relay: false, claude: { found: true, version: "2.1.30", signedIn: true }, replay: false, build: "x", ...o });

test("언제 뜨나: 끝낸 기록이 없고 주소 끝이 없을 때. #setup이면 늘, 시연 장면 주소(#ex=1 등)면 막지 않는다", () => {
  assert.equal(U.shouldOpen(null, ""), true);
  assert.equal(U.shouldOpen(null, "#"), true);
  assert.equal(U.shouldOpen({ done: true, via: "cli" }, ""), false);
  assert.equal(U.shouldOpen({ done: true }, "#setup"), true);
  for (const h of ["#ex=1", "#ex=1&done&gate", "#tab=all", "#start"]) assert.equal(U.shouldOpen(null, h), false, h);
});

test("끝낸 기록 읽기: 고장 난 값 · 배열 · 못 쓰는 저장소는 기록 없음", () => {
  const store = (v) => ({ getItem: () => v });
  assert.deepEqual(U.readSaved(store(JSON.stringify({ done: true, via: "api" }))), { done: true, via: "api" });
  for (const v of [null, "{깨짐", "[1]", "3"]) assert.equal(U.readSaved(store(v)), null, String(v));
  assert.equal(U.readSaved({ getItem: () => { throw new Error("막힘"); } }), null);
});

test("고르기 카드의 한 줄: Claude Code는 찾았나 · 로그인했나, API 키는 들어 있나. 서버 없이 연 화면이면 그렇다고", () => {
  assert.deepEqual(U.chipCli(st()), { tone: "ok", text: "찾았어요 · 2.1.30" });
  assert.equal(U.chipCli(st({ claude: { found: false, version: "", signedIn: null } })).tone, "warn");
  assert.match(U.chipCli(st({ claude: { found: true, version: "", signedIn: false } })).text, /로그인/);
  assert.equal(U.chipApi(st()).text, "키를 넣어야 해요");
  assert.equal(U.chipApi(st({ apiKey: true, relay: true })).text, "키가 들어 있어요 · 중계 서버");
  for (const f of [U.chipCli, U.chipApi]) assert.match(f(null).text, /앱이나 서버로 켜면/);
});

test("추천: 키가 이미 있으면 API 키, Claude Code를 찾았으면 Claude Code, 둘 다 아니면 추천하지 않는다(사람이 고른다)", () => {
  assert.equal(U.recommend(st({ apiKey: true })), "api");
  assert.equal(U.recommend(st()), "cli");
  assert.equal(U.recommend(st({ claude: { found: false, version: "", signedIn: null } })), "");
  assert.equal(U.recommend(null), "");
});

test("Claude Code로 연결할 때의 할 일: 찾기 · 로그인 · (키가 있으면 빼기) · 폴더 · 확인 — 끝난 것만 체크", () => {
  const ctx = { app: true, live: true, folder: "", checked: null };
  assert.deepEqual(U.cliSteps(st(), ctx).map((x) => [x.k, x.done]), [["find", true], ["login", true], ["folder", false], ["check", false]]);
  assert.deepEqual(U.cliSteps(st({ apiKey: true }), ctx).map((x) => x.k), ["find", "login", "unkey", "folder", "check"]);
  const done = U.cliSteps(st(), { ...ctx, folder: "연결했어요: /p", checked: true });
  assert.ok(done.every((x) => x.done));
  const failed = U.cliSteps(st(), { ...ctx, checked: { error: "시간 초과" } }).find((x) => x.k === "check");
  assert.equal(failed.done, false); assert.match(failed.line, /안 됐어요 — 시간 초과/);
  assert.match(U.cliSteps(null, ctx)[0].line, /못 찾았어요/);
});

test("API 키로 연결할 때의 할 일: 앱이면 키를 앱 설정 폴더에, 브라우저로 연 화면이면 키를 받지 않고 .env 안내", () => {
  assert.match(U.apiSteps(st(), { app: true, live: true }).find((x) => x.k === "key").line, /앱 설정 폴더/);
  assert.match(U.apiSteps(st(), { app: false, live: true }).find((x) => x.k === "key").line, /키를 받지 않아요/);
  assert.equal(U.apiSteps(st({ apiKey: true }), { app: true }).find((x) => x.k === "key").done, true);
  assert.deepEqual(U.apiSteps(st(), {}).map((x) => x.k), ["key", "folder", "check"]);
});

test("화면은 키를 저장하지 않는다 — 브라우저 저장소에는 '끝냈다' 기록만, 키는 앱(floeApp.saveKey)으로만 넘긴다", () => {
  const src = fs.readFileSync(path.join(NAV, "setup.js"), "utf8");
  const sets = [...src.matchAll(/localStorage\.setItem\(([^,]+),/g)].map((m) => m[1].trim());
  assert.deepEqual(sets, ["KEY"], "localStorage에 쓰는 것은 처음 설정의 끝낸 기록(floe:setup:v1) 하나");
  assert.ok(!/fetch\([^)]*key/i.test(src), "키를 서버 주소로 보내지 않는다");
  assert.match(src, /floeApp\.saveKey\(/);
  assert.match(src, /type="password"/, "키 칸은 가린다");
});

test("내비게이터 화면이 처음 설정을 부른다 — 플로로 그림(seal.js) 뒤, app.js 앞. 스타일도", () => {
  const html = fs.readFileSync(path.join(NAV, "index.html"), "utf8");
  const at = (s) => html.indexOf(s);
  assert.ok(at('src="seal.js"') > 0 && at('src="setup.js"') > at('src="seal.js"') && at('src="app.js"') > at('src="setup.js"'));
  assert.ok(at('href="setup.css"') > 0);
});
