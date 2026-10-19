"""
버전 기록(CHANGELOG.md)의 번호가 겹치거나 건너뛰지 않는지 본다 (claude-drafted: 2026-10-18).
이재엽 결정 "N=큰 묶음, M=작은 고침" · "동의 없이 병합 + 버전 기록으로 알림" — 동의 없이 병합하므로
두 사람이 같은 번호를 고르는 일을 사람 기억이 아니라 시험으로 잡는다(code.md 6번).
"""
import re
from pathlib import Path

CHANGELOG = Path(__file__).resolve().parents[2] / "CHANGELOG.md"
ROW = re.compile(r"^\| v(\d+)\.(\d+) \| (\d{4}-\d{2}-\d{2}) \|", re.M)


def _rows():
    return [(int(n), int(m), d) for n, m, d in ROW.findall(CHANGELOG.read_text(encoding="utf-8"))]


def test_starts_at_v1_0():
    rows = _rows()
    assert rows, "CHANGELOG.md에 버전 줄이 없다"
    assert rows[-1][:2] == (1, 0), f"맨 아래(첫 버전)는 v1.0이어야 한다: v{rows[-1][0]}.{rows[-1][1]}"


def test_each_version_is_next_of_the_one_below():
    rows = _rows()
    bad = []
    for (n, m, _), (pn, pm, _) in zip(rows, rows[1:]):
        if (n, m) not in ((pn, pm + 1), (pn + 1, 0)):
            bad.append(f"v{pn}.{pm} 위에 v{n}.{m}")
    assert not bad, "다음 번호가 아니다(겹침 · 건너뜀 · 순서 바뀜 — 나중에 병합하는 쪽이 번호를 고친다): " + "; ".join(bad)


def test_dates_do_not_go_back_upward():
    rows = _rows()
    bad = [f"v{n}.{m}({d}) 아래에 더 늦은 날짜 {pd}" for (n, m, d), (_, _, pd) in zip(rows, rows[1:]) if d < pd]
    assert not bad, "새 줄은 맨 위에: " + "; ".join(bad)


# 2026-10-19부터 PR은 CHANGELOG를 고치지 않고 changes/<브랜치>.md 조각을 둔다 — 병합되면 .github/scripts/changelog-fold.js가 합친다.
# 조각이 네 줄(종류 · 누가 · 무엇 · 건드린 곳)을 갖췄는지, 표를 깨는 |가 없는지 여기서 먼저 잡는다(Action에서 터지면 main이 빨개진다).
CHANGES = CHANGELOG.parent / "changes"
KEYS = ("종류", "누가", "무엇", "건드린 곳")


def _fragments():
    if not CHANGES.is_dir():
        return []
    return sorted(p for p in CHANGES.glob("*.md") if p.name.lower() != "readme.md")


def _parse(text):
    got = {}
    for line in text.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            if k.strip() in KEYS and k.strip() not in got:
                got[k.strip()] = v.strip()
    return got


def test_fragments_have_four_lines():
    bad = []
    for p in _fragments():
        got = _parse(p.read_text(encoding="utf-8"))
        missing = [k for k in KEYS if not got.get(k)]
        if missing:
            bad.append(f"{p.name}: 빠진 줄 {', '.join(missing)}")
        elif got["종류"] not in ("큰 묶음", "작은 고침"):
            bad.append(f"{p.name}: 종류는 '큰 묶음' 또는 '작은 고침' — 지금 '{got['종류']}'")
        elif any("|" in got[k] for k in KEYS):
            bad.append(f"{p.name}: 값에 | 가 있다 — 표 칸이 깨진다")
    assert not bad, "조각 파일(changes/*.md)이 이상하다 — changes/README.md: " + "; ".join(bad)


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  changelog: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
