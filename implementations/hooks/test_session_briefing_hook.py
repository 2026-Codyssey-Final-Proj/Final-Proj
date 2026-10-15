"""
.claude/hooks/session-briefing.sh 테스트 (세컨드 브레인 F7a·F8a — 세션을 시작하면 브리핑을 먼저 말한다, 사용자 결정 2026-10-13 "A").
임시 저장소를 만들어 실제 스크립트를 실행한다 — 워크스페이스 자신의 데이터는 건드리지 않는다.
세션 시작을 막으면 안 되므로 어떤 경우에도 exit 0이고, 데이터가 없으면 "일이 없다"고 말하지 않고 조용히 지나간다.
"""
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from bash_path import BASH

ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / ".claude" / "hooks" / "session-briefing.sh"
SKELETON = ROOT / "projects" / "second-brain" / "implementations" / "skeleton"
SETTINGS = ROOT / ".claude" / "settings.json"


def _git(repo, *args):
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)


def _repo(with_code=True, with_data=True):
    d = Path(tempfile.mkdtemp())
    _git(d, "init", "-q")
    _git(d, "config", "user.email", "t@example.com")
    _git(d, "config", "user.name", "t")
    sb = d / "projects" / "second-brain"
    if with_code:
        shutil.copytree(SKELETON, sb / "implementations" / "skeleton", ignore=shutil.ignore_patterns("__pycache__"))
    if with_data:
        task = sb / "data" / "vault" / "작업"
        task.mkdir(parents=True)
        (task / "2000 시험 일.md").write_text(
            "# 시험 일\n- 번호: 2000\n- 목적: 작업\n- 마감: 2999-01-01\n- 상태: 진행\n\n비공개 본문\n", encoding="utf-8")
    (d / "README.md").write_text("x\n")
    _git(d, "add", "-A")
    _git(d, "commit", "-q", "-m", "init")
    return d


def _run(cwd):
    return subprocess.run([BASH, str(HOOK)], cwd=cwd, capture_output=True, text=True)


def test_prints_the_briefing_at_session_start():
    r = _run(_repo())
    assert r.returncode == 0 and "# 브리핑" in r.stdout and "시험 일" in r.stdout


def test_briefing_has_names_and_dates_but_no_task_body():  # S4
    assert "비공개 본문" not in _run(_repo()).stdout


def test_silent_when_the_briefing_code_is_missing():  # 옛 브랜치
    r = _run(_repo(with_code=False))
    assert r.returncode == 0 and r.stdout == ""


def test_silent_when_there_is_no_data_folder():  # 일이 없다고 말하지 않는다
    r = _run(_repo(with_data=False))
    assert r.returncode == 0 and r.stdout == ""


def test_never_fails_the_session_outside_a_git_repository():
    r = _run(Path(tempfile.mkdtemp()))
    assert r.returncode == 0 and r.stdout == ""


def test_works_from_a_worktree_by_finding_the_main_checkouts_data():  # 데이터(무시된 폴더)는 본 작업 폴더에만 있다
    main = _repo(with_data=False)
    task = main / "projects" / "second-brain" / "data" / "vault" / "작업"
    task.mkdir(parents=True)
    (task / "2000 시험 일.md").write_text(
        "# 시험 일\n- 번호: 2000\n- 목적: 작업\n- 마감: 2999-01-01\n- 상태: 진행\n", encoding="utf-8")
    wt = Path(tempfile.mkdtemp()) / "wt"
    _git(main, "worktree", "add", "-q", "-b", "other", str(wt))
    assert not (wt / "projects" / "second-brain" / "data").exists()
    r = _run(wt)
    assert r.returncode == 0 and "시험 일" in r.stdout


def test_data_folder_from_the_environment_is_used_when_the_repo_has_none():  # ADR-0010
    import os
    repo = _repo(with_data=False)
    data = Path(tempfile.mkdtemp())
    task = data / "vault" / "작업"
    task.mkdir(parents=True)
    (task / "2000 환경 일.md").write_text(
        "# 환경 일\n- 번호: 2000\n- 목적: 작업\n- 마감: 2999-01-01\n- 상태: 진행\n", encoding="utf-8")
    r = subprocess.run([BASH, str(HOOK)], cwd=repo, capture_output=True, text=True,
                       env={**os.environ, "SECOND_BRAIN_DATA": str(data)})
    assert r.returncode == 0 and "환경 일" in r.stdout


def test_registered_as_a_session_start_hook():
    s = json.loads(SETTINGS.read_text(encoding="utf-8"))
    commands = [h["command"] for e in s["hooks"]["SessionStart"] for h in e["hooks"]]
    assert ".claude/hooks/session-briefing.sh" in commands
    assert ".claude/hooks/unreviewed-commits.sh" in commands  # 기존 훅은 그대로


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  session-briefing hook: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
