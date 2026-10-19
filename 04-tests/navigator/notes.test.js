// claude-drafted: 2026-10-19 — 실사용의 '느낀 점 남기기'(notes.js). 한 줄을 남기면 어디서(화면 · 단계 · 탭 · 보기 방식) 언제가 저절로 붙고,
// Jira용 글은 시간 순 글머리표이며 비밀값 모양은 가려지는지. 고장 난 기록 · 못 쓰는 저장소에도 던지지 않는지.
// 실행: node --test 04-tests/navigator/notes.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const NT = require("../../02-frontend/navigator/notes.js");
const Sensitive = require("../../03-backend/navigator/sensitive.js");

const AT = new Date(2026, 9, 19, 14, 3).getTime();   // 2026-10-19 14:03 이 컴퓨터 시간
const fakeStorage = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m }; };
const broken = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } };

test("남기기: 글과 함께 어디서 · 언제가 붙는다. 빈 글은 아무것도 바꾸지 않는다. 새것이 위", () => {
  const a = NT.add([], { text: "  2단계 할 일 문장이   어려웠어요 ", at: AT, screen: "main", stage: 2, tab: "today", mode: "fixture", project: "동네 책방 예약" });
  assert.equal(a.length, 1);
  assert.equal(a[0].text, "2단계 할 일 문장이 어려웠어요");
  assert.equal(a[0].where, "동네 책방 예약 · 2단계 · 이번 단계 탭 · 연습용 예시");
  assert.equal(a[0].at, AT); assert.equal(a[0].stage, 2);
  const b = NT.add(a, { text: "   ", at: AT + 1 });
  assert.equal(b, a, "빈 글이면 같은 목록");
  const c = NT.add(a, { text: "두 번째", at: AT + 1000, screen: "gate", stage: 2, tab: "today", mode: "live" });
  assert.deepEqual(c.map((n) => n.text), ["두 번째", "2단계 할 일 문장이 어려웠어요"]);
  assert.equal(c[0].where, "2단계 · 넘어가기 전 확인 · 진짜 AI", "넘어가기 전 확인이면 탭 대신 그 화면");
});

test("어디서: 아는 것만 붙이고 모르면 비운다 — 지어내지 않는다", () => {
  assert.equal(NT.where({}), "");
  assert.equal(NT.where({ tab: "lib" }), "도서관 탭");
  assert.equal(NT.where({ stage: 0, mode: "live" }), "0단계 · 진짜 AI");
  assert.equal(NT.where({ tab: "없는탭", mode: "모름" }), "");
});

test("지우기 · 상한: id로 지우고, 200개를 넘지 않는다. 같은 때에 둘을 남겨도 id가 겹치지 않는다", () => {
  let list = [];
  for (let i = 0; i < NT.MAX + 5; i++) list = NT.add(list, { text: `느낌 ${i}`, at: AT + i });
  assert.equal(list.length, NT.MAX); assert.equal(list[0].text, `느낌 ${NT.MAX + 4}`);
  const two = NT.add(NT.add([], { text: "하나", at: AT }), { text: "둘", at: AT });
  assert.notEqual(two[0].id, two[1].id);
  assert.deepEqual(NT.remove(two, two[0].id).map((n) => n.text), ["하나"]);
  assert.deepEqual(NT.remove(null, "x"), []);
});

test("Jira용 글: 시간 순 글머리표, 때 · 어디 · 글. 비밀값 · 이메일 모양은 공유 규칙으로 가린다. 비면 빈 글", () => {
  // 아래 키는 가짜(시험 입력) — 가려지는지 보려고 일부러 둔다. secret-check: allow
  const list = NT.add(NT.add([], { text: "먼저 느낀 것", at: AT, stage: 1, tab: "doc", mode: "fixture" }), { text: "키가 sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJ 이렇게 보여요 — me@example.com", at: AT + 60_000, stage: 1, tab: "doc", mode: "live" });   // secret-check: allow
  const out = NT.toJira(list, Sensitive.redact);
  const lines = out.split("\n");
  assert.equal(lines[0], "Floe 실사용 느낀 점 (2개)");
  assert.equal(lines[2], "- [2026-10-19 14:03] 1단계 · 설계도 탭 · 연습용 예시 — 먼저 느낀 것");
  assert.match(lines[3], /^- \[2026-10-19 14:04\] 1단계 · 설계도 탭 · 진짜 AI — /);
  assert.ok(!out.includes("sk-ant-api03"), "키 값이 그대로 나가면 안 된다");
  assert.ok(!out.includes("me@example.com"), "이메일이 그대로 나가면 안 된다");
  assert.equal(NT.toJira([]), "");
  assert.ok(NT.toJira(list).includes("먼저 느낀 것"), "가리는 함수가 없어도 글은 나온다");
});

test("저장소: 읽고 쓰고, 고장 난 기록은 버리고, 못 쓰는 저장소면 빈 목록 · false", () => {
  const s = fakeStorage();
  const list = NT.add([], { text: "a", at: AT });
  assert.equal(NT.write(s, list), true);
  assert.deepEqual(NT.read(s), list);
  s.setItem(NT.KEY, JSON.stringify([{ text: "좋음", at: AT }, { text: "", at: AT }, { text: "때 없음" }, "글자", null]));
  assert.deepEqual(NT.read(s).map((n) => n.text), ["좋음"]);
  for (const raw of ["{", "{}", "null", ""]) { s.setItem(NT.KEY, raw); assert.deepEqual(NT.read(s), []); }
  assert.deepEqual(NT.read(broken), []); assert.equal(NT.write(broken, list), false); assert.deepEqual(NT.read(null), []);
});
