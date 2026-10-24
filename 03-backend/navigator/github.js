// claude-drafted: 2026-10-24 — 이재엽 "지금 깃허브을 연동하는 곳을 설정창에 만들어줘" (C-25 내 GitHub 저장소).
// 설정 창의 GitHub 칸이 묻는 "연결한 프로젝트 폴더가 GitHub 저장소와 이어져 있나"를 답한다 — 서버가 GET /api/github으로 내준다(API.md 3-19).
// Floe는 GitHub 토큰을 받지도 두지도 않는다. 이 컴퓨터의 git · gh(GitHub CLI)에게 **읽기만** 묻는다:
//   git rev-parse(저장소인가) · git remote get-url origin(어디로 올리나) · gh --version(있나) · gh auth status(로그인했나 — 0이면 됨).
// 저장소를 만들고 올리는 일은 Floe가 하지 않고 사용자의 Claude Code에 맡긴다(C-25 정함 2026-10-23) — 맡길 글은 createRequest가 만든다.
// 내주지 않는 것: 폴더 경로 · GitHub 계정 이름 · 원격 주소 안의 비밀번호나 토큰(https://토큰@github.com/… 모양이면 떼고 보인다).
// AI를 부르지 않는다 — navigator.test.js "provider.js 한 곳에서만"이 이 파일에 AI 말이 없는지 따로 본다.
"use strict";
const { spawnSync } = require("node:child_process");

const TIMEOUT_MS = 4000;
// 셸 없이 · 창 없이 · 비밀번호를 묻지 않게(GIT_TERMINAL_PROMPT=0, GH_PROMPT_DISABLED) · 시간 제한. 끝 코드와 첫 줄만 쓴다
function runner(run = spawnSync) {
  return (cmd, args, cwd) => {
    try {
      const r = run(cmd, args, { cwd, encoding: "utf8", timeout: TIMEOUT_MS, windowsHide: true, shell: false,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1" } });
      if (!r || r.error) return { found: !(r && r.error && r.error.code === "ENOENT"), code: -1, out: "" };
      return { found: true, code: r.status, out: String(r.stdout || "").trim().split(/\r?\n/)[0] || "" };
    } catch { return { found: false, code: -1, out: "" }; }
  };
}

// 원격 주소 → { kind: github | other, owner, repo, web }. 비밀번호 · 토큰 칸은 버리고, 웹 주소는 github.com일 때만 만든다
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;
function parseRemote(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  let host = "", p = "";
  const scp = u.match(/^(?:[^@/\s]+@)?([^:/\s]+):(?!\/)(.+)$/);   // git@github.com:owner/repo.git
  if (/^[a-z+]+:\/\//i.test(u)) {
    try { const x = new URL(u); host = x.hostname; p = x.pathname; } catch { return { kind: "other", owner: "", repo: "", web: "" }; }
  } else if (scp) { host = scp[1]; p = scp[2]; }
  else return { kind: "other", owner: "", repo: "", web: "" };   // 이 컴퓨터의 폴더 같은 원격
  const [owner, repo0] = p.replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  const repo = String(repo0 || "").replace(/\.git$/, "");
  if (host.toLowerCase() !== "github.com" || !NAME.test(owner || "") || !NAME.test(repo)) return { kind: "other", owner: "", repo: "", web: "" };
  return { kind: "github", owner, repo, web: `https://github.com/${owner}/${repo}` };
}

// /api/github의 답 — dir은 서버가 훅 알림에서 고른 폴더(화면이 보낸 경로는 받지 않는다). 경로는 답에 넣지 않는다
function status(dir, project, run = runner()) {
  const gh = run("gh", ["--version"]);
  const auth = gh.found && gh.code === 0 ? run("gh", ["auth", "status", "--hostname", "github.com"]) : { code: -1 };
  const base = { ok: true, project: project || "", gh: { found: gh.found && gh.code === 0, signedIn: gh.found && gh.code === 0 ? auth.code === 0 : null } };
  if (!dir) return { ...base, git: false, remote: null, why: "folder" };
  const inside = run("git", ["rev-parse", "--is-inside-work-tree"], dir);
  if (!inside.found) return { ...base, git: false, remote: null, why: "no-git" };   // git 명령이 없다
  if (inside.code !== 0 || inside.out !== "true") return { ...base, git: false, remote: null, why: "not-repo" };
  const r = run("git", ["remote", "get-url", "origin"], dir);
  const remote = r.code === 0 ? parseRemote(r.out) : null;
  return { ...base, git: true, remote, why: remote ? "" : "no-remote" };
}

// 저장소 만들기를 Claude Code에 맡길 글 — 사람이 '맡기기'를 누를 때만 서버가 일 넘기기(3-16)로 보낸다. 기본은 비공개(C-25 ④ 제안)
const VIS = ["private", "public"];
function createRequest(project, visibility = "private") {
  const vis = VIS.includes(visibility) ? visibility : "private";
  const name = String(project || "").replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 100) || "my-floe-project";
  return [
    `이 폴더를 내 GitHub의 ${vis === "private" ? "비공개" : "공개"} 저장소로 만들어 주세요.`,
    "1. git 저장소가 아니면 git init 하고, 기본 가지 이름은 main으로 해요.",
    "2. README.md가 없으면 첫 장을 만들어요 — 맨 위 `# 프로젝트 이름`, 그 아래 한 줄 소개, 그리고 `## 버전` 절에 `- V.1 · 오늘 날짜 · 저장소를 만듦` 한 줄.",
    "3. .env · *.pem · 키나 비밀번호가 든 파일은 .gitignore에 넣고 올리지 않아요. 그런 파일이 보이면 무엇을 뺐는지 알려 줘요.",
    "4. README.md · .gitignore와 지금 파일을 첫 커밋으로 묶어요(커밋이 이미 있으면 건너뛰어요).",
    `5. gh repo create ${name} --${vis} --source . --remote origin --push 로 만들고 올려요. 같은 이름이 있으면 멈추고 물어봐요.`,
    "6. 강제 푸시 · 파일 지우기는 하지 않아요. 끝나면 저장소 주소를 한 줄로 알려 줘요.",
  ].join("\n");
}

module.exports = { parseRemote, status, runner, createRequest, VIS, TIMEOUT_MS };
