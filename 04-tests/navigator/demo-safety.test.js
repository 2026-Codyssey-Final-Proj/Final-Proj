// claude-drafted: 2026-10-18
// 시연 안전장치 S3~S5 — navigator-prototype-rules-review.md 6절 "시연 안전장치 점검표". 각 항목의 위반 시도를 먼저 시험으로 썼다.
//   S3 확인 값(토큰)이 없거나 틀린 /api/event·/api/events는 거절한다
//   S4 받은 알림 글도 보이기 전에 민감 패턴 검사(공유 규칙 share-rules.js와 같은 규칙)를 거친다
//   S5 기록을 비울 수 있다(지우기 주소, 서버 다시 켜기)
// 실제 AI는 부르지 않는다. 확인 값 파일은 임시 폴더에만 만든다(홈 폴더의 진짜 파일을 건드리지 않는다).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawn } = require("node:child_process");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-safety-"));
const TOKEN_FILE = path.join(TMP, "event-token");
// 시험 안에서만 쓰는 가짜 비밀값 — 소스에 키 모양이 그대로 남지 않게 실행할 때 만든다(check-secrets.sh가 커밋을 막지 않게)
const FAKE_KEY = "sk-" + "Ab3x".repeat(6);
const FAKE_GH = "ghp_" + "Q7w".repeat(10);

let S, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const token = () => fs.readFileSync(TOKEN_FILE, "utf8").trim();

before(async () => {
  port = await freePort();
  process.env.NAV_PORT = String(port);
  process.env.NAV_EVENT_TOKEN_FILE = TOKEN_FILE;
  S = require("../../03-backend/navigator/server.js");
  srv = http.createServer(S.handle);
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  await call("GET", "/");   // 화면을 한 번 연다 — 서버가 확인 값을 만든다
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });

function call(method, url, { headers = {}, body, at = port } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const h = { ...headers, ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}) };
    const req = http.request({ host: "127.0.0.1", port: at, path: url, method, headers: h, timeout: 5000 }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (d) => (text += d));
      res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, headers: res.headers, json, text }); });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error(`${method} ${url} 응답 없음`)));   // 답하지 않는 서버에서 시험이 멈춰 있지 않게
    req.end(data);
  });
}
const withToken = (extra = {}) => ({ "X-Nav-Token": token(), ...extra });
const post = (body, headers = withToken()) => call("POST", "/api/event", { headers, body });
const events = (since = 0, headers = withToken()) => call("GET", `/api/events?since=${since}`, { headers });
const ask = (session, prompt) => ({ hook_event_name: "UserPromptSubmit", session_id: session, cwd: "/work/club-app", prompt });

// ── S3 확인 값 ──
test("S3: 확인 값 없이·틀린 값으로 /api/events를 물으면 403으로 거절하고, 알림 글은 새지 않는다", async () => {
  assert.equal((await post(ask("s3-read", "행사 목록 화면 만들어 줘"))).status, 200);
  for (const headers of [{}, { "X-Nav-Token": "wrong-value" }, { "X-Nav-Token": token().slice(0, -1) }, { Cookie: "nav_event_token=nope" }]) {
    const r = await events(0, headers);
    assert.equal(r.status, 403, JSON.stringify(headers));
    assert.deepEqual([r.json.ok, typeof r.json.reason], [false, "string"], "다른 거절과 같은 모양 {ok:false, reason}");
    assert.ok(!r.text.includes("행사 목록"), "거절에 알림 글이 섞이면 안 된다");
  }
  const ok = await events(0);
  assert.equal(ok.status, 200);
  assert.ok(ok.json.events.some((e) => e.work.includes("행사 목록")), "맞는 값이면 받는다");
});

test("S3: 확인 값 없이 /api/event로 알림을 보내면 거절하고, 저장하지 않는다", async () => {
  const { latest } = (await events(0)).json;
  for (const headers of [{}, { "X-Nav-Token": "wrong-value" }]) {
    const r = await post(ask("s3-write", "가짜 알림"), headers);
    assert.equal(r.status, 403);
    assert.equal(r.json.ok, false);
  }
  const now = (await events(0)).json;
  assert.equal(now.latest, latest, "번호가 늘지 않았다");
  assert.ok(!now.events.some((e) => e.work.includes("가짜 알림")));
});

test("S3: 기록 비우기 주소도 확인 값 없이는 거절한다", async () => {
  await post(ask("s3-clear", "남아 있어야 하는 말"));
  assert.equal((await call("POST", "/api/events/clear")).status, 403);
  assert.ok((await events(0)).json.events.some((e) => e.work.includes("남아 있어야 하는 말")), "거절되면 기록은 그대로");
});

test("S3: 화면을 열면 확인 값이 HttpOnly·SameSite=Strict 쿠키로 오고, 페이지 글에는 값이 없다 — 화면은 그 쿠키로 /api/events를 묻는다", async () => {
  for (const page of ["/", "/navigator/index.html", "/index.html"]) {
    const r = await call("GET", page);
    assert.equal(r.status, 200, page);
    const cookie = (r.headers["set-cookie"] || []).find((c) => c.startsWith("nav_event_token="));
    assert.ok(cookie, `${page}에서 쿠키가 와야 한다`);
    assert.match(cookie, /;\s*HttpOnly/i);
    assert.match(cookie, /;\s*SameSite=Strict/i);
    assert.match(cookie, /;\s*Path=\/api(;|$)/, "API 주소(알림 · AI)에만 실려 간다 — F-04로 /api/events에서 넓힘");
    assert.ok(!r.text.includes(token()), "페이지 글(스크립트가 읽을 수 있는 곳)에 값을 넣지 않는다");
  }
  const js = await call("GET", "/app.js");
  assert.equal(js.headers["set-cookie"], undefined, "화면 파일(html)만 쿠키를 준다");
  const pair = (await call("GET", "/")).headers["set-cookie"][0].split(";")[0];
  assert.equal((await events(0, { Cookie: `other=1; ${pair}` })).status, 200, "쿠키만으로 묻는다(화면 코드를 고치지 않아도 된다)");
});

test("S3: 확인 값 파일은 저장소 밖(홈 폴더)에 두고 나만 읽을 수 있고(600), 다시 켜도 같은 값이며, 이상한 내용이면 새로 만든다", () => {
  assert.equal(S.TOKEN_FILE, TOKEN_FILE, "시험에서는 환경변수로 바꾼 자리를 쓴다");
  assert.equal(S.DEFAULT_TOKEN_FILE, path.join(os.homedir(), ".navigator-event-token"));
  const repo = path.resolve(__dirname, "../..");
  assert.ok(path.relative(repo, S.DEFAULT_TOKEN_FILE).startsWith(".."), "기본 자리는 저장소 안이 아니다");
  const f = path.join(TMP, "sub", "t");
  const a = S.eventToken(f);
  assert.match(a, /^[A-Za-z0-9_-]{43,}$/, "길고 맞히기 어려운 값");
  assert.equal(S.eventToken(f), a, "있으면 그대로 쓴다");
  if (process.platform !== "win32") {
    assert.equal(fs.statSync(f).mode & 0o777, 0o600);
    fs.chmodSync(f, 0o644);
    assert.equal(S.eventToken(f), a);
    assert.equal(fs.statSync(f).mode & 0o777, 0o600, "남이 읽을 수 있게 바뀌었으면 다시 나만");
  }
  fs.writeFileSync(f, "짧음");
  const b = S.eventToken(f);
  assert.notEqual(b, "짧음");
  assert.match(b, /^[A-Za-z0-9_-]{43,}$/);
  if (process.platform !== "win32") assert.equal(fs.statSync(f).mode & 0o777, 0o600);
});

test("S3: hook.js는 확인 값 파일을 읽어 같이 보내 알림이 화면까지 가고, 아무것도 출력하지 않는다", async () => {
  const out = await new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(BACK, "hook.js")], { env: { ...process.env, NAV_PORT: String(port), NAV_EVENT_TOKEN_FILE: TOKEN_FILE } });
    let o = "";
    c.stdout.on("data", (d) => (o += d));
    c.on("close", (code) => resolve({ code, o }));
    c.stdin.end(JSON.stringify({ hook_event_name: "Stop", session_id: "s3-hook", cwd: "/work/club-app", last_assistant_message: "훅이 보낸 답" }));
  });
  assert.deepEqual([out.code, out.o], [0, ""]);
  assert.ok((await events(0)).json.events.some((e) => e.work.includes("훅이 보낸 답")));
});

test("hook.js는 아주 긴 마지막 답(4만 자 넘게)도 줄여 보내 알림이 버려지지 않는다 (API.md 4절 10번)", async () => {
  await new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(BACK, "hook.js")], { env: { ...process.env, NAV_PORT: String(port), NAV_EVENT_TOKEN_FILE: TOKEN_FILE } });
    c.on("close", resolve);
    c.stdin.end(JSON.stringify({ hook_event_name: "Stop", session_id: "long-hook", cwd: "/work/club-app", last_assistant_message: `긴 답의 첫머리 ${"가".repeat(60000)}` }));
  });
  const mine = (await events(0)).json.events.filter((e) => e.work.includes("긴 답의 첫머리"));
  assert.equal(mine.length, 1, "413으로 버려지지 않고 화면까지 온다");
  assert.ok(mine[0].work.length <= 4000, "서버는 그중 앞 4,000자만 쓴다");
});

// ── S4 받은 글 검사 ──
test("S4: 키·토큰 모양 글과 비밀번호 대입, 전화번호·이메일은 /api/events에서 그대로 나오지 않는다", async () => {
  const raw = [FAKE_KEY, FAKE_GH, "010-1234-5678", "member@club.example.com", "hunter2pass"];
  await post(ask("s4", `키는 ${FAKE_KEY} 이고 ${FAKE_GH} 도 있어. 비밀번호: hunter2pass, 연락처 010-1234-5678, member@club.example.com`));
  await post({ hook_event_name: "Stop", session_id: "s4", cwd: "/work/club-app", last_assistant_message: `알겠어요. ${FAKE_KEY} 로 연결할게요.` });
  const r = await events(0);
  const mine = r.json.events.filter((e) => e.work.includes("연락처"));
  assert.equal(mine.length, 2, "요청 받음·작업 마침 두 알림 모두");
  for (const t of raw) assert.ok(!r.text.includes(t), `${t.slice(0, 4)}…가 그대로 나왔다`);
  const work = mine[1].work;
  assert.match(work, /\[비밀값\]/, "키 모양은 자리표시로");
  assert.match(work, /\[전화번호 가림\]/);
  assert.match(work, /\[이메일 가림\]/);
  assert.match(work, /알겠어요/, "나머지 글은 그대로");
});

test("S4: 저장하기 전에 가린다 — 서버 메모리의 대화에도 원래 값이 남지 않는다", () => {
  const ev = S.addEvent(ask("s4-unit", `토큰 ${FAKE_GH} 하고 010-9876-5432`));
  assert.ok(!ev.work.includes(FAKE_GH) && !ev.work.includes("010-9876-5432"));
  const next = S.addEvent({ hook_event_name: "Stop", session_id: "s4-unit", last_assistant_message: "네" });
  assert.ok(!next.work.includes(FAKE_GH), "이어지는 알림(지난 말을 다시 담는다)에도 없다");
  assert.equal(S.addEvent({ ...ask("s4-ip", "x"), cwd: "/work/10.0.0.12" }).project, "[IP 주소 가림]", "폴더 이름도 같은 규칙");
});

// ── S5 기록 비우기 ──
test("S5: 기록을 비우면 /api/events가 비고, 지운 대화는 다음 알림에 섞이지 않으며, 번호는 이어진다", async () => {
  await post(ask("s5", "비우기 전에 한 말"));
  const before = (await events(0)).json;
  assert.ok(before.events.length > 0);
  const r = await call("POST", "/api/events/clear", { headers: withToken() });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true, cleared: before.events.length });
  const now = (await events(0)).json;
  assert.deepEqual(now.events, []);
  assert.equal(now.latest, before.latest, "번호는 되돌리지 않는다 — 열어 둔 화면이 새 알림을 놓치지 않게");
  const next = (await post(ask("s5", "비운 뒤 한 말"))).json;
  assert.ok(next.seq > before.latest);
  assert.equal((await events(0)).json.events[0].work, "[사용자] 비운 뒤 한 말", "지운 대화가 다시 나오지 않는다");
});

test("S5: 화면 쿠키로도 비울 수 있다(나중에 화면에 지우기 버튼을 달 때)", async () => {
  await post(ask("s5-cookie", "쿠키로 지울 말"));
  const pair = (await call("GET", "/")).headers["set-cookie"][0].split(";")[0];
  assert.equal((await call("POST", "/api/events/clear", { headers: { Cookie: pair } })).status, 200);
  assert.deepEqual((await events(0)).json.events, []);
});

test("S5: 서버를 다시 켜면 기록이 비어 있다(메모리에만 둔다) — 시작 로그에 확인 값이 나오지 않는다", async () => {
  const p = await freePort();
  const file = path.join(TMP, "restart-token");
  const env = { ...process.env, NAV_PORT: String(p), NAV_EVENT_TOKEN_FILE: file, NAV_USAGE_FILE: path.join(TMP, "usage.json") };
  const mine = () => ({ "X-Nav-Token": fs.readFileSync(file, "utf8").trim() });
  const start = () => new Promise((resolve, reject) => {
    const c = spawn(process.execPath, [path.join(BACK, "server.js")], { env });
    let log = "";
    const t = setTimeout(() => { c.kill(); reject(new Error(`서버가 켜지지 않음: ${log}`)); }, 10_000);
    c.stdout.on("data", (d) => { log += d; if (log.includes(`127.0.0.1:${p}`)) { clearTimeout(t); resolve({ c, log: () => log }); } });
    c.stderr.on("data", (d) => (log += d));
  });
  const stop = (c) => new Promise((r) => { c.on("close", r); c.kill(); });
  const one = await start();
  let first;
  try {
    assert.ok(fs.existsSync(file), "켜자마자 만든다 — 화면을 열기 전에 온 훅 알림도 받게");
    first = mine()["X-Nav-Token"];
    assert.equal((await call("POST", "/api/event", { at: p, headers: mine(), body: ask("s5-restart", "다시 켜기 전") })).status, 200);
    assert.equal((await call("GET", "/api/events?since=0", { at: p, headers: mine() })).json.events.length, 1);
  } finally { await stop(one.c); }
  const two = await start();
  try {
    const r = await call("GET", "/api/events?since=0", { at: p, headers: { "X-Nav-Token": first } });
    assert.equal(r.status, 200, "다시 켜도 같은 확인 값 — 열어 둔 화면·훅이 계속 된다");
    assert.deepEqual(r.json.events, []);
    assert.ok(!(one.log() + two.log()).includes(first), "확인 값을 출력하지 않는다");
  } finally { await stop(two.c); }
});
