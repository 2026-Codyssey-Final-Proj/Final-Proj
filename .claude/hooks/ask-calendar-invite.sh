#!/usr/bin/env bash
# PreToolUse hook on 캘린더 일정 만들기·고치기 도구(create_event / update_event).
# 일정에 참석자(초대)나 손님 권한을 넣으려 하면 사용자 확인을 요구한다 —
# 초대는 다른 사람에게 알림·메일이 나가고 캘린더 공유와 이어지므로(세컨드 브레인 보완 3,
# 사용자 결정 2026-10-13) 필요한 상황에서만 사용자가 확인하고 보낸다.
# 일정을 지우는 도구는 settings.json permissions.deny가 막는다. 참석자가 없으면 아무 말 없이 통과한다.
# 주소 값은 이유 문구에 다시 쓰지 않는다(기록·보안 기준 6-3과 같은 생각).
has_invite=$(cat | jq -r '
  .tool_input
  | [(.attendees, .attendeeEmails, .addedAttendees, .addedAttendeeEmails)
     | select(. != null and length > 0)]
  | length > 0
')

if [ "$has_invite" = "true" ]; then
  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask",
    permissionDecisionReason: "캘린더 일정에 참석자(초대)를 넣으려 합니다. 다른 사람에게 알림이 나가고 캘린더 공유와 이어집니다. 초대가 필요한 상황인지 확인해 주세요."}}'
fi
exit 0
