// claude-drafted: 2026-10-18 — 이재엽 요청("화면 빈칸을 채워", FR-7 "작업 내용을 알림으로 기록하고 해당 할 일을 끝났다고 표시")으로 Claude가 썼다. 순수 함수만. 화면(app.js)이 쓴다.
// 알림 기록 — AI 코딩 도구(Claude Code·Codex)가 보낸 알림을 [때, 도구, 한 줄]로 쌓는다. 연습(시연)에서는 '작업 장면 보기'가 보내는 연습 알림.
// 한 줄은 서버가 준 글 그대로다(summary가 있으면 그것, 없으면 작업 글의 마지막 줄). 지어내지 않는다.
// 비밀번호·키처럼 보이면(scan) 내용을 남기지 않고 숨겼다고만 적는다. 기록은 이 브라우저에만 남는다.
(function (root) {
  const MAX = 20, LINE_MAX = 80;
  const KIND = { stop: "작업을 마쳤어요", prompt: "새 작업을 시작했어요" };
  const squash = (t) => String(t || "").replace(/\s+/g, " ").trim();
  const cut = (t) => (t.length > LINE_MAX ? `${t.slice(0, LINE_MAX - 1)}…` : t);
  function summary(ev) {
    const own = squash(ev && ev.summary);
    if (own) return cut(own);
    const lines = String((ev && ev.work) || "").split("\n").map(squash).filter(Boolean);
    return cut(lines.length ? lines[lines.length - 1] : "");
  }
  // 새것이 위에, MAX개까지. scan(글) → 참이면 숨긴다. 원본은 바꾸지 않는다
  function add(list, ev, scan) {
    const line = summary(ev), hidden = !!(line && scan && scan(line));
    const e = { at: ev.at, kind: ev.kind, tool: ev.tool, project: ev.project || "", line: hidden ? "" : line, hidden, sim: !!ev.sim, done: [] };
    return [e, ...(list || [])].slice(0, MAX);
  }
  // 가장 최근 알림에 '이 알림으로 끝낸 할 일'을 붙인다
  const markDone = (list, done) => (list && list.length ? [{ ...list[0], done: done.slice() }, ...list.slice(1)] : []);
  // 다시 살펴본 뒤 새로 끝낸 할 일 — 같은 단계에서 전에는 안 했고 지금은 한 것. 단계가 바뀌었으면 지금 단계에서 한 것
  function newlyDone(before, after) {
    if (!after || !Array.isArray(after.criteria)) return [];
    const prev = before && before.stage === after.stage && Array.isArray(before.criteria) ? before.criteria : [];
    return after.criteria.filter((c, i) => c.met && !(prev[i] && prev[i].met)).map((c) => c.text);
  }

  // 시연 안전장치(2026-10-18) — 설정에서 '연결 끊기'를 누르면 서버에서 들어온 알림을 받지 않는다(글 칸을 채우지도, 살펴보지도 않는다).
  // '작업 장면 보기'의 연습 알림(sim)은 이 화면이 스스로 만든 것이라 받는다
  const accept = (ev, unplugged) => !!ev && (!unplugged || !!ev.sim);
  // 알리는 것은 작업을 마쳤을 때(stop)만 — 새 작업을 시작했을 때(prompt)는 기록 · 채팅 줄 · 한 줄 알림 모두 하지 않는다(이재엽 2026-10-23 "플로로가 작업을 다 끝나면 알람이 오도록")
  const notifies = (ev) => !!ev && ev.kind === "stop";
  // 알림 기록 비우기 — 이 화면의 기록은 늘 비우고, 서버(POST /api/events/clear)의 답을 쉬운 말로. status: 서버 답 번호, 0 = 연결 못 함, null = 서버 없이 연 화면
  function clearNote(status) {
    if (status === null || status === undefined) return "이 화면의 알림 기록을 비웠어요.";
    if (status >= 200 && status < 300) return "알림 기록을 비웠어요. 서버에 남아 있던 작업 글도 지웠어요.";
    const why = status === 0 ? "서버에 연결하지 못해서" : status === 404 ? "이 서버에는 아직 기록 비우기가 없어서"
      : status === 401 || status === 403 ? "서버가 이 화면을 알아보지 못해서(화면을 새로 고친 뒤 다시 해 보세요)" : "서버에서 문제가 생겨서";
    return `이 화면의 기록은 비웠어요. ${why} 서버 쪽 기록은 그대로예요.`;
  }

  const api = { MAX, LINE_MAX, KIND, summary, add, markDone, newlyDone, accept, notifies, clearNote };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavAlerts = api;
})(typeof window !== "undefined" ? window : globalThis);
