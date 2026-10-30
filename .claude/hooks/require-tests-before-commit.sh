#!/usr/bin/env bash
# PreToolUse hook on Bash. 'git commit'이 포함된 명령이면 전체 테스트를 먼저
# 돌려서 실패 시 커밋 자체를 막는다 — "커밋 전 테스트 확인"을 사람이 매번
# 기억하지 않아도 되게 강제한다.
. "$(dirname "$0")/lib.sh"
cmd=$(json_field tool_input.command)

# 커밋 명령인가 · 이 저장소로 가는가 — 명령을 풀어 본다(gitcmd.py, 고칠 목록 F-105-7). 전에는 'git commit' 글자만 봐서
#   `git -c k=v commit`은 시험 없이 지나가고, 다른 저장소의 커밋(git -C …)이나 글 속의 낱말에도 이 레포 시험이 돌았다
where=$(gitcmd commit-dir "$cmd"); rc=$?
if [ $rc -ne 0 ]; then echo "$cmd" | grep -qE 'git\s.*commit' && where=.; fi   # 파이썬이 없거나 도우미가 죽으면 글자로 — 이 저장소로 보고 시험한다
[ -n "$where" ] || exit 0
# 같은 저장소인가 — 공용 .git(--git-common-dir)으로 견준다: 같은 저장소의 다른 worktree 커밋도 시험한다(새 맥락 리뷰). 못 알아보면 이 저장소로 본다
common() { git ${1:+-C "$1"} rev-parse --path-format=absolute --git-common-dir 2>/dev/null; }
here=$(common); there=$(common "$where")
[ -z "$there" ] || [ "$here" = "$there" ] || exit 0

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
