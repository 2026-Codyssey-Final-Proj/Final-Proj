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

test("F-122 Ctrl+Enter — 입력 칸에서는 그 카드(.mc, 설정 판 빼고) 안의 칸일 때만 카드의 Ctrl+Enter 동작, Enter 동작으로 넘어가지 않는다(파일 편집기에서 커밋 · 푸시가 맡겨지던 것)", () => {
  const field = (inCard) => ({ closest: (sel) => (sel === ".mc:not(.pane)" && inCard ? {} : null) });
  const ship = { act: "ship-go" }, plan = { act: "plan-make" };
  let deskKeys = { Enter: ship };
  const pick = () => make(fnSrc("ctrlEnterAct"), "ctrlEnterAct", { deskKeys });
  assert.equal(pick()(field(false), true), null, "파일 편집기 · 설정 칸: 카드의 Enter(커밋 · 푸시 맡기기)를 부르지 않는다");
  assert.equal(pick()(field(true), true), null, "카드 안 칸이라도 Ctrl+Enter 동작이 없으면 Enter로 넘어가지 않는다");
  assert.equal(pick()(null, false), ship, "칸 밖에서는 지금처럼 Enter 동작");
  deskKeys = { Enter: ship, "c-Enter": plan };
  assert.equal(pick()(field(true), true), plan, "카드 안 칸에서는 그 카드의 Ctrl+Enter(글을 쓰고 보내기)");
  assert.equal(pick()(field(false), true), null, "카드 밖 칸에서는 아무것도");
  assert.match(a, /const a = ctrlEnterAct\(t, writing\);/, "keydown이 이 함수로 고른다");
});

test("F-123 '프로젝트 바꾸기' — 작업실이 열려 있으면 먼저 닫는다(처음 설정은 섬 창에 떠서, 숨은 섬 위에 떠 보이지 않던 것). '처음 설정'과 같다", () => {
  for (const name of ["setup", "setup-project"]) {
    const st = { settings: true, qwin: true }, opened = [];
    const set = (o) => Object.assign(st, o), window = { FloeSetup: { open: (o) => opened.push(o) } };
    makeAct(name, { st, set, window })();
    assert.equal(st.qwin, false, `${name}: 작업실을 닫는다`); assert.equal(opened.length, 1);
  }
});

test("F-124 저장 칸이 가득 차면 — 대화를 먼저 줄여 진행을 다시 저장하고, 그래도 못 하면 한 번 알린다(조용히 잃지 않게)", () => {
  const box = {}, said = [];
  let room = 0;   // 남은 칸(글자 수) — 넘치면 setItem이 던진다(QuotaExceededError)
  const localStorage = { setItem(k, v) { const used = Object.entries(box).reduce((n, [kk, vv]) => n + (kk === k ? 0 : vv.length), 0); if (used + v.length > room) throw new Error("QuotaExceededError"); box[k] = v; } };
  const chat = Array.from({ length: 300 }, (_, i) => ({ text: `말 ${i}`.padEnd(40, "·") }));
  const st = { text: "넣은 글", chat: chat.slice(), chatMark: 250 };
  const env = { forgotten: false, KEEP: ["text"], st, KEY: "k", CHAT_KEY: "k:chat", localStorage, postState() {}, say: (t) => said.push(t), saveWarned: false };
  room = JSON.stringify(chat).length + 10;   // 대화가 칸을 거의 다 차지했다
  box["k:chat"] = JSON.stringify(chat);
  make(fnSrc("save"), "save", env)();
  assert.ok(box.k && JSON.parse(box.k).text === "넣은 글", "대화를 줄여 진행을 저장한다");
  assert.equal(st.chat.length, 100); assert.equal(st.chatMark, 50, "표시 자리도 같이 당긴다(F-103-26)");
  assert.deepEqual(said, []);
  room = 5; delete box.k; delete box["k:chat"];   // 대화를 줄여도 모자라다
  const save = make(fnSrc("save"), "save", env);
  save(); save();
  assert.equal(said.length, 1, "한 번만 알린다"); assert.match(said[0], /저장/);
});

// 기다렸다가 풀어 주는 약속 — 늦게 오는 응답을 흉내 낸다
const later = () => { let go; const p = new Promise((r) => (go = r)); return { wait: () => p, go }; };
const tick = () => new Promise((r) => setTimeout(r, 0));

test("F-125 허락 카드 — 누른 카드를 누르기 전에 출발한 목록 응답이 되살리지 않는다(또 누르면 실패). 보내기에 실패하면 다시 보인다", async () => {
  const card = { id: "a1", sig: "s", tool: "claude", card: { tool_name: "Write" } }, poll = later();
  let decideOk = true;
  const st = { apSure: "", ui: "home", pane: "", place: "" };
  const env = { st, canLive: true, render() {}, say() {}, mat() {}, set: (o) => Object.assign(st, o), activity() {}, go() {}, toolName: (x) => x,
    fetch: async (url) => url === "/api/approvals" ? { json: async () => { await poll.wait(); return { ok: true, items: [card] }; } } : { json: async () => (decideOk ? { ok: true } : { ok: false, reason: "보내지 못했어요" }) } };
  const m = new Function(...Object.keys(env), `let approvals = [${JSON.stringify(card)}], apMode = "live"; const apKnown = new Set(["a1"]), apDecided = new Set(); ${fnSrc("decideApproval")} ${fnSrc("pollApprovals")}; return { decideApproval, pollApprovals, list: () => approvals };`)(...Object.values(env));
  const polling = m.pollApprovals(); await tick();   // 목록을 묻는 중
  const deciding = m.decideApproval("a1", "deny");   // 그사이 '거절'
  poll.go(); await polling; await deciding;
  assert.deepEqual(m.list().map((x) => x.id), [], "누른 카드가 되살아나지 않는다");

  decideOk = false;
  const m2 = new Function(...Object.keys(env), `let approvals = [${JSON.stringify(card)}], apMode = "live"; const apKnown = new Set(["a1"]), apDecided = new Set(); ${fnSrc("decideApproval")} ${fnSrc("pollApprovals")}; return { decideApproval, pollApprovals, list: () => approvals };`)(...Object.values(env));
  await m2.decideApproval("a1", "deny"); await tick(); await m2.pollApprovals();
  assert.deepEqual(m2.list().map((x) => x.id), ["a1"], "서버에 닿지 못했으면 다시 누를 수 있게 돌아온다");
});

test("F-126 주소 장면 — 서고에서 돌아온 주소(&back)는 장면이 아니라 대화를 비우지 않는다. 장면(#crit · #ex= 등)은 지금처럼 처음부터", () => {
  const run = (hash) => {
    const st = { chat: [{ text: "지난 대화" }], chatMark: 1, chatChanges: [{ path: "a" }], chatOpen: 0 };
    const env = { st, location: { hash }, safeDecode: (s) => s, setPlace() {}, lastLive: 1, FP: null, AP: null, TIERS: [], FD: null, S: { first: { text: "" } }, T: null,
      exHidden: false, applyEx() {}, openBooks: () => [], allDone: () => false, approvals: [], apMode: "none", TABS: [], SHELF_ON: false, save() {} };
    make(fnSrc("fromHash"), "fromHash", env)();
    return st;
  };
  assert.equal(run("#back").chat.length, 1, "&back — 대화가 그대로");
  assert.equal(run("#crit").chat.length, 0, "장면은 대화도 처음부터(C-63)");
});
