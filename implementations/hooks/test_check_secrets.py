"""
.claude/hooks/check-secrets.sh 테스트 (장부 W-12, 기록·보안 기준 6-3).
임시 git 저장소를 만들어 실제 스크립트를 실행한다 — 워크스페이스 자신의 git 상태는 건드리지 않는다.
가짜 키는 조각을 이어 붙여 만든다(이 파일 자체에 키 모양 문자열이 남지 않게).
"""
import json
import subprocess
import tempfile
from pathlib import Path

HOOK = Path(__file__).resolve().parents[2] / ".claude" / "hooks" / "check-secrets.sh"
FAKE_ANTHROPIC = "sk-" + "ant-" + "api03-" + "A1b2C3d4E5f6G7h8I9j0K1l2"
FAKE_GITHUB = "gh" + "p_" + "a" * 36


def _git(repo, *args):
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)


def _repo():
    d = Path(tempfile.mkdtemp())
    _git(d, "init", "-q")
    _git(d, "config", "user.email", "t@example.com")
    _git(d, "config", "user.name", "t")
    (d / "README.md").write_text("hello\n")
    _git(d, "add", ".")
    _git(d, "commit", "-q", "-m", "init")
    return d


def _staged(repo):
    return subprocess.run(["bash", str(HOOK), "--staged"], cwd=repo, capture_output=True, text=True)


def _hook(repo, command):
    payload = json.dumps({"tool_input": {"command": command}})
    return subprocess.run(["bash", str(HOOK)], cwd=repo, input=payload, capture_output=True, text=True)


def test_clean_change_passes():
    r = _repo()
    (r / "a.py").write_text("x = 1\n")
    _git(r, "add", ".")
    assert _staged(r).returncode == 0


def test_key_pattern_blocked_and_masked():
    r = _repo()
    (r / "config.py").write_text(f'KEY = "{FAKE_ANTHROPIC}"\n')
    _git(r, "add", ".")
    p = _staged(r)
    assert p.returncode != 0
    assert "config.py:1" in p.stderr
    assert FAKE_ANTHROPIC not in p.stderr + p.stdout  # 값은 가려서 보인다


def test_github_token_blocked():
    r = _repo()
    (r / "ci.yml").write_text(f"token: {FAKE_GITHUB}\n")
    _git(r, "add", ".")
    assert _staged(r).returncode != 0


def test_private_key_header_blocked():
    r = _repo()
    (r / "k.txt").write_text("-----BEGIN " + "RSA PRIVATE KEY-----\nabc\n")
    _git(r, "add", ".")
    assert _staged(r).returncode != 0


def test_forbidden_path_blocked_but_example_allowed():
    r = _repo()
    (r / ".env.example").write_text("API_KEY=\n")
    _git(r, "add", ".")
    assert _staged(r).returncode == 0
    (r / ".env").write_text("API_KEY=\n")
    _git(r, "add", "-f", ".env")
    p = _staged(r)
    assert p.returncode != 0 and ".env" in p.stderr


def test_password_assignment_blocked_placeholder_allowed():
    r = _repo()
    (r / "a.ts").write_text("const password = '<YOUR_PASSWORD>';\nconst token = process.env.TOKEN;\n")
    _git(r, "add", ".")
    assert _staged(r).returncode == 0
    (r / "b.ts").write_text("const db_password = 'Tr0ub4dor&3x';\n")
    _git(r, "add", ".")
    assert _staged(r).returncode != 0


def test_allow_marker_passes():
    r = _repo()
    (r / "doc.md").write_text(f"예시: {FAKE_GITHUB}  <!-- secret-check: allow -->\n")
    _git(r, "add", ".")
    assert _staged(r).returncode == 0


def test_only_added_lines_are_checked():
    r = _repo()
    (r / "old.py").write_text(f'K = "{FAKE_ANTHROPIC}"\n')
    _git(r, "add", ".")
    _git(r, "commit", "-q", "-m", "old secret")  # 이미 들어간 것은 이번 검사 대상이 아니다
    (r / "old.py").write_text(f'K = "{FAKE_ANTHROPIC}"\nY = 2\n')
    _git(r, "add", ".")
    assert _staged(r).returncode == 0


def test_hook_mode_ignores_non_commit_commands():
    r = _repo()
    (r / "s.py").write_text(f'K = "{FAKE_ANTHROPIC}"\n')
    assert _hook(r, "git status").returncode == 0


def test_hook_mode_sees_files_added_in_same_command():
    # `git add x && git commit`처럼 한 명령으로 하면 훅이 도는 시점엔 아직 staged가 아니다
    r = _repo()
    (r / "s.py").write_text(f'K = "{FAKE_ANTHROPIC}"\n')
    p = _hook(r, "git add s.py && git commit -m x")
    assert p.returncode == 2
    assert FAKE_ANTHROPIC not in p.stderr


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  check-secrets: {len(tests)} tests")


if __name__ == "__main__":
    run_all()


# --- 루트 .gitignore와 훅의 금지 경로가 같은 목록인지 (장부 W-23) ---
ROOT_GITIGNORE = Path(__file__).resolve().parents[2] / ".gitignore"
FORBIDDEN_NAMES = [".env", ".env.local", ".env.production", "sub/.env", "id_rsa", "sub/id_ed25519",
                   "credentials.json", "a.pem", "b.key", "c.p12", "d.pfx"]
ALLOWED_NAMES = [".env.example", ".env.sample", ".env.template", "key.md", "notes.keyboard.md"]


def _ignored(repo, name):
    return subprocess.run(["git", "check-ignore", "-q", name], cwd=repo).returncode == 0


def test_hook_blocks_every_forbidden_name_and_allows_the_examples():
    # 아래 목록의 정의: 훅이 실제로 막는 이름과 통과시키는 이름. .gitignore 테스트가 이 목록을 쓴다.
    for name in FORBIDDEN_NAMES:
        r = _repo()
        (r / name).parent.mkdir(parents=True, exist_ok=True)
        (r / name).write_text("x\n")
        _git(r, "add", "-f", name)
        assert _staged(r).returncode != 0, f"훅이 막지 않음: {name}"
    for name in ALLOWED_NAMES:
        r = _repo()
        (r / name).write_text("x\n")
        _git(r, "add", "-f", name)
        assert _staged(r).returncode == 0, f"훅이 막음: {name}"


def test_root_gitignore_ignores_every_forbidden_name_and_not_the_examples():
    # 훅은 무시된 파일을 보지 않는 전제라, 여기가 비면 untracked .env 하나가 모든 커밋을 막는다.
    r = _repo()
    (r / ".gitignore").write_text(ROOT_GITIGNORE.read_text())
    for name in FORBIDDEN_NAMES:
        assert _ignored(r, name), f".gitignore가 안 막음: {name}"
    for name in ALLOWED_NAMES:
        assert not _ignored(r, name), f".gitignore가 과하게 막음: {name}"
