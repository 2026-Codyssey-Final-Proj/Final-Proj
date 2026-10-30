  // ── C-52 빼 둘 곳(2026-10-30 — 지식 퀘스트 PRD 9절 10번 "설정 창의 '빼 둘 곳'", 이재엽 버튼 "10/31까지"): 설정 '기록' 탭에 묶음 하나 ──
  //   사람이 한 줄에 하나씩 적은 폴더 · 파일은 Floe가 읽지 않는다 — 서버가 지킨다(03-backend/navigator/exclude.js · GET · POST /api/exclude, API.md 3-34). 화면은 적고 보이기만.
  //   목록은 폴더마다 서버에(이 화면은 기억하지 않는다 — keep 없음). 거절할 줄이 있으면 서버가 아무것도 바꾸지 않고 줄마다 까닭을 돌려준다.
  //   어느 폴더의 목록인지 이름을 보이고, 저장할 때 그 폴더의 열쇠를 같이 보낸다 — 그사이 폴더가 바뀌었으면 서버가 409(moved)로 거절한다(새 맥락 리뷰)
  const EX_TEXT_MAX = 4000, EX_AGAIN_MS = 5000;   // 글 칸 글자 상한 · 고쳐 적는 중이 아닐 때 서버에 다시 묻는 간격(서버 쪽 폴더가 바뀌었는지)
  let exList = null, exText = "", exBad = [], exMsg = "", exBusy = false, exMax = 30;   // 서버에서 받은 목록 · 적는 중인 글 · 거절된 줄 · 알림 · 묻는 중 · 줄 수 상한(서버 값)
  let exSeen = null, exFor = null, exKey = "", exProject = "", exAt = 0, exDirty = false, exBroken = "";   // 화면의 프로젝트 이름 · 서버가 알려 준 폴더(이름 · 열쇠) · 물은 때 · 고쳐 적는 중 · 저장 파일이 깨졌다는 말
  async function exLoad() {
    if (!canLive || exBusy) return;
    exBusy = true; exSeen = project(); exAt = Date.now();
    try {
      const r = await (await fetch("/api/exclude", { cache: "no-store" })).json();
      if (r && r.ok) {
        exList = Array.isArray(r.list) ? r.list : [];
        if (Number.isInteger(r.max)) exMax = r.max;
        const moved = exFor !== null && r.key !== exKey;
        // 같은 폴더면 고쳐 적는 중인 글을 덮지 않는다 — 프로젝트 이름이 늦게 와 다시 물어도 친 글이 사라지지 않게. 폴더가 바뀌었으면 그 폴더의 목록으로(지난 알림도 지운다)
        if (!exDirty || moved) { exText = exList.join("\n"); exDirty = false; exBad = []; }
        if (moved) exMsg = "";
        exFor = r.project || ""; exKey = r.key || ""; exProject = r.project || "";
        exBroken = r.why === "broken" ? r.reason || "빼 둘 곳 파일이 깨졌어요" : "";
        if (r.why === "folder") exMsg = "연결한 폴더를 먼저 골라요 — 폴더마다 따로 적어요";
      } else { if (exList === null) exList = []; exMsg = "목록을 받지 못했어요"; }
    } catch { if (exList === null) exList = []; exMsg = "목록을 받지 못했어요 — 서버가 켜져 있는지 봐 주세요"; }
    exBusy = false; render();
  }
  function excludeGroup() {
    const head = "빼 둘 곳";
    if (!canLive) return sgrp(SG.box, head, `<p class="meta">Floe를 서버로 켰을 때만 고를 수 있어요 — 연습 모드에서는 폴더를 읽지 않아요.</p>`);
    // 처음 · 프로젝트 이름이 바뀌었을 때 · 고쳐 적는 중이 아니면 몇 초마다(서버 쪽 폴더가 바뀌었을 수 있다) — 그동안 글 칸은 그대로 둔다(다시 그리면 초점을 잃는다)
    if (!exBusy && (exSeen !== project() || (!exDirty && Date.now() - exAt > EX_AGAIN_MS))) exLoad();
    if (exList === null) return sgrp(SG.box, head, `<p class="meta">불러오는 중이에요…</p>`);
    const bad = exBad.length ? `<ul class="ex-bad">${exBad.map((b) => `<li><code>${esc(b.line)}</code> — ${esc(b.why)}</li>`).join("")}</ul>` : "";
    const whose = exProject ? `<b>'${esc(exProject)}'</b> 폴더의 목록이에요. ` : "";
    return sgrp(SG.box, head, `<p class="meta">${whose}여기 적은 파일 · 폴더는 <b>Floe가 읽지 않아요</b> — 작업실 파일 칸 · 찾기 · 문서 지도 · README 책에 안 보이고, 계획 · 가져갈 것 초안을 만들 때 AI에 보내지 않고, 문서 올리기에서도 쓰지 않아요.
        점으로 시작하는 것 · 비밀값 파일(.env · *.pem 같은 것) · node_modules는 원래 빼요.</p>
      <p class="meta"><b>막지 못하는 것</b> — 맡긴 일(Claude Code)은 스스로 파일을 읽어요. 그 일이 이 파일을 고치면 AI 진행에는 '빼 둔 곳의 파일'로만 보이고 대화 목록에는 쌓지 않아요.</p>
      ${exBroken ? `<p class="meta" role="alert">${esc(exBroken)}</p>` : ""}
      <textarea class="ex-text" data-act="ex-text" rows="5" maxlength="${EX_TEXT_MAX}" aria-label="빼 둘 곳 — 한 줄에 하나" placeholder="한 줄에 하나 — 예: secrets/ (폴더) · *.env · 회원명단.csv">${esc(exText)}</textarea>
      <div class="row"><span class="grow meta">끝이 /면 폴더 전부, *는 한 칸 안의 아무 글자. ${exMax}줄까지 · 폴더마다 따로</span><button type="button" class="btn" data-act="ex-save">저장</button></div>
      ${bad}${exMsg ? `<p class="meta" aria-live="polite">${esc(exMsg)}</p>` : ""}`);
  }
  const keepBase = SET_PART.keep;
  SET_PART.keep = () => `${keepBase()}${excludeGroup()}`;
  Object.assign(ACT, {
    "ex-save": async () => {
      if (!canLive || exBusy) return;
      exBusy = true;
      let r = null;
      try { r = await (await fetch("/api/exclude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: exText.split("\n"), key: exKey }) })).json(); } catch { r = null; }
      exBusy = false;
      if (r && r.ok) { exList = r.list; exText = exList.join("\n"); exDirty = false; exKey = r.key || exKey; exProject = r.project || exProject; exBad = []; exBroken = ""; exMsg = exList.length ? `저장했어요 — 빼 둔 곳 ${exList.length}줄. 파일 목록을 다시 받아요` : "저장했어요 — 빼 둔 곳이 없어요"; loadFiles(); }
      else if (r && r.why === "moved") { exMsg = r.reason; exDirty = false; exAt = 0; }   // 다른 폴더가 됐다 — 그 폴더의 목록을 다시 받는다(친 글은 그 폴더 것이 아니다)
      else { exBad = (r && Array.isArray(r.bad)) ? r.bad : []; exMsg = (r && r.reason) || "저장하지 못했어요 — 서버가 켜져 있는지 봐 주세요"; }
      render();
    },
  });
