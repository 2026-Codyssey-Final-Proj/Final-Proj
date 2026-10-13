"""
세컨드 브레인 — 자동화 실패 처리 테스트 (S2b 재시도 상한, S2c 일부만 성공, S2a·S2d 알림·기록, S4).
Q5 (사용자 결정 2026-10-04): 간격 1초 → 2초 → 4초, 최대 3번 다시 시도(첫 시도 뒤 3번으로 읽음 [해석]),
연결 오류·시간 초과만 다시 시도하고 요청이 잘못된 오류(4xx)와 그 밖의 오류는 바로 실패로 처리한다.
시간은 주입해서 테스트가 실제로 잠자지 않는다. 가짜 키는 조각을 이어 붙여 만든다.
"""
import tempfile
from datetime import datetime
from pathlib import Path

from resilience import RequestError, TransientError, retry, run_steps

NOW = datetime(2026, 10, 13, 20, 0)
FAKE_KEY = "sk-" + "ant-" + "api03-" + "A1b2C3d4E5f6G7h8I9j0K1l2"


def _flaky(failures, error=TransientError):
    state = {"n": 0}

    def call():
        state["n"] += 1
        if state["n"] <= failures:
            raise error("연결 오류")
        return "ok"

    call.state = state
    return call


def test_success_on_first_try_never_sleeps():
    slept = []
    r = retry(_flaky(0), sleep=slept.append)
    assert r.ok and r.value == "ok" and r.attempts == 1 and slept == []


def test_transient_errors_are_retried_with_growing_gaps():  # S2b
    slept = []
    r = retry(_flaky(2), sleep=slept.append)
    assert r.ok and r.attempts == 3 and slept == [1, 2]


def test_gives_up_after_three_retries_and_says_so():  # S2b 상한, S2a
    slept = []
    call = _flaky(99)
    r = retry(call, sleep=slept.append)
    assert not r.ok and r.attempts == 4 and slept == [1, 2, 4] and call.state["n"] == 4
    assert "연결 오류" in r.reason and "3번" in r.reason


def test_request_errors_fail_immediately_without_retry():  # Q5: 4xx는 바로 실패
    slept = []
    call = _flaky(99, error=RequestError)
    r = retry(call, sleep=slept.append)
    assert not r.ok and r.attempts == 1 and slept == [] and call.state["n"] == 1


def test_unknown_errors_are_not_retried_either():
    slept = []
    r = retry(_flaky(99, error=ValueError), sleep=slept.append)
    assert not r.ok and r.attempts == 1 and slept == []


def test_partial_success_names_what_is_missing():  # S2c
    tmp = Path(tempfile.mkdtemp())
    out = run_steps(
        [("문서", lambda: "쓴 문서"), ("캘린더 일정", _flaky(99))],
        tmp / "run-log.md", NOW, sleep=lambda s: None,
    )
    assert out.done == ["문서"] and [m[0] for m in out.missing] == ["캘린더 일정"]
    assert "빠진 것" in out.summary and "캘린더 일정" in out.summary and "문서" in out.summary


def test_every_failure_is_logged_without_the_error_text():  # S2d, S4
    tmp = Path(tempfile.mkdtemp())

    def leaky():
        raise TransientError("토큰 " + FAKE_KEY)

    run_steps([("캘린더 일정", leaky)], tmp / "run-log.md", NOW, sleep=lambda s: None)
    log = (tmp / "run-log.md").read_text(encoding="utf-8")
    assert "캘린더 일정" in log and "실패" in log and FAKE_KEY not in log


def test_everything_succeeds_means_nothing_missing():
    tmp = Path(tempfile.mkdtemp())
    out = run_steps([("문서", lambda: 1), ("기록", lambda: 2)], tmp / "run-log.md", NOW, sleep=lambda s: None)
    assert out.missing == [] and "빠진" not in out.summary and out.done == ["문서", "기록"]


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain resilience: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
