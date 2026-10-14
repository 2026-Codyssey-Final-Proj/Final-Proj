"""
Navigator 시연 화면(index.html) — 서버 없이 도는 단일 파일이어야 한다(FR-10).
시험은 위반 시도를 먼저 본다: 바깥 주소·네트워크 호출·외부 스크립트가 들어오면 실패.
"""
import re
from pathlib import Path

HTML = (Path(__file__).parent / "index.html").read_text(encoding="utf-8")


def test_no_network_calls():  # 위반 시도: 서버·API를 부르는 코드
    for word in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon", "EventSource"):
        assert word not in HTML, word


def test_no_external_resources():  # 위반 시도: 바깥 스크립트·스타일·이미지
    assert not re.search(r'(src|href)\s*=\s*["\']https?://', HTML)
    assert "@import" not in HTML and "url(http" not in HTML


def test_user_input_is_never_written_as_html():  # 위반 시도: 입력값이 HTML로 해석됨
    assert "innerHTML" not in HTML and "document.write" not in HTML


def test_single_file_has_title_and_viewport():
    assert "<title>Navigator 시연 화면</title>" in HTML and 'name="viewport"' in HTML


def test_required_inputs_are_checked_with_messages():
    assert "일 이름을 적어 주세요" in HTML and "배운 것을 적거나" in HTML


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  navigator-demo: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
