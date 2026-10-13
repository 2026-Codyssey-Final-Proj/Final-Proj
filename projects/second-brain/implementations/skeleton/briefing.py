"""
F7a·F8a — 대화를 시작할 때의 브리핑. 마감이 지난 일과 3일 이내 할 일(남은 날, 빠짐없이), 진행 중인 프로젝트와 단계,
그 밖에 가장 가까운 다음 할 일을 한 장으로 말한다. 이름·날짜·개수만 담고 문서 본문은 담지 않는다(S4).
남은 날(D-N)은 대화를 시작한 날 기준이라 알림 제목과 달리 써도 틀리지 않는다(ADR-0005).
프로젝트 단계는 세션 파일의 게이트 로그에서만 읽는다 — 상태의 원천이 그곳뿐이기 때문이다.
"""
import re
import sys
from datetime import date, timedelta
from pathlib import Path

from listing import SOON_DAYS
from planning import load_tasks

NEXT_COUNT = 3
WEEKDAY = "월화수목금토일"
_GATE = re.compile(r"^\| (\d) → (\d) \| \*\*(Go|Recycle|Hold|Kill)\*\*(?: \(([^)]*)\))?", re.M)


def current_stage(text):
    rows = _GATE.findall(text)
    if not rows:
        return None, ""
    a, b, decision, detail = rows[-1]  # 결정이 적힌 마지막 게이트
    day = re.search(r"\d{4}-\d{2}-\d{2}", detail)
    note = f"{a}→{b} {decision}" + (f" {day[0]}" if day else "")
    return int(b) if decision == "Go" else int(a), note


def _left(deadline, today):
    n = (deadline - today).days
    return f"{-n}일 지남" if n < 0 else "오늘 마감" if n == 0 else "내일" if n == 1 else f"D-{n}"


def _project_line(name, path):
    path = Path(path)
    stage, note = current_stage(path.read_text(encoding="utf-8")) if path.is_file() else (None, "")
    if stage is None:
        return f"- {name} — 단계 정보 없음"
    return f"- {name} — 중단 ({note})" if "Kill" in note else f"- {name} — {stage}단계 진행 중 ({note})"


def build_briefing(root, today, projects=()):
    tasks = sorted(load_tasks(root), key=lambda t: (t.deadline, t.purpose, t.name))
    soon_end = today + timedelta(days=SOON_DAYS)
    soon = [t for t in tasks if t.deadline <= soon_end]
    later = [t for t in tasks if t.deadline > soon_end][:NEXT_COUNT]

    def line(t):
        return f"- [{t.purpose}] {t.name} — {_left(t.deadline, today)} ({t.deadline.month}/{t.deadline.day})"

    out = [f"# 브리핑 {today}({WEEKDAY[today.weekday()]})", "", "## 마감"]
    if not tasks:
        out.append("- 열린 할 일이 없습니다")
    else:
        out += [line(t) for t in soon] or ["- 3일 이내 마감 없음"]
    out += ["", "## 진행 중인 프로젝트"]
    out += [_project_line(n, p) for n, p in projects] or ["- 등록된 프로젝트 없음"]
    out += ["", "## 다음 할 일"]
    out += [line(t) for t in later] or ["- 3일 뒤 이후 할 일 없음"]
    return "\n".join(out) + "\n"


def default_session(base):
    """상태의 원천: 팀 레포는 PROGRESS.md, 개인 워크스페이스는 세션 파일."""
    for rel in ("PROGRESS.md", "docs/01-problem-save/sessions/project-track/2026-09-30-second-brain.md"):
        if (Path(base) / rel).is_file():
            return Path(base) / rel
    return Path(base) / "PROGRESS.md"


def main(argv):
    """python3 briefing.py [데이터 폴더] [--today YYYY-MM-DD] — 세션 시작에 부를 수 있게 실패해도 0으로 끝난다."""
    here = Path(__file__).resolve()
    args = [a for a in argv[1:] if not a.startswith("--")]
    today = date.fromisoformat(argv[argv.index("--today") + 1]) if "--today" in argv else date.today()
    data = Path(args[0]) if args else here.parents[2] / "data"
    session = default_session(here.parents[2])
    if not data.is_dir():  # 데이터 작업 폴더(data 브랜치)가 없다 — 일이 없다는 뜻이 아니다
        print("데이터 폴더(data 브랜치 작업 폴더)를 찾지 못했습니다 — 브리핑을 건너뜁니다")
        return 0
    try:
        print(build_briefing(data, today, projects=[("second-brain", session)]), end="")
    except Exception as e:  # 브리핑이 세션 시작을 막으면 안 된다
        print(f"브리핑을 만들지 못했습니다 ({type(e).__name__})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
