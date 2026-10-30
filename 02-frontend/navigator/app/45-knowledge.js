  // ── 지식 퀘스트 C-49(2026-10-29 — PRD 6절 · 9절 3 · 4번 "사람이 확인한 기록만" · "글 지문"): 기록의 원본은 프로젝트 폴더 ──
  //   폴더를 알면(진짜 AI 모드 · 앱이 고른 폴더) 그 폴더마다 한 번 단계 문서를 다시 읽는다(GET /api/docs). 이 브라우저에 기록이 없으면 되살릴지 묻고,
  //   본 뒤 글 지문이 바뀐 문서는 '낡음' — 다시 읽을지 묻는다(나중에면 다음에 열 때 다시). 없어진 문서의 기록은 지우지 않고 '근거 없음'(nosrc).
  //   지문 st.docPrints = { project: 폴더 열쇠(실제 경로의 지문 — 이름이 같은 다른 폴더와 견주지 않게), wrote: {단계: Floe가 마지막에 쓴 글 — 이것과 같을 때만 다시 덮는다},
  //     own: {단계: 사람 것 — 되읽어 다시 쓰면 다른 글 · 읽을 수 없는 글, 덮지 않는다}, seen: {단계: 마지막으로 본 폴더 글}, dirty: 다시 읽은 기록으로 기획서 · 결정 기록을 아직 안 고침, declined: 되살리지 않고 새로 시작 }
  keep(["carryDone", "carryUse", "docPrints"]);   // C-48 가져갈 것 · C-49 글 지문 — 고장 난 기록은 빈 값으로
  if (!st.docPrints || typeof st.docPrints !== "object" || Array.isArray(st.docPrints)) st.docPrints = {};
  if (!st.carryUse || typeof st.carryUse !== "object" || Array.isArray(st.carryUse)) st.carryUse = {};
  st.carryDone = st.carryDone === true;
  let docsFor = "", docsKey = "";
  const DP = () => (st.docPrints && typeof st.docPrints === "object" && !Array.isArray(st.docPrints) ? st.docPrints : {});
  const stageOfPath = (p) => N.STAGES.findIndex((_, i) => FDOCS.stagePath(i) === p);
  const byStage = (o) => Object.fromEntries(Object.entries(o || {}).map(([p, v]) => [stageOfPath(p), v]).filter(([n]) => n >= 0));
  // 올릴 때 서버에 줄 것 — 이 폴더에서 Floe가 쓴 지문(prints)과 사람 것(keep). 모르면(옛 기록 · 새로 시작 · 다른 폴더) 주지 않는다 → 전처럼 쓴다
  const shipKnown = () => { const P = DP(), at = (n) => FDOCS.stagePath(Number(n)); return P.project && P.project === docsKey && !P.declined ? { prints: Object.fromEntries(Object.entries(P.wrote || {}).map(([n, v]) => [at(n), v])), keep: Object.keys(P.own || {}).map(at) } : null; };
  async function docsCheck() {
    if (!canLive || st.mode !== "live" || !FDOCS) return;
    let r; try { r = await (await fetch("/api/docs", { cache: "no-store" })).json(); } catch { return; }
    if (!r || !r.ok || r.why === "folder" || !r.stages || typeof r.stages !== "object") return;
    if (!st.carry) { carryMaybe(); if (st.carry) render(); }   // C-48
    const got = Object.keys(r.stages).map(Number).filter((n) => N.STAGES[n] && r.stages[n].result).sort((a, b) => a - b);
    docsKey = r.key || "";
    const P = DP(), mine = !!r.key && P.project === r.key;
    if (!Object.keys(st.results).length) { if (got.length && !(mine && P.declined)) { st.restore = { phase: "offer", got, data: r }; render(); } else carryLoad(0); return; }   // 새 프로젝트(또는 새로 시작) — C-48 1단계에 가져온 것 · 보류한 것
    if (st.j) carryLoad(st.j.stage);   // C-48 지금 단계에 가져온 것 — 이 프로젝트에서 그 단계를 고르기 전이면(닫았다 다시 켜도)
    if (!mine) return;   // 다른 폴더(또는 지문을 남기기 전)의 기록 — 견주지 않는다(같은 경로라도 다른 프로젝트의 문서다)
    const stale = [], gone = [];
    for (const [k, print] of Object.entries(P.seen || {})) {
      const n = Number(k), f = r.stages[n];
      if (!st.results[n]) continue;
      if (!f) { if (!st.results[n].nosrc) gone.push(n); } else if (f.print !== print) stale.push(n);
    }
    if (gone.length) { st.results = { ...st.results, ...Object.fromEntries(gone.map((n) => [n, { ...st.results[n], nosrc: true }])) }; save(); }
    if (stale.length || gone.length) { st.restore = { phase: "stale", stale, gone, data: r }; render(); }
    else if (P.dirty && st.results[0] && st.results[1] && !st.ship) { st.ship = { phase: "offer" }; render(); }   // 다시 읽은 기록으로 기획서 · 결정 기록을 아직 고쳐 쓰지 않았다
  }
  // 되살린 뒤 이어 할 단계 — 관문을 지난(또는 다음 단계 기록이 있는) 마지막 단계의 다음
  const resumeStage = (stages) => { const has = (n) => !!(stages[n] && stages[n].result); let last = -1; for (let n = 0; n < N.STAGES.length; n++) if (has(n) && (stages[n].result.passed || has(n + 1))) last = n; return last + 1; };
  // 1단계 '크기' 칸의 글('크기: 보통 — …') → 만드는 크기(quest.js SIZE_AT · SIZE_WORD · SIZE_TIER)
  const tierOf = (r0) => { const it = QU && r0 && r0.items[QU.SIZE_AT], w = String((it && it.lines[0]) || "").replace(/^크기: /, ""); const k = it ? Object.keys(QU.SIZE_WORD).find((x) => w.startsWith(QU.SIZE_WORD[x])) : null; return k ? QU.SIZE_TIER[k] : ""; };
  function momentRestore() {
    const R = st.restore, list = (ns) => ns.map((n) => LB(n)).join(" · "), meta = `<span class="mm-stage">폴더의 기록</span>`;
    if (R.phase === "offer") {
      const nx = resumeStage(R.data.stages);
      return { tone: "blue", mood: "happy", meta, title: "작업 폴더에 남은 기록이 있어요 — 되살릴까요?",
        sub: `작업 폴더의 단계 문서에서 ${list(R.got)} 기록을 찾았어요. 이 브라우저에는 기록이 없어요. 되살리면 ${N.STAGES[nx] ? `${LB(nx)}부터 이어서 해요` : "끝낸 기록을 다시 볼 수 있어요"}.`,
        acts: [{ label: "되살리기", act: "restore-go", key: "Enter", pri: true }, { label: "새로 시작", act: "restore-later", kind: "ghost" }] };
    }
    const unread = R.stale.filter((n) => !R.data.stages[n].result), read = R.stale.filter((n) => R.data.stages[n].result);
    const lines = [...(read.length ? [`${list(read)} 문서를 폴더에서 고쳤어요 — 이 기록과 그 글로 만든 기획서 · 결정 기록이 낡았어요.`] : []),
      ...(unread.length ? [`${list(unread)} 문서는 Floe가 읽을 수 없게 바뀌었어요 — 기록은 그대로 두고 그 문서는 덮지 않아요.`] : []),
      ...(R.gone.length ? [`${list(R.gone)} 문서가 폴더에 없어요 — 기록은 지우지 않고 '근거 없음'으로 두었어요.`] : [])];
    return { tone: "amber", mood: "think", meta, title: read.length ? "폴더의 단계 문서가 바뀌었어요 — 다시 읽어 올까요?" : "폴더의 단계 문서가 달라졌어요",
      sub: esc(lines.join(" ")), ...(read.length ? { foot: "다시 읽으면 기록을 폴더의 글로 바꾸고, 기획서 · 결정 기록도 같은 파일에 고쳐 쓸지 물어요. 사람이 고친 단계 문서는 Floe가 덮지 않아요." } : {}),
      acts: R.stale.length ? [{ label: read.length ? "다시 읽기" : "확인했어요", act: "restore-read", key: "Enter", pri: true }, { label: "나중에", act: "restore-later", kind: "ghost" }] : [{ label: "확인했어요", act: "restore-later", key: "Enter", pri: true }] };
  }
  // 되살린 단계부터 — advance처럼 그 장의 할 일 · 퀘스트를 세운다(레벨 · 조개는 올리지 않는다 — 이미 지난 관문)
  function resumeAt(n) {
    const s = N.STAGES[n];
    if (!s) { st.finished = true; return; }
    st.j = { stage: n, reason: `폴더의 기록으로 ${LB(n)} "${s.title}"부터 이어서 해요.`, criteria: crits(n).map((c) => ({ text: c.text, term: c.term, met: false, evidence: "" })), next: null };
    if (QU) st.quest = QU.retitle(QU.makeQuest(s, crits(n)), st.topic);
  }

  // ── 지식 퀘스트 C-48(2026-10-29 — PRD 6절 · 9절 1 · 2번): 다음 프로젝트로 가져가기 ──
  //   8단계(돌아보기)에 오면 단계마다 적은 배운 것으로 가져갈 것 초안(1 ~ 3개, AI 한 번 — 서버가 기준을 못 채운 초안은 한 번만 다시)을 만들지 묻고,
  //   초안마다 기준 다섯을 보이고 사람이 고쳐 채택 · 반려(까닭) · 보류를 고른다(장부는 이 컴퓨터의 Floe 폴더 — 서버). 단계에 들어서면 다른 프로젝트에서 채택한 것 중
  //   그 단계에 닿는 것을 최대 3개 보이고 이번에 쓸지 고른다(st.carryUse — C-51 계획의 근거). 진짜 AI 모드만(연습은 장부가 없다)
  const CARRY_WORD = { saving: "남기는 중…", adopted: "채택했어요", rejected: "반려했어요(보관)", held: "보류했어요 — 다음 프로젝트를 시작할 때 다시 물어요" };
  const learnedList = () => Object.entries(st.results).filter(([, r]) => typeof r.learned === "string" && r.learned.trim()).map(([k, r]) => ({ stage: Number(k), text: r.learned.trim().slice(0, 400) }));
  // 8단계에 있으면 켤 때마다 한 번 묻는다 — 이 프로젝트에서 다 정했으면(st.carryDone) 다시 묻지 않는다. 초안 전 '나중에'면 다음에 열 때 다시
  let carryAsked = false;
  function carryMaybe() { if (CY && !carryAsked && !st.carryDone && st.j && st.j.stage === 7 && !st.finished && st.mode === "live" && canLive) { carryAsked = true; st.carry = { phase: "offer" }; } }
  // 단계에 들어설 때 — 이 프로젝트에서 그 단계를 이미 골랐으면(carryUse에 있으면) 다시 묻지 않는다
  async function carryLoad(n) {
    if (!CY || !canLive || st.mode !== "live" || String(n) in (st.carryUse || {})) return;
    let r; try { r = await (await fetch(`/api/carry?stage=${n}`, { cache: "no-store" })).json(); } catch { return; }
    if (!r || !r.ok) return;
    const items = Array.isArray(r.items) ? r.items : [], held = n === 0 && Array.isArray(r.held) ? r.held : [];
    if (items.length || held.length) { st.carryOffer = { n, items, held, pick: items.map((x) => x.id) }; render(); }
  }
  const carryPost = async (body) => { try { return await (await fetch("/api/carry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json(); } catch { return { ok: false, reason: "서버에 닿지 못했어요" }; } };
  // 초안 하나를 장부에 — 누르는 동안(saving) 두 번 보내지 않고, 초안마다 id를 보내 같은 줄을 고쳐 쓴다(새 맥락 리뷰: 두 번 누르면 두 줄)
  async function carryDecide(k, action, reason = "") {
    const d = st.carry && st.carry.drafts && st.carry.drafts[k]; if (!d || d.state) return;
    d.state = "saving"; render();
    const r = await carryPost({ action, id: d.id, item: { text: d.text, why: d.why, stage: d.stage, review: d.review, from: d.from }, ...(reason ? { reason } : {}) });
    if (!r.ok) { d.state = ""; render(); return say(r.reason || "남기지 못했어요"); }
    d.state = { adopt: "adopted", reject: "rejected", hold: "held" }[action]; d.rejecting = false;
    if (st.carry.drafts.every((x) => x.state && x.state !== "saving")) { st.carryDone = true; save(); }   // 이 프로젝트에서 다 정했다 — 8단계 카드를 다시 띄우지 않는다
    render();
  }
  function momentCarry() {
    const C = st.carry, meta = `<span class="mm-stage">${LB(7)} · 가져갈 것</span>`, n = learnedList().length;
    if (C.phase === "offer") return { tone: "blue", mood: "happy", meta, title: "다음 프로젝트에 가져갈 것을 정리해 볼까요?",
      sub: n ? `단계마다 적은 배운 것 ${n}개와 결정 기록으로 초안을 1 ~ 3개 만들어요. 고쳐서 채택하거나 버려도 돼요 — 정하는 건 나예요.` : "관문에서 적은 배운 것이 없어요 — 작업 폴더의 결정 기록만으로 만들어 볼 수 있어요. 고쳐서 채택하거나 버려도 돼요.",
      acts: [{ label: "초안 만들기", act: "carry-draft", key: "Enter", pri: true }, { label: "나중에", act: "carry-later", kind: "ghost" }] };
    const rows = C.drafts.map((d, k) => {
      const miss = CY.missing(CY.measure(d, CY.today()));
      if (d.state) return `<li class="carry-d"><p><b>${esc(d.text)}</b> — ${CARRY_WORD[d.state]}</p></li>`;
      const stageSel = `<select data-act="carry-stage" data-i="${k}" aria-label="언제 쓰나(단계)"><option value="-1"${d.stage < 0 ? " selected" : ""}>언제 쓰나 — 고르기</option>${N.STAGES.map((x) => `<option value="${x.n}"${d.stage === x.n ? " selected" : ""}>${LB(x.n)} · ${esc(x.title)}</option>`).join("")}</select>`;
      const fromBtns = N.STAGES.map((x) => `<button type="button" class="b opt toggle" data-act="carry-from" data-i="${k}" data-v="${x.n}" aria-pressed="${d.from.includes(x.n)}">${x.n + 1}</button>`).join("");
      return `<li class="carry-d">
        <input class="mc-input" data-act="carry-text" data-i="${k}" maxlength="${CY.TEXT_MAX}" aria-label="다음엔 이렇게" value="${esc(d.text)}">
        <input class="mc-input" data-act="carry-why" data-i="${k}" maxlength="${CY.WHY_MAX}" aria-label="왜(무슨 일이 있었나)" placeholder="왜 — 이번에 무슨 일이 있었나요?" value="${esc(d.why)}">
        <p class="mc-sub">${stageSel} · 다시 볼 날 <input type="date" data-act="carry-review" data-i="${k}" value="${esc(d.review)}" aria-label="다시 볼 날"></p>
        <p class="mc-sub">근거 단계 <span class="opts" role="group" aria-label="근거 단계">${fromBtns}</span></p>
        <p class="mc-sub">${miss.length ? `못 채운 기준: ${miss.join(" · ")}` : "기준 다섯을 다 채웠어요"}</p>
        ${d.rejecting ? `<input class="mc-input" data-act="carry-reason" data-i="${k}" maxlength="${CY.REASON_MAX}" aria-label="버리는 까닭" placeholder="왜 버리나요?" value="${esc(d.reason || "")}">` : ""}
        <div class="opts">${btn({ label: "채택", act: "carry-adopt", i: k, kind: "opt", disabled: d.stage < 0 })}${btn({ label: "보류", act: "carry-hold", i: k, kind: "opt" })}${btn({ label: d.rejecting ? "이 까닭으로 반려" : "반려", act: "carry-reject", i: k, kind: "opt" })}</div></li>`;
    }).join("");
    const left = C.drafts.filter((d) => !d.state).length;
    return { tone: "blue", mood: "happy", meta, title: left ? `가져갈 것 초안 ${C.drafts.length}개 — 고쳐서 고르세요` : "가져갈 것을 다 정했어요",
      sub: esc(C.say || ""), body: `<ol class="carry">${rows}</ol>`,
      acts: left ? [{ label: "남은 것은 보류하기", act: "carry-hold-rest", kind: "ghost" }] : [{ label: "확인했어요", act: "carry-later", key: "Enter", pri: true }] };
  }
  function momentCarryOffer() {
    const O = st.carryOffer, meta = `<span class="mm-stage">${LB(O.n)} · 지난 프로젝트에서</span>`;
    const whence = (x) => [x.why ? `왜: ${esc(x.why)}` : "", x.project ? esc(x.project) : "", x.from && x.from.length ? `근거 ${x.from.map((n) => LB(n)).join(" · ")} 문서` : ""].filter(Boolean).join(" · ");   // 근거 단계 문서를 잇는다(새 맥락 리뷰)
    const items = O.items.map((x, k) => `<li>${btn({ label: x.text, act: "carry-use", i: k, kind: "opt toggle", pressed: O.pick.includes(x.id) })}${whence(x) ? `<small class="mc-fine">${whence(x)}</small>` : ""}</li>`).join("");
    const held = O.held.map((x, k) => `<li>${esc(x.text)}${whence(x) ? ` <small class="mc-fine">${whence(x)}</small>` : ""} ${btn({ label: "채택", act: "carry-held-adopt", i: k, kind: "opt", disabled: !(x.stage >= 0) })}</li>`).join("");
    return { tone: "blue", mood: "happy", meta, title: O.items.length ? "지난 프로젝트에서 가져온 것이 있어요 — 이번에 쓸까요?" : "보류해 둔 가져갈 것이 있어요",
      sub: O.items.length ? "고른 것은 이 단계의 준비 계획에 근거로 들어가요." : "채택하면 다음 프로젝트부터 그 단계에서 보여요.",
      body: `${items ? `<ul class="carry">${items}</ul>` : ""}${held ? `<p class="mc-sub">보류한 것</p><ul class="carry">${held}</ul>` : ""}`,
      acts: [{ label: "이대로", act: "carry-use-done", key: "Enter", pri: true }, { label: "이번엔 안 써요", act: "carry-use-none", kind: "ghost" }] };
  }

  async function shipGo(publicOk = false) {
    if (!st.ship || !(st.ship.phase === "offer" || (publicOk && st.ship.phase === "public"))) return;
    if (st.mode !== "live" || !canLive) { st.ship = null; render(); return say("연습이라 올리지 않았어요 — 진짜 AI 모드에서 작업 폴더에 만들고 올려요"); }
    if (st.busy) return;   // 앞 호출의 '무엇을 기다리나'를 지우지 않게(F-103-5)
    st.planBusy = "ship";
    const known = shipKnown();
    const r = await callAI("/api/docs", { topic: st.topic, idea: st.idea || "", source: st.source || "", results: shipResults(), card: st.card || null, ...(publicOk ? { publicOk: true } : {}), ...(known ? { prints: known.prints, keep: known.keep } : {}) });   // source — 받은 글 전부(F-68), card — 기준 카드(C-56)
    st.planBusy = "";
    // C-52(2026-10-29): 공개(또는 모름) 저장소 — 저장소마다 처음 한 번 더 묻는다. 서버는 아직 아무것도 쓰지 않았다
    if (!r.ok && r.why === "public") { st.ship = { ...st.ship, phase: "public", reason: r.reason || "" }; return render(); }
    // C-49: 쓴 단계 문서의 지문을 기억한다(맡기기가 실패해도 파일은 썼다) — 다음에 열 때 폴더의 글이 바뀌었는지(낡음) 본다. 다시 쓴 단계는 '근거 없음'도 걷는다
    if (r.prints) {
      if (r.key) docsKey = r.key;
      const P = DP(), same = P.project === docsKey && !P.declined, w = byStage(r.prints), own = { ...(same ? P.own : {}) };
      for (const n of Object.keys(w)) delete own[n];   // Floe가 방금 쓴 문서는 Floe 것
      st.docPrints = { project: docsKey, wrote: { ...(same ? P.wrote : {}), ...w }, seen: { ...(same ? P.seen : {}), ...w }, own, dirty: false };
      st.results = Object.fromEntries(Object.entries(st.results).map(([k, x]) => { if (!(k in w) || !x.nosrc) return [k, x]; const { nosrc, ...rest } = x; return [k, rest]; }));
      save();
    }
    if (!r.ok) { render(); return say(r.reason || "문서를 올리지 못했어요"); }
    st.ship = { phase: "sent", at: r.task && r.task.at }; render(); watchTask(r.task, "ship");
    const kept = (r.kept || []).map(stageOfPath).filter((n) => n >= 0);
    if (kept.length) say(`${kept.map((n) => LB(n)).join(" · ")} 문서는 폴더에서 고친 글이라 덮지 않았어요`);   // C-49 기록의 원본은 폴더
  }
  // 맡긴 올리기가 끝났나 — 맡긴 일 지켜보기(watchTask, F-69)가 끝나면 부른다. 막히면 막힘 카드가 먼저(다시 맡기면 같은 번호라 그대로 이어진다)
  function shipEnd(t) {
    if (!st.ship) return;
    st.ship = null;
    // Claude Code가 기준(커밋 · 푸시)마다 보고한다(C-32) — 끝났다(0)는 것만으로 올라갔다고 말하지 않는다(푸시를 건너뛰거나 허락을 거절해도 0으로 끝난다, 2026-10-25 리뷰)
    const r = t.report, pushed = !!(r && r.items[1] && r.items[1].done);
    say(t.state !== "done" ? "올리기가 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요" : pushed ? "올리기를 마쳤어요 — GitHub에서 docs 폴더를 볼 수 있어요"
      : r ? `푸시는 못 했어요 — ${r.easy}` : "Claude Code가 일을 마쳤어요 — 푸시됐는지 진행 보기에서 봐 주세요");
  }
  // 퀘스트 글 받기(C-22, API.md 3-17) — 진짜 AI 모드에서만. 설명 · 질문 · 예시만 받고 할 일 이름 · 개수는 코드 그대로. 못 받으면 기본 글(quest.js)로 두고 까닭만 말한다
  async function questText() {
    const q = st.quest; if (!q || !QU || st.mode !== "live" || !canLive) return;
    const idea = (st.idea || project() || "").trim(); if (!idea) return;
    if (sensitive(idea).length) return say("만들고 싶은 것에 비밀번호처럼 보이는 게 있어 AI에 보내지 않았어요 — 기본 글로 둘게요");
    const r = await callAI("/api/quest", { idea, stage: q.chap, tier: st.tier });
    if (r.ok && st.quest && st.quest.chap === q.chap) { st.quest = QU.withAI(st.quest, r.quest); st.tokens = r.tokens || 0; fetchUsage(); }
    render();
    if (!r.ok) say(`퀘스트 글은 기본 글로 둘게요 — ${r.reason || "AI에 연결하지 못했어요"}`);
  }
  // 완료 보고(C-22) — 적은 줄을 작업 글로 모아 어디쯤인지 본다. 진짜 AI는 서버(/api/judge)가, 연습은 적은 대로(quest.js localJudgement). 판정 규칙은 그대로
  function questReport() {
    const q = st.quest; if (!q || !QU.isDone(q)) return;
    if (refuse(mealWhy())) return;
    const text = QU.textOf(q, st.idea);
    st.quest = { ...q, edit: false }; st.text = text; st.notice = ""; st.undo = [];   // '보고했어요'(done)는 살펴본 결과를 받은 뒤 landed가 — 실패하면 완료 보고 칩이 다시 보인다(2026-10-25 리뷰)
    Object.assign(st, { error: "", warn: null });
    // C-40(2026-10-26 — 이재엽 버튼: 확인한 단계는 AI 살펴보기를 건너뛰기, FR-1 · FR-2가 바뀜): 초안을 칸마다 확인한 장은 AI가 다시 살펴보지 않고 확인한 대로 본다 — 문서에는 '확인한 대로'(checkBy confirm)
    if (st.mode === "fixture" || q.draft) {
      const j = N.parseJudgement(QU.localJudgement(q, q.draft ? QU.CONFIRM_REASON : undefined), text, q.chap, st.tier);
      return j ? landed(j, 0, text, q.draft ? "confirm" : "") : stop("적은 글을 보지 못했어요. 만드는 크기를 바꿨으면 퀘스트를 다시 받아 주세요.");
    }
    return askAI("/api/judge", { text, stage: q.chap, tier: st.tier }, "살펴보지 못했어요", (r) => landed(r.judgement, r.tokens, text), [text, "judge"]);
  }
  // 퀘스트 창(C-22) — 머리띠(제목 · 프로젝트 · 크기 S/M/L · 닫기) · 탭(퀘스트 · 도전과제 · 책) · 판. 위 줄의 '퀘스트' 단추로 켜고 끈다(C-35). 끌어 옮기기는 Electron 창으로 만들 때(다음 판, 정할 것 10)
  let qpop = false;
  const openQwin = (tab) => { if (!st.qwin) { qpop = true; loadFiles(); } st.qwin = true; st.qtab = tab || st.qtab; };   // 열 때 파일 칸의 목록도(R-8)
  const closeQwin = () => { st.qwin = false; go("petit"); };   // 작업실을 닫으면 섬은 알약으로 — 펼친 섬 대화창이 따로 남지 않게(F-85, 두승현 2026-10-29). 처음 설정 · 서고 · 장면 바꾸기는 섬이 필요하거나 화면을 떠나 그대로
  const QTABS = [["canvas", "캔버스"], ["quest", "노트북"], ["tree", "도전과제"], ["lib", SHELF_ON ? "서고" : "책"]];   // 문서 지도 탭(C-45)은 2026-10-28 C-54로 도전과제 안의 '상자' 보기가 됐다(이재엽 버튼 "'도전과제' 그대로")   // 문서 지도 — C-45(2026-10-27, 이재엽 버튼 "작업실의 새 탭")   // 작업실 창(C-41, 2026-10-26): 캔버스가 먼저, 옛 퀘스트 탭은 노트북. 책 — C-26(2026-10-23). 배우기 탭은 2026-10-24 C-35로 도전과제의 장마다
  // 캔버스 판 — 작업실 창의 첫 탭(C-41 ① 2026-10-26 · ⑥ 2026-10-27 두승현 "의도했던 것은 첨부한 이미지처럼 펼쳐져 있는 환경" — 디자인 캔버스 DockPrototype의 판 그대로):
  //   1100×640 판을 칸(.cv)에 맞춰 줌한다(app.css .cvb의 --u — 컨테이너 단위라 스크립트 없이, 앱의 창이든 브라우저의 판이든). 2026-10-27 C-42 R-11(이재엽 "줌 + 모자라면 다시 배치"): 0.85배 아래로 줄어야 하면
  //   줌하지 않고 격자로 다시 배치한다 — 두 줄(① ② ③ / ④ ⑤ 관문) · 640 미만은 세로 한 줄, 글자 크기는 설정 그대로(app.css @container). 지금 하는 일 · 단계 칩 · 왼쪽에 지난 장 / 다음 장 보드 ·
  //   틀 안에 ① 생각(포스트잇) · 파일 카드 · 배울 말 · 화살표 → ② 행동 → ③ 기록(적은 칸 카드) → ④ 저장 → ⑤ 버전 → 관문, 작은 플로로는 첫 '지금' 칸 옆(FLO_AT).
  //   칸의 글은 지금 상태에서만 — 생각: 퀘스트의 지금 칸(quest.js), 행동: 맡긴 일(plan.js), 기록: 적은 칸 · 살펴본 결과(st.results), 저장: 단계 문서(st.docs · docs.js), 버전: 대회 뒤(C-23), 관문: 지난 날.
  const FLO_AT = { c1: [420, 100], c2: [640, 92], c3: [1040, 92], c4: [690, 382], c5: [920, 382], c6: [1040, 382] };   // 작은 플로로가 서는 자리(판 좌표) — 목업의 FLO
  const FLO_MINI = '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="38" rx="22" ry="20" fill="#EEF5FD" stroke="#9FB5D9" stroke-width="2"></ellipse><circle cx="24" cy="34" r="3" fill="#1A2350"></circle><circle cx="40" cy="34" r="3" fill="#1A2350"></circle><ellipse cx="32" cy="40" rx="2.6" ry="1.8" fill="#1A2350"></ellipse><ellipse cx="20" cy="42" rx="3" ry="1.6" fill="#F4C9CF"></ellipse><ellipse cx="44" cy="42" rx="3" ry="1.6" fill="#F4C9CF"></ellipse></svg>';
  const ARROW = (cls, w, h, d) => `<svg class="cv-ar ${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  const ARROWS = ARROW("a1", 40, 20, "M2 10h30M26 4l7 6-7 6") + ARROW("a2", 40, 20, "M2 10h30M26 4l7 6-7 6") + ARROW("a3", 130, 60, "M120 4 C 110 40, 60 46, 14 48 M22 41 L12 48 L22 55") + ARROW("a4", 40, 20, "M2 10h30M26 4l7 6-7 6") + ARROW("a5", 30, 20, "M2 10h20M17 4l7 6-7 6");
  // F-66(2026-10-27 이재엽 "캔버스가 움직이는것도 안되고"): 캔버스를 끌어서 옮기고 크게 · 작게 — canvas-pan.js가 작업실 안에서 한다(단추는 data-cv라 섬으로 보내지 않는다).
  //   처음은 '맞춤'(줌 · 다시 배치, R-11). 가운데 단추의 글(맞춤 · n%)은 canvas-pan.js가 바꾼다
  const CV_HINT = "캔버스 — 끌어서 옮겨요. ⌘ 또는 Ctrl을 누른 채 휠(트랙패드는 두 손가락 오므리기)로 크게 · 작게, 키보드는 + − 0과 화살표";
  const CV_TOOLS = `<div class="cv-tools" role="group" aria-label="캔버스 크기"><button type="button" data-cv="out" aria-label="작게" title="작게 (−)">−</button><button type="button" class="cv-z" data-cv="fit" aria-pressed="true" aria-label="화면에 맞춤 (지금 맞춤)" title="화면에 맞춤 (0)">맞춤</button><button type="button" data-cv="in" aria-label="크게" title="크게 (+)">+</button></div>`;
  function canvasPane(n) {
    const q = st.quest && st.quest.chap === n ? st.quest : null, r = st.results[n], ci = q ? QU.curIdx(q) : -1;
    let floAt = "";
    const cell = (pos, k, no, name, body, ft, extra) => { if (k === "now" && !floAt) floAt = pos; return `<div class="cv-c ${pos} ${k} st-${k}${pos === "c6" ? " st-gate" : ""}"><p class="ch">${no ? `${no} ` : ""}${name}<em>${{ now: "지금", done: "끝" }[k] || ""}</em></p><p>${esc(body)}</p>${extra || ""}${ft ? `<p class="ft">${esc(ft)}</p>` : ""}</div>`; };
    const p = q ? QU.progress(q) : null;
    const now = st.busy ? "플로로가 살펴보는 중" : st.finished ? "모든 장을 끝냈어요" : !q && !st.j ? "채팅에서 원하는 것을 말하면 1단계 초안을 만들어요" : q && q.phase === "draft" ? "퀘스트를 받기 전 — 노트북 탭에서 받아요" : q && q.phase === "done" ? "보고했어요 — 넘어가기 전 확인은 섬에서" : q && ci >= 0 ? `${p.n}개 중 ${p.k}번째 칸 — ${QU.shortOf(q.objs[ci].name)}` : q ? "칸을 다 적었어요 — 완료 보고" : progress();
    const line = q && ci >= 0 ? (q.lines[ci] || [])[0] : "", draft = q && ci >= 0 ? QU.proposalOf(q, ci) : "";
    const prepC = st.prep && st.prep.ok && st.prep.cards ? st.prep.cards[n] : null, prepThink = prepC ? prepC.think : "";   // C-54 준비된 퀘스트 — 그 장에 들어서면 ① 생각의 초안 자리에
    const think = q && ci >= 0 ? cell("c1", "now", "①", "생각", line || draft || prepThink || "비었어요 — 채팅에서 같이 적어요", !line && draft ? "플로로 초안 — 채팅에서 맞는지 봐요" : !line && prepThink ? `준비된 퀘스트 — ${prepC.from}` : "")
      : q || r ? cell("c1", "done", "①", "생각", "칸을 다 적었어요") : cell("c1", st.idea ? "done" : "now", "①", "생각", st.idea ? st.idea.slice(0, 80) : "무엇을 만들고 싶은지 말해요");
    const b = FP && st.plan, run = b && FP.running(b), pg = b ? FP.progress(b) : null;
    // R-5 ② 행동(C-42, 2026-10-27): 지금 맡긴(또는 다음에 맡길) 일의 이름과 진행 n/m — 상태 글 대신 내용
    const wst = (id) => (b && b.work && b.work[id] ? b.work[id].state : "todo");
    const curItem = b ? b.plan.items.find((x) => wst(x.id) === "running") || b.plan.items.find((x) => wst(x.id) === "todo") : null, itemName = curItem ? String(curItem.need || curItem.check || "").slice(0, 60) : "";
    const act = run ? cell("c2", "now", "②", "행동", `${itemName ? `${itemName} — ` : ""}Claude Code가 하는 중 · 맡긴 일 ${pg.done}/${pg.total}`, "다 되면 채팅에 보고가 와요") : b && b.confirmed ? cell("c2", pg.done === pg.total ? "done" : "later", "②", "행동", `${itemName ? `다음: ${itemName} · ` : ""}맡긴 일 ${pg.done}/${pg.total}`, "채팅의 '맡기기'로 다음 줄을") : cell("c2", "later", "②", "행동", "Claude Code에 맡김", "준비 계획을 확정하면 맡겨요");
    const ck = r && r.check;
    // R-5 ③ 기록(C-42): 적은 칸은 카드에 그 줄(정한 것)을 보인다 — 아직인 칸은 짧은 이름. 3단계의 '꼭 / 있으면 좋음'은 한 칸(Ⅲ)에 적는다 [해석: 스토리보드의 두 칸 → 한 줄]
    const cards = q ? `<div class="cv-cards">${q.objs.map((o, i) => { const ln = (q.lines[i] || [])[0] || ""; return `<span class="${QU.filled(q, i) ? "y" : ""}" title="${ROMAN(i)} ${esc(QU.nameOf(q, i))}">${ROMAN(i)} ${esc(QU.filled(q, i) && ln ? ln : QU.nameOf(q, i))}</span>`; }).join("")}</div>` : "";
    const rec = r ? cell("c3", "done", "③", "기록", `확인 ${r.at || ""}${ck ? ` · 기준 ${ck.filter((x) => x.met).length}/${ck.length}` : ""}`, "도전과제 탭에서 칸마다 누가 정했는지") : q ? cell("c3", QU.isDone(q) ? "now" : "later", "③", "기록", `정한 줄 ${q.objs.filter((_, i) => QU.filled(q, i)).length}/${q.objs.length}`, QU.isDone(q) ? "완료 보고를 하면 플로로가 살펴봐요" : "", cards) : cell("c3", "later", "③", "기록", "① 생각이 끝나면 칸이 생겨요");
    // R-5 ④ 저장(C-42): 올라갈 파일 이름 — 이 장의 단계 문서 · 기획서 · 결정 기록(docs.js가 만드는 것과 같은 이름)
    const slug = FDOCS ? FDOCS.SLUGS[n] : "", files = slug ? [`docs/${slug}/${slug.slice(3)}.md`, FDOCS.MAIN_DOC, FDOCS.LOG_DOC] : [];
    const fl = files.length ? `<ul class="cv-files">${files.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : "";
    const save = docDone(n) ? cell("c4", "done", "④", "저장", "단계 문서를 확정했어요", "", fl) : FDOCS && st.results[0] && st.results[1] ? cell("c4", "now", "④", "저장", "문서로 묶어 GitHub에", "도전과제 탭의 한눈에 보기에서", fl) : cell("c4", "later", "④", "저장", "아직 — 관문 뒤에", "", fl);
    const ver = cell("c5", "later", "⑤", "버전", `${LB(n)}를 넘으면 책에 V.${n + 1}`, "대회 뒤 (C-23)");
    // R-5 관문(C-42): 남은 기준 수와 '안 됨'인 기준 이름(짧은 이름) — 셋까지, 나머지는 +n
    const unmet = st.j && !st.finished && st.j.stage === n ? st.j.criteria.filter((x) => !x.met).map((x) => QU.shortOf(x.text)) : [];
    const ul = unmet.length ? `<details class="cv-unmet-d"><summary>남은 기준 ${unmet.length}</summary><ul class="cv-unmet">${unmet.slice(0, 3).map((x) => `<li>안 됨 · ${esc(x)}</li>`).join("")}${unmet.length > 3 ? `<li>+${unmet.length - 3}</li>` : ""}</ul></details>` : "";   // C-60: 처음엔 접혀 있다
    const gate = r && r.passed ? cell("c6", "done", "", "관문", `지났어요 ${r.passed.slice(5)}`) : holding() ? cell("c6", "later", "", "관문", "멈춰 둔 단계 — 섬에서 다시 열어요") : allDone() ? cell("c6", "now", "", "관문", "넘어가기 전 확인 — 섬에서") : cell("c6", "later", "", "관문", st.j ? (unmet.length ? "넘어가기 전 확인" : `남은 기준 ${left()}`) : "할 일을 다 하면 열려요", "", ul);   // 남은 기준 수는 접힌 줄(details)에 한 번만
    const [fx, fy] = FLO_AT[floAt || "c1"];
    // C-58(2026-10-29): 정보마다 집 하나 — 단계 이름은 머리 줄(stageHead — 단계 칩은 2026-10-29 두승현 결정으로 뺐다), '지금 하는 일' · 작은 플로로는 섬 카드가 보이는 동안 그리지 않는다(섬이 접혔을 때만), 보드 · 배울 말 · 파일 카드는 뺐다
    return `<div class="cvw"><div class="cv" tabindex="0" role="region" aria-label="${CV_HINT}"><div class="cvp"><div class="cvb" style="--fa:${floAt || "c1"}">${colFolded() ? `<div class="cv-now">지금 하는 일 <b>${esc(now)}</b></div>` : ""}<div class="cv-frame"></div><div class="cv-bh"><span>퀘스트 한 바퀴 — 다섯 칸</span></div>
      ${think}${ARROWS}${act}${rec}${save}${ver}${gate}${colFolded() ? `<div class="cv-flo" style="--fx:${fx};--fy:${fy}" title="플로로 — 지금 칸 옆에">${FLO_MINI}</div>` : ""}</div></div></div>${CV_TOOLS}</div>`;
  }
  // 파일 칸(C-41 ⑥ → C-42 R-8, 2026-10-27 이재엽 버튼 "전부" · "깊이 3 · 200개"): 작업실 왼쪽의 폴더 트리. 서버로 연 화면은 GET /api/files(API.md 3-25 — 연결한 폴더의 이름만, 읽기만)로 진짜 목록을,
  //   서버 없이 · 연습 모드 · 폴더를 모르면 아래 예시 그대로(목업의 예시 — [이름, 안쪽인가, 상태 글, 모양])에 '예시' 표시. 지금 장 문서는 '● 지금', 지난 장 문서는 '읽음', 폴더는 눌러 접고 펼친다
  //   예시 한 줄 = [이름, 안쪽인가, 상태 글, 모양, 펼친 폴더인가]
  const FILES_DUMMY = [["README.md", 0, "고침 · 책", "fix"], ["CLAUDE.md", 0, "", ""], ["docs", 0, "", "dir", 1], ["01-idea.md", 1, "읽음", ""], ["03-requirements.md", 1, "지금", "now"], ["decisions.md", 1, "새로", "new"], ["기획서.md", 1, "", ""], ["src", 0, "", "dir"]];
  // F-67(2026-10-27 이재엽 "지금 폴더들도 폴더라는 느낌이 안들어"): 폴더는 꺾쇠(펼치면 아래로) + 폴더 그림(접힘 · 펼침) + 굵은 이름 + 안의 개수, 파일은 종류 그림(md · 코드 · 그 밖).
  //   깊이마다 들여쓰기 안내선(app.css). 그림은 파스텔 — 이름 글자가 뜻을 갖고 그림은 거든다
  const FN_PAGE = (fill, line, glyph) => `<svg viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="${fill}" stroke="${line}" stroke-linejoin="round"/><path d="M9.5 1.5v3h3" fill="none" stroke="${line}" stroke-linejoin="round"/>${glyph}</svg>`;
  const FN_ICON = { dir: '<svg viewBox="0 0 16 16"><path d="M1.5 4.25c0-.69.56-1.25 1.25-1.25h3.4l1.5 1.5h5.6c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H2.75c-.69 0-1.25-.56-1.25-1.25z" fill="#F2DC94" stroke="#B48A2C"/></svg>',
    open: '<svg viewBox="0 0 16 16"><path d="M1.5 12.5V4.25c0-.69.56-1.25 1.25-1.25h3.4l1.5 1.5h5.1c.69 0 1.25.56 1.25 1.25V7" fill="#E8CD7A" stroke="#B48A2C" stroke-linejoin="round"/><path d="M3.9 7h10.9l-2.3 5.75H1.5z" fill="#F7E6AE" stroke="#B48A2C" stroke-linejoin="round"/></svg>',
    md: FN_PAGE("#E6EEFB", "#6F86C2", '<path d="M5.5 8h5M5.5 10.5h5M5.5 13h3" stroke="#6F86C2" stroke-linecap="round"/>'),
    code: FN_PAGE("#E3F4EA", "#4E8E6A", '<path d="M6.5 8.5 5 10l1.5 1.5M9.5 8.5 11 10l-1.5 1.5" fill="none" stroke="#4E8E6A" stroke-linecap="round" stroke-linejoin="round"/>'),
    file: FN_PAGE("#F1F3F8", "#8E9AB6", "") };
  const FN_CHEV = '<svg viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const fIcon = (k) => `<i class="fi" aria-hidden="true">${FN_ICON[k] || FN_ICON.file}</i>`;
  const fKind = (name) => (/\.(md|mdx|markdown|txt)$/i.test(name) ? "md" : /\.(m?[jt]sx?|cjs|py|java|kt|go|rb|rs|c|h|cc|cpp|cs|php|swift|html?|css|scss|json|ya?ml|toml|sh|sql|vue|svelte)$/i.test(name) ? "code" : "file");
  const exRow = ([name, inner, tag, k, open]) => { const dir = k === "dir";
    return `<li class="${k === "now" ? "st-now" : k} d${inner ? 2 : 1}"><span class="fn-x">${dir ? `<i class="chev-w${open ? " on" : ""}" aria-hidden="true">${FN_CHEV}</i>${fIcon(open ? "open" : "dir")}` : `<i class="chev-w"></i>${fIcon(fKind(name))}`}<span>${esc(name)}</span></span>${tag ? `<small>${esc(tag)}</small>` : ""}</li>`; };
  async function loadFiles() {
    if (!canLive || st.mode === "fixture") { st.files = { src: "example", why: canLive ? "연습 모드예요" : "서버 없이 열었어요" }; return; }   // 연습 모드는 진짜 폴더를 섞지 않는다(README와 같이)
    try {
      const r = await (await fetch("/api/files", { cache: "no-store" })).json();
      if (r && r.ok && r.files) {
        const n = st.finished ? N.STAGES.length - 1 : atStage(), slug = FDOCS ? FDOCS.SLUGS[n] : "";
        st.fnOpen = r.files.map((f, i) => (f.dir && (f.path === "docs" || (slug && f.path === `docs/${slug}`)) ? String(i) : "")).filter(Boolean);   // 지금 장의 폴더는 펼쳐 둔다 — 열쇠는 목록의 번호(가린 이름끼리 경로가 겹칠 수 있다, 새 맥락 리뷰)
        st.files = { src: "mine", project: r.project, list: r.files, total: r.total, cut: !!r.cut, unread: r.unread || 0, depth: r.depth, why: "" };
        for (const f of st.openFiles) f.i = r.files.findIndex((x) => !x.dir && x.path === f.path);   // 열린 파일은 새 목록의 번호로 다시 잇는다(없어졌으면 -1 — 저장하지 못한다)
      } else st.files = { src: "example", why: "연결한 폴더를 아직 몰라요" };
    } catch { st.files = { src: "example", why: "서버에 닿지 않았어요" }; }
    render();
  }
  // 이 조각의 누르기 — 00-base의 누르기 표(ACT)에 더한다. 공통 누르기는 90-acts.js(2026-10-29 나누기 2차)
  Object.assign(ACT, {
    // C-48 가져갈 것 — 8단계 초안(AI 한 번) · 채택 · 반려(까닭) · 보류, 단계에 들어서면 지난 프로젝트에서 가져온 것 고르기
    "carry-draft": async () => {
      if (!st.carry || st.carry.phase !== "offer") return;
      const r = await callAI("/api/carry/draft", { topic: st.topic || "", lessons: learnedList() });
      if (!r.ok) { render(); return say(r.reason || "초안을 만들지 못했어요"); }
      const tag = Date.now().toString(36);
      st.carry = { phase: "drafts", drafts: r.drafts.map((d, k) => ({ id: `c${tag}${k}`, text: d.text, why: d.why || "", stage: Number.isInteger(d.stage) ? d.stage : -1, review: d.review || "", from: Array.isArray(d.from) ? d.from : [] })), say: r.say || "" };
      st.tokens = r.tokens || 0; fetchUsage(); render();
    },
    "carry-adopt": (i) => carryDecide(i, "adopt"),
    "carry-hold": (i) => carryDecide(i, "hold"),
    "carry-reject": (i) => {
      const d = st.carry && st.carry.drafts && st.carry.drafts[i]; if (!d || d.state) return;
      if (!d.rejecting) { d.rejecting = true; return render(); }
      if (!String(d.reason || "").trim()) return say("버리는 까닭을 한 줄 적어 주세요 — 반려도 지우지 않고 남겨요");
      carryDecide(i, "reject", d.reason.trim());
    },
    "carry-from": (i, el) => { const d = st.carry && st.carry.drafts && st.carry.drafts[i], v = Number(el && el.dataset.v); if (!d || d.state || !N.STAGES[v]) return; d.from = d.from.includes(v) ? d.from.filter((x) => x !== v) : [...d.from, v].sort((a, b) => a - b); render(); },
    "carry-hold-rest": async () => { const C = st.carry; if (!C || !C.drafts) return; for (let k = 0; k < C.drafts.length; k++) if (!C.drafts[k].state) await carryDecide(k, "hold"); },   // 미루면 보류(지식 퀘스트 9절 2번) — 다음 프로젝트를 시작할 때 다시 묻는다
    "carry-later": () => set({ carry: null }),
    "carry-use": (i) => { const O = st.carryOffer, x = O && O.items[i]; if (!x) return; O.pick = O.pick.includes(x.id) ? O.pick.filter((y) => y !== x.id) : [...O.pick, x.id]; render(); },
    "carry-held-adopt": async (i) => {
      const O = st.carryOffer, x = O && O.held[i]; if (!x || x.saving) return;
      x.saving = true;
      const r = await carryPost({ action: "adopt", item: x, id: x.id });
      x.saving = false;
      if (!r.ok) return say(r.reason || "남기지 못했어요");
      O.held = O.held.filter((y) => y.id !== x.id);
      if (!O.items.length && !O.held.length) st.carryOffer = null;
      render(); say("채택했어요 — 다음 프로젝트부터 그 단계에서 보여요");
    },
    "carry-use-done": () => { const O = st.carryOffer; if (!O) return; st.carryUse = { ...st.carryUse, [O.n]: O.items.filter((x) => O.pick.includes(x.id)).map((x) => ({ id: x.id, text: x.text })) }; st.carryOffer = null; save(); render(); },
    "carry-use-none": () => { const O = st.carryOffer; if (O) st.carryUse = { ...st.carryUse, [O.n]: [] }; st.carryOffer = null; save(); render(); },
    // C-49 폴더의 기록 — 되살리기(이 브라우저에 기록이 없을 때) · 다시 읽기(낡음) · 나중에(다음에 열 때 다시)
    "restore-go": () => {
      const R = st.restore; if (!R || R.phase !== "offer") return;
      const d = R.data, nx = resumeStage(d.stages);
      st.results = Object.fromEntries(R.got.map((n) => [n, { chap: n, title: d.topic || "", ...d.stages[n].result }]));
      if (!st.topic && d.topic) st.topic = d.topic;
      if (!st.idea && d.idea) st.idea = d.idea;   // 처음 말한 것 — 되살리지 않으면 다음 올리기에서 기획서의 처음 말이 지워진다(새 맥락 리뷰)
      if (!st.source && d.source) st.source = d.source;
      const all = Object.entries(d.stages);   // 읽을 수 없는 문서(result null)도 — 사람 것으로 두고 덮지 않는다
      st.docPrints = { project: d.key || "", seen: Object.fromEntries(all.map(([n, x]) => [n, x.print])), wrote: Object.fromEntries(all.filter(([, x]) => x.lossless).map(([n, x]) => [n, x.print])), own: Object.fromEntries(all.filter(([, x]) => !x.lossless).map(([n, x]) => [n, x.print])), dirty: false };
      const t = tierOf(st.results[0]); if (t) st.tier = t;
      st.restore = null;
      if (nx > 0) resumeAt(nx);
      save(); render(); say(`${R.got.map((n) => LB(n)).join(" · ")} 기록을 폴더에서 되살렸어요.`);
      if (N.STAGES[nx]) carryLoad(nx);   // C-48
      if (QU && st.j && st.j.stage === nx && N.DRAFT_STAGES.includes(nx) && st.results[nx - 1]) stageDraft(nx); else if (st.j && st.j.stage === nx) questText();
    },
    "restore-read": () => {
      const R = st.restore; if (!R || R.phase !== "stale") return;
      const d = R.data, read = R.stale.filter((n) => d.stages[n].result && st.results[n]), P = DP(), wrote = { ...(P.wrote || {}) }, own = { ...(P.own || {}) };
      // 그 단계 기록을 폴더의 글로 바꾼다(문서에 없는 칸 — 제목 · 코드 없이 지남 — 만 남긴다). 사람이 칸을 비웠으면 비운 대로
      st.results = { ...st.results, ...Object.fromEntries(read.map((n) => { const old = st.results[n]; return [n, { chap: n, title: old.title, ...(old.nocode ? { nocode: true } : {}), ...d.stages[n].result }]; })) };
      for (const n of R.stale) { if (d.stages[n].lossless) { wrote[n] = d.stages[n].print; delete own[n]; } else { own[n] = d.stages[n].print; delete wrote[n]; } }   // 다시 써도 같은 글일 때만 Floe가 덮는다 — 아니면 그 문서는 사람 것(올릴 때 keep → kept)
      st.docPrints = { ...P, wrote, own, seen: { ...(P.seen || {}), ...Object.fromEntries(R.stale.map((n) => [n, d.stages[n].print])) }, dirty: !!read.length || !!P.dirty };
      st.restore = null;
      if (read.length && st.results[0] && st.results[1]) st.ship = { phase: "offer" };   // 그 글로 만든 기획서 · 결정 기록도 같은 파일에 고쳐 쓸지(새 파일을 쌓지 않는다)
      save(); render(); if (read.length) say(`${read.map((n) => LB(n)).join(" · ")} 기록을 폴더의 글로 다시 읽었어요.`);
    },
    "restore-later": () => {   // 새로 시작(되살리기를 고르지 않음)이면 이 폴더에서는 다시 묻지 않는다. 낡음 · 근거 없음은 다음에 열 때 다시
      const R = st.restore;
      if (R && R.phase === "offer") { st.docPrints = { project: R.data.key || "", wrote: {}, seen: {}, own: {}, declined: true }; save(); }
      set({ restore: null });
      if (R && R.phase === "offer") carryLoad(0);   // C-48 새로 시작 — 1단계에 가져온 것 · 보류한 것
    },
  });
