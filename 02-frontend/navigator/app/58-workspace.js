  // ── C-53 작업실 세 칸(2026-10-28, 이재엽 버튼 "오른쪽 칸은 섬을 펼치면 접힘" · "서식 단추는 만든다", 목업 캔버스 ②): 파일 칸 | 작업 칸 | 오른쪽 칸(위: 이 문서 — 목차 · 칸 채움 · 재료, 아래: 퀘스트 — 지금 단계 · 다섯 칸 · 관문 남은 기준).
  //   파일 칸 · 오른쪽 칸은 머리 줄 단추로 접는다(이 컴퓨터에 기억). 앱에서 섬을 펼치면(접힌 알약이 아니면) 오른쪽 칸이 접혀 작업실이 비킬 자리를 만든다 — 섬을 접으면 다시 보인다
  const sideOn = () => wsideOpen && (!WINS || colFolded());
  const PANE_L = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4" width="15" height="12" rx="2.5"/><path d="M7.5 4v12"/></svg>', PANE_R = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4" width="15" height="12" rx="2.5"/><path d="M12.5 4v12"/></svg>';
  function wsideHTML(n) {
    const f = st.qtab === "file" ? st.openFiles[st.fileSel] : null;
    let doc = "", head = "이 문서";
    if (st.qtab === "tree" && st.mapSel != null && SM) { const m0 = stageMap(), c0 = m0 && m0.cards[st.mapSel]; if (c0) head = `${LB(c0.n)} · ${esc(c0.title)} — ${STATE_WORD[c0.state]}`; }
    if (f) {
      const toc = f.kind === "md" && MDV ? MDV.outline(f.text) : [], empty = toc.filter((h) => h.empty).length;
      const mats = [n > 0 ? `${LB(n - 1)} 문서 — ${nowDocPath(n - 1)}` : "", st.idea ? "처음 말한 것(01-idea/idea.md)" : ""].filter(Boolean);
      doc = `<section class="ws-doc"><h4>${head}</h4><p class="ws-sum">${esc(f.name)}${toc.length ? ` · 절 ${toc.length}개${empty ? ` · <b>빈 절 ${empty}</b> — 비었어요` : " · 다 채웠어요"}` : f.kind === "md" ? " · 제목 줄이 없어요" : ` · ${f.text.split("\n").length}줄`}</p>${
        toc.length ? `<p class="ws-h">목차</p><ul class="ws-toc">${toc.map((h) => `<li class="l${h.level}${h.empty ? " empty" : ""}"><button type="button" data-act="ftoc-go" data-v="${esc(h.text)}" data-line="${h.line}" title="${h.empty ? "비었어요 — 눌러서 이 절을 찾기" : "눌러서 이 절을 찾기"}">${esc(h.text)}${h.empty ? "<small>비었어요</small>" : ""}</button></li>`).join("")}</ul>` : ""}${
        mats.length ? `<p class="ws-h">재료가 온 곳</p><ul class="ws-mat">${mats.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</section>`;
    } else doc = `<section class="ws-doc"><h4>${head}</h4><p class="ws-sum">파일을 열면 목차와 빈 절이 여기에 와요</p></section>`;
    // C-54: 도전과제의 카드를 눌렀으면 그 카드의 퀘스트(준비된 다섯 칸) · 문서 · 재료
    if (st.qtab === "tree" && st.mapSel != null && SM) {
      const m = stageMap(), c = m && m.cards[st.mapSel]; if (c) {
        // C-54 ⑧(2026-10-28): 큰 카드의 줄을 눌렀다 — 누가 정했나(플로로 초안 → 고침 · 고름 · 직접 · 옮김) · 재료가 온 곳 · 이 줄을 쓰는 다음 단계 · 파일 보기 / 틀로 맡기기. 빈 칸은 플로로 초안 + 채팅에서 같이 적기
        if (st.mapLine && st.mapLine.n === c.n) { const x = stageCells(c.n)[st.mapLine.k];
          if (x) { const uses = SM.usedBy({ s: c.n, i: st.mapLine.k }, st.results, st.quest), who = x.line ? `${QU.BY_WORD[x.by] || "적음"}${x.draft && x.draft !== x.line && (x.by === "edit" || x.by === "pick") ? ` — 플로로 초안: ${esc(x.draft)}` : x.by === "ok" ? " — 플로로 초안 그대로" : ""}` : "";
            const open = c.doc.has ? `<button type="button" class="b sm" data-act="map-open" data-v="${esc(c.doc.path)}">파일 보기</button>` : "", preset = PR && canLive && st.mode !== "fixture" && c.doc.has ? `<button type="button" class="b sm ghost" data-act="preset-open">틀로 맡기기</button>` : "";
            return `${doc}<section class="ws-line"><h4>${ROMAN(st.mapLine.k)} ${esc(QU.shortOf(x.name))}</h4><p class="ws-sum">${x.line ? `“${esc(x.line)}”` : x.draft ? `비었어요 — 플로로 초안: “${esc(x.draft)}”` : "비었어요"}</p>
              ${x.line ? `<p class="ws-h">누가 정했나</p><p class="ws-sum">${who}</p>` : `<p class="ws-sum"><button type="button" class="b sm" data-act="map-chat">채팅에서 같이 적기</button></p>`}
              <p class="ws-h">재료가 온 곳</p><ul class="ws-mat">${x.from.length ? x.from.map((f) => `<li>${esc(refLabel(f))}</li>`).join("") : "<li>받은 글만 봤어요</li>"}</ul>
              <p class="ws-h">이 줄을 쓰는 다음 단계</p><ul class="ws-mat">${uses.length ? uses.map((u) => `<li>${LB(u.s)} ${ROMAN(u.i)} ${esc(QU.shortOf(u.name))}</li>`).join("") : "<li>아직 없어요 — 다음 단계가 이 줄을 재료로 쓰면 여기에 와요</li>"}</ul>
              <p class="ws-h">문서</p><p class="ws-sum"><code>${esc(c.doc.path)}</code> ${open}${preset}${c.doc.has ? "" : " 아직 없어요"}</p></section>`; } }
        const p = c.prepared, cells = p ? [["① 생각", p.think], ["② 행동", p.act], ["③ 기록", p.record.map((x) => QU.shortOf(x)).join(" · ")], ["④ 저장", p.save], ["⑤ 버전", p.ver]] : null;
        return `${doc}<section class="ws-q"><h4>퀘스트</h4>${cells ? `<ol class="ws-cells">${cells.map(([k, v]) => `<li><b>${k}</b> ${esc(v || "—")}</li>`).join("")}</ol><p class="ws-h">재료</p><p class="ws-sum">${esc(p.from)}</p>` : `<p class="ws-sum">${c.state === "later" ? "2단계에서 그려져요" : c.q ? `다섯 칸 ${c.q.k}/${c.q.n}` : "아직"}</p>`}
          <p class="ws-h">문서</p><p class="ws-sum"><code>${esc(c.doc.path)}</code> ${c.doc.has ? `<button type="button" class="lnk" data-act="map-open" data-v="${esc(c.doc.path)}">파일 보기로 열기</button>` : "아직 없어요"}</p></section>`;
      }
    }
    const base = st.card && BC ? `<section class="ws-card"><h4>이 프로젝트의 기준</h4>${baseCardHTML(BC.withEdits(st.card, st.cardEdits), true)}<button type="button" class="b sm" data-act="card-edit">고친 것 적용</button></section>` : "";   // C-56 R-1 — 고치면 아직 안 한 퀘스트를 다시
    const q = st.quest && st.quest.chap === n ? st.quest : null, p = q ? QU.progress(q) : null, s = N.STAGES[n];
    const unmet = st.j && !st.finished && st.j.stage === n ? st.j.criteria.filter((x) => !x.met) : [];
    const cells = q ? `<ol class="ws-cells">${q.objs.map((o, i) => `<li class="${QU.filled(q, i) ? "y" : i === QU.curIdx(q) ? "now" : ""}">${ROMAN(i)} ${esc(QU.nameOf(q, i))}</li>`).join("")}</ol>` : `<p class="ws-sum">${st.j ? "퀘스트를 받기 전이에요 — 노트북 탭에서 받아요" : "채팅에서 원하는 것을 말하면 1단계 퀘스트가 생겨요"}</p>`;
    const quest = `<section class="ws-q"><h4>퀘스트</h4><p class="ws-sum"><b>${LB(n)} · ${esc(s.title)}</b>${p ? ` — 다섯 칸 중 ${p.k}번째, 정한 줄 ${q.objs.filter((_, i) => QU.filled(q, i)).length}/${q.objs.length}` : ""}</p>${cells}
      <p class="ws-h">관문</p><p class="ws-sum">${st.finished ? "모든 장을 마쳤어요" : st.results[n] && st.results[n].passed ? `지났어요 ${esc(st.results[n].passed.slice(5))}` : st.j && st.j.stage === n ? (unmet.length ? `남은 기준 ${unmet.length}개` : "기준을 다 채웠어요 — 섬에서 넘어가기 전 확인") : "아직 — 칸을 다 채우면"}</p>${
      unmet.length ? `<ul class="ws-unmet">${unmet.slice(0, 4).map((x) => `<li>${esc(QU.shortOf(x.text))}</li>`).join("")}${unmet.length > 4 ? `<li>+${unmet.length - 4}</li>` : ""}</ul>` : ""}</section>`;
    return doc + base + quest;
  }
  function qwinHTML() {
    if (!st.qwin || !QU) return "";
    const pop = qpop ? " winpop" : ""; qpop = false;   // 처음 열 때 한 번의 움직임. 이름은 winpop — "pop"은 말풍선 판(.pop — 14px 안쪽 여백 · 아래 정렬)의 이름이라 작업실 창이 처음 열릴 때 그 모양을 뒤집어썼다(⑥ 2026-10-27, 앱에서 처음 열면 창이 아래에 148px로 붙었다)
    const n = st.finished ? N.STAGES.length - 1 : atStage();
    const pane = st.qtab === "canvas" ? canvasPane(n) : st.qtab === "tree" ? treePane() : st.qtab === "lib" ? bookPane() : st.qtab === "file" ? filePane() : st.qtab === "map" ? mapPane(n) : questTab();
    // 머리 한 줄(⑥, 목업): 프로젝트 · 단계 이름 · 탭 · LV · 조개 · 크기 · 닫기. 왼쪽 파일 칸(.wnav)은 탭에 상관없이 — 펼쳐진 환경
    // 크기(R-1, 2026-10-27 이재엽 버튼 "'화면 가득' 하나로"): 앱에서는 창이 작업 영역 가득 · 사람이 바꾼 크기를 기억(main.js) — 아래 style은 브라우저 판에서만 쓰인다(win.html은 auto!important로 덮는다). S/M/L은 뺐다
    // C-62 머리 줄 하나(2026-10-29): 머리(.wh)는 판(.win) 밖의 형제 — 창 전체 폭의 첫 줄(win.html #root · 브라우저 .wsx 격자). 단계 이름 한 번 + 단계 칩(C-58), 탭, LV · 조개, 섬 단추 묶음(hisl — 집 · 설정 · 열어 두기 · 접기)은 섬 쪽(오른쪽) 끝
    const wh = `<div class="wh"><span class="ttl">작업실</span><span class="meta">${esc(project() || "")}</span><span class="tb-stage" aria-live="polite">${stageHead()}</span>
        <div class="wtabs" role="tablist" aria-label="작업실 창">${QTABS.map(([id, label]) => `<button type="button" role="tab" data-act="qtab" data-tab="${id}" aria-selected="${st.qtab === id}">${label}</button>`).join("")}${fileTabs()}</div>
        <span class="wtgs"><button type="button" class="wtg" data-act="wnav-toggle" aria-pressed="${wnavOpen}" aria-label="파일 칸 ${wnavOpen ? "접기" : "펼치기"}" title="파일 칸 ${wnavOpen ? "접기" : "펼치기"}">${PANE_L}</button><button type="button" class="wtg" data-act="wside-toggle"${WINS && !colFolded() ? " disabled" : ""} aria-pressed="${wsideOpen}" aria-label="오른쪽 칸 ${wsideOpen ? "접기" : "펼치기"}" title="${WINS && !colFolded() ? "오른쪽 칸 — 섬을 접으면 나와요" : `오른쪽 칸 ${wsideOpen ? "접기" : "펼치기"}`}">${PANE_R}</button></span><span class="grow"></span>
        <span class="wlv" title="칭호 · ${esc(QU.rankOf(Math.min(level, 7)))}">LV ${level} · <button type="button" class="shells" data-act="shells" title="무지개 조개 — 장을 지나면 하나. 셋이면 열어요" aria-label="무지개 조개 ${st.shells}개">${coin()}<span>${st.shells}</span></button></span>${hisl()}
        <button type="button" class="ti" data-act="qwin" aria-label="작업실 창 닫기" title="닫기">${X_ICON}</button></div>`;
    return `${wh}<div class="win qwin${pop}" role="dialog" aria-label="작업실 창" style="width:${BROWSER_WIN[0]}px;height:${BROWSER_WIN[1]}px">
      <div class="wmain">${wnavOpen ? `<nav class="wnav" aria-label="대화 · 파일">${chatNav()}</nav>` : ""}<div class="wbody" data-view="${esc(`${st.qtab}|${st.qtab === "lib" ? `${st.libSel || ""}|${st.libDoc ?? ""}` : st.qtab === "file" ? `${st.fileSel}|${(st.openFiles[st.fileSel] || {}).edit ? "e" : "v"}` : ""}`)}">${pane}</div>${sideOn() ? `<aside class="wside" aria-label="이 문서 · 퀘스트">${wsideHTML(n)}</aside>` : ""}</div></div>${setModal()}`;
  }
  // F-86(2026-10-29 두승현 "별도의 모달창을 중앙에"): 작업실이 열려 있으면 설정은 섬이 아니라 작업실 위 가운데 모달 — 섬은 접혀 있든 펼쳐져 있든 그대로. 바깥(바탕)을 누르면 닫힌다
  const setModal = () => (st.settings && QU ? `<div class="set-layer"><button type="button" class="set-bg" data-act="settings" tabindex="-1" aria-label="설정 닫기"></button><div class="set-modal" role="dialog" aria-modal="true" aria-label="설정">${settingsPane(true)}</div></div>` : "");
  // 받기 화면의 그림 — 자리표시(밤하늘 · 얼음 · 공책). 진짜 그림은 고한결 [정할 것 2 · 5]
  const PIC = `<svg viewBox="0 0 320 140" aria-hidden="true"><defs><linearGradient id="q-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1550"></stop><stop offset="1" stop-color="#2A4AC8"></stop></linearGradient><linearGradient id="q-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3BA6"></stop><stop offset="1" stop-color="#0E1A4F"></stop></linearGradient></defs><rect width="320" height="140" fill="url(#q-sky)"></rect><g fill="#fff"><circle cx="30" cy="22" r="1.4"></circle><circle cx="80" cy="40" r="1"></circle><circle cx="140" cy="18" r="1.6"></circle><circle cx="200" cy="34" r="1"></circle><circle cx="260" cy="16" r="1.3"></circle><circle cx="300" cy="46" r="1"></circle></g><circle cx="262" cy="36" r="16" fill="#FFF3C4"></circle><circle cx="268" cy="31" r="14" fill="url(#q-sky)"></circle><path d="M0 95 Q 80 80 160 95 T 320 95 V140 H0z" fill="url(#q-sea)"></path><path d="M70 100 L 110 78 L 200 76 L 250 100 Z" fill="#E6F6FF"></path><path d="M70 100 L 250 100 L 240 112 L 85 112 Z" fill="#A9DDFF"></path><rect x="130" y="52" width="60" height="30" rx="4" fill="#F3EBD8" stroke="#6B5B3E" stroke-width="2"></rect><path d="M138 60h44M138 67h36M138 74h40" stroke="#B99A4F" stroke-width="2" stroke-linecap="round"></path></svg>`;
  const rewardSlots = (q) => `<i class="has" tabindex="0" aria-label="무지개 조개 ×1" data-tt="무지개 조개 ×1|장을 지나면 하나. 셋이면 열어요(뽑기는 다음 판)">${coin()}</i><i class="has" tabindex="0" data-tt="책갈피|직접 쓴 말은 책에 남아요">▮</i><i class="has" tabindex="0" data-tt="칭호 '${esc(QU.rankOf(Math.min(7, q.chap + 1)))}'|이 장을 지나면 칭호가 바뀌어요">🏅</i><i></i><i></i><i></i><i></i>`;
  // 퀘스트 판 — 없음 · 받기 화면(이벤트 창 짜임: 제목 띠 + ? · 그림 · 참여 조건 · 할 일 · 기간 · REWARD · 큰 받기 단추) · 공책(왼쪽 목차 · 오른쪽 줄 — 여기서 고친다)
  // 퀘스트 창 쉬운 말(C-40, 2026-10-26 — 이재엽 "퀘스트에서도 자세히 보이지만 어렵게 보이고 있어" · 버튼 "짧은 이름 + 쉬운 한 줄"): 목차 · 공책은 짧은 이름과 쉬운 한 줄, 원래 할 일 문장 · 용어는 '자세히 보기'에서
  let qmore = false, moreOpen = false;   // moreOpen — 늘 있는 칩 줄을 펼쳤나(C-60, 2026-10-29: 주 단추는 '보내기' 하나, 칩은 '더 보기' 뒤에)
  function questPane() {
    const q = st.quest;
    if (!q || q.phase === "done") return `<div class="qempty"><b>${st.finished ? "모든 장을 끝냈어요" : q ? `${LB(q.chap)} 퀘스트를 보고했어요` : st.j ? "다음 퀘스트는 넘어가기 전 확인을 지나면 받아요" : "아직 퀘스트가 없어요"}</b>${
      !q && !st.j ? "채팅에서 원하는 것을 플로로에게 알려 주면 1단계 초안을 만들어요.<br>그러면 이 창에 1단계 퀘스트가 떠요." : st.finished ? (SHELF_ON ? "책은 서재의 서고에 꽂아 두고 언제든 다시 펼쳐요." : "책은 이 창의 책 탭에서 언제든 다시 펼쳐요.") : "할 일을 다 하면 플로로가 '이해되셨나요?'를 묻고, 지나면 다음 장 퀘스트를 받아요."}</div>`;
    const ed = q.edit, done = QU.isDone(q), ci = QU.curIdx(q), metOf = (i) => !!(st.j && st.j.stage === q.chap && st.j.criteria[i] && st.j.criteria[i].met);
    if (q.phase === "draft") return `<div class="ev">
        <div class="ttl"><span></span><span>${ed ? `<input data-act="quest-title" value="${esc(q.title)}" aria-label="퀘스트 이름" maxlength="40">` : esc(q.title)}</span><button type="button" class="q" data-tt="이 퀘스트가 왜 있나요|${esc(q.why)}" aria-label="왜 하나요">?</button></div>
        <div class="pic">${PIC}<div class="cap">${LB(q.chap)} · ${esc(q.title)}${q.title !== N.STAGES[q.chap].title ? ` — ${esc(N.STAGES[q.chap].title)}` : ""}</div></div>
        <div class="box"><h4>참여 조건</h4><p>${esc(q.cond)}</p></div>
        <div class="box${ed ? " edit" : ""}"><h4>할 일${ed ? " — 고치는 중" : ""}</h4><p>${q.objs.map((o, i) => (ed ? `${esc(o.name)} <input type="number" min="1" max="5" value="${o.need}" data-act="quest-need" data-i="${i}" aria-label="${esc(o.name)} 개수">개` : `${esc(o.name)} ${o.need}개`)).join(" · ")}</p></div>
        <div class="box"><h4>기간</h4><p>${esc(q.when)}</p></div>
        <div class="box"><h4>REWARD</h4><div class="slots">${rewardSlots(q)}</div></div>
        <button type="button" class="join" data-act="${ed ? "quest-save" : "quest-ok"}">${ed ? "이대로 받기" : "퀘스트 받기"}</button>
        <div class="sub"><button type="button" data-act="${ed ? "quest-cancel" : "quest-fix"}">${ed ? "고치기 취소" : "고쳐 주세요"}</button><button type="button" data-act="quest-later">나중에</button></div></div>`;
    const toc = q.objs.map((o, i) => { const cls = metOf(i) || QU.filled(q, i) ? "done" : i === ci ? "" : "lock";
      return `<button type="button" data-act="quest-sel" data-i="${i}" aria-pressed="${q.sel === i}" class="st-${cls === "done" ? "done" : cls === "lock" ? "later" : "now"}" data-tt="${esc(QU.nameOf(q, i))}|${esc(QU.easyOf(o.name))}">${ROMAN(i)}. ${esc(QU.nameOf(q, i))}<small>${cls === "done" ? (metOf(i) ? "끝냄 ✓" : "적음") : cls === "lock" ? "★ 아직" : "지금"}</small></button>`; }).join("")
      + ((q.side || []).length ? `<div class="side-h">곁 퀘스트 — 안 해도 돼요</div>${q.side.map((s) => `<button type="button" class="lock" disabled title="만드는 크기를 키우면 할 일이 돼요">${s.icon} ${esc(s.name)}<small>★ 더 크게 만들 때</small></button>`).join("")}` : "");
    const sts = qstates(q), badge = (i) => { const x = sts[i]; if (!x || x.state === "write") return ""; const w = QS.STATE_WORD[x.state]; return `<small class="qs qs-${x.state}" title="${esc(x.why || "")}">${w}${x.from ? ` · ${LB(x.from.s)} ${ROMAN(x.from.i)}` : ""}</small>`; };   // C-56 상태 넷
    const lines = q.objs.map((o, i) => { const ls = q.lines[i] || [], ok = metOf(i);
      return `<div class="ln${ok ? " done" : ""}${q.sel === i ? " sel" : ""}"><span class="ck">${ok ? OK_ICON : ""}</span><span class="lt">${ed ? `<input data-act="quest-name" data-i="${i}" value="${esc(o.name)}" aria-label="할 일 이름" maxlength="60">` : `<b>${esc(QU.nameOf(q, i))}</b>${o.term ? `<small class="method">${esc(o.term)}</small>` : ""}${badge(i)}${QU.easyOf(o.name) ? `<span class="easy">${esc(QU.easyOf(o.name))}</span>` : ""}${qmore ? `<span class="full">${esc(o.name)}${o.term ? ` ${termTag(o.term)}` : ""}</span>` : ""}`}${
        ls.map((l, k) => (ed ? `<input data-act="quest-line" data-i="${i}" data-k="${k}" value="${esc(l)}" aria-label="적은 줄" maxlength="200">` : `<span class="lw">${esc(l)}</span>`)).join("")}${!ls.length && !ed ? `<span class="lw empty">${q.draft ? "아직 — 채팅에서 맞는지 봐요" : "아직 — 채팅에서 한 줄 적어요"}</span>` : ""}</span><span class="n">${ed ? `${ls.length} / <input type="number" min="1" max="5" value="${o.need}" data-act="quest-need" data-i="${i}" aria-label="개수">` : o.need > 1 ? `${ls.length} / ${o.need}` : ls.length ? "✓" : ""}</span></div>`; }).join("");
    return `<div class="book"><div class="page l"><h4>목차 · ${LB(q.chap)}</h4><div class="toc">${toc}</div></div>
      <div class="page r"><h3>${ed ? `<input data-act="quest-title" value="${esc(q.title)}" aria-label="퀘스트 이름" maxlength="40">` : esc(q.title)}</h3><div class="meta">${LB(q.chap)}${q.title !== N.STAGES[q.chap].title ? ` ${esc(N.STAGES[q.chap].title)}` : ""} · 플로로가 만들었어요 · ${done ? "다 적음" : "하는 중"}</div>
        <div class="lines">${lines}</div><details class="qdesc"><summary>자세히 보기 · 왜 하나요</summary><p>${esc(q.desc)}</p><p><b>왜 하나요</b> — ${esc(q.why)}</p><button type="button" class="lnk qmore" data-act="qmore" aria-expanded="${qmore}">${qmore ? "간단히 보기" : "원래 할 일 문장 · 용어 보기"}</button></details>
        <div class="rw"><span>보상</span><span class="piece">${coin()}무지개 조개 ×1</span><span class="piece">🏅 ${esc(QU.rankOf(Math.min(7, q.chap + 1)))}</span></div>
        <div class="pacts">${ed ? `<button type="button" class="pri" data-act="quest-save">저장</button><button type="button" data-act="quest-cancel">취소</button><span></span>` : `<button type="button" class="${done ? "pri" : ""}" data-act="quest-report" ${done ? "" : "disabled"}>완료 보고</button><button type="button" data-act="quest-hint">힌트</button><button type="button" data-act="quest-edit">고치기</button>`}</div></div></div>`;
  }
  // 도전과제 판(C-22) — 세로 탭 = 장(여덟), 그림만 크게, 마우스를 올리면 설명(data-tt). 상태는 지금 단계(st.j)와 퀘스트(적은 줄)에서 — 단계 · 할 일 · 판정 규칙은 그대로
  //   나무 위에 그 장의 '관문 전에 알아 둘 것'(C-35, 2026-10-24 — 옛 배우기 탭): 그 장에서 처음 쓰는 기능의 튜토리얼(tutorial.js forChap) · 이 장에서 쓰는 말(용어 풀이)
  let treeChap = null;   // null — 한눈에 보기(C-37, 기본), 숫자 — 그 장
  let treeView = "cards";   // 한눈에 보기의 보기(C-54): cards 지도 · flow 흐름 · box 상자
  // ── C-54 카드 지도(stagemap.js) — 카드 = 그 단계의 퀘스트(다섯 칸 · 관문)와 문서, 2단계 칸을 다 채우면 기획서로 3 ~ 8단계를 그리고 준비된 퀘스트를 미리 채운다(맞아요 한 번에 / 고칠래요) ──
  const haveDocs = () => { const h = new Set(); if (st.files && st.files.src === "mine" && st.files.list) for (const x of st.files.list) if (!x.dir) h.add(x.path); for (const d of st.docs) if (FDOCS && FDOCS.SLUGS[d.stage]) h.add(nowDocPath(d.stage)); return h; };
  const stageMap = () => (SM ? SM.build({ stages: N.STAGES, slugs: FDOCS ? FDOCS.SLUGS : [], results: st.results, j: st.j, quest: st.quest, finished: st.finished, have: haveDocs(), prep: st.prep }) : null);
  const STATE_WORD = { done: "끝남", now: "지금", ready: "준비됨", pending: "준비됨 — 확인 전", later: "2단계에서 그려져요" };
  // 규칙 카드(stagemap.prepare) + AI 카드(/api/prepare) — AI가 낸 이름 · ① 생각 · ② 행동 · 근거만 덮고, ③ 기록 · ④ 저장 · ⑤ 버전은 규칙 그대로(C-56 R-2)
  const mergePrepared = (rule, ai) => Object.fromEntries(Object.entries(rule).map(([n, c]) => { const x = ai && ai[n]; return [n, x ? { ...c, think: x.think || c.think, act: x.act || c.act, from: x.from || c.from, ...(x.title ? { title: x.title } : {}) } : c]; }));
  // C-54 ⑧(2026-10-28 디자인 넘김 ⓔ+, 이재엽 버튼 "둘다 할것" — 누르기 + 확대): 한 단계의 칸들 — 이름 · 적은 줄 · 누가 · 플로로 초안 · 재료. 하는 중인 퀘스트가 먼저, 다음은 결과, 그 뒤는 할 일 이름만(흐름 보기의 cellOf와 같은 규칙)
  function stageCells(n) {
    const r = st.results[n], q = st.quest && st.quest.chap === n ? st.quest : null;
    const names = q ? q.objs.map((o, i) => QU.nameOf(q, i)) : r ? r.items.map((x) => x.name) : crits(n).map((c) => c.text);
    return names.map((name, k) => (q ? { name, line: (q.lines[k] || [])[0] || "", by: (q.by || [])[k] || "", draft: QU.proposalOf(q, k), from: QU.fromOf(q, k) }
      : r && r.items[k] ? { name, line: (r.items[k].lines || [])[0] || "", by: r.items[k].by || "", draft: r.items[k].draft || "", from: r.items[k].from || [] } : { name, line: "", by: "", draft: "", from: [] }))
      .map((c) => ({ ...c, by: QU.BY.includes(c.by) ? c.by : "", from: (c.from || []).filter((x) => x && Number.isInteger(x.s) && Number.isInteger(x.i)) }));   // 저장소에서 온 값은 믿지 않는다(class에 들어간다)
  }
  function cardsMap(cur) {
    const m = stageMap(); if (!m) return treeMap(cur);
    const fix = st.prep && !st.prep.ok && st.prep.fix;
    // ⑧ 고른 끝난 · 지금 카드는 그 자리에서 커진다 — 줄 하나 = 할 일 → 문서의 절 ← 재료. 줄을 누르면 오른쪽 칸(wsideHTML .ws-line)
    const big = (c) => { const cells = stageCells(c.n), doc = c.doc.path.replace(/^docs\//, "");
      const rows = cells.map((x, k) => `<li class="sm-row${x.line ? "" : " miss"}${x.by ? ` by-${x.by}` : ""}${st.mapLine && st.mapLine.n === c.n && st.mapLine.k === k ? " sel" : ""}"><button type="button" data-act="map-line" data-i="${c.n}" data-k="${k}" aria-pressed="${!!(st.mapLine && st.mapLine.n === c.n && st.mapLine.k === k)}"><b>${ROMAN(k)}</b><span class="sm-rn">${esc(QU.shortOf(x.name))}</span><span class="sm-rl">${x.line ? esc(x.line) : x.draft ? `플로로 초안: ${esc(x.draft)}` : "비었어요"}</span><small>→ ${esc(doc)} ${esc(QU.shortOf(x.name))} 절${x.from.length ? ` · ← ${x.from.map((f) => esc(refLabel(f))).join(" · ")}` : ""}</small></button></li>`).join("");
      return `<div class="sm-cell big"><button type="button" class="sm-card st-${c.state} sel big" data-act="map-card" data-i="${c.n}" aria-pressed="true" aria-label="${LB(c.n)} ${esc(c.title)} — 가까이 보고 있어요. 다시 누르면 작아져요"><span class="sm-no">${c.label}</span><span class="sm-t">${esc(c.title)}</span><span class="sm-line">${c.state === "done" ? "지났어요" : "지금"} · 줄을 누르면 오른쪽 칸에 누가 정했나 · 재료 · 다음 단계</span></button><ol class="sm-rows" aria-label="${LB(c.n)}의 칸">${rows}</ol></div>`; };
    const card = (c) => { const p = c.prepared, sel = st.mapSel === c.n;
      if (sel && (c.state === "done" || c.state === "now")) return big(c);
      const body = c.state === "later" ? `<span class="sm-note">2단계에서 그려져요</span>`
        : c.state === "done" ? `<span class="sm-line">${c.q ? `퀘스트 ${c.q.k}/${c.q.n}` : "지났어요"}</span>`
        : c.state === "now" ? `<span class="sm-line">${c.q ? `다섯 칸 중 ${Math.min(c.q.k + 1, c.q.n)}번째 · ${c.q.k}/${c.q.n}` : "퀘스트 받기 전"}${c.gateLeft ? ` · 관문 남은 ${c.gateLeft}` : ""}</span>`
        : `<span class="sm-line">${p ? esc(p.think.length > 48 ? `${p.think.slice(0, 47)}…` : p.think) : ""}</span><span class="sm-from">${p ? esc(p.from) : ""}</span>`;
      const docLine = `<span class="sm-doc"><code>${esc(c.doc.path.replace(/^docs\//, ""))}</code> ${c.doc.has ? "있음" : c.state === "done" || c.state === "now" ? "아직" : ""}</span>`;
      const input = fix && p ? `<input type="text" data-act="prep-think" data-i="${c.n}" value="${esc(p.think)}" aria-label="${LB(c.n)} ① 생각" maxlength="120">` : "";
      return `<div class="sm-cell"><button type="button" class="sm-card st-${c.state}${sel ? " sel" : ""}${c.state === "pending" ? " pending" : ""}" data-act="map-card" data-i="${c.n}" aria-pressed="${sel}" aria-label="${LB(c.n)} ${esc(c.title)} — ${STATE_WORD[c.state]}">
        <span class="sm-no">${c.label}</span><span class="sm-t">${esc(c.title)}</span>${body}${docLine}${c.state === "now" ? `<span class="sm-flo" aria-hidden="true">${cat("idle", 30, { face: true })}</span>` : ""}</button>${input}</div>`; };
    const row1 = m.cards.slice(0, 4).map(card).join(""), row2 = m.cards.slice(4).reverse().map(card).join("");
    const ban = m.canDraw ? `<div class="sm-ban"><b>2단계 칸을 다 채웠어요</b><span>기획서(2단계에서 정한 것)로 3 ~ 8단계의 퀘스트와 문서를 한 번에 그려요</span><button type="button" class="b" data-act="prep-draw">기획서로 3 ~ 8단계 그리기</button></div>`
      : m.drawn && !m.confirmed ? `<div class="sm-ban"><b>퀘스트 ${Object.keys(st.prep.cards).length}개를 준비했어요</b><span>${fix ? "카드마다 ① 생각을 고친 뒤 '맞아요'를 눌러요" : "카드마다 어느 절에서 왔는지 적었어요 — 맞으면 한 번에 넘어가요"}</span><button type="button" class="b" data-act="prep-ok">맞아요 — 이대로 준비해요</button>${fix ? "" : `<button type="button" class="b ghost" data-act="prep-fix">고칠래요</button>`}</div>`
      : m.cur < 2 ? `<div class="sm-ban soft"><span>1단계에서는 길이 한 칸만 보여요. 2단계 칸을 다 채우면 3단계부터 8단계까지의 퀘스트와 문서가 한 번에 그려져요</span></div>` : "";
    const legend = `<p class="sm-legend">${["done", "now", "ready", "later"].map((k) => `<span><i class="st-${k}" aria-hidden="true"></i>${STATE_WORD[k]}</span>`).join("")}<small>카드를 누르면 오른쪽 칸에 그 퀘스트와 문서 — 끝난 · 지금 카드는 커져서 줄마다 보여요</small></p>`;
    const docs = `<ul class="sm-docs">${m.docs.map((d) => `<li class="${d.has ? "has" : ""}"><code>${esc(d.path)}</code><span>${esc(d.what)}</span><small>${d.has ? "있음" : "아직"}</small></li>`).join("")}</ul>`;
    const ship = FDOCS && st.results[0] && st.results[1] ? `<p class="sm-ship"><button type="button" class="b" data-act="ship-open">문서로 묶어 GitHub에</button><small>지금까지 정한 것을 단계 문서 · 기획서 · 결정 기록으로</small></p>` : "";   // 흐름 보기(jmap)와 같은 단추
    return `<div class="sm">${ban}<div class="sm-grid">${row1}</div><div class="sm-grid back">${row2}</div>${docs}${legend}${ship}</div>`;
  }
  function treePane() {
    const cur = st.finished ? N.STAGES.length : st.j ? st.j.stage : st.quest ? st.quest.chap : 0;
    const mapTab = `<button type="button" role="tab" aria-selected="${treeChap === null}" class="map" data-act="tree-map" data-tt="한눈에 보기|단계마다 정한 것이 이어지는 지도 — 빈 칸을 채워요" aria-label="한눈에 보기">${MAP_ICON}</button>`;
    const chapTabs = () => N.STAGES.map((x) => { const k = x.n < cur ? "done" : x.n === cur ? "cur" : "lock";
      return `<button type="button" role="tab" aria-selected="${x.n === treeChap}" class="${k}" data-act="tree-chap" data-i="${x.n}" data-tt="${LB(x.n)} · ${esc(x.title)}|${k === "done" ? "끝낸 장 — 도장을 받았어요" : k === "cur" ? "지금 하는 장" : "아직 — 앞 장을 끝내면 열려요"}" aria-label="${LB(x.n)} ${esc(x.title)}">${QU.chapIcon(x.n)}</button>`; }).join("");
    // C-54(2026-10-28): 한눈에 보기 = 보기 셋 — 지도(카드, 기본) · 흐름(C-39 jmap) · 상자(C-45 문서 지도)
    const views = [["cards", "지도"], ["flow", "흐름"], ["box", "상자"]], viewBar = `<div class="sm-views" role="tablist" aria-label="보기">${views.map(([v, l]) => `<button type="button" role="tab" data-act="tree-view" data-v="${v}" aria-selected="${treeView === v}">${l}</button>`).join("")}</div>`;
    if (treeChap === null) return `<div class="adv"><div class="vtabs" role="tablist" aria-label="장">${mapTab}${chapTabs()}</div><div class="board${treeView === "cards" ? " sea" : ""}">${viewBar}${treeView === "flow" ? treeMap(cur) : treeView === "box" ? mapPane(Math.min(cur, N.STAGES.length - 1)) : cardsMap(cur)}</div></div>`;
    const n = treeChap, s = N.STAGES[n], q = st.quest && st.quest.chap === n ? st.quest : null;
    const state = n < cur ? "done" : n === cur ? "cur" : "lock";
    const list = n === cur && st.j ? st.j.criteria.map((c) => ({ text: c.text, met: c.met })) : crits(n).map((c) => ({ text: c.text, met: n < cur }));
    const ci = q ? QU.curIdx(q) : -1;
    const kind = (i) => (state === "done" || list[i].met || (q && QU.filled(q, i)) ? "done" : state === "lock" ? "lock" : i === ci || (!q && i === 0) ? "cur" : "lock");
    const tt = (label, k) => `${esc(label)}|${k === "done" ? "끝냈어요" : k === "cur" ? "지금 하는 할 일 — 채팅에서 플로로와 같이 해요" : "아직 열리지 않았어요 — 앞의 할 일을 먼저 해요"}`;
    const tabs = mapTab + chapTabs();
    const sides = (s.criteria || []).filter((c) => !list.some((x) => x.text === c.text));   // 곁 퀘스트 — 이 등급에서 빠진 할 일, 첫 가지 옆에
    const tus = TU ? TU.forChap(n) : [], terms = [...new Set(crits(n).map((c) => c.term).filter(Boolean))], tu = tus.find((t) => t.id === st.tuSel);
    const chain = list.map((c, i) => { const k = kind(i); return `<div class="chain"><div><span class="bn ${k}" tabindex="0" data-tt="${tt(c.text, k)}">${QU.iconOf(n, i)}</span><div class="vline"></div></div>${
      i === 0 && sides.length ? `<div class="sides">${sides.map((x, j) => `<span class="hl" aria-hidden="true"></span><span class="bn sidebn ${state === "done" ? "done" : "lock"}" tabindex="0" data-tt="${esc(x.text)} (곁 퀘스트)|${state === "done" ? "지난 장의 곁 퀘스트" : "골라서 하는 퀘스트 — 만드는 크기를 키우면 할 일이 돼요. 안 해도 관문은 열려요"}">${QU.iconOf(n, list.length + j)}</span>`).join("")}</div>` : "<div></div>"}</div>`; }).join("")
      + `<div class="chain"><div><span class="bn gate ${state === "done" ? "done" : "lock"}" tabindex="0" data-tt="관문 — 이해되셨나요?|${state === "done" ? "지났어요 — 칭호가 바뀌었어요" : "이 장의 할 일을 다 하면 플로로가 '이해되셨나요?'를 물어요. 지나면 칭호가 바뀌어요"}">${GATE_ICON}</span></div><div></div></div>`;
    const learn = tus.length || terms.length ? `<section class="learnbox" aria-label="관문 전에 알아 둘 것"><h4>${LB(n)} 관문 전에 알아 둘 것</h4>${
      tus.length ? `<div class="tu-chips">${tus.map((t) => `<button type="button" data-act="tu-sel" data-v="${t.id}" aria-pressed="${!!tu && tu.id === t.id}">${esc(t.name)}${t.state === "soon" ? "<small>만드는 중</small>" : ""}</button>`).join("")}</div>` : ""}${tu ? tuCard(tu) : ""}${
      terms.length ? `<p class="lb-terms"><b>이 장에서 쓰는 말</b>${terms.map(termTag).join("")}</p>` : ""}</section>` : "";
    return `<div class="adv"><div class="vtabs" role="tablist" aria-label="장">${tabs}</div><div class="board"><p class="bt">${LB(n)} · ${esc(s.title)} — 그림에 마우스를 올리면 설명이 떠요</p>${learn}${chain}</div></div>`;   // 알아 둘 것은 나무 위 — 판 안의 스크롤은 다시 그리면 맨 위로 돌아가 아래에 두면 펼친 장이 가려졌다
  }
  // 한눈에 보기(C-37, 2026-10-25 — 이재엽 "1단계 결과들을 정리해서 한번에 보는 곳 … 이어지는 다이어그램을 이용해 도전과제들을 보여주는 공간 … 우리가 어느 곳이 부족한지 보여주고 이 다이어그램들을 채워 나가도록" ·
  //   버튼 "단계가 이어지는 흐름"): 위에서 아래로 단계 블록, 사이 화살표에 넘겨주는 것(STAGES gives). 지금 장의 빈 칸은 점선 + 채우기. 1 · 2단계를 마쳤으면 문서로 묶어 올리기.
  // C-39(2026-10-25 — 이재엽 "도전과제에서 1단계 2단계에 맞춰진 다이어그램으로 너가 어떻게 넣고 어떤 부분을 했는지 이어져서 보도록 시각화된 자료로 자세히" · 버튼 "흐름 + 칸마다 재료까지"):
  //   끝낸 장 · 지금 장은 네 칸 흐름 — 넣은 것(처음 말한 것 · 지난 단계) → 플로로가 한 것(초안 · 준비할 것) → 내가 정한 것(칸마다 그대로 · 고침 · 직접 · 고름, 고쳤으면 플로로 초안도) → 관문(지난 날 · 기준).
  //   칸마다 재료(플로로가 초안을 쓸 때 본 지난 단계 칸) — 올리면 그 칸이 빛나고(CSS :has — 앱의 옆 창에서도 스크립트 없이) 풍선에 그 칸의 글. 다음 장은 할 일만 미리, 그 뒤는 머리만
  function treeMap(cur) {
    let filled = 0, open = 0;
    const refs = new Set(), lineAt = (x) => { const r = st.results[x.s], it = r && r.items[x.i]; return (it && (it.lines || [])[0]) || ""; };
    const cellOf = (q, r, k) => (q ? { line: (q.lines[k] || [])[0] || "", by: (q.by || [])[k] || "", draft: QU.proposalOf(q, k), from: QU.fromOf(q, k) }
      : r && r.items[k] ? { line: (r.items[k].lines || [])[0] || "", by: r.items[k].by || "", draft: r.items[k].draft || "", from: r.items[k].from || [] } : { line: "", by: "", draft: "", from: [] });
    const step = (k, label, body) => `<li class="jm-step ${k}"><i>${label}</i><div class="jm-sb">${body}</div></li>`;
    const blocks = N.STAGES.map((s, n) => {
      const state = n < cur ? "done" : n === cur ? "cur" : "lock", r = st.results[n], q = st.quest && st.quest.chap === n ? st.quest : null;
      const names = q ? q.objs.map((o) => o.name) : r ? r.items.map((x) => x.name) : crits(n).map((c) => c.text);   // 지금 장은 하는 중인 퀘스트가 먼저
      const got = names.filter((_, k) => cellOf(q, r, k).line).length;
      const date = r && (r.at || r.passed) ? `<span class="jm-date">${r.at ? `확인 ${esc(r.at.slice(5))}` : ""}${r.passed ? ` · 관문 ${esc(r.passed.slice(5))}` : ""}</span>` : "";
      // C-54 ⑨(2026-10-28 버튼 "'흐름 따라가기'에서만"): 짝 선 — 세로 길 셋(a 1↔8 · b 2↔7 · c 3↔6)이 정한 곳에서 확인하는 곳까지 오른쪽을 따라 내려간다. 짝 단추를 누르면 두 칸 나란히
      const pr = SM ? SM.pairOf(n) : null, rails = SM ? `<span class="jm-rails" aria-hidden="true">${SM.PAIRS.map(([k, a, b]) => (n >= a && n <= b ? `<i class="${k}${n === a ? " s" : ""}${n === b ? " e" : ""}"></i>` : "<i></i>")).join("")}</span>` : "";
      const pairBtn = pr ? `<button type="button" class="jm-pair ${pr.key}" data-act="pair-sel" data-v="${pr.key}" aria-pressed="${st.pair === pr.key}" title="두 칸 나란히 보기">${pr.role === "decide" ? `정한 것 → ${LB(pr.to)}에서 확인` : `← ${LB(pr.from)}에서 정한 것 확인`}</button>` : "";
      const head = `<div class="jm-h"><b>${LB(n)} · ${esc(s.title)}</b>${date}<span class="jm-count">${got}/${names.length}</span>${pairBtn}</div>`;
      if (state === "lock") return `<section class="jm-stage lock" data-n="${n}">${rails}${head}${n > cur + 1 ? "" : `<details class="jm-peek"><summary>할 일 미리 보기</summary><ul class="jm-cells">${names.map((name) => `<li class="jm-lock"><b>${esc(QU.shortOf(name))}</b></li>`).join("")}</ul></details>`}</section>`;
      const before = Object.keys(st.results).map(Number).filter((k) => k < n).sort((x, y) => x - y);
      const input = n === 0 ? `처음 말한 것${st.idea ? ` “${esc(st.idea.length > 90 ? `${st.idea.slice(0, 90)}…` : st.idea)}”` : ""}`
        : before.length ? before.map((k) => `<span class="jm-pill">${LB(k)}에서 정한 것 ${st.results[k].items.length}칸</span>`).join("") : "지난 단계에서 정한 것";
      const prep = (q && q.draft && q.draft.prep) || (r && r.prep) || [], drafted = names.filter((_, k) => cellOf(q, r, k).draft).length;
      const ai = drafted ? `초안 ${drafted}칸${prep.length ? ` · 준비할 것 ${prep.length}줄` : ""}${prep.length ? `<ul class="jm-prep">${prep.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}` : state === "cur" ? "초안 없이 — 한 줄씩 같이 적어요" : "초안 없이 — 한 줄씩 같이 적었어요";
      const cells = names.map((name, k) => {
        const c = cellOf(q, r, k), id = `${n}-${k}`, nm = `<b>${ROMAN(k)} ${esc(QU.shortOf(name))}</b>`;
        if (!QU.BY.includes(c.by)) c.by = "";   // 저장소에서 온 값은 믿지 않는다 — class · <style>에 들어가는 값은 정해진 것 · 숫자만(2026-10-25 리뷰)
        const okRefs = c.from.filter((x) => x && Number.isInteger(x.s) && Number.isInteger(x.i));
        const ref = okRefs.length ? `<span class="jm-refs">재료 ${okRefs.map((x) => { refs.add(`${x.s}-${x.i}`); return `<span class="jm-ref" tabindex="0" data-ref="${x.s}-${x.i}" data-tt="${esc(refLabel(x))}|${esc(lineAt(x) || "적은 글이 남아 있지 않아요")}">← ${esc(refLabel(x))}</span>`; }).join("")}</span>` : "";
        const was = c.by === "edit" && c.draft ? `<span class="jm-was">플로로 초안: ${esc(c.draft)}</span>` : c.by === "pick" && c.draft ? `<span class="jm-was">플로로가 권한 것: ${esc(c.draft)}</span>` : "";
        if (c.line) { filled += 1; return `<li class="jm-cell jm-fill${c.by ? ` by-${c.by}` : ""}" data-cell="${id}">${nm}${QU.BY_WORD[c.by] ? `<span class="jm-by">${QU.BY_WORD[c.by]}</span>` : ""}<span class="jm-line">${esc(c.line)}</span>${was}${ref}</li>`; }
        if (state === "cur") { open += 1; return `<li class="jm-cell jm-miss" data-cell="${id}">${nm}<span class="jm-line">${c.draft ? `${q && QU.examplesOf(q, k).length > 1 ? `플로로 예시 ${QU.examplesOf(q, k).length}개 — 권하는 것: ` : "플로로 초안: "}${esc(c.draft)}` : "비었어요"}</span>${ref}<button type="button" data-act="jmap-fill">채우기</button></li>`; }
        return `<li class="jm-cell jm-old" data-cell="${id}">${nm}<span class="jm-line">지났어요 — 적은 글이 남아 있지 않아요</span></li>`;
      }).join("");
      const ck = r && r.check ? r.check : null, met = ck ? `기준 ${ck.filter((x) => x.met).length}/${ck.length}` : "";
      const gate = r && r.passed ? `지났어요 ${esc(r.passed.slice(5))} — 이해했어요${met ? ` · ${met}` : ""}` : state === "done" ? "지났어요 — 날짜는 남아 있지 않아요" : r ? `칸을 다 확인했어요${met ? ` · ${met}` : ""} — 관문은 아직` : "아직 — 칸을 다 채우면 완료 보고 → 관문";   // 증빙 전(C-37)에 지난 장은 날짜가 없다
      return `<section class="jm-stage ${state}" data-n="${n}">${rails}${head}<ol class="jm-flow">${step("in", "넣은 것", input)}${step("ai", "플로로가 한 것", ai)}${step("me", "내가 정한 것", `<ul class="jm-cells">${cells}</ul>`)}${step("gate", "관문", gate)}</ol></section>`;
    });
    const arrows = blocks.map((b, n) => `${b}${n < N.STAGES.length - 1 ? `<div class="jm-arrow" aria-hidden="true">↓ <span>${esc(gv(N.STAGES[n]))}</span></div>` : ""}`).join("");
    const glow = refs.size ? `<style>${[...refs].map((id) => `.jmap:has(.jm-ref[data-ref="${id}"]:is(:hover,:focus)) .jm-cell[data-cell="${id}"]`).join(",")}{outline:2px solid #2F7BD6;outline-offset:2px;background:#EAF3FF}</style>` : "";
    const legend = `<p class="jm-legend">${QU.BY.map((b) => `<span class="by-${b}"><i aria-hidden="true"></i>${QU.BY_WORD[b]}</span>`).join("")}<small>재료에 올리면 그 칸이 빛나요</small></p>`;
    const ship = FDOCS && st.results[0] && st.results[1] ? `<button type="button" class="b" data-act="ship-open">문서로 묶어 GitHub에</button>` : "";
    const pairSel = SM && st.pair ? SM.PAIRS.find(([k]) => k === st.pair) : null;
    const sideCol = (n, role) => { const cs = stageCells(n); return `<div class="jm-sc"><b>${LB(n)} · ${esc(N.STAGES[n].title)}</b><small>${role === "decide" ? "정한 곳" : "확인하는 곳"}</small><ul>${cs.map((x, k) => `<li class="${x.line ? "" : "miss"}"><b>${ROMAN(k)}</b> ${esc(QU.shortOf(x.name))}<span>${x.line ? esc(x.line) : n > cur ? "아직" : "비었어요"}</span></li>`).join("")}</ul></div>`; };
    const side = pairSel ? `<section class="jm-side ${pairSel[0]}" aria-label="두 칸 나란히"><div class="jm-sh"><b>두 칸 나란히 — ${LB(pairSel[1])}에서 정한 것을 ${LB(pairSel[2])}에서 확인해요</b><button type="button" class="b sm ghost" data-act="pair-sel" data-v="${pairSel[0]}">닫기</button></div><div class="jm-sg">${sideCol(pairSel[1], "decide")}<span class="jm-sl" aria-hidden="true">→</span>${sideCol(pairSel[2], "check")}</div></section>` : "";
    return `<div class="jmap">${glow}${side}<div class="jm-top"><b>${esc(st.topic || "내 프로젝트")}</b><span>채운 칸 ${filled} · ${open ? `빈 칸 ${open} — '채우기'로 채워요` : "지금 빈 칸 없음"}</span>${ship}</div>${legend}${arrows}</div>`;
  }
  // 설명 풍선(C-22) — data-tt="제목|설명". 마우스를 올리거나 키보드로 고르면 그 위에 뜬다(맨 위면 아래)
  const $tt = document.createElement("div"); $tt.className = "tt"; $tt.setAttribute("role", "tooltip"); document.body.appendChild($tt);
  function showTT(el) {
    const [h, b] = (el.dataset.tt || "").split("|");
    $tt.innerHTML = `<b>${esc(h)}</b>${esc(b || "")}`; $tt.classList.add("on");
    const r = el.getBoundingClientRect(), w = $tt.offsetWidth;
    $tt.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`; $tt.style.top = `${r.top > 90 ? r.top - $tt.offsetHeight - 8 : r.bottom + 8}px`;
  }
  document.addEventListener("mouseover", (e) => { const el = e.target.closest && e.target.closest("[data-tt]"); if (el) showTT(el); else $tt.classList.remove("on"); });
  document.addEventListener("focusin", (e) => { const el = e.target.closest && e.target.closest("[data-tt]"); if (el) showTT(el); });
  document.addEventListener("focusout", () => $tt.classList.remove("on"));
  // 뽑기(C-22, 둘째 레프런스 "무지개 조개로 확률형 아이템 · 플로로를 꾸밀 수"): 조개 셋에 한 번, 확률은 늘 화면에(quest.js ITEMS · draw). 돈으로 사는 것은 없다. 섬 위를 덮는 층
  function gachaHTML() {
    const g = st.gacha; if (!g || !QU) return "";
    const can = st.shells >= QU.SHELL_COST && g.phase === "ready";
    const stage = g.phase === "got" ? `<span class="big" aria-hidden="true">${g.item.emoji}</span>` : `<i class="coin bigshell" aria-hidden="true">${SHELL_ICO}</i>`;   // 열기 전의 큰 조개 — 위 줄과 같은 무지개 조개 그림(2026-10-23)
    const got = g.phase === "got" ? `<b>${esc(g.item.name)}</b>(${esc(g.item.rar)})이 나왔어요! 플로로가 바로 써 봤어요` : g.phase === "rolling" ? "조개를 여는 중…" : st.shells >= QU.SHELL_COST ? "조개를 열면 플로로를 꾸밀 것이 하나 나와요" : `조개가 ${QU.SHELL_COST - st.shells}개 더 있어야 열 수 있어요 — 장을 지나면 받아요`;
    return `<div class="gacha-layer"><section class="gacha${g.phase === "rolling" ? " rolling" : ""}" role="dialog" aria-label="무지개 조개 뽑기"><h3>무지개 조개 뽑기</h3>
      <button type="button" class="ti gx" data-act="gacha-close" aria-label="뽑기 창 닫기" title="닫기 (Esc)">${X_ICON}</button>
      <div class="have">가진 조개 <span class="shells">${coin()}${st.shells}</span> · 한 번에 ${QU.SHELL_COST}개</div>
      <div class="stage">${stage}</div><p class="got" role="status">${got}</p>
      <div class="acts"><button type="button" class="b pri" data-act="gacha-roll" ${can ? "" : "disabled"}>조개 열기</button></div>
      <div class="odds" aria-label="나올 확률">${QU.ITEMS.map((it) => `<span><b>${it.emoji} ${esc(it.name)}</b>${esc(it.rar)} ${it.p}%</span>`).join("")}</div>
      <p class="fine">나올 확률은 여기에 늘 적어 둬요. 돈으로 사는 것은 없어요 — 조개는 장을 지날 때만 받아요.</p></section></div>`;
  }
  // 뽑기 창은 섬 위에 겹쳐 뜨는데(.gacha-layer — 섬 안에 꽉) 섬보다 키가 커 위아래가 잘렸다(임유정 2026-10-22). 뽑기 창이 들어갈 만큼 섬을 늘린다 — 앱이면 창도 따라 커진다(measureSize)
  function fitGacha() {
    const isl = $nav.querySelector(".isl"), g = isl && isl.querySelector(".gacha");
    if (!g) return;
    const need = g.offsetHeight + 32;   // .gacha-layer 위아래 padding 16씩
    if (isl.offsetHeight < need) isl.style.minHeight = `${need}px`;
  }
  function gachaRoll() {
    const g = st.gacha; if (!g || !QU || g.phase !== "ready" || st.shells < QU.SHELL_COST) return;
    st.shells -= QU.SHELL_COST; st.gacha = { phase: "rolling" }; render();
    setTimeout(() => {
      if (!st.gacha) return;
      const it = QU.draw(QU.ITEMS, Math.random() * 100);
      st.owned = QU.cleanOwned([...st.owned, it.id]); st.wear = { ...st.wear, [it.slot]: it.id }; st.gacha = { phase: "got", item: it };
      logMsg("floro", `${it.emoji} <b>${esc(it.name)}</b>을 받았어요! 설정 창의 꾸미기 줄에서 벗거나 바꿀 수 있어요`);
      render(); flash("wow", 1500);
      const host = liveCat(); if (host && !STILL) C.burst(...center(host), "star", 14, 300);
    }, STILL ? 50 : 1200);
  }
  // 설정 판(2026-10-25 두승현 — 옆에 따로 뜨던 설정 창을 섬 안으로: 채팅 자리를 통째로 바꿔 끼운다, 알림 · AI 진행 판과 같은 틀).
  //   왼쪽 칸 = 플로로 · 작업실 · 칭호 · 등급, 오른쪽 = '← 채팅으로' · 탭(묶음 하나씩) · 그 묶음. Esc · 톱니 · '채팅으로'로 닫는다
  let setTab = "room";
  const SET_TABS = () => [["room", "작업실"], ["link", "연결"], ["view", "보기"], ...(canLive ? [["token", "토큰"]] : []), ["log", "알림 · 느낀 점"], ["keep", "기록"]];
  function roomGroup() {
    return `${SHELF_ON ? `<button type="button" class="golib" data-act="lib-enter"><span class="bk">${I.lib}</span><span>서재로 가기<small>끝낸 책 · 서고 — 지금 책은 퀘스트 창의 서고 탭에</small></span></button>` : ""}
      ${sgrp(I.scroll, "작업실 · 퀘스트 창", `${srow("이름", `<input class="name-in" data-act="name" value="${esc(userName)}" maxlength="20" placeholder="이름" aria-label="이름">`, "작업실 이름에 보여요 · 이 컴퓨터에만")}
        <label class="chk"><input type="checkbox" data-act="qauto" ${qauto ? "checked" : ""}>퀘스트를 받으면 작업실이 바로 뜨기</label>`)}
      ${sgrp(coin(), "꾸미기", `<span class="closet">${st.owned.map(QU.itemOf).filter(Boolean).map((it) => `<button type="button" data-act="wear" data-v="${it.id}" aria-pressed="${st.wear[it.slot] === it.id}">${it.emoji} ${esc(it.name)}</button>`).join("")}<button type="button" data-act="gacha">조개 열기 <span class="shells">${coin()}${st.shells}</span></button></span>
        <span class="meta">뽑기로 얻은 것 · 조개 ${st.shells}개</span>`)}`;
  }
  const SET_PART = { room: roomGroup, link: () => `${linkGroup()}${githubGroup()}`, view: viewGroup, token: tokenGroup, log: logGroup, keep: keepGroup };
  function settingsPane(modal = false) {
    deskKeys.Escape = { act: "settings" };
    const tabs = SET_TABS(); if (!tabs.some(([id]) => id === setTab)) setTab = "room";
    const lv = level, bi = QU.bandOf(lv), nx = QU.BANDS[bi + 1];
    return `<section class="mc base pane setp tone-gray" aria-label="설정"><div class="who">${petCat(st.finished ? "happy" : "look", 92)}<b class="pj">${esc(userName || "나")} 님의 작업실</b><span class="tl">${esc(project() || "아직 프로젝트가 없어요")}</span>
        <span class="rk">칭호 · ${esc(QU.rankOf(Math.min(lv, 7)))} <b>LV ${lv}</b></span>
        <div class="bands">${QU.BANDS.map((b, i) => `<span class="t${i === bi ? " on" : i < bi ? " done" : ""}">${b[0]}</span>`).join("")}<small>${nx ? `레벨 ${nx[1]}이 되면 ${nx[0]} — 관문마다 +1, 프로젝트를 바꿔도 그대로` : "상급자예요 — 레벨은 계속 올라요"}</small></div></div>
      <div class="main"><div class="row ph">${modal ? `<b class="grow">설정</b><button type="button" class="ti set-x" data-act="settings" aria-label="설정 닫기" title="닫기 (Esc)">${X_ICON}</button>` : `<button type="button" class="lnk" data-act="settings" title="채팅으로 돌아가기 (Esc)">${I.back}채팅으로</button><b class="grow">설정</b>`}</div>
        <div class="wtabs" role="tablist" aria-label="설정 묶음">${tabs.map(([id, label]) => `<button type="button" role="tab" data-act="set-tab" data-tab="${id}" aria-selected="${setTab === id}">${label}</button>`).join("")}</div>
        <div class="set-body" role="tabpanel" aria-label="${esc((tabs.find(([id]) => id === setTab) || tabs[0])[1])}">${SET_PART[setTab]()}</div></div></section>`;
  }

  // 단계 문서 — 왼쪽 플로로와 버튼, 오른쪽 글. 초안은 AI가 먼저, 고치는 건 사용자, 다시 봐 주는 건 AI, 확정은 사용자만. 2026-10-20(C-16): 도서관의 책 안에서 연다(deskLib → bookDocs)
  const docShell = (mood, say, side, main) => `<div class="docx"><div class="doc-side">${petCat(mood, 92)}<p class="doc-say">${esc(say)}</p>
    <div class="doc-acts">${side}</div></div><div class="doc-main">${main}</div></div>`;
  // 지금 여는 단계 문서의 단계 — 책 안에서 고른 단계(libDoc), 아니면 지금 단계
  const docStage = () => (Number.isInteger(st.libDoc) ? N.STAGES[st.libDoc] : stage());
  function deskDoc(s = st.j && docStage()) {
    if (!s) return docShell("idle", DOC.first, `<button class="b pri" data-act="tab" data-i="0">'이번 단계'로 가기</button>`,
      `<div class="doc-empty">${I.doc}<b>아직 단계 문서가 없어요</b><span>어디쯤인지 보고 나면, 그 단계에 맞는 문서를 같이 만들어요.</span></div>`);
    const { done, d, face: [mood, say] } = docState(s);
    if (!s.doc) return docShell(mood, say, "", `<div class="doc-empty">${I.doc}<b>${LB(s.n)}는 문서 없이 진행해요</b><span>${DOC.none}</span></div>`);
    if (!d && done) return docShell(mood, say, `<span class="meta">${esc(done.at)}에 직접 확정했어요</span><button class="b" data-act="reopen-doc">고쳐 쓰기</button>`,
      `<div class="doc-head"><h3>${esc(s.doc)}</h3><span class="okchip">${I.check}확정함</span></div><pre class="doc-view">${esc(done.text)}</pre>`);
    if (!d) return docShell(mood, say, `<button class="b pri" data-act="draft" ${st.busy ? "disabled" : ""}>초안 받기</button>${
      st.mode === "live" ? `<span class="meta">작업 글이 AI(Claude)에게 보내져요.</span>` : ""}`,
      `${docNotes()}<div class="doc-empty">${I.doc}<b>${esc(s.doc)}</b><span>${DOC.draft}</span></div>`);
    const ready = d.review && d.review.ready;
    return docShell(mood, say, `<span class="meta" data-blanks>${blankMeta(d)}</span>
        <button class="b ${ready ? "" : "pri"}" data-act="review" ${st.busy ? "disabled" : ""}>다시 봐 주세요</button>
        <button class="b ${ready ? "pri" : ""}" data-act="confirm-doc">${ready ? "이걸로 확정할게요" : "이대로 확정"}</button>
        <span class="meta">고칠 곳만 알려 드려요. 대신 고쳐 쓰지는 않아요.</span>`,
      `<div class="doc-head"><h3>${esc(s.doc)}</h3><span class="meta">${LB(s.n)}</span></div><textarea class="doc" data-act="doc" aria-label="단계 문서">${esc(d.text)}</textarea>${reviewList(d.review)}${docNotes()}`);
  }
  // 단계 지도(deskMap)는 2026-10-21 C-22로 퀘스트 창의 도전과제 판(treePane)이 됐다. 휴대폰의 단계 지도(mapBody)는 그대로
  // 이 조각의 누르기 — 00-base의 누르기 표(ACT)에 더한다. 공통 누르기는 90-acts.js(2026-10-29 나누기 2차)
  Object.assign(ACT, {
    // C-53 작업실 세 칸 — 칸 접기(이 컴퓨터에 기억), 글 크기, 목차(오른쪽 칸 펼치기), 서식(브라우저 판 — 글 칸의 고른 자리에; 앱은 win.js가 창 안에서 같은 함수로 넣고 input으로 보낸다)
    "wnav-toggle": () => { wnavOpen = !wnavOpen; writeLS("floe:ws-nav", wnavOpen ? "1" : "0"); render(); },
    "wside-toggle": () => { wsideOpen = !wsideOpen; writeLS("floe:ws-side", wsideOpen ? "1" : "0"); render(); },
    fsize: (i, el) => { const f = st.openFiles[Number(el && el.dataset.i)]; if (!f) return; f.zoom = Math.round(Math.min(1.6, Math.max(0.8, (f.zoom || 1) + (el.dataset.v === "+" ? 0.1 : -0.1))) * 10) / 10; render(); },
    ftoc: () => { if (!wsideOpen) { wsideOpen = true; writeLS("floe:ws-side", "1"); } render(); },
    "ftoc-go": (i, el) => { const f = st.openFiles[st.fileSel]; if (!f) return; f.find = String((el && el.dataset.v) || "").slice(0, 60); if (f.kind === "md" && !f.edit) f.raw = true; f.go = f.edit ? null : { line: Number(el && el.dataset.line) || 0, seq: ++tocGo }; render(); },   // 그 절의 제목을 찾기 칸에 — 원문 보기에서 그 줄이 표시되고, 그 제목 줄로 스크롤(전에는 표시만 되고 옮기지 않았다 — 임유정 2026-10-28)
    ffmt: (i, el) => { const k = Number(el && el.dataset.v), f = st.openFiles[k], ta = $nav.querySelector(`.fv-edit[data-v="${k}"]`); if (!f || !ta || !MDV) return;
      const r = MDV.format(ta.value, ta.selectionStart, ta.selectionEnd, el.dataset.fmt); ta.value = r.text; f.text = r.text; f.dirty = f.text !== f.saved; render();
      const t2 = $nav.querySelector(`.fv-edit[data-v="${k}"]`); if (t2) { t2.focus(); t2.setSelectionRange(r.start, r.end); } },
    // C-54 지도 — 보기 셋 · 기획서로 그리기 · 맞아요(한 번에) · 고칠래요 · 카드 누름(오른쪽 칸 + 문서가 있으면 파일 보기)
    "tree-view": (i, el) => { const v = el && el.dataset.v; if (["cards", "flow", "box"].includes(v)) treeView = v; render(); },
    "prep-draw": async () => { if (!SM || !st.results[1] || st.prep || st.busy) return;   // 바쁠 때 누르면 바쁨을 실패로 읽어 규칙 카드를 저장하던 것(F-103-5 새 맥락 리뷰)
      const rule = SM.prepare({ stages: N.STAGES, slugs: FDOCS ? FDOCS.SLUGS : [], plan: st.results[1], criteria: crits });
      let ai = null;   // C-56 R-2(2026-10-28): 진짜 AI면 한 번에 이 프로젝트의 말로(/api/prepare) — 못 받으면 규칙(기획서의 절)으로만, 연습은 규칙
      if (st.mode === "live" && canLive) { const r = await callAI("/api/prepare", { tier: st.tier, idea: ideaNow(), prev: prevOf(2), base: baseText() }); if (r.ok && r.prepare) { ai = r.prepare.cards; st.tokens = r.tokens || 0; fetchUsage(); } else say(`AI가 맞춰 짓지는 못했어요 — ${r.reason || "연결하지 못했어요"}. 기획서의 절에서 규칙으로 그렸어요`); }
      st.prep = { cards: mergePrepared(rule.cards, ai), ok: false, fix: false, at: ymd(), ...(ai ? { ai: true } : {}) }; save(); render(); say(ai ? "이 프로젝트의 말로 3단계부터 8단계까지 그렸어요 — 카드마다 근거 절을 적었어요. 맞으면 '맞아요'로 한 번에 넘어가요" : "기획서로 3단계부터 8단계까지 그렸어요 — 카드마다 어느 절에서 왔는지 적었어요. 맞으면 '맞아요'로 한 번에 넘어가요"); },
    "prep-ok": () => { if (!st.prep) return; st.prep = { ...st.prep, ok: true, fix: false }; save(); render(); say("준비된 퀘스트로 가요 — 그 단계에 들어서면 준비한 칸으로 시작해요"); },
    "prep-fix": () => { if (!st.prep) return; st.prep = { ...st.prep, fix: true }; render(); },
    "map-line": (i, el) => { const k = Number(el && el.dataset.k); if (!Number.isInteger(k)) return; st.mapLine = st.mapLine && st.mapLine.n === Number(i) && st.mapLine.k === k ? null : { n: Number(i), k }; if (st.mapLine && !wsideOpen) { wsideOpen = true; writeLS("floe:ws-side", "1"); } render(); },   // C-54 ⑧ 줄 하나 → 오른쪽 칸
    "map-chat": () => { st.qtab = "quest"; ACT["draft-fix"](); },   // C-54 ⑧ 빈 칸 — 채팅에서 같이 적기(공책을 열고 채팅 칸에 커서)
    "pair-sel": (_, el) => { const v = el && el.dataset.v; if (!SM || !SM.PAIRS.some(([k]) => k === v)) return; st.pair = st.pair === v ? null : v; render(); },   // C-54 ⑨ 두 칸 나란히
    "map-card": (i) => { const m = stageMap(), c = m && m.cards[i]; if (!c) return; st.mapSel = st.mapSel === i ? null : i; if (!st.mapLine || st.mapLine.n !== i) st.mapLine = null; if (st.mapSel != null && !wsideOpen) { wsideOpen = true; writeLS("floe:ws-side", "1"); } render(); if (st.mapSel != null && c.doc.has) ACT["map-open"](null, { dataset: { act: "map-open", v: c.doc.path } }); },
  });
