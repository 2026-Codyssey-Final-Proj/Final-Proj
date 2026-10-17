"""
데이터 폴더의 자리를 설정 한 곳에서 받는다 — ADR-0010 (사용자 결정 2026-10-14, 5→6 보완 바: "각자 로컬 폴더 + 설정 한 곳").
환경변수 `SECOND_BRAIN_DATA`가 있으면 그 폴더, 없으면 기본 자리. 폴더가 있는지는 부르는 쪽이 본다(없으면 "찾지 못했습니다").
"""
from pathlib import Path

from config import ENV, data_dir


def test_env_value_wins_over_the_default():
    assert data_dir("/repo/data", {ENV: "/home/me/second-brain"}) == Path("/home/me/second-brain")


def test_missing_or_blank_env_falls_back_to_the_default():
    assert data_dir("/repo/data", {}) == Path("/repo/data")
    assert data_dir("/repo/data", {ENV: "   "}) == Path("/repo/data")


def test_home_marker_is_expanded():
    assert data_dir("/repo/data", {ENV: "~/sb"}) == Path.home() / "sb"


def test_env_name_is_the_documented_one():
    assert ENV == "SECOND_BRAIN_DATA"


def test_it_does_not_create_or_check_the_folder():  # 폴더를 만들지 않는다(없으면 알리는 건 부르는 쪽)
    p = data_dir("/definitely/not/here", {})
    assert not p.exists()


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain config: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
