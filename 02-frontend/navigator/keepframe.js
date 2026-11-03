// claude-drafted: 2026-11-03 — F-135(임유정 "상자 탭에서 플로로 대화창을 우측에 띄우면 새로고침되듯이 모션이 반복돼"): 섬 화면(app.js renderDesk)과 작업실 창(win.js draw)은
//   화면이 바뀔 때마다 innerHTML을 통째로 갈아 끼워, 문서 지도 iframe(상자 보기)이 새로 생겨 다시 불러오고 처음 움직임(가운데로 옮기기)이 되풀이됐다.
//   put(el, html): 지금 화면과 새 화면에 같은 주소의 iframe.docmap이 있고 거기까지 가는 층의 태그가 같으면, 그 iframe은 떼지 않고 둘레(층마다 다른 자식 · 속성)만 새 화면으로 바꾼다
//   (iframe은 문서에서 떼었다 붙이기만 해도 다시 불러온다). 아니면 예전처럼 innerHTML.
(function () {
  function syncAttrs(el, from) {
    [...el.attributes].forEach((a) => { if (!from.hasAttribute(a.name)) el.removeAttribute(a.name); });
    [...from.attributes].forEach((a) => { if (el.getAttribute(a.name) !== a.value) el.setAttribute(a.name, a.value); });   // 같은 값은 다시 쓰지 않는다 — iframe의 src를 다시 쓰면 다시 불러온다
  }
  // 층은 태그만 맞춰 보고 다시 쓴다 — 지도 위쪽 요소(.wsx · .qwin · .wbody …)에는 스크립트가 붙인 것(듣기 · 움직임 · WeakMap 키)을 두지 않는다. 남아서 다음 화면으로 따라간다(새 맥락 리뷰)
  const pathTo = (top, leaf) => { const p = []; for (let n = leaf; n && n !== top; n = n.parentNode) p.unshift(n); return p; };
  function put(el, html) {
    const old = el.querySelector("iframe.docmap");
    if (!old) { el.innerHTML = html; return; }
    const t = document.createElement("template"); t.innerHTML = html;
    const nu = t.content.querySelector("iframe.docmap");
    const po = pathTo(el, old), pn = nu ? pathTo(t.content, nu) : [];
    if (!nu || nu.getAttribute("src") !== old.getAttribute("src") || po.length !== pn.length || po.some((n, i) => n.tagName !== pn[i].tagName)) { el.innerHTML = html; return; }
    let o = el, n = t.content;
    po.forEach((keep, i) => {
      const next = pn[i], kids = [...n.childNodes], at = kids.indexOf(next);
      [...o.childNodes].forEach((c) => { if (c !== keep) c.remove(); });
      keep.before(...kids.slice(0, at)); keep.after(...kids.slice(at + 1));
      syncAttrs(keep, next);
      o = keep; n = next;
    });
  }
  window.FloeKeepFrame = { put };
})();
