// claude-drafted: 2026-10-17
// 공급자 — **외부 AI 호출은 이 파일 한 곳에서만 한다**(implementations.md 6, navigator.test.js가 확인).
//
// 팀원 각자 자기 것으로 쓴다 — 키나 로그인은 저장소에 없고, 각자 컴퓨터의 환경에만 있다.
//   ANTHROPIC_API_KEY 있음 → 그 사람의 API 키로 호출 (한도·사용량도 그 사람 것)
//   없음                    → 그 사람 컴퓨터에 로그인된 Claude Code(`claude -p`)로 호출
//   둘 다 없음              → 화면이 '연습용 예시'로 움직인다
//
// 키는 이 파일 밖으로 나가지 않는다: 로그·오류·/api/usage 어디에도 값을 싣지 않는다.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const TIMEOUT_MS = 90_000;
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
const DEFAULTS = { model: "claude-opus-5-5", maxTokens: 2048, effort: "low" };

const positive = (v, fallback) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : fallback; };
const settings = (env) => ({
  model: env.NAV_MODEL || DEFAULTS.model,
  maxTokens: positive(env.NAV_MAX_TOKENS, DEFAULTS.maxTokens),
  effort: env.NAV_EFFORT || DEFAULTS.effort,
  fallback: env.NAV_FALLBACK !== "off",
  budget: positive(env.NAV_TOKEN_BUDGET, null),
});
const providerOf = (env) => (env.ANTHROPIC_API_KEY ? "api" : "cli");

// ── 사용량 — 이 사람의 키로 쓴 토큰 수. 서버를 다시 켜도 이어지게 파일에 숫자만 남긴다 ──
const fileStore = (file) => ({
  load() { try { const n = JSON.parse(fs.readFileSync(file, "utf8")).used; return Number.isFinite(n) && n >= 0 ? n : 0; } catch { return 0; } },
  save(n) { try { fs.writeFileSync(file, JSON.stringify({ used: n }), { mode: 0o600 }); } catch { /* 못 써도 호출은 계속 */ } },
});
function createMeter(budget, store) {
  let used = store.load();
  return {
    get used() { return used; },
    budget,
    state() { return !budget ? "ok" : used >= budget ? "full" : used >= budget * 0.8 ? "warn" : "ok"; },
    add(n) { used += n; store.save(used); },
  };
}

// ── API 호출 ──
const apiError = (e) => {
  const s = e && e.status;
  if (s === 401 || s === 403) return "API 키가 맞지 않거나 권한이 없어요 — ANTHROPIC_API_KEY를 확인하세요";
  if (s === 429) return "잠시 너무 많이 불렀어요 — 조금 뒤에 다시 눌러 주세요";
  return "AI에 연결하지 못했어요";   // e.message는 싣지 않는다 — 요청 내용이 섞일 수 있다
};

async function callApi(client, cfg, prompt, schema) {
  const body = {
    model: cfg.model,
    max_tokens: cfg.maxTokens,
    output_config: { effort: cfg.effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  };
  let res;
  try {
    res = cfg.fallback
      ? await client.beta.messages.create({ ...body, betas: [FALLBACK_BETA], fallbacks: "default" })
      : await client.messages.create(body);
  } catch (e) { return { error: apiError(e) }; }
  const u = res.usage || {};
  const tokens = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
  if (res.stop_reason === "refusal") return { error: "Claude가 이 글에는 답하지 않았어요", tokens };
  if (res.stop_reason === "max_tokens") return { error: "답이 길어서 잘렸어요 — NAV_MAX_TOKENS를 늘려 보세요", tokens };
  const text = (res.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  try { return { data: JSON.parse(text), tokens }; } catch { return { error: "Claude가 정해진 형식으로 답하지 않음", tokens }; }
}

// ── 이 컴퓨터에 로그인된 Claude Code(`claude -p`) — 도구·MCP·설정·대화 기록 없이 글만 판정한다 ──
function callCli(prompt, schema) {
  return new Promise((resolve) => {
    const args = ["-p", "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--no-session-persistence",
      "--output-format", "json", "--json-schema", JSON.stringify(schema)];
    const child = spawn("claude", args, { env: { ...process.env, ENABLE_CLAUDEAI_MCP_SERVERS: "false" }, windowsHide: true });
    let out = "";
    const timer = setTimeout(() => { child.kill(); resolve({ error: "시간 초과" }); }, TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d));
    child.on("error", () => { clearTimeout(timer); resolve({ error: "claude 명령을 찾지 못함 — Claude Code가 설치·로그인됐는지 확인하거나, ANTHROPIC_API_KEY를 설정하세요" }); });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const r = JSON.parse(out);
        if (r.is_error || !r.structured_output) return resolve({ error: "Claude가 정해진 형식으로 답하지 않음" });
        const u = r.usage || {};
        const tokens = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
        resolve({ data: r.structured_output, tokens });
      } catch { resolve({ error: "Claude 응답을 읽지 못함" }); }
    });
    child.stdin.end(prompt);
  });
}

// 호출 함수를 만든다. makeClient는 키가 있을 때만, 처음 부를 때 한 번 SDK를 읽는다(SDK가 없는 사람도 다른 방식은 쓴다)
function createCaller({ env = process.env, callCli: cli = callCli, makeClient, meter }) {
  const cfg = settings(env);
  let client = null;
  return async function callClaude(prompt, schema) {
    if (providerOf(env) === "cli") return cli(prompt, schema);
    if (meter.state() === "full") return { error: "이 키의 토큰 한도에 다다랐어요 — 보기 방식을 '연습용 예시'로 바꾸거나 NAV_TOKEN_BUDGET을 확인하세요" };
    try { client = client || makeClient(); } catch { return { error: "API 호출 도구가 없어요 — implementations/navigator-prototype에서 npm install을 한 번 해 주세요" }; }
    const r = await callApi(client, cfg, prompt, schema);
    if (r.tokens) meter.add(r.tokens);
    return r;
  };
}

const describe = (env, meter) => ({ provider: providerOf(env), model: settings(env).model, used: meter.used, budget: meter.budget, state: meter.state() });

// 이 프로세스의 기본값 — 환경과 파일 저장소를 읽는다
const usageFile = process.env.NAV_USAGE_FILE || path.join(os.homedir(), ".navigator-usage.json");
const meter = createMeter(settings(process.env).budget, fileStore(usageFile));
const makeClient = () => { const Anthropic = require("@anthropic-ai/sdk"); return new Anthropic(); };   // 키는 ANTHROPIC_API_KEY에서 SDK가 읽는다
const callClaude = createCaller({ makeClient, meter });

module.exports = { callClaude, usage: () => describe(process.env, meter), createCaller, createMeter, fileStore, providerOf, describe };
