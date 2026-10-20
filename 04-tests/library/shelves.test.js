// claude-drafted: 2026-10-20 — C-21 서고의 책장은 내가 만든다(이재엽 버튼: '분류 안 함' 하나로 시작 · 책장 수 제한 없음 · 배운 말은 서고에서 뺌 · 예시도 내 것처럼). 코드보다 먼저 썼다(code.md 1번).
// 순수 모듈 shelves.js — 책장 목록과 책마다 꽂힌 책장을 이 브라우저에 저장(my-books.js와 같은 곳). 책을 지우는 길은 없다: 책장을 지우면 책은 '분류 안 함'으로.
// 실행: node --test 04-tests/library/shelves.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const S = require("../../02-frontend/library/shelves.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const fakeStorage = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m }; };
const broken = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } };

test("처음에는 '분류 안 함' 하나 — 지울 수도 이름을 바꿀 수도 없다. 저장소가 없거나 고장 나도 던지지 않는다", () => {
  const s = S.read(fakeStorage());
  assert.deepEqual(s.list, [{ id: S.NONE, name: "분류 안 함" }]); assert.deepEqual(s.books, {});
  assert.deepEqual(S.read(broken), s); assert.deepEqual(S.read(null), s);
  assert.deepEqual(S.read(fakeStorage({ [S.KEY]: "{broken" })), s);
  assert.equal(S.remove(s, S.NONE), s); assert.equal(S.rename(s, S.NONE, "x"), s);
  assert.equal(S.write(broken, s), false);
});

test("책장 만들기 · 이름 바꾸기 — 이름은 다듬어 20자까지, 빈 이름은 만들지 않는다. 개수 제한 없음. 원본은 바꾸지 않는다", () => {
  const a = S.read(fakeStorage());
  const b = S.add(a, "  기록 · 폼  ");
  assert.equal(a.list.length, 1); assert.equal(b.list.length, 2); assert.equal(b.list[1].name, "기록 · 폼");
  assert.match(b.list[1].id, /^s[A-Za-z0-9_-]{6,}$/);
  assert.equal(S.add(b, "   "), b); assert.equal(S.add(b, null), b);
  assert.equal(S.add(b, "가".repeat(40)).list[2].name.length, 20);
  let many = b; for (let i = 0; i < 30; i++) many = S.add(many, `책장 ${i}`);
  assert.equal(many.list.length, 32);
  const r = S.rename(b, b.list[1].id, "알림");
  assert.equal(r.list[1].name, "알림"); assert.equal(b.list[1].name, "기록 · 폼");
  assert.equal(S.rename(b, b.list[1].id, " "), b); assert.equal(S.rename(b, "nope", "x"), b);
});

test("꽂기 · 옮기기 — 고르지 않으면 '분류 안 함', 모르는 책장이면 '분류 안 함'. 책장을 지우면 그 안의 책은 '분류 안 함'으로 옮기고 책은 그대로", () => {
  let s = S.add(S.read(fakeStorage()), "알림");
  const id = s.list[1].id;
  assert.equal(S.shelfOf(s, "f1"), S.NONE);
  s = S.place(s, "f1", id); assert.equal(S.shelfOf(s, "f1"), id);
  s = S.place(s, "f2", "nope"); assert.equal(S.shelfOf(s, "f2"), S.NONE);
  assert.equal(S.place(s, "", id), s);
  const g = S.groups(s, [{ id: "f1" }, { id: "f2" }, { id: "f3" }]);
  assert.deepEqual(g.map((x) => [x.shelf.name, x.books.map((b) => b.id)]), [["분류 안 함", ["f2", "f3"]], ["알림", ["f1"]]]);
  const r = S.remove(s, id);
  assert.equal(r.list.length, 1); assert.equal(S.shelfOf(r, "f1"), S.NONE);
  assert.equal(S.groups(r, [{ id: "f1" }])[0].books.length, 1, "책은 그대로");
  assert.equal(S.remove(s, "nope"), s);
});

test("저장 — 쓰고 읽으면 같다(책장 목록 · 꽂힌 자리), '분류 안 함'은 저장하지 않아도 늘 있다. 예시 책 지우기(HIDE_KEY)와 다른 열쇠라 예시를 지워도 책장은 남는다", () => {
  const st = fakeStorage();
  let s = S.add(S.read(st), "숫자 · 돈"); s = S.place(s, "f4", s.list[1].id);
  assert.equal(S.write(st, s), true);
  assert.deepEqual(S.read(st), s);
  const raw = JSON.parse(st.map.get(S.KEY));
  assert.ok(!raw.list.some((x) => x.id === S.NONE), "'분류 안 함'은 저장하지 않는다");
  const M = require("../../02-frontend/library/my-books.js");
  assert.notEqual(S.KEY, M.HIDE_KEY); assert.notEqual(S.KEY, M.KEY);
});

test("서고 화면 — 떠 있는 배운 말 표 · 잇는 선 · 배운 말로 찾기 · 고정 책장 넷이 없고, 책장 만들기 · 이름 바꾸기 · 지우기 · 책 옮기기 손잡이가 있다. 책 안의 '배운 것' 칸은 남는다", () => {
  const js = read("library/library.js"), html = read("library/index.html");
  for (const gone of ["CHIPS", "drawArcs", "const SHELVES = [", '"기록 · 폼"', "lib-hover"]) assert.ok(!js.includes(gone), `${gone}가 남아 있다`);
  assert.ok(!html.includes('id="arcs"'), "잇는 선 svg가 없다");
  assert.ok(html.includes("shelves.js") && html.indexOf("my-books.js") < html.indexOf("shelves.js"));
  for (const act of ["shelf-add", "shelf-rename", "shelf-remove", "rd-shelf"]) assert.ok(js.includes(act), act);
  assert.ok(js.includes("FloeShelves"));
  const search = read("library/search.js");
  assert.ok(!/b\.tags\.map/.test(search), "배운 말(tags)로 찾지 않는다");
  const BV = require("../../02-frontend/library/book-view.js");
  assert.ok(BV.FIELDS.some(([k]) => k === "insights"), "'배운 것' 칸은 그대로");
  const { FILES } = require("../../03-backend/navigator/server.js");
  assert.ok(FILES["/library/shelves.js"], "서버가 내준다");
});
