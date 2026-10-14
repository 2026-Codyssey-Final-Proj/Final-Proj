// claude-drafted: 2026-10-14
// 시연용 가상 시나리오 (FR-10) — "동아리 행사 등록 앱"을 만드는 가상의 사용자. 실제 사람·서비스가 아니다.
// 서버(server.js)가 꺼져 있을 때 이 미리 만든 응답으로 움직인다. 여기 없는 입력은 판정하지 않는다(지어내지 않는다).
(function (root) {
  const PROJECT = "동아리 행사 등록 앱";

  const BEFORE = [
    "동아리 행사 등록 앱을 만들고 있다. 회원이 행사를 보고 신청하는 앱이다.",
    "요구사항을 EARS 문장 6개로 썼다. 예) '회원이 신청 버튼을 누르면, 시스템은 신청서를 보여 준다.'",
    "'등록은 빠르게 끝나야 한다'는 아직 숫자가 없다. 우선순위는 아직 안 정했다.",
  ].join("\n");

  const AFTER = [
    BEFORE.split("\n").slice(0, 2).join("\n"),
    "'등록은 빠르게'를 '신청서를 연 뒤 30초 안에 제출'로 숫자를 정했다.",
    "요구 6개에 MoSCoW와 Kano를 붙였다. 행사 신청 Must·기본, 마감 알림 Should·만족.",
    "요구마다 출처(동아리장 인터뷰 응답자 A)를 표로 이었다.",
  ].join("\n");

  const examples = [
    { label: "예시 1 — 보완 전", text: BEFORE, judgement: {
      stage: 2, reason: "요구를 EARS 문장으로 쓰기 시작했고 아직 숫자·우선순위가 없어 2단계 문제 분석 중이다.",
      criteria: [
        { met: true, evidence: "EARS 문장 6개로 썼다" },
        { met: false, evidence: "" },
        { met: false, evidence: "" },
        { met: false, evidence: "" },
      ],
      next: {
        what: "'등록은 빠르게'를 숫자로 바꾸기",
        why: "'빠르게'는 사람마다 달라서 나중에 됐는지 확인할 수 없다",
        decision: "A 신청서를 연 뒤 30초 안에 / B 버튼 3번 안에 / C 미정으로 두고 인터뷰 뒤 정하기",
        action: "고른 값을 요구 문장에 적고 다시 판정 받기",
      } } },
    { label: "예시 2 — 보완 후", text: AFTER, judgement: {
      stage: 2, reason: "숫자·우선순위·출처 표까지 채워 2단계 완료 기준을 모두 충족했다.",
      criteria: [
        { met: true, evidence: "EARS 문장 6개" },
        { met: true, evidence: "30초 안에 제출" },
        { met: true, evidence: "MoSCoW와 Kano를 붙였다" },
        { met: true, evidence: "출처를 표로 이었다" },
      ],
      next: {
        what: "게이트를 열어 2단계 마무리하기",
        why: "완료 기준 4개가 모두 채워졌다",
        decision: "행사 신청은 누가 승인하나요? A 동아리장만 / B 임원 누구나 / C 승인 없이 바로",
        action: "게이트 열기를 누르고 이해 확인에 답하기",
      } } },
  ];

  // "아니요" 뒤 질문에 대한 미리 만든 답 — 단계 2의 완료 기준 순서와 같다.
  const answers = {
    2: [
      "EARS는 요구를 '언제 + 시스템은 + 무엇을 한다' 틀로 쓰는 방법이에요. 예) '회원이 신청 버튼을 누르면, 시스템은 신청서를 보여 준다.' 틀이 정해져 있어서 빠진 조건이 눈에 보여요.",
      "'빠르게'는 사람마다 달라서 됐는지 확인할 수 없어요. '30초 안에 제출'처럼 숫자로 쓰면 6단계에서 실제로 재 볼 수 있어요. 아직 모르면 '미정'과 언제 정할지를 적어요.",
      "MoSCoW는 꼭 필요한가(Must)부터 이번엔 안 하는가(Won't)까지 나누고, Kano는 '없으면 불만인가, 있으면 기쁜가'로 나눠요. 행사 신청은 없으면 앱이 안 되니 Must·기본, 마감 알림은 Should·만족이에요.",
      "출처 추적표는 요구마다 '어디서 나왔고(인터뷰) → 어디서 설계되고 → 어떤 테스트로 확인하는지'를 한 줄로 잇는 표예요. 요구가 늘어도 빠진 게 바로 보여요.",
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
