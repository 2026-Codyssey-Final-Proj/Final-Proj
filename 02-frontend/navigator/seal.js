// claude-drafted: 2026-10-14, 2026-10-15 — 길잡이 물범 '플로로'의 그림과 교감 도구.
// 2026-10-15 "몽돌-도서관-연동-데모-리퀴드글래스.mp4의 물범과 똑같이, cat.js의 방식은 무시해도 된다" 요청으로 처음부터 다시 그림
// (그 전에는 치즈 고양이 '나비'였고 파일도 cat.js·NavCat이었다).
// 영상 속 플로로: 푸른 기 도는 하얀 강낭콩 몸(왼쪽은 곧게, 아래 오른쪽이 불룩, 오른쪽 아래에 옅은 그늘) · 작은 남색 점 눈 · 아주 작은 코와 ω 입 ·
// 하늘색 Y자 앞지느러미와 그 아래 받치는 곡선 · 오른쪽 아래로 뻗은 꽃잎 두 장 꼬리 · 기쁘거나 잘 때만 분홍 볼 · 수염은 늘(2026-10-17, 전에는 살필 때만).
// 카드 속 플로로(opts.hole)은 울퉁불퉁한 얼음 테두리를 두른 별밤 숨구멍에서 가슴까지 내밀고, 아래는 물 띠에 잠겨 있다.
// 표정은 눈·입(m-*)으로, 상태는 머리 밖 작은 표시(s-*)로. 보이고 숨기는 건 app.css가 한다(다시 그리지 않고 class만 바꿔 표정을 바꾸려고).
// 그림 말고도 교감에 쓰는 순수 함수(쓰다듬기 알아채기·친해진 정도·인사·졸음)와 화면 효과(하트·별·물방울 튀기기·작은 소리)가 여기 있다.
(function (root) {
  // 앞의 여섯은 안내 화면(navigator.js의 face·docFace)이 쓰고, 뒤의 다섯은 교감할 때 잠깐 짓는 표정이다
  const MOODS = ["idle", "happy", "look", "done", "think", "alert", "love", "purr", "sleep", "yawn", "wow", "angry"];   // angry — 막을 때(C-19, 2026-10-20): 화난 눈 + 손의 X 표지판(s-sign)
  // 좌표는 120칸. 몸은 x 18~102, 머리 가운데 x 50, 눈 높이 y 35
  const BODY = "M50 10 C66 10 78 21 80 38 C81 50 83 58 91 68 C100 79 102 96 94 106 C87 114 73 115 57 115 C39 115 27 112 22 103 C17 94 18 78 19 63 C20 47 20 31 26 21 C32 13 40 10 50 10 Z";
  const SHADE = "M80 38 C81 50 83 58 91 68 C100 79 102 96 94 106 C87 114 73 115 62 115 C80 108 90 96 87 82 C84 70 79 58 80 38 Z";
  const EYE = [39, 60], EY = 35;
  const heart = (x, y) => `M${x} ${y + 3.6} C${x - 4.4} ${y + 0.6} ${x - 4.4} ${y - 3.4} ${x - 1.6} ${y - 3.4} C${x - 0.6} ${y - 3.4} ${x} ${y - 2.4} ${x} ${y - 1.8} C${x} ${y - 2.4} ${x + 0.6} ${y - 3.4} ${x + 1.6} ${y - 3.4} C${x + 4.4} ${y - 3.4} ${x + 4.4} ${y + 0.6} ${x} ${y + 3.6} Z`;
  const both = (f) => EYE.map(f).join(" ");

  // 플로로 한 마리 — size가 32px보다 작으면 입·지느러미·수염을 빼고(.small) 눈을 키운다. tail: 꼬리지느러미, paws: 앞지느러미를 걸친 모습(한 줄 표시)
  // 입체감(2026-10-17): 가장자리로 갈수록 어두워지는 둥근 그늘(c-vol)과 왼쪽 위 반짝임(c-shine) — Coucou의 Mochi와 같은 방식(MIT, 그림은 우리 것).
  // id: 그러데이션 이름. 한 화면에 여러 마리가 있어 마리마다 다르게 준다
  function body(small, tail, paws, id) {
    const r = small ? 5.5 : 3.4;
    // c-body: 몸 전체를 한 덩이로 — 숨쉬기·헤엄은 이 덩이를 움직인다(seal.css). c-head에는 고개 돌리기(follow)가 따로 붙는다
    return `<g class="c-body"><defs><radialGradient id="${id}v" cx=".42" cy=".36" r=".68"><stop offset=".6" stop-color="#1A2350" stop-opacity="0"></stop><stop offset="1" stop-color="#1A2350" stop-opacity=".2"></stop></radialGradient>
        <radialGradient id="${id}s"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"></stop><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"></stop></radialGradient></defs>
      ${tail ? `<g class="c-tail"><ellipse cx="100" cy="110" rx="9" ry="3.6" transform="rotate(25 100 110)"></ellipse><ellipse cx="94" cy="115" rx="8.5" ry="3.4" transform="rotate(65 94 115)"></ellipse></g>` : ""}
      <g class="c-head">
        <path class="c-fur" d="${BODY}"></path>
        <path class="c-shade" d="${SHADE}"></path>
        <path class="c-vol" d="${BODY}" fill="url(#${id}v)"></path>
        <ellipse class="c-shine" cx="36" cy="22" rx="12" ry="7" transform="rotate(-25 36 22)" fill="url(#${id}s)"></ellipse>
        <path class="c-fin" d="M37 62 Q45 64 49 74 M62 59 Q54 64 49 74 M31 72 Q49 85 69 71"></path>
        <g class="c-blush"><ellipse cx="33" cy="42" rx="4.2" ry="2.6"></ellipse><ellipse cx="66" cy="42" rx="4.2" ry="2.6"></ellipse></g>
        <path class="c-whisk" d="M31 41 L22 39.5 M31 43.5 L22 44.5 M68 41 L77 39.5 M68 43.5 L77 44.5"></path>
        <g class="c-eyes">
          <g class="e-dot">${both((x) => `<circle cx="${x}" cy="${EY}" r="${r}"></circle>`)}</g>
          <g class="e-wide">${both((x) => `<circle cx="${x}" cy="${EY}" r="4.6"></circle><circle class="e-glint" cx="${x + 1.4}" cy="${EY - 1.6}" r="1.4"></circle>`)}</g>
          <g class="e-wow">${both((x) => `<circle cx="${x}" cy="${EY}" r="5.2"></circle><circle class="e-glint" cx="${x + 1.6}" cy="${EY - 1.8}" r="1.7"></circle><circle class="e-glint" cx="${x - 1.6}" cy="${EY + 2}" r=".8"></circle>`)}</g>
          <path class="e-happy" d="${both((x) => `M${x - 3.5} ${EY + 1.5} Q${x} ${EY - 3.5} ${x + 3.5} ${EY + 1.5}`)}"></path>
          <path class="e-closed" d="${both((x) => `M${x - 3.5} ${EY - 0.5} Q${x} ${EY + 3} ${x + 3.5} ${EY - 0.5}`)}"></path>
          <path class="e-blink" d="${both((x) => `M${x - 3.5} ${EY} L${x + 3.5} ${EY}`)}"></path>
          <g class="e-think"><circle cx="${EYE[0]}" cy="${EY}" r="3.4"></circle><path d="M56 33.5 L64 36.5"></path></g>
          <g class="e-heart">${both((x) => `<path d="${heart(x, EY)}"></path>`)}</g>
          <g class="e-angry">${both((x) => `<circle cx="${x}" cy="${EY + 0.5}" r="3.4"></circle>`)}<path d="M${EYE[0] - 5} ${EY - 6.5} L${EYE[0] + 4} ${EY - 3.5} M${EYE[1] + 5} ${EY - 6.5} L${EYE[1] - 4} ${EY - 3.5}"></path></g>
        </g>
        <g class="c-snout">
          <path class="c-nose" d="M47.3 39.2 Q49.5 38.2 51.7 39.2 Q50.8 41.6 49.5 41.8 Q48.2 41.6 47.3 39.2 Z"></path>
          <path class="c-mouth" d="M49.5 41.8 L49.5 43.4 M46 43 Q47.7 45.3 49.5 43.4 Q51.3 45.3 53 43"></path>
          <ellipse class="c-open" cx="49.5" cy="45" rx="1.8" ry="2.4"></ellipse>
        </g>
      </g>
      ${paws ? `<g class="c-paws"><ellipse cx="36" cy="114" rx="9" ry="4"></ellipse><ellipse cx="58" cy="114" rx="9" ry="4"></ellipse></g>` : ""}</g>`;
  }
  // 머리 밖 작은 표시 — 살펴보는 중(점점), 다 했어요(반짝), 생각(?), 깜짝(!), 하트, 잠(z), 땀방울, 헤엄칠 때 오르는 물방울(s-bub)
  // X 표지판(C-19) — 왼쪽 앞지느러미 쪽에 막대와 둥근 판, 그 안에 X. 막을 때만 보인다(seal.css .m-angry)
  const SIGN = `<g class="s-sign"><path class="sg-pole" d="M22 70 L22 104"></path><circle class="sg-board" cx="22" cy="62" r="13"></circle><path class="sg-x" d="M16 56 L28 68 M28 56 L16 68"></path></g>`;
  const MARKS = `<g class="s-dots"><circle cx="84" cy="26" r="2.2"></circle><circle cx="90" cy="18" r="3"></circle><circle cx="97" cy="9" r="3.8"></circle></g>
      <path class="s-spark" d="M97 2 L99.5 10 L107 12.5 L99.5 15 L97 23 L94.5 15 L87 12.5 L94.5 10 Z"></path>
      <text class="s-q" x="82" y="27">?</text>
      <g class="s-bang"><circle cx="94" cy="16" r="8"></circle><path d="M94 11 L94 17.5"></path><circle cx="94" cy="21" r="1.6"></circle></g>
      <path class="s-heart" d="M84 15 C84 10 91 10 91 15 C91 10 98 10 98 15 C98 21 91 24 91 27 C91 24 84 21 84 15 Z"></path>
      <g class="s-zzz"><text x="80" y="28">z</text><text x="87" y="18">z</text><text x="95" y="7">z</text></g>
      <path class="s-sweat" d="M80 20 Q76.5 27 80 30 Q83.5 27 80 20 Z"></path>
      <g class="s-bub"><circle cx="50" cy="100" r="2"></circle><circle cx="60" cy="104" r="1.4"></circle><circle cx="43" cy="105" r="1.6"></circle></g>${SIGN}`;

  // 숨구멍(2026-10-17 B안): 얼음 테 · 동그란 틀 대신 물빛이 번진 웅덩이에서 몸을 내민다. 머리는 웅덩이 밖으로 나오고
  // 몸 아래는 물결 아래로 잠긴다. 물 아래(y 110 밑)만 잘라서, 헤엄치며 잠수하면 물속으로 사라진다. 꼬리는 물속이라 그리지 않는다
  // 2026-10-17 어깨까지 담금: 몸이 먼저 보여 표정이 묻힌다는 의견으로 몸을 14칸 내리고 1.12배 키웠다. 머리 밖 표시도 같이 내린다(HOLE_MARKS)
  const hole = (id, small) => `<defs><radialGradient id="${id}p" cy=".62"><stop offset=".35" stop-color="#16226A" stop-opacity=".9"></stop><stop offset="1" stop-color="#16226A" stop-opacity="0"></stop></radialGradient>
      <linearGradient id="${id}w" x2="0" y2="1"><stop offset="0" stop-color="#5D86E6" stop-opacity=".95"></stop><stop offset="1" stop-color="#2A3B8C" stop-opacity=".8"></stop></linearGradient>
      <clipPath id="${id}c"><rect x="-20" y="-40" width="160" height="150"></rect></clipPath></defs>
    <ellipse class="h-pool" cx="60" cy="88" rx="58" ry="40" fill="url(#${id}p)"></ellipse>
    <g class="h-stars"><circle cx="20" cy="74" r=".9"></circle><circle cx="100" cy="68" r="1.1"></circle><circle cx="92" cy="92" r=".7"></circle></g>
    <g clip-path="url(#${id}c)"><g transform="translate(0 18) scale(1.12)">${body(small, false, false, id)}</g></g>
    <path class="h-water" d="M4 100 Q60 92 116 100 Q110 117 60 118 Q10 117 4 100 Z" fill="url(#${id}w)"></path>
    <path class="h-line" d="M14 100 Q60 93 106 100"></path><path class="h-ripple" d="M30 106 Q44 104 52 106 M66 108 Q78 106 90 108"></path>`;
  // 얼굴만(2026-10-17, 접힌 알약): 얼굴 가운데 (50, 40)을 둥글게 잘라 크게 보인다. 몸 · 지느러미 · 꼬리 · 머리 밖 표시(MARKS)는 뺀다
  const HOLE_MARKS = `<g transform="translate(-2 12)">${MARKS}</g>`;
  const FACE_BOX = "18 8 64 64";
  const face = (id) => `<defs><clipPath id="${id}f"><circle cx="50" cy="40" r="32"></circle></clipPath></defs><g clip-path="url(#${id}f)">${body(false, false, false, id)}</g>`;

  // opts.paws: 한 줄 표시용, opts.face: 얼굴만(접힌 알약), opts.hole: 카드 속 숨구멍, opts.extra: 덧붙일 class (예: "oops" — 땀방울), opts.noTail: 꼬리 없이
  let uid = 0;
  function svg(mood, size, opts = {}) {
    const m = MOODS.includes(mood) ? mood : "idle", id = `fl${++uid}`;
    const small = size < 32 && !opts.face, tail = size >= 56 && !opts.noTail;
    const cls = ["cat", `m-${m}`, small && "small", opts.face && "face", opts.hole && !opts.face && "hole", opts.extra].filter(Boolean).join(" ");
    const inner = opts.face ? face(id) : opts.hole ? hole(id, small) + HOLE_MARKS : body(small, tail, opts.paws, id) + MARKS;
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="${opts.face ? FACE_BOX : "0 0 120 120"}" aria-hidden="true">
      ${inner}</svg>`;
  }

  // 눈 따라오기 — 커서가 있는 쪽과 거리를 그림 안의 칸(120칸)으로, 최대 7칸. 얼굴을 얼마나 돌릴지는 turn()이 정한다
  function gaze(dx, dy) {
    const d = Math.hypot(dx, dy) || 1, m = 7 * Math.min(1, d / 220);
    return { x: dx / d * m, y: dy / d * m * 0.8 };
  }
  // 고개 돌리기(2026-10-17) — 머리를 반지름 30칸짜리 공으로 보고 눈·코를 그 겉면에 붙인다(Coucou의 Mochi 방식).
  // 옆으로 돌면 얼굴이 그쪽으로 미끄러지면서 가로로 좁아지고(원근), 위아래도 같다. 머리 윤곽은 그대로 둔다.
  // 돌려주는 것: 얼굴이 옮겨 갈 칸(x, y)과 좁아지는 비율(sx, sy). 최대 좌우 0.35·위아래 0.25 라디안(약 20°·14°)
  function turn(g) {
    const yaw = (g.x / 7) * 0.35, pitch = (g.y / 7) * 0.25;
    return { x: 30 * Math.sin(yaw), y: 30 * Math.sin(pitch), sx: Math.cos(yaw), sy: Math.cos(pitch) };
  }
  function follow(container, point) {
    for (const el of container.querySelectorAll("svg.cat")) {
      const b = el.getBoundingClientRect();
      if (!b.width) continue;
      const k = 120 / b.width;
      const t = turn(gaze((point.x - (b.left + b.width / 2)) * k, (point.y - (b.top + b.height * 0.4)) * k));
      // depth: 코는 공의 맨 앞이라 다 옮겨 가고, 눈·볼은 조금 옆이라 0.9만. 얼굴 가운데 (50, 38)을 기준으로 좁힌다
      const face = (depth) => `translate(${(50 + t.x * depth).toFixed(2)} ${(38 + t.y * depth).toFixed(2)}) scale(${t.sx.toFixed(3)} ${t.sy.toFixed(3)}) translate(-50 -38)`;
      for (const [sel, depth] of [[".c-eyes", 0.9], [".c-blush", 0.9], [".c-snout", 1], [".c-whisk", 1]]) el.querySelector(sel).setAttribute("transform", face(depth));
      el.querySelector(".c-head").setAttribute("transform", `rotate(${(t.x * 0.3).toFixed(1)} 55 108)`);
    }
  }
  // 미끄러져 따라가기(2026-10-19 F-27, 이재엽 "창 밖에 있을 때 부드럽지 못해") — 창 밖 커서는 앱이 1초에 30번만 보내 줘서(electron/main.js) 받은 점으로
  // 바로 뛰면 계단처럼 보인다. 그래서 프레임마다 남은 거리의 일부씩 간다: dt ms 동안 남은 거리의 1 - e^(-dt/tau)만큼(tau 80ms면 80ms에 63%, 240ms에 95%).
  // 0.5px 안에 들면 목표에 딱 맞추고 done. from이 없으면 바로 목표(처음 한 번)
  function glide(from, to, dt, tau = 80) {
    if (!from) return { x: to.x, y: to.y, done: true };
    const k = 1 - Math.exp(-Math.max(0, dt || 0) / tau);
    const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k;
    return Math.abs(to.x - x) < 0.5 && Math.abs(to.y - y) < 0.5 ? { x: to.x, y: to.y, done: true } : { x, y, done: false };
  }

  // ── 교감 — 순수 함수(navigator.test.js가 확인한다) ──

  // 쓰다듬기 알아채기: 플로로 위에서 좌우로 문지르면, 12px 넘게 간 뒤 방향을 바꿀 때마다 한 번 센다.
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
    ["앗, 간지러워요!", "헤헤, 반가워요", "꾸우~"],
    ["흥얼흥얼… 좋아요", "오늘도 같이 해요!", "쓰다듬어 줘서 힘이 나요"],
    ["역시 단짝이에요", "흥얼흥얼~", "같이 하니까 든든해요"],
    ["언제나 옆에 있을게요", "세상에서 제일 좋아요!", "흥얼… 행복해요"],
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
    bubble: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="8" fill="rgba(169,221,255,.25)" stroke="#A9DDFF" stroke-width="2"></circle><circle cx="9" cy="9" r="2.2" fill="#FFFFFF"></circle></svg>',
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

  const api = { MOODS, svg, gaze, turn, follow, glide, stroke, bond, petLine, PET_LINES, greeting, sleepy, burst, chime };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavSeal = api;
})(typeof window !== "undefined" ? window : globalThis);
