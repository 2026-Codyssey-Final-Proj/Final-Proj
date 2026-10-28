// claude-drafted: 2026-10-28 — F-70 앱으로 결과물이 나오게(결정 모음 A-02 · A-04 · A-05): build.js가 단계 결과로 Claude Code에 맡길 글 · 끝 조건을 짓는다.
//   뼈대(5단계) · 6단계에 코드가 없을 때 '예' · 요구 줄 하나(6단계) · 돌려 보기(6 · 7단계) · 보고에서 결과 파일 찾기 · 코드 파일 수.
// 실행: node --test 04-tests/navigator/build.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const B = require(path.join(__dirname, "../../03-backend/navigator/build.js"));
const Nav = require(path.join(__dirname, "../../03-backend/navigator/navigator.js"));

const FEAT = "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기";
const RESULTS = {
  0: { items: [{ name: "어떤 불편을 풀고 싶은지 한 문장으로 쓰기", lines: ["여행 날짜를 정해도 갈 곳을 고르기 어렵다"] }, { name: "누가 쓰는지 쓰기", lines: [""] }] },
  1: { items: [{ name: "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기", lines: ["날짜를 넣으면 여행 리포트 파일이 나온다"] }] },
  2: { items: [{ name: FEAT, lines: ["날짜를 넣으면, 앱은 그 날짜의 추천지를 고른다 / 추천지를 고르면, 앱은 리포트 파일을 만든다", "추천지를 고르면, 앱은 리포트 파일을 만든다"] }] },
  3: { items: [{ name: "고른 방법과 왜 골랐는지 한 줄을 기록으로 남기기", lines: ["파이썬 명령줄 프로그램 — 화면 없이 파일로"] }] },
};
const fits = (j) => Nav.taskBrief(j.text, j.checks).length <= 4000 && j.checks.length >= 1 && j.checks.length <= Nav.CHECKS_MAX && j.checks.every((c) => c.length <= 200);

test("features — 3단계 기능 칸을 ' / ' 조각으로, 같은 줄은 한 번, 없으면 빈 목록", () => {
  assert.deepEqual(B.features(RESULTS), ["날짜를 넣으면, 앱은 그 날짜의 추천지를 고른다", "추천지를 고르면, 앱은 리포트 파일을 만든다"]);
  assert.deepEqual(B.features({}), []); assert.deepEqual(B.features(null), []);
  assert.deepEqual(B.features({ 2: { items: [{ name: "다른 칸", lines: ["x"] }] } }), []);
});

test("digest — 1 ~ 4단계 칸 이름 · 적은 줄, 빈 칸 · 빈 단계는 건너뛰고 길면 자른다", () => {
  const d = B.digest(RESULTS);
  assert.match(d, /\[1단계 · 무엇을 만들지 정하기\]/); assert.match(d, /여행 리포트 파일이 나온다/); assert.match(d, /파이썬 명령줄 프로그램/);
  assert.ok(!d.includes("누가 쓰는지 쓰기"), "빈 칸은 건너뛴다");
  assert.match(B.digest({}), /아직 적은 단계가 없어요/);
  const big = { 0: { items: [{ name: "칸", lines: ["가".repeat(5000)] }] } };
  assert.ok(B.digest(big, 4, 300).length <= 300);
});

test("skeletonTask(ⓑ) — 주제 · 단계 요약 · README 실행 명령 · 지어내지 않기, 끝 조건 셋. why code(A-04)는 '코드 파일이 없어요'로 시작", () => {
  const j = B.skeletonTask({ results: RESULTS, topic: "국내 여행 추천" });
  assert.match(j.text, /5단계/); assert.match(j.text, /'국내 여행 추천'/); assert.match(j.text, /README/); assert.match(j.text, /지어내지/); assert.match(j.text, /docs\//);
  assert.match(j.text, /여행 리포트 파일이 나온다/, "단계 요약이 들어간다");
  assert.equal(j.checks.length, 3); assert.match(j.checks[0], /실행 명령/); assert.match(j.checks[2], /결과물/);
  assert.ok(fits(j), "서버 한도 안(끝 조건을 붙여도 4,000자)");
  const c = B.skeletonTask({ results: RESULTS, topic: "국내 여행 추천", why: "code" });
  assert.match(c.text, /코드 파일이 없어요/); assert.match(c.text, /6단계/);
  const huge = B.skeletonTask({ results: { 0: { items: [{ name: "칸", lines: ["나".repeat(9000)] }] } }, topic: "다".repeat(500) });
  assert.ok(fits(huge) && huge.text.length <= B.TEXT_MAX, "아주 긴 결과도 자른다");
});

test("lineTask(ⓒ) — 그 줄 하나만, 확인 방법을 먼저, 첫 끝 조건에 그 줄. 빈 줄이면 null", () => {
  const line = "추천지를 고르면, 앱은 리포트 파일을 만든다";
  const j = B.lineTask({ line, results: RESULTS });
  assert.match(j.text, /기능: 추천지를 고르면, 앱은 리포트 파일을 만든다/); assert.match(j.text, /확인 방법/); assert.match(j.text, /다른 기능 줄은 고치지 않아요/);
  assert.match(j.checks[0], /추천지를 고르면/); assert.match(j.checks[1], /먼저/);
  assert.ok(fits(j));
  assert.equal(B.lineTask({ line: "   " }), null);
  assert.ok(fits(B.lineTask({ line: "라".repeat(1000), results: RESULTS })), "긴 줄도 한도 안");
});

test("runTask(ⓓ) — 돌리기만(코드는 고치지 않음), 결과 파일 경로 · 출력 첫 줄 · 오류 첫 줄을 근거에", () => {
  const j = B.runTask();
  assert.match(j.text, /실행 명령/); assert.match(j.text, /고치지 않아요/); assert.match(j.text, /경로/);
  assert.equal(j.checks.length, 3); assert.match(j.checks[1], /결과/); assert.ok(fits(j));
});

test("resultFiles — 보고 근거에 나온 경로 중 파일 목록에 있는 것만(지어낸 경로는 없음), 결과물 → 코드 → docs · README 차례, 셋까지", () => {
  const files = [{ path: "docs", dir: true }, { path: "README.md" }, { path: "docs/02-plan/plan.md" }, { path: "out", dir: true }, { path: "out/report.md" }, { path: "src/app.py" }];
  const rep = { items: [{ evidence: "python src/app.py --date 2026-11-01 을 돌렸어요" }, { evidence: "out/report.md 가 생겼어요 · README.md 첫 줄 · docs/02-plan/plan.md" }, { evidence: "없는/파일.txt" }] };
  assert.deepEqual(B.resultFiles(rep, files), [{ i: 4, path: "out/report.md" }, { i: 5, path: "src/app.py" }, { i: 1, path: "README.md" }]);
  assert.deepEqual(B.resultFiles({ items: [{ evidence: "없는/파일.txt" }] }, files), []);
  assert.deepEqual(B.resultFiles(null, files), []); assert.deepEqual(B.resultFiles(rep, null), []);
});

test("codeFiles — 폴더가 아닌 코드 파일 수, 목록이 없으면 null(모름)", () => {
  assert.equal(B.codeFiles([{ path: "README.md" }, { path: "src", dir: true }, { path: "src/app.py" }, { path: "web/index.html" }]), 2);
  assert.equal(B.codeFiles([{ path: "docs/a.md" }]), 0);
  assert.equal(B.codeFiles(null), null);
});
