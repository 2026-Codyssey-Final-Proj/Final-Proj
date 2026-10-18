"""
훅이 공용 도우미(.claude/hooks/lib.sh)의 이름을 쓰면 lib.sh를 불러오는지 본다 (고칠 목록 F-09, claude-drafted: 2026-10-18).
check-mermaid.sh가 json_field를 쓰면서 lib.sh를 불러오지 않아, 훅 모드에서 파일을 읽지 못하고 검사 없이 통과했다(2026-10-17~18).
그림을 실제로 그려 보는 시험은 Chrome · npx가 있어야 해서 여기서는 불러오는 줄만 본다 — 같은 종류의 실수를 모든 훅에서 막는다.
"""
import re
from pathlib import Path

HOOKS = Path(__file__).resolve().parents[2] / ".claude" / "hooks"
LIB = HOOKS / "lib.sh"
SOURCE = re.compile(r'^\s*\.\s+"\$\(dirname "\$0"\)/lib\.sh"', re.M)


def _lib_names():
    text = LIB.read_text(encoding="utf-8")
    funcs = re.findall(r"^([A-Za-z_][A-Za-z0-9_]*)\(\)\s*\{", text, re.M)
    names = re.findall(r"^([A-Z][A-Z0-9_]*)=", text, re.M)   # PY 같은 이름
    return set(funcs) | set(names)


def test_lib_defines_json_field():
    assert "json_field" in _lib_names(), "lib.sh에 json_field가 없다"


def test_every_hook_using_lib_names_sources_lib():
    names = _lib_names()
    missing = []
    for hook in sorted(HOOKS.glob("*.sh")):
        if hook == LIB:
            continue
        text = hook.read_text(encoding="utf-8")
        used = sorted(n for n in names if re.search(rf"(?<![A-Za-z0-9_$]){n}\b|\$\{{?{n}\b", text))
        if used and not SOURCE.search(text):
            missing.append(f"{hook.name}({', '.join(used)})")
    assert not missing, "lib.sh를 불러오지 않고 그 이름을 쓰는 훅: " + "; ".join(missing)


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  hooks source lib.sh: {len(tests)} tests")
