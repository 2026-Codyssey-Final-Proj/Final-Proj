// claude-drafted: 2026-10-18 — 이재엽 요청("화면 빈칸을 채워", FR-12 "우선순위를 생각하고 정할 수 있게")으로 Claude가 썼다. 순수 함수만. 화면(app.js)이 쓴다.
// 넘어가기 전 확인의 '다음 할 일'에서 할 일마다 "꼭 할 일" / "나중에"를 고른다(기본: 꼭 할 일). 순서(reorder)는 그대로 사용자가 정한다.
// 제안(MoSCoW를 둘로 줄인 것) — 꼭(Must)·되도록(Should)·되면(Could)·이번엔 안 함(Won't) 넷은 비전공자에게 많아서 둘로 줄였다.
//   requirements.md FR-12의 "MoSCoW×Kano 재사용 안"은 아직 제안이다. 넷으로 늘릴지는 이재엽이 정한다.
(function (root) {
  const LABEL = { must: "꼭 할 일", later: "나중에" };
  const isLater = (later, text) => (later || []).includes(text);
  // 지금 할 일 순서 — 꼭 할 일을 정한 순서대로 먼저, 나중에 미룬 일은 뒤에(나중에만 남으면 그 순서대로). 원본은 바꾸지 않는다
  function order(todos, later) {
    if (!Array.isArray(todos)) return todos;
    return [...todos.filter((t) => !isLater(later, t)), ...todos.filter((t) => isLater(later, t))];
  }
  // 누를 때마다 꼭 ↔ 나중에
  const toggle = (later, text) => (isLater(later, text) ? later.filter((t) => t !== text) : [...(later || []), text]);

  const api = { LABEL, isLater, order, toggle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavPriority = api;
})(typeof window !== "undefined" ? window : globalThis);
