// claude-drafted: 2026-10-19 — 이재엽 결정(조각 파일로 CHANGELOG 번호 충돌 없애기, 인수인계 4절 제안 1번 "Go").
// 진짜 파일은 건드리지 않는다 — 가짜 io가 읽고 쓴 것을 적어 둔다. 실행: node --test 04-tests/repo/changelog-fold.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const F = require("../../.github/scripts/changelog-fold.js");

const HEAD = "# 버전 기록\n\n| 버전 | 날짜 | 누가 | 무엇이 달라졌나 | 건드린 곳 |\n|---|---|---|---|---|\n";
const CHANGELOG = HEAD + "| v7.1 | 2026-10-19 | 이재엽 | 앞 | `01-docs/` |\n| v7.0 | 2026-10-19 | 이재엽 | 더 앞 | 루트 |\n";
const FRAG = "종류: 작은 고침\n누가: 임유정\n무엇: 게이트 문구 고침\n건드린 곳: `02-frontend/`\n";

test("조각 파일 네 줄을 읽는다 — 키: 값, 순서 상관없음", () => {
  assert.deepEqual(F.parseFragment("누가: 이재엽\n종류: 큰 묶음\n건드린 곳: 루트\n무엇: 기능 하나\n"),
    { kind: "major", who: "이재엽", what: "기능 하나", where: "루트" });
  assert.equal(F.parseFragment(FRAG).kind, "minor");
});

test("빠진 줄 · 모르는 종류 · 표를 깨는 | 는 이유를 돌려준다", () => {
  assert.match(F.parseFragment("종류: 작은 고침\n누가: 나\n").error, /빠진 줄: 무엇, 건드린 곳/);
  assert.match(F.parseFragment(FRAG.replace("작은 고침", "중간")).error, /종류는/);
  assert.match(F.parseFragment(FRAG.replace("문구 고침", "문구 고침 | 둘")).error, /'무엇'에 \|/);
});

test("다음 번호 — 작은 고침은 M+1, 큰 묶음은 N+1.0, 버전 줄이 없으면 null", () => {
  assert.equal(F.nextVersion(CHANGELOG, "minor"), "v7.2");
  assert.equal(F.nextVersion(CHANGELOG, "major"), "v8.0");
  assert.equal(F.nextVersion("표 없음", "minor"), null);
});

test("한국 시간 날짜 — UTC 저녁은 한국의 다음 날", () => {
  assert.equal(F.kstDate(new Date("2026-10-19T16:30:00Z")), "2026-10-20");
  assert.equal(F.kstDate(new Date("2026-10-19T03:00:00Z")), "2026-10-19");
});

test("병합 커밋에서 PR 번호를 브랜치 끝 이름으로 찾는다, squash는 번호만", () => {
  const p = F.prNumbers(["Merge pull request #125 from org/v2/changelog-fragments\n\nchore: 조각", "fix: 작은 것 (#126)", "docs: 번호 없음"]);
  assert.deepEqual(p.byBranch, { "changelog-fragments": "125" });
  assert.deepEqual(p.all, ["125", "126"]);
});

test("조각 하나를 맨 위 다음 번호로 넣고 PR 번호를 붙인다", () => {
  const r = F.fold(CHANGELOG, [{ name: "gate-copy", text: FRAG }], { date: "2026-10-20", prs: F.prNumbers(["Merge pull request #130 from org/v2/gate-copy"]) });
  assert.deepEqual(r.errors, []);
  assert.equal(r.rows[0].version, "v7.2");
  const lines = r.text.split("\n");
  assert.equal(lines[4], "| v7.2 | 2026-10-20 | 임유정 | 게이트 문구 고침 (#130) | `02-frontend/` |");
  assert.equal(lines[5], "| v7.1 | 2026-10-19 | 이재엽 | 앞 | `01-docs/` |");
});

test("조각이 둘이면 이름순으로 차례 번호 — 큰 묶음 뒤의 작은 고침은 새 N 아래", () => {
  const r = F.fold(CHANGELOG, [
    { name: "b-fix", text: FRAG },
    { name: "a-feature", text: FRAG.replace("작은 고침", "큰 묶음").replace("게이트 문구 고침", "기능") },
  ], { date: "2026-10-20" });
  assert.deepEqual(r.rows.map((x) => [x.name, x.version]), [["a-feature", "v8.0"], ["b-fix", "v8.1"]]);
  assert.match(r.text.split("\n")[4], /^\| v8\.1 /);
  assert.match(r.text.split("\n")[5], /^\| v8\.0 /);
});

test("조각이 하나뿐이고 브랜치를 못 맞춰도 push의 PR 번호를 붙인다, 이미 (#n)이 있으면 그대로", () => {
  const r = F.fold(CHANGELOG, [{ name: "other", text: FRAG }], { date: "2026-10-20", prs: { byBranch: {}, all: ["131"] } });
  assert.match(r.rows[0].row, /고침 \(#131\) \|/);
  const r2 = F.fold(CHANGELOG, [{ name: "other", text: FRAG.replace("문구 고침", "문구 고침 (#9)") }], { date: "2026-10-20", prs: { byBranch: {}, all: ["131"] } });
  assert.match(r2.rows[0].row, /고침 \(#9\) \|/);
});

test("이상한 조각은 건너뛰고 이유를 모으며, 나머지는 합친다", () => {
  const r = F.fold(CHANGELOG, [{ name: "bad", text: "종류: 작은 고침\n" }, { name: "good", text: FRAG }], { date: "2026-10-20" });
  assert.equal(r.rows.length, 1);
  assert.match(r.errors[0], /^bad: 빠진 줄/);
});

test("run — 조각을 합쳐 CHANGELOG에 쓰고 조각을 지운다, README.md는 조각이 아니다", () => {
  const files = { "CHANGELOG.md": CHANGELOG, "changes/README.md": "설명", "changes/gate-copy.md": FRAG, "event.json": JSON.stringify({ commits: [{ message: "Merge pull request #130 from org/v2/gate-copy" }] }) };
  const removed = [], logs = [];
  const io = { eventPath: "event.json", list: () => ["README.md", "gate-copy.md"], read: (p) => files[p] || "", write: (p, t) => { files[p] = t; }, remove: (p) => removed.push(p), log: (s) => logs.push(s) };
  assert.equal(F.run(io), 0);
  assert.match(files["CHANGELOG.md"], /\| v7\.2 \| \d{4}-\d{2}-\d{2} \| 임유정 \| 게이트 문구 고침 \(#130\) \|/);
  assert.deepEqual(removed, ["changes/gate-copy.md"]);
  assert.match(logs[0], /^v7\.2 ← changes\/gate-copy\.md/);
});

test("run — 조각이 없으면 아무것도 쓰지 않고 0", () => {
  let wrote = false;
  const io = { list: () => ["README.md"], read: () => "", write: () => { wrote = true; }, remove: () => {}, log: () => {} };
  assert.equal(F.run(io), 0);
  assert.equal(wrote, false);
});

test("run — 이상한 조각은 ::error:: 로 알리고 1로 끝난다(숨기지 않는다, security-records 6-1)", () => {
  const logs = [];
  const io = { list: () => ["bad.md"], read: (p) => (p === "CHANGELOG.md" ? CHANGELOG : "종류: 작은 고침"), write: () => {}, remove: () => {}, log: (s) => logs.push(s) };
  assert.equal(F.run(io), 1);
  assert.match(logs[0], /^::error::조각 파일이 이상해요 — bad: 빠진 줄/);
});
