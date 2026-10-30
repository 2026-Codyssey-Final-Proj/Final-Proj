  // ── C-47 남은 몫(2026-10-30, 이재엽 버튼 "10/31까지" — 지식 퀘스트 PRD 3 · 6 · 7절, 9절 5번): 재료는 저절로 · ③ 기록 칸의 한 장은 확인만 ──
  //   재료 — 내가 한 말(logMe) · 맡긴 일 보고(planEnd) · 허락 결정(decideApproval — 도구 이름만) · 먹이 구간의 종류(feedConfirm) · 바뀐 파일 이름(그 단계의 훅 알림, stageFilesOf).
  //   가린 뒤 이름 · 한 줄 · 수만, 이 컴퓨터에만(sheet.js add). 대화 원문 · 도구 입력은 남기지 않는다.
  //   한 장 — 완료 보고 뒤(그 단계 결과가 생기면) 채팅 위 카드로 다섯 칸 초안을 규칙으로(AI를 부르지 않는다 — 연습 모드에서도 서버 없이).
  //   맞아요 → 단계 결과의 sheet(확인한 날) → '문서로 묶어 GitHub에'에서 단계 문서의 '한 장' 절 · README의 그 단계 절(docs.js), 폴더에서 다시 읽힌다(C-49). 고칠래요 → 칸마다 고쳐 저장
  const SH = window.FloeSheet;
  keep(["mats"]);
  st.mats = SH ? SH.fromSaved(st.mats) : {};
  let sheetEdit = null;   // 고치는 중인 다섯 칸 { n, s } — 저장하지 않는다
  const sheetLater = new Set();   // 이번 켜짐에 '나중에'를 누른 단계
  const matStage = () => (st.quest ? st.quest.chap : atStage());   // 채팅 기록(logMsg)과 같은 단계
  function mat(kind, text) { if (SH) st.mats = SH.add(st.mats, matStage(), kind, text, (t) => (window.NavSensitive ? window.NavSensitive.redact(t) : t)); }
  function sheetDraft(n) {
    const r = st.results[n], s = N.STAGES[n] || {}, nx = N.STAGES[n + 1];
    return SH.draft({ title: s.title || "", mats: (st.mats || {})[n] || [], cells: (r ? r.items : []).map((x) => ({ name: QU ? QU.shortOf(x.name) : x.name, line: (x.lines || [])[0] || "" })),
      terms: crits(n).map((c) => c.term).filter(Boolean), files: stageFilesOf(n).map((x) => x.path), next: nx ? `${LB(n + 1)} · ${nx.title}` : "마지막 단계 — 돌아보기를 마쳐요" });
  }
  // 지금 단계에 결과가 있고 아직 한 장을 확인하지 않았으면 그 단계, 아니면 -1
  const sheetFor = () => { const n = nowStage(), r = st.results[n]; return SH && r && !r.sheet && !sheetLater.has(n) ? n : -1; };
  function sheetHTML() {
    const n = sheetFor(); if (n < 0) return "";
    const ed = !!sheetEdit && sheetEdit.n === n, s = ed ? sheetEdit.s : sheetDraft(n);
    const rows = SH.FIELDS.map(([k, w]) => (ed ? `<label class="sh-f"><b>${w}</b><textarea data-act="sheet-field" data-k="${k}" rows="2" maxlength="${SH.FIELD_MAX}" aria-label="한 장 — ${w}">${esc(s[k])}</textarea></label>`
      : `<div class="sh-f"><b>${w}</b><span>${esc(s[k])}</span></div>`)).join("");
    const acts = ed ? `<button type="button" class="b pri" data-act="sheet-save">이대로 저장</button><button type="button" class="b ghost" data-act="sheet-edit">그만 고치기</button>`
      : `<button type="button" class="b pri" data-act="sheet-ok">맞아요</button><button type="button" class="b" data-act="sheet-edit">고칠래요</button><button type="button" class="b ghost" data-act="sheet-later">나중에</button>`;
    return `<div class="msg floro sh"><div class="b"><p><b>③ 기록 — ${LB(n)} 한 장</b> 이 단계에서 한 일을 한 장으로 묶었어요. 맞으면 '맞아요', 고칠 곳이 있으면 '고칠래요'.</p><div class="sh-grid">${rows}</div><p class="mc-fine">맞아요 하면 '문서로 묶어 GitHub에'에서 README의 그 단계 절과 단계 문서에 들어가요.</p><div class="opts">${acts}</div></div></div>`;
  }
  function sheetInput(k, v) { if (sheetEdit && SH.FIELDS.some(([f]) => f === k)) sheetEdit.s = { ...sheetEdit.s, [k]: String(v).slice(0, SH.FIELD_MAX) }; }   // 치는 동안 다시 그리지 않는다
  const sheetKeep = (n, s) => { st.results = { ...st.results, [n]: { ...st.results[n], sheet: { ...s, at: ymd() } } }; sheetEdit = null; save(); render(); say(`${LB(n)} 한 장을 기록에 넣었어요`); };
  Object.assign(ACT, {
    "sheet-ok": () => { const n = sheetFor(); if (n >= 0) sheetKeep(n, sheetDraft(n)); },
    "sheet-edit": () => { const n = sheetFor(); if (n < 0) return; sheetEdit = sheetEdit && sheetEdit.n === n ? null : { n, s: sheetDraft(n) }; render(); },
    "sheet-save": () => {
      const n = sheetFor(); if (n < 0 || !sheetEdit || sheetEdit.n !== n) return;
      const s = Object.fromEntries(SH.FIELDS.map(([k]) => [k, String(sheetEdit.s[k] || "").trim()]));
      if (!SH.ok(s)) return say("칸마다 한 줄은 적어 주세요");
      sheetKeep(n, s);
    },
    "sheet-later": () => { const n = sheetFor(); if (n >= 0) { sheetLater.add(n); sheetEdit = null; render(); } },
  });
