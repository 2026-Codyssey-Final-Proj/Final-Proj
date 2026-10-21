// claude-drafted: 2026-10-21 — 앱의 설정 창 · 퀘스트 창(C-22, win.html)의 동작. 상태는 섬(app.js) 하나가 갖는다:
//   섬이 보낸 내용(HTML)을 그대로 보이고, 여기서 누르거나 바꾸거나 적은 것은 섬으로 돌려보낸다(floeApp.winEvent → main.js → 섬 app.js winEvent). 섬이 처리하고 다시 그려 보낸다.
//   다시 그려도 쓰던 글 칸은 그대로(커서 자리까지) — 섬의 render와 같은 방식. 설명 풍선(data-tt)만 여기서 띄운다(섬과 같은 글).
// 브라우저로 열면(window.floeApp 없음) 아무것도 하지 않는다 — 섬 옆의 판이 같은 것을 보인다
(function () {
  const F = window.floeApp, root = document.getElementById("root"), kind = location.hash.slice(1) || "quest";
  document.documentElement.classList.add("in-win", `win-${kind}`);
  if (!F || !F.onWinHtml) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // 섬이 보낸 내용 — 쓰던 글 칸(data-act)은 커서 · 스크롤까지 되돌린다
  F.onWinHtml((html) => {
    const a = document.activeElement, keep = a && a.dataset && a.dataset.act && /^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName) ? a : null;
    const key = keep ? `${keep.dataset.act}|${keep.dataset.i || ""}|${keep.dataset.k || ""}` : "", sel = keep ? [keep.selectionStart, keep.selectionEnd, keep.scrollTop] : null;
    const scroll = root.querySelector(".wbody") ? root.querySelector(".wbody").scrollTop : 0;
    root.innerHTML = html || "";
    if (key) { const b = [...root.querySelectorAll("[data-act]")].find((x) => `${x.dataset.act}|${x.dataset.i || ""}|${x.dataset.k || ""}` === key); if (b) { b.focus(); try { b.setSelectionRange(sel[0], sel[1]); } catch {} b.scrollTop = sel[2]; } }
    const body = root.querySelector(".wbody"); if (body) body.scrollTop = scroll;
  });
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
