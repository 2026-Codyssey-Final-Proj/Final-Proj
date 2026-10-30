// claude-drafted: 2026-10-30 — C-27 관문 계획서(이재엽 2026-10-23 "게이트를 넘어갈때마다 전체 프로세서를 이해할 수 있도록 계획서 … 목차를 들어가면 바로 확인",
//   2026-10-30 "보드에서 없음 부분 전부 제작"). 관문에 들어서면 그 단계까지의 계획서 한 권 —
//   ① 전체 그림(여덟 단계와 지금 자리) ② 이번 단계에서 한 일 ③ 정한 것 · 배운 말 ④ 다음 단계 — 할 일과 끝 조건 ⑤ 공부할 말, 맨 앞에 목차.
// 열린 칸은 Claude가 기본값으로 정했다(요구서 C-27 '확인할 것'): 관문마다 늘 · 절 · 목차 · 글 모두 규칙(AI를 부르지 않는다 — 연습 모드 · 서버 없이도) ·
//   파일로도(docs.js가 단계 폴더에 gate-plan.md — C-24 공부 묶음의 재료).
// 순수 함수 — 화면(책 탭 · 관문 카드) · 문서(docs.js) · 공부 묶음(studypack.js)이 같이 쓴다. 시험 04-tests/navigator/gate-plan.test.js
(function (root) {
  const node = typeof module !== "undefined" && module.exports;
  const N = node ? require("./navigator.js") : root.NavRules;
  const G = node ? require("./glossary.js") : root.NavGlossary;
  // 칸마다 누가 정했나 — 단계 문서 · 결정 기록(docs.js)과 같은 말
  const HOW_WORDS = { ok: "플로로 초안을 그대로", edit: "고침", me: "직접 적음(초안 없이)", pick: "고름", chat: "플로로와 나눈 대화를 정리해 적음(작업실 개편 C-61)", moved: "지난 칸 · 파일에서 옮겨 적음", skip: "조건이 안 맞아 건너뜀" };
  const TITLES = ["전체 그림 — 지금 자리", "이번 단계에서 한 일", "정한 것 · 배운 말", "다음 단계 — 할 일과 끝 조건", "공부할 말"];
  const LINE_MAX = 160;
  const label = (n) => `${n + 1}단계`;
  const one = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim();
  const clip = (t) => { const s = one(t); return s.length > LINE_MAX ? `${s.slice(0, LINE_MAX - 1)}…` : s; };
  const firstLine = (it) => (Array.isArray(it && it.lines) ? it.lines : []).map(one).find(Boolean) || "";
  // 기준의 용어 → 풀이가 있는 것만. '보안 점검 — 보안 요구(EARS Unwanted)'처럼 긴 이름은 풀이가 없으면 뺀다
  const termRows = (crit) => { const seen = new Set(), out = [];
    for (const c of crit) { const t = c && c.term; if (!t || seen.has(t)) continue; seen.add(t); const line = G ? G.explain(t) : ""; if (line) out.push(`${t} — ${line}`); }
    return out; };

  // n — 관문에 선 단계(0 ~ 7). results — 단계 결과({ n: { items, passed, learned, … } }), tier — 등급(끝 조건), hide — 가리기(sensitive.js redact)
  function build(n, { results = {}, tier, hide = (t) => t } = {}) {
    const R = (k) => (results && (results[k] || results[String(k)])) || null, r = R(n), s = N.STAGES[n] || { title: "" }, nx = N.STAGES[n + 1];
    const red = (t) => clip(hide(one(t)));
    const id = (k) => `gp-${n + 1}-${k}`;
    const big = N.STAGES.map((x, k) => { const rk = R(k);
      return k === n ? `▶ ${label(k)} · ${x.title} — 지금` : rk && rk.passed ? `✓ ${label(k)} · ${x.title} — 지남 ${String(rk.passed).slice(0, 10)}` : `· ${label(k)} · ${x.title}`; });
    const items = r && Array.isArray(r.items) ? r.items : [];
    const did = items.length ? items.map((it) => `${one(it.name)} — ${red(firstLine(it)) || "비었어요"}`) : ["아직 적은 칸이 없어요"];
    const decided = items.filter((it) => firstLine(it)).map((it) => `${red(firstLine(it))}${HOW_WORDS[it.by] ? ` (${HOW_WORDS[it.by]})` : ""}`);
    const learned = r && one(r.learned) ? [`배운 것: ${red(r.learned)}`] : [];
    const words = termRows(N.criteriaFor(n, tier)).map((x) => `이 단계의 말: ${x}`);
    const mine = [...decided, ...learned, ...words];
    const next = nx ? [`${label(n + 1)} · ${nx.title} — ${nx.does}`, ...N.criteriaFor(n + 1, tier).map((c) => `끝 조건: ${c.text}`)] : ["마무리 — 이 단계를 지나면 프로젝트의 한 바퀴가 끝나요. 돌아보기에서 가져갈 것을 골라요"];
    const study = [...new Set([...termRows(nx ? N.criteriaFor(n + 1, tier) : []), ...termRows(N.criteriaFor(n, tier))])];
    const rows = [big, did, mine.length ? mine : ["아직 정한 것이 없어요"], next, study.length ? study : ["새로 배울 말이 없어요"]];
    return { n, title: `${label(n)} 관문 계획서 · ${s.title}`, toc: TITLES.map((t, k) => ({ id: id(k + 1), title: t })),
      sections: TITLES.map((t, k) => ({ id: id(k + 1), title: t, rows: rows[k] })) };
  }
  // 파일로 — 목차 줄이 절 이름표(<a id>)로 이어진다. 글은 build에서 이미 가렸다
  function toMarkdown(b) {
    const toc = b.toc.map((t, k) => `${k + 1}. [${t.title}](#${t.id})`).join("\n");
    const body = b.sections.map((s, k) => `<a id="${s.id}"></a>\n## ${k + 1}. ${s.title}\n\n${s.rows.map((r) => `- ${r}`).join("\n")}\n`).join("\n");
    return `# ${b.title}\n\nFloe가 관문에서 만든 계획서예요 — 지금까지 한 것과 다음에 할 것. 목차를 누르면 그 절로 가요.\n\n## 목차\n\n${toc}\n\n${body}`;
  }
  const api = { HOW_WORDS, TITLES, build, toMarkdown };
  if (node) module.exports = api;
  else root.FloeGatePlan = api;
})(typeof window !== "undefined" ? window : globalThis);
