// claude-drafted: 2026-10-18 — 수용 테스트(이슈 #17). 이재엽(팀장) 요청으로 Claude가 썼고, 담당 두승현이 검토한다.
// 무엇: FR-6(한곳에서 보기)과 FR-8(지식 창고 — 역량·노력)을 시연 더미 데이터(02-frontend/library/books.js)로 확인한다.
//   계산 규칙 자체는 단위 시험(04-tests/library/schedule.test.js · skills.test.js)이 본다. 여기서는 "시연 데이터로 화면을 그리면
//   사용자가 무엇을 보게 되는가"를 본다. 시나리오 전체와 사람이 화면으로 볼 것은 README.md.
// 날짜·개수는 적어 두지 않고 더미 데이터에서 읽는다(더미 데이터는 시연에 맞춰 바뀐다).
// 실행: node --test 04-tests/acceptance/one-place.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const D = require("../../02-frontend/library/books.js");
const Sch = require("../../02-frontend/library/schedule.js");
const Sk = require("../../02-frontend/library/skills.js");
const Nav = require("../../03-backend/navigator/navigator.js");
const ROOT = path.join(__dirname, "../..");

const LAST = D.STAGES.length - 1;
const finished = (b) => b.stage === LAST && b.todos.every((t) => t.done);   // 완주한 책(app.js bookDone과 같은 뜻)
// 한곳에서 보기의 "일정 충돌" 칸 — app.js deskAll이 부르는 것과 같은 입력
const clashes = () => Sch.findClashes({ projects: D.OPEN, events: D.CALENDAR, pins: D.TEAM_PINS, today: D.TODAY });

// ── FR-6 ──
test("FR-6 · 시연 데이터로 한곳에서 보기를 그리면 일정 충돌이 하나 이상 보이고, 모두 열어 둔 책의 이야기다", () => {
  const ids = D.OPEN.map((b) => b.id), done = D.OPEN.filter(finished).map((b) => b.id);
  const c = clashes();
  assert.ok(c.length > 0, "시연에서 충돌 칸이 비어 있지 않다");
  for (const x of c) {
    assert.ok(["같은 날 마감", "일정과 겹침", "팀 일정 뒤"].includes(x.kind), `화면이 아는 종류: ${x.kind}`);
    assert.ok(x.with.length > 0 && x.with.every((id) => ids.includes(id)), `${x.kind}: 열어 둔 책`);
    assert.ok(!x.with.some((id) => done.includes(id)), `${x.kind}: 완주한 책은 충돌로 세지 않는다`);
    if (x.kind === "일정과 겹침") assert.ok(D.CALENDAR.some((e) => e.title === x.event), "캘린더에 있는 일정");
  }
});

test("FR-6 · 네 칸(진행 상황 · 내가 할 일 · 일정 충돌 · 토큰 사용)을 그릴 데이터가 모두 있고, 단계 수는 내비게이터와 같다", () => {
  assert.equal(D.STAGES.length, Nav.STAGES.length, "서고와 내비게이터의 단계 수");
  assert.ok(D.OPEN.length > 1, "프로젝트가 둘 이상이어야 서로 부딪치는지 보인다");
  for (const b of D.OPEN) {
    assert.ok(Number.isInteger(b.stage) && b.stage >= 0 && b.stage <= LAST, `${b.id}: 진행 상황`);
    assert.equal(b.dues.length, D.STAGES.length, `${b.id}: 단계마다 마감`);
    assert.ok(b.todos.length > 0 && b.todos.every((t) => Nav.filled(t.t)), `${b.id}: 내가 할 일`);
    assert.doesNotThrow(() => Sch.dueStatus(b.dues[b.stage], D.TODAY), `${b.id}: 마감 날짜 형식`);
  }
  const T = D.TOKENS;
  assert.ok(Object.keys(T.plan).length > 0, "토큰 사용");
  for (const k of Object.keys(T.plan)) {
    assert.ok(Nav.filled(T.names[k]), `토큰 통 '${k}'의 이름`);
    assert.ok(T.used[k] >= 0 && T.used[k] <= T.plan[k], `토큰 통 '${k}': 쓴 양은 한도 안`);
  }
});

// 2026-10-18 임유정 결정(PR #105)으로 내비게이터의 '한곳에서 보기' 탭을 뺐다 — 화면이 없으니 건너뛴다. FR-6(Must) 등급은 팀이 정한다.
// 탭을 다시 살리면 skip을 지운다. 위의 데이터 시험 둘은 그대로 돈다(데이터는 도서관 탭도 쓴다).
test.skip("FR-6 · 한곳에서 보기 화면 글에 '가상 숫자' 표시가 있다 — 시연 숫자를 진짜로 오해하지 않게 (탭 삭제 — PR #105, 팀 결정 대기)", () => {
  const src = fs.readFileSync(path.join(ROOT, "02-frontend/navigator/app.js"), "utf8");
  assert.match(src, /가상 숫자/);
});

// claude-drafted: 2026-10-18 — F-17(원칙 P7 "가상 데이터는 화면에 가상이라고 표시"): 서고와 지식 은하도 더미 데이터라는 것을 주석이 아니라 화면 머리에 적는다
test("FR-8 · 서고와 지식 은하의 머리에 '예시 데이터' 표시가 있다 — 더미 책 · 별을 진짜 기록으로 오해하지 않게 (F-17)", () => {
  for (const page of ["02-frontend/library/index.html", "02-frontend/library/sky.html"]) {
    const html = fs.readFileSync(path.join(ROOT, page), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    assert.match(html, /<div class="lib-head glass">[^\n]*<span class="fake">예시 데이터예요 · 시연용<\/span>/, page);
  }
});

// ── FR-8 ──
test("FR-8 · 끝낸 책이 쌓이면 배운 것마다 네 단계 중 하나의 레벨과 노력(책 수 · 날 수)이 보이고, 열어 둔 책에만 있는 배움은 '처음 봄'이다", () => {
  assert.equal(Sk.LEVELS.length, 4, "레벨 4단계(requirements.md 5절)");
  const map = Sk.skillMap(D.SHELF, D.OPEN);
  const onShelf = new Set(D.SHELF.flatMap((b) => b.tags));
  const openOnly = new Set(D.OPEN.flatMap((b) => b.tags).filter((t) => !onShelf.has(t)));
  assert.deepEqual(new Set(map.map((x) => x.skill)), new Set([...onShelf, ...openOnly]), "빠진 배움도, 지어낸 배움도 없다");
  assert.ok(onShelf.size > 0, "시연 서고에 끝낸 책의 배움이 있다");
  for (const x of map) {
    assert.ok(Nav.filled(Sk.LEVELS[x.level]), `${x.skill}: 레벨 이름`);
    if (onShelf.has(x.skill)) assert.ok(x.level >= 1 && x.books >= 1 && x.days > 0, `${x.skill}: 끝낸 책의 노력`);
    else assert.deepEqual([Sk.LEVELS[x.level], x.books, x.days], [Sk.LEVELS[0], 0, 0], `${x.skill}: 열어 둔 책에만 있음`);
  }
});
