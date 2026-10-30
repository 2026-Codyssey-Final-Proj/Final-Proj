// claude-drafted: 2026-10-30 — F-104 묶음(서버 03-backend 코드 점검, 임유정 "내 담당 아닌 것들도 고쳐줘"): 01-docs/07-maintenance/fixes/backend-bug-hunt.md
//   모듈을 불러 실제로 돌린다(가능한 것은). 실행: node --test 04-tests/navigator/backend-bug-hunt.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const B = path.join(__dirname, "../../03-backend/navigator");
const req = (f) => require(path.join(B, f));
const src = (f) => fs.readFileSync(path.join(B, f), "utf8");

test("F-104-1 개인키는 머리 줄만이 아니라 본문 · 끝 줄까지 가린다", () => {
  const S = req("sensitive.js");
  const body = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\nZ3VtYmFsbGFkYWRkYWRkYWRkYWRkYWRkYWRkYWRkYWRkYWRkYWRk";
  const pem = `앞 글\n-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n뒤 글`;
  const out = S.redact(pem);
  assert.doesNotMatch(out, /MIIEvQIBADAN|Z3VtYmFsbGFk|END PRIVATE KEY/, "본문 · 끝 줄이 남지 않는다");
  assert.match(out, /앞 글/); assert.match(out, /뒤 글/, "키 밖의 글은 그대로");
  assert.equal(S.scan(pem).blocked, true);
  const t0 = Date.now(); S.redact(`-----BEGIN RSA PRIVATE KEY-----\n${"A".repeat(20000)}!`); assert.ok(Date.now() - t0 < 200, "긴 줄에서도 느려지지 않는다");
  // 새 맥락 리뷰가 찾은 남는 경우 — 짧은 마지막 줄 · 들여쓴 YAML · JSON 글 속의 \n(서비스 계정 private_key) · 암호화된 키의 머리말
  const k = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7";
  const more = [`-----BEGIN PRIVATE KEY-----\n${k}\nAB==\n-----END PRIVATE KEY-----\nafter`, `key: |\n  -----BEGIN PRIVATE KEY-----\n  ${k}\n  -----END PRIVATE KEY-----\nnext: 1`,
    JSON.stringify({ private_key: `-----BEGIN PRIVATE KEY-----\n${k}\nQUJD\n-----END PRIVATE KEY-----\n`, client: "x" }), `-----BEGIN RSA PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\nDEK-Info: AES-128-CBC,AB12\n\n${k}\n-----END RSA PRIVATE KEY-----\n다음 글`];
  for (const t of more) assert.doesNotMatch(S.redact(t), /MIIE|AB==|QUJD|END |ENCRYPTED/, t.slice(0, 30));
  assert.match(S.redact(more[0]), /after$/); assert.match(S.redact(more[3]), /다음 글$/, "키 뒤의 글은 남는다");
});

test("F-104-2 JSON 꼴 비밀번호 · github_pat_ · gho_ · Bearer 토큰도 잡고 가린다", () => {
  const S = req("sensitive.js");
  const cases = ['{"password": "hunter2-long"}', "token github_pat_11ABCDEFG0123456789_abcdefghijklmnopqrstuv", "gho_abcdefghijklmnopqrstuvwxyz0123", "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abcdefgh.ijklmnop"];
  for (const c of cases) {
    assert.equal(S.scan(c).blocked, true, `잡는다: ${c.slice(0, 20)}`);
    assert.doesNotMatch(S.redact(c), /hunter2-long|github_pat_11ABC|gho_abcdef|eyJhbGciOi/, `가린다: ${c.slice(0, 20)}`);
  }
});

test("F-104-3 앱이 4317이 아닌 포트로 켜져도 훅이 그 포트로 보낸다(확인 값 파일 옆의 .port)", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "floe-port-")), tokenFile = path.join(dir, "token");
  const token = "a".repeat(43);
  fs.writeFileSync(tokenFile, `${token}\n`);
  const got = [];
  const srv = http.createServer((q, s) => { let b = ""; q.on("data", (d) => (b += d)); q.on("end", () => { got.push({ url: q.url, b }); s.end("{}"); }); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  try {
    const Server = req("server.js");
    Server.announcePort(srv.address().port, tokenFile);
    assert.equal(fs.readFileSync(`${tokenFile}.port`, "utf8").trim(), String(srv.address().port), "서버가 켠 포트를 적는다");
    const env = { ...process.env, NAV_EVENT_TOKEN_FILE: tokenFile }; delete env.NAV_PORT;
    const child = spawn(process.execPath, [path.join(B, "hook.js")], { env, stdio: ["pipe", "ignore", "ignore"] });
    child.stdin.end(JSON.stringify({ hook_event_name: "Stop", cwd: dir, session_id: "s1" }));
    await new Promise((r) => child.on("close", r));
    assert.ok(got.length >= 1, "훅이 .port의 포트로 보냈다(4317 고정이 아니라)");
  } finally { srv.close(); fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); }
  assert.match(src("approve-hook.js"), /\.port`/, "허락 훅도 같은 파일을 읽는다");
});

test("F-104-4 허락을 기다리던 훅이 먼저 끊으면 섬의 카드를 바로 걷는다(req가 아니라 res의 close)", () => {
  const s = src("server.js");
  assert.doesNotMatch(s, /req\.on\("close", \(\) => \{ const p = pending\.get\(id\)/, "본문을 다 읽은 뒤의 req close는 오지 않는다(Node 16+)");
  assert.match(s, /res\.on\("close", \(\) => \{ if \(res\.writableFinished\) return; const p = pending\.get\(id\);/);
});

test("F-104-5 처리 중 예외가 나도 응답 없이 멈추지 않는다(500) · 정적 파일 읽기 오류도 끊는다", async () => {
  const Server = req("server.js");
  const res = { code: 0, body: "", headersSent: false, writeHead(c) { this.code = c; this.headersSent = true; return this; }, setHeader() {}, end(b) { this.body = String(b || ""); this.ended = true; }, destroy() { this.destroyed = true; } };
  const bad = { method: "GET", headers: {}, get url() { throw Object.assign(new Error("EBUSY"), { code: "EBUSY" }); }, on() {} };
  await Server.handle(bad, res);
  assert.equal(res.code, 500); assert.ok(res.ended, "답을 보낸다");
  assert.match(src("server.js"), /createReadStream\(path\.join\(__dirname, file\)\)\.on\("error", \(\) => res\.destroy\(\)\)\.pipe\(res\)/);
});

test("F-104-6 제목 줄 — 공백이 길어도 느려지지 않고(ReDoS), 끝의 # 은 전처럼 뗀다", () => {
  const Md = req("md-view.js"), Feed = req("feed.js");
  const long = `# a${" ".repeat(2000)}b`;   // 고치기 전: 2,000칸에 0.64초(세제곱) — 2배면 약 8배
  let t0 = Date.now(); Md.toHtml(long); assert.ok(Date.now() - t0 < 100, `md-view ${Date.now() - t0}ms`);
  t0 = Date.now(); Feed.split(`${long}\n본문\n1. x${" ".repeat(2000)}y`); assert.ok(Date.now() - t0 < 100, `feed ${Date.now() - t0}ms`);
  t0 = Date.now(); Md.toHtml(`# a${" ".repeat(50000)}b`); Feed.split(`# a${" ".repeat(50000)}b`); assert.ok(Date.now() - t0 < 300, "고친 뒤에는 5만 칸도");
  assert.match(Md.toHtml("## 제목 ##"), /<h2>제목<\/h2>/);
  assert.match(Md.toHtml("### 세 번째   "), /<h3>세 번째<\/h3>/);
  const parts = Feed.split("# 하나 #\n가\n2) 둘  \n나");
  assert.deepEqual(parts.map((p) => p.title), ["하나", "둘"]);
});

test("F-104-7 GitHub 확인은 서버를 붙잡지 않는다(spawnSync 없이 비동기)", async () => {
  const GH = req("github.js");
  assert.doesNotMatch(src("github.js"), /\{ spawnSync \}|spawnSync\(|run = spawnSync/, "git · gh를 동기로 부르지 않는다");
  const r = await GH.runner(async () => ({ status: 0, stdout: "true\nmore" }))("gh", ["x"], "/p");
  assert.deepEqual(r, { found: true, code: 0, out: "true" });
  assert.ok(GH.status("", "", () => ({ found: true, code: 0, out: "gh version 2" })) instanceof Promise, "status는 Promise");
});

test("F-104-8 · 9 runCommand — 첫 줄의 앞 공백을 지키고(porcelain ' M'), spawn이 바로 던져도 ReferenceError가 아니라 missing", async () => {
  const P = req("project.js");
  const r = await P.runCommand(process.execPath, ["-e", "process.stdout.write(' M docs/a.md\\n')"], { timeout: 5000 });
  assert.equal(r.out, " M docs/a.md", "앞 공백이 남는다 — 전에는 'M docs/a.md'가 되어 slice(3)이 첫 글자를 잘랐다");
  const bad = await P.runCommand("a\0b", []);
  assert.equal(bad.missing, true);
});

test("F-104-10 Windows에서 npm으로만 깐 claude(claude.cmd)도 셸 없이 연다", () => {
  const Pv = req("provider.js"), W = path.win32;
  const has = (set) => (p) => set.includes(p);
  const npm = "C:\\Users\\u\\AppData\\Roaming\\npm", cli = W.join(npm, "node_modules", "@anthropic-ai", "claude-code", "cli.js");
  assert.deepEqual(Pv.claudeLaunch("darwin", { PATH: "/usr/bin" }, has([])), { cmd: "claude", pre: [], env: {} });
  assert.equal(Pv.claudeLaunch("win32", { PATH: `C:\\bin;${npm}` }, has([W.join("C:\\bin", "claude.exe")])).cmd, "claude", "claude.exe가 있으면 그대로");
  const l = Pv.claudeLaunch("win32", { Path: `C:\\bin;${npm}` }, has([W.join(npm, "claude.cmd"), cli]));
  assert.equal(l.cmd, "node", "PATH의 node — 앱 실행 파일 + ELECTRON_RUN_AS_NODE는 하위 명령에 물려진다(새 맥락 리뷰)"); assert.deepEqual(l.pre, [cli]); assert.deepEqual(l.env, {});
  assert.equal(Pv.claudeLaunch("win32", { PATH: npm }, has([W.join(npm, "claude.cmd")])).cmd, "claude", "cli.js를 못 찾으면 전처럼");
});

test("F-104-11 Windows에서 멈추면 맡긴 일의 자식(npm · 개발 서버)까지 끈다", () => {
  const Pv = req("provider.js"), calls = [];
  Pv.killTree({ pid: 42, kill() { calls.push("kill"); } }, "win32", (cmd, args) => { calls.push([cmd, ...args].join(" ")); return { on() {} }; });
  assert.deepEqual(calls, ["taskkill /pid 42 /T /F"]);
  calls.length = 0; Pv.killTree({ pid: 42, kill() { calls.push("kill"); } }, "linux");
  assert.deepEqual(calls, ["kill"]);
  assert.match(src("server.js"), /killTree\(task\.child\);/);
});

test("F-104-12 · 13 단계 문서 — 줄 안의 줄바꿈은 한 줄로 쓰고, BOM이 붙은 문서도 읽는다", () => {
  const Docs = req("docs.js");
  const results = { 0: { items: [{ name: "누가 쓰나요 — 쓸 사람", lines: ["첫 줄\n이어진 줄"] }] }, 1: { items: [{ name: "x", lines: ["y"] }] } };
  const f = Docs.files({ topic: "t", idea: "i", source: "", results, redact: (x) => x }).find((y) => y.path === Docs.stagePath(0));
  assert.ok(f, "1단계 문서");
  assert.match(f.text, /- 첫 줄 이어진 줄/, "줄바꿈이 한 줄로");
  const p = Docs.parseStage(`\uFEFF${f.text}`);
  assert.ok(p && p.n === 0, "BOM이 붙어도 읽는다");
  assert.deepEqual(p.result.items[0].lines, ["첫 줄 이어진 줄"], "되살려도 줄이 빠지지 않는다");
});

test("F-104-14 Windows 경로는 대소문자가 달라도 같은 폴더(c:/ · C:/)", () => {
  const Steps = req("steps.js");
  assert.equal(Steps.fileOf({ tool_name: "Write", tool_input: { file_path: "C:\\Proj\\docs\\a.md" }, cwd: "c:\\proj" }), "docs/a.md");
  assert.equal(Steps.fileOf({ tool_name: "Write", tool_input: { file_path: "/Proj/a.md" }, cwd: "/proj" }), "", "Windows 드라이브가 아니면 그대로 구분");
});

test("F-104-15(F-103-9) 폴더에서 되읽은 단계 결과는 서버가 받는 모양으로 줄여 준다 — 이후 요청이 400으로 막히지 않게", () => {
  const Server = req("server.js");
  const long = "가".repeat(900);
  const r = Server.fitResult({ items: Array.from({ length: 10 }, (_, i) => ({ name: `칸 ${i}`, lines: Array.from({ length: 7 }, () => long), draft: long })) });
  assert.equal(r.items.length, 8); assert.equal(r.items[0].lines.length, 5);
  assert.ok(r.items.every((x) => x.lines.every((l) => l.length <= 400) && x.draft.length <= 400));
  assert.equal(r.fitted, true, "줄였다는 표시");
  assert.equal(Server.fitResult({ items: [{ name: "a", lines: ["b"] }] }).fitted, undefined, "맞으면 그대로");
});
