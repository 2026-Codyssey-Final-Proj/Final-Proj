// claude-drafted: 2026-10-30 — C-64 오류에 막혔을 때(이재엽 버튼 "10/31까지 작게": 맡긴 일 실패(C-50)에서 이어지는 질문 셋만).
// 규칙은 03-backend/navigator/plan.js(withDebug · taskFor), 화면은 02-frontend/navigator/app/70-tasks.js. 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/error-help.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../../03-backend/navigator/plan.js");
const N = require("../../03-backend/navigator/navigator.js");
const S = require("../../03-backend/navigator/sensitive.js");

const PLAN = N.parsePlan({ problem: "신청을 종이로 받아요", have: "README뿐", missing: "화면이 없어요",
  items: [{ need: "회원이 신청한다", check: "목록에 한 줄이 생긴다" }, { need: "운영진이 목록을 본다", check: "이름이 보인다" }], prep: [], ask: [], say: "봐 주세요" });
const confirmed = () => B.confirm(B.mark(B.mark(B.board(PLAN), "p1", "ok"), "p2", "ok"));
const failedLine = () => B.failed(B.start(confirmed(), "p1", 11), "p1", "끝까지 가지 못했어요");
const read = (p) => fs.readFileSync(path.join(__dirname, "../../02-frontend", p), "utf8");

test("질문 셋 — 오류 글 그대로 · 바로 전에 바꾼 것 · 다시 하면 또 나나(예 · 아니요 · 모름), 고친 뒤 시험 하나를 기준에 더한다", () => {
  assert.deepEqual(B.DEBUG_QS.map((q) => q.key), ["err", "changed", "again"]);
  assert.match(B.DEBUG_QS[0].q, /그대로/);
  assert.deepEqual(B.DEBUG_QS[2].choices, ["예", "아니요", "모름"]);
  assert.match(B.DEBUG_CHECK, /다시 나지 않는지/);
  assert.ok(B.DEBUG_CHECK.length <= 200, "서버의 기준 한 줄 상한(CHECK_LINE_MAX 200) 안");
});

test("끝까지 못 간 줄에만 붙는다 — 맡김 중 · 보고 옴 · 실패 없는 줄 · 없는 줄은 그대로, 원래 판은 바꾸지 않는다", () => {
  const ans = { err: "TypeError: x is undefined", changed: "form.js", again: "예" };
  const c = confirmed();
  assert.equal(B.withDebug(c, "p1", ans), c, "실패한 적 없는 줄");
  const run = B.start(c, "p1", 11);
  assert.equal(B.withDebug(run, "p1", ans), run, "맡김 중");
  const f = failedLine();
  assert.equal(B.withDebug(f, "p9", ans), f, "없는 줄");
  const d = B.withDebug(f, "p1", ans);
  assert.notEqual(d, f); assert.equal(f.work.p1.debug, undefined, "원래 판은 그대로");
  assert.deepEqual(d.work.p1.debug, { err: "TypeError: x is undefined", changed: "form.js", again: "예" });
  assert.equal(d.work.p1.state, "todo"); assert.ok(d.work.p1.fail, "실패 기록은 남는다(C-50 조용히 되돌리지 않는다)");
});

test("빈 답 · 모르는 고르기는 '모름' — 모르면 막히지 않는다(2-1 원칙 5), 길이는 자른다", () => {
  const d = B.withDebug(failedLine(), "p1", { err: "  ", changed: undefined, again: "아마도" });
  assert.deepEqual(d.work.p1.debug, { err: "모름", changed: "모름", again: "모름" });
  const long = B.withDebug(failedLine(), "p1", { err: "가".repeat(5000), changed: "나".repeat(500), again: "아니요" }).work.p1.debug;
  assert.equal(long.err.length, B.DEBUG_QS[0].max); assert.equal(long.changed.length, B.DEBUG_QS[1].max); assert.equal(long.again, "아니요");
  assert.equal(B.withDebug(failedLine(), "p1", null).work.p1.debug.err, "모름", "답이 없어도 깨지지 않는다");
});

test("보내기 전에 가린다 — 키 모양은 [비밀값](sensitive.js), 내 컴퓨터 이름이 든 홈 경로는 ~로", () => {
  const err = "Error: 401 " + "sk-" + "b".repeat(24) + " at /Users/minji/club-app/form.js:12 · C:\\Users\\minji\\app\\x.js · /home/minji/a.py";
  const d = B.withDebug(failedLine(), "p1", { err, changed: "/Users/minji/club-app/form.js를 고쳤어요", again: "예" }, S.redact).work.p1.debug;
  assert.ok(!d.err.includes("b".repeat(24)), "키는 가린다"); assert.match(d.err, /\[비밀값\]/);
  assert.ok(!/minji/.test(d.err) && !/minji/.test(d.changed), "홈 폴더 이름은 남지 않는다");
  assert.match(d.err, /~\/club-app\/form\.js:12/); assert.match(d.err, /~\\app\\x\.js/); assert.match(d.err, /~\/a\.py/);
  assert.equal(B.withDebug(failedLine(), "p1", { err: "/Users/minji/x" }).work.p1.debug.err, "~/x", "가리기 함수가 없어도 홈 경로는 바꾼다");
});

test("맡길 글 — 답을 붙이고 '재현 → 좁히기 → 원인 → 고침', 기준에 다시 안 나는지 보는 시험 하나를 더한다. 답이 없으면 지금과 같다", () => {
  const f = failedLine();
  const plain = B.taskFor(f, "p1");
  assert.deepEqual(plain.checks, ["목록에 한 줄이 생긴다"]); assert.ok(!/오류 같이 보기/.test(plain.text));
  const t = B.taskFor(B.withDebug(f, "p1", { err: "TypeError: x", changed: "", again: "예" }), "p1");
  assert.deepEqual(t.checks, ["목록에 한 줄이 생긴다", B.DEBUG_CHECK]);
  assert.match(t.text, /^회원이 신청한다\n/);
  assert.match(t.text, /오류 글\(고치지 않은 그대로\): TypeError: x/); assert.match(t.text, /바로 전에 바꾼 것: 모름/); assert.match(t.text, /다시 하면 또 나나: 예/);
  assert.match(t.text, /재현 → 좁히기 → 원인 → 고침/);
  assert.ok(t.text.length < 4000, "서버의 맡길 글 상한(TASK_MAX 4000) 안 — 가장 긴 답에서도");
  const big = B.taskFor(B.withDebug(f, "p1", { err: "가".repeat(5000), changed: "나".repeat(500), again: "예" }), "p1");
  assert.ok(big.text.length < 4000);
});

test("보고가 오면 답은 다 쓴 것 — 다음에 다르게 봐요 · 다시 실패해도 옛 답을 또 붙이지 않는다. 저장한 판으로 되살릴 수 있다", () => {
  const d = B.withDebug(failedLine(), "p1", { err: "TypeError: x", changed: "form.js", again: "예" });
  assert.ok(B.revive(JSON.parse(JSON.stringify(d))), "저장 · 되살리기");
  const rep = B.report(B.start(d, "p1", 12), "p1", { items: [], easy: "고쳤어요", ask: "", done: 2, total: 2 });
  assert.equal(rep.work.p1.debug, undefined);
  assert.deepEqual(B.taskFor(B.reject(rep, "p1", "아직 나요"), "p1").checks, ["목록에 한 줄이 생긴다"]);
});

test("화면 — 실패한 줄에 '오류 같이 보기', 질문은 하나씩(모름 · 그만두기), 답을 붙인 줄은 옛 일을 잇지 않고 새로 맡긴다", () => {
  const t = read("navigator/app/70-tasks.js");
  assert.match(t, /\.\.\.\(FP\.canDebug\(b, id\) \? \[\{ label: wd \? "오류 다시 적기" : "오류 같이 보기", act: "dbg-open" \}\] : \[\]\)/, "실패한 줄의 칩 — 실패 2번째까지만");
  assert.match(t, /title: `오류 같이 보기 — \$\{k \+ 1\} \/ \$\{FP\.DEBUG_QS\.length\}`/, "한 번에 하나씩 — 몇 번째인지");
  for (const a of ["dbg-open", "dbg-next", "dbg-skip", "dbg-pick", "dbg-close"]) assert.match(t, new RegExp(`"${a}": `), `${a} 동작`);
  assert.match(t, /FP\.withDebug\(st\.plan, d\.id, d\.a, \(s\) => window\.NavSensitive\.redact\(s\)\)/, "가린 뒤 붙인다");
  assert.match(t, /if \(!window\.NavSensitive\) \{ st\.dbg = null;[^\n]*답을 붙이지 않았어요/, "가리는 도구가 없으면 붙이지 않는다(새 맥락 리뷰 제안)");
  assert.match(t, /w\.fail && !FP\.debugOf\(w\) && Number\.isFinite\(w\.at\) \? await planCall\("hand", "\/api\/task\/retry"/, "답을 붙였으면 옛 일 다시(retry) 대신 새 글로");
  assert.match(t, /st\.dbg\.v === b\.v && st\.dbg\.n === \(w\.fail && w\.fail\.n\)/, "새 판 · 새 실패에는 옛 질문 카드가 뜨지 않는다(새 맥락 리뷰 보완)");
  assert.match(read("navigator/app/90-acts.js"), /"plan-reset": \(\) => \{ st\.plan = null; st\.dbg = null;/, "새 계획 적기는 질문도 비운다");
  assert.match(read("navigator/app/92-basecard.js"), /if \(a === "dbg-text" && st\.dbg\) \{[^\n]*t\.value\.slice\(0, 20000\)/, "글자를 칠 때 답을 담는다 — 가리기 전에 짧게 자르지 않는다");
  assert.match(read("navigator/app/00-base.js"), /dbg: null/, "질문 상태는 메모리에만");
});

test("또 실패하면 붙인 답은 지워지고(다시 묻는다), 묻기는 실패 2번째까지 — 다시 맡기기 상한(C-50 2번)을 새 글로 피하지 않게(새 맥락 리뷰 막힘)", () => {
  const ans = { err: "TypeError: x", changed: "form.js", again: "예" };
  const d1 = B.withDebug(failedLine(), "p1", ans);
  const f2 = B.failed(B.start(d1, "p1", 12), "p1", "또 못 했어요");
  assert.equal(f2.work.p1.debug, undefined, "또 실패하면 답은 다 쓴 것");
  assert.deepEqual(B.taskFor(f2, "p1").checks, ["목록에 한 줄이 생긴다"]);
  assert.equal(f2.work.p1.fail.n, 2); assert.ok(B.canDebug(f2, "p1"), "2번째 실패까지는 묻는다");
  const f3 = B.failed(B.start(B.withDebug(f2, "p1", ans), "p1", 13), "p1", "또");
  assert.equal(f3.work.p1.fail.n, 3); assert.equal(B.canDebug(f3, "p1"), false, "3번째부터는 묻지 않는다");
  assert.equal(B.withDebug(f3, "p1", ans), f3);
});

test("가린 뒤 자른다 — 1500자 경계에 걸친 키도 새지 않는다. 대소문자 · 띄어쓰기 든 홈 폴더 이름도 ~로, 이상한 저장값은 없는 것으로", () => {
  const key = "sk-" + "d".repeat(30);
  const err = "가".repeat(1490) + key;
  const d = B.withDebug(failedLine(), "p1", { err }, S.redact).work.p1.debug;
  assert.ok(!d.err.includes("ddd"), "경계의 키 조각이 남지 않는다"); assert.ok(d.err.endsWith("[비밀값]") && d.err.length <= B.DEBUG_QS[0].max);
  const p = B.withDebug(failedLine(), "p1", { err: "c:\\users\\minji\\app\\x.js · /Users/John Smith/club/a.js · /home/minji" }).work.p1.debug.err;
  assert.ok(!/minji|John|Smith/.test(p), p); assert.match(p, /~\\app\\x\.js/); assert.match(p, /~\/club\/a\.js/);
  const bad = { ...failedLine() }; bad.work = { ...bad.work, p1: { ...bad.work.p1, debug: { err: 3 } } };
  assert.equal(B.debugOf(bad.work.p1), null); assert.deepEqual(B.taskFor(bad, "p1").checks, ["목록에 한 줄이 생긴다"], "깨진 값은 붙이지 않는다");
});
