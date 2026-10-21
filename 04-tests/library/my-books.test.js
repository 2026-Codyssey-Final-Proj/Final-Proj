// claude-drafted: 2026-10-19 — 실사용(이재엽 2026-10-18 "실질적으로 테스트 … 우리가 사용하면서"): 서재의 예시 책 옆에 내 책, "예시 책 지우기".
// 내비게이터의 기록(localStorage)에서 내 책을 만들고, 예시를 숨기면 예시 책 · 레퍼런스 · 물어볼 것 · 캘린더가 비고 오늘이 실제 날짜가 되는지.
// 기록이 없거나 고장 나도, 저장소를 못 써도 던지지 않는지. 실행: node --test 04-tests/library/my-books.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const M = require("../../02-frontend/library/my-books.js");
const FRONT = path.join(__dirname, "../../02-frontend");

// books.js를 매번 새로 읽는다 — apply가 제자리에서 바꾸므로 시험끼리 섞이지 않게
const freshData = () => { const p = require.resolve("../../02-frontend/library/books.js"); delete require.cache[p]; return require(p); };
const SAVED = {
  mode: "live", project: "동네 책방 예약", since: "2026-10-12", at: Date.UTC(2026, 9, 19, 5, 20), finished: false,
  j: { stage: 2, reason: "", next: null, criteria: [{ text: "필요한 기능을 문장으로 쓰기", term: "EARS", met: true, evidence: "…" }, { text: "모호한 말을 숫자로 바꾸기", term: "Planguage", met: false }] },
  docs: [{ stage: 1, name: "아이디어 정리표", text: "누가: 동네 책방 …", at: "2026-10-14" }],
  learned: [{ term: "EARS", text: "필요한 기능을 문장으로 쓰기" }, { term: "규모 등급", text: "얼마나 크게 만들지 정하기" }],
  history: [{ short: "0단계 무엇을 만들지 정하기 마침", text: "0단계 … → 1단계로 넘어갔어요" }, { short: "1단계 적어 두기 마침", text: "1단계 … → 2단계로" }],
};
const fakeStorage = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m }; };
const broken = { getItem() { throw new Error("사생활 보호 창"); }, setItem() { throw new Error("no"); }, removeItem() { throw new Error("no"); } };

test("내비게이터와 내 책이 읽는 기록 열쇠가 같다", () => {
  const app = fs.readFileSync(path.join(FRONT, "navigator/app.js"), "utf8");
  assert.equal(M.KEY, /const KEY = "([^"]+)"/.exec(app)[1]);
});

test("내 책: 기록에서 지금 단계 · 할 일 · 확정한 설계도 · 배운 말 · 지나온 단계를 꺼내고, 예시 책과 같은 칸을 모두 갖는다", () => {
  const b = M.fromState(SAVED, "2026-10-19", Date.UTC(2026, 9, 19, 6, 0));
  assert.equal(b.id, M.ME); assert.equal(b.mine, true); assert.equal(b.example, false);
  assert.equal(b.title, "동네 책방 예약"); assert.equal(b.stage, 2); assert.equal(b.started, "2026-10-12");
  assert.deepEqual(b.todos, [{ t: "필요한 기능을 문장으로 쓰기", done: true }, { t: "모호한 말을 숫자로 바꾸기", done: false }]);
  assert.deepEqual(b.decided, ["2단계 아이디어 정리표 — 2026-10-14에 확정"]);   // 번호는 화면에 1~8(C-22, 2026-10-21) — 기록의 stage는 그대로
  assert.deepEqual(b.docStages, [1], "확정한 단계 문서의 단계(C-16 — 책 안에서 연다)");
  assert.deepEqual(b.fed, [], "받은 먹이(C-15)가 없으면 빈 목록");
  const fed = M.fromState({ ...SAVED, fed: [{ at: 1, topics: ["앱", "화면"], left: [{ topic: "서버", why: "비밀번호 같아요" }], kept: 2, example: false }, { bad: true }] }, "2026-10-19", Date.UTC(2026, 9, 19, 6, 0)).fed;
  assert.deepEqual(fed, [{ topics: ["앱", "화면"], left: 1, example: false }], "받은 먹이는 주제와 빠진 수만 — 글은 없다");
  assert.deepEqual(b.bookmarks, ["EARS", "규모 등급"]); assert.deepEqual(b.tags, ["EARS", "규모 등급"]);
  assert.deepEqual(b.steps, ["0단계 무엇을 만들지 정하기 마침", "1단계 적어 두기 마침"]);
  assert.deepEqual(b.dues, [], "내 책에는 마감이 없다 — 마감 칩을 그리지 않는다");
  // 예시 책(books.js OPEN)이 가진 칸을 내 책도 모두 가진다 — 화면이 같은 코드로 그린다
  const ex = freshData().OPEN[0];
  for (const k of Object.keys(ex)) assert.ok(k in b, `내 책에 없는 칸: ${k}`);
  assert.match(b.updated, /^오늘 \d{2}:\d{2}$/);
});

test("내 책: 기록이 없거나 고장 났으면 null — 던지지 않는다", () => {
  for (const raw of [null, "", "{", "[]", "{}", JSON.stringify({ j: "x" }), JSON.stringify({ j: { stage: 1 } })]) assert.equal(M.fromSaved(raw), null, String(raw));
  assert.equal(M.fromState(null), null);
});

test("내 책: 프로젝트 이름이 없으면 '내 프로젝트', 처음 만난 날이 없으면 오늘, 모두 마쳤으면 7단계 · 할 일 모두 끝(엮을 수 있다)", () => {
  const b = M.fromState({ j: { stage: 0, criteria: [{ text: "a", met: false }] } }, "2026-10-19");
  assert.equal(b.title, M.UNTITLED); assert.equal(b.started, "2026-10-19"); assert.deepEqual(b.decided, []); assert.deepEqual(b.bookmarks, []);
  const f = M.fromState({ ...SAVED, finished: true }, "2026-10-19");
  assert.equal(f.stage, 7); assert.ok(f.todos.every((t) => t.done)); assert.equal(f.finished, true);
});

test("예시 책 지우기: 적용하면 예시 책 · 레퍼런스 · 물어볼 것 · 캘린더가 비고 오늘이 실제 날짜가 된다. 다시 보기로 되돌아온다(토글)", () => {
  const D = freshData(), before = { open: D.OPEN.length, shelf: D.SHELF.length, refs: D.REFS.length, ask: D.ASK.length, cal: D.CALENDAR.length, today: D.TODAY };
  assert.ok(before.open && before.shelf && before.refs && before.ask && before.cal, "예시 데이터가 있어야 시험이 의미 있다");
  M.apply(D, { hidden: true, today: "2026-10-19" });
  assert.deepEqual([D.OPEN, D.SHELF, D.REFS, D.ASK, D.CALENDAR], [[], [], [], [], []]);
  assert.equal(D.TODAY, "2026-10-19"); assert.equal(D.HIDDEN, true);
  M.apply(D, { hidden: false });
  assert.equal(D.OPEN.length, before.open); assert.equal(D.SHELF.length, before.shelf); assert.equal(D.REFS.length, before.refs);
  assert.equal(D.TODAY, before.today); assert.equal(D.HIDDEN, false);
  assert.ok(D.OPEN.every(M.isExample) && D.SHELF.every((b) => b.example === true), "예시 책마다 example 표시");
});

test("내 책이 있으면 열어 둔 책 맨 앞에 — 예시가 보여도, 숨겨도. 두 번 적용해도 한 권만", () => {
  const D = freshData(), book = M.fromState(SAVED, "2026-10-19");
  M.apply(D, { book, hidden: false });
  assert.equal(D.OPEN[0].id, M.ME); assert.equal(D.OPEN.length, D.EXAMPLES.OPEN.length + 1);
  M.apply(D, { book, hidden: false });
  assert.equal(D.OPEN.filter((b) => b.id === M.ME).length, 1);
  M.apply(D, { book, hidden: true, today: "2026-10-19" });
  assert.deepEqual(D.OPEN.map((b) => b.id), [M.ME]); assert.equal(M.isExample(D.OPEN[0]), false);
});

test("예시를 숨긴 데이터로도 서고의 계산(검색 · 일정 충돌)이 던지지 않는다", () => {
  const D = freshData(), Se = require("../../02-frontend/library/search.js"), Sch = require("../../02-frontend/library/schedule.js");
  M.apply(D, { book: M.fromState(SAVED, "2026-10-19"), hidden: true, today: "2026-10-19" });
  assert.equal(Se.searchLibrary("책방", D).length, 1);
  assert.deepEqual(Sch.findClashes({ projects: D.OPEN, events: D.CALENDAR, pins: D.TEAM_PINS, today: D.TODAY }), [], "마감이 없는 내 책은 충돌이 없다");
});

test("저장소: 숨김 표시를 읽고 쓴다. 못 쓰는 저장소면 숨기지 않은 것으로, 던지지 않는다", () => {
  const s = fakeStorage({ [M.KEY]: JSON.stringify(SAVED) });
  assert.equal(M.readHidden(s), false);
  assert.equal(M.writeHidden(s, true), true); assert.equal(M.readHidden(s), true);
  const r = M.read(s, "2026-10-19");
  assert.equal(r.hidden, true); assert.equal(r.book.title, "동네 책방 예약");
  M.writeHidden(s, false); assert.equal(s.map.has(M.HIDE_KEY), false);
  assert.equal(M.readHidden(broken), false); assert.equal(M.writeHidden(broken, true), false);
  assert.deepEqual(M.read(broken), { book: null, hidden: false });
  assert.deepEqual(M.read(null), { book: null, hidden: false });
});

test("두 화면(내비게이터 · 서고)이 books.js 바로 뒤에 my-books.js를 부른다", () => {
  for (const f of ["navigator/index.html", "library/index.html"]) {
    const html = fs.readFileSync(path.join(FRONT, f), "utf8");
    const a = html.indexOf("books.js\""), b = html.indexOf("my-books.js\"");
    assert.ok(a >= 0 && b > a, `${f}: books.js 뒤에 my-books.js`);
  }
});
