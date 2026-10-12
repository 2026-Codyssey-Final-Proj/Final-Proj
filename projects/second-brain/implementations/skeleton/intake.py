"""
세컨드 브레인 Walking Skeleton — 폰 이슈 한 줄을 문서·알람 일정·실행 기록으로 바꾼다.
이슈 읽기와 캘린더 일정 만들기는 세션이 한다(ADR-0003) — 여기는 그 사이의 계산과 저장만 있다.
이슈 제목 틀 (사용자 결정 2026-10-08, ADR-0005):
  새 일   목적 / 이름 / 내용 / 마감        예: 학교 / 자료구조 과제 제출 / 트리 구현 3문제 / 10-30
  완료    완료 / 목적 / 이름     또는  완료 / 번호
  수정    수정 / 목적 / 이름 / 새 마감     또는  수정 / 번호 / 새 마감
번호 (사용자 결정 2026-10-08, D10·ADR-0006): 목적마다 범위가 있고, 다시 쓰지 않으며, 알림 제목에는 넣지 않는다.
창고: <vault>/<목적>/<번호> <이름>.md (완료해서 옮긴 것은 <목적>/보관/ 아래, 번호는 그대로)
"""
import re
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from pathlib import Path

RANGES = {"생활": (0, 999), "학교": (1000, 1999), "작업": (2000, 2999), "대회": (3000, 3999), "기타": (4000, 4999)}
PURPOSES = tuple(RANGES)
REMINDER_DAYS = (3, 1, 0)  # Q2: 3일 전·1일 전·당일, 모두 오전 8시
ALARM_TIME = time(8, 0)
TONIGHT = time(20, 0)  # D11: 지난 알림이 있으면 대신 오늘 저녁 8시에 한 번
SENSITIVE = [  # 기록·보안 기준 6-3: 값이 아니라 종류만 알린다
    ("API 키", re.compile(r"sk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}")),
    ("비밀번호", re.compile(r"(?:비밀번호|password|passwd|pwd)\s*[:=]\s*\S+", re.I)),
    ("주민번호", re.compile(r"\d{6}-[1-4]\d{6}")),
]


@dataclass(frozen=True)
class Item:
    kind: str  # new / done / edit
    purpose: str
    name: str
    content: str
    deadline: date | None
    number: int | None = None  # 번호로 부른 완료·수정은 목적·이름이 비어 있다


@dataclass
class Result:
    ok: bool
    message: str = ""
    event: dict | None = None
    hints: list = field(default_factory=list)
    path: Path | None = None
    number: int | None = None


def _name(text):
    # 위반 시도 막기: 이름이 저장소 밖 경로나 숨김 파일이 되지 못하게 한다
    text = text.strip()
    if not text or "/" in text or "\\" in text or text.startswith(".") or len(text) > 80 or not text.isprintable():
        raise ValueError("이름을 읽을 수 없습니다")  # 입력 값은 다시 보이지 않는다
    return text


def _deadline(text, today):
    try:
        d = date.fromisoformat(text) if text.count("-") == 2 else date(today.year, *map(int, text.split("-")))
    except ValueError:
        raise ValueError("마감 날짜를 읽을 수 없습니다") from None
    if d < today:
        raise ValueError("마감이 이미 지났습니다")
    return d


def _purpose(text):
    if text not in PURPOSES:
        raise ValueError(f"목적은 {'·'.join(PURPOSES)} 중 하나여야 합니다")
    return text


def _number(text):
    n = int(text)
    if not any(lo <= n <= hi for lo, hi in RANGES.values()):
        raise ValueError("번호가 어느 목적의 범위에도 없습니다")
    return n


def parse_issue_title(title, today):
    parts = [p.strip() for p in title.split("/")]
    kind = {"완료": "done", "수정": "edit"}.get(parts[0], "new")
    if kind == "new":  # 내용에는 /가 들어갈 수 있어 앞 두 칸과 마지막 칸으로 나눈다
        if len(parts) < 4:
            raise ValueError("이슈 제목 틀이 맞지 않습니다 — 마감은 지어내지 않습니다")
        return Item(kind, _purpose(parts[0]), _name(parts[1]), "/".join(parts[2:-1]).strip(), _deadline(parts[-1], today))
    by_number = len(parts) > 1 and parts[1].isdigit()
    if len(parts) != {"done": (3, 2), "edit": (4, 3)}[kind][by_number]:
        raise ValueError("이슈 제목 틀이 맞지 않습니다 — 마감은 지어내지 않습니다")
    deadline = _deadline(parts[-1], today) if kind == "edit" else None
    if by_number:
        return Item(kind, "", "", "", deadline, _number(parts[1]))
    return Item(kind, _purpose(parts[1]), _name(parts[2]), "", deadline)


def alarm_line(item):
    d = item.deadline
    return f"{item.purpose} / {item.name} / {d.month}/{d.day}까지"  # D-N은 만든 날 기준이라 틀어져서 쓰지 않는다


def calendar_event(item, now):
    start = datetime.combine(item.deadline, ALARM_TIME)
    due = [start - timedelta(days=n) for n in REMINDER_DAYS]
    reminders = [r for r in due if r > now]
    tonight = datetime.combine(now.date(), TONIGHT)
    if len(reminders) < len(due) and now < tonight < start:
        reminders.insert(0, tonight)
    return {"title": alarm_line(item), "start": start, "reminders": reminders}


def sensitive_hints(text):
    return [name for name, rx in SENSITIVE if rx.search(text)]


_FILE = re.compile(r"^(\d+) (.+)\.md$")


def _docs(vault, purpose):  # 문서와 보관으로 옮긴 문서 — 번호는 둘 다 쓰인 것으로 센다
    base = Path(vault) / purpose
    return [*base.glob("*.md"), *(base / "보관").glob("*.md")]


def next_number(vault, purpose):
    lo, hi = RANGES[purpose]
    used = [n for f in _docs(vault, purpose) if (m := _FILE.match(f.name)) and lo <= (n := int(m[1])) <= hi]
    n = max(used, default=lo - 1) + 1
    if n > hi:
        raise ValueError("이 목적의 번호가 다 찼습니다 — 범위를 넓혀야 합니다")
    return n


def _find(vault, item):
    purpose = item.purpose or next(p for p, (lo, hi) in RANGES.items() if lo <= item.number <= hi)
    for f in _docs(vault, purpose):
        m = _FILE.match(f.name)
        if m and (int(m[1]) == item.number if item.number is not None else m[2] == item.name):
            return f, purpose, int(m[1]), m[2]
    return None


def _field(text, key):
    m = re.search(rf"^- {key}: (\S+)", text, re.M)
    return m[1] if m else None


def save_event_id(path, event_id):  # 세션이 캘린더 일정을 만든 뒤 번호를 문서에 적는다
    text = Path(path).read_text(encoding="utf-8")
    line = f"- 일정: {event_id}"
    text = re.sub(r"^- 일정: .*$", lambda _: line, text, flags=re.M) if _field(text, "일정") else re.sub(r"^(- 상태: .*)$", lambda m: m[1] + "\n" + line, text, count=1, flags=re.M)
    Path(path).write_text(text, encoding="utf-8")


def _log(log_path, now, kind, ok, note):
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"{now:%Y-%m-%d %H:%M} | {kind} | {'성공' if ok else '실패'} | {note}\n")


def process_issue(title, vault, today, now, log_path, confirmed=False):
    hints = sensitive_hints(title)
    kind = "?"
    try:
        item = parse_issue_title(title, today)
        kind = item.kind
        if hints and not confirmed:
            raise ValueError(f"의심되는 값({', '.join(hints)})이 있습니다 — 그대로 진행할지 수정할지 고르세요")
        if item.kind == "new":
            if any((m := _FILE.match(f.name)) and m[2] == item.name for f in _docs(vault, item.purpose)):
                raise ValueError("같은 할 일이 이미 있습니다 — 수정 이슈를 쓰세요")
            number = next_number(vault, item.purpose)
            path = Path(vault) / item.purpose / f"{number} {item.name}.md"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"# {item.name}\n- 번호: {number}\n- 목적: {item.purpose}\n- 마감: {item.deadline}\n- 상태: 진행\n\n{item.content}\n", encoding="utf-8")
            event, purpose, name = calendar_event(item, now), item.purpose, item.name
        else:
            found = _find(vault, item)
            if not found:
                raise ValueError("같은 할 일을 찾지 못했습니다 — 사용자에게 묻습니다")
            path, purpose, number, name = found
            text = path.read_text(encoding="utf-8")
            key, value = ("상태", "완료") if item.kind == "done" else ("마감", str(item.deadline))
            path.write_text(re.sub(rf"^- {key}: .*$", f"- {key}: {value}", text, flags=re.M), encoding="utf-8")
            doc = Item(item.kind, purpose, name, "", item.deadline or date.fromisoformat(_field(text, "마감")))
            event = {"event_id": _field(text, "일정")}
            if item.kind == "done":  # D9: 지우지 않고 [완료]를 붙이고 알림을 끈다
                event |= {"title": f"[완료] {alarm_line(doc)}", "reminders": []}
            else:
                event |= calendar_event(doc, now)
        _log(log_path, now, kind, True, "(경고 있음)" if hints else f"{purpose}/{number} {name}")
        return Result(True, event=event, hints=hints, path=path, number=number)
    except ValueError as e:
        _log(log_path, now, kind, False, str(e))
        return Result(False, str(e), hints=hints)
