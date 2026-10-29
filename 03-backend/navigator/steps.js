// claude-drafted: 2026-10-20 — 이재엽 요청(C-12 AI 진행 — Claude Code가 하는 일 보기). 이재엽: "이건 바이브 코딩이 아니야" — 단계 · 판정 · 토큰과 섞지 않는 지켜보기 전용.
// Claude Code의 PostToolUse 훅 입력을 "무엇을 했나" 한 줄로 줄이는 순수 함수. 훅(hook.js)과 화면(섬의 AI 진행 판)이 같이 쓴다 — 브라우저 · Node 둘 다.
// 넘기는 것은 이름 · 첫 줄 · 줄 수뿐이다. 파일 내용(content) · 고친 글(old_string · new_string) · 도구 결과(tool_response)는 어떤 칸에도 넣지 않는다.
(function (root) {
  // 훅의 도구 이름 → 화면의 말. 표에 없는 도구는 OTHER
  const VERBS = { Read: "읽었어요", Edit: "고쳤어요", MultiEdit: "고쳤어요", Write: "만들었어요", Bash: "실행했어요", Grep: "찾았어요", Glob: "찾았어요" };
  const OTHER = "했어요";
  const MAX = 80;   // 한 줄 최대 글자 수 [제안 2026-10-20]

  const str = (v) => (typeof v === "string" ? v : "");
  const cut = (t) => (t.length > MAX ? `${t.slice(0, MAX - 1)}…` : t);
  // 글의 줄 수 — 빈 글은 0, 끝의 줄바꿈 하나는 줄로 세지 않는다
  const lines = (v) => { const t = str(v); return t ? t.replace(/\r?\n$/, "").split(/\r?\n/).length : 0; };
  const slashes = (p) => str(p).replace(/\\/g, "/");
  // 경로 — 작업 폴더(cwd) 안이면 그 아래 상대 경로, 밖이면 파일 이름만(폴더 구조를 넘기지 않는다). 상대 경로는 그대로
  function where(file, cwd) {
    const f = slashes(file), c = slashes(cwd).replace(/\/+$/, "");
    if (!f) return "";
    if (c && f.startsWith(`${c}/`)) return f.slice(c.length + 1);
    if (/^([A-Za-z]:)?\//.test(f)) return f.split("/").filter(Boolean).pop() || "";
    return f;
  }

  // 바뀐 파일의 경로(작업실 개편 C-63 — 단계마다 만든 · 고친 파일, 2026-10-29): 파일을 쓰는 도구만, 세션 폴더(cwd) 안이면 그 아래 상대 경로(자르지 않는다),
  //   밖이면 ""(작업 폴더 파일로 오해하지 않게 — 자동 메모리 · /tmp 같은 곳을 쓴다). 상대 경로는 그대로. 파일 내용은 넣지 않는다
  const CHANGE_KEY = { Write: "file_path", Edit: "file_path", MultiEdit: "file_path", NotebookEdit: "notebook_path" };
  function fileOf(ev) {
    const key = ev && CHANGE_KEY[ev.tool_name]; if (!key) return "";
    const input = ev.tool_input && typeof ev.tool_input === "object" ? ev.tool_input : {};
    const f = slashes(input[key]), c = slashes(ev.cwd).replace(/\/+$/, "");
    if (!f) return "";
    if (c && f.startsWith(`${c}/`)) return f.slice(c.length + 1);
    return /^([A-Za-z]:)?\//.test(f) ? "" : f;
  }

  // 훅 입력 {hook_event_name:"PostToolUse", tool_name, tool_input, tool_response, cwd, session_id} → {verb, what, add, del}
  function fromHook(ev) {
    const name = ev && typeof ev.tool_name === "string" ? ev.tool_name : "";
    const input = ev && ev.tool_input && typeof ev.tool_input === "object" ? ev.tool_input : {};
    const cwd = ev && ev.cwd;
    const verb = VERBS[name] || OTHER;
    let what = "", add = 0, del = 0;
    if (name === "Read") what = where(input.file_path, cwd);
    else if (name === "Edit") { what = where(input.file_path, cwd); add = lines(input.new_string); del = lines(input.old_string); }
    else if (name === "MultiEdit") {
      what = where(input.file_path, cwd);
      for (const e of Array.isArray(input.edits) ? input.edits : []) { if (e && typeof e === "object") { add += lines(e.new_string); del += lines(e.old_string); } }
    } else if (name === "Write") { what = where(input.file_path, cwd); add = lines(input.content); }
    else if (name === "Bash") what = str(input.command).split(/\r?\n/)[0].trim();
    else if (name === "Grep" || name === "Glob") what = str(input.pattern).split(/\r?\n/)[0].trim();
    return { verb, what: cut(what), add, del };
  }

  // 화면 한 줄 — "고쳤어요 · src/app.js (+3 −1)". what이 비면 도구 이름(tool_name). 80자를 넘으면 …
  function line(step) {
    if (!step || typeof step !== "object") return "";
    const what = str(step.what) || str(step.tool_name);
    const n = [];
    if (step.add > 0) n.push(`+${step.add}`);
    if (step.del > 0) n.push(`−${step.del}`);
    return cut(`${str(step.verb) || OTHER}${what ? ` · ${what}` : ""}${n.length ? ` (${n.join(" ")})` : ""}`);
  }

  // 서버 없이(FR-10) 보일 예시 세션. at은 상대 ms(음수 = 그만큼 전). "예시 데이터예요"는 화면이 붙인다
  const EXAMPLE = {
    id: "example", project: "예시-프로젝트", tool: "claude", state: "done", at: -20_000,
    steps: [
      { seq: 1, at: -95_000, verb: "읽었어요", what: "README.md", add: 0, del: 0 },
      { seq: 2, at: -88_000, verb: "찾았어요", what: "행사 신청", add: 0, del: 0 },
      { seq: 3, at: -80_000, verb: "읽었어요", what: "src/signup.js", add: 0, del: 0 },
      { seq: 4, at: -61_000, verb: "고쳤어요", what: "src/signup.js", add: 12, del: 3 },
      { seq: 5, at: -47_000, verb: "만들었어요", what: "src/signup.test.js", add: 30, del: 0 },
      { seq: 6, at: -33_000, verb: "실행했어요", what: "npm test", add: 0, del: 0 },
      { seq: 7, at: -24_000, verb: "고쳤어요", what: "README.md", add: 2, del: 0 },
    ],
  };
  // 예시의 상대 시각을 now 기준 절대 시각으로 바꾼 새 객체(원본은 그대로)
  function example(now = Date.now()) {
    return { ...EXAMPLE, at: now + EXAMPLE.at, steps: EXAMPLE.steps.map((s) => ({ ...s, at: now + s.at })) };
  }

  const api = { VERBS, OTHER, MAX, fromHook, fileOf, line, EXAMPLE, example };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavSteps = api;
})(typeof window !== "undefined" ? window : globalThis);
