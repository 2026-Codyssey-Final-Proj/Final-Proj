// claude-drafted: 2026-10-19 — 실사용(이재엽 2026-10-18 "화면에서만 실행해서 보이는게 아니라 실질적으로 테스트를 진행할 수 있도록 하고 우리가 사용하면서 느끼고 싶어").
// 서재의 책장(books.js)은 예시(더미) 책이다. 이 파일은 두 가지를 한다 — books.js 바로 뒤에, 두 화면(내비게이터 · 서고) 모두에서 불러온다.
//   ① 내비게이터가 이 브라우저에 남긴 기록(localStorage, app.js와 같은 열쇠)에서 **내 책** 한 권을 만든다 — 지금 단계 · 할 일 · 확정한 설계도 · 배운 말 · 지나온 단계.
//   ② "예시 책 지우기"를 누른 뒤(HIDE_KEY)에는 예시 책 · 레퍼런스 · 물어볼 것 · 캘린더를 비우고, 시안의 고정된 '오늘'(2026-10-17)을 실제 오늘로 바꾼다.
// 결정(이재엽 2026-10-18 "예시 책들로 처음에 실사용 테스트 이후에 예시책 지우기 예" — [해석]): 처음에는 예시 책과 내 책이 같이 보이고, 버튼으로 예시를 숨긴다.
// 순수 함수만 — Node에서 시험한다(04-tests/library/my-books.test.js). 기록이 없거나 고장 나면 내 책 없음, 저장소를 못 쓰면 숨기지 않은 것으로 — 던지지 않는다.
(function (root) {
  const KEY = "navigator-prototype:v1";   // 내비게이터 app.js의 KEY와 같아야 한다 — 시험이 맞대어 본다(서재의 learn.js는 2026-10-19에 지움)
  const HIDE_KEY = "floe:examples-hidden";
  const ME = "me";                        // 내 책의 id — 예시 책(s1~s4 · f1~f5)과 겹치지 않는다
  const TONE = "#CFE6FF";                 // 내 책 표지색 — 팀 테마 얼음 파랑
  const UNTITLED = "내 프로젝트";
  const STAGE_MAX = 7;

  const str = (x) => typeof x === "string" && x.trim() !== "";
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);
  const ymd = (t) => new Date(t).toLocaleDateString("sv");   // 이 컴퓨터 시간으로 YYYY-MM-DD
  const todayOf = (now = Date.now()) => ymd(now);
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
  const ymdOf = (v) => (isDate(v) ? v : Number.isFinite(v) && v > 0 ? ymd(v) : "");   // 날짜 글 또는 때(밀리초) → YYYY-MM-DD, 아니면 ""
  const tailDate = (t) => ((/(\d{4}-\d{2}-\d{2})\s*$/.exec(str(t) ? t : "") || [])[1] || "");   // 기록 끝의 날짜("… · 2026-10-18")
  // 기록을 남긴 때 → "오늘 14:20" · "어제" · "10/15" (예시 책의 updated와 같은 모양)
  function when(at, now = Date.now()) {
    if (!Number.isFinite(at)) return "지금";
    const d = new Date(at), today = ymd(now), day = ymd(at);
    if (day === today) return `오늘 ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
    if (day === ymd(now - 864e5)) return "어제";
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  // 내비게이터의 상태(또는 저장된 기록)에서 내 책 한 권. j(지금 단계 판정)가 없으면 아직 책이 없다 → null
  //   s: {j, docs, learned, history, since, project, finished, mode, at}. today: YYYY-MM-DD. now: 때(밀리초)
  function fromState(s, today = todayOf(), now = Date.now()) {
    if (!s || typeof s !== "object" || !s.j || typeof s.j !== "object" || !Array.isArray(s.j.criteria)) return null;
    const stage = Number.isInteger(s.j.stage) ? Math.max(0, Math.min(STAGE_MAX, s.j.stage)) : 0;
    const learned = list(s.learned).filter((x) => str(x.term));
    const docs = list(s.docs).filter((x) => Number.isInteger(x.stage) && str(x.text));
    const history = list(s.history).filter((x) => str(x.short) || str(x.text));
    const todos = s.j.criteria.filter((c) => c && str(c.text)).map((c) => ({ t: c.text, done: c.met === true }));
    const finished = s.finished === true;
    return {
      id: ME, mine: true, example: false, practice: s.mode === "fixture",
      title: str(s.project) ? s.project : UNTITLED,
      tags: [...new Set(learned.map((x) => x.term))],
      stage: finished ? STAGE_MAX : stage,
      updated: when(Number(s.at), now),
      tone: TONE,
      started: isDate(s.since) ? s.since : today,
      dues: [],                                   // 내 책에는 마감이 없다 — 마감 칩은 그리지 않는다(app.js dueChip)
      todos: finished ? todos.map((t) => ({ ...t, done: true })) : todos,
      steps: history.map((x) => (str(x.short) ? x.short : x.text)),
      decided: docs.map((d) => `${d.stage}단계 ${str(d.name) ? d.name : "단계 문서"}${str(d.at) ? ` — ${d.at}에 확정` : ""}`),
      docStages: docs.map((d) => d.stage),         // 확정한 단계 문서의 단계(C-16 — 책 안에서 연다)
      fed: list(s.fed).filter((f) => Array.isArray(f.topics)).map((f) => ({ topics: f.topics.filter(str), left: list(f.left).length, example: f.example === true })),   // 받은 먹이(C-15) — 주제와 빠진 수만, 글은 없다
      bookmarks: [...new Set(learned.map((x) => x.term))],
      insights: [], made: [],
      // 세션별 보기(C-3, book-view.js)의 재료 — 날짜가 남은 기록만: 지나온 단계(기록 끝의 날짜 또는 at) · 확정한 문서(at) · 받은 먹이(at). 본문은 싣지 않는다
      dated: [
        ...history.map((x) => ({ at: ymdOf(x.at) || tailDate(x.text), kind: "steps", text: str(x.short) ? x.short : x.text })),
        ...docs.map((d) => ({ at: ymdOf(d.at), kind: "decided", text: `${d.stage}단계 ${str(d.name) ? d.name : "단계 문서"} 확정` })),
        ...list(s.fed).filter((f) => Array.isArray(f.topics)).map((f) => ({ at: ymdOf(Number(f.at)), kind: "fed", text: `먹이 — ${f.topics.filter(str).join(" · ") || "(빠진 구간뿐)"}` })),
      ].filter((x) => x.at),
      finished,
    };
  }
  // 저장된 글(JSON) → 내 책. 고장 난 기록이면 null
  function fromSaved(raw, today = todayOf(), now = Date.now()) {
    let s = null;
    try { s = JSON.parse(raw); } catch { s = null; }
    return fromState(s, today, now);
  }

  // 예시 책을 숨겼나 — 저장소를 못 쓰면(사생활 보호 창) 숨기지 않은 것으로
  function readHidden(storage) {
    try { return storage.getItem(HIDE_KEY) === "1"; } catch { return false; }
  }
  function writeHidden(storage, on) {
    try { if (on) storage.setItem(HIDE_KEY, "1"); else storage.removeItem(HIDE_KEY); return true; } catch { return false; }
  }
  // 저장소에서 둘을 한 번에: {book, hidden}
  function read(storage, today = todayOf(), now = Date.now()) {
    let raw = null;
    try { raw = storage.getItem(KEY); } catch { raw = null; }
    return { book: fromSaved(raw, today, now), hidden: readHidden(storage) };
  }

  const EX_FIELDS = ["OPEN", "SHELF", "REFS", "ASK", "CALENDAR", "TODAY"];
  // 데이터(books.js의 LibData)에 적용한다 — 제자리에서 바꾼다(두 화면이 window.LibData 하나를 읽는다). 몇 번 불러도 같은 결과(토글 가능):
  //   예시 책마다 example: true · 내 책(book)이 있으면 OPEN 맨 앞에 · hidden이면 예시 전부를 비우고 TODAY를 오늘로. 원본은 D.EXAMPLES에 한 번만 보관한다
  function apply(D, { book = null, hidden = false, today = todayOf() } = {}) {
    if (!D || typeof D !== "object") return D;
    if (!D.EXAMPLES) {
      D.EXAMPLES = Object.fromEntries(EX_FIELDS.map((k) => [k, D[k]]));
      for (const k of ["OPEN", "SHELF"]) for (const b of D.EXAMPLES[k] || []) if (b && !b.mine) b.example = true;
    }
    const E = D.EXAMPLES;
    if (hidden) { D.OPEN = []; D.SHELF = []; D.REFS = []; D.ASK = []; D.CALENDAR = []; D.TODAY = today; }
    else for (const k of EX_FIELDS) D[k] = E[k];
    if (book) D.OPEN = [book, ...D.OPEN.filter((b) => b.id !== ME)];
    D.HIDDEN = !!hidden;
    return D;
  }
  // 책이 예시인가 — 표시(예시 꼬리표)와 지우기 단추가 쓴다
  const isExample = (b) => !!b && b.example === true && b.id !== ME;

  const api = { KEY, HIDE_KEY, ME, TONE, UNTITLED, fromState, fromSaved, readHidden, writeHidden, read, apply, isExample, todayOf, when };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeMine = api;
})(typeof window !== "undefined" ? window : globalThis);
