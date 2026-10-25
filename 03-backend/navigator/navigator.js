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

  // 모드(C-13, 2026-10-20 — 이재엽 "처음 시작했을때는 기본으로 두지만 사람들이 바이브 코딩 환경에 들어가면 기본 화면에 나오지 않는 이상 그 오버레이는 바이브 코딩 오버레이로 계속 남는거야").
  // 접힘(nextView의 띠 · 한 줄 · 펼침)과 따로다 — 어떤 판을 보이나. base: 기본 화면(단추 판) · vibe: 바이브 코딩(이번 단계 · 설계도 · 단계 지도 · 도서관).
  //   켤 때는 늘 base(start), 바이브 코딩 단추 · 주소로 연 장면(scene)은 vibe, 집 단추(home)는 base. 모아 보기 창의 '들어가기'(enter)는 창째 뺐다(2026-10-23).
  //   접힘 · 펼침 · 서고 다녀옴(fold · unfold · library)으로는 바뀌지 않는다. 모르는 일도 그대로. 이름에 mode(보기 방식) · home(펼친 섬)을 쓰지 않는다(넘김 문서 10절)
  const PLACES = ["base", "vibe"];
  function nextPlace(place, ev) {
    const cur = PLACES.includes(place) ? place : "base";
    if (ev === "start") return "base";
    if (ev === "vibe" || ev === "scene") return "vibe";
    if (ev === "home") return "base";
    return cur;
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
    const t = trouble(v, "문서를 읽고 있어요…");
    if (t) return t;
    if (v.review) return [v.review.ready ? "happy" : "think", v.review.say];
    if (v.draftSay) return ["happy", v.draftSay];
    if (v.done) return ["done", "확정한 문서예요. 고치고 싶으면 언제든 다시 열어요."];
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
  const TASK_SCHEMA = obj({ lines: list(str, 1, 12), say: str });   // FR-17 대화로 일 넘기기(2026-10-20) — 요구 문장 줄들과 한마디

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

  // FR-17 대화로 일 넘기기(C-4, 2026-10-20): 섬의 대화창에 적은 할 일 → 요구 문장(한 줄에 한 가지)으로 정리 → 사람이 고쳐 확정 → 허락하면 Claude Code에 넘긴다
  const TASK_MAX = 12, TASK_LINE_MAX = 200;
  function taskPrompt(text) {
    return prompt(["사용자가 코딩 도구(Claude Code)에 시킬 일을 짧게 적었다. 그 일을 코딩 도구가 그대로 받아 할 수 있게 요구 문장으로 정리한다."], [
      "적은 글에 있는 것만 쓴다. 없는 기능 · 숫자 · 파일 이름은 지어내지 않는다. 모르는 자리는 [정해 주세요: 무엇을] 으로 비워 둔다.",
      "lines는 한 줄에 한 가지, '누가 무엇을 하면, 앱은 무엇을 한다' 모양으로. 1~12줄, 한 줄 200자 안쪽. 번호 · 기호 장식은 쓰지 않는다.",
      `say는 정리한 줄을 건네며 하는 말이다. ${SHORT}으로, 사용자가 고쳐서 확정하라고 알린다.`,
    ], tag("적은글", text));
  }
  const parseTask = (o) => (o && has(o, ["say"]) && Array.isArray(o.lines) && o.lines.length && o.lines.every((l) => typeof l === "string")
    ? (() => { const lines = o.lines.filter(filled).slice(0, TASK_MAX).map((l) => l.trim().slice(0, TASK_LINE_MAX)); return lines.length ? { lines, say: o.say } : null; })() : null);
  // 서버 없이(FR-10) — 적은 글을 줄 · 문장으로만 나눈다(지어내지 않는다), 6줄까지
  function taskLines(text) {
    const lines = String(text || "").split(/\r?\n|(?<=[.!?。])\s+/).map((l) => l.trim().replace(/[.!?。]$/, "")).filter(Boolean).slice(0, 6);
    return { lines, say: lines.length ? "연습이라 적은 그대로 줄만 나눴어요 — 고쳐서 확정해요" : "적은 글이 없어요" };
  }

  // C-22 퀘스트 제작(2026-10-21, 이재엽 "지금부터 만들어서 릴리즈"): 사용자가 말한 것(idea)과 코드가 정한 단계의 할 일로 플로로가 퀘스트 글을 만든다 —
  //   설명(desc) · 왜(why) · 할 일마다 질문 하나와 예시 답(qa). 할 일 이름 · 개수는 코드(STAGES · criteriaFor), AI는 글만 [정할 것 7 · 12]. 화면은 서버 없이(연습)는 quest.js의 기본 글을 쓴다
  // 플로로 말투 — 이재엽이 다듬을 자리(요청문의 규칙 한 줄로 들어간다). 바꿔도 모양(스키마)은 그대로
  const FLORO_VOICE = "너는 길잡이 물범 '플로로'다. 초등학생도 알아듣는 말로, 짧고 다정하게, '~해요'로 말한다. 재촉하지 않고, 사용자가 말한 것을 그대로 예로 든다.";
  const IDEA_MAX = 400, QA_EX_MAX = 3;
  const QUEST_SCHEMA = obj({ desc: str, why: str, qa: list(obj({ question: str, examples: list(str, 1, QA_EX_MAX) }), 1, 8) });
  function questPrompt(stage, idea, tier) {
    const s = STAGES[stage], todo = criteriaFor(stage, tier);
    return prompt([`사용자가 "${String(idea).trim()}"를 만들고 싶다고 했다. 지금은 ${s.n + 1}단계 "${s.title}"(${s.does})다. 이 단계를 게임의 퀘스트처럼 보여 주려고 한다 — 퀘스트 글을 만든다.`,
      `할 일(이름 · 개수는 정해져 있다 — 바꾸지 않는다): ${todoOf(todo)}`], [
      FLORO_VOICE,
      "desc는 이 퀘스트에서 무엇을 하는지 두세 문장, 200자 안쪽. 사용자가 만들고 싶다고 한 것을 예로 든다.",
      "why는 이 퀘스트를 왜 하는지 한 문장, 100자 안쪽.",
      `qa는 할 일과 같은 개수(${todo.length}개), 같은 순서다. question은 그 할 일을 하려면 사용자가 말해야 할 것을 묻는 짧은 질문(60자 안쪽). examples는 사용자가 만들고 싶다고 한 것에 맞춘 예시 답 1~${QA_EX_MAX}개(각 80자 안쪽), 한 줄에 한 가지.`,
      "사용자가 말하지 않은 사실(숫자 · 사람 · 기능 · 날짜)은 지어내지 않는다. examples는 보기일 뿐 정답이 아니다.",
    ], tag("만들고싶은것", String(idea).trim()));
  }
  // ── C-36 처음 한 바퀴(2026-10-25, 이재엽 "원하는 내용을 플로로에게 받는걸로 … 너가 전체적으로 글들을 확인해서 어떤 내용이고 우리 내용들에 맞춰서 너가 초안을 백엔드로 제작" ·
  //    버튼 "1단계는 확인만 → 관문 → 2단계" · "규모 판단표 scope-tiers") — 사용자가 플로로에게 준 글 전체로 1단계 할 일 넷의 초안 ──
  //   topic(제목 — 퀘스트 이름이 된다) · pain(불편) · change(달라지는 것) · who(글에 사람이 있으면, 없으면 "") · size(short · medium · long = 짧음 · 보통 · 긺 = Lite · Xpress · Full) · sizeWhy.
  //   화면은 칸마다 '맞나요?'로 확인만 한다(quest.js withDraft · draftOf). 판정 · 관문은 그대로
  const START_MAX = 8000, TOPIC_MAX = 30, START_SIZES = ["short", "medium", "long"];
  const START_SCHEMA = obj({ topic: str, pain: str, change: str, who: { type: "string" }, size: { type: "string", enum: START_SIZES }, sizeWhy: str });
  function startPrompt(text) {
    const s = STAGES[0];
    return prompt([`사용자가 만들고 싶은 것을 플로로에게 말했다(넣은글). 글 전체를 읽고 무엇을 만들려는지 파악해서, ${s.n + 1}단계 "${s.title}"(${s.does})의 할 일 넷의 초안을 만든다. 사용자는 초안을 보고 맞는지만 고른다.`,
      `할 일: ${todoOf(s.criteria)}`], [
      FLORO_VOICE,
      `topic은 무엇을 만드는지 ${TOPIC_MAX}자 안쪽 이름(예: 동아리 행사 신청 앱). 퀘스트 제목이 된다.`,
      "pain은 (1) 어떤 불편을 풀고 싶은지 한 문장(80자 안쪽). change는 (2) 다 만들면 무엇이 달라지는지 한 문장(80자 안쪽).",
      "who는 (3) 누가 쓰는지 — 글에 쓰는 사람이 나오면 그 사람을 한 문장(60자 안쪽)으로, 글에 없으면 빈 문자열 \"\". 사람을 지어내지 않는다.",
      "size는 (4) 얼마나 크게 만들지 — 규모 판단표(scope-tiers)를 이 순서대로 따른다: ① 흔히 쓰는 방법(표준 패턴) 하나로 바로 풀리는 일이면 medium ② 아니고, 작은 버그 고치기나 한 파일짜리 스크립트 수준이면 short ③ 둘 다 아니면 long. sizeWhy는 그렇게 본 까닭 한 문장(60자 안쪽).",
      "글에 없는 사실(숫자 · 사람 · 기능 · 날짜)은 지어내지 않는다. 글에 있는 말을 그대로 쓴다.",
    ], tag("넣은글", String(text).trim()));
  }
  // 답의 모양 — 글은 잘라 쓰고, size는 셋 중 하나, who는 빈 글자도 된다('없음' · '모름' 같은 답도 빈 글자로). 틀리면 null. START_MAX는 계획(PLAN_MAX)과 같은 8,000자 — 시험이 맞대어 본다
  function parseStart(o) {
    if (!o || !has(o, ["topic", "pain", "change", "sizeWhy"]) || typeof o.who !== "string" || !START_SIZES.includes(o.size)) return null;
    return { topic: o.topic.trim().slice(0, TOPIC_MAX), pain: o.pain.trim().slice(0, 160), change: o.change.trim().slice(0, 160), who: /^(없음|없어요|모름|알 수 없음|-)?\.?$/.test(o.who.trim()) ? "" : o.who.trim().slice(0, 120), size: o.size, sizeWhy: o.sizeWhy.trim().slice(0, 120) };
  }
  // ── C-37 2단계 초안(2026-10-25, 이재엽 "1단계에서 받은 내용들을 2단계에서도 초안들을 진행하며 생각들을 2단계 진행하기 전에 먼저 생각하고 동의들을 구한후") ──
  //   받은 글(처음 말한 것)과 1단계 결과로 2단계 할 일의 초안 — 할 일 이름 · 순서 · 개수는 그 등급 그대로(criteriaFor), AI는 칸마다 글만. 기획서로 키울지(PRD)는 셋 중 하나를 권하기만 — 고르는 것은 사람
  const DRAFT_STAGES = [1];
  const STAGE_DRAFT_SCHEMA = obj({ items: list(obj({ text: str }), 1, 8), say: str });
  const STAGE_HINT = {
    "정해진 빈칸에 아이디어 채우기": "누구 · 불편 · 해결 · 어디까지 · 언제 성공 다섯 칸을 '칸: 내용'으로 쓰고 ' · '로 이어 한 줄.",
    "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기": "'왜: … · 어디까지: …(이번에 안 하는 것도) · 언제 성공: …(숫자로, 모르면 아직 모름)' 한 줄.",
    "한 문장에 한 가지 일만, 애매한 말 없이 쓰기": "꼭 할 일을 '~하면, 앱은 ~한다' 한 문장에 한 가지씩 3~5개, ' / '로 이어 한 줄.",
    "다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기": "'남의 정보: …(이름 · 연락처 같은 것, 없으면 없음) · 밖으로 나가는 것: …(다른 서비스 · AI, 없으면 없음)' 한 줄.",
  };
  const PRD_PICK = [["경량", "light"], ["상세", "full"], ["안 함", "none"]];
  function stageDraftPrompt(stage, tier, { idea = "", prev = [] } = {}) {
    const s = STAGES[stage], todo = criteriaFor(stage, tier);
    const hint = (c, i) => `(${i + 1}) ${c.text} — ${c.term === "PRD" ? "text는 '경량' · '상세' · '안 함' 중 하나로 시작하고 ' — 까닭'을 붙인다(기능이 적으면 경량, 쓰는 사람 · 기능이 많으면 상세, 아주 작으면 안 함)." : STAGE_HINT[c.text] || "한 줄."}`;
    return prompt([`사용자가 1단계를 마쳤다(1단계결과). 받은 글과 1단계 결과를 읽고 ${s.n + 1}단계 "${s.title}"(${s.does})의 할 일마다 초안을 만든다. 사용자는 초안을 보고 맞는지만 고른다.`,
      `할 일(이름 · 개수 · 순서는 정해져 있다 — items도 이 순서로 ${todo.length}개): ${todo.map(hint).join(" ")}`], [
      FLORO_VOICE,
      "글은 한 칸에 300자 안쪽. say는 사용자에게 건네는 한마디(60자 안쪽).",
      "받은 글과 1단계 결과에 없는 사실(숫자 · 사람 · 기능 · 날짜)은 지어내지 않는다. 모르면 '아직 모름'이라고 쓴다.",
    ], tag("받은글", String(idea).trim()), tag("1단계결과", prev.map((x) => `${x.name}: ${(x.lines || []).join(" / ")}`).join("\n")));
  }
  // 답의 모양 — 할 일 개수와 같아야 하고, 기획서 칸은 경량 · 상세 · 안 함으로 시작해야(→ {pick, why}). 글은 잘라 쓴다. 초안을 만들지 않는 단계 · 틀리면 null
  function parseStageDraft(o, stage, tier) {
    const todo = DRAFT_STAGES.includes(stage) ? criteriaFor(stage, tier) : null;
    if (!todo || !o || !filled(o.say) || !Array.isArray(o.items) || o.items.length !== todo.length) return null;
    const items = [];
    for (let i = 0; i < todo.length; i++) {
      const x = o.items[i]; if (!x || !filled(x.text)) return null;
      const t = x.text.trim();
      if (todo[i].term !== "PRD") { items.push({ text: t.slice(0, 300) }); continue; }
      const hit = PRD_PICK.find(([w]) => t.startsWith(w)); if (!hit) return null;
      items.push({ pick: hit[1], why: t.slice(hit[0].length).replace(/^\s*(?:—|-|:)?\s*/, "").slice(0, 120) });
    }
    return { items, say: o.say.trim().slice(0, 120) };
  }
  // 답의 모양 — qa는 할 일 개수와 같아야 한다(다르면 null). 긴 글은 잘라 쓴다
  function parseQuest(o, stage, tier) {
    const todo = criteriaFor(stage, tier);
    if (!o || !has(o, ["desc", "why"]) || !Array.isArray(o.qa) || o.qa.length !== todo.length) return null;
    const qa = [];
    for (const x of o.qa) {
      if (!x || !filled(x.question) || !Array.isArray(x.examples) || !x.examples.length || !x.examples.every(filled)) return null;
      qa.push({ question: x.question.trim().slice(0, 120), examples: x.examples.slice(0, QA_EX_MAX).map((e) => e.trim().slice(0, 200)) });
    }
    return { desc: o.desc.trim().slice(0, 400), why: o.why.trim().slice(0, 200), qa };
  }

  // ── C-34 준비 계획판 · C-32 해낸 것 확인 · C-33 초등학생 말(2026-10-24, 이재엽 "한번에 내용들을 넣으면 어떻게 준비하고 기준들을 사람들이 확인해서 너한테 의견들을 바로바로" ·
  //    버튼 "Floe의 AI 한 번" · "Claude Code가 기준마다 보고" · "맡길 일 목록으로") ──
  // 계획: 넣은 글 + 작업 폴더의 README · 파일 이름만 보고(도구 없이) 세운다 — 이해한 것 셋 · 요구와 기준 · 준비할 것 · 물을 것. 사람이 줄마다 맞아요 / 고칠래요 · 의견을 달면 다시 세운다.
  // 보고: 확정한 요구를 맡길 때 기준을 같이 넘기고(taskBrief), Claude Code가 끝에 기준마다 해냄 · 근거를 정해진 모양(REPORT_SCHEMA)으로 답한다. 사람이 맞아요를 눌러야 끝낸 것으로 친다(화면)
  const PLAN_MAX = 8000, PLAN_ITEMS = 12, PLAN_LINE = 160, CHECKS_MAX = 12;
  const PLAN_SCHEMA = obj({ problem: str, have: str, missing: str, items: list(obj({ need: str, check: str }), 1, PLAN_ITEMS), prep: list(str, 0, 6), ask: list(str, 0, 4), say: str });
  const planLines = (p) => [`풀려는 문제: ${p.problem}`, `이미 있는 것: ${p.have}`, `아직 없는 것: ${p.missing}`,
    ...p.items.map((x, i) => `(${i + 1}) 요구: ${x.need} / 기준: ${x.check}`), ...(p.prep || []).map((x) => `준비: ${x}`), ...(p.ask || []).map((x) => `물을 것: ${x}`)].join("\n");
  function planPrompt({ text, readme = "", files = [], prev = null, notes = [], answers = [], general = "" }) {
    const said = [...notes.map((n) => `요구: ${n.need} / 기준: ${n.check} → 의견: ${n.note}`), ...answers.map((a) => `물은 것: ${a.q} → 답: ${a.a}`), ...(general ? [`전체 의견: ${general}`] : [])];
    return prompt([prev ? "사용자가 만들고 싶은 것을 한 번에 적었고, 지난번에 세운 준비 계획에 의견을 달았다. 의견대로 계획을 다시 세운다."
      : "사용자가 만들고 싶은 것 · 요구 · 문제 글을 한 번에 적었다. 그것으로 준비 계획을 세운다 — 사용자는 이 계획을 줄마다 맞는지 확인한다."], [
      FLORO_VOICE,
      "넣은 글 · README · 파일 이름에 있는 것만 쓴다. 없는 기능 · 숫자 · 사람 · 날짜는 지어내지 않는다. 모르는 것은 ask에 질문으로 넣는다(4개까지).",
      "problem은 풀려는 문제, have는 이미 있는 것(README · 파일 이름으로 본 것 — 없으면 '아직 없어요'), missing은 아직 없는 것. 각각 한 문장, 100자 안쪽.",
      `items는 요구 1~${PLAN_ITEMS}개. need는 '누가 무엇을 하면, 앱은 무엇을 한다' 모양의 한 줄, check는 그 요구가 다 됐는지 눈으로 볼 수 있는 한 줄(예: '신청 단추를 누르면 목록에 한 줄이 생긴다'). 각각 ${PLAN_LINE}자 안쪽.`,
      "prep은 만들기 전에 준비할 것 6개까지(각 80자 안쪽). 없으면 빈 목록.",
      `say는 계획을 건네며 하는 말이다. ${SHORT}으로, 줄마다 맞는지 봐 달라고 한다.`,
      ...(prev ? ["의견이 없는 줄은 그대로 둔다. 의견이 달린 줄만 의견대로 고친다. 답을 받은 질문은 ask에서 빼고 계획에 넣는다."] : []),
    ], tag("넣은글", String(text || "").trim()), ...(readme ? [tag("README", readme)] : []), ...(files.length ? [tag("파일이름", files.join(", "))] : []),
      ...(prev ? [tag("지난계획", planLines(prev)), tag("의견", said.join("\n") || "(없음)")] : []));
  }
  const strs = (a, max, len) => (Array.isArray(a) && a.every((x) => typeof x === "string") ? a.filter(filled).slice(0, max).map((x) => x.trim().slice(0, len)) : null);
  // 답의 모양 — 요구 줄의 id(p1…)는 코드가 붙인다(화면의 맞아요 / 고칠래요 · 맡기기가 이 id로 가리킨다). 긴 글은 잘라 쓴다
  function parsePlan(o) {
    if (!has(o, ["problem", "have", "missing", "say"]) || !Array.isArray(o.items) || !o.items.length || !o.items.every((x) => has(x, ["need", "check"]))) return null;
    const prep = strs(o.prep, 6, 100), ask = strs(o.ask, 4, 120);
    if (!prep || !ask) return null;
    const cut = (s, n) => s.trim().slice(0, n);
    return { problem: cut(o.problem, 200), have: cut(o.have, 200), missing: cut(o.missing, 200),
      items: o.items.slice(0, PLAN_ITEMS).map((x, i) => ({ id: `p${i + 1}`, need: cut(x.need, PLAN_LINE), check: cut(x.check, PLAN_LINE) })), prep, ask, say: cut(o.say, 120) };
  }
  const REPORT_SCHEMA = obj({ items: list(obj({ check: str, done: { type: "boolean" }, evidence: { type: "string" } }), 1, CHECKS_MAX), easy: str, ask: { type: "string" } });
  // Claude Code에 넘길 글 — 요구 문장 + 기준 목록 + 끝나면 기준마다 보고하라는 말(그 실행에 --json-schema REPORT_SCHEMA). 기준이 없으면 요구 문장 그대로(FR-17 전처럼)
  function taskBrief(text, checks) {
    const t = String(text || "").trim(), c = (checks || []).filter(filled).slice(0, CHECKS_MAX);
    if (!c.length) return t;
    return [t, "", "다 됐는지 보는 기준:", ...c.map((x, i) => `(${i + 1}) ${x.trim()}`), "",
      "일을 마치면 기준마다 해냈는지(done)와 근거(evidence — 바꾼 파일 이름과 한 일 한 줄)를 정해진 모양으로 알려 주세요. 하지 않은 일은 해냈다고 지어내지 않아요.",
      "easy는 초등학생도 알아듣는 말로 두 문장, 60자 안쪽 — 무엇을 했고 무엇이 남았는지. 어려운 말은 쉬운 말로 풀고, 파일 이름 · 명령 · 숫자는 바꾸지 않아요.",
      "사용자에게 물을 것이 있으면 ask에 한 문장(쉬운 말), 없으면 빈 글. 증거에 내 컴퓨터의 전체 경로는 쓰지 말고 폴더 안의 파일 이름만 써요."].join("\n");
  }
  // 보고 읽기 — 기준 순서대로 맞춘다(빠진 줄은 안 됨, 남는 줄은 버림). 근거가 빈 '해냄'은 해냄으로 치지 않는다. check 글은 우리 것으로 덮는다
  function parseReport(o, checks) {
    const c = (checks || []).filter(filled);
    if (!c.length || !o || !filled(o.easy) || typeof o.ask !== "string" || !Array.isArray(o.items) || !o.items.length || o.items.some((x) => !x || typeof x.done !== "boolean")) return null;
    const items = c.map((check, i) => { const x = o.items[i], ev = x && typeof x.evidence === "string" ? x.evidence.trim().slice(0, 200) : ""; return { check, done: !!(x && x.done && ev), evidence: ev }; });
    return { items, easy: o.easy.trim().slice(0, 240), ask: o.ask.trim().slice(0, 200), done: items.filter((x) => x.done).length, total: items.length };
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

  const api = { STAGES, TIERS, criteriaFor, JARGON, SAY_MAX, canAdvance, reorder, nextView, PLACES, nextPlace, ticker, face, docFace, decisionLine, blanks, welcome,
    JUDGE_SCHEMA, ANSWER_SCHEMA, DRAFT_SCHEMA, REVIEW_SCHEMA, TASK_SCHEMA, judgePrompt, answerPrompt, draftPrompt, reviewPrompt, taskPrompt,
    parseJudgement, parseDraft, parseReview, parseTask, taskLines, filled,
    FLORO_VOICE, IDEA_MAX, QUEST_SCHEMA, questPrompt, parseQuest,   // C-22 퀘스트 제작(2026-10-21)
    START_MAX, START_SCHEMA, startPrompt, parseStart,   // C-36 처음 한 바퀴 — 1단계 초안(2026-10-25)
    DRAFT_STAGES, STAGE_DRAFT_SCHEMA, stageDraftPrompt, parseStageDraft,   // C-37 2단계 초안(2026-10-25)
    PLAN_MAX, PLAN_SCHEMA, planPrompt, parsePlan, CHECKS_MAX, REPORT_SCHEMA, taskBrief, parseReport };   // C-34 준비 계획판 · C-32 해낸 것 확인(2026-10-24)
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavRules = api;
})(typeof window !== "undefined" ? window : globalThis);
