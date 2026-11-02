#!/usr/bin/env python3
"""
04-tests/와 05-projects/*/implementations/ 아래 모든 test_*.py를 한 번에
찾아서 돌리고, 04-tests/ 아래 *.test.js는 node --test로 한 번에 돌린다.
각 폴더가 독립된 모듈 네임스페이스를 쓰므로, 매번 sys.path를 그 폴더로 바꿔서
격리 실행한다. 파일 이름은 트랙마다 다를 수 있다(알고리즘 트랙은
test_solution.py, 프로젝트 트랙은 도구 이름을 따름 — 예: test_catalog_search.py).
"""
import importlib
import json
import os
import re
import subprocess
import sys

# Windows에서 하위 프로세스(훅·파이썬)가 한글을 cp949로 내보내지 않게 — 시험들은 UTF-8로 읽는다
sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # 결과의 한글·기호가 Windows 터미널에서 멈추지 않게
if not os.environ.get("PYTHONIOENCODING"):
    os.environ["PYTHONIOENCODING"] = "utf-8"
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # 워크스페이스 루트
SEARCH_DIRS = [ROOT / "04-tests", *sorted(ROOT.glob("05-projects/*/implementations"))]


# 알려진 실패(claude-drafted: 2026-10-30) — main에 이미 있고 고칠 목록 번호 · 담당 · 기한이 붙은 실패는 보이되 막지 않는다.
# 그 밖의 실패(새로 깨진 것 · 파일째 깨진 것 · 이름을 못 읽은 것) · 기한이 지난 것은 그대로 막는다. 고쳐진 것은 목록에서 빼라고 알린다.
KNOWN_FILE = ROOT / "04-tests" / "known-failures.json"
FAIL_LINE = re.compile(r"^✖ (.+) \([\d.]+ms\)$")
FAIL_COUNT = re.compile(r"^ℹ fail (\d+)$", re.M)
SKIP_LINE = re.compile(r"^\s*﹣ (.+) \([\d.]+ms\)(?: # .*)?$")  # 건너뛴 시험(spec 보고) — 하위 시험은 들여 쓴다


def failing_names(out: str) -> set:
    return {m.group(1) for line in out.splitlines() if (m := FAIL_LINE.match(line))}


def skipped_names(out: str) -> set:
    return {m.group(1) for line in out.splitlines() if (m := SKIP_LINE.match(line))}


def excuse(names: set, groups: list, today: date):
    """(막을 것, 봐준 것, 목록에 있는데 통과한 것)"""
    live = {t for g in groups if date.fromisoformat(g["until"]) >= today for t in g["tests"]}
    listed = {t for g in groups for t in g["tests"]}
    return names - live, names & live, listed - names


def known_groups() -> list:
    return json.loads(KNOWN_FILE.read_text(encoding="utf-8"))["groups"] if KNOWN_FILE.exists() else []


def node_ok(code: int, out: str, groups: list, today: date):
    names = failing_names(out)
    if code != 0 and not names:
        return False, ["FAIL 실패한 시험 이름을 읽지 못했다 — 막는다"]
    bad, ok, fixed = excuse(names, groups, today)
    count = FAIL_COUNT.search(out)
    if code != 0 and not bad and (not count or int(count.group(1)) != len(ok)):
        # 중간에 끊긴 실행이거나(요약 줄 없음) 같은 이름의 다른 시험이 함께 깨졌다(수가 다름) — 봐주지 않는다
        return False, [f"FAIL 실패 수({count.group(1) if count else '요약 없음'})가 알려진 실패 {len(ok)}개와 다르다 — 막는다"]
    notes = []
    if ok:
        fixes = sorted({g["fix"] for g in groups if set(g["tests"]) & ok})
        notes.append(f"알려진 실패 {len(ok)}개는 막지 않음({', '.join(fixes)} — 04-tests/known-failures.json)")
    expired = {t for g in groups if date.fromisoformat(g["until"]) < today for t in g["tests"]} & bad
    if expired:
        notes.append(f"FAIL 기한이 지난 알려진 실패 {len(expired)}개 — 고치거나 기한을 다시 정한다")
    # 건너뛴 것은 고쳐졌는지 모른다 — puppeteer가 없는 컴퓨터에서 화면 시험은 실패 이름에 없어 '통과'로 보였다(F-132)
    skipped = fixed & skipped_names(out)
    if fixed - skipped:
        notes.append(f"목록에 있는데 통과한 시험 {len(fixed - skipped)}개 — known-failures.json에서 뺀다: " + " / ".join(sorted(fixed - skipped)))
    if skipped:
        notes.append(f"목록에 있는데 건너뛴 시험 {len(skipped)}개 — 이 컴퓨터에서는 고쳐졌는지 모른다(빼지 않는다): " + " / ".join(sorted(skipped)))
    return code == 0 or not bad, notes


def find_test_files():
    return sorted(f for d in SEARCH_DIRS for f in d.rglob("test_*.py"))


def run_one(test_file: Path) -> bool:
    test_dir = test_file.parent
    mod_name = test_file.stem
    sys.path.insert(0, str(test_dir))
    try:
        for name in list(sys.modules):
            if name == mod_name or (test_dir / f"{name}.py").exists():
                sys.modules.pop(name, None)
        test_mod = importlib.import_module(mod_name)
        test_mod.run_all()
        return True
    except Exception as e:  # noqa: BLE001 - 요약 리포트용으로 전부 잡아서 계속 진행
        print(f"FAIL {test_file.relative_to(ROOT)}: {e}")
        return False
    finally:
        sys.path.remove(str(test_dir))


if __name__ == "__main__":
    test_files = find_test_files()
    results = {}
    for f in test_files:
        rel = f.relative_to(ROOT)
        print(f"=== {rel} ===")
        results[str(rel)] = run_one(f)
        print()

    excused = 0
    js = sorted(str(f.relative_to(ROOT)) for f in (ROOT / "04-tests").rglob("*.test.js"))
    if js:
        name = f"node --test ({len(js)}개 파일)"
        print(f"=== {name} ===")
        try:
            r = subprocess.run(["node", "--test", "--test-reporter=spec", *js], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
            keep = ("ℹ tests", "ℹ pass", "ℹ fail", "not ok", "✖")
            for line in r.stdout.splitlines():
                if line.lstrip().startswith(keep):
                    print(line)
            ok, notes = node_ok(r.returncode, r.stdout, known_groups(), date.today())
            for n in notes:
                print(n)
            results[name] = ok
            if ok and r.returncode != 0:
                excused = len(failing_names(r.stdout))
        except FileNotFoundError:
            print("FAIL node 명령을 찾지 못함 — Node 20.6 이상을 설치한다")
            results[name] = False
        print()

    passed = sum(results.values())
    total = len(results)
    print(f"요약: {passed}/{total}개 테스트 파일 전체 통과" + (f" (알려진 실패 {excused}개 제외 — 04-tests/known-failures.json)" if excused else ""))
    if passed != total:
        sys.exit(1)
