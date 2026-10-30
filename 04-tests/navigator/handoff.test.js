// claude-drafted: 2026-10-30 — C-38 길 1 넘김 카드(결정 모음 A-15 "11/1 전", 이재엽 "2번 부터 쭉 진행").
// 넘김 카드 글을 만드는 순수 함수(03-backend/navigator/handoff.js)와, 섬 · 서버 · 화면에 이어졌는지(글자 모양)를 본다.
// 실행: node --test 04-tests/navigator/handoff.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const H = require("../../03-backend/navigator/handoff.js");
const S = require("../../03-backend/navigator/sensitive.js");

const ROOT = path.join(__dirname, "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const CTX = {
  project: "동아리 행사 등록 앱",
  idea: "동아리 행사 신청을 지금은 단톡방에서 받아요. 누가 신청했는지 놓치고, 마감도 자주 잊어요.",
  stage: { label: "3단계", title: "꼭 필요한 기능 정리하기" },
  cells: [
    { name: "기능 문장", line: "회원이 신청 단추를 누르면 앱은 신청을 받는다", done: true },
    { name: "숫자로", line: "", done: false, now: true },
    { name: "꼭 · 있으면 좋음", line: "", done: false },
  ],
  plan: [
    { need: "회원이 이름을 적고 신청 단추를 누르면, 앱은 신청을 받는다", check: "신청 단추를 누르면 목록에 그 이름이 한 줄 생긴다", done: true },
    { need: "마감이 지나면, 앱은 신청을 더 받지 않는다", check: "마감 뒤에 누르면 '마감됐어요'가 뜬다", done: false },
  ],
};

test("지금 단계 · 프로젝트 · 처음 말한 것 · 할 일(채움 ✓ / 지금 ▶ / 아직 ·)을 한 덩어리 글로", () => {
  const t = H.build(CTX);
  assert.match(t, /^\[Floe 넘김 카드\]/);
  assert.match(t, /프로젝트: 동아리 행사 등록 앱/);
  assert.match(t, /지금 단계: 3단계 · 꼭 필요한 기능 정리하기/);
  assert.match(t, /만들고 싶은 것: 동아리 행사 신청을/);
  assert.match(t, /✓ 기능 문장 — 적은 줄: 회원이 신청 단추를 누르면 앱은 신청을 받는다/);
  assert.match(t, /▶ 숫자로 — 지금 할 일/);
  assert.match(t, /○ 꼭 · 있으면 좋음\n/);
});

test("맡길 일(확정한 계획)은 번호 · 끝난 기준 · 끝남 표시와 함께, 없으면 그 절이 없다", () => {
  const t = H.build(CTX);
  assert.match(t, /1\. 회원이 이름을 적고 신청 단추를 누르면, 앱은 신청을 받는다 \(끝남\)\n {3}끝난 것 기준: 신청 단추를 누르면/);
  assert.match(t, /2\. 마감이 지나면, 앱은 신청을 더 받지 않는다\n/);
  assert.doesNotMatch(H.build({ ...CTX, plan: [] }), /맡길 일/);
});

test("부탁 — 쉬운 말 · 끝났는지는 Floe가 판단 · 다시 붙여 넣을 수 있게 칸마다 한 줄 · 비밀값은 묻지 않기", () => {
  const t = H.build(CTX);
  assert.match(t, /쉬운 말/);
  assert.match(t, /끝났는지는 Floe가/);
  assert.match(t, /칸 이름/);
  assert.match(t, /비밀번호 · 키/);
});

test("비밀값 · 메일 · 전화 모양은 가린다(sensitive.js redact) — 넘긴 redact를 글 전체에", () => {
  const leak = { ...CTX, idea: "키는 sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789 이고 메일은 a.b@example.com", cells: [{ name: "연락", line: "010-1234-5678로 받기", done: true }] };   // secret-check: allow — 가짜 키(가리기 시험)
  const t = H.build(leak, { redact: S.redact });
  assert.doesNotMatch(t, /sk-ant-api03|a\.b@example\.com|010-1234-5678/);
  assert.match(t, /\[비밀값\]/);
});

test("긴 글은 자른다 — 처음 말한 것 300자, 한 줄 200자, 맡길 일 8개, 글 전체 6000자", () => {
  const t = H.build({ ...CTX, idea: "가".repeat(900), cells: [{ name: "칸", line: "나".repeat(500), done: true }], plan: Array.from({ length: 12 }, (_, i) => ({ need: `일 ${i + 1}`, check: "", done: false })) });
  assert.ok(!t.includes("가".repeat(301)), "처음 말한 것 300자까지");
  assert.ok(!t.includes("나".repeat(201)), "한 줄 200자까지");
  assert.match(t, /8\. 일 8/);
  assert.doesNotMatch(t, /9\. 일 9/);
  assert.match(t, /그 밖에 4개/);
  const big = H.build({ ...CTX, cells: Array.from({ length: 80 }, (_, i) => ({ name: `칸 ${i} ${"다".repeat(150)}`, line: "라".repeat(200), done: true })) });
  assert.ok(big.length <= H.MAX, `글 전체 ${big.length}자`);
  assert.match(big, /…\(길어서 줄였어요\)$/);
});

test("자르기 전에 가린다 — 자르는 경계에 걸친 키도 앞부분이 새지 않는다", () => {
  const KEY = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789";   // secret-check: allow — 가짜 키(가리기 시험)
  const t = H.build({ ...CTX, idea: `${"가".repeat(280)} ${KEY}`, cells: [{ name: "칸", line: `${"나".repeat(190)} ${KEY}`, done: true }], plan: [{ need: `${"다".repeat(190)} ${KEY}`, check: "", done: false }] }, { redact: S.redact });
  assert.doesNotMatch(t, /sk-ant/);
});

test("할 일 칸 고르기(cellsFrom) — 하는 중인 퀘스트: 전체 문장 · 적은 줄 · 채움(줄 수) · 지금은 처음 못 채운 칸", () => {
  const quest = { objs: [{ name: "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", need: 1 }, { name: "'빨리' 같은 말을 숫자로 바꾸기", need: 1 }, { name: "꼭 필요한 것과 있으면 좋은 것을 나누기", need: 2 }], lines: [["신청 단추를 누르면 앱은 신청을 받는다"], [], ["하나"]] };
  assert.deepEqual(H.cellsFrom({ quest }), [
    { name: "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", line: "신청 단추를 누르면 앱은 신청을 받는다", done: true },
    { name: "'빨리' 같은 말을 숫자로 바꾸기", line: "", done: false, now: true },
    { name: "꼭 필요한 것과 있으면 좋은 것을 나누기", line: "하나", done: false },
  ]);
});

test("할 일 칸 고르기 — 판정의 met도 채움으로, 퀘스트가 없으면 지난 결과의 적은 줄, 둘 다 없으면 기준 이름만", () => {
  const quest = { objs: [{ name: "가", need: 1 }, { name: "나", need: 1 }], lines: [[], []] };
  assert.deepEqual(H.cellsFrom({ quest, criteria: [{ text: "가", met: true }, { text: "나", met: false }] }).map((c) => [c.done, !!c.now]), [[true, false], [false, true]]);
  const result = { items: [{ name: "불편", lines: ["단톡방에서 신청을 놓친다"] }, { name: "누가", lines: [] }] };
  assert.deepEqual(H.cellsFrom({ result, criteria: [{ text: "불편" }, { text: "누가" }] }), [
    { name: "불편", line: "단톡방에서 신청을 놓친다", done: true },
    { name: "누가", line: "", done: false, now: true },
  ]);
  assert.deepEqual(H.cellsFrom({ criteria: [{ text: "빈칸 채우기", met: false }] }), [{ name: "빈칸 채우기", line: "", done: false, now: true }]);
});

test("넘길 것이 없으면(단계를 모름) 빈 글 — 단추가 아무것도 복사하지 않는다", () => {
  assert.equal(H.build({}), "");
  assert.equal(H.build({ project: "x" }), "");
  assert.equal(H.build(null), "");
});

test("섬 · 서버 · 화면에 이어졌다 — '더 보기' 칩, 누르기 둘, 스크립트, 서버 목록", () => {
  const frag = read("02-frontend/navigator/app/47-handoff.js");
  assert.match(frag, /Object\.assign\(ACT, \{[\s\S]*"handoff-copy"[\s\S]*"handoff-close"/);
  assert.match(frag, /if \(!window\.NavSensitive\) return say\(/, "가리기를 못 불러오면 복사하지 않는다");
  assert.match(frag, /HO\.cellsFrom\(/);
  const quest = read("02-frontend/navigator/app/40-quest.js");
  assert.match(quest, /act: "handoff-copy"/);
  assert.match(quest, /\$\{proposalsHTML\(\)\}\$\{handoffHTML\(\)\}\$\{approvalsHTML\(\)\}<div class="msg floro now">/, "허락 카드는 지금 말 바로 위 그대로(C-35)");
  assert.match(read("02-frontend/navigator/index.html"), /<script src="\.\.\/\.\.\/03-backend\/navigator\/handoff\.js"/);
  assert.match(read("03-backend/navigator/server.js"), /"handoff\.js"/);
});
