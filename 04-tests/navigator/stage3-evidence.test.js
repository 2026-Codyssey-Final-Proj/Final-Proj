// claude-drafted: 2026-10-25 — C-39 3단계 초안 · 누가 정했는지 · 공식 문서 증빙(이재엽 "2단계까지 오면서 작업들을 구체화 했는데 3단계에서 … 지금까지 준비한 내용들을 초안들로 해서 정리해서
//   무엇들을 준비해야하는지 생각해서 초안들 보여줘 · 깃허브에 … PRD처럼 공식문서들로 … 어떻게 증빙해서 관리될 수 있는지 · 도전과제에서 1단계 2단계에 맞춰진 다이어그램으로 너가 어떻게 넣고
//   어떤 부분을 했는지 이어져서" · 버튼 넷 — 할 일 초안 + 준비할 것 / 증빙 칸 + 기획서 + 결정 기록 / 2단계부터 관문마다 / 흐름 + 칸마다 재료까지). 코드보다 먼저 썼다(code.md 1번). AI는 부르지 않는다.
// 실행: node --test 04-tests/navigator/stage3-evidence.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const Q = require("../../03-backend/navigator/quest.js");
const D = require("../../03-backend/navigator/docs.js");

const S0 = { stage: 0, items: N.STAGES[0].criteria.map((c, i) => ({ name: c.text, lines: [["행사 신청을 종이로 받아 헷갈려요", "신청이 한곳에 모여요", "쓰는 사람: 소수 — 아는 몇 사람이 써요", "크기: 보통"][i]] })) };
const S1 = { stage: 1, items: N.criteriaFor(1, "Xpress").map((c, i) => ({ name: c.text, lines: [`2단계 줄 ${i + 1}`] })) };
const answer3 = (tier, over = {}) => ({ items: N.criteriaFor(2, tier).map((c, i) => ({ text: `${c.text}의 초안`, from: i === 0 ? ["1-1", "2-3"] : [] })), prep: ["기능 개수 세기", "숫자로 정할 말 찾기"], say: "3단계 초안이에요", ...over });

test("초안을 만드는 단계: 2단계와 3단계(코드 1 · 2)도 — 4단계부터는 C-40(stages-all.test.js)", () => {
  assert.ok(N.DRAFT_STAGES.includes(1) && N.DRAFT_STAGES.includes(2));
});

test("3단계 초안 요청문: 받은 글과 지난 단계 결과 전부(1 · 2단계)를 번호([1-1] …)를 붙여 싸서 넘긴다 · 3단계 할 일 순서대로 · 준비할 것 · 칸마다 재료(from)를 묻는다", () => {
  const p = N.stageDraftPrompt(2, "Full", { idea: "동아리 행사 신청 앱", prev: [S0, S1] });
  for (const s of ["<받은글>", "<지난단계결과>", "[1-1]", "[2-3]", "행사 신청을 종이로 받아 헷갈려요", "2단계 줄 3", N.FLORO_VOICE, ...N.criteriaFor(2, "Full").map((c) => c.text)]) assert.ok(p.includes(s), s);
  assert.match(p, /준비할 것/); assert.match(p, /from/); assert.match(p, /지어내지 않는다/);
  assert.ok(!/경량.*상세.*안 함/.test(p), "3단계에는 기획서 칸이 없다");
});

test("초안 모양: 칸마다 글 · 재료(from), 준비할 것(prep) 0~3줄, 한마디", () => {
  assert.deepEqual([...N.STAGE_DRAFT_SCHEMA.required].sort(), ["items", "prep", "say"]);
  assert.ok(["from", "text"].every((k) => N.STAGE_DRAFT_SCHEMA.properties.items.items.required.includes(k)), "칸마다 글 · 재료(C-40에서 예시 alts가 더해짐)");
  assert.equal(N.STAGE_DRAFT_SCHEMA.properties.prep.maxItems, 3);
});

test("3단계 초안 읽기: 재료는 넘긴 지난 단계의 칸만({s, i} — 0부터), 같은 것 · 없는 칸 · 지금 단계는 버린다 · 준비할 것은 세 줄 · 짧게 · 빠지면 빈 목록", () => {
  const r = N.parseStageDraft(answer3("Full"), 2, "Full", [S0, S1]);
  assert.equal(r.items.length, 5);
  assert.deepEqual(r.items[0], { text: "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기의 초안", from: [{ s: 0, i: 0 }, { s: 1, i: 2 }] });
  assert.deepEqual(r.prep, ["기능 개수 세기", "숫자로 정할 말 찾기"]); assert.equal(r.say, "3단계 초안이에요");
  const messy = N.parseStageDraft(answer3("Full", { items: answer3("Full").items.map((x, i) => (i === 0 ? { ...x, from: ["1-1", "1-1", "9-9", "3-1", "x", "2-99", "2-1"] } : x)), prep: ["가", "나", "다", "라"] }), 2, "Full", [S0, S1]);
  assert.deepEqual(messy.items[0].from, [{ s: 0, i: 0 }, { s: 1, i: 0 }], "있는 칸만 · 한 번씩");
  assert.equal(messy.prep.length, 3);
  const bare = N.parseStageDraft({ items: N.criteriaFor(2, "Lite").map(() => ({ text: "글" })), say: "한마디" }, 2, "Lite", [S0, S1]);
  assert.deepEqual(bare.prep, []); assert.deepEqual(bare.items[0].from, [], "재료를 안 주면 빈 목록");
  assert.equal(N.parseStageDraft({ ...answer3("Full"), prep: ["가".repeat(500)] }, 2, "Full", [S0, S1]).prep[0].length, 160);
  assert.equal(N.parseStageDraft(answer3("Full"), 8, "Full", [S0, S1]), null, "없는 단계");
});

test("2단계 초안도 같은 틀: 1단계 결과만 넘기고 재료는 [1-n]", () => {
  const p = N.stageDraftPrompt(1, "Xpress", { idea: "앱", prev: [S0] });
  assert.ok(p.includes("[1-4]") && !p.includes("[2-1]"));
  const a = { items: N.criteriaFor(1, "Xpress").map(() => ({ text: "글", from: ["1-2"] })), prep: [], say: "한마디" };
  assert.deepEqual(N.parseStageDraft(a, 1, "Xpress", [S0]).items[0].from, [{ s: 0, i: 1 }]);
});

test("누가 정했나(by): 초안 그대로 = ok · 초안을 고침 = edit · 초안 없이 = me · 고르는 칸은 넘겨준 pick. 공책에서 고쳐도 다시 정한다", () => {
  const base = Q.retitle(Q.makeQuest(N.STAGES[2], N.criteriaFor(2, "Xpress")), "동아리 행사 신청 앱");
  const d = N.parseStageDraft(answer3("Xpress"), 2, "Xpress", [S0, S1]);
  let q = Q.withStageDraft(base, d);
  assert.deepEqual(q.draft.prep, d.prep, "준비할 것도 퀘스트에");
  q = Q.fill(q, 0, Q.draftOf(q, 0));
  q = Q.fill(q, 1, "내가 고친 글");
  assert.deepEqual(q.by.slice(0, 2), ["ok", "edit"]);
  q = Q.setLine(q, 0, 0, "공책에서 고침"); assert.equal(q.by[0], "edit");
  let plain = Q.makeQuest(N.STAGES[2], N.criteriaFor(2, "Xpress")); plain = Q.fill(plain, 0, "직접 쓴 줄"); assert.equal(plain.by[0], "me");
  let one = Q.withDraft(Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full")), Q.EXAMPLE_DRAFT);
  one = Q.fill(one, Q.SIZE_AT, "크기: 보통", "pick"); assert.equal(one.by[Q.SIZE_AT], "pick");
  assert.deepEqual(Q.BY, ["ok", "edit", "me", "pick", "moved", "skip"]); assert.deepEqual(Object.keys(Q.BY_WORD), Q.BY);   // moved · skip — C-56(2026-10-28)
});

test("플로로가 낸 것(proposalOf): 초안 글 · 권한 크기 · 권한 기획서 — 고르는 칸도 무엇을 권했는지 남는다", () => {
  const one = Q.withDraft(Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full")), Q.EXAMPLE_DRAFT);
  assert.equal(Q.proposalOf(one, 0), Q.EXAMPLE_DRAFT.pain);
  assert.match(Q.proposalOf(one, Q.SIZE_AT), /^보통 — /);
  const two = Q.withStageDraft(Q.makeQuest(N.STAGES[1], N.criteriaFor(1, "Full")), Q.exampleStageDraft(1, N.criteriaFor(1, "Full")));
  assert.match(Q.proposalOf(two, 3), /^경량 기획서로/);
  assert.equal(Q.proposalOf(Q.makeQuest(N.STAGES[2], N.criteriaFor(2, "Full")), 0), "", "초안이 없으면 빈 글");
});

test("단계 결과(resultOf): 칸마다 정한 줄 · 누가(by) · 플로로가 낸 것(draft) · 재료(from), 준비할 것(prep) — 없는 것은 넣지 않는다", () => {
  const d = N.parseStageDraft(answer3("Xpress"), 2, "Xpress", [S0, S1]);
  let q = Q.withStageDraft(Q.makeQuest(N.STAGES[2], N.criteriaFor(2, "Xpress")), d);
  q.objs.forEach((_, i) => { q = Q.fill(q, i, i === 0 ? Q.draftOf(q, 0) : `고친 ${i}`); });
  const r = Q.resultOf(q);
  assert.deepEqual(r.items[0], { name: q.objs[0].name, lines: [Q.draftOf(q, 0)], by: "ok", draft: Q.draftOf(q, 0), from: [{ s: 0, i: 0 }, { s: 1, i: 2 }] });
  assert.deepEqual(Object.keys(r.items[1]).sort(), ["by", "draft", "lines", "name"], "재료가 없으면 from을 넣지 않는다");
  assert.deepEqual(r.prep, d.prep);
  let plain = Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full")); plain = Q.fill(plain, 0, "줄");
  assert.deepEqual(Q.resultOf(plain).items[0], { name: plain.objs[0].name, lines: ["줄"], by: "me" });
  assert.equal(Q.resultOf(plain).prep, undefined);
});

test("3단계 짧은 이름 · 연습 예시 초안(등급마다 개수 · 순서, 재료 · 준비할 것, 쉬운 말)", () => {
  assert.deepEqual(N.criteriaFor(2, "Full").map((c) => Q.shortOf(c.text)), ["기능 문장", "숫자로", "꼭 · 있으면 좋음", "나온 곳 잇기", "막을 일"]);
  for (const tier of N.TIERS) for (const n of [1, 2]) {
    const ex = Q.exampleStageDraft(n, N.criteriaFor(n, tier));
    assert.equal(ex.items.length, N.criteriaFor(n, tier).length, `${n} ${tier}`); assert.ok(ex.prep.length >= 1 && ex.prep.length <= 3);
    assert.ok(ex.items.every((x) => Array.isArray(x.from)));
  }
  const words = JSON.stringify([Q.exampleStageDraft(2, N.criteriaFor(2, "Full")), Q.BY_WORD]);
  for (const j of N.JARGON) assert.ok(!words.includes(j), j);
});

// ── 공식 문서(docs.js) — 증빙 칸 + 기획서 + 결정 기록 ──
const ok = (name, line, extra = {}) => ({ name, lines: [line], by: "ok", draft: line, ...extra });
const RESULTS = {
  0: { title: "동아리 행사 신청 앱", at: "2026-10-25", passed: "2026-10-25",
    items: [ok(N.STAGES[0].criteria[0].text, "행사 신청을 종이로 받아 헷갈려요"), { name: N.STAGES[0].criteria[1].text, lines: ["신청이 한곳에 모여요"], by: "edit", draft: "신청이 모여요" },
      { name: N.STAGES[0].criteria[2].text, lines: ["쓰는 사람: 소수"], by: "pick" }, { name: N.STAGES[0].criteria[3].text, lines: ["크기: 보통"], by: "pick", draft: "보통 — 흔한 방법" }],
    check: N.STAGES[0].criteria.map((c) => ({ text: c.text, met: true, evidence: `${c.text}: 적음` })) },
  1: { title: "동아리 행사 신청 앱", at: "2026-10-25", passed: "2026-10-26", prep: ["1단계 불편을 다시 읽기"],
    items: N.criteriaFor(1, "Xpress").map((c, i) => ok(c.text, `2단계 줄 ${i + 1}${i === 0 ? " | 표를 깨는 글" : ""}`, i === 0 ? { from: [{ s: 0, i: 0 }] } : {})),
    check: N.criteriaFor(1, "Xpress").map((c) => ({ text: c.text, met: true, evidence: "적음" })) },
  2: { title: "동아리 행사 신청 앱", at: "2026-10-26", prep: ["기능 개수 세기"],
    items: N.criteriaFor(2, "Xpress").map((c, i) => ({ name: c.text, lines: [`3단계 줄 ${i + 1}`], by: i ? "me" : "ok", ...(i ? {} : { draft: "3단계 줄 1", from: [{ s: 1, i: 2 }] }) })),
    check: N.criteriaFor(2, "Xpress").map((c, i) => ({ text: c.text, met: i !== 1, evidence: i !== 1 ? "적음" : "" })) },
};
const files = () => D.files({ topic: "동아리 행사 신청 앱", idea: "동아리 행사 신청을 받는 앱을 만들고 싶어요", results: RESULTS });
const get = (p) => files().find((x) => x.path === p).text;

test("공식 문서 묶음: 단계 문서 · docs/PRD.md(기획서) · docs/decisions.md(결정 기록) — 기획서 · 결정 기록도 표시 사이 절만(내 글은 그대로), 3단계 문서는 그 결과 md", () => {
  const f = files(), paths = f.map((x) => x.path);
  for (const p of ["docs/PRD.md", "docs/decisions.md", "docs/03-requirements/requirements.md", "docs/04-design/README.md"]) assert.ok(paths.includes(p), p);
  assert.deepEqual(f.filter((x) => x.merge).map((x) => x.path).sort(), ["CLAUDE.md", "README.md", "docs/PRD.md", "docs/README.md", "docs/decisions.md"]);
  const index = get("docs/README.md");
  assert.match(index, /PRD\.md/); assert.match(index, /decisions\.md/);
  assert.match(get("CLAUDE.md"), /docs\/PRD\.md/, "Claude Code는 기획서부터 읽는다");
  assert.ok(D.shipRequest(paths).length < 4000, "넘길 글 상한 안");
});

test("단계 문서의 증빙 칸: 재료(처음 말한 것 · 지난 단계 칸) · 준비할 것 · 칸마다 정한 것과 어떻게(그대로 · 고침과 플로로 초안 · 직접 · 고름) · 확인한 날 · 관문 지난 날 · 완료 기준과 근거", () => {
  const idea = get("docs/01-idea/idea.md");
  assert.match(idea, /## 재료/); assert.ok(idea.includes("동아리 행사 신청을 받는 앱을 만들고 싶어요"), "1단계 재료는 처음 말한 것");
  assert.match(idea, /고침/); assert.ok(idea.includes("신청이 모여요"), "고친 칸은 플로로 초안도 남긴다");
  assert.match(idea, /## 증빙/); assert.match(idea, /2026-10-25/); assert.match(idea, /이해했어요/);
  for (const c of N.STAGES[0].criteria) assert.ok(idea.includes(`${c.text}: 적음`), "완료 기준의 근거");
  const plan = get("docs/02-plan/plan.md");
  assert.match(plan, /이 단계 전에 준비할 것/); assert.ok(plan.includes("1단계 불편을 다시 읽기"));
  assert.match(plan, /재료: 1단계 Ⅰ 불편/, "칸마다 재료를 지난 단계 칸 이름으로");
  assert.ok(plan.includes("../01-idea/idea.md"), "재료 칸의 문서로 잇는다");
  const req = get("docs/03-requirements/requirements.md");
  assert.match(req, /^# 3단계 · 꼭 필요한 기능 정리하기/); assert.match(req, /직접/); assert.match(req, /안 됨|아직/, "못 한 기준은 그렇게");
  assert.ok(!/관문을 지난 날 \| 2026/.test(req), "아직 관문 전이면 날짜를 지어내지 않는다");
});

test("기획서(PRD.md): 처음 말한 것 · 끝낸 단계마다 한 절(문제와 목표 · 아이디어와 범위 · 꼭 필요한 기능) · 단계 상태 표와 문서 링크 · 아직인 단계는 다음에 채울 것", () => {
  const prd = get("docs/PRD.md");
  assert.ok(prd.startsWith(D.MARK_START) && prd.trimEnd().endsWith(D.MARK_END));
  assert.match(prd, /# 기획서/); assert.ok(prd.includes("동아리 행사 신청을 받는 앱을 만들고 싶어요"));
  for (const h of ["문제와 목표", "아이디어와 범위", "꼭 필요한 기능"]) assert.match(prd, new RegExp(`## .*${h}`), h);
  assert.ok(prd.includes("행사 신청을 종이로 받아 헷갈려요") && prd.includes("3단계 줄 1"));
  assert.match(prd, /\(01-idea\/idea\.md\)/); assert.match(prd, /decisions\.md/);
  assert.match(prd, /다음에 채울 것/); assert.match(prd, /4단계 · 만드는 방법 고르기/);
});

test("결정 기록(decisions.md): 칸마다 한 줄(날짜 · 단계 · 할 일 · 플로로 초안 · 정한 것 · 어떻게) + 관문마다 한 줄 — 표를 깨는 글(|)은 막는다", () => {
  const dec = get("docs/decisions.md");
  assert.match(dec, /\| 날짜 \| 단계 \| 할 일 \| 플로로 초안 \| 정한 것 \| 어떻게 \|/);
  const rows = dec.split("\n").filter((l) => /^\| 2026-/.test(l));
  const items = Object.values(RESULTS).reduce((n, r) => n + r.items.length, 0), gates = Object.values(RESULTS).filter((r) => r.passed).length;
  assert.equal(rows.length, items + gates, "칸마다 + 지난 관문마다");
  assert.ok(rows.every((l) => l.split(/(?<!\\)\|/).length === 8), "칸 수가 늘 같다(| 를 가렸다)");
  assert.ok(rows.some((l) => l.includes("관문") && l.includes("2026-10-26")), "관문 지난 날");
  assert.ok(rows.some((l) => /\| 고침 \|$/.test(l)) && rows.some((l) => /\| 직접 \|$/.test(l)) && rows.some((l) => /\| 고름 \|$/.test(l)));
});

test("가림: 처음 말한 것 · 플로로 초안 · 준비할 것 · 근거도 redact로", () => {
  const hide = (t) => String(t).replace(/010-\d{4}-\d{4}/g, "[가림]");
  const r = JSON.parse(JSON.stringify(RESULTS));
  r[0].items[1].draft = "연락 010-1111-2222"; r[1].prep = ["010-3333-4444 확인"]; r[0].check[0].evidence = "010-5555-6666";
  const all = D.files({ topic: "앱", idea: "내 번호 010-7777-8888", results: r, redact: hide }).map((x) => x.text).join("\n");
  for (const n of ["010-1111-2222", "010-3333-4444", "010-5555-6666", "010-7777-8888"]) assert.ok(!all.includes(n), n);
});

test("증빙 전(C-37)에 저장한 결과: 날짜 · 누가가 없으면 '아직'이라고 지어내지 않는다 — '남아 있지 않아요', 다음 단계가 있으면 관문은 지난 것", () => {
  const old = { 0: { items: N.STAGES[0].criteria.map((c) => ({ name: c.text, lines: ["줄"] })) }, 1: { items: N.criteriaFor(1, "Lite").map((c) => ({ name: c.text, lines: ["줄"] })) } };
  const f = D.files({ topic: "앱", results: old }), idea = f.find((x) => x.path === "docs/01-idea/idea.md").text;
  assert.match(idea, /\| 칸을 다 확인한 날 \| 남아 있지 않아요/); assert.match(idea, /\| 관문을 지난 날 \| 지났어요 — 날짜는 남아 있지 않아요/); assert.match(idea, /\| 누가 정했나 \| 남아 있지 않아요/);
  assert.match(f.find((x) => x.path === "docs/02-plan/plan.md").text, /\| 관문을 지난 날 \| 아직/, "마지막 단계는 정말 아직일 수 있다");
  assert.match(f.find((x) => x.path === "docs/PRD.md").text, /\| 1단계 · 무엇을 만들지 정하기 \| 끝냄 \|/);
});

test("리뷰(2026-10-25): 공책에서 고른 칸을 다듬어도 고름 그대로 · 줄을 다 지우면 누가 정했나도 지운다", () => {
  let one = Q.withDraft(Q.makeQuest(N.STAGES[0], N.criteriaFor(0, "Full")), Q.EXAMPLE_DRAFT);
  one = Q.fill(one, Q.SIZE_AT, "크기: 보통", "pick");
  one = Q.setLine(one, Q.SIZE_AT, 0, "크기: 보통 — 알림까지만");
  assert.equal(one.by[Q.SIZE_AT], "pick", "고른 것을 다듬어도 고름");
  one = Q.fill(one, 0, Q.EXAMPLE_DRAFT.pain);
  one = Q.setLine(one, 0, 0, "");
  assert.deepEqual(one.lines[0], []); assert.equal(one.by[0], null, "줄이 없으면 누가도 없다");
  assert.equal(Q.resultOf(one).items[0].by, undefined);
});

test("리뷰(2026-10-25): 받은 글 안의 표시(<!-- floe:end -->)는 지운다 — 다시 올려도 기획서가 불어나지 않는다 · 표 칸의 \\ 도 막는다", () => {
  const r = JSON.parse(JSON.stringify(RESULTS)); r[0].items[0].lines = ["끝 <!-- floe:end --> 꼬리"]; r[1].items[1].lines = ["a\\|b"];
  const f1 = D.files({ topic: "앱", idea: "처음 <!-- floe:start --> 말", results: r });
  const prd = f1.find((x) => x.path === "docs/PRD.md").text;
  assert.equal(prd.split("floe:end").length, 2, "표시는 절의 끝 하나만"); assert.equal(prd.split("floe:start").length, 2);
  const once = D.mergeSection("", prd), twice = D.mergeSection(once, prd);
  assert.equal(twice.length, once.length, "두 번 올려도 길이가 같다");
  const row = f1.find((x) => x.path === "docs/decisions.md").text.split("\n").find((l) => l.includes("a\\\\"));
  assert.ok(row && row.split(/(?<!\\)\|/).length === 8, `표 칸 수 그대로: ${row}`);
});
