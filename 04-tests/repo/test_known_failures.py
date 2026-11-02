"""
알려진 실패 목록(04-tests/known-failures.json) — claude-drafted: 2026-10-30.
main에 이미 있는 화면 e2e 실패(고칠 목록 번호 · 담당 · 기한이 붙은 것) 때문에 커밋 전 시험이 모든 브랜치에서 막히던 것을 푼다.
지키는 것: 목록에 있고 기한 안인 실패만 봐준다 · 새 실패 · 파일째 깨짐 · 이름을 못 읽은 실패는 그대로 막는다 · 기한이 지나면 다시 막는다 ·
고쳐진 것(목록에 있는데 통과)은 빼라고 알린다 · 목록의 칸(번호 · 기한 · 이름)이 비지 않았다.
"""
import importlib.util
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location("run_all_tests_mod", ROOT / "04-tests" / "run_all_tests.py")
R = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R)

OUT = """✔ 다른 시험 (12.1ms)
✖ C-35 · 퀘스트 창 (1451.2ms)
  AssertionError [ERR_ASSERTION]: x
✖ 04-tests/e2e/broken.test.js (3.1ms)
ℹ tests 3
ℹ fail 2
✖ failing tests:

test at 04-tests/e2e/modes-flow.test.js:497:1
✖ C-35 · 퀘스트 창 (1451.2ms)
"""
KNOWN = [{"fix": "F-102", "until": "2026-11-03", "tests": ["C-35 · 퀘스트 창", "C-53 · 세 칸"]}]


def test_failing_names_reads_node_output_once_each():
    assert R.failing_names(OUT) == {"C-35 · 퀘스트 창", "04-tests/e2e/broken.test.js"}


def test_only_listed_and_unexpired_failures_are_excused():
    bad, ok, fixed = R.excuse({"C-35 · 퀘스트 창"}, KNOWN, date(2026, 11, 3))
    assert (bad, ok, fixed) == (set(), {"C-35 · 퀘스트 창"}, {"C-53 · 세 칸"})
    bad, _, _ = R.excuse({"C-35 · 퀘스트 창", "새로 깨진 시험"}, KNOWN, date(2026, 10, 30))
    assert bad == {"새로 깨진 시험"}, "목록에 없는 실패는 막는다"
    bad, ok, _ = R.excuse({"C-35 · 퀘스트 창"}, KNOWN, date(2026, 11, 4))
    assert bad == {"C-35 · 퀘스트 창"} and not ok, "기한이 지나면 다시 막는다"


def test_node_run_passes_only_when_every_failure_is_excused():
    known_out = OUT.replace("✖ 04-tests/e2e/broken.test.js (3.1ms)\n", "").replace("ℹ fail 2", "ℹ fail 1")
    assert R.node_ok(1, known_out, KNOWN, date(2026, 10, 30))[0] is True
    assert R.node_ok(1, known_out.replace("ℹ fail 1", "ℹ fail 2"), KNOWN, date(2026, 10, 30))[0] is False, "같은 이름의 다른 시험이 함께 깨지면(수가 다름) 막는다"
    assert R.node_ok(1, known_out.replace("ℹ fail 1\n", ""), KNOWN, date(2026, 10, 30))[0] is False, "요약 줄 없이 끊긴 실행은 막는다"
    assert R.node_ok(1, OUT, KNOWN, date(2026, 10, 30))[0] is False, "파일째 깨진 것은 막는다"
    assert R.node_ok(1, "ℹ fail 1\n", KNOWN, date(2026, 10, 30))[0] is False, "실패 이름을 못 읽었으면 막는다"
    assert R.node_ok(0, "ℹ fail 0\n", KNOWN, date(2026, 10, 30))[0] is True


# claude-drafted: 2026-11-02 — F-132: puppeteer가 없는 컴퓨터에서는 화면 시험이 건너뛰어지는데(﹣), 실패 이름에 없으니 '통과했다 — 목록에서 뺀다'고 알렸다
def test_skipped_listed_tests_are_not_called_fixed():
    out = ("﹣ C-35 · 퀘스트 창 (0.4ms) # 건너뜀 — puppeteer를 찾지 못했어요\n"
           "  ﹣ C-53 · 세 칸 (0.1ms) # SKIP\n"
           "ℹ tests 2\nℹ fail 0\n")
    assert R.skipped_names(out) == {"C-35 · 퀘스트 창", "C-53 · 세 칸"}
    ok, notes = R.node_ok(0, out, KNOWN, date(2026, 10, 30))
    assert ok is True
    assert not any("통과한 시험" in n for n in notes), "건너뛴 것을 고쳐졌다고 하지 않는다"
    assert any("건너뛴" in n and "2개" in n for n in notes), "건너뛰어 고쳐졌는지 모른다고 알린다"
    _, notes = R.node_ok(0, "✔ C-35 · 퀘스트 창 (3ms)\nℹ fail 0\n", KNOWN, date(2026, 10, 30))
    assert any("통과한 시험 2개" in n for n in notes), "정말 돌아서 통과했으면 지금처럼 빼라고 알린다"


def test_the_list_file_is_well_formed():
    data = json.loads((ROOT / "04-tests" / "known-failures.json").read_text(encoding="utf-8"))
    fixmap = (ROOT / "01-docs" / "07-maintenance" / "fix-map.md").read_text(encoding="utf-8")
    for g in data["groups"]:
        assert g["fix"].startswith("F-") and f"| {g['fix']} |" in fixmap, f"{g['fix']}가 고칠 목록에 줄로 있어야 한다"
        until = date.fromisoformat(g["until"])
        assert (until - date.today()).days <= 14, f"{g['fix']} 기한은 오늘부터 14일 안 — 길게 미뤄 덮지 않는다"
        assert g["owner"] and g["tests"], "담당과 시험 이름"
        assert all(isinstance(t, str) and t and not t.endswith("ms)") for t in g["tests"]), "시험 이름만(걸린 시간은 빼고)"


def run_all():
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()


if __name__ == "__main__":
    run_all()
    print("ok")
