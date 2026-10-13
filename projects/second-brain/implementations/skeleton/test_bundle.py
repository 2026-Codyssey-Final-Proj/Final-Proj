"""
묶음 받기 줄기 테스트 — F15a(묶음 나누기, Q9), F15c(추정 표시), S9(가리기), F16b·F16c(맞는 근거·목적에 답하지 않음).
원본에서 옮긴 문서만 저장소에 들어가므로 키·도메인·IP는 옮기기 전에 가린다(경고만 하는 6-3과 다름, S9).
한계: 다른 사람의 이름·메시지는 코드로 찾지 못한다 — 그건 세션에서 사람이 거른다(기록·보안 기준 4절).
가짜 키는 조각을 이어 붙여 만든다.
"""
from bundle import batch_records, fit_report, mask_sensitive, split_batches, transcript_document

FAKE_KEY = "sk-" + "ant-" + "api03-" + "A1b2C3d4E5f6G7h8I9j0K1l2"


def _raises(fn, *args, **kw):
    try:
        fn(*args, **kw)
    except ValueError as e:
        return str(e)
    raise AssertionError("ValueError가 나야 한다")


# --- F15a 묶음 나누기 (Q9: 스크린샷 5장, 그 밖의 파일 10개) ---
def test_screenshots_are_split_into_batches_of_five():
    shots = [f"{i:02d}.png" for i in range(12)]
    batches = split_batches(shots)
    assert [len(b) for b in batches] == [5, 5, 2] and sum(batches, []) == shots


def test_other_files_are_split_into_batches_of_ten():
    files = [f"{i:02d}.pdf" for i in range(12)]
    assert [len(b) for b in split_batches(files)] == [10, 2]


def test_mixed_kinds_never_share_a_batch():
    mixed = ["a.png", "b.pdf", "c.png", "d.md"]
    batches = split_batches(mixed)
    assert all(len({f.rsplit(".", 1)[1] == "png" for f in b}) == 1 for b in batches)
    assert sorted(sum(batches, [])) == sorted(mixed)


def test_each_batch_gets_one_record_line():
    lines = batch_records(split_batches([f"{i}.png" for i in range(7)]), "2026-10-13")
    assert len(lines) == 2 and "1/2" in lines[0] and "5개" in lines[0] and "2026-10-13" in lines[0]


def test_empty_input_means_no_batches():
    assert split_batches([]) == [] and batch_records([], "2026-10-13") == []


# --- S9 가리기 ---
def test_keys_and_tokens_are_masked_and_reported_by_kind():
    text, found = mask_sensitive("키는 " + FAKE_KEY + " 입니다")
    assert FAKE_KEY not in text and "[키]" in text and found == {"키": 1}


def test_domains_ips_emails_urls_and_phones_are_masked():
    raw = "서버 192.168.0.12, 메일 a.b@example.com, 주소 https://my-site.example.io/x, 번호 010-1234-5678, 도메인 school.ac.kr"
    text, found = mask_sensitive(raw)
    for secret in ("192.168.0.12", "a.b@example.com", "my-site.example.io", "010-1234-5678", "school.ac.kr"):
        assert secret not in text
    assert set(found) == {"IP", "이메일", "주소", "전화번호", "도메인"}


def test_ordinary_text_is_left_alone_and_nothing_is_reported():
    text, found = mask_sensitive("버전 3.11과 10.5점, node.js, 2026-10-13 회의")
    assert text == "버전 3.11과 10.5점, node.js, 2026-10-13 회의" and found == {}


def test_masking_twice_changes_nothing():
    once, _ = mask_sensitive("메일 a@example.com")
    twice, found = mask_sensitive(once)
    assert once == twice and found == {}


# --- F15b·F15c 글자만 옮긴 문서 ---
def test_transcript_marks_estimated_lines_and_counts_them_in_the_header():
    doc = transcript_document("가이드 1", ["첫 줄", "흐릿한 줄", "셋째 줄"], estimated={1})
    assert "추정 1줄" in doc.splitlines()[2] or "추정 1줄" in doc
    assert "흐릿한 줄 [추정]" in doc and "첫 줄 [추정]" not in doc


def test_transcript_without_estimates_says_zero():
    assert "추정 0줄" in transcript_document("가이드 2", ["a", "b"], estimated=set())


def test_transcript_masks_before_writing_and_says_what_was_masked():
    doc = transcript_document("가이드 3", ["서버 192.168.0.12", "키 " + FAKE_KEY], estimated=set())
    assert "192.168.0.12" not in doc and FAKE_KEY not in doc
    assert "가린 것" in doc and "IP 1" in doc and "키 1" in doc


def test_transcript_does_not_summarize_or_add_lines():  # 글자만 옮긴다
    doc = transcript_document("가이드 4", ["하나", "둘"], estimated=set())
    body = [l for l in doc.splitlines() if l.startswith("> ")]
    assert body == ["> 하나", "> 둘"]


# --- F16b·F16c 맞는 근거 ---
def test_fit_report_shows_stage_and_evidence_for_each_item():  # Q10: 어느 단계에 쓸 자료인가
    r = fit_report([("패턴 후보 비교표", 3, "ADR-0003 비교표의 후보 형식"), ("체크리스트", 7, "F10 쌓인 지식을 다음에 씀")])
    assert "3단계" in r and "ADR-0003" in r and "7단계" in r and "목적에 답하지 않음" not in r


def test_fit_item_without_evidence_is_refused():  # F16b
    assert "근거" in _raises(fit_report, [("그냥 좋아 보임", 2, "  ")])


def test_stage_outside_one_to_seven_is_refused():
    assert "단계" in _raises(fit_report, [("x", 8, "근거")])


def test_nothing_fits_means_not_answering_the_purpose_and_asks():  # F16c
    r = fit_report([])
    assert "목적에 답하지 않음" in r and "저장할지" in r


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain bundle: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
