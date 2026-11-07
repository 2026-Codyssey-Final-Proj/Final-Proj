// claude-drafted: 2026-10-28 — F-70 앱으로 결과물이 나오게(이재엽 "이 앱으로 결과물 파일을 만들어서 무언가를 테스트를 해야하는데 결과물이 안나오는 문제 해결",
//   결정 모음 A-02 "5 · 6단계 퀘스트 안의 버튼" · A-04 "코드 파일을 만드시겠습니까?" · A-05 "요구 줄마다 맡기기 — 11/1 전에 꼭").
//   단계 결과(단계마다 { items: [{ name, lines }] })로 Claude Code에 맡길 글과 끝 조건을 짓는다 — 뼈대(5단계) · 요구 줄 하나(6단계) · 돌려 보기(6 · 7단계).
//   맡기기는 서버의 같은 길(/api/task/start — 허락은 섬, 끝에 기준마다 보고). 문서에 없는 숫자 · 이름은 지어내지 말고 빈칸으로 묻게 글에 적는다.
//   보낼 글은 서버 TASK_MAX(4,000자) 안, 끝 조건은 한 줄 200자 · 12줄 안. 순수 함수 — Node 시험 04-tests/navigator/build.test.js
(function (root) {
  const node = typeof module !== "undefined" && module.exports;
  const N = node ? require("./navigator.js") : root.NavRules;   // 단계 이름은 navigator.js STAGES 한 곳에서
  const TEXT_MAX = 3000;   // 서버가 끝 조건 · 보고 말을 붙여도 4,000자 안에 들게
  const CHECK_MAX = 200;
  const FEATURE_LINE = "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기";
  const CODE_RE = /\.(m?[jt]sx?|cjs|py|java|kt|go|rb|rs|c|h|cc|cpp|cs|php|swift|html?|css|scss|vue|svelte|sh|sql)$/i;   // queststate.js와 같은 셈
  const norm = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim();
  const cut = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
  const stageOf = (results, n) => (results && (results[n] || results[String(n)])) || null;

  // 3단계 기능 줄 — '~하면, 앱은 ~한다'를 ' / '로 이은 한 칸을 조각으로(queststate의 기능 수와 같은 셈). 같은 줄은 한 번
  function features(results) {
    const r = stageOf(results, 2), it = r && Array.isArray(r.items) ? r.items.find((x) => x && x.name === FEATURE_LINE) : null;
    const out = [];
    for (const l of (it && Array.isArray(it.lines) ? it.lines : [])) for (const p of String(l).split(/\s\/\s/)) { const t = norm(p); if (t && !out.includes(t)) out.push(t); }
    return out;
  }
  // 지난 단계 요약 — 1 ~ upTo단계의 칸 이름 · 적은 줄(맡길 글의 재료). 빈 단계 · 빈 칸은 건너뛰고 max자에서 자른다
  function digest(results, upTo = 4, max = 1800) {
    const rows = [];
    for (let n = 0; n < upTo; n++) {
      const r = stageOf(results, n); if (!r || !Array.isArray(r.items)) continue;
      const items = r.items.filter((x) => x && Array.isArray(x.lines) && x.lines.some((l) => norm(l)));
      if (!items.length) continue;
      rows.push(`[${n + 1}단계 · ${N && N.STAGES[n] ? N.STAGES[n].title : ""}]`, ...items.map((x) => `- ${norm(x.name)}: ${x.lines.map(norm).filter(Boolean).join(" / ")}`));
    }
    const t = rows.join("\n");
    return t ? cut(t, max) : "(아직 적은 단계가 없어요 — docs/ 문서와 README를 읽어요)";
  }
  const job = (lines, checks) => ({ text: cut(lines.join("\n"), TEXT_MAX), checks: checks.map((c) => cut(norm(c), CHECK_MAX)) });
  const NO_MAKE_UP = "- 문서에 없는 숫자 · 이름 · 주소는 지어내지 말고 README의 '정할 것'에 빈칸으로 남겨요. 비밀값(키 · 비밀번호)은 코드에 쓰지 않아요.";

  // 5단계 뼈대(ⓑ) · 6단계에서 코드가 없을 때 '예'(A-04, why: "code") — 입력 → 처리 → 결과물이 한 번 이어지는 가장 단순한 길
  function skeletonTask({ results = {}, topic = "", why = "" } = {}) {
    const name = norm(topic) ? `'${cut(norm(topic), 60)}'` : "이 프로젝트";
    return job([
      why === "code" ? `Floe 6단계(하나씩 만들고 확인하기)인데 이 폴더에 코드 파일이 없어요. ${name}를 실행할 수 있는 코드 파일을 만들어 주세요 — 가장 단순한 흐름이 처음부터 끝까지 도는 것부터.`
        : `Floe 5단계(뼈대 먼저 이어 보기)예요. ${name}의 가장 단순한 흐름이 처음부터 끝까지 도는 뼈대 코드를 이 폴더에 만들어 주세요.`,
      "먼저 docs/ 폴더의 단계 문서(기획서 · 기능 목록 · 방법 기록)와 README가 있으면 읽고, 아래 단계 요약과 다르면 문서를 따라요.",
      "- 기능을 다 만들지 말고 입력 → 처리 → 결과물이 한 번 이어지는 길만 만들어요. 남은 기능은 README의 '할 일'에 적어요.",
      "- README의 '실행하는 법'에 실행 명령 한 줄과 예시 입력을 적고, 그 예시로 한 번 돌려 결과물이 생기는지 확인해요.",
      NO_MAKE_UP, "", "단계 요약:", digest(results)],
    ["README에 실행 명령 한 줄과 예시 입력을 적었다", "예시 입력으로 처음부터 끝까지 한 번 돌렸다(돌린 명령과 결과를 근거에)", "기획서에 적힌 결과물(파일 · 화면 출력)이 생겼다(생긴 파일 경로를 근거에)"]);
  }
  // 6단계 기능 줄 하나(ⓒ) — 그 줄의 확인 방법(주어진 상황 → 할 일 → 기대 결과)을 먼저 적고 만든다.
  //   checksNote — 6단계 Ⅰ('확인 방법을 먼저 정하고 만들기')에 사람이 적은 줄. 있으면 그대로 넘기고 끝 조건도 그것으로(넘김 문서 ⓒ "끝 조건은 그 줄의 확인 방법")
  function lineTask({ line = "", results = {}, checksNote = [] } = {}) {
    const l = norm(line); if (!l) return null;
    const note = (Array.isArray(checksNote) ? checksNote : []).map(norm).filter(Boolean);
    return job([
      "Floe 6단계(하나씩 만들고 확인하기)예요. 아래 기능 한 줄만 만들어 주세요.", "", `기능: ${cut(l, 400)}`, "",
      ...(note.length ? [`6단계에 적은 확인 방법(이 기능에 맞는 것을 써요): ${cut(note.join(" / "), 600)}`, ""] : []),
      "- 먼저 이 줄의 확인 방법(주어진 상황 → 할 일 → 기대 결과)을 시험 코드나 실행 순서로 적고, 그다음에 만들어요.",
      "- 다른 기능 줄은 고치지 않아요. 이미 있는 코드와 README의 실행 명령을 따라요.",
      "- 문서에 없는 숫자 · 이름은 지어내지 말고 물을 것(ask)으로 남겨요.", "", "단계 요약:", digest(results, 4, 1400)],
    [`이 기능이 동작한다 — ${cut(l, 150)}`, note.length ? "6단계에 적은 확인 방법으로 확인해 통과했다(그 시험 · 실행 순서의 파일 이름을 근거에)" : "확인 방법(시험 또는 실행 순서)을 먼저 적고 통과했다(그 파일 이름을 근거에)", "README의 실행 명령으로 돌려도 앞의 흐름이 깨지지 않는다"]);
  }
  // 6 · 7단계 돌려 보기(ⓓ) — 코드는 고치지 않고 돌리기만, 결과 파일 경로 · 출력 첫 줄을 보고
  function runTask() {
    return job([
      "Floe 돌려 보기예요. README(없으면 docs/의 기획서)에 적힌 실행 명령으로 프로그램을 한 번 돌려 주세요.",
      "- 예시 입력이 필요하면 README · 기획서의 예시를 쓰고, 없으면 작은 예시를 만들어 그 내용을 근거에 적어요.",
      "- 프로그램 코드는 고치지 않아요 — 돌려 보기만. 오류가 나면 고치지 말고 그 첫 줄을 근거에 적어요.",
      "- 결과 파일이 생기면 폴더 안의 경로(예: out/report.md)를, 화면에만 나오면 첫 줄을 근거에 적어요."],
    ["실행 명령을 돌렸다(돌린 명령을 근거에)", "결과가 나왔다(결과 파일의 폴더 안 경로 또는 화면 출력 첫 줄을 근거에)", "오류 없이 끝났다(오류가 났으면 그 첫 줄을 근거에)"]);
  }
  // 보고의 근거에 나온 결과 파일 — 파일 목록(/api/files)에 있는 것만(지어낸 경로는 열지 않는다). 결과물(코드 · 문서가 아닌 것) → 코드 → docs/ · README 차례, 3개까지
  function resultFiles(report, files) {
    const text = report && Array.isArray(report.items) ? report.items.map((x) => String((x && x.evidence) || "")).join("\n") : "";
    if (!text || !Array.isArray(files)) return [];
    // 경로 경계로 맞춘다 — 'app.py'가 'src/myapp.py' · 'src/app.py'에 맞지 않게(앞은 줄 처음 · 빈칸 · 따옴표 · 괄호 · './', 뒤는 끝 · 빈칸 · 문장 부호)
    // 뒤 경계는 경로에 쓰지 않는 글자 — 'out/a.html이 생겼어요'처럼 조사가 바로 붙어도 찾는다(F-166-18). 앞은 전처럼
    const pat = (p) => new RegExp(`(?:^|[\\s'"\`(「]|\\./)${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^A-Za-z0-9_./-])`, "m");
    const at = (p) => pat(p).test(text);
    const hit = files.map((f, i) => ({ ...f, i })).filter((f) => f && !f.dir && typeof f.path === "string" && f.path.length > 2 && at(f.path));
    const docLike = (f) => /^docs\//.test(f.path) || /^readme\.md$/i.test(f.path);
    // F-166-18(2026-11-07 사용자 시험 셋째): '결과가 나왔다'(둘째 기준)의 근거에 적힌 파일이 맨 앞 — 첫 기준의 근거에 든 입력 파일(example/members.csv)이 결과(out/2026-11.html)보다 먼저 열렸다
    const outText = report.items[1] && report.items[1].evidence ? String(report.items[1].evidence) : "";
    const inOut = (f) => !!outText && pat(f.path).test(outText);
    const rank = (f) => (docLike(f) ? 2 : inOut(f) ? -1 : CODE_RE.test(f.path) ? 1 : 0);   // 문서는 그대로 뒤
    return hit.sort((a, b) => rank(a) - rank(b) || a.i - b.i).slice(0, 3).map((f) => ({ i: f.i, path: f.path }));
  }

  const api = { TEXT_MAX, features, digest, skeletonTask, lineTask, runTask, resultFiles };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.FloeBuild = api;
})(typeof window !== "undefined" ? window : globalThis);
