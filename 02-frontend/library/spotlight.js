// claude-drafted: 2026-10-17 — 검색창 바로 밑에 결과를 펼치는 검색 부품(macOS Spotlight 방식). 서고(library.js)와 별자리 하늘(sky.js)이 같이 쓴다.
// 이재엽 요청: "찾은 내용들을 영상처럼 말고 검색창 밑에서 확인이 가능하도록" — 맨 위 줄이 골라진 채로 보이고, ↑↓로 옮기고, Enter로 연다.
// 입력한 글 뒤에 "— 첫 결과 열기"를 흐리게 붙인다. 결과 줄의 글은 search(q)가 HTML로 만들어 준다(이미 escape된 것).
(function (root) {
  function attach({ form, input, search, onChange = () => {}, placeholderHint = "열기" }) {
    form.classList.add("spot");
    const list = document.createElement("ul");
    list.className = "spot-list"; list.setAttribute("role", "listbox"); list.id = `${input.id}-list`; list.hidden = true;
    form.appendChild(list);
    const ghost = document.createElement("span");
    ghost.className = "spot-ghost"; ghost.setAttribute("aria-hidden", "true");
    input.parentNode.insertBefore(ghost, input.nextSibling);
    input.setAttribute("role", "combobox"); input.setAttribute("aria-controls", list.id); input.setAttribute("aria-expanded", "false"); input.setAttribute("aria-autocomplete", "list");

    let rows = [], sel = 0, timer;
    const measure = document.createElement("canvas").getContext("2d");
    function placeGhost() {
      const first = rows[sel];
      if (!input.value.trim() || !first) { ghost.textContent = ""; return; }
      const cs = getComputedStyle(input);
      measure.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ghost.style.left = `${input.offsetLeft + parseFloat(cs.paddingLeft) + measure.measureText(input.value).width + 6}px`;
      ghost.textContent = `— ${first.plain} ${first.hint || placeholderHint}`;
    }
    function paint() {
      list.hidden = !input.value.trim();
      input.setAttribute("aria-expanded", String(!list.hidden));
      form.classList.toggle("open", !list.hidden);
      list.innerHTML = rows.length
        ? rows.map((r, i) => `<li role="option" id="${list.id}-${i}" aria-selected="${i === sel}" data-i="${i}">
            <span class="spot-ic">${r.icon || ""}</span><span class="spot-tx"><b>${r.title}</b>${r.sub ? `<small>${r.sub}</small>` : ""}</span>
            <span class="spot-rt">${r.right || ""}${i === sel ? `<span class="spot-key">↵ ${r.hint || placeholderHint}</span>` : ""}</span></li>`).join("")
        : `<li class="spot-none">찾은 곳이 없어요 — 더 짧은 말이나 다른 말로 찾아보세요</li>`;
      if (rows.length) input.setAttribute("aria-activedescendant", `${list.id}-${sel}`); else input.removeAttribute("aria-activedescendant");
      list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
      placeGhost();
    }
    function run() { rows = input.value.trim() ? search(input.value) : []; sel = 0; paint(); onChange(input.value, rows); }
    function open(i) { const r = rows[i]; if (r) r.open(); }
    input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 80); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && rows.length) { e.preventDefault(); sel = (sel + 1) % rows.length; paint(); }
      else if (e.key === "ArrowUp" && rows.length) { e.preventDefault(); sel = (sel - 1 + rows.length) % rows.length; paint(); }
      else if (e.key === "Enter") { e.preventDefault(); clearTimeout(timer); if (rows.length) open(sel); else run(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (input.value) { clear(); } else input.blur(); }
    });
    form.addEventListener("submit", (e) => e.preventDefault());
    list.addEventListener("mousemove", (e) => { const li = e.target.closest("[data-i]"); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; paint(); } });
    list.addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) open(+li.dataset.i); });
    function clear() { input.value = ""; run(); }
    function set(q) { input.value = q; run(); }
    return { clear, set, refresh: run, close() { list.hidden = true; form.classList.remove("open"); input.setAttribute("aria-expanded", "false"); ghost.textContent = ""; } };
  }
  root.Spotlight = { attach };
})(window);
