// claude-drafted: 2026-11-05 — 사용자 시험(2026-11-05, "식물 물 주기 알림 웹앱"으로 1 ~ 8단계를 앱에서 끝까지)에서 본 것을 고친 묶음 F-157의 시험.
//   임유정 "1번 제외하고 나머지 2~6번, 플로로 말 어긋난 것(사소한 것 포함) 전부 고쳐줘". 화면(app.js)은 글 · 규칙 시험, 서버 규칙은 함수 시험.
// 실행: node --test 04-tests/navigator/user-test-1105.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const N = require("../../03-backend/navigator/navigator.js");
const S = require("../../03-backend/navigator/queststate.js");
const AP = require("../../03-backend/navigator/approve.js");
const ST = require("../../03-backend/navigator/steps.js");
const SH = require("../../03-backend/navigator/sheet.js");
const app = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
const crit = (n) => N.criteriaFor(n, "Xpress");
const R = (n, lines) => ({ stage: n, items: crit(n).map((c, i) => ({ name: c.text, lines: lines[i] === undefined ? [`${n + 1}단계 ${i + 1}번 줄`] : lines[i] })) });

test("F-157-1: 미리 받은 다음 단계 초안은 기준 카드가 바뀌면 쓰지 않는다 — 열쇠(preKey)에 기준 카드 글(baseText)이 들어간다", () => {
  assert.match(app, /const preKey = \(n, prev, tier = st\.tier\) => JSON\.stringify\(\[n, tier, ideaNow\(\), prev, baseText\(\)\]\)/);
});

test("F-157-2: 기준 카드의 '성공'에 숫자가 있으면 7단계 숫자 재기를 막지 않는다 — 2단계 Ⅱ가 '아직 모름'이어도", () => {
  const results = { 1: R(1, { 1: ["왜: 식물이 마르지 않게 · 어디까지: 알림만 · 언제 성공: 아직 모름"] }) };
  assert.equal(S.factsFrom({ results }).success, false, "카드가 없으면 그대로 — 2단계 Ⅱ만 본다");
  const card = { success: { text: "화분 5개를 넣었을 때 물 줄 날 아침에 알림이 하나씩 뜨면" } };
  assert.equal(S.factsFrom({ results, card }).success, true, "사람이 관문의 기준 카드에 적은 성공 숫자");
  assert.equal(S.factsFrom({ results, card: { success: { text: "아직 모름" } } }).success, false, "카드도 숫자가 없으면 막는다");
  assert.equal(S.stateOf({ stage: 6, i: 0, text: "", facts: S.factsFrom({ results, card }) }).state, "write");
  assert.match(app, /QS\.factsFrom\(\{ results: [\s\S]{0,300}card: st\.card/, "화면이 기준 카드를 넘긴다");
});

test("F-157-3: 7단계 '먼저'에서 지난 칸으로 가는 단추는 막다른 길이 아니다 — 채팅에서 그 칸을 바로 고쳐 적는다", () => {
  const go = app.slice(app.indexOf('"first-go": () =>'), app.indexOf('"first-notyet": () =>'));
  assert.ok(!/treeView = "flow"/.test(go), "고칠 수 없는 한눈에 보기로 보내지 않는다");
  assert.match(go, /pastFixAt = /, "다음에 보낸 말이 그 칸의 줄이 된다");
  assert.match(app, /if \(pastFixAt\) \{ const g = pastFixAt; pastFixAt = null; return fixPast\(g, t\); \}/, "send가 지난 칸 고치기를 먼저 본다");
  const fx = app.slice(app.indexOf("function fixPast("), app.indexOf("function fixPast(") + 900);
  assert.match(fx, /st\.results = \{ \.\.\.st\.results, \[g\.s\]:/, "지난 단계 결과의 그 칸을 바꾼다");
  assert.match(fx, /applyStates/, "지금 퀘스트의 상태를 다시 본다");
  assert.match(app, /title: `먼저 — \$\{esc\(QU\.shortOf\(q\.objs\[i\]\.name\)\)\}\$\{eun\(QU\.shortOf\(q\.objs\[i\]\.name\)\)\} 아직 할 수 없어요\.`/, "받침에 맞는 조사(숫자 재기는)");
});

test("F-157-4: 5단계 — 코드 파일이 없으면 '도는지 보기'는 먼저 코드를 묻는다(6단계와 같은 A-04). 코드 없이를 골랐거나 파일을 모르면 막지 않는다", () => {
  const SMOKE = "이어진 게 실제로 도는지 확인하기";
  const at = crit(4).findIndex((c) => c.text === SMOKE);
  assert.ok(at >= 0);
  const x = S.stateOf({ stage: 4, i: at, name: SMOKE, text: "", facts: { codeFiles: 0 } });
  assert.equal(x.state, "first"); assert.equal(x.code, true);
  assert.equal(S.stateOf({ stage: 4, i: at, name: SMOKE, text: "", facts: { codeFiles: 0, codeless: true } }).state, "write");
  assert.equal(S.stateOf({ stage: 4, i: at, name: SMOKE, text: "", facts: { codeFiles: 2 } }).state, "write");
  assert.equal(S.stateOf({ stage: 4, i: at, name: SMOKE, text: "", facts: { codeFiles: null } }).state, "write");
  assert.equal(S.stateOf({ stage: 4, i: 0, name: crit(4)[0].text, text: "", facts: { codeFiles: 0 } }).state, "write", "다른 칸은 그대로");
  assert.match(app, /if \(\(q\.chap === 4 \|\| q\.chap === 5\) && canLive && st\.mode === "live" && !st\.files && !filesAsked\)/, "5단계에서도 파일 목록을 한 번 받는다");
  assert.match(app, /title: "다 됐어요! 완료 보고할까요\?"[\s\S]{0,400}\.\.\.buildActs\(q\.chap\)/, "다 적은 뒤에도 뼈대 코드 맡기기 단추가 남는다");
});

test("F-157-4: 8단계 '저장소에 올리기' — 진짜 모드에서 푸시한 적이 없으면 먼저 올리기로, 올렸거나 모르면 막지 않는다", () => {
  const COMMIT = "마친 작업을 저장소에 올려 두기", at = crit(7).findIndex((c) => c.text === COMMIT);
  assert.ok(at >= 0);
  const x = S.stateOf({ stage: 7, i: at, name: COMMIT, text: "", facts: { pushed: false } });
  assert.equal(x.state, "first"); assert.equal(x.ship, true);
  assert.equal(S.stateOf({ stage: 7, i: at, name: COMMIT, text: "", facts: { pushed: true } }).state, "write");
  assert.equal(S.stateOf({ stage: 7, i: at, name: COMMIT, text: "", facts: { pushed: null } }).state, "write");
  assert.equal(S.factsFrom({ pushed: true }).pushed, true); assert.equal(S.factsFrom({}).pushed, null);
  assert.match(app, /if \(pushed\) \{ st\.pushedAt = Date\.now\(\);/, "올리기가 푸시까지 끝나면 시각을 남긴다");
  assert.match(app, /pushed: st\.mode === "live" && canLive \? pushedSince\(7\) : null/, "8단계 구분선 뒤에 올렸는지 — 2단계 뒤에 한 번 올린 것으로 늘 열리지 않게(새 맥락 리뷰 B)");
  assert.match(app, /foot: "'문서로 묶어 GitHub에'는 단계 문서만 올려요/, "문서만 올라간다고 밝힌다");
  assert.match(app, /keep\(\["pushedAt"\]\)/, "다시 켜도 기억한다");
  assert.match(app, /fx\.state === "first" && fx\.ship\) return \{[\s\S]{0,300}act: "ship-open"/, "카드는 올리기 단추로");
});

test("F-157-5: Windows의 PowerShell 허락 카드도 실행할 명령을 보인다 — 자동 허용(run)은 넓히지 않는다", () => {
  const c = AP.card({ tool_name: "PowerShell", tool_input: { command: "node demo.js example.json" }, cwd: "C:/p" });
  assert.equal(c.verb, "실행해요");
  assert.equal(c.what, "node demo.js example.json");
  assert.deepEqual(c.lines, ["node demo.js example.json"]);
  assert.equal(c.kind, "other", "자동 허용 종류(run)로 바꾸지 않는다 — 위험 명령 검사가 bash 기준이라");
  const d = AP.card({ tool_name: "PowerShell", tool_input: { command: "git push --force origin main" } });
  assert.ok(d.danger, "위험 명령 경고는 같이");
  assert.equal(AP.card({ tool_name: "Bash", tool_input: { command: "ls" } }).verb, "실행해요", "허락 카드는 아직 하지 않은 일 — '실행했어요'가 아니라 '실행해요'");
  const s = ST.fromHook({ hook_event_name: "PostToolUse", tool_name: "PowerShell", tool_input: { command: "npm test\nmore" } });
  assert.equal(s.verb, "실행했어요"); assert.equal(s.what, "npm test");
});

test("F-157-6: 한 장 — '처음 한 말'은 이 단계에서 처음 한 말, 바뀐 파일은 Claude Code가 일을 마치면 다시 받는다", () => {
  const d = SH.draft({ title: "뼈대 먼저 이어 보기", mats: [{ k: "chat", t: "뼈대는 어떻게 만들어요?", c: 1 }] }, { redact: (t) => t });
  assert.match(d.think, /이 단계에서 처음 한 말: “뼈대는 어떻게 만들어요\?”/);
  assert.match(app, /async function changesRefresh\(\)/);
  const ev = app.slice(app.indexOf("async function onEvent(ev)"), app.indexOf("async function lookAfterWork("));
  assert.match(ev, /changesRefresh\(\)/, "일을 마쳤다는 알림마다 바뀐 파일 목록을 다시");
});

test("F-157-7: 지난 알림의 '어디쯤인지 볼까요?'가 다음 단계까지 남지 않는다 — 단계를 시작하거나 넘으면 지운다", () => {
  const qs = app.slice(app.indexOf("const questStarted = () => {"), app.indexOf("const questStarted = () => {") + 300);
  assert.match(qs, /st\.ping = "";/);
  const adv = app.slice(app.indexOf("function advance() {"), app.indexOf("function advance() {") + 1400);
  assert.match(adv, /Object\.assign\(st, \{ screen: "main", notice: "", ping: "",/);
});

test("F-157-8: 플로로의 말 — 대화에서 만들기 · 돌리기를 물으면 그 단계의 맡기기 단추를 알려 준다", () => {
  assert.match(N.chatPrompt(4, "Xpress", { talk: [{ who: "me", text: "뼈대는 어떻게 만들어요?" }] }), /뼈대 코드 맡기기/);
  assert.match(N.chatPrompt(5, "Xpress", { talk: [{ who: "me", text: "어떻게 만들어요?" }] }), /기능 줄 맡기기[\s\S]*돌려 보기/);
  assert.ok(!/뼈대 코드 맡기기/.test(N.chatPrompt(1, "Xpress", { talk: [{ who: "me", text: "?" }] })), "다른 단계에는 없다");
});

test("F-157-9: 4단계 초안 — 고른 방법의 아쉬운 점이 기준의 성공과 부딪히면 짚는다 · 3단계 숫자로는 애매한 말만", () => {
  const p = N.stageDraftPrompt(3, "Xpress", { base: "성공: 물 줄 날 아침에 알림이 뜨면" });
  assert.match(p, /성공[^\n]*부딪/);
  const q = N.stageDraftPrompt(2, "Xpress", {});
  assert.match(q, /애매한 말이 없으면/);
});

test("F-157-10: 사소한 말 — 칸 수는 실제 칸 수로(다섯 칸 고정 말 없음), 확인 질문의 '맞아요'는 다음 단계 말보다 먼저", () => {
  assert.ok(!/다섯 칸 중 \$\{/.test(app), "'다섯 칸 중 n번째' — 칸이 넷인 장에서도 다섯이라 했다");
  assert.ok(!/`다섯 칸 \$\{c\.q\.k\}/.test(app));
  assert.match(app, /if \(r\.ok\) \{ say\(U\.FACE\.right\[1\]\); toNext\(\); return; \}/);
});

test("F-157 새 맥락 리뷰 반영 — 1단계 중에는 미리 받지 않는다(A) · 지난 칸 고치기는 사람이 쓴 줄로 · 다른 단추면 그만 · 칸은 이름으로(C · D · 제안 1) · 5단계 코드 없이도 기록(E) · 일을 마치면 파일 목록도 다시(F) · 다섯 칸 말 없음(G)", () => {
  const pre = app.slice(app.indexOf("function prefetch(q) {"), app.indexOf("function prefetch(q) {") + 400);
  assert.match(pre, /if \(q\.chap === 0\) return;/);
  const fx = app.slice(app.indexOf("function fixPast("), app.indexOf("function fixPast(") + 900);
  assert.match(fx, /lines: \[t\], by: "me"/);
  assert.match(app, /const pastIdx = \(g\) =>/);
  assert.match(app, /if \(pastFixAt && !\["send", "say", "first-go"[^\]]*\]\.includes\(t\.dataset\.act\)\) pastFixAt = null;/);   // F-161이 단추를 더했다
  assert.match(app, /const sayHint = \(\) => \(planNow\(\) \? [^\n]*: pastFixAt \? "그 칸의 고친 줄/, "입력 칸 안내가 그 칸 전용으로(planNow 판정은 맨 앞 그대로 — modes.test.js)");
  assert.equal(S.stateOf({ stage: 6, i: 0, text: "", facts: { success: false } }).go.name, "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기");
  assert.match(app, /\(st\.quest\.chap === 4 \|\| st\.quest\.chap === 5\) && st\.codeless/);
  assert.match(app, /if \(!ev\.sim\) \{ changesRefresh\(\); if \(st\.files && st\.files\.src === "mine"\) loadFiles\(\); \}/);
  const code = app.split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
  assert.ok(!/다섯 칸/.test(code), "주석 밖에 '다섯 칸' 고정 말이 없다");
});
