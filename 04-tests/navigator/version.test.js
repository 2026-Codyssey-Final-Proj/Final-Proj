// claude-drafted: 2026-10-30 — C-23 퀘스트 한 바퀴의 ⑤ 버전(이재엽 "보드에서 없음 부분 전부 제작"). ①~④는 C-42 · C-47부터 있고 ⑤만 남았다.
// 규칙: 관문을 하나 넘을 때마다 V.n이 하나 오른다 — 새 상태 없이 단계 결과(passed)에서 센다. README의 Floe 절 맨 앞에 '지금 버전'과 '버전 기록'.
// 규칙은 03-backend/navigator/docs.js versionsOf, 화면은 02-frontend/navigator/app/45-knowledge.js 캔버스 ⑤ 칸. 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/version.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const D = require("../../03-backend/navigator/docs.js");
const T = require("../../03-backend/navigator/tutorial.js");

const item = (name, line) => ({ name, lines: [line] });
const RESULTS = {
  0: { chap: 0, title: "행사 신청", items: [item("어떤 불편", "신청을 종이로 받아 헷갈려요")], at: "2026-10-25", passed: "2026-10-25", learned: "불편을 한 문장으로 쓰니 범위가 보였다" },
  1: { chap: 1, title: "행사 신청", items: [item("아이디어", "신청 화면 하나와 목록 하나")], at: "2026-10-27", passed: "2026-10-27", learned: "" },
  2: { chap: 2, title: "행사 신청", items: [item("기능", "신청하면 목록에 한 줄")], at: "2026-10-29" },   // 확인했지만 관문 전
};

test("관문을 지난 단계만 단계 순서로 V.1, V.2 … — 무엇이 바뀌었나 한 줄은 배운 것, 없으면 첫 칸의 첫 줄", () => {
  const v = D.versionsOf(RESULTS);
  assert.deepEqual(v.map((x) => [x.v, x.n, x.passed]), [[1, 0, "2026-10-25"], [2, 1, "2026-10-27"]]);
  assert.match(v[0].line, /^1단계 .+ 관문 — 불편을 한 문장으로 쓰니 범위가 보였다$/);
  assert.match(v[1].line, /— 신청 화면 하나와 목록 하나$/, "배운 것이 비면 첫 줄");
  assert.deepEqual(D.versionsOf({}), []); assert.deepEqual(D.versionsOf(), []);
  assert.deepEqual(D.versionsOf({ "3": { ...RESULTS[0], chap: 3 } }).map((x) => x.n), [3], "열쇠가 글자여도");
});

test("한 줄은 가리고(키 · 표시 글) 한 줄 80자까지", () => {
  const long = { 0: { ...RESULTS[0], learned: `키는 ${"sk-" + "a".repeat(24)} 이고 ${"가".repeat(200)}` } };
  const [x] = D.versionsOf(long, (t) => t.replace(/sk-\w+/g, "[비밀값]"));
  assert.ok(!x.line.includes("aaaa")); assert.match(x.line, /\[비밀값\]/);
  assert.ok(x.line.length <= 120);
});

test("README의 Floe 절 — '지금 버전: V.n'과 '버전 기록' 줄, 관문을 지난 단계가 없으면 넣지 않는다. 받은 글의 가리기를 거친다", () => {
  const readme = D.files({ topic: "행사 신청", results: RESULTS }).find((f) => f.path === "README.md").text;
  assert.match(readme, /\*\*지금 버전: V\.2\*\*/);
  assert.match(readme, /## 버전 기록\n\n\*\*지금 버전: V\.2\*\*[^\n]*\n\n- V\.1 · 2026-10-25 · 1단계 .+\n- V\.2 · 2026-10-27 · 2단계 /);
  assert.ok(readme.indexOf("버전 기록") < readme.indexOf("## 계획 (Floe)"), "Floe 절의 맨 앞");
  const book = require("../../03-backend/navigator/readme-book.js").parse(`# 행사 신청\n\n${readme}`);
  assert.deepEqual(book.versions.map((v) => [v.v, v.date]), [["V.1", "2026-10-25"], ["V.2", "2026-10-27"]], "책 탭이 버전 줄로 읽는다");
  assert.ok(book.chapters.some((c) => c.title === "계획 (Floe)"), "계획 절은 그대로 장");
  const none = D.files({ topic: "행사 신청", results: { 2: RESULTS[2] } }).find((f) => f.path === "README.md").text;
  assert.ok(!/지금 버전|버전 기록/.test(none));
  const hidden = D.files({ results: { 0: { ...RESULTS[0], learned: "비밀 sk-xyz" } }, redact: (t) => String(t).replace(/sk-\w+/g, "[비밀값]") }).find((f) => f.path === "README.md").text;
  assert.ok(!hidden.includes("sk-xyz"));
});

test("화면 — 캔버스 ⑤ 칸이 지난 장은 그 버전 · 날짜, 아직이면 '넘으면 V.(지난 수 + 1)'. '대회 뒤' 글은 없다", () => {
  const k = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app/45-knowledge.js"), "utf8");
  assert.match(k, /const vers = FDOCS && FDOCS\.versionsOf \? FDOCS\.versionsOf\(st\.results\) : \[\], vi = vers\.find\(\(x\) => x\.n === n\);/);
  assert.match(k, /cell\("c5", "done", "⑤", "버전", `V\.\$\{vi\.v\}/);
  assert.match(k, /V\.\$\{vers\.length \+ 1\}/);
  assert.ok(!k.includes('"대회 뒤 (C-23)"'), "'대회 뒤' 꼬리표를 뗐다");
});

test("튜토리얼 — '기록 한 장'은 있음(C-47 한 장), 버전과 레벨은 '만드는 중'이라 말하지 않는다", () => {
  const card = T.LIST ? T.LIST.find((t) => t.id === "card") : T.byId("card");
  assert.equal(card.state, "ready");
  const level = T.LIST ? T.LIST.find((t) => t.id === "level") : T.byId("level");
  assert.ok(!/만드는 중/.test(level.stuck)); assert.match(level.stuck, /README의 Floe 절 맨 앞/);
});
