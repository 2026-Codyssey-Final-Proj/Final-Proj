// claude-drafted: 2026-10-29 — F-103 묶음(화면 코드 점검, 임유정 "내 담당 화면부터"): 01-docs/07-maintenance/fixes/screen-bug-hunt.md
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

test("F-103-1 대화 — 비밀값 경고 뒤 '보낼게요'를 누르면 그 글(원문)이 AI로 간다, 그 전 메시지가 아니라", async () => {
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

test("F-103-2 준비 계획의 '물어보기' — 경고 뒤 '보낼게요'를 누르면 다시 경고하지 않고 보낸다", async () => {
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

test("F-103-3 파일 저장 — 저장하는 동안 더 친 글은 '고침'으로 남는다(저장된 글로 치지 않는다), ⌘S를 두 번 눌러도 한 번만 보낸다", async () => {
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

test("F-103-4 긴 글 — 채팅에는 앞 200자만 보여도 AI에는 원문(1,000자까지)이 간다", () => {
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

test("F-103-5 AI 호출 — 기다리는 동안 단추를 또 눌러도(더블클릭) 두 번 보내지 않고, 먼저 끝난 쪽이 '바쁨'을 풀지 않는다", async () => {
  let posts = 0; const waiting = [];
  const st = { busy: false };
  const timers = new Set(); let tid = 0;   // 가짜 타이머 — 덮어써 못 끈 타이머가 남는지 센다
  const env = { st, hold() {}, render() {}, $nav: { querySelector: () => null }, setInterval: () => { timers.add(++tid); return tid; }, clearInterval: (t) => timers.delete(t),
    fetch: async () => { posts++; await new Promise((r) => waiting.push(r)); return { json: async () => ({ ok: true }) }; } };
  const callAI = new Function(...Object.keys(env), `let waitFrom = 0, lastWait = 0, waitTimer = 0; const waitText = () => ""; ${fnSrc("callAI")}; return callAI;`)(...Object.values(env));
  const first = callAI("/api/task/start", { text: "a" });
  const second = callAI("/api/task/start", { text: "a" });   // 두 번째 누름
  await new Promise((r) => setImmediate(r));
  assert.equal(posts, 1, "AI는 한 번만 부른다(토큰 두 배 · 두 번째 409 없음)");
  assert.equal(st.busy, true, "두 번째가 끝나도 첫 호출을 기다리는 '바쁨'은 그대로");
  waiting.forEach((r) => r());
  const [r1, r2] = await Promise.all([first, second]);
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, false); assert.equal(r2.busy, true, "부르는 쪽이 '앞의 일을 기다리는 중'임을 안다");
  assert.equal(st.busy, false, "첫 호출이 끝나면 풀린다");
  assert.equal(timers.size, 0, "기다림 타이머가 남지 않는다");

  // askAI(어디쯤 · 물어보기 · 초안 · 다시 봐 주기)는 바쁨으로 돌아온 두 번째를 오류로 띄우지 않는다
  const st2 = { error: "", tokens: 0 };
  const askAI = make(fnSrc("askAI"), "askAI", { st: st2, guard: () => false, callAI: async () => ({ ok: false, busy: true, reason: "x" }), fetchUsage() {}, render() {}, pendingNotice: "" });
  await askAI("/api/answer", {}, "물어보기", () => {});
  assert.equal(st2.error, "", "바쁨은 '지어내지 않고 비워 둘게요' 오류가 아니다");
});

test("F-103-6 파일 열기 — 파일 칸을 빠르게 두 번 눌러도 같은 파일 탭은 하나", async () => {
  const waiting = [];
  const st = { files: { list: [{ path: "docs/a.md", name: "a.md" }] }, openFiles: [], fileSel: -1, qtab: "canvas" };
  const env = { st, render() {}, say() {},
    fetch: async () => { await new Promise((r) => waiting.push(r)); return { json: async () => ({ ok: true, path: "docs/a.md", name: "a.md", kind: "md", text: "글", mtime: 1 }) }; } };
  const openFile = make(fnSrc("openFile"), "openFile", env);
  const p1 = openFile(0), p2 = openFile(0);   // 응답이 오기 전에 두 번
  await new Promise((r) => setImmediate(r)); waiting.forEach((r) => r()); await p1; await p2;
  assert.equal(st.openFiles.length, 1, "같은 경로 탭 둘이면 한쪽 저장 뒤 다른 쪽이 409");
  assert.equal(st.fileSel, 0);
});

test("F-103-12 주소 끝의 % — 잘못된 글자가 와도 시작 코드가 멈추지 않는다(빈 화면 없음)", () => {
  const src = (a.match(/const safeDecode = \(s\) => \{[^\n]*\};/) || [])[0];
  assert.ok(src, "safeDecode — decodeURIComponent를 감싼 도우미");
  const safeDecode = new Function(`${src}; return safeDecode;`)();
  assert.equal(safeDecode("50%"), "50%", "깨진 % 는 글자 그대로");
  assert.equal(safeDecode("%EB%AC%B8%EC%84%9C"), "문서");
  const from = fnSrc("fromHash");
  assert.match(from, /\.map\(safeDecode\)/, "주소 읽기는 safeDecode로");
  assert.doesNotMatch(from, /map\(decodeURIComponent\)/);
  const dm = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/docmap.html"), "utf8");
  assert.match(dm, /try \{ return decodeURIComponent\(s\); \} catch \{ return s; \}/, "문서 지도(docmap.html)도 같이");
});

test("F-103-5 새 맥락 리뷰 — 다른 호출이 도는 중에 단계 초안이 불리면, 미리 받은 초안(pre)과 앞 호출의 '무엇을 기다리나'(planBusy)를 지우지 않는다", async () => {
  const said = [];
  const st = { mode: "live", busy: true, planBusy: "hand", warn: null, error: "" };
  const env = { st, canLive: true, prevOf: () => [], ideaNow: () => "", guard: () => false, baseText: () => "", say: (t) => said.push(t), render() {},
    callAI: async () => { throw new Error("바쁠 때는 부르지 않는다"); } };
  const mk = new Function(...Object.keys(env), `let pre = { key: "k", r: { ok: true } }; ${fnSrc("stageDraft")}; return { stageDraft, pre: () => pre };`)(...Object.values(env));
  await mk.stageDraft(3);
  assert.deepEqual(mk.pre(), { key: "k", r: { ok: true } }, "미리 받은 초안은 그대로");
  assert.equal(st.planBusy, "hand", "앞 호출의 표시는 그대로");
  assert.equal(said.length, 1, "기다리는 중이라고 한 번 말한다");
  for (const where of ["app/45-knowledge.js", "app/55-files.js", "app/90-acts.js"]) {
    const p = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator", where), "utf8");
    for (const m of p.matchAll(/planBusy(: | = )"(ship|hand|again)"/g)) assert.match(p.slice(Math.max(0, m.index - 260), m.index), /if \(st\.busy\) return;/, `${where} — planBusy "${m[2]}" 앞에 바쁨 확인`);
  }
});
