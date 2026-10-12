#!/usr/bin/env bash
# SessionStart hook. 사용자가 직접 한 커밋 중 아직 리뷰받지 않은 것을 세션 시작 때
# 알려준다 — 사용자가 터미널에서 직접 커밋하면 Claude는 그 사실을 알 수 없으므로,
# "커밋/PR 시점 리뷰"(.claude/rules/review-mode.md)를 기억에만 맡기지 않는다.
# stdout은 세션 컨텍스트에 들어간다. 실패해도 세션을 막지 않는다(항상 exit 0).
cd "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || exit 0
log=docs/00-overview/growth-log.md
[ -f "$log" ] || exit 0

base=$(sed -n 's/^last-reviewed: *\([0-9a-f]\{7,40\}\).*/\1/p' "$log" | head -1)
if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  # 아직 리뷰한 적이 없으면 리뷰 모드를 도입한 커밋을 기준점으로 쓴다.
  base=$(git log --diff-filter=A --format=%H -- "$log" | tail -1)
fi
[ -n "$base" ] || exit 0

# Claude가 공동 작성한 커밋(메커니즘 작업·요청받은 작성)은 리뷰 대상이 아니다.
pending=$(git log --no-merges --format='%h%x09%ad%x09%s%x09%(trailers:key=Co-Authored-By,valueonly,separator=%x2C)' \
  --date=short "$base"..HEAD 2>/dev/null | awk -F'\t' 'tolower($4) !~ /claude/ {print "  " $1 "  " $2 "  " $3}')
[ -n "$pending" ] || exit 0

n=$(printf '%s\n' "$pending" | wc -l | tr -d ' ')
echo "[리뷰 모드] 리뷰받지 않은 사용자 커밋 ${n}개 (기준점 ${base:0:7} 이후, 현재 브랜치):"
printf '%s\n' "$pending" | head -15
echo "사용자에게 변경 리뷰(dev-workflow 명령 5)를 지금 할지 먼저 물어본다. 리뷰 후 growth-log.md의 last-reviewed를 갱신한다."
exit 0
