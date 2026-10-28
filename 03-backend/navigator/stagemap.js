// claude-drafted: 2026-10-28 — C-54 지도(이재엽 2026-10-27 "문서지도랑 도전과제가 합쳐지면 … 처음 2단계로 전체 그림이 그려질거니까 … 어떻게 퀘스트로 준비할 수 있을지", 버튼 "탭 이름은 '도전과제' 그대로" · "확인은 한 번에").
// 도전과제 탭의 카드 지도 — 카드 하나 = 한 단계의 퀘스트(다섯 칸 진행 · 관문 남은 기준)와 그 단계 문서(있음 / 아직). 1 → 4, 5 → 8 차례(둘째 줄은 돌아온다), 단계 밖 문서(README · CLAUDE.md · 결정 기록)는 아래 줄.
// 2단계 칸을 다 채우면(2단계 결과가 있으면) 기획서(= 2단계 결과의 절)로 3 ~ 8단계 카드를 한 번에 그리고 '준비된 퀘스트'(① 생각 · ② 행동 · ③ 기록 · ④ 저장 · ⑤ 버전 + 근거 절)를 미리 채운다 — 사람이 맞아요(한 번에) / 고칠래요.
// AI로 채우는 것은 뒤로(C-56 맞춤 퀘스트 규칙으로 짓는다 — questfit 넘김 문서). 여기서는 규칙으로만: 절이 비면 '새로 정함'(C-51과 같은 규칙), 숫자 · 사람 · 날짜는 지어내지 않는다. 순수 함수 — Node 시험 04-tests/navigator/stagemap.test.js
(function (root) {
  // 단계(코드 n) ← 기획서(2단계 결과)의 몇 번 칸에서 오나: 3단계 기능 정리 ← 3절(한 문장에 한 가지) · 4단계 방법 ← 1절(무엇을) · 5 뼈대 · 6 만들기 ← 3절(기능) · 7 재 보기 · 8 돌아보기 ← 2절(왜 · 어디까지 · 언제 성공)
  const PLAN_OF = { 2: 2, 3: 0, 4: 2, 5: 2, 6: 1, 7: 1 };
  const OUTSIDE = [["README.md", "소개"], ["CLAUDE.md", "AI 안내"], ["docs/decisions.md", "결정 기록"]];
  const docPath = (slugs, n) => (slugs[n] ? `docs/${slugs[n]}/${slugs[n].slice(3)}.md` : "");

  // 준비된 퀘스트 — plan: 2단계 결과({ items: [{ name, lines }] }), criteria(n): 그 단계의 할 일 기준
  // 절은 번호가 아니라 **칸 이름**으로 찾는다(새 맥락 리뷰 2026-10-28) — 등급(Lite)에 따라 2단계 칸 수가 달라 번호가 다른 칸을 가리켰다. 그 이름의 칸이 없거나 비면 '새로 정함'
  function prepare({ stages = [], slugs = [], plan = null, criteria = () => [] } = {}) {
    const cards = {}, all = (stages[1] && stages[1].criteria) || [], items = plan && Array.isArray(plan.items) ? plan.items : [];
    for (let n = 2; n < stages.length; n++) {
      const want = all[PLAN_OF[n]] ? all[PLAN_OF[n]].text : "", at = want ? items.findIndex((x) => x && x.name === want) : -1, item = at >= 0 ? items[at] : null;
      const line = item && Array.isArray(item.lines) ? String(item.lines[0] || "").trim() : "";
      cards[n] = { think: line || stages[n].gets || "", act: stages[n].does || "", record: (criteria(n) || []).map((c) => c.text), save: docPath(slugs, n), ver: `V.${n + 1}`,
        from: line ? `기획서 ${at + 1}절 '${item.name}'` : "새로 정함" };
    }
    return { cards };
  }

  // 카드 여덟 + 아래 줄 문서 — have: 작업 폴더에 있는 문서 경로(Set), prep: prepare()의 결과 + { ok }
  function build({ stages = [], slugs = [], results = {}, j = null, quest = null, finished = false, have = new Set(), prep = null } = {}) {
    const cur = finished ? stages.length : j ? j.stage : quest ? quest.chap : 0;
    const cards = stages.map((s, n) => {
      const r = results[n], q = quest && quest.chap === n ? quest : null;
      const state = n < cur ? "done" : n === cur ? "now" : prep ? (prep.ok ? "ready" : "pending") : "later";
      const prog = q ? { k: q.objs.filter((o, i) => (q.lines[i] || []).length >= o.need).length, n: q.objs.length } : null;   // 끝난 카드는 숫자 없이 '지났어요'(새 맥락 리뷰 — n/n은 정보가 없다)
      const path = docPath(slugs, n);
      return { n, label: n + 1, title: s.title, short: s.short, state, q: prog, gateLeft: j && j.stage === n && Array.isArray(j.criteria) ? j.criteria.filter((c) => !c.met).length : 0,
        doc: { path, has: !!path && have.has(path) }, prepared: n > 1 && prep && prep.cards && prep.cards[n] ? prep.cards[n] : null };
    });
    return { cur, cards, docs: OUTSIDE.map(([path, what]) => ({ path, what, has: have.has(path) })), canDraw: !!results[1] && !prep, drawn: !!prep, confirmed: !!(prep && prep.ok) };
  }

  const api = { PLAN_OF, prepare, build };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.NavStageMap = api;
})(typeof window !== "undefined" ? window : globalThis);
