// claude-drafted: 2026-10-18 — 수용 테스트(이슈 #17). 이재엽(팀장) 요청으로 Claude가 썼고, 담당 두승현이 검토한다.
// 무엇: 요구(FR)의 Given-When-Then 시나리오 가운데 브라우저·네트워크 없이 순수 코드로 돌릴 수 있는 것 — 시연 화면(내비게이터)의 흐름.
//   시나리오 전체와 사람이 화면으로 볼 것은 같은 폴더의 README.md에 있다. 시험 이름 앞의 FR 번호가 README의 행과 짝이다.
// 단위 시험(04-tests/navigator 등)이 이미 보는 것은 다시 쓰지 않는다. 여기서는 사용자가 겪는 순서대로 장면을 잇는다.
// 할 일 개수·문장은 적어 두지 않는다 — 단계 표(STAGES)와 연습 예시(scenario.js)에서 그때그때 읽는다(단계 할 일은 바뀌는 중이다).
// 실행: node --test 04-tests/acceptance/demo-flow.test.js  (전체는 python3 04-tests/run_all_tests.py)
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Nav = require("../../03-backend/navigator/navigator.js");
const S = require("../../03-backend/navigator/scenario.js");
const Share = require("../../03-backend/share/share-rules.js");
const ROOT = path.join(__dirname, "../..");

// ── 화면(02-frontend/navigator/app.js)이 하는 일을 순수 함수만으로 따라 한다 ──
const NS = Nav.STAGES.map((s) => s.n);
const metOf = (j) => j.criteria.map((c) => c.met);
const allMet = (j) => metOf(j).every(Boolean);
// 살펴보기: 지금 단계(코드가 정한다)의 연습 응답을 찾고, 모양을 확인해 쓴다 (app.js judge)
const look = (text, n) => { const raw = S.judgeFixture(text, n); return raw && Nav.parseJudgement(raw, text, n); };
// 그 단계의 연습 버튼 장면들, 첫 장면(주소 #ex=<n>이 여는 것)
const shown = (n) => S.examples.filter((e) => !e.hidden && e.judgement.stage === n);
const startOf = (n) => { const e = shown(n)[0]; return { text: e.text, j: look(e.text, n) }; };
// "골라 주세요"에서 하나 고르면 작업 글에 한 줄이 붙는다 (app.js decide)
const choose = (text, j, i) => `${text.trim()}\n${Nav.decisionLine(j.next.question, j.next.options[i])}`;
// 사용자가 그 단계에서 보여 줄 수 있는 글 — 연습 글, 연습 글 + 고른 줄
function textsOf(n) {
  const out = [];
  for (const e of shown(n)) {
    out.push(e.text);
    const j = look(e.text, n);
    if (j) j.next.options.forEach((_, i) => out.push(choose(e.text, j, i)));
  }
  return out;
}
// 그 단계를 "다 했어요"로 만드는 글과 판정
function finishOf(n) {
  for (const text of textsOf(n)) { const j = look(text, n); if (j && allMet(j)) return { text, j }; }
  return null;
}
// "예" 뒤 다음 단계에 막 들어온 상태 — 할 일은 모두 아직 (app.js advance)
const enter = (n) => ({ stage: n, reason: "", next: null,
  criteria: Nav.STAGES[n].criteria.map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })) });

// ── FR-10 · UC-01 기본 흐름 전체 ──
test("FR-10 · 서버·네트워크 없이 연습 예시만으로 0단계부터 마지막 단계 마무리까지 간다 (아니요 한 번 → 예)", () => {
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls += 1; throw new Error("시연은 네트워크를 쓰지 않는다"); };
  const passed = [];
  try {
    assert.equal(S.first.judgement.stage, NS[0], "시연은 첫 단계에서 시작한다");
    for (let n = NS[0]; Nav.STAGES[n]; n += 1) {
      if (n > NS[0]) assert.equal(Nav.canAdvance(metOf(enter(n)), "yes"), false, `${n}단계에 막 들어오면 아직 넘어갈 수 없다`);
      const start = startOf(n);
      assert.ok(start.j && start.j.stage === n, `${n}단계 첫 장면을 살펴본다`);
      assert.equal(Nav.canAdvance(metOf(start.j), "yes"), false, `${n}단계 첫 장면은 하는 중`);
      const done = finishOf(n);
      assert.ok(done, `${n}단계를 연습 예시만으로 다 할 수 있다`);
      // 넘어가기 전 확인: 아니요 → 헷갈린 곳 고르기 → 미리 만든 답 → 다시 묻기 → 예
      assert.equal(Nav.canAdvance(metOf(done.j), "no"), false, `${n}단계: '아니요'면 그 자리`);
      assert.ok(Nav.filled((S.answers[n] || [])[0]), `${n}단계: 헷갈린 곳의 답이 있다`);
      assert.equal(Nav.canAdvance(metOf(done.j), "yes"), true, `${n}단계: 다 하고 '예'면 넘어간다`);
      passed.push(n);
    }
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.deepEqual(passed, NS, "모든 단계를 차례로 지났다");
  assert.equal(calls, 0, "네트워크를 한 번도 부르지 않았다");
});

test("FR-10 · 판정 규칙과 연습 예시는 다른 파일·네트워크를 부르지 않는다", () => {
  for (const f of ["03-backend/navigator/navigator.js", "03-backend/navigator/scenario.js"]) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    const reqs = [...src.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
    assert.deepEqual(reqs.filter((r) => r !== "./navigator.js"), [], `${f}: 판정 규칙 밖의 모듈`);
    assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|WebSocket|EventSource/, f);
  }
});

test("FR-10 · 시연 페이지는 저장소 안의 파일만 불러온다 — 외부 주소(CDN·글꼴·API)가 없고, 부르는 파일은 모두 있다", () => {
  const pages = ["02-frontend/index.html", "02-frontend/navigator/index.html", "02-frontend/library/index.html",
    "02-frontend/library/sky.html", "02-frontend/share/index.html"];
  for (const p of pages) {
    const html = fs.readFileSync(path.join(ROOT, p), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']*)["']/g)].map((m) => m[1]);
    assert.ok(refs.length > 0, p);
    assert.deepEqual(refs.filter((r) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(r) && !r.startsWith("data:")), [], `${p}: 밖의 주소`);
    for (const r of refs) {
      const file = r.split(/[#?]/)[0];
      if (file) assert.ok(fs.existsSync(path.join(ROOT, path.dirname(p), file)), `${p}: 없는 파일 ${r}`);
    }
  }
});

// ── FR-1 ──
test("FR-1 · 단계마다 첫 장면에서 지금 단계 하나와 지금 할 일 하나가 정해진다", () => {
  for (const n of NS) {
    const { j } = startOf(n);
    const t = Nav.ticker(j, null, "");
    assert.equal(j.stage, n, `${n}단계`);
    assert.ok(Nav.filled(t.now), `${n}단계: 지금 할 일`);
    assert.equal(t.now, j.next.what, `${n}단계: 지금 할 일은 하나`);
    assert.notEqual(t.after, t.now, `${n}단계: 그다음은 지금 할 일과 다르다`);
  }
});

// ── FR-2 ──
test("FR-2 · 단계마다 그 단계의 할 일이 모두 보이고, '했다'인 것에만 작업 글에서 따온 구절이 붙는다", () => {
  const squash = (t) => String(t).replace(/\s+/g, " ");
  for (const n of NS) {
    const { text, j } = startOf(n);
    assert.equal(j.criteria.length, Nav.STAGES[n].criteria.length, `${n}단계: 할 일 개수는 단계 표와 같다`);
    assert.ok(j.criteria.some((c) => !c.met), `${n}단계 첫 장면에는 아직 안 한 일이 있다`);
    for (const c of j.criteria) {
      if (c.met) assert.ok(c.evidence && squash(text).includes(c.evidence), `${n}단계 '${c.text}': 근거 구절`);
      else assert.equal(c.evidence, "", `${n}단계 '${c.text}': 안 한 일에는 근거가 없다`);
    }
  }
});

test("FR-2 · 단계를 건너뛸 수 없다 — 다른 단계의 작업 글을 보여 줘도 지금 단계로는 살펴보지 않는다", () => {
  for (const n of NS) {
    for (const m of NS) {
      if (m === n) continue;
      for (const text of textsOf(m)) assert.equal(S.judgeFixture(text, n), null, `${n}단계에서 ${m}단계 글`);
    }
  }
});

// ── FR-3 ──
test("FR-3 · 설계도 한 바퀴: 빈칸을 하나씩 고쳐 쓰면 '고칠 곳'이 그만큼 줄고, 다 채워야 확정해도 된다고 한다", () => {
  const docStages = Nav.STAGES.filter((s) => s.doc).map((s) => s.n);
  assert.ok(docStages.length > 0, "설계도가 있는 단계가 있다");
  for (const n of docStages) {
    const d = S.drafts[n];
    assert.ok(d, `${n}단계 연습 초안`);
    let doc = d.draft, left = Nav.blanks(doc).length;
    assert.ok(left > 0, `${n}단계: 초안은 모르는 자리를 빈칸으로 둔다`);
    while (left > 0) {
      const r = Nav.parseReview(S.reviewFixture(doc, n));
      assert.equal(r.ready, false, `${n}단계: 빈칸 ${left}개`);
      assert.equal(r.fix.length, Math.min(left, 3), `${n}단계: 고칠 곳은 남은 빈칸(최대 3개)`);
      doc = doc.replace(/\[채워 주세요:[^\]]*\]/, "직접 정함");   // 사용자가 빈칸 하나를 고쳐 쓴다
      left -= 1;
      assert.equal(Nav.blanks(doc).length, left);
    }
    const r = Nav.parseReview(S.reviewFixture(doc, n));
    assert.deepEqual([r.ready, r.fix.length], [true, 0], `${n}단계: 다 채움`);
  }
});

// ── FR-4 · FR-5 ──
test("FR-4 · 넘어가기 전 확인의 그림(받은 것 → 한 일 → 만든 것) 세 칸이 모든 단계에 채워져 있다", () => {
  for (const s of Nav.STAGES) for (const k of ["gets", "does", "gives"]) assert.ok(Nav.filled(s[k]), `${s.n}단계 ${k}`);
});

test("FR-4·5 · 모든 단계에서 할 일을 다 해도 '예'가 아니면 넘어가지 않는다 — '아니요'·아직 안 물음이면 그 자리", () => {
  for (const n of NS) {
    const { j } = finishOf(n);
    for (const u of ["no", null, undefined]) assert.equal(Nav.canAdvance(metOf(j), u), false, `${n}단계: ${u}`);
    assert.equal(Nav.canAdvance(metOf(j), "yes"), true, `${n}단계: 예`);
  }
});

test("FR-5 · '아니요' 뒤: 어느 할 일을 헷갈렸다고 골라도 미리 만든 답이 있고, 한 장 요약에 다음 단계(또는 마무리)가 있다", () => {
  for (const s of Nav.STAGES) {
    s.criteria.forEach((c, i) => assert.ok(Nav.filled((S.answers[s.n] || [])[i]), `${s.n}단계 '${c.text}'의 답`));
    const nx = Nav.STAGES[s.n + 1];
    if (nx) assert.ok(Nav.filled(nx.title) && Nav.filled(nx.does), `${s.n}단계 요약의 다음 단계`);
    else assert.equal(s.n, NS[NS.length - 1], "다음 단계가 없는 것은 마지막 단계뿐");
  }
});

// ── FR-12 ──
test("FR-12 · '예' 뒤 다음 단계 할 일의 순서를 사용자가 바꾸면, 지금 할 일은 사용자가 맨 위에 둔 것이다", () => {
  for (const n of NS.slice(0, -1)) {
    const nx = Nav.STAGES[n + 1], original = nx.criteria.map((c) => c.text);   // app.js ACT.yes
    let todos = original.slice();
    const picked = todos[todos.length - 1];
    for (let i = todos.length - 1; i > 0; i -= 1) todos = Nav.reorder(todos, i, -1);   // 맨 아래 것을 맨 위로 올린다
    assert.equal(todos[0], picked, `${nx.n}단계`);
    assert.deepEqual([...todos].sort(), [...original].sort(), `${nx.n}단계: 빠지거나 늘어난 할 일이 없다`);
    const t = Nav.ticker(enter(nx.n), todos, "");
    assert.equal(t.now, picked, `${nx.n}단계: 지금 할 일`);
    if (todos.length > 1) assert.equal(t.after, todos[1], `${nx.n}단계: 그다음`);
  }
});

// ── FR-9 (AI로 보내기 전 검사 — UC-01 1번·E3) ──
test("FR-9 · 연습 예시 글과 연습 초안은 보내기 전 검사에 걸리지 않는다 — 시연 중 잘못된 경고가 뜨지 않는다", () => {
  const texts = [...NS.flatMap(textsOf), ...Object.values(S.drafts).map((d) => d.draft)];
  assert.ok(texts.length > NS.length);
  for (const t of texts) {
    const hits = Share.scan(t).findings.filter((f) => f.severity !== "warn");   // 화면이 멈추고 묻는 것: 막힘·가림
    assert.deepEqual(hits.map((f) => f.label), [], t.split("\n")[0]);
  }
});

test("FR-9 · 연습 글에 키 모양과 전화번호를 붙이면 보내기 전에 걸리고, 가린 글에는 그 값이 다시 나오지 않는다", () => {
  const key = "sk-" + "a".repeat(24), phone = "010-1234-5678";
  const text = `${S.first.text}\n열쇠 ${key}\n연락처 ${phone}`;
  const r = Share.scan(text);
  assert.equal(r.blocked, true, "키 모양이 있으면 막힌다");
  assert.deepEqual([...new Set(r.findings.filter((f) => f.severity !== "warn").map((f) => f.type))].sort(), ["phone", "secret"]);
  const shownText = Share.redact(text);
  assert.ok(!shownText.includes(key) && !shownText.includes(phone), "값을 다시 보이지 않는다");
  assert.ok(shownText.startsWith(S.first.text), "나머지 글은 그대로");
});
