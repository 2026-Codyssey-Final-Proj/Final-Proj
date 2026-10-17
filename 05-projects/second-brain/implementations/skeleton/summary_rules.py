"""
요약 규칙 — S1a 원문에 없는 정보 쓰지 않기(부분 검사), S1c·Q6 확인 질문 최대 2개, Q7 요약 20줄 이내.
S1a의 한계: 여기서 확인하는 것은 날짜·숫자·주소가 원문에 있는지뿐이다. 사람 이름·사실 관계는 못 본다 —
그건 세션에서 사람(Claude)이 지키는 절차로 남는다. 값이 원문에 없으면 쓰지 않고 "확인 필요"로 돌려보낸다.
"""
import re

MAX_QUESTIONS = 2  # Q6
MAX_SUMMARY_LINES = 20  # Q7 (나)
_FIGURE = re.compile(r"https?://[^\s)>\]]+|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}|\d+(?:[.:]\d+)*")


def _figures(text):
    return [t.rstrip(".,;") if t.startswith("http") else t for t in _FIGURE.findall(text)]


def ungrounded(summary, source):
    have = set(_figures(source))  # 토큰 전체가 같을 때만 원문에 있다고 본다 — 1이 10·2026 안에 있다고 통과시키지 않는다
    flags = []
    for token in _figures(summary):
        if token not in have and token not in flags:
            flags.append(token)
    return flags


def limit_questions(questions):
    asked = [q for q in questions if q.strip()]
    return asked[:MAX_QUESTIONS], asked[MAX_QUESTIONS:]


def check_summary_length(text):
    lines = sum(1 for line in text.splitlines() if line.strip())
    return lines <= MAX_SUMMARY_LINES, max(0, lines - MAX_SUMMARY_LINES)
