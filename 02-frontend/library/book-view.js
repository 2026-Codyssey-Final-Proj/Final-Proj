// claude-drafted: 2026-10-20 — 책 보기 설정(C-9 책 레이아웃 고르기 · C-3 보기 방식 → FR-8 세부, 이재엽 "아니 지금 하자"). 넘김 문서 fable-handoff-2026-10-20-c4-views.md 2절 ①.
// 책 화면의 '보기 설정' 하나 — 구조(간결 · 탭) · 칸 켜기/끄기(지나온 단계 · 정한 것 · 배운 것 · 만든 것 · 책갈피 · 할 일 — 내용은 지우지 않는다) · 보기(책별 · 세션별) · 크기(짧게 · 전체 화면).
// 설정은 이 컴퓨터(localStorage)에만 저장해 다음에도 쓴다(서버 없이, FR-10). 칸을 새로 만들거나 자유롭게 옮기지는 않는다(규격화한 길, C-6).
// 기본값은 이재엽 버튼(2026-10-20): 구조 간결 · 보기 책별. '세션'은 코딩 도구에서 연 작업 한 번으로 읽고, 기록의 날짜로 묶는다 [해석].
// 순수 함수만 — 두 화면(섬의 도서관 탭 app.js · 서고의 펼친 책 library.js)이 같은 HTML을 쓰고, Node에서 시험한다(04-tests/library/book-view.test.js).
(function (root) {
  const KEY = "floe:book-view";
  const STRUCTURES = [["simple", "간결", "켜 둔 칸을 위에서 아래로"], ["tabs", "탭", "칸마다 탭 — 한 번에 한 칸"]];
  const VIEWS = [["book", "책별", "책 한 권을 통째로"], ["session", "세션별", "작업한 날짜로 묶어서"]];
  const SIZES = [["short", "짧게", "섬 안에서"], ["full", "전체 화면", "서고에서 크게"]];
  const FIELDS = [["steps", "지나온 단계"], ["decided", "정한 것"], ["insights", "배운 것"], ["made", "만든 것"], ["bookmarks", "책갈피"], ["todos", "할 일"]];
  const GROUPS = { structure: STRUCTURES, view: VIEWS, size: SIZES };
  const KIND_LABEL = { steps: "지나온 단계", decided: "정한 것", fed: "받은 먹이" };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const str = (v) => (typeof v === "string" ? v : "");
  const has = (list, v) => list.some(([k]) => k === v);

  // 어떤 값이 와도 쓸 수 있는 설정 하나로 — 모르는 값은 기본값, 모르는 칸은 버린다
  function normalize(raw) {
    const r = raw && typeof raw === "object" ? raw : {};
    const f = r.fields && typeof r.fields === "object" ? r.fields : {};
    return {
      structure: has(STRUCTURES, r.structure) ? r.structure : "simple",
      view: has(VIEWS, r.view) ? r.view : "book",
      size: has(SIZES, r.size) ? r.size : "short",
      fields: Object.fromEntries(FIELDS.map(([k]) => [k, f[k] === false ? false : true])),
    };
  }
  function read(storage) {
    let raw = null;
    try { raw = JSON.parse(storage.getItem(KEY) || "null"); } catch { raw = null; }
    return normalize(raw);
  }
  function write(storage, s) {
    try { storage.setItem(KEY, JSON.stringify(normalize(s))); return true; } catch { return false; }
  }
  // 묶음(structure · view · size) 하나를 고른 새 설정. 모르는 묶음 · 값이면 그대로
  function choose(s, group, value) {
    if (!GROUPS[group] || !has(GROUPS[group], value)) return s;
    return normalize({ ...s, [group]: value });
  }
  // 칸 하나를 켜고 끄는 새 설정
  function toggle(s, key) {
    if (!has(FIELDS, key)) return s;
    const n = normalize(s);
    n.fields[key] = !n.fields[key];
    return n;
  }

  // 책의 칸 하나 → 화면 줄들 [{text, done?}]. 책갈피는 bookmarks(열어 둔 책) 또는 tags(서고의 끝낸 책). 칸이 없으면 null
  function items(book, key) {
    const raw = key === "bookmarks" ? (Array.isArray(book.bookmarks) ? book.bookmarks : book.tags) : book[key];
    if (!Array.isArray(raw)) return null;
    return raw.map((x) => (x && typeof x === "object" ? { text: str(x.t || x.text), done: x.done === true } : { text: str(x) })).filter((x) => x.text);
  }
  // 켜 둔 칸 중 책에 있는 것만, FIELDS 차례로
  function sections(book, s) {
    if (!book || typeof book !== "object") return [];
    const n = normalize(s);
    return FIELDS.filter(([k]) => n.fields[k]).map(([key, label]) => ({ key, label, items: items(book, key) })).filter((x) => x.items);
  }

  const YMD = /^\d{4}-\d{2}-\d{2}$/;
  const dateLabel = (ymd) => `${Number(ymd.slice(5, 7))}/${Number(ymd.slice(8, 10))}`;
  // 세션별 — 책의 dated [{at: YYYY-MM-DD, kind, text}]를 날짜로 묶어 최근 것부터. 끈 칸의 종류는 빼고, 받은 먹이는 늘 보인다
  function sessions(book, s) {
    const list = book && Array.isArray(book.dated) ? book.dated : [];
    const n = normalize(s);
    const by = new Map();
    for (const d of list) {
      if (!d || typeof d !== "object" || !YMD.test(str(d.at)) || Number.isNaN(Date.parse(d.at)) || !str(d.text)) continue;
      const kind = str(d.kind);
      if (kind !== "fed" && has(FIELDS, kind) && !n.fields[kind]) continue;
      if (!by.has(d.at)) by.set(d.at, { at: d.at, label: dateLabel(d.at), items: [] });
      by.get(d.at).items.push({ kind, text: d.text });
    }
    return [...by.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
  }

  const li = (it) => `<li${it.done === true ? ' class="done"' : it.done === false ? ' class="todo"' : ""}>${it.done === true ? "☑ " : it.done === false ? "☐ " : ""}${esc(it.text)}</li>`;
  // 칸 하나의 HTML. stages(단계 이름들)가 오면 지나온 단계의 줄 앞에 단계 이름을 붙인다(서고의 끝낸 책 — 줄마다 단계 하나)
  const secHTML = (x, stages) => `<section class="bv-sec" data-k="${esc(x.key)}"><div class="bv-k">${esc(x.label)}${x.items.length ? ` <small>${x.items.length}</small>` : ""}</div>${
    x.items.length ? `<ul class="bv-list">${x.items.map((it, i) => (x.key === "steps" && Array.isArray(stages) && stages[i] ? `<li><em>${i} ${esc(stages[i])}</em>${esc(it.text)}</li>` : li(it))).join("")}</ul>`
      : `<p class="bv-empty">아직 없어요</p>`}</section>`;
  // 책 본문 HTML — 구조 · 보기 · 켜 둔 칸대로. opts.tab: 탭 구조에서 고른 칸, opts.only / opts.except: 이 칸들만 / 빼고(서고의 왼쪽 · 오른쪽 쪽), opts.stages: 단계 이름들
  function bodyHTML(book, s, opts = {}) {
    if (!book || typeof book !== "object") return "";
    const n = normalize(s);
    let secs = sections(book, n);
    if (Array.isArray(opts.only)) secs = secs.filter((x) => opts.only.includes(x.key));
    if (Array.isArray(opts.except)) secs = secs.filter((x) => !opts.except.includes(x.key));
    if (n.view === "session") {
      const ss = sessions(book, n);
      if (ss.length) {
        return `<div class="bv-sessions">${ss.map((x) => `<section class="bv-sec bv-day" data-at="${esc(x.at)}"><div class="bv-k">${esc(x.label)} <small>${x.items.length}</small></div><ul class="bv-list">${
          x.items.map((i) => `<li><em>${esc(KIND_LABEL[i.kind] || "")}</em>${esc(i.text)}</li>`).join("")}</ul></section>`).join("")}</div>`;
      }
      return `<p class="bv-note" role="status">날짜가 남은 기록이 없어 책별로 보여요</p>${secs.map((x) => secHTML(x, opts.stages)).join("")}`;
    }
    if (n.structure === "tabs" && secs.length) {
      const cur = secs.find((x) => x.key === opts.tab) || secs[0];
      return `<div class="bv-tabs" role="tablist">${secs.map((x) => `<button type="button" role="tab" class="bv-tab" data-bv="tab" data-v="${esc(x.key)}" aria-selected="${x === cur}">${esc(x.label)}</button>`).join("")}</div>${secHTML(cur, opts.stages)}`;
    }
    return secs.map((x) => secHTML(x, opts.stages)).join("");
  }
  // 보기 설정 판 HTML — 두 화면이 같은 손잡이(data-bv · data-v)를 쓴다
  function panelHTML(s) {
    const n = normalize(s);
    const row = (group, title) => `<div class="bv-row"><span class="bv-t">${title}</span><span class="bv-opts">${GROUPS[group].map(([v, label, hint]) =>
      `<button type="button" class="bv-opt" data-bv="${group}" data-v="${v}" aria-pressed="${n[group] === v}" title="${esc(hint)}">${esc(label)}</button>`).join("")}</span></div>`;
    return `<div class="bv-panel" role="group" aria-label="보기 설정"><div class="bv-h"><b>보기 설정</b><small>이 컴퓨터에 저장돼요 · 모든 책에 같이</small></div>${
      row("structure", "구조")}${row("view", "보기")}${row("size", "크기")}<div class="bv-row"><span class="bv-t">칸</span><span class="bv-opts bv-fields">${
      FIELDS.map(([k, label]) => `<label class="bv-chk"><input type="checkbox" data-bv="field" data-v="${k}"${n.fields[k] ? " checked" : ""}>${esc(label)}</label>`).join("")}</span></div></div>`;
  }

  const api = { KEY, STRUCTURES, VIEWS, SIZES, FIELDS, normalize, read, write, choose, toggle, items, sections, sessions, bodyHTML, panelHTML };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeBookView = api;
})(typeof window !== "undefined" ? window : globalThis);
