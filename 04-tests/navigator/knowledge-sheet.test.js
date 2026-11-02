// claude-drafted: 2026-10-30 — 지식 퀘스트 C-47 남은 몫(이재엽 버튼 "10/31까지"): 재료는 저절로 · ③ 기록 칸의 한 장은 확인만 · 맞아요면 README의 그 단계 절에.
//   지식 퀘스트 PRD 3절(재료 D · 한 장 I) · 6절 C-47 · 7절(이름 · 한 줄 · 수만, 대화 원문 · 도구 입력은 남기지 않음) · 9절 5번. 코드보다 먼저 썼다(code.md 1번).
// 진짜 AI는 부르지 않는다 — 한 장은 규칙으로 만든다(연습 모드에서도 서버 없이, FR-10). 서버 시험은 가짜 claude.
// 실행: node --test 04-tests/navigator/knowledge-sheet.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator"), FRONT = path.join(__dirname, "../../02-frontend/navigator");
const SH = require(path.join(BACK, "sheet.js"));
const D = require(path.join(BACK, "docs.js"));
const Nav = require(path.join(BACK, "navigator.js"));
const Sensitive = require(path.join(BACK, "sensitive.js"));
const read = (p) => fs.readFileSync(p, "utf8");
const KEY = "sk-ant-" + "a1B2".repeat(10);
const ID = (x) => x;   // 시험에서 가리기를 일부러 건너뛸 때 — 넘기지 않으면 모으지 않는다(아래)   // secret-check: allow — 시험 안에서만, 실행할 때 만든다

test("재료 더하기 — 가린 뒤 한 줄 · 80자 · 같은 줄은 수만 늘고, 종류마다 처음 하나 + 최근 다섯, 모르는 종류 · 단계는 버리고, 받은 것을 바꾸지 않는다", () => {
  const s0 = {};
  const s1 = SH.add(s0, 2, "chat", `신청 단추부터\n만들래요 열쇠 ${KEY}`, Sensitive.redact);
  assert.deepEqual(s0, {}, "받은 것은 그대로");
  assert.equal(s1[2].length, 1);
  assert.equal(s1[2][0].k, "chat");
  assert.ok(!s1[2][0].t.includes(KEY) && !s1[2][0].t.includes("\n"), "가린 뒤 한 줄");
  const long = SH.add({}, 0, "report", "가".repeat(300), ID);
  assert.ok(long[0][0].t.length <= SH.LINE_MAX);
  const twice = SH.add(SH.add({}, 1, "report", "화면을 만들었어요", ID), 1, "report", "화면을 만들었어요", ID);
  assert.deepEqual(twice[1], [{ k: "report", t: "화면을 만들었어요", c: 2 }], "같은 줄은 수만");
  let many = {};
  for (let i = 0; i < 10; i++) many = SH.add(many, 3, "chat", `말 ${i}`, ID);
  assert.equal(many[3].filter((x) => x.k === "chat").length, SH.PER_KIND);
  assert.equal(many[3][0].t, "말 0", "처음 한 말은 남는다(한 장의 '처음 한 말')");
  assert.equal(many[3].at(-1).t, "말 9", "최근 것이 남는다");
  assert.deepEqual(SH.add({}, 2, "tool-input", "rm -rf /", ID), {}, "모르는 종류는 버린다");
  assert.deepEqual(SH.add({}, 2, "file", "src/a.js", ID), {}, "바뀐 파일은 재료로 모으지 않는다 — 한 장을 만들 때 그 단계의 훅 알림에서");
  assert.deepEqual(SH.add({}, 9, "chat", "가", ID), {}, "모르는 단계는 버린다");
  assert.deepEqual(SH.add({}, 2, "chat", "   ", ID), {}, "빈 줄은 버린다");
});

test("가리기가 없으면 모으지 않는다 — 가리는 함수를 넘기지 않으면 받은 것 그대로(실패하면 닫힌 쪽으로)", () => {
  assert.deepEqual(SH.add({}, 2, "chat", `열쇠 ${KEY}`), {});
  assert.deepEqual(SH.add({}, 2, "chat", "가", "가리기 아님"), {});
});

test("저장된 재료 읽기 — 고장 난 기록은 빈 값, 모양이 맞는 줄만", () => {
  assert.deepEqual(SH.fromSaved(null), {});
  assert.deepEqual(SH.fromSaved("깨짐"), {});
  assert.deepEqual(SH.fromSaved({ 2: [{ k: "chat", t: "가", c: 1 }, { k: "몰라", t: "나", c: 1 }, { k: "file", t: 3, c: 1 }], 9: [{ k: "chat", t: "x", c: 1 }] }), { 2: [{ k: "chat", t: "가", c: 1 }] });
});

const MATS = [{ k: "chat", t: "신청 단추부터 만들래요", c: 1 }, { k: "report", t: "신청 화면을 만들었어요", c: 2 }, { k: "approve", t: "허용 — Edit", c: 2 }, { k: "approve", t: "거절 — Bash", c: 1 },
  { k: "feed", t: "할 일", c: 2 }, { k: "feed", t: "뺀 구간", c: 3 }];

test("한 장 초안 — 다섯 칸(생각 · 한 일 · 정한 것 · 배운 말 · 다음 할 일)을 재료 · 적은 칸 · 용어로, 규칙만으로", () => {
  const s = SH.draft({ title: "꼭 필요한 기능 정리하기", mats: MATS, cells: [{ name: "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", line: "신청하면 앱은 받는다" }, { name: "'빨리' 같은 말을 숫자로 바꾸기", line: "" }],
    terms: ["EARS", "EARS", "우선순위"], files: ["src/apply.js", "src/list.js"], next: "4단계 · 만드는 방법 고르기" }, { redact: ID });
  assert.deepEqual(Object.keys(s), SH.FIELDS.map(([k]) => k));
  assert.match(s.think, /신청 단추부터 만들래요/, "생각 — 이 단계에서 처음 한 말");
  assert.match(s.did, /맡긴 일 보고 2/); assert.match(s.did, /신청 화면을 만들었어요/); assert.match(s.did, /바뀐 파일 2/); assert.match(s.did, /src\/apply\.js/);
  assert.match(s.decided, /신청하면 앱은 받는다/); assert.match(s.decided, /허용 2/); assert.match(s.decided, /거절 1/);
  assert.equal(s.words, "EARS · 우선순위");
  assert.match(s.did, /뺀 구간 3(?! 1)/, "먹인 글 — 종류마다 수 한 번");
  assert.equal(s.next, "4단계 · 만드는 방법 고르기");
  for (const v of Object.values(s)) assert.ok(v.length <= SH.FIELD_MAX);
  const empty = SH.draft({ title: "아이디어 적어 두기", mats: [], cells: [], terms: [], files: [], next: "" }, { redact: ID });
  assert.match(empty.think, /아이디어 적어 두기/); assert.ok(empty.did && empty.decided && empty.words && empty.next, "비어도 칸마다 쉬운 말 한 줄");
});

test("한 장 모양 — ok · 문서 줄 · 다시 읽기가 맞물린다, 모르는 칸 · 너무 긴 글 · 날짜 모양이 틀리면 거절", () => {
  const s = { think: "가", did: "나", decided: "다", words: "라", next: "마", at: "2026-10-30" };
  assert.equal(SH.ok(s), true);
  assert.equal(SH.ok({ ...s, at: undefined }), true, "날짜는 없어도");
  for (const bad of [null, "가", { ...s, extra: "x" }, { ...s, think: 3 }, { ...s, did: "가".repeat(SH.FIELD_MAX + 1) }, { ...s, at: "어제" }, { think: "가" }]) assert.equal(SH.ok(bad), false, JSON.stringify(bad));
  const lines = SH.toLines(s);
  assert.deepEqual(lines, ["- 생각: 가", "- 한 일: 나", "- 정한 것: 다", "- 배운 말: 라", "- 다음 할 일: 마", "- 확인한 날: 2026-10-30"]);
  assert.deepEqual(SH.parse(lines), s);
  assert.equal(SH.parse(["- 생각: 가"]), null, "칸이 모자라면 한 장이 아니다");
  const long = SH.parse(["- 생각: " + "가".repeat(900), ...lines.slice(1)]);
  assert.equal(SH.ok(long), true, "손으로 길게 고쳐도 다시 읽은 한 장은 모양에 맞는다(잘라서)");
  assert.ok(long.think.length <= SH.FIELD_MAX);
  assert.equal(SH.parse([...lines.slice(0, 5), "- 확인한 날: 어제"]).at, undefined, "날짜 모양이 아니면 날짜 없이");
});

test("한 장 초안을 가린다 — 바뀐 파일 이름 · 적은 줄의 비밀값 모양, 배운 말도 칸 크기 안", () => {
  const s = SH.draft({ title: "t", mats: [], cells: [{ name: "칸", line: `열쇠 ${KEY}` }], terms: ["가".repeat(400)], files: [`keys/${KEY}.txt`], next: "" }, { redact: Sensitive.redact });
  assert.ok(!JSON.stringify(s).includes(KEY));
  assert.ok(s.words.length <= SH.FIELD_MAX);
  assert.deepEqual(SH.draft({ title: "t" }), null, "가리는 함수가 없으면 초안을 만들지 않는다");
});

const it = (name, line) => ({ name, lines: [line], by: "me" });
const R0 = { title: "t", items: Nav.STAGES[0].criteria.map((c) => it(c.text, `${c.text} 줄`)) };
const SHEET = { think: `처음 말 ${KEY}`, did: "맡긴 일 보고 1개", decided: "불편: 단톡방", words: "EARS", next: "2단계", at: "2026-10-30" };

test("단계 문서 · README — 확인한 한 장은 단계 문서의 '한 장' 절과 README의 그 단계 절에(가린 채), 다시 읽으면 그대로 돌아온다(C-49)", () => {
  const files = D.files({ topic: "앱", results: { 0: { ...R0, at: "2026-10-30", sheet: SHEET }, 1: { title: "t", items: [it("왜", "헷갈려서")] } }, redact: Sensitive.redact });
  const doc = files.find((f) => f.path === "docs/01-idea/idea.md").text, readme = files.find((f) => f.path === "README.md").text;
  assert.match(doc, /## 한 장\n\n- 생각: 처음 말 /);
  assert.ok(!doc.includes(KEY) && !readme.includes(KEY), "쓰기 전에 가린다");
  assert.match(readme, /### 1단계 · .+ — 한 장\n- 생각: /, "README의 그 단계 절");
  assert.doesNotMatch(files.find((f) => f.path === "docs/02-plan/plan.md").text, /## 한 장/, "확인 전 단계에는 없다");
  const back = D.parseStage(doc);
  assert.equal(back.result.items.length, R0.items.length, "한 장은 할 일 칸이 아니다");
  assert.deepEqual(Object.keys(back.result.sheet), ["think", "did", "decided", "words", "next", "at"]);
  assert.equal(back.result.sheet.decided, "불편: 단톡방");
});

// 서버 — POST /api/docs가 한 장을 받아 쓰고, 모양이 틀리면 400
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-sheet-"));
const DIR = path.join(TMP, "proj"); fs.mkdirSync(path.join(DIR, ".git"), { recursive: true });
const STUB = path.join(TMP, "claude-stub.js");
fs.writeFileSync(STUB, `let i = ""; process.stdin.on("data", (d) => (i += d)); process.stdin.on("end", () => { process.stdout.write(JSON.stringify({ type: "result", is_error: false, result: "끝", total_cost_usd: 0, usage: { input_tokens: 1, output_tokens: 1 } })); setTimeout(() => process.exit(0), 30); });`);
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: STUB });
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
let Srv, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
function call(body, method = "POST") {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body), tok = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
    const req = http.request({ host: "127.0.0.1", port, path: "/api/docs", method, headers: { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), "X-Nav-Token": tok }, timeout: 5000 }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d)); res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}

test("POST /api/docs — 확인한 한 장을 받아 단계 문서 · README에 쓴다, 한 장 모양이 틀리면 400(아무것도 쓰지 않는다)", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const R1 = { title: "t", items: Nav.criteriaFor(1, "Xpress").map((c) => it(c.text, `${c.text} 줄`)) };
  const bad = await call({ topic: "앱", results: { 0: { ...R0, sheet: { ...SHEET, extra: "x" } }, 1: R1 } });
  assert.equal(bad.status, 400, bad.text); assert.match(bad.json.reason, /1단계 결과의 모양/);
  assert.ok(!fs.existsSync(path.join(DIR, "README.md")), "틀리면 아무것도 쓰지 않는다");
  const r = await call({ topic: "앱", results: { 0: { ...R0, sheet: SHEET }, 1: R1 } });
  assert.equal(r.status, 200, r.text);
  assert.match(read(path.join(DIR, "docs/01-idea/idea.md")), /## 한 장\n\n- 생각: 처음 말 \[/);
  assert.match(read(path.join(DIR, "README.md")), /— 한 장\n- 생각: /);
  assert.ok(!read(path.join(DIR, "README.md")).includes(KEY));
  await new Promise((res) => setTimeout(res, 300));
  // 사람이 폴더의 한 장을 길게 고쳤다 → 다시 읽기(GET) → 그대로 다시 올려도(POST) 400이 아니다 — 막다른 길이 없다
  const f = path.join(DIR, "docs/01-idea/idea.md");
  fs.writeFileSync(f, read(f).replace(/^- 한 일: .*$/m, `- 한 일: ${"나".repeat(700)}`));
  const g = await call(undefined, "GET");
  assert.equal(g.status, 200, g.text);
  const back = g.json.stages[0].result;
  assert.ok(back.sheet && back.sheet.did.length <= SH.FIELD_MAX, "다시 읽은 한 장은 칸 크기 안");
  const again = await call({ topic: "앱", results: { 0: back, 1: R1 } });
  assert.equal(again.status, 200, again.text);
  await new Promise((res) => setTimeout(res, 300));
});

test("화면에 이어졌다 — 조각 48-sheet: 재료 저장 · 누르기 넷 · 규칙만(AI를 부르지 않는다), 재료를 모으는 네 곳, 채팅 카드 자리, 스크립트 · 서버 목록", () => {
  const frag = read(path.join(FRONT, "app/48-sheet.js"));
  assert.match(frag, /keep\(\["mats"\]\)/);
  assert.match(frag, /Object\.assign\(ACT, \{[\s\S]*"sheet-ok"[\s\S]*"sheet-edit"[\s\S]*"sheet-save"[\s\S]*"sheet-later"/);
  assert.doesNotMatch(frag, /callAI|askAI|fetch\(/, "한 장은 규칙으로 — 연습 모드에서도 서버 없이");
  assert.match(read(path.join(FRONT, "app/40-quest.js")), /mat\("chat", t\)/, "내가 적어 보낸 말");
  assert.match(read(path.join(FRONT, "app/70-tasks.js")), /mat\("report", /, "맡긴 일 보고");
  assert.match(read(path.join(FRONT, "app/70-tasks.js")), /mat\("approve", /, "허락 결정");
  assert.match(read(path.join(FRONT, "app/20-feed.js")), /mat\("feed", /, "먹이 구간의 종류");
  assert.doesNotMatch(read(path.join(FRONT, "app/70-tasks.js")).match(/mat\("approve", [^;]*\)/)[0], /what|lines/, "허락 결정은 도구 이름만 — 도구 입력은 남기지 않는다");
  assert.match(read(path.join(FRONT, "app/40-quest.js")), /\$\{sheetHTML\(\)\}\$\{proposalsHTML\(\)\}/);
  const html = read(path.join(FRONT, "index.html"));
  assert.ok(html.indexOf("navigator/sheet.js") > 0 && html.indexOf("navigator/sheet.js") < html.indexOf("navigator/docs.js"), "sheet.js는 docs.js보다 먼저");
  assert.match(read(path.join(BACK, "server.js")), /"sheet\.js"/);
});

test("화면 — 가리기가 없으면 모으지도 카드를 띄우지도 않는다, 연습의 허락은 세지 않는다, 폴더에서 다시 읽어도 맞아요 한 한 장은 남는다, 낡음 · 관문에서 다시", () => {
  const frag = read(path.join(FRONT, "app/48-sheet.js")), tasks = read(path.join(FRONT, "app/70-tasks.js")), know = read(path.join(FRONT, "app/45-knowledge.js"));
  assert.match(frag, /function mat\(kind, text\) \{ if \(!SH \|\| !window\.NavSensitive\) return;/, "가리기가 없으면 모으지 않는다");
  assert.match(frag, /const sheetFor = \(\) => \{[^\n]*window\.NavSensitive/, "가리기가 없으면 카드도 없다");
  assert.match(frag, /floeDoc/, "Floe가 쓴 단계 문서 · 기획서는 바뀐 파일에서 뺀다");
  assert.match(frag, /"sheet-ok": \(\) => \{[^\n]*sheetShown/, "맞아요는 보인 초안 그대로");
  const ap = tasks.slice(tasks.indexOf("async function decideApproval"));
  assert.ok(ap.indexOf('mat("approve"') > ap.indexOf('if (apMode !== "live")'), "연습의 허락 결정은 재료로 세지 않는다");
  const rr = know.slice(know.indexOf('"restore-read": () =>'));
  assert.match(rr.slice(0, 1200), /old\.sheet/, "폴더의 글로 다시 읽어도 맞아요 한 한 장(아직 안 올림)은 남는다");
  assert.ok(!know.includes("한 장 낡음"), "캔버스 ③ 칸('한 장 낡음' 표시)은 2026-11-02에 뺐다 — 낡음은 되살리기 카드(restore)가 말한다");
  assert.match(read(path.join(FRONT, "app/20-feed.js")), /\$\{sheetGate\(n\)\}/, "관문의 배운 것 칸에 그 단계의 한 장(또는 확인하기)");
  assert.match(frag, /"sheet-open"/);
});
