// claude-drafted: 2026-10-20 — 이재엽 요청(C-11 모아 보기 창 — 바이브 코딩 고르기 · 알림, C-12 AI 진행의 화면 쪽). 넘김 문서 4 · 5절 [제안]대로.
// claude-drafted: 2026-10-23 — 이재엽 "브라우저 나오는건 기능자체를 빼줘": 따로 뜨던 모아 보기 창(index.html · hub.css · 이 파일의 화면 코드)을 뺐다.
// 남은 것은 섬(navigator/app.js)의 알림 · AI 진행 판이 쓰는 순수 함수뿐이다 — 알림 줄 · 읽지 않은 수 · AI 진행 세션 합치기 · 그 HTML.
//   AI 진행은 C-12 규칙 그대로 — 판정 · 단계 · 토큰을 부르지도 보이지도 않는다(이재엽 "이건 바이브 코딩이 아니야"). 묻는 일(GET /api/steps)은 app.js가 한다.
// window.FloeHub로도, Node에서는 require로도 열린다(alerts.js와 같은 방식 — 04-tests/navigator/hub.test.js).
(function (root) {
  const MAX_STEPS = 50;
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

  const api = { MAX_STEPS, STATE_WORD, EMPTY_ALERTS, EMPTY_AI, esc, ago, toolName, alertLine, alertHTML, alertsHTML, latestAt, unread,
    aiNote, mergeSteps, mergeSessions, anyWorking, exampleSessions, stepLine, aiHTML };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeHub = api;
})(typeof window !== "undefined" ? window : globalThis);
