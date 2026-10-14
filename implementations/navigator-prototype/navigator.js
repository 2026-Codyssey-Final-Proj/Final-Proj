// claude-drafted: 2026-10-14 — 사용자 요청("동아리 행사 등록 앱 가상 프로젝트로, 설계도 루프는 준비 중")으로 Claude가 썼다.
// Navigator 규칙 — 단계 데이터와 판정 규칙. 서버·DB 없이 순수 함수만. 화면(index.html)과 서버(server.js)가 같이 쓴다.
// 단계 표는 requirements.md 1절, 완료 기준은 gates.md DoD·checklist.md를 쉬운 말로 줄인 것 — **임시**.
// 판정 규칙·프롬프트의 확정본은 이슈 #7(이재엽). 확정되면 이 파일의 STAGES와 judgePrompt만 바꾼다.
(function (root) {
  const STAGES = [
    { n: 0, name: "원문제", gets: "만들고 싶은 것", does: "문제·원하는 결과·쓰는 사람을 묻고 규모를 정한다", gives: "한 문장 정의, 규모(등급)",
      criteria: ["문제를 한 문장으로", "원하는 결과", "쓰는 사람(적용 대상)", "규모 정하기(즉시 처리·Lite·Xpress·Full)"] },
    { n: 1, name: "문제 저장", gets: "0단계 정의", does: "빈칸을 되물어 채운다", gives: "저장된 문제 필드",
      criteria: ["의도명세 캔버스 채우기", "동기·범위·성공 기준 질문에 답하기", "모호한 말 없이 문장당 동작 하나", "PRD로 넓힐지 직접 답하기(Full 등급만)"] },
    { n: 2, name: "문제 분석", gets: "1단계 필드", does: "요구를 문장으로 쓰고 숫자로 확정하고 우선순위를 매긴다", gives: "확정 요구 목록",
      criteria: ["기능 요구를 EARS 문장으로", "모호한 값을 숫자로(또는 '미정'으로)", "요구마다 우선순위(MoSCoW×Kano)", "요구 5개 이상이면 출처 추적표"] },
    { n: 3, name: "패턴 분석", gets: "확정 요구", does: "구조 후보를 찾아 비교하고 결정을 남긴다", gives: "설계 결정(ADR)",
      criteria: ["구조 후보 2개 이상 찾기", "후보끼리 장단점 비교", "결정을 ADR로 남기기", "고른 이유 한 줄"] },
    { n: 4, name: "패턴 구현", gets: "설계 결정", does: "가장 얇은 흐름을 처음부터 끝까지 잇는다", gives: "연결된 최소 흐름, 작업 목록",
      criteria: ["가장 얇은 흐름을 처음부터 끝까지 연결", "연결 확인 테스트(스모크) 통과", "작업 목록으로 쪼개기"] },
    { n: 5, name: "구현", gets: "스켈레톤·작업 목록", does: "테스트를 먼저 쓰고 구현한다", gives: "테스트 통과 코드",
      criteria: ["테스트 먼저 쓰고 구현", "단위 테스트 통과", "수용 테스트 실행"] },
    { n: 6, name: "서비스", gets: "통과한 구현", does: "2단계 목표 수치를 실제로 잰다", gives: "검증 기록",
      criteria: ["2단계 목표 수치를 실제로 재기", "잰 값과 못 한 것 기록"] },
    { n: 7, name: "유지보수", gets: "검증 기록", does: "회고하고 배운 것을 반영한다", gives: "역량·노력 기록",
      criteria: ["회고 쓰기", "5 Whys로 근본 원인 찾기", "배운 것을 체크리스트·지식 창고에 반영"] },
  ];

  // FR-4·5: 완료 기준을 모두 채우고 "이해했다(예)"가 있어야만 다음 단계로 간다.
  const canAdvance = (met, understood) => met.length > 0 && met.every(Boolean) && understood === "yes";

  // FR-12: 순서는 사용자가 정한다. 원본을 바꾸지 않는다.
  function reorder(list, i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list.slice();
    const out = list.slice();
    [out[i], out[j]] = [out[j], out[i]];
    return out;
  }

  const str = { type: "string", minLength: 1 };
  const JUDGE_SCHEMA = {
    type: "object", required: ["stage", "reason", "criteria", "next"],
    properties: {
      stage: { type: "integer", minimum: 0, maximum: 7 },
      reason: str,
      criteria: { type: "array", items: { type: "object", required: ["met", "evidence"], properties: { met: { type: "boolean" }, evidence: { type: "string" } } } },
      next: { type: "object", required: ["what", "why", "decision", "action"], properties: { what: str, why: str, decision: str, action: str } },
    },
  };
  const ANSWER_SCHEMA = { type: "object", required: ["answer"], properties: { answer: str } };

  const stageTable = () => STAGES.map((s) => `${s.n} ${s.name}: ${s.does}. 완료 기준: ${s.criteria.map((c, i) => `(${i + 1}) ${c}`).join(" ")}`).join("\n");

  function judgePrompt(text) {
    return [
      "너는 바이브 코딩하는 사람을 돕는 안내자다. 아래 0~7단계 워크 프로세스로 사용자의 작업 내용을 판정한다.",
      stageTable(),
      "",
      "규칙:",
      "- 작업 내용에 적힌 것만 근거로 쓴다. 적혀 있지 않으면 met=false이고 evidence는 빈 문자열이다. 지어내지 않는다.",
      "- criteria는 고른 단계의 완료 기준과 같은 개수, 같은 순서로 낸다.",
      "- next는 아직 안 된 기준 중 가장 먼저 할 하나다. 모두 됐으면 게이트를 열라고 안내한다.",
      "- decision은 사용자가 고를 선택지 A/B/C 한 줄이다. 고르는 건 사용자다.",
      "- 비개발자가 읽는다. 쉬운 한국어로, 영어 약어는 풀어 쓴다.",
      "",
      "<작업내용>",
      String(text),
      "</작업내용>",
    ].join("\n");
  }

  function answerPrompt(stage, hard, question, text) {
    const s = STAGES[stage];
    return [
      `너는 바이브 코딩하는 사람을 돕는 안내자다. 사용자가 ${s.n}단계 ${s.name}(${s.does})의 게이트에서 "이해 못 했다"고 했다.`,
      `어려운 부분: ${hard.join(", ") || "(고르지 않음)"}`,
      "사용자의 작업 내용을 예로 들어 다섯 문장 이내, 쉬운 한국어로 답한다. 모르면 모른다고 한다.",
      "<작업내용>", String(text), "</작업내용>",
      "<질문>", String(question), "</질문>",
    ].join("\n");
  }

  // Claude 응답은 믿지 않는다 — 모양이 맞을 때만 쓰고, 아니면 null("판정 못 함"). 기준 문장은 우리 데이터로 덮는다.
  function parseJudgement(o) {
    if (!o || typeof o !== "object") return null;
    const s = STAGES[o.stage];
    if (!Number.isInteger(o.stage) || !s) return null;
    if (!Array.isArray(o.criteria) || o.criteria.length !== s.criteria.length) return null;
    if (o.criteria.some((c) => !c || typeof c.met !== "boolean")) return null;
    const n = o.next || {};
    if (typeof o.reason !== "string" || !o.reason.trim()) return null;
    if (!["what", "why", "decision", "action"].every((k) => typeof n[k] === "string" && n[k].trim())) return null;
    return {
      stage: o.stage, reason: o.reason,
      criteria: s.criteria.map((text, i) => ({ text, met: o.criteria[i].met, evidence: String(o.criteria[i].evidence || "") })),
      next: { what: n.what, why: n.why, decision: n.decision, action: n.action },
    };
  }

  const api = { STAGES, canAdvance, reorder, JUDGE_SCHEMA, ANSWER_SCHEMA, judgePrompt, answerPrompt, parseJudgement };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavRules = api;
})(typeof window !== "undefined" ? window : globalThis);
