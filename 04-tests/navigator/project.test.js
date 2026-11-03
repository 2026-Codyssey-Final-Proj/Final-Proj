// claude-drafted: 2026-10-24 — C-31 시작하는 자리(이재엽 "C-31부터 만들어줘" · 버튼 "Floe 앱이 바로" · "홈/Floe/이름"). 코드보다 먼저 썼다(code.md 1번).
// 03-backend/navigator/project.js — 작업 폴더 만들기 · 내 GitHub 저장소 가져오기(clone)의 순수 규칙과, 명령을 부르는 자리(run을 바꿔 끼워 진짜 git · gh는 부르지 않는다).
// 진짜 clone은 맨 아래 한 번 — 이 컴퓨터에 만든 빈 저장소(file://)로만. GitHub에는 닿지 않는다.
// 실행: node --test 04-tests/navigator/project.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const P = require("../../03-backend/navigator/project.js");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-project-"));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

test("이름: 영문 · 숫자 · - _ . 로 1~100자, 점 · 하이픈으로 시작하지 않는다 — 안 되면 쉬운 말 한 줄", () => {
  for (const ok of ["test-1", "club_app", "A.b", "x"]) assert.equal(P.badName(ok), "", ok);
  assert.match(P.badName(""), /이름을 적어/);
  assert.match(P.badName("동아리 앱"), /영문/);
  assert.match(P.badName("con"), /폴더 이름으로 쓸 수 없어요/, "장치 이름은 왜 안 되는지 따로 말한다");
  for (const bad of [".hidden", "-x", "..", "a b", "a/b", "a\\b", "x".repeat(101), "app.", "CON", "nul.txt", "com1"]) assert.notEqual(P.badName(bad), "", bad);   // 끝 점 · Windows 장치 이름도(2026-10-24 리뷰)
});

test("작업 폴더 자리: 홈/Floe/이름 (이재엽 버튼 2026-10-24)", () => {
  assert.equal(P.BASE, "Floe");
  assert.equal(P.folderFor("/Users/me", "test-1"), path.join("/Users/me", "Floe", "test-1"));
});

test("저장소 알아보기: owner/repo · GitHub 주소(https · git@) · .git 꼬리 · 하위 주소 — GitHub가 아니거나 모양이 틀리면 null, 주소 안의 토큰은 버린다", () => {
  const want = { owner: "gamercross", repo: "test-1", web: "https://github.com/gamercross/test-1" };
  for (const s of ["gamercross/test-1", " gamercross/test-1 ", "https://github.com/gamercross/test-1", "https://github.com/gamercross/test-1.git",
    "git@github.com:gamercross/test-1.git", "https://github.com/gamercross/test-1/tree/main", "github.com/gamercross/test-1"]) assert.deepEqual(P.parseRepo(s), want, s);
  const tok = P.parseRepo("https://ghp_abc123@github.com/gamercross/test-1");
  assert.deepEqual(tok, want, "토큰 칸은 남기지 않는다");
  for (const bad of ["", "test-1", "a/b/c", "https://gitlab.com/a/b", "../x/y", "a b/c", "owner/", "/repo", "-u/x", "owner/-x", "https://github.com/-u/x"]) assert.equal(P.parseRepo(bad), null, bad);   // '-'로 시작하면 gh가 옵션으로 읽는다(2026-10-24 리뷰)
});

test("가져오는 명령: gh repo clone — 셸 없이 인자 배열, 이름은 우리가 owner/repo로 다시 만든다", () => {
  assert.deepEqual(P.cloneCommand({ owner: "gamercross", repo: "test-1" }, "/Users/me/Floe/test-1"), ["gh", ["repo", "clone", "gamercross/test-1", "/Users/me/Floe/test-1"]]);
});

test("내 저장소 목록: gh repo list --json의 답에서 owner/repo · 비공개만, 모양이 틀린 줄은 버린다", () => {
  const out = JSON.stringify([{ nameWithOwner: "gamercross/test-1", isPrivate: false }, { nameWithOwner: "gamercross/secret", isPrivate: true }, { nameWithOwner: "x y/z" }, { nope: 1 }]);
  assert.deepEqual(P.parseRepoList(out), [{ name: "gamercross/test-1", private: false }, { name: "gamercross/secret", private: true }]);
  for (const bad of ["", "{깨짐", "{}", "null"]) assert.deepEqual(P.parseRepoList(bad), [], bad);
  assert.deepEqual(P.REPO_LIST_ARGS, ["repo", "list", "--limit", "30", "--json", "nameWithOwner,isPrivate"]);
});

// run(cmd, args, opts) → Promise<{ code, out }> — 시험은 가짜를 끼운다
const fakeRun = (answers) => { const calls = []; const run = async (cmd, args, opts) => { calls.push([cmd, args, opts]); const a = answers.shift(); return typeof a === "function" ? a(cmd, args, opts) : a || { code: 0, out: "" }; }; run.calls = calls; return run; };

test("새로 만들기: 홈/Floe/이름에 빈 폴더 — 없으면 만들고, 비어 있으면 그대로, 뭔가 있으면 멈추고 말한다", async () => {
  const home = path.join(TMP, "home-new");
  const a = await P.newFolder(home, "club-app");
  assert.deepEqual(a, { ok: true, dir: path.join(home, "Floe", "club-app"), name: "club-app", made: true });
  assert.ok(fs.statSync(a.dir).isDirectory());
  assert.deepEqual(await P.newFolder(home, "club-app"), { ok: true, dir: a.dir, name: "club-app", made: false }, "빈 폴더는 그대로 쓴다");
  fs.writeFileSync(path.join(a.dir, "x.txt"), "x");
  const full = await P.newFolder(home, "club-app");
  assert.equal(full.ok, false); assert.match(full.message, /이미 같은 이름의 폴더/);
  const bad = await P.newFolder(home, "동아리");
  assert.equal(bad.ok, false); assert.match(bad.message, /영문/);
});

test("가져오기: 홈/Floe/저장소이름으로 — 명령을 셸 없이 · 비밀번호를 묻지 않게 · 시간 제한, 실패하면 까닭을 쉬운 말로", async () => {
  const home = path.join(TMP, "home-clone");
  const run = fakeRun([{ code: 0, out: "true" }, { code: 0, out: "" }]);
  const r = await P.cloneRepo(home, "https://github.com/gamercross/test-1", { ghReady: true, run });
  assert.deepEqual(r, { ok: true, dir: path.join(home, "Floe", "test-1"), name: "test-1", repo: "gamercross/test-1", made: true, config: false });
  assert.deepEqual(run.calls[0].slice(0, 2), ["gh", ["api", "repos/gamercross/test-1", "--jq", ".permissions.push"]], "먼저 내가 쓸 수 있는 저장소인지");
  const [cmd, args, opts] = run.calls[1];
  assert.equal(cmd, "gh"); assert.deepEqual(args, ["repo", "clone", "gamercross/test-1", r.dir]);
  assert.equal(opts.env.GIT_TERMINAL_PROMPT, "0"); assert.equal(opts.env.GH_PROMPT_DISABLED, "1");
  assert.ok(opts.timeout >= 60000 && opts.timeout <= 300000, "시간 제한");
  assert.equal(opts.cwd, path.join(home, "Floe"), "부모 폴더(홈/Floe)는 앱이 먼저 만든다");
  assert.ok(fs.statSync(opts.cwd).isDirectory());

  assert.match((await P.cloneRepo(home, "gitlab.com/a/b", { run: fakeRun([]) })).message, /GitHub 저장소 주소/);
  for (const bad of ["a/con", "a/nul.txt", "a/x."]) assert.match((await P.cloneRepo(home, bad, { ghReady: true, run: fakeRun([{ code: 0, out: "true" }]) })).message, /폴더 이름으로 쓸 수 없어요/, `${bad} — Windows 장치 이름 · 끝 점(2차 리뷰)`);
  const fail = await P.cloneRepo(path.join(TMP, "home-fail"), "gamercross/nope", { ghReady: true, run: fakeRun([{ code: 0, out: "true" }, { code: 128, out: "" }]) });
  assert.equal(fail.ok, false); assert.match(fail.message, /가져오지 못했어요/);
  const nogh = fakeRun([]);
  const off = await P.cloneRepo(path.join(TMP, "home-nogh"), "gamercross/test-1", { ghReady: false, run: nogh });
  assert.equal(off.ok, false); assert.match(off.message, /로그인/); assert.equal(nogh.calls.length, 0, "로그인 전에는 아무것도 부르지 않는다");
});

// 2026-10-24 리뷰 — `claude -p`는 폴더를 믿는지 묻지 않는다(Claude Code 보안 문서 "A -p session shows neither prompt"). 남의 저장소를 가져와 맡기면 그 저장소의 설정 · 훅이 확인 없이 돈다
test("가져오기는 내가 쓸 수 있는(push) 저장소만 — 남의 저장소는 가져오지 않고 fork하라고 말한다", async () => {
  for (const out of ["false", "", "null"]) {
    const run = fakeRun([{ code: 0, out }]);
    const r = await P.cloneRepo(path.join(TMP, `home-other-${out || "empty"}`), "someone/assignment", { ghReady: true, run });
    assert.equal(r.ok, false, out); assert.match(r.message, /fork/); assert.equal(run.calls.length, 1, "clone은 부르지 않는다");
  }
  const notFound = await P.cloneRepo(path.join(TMP, "home-404"), "gamercross/nope", { ghReady: true, run: fakeRun([{ code: 1, out: "" }]) });
  assert.match(notFound.message, /찾지 못했어요|쓸 수 있는/);
});

test("가져온 저장소에 Claude Code 설정(.claude/settings.json · .mcp.json)이 있으면 config: true — 화면이 알린다", async () => {
  const home = path.join(TMP, "home-config"), dir = path.join(home, "Floe", "cfg");
  const run = fakeRun([{ code: 0, out: "true" }, () => { fs.mkdirSync(path.join(dir, ".claude"), { recursive: true }); fs.writeFileSync(path.join(dir, ".claude", "settings.json"), "{}"); return { code: 0, out: "" }; }]);
  assert.equal((await P.cloneRepo(home, "gamercross/cfg", { ghReady: true, run })).config, true);
  assert.equal(P.hasClaudeConfig(dir), true);
  const local = path.join(home, "Floe", "loc");
  const run2 = fakeRun([{ code: 0, out: "true" }, () => { fs.mkdirSync(path.join(local, ".claude"), { recursive: true }); fs.writeFileSync(path.join(local, ".claude", "settings.local.json"), "{}"); return { code: 0, out: "" }; }]);
  assert.equal((await P.cloneRepo(home, "gamercross/loc", { ghReady: true, run: run2 })).config, true, "저장소에 커밋돼 온 settings.local.json도(가져온 직후에만 본다 — 그 뒤로는 Floe가 만든 파일이다)");
  assert.equal(P.hasClaudeConfig(local), false, "있는 폴더를 볼 때는 settings.local.json을 세지 않는다(Floe가 연결하며 만든다)");
  const plain = path.join(TMP, "plain-cfg"); fs.mkdirSync(plain); fs.writeFileSync(path.join(plain, ".mcp.json"), "{}");
  assert.equal(P.hasClaudeConfig(plain), true);
  fs.rmSync(path.join(plain, ".mcp.json")); assert.equal(P.hasClaudeConfig(plain), false);
});

test("가져오기: 같은 자리에 이미 그 저장소가 있으면 다시 받지 않고 그대로 쓴다 · 다른 것이 있으면 멈춘다", async () => {
  const home = path.join(TMP, "home-again"), dir = path.join(home, "Floe", "test-1");
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, "README.md"), "# t");
  const same = fakeRun([{ code: 0, out: "true" }, { code: 0, out: "https://github.com/gamercross/test-1.git" }, { code: 0, out: "abc123" }]);
  const r = await P.cloneRepo(home, "gamercross/test-1", { ghReady: true, run: same });
  assert.deepEqual(r, { ok: true, dir, name: "test-1", repo: "gamercross/test-1", made: false, config: false });
  assert.deepEqual(same.calls[1].slice(0, 2), ["git", ["remote", "get-url", "origin"]], "원격만 읽고 clone은 부르지 않는다");
  assert.deepEqual(same.calls[2].slice(0, 2), ["git", ["rev-parse", "--verify", "-q", "HEAD"]], "다 받은 폴더인지(F-144-7)");
  assert.equal(same.calls.length, 3);
  const other = await P.cloneRepo(home, "gamercross/test-1", { ghReady: true, run: fakeRun([{ code: 0, out: "true" }, { code: 0, out: "git@github.com:someone/else.git" }]) });
  assert.equal(other.ok, false); assert.match(other.message, /이미 같은 이름의 폴더/);
});

test("내 저장소 목록 읽기: gh에 로그인하지 않았으면 부르지 않고 빈 목록", async () => {
  const run = fakeRun([{ code: 0, out: JSON.stringify([{ nameWithOwner: "gamercross/test-1", isPrivate: false }]) }]);
  assert.deepEqual(await P.myRepos({ ghReady: true, run }), [{ name: "gamercross/test-1", private: false }]);
  assert.deepEqual(run.calls[0].slice(0, 2), ["gh", P.REPO_LIST_ARGS]);
  const none = fakeRun([]);
  assert.deepEqual(await P.myRepos({ ghReady: false, run: none }), []); assert.equal(none.calls.length, 0);
});

test("진짜로 한 번(git이 있을 때만): 이 컴퓨터의 빈 저장소를 run 기본값으로 가져온다 — 셸 없음 · 끝 코드 0", { skip: spawnSync("git", ["--version"]).status !== 0 && "git 없음" }, async () => {
  const src = path.join(TMP, "src-repo");
  fs.mkdirSync(src);
  for (const a of [["init", "-q", "-b", "main"], ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "first"]]) assert.equal(spawnSync("git", a, { cwd: src }).status, 0);
  const r = await P.runCommand("git", ["clone", "-q", "--", `file://${src}`, path.join(TMP, "dst")], { cwd: TMP, timeout: 20000, env: P.quietEnv() });
  assert.equal(r.code, 0);
  assert.ok(fs.existsSync(path.join(TMP, "dst", ".git")));
  assert.equal((await P.runCommand("no-such-command-floe", [], { cwd: TMP, timeout: 2000, env: P.quietEnv() })).missing, true);
});

test("이 컴퓨터의 설정(.claude/settings.local.json — 훅 경로가 든다)은 올리지 않게: git 저장소면 .git/info/exclude에 한 줄, 이미 있으면 그대로, git이 아니면 아무것도 안 한다", () => {
  const dir = path.join(TMP, "excl");
  fs.mkdirSync(path.join(dir, ".git", "info"), { recursive: true });
  assert.equal(P.excludeLocal(dir), true);
  assert.equal(P.excludeLocal(dir), true);
  const lines = fs.readFileSync(path.join(dir, ".git", "info", "exclude"), "utf8").split("\n").filter((l) => l === P.LOCAL_SETTINGS);
  assert.equal(lines.length, 1, "한 번만");
  assert.equal(P.LOCAL_SETTINGS, ".claude/settings.local.json*", "다시 연결할 때 생기는 백업(.bak-시각)도 — 2026-10-24 리뷰");
  const plain = path.join(TMP, "plain"); fs.mkdirSync(plain);
  assert.equal(P.excludeLocal(plain), false); assert.equal(fs.existsSync(path.join(plain, ".git")), false);
  fs.mkdirSync(path.join(TMP, "gitfile")); fs.writeFileSync(path.join(TMP, "gitfile", ".git"), "gitdir: /elsewhere");
  assert.equal(P.excludeLocal(path.join(TMP, "gitfile")), false, "작업 폴더(worktree)의 .git 파일은 건드리지 않는다");
});

test("gh 준비: gh auth status가 0이면 준비됨 — 기다리는 동안 앱이 멈추지 않게 run(비동기)으로", async () => {
  const yes = fakeRun([{ code: 0, out: "" }]);
  assert.equal(await P.ghReady(yes), true);
  assert.deepEqual(yes.calls[0].slice(0, 2), ["gh", ["auth", "status", "--hostname", "github.com"]]);
  assert.equal(await P.ghReady(fakeRun([{ code: 1, out: "" }])), false);
  assert.equal(await P.ghReady(fakeRun([{ code: -1, out: "", missing: true }])), false);
});
