"""
.claude/hooks/calendar-owner-guard.sh 테스트 (사용자 결정 2026-10-15: 다른 사람이 이 환경을 가져가 쓸 때
그 사람의 작업이 내 캘린더에 일정을 등록하지 않게).

기본이 막힘(fail-closed)이다: 이 컴퓨터에 "캘린더 소유자" 표시 파일이 없으면 일정 만들기·고치기를 막는다.
표시 파일은 저장소에 올라가지 않는다(.gitignore) — 사본·새 클론에는 없으므로 처음엔 항상 막힌다.
"""
import json
import os
import subprocess
import tempfile
from pathlib import Path

from bash_path import BASH

ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / ".claude" / "hooks" / "calendar-owner-guard.sh"
SETTINGS = ROOT / ".claude" / "settings.json"
GITIGNORE = ROOT / ".gitignore"


def _run(marker_exists=False, env_ok=None, tool_input=None):
    marker = Path(tempfile.mkdtemp()) / "calendar-owner.local"
    if marker_exists:
        marker.write_text("owner: this computer\n", encoding="utf-8")
    env = {k: v for k, v in os.environ.items() if k not in ("CALENDAR_OWNER_OK", "CALENDAR_OWNER_FILE")}
    env["CALENDAR_OWNER_FILE"] = str(marker)
    if env_ok is not None:
        env["CALENDAR_OWNER_OK"] = env_ok
    r = subprocess.run(
        [BASH, str(HOOK)],
        input=json.dumps({"tool_input": tool_input or {"summary": "학교 / 과제 / 10/30까지"}}),
        capture_output=True, text=True, encoding="utf-8", env=env,
    )
    return r.returncode, r.stdout.strip()


def _decision(out):
    return json.loads(out)["hookSpecificOutput"]["permissionDecision"]


def test_without_owner_marker_event_write_is_denied():
    code, out = _run(marker_exists=False)
    assert code == 0 and _decision(out) == "deny"


def test_with_owner_marker_passes_silently():
    code, out = _run(marker_exists=True)
    assert code == 0 and out == ""


def test_env_override_passes():
    code, out = _run(marker_exists=False, env_ok="1")
    assert code == 0 and out == ""


def test_env_override_other_values_do_not_pass():
    code, out = _run(marker_exists=False, env_ok="0")
    assert code == 0 and _decision(out) == "deny"


def test_update_event_input_is_also_denied_without_marker():
    code, out = _run(tool_input={"eventId": "e1", "summary": "[완료] x"})
    assert code == 0 and _decision(out) == "deny"


def test_deny_reason_says_how_to_fix_and_has_no_event_content():
    _, out = _run(tool_input={"summary": "비밀 일정 제목", "description": "메모 원문"})
    reason = json.loads(out)["hookSpecificOutput"]["permissionDecisionReason"]
    assert "calendar-owner.local" in reason
    assert "비밀 일정 제목" not in reason and "메모 원문" not in reason


def test_guard_is_registered_for_create_and_update_event():
    cfg = json.loads(SETTINGS.read_text(encoding="utf-8"))
    entries = [e for e in cfg["hooks"]["PreToolUse"] if "create|update" in e["matcher"]]
    commands = [h["command"] for e in entries for h in e["hooks"]]
    assert any(c.endswith("calendar-owner-guard.sh") for c in commands)
    assert any(c.endswith("ask-calendar-invite.sh") for c in commands)  # 기존 초대 확인은 그대로


def test_marker_file_is_gitignored():
    assert ".claude/calendar-owner.local" in GITIGNORE.read_text(encoding="utf-8").split("\n")


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  calendar-owner guard hook: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
