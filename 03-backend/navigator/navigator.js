// claude-drafted: 2026-10-14, 2026-10-16(판정 규칙 ①·② — 근거 구절 확인, 지금 단계는 코드가 정함) — 사용자 요청("동아리 행사 등록 앱 가상 프로젝트로, 설계도 루프는 준비 중",
// "CouCou UX를 더 가져오고, 비개발자가 알아듣는 쉬운 말로", "목업으로 구현", "아직 안 된 것도 모두 만들어")으로 Claude가 썼다.
// 설계도(FR-3)는 2026-10-14에 "준비 중"에서 실제 동작으로 바꿨다 — 초안은 AI, 고치기·확정은 사람.
// Navigator 규칙 — 단계 데이터와 판단 규칙. 서버·DB 없이 순수 함수만. 화면(app.js)과 서버(server.js)가 같이 쓴다.
// 단계 표는 requirements.md 1절, 할 일은 gates.md DoD·checklist.md를 쉬운 말로 줄인 것.
//
// STAGES의 할 일: **확정 2026-10-18** — 이재엽 "다 GO"로 #96의 확정 질문 4개를 지금 고른 그대로 받음 [해석, requirements.md 13-1] (이슈 #7, navigator-prototype-rules-review.md 4절의 ③·④). 6단계 2번을 나눌지는 고칠 목록 F-03.
// claude-drafted: 2026-10-18 — 이재엽의 요청(남은 요구사항 작업을 그의 권한으로 진행)으로 Claude가 ③ 빠진 할 일·보안 점검과 ④ 등급별 할 일을 넣었다.
//   출처: gates.md 단계별 DoD·"보안 점검", checklist.md 3단계·4·5단계·"단계별 보안 점검" 체크리스트, scope-tiers.md "등급별로 뭐가 달라지는가".
//   단계마다 할 일은 5개 이하 — 넘치는 것은 합치거나 뺐다(무엇을 왜 뺐는지는 rules-review의 반영 기록).
// 등급(tiers): 그 할 일을 쓰는 등급. 없으면 모든 등급. **Full 목록은 STAGES의 할 일 전부다** — 등급을 보내지 않는 화면도 그대로 맞는다.
//
// 쉬운 말 규칙: 화면에 크게 보이는 말(title·short·gets·does·gives·criteria[].text)에는 전문 용어를 쓰지 않는다.
// 전문 용어는 criteria[].term에만 두고 작게 보인다 — 배우고 싶은 사람만 본다. navigator.test.js가 확인한다.
(function (root) {
  const c = (text, term, tiers) => ({ text, term: term || "", ...(tiers ? { tiers } : {}) });
  const FULL = ["Full"], NOT_LITE = ["Full", "Xpress"];
  const SECRETS = "비밀번호·키 같은 비밀값이 코드와 기록에 남지 않았는지 확인하기";   // checklist.md 보안 점검 4·5단계 — 두 단계 모두 본다
  const STAGES = [
    { n: 0, name: "원문제", title: "무엇을 만들지 정하기", short: "정하기",
      gets: "만들고 싶은 것", does: "어떤 불편을, 누구를 위해 풀지 정해요", gives: "한 문장으로 된 목표",
      criteria: [c("어떤 불편을 풀고 싶은지 한 문장으로 쓰기"), c("다 만들면 무엇이 달라지는지 쓰기"),
        c("누가 쓰는지 쓰기"), c("얼마나 크게 만들지 정하기", "규모 등급")] },
    // Lite는 1단계를 제목과 한 줄로 간단히 한다(scope-tiers.md) — 빈칸 채우기는 Full·Xpress만. 기획서로 키우기는 Full만(gates.md 1단계)
    { n: 1, name: "문제 저장", title: "아이디어 적어 두기", short: "적어 두기",
      gets: "한 문장 목표", does: "빈칸을 질문으로 하나씩 채워요", gives: "정리된 아이디어", doc: "아이디어 정리표",
      criteria: [c("정해진 빈칸에 아이디어 채우기", "의도명세 캔버스", NOT_LITE), c("왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기", "", NOT_LITE),
        c("한 문장에 한 가지 일만, 애매한 말 없이 쓰기"), c("자세한 기획서로 키울지 직접 정하기", "PRD", FULL),
        c("다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기", "보안 점검 — 데이터 종류·외부 전송")] },
    { n: 2, name: "문제 분석", title: "꼭 필요한 기능 정리하기", short: "기능 정리",
      gets: "정리된 아이디어", does: "기능을 문장으로 쓰고, 숫자로 정하고, 순서를 매겨요", gives: "꼭 필요한 기능 목록", doc: "꼭 필요한 기능 목록",
      criteria: [c("기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", "EARS"), c("'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')", "Planguage"),
        c("기능마다 꼭 필요한지, 있으면 좋은지 표시하기", "MoSCoW·Kano"), c("기능마다 어디서 나온 생각인지 표로 잇기 (기능이 5개 이상일 때)", "추적표 RTM"),
        c("막아야 할 일(예: 남의 정보가 밖으로 나감)도 '~하면, 앱은 ~한다'로 쓰기", "보안 점검 — 보안 요구(EARS Unwanted)")] },
    { n: 3, name: "패턴 분석", title: "만드는 방법 고르기", short: "방법 고르기",
      gets: "기능 목록", does: "만드는 방법을 비교해서 하나 골라요", gives: "고른 방법과 그 이유", doc: "방법을 고른 기록",
      criteria: [c("흔히 쓰는 방법 목록에서 먼저 후보를 2개 이상 찾기", "표준 카탈로그(아키텍처 5대 스타일)"),
        c("후보끼리 좋은 점과 아쉬운 점 비교하기", "트레이드오프(ATAM 비교표)"),
        c("고른 방법과 왜 골랐는지 한 줄을 기록으로 남기기", "ADR"),
        c("지키기로 한 원칙(쓸 도구, 하면 안 되는 것, 화면 원칙)과 고른 방법 맞대어 보기", "원칙표 점검·화면 원칙"),
        c("누가 무엇을 볼 수 있는지, 정보를 어디에 둘지도 비교에 넣기", "보안 점검 — 위협·권한·인증·저장 위치")] },
    { n: 4, name: "패턴 구현", title: "뼈대 먼저 이어 보기", short: "뼈대",
      gets: "고른 방법", does: "가장 단순한 흐름부터 처음부터 끝까지 이어 봐요", gives: "돌아가는 뼈대, 할 일 목록", doc: "작은 할 일 목록",
      criteria: [c("가장 단순한 흐름을 처음부터 끝까지 이어 보기", "Walking Skeleton"), c("이어진 게 실제로 도는지 확인하기", "스모크 테스트"),
        c("남은 일을 작은 할 일로 나누기", "작업 분해"), c(SECRETS, "보안 점검 — 비밀값 검사")] },
    // Full만: 막을 일(EARS Unwanted)을 모두 확인하고 일부러 어겨 본다(gates.md 5단계 DoD, checklist.md 4·5단계)
    { n: 5, name: "구현", title: "하나씩 만들고 확인하기", short: "만들기",
      gets: "뼈대와 할 일 목록", does: "확인 방법을 먼저 정하고 하나씩 만들어요", gives: "확인을 통과한 기능",
      criteria: [c("확인 방법을 먼저 정하고 만들기", "TDD"), c("작은 부분마다 확인 통과하기", "단위 테스트"),
        c("쓰는 사람 입장의 시나리오대로 돌려 보기", "수용 테스트"),
        c("막아야 할 일마다 일부러 어겨 보고, 정말 막히는지 확인하기", "EARS Unwanted 전부·위반 시도", FULL),
        c(SECRETS, "보안 점검 — 비밀값 검사")] },
    { n: 6, name: "서비스", title: "실제로 써 보고 재 보기", short: "재 보기",
      gets: "완성된 기능", does: "정해 둔 숫자를 실제로 재 봐요", gives: "잰 결과 기록",
      // F-03(이재엽 2026-10-18 "둘로 나눔"): '잰 값과 못 한 것'은 한 항목에 둘이 묶여 실제 AI와 예시 정답이 갈렸다 — 나눈다
      criteria: [c("2단계에서 정한 숫자를 실제로 재 보기"), c("잰 값을 그대로 적어 두기", "검증 기록 — 잰 값"), c("재지 못한 것을 '아직 못 함'으로 적어 두기", "검증 기록 — 하지 못한 것"),
        c("공개한 앱에 아무나 들어오지 못하게 되어 있는지 확인하기", "보안 점검 — 공개 전 인증 확인")] },
    // Lite는 7단계를 짧게 한다(scope-tiers.md) — '왜?' 다섯 번은 Full·Xpress만
    { n: 7, name: "유지보수", title: "돌아보고 배운 것 남기기", short: "돌아보기",
      gets: "잰 결과", does: "돌아보고 배운 것을 남겨요", gives: "다음에 쓸 배움",
      criteria: [c("잘된 점과 아쉬운 점 돌아보기", "회고"), c("'왜?'를 다섯 번 물어 진짜 원인 찾기", "5 Whys", NOT_LITE),
        c("정보가 샐 뻔했던 일이나 아찔했던 일 적기", "보안 점검 — 근접 사고"),
        c("배운 것을 다음에 쓸 수 있게 남기기", "체크리스트·지식 창고"), c("마친 작업을 저장소에 올려 두기", "git 커밋")] },
  ];

  // 규모 등급(scope-tiers.md). 즉시 처리는 밟을 단계가 없어 여기 없다
  const TIERS = ["Full", "Xpress", "Lite"];
  const tierOf = (t) => (TIERS.includes(t) ? t : "Full");   // 없거나 모르는 등급은 Full — 등급을 보내지 않던 곳도 지금처럼 움직인다
  // 이 등급이 할 일 — 순서는 STAGES 그대로. 없는 단계면 빈 목록
  const criteriaFor = (stage, tier) => (STAGES[stage] ? STAGES[stage].criteria.filter((x) => !x.tiers || x.tiers.includes(tierOf(tier))) : []);

  // 플로로 말풍선은 짧게 — 한 번에 읽히는 길이(집중 모드). AI 안내문과 미리 만든 말 모두 이 안에서
  const SAY_MAX = 60;

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

  // 진행 세 줄 — 방금 한 일 / 지금 할 일 / 그다음. todos는 사용자가 정한 순서(있으면 그것을 따른다)
  function ticker(j, todos, lastDone) {
    const s = STAGES[j.stage], nx = STAGES[s.n + 1];
    const done = j.criteria.filter((x) => x.met).pop();
    const todo = todos || j.criteria.filter((x) => !x.met).map((x) => x.text);
    const now = todos ? todo[0] : (j.next ? j.next.what : todo[0]);
    const after = todos || j.next ? todo[1] : null;
    return {
      done: done ? done.text : lastDone || "",
      now: now || "다음 단계로 넘어가기 전에 함께 확인하기",
      after: after || (nx ? `${nx.n}단계 ${nx.title}` : "마무리"),
    };
  }

  // 플로로의 [표정, 말풍선] — 위에 있는 상황이 먼저다. v: 화면 상태를 요약한 것
  const GATE_FACE = {
    ask: ["done", "이번 단계에서 한 일, 같이 볼까요?"],
    which: ["think", "모르는 게 당연해요. 어디가 헷갈렸어요?"],
    question: ["think", "편하게 물어보세요. 쉬운 말로 답할게요."],
    plan: ["think", "한 장으로 정리했어요. 이제 어때요?"],
    next: ["happy", "좋아요! 다음에 할 일 순서를 정해 봐요."],
  };
  // 두 화면이 같이 쓰는 앞부분 — 기다리는 중 > 잠깐! > 오류
  const trouble = (v, busySay) => (v.busy ? ["look", busySay] : v.warn ? ["alert", "보내기 전에 잠깐! 아래 안내를 봐 주세요."]
    : v.error ? ["think", "음, 잘 안 됐어요. 아래 안내를 봐 주세요."] : null);
  function face(v) {
    const t = trouble(v, "어디쯤인지 살펴보고 있어요…");
    if (t) return t;
    if (v.gate) return GATE_FACE[v.step] || GATE_FACE.ask;
    if (v.back) return ["happy", v.back];
    if (!v.reason) return ["idle", "지금 만들고 있는 걸 보여 주시면, 어디쯤인지와 다음에 할 일을 알려 드릴게요."];
    if (v.allDone) return ["done", "할 일을 다 했어요! 넘어가기 전에 같이 확인해 봐요."];
    return ["idle", v.reason];
  }

  // 설계도 화면의 플로로 — 초안을 받기 전, 받은 뒤, 다시 봐 준 뒤, 확정한 뒤
  function docFace(v) {
    const t = trouble(v, "설계도를 읽고 있어요…");
    if (t) return t;
    if (v.review) return [v.review.ready ? "happy" : "think", v.review.say];
    if (v.draftSay) return ["happy", v.draftSay];
    if (v.done) return ["done", "확정한 설계도예요. 고치고 싶으면 언제든 다시 열어요."];
    return ["idle", "초안은 제가 먼저 써 볼게요. 고치고 확정하는 건 직접 해요."];
  }

  // 사용자가 고른 것을 작업 글에 남기는 한 줄 — 다시 살펴볼 때 AI가 읽는다
  const decisionLine = (question, option) => `${question} → '${option}'로 정했어요.`;

  // 설계도의 빈칸 — AI 초안과 연습용 초안이 모르는 자리를 이렇게 비워 둔다
  const BLANK = /\[채워 주세요:\s*([^\]]*)\]/g;
  const blanks = (text) => [...String(text).matchAll(BLANK)].map((m) => m[1].trim());

  // 다시 왔을 때 인사 — 저장해 둔 기록(saved.at: 마지막으로 본 때)으로 "어제 2단계 할 일 4개 중 2개까지" 같이 말한다
  const day = (t) => new Date(t).setHours(0, 0, 0, 0);
  function welcome(saved, now) {
    const j = saved && saved.j, s = j && STAGES[j.stage];
    if (!s || !saved.at || !Array.isArray(j.criteria)) return "";
    const d = Math.round((day(now) - day(saved.at)) / 864e5);
    const when = d <= 0 ? "아까" : d === 1 ? "어제" : `${d}일 전에`;
    const met = j.criteria.filter((c) => c && c.met).length, n = j.criteria.length;
    if (met === n) return `${when} ${s.n}단계 할 일을 다 하셨어요. 넘어가기 전 확인부터 해요!`;
    if (!met) return `${when} ${s.n}단계를 시작하셨어요. 첫 할 일부터 해 봐요!`;
    return `${when} ${s.n}단계 할 일 ${n}개 중 ${met}개까지 하셨어요. 이어서 해요!`;
  }

  // 응답 모양(JSON 스키마) — 칸은 모두 꼭 있어야 한다
  const str = { type: "string", minLength: 1 };
  const obj = (properties) => ({ type: "object", required: Object.keys(properties), properties });
  const list = (items, min, max) => ({ type: "array", items, ...(min ? { minItems: min } : {}), ...(max ? { maxItems: max } : {}) });
  const JUDGE_SCHEMA = obj({
    reason: str,
    criteria: list(obj({ met: { type: "boolean" }, evidence: { type: "string" } })),
    next: obj({ what: str, why: str, question: str, options: list(str, 2, 4), action: str }),
  });
  const ANSWER_SCHEMA = obj({ answer: str });
  const DRAFT_SCHEMA = obj({ draft: str, say: str });
  const REVIEW_SCHEMA = obj({ say: str, good: list(str, 0, 3), fix: list(obj({ where: str, why: str, hint: str }), 0, 3), ready: { type: "boolean" } });

  // ── 요청문 — [역할 · 상황] · 규칙 · 쉬운 말 규칙 · 넘길 글. 네 요청이 같은 틀을 쓴다 ──
  const ROLE = "너는 앱을 만드는 사람 옆에서 길을 알려 주는 동료다.";
  const SHORT = `두 문장 이내, ${SAY_MAX}자 안쪽`;   // 플로로 말풍선에 그대로 나오는 말의 길이
  const PLAIN = [
    "읽는 사람은 개발을 모르는 사람이다. 중학생도 알아듣는 말로, '~해요' 말투로 짧게 쓴다.",
    "전문 용어와 영어 약어를 쓰지 않는다. 꼭 필요하면 쉬운 말을 먼저 쓰고 괄호 안에 용어를 넣는다.",
    "사용자의 작업 내용에 나온 말을 예로 든다.",
  ];
  const tag = (name, t) => [`<${name}>`, String(t), `</${name}>`];
  const prompt = (intro, rules, ...tags) =>
    [`${ROLE} ${intro[0]}`, ...intro.slice(1), "", "규칙:", ...[...rules, ...PLAIN].map((r) => `- ${r}`), "", ...tags.flat()].join("\n");
  // 할 일 목록 — "(1) … (2) …". terms면 [용어]까지
  const todoOf = (list, terms) => list.map((x, i) => `(${i + 1}) ${x.text}${terms && x.term ? ` [${x.term}]` : ""}`).join(" ");

  // 단계는 코드가 정한다(게이트를 통과한 다음 단계) — AI는 그 단계, 그 등급의 할 일만 본다
  const judgePrompt = (text, stage, tier) => { const s = STAGES[stage], todo = criteriaFor(stage, tier); return prompt([`사용자는 지금 ${s.n}단계 "${s.title}"(${s.does})를 하고 있다. 이 단계의 할 일을 했는지 알려 준다.`,
    `할 일: ${todoOf(todo, true)}`], [
    "작업 내용에 적힌 것만 근거로 쓴다. 적혀 있지 않으면 met=false이고 evidence는 빈 문자열이다. 지어내지 않는다.",
    "evidence는 작업 내용에서 글자 그대로 따온 짧은 구절이다. 바꿔 쓰면 근거로 치지 않는다.",
    `criteria는 이 단계의 할 일과 같은 개수(${todo.length}개), 같은 순서로 낸다.`,
    `reason은 이 단계에서 어디쯤인지와 잘한 점을 ${SHORT}으로 말한다(플로로의 말풍선에 그대로 나온다).`,
    "next는 아직 안 한 일 중 가장 먼저 할 하나다. 모두 했으면 다음 단계로 넘어가기 전 확인을 해 보자고 안내한다.",
    "next.what은 20자 안팎의 짧은 할 일 이름이다(예: '빠르게'를 숫자로 바꾸기). 설명은 why, 방법은 action에 쓴다.",
    "next.question은 그 일을 하려면 사용자가 정해야 할 것 하나를 묻는 짧은 질문이다.",
    "next.options는 그 질문의 선택지 2~4개다. 하나에 25자 안팎. 모르면 고를 수 있게 '아직 모름'류를 하나 넣는다. 고르는 건 사용자다.",
    "작업 내용에 '→ …로 정했어요.'라고 적힌 줄은 사용자가 이미 고른 것이다. 그 일은 했다고 보고 다음 일로 넘어간다.",
  ], tag("작업내용", text)); };

  function answerPrompt(stage, hard, question, text) {
    const s = STAGES[stage];
    return prompt([`사용자가 ${s.n}단계 "${s.title}"(${s.does})를 마치고 "잘 모르겠다"고 했다.`, `헷갈린 부분: ${hard.join(", ") || "(고르지 않음)"}`],
      ["다섯 문장 이내로 답한다. 모르면 모른다고 한다."], tag("작업내용", text), tag("질문", question));
  }

  // FR-3 설계도: AI가 초안을 먼저 쓰고 → 사용자가 고치고 → AI가 다시 봐 준다. 확정은 사람만 한다(화면의 버튼).
  function draftPrompt(stage, text, tier) {
    const s = STAGES[stage];
    return prompt([`사용자는 ${s.n}단계 "${s.title}"(${s.does})를 하고 있다.`,
      `아래 작업 내용만 보고 이 단계에서 만들 "${s.doc}"의 초안을 쓴다. 초안은 사용자가 직접 고쳐서 완성한다.`, `이 단계에서 챙길 것: ${todoOf(criteriaFor(stage, tier))}`], [
      "작업 내용에 없는 사실(숫자, 사람, 기능, 날짜)은 지어내지 않는다. 모르는 자리는 [채워 주세요: 무엇을] 으로 비워 둔다.",
      "한 줄에 한 가지만 쓴다. 전체 1200자 이내. 표·기호 장식 없이 줄글과 번호만 쓴다.",
      `say는 초안을 건네며 하는 말이다. ${SHORT}으로, 빈칸이 몇 개인지 알려 준다.`,
    ], tag("작업내용", text));
  }
  function reviewPrompt(stage, text, doc, tier) {
    const s = STAGES[stage];
    return prompt([`사용자가 ${s.n}단계의 "${s.doc}"을 고쳐 썼다. 다시 봐 준다.`, `이 단계에서 챙길 것: ${todoOf(criteriaFor(stage, tier))}`], [
      "대신 고쳐 쓰지 않는다. 고칠 곳과 방향만 말한다. 정답 문장을 주지 않는다.",
      "good은 잘한 점 3개 이내. 설계도에 실제로 있는 것만 말한다.",
      "fix는 고칠 곳 3개 이내. where는 설계도에서 그대로 따온 짧은 구절, why는 왜 고쳐야 하는지, hint는 어떻게 고칠지 방향이다.",
      "[채워 주세요: …] 빈칸이 남아 있으면 fix에 넣는다.",
      "ready는 fix가 비어 있을 때만 true다.",
      `say는 ${SHORT}이다.`,
    ], tag("작업내용", text), tag("설계도", doc));
  }

  // ── Claude 응답은 믿지 않는다 — 모양이 맞을 때만 쓰고, 아니면 null("살펴보지 못함") ──
  const filled = (x) => typeof x === "string" && x.trim() !== "";
  const has = (o, keys) => !!o && keys.every((k) => filled(o[k]));        // 글자 칸이 모두 채워졌나
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]])); // 그 칸만 옮긴다(다른 칸은 버린다)
  const NEXT = ["what", "why", "question", "action"], FIX = ["where", "why", "hint"];

  const parseDraft = (o) => (has(o, ["draft", "say"]) ? { draft: o.draft.slice(0, 4000), say: o.say } : null);
  // 고칠 곳이 하나라도 있으면 ready는 우리 쪽에서 false로 둔다
  function parseReview(o) {
    if (!has(o, ["say"]) || typeof o.ready !== "boolean" || !Array.isArray(o.good) || !Array.isArray(o.fix)) return null;
    if (!o.good.every(filled) || !o.fix.every((f) => has(f, FIX))) return null;
    const fix = o.fix.slice(0, 3).map((f) => pick(f, FIX));
    return { say: o.say, good: o.good.slice(0, 3), fix, ready: o.ready && fix.length === 0 };
  }
  // 근거 구절이 사용자 글에 실제로 있는가 — 띄어쓰기·줄바꿈 차이만 봐준다. 빈 구절은 근거가 아니다
  const squash = (t) => String(t || "").replace(/\s+/g, " ").trim();
  const found = (quote, text) => !!squash(quote) && squash(text).includes(squash(quote));
  // 할 일 문장은 우리 데이터로 덮는다. text: 판정에 넘긴 사용자 글 — 거기 없는 근거로는 '했다'가 되지 않는다
  // stage: 코드가 정한 지금 단계 — AI가 다른 단계를 말해도 따르지 않는다. tier: 규모 등급 — 그 등급의 할 일 개수만 받는다
  function parseJudgement(o, text, stage, tier) {
    const s = Number.isInteger(stage) && STAGES[stage];
    if (!s || !o || !filled(o.reason)) return null;
    const todo = criteriaFor(stage, tier);
    if (!Array.isArray(o.criteria) || o.criteria.length !== todo.length || o.criteria.some((x) => !x || typeof x.met !== "boolean")) return null;
    const n = o.next;
    if (!has(n, NEXT) || !Array.isArray(n.options) || n.options.length < 2 || n.options.length > 4 || !n.options.every(filled)) return null;
    return {
      stage, reason: o.reason,
      criteria: todo.map((x, i) => {
        const ev = found(o.criteria[i].evidence, text) ? squash(o.criteria[i].evidence) : "";
        return { text: x.text, term: x.term, met: o.criteria[i].met && !!ev, evidence: ev };
      }),
      next: { ...pick(n, NEXT), options: n.options.slice() },
    };
  }

  const api = { STAGES, TIERS, criteriaFor, JARGON, SAY_MAX, canAdvance, reorder, nextView, ticker, face, docFace, decisionLine, blanks, welcome,
    JUDGE_SCHEMA, ANSWER_SCHEMA, DRAFT_SCHEMA, REVIEW_SCHEMA, judgePrompt, answerPrompt, draftPrompt, reviewPrompt,
    parseJudgement, parseDraft, parseReview, filled };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavRules = api;
})(typeof window !== "undefined" ? window : globalThis);
