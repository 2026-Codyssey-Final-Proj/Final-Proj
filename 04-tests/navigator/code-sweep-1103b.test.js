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
