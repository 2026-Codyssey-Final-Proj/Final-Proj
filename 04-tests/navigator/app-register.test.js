// claude-drafted: 2026-10-29 — app.js 나누기 2차(이재엽 "그 순서대로 진행해줘" — PR 1 조각 나누기 다음): 기능 조각이 자기 저장 칸과 누르기를 스스로 등록한다.
// 왜: 모든 기능 PR이 00-base의 KEEP 한 줄과 90-acts의 누르기 표 하나를 같이 고쳐 병합 때마다 거기서 부딪쳤다(#250 ↔ #252 ~ #254 KEEP 한 줄).
// 지키는 것: ① 저장할 것은 KEEP(공통) + 조각의 keep([...])이고, 빠진 키 · 겹친 키가 없다 ② keep은 load가 읽어 둔 기록에서 값을 가져온다(00-base)
//   ③ 누르기 표 ACT는 00-base에 하나, 조각은 Object.assign(ACT, { … })로 더하고 같은 이름이 두 번 없다 ④ 옮긴 기능은 제 조각에 있다
// 실행: node --test 04-tests/navigator/app-register.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const NAV = path.join(__dirname, "../../02-frontend/navigator");
const AP = require(path.join(NAV, "app-parts.js"));
const parts = Object.fromEntries(AP.readParts(path.join(NAV, "app")).map((p) => [p.name, p.text]));
const app = fs.readFileSync(path.join(NAV, "app.js"), "utf8");
const words = (s) => (s.match(/"([\w-]+)"/g) || []).map((w) => w.slice(1, -1));

// 나누기 전(2026-10-29) KEEP 한 줄에 있던 키 — 하나도 빠지면 안 된다
const BEFORE = ["chatMark", "chatOpen", "mode", "textSize", "text", "j", "todos", "history", "learned", "auto", "doc", "docs", "project", "pets", "since", "finished", "libGone",
  "checks", "hold", "todoLater", "alerts", "tier", "unplug", "judged", "fed", "inbox", "sorted", "quest", "idea", "shells", "owned", "wear", "plan", "planDraft", "planReadme", "qfocus",
  "topic", "codeless", "linesDone", "carryDone", "carryUse", "docPrints", "results", "prep", "source", "card"];
const OWN_KEEP = { "30-chat.js": ["chatMark", "chatOpen"], "45-knowledge.js": ["carryDone", "carryUse", "docPrints"], "55-files.js": ["linesDone", "codeless"] };

test("저장할 것 = KEEP + 조각의 keep([...]) — 빠진 키 · 겹친 키가 없고, 옮긴 키는 제 조각에", () => {
  const base = words(/const KEEP = \[([^\]]+)\]/.exec(parts["00-base.js"])[1]);
  const kept = [...app.matchAll(/^  keep\(\[([^\]]+)\]/gm)].flatMap((m) => words(m[1]));
  const all = [...base, ...kept];
  assert.deepEqual(all.filter((k, i) => all.indexOf(k) !== i), [], "같은 키를 두 번 등록하지 않는다");
  assert.deepEqual(BEFORE.filter((k) => !all.includes(k)), [], "나누기 전에 저장하던 키는 그대로 저장한다");
  for (const [f, ks] of Object.entries(OWN_KEEP)) {
    const m = new RegExp(`^  keep\\(\\[([^\\]]+)\\]`, "m").exec(parts[f]);
    assert.ok(m, `${f}가 keep([...])을 부른다`);
    for (const k of ks) { assert.ok(words(m[1]).includes(k), `${k}는 ${f}가 등록`); assert.ok(!base.includes(k), `${k}는 공통 KEEP에서 뺀다`); }
  }
});

test("keep은 00-base에(load 전에 정의), 지식 퀘스트의 고장 값 고치기는 load에서 그 조각으로 옮겼다", () => {
  const b = parts["00-base.js"];
  assert.ok(/^  function keep\(/m.test(b) && b.indexOf("  function keep(") < b.indexOf("  load();"), "조각이 바로 쓴다");
  assert.doesNotMatch(b, /st\.carryDone = st\.carryDone === true/);
  assert.match(parts["45-knowledge.js"], /st\.carryDone = st\.carryDone === true/);
});

// Object.assign(ACT, { … }) 덩어리의 맨 위 수준 키(들여쓰기 네 칸)
function actKeys(text) {
  const out = [];
  for (const m of text.matchAll(/^  Object\.assign\(ACT, \{\n([\s\S]*?)^  \}\);/gm))
    for (const l of m[1].split("\n")) { const k = /^    (?:"([\w-]+)"|([A-Za-z_$][\w$]*)):/.exec(l); if (k) out.push(k[1] || k[2]); }
  return out;
}

test("누르기 표 ACT — 00-base에 하나, 조각은 Object.assign(ACT, { … })로 더하고 같은 이름이 두 번 없다", () => {
  assert.match(parts["00-base.js"], /^  const ACT = \{\};/m);
  assert.equal((app.match(/const ACT = /g) || []).length, 1, "ACT를 다시 만들지 않는다");
  const all = Object.values(parts).flatMap(actKeys);
  assert.ok(all.length >= 260, `누르기 ${all.length}개`);
  assert.deepEqual(all.filter((k, i) => all.indexOf(k) !== i), [], "같은 누르기 이름이 두 조각에 있으면 나중 것이 덮는다");
});

test("옮긴 기능의 누르기는 제 조각에", () => {
  const own = { "40-quest.js": ["ship-go", "ship-public"], "45-knowledge.js": ["carry-draft", "carry-use-none", "restore-go"],
    "55-files.js": ["build-skeleton", "code-no", "map-open", "preset-go", "fn-open", "fsave", "fn-dir"],
    "58-workspace.js": ["wnav-toggle", "ffmt", "tree-view", "prep-draw", "map-card"], "70-tasks.js": ["stall-wait", "stall-stop", "blocked-again", "blocked-stop"] };
  for (const [f, ks] of Object.entries(own)) { const got = actKeys(parts[f]); for (const k of ks) assert.ok(got.includes(k), `${k}는 ${f}`); }
  const core = actKeys(parts["90-acts.js"]);
  for (const k of Object.values(own).flat()) assert.ok(!core.includes(k), `${k}는 90-acts에서 뺐다`);
});
