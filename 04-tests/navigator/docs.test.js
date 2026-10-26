// claude-drafted: 2026-10-25 — C-37 단계 문서를 GitHub에(이재엽 "2단계가 끝나면 우리 단계별로 했던 내용들과 같이 docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에 올릴 수 있도록" ·
//   버튼 "docs 단계 폴더 + CLAUDE.md" · "Floe가 만들고, 커밋 · 푸시는 Claude Code"). 03-backend/navigator/docs.js — 순수 함수(화면 미리 보기 · 서버가 같이 쓴다). 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/docs.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../../03-backend/navigator/docs.js");
const N = require("../../03-backend/navigator/navigator.js");

const R0 = { chap: 0, title: "동아리 행사 신청 앱", items: N.STAGES[0].criteria.map((c, i) => ({ name: c.text, lines: [["행사 신청을 종이로 받아서 헷갈려요", "신청이 한곳에 모여요", "쓰는 사람: 소수 — 아는 몇 사람이 써요", "크기: 보통"][i]] })) };
const R1 = { chap: 1, title: "동아리 행사 신청 앱", items: N.criteriaFor(1, "Xpress").map((c, i) => ({ name: c.text, lines: [`2단계 줄 ${i + 1} 연락처 010-1234-5678`] })) };
const RESULTS = { 0: R0, 1: R1 };

test("파일: docs/ 안에 단계 폴더 여덟(01-idea … 08-retro) — 끝낸 단계는 그 결과 md, 아직인 단계는 README 틀 · docs/README.md 목차 · 저장소의 README.md · CLAUDE.md는 한 절만", () => {
  const f = D.files({ topic: "동아리 행사 신청 앱", results: RESULTS });
  const paths = f.map((x) => x.path);
  assert.deepEqual(D.SLUGS, ["01-idea", "02-plan", "03-requirements", "04-design", "05-skeleton", "06-build", "07-measure", "08-retro"]);
  for (const p of ["docs/README.md", "docs/01-idea/idea.md", "docs/02-plan/plan.md", "docs/03-requirements/README.md", "docs/08-retro/README.md", "README.md", "CLAUDE.md"]) assert.ok(paths.includes(p), p);
  assert.equal(paths.length, new Set(paths).size, "같은 파일을 두 번 쓰지 않는다");
  assert.ok(paths.every((p) => /^[A-Za-z0-9._/-]+$/.test(p) && !p.includes("..") && !p.startsWith("/")), "정해진 이름만 — 받은 글이 경로가 되지 않는다");
  assert.deepEqual(f.filter((x) => x.merge).map((x) => x.path).sort(), ["CLAUDE.md", "README.md", "docs/PRD.md", "docs/README.md", "docs/decisions.md"], "저장소의 README · CLAUDE.md · docs/README.md · 기획서 · 결정 기록(C-39)은 덮어쓰지 않고 Floe 절만(이미 쓴 docs/README.md가 있을 수 있다 — 2026-10-25 리뷰)");
});

test("1단계 · 2단계 문서: 단계 이름 · 주제 · 할 일마다 적은 줄. 아직인 단계는 받는 것 · 하는 일 · 남는 것과 '아직'", () => {
  const f = D.files({ topic: "동아리 행사 신청 앱", results: RESULTS }), get = (p) => f.find((x) => x.path === p).text;
  const idea = get("docs/01-idea/idea.md");
  assert.match(idea, /^# 1단계 · 무엇을 만들지 정하기 — 동아리 행사 신청 앱/);
  for (const it of R0.items) { assert.ok(idea.includes(it.name), it.name); assert.ok(idea.includes(it.lines[0]), it.lines[0]); }
  const plan = get("docs/02-plan/plan.md");
  assert.match(plan, /^# 2단계 · 아이디어 적어 두기 — 동아리 행사 신청 앱/); assert.match(plan, /계획서/);
  const later = get("docs/03-requirements/README.md");
  assert.match(later, /^# 3단계 · 꼭 필요한 기능 정리하기/); assert.match(later, /아직/); assert.ok(later.includes(N.STAGES[2].gets) && later.includes(N.STAGES[2].gives));
  const index = get("docs/README.md");
  for (const s of D.SLUGS) assert.ok(index.includes(s), s);
  assert.ok(index.startsWith(D.MARK_START) && index.trimEnd().endsWith(D.MARK_END), "목차도 표시 사이 한 절");
});

test("가림: 넘겨받은 redact로 글을 가린다(공개 저장소일 수 있다) — 적은 줄도 할 일 이름도. 기본은 그대로", () => {
  const named = { ...RESULTS, 1: { ...R1, items: [{ name: "연락처 010-9999-0000 정하기", lines: [] }, ...R1.items.slice(1)] } };
  const plain = D.files({ topic: "앱", results: named }).find((x) => x.path === "docs/02-plan/plan.md").text;
  assert.ok(plain.includes("010-1234-5678") && plain.includes("010-9999-0000"));
  const hid = D.files({ topic: "앱", results: named, redact: (t) => String(t).replace(/010-\d{4}-\d{4}/g, "[가림]") }).find((x) => x.path === "docs/02-plan/plan.md").text;
  assert.ok(!hid.includes("010-1234-5678") && !hid.includes("010-9999-0000") && hid.includes("[가림]"), "할 일 이름도 가린다(2026-10-25 리뷰)");
});

test("README · CLAUDE.md 절: 표시(MARK) 사이만 바꾸고 나머지 글은 그대로 — 없으면 끝에 더하고, 파일이 없으면 새로", () => {
  const block = D.files({ topic: "동아리 행사 신청 앱", results: RESULTS }).find((x) => x.path === "README.md").text;
  assert.ok(block.startsWith(D.MARK_START) && block.trimEnd().endsWith(D.MARK_END));
  assert.match(block, /docs\/02-plan\/plan\.md/, "README 절은 계획서로 잇는다");
  const mine = "# test-1\n\n내가 쓴 소개\n";
  const once = D.mergeSection(mine, block);
  assert.ok(once.startsWith(mine.trimEnd()) && once.includes(block.trim()), "끝에 더한다");
  const again = D.mergeSection(once.replace("계획서", "옛 계획서"), block);
  assert.equal(again.split(D.MARK_START).length, 2, "두 번 써도 절은 하나");
  assert.ok(again.includes("내가 쓴 소개"));
  assert.equal(D.mergeSection("", block).trim(), block.trim(), "파일이 없으면 절만");
  const claude = D.files({ topic: "동아리 행사 신청 앱", results: RESULTS }).find((x) => x.path === "CLAUDE.md").text;
  assert.match(claude, /docs\/02-plan\/plan\.md/); assert.match(claude, /비밀값/);
});

test("Claude Code에 맡길 글(shipRequest): 만든 파일만 더하고 커밋 · 지금 브랜치를 푸시 — 다른 파일 · 강제 푸시는 하지 않고, 원격이 없으면 푸시하지 않고 알린다", () => {
  const paths = D.files({ topic: "앱", results: RESULTS }).map((x) => x.path);
  const t = D.shipRequest(paths);
  for (const p of paths) assert.ok(t.includes(p), p);
  assert.match(t, /git add/); assert.match(t, /커밋/); assert.match(t, /푸시/); assert.match(t, /--force/); assert.match(t, /원격/);
  assert.ok(t.length < 4000, "넘길 글 상한(server.js TASK_MAX) 안");
  assert.equal(D.SHIP_CHECKS.length, 2, "끝에 기준마다 보고 — 커밋했나 · 푸시했나(화면은 둘째로 '올라갔다'를 말한다)");
  assert.match(D.SHIP_CHECKS[1], /푸시/);
});

test("모양: 결과가 없는 단계는 틀만, 주제가 비어도 단계 이름으로", () => {
  const f = D.files({ topic: "", results: { 0: R0 } });
  assert.ok(f.find((x) => x.path === "docs/02-plan/README.md"), "2단계를 아직 안 했으면 2단계도 틀");
  assert.match(f.find((x) => x.path === "docs/01-idea/idea.md").text, /^# 1단계 · 무엇을 만들지 정하기\n/);
});
