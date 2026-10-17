"""
git pre-commit이 data 브랜치 작업 폴더(.claude가 없는 고아 브랜치)의 커밋에서도 비밀값을 막는지 확인한다
(ADR-0007). 임시 저장소를 만들어 실제 스크립트로 시험한다 — 워크스페이스 자신의 git은 건드리지 않는다.
가짜 키는 조각을 이어 붙여 만든다.
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRE_COMMIT = ROOT / ".claude" / "hooks" / "pre-commit.sample"
CHECK = ROOT / ".claude" / "hooks" / "check-secrets.sh"
FAKE_KEY = "sk-" + "ant-" + "api03-" + "A1b2C3d4E5f6G7h8I9j0K1l2"


def _git(cwd, *args, check=True):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, encoding="utf-8", check=check)


def _setup():
    main = Path(tempfile.mkdtemp()) / "main"
    main.mkdir()
    _git(main, "init", "-q")
    _git(main, "config", "user.email", "t@example.com")
    _git(main, "config", "user.name", "t")
    (main / ".claude" / "hooks").mkdir(parents=True)
    shutil.copy(CHECK, main / ".claude" / "hooks" / "check-secrets.sh")
    shutil.copy(CHECK.with_name("lib.sh"), main / ".claude" / "hooks" / "lib.sh")  # check-secrets.sh가 불러 쓴다
    (main / "README.md").write_text("main\n")
    _git(main, "add", ".")
    _git(main, "commit", "-q", "-m", "init")
    hook = main / ".git" / "hooks" / "pre-commit"
    shutil.copy(PRE_COMMIT, hook)
    hook.chmod(0o755)
    data = main.parent / "data"
    _git(main, "worktree", "add", "-q", "--orphan", "-b", "data", str(data))
    return main, data


def _commit(repo, name, text):
    (repo / name).write_text(text)
    _git(repo, "add", name)
    return _git(repo, "commit", "-q", "-m", "x", check=False)


def test_data_worktree_has_no_claude_folder():  # 전제: 여기서는 저장소 최상위의 스크립트를 찾을 수 없다
    _, data = _setup()
    assert not (data / ".claude").exists()


def test_clean_commit_passes_in_the_data_worktree():
    _, data = _setup()
    assert _commit(data, "doc.md", "# 장보기\n우유와 달걀\n").returncode == 0


def test_secret_is_blocked_in_the_data_worktree_and_masked():
    _, data = _setup()
    r = _commit(data, "doc.md", "키는 " + FAKE_KEY + "\n")
    assert r.returncode != 0 and FAKE_KEY not in r.stdout + r.stderr


def test_secret_is_still_blocked_in_the_main_checkout():
    main, _ = _setup()
    assert _commit(main, "doc.md", "키는 " + FAKE_KEY + "\n").returncode != 0


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  pre-commit in data worktree: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
