"""
지식 목록(`지식목록.md`) — 쌓인 지식을 목적별로 한 장에 나열한다. 할 일 목록(`목록.md`)과 같은 성격: **결과물이지 원천이 아니다**.
원천은 지식 문서 하나하나이고, 목록은 고치지 않고 다시 만든다. 관찰·해석 본문은 담지 않고 행동 한 줄만 보인다(S4).
인용이 2번 이상이면 "승격 후보" — Q4(다) 체크리스트로 올릴 후보를 7단계 회고에서 바로 쓰려는 표시다.
"""
import tempfile
from datetime import date
from pathlib import Path

from knowledge import cite, save_knowledge
from knowledge_list import build_knowledge_list, write_knowledge_list

TODAY = date(2026, 10, 13)


def _save(root, name, purpose="작업", action="다음엔 첫날 빈 배포를 한다", made=date(2026, 10, 10), source="", **kw):
    return save_knowledge(root / "vault", purpose, name, observation="관찰 원문입니다", interpretation="해석 원문입니다",
                          action=action, source=source, today=made, **kw)


def _root():
    return Path(tempfile.mkdtemp())


def test_empty_vault_says_there_is_nothing_yet():
    out = build_knowledge_list(_root(), TODAY)
    assert "아직 없음" in out and "만든 날짜: 2026-10-13" in out and "총 0개" in out


def test_groups_by_purpose_and_sorts_newest_first_then_name():
    r = _root()
    _save(r, "오래된", made=date(2026, 10, 1))
    _save(r, "가나다", made=date(2026, 10, 12))
    _save(r, "새것", made=date(2026, 10, 12))
    _save(r, "학교 지식", purpose="학교", made=date(2026, 10, 5))
    out = build_knowledge_list(r, TODAY)
    work = out.split("### 작업")[1].split("### 학교")[0]
    assert work.index("가나다") < work.index("새것") < work.index("오래된")
    assert out.index("### 학교") < out.index("### 작업")  # 목적 순서는 intake.PURPOSES(생활·학교·작업·대회·기타)를 따른다
    assert "총 4개" in out


def test_shows_only_the_action_never_the_observation_or_interpretation():  # S4
    r = _root()
    _save(r, "하나")
    out = build_knowledge_list(r, TODAY)
    assert "첫날 빈 배포" in out and "관찰 원문" not in out and "해석 원문" not in out


def test_long_or_multiline_action_is_cut_to_one_short_line():
    r = _root()
    _save(r, "긴 것", action="첫 줄 " + "가" * 100 + "\n둘째 줄은 안 보인다")
    out = build_knowledge_list(r, TODAY)
    row = [l for l in out.splitlines() if l.startswith("| 긴 것")][0]
    assert "둘째 줄" not in row and "…" in row and len(row) < 200


def test_pipes_in_text_do_not_break_the_table():
    r = _root()
    _save(r, "파이프 | 이름", action="가 | 나")
    out = build_knowledge_list(r, TODAY)
    row = [l for l in out.splitlines() if "파이프" in l and l.startswith("|")][0]
    assert row.count("|") - row.count("\\|") == 7  # 6칸의 경계선 7개


def test_cited_twice_or_more_becomes_a_promotion_candidate():  # Q4(다)
    r = _root()
    a = _save(r, "자주 씀")
    b = _save(r, "한 번 씀")
    cite(a, date(2026, 10, 11))
    cite(a, date(2026, 10, 12))
    cite(b, date(2026, 10, 12))
    out = build_knowledge_list(r, TODAY)
    cand = out.split("## 승격 후보")[1].split("## 목적별")[0]
    assert "자주 씀" in cand and "한 번 씀" not in cand and "승격 후보 1개" in out


def test_no_promotion_section_content_when_nothing_is_cited_enough():
    out = build_knowledge_list(_root(), TODAY)
    assert "승격 후보 0개" in out


def test_links_point_to_the_exact_document_and_are_url_safe():
    r = _root()
    p = _save(r, "공백 있는 이름")
    out = build_knowledge_list(r, TODAY)
    assert "(vault/%EC%A7%80%EC%8B%9D/%EC%9E%91%EC%97%85/" in out and p.exists()


def test_unreadable_document_is_shown_not_hidden():  # S2c
    r = _root()
    _save(r, "정상")
    bad = r / "vault" / "지식" / "작업" / "깨진 문서.md"
    bad.write_text("형식이 아닌 글", encoding="utf-8")
    out = build_knowledge_list(r, TODAY)
    assert "읽지 못한 문서 1개" in out and "깨진 문서" in out and "총 1개" in out


def test_same_input_same_output_and_write_replaces_the_file():  # 멱등
    r = _root()
    _save(r, "하나")
    assert build_knowledge_list(r, TODAY) == build_knowledge_list(r, TODAY)
    p = write_knowledge_list(r, TODAY)
    first = p.read_text(encoding="utf-8")
    assert p == r / "지식목록.md"
    assert write_knowledge_list(r, TODAY).read_text(encoding="utf-8") == first


def test_task_documents_are_not_listed_as_knowledge():
    r = _root()
    d = r / "vault" / "작업"
    d.mkdir(parents=True)
    (d / "2000 일.md").write_text("# 일\n- 번호: 2000\n- 목적: 작업\n- 마감: 2026-10-20\n- 상태: 진행\n", encoding="utf-8")
    assert "총 0개" in build_knowledge_list(r, TODAY)


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain knowledge list: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
