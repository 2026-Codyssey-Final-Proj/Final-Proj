// claude-drafted: 2026-10-25 — C-37 단계 문서를 GitHub에(이재엽 "2단계가 끝나면 우리 단계별로 했던 내용들과 같이 docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에 올릴 수 있도록 할것 …
//   1단계는 아이디어들을 받고 2단계가 끝나면 계획서와 그리고 환경들을 깃허브에 올리는 방향" · 버튼 "docs 단계 폴더 + CLAUDE.md" · "Floe가 만들고, 커밋 · 푸시는 Claude Code").
// 단계 결과(quest.js resultOf)로 사용자 저장소에 둘 파일을 만든다 — 순수 함수만(파일을 쓰지 않는다). 화면(app.js)은 미리 보기로, 서버(server.js /api/docs)는 쓸 때 같이 쓴다.
//   docs/<단계 폴더>/ 여덟(끝낸 단계는 그 결과 md, 아직인 단계는 README 틀 — git은 빈 폴더를 올리지 않는다) · docs/README.md(목차) · README.md · CLAUDE.md는 표시(MARK) 사이 한 절만(내 글은 그대로).
// 파일 이름은 여기서 정한 것만 — 받은 글이 경로가 되지 않는다. 글은 넘겨받은 redact로 가린다(공개 저장소일 수 있다). 커밋 · 푸시는 Floe가 하지 않고 shipRequest 글로 사용자의 Claude Code에(허락 카드)
// 시험: 04-tests/navigator/docs.test.js
(function (root) {
  const node = typeof module !== "undefined" && module.exports;
  const N = node ? require("./navigator.js") : root.NavRules;
  const Q = node ? require("./quest.js") : root.NavQuest;
  const SLUGS = ["01-idea", "02-plan", "03-requirements", "04-design", "05-skeleton", "06-build", "07-measure", "08-retro"];
  const MARK_START = "<!-- floe:start -->", MARK_END = "<!-- floe:end -->";
  const label = (n) => `${n + 1}단계`;
  const meta = (s) => `- 받는 것: ${s.gets}\n- 하는 일: ${s.does}\n- 남는 것: ${s.gives}`;

  // 끝낸 단계의 문서 — 할 일마다 짧은 이름(제목) · 할 일 · 적은 줄. 2단계는 이 프로젝트의 계획서
  function stageDoc(n, r, topic, redact) {
    const s = N.STAGES[n];
    const items = r.items.map((it) => `## ${redact(Q.shortOf(it.name))}\n\n> ${redact(it.name)}\n\n${it.lines.length ? it.lines.map((l) => `- ${redact(l)}`).join("\n") : "- 아직 적지 않았어요"}`).join("\n\n");
    const plan = n === 1 ? "\n\n이 문서가 이 프로젝트의 **계획서**예요. 일을 시작하기 전에 먼저 읽어요." : "";
    return `# ${label(n)} · ${s.title}${topic ? ` — ${topic}` : ""}\n\n${meta(s)}${plan}\n\n${items}\n\n---\nFloe가 단계를 지나며 정리했어요.\n`;
  }
  const placeholder = (n) => { const s = N.STAGES[n]; return `# ${label(n)} · ${s.title}\n\n아직 — 이 단계를 지나면 Floe가 채워요.\n\n${meta(s)}\n`; };

  // 표시 사이만 바꾸고 나머지 글은 그대로 — 표시가 없으면 끝에 더하고, 글이 없으면 절만
  function mergeSection(existing, block) {
    const t = String(existing || ""), b = String(block).trim(), a = t.indexOf(MARK_START), z = t.indexOf(MARK_END);
    if (a >= 0 && z > a) return `${t.slice(0, a)}${b}${t.slice(z + MARK_END.length)}`;
    return t.trim() ? `${t.trimEnd()}\n\n${b}\n` : `${b}\n`;
  }

  // 사용자 저장소에 둘 파일 — [{ path, text, merge? }]. merge면 그 파일의 글에 mergeSection으로 한 절만
  function files({ topic = "", results = {}, redact = (t) => t } = {}) {
    const R = (n) => results[n] || results[String(n)] || null;
    const name = redact(String(topic || "").trim());
    const docOf = (n) => (R(n) ? `docs/${SLUGS[n]}/${SLUGS[n].slice(3)}.md` : `docs/${SLUGS[n]}/README.md`);
    const rows = SLUGS.map((slug, n) => `| ${label(n)} · ${N.STAGES[n].title} | [${slug}](${docOf(n).slice(5)}) | ${R(n) ? "끝냄" : "아직"} |`).join("\n");
    const index = `${MARK_START}\n# 단계 문서${name ? ` — ${name}` : ""}\n\nFloe의 여덟 단계로 만들어요. 단계마다 폴더 하나 — 끝낸 단계는 정한 것이, 아직인 단계는 할 일이 들어 있어요.\n\n| 단계 | 폴더 | 상태 |\n|---|---|---|\n${rows}\n${MARK_END}\n`;
    const plan = R(1) ? docOf(1) : docOf(0);
    const links = SLUGS.map((_, n) => n).filter((n) => R(n)).map((n) => `- ${label(n)} ${N.STAGES[n].title}: [${docOf(n)}](${docOf(n)})`).join("\n");
    const readme = `${MARK_START}\n## 계획 (Floe)\n\n${name ? `**${name}** — ` : ""}Floe의 여덟 단계로 만들어요.\n\n${links}\n- 단계 폴더 목차: [docs/README.md](docs/README.md)\n${MARK_END}\n`;
    const claude = `${MARK_START}\n## Floe 단계 안내\n\n이 저장소는 Floe의 여덟 단계(1 ${N.STAGES[0].title} → … → 8 ${N.STAGES[7].title})로 만든다.\n\n`
      + `- 일을 시작하기 전에 [${plan}](${plan})를 먼저 읽는다. 거기에 없는 기능은 더하지 않고 먼저 묻는다.\n`
      + "- 단계 문서는 docs/<단계 폴더>/에 둔다 — 목차는 [docs/README.md](docs/README.md).\n"
      + "- 비밀값(키 · 토큰 · 비밀번호 · .env)은 커밋하지 않는다.\n" + `${MARK_END}\n`;
    return [{ path: "docs/README.md", text: index, merge: true }, ...SLUGS.map((_, n) => ({ path: docOf(n), text: R(n) ? stageDoc(n, R(n), name, redact) : placeholder(n) })),
      { path: "README.md", text: readme, merge: true }, { path: "CLAUDE.md", text: claude, merge: true }];
  }

  // Claude Code에 맡길 글 — 만든 파일만 더해 커밋하고 지금 브랜치를 푸시. 강제 푸시 · 다른 파일 고치기는 하지 않는다
  const shipRequest = (paths) => [
    "Floe가 이 작업 폴더에 단계 문서(계획서와 단계 폴더)를 만들었어요. 아래 파일만 올려 주세요:",
    ...paths.map((p) => `- ${p}`), "",
    "1. 이 파일들만 git에 더해요(git add -- <위 파일들>). 다른 파일은 더하거나 고치지 마세요.",
    "2. \"docs: Floe 단계 문서와 계획서\"로 커밋해요.",
    "3. 지금 브랜치를 원격(origin)에 푸시해요. 강제 푸시(--force)는 하지 마세요.",
    "원격(origin)이 없거나 푸시가 거절되면 푸시하지 말고 까닭만 알려 주세요.",
  ].join("\n");

  // 끝에 Claude Code가 이 둘마다 해냈는지 보고한다(server.js startTask의 checks — C-32 보고). 화면은 둘째(푸시)를 보고 '올라갔다'고 말한다
  const SHIP_CHECKS = ["위 파일들만 커밋했다", "지금 브랜치를 원격(origin)에 푸시했다"];
  const api = { SLUGS, MARK_START, MARK_END, SHIP_CHECKS, files, mergeSection, shipRequest };
  if (node) module.exports = api;
  else root.FloeDocs = api;
})(typeof window !== "undefined" ? window : globalThis);
