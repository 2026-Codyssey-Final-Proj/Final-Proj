// claude-drafted: 2026-10-17 — 3분 시연 길잡이. 01-docs/04-pattern-implementation/demo-story-3min.md의 9장면을 순서대로 잇는다.
// 어느 시연 페이지든 이 파일을 넣으면 작은 띠("시연 n/9 · 장면 이름 ‹ ›")가 뜬다. 페이지는 <body data-tour="nav|lib|sky|entry">로 자기가 누구인지 알린다.
// 장면 주소는 각 페이지의 주소 끝(#) 규칙을 그대로 쓴다 — 내비게이터 app.js · 서고 library.js · 하늘 sky.js가 읽는다. 서버·저장·AI 호출 없음.
(function () {
  const ME = document.body.dataset.tour;
  if (!ME) return;
  const ROOT = ME === "entry" ? "" : "../";
  const PAGES = { nav: "navigator/index.html", lib: "library/index.html", sky: "library/sky.html" };
  const SCENES = [
    ["nav", "start", "문제 한 줄", "만들고 있는 걸 보여 주기"],
    ["nav", "ex=0", "지금 · 다음 할 일", "0단계, 지금 할 일 하나"],
    ["nav", "ex=0&crit", "완료 기준 · 쉬운 말", "근거 구절과 용어 풀이"],
    ["nav", "ex=1&tab=doc", "설계도", "초안 → 고치기 → 다시 보기 → 확정"],
    ["nav", "ex=1&done&gate", "넘어가기 전 확인", "이해하셨나요? → 아니요 → 한 장 요약"],
    ["nav", "tab=all", "한곳에서 보기", "진행 · 할 일 · 일정 충돌 · 토큰"],
    ["nav", "tab=lib&book=s3", "한 권의 책으로", "완주한 책을 엮어 서고에"],
    ["lib", "lib-review", "전체 돌아보기", "역량 지도 · 지나온 길"],
    ["sky", "year", "한 해 하늘", "쌓인 배움이 하늘이 된다"],
  ].map(([page, hash, label, what], i) => ({ n: i + 1, page, hash, label, what }));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cur = () => { const h = decodeURIComponent(location.hash.slice(1)); return SCENES.find((s) => s.page === ME && s.hash === h) || null; };
  const url = (s) => `${ROOT}${PAGES[s.page]}#${s.hash}`;
  // 같은 페이지면 주소만 바꾸고 다시 읽는다(각 페이지가 주소 끝을 읽는 건 열릴 때 한 번이라서)
  function jump(s) { if (s.page === ME) { location.hash = s.hash; location.reload(); } else location.href = url(s); }

  const el = document.createElement("nav");
  el.className = "tour"; el.setAttribute("aria-label", "3분 시연 길잡이");
  document.body.appendChild(el);
  let open = false;
  function render() {
    const c = cur(), prev = c && SCENES[c.n - 2], next = c ? SCENES[c.n] : SCENES[0];
    el.innerHTML = `<button class="tour-step" data-prev ${prev ? "" : "disabled"} aria-label="이전 장면">‹</button>
      <button class="tour-now" data-list aria-expanded="${open}" title="장면 목록 펼치기">${c ? `<b>${c.n}/9</b>${esc(c.label)}` : `<b>시연</b>길잡이`}</button>
      <button class="tour-step" data-next ${next ? "" : "disabled"} aria-label="${c ? "다음 장면" : "시연 시작"}">›</button>
      ${open ? `<ol class="tour-list">${SCENES.map((s) => `<li class="${c && s.n === c.n ? "now" : ""}"><a href="${url(s)}" data-n="${s.n}"><b>${s.n}</b><span>${esc(s.label)}<small>${esc(s.what)}</small></span></a></li>`).join("")}
        <li class="home"><a href="${ROOT}index.html">⌂ 시연 입구</a></li></ol>` : ""}`;
    el.querySelector("[data-list]").onclick = () => { open = !open; render(); };
    if (prev) el.querySelector("[data-prev]").onclick = () => jump(prev);
    if (next) el.querySelector("[data-next]").onclick = () => jump(next);
    el.querySelectorAll("[data-n]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); jump(SCENES[+a.dataset.n - 1]); }));
  }
  addEventListener("hashchange", render);
  render();
})();
