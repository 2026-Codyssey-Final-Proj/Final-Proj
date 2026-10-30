#!/usr/bin/env bash
# 커밋 전 비밀값 검사 (장부 W-12, 기록·보안 기준 6-3 — 출처: my-setup-proj scripts/check-secrets.sh).
# 금지 경로(.env, *.pem 등)와 "이번에 추가된 줄"의 키 패턴을 찾는다. 찾은 값은 가려서 보인다.
#
# 두 가지로 쓴다:
#   - Claude PreToolUse 훅(인자 없음): stdin JSON의 명령에 'git commit'이 있으면 검사한다.
#     `git add x && git commit`처럼 한 명령이면 훅 시점에 아직 staged가 아니므로,
#     추적 중인 파일의 모든 변경(git diff HEAD)과 무시되지 않은 새 파일까지 넓게 본다.
#   - `--staged`: staged 변경만 본다(git pre-commit 훅이나 손으로 돌릴 때).
# 일부러 남기는 예시 줄은 같은 줄에 `secret-check: allow`를 적으면 넘어간다.
. "$(dirname "$0")/lib.sh"
mode="hook"
if [ "${1:-}" = "--staged" ]; then
  mode="staged"
else
  cmd=$(json_field tool_input.command)
  # 커밋 명령인가 · 어느 폴더인가 — 명령을 풀어 본다(gitcmd.py). 전에는 'git commit' 글자만 봐서 `git -c k=v commit`이 검사를 건너뛰었다(고칠 목록 F-105-7)
  where=$(gitcmd commit-dir "$cmd"); rc=$?
  # 파이썬이 없거나(3) 도우미가 죽으면 글자로 — 커밋 같으면 이 폴더를 검사한다(아래에서 파이썬이 없으면 막는다)
  if [ $rc -ne 0 ]; then echo "$cmd" | grep -qE 'git\s.*commit' && where=.; fi
  [ -n "$where" ] || exit 0
  cd "$where" 2>/dev/null || cd .   # git -C <폴더> 커밋이면 그 폴더 — 도우미가 풀 수 없는 폴더면 "."을 준다(건너뛰지 않게, 새 맥락 리뷰)
fi

git rev-parse --git-dir >/dev/null 2>&1 || exit 0

if [ -z "$PY" ]; then
  echo "🚫 차단됨: 파이썬을 찾지 못해 비밀값 검사을(를) 확인할 수 없습니다. python을 설치한 뒤 다시 하세요." >&2
  exit 2
fi
MODE="$mode" "$PY" - <<'PY'
import os, re, subprocess, sys
from pathlib import Path

mode = os.environ["MODE"]
SELF = {".claude/hooks/check-secrets.sh", "04-tests/hooks/test_check_secrets.py"}
PATTERNS = [
    ("Anthropic 키", re.compile(r"sk-ant-[A-Za-z0-9_-]{20,}")),
    ("OpenAI 키", re.compile(r"sk-(?:proj-)?[A-Za-z0-9]{20,}")),
    ("AWS 액세스 키", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("GitHub 토큰", re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,}")),
    ("Slack 토큰", re.compile(r"xox[abprs]-[A-Za-z0-9-]{10,}")),
    ("Slack Webhook", re.compile(r"https://hooks\.slack\.com/services/[A-Za-z0-9/]+")),
    ("Google API 키", re.compile(r"AIza[0-9A-Za-z_-]{35}")),
    ("개인 키", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
]
ASSIGN = re.compile(
    r"(?i)\b[\w.-]*(password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\b"
    r"\s*[:=]\s*['\"]([^'\"\s]{8,})['\"]")
PLACEHOLDER = re.compile(r"(?i)[<${]|your|example|changeme|placeholder|dummy|xxxx|\*\*\*")
FORBIDDEN = re.compile(r"(^|/)(\.env(\.(?!example$|sample$|template$)[^/]+)?|id_rsa|id_ed25519|credentials\.json)$|\.(pem|key|p12|pfx)$")

# core.quotepath=off — 기본값이면 한글 경로가 "b/\352…"로 바뀌어 아래 '+++ b/'에 안 맞아 그 파일을 통째로 건너뛰었다(고칠 목록 F-105-1). 출력은 UTF-8로 읽는다
def git(*a):
    return subprocess.run(["git", "-c", "core.quotepath=off", *a], capture_output=True, text=True, encoding="utf-8", errors="replace").stdout

def mask(v):
    return f"{v[:4]}…({len(v)}자)"

diff = git("diff", "--cached", "-U0", "--no-color") if mode == "staged" else git("diff", "HEAD", "-U0", "--no-color")
changed = git("diff", "--cached" if mode == "staged" else "HEAD", "--name-only", "--diff-filter=AMR").splitlines()   # 줄로 — 이름에 빈칸이 있어도
added = []  # (path, lineno, text)
path, line = None, 0
for l in diff.splitlines():
    if l.startswith("+++ "):
        path = l[6:] if l.startswith("+++ b/") else None
    elif l.startswith("@@"):
        m = re.search(r"\+(\d+)", l); line = int(m.group(1)) if m else 0
    elif l.startswith("+") and path:
        added.append((path, line, l[1:])); line += 1
if mode == "hook":
    for p in git("ls-files", "--others", "--exclude-standard").splitlines():
        changed.append(p)
        try:
            data = Path(p).read_bytes()
        except OSError:
            continue
        if b"\0" in data[:8000] or len(data) > 1_000_000:
            continue
        for i, t in enumerate(data.decode("utf-8", "replace").splitlines(), 1):
            added.append((p, i, t))

found = []
for p in sorted(set(changed)):
    if FORBIDDEN.search(p):
        found.append(f"  {p}  금지 경로(비밀값 파일)")
for p, n, t in added:
    if p in SELF or "secret-check: allow" in t:
        continue
    for name, rx in PATTERNS:
        for m in rx.finditer(t):
            found.append(f"  {p}:{n}  {name}  {mask(m.group(0))}")
    for m in ASSIGN.finditer(t):
        if not PLACEHOLDER.search(m.group(2)):
            found.append(f"  {p}:{n}  {m.group(1)} 값  {mask(m.group(2))}")

if found:
    print("🚫 차단됨: 커밋하려는 변경에 비밀값으로 보이는 것이 있습니다 (값은 가림).", file=sys.stderr)
    print("\n".join(found), file=sys.stderr)
    print("→ 값은 환경변수로 옮기세요(기록·보안 기준 2절). 일부러 남기는 예시면 그 줄에 `secret-check: allow`.", file=sys.stderr)
    sys.exit(2 if mode == "hook" else 1)
PY
