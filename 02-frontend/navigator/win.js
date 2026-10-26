// claude-drafted: 2026-10-21 — 앱의 설정 창 · 퀘스트 창(C-22, win.html)의 동작. 상태는 섬(app.js) 하나가 갖는다:
//   섬이 보낸 내용(HTML)을 그대로 보이고, 여기서 누르거나 바꾸거나 적은 것은 섬으로 돌려보낸다(floeApp.winEvent → main.js → 섬 app.js winEvent). 섬이 처리하고 다시 그려 보낸다.
//   다시 그려도 쓰던 글 칸은 그대로(커서 자리까지) — 섬의 render와 같은 방식. 설명 풍선(data-tt)만 여기서 띄운다(섬과 같은 글).
// 브라우저로 열면(window.floeApp 없음) 아무것도 하지 않는다 — 섬 옆의 판이 같은 것을 보인다
(function () {
  const F = window.floeApp, root = document.getElementById("root"), kind = location.hash.slice(1) || "quest";
  document.documentElement.classList.add("in-win", `win-${kind}`);
  document.title = kind === "quest" ? "Floe — 작업실" : "Floe — 설정";   // 테두리 있는 작업실 창(C-41, 2026-10-26)은 OS 제목 줄에 이 글이 보인다 — main.js의 title을 페이지가 덮어쓴다
  if (!F || !F.onWinHtml) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // 섬이 보낸 내용 — 쓰던 글 칸(data-act)은 커서 · 스크롤까지 되돌린다
  F.onWinHtml((html) => {
    const a = document.activeElement, keep = a && a.dataset && a.dataset.act && /^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName) ? a : null;
    const key = keep ? `${keep.dataset.act}|${keep.dataset.i || ""}|${keep.dataset.k || ""}` : "", sel = keep ? [keep.selectionStart, keep.selectionEnd, keep.scrollTop] : null;
    // 스크롤은 같은 화면(data-view — 탭 · 펼친 책 · 단계 문서)을 다시 그릴 때만 되돌린다. 화면이 바뀌면 맨 위부터 —
    //   책 탭 아래의 '단계 문서 · 정한 것 펼치기'를 누르면 문서가 중간부터 보였다(임유정 2026-10-25, F-58-6) — claude-drafted: 2026-10-25
    const was = root.querySelector(".wbody"), scroll = was ? was.scrollTop : 0, view = was ? was.dataset.view : null;
    root.innerHTML = html || "";
    if (key) { const b = [...root.querySelectorAll("[data-act]")].find((x) => `${x.dataset.act}|${x.dataset.i || ""}|${x.dataset.k || ""}` === key); if (b) { b.focus(); try { b.setSelectionRange(sel[0], sel[1]); } catch {} b.scrollTop = sel[2]; } }
    const body = root.querySelector(".wbody"); if (body) body.scrollTop = body.dataset.view === view ? scroll : 0;
    const now = body && body.dataset.view !== view && root.querySelector(".cv-c.now"); if (now) now.scrollIntoView({ block: "nearest" });   // 캔버스 탭으로 올 때 '지금' 칸이 보이게(C-41 기준 7, 2026-10-26)
  });
  // 섬이 이 창의 가장자리에 붙으면(C-41 ②, 2026-10-27) 그쪽을 비워 내용이 비켜선다 — {side, size}
  const DOCK = ["top", "right", "bottom", "left"];
  let dock = null;   // 지금 붙은 {side, size(섬 창 — 비켜설 폭), inner(섬이 고른 크기 — 손잡이 값 단위, 창은 여백 ~11만큼 더 크다)}
  if (F.onDock) F.onDock((p) => { const s = p && DOCK.includes(p.side) ? Math.max(0, Math.round(p.size) || 0) : 0; dock = s ? { side: p.side, size: s, inner: Math.round(p.inner) || s, max: Math.round(p.max) || 0 } : null; root.style.padding = DOCK.map((k) => (dock && dock.side === k ? s : 0) + "px").join(" "); placeHandle(); });
  // 손잡이(C-41 ③, 2026-10-27 — 스토리보드 기준 6): 섬이 붙은 안쪽 가장자리에. 끌거나, 고른 뒤 화살표 20씩 · Home · End, 두 번 누르거나 Enter로 처음(옆 420 · 위아래 360).
  //   값은 섬(app.js setDockSize)이 범위(quest.js DOCK_RANGE — 옆 320 ~ 760 · 위아래 240 ~ 480)로 맞춰 다시 그리고, 앱이 다시 붙이고, 여기 padding이 따라온다 — 여기서는 보내기만
  const RANGE = { w: [320, 760], h: [320, 480] };   // quest.js DOCK_RANGE와 같은 값(aria용) — 바꾸면 둘 다(dock.test.js가 맞댄다). 가장 크게는 섬이 보낸 max가 먼저(옆은 작업실 반까지)
  const maxOf = () => (dock && dock.max) || RANGE[axisOf(dock.side)][1];
  const hd = document.createElement("div"); hd.id = "hd"; hd.setAttribute("role", "separator"); hd.tabIndex = 0; hd.hidden = true; hd.innerHTML = "<span></span>"; document.body.appendChild(hd);
  const axisOf = (side) => (side === "left" || side === "right" ? "w" : "h");
  function placeHandle() {
    hd.hidden = !dock; if (!dock) return;
    const { side, size } = dock, v = axisOf(side) === "w";
    hd.className = v ? "v" : "h";
    hd.style.cssText = v ? `left:${side === "left" ? size - 7 : innerWidth - size - 7}px;top:0;width:14px;height:100%` : `top:${side === "top" ? size - 7 : innerHeight - size - 7}px;left:0;height:14px;width:100%`;
    hd.setAttribute("aria-orientation", v ? "vertical" : "horizontal"); hd.setAttribute("aria-label", v ? "섬 너비 손잡이" : "섬 높이 손잡이");
    hd.setAttribute("aria-valuemin", RANGE[v ? "w" : "h"][0]); hd.setAttribute("aria-valuemax", maxOf()); hd.setAttribute("aria-valuenow", dock.inner); hd.setAttribute("aria-valuetext", `${v ? "너비" : "높이"} ${dock.inner}px`);
  }
  // 섬으로 보낸다 — value: 섬 크기(px) · delta: 화살표 ±20(섬 자기 크기에 — 창 크기에 더하면 한 번에 31이 늘었다, 2026-10-27 잼) · reset: 처음으로
  const send = (p) => { if (dock) F.winEvent({ type: "dock-size", axis: axisOf(dock.side), ...p }); };
  let drag = false, raf = 0;
  hd.addEventListener("pointerdown", (e) => { if (e.button !== 0 || !dock) return; e.preventDefault(); drag = true; hd.setPointerCapture(e.pointerId); document.documentElement.classList.add("hd-drag"); });
  hd.addEventListener("pointermove", (e) => {
    if (!drag || raf) return;
    raf = requestAnimationFrame(() => { raf = 0; if (!dock) return; const edge = { left: e.clientX, right: innerWidth - e.clientX, top: e.clientY, bottom: innerHeight - e.clientY }[dock.side]; send({ value: edge - (dock.size - dock.inner) }); });   // 끈 자리(창 크기) → 섬 크기(여백을 뺀다)
  });
  const endDrag = () => { drag = false; document.documentElement.classList.remove("hd-drag"); };
  hd.addEventListener("pointerup", endDrag); hd.addEventListener("pointercancel", endDrag);
  hd.addEventListener("dblclick", () => send({ reset: true }));
  hd.addEventListener("keydown", (e) => {
    if (!dock) return;
    const grow = { right: "ArrowLeft", left: "ArrowRight", top: "ArrowDown", bottom: "ArrowUp" }[dock.side], shrink = { right: "ArrowRight", left: "ArrowLeft", top: "ArrowUp", bottom: "ArrowDown" }[dock.side], r = RANGE[axisOf(dock.side)];
    if (e.key === "Enter") send({ reset: true }); else if (e.key === grow) send({ delta: 20 }); else if (e.key === shrink) send({ delta: -20 }); else if (e.key === "Home") send({ value: r[0] }); else if (e.key === "End") send({ value: maxOf() }); else return;
    e.preventDefault();
  });
  window.addEventListener("resize", placeHandle);
  const data = (t) => ({ ...t.dataset });
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act], [data-bv]");
    if (!t) return;
    F.winEvent({ type: "click", act: t.dataset.act || "", bv: t.dataset.bv || "", data: data(t), label: t.dataset.label || "", ghost: t.classList.contains("ghost"), tag: t.tagName });
  });
  root.addEventListener("change", (e) => { const t = e.target; if (!t.dataset || (!t.dataset.act && !t.dataset.bv)) return; F.winEvent({ type: "change", act: t.dataset.act || "", bv: t.dataset.bv || "", data: data(t), value: t.value, checked: !!t.checked }); });
  root.addEventListener("input", (e) => { const t = e.target; if (!t.dataset || !t.dataset.act) return; F.winEvent({ type: "input", act: t.dataset.act, data: data(t), value: t.value }); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); F.winEvent({ type: "key", key: "Escape", kind }); } });
  // 설명 풍선 — 섬(app.js showTT)과 같은 모양 · 같은 글
  const tt = document.createElement("div"); tt.className = "tt"; tt.setAttribute("role", "tooltip"); document.body.appendChild(tt);
  function showTT(el) {
    const [h, b] = (el.dataset.tt || "").split("|");
    tt.innerHTML = `<b>${esc(h)}</b>${esc(b || "")}`; tt.classList.add("on");
    const r = el.getBoundingClientRect(), w = tt.offsetWidth;
    tt.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`; tt.style.top = `${r.top > 90 ? r.top - tt.offsetHeight - 8 : r.bottom + 8}px`;
  }
  document.addEventListener("mouseover", (e) => { const el = e.target.closest && e.target.closest("[data-tt]"); if (el) showTT(el); else tt.classList.remove("on"); });
  document.addEventListener("focusin", (e) => { const el = e.target.closest && e.target.closest("[data-tt]"); if (el) showTT(el); });
  document.addEventListener("focusout", () => tt.classList.remove("on"));
})();
