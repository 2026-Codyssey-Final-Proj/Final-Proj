"""
UC11 — 일요일 점검 보고 초안 생성. 실행 기록(run-log.md)과 할 일 문서(vault/)로 지난주(월~일)를 세고,
사용자가 고른 질문 카드 답(Q-A 마감 지난 일, Q-B 늦게 알게 된 일의 원인)을 넣어 한 장으로 만든다.
쓰기 전에 사용자가 확인하고, 확정본은 덮어쓰지 않는다. 보고에는 이름과 개수만 있고 문서 본문은 없다(S4).
마감일이 점검일(일요일) 당일인 일은 20시 점검 때 이미 지난 것으로 센다.
질문 카드와 첫 시험: 세션 파일 UC11 상세 (사용자 결정 2026-10-13).
"""
import re
from datetime import date, timedelta
from pathlib import Path

from knowledge import check_sentence, week_counts
from listing import SOON_DAYS, _read

QA = ("제때 함", "제때 했는데 표시만 늦음", "늦게 함", "못 함")
QB = ("까먹음", "급하게 다른 일들이 있었음", "마감 올리는 걸 까먹음", "알람이 늦게 와서", "기타")
MISSED = ("늦게 함", "못 함")
GOAL = 1  # Q1: 주 1개 이하


def _log_lines(root):
    path = Path(root) / "run-log.md"
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines() if path.exists() else []:
        parts = [p.strip() for p in line.split("|", 3)]
        if len(parts) == 4 and parts[2] == "성공":
            rows.append((date.fromisoformat(parts[0][:10]), parts[1], parts[3]))
    return rows


def _done_date(log, name):
    pattern = re.compile(rf"^[^/]+/(?:\d+ )?{re.escape(name)}$")
    days = [d for d, kind, note in log if kind == "done" and pattern.match(note)]
    return max(days, default=None)


def _tasks(root):
    root, rows, bad = Path(root), [], []
    base = root / "vault"
    for f in sorted(base.rglob("*.md")) if base.is_dir() else []:
        if f.relative_to(base).parts[0] == "지식":
            continue
        try:
            rows.append(_read(root, f))
        except ValueError:
            bad.append(f.name)
    return rows, bad


def _names(items):
    return " · ".join(items)


def build_report(root, end, answers=None, late_known=(), alarm_note="", project_line=""):
    answers = answers or {}
    for choice in answers.values():
        if choice not in QA:
            raise ValueError(f"Q-A 선택이 아닙니다 — {' / '.join(QA)} 중 하나")
    for _, cause in late_known:
        if cause not in QB and not cause.startswith("기타"):
            raise ValueError(f"원인은 {' / '.join(QB)} 중 하나여야 합니다")
    start = end - timedelta(days=6)
    log = _log_lines(root)
    in_week = [(d, kind, note) for d, kind, note in log if start <= d <= end]
    new = [n for _, k, n in in_week if k == "new"]
    done = [n for _, k, n in in_week if k == "done"]
    tasks, bad = _tasks(root)

    qa_lines, need, missed = [], [], 0
    for _, purpose, name, deadline, status, archived, _ in tasks:
        if not start <= deadline <= end:
            continue
        finished = _done_date(log, name) if status == "완료" or archived else None
        if finished is None:
            result = "못 함"
        elif finished <= deadline:
            result = "제때 함"
        else:
            result = answers.get(name)
        if result is None:
            need.append(name)
            qa_lines.append(f"{name}: 확인 필요 (마감 {deadline}, 완료 표시 {finished})")
            continue
        qa_lines.append(f"{name}: {result}")
        missed += result in MISSED
    overdue = [f"{purpose}/{name}" for _, purpose, name, d, status, archived, _ in tasks
               if status != "완료" and not archived and d <= end]
    soon = [name for _, _, name, d, status, archived, _ in tasks
            if status != "완료" and not archived and end < d <= end + timedelta(days=SOON_DAYS)]

    learned = [f"{name or '이름 미기재'}({cause})" for name, cause in late_known]
    d5 = sum(cause == "알람이 늦게 와서" for _, cause in late_known)
    total = missed + len(late_known)
    k = week_counts(Path(root) / "vault", start, end)
    nxt = end + timedelta(days=7)

    def count(items):
        return f"{len(items)}개" + (f" — {_names(items)}" if items else "")

    rows = [
        ("새로 들어온 일", count(new)),
        ("완료", count(done)),
        ("마감 지남·미완료", count(overdue)),
        ("임박(3일 이내)", count(soon)),
        ("Q-A", "<br>".join(qa_lines) or "이번 주 마감이 지난 일 없음"),
        ("Q1 (가) 저장 기록상 놓친 일", f"{missed}개" + (f" (확인 필요 미포함 {len(need)}개)" if need else "")),
        ("Q1 (다) 늦게 알게 된 일", f"{len(late_known)}개" + (f" — {_names(learned)}" if learned else "")),
        ("D5 알람이 늦어서 놓친 일", f"{d5}개"),
        ("Q1 합계", f"{total}개 (목표 주 {GOAL}개 이하 — {'충족' if total <= GOAL else '초과'})"),
        ("지식", f"{check_sentence(k['new'])} · 이번 주 인용된 문서 {k['cited_docs']}개"),
        ("알람", alarm_note or "—"),
        ("프로젝트", project_line or "—"),
        ("다음 점검", f"{nxt}(일) 20:00"),
    ]
    out = [f"# 주 점검 {end}", "", f"기간: {start} ~ {end}", ""]
    if bad:
        out += [f"**읽지 못한 문서 {len(bad)}개** — {', '.join(bad)}", ""]
    out += ["| 항목 | 내용 |", "|---|---|", *(f"| {k_} | {v} |" for k_, v in rows), ""]
    return "\n".join(out)


def write_report(root, end, **kw):
    path = Path(root) / "점검" / f"{end}.md"
    if path.exists():
        raise ValueError("이 주의 점검 보고가 이미 있습니다 — 확정본은 덮어쓰지 않습니다")
    text = build_report(root, end, **kw)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path
