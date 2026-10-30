  // ── 준비 계획(C-34) · 맡길 일과 보고(C-32) — claude-drafted: 2026-10-24 (이재엽 "한번에 내용들을 넣으면 어떻게 준비하고 기준들을 사람들이 확인해서 너한테 의견들을 바로바로" ·
  //    버튼 "처음 설정 새 칸 + 맡기기" · "Floe의 AI 한 번" · "Claude Code가 기준마다 보고" · "맡길 일 목록으로") ──
  // 같은 날 C-35(이재엽 "맡기기의 기능은 … 우리 오버레이에서 확인이 가능하게 그리고 이것들을 순차적으로 할려면 퀘스트내용에서 진행" · 버튼 "맡길 일 퀘스트 하나로" · "채팅에서 전부"):
  // 계획판(판)을 없애고 채팅의 지금 말로 — 채팅 칸에 한 번에 붙여 넣기 → 계획 세우기(/api/plan — AI 한 번, 도구 없이) → 플로로의 말 안에서 줄마다 맞아요 / 고칠래요 · 의견 · 답 → 다시 세우기 또는 확정 →
  // 퀘스트 창의 '맡길 일' 퀘스트(순서대로) → 지금 줄 맡기기(/api/task/start + checks — 그 기준으로 Claude Code가 끝에 보고) → 허락 카드 · 보고도 채팅에 → 맞아요(끝냄) / 다르게 봐요(의견 달고 다시) → 다음 줄.
  // 규칙은 plan.js, 서버 없이(연습)는 예시 계획 · 예시 보고
  const PL_BUSY = { make: "플로로가 계획을 세우는 중이에요", hand: "Claude Code에 넘기는 중이에요", ask: "플로로가 답을 찾는 중이에요", stage: "플로로가 다음 장 초안을 만드는 중이에요", ship: "문서를 만드는 중이에요", again: "플로로가 다른 예시를 만드는 중이에요" };   // stage · ship — C-37(기다리는 말만 같이 쓴다)
  const planLive = () => canLive && st.mode === "live";
  // 채팅이 지금 준비 계획 · 맡길 일을 보이나 — 맡길 일을 골랐어도 경고 · 오류 · 관문 · 먹이 정리가 먼저(momentToday 순서). 지금 말 · 입력 칸 · 힌트 · 위 줄이 같이 쓴다(2026-10-24 리뷰)
  const planNow = () => !!FP && st.qfocus === "plan" && !st.warn && !st.error && st.screen !== "gate" && !st.meal;
  const planPractice = (b) => !planLive() || !!(b && b.example);   // 예시 계획은 모드를 바꿔도 연습으로(진짜 Claude Code로 넘기지 않는다 — FR-10, 2026-10-24 리뷰)
  const repChecks = (r) => `<ul>${r.items.map((c) => `<li class="${c.done ? "y" : "n"}">${c.done ? OK_ICON : CIRCLE} ${esc(c.check)}${c.evidence ? ` <span class="meta">— ${esc(c.evidence)}</span>` : ""}</li>`).join("")}</ul>`;
  const planMini = (b, i) => `<span class="mini" aria-hidden="true">${b.plan.items.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</span>`;
  // 단계 퀘스트 쪽에서 맡길 일로 가는 칩 — 보고가 와 있으면 눈에 띄게(보고가 와도 지금 할 퀘스트를 저절로 바꾸지 않는다 — 고르는 것은 사람, 2026-10-24 리뷰)
  const planChip = () => { const b = st.plan, p = b && b.confirmed ? FP.progress(b) : null, rep = !!b && FP.stateOf(b, FP.next(b)) === "report";
    return { label: !b ? "계획 세우기" : !b.confirmed ? "계획 확인 이어 하기" : rep ? "맡길 일 — 보고가 왔어요" : p.done < p.total ? `맡길 일 ${p.done + 1} / ${p.total}` : "맡길 일 다 끝냈어요", act: "plan-open", kind: rep ? "soft" : "ghost" }; };
  // 채팅의 지금 말 — 넣기 → 확인 → 확정 → 지금 줄 맡기기 → 맡김 중 → 보고 → 다음 줄. momentToday가 st.qfocus === "plan"이면 부른다
  function momentPlan() {
    const b = st.plan, ex = b && planPractice(b) ? `<span class="note">예시예요 · 연습</span>` : "";
    if (!b) {
      const has = st.planDraft.trim() !== "";
      return { tone: "blue", mood: has ? "happy" : "look", meta: `<span class="mm-stage">준비 계획</span><span>한 번에 넣기</span>`,
        title: has ? "받은 글로 계획을 세울까요?" : "만들고 싶은 것 · 요구 · 문제 글을 한 번에 붙여 넣어요",
        sub: has ? `글 ${st.planDraft.length.toLocaleString()}자 — 더 붙여 넣으면 이어 붙여요.` : "아래 칸에 붙여 넣고 보내요. 여러 번 나눠 보내도 하나로 모아요.",
        body: `${has ? `<blockquote class="pl-draft">${esc(st.planDraft.length > 400 ? `${st.planDraft.slice(0, 400)}…` : st.planDraft)}</blockquote>` : ""}${
          canLive ? `<label class="chk"><input type="checkbox" data-act="plan-readme" ${st.planReadme ? "checked" : ""}>작업 폴더의 README · 파일 이름 · 단계 문서에서 정한 것도 같이 읽어요</label>` : ""}<p class="mc-fine">${
          planLive() ? "계획 세우기를 누르면 AI를 한 번 불러요 — 넣은 글(같이 읽기를 켜면 README · 파일 이름 · 단계 문서에서 정한 것도)과 이번에 고른 가져온 것만 보내고, 파일을 고치지 않아요." : "연습이라 예시 계획을 보여 줘요(AI를 부르지 않아요)."}</p>`,
        acts: [...(has ? [{ label: "계획 세우기", act: "plan-make", key: "c-Enter", pri: true }, { label: "글 비우기", act: "plan-clear" }] : []), { label: "한 줄만 적어 맡기기", act: "plan-direct" }] };
    }
    if (!b.confirmed) {
      const left = FP.unmarked(b);
      return { tone: "blue", mood: "look", meta: `<span class="mm-stage">준비 계획 · ${b.v}판</span><span>${left ? `아직 안 본 줄 ${left}개` : "다 봤어요"}</span>${ex}`,
        title: esc(b.plan.say || "계획을 세웠어요. 줄마다 맞는지 봐 주세요"), sub: "맞으면 맞아요, 다르면 고칠래요를 누르고 어떻게 고칠지 적어요. 모두 맞아요면 확정해요.",
        body: planReviewBody(b),
        acts: [{ label: "이대로 확정", act: "plan-confirm", key: "c-Enter", pri: true, disabled: !FP.canConfirm(b) }, { label: "의견 보내고 다시 세우기", act: "plan-again", disabled: !(FP.hasFeedback(b) && planLive()) },
          { label: "처음부터 다시 적기", act: "plan-reset" }] };
    }
    const id = FP.running(b) || FP.next(b), p = FP.progress(b);   // 맡김 중인 줄이 먼저(예전 판은 순서 밖의 줄이 맡김 중일 수 있다)
    if (!id) return { tone: "green", mood: "wow", meta: `<span class="mm-stage">맡길 일</span><span>${p.total}개 모두 끝냈어요</span>${ex}`, title: "맡길 일을 다 끝냈어요!",
      sub: "끝낸 줄과 보고는 퀘스트 창의 맡길 일에 남아 있어요.", acts: [{ label: "새 계획 적기", act: "plan-reset", pri: true }] };
    const i = b.plan.items.findIndex((x) => x.id === id), x = b.plan.items[i], w = b.work[id] || {}, s = FP.stateOf(b, id);
    const meta = `<span class="mm-stage">맡길 일 · ${p.total}개 중 ${i + 1}번째</span>${planMini(b, i)}${ex}`;
    if (s === "running") return { tone: "gray", mood: "think", meta, title: st.halting ? `Claude Code를 멈추는 중이에요${dots}` : `Claude Code가 일하고 있어요${dots}`, sub: `${ROMAN(i)}. ${esc(x.need)}`, passing: true,   // halting — '멈추기'를 누르고 서버가 끌 때까지(최대 10초) 단추 없이
      body: `<p class="mc-fine">허락이 필요하면 이 말 위에 카드가 떠요. 끝나면 기준마다 해냈는지 알려 줘요.</p>`, acts: st.halting ? [] : [{ label: "진행 보기", act: "base-ai", kind: "ghost" }, { label: "멈추기", act: "plan-unwait", kind: "ghost" }] };   // 진행 보기 — Claude Code가 한 일 한 줄씩(AI 진행 판). 멈추기 — 맡긴 일을 끄고 그 줄을 끝맺어 바로 다시 맡길 수 있게(F-103-7)
    if (s === "report" && w.report) { const v = w.verdict || N.reportVerdict(w.report, "done");   // C-50 서버가 기준을 세어 준 미리 보기(없던 옛 기록만 화면이 센다)
      return { tone: v.kind === "done" ? "green" : "amber", mood: v.kind === "done" ? "happy" : "think", meta, title: `보고가 왔어요 — 세어 보니 ${v.word} (기준 ${Number(w.report.total) || 0}개 중 ${Number(w.report.done) || 0}개)`, sub: esc(w.report.easy),
        body: planReportBody(b, id), acts: planReportActs(id, !!w.report.ask, v.kind === "done") }; }
    if (st.dbg && st.dbg.id === id && st.dbg.v === b.v && st.dbg.n === (w.fail && w.fail.n) && FP.canDebug(b, id)) return dbgCard(meta);   // C-64 오류 같이 보기 — 질문 하나씩(판 · 실패 횟수가 같을 때만 — 새 계획의 같은 번호 줄에 옛 카드가 뜨지 않게)
    const wd = FP.debugOf(w), dbgDone = wd ? `<p class="pl-ans"><b>오류 같이 본 것</b> ${esc(`오류: ${wd.err.length > 120 ? `${wd.err.slice(0, 119)}…` : wd.err} · 바로 전에 바꾼 것: ${wd.changed} · 다시 하면 또 나나: ${wd.again}`)} — 다시 맡기면 이 답과 '다시 안 나는지 보는 시험 하나'가 같이 가요</p>` : "";
    return { tone: "blue", mood: face()[0], meta, title: `${ROMAN(i)}. ${esc(x.need)}`, sub: `다 됐는지 보는 기준 — ${esc(x.check)}`,
      body: `${w.fail ? `<p class="pl-ans"><b>지난번에 끝까지 못 했어요${w.fail.n > 1 ? `(${w.fail.n}번)` : ""}</b> ${esc(w.fail.why)}</p>` : ""}${w.note ? `<p class="pl-ans"><b>지난번 의견</b> ${esc(w.note)}</p>` : ""}${dbgDone}`,   // C-50 실패는 남겨 보인다(조용히 '남음'으로 되돌리지 않는다)
      foot: planPractice(b) ? "연습이라 Claude Code에 보내지 않고 예시 보고를 받아요" : "맡기면 Claude Code가 이 폴더에서 일하고, 끝나면 기준마다 해냈는지 알려 줘요",
      acts: [{ label: w.note || w.fail ? "다시 맡기기" : "맡기기", act: "plan-hand", key: "Enter", pri: true }, ...(FP.canDebug(b, id) ? [{ label: wd ? "오류 다시 적기" : "오류 같이 보기", act: "dbg-open" }] : []), { label: "새 계획 적기", act: "plan-reset", kind: "ghost" }] };   // C-64 — 끝까지 못 간 줄에서만
  }
  // ── C-64 오류에 막혔을 때(2026-10-30 — 이재엽 버튼 "10/31까지 작게"): 끝까지 못 간 맡길 일에서 한 번에 하나씩 묻는다(plan.js DEBUG_QS) ──
  //   ① 오류 글 그대로 ② 바로 전에 바꾼 것 ③ 다시 하면 또 나나(예 · 아니요 · 모름). 모르면 '모름'으로 넘어가고, 그만두면 아무것도 붙이지 않는다.
  //   답은 메모리(st.dbg)에만 두다가 다 되면 그 줄에 붙인다(FP.withDebug — 키 모양은 가리고 홈 경로는 ~로). 맡기는 것은 사람이 '다시 맡기기'를 누를 때
  function dbgCard(meta) {
    const k = st.dbg.i, q = FP.DEBUG_QS[k], last = k === FP.DEBUG_QS.length - 1, v = esc(st.dbg.a[q.key] || "");
    const field = q.choices ? "" : q.key === "err"
      ? `<textarea class="mc-input" data-act="dbg-text" rows="4" aria-label="${esc(q.q)}" placeholder="예) TypeError: Cannot read properties of undefined (reading 'name')">${v}</textarea>`
      : `<input class="mc-input" data-act="dbg-text" value="${v}" aria-label="${esc(q.q)}" placeholder="예) form.js를 고쳤어요 · npm install을 했어요">`;
    return { tone: "amber", mood: "think", meta, title: `오류 같이 보기 — ${k + 1} / ${FP.DEBUG_QS.length}`, sub: esc(q.q),
      body: `${field}<p class="mc-fine">모르면 '모름'으로 넘어가요. 키 · 비밀번호 모양은 가리고, 내 컴퓨터 이름이 든 경로는 ~로 바꿔서 맡겨요.</p>`,
      acts: q.choices ? [...q.choices.map((c, j) => ({ label: c, act: "dbg-pick", i: j, ...(j === 0 ? { pri: true } : {}) })), { label: "그만두기", act: "dbg-close", key: "Escape", kind: "ghost" }]
        : [{ label: last ? "다 됐어요" : "다음", act: "dbg-next", key: "c-Enter", pri: true }, { label: "모름", act: "dbg-skip" }, { label: "그만두기", act: "dbg-close", key: "Escape", kind: "ghost" }] };
  }
  const dbgFocus = () => requestAnimationFrame(() => { const t = $nav.querySelector("[data-act=dbg-text]"); if (t) t.focus(); });
  function dbgStep() {
    const d = st.dbg; if (!d) return;
    if (d.i < FP.DEBUG_QS.length - 1) { st.dbg = { ...d, i: d.i + 1 }; render(); dbgFocus(); return; }
    if (!window.NavSensitive) { st.dbg = null; render(); return say("가리는 도구(sensitive.js)를 불러오지 못해서 답을 붙이지 않았어요 — 화면을 다시 열어 주세요"); }   // 요구: 가린 뒤 보낸다
    st.plan = FP.withDebug(st.plan, d.id, d.a, (s) => window.NavSensitive.redact(s)); st.dbg = null; save(); render();
    say("답을 붙였어요 — '다시 맡기기'를 누르면 고칠 일과 다시 안 나는지 보는 시험을 같이 맡겨요");
  }
  // 지식 퀘스트 C-51(2026-10-29 — PRD 6절 · 9절 9번): 줄마다 근거 한 줄(없으면 '새로 정함'), 앞의 결정과 다르면 그 표시와 어느 쪽을 따를지(이 줄대로 = 맞아요 · 앞의 결정대로 = 고칠래요 + 의견)
  const planBasisHTML = (x) => `${x.basis ? `<span class="meta">근거 — ${esc(x.basis)}</span>` : ""}${x.diff ? `<span class="meta pl-diff"><b>앞의 결정과 다름</b> — 앞에서 정한 것은 '${esc(x.diff.was)}', 이 줄은 '${esc(x.diff.now)}'. 어느 쪽을 따를까요?
    <button type="button" class="btn" data-act="plan-ok" data-id="${esc(x.id)}" aria-pressed="${(st.plan && st.plan.marks[x.id]) === "ok"}">이 줄대로</button><button type="button" class="btn" data-act="plan-follow" data-id="${esc(x.id)}">앞의 결정대로</button></span>` : ""}`;
  // 확인하는 중 — 이해한 것 셋 · 줄마다 맞아요 / 고칠래요(+ 의견) · 준비할 것 · 물을 것(답) · 전체 의견(채팅 칸에 적어도 여기로)
  function planReviewBody(b) {
    const p = b.plan;
    const sum = `<dl class="pl-sum"><div><dt>풀려는 문제</dt><dd>${esc(p.problem)}</dd></div><div><dt>이미 있는 것</dt><dd>${esc(p.have)}</dd></div><div><dt>아직 없는 것</dt><dd>${esc(p.missing)}</dd></div></dl>`;
    const items = `<ol class="pl-items">${p.items.map((x) => { const m = b.marks[x.id] || ""; return `<li class="pl-it ${m}"><div class="pl-txt"><b>${esc(x.need)}</b><span class="meta">기준 — ${esc(x.check)}</span>${planBasisHTML(x)}</div>
      <div class="pl-btns" role="group" aria-label="이 줄이 맞나요"><button type="button" class="btn" data-act="plan-ok" data-id="${esc(x.id)}" aria-pressed="${m === "ok"}">맞아요</button><button type="button" class="btn" data-act="plan-fix" data-id="${esc(x.id)}" aria-pressed="${m === "fix"}">고칠래요</button></div>${
      m === "fix" ? `<textarea class="mc-input" data-act="plan-note" data-id="${esc(x.id)}" rows="2" aria-label="어떻게 고칠까요" placeholder="어떻게 고칠까요? 예) 연락처 칸은 빼요">${esc(b.notes[x.id] || "")}</textarea>` : ""}</li>`; }).join("")}</ol>`;
    const prep = p.prep.length ? `<p class="kicker">준비할 것</p><ul class="pl-prep">${p.prep.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    const ask = p.ask.length ? `<p class="kicker">플로로가 물어요</p>${p.ask.map((q, i) => `<label class="pl-ask"><span>${esc(q)}</span><input class="mc-input" data-act="plan-answer" data-i="${i}" value="${esc(b.answers[i] || "")}" placeholder="답 — 모르면 비워 둬요"></label>`).join("")}` : "";
    return `${sum}${items}${prep}${ask}<label class="pl-ask"><span>전체 의견(있으면) — 채팅 칸에 적어도 여기로 와요</span><textarea class="mc-input" data-act="plan-general" rows="2">${esc(b.general)}</textarea></label>`;
  }
  // 보고 — 기준마다 해냄 · 근거. Claude Code가 물은 것이 있으면 답 칸(답하면 그 답을 붙여 이어서 맡긴다 — C-33), 다르게 봐요 · 물어보기를 누르면 적는 칸
  function planReportBody(b, id) {
    const r = b.work[id].report, ans = st.planAns[id];
    return `<div class="pl-rep">${repChecks(r)}${r.ask ? `<label class="pl-ask"><span>Claude Code가 물어요: ${esc(r.ask)}</span><input class="mc-input" data-act="plan-reply" data-id="${esc(id)}" value="${esc(st.planReply[id] || "")}" placeholder="답을 적고 '답하고 이어서 맡기기'(Ctrl+Enter)"></label>` : ""}${
      ans ? `<p class="pl-ans"><b>플로로의 답</b> ${esc(ans)}</p>` : ""}${
      st.planRej === id ? `<textarea class="mc-input" data-act="plan-rej-note" rows="2" aria-label="어디가 다른가요" placeholder="어디가 다른가요? 예) 목록 화면은 아직 없어요">${esc(st.planRejNote)}</textarea>`
      : st.planAsk === id ? `<input class="mc-input" data-act="plan-q" value="${esc(st.planQ)}" aria-label="플로로에게 물어볼 것" placeholder="이 보고에서 궁금한 것 — 예) 목록은 어디서 봐요?">` : ""}</div>`;
  }
  // 보고의 칩 — 맞아요(끝냄) / 다르게 봐요(의견 달고 다시) / 물어보기(이 보고에 대해 플로로에게 — Floe의 AI 한 번, C-32).
  //   Claude Code가 물었으면 답하고 이어서 맡기기가 먼저(Ctrl+Enter) — 답 칸에서 Ctrl+Enter가 Enter의 '맞아요'로 넘어가 줄을 끝내던 것(2026-10-24 리뷰)
  // C-50(2026-10-29): '맞아요'는 미리 판정이 '다 됨'일 때만 큰 단추(done) — 덜 됐으면 '다르게 봐요'와 같은 크기
  const planReportActs = (id, asked, done = true) => (st.planRej === id ? [{ label: "의견 달고 다시 맡기기", act: "plan-reject", key: "c-Enter", pri: true }, { label: "그만두기", act: "plan-rej-close", kind: "ghost" }]
    : st.planAsk === id ? [{ label: "물어보기", act: "plan-ask-send", key: "c-Enter", pri: true }, { label: "그만두기", act: "plan-ask-close", kind: "ghost" }]
    : asked ? [{ label: "답하고 이어서 맡기기", act: "plan-reply-send", key: "c-Enter", pri: true }, { label: "맞아요 — 끝냈어요", act: "plan-accept" }, { label: "다르게 봐요", act: "plan-rej-open" }, { label: "물어보기", act: "plan-ask-open" }]
    : [{ label: "맞아요 — 끝냈어요", act: "plan-accept", ...(done ? { key: "Enter", pri: true } : {}) }, { label: "다르게 봐요", act: "plan-rej-open", ...(done ? {} : { key: "Enter" }) }, { label: "물어보기", act: "plan-ask-open" }]);
  // 채팅 칸에 적은 말 — 계획이 없으면 넣는 글에 이어 붙이고, 확인하는 중이면 전체 의견, 보고가 왔으면 Claude Code의 물음에 답하거나 플로로에게 묻기
  function planSay(t) {
    const b = st.plan, id = b && FP.next(b), w = id && b.work[id];
    if (!b) {
      const all = `${st.planDraft.trim() ? `${st.planDraft.trim()}\n` : ""}${t}`;
      st.planDraft = all.slice(0, N.PLAN_MAX); save(); render();
      return say(all.length > N.PLAN_MAX ? `${N.PLAN_MAX.toLocaleString()}자까지만 받아요 — 뒷부분은 잘렸어요` : `받았어요 — 글 ${st.planDraft.length.toLocaleString()}자예요`);
    }
    if (!b.confirmed) { st.plan = { ...b, general: `${b.general.trim() ? `${b.general.trim()} ` : ""}${t}`.slice(0, 300) }; save(); render(); return say("전체 의견에 적었어요 — 다시 세울 때 같이 보내요"); }
    if (w && w.state === "report" && w.report) {
      if (w.report.ask) { st.planReply = { ...st.planReply, [id]: t }; return ACT["plan-reply-send"](); }
      st.planAsk = id; st.planQ = t; return askPlan(id);
    }
    render(); say(w && w.state === "running" ? "Claude Code가 일하는 중이에요 — 끝나면 보고가 와요" : "지금 줄을 맡기려면 '맡기기'를 눌러요");
  }
  // 퀘스트 탭(C-35) — 계획이 있으면 위에 '지금 할 퀘스트' 둘(단계 퀘스트 · 맡길 일). 고른 쪽을 채팅이 따른다
  function questTab() {
    if (!FP || !st.plan) return questPane();
    const q = st.quest, b = st.plan, p = b.confirmed ? FP.progress(b) : null, qp = q && q.phase === "quest" ? QU.progress(q) : null;
    const stageName = q && q.phase !== "done" ? `${LB(q.chap)} · ${esc(q.title)}` : st.j ? `${LB(st.j.stage)} · ${esc(stage().title)}` : "단계 퀘스트 — 아직 없어요";
    const opt = (v, name, sub) => `<button type="button" data-act="qfocus" data-v="${v}" aria-pressed="${st.qfocus === v}"><b>${name}</b><small>${sub}</small></button>`;
    return `<div class="qsel" role="group" aria-label="지금 할 퀘스트">${opt("stage", stageName, qp ? `${qp.n}개 중 ${qp.k}번째 할 일` : "채팅에서 이어 해요")}${
      opt("plan", "맡길 일", p ? `${p.total}개 중 ${p.done}개 끝냄` : `계획 ${b.v}판 · 확인하는 중`)}</div>${st.qfocus === "plan" ? planQuestPane(b) : questPane()}`;
  }
  // 맡길 일 퀘스트 — 왼쪽 목차(순서대로 끝냄 · 지금 · 아직), 오른쪽 고른 줄(요구 · 기준 · 받은 보고). 맡기기 · 보고 확인은 채팅에서 — 여기는 보기만
  function planQuestPane(b) {
    if (!b.confirmed) return `<div class="qempty"><b>계획을 확인하는 중이에요 (${b.v}판)</b>채팅에서 줄마다 맞아요 / 고칠래요를 누르고 확정하면, 이 창에 맡길 일이 순서대로 생겨요.</div>`;
    const items = b.plan.items, cur = FP.next(b), sel = items.some((x) => x.id === st.planSel) ? st.planSel : cur || items[items.length - 1].id;
    const word = (id) => { const s = FP.stateOf(b, id); return s === "done" ? "끝냄 ✓" : id !== cur ? "★ 아직" : s === "running" ? "맡김 중" : s === "report" ? "보고 왔어요" : (b.work[id] || {}).fail ? "다시" : "지금"; };   // 다시 — 지난번에 끝까지 못 한 줄(C-50)
    const toc = items.map((x, i) => `<button type="button" data-act="plan-sel" data-id="${esc(x.id)}" aria-pressed="${x.id === sel}" class="${FP.stateOf(b, x.id) === "done" ? "done" : x.id === cur ? "" : "lock"}">${ROMAN(i)}. ${esc(x.need)}<small>${word(x.id)}</small></button>`).join("");
    const k = items.findIndex((x) => x.id === sel), x = items[k], w = b.work[sel] || {};
    return `<div class="book"><div class="page l"><h4>목차 · 맡길 일</h4><div class="toc">${toc}</div></div>
      <div class="page r"><h3>${esc(x.need)}</h3><div class="meta">맡길 일 · ${items.length}개 중 ${k + 1}번째 · ${word(sel)}${planPractice(b) ? " · 예시예요" : ""}</div>
        <p><b>다 됐는지 보는 기준</b> — ${esc(x.check)}</p>${w.fail ? `<p><b>지난번에 끝까지 못 했어요${w.fail.n > 1 ? `(${w.fail.n}번)` : ""}</b> — ${esc(w.fail.why)}</p>` : ""}${w.note ? `<p><b>지난번 의견</b> — ${esc(w.note)}</p>` : ""}${w.report ? `<div class="pl-rep"><p>${esc(w.report.easy)}</p>${repChecks(w.report)}</div>` : ""}
        <p class="meta">${sel === cur ? "맡기기 · 보고 확인은 채팅에서 해요." : FP.stateOf(b, sel) === "done" ? "끝낸 줄이에요." : "앞 줄을 끝내면 열려요."}</p>
        <p><b>풀려는 문제</b> — ${esc(b.plan.problem)}</p></div></div>`;
  }
  // AI에게 묻는 것들 — 무엇을 기다리는지(planBusy)를 같이 보인다
  const planId = (el) => (el && el.dataset && el.dataset.id) || (st.plan ? FP.next(st.plan) : "");   // 보고 안의 단추는 data-id, 채팅의 칩은 지금 줄
  const planCall = async (kind, url, body) => { if (st.busy) return callAI(url, body); st.planBusy = kind; try { return await callAI(url, body); } finally { st.planBusy = ""; } };   // 바쁠 때는 앞 일의 '무엇을 기다리나'를 지우지 않는다(F-103-5)
  const carryTexts = () => (((st.carryUse || {})[st.j ? st.j.stage : 0]) || []).map((x) => x && x.text).filter(Boolean).slice(0, 3);   // C-51
  const carryBody = () => { const c = carryTexts(); return c.length ? { carry: c } : {}; };   // 고른 것이 없으면 보내지 않는다(전과 같은 본문)
  async function makePlan(skipCheck) {
    const text = st.planDraft.trim(); if (!text) return;
    if (!planLive()) { st.plan = FP.board(FP.EXAMPLE_PLAN, null, { example: true }); save(); render(); return say("연습이라 예시 계획이에요. 줄마다 맞는지 봐 주세요."); }
    if (!skipCheck && guard(text, "plan")) return;
    st.warn = null;
    const r = await planCall("make", "/api/plan", { text, readme: st.planReadme, ...carryBody() });   // carry — C-51 이번 단계에 쓰기로 고른 가져온 것(C-48)
    if (r.ok) { st.plan = FP.board(r.plan); save(); render(); fetchUsage(); return say(r.plan.say); }
    render(); say(r.reason || "계획을 세우지 못했어요");
  }
  // 다시 세우기 — 의견 · 답 · 전체 의견도 보내기 전에 비밀값 모양을 본다(2026-10-24 리뷰)
  async function revisePlan(skipCheck) {
    const b = st.plan; if (!b || !planLive() || !FP.hasFeedback(b)) return;
    const fb = FP.feedback(b);
    if (!skipCheck && guard([...fb.notes.map((n) => n.note), ...fb.answers.map((x) => x.a), fb.general].join("\n"), "planAgain")) return;
    st.warn = null;
    const r = await planCall("make", "/api/plan", { text: st.planDraft.trim() || b.plan.problem, readme: st.planReadme, prev: b.plan, ...fb, ...carryBody() });
    if (r.ok) { st.plan = FP.board(r.plan, b); save(); render(); fetchUsage(); return say(r.plan.say); }
    render(); say(r.reason || "다시 세우지 못했어요");
  }
  // 물어보기 — 이 보고에 대해 플로로에게(Floe의 AI 한 번, /api/answer). 맡긴 일 · 기준 · 보고 글만 보낸다
  //   skipCheck — 경고 뒤 '보낼게요'(RETRY.planAsk)로 다시 올 때는 guard를 또 지나지 않는다(F-103-2 — 같은 경고만 되풀이됐다)
  async function askPlan(id, skipCheck) {
    const b = st.plan, q = st.planQ.trim(), w = b && b.work[id], x = b && b.plan.items.find((i) => i.id === id);
    if (!q || !w || !w.report || !x) return;
    if (planPractice(b)) { st.planAns = { ...st.planAns, [id]: "연습이라 답하지 않아요 — 진짜 AI로 바꾸면 이 보고를 보고 답해 줘요." }; st.planAsk = ""; return render(); }
    if (!skipCheck && guard(q, "planAsk")) return;
    st.warn = null;
    const text = [`맡긴 일: ${x.need}`, `다 됐는지 보는 기준: ${x.check}`, `Claude Code의 보고: ${w.report.easy}`, ...w.report.items.map((c) => `- ${c.check}: ${c.done ? "해냄" : "아직"}${c.evidence ? ` (${c.evidence})` : ""}`)].join("\n");
    const r = await planCall("ask", "/api/answer", { stage: atStage(), hard: [], question: q, text, tier: st.tier });
    if (r.ok) { st.planAns = { ...st.planAns, [id]: r.answer }; st.planAsk = ""; st.planQ = ""; fetchUsage(); } else say(r.reason || "답하지 못했어요");
    render();
  }
  // 지금 줄 맡기기 — 진짜면 서버가 기준과 함께 Claude Code에 넘기고(그 실행이 끝에 기준마다 보고), 연습이면 잠시 뒤 예시 보고. 순서대로라 지금 줄(next)만(C-35)
  async function handPlan(id = st.plan && FP.next(st.plan)) {
    const b = st.plan; if (!b || !b.confirmed || FP.running(b) || !id || id !== FP.next(b)) return;
    const t = FP.taskFor(b, id);
    if (planPractice(b)) {
      st.plan = FP.start(b, id); render();
      setTimeout(() => { if (!st.plan || FP.running(st.plan) !== id) return; st.plan = FP.report(st.plan, id, FP.exampleReport(t.checks)); save(); render(); say("예시 보고가 왔어요. 맞는지 봐 주세요."); }, 900);
      return;
    }
    // C-50: 지난번에 끝까지 못 한 줄이 아직 서버의 그 일이면 같은 일로 다시 — 서버가 앞에서 한 일을 붙이고 다시 맡기기 상한(2번)을 센다(새 맥락 리뷰 2026-10-29 막힘)
    const w = b.work[id] || {};
    // C-64: '오류 같이 보기'로 답을 붙였으면 옛 글을 잇지 않고 답이 든 새 글로(기준에 시험 하나가 더해진다). 또 실패하면 답은 지워지고(plan.js failed),
    //   묻기는 실패 2번째까지(FP.DEBUG_TRIES — C-50 다시 맡기기 2번과 같은 수) — 끝없이 새로 맡기지 않게(새 맥락 리뷰 2026-10-30 막힘)
    let r = w.fail && !FP.debugOf(w) && Number.isFinite(w.at) ? await planCall("hand", "/api/task/retry", { at: w.at, way: "again" }) : null;
    if (r && !r.ok && r.why === "cap") { render(); return say(r.reason); }
    if (!r || !r.ok) r = await planCall("hand", "/api/task/start", { text: t.text, checks: t.checks });   // 다른 일이 지나갔으면 새로 — 글에 '지난번에 끝까지 못 했어요'가 붙는다(taskFor)
    if (!r.ok) { render(); return say(r.reason || "맡기지 못했어요"); }
    st.plan = FP.start(b, id, r.task && r.task.at); save(); render(); say("맡겼어요 — 허락이 필요하면 카드가 떠요");
    watchTask(r.task, "plan");
  }
  // 맡긴 줄이 끝났나 — 맡긴 일 지켜보기(watchTask, F-69)가 부른다. 끝나면 보고(report)를 판에 붙이고 쉬운 말 요약을 플로로가 말한다. 보고가 없으면 다시 맡길 수 있게
  function planEnd(t) {
    const id = st.plan && FP.running(st.plan); if (!id) return;
    // 보고는 맡길 일의 지금 말로(C-35). 단계 퀘스트를 보고 있으면 지금 할 퀘스트는 그대로 두고 채팅에 한 줄 · 칩(planChip)으로 알린다 — 고르는 것은 사람(2026-10-24 리뷰). 접혀 있으면 살짝 보인다
    if (t && t.report) { st.plan = FP.report(st.plan, id, t.report, t.verdict || null); mat("report", t.report.easy); logMsg("sys", `Claude Code가 보고를 보냈어요${st.qfocus === "plan" ? "" : " — '맡길 일'에서 봐요"}`); peek(); say(t.report.easy.length > N.SAY_MAX ? `${t.report.easy.slice(0, N.SAY_MAX - 1)}…` : t.report.easy); }
    else { const why = t && t.state === "failed" ? "끝까지 가지 못했어요" : "보고를 받지 못했어요"; st.plan = FP.failed(st.plan, id, why); peek(); say(`${why} — 다시 맡길 수 있어요`); }
    save(); render(); fetchUsage();
  }
  // 다른 일(저장소 만들기 등)이 이 줄의 자리를 차지했다 — 이 줄의 보고는 잃었으니 다시 맡길 수 있게
  const planLost = () => { const id = st.plan && FP.running(st.plan); if (!id) return; st.plan = FP.failed(st.plan, id, "다른 일이 자리를 차지했어요"); peek(); say("보고를 받지 못했어요 — 다시 맡길 수 있어요"); save(); render(); };
  // ── F-69 맡긴 일 지켜보기 · 막힘(2026-10-28 — 이재엽 "결과물이 안나오는 문제 해결", 결정 모음 A-03 "허락 팝업을 다시 → 선택창 → 까닭과 가장 가까운 길") ──
  //   맡긴 일(계획 줄 · 문서 올리기 · 문서 틀 · 저장 커밋 · 저장소 만들기 · 일 넘기기 · 뼈대 · 요구 줄 · 돌려 보기)을 한 곳에서 3초마다 묻는다(/api/task — 그 일의 번호 at가 맞을 때만).
  //   끝나면 그 일의 끝(TASK_END[kind].end). claude -p는 허락을 못 받아도 끝 코드 0이라, 서버가 거절된 도구를 세어 state blocked로 준다 —
  //   ① 처음 막혔고 허락 카드에 답이 없었으면(못 누름) 카드를 다시 띄운다(같은 일을 같은 번호로) ② 또 막히거나 · 거절했거나 · 카드가 안 떴으면 선택창(다시 맡기기 · 직접 하기 · 그만두기)
  //   ③ 또 막히면 까닭(무엇이 · 왜)과 결과에 가장 가까운 길(명령 없이 파일만 · 한 번 더 · 직접 하기 · 그만두기). 고르는 것은 사람 — 대신 허용하는 길은 없다(FR-17)
  const TASK_END = {
    ship: { end: shipEnd, stop: () => { st.ship = null; } },
    plan: { end: planEnd, lost: planLost, stop: (why) => { const id = st.plan && FP.running(st.plan); if (id) { st.plan = FP.failed(st.plan, id, why || "그만뒀어요"); save(); } } },
    preset: { end: (t) => presetEnd(t) },
    send: { end: (t) => say(t.state === "done" ? "Claude Code가 넘긴 일을 마쳤어요" : "넘긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요") },
    commit: { end: (t) => { if (t.state !== "done") say("커밋을 맡긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요"); } },
    repo: { end: () => { st.gh = null; loadGithub(); } },   // 저장소가 생겼는지 다시 묻는다(설정의 GitHub 칸)
    build: { end: buildEnd, stop: () => { st.build = null; } }, code: { end: buildEnd, stop: () => { st.build = null; } },   // F-70 뼈대 · 6단계 코드 물음 '예'
    line: { end: buildEnd, stop: () => { st.build = null; } }, run: { end: runEnd, stop: () => { st.build = null; } },   // F-70 기능 줄 · 돌려 보기
  };
  let tw = null, twTimer = null, twBusy = false;   // tw — 지금 지켜보는 맡긴 일 { at, kind }
  function watchTask(task, kind) {
    if (!task || !Number.isFinite(task.at) || !canLive) return;
    if (tw && tw.at !== task.at) { const h = TASK_END[tw.kind] || {}; st.stall = null; if (h.lost) h.lost(); else if (h.stop) h.stop(); }   // 다른 일이 덮었다 — 앞 일을 끝맺는다(계획 줄을 다시 맡길 수 있게, 새 맥락 리뷰 2026-10-28)
    tw = { at: task.at, kind };
    if (st.blocked && st.blocked.at !== task.at) st.blocked = null;
    clearInterval(twTimer); twTimer = setInterval(twTick, 3000);
  }
  function twStop() { clearInterval(twTimer); twTimer = null; tw = null; }
  async function twTick() {
    if (!tw) { twStop(); return; }
    if (twBusy) return;
    twBusy = true;   // 3초 타이머와 훅 알림이 겹쳐 두 번 묻지 않게
    const asked = tw;   // 물은 일 — 묻는 사이 새 일을 지키기 시작했으면 이 답은 옛 일의 것이다
    let t = null; try { t = (await (await fetch("/api/task", { cache: "no-store" })).json()).task; } catch { return; } finally { twBusy = false; }
    if (!tw || tw !== asked) return;   // 옛 답으로 새 일을 '잃었다'고 하지 않게(F-103-7) — 다음 틱이 새 일을 묻는다
    const w = tw, h = TASK_END[w.kind] || {};
    if (!t || t.at !== w.at) { twStop(); st.blocked = null; st.stall = null; if (h.lost) h.lost(); else if (h.stop) h.stop(); render(); return; }   // 다른 일 — 이 일의 결과는 잃었다
    if (t.state === "running") { stallCheck(t, w.kind); return; }
    st.stall = null;
    if (t.state === "blocked" && st.blocked && st.blocked.at === t.at && !st.blocked.retrying) return;   // 이미 카드로 물었다 — 훅 알림이 또 깨워도 단계를 올리지 않는다(새 맥락 리뷰 2026-10-28)
    if (t.state === "blocked") { clearInterval(twTimer); twTimer = null; onBlocked(t, w.kind); return; }
    if (t.state === "stopped") { twStop(); st.blocked = null; if (h.stop) h.stop("다른 화면에서 멈췄어요"); render(); return; }   // C-50 사람이 멈췄다(다른 화면에서)
    twStop(); st.blocked = null;
    if (t.state === "done" && t.denied > 0) logMsg("sys", `허락 카드에서 거절한 ${t.denied}번은 하지 않았어요`);   // 사람이 고른 거절뿐이라 끝남 — 그래도 빠진 것은 말한다(security-records 6-1)
    if (h.end) h.end(t);
    render();
  }
  // ── C-50 맡긴 일이 멈추면(2026-10-28 — 결정 모음 A-06): 서버가 준 조용한 시간(quiet — 그 폴더의 훅 알림 · 허락 카드가 마지막으로 온 뒤)으로
  //   2분 조용함(한 줄) · 5분 멈춘 것 같음 · 15분 시간 초과(카드). 값은 임시 — 리허설에서 재서 정한다. 끄지 않고 A-03 선택창으로: 더 기다리기 · 멈추고 다시 맡기기 · 직접 하기 · 멈추고 그만두기(멈추기는 사람이 고를 때만)
  const QUIET = { calm: 120, stuck: 300, over: 900 }, QLV = { calm: 1, stuck: 2, over: 3 };
  function stallCheck(t, kind) {
    const q = t.quiet || 0, lv = q >= QUIET.over ? "over" : q >= QUIET.stuck ? "stuck" : q >= QUIET.calm ? "calm" : "", prev = st.stall && st.stall.at === t.at ? st.stall : null;
    if (!lv) { if (prev) { st.stall = null; render(); } return; }   // 다시 움직인다
    if (prev && QLV[prev.lv] >= QLV[lv]) { prev.q = q; return; }
    st.stall = { at: t.at, kind, lv, q, wait: prev ? prev.wait : "", cap: (t.retries || 0) >= (t.retryMax || 2) };   // cap — 다시 맡기기 상한에 닿았으면 '멈추고 다시 맡기기'를 숨긴다
    if (lv === "calm") return say("Claude Code가 2분째 조용해요 — 조금 더 기다려 볼게요");
    if (st.ui !== "home") go("home"); else render();
  }
  const stallShown = () => !!(st.stall && st.stall.lv !== "calm" && st.stall.wait !== st.stall.lv);
  function momentStall() {
    const s = st.stall, over = s.lv === "over", min = Math.max(1, Math.floor(s.q / 60));
    return { tone: "amber", mood: "think", meta: `<span class="mm-stage">맡긴 일 · ${over ? "시간 초과" : "멈춘 것 같아요"}</span>`,
      title: over ? `${min}분 넘게 아무 소식이 없어요` : `Claude Code가 ${min}분째 조용해요 — 멈춘 것 같아요`,
      sub: "허락을 기다리거나 오래 걸리는 일일 수 있어요. 끄지 않고 더 기다릴 수도, 멈추고 다시 맡기거나 직접 할 수도 있어요.",
      acts: [{ label: "더 기다리기", act: "stall-wait", key: "Enter", pri: true }, ...(s.cap ? [] : [{ label: "멈추고 다시 맡기기", act: "stall-again" }]), { label: "멈추고 직접 하기", act: "stall-self" }, { label: "멈추고 그만두기", act: "stall-stop", kind: "ghost" }] };
  }
  // 사람이 고르면 멈춘다 — 지켜보기를 잠시 세우고(멈춘 결과를 끝으로 읽지 않게) 서버가 그 일을 끌 때까지 기다린다
  async function stallHalt() {
    const s = st.stall; if (!s) return null;
    st.stall = null; await taskHalt(s.at);
    return s;
  }
  //   멈춘 것을 확인할 때까지(최대 10초) 기다린다 — 그 전에 다시 맡기면 서버가 '아직 진행 중'(409)으로 거절한다. '멈추기'(plan-unwait)도 같이 쓴다
  //   돌려주는 값: 멈춘 것을 서버의 답으로 확인했나(못 닿았거나 10초 뒤에도 running이면 false — 그때 다시 맡기면 409)
  async function taskHalt(at) {
    clearInterval(twTimer); twTimer = null;
    try { await fetch("/api/task/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ at }) }); } catch {}
    for (let k = 0; k < 40; k++) { let t = null, heard = true; try { t = (await (await fetch("/api/task", { cache: "no-store" })).json()).task; } catch { heard = false; } if (heard && (!t || t.at !== at || t.state !== "running")) return true; await new Promise((r) => setTimeout(r, 250)); }
    return false;
  }
  // 막혔다 — ①이면 바로 다시 맡기고, ② · ③이면 카드(momentBlocked). 접혀 있어도 펼친다(허락 카드와 같이 — 사람이 골라야 이어진다)
  function onBlocked(t, kind) {
    const prev = st.blocked && st.blocked.at === t.at ? st.blocked : null, b = t.blocked || { count: 0, kinds: [], asks: { allow: 0, deny: 0, none: 0 } };
    const cap = (t.retries || 0) >= (t.retryMax || 2);   // C-50 사람이 고른 다시 맡기기는 2번까지(①은 세지 않는다)
    if (!prev && !t.try && b.asks.none > 0 && !b.asks.deny) { st.blocked = { at: t.at, kind, step: 1, b, brief: "", cap }; retryBlocked("again", true); return; }   // ① 카드를 못 눌렀다 — 다시 띄운다
    st.blocked = { at: t.at, kind, step: prev ? Math.min(3, prev.step + 1) : 2, b, brief: "", cap };
    if (st.ui !== "home") go("home"); else render();
  }
  async function retryBlocked(way, auto = false) {
    const b = st.blocked; if (!b || b.retrying) return;
    if (way !== "brief") st.blocked = { ...b, retrying: true, brief: "" };   // 기다리는 동안 카드를 감춰 두 번 누르지 않게
    let r; try { r = await (await fetch("/api/task/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ at: b.at, way, ...(auto ? { auto: true } : {}) }) })).json(); } catch { r = { ok: false, reason: "서버에 닿지 않았어요" }; }
    if (!r || !r.ok) {
      const cap = !!(r && r.why === "cap");
      if (b.stall && !cap) { st.blocked = null; watchTask({ at: b.at }, b.kind); } else st.blocked = { ...b, stall: false, ...(cap ? { cap: true } : {}) };   // 상한이면 직접 하기 · 그만두기만(멈춘 일이어도 — 직접 하기 글은 멈춘 일에서도 된다)   // 멈춤에서 온 다시 맡기기가 안 되면 지켜보기로 돌아간다(엉뚱한 '0번 막힘' 카드를 남기지 않게)
      render(); return say((r && r.reason) || "다시 맡기지 못했어요");
    }
    if (way === "brief") { st.blocked = { ...b, brief: r.brief || "" }; return render(); }
    watchTask(r.task, b.kind);
    render();
    say(b.step === 1 ? "허락을 못 받아 막혔어요 — 허락 카드를 다시 띄울게요. 카드가 뜨면 '허용'을 눌러 주세요"
      : way === "files-only" ? "명령 없이 파일만 만들도록 다시 맡겼어요 — 카드가 뜨면 '허용'을 눌러 주세요" : "다시 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요");
  }
  function endBlocked(msg, why) { const b = st.blocked; st.blocked = null; twStop(); const h = b && TASK_END[b.kind]; if (h && h.stop) h.stop(why); render(); say(msg); }
  const askWhy = (a) => (a.deny ? "허락 카드에서 '거절'을 눌렀어요" : a.none ? "허락 카드에 답이 없었어요(90초 안에 못 누름)" : a.allow ? "허용한 뒤에도 다른 일이 막혔어요" : "허락 카드가 뜨지 않았어요");
  function momentBlocked() {
    const b = st.blocked, k = b.b, kinds = k.kinds.map((x) => `${x.what} ${x.n}`).join(" · ") || "도구", meta = `<span class="mm-stage">맡긴 일 · 막힘</span>`;
    if (b.brief) return { tone: "blue", mood: "look", meta, title: "직접 하기 — 이 글을 Claude Code에 붙여 넣어요",
      sub: "그 폴더에서 Claude Code를 열고 아래 글을 붙여 넣어요. 허락은 Claude Code가 직접 물어요 — 플로로는 진행을 따라가요.",
      body: `<textarea class="mc-input brief" readonly rows="6" aria-label="맡길 글">${esc(b.brief)}</textarea>`,
      acts: [{ label: "글 복사", act: "blocked-copy", key: "Enter", pri: true }, { label: "다 했어요", act: "blocked-done", kind: "ghost" }] };
    const files = k.kinds.some((x) => x.what === "파일 쓰기"), cmd = k.kinds.some((x) => x.what === "명령");
    if (b.cap) return { tone: "amber", mood: "think", meta, title: `다시 맡기기는 2번까지예요 — ${esc(kinds)}`, sub: `${esc(askWhy(k.asks))}. 여기서부터는 직접 이어 가거나 그만둬요.`,
      acts: [{ label: "직접 하기", act: "blocked-self", key: "Enter", pri: true }, { label: "그만두기", act: "blocked-stop", kind: "ghost" }] };   // C-50 상한
    if (b.step >= 3) {   // ③ 까닭과 가장 가까운 길 — 명령만 막혔으면 '명령 없이 파일만'이 먼저
      const why = [files ? "파일 쓰기가 막혀 파일이 생기지 않았어요" : "", cmd ? "명령이 막혀 실행 · 시험을 못 했어요" : "", askWhy(k.asks)].filter(Boolean).join(" · ");
      const near = cmd && !files;
      return { tone: "amber", mood: "think", meta, title: `또 막혔어요 — ${esc(kinds)}`, sub: `${esc(why)}. 원하는 결과에 가장 가까운 길을 골라 주세요.`,
        acts: [...(near ? [{ label: "명령 없이 파일만 만들기", act: "blocked-files", key: "Enter", pri: true }] : []), { label: "한 번 더 — 카드를 꼭 눌러요", act: "blocked-again", ...(near ? {} : { key: "Enter", pri: true }) },
          { label: "직접 하기", act: "blocked-self" }, { label: "그만두기", act: "blocked-stop", kind: "ghost" }] };
    }
    return { tone: "amber", mood: "think", meta, title: `허락을 못 받아 ${k.count}번 막혔어요`, sub: `${esc(kinds)} — ${esc(askWhy(k.asks))}. 일은 끝났지만 막힌 것은 하지 못했어요.`,
      acts: [{ label: "다시 맡기기", act: "blocked-again", key: "Enter", pri: true }, { label: "직접 하기", act: "blocked-self" }, { label: "그만두기", act: "blocked-stop", kind: "ghost" }] };
  }
  // ── FR-17 대화로 일 넘기기 · 섬에서 허용 · 거절(C-4, 2026-10-20 — 이재엽 버튼 "섬에서 진짜 승인" · "허락하면 세션이 진행하는 내용을 오버레이에서도") ──
  // 할 일 적기 → 요구 문장으로 정리(진짜 AI면 /api/task/tidy, 연습이면 navigator.js taskLines) → 사람이 고쳐 확정 → 허락하고 넘기기(/api/task/start — 서버가 연결한 폴더에서 claude를 연다).
  // 연습 · 서버 없이(FR-10)는 넘기지 않고 예시 승인 카드를 보인다
  function taskBox() {
    const t = st.task;
    if (t.sent) return `<div class="tbox sent"><b>넘겼어요 — ${esc(t.sent)}</b><p class="meta">진행은 아래에 한 줄씩 쌓여요. 파일을 고치거나 명령을 쓰기 전에 허락을 구하면 위에 카드가 떠요.</p><div class="row"><button type="button" class="btn" data-act="task-reset">다른 일 적기</button></div></div>`;
    if (t.lines) return `<div class="tbox"><b>요구 문장으로 정리했어요 — 고쳐서 확정해요</b>
      <textarea class="mc-input" data-act="task-lines" rows="4" aria-label="요구 문장">${esc(t.lines.join("\n"))}</textarea>${t.say ? `<p class="meta">${esc(t.say)}</p>` : ""}
      <div class="row"><button type="button" class="btn pri" data-act="task-send">허락하고 넘기기</button><button type="button" class="btn" data-act="task-reset">그만두기</button></div></div>`;
    return `<div class="tbox"><label class="kicker" for="task-text">할 일 적기 — Claude Code에 시킬 일</label>
      <textarea id="task-text" class="mc-input" data-act="task-text" rows="2" placeholder="예) 회원 신청 화면 만들고 마감 알림도 넣어 줘">${esc(t.text)}</textarea>
      <div class="row"><button type="button" class="btn pri" data-act="task-tidy" ${t.text.trim() ? "" : "disabled"}>요구 문장으로 정리</button><span class="meta">정리 → 고치기 → 허락하면 Claude Code가 이어서 해요</span></div></div>`;
  }
  // C-38 시험판(2026-10-25) — MCP로 이은 AI의 제안: 퀘스트 시작(floe_start, kind "start") · 할 일에 적을 한 줄(floe_report). 사람이 "맞아요"를 눌러야 시작되거나 적히고, 판정은 그 뒤 평소대로
  let proposals = [];
  const decided = new Set();   // 고른 제안 — 고르기 전에 출발한 목록 응답이 늦게 와도 되살리지 않게(F-103-8)
  const proposalsHTML = () => (!proposals.length ? "" : `<div class="aplist" role="region" aria-label="웹 AI의 제안">${proposals.map((p) => { const go = p.kind === "start"; return `<section class="ap" data-pr="${esc(p.id)}"><div class="row ap-h">${I.look}<b class="grow">${go ? "웹 AI가 이 글로 퀘스트를 시작하자고 해요" : `웹 AI가 ${esc(ROMAN(p.todo))} '${esc(QU.shortOf(p.name))}'에 이렇게 적자고 해요`}</b></div>
      <p class="ap-what">${esc(p.text)}</p><div class="row"><button type="button" class="btn pri" data-act="pr-ok" data-id="${esc(p.id)}">${go ? "맞아요, 시작해요" : "맞아요, 적어요"}</button><button type="button" class="btn" data-act="pr-no" data-id="${esc(p.id)}">아니요</button></div></section>`; }).join("")}</div>`);
  async function pollProposals() {
    postState();   // 켜자마자(퀘스트가 없어도) 서버가 알게 — 바뀌었을 때만 보낸다
    let j;
    try { j = await (await fetch("/api/proposals", { credentials: "same-origin" })).json(); } catch { return; }
    if (!j || !j.ok || !Array.isArray(j.items)) return;
    const was = proposals.map((p) => p.id).join();
    proposals = j.items.filter((p) => !decided.has(p.id));
    if (proposals.map((p) => p.id).join() === was) return;
    if (proposals.length && st.ui !== "home") { st.ping = "웹 AI가 퀘스트에 적자고 해요 — 눌러서 볼까요?"; peek(); } else render();
  }
  async function decideProposal(id, ok) {
    const p = proposals.find((x) => x.id === id); if (!p) return;
    proposals = proposals.filter((x) => x.id !== id); decided.add(id);
    let refused = 0;   // 서버가 받지 않았다 — 404는 그 제안이 없다(다른 화면에서 이미 고름 · 시간이 지남), 그 밖은 확인 값 등. 적거나 시작하지 않는다(F-103-8)
    try { const res = await fetch("/api/proposals/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), credentials: "same-origin" }); if (!res.ok) refused = res.status; } catch {}
    if (refused) { render(); return say(refused === 404 ? "이미 처리된 제안이에요 — 적지 않았어요" : "서버가 받지 않아 적지 않았어요"); }
    const q = st.quest;
    if (!ok) { render(); return say(p.kind === "start" ? "시작하지 않았어요" : "적지 않았어요"); }
    if (p.kind === "start") {   // floe_start — 섬 채팅에 처음 한 줄을 보낸 것과 같은 길(startDraft). 그사이 퀘스트가 생겼으면 하지 않는다
      if (q || st.j || !QU) { render(); return say("이미 퀘스트가 있어 시작하지 않았어요"); }
      logMsg("floro", `웹 AI가 건넨 글로 퀘스트를 시작해요 — ${esc(p.text.length > 200 ? `${p.text.slice(0, 200)}…` : p.text)}`);
      return startDraft(p.text);
    }
    if (!q || q.phase !== "quest" || q.chap !== p.chap || !q.objs[p.todo]) { render(); return say("지금 퀘스트와 맞지 않아 적지 않았어요"); }
    logMsg("floro", `웹 AI의 제안을 ${esc(ROMAN(p.todo))}에 적었어요 — ${esc(p.text)}`);
    fillNow(p.text, undefined, p.todo);
  }
  if (canLive) setInterval(pollProposals, 2000);
  // 기다리는 승인 요청(approve.js 카드) — 서버가 2초마다 알려 준다. 연습 · 주소 &approve=1이면 예시 카드
  let approvals = [], apMode = "none", apKnown = new Set();
  const approvalsHTML = () => (!approvals.length ? "" : `<div class="aplist" role="region" aria-label="허락이 필요해요">${apMode === "example" ? `<p class="note" role="status">예시 데이터예요 · 시연용</p>` : ""}${approvals.map(apCard).join("")}</div>`);
  function apCard(a) {
    const c = a.card || {}, sure = st.apSure === a.id, lines = Array.isArray(c.lines) ? c.lines : [];
    return `<section class="ap${c.danger ? " danger" : ""}" data-ap="${esc(a.id)}"><div class="row ap-h">${I.look}<b class="grow">${esc(toolName(a.tool))}가 허락을 기다려요</b><span class="meta">${esc(a.project || "")}</span></div>
      <p class="ap-what"><b>${esc(c.verb || "")}</b> · ${esc(c.what || c.tool_name || "")}</p>${lines.length ? `<pre class="ap-lines">${lines.map(esc).join("\n")}</pre>` : ""}${
      c.danger ? `<p class="ap-danger">⚠ ${esc(c.danger)}${sure ? " — 정말 허용할까요?" : ""}</p>` : ""}
      <div class="row"><button type="button" class="btn pri" data-act="ap-allow" data-id="${esc(a.id)}">${sure ? "정말 허용" : "허용"}</button><button type="button" class="btn" data-act="ap-deny" data-id="${esc(a.id)}">거절</button>${sure ? `<button type="button" class="btn" data-act="ap-unsure">아니요</button>` : ""}</div></section>`;
  }
  async function decideApproval(id, decision) {
    const a = approvals.find((x) => x.id === id); if (!a) return;
    if (decision === "allow" && a.card && a.card.danger && st.apSure !== id) return set({ apSure: id });   // 되돌리기 어려운 일 — 한 번 더 묻는다
    const sure = st.apSure === id; st.apSure = "";
    approvals = approvals.filter((x) => x.id !== id);
    if (apMode !== "live") { say(decision === "allow" ? "연습이라 실제로 허용하지는 않았어요" : "연습이라 실제로 거절하지는 않았어요"); return render(); }
    mat("approve", `${decision === "allow" ? "허용" : "거절"} — ${(a.card && a.card.tool_name) || "도구"}`);   // C-47 재료 — 진짜로 보낸 결정만, 도구 이름만
    render();
    try {
      const r = await (await fetch("/api/approvals/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, sig: a.sig, decision, sure }) })).json();
      say(r && r.ok ? (decision === "allow" ? "허용했어요 — Claude Code가 이어서 해요" : "거절했어요") : (r && r.reason) || "보내지 못했어요");
    } catch { say("서버에 연결하지 못했어요 — Claude Code가 터미널에서 물어요"); }
    pollApprovals();
  }
  // 서버에 기다리는 승인 요청이 있나 — 새 요청이 오면 한 줄로 알리고(접혀 있으면 살짝), AI 진행 판을 보이게
  async function pollApprovals() {
    if (!canLive || apMode === "example") return;
    let j;
    try { j = await (await fetch("/api/approvals", { credentials: "same-origin" })).json(); } catch { return; }
    if (!j || !j.ok || !Array.isArray(j.items)) return;
    const before = approvals.map((a) => a.id).join(), fresh = j.items.filter((a) => !apKnown.has(a.id));
    apMode = "live"; approvals = j.items.filter((a) => st.apSure !== a.id || true); st.apWait = approvals.length > 0;
    for (const a of j.items) apKnown.add(a.id);
    if (fresh.length) {
      // 허락 카드는 채팅의 지금 말 위에(C-35, 2026-10-24 — 오버레이가 일하는 자리). AI 진행 판을 보고 있으면 거기에도 있으니 그대로, 다른 판은 닫는다
      st.place = "base"; if (st.pane !== "ai") st.pane = "";
      // F-69(2026-10-28): 접혀 있어도(알약 · 숨김) 펼친다 — 전에는 알약에 한 줄(ping)만 떠서 90초 안에 못 누르면 일이 허락 없이 막혔다
      activity(); if (st.ui !== "home") go("home"); say(`${toolName(fresh[0].tool)}가 허락을 기다려요 — 채팅의 카드를 봐 주세요`);
    }
    if (approvals.map((a) => a.id).join() !== before && st.ui === "home") render();
  }
  if (canLive) setInterval(pollApprovals, 2000);
  if (st.plan && FP && FP.running(st.plan)) setTimeout(() => { const id = FP.running(st.plan), w = st.plan.work && st.plan.work[id]; if (planLive() && w && Number.isFinite(w.at)) watchTask({ at: w.at }, "plan"); else st.plan = FP.failed(st.plan, id); }, 0);   // 다시 켰는데 맡김 중인 줄이 있으면 서버에 다시 묻는다(연습이면 다시 맡길 수 있게)
  // 섬(C-22): 위 줄 + [설정 판 | 알림 · AI 진행 판 | 채팅]. 퀘스트 창은 섬 옆에(.nav.side — 가로로 나란히): side의 반대쪽
  // inCol — 작업실 옆 칸 안의 섬(C-62, 2026-10-29): 위 줄(.tb)은 그리지 않는다 — 집 · 설정 · 열어 두기 · 접기는 작업실 머리 줄의 섬 단추 묶음(hisl)에
  function islandHTML(enter, inCol = false) {
    const body = st.settings && QU && !st.qwin ? settingsPane() : st.pane ? basePane(st.pane) : chatCard(momentToday());
    const isl = `<div class="isl${enter}">${inCol ? "" : topbar()}<div class="isl-body">${body}</div>${gachaHTML()}</div>`;
    if (WINS || !st.qwin || inCol) return isl;   // 앱: 작업실은 따로 뜬다(syncWins). inCol이면 섬만(아래 격자가 부른다)
    return `<div class="wsx">${qwinHTML()}<div class="isl-col side-right narrow${islBig() ? " center" : ""}">${islandHTML(enter, true)}</div></div>`;   // 브라우저 판: 앱 창(win.html #root)과 같은 격자 — 머리 줄 한 줄 아래 작업실 판 · 섬 옆 칸
  }
  // 이 조각의 누르기 — 00-base의 누르기 표(ACT)에 더한다. 공통 누르기는 90-acts.js(2026-10-29 나누기 2차)
  Object.assign(ACT, {
    // C-50 멈춘 것 같을 때(A-06) — 더 기다리기(다음 단계까지 묻지 않음) · 멈추고 다시 맡기기 · 직접 하기(멈추고 맡길 글) · 멈추고 그만두기
    "stall-wait": () => { if (!st.stall) return; st.stall.wait = st.stall.lv; render(); say("더 기다릴게요 — 소식이 오면 알려 드려요"); },
    "stall-again": async () => { const s = await stallHalt(); if (!s) return; st.blocked = { at: s.at, kind: s.kind, step: 2, stall: true, b: { count: 0, kinds: [], asks: { allow: 0, deny: 0, none: 0 } }, brief: "" }; retryBlocked("again"); },
    "stall-self": async () => { const s = await stallHalt(); if (!s) return; st.blocked = { at: s.at, kind: s.kind, step: 2, stall: true, b: { count: 0, kinds: [], asks: { allow: 0, deny: 0, none: 0 } }, brief: "" }; retryBlocked("brief"); },
    "stall-stop": async () => { const s = await stallHalt(); if (!s) return; tw = null; const h = TASK_END[s.kind]; if (h && h.stop) h.stop("오래 조용해서 멈췄어요"); render(); say("멈췄어요 — 언제든 다시 맡길 수 있어요"); },
    // F-69 막힌 일(A-03) — 다시 맡기기 · 명령 없이 파일만 · 직접 하기(맡길 글) · 글 복사 · 다 했어요 · 그만두기
    "blocked-again": () => retryBlocked("again"),
    "blocked-files": () => retryBlocked("files-only"),
    "blocked-self": () => retryBlocked("brief"),
    "blocked-copy": async () => { const t = st.blocked && st.blocked.brief; if (!t) return; try { await navigator.clipboard.writeText(t); say("복사했어요 — Claude Code에 붙여 넣어요"); } catch { say("복사하지 못했어요 — 글을 골라 직접 복사해요"); } },
    "blocked-done": () => endBlocked("직접 해 보세요 — 그 폴더에서 Claude Code가 일하면 플로로가 진행을 따라가요", "직접 하기로 했어요"),
    "blocked-stop": () => endBlocked("그만뒀어요 — 언제든 다시 맡길 수 있어요", "허락을 못 받아 그만뒀어요"),
    // C-64 오류 같이 보기 — 열기 · 다음 · 모름 · 고르기(예 · 아니요 · 모름) · 그만두기
    "dbg-open": () => { const b = st.plan, id = b && FP.next(b); if (!id || !FP.canDebug(b, id)) return; const w = b.work[id], old = FP.debugOf(w) || {};   // 다시 적기 — 앞서 붙인 답(가린 것)으로 채워 둔다, '모름'은 빈 칸
      st.dbg = { id, v: b.v, n: w.fail.n, i: 0, a: Object.fromEntries(Object.entries(old).filter(([, x]) => x !== "모름")) }; render(); dbgFocus(); },
    "dbg-next": () => dbgStep(),
    "dbg-skip": () => { const d = st.dbg; if (!d) return; st.dbg = { ...d, a: { ...d.a, [FP.DEBUG_QS[d.i].key]: "" } }; dbgStep(); },
    "dbg-pick": (i) => { const d = st.dbg, q = d && FP.DEBUG_QS[d.i]; if (!q || !q.choices || !q.choices[i]) return; st.dbg = { ...d, a: { ...d.a, [q.key]: q.choices[i] } }; dbgStep(); },
    "dbg-close": () => { st.dbg = null; render(); say("그만뒀어요 — 답은 붙이지 않았어요"); },
  });
