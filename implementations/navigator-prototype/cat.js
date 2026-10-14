// claude-drafted: 2026-10-14, 2026-10-15 — 2026-10-15 "가로 카드 시안대로, 고양이 캐릭터와 교감 요소를 많이" 요청으로 다시 그림.
// 길잡이 고양이 '나비' — CouCou의 Mochi(귀 없는 둥근 머리·알약 눈)와 다르게 귀 달린 치즈 고양이 · 점 눈 · ω 입.
// 표정은 눈·입 모양(m-*)으로, 상태는 머리 밖 작은 표시(s-*)로. 보이고 숨기는 건 app.css가 한다.
// 그림 말고도 교감에 쓰는 순수 함수(쓰다듬기 알아채기·친해진 정도·인사·졸음)와 화면 효과(하트·별 튀기기·작은 소리)가 여기 있다.
(function (root) {
  const HEAD = "M24 44 L30 14 Q31 10 35 13 L52 30 Q60 28 68 30 L85 13 Q89 10 90 14 L96 44 Q108 58 104 78 Q98 104 60 106 Q22 104 16 78 Q12 58 24 44 Z";
  // 앞의 여섯은 안내 화면(navigator.js의 face·docFace)이 쓰고, 뒤의 다섯은 교감할 때 잠깐 짓는 표정이다
  const MOODS = ["idle", "happy", "look", "done", "think", "alert", "love", "purr", "sleep", "yawn", "wow"];
  const heart = (x) => `M${x} 72 C${x - 8} 66 ${x - 8} 58 ${x - 3} 58 C${x - 1} 58 ${x} 60 ${x} 61 C${x} 60 ${x + 1} 58 ${x + 3} 58 C${x + 8} 58 ${x + 8} 66 ${x} 72 Z`;

  // size가 32px보다 작으면 입·수염·꼬리를 빼고(.small) 눈을 조금 키운다 — 작아도 알아보게.
  // opts.paws: 앞발을 내밀고 있는 모습(한 줄 표시). opts.extra: 덧붙일 class (예: "oops" — 땀방울)
  function svg(mood, size, opts = {}) {
    const m = MOODS.includes(mood) ? mood : "idle";
    const small = size < 32, r = small ? 7.5 : 6.5, tail = size >= 56 && !opts.noTail;
    return `<svg class="cat m-${m}${small ? " small" : ""}${opts.extra ? ` ${opts.extra}` : ""}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
      ${tail ? `<path class="c-tail" d="M96 98 Q119 97 114 75 Q111 64 103 69"></path>` : ""}
      <g class="c-head">
        <path class="c-fur" d="${HEAD}"></path>
        <path class="c-shine" d="M38 42 Q60 31 82 42 Q71 37 60 37 Q49 37 38 42 Z"></path>
        <path class="c-stripe" d="M56 33 L57 41 M60 32 L60 41 M64 33 L63 41"></path>
        <path class="c-ear" d="M32 21 Q33 17 36 19 L47 30 Q41 33 37 37 Z M88 21 Q87 17 84 19 L73 30 Q79 33 83 37 Z"></path>
        <g class="c-blush"><ellipse cx="33" cy="81" rx="8" ry="5"></ellipse><ellipse cx="87" cy="81" rx="8" ry="5"></ellipse></g>
        <path class="c-whisk" d="M19 75 L5 71 M19 81 L4 82 M101 75 L115 71 M101 81 L116 82"></path>
        <g class="c-eyes">
          <g class="e-dot"><circle cx="44" cy="66" r="${r}"></circle><circle cx="76" cy="66" r="${r}"></circle><circle class="e-glint" cx="46.2" cy="63.6" r="2"></circle><circle class="e-glint" cx="78.2" cy="63.6" r="2"></circle></g>
          <g class="e-wide"><circle cx="44" cy="66" r="9"></circle><circle cx="76" cy="66" r="9"></circle><circle class="e-glint" cx="47" cy="62.5" r="2.6"></circle><circle class="e-glint" cx="79" cy="62.5" r="2.6"></circle></g>
          <g class="e-wow"><circle cx="44" cy="65" r="10"></circle><circle cx="76" cy="65" r="10"></circle><circle class="e-glint" cx="47.5" cy="61.5" r="3.2"></circle><circle class="e-glint" cx="79.5" cy="61.5" r="3.2"></circle><circle class="e-glint" cx="41" cy="69" r="1.4"></circle><circle class="e-glint" cx="73" cy="69" r="1.4"></circle></g>
          <path class="e-happy" d="M37 69 Q44 59 51 69 M69 69 Q76 59 83 69"></path>
          <path class="e-closed" d="M37 65 Q44 72 51 65 M69 65 Q76 72 83 65"></path>
          <path class="e-blink" d="M37 66 L51 66 M69 66 L83 66"></path>
          <g class="e-think"><circle cx="44" cy="66" r="6.5"></circle><path d="M70 63 L83 68"></path></g>
          <g class="e-heart"><path d="${heart(44)}"></path><path d="${heart(76)}"></path></g>
        </g>
        <g class="c-snout">
          <path class="c-nose" d="M56.5 72 Q60 70 63.5 72 L60 76 Z"></path>
          <path class="c-mouth" d="M52 78 Q56 83 60 78 Q64 83 68 78"></path>
          <ellipse class="c-open" cx="60" cy="83" rx="4" ry="4.6"></ellipse>
        </g>
      </g>
      ${opts.paws ? `<g class="c-paws"><ellipse cx="44" cy="109" rx="10" ry="7"></ellipse><ellipse cx="76" cy="109" rx="10" ry="7"></ellipse><path d="M41 106 L41 111 M47 106 L47 111 M73 106 L73 111 M79 106 L79 111"></path></g>` : ""}
      <g class="s-dots"><circle cx="102" cy="36" r="3"></circle><circle cx="108" cy="27" r="4"></circle><circle cx="114" cy="17" r="5"></circle></g>
      <path class="s-spark" d="M108 6 L111 16 L120 19 L111 22 L108 32 L105 22 L96 19 L105 16 Z"></path>
      <text class="s-q" x="100" y="36">?</text>
      <g class="s-bang"><circle cx="108" cy="22" r="11"></circle><path d="M108 15 L108 24"></path><circle cx="108" cy="29.5" r="2.2"></circle></g>
      <path class="s-heart" d="M100 22 C100 16 108 16 108 22 C108 16 116 16 116 22 C116 29 108 33 108 36 C108 33 100 29 100 22 Z"></path>
      <g class="s-zzz"><text x="94" y="40">z</text><text x="103" y="28">z</text><text x="111" y="14">z</text></g>
      <path class="s-sweat" d="M101 38 Q96 47 101 51 Q106 47 101 38 Z"></path>
    </svg>`;
  }

  // 눈 따라오기 — 눈은 통째로(최대 7), 코·입은 그 절반만, 머리는 조금 기운다. 단위는 그림 안의 좌표(120칸)
  function gaze(dx, dy) {
    const d = Math.hypot(dx, dy) || 1, m = 7 * Math.min(1, d / 220);
    return { x: dx / d * m, y: dy / d * m * 0.8 };
  }
  function follow(container, point) {
    for (const el of container.querySelectorAll("svg.cat")) {
      const b = el.getBoundingClientRect();
      if (!b.width) continue;
      const k = 120 / b.width;
      const g = gaze((point.x - (b.left + b.width / 2)) * k, (point.y - (b.top + b.height * 0.58)) * k);
      el.querySelector(".c-eyes").setAttribute("transform", `translate(${g.x.toFixed(1)} ${g.y.toFixed(1)})`);
      el.querySelector(".c-snout").setAttribute("transform", `translate(${(g.x / 2).toFixed(1)} ${(g.y / 2).toFixed(1)})`);
      el.querySelector(".c-head").setAttribute("transform", `rotate(${(g.x * 0.9).toFixed(1)} 60 72)`);
    }
  }

  // ── 교감 — 순수 함수(navigator.test.js가 확인한다) ──

  // 쓰다듬기 알아채기: 고양이 위에서 좌우로 문지르면, 12px 넘게 간 뒤 방향을 바꿀 때마다 한 번 센다.
  // 4번이면 한 번 쓰다듬은 것(petted). 0.7초 넘게 멈추면 처음부터 다시 센다.
  function stroke(s, x, t) {
    const prev = s && t - s.t < 700 ? s : { x, t, dir: 0, run: 0, turns: 0 };
    const dx = x - prev.x, dir = Math.sign(dx);
    let { run, turns } = prev;
    if (dir && dir === prev.dir) run += Math.abs(dx);
    else if (dir) { if (prev.dir && run >= 12) turns++; run = Math.abs(dx); }
    const petted = turns >= 4;
    return { x, t, dir: dir || prev.dir, run, turns: petted ? 0 : turns, petted };
  }

  // 친해진 정도 — 쓰다듬은 횟수로 네 칸
  const BOND = [[0, "처음 만난 사이"], [5, "친해지는 중"], [20, "단짝"], [50, "둘도 없는 단짝"]];
  function bond(pets) {
    const n = Math.max(0, pets | 0);
    let level = 0;
    while (level + 1 < BOND.length && n >= BOND[level + 1][0]) level++;
    const next = BOND[level + 1];
    return { level, name: BOND[level][1], need: next ? next[0] - n : 0 };
  }

  // 쓰다듬으면 하는 말 — 친해질수록 달라진다
  const PET_LINES = [
    ["앗, 간지러워요!", "헤헤, 반가워요", "냐옹~"],
    ["그르릉… 좋아요", "오늘도 같이 해요!", "쓰다듬어 줘서 힘이 나요"],
    ["역시 단짝이에요", "그르릉 그르릉…", "같이 하니까 든든해요"],
    ["언제나 옆에 있을게요", "세상에서 제일 좋아요!", "그르릉… 행복해요"],
  ];
  const petLine = (pets) => { const lines = PET_LINES[bond(pets).level]; return lines[Math.max(0, pets | 0) % lines.length]; };

  // 시간에 맞춘 인사 (이 컴퓨터의 시)
  function greeting(hour) {
    if (hour >= 5 && hour < 11) return "좋은 아침이에요!";
    if (hour >= 11 && hour < 14) return "점심은 드셨어요?";
    if (hour >= 14 && hour < 18) return "오후도 같이 힘내요!";
    if (hour >= 18 && hour < 22) return "오늘 하루도 수고했어요!";
    return "늦은 밤이네요, 무리하지 마요.";
  }

  // 아무것도 안 하고 있으면 졸다가 잠든다 — 1분이면 하품, 1분 30초면 잠
  const sleepy = (idleMs) => (idleMs >= 90_000 ? "sleep" : idleMs >= 60_000 ? "yawn" : "awake");

  // ── 화면 효과 — 브라우저에서만. 움직임 줄이기 설정이면 부르는 쪽(app.js)이 부르지 않는다 ──
  const SHAPES = {
    heart: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 21C5 15.5 2 12 2 8.2 2 5.3 4.3 3 7.1 3c1.9 0 3.6 1 4.9 2.7C13.3 4 15 3 16.9 3 19.7 3 22 5.3 22 8.2 22 12 19 15.5 12 21z" fill="#FF6F86"></path></svg>',
    star: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.5 5.8 21.1l1.6-7L2 9.3l7.1-.7z" fill="#F5B524"></path></svg>',
    paw: '<svg viewBox="0 0 24 24" width="16" height="16"><g fill="#F4A950"><ellipse cx="12" cy="16" rx="5.5" ry="4.5"></ellipse><circle cx="5.5" cy="10" r="2.4"></circle><circle cx="9.5" cy="6" r="2.4"></circle><circle cx="14.5" cy="6" r="2.4"></circle><circle cx="18.5" cy="10" r="2.4"></circle></g></svg>',
  };
  // (x, y)에서 n개를 튀긴다. spread: 퍼지는 각도(도) — 140이면 위쪽 부채꼴, 360이면 사방
  function burst(x, y, kind = "heart", n = 6, spread = 140) {
    const layer = typeof document !== "undefined" && document.getElementById("fx");
    if (!layer) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      const a = (-90 + (spread >= 360 ? (360 / n) * i : (Math.random() - 0.5) * spread)) * Math.PI / 180, d = 46 + Math.random() * 60;
      s.className = `fx fx-${kind}`;
      s.innerHTML = SHAPES[kind] || SHAPES.heart;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty("--dx", `${(Math.cos(a) * d).toFixed(0)}px`);
      s.style.setProperty("--dy", `${(Math.sin(a) * d).toFixed(0)}px`);
      s.style.setProperty("--r", `${(Math.random() * 70 - 35).toFixed(0)}deg`);
      s.style.animationDelay = `${i * 22}ms`;
      s.addEventListener("animationend", () => s.remove());
      layer.appendChild(s);
    }
  }
  // 작은 소리 — 녹음 파일 없이 브라우저가 만든 짧은 음. 설정에서 켠 사람에게만(기본 꺼짐)
  const NOTES = { pet: [880, 1320], done: [660, 880, 1100], level: [660, 990, 1320, 1760], pop: [990] };
  let audio = null;
  function chime(kind) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime;
      (NOTES[kind] || NOTES.pop).forEach((f, i) => {
        const o = audio.createOscillator(), g = audio.createGain(), t = t0 + i * 0.09;
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(audio.destination);
        o.start(t);
        o.stop(t + 0.4);
      });
    } catch {}
  }

  const api = { MOODS, svg, gaze, follow, stroke, bond, petLine, PET_LINES, greeting, sleepy, burst, chime };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavCat = api;
})(typeof window !== "undefined" ? window : globalThis);
