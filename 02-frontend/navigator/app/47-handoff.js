  // ── C-38 넘김 카드(길 1, 2026-10-30 — 결정 모음 A-15 "11/1 전", 이재엽 "2번 부터 쭉 진행"): 웹 Claude · ChatGPT · VS Code의 AI에 지금 상태를 넘긴다 ──
  //   섬의 '더 보기' 칩 '다른 AI에 넘기기' → 지금 단계 · 할 일(채운 칸) · 확정한 맡길 일 · 처음 말한 것을 한 덩어리 글로 복사(03-backend/navigator/handoff.js),
  //   비밀값 · 메일 · 전화 모양은 sensitive.js로 가린다 — 가리기를 못 불러오면 복사하지 않는다. 복사한 글은 채팅 위 카드로 보여 준다(무엇이 나가는지 사람이 본다) — 저장하지 않는다.
  //   답은 판정이 있으면 '받은 답 붙여 넣기'(먹이 주기 open-input), 퀘스트 중이면 채팅 칸으로 돌려받고, 끝났는지는 Floe의 판정이 정한다(ADR-0003). Floe는 밖에 아무것도 열지 않는다.
  const HO = window.FloeHandoff;
  let hoText = "", hoCopied = false;   // 지금 보여 주는 넘김 카드 글 · 복사됐나(켤 때마다 빈 값 — keep 하지 않는다)
  function handoffCtx() {
    const n = nowStage(), s = N.STAGES[n] || {};
    const criteria = st.j && st.j.stage === n ? st.j.criteria : crits(n).map((c) => ({ text: c.text }));
    const cells = HO.cellsFrom({ quest: st.quest && st.quest.chap === n ? st.quest : null, result: st.results[n] || null, criteria });
    const b = FP && st.plan && st.plan.confirmed ? st.plan : null;
    const plan = b ? b.plan.items.map((x) => ({ need: x.need, check: x.check, done: FP.stateOf(b, x.id) === "done" })) : [];
    return { project: project(), idea: st.idea || "", stage: { label: LB(n), title: s.title || "" }, cells, plan };
  }
  function handoffHTML() {
    if (!hoText) return "";
    // 먹이 주기는 단계 살펴보기(st.j)가 있을 때만 받은 글을 다룬다 — 아니면 채팅 칸으로(새 맥락 리뷰)
    const feed = !!st.j && !st.openInput;
    return `<div class="msg floro ho"><div class="b"><p><b>다른 AI에 넘길 글</b> — ${hoCopied ? "복사했어요." : "복사가 막혔어요 — 아래 글을 골라 직접 복사해요."} 웹 Claude · ChatGPT 채팅에 붙여 넣고, 받은 답은 ${feed ? "'받은 답 붙여 넣기'로 가져와요" : "아래 채팅 칸에 붙여 넣어요"}. 비밀번호 · 키처럼 보이는 값은 가렸어요.</p>
      <textarea class="ho-text" readonly rows="8" aria-label="다른 AI에 넘길 글">${esc(hoText)}</textarea>
      <div class="opts"><button type="button" class="b" data-act="handoff-copy">다시 복사</button>${feed ? `<button type="button" class="b" data-act="open-input">받은 답 붙여 넣기</button>` : ""}<button type="button" class="b ghost" data-act="handoff-close">닫기</button></div></div></div>`;
  }
  Object.assign(ACT, {
    "handoff-copy": async () => {
      if (!window.NavSensitive) return say("비밀값 가리기를 불러오지 못해 복사하지 않았어요 — 앱을 다시 켜 주세요");
      const t = HO.build(handoffCtx(), { redact: window.NavSensitive.redact });
      if (!t) return;
      hoText = t;
      try { await navigator.clipboard.writeText(t); hoCopied = true; } catch { hoCopied = false; }
      render();
    },
    "handoff-close": () => { hoText = ""; render(); },
  });
