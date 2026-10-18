# 세션 (실제로 채운 문제/프로젝트 항목)

이 폴더는 `01-docs/01-problem-save/`의 템플릿 파일(`algorithm-track.md`, `project-track.md`,
`learning-track.md`)을 실제로 채운 결과물이 쌓이는 곳입니다. 템플릿 원본은 건드리지 않고,
여기에 트랙별 하위 폴더를 만들어 항목을 모읍니다.

## 경로 규칙 (`.claude/skills/dev-workflow/SKILL.md` 참고)

```
01-docs/01-problem-save/sessions/<트랙파일명(확장자 제외)>/<YYYY-MM-DD>-<슬러그>.md
```

예: `01-docs/01-problem-save/sessions/algorithm-track/2026-09-20-two-sum.md`

자기 산출물이 여러 개 생기는 프로젝트는 `05-projects/<슬러그>/` 아래에 같은 하위 경로로
저장한다(예: `projects/qa-prep-system/docs/01-problem-save/sessions/project-track/...`).
**트래커는 어느 쪽이든 아래 표 하나만 쓴다.**

트랙파일명은 `01-docs/01-problem-save/`에 있는 템플릿 파일 이름과 그대로 맞춥니다 —
새 트랙(`README.md`, `prd-template.md`가 아닌 새 `*.md` 파일)을 추가하면 이 폴더에도
같은 이름의 하위 폴더가 자연스럽게 생깁니다.

## 트래커 — 지금까지 진행한 모든 항목

새 항목을 저장하거나 게이트가 바뀔 때마다 이 표를 같이 갱신합니다. 개별 항목의
자세한 진행(게이트 로그, 회고)은 각 세션 파일에, 실제 코드/테스트는
그 프로젝트 폴더(`05-projects/<슬러그>/implementations/`)에 있습니다. 팀 제품(Floe)의 코드는
[`03-backend/`](../../../03-backend/README.md)·[`02-frontend/`](../../../02-frontend/README.md), 시험은 [`04-tests/`](../../../04-tests/README.md).

| 문제/프로젝트 | 트랙 | 등급 | 사용한 패턴 | 게이트 | 테스트 | 세션 파일 |
|---|---|---|---|---|---|---|
| Floe (팀 제품, 작업 이름 Project Navigator) | 프로젝트 | Full · PRD 상세형 | ADR 0002~0009 (`03-pattern-analysis/adr/`) | 3 (2→3 Go 2026-10-18 · 리뷰 판정 Recycle: 성공 수치 목표 숫자 10/26) | `python3 04-tests/run_all_tests.py` (2026-10-18 · 263개 통과) | [2026-10-18-floe.md](project-track/2026-10-18-floe.md) |

전체 테스트를 한 번에 돌리려면: `python3 04-tests/run_all_tests.py`

## 지금까지 나온 패턴/교훈이 남는 곳

- **패턴**: [`01-docs/catalog/patterns.md`](../../catalog/patterns.md) — 위 표의 "사용한 패턴" 열이 여기서 옵니다
- **체크리스트**: [`01-docs/catalog/checklist.md`](../../catalog/checklist.md) — 회고에서 나온 재발 방지 항목
- **과정 전체 기록**: [`01-docs/00-overview/worklog.md`](../../00-overview/worklog.md)
