// claude-drafted: 2026-11-06 — 사용자 시험(2026-11-06, "가계부 CSV 월별 요약 명령줄 도구"로 처음 설정 → 1 ~ 8단계를 앱에서 끝까지)에서 본 것을 고친 묶음 F-161의 시험.
//   임유정 "막힘+불편 전부". 화면(app.js)은 글 · 규칙 시험, 서버 규칙 · 앱 쪽은 함수 · 글 시험.
// 실행: node --test 04-tests/navigator/user-test-1106.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const AP = require("../../03-backend/navigator/approve.js");
const STEPS = require("../../03-backend/navigator/steps.js");
const N = require("../../03-backend/navigator/navigator.js");
const read = (p) => fs.readFileSync(path.join(__dirname, "../..", p), "utf8");
const app = read("02-frontend/navigator/app.js");
const setup = read("02-frontend/navigator/setup.js");
const mainJs = read("02-frontend/electron/main.js");
const preload = read("02-frontend/electron/preload.js");
const slice = (s, from, len = 1200) => { const i = s.indexOf(from); assert.ok(i >= 0, `찾지 못함: ${from}`); return s.slice(i, i + len); };

test("F-161-1: 비밀값 모양이 든 지난 칸 때문에 맡기지 못하면 그 칸을 채팅에서 바로 고친다 — 막다른 길이 아니다", () => {
  assert.match(app, /const secretPast = \(text\) =>/, "지난 단계 결과에서 비밀값 모양이 든 칸을 찾는다 — 까닭이 된 글에 든 칸만");
  const fx = slice(app, "function fixSecretPast(");
  assert.match(fx, /pastFixAt = g/, "다음에 보낸 말이 그 칸의 줄이 된다(F-157-3과 같은 길)");
  assert.match(fx, /NavSensitive\.redact\(line\)/, "지금 줄은 가려서 보인다 — 키를 다시 보이지 않는다");
  assert.match(fx, /line = \(it\.lines \|\| \[\]\)\.join\(" · "\)/, "줄이 여럿이면 다 보인다(새 맥락 리뷰 보완 4)");
  assert.match(app, /맡기지 않았어요`\); return fixSecretPast\(secretPast\(job\.text\) \|\| secretPast\(null\)\) \|\| say\(/, "코드 맡기기가 거절되면 맡길 글에 든 지난 칸 고치기로");
  assert.match(app, /st\.warn\.then === "stage" && secretPast\(st\.warn\.text\) \? \[\{ label: "그 칸 고치기", act: "secret-fix"/, "단계 초안 경고에만, 그 글에 든 칸이 있을 때 그 칸 고치기");
  assert.match(app, /st\.warn = \{ w, then, text \}/);
  assert.match(app, /"secret-fix": \(\) =>/);
  assert.match(slice(app, "  function fixPast(g, t) {", 1400), /v\.by === "moved" && fresh\[k\] \? fresh\[k\] : v/, "기준 카드에 옮겨 온 칸도 고친 줄로 — 사람이 적은 칸은 그대로");
  const send = slice(app, "  function send() {", 2600);
  assert.ok(send.indexOf("return fixPast(g, t)") < send.indexOf('q.phase === "draft"'), "다음 단계 퀘스트를 받기 전(draft)에도 지난 칸이 고쳐진다 — 앱 확인에서 본 것");
});

test("F-161-1: 비밀값 경고에서 그만두면 왜 초안이 없는지 말하고, '초안 다시 받기'로 다시 받는다", () => {
  assert.match(slice(app, '"stop-send": () =>', 300), /초안 다시 받기/);
  assert.match(app, /\{ label: "초안 다시 받기", act: "stage-redraft"/);
  assert.match(slice(app, '"stage-redraft": () =>', 300), /stageDraft\(q\.chap\)/);
});

test("F-161-1: 플로로의 대화는 지난 칸을 고치는 없는 길을 지어내지 않는다 · 재료 번호([3-5])를 사람에게 쓰지 않는다", () => {
  const p = N.chatPrompt(4, "Xpress", { talk: [{ who: "me", text: "3단계 칸을 고치고 싶어요" }] });
  const all = JSON.stringify(p);
  assert.match(all, /지난 장의 카드는 읽기만 된다/);
  assert.match(all, /재료 번호\(\[3-5\] 같은 것\)는 사람에게 보이는 말에 쓰지 않고/);
});

test("F-161-2: 작업실에서 누른 복사도 된다 — 섬 창(포커스 없음)의 navigator.clipboard 대신 앱의 클립보드", () => {
  assert.match(preload, /copyText: \(text\) => ipcRenderer\.invoke\("floe:copy"/);
  const h = slice(mainJs, 'ipcMain.handle("floe:copy"', 300);
  assert.match(h, /fromIsland\(e\)/, "섬에서 온 것만");
  assert.match(h, /clipboard\.writeText\(text\)/);
  assert.match(mainJs, /require\("electron"\)/); assert.match(mainJs, /screen, clipboard \}/);
  assert.match(app, /const copyText = async \(t\) =>/);
  const direct = app.split("\n").filter((l) => /navigator\.clipboard\.writeText/.test(l) && !/const copyText/.test(l));
  assert.deepEqual(direct, [], "복사는 모두 copyText를 거친다(넘김 카드 · 막힘 글 · 느낀 점)");
  assert.match(slice(app, '"handoff-copy": async () =>', 500), /hoCopied = await copyText\(t\)/);
});

test("F-161-3: 칸에 바로 적는 말(고칠래요 · 지난 칸)에 비밀값 모양이 있으면 먼저 묻는다 — 막지 않고 그대로 적기 / 고칠게요", () => {
  const send = slice(app, "  function send() {", 2600);
  assert.match(send, /sensitive\(t\)\.length\) \{ st\.fillWarn = \{ t, w: sensitive\(t\) \}/);
  assert.ok(send.indexOf("st.fillWarn = ") < send.indexOf("return fixPast(g, t)"), "지난 칸에 적기 전에 묻는다");
  assert.match(app, /title: "적기 전에 잠깐!"/);
  assert.match(app, /\{ label: "고칠게요", act: "fill-fix"[^}]*\}, \{ label: "그대로 적기", act: "fill-anyway" \}/);
  assert.match(app, /!!st\.warn \|\| !!st\.fillWarn \|\| st\.busy/, "묻는 동안 섬이 접히지 않는다");
  assert.ok(!/"fillWarn"/.test(slice(app, "const KEEP = [", 600)), "물은 글은 저장하지 않는다");
});

test("F-161-4: Floe가 맡긴 일(문서 올리기 · 돌려 보기 …)이 끝난 알림은 '살펴봐 주세요' 카드를 띄우지 않는다", () => {
  assert.match(app, /function twStop\(\) \{ if \(tw\) twLast = \{ kind: tw\.kind, end: Date\.now\(\) \}/);
  assert.match(app, /const ownTask = \(\) =>/);
  const ev = slice(app, "  async function onEvent(ev) {", 3500);
  assert.match(ev, /const own = ev\.sim \? "" : ownTask\(\)/);
  assert.match(ev, /if \(!NO_REFIT\.has\(own\)\) scheduleRefit\(ev\)/, "문서 · 실행 일은 퀘스트를 다시 맞추지 않는다");
  assert.ok(ev.indexOf("if (own) return render();") > 0 && ev.indexOf("if (own) return render();") < ev.indexOf("st.ping = `"), "ping을 세우기 전에 돌아간다");
});

test("F-161-4: 조용히 하는 것은 결과가 코드 진행이 아닌 맡긴 일뿐 — 뼈대 · 기능 줄 · 넘긴 일은 전처럼 살펴본다(새 맥락 리뷰 보완 1)", () => {
  const src = slice(app, "  const OWN_MS = 30000", 400).split("\n").slice(0, 2).join("\n");
  const mk = (tw, twLast) => new Function("tw", "twLast", `${src}; return ownTask();`)(tw, twLast);
  assert.equal(mk({ kind: "ship" }, null), "ship");
  assert.equal(mk({ kind: "run" }, null), "run");
  assert.equal(mk({ kind: "build" }, null), "", "코드를 바꾸는 일은 전처럼");
  assert.equal(mk({ kind: "send" }, null), "");
  assert.equal(mk(null, { kind: "ship", end: Date.now() - 1000 }), "ship", "끝난 지 30초 안");
  assert.equal(mk(null, { kind: "ship", end: Date.now() - 60000 }), "", "오래전에 끝났으면 사람이 한 일");
});

test("F-161-3: 묻는 카드가 떠 있을 때 다른 단추를 누르면 카드를 걷는다 · 대상이 없으면 말한다(보완 3)", () => {
  assert.match(app, /if \(st\.fillWarn && !\["fill-fix", "fill-anyway", "say"\]\.includes\(t\.dataset\.act\)\) st\.fillWarn = null;/);
  assert.match(slice(app, "  function fillAnyway()", 600), /적을 칸이 바뀌어 적지 않았어요/);
});

test("F-161-5: '방금 바뀜' 띠 — 사람이 적은 칸은 '바뀐 칸'에서 빼고, 조사 없이 괄호로", () => {
  const b = slice(app, "  const refitBanner = (q) =>", 600);
  assert.match(b, /st\.refit\.changed\.filter\(\(i\) => !QU\.filled\(q, i\)\)/);
  assert.match(b, /적어 둔 칸\(\$\{/);
  assert.ok(!/은 다시 볼까요/.test(b));
});

test("F-161-6: 'GitHub 없이 할래요'를 고르면 저장소 만들기를 내놓지 않고 요약도 '건너뜀'", () => {
  assert.match(setup, /const offerRepo = \(s\) => !!\(!s\.ghSkip && githubReady\(s\.gh\)/);
  assert.match(setup, /const gh = s\.ghSkip \? "건너뜀/);
  assert.match(setup, /if \(a === "next"\) \{ if \(s\.step === "github"\) s\.ghSkip = false;/, "뒤로 가서 다음을 누르면 건너뜀을 푼다");
});

test("F-161-6: gh repo create · 공개 범위 바꾸기는 되돌리기 어려운 일 — 자동 허용하지 않고 섬에서 묻는다", () => {
  for (const tool of ["Bash", "PowerShell"]) {
    assert.match(AP.card({ tool_name: tool, tool_input: { command: "gh repo create ledger --private --source . --push" } }).danger, /저장소를 만들거나/);
    assert.match(AP.card({ tool_name: tool, tool_input: { command: "gh repo edit me/x --visibility public" } }).danger, /공개 범위/);
  }
  assert.equal(AP.card({ tool_name: "Bash", tool_input: { command: "gh repo view me/x" } }).danger, "", "읽기는 그대로");
  assert.equal(AP.card({ tool_name: "Bash", tool_input: { command: "git push origin main" } }).danger, "", "보통 푸시는 그대로");
});

test("F-161-7: 끝난 맡긴 일은 한 장의 재료 — '맡긴 일 · 바뀐 파일은 없었어요'가 되지 않게", () => {
  const t = slice(app, "  async function twTick() {", 2600);
  assert.match(t, /if \(t\.state === "done" && w\.kind !== "plan"\) mat\("report", \(t\.report && t\.report\.easy\) \|\| TASK_WORD\[w\.kind\]/);
  assert.match(app, /const TASK_WORD = \{ ship: "문서 올리기"/);
});

test("F-161-8: 빈칸 표시('(재고 적기)')가 든 틀은 칸에 적지 않고 입력 칸으로 — 잰 값으로 바꿔 보내야 적힌다", () => {
  const f = slice(app, "  function fillNow(t, by, at = QU.curIdx(st.quest)) {", 900);
  assert.match(f, /N\.BLANK_MARK\.test\(t\)/);
  assert.match(f, /st\.say = t; draftFixAt = at;/);
  assert.ok(f.indexOf("return say(") < f.indexOf("QU.fill(st.quest"), "칸에 적기 전에 돌아간다");
  assert.ok(N.BLANK_MARK.test("걸린 시간: (재고 적기) · 줄 수: (재고 적기)"));
});

test("F-161-9: 사소한 말 — 안쪽 도구 이름 · 마지막 단계 · 올린 곳 · 퀘스트 받기 · 지도", () => {
  assert.equal(STEPS.line({ ...STEPS.fromHook({ tool_name: "StructuredOutput", tool_input: {} }), tool_name: "StructuredOutput" }), "정리했어요 · 끝 조건 보고");
  assert.match(app, /s\.n === N\.STAGES\.length - 1 \? "마지막 단계예요/);
  assert.ok(!/GitHub에서 docs 폴더를 볼 수 있어요/.test(app));
  assert.ok(!/큰 단추로 받아 주세요/.test(app));
  assert.match(app, /st\.results\[1\] \? "지도 보기의 '기획서로 3 ~ 8단계 그리기'로 그려요" : "2단계에서 그려져요"/);
});

// F-161-1 보완(claude-drafted: 2026-11-07 — 임유정 "이번 대화에서 수정한 것들이 합리적인 버그 수정이야?" → 다시 읽다 찾은 구멍 → "고쳐 줘"):
//   5단계 맡길 글(build.js)은 줄의 공백을 한 칸으로 줄이고(norm) 길이를 자른다(cut) — 칸의 줄을 글자 그대로 찾으면 못 찾아 옛 막다른 길로 돌아갔다
test("F-161-1 보완: 맡길 글의 공백이 다르거나 잘렸어도 비밀값이 든 지난 칸을 찾는다 · 못 찾으면 비밀값이 든 아무 지난 칸", () => {
  const at = app.indexOf("  const secretPast = "), line = app.slice(at, app.indexOf("return null; };", at) + "return null; };".length);
  const KEY = ["sk", "ant", "api03", "Zx9Qw8Er7Ty6Ui5Op4As3Df2Gh1Jk0LzXcVbNm"].join("-");   // 가짜 키 — 조각으로 지어 비밀값 검사(check-secrets)에 걸리지 않게
  const sensitive = (t) => (String(t).includes("sk-ant-") ? ["비밀번호나 비밀 열쇠"] : []);
  const st = { results: { 0: { items: [{ name: "a", lines: ["보통 줄"] }] }, 2: { items: [{ name: "b", lines: ["x"] }, { name: "막을 일", lines: [`카드번호는  찍지 않아요.\n키는 ${KEY} 이에요`] }] } } };
  const secretPast = new Function("st", "sensitive", `${line}; return secretPast;`)(st, sensitive);
  const norm = (t) => t.replace(/\s+/g, " ").trim();
  const job = `[3단계]\n- 막을 일: ${norm(st.results[2].items[1].lines[0])}`;
  assert.deepEqual(secretPast(job) && [secretPast(job).s, secretPast(job).i], [2, 1], "공백을 줄인 맡길 글에서도 그 칸");
  assert.deepEqual(secretPast(`- 막을 일: 카드번호는 찍지 않아요. 키는 ${KEY.slice(0, 30)}…`) && secretPast(`- 막을 일: 카드번호는 찍지 않아요. 키는 ${KEY.slice(0, 30)}…`).s, 2, "잘린 글에 든 키 조각으로도");
  assert.equal(secretPast(null).s, 2, "text가 null이면 아무 칸");
  assert.equal(secretPast("관계없는 글"), null, "그 글에 없으면 null — 경고 카드는 엉뚱한 칸으로 보내지 않는다");
  assert.match(app, /fixSecretPast\(secretPast\(job\.text\) \|\| secretPast\(null\)\)/, "맡길 글은 지난 칸으로만 지어지니 못 찾으면 비밀값이 든 아무 지난 칸으로");
});
