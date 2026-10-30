// claude-drafted: 2026-10-30 — C-24 공부 묶음 · NotebookLM 안내(이재엽 2026-10-23 "자세히 모르는 부분들은 … 노트북 LM을 사용해서 … 공부 시켜줄 수 있도록",
//   2026-10-30 "보드에서 없음 부분 전부 제작"). 사용자가 고른 것(지금 단계 설명 · 관문 계획서 · 용어 풀이 · 내 기록)을 글 파일 하나로 묶고
//   먼저 물을 질문 다섯을 붙인다. 내려받기만 — Floe는 NotebookLM에 보내지 않는다(올리는 것은 사용자, 그래서 밖으로 나가는 길이 늘지 않는다).
// 열린 칸은 Claude가 기본값으로 정했다(요구서 C-24 '확인할 것'): 직접 올리기만(기관용 Enterprise API는 대회 뒤) · 질문 다섯은 코드 목록(AI 없음).
// 순수 함수 — 화면(책 탭)이 쓴다. 가리기 · 찾기는 받은 함수(sensitive.js redact · scan). 시험 04-tests/navigator/study-pack.test.js
(function (root) {
  const node = typeof module !== "undefined" && module.exports;
  const N = node ? require("./navigator.js") : root.NavRules;
  const G = node ? require("./glossary.js") : root.NavGlossary;
  const GP = node ? require("./gateplan.js") : root.FloeGatePlan;
  const SOURCES = [["stage", "지금 단계 설명"], ["plan", "관문 계획서"], ["terms", "용어 풀이"], ["mine", "내 기록"]];
  const DEFAULT_PICK = ["stage", "plan", "terms"];   // 내 기록은 사람이 골라야 들어간다 — 내가 적은 글이 파일로 나가므로
  const GUIDE = [
    "notebooklm.google.com에 내 Google 계정으로 들어가요",
    "새 노트북을 만들고 '소스 추가'에 이 파일을 직접 올려요",
    "파일 끝의 질문 다섯부터 하나씩 물어봐요 — 답은 이 파일 안에서 근거를 짚어 줘요",
    "Floe는 NotebookLM에 아무것도 보내지 않아요 — 올리는 것은 나예요. 올리기 전에 파일을 한 번 열어 봐요",
  ];
  const label = (n) => `${n + 1}단계`;
  const one = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim();
  const termLines = (terms) => terms.map((t) => [t, G ? G.explain(t) : ""]).filter(([, l]) => l).map(([t, l]) => `- ${t} — ${l}`);
  const termsOf = (n, tier) => [...new Set([...N.criteriaFor(n, tier), ...N.criteriaFor(n + 1, tier)].map((c) => c && c.term).filter(Boolean))];

  // n — 지금 단계, pick — 고른 것(SOURCES의 열쇠), term — 용어로 들어왔으면 그 말, hide · scan — sensitive.js redact · scan
  function build({ n = 0, pick = DEFAULT_PICK, results = {}, tier, term = "", hide = (t) => t, scan = null } = {}) {
    const keys = SOURCES.map(([k]) => k).filter((k) => Array.isArray(pick) && pick.includes(k));
    if (!keys.length) return null;
    const s = N.STAGES[n] || N.STAGES[0], R = (k) => (results && (results[k] || results[String(k)])) || null, t = one(term).slice(0, 40);
    const parts = [];
    if (keys.includes("stage")) parts.push(`## 지금 단계 설명\n\n${label(s.n)} · ${s.title}\n\n- 받는 것: ${s.gets}\n- 하는 일: ${s.does}\n- 만드는 것: ${s.gives}\n${N.criteriaFor(s.n, tier).map((c) => `- 끝 조건: ${c.text}`).join("\n")}`);
    if (keys.includes("plan") && GP) parts.push(`## 관문 계획서\n\n${GP.toMarkdown(GP.build(s.n, { results, tier })).replace(/^# /, "### ").replace(/\n## /g, "\n#### ")}`);
    if (keys.includes("terms")) { const ts = [...new Set([...(t ? [t] : []), ...termsOf(s.n, tier)])]; const lines = termLines(ts); parts.push(`## 용어 풀이\n\n${lines.length ? lines.join("\n") : "- 이 단계에 풀이할 말이 없어요"}`); }
    if (keys.includes("mine")) {
      const rows = N.STAGES.map((x) => x.n).filter((k) => k <= s.n && R(k)).map((k) => { const r = R(k);
        const lines = (Array.isArray(r.items) ? r.items : []).map((it) => `- ${one(it.name)}: ${(Array.isArray(it.lines) ? it.lines : []).map(one).filter(Boolean).join(" / ") || "비었어요"}`);
        return `### ${label(k)} · ${N.STAGES[k].title}\n\n${lines.join("\n")}${one(r.learned) ? `\n- 배운 것: ${one(r.learned)}` : ""}`; });
      parts.push(`## 내 기록\n\n${rows.length ? rows.join("\n\n") : "아직 적은 칸이 없어요"}`);
    }
    const focus = t || (N.criteriaFor(s.n, tier).find((c) => c.term) || {}).term || s.title;
    const questions = [
      `${focus}${t ? "" : "(이 단계에서 쓰는 말)"}이 무엇인지 쉬운 예를 하나 들어 설명해 줘`,
      `${label(s.n)} '${s.title}'에서 처음 하는 사람이 가장 자주 빠뜨리는 것은 뭐야?`,
      `'${s.does}'를 하지 않고 넘어가면 다음 단계에서 무슨 일이 생겨?`,
      `이 파일에서 내가 정한 것 중 다시 생각해 볼 만한 곳을 근거와 함께 짚어 줘`,
      `다음 단계로 가기 전에 스스로 확인할 질문 셋을 만들어 줘`,
    ];
    const raw = `# 공부 묶음 — ${label(s.n)} · ${s.title}${t ? ` · ${t}` : ""}\n\nFloe가 만든 공부 자료예요. 내 NotebookLM에 직접 올려 물어봐요.\n\n${parts.join("\n\n")}\n\n## 먼저 물을 질문 다섯\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`;
    const masked = scan ? [...new Set(((scan(raw) || {}).findings || []).map((f) => f.label))] : [];   // 무엇을 가렸는지 종류만 — 값은 다시 보이지 않는다
    const safe = t.replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
    return { name: `${label(s.n)} 공부 묶음${t ? ` · ${t}` : ""}`, file: `study-pack-${s.n + 1}${safe ? `-${safe}` : ""}.md`, text: String(hide(raw)), questions, masked };
  }
  const api = { SOURCES, DEFAULT_PICK, GUIDE, build };
  if (node) module.exports = api;
  else root.FloeStudyPack = api;
})(typeof window !== "undefined" ? window : globalThis);
