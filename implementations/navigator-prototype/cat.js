// claude-drafted: 2026-10-14
// 길잡이 고양이 '나비' — 모양은 목업과 같다. CouCou의 Mochi(귀 없는 둥근 머리·알약 눈)와 다르게
// 귀 달린 실루엣 · 점 눈 · ω 입. 표정은 눈 모양(m-*)으로만, 상태는 머리 밖 작은 표시(s-*)로. 보이고 숨기는 건 app.css가 한다.
(function (root) {
  const HEAD = "M24 44 L30 14 Q31 10 35 13 L52 30 Q60 28 68 30 L85 13 Q89 10 90 14 L96 44 Q108 58 104 78 Q98 104 60 106 Q22 104 16 78 Q12 58 24 44 Z";
  const MOODS = ["idle", "happy", "look", "done", "think", "alert"];

  // size가 32px보다 작으면 입을 빼고(.small) 눈을 조금 키운다 — 작아도 알아보게
  function svg(mood, size) {
    const m = MOODS.includes(mood) ? mood : "idle";
    const small = size < 32, r = small ? 7.5 : 6.5;
    return `<svg class="cat m-${m}${small ? " small" : ""}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      <path d="${HEAD}" fill="#F4A950"></path>
      <g class="c-eyes">
        <g class="e-dot"><circle cx="44" cy="66" r="${r}"></circle><circle cx="76" cy="66" r="${r}"></circle></g>
        <g class="e-wide"><circle cx="44" cy="66" r="9"></circle><circle cx="76" cy="66" r="9"></circle></g>
        <path class="e-happy" d="M37 69 Q44 59 51 69 M69 69 Q76 59 83 69"></path>
        <path class="e-closed" d="M37 64 Q44 72 51 64 M69 64 Q76 72 83 64"></path>
        <path class="e-blink" d="M37 66 L51 66 M69 66 L83 66"></path>
        <g class="e-think"><circle cx="44" cy="66" r="6.5"></circle><path d="M70 63 L83 68"></path></g>
      </g>
      <path class="c-mouth" d="M52 79 Q56 84 60 79 Q64 84 68 79"></path>
      <g class="s-dots"><circle cx="102" cy="36" r="3"></circle><circle cx="108" cy="27" r="4"></circle><circle cx="114" cy="17" r="5"></circle></g>
      <path class="s-spark" d="M108 6 L111 16 L120 19 L111 22 L108 32 L105 22 L96 19 L105 16 Z"></path>
      <text class="s-q" x="100" y="36">?</text>
      <g class="s-bang"><circle cx="108" cy="22" r="11"></circle><path d="M108 15 L108 24"></path><circle cx="108" cy="29.5" r="2.2"></circle></g>
      <path class="s-heart" d="M100 22 C100 16 108 16 108 22 C108 16 116 16 116 22 C116 29 108 33 108 36 C108 33 100 29 100 22 Z"></path>
    </svg>`;
  }

  // 눈 따라오기 — 눈은 통째로(최대 7), 입은 그 절반만 커서 쪽으로. 단위는 그림 안의 좌표(120칸)
  function gaze(dx, dy) {
    const d = Math.hypot(dx, dy) || 1, m = 7 * Math.min(1, d / 220);
    return { x: dx / d * m, y: dy / d * m * 0.8 };
  }
  function follow(container, mouse) {
    for (const el of container.querySelectorAll("svg.cat")) {
      const b = el.getBoundingClientRect();
      if (!b.width) continue;
      const k = 120 / b.width;
      const g = gaze((mouse.x - (b.left + b.width / 2)) * k, (mouse.y - (b.top + b.height * 0.58)) * k);
      el.querySelector(".c-eyes").setAttribute("transform", `translate(${g.x.toFixed(1)} ${g.y.toFixed(1)})`);
      el.querySelector(".c-mouth").setAttribute("transform", `translate(${(g.x / 2).toFixed(1)} ${(g.y / 2).toFixed(1)})`);
    }
  }

  const api = { MOODS, svg, gaze, follow };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavCat = api;
})(typeof window !== "undefined" ? window : globalThis);
