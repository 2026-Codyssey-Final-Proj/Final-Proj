  // ── 두 화면이 함께 쓰는 조각 (iPhone 화면과 PC의 설계도·설정이 쓴다) ──
  const sayRow = (size, f = face()) => { const [mood, say] = f; return `<div class="say">${cat(mood, size)}<div class="bubble" aria-live="polite">${esc(say)}</div></div>`; };
  const seg = () => `<div class="seg" aria-hidden="true">${N.STAGES.map((x) => `<span class="${stepClass(x.n)}"></span>`).join("")}</div>`;
  // 카드 하나 — PC는 테두리 상자(.choose), iPhone은 흰 카드(.card). 넘기는 글은 이미 esc 한 것
  const box = (label, title, why, extra = "") => (isPhone()
    ? `<div class="card"><span class="kicker">${label}</span><span class="big">${title}</span>`
    : `<div class="choose"><span class="label">${label}</span><span class="q">${title}</span>`) + `${why ? `<span class="why">${why}</span>` : ""}${extra}</div>`;
  // 보내기 전 경고 — 값은 다시 보이지 않고 종류만 말한다
  const warnNote = (no, noLabel) => `<div class="note n-warn"><b>보내기 전에 잠깐!</b> 글 안에 ${esc(st.warn.w.join(", "))}처럼 보이는 게 있어요. 그래도 AI에게 보낼까요?
    <div class="row" style="margin-top:8px"><button class="btn" data-act="send-anyway">괜찮아요, 보낼게요</button><button class="btn pri" data-act="${no}">${noLabel}</button></div></div>`;
  const errorNote = () => (st.error ? `<div class="note n-bad">${esc(st.error)}</div>` : "");
  // 설계도 화면의 경고·오류 (작업 글의 경고는 글 칸 옆에 따로 뜬다)
  const docNotes = () => (st.askConfirm ? `<div class="note n-warn" data-ask-confirm><b>빈칸이 ${st.askConfirm}개 남았어요.</b> 그래도 이대로 확정할까요?
    <div class="row" style="margin-top:8px"><button class="btn" data-act="confirm-anyway">그래도 확정할게요</button><button class="btn pri" data-act="confirm-cancel">빈칸 채우러 가기</button></div></div>` : "")
    + (st.warn && st.warn.then !== "judge" ? warnNote("stop-send", "그만둘게요") : "") + errorNote();
  // 체크 표시 한 줄 — 할 일 목록·단계 지도·다시 봐 준 결과가 같이 쓴다. inner는 이미 esc 한 것
  const ckItem = (ok, inner) => `<li><span class="ck ${ok ? "y" : "n"}">${ok ? OK_ICON : CIRCLE}</span><span>${inner}</span></li>`;
  // 용어 표시 — 풀이가 있으면 누르면 그 자리에 한 줄이 펼쳐지고, 마우스를 올리면 같은 줄이 뜬다(FR-13). 풀이가 없으면 누를 수 없는 표시
  function termTag(t) {
    if (!t) return "";
    const line = G.explain(t), open = st.termOpen === t;
    if (!line) return `<span class="tag" title="전문가들이 부르는 이름이에요">용어: ${esc(t)}</span>`;
    return `<button type="button" class="tag term" data-act="term" data-term="${esc(t)}" aria-expanded="${open}" title="${esc(line)}">용어: ${esc(t)}</button>${
      open ? `<span class="term-say" role="note">${esc(line)}</span>${window.FloeStudyPack ? `<button type="button" class="lnk term-more" data-act="study-open" data-term="${esc(t)}">더 공부하기</button>` : ""}` : ""}`;   // C-24 — 이 말로 공부 묶음
  }
  // 넘어가기 전 확인의 한 장 요약 — [이름, 내용]. iPhone은 줄로, PC는 표로 그린다
  function planRows() {
    const s = stage(), nx = nextStage();
    return [["받은 것", s.gets], ["한 일", s.does], ["만든 것", gv(s)], ["헷갈렸던 부분", hardTexts().join(", ")], ["받은 답", st.answer],
      ...(nx ? [["다음 단계", `${LB(nx.n)} ${nx.title} — ${nx.does}`]] : [])];
  }
  // 내가 정한 순서 — move면 꼭 할 일/나중에 고르기와 위·아래 버튼까지
  // 제안(MoSCoW를 둘로 줄인 것, priority.js) — 기본은 모두 꼭 할 일. 나중에로 미루면 '지금 할 일'이 건너뛴다
  const prioSeg = (i, later) => `<span class="prio" role="group" aria-label="${i + 1}번 할 일은 얼마나 급한가요">${[["must", false], ["later", true]].map(([k, v]) =>
    `<button type="button" class="pr" data-act="prio" data-i="${i}" data-later="${v}" aria-pressed="${later === v}">${P.LABEL[k]}</button>`).join("")}</span>`;
  const todoList = (move) => `<ol class="todo">${st.todos.map((t, i) => { const later = P.isLater(st.todoLater, t); return `<li class="${later ? "later" : ""}"><span class="i">${i + 1}</span><span class="t">${esc(t)}</span>${move ? `
    ${prioSeg(i, later)}<button class="round" data-act="up" data-i="${i}" aria-label="위로" ${i === 0 ? "disabled" : ""}>${I.up}</button>
    <button class="round" data-act="down" data-i="${i}" aria-label="아래로" ${i === st.todos.length - 1 ? "disabled" : ""}>${I.down}</button>` : later ? `<span class="tag">${P.LABEL.later}</span>` : ""}</li>`; }).join("")}</ol>`;
  // 골라 주세요(iPhone) — 고르는 건 사용자다. 고르면 작업 글에 한 줄로 적고 다시 살펴본다
  function chooseCard() {
    const n = st.j.next;
    if (st.later) return `<div class="row"><span class="meta grow">나중에 정하기로 했어요 — ${esc(n.question)}</span><button class="btn" data-act="again">다시 고르기</button></div>`;
    return `<div class="choose"><span class="label">골라 주세요</span><span class="q">${esc(n.question)}</span><span class="why">${esc(n.why)}</span>
      ${n.options.map((o, i) => `<button class="opt" data-act="opt" data-i="${i}" aria-pressed="${st.choice === i}"><span class="radio"></span>${esc(o)}</button>`).join("")}
      <div class="row"><button class="btn pri grow" data-act="decide" ${st.choice === null || st.busy ? "disabled" : ""}>이걸로 정할게요</button><button class="btn" data-act="later">나중에</button></div>
      <span class="meta">${esc(n.action)}</span></div>`;
  }
  const critList = (terms) => `<ul class="crit">${st.j.criteria.map((c) => ckItem(c.met, `${esc(c.text)}${terms ? termTag(c.term) : ""}${
    c.evidence ? `<span class="sub">적어 주신 글: "${esc(c.evidence)}"</span>` : ""}`)).join("")}</ul>`;
  const notes = () => (st.notice ? `<div class="note n-ok">${esc(st.notice)}</div>` : "");
  function inputBox() {
    let h = `<textarea data-act="text" aria-label="지금 만드는 것" placeholder="${PLACEHOLDER}">${esc(st.text)}</textarea>
      <div class="row">${stageExamples().map((e) => `<button class="btn" data-act="ex" data-i="${S.examples.indexOf(e)}">${esc(e.label)}</button>`).join("")}
      <span class="grow"></span><button class="btn pri" data-act="judge" ${st.busy ? "disabled" : ""}>어디쯤인지 보기</button></div>`;
    if (st.mode === "live") h += `<p class="meta" style="margin:0">${SENT}</p>`;
    if (st.warn && st.warn.then === "judge") h += warnNote("edit", "고칠게요");
    return `<div class="stack">${h}${errorNote()}</div>`;
  }
  const inputDetails = () => `<details ${st.error || st.warn || st.openInput ? "open" : ""}><summary>바뀐 작업 다시 보여 주기</summary>${inputBox()}</details>`;
  const modeBadge = () => (st.mode === "live"
    ? `<span class="badge live">진짜 AI(Claude)가 봐요${st.tokens ? ` · 지난번 읽고 쓴 양 약 ${st.tokens.toLocaleString()}토큰` : ""}</span>`
    : `<span class="badge fix">연습용 예시예요 — 진짜 AI가 아니에요</span>`);
  // 설정 — 묶음별로 나눠 한눈에(6.2.0, 이재엽 2026-10-19 "설정창도 직관적으로"): 연결 · GitHub · 토큰 · 보기 · 알림 · 느낀 점 · 기록. PC·iPhone 모두 톱니 뒤에
  // '플로로와 나' 카드는 뺐다(2026-10-24 두승현 — 설정 창 머리와 겹침). 처음 만난 날(st.since)은 저장만 남긴다
  // 설정 칸 조각 — 묶음 · 한 줄(이름 + 작은 설명) · 단추 고르기 · 동그라미 고르기 · 상태 불 한 줄(2026-10-25 두승현 리팩토링: 같은 HTML을 칸마다 따로 찍던 것을 모음)
  const sgrp = (ic, title, body) => `<section class="sgrp"><h3 class="sg-h">${ic}${title}</h3>${body}</section>`;
  const srow = (label, control, small = "") => `<div class="srow"><span>${label}${small ? `<small>${small}</small>` : ""}</span>${control}</div>`;
  const pick = (label, items, cur, act) => `<span class="pick" role="group" aria-label="${label}">${items.map(([v, name]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${v === cur}">${name}</button>`).join("")}</span>`;
  const radios = (name, label, items, cur, tail = "") => `<span class="row tiers" role="radiogroup" aria-label="${label}">${items.map(([v, text]) =>
    `<label class="chk"><input type="radio" name="${name}" data-act="${name}" value="${v}" ${cur === v ? "checked" : ""}>${text}</label>`).join("")}${tail}</span>`;
  const ledRow = (led, text, tail = "") => `<div class="row"><span class="led${led ? ` ${led}` : ""}"></span><span class="grow">${text}</span>${tail}</div>`;
  const SG = {
    link: icon('<path d="M10 14a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1"></path><path d="M14 10a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1"></path>', 14),
    eye: icon('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle>', 14),
    box: icon('<path d="M4 7h16v13H4z"></path><path d="M4 7l2-3h12l2 3"></path><path d="M10 11h4"></path>', 14),
    bell: icon('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"></path><path d="M10 20a2 2 0 0 0 4 0"></path>', 14),
    git: icon('<circle cx="6" cy="6" r="2"></circle><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="8" r="2"></circle><path d="M6 8v8"></path><path d="M18 10a6 6 0 0 1-6 6H8"></path>', 14),
  };
  // GitHub 칸(C-25, claude-drafted: 2026-10-24 — 이재엽 "깃허브을 연동하는 곳을 설정창에") — Floe는 토큰을 받지 않는다. 서버가 이 컴퓨터의 git · gh에게 읽기만 묻고(/api/github, API.md 3-19),
  // 저장소 만들기는 사람이 누를 때만 사용자의 Claude Code에 맡긴다(/api/github/create → 일 넘기기 3-16). 서버 없이 열면 안내만
  let ghLoading = false, ghAsk = 0;
  //   ghAsk — 가장 나중에 물은 답만 쓴다('다시 확인' · 저장소가 생긴 뒤 다시 묻기가 겹치면 늦게 온 옛 답이 덮었다, F-103-29)
  async function loadGithub() {
    if (!canLive) return;
    const ask = ++ghAsk; ghLoading = true;
    let g; try { g = await (await fetch("/api/github", { cache: "no-store" })).json(); } catch { g = { ok: false }; }
    if (ask !== ghAsk) return;
    st.gh = g; ghLoading = false; render();
  }
  // 그리는 곳(설정의 GitHub 칸 · 작업실 머리)이 부른다 — 한 번 그리는 동안 여러 곳이 불러도 한 번만 묻는다(F-103-29)
  const ghSoon = () => { if (canLive && !st.gh && !ghLoading) { ghLoading = true; setTimeout(loadGithub, 0); } };
  // 두 번 눌러도 같은 요청을 기다린다 — 두 번째가 '이미 맡긴 일'(409)로 성공 문구를 실패로 덮었다(F-103-27)
  let repoReq = null;
  function createRepo() { return repoReq || (repoReq = createRepoOnce().finally(() => { repoReq = null; })); }
  async function createRepoOnce() {
    st.ghNote = "Claude Code에 맡기는 중…"; render();
    let r;
    try { r = await (await fetch("/api/github/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibility: st.ghVis }) })).json(); }
    catch { r = { ok: false, reason: "서버에 닿지 않았어요" }; }
    st.ghNote = r && r.ok ? "Claude Code에 맡겼어요 — 허락을 구하면 섬에 떠요. 끝나면 '다시 확인'을 눌러요." : `맡기지 못했어요 — ${(r && r.reason) || "까닭을 모름"}`;
    if (r && r.ok) watchTask(r.task, "repo");
    render();
    return r;   // 처음 설정에서 부른 쪽(floe:setup-done)이 맡겼는지 보고 말한다
  }
  const GH_CLI = "https://cli.github.com";
  function githubGroup() {
    const box = (body) => sgrp(SG.git, "GitHub", body);
    if (!canLive) return box(`<span>서버로 열면(앱 · floe.js) 연결한 프로젝트 폴더가 GitHub 저장소와 이어졌는지 보여요. Floe는 GitHub 비밀번호 · 토큰을 받지 않아요.</span>`);
    ghSoon();
    const g = st.gh;
    const again = `<button type="button" class="btn" data-act="gh-reload">다시 확인</button>`;
    if (!g) return box(ledRow("", "확인하는 중…"));
    if (!g.ok) return box(ledRow("off", "서버에 닿지 않았어요", again));
    const cli = !g.gh.found ? ledRow("off", "GitHub CLI(gh)가 없어요 — 설치하면 저장소 만들기를 Claude Code에 맡길 수 있어요", `<a class="btn" href="${GH_CLI}" target="_blank" rel="noopener">설치 안내</a>`)
      : !g.gh.signedIn ? ledRow("off", "GitHub에 로그인이 필요해 보여요 — 터미널에서 <code>gh auth login</code> 한 번")
      : ledRow("on", "GitHub CLI에 로그인됨");
    const where = g.project ? `${esc(g.project)} 폴더` : "프로젝트 폴더";
    let repo;
    if (g.why === "folder") repo = `<span>작업 폴더를 아직 몰라요 — 처음 설정의 '프로젝트'나 위의 '프로젝트 폴더 연결…'로 골라요.</span>`;
    else if (g.why === "no-git") repo = `<span>이 컴퓨터에 git이 없어요 — Claude Code에 "git 설치를 도와줘"라고 물어봐요.</span>`;
    else if (g.remote && g.remote.kind === "github") repo = `${ledRow("on", `${where} → <b>${esc(g.remote.owner)}/${esc(g.remote.repo)}</b>`, `<a class="btn" href="${esc(g.remote.web)}" target="_blank" rel="noopener">GitHub에서 열기</a>`)}
      <span class="meta">기록 · 저장은 이 저장소의 README와 커밋으로 남아요. 올리는 일은 Claude Code가 하고, Floe는 읽기만 해요.</span>`;
    else if (g.remote) repo = ledRow("", `${where}는 GitHub가 아닌 곳과 이어져 있어요 — 그대로 써도 되고, 책(README)은 똑같이 읽혀요.`);
    else {
      const can = g.gh.found && g.gh.signedIn, live = st.mode === "live";
      repo = `${ledRow("off", `${where}는 ${g.why === "not-repo" ? "아직 git 저장소가 아니에요" : "아직 GitHub 저장소와 이어지지 않았어요"}`)}
      ${srow("공개 범위", pick("새 저장소의 공개 범위", [["private", "비공개"], ["public", "공개"]], st.ghVis, "gh-vis"))}
      <div class="row"><button type="button" class="btn pri" data-act="gh-create" ${can && live ? "" : "disabled"}>저장소 만들어 달라고 Claude Code에 맡기기</button></div>
      <span class="meta">${!can ? "위의 GitHub CLI 준비가 먼저예요. " : !live ? "보기 방식을 '진짜 AI'로 바꾸면 맡길 수 있어요(Claude Code가 움직여요). " : ""}README 첫 장을 만들고 .env 같은 비밀값 파일은 빼고 올려요. 강제 푸시 · 지우기는 하지 않아요.</span>`;
    }
    return box(`${cli}${repo}${st.ghNote ? `<span class="meta" role="status">${esc(st.ghNote)}</span>` : ""}<div class="row"><span class="grow"></span>${again}</div>`);
  }
  // 토큰 칸(2026-10-24, 이재엽 "테스트를 진행하면서 토큰값도 계산을 할거야") — 서버의 토큰 장부(/api/usage의 ledger, tokens.js)를 보이기만 한다.
  // Floe의 AI와 Claude Code에 맡긴 일을 따로, 비용은 Claude Code가 알려 준 값만. '새로 재기'는 테스트를 시작할 때 0부터(POST /api/usage/reset)
  let usage = null, usageLoading = false;   // /api/usage의 답 — 설정을 열 때 · AI를 부른 뒤 · Claude Code가 일을 마쳤을 때 다시 묻는다
  function tokenGroup() {
    if (!canLive) return "";
    if (!usage && !usageLoading) setTimeout(fetchUsage, 0);
    const v = usage && window.NavTokenView && window.NavTokenView.ledgerView ? window.NavTokenView.ledgerView(usage.ledger) : null;
    const box = (body) => sgrp(SG.box, "토큰", body);
    if (!v) return box(`<span>${!usage ? "확인하는 중…" : usage.ok === false ? "서버에 닿지 않았어요 — 설정을 다시 열면 다시 물어요" : "이 서버는 아직 토큰을 세지 않아요"}</span>`);
    const reset = `<button type="button" class="btn" data-act="tokens-reset">새로 재기</button>`;
    if (v.empty) return box(`<div class="row"><span class="grow">${v.since} 뒤로 아직 쓴 토큰이 없어요. Floe의 AI를 부르거나 Claude Code에 일을 맡기면 여기 쌓여요.</span>${reset}</div><span class="meta">${esc(v.note)}</span>`);
    return box(`<div class="row"><span class="grow"><b>${esc(v.total)}</b> <span class="meta">${v.since}부터</span></span>${reset}</div>
      ${v.rows.map((r) => srow(esc(r.name), `<span>${esc(r.value)}</span>`)).join("")}
      <ul class="tok-runs">${v.recent.map((line) => `<li class="meta">${esc(line)}</li>`).join("")}</ul><span class="meta">${esc(v.note)}</span>`);
  }
  async function resetTokens() {
    try { const j = await (await fetch("/api/usage/reset", { method: "POST" })).json(); if (j && j.ok && usage) usage = { ...usage, ledger: j.ledger }; } catch {}
    render();
  }
  // 묶음 하나씩 — 휴대폰은 settingsBody로 전부 이어서, PC 설정 판(settingsPane)은 고른 탭의 것만 부른다
  function linkGroup() {
    // 연결 칸 — 서버로 열었으면 보기 방식과 상관없이 보인다(연습 중에도 알림은 들어오니까). '연결 끊기'를 누르면 들어온 알림을 받지 않는다
    const link = canLive ? sgrp(SG.link, "연결", `${ledRow(conn(), st.unplug
        ? "연결을 끊었어요 — 작업 알림이 와도 글 칸을 채우거나 살펴보지 않아요"
        : st.feed.at ? `${toolName(st.feed.tool)}와 연결됨 · ${esc(wsFull() || st.feed.project || "프로젝트")} · 마지막 알림 ${ago(st.feed.at)}${st.feed.project && wsFull() && st.feed.project !== wsFull() ? `(${esc(st.feed.project)}에서)` : ""}`   // 이름은 연결한 폴더 먼저 — 마지막 알림이 다른 폴더에서 왔으면 그 이름은 뒤에(F-73)
        : "Claude Code·Codex 알림을 기다리는 중 — connect.js로 연결해 주세요",
        `<button type="button" class="btn" data-act="unplug" aria-pressed="${st.unplug}">${st.unplug ? "다시 연결" : "연결 끊기"}</button>`)}
      ${st.mode === "live" ? `<label class="chk"><input type="checkbox" data-act="auto" ${st.auto ? "checked" : ""} ${st.unplug ? "disabled" : ""}>AI 코딩 도구가 작업을 마치면 자동으로 살펴보기</label>
      <span>켜면 그때마다 최근 작업 대화가 AI(Claude)로 보내져요. 비밀번호처럼 보이는 게 있으면 보내기 전에 멈춰요.</span>` : ""}${
      // 앱 안에서는 폴더 고르기로 훅을 더하고 뺀다(터미널의 floe.js · connect.js와 같은 일) — preload.js가 열어 준 셋만
      window.floeApp ? `<div class="row"><button type="button" class="btn" data-act="app-connect">프로젝트 폴더 연결…</button><button type="button" class="btn" data-act="app-disconnect">연결 빼기…</button><button type="button" class="btn" data-act="app-settings">.env 폴더 열기</button></div>` : ""}`) : "";
    return link;
  }
  function keepGroup() {
    // 처음 설정(setup.js) 다시 하기 — Claude Code / API 키를 바꿀 때 (2026-10-19)
    const keep = sgrp(SG.box, "기록 · 처음 설정", `${window.FloeSetup ? `<div class="row"><span class="grow">AI를 어떻게 부를지(Claude Code / API 키) 다시 고를 수 있어요.</span><button class="btn" data-act="setup">처음 설정 다시 하기</button></div>
      <div class="row"><span class="grow">다른 프로젝트로 — 내 GitHub 저장소를 가져오거나 새로 만들어요(C-31).</span><button class="btn" data-act="setup-project">프로젝트 바꾸기</button></div>` : ""}<div class="row"><span class="grow">기록은 이 컴퓨터에만 남아요(진짜 AI 모드의 대화는 앱 저장 곳에도) — 지우면 지금 폴더의 대화도 지워요.</span><button class="btn" data-act="forget">기록 지우기</button></div>`);
    return keep;
  }
  function viewGroup() {
    // 만드는 크기 — 진짜 AI에게 물을 때 같이 보낸다(tier). 고르는 건 사용자
    const tier = srow("만드는 크기", radios("tier", "만드는 크기", TIERS, st.tier, termTag(st.tier)));
    const view = sgrp(SG.eye, "보기", `${srow("보기 방식", `<select data-act="mode" aria-label="보기 방식">
        <option value="fixture" ${st.mode === "fixture" ? "selected" : ""}>연습용 예시</option>
        <option value="live" ${st.mode === "live" ? "selected" : ""} ${canLive ? "" : "disabled"}>진짜 AI (Claude)${canLive ? "" : " — server.js를 켜야 해요"}</option></select>`)}
      ${srow("글자 크기", `<select data-act="text-size" aria-label="글자 크기">${TEXT_SIZES.map(([v, name]) =>
        `<option value="${v}" ${st.textSize === v ? "selected" : ""}>${name}</option>`).join("")}</select>`)}
      ${srow("접히기까지", `<span class="row tiers fold" role="group" aria-label="펼친 섬이 접히기까지">${FOLD_CHOICES.map((v) => `<button type="button" class="b fold-opt" data-act="fold-delay" data-i="${v}" aria-pressed="${foldSec === v}">${v}초</button>`).join("")}<span class="meta">마우스가 나간 뒤 그 시간이 지나면 접혀요</span></span>`)}
      ${tier}
      <div class="row">${modeBadge()}<span class="grow">안내 기준은 아직 시험판이에요</span></div>`);
    return view;
  }
  const logGroup = () => sgrp(SG.bell, "알림 · 느낀 점", `${alertLog()}${notesCard()}`);
  const settingsBody = () => `${linkGroup()}${githubGroup()}${tokenGroup()}${viewGroup()}${logGroup()}${keepGroup()}`;
  // 알림 기록(FR-7) — [때 · 도구 · 무슨 알림 · 서버가 준 한 줄 · 이 알림으로 끝낸 할 일]. 비밀번호처럼 보이는 글은 숨긴 채로 남는다(alerts.js)
  const clock = (t) => (Number.isFinite(t) ? new Date(t).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }) : "");
  const alertItem = (a) => `<li><span class="meta">${clock(a.at)}</span> <b>${esc(toolName(a.tool))}${a.sim ? " · 연습 알림" : ""}</b> ${esc(A.KIND[a.kind] || "알림을 보냈어요")}${
    a.hidden ? `<span class="sub">비밀번호처럼 보이는 글이 있어 내용은 숨겼어요</span>` : a.line ? `<span class="sub">${esc(a.line)}</span>` : ""}${
    a.done && a.done.length ? `<span class="sub ok">${OK_ICON} 끝냈다고 표시함: ${esc(a.done.join(", "))}</span>` : ""}</li>`;
  const alertLog = () => `<div class="alog"><div class="row"><button type="button" class="lnk grow" data-act="alog" aria-expanded="${st.alogOpen}">${st.alogOpen ? I.up : I.down}알림 기록 ${st.alerts.length}개</button>${
    st.alogOpen && (st.alerts.length || canLive) ? `<button type="button" class="btn" data-act="alog-clear">알림 기록 비우기</button>` : ""}</div>${
    st.alogNote ? `<span class="meta" role="status">${esc(st.alogNote)}</span>` : ""}${
    !st.alogOpen ? "" : st.alerts.length ? `<ol>${st.alerts.map(alertItem).join("")}</ol>`
      : `<span class="meta">아직 받은 알림이 없어요.${st.mode === "fixture" && !isPhone() ? " 뒤 화면의 '▶ 작업 장면 보기'를 누르면 연습 알림이 와요." : ""}</span>`}</div>`;
  // 느낀 점(2026-10-19 실사용) — 설정 안. 한 줄 남기면 어디서(화면 · 단계 · 탭 · 보기 방식)와 때가 저절로 붙는다(notes.js where). 이 컴퓨터에만 남고,
  // 'Jira용 복사'가 모아 클립보드에 넣는다 — 그때 비밀값 · 연락처 모양은 가린다(sensitive와 같은 sensitive.js)
  const noteCtx = () => ({ screen: st.screen, stage: st.j ? st.j.stage : undefined, tab: st.tab, mode: st.mode, project: project() });
  const noteItem = (n) => `<li><span class="meta">${esc(NT.stamp(n.at))}${n.where ? ` · ${esc(n.where)}` : ""}</span><button type="button" class="lnk" data-act="note-del" data-id="${esc(n.id)}" aria-label="이 느낀 점 지우기">지우기</button><span class="ntext">${esc(n.text)}</span></li>`;
  const notesCard = () => (!NT ? "" : `<div class="alog notes"><div class="row"><button type="button" class="lnk grow" data-act="notes" aria-expanded="${st.notesOpen}">${st.notesOpen ? I.up : I.down}느낀 점 ${noteList.length}개</button>${
    st.notesOpen && noteList.length ? `<button type="button" class="btn" data-act="notes-copy">Jira용 복사</button><button type="button" class="btn" data-act="notes-clear">전부 지우기</button>` : ""}</div>${
    !st.notesOpen ? "" : `<textarea class="mc-input" data-act="note-text" rows="2" aria-label="느낀 점" placeholder="예) 2단계 할 일 문장이 어려웠어요">${esc(st.noteText)}</textarea>
      <div class="row"><span class="meta grow">어디서(화면 · 단계) 언제 쓴 느낌인지는 저절로 붙어요. 이 컴퓨터에만 남아요.</span><button type="button" class="btn pri" data-act="note-add" ${st.noteText.trim() ? "" : "disabled"}>남기기</button></div>${
      st.noteCopy ? `<textarea class="mc-input" data-act="note-copy" rows="4" readonly aria-label="복사할 글">${esc(st.noteCopy)}</textarea><span class="meta">자동 복사가 안 돼서 여기 두었어요 — 전체 선택해서 복사하세요.</span>` : ""}${
      noteList.length ? `<ol>${noteList.map(noteItem).join("")}</ol>` : `<span class="meta">아직 남긴 느낀 점이 없어요. 쓰다가 걸리는 게 있으면 바로 적어 두세요.</span>`}`}</div>`);
  const settingsCard = () => (st.settings ? `<div class="foot settings">${settingsBody()}</div>` : "");
  const gearBtn = () => `<button class="round" data-act="settings" aria-pressed="${st.settings}" aria-label="설정" title="설정 — 보기 방식, 연결, 기록">${I.gear}</button>`;

  // 단계 지도 — iPhone 탭이 쓴다
  const mapBody = () => `<div class="list">${N.STAGES.map((x) => `<div>
      <span class="dot ${stepClass(x.n)}"></span><span style="flex:1;padding:8px 0"><b>${LB(x.n)} · ${esc(x.title)}</b><span class="sub">${esc(x.does)}</span></span>
      ${stepClass(x.n) === "cur" ? `<span class="meta">${metCount()}/${met().length}</span>` : ""}</div>`).join("")}</div>`;
  // [id, PC 이름, iPhone 이름, 아이콘]. 마지막(도서관)은 PC에만 있다 — iPhone은 앞의 셋. 탭 순서가 바뀌면 고른 동그라미(.ti-ind)는 순서(tabIdx)를 따라간다
  // '내 배움' 탭은 2026-10-18에 뺐다(F-05, PRD 2-7) — '플로로와 나'(설정 맨 위)도 2026-10-24에 뺐다. 서재의 '내 배움'도 2026-10-19에 지움.
  // 2026-10-18 임유정 요청: 첫 탭 이름 '지금' → '이번 단계', '한곳에서 보기' 탭(FR-6)도 뺐다 — FR-6 등급은 팀이 정한다(PR #105)
  // 2026-10-20(C-16, 이재엽 "우리 도서관이 있잖아 책들로 정리를 해서 거기에 저장을 하고 책에 들어가서 내용 확인 후 작업"): 단계 문서 탭을 뺐다 — 문서는 도서관의 책 안에서(bookDocs · deskDoc)
  const TABS = [["today", "이번 단계", "오늘", "today"], ["map", "단계 지도", "단계 지도", "map"], ["lib", "도서관", "도서관", "lib"]];
  const PHONE_TABS = TABS.slice(0, 2);
  // 이 단계의 단계 문서 — 확정한 것(done), 고치는 중인 것(d), 플로로의 표정과 한마디(face)
  function docState(s) {
    const done = docDone(s.n), d = st.doc && st.doc.stage === s.n ? st.doc : null;
    return { done, d, face: N.docFace({ busy: st.busy, warn: st.warn, error: st.error, review: d && d.review, draftSay: d && d.say, done }) };
  }
  const reviewList = (r) => (r ? `<div class="card review"><span class="kicker">다시 봐 드렸어요${st.mode === "fixture" ? " · 연습용이라 빈칸이 남았는지만 봐요" : ""}</span><ul class="crit">
      ${r.good.map((g) => ckItem(true, esc(g))).join("")}
      ${r.fix.map((f) => ckItem(false, `<b>"${esc(f.where)}"</b> — ${esc(f.why)}<span class="sub">고치는 방향: ${esc(f.hint)}</span>`)).join("")}</ul></div>` : "");
  const blankMeta = (d) => { const n = N.blanks(d.text).length; return `${n ? `빈칸 ${n}개` : "빈칸 없음"} · 봐 드린 횟수 ${d.rounds}번`; };

  // 넘어가기 전 확인에 더한 두 장면이 PC·iPhone에서 같이 쓰는 글과 조각 — 확인 질문(CHECK)과 잠시 멈추기(HOLD)
  const CHECK = { sub: "맞든 틀리든 그대로 넘어가요. 가볍게 골라 보세요.", go: "알겠어요, 계속할게요" };
  const HOLD = { title: "잠시 멈추고, 다시 볼 날을 정해 둘까요?", sub: "멈춰 둬도 다음 단계로는 넘어가지 않아요. 정한 날에 다시 같이 풀어요.",
    later: "준비되면 언제든 이어서 해요. 그때까지 다음 단계로는 넘어가지 않아요." };
  const checkWhy = (q) => `<div class="answer"><b>이번 단계에서 한 일</b>${esc(q.why)}</div>`;
  const holdOffer = () => (U.offerHold(st.noCount) ? `<div class="hold-offer"><span><b>벌써 ${st.noCount}번째 같이 풀고 있어요.</b> 오늘은 잠시 멈추고, 다시 볼 날을 정해 둬도 돼요.</span>
    <button type="button" class="${isPhone() ? "btn" : "b"}" data-act="hold">잠시 멈추기</button></div>` : "");
  const holdForm = () => `<div class="holdform"><label><span>누가 다시 볼까요?</span><input data-act="hold-who" value="${esc(st.holdWho)}" maxlength="20" autocomplete="off"></label>
    <label><span>언제 다시 볼까요?</span><input type="date" data-act="hold-when" value="${esc(st.holdWhen)}" min="${ymd()}"></label></div>`;
  // 넘어가기 전 확인(iPhone) — 단계마다 [내용, 버튼]. 버튼은 아래에 붙인다
  function checkStep() {
    const s = stage(), nx = nextStage();
    const yesNo = `<span class="ask">이번 단계에서 한 일, 이해되셨나요?</span>
      <button class="btn pri wide" data-act="yes">네, 이해했어요</button><button class="btn wide" data-act="no">아니요, 잘 모르겠어요</button>
      <span class="meta" style="text-align:center">"아니요"를 누르면 같이 풀어 봐요.${st.noCount ? ` · 다시 물어본 횟수 ${st.noCount}번` : ""}</span>`;
    // '아니요' 세 번째부터 잠시 멈추기를 권한다(understand.js HOLD_AFTER_NO)
    const holdBtn = U.offerHold(st.noCount) ? `<button class="btn wide" data-act="hold">잠시 멈추기</button>` : "";
    if (st.step === "which") return [`${holdOffer()}<span class="ask">어디가 헷갈렸나요?</span><span class="meta">여러 개 골라도 돼요.</span>` +
      st.j.criteria.map((c, i) => `<label class="chk"><input type="checkbox" data-act="hard" data-i="${i}" ${st.hard.includes(i) ? "checked" : ""}>${esc(c.text)}</label>`).join(""),
      `<button class="btn pri wide" data-act="to-question" ${st.hard.length ? "" : "disabled"}>다음</button>`];
    if (st.step === "question") return [`<span class="ask">궁금한 걸 편하게 물어보세요</span>
      <textarea data-act="question" placeholder="예) 꼭 필요한지 표시하는 건 왜 해요?">${esc(st.question)}</textarea>
      ${st.answer ? `<div class="note n-acc">${esc(st.answer)}</div>` : ""}${errorNote()}`,
      `<button class="btn pri wide" data-act="answer" ${st.busy ? "disabled" : ""}>물어보기</button>${st.answer ? `<button class="btn wide" data-act="plan">한 장 요약 보기</button>` : ""}${holdBtn}`];
    if (st.step === "plan") return [`<span class="ask">이번 단계 한 장 요약</span><div class="plan">
      ${planRows().map(([k, v]) => `<div><b>${k}</b> ${esc(v)}</div>`).join("")}</div>`, yesNo + holdBtn];
    if (st.step === "hold") return [`<span class="ask">${HOLD.title}</span><span class="meta">${HOLD.sub}</span>${holdForm()}`,
      `<button class="btn pri wide" data-act="hold-save">이렇게 멈춰 둘게요</button><button class="btn wide" data-act="hold-back">돌아가기</button>`];
    // 확인 질문은 질문과 선택지를 아래 막대에 같이 둔다 — 질문이 스크롤 밖에 있으면 무엇을 고르는지 안 보여서
    if (st.step === "check") {
      const { q, pick } = st.check;
      if (pick === null) return ["", `<span class="ask">${esc(q.ask)}</span><span class="meta" style="text-align:center">${CHECK.sub}</span>` +
        q.options.map((o, i) => `<button class="opt" data-act="check-pick" data-i="${i}"><span class="radio"></span>${esc(o)}</button>`).join("")];
      return ["", `<span class="ask">정답: ${esc(q.options[q.answer])}</span>${checkWhy(q)}<button class="btn pri wide" data-act="check-go">${CHECK.go}</button>`];
    }
    if (st.step === "next" && !nx) return [`<span class="ask">${END.last}</span>`, `<button class="btn pri wide" data-act="go">마치기</button>`];
    if (st.step === "next") return [`<span class="ask">좋아요! 다음은 ${nx ? `${LB(nx.n)} "${esc(nx.title)}"` : "마무리"}예요</span>
      <span class="meta">무엇부터 할지 순서를 정해 보세요. 지금 안 해도 되는 일은 '나중에'로 미뤄 둬요.</span>${todoList(true)}`,
      `<button class="btn pri wide" data-act="go" ${N.canAdvance(met(), "yes") ? "" : "disabled"}>이 순서로 시작하기</button>`];
    return [learnBox(s.n), yesNo];   // C-47 배운 것 · 처음 뜻 — 좁은 화면에서도(새 맥락 리뷰: 칸 없이 '비어 있음'이 남았다)
  }
  const chips = () => `<div class="chips">${N.STAGES.map((x) => `<span class="chip ${stepClass(x.n)}">${stepClass(x.n) === "done" ? `${OK_ICON} ` : ""}${x.n + 1} ${esc(x.short)}</span>`).join("")}</div>`;
  const flow = () => { const s = stage(); return `<div class="flow"><div class="box"><b>받은 것</b>${esc(s.gets)}</div><span class="arrow">→</span>
    <div class="box"><b>한 일</b>${esc(s.does)}</div><span class="arrow">→</span><div class="box"><b>만든 것</b>${esc(gv(s))}${
    docDone(s.n) ? `<span class="sub ok">${OK_ICON} 문서 확정함</span>` : ""}</div></div>`; };
  // iPhone의 지금 결정할 것 하나 — 다 했으면 "넘어가기", 순서를 정했으면 그 첫 일, 아니면 같이 정하기
  function focusCard() {
    const n = st.j.next, now = esc(tick().now);
    if (st.finished) return box("다 했어요", END.title, END.sub, `<button class="btn pri wide" data-act="${END_ACT}">${END.more}</button>${
      st.mode === "fixture" ? `<button class="btn wide" data-act="${RESTART.act}">${RESTART.label}</button>` : ""}`);
    if (holding()) return box(esc(U.holdLine(st.hold, ymd())), "잠시 멈춰 뒀어요", HOLD.later, `<button class="btn pri wide" data-act="hold-resume">다시 이어 하기</button>`);
    if (allDone()) return box("다 했어요", `${LB(stage().n)} 할 일을 모두 했어요`, "넘어가기 전에 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      `<button class="btn pri wide" data-act="gate">다음 단계로 넘어가기</button>`);
    if (st.todos) return box("지금 할 일", esc(todosNow()[0]), "정한 순서대로 하나씩 해 봐요. 하고 나서 바뀐 작업을 다시 보여 주세요.");
    if (!n) return box("지금 할 일", now, "");
    return st.picking || st.later ? box("지금 할 일", now, "", chooseCard())
      : box("지금 할 일", now, esc(n.why), `<button class="btn pri wide" data-act="pick">같이 정하기</button>`);
  }
  // 용어 풀이를 펼치면 다시 그려도 이 단계 할 일 목록이 접히지 않게 열어 둔다
  const more = () => `<div class="more">
    <details ${st.j.criteria.some((c) => c.term && c.term === st.termOpen) ? "open" : ""}><summary>이 단계 할 일 ${met().length}개 보기</summary>${critList(true)}</details>
    ${st.todos ? `<details><summary>내가 정한 순서 보기</summary>${todoList(false)}</details>` : ""}
    ${inputDetails()}</div>`;

  // ── PC 화면 — 가로 카드 ──
  // 지금 보이는 카드의 단축키 { 키: 할 일 } — 카드를 그릴 때 채운다
  let deskKeys = {};
  const KEYCAP = { Enter: "Enter", Escape: "Esc", "c-Enter": "Ctrl+Enter" };
  const kbd = (k) => (k ? `<kbd aria-hidden="true">${KEYCAP[k] || k.toUpperCase()}</kbd>` : "");
  // 버튼 하나 {label, act, i, key, pri, kind, pressed, disabled}. kind에 opt가 있으면 선택지(단축키가 앞에)
  const isOpt = (a) => /opt/.test(a.kind || "");
  function btn(a) {
    const cls = ["b", a.pri && "pri", a.kind].filter(Boolean).join(" ");
    const data = `data-act="${a.act}"${a.i !== undefined ? ` data-i="${a.i}"` : ""}${a.pressed !== undefined ? ` aria-pressed="${a.pressed}"` : ""}${a.chip ? ` data-label="${esc(a.label)}"` : ""}${a.disabled ? " disabled" : ""}`;
    const k = a.disabled ? "" : a.key;   // 잠긴 칩에는 단축키를 걸지도 보이지도 않는다
    const tip = k ? ` title="단축키 ${KEYCAP[k] || k.toUpperCase()}"` : "";
    return isOpt(a) ? `<button class="${cls}" ${data}${tip}>${kbd(k)}<span>${esc(a.label)}</span></button>`
      : `<button class="${cls}" ${data}${tip}>${esc(a.label)}${kbd(k)}</button>`;
  }

  // 플로로 — 기분은 [잠깐 짓는 표정(쓰다듬기·축하) > 졸음 > 안내 화면의 표정] 순서. 졸음은 편한 표정일 때만
  let flashMood = { mood: "", until: 0 }, sleepState = "awake";
  const CALM = ["idle", "happy", "done"];
  const liveMood = (base) => (flashMood.until > Date.now() ? flashMood.mood : sleepState !== "awake" && CALM.includes(base) ? sleepState : base);
  // 쓰다듬을 수 있는 플로로 — 누르거나 좌우로 문지르면 된다. data-live는 기분이 바뀌면 같이 바뀌는 플로로
  // 꾸미기(C-22): 입은 것(st.wear)을 플로로 위에 겹친다 — 모자 자리 · 목 자리. 그림(이모지)은 자리표시, 진짜 그림은 고한결
  const deco = () => (QU ? Object.values(st.wear).map(QU.itemOf).filter(Boolean).map((it) => `<span class="deco ${it.slot}" aria-hidden="true">${it.emoji}</span>`).join("") : "");
  const petCat = (mood, size, extra = "") => `<button class="pet" data-act="pet" data-pet data-live data-base="${mood}" aria-label="플로로 쓰다듬기" style="--fs:${size}px"
    title="플로로 쓰다듬기 — 눌러도, 좌우로 문질러도 돼요">${cat(liveMood(mood), size, { extra, hole: true })}${deco()}</button>`;

  // 칸 — 지나온 것과 지금 하는 것까지 밝게, 남은 것은 어둡게
  const mini = () => `<span class="mini" aria-hidden="true">${met().map((_, i) => `<i class="${i < nowAt() ? "on" : ""}"></i>`).join("")}</span>`;
  const stageMeta = () => { const s = stage(); return `<span class="mm-stage">${LB(s.n)} · ${esc(s.title)}</span><span>${allDone() ? `할 일 ${met().length}개 모두 했어요` : progress()}</span>${mini()}`; };
  const flowLine = () => { const s = stage(); return `<span class="flowline"><span>${esc(s.gets)}</span>${I.arrow}<span>${esc(s.does)}</span>${I.arrow}<span>${esc(gv(s))}</span>${
    docDone(s.n) ? `<span class="okchip">${I.check}문서 확정함</span>` : ""}</span>`; };
  const dots = `<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const deskInput = () => `<textarea class="mc-input" data-act="text" rows="3" aria-label="지금 만드는 것"
    placeholder="${PLACEHOLDER}">${esc(st.text)}</textarea>${st.mode === "live" ? `<p class="mc-fine">${SENT}</p>` : ""}`;
  // 연습 버튼('0단계 · 하는 중' 등)은 미리 써 둔 글을 넣는 시연용이라 연습용 예시 모드에서만 보인다. 지금 단계는 카드 위 작은 줄이 알려 준다
  // 바뀐 작업은 직접 써서 보내지 않는다 — AI 코딩 도구에서 작업하면 플로로가 알아채고 묻는다(onEvent → ping). (2026-10-18 임유정 요청:
  // '새로 한 것만 덧붙여 주세요' 칸을 뺐다. 설계도 탭을 없애거나 설계도를 단계 질문에 반영하게 되면 다시 볼 것 — 기획 문서 1번)
  const WORK_NOTE = "AI 코딩 도구에서 작업하면 플로로가 알아채고 어디쯤인지 봐 드릴지 물어요.";
  const exampleActs = () => (st.mode === "live" ? [] : stageExamples()).map((e) => ({ label: e.label, act: "ex", i: S.examples.indexOf(e), kind: "soft" }));

  // 지금 결정할 것 하나 — 위에 있는 상황이 먼저다.
  // 돌려주는 것: {tone, mood, say(플로로의 한마디), meta, title, sub, body, acts, foot} — 글은 이미 esc 한 것
  function momentToday() {
    const s = st.j && stage(), f = face();
    if (st.busy) return { tone: "gray", mood: "look", meta: s && !st.planBusy ? stageMeta() : "", title: `${st.planBusy ? PL_BUSY[st.planBusy] : "살펴보고 있어요"}${dots}`,
      sub: `<span data-wait>${waitText()}</span>`, acts: [], passing: true };   // passing: 기다리는 동안만 보이는 말 — 지난 말로 쌓지 않는다(chatCard)
    if (st.warn) {
      const fix = st.warn.then === "judge";
      return { tone: "amber", mood: "alert", title: "보내기 전에 잠깐!",
        sub: `글 안에 ${esc(st.warn.w.join(", "))}처럼 보이는 게 있어요. 그래도 AI(Claude)에게 보낼까요?`,
        acts: [{ label: fix ? "고칠게요" : "그만둘게요", act: fix ? "edit" : "stop-send", key: "Enter", pri: true }, { label: "괜찮아요, 보낼게요", act: "send-anyway" }] };
    }
    if (st.keyBad && st.mode === "live") return { tone: "red", mood: "think", extra: "oops", meta: s ? stageMeta() : "", title: "API 키가 거절됐어요.", sub: "키가 맞지 않거나 쓸 수 있는 권한이 없어요. 키를 고치기 전까지 연습용 예시로 둘러볼 수 있어요 — 키는 설정의 '처음 설정 다시 하기'에서 다시 넣어요.", acts: [{ label: "연습용 예시로 둘러보기", act: "practice-now", key: "Enter", pri: true }, { label: "닫기", act: "dismiss", key: "Escape", kind: "ghost" }] };   // F-106
    if (st.error) return { tone: "red", mood: "think", extra: "oops", meta: s ? stageMeta() : "", title: "음, 잘 안 됐어요.", sub: esc(st.error),
      acts: [{ label: "글 고쳐서 다시 해 보기", act: "retry-input", key: "Enter", pri: true }, { label: "닫기", act: "dismiss", key: "Escape", kind: "ghost" }] };
    if (st.blocked && !st.blocked.retrying) return momentBlocked();   // F-69 맡긴 일이 허락을 못 받아 막혔다 — 사람이 길을 고른다
    if (stallShown()) return momentStall();   // C-50 맡긴 일이 멈춘 것 같다 — 끄지 않고 사람이 고른다
    if (st.screen === "gate") return momentGate();
    if (st.meal) return feedSortMoment();   // 먹이를 나눠 정리하는 중(C-15)
    if (st.presetPick) return momentPreset();   // 문서 틀 고르기(C-44)
    if (st.linePick && BUILD) return momentLines();   // 6단계 기능 줄 고르기(F-70 ⓒ)
    if (st.runOut) return momentRun();   // 돌려 본 결과(F-70 ⓓ)
    if (planNow()) return momentPlan();   // 준비 계획 · 맡길 일(C-35) — 퀘스트 창에서 '맡길 일'을 고르거나 계획 칩을 누르면
    if (st.restore && FDOCS) return momentRestore();   // C-49 폴더의 기록 — 되살리기 · 다시 읽기 · 근거 없음
    if (st.ship && FDOCS) return momentShip();   // 2단계를 마친 뒤 문서 올리기(C-37)
    if (st.carry && CY) return momentCarry();   // C-48 8단계 — 다음 프로젝트에 가져갈 것
    if (st.carryOffer && CY) return momentCarryOffer();   // C-48 단계에 들어서면 — 지난 프로젝트에서 가져온 것
    if (gateStop()) return momentStop();   // R-10: 보고했는데 '안 됨'이 남았다 — 관문 앞에서 멈춘다
    if (QU && st.quest && st.quest.phase !== "done" && !st.openInput) return momentQuest();   // 퀘스트(C-22): 받기 전 · 한 줄씩 · 완료 보고
    if (st.ping) return { tone: "gray", mood: "look",
      meta: `<span class="mm-stage">${esc(pingHead())}</span>${s ? `<span>${LB(s.n)} · ${progress()}</span>${mini()}` : ""}`,
      title: "바뀐 작업을 보고, 어디쯤인지 알려 드릴까요?",
      sub: st.mode === "live" ? "최근 작업 대화가 AI(Claude)에게 보내져요. 비밀번호나 다른 사람 연락처처럼 보이는 게 있으면 보내기 전에 멈춰요."
        : "연습용 예시라서, 미리 만들어 둔 응답으로 살펴봐요.",
      acts: [{ label: "살펴봐 주세요", act: "look-now", key: "Enter", pri: true }, { label: "보낼 글 먼저 보기", act: "peek-text" }] };
    // 처음(C-22 → C-36, 2026-10-25 이재엽 "원하는 내용을 한줄로 작성해달라고 하지말고 원하는 내용을 플로로에게 받는걸로"): 원하는 것을 받으면 AI가 1단계 초안 → 제목이 주제인 1단계(startDraft).
    //   먹이 주기(파일 · 붙여 넣기)는 칩 · 끌어다 놓기로 그대로
    if (!st.j && !st.openInput && QU) {
      return { tone: "blue", mood: f[0], meta: `<span class="mm-stage">처음 만나요</span>`, title: st.back ? "다시 오셨네요! 원하는 것을 플로로에게 알려 주세요." : "원하는 것을 플로로에게 알려 주세요.",
        sub: "만들고 싶은 것 · 필요한 기능 · 과제 글을 그대로 적거나 붙여 넣어도 돼요. 플로로가 다 읽고 1단계 초안을 만들어 와요.", foot: esc(nowLine()),
        acts: st.mode === "fixture" ? [{ label: "동아리 행사 등록 앱을 만들고 싶어요", act: "idea-example", key: "1", kind: "soft" }, ...(FD ? [{ label: "예시 먹이 주기", act: "feed-example", key: "2", kind: "soft" }] : [])] : [] };
    }
    if (!st.j || st.openInput) {
      const first = !st.j;
      // 처음 카드는 먹이 주기 화면(C-15, 2026-10-20) — 파일 · 붙여 넣기 한곳. '예시 먹이 주기'는 서버 없이 보이는 예시(FR-10). 글을 바로 보내지 않고 나눠 정리한 뒤 확인하면 보낸다
      return { tone: "blue", mood: f[0], say: first ? "" : f[1], meta: first ? `<span class="mm-stage">플로로에게 먹이 주기</span>` : stageMeta(),
        title: first ? "플로로에게 먹이를 주세요." : "보낼 글을 확인해 주세요.",
        sub: first ? "파일을 끌어다 놓거나 글을 붙여 넣으면 플로로가 읽고 나눠 정리해요. 비밀번호 · 개인적인 일 같은 구간은 빼고 보내요." : "AI 코딩 도구에서 가져온 작업이에요. 고칠 곳이 있으면 고친 뒤 보내 주세요.",
        body: deskInput(),
        acts: [...(first && FD && st.mode === "fixture" ? [{ label: "예시 먹이 주기", act: "feed-example", kind: "soft" }] : first ? [] : exampleActs()),
          ...(first && FD ? [{ label: "나눠 정리하기", act: "feed-sort", key: "c-Enter", pri: true }] : [{ label: "어디쯤인지 보기", act: "judge", key: "c-Enter", pri: true }]),
          ...(first ? [] : [{ label: "닫기", act: "close-input", key: "Escape", kind: "ghost" }])] };
    }
    if (st.finished) return { tone: "green", mood: "happy", meta: `<span class="mm-stage">모든 단계를 마쳤어요</span>`,
      title: END.title, sub: END.sub,
      acts: [{ label: END.more, act: END_ACT, key: "Enter", pri: true }, ...(st.mode === "fixture" ? [RESTART] : [])] };
    if (holding()) return { tone: "gray", mood: f[0], say: f[1], meta: stageMeta(), banner: U.holdLine(st.hold, ymd()),
      title: "잠시 멈춰 뒀어요.", sub: HOLD.later,
      acts: [{ label: "다시 이어 하기", act: "hold-resume", key: "Enter", pri: true }] };
    if (allDone()) return { tone: "green", mood: f[0], meta: stageMeta(), title: `${LB(s.n)} 할 일을 모두 했어요!`,
      sub: "다음 단계로 가기 전에, 이번 단계를 이해했는지 한 번만 같이 확인해요.",
      acts: [{ label: "확인하고 넘어가기", act: "gate", key: "Enter", pri: true }] };
    if (st.todos) return { tone: "blue", mood: f[0], say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(todosNow()[0])}`,
      sub: WORK_NOTE,
      body: `<ol class="steps">${todosNow().map((t, i) => `<li class="${[i === 0 && "now", P.isLater(st.todoLater, t) && "later"].filter(Boolean).join(" ")}"><b>${i + 1}</b>${esc(t)}${
        P.isLater(st.todoLater, t) ? `<small>${P.LABEL.later}</small>` : ""}</li>`).join("")}</ol>`,
      acts: [] };
    const n = st.j.next;
    if (!n) return { tone: "blue", mood: f[0], say: f[1], meta: stageMeta(), title: `지금 할 일 · ${esc(tick().now)}`, sub: WORK_NOTE, acts: [] };
    if (st.later) return { tone: "blue", mood: f[0], meta: stageMeta(), title: "나중에 정하기로 했어요.", sub: esc(n.question),
      acts: [{ label: "지금 고르기", act: "again", key: "Enter", pri: true }, { label: "바뀐 작업 보여 주기", act: "open-input" }] };
    // 선택지에 원하는 게 없으면 직접 쓴다 (2026-10-18 임유정 요청: '나중에'는 창을 닫는 것과 같아서 뺐다)
    if (st.own) return { tone: "blue", mood: f[0], meta: stageMeta(), title: esc(n.question), sub: "어떻게 할지 직접 적어 주세요. 한 줄이면 충분해요.",
      body: `<textarea class="mc-input" data-act="own-text" rows="2" aria-label="직접 쓴 답" placeholder="예) ${esc(n.options[0])}">${esc(st.ownText)}</textarea>`,
      acts: [{ label: "이걸로 정할게요", act: "own-decide", key: "c-Enter", pri: true }, { label: "선택지로 돌아가기", act: "own-cancel", key: "Escape", kind: "ghost" }] };
    // 왜 묻는지와 고르면 무엇을 하는지를 한 문단으로 (2026-10-18 임유정 요청: 위아래로 나뉘어 읽기 불편)
    return { tone: "blue", mood: f[0], say: f[1], meta: stageMeta(), title: esc(n.question), sub: esc([n.why, n.action].filter(Boolean).map((x) => (/[.!?…]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`)).join(" ")),
      acts: [...n.options.map((o, i) => ({ label: o, act: "pick-opt", i, key: String(i + 1), kind: "opt" })),
        { label: "직접 쓸게요", act: "own", key: String(n.options.length + 1), kind: "opt" }] };
  }
