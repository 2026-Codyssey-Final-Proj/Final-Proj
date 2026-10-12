#!/usr/bin/env bash
# PreToolUse hook on Bash. Claude가 main으로 올리는 것을 막는다 (팀 결정 2026-10-12).
# 사람은 자기 터미널에서 main에 직접 푸시할 수 있다 — 이 훅은 Claude Code의 Bash 호출만 본다.
# 막는 것: main/master로 가는 git push, main/master 위에서 하는 git commit, gh pr merge.
cmd=$(cat | jq -r '.tool_input.command // empty')
[ -n "$cmd" ] || exit 0

python3 -I - "$cmd" <<'PY'
import re, shlex, subprocess, sys
PROTECTED = {"main", "master"}
cmd = sys.argv[1]

def current_branch():
    try:
        return subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                                       stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return ""

def deny(why):
    sys.stderr.write(f"🚫 차단됨: {why}\n"
                     "Claude는 main에 올리지 않습니다. 브랜치를 만들어 거기에 커밋·푸시하고, "
                     "main 반영은 사람이 자기 터미널에서 합니다.\n"
                     f"명령: {cmd}\n")
    sys.exit(2)

# 한 줄에 && ; | 로 이어진 명령을 나눠 하나씩 본다
for seg in re.split(r"&&|\|\||;|\||\n", cmd):
    try:
        toks = shlex.split(seg)
    except ValueError:
        toks = seg.split()
    # 앞쪽의 환경변수 대입(FOO=bar)·sudo 등은 건너뛴다
    while toks and re.match(r"^\w+=", toks[0]):
        toks.pop(0)
    # git -C <dir> / git -c k=v 같은 전역 옵션을 건너뛴다
    if toks[:1] == ["git"]:
        i = 1
        while i < len(toks) and toks[i].startswith("-"):
            i += 2 if toks[i] in ("-C", "-c", "--git-dir", "--work-tree") else 1
        sub, rest = (toks[i], toks[i + 1:]) if i < len(toks) else ("", [])
        if sub == "push":
            args = [t for t in rest if not t.startswith("-")]
            refspecs = args[1:]            # 첫 위치 인자는 원격 이름
            if not refspecs:
                if current_branch() in PROTECTED:
                    deny("현재 브랜치가 main인 채로 git push 합니다.")
            for r in refspecs:
                dst = r.lstrip("+").split(":")[-1]
                dst = re.sub(r"^refs/heads/", "", dst)
                if dst == "HEAD":
                    dst = current_branch()
                if dst in PROTECTED:
                    deny(f"git push의 대상이 {dst} 입니다.")
            if any(t in ("--all", "--mirror") for t in rest):
                deny("git push --all/--mirror는 main을 포함합니다.")
        elif sub == "commit" and current_branch() in PROTECTED:
            deny("main 브랜치 위에서 git commit 합니다.")
    elif toks[:3] == ["gh", "pr", "merge"]:
        deny("gh pr merge는 main으로 병합합니다.")
sys.exit(0)
PY
