// claude-drafted: 2026-10-18 — 고칠 목록 F-12(이재엽 "나는 계속 GO야"): 한곳에서 보기의 토큰 표가 서버로 열면 /api/usage의 실제 값을 보인다
// 실행: node --test 04-tests/navigator/token-view.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const V = require("../../03-backend/navigator/token-view.js");
const D = require("../../02-frontend/library/books.js");

test("사용량을 못 받았으면(파일로 열었거나 서버가 꺼짐) 미리 만든 가상 숫자를 쓰고 가상이라고 표시한다", () => {
  for (const usage of [null, undefined, { ok: false }]) {
    const v = V.view(usage, D.TOKENS);
    assert.equal(v.source, "fake");
    assert.equal(v.rows.length, Object.keys(D.TOKENS.plan).length);
    assert.deepEqual(v.rows[0], { name: D.TOKENS.names.dev, used: D.TOKENS.used.dev, limit: D.TOKENS.plan.dev });
    assert.match(v.label, /가상/);
  }
});

test("녹화를 재생하는 중이면 실제 값이지만 토큰을 쓰지 않는다고 알린다", () => {
  const v = V.view({ ok: true, provider: "cli", used: 0, budget: null, state: "ok", replay: true }, D.TOKENS);
  assert.equal(v.source, "replay");
  assert.match(v.note, /녹화/);
  assert.doesNotMatch(v.label, /가상/);
});

test("예산 통(NAV_PLAN)이 있으면 통마다 한 줄 — 이름은 쉬운 말로, 모르는 통 이름은 그대로", () => {
  const v = V.view({ ok: true, provider: "api", used: 5000, budget: 1000000, state: "ok", buckets: { dev: { used: 3000, limit: 400000 }, test: { used: 2000, limit: 200000 }, extra: { used: 0, limit: 10 } } }, D.TOKENS);
  assert.equal(v.source, "live");
  assert.deepEqual(v.rows.map((r) => r.name), [D.TOKENS.names.dev, D.TOKENS.names.test, "extra"]);
  assert.deepEqual(v.rows[0], { name: D.TOKENS.names.dev, used: 3000, limit: 400000 });
  assert.equal(v.used, 5000);
  assert.equal(v.limit, 1000000);
});

test("통이 없으면 한 줄 — 구독(claude -p)은 토큰을 세지 않는다고 알리고, 한도가 없으면 한도 칸을 비운다", () => {
  const cli = V.view({ ok: true, provider: "cli", used: 0, budget: null, state: "ok" }, D.TOKENS);
  assert.equal(cli.rows.length, 1);
  assert.match(cli.rows[0].name, /구독/);
  assert.equal(cli.rows[0].limit, null);
  assert.match(cli.note, /세지 않/);
  const api = V.view({ ok: true, provider: "api", used: 1234, budget: 100000, state: "warn" }, D.TOKENS);
  assert.match(api.rows[0].name, /키/);
  assert.deepEqual([api.rows[0].used, api.rows[0].limit], [1234, 100000]);
  assert.match(api.note, /80%/, "한도에 가까우면 알린다");
});

test("숫자가 아닌 값은 0으로 — 서버 모양이 틀려도 화면이 깨지지 않는다", () => {
  const v = V.view({ ok: true, provider: "api", used: "많이", budget: "?", buckets: { dev: { used: null, limit: "x" } } }, D.TOKENS);
  assert.deepEqual(v.rows[0], { name: D.TOKENS.names.dev, used: 0, limit: null });
  assert.equal(v.used, 0);
});
