// claude-drafted: 2026-10-28 — C-56 R-1 기준 카드(이재엽 "사용자에 맞춰서 기준을 만들고", 버튼 "1단계 관문에서"): 1단계 관문을 지날 때 1단계 칸 · 받은 글 · 작업 폴더로 이 프로젝트의 기준 한 장 —
//   만드는 것 · 쓰는 사람 · 크기 · 이미 정해진 것 · 재료 · 다룰 정보 · 밖으로 · 성공. 받은 글 · 지난 칸에서 온 줄은 출처와 함께 '옮겨 옴', 사람만 아는 것(성공 숫자)은 빈칸. docs/기준.md로 남긴다. 코드보다 먼저 썼다(code.md 1번)
// 실행: node --test 04-tests/navigator/basecard.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const B = require("../../03-backend/navigator/basecard.js");

const r0 = { items: N.STAGES[0].criteria.map((c, i) => ({ name: c.text, lines: [["동아리 행사 신청을 종이로 받아서 헷갈려요", "신청이 한곳에 모이고 마감 전에 알림이 가요", "동아리 운영진 3명과 회원 40명", "크기: 보통 — 신청 받기와 알림"][i]] })) };
const SRC = "미션 1 — 나만의 프롬프트 관리 프로그램\n프롬프트를 카테고리로 나눠요: 텍스트 지시문 · 이미지 키워드 · 페르소나\n파이썬으로 만들어야 해요\n제출은 11월 8일까지\n";

test("build — 1단계 칸에서 만드는 것 · 쓰는 사람 · 크기를 옮기고(출처 칩), 받은 글에서 이미 정해진 것(언어 · 기한) · 재료(묶음)를 줄로 찾아 옮기고, 성공 · 다룰 정보 · 밖으로는 2단계 전이면 빈칸", () => {
  const c = B.build({ results: { 0: r0 }, source: SRC });
  assert.deepEqual(B.FIELDS.map((f) => f.key), ["what", "who", "size", "fixed", "materials", "data", "out", "success"]);
  assert.equal(c.what.text, "신청이 한곳에 모이고 마감 전에 알림이 가요 — 동아리 행사 신청을 종이로 받아서 헷갈려요"); assert.deepEqual(c.what.from, [{ s: 0, i: 1 }, { s: 0, i: 0 }]); assert.equal(c.what.blank, false);
  assert.equal(c.who.text, "동아리 운영진 3명과 회원 40명"); assert.deepEqual(c.who.from, [{ s: 0, i: 2 }]);
  assert.equal(c.size.text, "크기: 보통 — 신청 받기와 알림");
  assert.deepEqual(c.fixed.lines, [{ text: "파이썬으로 만들어야 해요", line: 3 }, { text: "제출은 11월 8일까지", line: 4 }], "받은 글의 '~로 만들어야' · 기한 줄 — 줄 번호로 가리킨다");
  assert.deepEqual(c.materials.lines, [{ text: "프롬프트를 카테고리로 나눠요: 텍스트 지시문 · 이미지 키워드 · 페르소나", line: 2 }], "셋 이상 묶인 줄은 재료");
  assert.equal(c.success.blank, true); assert.equal(c.success.text, ""); assert.equal(c.data.blank, true); assert.equal(c.out.blank, true);
  assert.equal(B.build({ results: {}, source: "" }).what.blank, true, "아무것도 없으면 빈칸 — 지어내지 않는다");
});

test("build — 2단계 결과가 있으면 성공(숫자가 있을 때만) · 다룰 정보 · 밖으로를 옮긴다, '아직 모름'은 빈칸 + 막히는 것 한 줄 자리", () => {
  const r1 = { items: N.criteriaFor(1, "Xpress").map((c, i) => ({ name: c.text, lines: [["빈칸", "언제 성공: 신청 40건이 한곳에 모이면 · 3초 안", "한 문장", "남의 정보: 회원 이름 · 밖으로: 알림 서비스"][i]] })) };
  const c = B.build({ results: { 0: r0, 1: r1 }, source: SRC });
  assert.equal(c.success.blank, false); assert.match(c.success.text, /40건/); assert.deepEqual(c.success.from, [{ s: 1, i: 1 }]);
  assert.equal(c.data.text, "남의 정보: 회원 이름 · 밖으로: 알림 서비스"); assert.equal(c.out.blank, false);
  const u = B.build({ results: { 0: r0, 1: { items: r1.items.map((x, i) => (i === 1 ? { ...x, lines: ["언제 성공: 아직 모름"] } : x)) } }, source: SRC });
  assert.equal(u.success.blank, true); assert.equal(u.success.note, "아직 모름 — 무엇이 막히는지 한 줄 적어요");
});

test("withEdits · toMarkdown — 사람이 채운 칸은 '직접'으로 남고 옮긴 칸을 덮지 않는다, docs/기준.md는 칸마다 출처(옮겨 옴 — 1단계 Ⅱ · 받은 글 3줄)와 빈칸 표시", () => {
  const c = B.withEdits(B.build({ results: { 0: r0 }, source: SRC }), { success: "신청 40건이 한곳에 모이면" });
  assert.equal(c.success.text, "신청 40건이 한곳에 모이면"); assert.equal(c.success.by, "me"); assert.equal(c.success.blank, false); assert.equal(c.who.by, "moved");
  const md = B.toMarkdown(c, "동아리 앱");
  assert.match(md, /^# 이 프로젝트의 기준 — 동아리 앱/); assert.match(md, /\| 쓰는 사람 \| 동아리 운영진 3명과 회원 40명 \| 옮겨 옴 — 1단계 Ⅲ \|/);
  assert.match(md, /\| 이미 정해진 것 \| 파이썬으로 만들어야 해요 \(3줄\) · 제출은 11월 8일까지 \(4줄\) \| 옮겨 옴 — 받은 글 \|/);
  assert.match(md, /\| 성공 \| 신청 40건이 한곳에 모이면 \| 직접 \|/); assert.match(md, /\| 다룰 정보 \| \(비었어요\) \| — \|/);
  assert.ok(!B.toMarkdown(B.build({ results: {}, source: "" })).includes("undefined"));
});
