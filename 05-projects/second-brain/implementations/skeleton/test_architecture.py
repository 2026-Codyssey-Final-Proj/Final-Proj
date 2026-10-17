"""
아키텍처 규칙을 도구로 강제한다 (code.md 6번, 4·5단계 체크리스트).
규칙: 세컨드 브레인 코드는 계산과 파일 읽기·쓰기만 한다 — 밖으로 보내는 일(네트워크, 메일, 외부 명령)은 세션이 하고,
사용자가 그 자리에서 확인한다(S4, ADR-0003). 그래서 이 폴더의 코드는 네트워크·외부 실행 모듈을 가져오지 못한다.
시험 도구가 임시 저장소를 만드는 test_*.py는 대상이 아니다(코드가 아니라 시험).
"""
import ast
from pathlib import Path

FORBIDDEN = {"socket", "ssl", "requests", "httpx", "aiohttp", "urllib.request", "urllib3", "http.client", "http.server",
             "smtplib", "ftplib", "telnetlib", "xmlrpc", "subprocess", "webbrowser"}  # urllib.parse는 글자 바꾸기라 허용
HERE = Path(__file__).resolve().parent


def _is_forbidden(name):
    return any(name == f or name.startswith(f + ".") for f in FORBIDDEN)


def forbidden_imports(source):
    found = set()
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Import):
            names = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            names = [mod] if _is_forbidden(mod) else [f"{mod}.{a.name}" for a in node.names]
        else:
            continue
        found |= {n for n in names if _is_forbidden(n)}
    return sorted(found)


def test_the_checker_catches_the_violation_attempts():  # 위반 시도
    assert forbidden_imports("import requests\n") == ["requests"]
    assert forbidden_imports("from urllib.request import urlopen\n") == ["urllib.request"]
    assert forbidden_imports("from urllib import request\n") == ["urllib.request"]
    assert forbidden_imports("import os, subprocess as sp\n") == ["subprocess"]
    assert forbidden_imports("def f():\n    import socket\n") == ["socket"]
    assert forbidden_imports("import http.client\n") == ["http.client"]


def test_the_checker_passes_ordinary_modules_and_urllib_parse():
    assert forbidden_imports("import re\nfrom pathlib import Path\nfrom datetime import date\n") == []
    assert forbidden_imports("from urllib.parse import quote\nimport urllib.parse\n") == []


def test_no_code_module_here_can_send_anything_out():
    modules = [p for p in HERE.glob("*.py") if not p.name.startswith("test_")]
    assert len(modules) >= 8  # 검사가 빈 목록을 통과시키지 않는다
    bad = {p.name: forbidden_imports(p.read_text(encoding="utf-8")) for p in modules}
    assert {k: v for k, v in bad.items() if v} == {}


def run_all():
    tests = [v for k, v in globals().items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
    print(f"ok  second-brain architecture rule: {len(tests)} tests")


if __name__ == "__main__":
    run_all()
