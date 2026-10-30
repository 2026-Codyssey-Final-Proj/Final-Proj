#!/usr/bin/env bash
# PreToolUse hook on Bash. Claude가 main으로 올리는 것을 막는다 (팀 결정 2026-10-12).
# 사람은 자기 터미널에서 main에 직접 푸시할 수 있다 — 이 훅은 Claude Code의 Bash 호출만 본다.
# 막는 것: main/master로 가는 git push, main/master 위에서 하는 커밋, gh pr merge.
# 2026-10-30(고칠 목록 F-105-3): 판정은 공용 도우미(gitcmd.py main) — 전에는 앞 토큰만 봐서 `gh -R o/r pr merge` ·
#   `env git push origin main` · `bash -c "git push origin main"` · `git -C <main 폴더> commit`이 지나갔다.
. "$(dirname "$0")/lib.sh"
cmd=$(json_field tool_input.command)
[ -n "$cmd" ] || exit 0
if [ -z "$PY" ]; then
  # 파이썬이 없으면 판정할 수 없다 — main에 닿을 수 있는 명령만 막는다(막는 쪽이 안전)
  if echo "$cmd" | grep -qE 'git\s.*(push|commit)|gh\s.*pr\s+merge'; then
    echo "🚫 차단됨: 파이썬을 찾지 못해 main 보호를 확인할 수 없습니다. python을 설치한 뒤 다시 하세요." >&2
    exit 2
  fi
  exit 0
fi

why=$(gitcmd main "$cmd"); rc=$?
# 도우미가 죽으면(0 · 3이 아닌 끝 코드) 막는 쪽 — main에 닿을 수 있는 명령만(새 맥락 리뷰)
[ $rc -ne 0 ] && echo "$cmd" | grep -qE 'git\s.*(push|commit)|gh\s.*pr\s+merge' && why="판정 도우미(gitcmd.py)가 실패해 main 보호를 확인할 수 없습니다."
if [ -n "$why" ]; then
  echo "🚫 차단됨: $why" >&2
  echo "Claude는 main에 올리지 않습니다. 브랜치를 만들어 거기에 커밋·푸시하고, main 반영은 사람이 자기 터미널에서 합니다." >&2
  echo "명령: $cmd" >&2
  exit 2
fi
exit 0
