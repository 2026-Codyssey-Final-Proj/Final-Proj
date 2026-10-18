// claude-drafted: 2026-10-18 — 이재엽 요청("화면 빈칸을 채워", 등급 보내기)으로 Claude가 썼다. 순수 함수만. 화면(app.js)이 쓴다.
// 만드는 크기(규모 등급) — 등급별 할 일은 navigator.js의 criteriaFor(v2/judge-rules-final)가 정한다. 여기는 화면 쪽 맞추기만:
//   연습 장면(scenario.js)과 미리 만든 답은 Full 순서로 적혀 있다 → 그 등급이 하는 할 일의 자리(i)만 남긴다.
//   등급을 바꾸면 이미 본 결과를 글자로 맞춰 옮긴다(진짜 AI를 다시 부르지 않는다).
(function (root) {
  const N = typeof module !== "undefined" && module.exports ? require("./navigator.js") : root.NavRules;
  // [서버에 보내는 값, 화면 이름] — 01-docs/00-overview/scope-tiers.md. 기본은 크게(Full)
  const LABELS = [["Lite", "작게"], ["Xpress", "보통"], ["Full", "크게"]];
  // 이 등급이 하는 할 일이 Full 목록의 몇 번째인가
  function keep(n, tier) {
    const all = N.STAGES[n] ? N.STAGES[n].criteria : [], mine = N.criteriaFor(n, tier);
    return all.map((c, i) => (mine.includes(c) ? i : -1)).filter((i) => i >= 0);
  }
  // Full 순서 목록에서 그 자리만 — Full 개수가 아닌 목록은 이미 맞춘 것으로 보고 그대로 둔다
  function fit(list, n, tier) {
    if (!Array.isArray(list) || !N.STAGES[n] || list.length !== N.STAGES[n].criteria.length) return list;
    return keep(n, tier).map((i) => list[i]);
  }
  const fitJudgement = (raw, n, tier) => (raw && Array.isArray(raw.criteria) ? { ...raw, criteria: fit(raw.criteria, n, tier) } : raw);
  // 등급을 바꿨을 때 — 그 등급의 할 일 목록으로 다시 세우되, 이미 본 것은 글자가 같은 할 일에서 가져온다. 새로 생긴 할 일은 '아직'
  function refit(j, tier) {
    const had = Array.isArray(j.criteria) ? j.criteria : [];
    return { ...j, criteria: N.criteriaFor(j.stage, tier).map((c) => {
      const old = had.find((x) => x.text === c.text);
      return old ? { ...old, term: c.term } : { text: c.text, term: c.term, met: false, evidence: "" };
    }) };
  }

  const api = { LABELS, keep, fit, fitJudgement, refit };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavTiers = api;
})(typeof window !== "undefined" ? window : globalThis);
