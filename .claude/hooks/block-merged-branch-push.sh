#!/usr/bin/env bash
# PreToolUse hook on Bash. 이미 병합된 PR의 브랜치에 새 커밋을 푸시하려 하면 막는다.
# 병합된 PR에는 나중에 올린 커밋이 따라가지 않아 main에서 빠진다 — 2026-09-30(PR #3),
# 2026-10-01(PR #11, 14개) 두 번 일어나서 규칙(git-workflow.md)에서 훅으로 승격했다.
# 막는 조건(모두 참일 때만): 그 브랜치에 병합된 PR이 있고, 열린 PR이 없고, main에 없는 커밋이 있다.
# gh 조회가 실패하면 막지 않고 경고만 한다.
. "$(dirname "$0")/lib.sh"
cmd=$(json_field tool_input.command)
# 올리는 브랜치 — 명령을 풀어 refspec의 대상(src:dst면 dst), 없으면 HEAD. 지우는 푸시는 해당 없음(gitcmd.py push-target)
branch=$(gitcmd push-target "$cmd")
if [ $? -eq 3 ]; then   # 파이썬이 없으면 전처럼 글자로
  echo "$cmd" | grep -qE '(^|[;&|]|\s)git\s+push(\s|$)' || exit 0
  echo "$cmd" | grep -qE -- '--delete|(\s):' && exit 0
  branch=$(echo "$cmd" | grep -oE 'git\s+push(\s+-[a-zA-Z-]+)*\s+origin\s+[^ ;&|]+' | awk '{print $NF}' | tail -1)
  branch=${branch##*:}; [ -n "$branch" ] || branch=HEAD
fi
[ -n "$branch" ] || exit 0

cd "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || exit 0
# HEAD(`git push -u origin HEAD` — 가장 흔한 꼴)는 지금 브랜치로 — 전에는 HEAD면 병합 여부를 보지 않고 통과했다(고칠 목록 F-105-4)
[ "$branch" = "HEAD" ] && branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
case "$branch" in ""|main|HEAD) exit 0 ;; esac

merged=$(gh pr list --head "$branch" --state merged --json number -q '[.[].number]|join(",")' 2>/dev/null) || { echo "⚠️ block-merged-branch-push: gh 조회 실패 — 확인 없이 진행합니다" >&2; exit 0; }
[ -n "$merged" ] || exit 0
open=$(gh pr list --head "$branch" --state open --json number -q 'length' 2>/dev/null)
[ "${open:-0}" -gt 0 ] && exit 0
git fetch -q origin main 2>/dev/null
new=$(git cherry origin/main "$branch" 2>/dev/null | grep -c '^+')
[ "${new:-0}" -gt 0 ] || exit 0

echo "🚫 차단됨: '$branch'는 이미 병합된 PR(#$merged)의 브랜치이고, main에 없는 커밋이 ${new}개 있습니다." >&2
echo "병합된 PR에는 이 커밋들이 따라가지 않습니다. 최신 main에서 새 브랜치를 따서 옮기거나(cherry-pick), 이 브랜치로 새 PR을 먼저 여세요." >&2
exit 2
