// claude-drafted: 2026-10-14 — 사용자 요청("동아리 행사 등록 앱 가상 프로젝트로, 설계도 루프는 준비 중",
// "CouCou UX를 더 가져오고, 비개발자가 알아듣는 쉬운 말로")으로 Claude가 썼다.
// Navigator 규칙 — 단계 데이터와 판정 규칙. 서버·DB 없이 순수 함수만. 화면(index.html)과 서버(server.js)가 같이 쓴다.
// 단계 표는 requirements.md 1절, 할 일은 gates.md DoD·checklist.md를 쉬운 말로 줄인 것 — **임시**.
// 판정 규칙·프롬프트의 확정본은 이슈 #7(이재엽). 확정되면 이 파일의 STAGES와 프롬프트만 바꾼다.
//
// 쉬운 말 규칙: 화면에 크게 보이는 말(title·short·gets·does·gives·criteria[].text)에는 전문 용어를 쓰지 않는다.
// 전문 용어는 criteria[].term에만 두고 작게 보인다 — 배우고 싶은 사람만 본다. navigator.test.js가 확인한다.
(function (root) {
  const c = (text, term) => ({ text, term: term || "" });
  const STAGES = [
    { n: 0, name: "원문제", title: "무엇을 만들지 정하기", short: "정하기",
      gets: "만들고 싶은 것", does: "어떤 불편을, 누구를 위해 풀지 정해요", gives: "한 문장으로 된 목표",
      criteria: [c("어떤 불편을 풀고 싶은지 한 문장으로 쓰기"), c("다 만들면 무엇이 달라지는지 쓰기"),
        c("누가 쓰는지 쓰기"), c("얼마나 크게 만들지 정하기", "규모 등급")] },
    { n: 1, name: "문제 저장", title: "아이디어 적어 두기", short: "적어 두기",
      gets: "한 문장 목표", does: "빈칸을 질문으로 하나씩 채워요", gives: "정리된 아이디어",
      criteria: [c("정해진 빈칸에 아이디어 채우기", "의도명세 캔버스"), c("왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기"),
        c("한 문장에 한 가지 일만, 애매한 말 없이 쓰기"), c("자세한 기획서로 키울지 직접 정하기 (큰 프로젝트만)", "PRD")] },
    { n: 2, name: "문제 분석", title: "꼭 필요한 기능 정리하기", short: "기능 정리",
      gets: "정리된 아이디어", does: "기능을 문장으로 쓰고, 숫자로 정하고, 순서를 매겨요", gives: "꼭 필요한 기능 목록",
      criteria: [c("기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", "EARS"), c("'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')", "Planguage"),
        c("기능마다 꼭 필요한지, 있으면 좋은지 표시하기", "MoSCoW·Kano"), c("기능마다 어디서 나온 생각인지 표로 잇기 (기능이 5개 이상일 때)", "추적표 RTM")] },
    { n: 3, name: "패턴 분석", title: "만드는 방법 고르기", short: "방법 고르기",
      gets: "기능 목록", does: "만드는 방법을 비교해서 하나 골라요", gives: "고른 방법과 그 이유",
      criteria: [c("만드는 방법 후보를 2개 이상 찾기"), c("후보끼리 좋은 점과 아쉬운 점 비교하기", "트레이드오프"),
        c("고른 방법을 기록으로 남기기", "ADR"), c("왜 골랐는지 한 줄 쓰기")] },
    { n: 4, name: "패턴 구현", title: "뼈대 먼저 이어 보기", short: "뼈대",
      gets: "고른 방법", does: "가장 단순한 흐름부터 처음부터 끝까지 이어 봐요", gives: "돌아가는 뼈대, 할 일 목록",
      criteria: [c("가장 단순한 흐름을 처음부터 끝까지 이어 보기", "Walking Skeleton"), c("이어진 게 실제로 도는지 확인하기", "스모크 테스트"),
        c("남은 일을 작은 할 일로 나누기", "작업 분해")] },
    { n: 5, name: "구현", title: "하나씩 만들고 확인하기", short: "만들기",
      gets: "뼈대와 할 일 목록", does: "확인 방법을 먼저 정하고 하나씩 만들어요", gives: "확인을 통과한 기능",
      criteria: [c("확인 방법을 먼저 정하고 만들기", "TDD"), c("작은 부분마다 확인 통과하기", "단위 테스트"),
        c("쓰는 사람 입장의 시나리오대로 돌려 보기", "수용 테스트")] },
    { n: 6, name: "서비스", title: "실제로 써 보고 재 보기", short: "재 보기",
      gets: "완성된 기능", does: "정해 둔 숫자를 실제로 재 봐요", gives: "잰 결과 기록",
      criteria: [c("2단계에서 정한 숫자를 실제로 재 보기"), c("잰 값과 못 한 것 적어 두기", "검증 기록")] },
    { n: 7, name: "유지보수", title: "돌아보고 배운 것 남기기", short: "돌아보기",
      gets: "잰 결과", does: "돌아보고 배운 것을 남겨요", gives: "다음에 쓸 배움",
      criteria: [c("잘된 점과 아쉬운 점 돌아보기", "회고"), c("'왜?'를 다섯 번 물어 진짜 원인 찾기", "5 Whys"),
        c("배운 것을 다음에 쓸 수 있게 남기기", "체크리스트·지식 창고")] },
  ];

  // 화면에 크게 보이면 안 되는 말 — 비개발자가 모르는 말. term 칸에만 둔다.
  const JARGON = ["EARS", "MoSCoW", "Kano", "ADR", "TDD", "RTM", "PRD", "Planguage", "Skeleton", "스모크", "게이트", "판정",
    "Recycle", "DoD", "요구사항", "명세", "트레이드오프", "회고", "Whys"];

  // FR-4·5: 할 일을 다 하고 "이해했어요(예)"가 있어야만 다음 단계로 간다.
  const canAdvance = (met, understood) => met.length > 0 && met.every(Boolean) && understood === "yes";

  // FR-12: 순서는 사용자가 정한다. 원본을 바꾸지 않는다.
  function reorder(list, i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list.slice();
    const out = list.slice();
    [out[i], out[j]] = [out[j], out[i]];
    return out;
  }

  // 옆자리 동료의 접힘·펼침 (CouCou의 IslandStateMachine을 따른 것 — 코드·자산은 가져오지 않았다).
  //   hidden(가는 띠) → 마우스 올림 → petit(한 줄) → 누름 → home(펼침)
  //   마우스가 떠나고 시간이 지나면(idle) 한 칸씩 접힌다. 답을 기다리는 중(pinned)이면 접히지 않는다.
  //   greet(시작 인사)는 잠깐 보이고 한 줄로 접힌다. alert(알릴 일)는 어디서든 펼친다.
  function nextView(view, ev, pinned) {
    if (ev === "alert") return "home";
    if (ev === "enter") return view === "hidden" ? "petit" : view;
    if (ev === "click") return view === "petit" || view === "greet" ? "home" : view;
    if (ev === "esc") return view === "home" || view === "greet" ? "petit" : view;
    if (ev === "idle") {
      if (pinned) return view === "hidden" ? "petit" : view;
      return { greet: "petit", home: "petit", petit: "hidden" }[view] || view;
    }
    return view;
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

  const stageTable = () => STAGES.map((s) => `${s.n}단계 ${s.title}: ${s.does}. 할 일: ${s.criteria.map((x, i) => `(${i + 1}) ${x.text}${x.term ? ` [${x.term}]` : ""}`).join(" ")}`).join("\n");

  const PLAIN = [
    "- 읽는 사람은 개발을 모르는 사람이다. 중학생도 알아듣는 말로, '~해요' 말투로 짧게 쓴다.",
    "- 전문 용어와 영어 약어를 쓰지 않는다. 꼭 필요하면 쉬운 말을 먼저 쓰고 괄호 안에 용어를 넣는다.",
    "- 사용자의 작업 내용에 나온 말을 예로 든다.",
  ].join("\n");

  function judgePrompt(text) {
    return [
      "너는 앱을 만드는 사람 옆에서 길을 알려 주는 동료다. 아래 0~7단계로 사용자가 지금 어디쯤인지 알려 준다.",
      stageTable(),
      "",
      "규칙:",
      "- 작업 내용에 적힌 것만 근거로 쓴다. 적혀 있지 않으면 met=false이고 evidence는 빈 문자열이다. 지어내지 않는다.",
      "- evidence는 작업 내용에서 그대로 따온 짧은 구절이다.",
      "- criteria는 고른 단계의 할 일과 같은 개수, 같은 순서로 낸다.",
      "- next는 아직 안 한 일 중 가장 먼저 할 하나다. 모두 했으면 다음 단계로 넘어가기 전 확인을 해 보자고 안내한다.",
      "- next.what은 20자 안팎의 짧은 할 일 이름이다(예: '빠르게'를 숫자로 바꾸기). 설명은 why, 방법은 action에 쓴다.",
      "- decision은 사용자가 고를 선택지 A/B/C 한 줄이다. 고르는 건 사용자다.",
      PLAIN,
      "",
      "<작업내용>",
      String(text),
      "</작업내용>",
    ].join("\n");
  }

  function answerPrompt(stage, hard, question, text) {
    const s = STAGES[stage];
    return [
      `너는 앱을 만드는 사람 옆에서 길을 알려 주는 동료다. 사용자가 ${s.n}단계 "${s.title}"(${s.does})를 마치고 "잘 모르겠다"고 했다.`,
      `헷갈린 부분: ${hard.join(", ") || "(고르지 않음)"}`,
      "다섯 문장 이내로 답한다. 모르면 모른다고 한다.",
      PLAIN,
      "<작업내용>", String(text), "</작업내용>",
      "<질문>", String(question), "</질문>",
    ].join("\n");
  }

  // Claude 응답은 믿지 않는다 — 모양이 맞을 때만 쓰고, 아니면 null("살펴보지 못함"). 할 일 문장은 우리 데이터로 덮는다.
  function parseJudgement(o) {
    if (!o || typeof o !== "object") return null;
    const s = STAGES[o.stage];
    if (!Number.isInteger(o.stage) || !s) return null;
    if (!Array.isArray(o.criteria) || o.criteria.length !== s.criteria.length) return null;
    if (o.criteria.some((x) => !x || typeof x.met !== "boolean")) return null;
    const n = o.next || {};
    if (typeof o.reason !== "string" || !o.reason.trim()) return null;
    if (!["what", "why", "decision", "action"].every((k) => typeof n[k] === "string" && n[k].trim())) return null;
    return {
      stage: o.stage, reason: o.reason,
      criteria: s.criteria.map((x, i) => ({ text: x.text, term: x.term, met: o.criteria[i].met, evidence: String(o.criteria[i].evidence || "") })),
      next: { what: n.what, why: n.why, decision: n.decision, action: n.action },
    };
  }

  const api = { STAGES, JARGON, canAdvance, reorder, nextView, JUDGE_SCHEMA, ANSWER_SCHEMA, judgePrompt, answerPrompt, parseJudgement };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavRules = api;
})(typeof window !== "undefined" ? window : globalThis);
