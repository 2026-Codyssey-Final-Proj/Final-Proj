"""
F17·F18a·F18b — 이번 주 일정 제안, 일정으로 올리기, 겹치면 새 일정을 옮기기. 계산만 한다(캘린더 읽기·쓰기는 세션).
측정: Q11 하루 3시간 정도(상한), Q12 한 주 최대 10개 — 둘 다 잠정(사용자 2026-10-12, 써 보며 바꿈).
시험은 위반 시도를 먼저 본다: F18b 겹치는 시간, 하루·주 상한, 마감 뒤, 지난 시각.
"""
import tempfile
from datetime import date, datetime, timedelta
from pathlib import Path

from planning import Task, load_tasks, place_on, plan_week, to_events

NOW = datetime(2026, 10, 13, 12, 10)  # 화요일 — 이번 주는 10/13~10/18(일)
SUNDAY = date(2026, 10, 18)


def _t(name, deadline, purpose="작업"):
    return Task(purpose, name, deadline)


def _minutes(plan, day):
    return sum((p.end - p.start).seconds // 60 for p in plan.proposals if p.start.date() == day)


def _overlap(a, b):
    return a[0] < b[1] and b[0] < a[1]


def test_proposals_stay_inside_this_week_and_after_now():  # 지난 시각·다음 주에 잡지 않는다
    plan = plan_week([_t("가", date(2026, 10, 30))], [], NOW)
    p = plan.proposals[0]
    assert NOW <= p.start and p.start.date() <= SUNDAY and p.start.date() == NOW.date()


def test_daily_limit_three_hours_q11():
    tasks = [_t(f"일{i}", date(2026, 10, 18)) for i in range(6)]
    plan = plan_week(tasks, [], datetime(2026, 10, 13, 8, 0))
    for d in {p.start.date() for p in plan.proposals}:
        assert _minutes(plan, d) <= 180
    assert len(plan.proposals) == 6


def test_weekly_limit_ten_tasks_q12_and_the_rest_is_reported():
    tasks = [_t(f"일{i:02d}", date(2026, 10, 18)) for i in range(14)]
    plan = plan_week(tasks, [], datetime(2026, 10, 13, 8, 0))
    assert len(plan.proposals) == 10
    assert len(plan.left_out) == 4 and all("상한" in why for _, why in plan.left_out)


def test_earliest_deadline_comes_first():
    plan = plan_week([_t("늦은 일", date(2026, 10, 18)), _t("급한 일", date(2026, 10, 14))], [], NOW)
    assert [p.name for p in plan.proposals] == ["급한 일", "늦은 일"]


def test_never_after_the_deadline_day():
    plan = plan_week([_t("내일까지", date(2026, 10, 14))], [], NOW)
    assert all(p.start.date() <= date(2026, 10, 14) for p in plan.proposals)


def test_avoids_every_existing_event_including_life_events():  # F18b의 바탕: 겹치지 않게 제안한다
    busy = [(datetime(2026, 10, 13, 13, 0), datetime(2026, 10, 13, 14, 30))]  # 밥·운동 같은 생활 일정
    plan = plan_week([_t("가", date(2026, 10, 13))], busy, NOW)
    assert plan.proposals and not any(_overlap((p.start, p.end), busy[0]) for p in plan.proposals)


def test_when_no_time_is_left_before_the_deadline_it_is_reported_not_forced():
    busy = [(datetime(2026, 10, 13, 9, 0), datetime(2026, 10, 13, 21, 0))]
    plan = plan_week([_t("오늘까지", date(2026, 10, 13))], busy, NOW)
    assert plan.proposals == [] and plan.left_out[0][0] == "오늘까지" and "빈 시간" in plan.left_out[0][1]


def test_overdue_task_is_proposed_today_and_marked():
    plan = plan_week([_t("지난 일", date(2026, 10, 10))], [], NOW)
    assert plan.proposals[0].start.date() == NOW.date() and plan.proposals[0].overdue


def test_same_input_same_plan():
    tasks = [_t("나", date(2026, 10, 16)), _t("가", date(2026, 10, 16))]
    assert plan_week(tasks, [], NOW) == plan_week(list(reversed(tasks)), [], NOW)


def test_no_tasks_means_empty_plan_without_error():
    plan = plan_week([], [], NOW)
    assert plan.proposals == [] and plan.left_out == []


def test_events_are_exactly_the_confirmed_proposals():  # F18a
    plan = plan_week([_t("가", date(2026, 10, 16), "학교")], [], NOW)
    ev = to_events(plan.proposals)
    p = plan.proposals[0]
    assert ev == [{"title": "학교 / 가 / 작업 시간", "start": p.start, "end": p.end}]


def test_overlapping_slot_is_refused_and_another_time_is_offered():  # F18b 위반 시도
    busy = [(datetime(2026, 10, 14, 10, 0), datetime(2026, 10, 14, 11, 0))]
    before = list(busy)
    r = place_on(datetime(2026, 10, 14, 10, 30), 60, busy, NOW)
    assert not r.ok and r.conflicts == busy
    assert r.alternative is not None and not _overlap((r.alternative, r.alternative + timedelta(minutes=60)), busy[0])
    assert busy == before  # 기존 일정은 그대로


def test_free_slot_is_accepted_as_asked():
    r = place_on(datetime(2026, 10, 14, 15, 0), 60, [], NOW)
    assert r.ok and r.alternative is None and r.conflicts == []


def test_load_tasks_reads_open_tasks_only_and_skips_knowledge(tmp=None):
    root = Path(tempfile.mkdtemp())
    d = root / "vault" / "작업"
    d.mkdir(parents=True)
    (d / "2000 열린 일.md").write_text("# 열린 일\n- 번호: 2000\n- 목적: 작업\n- 마감: 2026-10-16\n- 상태: 진행\n", encoding="utf-8")
    (d / "2001 끝난 일.md").write_text("# 끝난 일\n- 번호: 2001\n- 목적: 작업\n- 마감: 2026-10-16\n- 상태: 완료\n", encoding="utf-8")
    k = root / "vault" / "지식" / "작업"
    k.mkdir(parents=True)
    (k / "지식.md").write_text("# 지식\n", encoding="utf-8")
    tasks = load_tasks(root)
    assert [(t.purpose, t.name, t.deadline) for t in tasks] == [("작업", "열린 일", date(2026, 10, 16))]


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain planning: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
