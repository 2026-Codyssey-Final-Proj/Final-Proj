// claude-drafted: 2026-10-24 — C-34 준비 계획판 · C-32 맡길 일 목록(이재엽 "한번에 내용들을 넣으면 어떻게 준비하고 기준들을 사람들이 확인해서 너한테 의견들을 바로바로 넣을 수 있도록" ·
// 버튼 "처음 설정 새 칸 + 맡기기" · "Claude Code가 기준마다 보고" · "맡길 일 목록으로").
// 계획판 한 장의 규칙 — 순수 함수만(서버 · AI 없음). 화면(app.js)이 쓰고 시험(04-tests/navigator/plan-board.test.js)이 본다. 계획 자체는 서버(/api/plan, navigator.js planPrompt)가 세운다.
//   확인할 때: 줄(요구 + 기준)마다 맞아요 / 고칠래요 + 의견, 물을 것마다 답, 전체 의견 → 다시 세우기(판 번호 +1) 또는 모든 줄이 맞아요면 확정.
//   확정한 뒤: 줄 하나가 맡길 일 하나 — 남음(todo) → 맡김 중(running) → 보고 옴(report) → 끝냄(done). 끝냄은 사람이 보고를 보고 '맞아요'를 눌러야. 한 번에 하나만 맡긴다.
//   맡길 일은 **순서대로**(C-35, 2026-10-24 이재엽 "순차적으로 할려면 퀘스트내용에서 진행" · 버튼 "맡길 일 퀘스트 하나로") — 앞 줄을 끝내야 다음 줄이 열린다(next).
// 함수는 받은 판을 바꾸지 않고 새 판을 돌려준다.
(function (root) {
  const MARKS = ["ok", "fix"];
  const STATES = ["todo", "running", "report", "done"];
  const clone = (b) => JSON.parse(JSON.stringify(b));
  const has = (b, id) => !!b && !!b.plan && b.plan.items.some((x) => x.id === id);
  const item = (b, id) => b.plan.items.find((x) => x.id === id);
  const filled = (s) => typeof s === "string" && s.trim() !== "";

  // 새 판 — prev가 있으면(다시 세움) 판 번호를 이어 가고, 요구 · 기준이 그대로인 줄의 맞아요만 옮긴다(바뀐 줄만 다시 본다). 의견 · 답은 새로.
  // example — 연습의 예시 계획(FR-10). 모드를 바꿔도 예시라고 보이고 진짜 Claude Code로 넘기지 않게 판에 남긴다
  function board(plan, prev, { example = false } = {}) {
    const marks = {};
    if (prev && prev.plan) for (const x of plan.items) { const old = prev.plan.items.find((y) => y.need === x.need && y.check === x.check); if (old && prev.marks[old.id] === "ok") marks[x.id] = "ok"; }
    return { v: prev && Number.isInteger(prev.v) ? prev.v + 1 : 1, plan, marks, notes: {}, answers: (plan.ask || []).map(() => ""), general: "", confirmed: false, work: {}, example: !!example };
  }
  const mark = (b, id, v) => { if (!has(b, id) || !MARKS.includes(v)) return b; const n = clone(b); n.marks[id] = v; return n; };
  const note = (b, id, text) => { if (!has(b, id)) return b; const n = clone(b); n.notes[id] = String(text || "").slice(0, 300); return n; };
  const answer = (b, i, text) => { if (!Number.isInteger(i) || i < 0 || i >= b.answers.length) return b; const n = clone(b); n.answers[i] = String(text || "").slice(0, 300); return n; };
  const unmarked = (b) => b.plan.items.filter((x) => !b.marks[x.id]).length;
  const canConfirm = (b) => !b.confirmed && b.plan.items.every((x) => b.marks[x.id] === "ok");
  // 다시 세울 때 서버에 보낼 것(API.md 3-20) — 고칠래요 줄 중 의견이 있는 것 · 답한 질문 · 전체 의견
  function feedback(b) {
    return {
      notes: b.plan.items.filter((x) => b.marks[x.id] === "fix" && filled(b.notes[x.id])).map((x) => ({ need: x.need, check: x.check, note: b.notes[x.id].trim() })),
      answers: (b.plan.ask || []).map((q, i) => ({ q, a: (b.answers[i] || "").trim() })).filter((x) => x.a),
      general: (b.general || "").trim(),
    };
  }
  const hasFeedback = (b) => { const f = feedback(b); return f.notes.length > 0 || f.answers.length > 0 || !!f.general; };
  const confirm = (b) => { if (!canConfirm(b)) return b; const n = clone(b); n.confirmed = true; n.work = Object.fromEntries(n.plan.items.map((x) => [x.id, { state: "todo" }])); return n; };

  // ── 확정한 뒤 — 맡길 일 목록 ──
  const stateOf = (b, id) => (b.work && b.work[id] && b.work[id].state) || "todo";
  const running = (b) => (b.plan.items.find((x) => stateOf(b, x.id) === "running") || {}).id || "";
  // 지금 줄 — 확정한 판에서 아직 끝내지 않은 첫 줄. 확정 전이거나 다 끝냈으면 ""
  const next = (b) => (b && b.confirmed ? (b.plan.items.find((x) => stateOf(b, x.id) !== "done") || {}).id || "" : "");
  // 맡길 글 · 기준 — 사용자가 '다르게 봐요'로 단 의견이 있으면 붙인다(서버가 navigator.js taskBrief로 기준과 보고 말을 더한다)
  function taskFor(b, id) {
    const x = item(b, id), w = b.work[id] || {};
    // C-50(2026-10-29): 다시 맡기면 지난번 보고 한 줄도 붙인다 — 앞에서 한 일을 다시 하지 않게(지식 퀘스트 PRD 9절 7번 '새로 맡기며 앞 보고만')
    return { text: [x.need, ...(w.note ? [`지난번에 사용자가 다르게 본 점: ${w.note}`] : []), ...(w.prev ? [`지난번 보고: ${w.prev}`] : [])].join("\n"), checks: [x.check] };
  }
  const setWork = (b, id, w) => { const n = clone(b); n.work[id] = { ...(n.work[id] || {}), ...w }; return n; };
  // at — 서버가 알려 준 그 일의 시작 때(/api/task의 at). 끝났는지 물을 때 다른 일의 결과를 이 줄의 것으로 받지 않게
  const start = (b, id, at = null) => (!b.confirmed || !has(b, id) || running(b) || id !== next(b) ? b : setWork(b, id, { state: "running", at }));
  const report = (b, id, rep) => (stateOf(b, id) === "running" ? setWork(b, id, { state: "report", report: rep || null, fail: undefined }) : b);
  const accept = (b, id) => (stateOf(b, id) === "report" ? setWork(b, id, { state: "done" }) : b);
  const prevOf = (r) => (r && r.easy ? `${String(r.easy).slice(0, 160)} (끝 조건 ${r.done}/${r.total})` : "");
  const reject = (b, id, why) => (stateOf(b, id) === "report" ? setWork(b, id, { state: "todo", note: String(why || "").trim().slice(0, 300), prev: prevOf((b.work[id] || {}).report), report: null }) : b);
  // 보고를 받지 못하고 끝났다(실패 · 막힘 · 멈춤 · 모양이 틀림) — 다시 맡길 수 있게 남음으로 두되, 까닭과 횟수를 남긴다(C-50 '조용히 되돌리지 않는다', 2026-10-29)
  const failed = (b, id, why = "") => { if (stateOf(b, id) !== "running") return b; const f = (b.work[id] || {}).fail;
    return setWork(b, id, { state: "todo", fail: { why: String(why || "").trim().slice(0, 200) || "보고를 받지 못했어요", n: ((f && f.n) || 0) + 1 } }); };
  const progress = (b) => ({ done: b.plan.items.filter((x) => stateOf(b, x.id) === "done").length, total: b.plan.items.length });

  // 저장했던 판(브라우저 저장소) — 모양이 틀리면 null
  function revive(b) {
    if (!b || typeof b !== "object" || !Number.isInteger(b.v) || !b.plan || !Array.isArray(b.plan.items) || !b.plan.items.length) return null;
    if (!b.plan.items.every((x) => x && filled(x.id) && filled(x.need) && filled(x.check))) return null;
    const strs = (a) => Array.isArray(a) && a.every((x) => typeof x === "string");
    if (!["problem", "have", "missing"].every((k) => typeof b.plan[k] === "string") || !strs(b.plan.prep) || !strs(b.plan.ask)) return null;
    for (const k of ["marks", "notes", "work"]) if (!b[k] || typeof b[k] !== "object" || Array.isArray(b[k])) return null;
    if (!Array.isArray(b.answers) || typeof b.general !== "string" || typeof b.confirmed !== "boolean") return null;
    if (Object.values(b.work).some((w) => !w || !STATES.includes(w.state))) return null;
    return b;
  }

  // 연습(서버 없이 FR-10) — 예시 계획 · 예시 보고. 화면에 '예시예요'를 같이 적는다
  const EXAMPLE_PLAN = {
    problem: "동아리 행사 신청을 종이로 받아서 누가 신청했는지 헷갈려요", have: "아직 없어요", missing: "신청 화면과 신청한 사람 목록이 없어요",
    items: [
      { id: "p1", need: "회원이 이름을 적고 신청 단추를 누르면, 앱은 신청을 받는다", check: "신청 단추를 누르면 목록에 그 이름이 한 줄 생긴다" },
      { id: "p2", need: "운영진이 목록을 열면, 앱은 신청한 사람을 보여 준다", check: "목록 화면에 신청한 이름이 모두 보인다" },
      { id: "p3", need: "마감이 지나면, 앱은 신청을 더 받지 않는다", check: "마감 뒤에 신청 단추를 누르면 '마감됐어요'가 뜬다" },
    ],
    prep: ["신청할 때 적을 칸 정하기(이름 · 학번 같은)", "마감 날짜 정하기"], ask: ["마감은 언제인가요?"], say: "계획을 세웠어요. 줄마다 맞는지 봐 주세요.",
  };
  const exampleReport = (checks) => {
    const items = checks.map((check, i) => ({ check, done: i === 0, evidence: i === 0 ? "예시: form.html에 신청 칸을 만들었어요" : "" }));
    return { items, easy: "예시예요. 신청하는 종이를 화면으로 만들었어요.", ask: "", done: items.filter((x) => x.done).length, total: items.length };
  };

  const api = { board, mark, note, answer, unmarked, canConfirm, feedback, hasFeedback, confirm, stateOf, running, next, taskFor, start, report, accept, reject, failed, progress, revive, EXAMPLE_PLAN, exampleReport };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloePlan = api;
})(typeof window !== "undefined" ? window : globalThis);
