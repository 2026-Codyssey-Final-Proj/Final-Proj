// claude-drafted: 2026-10-28 — 임유정 "플로로에서 A 폴더 작업 중 + 플로로를 통하지 않고 로컬에서 클로드코드로 B 폴더 작업 → 폴더를 바꿔 열기 전까지는 그냥 A를 띄워야지".
// 훅은 연결했던 폴더마다 남는다(연결을 바꿔도 이전 폴더의 훅은 그대로). 그래서 앱이 고른 폴더(useProject)가 있으면, 다른 폴더에서 온 알림에는 here: false를 붙이고
// 알림 답에 연결한 폴더 이름(project)을 실어 화면의 이름이 그 폴더만 따르게 한다. 앱이 고른 폴더가 없으면(브라우저로만 열었을 때) 전처럼 모든 알림이 here.
// 실행: node --test 04-tests/navigator/event-folder.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-evfolder-"));
Object.assign(process.env, { NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: path.join(TMP, "usage.json"), NAV_REPLAY: path.join(TMP, "replay.json") });

let Srv, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  Srv.eventToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
function call(method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const h = { "X-Nav-Token": fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim(), ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}) };
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: h, timeout: 5000 }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d));
      res.on("end", () => resolve(JSON.parse(text)));
    });
    req.on("error", reject); req.end(data);
  });
}
const stop = (sid, cwd) => call("POST", "/api/event", { hook_event_name: "Stop", session_id: sid, cwd, last_assistant_message: "다 했어요" });
const last = async () => { const r = await call("GET", "/api/events?since=0"); return { r, ev: r.events[r.events.length - 1] }; };

test("앱이 고른 폴더가 없으면 — 전처럼 모든 알림이 그 자리(here), 답의 project는 비어 있다", async () => {
  await stop("s-0", path.join(TMP, "아무-폴더"));
  const { r, ev } = await last();
  assert.equal(ev.here, true); assert.equal(r.project, "");
});

test("A를 연결한 동안 — A(와 그 안의 폴더)에서 온 알림만 here, B에서 온 알림은 here: false, 답의 project는 늘 A", async () => {
  const A = path.join(TMP, "samsung-stock-ai"), B = path.join(TMP, "Final-Proj");
  fs.mkdirSync(path.join(A, "backend"), { recursive: true }); fs.mkdirSync(B, { recursive: true });
  assert.equal(Srv.useProject(A), true);
  await stop("s-a", A); let { r, ev } = await last();
  assert.deepEqual({ here: ev.here, project: ev.project, now: r.project }, { here: true, project: "samsung-stock-ai", now: "samsung-stock-ai" });
  await stop("s-a2", path.join(A, "backend")); ({ ev } = await last());
  assert.equal(ev.here, true, "A 안의 폴더에서 연 Claude Code도 A");
  await stop("s-b", B); ({ r, ev } = await last());
  assert.deepEqual({ here: ev.here, project: ev.project, now: r.project }, { here: false, project: "Final-Proj", now: "samsung-stock-ai" }, "B의 알림은 B 이름 그대로 싣되(어디서 온 일인지), 연결한 폴더는 A");
  await stop("s-c", A + "-copy"); ({ ev } = await last());
  assert.equal(ev.here, false, "이름이 A로 시작하는 다른 폴더는 A가 아니다");
});

test("화면 — 이름은 연결한 폴더(답의 project)를 따르고, 다른 폴더의 알림은 이름 · 글 칸 · 살펴보기를 건드리지 않는다", () => {
  const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  assert.match(a, /appName = r\.project \|\| ""; if \(appName\) st\.project = appName;/, "알림을 물을 때마다 연결한 폴더 이름으로");
  assert.equal((a.match(/if \(ev\.project && ev\.here !== false && !appName\) st\.project = ev\.project;/g) || []).length, 2, "연결한 폴더가 없을 때만 알림의 폴더 이름으로(전처럼)");
  const stopAt = a.indexOf("if (ev.here === false) {"), notesAt = a.indexOf("st.alerts = A.add(st.alerts, ev,");
  assert.ok(stopAt > 0 && stopAt < notesAt && a.slice(stopAt, a.indexOf("\n", stopAt)).endsWith("return render(); }"), "다른 폴더의 알림은 글 칸 채우기 · 살펴보기 · 알림 기록 전에 멈춘다");
});

test("AI 진행(/api/steps)의 세션에도 here — B에서 고친 파일이 A의 판정 · 파일 카드 · '일하고 있어요'에 들어가지 않게(새 맥락 리뷰)", async () => {
  const A = path.join(TMP, "samsung-stock-ai"), B = path.join(TMP, "Final-Proj");
  fs.mkdirSync(path.join(A, "..cache"), { recursive: true });
  assert.equal(Srv.useProject(A), true);
  const step = (sid, cwd) => call("POST", "/api/event", { hook_event_name: "PostToolUse", session_id: sid, cwd, tool: "claude", tool_name: "Edit", step: { verb: "고쳤어요", what: "src/app.js", add: 3, del: 1 } });
  await step("st-a", A); await step("st-dot", path.join(A, "..cache")); await step("st-b", B);
  const r = await call("GET", "/api/steps?since=0");
  const here = Object.fromEntries(r.sessions.map((s) => [s.id.split(":").pop(), s.here]));
  assert.deepEqual({ a: here["st-a"], dot: here["st-dot"], b: here["st-b"] }, { a: true, dot: true, b: false }, "A 안의 '..cache'는 A, B는 아니다");
  assert.ok(r.sessions.every((s) => !("dir" in s)), "경로는 답에 싣지 않는다");
  const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8"), h = fs.readFileSync(path.join(__dirname, "../../02-frontend/hub/hub.js"), "utf8");
  assert.ok(a.includes("const mine = () => aiSessions.filter((s) => s.here !== false);") && a.includes("const latestSession = () => [...mine()]"), "판정의 일한 증거 · 파일 카드는 연결한 폴더의 세션만");
  assert.ok(a.includes("HUB.anyWorking(mine())"), "'일하고 있어요'도 연결한 폴더만");
  assert.ok(h.includes("at: inc.at, here: inc.here,"), "다시 받아 합칠 때 here를 잃지 않는다");
});

test("어떤 형태든 이 컴퓨터의 폴더 이름이 먼저 — 설정의 연결 줄도 연결한 폴더 이름, 마지막 알림이 다른 폴더면 그 이름은 뒤에(임유정 2026-10-28)", () => {
  const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
  assert.ok(a.includes('와 연결됨 · ${esc(wsFull() || st.feed.project || "프로젝트")} · 마지막 알림 ${ago(st.feed.at)}${st.feed.project && wsFull() && st.feed.project !== wsFull() ? `(${esc(st.feed.project)}에서)` : ""}'), "설정의 연결 줄 — 알약과 같은 이름(wsFull)");
  assert.ok(a.includes('const proj = wsFull() || (kind === "ai" && last ? last.project : "");'), "AI 진행 판 머리도 연결한 폴더 이름 먼저(A 안의 backend에서 열어도 A)");
  assert.ok(!a.includes("function fileCard"), "작업실 파일 카드는 C-58(2026-10-29)로 뺐다 — 바뀐 파일은 왼쪽 대화 목록(C-63)에서");
});
