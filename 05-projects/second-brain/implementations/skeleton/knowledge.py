"""
지식 사이클(P1) 줄기 — 배운 것(관찰 → 해석 → 행동)을 남기고, 찾고, 다시 꺼내 쓴 횟수를 세고, 점검에서 센다.
자리와 인용 횟수는 ADR-0008 (사용자 결정 2026-10-13): `vault/지식/<목적>/<이름>.md`, 머리말 `인용: N (마지막 날짜)`.
번호도 마감도 없다. 할 일 목록(`listing.py`)은 이 폴더를 세지 않는다.
요약·확인 질문·원문에 없는 정보 거르기·팀원 한 줄(S1a·S1c·S3)은 세션에서 Claude가 하는 일이라 여기에 없다.
"""
import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from intake import _name, _purpose, sensitive_hints

FOLDER = "지식"
COLUMNS = ("관찰", "해석", "행동")


@dataclass(frozen=True)
class Hit:
    purpose: str
    name: str
    path: Path
    cites: int


def _line(text, key):
    m = re.search(rf"^- {key}: (.*)$", text, re.M)
    return m[1].strip() if m else ""


def _column(text, label):
    m = re.search(rf"^## {label}\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    return m[1].strip() if m else ""


def _docs(vault):
    base = Path(vault) / FOLDER
    return sorted(base.glob("*/*.md")) if base.is_dir() else []


def _cites(text):
    m = re.search(r"^- 인용: (\d+) \(마지막 (.*)\)$", text, re.M)
    return (int(m[1]), m[2]) if m else (0, "-")


def save_knowledge(vault, purpose, name, *, observation, interpretation, action, source="", today, confirmed=False):
    purpose, name = _purpose(purpose), _name(name)
    columns = dict(zip(COLUMNS, (observation.strip(), interpretation.strip(), action.strip())))
    for label, value in columns.items():
        if not value:  # Q4(가): 세 칸이 모두 찬 것만 지식으로 센다 — 모르면 "미정"이라고 적게 한다
            raise ValueError(f"{label} 칸이 비어 있습니다 — 모르면 \"미정\"이라고 적으세요")
    hints = sensitive_hints("\n".join([*columns.values(), source]))
    if hints and not confirmed:
        raise ValueError(f"의심되는 값({', '.join(hints)})이 있습니다 — 그대로 진행할지 수정할지 고르세요")
    path = Path(vault) / FOLDER / purpose / f"{name}.md"
    if path.exists():
        raise ValueError("같은 지식이 이미 있습니다")
    path.parent.mkdir(parents=True, exist_ok=True)
    body = "\n".join(f"## {label}\n{value}\n" for label, value in columns.items())
    path.write_text(
        f"# {name}\n- 목적: {purpose}\n- 출처: {source.strip()}\n- 만든 날: {today}\n- 인용: 0 (마지막 -)\n\n{body}",
        encoding="utf-8",
    )
    return path


def find_knowledge(vault, query):
    terms = query.lower().split()
    hits = []
    for f in _docs(vault):
        text = f.read_text(encoding="utf-8")
        if terms and all(t in f.stem.lower() + "\n" + text.lower() for t in terms):
            hits.append(Hit(f.parent.name, f.stem, f, _cites(text)[0]))
    return hits


def cite(path, today):
    text = Path(path).read_text(encoding="utf-8")
    n, _ = _cites(text)
    if not re.search(r"^- 인용: \d+ \(마지막 .*\)$", text, re.M):
        raise ValueError("지식 문서 형식이 아닙니다")
    line = f"- 인용: {n + 1} (마지막 {today})"
    Path(path).write_text(re.sub(r"^- 인용: .*$", lambda _: line, text, flags=re.M), encoding="utf-8")
    return n + 1


def week_counts(vault, start, end):
    new = cited = 0
    for f in _docs(vault):
        text = f.read_text(encoding="utf-8")
        made = _line(text, "만든 날")
        if made and start <= date.fromisoformat(made) <= end and all(_column(text, c) for c in COLUMNS):
            new += 1
        last = _cites(text)[1]
        if last != "-" and start <= date.fromisoformat(last) <= end:
            cited += 1
    return {"new": new, "cited_docs": cited}


def check_sentence(count):  # 점검 보고의 한 줄 — 개수와 자리만, 이름·본문은 쓰지 않는다
    return f"이번 주 지식 {count}개가 `vault/{FOLDER}/`에 저장됨"


def action_issue_title(purpose, task_name, action, deadline):  # F10b — 행동을 기존 이슈 틀의 새 일로 잇는다
    if deadline is None:
        raise ValueError("마감이 없습니다 — 확인 필요로 두고 마감은 지어내지 않습니다")
    return f"{_purpose(purpose)} / {_name(task_name)} / {action.strip()} / {deadline.isoformat()}"


def _tag_line(text, key):
    m = re.search(rf"^- {key}: (.*)$", text, re.M)
    return [t.strip() for t in m[1].split(",") if t.strip()] if m else []


def _write_tags(path, key, tags):
    text = Path(path).read_text(encoding="utf-8")
    line = f"- {key}: {', '.join(tags)}"
    if re.search(rf"^- {key}: .*$", text, re.M):
        text = re.sub(rf"^- {key}: .*$", lambda _: line, text, flags=re.M)
    else:  # 머리말의 인용 줄 바로 뒤에 둔다
        text = re.sub(r"^(- 인용: .*)$", lambda m: m[1] + "\n" + line, text, count=1, flags=re.M)
    Path(path).write_text(text, encoding="utf-8")


def _clean(tags):
    out = []
    for t in tags:
        t = t.strip()
        if not t or "," in t or "\n" in t:
            raise ValueError("태그는 쉼표·줄바꿈이 없는 한 단어나 한 구절이어야 합니다")
        if t not in out:
            out.append(t)
    return out


def read_tags(path):
    text = Path(path).read_text(encoding="utf-8")
    return {"user": _tag_line(text, "사용자 태그"), "claude": _tag_line(text, "Claude 태그")}


def set_user_tags(path, tags):  # F13a: 사용자가 붙인 태그는 사용자 태그로 따로 저장한다
    _write_tags(path, "사용자 태그", _clean(tags))


def add_claude_tags(path, tags):  # F13b: 사용자 태그는 바꾸지도 지우지도 않는다. 같은 말은 Claude 태그로 또 붙이지 않는다
    current = read_tags(path)
    new = [t for t in _clean(tags) if t not in current["user"] and t not in current["claude"]]
    _write_tags(path, "Claude 태그", current["claude"] + new)
