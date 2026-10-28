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

// C-42 R-10(2026-10-27): 관문에서 '까닭 적고 넘기기'로 지났으면 결정 기록의 관문 줄에 넘긴 기준 수와 까닭이 남고, 단계 문서의 완료 기준 표에는 '넘김'이 보인다
test("decisions · stageDoc — 넘긴 기준(skipped)은 '됨' 수에 들지 않고 '넘김 n — 까닭'으로, 완료 기준 표에는 '넘김(까닭)'", () => {
  const D = require("../../03-backend/navigator/docs.js");
  const r = { chap: 6, title: "재 보기", at: "2026-10-27", passed: "2026-10-28", items: [{ name: "잰 값을 그대로 적어 두기", lines: ["알림 시각: (재고 적기)"], by: "ok" }],
    check: [{ text: "2단계에서 정한 숫자를 실제로 재 보기", met: true, evidence: "e" }, { text: "잰 값을 그대로 적어 두기", met: true, skipped: true, evidence: "" }], skip: { reason: "아직 잴 수 없어요 — 발표 뒤에", items: ["잰 값을 그대로 적어 두기"] } };
  const files = D.files({ topic: "t", idea: "", results: { 6: r }, redact: (x) => x });
  const dec = files.find((f) => f.path === "docs/decisions.md").text, doc = files.find((f) => f.path === "docs/07-measure/measure.md").text;
  assert.match(dec, /\| 2026-10-28 \| 7단계 \| 관문 \| — \| 이해했어요\(예\) · 기준 1\/2 · 넘김 1 — 까닭: 아직 잴 수 없어요 — 발표 뒤에 \| 관문 \|/);
  assert.match(doc, /\| 잰 값을 그대로 적어 두기 \| 넘김\(까닭: 아직 잴 수 없어요 — 발표 뒤에\) \|/);
  assert.match(doc, /\| 2단계에서 정한 숫자를 실제로 재 보기 \| 됨 \|/);
});

// F-70(2026-10-28, 결정 모음 A-04): 6단계에서 '코드 파일을 만드시겠습니까?'에 아니요 — 결정 기록의 관문 줄에 '코드 없이 지남'
test("decisions — 6단계를 코드 없이 지났으면(nocode) 관문 줄에 '코드 없이 지남'", () => {
  const D = require("../../03-backend/navigator/docs.js");
  const r = { chap: 5, title: "만들기", at: "2026-10-28", passed: "2026-10-28", nocode: true, items: [{ name: "확인 방법을 먼저 정하고 만들기", lines: ["목차 문서로 확인"], by: "me" }], check: [{ text: "확인 방법을 먼저 정하고 만들기", met: true, evidence: "e" }] };
  const dec = D.files({ topic: "t", idea: "", results: { 5: r }, redact: (x) => x }).find((f) => f.path === "docs/decisions.md").text;
  assert.match(dec, /\| 2026-10-28 \| 6단계 \| 관문 \| — \| 이해했어요\(예\) · 기준 1\/1 · 코드 없이 지남 \| 관문 \|/);
  const dec2 = D.files({ topic: "t", idea: "", results: { 5: { ...r, nocode: undefined } }, redact: (x) => x }).find((f) => f.path === "docs/decisions.md").text;
  assert.ok(!dec2.includes("코드 없이 지남"));
});

// F-68(2026-10-28, 이재엽 버튼 "통째로 파일에"): 받은 글은 자르지 않고 docs/00-source/idea.md에 통째로(줄 번호와 함께), 1단계 문서 · 기획서의 '처음 말한 것'은 앞 400자 + 그 파일을 줄로 가리킨다
test("source — 받은 글 전부를 docs/00-source/idea.md에(줄 번호 · 가림), 1단계 문서와 기획서는 앞 400자 뒤에 '… 통째로: 00-source/idea.md 1 ~ N줄'", () => {
  const long = Array.from({ length: 30 }, (_, i) => `${i + 1}번째 줄 — 동아리 행사 신청 앱 이야기 ${"가".repeat(20)}`).join("\n");
  const f = D.files({ topic: "앱", results: RESULTS, idea: long.slice(0, 400), source: long });
  const src = f.find((x) => x.path === "docs/00-source/idea.md");
  assert.ok(src && !src.merge, "통째로 쓰는 파일(덮어씀 — 받은 글은 사람 글이 아니라 Floe가 받은 것)");
  assert.match(src.text, /^# 처음 말한 것 — 받은 글 그대로/); assert.match(src.text, /\n *1 \| 1번째 줄/); assert.match(src.text, /\n30 \| 30번째 줄/, "줄 번호");
  const idea = f.find((x) => x.path === "docs/01-idea/idea.md").text, prd = f.find((x) => x.path === "docs/PRD.md").text;
  assert.match(idea, /통째로: \[00-source\/idea\.md\]\(\.\.\/00-source\/idea\.md\) 1 ~ 30줄/, "1단계 문서는 줄로 가리킨다"); assert.match(prd, /\[00-source\/idea\.md\]\(00-source\/idea\.md\) 1 ~ 30줄/);
  assert.ok(!idea.includes("30번째 줄"), "1단계 문서에는 앞 400자만");
  const g = D.files({ topic: "앱", results: RESULTS, idea: "짧은 글", source: "짧은 글" });
  assert.ok(!g.some((x) => x.path === "docs/00-source/idea.md"), "400자 안이면 통째 파일은 없다 — 문서에 다 들어 있다");
  const r = D.files({ topic: "앱", results: RESULTS, idea: "x", source: "password: hunter22\n" + "y".repeat(500), redact: (t) => String(t).replace(/hunter22/g, "[비밀값]") });
  assert.ok(r.find((x) => x.path === "docs/00-source/idea.md").text.includes("[비밀값]"), "가림을 거친다");
});

// C-56 R-1(2026-10-28): 기준 카드(basecard.js)가 있으면 docs/base.md 한 장(덮어씀 — Floe가 만든 카드), 없으면 파일 없음
test("card — 기준 카드가 오면 docs/base.md(칸 · 내용 · 어디서), 없으면 만들지 않는다", () => {
  const B = require("../../03-backend/navigator/basecard.js");
  const card = B.withEdits(B.build({ results: { 0: RESULTS[0] }, source: "파이썬으로 만들어야 해요" }), { success: "신청 40건" });   // 2단계 전 — 성공은 사람이 채운다
  const f = D.files({ topic: "앱", results: RESULTS, card });
  const k = f.find((x) => x.path === "docs/base.md"); assert.ok(k && !k.merge, "base.md");
  assert.match(k.text, /^# 이 프로젝트의 기준 — 앱/); assert.match(k.text, /\| 성공 \| 신청 40건 \| 직접 \|/); assert.match(k.text, /파이썬으로 만들어야 해요 \(1줄\)/);
  assert.ok(!D.files({ topic: "앱", results: RESULTS }).some((x) => x.path === "docs/base.md"), "카드가 없으면 없다");
  assert.match(f.find((x) => x.path === "docs/README.md").text, /\[base\.md\]\(base\.md\)/, "목차에서 가리킨다");
});

// 지식 퀘스트 C-47(2026-10-29 — 지식 퀘스트 PRD 6절 · 9절 6번 '그 단계 문서의 배운 것 칸', 결정 모음 A-13 '막지 않고 비어 있음'):
//   관문에서 사람이 적은 배운 것은 그 단계 문서의 '배운 것' 칸에 그대로, 비우면 '비어 있음'. 처음 뜻이 바뀌었으면 기획서의 '처음 말한 것' 옆에 덧붙이고 처음 말은 지우지 않는다
test("C-47 배운 것 · 처음 뜻 — 단계 문서 '배운 것' 칸에 그대로 · 비우면 '비어 있음' · 관문 전이면 '아직', 바뀐 뜻은 기획서에 덧붙이고 처음 말은 그대로", () => {
  const D = require("../../03-backend/navigator/docs.js");
  const it = (name, line) => ({ name, lines: [line], by: "me" });
  const results = {
    0: { chap: 0, title: "t", at: "2026-10-28", passed: "2026-10-28", learned: "", items: [it("다 만들면 무엇이 달라지는지 쓰기", "신청이 한곳에 모인다")] },
    1: { chap: 1, title: "t", at: "2026-10-29", passed: "2026-10-29", learned: "칸을 먼저 채우니 빠진 기능이 보였다", goal: { changed: "신청과 출석까지 한곳에" }, items: [it("왜", "헷갈려서")] },
    2: { chap: 2, title: "t", at: "2026-10-29", items: [it("기능", "신청하면, 앱은 받는다")] },
  };
  const files = D.files({ topic: "동아리", idea: "신청이 한곳에 모이면 좋겠어요", results, redact: (x) => x });
  const doc = (p) => files.find((f) => f.path === p).text;
  assert.match(doc("docs/02-plan/plan.md"), /## 배운 것\n\n> 칸을 먼저 채우니 빠진 기능이 보였다\n/, "사람이 적은 말 그대로(인용)");
  assert.match(doc("docs/01-idea/idea.md"), /## 배운 것\n\n비어 있음 — 관문에서 적지 않았어요/, "비우면 비어 있음(관문을 막지 않는다)");
  assert.match(doc("docs/03-requirements/requirements.md"), /## 배운 것\n\n아직 — 관문에서 적어요/);
  assert.match(doc("docs/02-plan/plan.md"), /## 처음 뜻 다시 보기\n\n바뀌었어요 — “신청과 출석까지 한곳에” \(전: “신청이 한곳에 모인다”\)/, "견준 말(1단계 원하는 결과)도 같이");
  const prd = doc("docs/PRD.md");
  assert.match(prd, /신청이 한곳에 모이면 좋겠어요/, "처음 말은 지우지 않는다");
  assert.match(prd, /바뀐 뜻 — 2단계 관문\(2026-10-29\): “신청과 출석까지 한곳에” \(전: “신청이 한곳에 모인다”\)/);
  const old = D.files({ topic: "t", idea: "", results: { 0: { ...results[0], learned: undefined }, 1: { ...results[1], learned: undefined, goal: undefined } }, redact: (x) => x });
  assert.match(old.find((f) => f.path === "docs/01-idea/idea.md").text, /## 배운 것\n\n남아 있지 않아요/, "배운 것 칸을 만들기 전에 지난 관문은 지어내지 않는다");
  // 새 맥락 리뷰(2026-10-29): 여러 줄 · 줄머리 # · --- · <!-- 가 문서 모양을 깨지 않는다 — 줄마다 인용, <는 &lt;. 앞 관문에서 바꾼 뒤 '아직 같아요'는 바꾼 말과 견준다
  const tricky = D.files({ topic: "t", idea: "", results: { 0: results[0], 1: results[1], 2: { ...results[2], passed: "2026-10-30", learned: "# 제목처럼\n---\n<!-- 숨김\n\n끝", goal: { same: true } } }, redact: (x) => x });
  const req = tricky.find((f) => f.path === "docs/03-requirements/requirements.md").text;
  assert.match(req, /## 배운 것\n\n> # 제목처럼\n> ---\n> &lt;!-- 숨김\n>\n> 끝\n\n## 처음 뜻 다시 보기/);
  assert.ok(!/^---$/m.test(req.split("## 증빙")[0].split("## 배운 것")[1]), "줄 하나가 ---여도 인용 안");
  assert.match(req, /아직 같아요 — “신청과 출석까지 한곳에” 그대로/, "앞 관문에서 바꾼 말과 견줬다");
});
