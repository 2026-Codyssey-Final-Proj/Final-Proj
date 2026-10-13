"""
할 일의 시간 — 예상 시간을 30분 단위로 적고, 완료하면 실제로 걸린 시간을 기록하고, 다음에 비슷한 일을 넣을 때 그 기록으로 묻는다.
사용자 결정 2026-10-13: "30분 단위로 작업을 작성이 가능하도록 하고 완료하면 어느정도 걸리는지에 대한 데이터를 수집 해서
다음번에 데이터를 기반으로 질문". 근거: 사람은 자기 일의 시간을 짧게 잡는 경향이 있고, 비슷한 일에 실제로 걸린 시간을
떠올리게 하면 그 편향이 줄었다(Buehler·Griffin·Ross 1994, gate-questions-5to6.md).
원천은 할 일 문서 하나하나(`예상 시간`·`실제 시간` 칸)이고 통계는 문서에서 다시 만든다 — 상태를 따로 두지 않는다.
시험은 위반 시도(30분 단위가 아닌 값, 완료 전 기록, 이름 노출)를 먼저 본다.
"""
import tempfile
from datetime import date
from pathlib import Path

from duration import (completion_question, duration_history, read_actual, read_estimate, record_actual,
                      set_estimate, suggest_minutes)

TODAY = date(2026, 10, 14)


def _doc(root, purpose="작업", number=2000, name="공부", status="진행", archived=False, extra=""):
    d = root / "vault" / purpose / ("보관" if archived else "")
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"{number} {name}.md"
    p.write_text(f"# {name}\n- 번호: {number}\n- 목적: {purpose}\n- 마감: 2026-10-20\n- 상태: {status}\n- 일정: abc\n{extra}\n본문\n",
                 encoding="utf-8")
    return p


def _raises(fn, *a, **k):
    try:
        fn(*a, **k)
    except ValueError as e:
        return str(e)
    raise AssertionError("ValueError가 나야 한다")


def _root():
    return Path(tempfile.mkdtemp())


# --- 30분 단위로 적기 ---
def test_estimate_is_written_in_the_header_in_thirty_minute_steps():
    p = _doc(_root())
    set_estimate(p, 90)
    text = p.read_text(encoding="utf-8")
    assert "- 예상 시간: 90분" in text and text.index("- 예상 시간") < text.index("본문") and read_estimate(p) == 90


def test_estimate_must_be_a_positive_multiple_of_thirty():  # 위반 시도
    p = _doc(_root())
    for bad in (0, 15, 45, -30, 100):
        assert "30분 단위" in _raises(set_estimate, p, bad)
    assert read_estimate(p) is None


def test_setting_again_replaces_and_keeps_the_rest():
    p = _doc(_root())
    set_estimate(p, 60)
    set_estimate(p, 120)
    text = p.read_text(encoding="utf-8")
    assert text.count("예상 시간") == 1 and "- 예상 시간: 120분" in text and "- 일정: abc" in text and "본문" in text


def test_missing_estimate_reads_as_none():
    assert read_estimate(_doc(_root())) is None


# --- 완료하면 걸린 시간 기록 ---
def test_actual_is_recorded_only_after_the_task_is_done():  # 위반 시도
    p = _doc(_root(), status="진행")
    assert "완료" in _raises(record_actual, p, 90, TODAY)
    assert read_actual(p) is None


def test_actual_is_recorded_with_the_day_and_may_be_any_positive_minutes():
    p = _doc(_root(), status="완료")
    record_actual(p, 100, TODAY)  # 실제는 재는 값이라 30분 단위로 올림하지 않는다
    assert "- 실제 시간: 100분 (2026-10-14)" in p.read_text(encoding="utf-8")
    assert read_actual(p) == 100


def test_actual_must_be_positive():
    p = _doc(_root(), status="완료")
    assert "0보다" in _raises(record_actual, p, 0, TODAY)


# --- 모아 보기 ---
def test_history_collects_done_tasks_with_actuals_including_archived():
    r = _root()
    a = _doc(r, name="가", number=2000, status="완료", extra="- 예상 시간: 60분\n")
    record_actual(a, 90, TODAY)
    b = _doc(r, name="나", number=2001, status="완료", archived=True)
    record_actual(b, 30, TODAY)
    _doc(r, name="다", number=2002, status="진행")  # 기록 없음
    h = duration_history(r / "vault")
    assert sorted((x["name"], x["estimate"], x["actual"]) for x in h) == [("가", 60, 90), ("나", None, 30)]


def test_history_skips_knowledge_documents_and_unreadable_files():
    r = _root()
    k = r / "vault" / "지식" / "작업"
    k.mkdir(parents=True)
    (k / "지식.md").write_text("# 지식\n- 실제 시간: 30분 (2026-10-01)\n", encoding="utf-8")
    (r / "vault" / "작업").mkdir(parents=True)
    (r / "vault" / "작업" / "깨진.md").write_text("형식 아님", encoding="utf-8")
    assert duration_history(r / "vault") == []
    assert duration_history(r / "nowhere") == []


# --- 다음번에 데이터로 묻기 ---
def test_without_history_it_asks_with_the_default_and_the_agreed_options():
    q = suggest_minutes([], "작업")
    assert q["recommended"] == 60 and q["based_on"] == 0 and q["options"] == [30, 60, 90, 120, 180]
    assert "기록이 아직 없" in q["question"]


def test_with_history_it_recommends_the_median_of_the_same_purpose_rounded_up():
    h = [{"purpose": "작업", "name": "가", "estimate": 60, "actual": 80},
         {"purpose": "작업", "name": "나", "estimate": 60, "actual": 100},
         {"purpose": "작업", "name": "다", "estimate": 60, "actual": 150},
         {"purpose": "학교", "name": "라", "estimate": 60, "actual": 30}]  # 다른 목적은 섞지 않는다
    q = suggest_minutes(h, "작업")
    assert q["based_on"] == 3 and q["recommended"] == 120  # 중앙값 100 → 30분 단위 올림 120
    assert 120 in q["options"] and q["options"] == sorted(set(q["options"]))
    assert "3건" in q["question"] and "100분" in q["question"]


def test_it_mentions_how_much_longer_than_estimated_when_estimates_exist():
    h = [{"purpose": "작업", "name": f"일{i}", "estimate": 60, "actual": 90} for i in range(3)]
    q = suggest_minutes(h, "작업")
    assert "1.5배" in q["question"]


def test_few_records_are_marked_as_reference_only():
    h = [{"purpose": "작업", "name": "가", "estimate": None, "actual": 60}]
    assert "참고만" in suggest_minutes(h, "작업")["question"]


def test_question_never_contains_task_names():  # S4: 이름이 질문 문장에 새지 않는다
    h = [{"purpose": "작업", "name": "아주 사적인 이름", "estimate": 60, "actual": 90}]
    assert "사적인" not in suggest_minutes(h, "작업")["question"]


def test_recommended_option_is_always_offered_even_when_large():
    h = [{"purpose": "작업", "name": "가", "estimate": 60, "actual": 400}]
    q = suggest_minutes(h, "작업")
    assert q["recommended"] == 420 and 420 in q["options"]


# --- 완료할 때 묻기 ---
def test_completion_question_offers_steps_around_the_estimate():
    q = completion_question(120)
    assert q["options"] == [60, 90, 120, 150, 180] and "예상 120분" in q["question"]


def test_completion_question_never_offers_below_thirty_and_works_without_estimate():
    assert completion_question(30)["options"][0] == 30
    q = completion_question(None)
    assert q["options"] == [30, 60, 90, 120, 180] and "직접" in q["question"]


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain duration: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
