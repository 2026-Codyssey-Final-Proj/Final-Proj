"""
F17 이번 주 일정 제안 · F18a 일정으로 올리기 · F18b 겹치면 새 일정을 옮김 — 계산만 한다.
캘린더 읽기(기존 일정 목록)와 쓰기(일정 만들기)는 세션이 하고, 쓰기 전에 사용자가 제안을 확인한다(F18a).
기준값은 모두 잠정이다(사용자 2026-10-12 "지금의 내용은 테스트로 변경될 사안임"): Q11 하루 3시간, Q12 한 주 10개,
할 일 하나에 잡는 시간 60분과 작업 시간대 09~21시는 이 값들을 정하지 않아 둔 임시 기본값 [잠정, 확인 필요].
세컨드 브레인은 기존 일정을 옮기거나 지우지 않는다 — 겹치면 새 일정만 다른 시간으로 제안한다(F18b).
"""
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from pathlib import Path

from listing import _read

DAILY_MINUTES = 180  # Q11
WEEKLY_MAX = 10  # Q12
TASK_MINUTES = 60  # [잠정]
WINDOW = (time(9, 0), time(21, 0))  # [잠정]
STEP = 30


@dataclass(frozen=True)
class Task:
    purpose: str
    name: str
    deadline: date


@dataclass(frozen=True)
class Proposal:
    start: datetime
    end: datetime
    purpose: str
    name: str
    deadline: date
    overdue: bool = False


@dataclass
class Plan:
    proposals: list = field(default_factory=list)
    left_out: list = field(default_factory=list)  # (이름, 이유)


@dataclass
class Placement:
    ok: bool
    start: datetime
    conflicts: list = field(default_factory=list)
    alternative: datetime | None = None


def _overlaps(a_start, a_end, busy):
    return [b for b in busy if a_start < b[1] and b[0] < a_end]


def _first_free(day, minutes, busy, not_before, window=WINDOW):
    start = datetime.combine(day, window[0])
    stop = datetime.combine(day, window[1])
    length = timedelta(minutes=minutes)
    while start + length <= stop:
        if start >= not_before and not _overlaps(start, start + length, busy):
            return start
        start += timedelta(minutes=STEP)
    return None


def _sunday(day):
    return day + timedelta(days=6 - day.weekday())


def plan_week(tasks, busy, now, *, daily_minutes=DAILY_MINUTES, weekly_max=WEEKLY_MAX, task_minutes=TASK_MINUTES):
    today, sunday = now.date(), _sunday(now.date())
    days = [today + timedelta(days=k) for k in range((sunday - today).days + 1)]
    taken = list(busy)
    used = {d: 0 for d in days}
    plan = Plan()
    for task in sorted(tasks, key=lambda t: (t.deadline, t.purpose, t.name)):
        if len(plan.proposals) >= weekly_max:
            plan.left_out.append((task.name, f"한 주 상한({weekly_max}개)을 넘음"))
            continue
        overdue = task.deadline < today
        last = sunday if overdue else min(task.deadline, sunday)
        slot = None
        for day in (d for d in days if d <= last and used[d] + task_minutes <= daily_minutes):
            slot = _first_free(day, task_minutes, taken, now)
            if slot:
                break
        if not slot:
            plan.left_out.append((task.name, "마감 전에 빈 시간이 없음"))
            continue
        end = slot + timedelta(minutes=task_minutes)
        plan.proposals.append(Proposal(slot, end, task.purpose, task.name, task.deadline, overdue))
        taken.append((slot, end))
        used[slot.date()] += task_minutes
    plan.proposals.sort(key=lambda p: p.start)
    return plan


def to_events(proposals):  # F18a: 확인된 제안과 글자 그대로 같은 제목·시각
    return [{"title": f"{p.purpose} / {p.name} / 작업 시간", "start": p.start, "end": p.end} for p in proposals]


def place_on(start, minutes, busy, now):  # F18b
    end = start + timedelta(minutes=minutes)
    conflicts = _overlaps(start, end, busy)
    if not conflicts:
        return Placement(True, start)
    sunday = _sunday(start.date())
    day = start.date()
    while day <= sunday:
        alt = _first_free(day, minutes, busy, max(start, now) if day == start.date() else datetime.min)
        if alt:
            return Placement(False, start, conflicts, alt)
        day += timedelta(days=1)
    return Placement(False, start, conflicts, None)


def load_tasks(root):
    root, tasks = Path(root), []
    base = root / "vault"
    for f in sorted(base.rglob("*.md")) if base.is_dir() else []:
        if f.relative_to(base).parts[0] == "지식":
            continue
        try:
            _, purpose, name, deadline, status, archived, _ = _read(root, f)
        except ValueError:
            continue
        if status != "완료" and not archived:
            tasks.append(Task(purpose, name, deadline))
    return tasks
