#!/usr/bin/env bash
# SessionStart hook. 세션을 시작하면 세컨드 브레인의 브리핑(마감 지남·3일 이내 할 일, 진행 중인 프로젝트와 단계,
# 다음 할 일)을 먼저 말한다 — F7a·F8a를 "사용자가 시켜야 돈다"가 아니라 자동으로(사용자 결정 2026-10-13 "A").
# stdout은 세션 컨텍스트에 들어간다. 세션 시작을 막으면 안 되므로 항상 exit 0이고,
# 코드나 데이터 폴더가 없으면 "일이 없다"고 말하지 않고 조용히 지나간다.
# 이름·날짜·개수만 나가고 할 일 문서 본문은 나가지 않는다(briefing.py).
top=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
script="$top/05-projects/second-brain/implementations/skeleton/briefing.py"
[ -f "$script" ] || exit 0

data="${SECOND_BRAIN_DATA:-}"  # 설정 한 곳(ADR-0010) — 있으면 그 폴더
if [ -z "$data" ]; then
  data="$top/05-projects/second-brain/data"
  # 폴더 번호를 붙이기 전(2026-10-17)의 자리 — git이 무시하는 폴더라 pull로 옮겨지지 않는다
  [ -d "$data" ] || data="$top/projects/second-brain/data"
fi
if [ -z "${SECOND_BRAIN_DATA:-}" ] && [ ! -d "$data" ]; then
  # worktree에서 시작한 세션 — 데이터(git이 무시하는 폴더)는 본 작업 폴더에 있다
  common=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
  data="$(dirname "$common")/05-projects/second-brain/data"
  [ -d "$data" ] || data="$(dirname "$common")/projects/second-brain/data"
fi
[ -d "$data" ] || exit 0

. "$(dirname "$0")/lib.sh"
[ -n "$PY" ] || exit 0
"$PY" "$script" "$data" 2>/dev/null || true
exit 0
