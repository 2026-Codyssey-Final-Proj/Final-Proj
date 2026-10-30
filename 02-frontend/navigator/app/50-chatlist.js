  // ── C-63 왼쪽 대화 목록(2026-10-29, 두승현 PRD 3-2 · 이재엽 승인): 프로젝트 이름 → 단계 바로가기(최근이 위 — 지금 / 그 단계를 이야기한 날) → 맨 아래 '전체 파일'(지금의 폴더 모양, 한 칸 들여서).
  //   바로가기를 누르면 새 대화를 열지 않고 같은 대화의 그 구분선으로 옮겨 잠깐 강조하며, 그 단계가 만든 · 고친 파일('새로' · '고침')을 펼친다. 다시 누르면 접힌다 ──
  const dateOf = (n) => { const m = [...st.chat].reverse().find((x) => x.kind === "stage" && x.n === n); return m && m.at ? new Date(m.at).toLocaleDateString("sv").slice(5).replace("-", "/") : ""; };
  // 그 단계의 파일 — 서버가 쌓은 바뀐 파일(3-32 changes — 훅 알림의 Write · Edit)을 이 단계 구분선과 다음 구분선의 at 사이로 나누고(new → 새로, edit → 고침), 단계 문서(폴더에 있을 때)를 더한다. 두승현 2026-10-28 "둘 다"
  function stageFilesOf(n) {
    const marks = st.chat.filter((m) => m.kind === "stage"), me = [...marks].reverse().find((m) => m.n === n), start = me ? me.at : null, next = me ? marks.find((m) => m.at > me.at && m.n !== n) : null, end = next ? next.at : Infinity;
    const got = {};
    if (start !== null) for (const c of st.chatChanges || []) { if (c.at < start || c.at >= end) continue; got[c.path] = got[c.path] === "새로" ? "새로" : c.how === "new" ? "새로" : "고침"; }
    const out = Object.entries(got).map(([path, tag]) => ({ path, tag }));
    const doc = nowDocPath(n); if (doc && !got[doc] && haveDocs().has(doc)) out.push({ path: doc, tag: "새로" });
    return out.sort((a, b) => a.path.localeCompare(b.path, "en"));
  }
  const fileBtn = (path) => { const i = st.files && st.files.src === "mine" && st.files.list ? st.files.list.findIndex((x) => x.path === path) : -1; return i >= 0 ? `<button type="button" class="fn-file" data-act="fn-open" data-v="${i}">${esc(path.split("/").pop())}</button>` : `<span>${esc(path.split("/").pop())}</span>`; };
  function chatNav() {
    const cur = st.finished ? N.STAGES.length - 1 : atStage();
    const seen = new Set(st.chat.filter((m) => m.kind === "stage").map((m) => m.n)); seen.add(cur); for (const k of Object.keys(st.results)) seen.add(Number(k));
    const stages = [...seen].filter((n) => N.STAGES[n]).sort((a, b) => b - a);
    const rows = stages.map((n) => { const open = st.chatOpen === n, files = stageFilesOf(n);
      return `<li class="cn${n === cur ? " st-now" : ""}"><button type="button" data-act="chat-go" data-v="${n}" aria-expanded="${open}"><i class="chev-w${open ? " on" : ""}">${FN_CHEV}</i><span>${n + 1} · ${esc(N.STAGES[n].short || N.STAGES[n].title)}</span><small>${n === cur ? "지금" : dateOf(n)}</small></button>${
        open ? `<ul class="cn-files">${files.length ? files.map((f) => `<li>${fileBtn(f.path)}<small>${f.tag}</small></li>`).join("") : "<li><span>아직 바뀐 파일이 없어요</span></li>"}</ul>` : ""}</li>`; }).join("");
    return `<p class="fn-h"><b>${fIcon("open")}<span>${esc(project() || "예시 프로젝트")}</span></b></p><ul class="fn cn-list">${rows}</ul><details class="fn-all"${st.fnAll ? " open" : ""}><summary>전체 파일</summary>${fileNav()}</details>`;
  }
  function fileNav() {
    const f = st.files, mine = f && f.src === "mine" && f.list;
    if (!mine) return `<p class="fn-h"><b>${fIcon("open")}<span>${esc(project() || "예시 프로젝트")}</span></b><em title="${esc(f && f.why ? `${f.why} — 폴더를 연결하면 진짜 목록이 와요` : "폴더를 연결하면 진짜 목록이 와요")}">예시</em></p><ul class="fn">${FILES_DUMMY.map(exRow).join("")}</ul><p class="fn-ft">폴더를 연결하면 그 폴더의 진짜 파일 이름이 여기에 와요 — Claude Code가 고친 파일은 캔버스의 파일 카드에</p>`;
    const n = st.finished ? N.STAGES.length - 1 : atStage(), slugs = FDOCS ? FDOCS.SLUGS : [], nowDir = slugs[n] ? `docs/${slugs[n]}/` : "";
    const tagOf = (x) => { if (x.dir) return ""; if (nowDir && x.path.startsWith(nowDir)) return "지금"; const k = slugs.findIndex((s, i) => i < n && x.path.startsWith(`docs/${s}/`)); return k >= 0 && st.results[k] ? "읽음" : ""; };
    const kids = {}, up = [];   // 폴더마다 바로 아래의 수(F-67) — 목록은 깊이 순서라 쌓아 가며 센다
    f.list.forEach((x, i) => { while (up.length && f.list[up[up.length - 1]].depth >= x.depth) up.pop(); if (up.length) kids[up[up.length - 1]] = (kids[up[up.length - 1]] || 0) + 1; if (x.dir) up.push(i); });
    const open = new Set(st.fnOpen); let closedAt = 0;   // 접힌 폴더의 안쪽(더 깊은 것)은 건너뛴다 — 깊이로 본다(경로 글에 기대지 않는다)
    const q = st.fnFind.trim().toLowerCase(), cur = st.openFiles[st.fileSel];   // 찾기(C-43): 글이 있으면 접힘과 상관없이 이름에 그 글이 든 파일만 한 줄로
    const rows = f.list.map((x, i) => {
      if (q) { if (x.dir || !x.path.toLowerCase().includes(q)) return ""; }
      else { if (closedAt && x.depth > closedAt) return ""; closedAt = 0; }
      const isOpen = x.dir && open.has(String(i)); if (x.dir && !isOpen) closedAt = x.depth;
      const tag = tagOf(x), sel = !!cur && cur.path === x.path && st.qtab === "file";
      return `<li class="${x.dir ? "dir" : tag === "지금" ? "st-now" : ""}${sel ? " sel" : ""} ${q ? "d1" : `d${x.depth}`}">${x.dir ? `<button type="button" data-act="fn-dir" data-v="${i}" aria-expanded="${isOpen}"><i class="chev-w${isOpen ? " on" : ""}">${FN_CHEV}</i>${fIcon(isOpen ? "open" : "dir")}<span>${esc(x.name)}</span>${kids[i] ? `<small class="fn-n">${kids[i]}</small>` : ""}</button>` : `<button type="button" class="fn-file" data-act="fn-open" data-v="${i}" aria-current="${sel ? "true" : "false"}"><i class="chev-w"></i>${fIcon(fKind(x.name))}<span>${esc(q ? x.path : x.name)}</span></button>`}${tag ? `<small>${tag}</small>` : ""}</li>`;
    }).join("");
    const ft = f.total ? `${f.total}개 · 깊이 ${f.depth}까지 · 이름만 봐요${f.cut ? " · 더 있어요(200개까지만)" : ""}${f.unread ? ` · 읽지 못한 폴더 ${f.unread}` : ""}${f.excluded ? ` · 빼 둔 곳 ${f.excluded}줄은 보이지 않아요` : ""}${f.exBroken ? " · 빼 둘 곳 파일이 깨졌어요(설정 '기록')" : ""}` : "비어 있어요 — 이 폴더에 보일 파일이 없어요";
    return `<p class="fn-h"><b>${fIcon("open")}<span>${esc(f.project || project() || "")}</span></b></p><input class="fn-find" type="search" data-act="fn-find" value="${esc(st.fnFind)}" placeholder="파일 이름 찾기" aria-label="파일 이름 찾기"><ul class="fn">${rows || (q ? `<li class="d1"><span>'${esc(st.fnFind)}'이 든 파일이 없어요</span></li>` : "")}</ul><p class="fn-ft">${ft}</p>`;
  }
