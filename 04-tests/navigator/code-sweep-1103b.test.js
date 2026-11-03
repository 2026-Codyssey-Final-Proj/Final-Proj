// claude-drafted: 2026-11-03 — 코드 훑어보기 3차(임유정 "전체 코드 살펴보면서 오류 날만한 부분들 체크해줘" → "19, 20, 27번 제외하고 나머지 항목들 전부 순차적으로 수정하면서 커밋해줘"). F-144-n
// 묶음: 01-docs/07-maintenance/fixes/code-sweep-1103b.md
// 실행: node --test 04-tests/navigator/code-sweep-1103b.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const BACK = path.join(__dirname, "../../03-backend/navigator");

// ── 서버 ──

test("F-144-1 mergeSection — 끝 표시가 없거나 시작보다 앞에 있어도 사람이 쓴 글을 지우지 않고, 덩이를 쌓지 않는다", () => {
  const D = require(path.join(BACK, "docs.js"));
  const S = D.MARK_START, E = D.MARK_END, block = (v) => `${S}\nFloe ${v}\n${E}`;
  // 끝 표시만 빠진 README — 두 번 올려도 '내가 쓴 설치법'이 남는다
  let t = `# 내 앱\n${S}\nFloe v1\n## 내가 쓴 설치법\nnpm i\n`;
  t = D.mergeSection(t, block("v2"));
  t = D.mergeSection(t, block("v3"));
  assert.match(t, /## 내가 쓴 설치법\nnpm i/, t);
  assert.match(t, /Floe v3/);
  assert.doesNotMatch(t, /Floe v2/, "새 덩이로 바뀐다");
  // 끝 표시가 시작보다 앞 — 올릴 때마다 덩이가 하나씩 쌓이지 않는다
  let u = `${E}\n# 앱\n${S}\nFloe v1\n${E}\n끝\n`;
  u = D.mergeSection(u, block("v2"));
  u = D.mergeSection(u, block("v3"));
  assert.equal(u.split(S).length - 1, 1, u);
  assert.match(u, /Floe v3\n<!-- floe:end -->\n끝/);
  // 짝이 맞으면 전과 같다
  assert.equal(D.mergeSection(`앞\n${block("v1")}\n뒤`, block("v2")), `앞\n${block("v2")}\n뒤`);
});

test("F-144-2 허락 카드 — 강제 푸시 · 원격 지우기 · 긴 옵션의 rm · Windows rd /s도 '한 번 더'를 건다", () => {
  const AP = require(path.join(BACK, "approve.js"));
  const why = (command) => AP.card({ hook_event_name: "PermissionRequest", session_id: "s", cwd: "/p", tool_name: "Bash", tool_input: { command } }).danger;
  for (const c of ["git push origin +main", "git push origin +HEAD:main", "git push --mirror", "git push origin --delete feature", "git push origin :feature", "git push -d origin x",
    "rm --recursive --force src", "rm -R src", "rd /s /q src", "rmdir /s build", "Remove-Item -Recurse -Force src", "del /f /s *.js"]) {
    assert.ok(why(c), `위험 표시가 있어야 해요: ${c}`);
  }
  for (const c of ["git push origin feature", "git push -u origin main", "git push origin HEAD:main", "npm run build", "git status", "echo a+b"]) {
    assert.equal(why(c), "", `보통 일: ${c}`);
  }
});

test("F-144-3 app-link — 설정 파일을 읽지 못하면(없는 것이 아니면) 덮어쓰지 않는다", () => {
  const Link = require(path.join(BACK, "app-link.js"));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "floe-link-"));
  // 읽기 오류 — Claude Desktop이 파일을 잡고 있다(EBUSY · EPERM). 전에는 빈 설정으로 보고 백업 없이 { mcpServers: { floe } }만 썼다
  const file = path.join(dir, "claude_desktop_config.json"), orig = JSON.stringify({ mcpServers: { other: { command: "x" } }, theme: "dark" });
  fs.writeFileSync(file, orig);
  const read = fs.readFileSync;
  fs.readFileSync = (f, ...a) => { if (f === file) throw Object.assign(new Error("busy"), { code: "EBUSY" }); return read(f, ...a); };
  let r;
  try { r = Link.link(file, { command: "node" }); } finally { fs.readFileSync = read; }
  assert.equal(r.ok, false);
  assert.equal(fs.readFileSync(file, "utf8"), orig, "다른 MCP 서버 · 설정을 그대로 둔다");
  // 없는 파일이면 전처럼 새로 만든다
  const fresh = path.join(dir, "new.json");
  assert.equal(Link.link(fresh, { command: "node" }).ok, true);
  assert.equal(JSON.parse(fs.readFileSync(fresh, "utf8")).mcpServers.floe.command, "node");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("F-144-4 기준 카드 — 쌍점이 많은 긴 줄(로그)도 바로 끝나고, 재료 줄을 고르는 뜻은 전과 같다", () => {
  const BC = require(path.join(BACK, "basecard.js"));
  const OLD = /(.+?)[:：]\s*(.+(?:·|,|、).+(?:·|,|、).+)/;   // 고치기 전 — 뜻을 견주려고만 둔다
  const log = Array.from({ length: 300 }, (_, i) => `12:00:${String(i % 60).padStart(2, "0")} 요청 처리`).join(" ");
  const t0 = Date.now();
  BC.build({ source: [log, "a:" + "b:".repeat(4000) + "c, d"].join("\n") });
  assert.ok(Date.now() - t0 < 300, `${Date.now() - t0}ms — 전에는 2.8초 · 30초`);
  const mats = (line) => BC.build({ source: line }).materials.lines.length > 0;
  const samples = ["재료: 우유 · 달걀 · 밀가루", "도구: 엑셀, 메모장, 슬랙", "a: b, c", "a:, b, c", "a: b,, c", ": a, b, c", "a:b,c,d", "a：가、나、다", "시간 12:30 · 장소 · 사람",
    "a: ,b,", "a: b,c,", "x: · · ·", "a::b,c,d", "한 줄 글", "a: b · c, d", "ab: , ,x", "a: ,, x"];
  for (const s of samples) assert.equal(mats(s), OLD.test(s.replace(/\s+/g, " ").trim()), `뜻이 바뀌었어요: ${s}`);
});

test("F-144-5 claude --version은 기다리는 동안 서버를 붙잡지 않는다(spawnSync를 쓰지 않는다)", async () => {
  const P = require(path.join(BACK, "provider.js"));
  const r = P.claudeVersion(() => Promise.resolve({ status: 0, stdout: "2.1.30 (Claude Code)\n" }));
  assert.equal(typeof r.then, "function", "약속(Promise)을 돌려준다");
  assert.deepEqual(await r, { found: true, version: "2.1.30" });
  const src = fs.readFileSync(path.join(BACK, "provider.js"), "utf8");
  assert.doesNotMatch(src, /spawnSync\(|\{ spawn, spawnSync \}|run = spawnSync/, "Electron 메인 안에서 4초씩 멈췄다");
  const server = fs.readFileSync(path.join(BACK, "server.js"), "utf8");
  assert.match(server, /await setupNow\(\)/);
});

test("F-144-6 claude 출력이 64KB 조각 경계에서 한글 가운데로 잘려도 '�'가 생기지 않는다", async () => {
  const P = require(path.join(BACK, "provider.js"));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "floe-enc-")), fake = path.join(dir, "fake-claude.js");
  // 앞 65,537바이트를 먼저 보내고(한글 세 바이트 가운데) 나머지는 조금 뒤에 — 조각마다 따로 글자로 풀면 깨진다
  fs.writeFileSync(fake, `const b = Buffer.from(JSON.stringify({ type: "result", structured_output: { t: "가".repeat(30000) }, usage: {} }));
process.stdin.resume(); process.stdin.on("end", () => { process.stdout.write(b.subarray(0, 65537)); setTimeout(() => process.stdout.write(b.subarray(65537)), 50); });`);
  const r = await P.callCli("글", { type: "object" }, null, { cmd: process.execPath, pre: [fake], env: {} });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.ok(r.data, JSON.stringify(r).slice(0, 200));
  assert.equal(r.data.t, "가".repeat(30000));
  const src = fs.readFileSync(path.join(BACK, "provider.js"), "utf8");
  for (const fn of ["function callCli", "function startTask"]) {
    const body = src.slice(src.indexOf(fn), src.indexOf("\n}\n", src.indexOf(fn)));
    assert.match(body, /stdout\.setEncoding\("utf8"\)/, `${fn} — 판정 · 맡긴 일 둘 다`);
  }
});

test("F-144-7 저장소 받기가 시간 초과되면 프로세스 나무째 끄고, 받다 만 폴더를 성공으로 잇지 않는다", async () => {
  const PR = require(path.join(BACK, "project.js"));
  const killed = [];
  const r = await PR.runCommand(process.execPath, ["-e", "setTimeout(() => {}, 5000)"], { timeout: 100, kill: (c) => { killed.push(c.pid); c.kill(); } });
  assert.equal(r.timeout, true);
  assert.equal(killed.length, 1, "gh만 끄면 그 밑의 git clone이 계속 돌았다");
  // 같은 저장소 폴더가 있는데 HEAD가 없다(받다 만 것) → 잇지 않는다
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "floe-clone-")), dir = PR.folderFor(home, "app");
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, "x"), "");
  const run = async (cmd, args) => {
    if (args[0] === "api") return { code: 0, out: "true" };   // canPush — 내가 쓸 수 있는 저장소
    if (args[0] === "remote") return { code: 0, out: "https://github.com/me/app.git" };
    if (args[0] === "rev-parse") return { code: 128, out: "" };
    return { code: 0, out: "" };
  };
  const half = await PR.cloneRepo(home, "me/app", { ghReady: true, run });
  assert.equal(half.ok, false, JSON.stringify(half));
  const whole = await PR.cloneRepo(home, "me/app", { ghReady: true, run: async (c, a) => (a[0] === "rev-parse" ? { code: 0, out: "abc" } : run(c, a)) });
  assert.equal(whole.ok, true, JSON.stringify(whole));
  assert.equal(whole.made, false);
  fs.rmSync(home, { recursive: true, force: true });
});

// ── 화면(app.js) — code-sweep-1103.test.js처럼 함수를 글자에서 떼어 가짜 상태로 돌린다 ──
const APP = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
const WIN = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/win.js"), "utf8");
function fnSrc(name, a = APP) {
  const at = a.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(at >= 0, `${name}를 찾지 못했어요`);
  let i = a.indexOf(") {", at) + 2, d = 0;
  for (; i < a.length; i++) { if (a[i] === "{") d++; else if (a[i] === "}" && --d === 0) break; }
  return a.slice(at, i + 1);
}
const lineOf = (re, a = APP) => { const m = a.match(re); assert.ok(m, `${re} 줄이 없어요`); return m[0]; };

test("F-144-8 앱의 작업실 창 — 단추 켜고 끄기 · 칸에 커서 두기가 숨은 섬 창이 아니라 작업실 창에 닿는다", () => {
  const make = new Function("winOpen", "syncWins", "$nav", "document", "requestAnimationFrame",
    `let focusSeq = 0, focusWant = ""; const lastOff = {}; ${fnSrc("liveBtn")} ${fnSrc("focusAct")} return { liveBtn, focusAct, want: () => focusWant };`);
  let synced = 0; const btn = { disabled: false }, none = { querySelector: () => null };
  const f = make({ quest: true }, () => synced++, { querySelector: () => btn }, none, (cb) => cb());
  f.liveBtn("task-tidy", true); f.liveBtn("task-tidy", true);
  assert.equal(synced, 1, "상태가 바뀔 때만 다시 그려 보낸다(글자마다가 아니라)");
  assert.equal(btn.disabled, true);
  f.liveBtn("task-tidy", false); assert.equal(synced, 2);
  f.focusAct("[data-act=say]");
  assert.match(f.want(), /^\d+\|\[data-act=say\]$/); assert.equal(synced, 3);
  // 브라우저(작업실 창 없음)는 전처럼 그 자리에서
  let focused = 0; const g = make({ quest: false }, () => synced++, { querySelector: () => ({ focus: () => focused++ }) }, none, (cb) => cb());
  g.focusAct("[data-act=say]"); assert.equal(focused, 1);
  // 섬 창의 요소를 직접 고르던 줄이 남지 않았다
  assert.doesNotMatch(APP, /\$nav\.querySelector\("\[data-act=(say|dbg-text|plan-rej-note|plan-q|task-tidy|plan-again)\]"\)/);
  assert.doesNotMatch(APP, /document\.querySelector\("\[data-act=note-add\]"\)/);
  assert.match(fnSrc("syncWins"), /islCol\(\) \+ focusTag\(\)/);
  assert.match(lineOf(/const focusTag = [^\n]*/), /data-want-focus/);
  assert.match(WIN, /\[data-want-focus\]/, "작업실 창이 그 신호로 커서를 둔다");
});

test("F-144-9 다시 그린 뒤 커서는 같은 이름의 여러 칸 중 쓰던 칸으로 돌아간다(data-id · data-v)", () => {
  const keyOf = new Function(`${lineOf(/const keyOf = [^\n]*/, WIN)}; return keyOf;`)();
  const el = (d) => ({ dataset: d });
  assert.notEqual(keyOf(el({ act: "card-field", v: "who" })), keyOf(el({ act: "card-field", v: "size" })));
  assert.notEqual(keyOf(el({ act: "plan-note", id: "p1" })), keyOf(el({ act: "plan-note", id: "p2" })));
  assert.match(WIN, /find\(\(x\) => keyOf\(x\) === key\)/);
  assert.match(lineOf(/const a = document\.activeElement, keep = [^\n]*/), /\["i", "k", "v"\]/, "섬 창도 data-k · data-v까지");
});

test("F-144-10 확인할 먹이 — 두 번 눌러도 확인하지 않은 다음 항목을 넣거나 빼지 않는다", () => {
  const { inboxSig, inboxSame } = new Function(`${lineOf(/const inboxSig = [^\n]*/)}; ${lineOf(/const inboxSame = [^\n]*/)}; return { inboxSig, inboxSame };`)();
  const a = { topic: "회의", text: "가" }, b = { topic: "회의", text: "나" };
  const clicked = { dataset: { k: inboxSig(a) } };
  assert.equal(inboxSame(a, clicked), true);
  assert.equal(inboxSame(b, clicked), false, "당겨져 온 다음 항목은 다른 단추로 본다");
  assert.match(lineOf(/"inbox-ok": [^\n]*/), /inboxSame\(x, el\)/);
  assert.match(lineOf(/"inbox-drop": [^\n]*/), /inboxSame\(/);
  assert.match(fnSrc("inboxBox"), /data-act="inbox-ok" data-i="\$\{i\}" data-k="\$\{inboxSig\(x\)\}"/);
});

test("F-144-18 경고 카드의 '보낼게요'를 두 번 눌러도 TypeError가 나지 않는다", () => {
  assert.match(lineOf(/"send-anyway": [^\n]*/), /if \(st\.warn && RETRY\[st\.warn\.then\]\)/);
});

test("F-144-11 비밀값 경고에서 '그만둘게요'면 보내지 않기로 한 원문을 기록(st.source)에 남기지 않는다", async () => {
  const make = new Function("st", "canLive", "guard", "callAI", "say", "beginQuest", "QU", "N",
    `let startText = ""; const fetchUsage = () => {}; ${fnSrc("startDraft")} return startDraft;`);
  const st = { mode: "live", busy: false };
  const stop = make(st, true, () => true, async () => { throw new Error("부르면 안 돼요"); }, () => {}, () => {}, {}, {});
  await stop("내 메일 a@b.com 으로 알림");
  assert.equal(st.source, undefined, "경고에서 멈췄으면 기록하지 않는다");
  const st2 = { mode: "live", busy: false };
  const go = make(st2, true, () => false, async () => ({ ok: true, start: {} }), () => {}, () => {}, {}, {});
  await go("할 일 앱");
  assert.equal(st2.source, "할 일 앱", "지나간 글은 기록한다");
});

test("F-144-12 '기록 지우기'는 진짜 AI 모드의 서버 대화도 지운 뒤 다시 읽는다", async () => {
  const src = lineOf(/forget: async \(\) => \{[^\n]*?location\.reload\(\); \}/);
  const calls = [];
  const acts = new Function("chatFolder", "fetch", "localStorage", "location", "KEY", "BOUND_KEY", `let forgotten = false; return ({ ${src} });`)(
    true, async (u, o) => { calls.push(["fetch", u, JSON.parse(o.body)]); return {}; }, { removeItem: (k) => calls.push(["rm", k]) }, { reload: () => calls.push(["reload"]) }, "k", "b");
  await acts.forget();
  assert.deepEqual(calls[0], ["fetch", "/api/chatlog", { clear: true }]);
  assert.deepEqual(calls[calls.length - 1], ["reload"], "지운 뒤에 다시 읽는다");
  assert.doesNotMatch(APP, /기록은 이 컴퓨터의 브라우저에만 남아요/, "문구도 서버 쪽을 말한다");
});

test("F-144-13 섬 화면 — 한글을 조합하는 동안의 입력은 다시 그리지 않고, 조합이 끝나면 한 번 그린다", () => {
  assert.match(fnSrc("render"), /^function render\(\) \{\n\s*if \(imeHold\) \{ imeSkipped = true; return; \}/);
  assert.match(APP, /addEventListener\("input", \(e\) => \{ activity\(\); if \(!e\.isComposing\) return onInput\(e\.target\); imeHold = true;/);
  assert.match(APP, /addEventListener\("compositionend", \(e\) => \{ if \(!imeSkipped\) return; imeSkipped = false; onInput\(e\.target\); \}\)/);
});

test("F-144-14 폴더 기록 되살리기 — 모두 지났으면 마친 모습으로, 1단계(관문 전)는 되살린 줄로 칸을 채운다", () => {
  const QU = require(path.join(BACK, "quest.js"));
  const STAGES = [{ n: 0, title: "아이디어", criteria: [{ text: "가" }, { text: "나" }] }, { n: 1, title: "요구", criteria: [{ text: "다" }] }];
  const make = (st) => new Function("st", "N", "QU", "LB", "crits", `${fnSrc("resumeAt")} return resumeAt;`)(st, { STAGES }, QU, (n) => `${n + 1}단계`, (n) => STAGES[n].criteria);
  const done = { results: {} }; make(done)(2);
  assert.equal(done.finished, true);
  assert.equal(done.j && done.j.stage, 1, "st.j가 비면 시작 화면이 떴다 — 마지막 단계를 마친 모습");
  assert.equal(done.quest, null);
  const first = { results: { 0: { items: [{ name: "가", lines: ["줄 하나"] }, { name: "나", lines: [] }] } }, topic: "앱" }; make(first)(0);
  assert.equal(first.j.stage, 0);
  assert.equal(first.quest.phase, "quest");
  assert.deepEqual(first.quest.lines, [["줄 하나"], []], "되살린 줄로 칸을 채운다");
  assert.match(lineOf(/if \(nx > 0 \|\| st\.results\[0\]\) \{ resumeAt\(nx\); if \(st\.quest\) questStarted\(\); \}/), /questStarted/);
});
