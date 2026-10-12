#!/usr/bin/env bash
# .claude/skills/*/SKILL.md가 Agent Skills 명세(https://agentskills.io/specification)를
# 지키는지 확인한다. PostToolUse 훅(SKILL.md 편집 후)과 verify 에이전트가 함께 쓴다.
# 명세의 필수 규칙은 오류(exit 2), 권장 사항은 경고(stderr, exit 0)로 나눈다.
# 공식 검증기 skills-ref는 "시연용, 운영용 아님"이라 쓰지 않고 같은 규칙을 직접 확인한다
# (.claude/rules/skill-authoring.md, docs/catalog/external-tools.md 참고).
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0
python3 - <<'PY'
import re, sys, pathlib

SPEC_FIELDS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}
NAME_RE = re.compile(r"[a-z0-9]+(-[a-z0-9]+)*")
errors, warnings = [], []

for skill_md in sorted(pathlib.Path(".claude/skills").glob("*/SKILL.md")):
    d = skill_md.parent.name
    text = skill_md.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        errors.append(f"{skill_md}: YAML 머리말(---)이 없다")
        continue
    # 최상위 키만 본다 (metadata 아래 들여쓴 줄은 건너뛴다)
    fields = dict(re.findall(r"^([A-Za-z][\w-]*):[ \t]*(.*)$", m.group(1), re.M))
    name, desc = fields.get("name", "").strip(), fields.get("description", "").strip()

    if not (1 <= len(name) <= 64 and NAME_RE.fullmatch(name)):
        errors.append(f"{skill_md}: name '{name}'은 소문자·숫자·하이픈 1~64자, 하이픈으로 시작·끝·연속 불가")
    elif name != d:
        errors.append(f"{skill_md}: name '{name}'이 폴더 이름 '{d}'과 다르다")
    if not (1 <= len(desc) <= 1024):
        errors.append(f"{skill_md}: description은 1~1024자여야 한다 (지금 {len(desc)}자)")
    comp = fields.get("compatibility")
    if comp is not None and not (1 <= len(comp.strip()) <= 500):
        errors.append(f"{skill_md}: compatibility는 1~500자여야 한다")

    extra = sorted(set(fields) - SPEC_FIELDS)
    if extra:
        warnings.append(f"{skill_md}: 명세 밖 필드 {extra} — Claude Code 전용이면 괜찮지만 다른 도구에서는 무시될 수 있다")
    lines = text.count("\n")
    if lines > 500:
        warnings.append(f"{skill_md}: {lines}줄 — 명세 권장은 500줄 이하, 세부는 references/로 옮긴다")

for w in warnings:
    print(f"⚠️ {w}", file=sys.stderr)
if errors:
    print("🚫 Agent Skills 명세 위반:", file=sys.stderr)
    for e in errors:
        print(f"  {e}", file=sys.stderr)
    sys.exit(2)
PY
