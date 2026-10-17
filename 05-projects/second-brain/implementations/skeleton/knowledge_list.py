"""
지식 목록(`지식목록.md`) — 쌓인 지식(vault/지식/<목적>/<이름>.md)을 목적별로 한 장에 나열한다.
할 일 목록(`listing.py`)과 같은 성격이다: 결과물이지 원천이 아니고, 고치지 않고 다시 만든다.
관찰·해석 본문은 담지 않고 행동 한 줄만 보인다(S4). 인용이 2번 이상이면 승격 후보(Q4 다)로 표시한다.
"""
import re
from datetime import date
from pathlib import Path
from urllib.parse import quote

from intake import PURPOSES
from knowledge import _column, _cites, _docs, _line

PROMOTE_AT = 2
ACTION_WIDTH = 60


def _cell(text):
    return text.replace("|", "\\|").replace("\n", " ").strip()


def _short(action):
    first = next((l.strip() for l in action.splitlines() if l.strip()), "")
    return first if len(first) <= ACTION_WIDTH else first[:ACTION_WIDTH] + "…"


def _read(root, f):
    text = f.read_text(encoding="utf-8")
    made, action = _line(text, "만든 날"), _column(text, "행동")
    if not (made and action and re.search(r"^- 인용: \d+ \(마지막 .*\)$", text, re.M)):
        raise ValueError(f.name)
    return {
        "name": f.stem, "purpose": f.parent.name, "action": _short(action), "source": _line(text, "출처") or "—",
        "made": date.fromisoformat(made), "cites": _cites(text)[0], "path": f.relative_to(root),
    }


def build_knowledge_list(root, today):
    root = Path(root)
    rows, bad = [], []
    for f in _docs(root / "vault"):
        try:
            rows.append(_read(root, f))
        except ValueError:
            bad.append(f.stem)

    def link(r):
        return f"[열기]({quote(r['path'].as_posix())})"

    cands = sorted((r for r in rows if r["cites"] >= PROMOTE_AT), key=lambda r: (-r["cites"], r["name"]))
    out = ["# 지식 목록", "", f"만든 날짜: {today}", "",
           f"총 {len(rows)}개 · 승격 후보 {len(cands)}개 (인용 {PROMOTE_AT}번 이상)", ""]
    if bad:
        out += [f"**읽지 못한 문서 {len(bad)}개** — " + ", ".join(bad), ""]
    if not rows and not bad:
        out += ["아직 없음", ""]
    out += [f"## 승격 후보 (인용 {PROMOTE_AT}번 이상)", "", "| 이름 | 목적 | 인용 | 행동 | 문서 |", "|---|---|---|---|---|"]
    out += [f"| {_cell(r['name'])} | {r['purpose']} | {r['cites']} | {_cell(r['action'])} | {link(r)} |" for r in cands]
    out += ["", "## 목적별", ""]
    known = [p for p in PURPOSES if any(r["purpose"] == p for r in rows)]
    other = sorted({r["purpose"] for r in rows} - set(PURPOSES))
    for purpose in known + other:
        out += [f"### {purpose}", "", "| 이름 | 행동 | 출처 | 만든 날 | 인용 | 문서 |", "|---|---|---|---|---|---|"]
        for r in sorted((r for r in rows if r["purpose"] == purpose), key=lambda r: (-r["made"].toordinal(), r["name"])):
            out.append(f"| {_cell(r['name'])} | {_cell(r['action'])} | {_cell(r['source'])} | {r['made']} | {r['cites']} | {link(r)} |")
        out.append("")
    return "\n".join(out)


def write_knowledge_list(root, today):
    path = Path(root) / "지식목록.md"
    path.write_text(build_knowledge_list(root, today), encoding="utf-8")
    return path
