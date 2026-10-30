// claude-drafted: 2026-10-17
// 공급자 — **외부 AI 호출은 이 파일 한 곳에서만 한다**(code.md 6, navigator.test.js가 확인).
//
// 팀원 각자 자기 것으로 쓴다 — 키나 로그인은 저장소에 없고, 각자 컴퓨터의 환경에만 있다.
//   ANTHROPIC_API_KEY 있음 → 그 사람의 API 키로 호출 (한도·사용량도 그 사람 것)
//   없음                    → 그 사람 컴퓨터에 로그인된 Claude Code(`claude -p`)로 호출
//   둘 다 없음              → 화면이 '연습용 예시'로 움직인다
//
// 코디세이 같은 중계 서버의 가상 키를 쓰면 ANTHROPIC_BASE_URL을 그 주소로 둔다(SDK가 읽는다). 이때는 '호환 모드'가 자동으로 켜져
// 구조화 출력·effort·폴백 같은 새 기능 없이 JSON만 요청한다(중계 서버와 옛 모델이 못 받을 수 있다). NAV_COMPAT=0/1로 직접 정할 수 있다.
//
// 키는 이 파일 밖으로 나가지 않는다: 로그·오류·/api/usage 어디에도 값을 싣지 않는다.
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const REC = require("./recording.js");
const Tokens = require("./tokens.js");   // 토큰 장부(2026-10-24) — 한도(meter)와 따로, 구독이어도 Claude Code가 알려 준 값을 센다

const TIMEOUT_MS = 90_000;
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
const OFFICIAL_HOST = "api.anthropic.com";
const DEFAULTS = { model: "claude-opus-5-5", maxTokens: 2048, effort: "low" };
// 초안은 빠른 모델로(C-40, 2026-10-26 — 이재엽 "보통길이이고 작업들을 하나씩 하는건데 왜 그냥 넣었을때 보다 너무 느려" · 버튼 "초안은 빠른 모델로"): 단계 초안 · 처음 초안만(meta.fast).
//   claude -p는 별명(sonnet)과 --effort low, API는 빠른 모델 · 낮은 effort. 바꾸려면 NAV_DRAFT_MODEL. 판정 · 그 밖은 지금 그대로. 중계 서버는 받는 모델만 쓴다(그대로)
const FAST = { cliModel: "sonnet", model: "claude-sonnet-5-5", effort: "low" };
const API_ALIAS = { sonnet: "claude-sonnet-5-5", haiku: "claude-haiku-5-5", opus: "claude-opus-5-5" };   // NAV_DRAFT_MODEL에 별명을 넣어도 API에서 쓰이게(2026-10-26 리뷰 — API는 전체 이름만 받는다)
// 코디세이 중계 서버가 받는 모델(운영팀 목록, 2026-10-17). 중계 서버에서 NAV_MODEL이 없으면 첫 모델을 쓴다 — 공식 기본 모델은 중계 서버에 없다
const RELAY_MODELS = ["claude-opus-4-8", "claude-opus-4-7"];

const positive = (v, fallback) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : fallback; };
const settings = (env) => ({
  model: env.NAV_MODEL || (isRelay(env) ? RELAY_MODELS[0] : DEFAULTS.model),
  relay: isRelay(env),
  maxTokens: positive(env.NAV_MAX_TOKENS, DEFAULTS.maxTokens),
  effort: env.NAV_EFFORT || DEFAULTS.effort,
  fallback: env.NAV_FALLBACK !== "off",
  budget: positive(env.NAV_TOKEN_BUDGET, null),
  compat: env.NAV_COMPAT === "1" || (env.NAV_COMPAT !== "0" && isRelay(env)),   // 중계 서버일 때만 자동
  plan: parsePlan(env.NAV_PLAN),
  purpose: env.NAV_PURPOSE || "dev",
  tester: env.NAV_TESTER || null,
  useReserve: env.NAV_USE_RESERVE === "1",
});
// 테스터 한 명의 몫: 직접 정하거나, 계획이 있으면 사용자 테스트 몫을 5명으로 나눈다
const testerBudgetOf = (env) => positive(env.NAV_TESTER_BUDGET, (() => { const pl = parsePlan(env.NAV_PLAN); return pl && pl.test ? Math.floor(pl.test / TESTERS) : null; })());
// 어디로 보내는지 호스트만 알린다 — 경로·쿼리에 비밀이 섞여 있어도 새지 않게
function hostOf(env) { try { return new URL(env.ANTHROPIC_BASE_URL || `https://${OFFICIAL_HOST}`).host; } catch { return "(주소 형식 오류)"; } }
const isRelay = (env) => Boolean(env.ANTHROPIC_BASE_URL) && hostOf(env) !== OFFICIAL_HOST;
const providerOf = (env) => (env.ANTHROPIC_API_KEY ? "api" : "cli");

// 예산 통 — 용도별로 몫을 나눈다. 'default'는 규칙·프롬프트 40만 / 사용자 테스트 20만 / 리허설·녹화 20만 / 예비 20만.
// 예비는 잠겨 있다가 NAV_USE_RESERVE=1일 때만 쓴다.
const DEFAULT_PLAN = { dev: 400000, test: 200000, demo: 200000, reserve: 200000 };
function parsePlan(text) {
  if (!text) return null;
  if (String(text).trim() === "default") return { ...DEFAULT_PLAN };
  const plan = {};
  for (const part of String(text).split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    const n = Number(v);
    if (k && Number.isFinite(n) && n > 0) plan[k] = n;
  }
  return Object.keys(plan).length ? plan : null;
}
const TESTERS = 5;   // 사용자 테스트 5명 기준으로 테스터 한 명의 몫을 정한다

// ── 사용량 — 이 사람의 키로 쓴 토큰 수. 서버를 다시 켜도 이어지게 파일에 숫자만 남긴다 ──
const blank = () => ({ used: 0, byPurpose: {}, byTester: {} });
function normalize(x) {   // 예전 숫자·{used}만 있는 파일도 읽는다
  if (typeof x === "number") return { ...blank(), used: Number.isFinite(x) && x >= 0 ? x : 0 };
  if (!x || typeof x !== "object") return blank();
  const num = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).filter(([, v]) => Number.isFinite(v) && v >= 0));
  return { used: Number.isFinite(x.used) && x.used >= 0 ? x.used : 0, byPurpose: num(x.byPurpose), byTester: num(x.byTester) };
}
const fileStore = (file) => ({
  load() { try { return normalize(JSON.parse(fs.readFileSync(file, "utf8"))); } catch { return blank(); } },
  save(state) { try { fs.writeFileSync(file, JSON.stringify(state), { mode: 0o600 }); } catch { /* 못 써도 호출은 계속 */ } },
});

function createMeter(budget, store, { plan = null, testerBudget = null } = {}) {
  let s = normalize(store.load());
  const total = budget || (plan ? Object.values(plan).reduce((n, v) => n + v, 0) : null);
  const spent = (bucket) => s.byPurpose[bucket] || 0;
  const fmt = (n) => n.toLocaleString();
  const meter = {
    get used() { return s.used; },
    budget: total,
    state() { return !total ? "ok" : s.used >= total ? "full" : s.used >= total * 0.8 ? "warn" : "ok"; },
    // 부르기 전에: 이 용도·테스터가 더 써도 되나? 어느 통에 쌓을지도 알려 준다
    gate({ purpose = "dev", tester = null, reserve = false } = {}) {
      if (tester && testerBudget && (s.byTester[tester] || 0) >= testerBudget) return { ok: false, reason: `테스터 '${tester}'의 몫(${fmt(testerBudget)}토큰)을 다 썼어요` };
      if (!plan) return meter.state() === "full"
        ? { ok: false, reason: "이 키의 토큰 한도에 다다랐어요 — 보기 방식을 '연습용 예시'로 바꾸거나 NAV_TOKEN_BUDGET을 확인하세요" }
        : { ok: true, bucket: null };
      if (total && s.used >= total) return { ok: false, reason: "이 키의 전체 토큰 한도에 다다랐어요 — NAV_TOKEN_BUDGET을 확인하세요" };
      const limit = plan[purpose];
      if (limit === undefined || purpose === "reserve") return { ok: false, reason: `NAV_PURPOSE '${purpose}'는 예산에 없어요 (${Object.keys(plan).filter((k) => k !== "reserve").join("·")})` };
      if (spent(purpose) < limit) return { ok: true, bucket: purpose };
      if (reserve && plan.reserve && spent("reserve") < plan.reserve) return { ok: true, bucket: "reserve" };
      return { ok: false, reason: reserve ? "예비까지 다 썼어요 — 한도를 다시 정해야 해요" : `'${purpose}' 몫(${fmt(limit)}토큰)을 다 썼어요 — 예비를 쓰려면 NAV_USE_RESERVE=1` };
    },
    add(n, { bucket = null, tester = null } = {}) {
      s.used += n;
      if (bucket) s.byPurpose[bucket] = spent(bucket) + n;
      if (tester) s.byTester[tester] = (s.byTester[tester] || 0) + n;
      store.save(s);
    },
    snapshot() {
      return {
        used: s.used, budget: total,
        buckets: plan ? Object.fromEntries(Object.entries(plan).map(([k, limit]) => [k, { used: spent(k), limit }])) : null,
        testers: { ...s.byTester },
      };
    },
  };
  return meter;
}

// ── API 호출 ──
const apiError = (e, cfg = {}) => {
  const s = e && e.status;
  const code = s ? ` (${s})` : "";
  if (s === 401 || s === 403) return `API 키가 맞지 않거나 권한이 없어요${code} — 키와 ANTHROPIC_BASE_URL(중계 서버를 쓴다면)을 확인하세요`;
  if ((s === 400 || s === 404) && cfg.relay) return `요청이 받아들여지지 않았어요${code} — 중계 서버가 받는 모델은 ${RELAY_MODELS.join(", ")}예요. NAV_MODEL을 확인하세요`;
  if (s === 400 || s === 404) return `요청이 받아들여지지 않았어요${code} — 모델 이름(NAV_MODEL)이나 호환 모드(NAV_COMPAT=1)를 확인하세요`;
  if (s === 429) return `잠시 너무 많이 불렀어요${code} — 조금 뒤에 다시 눌러 주세요`;
  return `AI에 연결하지 못했어요${code}`;   // e.message는 싣지 않는다 — 요청 내용이 섞일 수 있다
};

// 호환 모드의 답 읽기 — 코드 블록 표시나 앞뒤 설명이 붙어도 JSON 객체만 꺼낸다
function extractJson(text) {
  const s = String(text).replace(/```(?:json)?/gi, "").trim();
  for (const c of [s, s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)]) { try { return JSON.parse(c); } catch { /* 다음 후보 */ } }
  throw new Error("json");
}

async function callApi(client, cfg, prompt, schema) {
  const base = { model: cfg.model, max_tokens: cfg.maxTokens };
  const ask = cfg.compat
    ? { ...base, messages: [{ role: "user", content: `${prompt}\n\n답은 아래 JSON 스키마를 지키는 JSON 객체 하나만 쓰세요. 설명이나 코드 블록 표시는 쓰지 마세요.\n${JSON.stringify(schema)}` }] }
    : { ...base, output_config: { effort: cfg.effort, format: { type: "json_schema", schema } }, messages: [{ role: "user", content: prompt }] };
  let res;
  try {
    res = !cfg.compat && cfg.fallback
      ? await client.beta.messages.create({ ...ask, betas: [FALLBACK_BETA], fallbacks: "default" })
      : await client.messages.create(ask);
  } catch (e) { return { error: apiError(e, cfg) }; }
  const u = res.usage || {};
  const tokens = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
  const usage = Tokens.usageOf(u);
  if (res.stop_reason === "refusal") return { error: "Claude가 이 글에는 답하지 않았어요", tokens, usage };
  if (res.stop_reason === "max_tokens") return { error: "답이 길어서 잘렸어요 — NAV_MAX_TOKENS를 늘려 보세요", tokens, usage };
  const text = (res.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  try { return { data: extractJson(text), tokens, usage }; } catch { return { error: "Claude가 정해진 형식으로 답하지 않음", tokens, usage }; }
}

// claude를 어떻게 여나 — 셸 없이 spawn("claude")는 Windows에서 claude.exe만 찾는다. npm으로만 깐 PC(claude.cmd)는 그 옆 node_modules의 cli.js를 node로 연다
//   (.cmd를 셸 없이 열 수 없고, 셸로 열면 --json-schema 같은 인자의 따옴표가 깨진다). node는 PATH의 것 — claude.cmd도 그것을 쓴다.
//   앱의 실행 파일(Electron)을 ELECTRON_RUN_AS_NODE로 쓰면 그 값이 claude의 모든 하위 명령에 물려져 사용자의 Electron 프로젝트가 node로 떴다(새 맥락 리뷰, F-104-10)
function claudeLaunch(platform = process.platform, env = process.env, exists = fs.existsSync) {
  const plain = { cmd: "claude", pre: [], env: {} };
  if (platform !== "win32") return plain;
  const W = path.win32, dirs = String(env.PATH || env.Path || "").split(";").filter(Boolean);
  if (dirs.some((d) => exists(W.join(d, "claude.exe")))) return plain;
  for (const d of dirs) {
    const js = W.join(d, "node_modules", "@anthropic-ai", "claude-code", "cli.js");
    if (exists(W.join(d, "claude.cmd")) && exists(js)) return { cmd: "node", pre: [js], env: {} };
  }
  return plain;
}
// 맡긴 일 끄기 — Windows에서 child.kill()은 claude만 끝내고 그 자식(npm · 개발 서버)은 남아 파일을 고치거나 포트를 붙잡았다. 나무째(taskkill /T) 끈다(F-104-11)
function killTree(child, platform = process.platform, run = spawn) {
  if (!child) return;
  if (platform === "win32" && child.pid) { try { run("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }).on("error", () => { try { child.kill(); } catch {} }); return; } catch {} }
  try { child.kill(); } catch {}
}

// 처음 설정(2026-10-19, setup-status.js · GET /api/setup)이 묻는 claude 명령의 판 — --version이라 AI를 부르지 않고 토큰도 쓰지 않는다. run: 시험에서 바꿔 끼운다
function claudeVersion(run = spawnSync, L = claudeLaunch()) {
  try {
    const r = run(L.cmd, [...L.pre, "--version"], { encoding: "utf8", timeout: 4000, windowsHide: true, env: { ...process.env, ...L.env } });
    if (!r || r.error || r.status !== 0) return { found: false, version: "" };
    const v = String(r.stdout || "").trim().split(/\s+/)[0] || "";
    return { found: true, version: /^\d+\.\d+/.test(v) ? v : "" };
  } catch { return { found: false, version: "" }; }
}

// ── 이 컴퓨터에 로그인된 Claude Code(`claude -p`) — 도구·MCP·설정·대화 기록 없이 글만 판정한다 ──
// 시스템 안내문은 Claude Code 기본(코딩 도구용) 대신 한 줄 — 바닥값 3,781 → 1,120토큰(2026-10-24 실측, live-check로 일치율 확인)
const CLI_SYSTEM = "Floe가 보낸 요청에만 답한다. 정해진 JSON 형식을 지킨다.";
const cliArgs = (schema, opts = null) => ["-p", "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--no-session-persistence",
  "--system-prompt", CLI_SYSTEM, "--output-format", "json", "--json-schema", JSON.stringify(schema),
  ...(opts && opts.fast ? ["--model", opts.model || FAST.cliModel, "--effort", FAST.effort] : [])];
function callCli(prompt, schema, opts = null) {
  return new Promise((resolve) => {
    const L = claudeLaunch();
    const child = spawn(L.cmd, [...L.pre, ...cliArgs(schema, opts)], { env: { ...process.env, ...L.env, ENABLE_CLAUDEAI_MCP_SERVERS: "false" }, windowsHide: true });
    let out = "";
    const timer = setTimeout(() => { child.kill(); resolve({ error: "시간 초과" }); }, TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d));
    child.on("error", () => { clearTimeout(timer); resolve({ error: "claude 명령을 찾지 못함 — Claude Code가 설치·로그인됐는지 확인하거나, ANTHROPIC_API_KEY를 설정하세요" }); });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const r = JSON.parse(out);
        const u = r.usage || {};
        const tokens = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
        const paid = { tokens, usage: Tokens.usageOf(u), cost: Number.isFinite(r.total_cost_usd) ? r.total_cost_usd : null };   // 형식이 틀린 답도 토큰은 나갔다 — 장부에 남긴다
        if (r.is_error || !r.structured_output) return resolve({ error: "Claude가 정해진 형식으로 답하지 않음", ...paid });
        resolve({ data: r.structured_output, ...paid });
      } catch { resolve({ error: "Claude 응답을 읽지 못함" }); }
    });
    child.stdin.end(prompt);
  });
}

// ── FR-17 대화로 일 넘기기(2026-10-20): 허락한 일을 사용자의 Claude Code로 넘긴다 — 연결한 폴더(dir)에서 `claude -p`를 셸 없이 열고 글은 표준 입력으로 ──
// 판정(callCli)과 다르다: 도구 · 설정(훅 포함)을 그대로 쓰고, 권한 건너뛰기 옵션은 쓰지 않는다 — 파일을 고치거나 명령을 쓰기 전의 허락은 PermissionRequest 훅(approve-hook.js)이 섬에 묻는다.
// 대화 기록은 잇지 않는다(--resume · --continue 없음 — 열어 둔 창과 한 세션을 두 곳에서 쓰지 않게) [제안]. NAV_CLAUDE_BIN은 시험용 가짜 claude(.js면 node로 연다)
// 2026-10-24(토큰 장부): 끝에 결과 한 덩이(--output-format json)를 받아 onResult로 넘긴다 — 토큰 · 비용만 쓰고 답 글은 담지 않는다(tokens.js parseResult). 앞 4MB까지만 모은다
// 2026-10-24(C-32): schema를 주면 --json-schema로 연다 — Claude Code가 일을 마친 뒤 그 모양으로 답한다(기준마다 해냄 · 근거, navigator.js REPORT_SCHEMA). 그 답(output)만 넘기고 결과 글은 넘기지 않는다
const TASK_OUT_MAX = 4 * 1024 * 1024;
function startTask({ dir, text, bin = process.env.NAV_CLAUDE_BIN || "claude", onResult = null, schema = null }) {
  const args = ["-p", "--output-format", "json", ...(schema ? ["--json-schema", JSON.stringify(schema)] : [])], js = bin.endsWith(".js");
  const L = !js && bin === "claude" ? claudeLaunch() : { cmd: bin, pre: [], env: {} };   // npm으로만 깐 Windows도(F-104-10)
  const child = spawn(js ? process.execPath : L.cmd, js ? [bin, ...args] : [...L.pre, ...args], { cwd: dir, stdio: ["pipe", "pipe", "ignore"], windowsHide: true, ...(Object.keys(L.env).length ? { env: { ...process.env, ...L.env } } : {}) });
  let out = "";
  child.stdout.on("data", (d) => { if (out.length < TASK_OUT_MAX) out += d; });
  child.on("close", () => { if (!onResult) return; const j = Tokens.resultOf(out); onResult(j ? { ...Tokens.summarize(j), output: j.structured_output ?? null, denials: Tokens.denialsOf(j), isError: j.is_error === true } : null); });   // denials — 허락을 못 받은 도구의 이름 · 개수, isError — 결과가 오류(F-69)
  child.stdin.on("error", () => {});
  child.stdin.end(`Floe(섬)에서 넘긴 일이에요. 아래 요구 문장대로 해 주세요. 파일을 고치거나 명령을 쓰기 전에 허락을 구하면 Floe 섬에서 허용 · 거절을 받아요.\n\n${String(text).trim()}\n`);
  return child;
}

// 녹화 파일을 환경에서 읽는다 — NAV_REPLAY: 재생(토큰 0), NAV_RECORD: 진짜로 부른 답을 저장
const replayFrom = (env) => (env.NAV_REPLAY ? REC.load(env.NAV_REPLAY) : null);
const recorderFrom = (env) => (env.NAV_RECORD ? (key, data) => { const items = REC.load(env.NAV_RECORD); items[key] = data; REC.save(env.NAV_RECORD, items); } : null);

// 호출 함수를 만든다. makeClient는 키가 있을 때만, 처음 부를 때 한 번 SDK를 읽는다(SDK가 없는 사람도 다른 방식은 쓴다)
function createCaller({ env = process.env, callCli: cli = callCli, makeClient, meter, replay = replayFrom(env), record = recorderFrom(env), ledger = null }) {
  // 설정과 클라이언트는 부를 때마다 환경을 다시 본다 — 처음 설정(앱)에서 키 · 중계 서버를 넣거나 빼면 다시 켜지 않아도 다음 호출부터 바뀐다(2026-10-19)
  let client = null, clientFor = "";
  // meta.label — 장부에 남길 이름(판정 · 퀘스트 같은 정해진 말, tokens.js). 토큰이 쓰였으면 실패한 호출도 쌓는다(잘림 · 거절도 토큰은 나갔다)
  return async function callClaude(prompt, schema, meta = {}) {
    const cfg = settings(env);
    const key = REC.keyOf(prompt, schema);
    if (replay) {   // 재생 중에는 AI를 부르지 않는다 — 키도 한도도 필요 없다
      return replay[key] !== undefined ? { data: replay[key], tokens: 0, replayed: true }
        : { error: "녹화에 없는 요청이에요 — 같은 글·같은 단계로 node --env-file=.env record-demo.js를 다시 돌려 녹화하세요" };
    }
    let r;
    if (providerOf(env) === "cli") r = await cli(prompt, schema, meta.fast ? { fast: true, ...(env.NAV_DRAFT_MODEL ? { model: env.NAV_DRAFT_MODEL } : {}) } : undefined);
    else {
      const gate = meter.gate({ purpose: cfg.purpose, tester: cfg.tester, reserve: cfg.useReserve });
      if (!gate.ok) return { error: gate.reason };
      const who = `${env.ANTHROPIC_API_KEY || ""}|${env.ANTHROPIC_BASE_URL || ""}`;
      try { if (!client || clientFor !== who) { client = makeClient(); clientFor = who; } } catch { return { error: "API 호출 도구가 없어요 — 03-backend/navigator에서 npm install을 한 번 해 주세요" }; }
      const draftModel = env.NAV_DRAFT_MODEL ? API_ALIAS[env.NAV_DRAFT_MODEL] || env.NAV_DRAFT_MODEL : FAST.model;
      const use = meta.fast && !cfg.relay ? { ...cfg, model: draftModel, effort: FAST.effort } : cfg;   // 초안은 빠른 모델 · 낮은 effort(C-40)
      r = await callApi(client, meta.maxTokens > use.maxTokens ? { ...use, maxTokens: meta.maxTokens } : use, prompt, schema);   // 예시 셋은 글이 길다 — 그 요청만 넉넉히
      if (r.tokens) meter.add(r.tokens, { bucket: gate.bucket, tester: cfg.tester });
    }
    if (record && r.data !== undefined) record(key, r.data);
    if (ledger && r.tokens > 0) ledger.add("floe", meta && meta.label, r.usage || Tokens.usageOf({ input_tokens: r.tokens }), r.cost ?? null);
    return r;
  };
}

const describe = (env, meter) => {
  const snap = meter.snapshot();
  return {
    provider: providerOf(env), model: settings(env).model, host: hostOf(env), compat: settings(env).compat,
    used: meter.used, budget: meter.budget, state: meter.state(),
    ...(snap.buckets ? { buckets: snap.buckets } : {}),
    ...(Object.keys(snap.testers).length ? { testers: snap.testers } : {}),
    ...(env.NAV_REPLAY ? { replay: true } : {}),
    ...(env.NAV_RECORD ? { record: true } : {}),
  };
};

// 이 프로세스의 기본값 — 환경과 파일 저장소를 읽는다
const usageFile = process.env.NAV_USAGE_FILE || path.join(os.homedir(), ".navigator-usage.json");
const meter = createMeter(settings(process.env).budget, fileStore(usageFile), { plan: settings(process.env).plan, testerBudget: testerBudgetOf(process.env) });
const makeClient = () => { const Anthropic = require("@anthropic-ai/sdk"); return new Anthropic(); };   // 키는 ANTHROPIC_API_KEY에서 SDK가 읽는다
const ledger = Tokens.createLedger(Tokens.fileStore(Tokens.fileOf(process.env)));   // 토큰 장부(2026-10-24) — 설정의 토큰 칸 · /api/usage의 ledger
const callClaude = createCaller({ makeClient, meter, ledger });

module.exports = { RELAY_MODELS, cliArgs, callClaude, ledger, usage: () => describe(process.env, meter), createCaller, createMeter, fileStore, providerOf, describe, parsePlan, DEFAULT_PLAN, claudeVersion, claudeLaunch, killTree, startTask };
