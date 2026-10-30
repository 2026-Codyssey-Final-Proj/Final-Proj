// claude-drafted: 2026-10-25 — C-37 단계 문서를 GitHub에(이재엽 "2단계가 끝나면 우리 단계별로 했던 내용들과 같이 docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에 올릴 수 있도록 할것 …
//   1단계는 아이디어들을 받고 2단계가 끝나면 계획서와 그리고 환경들을 깃허브에 올리는 방향" · 버튼 "docs 단계 폴더 + CLAUDE.md" · "Floe가 만들고, 커밋 · 푸시는 Claude Code").
// C-39(같은 날, 이재엽 "깃허브에 작업하는 환경에 우리의 작업 내용들이 PRD처럼 공식문서들로 우리의 내용이 어떻게 증빙해서 관리될 수 있는지" · 버튼 "증빙 칸 + 기획서 + 결정 기록"):
//   단계 문서마다 증빙 칸(재료 · 준비할 것 · 칸마다 누가 어떻게 정했나 · 확인한 날 · 관문 지난 날 · 완료 기준과 근거) + docs/PRD.md(기획서 한 장) + docs/decisions.md(결정 기록 표).
// 단계 결과(quest.js resultOf + 화면이 더한 at · passed · check)로 사용자 저장소에 둘 파일을 만든다 — 순수 함수만(파일을 쓰지 않는다). 화면(app.js)은 미리 보기로, 서버(server.js /api/docs)는 쓸 때 같이 쓴다.
//   docs/<단계 폴더>/ 여덟(끝낸 단계는 그 결과 md, 아직인 단계는 README 틀 — git은 빈 폴더를 올리지 않는다) · docs/README.md(목차) · docs/PRD.md · docs/decisions.md · README.md · CLAUDE.md는 표시(MARK) 사이 한 절만(내 글은 그대로).
// 파일 이름은 여기서 정한 것만 — 받은 글이 경로가 되지 않는다. 글은 넘겨받은 redact로 가린다(공개 저장소일 수 있다). 커밋 · 푸시는 Floe가 하지 않고 shipRequest 글로 사용자의 Claude Code에(허락 카드)
// 시험: 04-tests/navigator/docs.test.js · stage3-evidence.test.js
(function (root) {
  const node = typeof module !== "undefined" && module.exports;
  const N = node ? require("./navigator.js") : root.NavRules;
  const Q = node ? require("./quest.js") : root.NavQuest;
  const BC = node ? require("./basecard.js") : root.NavBaseCard;
  const SHT = node ? require("./sheet.js") : root.FloeSheet;   // C-47 한 장(2026-10-30) — 단계 문서의 '한 장' 절 · README의 그 단계 절   // 기준 카드(C-56 R-1, 2026-10-28) — docs/base.md
  const SLUGS = ["01-idea", "02-plan", "03-requirements", "04-design", "05-skeleton", "06-build", "07-measure", "08-retro"];
  const PRD_PART = ["문제와 목표", "아이디어와 범위", "꼭 필요한 기능", "만드는 방법", "뼈대와 할 일", "만든 것과 확인", "잰 결과", "배운 것"];   // 기획서에서 그 단계가 맡는 절
  const MARK_START = "<!-- floe:start -->", MARK_END = "<!-- floe:end -->";
  const MAIN_DOC = "docs/PRD.md", LOG_DOC = "docs/decisions.md";   // 기획서 · 결정 기록 — 화면은 이 이름으로 미리 보기를 찾는다
  const label = (n) => `${n + 1}단계`;
  const meta = (s) => `- 받는 것: ${s.gets}\n- 하는 일: ${s.does}\n- 남는 것: ${s.gives}`;
  const cell = (t) => String(t == null ? "" : t).replace(/\\/g, "\\\\").replace(/\r\n?|\n/g, " ").replace(/\|/g, "\\|") || "—";   // 표 칸 — 줄바꿈 · | · \ 가 표를 깨지 않게(\를 먼저)
  const joined = (it) => (it.lines || []).join(" / ");
  const oneLine = (t) => String(t == null ? "" : t).replace(/\r?\n/g, " ").trim();
  // C-47 관문 n에서 견준 원하는 결과 — 앞 관문(2단계부터)에서 바꾼 말 중 마지막, 없으면 1단계 '다 만들면 무엇이 달라지는지 쓰기' 칸(화면 app.js wantNow와 같은 규칙)
  const WANT = "다 만들면 무엇이 달라지는지 쓰기";
  function wantAt(R, n) {
    for (let k = n - 1; k >= 1; k--) { const g = R(k) && R(k).goal; if (g && g.changed) return String(g.changed); }
    const it = R(0) && R(0).items.find((x) => x.name === WANT);
    return it ? it.lines.filter((l) => l && l.trim()).join(" / ") : "";
  }

  // 칸을 누가 어떻게 정했나 — 단계 문서의 '어떻게:' 줄(stageDoc)과 다시 읽기(parseStage)가 같은 표를 쓴다. moved · skip은 C-49(2026-10-29) — 다시 읽을 때 누가 정했나가 남게
  const HOW_WORDS = { ok: "플로로 초안을 그대로", edit: "고침", me: "직접 적음(초안 없이)", pick: "고름", chat: "플로로와 나눈 대화를 정리해 적음(작업실 개편 C-61)", moved: "지난 칸 · 파일에서 옮겨 적음", skip: "조건이 안 맞아 건너뜀" };

  // 확인한 한 장(C-47) — 모양이 맞을 때만, 칸마다 가려 한 줄로
  const sheetOf = (r, red) => (SHT && r && SHT.ok(r.sheet) ? Object.fromEntries(Object.entries(r.sheet).filter(([, v]) => v !== undefined).map(([k, v]) => [k, k === "at" ? v : oneLine(red(v))])) : null);

  // 그 단계 결과로 문서 한 장 — 받은 것은 묶음(ctx: results · idea · redact · docOf)
  function stageDoc(n, r, topic, ctx) {
    const s = N.STAGES[n], R = ctx.R, red = ctx.redact;
    // 줄 하나는 문서에서도 한 줄 — 줄 안의 줄바꿈을 그대로 쓰면 '- …' 다음 줄이 다시 읽을 때 사라지고 문서가 '사람이 고친 것'으로 잡혀 이후 덮지 않았다(F-104-12)
    const one = (t) => { const x = red(t); return /[\r\n]/.test(x) ? oneLine(x) : x; };
    const refName = (x) => { const it = R(x.s) && R(x.s).items[x.i]; return `${label(x.s)} ${Q.roman(x.i)}${it ? ` ${red(Q.shortOf(it.name))}` : ""}`; };
    const how = (it) => {
      const w = HOW_WORDS[it.by];
      if (!w) return "";
      // 초안은 누가 정했든 같이 적는다(고름이면 '플로로가 권한 것') — 다시 읽을 때 결정 기록의 '플로로 초안' 칸이 비지 않게(C-49 새 맥락 리뷰)
      const d = it.draft ? ` — ${it.by === "pick" ? "플로로가 권한 것" : "플로로 초안"}: “${red(it.draft)}”` : "";
      return `- 어떻게: ${w}${d}`;
    };
    const items = r.items.map((it) => {
      const body = [...(it.lines.length ? it.lines.map((l) => `- ${one(l)}`) : ["- 아직 적지 않았어요"]), how(it), it.from && it.from.length ? `- 재료: ${it.from.map(refName).join(" · ")}` : ""].filter(Boolean);
      return `## ${red(Q.shortOf(it.name))}\n\n> ${red(it.name)}\n\n${body.join("\n")}`;
    }).join("\n\n");
    const before = SLUGS.map((_, k) => k).filter((k) => k < n && R(k));
    const mat = n === 0 ? `- 처음 말한 것: ${ctx.idea ? `“${ctx.idea}”${ctx.srcLines ? ` … 통째로: [00-source/idea.md](../00-source/idea.md) 1 ~ ${ctx.srcLines}줄` : ""}` : "남아 있지 않아요"}` : before.length ? before.map((k) => `- ${label(k)} ${N.STAGES[k].title}에서 정한 것 — [${ctx.docOf(k).slice(5)}](../${ctx.docOf(k).slice(5)})`).join("\n") : "- 지난 단계 결과가 남아 있지 않아요";
    const prep = r.prep && r.prep.length ? `\n\n## 이 단계 전에 준비할 것\n\n${r.prep.map((x) => `- ${red(x)}`).join("\n")}` : "";
    // 증빙을 남기기 전(C-37)에 끝낸 단계는 날짜 · 누가가 없다 — '아직'이라고 지어내지 않고 '남아 있지 않아요'. 다음 단계 결과가 있으면 관문은 지난 것
    const NONE = "남아 있지 않아요(증빙을 남기기 전에 끝낸 단계)";
    const count = r.items.some((it) => it.by) ? Q.BY.map((b) => `${Q.BY_WORD[b]} ${r.items.filter((it) => it.by === b).length}칸`).join(" · ") : NONE;
    const gate = r.passed ? `${cell(r.passed)} — 이해했어요(예)` : R(n + 1) ? "지났어요 — 날짜는 남아 있지 않아요" : "아직";
    const proof = ["## 증빙", "", "| 무엇 | 내용 |", "|---|---|", `| 칸을 다 확인한 날 | ${r.at ? cell(r.at) : NONE} |`, `| 관문을 지난 날 | ${gate} |`, `| 누가 정했나 | ${count} |`,
      ...(r.nocode ? ["| 코드 | 코드 없이 지남 — '코드 파일을 만드시겠습니까?'에 아니요 |"] : [])].join("\n");   // nocode(F-70) — 다시 읽을 때도 남게(C-49)
    // checkBy confirm(C-40) — 초안을 칸마다 확인한 단계는 AI가 다시 살펴보지 않았다. 그렇다고 적는다(증빙이 무엇에 기대는지)
    const check = r.check && r.check.length ? `\n\n### 완료 기준 — ${r.checkBy === "confirm" ? "확인한 대로(AI가 다시 살펴보지 않고, 칸마다 사람이 확인)" : "살펴본 결과"}\n\n| 기준 | 됐나 | 근거 |\n|---|---|---|\n${r.check.map((c) => `| ${cell(red(c.text))} | ${c.skipped ? `넘김(까닭: ${cell(red((r.skip && r.skip.reason) || ""))})` : c.met ? "됨" : "안 됨"} | ${cell(red(c.evidence))} |`).join("\n")}` : "";
    // 지식 퀘스트 C-47(2026-10-29, PRD 6절 · A-13): 배운 것 — 관문에서 사람이 적은 말 그대로(플로로 · AI는 이 칸을 쓰지 않는다). 비우면 '비어 있음', 칸을 만들기 전에 지난 관문은 '남아 있지 않아요'.
    //   사람 글은 줄마다 '> '(인용) — 줄머리 # · --- 가 절 제목이 되지 않게, <는 &lt;(&는 &amp; — 다시 읽을 때 되돌린다) — <!-- 가 뒤의 증빙을 숨기지 않게(새 맥락 리뷰 2026-10-29)
    const learned = typeof r.learned === "string" ? (r.learned.trim() ? red(r.learned.trim()).replace(/\r\n?/g, "\n").split("\n").map((l) => `> ${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}`.trimEnd()).join("\n") : "비어 있음 — 관문에서 적지 않았어요")
      : r.passed || R(n + 1) ? "남아 있지 않아요(배운 것 칸을 만들기 전에 지난 관문)" : "아직 — 관문에서 적어요";
    // 처음 뜻 — 관문에서 견준 말(1단계의 원하는 결과, 앞 관문에서 바꿨으면 바꾼 말)을 같이 적는다
    const was = oneLine(red(wantAt(R, n)));
    const goal = r.goal ? `\n\n## 처음 뜻 다시 보기\n\n${r.goal.changed ? `바뀌었어요 — “${oneLine(red(r.goal.changed))}”${was ? ` (전: “${was}”)` : ""}\n\n처음 말은 [기획서](../PRD.md)의 '처음 말한 것'에 그대로 있어요.` : `아직 같아요 — ${was ? `“${was}” ` : ""}그대로`}` : "";
    // C-47 한 장(2026-10-30): ③ 기록 칸에서 사람이 맞아요 한 것만 — 다섯 칸 한 줄씩, 가린 뒤
    const sh = sheetOf(r, red), sheet = sh ? `\n\n## 한 장\n\n${SHT.toLines(sh).join("\n")}` : "";
    const plan = n === 1 ? "\n\n이 문서가 이 프로젝트의 **계획서**예요. 일을 시작하기 전에 먼저 읽어요. 단계를 모은 기획서 한 장은 [../PRD.md](../PRD.md)에 있어요." : "";
    return `# ${label(n)} · ${s.title}${topic ? ` — ${topic}` : ""}\n\n${meta(s)}${plan}\n\n## 재료\n\n${mat}${prep}\n\n${items}${sheet}\n\n## 배운 것\n\n${learned}${goal}\n\n${proof}${check}\n\n---\nFloe가 단계를 지나며 정리했어요. 누가 무엇을 정했는지는 [../decisions.md](../decisions.md)에 모았어요.\n`;
  }
  const placeholder = (n) => { const s = N.STAGES[n]; return `# ${label(n)} · ${s.title}\n\n아직 — 이 단계를 지나면 Floe가 채워요.\n\n${meta(s)}\n`; };

  // 기획서(PRD) 한 장 — 처음 말한 것 · 끝낸 단계마다 한 절 · 단계 상태 표와 문서 링크 · 아직인 단계
  function prdDoc(name, ctx) {
    const R = ctx.R, red = ctx.redact, done = SLUGS.map((_, n) => n).filter((n) => R(n));
    const state = (n) => (!R(n) ? "아직" : R(n).passed ? `끝냄 — 관문 ${cell(R(n).passed)}` : R(n + 1) ? "끝냄" : `확인함${R(n).at ? ` ${cell(R(n).at)}` : ""} — 관문 아직`);
    const rows = SLUGS.map((_, n) => `| ${label(n)} · ${N.STAGES[n].title} | ${state(n)} | ${R(n) ? `[${ctx.docOf(n).slice(5)}](${ctx.docOf(n).slice(5)})` : "—"} |`).join("\n");
    const parts = done.map((n, k) => `## ${k + 1}. ${PRD_PART[n]} — ${label(n)}\n\n${R(n).items.map((it) => `- **${red(Q.shortOf(it.name))}** — ${it.lines.length ? red(joined(it)) : "아직 적지 않았어요"}`).join("\n")}`).join("\n\n");
    // C-47 처음 뜻 다시 보기 — 관문에서 '바뀌었어요'면 처음 말 아래에 덧붙인다(처음 말은 지우지 않는다)
    const changed = done.filter((n) => R(n).goal && R(n).goal.changed).map((n) => { const was = oneLine(red(wantAt(R, n)));
      return `\n>\n> 바뀐 뜻 — ${label(n)} 관문${R(n).passed ? `(${cell(R(n).passed)})` : ""}: “${oneLine(red(R(n).goal.changed))}”${was ? ` (전: “${was}”)` : ""}`; }).join("");
    const later = SLUGS.map((_, n) => n).filter((n) => !R(n)).map((n) => `- ${label(n)} · ${N.STAGES[n].title} — 아직(이 단계를 지나면 '${PRD_PART[n]}' 절이 생겨요)`).join("\n");
    return [MARK_START, `# 기획서${name ? ` — ${name}` : ""}`, "",
      "Floe의 단계를 지나며 정한 것을 한 장으로 묶었어요. 칸마다 누가 어떻게 정했는지는 [결정 기록](decisions.md)에, 단계마다의 근거는 각 단계 문서의 '증빙'에 있어요.", "",
      "| 단계 | 상태 | 문서 |", "|---|---|---|", rows, "", "## 처음 말한 것", "", `> ${ctx.idea || "남아 있지 않아요"}${ctx.srcLines ? `\n>\n> 통째로: [00-source/idea.md](00-source/idea.md) 1 ~ ${ctx.srcLines}줄` : ""}${changed}`, "", parts, ...(later ? ["", "## 다음에 채울 것", "", later] : []), MARK_END, ""].join("\n");
  }
  // 결정 기록 — 칸마다 한 줄 + 지난 관문마다 한 줄
  function decisionsDoc(name, ctx) {
    const R = ctx.R, red = ctx.redact, rows = [];
    for (let n = 0; n < SLUGS.length; n++) {
      const r = R(n); if (!r) continue;
      for (const it of r.items) rows.push(`| ${cell(r.at)} | ${label(n)} | ${cell(red(Q.shortOf(it.name)))} | ${cell(it.draft ? red(it.draft) : "")} | ${cell(red(joined(it)))} | ${cell(Q.BY_WORD[it.by])} |`);
      // R-10(2026-10-27): 넘긴 기준(skipped)은 '됨' 수에 들지 않고 '넘김 n — 까닭'으로 남긴다(까닭은 관문에서 사람이 적은 글)
      if (r.passed) { const c = r.check || [], sk = c.filter((x) => x.skipped).length; rows.push(`| ${cell(r.passed)} | ${label(n)} | 관문 | — | 이해했어요(예)${c.length ? ` · 기준 ${c.filter((x) => x.met && !x.skipped).length}/${c.length}` : ""}${sk ? ` · 넘김 ${sk} — 까닭: ${cell(red((r.skip && r.skip.reason) || ""))}` : ""}${r.nocode ? " · 코드 없이 지남" : ""} | 관문 |`); }   // nocode — 6단계에서 '코드 파일을 만드시겠습니까?'에 아니요(A-04, F-70)
    }
    return [MARK_START, `# 결정 기록${name ? ` — ${name}` : ""}`, "",
      "플로로가 초안을 내고 사람이 정했어요 — 그대로(초안 그대로) · 고침(초안을 고침) · 직접(초안 없이 적음) · 고름(셋 중에서 고름) · 대화(플로로와 나눈 말을 정리해 적음). 관문은 사람이 '이해했어요(예)'로 지나요.",
      "날짜 · 누가 정했나는 Floe 화면이 남긴 기록이에요(이 컴퓨터의 시간).", "",
      "| 날짜 | 단계 | 할 일 | 플로로 초안 | 정한 것 | 어떻게 |", "|---|---|---|---|---|---|", ...rows, MARK_END, ""].join("\n");
  }

  // 표시 사이만 바꾸고 나머지 글은 그대로 — 표시가 없으면 끝에 더하고, 글이 없으면 절만
  function mergeSection(existing, block) {
    const t = String(existing || ""), b = String(block).trim(), a = t.indexOf(MARK_START), z = t.indexOf(MARK_END);
    if (a >= 0 && z > a) return `${t.slice(0, a)}${b}${t.slice(z + MARK_END.length)}`;
    return t.trim() ? `${t.trimEnd()}\n\n${b}\n` : `${b}\n`;
  }

  // 사용자 저장소에 둘 파일 — [{ path, text, merge? }]. merge면 그 파일의 글에 mergeSection으로 한 절만
  // F-68(2026-10-28, 이재엽 버튼 "통째로 파일에"): source(받은 글 전부)가 idea(앞 400자)보다 길면 docs/00-source/idea.md에 줄 번호와 함께 통째로 두고, 1단계 문서 · 기획서는 그 파일을 줄로 가리킨다. 가림(redact)을 거친다
  const SOURCE_DOC = "docs/00-source/idea.md";
  const sourceDoc = (text, name) => { const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n"), w = String(lines.length).length;
    return `# 처음 말한 것 — 받은 글 그대로${name ? ` (${name})` : ""}\n\nFloe가 받은 글을 자르지 않고 그대로 두었어요. 단계 문서의 '처음 말한 것'은 이 파일의 줄을 가리켜요. 비밀값 모양은 가렸어요.\n\n${lines.map((l, i) => `${String(i + 1).padStart(w)} | ${l}`).join("\n")}\n`; };
  const CARD_DOC = "docs/base.md";   // 기준 카드 한 장(C-56 R-1) — Floe가 만든 카드라 덮어쓴다. 이름은 영문(파일 이름 규칙 — 받은 글이 경로가 되지 않게 A-Za-z0-9._/-만), 제목은 '이 프로젝트의 기준'
  function files({ topic = "", idea = "", source = "", results = {}, card = null, redact: hide = (t) => t } = {}) {
    // 받은 글 안의 표시(<!-- floe:… -->)는 지운다 — 남겨 두면 mergeSection이 그 자리를 절의 끝으로 보고 올릴 때마다 꼬리가 쌓였다(2026-10-25 리뷰)
    const redact = (t) => String(hide(t)).replace(/<!--\s*floe:(?:start|end)\s*-->/gi, "");
    const R = (n) => results[n] || results[String(n)] || null;
    const name = redact(String(topic || "").trim());
    const docOf = (n) => (R(n) ? `docs/${SLUGS[n]}/${SLUGS[n].slice(3)}.md` : `docs/${SLUGS[n]}/README.md`);
    const src = redact(String(source || "")), srcLines = src.trim() ? src.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").length : 0, hasSrc = src.trim().length > String(idea || "").trim().length;
    const ctx = { R, redact, docOf, idea: redact(String(idea || "").trim().replace(/\r?\n/g, " ")), srcLines: hasSrc ? srcLines : 0 };
    const rows = SLUGS.map((slug, n) => `| ${label(n)} · ${N.STAGES[n].title} | [${slug}](${docOf(n).slice(5)}) | ${R(n) ? (R(n).passed || R(n + 1) ? "끝냄" : "확인함") : "아직"} |`).join("\n");
    const index = `${MARK_START}\n# 단계 문서${name ? ` — ${name}` : ""}\n\nFloe의 여덟 단계로 만들어요. 단계마다 폴더 하나 — 끝낸 단계는 정한 것과 증빙이, 아직인 단계는 할 일이 들어 있어요.\n\n`
      + `- 기획서(끝낸 단계를 한 장으로): [PRD.md](PRD.md)\n- 결정 기록(누가 무엇을 어떻게 정했나): [decisions.md](decisions.md)${card && BC ? "\n- 이 프로젝트의 기준(1단계 관문의 카드): [base.md](base.md)" : ""}\n\n| 단계 | 폴더 | 상태 |\n|---|---|---|\n${rows}\n${MARK_END}\n`;
    const plan = R(1) ? docOf(1) : docOf(0);
    const links = SLUGS.map((_, n) => n).filter((n) => R(n)).map((n) => `- ${label(n)} ${N.STAGES[n].title}: [${docOf(n)}](${docOf(n)})`).join("\n");
    // C-47 한 장(2026-10-30) — 맞아요 한 단계마다 README의 그 단계 절(C-25의 남은 일). 내 글은 표시 밖이라 그대로
    const sheets = SLUGS.map((_, n) => n).filter((n) => sheetOf(R(n), redact)).map((n) => `\n### ${label(n)} · ${N.STAGES[n].title} — 한 장\n${SHT.toLines(sheetOf(R(n), redact)).join("\n")}\n`).join("");
    const readme = `${MARK_START}\n## 계획 (Floe)\n\n${name ? `**${name}** — ` : ""}Floe의 여덟 단계로 만들어요.\n\n- 기획서: [docs/PRD.md](docs/PRD.md)\n- 결정 기록: [docs/decisions.md](docs/decisions.md)\n${links}\n- 단계 폴더 목차: [docs/README.md](docs/README.md)\n${sheets}${MARK_END}\n`;
    const claude = `${MARK_START}\n## Floe 단계 안내\n\n이 저장소는 Floe의 여덟 단계(1 ${N.STAGES[0].title} → … → 8 ${N.STAGES[7].title})로 만든다.\n\n`
      + `- 일을 시작하기 전에 [docs/PRD.md](docs/PRD.md)(기획서)와 [${plan}](${plan})를 먼저 읽는다. 거기에 없는 기능은 더하지 않고 먼저 묻는다.\n`
      + "- 사람이 정한 것은 [docs/decisions.md](docs/decisions.md)에 있다 — 바꿔야 하면 바꾸기 전에 묻는다.\n"
      + "- 단계 문서는 docs/<단계 폴더>/에 둔다 — 목차는 [docs/README.md](docs/README.md).\n"
      + "- 비밀값(키 · 토큰 · 비밀번호 · .env)은 커밋하지 않는다.\n" + `${MARK_END}\n`;
    return [{ path: "docs/README.md", text: index, merge: true }, ...(hasSrc ? [{ path: SOURCE_DOC, text: sourceDoc(src, name) }] : []), ...(card && BC ? [{ path: CARD_DOC, text: redact(BC.toMarkdown(card, name)) }] : []), ...SLUGS.map((_, n) => ({ path: docOf(n), text: R(n) ? stageDoc(n, R(n), name, ctx) : placeholder(n) })),
      { path: MAIN_DOC, text: prdDoc(name, ctx), merge: true }, { path: LOG_DOC, text: decisionsDoc(name, ctx), merge: true },
      { path: "README.md", text: readme, merge: true }, { path: "CLAUDE.md", text: claude, merge: true }];
  }

  // ── 지식 퀘스트 C-49(2026-10-29 — PRD 6절 · 9절 3 · 4번): 기록의 원본은 내 프로젝트 폴더. Floe가 쓴 단계 문서(stageDoc)를 다시 읽어 단계 결과로 ──
  //   사람이 손으로 고친 줄은 고친 대로 읽는다. Floe 단계 문서가 아니면(아직인 단계의 틀 · 다른 글) null. 가린 글은 가린 채로(원본이 이미 가려져 있다)
  const stagePath = (n) => `docs/${SLUGS[n]}/${SLUGS[n].slice(3)}.md`;
  const REF_LINE = /^재료: \d단계 [ⅠⅡⅢⅣⅤⅥⅦⅧ](?: |$)/;   // stageDoc refName들을 ' · '로 이은 줄 — 'N단계 Ⅰ'로 시작할 때만 재료로 읽는다(짧은 이름 안에도 ' · '가 있다 — '왜 · 어디까지 · 언제 성공')
  const FIXED = ["재료", "이 단계 전에 준비할 것", "한 장", "배운 것", "처음 뜻 다시 보기", "증빙"];   // 한 장 — C-47(2026-10-30)
  const DATE = /^(\d{4}-\d{2}-\d{2})/;
  // 표 한 줄 → 칸들(cell의 거꾸로 — \\ → \, \| → |)
  function cellsOf(row) {
    const out = []; let cur = "", k = row.indexOf("|") + 1;
    for (; k < row.length; k++) {
      const c = row[k];
      if (c === "\\" && (row[k + 1] === "\\" || row[k + 1] === "|")) { cur += row[k + 1]; k++; }
      else if (c === "|") { out.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    return out;
  }
  const quoted = (t) => { const m = /^“([\s\S]*)”$/.exec(t); return m ? m[1] : null; };
  function parseStage(text) {
    const lines = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");   // BOM — Windows 편집기가 붙여 저장하면 첫 줄이 맞지 않아 못 읽었다(F-104-13)
    const h = /^# (\d)단계 · (.+)$/.exec(lines[0] || ""), n = h ? Number(h[1]) - 1 : -1, s = N.STAGES[n];
    if (!s || !h[2].startsWith(s.title)) return null;
    const topic = h[2].slice(s.title.length).replace(/^ — /, "");
    // ## 마다 절 — 증빙 절 안의 ### 완료 기준은 증빙에 붙는다
    const secs = []; let cur = null;
    for (const l of lines.slice(1)) {
      if (/^---$/.test(l)) { cur = null; continue; }   // 끝 줄(Floe가 정리했어요)
      const m = /^## (.+)$/.exec(l);
      if (m) { cur = { title: m[1], body: [] }; secs.push(cur); } else if (cur) cur.body.push(l);
    }
    const trim = (b) => { const a = [...b]; while (a.length && !a[0].trim()) a.shift(); while (a.length && !a[a.length - 1].trim()) a.pop(); return a; };
    const result = { items: [] };
    let idea = null;
    for (const sec of secs) {
      const body = trim(sec.body);
      if (!FIXED.includes(sec.title) && body[0] && body[0].startsWith("> ")) {
        const it = { name: body[0].slice(2), lines: [] }, ls = body.slice(1).filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
        // '재료:' · '어떻게:' 줄은 stageDoc이 칸 끝에 쓴다 — 끝에서만, 모양이 맞을 때만 읽는다(사람이 쓴 '어떻게: …' 줄을 먹지 않게, 새 맥락 리뷰)
        if (ls.length && REF_LINE.test(ls[ls.length - 1])) {
          const from = [...ls.pop().matchAll(/(?:^재료: | · )(\d)단계 ([ⅠⅡⅢⅣⅤⅥⅦⅧ])(?= |$)/g)].map((x) => ({ s: Number(x[1]) - 1, i: "ⅠⅡⅢⅣⅤⅥⅦⅧ".indexOf(x[2]) })).filter((x) => x.s >= 0 && x.s < N.STAGES.length);   // refName의 거꾸로(Q.roman)
          if (from.length) it.from = from;
        }
        const hm = ls.length && /^어떻게: (.+)$/.exec(ls[ls.length - 1]), [hw, hd] = hm ? hm[1].split(/ — (?:플로로 초안|플로로가 권한 것): /) : [], by = hm ? Object.keys(HOW_WORDS).find((k) => HOW_WORDS[k] === hw) : null;
        if (by) { ls.pop(); it.by = by; if (hd != null && quoted(hd) != null) it.draft = quoted(hd); }
        it.lines = ls.length === 1 && ls[0] === "아직 적지 않았어요" ? [] : ls;
        result.items.push(it);
      } else if (sec.title === "재료" && n === 0) {
        const m = /^- 처음 말한 것: “(.*)”(?: … 통째로: .*)?$/.exec(body[0] || "");   // stageDoc mat의 거꾸로 — 되살릴 때 처음 말한 것을 잃지 않게(새 맥락 리뷰)
        if (m) idea = m[1];
      } else if (sec.title === "이 단계 전에 준비할 것") {
        const prep = body.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
        if (prep.length) result.prep = prep;
      } else if (sec.title === "한 장") {
        const s = SHT && SHT.parse(body);   // stageDoc 한 장 절의 거꾸로 — 다섯 칸이 다 있어야
        if (s) result.sheet = s;
      } else if (sec.title === "배운 것") {
        const t = body.join("\n");
        if (!t || t === "비어 있음 — 관문에서 적지 않았어요") result.learned = "";   // 사람이 칸을 비웠으면 비어 있음
        else if (!t.startsWith("아직 — 관문에서") && !t.startsWith("남아 있지 않아요(배운 것 칸")) result.learned = body.map((l) => l.replace(/^> ?/, "").replace(/&lt;/g, "<").replace(/&amp;/g, "&")).join("\n");   // stageDoc의 거꾸로 — 인용 · &lt; · &amp;
      } else if (sec.title === "처음 뜻 다시 보기") {
        const c = /^바뀌었어요 — “(.*)”(?: \(전: “.*”\))?$/.exec(body[0] || "");   // 견준 말(전:)은 앞 관문에서 다시 만든다(wantAt)
        if (c) result.goal = { changed: c[1] }; else if ((body[0] || "").startsWith("아직 같아요")) result.goal = { same: true };
      } else if (sec.title === "증빙") {
        let check = null;
        for (const l of body) {
          if (/^### 완료 기준 — /.test(l)) { check = []; if (l.includes("확인한 대로")) result.checkBy = "confirm"; continue; }
          if (!l.startsWith("|") || /^\|-/.test(l)) continue;
          const c = cellsOf(l);
          if (!check) {
            if (c[0] === "칸을 다 확인한 날" && DATE.test(c[1])) result.at = DATE.exec(c[1])[1];
            if (c[0] === "관문을 지난 날" && DATE.test(c[1])) result.passed = DATE.exec(c[1])[1];
            if (c[0] === "코드" && (c[1] || "").startsWith("코드 없이 지남")) result.nocode = true;
          } else if (!(c[0] === "기준" && c[1] === "됐나")) {
            const skip = /^넘김\(까닭: ([\s\S]*)\)$/.exec(c[1] || "");
            check.push({ text: c[0], met: !!skip || c[1] === "됨", evidence: c[2] === "—" ? "" : c[2] || "", ...(skip ? { skipped: true } : {}) });
            if (skip && !result.skip) result.skip = { reason: skip[1] === "—" ? "" : skip[1], items: [] };
            if (skip) result.skip.items.push(c[0]);
          }
        }
        if (check && check.length) result.check = check;
      }
    }
    return result.items.length ? { n, topic, ...(idea != null ? { idea } : {}), result } : null;
  }
  // 받은 글 전부(F-68 docs/00-source/idea.md — sourceDoc)의 거꾸로 — '  1 | 글' 줄들. 모양이 아니면 null
  function parseSource(text) {
    const lines = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");   // BOM(F-104-13)
    if (!/^# 처음 말한 것 — 받은 글 그대로/.test(lines[0] || "")) return null;
    const body = lines.filter((l) => /^\s*\d+ \| /.test(l) || /^\s*\d+ \|$/.test(l)).map((l) => l.replace(/^\s*\d+ \| ?/, ""));
    return body.length ? body.join("\n") : null;
  }

  // Claude Code에 맡길 글 — 만든 파일만 더해 커밋하고 지금 브랜치를 푸시. 강제 푸시 · 다른 파일 고치기는 하지 않는다
  const shipRequest = (paths) => [
    "Floe가 이 작업 폴더에 단계 문서(기획서 · 결정 기록 · 단계 폴더)를 만들었어요. 아래 파일만 올려 주세요:",
    ...paths.map((p) => `- ${p}`), "",
    "1. 이 파일들만 git에 더해요(git add -- <위 파일들>). 다른 파일은 더하거나 고치지 마세요.",
    "2. \"docs: Floe 단계 문서 · 기획서 · 결정 기록\"으로 커밋해요.",
    "3. 지금 브랜치를 원격(origin)에 푸시해요. 강제 푸시(--force)는 하지 마세요.",
    "원격(origin)이 없거나 푸시가 거절되면 푸시하지 말고 까닭만 알려 주세요.",
  ].join("\n");

  // 끝에 Claude Code가 이 둘마다 해냈는지 보고한다(server.js startTask의 checks — C-32 보고). 화면은 둘째(푸시)를 보고 '올라갔다'고 말한다
  const SHIP_CHECKS = ["위 파일들만 커밋했다", "지금 브랜치를 원격(origin)에 푸시했다"];
  const api = { SLUGS, PRD_PART, MARK_START, MARK_END, MAIN_DOC, LOG_DOC, SOURCE_DOC, CARD_DOC, SHIP_CHECKS, files, mergeSection, shipRequest, stagePath, parseStage, parseSource };
  if (node) module.exports = api;
  else root.FloeDocs = api;
})(typeof window !== "undefined" ? window : globalThis);
