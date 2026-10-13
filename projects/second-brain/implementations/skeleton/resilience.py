"""
자동화 실패 처리 — S2b 다시 시도의 상한, S2c 일부만 성공했을 때 빠진 것 표시, S2a·S2d 알림과 기록.
Q5 (사용자 결정 2026-10-04): 1초 → 2초 → 4초, 첫 시도 뒤 최대 3번 [해석: "최대 3번"].
연결 오류·시간 초과(TransientError)만 다시 시도한다. 요청이 잘못된 오류(RequestError, 4xx)와
그 밖의 오류는 바로 실패로 처리한다. 오류 문구에 값이 섞일 수 있어 기록·요약에는 종류만 쓴다(S4).
"""
import time
from dataclasses import dataclass, field

from intake import _log

DELAYS = (1, 2, 4)


class TransientError(Exception):
    """연결 오류·시간 초과 — 다시 시도해도 되는 오류."""


class RequestError(Exception):
    """요청이 잘못된 오류(4xx) — 다시 시도하지 않는다."""


@dataclass
class Attempt:
    ok: bool
    value: object = None
    attempts: int = 1
    reason: str = ""


@dataclass
class Steps:
    done: list = field(default_factory=list)
    missing: list = field(default_factory=list)  # (이름, 이유)

    @property
    def summary(self):
        text = "완료: " + (" · ".join(self.done) or "없음")
        if self.missing:
            text += " / 빠진 것: " + " · ".join(f"{n}({why})" for n, why in self.missing)
        return text


def retry(call, sleep=time.sleep):
    for attempt in range(len(DELAYS) + 1):
        try:
            return Attempt(True, call(), attempt + 1)
        except TransientError:
            if attempt == len(DELAYS):
                return Attempt(False, attempts=attempt + 1, reason=f"연결 오류, {len(DELAYS)}번 다시 시도했지만 안 됨")
            sleep(DELAYS[attempt])
        except RequestError:
            return Attempt(False, reason="요청이 잘못됨(다시 시도하지 않음)")
        except Exception as e:  # 모르는 오류는 다시 시도하지 않는다 — 종류만 남긴다
            return Attempt(False, reason=f"예상 못 한 오류({type(e).__name__})")


def run_steps(steps, log_path, now, sleep=time.sleep):
    out = Steps()
    for name, call in steps:
        r = retry(call, sleep)
        if r.ok:
            out.done.append(name)
        else:
            out.missing.append((name, r.reason))
        _log(log_path, now, "step", r.ok, f"{name}" + ("" if r.ok else f" — {r.reason}"))
    return out
