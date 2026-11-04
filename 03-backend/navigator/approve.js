// claude-drafted: 2026-10-20 — FR-17 섬에서 허용 · 거절(C-4, 이재엽 버튼 "섬에서 진짜 승인"). 넘김 문서 fable-handoff-2026-10-20-c4-views.md 2절 ② · 3절.
// Claude Code가 파일을 고치거나 명령을 쓰기 전에 허락을 구하면(PermissionRequest 훅) 섬에 띄울 **승인 카드**를 만드는 순수 규칙 — 훅(approve-hook.js) · 서버(server.js) · 섬(app.js)이 같이 쓴다.
//   card(ev)  — 무엇을(도구의 말 · 파일이나 명령) · 바뀔 내용(가려서 · 줄 수 제한) · 되돌리기 어려운 일이면 까닭(danger)
//   sig(ev)   — 요청의 지문(세션 · 도구 · 입력). 결정은 이 지문이 맞을 때만 쓴다 — 늦은 결정 · 다른 요청의 결정은 버린다(요구서 C-4 ③, 장부 W-25 · W-26)
//   decisionOutput(d) — 훅이 Claude Code에 돌려줄 글. allow · deny만 JSON이고 그 밖은 빈 글 — 허용은 서버가 답할 때만(자동 허용 F-149도 서버가 정한다)
//   EXAMPLE  — 서버 없이(FR-10) 보일 카드 둘
// 바뀔 내용은 승인 카드에서만 보이고 저장 · 전송하지 않는다(서버는 메모리에만, 결정하면 지운다). AI 진행(C-12)의 '이름 · 첫 줄 · 줄 수만'은 그대로다 — 두 길을 섞지 않는다.
// 훅의 모양은 Claude Code 문서(code.claude.com/docs/en/hooks, 2026-10-20 확인)대로: 결정은 hookSpecificOutput.decision.behavior allow|deny, 결정 없이 끝나면 보통 흐름(허용되지 않음).
(function (root) {
  const isNode = typeof module !== "undefined" && module.exports;
  const Sensitive = isNode ? require("./sensitive.js") : root.NavSensitive;
  const Steps = isNode ? require("./steps.js") : root.NavSteps;
  const MAX_LINES = 12;     // 바뀔 내용 — 뺀 줄 · 넣을 줄 각각 [제안]
  const MAX_CHARS = 200;    // 한 줄 [제안]
  // 되돌리기 어려운 일 — 삭제 · 강제 푸시 · 키 노출(요구서 FR-17). 명령 · 파일 이름 · 글에서 찾는다. 쉬운 말 까닭만 보인다
  const DANGER_CMD = [
    // F-144-2(2026-11-03): rm의 긴 옵션(--recursive · --force), Windows rd /s · del … /s, 강제 푸시의 +refspec · --mirror, 원격 지우기(--delete · -d · :이름)도
    [/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*)\b|\brm\b[^\n]*\s--(recursive|force)\b|\brmdir\b|\brd\b[^\n;&|]*\s\/s\b|\bdel\b[^\n]*\s\/[sq]\b|\bRemove-Item\b.*-Recurse/i, "지우는 명령이에요 — 되돌리기 어려워요"],
    //   새 맥락 리뷰: rd의 /s는 어느 자리든, 짧은 옵션 묶음(-fu · -df), 따옴표 안의 "+main" · ":이름"도. push 뒤는 그 명령 안에서만 본다(&& 뒤의 ls -d를 원격 지우기로 보지 않게)
    [/\bgit\s+push\b[^\n;&|]*(\s--force\b|\s-[a-zA-Z]*f[a-zA-Z]*\b|\s--force-with-lease\b|\s--mirror\b|\s["']?\+\S)/i, "강제로 올리는 명령이에요 — 다른 사람의 것이 사라질 수 있어요"],
    [/\bgit\s+push\b[^\n;&|]*(\s--delete\b|\s-[a-zA-Z]*d[a-zA-Z]*\b|\s["']?:\S)/i, "원격의 브랜치를 지우는 명령이에요 — 되돌리기 어려워요"],
    [/\bgit\s+(reset\s+--hard|clean\s+-[a-zA-Z]*f|branch\s+-D|checkout\s+--\s|restore\s)/i, "되돌릴 수 없게 바꾸는 git 명령이에요"],
    [/\b(drop\s+(table|database|schema)|truncate\s+table|delete\s+from)\b/i, "표를 지우는 명령이에요"],
  ];
  const DANGER_FILE = /(^|[\\/])(\.env(\.[^\\/]*)?|[^\\/]*\.(pem|key|p12|pfx)|id_(rsa|ed25519|ecdsa)(\.pub)?|[^\\/]*credentials[^\\/]*)$/i;
  const DANGER_FILE_WHY = "비밀값 파일이에요 — 밖으로 새면 되돌릴 수 없어요";
  // F-149: 자동 허용은 이 판정을 믿는다 — 허락 훅이 걸린 설정 · git 훅을 고쳐 장치를 스스로 끄지 못하게
  const GUARD_FILE = /(^|[\\/])(\.claude[\\/]settings(\.local)?\.json|\.git[\\/]hooks[\\/][^\\/]+)$/i;
  const GUARD_CMD = /\.claude[\\/]settings(\.local)?\.json|\.git[\\/]hooks[\\/]/i;
  const GUARD_WHY = "허락을 묻는 장치의 설정이에요 — 바뀌면 다음부터 묻지 않을 수 있어요";
  const SECRET_WHY = "비밀값 모양이 들어 있어요 — 밖으로 새면 되돌릴 수 없어요";
  const VERBS = { Edit: "edit", MultiEdit: "edit", Write: "write", NotebookEdit: "edit", Bash: "run" };

  const str = (v) => (typeof v === "string" ? v : "");
  const cutLine = (t) => (t.length > MAX_CHARS ? `${t.slice(0, MAX_CHARS - 1)}…` : t);
  const redact = (t) => (Sensitive && typeof Sensitive.redact === "function" ? Sensitive.redact(t) : t);
  const blocked = (t) => !!(t && Sensitive && typeof Sensitive.scan === "function" && Sensitive.scan(t).blocked);
  const splitLines = (t) => str(t).replace(/\r\n?/g, "\n").split("\n");
  // 글을 줄로 — 앞 MAX_LINES줄만, 넘치면 "… N줄 더 있어요". 줄마다 가리고 자른다
  function lines(text, mark = "") {
    const all = splitLines(text);
    if (all.length === 1 && !all[0]) return [];
    const out = all.slice(0, MAX_LINES).map((l) => `${mark}${cutLine(redact(l))}`);
    if (all.length > MAX_LINES) out.push(`… ${all.length - MAX_LINES}줄 더 있어요`);
    return out;
  }
  const whyOf = (tool_name, input) => {
    const file = str(input.file_path || input.notebook_path);
    if (file && VERBS[tool_name] && VERBS[tool_name] !== "run") {
      if (DANGER_FILE.test(file)) return DANGER_FILE_WHY;
      if (GUARD_FILE.test(file)) return GUARD_WHY;
    }
    if (tool_name === "Bash") { const cmd = str(input.command); for (const [re, why] of DANGER_CMD) if (re.test(cmd)) return why; if (GUARD_CMD.test(cmd)) return GUARD_WHY; if (blocked(cmd)) return SECRET_WHY; }
    if (VERBS[tool_name] === "edit" || VERBS[tool_name] === "write") {
      const texts = [input.new_string, input.content, input.new_source, ...(Array.isArray(input.edits) ? input.edits.map((e) => e && e.new_string) : [])];
      if (texts.some((t) => blocked(str(t)))) return SECRET_WHY;
    }
    return "";
  };

  // 훅 입력 {session_id, cwd, tool_name, tool_input} → 승인 카드 {tool_name, verb, what, kind, lines, danger}
  function card(ev) {
    const name = ev && typeof ev.tool_name === "string" ? ev.tool_name : "";
    const input = ev && ev.tool_input && typeof ev.tool_input === "object" ? ev.tool_input : {};
    const kind = VERBS[name] || "other";
    const step = Steps && typeof Steps.fromHook === "function" ? Steps.fromHook({ hook_event_name: "PostToolUse", tool_name: name, tool_input: input, cwd: ev && ev.cwd }) : { verb: "했어요", what: "" };
    let out = [];
    if (name === "Edit") out = [...lines(input.old_string, "− "), ...lines(input.new_string, "+ ")];
    else if (name === "MultiEdit") { for (const e of Array.isArray(input.edits) ? input.edits.slice(0, 3) : []) if (e && typeof e === "object") out.push(...lines(e.old_string, "− "), ...lines(e.new_string, "+ ")); }
    else if (name === "Write") out = lines(input.content, "+ ");
    else if (name === "NotebookEdit") out = lines(input.new_source, "+ ");
    else if (name === "Bash") out = lines(input.command);
    const what = kind === "other" ? name : cutLine(redact(str(step.what) || name));
    return { tool_name: name, verb: str(step.verb) || "했어요", what, kind, lines: out, danger: whyOf(name, input) };
  }

  // 요청의 지문 — 세션 · 도구 · 입력이 같을 때만 같다(sha256, 64자). Node에서만(훅 · 서버)
  function sig(ev) {
    if (!isNode) return "";
    const crypto = require("node:crypto");
    const e = ev && typeof ev === "object" ? ev : {};
    return crypto.createHash("sha256").update(`${str(e.session_id)}\n${str(e.tool_name)}\n${JSON.stringify(e.tool_input === undefined ? null : e.tool_input)}`).digest("hex");
  }
  // 훅이 Claude Code에 돌려줄 글 — allow · deny만. 그 밖은 빈 글(보통 흐름으로 — 대신 허용하지 않는다)
  function decisionOutput(d) {
    if (d === "allow") return JSON.stringify({ hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "allow" } } });
    if (d === "deny") return JSON.stringify({ hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "deny", message: "Floe 섬에서 거절했어요 — 다른 방법을 찾거나 사람에게 물어보세요" } } });
    return "";
  }

  // 서버 없이(FR-10) 보일 승인 카드 둘 — 보통 일 하나(파일 고치기), 되돌리기 어려운 일 하나(강제 푸시). 가짜 지문
  const EXAMPLE = [
    { id: "example-edit-1", sig: "e".repeat(64), at: 0, project: "예시-프로젝트", tool: "claude", tool_name: "Edit",
      card: { tool_name: "Edit", verb: "고쳤어요", what: "src/signup.js", kind: "edit", lines: ["− const limit = 10;", "+ const limit = 30;", "+ // 신청 인원 상한 — 행사 목록 화면에서 읽는다"], danger: "" } },
    { id: "example-run-2", sig: "f".repeat(64), at: 0, project: "예시-프로젝트", tool: "claude", tool_name: "Bash",
      card: { tool_name: "Bash", verb: "실행했어요", what: "git push --force origin main", kind: "run", lines: ["git push --force origin main"], danger: "강제로 올리는 명령이에요 — 다른 사람의 것이 사라질 수 있어요" } },
  ];

  const api = { MAX_LINES, MAX_CHARS, card, sig, decisionOutput, EXAMPLE };
  if (isNode) module.exports = api;
  else root.NavApprove = api;
})(typeof window !== "undefined" ? window : globalThis);
