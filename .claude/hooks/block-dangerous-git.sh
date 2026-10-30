#!/usr/bin/env bash
# PreToolUse hook on Bash. 위험한 git 명령을 기계적으로 차단한다 —
# .claude/rules/git-workflow.md의 "절대 하지 않는 것"을 모델 판단에만
# 맡기지 않고 강제한다.
# 2026-10-30(고칠 목록 F-105-2): 글자 위치로 보던 것을 명령을 풀어 본다(gitcmd.py) — 전에는 `push` 바로 뒤의 --force만 잡아
#   `git push origin x --force` · `-uf` · `+x` · `--force-with-lease` · `git -C . push --force` · `git reset -q --hard`가 지나갔다.
. "$(dirname "$0")/lib.sh"
cmd=$(json_field tool_input.command)
[ -n "$cmd" ] || exit 0

why=$(gitcmd danger "$cmd"); rc=$?
[ $rc -ne 0 ] && [ $rc -ne 3 ] && why="판정 도우미(gitcmd.py)가 실패해 확인할 수 없는 명령"   # 도우미가 죽으면 막는 쪽(새 맥락 리뷰)
if [ $rc -eq 3 ]; then
  # 파이썬이 없으면 글자로 넓게 — 위치가 달라도 막는 쪽이 안전하다
  echo "$cmd" | grep -qE 'git\s.*push\s.*(--force|\s-[a-zA-Z]*f[a-zA-Z]*(\s|$)|\s\+[^ ])|git\s.*reset\s.*--hard|git\s.*clean\s.*(\s-[a-zA-Z]*f|--force)' && why="강제 푸시 · reset --hard · clean -f(파이썬이 없어 글자로 봄)"
fi
if [ -n "$why" ]; then
  echo "🚫 차단됨: ${why}는 사용자의 명시적 확인 없이 실행할 수 없습니다." >&2
  echo "명령: $cmd" >&2
  exit 2
fi
exit 0
