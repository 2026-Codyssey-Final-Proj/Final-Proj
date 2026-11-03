// claude-drafted: 2026-10-30 — C-38 길 1 넘김 카드(결정 자료 C-38-다른-AI-도구로-넘기기 4절, 결정 모음 A-15 "11/1 전", 이재엽 "2번 부터 쭉 진행").
// 웹 Claude · 웹 ChatGPT · VS Code의 AI는 Floe가 아는 것(지금 단계 · 할 일 · 기준 · 계획)을 모른다. 그래서 그것을 한 덩어리 글로 만들어
// 사람이 복사해 그 채팅에 붙여 넣게 한다 — Floe는 밖에 아무것도 열지 않는다(MCP · 서버 없이). 답은 먹이 주기 · 채팅으로 돌려받고 판정은 Floe의 코드(ADR-0003).
// 넣지 않는 것: 파일 내용 · 먹이 주기가 뺀 구간 · 다른 사람의 정보 — 이 함수는 그것들을 받지도 않는다. 비밀값 · 메일 · 전화 모양은 redact(sensitive.js)로
// 칸마다 **자르기 전에** 가린다(자르는 경계에 걸친 키의 앞부분이 새지 않게 — 새 맥락 리뷰).
// 순수 함수 — 섬(app/47-handoff.js)이 쓰고 Node에서 시험한다(04-tests/navigator/handoff.test.js).
(function (root) {
  const MAX = 6000, IDEA_MAX = 300, LINE_MAX = 200, PLAN_MAX = 8;
  const head = (s, n) => { const t = String(s).slice(0, n), c = t.charCodeAt(t.length - 1); return c >= 0xd800 && c <= 0xdbff ? t.slice(0, -1) : t; };   // 앞 n자 — 끝에 짝 글자(이모지)의 반쪽이 남으면 뗀다(F-144-24: 화면 · 클립보드에 �로 보였다)
  const clip = (s, n) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > n ? `${head(t, n - 1)}…` : t; };

  const ASK = [
    "- 쉬운 말로, 초등학교 고학년도 알아듣게 답해 주세요. 어려운 말은 나오자마자 풀어 주세요.",
    "- 끝났는지는 Floe가 판단해요 — '다 됐다'고 정하지 말고, 위 할 일에서 빠진 칸이 있으면 짚어 주세요.",
    "- 답은 짧게, 칸 이름과 한 줄씩 적어 주세요 — 그 답을 Floe에 다시 붙여 넣어요.",
    "- 비밀번호 · 키 같은 값은 묻지도 적지도 말아 주세요.",
  ];

  // 할 일 칸 — 그 장의 퀘스트(끝냈어도 적은 줄이 있다) → 지난 결과(st.results[n]) → 기준 이름 순으로 고른다.
  // 이름은 줄임말이 아닌 전체 문장(밖의 AI가 빠진 것을 짚으려면), 채움은 퀘스트의 줄 수 또는 판정의 met(작업실 지도와 같은 규칙), 지금은 처음 못 채운 칸
  function cellsFrom({ quest = null, result = null, criteria = [] } = {}) {
    const items = result && Array.isArray(result.items) ? result.items : [];
    const names = quest ? quest.objs.map((o) => o.name) : items.length ? items.map((x) => x.name) : criteria.map((c) => c.text);
    const cells = names.map((name, i) => {
      const ql = quest ? quest.lines[i] || [] : [], rl = (items[i] && items[i].lines) || [];
      const filled = quest ? ql.length >= (quest.objs[i].need || 1) : rl.length > 0;
      return { name, line: ql[0] || rl[0] || "", done: filled || !!(criteria[i] && criteria[i].met) };
    });
    const now = cells.findIndex((c) => !c.done);
    if (now >= 0) cells[now].now = true;
    return cells;
  }

  // ctx = { project, idea, stage: { label, title }, cells: [{ name, line, done, now }], plan: [{ need, check, done }] }
  // redact — 글을 가리는 함수(sensitive.js의 redact). 단계를 모르면 넘길 것이 없어 빈 글
  function build(ctx, { redact = (t) => t } = {}) {
    const c = ctx || {}, stage = c.stage || {};
    const cut = (s, n) => clip(redact(String(s || "")), n);
    const where = [cut(stage.label, 40), cut(stage.title, 80)].filter(Boolean).join(" · ");
    if (!where) return "";
    const project = cut(c.project, 80), idea = cut(c.idea, IDEA_MAX);
    const out = ["[Floe 넘김 카드] 이 글은 Floe(바이브 코딩을 단계로 안내하는 앱)가 만든 지금 상태예요. 이것을 바탕으로 도와주세요.", ""];
    if (project) out.push(`프로젝트: ${project}`);
    out.push(`지금 단계: ${where}`);
    if (idea) out.push(`만들고 싶은 것: ${idea}`);
    const cells = (c.cells || []).map((x) => ({ ...x, name: cut(x.name, LINE_MAX), line: cut(x.line, LINE_MAX) })).filter((x) => x.name);
    if (cells.length) {
      out.push("", "이 단계의 할 일 (✓ 채움 · ▶ 지금 · ○ 아직)");
      for (const x of cells) out.push(x.done ? `✓ ${x.name}${x.line ? ` — 적은 줄: ${x.line}` : ""}` : x.now ? `▶ ${x.name} — 지금 할 일${x.line ? ` (적은 줄: ${x.line})` : ""}` : `○ ${x.name}`);
    }
    const plan = (c.plan || []).map((x) => ({ need: cut(x.need, LINE_MAX), check: cut(x.check, LINE_MAX), done: !!x.done })).filter((x) => x.need);
    if (plan.length) {
      out.push("", "맡길 일 (확정한 계획)");
      plan.slice(0, PLAN_MAX).forEach((x, i) => { out.push(`${i + 1}. ${x.need}${x.done ? " (끝남)" : ""}`); if (x.check) out.push(`   끝난 것 기준: ${x.check}`); });
      if (plan.length > PLAN_MAX) out.push(`그 밖에 ${plan.length - PLAN_MAX}개`);
    }
    out.push("", "부탁", ...ASK, "");
    const text = out.join("\n"), tail = "\n…(길어서 줄였어요)";
    return text.length > MAX ? head(text, MAX - tail.length) + tail : text;
  }

  const api = { MAX, build, cellsFrom };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeHandoff = api;
})(typeof window !== "undefined" ? window : globalThis);
