// claude-drafted: 2026-10-20 — C-10 켜짐과 인사(이재엽 "처음에 반갑다고 인사하고 하는 모습이랑 켜지는 모습들", 버튼 "켤 때마다").
// 시간표 · 규칙은 greet.js(순수), 그림은 app.css — 여기서는 순서 · 길이 · 건너뛰기 · 언제 하는지와 app.js · setup.js가 그 규칙대로 이어 붙였는지(글로)를 본다.
// 실행: node --test 04-tests/navigator/greet.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const G = require("../../02-frontend/navigator/greet.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");

// 가짜 시계 — 타이머를 모아 두고 tick(ms)으로 흘린다
function clock() {
  let now = 0, id = 0; const timers = new Map();
  return {
    setTimeout: (fn, ms) => { timers.set(++id, { at: now + ms, fn }); return id; },
    clearTimeout: (i) => timers.delete(i),
    tick(ms) { now += ms; for (const [i, t] of [...timers].sort((a, b) => a[1].at - b[1].at)) if (t.at <= now) { timers.delete(i); t.fn(); } },
    get pending() { return timers.size; },
  };
}

test("시간표 — 켜짐 → 열림 → 솟음 → 인사 → 자리 잡기 → 끝, 때는 늘어나기만, 다 합쳐 5초 안", () => {
  assert.deepEqual(G.TIMELINE.map((s) => s.phase), ["wave", "open", "pop", "hello", "settle", "done"]);
  for (let i = 1; i < G.TIMELINE.length; i++) assert.ok(G.TIMELINE[i].at > G.TIMELINE[i - 1].at, `${i}번째가 앞보다 늦다`);
  assert.equal(G.TIMELINE[0].at, 0);
  assert.ok(G.total() <= G.LIMIT && G.total() <= 3500, `끝 ${G.total()}ms — 넘김 문서 3절(3.5초 안, 상한 5초)`);
});

test("언제 인사하나 — 켤 때마다. 주소 끝 장면 · 휴대폰 · 움직임 줄이기면 안 한다(움직임 줄이기는 카드만)", () => {
  assert.equal(G.shouldGreet({}).greet, true);
  assert.equal(G.shouldGreet({ hash: "" }).greet, true);
  assert.equal(G.shouldGreet({ hash: "#" }).greet, true, "빈 #은 장면이 아니다");
  for (const hash of ["#start", "#ex=1", "#tab=lib", "#setup", "#tab=lib&back"]) assert.equal(G.shouldGreet({ hash }).greet, false, `${hash}: 녹화 · 시험 · 돌아오기 장면`);
  assert.match(G.shouldGreet({ still: true }).why, /움직임 줄이기/);
  assert.equal(G.shouldGreet({ phone: true }).greet, false);
  // C-46(이재엽 버튼 2026-10-27 "하루에 한 번"): 같은 날이면 인사 없이 알약만
  assert.deepEqual(G.shouldGreet({ lastDay: "2026-10-27", today: "2026-10-27" }), { greet: false, why: "오늘 이미 인사했어요" });
  assert.equal(G.shouldGreet({ lastDay: "2026-10-26", today: "2026-10-27" }).greet, true);
  assert.equal(G.shouldGreet({ lastDay: "", today: "2026-10-27" }).greet, true, "처음");
  assert.deepEqual(G.PILL_TIMELINE.map((x) => x.phase), ["pop", "hello", "settle", "done"], "알약 안의 시간표 — 띠 · 열림 없이");
  assert.ok(G.total(G.PILL_TIMELINE) <= G.LIMIT && G.total(G.PILL_TIMELINE) < G.total(G.TIMELINE), "알약 인사는 짧다");
});

test("돌리기 — 단계가 차례로 오고 끝에 done, 끝난 뒤 남은 타이머가 없다", () => {
  const c = clock(), seen = [];
  const run = G.play(G.TIMELINE, { setTimeout: c.setTimeout, clearTimeout: c.clearTimeout, onPhase: (p) => seen.push(p) });
  c.tick(0); assert.deepEqual(seen, ["wave"]);
  c.tick(600); assert.deepEqual(seen, ["wave", "open", "pop"]);
  c.tick(5000); assert.deepEqual(seen, ["wave", "open", "pop", "hello", "settle", "done"]);
  assert.equal(c.pending, 0); assert.equal(run.finished, true);
});

test("건너뛰기(누름 · Esc) — 남은 단계를 지우고 바로 done 한 번, 두 번 눌러도 한 번", () => {
  const c = clock(), seen = [];
  const run = G.play(G.TIMELINE, { setTimeout: c.setTimeout, clearTimeout: c.clearTimeout, onPhase: (p) => seen.push(p) });
  c.tick(700);
  run.skip(); run.skip();
  assert.deepEqual(seen, ["wave", "open", "pop", "done"]);
  assert.equal(c.pending, 0, "남은 타이머가 없다");
  c.tick(5000); assert.deepEqual(seen.filter((p) => p === "done").length, 1, "나중에 또 done이 오지 않는다");
  const c2 = clock(), seen2 = [];
  const run2 = G.play(G.TIMELINE, { setTimeout: c2.setTimeout, clearTimeout: c2.clearTimeout, onPhase: (p) => seen2.push(p) });
  run2.cancel(); c2.tick(9000);
  assert.deepEqual(seen2, [], "cancel은 아무것도 부르지 않는다");
});

test("app.js — 인사는 greet.js 규칙으로 켤 때(하루에 한 번) 알약 안에서, 단계는 html[data-greet], 누름 · 키로 건너뛰고, 끝나면 알약 그대로 · floe:greet-done · 접힘 타이머 시작(C-46 R-1)", () => {
  const app = read("navigator/app.js");
  assert.match(app, /GR\.shouldGreet\(bootArgs\)\.greet/);
  assert.match(app, /if \(greetNow\) \{ document\.documentElement\.classList\.add\("greeting"\); st\.ui = "petit"; \}/, "켜면 알약");
  assert.match(app, /else if \(st\.ui === "greet"\) st\.ui = location\.hash && location\.hash !== "#" \? "home" : "petit";/, "인사가 없어도 알약 — 주소 끝 장면(시험 · 녹화)은 기본 화면");
  assert.match(app, /writeLS\(GREET_DAY, ymd\(\)\);/, "오늘 인사했다"); assert.match(app, /go\("petit"\);   \/\/ 인사가 끝나도 알약 그대로/, "끝나도 알약");
  assert.match(app, /GR\.play\(GR\.PILL_TIMELINE, \{ onPhase \}\)/);
  assert.match(app, /\$\{greeting \? " greet" : ""\}" data-act="pill"/, "인사 중인 알약"); assert.match(app, /class="pl-now pl-hello" aria-live="polite">\$\{esc\(st\.back \|\| C\.greeting\(new Date\(\)\.getHours\(\)\)\)\}/, "시간대 인사 한 줄");
  assert.ok(!app.includes("function greetHTML"), "큰 인사 카드는 없다");
  assert.match(app, /h\.dataset\.greet = p/);
  assert.match(app, /if \(greetSkip\) \{ greetSkip\(\); if \(e\.key === "Escape"\)/, "키 — Esc는 건너뛰기만");
  assert.match(app, /\$nav\.addEventListener\("click", \(\) => \{ if \(greetSkip\) greetSkip\(\); \}, \{ capture: true \}\)/, "누름");
  assert.match(app, /new CustomEvent\("floe:greet-done"\)/);
  assert.match(app, /function scheduleIdle\(\) \{\n\s*if \(greetSkip\) return;/, "인사 중에는 접히지 않는다");
  // 작은 소리(chime)는 2026-10-29 두승현 결정으로 뺐다 — 설정 칸 · 상태 값 · 소리 코드 모두. hello 단계는 이제 아무것도 하지 않는다(머리 위 말풍선은 2026-10-25에 뺐다)
  assert.doesNotMatch(app, /chime|st\.sound|data-act="sound"|작은 소리/, "app.js에 작은 소리가 남아 있지 않다");
  assert.doesNotMatch(read("navigator/seal.js"), /chime|AudioContext/, "seal.js에 소리 코드가 남아 있지 않다");
  assert.match(read("navigator/index.html"), /<script src="greet\.js"><\/script>\s*<script src="app\.js">/, "greet.js는 app.js보다 먼저");
});

test("setup.js — 처음 설정은 인사가 끝난 뒤에 연다(인사가 두 번 나오지 않게)", () => {
  const s = read("navigator/setup.js");
  assert.match(s, /classList\.contains\("greeting"\)\) doc\.addEventListener\("floe:greet-done", \(\) => open\(\), \{ once: true \}\); else open\(\)/);
});

test("app.css — 단계마다 모양이 있고 움직임 줄이기면 바로 보인다", () => {
  const css = read("navigator/app.css");
  for (const p of ["pop", "hello", "settle"]) assert.match(css, new RegExp(`html\\[data-greet="${p}"\\] \\.pill\\.greet`), p);
  assert.match(css, /@keyframes fin-wave/, "지느러미 흔들기");
  assert.ok(!css.includes(".greet-wl") && !css.includes(".isl.greet"), "띠의 물결 선 · 큰 인사 카드 모양은 뺐다(C-46)");
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{html\.greeting \.pill\.greet \.pet,html\.greeting \.pill\.greet \.pl-hello\{opacity:1;animation:none\}/);
});

// C-55(2026-10-28, 이재엽 버튼 "접힌 알약 + 말풍선" · "켤 때마다"): 켜면 바로 작업실(지금 단계의 퀘스트 보드) + 고른 가장자리의 접힌 알약 + 알약 옆 말풍선(시간대 인사 한 줄 · 멈춘 곳 · 섬 펼치기 / 나중에).
//   처음 설정이 필요하면 설정부터(작업실 · 말풍선 없음). 주소 끝 장면 · 휴대폰은 전처럼. 시간대 인사 줄은 하루에 한 번(C-46 버튼) — 말풍선 자체는 켤 때마다
test("greet.js bootPlan — 켤 때 무엇을 여나: 작업실 · 말풍선 · 인사 줄", () => {
  const base = { hash: "", still: false, phone: false, lastDay: "", today: "2026-10-28", setupNeeded: false };
  assert.deepEqual(G.bootPlan(base), { workspace: true, bubble: true, greet: true, why: "" }, "보통 켬 — 작업실 · 말풍선 · 인사");
  assert.deepEqual(G.bootPlan({ ...base, lastDay: "2026-10-28" }), { workspace: true, bubble: true, greet: false, why: "오늘 이미 인사했어요" }, "같은 날 — 말풍선은 뜨되 인사 줄은 없음");
  assert.equal(G.bootPlan({ ...base, setupNeeded: true }).workspace, false, "처음 설정이 필요하면 설정부터"); assert.equal(G.bootPlan({ ...base, setupNeeded: true }).bubble, false);
  assert.deepEqual(G.bootPlan({ ...base, hash: "#ex=2" }), { workspace: false, bubble: false, greet: false, why: "주소 끝 장면" });
  assert.equal(G.bootPlan({ ...base, phone: true }).workspace, false, "휴대폰은 따로");
  const still = G.bootPlan({ ...base, still: true }); assert.ok(still.workspace && still.bubble && !still.greet, "움직임 줄이기 — 작업실 · 말풍선은 열고 인사 움직임만 없음");
  assert.ok(G.BUBBLE_MS >= 5000 && G.BUBBLE_MS <= 15000, "말풍선은 몇 초 뒤 사라진다(시간 미정 — 5 ~ 15초 사이로 둠)");
});
test("app.js — 켤 때 bootPlan대로 작업실을 열고(퀘스트 탭 — 캔버스 탭은 2026-11-02에 뺌) 섬은 접힌 알약, 말풍선에 인사 · 멈춘 곳 · 섬 펼치기 / 나중에", () => {
  const a = read("navigator/app.js");
  assert.match(a, /GR\.bootPlan\(bootArgs\)/, "규칙은 greet.js bootPlan 하나"); assert.match(a, /const bootArgs = \{ hash: location\.hash, still: STILL, phone: isPhone\(\), lastDay: readLS\(GREET_DAY, ""\), today: ymd\(\),/);
  assert.match(a, /setupNeeded: !!\(window\.FloeSetup && window\.FloeSetup\.shouldOpen\(/, "처음 설정이 필요한지는 setup.js의 규칙으로");
  assert.match(a, /if \(boot\.workspace\) \{ openQwin\("quest"\); st\.ui = "petit";/, "작업실(퀘스트 탭) + 접힌 알약");
  assert.match(a, /data-act="boot-later"/, "나중에"); assert.match(a, /class="hello-bub/, "말풍선");
  assert.match(a, /"boot-later": \(\) => \{ st\.boot = null;/, "나중에 → 말풍선만 사라진다");
});
