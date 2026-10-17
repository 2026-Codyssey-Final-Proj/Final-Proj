#!/usr/bin/env bash
# PreToolUse hook on 캘린더 일정 만들기·고치기 도구(create_event / update_event).
# 이 컴퓨터에 "캘린더 소유자" 표시 파일(.claude/calendar-owner.local)이 없으면 일정 쓰기를 막는다 —
# 다른 사람이 이 환경을 가져가 쓸 때 그 사람의 작업이 저장소 주인의 캘린더에 일정을 등록하지 않게
# (사용자 결정 2026-10-15). 기본이 막힘(fail-closed)이다: 표시 파일은 .gitignore라 사본·새 클론에는 없다.
#
# 통과 조건(하나라도): 환경변수 CALENDAR_OWNER_OK=1 / 표시 파일이 있음.
#   표시 파일 자리: 환경변수 CALENDAR_OWNER_FILE > 이 저장소의 .claude/calendar-owner.local >
#   주 작업 폴더(git worktree의 본 폴더)의 같은 파일 — 세션이 worktree에서 열려도 소유자가 막히지 않게.
# 이유 문구에는 일정 제목·메모·주소를 다시 쓰지 않는다(기록·보안 기준 6-3과 같은 생각).
cat >/dev/null  # 도구 입력은 보지 않는다 — 내용이 아니라 "누구 컴퓨터인가"만 본다

if [ "${CALENDAR_OWNER_OK:-}" = "1" ]; then exit 0; fi

here="$(cd "$(dirname "$0")/.." && pwd)"
marker="${CALENDAR_OWNER_FILE:-$here/calendar-owner.local}"
if [ -f "$marker" ]; then exit 0; fi

if [ -z "${CALENDAR_OWNER_FILE:-}" ]; then
  common="$(git -C "$here" rev-parse --git-common-dir 2>/dev/null)"
  if [ -n "$common" ]; then
    main_root="$(cd "$here" && cd "$common/.." 2>/dev/null && pwd)"
    if [ -n "$main_root" ] && [ -f "$main_root/.claude/calendar-owner.local" ]; then exit 0; fi
  fi
fi

printf '%s\n' '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
  "permissionDecisionReason": "이 컴퓨터에는 캘린더 소유자 표시(.claude/calendar-owner.local)가 없어 일정 등록·수정을 막았습니다. 다른 사람이 이 환경을 가져다 쓸 때 저장소 주인의 캘린더에 일정이 등록되지 않게 하는 안전장치입니다. 이 컴퓨터에서 연결된 캘린더가 본인 것이 맞다면 그 파일을 만들어 주세요(예: touch .claude/calendar-owner.local). 파일은 저장소에 올라가지 않습니다."}}'
exit 0
