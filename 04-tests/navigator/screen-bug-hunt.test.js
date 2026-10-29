// claude-drafted: 2026-10-29 — F-102 묶음(화면 코드 점검, 임유정 "내 담당 화면부터"): 01-docs/07-maintenance/fixes/screen-bug-hunt.md
//   app.js의 함수를 글자에서 떼어 가짜 상태(st) · 가짜 fetch로 실제로 돌려 본다 — 글자 모양이 아니라 동작을 잰다.
// 실행: node --test 04-tests/navigator/screen-bug-hunt.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");

// `function name(` · `async function name(`의 본문을 괄호 짝으로 떼어 낸다 — 인자 기본값(`opt = {}`)을 건너뛰려 `) {`부터 센다
function fnSrc(name) {
  const at = a.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(at >= 0, `${name}를 찾지 못했어요`);
  let i = a.indexOf(") {", at) + 2, d = 0;
  for (; i < a.length; i++) { if (a[i] === "{") d++; else if (a[i] === "}" && --d === 0) break; }
  return a.slice(at, i + 1);
}
// 떼어 낸 함수를 넘긴 이름들(가짜 상태 · 도우미)이 보이는 자리에서 만든다
const make = (src, name, env) => new Function(...Object.keys(env), `${src}; return ${name};`)(...Object.values(env));

test("F-102-1 대화 — 비밀값 경고 뒤 '보낼게요'를 누르면 그 글(원문)이 AI로 간다, 그 전 메시지가 아니라", async () => {
  const sent = [];
  const st = { quest: { chap: 2, lines: [] }, mode: "live", tier: "lite", tidy: null, warn: null };
  const env = { st, canLive: true, QU: { curIdx: () => 0 }, render() {}, say() {}, fetchUsage() {}, ideaNow: () => "", talkOf: (t) => [{ who: "me", text: t }],
    guard: (t) => { if (!/secret/.test(t)) return false; st.warn = { then: "chat" }; return true; }, callAI: async (_, body) => { sent.push(body.talk[0].text); return { ok: true, reply: "네" }; } };
  const decl = a.match(/let chatText = "";/); assert.ok(decl, "chatText 선언");
  const chatSend = new Function(...Object.keys(env), `let chatText = ""; ${fnSrc("chatSend")}; return { chatSend, retry: () => chatSend(chatText, true) };`)(...Object.values(env));
  await chatSend.chatSend("앞에 보낸 말");
  await chatSend.chatSend("my secret 글");   // 경고에 걸려 멈춤
  await chatSend.retry();                    // RETRY.chat — "괜찮아요, 보낼게요"
  assert.deepEqual(sent, ["앞에 보낸 말", "my secret 글"]);
  assert.equal(st.warn, null, "보낸 뒤 경고 카드가 걷힌다 — 남으면 또 눌러 같은 글이 두 번 간다(새 맥락 리뷰)");
  assert.match(a, /chat: \(\) => chatSend\(chatText, true\)/, "RETRY.chat은 chatText를 다시 보낸다");
});

test("F-102-2 준비 계획의 '물어보기' — 경고 뒤 '보낼게요'를 누르면 다시 경고하지 않고 보낸다", async () => {
  let warned = 0, calls = 0;
  const st = { plan: { work: { a: { report: { easy: "다 했어요", items: [] } } }, plan: { items: [{ id: "a", need: "목록", check: "보인다" }] } }, planQ: "메일 a@b.kr 로 받나요?", planAns: {}, planAsk: "a", tier: "lite", warn: null };
  const env = { st, planPractice: () => false, guard: () => { warned++; return true; }, planCall: async () => { calls++; return { ok: true, answer: "네" }; }, atStage: () => 3, fetchUsage() {}, say() {}, render() {} };
  const askPlan = make(fnSrc("askPlan"), "askPlan", env);
  await askPlan("a");
  assert.equal(calls, 0, "처음에는 경고에서 멈춘다");
  const retry = (a.match(/planAsk: \(\) => \{([^}]*)\}/) || [])[1];
  assert.ok(retry, "RETRY.planAsk");
  new Function("st", "askPlan", retry)(st, askPlan);
  await new Promise((r) => setImmediate(r));
  assert.equal(warned, 1, "'보낼게요' 뒤에는 guard를 다시 지나지 않는다");
  assert.equal(calls, 1, "물어본 것이 간다");
  assert.equal(st.planAns.a, "네");
});

test("F-102-3 파일 저장 — 저장하는 동안 더 친 글은 '고침'으로 남는다(저장된 글로 치지 않는다), ⌘S를 두 번 눌러도 한 번만 보낸다", async () => {
  let posts = 0; const waiting = [];
  const f = { i: 0, path: "a.md", text: "첫 글", saved: "", mtime: 1, eol: "\n", dirty: true, hist: [] };
  const st = { openFiles: [f] };
  const env = { st, FHIST_MAX: 20, render() {}, reloadChanged() {}, watchTask() {},
    fetch: async () => { posts++; await new Promise((r) => waiting.push(r)); return { json: async () => ({ ok: true, mtime: 2 }) }; } };
  const saveFile = make(fnSrc("saveFile"), "saveFile", env);
  const p = saveFile(0);
  f.text = "첫 글 + 저장 중에 친 글";   // 응답이 오기 전에 더 친다
  const p2 = saveFile(0);                // ⌘S 한 번 더
  await new Promise((r) => setImmediate(r)); waiting.forEach((r) => r()); await p; await p2;
  assert.equal(posts, 1, "저장 중에는 또 보내지 않는다");
  assert.equal(f.saved, "첫 글", "저장된 것은 보낸 글");
  assert.equal(f.dirty, true, "더 친 글이 남았으니 '고침' 표시가 그대로");
  assert.equal(f.hist.length, 1, "이전 저장본은 기록에");
});

test("F-102-4 긴 글 — 채팅에는 앞 200자만 보여도 AI에는 원문(1,000자까지)이 간다", () => {
  const src = (a.match(/const talkOf = \(t\) => \{[\s\S]*?return out; \};/) || [])[0];
  assert.ok(src, "talkOf");
  const long = "가".repeat(500), shown = `${long.slice(0, 200)}… (글 500자)`;
  const st = { chat: [{ who: "floro", html: "무엇을 만들까요?" }, { who: "me", html: shown }] };
  const talkOf = new Function("st", "textOf", `${src}; return talkOf;`)(st, (h) => h);
  const out = talkOf(long);
  assert.equal(out.length, 2);
  assert.equal(out[1].who, "me");
  assert.equal(out[1].text, long, "AI에 가는 마지막 내 말은 잘린 표시가 아니라 원문");
  assert.equal(talkOf("가".repeat(1500)).at(-1).text.length, 1000, "원문도 1,000자까지");
});
