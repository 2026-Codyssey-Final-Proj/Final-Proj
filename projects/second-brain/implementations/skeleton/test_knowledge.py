"""
세컨드 브레인 — 지식 사이클(P1) 줄기 테스트: 남기기 → 찾기 → 다시 꺼내 쓰기(인용) → 점검에서 세기 → 할 일로 잇기.
추적표: F3(저장), F4a(낱말 찾기, Q3), F10a(관찰→해석→행동 세 칸), F10b(행동을 할 일로), Q4(가)(나), S1b, 6-3, S4.
자리와 인용 횟수: ADR-0008 (사용자 결정 2026-10-13 "가 / 가") — `vault/지식/<목적>/<이름>.md`, 머리말 `인용: N (마지막 날짜)`.
세션이 하는 일(원문에 없는 정보 쓰지 않기 S1a, 팀원 한 줄 S3, 확인 질문 Q6)은 코드가 아니라 여기에 없다.
가짜 키는 조각을 이어 붙여 만든다.
"""
import tempfile
from datetime import date
from pathlib import Path

from intake import parse_issue_title
from knowledge import action_issue_title, add_claude_tags, check_sentence, cite, find_knowledge, read_tags, save_knowledge, set_user_tags, week_counts
from listing import build_list

TODAY = date(2026, 10, 13)
FAKE_KEY = "sk-" + "ant-" + "api03-" + "A1b2C3d4E5f6G7h8I9j0K1l2"


def _raises(fn, *args, **kw):
    try:
        fn(*args, **kw)
    except ValueError as e:
        return str(e)
    raise AssertionError("ValueError가 나야 한다")


def _save(tmp, name="빈 배포 먼저", purpose="학교", **kw):
    args = dict(observation="배포를 마감 전날 시작해 3시간을 잃었다", interpretation="배포는 코드가 아니라 설정이라 늦게 드러난다",
                action="과제 첫날에 빈 배포를 해 본다", source="학교/1001 예시 수업", today=TODAY)
    args.update(kw)
    return save_knowledge(tmp / "vault", purpose, name, **args)


def test_save_writes_the_agreed_place_and_columns():  # F3, F10a, ADR-0008
    tmp = Path(tempfile.mkdtemp())
    p = _save(tmp)
    assert p == tmp / "vault" / "지식" / "학교" / "빈 배포 먼저.md"
    text = p.read_text(encoding="utf-8")
    for key in ("## 관찰", "## 해석", "## 행동", "- 출처: 학교/1001 예시 수업", "- 만든 날: 2026-10-13", "- 인용: 0 (마지막 -)"):
        assert key in text


def test_all_three_columns_are_required():  # Q4(가): 세 칸이 모두 찬 것만 지식으로 센다
    tmp = Path(tempfile.mkdtemp())
    assert "행동" in _raises(_save, tmp, action="  ")
    assert not (tmp / "vault").exists()


def test_bad_name_purpose_and_duplicates_are_refused():
    tmp = Path(tempfile.mkdtemp())
    _raises(_save, tmp, name="../밖으로")
    _raises(_save, tmp, purpose="취미")
    _save(tmp)
    assert "이미" in _raises(_save, tmp)


def test_sensitive_text_asks_first_and_never_leaks():  # 6-3, S4
    tmp = Path(tempfile.mkdtemp())
    msg = _raises(_save, tmp, observation="키 " + FAKE_KEY)
    assert "API 키" in msg and FAKE_KEY not in msg and not (tmp / "vault").exists()
    p = _save(tmp, observation="키 " + FAKE_KEY, confirmed=True)
    assert p.exists()


def test_find_matches_all_words_in_name_or_columns():  # F4a, Q3
    tmp = Path(tempfile.mkdtemp())
    _save(tmp)
    _save(tmp, name="발표 대본", observation="대본을 외우지 않고 읽었다", interpretation="요점만 적었어야 했다", action="발표 전날 요점 카드를 만든다")
    hit = find_knowledge(tmp / "vault", "배포 설정")
    assert [h.name for h in hit] == ["빈 배포 먼저"] and hit[0].purpose == "학교"
    assert find_knowledge(tmp / "vault", "없는말") == []
    assert [h.name for h in find_knowledge(tmp / "vault", "요점")] == ["발표 대본"]


def test_cite_counts_and_remembers_the_last_day():  # Q4(나)
    tmp = Path(tempfile.mkdtemp())
    p = _save(tmp)
    assert cite(p, date(2026, 10, 14)) == 1
    assert cite(p, date(2026, 10, 15)) == 2
    text = p.read_text(encoding="utf-8")
    assert "- 인용: 2 (마지막 2026-10-15)" in text and "## 행동" in text  # 다른 칸은 그대로


def test_week_counts_new_complete_ones_and_cited_ones():  # Q4(가)(나), 점검
    tmp = Path(tempfile.mkdtemp())
    a = _save(tmp)
    _save(tmp, name="지난주 것", today=date(2026, 10, 2))
    cite(a, date(2026, 10, 14))
    c = week_counts(tmp / "vault", date(2026, 10, 12), date(2026, 10, 18))
    assert c == {"new": 1, "cited_docs": 1}
    assert week_counts(tmp / "vault", date(2026, 10, 19), date(2026, 10, 25)) == {"new": 0, "cited_docs": 0}
    assert week_counts(tmp / "nowhere", date(2026, 10, 12), date(2026, 10, 18)) == {"new": 0, "cited_docs": 0}


def test_check_sentence_has_count_and_place_but_no_names():  # 점검 한 줄 (사용자 결정 2026-10-13)
    s = check_sentence(2)
    assert s == "이번 주 지식 2개가 `vault/지식/`에 저장됨"
    assert check_sentence(0) == "이번 주 지식 0개가 `vault/지식/`에 저장됨"


def test_action_becomes_a_task_issue_title_the_intake_can_read():  # F10b
    title = action_issue_title("학교", "빈 배포 해 보기", "과제 첫날에 빈 배포를 해 본다", date(2026, 10, 20))
    item = parse_issue_title(title, TODAY)
    assert item.kind == "new" and item.purpose == "학교" and item.name == "빈 배포 해 보기" and item.deadline == date(2026, 10, 20)


def test_action_without_a_deadline_is_not_turned_into_a_task():  # S1b: 마감은 지어내지 않는다
    assert "확인 필요" in _raises(action_issue_title, "학교", "빈 배포 해 보기", "첫날에 한다", None)


def test_knowledge_documents_do_not_show_up_in_the_task_list():  # ADR-0008
    tmp = Path(tempfile.mkdtemp())
    _save(tmp)
    out = build_list(tmp, TODAY)
    assert "읽지 못한" not in out and "아직 없음" in out and "빈 배포" not in out


def test_user_and_claude_tags_are_kept_apart():  # F13a
    tmp = Path(tempfile.mkdtemp())
    p = _save(tmp)
    set_user_tags(p, ["학교", "배포"])
    add_claude_tags(p, ["예시태그"])
    assert read_tags(p) == {"user": ["학교", "배포"], "claude": ["예시태그"]}


def test_claude_never_changes_or_removes_user_tags():  # F13b 위반 시도
    tmp = Path(tempfile.mkdtemp())
    p = _save(tmp)
    set_user_tags(p, ["학교", "배포"])
    add_claude_tags(p, ["배포", "학교", "새 태그"])  # 사용자 태그와 같은 말은 Claude 태그로 또 붙이지 않는다
    t = read_tags(p)
    assert t["user"] == ["학교", "배포"] and t["claude"] == ["새 태그"]


def test_setting_user_tags_keeps_claude_tags_and_the_body():
    tmp = Path(tempfile.mkdtemp())
    p = _save(tmp)
    add_claude_tags(p, ["자동"])
    set_user_tags(p, ["내 태그"])
    t = read_tags(p)
    assert t == {"user": ["내 태그"], "claude": ["자동"]} and "## 행동" in p.read_text(encoding="utf-8")


def test_new_document_has_no_tags_yet():
    assert read_tags(_save(Path(tempfile.mkdtemp()))) == {"user": [], "claude": []}


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain knowledge: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
