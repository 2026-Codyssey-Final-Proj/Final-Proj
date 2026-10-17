// claude-drafted: 2026-10-17 — 지식 별자리 하늘의 동작. GitHub 지식 파일(sky-data.js, 더미) → knowledge-sky.js로 12달 하늘 → 그리기.
// "어디에 있어요?"를 늘 한 줄로 말한다: 몇 월 · 어느 별자리 · 몇 번째 별 · 별자리의 어느 부분.
(function () {
  const K = window.KnowledgeSky, G = window.SkyData, H = window.LibSearch.highlight;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const seal = (m, s) => (window.NavSeal ? window.NavSeal.svg(m, s) : "");
  const LEVELS = ["처음 봄", "이해함", "직접 씀", "응용함"];
  const CON = K.CONSTELLATIONS;
  const sym = (m) => `${CON[m - 1].symbol}\uFE0E`;   // 이모지가 아니라 글자 모양으로

  const st = { files: [...G.FILES], pending: [...G.PENDING], lastSync: G.REPO.lastSync, month: 10, star: null, view: "month", fresh: new Set() };
  let sky = build();
  function build() { return K.buildSky(st.files, { year: 2026, repo: G.REPO.name }); }
  const all = () => sky.months.flatMap((m) => m.items.map((it) => ({ ...it, m })));
  const whereText = (m, it) => `${m.month}월 ${m.sign} ★${it.star}`;
  const keyOf = (it) => it.source.path;

  // 배경 별
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  $("sky").innerHTML = Array.from({ length: 160 }, () => `<i style="left:${rnd() * 100}%;top:${rnd() * 100}%;opacity:${(rnd() * .6 + .15).toFixed(2)};transform:scale(${(rnd() * 1.3 + .3).toFixed(2)})"></i>`).join("");
  $("seal").innerHTML = seal("idle", 92);

  // ── 별자리 하나 그리기 (큰 화면 · 한 해 하늘 카드가 같이 쓴다) ──
  function drawConst(m, { big }) {
    const c = CON[m.month - 1], lit = (i) => i < m.items.length;
    let out = big ? `<text class="wm" x="50" y="58">${sym(m.month)}</text>` : "";
    const boxes = [];   // 이름표가 겹치면 아래로 비켜 놓는다
    out += c.edges.map(([a, b]) => { const [x1, y1] = c.stars[a], [x2, y2] = c.stars[b]; return `<line class="edge${lit(a) && lit(b) ? "" : " dim"}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`; }).join("");
    out += c.stars.map(([x, y], i) => {
      const it = m.items[i];
      if (!it) return `<circle class="empty" cx="${x}" cy="${y}" r="${big ? .9 : 1.4}"></circle>${big ? `<text class="empty-lab" x="${x + 2}" y="${y + 3.6}">${esc(c.parts[i])} · 빈 자리</text>` : ""}`;
      const b = [.45, .65, .85, 1][it.level], sel = big && st.star === it.star, fresh = st.fresh.has(keyOf(it));
      const halo = `<circle cx="${x}" cy="${y}" r="${(big ? 3 : 4.5) + it.level * (big ? 1 : 1.2)}" fill="url(#halo)" opacity="${b * .8}"></circle>`;
      const core = `<circle class="${fresh ? "new" : ""}" cx="${x}" cy="${y}" r="${(big ? 1 : 1.6) + it.level * .3}" fill="#fff6dc" opacity="${b}"></circle>`;
      const spark = it.level >= 2 ? `<path d="M${x - 2.4} ${y}H${x + 2.4}M${x} ${y - 2.4}V${y + 2.4}" stroke="#fff6dc" stroke-width=".15" opacity="${b}"></path>` : "";
      if (!big) return halo + core;
      const left = x < 40 || (x > 62 && x < 80) ? x > 62 : x >= 80, title = `★${it.star} ${it.title}`, w = Math.min(46, title.length * 2.25 + 4);
      const lx = left ? x - 3 - w : x + 3; let ly = y - 5.2;
      while (boxes.some((o) => lx < o.x + o.w && o.x < lx + w && ly < o.y + 7 && o.y < ly + 7)) ly += 7.4;
      boxes.push({ x: lx, y: ly, w });
      return `<g class="st${sel ? " sel" : ""}" tabindex="0" role="button" data-star="${it.star}" aria-label="${esc(whereText(m, it))}, ${esc(c.parts[i])}, ${esc(it.title)}, ${LEVELS[it.level]}">
        ${halo}${sel ? `<circle class="ring" cx="${x}" cy="${y}" r="3.4"></circle>` : ""}${core}${spark}
        <g class="lab"><rect x="${lx}" y="${ly}" width="${w}" height="6.6" rx="1.4"></rect>
          <text x="${lx + 1.6}" y="${ly + 3}">${esc(title.length > 20 ? title.slice(0, 19) + "…" : title)}</text>
          <text class="pt" x="${lx + 1.6}" y="${ly + 5.4}">${esc(c.parts[i])} · ${LEVELS[it.level]}</text></g></g>`;
    }).join("");
    return `<defs><radialGradient id="halo"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>${out}`;
  }

  // ── 이 달의 하늘 ──
  function renderMonth() {
    const m = sky.months[st.month - 1], c = CON[m.month - 1];
    $("story-head").innerHTML = `<div class="mon">${m.month}월의 하늘</div>
      <h1 id="story-title"><span class="sym">${sym(m.month)}</span>${m.month}월 · ${m.sign} — ${esc(c.story)}</h1>
      <p><b>${esc(c.theme)}</b> · 지식 ${m.items.length}개 · 별 ${m.stars}개 중 ${m.items.length}개가 떴어요${m.waiting.length ? ` · 다음 별 대기 ${m.waiting.length}개` : ""}</p>`;
    $("const").innerHTML = drawConst(m, { big: true });
    $("const").querySelectorAll(".st").forEach((g) => {
      const pick = () => { st.star = st.star === +g.dataset.star ? null : +g.dataset.star; render(); };
      g.onclick = pick; g.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } };
    });
    renderPanel(m);
    const it = m.items.find((x) => x.star === st.star);
    say(it ? `${whereText(m, it)} — ${c.parts[it.star - 1]}에 있어요.` : m.items.length ? `${m.month}월 하늘엔 ‘${c.theme}’가 ${m.items.length}개 떠 있어요.` : `${m.month}월 하늘은 아직 비어 있어요.`, it ? "look" : m.items.length ? "idle" : "sleep");
  }

  function renderPanel(m) {
    const c = CON[m.month - 1];
    if (!m.items.length) {
      $("panel").innerHTML = `<h2>${m.month}월 ${m.sign}</h2><p class="void">아직 이 하늘에는 별이 없어요.<br>이 달 날짜로 정리한 지식 파일이 GitHub의 <code>knowledge/2026-${String(m.month).padStart(2, "0")}/</code>에 올라오면 여기 떠요.</p>`;
      return;
    }
    $("panel").innerHTML = `<h2>이 별자리에 떠 있는 지식 ${m.items.length}개</h2><p class="hint">별을 누르거나 아래에서 고르면 어디에 있는지 · GitHub 어느 파일인지 보여요</p>
      <ol class="plist">${m.items.map((it) => {
        const open = st.star === it.star;
        const same = all().filter((o) => keyOf(o) !== keyOf(it) && o.tags.some((t) => it.tags.includes(t)));
        return `<li><button aria-expanded="${open}" data-star="${it.star}"><span class="no">★${it.star}</span><span class="tt">${esc(it.title)}</span><span class="dt">${it.date.slice(5).replace("-", "/")}</span><span class="pt">${esc(c.parts[it.star - 1])} · ${LEVELS[it.level]}</span></button>
          ${open ? `<div class="detail">
            <div class="where">📍 ${esc(whereText(m, it))} · ${esc(c.parts[it.star - 1])}</div>
            <div class="line">${esc(it.line)}</div>
            <div class="row">${it.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
            <div class="src">GitHub ${esc(it.source.repo)} · main<br>${esc(it.source.path)}<br>커밋 ${esc(it.source.commit)}</div>
            <div class="row"><button class="ghbtn" aria-disabled="true" title="시안: 예시 저장소라 열 수 없어요">GitHub에서 열기 ↗</button></div>
            ${same.length ? `<div class="row"><small style="color:var(--ink-2)">같은 배움의 별</small>${same.map((o) => `<button data-jump="${o.m.month}-${o.star}">${o.m.month}월 ${esc(o.m.sign)} ★${o.star}</button>`).join("")}</div>` : ""}
          </div>` : ""}</li>`;
      }).join("")}</ol>
      ${m.waiting.length ? `<div class="waiting">다음 별 대기 ${m.waiting.length}개 — 이 별자리의 별(${m.stars}개)이 다 찼어요: ${m.waiting.map((w) => esc(w.title)).join(", ")}</div>` : ""}`;
    $("panel").querySelectorAll("[data-star]").forEach((b) => (b.onclick = () => { st.star = st.star === +b.dataset.star ? null : +b.dataset.star; render(); $("panel").querySelector(`[data-star="${b.dataset.star}"]`)?.focus(); }));
    $("panel").querySelectorAll("[data-jump]").forEach((b) => (b.onclick = () => { const [mo, s] = b.dataset.jump.split("-").map(Number); goTo(mo, s); }));
  }

  // ── 한 해 하늘 ──
  function renderYear() {
    $("year").innerHTML = sky.months.map((m) => `<button class="ycard${m.month === 10 ? " now" : ""}" data-m="${m.month}" aria-label="${m.month}월 ${m.sign}, 지식 ${m.items.length}개">
      <b>${sym(m.month)} ${m.month}월 ${m.sign}</b><small>${esc(CON[m.month - 1].theme)} · ${m.items.length}개</small>
      <svg viewBox="-8 -8 116 100" aria-hidden="true">${drawConst(m, { big: false })}</svg></button>`).join("");
    $("year").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => goTo(+b.dataset.m, null)));
    const n = sky.months.filter((m) => m.items.length).length;
    say(`올해 하늘엔 별자리 ${n}개에 별이 떴어요. 보고 싶은 달을 눌러요.`, "happy");
  }

  function renderMonths() {
    $("months").innerHTML = `<button class="yr" aria-pressed="${st.view === "year"}" data-yr="1"><b>한 해</b><span class="sy">✦</span><span class="dots">${all().length}개</span></button>` +
      sky.months.map((m) => `<button class="${m.items.length ? "" : "off"}" aria-pressed="${st.view === "month" && st.month === m.month}" data-m="${m.month}" aria-label="${m.month}월 ${m.sign}, 지식 ${m.items.length}개">
        <b>${m.month}월</b><span class="sy">${sym(m.month)}</span><span class="dots">${"•".repeat(Math.min(m.items.length, 6))}${m.items.length > 6 ? "+" : ""}</span></button>`).join("");
    $("months").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => goTo(+b.dataset.m, null)));
    $("months").querySelector("[data-yr]").onclick = () => { st.view = "year"; render(); history.replaceState(null, "", "#year"); };
  }

  // ── GitHub ──
  function renderGh() {
    $("gh-repo").textContent = G.REPO.name;
    $("gh-meta").innerHTML = `${G.REPO.branch} · 지식 파일 ${st.files.length}개 · 마지막 가져옴 ${esc(st.lastSync)}${sky.skipped.length ? `<br>하늘에 못 올린 파일 ${sky.skipped.length}개` : ""}`;
    const b = $("gh-pull");
    b.disabled = !st.pending.length;
    b.textContent = st.pending.length ? `새 지식 ${st.pending.length}개 가져오기` : "최신이에요";
  }
  $("gh-pull").onclick = () => {
    if (!st.pending.length) return;
    const got = st.pending; st.files.push(...got); st.pending = []; st.lastSync = "방금"; sky = build();
    st.fresh = new Set(got.map((f) => f.path));
    const placed = all().filter((x) => st.fresh.has(keyOf(x)));
    toast(`GitHub에서 새 지식 ${got.length}개를 가져왔어요 — ${placed.map((x) => whereText(x.m, x)).join(" · ")}`);
    if (placed[0]) goTo(placed[0].m.month, null); else render();
    setTimeout(() => { st.fresh = new Set(); }, 4000);
  };

  // ── 검색: 결과는 검색창 바로 밑, 오른쪽에 "어디에" ──
  const norm = (s) => String(s).toLowerCase();
  const spot = window.Spotlight.attach({
    form: $("search"), input: $("q"), placeholderHint: "별로 가기",
    search: (q) => {
      const ts = norm(q).split(/\s+/).filter(Boolean);
      return all().filter((it) => { const hay = norm(`${it.title} ${it.line} ${it.tags.join(" ")} ${it.m.sign} ${it.m.month}월 ${CON[it.m.month - 1].parts[it.star - 1]}`); return ts.every((t) => hay.includes(t)); })
        .map((it) => ({
          icon: '<span class="ic-star"></span>', plain: it.title, hint: "별로 가기",
          title: H(it.title, q), sub: `${H(it.line, q)} · ${it.tags.map((t) => H(t, q)).join(" · ")}`,
          right: `${esc(whereText(it.m, it))} · ${esc(CON[it.m.month - 1].parts[it.star - 1])}`,
          open: () => { spot.close(); goTo(it.m.month, it.star); },
        }));
    },
  });

  function goTo(month, star) {
    st.view = "month"; st.month = month; st.star = star; render();
    history.replaceState(null, "", star ? `#m${month}-${star}` : `#m${month}`);
  }
  function render() {
    $("count").textContent = `지식 ${all().length}개 · 별자리 ${sky.months.filter((m) => m.items.length).length}개에 별이 떴어요`;
    const year = st.view === "year";
    $("main").hidden = year; $("year").hidden = !year;
    if (year) renderYear(); else renderMonth();
    renderMonths(); renderGh();
  }
  function say(text, mood) { $("say").textContent = text; $("seal").innerHTML = seal(mood, 92); }
  let tt; function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => (el.hidden = true), 3800); }

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if (e.key === "/" && !typing) { e.preventDefault(); $("q").focus(); }
    if (!typing && st.view === "month" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) goTo(((st.month - 1 + (e.key === "ArrowRight" ? 1 : 11)) % 12) + 1, null);
    if (e.key === "Escape" && !typing && st.star) { st.star = null; render(); }
  });

  // 주소 끝: #m10 · #m10-2 · #year · #q=EARS
  const h = decodeURIComponent(location.hash.slice(1));
  let mm;
  if (h === "year") { st.view = "year"; render(); }
  else if ((mm = /^m(\d{1,2})(?:-(\d+))?$/.exec(h))) goTo(Math.min(12, Math.max(1, +mm[1])), mm[2] ? +mm[2] : null);
  else if (h.startsWith("q=")) { render(); spot.set(h.slice(2)); $("q").focus(); }
  else render();
})();
