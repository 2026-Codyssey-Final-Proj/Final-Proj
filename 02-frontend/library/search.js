// claude-drafted: 2026-10-17 — 서고 검색. 화면과 떨어진 순수 함수라 search.test.js가 Node에서 시험한다.
// 끝낸 책(이름 · 배운 것 · 단계마다 정한 것 · 인사이트 · 만든 것), 열어 둔 책(이름 · 정한 것 · 책갈피), 레퍼런스(이름 · 한 줄 · 배운 것)를 찾는다.
// 띄어 쓴 낱말은 모두 들어 있어야 맞는다(AND). 대소문자는 가리지 않는다. 본문 전체 색인은 하지 않는다 — 표지에 있는 글만 본다.
(function (root) {
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
  const terms = (q) => norm(q).split(" ").filter(Boolean);

  function fieldsOf(kind, b, STAGES) {
    if (kind === "shelf") return [["책 이름", `${b.title}${b.sub ? ` ${b.sub}` : ""}`], ...b.tags.map((t) => ["배운 것", t]),
      ...b.steps.map((s, i) => [`${i}단계 ${STAGES[i]}`, s]), ...b.insights.map((t) => ["인사이트", t]), ...b.made.map((t) => ["만든 것", t])];
    if (kind === "open") return [["책 이름", b.title], ...b.decided.map((t) => ["이 세션에서 정한 것", t]), ...b.bookmarks.map((t) => ["책갈피", t])];
    return [["레퍼런스 이름", b.title], ["한 줄", b.line], ["배운 것", b.tag]];
  }

  function searchLibrary(q, data) {
    const ts = terms(q);
    if (!ts.length) return [];
    const has = (text) => ts.every((t) => norm(text).includes(t));
    const out = [];
    const scan = (kind, list) => list.forEach((b) => {
      const fields = fieldsOf(kind, b, data.STAGES), hits = fields.filter(([, t]) => has(t));
      if (!hits.length) return;
      out.push({ kind, id: b.id, title: b.title, where: hits[0][0], text: hits[0][1], count: hits.length, byTitle: hits[0][0].endsWith("이름") });
    });
    scan("shelf", data.SHELF);
    scan("open", data.OPEN);
    scan("ref", data.REFS);
    return out.sort((a, b) => (b.byTitle - a.byTitle) || (b.count - a.count));
  }

  // 맞은 곳을 <mark>로 감싼다. 글은 먼저 HTML 글자로 바꾸고, 검색어는 정규식 특수 문자를 글자 그대로 쓴다
  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function highlight(text, q) {
    const ts = terms(q).map(escHtml).filter(Boolean);
    const html = escHtml(text);
    if (!ts.length) return html;
    const re = new RegExp(`(${ts.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return html.replace(re, "<mark>$1</mark>");
  }

  const api = { searchLibrary, highlight };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LibSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
