// claude-drafted: 2026-10-17 — 지식 하늘의 동작. GitHub 지식 파일(sky-data.js, 더미) → knowledge-sky.js → 그리기.
// 세 겹으로 들어간다: 한 해 하늘(은하 12개) → 은하(달 폴더, 태양계 = 태그) → 태양계(그 태그의 책 = 별).
// "어디에 있어요?"를 늘 한 줄로 말한다: 몇 월 은하 · 어느 태양계 · 몇 번째 별.
(function () {
  const K = window.KnowledgeSky, D = window.SkyData, H = window.LibSearch.highlight;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const seal = (m, s) => (window.NavSeal ? window.NavSeal.svg(m, s) : "");
  const LEVELS = ["처음 봄", "이해함", "직접 씀", "응용함"];
  const sym = (g) => `${g.symbol}︎`;   // 이모지가 아니라 글자 모양으로
  const gname = (g) => `${g.month}월 은하`;
  // 태양계마다 성운 빛깔 — 얼음 파랑을 바탕으로 보라 · 청록 · 호박 · 분홍을 조금씩
  const HUES = ["#7aa8ff", "#a68cff", "#5fd4d0", "#ffb867", "#ff8fb8", "#9ad97a", "#c3a6ff", "#70c6ff"];

  const st = { files: [...D.FILES], pending: [...D.PENDING], lastSync: D.REPO.lastSync, view: "galaxy", month: 10, tag: null, pick: null, tagAll: null, fresh: new Set() };
  let sky = build();
  function build() { return K.buildSky(st.files, { year: 2026, repo: D.REPO.name }); }
  const G = () => sky.galaxies[st.month - 1];
  const S = () => G().systems.find((s) => s.tag === st.tag);
  const every = () => sky.galaxies.flatMap((g) => g.systems.flatMap((s) => s.items));
  const keyOf = (it) => it.source.path;

  // 배경 별
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  $("sky").innerHTML = Array.from({ length: 220 }, () => `<i style="left:${rnd() * 100}%;top:${rnd() * 100}%;opacity:${(rnd() * .6 + .1).toFixed(2)};transform:scale(${(rnd() * 1.2 + .2).toFixed(2)})"></i>`).join("");
  $("seal").innerHTML = seal("idle", 92);

  // ── 별 하나 — 이해 수준이 밝기 · 크기, 응용함은 금빛, 직접 씀부터 십자 빛 ──
  function starSvg(x, y, it, i, k, { sel, fresh }) {
    const b = [.5, .7, .88, 1][it.level], gold = it.level === 3, jitter = ((i * 37) % 5) * .08;
    const r = (.42 + it.level * .2 + jitter) * k, col = gold ? "#ffd98a" : "#e8f3ff";
    let s = `<circle cx="${x}" cy="${y}" r="${r * 4.2}" fill="url(#${gold ? "halo-gold" : "halo-ice"})" opacity="${b * .75}"></circle>`;
    if (it.level >= 2) { const L = r * (gold ? 5.2 : 3.8); s += `<path class="spark" d="M${x - L} ${y}H${x + L}M${x} ${y - L}V${y + L}" stroke="${col}" stroke-width="${.09 * k}" opacity="${b}"></path>`; }
    s += `<circle class="${fresh ? "new" : ""}" cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${b}"></circle>`;
    if (sel) s += `<circle class="ring" cx="${x}" cy="${y}" r="${r * 3.4}"></circle>`;
    return s;
  }
  const defs = () => `<defs>
    <radialGradient id="halo-ice"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".95"/><stop offset=".35" stop-color="#9cc8ff" stop-opacity=".35"/><stop offset="1" stop-color="#9cc8ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo-gold"><stop offset="0" stop-color="#fff1c4" stop-opacity="1"/><stop offset=".35" stop-color="#ffc768" stop-opacity=".4"/><stop offset="1" stop-color="#ffc768" stop-opacity="0"/></radialGradient>
    <radialGradient id="sun"><stop offset="0" stop-color="#fffaf0"/><stop offset=".25" stop-color="#fff3d6" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></radialGradient>
    <filter id="neb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>`;

  // 태양계를 은하 좌표에 놓는다 — 별자리 좌표(0~100)를 반지름 R 안으로 줄인다
  const AX = 1.45, GALAXY_BOX = "-4 -2 153 104";   // 화면이 가로로 넓어서 은하도 가로로 펼친다(태양계 중심만, 별자리 모양은 그대로)
  const radius = (s) => Math.min(17, 7 + 1.7 * Math.sqrt(s.items.length + 1));
  const center = (s) => [s.at[0] * AX, s.at[1]];
  const toGalaxy = (s, [x, y]) => { const R = radius(s), [cx, cy] = center(s); return [+(cx + (x - 50) / 50 * R).toFixed(2), +(cy + (y - 50) / 50 * R).toFixed(2)]; };

  // 성운 — 은하 가운데 띠 하나 + 태양계마다 빛깔 구름, 그리고 잔별(누를 수 없는 먼지)
  function nebula(g) {
    let out = `<ellipse cx="${50 * AX}" cy="50" rx="${46 * AX}" ry="20" transform="rotate(-14 ${50 * AX} 50)" fill="#6f7dff" opacity=".1" filter="url(#neb)"></ellipse>`;
    out += g.systems.map((s, i) => { const R = radius(s), c = HUES[i % HUES.length], [cx, cy] = center(s);
      return `<ellipse cx="${cx}" cy="${cy}" rx="${R * 1.5}" ry="${R * 1.1}" fill="${c}" opacity=".3" filter="url(#neb)"></ellipse>`; }).join("");
    return out;
  }
  function dust(g, k) {
    let n = g.month * 97 + 13; const r = () => (n = (n * 16807) % 2147483647) / 2147483647;
    return g.systems.map((s) => { const [cx, cy] = center(s), R = radius(s) * 1.6;
      return Array.from({ length: 8 + s.items.length * 2 }, () => { const a = r() * 6.283, d = R * Math.sqrt(r());
        return `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d * .8).toFixed(1)}" r="${((.12 + r() * .22) * k).toFixed(2)}" fill="#dfeeff" opacity="${(.25 + r() * .5).toFixed(2)}"></circle>`; }).join(""); }).join("");
  }

  // 별자리 선 — 해(0)에서 갈라지는 가지
  function edgesSvg(s, pt, w) {
    const P = [pt(s.shape.sun), ...s.shape.stars.map(pt)];
    return s.shape.edges.map(([a, b]) => `<line class="edge${a === 0 ? " root" : ""}" x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke-width="${a === 0 ? w * .6 : w}"></line>`).join("");
  }

  // ── 은하 하나 (한 해 카드와 은하 화면이 같이 쓴다) ──
  function drawGalaxy(g, { big }) {
    let out = defs() + nebula(g) + dust(g, big ? 1 : 2);
    if (big) out += `<text class="wm" x="${50 * AX}" y="62">${sym(g)}</text>`;
    // 태양계 사이 다리 — 같은 책이 두 태그를 가질 때
    const seenBridge = new Set();
    for (const br of g.bridges) {
      const a = g.systems.find((s) => s.tag === br.from), b = g.systems.find((s) => s.tag === br.to), key = [br.from, br.to].sort().join("|");
      if (!a || !b || seenBridge.has(key)) continue; seenBridge.add(key);
      const [ax, ay] = center(a), [bx, by] = center(b), mx = (ax + bx) / 2, my = (ay + by) / 2 - 6;
      out += `<path class="bridge" d="M${ax} ${ay}Q${mx} ${my} ${bx} ${by}"></path>`;
    }
    g.systems.forEach((s, si) => {
      const pt = (p) => toGalaxy(s, p), sun = pt(s.shape.sun);
      let grp = edgesSvg(s, pt, big ? .16 : .35);
      grp += `<circle cx="${sun[0]}" cy="${sun[1]}" r="${big ? 2.4 : 4}" fill="url(#sun)"></circle><circle cx="${sun[0]}" cy="${sun[1]}" r="${big ? .55 : .9}" fill="#fffaf0"></circle>`;
      s.items.forEach((it, i) => { const [x, y] = pt(s.shape.stars[i]); grp += starSvg(x, y, it, i + si, big ? .9 : 1.6, { fresh: st.fresh.has(keyOf(it)) }); });
      if (big) {
        const n = s.items.length + s.guests.length, ly = Math.min(96, sun[1] + radius(s) * .82 + 3.2);
        grp += `<g class="tagl"><text x="${sun[0]}" y="${ly}">${esc(s.tag)}</text><text class="n" x="${sun[0]}" y="${ly + 2.6}">책 ${s.items.length}권${s.guests.length ? ` · 손님 ${s.guests.length}` : ""}</text></g>`;
        out += `<g class="sys" tabindex="0" role="button" data-tag="${esc(s.tag)}" aria-label="${esc(s.tag)} 태양계, 책 ${n}권">
          <circle class="hit" cx="${center(s)[0]}" cy="${center(s)[1]}" r="${radius(s) + 2}"></circle>${grp}</g>`;
      } else out += grp;
    });
    return out;
  }

  // ── 태양계 하나를 크게 — 별마다 제목 · 이해 수준 ──
  function drawSystem(g, s) {
    const si = g.systems.indexOf(s), c = HUES[si % HUES.length];
    // 화면을 채우도록 펼친다 — 가장 먼 별이 해에서 가로 60 · 세로 40쯤
    const far = Math.max(8, ...s.shape.stars.map(([x, y]) => Math.hypot(x - 50, (y - 50) * 1.2)));
    const pt = ([x, y]) => [+(70 + (x - 50) * 60 / far).toFixed(2), +(50 + (y - 50) * 40 / far).toFixed(2)];
    let out = defs() + `<ellipse cx="70" cy="50" rx="74" ry="44" fill="${c}" opacity=".2" filter="url(#neb)"></ellipse>`;
    let n = si * 31 + 7; const r = () => (n = (n * 16807) % 2147483647) / 2147483647;
    out += Array.from({ length: 70 }, () => `<circle cx="${(r() * 140).toFixed(1)}" cy="${(r() * 100).toFixed(1)}" r="${(.12 + r() * .25).toFixed(2)}" fill="#dfeeff" opacity="${(.2 + r() * .5).toFixed(2)}"></circle>`).join("");
    out += `<text class="wm" x="70" y="60">${sym(g)}</text>`;
    out += edgesSvg(s, pt, .22);
    out += `<circle cx="70" cy="50" r="7" fill="url(#sun)"></circle><circle cx="70" cy="50" r="1.4" fill="#fffaf0"></circle>
      <text class="sunl" x="70" y="${50 + 9.5}">${esc(s.tag)}</text>`;
    const boxes = [{ x: 62, y: 55.5, w: 16 }];   // 해 이름 자리는 비워 둔다
    s.items.forEach((it, i) => {
      const [x, y] = pt(s.shape.stars[i]), sel = st.pick === it.star, fresh = st.fresh.has(keyOf(it));
      const title = `★${it.star} ${it.title}`, w = Math.min(44, title.length * 2.05 + 4), left = x > 92;
      const lx = Math.max(0, Math.min(140 - w, left ? x - 2.6 - w : x + 2.6)); let ly = y - 4.6;
      while (boxes.some((o) => lx < o.x + o.w && o.x < lx + w && ly < o.y + 6.4 && o.y < ly + 6.4)) ly += 6.8;
      boxes.push({ x: lx, y: ly, w });
      out += `<g class="st${sel ? " sel" : ""}" tabindex="0" role="button" data-star="${it.star}" aria-label="${esc(it.where)}, ${esc(it.title)}, ${LEVELS[it.level]}">
        <circle class="hit" cx="${x}" cy="${y}" r="3"></circle>${starSvg(x, y, it, i, 1.5, { sel, fresh })}
        <g class="lab"><rect x="${lx}" y="${ly}" width="${w}" height="6" rx="1.3"></rect>
          <text x="${lx + 1.4}" y="${ly + 2.7}">${esc(title.length > 21 ? title.slice(0, 20) + "…" : title)}</text>
          <text class="pt" x="${lx + 1.4}" y="${ly + 4.9}">${LEVELS[it.level]} · ${it.date.slice(5).replace("-", "/")}</text></g></g>`;
    });
    if (!s.items.length) out += `<text class="empty-lab" x="70" y="72">이 태그가 첫 태그인 책은 아직 없어요 — 손님 책만 있어요</text>`;
    return out;
  }

  // ── 머리말: 어디에 있는지 빵 부스러기 ──
  function head() {
    const g = G(), crumbs = [`<button data-go="year">2026 하늘</button>`];
    if (st.view !== "year") crumbs.push(st.view === "system" ? `<button data-go="galaxy">${gname(g)}</button>` : `<b>${gname(g)}</b>`);
    if (st.view === "system") crumbs.push(`<b>${esc(st.tag)} 태양계</b>`);
    let title, sub;
    if (st.view === "galaxy") { title = `<span class="sym">${sym(g)}</span>${gname(g)} · ${g.sign} — ${esc(g.theme)}`; sub = `폴더 <code>${esc(g.folder)}</code> · 태양계(태그) ${g.systems.length}개 · 책 ${g.count}권`; }
    else { const s = S(); title = `<span class="sun-dot"></span>${esc(s.tag)} 태양계`; sub = `${gname(g)} 안 · 이 태그가 첫 태그인 책 ${s.items.length}권${s.guests.length ? ` · 다른 태양계에서 온 손님 책 ${s.guests.length}권` : ""}`; }
    $("story-head").innerHTML = `<nav class="crumbs" aria-label="어디에 있나">${crumbs.join('<span aria-hidden="true">›</span>')}</nav><h1 id="story-title">${title}</h1><p>${sub}</p>`;
    $("story-head").querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => (b.dataset.go === "year" ? goYear() : goTo(st.month))));
  }

  // ── 은하 화면 ──
  function renderGalaxy() {
    const g = G();
    head();
    $("const").setAttribute("viewBox", GALAXY_BOX);
    $("const").innerHTML = drawGalaxy(g, { big: true });
    $("const").querySelectorAll(".sys").forEach((el) => {
      const open = () => goTo(st.month, el.dataset.tag);
      el.onclick = open; el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
    });
    if (st.tagAll) return renderTagAll();
    if (!g.count) {
      $("panel").innerHTML = `<h2>${gname(g)}</h2><p class="void">아직 이 은하에는 별이 없어요.<br>GitHub의 <code>${esc(g.folder)}</code> 폴더에 지식 파일이 올라오면 태그마다 태양계가 생겨요.</p>`;
      return say(`${gname(g)}은 아직 비어 있어요.`, "sleep");
    }
    $("panel").innerHTML = `<h2>이 은하의 태양계 ${g.systems.length}개</h2><p class="hint">태양계 = 태그예요. 누르면 그 태그의 책들이 별자리로 펼쳐져요</p>
      <ul class="syslist">${g.systems.map((s, i) => `<li><button data-tag="${esc(s.tag)}"><span class="dot" style="--c:${HUES[i % HUES.length]}"></span><b>${esc(s.tag)}</b>
        <span class="cnt">${s.items.length}권${s.guests.length ? ` +${s.guests.length}` : ""}</span>
        <span class="peek">${s.items.slice(0, 3).map((it) => esc(it.title)).join(" · ")}${s.items.length > 3 ? " …" : ""}</span></button></li>`).join("")}</ul>
      ${tagCloud()}`;
    bindPanel();
    say(`${gname(g)}엔 태양계 ${g.systems.length}개, 책 ${g.count}권이 떠 있어요. 가장 큰 건 ‘${g.systems[0].tag}’예요.`, "idle");
  }

  // ── 태양계 화면 ──
  function renderSystem() {
    const g = G(), s = S();
    head();
    $("const").setAttribute("viewBox", "0 0 140 100");
    $("const").innerHTML = drawSystem(g, s);
    $("const").querySelectorAll(".st").forEach((el) => {
      const pick = () => { st.pick = st.pick === +el.dataset.star ? null : +el.dataset.star; render(); };
      el.onclick = pick; el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } };
    });
    if (st.tagAll) return renderTagAll();
    const row = (it, guest) => {
      const open = !guest && st.pick === it.star;
      return `<li><button aria-expanded="${open}" ${guest ? `data-jump="${esc(keyOf(it))}"` : `data-star="${it.star}"`}>
        <span class="no">${guest ? "손님" : `★${it.star}`}</span><span class="tt">${esc(it.title)}</span><span class="dt">${it.date.slice(5).replace("-", "/")}</span>
        <span class="pt">${guest ? `${esc(it.where)}에서` : LEVELS[it.level]}</span></button>${open ? detail(it) : ""}</li>`;
    };
    $("panel").innerHTML = `<h2>‘${esc(s.tag)}’ 태그의 책 ${s.items.length + s.guests.length}권</h2><p class="hint">별을 누르거나 아래에서 고르면 어디에 있는지 · GitHub 어느 파일인지 보여요</p>
      <ol class="plist">${s.items.map((it) => row(it, false)).join("")}${s.guests.map((it) => row(it, true)).join("")}</ol>
      <button class="pillbtn alltag" data-all="${esc(s.tag)}">✦ 모든 은하에서 ‘${esc(s.tag)}’ 책 보기 (${K.booksByTag(sky, s.tag).length}권)</button>`;
    bindPanel();
    const it = s.items.find((x) => x.star === st.pick);
    say(it ? `${it.where}에 있어요.` : `‘${s.tag}’ 태양계예요. 별 ${s.items.length}개가 해에서 가지처럼 뻗어 있어요.`, it ? "look" : "idle");
  }

  function detail(it) {
    const others = K.booksByTag(sky, it.system).filter((o) => o.month !== it.month);
    return `<div class="detail">
      <div class="where">📍 ${esc(it.where)}</div>
      <div class="line">${esc(it.line)}</div>
      <div class="row">${it.tags.map((t) => `<button data-all="${esc(t)}" title="모든 은하에서 이 태그 보기"># ${esc(t)}</button>`).join("")}</div>
      <div class="src">GitHub ${esc(it.source.repo)} · main<br>${esc(it.source.path)}<br>커밋 ${esc(it.source.commit)}</div>
      <div class="row"><button class="ghbtn" aria-disabled="true" title="시안: 예시 저장소라 열 수 없어요">GitHub에서 열기 ↗</button></div>
      ${others.length ? `<div class="row"><small>다른 은하의 같은 태양계</small>${others.slice(0, 4).map((o) => `<button data-jump="${esc(keyOf(o))}">${o.month}월 ★${o.star}</button>`).join("")}</div>` : ""}
    </div>`;
  }

  // ── 태그로 보기 — 모든 은하를 가로질러 ──
  function tagCloud() {
    return `<div class="cloud"><small>모든 은하의 태그</small>${K.allTags(sky).map((t) => `<button data-all="${esc(t.tag)}"># ${esc(t.tag)} <i>${t.count}</i></button>`).join("")}</div>`;
  }
  function renderTagAll() {
    const tag = st.tagAll, books = K.booksByTag(sky, tag), byMonth = new Map();
    for (const b of books) (byMonth.get(b.month) || byMonth.set(b.month, []).get(b.month)).push(b);
    $("panel").innerHTML = `<h2># ${esc(tag)} — 모든 은하의 책 ${books.length}권</h2><p class="hint">은하(달) 순서예요. 누르면 그 별로 가요</p>
      <div class="tagall">${[...byMonth].map(([m, bs]) => `<section><h3>${sym(sky.galaxies[m - 1])} ${m}월 은하</h3>
        <ol>${bs.map((b) => `<li><button data-jump="${esc(keyOf(b))}"><span class="tt">${H(b.title, tag)}</span><span class="pt">${esc(b.system)} 태양계 ★${b.star} · ${LEVELS[b.level]}</span></button></li>`).join("")}</ol></section>`).join("")}</div>
      <button class="pillbtn alltag" data-close-all="1">← 돌아가기</button>`;
    bindPanel();
    say(`‘${tag}’ 책은 ${byMonth.size}개 은하에 ${books.length}권 있어요.`, "happy");
  }

  function bindPanel() {
    const P = $("panel");
    P.querySelectorAll("[data-tag]").forEach((b) => (b.onclick = () => goTo(st.month, b.dataset.tag)));
    P.querySelectorAll("[data-star]").forEach((b) => (b.onclick = () => { st.pick = st.pick === +b.dataset.star ? null : +b.dataset.star; render(); $("panel").querySelector(`[data-star="${b.dataset.star}"]`)?.focus(); }));
    P.querySelectorAll("[data-jump]").forEach((b) => (b.onclick = () => jumpTo(every().find((x) => keyOf(x) === b.dataset.jump))));
    P.querySelectorAll("[data-all]").forEach((b) => (b.onclick = () => { st.tagAll = b.dataset.all; render(); history.replaceState(null, "", `#tag=${encodeURIComponent(st.tagAll)}`); }));
    P.querySelectorAll("[data-close-all]").forEach((b) => (b.onclick = () => { st.tagAll = null; render(); }));
  }

  // ── 한 해 하늘 — 은하 12개 ──
  function renderYear() {
    $("year").innerHTML = sky.galaxies.map((g) => `<button class="ycard${g.month === 10 ? " now" : ""}${g.count ? "" : " off"}" data-m="${g.month}" aria-label="${gname(g)}, 태양계 ${g.systems.length}개, 책 ${g.count}권">
      <b>${sym(g)} ${gname(g)}</b><small>${g.sign} · 태양계 ${g.systems.length} · 책 ${g.count}</small>
      <svg viewBox="${GALAXY_BOX}" aria-hidden="true">${drawGalaxy(g, { big: false })}</svg>
      <span class="tags">${g.systems.slice(0, 3).map((s) => esc(s.tag)).join(" · ")}</span></button>`).join("");
    $("year").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => goTo(+b.dataset.m)));
    $("story-head").innerHTML = "";
    const n = sky.galaxies.filter((g) => g.count).length;
    say(`올해 하늘엔 은하 ${n}개에 별이 떴어요. 은하는 달마다 하나, 폴더 하나예요.`, "happy");
  }

  function renderMonths() {
    $("months").innerHTML = `<button class="yr" aria-pressed="${st.view === "year"}" data-yr="1"><b>한 해</b><span class="sy">✦</span><span class="dots">${every().length}권</span></button>` +
      sky.galaxies.map((g) => `<button class="${g.count ? "" : "off"}" aria-pressed="${st.view !== "year" && st.month === g.month}" data-m="${g.month}" aria-label="${gname(g)}, 책 ${g.count}권">
        <b>${g.month}월</b><span class="sy">${sym(g)}</span><span class="dots">${"•".repeat(Math.min(g.systems.length, 6))}${g.systems.length > 6 ? "+" : ""}</span></button>`).join("");
    $("months").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => goTo(+b.dataset.m)));
    $("months").querySelector("[data-yr]").onclick = goYear;
  }

  // ── GitHub ──
  function renderGh() {
    $("gh-repo").textContent = D.REPO.name;
    $("gh-meta").innerHTML = `${D.REPO.branch} · 지식 파일 ${st.files.length}개 · 마지막 가져옴 ${esc(st.lastSync)}${sky.skipped.length ? `<br>하늘에 못 올린 파일 ${sky.skipped.length}개` : ""}`;
    const b = $("gh-pull");
    b.disabled = !st.pending.length;
    b.textContent = st.pending.length ? `새 지식 ${st.pending.length}개 가져오기` : "최신이에요";
  }
  $("gh-pull").onclick = () => {
    if (!st.pending.length) return;
    const got = st.pending; st.files.push(...got); st.pending = []; st.lastSync = "방금"; sky = build();
    st.fresh = new Set(got.map((f) => f.path));
    const placed = every().filter((x) => st.fresh.has(keyOf(x)));
    toast(`GitHub에서 새 지식 ${got.length}개를 가져왔어요 — ${placed.map((x) => x.where).join(" · ")}`);
    if (placed[0]) goTo(placed[0].month, placed[0].system); else render();
    setTimeout(() => { st.fresh = new Set(); }, 4000);
  };

  // ── 검색: 결과는 검색창 바로 밑, 오른쪽에 "어디에" ──
  const norm = (s) => String(s).toLowerCase();
  const spot = window.Spotlight.attach({
    form: $("search"), input: $("q"), placeholderHint: "별로 가기",
    search: (q) => {
      const ts = norm(q).split(/\s+/).filter(Boolean);
      return every().filter((it) => { const hay = norm(`${it.title} ${it.line} ${it.tags.join(" ")} ${it.month}월 은하 ${it.system} 태양계`); return ts.every((t) => hay.includes(t)); })
        .map((it) => ({
          icon: '<span class="ic-star"></span>', plain: it.title, hint: "별로 가기",
          title: H(it.title, q), sub: `${H(it.line, q)} · ${it.tags.map((t) => "#" + H(t, q)).join(" ")}`,
          right: esc(it.where), open: () => { spot.close(); jumpTo(it); },
        }));
    },
  });

  function goYear() { st.view = "year"; st.tagAll = null; render(); history.replaceState(null, "", "#year"); }
  function goTo(month, tag = null, star = null) {
    st.month = month; st.tag = tag; st.pick = star; st.view = tag ? "system" : "galaxy"; st.tagAll = null; render();
    history.replaceState(null, "", `#m${month}${tag ? "/" + encodeURIComponent(tag) : ""}${star ? "/" + star : ""}`);
  }
  function jumpTo(it) { if (it) goTo(it.month, it.system, it.star); }

  function render() {
    $("count").textContent = `책 ${every().length}권 · 은하 ${sky.galaxies.filter((g) => g.count).length}개 · 태그 ${K.allTags(sky).length}개`;
    const year = st.view === "year";
    $("main").hidden = year; $("year").hidden = !year;
    if (st.view === "system" && !S()) st.view = "galaxy";
    if (year) renderYear(); else if (st.view === "system") renderSystem(); else renderGalaxy();
    renderMonths(); renderGh();
  }
  function say(text, mood) { $("say").textContent = text; $("seal").innerHTML = seal(mood, 92); }
  let tt; function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => (el.hidden = true), 3800); }

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if (typing) return;
    if (e.key === "/") { e.preventDefault(); $("q").focus(); }
    if (st.view === "galaxy" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) goTo(((st.month - 1 + (e.key === "ArrowRight" ? 1 : 11)) % 12) + 1);
    if (e.key === "Escape") {   // 한 겹씩 위로: 고른 별 → 태양계 → 은하 → 한 해
      if (st.tagAll) { st.tagAll = null; render(); }
      else if (st.pick) { st.pick = null; render(); }
      else if (st.view === "system") goTo(st.month);
      else if (st.view === "galaxy") goYear();
    }
  });

  // 주소 끝: #year · #m10 · #m10/보안 · #m10/보안/2 · #tag=보안 · #q=EARS
  const h = decodeURIComponent(location.hash.slice(1));
  let mm;
  if (h === "year") goYear();
  else if ((mm = /^m(\d{1,2})(?:\/([^/]+))?(?:\/(\d+))?$/.exec(h))) goTo(Math.min(12, Math.max(1, +mm[1])), mm[2] || null, mm[3] ? +mm[3] : null);
  else if (h.startsWith("tag=")) { st.tagAll = h.slice(4); render(); }
  else if (h.startsWith("q=")) { render(); spot.set(h.slice(2)); $("q").focus(); }
  else render();
})();
