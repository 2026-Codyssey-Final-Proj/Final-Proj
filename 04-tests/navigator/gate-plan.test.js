// claude-drafted: 2026-10-30 — C-27 관문 계획서(이재엽 "보드에서 없음 부분 전부 제작"). 요구: 관문에 들어서면 그 단계까지의 계획서 한 권 —
// ① 목차 ② 여덟 단계 그림과 지금 자리 ③ 이번 단계에서 한 일 · 정한 것 · 배운 말 ④ 다음 단계의 할 일 · 끝 조건 ⑤ 공부할 말. 목차를 누르면 그 절로.
// 열린 칸은 Claude가 기본값으로 정했다: 관문마다 늘(FR-5 '아니요'일 때만이 아니라) · 절 · 목차 · 요약 모두 규칙(AI를 부르지 않는다 — 연습 모드에서도) · 파일로도(단계 폴더의 gate-plan.md).
// 규칙 03-backend/navigator/gateplan.js, 화면 02-frontend/navigator/app/60-library.js(책 탭) · 20-feed.js(관문 카드). 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/gate-plan.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const GP = require("../../03-backend/navigator/gateplan.js");
const N = require("../../03-backend/navigator/navigator.js");
const D = require("../../03-backend/navigator/docs.js");

const RESULTS = {
  0: { chap: 0, items: [{ name: "어떤 불편", lines: ["신청을 종이로 받아 헷갈려요"], by: "me" }, { name: "누가 쓰나", lines: ["동아리 운영진"], by: "ok" }], at: "2026-10-25", passed: "2026-10-25", learned: "불편을 한 문장으로 쓰니 범위가 보였다" },
  1: { chap: 1, items: [{ name: "아이디어", lines: ["신청 화면 하나와 목록 하나"], by: "edit" }, { name: "범위", lines: [] }], at: "2026-10-27" },
};

test("목차 다섯 절 — 순서 · 이름은 늘 같다(같은 입력이면 같은 목차)", () => {
  const b = GP.build(1, { results: RESULTS });
  assert.deepEqual(b.toc.map((t) => t.title), ["전체 그림 — 지금 자리", "이번 단계에서 한 일", "정한 것 · 배운 말", "다음 단계 — 할 일과 끝 조건", "공부할 말"]);
  assert.deepEqual(b.toc.map((t) => t.id), ["gp-2-1", "gp-2-2", "gp-2-3", "gp-2-4", "gp-2-5"]);
  assert.deepEqual(GP.build(1, { results: RESULTS }), b, "같은 입력이면 같은 계획서");
  assert.match(b.title, /^2단계 관문 계획서 · /);
});

test("① 전체 그림 — 여덟 단계에 지남(날짜) · 이 관문 · 아직(올릴 때마다 다시 만들어도 맞는 말)", () => {
  const rows = GP.build(1, { results: RESULTS }).sections[0].rows;
  assert.equal(rows.length, 8);
  assert.match(rows[0], /^✓ 1단계 · .+ — 지남 2026-10-25$/);
  assert.match(rows[1], /^▶ 2단계 · .+ — 이 관문$/);
  assert.match(rows[2], /^· 3단계 · /);
});

test("② 한 일 — 칸마다 첫 줄(빈 칸은 '비었어요'), ③ 정한 것은 누가 정했나와 함께 · 배운 것(용어는 ⑤에만 — 겹치지 않게)", () => {
  const b = GP.build(0, { results: RESULTS });
  assert.deepEqual(b.sections[1].rows, ["어떤 불편 — 신청을 종이로 받아 헷갈려요", "누가 쓰나 — 동아리 운영진"]);
  const decided = b.sections[2].rows.join("\n");
  assert.match(decided, /신청을 종이로 받아 헷갈려요 \(직접\)/); assert.match(decided, /동아리 운영진 \(그대로\)/, "화면은 짧은 말(quest.js BY_WORD)");
  assert.match(GP.build(0, { results: RESULTS, how: D.HOW_WORDS }).sections[2].rows.join("\n"), /\(직접 적음\(초안 없이\)\)/, "문서는 긴 말(docs.js HOW_WORDS)");
  assert.ok(!/이 단계의 말/.test(decided));
  assert.match(decided, /배운 것: 불편을 한 문장으로 쓰니 범위가 보였다/);
  assert.deepEqual(GP.build(1, { results: RESULTS }).sections[1].rows, ["아이디어 — 신청 화면 하나와 목록 하나", "범위 — 비었어요"]);
});

test("④ 다음 단계 — 이름 · 하는 일 · 끝 조건(등급에 맞는 기준), 마지막 단계는 마무리", () => {
  const b = GP.build(1, { results: RESULTS, tier: "Full" }), next = b.sections[3].rows.join("\n");
  assert.match(next, new RegExp(`3단계 · ${N.STAGES[2].title}`));
  for (const c of N.criteriaFor(2, "Full")) assert.ok(next.includes(c.text), c.text);
  assert.match(GP.build(7, { results: RESULTS }).sections[3].rows[0], /마무리/);
});

test("⑤ 공부할 말 — 다음 단계 기준의 용어와 쉬운 풀이(풀이가 있는 것만), 겹치지 않게", () => {
  const rows = GP.build(1, { results: RESULTS }).sections[4].rows;
  assert.ok(rows.some((r) => r.startsWith("EARS — ")), rows.join("|"));
  assert.equal(new Set(rows).size, rows.length);
});

test("가린다 — 받은 가리기 함수를 칸 글 · 배운 것에, 결과가 없는 단계도 깨지지 않는다", () => {
  const leaky = { 0: { ...RESULTS[0], learned: "키 sk-zzz", items: [{ name: "a", lines: ["비번 sk-yyy"] }] } };
  const md = GP.toMarkdown(GP.build(0, { results: leaky, hide: (t) => String(t).replace(/sk-\w+/g, "[비밀값]") }));
  assert.ok(!/sk-/.test(md));
  assert.doesNotThrow(() => GP.toMarkdown(GP.build(3, {})));
});

test("마크다운 — 목차 줄이 절 이름표로 이어진다(누르면 그 절로), 파일로도 단계 폴더에(문서로 묶어 올릴 때)", () => {
  const md = GP.toMarkdown(GP.build(1, { results: RESULTS }));
  assert.match(md, /^# 2단계 관문 계획서/);
  for (let k = 1; k <= 5; k++) { assert.match(md, new RegExp(`\\]\\(#gp-2-${k}\\)`)); assert.match(md, new RegExp(`<a id="gp-2-${k}"></a>`)); }
  const files = D.files({ topic: "행사", results: { ...RESULTS, 1: { ...RESULTS[1], passed: "2026-10-27" } } }).map((f) => f.path);
  assert.ok(files.includes("docs/01-idea/gate-plan.md") && files.includes("docs/02-plan/gate-plan.md"), "관문을 지난 단계마다");
  assert.ok(!D.files({ results: { 1: RESULTS[1] } }).some((f) => /gate-plan/.test(f.path)), "아직 관문 전이면 없다");
});

test("화면 — 관문 카드에 '계획서 보기', 책 탭에 단계마다 계획서 · 목차 단추가 그 절로 · 파일로 받기", () => {
  const read = (p) => fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator", p), "utf8");
  const feed = read("app/20-feed.js"), lib = read("app/60-library.js"), html = read("index.html");
  assert.match(feed, /\{ label: "계획서 보기", act: "gp-open", kind: "ghost" \}/);
  assert.match(lib, /function gatePlanBox\(\)/);
  assert.match(lib, /data-act="gp-toc" data-v="\$\{esc\(t\.id\)\}"/);
  assert.match(lib, /"gp-toc": \(i, el\) => \{/); assert.match(lib, /scrollIntoView/);
  assert.match(lib, /"gp-file": \(\) => \{/);
  assert.ok(html.indexOf("navigator/gateplan.js") > 0 && html.indexOf("navigator/gateplan.js") < html.indexOf("navigator/docs.js") && html.indexOf("navigator/docs.js") < html.indexOf('<script src="app.js"'), "docs.js보다 먼저, app.js보다 먼저");
});

test("새 맥락 리뷰 — <!-- 가 파일 계획서 · README 버전 줄의 뒤를 숨기지 않는다(&lt;), 파일 계획서의 끝 조건은 화면과 같은 등급, 칸 이름도 가린다", () => {
  const leaky = { 0: { ...RESULTS[0], learned: "메모 <!-- 숨김", items: [{ name: "sk-name", lines: ["x"] }] } };
  const md = GP.toMarkdown(GP.build(0, { results: leaky, hide: (t) => String(t).replace(/sk-\w+/g, "[비밀값]") }));
  assert.ok(!md.includes("<!--") && md.includes("&lt;!-- 숨김")); assert.ok(!md.includes("sk-name"));
  const readme = D.files({ results: leaky }).find((f) => f.path === "README.md").text;
  assert.ok(!/메모 <!--/.test(readme) && readme.includes("메모 &lt;!-- 숨김"));
  const lite = (t) => D.files({ results: { 1: { ...RESULTS[1], passed: "2026-10-27" } }, tier: t }).find((f) => f.path === "docs/02-plan/gate-plan.md").text.split("끝 조건:").length - 1;
  assert.equal(lite("Lite"), N.criteriaFor(2, "Lite").length); assert.equal(lite("Full"), N.criteriaFor(2, "Full").length);
});
