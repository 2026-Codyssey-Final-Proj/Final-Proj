// 민감한 값 찾기 · 가리기(03-backend/navigator/sensitive.js) — 2026-10-19 공유 규칙(FR-9)을 지우며 share-rules.test.js에서 남긴 시험.
// 실행: node --test 04-tests/navigator/sensitive.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../../03-backend/navigator/sensitive.js");

test("scan: 정상 문장에는 아무것도 걸리지 않는다", () => {
  assert.deepEqual(S.scan("선택지 B로 정했다. 근거는 구현 범위.").findings, []);
});

test("scan: 비밀값 모양 — 키·토큰", () => {
  for (const t of ["ghp_" + "a".repeat(24), "AKIA" + "A".repeat(16), "sk-" + "b".repeat(24), "-----BEGIN PRIVATE KEY-----"]) {
    assert.equal(S.scan(t).blocked, true, t.slice(0, 12));
  }
});

test("scan: 이메일 · 전화 · IP는 막지 않고 가릴 것으로 찾는다", () => {
  const r = S.scan("연락 a@b.co 010-1234-5678 10.0.0.1");
  assert.equal(r.blocked, false);
  assert.deepEqual(r.findings.map((f) => f.type), ["email", "phone", "ip"]);
});

test("redact: 걸린 것이 없으면 글자를 바꾸지 않는다", () => {
  const t = "아무것도 없는 글";
  assert.equal(S.redact(t), t);
});

test("redact: 비밀값과 연락처를 가리고 값은 남기지 않는다", () => {
  const out = S.redact("token=abcd1234 메일 a@b.co");
  assert.doesNotMatch(out, /abcd1234|a@b\.co/);
  assert.match(out, /\[비밀값\]/); assert.match(out, /\[이메일 가림\]/);
});

// 2026-10-27(C-43 파일 저장): 512KB 글 파일(한 줄짜리 묶인 코드 · 긴 표)도 저장 전 검사가 바로 끝나야 한다 — 이메일 패턴이 '@' 없는 긴 글자 묶음에서 제곱으로 느려져(128KB 28초) 저장이 멈췄다
test("scan: '@' 없는 512KB 한 줄도 1초 안에 끝나고, 그 안의 이메일은 여전히 찾는다", () => {
  const t0 = Date.now();
  assert.deepEqual(S.scan("x".repeat(512 * 1024)).findings, []);
  assert.ok(Date.now() - t0 < 1000, `${Date.now() - t0}ms`);
  const r = S.scan("a".repeat(100) + " 연락: team.lead+x@example.co.kr 끝 " + "b".repeat(100));
  assert.deepEqual(r.findings.map((f) => f.match), ["team.lead+x@example.co.kr"]);
  assert.equal(S.redact("긴" + "y".repeat(200000) + " me@example.com"), "긴" + "y".repeat(200000) + " [이메일 가림]");
});
