  // ── C-56 R-4 이미 있는 내용 옮겨 적기(2026-10-28 — 이재엽 버튼 "'옮김' 새 값"): 묻는 카드 · 확인 카드의 '폴더에서 찾기' 칩 → /api/find(API.md 3-30)로 후보 줄 셋을 받아 원문(파일 · 줄)과 나란히 보이고,
  //   '이 줄로'를 누르면 그 줄 그대로 그 칸에(누가 = 옮김). 원문끼리 다르면 사람이 고른다 — 플로로는 합치거나 지어내지 않는다. 연결한 폴더가 있는 진짜 AI 모드에서만(연습 · 서버 없이는 칩이 없다)
  let found = null;   // { chap, i, q, busy, list, why }
  const canFind = () => canLive && st.mode !== "fixture" && !!(st.files && st.files.src === "mine" && st.files.list && st.files.list.length);
  const findChip = (q, i) => (canFind() ? [{ label: found && found.chap === q.chap && found.i === i && found.busy ? "찾는 중…" : "폴더에서 찾기", act: "find-lines", kind: "ghost", disabled: !!(found && found.busy) }] : []);
  function foundHTML(q, i) {
    if (!found || found.chap !== q.chap || found.i !== i || found.busy) return "";
    if (!found.list.length) return `<p class="found-none">${found.why === "folder" ? "폴더 목록을 아직 못 받았어요 — 작업실을 열고 다시 눌러요" : "폴더의 글 파일에서 비슷한 줄을 못 찾았어요 — 아래 칸에 적어요"}</p>`;
    return `<ol class="found" aria-label="폴더에서 찾은 줄"><li class="found-h">폴더에서 찾았어요 — 맞는 줄을 고르면 그대로 옮겨요</li>${found.list.map((x, k) => `<li><span>${esc(x.text)}</span><small>${esc(x.path)} ${x.line}줄</small><span class="found-acts"><button type="button" class="b" data-act="find-use" data-i="${k}">이 줄로</button>${Number.isInteger(x.i) ? `<button type="button" class="b ghost" data-act="find-open" data-i="${k}">원문 보기</button>` : ""}</span></li>`).join("")}</ol>`;
  }
  let filesAsked = false;
  function momentQuest() {
    const q = st.quest, f = face(), meta = stageMetaQ();
    if (q.phase === "draft") return { tone: "blue", mood: "happy", meta, title: `${LB(q.chap)} 퀘스트를 만들었어요.`,
      sub: `조건 · 할 일 ${q.objs.length}개 · 보상을 보고 '퀘스트 받기'를 눌러 주세요. 이름이나 할 일 수는 '고쳐 주세요'로 고쳐요.`,   // F-161-9 — 이 카드의 단추를 가리킨다(전에는 '퀘스트 창의 큰 단추')
      acts: [{ label: "퀘스트 받기", act: "quest-ok", key: "Enter", pri: true }, { label: "고쳐 주세요", act: "quest-fix" }, { label: "나중에", act: "quest-later", key: "Escape", kind: "ghost" }],
      // F-166-14(2026-11-07 사용자 시험 셋째): 진짜 AI로 단계 초안을 곧 받는 장(2단계부터)에서는 이 카드가 잠깐만 보이고 바로 칸 확인으로 넘어간다 —
      //   지난 말로 채팅에 남아 없는 단추('퀘스트 받기' · '고쳐 주세요')를 가리켰다. 기다리는 말처럼 쌓지 않는다(초안을 못 받으면 따로 말하고 이 카드가 그대로 남는다)
      passing: q.chap >= 1 && st.mode === "live" && canLive && !q.draft };
    const i = QU.curIdx(q);
    if (i < 0) return { tone: "green", mood: "wow", meta, title: "다 됐어요! 완료 보고할까요?",
      sub: st.mode === "live" ? "적은 글을 AI(Claude)가 보고 어디쯤인지 봐요. 고칠 곳이 있으면 퀘스트 카드에서 먼저 고쳐요." : "연습이라 적은 대로 한 것으로 봐요. 고칠 곳이 있으면 퀘스트 카드에서 먼저 고쳐요.",
      acts: [{ label: "완료 보고", act: "quest-report", key: "Enter", pri: true }, ...buildActs(q.chap), { label: "퀘스트 보기", act: "qwin-quest", kind: "ghost" }] };   // buildActs — 다 적은 뒤에도 뼈대 코드 맡기기 · 돌려 보기가 남는다(F-157-4: 전에는 초안을 확인하는 동안에만 보여 다 넘기면 사라졌다)
    if ((q.chap === 4 || q.chap === 5) && canLive && st.mode === "live" && !st.files && !filesAsked) { filesAsked = true; setTimeout(loadFiles, 0); }   // 5 · 6단계 — 코드 파일 수를 알아야 A-04를 묻는다(작업실을 열지 않았어도 목록을 한 번, F-70 · F-157-4)
    const fx = QS ? qstates(q)[i] : null;   // C-56 먼저 — 앞 칸이 비어 할 수 없다: 갈 곳을 말하고, 관문은 닫힌 채(적지 않으면 완료 보고가 안 된다)
    // A-04(2026-10-28 이재엽 "그냥 md파일을 만드는 작업일 수 있기 때문임"): 6단계에 코드 파일이 없으면 닫지 않고 묻는다 — 예: Claude Code에 실행할 수 있는 코드를 맡김 · 아니요: 코드 없이 지남(결정 기록에 남김)
    if (fx && fx.state === "first" && fx.code) return { tone: "amber", mood: "think", meta, title: "코드 파일을 만드시겠습니까?",
      sub: "이 폴더에 코드 파일이 아직 없어요. 프로그램을 만드는 일이면 '예', 문서만 만드는 일이면 '아니요'예요.",
      foot: "아니요 — 결정 기록에 '코드 없이 지남'으로 남아요.",
      acts: [...(canLive && st.mode !== "fixture" ? [{ label: "예 — Claude Code에 맡기기", act: "code-yes", key: "Enter", pri: true }] : []), { label: "아니요 — 코드 없이 하기", act: "code-no", ...(canLive && st.mode !== "fixture" ? {} : { key: "Enter", pri: true }) }, { label: "퀘스트 보기", act: "qwin-quest", kind: "ghost" }] };
    // F-157-4 — 8단계 '저장소에 올리기': 아직 올린 적이 없으면 올리기로(커밋 문구만 고르고 '했음'이 되던 것)
    if (fx && fx.state === "first" && fx.commit) return { tone: "amber", mood: "think", meta, title: "먼저 — 코드도 올려요.", sub: `${esc(fx.why)}.`,   // F-166-6
      foot: "Claude Code가 비밀값 파일(.env 등)은 빼고 커밋 · 푸시해요. 허락이 필요하면 카드가 떠요.",
      acts: [...(canLive && st.mode !== "fixture" ? [{ label: "코드도 커밋 · 푸시 맡기기", act: "commit-code", key: "Enter", pri: true }] : []), { label: "아직 못 함으로 적기", act: "first-notyet", kind: "ghost" }, { label: "퀘스트 보기", act: "qwin-quest", kind: "ghost" }] };
    if (fx && fx.state === "first" && fx.ship) return { tone: "amber", mood: "think", meta, title: "먼저 — 저장소에 올려요.", sub: `${esc(fx.why)}.`,
      foot: "'문서로 묶어 GitHub에'는 단계 문서만 올려요 — 코드도 올리려면 Claude Code에 커밋 · 푸시를 맡겨요.",
      acts: [{ label: "문서로 묶어 GitHub에", act: "ship-open", key: "Enter", pri: true }, { label: "아직 못 함으로 적기", act: "first-notyet", kind: "ghost" }, { label: "퀘스트 보기", act: "qwin-quest", kind: "ghost" }] };
    if (fx && fx.state === "first") return { tone: "amber", mood: "think", meta, title: `먼저 — ${esc(QU.shortOf(q.objs[i].name))}${eun(QU.shortOf(q.objs[i].name))} 아직 할 수 없어요.`, sub: `${esc(fx.why)}. 그 칸을 채운 뒤에 돌아와요 — 지금 적어도 관문은 닫혀 있어요.`,
      acts: [{ label: `${LB(fx.go.s)} ${ROMAN(fx.go.i)} 보기`, act: "first-go", kind: "soft" }, { label: "아직 못 함으로 적기", act: "first-notyet", kind: "ghost" }, { label: "퀘스트 보기", act: "qwin-quest", kind: "ghost" }] };
    const rv = st.refit && st.refit.chap === q.chap && st.refit.review.find((x) => x.i === st.refitPick);   // C-56 R-5 — 적어 둔 칸이 방금 한 일과 달라졌다: 두 줄을 보이고 사람이 고른다
    if (rv) return { tone: "amber", mood: "think", meta, title: `${ROMAN(rv.i)}. ${esc(QU.nameOf(q, rv.i))} — 적어 둔 줄과 달라요.`,
      sub: `적어 둔 줄 “${esc((q.lines[rv.i] || [])[0] || "")}” · ${esc(st.refit.tool)}가 한 일로 본 새 줄 “${esc(rv.text)}”`, foot: "새 줄로 바꾸거나 적어 둔 줄을 그대로 둬요 — 플로로는 적은 줄을 덮지 않아요.",
      acts: [{ label: "새 줄로", act: "refit-use", i: rv.i, key: "Enter", pri: true }, { label: "그대로 둘래요", act: "refit-keep", i: rv.i, key: "Escape" }] };
    if (st.tidy && st.tidy.fills.length) { const n = st.tidy.fills.length; return { tone: "green", mood: "happy", meta, title: `칸 ${n}개로 정리했어요.`, sub: esc(st.tidy.reply).split("\n").join("<br>"),
      body: `<ol class="tidy">${st.tidy.fills.map((f) => `<li><b>${ROMAN(f.i)} ${esc(QU.nameOf(q, f.i))}</b><span>${esc(f.text)}</span></li>`).join("")}</ol>`, foot: "맞으면 적고, 아니면 더 이야기해요 — 플로로가 먼저 적지 않아요.",
      acts: [{ label: `칸 ${n}개에 적기`, act: "tidy-fill", key: "Enter", pri: true }, { label: "더 이야기하기", act: "tidy-more", key: "Escape", kind: "ghost" }] }; }   // C-61 정리 카드
    if (q.draft) { const c = momentConfirm(q, i, meta); return { ...c, ...refitBanner(q), acts: [...c.acts, ...buildActs(q.chap)] }; }   // F-70 — 초안을 확인하는 중에도 코드 맡기기(A-02)   // 받은 글로 만든 1단계 초안(C-36) · 1단계 결과로 만든 2단계 초안(C-37) — 칸마다 확인만
    const o = q.objs[i], ex = QU.example(q, i);   // 연습은 1단계의 연습 글, 진짜 AI는 AI가 만든 예시(/api/quest)
    return { tone: "blue", mood: f[0], meta, ...refitBanner(q), title: `${ROMAN(i)}. ${esc(QU.nameOf(q, i))}`, sub: `${esc(QU.askOf(q, i))}${QU.doneOf(q, i) ? ` <small class="done-when">끝: ${esc(QU.doneOf(q, i))}</small>` : ""}${o.term ? ` ${termTag(o.term)}` : ""}`,
      body: foundHTML(q, i), acts: [...(ex ? [{ label: "예시로 적어 줘", act: "quest-example", key: "1", kind: "soft" }] : []),
        ...(N.DRAFT_STAGES.includes(q.chap) && st.results[q.chap - 1] && st.mode === "live" && canLive && !q.objs.some((_, k) => QU.filled(q, k)) ? [{ label: "초안 다시 받기", act: "stage-redraft", kind: "soft" }] : []), ...findChip(q, i), ...refitChips(q), ...buildActs(q.chap), { label: "퀘스트 보기", act: "qwin-quest", kind: "ghost" }] };   // F-161-1 '초안 다시 받기' — 비밀값 경고에서 그만뒀거나 초안을 못 받았을 때
  }
  // 1단계 초안 확인(C-36, 2026-10-25 — 이재엽 "불편한게 맞는 내용은 이게 플로로가 생각한 내용인데 맞나요 … 누가 쓰는 내용은 … 사람에 대한 내용이 있으면 이 내용이 맞는지 요청을 보내고
  //   없다면 본인 / 소수 / 불특정다수 … 얼마 크게도 … 짧음 / 보통 / 긺"): Ⅰ 불편 · Ⅱ 달라지는 것 · Ⅲ 누가(글에 사람이 있으면) — 맞나요, Ⅲ 사람이 없으면 셋 중 고르기, Ⅳ 플로로가 본 크기 + 셋 중 고르기.
  //   고칠래요를 누르고 채팅 칸에 적으면 그 줄이 된다(send, F-150 — 누르지 않고 보낸 말은 대화로, 칸의 후보는 정리 카드로)
  //   C-37(2026-10-25 — 이재엽 "1단계에서 플로로 채팅이 너무 많이 올라오는 문제 … 한곳에서 보이는 것들"): 칸마다 지난 말 · '맞아요'로 쌓지 않고 이 카드 하나에 넷을 한곳에(.dchk), 끝나면 한 줄로 정리(fillNow).
  //   2단계부터는 초안의 칸마다 맞나요, 기획서로 키울지(PRD)는 플로로가 권한 것 + 셋 중 고르기
  //   C-39(2026-10-25 — 이재엽 "무엇들을 준비해야하는지 생각해서 초안들 보여줘" · 버튼 "할 일 초안 + 준비할 것" · "흐름 + 칸마다 재료까지"): 카드 맨 위에 이 단계 전에 준비할 것, 칸마다 재료(플로로가 본 지난 단계 칸)
  const refLabel = (x) => { const r = st.results[x.s], it = r && r.items[x.i]; return `${LB(x.s)} ${ROMAN(x.i)}${it ? ` ${QU.shortOf(it.name)}` : ""}`; };
  // 카드 안 미리보기 한 줄 — 확인한 칸 · 기준 카드는 전문을 다시 늘어놓지 않는다(F-108, 2026-10-30 진짜 AI 한 바퀴: 칸을 확인할수록 카드가 141 → 695자). 전문은 마우스를 올리면(title)
  const preview1 = (s, n) => { const a = Array.from(String(s || "").replace(/\s+/g, " ").trim()); return a.length > n ? `${a.slice(0, n - 1).join("")}…` : a.join(""); };
  function momentConfirm(q, i, meta) {
    const d = q.draft, o = q.objs[i], text = QU.draftOf(q, i), first = q.chap === 0, pk = QU.pickOf(q, i);
    const rows = q.objs.map((x, k) => { const line = (q.lines[k] || [])[0]; return `<li class="${line ? "y" : k === i ? "now" : ""}"><b>${ROMAN(k)}</b> ${esc(QU.shortOf(x.name))}${line ? `<span title="${esc(line)}">${esc(preview1(line, 24))}</span>` : ""}</li>`; }).join("");
    const prep = d.prep && d.prep.length ? `<div class="dprep"><b>이 단계 전에 준비할 것</b><ul>${d.prep.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
    const from = QU.fromOf(q, i), mat = from.length ? `재료 — ${from.map((x) => esc(refLabel(x))).join(" · ")}` : "";
    // C-40(2026-10-26 — 버튼 "짧은 이름 + 쉬운 한 줄"): 제목은 짧은 이름 — 쉬운 한 줄(긴 할 일 문장은 퀘스트 창의 '자세히')
    const easy = QU.easyOf(o.name), title = `${ROMAN(i)}. ${esc(QU.nameOf(q, i))}${easy && !QU.nameOf(q, i).includes(easy) ? ` — ${esc(easy)}` : ""}${o.term ? ` <small class="method">${esc(o.term)}</small>` : ""}`;
    const ex = QU.examplesOf(q, i);
    const opts = ex.length > 1 ? `<ol class="dalt" aria-label="플로로의 예시">${ex.map((t, k) => `<li><button type="button" data-act="draft-alt" data-i="${k}"${k ? "" : ' class="rec"'}>${k ? "" : "<small>플로로가 권해요</small>"}${esc(t)}</button></li>`).join("")}</ol>` : "";
    const head = { tone: "blue", mood: "look", meta: `${meta}${d.example ? `<span class="note">예시예요 · 연습</span>` : ""}`, title,
      passing: true, // 초안 확인은 카드 하나 — 칸마다 지난 말로 쌓지 않는다
      body: `${prep}${opts}${foundHTML(q, i)}<ol class="dchk" aria-label="이 장의 초안">${rows}</ol>` };
    const quiet = (acts) => acts.map((a) => ({ ...a, quiet: true }));
    // '남은 칸 모두 맞아요'(C-40)는 C-56 R-3으로 뺐다(2026-10-28 새 맥락 리뷰 막힘): 옮겨 온 칸은 applyStates가 이미 채우므로 남은 칸은 늘 사람이 볼 칸 — 하나씩 확인한다
    const all = [];
    // 4 ~ 8단계(C-40 버튼 "예시 셋 중 고르기") — 셋 중 하나를 누르면 그 줄(누가 = 고름), 다 아니면 적거나 '다른 예시'(그 칸만 다시)
    if (ex.length > 1) return { ...head, sub: "플로로가 예시를 셋 만들었어요 — 맞는 것을 골라 주세요.", foot: `${mat ? `${mat} · ` : ""}다 아니면 아래 칸에 적어요.`,
      acts: quiet([{ label: "다른 예시", act: "draft-again" }, { label: "고칠래요", act: "draft-fix" }, ...all]) };
    if (first && i === QU.SIZE_AT) return { ...head, sub: `플로로는 '${QU.SIZE_WORD[d.size]}'으로 봤어요 — ${esc(d.sizeWhy)}`, foot: "고른 크기에 맞춰 다음 단계부터 할 일 수가 바뀌어요.",
      acts: quiet([...QU.SIZE_KEYS.map((k, n) => ({ label: QU.SIZE_WORD[k], act: "draft-size", i: n, key: String(n + 1), kind: k === d.size ? "opt pri" : "opt" })), ...all]) };
    if (first && i === QU.WHO_AT && !text) return { ...head, sub: `글에서는 누가 쓰는지 못 찾았어요 — 누가 쓰나요? ${QU.WHO.map(([w, line]) => `${w}: ${line}`).join(" · ")}`, foot: "다르면 아래 칸에 적어요.",
      acts: quiet(QU.WHO.map(([w], n) => ({ label: w, act: "draft-who", i: n, key: String(n + 1), kind: "opt" }))) };
    if (pk) { const rec = QU.DOC_PICKS.find(([k]) => k === pk.pick);
      return { ...head, sub: `플로로는 '${rec[1]}'을 권해요${pk.why ? ` — ${esc(pk.why)}` : ""}. 기획서로 키울지는 직접 정해요.`, foot: `고른 것이 이 칸의 답이 돼요.${mat ? ` ${mat}` : ""}`,
        acts: quiet([...QU.DOC_PICKS.map(([k, label], n) => ({ label, act: "draft-pick", i: n, key: String(n + 1), kind: k === pk.pick ? "opt pri" : "opt" })), ...all]) }; }
    if (!text) return { ...head, sub: "이 칸은 초안이 없어요 — 아래 칸에 한 줄 적어 주세요.", acts: quiet(findChip(q, i)) };
    return { ...head, sub: `${first && i === QU.WHO_AT ? "글에서 쓰는 사람을 이렇게 봤어요 — 맞나요?" : "플로로가 생각한 내용인데 맞나요?"} “${esc(text)}”`, ...(mat ? { foot: mat } : {}),
      acts: quiet([{ label: "맞아요", act: "draft-ok", key: "Enter", pri: true }, { label: "고칠래요", act: "draft-fix" }, ...all, ...findChip(q, i), ...refitChips(q)]) };
  }
  // 늘 있는 칩 — 지금 결정할 것 밑에 작게: 먹이 주기 · 바뀐 작업 보여 주기 · 계획(맡길 일) · 알림. 상황에 맞는 것만
  //   어디쯤인지 보기는 위 줄(단계 띠 · '퀘스트' 단추)과 완료 보고 칩, 도전과제 · 책은 퀘스트 창의 탭(C-35, 2026-10-24 — 명령 네 칸을 뺐다)
  function moreActs(v) {
    const out = [];
    if (planNow()) out.push({ label: (st.quest && st.quest.phase !== "done") || st.j ? "단계 퀘스트로" : "나중에", act: "plan-later", kind: "ghost" });   // 계획 · 맡길 일에서 나가는 길은 이 칩 하나
    else {
      if (!st.j && !st.quest && FD && st.mode === "live") out.push({ label: "먹이 주기(파일 · 글)", act: "open-input", kind: "ghost" });
      if (st.j && !st.openInput) out.push({ label: "바뀐 작업 보여 주기", act: "open-input", kind: "ghost" });
      if (FP) out.push(planChip());
      if (PR && st.j && canLive && st.mode !== "fixture" && !st.presetPick) out.push({ label: "문서 틀", act: "preset-open", kind: "ghost" });   // C-44 — 지금 장 문서를 틀로 맡기기
      if (!(QU && st.quest && st.quest.phase !== "done")) out.push(...buildActs(nowStage()));   // F-70 — 퀘스트 카드가 없을 때(퀘스트를 마친 뒤)만 여기에. 있으면 퀘스트 카드의 답 줄에(A-02)
    }
    if (HO && (st.j || st.quest)) out.push({ label: "다른 AI에 넘기기", act: "handoff-copy", kind: "ghost" });   // C-38 넘김 카드(47-handoff) — 단계를 시작한 뒤, 계획 · 맡길 일에서도
    out.push({ label: unreadN() ? `알림 ${unreadN()}` : "알림", act: "base-alerts", kind: "ghost" });
    return out;
  }
  const sayHint = () => (planNow() ? (!st.plan ? "만들고 싶은 것 · 요구 · 문제 글을 붙여 넣어요" : !st.plan.confirmed ? "전체 의견을 적어도 돼요" : "보고에 대해 묻거나 답해요") : pastFixAt ? "그 칸의 고친 줄을 적어 보내요 — 다른 단추를 누르면 그만둬요" : !st.j && !st.quest ? "원하는 것을 적거나 붙여 넣어요" : st.quest && st.quest.phase === "quest" && !QU.isDone(st.quest) ? (st.quest.draft ? (draftFixAt === QU.curIdx(st.quest) ? "이 칸에 들어갈 말을 적어 주세요" : "궁금한 것을 물어봐요 — 칸을 바꾸려면 '고칠래요'") : "한 줄로 적어 주세요") : st.screen === "gate" && st.step === "question" ? "궁금한 걸 적어 주세요" : "플로로에게 말하기");
  // 채팅 카드 — v는 momentToday()/momentGate()가 준 것(글은 이미 esc 한 것)
  function chatCard(v) {
    // C-61: 섬이 가운데이고 이 단계의 대화가 아직 비어 있으면 플로로 · 질문 하나 · 입력 상자 하나만(칩 없음). 질문은 셋 중 하나 — 문구는 예시(기획안)
    //   1단계 시작(퀘스트 전)도 — 두승현 2026-10-29 "반드시 1단계 화면이 나오도록". 초안이 있는 장은 전처럼 초안 확인 카드(같은 날 두승현: 1단계에만)
    //   1단계 시작은 사람이 아직 말하지 않았으면 — 구분선(chatMark)은 퀘스트가 생길 때부터라, 플로로 말이 한 줄 남아 있으면 ① 화면이 안 떴다(앱에서 봄). 사람이 한 말이 있으면 그 대화를 이어서 보인다(C-63)
    if (islBig() && !st.pane && !st.settings && (st.quest ? !st.quest.draft && st.chat.length <= (st.chatMark || 0) : !st.j && !st.chat.some((m) => m.who === "me")) && !st.tidy) { /* 구분선 뒤에 말이 없다 — 상한을 넘기면 logMsg가 chatMark도 당긴다(C-63) */ const qs = ["어떤 프로젝트를 구상하고 있나요?", "어떤 미션을 수행하고 계시나요?", "지금 작업 중인 내용을 공유해 주세요, 함께 논의해요~"];
      return `<section class="mc chat hello tone-blue"><div class="who">${petCat("happy", 150)}</div><div class="main"><b class="say hello-q">${qs[(st.quest ? st.quest.chap : 0) % 3]}</b><div class="cin"><textarea class="mc-input" data-act="say" rows="3" aria-label="채팅 입력" placeholder="묻거나 적어요">${esc(st.say)}</textarea><button type="button" class="b pri" data-act="send" ${st.busy ? "disabled" : ""}>보내기</button></div></div></section>`; }   // 안내 글은 작업실 개편 기획안 3-1 사진대로
    for (const a of v.acts) if (a.key && !a.disabled) deskKeys[a.key] = a;
    const live = `${v.banner ? `<p class="mc-hold">${esc(v.banner)}</p>` : ""}<b class="say">${endDot(v.title)}</b>${v.sub ? `<span class="mc-sub">${endDot(v.sub)}</span>` : ""}`;
    const key = `${v.title}|${v.sub || ""}`;
    // 지난 말은 위로 — 단, '살펴보고 있어요'처럼 기다리는 동안만 보이는 말(passing)은 쌓지 않는다. 경과 초가 바뀔 때마다 다른 말로 보여 같은 말이 계속 쌓였다(임유정 2026-10-22)
    if (lastLive && lastLive.key !== key) settleLive();
    if (!lastLive || lastLive.key !== key) saidSince = 0;
    lastLive = lastLive && lastLive.key === key ? { ...lastLive, html: live, passing: !!v.passing } : { key, html: live, passing: !!v.passing };   // 같은 말이면 '남겼음'(logged)을 지킨다 — 내 말마다 같은 플로로 말이 또 쌓이지 않게(2026-10-25 리뷰)
    // 답할 칩(v.acts)과 늘 있는 칩(moreActs)을 두 줄로 — 섞여 있으면 늘 있는 칩이 답 사이에 끼어 줄이 들쭉날쭉했다(임유정 2026-10-22). 늘 있는 칩은 아랫줄 한 줄
    // '퀘스트 보기'(퀘스트 창 열기)는 답이 아니라 늘 있는 칩과 같은 길이라, 나올 때는 아랫줄 맨 앞에 둔다(임유정 2026-10-22). 단축키(deskKeys)는 위에서 v.acts로 그대로
    const FIXED_ACTS = ["qwin-quest"];
    const answers = v.acts.filter((a) => !FIXED_ACTS.includes(a.act));
    const more = islBig() ? [] : [...v.acts.filter((a) => FIXED_ACTS.includes(a.act)), ...(st.screen === "gate" || st.busy || st.warn || st.error || st.ping ? [] : moreActs(v))];   // 가운데 대화에는 늘 있는 칩 줄이 없다(C-60 · C-61)
    const chip = (a) => btn({ ...a, chip: !a.quiet });   // quiet — 눌러도 내 말로 쌓지 않는 칩(초안 확인 — 결과는 끝나면 한 줄로, C-37)
    // 플로로 아래 칭호 · 기분 글은 뺐다(2026-10-25 두승현) — 칭호는 설정 창 머리에 있다
    return `<section class="mc chat tone-${v.tone}"><div class="who">${petCat(v.mood, 150, v.extra)}</div>
      <div class="main"><div class="log" data-log data-go-stage="${st.chatGo == null ? "" : `${st.chatGo}:${goSeq}`}">${st.chat.map((m) => (m.kind === "stage" ? `<div class="msg stage" data-stage="${m.n}"><div class="b">${m.html}</div></div>` : `<div class="msg ${m.who}${m.kind ? ` ${m.kind}` : ""}"><div class="b">${m.html}</div></div>`)).join("")}${
        working() ? `<div class="msg sys"><div class="b">Claude Code가 일하고 있어요${aiLast(mine()) ? ` — ${esc(stepLine(aiLast(mine())))}` : ""}<span class="bar" aria-hidden="true"><i></i></span></div></div>` : ""}
        ${sheetHTML()}${proposalsHTML()}${handoffHTML()}${approvalsHTML()}<div class="msg floro now"><div class="b" aria-live="polite">${st.notice ? `<p class="mc-notice">${I.check}${esc(st.notice)}</p>` : ""}${v.meta ? `<div class="mc-meta">${v.meta}</div>` : ""}${live}${v.body || ""}${v.foot ? `<p class="mc-foot">${v.foot}</p>` : ""}</div></div></div>
        ${answers.length ? `<div class="opts">${answers.map(chip).join("")}</div>` : ""}${more.length ? `<div class="opts more" id="more-chips">${moreOpen ? more.map(chip).join("") : ""}<button type="button" class="b ghost mtg" data-act="more-toggle" aria-expanded="${moreOpen}" aria-controls="more-chips">${moreOpen ? "접기" : `더 보기${unreadN() ? ` · 알림 ${unreadN()}` : ""}`}</button></div>` : ""}
        <div class="cin"><textarea class="mc-input" data-act="say" rows="1" aria-label="채팅 입력" placeholder="${esc(sayHint())}">${esc(st.say)}</textarea><button type="button" class="b pri" data-act="send" ${st.busy ? "disabled" : ""}>보내기</button></div></div></section>`;
  }
  // 채팅 입력(C-22) — 상황에 따라: 준비 계획 · 맡길 일(C-35, planSay) / 처음 — 원하는 것(C-36, startDraft) / 퀘스트 한 줄 적기 · 고쳐 적기 / 궁금한 것 / 직접 쓴 답 / 바뀐 작업(진짜 AI)
  function send() {
    const t = st.say.trim(); if (!t || st.busy) return;
    st.say = ""; logMe(t.length > 200 ? `${t.slice(0, 200)}… (글 ${t.length.toLocaleString()}자)` : t); activity();   // 붙여 넣은 긴 글은 앞부분만 내 말로
    mat("chat", t);   // C-47 재료 — 내가 적어 보낸 말의 한 줄(48-sheet, 가린 뒤 80자)
    if (planNow()) return planSay(t);   // 준비 계획 · 맡길 일(C-35)
    const q = st.quest;
    // F-161-3(claude-drafted: 2026-11-06 사용자 시험 — '고칠래요'로 적은 키 모양 글이 경고 없이 칸 · 퀘스트 카드 · 다음 단계 '가져온 것'에 원문으로 남았다): 칸에 바로 적는 말이면 먼저 묻는다 — 막지 않고 그대로 적기 / 고칠게요(보안 기준 6-3)
    if ((pastFixAt || (q && q.draft && q.phase === "quest" && draftFixAt === QU.curIdx(q))) && sensitive(t).length) { st.fillWarn = { t, w: sensitive(t) }; render(); return; }
    // F-166-16(2026-11-07 사용자 시험 셋째 · FR-11 · FR-12): 고쳐 적는 칸에 숫자 없는 애매한 말('빨리' 등)이 있으면 한 번 묻는다 — 같은 칸은 다시 묻지 않는다
    { const at = q && q.draft && q.phase === "quest" && draftFixAt === QU.curIdx(q) ? `${q.chap}-${draftFixAt}` : "", vw = at && N.vagueIn ? N.vagueIn(t) : [];
      if (vw.length && !vagueAsked.has(at)) { vagueAsked.add(at); st.fillWarn = { t, w: vw, vague: true }; render(); return; } }
    if (pastFixAt) { const g = pastFixAt; pastFixAt = null; return fixPast(g, t); }   // F-157-3 · F-161-1(앱 확인: 다음 단계 퀘스트를 받기 전에도 — 전에는 아래 '먼저 퀘스트를 받아 주세요'가 먼저였다) — '먼저' 카드에서 지난 칸으로 간 뒤 보낸 말은 그 칸의 새 줄
    if (!st.j && !q && QU) return startDraft(t);    if (q && q.phase === "draft") { render(); return say("먼저 퀘스트 창에서 퀘스트를 받아 주세요"); }
    if (q && q.draft && q.phase === "quest" && QU.pickOf(q, QU.curIdx(q))) {   // 기획서로 키울지(2단계)는 셋 중 하나로 — 글로 답해도 맞춰 고른다
      const k = /경량|가볍|짧/.test(t) ? 0 : /상세|자세/.test(t) ? 1 : /안 함|않|없|아니/.test(t) ? 2 : -1;
      if (k < 0) { render(); return say("경량 · 상세 · 키우지 않아요 중에서 골라 주세요"); }
      return ACT["draft-pick"](k);
    }
    if (q && q.draft && q.chap === 0 && q.phase === "quest" && QU.curIdx(q) === QU.SIZE_AT) {   // Ⅳ 크기는 셋 중 하나로 — 글로 답해도 맞춰 고른다(만드는 크기가 그 등급으로)
      const k = /짧/.test(t) ? 0 : /보통|중간/.test(t) ? 1 : /긺|길|크|많/.test(t) ? 2 : -1;
      if (k < 0) { render(); return say("짧음 · 보통 · 긺 중에서 골라 주세요"); }
      return ACT["draft-size"](k);
    }
    if (q && q.phase === "quest" && QU.curIdx(q) >= 0) { if (q.draft && draftFixAt === QU.curIdx(q)) { draftFixAt = -1; return fillNow(t); } return chatSend(t); }   // C-61(2026-10-29): 보내기는 칸에 적지 않는다 — 플로로가 정리 카드로 돌려주고 사람이 [칸 n개에 적기]를 누른다. F-150(2026-11-04): 초안 확인 중에도 같다 — 플로로에게 한 말("무슨 뜻이야?")이 칸의 답이 됐다. '고칠래요'를 누른 칸만 다음 말이 그 줄이 된다(C-36)
    if (st.screen === "gate" && st.step === "question") { st.question = t; return answer(); }
    if (st.j && st.j.next && st.screen !== "gate" && !st.todos) { st.ownText = t; return decide(t); }
    // F-144-15(2026-11-03): 퀘스트를 다 적었거나(완료 보고 앞) 관문에서 묻는 동안 친 말을 작업 글(st.text — 지난 단계의 보고 글)에 붙여 다시 판정하지 않는다 —
    //   전에는 "완료"를 치면 그 글이 지금 단계 기준으로 다시 판정돼 '안 됨'이 남았다. 진짜 AI면 플로로와의 대화로, 아니면 단추를 가리킨다
    if (q || st.screen === "gate") {
      if (q && st.mode === "live" && canLive) return chatSend(t);
      render(); return say("지금은 위 카드의 단추로 해요 — 적은 말은 작업 글에 붙이지 않아요");
    }
    if (st.j && st.mode === "live") { st.text = `${st.text.trim()}\n${t}`; return judge(false); }
    render(); say(st.j ? "연습에서는 칩으로 해요 — 진짜 AI면 적은 글을 보고 어디쯤인지 봐요" : "먼저 무엇을 만들고 싶은지 말해 주세요");
  }
  // 지금 할 일에 한 줄 — 다 적었으면: 초안을 확인한 1단계는 저절로 완료 보고(C-36 — 넷 다 확인하면 관문으로), 아니면 축하하고 완료 보고 칩
  //   by — 누가 정했나(C-39): 고르는 칩은 "pick", 아니면 quest.js가 플로로 초안과 맞대어 그대로 · 고침 · 직접
  //   at — MCP로 이은 AI의 제안처럼 지금 할 일이 아닌 칸에 적을 때(C-38 시험판)
  function fillNow(t, by, at = QU.curIdx(st.quest)) {
    // F-161-8(claude-drafted: 2026-11-06 사용자 시험 — 7단계 '잰 값' 초안 "걸린 시간: (재고 적기) · …"을 고르기만 해도 칸이 '했음'이 되고 관문에서야 막혔다):
    //   빈칸 표시가 든 틀은 칸에 적지 않고 입력 칸에 넣는다 — 그 자리를 잰 값으로 바꿔 보내면 그때 적힌다
    if (N.BLANK_MARK && N.BLANK_MARK.test(t) && st.quest && st.quest.draft && at === QU.curIdx(st.quest)) {
      st.say = t; draftFixAt = at; render(); focusAct("[data-act=say]");
      return say("틀이라 아직 적지 않았어요 — '(재고 적기)' 자리를 잰 값으로 바꿔 보내요. 못 쟀으면 '아직 못 함 — 까닭'으로 적어요");
    }
    const q0 = st.quest, swerve = !!(q0 && q0.draft && String(t).trim() !== String(QU.proposalOf(q0, at) || "").trim());   // 권한 예시와 다른 것을 골랐거나 고쳐 적었나(F-166-5)
    st.quest = QU.fill(st.quest, at, t, by);
    afterFill();
    if (swerve && st.quest && !QU.isDone(st.quest)) refitChosen();
  }
  // F-166-5(2026-11-07 사용자 시험 셋째): 예시는 장을 시작할 때 한 번에 받아, 앞 칸에서 권한 것과 다른 것을 고르면 뒤 칸의 예시가 고르지 않은 쪽을 따랐다
  //   (4단계: 후보는 '화면 하나짜리 웹 / 휴대폰 앱'인데 '고른 방법: 표 계산 도구', '둘 곳: 서버'). 이 단계에서 정한 칸을 대화로 넣어 남은 빈 칸의 예시만 다시 받는다 — 적은 칸은 덮지 않는다(QU.refit)
  async function refitChosen() {
    const q = st.quest;
    if (!refitOk() || st.busy || !q) return;
    const told = q.objs.map((o, k) => (QU.filled(q, k) ? `${ROMAN(k)} ${QU.shortOf(QU.nameOf(q, k))}: ${(q.lines[k] || []).join(" / ")}` : "")).filter(Boolean);
    const talk = [{ who: "me", text: `이 단계에서 이미 정한 칸이에요 — 남은 칸은 이것과 맞게 정해 주세요.\n${told.join("\n")}`.slice(0, 1000) }];   // 서버의 한 줄 상한(CHAT_LINE_MAX)
    const idea = ideaNow(), prev = prevOf(q.chap);
    if (sensitive([idea, talk[0].text, baseText(), ...prev.flatMap((p) => p.items.flatMap((x) => x.lines))].join("\n")).length) return;   // 비밀값처럼 보이면 밖에 보내지 않는다(refitNow와 같은 생각)
    try {
      const r = await (await fetch("/api/stagedraft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: q.chap, tier: st.tier, idea, prev, base: baseText(), talk }) })).json();
      if (!r || !r.ok || !r.draft || !st.quest || st.quest.chap !== q.chap || st.quest.phase !== "quest") return;
      const f = QU.refit(st.quest, r.draft);
      if (!f.changed.length) return;
      st.quest = applyStates(f.q); st.tokens = r.tokens || 0; fetchUsage();
      st.refit = { chap: q.chap, tool: "", why: "고른 칸에 맞춰 남은 칸의 예시를 다시 받았어요", at: Date.now(), changed: f.changed, review: [] };
      render();
    } catch { /* 덤 — 못 받으면 처음 예시 그대로 */ }
  }
  // 칸을 적은 뒤 — 다 적었으면 다음 장 초안을 실제 결과로 미리 부르고(C-40), 초안을 확인한 장은 한 줄로 정리해 저절로 완료 보고
  function afterFill() {
    if (!QU.isDone(st.quest)) return render();
    prefetch(st.quest);
    if (st.quest.draft) {   // 초안을 다 확인했다 — 한 줄로 정리해 남기고(칸마다 쌓지 않은 대신) 저절로 완료 보고
      const q = st.quest;
      logMsg("floro", `<b>${LB(q.chap)} 초안을 확인했어요.</b><br>${q.objs.map((o, k) => `${ROMAN(k)} ${esc(QU.nameOf(q, k))} — ${esc((q.lines[k] || [])[0] || "")}`).join("<br>")}`);
      return questReport();
    }
    render(); celebrate("done");
  }
  // ── C-61 대화 → 칸으로 정리(2026-10-29, 두승현 PRD 2026-10-28 · 이재엽 승인 — 작업실 개편 PR ③) ──
  //   보낸 말은 칸에 적지 않는다. 진짜 AI면 POST /api/chat(API.md 3-31)에 지금 칸 · 최근 말을 주고 답 + '칸 n개를 채울 수 있나'(fills)를 받아 정리 카드(st.tidy)로.
  //   연습 · 서버 없음은 보낸 말을 지금 칸의 후보로(AI 없이). 적는 것 · 섬 자리를 옆으로 옮기는 것은 사람이 [칸 n개에 적기]를 누를 때뿐(FR-17과 같은 방향)
  //   말풍선의 제목(.say)과 아랫줄(.mc-sub)은 눈에는 두 줄이지만 글자만 뽑으면 붙었다("…드릴까요?최근 …", 임유정 2026-11-01) — 덩어리 사이에 띄어쓰기, 줄바꿈(br)은 줄바꿈으로
  const textOf = (html) => { const d = document.createElement("div"); d.innerHTML = String(html).replace(/<br\s*\/?>/gi, "\n"); d.querySelectorAll(".say, .mc-sub, .mc-hold, p, li").forEach((e) => e.after(" "));
    return (d.textContent || "").trim(); };   // 띄어쓰기를 줄이지 않는다 — 내 말의 들여쓰기는 그대로(새 맥락 리뷰 2026-11-02)
  // 이 단계의 대화(3-31 talk): 사람 · 플로로의 말만(알림 · 구분선 빼고), 40줄 · 줄 1,000자 · 합 8,000자 안에서 최근 것부터, 마지막은 방금 보낸 내 말(logMe가 먼저 쌓았다)
  const talkOf = (t) => { const all = st.chat.filter((m) => (m.who === "me" || m.who === "floro") && !m.kind).map((m) => ({ who: m.who, text: textOf(m.html).slice(0, 1000) })).filter((m) => m.text);
    const me = { who: "me", text: t.slice(0, 1000) };   // 마지막 내 말은 원문으로 — 채팅에는 긴 글이 앞 200자만 보인다(send의 logMe, F-103-4)
    if (all.length && all[all.length - 1].who === "me") all[all.length - 1] = me; else all.push(me);
    let out = all.slice(-40); while (out.length > 1 && out.reduce((n, m) => n + m.text.length, 0) > 8000) out = out.slice(1); return out; };
  let chatText = "";
  let draftFixAt = -1;   // F-150 — '고칠래요'를 누른 칸. 다음에 보낸 말이 그 칸의 줄이 된다
  // F-157-3(claude-drafted: 2026-11-05 사용자 시험 — 7단계 '2단계 Ⅱ 보기'가 고칠 수 없는 한눈에 보기로 보내 막다른 길이었다): 지난 칸 { s, i } — 다음에 보낸 말이 그 칸의 줄이 된다
  let pastFixAt = null;
  // F-161-3 — 경고 뒤 '그대로 적기': 보내려던 칸(지난 칸 · 고칠래요 칸)에 그대로 적는다
  const vagueAsked = new Set();   // 애매한 말을 이미 물은 칸(장-칸) — 같은 칸은 한 번만(F-166-16)
  function fillAnyway() { const f = st.fillWarn; st.fillWarn = null; if (!f) return render(); const q = st.quest;
    if (pastFixAt) { const g = pastFixAt; pastFixAt = null; return fixPast(g, f.t); }
    if (q && q.draft && q.phase === "quest" && draftFixAt === QU.curIdx(q)) { draftFixAt = -1; return fillNow(f.t); }
    render(); say("적을 칸이 바뀌어 적지 않았어요 — 그 칸에서 다시 적어요"); }
  //   g.name — 칸을 기준 글로 찾는다(등급이 바뀌면 번호가 달라진다, 새 맥락 리뷰 제안 1). 고친 줄은 사람이 쓴 것(by: "me" — 문서에 플로로 초안으로 남지 않게, 리뷰 C)
  const pastIdx = (g) => { const r = st.results[g.s]; if (!r) return -1; const k = g.name ? r.items.findIndex((x) => x.name === g.name) : -1; return k >= 0 ? k : g.i; };
  function fixPast(g, t) {
    const r = st.results[g.s], at = pastIdx(g), it = r && r.items[at];
    if (!it) { render(); return say("그 칸을 찾지 못했어요 — 퀘스트 카드에서 '아직 못 함으로 적기'를 눌러요"); }
    g = { ...g, i: at };
    st.results = { ...st.results, [g.s]: { ...r, items: r.items.map((x, k) => (k === g.i ? { ...x, lines: [t], by: "me" } : x)) } };
    // F-161-1(앱 확인 2026-11-07): 기준 카드에 옮겨 온 칸(by "moved")은 고친 결과로 다시 옮긴다 — 1단계 칸을 고쳐도 카드의 '만드는 것'에 옛 줄(키)이 남아 경고가 계속 났다. 사람이 적은 칸은 그대로
    if (st.card && BC) { const fresh = BC.build({ results: st.results, source: st.source }); st.card = Object.fromEntries(Object.entries(st.card).map(([k, v]) => [k, v && v.by === "moved" && fresh[k] ? fresh[k] : v])); }
    save(); if (st.quest) st.quest = applyStates(st.quest);
    render(); say(`${LB(g.s)} ${ROMAN(g.i)} ${QU.shortOf(it.name)}${eul(QU.shortOf(it.name))} 고쳤어요 — 이 단계를 이어서 해요`);
    if (g.secret && !secretPast(null)) say(st.quest && !st.quest.draft && !st.quest.objs.some((_, k) => QU.filled(st.quest, k)) ? "이제 '초안 다시 받기'를 누르면 이 단계 초안을 받아요" : "이제 하려던 일(코드 맡기기 · 보내기)을 다시 눌러요");
  }
  // F-161-1(claude-drafted: 2026-11-06 사용자 시험 — 3단계 칸에 키 모양 글을 적은 뒤 5단계 코드 맡기기가 "그 칸을 고친 뒤 다시"만 말하고, 지난 장의 칸은 고칠 길이 없었다).
  //   비밀값 모양이 든 지난 칸(앞 단계부터) → 채팅에서 그 칸을 고친다('먼저' 카드의 지난 칸 고치기와 같은 길). 지금 줄은 가려서 보인다
  //   text — 경고 · 거절의 까닭이 된 글: 그 안에 실제로 든 칸만(새 맥락 리뷰 보완 2 — 관계없는 칸으로 보내지 않게). null이면 아무 칸이나
  //   비교는 공백을 한 칸으로 줄인 뒤 줄의 앞 20자로 — 5단계 맡길 글(build.js)은 공백을 줄이고(norm) 길이를 자른다(cut). 글자 그대로 찾으면 못 찾아 막다른 길로 돌아갔다(2026-11-07 다시 읽다 찾음)
  const secretPast = (text) => { const nm = (t) => String(t).replace(/\s+/g, " ").trim(), T = text == null ? null : nm(text);
    for (const [s, r] of Object.entries(st.results || {})) { const k = ((r && r.items) || []).findIndex((x) => sensitive((x.lines || []).join("\n")).length && (T == null || (x.lines || []).some((y) => { const n = nm(y || ""); return n && T.includes(n.slice(0, 20)); }))); if (k >= 0) return { s: Number(s), i: k, name: r.items[k].name, secret: true }; } return null; };
  function fixSecretPast(g) {
    if (!g) return false;
    const at = pastIdx(g), it = st.results[g.s].items[at], line = (it.lines || []).join(" · ");   // 줄이 여럿이면 다 보인다 — 고친 줄이 칸 전체를 바꾼다(보완 4)
    pastFixAt = g; render();
    say(`${LB(g.s)} ${ROMAN(at)} ${QU.shortOf(it.name)}에 ${sensitive(line).join(", ")}처럼 보이는 글이 있어요 — 지금 줄은 “${window.NavSensitive ? window.NavSensitive.redact(line) : "…"}”예요. 그 글을 뺀 줄을 아래 칸에 적어 보내면 그 칸이 바뀌어요`);
    focusAct("[data-act=say]"); return true;
  }
  // 새 단계(C-61 · C-63, 2026-10-29): 대화에 구분선(단계 · 이름 · 날짜)과 '지난 단계에서 가져온 것'(정한 줄 요약 — 틀리면 말로 고친다), 섬은 저절로 가운데(칸이 비었으니), 대화 표시 자리는 구분선 뒤. islBig은 저장하지 않는다 — 다시 켜면 칸 상태대로 저절로
  const questStarted = () => {
    draftFixAt = -1; pastFixAt = null; st.ping = "";   // st.ping — 지난 단계(처음 설정의 저장소 만들기 등)의 '어디쯤인지 볼까요?'가 이 단계 끝까지 남지 않게(F-157-7)
    const n = st.quest ? st.quest.chap : atStage();
    logMsg("sys", `<b>${LB(n)} · ${esc(N.STAGES[n].title)}</b><span>${ymd()}</span>`, { kind: "stage", n, title: N.STAGES[n].title });
    const prev = n > 0 ? st.results[n - 1] : null, got = prev ? prev.items.filter((x) => (x.lines || [])[0]) : [];
    if (got.length) logMsg("floro", `<b>지난 단계에서 가져온 것</b>${got.map((x) => `<br>${esc(QU.shortOf(x.name))} — ${esc(x.lines[0])}`).join("")}<br><small>틀리면 말로 고쳐 주세요</small>`, { kind: "carry", n });
    st.islBig = null; st.chatMark = st.chat.length; st.tidy = null; };
  async function chatSend(t, skipCheck) {
    const q = st.quest; st.tidy = null;
    if (st.mode !== "live" || !canLive) { st.tidy = { fills: [{ i: QU.curIdx(q), text: t }], reply: "연습이라 AI 없이 — 보낸 말을 지금 칸에 이렇게 적을 수 있어요" }; return render(); }
    chatText = t;   // guard 앞에서 — 경고 뒤 '보낼게요'(RETRY.chat)가 그 전 메시지가 아니라 이 글을 다시 보낸다(F-103-1)
    if (!skipCheck && guard(t, "chat")) return;
    st.warn = null;   // 보낸 뒤 경고 카드를 걷는다 — 남으면 '보낼게요'를 또 눌러 같은 글이 두 번 간다(startDraft와 같이, 새 맥락 리뷰 2026-10-29 막힘)
    const r = await callAI("/api/chat", { stage: q.chap, tier: st.tier, idea: ideaNow(), talk: talkOf(t), lines: q.lines });   // API.md 3-31(이재엽 쪽 서버 #246): 이 단계의 대화 · 적은 줄 · 처음 말한 것 → { reply, slots, n }
    if (!st.quest || st.quest.chap !== q.chap) return render();
    if (r.ok && typeof r.reply === "string") { st.tokens = r.tokens || 0; fetchUsage(); const slots = Array.isArray(r.slots) ? r.slots : []; if (slots.length) st.tidy = { fills: slots, reply: r.reply }; else sayLines(r.reply); return render(); }
    render(); say(`답을 받지 못했어요 — ${r.reason || "AI에 연결하지 못했어요"}`);
  }
  // ── 다음 단계 초안 미리(C-40, 2026-10-26 — 이재엽 "보통길이이고 작업들을 하나씩 하는건데 왜 그냥 넣었을때 보다 너무 느려" · 버튼 "다음 단계 초안 미리") ──
  //   지금 장 초안을 받자마자 '모두 맞아요라면' 결과(expectedResult)로, 지금 장을 다 적으면 실제 결과로 다음 장 초안을 뒤에서 부른다(화면을 막지 않는다).
  //   관문을 지나 지난 단계 결과가 같으면(key) 기다리지 않고 바로 연다 — 다르면 그때 다시 부른다. 진짜 AI 모드에서만, 비밀값처럼 보이면 미리 보내지 않는다(관문 뒤 guard가 묻는다)
  let pre = null;   // { key, p: Promise, r }
  const ideaNow = () => (st.idea || st.topic || "").slice(0, N.IDEA_MAX);
  // ── C-56 R-3 · R-4 상태 넷(2026-10-28): 퀘스트가 생기거나 초안이 오면 칸마다 상태를 매긴다(queststate.js — 규칙으로 정할 수 있는 것만). 옮겨 온 칸은 그 글을 '옮김'으로 미리 적고, 건너뛸 칸은 '건너뜀 — 까닭'으로 적어 둔다(판정에서 넘김으로, F-62와 같은 줄).
  //   먼저인 칸은 비워 두고 채팅 카드가 갈 곳을 말한다(관문은 닫힌 채). 사람이 적은 줄은 덮지 않는다
  const factsNow = (extra = null) => (QS ? QS.factsFrom({ results: extra ? { ...st.results, ...extra } : st.results, source: st.source, files: st.files && st.files.src === "mine" ? st.files.list : null, codeless: !!st.codeless, card: st.card,
    pushed: st.mode === "live" && canLive ? pushedSince(7) : null, dirty: st.mode === "live" && canLive && st.files && st.files.src === "mine" ? st.files.dirty : null }) : {});   // dirty — 커밋하지 않은 파일 수(F-166-6)   // extra — 아직 결과로 남기 전의 지금 장(관문을 볼 때, 새 맥락 리뷰 2026-10-28 막힘). card — 기준 카드의 성공(F-157-2) · pushed — 8단계에 들어온 뒤 '문서로 묶어 GitHub에'로 푸시까지 했나(F-157-4, 연습은 모름)
  // 그 단계의 구분선(대화의 kind "stage") 뒤에 푸시했나 — 2단계 뒤에 한 번 올린 것으로 8단계 칸이 늘 열리지 않게(새 맥락 리뷰 B). pushedAt은 시각(ms)
  const pushedSince = (n) => { const mark = [...st.chat].reverse().find((m) => m.kind === "stage" && m.n === n); return !!st.pushedAt && Number.isFinite(st.pushedAt) && st.pushedAt >= (mark ? mark.at : 0); };
  const qstates = (q = st.quest, extra = null) => (QS && q ? QS.questStates(q, { prev: prevOf(q.chap), facts: factsNow(extra), draftOf: QU.draftOf }) : []);
  function applyStates(q) {
    if (!QS || !q || q.phase === "done") return q;
    let out = q; const states = qstates(q);
    for (const x of states) {
      if (QU.filled(out, x.i)) continue;
      if (x.state === "moved") { const r = st.results[x.from.s], line = r && r.items[x.from.i] ? (r.items[x.from.i].lines || [])[0] : ""; if (line) out = QU.fill(out, x.i, line, "moved"); }
      else if (x.state === "skip") out = QU.fill(out, x.i, `건너뜀 — ${x.why}`, "skip");
    }
    return { ...out, states };
  }
  // C-56 R-2(2026-10-28): 기준 카드를 초안 · 준비 요청에 '칸: 내용' 줄로 — 빈칸은 넘기지 않는다(지어내지 않게)
  const baseText = () => (BC && st.card ? BC.FIELDS.map((f) => { const x = st.card[f.key]; return x && x.text ? `${f.label}: ${x.text}` : ""; }).filter(Boolean).join("\n").slice(0, 1500) : "");
  const prevOf = (n, extra) => { const all = { ...st.results, ...(extra ? { [extra.chap]: extra } : {}) };
    return Object.keys(all).map(Number).filter((k) => k < n).sort((a, b) => a - b).map((k) => ({ stage: k, items: all[k].items.map((x) => ({ name: x.name, lines: x.lines })) })); };
  const preKey = (n, prev, tier = st.tier) => JSON.stringify([n, tier, ideaNow(), prev, baseText()]);   // baseText — 1단계 관문에서 기준 카드(성공 등)를 적으면 미리 받은 2단계 초안을 버린다(F-157-1, 2026-11-05: '언제 성공: 아직 모름'으로 남았다)
  // ── C-56 R-5 작업을 따라(2026-10-28 — 이재엽 버튼 "다음 단계 미리까지"): 코딩 도구가 일을 마쳤어요 알림 뒤 몇 초 모아, 지금 단계 초안을 방금 한 일로 다시 받는다(/api/stagedraft work, 화면을 막지 않는다).
  //   사람이 적은 칸은 덮지 않고 '다시 볼까요?'만(quest.js refit), 안 적은 칸만 바뀐다. '방금 바뀜' 띠 한 줄. 다음 단계 초안도 다시 미리 부른다. 진짜 AI 모드 · 초안이 있는 2 ~ 8단계 퀘스트에서만
  const REFIT_MS = 4000;
  let refitTimer = null, refitWork = [], refitTool = "";
  const refitOk = () => canLive && st.mode === "live" && !!(st.quest && QU && st.quest.phase === "quest" && st.quest.draft && st.quest.chap >= 1 && !QU.isDone(st.quest));
  function scheduleRefit(ev) {
    if (ev.sim || st.mode !== "live" || !refitOk() || !ev.work) return;
    refitWork.push(String(ev.work).trim()); refitTool = toolName(ev.tool);
    clearTimeout(refitTimer); refitTimer = setTimeout(refitNow, REFIT_MS);
  }
  async function refitNow() {
    refitTimer = null;
    const q = st.quest, work = refitWork.join("\n").slice(-(N.WORK_MAX || 600)); refitWork = [];
    if (!work || !refitOk() || st.busy) return;
    const idea = ideaNow(), prev = prevOf(q.chap);
    if (sensitive([idea, work, baseText(), ...prev.flatMap((p) => p.items.flatMap((x) => x.lines))].join("\n")).length) return;   // 비밀값처럼 보이면 밖에 보내지 않는다(관문의 guard와 같은 생각 — 지난 줄 · 기준 카드까지, 새 맥락 리뷰 2026-10-28)
    try {
      const r = await (await fetch("/api/stagedraft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: q.chap, tier: st.tier, idea, prev, base: baseText(), work }) })).json();
      if (!r || !r.ok || !r.draft || !st.quest || st.quest.chap !== q.chap || st.quest.phase !== "quest") return;
      const f = QU.refit(st.quest, r.draft);
      if (!f.changed.length && !f.review.length) return;
      st.quest = applyStates(f.q); st.tokens = r.tokens || 0; fetchUsage();
      st.refit = { chap: q.chap, tool: refitTool, at: Date.now(), changed: f.changed, review: f.review };
      pre = null; prefetch(st.quest);   // 다음 단계 초안도 다시 미리(버튼 "다음 단계 미리까지")
      render();
    } catch { /* 다시 맞추기는 덤 — 못 받으면 조용히(다음 알림에 다시) */ }
  }
  // F-161-5(claude-drafted: 2026-11-06 사용자 시험 — 방금 사람이 고른 칸도 '바뀐 칸'으로 남았고 "Ⅰ · Ⅱ은"): 바뀐 칸은 아직 사람이 적지 않은 칸만, 보일 게 없으면 띠도 없다. 조사 없이 괄호로
  const refitBanner = (q) => { if (!st.refit || !q || st.refit.chap !== q.chap) return {}; const ch = st.refit.changed.filter((i) => !QU.filled(q, i)), rv = st.refit.review;
    return ch.length || rv.length ? { banner: `방금 바뀜 — ${st.refit.why || `${st.refit.tool}가 한 일로 ${LB(q.chap)} 퀘스트를 다시 맞췄어요`}${ch.length ? ` · 바뀐 칸 ${ch.map(ROMAN).join(" · ")}` : ""}${rv.length ? ` · 적어 둔 칸(${rv.map((x) => ROMAN(x.i)).join(" · ")})도 다시 볼까요?` : ""}` } : {}; };
  const refitChips = (q) => (st.refit && q && st.refit.chap === q.chap ? st.refit.review.map((x) => ({ label: `${ROMAN(x.i)} 다시 볼까요?`, act: "refit-review", i: x.i, kind: "soft" })) : []);
  function prefetch(q) {
    if (!q || !QU || st.mode !== "live" || !canLive) return;
    if (q.chap === 0) return;   // 1단계 중에는 미리 받지 않는다 — 기준 카드가 1단계 관문에서 생겨 열쇠(baseText)가 늘 어긋나 AI 호출만 헛돈다(F-157-1 새 맥락 리뷰 A)
    const n = q.chap + 1, r = N.DRAFT_STAGES.includes(n) ? (QU.isDone(q) ? QU.resultOf(q) : QU.expectedResult(q)) : null; if (!r) return;
    // 1단계를 하는 중이면 플로로가 권한 크기의 등급으로(맞아요면 만드는 크기가 그것이 된다 — 다음 장 할 일 수가 등급마다 다르다)
    const tier = q.chap === 0 && !QU.isDone(q) && q.draft && QU.SIZE_TIER[q.draft.size] ? QU.SIZE_TIER[q.draft.size] : st.tier;
    const prev = prevOf(n, r), key = preKey(n, prev, tier);
    if ((pre && pre.key === key) || sensitive([ideaNow(), ...prev.flatMap((x) => x.items.flatMap((y) => y.lines))].join("\n")).length) return;
    const mine = { key, r: null };
    mine.p = fetch("/api/stagedraft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: n, tier, idea: ideaNow(), prev, base: baseText() }) })
      .then((x) => x.json()).catch(() => ({ ok: false })).then((x) => { mine.r = x; return x; });
    pre = mine;
  }
  // 처음 한 바퀴(C-36, 2026-10-25 — 이재엽 "원하는 내용을 받으면 너가 전체적으로 글들을 확인해서 어떤 내용이고 우리 내용들에 맞춰서 너가 초안을 백엔드로 제작을 해 그리고 이 주제에 대한 내용을 제목으로"):
  //   받은 글 전체를 AI가 한 번 읽고(/api/start — 도구 없이 글만) 1단계 초안을 만든다 → 제목이 주제인 1단계 퀘스트를 받기 화면 없이 바로, 칸마다 확인만. 연습(서버 없이)은 예시 초안.
  //   초안을 못 받으면 까닭을 말하고 전처럼 1단계를 한 줄씩(받은 글이 처음 말한 것)
  let startText = "";
  async function startDraft(text, skipCheck) {
    if (st.busy) return say("앞의 일을 아직 기다리고 있어요 — 끝난 뒤에 다시 해 주세요");   // 다른 호출이 도는 중(웹 AI 제안 '시작' 등) — 빈 퀘스트를 만들지 않는다(F-103-5)
    startText = text;   // st.source는 비밀값 경고(guard)를 지난 뒤에 — 전에는 '그만둘게요'를 골라도 보내지 않기로 한 원문이 기록(KEEP)에 남아 idea.md를 덮을 수 있었다(F-144-11)
    //   F-68(2026-10-28 이재엽 버튼 "통째로 파일에"): 받은 글 전부를 기록에 — 문서로 묶을 때 docs/00-source/idea.md로. AI · 문서의 '처음 말한 것'은 앞 400자(idea) 그대로
    if (st.mode !== "live" || !canLive) { st.source = text; return beginQuest({ ...QU.EXAMPLE_DRAFT, example: true }); }
    if (!skipCheck && guard(text, "start")) return;
    st.source = text;
    Object.assign(st, { warn: null, error: "" });
    const r = await callAI("/api/start", { text });
    if (r.ok && r.start) { st.tokens = r.tokens || 0; fetchUsage(); return beginQuest(r.start); }
    st.idea = text.slice(0, N.IDEA_MAX);
    st.quest = { ...QU.makeQuest(N.STAGES[0], crits(0)), phase: "quest" }; questStarted();
    if (qauto) openQwin("quest");
    render(); say(`초안은 만들지 못했어요 — ${r.reason || "AI에 연결하지 못했어요"}. 한 줄씩 같이 적어요`); questText();
  }
  function beginQuest(d) {
    st.topic = d.topic; st.idea = startText.slice(0, N.IDEA_MAX);   // 처음 말한 것은 받은 글 그대로(앞 400자) — 다음 장 퀘스트 글 · 계획 세우기가 쓴다
    st.quest = applyStates(QU.withDraft(QU.makeQuest(N.STAGES[0], crits(0)), d)); questStarted();
    if (qauto) openQwin("quest");
    prefetch(st.quest);   // 2단계 초안을 뒤에서 미리(C-40)
    render();
    if (startText.length > N.IDEA_MAX) say(`받은 글은 통째로 두고(문서로 묶을 때 docs/00-source/idea.md), 다음 장 초안에는 앞 ${N.IDEA_MAX}자만 넘겨요`);   // F-68 — 잘라 넘기면 화면에 한 줄
  }
  // 2단계 초안(C-37, 2026-10-25 — 이재엽 "1단계에서 받은 내용들을 2단계에서도 초안들을 진행하며 생각들을 2단계 진행하기 전에 먼저 생각하고 동의들을 구한후"):
  //   받은 글(처음 말한 것) · 지난 장 결과로 이 장의 할 일마다 초안(/api/stagedraft, AI 한 번) → 받기 화면 없이 칸마다 확인. 못 받으면 까닭을 말하고 전처럼 받기 화면 · 한 줄씩. 연습은 예시 초안
  //   C-39(2026-10-25): 3단계도 — 지난 단계 결과를 전부([{ stage, items }]) 넘기고 칸마다 재료 · 이 단계 전에 준비할 것을 같이 받는다
  //   C-40: 2 ~ 8단계 모두. 미리 부른 초안(prefetch)이 같은 지난 결과로 만든 것이면 그것을 쓴다(받는 중이면 기다리고, 실패했으면 다시 부른다)
  async function stageDraft(n, skipCheck) {
    const prev = prevOf(n), idea = ideaNow();
    if (st.mode !== "live" || !canLive) { const ex = QU.exampleStageDraft(n, crits(n), prev); if (ex && st.quest) st.quest = applyStates(QU.withStageDraft(st.quest, ex)); return render(); }
    if (!skipCheck && guard([idea, baseText(), ...prev.flatMap((p) => p.items.flatMap((x) => x.lines))].join("\n"), "stage")) return;   // 기준 카드 줄도 같이 본다(새 맥락 리뷰 2026-10-28)
    if (st.busy) return say("앞의 일을 아직 기다리고 있어요 — 끝난 뒤에 다시 해 주세요");   // 미리 받은 초안(pre)을 버리거나 앞 호출의 planBusy를 지우지 않게(F-103-5)
    Object.assign(st, { warn: null, error: "", planBusy: "stage" });
    const hit = pre && pre.key === preKey(n, prev) ? pre : null; pre = null;
    let r = hit && hit.r && hit.r.ok ? hit.r : null;
    if (hit && !hit.r) { r = await callAI(null, null, hit.p); if (!r || !r.ok) r = null; }   // 미리 부른 것을 받는 중 — 같은 기다림 화면으로 기다린다
    if (!r) r = await callAI("/api/stagedraft", { stage: n, tier: st.tier, idea, prev, base: baseText() });
    st.planBusy = "";
    if (r.ok && r.draft && st.quest && st.quest.chap === n) { st.quest = applyStates(QU.withStageDraft(st.quest, r.draft)); st.tokens = r.tokens || 0; fetchUsage(); prefetch(st.quest); render(); return say(r.draft.say); }
    render(); say(`${LB(n)} 초안은 만들지 못했어요 — ${r.reason || "AI에 연결하지 못했어요"}. 받기 화면에서 한 줄씩 해요`); questText();
  }
  // ── 2단계를 마치면 계획서와 단계 폴더를 GitHub에(C-37, 이재엽 "2단계가 끝나면 … docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에" · 버튼 "docs 단계 폴더 + CLAUDE.md" ·
  //    "Floe가 만들고, 커밋 · 푸시는 Claude Code") — 파일은 docs.js(서버가 같은 것으로 작업 폴더에 쓴다 — 화면은 결과만 보낸다), 커밋 · 푸시는 사용자의 Claude Code(허락 카드는 채팅에) ──
  //   C-39: 결과 그대로(칸마다 누가 · 플로로 초안 · 재료, 준비할 것 · 확인한 날 · 관문 지난 날 · 완료 기준) + 처음 말한 것 — 서버가 증빙 칸 · 기획서 · 결정 기록을 만든다
  const shipResults = () => Object.fromEntries(Object.entries(st.results).map(([k, { chap, ...r }]) => [k, r]));
  const shipFiles = () => (FDOCS ? FDOCS.files({ topic: st.topic, idea: st.idea || "", results: st.results, tier: st.tier, redact: (t) => (window.NavSensitive ? window.NavSensitive.redact(t) : t) }) : []);
  const nosrcAt = (p) => { const n = FDOCS.SLUGS ? N.STAGES.findIndex((_, i) => FDOCS.stagePath(i) === p) : -1; return n >= 0 && st.results[n] && st.results[n].nosrc; };   // C-49 근거 없음 — 올리기 카드의 파일 목록에 보인다
  function momentShip() {
    if (st.ship.phase === "sent") return { tone: "green", mood: "happy", meta: `<span class="mm-stage">문서 올리기</span>`, title: "올리기를 Claude Code에 맡겼어요.",
      sub: "허락이 필요하면 카드가 이 위에 떠요. 끝나면 알려 드릴게요.", acts: [{ label: "진행 보기", act: "base-ai", kind: "ghost" }, { label: "확인했어요", act: "ship-done", kind: "ghost" }] };
    if (st.ship.phase === "public") return { tone: "amber", mood: "think", meta: `<span class="mm-stage">문서 올리기 · 한 번 더 확인</span>`, title: "누구나 볼 수 있는 저장소일 수 있어요.",
      sub: esc(st.ship.reason || ""), foot: "이 저장소는 한 번만 물어요. 비밀로 둘 글이 있으면 '나중에'를 누르고 문서를 먼저 고쳐요.",
      acts: [{ label: "올릴게요", act: "ship-public", pri: true }, { label: "나중에", act: "ship-later", kind: "ghost" }] };   // 단축키 없음 — 앞 카드의 '올리기'(Enter)를 습관처럼 눌러 공개 푸시를 확인하지 않게(새 맥락 리뷰)
    // C-39(2026-10-25 — 버튼 "2단계부터 관문마다" · "증빙 칸 + 기획서 + 결정 기록"): 관문을 지날 때마다 다시 묶는다 — 같은 파일을 고쳐 쓰고 커밋 하나 더. 미리 보기는 기획서 · 결정 기록
    const files = shipFiles(), upto = Math.max(...Object.keys(st.results).map(Number)), peeks = [[FDOCS.MAIN_DOC, "기획서"], [FDOCS.LOG_DOC, "결정 기록"]];
    const peek = st.ship.peek != null && peeks[st.ship.peek] ? files.find((f) => f.path === peeks[st.ship.peek][0]) : null, tag = (p) => (peeks.find(([x]) => x === p) || [])[1];   // 파일 이름 옆 쉬운 이름(기획서 · 결정 기록)
    return { tone: "blue", mood: "happy", meta: `<span class="mm-stage">${LB(upto)}까지 정했어요</span>`, title: `1 ~ ${LB(upto)}에서 정한 것을 문서로 묶었어요 — 내 GitHub에 올릴까요?`,
      sub: `작업 폴더(${esc(wsShort())})에 단계 문서 · 기획서 · 결정 기록을 만들어요 — 칸마다 누가 어떻게 정했는지와 관문을 지난 날이 증빙으로 남아요. 커밋 · 푸시는 내 Claude Code가 해요(허락이 필요하면 카드가 떠요). README · CLAUDE.md · 목차 · 기획서 · 결정 기록은 Floe 절만 바꿔요.`,
      body: `<ul class="ship-files">${files.map((f) => `<li>${tag(f.path) ? `<b>${tag(f.path)}</b> ` : ""}${esc(f.path)}${f.merge ? " <small>절만 바꿈</small>" : ""}${nosrcAt(f.path) ? " <small>폴더에 없어요 — 다시 만들어요(근거 없음)</small>" : ""}</li>`).join("")}</ul><div class="ship-peek">${peeks.map(([, label], k) => `<button type="button" class="lnk" data-act="ship-peek" data-i="${k}" aria-expanded="${st.ship.peek === k}">${label} 미리 보기</button>`).join("")}${peek ? `<pre>${esc(peek.text)}</pre>` : ""}</div>`,
      acts: [{ label: "올리기", act: "ship-go", key: "Enter", pri: true }, { label: "나중에", act: "ship-later", kind: "ghost" }] };
  }
  // 이 조각의 누르기 — 00-base의 누르기 표(ACT)에 더한다. 공통 누르기는 90-acts.js(2026-10-29 나누기 2차)
  Object.assign(ACT, {
    // 문서 올리기(C-37) — 올리기 · 나중에(도전과제 지도에서 다시) · 확인 · 지도에서 열기
    "ship-go": () => shipGo(),
    "ship-public": () => shipGo(true),   // C-52 공개 저장소 — 저장소마다 처음 한 번
    "ship-later": () => { st.ship = null; render(); say("나중에 도전과제의 한눈에 보기에서 올릴 수 있어요"); },
    "ship-done": () => set({ ship: null }),
    "ship-peek": (i) => { if (st.ship) set({ ship: { ...st.ship, peek: st.ship.peek === i ? null : i } }); },   // 기획서 · 결정 기록 미리 보기(C-39) — 다시 그려도 펼친 채로(<details>는 다시 그릴 때마다 닫혔다)
    "ship-open": () => set({ ship: { phase: "offer" }, qfocus: "stage", pane: "" }),
  });
