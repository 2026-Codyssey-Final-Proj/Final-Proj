// claude-drafted: 2026-10-18 — 서고로 들어가는 물속 전환(모양은 dive.css). 목업 영상 24~28초 장면:
//   나가기(내비게이터) — 오버레이가 화면 전체로 커지며 물속이 되고, 책을 안은 플로로가 한 번 솟았다가 아래로 풍덩 내려간다 → 서고 #lib-dive로 넘어간다.
//   들어오기(서고) — 처음부터 물이 덮고 있다가, 서고가 다 읽히면 물이 위로 빠지며 서고가 아래에서 떠오르고, 플로로가 얼음판 위로 점프해 시작을 알린다.
// 움직임 줄이기를 켰거나 애니메이션을 못 쓰는 브라우저면 바로 넘어간다. 서버·저장 없음.
(function () {
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CAN = !STILL && typeof Element.prototype.animate === "function";

  // 물속 — 빛줄기와 떠오르는 물방울. 같은 씨앗이라 두 페이지의 물방울 자리가 같다(넘어갈 때 튀지 않게)
  function fill(el) {
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    el.innerHTML = `<div class="rays"></div>${Array.from({ length: 22 }, () => `<i class="bub" style="left:${(rnd() * 100).toFixed(1)}%;--s:${(4 + rnd() * 10).toFixed(0)}px;--d:${(2.4 + rnd() * 2.4).toFixed(1)}s;--w:-${(rnd() * 4).toFixed(1)}s;--x:${(rnd() * 40 - 20).toFixed(0)}px"></i>`).join("")}<div class="surf"></div>`;
    return el;
  }

  // 나가기 — from: 커질 오버레이, floroFrom: 플로로가 출발할 자리, href: 넘어갈 주소
  function out(from, href, floroFrom) {
    if (!CAN || !from) { location.href = href; return; }
    const r = from.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const rad = parseFloat(getComputedStyle(from).borderTopLeftRadius) || 24;
    const clip = (t, rt, b, l, k) => `inset(${t}px ${rt}px ${b}px ${l}px round ${k}px)`;
    const water = fill(document.createElement("div"));
    water.className = "dive"; water.setAttribute("aria-hidden", "true");
    document.body.appendChild(water);
    water.animate([{ clipPath: clip(r.top, W - r.right, H - r.bottom, r.left, rad), opacity: 0 }, { opacity: 1, offset: 0.2 }, { clipPath: clip(0, 0, 0, 0, 0), opacity: 1 }],
      { duration: 700, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" });

    // 책을 안은 플로로 — 오버레이 속 자리에서 출발해 한 번 솟았다가 화면 아래로 내려간다
    const w = 150, f = document.createElement("div"), fr = (floroFrom || from).getBoundingClientRect();
    f.className = "dive-floro"; f.style.setProperty("--w", `${w}px`); f.setAttribute("aria-hidden", "true");
    f.innerHTML = `${window.NavSeal ? window.NavSeal.svg("happy", w) : ""}<span class="carry-book"></span><i class="trail"></i><i class="trail"></i>`;
    document.body.appendChild(f);
    const x0 = fr.left + fr.width / 2 - w / 2, y0 = fr.top + fr.height / 2 - w / 2, x1 = W / 2 - w / 2;
    f.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.7)`, opacity: 0 },
      { transform: `translate(${x0}px,${y0}px) scale(.8)`, opacity: 1, offset: 0.12 },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.max(20, y0 - 40)}px) scale(1) rotate(-8deg)`, offset: 0.42 },
      { transform: `translate(${x1}px,${H * 0.45}px) scale(1.05) rotate(10deg)`, offset: 0.72 },
      { transform: `translate(${x1 + 30}px,${H + 40}px) scale(1.1) rotate(16deg)` },
    ], { duration: 1700, easing: "cubic-bezier(.45,0,.4,1)", fill: "forwards" });
    // 뒤로 가기로 돌아오면(페이지 보관) 물을 걷는다
    addEventListener("pageshow", (e) => { if (e.persisted) { water.remove(); f.remove(); } }, { once: true });
    setTimeout(() => { location.href = href; }, 1750);
  }

  // 들어오기 — cover: 처음부터 덮고 있는 물(#dive-cover), layers: [요소, 아래에서 떠오를 거리(vh)], seal: 점프할 플로로, done: 다 끝나고 부를 것
  function arrive({ cover, layers = [], seal, done }) {
    const finish = () => { document.documentElement.classList.remove("dive-in"); cover?.remove(); done?.(); };
    if (!cover) return done?.();
    if (!CAN) return finish();
    fill(cover);
    if (seal) seal.style.opacity = "0";
    const loaded = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
    Promise.all([loaded, document.fonts ? document.fonts.ready : null, new Promise((r) => setTimeout(r, 450))]).then(() => {
      cover.classList.add("rising");
      cover.animate([{ transform: "translateY(0)" }, { transform: "translateY(-104%)" }], { duration: 1100, easing: "cubic-bezier(.6,0,.3,1)", fill: "forwards" });
      for (const [el, vh] of layers) {
        el?.animate([{ transform: `translateY(${vh}vh) scale(.95)`, filter: "blur(5px)", opacity: 0.35 }, { transform: "none", filter: "blur(0)", opacity: 1 }],
          { duration: 1250, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
      setTimeout(() => { if (seal) jump(seal); }, 950);
      setTimeout(finish, seal ? 1950 : 1150);   // 인사는 플로로가 내려앉은 뒤에
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

  window.FloeDive = { out, arrive, jump };
})();
