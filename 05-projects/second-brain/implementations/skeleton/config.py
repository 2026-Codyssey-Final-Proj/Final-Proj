"""
데이터 폴더의 자리를 설정 한 곳에서 받는다 — ADR-0010 (사용자 결정 2026-10-14: 각자 로컬 폴더 + 설정 한 곳).
환경변수 `SECOND_BRAIN_DATA`가 있으면 그 폴더, 없으면 기본 자리. 폴더를 만들거나 있는지 확인하지 않는다 —
없으면 "찾지 못했습니다"라고 말하는 것은 부르는 쪽이다(일이 없다고 말하면 안 된다).
"""
import os
from pathlib import Path

ENV = "SECOND_BRAIN_DATA"


def data_dir(default, env=None):
    value = (os.environ if env is None else env).get(ENV, "").strip()
    return Path(value).expanduser() if value else Path(default)
