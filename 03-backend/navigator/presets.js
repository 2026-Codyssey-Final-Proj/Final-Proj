// claude-drafted: 2026-10-27 — C-44 문서 고치기 맡기기 틀(이재엽 "md파일을 수정하거나 다른 문서들을 수정하기 위한 프리셋들을 … 세팅" · 버튼 "Floe의 맡기기 틀" · "지금 자리에 더한다").
//   틀 = 이름(쉬운 말) · 무엇 · Claude Code에 넘길 지시 · 끝 조건(기준). **이 파일 하나에 모아 사람이 더하고 고친다** — 모양만 지키면 된다(check: presets.test.js).
//   넘기기는 전처럼 /api/task/start(FR-17 — 허락은 섬, 끝에 기준마다 보고 C-32). 틀이 쓰는 칸 이름은 docs.js의 단계 문서와 맞춘다. 순수 함수 — 섬(app.js)이 읽어 글을 만든다
(function (root) {
  const EASY = "글은 초등학교 5~6학년이 읽어도 알게 쉬운 말로 — 전문 용어는 괄호에 풀이를 달아요.";   // C-33(이재엽 · 두승현 2026-10-25)
  const ONLY = (p) => `고치는 파일은 ${p} 하나뿐이에요. 다른 파일은 만들거나 고치지 마세요. 커밋 · 푸시는 하지 마세요(사람이 따로 맡겨요).`;
  const PRESETS = [
    { id: "fill", name: "단계 문서 칸 채우기", what: "비어 있거나 '아직'인 칸을 지금까지 정한 것으로 채워요",
      lines: (c) => [`${c.path}의 빈 칸('아직 적지 않았어요' · '(재고 적기)' 같은 틀 글)을 이 프로젝트의 지금 상태로 채워요.`, "채울 근거가 없는 칸은 지어내지 말고 '아직 — 무엇을 알면 채울 수 있는지'를 한 줄 적어요.", "## 재료 · ## 증빙 절의 표 모양은 그대로 두세요."],
      checks: ["틀 글이 남은 칸이 없다(근거 없는 칸은 '아직 — …'으로 적었다)", "표와 절의 모양이 그대로다"] },
    { id: "req", name: "요구 줄 더하기", what: "'~하면, 앱은 ~한다' 문장을 더해요",
      lines: (c) => [`${c.path}에 요구 문장을 더해요 — 한 줄에 한 가지, '~하면, 앱은 ~한다' 꼴로.`, "'빠르게' 같은 애매한 말은 숫자로(모르면 '아직 모름').", "꼭 필요한지 · 있으면 좋은지 표시를 붙여요."],
      checks: ["더한 줄이 모두 '~하면, 앱은 ~한다' 꼴이다", "애매한 말에 숫자나 '아직 모름'이 붙었다"] },
    { id: "decision", name: "결정 기록 한 줄", what: "오늘 정한 것을 결정 기록 표에 한 줄 더해요",
      lines: (c) => [`${c.path}의 결정 기록 표 맨 아래에 한 줄을 더해요 — 날짜 · 단계 · 무엇을 · 왜 · 누가(사람).`, "표의 칸 수와 차례는 있는 줄과 같게 해요."],
      checks: ["표에 한 줄이 늘었고 칸 수가 같다"] },
    { id: "fix", name: "고칠 목록 한 줄", what: "문제 하나를 고칠 목록에 적어요 — 증상 · 고칠 곳 · 상태",
      lines: (c) => [`${c.path}에 고칠 것 한 줄을 더해요 — 번호 · 증상(사람이 본 그대로) · 고칠 곳(파일) · 상태 '열림'.`, "번호는 마지막 번호 다음으로."],
      checks: ["새 줄에 번호 · 증상 · 고칠 곳 · 상태가 있다"] },
    { id: "retro", name: "돌아보기", what: "잘된 점 · 아쉬운 점 · 왜 다섯 번 · 다음에 가져갈 것",
      lines: (c) => [`${c.path}에 돌아보기 절을 써요 — 잘된 점 셋 · 아쉬운 점 셋 · 아쉬운 것 하나에 '왜?'를 다섯 번 · 다음 프로젝트에 가져갈 것 셋.`, "이 프로젝트의 문서와 커밋 기록에서만 근거를 가져와요."],
      checks: ["잘된 점 · 아쉬운 점이 셋씩 있다", "'왜?' 다섯 번이 한 줄씩 이어진다", "가져갈 것이 셋 있다"] },
    { id: "handoff", name: "넘김 문서", what: "다음 사람(또는 다음 세션)이 이어 가게 — 정한 것 · 남은 것 · 꼭 지킬 것",
      lines: (c) => [`${c.path}를 넘김 문서로 써요 — 1. 정한 것 2. 지금까지 한 것 3. 남은 것(차례대로) 4. 꼭 지킬 것 5. 먼저 읽을 파일.`, "아는 것만 적고 모르는 것은 '모름'으로."],
      checks: ["다섯 절이 다 있다", "남은 것이 차례대로 적혔다"] },
    { id: "readme", name: "README 한 절", what: "README에 지금 단계의 한 절을 더하거나 고쳐요",
      lines: (c) => [`${c.path}에 '## ${c.stage}' 절을 더하거나 고쳐요 — 이 단계에서 정한 것 · 만든 것 · 다음 단계를 각각 두세 줄.`, "다른 절은 손대지 마세요."],
      checks: ["그 단계 절만 바뀌었다"] },
    { id: "toc", name: "목차 만들기", what: "문서 맨 위에 제목 목차를 만들어요",
      lines: (c) => [`${c.path} 맨 위(첫 제목 아래)에 ## · ### 제목으로 목차를 만들어요 — 제목 글과 같은 글, 링크는 제목의 앵커로.`, "본문 글은 바꾸지 마세요."],
      checks: ["목차의 항목이 본문의 제목과 하나하나 맞는다", "본문은 그대로다"] },
    { id: "front", name: "머리말 넣기", what: "맨 위에 단계 · 누가 · 날짜 머리말",
      lines: (c) => [`${c.path} 맨 위에 YAML 머리말을 넣어요 — stage: "${c.stage}", who: "사람 이름 대신 역할", date: 오늘(YYYY-MM-DD), status: draft.`, "이미 머리말이 있으면 빠진 칸만 더해요."],
      checks: ["머리말에 stage · who · date · status가 있다"] },
    { id: "table", name: "표 정리", what: "줄 목록을 표로, 깨진 표는 바로",
      lines: (c) => [`${c.path}의 표를 정리해요 — 칸 수가 안 맞는 줄은 맞추고, 같은 꼴의 '- ' 목록이 셋 이상 이어지면 표로 바꿔요(머리 줄 포함).`, "글 내용은 바꾸지 마세요."],
      checks: ["모든 표의 줄마다 칸 수가 머리 줄과 같다"] },
    { id: "easy", name: "쉬운 말로 다듬기", what: "전문 용어를 풀고 긴 문장을 나눠요(초등 5~6학년)",
      lines: (c) => [`${c.path}의 글을 쉬운 말로 다듬어요 — 전문 용어는 처음 나올 때 괄호에 풀이, 한 문장은 한 가지만, 20자 넘는 문장은 둘로.`, "뜻이 바뀌면 안 돼요. 표 · 코드 칸은 손대지 마세요."],
      checks: ["전문 용어마다 풀이가 붙었다", "뜻이 바뀐 문장이 없다"] },
  ];
  const byId = (id) => PRESETS.find((p) => p.id === id) || null;
  // Claude Code에 넘길 글 — ctx: { path(폴더 안 상대 경로), stage(예 '3단계 · 꼭 필요한 기능 정리하기'), note?(사람이 덧붙인 한 줄) }
  function requestOf(preset, ctx = {}) {
    const p = typeof preset === "string" ? byId(preset) : preset; if (!p) return "";
    const path = String(ctx.path || "").trim() || "(파일 이름 없음)", stage = String(ctx.stage || "지금 단계");
    return [`Floe 작업실에서 사람이 '${p.name}' 틀을 골랐어요. 파일: ${path} (지금 ${stage})`, "", ...p.lines({ path, stage }), ...(ctx.note ? ["", `사람이 덧붙인 말: ${String(ctx.note).slice(0, 300)}`] : []), "", EASY, ONLY(path), "끝나면 무엇을 바꿨는지 두 줄로 알려 주세요."].join("\n");
  }
  const checksOf = (preset) => { const p = typeof preset === "string" ? byId(preset) : preset; return p ? [...p.checks] : []; };
  const api = { PRESETS, byId, requestOf, checksOf, EASY };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.FloePresets = api;
})(typeof window !== "undefined" ? window : globalThis);
