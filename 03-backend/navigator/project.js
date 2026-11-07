// claude-drafted: 2026-10-24 — C-31 시작하는 자리(이재엽 "C-31부터 만들어줘" · "내 테스트 레포는 https://github.com/gamercross/test-1").
// 작업 폴더를 정하는 두 길 — ① 새로 만들기: 홈/Floe/이름에 빈 폴더 ② 내 GitHub 저장소 가져오기: 홈/Floe/저장소이름으로 clone.
// 버튼 2026-10-24: 가져오기는 "Floe 앱이 바로"(토큰 0 — GitHub에는 아무것도 바꾸지 않는다), 자리는 "홈/Floe/이름". 저장소 만들기 · 커밋은 여전히 사용자의 Claude Code(C-25).
// 가져오기는 **내가 쓸 수 있는(push) 저장소만**(2026-10-24 리뷰): Floe가 맡기는 `claude -p`는 폴더를 믿는지 묻지 않는다(Claude Code 보안 문서 "A -p session shows neither prompt") —
// 남의 저장소를 받아 맡기면 그 저장소의 .claude 설정 · 훅 · .mcp.json이 확인 없이 내 컴퓨터에서 돈다. 남의 저장소는 내 계정으로 fork한 뒤 가져온다. 그래서 gh 로그인이 먼저다.
// 앱(Electron main.js)만 부른다 — 화면은 이름이나 주소 글만 보내고, 경로는 여기서 만든다. 서버 주소(HTTP)로는 열지 않는다(브라우저 · 다른 프로그램이 폴더를 만들지 못하게).
// 명령은 셸 없이 · 창 없이 · 비밀번호를 묻지 않게(GIT_TERMINAL_PROMPT=0 · GH_PROMPT_DISABLED) · 시간 제한. Floe는 GitHub 토큰을 받지도 두지도 않는다(gh · git이 자기 것을 쓴다).
// AI를 부르지 않는다. 시험: 04-tests/navigator/project.test.js
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const GH = require("./github.js");

const BASE = "Floe";
const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/;
const WIN_DEVICE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;   // Windows에서 폴더 이름으로 못 쓰는 장치 이름
const NO_FOLDER_NAME = "그 이름은 폴더 이름으로 쓸 수 없어요(CON · NUL 같은 이름이나 끝이 점인 이름) — 다른 이름을 적어요";
const CLONE_MS = 180000, LIST_MS = 15000, OUT_MAX = 1024 * 1024;
const REPO_LIST_ARGS = ["repo", "list", "--limit", "30", "--json", "nameWithOwner,isPrivate"];

// 이름이 안 되면 쉬운 말 한 줄, 되면 "" — 저장소 이름으로도 쓰므로 영문 · 숫자 · - _ . 만
function badName(name) {
  const n = String(name || "");
  if (!n.trim()) return "이름을 적어 주세요";
  if (WIN_DEVICE.test(n) || n.endsWith(".")) return NO_FOLDER_NAME;
  if (!NAME.test(n)) return "이름은 영문 · 숫자 · - _ . 로 100자까지 적어요(맨 앞은 영문이나 숫자) — 저장소 이름으로도 써요";
  return "";
}
const folderFor = (home, name) => path.join(home, BASE, name);

// owner/repo · https://github.com/owner/repo(.git · 하위 주소) · git@github.com:owner/repo.git · github.com/owner/repo → { owner, repo, web } | null
// 주소 안의 비밀번호 · 토큰 칸은 버린다(github.js parseRemote와 같은 규칙)
const GH_NAME = /^[A-Za-z0-9_.][A-Za-z0-9_.-]{0,99}$/;   // '-'로 시작하면 gh가 옵션으로 읽는다
const okPart = (s) => GH_NAME.test(s || "") && s !== "." && s !== "..";
function parseRepo(text) {
  const s = String(text || "").trim();
  if (!s) return null;
  const short = s.split("/");
  if (!/[:@]/.test(s) && !/^github\.com\//i.test(s) && short.length === 2) {
    const [owner, repo] = [short[0], short[1].replace(/\.git$/, "")];
    return okPart(owner) && okPart(repo) ? { owner, repo, web: `https://github.com/${owner}/${repo}` } : null;
  }
  const r = GH.parseRemote(/^github\.com\//i.test(s) ? `https://${s}` : s);
  return r && r.kind === "github" && okPart(r.owner) && okPart(r.repo) ? { owner: r.owner, repo: r.repo, web: r.web } : null;
}

// 가져오는 명령 — gh repo clone(비공개도 받는다). 이름은 우리가 owner/repo로 다시 만든다
const cloneCommand = (r, dest) => ["gh", ["repo", "clone", `${r.owner}/${r.repo}`, dest]];
// 내가 쓸 수 있는 저장소인가 — GitHub가 알려 주는 내 권한(permissions.push). 내 저장소 · 쓰기 권한이 있는 팀 저장소면 true
async function canPush(r, run) {
  const got = await run("gh", ["api", `repos/${r.owner}/${r.repo}`, "--jq", ".permissions.push"], { timeout: LIST_MS, env: quietEnv() });
  return got.code === 0 ? (got.out === "true" ? "yes" : "no") : "unknown";
}
// Claude Code가 그 폴더에서 읽는 설정이 들어 있나 — 있으면 화면이 "맡기면 그 설정이 돌아요"라고 알린다.
// local: .claude/settings.local.json도 본다 — 가져온 **직후**에만(저장소에 커밋돼 온 것. 그 뒤로는 Floe가 연결하며 만든 파일이라 세지 않는다)
const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };
const hasClaudeConfig = (dir, { local = false } = {}) => [".claude/settings.json", ".mcp.json", ...(local ? [".claude/settings.local.json"] : [])].some((f) => isFile(path.join(dir, f)));
function parseRepoList(out) {
  let a; try { a = JSON.parse(String(out || "")); } catch { return []; }
  if (!Array.isArray(a)) return [];
  return a.filter((x) => x && typeof x.nameWithOwner === "string" && parseRepo(x.nameWithOwner)).map((x) => ({ name: x.nameWithOwner, private: !!x.isPrivate }));
}

const quietEnv = () => ({ ...process.env, GIT_TERMINAL_PROMPT: "0", GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1" });
// 기본 run — 셸 없이 · 창 없이 · 시간 제한. 기다리는 동안 앱(메인 프로세스)이 멈추지 않게 spawn으로. { code, out(앞 1MB를 다듬은 것), missing: 명령이 없음 }
//   F-144-7(2026-11-03): 시간 초과면 나무째 끈다(provider.js killTree — Windows taskkill /T). 전에는 gh만 끝나 그 밑의 git clone이 계속 받았다. kill — 시험에서 바꿔 끼운다
const killTree = (child) => require("./provider.js").killTree(child);
function runCommand(cmd, args, { cwd, timeout = LIST_MS, env = quietEnv(), kill = killTree } = {}) {
  return new Promise((resolve) => {
    let out = "", done = false, timer = null;   // timer를 먼저 — spawn이 바로 던지면 end가 선언 전의 timer를 읽어 ReferenceError였다(F-104-9)
    const end = (r) => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
    let child;
    try { child = spawn(cmd, args, { cwd, env, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }); }
    catch { return end({ code: -1, out: "", missing: true }); }
    timer = setTimeout(() => { try { kill(child); } catch {} end({ code: -1, out: "", timeout: true }); }, timeout);
    child.stdout.setEncoding("utf8");   // 조각 경계의 한글이 깨지지 않게(F-144-6과 같은 까닭)
    child.stdout.on("data", (d) => { if (out.length < OUT_MAX) out += d; });
    child.on("error", (e) => end({ code: -1, out: "", missing: e && e.code === "ENOENT" }));
    child.on("close", (code) => end({ code: code == null ? -1 : code, out: out.trimEnd() }));   // 끝만 — 앞 공백은 뜻이 있다(git status --porcelain의 ' M'). 전에는 trim이라 첫 파일 이름의 첫 글자가 잘렸다(F-104-8)
  });
}

// git status --porcelain -z의 경로들 — 칸마다 'XY 경로', 이름 바꿈 · 복사(R · C)는 다음 칸이 옛 이름이라 건너뛴다(F-144-26, 2026-11-03).
//   전에는 칸마다 앞 세 글자를 떼어 옛 이름 칸('docs/old.md')이 's/old.md'로 들어갔다
function porcelainPaths(out) {
  const parts = String(out || "").split("\0"), paths = [];
  for (let i = 0; i < parts.length; i++) {
    const e = parts[i]; if (e.length < 4) continue;
    paths.push(e.slice(3));
    if (/[RC]/.test(e.slice(0, 2))) i++;
  }
  return paths;
}

// 폴더 상태 — none: 없음 · empty: 빈 폴더 · full: 뭔가 있음 · file: 폴더가 아님
function folderState(dir) {
  try {
    const st = fs.lstatSync(dir);
    if (!st.isDirectory()) return "file";
    return fs.readdirSync(dir).filter((n) => n !== ".git").length ? "full" : "empty";   // .git만 있으면 빈 폴더 — 새로 만들기가 git init 한다(F-166-9)
  } catch { return "none"; }
}
const TAKEN = "이미 같은 이름의 폴더가 있어요 — 다른 이름을 적거나, '이 컴퓨터에 있는 폴더'로 그 폴더를 골라요";

// ① 새로 만들기 — 홈/Floe/이름. 빈 폴더면 그대로 쓴다
async function newFolder(home, name, { run = runCommand } = {}) {
  const why = badName(name);
  if (why) return { ok: false, message: why };
  const dir = folderFor(home, name), now = folderState(dir);
  if (now === "full" || now === "file") return { ok: false, message: TAKEN };
  if (now === "none") {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { return { ok: false, message: `폴더를 만들지 못했어요(${e.code || "까닭 모름"})` }; }
  }
  // F-166-9(2026-11-07): 새 폴더는 자기 git 저장소로 — 위 폴더(홈 등)가 저장소면 이 폴더의 git 명령이 그 저장소로 가서, 문서 올리기가 남의 저장소에 커밋 · 푸시할 수 있었다.
  //   빈 폴더에만(가져온 저장소 · 있는 폴더는 건드리지 않는다). git이 없거나 실패해도 폴더는 쓴다(저장소 만들기가 나중에 git init 한다)
  if (!fs.existsSync(path.join(dir, ".git"))) { try { await run("git", ["init", "-q", "-b", "main"], { cwd: dir }); } catch {} }
  return { ok: true, dir, name, made: now === "none" };
}

// ② 내 GitHub 저장소 가져오기 — 홈/Floe/저장소이름. 그 자리에 같은 저장소가 이미 있으면 다시 받지 않는다
async function cloneRepo(home, text, { ghReady = false, run = runCommand } = {}) {
  const r = parseRepo(text);
  if (!r) return { ok: false, message: "GitHub 저장소 주소나 '주인/이름'을 적어 주세요 (예: gamercross/test-1)" };
  if (!ghReady) return { ok: false, message: "가져오기는 GitHub에 로그인한 뒤에 할 수 있어요 — 내가 쓸 수 있는 저장소인지 확인해요" };
  const may = await canPush(r, run);
  if (may === "no") return { ok: false, message: "내가 쓸 수 있는 저장소만 바로 가져와요 — 남의 저장소는 안의 설정이 내 컴퓨터에서 돌 수 있어서요. GitHub에서 내 계정으로 fork한 뒤 그 저장소를 가져와요" };
  if (may === "unknown") return { ok: false, message: "그 저장소를 찾지 못했어요 — 이름을 확인해 주세요(내가 쓸 수 있는 저장소만 가져와요)" };
  if (WIN_DEVICE.test(r.repo) || r.repo.endsWith(".")) return { ok: false, message: NO_FOLDER_NAME };
  const dir = folderFor(home, r.repo), repo = `${r.owner}/${r.repo}`, now = folderState(dir);
  if (now === "file") return { ok: false, message: TAKEN };
  if (now === "full") {
    const o = await run("git", ["remote", "get-url", "origin"], { cwd: dir, timeout: LIST_MS, env: quietEnv() });
    const there = o.code === 0 ? parseRepo(o.out) : null;
    const same = there && there.owner.toLowerCase() === r.owner.toLowerCase() && there.repo.toLowerCase() === r.repo.toLowerCase();
    if (!same) return { ok: false, message: TAKEN };
    // 받다 만 폴더(앞에서 시간 초과) — origin은 clone 처음에 적혀 같은 저장소로 보이지만 HEAD가 아직 없다. 성공으로 잇지 않는다(F-144-7)
    const head = await run("git", ["rev-parse", "--verify", "-q", "HEAD"], { cwd: dir, timeout: LIST_MS, env: quietEnv() });
    if (head.code !== 0) {
      // 커밋이 아직 없는 새 저장소는 다 받아도 HEAD가 없다 — 원격에도 브랜치가 없으면(빈 저장소) 그대로 잇는다(F-144-7 새 맥락 리뷰)
      const heads = await run("git", ["ls-remote", "--heads", "origin"], { cwd: dir, timeout: LIST_MS, env: quietEnv() });
      if (!(heads.code === 0 && !String(heads.out || "").trim())) return { ok: false, message: "그 자리의 폴더가 다 받아지지 않았어요 — 폴더를 지운 뒤 다시 가져오거나, '이 컴퓨터에 있는 폴더'로 골라요" };
    }
    return { ok: true, dir, name: r.repo, repo, made: false, config: hasClaudeConfig(dir) };
  }
  const parent = path.dirname(dir);
  try { fs.mkdirSync(parent, { recursive: true }); } catch (e) { return { ok: false, message: `폴더를 만들지 못했어요(${e.code || "까닭 모름"})` }; }
  const [cmd, args] = cloneCommand(r, dir);
  const got = await run(cmd, args, { cwd: parent, timeout: CLONE_MS, env: quietEnv() });
  if (got.missing) return { ok: false, message: "GitHub CLI(gh)를 찾지 못했어요 — 설치한 뒤 다시 해요" };
  if (got.timeout) return { ok: false, message: "가져오는 데 너무 오래 걸려요 — 인터넷 연결을 보고 다시 해요" };
  if (got.code !== 0) return { ok: false, message: "가져오지 못했어요 — 인터넷 연결과 저장소 이름을 확인해 주세요. 이 컴퓨터에 git이 있어야 해요" };
  return { ok: true, dir, name: r.repo, repo, made: true, config: hasClaudeConfig(dir, { local: true }) };
}

// 내 저장소 목록(고르기 단추) — gh에 로그인했을 때만. 저장소 이름 · 비공개만 쓴다
async function myRepos({ ghReady = false, run = runCommand } = {}) {
  if (!ghReady) return [];
  const r = await run("gh", REPO_LIST_ARGS, { timeout: LIST_MS, env: quietEnv() });
  return r.code === 0 ? parseRepoList(r.out) : [];
}

// 이 컴퓨터의 설정(훅 경로가 든 .claude/settings.local.json)은 저장소에 올리지 않게 — git 저장소면 .git/info/exclude(이 컴퓨터에만 있는 무시 목록)에 한 줄.
// 저장소의 .gitignore는 고치지 않는다(사용자의 파일). .git이 폴더가 아니면(작업 폴더 worktree 등) 건드리지 않는다. Claude Code가 커밋할 때 공개 저장소에 내 컴퓨터 경로가 올라가지 않게(2026-10-24)
const LOCAL_SETTINGS = ".claude/settings.local.json*";   // 다시 연결할 때 생기는 백업(settings.local.json.bak-시각)도 — 같은 훅 경로가 든다
function excludeLocal(dir) {
  const git = path.join(dir, ".git");
  try { if (!fs.lstatSync(git).isDirectory()) return false; } catch { return false; }
  const file = path.join(git, "info", "exclude");
  let text = "";
  try { text = fs.readFileSync(file, "utf8"); } catch {}
  if (text.split(/\r?\n/).includes(LOCAL_SETTINGS)) return true;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${text}${text && !text.endsWith("\n") ? "\n" : ""}# Floe — 이 컴퓨터의 설정(훅 경로)은 올리지 않아요\n${LOCAL_SETTINGS}\n`);
    return true;
  } catch { return false; }
}
// gh에 로그인했나 — 0이면 됨. 앱이 기다리는 동안 멈추지 않게 비동기
async function ghReady(run = runCommand) {
  const r = await run("gh", ["auth", "status", "--hostname", "github.com"], { timeout: LIST_MS, env: quietEnv() });
  return r.code === 0;
}

module.exports = { LOCAL_SETTINGS, excludeLocal, ghReady, hasClaudeConfig, BASE, badName, folderFor, parseRepo, cloneCommand, parseRepoList, REPO_LIST_ARGS, quietEnv, runCommand, porcelainPaths, newFolder, cloneRepo, myRepos };
