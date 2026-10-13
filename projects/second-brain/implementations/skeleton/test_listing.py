"""
UC13 인수 기준 T1~T8 — 할 일 문서를 목록 한 장으로 모은다 (세션 파일 UC13).
목록은 결과물이다: 같은 창고와 같은 날짜면 글자 하나까지 같고, 본문(내용)은 담지 않는다.
가짜 키는 조각을 이어 붙여 만든다.
"""
import tempfile
from datetime import date
from pathlib import Path
from urllib.parse import unquote

from listing import build_list, write_list

TODAY = date(2026, 10, 9)


def _doc(root, purpose, number, name, deadline, status="진행", body="본문", archived=False):
    d = root / "vault" / purpose / ("보관" if archived else "")
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{number} {name}.md").write_text(
        f"# {name}\n- 번호: {number}\n- 목적: {purpose}\n- 마감: {deadline}\n- 상태: {status}\n\n{body}\n", encoding="utf-8")


def _root():
    return Path(tempfile.mkdtemp())


def _section(text, title):
    """'## 제목' 아래부터 다음 '## '까지."""
    head = text.index(f"## {title}")
    nxt = text.find("\n## ", head + 1)
    return text[head: nxt if nxt != -1 else len(text)]


def test_t1_grouped_by_purpose_and_ordered_by_number():
    r = _root()
    _doc(r, "작업", 2000, "보고서", "2026-10-31")
    _doc(r, "학교", 1001, "예시 나", "2026-10-31")
    _doc(r, "생활", 0, "예시 심부름", "2026-10-31")
    _doc(r, "학교", 1000, "예시 가", "2026-10-31")
    sec = _section(build_list(r, TODAY), "진행")
    assert [sec.index(n) for n in ("예시 심부름", "예시 가", "예시 나", "보고서")] == sorted(sec.index(n) for n in ("예시 심부름", "예시 가", "예시 나", "보고서"))


def test_t2_overdue_imminent_open_done_sections_in_that_order():
    r = _root()
    _doc(r, "학교", 1000, "어제마감", "2026-10-08")
    _doc(r, "학교", 1001, "모레마감", "2026-10-11")
    _doc(r, "학교", 1002, "한참뒤", "2026-12-01")
    _doc(r, "학교", 1003, "끝난일", "2026-10-01", status="완료")
    t = build_list(r, TODAY)
    assert "어제마감" in _section(t, "지남") and "모레마감" in _section(t, "임박")
    assert "한참뒤" in _section(t, "진행") and "끝난일" in _section(t, "완료")
    assert t.index("## 지남") < t.index("## 임박") < t.index("## 진행") < t.index("## 완료")


def test_t2_overdue_count_is_stated_for_q1():  # Q1의 (가): 마감이 지났는데 완료 표시가 없는 일
    r = _root()
    _doc(r, "학교", 1000, "어제마감", "2026-10-08")
    _doc(r, "학교", 1001, "그제마감", "2026-10-07")
    assert "지남 2개" in build_list(r, TODAY)


def test_t3_body_text_is_never_in_the_list():
    r = _root()
    _doc(r, "학교", 1000, "과제", "2026-10-30", body="예시 내용 3문제")
    assert "트리 구현" not in build_list(r, TODAY)


def test_t4_an_unreadable_doc_is_reported_not_hidden():
    r = _root()
    _doc(r, "학교", 1000, "정상1", "2026-10-30")
    _doc(r, "학교", 1001, "정상2", "2026-10-31")
    (r / "vault" / "학교" / "1002 깨짐.md").write_text("# 깨짐\n마감이 없다\n", encoding="utf-8")
    t = build_list(r, TODAY)
    assert "정상1" in t and "정상2" in t and "읽지 못한 문서 1개" in t and t.index("읽지 못한 문서") < t.index("## 지남")
    assert "1002 깨짐.md" in t


def test_t5_empty_or_missing_vault_gives_an_empty_list_not_an_error():
    r = _root()
    assert "아직 없음" in build_list(r, TODAY)
    (r / "vault").mkdir()
    assert "아직 없음" in build_list(r, TODAY)


def test_t6_same_input_gives_the_same_text():
    r = _root()
    _doc(r, "학교", 1000, "예시 가", "2026-10-30")
    _doc(r, "생활", 0, "예시 심부름", "2026-10-10")
    assert build_list(r, TODAY) == build_list(r, TODAY)


def test_t7_each_row_links_to_the_exact_path():
    r = _root()
    _doc(r, "학교", 1001, "예시 수업", "2026-10-30")
    t = build_list(r, TODAY)
    links = [unquote(s.split("](")[1].split(")")[0]) for s in t.splitlines() if "](" in s]
    assert links == ["vault/학교/1001 예시 수업.md"] and (r / links[0]).exists()


def test_t8_archived_docs_stay_in_done_and_keep_their_number():
    r = _root()
    _doc(r, "학교", 1000, "끝난일", "2026-10-01", status="완료", archived=True)
    sec = _section(build_list(r, TODAY), "완료")
    assert "1000" in sec and "보관" in sec


def test_write_list_writes_the_file_next_to_the_vault():
    r = _root()
    _doc(r, "학교", 1000, "예시 가", "2026-10-30")
    p = write_list(r, TODAY)
    assert p == r / "목록.md" and "예시 가" in p.read_text(encoding="utf-8") and "만든 날짜: 2026-10-09" in p.read_text(encoding="utf-8")


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain listing: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
