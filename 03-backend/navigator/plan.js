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
    return { text: [x.need, ...(w.note ? [`지난번에 사용자가 다르게 본 점: ${w.note}`] : []), ...(w.prev ? [`지난번 보고: ${w.prev}`] : []), ...(w.fail ? [`지난번에 끝까지 못 했어요: ${w.fail.why} — 이미 끝낸 일은 다시 하지 말고 이어서`] : [])].join("\n"), checks: [x.check] };
  }
  const setWork = (b, id, w) => { const n = clone(b); n.work[id] = { ...(n.work[id] || {}), ...w }; return n; };
  // at — 서버가 알려 준 그 일의 시작 때(/api/task의 at). 끝났는지 물을 때 다른 일의 결과를 이 줄의 것으로 받지 않게
  const start = (b, id, at = null) => (!b.confirmed || !has(b, id) || running(b) || id !== next(b) ? b : setWork(b, id, { state: "running", at }));
  // verdict — 서버가 기준을 세어 준 미리 보기(/api/task의 verdict). 화면은 이 값을 쓰고 다시 만들지 않는다(없던 옛 기록만 화면이 센다)
  const report = (b, id, rep, verdict = null) => (stateOf(b, id) === "running" ? setWork(b, id, { state: "report", report: rep || null, verdict: verdict || undefined, fail: undefined }) : b);
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

  // ── 지식 퀘스트 C-51(2026-10-29 — PRD 6절 · 9절 9번 "규칙으로(결정 기록의 낱말)"): 앞의 결정과 다름 ──
  //   사람이 정한 줄(단계 문서의 칸 — 결정 기록의 '정한 것'과 같은 줄)에서 갈래(만들 곳 · 언어 · 저장)마다 한 낱말만 나오면 그 줄의 결정, 뒤 줄이 앞 줄을 덮는다.
  //   계획 줄이 같은 갈래의 다른 낱말만 쓰면 '앞의 결정과 다름'. 규칙이 모르는 것은 다르다고 하지 않는다 —
  //   갈래 밖 낱말은 보지 않고, 한 줄에 같은 갈래 낱말이 둘이면(후보 · 견주기) 결정이 아니고, 낱말 안쪽(웹훅 · MongoDB)은 낱말로 치지 않는다.
  //   '앱' 하나만은 넣지 않는다 — '신청하면, 앱은 받는다'처럼 만드는 것을 두루 가리키는 말이라(모바일 앱 · 휴대폰 앱만)
  const KINDS = [
    { kind: "만들 곳", words: { 웹: ["웹 페이지", "웹페이지", "웹사이트", "웹앱", "홈페이지", "웹"], 앱: ["모바일 앱", "모바일앱", "휴대폰 앱", "스마트폰 앱"], 데스크톱: ["데스크톱 앱", "데스크톱", "PC 프로그램"], 터미널: ["명령줄", "터미널"] } },
    { kind: "언어", words: { 파이썬: ["파이썬", "python"], 자바스크립트: ["자바스크립트", "javascript"], 타입스크립트: ["타입스크립트", "typescript"], 자바: ["자바", "java"] } },
    { kind: "저장", words: { 엑셀: ["엑셀", "excel"], 데이터베이스: ["데이터베이스", "db", "디비"], "구글 시트": ["구글 시트", "스프레드시트"], 노션: ["노션", "notion"], 파일: ["텍스트 파일", "csv 파일", "csv"] } },
  ];
  const FORMS = KINDS.flatMap((k) => Object.entries(k.words).flatMap(([word, forms]) => forms.map((f) => ({ kind: k.kind, word, f: f.toLowerCase() })))).sort((a, b) => b.f.length - a.f.length);
  const LETTER = /[가-힣A-Za-z0-9]/, PARTICLE = /^(으로|로|에서|에게|에|을|를|이나|이|가|은|는|과|와|도|만|의|처럼|하고|까지|부터|보다|나)/;
  const NOT_DECIDED = /(않|말고|아니|빼고|내려받|내보내|다운로드|뽑아)/;   // 뒤 열두 글자 안 — 'X로 하지 않고' · 'X로 내려받기'(내보내기 기능)는 그 갈래의 결정이 아니다
  // 글에 나온 갈래 낱말 — 긴 것부터, 낱말 앞뒤가 다른 글자에 붙어 있으면(웹훅 · MongoDB) 치지 않는다. 라틴 글자는 대소문자를 가리지 않는다
  function kindWords(text) {
    const t = String(text || ""), low = t.toLowerCase(), taken = new Array(t.length).fill(false), out = [];
    for (const { kind, word, f } of FORMS) {
      for (let i = low.indexOf(f); i >= 0; i = low.indexOf(f, i + f.length)) {
        const end = i + f.length, after = t.slice(end);
        if (taken.slice(i, end).some(Boolean) || (i > 0 && LETTER.test(t[i - 1])) || (after && LETTER.test(after[0]) && !PARTICLE.test(after))) continue;
        for (let k = i; k < end; k++) taken[k] = true;
        out.push({ kind, word, at: i, neg: NOT_DECIDED.test(after.slice(0, 12)) });
      }
    }
    return out.sort((a, b) => a.at - b.at);
  }
  // 정한 줄들 → 갈래마다 결정 낱말([{ kind, word }]). 한 줄에 같은 갈래 낱말이 하나일 때만, 뒤 줄이 앞 줄을 덮는다
  function decisionsOf(text) {
    const last = {};
    for (const line of String(text || "").split("\n")) {
      const by = {};
      for (const w of kindWords(line)) (by[w.kind] = by[w.kind] || []).push(w);
      for (const [kind, ws] of Object.entries(by)) { const words = [...new Set(ws.map((w) => w.word))]; if (words.length === 1 && !ws.some((w) => w.neg)) last[kind] = words[0]; }
    }
    return Object.entries(last).map(([kind, word]) => ({ kind, word }));
  }
  // 계획 줄 하나 — 같은 갈래의 다른 낱말만 쓰고 정한 낱말은 없으면 { kind, was, now }, 아니면 null
  function differs(line, decisions) {
    const mine = kindWords(line).filter((w) => !w.neg);
    for (const d of decisions) {
      const same = mine.filter((w) => w.kind === d.kind);
      if (same.length && !same.some((w) => w.word === d.word)) return { kind: d.kind, was: d.word, now: same[0].word };
    }
    return null;
  }

  const api = { board, mark, note, answer, unmarked, canConfirm, feedback, hasFeedback, confirm, stateOf, running, next, taskFor, start, report, accept, reject, failed, progress, revive, EXAMPLE_PLAN, exampleReport, decisionsOf, differs };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloePlan = api;
})(typeof window !== "undefined" ? window : globalThis);
