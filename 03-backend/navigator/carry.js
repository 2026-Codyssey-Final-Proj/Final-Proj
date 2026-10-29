// claude-drafted: 2026-10-29 — 지식 퀘스트 C-48(지식 퀘스트 PRD 6절 · 9절 1 · 2번 이재엽 버튼 "이 컴퓨터의 Floe 폴더" · "기준 다섯 그대로, 프로젝트당 3개, 미루면 보류").
// 가져갈 것 — 8단계(돌아보기)에서 단계마다 쓴 배운 것 · 결정 기록을 묶어 초안 1 ~ 3개를 만들고(AI 한 번 — navigator.js carryPrompt), 기준 다섯으로 재서 보이고,
//   사람이 고쳐 채택 · 반려(까닭과 보관) · 보류(다음 프로젝트를 시작할 때 다시 묻기)를 고른다. 채택한 것은 다음 프로젝트의 그 단계에서 최대 3개를 보이고 이번에 쓸지 고르게 한다.
// 이 파일은 규칙만(순수) — 기준 재기 · 다듬기 · 고르기 · 장부(파일 하나)의 모양. 파일 읽기 · 쓰기는 server.js. 시험 04-tests/navigator/knowledge-carry.test.js
(function (root) {
  const node = typeof module !== "undefined" && module.exports;
  const STAGES = 8, DRAFT_MAX = 3, SHOW_MAX = 3, TEXT_MAX = 160, WHY_MAX = 200, REASON_MAX = 200, ITEMS_MAX = 300;
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const filled = (t) => typeof t === "string" && t.trim().length > 0;
  // 기준 다섯(PRD 6절 C-48 — Simplify의 W1 ~ W10을 쉬운 말로 줄인 것) — [열쇠, 쉬운 말]
  const CRITERIA = [
    ["from", "근거 단계가 둘 이상"],
    ["why", "왜(무슨 일이 있었나)"],
    ["text", "다음엔 이렇게(할 일 한 줄)"],
    ["stage", "언제 쓰나(어느 단계)"],
    ["review", "언제 다시 볼까(날짜)"],
  ];
  // 초안 하나를 잰다 — { from: true, why: false, … }. today(YYYY-MM-DD)보다 앞선 날짜는 '언제 다시 볼까'를 못 채운 것
  function measure(d, today) {
    const from = Array.isArray(d && d.from) ? [...new Set(d.from.filter((n) => Number.isInteger(n) && n >= 0 && n < STAGES))] : [];
    return {
      from: from.length >= 2,
      why: filled(d && d.why),
      text: filled(d && d.text),
      stage: Number.isInteger(d && d.stage) && d.stage >= 0 && d.stage < STAGES,
      review: !!(d && typeof d.review === "string" && DATE.test(d.review) && (!today || d.review > today)),
    };
  }
  const passes = (m) => CRITERIA.every(([k]) => m[k]);
  const missing = (m) => CRITERIA.filter(([k]) => !m[k]).map(([, w]) => w);
  // 초안 하나를 다듬는다 — 모양이 틀리면 null. 긴 글은 잘라 쓰고, 단계는 0 ~ 7만(아니면 -1 — 정하지 않음), 날짜는 YYYY-MM-DD만(아니면 ""), 근거 단계는 겹치지 않게
  function clean(d) {
    if (!d || typeof d !== "object") return null;
    const from = Array.isArray(d.from) ? [...new Set(d.from.filter((n) => Number.isInteger(n) && n >= 0 && n < STAGES))].sort((a, b) => a - b) : [];
    const review = typeof d.review === "string" && DATE.test(d.review.trim()) ? d.review.trim() : "";
    return { text: String(d.text || "").trim().slice(0, TEXT_MAX), why: String(d.why || "").trim().slice(0, WHY_MAX), stage: Number.isInteger(d.stage) && d.stage >= 0 && d.stage < STAGES ? d.stage : -1, review, from };
  }
  // 장부(이 컴퓨터의 Floe 폴더 파일 하나) — { v: 1, items: [{ id, text, why, stage, review, from, project, state, reason?, at }] }. state: adopted · rejected · held. 깨졌으면 빈 장부
  const blank = () => ({ v: 1, items: [] });
  const STATES = ["adopted", "rejected", "held"];
  function revive(j) {
    if (!j || j.v !== 1 || !Array.isArray(j.items)) return blank();
    return { v: 1, items: j.items.filter((x) => x && typeof x.id === "string" && STATES.includes(x.state) && filled(x.text)).slice(-ITEMS_MAX) };
  }
  // 사람이 고른 것을 장부에 — 반려 · 보류도 지우지 않고 남긴다(C-52 보관). 같은 id면 고쳐 쓴다
  //   key — 어느 프로젝트에서 왔나(폴더 열쇠 — 이름이 같은 다른 폴더와 가른다), project — 보일 이름, docs — 근거 단계 문서(그 프로젝트 안의 경로)
  function decide(book, item, state, { reason = "", project = "", key = "", docs = [], at = "", id = "" } = {}) {
    if (!STATES.includes(state)) return null;
    const c = clean(item);
    if (!c || !filled(c.text)) return null;
    if (state === "rejected" && !filled(reason)) return null;   // 반려는 까닭과 함께
    if (state === "adopted" && c.stage < 0) return null;   // 언제 쓰나(단계)가 없으면 어느 프로젝트에서도 보이지 않는다 — 채택하지 않는다
    const rid = id || `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, was = book.items.find((x) => x.id === rid);
    if (was && was.state === "rejected") return null;   // 반려 기록은 덮지 않는다(까닭이 지워지지 않게 — C-52 보관)
    // 다시 고르면(보류 → 채택) 온 프로젝트 · 근거 문서는 그대로
    const row = { id: rid, ...c, project: was ? was.project : String(project).slice(0, 60), key: was ? was.key : String(key || project).slice(0, 60),
      docs: was && Array.isArray(was.docs) ? was.docs : docs.filter((x) => typeof x === "string").slice(0, STAGES), state, ...(filled(reason) ? { reason: reason.trim().slice(0, REASON_MAX) } : {}), at };
    return { v: 1, items: [...book.items.filter((x) => x.id !== rid), row].slice(-ITEMS_MAX) };
  }
  // 다음 프로젝트의 그 단계에 보일 것 — 채택한 것 중 그 단계에 닿는 것, 다른 프로젝트(열쇠)에서 온 것, 최근 것부터 최대 3개
  const other = (x, key) => (x.key || x.project) !== key;
  const forStage = (book, stage, key = "") => book.items.filter((x) => x.state === "adopted" && x.stage === stage && other(x, key)).slice(-SHOW_MAX).reverse();
  // 보류한 것 — 다음 프로젝트를 시작할 때 다시 묻는다
  const held = (book, key = "") => book.items.filter((x) => x.state === "held" && other(x, key));
  // 초안이 기준을 몇 개 채웠나 — 한 번 다시 물은 뒤 초안마다 더 나은 쪽을 고른다
  const score = (d, today) => { const m = measure(d, today); return CRITERIA.filter(([k]) => m[k]).length; };

  // 오늘 날짜(이 컴퓨터의 시간대) — '언제 다시 볼까'는 오늘 뒤
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const api = { today, score, CRITERIA, DRAFT_MAX, SHOW_MAX, TEXT_MAX, WHY_MAX, REASON_MAX, measure, passes, missing, clean, blank, revive, decide, forStage, held };
  if (node) module.exports = api;
  else root.FloeCarry = api;
})(typeof window !== "undefined" ? window : globalThis);
