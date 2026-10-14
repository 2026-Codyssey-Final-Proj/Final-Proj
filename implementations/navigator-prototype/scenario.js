// claude-drafted: 2026-10-14
// 시연용 연습 예시 (FR-10) — "동아리 행사 등록 앱"을 만드는 가상의 사용자. 실제 사람·서비스가 아니다.
// 서버(server.js)가 꺼져 있을 때 이 미리 만든 응답으로 움직인다. 여기 없는 입력은 살펴보지 않는다(지어내지 않는다).
(function (root) {
  const PROJECT = "동아리 행사 등록 앱";

  const BEFORE = [
    "동아리 행사 등록 앱을 만들고 있어요. 회원이 행사를 보고 신청하는 앱이에요.",
    "필요한 기능을 6개 문장으로 썼어요. 예) '회원이 신청 버튼을 누르면, 앱은 신청서를 보여 준다.'",
    "'등록은 빠르게 끝나야 한다'는 아직 얼마나 빨라야 하는지 정하지 않았어요. 무엇부터 만들지도 아직 안 정했어요.",
  ].join("\n");

  const AFTER = [
    BEFORE.split("\n").slice(0, 2).join("\n"),
    "'빠르게'는 '신청서를 연 뒤 30초 안에 제출'로 정했어요.",
    "6개 기능마다 꼭 필요한지 표시했어요. 행사 신청은 꼭 필요, 마감 알림은 있으면 좋음.",
    "기능마다 어디서 나온 생각인지(동아리장 응답자 A와 나눈 이야기) 표로 이었어요.",
  ].join("\n");

  const examples = [
    { label: "연습 1 · 하는 중", text: BEFORE, judgement: {
      stage: 2, reason: "기능을 문장으로 쓰기 시작했어요. 아직 숫자와 순서가 없어서 2단계를 하는 중이에요.",
      criteria: [
        { met: true, evidence: "필요한 기능을 6개 문장으로 썼어요" },
        { met: false, evidence: "" },
        { met: false, evidence: "" },
        { met: false, evidence: "" },
      ],
      next: {
        what: "'빠르게'를 숫자로 바꾸기",
        why: "'빠르게'는 사람마다 생각이 달라서, 다 만든 뒤에 됐는지 안 됐는지 알 수 없어요",
        decision: "A 신청서를 연 뒤 30초 안에 / B 버튼 3번 안에 / C '아직 모름'으로 두고 회원에게 물어본 뒤 정하기",
        action: "하나를 골라 그 기능 문장에 적고, 다시 보여 주세요",
      } } },
    { label: "연습 2 · 다 했어요", text: AFTER, judgement: {
      stage: 2, reason: "숫자, 순서, 출처 표까지 채워서 2단계에서 할 일을 모두 했어요.",
      criteria: [
        { met: true, evidence: "필요한 기능을 6개 문장으로 썼어요" },
        { met: true, evidence: "30초 안에 제출" },
        { met: true, evidence: "꼭 필요한지 표시했어요" },
        { met: true, evidence: "표로 이었어요" },
      ],
      next: {
        what: "다음 단계로 넘어가기 전에 함께 확인하기",
        why: "2단계에서 할 일 4개를 모두 했어요",
        decision: "행사 신청은 누가 승인하나요? A 동아리장만 / B 임원 누구나 / C 승인 없이 바로",
        action: "'다음 단계로 넘어가기'를 누르고, 이해했는지 답해 주세요",
      } } },
  ];

  // "잘 모르겠어요" 뒤 질문에 대한 미리 만든 답 — 2단계 할 일 순서와 같다.
  const answers = {
    2: [
      "기능을 '언제 → 앱은 무엇을 한다' 틀에 맞춰 쓰는 거예요. 예) '회원이 신청 버튼을 누르면, 앱은 신청서를 보여 준다.' 틀이 있으면 빠진 조건이 바로 보여요.",
      "'빠르게'는 사람마다 생각이 달라서 됐는지 확인할 수 없어요. '30초 안에 제출'처럼 숫자로 쓰면 나중에 실제로 재 볼 수 있어요. 아직 모르면 '아직 모름'과 언제 정할지를 적어요.",
      "기능마다 '없으면 앱이 안 되나?'와 '있으면 더 좋은가?'를 물어보는 거예요. 행사 신청은 없으면 앱이 안 되니 '꼭 필요', 마감 알림은 '있으면 좋음'이에요. 꼭 필요한 것부터 만들면 시간이 모자라도 앱이 돌아가요.",
      "기능마다 '이 생각이 어디서 나왔지?'를 한 줄로 적는 표예요. 예) 마감 알림 ← 동아리장과 나눈 이야기. 나중에 기능이 늘어도 왜 만드는지 잊지 않아요.",
    ],
  };

  const judgeFixture = (text) => {
    const ex = examples.find((e) => e.text.trim() === String(text).trim());
    return ex ? ex.judgement : null;
  };

  const api = { PROJECT, examples, answers, judgeFixture };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavScenario = api;
})(typeof window !== "undefined" ? window : globalThis);
