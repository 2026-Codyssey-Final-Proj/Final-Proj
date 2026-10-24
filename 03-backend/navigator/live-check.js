// claude-drafted: 2026-10-17
// 실제 AI의 판정이 연습 예시의 "미리 만든 정답"과 얼마나 맞는지, 형식은 지키는지, 토큰은 얼마나 드는지 한 번에 본다.
//   node --env-file=.env live-check.js              # 기본: 앞의 3개만 (토큰 아끼기)
//   node --env-file=.env live-check.js --all        # 글이 있는 예시 전부
//   node --env-file=.env live-check.js --stage 2    # 2단계 예시만
//   node --env-file=.env live-check.js --max 5
//   node --env-file=.env live-check.js --all --report ../../docs/verification/live-check-2026-10-17.md   # 결과를 기록 파일로 (이미 있으면 --force)
// 내 키(또는 로그인)로 부른다 — provider.js와 같다. 키·글 내용은 출력하지 않고 라벨만 보인다.
const fs = require("node:fs");
const path = require("node:path");
const Nav = require("./navigator.js");
const S = require("./scenario.js");

// 같은 오류가 되풀이될 게 뻔한 경우(키가 틀림·한도)에는 남은 글을 부르지 않는다
const STOP = /\((401|403)\)|한도/;

// 글이 있는 연습 예시 → 점검 사례: 단계와 "미리 만든 판정"의 칸별 met를 기대값으로 쓴다
function casesFromExamples() {
  return S.examples
    .filter((e) => e.text && e.judgement && Array.isArray(e.judgement.criteria) && e.judgement.criteria.length)
    .map((e) => ({ label: e.label, text: e.text, stage: e.judgement.stage, expect: e.judgement.criteria.map((c) => !!c.met) }));
}

function pick(cases, { all = false, max = 3, stage } = {}) {
  let list = cases.filter((c) => c.text);
  if (Number.isInteger(stage)) list = list.filter((c) => c.stage === stage);
  return all ? list : list.slice(0, max);
}

async function runChecks(cases, { call, parse, buildPrompt }) {
  const rows = [];
  let tokens = 0, stoppedEarly = false;
  for (const c of cases) {
    const r = await call(buildPrompt(c), Nav.JUDGE_SCHEMA);
    const used = r.tokens || 0;
    tokens += used;
    if (r.error) {
      rows.push({ label: c.label, stage: c.stage, status: "error", error: r.error, tokens: used });
      if (STOP.test(r.error)) { stoppedEarly = true; break; }
      continue;
    }
    const j = parse(r.data, c.text, c.stage);
    if (!j) { rows.push({ label: c.label, stage: c.stage, status: "format", tokens: used }); continue; }
    const got = j.criteria.map((x) => !!x.met);
    const diff = [];
    c.expect.forEach((e, i) => { if (got[i] !== e) diff.push(i + 1); });
    rows.push({ label: c.label, stage: c.stage, status: "ok", agree: c.expect.length - diff.length, total: c.expect.length, diff, next: j.next && j.next.what, tokens: used });
  }
  return { rows, tokens, stoppedEarly };
}

function summarize(result, { budget, used }) {
  const calls = result.rows.length;
  const okRows = result.rows.filter((x) => x.status === "ok");
  const avgTokens = calls ? Math.round(result.tokens / calls) : 0;
  const total = okRows.reduce((n, x) => n + x.total, 0);
  return {
    calls, ok: okRows.length,
    format: result.rows.filter((x) => x.status === "format").length,
    error: result.rows.filter((x) => x.status === "error").length,
    tokens: result.tokens, avgTokens,
    agreeRate: total ? okRows.reduce((n, x) => n + x.agree, 0) / total : null,
    callsLeft: budget && avgTokens ? Math.max(0, Math.floor((budget - used) / avgTokens)) : null,
  };
}

// ── 기록 파일(마크다운) — 우리 6단계 검증 기록 형식: 실제 값 · 발견해 고친 것 · 하지 못한 것 ──
// 주소(호스트)·키·글 내용은 담지 않는다. 사례는 라벨과 숫자만, 중계 서버인지(예/아니오)만 적는다.
const n = (v) => Number(v).toLocaleString();
function reportMarkdown({ date, env, result, summary, stages }) {
  const rows = result.rows.map((r) => {
    const out = r.status === "ok" ? (r.agree === r.total ? "✅" : "🟡")
      : r.status === "format" ? "❌ 형식"
      : `❌ 호출 실패${(r.error || "").match(/\(\d{3}\)/)?.[0] ? ` ${(r.error || "").match(/\(\d{3}\)/)[0]}` : ""}`;
    const agree = r.status === "ok" ? `${r.agree}/${r.total}` : "—";
    const diff = r.status === "ok" && r.diff.length ? `${r.diff.join(", ")}번` : "—";
    return `| ${r.stage} | ${r.label} | ${out} | ${agree} | ${diff} | ${n(r.tokens || 0)} |`;
  });
  return [
    `# 실제 AI 판정 점검 — ${date}`,
    "",
    "<!-- claude-drafted: `live-check.js --report`가 자동으로 만든 기록이다. 아래 \"발견해 고친 것\"과 \"하지 못한 것\"은 **사람이 채운다**. 주소·키·글 내용은 담지 않는다. -->",
    "",
    "## 환경",
    "",
    "| 항목 | 값 |",
    "|---|---|",
    `| 공급자 | ${env.provider === "api" ? "내 API 키" : "Claude Code 로그인"} |`,
    `| 모델 | ${env.model} |`,
    `| 보내는 곳 | ${env.relay ? "중계 서버" : "공식 주소"} |`,
    `| 호환 모드 | ${env.compat ? "예" : "아니오"} |`,
    `| 점검 사례 | ${result.rows.length}개 (단계 ${[...new Set(stages)].sort((a, b) => a - b).join(", ")}) |`,
    "",
    "## 결과",
    "",
    "연습 예시의 미리 만든 정답과 비교한다. 🟡는 틀렸다기보다 **예시와 다르다**는 뜻이다 — 다른 칸은 사람이 보고 판단한다.",
    "",
    "| 단계 | 사례 | 결과 | 정답 일치 | 다른 칸 | 토큰 |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
    "## 요약",
    "",
    `- 성공 ${summary.ok} · 형식 오류 ${summary.format} · 호출 실패 ${summary.error} / ${summary.calls}개`,
    summary.agreeRate !== null ? `- 정답과 일치율 ${Math.round(summary.agreeRate * 100)}% (칸 단위)` : "- 정답과 일치율 — (성공한 사례가 없음)",
    `- 이번 토큰 ${n(summary.tokens)}, 한 번에 평균 ${n(summary.avgTokens)}토큰`,
    ...(result.stoppedEarly ? ["- 같은 오류가 되풀이될 것 같아 남은 예시는 부르지 않았다"] : []),
    "",
    "## 발견해 고친 것",
    "",
    "<!-- 사람이 적는다. 예: 어떤 단계에서 형식 오류가 났고, 프롬프트의 어느 문장을 고쳐 해결했나 -->",
    "",
    "- (직접 적기)",
    "",
    "## 하지 못한 것",
    "",
    "<!-- 사람이 적는다. 예: 점검하지 못한 단계·모델, 설계도 초안·리뷰, 직접 쓴 새 글 -->",
    "",
    "- (직접 적기)",
    "",
  ].join("\n");
}

// 이미 있는 기록은 덮어쓰지 않는다(사람이 채운 칸을 잃지 않게) — --force일 때만
function writeReport(file, text, { force = false } = {}) {
  if (fs.existsSync(file) && !force) return { ok: false, reason: "이미 있는 파일이에요 — 사람이 채운 칸을 잃지 않게 덮어쓰지 않았어요. 다른 이름을 쓰거나 --force를 붙이세요" };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return { ok: true };
}

const strAfter = (args, flag) => { const i = args.indexOf(flag); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined; };
const intAfter = (args, flag) => { const i = args.indexOf(flag); const n = i >= 0 ? Number(args[i + 1]) : NaN; return Number.isInteger(n) ? n : undefined; };

async function main() {
  const { callClaude, usage } = require("./provider.js");
  const args = process.argv.slice(2);
  const opt = { all: args.includes("--all"), max: intAfter(args, "--max") ?? 3, stage: intAfter(args, "--stage") };
  const u0 = usage();
  console.log(`공급자: ${u0.provider === "api" ? `내 API 키 (${u0.model}) · 보내는 곳 ${u0.host}${u0.compat ? " · 호환 모드" : ""}` : "이 컴퓨터에 로그인된 Claude Code (한 번에 약 4~5천 토큰 — 2026-10-24 실측)"}`);
  const cases = pick(casesFromExamples(), opt);
  if (!cases.length) { console.error("점검할 예시가 없어요"); process.exit(1); }
  console.log(`${cases.length}개 점검 — 판정을 실제 AI에 묻고, 연습 예시의 정답과 비교해요\n`);

  const result = await runChecks(cases, { call: callClaude, parse: Nav.parseJudgement, buildPrompt: (c) => Nav.judgePrompt(c.text, c.stage) });

  for (const r of result.rows) {
    const mark = r.status === "ok" ? (r.agree === r.total ? "✅" : "🟡") : "❌";
    const detail = r.status === "ok" ? `정답과 ${r.agree}/${r.total} 일치${r.diff.length ? ` (다른 칸: ${r.diff.join(", ")}번)` : ""} · 다음 할 일: ${r.next}`
      : r.status === "format" ? "AI는 답했지만 정해진 형식이 아니에요" : r.error;
    console.log(`${mark} [${r.stage}단계] ${r.label} — ${detail} · ${r.tokens}토큰`);
  }
  if (result.stoppedEarly) console.log("\n⏹ 같은 오류가 되풀이될 것 같아 남은 예시는 부르지 않았어요");

  const u1 = usage();
  const s = summarize(result, { budget: u1.budget, used: u1.used });
  console.log(`\n성공 ${s.ok} · 형식 오류 ${s.format} · 호출 실패 ${s.error} / ${s.calls}개 — 이번에 ${s.tokens.toLocaleString()}토큰, 한 번에 평균 ${s.avgTokens.toLocaleString()}토큰`);
  if (s.agreeRate !== null) console.log(`정답과 일치율 ${Math.round(s.agreeRate * 100)}% (칸 단위)`);
  if (u1.provider === "api") console.log(`이 키로 지금까지 ${u1.used.toLocaleString()}토큰${u1.budget ? ` / 한도 ${u1.budget.toLocaleString()} — 이 평균으로 약 ${s.callsLeft?.toLocaleString()}번 더` : " (NAV_TOKEN_BUDGET을 정하면 남은 횟수도 알려 줘요)"}`);
  const reportFile = strAfter(args, "--report");
  if (args.includes("--report") && !reportFile) console.error("\n--report 다음에 저장할 파일 이름을 적어 주세요 (예: --report ../../docs/verification/live-check-2026-10-17.md)");
  if (reportFile) {
    const date = new Date().toLocaleDateString("sv-SE");   // 2026-10-17 모양
    const md = reportMarkdown({ date, env: { provider: u1.provider, model: u1.model, relay: u1.provider === "api" && u1.host !== "api.anthropic.com", compat: u1.compat }, result, summary: s, stages: cases.map((c) => c.stage) });
    const w = writeReport(path.resolve(reportFile), md, { force: args.includes("--force") });
    console.log(w.ok ? `\n📄 기록을 만들었어요: ${reportFile}\n   '발견해 고친 것'과 '하지 못한 것' 두 칸을 직접 채워 주세요. 올리기 전에 한 번 읽어 보세요.` : `\n📄 기록을 만들지 않았어요 — ${w.reason}`);
  }
  process.exit(s.format || s.error ? 1 : 0);
}

if (require.main === module) main();
module.exports = { casesFromExamples, pick, runChecks, summarize, reportMarkdown, writeReport };
