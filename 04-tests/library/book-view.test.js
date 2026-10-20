// claude-drafted: 2026-10-20 — 책 보기 설정(C-9 · C-3 → FR-8 세부, 넘김 문서 fable-handoff-2026-10-20-c4-views.md 2절 ①). 코드보다 먼저 썼다(code.md 1번).
// 순수 모듈 book-view.js — 설정 읽기 · 쓰기(이 컴퓨터에 저장, FR-10) · 구조(간결 · 탭) · 칸 켜기/끄기(내용은 지우지 않는다) · 보기(책별 · 세션별) · 크기(짧게 · 전체 화면),
// 그리고 두 화면(섬의 도서관 탭 · 서고의 펼친 책)이 같은 HTML을 쓰는지. 이재엽 버튼(2026-10-20): 기본 구조 간결 · 기본 보기 책별.
// 실행: node --test 04-tests/library/book-view.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const BV = require("../../02-frontend/library/book-view.js");
const M = require("../../02-frontend/library/my-books.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");

const fakeStorage = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m }; };
const broken = { getItem() { throw new Error("사생활 보호 창"); }, setItem() { throw new Error("no"); }, removeItem() { throw new Error("no"); } };
// 예시 책(books.js OPEN[0]) 모양 + 내 책의 dated(세션별 묶음의 재료)
const BOOK = {
  id: "s1", title: "동아리 행사 등록 앱", stage: 2, updated: "오늘 14:20",
  todos: [{ t: "신청 버튼 기능 한 줄", done: true }, { t: "안 될 때 한 줄(예외)", done: false }],
  steps: ["신청이 카톡으로 흩어진다", "신청 · 마감 · 승인 세 가지만"],
  decided: ["신청 버튼을 누르면 3초 안에 등록된다"], bookmarks: ["EARS로 기능 한 줄씩"], insights: [], made: ["signup.html"],
  dated: [{ at: "2026-10-19", kind: "steps", text: "0단계 마침" }, { at: "2026-10-20", kind: "decided", text: "1단계 아이디어 정리표 확정" }, { at: "2026-10-19", kind: "fed", text: "먹이 — 행사 목록" }],
};

test("기본값 — 구조 간결 · 보기 책별 · 크기 짧게 · 칸 여섯 모두 켬(이재엽 버튼 2026-10-20). 이상한 값은 기본값으로", () => {
  const d = BV.normalize(null);
  assert.equal(d.structure, "simple"); assert.equal(d.view, "book"); assert.equal(d.size, "short");
  assert.deepEqual(Object.keys(d.fields), BV.FIELDS.map(([k]) => k));
  assert.ok(Object.values(d.fields).every((v) => v === true));
  assert.deepEqual(BV.FIELDS.map(([, label]) => label), ["지나온 단계", "정한 것", "배운 것", "만든 것", "책갈피", "할 일"]);
  const n = BV.normalize({ structure: "grid", view: "x", size: 3, fields: { steps: false, bogus: true, decided: "no" } });
  assert.equal(n.structure, "simple"); assert.equal(n.view, "book"); assert.equal(n.size, "short");
  assert.equal(n.fields.steps, false); assert.equal(n.fields.decided, true, "참 · 거짓이 아니면 켬"); assert.equal("bogus" in n.fields, false, "모르는 칸은 버린다");
  assert.deepEqual(BV.normalize("{"), BV.normalize(undefined));
});

test("저장소 — 읽고 쓴다(이 컴퓨터에만). 못 쓰는 저장소면 기본값 · 거짓, 던지지 않는다", () => {
  const s = fakeStorage();
  assert.deepEqual(BV.read(s), BV.normalize(null));
  const next = BV.choose(BV.read(s), "structure", "tabs");
  assert.equal(BV.write(s, next), true);
  assert.equal(BV.read(s).structure, "tabs");
  assert.ok(s.map.has(BV.KEY));
  assert.equal(BV.write(broken, next), false); assert.deepEqual(BV.read(broken), BV.normalize(null)); assert.deepEqual(BV.read(null), BV.normalize(null));
  s.map.set(BV.KEY, "{not json");
  assert.deepEqual(BV.read(s), BV.normalize(null), "고장 난 기록은 기본값");
});

test("choose · toggle — 원본은 바꾸지 않고 새 설정을 돌려준다. 모르는 묶음 · 값은 그대로", () => {
  const a = BV.normalize(null);
  const b = BV.choose(a, "view", "session");
  assert.equal(a.view, "book"); assert.equal(b.view, "session");
  assert.equal(BV.choose(a, "view", "weird").view, "book"); assert.equal(BV.choose(a, "nope", "x"), a);
  const c = BV.toggle(a, "steps");
  assert.equal(a.fields.steps, true); assert.equal(c.fields.steps, false); assert.equal(BV.toggle(c, "steps").fields.steps, true);
  assert.equal(BV.toggle(a, "bogus"), a);
});

test("sections — 켜 둔 칸만, 책에 있는 칸만, 차례는 FIELDS 차례. 끄면 숨길 뿐 책의 내용은 그대로", () => {
  const all = BV.sections(BOOK, BV.normalize(null));
  assert.deepEqual(all.map((x) => x.key), ["steps", "decided", "insights", "made", "bookmarks", "todos"]);
  assert.deepEqual(all.find((x) => x.key === "todos").items, [{ text: "신청 버튼 기능 한 줄", done: true }, { text: "안 될 때 한 줄(예외)", done: false }]);
  assert.deepEqual(all.find((x) => x.key === "insights").items, [], "빈 칸도 보인다(아직 없어요)");
  const some = BV.sections(BOOK, BV.toggle(BV.toggle(BV.normalize(null), "steps"), "todos"));
  assert.deepEqual(some.map((x) => x.key), ["decided", "insights", "made", "bookmarks"]);
  assert.equal(BOOK.steps.length, 2, "책의 내용은 그대로");
  // 서고의 끝낸 책(tags · 책갈피 수만 있고 bookmarks 목록이 없다) — 책갈피 칸은 tags를 쓴다. 없는 칸(decided · todos)은 빠진다
  const fin = BV.sections({ title: "x", steps: ["a"], tags: ["EARS"], insights: ["i"], made: ["m"] }, BV.normalize(null));
  assert.deepEqual(fin.map((x) => [x.key, x.items.map((i) => i.text)]), [["steps", ["a"]], ["insights", ["i"]], ["made", ["m"]], ["bookmarks", ["EARS"]]]);
  assert.deepEqual(BV.sections(null, BV.normalize(null)), []);
});

test("sessions — dated를 날짜별(작업 한 번 [해석])로 최근 것부터 묶는다. 날짜가 없거나 dated가 없으면 []", () => {
  const s = BV.sessions(BOOK);
  assert.deepEqual(s.map((x) => [x.at, x.label, x.items.length]), [["2026-10-20", "10/20", 1], ["2026-10-19", "10/19", 2]]);
  assert.deepEqual(s[1].items.map((i) => i.kind), ["steps", "fed"]);
  assert.deepEqual(BV.sessions({ steps: ["a"] }), []);
  assert.deepEqual(BV.sessions({ dated: [{ kind: "steps", text: "날짜 없음" }, { at: "2026-13-99", kind: "x", text: "이상한 날짜" }] }), []);
  // 칸을 끄면 그 종류는 세션에서도 빠진다 — 받은 먹이(fed)는 칸이 아니라 늘 보인다
  const off = BV.sessions(BOOK, BV.toggle(BV.normalize(null), "steps"));
  assert.deepEqual(off.flatMap((x) => x.items.map((i) => i.kind)), ["decided", "fed"]);
});

test("bodyHTML — 간결은 칸을 차례로, 탭은 탭 줄 + 고른 칸 하나(없으면 첫 칸), 세션별은 날짜 묶음(기록이 없는 책은 책별로 보이고 그렇다고 알린다). 글은 가린다(HTML)", () => {
  const d = BV.normalize(null);
  const simple = BV.bodyHTML(BOOK, d);
  assert.equal((simple.match(/class="bv-sec/g) || []).length, 6);
  assert.ok(!simple.includes("bv-tabs"));
  const tabs = BV.bodyHTML(BOOK, BV.choose(d, "structure", "tabs"), { tab: "decided" });
  assert.equal((tabs.match(/class="bv-sec/g) || []).length, 1);
  assert.ok(tabs.includes('data-bv="tab" data-v="decided" aria-selected="true"') && tabs.includes("3초 안에 등록"));
  assert.ok(BV.bodyHTML(BOOK, BV.choose(d, "structure", "tabs"), { tab: "nope" }).includes("카톡으로 흩어진다"), "모르는 탭이면 첫 칸");
  const sess = BV.bodyHTML(BOOK, BV.choose(d, "view", "session"));
  assert.ok(sess.includes("bv-sessions") && sess.indexOf("10/20") < sess.indexOf("10/19"));
  const nosess = BV.bodyHTML({ ...BOOK, dated: [] }, BV.choose(d, "view", "session"));
  assert.ok(nosess.includes("bv-note") && nosess.includes("책별로") && nosess.includes("bv-sec"));
  const evil = BV.bodyHTML({ ...BOOK, steps: ["<img src=x onerror=alert(1)>"] }, d);
  assert.ok(!evil.includes("<img") && evil.includes("&lt;img"));
  assert.equal(BV.bodyHTML(null, d), "");
});

test("panelHTML — 구조 둘 · 보기 둘 · 크기 둘은 눌린 것 표시, 칸 여섯은 체크. 모두 data-bv로 두 화면이 같은 손잡이를 쓴다", () => {
  const h = BV.panelHTML(BV.choose(BV.toggle(BV.normalize(null), "made"), "structure", "tabs"));
  assert.ok(h.includes('data-bv="structure" data-v="tabs" aria-pressed="true"') && h.includes('data-bv="structure" data-v="simple" aria-pressed="false"'));
  assert.ok(h.includes('data-bv="view" data-v="book" aria-pressed="true"') && h.includes('data-bv="size" data-v="short" aria-pressed="true"'));
  assert.equal((h.match(/data-bv="field"/g) || []).length, 6);
  assert.ok(/data-v="made"[^>]*>/.test(h) && !/data-v="made"[^>]*checked/.test(h) && /data-v="steps"[^>]*checked/.test(h));
  assert.ok(h.includes("보기 설정"));
});

test("내 책에 dated — 지나온 단계(기록의 날짜) · 확정한 문서(at) · 받은 먹이(at)가 날짜와 함께. 날짜를 못 읽으면 빠진다", () => {
  const b = M.fromState({
    j: { stage: 2, criteria: [{ text: "a", met: true }] }, project: "p", since: "2026-10-12",
    history: [{ short: "0단계 마침", text: "0단계 … · 2026-10-18" }, { short: "1단계 마침", text: "날짜 없는 옛 기록" }, { short: "2단계", text: "x", at: "2026-10-19" }],
    docs: [{ stage: 1, name: "아이디어 정리표", text: "…", at: "2026-10-19" }],
    fed: [{ at: Date.UTC(2026, 9, 20, 3, 0), topics: ["행사"], left: [], kept: 1 }],
  }, "2026-10-20", Date.UTC(2026, 9, 20, 6, 0));
  assert.deepEqual(b.dated.map((x) => [x.at, x.kind]), [["2026-10-18", "steps"], ["2026-10-19", "steps"], ["2026-10-19", "decided"], [new Date(Date.UTC(2026, 9, 20, 3, 0)).toLocaleDateString("sv"), "fed"]]);
  assert.ok(b.dated.every((x) => typeof x.text === "string" && x.text));
  assert.ok(!JSON.stringify(b.dated).includes("…"), "문서 본문은 싣지 않는다");
});

test("두 화면이 같은 모듈을 부른다 — 내비게이터 · 서고 모두 book-view.js(my-books.js 뒤)와 book-view.css, 서버가 둘 다 내준다. 화면 글에 어려운 말이 없다", () => {
  for (const f of ["navigator/index.html", "library/index.html"]) {
    const html = read(f);
    assert.ok(html.indexOf("my-books.js\"") < html.indexOf("book-view.js\""), `${f}: my-books.js 뒤에 book-view.js`);
    assert.ok(html.includes("book-view.css"), `${f}: book-view.css`);
  }
  const { FILES } = require("../../03-backend/navigator/server.js");
  assert.ok(FILES["/library/book-view.js"] && FILES["/library/book-view.css"], "서버 목록");
  assert.ok(read("navigator/app.js").includes("FloeBookView") && read("library/library.js").includes("FloeBookView"));
  const src = read("library/book-view.js").replace(/^\s*\/\/.*$/gm, "");
  for (const w of ["EARS", "MoSCoW", "설계도", "세션 ID", "레이아웃", "토글"]) assert.ok(!src.includes(w), `쉬운 말 — '${w}'`);
});
