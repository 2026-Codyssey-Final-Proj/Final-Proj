"""
할 일의 시간 — 예상 시간을 30분 단위로 적고, 완료하면 실제로 걸린 시간을 기록하고, 다음에 비슷한 일을 넣을 때 그 기록으로 묻는다.
사용자 결정 2026-10-13: "30분 단위로 작업을 작성이 가능하도록 하고 완료하면 어느정도 걸리는지에 대한 데이터를 수집 해서
다음번에 데이터를 기반으로 질문". 근거: 사람은 자기 일의 시간을 짧게 잡기 쉽고, 비슷한 일에 실제로 걸린 시간을 떠올리면
그 편향이 줄었다(Buehler·Griffin·Ross 1994).
원천은 할 일 문서의 `예상 시간`·`실제 시간` 칸이고, 통계는 문서에서 다시 만든다(상태를 따로 두지 않는다).
질문 문장에는 개수와 분만 있고 할 일 이름은 없다(S4).
"""
import math
import re
from pathlib import Path
from statistics import median

from intake import _FILE, _field

STEP = 30
DEFAULT = 60  # 사용자가 정한 기본값 (2026-10-13)
OPTIONS = [30, 60, 90, 120, 180]  # 선택지 (사용자 확인 대기 — 3시간은 하루 상한 Q11을 전부 쓴다)
FEW = 3  # 이보다 적으면 "참고만"
_EST = re.compile(r"^- 예상 시간: (\d+)분$", re.M)
_ACT = re.compile(r"^- 실제 시간: (\d+)분 \((\d{4}-\d{2}-\d{2})\)$", re.M)


def _set_line(path, key, value):
    path = Path(path)
    text = path.read_text(encoding="utf-8")
    line = f"- {key}: {value}"
    if re.search(rf"^- {key}: .*$", text, re.M):
        text = re.sub(rf"^- {key}: .*$", lambda _: line, text, flags=re.M)
    else:  # 머리말(제목 아래 "- " 줄들)의 끝에 둔다
        m = re.match(r"(# .*\n(?:- .*\n)+)", text)
        if not m:
            raise ValueError("할 일 문서 형식이 아닙니다")
        text = m[1] + line + "\n" + text[m.end():]
    path.write_text(text, encoding="utf-8")


def read_estimate(path):
    m = _EST.search(Path(path).read_text(encoding="utf-8"))
    return int(m[1]) if m else None


def read_actual(path):
    m = _ACT.search(Path(path).read_text(encoding="utf-8"))
    return int(m[1]) if m else None


def set_estimate(path, minutes):
    if not isinstance(minutes, int) or minutes <= 0 or minutes % STEP:
        raise ValueError(f"예상 시간은 {STEP}분 단위(30, 60, 90 …)여야 합니다")
    _set_line(path, "예상 시간", f"{minutes}분")


def record_actual(path, minutes, today):
    if _field(Path(path).read_text(encoding="utf-8"), "상태") != "완료":
        raise ValueError("완료한 뒤에 걸린 시간을 기록합니다")
    if not isinstance(minutes, int) or minutes <= 0:
        raise ValueError("걸린 시간은 0보다 커야 합니다")
    _set_line(path, "실제 시간", f"{minutes}분 ({today})")  # 재는 값이라 30분으로 올리지 않는다


def duration_history(vault):
    base = Path(vault)
    rows = []
    for f in sorted(base.rglob("*.md")) if base.is_dir() else []:
        if f.relative_to(base).parts[0] == "지식":
            continue
        m, text = _FILE.match(f.name), f.read_text(encoding="utf-8")
        act = _ACT.search(text)
        if not (m and act):
            continue
        est = _EST.search(text)
        rows.append({"purpose": _field(text, "목적") or f.parent.name, "name": m[2],
                     "estimate": int(est[1]) if est else None, "actual": int(act[1]), "day": act[2]})
    return rows


def _up(minutes):
    return int(math.ceil(minutes / STEP)) * STEP


def suggest_minutes(history, purpose):
    same = [h for h in history if h["purpose"] == purpose]
    if not same:
        return {"question": "비슷한 일에 걸린 시간 기록이 아직 없어요. 이번 일은 몇 분으로 잡을까요? (30분 단위)",
                "options": list(OPTIONS), "recommended": DEFAULT, "based_on": 0}
    typical = median(h["actual"] for h in same)
    rec = _up(typical)
    ratios = [h["actual"] / h["estimate"] for h in same if h["estimate"]]
    text = f"같은 목적({purpose})의 일 {len(same)}건이 보통 {int(typical)}분 걸렸어요"
    if ratios:
        text += f", 예상보다 보통 {median(ratios):.1f}배였고"
    text += f". 이번 일은 몇 분으로 잡을까요? (추천 {rec}분)"
    if len(same) < FEW:
        text += " 기록이 적어 참고만 하세요."
    return {"question": text, "options": sorted(set(OPTIONS + [rec])), "recommended": rec, "based_on": len(same)}


def completion_question(estimate):
    if estimate is None:
        return {"question": "실제로 얼마나 걸렸어요? 30분 단위로 고르거나 직접 적어 주세요.", "options": list(OPTIONS)}
    options = [m for m in (estimate - 60, estimate - 30, estimate, estimate + 30, estimate + 60) if m >= STEP]
    return {"question": f"실제로 얼마나 걸렸어요? (예상 {estimate}분) 30분 단위로 고르거나 직접 적어 주세요.", "options": options}
