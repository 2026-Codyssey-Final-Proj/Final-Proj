// claude-drafted: 2026-10-17 — FR-8 역량 지도: 배운 것(태그)마다 레벨 4단계와 노력(책 수 · 날 수). 규칙은 시안용 가설이다(항목·단위는 인터뷰 뒤).
const test = require("node:test");
const assert = require("node:assert/strict");
const { skillMap, LEVELS } = require("./skills.js");

const shelf = [
  { tags: ["EARS", "보안"], days: 10 }, { tags: ["EARS"], days: 5 }, { tags: ["EARS", "MoSCoW"], days: 7 },
];
const open = [{ bookmarks: ["EARS로 다시", "결정은 선택지와"], tags: ["결정"] }];

test("레벨: 끝낸 책 3권 이상 응용함 · 2권 직접 씀 · 1권 이해함 · 열어 둔 책에만 있으면 처음 봄", () => {
  const m = Object.fromEntries(skillMap(shelf, open).map((x) => [x.skill, x.level]));
  assert.equal(m.EARS, 3);
  assert.equal(m.보안, 1);
  assert.equal(m.MoSCoW, 1);
  assert.equal(m.결정, 0);
  assert.deepEqual(LEVELS, ["처음 봄", "이해함", "직접 씀", "응용함"]);
});

test("노력: 그 배움을 쓴 끝낸 책 수와 날 수의 합", () => {
  const ears = skillMap(shelf, open).find((x) => x.skill === "EARS");
  assert.deepEqual([ears.books, ears.days], [3, 22]);
});

test("높은 레벨 · 많은 노력 순서", () => {
  assert.deepEqual(skillMap(shelf, open).map((x) => x.skill), ["EARS", "보안", "MoSCoW", "결정"]);
});
