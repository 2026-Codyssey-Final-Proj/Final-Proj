// claude-drafted: 2026-10-19 — 한 줄로 켜기(floe.js): 훅 연결 → 서버 → 브라우저. 인자 읽기 · 서버 인자(.env는 Node 20.6부터) · 브라우저 명령 · 안내 글에 값이 없는지,
// 그리고 진짜로 한 번 켠다 — 임시 폴더에 훅이 더해지고, 빈 포트에서 서버가 열리고, --off로 훅이 빠지는지(브라우저는 열지 않는다 · AI는 부르지 않는다).
// 실행: node --test 04-tests/navigator/floe.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const http = require("node:http");
const { spawn, spawnSync } = require("node:child_process");
const F = require("../../03-backend/navigator/floe.js");
const BACK = path.join(__dirname, "../../03-backend/navigator");

test("인자: 폴더 · --off · --codex · --no-open · --port. 폴더를 안 주면 지금 폴더, 이상한 포트는 기본값", () => {
  const o = F.parseArgs(["/tmp/x", "--off", "--codex", "--no-open", "--port", "4399"], "/cwd", {});
  assert.equal(o.dir, path.resolve("/tmp/x")); assert.equal(o.off, true);   // 기대값도 이 OS의 규칙으로 — Windows는 D:\tmp\x (KAN-57 F-28-2) assert.equal(o.codex, true); assert.equal(o.open, false); assert.equal(o.port, 4399);
  const d = F.parseArgs([], "/cwd", {});
  assert.equal(d.dir, path.resolve("/cwd")); assert.equal(d.off, false); assert.equal(d.open, true); assert.equal(d.port, F.DEFAULT_PORT);
  assert.equal(F.parseArgs(["--port", "abc"], "/cwd", {}).port, F.DEFAULT_PORT);
  assert.equal(F.parseArgs([], "/cwd", { NAV_PORT: "4500" }).port, 4500, "환경변수 NAV_PORT도 읽는다");
  assert.equal(F.parseArgs(["--port", "4600"], "/cwd", { NAV_PORT: "4500" }).port, 4600, "--port가 환경변수보다 먼저");
  assert.equal(F.parseArgs(["my-proj", "--port", "4601"], "/cwd", {}).dir, path.resolve("/cwd", "my-proj"), "--port 다음 낱말은 폴더가 아니다");
  assert.equal(F.parseArgs(["-h"]).help, true);
});

test("서버 인자: .env가 있고 Node 20.6 이상이면 --env-file, 아니면 server.js만", () => {
  assert.deepEqual(F.serverArgs({ envFile: true, nodeVersion: "v20.6.0" }), ["--env-file=.env", "server.js"]);
  assert.deepEqual(F.serverArgs({ envFile: true, nodeVersion: "v26.8.1" }), ["--env-file=.env", "server.js"]);
  assert.deepEqual(F.serverArgs({ envFile: true, nodeVersion: "v20.5.9" }), ["server.js"]);
  assert.deepEqual(F.serverArgs({ envFile: true, nodeVersion: "v18.19.0" }), ["server.js"]);
  assert.deepEqual(F.serverArgs({ envFile: false, nodeVersion: "v26.8.1" }), ["server.js"]);
});

test("브라우저 열기: 운영체제마다 명령", () => {
  assert.deepEqual(F.openCommand("darwin", "http://127.0.0.1:4317"), { cmd: "open", args: ["http://127.0.0.1:4317"] });
  assert.deepEqual(F.openCommand("win32", "http://127.0.0.1:4317"), { cmd: "cmd", args: ["/c", "start", "", "http://127.0.0.1:4317"] });
  assert.deepEqual(F.openCommand("linux", "http://127.0.0.1:4317"), { cmd: "xdg-open", args: ["http://127.0.0.1:4317"] });
});

test("안내 글: 주소 · 폴더 · 끄는 법 · --off가 있고, 키 · 토큰 값은 없다", () => {
  const s = F.summary({ dir: "/Users/me/proj", url: "http://127.0.0.1:4317", codex: true, envFile: true, hooked: true });
  assert.ok(s.includes("http://127.0.0.1:4317") && s.includes("/Users/me/proj") && s.includes("Ctrl+C") && s.includes("--off") && s.includes("Codex"));
  assert.ok(s.includes(".env의 내 API 키"), "키 파일이 있으면 그걸로 부른다고 말한다 — 값은 아니다");
  assert.ok(!/sk-ant|ANTHROPIC_API_KEY=/.test(s));
  assert.ok(F.summary({ dir: "/x", url: "u", hooked: false }).includes("훅을 더하지 못했어요"));
  assert.ok(F.summary({ dir: "/x", url: "u", envFile: false }).includes("구독"));
});

// ── 진짜로 한 번 켠다 — 임시 폴더 · 빈 포트 · 확인 값 파일과 사용량 파일도 임시로(이 컴퓨터의 것을 건드리지 않게) ──
const freePort = () => new Promise((r) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const get = (url) => new Promise((r) => { const q = http.get(url, (res) => { let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => r({ status: res.statusCode, body: b })); }); q.on("error", () => r({ status: 0, body: "" })); });

test("켜기: 임시 폴더에 훅이 더해지고 빈 포트에서 서버가 열린다 · --off로 훅이 빠진다 (브라우저 · AI 호출 없음)", { timeout: 30_000 }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "floe-test-"));
  const proj = path.join(tmp, "my-proj"); fs.mkdirSync(proj);
  const env = { ...process.env, NAV_EVENT_TOKEN_FILE: path.join(tmp, "token"), NAV_USAGE_FILE: path.join(tmp, "usage.json"), NAV_REPLAY: path.join(BACK, "recordings/demo.json") };
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(BACK, "floe.js"), proj, "--no-open", "--port", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
  let out = "", err = "";
  child.stdout.on("data", (d) => (out += d)); child.stderr.on("data", (d) => (err += d));
  try {
    const up = await F.waitFor(`http://127.0.0.1:${port}/api/usage`, 15_000);
    assert.ok(up, `서버가 열리지 않았다\n${out}\n${err}`);
    const r = await get(`http://127.0.0.1:${port}/api/usage`);
    assert.equal(r.status, 200); assert.equal(JSON.parse(r.body).ok, true);
    // 훅이 그 폴더의 개인 설정에 더해졌다(connect.js와 같은 자리 · 같은 모양)
    const settings = JSON.parse(fs.readFileSync(path.join(proj, ".claude/settings.local.json"), "utf8"));
    for (const e of ["UserPromptSubmit", "Stop"]) assert.ok(settings.hooks[e].some((g) => g.hooks.some((h) => h.command.includes("navigator/hook.js"))), e);
    // 안내 글이 나왔고 값은 없다
    await new Promise((r) => setTimeout(r, 300));
    assert.ok(out.includes(`http://127.0.0.1:${port}`) && out.includes("Ctrl+C"), out);
    assert.ok(!out.includes(fs.readFileSync(path.join(tmp, "token"), "utf8").trim()), "확인 값은 출력에 없다");
  } finally {
    child.kill("SIGINT");
    await new Promise((r) => child.on("exit", r));
  }
  // --off: 훅만 뺀다, 서버는 켜지 않는다
  const off = spawnSync(process.execPath, [path.join(BACK, "floe.js"), proj, "--off", "--port", String(port)], { env, encoding: "utf8" });
  assert.equal(off.status, 0, off.stderr);
  const after = JSON.parse(fs.readFileSync(path.join(proj, ".claude/settings.local.json"), "utf8"));
  assert.equal(after.hooks, undefined, "훅 칸이 비면 지운다");
  assert.ok(off.stdout.includes("뺐어요"));
  assert.equal((await get(`http://127.0.0.1:${port}/api/usage`)).status, 0, "--off는 서버를 켜지 않는다");
  // 없는 폴더는 거절
  const bad = spawnSync(process.execPath, [path.join(BACK, "floe.js"), path.join(tmp, "없는-폴더"), "--no-open"], { env, encoding: "utf8" });
  assert.equal(bad.status, 1); assert.ok(bad.stderr.includes("폴더가 없어요"));
  fs.rmSync(tmp, { recursive: true, force: true });
});
