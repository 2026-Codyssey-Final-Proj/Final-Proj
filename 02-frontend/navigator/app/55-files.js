  // ── 파일 보기 · 고치기(C-43, 2026-10-27 이재엽 "orca를 인용해서 코드나 md 파일을 확인" · 버튼 "읽기 + 고치기" · "바로 저장 + 되돌리기" · "저장마다 커밋 맡기기" · "512KB · 내용으로 판단") ──
  //   파일 칸에서 누르면 서버가 목록의 번호로 연다(GET /api/file?i — API.md 3-26, 경로를 보내지 않는다). md는 보기 좋게(md-view.js) · 원문으로, 코드 · 글은 줄 번호와 함께, git과 다른 줄은 표시.
  //   고치기 → 글 칸, 저장(단추 · ⌘/Ctrl+S)은 바로 쓰고 그 파일만 커밋 · 푸시를 Claude Code에 맡긴다(허락 카드는 채팅에). 비밀값 모양 · 연 뒤에 바뀜 · 맡긴 일이 도는 중이면 서버가 멈추고(409) 여기서 묻는다.
  //   저장 이력은 이 켜짐 동안 열린 파일마다 20번까지(되돌리기) — 이 컴퓨터에만. 열린 파일 탭 · 이름 찾기. 서버 없이 · 연습 모드는 예시 목록이라 열지 못한다
  keep(["linesDone", "codeless"]);   // F-70 — 맡긴 기능 줄 · 6단계 '코드 없이'(A-04)
  keep(["pushedAt"]);   // F-157-4 — 문서 올리기가 푸시까지 끝난 날(8단계 저장소에 올리기 칸)
  const MDV = window.FloeMd || null, FHIST_MAX = 20;
  const fileTabs = () => st.openFiles.map((f, k) => `<span class="ftab${f.dirty ? " dirty" : ""}"><button type="button" role="tab" data-act="ftab" data-v="${k}" aria-selected="${st.qtab === "file" && st.fileSel === k}" title="${esc(f.path)}">${esc(f.name)}${f.dirty ? " •" : ""}</button><button type="button" class="ftab-x" data-act="fclose" data-v="${k}" aria-label="${esc(f.name)} 닫기" title="닫기">×</button></span>`).join("");
  async function openFile(i) {
    const n = Number(i), x = st.files && st.files.list && st.files.list[n]; if (!x || x.dir) return;
    const k = st.openFiles.findIndex((f) => f.path === x.path);
    if (k >= 0) { st.fileSel = k; st.qtab = "file"; return render(); }
    try {
      const r = await (await fetch(`/api/file?i=${n}`, { cache: "no-store" })).json();
      if (!r || !r.ok) return say(`'${x.name}'은 열지 않았어요 — ${(r && r.reason) || "서버가 답하지 않았어요"}`);
      const again = st.openFiles.findIndex((f) => f.path === r.path);   // 기다리는 동안 같은 파일이 열렸으면(빠른 두 번 누름) 그 탭으로 — 탭 둘이면 한쪽 저장 뒤 다른 쪽 409(F-103-6)
      if (again >= 0) { st.fileSel = again; st.qtab = "file"; return render(); }
      if (st.openFiles.length >= 12) return say("연 파일이 12개예요 — 하나를 닫고 열어요");   // 저장 이력(20번 × 512KB)이 파일 수만큼 늘지 않게(새 맥락 리뷰)
      const text = r.text.replace(/\r\n/g, "\n");   // 글 칸은 LF — 저장할 때 eol로 되돌린다(CRLF 파일이 LF로 바뀌지 않게)
      st.openFiles.push({ i: n, path: r.path, name: r.name, kind: r.kind, eol: r.eol || "lf", text, saved: text, mtime: r.mtime, changed: r.changed, dirty: false, edit: false, raw: false, hist: [], note: null });
      st.fileSel = st.openFiles.length - 1; st.qtab = "file"; render();
    } catch { say("서버에 닿지 않았어요"); }
  }
  async function reloadFile(k) {
    const f = st.openFiles[k]; if (!f || f.i < 0) return;
    try { const r = await (await fetch(`/api/file?i=${f.i}`, { cache: "no-store" })).json(); if (r && r.ok) { const text = r.text.replace(/\r\n/g, "\n"); Object.assign(f, { text, saved: text, mtime: r.mtime, changed: r.changed, eol: r.eol || "lf", dirty: false, note: null }); } else f.note = { kind: "bad", text: (r && r.reason) || "다시 열지 못했어요" }; }
    catch { f.note = { kind: "bad", text: "서버에 닿지 않았어요" }; }
    render();
  }
  async function saveFile(k, opt = {}) {
    const f = st.openFiles[k]; if (!f || f.saving || (!f.dirty && !opt.overwrite)) return;   // 고친 것이 없으면 쓰지도 커밋을 맡기지도 않는다(새 맥락 리뷰). 저장 중이면 또 보내지 않는다(⌘S 두 번 → 409, F-103-3)
    if (f.i < 0) { f.note = { kind: "bad", text: "이 파일이 목록에서 사라졌어요 — 작업실을 다시 열어요" }; return render(); }
    const sent = f.text; f.saving = true;   // 보낸 글 — 저장하는 동안 더 친 글은 저장된 것으로 치지 않는다(F-103-3)
    try {
      const res = await fetch("/api/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ i: f.i, path: f.path, text: sent, mtime: f.mtime, eol: f.eol, commit: true, ...opt }) });
      const r = await res.json();
      if (r && r.ok) {
        if (f.saved !== sent) { f.hist.push({ at: Date.now(), text: f.saved }); if (f.hist.length > FHIST_MAX) f.hist.shift(); }
        Object.assign(f, { saved: sent, mtime: r.mtime, dirty: f.text !== sent, note: { kind: "ok", text: r.task ? "저장했어요 — 이 파일의 커밋 · 푸시를 Claude Code에 맡겼어요(허락 카드는 채팅에)" : `저장했어요${r.note ? ` — ${r.note}` : ""}` } });
        if (r.task) watchTask(r.task, "commit");
        render(); reloadChanged(k); return;
      }
      const why = r && r.why;
      if (why === "sensitive") f.note = { kind: "ask", text: `${(r.labels || []).join(" · ")} 모양이 있어요 — 그대로 저장할까요?`, acts: [["그대로 저장", "fsave-force"], ["고칠게요", "fnote-x"]] };
      else if (why === "changed") f.note = { kind: "ask", text: "연 뒤에 이 파일이 바뀌었어요(Claude Code가 고치는 중일 수 있어요)", acts: [["다시 열기", "freload"], ["덮어쓰기", "fsave-over"]] };
      else if (why === "busy") f.note = { kind: "ask", text: "맡긴 일이 아직 돌고 있어요 — Claude Code가 같은 파일을 고치는 중일 수 있어요", acts: [["그래도 저장", "fsave-busy"], ["기다릴게요", "fnote-x"]] };
      else if (why === "moved") { f.i = -1; f.note = { kind: "bad", text: (r && r.reason) || "목록이 바뀌었어요 — 파일을 다시 열어요" }; }
      else f.note = { kind: "bad", text: (r && r.reason) || "저장하지 못했어요" };
    } catch { f.note = { kind: "bad", text: "서버에 닿지 않았어요" }; }
    finally { f.saving = false; }
    render();
  }
  async function reloadChanged(k) { const f = st.openFiles[k]; if (!f || f.i < 0) return; try { const r = await (await fetch(`/api/file?i=${f.i}`, { cache: "no-store" })).json(); if (r && r.ok) { f.changed = r.changed; render(); } } catch {} }   // 저장 뒤 바뀐 줄 표시를 다시
  const changedSet = (f) => { if (f.changed === "new") return null; const s = new Set(); for (const [a, n] of f.changed || []) for (let j = 0; j < n; j++) s.add(a + j); return s; };
  function filePane() {
    const k = st.fileSel, f = st.openFiles[k];
    if (!f) return `<div class="qempty"><b>연 파일이 없어요</b>왼쪽 파일 칸에서 파일을 누르면 여기에 열려요.</div>`;
    const chg = changedSet(f), nChg = f.changed === "new" ? "새 파일" : chg && chg.size ? `바뀐 줄 ${chg.size}` : "";
    const note = f.note ? `<div class="fv-note ${f.note.kind}" role="status" aria-live="polite"><span>${esc(f.note.text)}</span>${(f.note.acts || []).map(([l, a]) => `<button type="button" class="lnk" data-act="${a}" data-v="${k}">${l}</button>`).join("")}${f.note.kind !== "ask" ? `<button type="button" class="lnk" data-act="fnote-x" data-v="${k}" aria-label="알림 닫기">×</button>` : ""}</div>` : "";
    const head = `<div class="fv-h"><b title="${esc(f.path)}">${esc(f.path)}</b><small>${{ md: "글(md)", code: "코드", text: "글" }[f.kind] || "글"}${nChg ? ` · ${nChg}` : ""}${f.hist.length ? ` · 저장 ${f.hist.length}번` : ""}</small><span class="grow"></span>
      ${f.kind === "md" && !f.edit ? `<button type="button" class="lnk" data-act="fraw" data-v="${k}" aria-pressed="${f.raw}">${f.raw ? "보기 좋게" : "원문"}</button>` : ""}
      <button type="button" class="lnk" data-act="fedit" data-v="${k}" aria-pressed="${f.edit}">${f.edit ? "보기" : "고치기"}</button>
      ${f.hist.length ? `<button type="button" class="lnk" data-act="fundo" data-v="${k}" title="마지막으로 저장하기 전 글로">되돌리기</button>` : ""}
      ${PR && canLive && st.mode !== "fixture" ? presetOpts(k) : ""}
      <button type="button" class="b pri sm" data-act="fsave" data-v="${k}" ${f.dirty ? "" : "disabled"} title="⌘/Ctrl+S">저장</button></div>`;
    // C-53 문서 도구 줄(목업 ②): 서식(제목 · 굵게 · 목록 · 넣기 · 머리말 — 고치는 중에만, 원문에 기호를 넣는다 md-view.js format) · 글 크기 · 목차(오른쪽 칸) · 찾기(그 글이 든 줄 표시 — 원문 · 코드 보기에서)
    const FMT = [["h2", "제목", "이 줄을 ## 제목으로"], ["bold", "굵게", "고른 글을 **로"], ["list", "목록", "고른 줄마다 '- '"], ["link", "넣기", "[글](주소)"], ["front", "머리말", "맨 위에 title · date"]];
    const tools = `<div class="fv-tools" role="toolbar" aria-label="문서 도구">${f.edit && f.kind !== "code" ? FMT.map(([id, l, tip]) => `<button type="button" data-act="ffmt" data-fmt="${id}" data-v="${k}" title="${tip}">${l}</button>`).join("") : ""}
      <span class="fv-sz"><button type="button" data-act="fsize" data-v="-" data-i="${k}" aria-label="글 작게">−</button><span>${Math.round((f.zoom || 1) * 100)}%</span><button type="button" data-act="fsize" data-v="+" data-i="${k}" aria-label="글 크게">+</button></span>
      <button type="button" data-act="ftoc" data-v="${k}" aria-pressed="${sideOn()}" title="오른쪽 칸의 목차">목차</button>
      <input class="fv-find" type="search" data-act="ffind" data-v="${k}" value="${esc(f.find || "")}" placeholder="이 문서에서 찾기" aria-label="이 문서에서 찾기"></div>`;
    const q = (f.find || "").trim().toLowerCase(), hit = (l) => !!q && l.toLowerCase().includes(q);
    let body;
    if (f.edit) body = `<textarea class="fv-edit" data-act="ftext" data-v="${k}" spellcheck="false" aria-label="${esc(f.name)} 고치기">${esc(f.text)}</textarea>`;
    else if (f.kind === "md" && !f.raw && MDV) body = `<div class="fv-md mdv">${MDV.toHtml(f.text)}</div>`;
    else body = `<pre class="fv-code"><ol>${f.text.replace(/\n$/, "").split("\n").map((l, j) => { const cls = [chg === null || (chg && chg.has(j + 1)) ? "chg" : "", hit(l) ? "hit" : ""].filter(Boolean).join(" "); return `<li${cls ? ` class="${cls}"` : ""}${f.go && f.go.seq === tocGo && f.go.line === j + 1 ? ` data-go="${f.go.seq}"` : ""}><span>${esc(l) || " "}</span></li>`; }).join("")}</ol></pre>`;
    // 상태 줄(C-53): 저장 수 · Claude Code가 바꾼 줄(git과 다른 줄) / 내가 바꾼 줄(저장한 글과 다른 줄 — 색으로 나눔) · 줄 수 · 줄 위치 · 줄 끝
    const mineChg = (() => { if (!f.dirty) return 0; const A = f.saved.split("\n"), B = f.text.split("\n"); let p = 0; while (p < A.length && p < B.length && A[p] === B[p]) p++; let q = 0; while (q < A.length - p && q < B.length - p && A[A.length - 1 - q] === B[B.length - 1 - q]) q++; return Math.max(A.length, B.length) - p - q; })();   // 앞뒤 공통 줄을 뺀 나머지 — 맨 위에 한 줄 넣어도 전체가 '바꾼 줄'이 되지 않게(새 맥락 리뷰)
    const stl = `<div class="fv-st" aria-label="문서 상태">${f.hist.length ? `<span>저장 ${f.hist.length}번</span>` : ""}${f.changed === "new" ? `<span class="st-ai">새 파일</span>` : chg && chg.size ? `<span class="st-ai">Claude Code가 바꾼 줄 ${chg.size}</span>` : ""}${mineChg ? `<span class="st-me">내가 바꾼 줄 ${mineChg}</span>` : ""}<span class="grow"></span><span>${f.text.split("\n").length}줄<span data-pos>${f.edit && caretLine ? ` · 줄 ${caretLine}` : ""}</span></span><span>UTF-8</span><span>${f.eol === "crlf" ? "CRLF" : "LF"}</span></div>`;
    return `<div class="fv" data-f="${esc(f.path)}" style="--fz:${f.zoom || 1}">${head}${tools}${note}${body}${stl}</div>`;
  }
  // ── 문서 지도(C-45, 2026-10-27 이재엽 "아치보드로 문서들이 이어지고 확인" · 버튼 "작업실의 새 탭" · "앱에 한 벌 넣기"): docmap.html을 iframe으로 — 서버 GET /api/docmap(API.md 3-27)이 보드 데이터를, 엔진은 앱 안의 archi-board v1 사본.
  //   상자의 '파일 보기에서 열기'는 postMessage → win.js · 아래 message 듣기 → ACT map-open(경로로 목록의 번호를 찾아 파일 보기로). 서버 없이 · 연습 모드는 지도가 없다(까닭을 쓴다)
  const nowDocPath = (n) => { const slug = FDOCS ? FDOCS.SLUGS[n] : ""; return slug ? `docs/${slug}/${slug.slice(3)}.md` : ""; };
  function mapPane(n) {
    if (!canLive || st.mode === "fixture") return `<div class="qempty"><b>문서 지도는 폴더를 연결한 앱에서 보여요</b>${canLive ? "연습 모드예요 — 진짜 폴더를 연결하면 문서가 이어진 모습이 여기에 와요." : "서버 없이 열었어요 — 앱으로 열면 보여요."}</div>`;
    return `<iframe class="docmap" src="/navigator/docmap.html#now=${encodeURIComponent(nowDocPath(n))}" title="문서 지도 — 상자를 누르면 오른쪽에 설명, '파일 보기에서 열기'로 열어요"></iframe>`;   // 지금 장 문서는 주소 끝(#)으로 — 서버의 화면 파일 찾기는 정확한 경로만(물음표 뒤가 있으면 404)
  }
  // ── 문서 고치기 맡기기 틀(C-44, 2026-10-27 이재엽 "md파일을 수정하거나 다른 문서들을 수정하기 위한 프리셋들" · 버튼 "Floe의 맡기기 틀" · "지금 자리에 더한다"): 틀은 presets.js 한 파일(사람이 더하고 고친다).
  //   연 파일의 머리 '틀로 맡기기'(고르면 바로) · 채팅의 '문서 틀' 칩(지금 장 문서, 카드에서 고름) → Claude Code에 맡긴다(/api/task/start + 틀의 끝 조건 — 허락은 섬, 끝에 기준마다 보고 C-32). 보고가 오면 열린 파일의 바뀐 줄을 다시 읽는다
  const PR = window.FloePresets || null;
  const BUILD = window.FloeBuild || null;   // F-70 코드 맡기기 — 뼈대 · 기능 줄 · 돌려 보기의 글과 끝 조건(build.js)
  const presetOpts = (k) => `<select class="fpreset" data-act="preset-pick" data-v="${k}" aria-label="틀로 맡기기"><option value="">틀로 맡기기…</option>${(PR ? PR.PRESETS : []).map((p) => `<option value="${p.id}" title="${esc(p.what)}">${esc(p.name)}</option>`).join("")}</select>`;
  // target: { i }(연 파일 — 목록 번호) 또는 { path }(지금 장 문서 — docs/ 안 이름). 글 · 끝 조건은 서버가 presets.js로 만든다(API.md 3-28 — 화면은 가린 경로를 보내지 않는다)
  async function presetGo(id, target) {
    const p = PR && PR.byId(id); if (!p || !target) return;
    if (!canLive || st.mode === "fixture") return say("연습 모드라 맡기지 않아요 — 진짜 폴더를 연결한 앱에서 돼요");
    const n = st.finished ? N.STAGES.length - 1 : atStage(), shown = target.path || (st.openFiles.find((f) => f.i === target.i) || {}).path || "";
    st.presetPick = null; render();
    try {
      const r = await (await fetch("/api/preset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, preset: p.id, stage: `${LB(n)} · ${N.STAGES[n].title}` }) })).json();
      if (r && r.ok) { st.presetTask = { path: shown, name: p.name, at: Date.now() }; watchTask(r.task, "preset"); say(`'${p.name}' 틀로 ${shown}를 Claude Code에 맡겼어요 — 허락 카드가 뜨면 허용해 주세요. 끝나면 보고가 와요.`); }
      else say(`맡기지 못했어요 — ${(r && r.reason) || "서버가 답하지 않았어요"}`);
    } catch { say("서버에 닿지 않았어요"); }
  }
  // ── F-70 코드 맡기기(2026-10-28 — 이재엽 "결과물이 안나오는 문제 해결", 결정 모음 A-02 · A-04 · A-05): 5단계 뼈대 · 6단계 기능 줄마다 · 6 · 7단계 돌려 보기 ──
  //   글과 끝 조건은 build.js가 단계 결과로 짓고, 맡기기는 같은 길(/api/task/start — 허락은 섬, 끝에 기준마다 보고). 끝나면 파일 칸을 다시 읽고(코드 수 · 결과 파일), 보고를 채팅에.
  //   맡긴 일은 F-69 지켜보기(watchTask)가 맡는다 — 막히면 막힘 카드. 연습 · 서버 없이는 맡기지 않는다(FR-10)
  // 6단계 Ⅰ('확인 방법을 먼저 정하고 만들기')에 사람이 적은 줄 — 지금 퀘스트, 없으면 6단계 결과에서(ⓒ 끝 조건으로)
  const CHECK_FIRST = "확인 방법을 먼저 정하고 만들기";
  const checksNote = () => { const q = st.quest && st.quest.chap === 5 ? st.quest : null, k = q ? q.objs.findIndex((o) => o.name === CHECK_FIRST) : -1;
    if (k >= 0) return [...(q.lines[k] || [])]; const r = st.results[5], it = r && r.items ? r.items.find((x) => x.name === CHECK_FIRST) : null; return it ? [...it.lines] : []; };
  const nowStage = () => (st.quest && st.quest.phase !== "done" ? st.quest.chap : st.finished ? N.STAGES.length - 1 : atStage());
  // 5단계 '뼈대 코드 맡기기' · 6단계 '기능 줄 맡기기' · 6 · 7단계 '돌려 보기'(A-02 — 퀘스트 안의 버튼). 진짜 폴더 · 진짜 AI 모드에서만
  const buildActs = (n) => (!BUILD || !canLive || st.mode === "fixture" ? [] : [...(n === 4 ? [{ label: "뼈대 코드 맡기기", act: "build-skeleton", kind: "soft" }] : []),
    ...(n === 5 ? [{ label: "기능 줄 맡기기", act: "line-open", kind: "soft" }] : []), ...(n === 5 || n === 6 ? [{ label: "돌려 보기", act: "run-go", kind: "ghost" }] : [])]);
  const BUILD_SAID = { build: "뼈대 코드를 Claude Code에 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요", code: "실행할 수 있는 코드를 Claude Code에 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요",
    line: "이 기능 줄을 Claude Code에 맡겼어요 — 허락 카드가 뜨면 '허용'을 눌러 주세요", run: "돌려 보기를 Claude Code에 맡겼어요 — 명령 허락 카드가 뜨면 '허용'을 눌러 주세요" };
  async function buildGo(kind, job, extra = {}) {
    if (!BUILD || !job) return;
    if (!canLive || st.mode === "fixture") return say("연습 모드라 맡기지 않아요 — 진짜 폴더를 연결한 앱에서 돼요");
    if (tw && !(st.blocked && st.blocked.at === tw.at)) return say("맡긴 일이 아직 돌고 있어요 — 끝난 뒤에 맡겨요");   // 막혀 있는 일은 새로 맡기면 끝맺는다(watchTask)
    const w = sensitive(job.text); if (w.length) { say(`보낼 글에 ${w.join(", ")}처럼 보이는 게 있어 맡기지 않았어요`); return fixSecretPast(secretPast(job.text) || secretPast(null)) || say("그 칸을 고친 뒤 다시 눌러요"); }   // F-161-1 — 지난 칸이면 채팅에서 바로 고친다
    if (st.busy) return;   // 앞 호출의 '무엇을 기다리나'를 지우지 않게(F-103-5)
    st.planBusy = "hand";
    const r = await callAI("/api/task/start", { text: job.text, checks: job.checks });
    st.planBusy = "";
    if (!r.ok) { render(); return say(r.reason || "맡기지 못했어요"); }
    st.build = { kind, ...extra }; st.linePick = false; watchTask(r.task, kind); render(); say(BUILD_SAID[kind]);
  }
  // 끝나면 — 파일 칸을 다시 읽고(코드 파일 수가 바뀌면 6단계 '코드 물음'도 풀린다) 보고를 채팅에. 기능 줄은 보고가 다 '해냄'이면 그 줄에 표시
  async function buildEnd(t) {
    const b = st.build; st.build = null;
    await loadFiles();
    if (t.state !== "done") return say("맡긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요");
    const r = t.report;
    if (b && b.kind === "line" && r && r.total && r.done === r.total) { st.linesDone = [...new Set([...(st.linesDone || []), b.line])]; save(); }
    if (r) logMsg("sys", `Claude Code가 보고를 보냈어요 — 끝 조건 ${r.done}/${r.total}${t.verdict ? ` · 세어 보니 ${t.verdict.word}` : ""}${repChecks(r)}`);
    peek(); say(r ? (r.easy.length > N.SAY_MAX ? `${r.easy.slice(0, N.SAY_MAX - 1)}…` : r.easy) : "Claude Code가 일을 마쳤어요 — 파일 칸에서 바뀐 파일을 봐요");
  }
  // 돌려 본 뒤 — 보고 근거에 나온 결과 파일(파일 목록에 있는 것만)을 열 수 있게
  async function runEnd(t) {
    st.build = null;
    await loadFiles();
    if (t.state !== "done") return say("돌려 보기가 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요");
    const r = t.report, list = st.files && st.files.src === "mine" ? st.files.list : [];
    st.runOut = { report: r, files: BUILD.resultFiles(r, list) };
    peek(); render();
  }
  function momentLines() {
    const lines = BUILD.features(st.results), done = st.linesDone || [], meta = `<span class="mm-stage">${LB(5)} · 기능 줄 맡기기</span>`;
    if (!lines.length) return { tone: "amber", mood: "think", meta, title: `${LB(2)} 기능 줄이 아직 없어요.`,
      sub: `${LB(2)} '꼭 필요한 기능 정리하기'에 '~하면, 앱은 ~한다' 줄을 적으면 줄마다 맡길 수 있어요.`, acts: [{ label: "닫기", act: "line-x", key: "Escape", kind: "ghost" }] };
    return { tone: "blue", mood: "look", meta, title: "어느 기능을 Claude Code에 맡길까요?",
      sub: "한 줄씩 맡겨요 — Claude Code가 그 줄의 확인 방법을 먼저 적고 만든 뒤 끝 조건마다 보고해요. 허락이 필요하면 여기 채팅에 카드가 떠요.",
      body: `<ol class="lines-pick" aria-label="${LB(2)} 기능 줄">${lines.map((l, i) => { const y = done.includes(l); return `<li class="${y ? "y" : ""}"><span>${esc(l)}</span>${y ? `<small>${OK_ICON} 보고 옴</small>` : ""}<button type="button" class="b${y ? " ghost" : ""}" data-act="line-go" data-i="${i}">${y ? "다시 맡기기" : "이 줄 맡기기"}</button></li>`; }).join("")}</ol>`,
      acts: [{ label: "닫기", act: "line-x", key: "Escape", kind: "ghost" }] };
  }
  function momentRun() {
    const o = st.runOut, r = o.report, meta = `<span class="mm-stage">돌려 보기</span>`;
    const ok = !!(r && r.items[1] && r.items[1].done);
    return { tone: ok ? "green" : "amber", mood: ok ? "happy" : "think", meta, title: ok ? "돌려 봤어요 — 결과가 나왔어요." : "돌려 봤는데 결과를 못 봤어요.",
      sub: r ? esc(r.easy) : "보고를 받지 못했어요 — 진행 보기에서 봐 주세요.",
      body: `${r ? repChecks(r) : ""}${o.files.length ? `<ul class="run-out" aria-label="결과 파일">${o.files.map((f, k) => `<li><code>${esc(f.path)}</code><button type="button" class="b" data-act="result-open" data-i="${k}">열기</button></li>`).join("")}</ul>` : ""}`,
      acts: [...(o.files.length ? [{ label: "결과 파일 열기", act: "result-open", i: 0, key: "Enter", pri: true }] : []), { label: "다시 돌려 보기", act: "run-go" }, { label: "확인했어요", act: "run-done", kind: "ghost" }] };
  }
  // 틀로 맡긴 일이 끝났다 — 열린 파일의 바뀐 줄을 다시 읽고 보고 한 줄(C-44, 전에는 계획 줄을 지켜볼 때만 다시 읽었다 — F-69에서 한 지켜보기로)
  function presetEnd(t) {
    const pt = st.presetTask; st.presetTask = null; if (!pt) return;
    const k = st.openFiles.findIndex((f) => f.path === pt.path), f = st.openFiles[k];
    if (f && f.dirty) f.note = { kind: "ask", text: "맡긴 일이 이 파일을 고쳤을 수 있어요 — 저장하지 않은 고친 것이 있어 다시 읽지 않았어요", acts: [["다시 열기(고친 것 버림)", "freload"], ["그냥 둘게요", "fnote-x"]] };   // 말없이 덮지 않는다(F-121)
    else if (f) reloadFile(k);
    say(t.state !== "done" ? `'${pt.name}' 틀로 맡긴 일이 끝까지 가지 못했어요 — 진행 보기에서 까닭을 봐 주세요` : t.report ? (t.report.easy.length > N.SAY_MAX ? `${t.report.easy.slice(0, N.SAY_MAX - 1)}…` : t.report.easy) : `'${pt.name}' 틀로 맡긴 일을 마쳤어요`);
  }
  function momentPreset() {
    const pk = st.presetPick, n = st.finished ? N.STAGES.length - 1 : atStage();
    return { tone: "blue", mood: "think", meta: `<span class="mm-stage">${LB(n)} · 문서 틀</span>`, title: `어느 틀로 맡길까요? — ${esc(pk.path)}`,
      sub: "틀을 고르면 플로로가 지시를 적어 Claude Code에 맡겨요. 허락이 필요하면 여기 채팅에 카드가 떠요. 틀은 Floe의 틀 파일에서 더하고 고칠 수 있어요.",
      acts: [...(PR ? PR.PRESETS : []).map((p) => ({ label: p.name, act: "preset-go", kind: "opt", i: p.id })), { label: "그만둘게요", act: "preset-x", key: "Escape", kind: "ghost" }] };
  }
  const BROWSER_WIN = [920, 640];   // 브라우저 판(섬 옆)의 크기 — 앱의 창 크기는 main.js(R-1)
  const FULL_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5"/></svg>';
  // 이 조각의 누르기 — 00-base의 누르기 표(ACT)에 더한다. 공통 누르기는 90-acts.js(2026-10-29 나누기 2차)
  Object.assign(ACT, {
    // F-70 코드 맡기기 — 5단계 뼈대 · 6단계 기능 줄(고르기 · 맡기기 · 닫기) · 돌려 보기 · 결과 파일 열기 · 6단계 코드 물음(A-04 예 · 아니요)
    "build-skeleton": () => buildGo("build", BUILD && BUILD.skeletonTask({ results: st.results, topic: st.topic })),
    "line-open": () => { st.linePick = true; render(); },
    "line-x": () => { st.linePick = false; render(); },
    "line-go": (i) => { const l = BUILD ? BUILD.features(st.results)[i] : ""; if (l) buildGo("line", BUILD.lineTask({ line: l, results: st.results, checksNote: checksNote() }), { line: l }); },
    "run-go": () => { st.runOut = null; buildGo("run", BUILD && BUILD.runTask()); },
    "run-done": () => { st.runOut = null; render(); },
    "result-open": (k) => { const f = st.runOut && st.runOut.files[k || 0]; if (!f) return; const i = st.files && st.files.list ? st.files.list.findIndex((x) => !x.dir && x.path === f.path) : -1; if (i < 0) return say("파일 목록에서 그 파일을 못 찾았어요 — 작업실을 다시 열어요"); openQwin("quest"); openFile(i); },
    "code-yes": () => buildGo("code", BUILD && BUILD.skeletonTask({ results: st.results, topic: st.topic, why: "code" })),
    "code-no": () => { st.codeless = { at: ymd() }; save(); if (st.quest) st.quest = applyStates(st.quest); render(); say("코드 없이 이 단계를 해요 — 결정 기록에 '코드 없이 지남'으로 남겨요"); },
    // 문서 지도(C-45) · 맡기기 틀(C-44)
    "map-open": (i, el) => { const p = el && el.dataset.v; if (!p || !st.files || !st.files.list) return; const k = st.files.list.findIndex((x) => !x.dir && (x.path === p || (window.NavSensitive && window.NavSensitive.redact(p) === x.path))); if (k >= 0) openFile(k); else say(`'${p}'은 파일 목록에 없어요 — 깊이 3 · 200개 안의 글 파일만 열어요`); },
    "preset-open": () => { const n = st.finished ? N.STAGES.length - 1 : atStage(); st.presetPick = { path: nowDocPath(n) }; render(); },
    "preset-x": () => { st.presetPick = null; render(); },
    "preset-go": (i, el) => { const id = el && el.dataset.i; if (st.presetPick) presetGo(id, { path: st.presetPick.path }); },
    "preset-pick": () => {},
    // 파일 보기 · 고치기(C-43)
    "fn-open": (i, el) => { if (el && el.dataset.v !== undefined) openFile(el.dataset.v); },
    ftab: (i, el) => { const k = Number(el && el.dataset.v); if (st.openFiles[k]) { st.fileSel = k; st.qtab = "file"; render(); } },
    fclose: (i, el) => { const k = Number(el && el.dataset.v), f = st.openFiles[k]; if (!f) return; if (f.dirty && !f.closing) { f.closing = true; f.note = { kind: "ask", text: "고친 것을 저장하지 않았어요 — 한 번 더 닫기를 누르면 버려요", acts: [["저장", "fsave"], ["그냥 둘게요", "fnote-x"]] }; st.fileSel = k; st.qtab = "file"; return render(); } st.openFiles.splice(k, 1); if (k < st.fileSel) st.fileSel--; if (st.fileSel >= st.openFiles.length) st.fileSel = st.openFiles.length - 1; if (st.fileSel < 0) st.qtab = "quest"; render(); },
    fedit: (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (f) { f.edit = !f.edit; render(); } },
    fraw: (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (f) { f.raw = !f.raw; render(); } },
    fsave: (i, el) => { const k = el && el.dataset.v !== undefined ? Number(el.dataset.v) : st.fileSel; const f = st.openFiles[k]; if (f) { f.closing = false; saveFile(k); } },
    "fsave-force": (i, el) => saveFile(Number(el && el.dataset.v), { force: true }),
    "fsave-over": (i, el) => saveFile(Number(el && el.dataset.v), { overwrite: true }),   // 연 뒤 바뀐 파일을 덮어쓴다(비밀값 검사는 그대로 — 깃발을 나눴다, 새 맥락 리뷰)
    "fsave-busy": (i, el) => saveFile(Number(el && el.dataset.v), { ignoreBusy: true }),
    freload: (i, el) => reloadFile(Number(el && el.dataset.v)),
    fundo: (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (!f || !f.hist.length) return; const h = f.hist.pop(); f.text = h.text; f.dirty = f.text !== f.saved; f.edit = true; f.note = { kind: "ok", text: "마지막으로 저장하기 전 글로 되돌렸어요 — 저장을 누르면 그대로 써요" }; render(); },
    "fnote-x": (i, el) => { const f = st.openFiles[Number(el && el.dataset.v)]; if (f) { f.note = null; f.closing = false; render(); } },
    "fn-dir": (i, el) => { const v = el && el.dataset.v; if (!v) return; const s = new Set(st.fnOpen); if (s.has(v)) s.delete(v); else s.add(v); st.fnOpen = [...s]; render(); },   // 파일 칸의 폴더 접고 펼치기(R-8)
  });
