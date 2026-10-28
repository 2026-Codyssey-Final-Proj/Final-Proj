// claude-drafted: 2026-10-28 — C-56 R-4 이미 있는 내용 옮겨 적기(이재엽 "이미 있는 내용이라면 어떤식으로 작성할지", 버튼 "'옮김' 새 값"): 작업 폴더의 글 파일에서 그 칸의 답 후보 줄을 찾아 원문(파일 · 줄)과 함께 보인다 —
//   사람이 고르면 그 줄 그대로 '옮김'. 원문끼리 다르면 여럿을 보여 고르게, 원문에 없는 숫자 · 사람 · 날짜는 만들지 않는다(줄 그대로). 순수 함수 — 코드보다 먼저 썼다(code.md 1번)
// 실행: node --test 04-tests/navigator/findlines.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const F = require("../../03-backend/navigator/findlines.js");

const FILES = [
  { path: "README.md", text: "# 프롬프트 관리\n\n프롬프트를 카테고리로 나눠요: 텍스트 지시문 · 이미지 키워드 · 페르소나\n파이썬으로 만들어요\n" },
  { path: "docs/02-plan/plan.md", text: "## 기능\n\n- 프롬프트 저장 · 불러오기 · 카테고리 고르기\n- 마감 하루 전 알림\n\n## 언제 성공\n\n신청 40건이 한곳에 모이면\n" },
  { path: "src/app.js", text: "// 카테고리 셋\nconst CATS = ['텍스트', '이미지', '페르소나'];\n" },
  { path: "notes.txt", text: "x".repeat(300) + "\n" },
];

test("keywordsOf — 할 일 이름 · 묻는 말에서 뜻 있는 말만(두 글자 이상, '쓰기 · 적기 · 정하기' 같은 틀 말은 빼고)", () => {
  assert.deepEqual(F.keywordsOf("기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", "어떤 기능이 있나요?"), ["기능", "문장"]);
  assert.deepEqual(F.keywordsOf("프롬프트 카테고리 나누기", ""), ["프롬프트", "카테고리", "나누기"]);
  assert.deepEqual(F.keywordsOf("", ""), []);
});

test("find — 글 파일의 줄마다 낱말이 겹치는 수로 점수를 매겨 위에서 셋, 파일 · 줄 번호 · 원문 그대로(지어내지 않음), 코드 파일 · 너무 긴 줄 · 제목 줄은 뺀다, 아무것도 없으면 빈 목록", () => {
  const r = F.find(FILES, { name: "프롬프트 카테고리 나누기", ask: "" });
  assert.equal(r.length, 2); assert.deepEqual(r[0], { path: "README.md", line: 3, text: "프롬프트를 카테고리로 나눠요: 텍스트 지시문 · 이미지 키워드 · 페르소나", hits: ["프롬프트", "카테고리"] });
  assert.equal(r[1].path, "docs/02-plan/plan.md"); assert.equal(r[1].line, 3);
  assert.ok(!r.some((x) => x.path === "src/app.js"), "코드 파일은 보지 않는다(문서만)");
  assert.deepEqual(F.find(FILES, { name: "언제 성공인지 숫자로", ask: "" }).map((x) => x.text), ["신청 40건이 한곳에 모이면"], "제목 줄(## 언제 성공)이 아니라 그 아래 글");
  assert.deepEqual(F.find(FILES, { name: "없는 말 찾기", ask: "" }), []);
  assert.equal(F.find(FILES, { name: "x", ask: "" }).length, 0, "한 글자 · 긴 줄은 안 잡힌다");
  assert.ok(F.find(FILES, { name: "프롬프트", ask: "", max: 1 }).length === 1, "max");
});
