// claude-drafted: 2026-11-04 — F-149 자동 허용(두승현 "사람이 권한 승인하지말고 자동으로 승인하여 진행한다 auto mode 처럼", 처음부터 켜짐으로 결정)
// 켜져 있으면 되돌리기 어렵지 않은 파일 고치기 · 명령은 서버가 바로 허용한다. 되돌리기 어려운 일과 그 밖의 도구는 전처럼 사람의 답을 기다린다.
// 실행: node --test 04-tests/navigator/approve-auto.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const BACK = path.join(__dirname, "../../03-backend/navigator");
const AP = require(path.join(BACK, "approve.js"));

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-auto-"));
const USAGE = path.join(TMP, "usage.json"), AUTO = path.join(TMP, "usage-approve-auto");
Object.assign(process.env, { CLAUDE_CONFIG_DIR: require("./hook-home.js")(TMP), NAV_EVENT_TOKEN_FILE: path.join(TMP, "event-token"), NAV_USAGE_FILE: USAGE, NAV_REPLAY: path.join(TMP, "replay.json"), NAV_APPROVAL_WAIT: "3000" });
let Srv, port, srv;
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); }); });
before(async () => {
  port = await freePort(); process.env.NAV_PORT = String(port);
  Srv = require(path.join(BACK, "server.js"));
  srv = http.createServer(Srv.handle); await new Promise((r) => srv.listen(port, "127.0.0.1", r)); Srv.eventToken();
});
after(() => { srv && srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); });
function call(method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body), tok = fs.readFileSync(process.env.NAV_EVENT_TOKEN_FILE, "utf8").trim();
    const req = http.request({ host: "127.0.0.1", port, path: url, method, headers: { ...(data !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}), "X-Nav-Token": tok } }, (res) => {
      let text = ""; res.setEncoding("utf8"); res.on("data", (d) => (text += d)); res.on("end", () => { let json = null; try { json = JSON.parse(text); } catch {} resolve({ status: res.statusCode, json, text }); });
    });
    req.on("error", reject); req.end(data);
  });
}
let n = 0;
const ask = (ev) => { const id = `auto-test-${++n}-xx`, card = AP.card(ev); return { id, sig: AP.sig(ev), body: { id, sig: AP.sig(ev), session_id: "s", cwd: TMP, tool: "claude", tool_name: ev.tool_name, card } }; };
const EDIT = { tool_name: "Edit", tool_input: { file_path: "src/a.js", old_string: "1", new_string: "2" } };
const RUN = { tool_name: "Bash", tool_input: { command: "npm test" } };
const DANGER = { tool_name: "Bash", tool_input: { command: "git push --force origin main" } };
const OTHER = { tool_name: "ExitPlanMode", tool_input: { plan: "계획" } };
// 사람의 답을 기다리는 동안은 답이 오지 않는다 — 목록에 보이는지로 본다
async function held(ev) {
  const a = ask(ev), answer = call("POST", "/api/approval", a.body);
  for (let i = 0; i < 40; i++) {
    const list = (await call("GET", "/api/approvals")).json.items;
    if (list.some((x) => x.id === a.id)) return { ...a, answer };
    await new Promise((r) => setTimeout(r, 25));
  }
  return null;
}

test("기본은 켜짐 — 설정 파일이 없으면 파일 고치기 · 명령을 사람에게 묻지 않고 바로 허용한다", async () => {
  fs.rmSync(AUTO, { force: true });
  assert.equal((await call("GET", "/api/approvals")).json.auto, true);
  for (const ev of [EDIT, RUN]) {
    const r = await call("POST", "/api/approval", ask(ev).body);
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.decision, "allow", ev.tool_name);
    assert.equal(r.json.auto, true);
  }
  assert.deepEqual((await call("GET", "/api/approvals")).json.items, [], "카드가 남지 않는다");
});

test("켜져 있어도 되돌리기 어려운 일은 사람에게 묻고, sure 없이는 허용되지 않는다", async () => {
  fs.rmSync(AUTO, { force: true });
  const h = await held(DANGER);
  assert.ok(h, "강제 푸시는 카드로 기다린다");
  const no = await call("POST", "/api/approvals/decide", { id: h.id, sig: h.sig, decision: "allow" });
  assert.equal(no.status, 409, no.text);
  await call("POST", "/api/approvals/decide", { id: h.id, sig: h.sig, decision: "deny" });
  assert.equal((await h.answer).json.decision, "deny");
});

test("켜져 있어도 파일 · 명령이 아닌 도구(계획 확인 · 외부 도구 등)는 사람에게 묻는다", async () => {
  fs.rmSync(AUTO, { force: true });
  const h = await held(OTHER);
  assert.ok(h, "kind other는 카드로 기다린다");
  await call("POST", "/api/approvals/decide", { id: h.id, sig: h.sig, decision: "deny" });
  await h.answer;
});

test("끄면 전처럼 카드로 묻고, 끈 것은 파일에 남아 서버를 다시 켜도 그대로다. 다시 켤 수 있다", async () => {
  const off = await call("POST", "/api/approvals/auto", { on: false });
  assert.equal(off.status, 200, off.text);
  assert.equal(off.json.auto, false);
  assert.equal(fs.readFileSync(AUTO, "utf8").trim(), "0");
  assert.equal((await call("GET", "/api/approvals")).json.auto, false);
  const h = await held(EDIT);
  assert.ok(h, "꺼져 있으면 파일 고치기도 카드로");
  await call("POST", "/api/approvals/decide", { id: h.id, sig: h.sig, decision: "allow" });
  assert.equal((await h.answer).json.decision, "allow");
  assert.equal((await call("POST", "/api/approvals/auto", { on: true })).json.auto, true);
  assert.equal((await call("POST", "/api/approval", ask(EDIT).body)).json.decision, "allow");
});

test("켜기 · 끄기는 true · false만 받고, 설정을 읽지 못하면 허용하지 않는 쪽으로 간다", async () => {
  const bad = await call("POST", "/api/approvals/auto", { on: "yes" });
  assert.equal(bad.status, 400, bad.text);
  fs.rmSync(AUTO, { force: true }); fs.mkdirSync(AUTO);   // 파일 자리에 폴더 — 읽기 실패
  assert.equal((await call("GET", "/api/approvals")).json.auto, false);
  fs.rmSync(AUTO, { recursive: true, force: true });
});

test("서버가 카드의 danger를 믿고 허용하므로, 허락 장치를 건드리는 파일 · 명령은 되돌리기 어려운 일로 본다", () => {
  for (const file of [".claude/settings.json", ".claude/settings.local.json", "C:\\p\\.claude\\settings.local.json", ".git/hooks/pre-commit"]) {
    assert.ok(AP.card({ tool_name: "Write", tool_input: { file_path: file, content: "{}" } }).danger, file);
  }
  for (const command of ["echo {} > .claude/settings.local.json", "rm .git/hooks/pre-commit", "cat x >> ~/.claude/settings.json"]) {
    assert.ok(AP.card({ tool_name: "Bash", tool_input: { command } }).danger, command);
  }
  assert.equal(AP.card({ tool_name: "Write", tool_input: { file_path: "docs/settings.json", content: "{}" } }).danger, "", "다른 settings 파일은 그대로");
  assert.equal(AP.card(RUN).danger, "");
});

test("훅은 서버가 켜져 있을 때만 허용을 받는다 — 서버가 꺼지면 전처럼 아무것도 출력하지 않는다(대신 허용하지 않음)", () => {
  const hook = fs.readFileSync(path.join(BACK, "approve-hook.js"), "utf8");
  assert.match(hook, /req\.on\("error", \(\) => \{ clearTimeout\(timer\); finish\(""\); \}\)/);
  assert.equal(AP.decisionOutput("none"), "");
});

test("화면 — 설정에 끄는 칸이 있고, 서버의 값을 따른다", () => {
  const FRONT = path.join(__dirname, "../../02-frontend/navigator/app");
  assert.match(fs.readFileSync(path.join(FRONT, "10-views.js"), "utf8"), /data-act="ap-auto" \$\{apAuto \? "checked" : ""\}/);
  assert.match(fs.readFileSync(path.join(FRONT, "92-basecard.js"), "utf8"), /a === "ap-auto"\) setApAuto\(t\.checked\)/);
  assert.match(fs.readFileSync(path.join(FRONT, "70-tasks.js"), "utf8"), /apAuto = j\.auto !== false/);
});
