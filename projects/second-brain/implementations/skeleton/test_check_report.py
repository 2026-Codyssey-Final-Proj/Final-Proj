"""
UC11 — 일요일 점검 보고 생성 테스트. 실행 기록(run-log.md)과 할 일 문서(vault/)로 지난주(월~일) 초안을 만든다.
추적표: Q1(가)(다), D5, Q4(가)(나), S2c(읽지 못한 것 표시), S4(본문·원문을 담지 않음), 질문 카드 Q-A·Q-B(사용자 결정 2026-10-13).
기준 데이터: 2026-10-05~10-11 주의 실제 실행 기록 — 처음 손으로 만든 보고에서 새 일·완료 개수가 틀렸던 사례(2026-10-13).
"""
import tempfile
from datetime import date, datetime
from pathlib import Path

from check_report import build_report, write_report
from knowledge import save_knowledge

END = date(2026, 10, 11)  # 일요일

REAL_LOG = """2026-10-08 11:49 | new | 성공 | 학교/예시 과제 제출
2026-10-08 15:35 | calendar | 성공 | 마감/학교/예시 과제 제출 (시작 10-30 08:00, 알림 3개, 한가함)
2026-10-08 15:45 | edit | 성공 | 학교/예시 과제 제출
2026-10-08 15:56 | done | 성공 | 학교/예시 과제 제출
2026-10-08 16:49 | new | 성공 | 학교/예시 수업
2026-10-08 17:03 | new | 성공 | 생활/0 예시 심부름
2026-10-11 18:42 | done | 성공 | 생활/0 예시 심부름
2026-10-11 18:42 | done | 성공 | 학교/1001 예시 수업
2026-10-11 18:43 | calendar | 성공 | 마감/점검 알람 만듦 (매주 일요일 20:00, 시작 시각 알림 1개, 한가함, Claude 담당)
"""


def _root(log=REAL_LOG):
    root = Path(tempfile.mkdtemp())
    (root / "run-log.md").write_text(log, encoding="utf-8")
    return root


def _doc(root, purpose, number, name, deadline, status, body="본문은 보고에 들어가면 안 된다"):
    p = root / "vault" / purpose / f"{number} {name}.md"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(f"# {name}\n- 번호: {number}\n- 목적: {purpose}\n- 마감: {deadline}\n- 상태: {status}\n\n{body}\n", encoding="utf-8")


def _real_vault(root):
    _doc(root, "학교", 1000, "예시 과제 제출", "2026-11-05", "완료")
    _doc(root, "학교", 1001, "예시 수업", "2026-10-11", "완료")
    _doc(root, "생활", 0, "예시 심부름", "2026-10-10", "완료")


def _row(report, label):
    for line in report.splitlines():
        if line.startswith(f"| {label} |"):
            return line
    raise AssertionError(f"{label} 행이 없다")


def test_real_week_counts_what_the_run_log_says():
    root = _root()
    _real_vault(root)
    r = build_report(root, END)
    assert "| 새로 들어온 일 | 3개" in r and "| 완료 | 3개" in r
    assert "기간: 2026-10-05 ~ 2026-10-11" in r


def test_marked_after_deadline_needs_the_users_answer_and_is_not_counted_yet():  # Q-A
    root = _root()
    _real_vault(root)
    r = build_report(root, END)
    assert "확인 필요" in r and "예시 심부름" in r
    assert "미포함 1개" in _row(r, "Q1 (가) 저장 기록상 놓친 일")


def test_answer_on_time_but_late_mark_is_not_a_miss():
    root = _root()
    _real_vault(root)
    r = build_report(root, END, answers={"예시 심부름": "제때 했는데 표시만 늦음"})
    assert "| Q1 (가) 저장 기록상 놓친 일 | 0개" in r and "확인 필요" not in r


def test_answer_late_counts_as_a_miss():
    root = _root()
    _real_vault(root)
    r = build_report(root, END, answers={"예시 심부름": "늦게 함"})
    assert "| Q1 (가) 저장 기록상 놓친 일 | 1개" in r


def test_unfinished_past_due_is_listed_and_counted():
    root = _root("")
    _doc(root, "작업", 2000, "보고서", "2026-10-09", "진행")
    r = build_report(root, END)
    assert "| 마감 지남·미완료 | 1개" in r and "보고서" in r
    assert "| Q1 (가) 저장 기록상 놓친 일 | 1개" in r


def test_learned_late_items_and_causes_are_counted_with_the_total():  # Q1(다), D5, 합계
    root = _root()
    _real_vault(root)
    r = build_report(root, END, answers={"예시 심부름": "제때 했는데 표시만 늦음"},
                     late_known=[("", "급하게 다른 일들이 있었음"), ("발표 자료", "알람이 늦게 와서")])
    assert "| Q1 (다) 늦게 알게 된 일 | 2개" in r and "이름 미기재" in r and "발표 자료" in r
    assert "| D5 알람이 늦어서 놓친 일 | 1개" in r
    assert "| Q1 합계 | 2개" in r and "초과" in r


def test_total_one_meets_the_goal():
    root = _root()
    _real_vault(root)
    r = build_report(root, END, answers={"예시 심부름": "제때 했는데 표시만 늦음"}, late_known=[("", "급하게 다른 일들이 있었음")])
    assert "| Q1 합계 | 1개" in r and "충족" in r


def test_unknown_cause_is_refused():
    root = _root()
    try:
        build_report(root, END, late_known=[("", "그냥")])
    except ValueError as e:
        assert "원인" in str(e)
    else:
        raise AssertionError("ValueError가 나야 한다")


def test_knowledge_line_has_count_but_no_names_or_bodies():  # 사용자 결정 2026-10-13, S4
    root = _root()
    _real_vault(root)
    save_knowledge(root / "vault", "학교", "아주 개인적인 지식 이름", observation="관찰 내용", interpretation="해석 내용",
                   action="행동 내용", today=date(2026, 10, 9))
    r = build_report(root, END)
    assert "이번 주 지식 1개가 `vault/지식/`에 저장됨" in r
    assert "개인적인" not in r and "관찰 내용" not in r and "본문은 보고에" not in r


def test_knowledge_documents_are_not_read_as_tasks():
    root = _root("")
    save_knowledge(root / "vault", "학교", "지식 하나", observation="a", interpretation="b", action="c", today=date(2026, 10, 9))
    r = build_report(root, END)
    assert "읽지 못한" not in r and "| 새로 들어온 일 | 0개" in r


def test_unreadable_task_document_is_shown_not_hidden():  # S2c
    root = _root("")
    (root / "vault" / "학교").mkdir(parents=True)
    (root / "vault" / "학교" / "1005 깨진 문서.md").write_text("형식 없음", encoding="utf-8")
    r = build_report(root, END)
    assert "읽지 못한 문서 1개" in r and "깨진 문서" in r


def test_empty_workspace_gives_zeros_without_crashing():
    r = build_report(Path(tempfile.mkdtemp()), END)
    assert "| 새로 들어온 일 | 0개" in r and "| Q1 합계 | 0개" in r and "충족" in r


def test_same_input_gives_same_report():
    root = _root()
    _real_vault(root)
    assert build_report(root, END) == build_report(root, END)


def test_next_check_is_the_following_sunday():
    assert "| 다음 점검 | 2026-10-18(일) 20:00 |" in build_report(_root(), END)


def test_write_report_saves_under_check_folder_and_never_overwrites():
    root = _root()
    _real_vault(root)
    p = write_report(root, END, answers={"예시 심부름": "제때 했는데 표시만 늦음"})
    assert p == root / "점검" / "2026-10-11.md" and "# 주 점검 2026-10-11" in p.read_text(encoding="utf-8")
    try:
        write_report(root, END)
    except ValueError as e:
        assert "이미" in str(e)
    else:
        raise AssertionError("확정본을 덮어쓰면 안 된다")


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain check report: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
