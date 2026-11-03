// claude-drafted: 2026-10-21 — 퀘스트 규칙(C-22 게임식 디자인 1차 뼈대). 이재엽 결정(2026-10-21): 창 셋(설정 창 · 퀘스트 창 · 채팅 창), 단계는 1단계부터, 지금부터 만들어 릴리즈.
// 설계: 01-docs/04-pattern-implementation/game-overlay/quest-storyboard.md 10절, 캔버스 quest-canvas.html.
// 장 하나 = 퀘스트 하나. 할 일은 navigator.js STAGES의 그 단계 할 일 **그대로**(이름 · 용어 · 개수) — 판정 규칙은 바꾸지 않는다(서버 · navigator.js).
// 서버 · DB 없이 순수 함수만. 화면(app.js)이 쓰고, 시험(04-tests/navigator/quest.test.js)이 본다. 플로로가 묻는 말 · 예시 답을 AI가 만드는 것은 다음 판(/api/quest [제안]).
// 쉬운 말 규칙: 화면에 보이는 글에 전문 용어를 쓰지 않는다(navigator.js JARGON) — quest.test.js가 확인한다.
(function (root) {
  // 단계 번호 표시 — 코드(STAGES.n)는 0~7 그대로, 화면은 1~8(이재엽 2026-10-21 "단계는 1단계부터 시작"). 서고 · 모아 보기 창의 번호는 다음 판에서 맞춘다
  const LABEL = (n) => `${Number(n) + 1}단계`;
  const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ"];
  const roman = (i) => ROMAN[i] || String(i + 1);
  // 장마다 그림(자리표시 — 진짜 그림은 고한결 [정할 것 2 · 5]) — [장 그림, 할 일 그림들(순서대로, 모자라면 마지막 것)]
  const ICONS = [
    ["📝", ["😮‍💨", "✨", "🧑‍🤝‍🧑", "📏"]], ["🗂️", ["✍️", "🧭", "1️⃣", "📑", "🔒"]], ["📋", ["📋", "🔢", "⭐", "🔗", "🚫"]], ["🧭", ["🔀", "⚖️", "👆", "🖼️", "🔒"]],
    ["🦴", ["🧩", "🔢", "⚠️", "🔒"]], ["🛠️", ["🔨", "🤖", "🛂", "🧪", "🔒"]], ["🧪", ["🖱️", "📊", "📝", "👀"]], ["📖", ["🪞", "✂️", "📚"]],
  ];
  const iconOf = (n, i) => { const c = ICONS[n] || ICONS[0]; return c[1][Math.min(i, c[1].length - 1)]; };
  const chapIcon = (n) => (ICONS[n] || ICONS[0])[0];
  // 칭호 — 장을 지날 때마다 바뀐다(설정 창 · 플로로 옆). 숫자 레벨은 설정 창에만 [정할 것 6]
  const RANKS = ["출발한 사람", "적어 두는 사람", "기능 정리꾼", "길 고르는 사람", "뼈대 세우는 사람", "만드는 사람", "재 보는 사람", "책 한 권 지은이"];
  // 묶음 셋(설정 창의 초기 개발자 → 중급자 → 상급자) — [이름, 이 레벨부터] [정할 것 11 제안: 0~2장 · 3~5장 · 6~7장]
  const BANDS = [["초기 개발자", 0], ["중급자", 3], ["상급자", 6]];
  const rankOf = (lv) => RANKS[Math.max(0, Math.min(RANKS.length - 1, Number(lv) || 0))];
  const bandOf = (lv) => BANDS.filter((b) => (Number(lv) || 0) >= b[1]).length - 1;
  // 레벨 = 지금 단계(코드가 정한다 — FR-4). 모두 마쳤으면 8
  const lvOf = (j, finished) => (finished ? RANKS.length : j && Number.isInteger(j.stage) ? j.stage : 0);
  // 레벨은 사람에게(C-28, 이재엽 2026-10-23 버튼 "누적 — 관문마다 +1") — 관문을 넘을 때마다 +1, 프로젝트를 바꿔도 줄지 않는다. 화면이 기록(KEEP)과 따로 이 컴퓨터에 둔다.
  // 처음(저장된 값이 없을 때) 한 번만 지금 단계 = 이미 넘은 관문 수로 시작한다 [정할 것 ③의 제안]. 그 뒤로는 관문을 넘을 때만 오른다 — 판정으로 단계가 뛰어도 따라 오르지 않는다
  const okLv = (v) => Number.isInteger(v) && v >= 0;
  const startLevel = (saved, j, finished) => (okLv(saved) ? saved : lvOf(j, finished));
  const levelUp = (lv) => (okLv(lv) ? lv : 0) + 1;
  // 섬 자리(C-41 ②, 2026-10-27) — 섬이 작업실 창의 어느 가장자리에 붙나: 위 · 아래 · 왼쪽 · 오른쪽, 처음은 오른쪽(스토리보드 기준 4). 모르는 값은 오른쪽.
  //   2026-10-21 ~ 26에는 설정 창 · 퀘스트 창이 섬 옆 어느 쪽에 뜨나(left · right)였다 — 옛 저장값 left · right는 그대로 읽힌다
  const SIDES = ["top", "bottom", "left", "right"];
  const sideOf = (v) => (SIDES.includes(v) ? v : "right");   // otherSide(반대쪽)는 2026-10-27에 뺌 — 쓰는 곳이 없었다
  // 퀘스트 창 크기 S · M · L — [가로, 세로] px(화면이 작으면 CSS가 줄인다)
  // 작업실 크기 S/M/L(SIZES · sizeOf)은 2026-10-27 C-42 R-1로 뺐다 — 작업실은 화면 가득, 사람이 바꾼 크기 · 자리는 앱(main.js workspace.json)이 기억한다
  // 보상 — 조개는 장을 지날 때 하나, 셋이면 뽑기(확률은 늘 화면에 — 다음 판). 돈으로 사는 것은 없다
  const SHELL_COST = 3;
  const ITEMS = [
    { id: "ribbon", name: "얼음 리본", emoji: "🎀", slot: "hat", rar: "흔함", p: 60 },
    { id: "beanie", name: "털모자", emoji: "🧢", slot: "hat", rar: "보통", p: 30 },
    { id: "scarf", name: "별 목도리", emoji: "🧣", slot: "neck", rar: "드묾", p: 9 },
    { id: "crown", name: "무지개 왕관", emoji: "👑", slot: "hat", rar: "아주 드묾", p: 1 },
  ];
  // 뽑기 — r은 0 이상 100 미만의 수(Math.random() * 100). 확률 합이 100이 아니면 마지막 것
  function draw(items, r) {
    let left = Number(r) || 0;
    for (const it of items) { left -= it.p; if (left < 0) return it; }
    return items[items.length - 1];
  }
  const oddsOk = (items) => items.reduce((n, it) => n + it.p, 0) === 100 && items.every((it) => it.p > 0);
  const itemOf = (id) => ITEMS.find((it) => it.id === id) || null;
  // 입은 것 — {자리: 아이디}. 같은 자리를 다시 고르면 벗는다. 모르는 아이디는 그대로
  function toggleWear(wear, id) { const it = itemOf(id); if (!it) return wear || {}; const w = { ...(wear || {}) }; if (w[it.slot] === id) delete w[it.slot]; else w[it.slot] = id; return w; }
  const cleanWear = (wear) => Object.fromEntries(Object.entries(wear && typeof wear === "object" ? wear : {}).filter(([slot, id]) => { const it = itemOf(id); return it && it.slot === slot; }));
  const cleanOwned = (owned) => [...new Set((Array.isArray(owned) ? owned : []).filter((id) => itemOf(id)))];

  // 장(단계) 하나를 퀘스트로 — stage: 단계 표의 한 줄(navigator.js STAGES[n]), criteria: 그 단계 · 그 등급의 할 일(criteriaFor)
  // 돌려주는 것: {chap, title, objs:[{icon, name, term, need}], lines:[[줄…]…], phase, edit, sel, cond, when, desc, why}
  // side(곁 퀘스트): 그 단계의 할 일 가운데 이 등급의 목록(criteria)에 없는 것 — 안 해도 관문은 열린다. 공책 목차 아래 · 도전과제 옆 가지에 잠긴 채 보인다 [정할 것 3]
  function makeQuest(stage, criteria) {
    const n = stage.n, list = Array.isArray(criteria) ? criteria : [];
    const side = (stage.criteria || []).filter((c) => !list.some((x) => x.text === c.text)).map((c, i) => ({ icon: iconOf(n, list.length + i), name: c.text, term: c.term || "" }));
    return {
      chap: n, title: stage.title, phase: "draft", edit: false, sel: 0,
      objs: list.map((c, i) => ({ icon: iconOf(n, i), name: c.text, term: c.term || "", need: 1 })),
      lines: list.map(() => []), side,
      cond: n === 0 ? "처음 시작하는 사람 — 만드는 크기는 나중에 정해도 돼요" : `${LABEL(n - 1)}을 지난 사람`,
      when: "마감 없음 — 이 세션을 끝낼 때까지",
      desc: `${stage.does}. 할 일 ${list.length}개를 한 줄씩 저와 이야기하면 돼요.`,
      why: `이 장을 지나면 '${stage.gives}'이 책에 남아요`,
    };
  }
  const total = (q) => q.objs.reduce((n, o) => n + o.need, 0);
  const got = (q) => q.objs.reduce((n, o, i) => n + Math.min(o.need, (q.lines[i] || []).length), 0);
  // 지금 할 일 — 아직 다 적지 않은 첫 것. 다 적었으면 -1
  const curIdx = (q) => (q ? q.objs.findIndex((o, i) => (q.lines[i] || []).length < o.need) : -1);
  const isDone = (q) => !!q && curIdx(q) < 0;
  const filled = (q, i) => !!q && (q.lines[i] || []).length >= q.objs[i].need;
  // 한 줄 적기 — 원본은 안 바꾼다. 빈 줄은 적지 않는다. 한 줄은 400자까지(서버가 단계 결과 · 문서에서 받는 길이 — 2026-10-25 리뷰)
  // by(C-39) — 누가 정했나: 넘겨주면 그것(고르는 칸은 pick), 아니면 플로로가 낸 것과 맞대어 그대로(ok) · 고침(edit) · 직접(me)
  const LINE_MAX = 400;
  const BY = ["ok", "edit", "me", "pick", "moved", "skip", "chat"];   // chat — 작업실 개편 C-61(2026-10-29): 플로로와 나눈 대화를 정리 카드로 적은 칸(API.md 3-31)   // moved · skip — C-56(2026-10-28 이재엽 버튼 "'옮김' 새 값"): 지난 칸 · 파일에서 옮겨 적은 칸, 조건이 안 맞아 건너뛴 칸(queststate.js)
  const BY_WORD = { ok: "그대로", edit: "고침", me: "직접", pick: "고름", moved: "옮김", skip: "건너뜀", chat: "대화" };
  const byFor = (q, i, t, by) => (BY.includes(by) ? by : proposalOf(q, i) ? (t === proposalOf(q, i) ? "ok" : "edit") : "me");
  const withBy = (q, i, b) => ({ ...q, by: q.objs.map((_, k) => (k === i ? b : (q.by || [])[k] || null)) });
  const head = (s, n) => { const t = String(s).slice(0, n), c = t.charCodeAt(t.length - 1); return c >= 0xd800 && c <= 0xdbff ? t.slice(0, -1) : t; };   // 앞 n자 — 끝에 짝 글자(이모지)의 반쪽이 남으면 뗀다(F-144-24: 화면 · 클립보드에 �로 보였다)
  function fill(q, i, text, by) {
    const t = head(String(text || "").trim(), LINE_MAX);
    if (!q || !q.objs[i] || !t) return q;
    const lines = q.lines.map((l, k) => (k === i ? [...l, t] : l));
    return withBy({ ...q, lines, sel: i }, i, byFor(q, i, t, by));
  }
  // 줄 고치기(공책에서) — i번 할 일의 k번 줄. 빈 글이면 그 줄을 지운다. 고치면 누가 정했나도 다시(C-39) — 단, 고른 칸(pick)은 고른 것을 다듬어도 고름 그대로,
  //   줄이 다 지워지면 누가 정했나도 지운다(2026-10-25 리뷰 — 고르는 칸의 줄은 플로로가 낸 것과 모양이 달라 늘 '고침'으로 바뀌었다)
  function setLine(q, i, k, text) {
    if (!q || !q.objs[i]) return q;
    const t = String(text || "").trim();
    const lines = q.lines.map((l, idx) => (idx !== i ? l : t ? l.map((x, j) => (j === k ? t : x)) : l.filter((_, j) => j !== k)));
    const was = (q.by || [])[i];
    return withBy({ ...q, lines }, i, !lines[i].length ? null : was === "pick" ? "pick" : t ? byFor(q, i, t) : was || null);
  }
  const retitle = (q, title) => { const t = String(title || "").trim(); return t ? { ...q, title: t } : q; };
  const rename = (q, i, name) => { const t = String(name || "").trim(); return q && q.objs[i] && t ? { ...q, objs: q.objs.map((o, k) => (k === i ? { ...o, name: t } : o)) } : q; };
  const setNeed = (q, i, need) => { const v = Math.max(1, Math.min(5, Number(need) || 1)); return q && q.objs[i] ? { ...q, objs: q.objs.map((o, k) => (k === i ? { ...o, need: v } : o)) } : q; };
  // AI가 만든 글(서버 /api/quest — navigator.js parseQuest가 확인한 것)을 퀘스트에 얹는다. qa는 할 일 개수와 같을 때만. 원본은 안 바꾼다
  function withAI(q, ai) {
    if (!q || !ai) return q;
    const qa = Array.isArray(ai.qa) && ai.qa.length === q.objs.length ? ai.qa : null;
    return { ...q, desc: typeof ai.desc === "string" && ai.desc.trim() ? ai.desc.trim() : q.desc, why: typeof ai.why === "string" && ai.why.trim() ? ai.why.trim() : q.why, ...(qa ? { qa } : {}) };
  }
  // 플로로가 묻는 말 — AI가 만든 질문(qa)이 있으면 그것, 없으면 할 일 이름 그대로
  const question = (q, i) => { const o = q && q.objs[i]; if (!o) return ""; const k = (q.lines[i] || []).length, ai = q.qa && q.qa[i] && q.qa[i].question; return k ? `좋아요, ${k}개 됐어요. ${o.name} — 하나 더 말해 주세요` : ai || `${o.name} — 한 줄이면 돼요`; };
  // 예시 답 — AI가 만든 예시(qa[i].examples, 적은 만큼 다음 것)가 있으면 그것, 없으면 1단계의 연습 글(캔버스와 같은 글). 없으면 null
  const EXAMPLES = { 0: ["동아리 행사 신청을 종이로 받아서 누가 냈는지 매번 헷갈려요", "신청이 한곳에 모이고, 마감 전에 알림이 가요", "동아리 운영진 3명과 회원 40명", "작게 — 신청 받기와 알림까지만"] };
  const example = (q, i) => {
    if (!q || !q.objs[i]) return null;
    const ai = q.qa && q.qa[i] && q.qa[i].examples;
    if (ai && ai.length) return ai[Math.min((q.lines[i] || []).length, ai.length - 1)];
    const ex = EXAMPLES[q.chap]; return ex && ex[i] ? ex[i] : null;
  };
  // ── 처음 한 바퀴(C-36, 2026-10-25 — 이재엽 버튼 "1단계는 확인만 → 관문 → 2단계" · "규모 판단표 scope-tiers") ──
  // 받은 글로 만든 1단계 초안(navigator.js parseStart — topic · pain · change · who · size · sizeWhy)을 1단계 퀘스트에 얹는다: 제목은 주제, 받기 화면 없이 바로 칸마다 확인.
  // 확인하면 그 줄이 적힌다(fill) — 맞아요를 누르기 전에는 줄이 비어 있다
  const SIZE_KEYS = ["short", "medium", "long"];
  const SIZE_WORD = { short: "짧음", medium: "보통", long: "긺" };
  const SIZE_TIER = { short: "Lite", medium: "Xpress", long: "Full" };   // 규모 판단표(01-docs/00-overview/scope-tiers.md) — 만드는 크기(tiers.js LABELS)와 같은 순서 · 같은 이름
  const WHO = [["본인", "나 혼자 써요"], ["소수", "아는 몇 사람이 써요"], ["불특정다수", "누구나 써요"]];   // 글에 쓰는 사람이 없을 때 고르는 칩
  const WHO_AT = 2, SIZE_AT = 3;   // 1단계 할 일의 자리(navigator.js STAGES[0] 순서) — Ⅲ 누가 · Ⅳ 크기
  function withDraft(q, d) {
    if (!q || !d) return q;
    return { ...retitle(q, d.topic), draft: d, phase: "quest", sel: 0, desc: "플로로가 받은 글로 이 장의 초안을 만들었어요. 칸마다 맞는지만 봐 주세요 — 다르면 고쳐 적으면 돼요." };
  }
  // 그 할 일에 플로로가 내민 초안 글 — 1단계의 Ⅰ 불편 · Ⅱ 달라지는 것 · Ⅲ 누가(글에 있을 때만). Ⅳ 크기는 고르는 칸이라 글이 없다.
  //   2단계(C-37)부터는 초안의 칸마다 글(items[i].text) — 고르는 칸(기획서로 키울지)은 글이 없고 pickOf
  const draftOf = (q, i) => {
    const d = q && q.draft; if (!d) return "";
    if (q.chap === 0) return i === 0 ? d.pain : i === 1 ? d.change : i === WHO_AT ? d.who : "";
    const it = d.items && d.items[i]; return it && !it.pick ? it.text : "";
  };
  const pickOf = (q, i) => { const it = q && q.chap !== 0 && q.draft && q.draft.items && q.draft.items[i]; return it && it.pick ? { pick: it.pick, why: it.why } : null; };
  // ── 2단계 초안(C-37, 2026-10-25 — 이재엽 "1단계에서 받은 내용들을 2단계에서도 초안들을 진행하며 … 2단계 진행하기 전에 먼저 생각하고 동의들을 구한후") ──
  // 서버(/api/stagedraft — navigator.js parseStageDraft)가 준 { items[{text} | {pick, why}] }를 그 장 퀘스트에. 할 일 개수와 같을 때만. 받기 화면 없이 바로 칸마다 확인
  function withStageDraft(q, d) {
    if (!q || !d || !Array.isArray(d.items) || d.items.length !== q.objs.length) return q;
    return { ...q, draft: { stage: q.chap, items: d.items, prep: Array.isArray(d.prep) ? d.prep : [], example: !!d.example }, phase: "quest", sel: 0, desc: "플로로가 지난 장에서 정한 것으로 이 장의 초안을 만들었어요. 칸마다 맞는지만 봐 주세요 — 다르면 고쳐 적으면 돼요." };
  }
  // C-56 R-5(2026-10-28 — 이재엽 버튼 "다음 단계 미리까지"): 코딩 도구가 일을 마친 뒤 다시 맞춘 초안(d)을 지금 퀘스트에.
  //   아직 안 적은 칸만 새 글로 바꾼다(changed). 사람이 적은 칸은 덮지 않고 글이 달라졋으면 review에 새 글만(화면이 '다시 볼까요?'로 묻는다). 개수가 다르거나 초안이 없던 퀘스트면 그대로
  function refit(q, d) {
    const none = { q, changed: [], review: [] };
    if (!q || !q.draft || !d || !Array.isArray(d.items) || d.items.length !== q.objs.length) return none;
    const changed = [], review = [];
    const items = q.draft.items.map((it, i) => {
      const nx = d.items[i], was = it && !it.pick ? String(it.text || "") : "", now = nx && !nx.pick ? String(nx.text || "").trim() : "";
      if (!now || now === was || (nx.pick && it && it.pick)) return it;   // 빈 글 · 같은 글 · 고르는 칸은 그대로
      if (filled(q, i)) { review.push({ i, text: now }); return it; }
      changed.push(i); return { ...it, ...nx };
    });
    if (!changed.length && !review.length) return none;
    return { q: { ...q, draft: { ...q.draft, items, prep: Array.isArray(d.prep) ? d.prep : q.draft.prep } }, changed, review };
  }
  // 기획서로 키울지(PRD) — 고르는 칸의 셋. 고른 것이 그 줄이 된다
  const DOC_PICKS = [["light", "경량 기획서로"], ["full", "상세 기획서로"], ["none", "키우지 않아요"]];
  // 할 일의 짧은 이름 — 확인 카드 · 도전과제 지도 · 문서가 쓴다. 모르는 할 일은 그 이름 그대로
  const SHORT = {
    "어떤 불편을 풀고 싶은지 한 문장으로 쓰기": "불편", "다 만들면 무엇이 달라지는지 쓰기": "달라지는 것", "누가 쓰는지 쓰기": "누가", "얼마나 크게 만들지 정하기": "크기",
    "정해진 빈칸에 아이디어 채우기": "빈칸 채우기", "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기": "왜 · 어디까지 · 언제 성공", "한 문장에 한 가지 일만, 애매한 말 없이 쓰기": "한 문장 한 가지",
    "자세한 기획서로 키울지 직접 정하기": "기획서로 키울지", "다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기": "남의 정보 · 밖으로",
    "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기": "기능 문장", "'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')": "숫자로", "기능마다 꼭 필요한지, 있으면 좋은지 표시하기": "꼭 · 있으면 좋음",
    "기능마다 어디서 나온 생각인지 표로 잇기 (기능이 5개 이상일 때)": "나온 곳 잇기", "막아야 할 일(예: 남의 정보가 밖으로 나감)도 '~하면, 앱은 ~한다'로 쓰기": "막을 일",
    // 4 ~ 8단계(C-40)
    "흔히 쓰는 방법 목록에서 먼저 후보를 2개 이상 찾기": "후보 찾기", "후보끼리 좋은 점과 아쉬운 점 비교하기": "견주기", "고른 방법과 왜 골랐는지 한 줄을 기록으로 남기기": "고른 까닭",
    "지키기로 한 원칙(쓸 도구, 하면 안 되는 것, 화면 원칙)과 고른 방법 맞대어 보기": "약속과 맞대기", "누가 무엇을 볼 수 있는지, 정보를 어디에 둘지도 비교에 넣기": "보는 사람 · 둘 곳",
    "가장 단순한 흐름을 처음부터 끝까지 이어 보기": "끝까지 잇기", "이어진 게 실제로 도는지 확인하기": "도는지 보기", "남은 일을 작은 할 일로 나누기": "작게 나누기",
    "비밀번호·키 같은 비밀값이 코드와 기록에 남지 않았는지 확인하기": "비밀값 검사",
    "확인 방법을 먼저 정하고 만들기": "확인 먼저", "작은 부분마다 확인 통과하기": "작은 확인", "쓰는 사람 입장의 시나리오대로 돌려 보기": "써 보기",
    "막아야 할 일마다 일부러 어겨 보고, 정말 막히는지 확인하기": "일부러 어겨 보기",
    "2단계에서 정한 숫자를 실제로 재 보기": "숫자 재기", "잰 값을 그대로 적어 두기": "잰 값 적기", "재지 못한 것을 '아직 못 함'으로 적어 두기": "못 잰 것",
    "공개한 앱에 아무나 들어오지 못하게 되어 있는지 확인하기": "아무나 못 들어오게",
    "잘된 점과 아쉬운 점 돌아보기": "돌아보기", "'왜?'를 다섯 번 물어 진짜 원인 찾기": "왜 다섯 번", "정보가 샐 뻔했던 일이나 아찔했던 일 적기": "아찔했던 일",
    "배운 것을 다음에 쓸 수 있게 남기기": "배운 것 남기기", "마친 작업을 저장소에 올려 두기": "저장소에 올리기",
  };
  const shortOf = (name) => SHORT[name] || name;
  // 쉬운 한 줄(C-40, 이재엽 "퀘스트에서도 자세히 보이지만 어렵게 보이고 있어" · 버튼 "짧은 이름 + 쉬운 한 줄") — 퀘스트 창이 할 일 문장 대신 보인다. 원래 문장 · 용어는 '자세히'에서
  const EASY = {
    "어떤 불편을 풀고 싶은지 한 문장으로 쓰기": "무엇이 불편한지 한 문장으로 말해요", "다 만들면 무엇이 달라지는지 쓰기": "다 만들면 무엇이 좋아지는지 말해요",
    "누가 쓰는지 쓰기": "누가 쓰는지 말해요", "얼마나 크게 만들지 정하기": "짧게 · 보통 · 길게 중에서 골라요",
    "정해진 빈칸에 아이디어 채우기": "누구 · 불편 · 해결 같은 빈칸을 채워요", "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기": "왜, 어디까지, 언제 다 된 건지 답해요",
    "한 문장에 한 가지 일만, 애매한 말 없이 쓰기": "꼭 할 일을 한 문장에 하나씩 써요", "자세한 기획서로 키울지 직접 정하기": "기획서를 짧게 쓸지 자세히 쓸지 골라요",
    "다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기": "남의 이름 · 연락처가 들어가는지 봐요",
    "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기": "앱이 할 일을 '~하면 ~한다'로 써요", "'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')": "'빨리' 같은 말을 숫자로 바꿔요",
    "기능마다 꼭 필요한지, 있으면 좋은지 표시하기": "꼭 필요한 것과 있으면 좋은 것을 나눠요", "기능마다 어디서 나온 생각인지 표로 잇기 (기능이 5개 이상일 때)": "기능마다 어디서 나온 생각인지 이어요",
    "막아야 할 일(예: 남의 정보가 밖으로 나감)도 '~하면, 앱은 ~한다'로 쓰기": "앱이 하면 안 되는 일도 적어요",
    "흔히 쓰는 방법 목록에서 먼저 후보를 2개 이상 찾기": "만드는 방법 후보를 두 개 넘게 찾아요", "후보끼리 좋은 점과 아쉬운 점 비교하기": "후보마다 좋은 점 · 아쉬운 점을 견줘요",
    "고른 방법과 왜 골랐는지 한 줄을 기록으로 남기기": "고른 방법과 까닭을 한 줄로 남겨요", "지키기로 한 원칙(쓸 도구, 하면 안 되는 것, 화면 원칙)과 고른 방법 맞대어 보기": "지키기로 한 약속과 맞는지 봐요",
    "누가 무엇을 볼 수 있는지, 정보를 어디에 둘지도 비교에 넣기": "누가 무엇을 보는지, 정보를 어디 둘지 봐요",
    "가장 단순한 흐름을 처음부터 끝까지 이어 보기": "가장 간단한 길을 처음부터 끝까지 이어요", "이어진 게 실제로 도는지 확인하기": "이은 것이 진짜 움직이는지 봐요",
    "남은 일을 작은 할 일로 나누기": "남은 일을 작게 나눠요", "비밀번호·키 같은 비밀값이 코드와 기록에 남지 않았는지 확인하기": "비밀번호 같은 것이 남지 않았는지 봐요",
    "확인 방법을 먼저 정하고 만들기": "어떻게 확인할지 먼저 정하고 만들어요", "작은 부분마다 확인 통과하기": "작은 부분마다 확인을 통과해요",
    "쓰는 사람 입장의 시나리오대로 돌려 보기": "쓰는 사람처럼 처음부터 끝까지 써 봐요", "막아야 할 일마다 일부러 어겨 보고, 정말 막히는지 확인하기": "안 되는 일을 일부러 해 보고 막히는지 봐요",
    "2단계에서 정한 숫자를 실제로 재 보기": "정해 둔 숫자를 진짜로 재 봐요", "잰 값을 그대로 적어 두기": "잰 값을 그대로 적어요",
    "재지 못한 것을 '아직 못 함'으로 적어 두기": "못 잰 것은 '아직 못 함'으로 적어요", "공개한 앱에 아무나 들어오지 못하게 되어 있는지 확인하기": "아무나 들어오지 못하는지 봐요",
    "잘된 점과 아쉬운 점 돌아보기": "잘된 점과 아쉬운 점을 돌아봐요", "'왜?'를 다섯 번 물어 진짜 원인 찾기": "'왜?'를 다섯 번 물어 진짜 까닭을 찾아요",
    "정보가 샐 뻔했던 일이나 아찔했던 일 적기": "정보가 샐 뻔한 일이 있었는지 적어요", "배운 것을 다음에 쓸 수 있게 남기기": "배운 것을 다음에 쓰게 남겨요",
    "마친 작업을 저장소에 올려 두기": "다 한 것을 저장소에 올려요",
  };
  const easyOf = (name) => EASY[name] || "";
  // C-56 R-2(2026-10-28): 칸의 이름 · 묻는 말 · 끝 조건 — 초안에 이 프로젝트의 말(title · ask · done)이 있으면 그것, 없으면 짧은 이름 · 질문 · 빈 글. 방법 이름(term)은 화면이 꼬리표로
  const wordOf = (q, i, k) => { const it = q && q.draft && q.draft.items && q.draft.items[i]; return it && typeof it[k] === "string" && it[k].trim() ? it[k].trim() : ""; };
  const nameOf = (q, i) => wordOf(q, i, "title") || (q && q.objs[i] ? shortOf(q.objs[i].name) : "");
  const askOf = (q, i) => wordOf(q, i, "ask") || question(q, i);
  const doneOf = (q, i) => wordOf(q, i, "done");
  // 플로로가 이 칸에 낸 것(C-39) — 초안 글 · 권한 크기 · 권한 기획서. 고르는 칸도 무엇을 권했는지 남긴다(문서의 '플로로 초안' · 도전과제 흐름). 없으면 빈 글
  function proposalOf(q, i) {
    const d = q && q.draft; if (!d) return "";
    if (q.chap === 0 && i === SIZE_AT) return d.size ? `${SIZE_WORD[d.size]} — ${d.sizeWhy || ""}`.replace(/ — $/, "") : "";
    const pk = pickOf(q, i); if (pk) { const x = DOC_PICKS.find(([k]) => k === pk.pick); return x ? `${x[1]}${pk.why ? ` — ${pk.why}` : ""}` : ""; }
    return draftOf(q, i) || "";
  }
  // 이 칸의 재료(C-39) — 플로로가 초안을 쓸 때 본 지난 단계 칸 [{ s, i }]
  const fromOf = (q, i) => { const it = q && q.chap !== 0 && q.draft && q.draft.items && q.draft.items[i]; return it && Array.isArray(it.from) ? it.from : []; };
  // ── C-40(2026-10-26 — 버튼 "예시 셋 중 고르기" · "남은 칸 모두 맞아요" · "다음 단계 초안 미리") ──
  // 이 칸의 예시들 — 권하는 것(text)이 먼저, 다른 길(alts)이 뒤. 예시가 하나뿐이면 [text], 없으면 []
  const examplesOf = (q, i) => { const it = q && q.chap !== 0 && q.draft && q.draft.items && q.draft.items[i]; return it && !it.pick && it.text ? [it.text, ...(Array.isArray(it.alts) ? it.alts : [])] : []; };
  // 맞아요(권한 것을 그대로)를 누르면 적힐 줄 — 칩으로 권한 것을 누른 줄과 같다(크기 · 기획서). 사람이 골라야 하는 칸(글에 사람이 없던 '누가')은 빈 글
  function acceptedLine(q, i) {
    const d = q && q.draft; if (!d) return "";
    if (q.chap === 0 && i === SIZE_AT) return d.size ? `크기: ${SIZE_WORD[d.size]}${d.sizeWhy ? ` — ${d.sizeWhy}` : ""}` : "";
    const pk = pickOf(q, i); if (pk) { const x = DOC_PICKS.find(([k]) => k === pk.pick); return x ? `기획서: ${x[1]}${pk.why ? ` — ${pk.why}` : ""}` : ""; }
    return draftOf(q, i) || "";
  }
  // 남은 칸 모두 맞아요 — 빈 칸마다 맞아요가 적을 줄(누가 = 그대로). 이미 적은 칸은 그대로, 사람이 골라야 하는 칸 · 여러 줄 칸 앞에서 멈춘다
  function fillAll(q) {
    let out = q;
    for (let i = 0; out && i < out.objs.length; i++) {
      if (filled(out, i)) continue;
      const line = acceptedLine(out, i); if (!line || out.objs[i].need > 1) break;
      out = fill(out, i, line, "ok");
    }
    return out;
  }
  // 모두 맞아요라면 남을 결과 — 다음 단계 초안을 미리 만들 때 쓴다(관문을 지나 실제 결과와 같으면 기다리지 않는다). 사람이 골라야 하는 칸이 비어 있으면 null
  function expectedResult(q) {
    if (!q || !q.draft) return null;
    const items = q.objs.map((o, i) => { const ls = q.lines[i] || []; if (ls.length >= o.need) return { name: o.name, lines: [...ls] }; const a = acceptedLine(q, i); return a && o.need === 1 ? { name: o.name, lines: [a] } : null; });
    return items.every(Boolean) ? { chap: q.chap, title: q.title, items } : null;
  }
  // 초안을 칸마다 확인한 단계의 완료 보고 — AI가 다시 살펴보지 않고 확인한 대로 본다(C-40 버튼 "확인한 단계는 판정 AI 건너뛰기", FR-1 · FR-2가 바뀜)
  const CONFIRM_REASON = "초안을 칸마다 확인했어요 — 확인한 대로 봤어요(AI가 다시 살펴보지 않았어요)";
  // 단계 결과 — 보고한 퀘스트의 할 일 이름과 적은 줄(원본과 따로). 한곳에서 보기 · 도전과제 지도 · 다음 장 초안 · 문서(docs.js)가 쓴다.
  //   C-39: 칸마다 누가 정했나(by) · 플로로가 낸 것(draft) · 재료(from), 이 단계 전에 준비할 것(prep) — 없는 것은 넣지 않는다. 날짜 · 완료 기준은 화면이 더한다(at · passed · check)
  const resultOf = (q) => {
    const prep = q.draft && Array.isArray(q.draft.prep) && q.draft.prep.length ? [...q.draft.prep] : null;
    const items = q.objs.map((o, i) => { const by = (q.by || [])[i], draft = proposalOf(q, i), from = fromOf(q, i);
      return { name: o.name, lines: [...(q.lines[i] || [])], ...(by ? { by } : {}), ...(draft ? { draft } : {}), ...(from.length ? { from: from.map((r) => ({ ...r })) } : {}) }; });
    return { chap: q.chap, title: q.title, items, ...(prep ? { prep } : {}) };
  };
  // 연습(서버 없이 FR-10)의 2단계 예시 초안 — 할 일 글로 찾아 그 등급의 개수 · 순서대로. 1단계 예시(EXAMPLE_DRAFT)와 같은 이야기. 예시가 없는 단계면 null
  //   재료(from)는 1단계 칸 순서(불편 · 달라지는 것 · 누가 · 크기)와 2단계 칸 순서(Full 기준 — 등급마다 칸 수가 달라 2단계 칸은 이름으로 찾는다)
  //   refs에 쓰는 할 일 글(C-40) — 지난 단계의 칸을 이름으로 찾는다
  const ONE = "한 문장에 한 가지 일만, 애매한 말 없이 쓰기", WHY = "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기", INFO = "다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기";
  const FEAT = "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", NUM = "'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')", MUST = "기능마다 꼭 필요한지, 있으면 좋은지 표시하기";
  const BLOCK = "막아야 할 일(예: 남의 정보가 밖으로 나감)도 '~하면, 앱은 ~한다'로 쓰기", PICKED = "고른 방법과 왜 골랐는지 한 줄을 기록으로 남기기", WHO_SEE = "누가 무엇을 볼 수 있는지, 정보를 어디에 둘지도 비교에 넣기";
  const SPLIT = "남은 일을 작은 할 일로 나누기", SECRET = "비밀번호·키 같은 비밀값이 코드와 기록에 남지 않았는지 확인하기", STORY = "쓰는 사람 입장의 시나리오대로 돌려 보기", MEASURED = "잰 값을 그대로 적어 두기";
  const EXAMPLE_STAGE = { 1: {
    "정해진 빈칸에 아이디어 채우기": { text: "누구: 동아리 운영진과 회원 · 불편: 신청을 종이로 받아 헷갈림 · 해결: 화면으로 신청 받기 · 어디까지: 신청과 마감 알림 · 언제 성공: 신청이 한곳에 모임", from: [{ s: 0, i: 0 }, { s: 0, i: 2 }] },
    "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기": { text: "왜: 누가 냈는지 헷갈려서 · 어디까지: 신청 받기와 마감 알림(결제는 안 해요) · 언제 성공: 신청 40건이 한곳에 모이면", from: [{ s: 0, i: 0 }, { s: 0, i: 1 }] },
    "한 문장에 한 가지 일만, 애매한 말 없이 쓰기": { text: "회원이 신청 단추를 누르면, 앱은 신청을 받는다 / 마감 하루 전이 되면, 앱은 알림을 보낸다 / 운영진이 목록을 열면, 앱은 신청한 사람을 보여 준다", from: [{ s: 0, i: 1 }] },
    "자세한 기획서로 키울지 직접 정하기": { pick: "light", why: "기능이 셋뿐이라 짧은 기획서면 돼요", from: [{ s: 0, i: 3 }] },
    "다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기": { text: "남의 정보: 회원 이름과 연락처 · 밖으로 나가는 것: 알림을 보내는 서비스", from: [{ s: 0, i: 2 }] },
  }, 2: {   // 3단계(C-39) — 2단계에서 정한 꼭 할 일 셋 · 남의 정보에서. refs: [[단계, 할 일 글 또는 자리]] — 등급마다 칸 수가 달라 이름으로 찾는다
    "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기": { text: "회원이 신청 단추를 누르면, 앱은 신청을 받는다 / 마감 하루 전이 되면, 앱은 알림을 보낸다 / 운영진이 목록을 열면, 앱은 신청한 사람을 보여 준다", refs: [[1, ONE]] },
    "'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')": { text: "마감 전 → 하루 전 / 바로 받는다 → 아직 모름", refs: [[1, WHY]] },
    "기능마다 꼭 필요한지, 있으면 좋은지 표시하기": { text: "신청 받기: 꼭 / 마감 알림: 꼭 / 신청한 사람 목록: 있으면 좋음", refs: [[0, 1], [1, ONE]] },
    "기능마다 어디서 나온 생각인지 표로 잇기 (기능이 5개 이상일 때)": { text: "기능이 3개라 아직 안 해도 돼요", refs: [[1, ONE]] },
    "막아야 할 일(예: 남의 정보가 밖으로 나감)도 '~하면, 앱은 ~한다'로 쓰기": { text: "운영진이 아닌 사람이 목록을 열면, 앱은 연락처를 보여 주지 않는다 / 알림을 보낼 때, 앱은 이름 말고 다른 정보를 보내지 않는다", refs: [[1, INFO]] },
  }, 3: {   // 4단계(C-40) — 만드는 방법 고르기. 예시 셋(text · alts)
    "흔히 쓰는 방법 목록에서 먼저 후보를 2개 이상 찾기": { text: "화면 하나짜리 웹(신청 받기) / 서버가 있는 웹(신청 목록을 함께 보기)", alts: ["서버가 있는 웹 / 설문 도구에 알림만 붙이기", "휴대폰 앱 / 화면 하나짜리 웹"], refs: [[2, FEAT]] },
    "후보끼리 좋은 점과 아쉬운 점 비교하기": { text: "화면 하나짜리 웹: 빨리 만든다 · 신청이 이 컴퓨터에만 남는다 / 서버가 있는 웹: 운영진이 어디서나 본다 · 만들 것이 많다", alts: ["설문 도구: 오늘 바로 쓴다 · 마감 알림을 붙이기 어렵다 / 서버가 있는 웹: 원하는 대로 만든다 · 시간이 든다", "휴대폰 앱: 알림이 잘 간다 · 설치해야 한다 / 웹: 주소만 보내면 된다 · 알림이 약하다"], refs: [[2, MUST]] },
    "고른 방법과 왜 골랐는지 한 줄을 기록으로 남기기": { text: "고른 방법: 서버가 있는 웹 — 까닭: 운영진 3명이 같은 신청 목록을 봐야 해서", alts: ["고른 방법: 화면 하나짜리 웹 — 까닭: 이번엔 신청 받기만 빨리 해 보려고", "고른 방법: 설문 도구 + 알림 — 까닭: 만들 시간이 짧아서"], refs: [[0, 2], [1, WHY]] },
    "지키기로 한 원칙(쓸 도구, 하면 안 되는 것, 화면 원칙)과 고른 방법 맞대어 보기": { text: "쓸 도구 Claude Code: 맞음 / 결제는 안 함: 맞음 — 신청과 알림만 / 화면은 쉬운 말: 맞음", alts: ["쓸 도구: 맞음 / 연락처는 운영진만: 맞음 — 들어올 때 확인이 필요", "화면 하나짜리면 약속은 맞지만 운영진이 함께 보기는 안 맞음"], refs: [[1, WHY]] },
    "누가 무엇을 볼 수 있는지, 정보를 어디에 둘지도 비교에 넣기": { text: "누가 무엇을 보나: 회원은 자기 신청만, 운영진은 전체 · 정보를 둘 곳: 서버 · 들어올 때 확인: 필요(운영진)", alts: ["누가 무엇을 보나: 운영진만 · 정보를 둘 곳: 이 컴퓨터 · 들어올 때 확인: 불필요", "누가 무엇을 보나: 운영진 · 정보를 둘 곳: 설문 도구 · 들어올 때 확인: 그 서비스의 로그인"], refs: [[1, INFO], [2, BLOCK]] },
  }, 4: {   // 5단계 — 뼈대
    "가장 단순한 흐름을 처음부터 끝까지 이어 보기": { text: "① 회원이 신청 화면을 연다 → ② 이름을 넣고 신청 → ③ 운영진 목록에 한 줄 생긴다", alts: ["① 운영진이 행사를 만든다 → ② 신청 주소가 생긴다 → ③ 회원이 신청한다", "① 신청 → ② 저장 → ③ 마감 하루 전 알림 한 번"], refs: [[3, PICKED], [2, FEAT]] },
    "이어진 게 실제로 도는지 확인하기": { text: "신청 한 번을 넣어 보면 → 운영진 목록에 그 이름이 보이면 된다", alts: ["주소를 열어 보면 → 신청 화면이 뜨면 된다", "신청 둘을 넣어 보면 → 목록에 둘 다 보이면 된다"], refs: [[2, FEAT]] },
    "남은 일을 작은 할 일로 나누기": { text: "신청 화면 만들기 / 신청 저장하기 / 운영진 목록 보기 / 마감 알림 보내기", alts: ["행사 만들기 / 신청 받기 / 목록 보기", "신청 받기 / 알림 붙이기 / 들어올 때 확인 붙이기 / 쉬운 말 다듬기"], refs: [[2, MUST]] },
    [SECRET]: { text: "알림 서비스 열쇠는 .env에 두고 올리지 않기", alts: ["올리기 전에 비밀값 검사 한 번 돌리기", "열쇠는 이 컴퓨터에만 — 코드에는 이름만 적기"], refs: [[1, INFO]] },
  }, 5: {   // 6단계 — 하나씩 만들고 확인하기
    "확인 방법을 먼저 정하고 만들기": { text: "신청 받기 — 이름을 넣으면 목록에 한 줄 / 마감 알림 — 마감 하루 전이면 알림 한 번", alts: ["신청 받기 — 이름이 비면 '이름을 적어 주세요' / 목록 — 운영진만 열린다", "알림 — 마감이 지나면 보내지 않는다 / 신청 — 같은 사람이 두 번 내면 한 번만"], refs: [[2, FEAT], [4, SPLIT]] },
    "작은 부분마다 확인 통과하기": { text: "신청 저장 / 목록 보이기 / 알림 시간 계산", alts: ["빈 이름 막기 / 같은 신청 한 번만", "운영진만 목록 / 알림 한 번만"], refs: [[4, SPLIT]] },
    "쓰는 사람 입장의 시나리오대로 돌려 보기": { text: "① 회원이 신청한다 → ② 운영진이 목록을 연다 → 결과: 신청한 사람이 보인다", alts: ["① 회원이 신청한다 → ② 마감 하루 전 → 결과: 알림이 온다", "① 운영진이 아닌 사람이 목록을 연다 → 결과: 들어올 수 없다고 나온다"], refs: [[0, 2], [2, FEAT]] },
    "막아야 할 일마다 일부러 어겨 보고, 정말 막히는지 확인하기": { text: "운영진이 아닌 사람으로 목록을 열어 보면 → 막혀야 한다 / 알림에 연락처를 넣어 보면 → 빠져야 한다", alts: ["로그인 없이 목록 주소를 열어 보면 → 막혀야 한다", "같은 이름으로 두 번 신청해 보면 → 한 번만 남아야 한다"], refs: [[2, BLOCK]] },
    [SECRET]: { text: "올리기 전에 비밀값 검사를 돌려 0건인지 보기", alts: ["알림 열쇠가 코드에 없는지 찾아보기", ".env가 올릴 파일 목록에 없는지 보기"], refs: [[4, SECRET]] },
  }, 6: {   // 7단계 — 재 보기. 잰 값은 지어내지 않는다(재고 적기)
    "2단계에서 정한 숫자를 실제로 재 보기": { text: "알림이 마감 하루 전에 오는지 — 시계를 바꿔 보고 잰다 / 신청 40건이 한곳에 모이는지 — 넣어 보고 센다", alts: ["신청 한 번에 걸린 시간 — 초시계로 잰다", "정한 숫자 없음 — 3단계에서 먼저 정하기"], refs: [[2, NUM], [1, WHY]] },
    "잰 값을 그대로 적어 두기": { text: "알림 시각: (재고 적기) · 잰 날: (재고 적기)", alts: ["모인 신청 수: (재고 적기) · 잰 날: (재고 적기)", "신청 한 번 걸린 시간: (재고 적기) · 잰 날: (재고 적기)"], refs: [[2, NUM]] },
    "재지 못한 것을 '아직 못 함'으로 적어 두기": { text: "회원 40명이 한꺼번에 신청할 때 — 아직 못 함(사람이 모자라서)", alts: ["없음", "실제 행사 날 알림 — 아직 못 함(행사가 아직이라서)"], refs: [[1, WHY]] },
    "공개한 앱에 아무나 들어오지 못하게 되어 있는지 확인하기": { text: "운영진 목록은 들어올 때 확인 — 비밀번호를 아는 사람만", alts: ["공개하지 않아요 — 이 컴퓨터에서만", "신청 화면만 공개, 목록 주소는 비밀 주소로"], refs: [[3, WHO_SEE]] },
  }, 7: {   // 8단계 — 돌아보기
    "잘된 점과 아쉬운 점 돌아보기": { text: "잘된 점: 신청이 한곳에 모였다 · 아쉬운 점: 마감 알림을 늦게 붙였다", alts: ["잘된 점: 쉬운 말 화면 · 아쉬운 점: 들어올 때 확인을 끝에 붙였다", "잘된 점: 뼈대를 먼저 이었다 · 아쉬운 점: 잰 값이 아직 없다"], refs: [[6, MEASURED], [5, STORY]] },
    "'왜?'를 다섯 번 물어 진짜 원인 찾기": { text: "알림을 늦게 붙임 → 왜? 마지막에 했다 → 왜? 작은 할 일에 없었다 → 왜? 나눌 때 빠졌다 → 왜? 꼭 할 일 표를 다시 안 봤다", alts: ["들어올 때 확인을 끝에 붙임 → 왜? 처음엔 필요 없어 보였다 → … → 까닭: 남의 정보를 늦게 떠올렸다", "잰 값이 없음 → 왜? 잴 시간이 없었다 → … → 까닭: 잴 날을 정하지 않았다"], refs: [[4, SPLIT]] },
    "정보가 샐 뻔했던 일이나 아찔했던 일 적기": { text: "알림 열쇠를 코드에 넣을 뻔했다 — 검사로 막았다", alts: ["없었어요 — 다음엔 올리기 전에 검사 먼저", "회원 연락처가 알림 글에 들어갈 뻔했다"], refs: [[5, SECRET]] },
    "배운 것을 다음에 쓸 수 있게 남기기": { text: "다음엔 알림 같은 것도 작은 할 일에 먼저 / 다음엔 들어올 때 확인을 처음부터", alts: ["다음엔 잴 날을 먼저 정하기 / 다음엔 예시로 먼저 써 보기", "다음엔 남의 정보부터 적기"], refs: [[1, INFO]] },
    "마친 작업을 저장소에 올려 두기": { text: "문서와 코드 — 커밋: 동아리 행사 신청 앱 첫 판 완성 · 비밀값은 올리지 않기", alts: ["문서 폴더만 — 커밋: 단계 문서 정리 · 비밀값은 올리지 않기", "코드만 — 커밋: 신청과 알림 · .env는 빼고"], refs: [] },
  } };
  const EXAMPLE_PREP = { 1: ["1단계에서 정한 불편을 다시 읽기", "이번에 안 만들 것 하나 떠올리기"], 2: ["꼭 할 일이 몇 개인지 세기", "'곧' · '빨리' 같은 말 찾아 두기", "남의 정보가 무엇인지 다시 보기"],
    3: ["3단계 기능 목록 다시 보기", "써 본 적 있는 만드는 방법 떠올리기"], 4: ["고른 만드는 방법 다시 보기", "처음부터 끝까지 이을 흐름 하나 정하기"],
    5: ["뼈대가 도는지 다시 확인하기", "만들 기능마다 확인 방법 떠올리기"], 6: ["2 · 3단계에서 정한 숫자 찾기", "잴 때 쓸 시계나 셀 방법 준비하기"],
    7: ["지난 단계 문서와 결정 기록 다시 보기", "잘된 점 하나 · 아쉬운 점 하나 떠올리기"] };
  //   prev — 지난 단계 결과(서버 /api/stagedraft와 같은 [{ stage, items }]). 재료는 from(1단계 칸 자리 그대로) 또는 refs([단계, 할 일 글 또는 자리]) — 그 등급에 없는 칸은 버린다
  function exampleStageDraft(stage, criteria, prev = []) {
    const ex = EXAMPLE_STAGE[stage]; if (!ex || !Array.isArray(criteria)) return null;
    const list = Array.isArray(prev) ? prev : [];
    const at = (s, key) => { const p = list.find((y) => y && y.stage === s), items = p && Array.isArray(p.items) ? p.items : []; return typeof key === "number" ? (items[key] ? key : -1) : items.findIndex((x) => x && x.name === key); };
    const items = criteria.map((c) => { const x = ex[c.text]; if (!x) return null;
      const from = x.from ? x.from : (x.refs || []).map(([s, key]) => ({ s, i: at(s, key) })).filter((r) => r.i >= 0);
      const { refs, ...rest } = x; return { ...rest, from }; });
    return items.every(Boolean) ? { items, prep: [...EXAMPLE_PREP[stage]], example: true } : null;
  }
  // 연습(서버 없이 FR-10)의 예시 초안 — 화면에 '예시예요'를 같이 적는다. 1단계 연습 글(EXAMPLES[0])과 같은 이야기
  const EXAMPLE_DRAFT = { topic: "동아리 행사 신청 앱", pain: "동아리 행사 신청을 종이로 받아서 누가 냈는지 매번 헷갈려요", change: "신청이 한곳에 모이고, 마감 전에 알림이 가요",
    who: "동아리 운영진 3명과 회원 40명", size: "medium", sizeWhy: "신청 받기와 알림 — 흔히 쓰는 방법으로 바로 풀려요" };
  // 적은 글 전부 — 어디쯤인지 보기(judge)에 보내는 작업 글. 처음 말한 것(idea)이 맨 위
  const textOf = (q, idea) => [String(idea || "").trim(), ...(q ? q.objs.flatMap((o, i) => (q.lines[i] || []).map((l) => `${o.name}: ${l}`)) : [])].filter(Boolean).join("\n");
  // 연습(서버 없이)의 완료 보고 — 적은 줄이 있으면 그 할 일을 한 것으로. 진짜 AI는 서버(/api/judge)가 본다. 모양은 서버 답과 같아서 parseJudgement를 그대로 지난다
  // next: 서버 답의 모양(parseJudgement가 요구한다 — 질문 · 선택지 2~4). 할 일을 다 적었으면 화면은 '넘어가기 전 확인'으로 가서 이 질문은 보이지 않는다
  function localJudgement(q, reason) {
    return { stage: q.chap, reason: reason || `${LABEL(q.chap)} 할 일을 적은 대로 봤어요 — 연습이라 글의 내용은 보지 않아요`,
      criteria: q.objs.map((o, i) => { const l = q.lines[i] || []; return { text: o.name, term: o.term, met: l.length > 0, evidence: l.length ? `${o.name}: ${l[0]}` : "" }; }),
      next: { what: "아직 안 적은 할 일 적기", why: "연습이라 적은 줄만 보고 정해요", question: "다음은 무엇부터 할까요?", action: "고르면 적어 두고 다시 봐요", options: ["아직 안 적은 줄 적기", "적은 것 다듬기"] } };
  }
  // 위 줄의 진행 — "M개 중 k번째 할 일"(다 했으면 M)
  const progress = (q) => { const n = q ? q.objs.length : 0, i = curIdx(q); return { n, k: !q ? 0 : i < 0 ? n : i + 1 }; };

  const api = { nameOf, askOf, doneOf, BY, BY_WORD, proposalOf, fromOf, examplesOf, acceptedLine, fillAll, expectedResult, CONFIRM_REASON, easyOf, LABEL, roman, iconOf, chapIcon, RANKS, BANDS, rankOf, bandOf, lvOf, startLevel, levelUp, SIDES, sideOf, SHELL_COST, ITEMS, draw, oddsOk,
    itemOf, toggleWear, cleanWear, cleanOwned, makeQuest, withAI, SIZE_KEYS, SIZE_WORD, SIZE_TIER, WHO, WHO_AT, SIZE_AT, withDraft, draftOf, EXAMPLE_DRAFT,
    pickOf, withStageDraft, refit, DOC_PICKS, SHORT, shortOf, resultOf, exampleStageDraft, total, got, curIdx, isDone, filled, fill, setLine, retitle, rename, setNeed, question, example, textOf, localJudgement, progress };
  root.NavQuest = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
