// claude-drafted: 2026-10-17
const test = require("node:test");
const assert = require("node:assert/strict");
const U = require("./usage.js");

test("사용량 표: 전체·용도별(한글 이름)·테스터별을 보여 준다", () => {
  const text = U.format({
    provider: "api", model: "claude-sonnet-4", host: "copa.example", compat: true, used: 120000, budget: 1000000,
    buckets: { dev: { used: 80000, limit: 400000 }, test: { used: 40000, limit: 200000 }, demo: { used: 0, limit: 200000 }, reserve: { used: 0, limit: 200000 } },
    testers: { A: 30000, B: 10000 },
  });
  assert.match(text, /120,000 \/ 1,000,000/);
  assert.match(text, /12%/);
  assert.match(text, /규칙·프롬프트.*80,000 \/ 400,000/);
  assert.match(text, /사용자 테스트.*40,000 \/ 200,000/);
  assert.match(text, /리허설·녹화/);
  assert.match(text, /예비.*잠겨/);
  assert.match(text, /A .*30,000/);
});

test("계획이 없으면 통 줄 없이 전체만, 한도가 없으면 한도 없음이라고 한다", () => {
  const text = U.format({ provider: "cli", used: 5, budget: null, model: "m", host: "h", compat: false });
  assert.match(text, /한도 없음/);
  assert.ok(!/규칙·프롬프트/.test(text));
});

test("예비는 아직 안 썼으면 '잠겨 있음', 쓰기 시작했으면 사용량을 보여 준다", () => {
  const base = { provider: "api", model: "m", host: "h", compat: false, used: 1, budget: 10, buckets: { dev: { used: 1, limit: 5 }, reserve: { used: 0, limit: 5 } } };
  assert.match(U.format(base), /예비.*잠겨/);
  base.buckets.reserve.used = 2;
  assert.match(U.format(base), /예비.*2 \/ 5/);
});
