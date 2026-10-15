"""
.claude/hooks/ask-calendar-invite.sh 와 settings.json 의 캘린더 권한 설정 테스트
(세컨드 브레인 보완 3, 사용자 결정 2026-10-13: 삭제는 막고, 참석자 초대·캘린더 공유는 확인을 받는다).
실제 스크립트에 도구 입력 JSON을 넣어 본다.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / ".claude" / "hooks" / "ask-calendar-invite.sh"
SETTINGS = ROOT / ".claude" / "settings.json"


def _run(tool_input):
    r = subprocess.run(
        ["bash", str(HOOK)],
        input=json.dumps({"tool_input": tool_input}),
        capture_output=True,
        text=True,
    )
    return r.returncode, r.stdout.strip()


def _decision(out):
    return json.loads(out)["hookSpecificOutput"]["permissionDecision"]


def test_create_without_attendees_passes_silently():
    code, out = _run({"summary": "학교 / 과제 / 10/30까지", "startTime": "2026-10-30T08:00:00"})
    assert code == 0 and out == ""


def test_create_with_attendees_asks():
    code, out = _run({"summary": "x", "attendees": [{"email": "a@example.com"}]})
    assert code == 0 and _decision(out) == "ask"


def test_update_adding_attendees_asks():
    code, out = _run({"eventId": "e1", "addedAttendees": [{"email": "a@example.com"}]})
    assert code == 0 and _decision(out) == "ask"


def test_deprecated_attendee_email_lists_also_ask():
    assert _decision(_run({"summary": "x", "attendeeEmails": ["a@example.com"]})[1]) == "ask"
    assert _decision(_run({"eventId": "e1", "addedAttendeeEmails": ["a@example.com"]})[1]) == "ask"


def test_empty_attendee_lists_pass():
    code, out = _run({"summary": "x", "attendees": [], "addedAttendees": []})
    assert code == 0 and out == ""


def test_removing_attendees_does_not_ask():
    code, out = _run({"eventId": "e1", "removedAttendeeEmails": ["a@example.com"]})
    assert code == 0 and out == ""


def test_ask_reason_does_not_repeat_the_address():
    _, out = _run({"summary": "x", "attendees": [{"email": "private@example.com"}]})
    assert "private@example.com" not in out


def test_invite_hook_is_registered_for_event_tools():
    # 팀 설정에는 개인 캘린더 커넥터 id가 든 permissions(deny/ask)를 두지 않는다 — 훅 등록만 확인한다
    s = json.loads(SETTINGS.read_text(encoding="utf-8"))
    commands = [
        h["command"]
        for entry in s["hooks"]["PreToolUse"]
        if "event" in entry["matcher"]
        for h in entry["hooks"]
    ]
    assert ".claude/hooks/ask-calendar-invite.sh" in commands


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  calendar-invite hook: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
