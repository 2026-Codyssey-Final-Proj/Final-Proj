// claude-drafted: 2026-10-18 — 서고로 들어가는 물속 전환(모양은 dive.css). 목업 영상 24~28초 장면:
// 2026-10-20(이재엽): ① 플로로는 오버레이 **한가운데**에서 출발해 그 자리에서 곧게 내려간다 ② 서고 → 작업 화면도 물속으로(leave · surface)
//   ③ 들어갈 때 느리던 것을 줄였다 — 나가기 1.7초 → 1.2초, 서고가 다 읽힌 뒤 기다림 450 → 150ms, 물 빠짐 1.1초 → 0.75초(다 합쳐 약 4.3초 → 2.4초)
//   ④ 플로로 크기는 창 크기를 따른다(짧은 변의 16%, 90~150px). 시험: 04-tests/navigator/dive.test.js(글로 맞대어 본다)
//   나가기(내비게이터) — 오버레이가 화면 전체로 커지며 물속이 되고, 책을 안은 플로로가 한 번 솟았다가 아래로 풍덩 내려간다 → 서고 #lib-dive로 넘어간다.
//   들어오기(서고) — 처음부터 물이 덮고 있다가, 서고가 다 읽히면 물이 위로 빠지며 서고가 아래에서 떠오르고, 플로로가 얼음판 위로 점프해 시작을 알린다.
// 움직임 줄이기를 켰거나 애니메이션을 못 쓰는 브라우저면 바로 넘어간다. 서버·저장 없음.
// claude-drafted: 2026-10-20 — F-35(이재엽 "아직 서고에 들어가고 나올때 에니메이션이 끊기는 모션들이 남아있어", 버튼 "가볍게, 그리기만"):
//   ① 물이 커지는 움직임을 clip-path(매 프레임 다시 그림) 대신 둥근 판(.pane)의 transform(옮기기 · 늘리기)으로 — 합성만으로 돈다. 물방울 · 빛줄기는
//      늘어나지 않게 다른 층(.fx)에 두고 물이 다 덮은 뒤 opacity로 나타낸다 ② 서고 층이 떠오를 때 filter: blur를 뺐다(opacity · transform만)
//   ③ 물방울 22 → 12개, will-change ④ 정한 시간(setTimeout)에 넘기지 않고 물 · 플로로의 움직임이 **끝나면**(finished) 넘긴다 — 멈춤 막이로 상한(OUT_CAP · LEAVE_CAP)은 남긴다
//   ⑤ 새 페이지의 첫 그림에도 물방울이 있게 — 이 파일이 #dive-cover 바로 뒤에서 읽히며 머리의 dive-in · surfacing 표시를 보고 바로 채운다(fill은 한 번만)
//   창 크기 · 페이지 넘김에서 오는 끊김(넘김 문서 5절 ①·③)은 이번에 손대지 않았다
(function () {
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CAN = !STILL && typeof Element.prototype.animate === "function";
  const BUBBLES = 12;   // 2026-10-20 F-35: 22 → 12

  // 물속 — 빛줄기와 떠오르는 물방울. 같은 씨앗이라 두 페이지의 물방울 자리가 같다(넘어갈 때 튀지 않게). 한 번 채운 요소는 다시 채우지 않는다
  function fill(el) {
    if (!el || el.dataset.filled) return el;
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    el.innerHTML = `<div class="rays"></div>${Array.from({ length: BUBBLES }, () => `<i class="bub" style="left:${(rnd() * 100).toFixed(1)}%;--s:${(4 + rnd() * 10).toFixed(0)}px;--d:${(2.4 + rnd() * 2.4).toFixed(1)}s;--w:-${(rnd() * 4).toFixed(1)}s;--x:${(rnd() * 40 - 20).toFixed(0)}px"></i>`).join("")}<div class="surf"></div>`;
    el.dataset.filled = "1";
    return el;
  }
  // 처음부터 물이 덮는 페이지(서고 #lib-dive · 작업 화면 &back)는 첫 그림부터 물방울이 있게 — 머리의 한 줄이 붙인 표시를 보고 바로 채운다(F-35 ⑤)
  {
    const cover = document.getElementById("dive-cover"), h = document.documentElement;
    if (cover && (h.classList.contains("dive-in") || h.classList.contains("surfacing"))) fill(cover);
  }
  // 움직임이 끝나면 한 번만 — 끝나기 전에 상한(cap)이 오면 그때. 뒤로 가기(페이지 보관)로 돌아오면 물을 걷는다
  function whenDone(anims, cap, then, cleanup) {
    let went = false;
    const go = () => { if (went) return; went = true; then(); };
    Promise.all(anims.map((a) => a.finished)).then(go, () => {});
    const timer = setTimeout(go, cap);
    addEventListener("pageshow", (e) => { if (e.persisted) { clearTimeout(timer); cleanup(); } }, { once: true });
  }

  // 플로로 크기 — 창(오버레이)의 짧은 변에 맞춘다(2026-10-20 "오버레이 크기에 따라서 플로로 크기 조정")
  const floroSize = (W, H) => Math.round(Math.min(150, Math.max(90, Math.min(W, H) * 0.16)));
  const OUT_MS = 1150, OUT_CAP = 1450;   // 플로로가 내려가는 길이(끝나면 넘긴다) · 멈춤 막이 상한(2026-10-20 — 시간으로 넘기던 OUT_GO 1150을 끝나면으로)
  const WATER_MS = 700, OVER = 80;       // 물이 화면을 덮는 길이 · 화면보다 더 커지는 여유(둥근 모서리가 화면 밖으로 나간다)

  // 나가기 — from: 커질 오버레이(섬), href: 넘어갈 주소. 플로로는 섬 한가운데에서 출발한다(2026-10-20 — 전에는 서고 탭 왼쪽 칸)
  function out(from, href) {
    if (!CAN || !from) { location.href = href; return; }
    const r = from.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const rad = parseFloat(getComputedStyle(from).borderTopLeftRadius) || 24;
    // 물 — 섬 자리의 둥근 판이 화면 밖까지 늘어난다(transform만). 물방울 · 빛줄기는 늘어나지 않는 층(.fx)에 두고 물이 덮은 뒤 나타난다(F-35)
    const water = document.createElement("div");
    water.className = "dive out"; water.setAttribute("aria-hidden", "true");
    const pane = document.createElement("div"), fx = fill(document.createElement("div"));
    pane.className = "pane"; fx.className = "fx";
    pane.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${rad}px`;
    water.append(pane, fx);
    document.body.appendChild(water);
    const sx = (W + OVER * 2) / r.width, sy = (H + OVER * 2) / r.height;
    const paneAnim = pane.animate([{ transform: "none", opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${-OVER - r.left * sx}px,${-OVER - r.top * sy}px) scale(${sx},${sy})`, opacity: 1 }],
      { duration: WATER_MS, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" });
    fx.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: WATER_MS + 150, easing: "ease-out", fill: "forwards" });

    // 책을 안은 플로로 — 오버레이 한가운데에서 출발해 한 번 솟았다가 그 자리에서 곧게 아래로 내려간다(이재엽 2026-10-20 "잠수해서 들어가는 곳이 오버레이 중앙에서")
    const w = floroSize(W, H), f = document.createElement("div");
    f.className = "dive-floro"; f.style.setProperty("--w", `${w}px`); f.setAttribute("aria-hidden", "true");
    f.innerHTML = `${window.NavSeal ? window.NavSeal.svg("happy", w) : ""}<span class="carry-book"></span><i class="trail"></i><i class="trail"></i>`;
    document.body.appendChild(f);
    const x0 = r.left + r.width / 2 - w / 2, y0 = r.top + r.height / 2 - w / 2;
    const floroAnim = f.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.7)`, opacity: 0 },
      { transform: `translate(${x0}px,${y0}px) scale(.85)`, opacity: 1, offset: 0.12 },
      { transform: `translate(${x0}px,${Math.max(10, y0 - 60)}px) scale(1) rotate(-6deg)`, offset: 0.4 },
      { transform: `translate(${x0 + 10}px,${Math.max(y0 + 80, H * 0.55)}px) scale(1.05) rotate(8deg)`, offset: 0.75 },
      { transform: `translate(${x0 + 20}px,${H + 40}px) scale(1.1) rotate(14deg)` },
    ], { duration: OUT_MS, easing: "cubic-bezier(.45,0,.4,1)", fill: "forwards" });
    whenDone([paneAnim, floroAnim], OUT_CAP, () => { location.href = href; }, () => { water.remove(); f.remove(); });
  }

  // 서고 → 작업 화면(2026-10-20 "서재에서 오버레이로 넘어갈 때 애니메이션") — 물이 아래에서 차오르고 플로로가 잠수한 뒤 넘어간다(href 끝의 &back을 내비게이터가 읽어 surface를 한다)
  // 2026-10-20 F-35: 전에는 끝나기 30ms 전(LEAVE_GO 620)에 넘겼다 — 넘기는 순간의 멈춤을 가리려던 것인데 재 보니 차이가 없어(헤드리스 Chrome) 끝나면 넘긴다
  const LEAVE_MS = 650, LEAVE_CAP = 950;
  function leave(href, seal) {
    if (!CAN) { location.href = href; return; }
    const water = fill(document.createElement("div"));
    water.className = "dive rising-up"; water.setAttribute("aria-hidden", "true");
    document.body.appendChild(water);
    const anims = [water.animate([{ transform: "translateY(104%)" }, { transform: "translateY(0)" }], { duration: LEAVE_MS, easing: "cubic-bezier(.6,0,.3,1)", fill: "forwards" })];
    if (seal) anims.push(seal.animate([{ transform: "none" }, { transform: "translateY(-40px) scale(.96,1.06)", offset: 0.3 }, { transform: "translateY(90px) scale(.9,1.1)", opacity: 0 }],
      { duration: LEAVE_MS, easing: "cubic-bezier(.5,0,.6,1)", fill: "forwards" }));
    whenDone(anims, LEAVE_CAP, () => { location.href = href; }, () => water.remove());
  }

  // 작업 화면이 물속에서 떠오름(2026-10-20 "오버레이가 작아졌다가 다시 켜지는 애니메이션") — 서고에서 돌아오면 처음부터 물이 덮고 있다가(#dive-cover, html.surfacing)
  // 물이 아래로 빠지면서(앱 창은 투명이라 바탕 화면이 드러난다) 섬이 위에서 내려앉는다. 앱은 그 전에 창을 섬 크기로 줄여 둔다(main.js restoreWindow)
  const SURFACE_MS = 600, SURFACE_ISLAND_AT = 180, SURFACE_END = 720;
  function surface({ cover, island, done }) {
    const html = document.documentElement;
    const finish = () => { html.classList.remove("surfacing"); cover?.remove(); done?.(); };
    if (!cover) { html.classList.remove("surfacing"); return done?.(); }
    if (!CAN) return finish();
    fill(cover); cover.classList.add("rising");
    cover.animate([{ transform: "translateY(0)" }, { transform: "translateY(104%)" }], { duration: SURFACE_MS, easing: "cubic-bezier(.6,0,.3,1)", fill: "forwards" });
    setTimeout(() => {
      html.classList.remove("surfacing");
      island?.animate([{ transform: "translateY(-30px) scale(.94)", opacity: 0 }, { transform: "translateY(6px) scale(1.01)", opacity: 1, offset: 0.7 }, { transform: "none", opacity: 1 }],
        { duration: SURFACE_END - SURFACE_ISLAND_AT, easing: "cubic-bezier(.34,1.56,.64,1)" });
    }, SURFACE_ISLAND_AT);
    setTimeout(finish, SURFACE_END);
  }

  const ARRIVE_WAIT = 150, ARRIVE_MS = 750, ARRIVE_JUMP = 520, ARRIVE_END = 1300;
  // 들어오기 — cover: 처음부터 덮고 있는 물(#dive-cover), layers: [요소, 아래에서 떠오를 거리(vh)], seal: 점프할 플로로, done: 다 끝나고 부를 것
  function arrive({ cover, layers = [], seal, done }) {
    const finish = () => { document.documentElement.classList.remove("dive-in"); cover?.remove(); done?.(); };
    if (!cover) return done?.();
    if (!CAN) return finish();
    fill(cover);
    if (seal) seal.style.opacity = "0";
    const loaded = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
    // 2026-10-20: 기다림 450 → 150ms, 물 빠짐 1100 → 750ms, 점프 950 → 520ms 뒤, 끝 1950 → 1300ms — "서재에 들어갈 때 화면이 느리게 나온다"
    Promise.all([loaded, document.fonts ? document.fonts.ready : null, new Promise((r) => setTimeout(r, ARRIVE_WAIT))]).then(() => {
      cover.classList.add("rising");
      cover.animate([{ transform: "translateY(0)" }, { transform: "translateY(-104%)" }], { duration: ARRIVE_MS, easing: "cubic-bezier(.6,0,.3,1)", fill: "forwards" });
      // 층이 떠오른다 — opacity · transform만(2026-10-20 F-35: filter: blur를 뺐다 — 큰 층 넷을 매 프레임 흐리게 다시 그렸다)
      for (const [el, vh] of layers) {
        el?.animate([{ transform: `translateY(${vh}vh) scale(.95)`, opacity: 0.35 }, { transform: "none", opacity: 1 }],
          { duration: ARRIVE_MS + 150, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
      setTimeout(() => { if (seal) jump(seal); }, ARRIVE_JUMP);
      setTimeout(finish, seal ? ARRIVE_END : ARRIVE_MS + 30);   // 인사는 플로로가 내려앉은 뒤에
    });
  }


  // 플로로가 물웅덩이에서 얼음판 위로 점프 — 물 튀김 두 겹과 물방울
  function jump(seal) {
    seal.style.opacity = "";
    if (!CAN) return;
    seal.animate([
      { transform: "translateY(70px) scale(.7,.9)", opacity: 0 },
      { transform: "translateY(30px) scale(.9,1.1)", opacity: 1, offset: 0.16 },
      { transform: "translateY(-96px) scale(.96,1.06) rotate(-6deg)", offset: 0.5 },
      { transform: "translateY(6px) scale(1.12,.86)", offset: 0.78 },
      { transform: "translateY(-6px) scale(.97,1.04)", offset: 0.9 },
      { transform: "none" },
    ], { duration: 1050, easing: "cubic-bezier(.3,.6,.4,1)" });
    const host = seal.parentElement, made = [];
    const add = (cls, style) => { const s = document.createElement("span"); s.className = cls; if (style) s.style.cssText = style; host.appendChild(s); made.push(s); };
    add("splash"); add("splash b");
    for (let i = 0; i < 9; i++) { const a = (-160 + i * 17.5) * Math.PI / 180, d = 70 + (i % 3) * 22; add("drop", `--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px`); }
    setTimeout(() => made.forEach((s) => s.remove()), 900);
    // 내려앉을 때 한 번 더 작게 튄다
    setTimeout(() => { add("splash"); setTimeout(() => made.forEach((s) => s.remove()), 800); }, 800);
  }

  window.FloeDive = { out, arrive, jump, leave, surface, floroSize, fill };
})();
