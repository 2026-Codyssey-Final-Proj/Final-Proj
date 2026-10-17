// claude-drafted: 2026-10-17 — FR-8 역량 지도. 배운 것(태그) 하나 = 역량 하나. 레벨 4단계(처음 봄 → 이해함 → 직접 씀 → 응용함)와 노력(책 수 · 날 수).
// 레벨 규칙은 시안용 가설이다 — 끝낸 책 1권 이해함 · 2권 직접 씀 · 3권 이상 응용함, 열어 둔 책에만 있으면 처음 봄. 항목·단위는 인터뷰 뒤에 정한다(requirements.md FR-8 미정).
(function (root) {
  const LEVELS = ["처음 봄", "이해함", "직접 씀", "응용함"];
  function skillMap(shelf, open = []) {
    const m = new Map();
    for (const b of shelf) for (const t of b.tags || []) {
      const x = m.get(t) || { skill: t, books: 0, days: 0 };
      x.books += 1; x.days += b.days || 0; m.set(t, x);
    }
    for (const b of open) for (const t of b.tags || []) if (!m.has(t)) m.set(t, { skill: t, books: 0, days: 0 });
    return [...m.values()].map((x) => ({ ...x, level: Math.min(3, x.books) }))
      .sort((a, b) => b.level - a.level || b.days - a.days || a.skill.localeCompare(b.skill));
  }
  const api = { LEVELS, skillMap };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Skills = api;
})(typeof window !== "undefined" ? window : globalThis);
