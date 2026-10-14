// claude-drafted: 2026-10-14
// Claude Code와 Navigator 연결하기 — 바이브 코딩하는 프로젝트 폴더의 Claude Code에 훅 두 개를 더한다.
//
//   node connect.js [폴더]            무엇을 어디에 더할지 보여 주기만 한다 (아무것도 바꾸지 않음)
//   node connect.js [폴더] --apply    백업을 만든 뒤 더한다
//   node connect.js [폴더] --remove   백업을 만든 뒤 우리가 더한 것만 뺀다
//
// 대상 파일: [폴더]/.claude/settings.local.json — 그 사람만 쓰는 개인 설정 자리라 보통 저장소에 올라가지 않는다.
// 폴더를 안 주면 지금 있는 폴더. 다른 설정과 다른 훅은 건드리지 않는다.
const fs = require("node:fs");
const path = require("node:path");

const HOOK = path.join(__dirname, "hook.js").replace(/\\/g, "/");
const COMMAND = `node "${HOOK}"`;
const EVENTS = ["UserPromptSubmit", "Stop"];
const MARK = "navigator-prototype/hook.js";
const ours = (h) => !!h && typeof h.command === "string" && h.command.includes(MARK);
const clone = (o) => JSON.parse(JSON.stringify(o || {}));

// 이미 있으면 또 더하지 않는다
function addHooks(settings, command = COMMAND) {
  const s = clone(settings);
  s.hooks = s.hooks || {};
  for (const e of EVENTS) {
    const list = s.hooks[e] || [];
    if (!list.some((g) => (g.hooks || []).some(ours))) list.push({ hooks: [{ type: "command", command, timeout: 5 }] });
    s.hooks[e] = list;
  }
  return s;
}

// 우리 것만 뺀다. 비게 된 칸은 지운다
function removeHooks(settings) {
  const s = clone(settings);
  if (!s.hooks) return s;
  for (const e of Object.keys(s.hooks)) {
    s.hooks[e] = (s.hooks[e] || []).map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !ours(h)) })).filter((g) => g.hooks.length);
    if (!s.hooks[e].length) delete s.hooks[e];
  }
  if (!Object.keys(s.hooks).length) delete s.hooks;
  return s;
}

function main(argv) {
  const apply = argv.includes("--apply"), remove = argv.includes("--remove");
  const dir = path.resolve(argv.find((a) => !a.startsWith("--")) || process.cwd());
  const file = path.join(dir, ".claude", "settings.local.json");
  let before = {};
  if (fs.existsSync(file)) {
    try { before = JSON.parse(fs.readFileSync(file, "utf8")); }
    catch { console.error(`${file} 를 읽을 수 없어요(JSON 모양이 아니에요). 아무것도 바꾸지 않았어요.`); return 1; }
  }
  const after = remove ? removeHooks(before) : addHooks(before);
  console.log(`대상: ${file}`);
  console.log(`${remove ? "뺀 뒤" : "더한 뒤"}의 hooks 칸:\n${JSON.stringify(after.hooks || {}, null, 2)}`);
  if (!apply && !remove) { console.log("\n확인만 했어요. 실제로 더하려면 --apply 를 붙여 다시 실행하세요."); return 0; }
  if (fs.existsSync(file)) {
    const backup = `${file}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    fs.copyFileSync(file, backup);
    console.log(`\n백업: ${backup}`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(after, null, 2) + "\n");
  console.log(remove ? "Navigator 연결을 뺐어요." : "연결했어요. 이 폴더에서 Claude Code를 새로 열면 Navigator가 작업을 알아채요. (Navigator 서버: node server.js)");
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { addHooks, removeHooks, COMMAND, EVENTS };
