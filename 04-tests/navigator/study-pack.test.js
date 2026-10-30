// claude-drafted: 2026-10-30 — C-24 공부 묶음 · NotebookLM 안내(이재엽 "보드에서 없음 부분 전부 제작"). 요구: 용어 풀이나 관문의 '아니요' 뒤 '더 공부하기' →
// 지금 단계 설명 · 관문 계획서 · 용어 풀이 · 내 기록 중 사용자가 고른 것을 공부 묶음(글 파일 + 먼저 물을 질문 다섯)으로 내려받고, NotebookLM에 올리는 법을 한 장으로.
// 비밀값 · 개인적인 것은 가리고 무엇을 가렸는지 알린다. Floe는 NotebookLM에 보내지 않는다 — 올리는 것은 사용자.
// 열린 칸은 Claude가 기본값으로 정했다: 직접 올리기만(기관용 API는 대회 뒤) · 질문 다섯은 코드 목록(AI 없음) · 내려받기만이라 밖으로 나가는 길은 늘지 않는다.
// 규칙 03-backend/navigator/studypack.js, 화면 02-frontend/navigator/app/60-library.js(책 탭) · 10-views.js(용어) · 20-feed.js(관문). 코드보다 먼저 썼다(code.md 1번).
// 실행: node --test 04-tests/navigator/study-pack.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const SP = require("../../03-backend/navigator/studypack.js");
const S = require("../../03-backend/navigator/sensitive.js");
const N = require("../../03-backend/navigator/navigator.js");

const RESULTS = {
  0: { chap: 0, items: [{ name: "어떤 불편", lines: ["신청을 종이로 받아 헷갈려요"], by: "me" }], at: "2026-10-25", passed: "2026-10-25", learned: "불편을 한 문장으로" },
  1: { chap: 1, items: [{ name: "아이디어", lines: ["신청 화면 하나와 목록 하나"] }], at: "2026-10-27" },
};

test("고를 것 넷 — 지금 단계 · 관문 계획서 · 용어 풀이 · 내 기록, 기본은 앞의 셋(내 기록은 사람이 골라야)", () => {
  assert.deepEqual(SP.SOURCES.map(([k]) => k), ["stage", "plan", "terms", "mine"]);
  assert.deepEqual(SP.DEFAULT_PICK, ["stage", "plan", "terms"]);
});

test("고른 것만 묶는다 — 절마다 제목, 고르지 않은 것은 없다. 아무것도 안 고르면 null", () => {
  const p = SP.build({ n: 1, pick: ["stage", "terms"], results: RESULTS });
  assert.match(p.text, /^# 공부 묶음 — 2단계 · /);
  assert.match(p.text, /## 지금 단계 설명/); assert.match(p.text, /## 용어 풀이/);
  assert.ok(!/## 관문 계획서|## 내 기록/.test(p.text));
  assert.ok(p.text.includes(N.STAGES[1].does));
  assert.equal(SP.build({ n: 1, pick: [], results: RESULTS }), null);
  assert.equal(SP.build({ n: 1, pick: ["모르는 것"], results: RESULTS }), null);
  assert.match(SP.build({ n: 1, pick: ["plan"], results: RESULTS }).text, /2단계 관문 계획서/, "관문 계획서는 gateplan.js 그대로");
  assert.match(SP.build({ n: 1, pick: ["mine"], results: RESULTS }).text, /신청 화면 하나와 목록 하나/, "내 기록 — 지금까지 단계의 적은 칸");
});

test("질문 다섯 — 늘 다섯, 겹치지 않고, 묶음 끝에 붙는다. 용어로 들어왔으면 그 용어가 질문에", () => {
  const p = SP.build({ n: 2, pick: ["stage"], results: RESULTS });
  assert.equal(p.questions.length, 5); assert.equal(new Set(p.questions).size, 5);
  assert.match(p.text, /## 먼저 물을 질문 다섯\n\n1\. /);
  const t = SP.build({ n: 2, pick: ["terms"], results: RESULTS, term: "EARS" });
  assert.equal(t.questions.length, 5); assert.ok(t.questions[0].includes("EARS")); assert.match(t.name, /EARS/);
  assert.ok(t.text.includes("EARS — "), "그 용어의 풀이가 맨 앞에");
});

test("가린다 — 키 모양은 [비밀값], 무엇을 가렸는지 종류만(값은 다시 보이지 않는다)", () => {
  const leaky = { 1: { ...RESULTS[1], items: [{ name: "a", lines: [`키 ${"sk-" + "q".repeat(24)} · 메일 minji@example.com`] }] } };
  const p = SP.build({ n: 1, pick: ["mine"], results: leaky, scan: S.scan, hide: S.redact });
  assert.ok(!p.text.includes("qqqq") && !p.text.includes("minji@"));
  assert.deepEqual(p.masked.sort(), ["이메일", "키·토큰 모양"].sort());
  assert.ok(!p.masked.join(" ").includes("qqqq"));
  assert.deepEqual(SP.build({ n: 1, pick: ["stage"], results: RESULTS, scan: S.scan, hide: S.redact }).masked, []);
});

test("파일 이름은 안전한 글자만 · 안내 한 장은 '직접 올린다' — Floe는 보내지 않는다고 말한다", () => {
  const p = SP.build({ n: 0, pick: ["stage"], results: RESULTS, term: "../../etc 비밀" });
  assert.match(p.file, /^study-pack-1[\w.-]*\.md$/);
  assert.ok(SP.GUIDE.length >= 3 && SP.GUIDE.length <= 5);
  assert.ok(SP.GUIDE.some((x) => /직접|내가/.test(x)) && SP.GUIDE.some((x) => /보내지 않/.test(x)));
});

test("화면 — 용어 풀이 · 관문의 '어디가 헷갈렸나요?' 뒤에 '더 공부하기', 책 탭에 공부 묶음 판(고르기 · 질문 · 받기 · 안내 · 가린 것)", () => {
  const read = (p) => fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator", p), "utf8");
  const views = read("app/10-views.js"), feed = read("app/20-feed.js"), lib = read("app/60-library.js"), html = read("index.html");
  assert.match(views, /data-act="study-open" data-term="\$\{esc\(t\)\}"/);
  assert.match(feed, /\{ label: "더 공부하기", act: "study-open", kind: "ghost" \}/);
  assert.match(lib, /function studyBox\(\)/);
  for (const a of ["study-open", "study-pick", "study-get", "study-close"]) assert.match(lib, new RegExp(`"${a}": `), a);
  assert.ok(html.indexOf("navigator/studypack.js") > html.indexOf("navigator/gateplan.js") && html.indexOf("navigator/studypack.js") < html.indexOf('<script src="app.js"'));
});
