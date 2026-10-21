// claude-drafted: 2026-10-19 — 이재엽 결정(인수인계 2026-10-19 4절 예방 제안 1번을 버튼으로 "Go"): PR마다 CHANGELOG 맨 위 한 줄을 고치면
// 동시에 열린 PR이 반드시 같은 줄에서 부딪친다(10/19 하루에 PR 넷이 v4.0을 골랐다). 그래서 PR은 `changes/<브랜치>.md` 조각 파일 하나만 두고,
// main에 올라오면(.github/workflows/jira-release.yml) 이 스크립트가 조각을 CHANGELOG.md 맨 위 버전의 **다음 번호**로 합쳐 넣고 조각을 지운다.
// 버전은 "올린 사람이 고른다"에서 "병합될 때 정해진다"로 바뀐다 — 조각의 `종류`(큰 묶음 → N+1.0, 작은 고침 → M+1)만 사람이 고른다.
// 조각끼리는 파일이 달라 부딪치지 않는다. 날짜는 한국 시간. 병합 커밋의 "Merge pull request #N from …/<브랜치>"에서 PR 번호를 찾아 "무엇" 끝에 (#N)을 붙인다 —
// 이번 push의 커밋뿐 아니라 지난 병합 커밋(git log, io.history)도 본다: Action이 생기기 전에 병합된 조각이나 앞 실행이 실패해 남은 조각도 제 PR 번호를 받게.
// 네트워크 없음, 비밀값 없음. 시험: 04-tests/repo/changelog-fold.test.js
"use strict";

const KINDS = { "큰 묶음": "major", "작은 고침": "minor" };
const KEYS = ["종류", "누가", "무엇", "건드린 곳"];
const ROW = /^\| v(\d+)\.(\d+) \| (\d{4}-\d{2}-\d{2}) \|/;

// 조각 파일 한 장 → {kind, who, what, where} — 네 줄 `키: 값`. 빠지거나 `|`가 섞이면 이유를 돌려준다(표 칸이 깨지므로)
function parseFragment(text) {
  const got = {};
  for (const line of String(text || "").split("\n")) {
    const m = /^([^:：]+)[:：]\s*(.*)$/.exec(line.trim());
    if (m && KEYS.includes(m[1].trim()) && !(m[1].trim() in got)) got[m[1].trim()] = m[2].trim();
  }
  const missing = KEYS.filter((k) => !got[k]);
  if (missing.length) return { error: `빠진 줄: ${missing.join(", ")}` };
  if (!KINDS[got["종류"]]) return { error: `종류는 '큰 묶음' 또는 '작은 고침' — 지금: ${got["종류"]}` };
  const bar = KEYS.find((k) => got[k].includes("|"));
  if (bar) return { error: `'${bar}'에 | 가 있다 — 표 칸이 깨진다` };
  return { kind: KINDS[got["종류"]], who: got["누가"], what: got["무엇"], where: got["건드린 곳"] };
}

// CHANGELOG 맨 위 버전 → 다음 번호
function nextVersion(changelog, kind) {
  const m = String(changelog || "").split("\n").map((l) => ROW.exec(l)).find(Boolean);
  if (!m) return null;
  const n = Number(m[1]), mm = Number(m[2]);
  return kind === "major" ? `v${n + 1}.0` : `v${n}.${mm + 1}`;
}

// 한국 시간 날짜 YYYY-MM-DD
function kstDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// 병합 커밋 메시지 → {브랜치 끝 이름: PR 번호}. squash 커밋("제목 (#12)")은 브랜치를 모르니 "*"에 모은다
function prNumbers(messages) {
  const byBranch = {}, all = [];
  for (const msg of messages || []) {
    const s = String(msg || "");
    const merge = /^Merge pull request #(\d+) from [^/\s]+\/(\S+)/.exec(s);
    if (merge) { byBranch[merge[2].split("/").pop()] = merge[1]; all.push(merge[1]); continue; }
    const squash = /\(#(\d+)\)\s*$/m.exec(s.split("\n")[0]);
    if (squash) all.push(squash[1]);
  }
  return { byBranch, all: [...new Set(all)] };
}

// 조각들을 CHANGELOG에 넣은 새 본문. fragments: [{name, text}] (name = 파일 이름에서 .md를 뗀 것 = 브랜치 끝 이름). 이름순으로 차례로 번호를 받는다
function fold(changelog, fragments, { date = kstDate(), prs = { byBranch: {}, all: [] } } = {}) {
  let text = String(changelog || "");
  const rows = [], errors = [];
  const sorted = [...fragments].sort((a, b) => a.name.localeCompare(b.name, "en"));
  for (const f of sorted) {
    const p = parseFragment(f.text);
    if (p.error) { errors.push(`${f.name}: ${p.error}`); continue; }
    const version = nextVersion(text, p.kind);
    if (!version) { errors.push(`${f.name}: CHANGELOG.md에 버전 줄이 없어 다음 번호를 못 정함`); continue; }
    const pr = prs.byBranch[f.name] || (sorted.length === 1 && prs.all.length ? prs.all.join(", #") : null);
    // 끝에 있는 (#n) · (#n, #m)만 이미 붙은 번호로 본다 — 가운데에 다른 PR을 적은 줄도 제 번호를 받게(F-48)
    const what = pr && !/\(#\d+[^)]*\)\s*$/.test(p.what) ? `${p.what} (#${pr})` : p.what;
    const row = `| ${version} | ${date} | ${p.who} | ${what} | ${p.where} |`;
    const lines = text.split("\n"), at = lines.findIndex((l) => ROW.test(l));
    lines.splice(at, 0, row);
    text = lines.join("\n");
    rows.push({ name: f.name, version, row });
  }
  return { text, rows, errors };
}

// 실제 저장소에서: changes/*.md(README.md 빼고) 읽어 합치고 조각을 지운다. 돌려주는 값은 GitHub 출력용
function run(io) {
  const names = io.list("changes").filter((n) => n.endsWith(".md") && n.toLowerCase() !== "readme.md");
  if (!names.length) { io.log("조각 파일(changes/*.md) 없음 — CHANGELOG는 그대로"); return 0; }
  let event = {};
  try { event = JSON.parse(io.read(io.eventPath || "") || "{}"); } catch {}
  const prs = prNumbers((event.commits || []).map((c) => c && c.message));
  const past = prNumbers(io.history ? io.history() : []);
  prs.byBranch = { ...past.byBranch, ...prs.byBranch };   // 브랜치 이름으로만 빌려 온다 — "조각 하나 = 이 push의 PR" 추정(all)은 이번 push만
  const fragments = names.map((n) => ({ name: n.replace(/\.md$/, ""), text: io.read(`changes/${n}`) }));
  const r = fold(io.read("CHANGELOG.md"), fragments, { prs });
  for (const e of r.errors) io.log(`::error::조각 파일이 이상해요 — ${e} (changes/README.md)`);
  if (r.rows.length) {
    io.write("CHANGELOG.md", r.text);
    for (const row of r.rows) { io.remove(`changes/${row.name}.md`); io.log(`${row.version} ← changes/${row.name}.md`); }
  }
  return r.errors.length ? 1 : 0;
}

module.exports = { parseFragment, nextVersion, kstDate, prNumbers, fold, run };

if (require.main === module) {
  const fs = require("node:fs");
  const { execFileSync } = require("node:child_process");
  const io = {
    eventPath: process.env.GITHUB_EVENT_PATH,
    history: () => { try { return execFileSync("git", ["log", "--format=%s", "-n", "200"], { encoding: "utf8" }).split("\n"); } catch { return []; } },
    list: (d) => { try { return fs.readdirSync(d); } catch { return []; } },
    read: (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } },
    write: (p, t) => fs.writeFileSync(p, t),
    remove: (p) => fs.rmSync(p, { force: true }),
    log: (s) => console.log(s),
  };
  process.exitCode = run(io);
}
