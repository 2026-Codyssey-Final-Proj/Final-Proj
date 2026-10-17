"""
묶음 받기 줄기 — F15a 묶음 나누기(Q9), F15b·F15c 글자만 옮긴 문서와 추정 표시, S9 가리기, F16b·F16c 맞는 근거.
원본(스크린샷·PDF)은 git에 넣지 않고 옮긴 문서만 저장소에 들어가므로, 키·도메인·IP 등은 옮기기 전에 가린다(S9).
요약·"어느 단계에 닿는가"의 판단과 남의 이름·메시지 거르기는 세션에서 한다 — 여기는 그 결과의 형식과 안전만 지킨다.
"""
import re

from intake import SENSITIVE

IMAGE_EXT = {"png", "jpg", "jpeg", "gif", "heic", "webp"}
SHOT_LIMIT, FILE_LIMIT = 5, 10  # Q9 (스크린샷 5장, 그 밖의 파일은 참고 자료 받기 규칙의 10개)
KIND = {"API 키": "키", "비밀번호": "비밀번호", "주민번호": "주민번호"}
_EXTRA = [  # 순서가 중요하다: 이메일·주소를 먼저 가려야 도메인 규칙이 그 안을 다시 건드리지 않는다
    ("이메일", re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")),
    ("주소", re.compile(r"https?://[^\s)>\]]+")),
    ("IP", re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")),
    ("전화번호", re.compile(r"\b0\d{1,2}-\d{3,4}-\d{4}\b")),
    ("도메인", re.compile(r"\b(?:[A-Za-z0-9-]+\.)+(?:com|net|org|io|kr|dev|app|ai|me|edu|gov)\b")),
]
PATTERNS = [(KIND[n], rx) for n, rx in SENSITIVE] + _EXTRA


def _is_image(name):
    return name.rsplit(".", 1)[-1].lower() in IMAGE_EXT


def _chunks(items, size):
    return [items[i:i + size] for i in range(0, len(items), size)]


def split_batches(items):
    shots = [i for i in items if _is_image(i)]
    files = [i for i in items if not _is_image(i)]
    return _chunks(shots, SHOT_LIMIT) + _chunks(files, FILE_LIMIT)


def batch_records(batches, day):
    return [
        f"{day} | 묶음 {n}/{len(batches)} | {len(b)}개 받음 | {'스크린샷' if _is_image(b[0]) else '파일'}"
        for n, b in enumerate(batches, 1)
    ]


def mask_sensitive(text):
    found = {}
    for kind, rx in PATTERNS:
        text, n = rx.subn(f"[{kind}]", text)
        if n:
            found[kind] = found.get(kind, 0) + n
    return text, found


def transcript_document(name, lines, estimated):
    found, body = {}, []
    for i, line in enumerate(lines):
        masked, f = mask_sensitive(line)
        for k, n in f.items():
            found[k] = found.get(k, 0) + n
        body.append(f"> {masked}" + (" [추정]" if i in estimated else ""))
    masked_note = " · ".join(f"{k} {n}" for k, n in found.items()) or "없음"
    head = [f"# {name} — 글자만 옮긴 문서", f"- 추정 {len(estimated)}줄 (가리거나 흐려서 추정해 읽은 줄)", f"- 가린 것: {masked_note}", ""]
    return "\n".join(head + body) + "\n"


def fit_report(entries):
    if not entries:
        return "맞는 정도: 목적에 답하지 않음 — 이 프로젝트의 어느 단계에도 닿지 않습니다. 저장할지 사용자에게 묻습니다.\n"
    rows = ["| 내용 | 단계 | 근거 |", "|---|---|---|"]
    for item, stage, evidence in entries:
        if not 1 <= stage <= 7:
            raise ValueError("단계는 1~7 중 하나여야 합니다")
        if not evidence.strip():
            raise ValueError("맞는다고 본 내용마다 근거(어느 단계·어느 요구)가 있어야 합니다")
        rows.append(f"| {item} | {stage}단계 | {evidence.strip()} |")
    return "\n".join(rows) + "\n"
