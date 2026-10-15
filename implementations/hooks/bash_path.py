"""
훅 테스트가 훅 스크립트를 돌릴 bash.

Windows에서 subprocess로 "bash"를 부르면 C:\\Windows\\System32\\bash.exe(WSL 실행기)가 먼저 잡혀,
WSL 배포판이 없는 컴퓨터에서는 실행 자체가 실패한다. Claude Code는 훅을 Git Bash로 돌리므로
테스트도 git과 함께 설치된 Git Bash를 찾아 쓴다. Windows가 아니면 그냥 "bash"다.
"""
import os
import shutil
from pathlib import Path


def find_bash():
    if os.name != "nt":
        return "bash"
    git = shutil.which("git")
    if git:
        for parent in Path(git).resolve().parents:
            candidate = parent / "bin" / "bash.exe"
            if candidate.exists():
                return str(candidate)
    return "bash"


BASH = find_bash()
