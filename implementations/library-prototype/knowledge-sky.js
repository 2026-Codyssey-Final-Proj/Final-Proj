// claude-drafted: 2026-10-17 — GitHub 저장소의 지식 파일 → 1월~12월 별자리 하늘. 화면(sky.js)과 시험(knowledge-sky.test.js)이 같이 쓴다.
// 지식 파일 한 개 = 별 한 개. 머리말(title · date · line · tags · level)만 읽고 본문은 가져오지 않는다(서재 설계 "표지만, 본문은 열 때").
// 달마다 그 달 대부분을 차지하는 황도 12궁을 쓴다(1월 염소자리 … 12월 궁수자리). 모양은 실제 별자리를 단순하게 그린 것이다 — 좌표 0~100.
(function (root) {
  const C = (month, sign, symbol, story, theme, stars, edges, parts) => ({ month, sign, symbol, story, theme, stars, edges, parts });
  const chain = (n) => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
  const CONSTELLATIONS = [
    C(1, "염소자리", "♑", "산을 오르는 염소", "첫 걸음을 뗀 이야기", [[18, 42], [32, 30], [52, 33], [72, 26], [86, 42], [66, 60], [42, 66], [24, 56]], [...chain(8), [7, 0]], ["뿔", "이마", "등", "등 끝", "꼬리", "배", "앞발", "턱"]),
    C(2, "물병자리", "♒", "물을 붓는 사람", "요구를 쏟아 적은 이야기", [[16, 28], [32, 22], [46, 34], [57, 26], [66, 44], [55, 60], [70, 72], [86, 64]], chain(8), ["손", "어깨", "가슴", "물병", "물줄기 위", "물줄기", "물방울", "물웅덩이"]),
    C(3, "물고기자리", "♓", "끈으로 묶인 두 물고기", "둘을 잇는 이야기", [[14, 20], [24, 34], [38, 52], [52, 70], [64, 60], [77, 50], [88, 40], [80, 28]], chain(8), ["위 물고기", "지느러미", "끈", "매듭", "끈 오른쪽", "꼬리", "아래 물고기", "입"]),
    C(4, "양자리", "♈", "앞서 달리는 양", "뼈대를 세운 이야기", [[18, 54], [40, 40], [62, 35], [82, 44]], chain(4), ["뒷발", "등", "머리", "뿔"]),
    C(5, "황소자리", "♉", "끈질긴 황소", "끝까지 만든 이야기", [[16, 18], [38, 44], [50, 56], [62, 46], [84, 20], [52, 74]], [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]], ["왼뿔", "왼눈", "얼굴", "오른눈", "오른뿔", "코"]),
    C(6, "쌍둥이자리", "♊", "손잡은 쌍둥이", "함께 나눈 이야기", [[28, 14], [32, 42], [36, 74], [60, 14], [64, 44], [68, 76]], [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4]], ["형의 머리", "형의 몸", "형의 발", "아우의 머리", "아우의 몸", "아우의 발"]),
    C(7, "게자리", "♋", "단단한 껍데기의 게", "지킨 이야기", [[50, 18], [50, 44], [30, 70], [72, 72], [50, 60]], [[0, 1], [1, 4], [4, 2], [4, 3]], ["집게 끝", "등딱지", "왼다리", "오른다리", "배"]),
    C(8, "사자자리", "♌", "용감한 사자", "용기 낸 이야기", [[30, 18], [20, 30], [26, 44], [42, 48], [66, 52], [86, 62], [70, 72], [44, 64]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 3]], ["갈기 위", "갈기", "턱", "가슴", "등", "꼬리", "뒷다리", "앞다리"]),
    C(9, "처녀자리", "♍", "이삭을 든 처녀", "거둔 것을 정리한 이야기", [[18, 30], [34, 40], [50, 38], [60, 56], [76, 48], [88, 62], [54, 76]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6]], ["머리", "어깨", "가슴", "허리", "손", "이삭", "옷자락"]),
    C(10, "천칭자리", "♎", "무게를 재는 저울", "무엇부터 할지 고른 이야기", [[50, 16], [50, 42], [28, 46], [72, 46], [22, 72], [78, 72]], [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5]], ["손잡이", "저울대 가운데", "왼쪽 팔", "오른쪽 팔", "왼쪽 접시", "오른쪽 접시"]),
    C(11, "전갈자리", "♏", "꼬리를 세운 전갈", "위험을 피한 이야기", [[14, 24], [24, 30], [34, 38], [44, 50], [52, 64], [62, 74], [75, 78], [86, 68], [80, 56]], chain(9), ["집게", "머리", "심장", "몸통", "배", "꼬리 첫 마디", "꼬리", "꼬리 끝", "독침"]),
    C(12, "궁수자리", "♐", "활을 당기는 궁수", "다음 해를 겨누는 이야기", [[24, 42], [40, 30], [56, 34], [60, 52], [44, 64], [28, 58], [72, 22], [84, 46]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [3, 7]], ["활 아래", "활 위", "어깨", "허리", "다리", "꼬리", "화살 끝", "말굽"]),
  ];

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

  // ── 하늘 만들기: 파일 목록 [{path, commit, text}] → 12달 ──
  function buildSky(files, { year, repo }) {
    const months = CONSTELLATIONS.map((c) => ({ month: c.month, sign: c.sign, symbol: c.symbol, story: c.story, theme: c.theme, stars: c.stars.length, items: [], waiting: [] }));
    const skipped = [];
    const all = [];
    for (const f of files) {
      const h = parseFrontMatter(f.text);
      if (!h || !h.title) { skipped.push({ path: f.path, why: h ? "제목 없음" : "머리말 없음" }); continue; }
      const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(h.date || ""));
      if (!d) { skipped.push({ path: f.path, why: "날짜 없음" }); continue; }
      if (+d[1] !== year) { skipped.push({ path: f.path, why: "다른 해" }); continue; }
      all.push({ title: String(h.title), line: h.line ? String(h.line) : "", date: `${d[1]}-${d[2]}-${d[3]}`, month: +d[2],
        tags: Array.isArray(h.tags) ? h.tags : h.tags ? [String(h.tags)] : [], level: Number.isInteger(h.level) ? Math.max(0, Math.min(3, h.level)) : 0,
        source: { repo, path: f.path, commit: f.commit } });
    }
    all.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    for (const it of all) {
      const m = months[it.month - 1];
      if (m.items.length < m.stars) m.items.push({ ...it, star: m.items.length + 1, part: CONSTELLATIONS[it.month - 1].parts[m.items.length] });
      else m.waiting.push(it);
    }
    return { year, repo, months, skipped };
  }

  // ── "어디에 있어요?" — 몇 월 · 어느 별자리 · 몇 번째 별 ──
  function whereIs(sky, title) {
    for (const m of sky.months) { const it = m.items.find((x) => x.title === title); if (it) return `${m.month}월 ${m.sign} ★${it.star}`; }
    return null;
  }

  const api = { CONSTELLATIONS, parseFrontMatter, buildSky, whereIs };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KnowledgeSky = api;
})(typeof window !== "undefined" ? window : globalThis);
