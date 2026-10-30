"""
F-105 훅 빈틈 — block-dangerous-git · block-claude-main · block-merged-branch-push · check-secrets · require-tests-before-commit · lib.sh · check-mermaid.
claude-drafted: 2026-10-30 (임유정 "내 담당 아닌 것들도 고쳐줘" — 01-docs/07-maintenance/fixes/hooks-bug-hunt.md)
임시 git 저장소에서 실제 훅을 돌린다 — 워크스페이스 자신의 git 상태는 건드리지 않는다.
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from bash_path import BASH

ROOT = Path(__file__).resolve().parents[2]
HOOKS = ROOT / ".claude" / "hooks"
sys.path.insert(0, str(HOOKS))
import gitcmd  # noqa: E402


def _git(repo, *args):
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)


def _repo(branch="main"):
    d = Path(tempfile.mkdtemp())
    _git(d, "init", "-q", "-b", branch)
    _git(d, "config", "user.email", "t@example.com")
    _git(d, "config", "user.name", "t")
    (d / "README.md").write_text("hello\n")
    _git(d, "add", ".")
    _git(d, "commit", "-q", "-m", "init")
    return d


def _hook(name, command, cwd, env=None):
    payload = json.dumps({"tool_input": {"command": command}})
    return subprocess.run([BASH, str(HOOKS / name)], cwd=cwd, input=payload, capture_output=True, text=True,
                          encoding="utf-8", env={**os.environ, **(env or {})})


def test_gitcmd_unwraps_env_shells_and_global_options():
    c = gitcmd.calls('env FOO=1 git -C sub -c a=b push origin main && bash -lc "gh -R o/r pr merge 5"; sudo -E git commit -m x')
    assert [(x["tool"], x["sub"]) for x in c] == [("git", "push"), ("gh", "pr merge"), ("git", "commit")]
    assert c[0]["cwd"] is None and c[0]["args"] == ["origin", "main"], "없는 폴더(-C sub)는 훅이 도는 폴더로 — 막는 쪽"
    assert gitcmd.calls(f'git -C "{ROOT.as_posix()}" commit')[0]["cwd"] == ROOT.as_posix(), "있는 폴더는 그대로"
    assert gitcmd.push_force(["origin", "x", "--force"]) and gitcmd.push_force(["-uf", "origin", "x"])
    assert gitcmd.push_force(["origin", "+x"]) and gitcmd.push_force(["--force-with-lease", "origin", "x"])
    assert not gitcmd.push_force(["-u", "origin", "x"]) and not gitcmd.push_force(["--follow-tags", "origin", "x"])


def test_dangerous_git_blocks_force_push_and_hard_reset_in_any_position():
    r = _repo("feature")
    for c in ["git push origin x --force", "git push -uf origin x", "git push origin +x", "git push --force-with-lease origin x",
              "git -C . push --force", "git reset -q --hard", "git -C . reset --hard HEAD~1", "env git push -f",
              'bash -c "git push --force"', "git -C . clean -fd", "git clean --force"]:
        assert _hook("block-dangerous-git.sh", c, r).returncode == 2, f"안 막음: {c}"
    for c in ["git push -u origin feature", "git reset --soft HEAD~1", "git status", "git clean -n", "git commit -m 'force push 설명'"]:
        assert _hook("block-dangerous-git.sh", c, r).returncode == 0, f"과하게 막음: {c}"
    # 새 맥락 리뷰 — 괄호 · timeout · & 꼴은 잡고, 따옴표 · heredoc 안의 글은 명령으로 보지 않는다
    for c in ["(git reset --hard)", "timeout 60 git push --force", "true & git push -f", "if true; then git clean -fd; fi"]:
        assert _hook("block-dangerous-git.sh", c, r).returncode == 2, f"안 막음: {c}"
    for c in ['git commit -m "a; git reset --hard b"', "cat <<'EOF'\ngit reset --hard\nEOF", "git push origin feature 2>&1"]:
        assert _hook("block-dangerous-git.sh", c, r).returncode == 0, f"과하게 막음: {c!r}"


def test_main_guard_sees_wrapped_and_global_option_forms():
    r = _repo("main")
    for c in ["gh -R o/r pr merge 5", "env git push origin main", 'bash -c "git push origin main"', "git -C . commit -m x",
              "GIT_TRACE=1 git push origin HEAD:main", "gh --repo o/r pr merge 7 --squash",
              'git -C "$PWD" commit -m x', "git -C $(pwd) commit -m x", 'git -C "$PWD" push']:   # 새 맥락 리뷰 막힘 — 풀 수 없는 -C는 훅이 도는 폴더로
        assert _hook("block-claude-main.sh", c, r).returncode == 2, f"안 막음: {c}"
    f = _repo("feature")
    assert _hook("block-claude-main.sh", "git commit -m x && git push -u origin feature", f).returncode == 0
    # 다른 폴더(-C)가 main이면 그 폴더를 본다
    assert _hook("block-claude-main.sh", f"git -C {r.as_posix()} commit -m x", f).returncode == 2


def test_merged_branch_guard_resolves_HEAD_to_the_current_branch():
    src = (HOOKS / "block-merged-branch-push.sh").read_text(encoding="utf-8")
    assert '"$branch" != "HEAD"' not in src, "HEAD면 그냥 통과하던 줄"
    assert 'gitcmd' in src, "명령 풀기는 공용 도우미로"


def test_check_secrets_reads_korean_paths_and_global_option_commits():
    r = _repo("feature")
    key = "gh" + "p_" + "a" * 36
    (r / "한글 메모.md").write_text(f"token = {key}\n", encoding="utf-8")
    _git(r, "add", "-A")
    staged = subprocess.run([BASH, str(HOOKS / "check-secrets.sh"), "--staged"], cwd=r, capture_output=True, text=True, encoding="utf-8")
    assert staged.returncode != 0, "한글 이름 파일의 키를 놓쳤다(core.quotepath)"
    assert _hook("check-secrets.sh", "git -c user.name=x commit -m y", r).returncode != 0, "git -c … commit도 검사한다"
    assert _hook("check-secrets.sh", 'git -C "$PWD" commit -m y', r).returncode != 0, "-C \"$PWD\"도 검사한다(새 맥락 리뷰 막힘)"
    assert _hook("check-secrets.sh", "cat <<'EOF'\ngit commit -m y\nEOF", r).returncode == 0, "heredoc 안의 낱말은 커밋이 아니다"


def test_require_tests_runs_only_for_commits_into_this_repo():
    other = _repo("feature")
    src = (HOOKS / "require-tests-before-commit.sh").read_text(encoding="utf-8")
    assert "gitcmd" in src, "git commit 글자가 아니라 명령을 풀어 본다"
    # 다른 저장소(-C)의 커밋에는 이 레포 시험을 돌리지 않는다 — 시험이 돌면 몇 분 걸리므로 시간으로 본다
    import time
    t0 = time.time()
    assert _hook("require-tests-before-commit.sh", f"git -C {other.as_posix()} commit -m x", ROOT).returncode == 0
    assert time.time() - t0 < 20, "다른 저장소의 커밋에 이 레포 시험을 돌렸다"


def test_lib_json_field_does_not_fail_open_without_jq_and_node():
    # jq · node가 없는 PATH에서도 명령을 읽는다(파이썬, 그것도 없으면 글자로) — 전에는 빈 값이라 main 막기가 열렸다
    lib = (HOOKS / "lib.sh").read_text(encoding="utf-8")
    assert "$PY" in lib.split("json_field()")[1].split("\n}\n")[0] or "PY" in lib.split("json_field()")[1].split("\n}\n")[0]
    out = subprocess.run([BASH, "-c", f'. "{(HOOKS / "lib.sh").as_posix()}"; jq() {{ return 127; }}; command() {{ [ "$2" = jq ] || [ "$2" = node ] && return 1; builtin command "$@"; }}; echo \'{{"tool_input":{{"command":"git push origin main"}}}}\' | json_field tool_input.command'],
                         capture_output=True, text=True, encoding="utf-8")
    assert "git push origin main" in out.stdout


def test_check_mermaid_looks_for_chrome_on_windows_and_linux_too():
    src = (HOOKS / "check-mermaid.sh").read_text(encoding="utf-8")
    assert "Program Files/Google/Chrome/Application/chrome.exe" in src and "google-chrome" in src


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  git guards(F-105): {len(tests)} tests")


if __name__ == "__main__":
    run_all()
