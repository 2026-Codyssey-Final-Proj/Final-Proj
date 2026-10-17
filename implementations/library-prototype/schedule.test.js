// claude-drafted: 2026-10-17 — 마감이 붙은 단계 지도의 날짜 계산. 오늘은 시험마다 넘긴다(시계에 기대지 않는다).
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("./schedule.js");

test("남은 날과 상태 — 지남 · 오늘 · 1일 · 3일 이내 · 여유", () => {
  const today = "2026-10-17";
  assert.deepEqual(S.dueStatus("2026-10-15", today), { days: -2, state: "late", label: "2일 지남" });
  assert.deepEqual(S.dueStatus("2026-10-17", today), { days: 0, state: "today", label: "오늘 마감" });
  assert.deepEqual(S.dueStatus("2026-10-18", today), { days: 1, state: "soon", label: "내일 마감" });
  assert.deepEqual(S.dueStatus("2026-10-20", today), { days: 3, state: "soon", label: "3일 남음" });
  assert.deepEqual(S.dueStatus("2026-10-21", today), { days: 4, state: "ok", label: "4일 남음" });
});

test("월말·해 넘김도 날짜로 센다", () => {
  assert.equal(S.dueStatus("2026-11-01", "2026-10-30").days, 2);
  assert.equal(S.dueStatus("2027-01-02", "2026-12-31").days, 2);
});

test("알림은 세 번 — 3일 전 · 1일 전 · 당일 아침 8시 (세컨드 브레인 Q2), 지난 것은 표시", () => {
  const a = S.alertsFor("2026-10-19", "2026-10-17");
  assert.deepEqual(a.map((x) => [x.when, x.label, x.past]), [
    ["2026-10-16", "3일 전", true], ["2026-10-18", "1일 전", false], ["2026-10-19 08:00", "당일 아침", false]]);
});

test("팀 일정 핀과 부딪침 — 기능 동결 뒤에 끝나는 단계를 알려 준다", () => {
  const pins = [{ date: "2026-11-01", label: "기능 동결" }, { date: "2026-11-08", label: "제출" }];
  const dues = ["2026-10-12", "2026-10-14", "2026-10-19", "2026-10-23", "2026-10-27", "2026-10-31", "2026-11-03", "2026-11-05"];
  assert.deepEqual(S.pinClashes(dues, pins).map((c) => [c.stage, c.pin]), [[6, "기능 동결"], [7, "기능 동결"]]);
  assert.deepEqual(S.pinClashes(dues.slice(0, 6), pins), []);
});

test("핀까지 남은 날", () => {
  assert.deepEqual(S.pinsFrom([{ date: "2026-11-01", label: "기능 동결" }], "2026-10-17"), [{ date: "2026-11-01", label: "기능 동결", days: 15 }]);
});

test("날짜 형식이 틀리면 조용히 넘기지 않고 오류", () => {
  assert.throws(() => S.dueStatus("10/19", "2026-10-17"), /날짜/);
});
