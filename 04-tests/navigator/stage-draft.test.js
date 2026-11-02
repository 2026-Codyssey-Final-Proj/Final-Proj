// claude-drafted: 2026-10-25 — C-37 2단계 초안 · 단계 결과 모음(이재엽 "1단계에서 받은 내용들을 2단계에서도 초안들을 진행하며 생각들을 2단계 진행하기 전에 먼저 생각하고 동의들을 구한후" ·
//   "1단계 결과들을 정리해서 한번에 보는 곳"). 코드보다 먼저 썼다(code.md 1번). AI는 부르지 않는다.
//   navigator.js stageDraftPrompt · STAGE_DRAFT_SCHEMA · parseStageDraft(요청문 · 답 모양), quest.js withStageDraft · draftOf · pickOf · resultOf · shortOf · exampleStageDraft(화면이 쓰는 규칙)
// 실행: node --test 04-tests/navigator/stage-draft.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../../03-backend/navigator/navigator.js");
const Q = require("../../03-backend/navigator/quest.js");

const PREV = [{ name: "어떤 불편을 풀고 싶은지 한 문장으로 쓰기", lines: ["행사 신청을 종이로 받아서 헷갈려요"] }, { name: "누가 쓰는지 쓰기", lines: ["쓰는 사람: 소수 — 아는 몇 사람이 써요"] }];
const mk = (n, tier) => Q.makeQuest(N.STAGES[n], N.criteriaFor(n, tier));
const answer = (tier) => ({ items: N.criteriaFor(1, tier).map((c) => ({ text: c.term === "PRD" ? "경량 — 기능이 몇 개뿐이라 짧은 기획서면 돼요" : `${c.text}의 초안` })), say: "2단계 초안을 만들었어요" });

test("초안을 만드는 단계: 2단계(코드 1)부터 — 1단계는 /api/start(C-36), 3단계는 C-39(stage3-evidence.test.js)", () => {
  assert.ok(N.DRAFT_STAGES.includes(1) && !N.DRAFT_STAGES.includes(0));
});

test("2단계 초안 요청문(stageDraftPrompt): 받은 글 · 1단계 결과를 싸서 넘기고, 그 등급의 할 일을 순서대로 — 초등학생 말 · 지어내지 않기 · 기획서 칸은 경량 / 상세 / 안 함 중 하나로 시작", () => {
  const p = N.stageDraftPrompt(1, "Full", { idea: "동아리 행사 신청 앱을 만들고 싶어요", prev: [{ stage: 0, items: PREV }] });
  for (const s of ["<받은글>", "동아리 행사 신청 앱을 만들고 싶어요", "<지난단계결과>", "행사 신청을 종이로 받아서 헷갈려요", "쓰는 사람: 소수", N.FLORO_VOICE, ...N.criteriaFor(1, "Full").map((c) => c.text)]) assert.ok(p.includes(s), s);
  assert.match(p, /지어내지 않는다/); assert.match(p, /경량/); assert.match(p, /상세/); assert.match(p, /안 함/);
  const lite = N.stageDraftPrompt(1, "Lite", { idea: "앱", prev: [{ stage: 0, items: PREV }] });
  assert.ok(!lite.includes("정해진 빈칸에 아이디어 채우기"), "등급에 없는 할 일은 묻지 않는다");
});

test("2단계 초안 모양(STAGE_DRAFT_SCHEMA): 할 일마다 글 하나(+ 재료, C-39) · 준비할 것 · 한마디", () => {
  assert.deepEqual([...N.STAGE_DRAFT_SCHEMA.required].sort(), ["items", "prep", "say"]);
  assert.ok(N.STAGE_DRAFT_SCHEMA.properties.items.items.required.includes("text"));
});

test("2단계 초안 읽기(parseStageDraft): 할 일 개수 · 순서대로, 기획서 칸은 고르기(pick light · full · none + 까닭)로 · 글은 잘라 쓴다 · 개수가 다르거나 기획서 칸이 셋 밖이면 null", () => {
  const r = N.parseStageDraft(answer("Full"), 1, "Full");
  assert.equal(r.items.length, 5);
  assert.deepEqual(r.items[3], { pick: "light", why: "기능이 몇 개뿐이라 짧은 기획서면 돼요", from: [] });
  assert.equal(r.items[0].text, "정해진 빈칸에 아이디어 채우기의 초안"); assert.equal(r.say, "2단계 초안을 만들었어요");
  assert.equal(N.parseStageDraft({ ...answer("Full"), items: answer("Full").items.map((x, i) => (i === 3 ? { text: "상세 기획서로 — 사람이 여럿이에요" } : x)) }, 1, "Full").items[3].pick, "full");
  assert.equal(N.parseStageDraft({ ...answer("Full"), items: answer("Full").items.map((x, i) => (i === 3 ? { text: "안 함" } : x)) }, 1, "Full").items[3].pick, "none");
  assert.equal(N.parseStageDraft(answer("Xpress"), 1, "Xpress").items.length, 4, "보통에는 기획서 칸이 없다");
  const long = N.parseStageDraft({ ...answer("Lite"), items: [{ text: "가".repeat(900) }, { text: "나" }] }, 1, "Lite");
  assert.equal(long.items[0].text.length, N.LEN.line);   // 2026-10-30 퀘스트 글 짧게(quest-short.test.js)
  const prdAs = (t) => ({ ...answer("Full"), items: answer("Full").items.map((x, i) => (i === 3 ? { text: t } : x)) });
  for (const [bad, stage, tier] of [[null, 1, "Full"], [{}, 1, "Full"], [{ ...answer("Full"), items: answer("Full").items.slice(1) }, 1, "Full"], [prdAs("몰라요"), 1, "Full"],
    [{ ...answer("Lite"), items: [{ text: " " }, { text: "a" }] }, 1, "Lite"], [answer("Full"), 8, "Full"]]) assert.equal(N.parseStageDraft(bad, stage, tier), null, `${JSON.stringify(bad).slice(0, 50)} · ${stage}`);
});

test("withStageDraft: 2단계 퀘스트에 초안을 얹으면 받기 화면 없이 바로 확인(phase quest) · 초안 글(draftOf) · 고르기 칸(pickOf). 개수가 다르면 그대로", () => {
  const q0 = Q.retitle(mk(1, "Full"), "동아리 행사 신청 앱"), d = N.parseStageDraft(answer("Full"), 1, "Full");
  const q = Q.withStageDraft(q0, d);
  assert.equal(q.phase, "quest"); assert.equal(q.title, "동아리 행사 신청 앱");
  assert.equal(Q.draftOf(q, 0), "정해진 빈칸에 아이디어 채우기의 초안");
  assert.equal(Q.draftOf(q, 3), "", "고르기 칸에는 초안 글이 없다");
  assert.deepEqual(Q.pickOf(q, 3), { pick: "light", why: "기능이 몇 개뿐이라 짧은 기획서면 돼요" });
  assert.equal(Q.pickOf(q, 0), null);
  assert.equal(Q.withStageDraft(q0, { items: d.items.slice(1) }), q0, "할 일 개수와 다르면 얹지 않는다");
  assert.equal(q0.phase, "draft", "원본은 그대로");
  assert.deepEqual(Q.DOC_PICKS.map(([k]) => k), ["light", "full", "none"]);
});

test("단계 결과(resultOf): 보고한 퀘스트의 할 일 이름과 적은 줄을 그대로 — 한곳에서 보기 · 도전과제 지도 · 문서가 쓴다. 짧은 이름(shortOf)", () => {
  let q = Q.retitle(mk(0, "Full"), "동아리 행사 신청 앱");
  ["불편 줄", "달라짐 줄", "누가 줄", "크기: 보통"].forEach((t, i) => { q = Q.fill(q, i, t); });
  const r = Q.resultOf(q);
  assert.deepEqual(r, { chap: 0, title: "동아리 행사 신청 앱", items: q.objs.map((o, i) => ({ name: o.name, lines: q.lines[i], by: "me" })) }, "초안 없이 적은 줄 = 직접(by me, C-39)");
  r.items[0].lines.push("x"); assert.deepEqual(q.lines[0], ["불편 줄"], "원본과 따로");
  assert.deepEqual(N.STAGES[0].criteria.map((c) => Q.shortOf(c.text)), ["불편", "달라지는 것", "누가", "크기"]);
  assert.deepEqual(N.criteriaFor(1, "Full").map((c) => Q.shortOf(c.text)), ["빈칸 채우기", "왜 · 어디까지 · 언제 성공", "한 문장 한 가지", "기획서로 키울지", "남의 정보 · 밖으로"]);
  assert.equal(Q.shortOf("모르는 할 일"), "모르는 할 일");
  assert.equal(Q.fill(q, 0, "가".repeat(900)).lines[0].at(-1).length, 400, "한 줄은 400자까지 — 서버가 단계 결과 · 문서에서 받는 길이(2026-10-25 리뷰)");
});

test("연습(서버 없이)의 2단계 예시 초안 — 등급마다 그 할 일 개수 · 순서, 서버 답과 같은 모양, 쉬운 말", () => {
  for (const tier of N.TIERS) {
    const ex = Q.exampleStageDraft(1, N.criteriaFor(1, tier));
    assert.equal(ex.items.length, N.criteriaFor(1, tier).length, tier); assert.equal(ex.example, true);
  }
  assert.equal(Q.exampleStageDraft(8, N.criteriaFor(8, "Full")), null, "없는 단계(8단계 다음)는 예시가 없다");
  const words = JSON.stringify([Q.exampleStageDraft(1, N.criteriaFor(1, "Full")), Q.DOC_PICKS]);
  for (const j of N.JARGON) assert.ok(!words.includes(j), j);
});

// C-56 R-2(2026-10-28, 이재엽 버튼 "이 프로젝트의 말 + 방법 이름 꼬리표"): 초안 요청문에 기준 카드(<기준>)를 재료로 주고 칸마다 이 프로젝트의 말로 된 이름(title) · 묻는 말(ask) · 끝 조건(done)을 함께 받는다.
//   방법 이름(EARS · Planguage …)은 꼬리표로만 — 이름에 전문 용어가 섞이면 버리고 할 일 이름으로 둔다(지어낸 숫자 · 사람은 그대로 안 받는다)
test("C-56 R-2 — 초안 요청문: 기준 카드가 있으면 <기준>으로 싸서 넘기고(없으면 요청문이 전과 같다), 칸마다 title · ask · done을 묻는다; 읽기: title · ask · done은 정한 길이(N.LEN)까지, 전문 용어가 든 title은 버린다", () => {
  const IDEA = "동아리 행사 신청 앱을 만들고 싶어요", PREV3 = [{ stage: 0, items: PREV }, { stage: 1, items: N.criteriaFor(1, "Xpress").map((c) => ({ name: c.text, lines: [`${c.text} 줄`] })) }];
  const base = "만드는 것: 신청이 한곳에 모여요\n쓰는 사람: 운영진 3명 · 회원 40명\n성공: 신청 40건";
  const p0 = N.stageDraftPrompt(2, "Xpress", { idea: IDEA, prev: PREV3 }), p1 = N.stageDraftPrompt(2, "Xpress", { idea: IDEA, prev: PREV3, base });
  assert.ok(!p0.includes("<기준>") && p1.includes("<기준>\n" + base + "\n</기준>"), "기준 카드는 있을 때만"); assert.ok(/title/.test(p1) && /ask/.test(p1) && /done/.test(p1), "이름 · 묻는 말 · 끝 조건을 묻는다");
  assert.match(p1, /이 프로젝트의 말/); assert.match(p1, /방법 이름[^\n]*(쓰지|넣지) ?않/);
  const schema = N.STAGE_DRAFT_SCHEMA.properties.items.items.properties; assert.ok(schema.title && schema.ask && schema.done, "모양에 title · ask · done");
  const todo = N.criteriaFor(2, "Xpress");
  const d = N.parseStageDraft({ say: "네", prep: [], items: todo.map((c, i) => ({ text: `${i} 글`, alts: [], from: [], title: i === 0 ? "프롬프트 저장하기 요구 문장 세 줄" : i === 1 ? "EARS로 쓰기" : "", ask: "어떤 프롬프트를 저장하나요?", done: "문장 셋이 '~하면, 앱은 ~한다' 꼴" })) }, 2, "Xpress", PREV3);
  assert.ok(d, "읽힌다"); assert.equal(d.items[0].title, "프롬프트 저장하기 요구 문장 세 줄"); assert.equal(d.items[0].ask, "어떤 프롬프트를 저장하나요?"); assert.equal(d.items[0].done, "문장 셋이 '~하면, 앱은 ~한다' 꼴");
  assert.equal(d.items[1].title, undefined, "전문 용어(EARS)가 든 이름은 버린다"); assert.equal(d.items[2].title, undefined, "빈 이름은 없다");
  assert.equal(N.parseStageDraft({ say: "네", prep: [], items: todo.map((c, i) => ({ text: `${i} 글`, alts: [], from: [], title: "가".repeat(80) })) }, 2, "Xpress", PREV3).items[0].title.length, N.LEN.title, "이름은 정한 길이까지");   // 2026-10-30 퀘스트 글 짧게(quest-short.test.js)
});

// C-56 R-2 + C-54(2026-10-28): 2단계 끝에 3 ~ 8단계 준비된 퀘스트를 AI 한 번으로 — 받은 글 · 기준 카드 · 1 · 2단계 결과로 단계마다 이 프로젝트의 말로 된 이름 · ① 생각 · ② 행동 · 근거 절. 숫자 · 사람 · 날짜는 지어내지 않는다(#228이 규칙으로만 두었던 것)
test("C-56 — 준비 요청문(preparePrompt) · 모양(PREPARE_SCHEMA) · 읽기(parsePrepare): 3 ~ 8단계(코드 2 ~ 7)마다 title · think · act · from, 빠진 단계 · 틀린 모양은 null, 전문 용어 이름은 할 일 이름으로", () => {
  const IDEA = "동아리 행사 신청 앱을 만들고 싶어요", PREV3 = [{ stage: 0, items: PREV }, { stage: 1, items: N.criteriaFor(1, "Xpress").map((c) => ({ name: c.text, lines: [`${c.text} 줄`] })) }];
  const p = N.preparePrompt("Xpress", { idea: IDEA, prev: PREV3, base: "만드는 것: 신청" });
  assert.match(p, /3단계/); assert.match(p, /8단계/); assert.match(p, /<기준>/); assert.match(p, /지어내지 않는다/);
  const items = [2, 3, 4, 5, 6, 7].map((n) => ({ stage: n + 1, title: n === 2 ? "기능 여섯을 문장으로" : `${n + 1}단계 일`, think: `생각 ${n}`, act: `맡길 일 ${n}`, from: n === 2 ? "기획서 3절" : "" }));
  const r = N.parsePrepare({ items, say: "준비했어요" });
  assert.ok(r && Object.keys(r.cards).join(",") === "2,3,4,5,6,7", "코드 2 ~ 7"); assert.equal(r.cards[2].title, "기능 여섯을 문장으로"); assert.equal(r.cards[2].from, "기획서 3절"); assert.equal(r.cards[3].from, "새로 정함", "근거가 없으면 새로 정함");
  assert.equal(N.parsePrepare({ items: items.slice(1), say: "x" }), null, "빠진 단계면 null");
  assert.equal(N.parsePrepare({ items: items.map((x) => ({ ...x, title: "EARS 요구 명세" })), say: "x" }).cards[2].title, "", "전문 용어 이름은 비워 할 일 이름으로");
});

// C-56 R-5(2026-10-28, 이재엽 버튼 "다음 단계 미리까지"): 코딩 도구가 일을 마친 뒤 지금 단계 초안을 다시 맞춘다 — 방금 한 일을 요청문에 넣고, 그 일로 달라지는 칸만 바꾸라고 한다. 없으면 요청문은 전과 같다
test("C-56 R-5 — stageDraftPrompt에 work(방금 한 일)를 주면 <방금한일> 묶음과 '달라지는 칸만' 지시가 들어가고, 없으면 들어가지 않는다. WORK_MAX", () => {
  const base = { idea: "동아리 행사 신청 앱을 만들고 싶어요", prev: [{ stage: 0, items: PREV }] };
  const p0 = N.stageDraftPrompt(1, "Xpress", base), p1 = N.stageDraftPrompt(1, "Xpress", { ...base, work: "src/apply.js를 만들었어요 — 신청 단추" });
  assert.ok(!p0.includes("<방금한일>") && !/달라지는 칸만/.test(p0), "없으면 전과 같다");
  assert.match(p1, /<방금한일>\nsrc\/apply\.js를 만들었어요 — 신청 단추\n<\/방금한일>/); assert.match(p1, /달라지는 칸만/);
  assert.ok(Number.isInteger(N.WORK_MAX) && N.WORK_MAX >= 300 && N.WORK_MAX <= 2000, "방금 한 일 글자 상한");
});

// claude-drafted: 2026-11-02 — F-129: 요청문이 '경량' · '상세' · '안 함'을 따옴표로 보여 주니 AI가 따옴표 · 굵게를 붙여 답하기도 한다 — 한 줄 때문에 초안 전체가 null(502)이었다
test("2단계 초안 읽기 — 기획서 칸 앞뒤의 따옴표 · 굵게 표시는 걷고 고른다(F-129). 셋 밖이면 여전히 null", () => {
  const prdAs = (t) => ({ ...answer("Full"), items: answer("Full").items.map((x, i) => (i === 3 ? { text: t } : x)) });
  const got = (t) => { const r = N.parseStageDraft(prdAs(t), 1, "Full"); return r && r.items[3]; };
  assert.deepEqual(got("'경량' — 기능이 몇 개뿐이에요"), { pick: "light", why: "기능이 몇 개뿐이에요", from: [] });
  assert.equal(got("\"상세\": 사람이 여럿이에요").pick, "full");
  assert.equal(got("**안 함** — 혼자 써요").pick, "none");
  assert.equal(got("「경량」").pick, "light");
  assert.equal(got("'몰라요'"), null);
});
