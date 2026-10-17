// claude-drafted: 2026-10-17
// 시연용 진짜 AI 답을 한 번 녹화한다 — 이후 리허설·시연은 토큰 0으로 같은 답을 재생한다.
//   node --env-file=.env record-demo.js --list        # 무엇을 녹화할지만 보기 (호출 없음)
//   node --env-file=.env record-demo.js               # 녹화 (이미 한 것은 건너뜀, 예산은 demo 통에서)
//   node --env-file=.env record-demo.js --again       # 이미 한 것도 다시
//   NAV_REPLAY=recordings/demo.json node server.js    # 재생 — 키도 토큰도 필요 없다
// 녹화에는 AI의 답만 들어간다(연습 예시 글에 대한). 키·사용자 글은 담지 않는다.
const path = require("node:path");
const Nav = require("./navigator.js");
const L = require("./live-check.js");
const REC = require("./recording.js");

const STOP = /\((401|403)\)|한도|몫/;   // 같은 오류가 되풀이될 게 뻔하면 멈춘다

// 녹화할 요청 — 판정 9개와 1~4단계 설계도 초안 4개. 리뷰는 받아 둔 초안 글이 있어야 만들 수 있어 reviewRequest로 따로 만든다.
function demoRequests() {
  const cases = L.casesFromExamples();
  const judge = cases.map((c) => ({ kind: "judge", label: `${c.stage}단계 판정 · ${c.label}`, stage: c.stage, text: c.text, prompt: Nav.judgePrompt(c.text, c.stage), schema: Nav.JUDGE_SCHEMA }));
  const draft = [1, 2, 3, 4].map((stage) => {
    const c = cases.find((x) => x.stage === stage);
    return { kind: "draft", label: `${stage}단계 설계도 초안`, stage, text: c.text, prompt: Nav.draftPrompt(stage, c.text), schema: Nav.DRAFT_SCHEMA };
  });
  return [...judge, ...draft];
}

// 화면은 설계도 글(초안 그대로면 초안)을 그대로 보낸다 — 같아야 재생된다
const reviewRequest = ({ stage, text, draftText }) => ({ kind: "review", label: `${stage}단계 설계도 다시 보기`, stage, text, prompt: Nav.reviewPrompt(stage, text, draftText), schema: Nav.REVIEW_SCHEMA });

const argAfter = (args, flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };

async function main() {
  const args = process.argv.slice(2);
  const file = path.resolve(argAfter(args, "--out") || path.join(__dirname, "recordings", "demo.json"));
  const list = demoRequests();
  if (args.includes("--list")) {
    console.log(`녹화할 요청 ${list.length}개 + 초안마다 리뷰 1개 = ${list.length + list.filter((x) => x.kind === "draft").length}개 (이미 녹화된 것은 건너뜀)`);
    for (const r of list) console.log(`  · ${r.label}`);
    return;
  }
  // 녹화 모드로 provider를 연다: 예산은 시연 통, 저장 위치는 file, 재생은 끈다
  process.env.NAV_RECORD = file;
  process.env.NAV_PURPOSE = process.env.NAV_PURPOSE || "demo";
  delete process.env.NAV_REPLAY;
  const { callClaude, usage } = require("./provider.js");
  const u0 = usage();
  console.log(`공급자: ${u0.provider === "api" ? `내 API 키 (${u0.model}) · 보내는 곳 ${u0.host}${u0.compat ? " · 호환 모드" : ""}` : "이 컴퓨터에 로그인된 Claude Code"} · 저장: ${path.relative(process.cwd(), file)}\\n`);

  const again = args.includes("--again");
  const labels = REC.loadLabels(file);
  let items = REC.load(file);
  let done = 0, skipped = 0, failed = 0, tokens = 0, stop = false;

  const run = async (req) => {
    const key = REC.keyOf(req.prompt, req.schema);
    labels[key] = req.label;
    if (items[key] !== undefined && !again) { skipped++; return items[key]; }
    const r = await callClaude(req.prompt, req.schema);
    tokens += r.tokens || 0;
    if (r.error || r.data === undefined) {
      failed++; console.log(`❌ ${req.label} — ${r.error || "답 없음"}`);
      if (STOP.test(r.error || "")) stop = true;
      return undefined;
    }
    items = REC.load(file);   // provider가 방금 저장한 것을 이어받는다
    done++; console.log(`✅ ${req.label} · ${r.tokens || 0}토큰`);
    return r.data;
  };

  for (const req of list) {
    if (stop) break;
    const data = await run(req);
    if (req.kind === "draft" && data !== undefined && !stop) {
      const parsed = Nav.parseDraft(data);
      if (parsed) await run(reviewRequest({ stage: req.stage, text: req.text, draftText: parsed.draft }));
    }
  }
  REC.save(file, REC.load(file), labels);
  if (stop) console.log("\\n⏹ 같은 오류가 되풀이될 것 같아 멈췄어요");
  console.log(`\\n새로 녹화 ${done} · 건너뜀 ${skipped} · 실패 ${failed} — 이번에 ${tokens.toLocaleString()}토큰 (${process.env.NAV_PURPOSE} 통)`);
  console.log(`재생: NAV_REPLAY=${path.relative(process.cwd(), file)} node server.js   (키·토큰 없이 진짜 AI 답으로 시연)`);
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
module.exports = { demoRequests, reviewRequest };
