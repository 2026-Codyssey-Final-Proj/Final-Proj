#!/usr/bin/env bash
# PreToolUse hook on Bash. 'git commit'이 포함된 명령이면 전체 테스트를 먼저
# 돌려서 실패 시 커밋 자체를 막는다 — "커밋 전 테스트 확인"을 사람이 매번
# 기억하지 않아도 되게 강제한다.
. "$(dirname "$0")/lib.sh"
cmd=$(json_field tool_input.command)

if ! echo "$cmd" | grep -q 'git commit'; then
  exit 0
fi

if [ ! -f 04-tests/run_all_tests.py ]; then
  exit 0
fi

if [ -z "$PY" ]; then
  echo "🚫 차단됨: 파이썬을 찾지 못해 시험 통과을(를) 확인할 수 없습니다. python을 설치한 뒤 다시 하세요." >&2
  exit 2
fi
output=$("$PY" 04-tests/run_all_tests.py 2>&1)
status=$?

if [ "$status" -ne 0 ]; then
  echo "🚫 차단됨: 테스트가 실패한 상태라 커밋할 수 없습니다." >&2
  echo "$output" | tail -20 >&2
  exit 2
fi

exit 0
