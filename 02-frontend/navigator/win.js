// claude-drafted: 2026-10-21 — 앱의 설정 창 · 퀘스트 창(C-22, win.html)의 동작. 상태는 섬(app.js) 하나가 갖는다:
//   섬이 보낸 내용(HTML)을 그대로 보이고, 여기서 누르거나 바꾸거나 적은 것은 섬으로 돌려보낸다(floeApp.winEvent → main.js → 섬 app.js winEvent). 섬이 처리하고 다시 그려 보낸다.
//   다시 그려도 쓰던 글 칸은 그대로(커서 자리까지) — 섬의 render와 같은 방식. 설명 풍선(data-tt)만 여기서 띄운다(섬과 같은 글).
// 2026-10-27 C-41 ⑤(두승현): 섬이 보낸 HTML 끝의 .isl-col(플로로 · 채팅 · 판)이 이 창 안의 옆 칸이다 — 작업실이 열려 있는 동안 섬 창은 숨는다(main.js). 칸의 자리는 섬이 class(side-…)로, 크기는 여기서(이 컴퓨터에만)
// 브라우저로 열면(window.floeApp 없음) 아무것도 하지 않는다 — 섬 옆의 판이 같은 것을 보인다
(function () {
  const F = window.floeApp, root = document.getElementById("root"), kind = location.hash.slice(1) || "quest";
  document.documentElement.classList.add("in-win", `win-${kind}`);
  document.title = kind === "quest" ? "Floe — 작업실" : "Floe — 설정";   // 테두리 있는 작업실 창(C-41, 2026-10-26)은 OS 제목 줄에 이 글이 보인다 — main.js의 title을 페이지가 덮어쓴다
  if (!F || !F.onWinHtml) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let goShown = "", goStageShown = "";   // 마지막으로 옮겨 간 목차 차례 번호(data-go) · 대화 구분선(data-go-stage, C-63)
  const WS_PANES = [".wnav", ".wside"];   // 다시 그려도 스크롤을 지키는 작업실 옆 칸 — 섬(app.js)의 WS_PANES와 같다
  // 파일 보기(.fv)의 글 칸 스크롤 — 섬(app.js)의 fvScroll과 같다: was 없이 부르면 읽고, 주면 같은 파일 · 같은 보기일 때 되돌린다
  const fvScroll = (fv, was) => { const b = fv && fv.querySelector(".fv-code, .fv-md"); if (!was) return b ? { f: fv.dataset.f, c: b.className, top: b.scrollTop, left: b.scrollLeft } : null; if (b && b.className === was.c && fv.dataset.f === was.f) { b.scrollTop = was.top; b.scrollLeft = was.left; } };
  // 섬이 보낸 내용 — 쓰던 글 칸(data-act)은 커서 · 스크롤까지 되돌린다
  // 플로로 눈은 이 창 안의 커서를 따라간다 — 작업실이 열리면 섬은 이 창의 옆 칸에 그려지는데 눈 따라가기는 섬 창(app.js)에서만 돌아 고정돼 있었다(두승현 2026-10-29).
  //   섬 창과 같은 함수(seal.js follow) · 같은 움직임 줄이기 기준. 창 밖 커서는 따라가지 않는다(앱은 창 밖 커서를 섬 창에만 보낸다)
  const S = window.NavSeal, STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let eyeAt = null, eyeRaf = 0;
  if (S && !STILL) document.addEventListener("mousemove", (e) => { eyeAt = { x: e.clientX, y: e.clientY }; if (!eyeRaf) eyeRaf = requestAnimationFrame(() => { eyeRaf = 0; S.follow(root, eyeAt); }); });
  // 한글을 조합하는 동안 다시 그리면 조합이 깨진다(입력마다 섬이 화면을 다시 보낸다) — 조합 중에 온 화면은 미뤄 두고 끝나면 마지막 것을 그린다(F-103-18)
  let composing = false, pending = null;
  root.addEventListener("compositionstart", () => { composing = true; });
  //   끝난 바로 뒤에 다음 음절의 compositionstart가 오므로 한 박자 미뤄 그때도 조합 중이 아니면 그린다(새 맥락 리뷰)
  root.addEventListener("compositionend", () => { composing = false; setTimeout(() => { if (composing || pending === null) return; const h = pending; pending = null; draw(h); }, 0); });
  F.onWinHtml((html) => { if (composing && root.contains(document.activeElement)) { pending = html; return; } composing = false; draw(html); });   // 글 칸이 사라져 compositionend가 안 와도 멈춰 있지 않게
  function draw(html) {
    const a = document.activeElement, keep = a && a.dataset && a.dataset.act && /^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName) ? a : null;
    const key = keep ? `${keep.dataset.act}|${keep.dataset.i || ""}|${keep.dataset.k || ""}` : "", sel = keep ? [keep.selectionStart, keep.selectionEnd, keep.scrollTop] : null;
    // 스크롤은 같은 화면(data-view — 탭 · 펼친 책 · 단계 문서)을 다시 그릴 때만 되돌린다. 화면이 바뀌면 맨 위부터 —
    //   책 탭 아래의 '단계 문서 · 정한 것 펼치기'를 누르면 문서가 중간부터 보였다(임유정 2026-10-25, F-58-6) — claude-drafted: 2026-10-25
    const was = root.querySelector(".wbody"), scroll = was ? was.scrollTop : 0, view = was ? was.dataset.view : null;
    // 옆 칸의 대화 기록([data-log]) — 맨 아래를 보고 있었으면 새 말이 와도 맨 아래, 위로 올려 읽는 중이면 그 자리(섬의 render와 같은 뜻, C-41 ⑤)
    const lg = root.querySelector("[data-log]"), lgTop = lg ? lg.scrollTop : null, lgEnd = !lg || lg.scrollTop + lg.clientHeight >= lg.scrollHeight - 4;
    const fvWas = fvScroll(root.querySelector(".fv")), sideWas = WS_PANES.map((c) => { const e = root.querySelector(c); return e ? e.scrollTop : null; });   // 파일 칸 · 오른쪽 칸도 — 아래쪽 목차를 누르면 맨 위로 올라갔다
    root.innerHTML = html || "";
    if (S && eyeAt) S.follow(root, eyeAt);   // 다시 그려도 눈은 마지막 커서 쪽
    fvScroll(root.querySelector(".fv"), fvWas);
    WS_PANES.forEach((c, j) => { const e = root.querySelector(c); if (e && sideWas[j] != null) e.scrollTop = sideWas[j]; });
    if (key) { const b = [...root.querySelectorAll("[data-act]")].find((x) => `${x.dataset.act}|${x.dataset.i || ""}|${x.dataset.k || ""}` === key); if (b) { b.focus(); try { b.setSelectionRange(sel[0], sel[1]); } catch {} b.scrollTop = sel[2]; } }
    const body = root.querySelector(".wbody"); if (body) body.scrollTop = body.dataset.view === view ? scroll : 0;
    const lg2 = root.querySelector("[data-log]"); if (lg2) lg2.scrollTop = lgTop === null || lgEnd ? lg2.scrollHeight : lgTop;
    const gs = root.querySelector("[data-log][data-go-stage]"), gv = gs ? gs.dataset.goStage : ""; if (gv && gv !== goStageShown) { goStageShown = gv; const el = gs.querySelector(`[data-stage="${gv.split(":")[0]}"]`); if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("hl"); setTimeout(() => el.classList.remove("hl"), 1200); } }   // C-63 대화 목록의 바로가기 — 그 단계 구분선으로(섬 app.js goStage와 같다)
    const go = root.querySelector("[data-go]"); if (go && go.dataset.go !== goShown) { goShown = go.dataset.go; const p = go.closest(".fv-code"); if (p) p.scrollTop = go.offsetTop - (p.clientHeight - go.offsetHeight) / 2; }   // 목차로 고른 제목 줄로 한 번만(섬의 ftoc-go — 섬의 render와 같은 뜻)
    layoutCol();
  }
  // ── 섬 옆 칸(.isl-col)의 자리와 크기 — 자리는 class side-top · bottom · left · right(섬이 보냄), 크기는 여기서: 옆이면 너비 320 ~ 760(그리고 창 너비의 반까지, 처음 420), 위아래면 높이 320 ~ 480(처음 360).
  //   손잡이(#hd, role separator): 끌기 · 화살표 20 · Home · End · Enter/두 번 누르기로 처음. 두승현 결정 2026-10-27(스토리보드 열린 질문 6 · 8)
  const RANGE = { w: [320, 760, 420], h: [320, 480, 360] }, FOLD = 56;   // FOLD: 접힌 칸(C-46 R-2 — 알약 하나)의 두께
  const ls = (k) => { try { return +localStorage.getItem(k) || 0; } catch { return 0; } };   // 저장소가 막혀도 창은 돌아야 한다
  const col = { w: ls("floe:col-w") || 420, h: ls("floe:col-h") || 360 };
  const sideOf = () => { const c = root.querySelector(".isl-col"); return c ? (c.className.match(/\bside-(top|bottom|left|right)\b/) || [])[1] || "right" : ""; };
  const axisOf = (side) => (side === "left" || side === "right" ? "w" : "h");
  const hiOf = (axis) => (axis === "w" ? Math.max(RANGE.w[0], Math.min(RANGE.w[1], Math.floor(innerWidth / 2))) : RANGE.h[1]);   // 옆은 760과 창 너비의 반 중 작은 것
  const clamp = (axis, v) => Math.max(RANGE[axis][0], Math.min(hiOf(axis), Math.round(v)));
  const hd = document.createElement("div"); hd.id = "hd"; hd.setAttribute("role", "separator"); hd.tabIndex = 0; hd.hidden = true; hd.innerHTML = "<span></span>"; document.body.appendChild(hd);
  const foldedCol = () => { const c = root.querySelector(".isl-col"); return !!c && c.classList.contains("folded"); };
  function layoutCol() {
    const side = sideOf(), h = document.documentElement, folded = foldedCol(), center = !!root.querySelector(".isl-col.center");   // center — C-61 섬이 작업 칸 전체(2026-10-29): 손잡이 없음
    h.dataset.side = side; hd.hidden = !side || folded || center;   // 접힌 칸(C-46 R-2)은 손잡이 없이 두께 FOLD — 작업실이 그만큼 넓어진다(0.3초, win.html)
    if (hd.hidden && drag) endDrag();   // 끄는 도중 손잡이가 숨으면 pointerup이 오지 않는다 — 끌기가 켜진 채 남지 않게(F-103-19)
    if (!side) return;
    const axis = axisOf(side), v = clamp(axis, col[axis]);   // 보이는 값만 줄인다 — 기억한 너비를 덮으면 창을 다시 넓혀도 안 돌아온다(F-103-21)
    h.style.setProperty("--col-w", center ? (root.querySelector(".wnav") ? "calc(100% - 200px)" : "100%") : `${folded ? FOLD : axis === "w" ? v : col.w}px`); h.style.setProperty("--col-h", `${folded ? FOLD : axis === "h" ? v : col.h}px`);   // 칸도 손잡이처럼 보이는 값(v)으로(F-103-21 새 맥락 리뷰)   // center — 왼쪽 파일 칸만 남기고 섬(C-61)
    if (folded || center) return;
    hd.className = axis === "w" ? "v" : "h";
    const whH = (root.querySelector(".wh") || {}).offsetHeight || 0;   // 머리 줄(C-62 — 창 전체 폭)은 손잡이가 덮지 않는다(새 맥락 리뷰 2026-10-29)
    hd.style.cssText = axis === "w" ? `left:${side === "left" ? v - 7 : innerWidth - v - 7}px;top:${whH}px;width:14px;height:calc(100% - ${whH}px)` : `top:${side === "top" ? v - 7 : innerHeight - v - 7}px;left:0;height:14px;width:100%`;
    hd.setAttribute("aria-orientation", axis === "w" ? "vertical" : "horizontal"); hd.setAttribute("aria-label", axis === "w" ? "플로로 칸 너비 손잡이" : "플로로 칸 높이 손잡이");
    hd.setAttribute("aria-valuemin", RANGE[axis][0]); hd.setAttribute("aria-valuemax", hiOf(axis)); hd.setAttribute("aria-valuenow", v); hd.setAttribute("aria-valuetext", `${axis === "w" ? "너비" : "높이"} ${v}px`);
  }
  const setCol = (v) => { const side = sideOf(); if (!side) return; const axis = axisOf(side); col[axis] = clamp(axis, v); try { localStorage.setItem(axis === "w" ? "floe:col-w" : "floe:col-h", col[axis]); } catch {} layoutCol(); };
  const reset = () => setCol(RANGE[axisOf(sideOf())][2]);
  let drag = false, raf = 0;
  hd.addEventListener("pointerdown", (e) => { if (e.button !== 0 || !sideOf()) return; e.preventDefault(); drag = true; hd.setPointerCapture(e.pointerId); document.documentElement.classList.add("hd-drag"); });
  hd.addEventListener("pointermove", (e) => {
    if (!drag || raf) return;
    raf = requestAnimationFrame(() => { raf = 0; const side = sideOf(); if (side) setCol({ left: e.clientX, right: innerWidth - e.clientX, top: e.clientY, bottom: innerHeight - e.clientY }[side]); });
  });
  const endDrag = () => { drag = false; document.documentElement.classList.remove("hd-drag"); };
  hd.addEventListener("pointerup", endDrag); hd.addEventListener("pointercancel", endDrag);
  hd.addEventListener("lostpointercapture", endDrag);   // 캡처가 풀려도 끝낸다(F-103-19 — 숨을 때는 layoutCol이 끝낸다)
  hd.addEventListener("dblclick", reset);
  hd.addEventListener("keydown", (e) => {
    const side = sideOf(); if (!side) return;
    const axis = axisOf(side), grow = { right: "ArrowLeft", left: "ArrowRight", top: "ArrowDown", bottom: "ArrowUp" }[side], shrink = { right: "ArrowRight", left: "ArrowLeft", top: "ArrowUp", bottom: "ArrowDown" }[side];
    if (e.key === "Enter") reset(); else if (e.key === grow) setCol(clamp(axis, col[axis]) + 20); else if (e.key === shrink) setCol(clamp(axis, col[axis]) - 20); else if (e.key === "Home") setCol(RANGE[axis][0]); else if (e.key === "End") setCol(hiOf(axis)); else return;   // ± 20은 보이는 값에서(F-103-21)
    e.preventDefault();
  });
  window.addEventListener("resize", layoutCol);
  const data = (t) => ({ ...t.dataset });
  // C-53 서식 단추(제목 · 굵게 · 목록 · 넣기 · 머리말): 글 칸은 이 창 안에 있어 고른 자리를 섬이 모른다 — 여기서 같은 함수(md-view.js format)로 넣고 input으로 보낸다(섬은 ftext로 받는다)
  const fmtHere = (t) => { const ta = root.querySelector(`.fv-edit[data-v="${t.dataset.v}"]`); if (!ta || !window.FloeMd) return false;
    const r = window.FloeMd.format(ta.value, ta.selectionStart, ta.selectionEnd, t.dataset.fmt); ta.value = r.text; ta.focus(); ta.setSelectionRange(r.start, r.end); ta.dispatchEvent(new Event("input", { bubbles: true })); return true; };
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act], [data-bv]");
    if (!t) return;
    if (t.dataset.act === "ffmt" && fmtHere(t)) return;
    F.winEvent({ type: "click", act: t.dataset.act || "", bv: t.dataset.bv || "", data: data(t), label: t.dataset.label || "", ghost: t.classList.contains("ghost"), tag: t.tagName });
  });
  root.addEventListener("change", (e) => { const t = e.target; if (!t.dataset || (!t.dataset.act && !t.dataset.bv)) return; F.winEvent({ type: "change", act: t.dataset.act || "", bv: t.dataset.bv || "", data: data(t), value: t.value, checked: !!t.checked }); });
  // 옆 칸에 마우스가 있거나 채팅 칸에 글을 쓰는 동안 섬이 접히지 않게(C-46, 새 맥락 리뷰 2026-10-27) — 상태가 바뀔 때만 보낸다
  let colHover = false;
  root.addEventListener("mouseover", (e) => { const on = !!(e.target.closest && e.target.closest(".isl-col")); if (on !== colHover) { colHover = on; F.winEvent({ type: "col", hover: on }); } });
  root.addEventListener("mouseleave", () => { if (colHover) { colHover = false; F.winEvent({ type: "col", hover: false }); } });
  // 작업실에서 움직이거나 누르면 섬에 알려 접히는 시계를 되돌린다(1초에 한 번까지, 섬이 펼쳐져 있을 때만. 임유정 2026-10-28 "움직이거나 클릭을 하면 시간 지나가는게 멈춰야").
  //   전에는 흰 줄(테두리 빛)이 돌 때만 보내고 그 줄도 다시 그렸다 — 빛은 2026-10-29 두승현 결정으로 뺐다
  let pokeAt = 0;
  const poke = () => { const t = Date.now(); if (t - pokeAt < 1000) return; if (!root.querySelector(".isl")) return; pokeAt = t; F.winEvent({ type: "poke" }); };
  for (const n of ["pointermove", "pointerdown", "keydown", "wheel"]) root.addEventListener(n, poke, { passive: true });
  root.addEventListener("focusin", (e) => { if (e.target && e.target.dataset && e.target.dataset.act === "say") F.winEvent({ type: "col", typing: true }); });
  root.addEventListener("focusout", (e) => { if (e.target && e.target.dataset && e.target.dataset.act === "say") F.winEvent({ type: "col", typing: false }); });
  // 글 칸의 줄 위치(C-53 상태 줄) — 바뀔 때만 보낸다
  let caretAt = 0;
  const caret = (e) => { const t = e.target; if (!t || !t.classList || !t.classList.contains("fv-edit")) return; const line = t.value.slice(0, t.selectionStart).split("\n").length; if (line !== caretAt) { caretAt = line; const pos = root.querySelector(".fv-st [data-pos]"); if (pos) pos.textContent = ` · 줄 ${line}`; F.winEvent({ type: "caret", line }); } };   // 상태 줄은 여기서 바로(섬은 다음 그림에)
  root.addEventListener("keyup", caret); root.addEventListener("click", caret); root.addEventListener("select", caret);
  root.addEventListener("toggle", (e) => { if (e.target && e.target.classList && e.target.classList.contains("fn-all")) F.winEvent({ type: "toggle", open: !!e.target.open }); }, true);   // '전체 파일' 접고 펼침(C-63)
  root.addEventListener("input", (e) => { const t = e.target; if (!t.dataset || !t.dataset.act) return; F.winEvent({ type: "input", act: t.dataset.act, data: data(t), value: t.value }); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); return F.winEvent({ type: "key", key: "Escape", kind }); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); return F.winEvent({ type: "key", key: "s", mod: true, kind }); }   // 파일 보기의 저장(C-43) — 섬이 지금 연 파일을 쓴다
    // 옆 칸의 채팅 칸(C-41 ⑤): Enter는 보내기, Shift+Enter는 줄 바꿈 — 섬(app.js)의 채팅 칸과 같다
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.target && e.target.dataset && e.target.dataset.act === "say") { e.preventDefault(); F.winEvent({ type: "key", key: "Enter", act: "say", kind }); }   // isComposing — 한글 조합 중의 Enter(IME 확정)는 보내지 않는다(섬 app.js와 같이)
  });
  // 문서 지도(C-45)의 iframe이 보낸 '파일 보기에서 열기' — 섬으로(ACT map-open)
  window.addEventListener("message", (e) => { if (e.origin !== location.origin) return; const d = e.data; if (d && d.floe === "open" && typeof d.path === "string") F.winEvent({ type: "click", act: "map-open", data: { act: "map-open", v: d.path.slice(0, 500) } }); });
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
