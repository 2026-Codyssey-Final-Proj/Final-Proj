// claude-drafted: 2026-10-19 — 실사용 테스트의 '느낀 점 남기기'(이재엽 2026-10-18 "우리가 사용하면서 느끼고 싶어").
// 쓰는 사람이 쓰다가 느낀 것을 그 자리에서 한 줄 남긴다. 어느 화면 · 어느 단계 · 어느 탭 · 연습인지 진짜 AI인지 · 때는 저절로 붙는다(지어내지 않는다 — 상태에서 읽는다).
// 기록은 이 브라우저(localStorage)에만 남는다. 밖으로 나가는 길은 하나 — "Jira용 복사"가 글을 만들어 클립보드에 넣고, 붙이는 건 사람이 한다.
// 그때 비밀값 · 이메일 · 전화 모양은 sensitive.js의 redact로 가린다 — 느낀 점에 실수로 적힌 값이 Jira로 가지 않게.
// 순수 함수만 — 화면(app.js)이 쓰고 Node에서 시험한다(04-tests/navigator/notes.test.js). 고장 난 기록이면 빈 목록 — 던지지 않는다.
(function (root) {
  const KEY = "floe:notes";
  const MAX = 200, TEXT_MAX = 2000;
  const TAB = { today: "이번 단계", map: "단계 지도", lib: "도서관" };   // 단계 문서 탭은 2026-10-20(C-16)에 뺐다 — 문서는 도서관 탭의 책 안
  const MODE = { live: "진짜 AI", fixture: "연습용 예시" };

  const str = (x) => typeof x === "string" && x.trim() !== "";
  const squash = (t) => String(t || "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
  const pad = (n) => String(n).padStart(2, "0");
  // 때 → "2026-10-19 14:03" (이 컴퓨터 시간)
  const stamp = (at) => { const d = new Date(at); return Number.isFinite(at) ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` : ""; };

  // 어디서 쓴 느낌인가 — 상태에서 읽는다: {screen, stage, tab, mode, project}
  function where(ctx = {}) {
    const out = [];
    if (str(ctx.project)) out.push(ctx.project);
    if (Number.isInteger(ctx.stage)) out.push(`${ctx.stage}단계`);
    if (ctx.screen === "gate") out.push("넘어가기 전 확인");
    else if (TAB[ctx.tab]) out.push(`${TAB[ctx.tab]} 탭`);
    if (MODE[ctx.mode]) out.push(MODE[ctx.mode]);
    return out.join(" · ");
  }
  // 한 줄 더하기 — 새것이 위에, MAX개까지. 글이 비면 그대로 돌려준다(아무것도 바꾸지 않는다). 원본 목록은 바꾸지 않는다
  function add(list, { text, at = Date.now(), screen, stage, tab, mode, project } = {}) {
    const t = squash(text).slice(0, TEXT_MAX);
    if (!t) return list || [];
    const prev = Array.isArray(list) ? list : [];
    const base = String(at), id = prev.some((n) => n.id === base) ? `${base}-${prev.length}` : base;
    const n = { id, at, text: t, where: where({ screen, stage, tab, mode, project }), stage: Number.isInteger(stage) ? stage : null, screen: str(screen) ? screen : "", tab: str(tab) ? tab : "", mode: str(mode) ? mode : "" };
    return [n, ...prev].slice(0, MAX);
  }
  const remove = (list, id) => (Array.isArray(list) ? list.filter((n) => n.id !== id) : []);

  // 저장된 글(JSON) → 목록. 모양이 틀린 줄은 버린다
  function fromSaved(raw) {
    let v = null;
    try { v = JSON.parse(raw); } catch { v = null; }
    if (!Array.isArray(v)) return [];
    return v.filter((n) => n && typeof n === "object" && str(n.text) && Number.isFinite(n.at))
      .map((n) => ({ id: str(n.id) ? n.id : String(n.at), at: n.at, text: squash(n.text).slice(0, TEXT_MAX), where: str(n.where) ? n.where : "",
        stage: Number.isInteger(n.stage) ? n.stage : null, screen: str(n.screen) ? n.screen : "", tab: str(n.tab) ? n.tab : "", mode: str(n.mode) ? n.mode : "" }))
      .slice(0, MAX);
  }
  function read(storage) {
    let raw = null;
    try { raw = storage.getItem(KEY); } catch { raw = null; }
    return fromSaved(raw);
  }
  function write(storage, list) {
    try { storage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : [])); return true; } catch { return false; }
  }

  // Jira에 붙일 글 — 오래된 것부터(시간 순) 한 줄씩. redact: 글을 가리는 함수(sensitive.js의 redact) — 없으면 그대로.
  // 모양은 Jira · GitHub · 메모장 어디에 붙여도 읽히는 글머리표 목록이다(마크업에 기대지 않는다)
  function toJira(list, redact = (t) => t, title = "Floe 실사용 느낀 점") {
    const items = (Array.isArray(list) ? list : []).slice().sort((a, b) => a.at - b.at);
    if (!items.length) return "";
    const line = (n) => `- [${stamp(n.at)}]${n.where ? ` ${n.where} —` : ""} ${redact(n.text).replace(/\n+/g, " / ")}`;
    return [`${title} (${items.length}개)`, "", ...items.map(line), ""].join("\n");
  }

  const api = { KEY, MAX, TEXT_MAX, TAB, MODE, where, add, remove, fromSaved, read, write, toJira, stamp };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeNotes = api;
})(typeof window !== "undefined" ? window : globalThis);
