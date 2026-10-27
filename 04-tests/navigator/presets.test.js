// claude-drafted: 2026-10-27 — C-44 맡기기 틀(presets.js)의 모양 · 넘길 글. 코드보다 먼저 썼다(code.md 1번)
// 실행: node --test 04-tests/navigator/presets.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../../03-backend/navigator/presets.js");
const N = require("../../03-backend/navigator/navigator.js");

test("틀 — 하나 이상, id는 하나뿐, 이름 · 무엇 · 지시 · 끝 조건(1~3줄 · 200자 안)이 있고 이름에 전문 용어가 없다(목록 · 이름은 사람이 바꾼다 — 개수 · 이름을 고정하지 않는다)", () => {
  assert.ok(P.PRESETS.length >= 1);
  assert.equal(new Set(P.PRESETS.map((p) => p.id)).size, P.PRESETS.length);
  for (const p of P.PRESETS) {
    assert.ok(p.name && p.what && typeof p.lines === "function", p.id);
    assert.ok(p.checks.length >= 1 && p.checks.length <= 3 && p.checks.every((c) => c.length <= 200), `${p.id} 끝 조건`);
    for (const j of N.JARGON) assert.ok(!p.name.includes(j) && !p.what.includes(j), `${p.id} '${j}'`);
  }
  assert.equal(P.byId("nope"), null); assert.ok(P.byId("easy"), "쉬운 말 틀은 있다(C-33)");
});

test("넘길 글 — 틀 이름 · 파일 · 지금 단계 · 지시 · 쉬운 말 규칙 · 그 파일만 · 커밋 안 함, 사람이 덧붙인 말은 300자, 서버 한계(4,000자) 안", () => {
  const t = P.requestOf("fill", { path: "docs/03-requirements/requirements.md", stage: "3단계 · 꼭 필요한 기능 정리하기", note: "표는 그대로" });
  assert.match(t, /^Floe 작업실에서 사람이 '단계 문서 칸 채우기' 틀을 골랐어요\. 파일: docs\/03-requirements\/requirements\.md \(지금 3단계 · 꼭 필요한 기능 정리하기\)/);
  assert.ok(t.includes("사람이 덧붙인 말: 표는 그대로") && t.includes(P.EASY) && t.includes("고치는 파일은 docs/03-requirements/requirements.md 하나뿐이에요") && t.includes("커밋 · 푸시는 하지 마세요"));
  assert.equal(P.requestOf("nope"), ""); assert.ok(P.requestOf("toc").includes("(파일 이름 없음)"));
  for (const p of P.PRESETS) assert.ok(P.requestOf(p, { path: "x".repeat(200), note: "y".repeat(400) }).length < 4000, `${p.id} 길이`);
  assert.deepEqual(P.checksOf("decision"), ["표에 한 줄이 늘었고 칸 수가 같다"]); assert.deepEqual(P.checksOf("nope"), []);
});
