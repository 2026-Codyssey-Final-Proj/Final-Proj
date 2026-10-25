// claude-drafted: 2026-10-25 — C-38 시험판(두승현 "이 브랜치에서 시험용으로 만들자"). 결정 자료: 01-docs/00-overview/기록/C-38-다른-AI-도구로-넘기기-2026-10-25.md
// 원격 MCP(Streamable HTTP, JSON 답만 — SSE 없음)의 순수 규칙. 서버(server.js)가 /mcp/<토큰>에서 부르고, 시험(04-tests/navigator/mcp.test.js)이 본다.
// 웹 GPT · 웹 Claude가 Floe의 지금 상태를 읽고(floe_now · floe_style), 퀘스트가 없으면 시작을(floe_start), 있으면 할 일 하나에 적을 한 줄을 **제안**한다(floe_report).
// 제안은 섬에서 사람이 "맞아요"를 눌러야 퀘스트가 시작되거나 적히고, 판정은 그 뒤 Floe의 코드가 한다(ADR-0003) — 웹 AI가 통과를 정하지 않는다.
// **일 넘기기 · 단계 문서 쓰기 · 허용 · 거절은 여기에 없다** — 밖에서 이 컴퓨터의 Claude Code를 움직이는 길을 만들지 않는다.
// ponytail: 초기화 · 도구 목록 · 도구 부르기 · ping만 직접 짰다(SDK 없음). 자원(resources) · 프롬프트 · SSE가 필요해지면 @modelcontextprotocol/sdk로.
(function (root) {
  const Sensitive = typeof require === "function" ? require("./sensitive.js") : root.NavSensitive;
  const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];   // 맨 앞이 우리가 아는 최신
  const LINE_MAX = 200, START_MAX = 1000, NAME_MAX = 120, OBJS_MAX = 12, LINES_MAX = 5;
  const INSTRUCTIONS = [
    "Floe(마스코트 플로로)는 이 사용자의 바이브 코딩 길잡이입니다. 프로그램을 만드는 길을 8단계 퀘스트로 나눠 지금 할 일 하나를 알려 줍니다.",
    "1) 대화를 시작할 때와 사용자가 '다음에 뭐 해?'라고 할 때 먼저 floe_now를 불러 지금 단계와 지금 할 일을 확인하세요. 아직 퀘스트가 없으면 사용자와 만들고 싶은 것을 정해 floe_start로 시작을 제안하세요.",
    "2) floe_style의 말투(초등학교 5~6학년이 알아듣는 말)를 따르세요.",
    "3) 지금 할 일 하나를 사용자와 함께 정하면, 그 한 줄을 floe_report로 제안하세요. 사용자가 Floe 섬에서 '맞아요'를 눌러야 적히고, 단계를 넘는 판정은 Floe가 합니다 — 대신 정하지 마세요.",
  ].join("\n");
  const STYLE = [
    "말투 — 초등학교 5~6학년이 알아듣는 말로, 한 번에 두세 문장.",
    "전문 용어는 쓰지 않거나, 쓰면 그 자리에서 한 줄로 풉니다.",
    "답을 대신 정하지 말고 사용자가 고르게 물어봅니다 — 사용자의 말로 적게 돕습니다.",
    "지금 할 일 하나만 다룹니다. 다음 할 일은 floe_now가 알려 줍니다.",
    "코드를 만들거나 고치는 일은 이 대화에서 해도 되지만, 그 단계의 할 일을 채웠는지는 floe_report → 사용자 확인 → Floe 판정으로만 정해집니다.",
  ].join("\n");
  const TOOLS = [
    { name: "floe_now", description: "Floe의 지금 상태 — 화면 단계 번호와 이름, 지금 퀘스트, 할 일마다 채웠는지(✓/○)와 적은 줄, 지금 할 일과 플로로의 질문. 대화를 시작할 때 먼저 부르세요.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false } },
    { name: "floe_style", description: "Floe와 같이 일할 때의 말투(쉬운 말 규칙)와 일하는 순서.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false } },
    { name: "floe_start", description: "아직 퀘스트가 없을 때, 사용자가 만들고 싶은 것을 적은 글로 Floe 퀘스트 시작을 제안합니다. Floe 섬에 확인 카드가 뜨고, 사용자가 '맞아요'를 누르면 Floe가 그 글로 1단계 퀘스트를 만듭니다.",
      inputSchema: { type: "object", properties: { text: { type: "string", maxLength: START_MAX, description: "사용자가 만들고 싶은 것 — 사용자의 말로" } }, required: ["text"], additionalProperties: false } },
    { name: "floe_report", description: "지금 퀘스트의 할 일 하나에 적을 한 줄을 제안합니다. Floe 섬에 확인 카드가 뜨고, 사용자가 '맞아요'를 누르면 적힙니다. 사용자와 정한 사용자의 말로 적으세요.",
      inputSchema: { type: "object", properties: { todo: { type: "integer", minimum: 1, description: "할 일 번호(floe_now의 1부터)" }, text: { type: "string", maxLength: LINE_MAX, description: "그 할 일에 적을 한 줄" } }, required: ["todo", "text"], additionalProperties: false } },
  ];
  const str = (v, n) => { const s = Sensitive.redact(String(v == null ? "" : v)).trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
  const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

  // 화면이 보낸 상태를 믿지 않는다 — 칸마다 모양을 보고, 가리고(비밀값 · 연락처), 자른다. 모양이 아니면 null
  function cleanState(s) {
    if (!s || typeof s !== "object") return null;
    const out = { project: str(s.project, 60), mode: s.mode === "live" ? "live" : "fixture", stage: okInt(s.stage, 0, 7) ? s.stage : null, quest: null, at: Date.now() };
    const q = s.quest;
    if (q == null) return out;
    if (typeof q !== "object" || !Array.isArray(q.objs) || !Array.isArray(q.lines) || !okInt(q.chap, 0, 7)) return null;
    const objs = q.objs.slice(0, OBJS_MAX).map((o) => ({ name: str(o && o.name, NAME_MAX), need: okInt(o && o.need, 1, LINES_MAX) ? o.need : 1 }));
    const lines = objs.map((_, i) => (Array.isArray(q.lines[i]) ? q.lines[i].slice(0, LINES_MAX).map((l) => str(l, LINE_MAX)).filter(Boolean) : []));
    out.quest = { chap: q.chap, title: str(q.title, NAME_MAX), phase: q.phase === "quest" ? "quest" : q.phase === "draft" ? "draft" : "other", objs, lines,
      cur: okInt(q.cur, 0, objs.length - 1) ? q.cur : -1, ask: str(q.ask, LINE_MAX) };
    return out;
  }

  const text = (t, isError) => ({ content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) });
  function nowText(s) {
    if (!s) return text("Floe 앱이 열려 있지 않아요. 사용자에게 Floe를 켜 달라고 안내하세요.");
    if (!s.quest && s.stage == null) return text(`Floe — 아직 퀘스트가 없어요${s.project ? ` (작업 폴더 ${s.project})` : ""}. 사용자와 만들고 싶은 것을 정해 floe_start(text="…")로 시작을 제안하세요 — 사용자가 Floe 섬에서 '맞아요'를 누르면 시작돼요.`);
    if (!s.quest) return text("Floe — 지금 받은 퀘스트가 없어요. 사용자에게 Floe 섬(퀘스트 창)에서 다음 퀘스트를 받아 달라고 안내하세요.");
    const q = s.quest;
    const head = `Floe — 지금 상태: 화면 ${q.chap + 1}단계 · ${q.title}${s.project ? ` (작업 폴더 ${s.project})` : ""}`;
    if (q.phase === "draft") return text(`${head}\n퀘스트를 아직 받지 않았어요. 사용자에게 Floe 섬(퀘스트 창)에서 '퀘스트 받기'를 눌러 달라고 안내하세요.`);
    const rows = q.objs.map((o, i) => { const ls = q.lines[i] || [], done = ls.length >= o.need; return ` ${i + 1}. ${done ? "✓" : "○"} ${o.name}${ls.length ? ` — ${ls.map((l) => `"${l}"`).join(" · ")}` : ""}`; });
    const cur = q.cur >= 0 ? `\n지금 할 일: ${q.cur + 1}번 — ${q.objs[q.cur].name}${q.ask ? `\n플로로의 질문: ${q.ask}` : ""}\n사용자와 이 한 줄을 정하면 floe_report(todo=${q.cur + 1}, text="…")로 제안하세요.`
      : "\n할 일을 다 채웠어요. 사용자에게 Floe 섬에서 '완료 보고'를 눌러 달라고 안내하세요 — 판정은 Floe가 합니다.";
    return text(`${head}\n할 일:\n${rows.join("\n")}${cur}`);
  }
  function start(args, ctx) {
    const s = ctx.state();
    if (!s) return text("Floe 앱이 열려 있지 않아요. 사용자에게 Floe를 켜 달라고 안내하세요.", true);
    if (s.quest || s.stage != null) return text("이미 퀘스트가 있어요 — floe_now로 지금 할 일을 확인하세요.", true);
    const t = str(args && args.text, START_MAX);
    if (!t) return text("text가 비어 있어요 — 사용자가 만들고 싶은 것을 넣으세요.", true);
    ctx.propose({ kind: "start", text: t });
    return text("Floe 섬에 확인 카드를 띄웠어요. 사용자가 '맞아요'를 누르면 Floe가 이 글로 1단계 퀘스트를 만들어요. 그다음 floe_now로 할 일을 확인하세요.");
  }
  function report(args, ctx) {
    const s = ctx.state(), q = s && s.quest;
    if (!q || q.phase !== "quest") return text("지금 받은 퀘스트가 없어 적을 곳이 없어요. floe_now로 상태를 먼저 확인하세요.", true);
    const a = args && typeof args === "object" ? args : {};
    if (!okInt(a.todo, 1, q.objs.length)) return text(`todo는 1부터 ${q.objs.length}까지의 할 일 번호예요.`, true);
    const t = str(a.text, LINE_MAX);
    if (!t) return text("text가 비어 있어요 — 그 할 일에 적을 한 줄을 넣으세요.", true);
    const i = a.todo - 1;
    ctx.propose({ chap: q.chap, todo: i, name: q.objs[i].name, text: t });
    return text(`플로로 섬에 확인 카드를 띄웠어요(${a.todo}번 ${q.objs[i].name}). 사용자가 '맞아요'를 누르면 적히고, 그다음 판정은 Floe가 합니다. 사용자에게 섬을 확인해 달라고 말해 주세요.`);
  }

  // JSON-RPC 한 통 → 답 한 통(알림이면 null). ctx: { state() → cleanState 결과 | null, propose(제안) }
  function rpc(msg, ctx) {
    if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return { jsonrpc: "2.0", id: msg && msg.id != null ? msg.id : null, error: { code: -32600, message: "JSON-RPC 요청 모양이 아님" } };
    if (msg.id == null) return null;   // 알림(notifications/initialized 등) — 답하지 않는다
    const ok = (result) => ({ jsonrpc: "2.0", id: msg.id, result });
    const p = msg.params && typeof msg.params === "object" ? msg.params : {};
    if (msg.method === "initialize") return ok({ protocolVersion: VERSIONS.includes(p.protocolVersion) ? p.protocolVersion : VERSIONS[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: "floe", version: "0.1.0-test" }, instructions: INSTRUCTIONS });
    if (msg.method === "ping") return ok({});
    if (msg.method === "tools/list") return ok({ tools: TOOLS });
    if (msg.method === "tools/call") {
      if (p.name === "floe_now") return ok(nowText(ctx.state()));
      if (p.name === "floe_style") return ok(text(`${STYLE}\n\n일하는 순서:\n${INSTRUCTIONS}`));
      if (p.name === "floe_start") return ok(start(p.arguments, ctx));
      if (p.name === "floe_report") return ok(report(p.arguments, ctx));
      return { jsonrpc: "2.0", id: msg.id, error: { code: -32602, message: `모르는 도구: ${String(p.name).slice(0, 40)}` } };
    }
    return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `없는 방법: ${msg.method.slice(0, 40)}` } };
  }

  const api = { rpc, cleanState, VERSIONS, LINE_MAX, TOOLS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeMcp = api;
})(typeof window !== "undefined" ? window : globalThis);
