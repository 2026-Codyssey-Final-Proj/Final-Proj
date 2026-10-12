#!/usr/bin/env bash
# PreToolUse hook on Bash. 이미 병합된 PR의 브랜치에 새 커밋을 푸시하려 하면 막는다.
# 병합된 PR에는 나중에 올린 커밋이 따라가지 않아 main에서 빠진다 — 2026-09-30(PR #3),
# 2026-10-01(PR #11, 14개) 두 번 일어나서 규칙(git-workflow.md)에서 훅으로 승격했다.
# 막는 조건(모두 참일 때만): 그 브랜치에 병합된 PR이 있고, 열린 PR이 없고, main에 없는 커밋이 있다.
# gh 조회가 실패하면 막지 않고 경고만 한다.
cmd=$(cat | jq -r '.tool_input.command // empty')
echo "$cmd" | grep -qE '(^|[;&|]|\s)git\s+push(\s|$)' || exit 0
echo "$cmd" | grep -qE -- '--delete|(\s):' && exit 0   # 브랜치 삭제 푸시는 해당 없음

cd "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || exit 0
# 명령에 `origin <브랜치>`가 있으면 그 브랜치, 없으면 현재 브랜치
branch=$(echo "$cmd" | grep -oE 'git\s+push(\s+-[a-zA-Z-]+)*\s+origin\s+[^ ;&|]+' | awk '{print $NF}' | tail -1)
[ -n "$branch" ] || branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -n "$branch" ] && [ "$branch" != "main" ] && [ "$branch" != "HEAD" ] || exit 0

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
