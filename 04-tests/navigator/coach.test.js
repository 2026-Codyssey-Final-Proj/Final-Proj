// claude-drafted: 2026-11-05 — 첫 사용 안내(두승현 "눌러야 하는 화면에 하이라이트 … 다른 화면은 어둡게 암전 … 플로로가 말풍선으로"). 걸음 계산 · 말풍선 자리는 coach.js(순수), 화면은 격리 앱으로 눈으로 봤다.
// 실행: node --test 04-tests/navigator/coach.test.js
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const C = require("../../02-frontend/navigator/coach.js");

const NAV = path.join(__dirname, "../../02-frontend/navigator");
const base = { on: true, ui: "home", blocked: false, busy: false, hasQuest: false, draft: false, filled: 0, seen: [] };

test("걸음은 상태로 정해진다 — 적기 → 퀘스트 판 → 첫 칸 → 탭", () => {
  assert.equal(C.stepOf(base), "say");
  assert.equal(C.stepOf({ ...base, hasQuest: true, draft: true }), "board");
  assert.equal(C.stepOf({ ...base, hasQuest: true, draft: true, seen: ["board"] }), "ok");
  assert.equal(C.stepOf({ ...base, hasQuest: true, draft: true, filled: 1, seen: ["board"] }), "tabs");
});

test("초안을 못 받은 퀘스트는 퀘스트 판 걸음을 건너뛴다 — 섬이 가운데라 판이 안 보인다", () => {
  assert.equal(C.stepOf({ ...base, hasQuest: true, draft: false }), "ok");
});

test("꺼져 있거나 다른 일이 있으면 암전하지 않는다 — 안내 때문에 앱이 멈추지 않게", () => {
  assert.equal(C.stepOf({ ...base, on: false }), "");
  assert.equal(C.stepOf({ ...base, busy: true }), "", "초안을 기다리는 동안");
  assert.equal(C.stepOf({ ...base, blocked: true }), "", "경고 · 오류 · 허락 카드 · 설정 · 뽑기");
  assert.equal(C.stepOf({ ...base, ui: "petit" }), "", "섬이 접혀 있으면");
});

test("걸음마다 밝힐 곳과 말이 있고, 눌러 볼 걸음과 보기만 하는 걸음이 나뉜다", () => {
  for (const id of ["say", "board", "ok", "tabs"]) { assert.ok(C.STEPS[id].sel, id); assert.ok(C.STEPS[id].text, id); }
  assert.ok(!C.STEPS.say.look && !C.STEPS.ok.look, "직접 누르는 걸음");
  assert.ok(C.STEPS.board.look && C.STEPS.tabs.look, "보기만 — 말풍선의 단추로 넘어간다");
  assert.ok(C.STEPS.board.next && C.STEPS.tabs.next);
  assert.ok(C.STEPS.say.typed, "글을 적으면 말이 바뀐다");
});

test("말풍선 번호는 다섯 걸음 — 글을 적으면 ①에서 ②로", () => {
  assert.equal(C.numberOf("say", false), 1);
  assert.equal(C.numberOf("say", true), 2);
  assert.equal(C.numberOf("board"), 3);
  assert.equal(C.numberOf("ok"), 4);
  assert.equal(C.numberOf("tabs"), 5);
  assert.equal(C.TOTAL, 5);
});

test("말풍선은 대상을 덮지 않는 쪽 중 가장 넉넉한 곳에", () => {
  const view = { w: 1200, h: 800 }, bub = { w: 400, h: 150 };
  assert.equal(C.placeBubble({ x: 800, y: 100, w: 300, h: 600 }, bub, view).side, "left");
  assert.equal(C.placeBubble({ x: 100, y: 100, w: 300, h: 600 }, bub, view).side, "right");
  assert.equal(C.placeBubble({ x: 100, y: 650, w: 1000, h: 100 }, bub, view).side, "above");
  assert.equal(C.placeBubble({ x: 100, y: 40, w: 1000, h: 60 }, bub, view).side, "below");
});

test("prefer — 들어가면 그쪽, 안 들어가면 넉넉한 쪽", () => {
  const view = { w: 1200, h: 800 }, bub = { w: 400, h: 150 };
  assert.equal(C.placeBubble({ x: 400, y: 300, w: 400, h: 100 }, bub, view, "below").side, "below");
  assert.equal(C.placeBubble({ x: 100, y: 700, w: 400, h: 90 }, bub, view, "below").side, "above");
});

test("말풍선은 창 밖으로 나가지 않는다", () => {
  const bub = { w: 400, h: 150 };
  for (const [view, t] of [
    [{ w: 1200, h: 800 }, { x: 900, y: 0, w: 300, h: 20 }],
    [{ w: 1200, h: 800 }, { x: 0, y: 780, w: 200, h: 20 }],
    [{ w: 500, h: 300 }, { x: 0, y: 0, w: 500, h: 300 }],   // 어느 쪽에도 안 들어간다 — 겹쳐도 창 안에
  ]) {
    const p = C.placeBubble(t, bub, view);
    assert.ok(p.x >= 0 && p.x + bub.w <= view.w, `가로 ${JSON.stringify(p)}`);
    assert.ok(p.y >= 0 && p.y + bub.h <= view.h, `세로 ${JSON.stringify(p)}`);
  }
});

test("여러 칸을 합친 구멍 · 창 안으로 자르기", () => {
  assert.deepEqual(C.unionRect([{ left: 10, top: 20, right: 110, bottom: 60 }, { left: 30, top: 80, right: 200, bottom: 120 }], { w: 1000, h: 1000 }), { x: 10, y: 20, w: 190, h: 100 });
  assert.deepEqual(C.unionRect([{ left: -10, top: -20, right: 110, bottom: 2000 }], { w: 100, h: 900 }), { x: 0, y: 0, w: 100, h: 900 });
  assert.equal(C.unionRect([], { w: 100, h: 100 }), null);
  assert.equal(C.unionRect([{ left: 200, top: 0, right: 300, bottom: 10 }], { w: 100, h: 100 }), null, "창 밖이면 없는 것으로");
});

test("화면 잇기 — 두 화면이 불러오고, 안내 중에는 섬이 접히지 않는다", () => {
  for (const f of ["index.html", "win.html"]) assert.match(fs.readFileSync(path.join(NAV, f), "utf8"), /<script src="coach\.js"/, f);
  assert.match(fs.readFileSync(path.join(NAV, "../../03-backend/navigator/server.js"), "utf8"), /"coach\.js"/, "서버의 허용 목록 — 빠지면 앱에서 안내가 조용히 안 뜬다");
  const pinned = fs.readFileSync(path.join(NAV, "app/00-base.js"), "utf8").split("\n").find((l) => l.includes("const pinned ="));
  assert.match(pinned, /st\.coach/, "접히면 밝힐 곳이 사라진다");
  assert.match(fs.readFileSync(path.join(NAV, "app/58-workspace.js"), "utf8"), /coachTag\(\)/, "앱 · 브라우저가 같이 쓰는 qwinHTML에 신호");
  assert.match(fs.readFileSync(path.join(NAV, "win.js"), "utf8"), /FloeCoach\.sync\(\)/);
});

// ── 처음 설정의 안내 · 로그인 실행 칸(두승현 2026-11-05 "처음 설정할 때도 온보딩" · "명령어가 이미 입력되어 있어서 사용자가 그냥 실행만") ──
const U = require("../../02-frontend/navigator/setup.js");
const L = require("../../02-frontend/electron/lib.js");
const { EventEmitter } = require("node:events");
const st = (c = {}, extra = {}) => ({ claude: { found: true, version: "2", signedIn: true, ...c }, apiKey: false, ...extra });
const S = (x) => ({ coach: true, step: "hello", st: st(), checked: null, busy: "", gh: null, project: null, login: null, ...x });
const gh = (found, signedIn) => ({ ok: true, gh: { found, signedIn } });

test("처음 설정 걸음 — 상태에 맞는 것만", () => {
  assert.equal(U.coachStep(S()), "su-hello");
  assert.equal(U.coachStep(S({ step: "choose" })), "su-choose");
  assert.equal(U.coachStep(S({ step: "cli", st: st({ found: false, signedIn: null }) })), "su-find");
  assert.equal(U.coachStep(S({ step: "cli", st: st({ signedIn: false }) })), "su-login");
  assert.equal(U.coachStep(S({ step: "cli", st: st({ signedIn: null }) })), "su-check", "로그인했는지 모르면 연결 확인으로 본다");
  assert.equal(U.coachStep(S({ step: "cli", st: st({ signedIn: null }), checked: { error: "x" } })), "su-login", "Claude Code를 처음 쓰면 기록 파일이 없다(null) — 연결 확인이 실패하면 로그인으로");
  assert.equal(U.coachStep(S({ step: "cli", st: st({}, { apiKey: true }) })), "su-unkey");
  assert.equal(U.coachStep(S({ step: "cli" })), "su-check");
  assert.equal(U.coachStep(S({ step: "cli", checked: { error: "x" } })), "su-check", "실패해도 그 줄에 남는다");
  assert.equal(U.coachStep(S({ step: "cli", checked: true })), "su-next");
  assert.equal(U.coachStep(S({ step: "api", st: st({}, { apiKey: false }) })), "su-key");
  assert.equal(U.coachStep(S({ step: "api", st: st({}, { apiKey: true }) })), "su-check");
  assert.equal(U.coachStep(S({ step: "api", st: st({}, { apiKey: true }), checked: true })), "su-next");
  assert.equal(U.coachStep(S({ step: "apps" })), "su-apps");
  assert.equal(U.coachStep(S({ step: "github", gh: gh(false, null) })), "su-gh-find");
  assert.equal(U.coachStep(S({ step: "github", gh: gh(true, false) })), "su-gh-login");
  assert.equal(U.coachStep(S({ step: "github", gh: gh(true, true) })), "su-gh-next", "AI 연결의 su-next(점 2개)가 아니라 GitHub 칸의 걸음(F-163)");
  assert.equal(U.coachStep(S({ step: "project" })), "su-project");
  assert.equal(U.coachStep(S({ step: "project", project: { name: "a" } })), "su-project-next");
  assert.equal(U.coachStep(S({ step: "done" })), "su-done");
});

test("처음 설정 안내 — 꺼져 있거나 기다리는 동안 어둡게 하지 않고, 로그인 중에는 실행 칸만", () => {
  assert.equal(U.coachStep(S({ coach: false })), "");
  for (const busy of ["check", "clone", "new", "folder", "gh", "find", "key", "applink", "unkey"]) assert.equal(U.coachStep(S({ step: "cli", busy })), "", busy);
  assert.equal(U.coachStep(S({ step: "cli", st: null })), "", "상태를 아직 모르면");
  assert.equal(U.coachStep(S({ step: "github", gh: null })), "", "gh 상태를 아직 모르면");
  assert.equal(U.coachStep(S({ step: "cli", login: { running: true } })), "su-run");
  assert.equal(U.coachStep(S({ step: "github", login: { name: "gh", running: true } })), "su-gh-run");
  assert.equal(U.coachStep(S({ step: "future-stage" })), "", "addStage로 더한 칸은 안내하지 않는다");
});

test("처음 설정 걸음표 — 나올 수 있는 걸음마다 말 · 밝힐 곳이 있고, 카드 안만 어둡게 한다", () => {
  for (const app of [true, false]) {
    const t = U.coachSteps({ app, platform: "Win32" });
    for (const id of ["su-hello", "su-choose", "su-find", "su-login", "su-unkey", "su-check", "su-key", "su-next", "su-apps", "su-gh-find", "su-gh-login", "su-gh-next", "su-project", "su-project-next", "su-done", "su-run", "su-gh-run"]) {
      assert.ok(t[id] && t[id].sel && t[id].text, id);
      assert.equal(t[id].clip, "#floe-setup .su", `${id} — 앱의 창은 투명해서 창 전체를 어둡게 하면 바탕 화면에 회색 네모가 생긴다`);
      assert.ok(t[id].dot[0] >= 1 && t[id].dot[1] === 6);
    }
    assert.match(t["su-gh-find"].sel, /ghskip/, "GitHub는 없이 갈 길을 막지 않는다"); assert.match(t["su-gh-login"].sel, /ghskip/);
    assert.match(t["su-hello"].sel, /later/, "'나중에 할게요'도 눌린다"); assert.match(t["su-choose"].sel, /practice/, "연습용 예시도 눌린다");
  }
  assert.match(U.coachSteps({ app: true, platform: "Win32" })["su-login"].text, /실행/);
  assert.match(U.coachSteps({ app: false, platform: "Win32" })["su-login"].text, /PowerShell/, "브라우저 판은 복사 칸 — 터미널 여는 법");
  assert.match(U.coachSteps({ app: false, platform: "MacIntel" })["su-login"].text, /터미널/);
});

test("처음 설정 안내는 켤 때 저절로 열릴 때만 — 다시 여는 길 · 주소 끝 장면은 아니다", () => {
  const src = fs.readFileSync(path.join(NAV, "setup.js"), "utf8");
  assert.match(src, /coachNext = coachWanted\(/, "boot만 안내를 켠다"); assert.match(src, /s\.coach = coachNext && !!root\.FloeCoach; coachNext = false;/, "한 번만");
  assert.equal(U.coachWanted(null, "", "", false), true);
  assert.equal(U.coachWanted({ done: true }, "", "", false), false, "이미 끝냈으면");
  assert.equal(U.coachWanted(null, "#setup", "", false), false, "주소 끝 #setup");
  assert.equal(U.coachWanted(null, "", "off", false), false, "시험이 끈다(floe:setup-coach)");
  assert.equal(U.coachWanted(null, "", "", true), false, "휴대폰");
  const acts = fs.readFileSync(path.join(NAV, "app/90-acts.js"), "utf8");
  assert.match(acts, /FloeSetup\.open\(\)/); assert.doesNotMatch(acts, /FloeSetup\.open\(\{[^}]*coach/, "설정에서 다시 열면 안내 없이");
});

test("실행 칸의 결과 줄 — 글은 가리고, https 주소는 링크로, 일회용 코드는 복사 단추로", () => {
  assert.equal(U.loginLineHTML("<img src=x onerror=alert(1)>"), "&lt;img src=x onerror=alert(1)&gt;");
  assert.match(U.loginLineHTML("Open: https://github.com/login/device"), /<a class="su-link" href="https:\/\/github\.com\/login\/device" target="_blank" rel="noopener">/);
  assert.doesNotMatch(U.loginLineHTML("Open: http://evil.test/x javascript:alert(1)"), /<a /, "https만 링크로");
  assert.doesNotMatch(U.loginLineHTML('https://a.test/"onclick=x'), /href="[^"]*"onclick/, "주소가 속성을 벗어나지 못한다");
  assert.match(U.loginLineHTML("! First copy your one-time code: 3CF6-0371"), /data-s="copycode" data-v="3CF6-0371"/);
  assert.deepEqual(U.LOGIN_CMD.claude, L.LOGIN_COMMANDS.claude.flat().join(" "), "화면에 보이는 명령 = 앱이 실제로 돌리는 명령");
  assert.deepEqual(U.LOGIN_CMD.gh, L.LOGIN_COMMANDS.gh.flat().join(" "));
});

// 가짜 프로세스
function fakeSpawn() { const calls = []; const spawn = (cmd, args, opt) => { const c = new EventEmitter(); c.stdout = new EventEmitter(); c.stderr = new EventEmitter(); c.pid = 7; calls.push({ cmd, args, opt, c }); return c; }; return { calls, spawn }; }
const runner = (f, over = {}) => { const killed = []; const r = L.loginRunner({ spawn: f.spawn, launch: () => ({ cmd: "claude", pre: [], env: {} }), kill: (c) => killed.push(c), ...over }); return { r, killed }; };

test("로그인 실행 — 표에 없는 이름은 띄우지 않고, 셸 없이 띄운다", () => {
  const f = fakeSpawn(), { r } = runner(f);
  for (const bad of ["rm", "constructor", "__proto__", "claude auth logout", "", null]) assert.equal(r.run(bad, () => {}, () => {}).ok, false, String(bad));
  assert.equal(f.calls.length, 0);
  assert.equal(r.run("gh", () => {}, () => {}).ok, true);
  assert.equal(f.calls[0].cmd, "gh"); assert.deepEqual(f.calls[0].args, ["auth", "login", "--web", "--hostname", "github.com", "--git-protocol", "https"]);
  assert.ok(!f.calls[0].opt.shell, "셸 없이"); assert.deepEqual(f.calls[0].opt.stdio, ["ignore", "pipe", "pipe"]);
});

test("로그인 실행 — claude는 provider.js의 여는 법을 따른다(npm으로 깐 PC는 node + cli.js)", () => {
  const f = fakeSpawn(), { r } = runner(f, { launch: () => ({ cmd: "node", pre: ["C:/x/cli.js"], env: { A: "1" } }) });
  r.run("claude", () => {}, () => {});
  assert.equal(f.calls[0].cmd, "node"); assert.deepEqual(f.calls[0].args, ["C:/x/cli.js", "auth", "login"]); assert.equal(f.calls[0].opt.env.A, "1");
});

test("로그인 실행 — 줄 단위로 보내고 색 코드를 지우며, 한 번에 하나, 끝을 한 번만 알린다", () => {
  const f = fakeSpawn(), { r } = runner(f), lines = [], ends = [];
  assert.equal(r.run("claude", (l) => lines.push(l), (e) => ends.push(e)).ok, true);
  assert.equal(r.run("gh", () => {}, () => {}).ok, false, "돌고 있으면 또 띄우지 않는다");
  const c = f.calls[0].c;
  c.stdout.emit("data", Buffer.from("\x1b[32mOpening\x1b[0m browser\nIf not: \x1b]8;;https://a.test/x\x07https://a.test/x\x1b]8;;\x07\npart"));
  c.stderr.emit("data", Buffer.from("err line\n\n"));
  c.emit("exit", 0, null); c.emit("close", 0);
  assert.deepEqual(lines, ["Opening browser", "If not: https://a.test/x", "err line", "part"]);
  assert.deepEqual(ends, [{ ok: true, reason: "" }]);
  assert.equal(r.run("claude", () => {}, () => {}).ok, true, "끝나면 다시 띄울 수 있다");
});

test("로그인 실행 — 못 찾음 · 실패 · 그만두기 · 5분 끊기", () => {
  let f = fakeSpawn(), x = runner(f), ends = [];
  x.r.run("gh", () => {}, (e) => ends.push(e));
  f.calls[0].c.emit("error", Object.assign(new Error("no"), { code: "ENOENT" }));
  assert.equal(ends[0].ok, false); assert.match(ends[0].reason, /찾지 못/);

  f = fakeSpawn(); x = runner(f); ends = [];
  x.r.run("gh", () => {}, (e) => ends.push(e)); f.calls[0].c.emit("exit", 1, null);
  assert.equal(ends[0].ok, false); assert.match(ends[0].reason, /되지 않았/);

  f = fakeSpawn(); x = runner(f); ends = [];
  x.r.run("gh", () => {}, (e) => ends.push(e)); x.r.stop();
  assert.equal(x.killed.length, 1, "나무째 끄는 함수로"); f.calls[0].c.emit("exit", null, "SIGTERM");
  assert.equal(ends[0].ok, false); assert.match(ends[0].reason, /그만/);

  f = fakeSpawn(); let fire = null, wait = 0;
  x = runner(f, { later: (fn, ms) => { fire = fn; wait = ms; return 1; }, cancel: () => {} }); ends = [];
  x.r.run("gh", () => {}, (e) => ends.push(e));
  assert.equal(wait, 5 * 60 * 1000); fire();
  assert.equal(x.killed.length, 1); f.calls[0].c.emit("exit", null, "SIGTERM");
  assert.match(ends[0].reason, /5분/);
});

test("로그인 실행 잇기 — 섬 창에서 온 요청만, 결과를 파일 · 기록에 남기지 않고, 그동안 항상 위를 끈다", () => {
  const main = fs.readFileSync(path.join(NAV, "../electron/main.js"), "utf8");
  const h = main.slice(main.indexOf('ipcMain.handle("floe:login-run"'), main.indexOf('ipcMain.handle("floe:login-stop"') + 200);
  assert.match(h, /fromIsland\(e\)/); assert.match(h, /setAlwaysOnTop\(false\)/); assert.doesNotMatch(h, /console\.|writeFile|appendFile/);
  assert.match(fs.readFileSync(path.join(NAV, "../electron/preload.js"), "utf8"), /runLogin: \(name\) => ipcRenderer\.invoke\("floe:login-run", String\(name \|\| ""\)\)/);
  const src = fs.readFileSync(path.join(NAV, "setup.js"), "utf8");
  assert.doesNotMatch(src, /runLogin\([^)]*(CMD|LOGIN_CMD)/, "화면은 이름만 보낸다"); assert.doesNotMatch(src, /localStorage\.setItem\([^)]*login/i);
});

// claude-drafted: 2026-11-07 — F-162(임유정 "'뒤로'버튼을 클릭해도 뒤로 가지 않는 버그"). 안내 층이 밝힌 곳 밖을 막아 '‹ 뒤로'가 눌리지 않았다
test("처음 설정 안내 중에도 '‹ 뒤로'는 눌린다 — 밝히지는 않고(pass) 눌러도 되는 곳으로", () => {
  const at = (sel) => ({ closest: (q) => (q.split(",").map((x) => x.trim()).some((x) => x === sel) ? {} : null) });
  const back = at('#floe-setup [data-s="go"]'), other = at('#floe-setup [data-s="nowhere"]');
  for (const app of [true, false]) {
    const t = U.coachSteps({ app, platform: "Win32" });
    for (const id of Object.keys(t)) {
      assert.ok(C.lets(t[id], back), `${id} — 뒤로`);
      assert.ok(!C.lets(t[id], other), `${id} — 밝히지 않은 다른 단추는 여전히 막힌다`);
    }
    assert.doesNotMatch(t["su-choose"].sel, /"go"/, "밝히는 자리는 그대로 — 고르기 카드 · 연습용 예시만");
  }
  assert.ok(!C.lets({ sel: ".a" }, at('#floe-setup [data-s="go"]')), "pass가 없는 걸음(작업실 안내)은 전처럼");
});

// claude-drafted: 2026-11-07 — F-163(임유정 "버튼을 눌러서 다음 단계로 왔는데도 갑자기 점 색이 3개에서 2개로 줄어들어서"). 단계를 넘기면 말풍선 점은 줄지 않는다
test("말풍선 점은 처음 설정을 앞으로 넘길 때 줄지 않는다 — 어느 길로 가도", () => {
  const t = U.coachSteps({ app: true, platform: "Win32" }), dot = (st) => t[U.coachStep(S(st))].dot[0];
  const ai = { st: st({}) };
  const paths = [
    [{}, { step: "choose" }, { step: "cli", ...ai }, { step: "cli", ...ai, checked: true }, { step: "apps" }, { step: "github", gh: gh(true, true) }, { step: "project" }, { step: "project", project: { name: "a" } }, { step: "done" }],
    [{}, { step: "choose" }, { step: "api", st: st({}, { apiKey: false }) }, { step: "api", st: st({}, { apiKey: true }), checked: true }, { step: "apps" }, { step: "github", gh: gh(false, null) }, { step: "github", gh: gh(true, false) }, { step: "github", gh: gh(true, true) }, { step: "project" }, { step: "done" }],
  ];
  for (const p of paths) { const ns = p.map(dot); for (let i = 1; i < ns.length; i++) assert.ok(ns[i] >= ns[i - 1], `점 ${ns.join(" → ")}`); }
});

// claude-drafted: 2026-11-07 — F-166-1. 준비 끝의 안내는 저장소 만들기 칸이 있으면 그 칸에 먼저 초점 — 시작하기에 초점이 가면 Enter 한 번에 GitHub 저장소가 맡겨졌다
test("준비 끝 안내의 초점은 저장소 만들기 칸이 먼저, 없으면 시작하기", () => {
  const t = U.coachSteps({ app: true, platform: "Win32" });
  assert.match(t["su-done"].focus, /^#floe-setup \[data-s="makerepo"\], #floe-setup \[data-s="done"\]$/);
});
