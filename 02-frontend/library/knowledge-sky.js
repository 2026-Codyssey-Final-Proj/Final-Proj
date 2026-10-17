// claude-drafted: 2026-10-17 — GitHub 저장소의 지식 파일 → 하늘. 화면(sky.js)과 시험(knowledge-sky.test.js)이 같이 쓴다.
// 이재엽 요청(2026-10-17): 1월·2월·3월 … 은 각자의 폴더 = 은하, 은하 안의 작은 내용은 태그별 태양계, 그 안의 책(지식 파일)이 별.
// 별자리는 정해 둔 12궁 모양이 아니라 가지가 갈라지는 모양(가장 짧은 선으로 잇기)이라 별 수에 상한이 없다.
// 머리말(title · date · line · tags · level)만 읽고 본문은 가져오지 않는다(서재 설계 "표지만, 본문은 열 때").
(function (root) {
  // 은하 이름 — 달마다 그 달 대부분을 차지하는 황도 12궁을 별명으로 쓴다(이야기는 제안, 바꿀 수 있다)
  const G = (month, sign, symbol, theme) => ({ month, sign, symbol, theme });
  const GALAXIES = [
    G(1, "염소", "♑", "첫 걸음을 뗀 이야기"), G(2, "물병", "♒", "요구를 쏟아 적은 이야기"), G(3, "물고기", "♓", "둘을 잇는 이야기"),
    G(4, "양", "♈", "뼈대를 세운 이야기"), G(5, "황소", "♉", "끝까지 만든 이야기"), G(6, "쌍둥이", "♊", "함께 나눈 이야기"),
    G(7, "게", "♋", "지킨 이야기"), G(8, "사자", "♌", "용기 낸 이야기"), G(9, "처녀", "♍", "거둔 것을 정리한 이야기"),
    G(10, "천칭", "♎", "무엇부터 할지 고른 이야기"), G(11, "전갈", "♏", "위험을 피한 이야기"), G(12, "궁수", "♐", "다음 해를 겨누는 이야기"),
  ];
  const NO_TAG = "태그 없음";

  // ── 머리말 읽기: --- 사이의 key: value. 숫자는 숫자로, [a, b]는 목록으로 ──
  function parseFrontMatter(text) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text));
    if (!m) return null;
    const out = {};
    for (const line of m[1].split(/\r?\n/)) {
      const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim());
      if (!kv) continue;
      const v = kv[2].trim();
      out[kv[1]] = /^\[.*\]$/.test(v) ? v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean) : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
    }
    return out;
  }

  // ── 같은 입력이면 같은 모양: 글자로 씨앗을 만드는 난수 ──
  function rng(key) {
    let h = 2166136261;
    for (const ch of String(key)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
    return () => { h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // 서로 gap 이상 떨어진 점을 놓는다. 자리가 모자라면 gap을 조금씩 줄인다.
  function scatter(n, rnd, { gap, pick }) {
    const pts = [];
    while (pts.length < n) {
      let g = gap, p = null;
      for (let tries = 0; !p; tries++) {
        const c = pick(rnd);
        if (pts.every((q) => dist(q, c) >= g)) p = c;
        if (tries % 80 === 79) g *= 0.85;
      }
      pts.push(p);
    }
    return pts;
  }

  // 태양계 하나의 별자리: 해(0)가 가운데, 별은 둘레에 흩어지고, 가장 짧은 선으로 모두 잇는다(가지가 갈라진다).
  function shapeOf(key, n) {
    const rnd = rng(key), sun = [50, 50];
    const reach = Math.min(44, 18 + Math.sqrt(n) * 5.5);
    const stars = scatter(n, rnd, { gap: Math.max(5, 22 - n * 0.6), pick: (r) => {
      const a = r() * Math.PI * 2, d = reach * (0.3 + 0.7 * Math.sqrt(r()));
      return [clamp(50 + Math.cos(a) * d, 2, 98), clamp(50 + Math.sin(a) * d * 0.82, 2, 98)].map((v) => Math.round(v * 10) / 10);
    } });
    const pts = [sun, ...stars];   // 별은 해에서 reach의 30% 밖에 놓인다 — 해와 겹치지 않는다
    // 프림 — 이미 이어진 점에서 가장 가까운 점을 하나씩 잇는다
    const edges = [], inTree = new Set([0]);
    while (inTree.size < pts.length) {
      let best = null;
      for (const i of inTree) for (let j = 0; j < pts.length; j++) if (!inTree.has(j)) { const d = dist(pts[i], pts[j]); if (!best || d < best[2]) best = [i, j, d]; }
      edges.push([best[0], best[1]]); inTree.add(best[1]);
    }
    // 큰 별자리에는 고리 하나를 더해 모양이 단조롭지 않게
    if (pts.length >= 7) {
      const has = (a, b) => edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
      let best = null;
      for (let i = 1; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (!has(i, j)) { const d = dist(pts[i], pts[j]); if (!best || d < best[2]) best = [i, j, d]; }
      if (best) edges.push([best[0], best[1]]);
    }
    return { sun, stars: pts.slice(1), edges };
  }

  // 은하 안의 태양계 자리 — 큰 태양계가 가운데 가깝게, 서로 떨어지게
  function placeSystems(month, n) {
    const rnd = rng(`galaxy-${month}`);
    return scatter(n, rnd, { gap: n <= 6 ? 26 : 20, pick: (r) => {
      const a = r() * Math.PI * 2, d = 40 * Math.sqrt(r());
      return [clamp(50 + Math.cos(a) * d, 10, 90), clamp(50 + Math.sin(a) * d * 0.8, 12, 88)].map((v) => Math.round(v));
    } });
  }

  const byName = (a, b) => (a === NO_TAG) - (b === NO_TAG) || a.localeCompare(b, "ko");

  // ── 하늘 만들기: 파일 목록 [{path, commit, text}] → 12 은하 ──
  function buildSky(files, { year, repo }) {
    const skipped = [], all = [];
    for (const f of files) {
      const h = parseFrontMatter(f.text);
      if (!h || !h.title) { skipped.push({ path: f.path, why: h ? "제목 없음" : "머리말 없음" }); continue; }
      const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(h.date || ""));
      if (!d) { skipped.push({ path: f.path, why: "날짜 없음" }); continue; }
      const folder = /(?:^|\/)(\d{4})-(\d{2})\//.exec(f.path);   // 폴더가 은하를 정한다. 없으면 날짜로
      const y = folder ? +folder[1] : +d[1], month = folder ? +folder[2] : +d[2];
      if (y !== year || month < 1 || month > 12) { skipped.push({ path: f.path, why: "다른 해" }); continue; }
      const tags = Array.isArray(h.tags) ? h.tags.map(String) : h.tags ? [String(h.tags)] : [];
      all.push({ title: String(h.title), line: h.line ? String(h.line) : "", date: `${d[1]}-${d[2]}-${d[3]}`, month,
        tags, system: tags[0] || NO_TAG, level: Number.isInteger(h.level) ? clamp(h.level, 0, 3) : 0, source: { repo, path: f.path, commit: f.commit } });
    }
    all.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "ko"));

    const galaxies = GALAXIES.map((g) => {
      const mine = all.filter((it) => it.month === g.month), map = new Map(), bridges = [];
      const sys = (tag) => (map.has(tag) || map.set(tag, { tag, items: [], guests: [] }), map.get(tag));
      for (const it of mine) {
        const s = sys(it.system);
        it.star = s.items.push(it);
        it.where = `${g.month}월 은하 · ${it.system} 태양계 ★${it.star}`;
      }
      for (const it of mine) for (const t of it.tags.slice(1)) { sys(t).guests.push(it); bridges.push({ from: it.system, to: t, title: it.title }); }
      const systems = [...map.values()].sort((a, b) => b.items.length + b.guests.length - (a.items.length + a.guests.length) || byName(a.tag, b.tag));
      const at = placeSystems(g.month, systems.length);
      systems.forEach((s, i) => { s.at = at[i]; s.shape = shapeOf(`${g.month}-${s.tag}`, s.items.length); });
      const yy = String(year), mm = String(g.month).padStart(2, "0");
      return { ...g, folder: `knowledge/${yy}-${mm}/`, count: mine.length, systems, bridges };
    });
    return { year, repo, galaxies, skipped };
  }

  const items = (sky) => sky.galaxies.flatMap((g) => g.systems.flatMap((s) => s.items));

  // ── "어디에 있어요?" — 몇 월 은하 · 어느 태양계 · 몇 번째 별 ──
  function whereIs(sky, title) {
    const it = items(sky).find((x) => x.title === title);
    return it ? it.where : null;
  }

  // ── 태그로 책 보기 — 모든 은하에서, 은하 순 · 날짜 순 ──
  function booksByTag(sky, tag) {
    return items(sky).filter((it) => it.tags.includes(tag) || (tag === NO_TAG && !it.tags.length))
      .sort((a, b) => a.month - b.month || a.date.localeCompare(b.date));
  }
  function allTags(sky) {
    const n = new Map();
    for (const it of items(sky)) for (const t of it.tags.length ? it.tags : [NO_TAG]) n.set(t, (n.get(t) || 0) + 1);
    return [...n].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || byName(a.tag, b.tag));
  }

  const api = { GALAXIES, NO_TAG, parseFrontMatter, buildSky, whereIs, booksByTag, allTags };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KnowledgeSky = api;
})(typeof window !== "undefined" ? window : globalThis);
