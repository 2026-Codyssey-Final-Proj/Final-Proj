// claude-drafted: 2026-10-20 — 이재엽 요청(C-12 AI 진행 — Claude Code가 하는 일 보기). 코드보다 먼저 썼다(넘김 문서 6절).
// 훅이 Claude Code의 PostToolUse를 받아 "무엇을 했나" 한 줄로 줄이는 순수 모듈(steps.js)과 hook.js · connect.js를 본다.
//   ① fromHook — 도구마다 말 · 경로(작업 폴더 안은 상대 경로, 밖은 이름만) · 줄 수 · 80자 자르기
//   ② 결과 어디에도 파일 내용(old_string · new_string · content · tool_response)의 글이 없다
//   ③ line — 화면 한 줄 모양   ④ EXAMPLE — 서버 없이 보일 예시(쉬운 말)
//   ⑤ connect.js EVENTS에 PostToolUse — 두 번 더해도 하나, 빼면 셋 다
//   ⑥ 서버가 꺼져 있을 때 hook.js가 출력 없이 0으로, 600ms 안에 끝난다(Claude Code를 느리게 하지 않는다)
//   ⑦ hook.js가 서버에 보낸 본문에 tool_input · tool_response · prompt가 없다
// 실행: node --test 04-tests/navigator/hook-steps.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawn, spawnSync } = require("node:child_process");

const BACK = path.join(__dirname, "../../03-backend/navigator");
const Steps = require(path.join(BACK, "steps.js"));
const Connect = require(path.join(BACK, "connect.js"));
const HOOK = path.join(BACK, "hook.js");

const CWD = "/Users/me/club-app";
// Claude Code가 PostToolUse 훅에 주는 모양(hook_event_name · tool_name · tool_input · tool_response · cwd · session_id)
const ev = (tool_name, tool_input, tool_response = "도구가 돌려준 결과 글") => ({ hook_event_name: "PostToolUse", session_id: "s-1", cwd: CWD, tool_name, tool_input, tool_response });
// 시험 안에서만 쓰는 가짜 비밀값 — 실행할 때 만든다(check-secrets.sh)
const FAKE_KEY = "sk-" + "Zq9x".repeat(6);   // secret-check: allow

// ── ① fromHook ──
test("fromHook: Read는 '읽었어요'와 경로 — 작업 폴더 안이면 상대 경로, 밖이면 파일 이름만", () => {
  assert.deepEqual(Steps.fromHook(ev("Read", { file_path: `${CWD}/src/app.js` })), { verb: "읽었어요", what: "src/app.js", add: 0, del: 0 });
  assert.deepEqual(Steps.fromHook(ev("Read", { file_path: "/Users/me/other/secret-notes.md" })).what, "secret-notes.md", "밖이면 이름만 — 폴더 구조를 넘기지 않는다");
  assert.equal(Steps.fromHook(ev("Read", { file_path: "README.md" })).what, "README.md", "상대 경로는 그대로");
  assert.equal(Steps.fromHook({ ...ev("Read", { file_path: "C:\\work\\club-app\\src\\app.js" }), cwd: "C:\\work\\club-app" }).what, "src/app.js", "Windows 경로도");
});

test("fromHook: Edit · MultiEdit는 '고쳤어요'와 경로 + 줄 수(+새 글 줄 수 −옛 글 줄 수), MultiEdit는 합산", () => {
  const e = Steps.fromHook(ev("Edit", { file_path: `${CWD}/src/app.js`, old_string: "a\nb", new_string: "a\nb\nc\nd" }));
  assert.deepEqual(e, { verb: "고쳤어요", what: "src/app.js", add: 4, del: 2 });
  const m = Steps.fromHook(ev("MultiEdit", { file_path: `${CWD}/src/app.js`, edits: [{ old_string: "x", new_string: "x\ny" }, { old_string: "p\nq\nr", new_string: "" }] }));
  assert.deepEqual(m, { verb: "고쳤어요", what: "src/app.js", add: 2, del: 4 });
  assert.deepEqual(Steps.fromHook(ev("Edit", { file_path: "a.js", old_string: "", new_string: "한 줄\n" })), { verb: "고쳤어요", what: "a.js", add: 1, del: 0 }, "끝의 줄바꿈 하나는 줄로 세지 않는다");
});

test("fromHook: Write는 '만들었어요'와 경로 + 글의 줄 수", () => {
  assert.deepEqual(Steps.fromHook(ev("Write", { file_path: `${CWD}/notes/new.md`, content: "1\n2\n3" })), { verb: "만들었어요", what: "notes/new.md", add: 3, del: 0 });
});

test("fromHook: Bash는 '실행했어요'와 명령 첫 줄 80자까지, Grep · Glob은 '찾았어요'와 찾을 말 80자까지", () => {
  assert.deepEqual(Steps.fromHook(ev("Bash", { command: "npm test\necho 둘째 줄은 안 보낸다" })), { verb: "실행했어요", what: "npm test", add: 0, del: 0 });
  const long = Steps.fromHook(ev("Bash", { command: "x".repeat(200) })).what;
  assert.equal(long.length, 80); assert.ok(long.endsWith("…"));
  assert.deepEqual(Steps.fromHook(ev("Grep", { pattern: "addEvent", path: CWD })), { verb: "찾았어요", what: "addEvent", add: 0, del: 0 });
  assert.deepEqual(Steps.fromHook(ev("Glob", { pattern: "**/*.test.js" })), { verb: "찾았어요", what: "**/*.test.js", add: 0, del: 0 });
  assert.equal(Steps.fromHook(ev("Grep", { pattern: "가".repeat(100) })).what.length, 80);
});

test("fromHook: 모르는 도구는 '했어요'와 빈 what, 모르는 모양(입력 없음 · 글이 아님)도 터지지 않는다", () => {
  const blank = { verb: "했어요", what: "", add: 0, del: 0 };
  assert.deepEqual(Steps.fromHook(ev("Task", { description: "서브에이전트", prompt: "긴 지시문" })), blank);
  assert.deepEqual(Steps.fromHook(ev("Edit", null)), { verb: "고쳤어요", what: "", add: 0, del: 0 });
  assert.deepEqual(Steps.fromHook(ev("Edit", { file_path: 7, old_string: 1, new_string: null })), { verb: "고쳤어요", what: "", add: 0, del: 0 });
  assert.deepEqual(Steps.fromHook({}), blank);
  assert.deepEqual(Steps.fromHook(null), blank);
  assert.deepEqual(Steps.fromHook(ev("MultiEdit", { file_path: "a.js", edits: "목록이 아님" })), { verb: "고쳤어요", what: "a.js", add: 0, del: 0 });
});

// ── ② 내용은 넘기지 않는다 ──
test("fromHook: 결과 어디에도 old_string · new_string · content · tool_response · 명령 둘째 줄의 글이 없다", () => {
  const secrets = { old: `옛 글 ${FAKE_KEY}`, neu: "새 글 password=hunter2pass", content: "파일 내용 전체", resp: "도구 결과 010-1234-5678", second: "둘째 줄 export TOKEN=abc" };
  const cases = [
    ev("Edit", { file_path: "a.js", old_string: secrets.old, new_string: secrets.neu }, secrets.resp),
    ev("MultiEdit", { file_path: "a.js", edits: [{ old_string: secrets.old, new_string: secrets.neu }] }, secrets.resp),
    ev("Write", { file_path: "b.md", content: secrets.content }, secrets.resp),
    ev("Bash", { command: `npm test\n${secrets.second}` }, secrets.resp),
    ev("Read", { file_path: "c.txt" }, secrets.content),
    ev("Grep", { pattern: "x" }, secrets.resp),
    ev("Task", { prompt: secrets.content }, secrets.resp),
  ];
  for (const c of cases) {
    const json = JSON.stringify(Steps.fromHook(c));
    for (const [k, v] of Object.entries(secrets)) assert.ok(!json.includes(v), `${c.tool_name}: ${k}의 글이 결과에 있다`);
    assert.deepEqual(Object.keys(Steps.fromHook(c)).sort(), ["add", "del", "verb", "what"], `${c.tool_name}: 칸은 넷뿐`);
  }
});

// ── ③ line ──
test("line: '말 · 무엇 (+N −M)' 한 줄, 줄 수가 0이면 괄호 없음, what이 비면 도구 이름, 80자를 넘으면 …", () => {
  assert.equal(Steps.line({ verb: "고쳤어요", what: "src/app.js", add: 3, del: 1 }), "고쳤어요 · src/app.js (+3 −1)");
  assert.equal(Steps.line({ verb: "읽었어요", what: "README.md", add: 0, del: 0 }), "읽었어요 · README.md");
  assert.equal(Steps.line({ verb: "실행했어요", what: "npm test" }), "실행했어요 · npm test");
  assert.equal(Steps.line({ verb: "만들었어요", what: "new.md", add: 12, del: 0 }), "만들었어요 · new.md (+12)");
  assert.equal(Steps.line({ verb: "고쳤어요", what: "a.js", add: 0, del: 2 }), "고쳤어요 · a.js (−2)");
  assert.equal(Steps.line({ verb: "했어요", what: "", tool_name: "Task" }), "했어요 · Task");
  assert.equal(Steps.line({ verb: "했어요", what: "" }), "했어요");
  const long = Steps.line({ verb: "실행했어요", what: "x".repeat(100) });
  assert.equal(long.length, 80); assert.ok(long.endsWith("…"));
  assert.equal(Steps.line(null), "");
});

// ── ④ EXAMPLE ──
test("EXAMPLE: 서버 없이 보일 예시 세션 — 6~8줄, 쉬운 말, 줄마다 말은 VERBS 값, at은 상대 ms(음수)이고 example(now)가 절대 시각으로", () => {
  const E = Steps.EXAMPLE;
  assert.equal(E.project, "예시-프로젝트"); assert.equal(E.tool, "claude"); assert.equal(E.state, "done");
  assert.ok(E.steps.length >= 6 && E.steps.length <= 8, `${E.steps.length}줄`);
  const verbs = new Set(Object.values(Steps.VERBS));
  let prev = -Infinity;
  for (const s of E.steps) {
    assert.ok(verbs.has(s.verb), s.verb);
    assert.ok(typeof s.what === "string" && s.what && !s.what.includes("|"), s.what);
    assert.ok(Number.isInteger(s.seq) && Number.isInteger(s.add) && Number.isInteger(s.del));
    assert.ok(typeof s.at === "number" && s.at <= 0 && s.at >= prev, "오래된 것부터, 상대 ms"); prev = s.at;
    assert.ok(Steps.line(s).length <= 80);
  }
  assert.ok(!JSON.stringify(E).includes("예시 데이터예요"), "그 말은 화면이 붙인다");
  const now = 1_800_000_000_000, x = Steps.example(now);
  assert.equal(x.steps.length, E.steps.length);
  for (let i = 0; i < x.steps.length; i++) assert.equal(x.steps[i].at, now + E.steps[i].at);
  assert.ok(x.at <= now && x.at >= now + E.steps.at(-1).at, "세션 시각은 마지막 줄 뒤");
  assert.equal(E.steps[0].at, Steps.EXAMPLE.steps[0].at, "원본은 안 바뀐다");
  assert.deepEqual(Object.keys(x).sort(), ["at", "id", "project", "state", "steps", "tool"], "세션 모양은 /api/steps와 같다");
});

test("VERBS: 도구 이름 → 쉬운 말 표", () => {
  assert.deepEqual(Steps.VERBS, { Read: "읽었어요", Edit: "고쳤어요", MultiEdit: "고쳤어요", Write: "만들었어요", Bash: "실행했어요", PowerShell: "실행했어요", Grep: "찾았어요", Glob: "찾았어요" });
  assert.equal(Steps.OTHER, "했어요");
});

// ── ⑤ connect ──
test("connect: EVENTS에 PostToolUse — 두 번 더해도 하나씩, 빼면 넷 다 빠진다(PermissionRequest는 FR-17 허락 훅, 2026-10-20)", () => {
  assert.deepEqual([...Connect.EVENTS].sort(), ["PostToolUse", "Stop", "UserPromptSubmit"]);
  const once = Connect.addHooks({}), twice = Connect.addHooks(once);
  assert.deepEqual(Object.keys(once.hooks).sort(), ["PermissionRequest", "PostToolUse", "Stop", "UserPromptSubmit"]);
  assert.deepEqual(twice, once);
  assert.equal(once.hooks.PostToolUse.length, 1);
  assert.equal(once.hooks.PostToolUse[0].matcher, undefined, "matcher를 비우면 모든 도구(Claude Code 훅 문서)");
  assert.deepEqual(Connect.removeHooks(once), {}, "빼면 넷 다");
});

// ── ⑥ · ⑦ hook.js를 실제로 돌린다 ──
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const postToolUse = (over = {}) => JSON.stringify({ hook_event_name: "PostToolUse", session_id: "hook-s", cwd: CWD, tool_name: "Edit",
  tool_input: { file_path: `${CWD}/src/app.js`, old_string: `옛 글 ${FAKE_KEY}`, new_string: "새 글\n둘째 줄" }, tool_response: "도구 결과 전체 글", ...over });

test("hook.js: 서버가 꺼져 있어도 PostToolUse 훅은 출력 없이 0으로, 600ms 안에 끝난다", async () => {
  const port = await freePort();   // 아무도 듣지 않는 포트
  for (const stdin of [postToolUse(), "깨진 입력"]) {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [HOOK], { input: stdin, env: { ...process.env, NAV_PORT: String(port), NAV_EVENT_TOKEN_FILE: path.join(os.tmpdir(), "floe-no-such-token-file") }, timeout: 10_000 });
    const took = Date.now() - t0;
    assert.equal(r.status, 0);
    assert.equal(r.stdout.toString(), "", "출력이 있으면 Claude Code에 전달된다");
    assert.ok(took < 600, `너무 오래 걸림: ${took}ms`);
  }
});

test("hook.js: 서버에 보낸 본문에는 hook_event_name · session_id · cwd · tool · tool_name · step · file만 — tool_input · tool_response · prompt는 없다(file은 바뀐 파일의 세션 폴더 안 상대 경로, 작업실 개편 C-63)", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "floe-hook-steps-")), tokenFile = path.join(tmp, "event-token");
  fs.writeFileSync(tokenFile, "t".repeat(43) + "\n");
  const got = [];
  const srv = http.createServer((req, res) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => { got.push({ url: req.url, headers: req.headers, body: b }); res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"ok":true,"seq":1}'); });
  });
  const port = await freePort();
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  try {
    const t0 = Date.now();
    const out = await new Promise((resolve) => {
      const c = spawn(process.execPath, [HOOK], { env: { ...process.env, NAV_PORT: String(port), NAV_EVENT_TOKEN_FILE: tokenFile } });
      let o = "";
      c.stdout.on("data", (d) => (o += d));
      c.on("close", (code) => resolve({ code, o }));
      c.stdin.end(postToolUse());
    });
    const took = Date.now() - t0;
    assert.deepEqual([out.code, out.o], [0, ""]);
    assert.ok(took < 1500, `너무 오래 걸림: ${took}ms`);
    await new Promise((r) => setTimeout(r, 50));   // 서버가 본문을 다 읽을 틈
    assert.equal(got.length, 1, "한 번 보낸다");
    assert.equal(got[0].url, "/api/event");
    assert.equal(got[0].headers["x-nav-token"], "t".repeat(43), "확인 값 머리글");
    const body = JSON.parse(got[0].body);
    assert.deepEqual(Object.keys(body).sort(), ["cwd", "file", "hook_event_name", "session_id", "step", "tool", "tool_name"]);
    assert.equal(body.file, "src/app.js", "이름만 — 내용은 없다");
    assert.deepEqual(body.step, { verb: "고쳤어요", what: "src/app.js", add: 2, del: 1 });
    assert.deepEqual([body.hook_event_name, body.tool, body.tool_name, body.session_id, body.cwd], ["PostToolUse", "claude", "Edit", "hook-s", CWD]);
    for (const t of [FAKE_KEY, "옛 글", "새 글", "둘째 줄", "도구 결과 전체 글", "tool_input", "tool_response"]) assert.ok(!got[0].body.includes(t), `${t}가 본문에 있다`);
  } finally {
    srv.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("hook.js: 요청 받음(UserPromptSubmit)은 전처럼 prompt를 보낸다 — PostToolUse만 줄인다", async () => {
  const got = [];
  const srv = http.createServer((req, res) => { let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => { got.push(b); res.end("{}"); }); });
  const port = await freePort();
  await new Promise((r) => srv.listen(port, "127.0.0.1", r));
  try {
    await new Promise((resolve) => {
      const c = spawn(process.execPath, [HOOK], { env: { ...process.env, NAV_PORT: String(port), NAV_EVENT_TOKEN_FILE: path.join(os.tmpdir(), "floe-no-such-token-file") } });
      c.on("close", resolve);
      c.stdin.end(JSON.stringify({ hook_event_name: "UserPromptSubmit", session_id: "p", cwd: CWD, prompt: "행사 목록 화면 만들어 줘" }));
    });
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(got.length, 1);
    const body = JSON.parse(got[0]);
    assert.equal(body.prompt, "행사 목록 화면 만들어 줘");
    assert.equal(body.step, undefined);
  } finally { srv.close(); }
});

// 작업실 개편 C-63(2026-10-29): 바뀐 파일의 경로 — 세션 폴더 안이면 상대 경로(자르지 않음), 밖이면 ""(작업 폴더 파일로 오해하지 않게), 파일을 쓰는 도구만
test("fileOf — Write · Edit · MultiEdit · NotebookEdit만, 세션 폴더 안이면 상대 경로(80자를 넘어도 자르지 않음), 밖이면 빈 글", () => {
  const ev = (tool_name, tool_input, cwd = CWD) => ({ hook_event_name: "PostToolUse", tool_name, tool_input, cwd });
  assert.equal(Steps.fileOf(ev("Write", { file_path: `${CWD}/src/app.js` })), "src/app.js");
  assert.equal(Steps.fileOf(ev("NotebookEdit", { notebook_path: `${CWD}/a.ipynb` })), "a.ipynb");
  const long = `src/${"a".repeat(120)}/form.tsx`;
  assert.equal(Steps.fileOf(ev("Edit", { file_path: `${CWD}/${long}` })), long, "자르지 않는다");
  assert.equal(Steps.fileOf(ev("Write", { file_path: "/Users/me/.claude/projects/x/memory/MEMORY.md" })), "", "밖이면 빈 글");
  assert.equal(Steps.fileOf(ev("Write", { file_path: "notes/a.md" })), "notes/a.md", "상대 경로는 그대로");
  assert.equal(Steps.fileOf(ev("Read", { file_path: `${CWD}/README.md` })), "", "읽기는 바뀐 파일이 아니다");
  assert.equal(Steps.fileOf({ ...ev("Write", { file_path: "C:\\work\\club-app\\src\\app.js" }), cwd: "C:\\work\\club-app" }), "src/app.js", "Windows 경로도");
});
