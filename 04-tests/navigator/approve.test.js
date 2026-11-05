// claude-drafted: 2026-10-20 — FR-17 섬에서 허용 · 거절(C-4, 넘김 문서 fable-handoff-2026-10-20-c4-views.md 2절 ②). 코드보다 먼저 썼다(code.md 1번).
// Claude Code의 PermissionRequest 훅(approve-hook.js)과 승인 카드를 만드는 순수 모듈(approve.js), 훅을 다는 connect.js를 본다.
//   ① card — 도구마다 무엇을 · 바뀔 내용(가려서 · 줄 수 제한) · 되돌리기 어려운 일(삭제 · 강제 푸시 · 키 노출)
//   ② 바뀔 내용 어디에도 비밀값 원문이 없다   ③ sig — 요청의 지문(세션 · 도구 · 입력)   ④ decisionOutput — 허용 · 거절은 JSON, 그 밖은 빈 글(대신 허용하지 않는다)
//   ⑤ EXAMPLE — 서버 없이 보일 카드(쉬운 말)   ⑥ connect.js — PermissionRequest에 approve-hook.js, 시간 상한, 두 번 더해도 하나, 빼면 함께
//   ⑦ approve-hook.js를 실제로 돌린다 — 서버가 꺼져 있으면 출력 없이 0으로 빨리 끝남, 서버가 allow · deny · none · 이상한 답을 주면 각각 어떻게 출력하나
//      (Claude Code 훅 문서 2026-10-20 확인: PermissionRequest는 hookSpecificOutput.decision.behavior allow|deny로만 정하고, 결정 없이 끝나면 보통 흐름으로 간다 — 허용되지 않는다)
// 실행: node --test 04-tests/navigator/approve.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawn, spawnSync } = require("node:child_process");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const AP = require(path.join(BACK, "approve.js"));
const Connect = require(path.join(BACK, "connect.js"));
const HOOK = path.join(BACK, "approve-hook.js");

const CWD = "/Users/me/club-app";
// 시험 안에서만 쓰는 가짜 비밀값 — 실행할 때 만든다(check-secrets.sh)
const FAKE_KEY = "sk-" + "Zq9x".repeat(6);   // secret-check: allow
const ev = (tool_name, tool_input) => ({ hook_event_name: "PermissionRequest", session_id: "s-1", cwd: CWD, tool_name, tool_input });

// ── ① card ──
test("card — Edit: 고쳐요(허락 카드는 아직 하지 않은 일, F-157-5) · 상대 경로 · 뺀 줄(−)과 넣을 줄(+) 미리 보기 · 줄 수 제한. Write: 만들어요 · 앞 줄만. Bash: 실행해요 · 명령 전체. 그 밖: 도구 이름 · 줄 없음", () => {
  const e = AP.card(ev("Edit", { file_path: `${CWD}/src/signup.js`, old_string: "a\nb", new_string: "c\nd\ne" }));
  assert.deepEqual([e.tool_name, e.verb, e.what, e.kind, e.danger], ["Edit", "고쳐요", "src/signup.js", "edit", ""]);
  assert.deepEqual(e.lines, ["− a", "− b", "+ c", "+ d", "+ e"]);
  const long = AP.card(ev("Write", { file_path: "new.txt", content: Array.from({ length: 40 }, (_, i) => `줄 ${i}`).join("\n") }));
  assert.equal(long.verb, "만들어요"); assert.equal(long.kind, "write");
  assert.equal(long.lines.length, AP.MAX_LINES + 1, "제한 줄 + '… 더 있어요' 한 줄");
  assert.ok(long.lines[AP.MAX_LINES].includes("더"));
  const run = AP.card(ev("Bash", { command: "npm test\necho done", description: "시험" }));
  assert.deepEqual([run.verb, run.kind, run.what, run.lines], ["실행해요", "run", "npm test", ["npm test", "echo done"]]);
  const other = AP.card(ev("WebFetch", { url: "https://example.com" }));
  assert.deepEqual([other.verb, other.what, other.kind, other.lines], ["해요", "WebFetch", "other", []]);
  assert.ok(!JSON.stringify(other).includes("example.com"), "모르는 도구의 입력은 싣지 않는다");
  assert.deepEqual(AP.card(null).lines, []);
  assert.ok(AP.card({ tool_name: "Edit", tool_input: { file_path: "x", old_string: "a", new_string: "b".repeat(500) } }).lines.every((l) => l.length <= AP.MAX_CHARS + 2), "한 줄도 자른다");
});

// ── ② 비밀값 ──
test("card — 바뀔 내용 · 무엇을에 키 모양 · 비밀번호 대입 · 이메일이 그대로 남지 않는다(가린다)", () => {
  const c = AP.card(ev("Edit", { file_path: `${CWD}/.env.example`, old_string: `KEY=${FAKE_KEY}`, new_string: "비밀번호: hunter22\nmail me@example.com" }));   // secret-check: allow
  const s = JSON.stringify(c);
  for (const t of [FAKE_KEY, "hunter22", "me@example.com"]) assert.ok(!s.includes(t), `${t}가 카드에 있다`);
  assert.ok(s.includes("[비밀값]") || s.includes("가림"));
  const b = AP.card(ev("Bash", { command: `export API_KEY=${FAKE_KEY}` }));   // secret-check: allow
  assert.ok(!JSON.stringify(b).includes(FAKE_KEY));
});

// ── ① 되돌리기 어려운 일 ──
test("card — 삭제 · 강제 푸시 · 되돌릴 수 없는 git · 표 지우기 · 비밀값 파일 · 비밀값 모양이면 danger에 쉬운 말 까닭, 보통 일은 빈 글", () => {
  const why = (tool, input) => AP.card(ev(tool, input)).danger;
  assert.ok(why("Bash", { command: "rm -rf node_modules" }).includes("지우"));
  assert.ok(why("Bash", { command: "git push --force origin main" }).includes("강제"));
  assert.ok(why("Bash", { command: "git push -f" }).includes("강제"));
  assert.ok(why("Bash", { command: "git reset --hard HEAD~1" }));
  assert.ok(why("Bash", { command: "git clean -fd" }));
  assert.ok(why("Bash", { command: "git branch -D feature" }));
  assert.ok(why("Bash", { command: "psql -c 'DROP TABLE users'" }).includes("표"));
  assert.ok(why("Write", { file_path: `${CWD}/.env`, content: "A=1" }).includes("비밀값"));
  assert.ok(why("Edit", { file_path: "keys/server.pem", old_string: "a", new_string: "b" }).includes("비밀값"));
  assert.ok(why("Write", { file_path: "notes.md", content: `token = ${FAKE_KEY}` }).includes("비밀값"));   // secret-check: allow
  assert.equal(why("Bash", { command: "git push origin feature" }), "");
  assert.equal(why("Bash", { command: "npm run format && git status" }), "");
  assert.equal(why("Edit", { file_path: "src/app.js", old_string: "a", new_string: "b" }), "");
  assert.equal(why("Read", { file_path: ".env" }), "", "읽기는 되돌릴 일이 아니다");
});

// ── ③ sig ──
test("sig — 세션 · 도구 · 입력이 같으면 같고 하나라도 다르면 다르다(64자 16진수). 결정은 이 지문이 맞을 때만 쓴다(요구서 C-4 ③)", () => {
  const a = AP.sig(ev("Bash", { command: "npm test" }));
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, AP.sig(ev("Bash", { command: "npm test" })));
  assert.notEqual(a, AP.sig(ev("Bash", { command: "npm test " })));
  assert.notEqual(a, AP.sig({ ...ev("Bash", { command: "npm test" }), session_id: "s-2" }));
  assert.notEqual(a, AP.sig(ev("Edit", { command: "npm test" })));
});

// ── ④ decisionOutput ──
test("decisionOutput — allow · deny만 Claude Code 훅의 JSON(hookSpecificOutput.decision.behavior), 그 밖(none · 빈 값 · 이상한 값)은 빈 글 — 대신 허용하지 않는다", () => {
  const allow = JSON.parse(AP.decisionOutput("allow"));
  assert.deepEqual(allow, { hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "allow" } } });
  const deny = JSON.parse(AP.decisionOutput("deny"));
  assert.equal(deny.hookSpecificOutput.hookEventName, "PermissionRequest");
  assert.equal(deny.hookSpecificOutput.decision.behavior, "deny");
  assert.ok(typeof deny.hookSpecificOutput.decision.message === "string" && deny.hookSpecificOutput.decision.message.includes("Floe"));
  for (const v of ["none", "", null, undefined, "ALLOW", "yes", 1, {}]) assert.equal(AP.decisionOutput(v), "", String(v));
});

// ── ⑤ EXAMPLE ──
test("EXAMPLE — 서버 없이 보일 승인 카드 둘(보통 일 하나 · 되돌리기 어려운 일 하나), 카드 모양이 card()와 같고 어려운 말 · 진짜 키 모양이 없다", () => {
  assert.equal(AP.EXAMPLE.length, 2);
  for (const x of AP.EXAMPLE) {
    assert.ok(/^[A-Za-z0-9_-]{8,64}$/.test(x.id) && /^[0-9a-f]{64}$/.test(x.sig));
    assert.deepEqual(Object.keys(x.card).sort(), Object.keys(AP.card(ev("Bash", { command: "ls" }))).sort());
    assert.ok(x.project && x.tool === "claude");
  }
  assert.equal(AP.EXAMPLE.filter((x) => x.card.danger).length, 1);
  const s = JSON.stringify(AP.EXAMPLE);
  assert.doesNotMatch(s, /sk-|ghp_|AKIA|BEGIN/);
  for (const w of ["diff", "permission", "승인 요청 ID", "EARS", "판정"]) assert.ok(!s.includes(w), w);
});

// ── ⑥ connect.js ──
test("connect.js — PermissionRequest에 approve-hook.js를 단다(시간 상한 100초 이상, 초 단위). 두 번 더해도 하나, 빼면 다른 훅과 함께 사라진다. 지켜보기 훅(hook.js)은 그대로 셋", () => {
  assert.equal(Connect.APPROVE_EVENT, "PermissionRequest");
  assert.ok(Connect.APPROVE_COMMAND.includes("navigator/approve-hook.js"));
  assert.ok(Number.isInteger(Connect.APPROVE_TIMEOUT) && Connect.APPROVE_TIMEOUT >= 100 && Connect.APPROVE_TIMEOUT <= 600, String(Connect.APPROVE_TIMEOUT));
  const once = Connect.addHooks({}), twice = Connect.addHooks(once);
  const pr = twice.hooks.PermissionRequest;
  assert.equal(pr.length, 1);
  assert.deepEqual(pr[0].hooks, [{ type: "command", command: Connect.APPROVE_COMMAND, timeout: Connect.APPROVE_TIMEOUT }]);
  assert.ok(!("matcher" in pr[0]) || pr[0].matcher === "" || pr[0].matcher === "*", "모든 도구");
  assert.deepEqual(Object.keys(twice.hooks).sort(), [...Connect.EVENTS, "PermissionRequest"].sort());
  for (const e of Connect.EVENTS) assert.equal(twice.hooks[e][0].hooks[0].command, Connect.COMMAND, `${e}는 hook.js`);
  const removed = Connect.removeHooks({ ...twice, hooks: { ...twice.hooks, PreToolUse: [{ hooks: [{ type: "command", command: "echo mine" }] }] } });
  assert.deepEqual(Object.keys(removed.hooks), ["PreToolUse"], "남의 훅만 남는다");
});

test("묶은 앱(electron/package.json asarUnpack) — 훅이 node로 읽는 파일(hook.js · approve-hook.js · approve.js · steps.js · sensitive.js)이 모두 app.asar 밖에 풀린다", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../../02-frontend/electron/package.json"), "utf8"));
  const pats = pkg.build.asarUnpack.map((p) => new RegExp(`^${p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")}$`));
  for (const f of ["hook.js", "approve-hook.js", "approve.js", "steps.js", "sensitive.js"]) assert.ok(pats.some((re) => re.test(`payload/03-backend/navigator/${f}`)), `${f}가 풀리지 않는다`);
});

// ── ⑦ approve-hook.js 실제로 ──
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const input = (over = {}) => JSON.stringify({ ...ev("Edit", { file_path: `${CWD}/src/app.js`, old_string: `옛 글 ${FAKE_KEY}`, new_string: "새 글" }), ...over });   // secret-check: allow

test("approve-hook.js: 서버가 꺼져 있으면 출력 없이 0으로, 1.5초 안에 끝난다 — Claude Code는 보통 흐름(터미널 확인)으로 간다", async () => {
  const port = await freePort();
  for (const stdin of [input(), "깨진 입력"]) {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [HOOK], { input: stdin, env: { ...process.env, NAV_PORT: String(port), NAV_EVENT_TOKEN_FILE: path.join(os.tmpdir(), "floe-no-such-token-file") }, timeout: 10_000 });
    assert.equal(r.status, 0); assert.equal(r.stdout.toString(), "");
    assert.ok(Date.now() - t0 < 1500);
  }
});

// 서버 흉내 — 받은 본문을 모으고 answer를 준다
async function withServer(answer, run) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "floe-approve-")), tokenFile = path.join(tmp, "event-token");
  fs.writeFileSync(tokenFile, "t".repeat(43) + "\n");
  const got = [];
  const srv = http.createServer((req, res) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => { got.push({ url: req.url, headers: req.headers, body: b }); const [code, text] = answer(b); res.writeHead(code, { "Content-Type": "application/json" }); res.end(text); });
  });
  const port = await freePort();
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  const hook = (stdin) => new Promise((resolve) => {
    const c = spawn(process.execPath, [HOOK], { env: { ...process.env, NAV_PORT: String(port), NAV_EVENT_TOKEN_FILE: tokenFile } });
    let o = "", e = "";
    c.stdout.on("data", (d) => (o += d)); c.stderr.on("data", (d) => (e += d));
    c.on("close", (code) => resolve({ code, o, e }));
    c.stdin.end(stdin);
  });
  try { await run(hook, got); } finally { srv.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
}

test("approve-hook.js: 서버에 id · sig · 세션 · 도구 · 카드만 보낸다(tool_input 원문 · 비밀값 없음, 확인 값 머리글) — 서버가 allow면 허용 JSON을 출력한다", async () => {
  await withServer(() => [200, '{"ok":true,"decision":"allow"}'], async (hook, got) => {
    const r = await hook(input());
    assert.equal(r.code, 0);
    assert.deepEqual(JSON.parse(r.o), JSON.parse(AP.decisionOutput("allow")));
    assert.equal(got.length, 1); assert.equal(got[0].url, "/api/approval"); assert.equal(got[0].headers["x-nav-token"], "t".repeat(43));
    const body = JSON.parse(got[0].body);
    assert.deepEqual(Object.keys(body).sort(), ["card", "cwd", "id", "session_id", "sig", "tool", "tool_name"]);
    assert.match(body.id, /^[A-Za-z0-9_-]{8,64}$/); assert.equal(body.sig, AP.sig(JSON.parse(input()))); assert.equal(body.tool, "claude");
    assert.deepEqual(body.card, AP.card(JSON.parse(input())));
    for (const t of [FAKE_KEY, "tool_input", "old_string"]) assert.ok(!got[0].body.includes(t), `${t}가 본문에 있다`);
  });
});

test("approve-hook.js: 서버가 deny면 거절 JSON, none이면 빈 출력, ok:false · 500 · JSON이 아닌 답이면 빈 출력 — 어떤 경우에도 저절로 allow가 되지 않는다", async () => {
  const cases = [
    [() => [200, '{"ok":true,"decision":"deny"}'], (o) => assert.equal(JSON.parse(o).hookSpecificOutput.decision.behavior, "deny")],
    [() => [200, '{"ok":true,"decision":"none"}'], (o) => assert.equal(o, "")],
    [() => [200, '{"ok":false,"reason":"확인 값이 없거나 맞지 않음"}'], (o) => assert.equal(o, "")],
    [() => [500, "oops"], (o) => assert.equal(o, "")],
    [() => [200, '{"ok":true,"decision":"ALLOW"}'], (o) => assert.equal(o, "")],
    [() => [200, '{"ok":true}'], (o) => assert.equal(o, "")],
  ];
  for (const [answer, check] of cases) await withServer(answer, async (hook) => { const r = await hook(input()); assert.equal(r.code, 0); check(r.o); });
});

test("approve-hook.js: 서버가 답을 안 주면 기다리다(NAV_APPROVAL_WAIT) 빈 출력으로 끝난다 — 멈춰 있지 않는다", async () => {
  const srv = http.createServer(() => {});   // 영영 답하지 않는다
  const port = await freePort();
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  try {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [HOOK], { input: input(), env: { ...process.env, NAV_PORT: String(port), NAV_APPROVAL_WAIT: "400", NAV_EVENT_TOKEN_FILE: path.join(os.tmpdir(), "floe-no-such-token-file") }, timeout: 10_000 });
    assert.equal(r.status, 0); assert.equal(r.stdout.toString(), "");
    const took = Date.now() - t0;
    assert.ok(took >= 350 && took < 3000, `${took}ms`);
  } finally { srv.close(); }
});
