const test = require("node:test");
const assert = require("node:assert/strict");
const Rules = require("./share-rules.js");
const { scenarios, TEAM } = require("./scenarios.js");

for (const s of scenarios) {
  test(s.name, () => {
    const r = Rules.runScenario(s, TEAM);
    assert.equal(r.pass, true, r.failures.join("; "));
  });
}

test("scan: 정상 문장에는 아무것도 걸리지 않는다", () => {
  assert.deepEqual(Rules.scan("선택지 B로 정했다. 근거는 구현 범위.", TEAM).findings, []);
});

test("scan: 비밀값 모양 — 키·토큰", () => {
  for (const t of ["ghp_" + "a".repeat(24), "AKIA" + "A".repeat(16), "sk-" + "b".repeat(24), "-----BEGIN PRIVATE KEY-----"]) {
    assert.equal(Rules.scan(t, TEAM).blocked, true, t.slice(0, 12));
  }
});

test("redact: 걸린 것이 없으면 글자를 바꾸지 않는다", () => {
  const t = "아무것도 없는 글";
  assert.equal(Rules.redact(t, TEAM), t);
});

test("redactSensitive는 팀원 이름을 지우지 않는다 (경고만)", () => {
  assert.match(Rules.redact("팀원 B와 상의했다", TEAM), /팀원 B/);
});

test("needsConfirm: 팀 공유에 개인 서술·다른 팀원 언급이 있으면 한 번 더 확인한다", () => {
  assert.equal(Rules.needsConfirm({ author: "팀원 A", level: "team", text: "나는 이 방식이 싫다." }, TEAM), true);
  assert.equal(Rules.needsConfirm({ author: "팀원 A", level: "team", text: "팀원 D가 놓쳤다." }, TEAM), true);
});

test("needsConfirm: 나만 보기·깨끗한 글·자기 이름만 있는 글은 묻지 않는다", () => {
  assert.equal(Rules.needsConfirm({ author: "팀원 A", level: "private", text: "나는 불안하다" }, TEAM), false);
  assert.equal(Rules.needsConfirm({ author: "팀원 A", level: "team", text: "선택지 B로 정했다." }, TEAM), false);
  assert.equal(Rules.needsConfirm({ author: "팀원 A", level: "team", text: "팀원 A가 정리했다." }, TEAM), false);
});

test("needsConfirm: 요약 공유는 원문이 아니라 요약을 본다", () => {
  const item = { author: "팀원 A", level: "summary", text: "나는 불안했다", summary: "결정: B" };
  assert.equal(Rules.needsConfirm(item, TEAM), false);
  assert.equal(Rules.needsConfirm({ ...item, summary: "팀원 C 때문에 B로 했다" }, TEAM), true);
});
