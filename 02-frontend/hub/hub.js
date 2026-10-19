// claude-drafted: 2026-10-20 — 이재엽 요청(C-11 모아 보기 창 — 바이브 코딩 고르기 · 알림, C-12 AI 진행의 화면 쪽). 넘김 문서 4 · 5절 [제안]대로.
// 모아 보기 창 — 섬과 따로 뜨는 보통 창 하나. 왼쪽에 세 공간(바이브 코딩 · 알림 · AI 진행), 오른쪽에 고른 공간.
//   바이브 코딩: 할 일 종류 카드 둘(바이브 코딩 → 섬의 '이번 단계', 서재 → 서고). 아래 한 줄은 섬의 기록(KEY)에서 지금 단계 · 프로젝트를 **읽기만**.
//   알림: 같은 기록의 alerts(새것부터)를 때 · 도구 · 한 줄 · 끝낸 할 일로. storage 이벤트로 바로 다시 그린다. 읽지 않은 수는 이 창의 sessionStorage.
//   AI 진행: 서버로 열렸으면 GET /api/steps?since=를 2초마다(다른 에이전트의 서버 · steps.js — window.NavSteps). 파일로 열렸거나 서버가 거절하면 예시,
//            NavSteps가 아직 없으면 "아직 준비 중이에요". 판정 · 단계 · 토큰은 부르지도 보이지도 않는다(이재엽 "이건 바이브 코딩이 아니야").
// 순수 함수는 window.FloeHub로도, Node에서는 require로도 열린다(alerts.js와 같은 방식 — 04-tests/navigator/hub.test.js).
(function (root) {
  const KEY = "navigator-prototype:v1";   // 섬(app.js)의 KEY와 같아야 한다 — hub.test.js가 맞대어 본다. 바꾸면 섬 · 서고 · 이 창이 함께 깨진다(넘김 문서 10절)
  const SEEN_KEY = "floe-hub:alerts-seen";   // 이 창에서 마지막으로 본 알림의 때 — 이 창의 sessionStorage에만
  const MAX_STEPS = 50, POLL_MS = 2000;
  const TOOL = { claude: "Claude Code", codex: "Codex" };
  const KIND = { stop: "작업을 마쳤어요", prompt: "새 작업을 시작했어요" };   // alerts.js의 KIND와 같은 말
  const STATE_WORD = { working: "일하는 중", done: "마쳤어요", "": "" };
  const EMPTY_ALERTS = "아직 알림이 없어요 — 프로젝트 폴더를 연결하면 AI 코딩 도구의 작업이 여기 쌓여요";
  const EMPTY_AI = "아직 한 일이 없어요 — 연결한 폴더에서 Claude Code가 일하면 한 줄씩 쌓여요";
  const NOTE = { none: "아직 준비 중이에요", example: "예시 데이터예요 · 시연용", live: "" };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ago = (t, now) => {
    if (!Number.isFinite(t)) return "";
    const s = Math.max(0, Math.round((now - t) / 1000));
    return s < 60 ? `${s}초 전` : s < 3600 ? `${Math.round(s / 60)}분 전` : s < 86400 ? `${Math.round(s / 3600)}시간 전` : `${Math.round(s / 86400)}일 전`;
  };
  const clock = (t) => (Number.isFinite(t) ? new Date(t).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }) : "");
  const toolName = (t) => TOOL[t] || "AI 코딩 도구";

  // ── 알림 — alerts.js add()가 만드는 {at, kind, tool, project, line, hidden, sim, done} 그대로 ──
  function alertLine(a, now) {
    return {
      when: ago(a.at, now), tool: `${toolName(a.tool)}${a.sim ? " · 연습 알림" : ""}`, what: KIND[a.kind] || "알림을 보냈어요",
      line: a.hidden ? "비밀값 모양이라 숨겼어요" : String(a.line || ""),
      done: Array.isArray(a.done) && a.done.length ? `끝냈다고 표시: ${a.done.join(", ")}` : "",
    };
  }
  function alertHTML(a, now) {
    const l = alertLine(a, now);
    return `<li class="al"><span class="when">${esc(l.when)}</span><span class="al-main"><b>${esc(l.tool)}</b> ${esc(l.what)}${
      l.line ? `<span class="al-line${a.hidden ? " hid" : ""}">${esc(l.line)}</span>` : ""}${l.done ? `<span class="al-done">✓ ${esc(l.done)}</span>` : ""}</span></li>`;
  }
  const alertsHTML = (list, now) => (Array.isArray(list) && list.length ? `<ol class="alist">${list.map((a) => alertHTML(a, now)).join("")}</ol>` : `<p class="empty">${esc(EMPTY_ALERTS)}</p>`);
  const latestAt = (list) => (Array.isArray(list) ? list.reduce((m, a) => (a && Number.isFinite(a.at) && a.at > m ? a.at : m), 0) : 0);
  const unread = (list, seenAt) => (Array.isArray(list) ? list.filter((a) => a && Number.isFinite(a.at) && a.at > (Number(seenAt) || 0)).length : 0);

  // ── 섬의 기록(KEY) 읽기 — 깨진 글이면 조용히 "없음"으로 ──
  function parse(text) { try { const s = JSON.parse(text || "null"); return s && typeof s === "object" ? s : null; } catch { return null; } }
  const readAlerts = (text) => { const s = parse(text); return s && Array.isArray(s.alerts) ? s.alerts : []; };
  function nowLine(text) {
    const s = parse(text);
    if (!s || !s.j || !Number.isFinite(s.j.stage)) return "아직 시작 전이에요";
    const proj = s.project ? ` · ${s.project}` : "";
    return s.finished ? `모든 단계를 마쳤어요${proj}` : `지금 ${s.j.stage}단계${proj}`;
  }

  // ── AI 진행 — 서버 답 {sessions:[{id, project, tool, state, at, steps:[{seq, at, verb, what, add, del}]}]}을 세션별로 합친다 ──
  const aiNote = (mode) => (Object.prototype.hasOwnProperty.call(NOTE, mode) ? NOTE[mode] : "");
  function mergeSteps(old, add, max = MAX_STEPS) {
    const by = new Map();
    for (const s of [...(old || []), ...(add || [])]) if (s && Number.isFinite(s.seq)) by.set(s.seq, s);
    return [...by.values()].sort((a, b) => a.seq - b.seq).slice(-max);
  }
  function mergeSessions(list, incoming) {
    const out = (list || []).map((s) => ({ ...s }));
    for (const inc of incoming || []) {
      if (!inc || !inc.id) continue;
      const cur = out.find((s) => s.id === inc.id);
      if (cur) Object.assign(cur, { project: inc.project, tool: inc.tool, state: inc.state, at: inc.at, steps: mergeSteps(cur.steps, inc.steps) });
      else out.push({ ...inc, steps: mergeSteps([], inc.steps) });
    }
    return out;
  }
  const anyWorking = (list) => (list || []).some((s) => s && s.state === "working");
  const exampleSessions = (Steps, now) => (Steps && typeof Steps.example === "function" ? [{ id: "example", ...Steps.example(now) }] : []);
  const stepLine = (Steps, s) => (Steps && typeof Steps.line === "function" ? Steps.line(s) : `${s.verb || ""} ${s.what || ""}`.trim());
  function aiHTML(sessions, mode, Steps, now) {
    if (mode === "none") return `<p class="empty">${esc(aiNote("none"))}</p>`;
    const note = aiNote(mode) ? `<p class="note" role="status">${esc(aiNote(mode))}</p>` : "";
    if (!sessions || !sessions.length) return `${note}<p class="empty">${esc(EMPTY_AI)}</p>`;
    const sess = [...sessions].sort((a, b) => (b.at || 0) - (a.at || 0)).map((s) => `<section class="sess"><h3><span class="proj">${esc(s.project || "프로젝트")}</span>${
      s.state && STATE_WORD[s.state] ? `<span class="st ${esc(s.state)}">${esc(STATE_WORD[s.state])}</span>` : ""}<span class="when">${esc(ago(s.at, now))}</span></h3>${
      s.steps && s.steps.length ? `<ol class="steps">${s.steps.map((st) => `<li><span class="when">${esc(clock(st.at))}</span><span class="line">${esc(stepLine(Steps, st))}</span></li>`).join("")}</ol>`
        : `<p class="empty">${esc(EMPTY_AI)}</p>`}</section>`).join("");
    return `${note}${sess}`;
  }

  const api = { KEY, SEEN_KEY, MAX_STEPS, POLL_MS, STATE_WORD, EMPTY_ALERTS, EMPTY_AI, esc, ago, toolName, alertLine, alertHTML, alertsHTML, latestAt, unread,
    readAlerts, nowLine, aiNote, mergeSteps, mergeSessions, anyWorking, exampleSessions, stepLine, aiHTML };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeHub = api;

  // ── 화면 — 모아 보기 창에서만(왼쪽 칸 [data-space]가 있는 페이지). 섬(navigator/app.js, C-13 기본 화면)은 이 파일을 순수 함수(window.FloeHub)로만 쓴다 —
  //    여기서 돌면 섬의 주소 끝(#ex= …)을 #vibe로 덮고 2초마다 묻는다(넘김 문서 10절 함정, hub.test.js가 이 경계를 본다) ──
  if (typeof document === "undefined" || !document.querySelector("[data-space]")) return;
  const SPACES = ["vibe", "alerts", "ai"];
  const live = location.protocol.startsWith("http");   // 서버로 열렸나(앱 · node server.js). 파일로 열면 예시(FR-10)
  const $ = (s) => document.querySelector(s);
  const spaceFromHash = () => { const h = location.hash.replace(/^#/, ""); return SPACES.includes(h) ? h : "vibe"; };
  const saved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const alerts = () => readAlerts(saved());
  let space = spaceFromHash(), sessions = [], mode = "none", latest = 0, seen = null;
  try { seen = Number(sessionStorage.getItem(SEEN_KEY)); } catch { seen = null; }
  if (!Number.isFinite(seen) || seen === 0) { seen = latestAt(alerts()); try { sessionStorage.setItem(SEEN_KEY, String(seen)); } catch {} }   // 이 창이 열린 뒤 새로 온 것만 센다
  function markSeen() { seen = Math.max(seen, latestAt(alerts())); try { sessionStorage.setItem(SEEN_KEY, String(seen)); } catch {} }

  function render() {
    const now = Date.now(), list = alerts();
    if (space === "alerts") markSeen();
    for (const b of document.querySelectorAll("[data-space]")) b.setAttribute("aria-selected", String(b.dataset.space === space));
    for (const p of document.querySelectorAll("[data-panel]")) p.hidden = p.dataset.panel !== space;
    const n = unread(list, seen), badge = $("#unread");
    if (badge) { badge.hidden = n === 0; badge.textContent = String(n); badge.setAttribute("aria-label", `읽지 않은 알림 ${n}개`); }
    const dot = $("#working"); if (dot) dot.hidden = !anyWorking(sessions);
    const nowEl = $("#now"); if (nowEl) nowEl.textContent = nowLine(saved());
    const al = $("#alerts-body"); if (al) al.innerHTML = alertsHTML(list, now);
    const ai = $("#ai-body"); if (ai) ai.innerHTML = aiHTML(sessions, mode, root.NavSteps, now);
    const side = $("#side-note"); if (side) side.textContent = mode === "example" ? aiNote("example") : "";
  }
  function show(id) {
    space = SPACES.includes(id) ? id : "vibe";
    if (location.hash !== `#${space}`) history.replaceState(null, "", `#${space}`);   // 시험 · 녹화가 주소 끝으로 바로 연다
    render();
    if (space === "ai") poll().then(render);   // AI 진행을 열면 바로 한 번 묻는다 — 2초를 기다리지 않게
  }
  // 바이브 코딩 '들어가기' — 앱이면 섬 창을 앞으로 보내고 '이번 단계'로(main.js floe:enter), 브라우저면 내비게이터로. 서재는 어디서나 이 창에서 서고를 연다
  const enter = () => { if (root.floeApp && root.floeApp.enter) root.floeApp.enter(); else location.href = "../navigator/index.html#tab=today"; };
  const ACT = { enter, library: () => { location.href = "../library/index.html#lib"; } };
  document.addEventListener("click", (e) => {
    const sp = e.target.closest("[data-space]"); if (sp) return show(sp.dataset.space);
    const b = e.target.closest("[data-act]"); if (b && ACT[b.dataset.act]) ACT[b.dataset.act]();
  });
  addEventListener("hashchange", () => show(spaceFromHash()));
  addEventListener("storage", (e) => { if (!e.key || e.key === KEY) render(); });   // 섬이 기록을 바꾸면 바로

  // AI 진행 — NavSteps가 있어야 한다(다른 에이전트의 steps.js, merge 전에는 자리표시 null). 서버로 열렸으면 2초마다 묻고, 거절하거나 파일이면 예시
  async function poll() {
    const S = root.NavSteps;
    if (!S) { mode = "none"; return; }
    if (!live) { mode = "example"; sessions = exampleSessions(S, Date.now()); return; }
    try {
      const r = await fetch(`${location.origin}/api/steps?since=${latest}`, { credentials: "same-origin" });
      const j = await r.json();
      if (!j || !j.ok) throw new Error(j && j.reason ? j.reason : "refused");
      mode = "live"; latest = Number(j.latest) || latest; sessions = mergeSessions(sessions, j.sessions);
    } catch { if (mode !== "live") { mode = "example"; sessions = exampleSessions(S, Date.now()); } }   // 한 번 살아 있던 서버가 잠깐 끊기면 있는 줄은 그대로
  }
  const seal = $("#seal"); if (seal && root.NavSeal) seal.innerHTML = root.NavSeal.svg("idle", 64);
  const sky = $("#sky");
  if (sky) { let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    sky.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${rnd() * 100}%;top:${rnd() * 100}%;opacity:${(rnd() * .6 + .15).toFixed(2)};transform:scale(${(rnd() * 1.2 + .3).toFixed(2)})"></i>`).join(""); }
  show(space);
  poll().then(render);
  if (live) setInterval(() => poll().then(render), POLL_MS);
})(typeof window !== "undefined" ? window : globalThis);
