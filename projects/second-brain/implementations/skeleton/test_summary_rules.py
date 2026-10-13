"""
요약 규칙 — S1a 원문에 없는 정보 쓰지 않기(부분 검사), S1c·Q6 확인 질문 최대 2개, Q7 요약 20줄 이내.
S1a의 한계(솔직하게): 코드가 확인하는 것은 날짜·숫자·주소가 원문에 있는지뿐이다. 사람 이름·사실 관계는 못 본다 —
그건 세션에서 사람(Claude)이 지키는 절차로 남는다. 시험은 위반 시도(원문에 없는 날짜·숫자)를 먼저 본다.
"""
from summary_rules import MAX_QUESTIONS, MAX_SUMMARY_LINES, check_summary_length, limit_questions, ungrounded

SOURCE = "회의 메모: 과제 제출은 2026-10-30, 문제는 10개, 자료는 https://example.com/a 에 있음. 시험은 10/16 10:00."


# --- S1a ---
def test_date_not_in_the_source_is_flagged():
    assert "2026-11-05" in ungrounded("제출은 2026-11-05까지", SOURCE)


def test_date_in_the_source_is_fine():
    assert ungrounded("제출은 2026-10-30까지, 시험은 10/16 10:00", SOURCE) == []


def test_number_not_in_the_source_is_flagged():
    assert "12" in ungrounded("문제는 12개", SOURCE)


def test_number_inside_a_longer_number_does_not_count_as_grounded():  # "1"이 "10"·"2026" 안에 있다고 통과시키지 않는다
    assert "1" in ungrounded("문제는 1개", SOURCE)


def test_url_not_in_the_source_is_flagged():
    assert "https://other.example.org/x" in ungrounded("자료는 https://other.example.org/x", SOURCE)


def test_summary_without_figures_has_nothing_to_flag():
    assert ungrounded("과제와 시험 일정을 정리했다", SOURCE) == []


def test_each_flag_is_reported_once_in_order():
    flags = ungrounded("2026-11-05 와 12 와 2026-11-05", SOURCE)
    assert flags == ["2026-11-05", "12"]


# --- S1c·Q6 ---
def test_at_most_two_questions_are_asked_now():
    now, later = limit_questions(["가?", "나?", "다?", "라?", "마?"])
    assert now == ["가?", "나?"] and later == ["다?", "라?", "마?"] and MAX_QUESTIONS == 2


def test_two_or_fewer_questions_are_unchanged():
    assert limit_questions(["가?", "나?"]) == (["가?", "나?"], [])
    assert limit_questions([]) == ([], [])


def test_blank_questions_are_dropped_before_counting():
    assert limit_questions(["", "  ", "가?"]) == (["가?"], [])


# --- Q7 ---
def test_summary_of_twenty_lines_is_ok_and_twenty_one_is_not():
    ok = "\n".join(f"줄 {i}" for i in range(20))
    assert check_summary_length(ok) == (True, 0) and MAX_SUMMARY_LINES == 20
    assert check_summary_length(ok + "\n줄 20") == (False, 1)


def test_blank_lines_are_not_counted():
    text = "\n".join(["줄", "", "줄", "  ", "줄"])
    assert check_summary_length(text) == (True, 0)


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain summary rules: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
