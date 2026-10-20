// claude-drafted: 2026-10-17 — 서고 검색. 더미 데이터(books.js)로 시험한다.
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../../02-frontend/library/books.js");
const { searchLibrary, highlight } = require("../../02-frontend/library/search.js");

const ids = (r) => r.map((x) => `${x.kind}:${x.id}`);

test("빈 검색어·공백만이면 아무것도 돌려주지 않는다", () => {
  assert.deepEqual(searchLibrary("", D), []);
  assert.deepEqual(searchLibrary("   ", D), []);
});

test("단계마다 정한 것 · 책갈피 · 레퍼런스를 한 번에 찾는다 — 대소문자는 가리지 않는다. 끝낸 책의 배운 말(tags)로는 찾지 않는다(C-21, 2026-10-20)", () => {
  const r = ids(searchLibrary("ears", D));
  for (const want of ["shelf:f1", "open:s1", "ref:r1"]) assert.ok(r.includes(want), want);
  assert.ok(!r.includes("shelf:f2"), "f2는 배운 말(tags)에만 EARS가 있다 — 이제 안 찾는다");
  assert.deepEqual(ids(searchLibrary("EARS", D)), r);
});

test("띄어 쓴 낱말은 모두 들어 있는 곳만 찾는다", () => {
  const r = searchLibrary("알림 하루", D);
  assert.ok(ids(r).includes("open:s1"));
  const hit = r.find((x) => x.id === "s1");
  assert.equal(hit.where, "이 세션에서 정한 것");
  assert.match(hit.text, /하루.*알림/);
});

test("만든 파일 이름으로도 찾는다", () => {
  const r = ids(searchLibrary(".js", D));
  assert.ok(r.includes("shelf:f1") && r.includes("shelf:f3"));
});

test("단계마다 정한 것은 어느 단계인지 알려 준다", () => {
  const hit = searchLibrary("우산", D).find((x) => x.id === "f3");
  assert.equal(hit.where, "0단계 생각하기");
});

test("책 이름이 맞은 것이 먼저, 그다음 많이 맞은 순서", () => {
  const r = searchLibrary("동아리", D);
  assert.equal(r[0].where, "책 이름");
});

test("없는 말이면 빈 목록", () => {
  assert.deepEqual(searchLibrary("양자역학", D), []);
});

test("강조 표시: 맞은 곳을 <mark>로 감싸고, 나머지 글은 HTML로 해석되지 않게 바꾼다", () => {
  assert.equal(highlight("<b>EARS</b> 쓰기", "ears"), "&lt;b&gt;<mark>EARS</mark>&lt;/b&gt; 쓰기");
  assert.equal(highlight("마감 하루 전 알림", "알림 하루"), "마감 <mark>하루</mark> 전 <mark>알림</mark>");
  assert.equal(highlight("a.b", "."), "a<mark>.</mark>b", "정규식 특수 문자도 글자 그대로");
});
