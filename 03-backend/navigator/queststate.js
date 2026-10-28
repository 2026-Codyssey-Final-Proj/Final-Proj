// claude-drafted: 2026-10-28 — C-56 R-3 · R-4 맞춤 퀘스트의 상태 넷(이재엽 "너무 지금 형식적인 질문이야 … 이미 있는 내용이라면 어떤식으로 작성할지", 버튼 "'옮김' 새 값"). test-1에서 본 틈(같은 글 두 번 · 조건이 안 맞는데 '됨' · '아직 모름'이 7단계까지 · 코드 0개로 6단계 통과)을 코드가 막는다.
//   쓰기 — 사람만 아는 것이 남음(빈칸이 있는 초안). 옮겨 옴 — 지난 칸에 이미 있는 글(확인만, 다시 쓰지 않음). 건너뜀 — 기준에 적힌 조건이 안 맞음(까닭을 문서 · 결정 기록에, F-62와 같은 줄). 먼저 — 앞 칸이 비어 할 수 없음(그 칸으로, 관문은 닫힌 채).
//   규칙으로 정할 수 있는 것만 코드가 정한다 — 모르는 사실은 null로 두고 '쓰기'로 둔다(지어내지 않는다). 판정 · 관문 규칙(navigator.js)은 그대로. 순수 함수 — Node 시험 04-tests/navigator/queststate.test.js
(function (root) {
  const STATES = ["write", "moved", "skip", "first"];
  const STATE_WORD = { write: "쓰기", moved: "옮겨 옴", skip: "건너뜀", first: "먼저" };
  const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ"];
  const UNMEASURED = /아직\s*(못|안|모름)|못\s*(잼|쟀|재)|재지\s*못|모르겠/;
  const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
  const CODE_RE = /\.(m?[jt]sx?|cjs|py|java|kt|go|rb|rs|c|h|cc|cpp|cs|php|swift|html?|css|scss|vue|svelte|sh|sql)$/i;
  // 기준 글로 칸을 찾는다(등급마다 칸 번호가 달라 번호로 찍지 않는다 — stagemap과 같은 까닭)
  const FEATURE_LINE = "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", TRACE_LINE = "기능마다 어디서 나온 생각인지 표로 잇기 (기능이 5개 이상일 때)";
  const SUCCESS_LINE = "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기", OUT_LINE = "다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기";
  const MEASURE_LINE = "2단계에서 정한 숫자를 실제로 재 보기", PUBLIC_LINE = "공개한 앱에 아무나 들어오지 못하게 되어 있는지 확인하기";
  const lineOf = (r, name) => { const it = r && Array.isArray(r.items) ? r.items.find((x) => x && x.name === name) : null; return it && Array.isArray(it.lines) ? it.lines : null; };
  const stageOf = (results, n) => (results && (results[n] || results[String(n)])) || null;

  // 사실 — 결과(단계마다 { items: [{ name, lines }] }) · 파일 목록(/api/files의 { path, dir })에서. 모르면 null
  function factsFrom({ results = {}, files = null, codeless = false } = {}) {
    const feat = lineOf(stageOf(results, 2), FEATURE_LINE), succ = lineOf(stageOf(results, 1), SUCCESS_LINE), out = lineOf(stageOf(results, 1), OUT_LINE);
    const outText = out ? norm(out.join(" ")) : "";
    return {
      features: feat ? feat.flatMap((l) => String(l).split(/\s\/\s/)).filter((l) => norm(l)).length : null,   // 3단계 Ⅰ은 '~하면, 앱은 ~한다'를 ' / '로 이어 한 줄(navigator.js STAGE_HINT) — 줄 수가 아니라 조각 수(새 맥락 리뷰 2026-10-28 막힘)
      publish: !outText ? null : /공개\s*(안|하지)|공개하지|비공개|공개는\s*안/.test(outText) ? false : /공개/.test(outText) ? true : null,
      success: !succ || !succ.length ? null : succ.some((l) => /\d/.test(l) && !UNMEASURED.test(l)),
      codeFiles: Array.isArray(files) ? files.filter((f) => f && !f.dir && CODE_RE.test(String(f.path || ""))).length : null,
      codeless: !!codeless,   // 6단계에서 '코드 파일을 만드시겠습니까?'에 아니요(결정 모음 A-04 — 문서만 만드는 일일 수 있다, F-70) — 코드 0개여도 막지 않는다
    };
  }

  // 칸 하나의 상태 — text: 그 칸의 글(초안 또는 적은 줄), prev: 지난 단계 결과들 [{ stage, items }], facts: factsFrom
  function stateOf({ stage, i, name = "", text = "", prev = [], facts = {} } = {}) {
    const t = norm(text);
    if (t) for (const p of prev) for (let k = 0; k < (p.items || []).length; k++) { const it = p.items[k]; if (it && Array.isArray(it.lines) && it.lines.some((l) => norm(l) === t)) return { state: "moved", from: { s: p.stage, i: k }, why: `${p.stage + 1}단계 ${ROMAN[k] || k + 1}에서 정한 글 그대로` }; }
    const is = (line, idx) => (name ? name === line : i === idx);   // 기준 글이 있으면 글로, 없으면(시험 · 옛 기록) 그 등급의 기본 번호로
    if (stage === 2 && is(TRACE_LINE, 3) && facts.features != null && facts.features < 5) return { state: "skip", why: `기능이 ${facts.features}개 — 5개 이상일 때만 해요` };
    if (stage === 6 && is(PUBLIC_LINE, 3) && facts.publish === false) return { state: "skip", why: "앱을 공개하지 않아요 — 공개할 때만 해요" };
    if (stage === 6 && is(MEASURE_LINE, 0) && facts.success === false) return { state: "first", go: { s: 1, i: 1 }, why: "2단계 '언제 성공'의 숫자가 비어 있어요 — 그것부터 적어요" };
    if (stage === 5 && facts.codeFiles === 0 && !facts.codeless) return { state: "first", go: { s: 4, i: 0 }, code: true, why: "코드 파일이 없어요 — 5단계 뼈대 코드부터" };   // code — 화면이 '코드 파일을 만드시겠습니까?'로 묻는다(A-04)
    return { state: "write" };
  }
  // 퀘스트의 칸마다 — 글은 적은 줄이 있으면 그것, 아니면 초안(draft.items[i].text · 1단계는 pain · change · who)
  function questStates(q, { prev = [], facts = {}, draftOf = null } = {}) {
    if (!q || !Array.isArray(q.objs)) return [];
    const draft = (i) => { if (draftOf) return draftOf(q, i); const d = q.draft; if (!d) return ""; if (q.chap === 0) return i === 0 ? d.pain : i === 1 ? d.change : i === 2 ? d.who : ""; const it = d.items && d.items[i]; return it && !it.pick ? it.text : ""; };
    return q.objs.map((o, i) => { const name = o.name, text = (q.lines[i] || [])[0] || draft(i) || ""; return { i, name, ...stateOf({ stage: q.chap, i, name, text, prev, facts }) }; });
  }
  const gateOpen = (states) => !states.some((s) => s.state === "first");
  const allOkOnly = (states) => states.filter((s) => s.state === "moved").map((s) => s.i);

  const api = { STATES, STATE_WORD, factsFrom, stateOf, questStates, gateOpen, allOkOnly };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.NavQuestState = api;
})(typeof window !== "undefined" ? window : globalThis);
