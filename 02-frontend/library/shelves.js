// claude-drafted: 2026-10-20 — C-21 서고의 분류(책장)는 내가 만든다(이재엽 "지금 도서관 책을 분류하는 기준은 자신이 하나씩 지정해서 만들 수 있도록" + 버튼: '분류 안 함' 하나로 시작 · 책장 수 제한 없음 ·
// 배운 말은 서고에서 뺌 · 예시도 내 것처럼). 넘김 문서 fable-handoff-2026-10-20-shelves.md.
// 책장 목록과 책마다 꽂힌 책장을 이 브라우저(localStorage)에만 둔다 — my-books.js와 같은 곳, 다른 열쇠(예시 책 지우기와 무관하게 남는다). 밖으로 보내지 않는다.
// 책을 지우는 길은 없다: 책장을 지우면 그 안의 책은 '분류 안 함'으로. 순수 함수만 — 서고(library.js)가 쓰고 Node에서 시험한다(04-tests/library/shelves.test.js).
(function (root) {
  const KEY = "floe:shelves";
  const NONE = "none";                 // 처음 책장 — 지우거나 이름을 바꿀 수 없다
  const NONE_NAME = "분류 안 함";
  const NAME_MAX = 20;

  const str = (v) => (typeof v === "string" ? v : "");
  const tidy = (name) => str(name).replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  const newId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // 어떤 값이 와도 쓸 수 있는 모양으로 — 목록 맨 앞은 늘 '분류 안 함', 저장된 목록에서는 뺀다
  function normalize(raw) {
    const r = raw && typeof raw === "object" ? raw : {};
    const list = (Array.isArray(r.list) ? r.list : []).filter((x) => x && typeof x === "object" && x.id !== NONE && str(x.id) && tidy(x.name)).map((x) => ({ id: String(x.id), name: tidy(x.name) }));
    const ids = new Set(list.map((x) => x.id));
    const books = {};
    for (const [b, s] of Object.entries(r.books && typeof r.books === "object" ? r.books : {})) if (b && ids.has(String(s))) books[b] = String(s);
    return { list: [{ id: NONE, name: NONE_NAME }, ...list], books };
  }
  function read(storage) {
    let raw = null;
    try { raw = JSON.parse(storage.getItem(KEY) || "null"); } catch { raw = null; }
    return normalize(raw);
  }
  function write(storage, s) {
    const n = normalize(s);
    try { storage.setItem(KEY, JSON.stringify({ list: n.list.filter((x) => x.id !== NONE), books: n.books })); return true; } catch { return false; }
  }
  // 책장 만들기 — 빈 이름이면 그대로. 개수 제한 없음(많아지면 서고를 아래로 내려 본다)
  function add(s, name) {
    const nm = tidy(name);
    if (!nm) return s;
    return normalize({ ...s, list: [...s.list, { id: newId(), name: nm }] });
  }
  function rename(s, id, name) {
    const nm = tidy(name);
    if (!nm || id === NONE || !s.list.some((x) => x.id === id)) return s;
    return normalize({ ...s, list: s.list.map((x) => (x.id === id ? { ...x, name: nm } : x)) });
  }
  // 책장 지우기 — 그 안의 책은 '분류 안 함'으로(normalize가 모르는 책장의 책을 풀어 준다). 책은 지우지 않는다
  function remove(s, id) {
    if (id === NONE || !s.list.some((x) => x.id === id)) return s;
    return normalize({ ...s, list: s.list.filter((x) => x.id !== id) });
  }
  // 책을 책장에 꽂거나 옮긴다 — 모르는 책장이면 '분류 안 함'
  function place(s, bookId, shelfId) {
    if (!str(bookId)) return s;
    const books = { ...s.books };
    if (shelfId === NONE || !s.list.some((x) => x.id === shelfId)) delete books[bookId]; else books[bookId] = shelfId;
    return normalize({ ...s, books });
  }
  const shelfOf = (s, bookId) => (s.list.some((x) => x.id === s.books[bookId]) ? s.books[bookId] : NONE);
  // 책장마다 꽂힌 책 — 목록 차례대로('분류 안 함'이 맨 앞), 책은 받은 차례대로
  const groups = (s, books) => s.list.map((shelf) => ({ shelf, books: (Array.isArray(books) ? books : []).filter((b) => b && shelfOf(s, b.id) === shelf.id) }));

  const api = { KEY, NONE, NONE_NAME, NAME_MAX, normalize, read, write, add, rename, remove, place, shelfOf, groups };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeShelves = api;
})(typeof window !== "undefined" ? window : globalThis);
