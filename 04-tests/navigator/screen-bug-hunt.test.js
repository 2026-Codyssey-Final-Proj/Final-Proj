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
  const st = { files: { list: [{ path: "docs/a.md", name: "a.md" }] }, openFiles: [], fileSel: -1, qtab: "quest" };
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

// ── E 묶음(F-103-13 ~ 21) — 화면 CSS · 처음 설정 · 옆 창 · 캔버스. DOM 라이브러리가 없어 다른 화면 시험처럼 글자 모양으로 ──
const nav = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator", f), "utf8");
// CSS 규칙 하나의 본문 — 선택자가 줄 처음이나 앞 규칙의 } 바로 뒤에 그대로 있을 때만(앞에 다른 선택자가 붙은 것은 다른 규칙이다)
const rule = (css, sel) => { for (let i = css.indexOf(sel + "{"); i >= 0; i = css.indexOf(sel + "{", i + 1)) { const p = css[i - 1]; if (i === 0 || p === "\n" || p === "}") return css.slice(i + sel.length + 1, css.indexOf("}", i)); } return null; };

test("F-103-13 서고에서 돌아올 때 — surfacing을 뗀 뒤에도 빠지는 중(.rising)인 물은 600ms 끝까지 보인다", () => {
  const css = nav("dive.css");
  assert.equal(rule(css, "html:not(.dive-in):not(.surfacing) #dive-cover"), null, "빠지는 중인 물까지 숨기는 옛 규칙이 없다");
  assert.match(rule(css, "html:not(.dive-in):not(.surfacing) #dive-cover:not(.rising)") || "", /display:none/, "덮개는 빠지는 중이 아닐 때만 숨긴다");
});

test("F-103-14 서고로 들어갈 때 — 물 효과 층(.dive.out .fx)이 하트용 .fx의 가운데 맞춤 · 날기 움직임을 받지 않는다", () => {
  const r = rule(nav("dive.css"), ".dive.out .fx") || "";
  assert.match(r, /translate:none/, "translate -50% -50%로 왼쪽 위로 밀리지 않게");
  assert.match(r, /animation:none/, "하트의 fly 움직임을 받지 않게");
});

test("F-103-15 하트 · 별 층(#fx)이 처음 설정(#floe-setup) 위에 뜬다 — index.html '맨 위 층'", () => {
  const z = (css, sel) => Number(((rule(css, sel) || "").match(/z-index:(\d+)/) || [])[1]);
  assert.ok(z(nav("app.css"), "#fx") > z(nav("setup.css"), "#floe-setup"), "하트가 대화상자 뒤에 깔리지 않게");
});

test("F-103-16 앱에서 처음 설정 위쪽 단추를 누르면 창이 끌리지 않는다(F-63과 같은 꼴 — 위 줄 drag를 덮는 층은 no-drag)", () => {
  assert.match(nav("setup.css"), /html\.in-app #floe-setup\{[^}]*-webkit-app-region:no-drag/);
});

test("F-103-17 처음 설정 — 응답이 와서 다시 그려도 치던 글 · 커서가 남는다", () => {
  const s = nav("setup.js"), r = s.slice(s.indexOf("function render() {"), s.indexOf("async function refresh()"));
  assert.match(r, /querySelectorAll\("input\[name\]"\)/, "다시 그리기 전에 이름 있는 글 칸의 값을 모은다");
  assert.ok(r.indexOf("querySelectorAll(\"input[name]\")") < r.indexOf("host.innerHTML ="), "innerHTML을 바꾸기 전에");
  assert.match(r, /setSelectionRange/, "치던 칸이면 커서 자리도");
  assert.equal((s.match(/if \(r && r\.ok\) clearTyped\(\);/g) || []).length, 2, "가져오기 · 새로 만들기가 되면 전처럼 빈 칸(새 맥락 리뷰)");
});

test("F-103-18 옆 창 — 한글을 조합하는 동안에는 다시 그리지 않고, 조합이 끝나면 마지막 화면을 그린다", () => {
  const w = nav("win.js");
  assert.match(w, /addEventListener\("compositionstart"/); assert.match(w, /addEventListener\("compositionend"/);
  assert.match(w, /F\.onWinHtml\(\(html\) => \{ if \(composing && root\.contains\(document\.activeElement\)\) \{ pending = html; return; \} composing = false;/, "조합 중에 온 화면은 미뤄 둔다");
  assert.match(w, /addEventListener\("compositionend", \(\) => \{ composing = false; setTimeout\(\(\) => \{ if \(composing \|\| pending === null\) return;/, "다음 음절이 곧 시작하니 한 박자 미뤄 다시 본다(새 맥락 리뷰)");
});

test("F-103-19 옆 창 손잡이 — 끄는 도중 손잡이가 숨어 pointerup이 안 와도 끌기가 끝난다", () => {
  const w = nav("win.js"), lay = w.slice(w.indexOf("function layoutCol() {"), w.indexOf("const setCol ="));
  assert.match(lay, /hd\.hidden = !side \|\| folded \|\| center;[^\n]*\n\s*if \(hd\.hidden && drag\) endDrag\(\);/, "손잡이를 숨기는 자리에서 끌기를 끝낸다(숨으면 pointerup · lostpointercapture가 온다는 보장이 없다 — 새 맥락 리뷰)");
  assert.match(w, /hd\.addEventListener\("lostpointercapture", endDrag\)/);
});

// F-103-20(캔버스의 접힘을 누르면 끌기가 아니라 펼쳐진다)은 캔버스 탭을 2026-11-02에 빼면서 시험도 뺐다

test("F-103-21 옆 창 — 창을 좁혔다 넓히면 고른 칸 너비로 돌아온다(창 크기가 바뀔 때 기억한 값을 덮지 않는다)", () => {
  const w = nav("win.js"), lay = w.slice(w.indexOf("function layoutCol() {"), w.indexOf("const setCol ="));
  assert.doesNotMatch(lay, /col\[axis\] = clamp/, "layoutCol은 보이는 값만 줄인다");
  assert.match(lay, /const axis = axisOf\(side\), v = clamp\(axis, col\[axis\]\);/);
  assert.match(lay, /folded \? FOLD : axis === "w" \? v : col\.w\}px/, "칸 너비도 손잡이처럼 보이는 값 — 기억한 값으로 그리면 좁은 창에서 칸과 손잡이가 어긋난다(새 맥락 리뷰 막힘)");
  assert.match(w, /else if \(e\.key === "End"\) setCol\(hiOf\(axis\)\); else return;/, "키 처리 줄이 끝까지 살아 있다 — 줄 가운데 주석이 Home · End · else return을 지웠던 일(새 맥락 리뷰 막힘)");
});

// ── 기다리는 사이 상태가 바뀜(F-103-7 · 8 · 10 · 11) — await 앞에서 본 것과 뒤의 상태가 다를 때 ──
const tick = () => new Promise((r) => setImmediate(r));
const later = () => { const box = []; return { wait: () => new Promise((r) => box.push(r)), go: (v) => box.splice(0).forEach((r) => r(v)) }; };

test("F-103-7 맡긴 일 지켜보기 — 묻는 사이 새 일을 지키기 시작했으면, 옛 일의 답으로 새 일을 '잃었다'고 하지 않는다", async () => {
  let lost = 0; const gate = later();
  const env = { st: { blocked: null, stall: null }, TASK_END: { plan: { lost: () => lost++ } }, render() {}, stallCheck() {}, onBlocked() {}, logMsg() {}, clearInterval() {},
    fetch: async () => { const t = await gate.wait(); return { json: async () => ({ task: t }) }; } };
  const m = new Function(...Object.keys(env), `let tw = { at: 1, kind: "plan" }, twTimer = null, twBusy = false; function twStop() { tw = null; } ${fnSrc("twTick")}; return { twTick, setTw: (x) => { tw = x; }, tw: () => tw };`)(...Object.values(env));
  const p = m.twTick(); await tick();
  m.setTw({ at: 2, kind: "plan" });           // 그사이 새 일
  gate.go({ at: 1, state: "running" }); await p;   // 옛 일(at 1)의 답
  assert.equal(lost, 0, "새 일을 잃었다고 처리하지 않는다");
  assert.deepEqual(m.tw(), { at: 2, kind: "plan" }, "새 일을 계속 지켜본다");
  const hp = fnSrc("handPlan");
  assert.match(hp, /setTimeout\(\(\) => \{ if \(!st\.plan \|\| FP\.running\(st\.plan\) !== id\) return; st\.plan = FP\.report\(/, "연습 0.9초 사이 계획을 새로 적거나 지웠으면 예시 보고를 넣지 않는다(FP.report(null) TypeError)");
});

test("F-103-8 웹 AI 제안 — 고른 카드를 늦게 온 목록이 되살리지 않고, 서버가 이미 처리됐다고 하면(404) 적지 않는다", async () => {
  const p = { id: "p1", kind: "report", chap: 2, todo: 0, text: "한 줄" }; let filled = 0; const poll = later();
  const st = { quest: { phase: "quest", chap: 2, objs: [{}] }, ui: "home", j: null };
  const env = { st, postState() {}, peek() {}, render() {}, say() {}, logMsg() {}, esc: (x) => x, startDraft() {}, QU: {}, fillNow: () => filled++, ROMAN: () => "Ⅰ",
    fetch: async (url) => url === "/api/proposals" ? { json: async () => { await poll.wait(); return { ok: true, items: [p] }; } } : { ok: true, status: 200, json: async () => ({ ok: true }) } };
  const m = new Function(...Object.keys(env), `let proposals = [${JSON.stringify(p)}]; const decided = new Set(); ${fnSrc("pollProposals")} ${fnSrc("decideProposal")}; return { pollProposals, decideProposal, list: () => proposals };`)(...Object.values(env));
  const polling = m.pollProposals(); await tick();   // 목록을 묻는 중
  await m.decideProposal("p1", true);              // 그사이 '맞아요'
  poll.go(); await polling;                        // 고르기 전 목록이 늦게 온다
  assert.equal(filled, 1);
  assert.deepEqual(m.list().map((x) => x.id), [], "고른 카드가 되살아나지 않는다(또 누르면 두 번 적힘)");

  let filled2 = 0;
  const env2 = { ...env, fillNow: () => filled2++, fetch: async () => ({ ok: false, status: 404, json: async () => ({ ok: false, reason: "기다리는 제안이 아님" }) }) };
  const m2 = new Function(...Object.keys(env2), `let proposals = [${JSON.stringify(p)}]; const decided = new Set(); ${fnSrc("decideProposal")}; return { decideProposal };`)(...Object.values(env2));
  await m2.decideProposal("p1", true);
  assert.equal(filled2, 0, "서버에 없는 제안(다른 화면에서 이미 처리)은 적지 않는다");
});

test("F-103-10 대화 불러오기 — 묻는 사이 연습으로 바꿨으면 늦게 온 서버 대화가 덮지 않고, 기다리는 동안 남긴 말은 사라지지 않는다", async () => {
  const gate = later(); let live = true;
  const st = { chat: [{ who: "floro", html: "안녕" }], chatChanges: [], chatMark: 0 };
  const env = { st, CHAT_CAP: 400, chatLive: () => live, chatlogFlush() {}, setTimeout: () => 0, fromTurn: (x) => ({ who: x.who, html: x.text }),
    fetch: async () => { const r = await gate.wait(); return { json: async () => r }; } };
  // logMsg처럼 새 배열로 쌓고 chatSeq를 올린다
  const mk = () => new Function(...Object.keys(env), `let chatQueue = [], chatFolder = null, chatAsk = 0, chatSeq = 0; ${fnSrc("chatlogLoad")}; const log = (html) => { st.chat = [...st.chat, { who: "floro", html }]; chatSeq += 1; }; return Object.assign(chatlogLoad, { log });`)(...Object.values(env));
  const load = mk();
  const p = load(); await tick();
  live = false; await load();             // 연습으로 바꿈 — 다시 묻는다
  gate.go({ ok: true, turns: [{ who: "me", text: "서버의 옛 말" }] }); assert.equal(await p, false, "옛 답은 버린다");
  assert.deepEqual(st.chat.map((x) => x.html), ["안녕"], "연습인데 서버 대화로 덮이지 않는다");

  live = true; const load2 = mk(); const gate2 = gate;
  const p2 = load2(); await tick();
  load2.log("기다리는 동안 한 인사");   // 묻는 사이 남긴 말
  gate2.go({ ok: true, turns: [{ who: "me", text: "서버의 말" }] }); assert.equal(await p2, true);
  assert.deepEqual(st.chat.map((x) => x.html), ["서버의 말", "기다리는 동안 한 인사"], "서버 대화 뒤에 기다리는 동안 남긴 말");
});

test("F-103-11 가져갈 것 — 남기는 사이 '나중에'로 닫았어도 멈추지 않는다(TypeError 없음)", async () => {
  const d = { id: "c1", text: "다음엔 먼저 시험", why: "", stage: 5, review: "", from: [] };
  const st = { carry: { drafts: [d] } };
  const env = { st, render() {}, say() {}, save() {}, carryPost: async () => { st.carry = null; return { ok: true }; } };
  const carryDecide = make(fnSrc("carryDecide"), "carryDecide", env);
  await carryDecide(0, "adopt");
  assert.equal(d.state, "adopted", "장부에는 남았다");
});

test("F-103-7 '멈추기'(옛 '기다리지 않기') — 맡긴 일을 서버에서도 멈추고, 멈춘 뒤 그 줄을 끝맺어 바로 다시 맡길 수 있다(임유정 2026-10-30 '클로드 코드도 멈추는 거로')", async () => {
  // 서버: 멈춤을 받으면 다음 물음부터 running이 아니다
  const calls = []; let running = true;
  const fetchStub = async (url, o) => { calls.push(url); if (url === "/api/task/stop") { running = false; return { json: async () => ({ ok: true }) }; } return { json: async () => ({ task: { at: 7, state: running ? "running" : "stopped" } }) }; };
  const halt = new Function("fetch", "clearInterval", "setTimeout", `let twTimer = 1; ${fnSrc("taskHalt")}; return taskHalt;`)(fetchStub, () => {}, (f) => f());
  await halt(7);
  assert.equal(calls[0], "/api/task/stop", "먼저 서버에 멈추라고 한다");
  assert.ok(calls.length >= 2 && !running, "멈춘 것을 확인할 때까지 기다린다(그 전에 다시 맡기면 409)");

  // 단추: 지켜보던 맡긴 일(plan)을 멈추고 그 줄을 끝맺는다
  const acts = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app/90-acts.js"), "utf8");
  const body = (acts.match(/"plan-unwait": (async \(\) => \{[^\n]*?\}),(?: +\/\/[^\n]*)?\n/) || [])[1];   // 줄 끝 주석은 빼고
  assert.ok(body, "plan-unwait");
  const st = { plan: { run: "a" }, stall: { at: 7 }, blocked: null }; const halted = [], said = [];
  const FP = { running: (b) => (b && b.run) || "", failed: (b, id, why) => ({ run: "", failed: id, why }) };
  const mk = (stopped, st0) => new Function("st", "FP", "taskHalt", "save", "render", "say", "setInterval", "twTick", `let tw = { at: 7, kind: "plan" }, twTimer = null; const fn = ${body}; return { fn, tw: () => tw, timer: () => twTimer };`)(st0, FP, async (at) => { halted.push(at); return stopped; }, () => {}, () => {}, (t) => said.push(t), () => 99, () => {});
  const m = mk(true, st);
  await m.fn();
  assert.deepEqual(halted, [7], "그 일을 서버에서 멈춘다");
  assert.equal(m.tw(), null, "더 지켜보지 않는다");
  assert.equal(st.plan.failed, "a", "그 줄을 끝맺는다 — 다시 맡기기는 /api/task/retry(멈춘 일은 받는다)");
  assert.equal(st.halting, false, "멈추는 동안만 '멈추는 중'");
  assert.match(said[0], /바로 다시 맡길 수 있어요/);
  // 서버가 멈추지 못했으면(닿지 않음 · 10초 뒤에도 running) 줄을 끝맺지 않고 다시 지켜본다 — 끝맺으면 다시 맡기기가 409(새 맥락 리뷰)
  const st2 = { plan: { run: "a" }, stall: null }; said.length = 0;
  const m2 = mk(false, st2); await m2.fn();
  assert.equal(st2.plan.run, "a", "그 줄은 아직 맡김 중");
  assert.deepEqual(m2.tw(), { at: 7, kind: "plan" }); assert.equal(m2.timer(), 99, "다시 3초마다 묻는다");
  assert.match(said[0], /멈추지 못했어요/);
  assert.match(fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app/70-tasks.js"), "utf8"), /\{ label: "멈추기", act: "plan-unwait"/, "단추 이름도 하는 일대로");
});

// ── Electron 앱(02-frontend/electron/main.js) — F-103-22 ~ 24 ──
const mainJs = () => fs.readFileSync(path.join(__dirname, "../../02-frontend/electron/main.js"), "utf8");

test("F-103-22 키 저장 · 지우기 · 폴더 잇기 · 빼기 · 설정 폴더 열기는 섬 창이 보낸 것만 받고, 앱 창은 앱 서버 밖 주소로 넘어가지 않는다", () => {
  const m = mainJs();
  for (const ch of ["floe:save-key", "floe:clear-key", "floe:connect", "floe:disconnect", "floe:open-settings"]) {
    const at = m.indexOf(`ipcMain.handle("${ch}"`), head = at < 0 ? "" : m.slice(at, at + 220);   // 핸들러 첫머리(한두 줄)
    assert.match(head, /fromIsland\(e\)/, `${ch} — 옆 창 · 다른 페이지가 보낸 것은 받지 않는다`);
  }
  assert.equal((m.match(/webContents\.on\("will-navigate", keepInApp\)/g) || []).length, 2, "섬 창 · 옆 창 모두");
  const src = (m.match(/const keepInApp = \(e, url\) => \{[^\n]*\};/) || [])[0]; assert.ok(src, "keepInApp");
  const opened = [];
  const keep = (U) => new Function("shell", "URL_", `${src} return keepInApp;`)({ openExternal: (u) => opened.push(u) }, U);
  const ev = () => ({ stopped: false, preventDefault() { this.stopped = true; } });
  const e1 = ev(); keep("http://127.0.0.1:4317/")(e1, "http://127.0.0.1:4317/library/index.html"); assert.equal(e1.stopped, false, "서고 · 화면(앱 서버 안)은 그대로");
  const e2 = ev(); keep("http://127.0.0.1:4317/")(e2, "http://127.0.0.1:43170/x"); assert.equal(e2.stopped, true, "다른 포트는 막는다");
  const e3 = ev(); keep("http://127.0.0.1:4317/")(e3, "https://cli.github.com"); assert.equal(e3.stopped, true); assert.deepEqual(opened, ["https://cli.github.com"], "바깥 https는 기본 브라우저로(새 맥락 리뷰)");
  const e4 = ev(); keep("")(e4, "file:///C:/x.md"); assert.equal(e4.stopped, true, "서버가 켜지기 전 · 파일 주소는 막는다");
});

test("F-103-23 두 번째로 켜면 알림만 하고 끝난다 — 창 · 트레이 · 서버를 띄우지 않는다", () => {
  const m = mainJs();
  assert.match(m, /const ONLY = app\.requestSingleInstanceLock\(\);[^\n]*\nif \(!ONLY\) \{/, "잠금 결과를 기억한다");
  assert.match(m, /app\.whenReady\(\)\.then\(async \(\) => \{\n  if \(!ONLY\) return;/, "두 번째는 ready에서 아무것도 만들지 않는다");
});

test("F-103-24 서버 파일을 못 읽으면(묶음에서 빠짐 등) '켜지는 중'에 멈추지 않고 오류 창을 띄운다", () => {
  const s = mainJs(), body = s.slice(s.indexOf("async function startServer()"), s.indexOf("return new Promise((resolve) => {", s.indexOf("async function startServer()")));
  assert.match(body, /try \{ Server = require\(path\.join\(P\.backend, "server\.js"\)\); \} catch \(e\) \{ return `error:\$\{e\.code \|\| e\.message\}`; \}/, "require 오류도 'error:'로 — whenReady가 오류 창을 띄운다");
});

// ── 가벼운 것 일곱(F-103-25 ~ 31) ──
const part = (f) => nav(`app/${f}`);

test("F-103-25 할 일을 다 끝낸 판정에서도 '새 말을 배웠어요'가 남는다(축하로 일찍 빠지기 전에 채팅에)", () => {
  assert.match(part("85-ai.js"), /if \(allDone\(\)\) \{ view\("alert"\); if \(!was\) \{ if \(fresh\.length\) logMsg\("floro", `새 말을 배웠어요: \$\{esc\(fresh\.join\(", "\)\)\}`\); return celebrate\("done"\); \} \}/);
});

test("F-103-26 저장 칸이 넘쳐 대화를 100줄로 줄일 때 표시 자리(chatMark)도 같이 당긴다", () => {
  assert.match(part("00-base.js"), /const trimChat = \(\) => \{ const over = st\.chat\.length - 100; st\.chat = st\.chat\.slice\(-100\); if \(over > 0\) st\.chatMark = Math\.max\(0, \(st\.chatMark \|\| 0\) - over\); \};/);   // F-124에서 도우미로 — 동작은 code-sweep-1102.test.js F-124가 돌려 본다
});

test("F-103-27 저장소 만들기를 두 번 눌러도 한 번만 맡기고, 두 번째 409가 성공 문구를 덮지 않는다", async () => {
  let posts = 0; const gate = later();
  const st = { ghVis: "private", ghNote: "" };
  const env = { st, render() {}, watchTask() {}, fetch: async () => { posts++; await gate.wait(); return { json: async () => (posts > 1 ? { ok: false, reason: "이미 맡긴 일이 있어요" } : { ok: true, task: { at: 1 } }) }; } };
  const m = new Function(...Object.keys(env), `let repoReq = null; ${fnSrc("createRepoOnce")} ${(a.match(/function createRepo\(\) \{[^\n]*\}/) || [""])[0]}; return createRepo;`)(...Object.values(env));
  const p1 = m(), p2 = m(); await tick(); gate.go(); const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(posts, 1, "한 번만 맡긴다");
  assert.equal(r1.ok, true); assert.equal(r2.ok, true, "두 번째 누름도 같은 결과");
  assert.match(st.ghNote, /맡겼어요/, "성공 문구가 남는다");
});

test("F-103-28 파일을 빠르게 끌어왔다 빼도 '먹이 주기' 층이 켜진 채 남지 않는다", () => {
  assert.match(part("20-feed.js"), /requestAnimationFrame\(\(\) => \{ if \(dragDepth > 0\) feedLayer\(true\); \}\)/, "켜기를 미룬 사이 이미 떠났으면 켜지 않는다");
});

test("F-103-29 GitHub 칸 — 한 번 그릴 때 여러 번 묻지 않고, 늦게 온 옛 답이 새 답을 덮지 않는다", async () => {
  const gates = []; let asks = 0;
  const st = { gh: null };
  const env = { st, canLive: true, render() {}, fetch: async () => { asks++; const g = later(); gates.push(g); const v = await g.wait(); return { json: async () => v }; } };
  const m = new Function(...Object.keys(env), `let ghLoading = false, ghAsk = 0; ${fnSrc("loadGithub")} return loadGithub;`)(...Object.values(env));
  const old = m(), fresh = m(); await tick();
  gates[1].go({ ok: true, v: "새" }); await fresh;
  gates[0].go({ ok: true, v: "옛" }); await old;
  assert.equal(st.gh.v, "새", "늦게 온 옛 답은 버린다");
  const soon = (a.match(/const ghSoon = \(\) => \{[^\n]*\};/) || [])[0]; assert.ok(soon, "ghSoon");
  let timers = 0; const st2 = { gh: null };
  const ghSoon = new Function("st", "canLive", "setTimeout", "loadGithub", `let ghLoading = false; ${soon} return ghSoon;`)(st2, true, () => timers++, () => {});
  ghSoon(); ghSoon(); ghSoon();
  assert.equal(timers, 1, "한 번 그리는 동안 여러 곳이 불러도 한 번만 묻는다");
  assert.equal((a.match(/setTimeout\(loadGithub, 0\)/g) || []).length, 1, "그리는 곳은 ghSoon으로 — 직접 미루는 곳은 ghSoon 하나");
});

test("F-103-30 서고로 갔다가 뒤로 가기(페이지 보관)로 돌아오면 플로로가 보인다 — 떠나며 건 움직임을 걷는다", () => {
  const d = nav("dive.js"), leave = d.slice(d.indexOf("function leave(href, seal) {"));
  assert.match(leave, /whenDone\(anims, LEAVE_CAP, \(\) => \{ location\.href = href; \}, \(\) => \{ water\.remove\(\); anims\.forEach\(\(x\) => x\.cancel\(\)\); \}\);/);
});

test("F-103-31 문서 지도 — 서버의 까닭 글을 HTML로 넣지 않는다", () => {
  const dm = nav("docmap.html");
  assert.doesNotMatch(dm, /\$\{r && r\.reason \? r\.reason :/, "innerHTML 틀에 그대로 넣지 않는다");
  assert.match(dm, /\.textContent = r && r\.reason \? r\.reason : "문서 지도를 만들지 못했어요/, "글자로만");
});
