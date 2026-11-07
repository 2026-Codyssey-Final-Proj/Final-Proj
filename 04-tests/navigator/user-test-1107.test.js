// claude-drafted: 2026-11-07 — 사용자 시험 셋째(F-166)의 '플로로의 말' 넷(14 · 15 · 16 · 17). 규칙은 함수로, 화면은 글자로 본다.
// 실행: node --test 04-tests/navigator/user-test-1107.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const N = require("../../03-backend/navigator/navigator.js");
const app = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");

test("F-166-14 단계 초안을 곧 받는 장의 '받기 전' 카드는 채팅에 지난 말로 남지 않는다(passing)", () => {
  assert.match(app, /passing: q\.chap >= 1 && st\.mode === "live" && canLive && !q\.draft \};/);
});

test("F-166-15 같이 풀기 · 자유 대화 프롬프트에 Floe의 만드는 크기(짧음 · 보통 · 긺과 단계마다 할 일 수)", () => {
  const a = JSON.stringify(N.answerPrompt(0, ["크기"], "짧음이랑 보통은 뭐가 달라요?", "작업"));
  assert.match(a, /짧음 · 보통 · 긺 셋이다/); assert.match(a, /짧음: 1 ~ 8단계 할 일 [\d · ]+개/);
  const lite = N.STAGES.map((s, n) => N.criteriaFor(n, "Lite").length).join(" · ");
  assert.ok(a.includes(`짧음: 1 ~ 8단계 할 일 ${lite}개`), "할 일 수는 실제 목록에서 센다");
  assert.match(JSON.stringify(N.chatPrompt(0, "Lite", { talk: [{ who: "me", text: "크기가 뭐예요?" }] })), /만드는 크기/);
});

test("F-166-16 애매한 말 — 숫자가 없을 때만, 낱말 단위로", () => {
  assert.deepEqual(N.vagueIn("총무가 회비 낸 사람을 빨리 확인할 수 있어요"), ["빨리"]);
  assert.deepEqual(N.vagueIn("10초 안에 빨리"), [], "숫자가 있으면 묻지 않는다");
  assert.deepEqual(N.vagueIn("곧바로 보여요"), [], "다른 낱말의 일부는 아니다");
  assert.deepEqual(N.vagueIn(""), []);
  assert.match(app, /if \(vw\.length && !vagueAsked\.has\(at\)\) \{ vagueAsked\.add\(at\); st\.fillWarn = \{ t, w: vw, vague: true \}; render\(\); return; \}/, "같은 칸은 한 번만(FR-12)");
  assert.match(app, /title: "숫자로 바꿔 볼까요\?"/); assert.match(app, /label: "숫자로 고칠게요", act: "fill-fix"/);
});

test("F-166-17 훅 알림의 사용자 말이 Floe가 맡긴 글이면 요구 문장만 — 보고하는 법(내부 지시)은 빼고", () => {
  const brief = N.taskBrief("단계 문서를 커밋하고 푸시해 주세요.", ["커밋했다", "푸시했다"]);
  assert.match(brief, /ask에 한 문장/, "맡기는 글에는 내부 지시가 있다");
  assert.equal(N.briefHead(brief), "Floe가 맡긴 일: 단계 문서를 커밋하고 푸시해 주세요.");
  assert.equal(N.briefHead("그냥 한 질문"), "그냥 한 질문", "사람이 친 말은 그대로");
  const server = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/server.js"), "utf8");
  assert.match(server, /\["사용자", typeof body\.prompt === "string" \? Nav\.briefHead\(body\.prompt\) : body\.prompt\]/);
});
