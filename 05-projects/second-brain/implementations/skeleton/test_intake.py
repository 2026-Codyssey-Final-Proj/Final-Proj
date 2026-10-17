"""
세컨드 브레인 Walking Skeleton 테스트 — 폰 이슈 한 줄 → 파싱 → 문서 → 알람 한 줄 → 실행 기록.
이슈 제목 틀 (사용자 결정 2026-10-08, ADR-0005):
  새 일   목적 / 이름 / 내용 / 마감       예: 학교 / 예시 과제 제출 / 예시 내용 3문제 / 10-30
  완료    완료 / 목적 / 이름     또는  완료 / 번호
  수정    수정 / 목적 / 이름 / 새 마감     또는  수정 / 번호 / 새 마감
번호 (사용자 결정 2026-10-08, D10·ADR-0006): 목적마다 범위가 있고, 다시 쓰지 않으며, 알림 제목에는 넣지 않는다.
추적표: F8b(알람), F11(넣기·완료·수정), S2d(실행 기록), S4·S9(원문·비밀값), 기록·보안 기준 6-3(입력 경고).
가짜 키는 조각을 이어 붙여 만든다(이 파일 자체에 키 모양 문자열이 남지 않게).
"""
import tempfile
from datetime import date, datetime
from pathlib import Path

from intake import alarm_line, calendar_event, next_number, parse_issue_title, process_issue, save_event_id, sensitive_hints

TODAY = date(2026, 10, 9)
NOW = datetime(2026, 10, 9, 9, 0)
FAKE_KEY = "sk-" + "ant-" + "api03-" + "A1b2C3d4E5f6G7h8I9j0K1l2"
NEW = "학교 / 예시 과제 제출 / 예시 내용 3문제 / 10-30"


def _raises(fn, *args):
    try:
        fn(*args)
    except ValueError as e:
        return str(e)
    raise AssertionError("ValueError가 나야 한다")


# --- 1 파싱 ---
def test_parse_new():
    item = parse_issue_title(NEW, TODAY)
    assert (item.kind, item.purpose, item.name, item.content, item.deadline) == (
        "new", "학교", "예시 과제 제출", "예시 내용 3문제", date(2026, 10, 30))


def test_parse_content_may_contain_slashes():
    item = parse_issue_title("작업 / 보고서 / 1장/2장 정리 / 10-30", TODAY)
    assert (item.name, item.content, item.deadline) == ("보고서", "1장/2장 정리", date(2026, 10, 30))


def test_parse_done_and_edit():
    done = parse_issue_title("완료 / 학교 / 예시 과제 제출", TODAY)
    assert (done.kind, done.purpose, done.name, done.deadline) == ("done", "학교", "예시 과제 제출", None)
    edit = parse_issue_title("수정 / 학교 / 예시 과제 제출 / 2026-11-05", TODAY)
    assert (edit.kind, edit.deadline) == ("edit", date(2026, 11, 5))


def test_parse_rejects_purpose_outside_the_five():
    assert "목적" in _raises(parse_issue_title, "취미 / 기타치기 / 연습 / 10-30", TODAY)


def test_parse_rejects_missing_deadline_without_inventing_one():  # S1b
    assert "마감" in _raises(parse_issue_title, "학교 / 예시 과제 제출 / 트리 구현", TODAY)
    assert "날짜" in _raises(parse_issue_title, "학교 / 예시 과제 제출 / 트리 구현 / 곧", TODAY)


def test_parse_rejects_past_and_invalid_dates():
    assert "지났" in _raises(parse_issue_title, "학교 / 과제 / 내용 / 10-01", TODAY)
    assert "날짜" in _raises(parse_issue_title, "학교 / 과제 / 내용 / 02-30", TODAY)


def test_parse_rejects_unsafe_names():  # 위반 시도: 경로를 벗어나려는 이름
    for bad in ["학교 / ../밖 / 내용 / 10-30", "학교 / .숨김 / 내용 / 10-30", "학교 /  / 내용 / 10-30"]:
        _raises(parse_issue_title, bad, TODAY)


def test_errors_never_echo_the_title():  # S4: 값을 다시 보이지 않는다
    msg = _raises(parse_issue_title, "학교 / " + FAKE_KEY + " / 내용", TODAY)
    assert FAKE_KEY not in msg


# --- 3 알람 문구와 일정 ---
def test_alarm_line_is_purpose_name_deadline():
    item = parse_issue_title(NEW, TODAY)
    assert alarm_line(item) == "학교 / 예시 과제 제출 / 10/30까지"


def test_alarm_line_never_contains_the_content():  # D2: 원문·메모를 보내지 않는다
    assert "트리 구현" not in alarm_line(parse_issue_title(NEW, TODAY))


def test_calendar_event_has_three_reminders_at_8am():  # Q2
    ev = calendar_event(parse_issue_title(NEW, TODAY), NOW)
    assert ev["start"] == datetime(2026, 10, 30, 8, 0)
    assert ev["reminders"] == [datetime(2026, 10, 27, 8, 0), datetime(2026, 10, 29, 8, 0), datetime(2026, 10, 30, 8, 0)]


def test_a_past_reminder_is_replaced_by_tonight_8pm():  # D11: 지난 알림 대신 오늘 저녁 8시
    ev = calendar_event(parse_issue_title("학교 / 과제 / 내용 / 10-12", TODAY), NOW)
    assert ev["reminders"] == [datetime(2026, 10, 9, 20, 0), datetime(2026, 10, 11, 8, 0), datetime(2026, 10, 12, 8, 0)]


def test_no_tonight_reminder_when_nothing_is_past():
    ev = calendar_event(parse_issue_title(NEW, TODAY), NOW)
    assert datetime(2026, 10, 9, 20, 0) not in ev["reminders"] and len(ev["reminders"]) == 3


def test_no_tonight_reminder_after_8pm():  # 오늘 저녁 8시가 이미 지났다
    ev = calendar_event(parse_issue_title("학교 / 과제 / 내용 / 10-12", TODAY), datetime(2026, 10, 9, 21, 0))
    assert ev["reminders"] == [datetime(2026, 10, 11, 8, 0), datetime(2026, 10, 12, 8, 0)]


def test_deadline_today_after_8am_gets_one_tonight_reminder():  # D11 바뀜 (사용자 "나", 2026-10-13): 이전에는 넣지 않았다
    ev = calendar_event(parse_issue_title("학교 / 과제 / 내용 / 10-09", TODAY), NOW)
    assert ev["reminders"] == [datetime(2026, 10, 9, 20, 0)] and ev["start"] == datetime(2026, 10, 9, 20, 0)


def test_deadline_today_after_8pm_has_no_alarm_left_to_set():  # 저녁 8시도 지났다 — 알릴 시각이 없다
    ev = calendar_event(parse_issue_title("학교 / 과제 / 내용 / 10-09", TODAY), datetime(2026, 10, 9, 21, 0))
    assert ev["reminders"] == []


# --- 6-3 입력 경고 ---
def test_sensitive_hints_names_the_kind_not_the_value():
    assert sensitive_hints("키는 " + FAKE_KEY) == ["API 키"]
    assert sensitive_hints("비밀번호: hunter2") == ["비밀번호"]
    assert sensitive_hints("예시 과제 제출") == []


# --- 번호 (D10) ---
def _doc(tmp, purpose, number, name):
    d = tmp / "vault" / purpose
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{number} {name}.md").write_text(f"# {name}\n- 번호: {number}\n", encoding="utf-8")


def test_next_number_starts_at_each_purpose_range():
    tmp = Path(tempfile.mkdtemp())
    assert [next_number(tmp / "vault", p) for p in ("생활", "학교", "작업", "대회", "기타")] == [0, 1000, 2000, 3000, 4000]


def test_numbers_are_never_reused_even_after_archiving():
    tmp = Path(tempfile.mkdtemp())
    _run(NEW, tmp)
    _run("학교 / 예시 수업 / 과제 / 10-31", tmp)
    (tmp / "vault" / "학교" / "보관").mkdir()
    (tmp / "vault" / "학교" / "1001 예시 수업.md").rename(tmp / "vault" / "학교" / "보관" / "1001 예시 수업.md")
    assert next_number(tmp / "vault", "학교") == 1002  # 보관으로 옮겨도 번호는 그대로 쓰인 것으로 센다


def test_new_issue_gets_the_next_number_in_its_range():
    tmp = Path(tempfile.mkdtemp())
    _run(NEW, tmp)
    r = _run("작업 / 보고서 / 내용 / 10-31", tmp)
    assert r.ok and r.number == 2000 and r.path.name == "2000 보고서.md"
    assert "보고서" in r.event["title"] and "2000" not in r.event["title"]  # 알림 제목에는 번호를 넣지 않는다


def test_new_refuses_when_the_range_is_full():
    tmp = Path(tempfile.mkdtemp())
    _doc(tmp, "학교", 1999, "마지막")
    r = _run(NEW, tmp)
    assert not r.ok and "번호" in r.message


def test_done_and_edit_by_number():
    tmp = Path(tempfile.mkdtemp())
    _run(NEW, tmp)
    e = _run("수정 / 1000 / 11-05", tmp)
    assert e.ok and e.event["start"] == datetime(2026, 11, 5, 8, 0)
    d = _run("완료 / 1000", tmp)
    assert d.ok and "상태: 완료" in d.path.read_text(encoding="utf-8")


def test_parse_number_forms_and_rejects_numbers_outside_any_range():
    assert parse_issue_title("완료 / 1000", TODAY).number == 1000
    edit = parse_issue_title("수정 / 1000 / 11-05", TODAY)
    assert (edit.number, edit.deadline) == (1000, date(2026, 11, 5))
    assert "번호" in _raises(parse_issue_title, "완료 / 9999", TODAY)


def test_done_event_marks_complete_clears_reminders_and_keeps_the_event_id():  # D9
    tmp = Path(tempfile.mkdtemp())
    r = _run(NEW, tmp)
    save_event_id(r.path, "abc123")
    d = _run("완료 / 학교 / 예시 과제 제출", tmp)
    assert d.event == {"event_id": "abc123", "title": "[완료] 학교 / 예시 과제 제출 / 10/30까지", "reminders": []}


def test_edit_event_carries_the_event_id_and_new_times():  # D9
    tmp = Path(tempfile.mkdtemp())
    r = _run(NEW, tmp)
    save_event_id(r.path, "abc123")
    e = _run("수정 / 학교 / 예시 과제 제출 / 11-05", tmp)
    assert e.event["event_id"] == "abc123" and e.event["title"] == "학교 / 예시 과제 제출 / 11/5까지"


def test_save_event_id_replaces_an_old_one():
    tmp = Path(tempfile.mkdtemp())
    r = _run(NEW, tmp)
    save_event_id(r.path, "old")
    save_event_id(r.path, "new")
    assert r.path.read_text(encoding="utf-8").count("- 일정:") == 1 and "일정: new" in r.path.read_text(encoding="utf-8")


# --- 전체 줄기 (스모크) ---
def _run(title, tmp, now=NOW):
    return process_issue(title, tmp / "vault", TODAY, now, tmp / "run-log.md")


def test_smoke_new_issue_becomes_file_event_and_log():
    tmp = Path(tempfile.mkdtemp())
    r = _run(NEW, tmp)
    assert r.ok and r.event["title"] == "학교 / 예시 과제 제출 / 10/30까지"
    doc = (tmp / "vault" / "학교" / "1000 예시 과제 제출.md").read_text(encoding="utf-8")
    assert "마감: 2026-10-30" in doc and "상태: 진행" in doc and "번호: 1000" in doc and "예시 내용 3문제" in doc
    assert "new | 성공 | 학교/1000 예시 과제 제출" in (tmp / "run-log.md").read_text(encoding="utf-8")


def test_smoke_done_and_edit_update_the_same_file():
    tmp = Path(tempfile.mkdtemp())
    _run(NEW, tmp)
    e = _run("수정 / 학교 / 예시 과제 제출 / 11-05", tmp)
    assert e.ok and e.event["start"] == datetime(2026, 11, 5, 8, 0)
    d = _run("완료 / 학교 / 예시 과제 제출", tmp)
    doc = (tmp / "vault" / "학교" / "1000 예시 과제 제출.md").read_text(encoding="utf-8")
    assert d.ok and d.event["reminders"] == [] and "마감: 2026-11-05" in doc and "상태: 완료" in doc


def test_failure_is_logged_and_reported_not_hidden():  # S2a·S2d
    tmp = Path(tempfile.mkdtemp())
    r = _run("완료 / 학교 / 없는 할 일", tmp)
    assert not r.ok and "찾지 못" in r.message
    assert "done | 실패" in (tmp / "run-log.md").read_text(encoding="utf-8")


def test_duplicate_new_is_refused():  # D5: 같은 일정을 두 번 만들지 않는다
    tmp = Path(tempfile.mkdtemp())
    _run(NEW, tmp)
    r = _run("학교 / 예시 과제 제출 / 다른 내용 / 11-01", tmp)
    assert not r.ok and "이미" in r.message


def test_sensitive_input_asks_first_then_proceeds_without_leaking():  # 6-3 "그대로 진행 / 수정", S4
    tmp = Path(tempfile.mkdtemp())
    title = "학교 / 과제 / 키 " + FAKE_KEY + " / 10-30"
    r = _run(title, tmp)
    assert not r.ok and r.hints == ["API 키"] and FAKE_KEY not in r.message
    assert not (tmp / "vault").exists()  # 확인 전에는 아무것도 쓰지 않는다
    r = process_issue(title, tmp / "vault", TODAY, NOW, tmp / "run-log.md", confirmed=True)
    assert r.ok and r.hints == ["API 키"]
    assert FAKE_KEY not in (tmp / "run-log.md").read_text(encoding="utf-8")


def test_same_day_deadline_after_the_alarm_hour_moves_to_tonight():  # D11 연장 (사용자 결정 2026-10-13 "나")
    item = parse_issue_title("작업 / 문서 업그레이드 / 두 문서를 고친다 / 10-13", date(2026, 10, 13))
    e = calendar_event(item, datetime(2026, 10, 13, 11, 30))
    assert e["start"] == datetime(2026, 10, 13, 20, 0) and e["reminders"] == [datetime(2026, 10, 13, 20, 0)]
    assert e["title"] == "작업 / 문서 업그레이드 / 10/13까지"  # 제목은 그대로, 시각만 옮긴다


def test_same_day_deadline_before_the_alarm_hour_is_unchanged():
    item = parse_issue_title("작업 / 문서 업그레이드 / 두 문서를 고친다 / 10-13", date(2026, 10, 13))
    e = calendar_event(item, datetime(2026, 10, 13, 7, 0))
    assert e["start"] == datetime(2026, 10, 13, 8, 0) and e["reminders"] == [datetime(2026, 10, 13, 8, 0)]


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain skeleton: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
