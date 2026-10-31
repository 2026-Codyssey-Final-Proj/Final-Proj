// claude-drafted: 2026-10-30 — 이재엽 "퀘스트 내용에서 내용들이 너무 긴 상황을 해결해줘"(버튼: 섬의 퀘스트 카드 · AI가 만든 퀘스트 글 · 초안 카드).
// AI에게 말한 길이와 서버가 자르는 길이를 한 묶음(SHORT)으로 맞추고 짧게, 자를 때는 낱말 사이에서 '…'. 섬 카드에서 되풀이되는 안내 줄은 뺀다.
// 실행: node --test 04-tests/navigator/quest-short.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const N = require("../../03-backend/navigator/navigator.js");
const QU = require("../../03-backend/navigator/quest.js");

const S = N.LEN;
const long = (w, n = 40) => Array.from({ length: n }, () => w).join(" ");   // 낱말이 이어진 긴 글

test("길이 한 묶음 — 칸 이름 20 · 묻는 말 60 · 끝 조건 40 · 초안 한 줄 100 · 다른 예시 70 · 준비할 것 30", () => {
  assert.deepEqual({ title: S.title, ask: S.ask, done: S.done, line: S.line, alt: S.alt, prep: S.prep }, { title: 20, ask: 60, done: 40, line: 100, alt: 70, prep: 30 });
});

test("fit — 짧으면 그대로, 길면 그 길이 안에서 낱말 사이로 자르고 '…'", () => {
  assert.equal(N.fit("짧은 글", 10), "짧은 글");
  const t = N.fit(long("신청을"), 20);
  assert.ok(t.length <= 20 && t.endsWith("…"), t);
  assert.ok(!/신청…|신…|청…/.test(t), "낱말 중간에서 끊지 않는다");
  assert.equal(N.fit("가".repeat(50), 10), `${"가".repeat(9)}…`, "띄어쓰기가 없으면 글자에서");
  assert.equal(N.fit("", 10), "");
  assert.equal(N.fit("가".repeat(10), 10), "가".repeat(10), "딱 n자면 그대로");
  assert.equal(Array.from(N.fit("가".repeat(11), 10)).length, 10, "n+1자면 n자로");
  assert.equal(N.fit("😀".repeat(6), 4), "😀😀😀…", "이모지를 반으로 자르지 않는다");
  assert.equal(N.fit("—".repeat(9), 3), "——…", "다 지워질 글이면 글자에서");
});

test("2 ~ 8단계 초안 — 칸 이름 · 묻는 말 · 끝 조건 · 한 줄 · 다른 예시 · 준비할 것이 모두 정한 길이 안", () => {
  const stage = 3, todo = N.criteriaFor(stage, "Full");
  const o = { say: long("좋아요"), prep: [long("준비"), long("세기")], items: todo.map((c) => (c.term === "PRD"
    ? { text: `키운다 — ${long("까닭")}` }
    : { text: long("예시를"), alts: [long("다른 길"), long("또 다른")], title: long("이름"), ask: long("물어요"), done: long("끝나요") })) };
  const d = N.parseStageDraft(o, stage, "Full", []);
  assert.ok(d, "읽힌다");
  for (const it of d.items.filter((x) => x.text)) {
    assert.ok(it.text.length <= S.line, `한 줄 ${it.text.length}`);
    for (const a of it.alts || []) assert.ok(a.length <= S.alt, `다른 예시 ${a.length}`);
    if (it.title) assert.ok(it.title.length <= S.title, `이름 ${it.title.length}`);
    assert.ok(it.ask.length <= S.ask && it.done.length <= S.done, `${it.ask.length} · ${it.done.length}`);
  }
  for (const p of d.prep) assert.ok(p.length <= S.prep, `준비 ${p.length}`);
  assert.ok(d.say.length <= S.say);
});

test("1단계 초안 · 퀘스트 만들기 · 대화 정리도 정한 길이 안", () => {
  const st = N.parseStart({ topic: long("앱"), pain: long("불편해요"), change: long("달라져요"), who: long("회원"), size: "medium", sizeWhy: long("까닭") });
  assert.ok(st.pain.length <= S.pain && st.change.length <= S.change && st.who.length <= S.who && st.sizeWhy.length <= S.sizeWhy, JSON.stringify(st));
  const todo = N.criteriaFor(0, "Full");
  const q = N.parseQuest({ desc: long("설명"), why: long("까닭"), qa: todo.map(() => ({ question: long("물어요"), examples: [long("예시")] })) }, 0, "Full");
  assert.ok(q.desc.length <= S.desc && q.why.length <= S.why, `${q.desc.length} · ${q.why.length}`);
  for (const x of q.qa) { assert.ok(x.question.length <= S.ask); for (const e of x.examples) assert.ok(e.length <= S.example); }
  const c = N.parseChat({ reply: long("답해요"), slots: [{ i: 1, text: long("적어요") }] }, 0, "Full", []);
  assert.ok(c.slots[0].text.length <= S.line, `${c.slots[0].text.length}`);   // 대화 답은 일반 대화도 같이 써서 그대로(400)
});

test("AI에게도 같은 길이를 말한다 — 요청문에 그 숫자와 '짧게' 한 줄", () => {
  const p1 = N.startPrompt("동아리 행사 신청 앱");
  assert.match(p1, new RegExp(`${S.pain}자 안쪽`)); assert.match(p1, new RegExp(`${S.who}자 안쪽`)); assert.ok(p1.includes(N.SHORT_RULE));
  const p2 = N.stageDraftPrompt(3, "Full", { idea: "앱" });
  for (const k of ["title", "ask", "done", "line", "alt", "prep"]) assert.match(p2, new RegExp(`${S[k]}자 안쪽`), k);
  assert.ok(p2.includes(N.SHORT_RULE));
  const p3 = N.questPrompt(0, "앱", "Full");
  assert.match(p3, new RegExp(`${S.ask}자 안쪽`)); assert.match(p3, new RegExp(`${S.example}자 안쪽`)); assert.ok(p3.includes(N.SHORT_RULE));
});

test("연습 예시 글은 새 길이 안에 다 들어간다(잘리지 않는다)", () => {
  const E = QU.EXAMPLE_DRAFT;
  assert.ok(E.pain.length <= S.pain && E.change.length <= S.change && E.who.length <= S.who && E.sizeWhy.length <= S.sizeWhy);
  let prev = [];
  for (let n = 0; n < N.STAGES.length; n++) {
    const cr = N.criteriaFor(n, "Full"), d = QU.exampleStageDraft(n, cr, prev);
    if (d) {
      for (const it of d.items || []) { if (it.text) assert.ok(it.text.length <= S.line, `${n} ${it.text}`); for (const a of it.alts || []) assert.ok(a.length <= S.alt, a); }
      for (const p of d.prep || []) assert.ok(p.length <= S.prep, p);
    }
    prev.push({ stage: n, items: cr.map((c) => ({ name: c.text, lines: ["x"] })) });
  }
});

test("섬의 퀘스트 카드 — '아래 칸에 한 줄 적고 보내기를 눌러요'를 되풀이하지 않는다(묻는 말 · 입력 칸이 이미 말한다)", () => {
  const src = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app/40-quest.js"), "utf8");
  assert.ok(!src.includes("아래 칸에 한 줄 적고 보내기를 눌러요"));
});

test("③ 한 장 카드 — 플로로가 만드는 초안 칸 다섯은 각 100자 안(사람이 고쳐 쓰는 칸은 전처럼 300자까지 받는다)", () => {
  const SH = require("../../03-backend/navigator/sheet.js");
  const mats = [{ k: "chat", t: long("처음에") , c: 1 }, { k: "report", t: long("보고했어요"), c: 3 }, { k: "feed", t: long("먹였어요"), c: 2 }];
  const d = SH.draft({ title: long("단계"), mats, cells: Array.from({ length: 5 }, (_, i) => ({ name: long("칸이름"), line: long("적은줄") })), terms: [long("용어")], files: Array.from({ length: 9 }, (_, i) => `docs/긴-파일-이름-${i}.md`), next: long("다음에") }, { redact: (t) => t });
  for (const [k] of SH.FIELDS) assert.ok(d[k].length <= SH.DRAFT_MAX, `${k} ${d[k].length}`);
  const d2 = SH.draft({ title: "3단계", mats: [{ k: "approve", t: "허용 Bash", c: 3 }, { k: "approve", t: "거절 Write", c: 1 }, { k: "report", t: long("보고"), c: 2 }, { k: "feed", t: "코드", c: 1 }], cells: [{ name: "기능 문장", line: long("적은줄") }] }, { redact: (t) => t });
  assert.match(d2.decided, /허락 결정 — 허용 3 · 거절 1/, "뒤쪽 부분도 남는다(몫을 나눠 자름)");
  assert.match(d2.did, /먹인 글 — 코드 1/);
  assert.equal(SH.DRAFT_MAX, 100);
  assert.ok(SH.FIELD_MAX >= 300, "고쳐 쓴 칸은 그대로");
});

test("서버 · 폴더에서 되읽을 때 받는 상한은 그대로 — 예전 기록 · 사람이 쓴 문서가 막히거나 잘리지 않게(AI에게 말하는 길이와 따로)", () => {
  assert.equal(N.PREP_LINE, 160); assert.equal(N.ALT_LINE, 150);
  assert.ok(N.LEN.prep < N.PREP_LINE && N.LEN.alt < N.ALT_LINE);
});

test("준비된 퀘스트 카드(/api/prepare) · 2단계 기획서 칸의 까닭도 짧게, 전문 용어 이름은 자르기 전 원문으로 거른다", () => {
  const o = { say: long("한마디"), items: N.PREPARE_STAGES.map((n) => ({ stage: n + 1, title: n === 2 ? "Planguage로 숫자 확정하기 위한 단계" : long("이름"), think: long("생각"), act: long("행동"), from: "" })) };
  const r = N.parsePrepare(o);
  for (const n of N.PREPARE_STAGES) { const c = r.cards[n]; assert.ok(c.title.length <= S.title && c.think.length <= S.line && c.act.length <= S.line, JSON.stringify(c)); }
  assert.equal(r.cards[2].title, "", "전문 용어 이름은 비움");
  assert.ok(r.say.length <= S.say);
  const p = N.preparePrompt("Xpress", { idea: "앱", prev: [] });
  assert.match(p, new RegExp(`${S.line}자 안쪽`)); assert.ok(p.includes(N.SHORT_RULE));
  const todo = N.criteriaFor(1, "Full"), prd = todo.findIndex((c) => c.term === "PRD");
  const d = N.parseStageDraft({ say: "네", prep: [], items: todo.map((c, i) => ({ text: i === prd ? `상세 기획서로 — ${long("까닭")}` : "글" })) }, 1, "Full", []);
  assert.ok(d.items[prd].why.length <= S.why, d.items[prd].why);
});

test("카드가 확인한 칸 · 기준 카드의 전문을 다시 늘어놓지 않는다 — 미리보기 한 줄(확인한 칸 24자 · 기준 칸 60자), 전문은 마우스를 올리면", () => {
  const q = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app/40-quest.js"), "utf8");
  assert.match(q, /<span title="\$\{esc\(line\)\}">\$\{esc\(preview1\(line, 24\)\)\}<\/span>/);
  const b = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app/92-basecard.js"), "utf8");
  assert.match(b, /<span title="\$\{esc\(f\.text\)\}">\$\{esc\(preview1\(f\.text, 60\)\)\}<\/span>/);
  assert.match(b, /받은 글 \$\{f\.lines\[0\]\.line\}줄\$\{f\.lines\.length > 1 \? ` 외 /, "줄 번호를 다 늘어놓지 않는다");
});
