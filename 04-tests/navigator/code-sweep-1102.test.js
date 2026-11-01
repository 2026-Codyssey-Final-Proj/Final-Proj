// claude-drafted: 2026-11-02 — 코드 훑어보기(임유정 "전체 코드 살펴보면서 오류 날만한 부분들 체크해줘") 중 화면 쪽 고침(F-120 ~).
//   screen-bug-hunt.test.js처럼 app.js의 함수를 글자에서 떼어 가짜 상태(st)로 실제로 돌려 본다.
// 실행: node --test 04-tests/navigator/code-sweep-1102.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");

// `function name(` · `async function name(`의 본문을 괄호 짝으로 떼어 낸다
function fnSrc(name) {
  const at = a.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(at >= 0, `${name}를 찾지 못했어요`);
  let i = a.indexOf(") {", at) + 2, d = 0;
  for (; i < a.length; i++) { if (a[i] === "{") d++; else if (a[i] === "}" && --d === 0) break; }
  return a.slice(at, i + 1);
}
// ACT 한 칸(`"이름": (…) => …,`)의 화살표 함수를 떼어 낸다 — 한 줄짜리만
function actSrc(name) {
  const m = a.match(new RegExp(`\\n\\s*"?${name}"?: (\\([^)]*\\) => .*),\\s*(//.*)?\\n`));
  assert.ok(m, `ACT ${name}를 찾지 못했어요`);
  return m[1];
}
const make = (src, name, env) => new Function(...Object.keys(env), `${src}; return ${name};`)(...Object.values(env));
const makeAct = (name, env) => new Function(...Object.keys(env), `return ${actSrc(name)};`)(...Object.values(env));

test("F-120 뽑기 — 여는 중(rolling)에 × 단추로 닫지 않는다(조개만 빠지고 아이템을 못 받던 것). Esc와 같다", () => {
  const st = { gacha: { phase: "rolling" } };
  const set = (o) => Object.assign(st, o);
  const close = makeAct("gacha-close", { st, set });
  close();
  assert.deepEqual(st.gacha, { phase: "rolling" }, "여는 중에는 그대로");
  st.gacha = { phase: "got", item: {} }; close();
  assert.equal(st.gacha, null, "다 열린 뒤에는 닫힌다");
});

test("F-121 틀로 맡긴 일이 끝나도 저장하지 않은 고친 것은 덮지 않는다 — 다시 읽지 않고 알린다", () => {
  const reloaded = [], said = [];
  const st = { presetTask: { path: "a.md", name: "틀" }, openFiles: [{ path: "a.md", text: "고친 글", saved: "옛 글", dirty: true, note: null }, { path: "b.md", dirty: false }] };
  const env = { st, reloadFile: (k) => reloaded.push(k), say: (t) => said.push(t), N: { SAY_MAX: 80 } };
  make(fnSrc("presetEnd"), "presetEnd", env)({ state: "done" });
  assert.deepEqual(reloaded, [], "고친 것이 있으면 다시 읽지 않는다");
  assert.equal(st.openFiles[0].text, "고친 글");
  assert.equal(st.openFiles[0].note.kind, "ask"); assert.ok(st.openFiles[0].note.acts.some(([, act]) => act === "freload"), "사람이 고르면 다시 연다");
  st.presetTask = { path: "b.md", name: "틀" };
  make(fnSrc("presetEnd"), "presetEnd", env)({ state: "done" });
  assert.deepEqual(reloaded, [1], "고친 것이 없으면 지금처럼 다시 읽는다");
});
