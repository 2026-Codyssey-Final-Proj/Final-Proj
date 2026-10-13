"""
UC13 — data 브랜치의 할 일 문서(vault/)를 목록 한 장(목록.md)으로 모은다.
목록은 결과물이지 원천이 아니다: 고치지 않고 다시 만든다. 이름·번호·마감·상태만 담고 본문은 담지 않는다.
"""
from datetime import date
from pathlib import Path
from urllib.parse import quote

from intake import _FILE, _field

SECTIONS = ("지남", "임박", "진행", "완료")
SOON_DAYS = 3  # 임박 = 마감까지 3일 이내 (Q2, F8a)


def _read(root, path):
    m = _FILE.match(path.name)
    text = path.read_text(encoding="utf-8")
    d, status = _field(text, "마감"), _field(text, "상태")
    if not (m and d and status):
        raise ValueError(path.name)
    return int(m[1]), _field(text, "목적") or path.parent.name, m[2], date.fromisoformat(d), status, path.parent.name == "보관", path.relative_to(root)


def _section(row, today):
    _, _, _, deadline, status, archived, _ = row
    if status == "완료" or archived:
        return "완료"
    return "지남" if deadline < today else "임박" if (deadline - today).days <= SOON_DAYS else "진행"


def build_list(root, today):
    root = Path(root)
    rows, bad = [], []
    for f in sorted((root / "vault").rglob("*.md")) if (root / "vault").is_dir() else []:
        if f.relative_to(root / "vault").parts[0] == "지식":  # ADR-0008: 지식 문서는 할 일이 아니다
            continue
        try:
            rows.append(_read(root, f))
        except ValueError:
            bad.append(f.name)
    groups = {s: sorted(r for r in rows if _section(r, today) == s) for s in SECTIONS}
    out = ["# 할 일 목록", "", f"만든 날짜: {today}", "", " · ".join(f"{s} {len(groups[s])}개" for s in SECTIONS), ""]
    if bad:
        out += [f"**읽지 못한 문서 {len(bad)}개** — " + ", ".join(bad), ""]
    if not rows and not bad:
        out += ["아직 없음", ""]
    for s in SECTIONS:
        out += [f"## {s}", "", "| 번호 | 목적 | 이름 | 마감 | 문서 |", "|---|---|---|---|---|"]
        for number, purpose, name, deadline, _, archived, rel in groups[s]:
            out.append(f"| {number} | {purpose} | {name.replace('|', chr(92) + '|')} | {deadline} | [열기]({quote(rel.as_posix())}){' 보관' if archived else ''} |")
        out.append("")
    return "\n".join(out)


def write_list(root, today):
    path = Path(root) / "목록.md"
    path.write_text(build_list(root, today), encoding="utf-8")
    return path
