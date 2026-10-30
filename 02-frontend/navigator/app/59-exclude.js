  // ── C-52 빼 둘 곳(2026-10-30 — 지식 퀘스트 PRD 9절 10번 "설정 창의 '빼 둘 곳'", 이재엽 버튼 "10/31까지"): 설정 '기록' 탭에 묶음 하나 ──
  //   사람이 한 줄에 하나씩 적은 폴더 · 파일은 Floe가 읽지 않는다 — 서버가 지킨다(03-backend/navigator/exclude.js · GET · POST /api/exclude, API.md 3-34). 화면은 적고 보이기만.
  //   목록은 폴더마다 서버에(이 화면은 기억하지 않는다 — keep 없음). 거절할 줄이 있으면 서버가 아무것도 바꾸지 않고 줄마다 까닭을 돌려준다.
  const EX_TEXT_MAX = 4000, E_LINES = 30;   // E_LINES — 서버 exclude.js MAX_LINES와 같다(넘치면 서버가 줄마다 까닭을 준다)
  let exList = null, exText = "", exBad = [], exMsg = "", exBusy = false;   // 서버에서 받은 목록 · 적는 중인 글 · 거절된 줄 · 알림 · 묻는 중
  let exSeen = null, exFor = null, exDirty = false;   // 화면의 프로젝트 이름(바뀌면 다시 묻는다) · 서버가 알려 준 폴더 이름 · 사람이 고쳐 적는 중
  async function exLoad() {
    if (!canLive || exBusy) return;
    exBusy = true; exSeen = project();
    try {
      const r = await (await fetch("/api/exclude", { cache: "no-store" })).json();
      if (r && r.ok) {
        exList = Array.isArray(r.list) ? r.list : [];
        // 같은 폴더면 고쳐 적는 중인 글을 덮지 않는다 — 프로젝트 이름이 늦게 와 다시 물어도 친 글이 사라지지 않게(폴더가 바뀌었으면 그 폴더의 목록으로)
        if (!exDirty || r.project !== exFor) { exText = exList.join("\n"); exDirty = false; exBad = []; }
        exFor = r.project; exMsg = r.why === "folder" ? "연결한 폴더를 먼저 골라요 — 폴더마다 따로 적어요" : exMsg;
      } else { if (exList === null) exList = []; exMsg = "목록을 받지 못했어요"; }
    } catch { if (exList === null) exList = []; exMsg = "목록을 받지 못했어요 — 서버가 켜져 있는지 봐 주세요"; }
    exBusy = false; render();
  }
  function excludeGroup() {
    const head = "빼 둘 곳";
    if (!canLive) return sgrp(SG.box, head, `<p class="meta">Floe를 서버로 켰을 때만 고를 수 있어요 — 연습 모드에서는 폴더를 읽지 않아요.</p>`);
    if (exSeen !== project() && !exBusy) exLoad();   // 처음 · 프로젝트 이름이 바뀌었을 때만 — 그동안 글 칸은 그대로 둔다(다시 그리면 초점을 잃는다)
    if (exList === null) return sgrp(SG.box, head, `<p class="meta">불러오는 중이에요…</p>`);
    const bad = exBad.length ? `<ul class="ex-bad">${exBad.map((b) => `<li><code>${esc(b.line)}</code> — ${esc(b.why)}</li>`).join("")}</ul>` : "";
    return sgrp(SG.box, head, `<p class="meta">여기 적은 파일 · 폴더는 <b>Floe가 읽지 않아요</b> — 작업실 파일 칸 · 찾기 · 문서 지도 · README 책에 안 보이고, 계획 · 가져갈 것 초안을 만들 때 AI에 보내지 않아요.
        점으로 시작하는 것 · 비밀값 파일(.env · *.pem 같은 것) · node_modules는 원래 빼요. 맡긴 일(Claude Code)은 스스로 파일을 읽으니 이 목록이 막지 않아요.</p>
      <textarea class="ex-text" data-act="ex-text" rows="5" maxlength="${EX_TEXT_MAX}" aria-label="빼 둘 곳 — 한 줄에 하나" placeholder="한 줄에 하나 — 예: secrets/ (폴더) · *.env · 회원명단.csv">${esc(exText)}</textarea>
      <div class="row"><span class="grow meta">끝이 /면 폴더 전부, *는 아무 글자. ${E_LINES}줄까지 · 폴더마다 따로</span><button type="button" class="btn" data-act="ex-save">저장</button></div>
      ${bad}${exMsg ? `<p class="meta" aria-live="polite">${esc(exMsg)}</p>` : ""}`);
  }
  const keepBase = SET_PART.keep;
  SET_PART.keep = () => `${keepBase()}${excludeGroup()}`;
  Object.assign(ACT, {
    "ex-save": async () => {
      if (!canLive || exBusy) return;
      exBusy = true;
      let r = null;
      try { r = await (await fetch("/api/exclude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: exText.split("\n") }) })).json(); } catch { r = null; }
      exBusy = false;
      if (r && r.ok) { exList = r.list; exText = exList.join("\n"); exDirty = false; exFor = r.project; exBad = []; exMsg = exList.length ? `저장했어요 — 빼 둔 곳 ${exList.length}줄. 파일 목록을 다시 받아요` : "저장했어요 — 빼 둔 곳이 없어요"; loadFiles(); }
      else { exBad = (r && Array.isArray(r.bad)) ? r.bad : []; exMsg = (r && r.reason) || "저장하지 못했어요 — 서버가 켜져 있는지 봐 주세요"; }
      render();
    },
  });
