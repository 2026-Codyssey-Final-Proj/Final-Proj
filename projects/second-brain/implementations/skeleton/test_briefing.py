"""
F7a·F8a — 대화를 시작할 때의 브리핑: 마감이 지난 일, 3일 이내 할 일(남은 날), 진행 중인 프로젝트와 단계, 다음 할 일.
추적표 시험: "대화 시작 시 3일 이내 할 일이 빠짐없이 나오는지". 이름·날짜·개수만 말하고 본문은 담지 않는다(S4).
프로젝트 단계는 세션 파일의 게이트 로그에서 읽는다 — 상태의 원천은 그곳뿐이다(프로젝트 CLAUDE.md).
"""
import tempfile
from datetime import date
from pathlib import Path

from briefing import build_briefing, current_stage, default_session

TODAY = date(2026, 10, 13)  # 화요일


def _root(*tasks):
    root = Path(tempfile.mkdtemp())
    for i, (purpose, name, deadline, status) in enumerate(tasks):
        d = root / "vault" / purpose
        d.mkdir(parents=True, exist_ok=True)
        (d / f"{2000 + i} {name}.md").write_text(
            f"# {name}\n- 번호: {2000 + i}\n- 목적: {purpose}\n- 마감: {deadline}\n- 상태: {status}\n\n비공개 본문 {i}\n",
            encoding="utf-8",
        )
    return root


GATES = """## 게이트 로그

| 게이트 | 결정 | 근거 |
|---|---|---|
| 1 → 2 | **Go** (2026-10-01 재심사) | 리뷰 판정 Recycle → Go |
| 2 → 3 | **Go** (2026-10-07) | ... |
| 3 → 4 | **Go** (2026-10-08) | ... |
| 4 → 5 | **Go** (2026-10-11) | 보완 5개, 리뷰 판정 Recycle 이력 |
| 5 → 6 | | |
| 6 → 7 | | |
"""


def test_overdue_and_soon_tasks_are_listed_with_days_left():  # F8a
    root = _root(("작업", "지난 일", "2026-10-11", "진행"), ("학교", "내일 일", "2026-10-14", "진행"),
                 ("작업", "오늘 일", "2026-10-13", "진행"), ("생활", "사흘 뒤", "2026-10-16", "진행"))
    b = build_briefing(root, TODAY)
    assert "지난 일" in b and "2일 지남" in b
    assert "오늘 마감" in b and "내일" in b and "D-3" in b


def test_done_and_archived_tasks_never_appear():
    root = _root(("작업", "끝난 일", "2026-10-14", "완료"))
    arch = root / "vault" / "작업" / "보관"
    arch.mkdir(parents=True)
    (arch / "2100 보관된 일.md").write_text("# 보관된 일\n- 번호: 2100\n- 목적: 작업\n- 마감: 2026-10-14\n- 상태: 진행\n", encoding="utf-8")
    b = build_briefing(root, TODAY)
    assert "끝난 일" not in b and "보관된 일" not in b and "열린 할 일이 없습니다" in b


def test_three_day_window_is_inclusive_and_four_days_is_not_soon():
    root = _root(("작업", "삼일", "2026-10-16", "진행"), ("작업", "사일", "2026-10-17", "진행"))
    b = build_briefing(root, TODAY)
    soon = b.split("## 다음 할 일")[0]
    assert "삼일" in soon and "사일" not in soon
    assert "사일" in b.split("## 다음 할 일")[1]


def test_every_soon_task_is_shown_without_a_cap():  # "빠짐없이"
    root = _root(*[("작업", f"급한{i}", "2026-10-14", "진행") for i in range(7)])
    b = build_briefing(root, TODAY)
    assert all(f"급한{i}" in b for i in range(7))


def test_next_tasks_are_the_three_nearest_beyond_three_days():
    root = _root(("작업", "가까움", "2026-10-15", "진행"), ("작업", "다섯째", "2026-11-30", "진행"),
                 ("작업", "둘째", "2026-10-20", "진행"), ("작업", "셋째", "2026-10-25", "진행"), ("작업", "넷째", "2026-11-10", "진행"))
    nxt = build_briefing(root, TODAY).split("## 다음 할 일")[1].split("##")[0]
    assert [n for n in ("둘째", "셋째", "넷째", "다섯째") if n in nxt] == ["둘째", "셋째", "넷째"]
    assert "가까움" not in nxt


def test_stage_comes_from_the_last_passed_gate():
    stage, note = current_stage(GATES)
    assert stage == 5 and "2026-10-11" in note


def test_recycle_keeps_the_project_on_its_stage():
    stage, note = current_stage(GATES.replace("| 5 → 6 | | |", "| 5 → 6 | **Recycle** (2026-10-20) | 요구 미충족 |"))
    assert stage == 5 and "Recycle" in note


def test_missing_gate_log_says_unknown_without_crashing():
    assert current_stage("그냥 글")[0] is None


def test_projects_section_uses_the_session_file(tmp=None):
    root = _root()
    s = root / "session.md"
    s.write_text(GATES, encoding="utf-8")
    b = build_briefing(root, TODAY, projects=[("second-brain", s), ("없는파일", root / "none.md")])
    assert "second-brain — 5단계 진행 중" in b and "없는파일 — 단계 정보 없음" in b


def test_no_body_text_and_same_input_same_output():  # S4
    root = _root(("작업", "일", "2026-10-14", "진행"))
    b = build_briefing(root, TODAY)
    assert "비공개 본문" not in b and b == build_briefing(root, TODAY)


def test_empty_workspace_still_gives_a_briefing():
    b = build_briefing(Path(tempfile.mkdtemp()), TODAY)
    assert "2026-10-13" in b and "열린 할 일이 없습니다" in b


def test_command_line_entry_prints_the_briefing():
    import subprocess, sys
    root = _root(("작업", "일", "2026-10-14", "진행"))
    out = subprocess.run([sys.executable, str(Path(__file__).with_name("briefing.py")), str(root), "--today", "2026-10-13"],
                         capture_output=True, text=True)
    assert out.returncode == 0 and "# 브리핑 2026-10-13(화)" in out.stdout and "내일" in out.stdout


def test_command_line_entry_never_fails_the_session_on_a_missing_folder():
    import subprocess, sys
    out = subprocess.run([sys.executable, str(Path(__file__).with_name("briefing.py")), "/nonexistent/folder"],
                         capture_output=True, text=True)
    assert out.returncode == 0
    assert "찾지 못했습니다" in out.stdout and "열린 할 일이 없습니다" not in out.stdout  # 폴더가 없는 것을 일이 없는 것으로 말하지 않는다


def test_default_session_prefers_progress_file_then_the_old_session_file():  # 팀 레포의 상태 원천은 PROGRESS.md
    base = Path(tempfile.mkdtemp())
    old = base / "docs/01-problem-save/sessions/project-track/2026-09-30-second-brain.md"
    old.parent.mkdir(parents=True)
    old.write_text(GATES, encoding="utf-8")
    assert default_session(base) == old
    (base / "PROGRESS.md").write_text(GATES, encoding="utf-8")
    assert default_session(base) == base / "PROGRESS.md"
    assert default_session(Path(tempfile.mkdtemp())).name == "PROGRESS.md"  # 둘 다 없으면 이름만, 읽을 때 "단계 정보 없음"


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain briefing: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
