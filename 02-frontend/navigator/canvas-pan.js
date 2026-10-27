// claude-drafted: 2026-10-27 — F-66(이재엽 "캔버스가 움직이는것도 안되고"): 작업실 캔버스 탭(app.js canvasPane)을 끌어서 옮기고 크게 · 작게.
//   처음은 '맞춤' — app.css의 줌 · 다시 배치 그대로(C-42 R-11). 판을 끌거나 ⌘/Ctrl+휠(트랙패드 오므리기) · − + 단추 · + − 키로 키우면 '옮기기'(.free):
//   판 1100×640을 그대로 두고 옮기는 층(.cvp)을 translate · scale로 옮긴다. '맞춤' 단추 · 0 키로 처음처럼.
//   옮긴 자리는 이 화면이 기억한다 — 섬이 다시 그려 보내도(win.js) · 브라우저 판을 다시 그려도(app.js render) apply()로 되돌린다. 섬의 상태로는 보내지 않는다(단추는 data-act가 아니라 data-cv).
//   순수 계산(clampZ · zoomAt · fit · keepIn · pan · label)은 Node에서도 — 04-tests/navigator/canvas-pan.test.js
(function (root) {
  const W = 1100, H = 640;             // 판 — 목업(DockPrototype)과 app.css 줌 배치의 크기
  const MIN = 0.35, MAX = 2.5, STEP = 1.25;
  const EDGE = 80, PAD = 16;           // EDGE: 판이 칸 밖으로 나가도 이만큼은 보인다 · PAD: 맞춤의 여백
  const clampZ = (z) => (Number.isFinite(z) ? Math.min(MAX, Math.max(MIN, z)) : 1);
  // 커서(px, py — 칸 안의 좌표) 아래의 판 자리는 그대로 두고 배율만 바꾼다
  const zoomAt = (v, z2, px, py) => { const z = clampZ(z2), k = z / v.z; return { free: true, z, x: px - (px - v.x) * k, y: py - (py - v.y) * k }; };
  // 칸(cw × ch)에 판을 통째로 가운데에 — 1배보다 키우지 않는다(app.css 줌의 --u도 1px까지)
  const fit = (cw, ch) => { const z = clampZ(Math.min(1, (cw - PAD * 2) / W, (ch - PAD * 2) / H)); return { free: true, z, x: (cw - W * z) / 2, y: (ch - H * z) / 2 }; };
  const keepIn = (v, cw, ch) => ({ ...v, x: Math.min(cw - EDGE, Math.max(EDGE - W * v.z, v.x)), y: Math.min(ch - EDGE, Math.max(EDGE - H * v.z, v.y)) });
  const pan = (v, dx, dy, cw, ch) => keepIn({ ...v, free: true, x: v.x + dx, y: v.y + dy }, cw, ch);
  const label = (v) => (v.free ? `${Math.round(v.z * 100)}%` : "맞춤");
  const api = { W, H, MIN, MAX, STEP, clampZ, zoomAt, fit, keepIn, pan, label };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  const FIT = { free: false, x: 0, y: 0, z: 1 };
  let view = FIT, drag = null, easeT = 0;
  const still = () => !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const cvOf = () => document.querySelector(".cv");   // 한 화면에 캔버스는 하나(작업실 판)
  // 보던 자리 · 배율을 칸에 — 다시 그린 뒤마다 부른다
  function apply(scope) {
    const cv = (scope || document).querySelector(".cv"); if (!cv) return;
    cv.classList.toggle("free", view.free);
    for (const [k, v] of [["--cvx", `${view.x}px`], ["--cvy", `${view.y}px`], ["--cvz", String(view.z)]]) { if (view.free) cv.style.setProperty(k, v); else cv.style.removeProperty(k); }
    if (view.free && (cv.scrollTop || cv.scrollLeft)) { cv.scrollTop = 0; cv.scrollLeft = 0; }   // 다시 배치(격자)에서 내려 읽던 스크롤이 옮기기에 섞이지 않게
    const z = cv.parentElement && cv.parentElement.querySelector('[data-cv="fit"]');
    if (z) { z.textContent = label(view); z.setAttribute("aria-pressed", String(!view.free)); z.setAttribute("aria-label", `화면에 맞춤 (지금 ${label(view)})`); }
  }
  // 맞춤 → 옮기기: 지금 보이는 판에서 그대로 이어 간다(줌이면 그 배율 · 자리, 다시 배치면 칸에 맞춘 판)
  function start(cv) {
    if (view.free) return;
    const b = cv.querySelector(".cvb"), c = cv.getBoundingClientRect(), r = b ? b.getBoundingClientRect() : null;
    view = b && r.width > 0 && getComputedStyle(b).display === "block" ? { free: true, z: clampZ(r.width / W), x: r.left - c.left, y: r.top - c.top } : fit(cv.clientWidth, cv.clientHeight);
  }
  function set(cv, v, ease) {
    view = keepIn(v, cv.clientWidth, cv.clientHeight);
    if (ease && !still()) { cv.classList.add("ease"); clearTimeout(easeT); easeT = setTimeout(() => { const c = cvOf(); if (c) c.classList.remove("ease"); }, 260); }
    apply(document);
  }
  const zoomMid = (cv, f) => { start(cv); set(cv, zoomAt(view, view.z * f, cv.clientWidth / 2, cv.clientHeight / 2), true); };
  const fitNow = () => { view = FIT; apply(document); };

  // 끌기 — 단추 · 글 칸이 아닌 곳을 눌러 4px 넘게 움직이면. 듣는 곳은 document: 끄는 중에 섬이 다시 그려 칸이 바뀌어도 이어진다
  document.addEventListener("pointerdown", (e) => {
    const cv = e.target.closest && e.target.closest(".cv");
    if (!cv || e.button !== 0 || e.target.closest("a,button,input,textarea,select,[contenteditable]")) return;
    e.preventDefault(); cv.focus({ preventScroll: true, focusVisible: false });   // 글자 고르기 대신 끌기 — 키(+ − 0 화살표)는 이어서 칸에. 마우스로 잡은 것이라 키보드 테두리는 그리지 않는다
    try { cv.setPointerCapture(e.pointerId); } catch {}
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  const end = (e) => { if (!drag || (e && e.pointerId !== drag.id)) return; drag = null; const cv = cvOf(); if (cv) cv.classList.remove("grabbing"); };
  document.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!(e.buttons & 1)) return end(e);   // 창 밖에서 손을 뗐다
    const cv = cvOf(); if (!cv) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) { if (Math.abs(dx) + Math.abs(dy) < 4) return; drag.moved = true; start(cv); }
    cv.classList.add("grabbing");
    drag.x = e.clientX; drag.y = e.clientY;
    view = pan(view, dx, dy, cv.clientWidth, cv.clientHeight); apply(document);
  });
  document.addEventListener("pointerup", end); document.addEventListener("pointercancel", end);
  // 휠 — ⌘/Ctrl(트랙패드 오므리기도 ctrl)이면 커서 자리에서 크게 · 작게, 옮기기 중이면 두 손가락으로 옮기기. 맞춤에서 그냥 휠은 다시 배치의 스크롤 그대로
  document.addEventListener("wheel", (e) => {
    const cv = e.target.closest && e.target.closest(".cv"); if (!cv) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? cv.clientHeight : 1;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); start(cv);
      const r = cv.getBoundingClientRect(), d = e.deltaY * unit;
      const f = Math.abs(d) >= 50 ? (d > 0 ? 1 / 1.2 : 1.2) : Math.exp(-d * 0.01);   // 마우스 휠 한 칸은 1.2배, 트랙패드는 조금씩
      set(cv, zoomAt(view, view.z * f, e.clientX - r.left, e.clientY - r.top), false);
    } else if (view.free) {
      e.preventDefault();
      set(cv, { ...view, x: view.x - e.deltaX * unit, y: view.y - e.deltaY * unit }, false);
    }
  }, { passive: false });
  // 키 — 칸에 포커스가 있을 때: + − 크게 작게 · 0 맞춤 · 화살표 옮기기(Shift면 크게)
  document.addEventListener("keydown", (e) => {
    const cv = e.target && e.target.classList && e.target.classList.contains("cv") ? e.target : null;
    if (!cv || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key, s = e.shiftKey ? 200 : 60;
    if (k === "+" || k === "=") zoomMid(cv, STEP);
    else if (k === "-" || k === "_") zoomMid(cv, 1 / STEP);
    else if (k === "0") fitNow();
    else if (/^Arrow/.test(k)) { start(cv); set(cv, { ...view, x: view.x + ({ ArrowLeft: s, ArrowRight: -s }[k] || 0), y: view.y + ({ ArrowUp: s, ArrowDown: -s }[k] || 0) }, true); }
    else return;
    e.preventDefault();
  });
  // 단추 — − 맞춤 +
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-cv]"); if (!b) return;
    const w = b.closest(".cvw"), cv = w && w.querySelector(".cv"); if (!cv) return;
    if (b.dataset.cv === "fit") fitNow(); else zoomMid(cv, b.dataset.cv === "in" ? STEP : 1 / STEP);
  });
  root.addEventListener("resize", () => { const cv = cvOf(); if (cv && view.free) set(cv, view, false); });
  root.FloeCanvas = { ...api, apply, view: () => ({ ...view }) };
})(typeof window !== "undefined" ? window : globalThis);
