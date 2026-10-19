// claude-drafted: 2026-10-19 — 처음 켤 때 플로로가 반기고, AI를 어떻게 부를지(Claude Code / API 키) 하나를 골라 같이 준비한다.
// 이재엽 요청: "플로로가 켜졌을때 초기 세팅을 도와주는 내용 … api키를 받든 아니면 클로드코드로 연동이 되도록 하든 둘중 하나를 선택해서 설정 할 수 있도록
// 처음에 도와주도록 해주고 처음에 들어가면 반갑다고 해주는 내용도".
// 순서: 반가워요 → 고르기 → (Claude Code: 찾기 · 로그인 · 폴더 연결 · 연결 확인 | API 키: 키 넣기 · 폴더 연결(선택) · 연결 확인) → 준비 끝.
// 언제 뜨나: 이 브라우저(앱)에 끝낸 기록(floe:setup:v1)이 없고 주소 끝(#…)이 없을 때 — 시연 장면 주소(#ex=1 등)는 막지 않는다. #setup이면 늘. 설정 톱니의 '처음 설정 다시 하기'로도.
// 키는 이 화면이 저장하지 않는다: 앱(Electron)이면 preload의 floeApp.saveKey로 앱이 설정 폴더의 .env(나만 읽기)에 쓴다. 브라우저로 연 화면은 키를 받지 않고 .env 안내만 한다.
// 서버: GET /api/setup(있다 · 없다만) · POST /api/setup/check(작은 요청 하나, 확인 값 쿠키) — API.md 3-10 · 3-11. 순수 함수는 04-tests/navigator/setup-ui.test.js가 본다.
(function (root) {
  "use strict";
  const KEY = "floe:setup:v1";

  // ── 순수 함수 ──
  const readSaved = (storage) => { try { const v = JSON.parse(storage.getItem(KEY) || "null"); return v && typeof v === "object" && !Array.isArray(v) ? v : null; } catch { return null; } };
  // 처음 설정을 띄울까 — #setup이면 늘, 다른 주소 끝(시연 장면)이면 안 띄움, 아니면 끝낸 기록이 없을 때
  function shouldOpen(saved, hash) {
    if (hash === "#setup") return true;
    if (hash && hash !== "#") return false;
    return !(saved && saved.done);
  }
  // 고르기 카드의 한 줄 — st: GET /api/setup의 답. 없으면(파일로 열었거나 서버가 옛 판) null
  function chipCli(st) {
    if (!st) return { tone: "dim", text: "앱이나 서버로 켜면 알 수 있어요" };
    const c = st.claude || {};
    if (!c.found) return { tone: "warn", text: "설치가 필요해요" };
    if (c.signedIn === false) return { tone: "warn", text: "로그인이 필요해 보여요" };
    return { tone: "ok", text: `찾았어요${c.version ? ` · ${c.version}` : ""}` };
  }
  function chipApi(st) {
    if (!st) return { tone: "dim", text: "앱이나 서버로 켜면 알 수 있어요" };
    return st.apiKey ? { tone: "ok", text: st.relay ? "키가 들어 있어요 · 중계 서버" : "키가 들어 있어요" } : { tone: "dim", text: "키를 넣어야 해요" };
  }
  // 추천 — 키가 이미 있으면 API 키, Claude Code를 찾았으면 Claude Code, 둘 다 아니면 없음(사람이 고른다)
  const recommend = (st) => (!st ? "" : st.apiKey ? "api" : st.claude && st.claude.found ? "cli" : "");
  const checkLine = (checked, idle) => (checked === true ? "됐어요! 정말 불러 봤어요"
    : checked && checked.error ? `안 됐어요 — ${checked.error}` : idle);
  // 할 일 — ctx: { app: 앱 안인가, live: 서버로 열었나, folder: 연결한 폴더 안내, checked: true | {error} | null }
  function cliSteps(st, ctx) {
    const c = (st && st.claude) || {};
    return [
      { k: "find", title: "Claude Code 찾기", done: !!c.found,
        line: c.found ? `찾았어요${c.version ? ` (${c.version})` : ""}` : "이 컴퓨터에서 claude 명령을 못 찾았어요. Claude Code를 설치한 뒤 다시 확인해요." },
      { k: "login", title: "로그인", done: c.signedIn === true,
        line: c.signedIn === true ? "로그인되어 있어요" : c.signedIn === false ? "터미널에서 claude를 한 번 켜서 로그인해 주세요" : "로그인했는지는 마지막 '연결 확인'으로 알아봐요" },
      ...(st && st.apiKey ? [{ k: "unkey", title: "API 키 빼기", done: false, line: "지금은 API 키로 불러요. Claude Code로 부르려면 키를 빼야 해요." }] : []),
      { k: "folder", title: "작업 폴더 연결", done: !!ctx.folder, line: ctx.folder || "Claude Code로 일하는 프로젝트 폴더를 고르면, 일할 때마다 플로로가 알아채요." },
      { k: "check", title: "연결 확인", done: ctx.checked === true, line: checkLine(ctx.checked, "아주 작은 요청 하나로 정말 되는지 봐요") },
    ];
  }
  function apiSteps(st, ctx) {
    return [
      { k: "key", title: "API 키 넣기", done: !!(st && st.apiKey),
        line: st && st.apiKey ? `키가 들어 있어요${st.relay ? " · 중계 서버" : ""}` : ctx.app ? "키는 이 컴퓨터의 앱 설정 폴더에만 저장돼요(나만 읽기)" : "서버로 연 화면에서는 키를 받지 않아요. 아래처럼 .env에 넣고 다시 켜요." },
      { k: "folder", title: "작업 폴더 연결 (고르지 않아도 돼요)", done: !!ctx.folder, line: ctx.folder || "Claude Code로 일한다면 폴더를 이어 두세요. 일할 때마다 플로로가 알아채요." },
      { k: "check", title: "연결 확인", done: ctx.checked === true, line: checkLine(ctx.checked, "내 키로 아주 작은 요청 하나(수십 토큰)를 보내 봐요") },
    ];
  }
  const api = { KEY, readSaved, shouldOpen, chipCli, chipApi, recommend, cliSteps, apiSteps };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  // ── 화면 (브라우저에서만) ──
  const doc = root.document, Seal = root.NavSeal;
  const STILL = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = root.location.protocol.startsWith("http"), app = !!root.floeApp;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const CMD = {
    connect: "node 03-backend/navigator/connect.js <내 프로젝트 폴더> --apply",
    env: "ANTHROPIC_API_KEY=<내 키>",
    start: "node 03-backend/navigator/floe.js <내 프로젝트 폴더>",
  };
  let host = null, s = null, lastStep = "";
  const fresh = () => ({ step: "hello", via: "", st: null, folder: "", checked: null, busy: "", note: "", show: false });

  function save(via) { try { root.localStorage.setItem(KEY, JSON.stringify({ done: true, via, at: new Date().toLocaleDateString("sv-SE") })); } catch {} }
  async function status() {
    if (!live) return null;
    try { const j = await (await fetch("/api/setup", { cache: "no-store" })).json(); return j && j.ok ? j : null; } catch { return null; }
  }
  const floro = (mood, size) => (Seal ? Seal.svg(mood, size, { hole: true }) : "");
  const phone = () => !root.floeApp && root.matchMedia && root.matchMedia("(max-width:600px)").matches;   // 앱 안에서는 창이 좁아도 PC 모양(2026-10-19)
  const chip = (c) => `<span class="su-chip ${c.tone}">${esc(c.text)}</span>`;
  const code = (k) => `<span class="su-code"><code>${esc(CMD[k])}</code><button type="button" class="b ghost su-copy" data-s="copy" data-k="${k}">복사</button></span>`;

  const MOOD = { hello: "happy", choose: "look", cli: "idle", api: "idle", done: "done" };
  function body() {
    if (s.step === "hello") return `
      <h2 id="su-title" class="mc-title">반가워요! 저는 길잡이 물범 플로로예요.</h2>
      <p class="mc-sub">처음이니까 같이 준비해요. AI를 어떻게 불러 올지 하나만 고르면 돼요. 1분이면 끝나요.</p>
      <div class="su-acts"><button type="button" class="b pri" data-s="go" data-to="choose">준비 시작하기<kbd aria-hidden="true">Enter</kbd></button>
        <button type="button" class="b ghost" data-s="later">나중에 할게요</button></div>`;
    if (s.step === "choose") {
      const rec = recommend(s.st);
      const card = (via, title, line, c) => `<button type="button" class="su-pick${rec === via ? " rec" : ""}" data-s="pick" data-via="${via}">
        <span class="su-pick-t">${esc(title)}${rec === via ? '<span class="su-rec">추천</span>' : ""}</span><span class="su-pick-l">${esc(line)}</span>${chip(c)}</button>`;
      return `
      <h2 id="su-title" class="mc-title">AI를 어떻게 불러 올까요?</h2>
      <p class="mc-sub">둘 중 하나만 고르면 돼요. 나중에 설정(톱니)에서 바꿀 수 있어요.</p>
      <div class="su-picks">${card("cli", "Claude Code로 연결", "이 컴퓨터에 로그인된 Claude Code를 써요. 키를 넣지 않아도 되고, 내 구독 안에서 불러요.", chipCli(s.st))}
        ${card("api", "API 키 넣기", "내 Anthropic API 키로 불러요. 쓴 토큰은 내 키의 한도에서 빠져요.", chipApi(s.st))}</div>
      <p class="su-fine">어느 쪽이든 보여 준 글은 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처는 빼 주세요.</p>
      <div class="su-acts"><button type="button" class="b ghost" data-s="go" data-to="hello">‹ 뒤로</button>
        <button type="button" class="b soft" data-s="practice">AI 없이 연습용 예시로 둘러보기</button></div>`;
    }
    if (s.step === "cli" || s.step === "api") {
      const steps = s.step === "cli" ? cliSteps(s.st, { app, live, folder: s.folder, checked: s.checked }) : apiSteps(s.st, { app, live, folder: s.folder, checked: s.checked });
      const ready = s.checked === true;
      return `
      <h2 id="su-title" class="mc-title">${s.step === "cli" ? "Claude Code로 연결해요" : "API 키로 연결해요"}</h2>
      ${!live ? `<p class="mc-sub su-warn">지금은 서버 없이 파일로 열었어요. Floe 앱(.dmg)이나 터미널의 floe.js로 켜면 여기서 바로 연결할 수 있어요.</p>` : ""}
      <ol class="su-steps">${steps.map((x) => `<li class="${x.done ? "ok" : ""}"><span class="su-ck" aria-hidden="true">${x.done ? "✓" : ""}</span>
        <div><b>${esc(x.title)}</b><span class="su-line">${esc(x.line)}</span>${tools(x)}</div></li>`).join("")}</ol>
      ${s.note ? `<p class="su-note" role="status">${esc(s.note)}</p>` : ""}
      <div class="su-acts"><button type="button" class="b ghost" data-s="go" data-to="choose">‹ 다시 고르기</button>
        <button type="button" class="b ${ready ? "pri" : ""}" data-s="finish">${ready ? "다 했어요" : "확인 없이 끝내기"}${ready ? '<kbd aria-hidden="true">Enter</kbd>' : ""}</button></div>`;
    }
    const line = s.via === "cli" ? "앞으로 Claude Code로 일하면 제가 옆에서 알아채고, 지금 몇 단계인지와 다음에 할 일을 알려 드릴게요."
      : s.via === "api" ? "보여 주신 글을 내 API 키로 살펴볼게요. 쓴 토큰은 설정에서 볼 수 있어요."
        : "연습용 예시로 둘러봐요. 진짜 연결은 설정(톱니)의 '처음 설정 다시 하기'에서 언제든 할 수 있어요.";
    return `
      <h2 id="su-title" class="mc-title">준비 끝!</h2>
      <p class="mc-sub">${esc(line)}</p>
      <div class="su-acts"><button type="button" class="b pri" data-s="done">시작하기<kbd aria-hidden="true">Enter</kbd></button></div>`;
  }
  // 할 일 줄 아래의 단추 · 명령
  function tools(x) {
    const busy = s.busy === x.k ? " disabled" : "";
    if (x.k === "find" && !x.done) return `<a class="su-link" href="https://claude.com/claude-code" target="_blank" rel="noopener">Claude Code 설치 안내 열기</a>
      <button type="button" class="b ghost" data-s="refresh"${busy}>다시 찾기</button>`;
    if (x.k === "unkey") return app ? `<button type="button" class="b" data-s="unkey"${busy}>키 빼기</button>` : `<span class="su-line">03-backend/navigator/.env에서 ANTHROPIC_API_KEY 줄을 지우고 floe.js를 다시 켜요.</span>`;
    if (x.k === "folder") return app ? `<button type="button" class="b" data-s="folder"${busy}>${x.done ? "다른 폴더 연결" : "폴더 고르기"}</button>` : code("connect");
    if (x.k === "key") {
      if (x.done) return app ? `<button type="button" class="b ghost" data-s="rekey">다른 키 넣기</button>` : "";
      if (!app) return `${code("env")}<span class="su-line">.env는 03-backend/navigator 안에 두고(.env.example을 복사), 다시 켜요:</span>${code("start")}`;
      return `<form class="su-key" data-s="key"><label class="su-lab">API 키<span class="su-row"><input type="password" name="key" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" required>
        <button type="button" class="b ghost" data-s="peek" aria-pressed="false">보기</button></span></label>
        <details><summary>중계 서버를 써요 (코디세이 가상 키)</summary><label class="su-lab">중계 서버 주소<input type="url" name="base" autocomplete="off" spellcheck="false" placeholder="https://…"></label></details>
        <button type="submit" class="b pri"${busy}>저장하고 확인하기</button></form>`;
    }
    if (x.k === "check" && live) return `<button type="button" class="b${x.done ? " ghost" : ""}" data-s="check"${s.busy === "check" ? " disabled" : ""}>${s.busy === "check" ? "확인하는 중…" : x.done ? "다시 확인" : "연결 확인하기"}</button>`;
    return "";
  }

  function render() {
    const mood = s.busy === "check" ? "think" : s.checked && s.checked.error ? "alert" : s.checked === true && s.step !== "done" ? "happy" : MOOD[s.step];
    host.innerHTML = `<div class="su-back"></div><section class="su isl" role="dialog" aria-modal="true" aria-labelledby="su-title">
      <div class="su-cat">${floro(mood, phone() ? 84 : 124)}</div><div class="su-main">${body()}</div>
      <ol class="su-dots" aria-label="처음 설정 ${["hello", "choose", "cli", "done"].indexOf(s.step === "api" ? "cli" : s.step) + 1} / 4">${["hello", "choose", "cli", "done"].map((k) =>
        `<li class="${(s.step === "api" ? "cli" : s.step) === k ? "on" : ""}"></li>`).join("")}</ol></section>`;
    // 단계가 바뀌면 제목으로(화면 읽기 프로그램이 새 단계부터 읽는다), 같은 단계에서 다시 그리면 하던 자리 가까이로
    const title = host.querySelector("#su-title");
    if (title && s.step !== lastStep) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
    else if (!host.contains(doc.activeElement)) { const b = host.querySelector(".su-main .b.pri, .su-main .b"); if (b) b.focus({ preventScroll: true }); }
    lastStep = s.step;
  }
  async function refresh() { s.st = await status(); render(); }
  function burst(kind, n) {
    if (STILL || !Seal || !Seal.burst) return;
    const r = host.querySelector(".su-cat"); if (!r) return;
    const b = r.getBoundingClientRect(); Seal.burst(b.left + b.width / 2, b.top + b.height * 0.3, kind, n, kind === "star" ? 360 : 140);
  }
  async function check() {
    s.busy = "check"; s.checked = null; s.note = ""; render();
    try {
      const r = await fetch("/api/setup/check", { method: "POST" });
      const j = await r.json().catch(() => null);
      s.checked = r.ok && j && j.ok ? true : { error: (j && j.reason) || `서버가 ${r.status}로 답했어요` };
      if (s.checked === true && j.replay) s.note = "녹화를 재생하는 중이라 AI를 부르지 않고 넘어갔어요.";
    } catch { s.checked = { error: "서버에 닿지 않아요 — 앱이나 floe.js가 켜져 있는지 봐 주세요" }; }
    s.busy = ""; render();
    if (s.checked === true) burst("heart", 6);
  }
  function close(via, open) {
    save(via);
    host.remove(); host = null;
    doc.dispatchEvent(new CustomEvent("floe:setup-done", { detail: { via, open } }));
  }

  async function act(el, e) {
    const a = el.dataset.s;
    if (a === "go") { s.step = el.dataset.to; s.note = ""; render(); return; }
    if (a === "later") return close("later", false);
    if (a === "practice") { s.via = "practice"; s.step = "done"; render(); burst("star", 12); return; }
    if (a === "pick") { s.via = el.dataset.via; s.step = s.via; s.checked = null; s.note = ""; render(); refresh(); return; }
    if (a === "refresh") { s.busy = "find"; render(); await refresh(); s.busy = ""; render(); return; }
    if (a === "check") return check();
    if (a === "finish") { s.step = "done"; render(); burst("star", 14); return; }
    if (a === "done") return close(s.via || "later", true);
    if (a === "copy") {
      const t = CMD[el.dataset.k];
      try { await root.navigator.clipboard.writeText(t); el.textContent = "복사함"; } catch { el.textContent = "직접 골라 복사해요"; }
      return;
    }
    if (a === "peek") {
      const inp = host.querySelector('input[name="key"]'); if (!inp) return;
      const on = inp.type === "password"; inp.type = on ? "text" : "password"; el.setAttribute("aria-pressed", String(on)); el.textContent = on ? "가리기" : "보기"; return;
    }
    if (a === "folder" && app) {
      s.busy = "folder"; render();
      let r = null; try { r = await root.floeApp.connect(); } catch { r = { ok: false, message: "폴더를 잇지 못했어요" }; }
      s.busy = "";
      if (r && r.message) { if (r.ok) s.folder = r.message; else s.note = r.message; }
      render(); return;
    }
    if (a === "unkey" && app) {
      s.busy = "unkey"; render();
      const r = await root.floeApp.clearKey().catch(() => ({ ok: false, message: "키를 빼지 못했어요" }));
      s.busy = ""; s.note = r && r.ok ? "키를 뺐어요. 이제 Claude Code로 불러요." : (r && r.message) || "키를 빼지 못했어요";
      await refresh(); return;
    }
    if (a === "rekey") { s.st = { ...s.st, apiKey: false }; render(); return; }
  }
  async function submitKey(form) {
    const key = form.key.value.trim(), base = form.base ? form.base.value.trim() : "";
    if (!key) return;
    s.busy = "key"; s.note = ""; render();
    const r = await root.floeApp.saveKey(key, base).catch(() => ({ ok: false, message: "키를 저장하지 못했어요" }));
    s.busy = "";
    if (!r || !r.ok) { s.note = (r && r.message) || "키를 저장하지 못했어요"; render(); return; }
    s.note = "키를 저장했어요. 이제 정말 되는지 볼게요.";
    await refresh();
    return check();
  }

  function open() {
    if (host) return;
    s = fresh();
    host = doc.createElement("div"); host.id = "floe-setup";   // 앱 안이면 html.in-app(app.js) — 뒤를 어둡게 깔지 않는다(setup.css)
    doc.body.appendChild(host);
    host.addEventListener("click", (e) => { const el = e.target.closest("[data-s]"); if (el && el.tagName !== "FORM" && !el.disabled) act(el, e); });
    host.addEventListener("submit", (e) => { e.preventDefault(); if (app) submitKey(e.target); });
    host.addEventListener("keydown", (e) => {
      e.stopPropagation();   // 뒤의 오버레이 단축키가 같이 움직이지 않게
      if (e.key === "Escape") { e.preventDefault(); return close(s.step === "done" ? s.via || "later" : "later", false); }
      if (e.key === "Enter" && !e.isComposing && !/^(INPUT|TEXTAREA|BUTTON|A|SUMMARY)$/.test(e.target.tagName)) {
        const pri = host.querySelector(".su-main .su-acts .b.pri"); if (pri) { e.preventDefault(); pri.click(); }
      }
    });
    render();
    doc.dispatchEvent(new CustomEvent("floe:setup-open"));   // 앱이면 app.js가 창을 넓힌다 — 섬 크기 창에 끼지 않게(KAN-57)
    if (s.step === "hello") setTimeout(() => burst("heart", 7), 250);
    refresh();
  }

  root.FloeSetup = { ...api, open };
  // 켤 때 인사(app.js, C-10 2026-10-20)가 돌고 있으면 그것이 끝난 뒤에 연다 — 인사가 두 번 나오지 않게(인사 움직임 → 처음 설정)
  const boot = () => {
    let saved = null; try { saved = readSaved(root.localStorage); } catch {}
    if (!shouldOpen(saved, root.location.hash)) return;
    if (doc.documentElement.classList.contains("greeting")) doc.addEventListener("floe:greet-done", () => open(), { once: true }); else open();
  };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
