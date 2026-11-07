// claude-drafted: 2026-10-29 — 지식 퀘스트 C-49(지식 퀘스트 PRD 6절 · 9절 3 · 4번, 결정 모음 A-14): 기록의 원본은 내 프로젝트 폴더.
//   ① docs.js parseStage — Floe가 쓴 단계 문서를 다시 읽어 단계 결과로(사람이 손으로 고친 글도 그대로) ② GET /api/docs — 폴더의 단계 문서마다 결과 · 글 지문
//   ③ POST /api/docs가 쓴 단계 문서의 지문을 돌려준다(화면이 기억해 '낡음'을 알아본다) ④ 화면: 브라우저 기록이 없으면 되살리기 · 지문이 다르면 다시 읽기 · 없어졌으면 '근거 없음'(지우지 않음)
// 실행: node --test 04-tests/navigator/knowledge-restore.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator"), FRONT = path.join(__dirname, "../../02-frontend/navigator");
const D = require(path.join(BACK, "docs.js"));
const Nav = require(path.join(BACK, "navigator.js"));
const Q = require(path.join(BACK, "quest.js"));

const it = (name, lines, extra = {}) => ({ name, lines, ...extra });
const RESULTS = {
  0: { chap: 0, title: "동아리 앱", at: "2026-10-28", passed: "2026-10-28", learned: "",
    items: Nav.STAGES[0].criteria.map((c, i) => it(c.text, [`${c.text} 줄 | 표 칸`, ...(i === 0 ? ["둘째 줄"] : [])], { by: ["ok", "edit", "me", "pick"][i], ...(i === 1 ? { draft: "플로로 초안" } : i === 0 ? { draft: "그대로 쓴 초안" } : {}) })),
    check: [{ text: "불편을 한 문장으로", met: true, evidence: "적음 \\ 역슬래시" }, { text: "누가 쓰는지", met: false, evidence: "" }] },
  1: { chap: 1, title: "동아리 앱", at: "2026-10-29", passed: "2026-10-29", learned: "# 칸을 먼저 채우니\n빠진 기능이 보였다", goal: { changed: "신청과 출석까지" }, prep: ["준비 하나"],
    items: Nav.criteriaFor(1, "Xpress").map((c) => it(c.text, [`${c.text} 정함`], { by: "chat", draft: "대화로 낸 초안", from: [{ s: 0, i: 2 }] })), checkBy: "confirm",
    check: [{ text: "기획서 칸", met: true, skipped: true, evidence: "" }], skip: { reason: "발표 뒤에 재요", items: ["기획서 칸"] } },
  2: { chap: 2, title: "동아리 앱", at: "2026-10-29", goal: { same: true }, nocode: true, items: [it(Nav.criteriaFor(2, "Xpress")[0].text, [], { by: "moved", from: [{ s: 1, i: 1 }, { s: 1, i: 3 }] })] },   // 짧은 이름 안에 ' · '(왜 · 어디까지 · 언제 성공 · 남의 정보 · 밖으로) — 새 맥락 리뷰
};
const FILES = D.files({ topic: "동아리 앱", idea: "신청을 모으고 싶어요", results: RESULTS, redact: (x) => x });
const docText = (n) => FILES.find((f) => f.path === D.stagePath(n)).text;

test("C-49 parseStage — Floe가 쓴 단계 문서를 단계 결과로 되읽는다(칸 · 줄 · 누가 · 초안 · 재료 · 배운 것 · 처음 뜻 · 날짜 · 준비할 것 · 완료 기준 · 넘긴 까닭)", () => {
  for (const n of [0, 1, 2]) {
    const r = D.parseStage(docText(n));
    assert.ok(r, `${n + 1}단계 문서를 읽는다`);
    assert.equal(r.n, n); assert.equal(r.topic, "동아리 앱");
    const want = RESULTS[n];
    assert.deepEqual(r.result.items.map((x) => x.name), want.items.map((x) => x.name), "칸 이름(원래 문장)");
    assert.deepEqual(r.result.items.map((x) => x.lines), want.items.map((x) => x.lines), "줄 — 표 칸 · 역슬래시 그대로");
    assert.equal(r.result.at, want.at); assert.equal(r.result.passed, want.passed);
  }
  const r0 = D.parseStage(docText(0)).result, r1 = D.parseStage(docText(1)).result, r2 = D.parseStage(docText(2)).result;
  assert.deepEqual(r0.items.map((x) => x.by), ["ok", "edit", "me", "pick"]); assert.equal(r0.items[1].draft, "플로로 초안");
  assert.equal(r0.learned, "", "비어 있음 → 빈 글"); assert.equal(r2.learned, undefined, "아직 → 없음");
  assert.equal(r1.learned, "# 칸을 먼저 채우니\n빠진 기능이 보였다", "줄머리 #은 되돌린다");
  assert.deepEqual(r1.goal, { changed: "신청과 출석까지" }); assert.deepEqual(r2.goal, { same: true }); assert.equal(r0.goal, undefined);
  assert.deepEqual(r1.prep, ["준비 하나"]); assert.equal(r1.checkBy, "confirm");
  assert.deepEqual(r1.items[0].from, [{ s: 0, i: 2 }], "재료 — 1단계 Ⅲ");
  assert.deepEqual(r0.check, [{ text: "불편을 한 문장으로", met: true, evidence: "적음 \\ 역슬래시" }, { text: "누가 쓰는지", met: false, evidence: "" }]);
  assert.deepEqual(r1.check, [{ text: "기획서 칸", met: true, skipped: true, evidence: "" }]); assert.equal(r1.skip.reason, "발표 뒤에 재요");
  assert.equal(r2.passed, undefined, "관문 아직");
  assert.equal(r0.items[0].draft, "그대로 쓴 초안", "그대로(ok) 칸의 초안도"); assert.equal(r1.items[0].draft, "대화로 낸 초안", "대화(chat) 칸의 초안도");
  assert.deepEqual(r2.items[0].from, [{ s: 1, i: 1 }, { s: 1, i: 3 }], "짧은 이름에 ' · '가 있어도 재료"); assert.equal(r2.items[0].by, "moved"); assert.deepEqual(r2.items[0].lines, []);
  assert.equal(r2.nocode, true, "코드 없이 지남(F-70)");
});

test("C-49 parseStage — 사람이 손으로 고친 줄은 그 글대로, Floe 단계 문서가 아니면(틀 · 다른 글) null", () => {
  const edited = docText(0).replace(`${Nav.STAGES[0].criteria[2].text} 줄 | 표 칸`, "손으로 고친 줄");
  assert.deepEqual(D.parseStage(edited).result.items[2].lines, ["손으로 고친 줄"]);
  const placeholder = FILES.find((f) => f.path === "docs/04-design/README.md").text;
  assert.equal(D.parseStage(placeholder), null, "아직인 단계의 틀");
  assert.equal(D.parseStage("# 내 메모\n\n아무 글"), null);
  assert.equal(D.parseStage(""), null);
  // 되읽은 결과로 다시 쓰면 같은 문서(같은 파일을 고쳐 쓴다 — 새 파일을 쌓지 않는다)
  const again = D.files({ topic: "동아리 앱", idea: "신청을 모으고 싶어요", results: Object.fromEntries([0, 1, 2].map((n) => [n, { chap: n, title: "동아리 앱", ...D.parseStage(docText(n)).result }])), redact: (x) => x });
  for (const n of [0, 1, 2]) assert.equal(again.find((f) => f.path === D.stagePath(n)).text, docText(n), `${n + 1}단계 문서가 그대로`);
});

test("C-49 parseStage — 새 맥락 리뷰: 사람이 쓴 '어떻게: · 재료:' 줄은 칸 끝의 Floe 줄이 아니면 그대로 · 처음 말한 것 · 비운 배운 것 · &와 < · 받은 글 전부", () => {
  const r = { 0: { title: "t", passed: "2026-10-28", learned: "A &lt; B < C & D", items: [it(Nav.STAGES[0].criteria[0].text, ["어떻게: 직접 해 봤다", "재료: 종이 1단계 Ⅱ"], { by: "me" }), ...Nav.STAGES[0].criteria.slice(1).map((c) => it(c.text, ["x"]))] } };
  const f = D.files({ topic: "t", idea: "신청을 “한곳에” 모으고 싶어요", source: "신청을 “한곳에” 모으고 싶어요\n\n둘째 줄", results: r, redact: (x) => x });
  const p = D.parseStage(f.find((x) => x.path === D.stagePath(0)).text);
  assert.deepEqual(p.result.items[0].lines, ["어떻게: 직접 해 봤다", "재료: 종이 1단계 Ⅱ"], "사람 줄은 그대로"); assert.equal(p.result.items[0].by, "me"); assert.equal(p.result.items[0].from, undefined, "재료를 지어내지 않는다");
  assert.equal(p.idea, "신청을 “한곳에” 모으고 싶어요", "처음 말한 것");
  assert.equal(p.result.learned, "A &lt; B < C & D", "&와 <가 그대로 돌아온다");
  assert.equal(D.parseSource(f.find((x) => x.path === "docs/00-source/idea.md").text), "신청을 “한곳에” 모으고 싶어요\n\n둘째 줄");
  const emptied = f.find((x) => x.path === D.stagePath(0)).text.replace(/## 배운 것\n\n[^#]*?\n\n## 증빙/, "## 배운 것\n\n## 증빙");
  assert.equal(D.parseStage(emptied).result.learned, "", "사람이 배운 것 칸을 비우면 비어 있음");
});

// ── 서버 — GET /api/docs · POST /api/docs의 지문 ──
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-restore-"));
const DIR = path.join(TMP, "proj");
fs.mkdirSync(path.join(DIR, ".git"), { recursive: true });
const STUB = path.join(TMP, "claude-stub.js");
fs.writeFileSync(STUB, `process.stdin.on("data", () => {}); process.stdin.on("end", () => { process.stdout.write(JSON.stringify({ type: "result", is_error: false, result: "끝", total_cost_usd: 0, usage: { input_tokens: 1, output_tokens: 1 } })); setTimeout(() => process.exit(0), 30); });`);
fs.writeFileSync(path.join(TMP, "replay.json"), "{}");
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json"), NAV_CLAUDE_BIN: STUB });
for (const k of ["NAV_RECORD", "NAV_TOKENS_FILE", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]) delete process.env[k];
let Srv, srv, port;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken();
});
after(() => { if (srv) srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
async function call(method, p, body) {
  const tok = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method, headers: { "Content-Type": "application/json", Cookie: `nav_token=${tok}`, "X-Nav-Token": tok }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}
async function untilDone() { for (let k = 0; k < 100; k++) { const t = (await call("GET", "/api/task")).json.task; if (!t || t.state !== "running") return; await new Promise((r) => setTimeout(r, 50)); } }

test("C-49 서버 — POST /api/docs가 쓴 단계 문서의 글 지문(prints)을 돌려주고, GET /api/docs가 폴더의 단계 문서를 되읽어 결과와 지문을 준다", async () => {
  assert.equal(Srv.useProject(DIR), true);
  const results = Object.fromEntries([0, 1, 2].map((n) => { const { chap, ...r } = RESULTS[n]; return [n, r]; }));
  const w = await call("POST", "/api/docs", { topic: "동아리 앱", idea: "신청을 모으고 싶어요", results });
  assert.equal(w.status, 200, w.text);
  await untilDone();
  assert.deepEqual(Object.keys(w.json.prints).sort(), [0, 1, 2].map((n) => D.stagePath(n)).sort(), "끝낸 단계 문서만(틀 · 기획서 · 결정 기록은 아님)");
  for (const p of Object.keys(w.json.prints)) assert.match(w.json.prints[p], /^[0-9a-f]{16}$/);
  const r = await call("GET", "/api/docs");
  assert.equal(r.status, 200, r.text); assert.equal(r.json.ok, true);
  assert.deepEqual(Object.keys(r.json.stages).sort(), ["0", "1", "2"]);
  for (const n of [0, 1, 2]) {
    const s = r.json.stages[n];
    assert.equal(s.path, D.stagePath(n)); assert.equal(s.print, w.json.prints[s.path], "쓴 지문과 같다");
    assert.deepEqual(s.result.items.map((x) => x.lines), RESULTS[n].items.map((x) => x.lines));
  }
  assert.equal(r.json.topic, "동아리 앱");
  // 손으로 고치면 지문이 바뀐다(낡음) · 지우면 그 단계가 없다(근거 없음)
  const f1 = path.join(DIR, D.stagePath(1));
  fs.writeFileSync(f1, fs.readFileSync(f1, "utf8").replace(`${RESULTS[1].items[0].name} 정함`, "손으로 고침"));
  fs.rmSync(path.join(DIR, D.stagePath(2)));
  const r2 = await call("GET", "/api/docs");
  assert.notEqual(r2.json.stages[1].print, w.json.prints[D.stagePath(1)]); assert.deepEqual(r2.json.stages[1].result.items[0].lines, ["손으로 고침"]);
  assert.equal(r2.json.stages[2], undefined);
  assert.equal(r.json.stages[0].lossless, true, "Floe가 쓴 그대로면 다시 써도 같은 글");
  // 줄 끝만 CRLF로 바뀐 것(git autocrlf)은 같은 지문 — 낡음이 아니다
  const f0 = path.join(DIR, D.stagePath(0));
  fs.writeFileSync(f0, fs.readFileSync(f0, "utf8").replace(/\n/g, "\r\n"));
  // 지문을 주고 올리면, 사람이 고친(지문이 다른) 단계 문서는 덮지 않는다(kept) — 기록의 원본은 폴더
  const known = { [D.stagePath(0)]: w.json.prints[D.stagePath(0)], [D.stagePath(1)]: w.json.prints[D.stagePath(1)] };
  const again = await call("POST", "/api/docs", { topic: "동아리 앱", idea: "신청을 모으고 싶어요", results, prints: known });
  assert.equal(again.status, 200, again.text); await untilDone();
  assert.deepEqual(again.json.kept, [D.stagePath(1)], "고친 2단계 문서는 그대로");
  assert.match(fs.readFileSync(f1, "utf8"), /손으로 고침/); assert.ok(!again.json.files.includes(D.stagePath(1)), "Claude Code에 올리라고 넘기는 목록에도 없다");
  assert.ok(again.json.files.includes(D.stagePath(2)), "없어진 문서는 다시 만든다");
  assert.equal((await call("POST", "/api/docs", { topic: "동아리 앱", results, prints: { "docs/x.md": "0123456789abcdef" } })).status, 400, "지문의 모양");
  assert.equal((await call("POST", "/api/docs", { topic: "동아리 앱", results, keep: ["../x.md"] })).status, 400, "keep의 모양");
  assert.match(again.json.key, /^[0-9a-f]{16}$/, "폴더 열쇠(경로를 내지 않는다)"); assert.equal(again.json.key, r.json.key);
  // 화면이 모르는(지문도 keep도 없는) 문서는 Floe 것으로 보고 쓴다 — '새로 시작' 뒤 옛 문서가 잠기지 않게(새 맥락 리뷰). keep에 있으면 덮지 않는다
  fs.writeFileSync(path.join(DIR, D.stagePath(0)), "옛 프로젝트의 글\n");
  const unknown = await call("POST", "/api/docs", { topic: "동아리 앱", idea: "신청을 모으고 싶어요", results, prints: {}, keep: [D.stagePath(1)] });
  assert.equal(unknown.status, 200, unknown.text); await untilDone();
  assert.ok(unknown.json.files.includes(D.stagePath(0)), "모르는 문서는 다시 쓴다"); assert.deepEqual(unknown.json.kept, [D.stagePath(1)], "keep은 덮지 않는다");
  // 있지만 Floe가 읽을 수 없게 바뀐 문서 — result null(지우지도 덮지도 않는다)
  fs.writeFileSync(f1, "# 2단계: 내 마음대로\n");
  assert.equal((await call("GET", "/api/docs")).json.stages[1].result, null);
  // 바로가기 · 너무 큰 파일은 읽지 않는다
  fs.rmSync(f1); let linked = true; try { fs.symlinkSync(path.join(TMP, "replay.json"), f1); } catch { linked = false; }   // 링크를 못 만드는 컴퓨터(Windows 권한)는 이 확인만 건너뛴다(readme-api.test.js와 같다)
  if (linked) assert.equal((await call("GET", "/api/docs")).json.stages[1], undefined, "바로가기는 읽지 않는다");
  Srv.dropProject(DIR);
  const none = await call("GET", "/api/docs");
  assert.equal(none.json.ok, true); assert.equal(none.json.why, "folder"); assert.deepEqual(none.json.stages, {});
});

test("C-49 화면 — 지문을 기억하고(KEEP docPrints), 폴더를 알면 한 번 묻고, 되살리기 · 다시 읽기 · 근거 없음은 지우지 않는다", () => {
  const app = fs.readFileSync(path.join(FRONT, "app.js"), "utf8");
  assert.match(app, /keep\(\[[^\]]*"docPrints"/, "지문을 저장한다(45-knowledge 조각이 keep으로)");
  assert.match(app, /wrote: \{ \.\.\.\(same \? P\.wrote : \{\}\), \.\.\.w \}/, "올린 뒤 Floe가 쓴 지문을 기억");
  assert.match(app, /\.\.\.\(known \? \{ prints: known\.prints, keep: known\.keep \} : \{\}\)/, "올릴 때 아는 지문 · 사람 것을 준다 — 서버가 사람이 고친 문서는 덮지 않는다");
  assert.match(app, /if \(!st\.idea && \(d\.source \|\| d\.idea\)\) st\.idea = String\(d\.source \|\| d\.idea\)\.slice\(0, N\.IDEA_MAX\);/, "처음 말한 것도 되살린다 — 통째 글(idea.md)이 있으면 그것에서, 문서의 앞 400자가 아니라(F-165)");
  assert.match(app, /if \(!mine\) return;/, "다른 폴더의 기록과 견주지 않는다");
  assert.match(app, /fetch\("\/api\/docs", \{ cache: "no-store" \}\)/, "폴더의 단계 문서를 읽는다");
  for (const a of ["restore-go", "restore-read", "restore-later"]) assert.match(app, new RegExp(`"${a}": `), a);
  assert.ok(!/delete st\.results\[/.test(app), "근거 없음이어도 기록을 지우지 않는다");
});
