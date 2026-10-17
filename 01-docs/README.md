# 01-docs — 문서 지도

**이 폴더는:** 팀의 모든 문서가 있는 곳이다. 문서가 많아서, 무엇을 찾는지에 따라 아래 다섯 묶음으로 나눠 안내한다.

## 1. 제품 — 무엇을 만드나 (Floe)

| 문서 | 무엇 |
|---|---|
| [요구사항](00-overview/requirements.md) | **제품 요구의 원본.** 기능 13개(FR-1~13), 우선순위, 접수 중인 후보 |
| [기획안](00-overview/final-project-plan.md) | 왜 만드나 — 문제, 대상, 검증 계획 |
| [캔버스](00-overview/canvas.md) | 기획을 한 장으로 |
| [구조 결정 기록(ADR) 목록](03-pattern-analysis/adr/README.md) | 시연 구조, AI 호출 위치, 기억 저장 등 정한 것과 이유 |
| [구조 초안](03-pattern-analysis/navigator-architecture-draft.md) · [층 그림](03-pattern-analysis/navigator-archimate.md) | 전체가 어떻게 돌아가나 |
| [유스케이스(사용 장면)](04-pattern-implementation/uc/README.md) | 사용자가 어떤 순서로 쓰나 — 시연 시나리오 |
| [화면 흐름·와이어](04-pattern-implementation/screen-flow-wireframe.md) · [서재 설계](04-pattern-implementation/library-view-design.md) | 화면 설계 |
| [다른 API를 받으면](04-pattern-implementation/api-intake.md) | 외부 API를 받았을 때 분석하는 법 |
| [판정 규칙 검토](00-overview/navigator-prototype-rules-review.md) | 프로토타입의 단계 판정 규칙을 기준과 비교 |
| [인터뷰](interviews/README.md) | 사용자 인터뷰 질문지와 요약 |

## 2. 팀 운영 — 누가 언제 무엇을

| 문서 | 무엇 |
|---|---|
| [팀 우선순위와 내 몫](00-overview/team-priorities.md) | **사람별 할 일의 원본.** 기한·리뷰어·누구를 기다리나 |
| [일정과 역할](00-overview/schedule.md) | 대회 일정·평가 배점·제출물 |
| [팀 작업 가이드](00-overview/team-guide.md) | 처음 받기, 내 키 두는 곳, PR 올리는 법 |
| [공유·보안 규칙](00-overview/team-sharing-security.md) | 무엇을 올리고 무엇을 안 올리나 |
| [시연에서 베타까지](00-overview/roadmap-demo-to-beta.md) | 지금 목표(시연)와 제출 이후(베타) |
| [담당별 질문](00-overview/definition-questions-2026-10-16.md) · [서재 질문](00-overview/library-questions-2026-10-16.md) | 담당이 답할 결정거리 (답 대기) |
| [도와준 사람](ACKNOWLEDGEMENTS.md) | 감사 명단 |

## 3. 지난 기록 — 그날의 상태 (지금과 다를 수 있음)

[멘토링 1 준비](00-overview/기록/mentoring-1-prep.md) · [#5 점검](00-overview/기록/requirements-check-2026-10-15.md) · [팀원 안내문 초안](00-overview/기록/team-handoff-demo.md) · [작업 분담 10/16](00-overview/기록/work-split-2026-10-16.md) · [위험 3가지](00-overview/기록/risk-plan.md) · [V1→V2 이전 기록](00-overview/migration.md) · [작업 로그](00-overview/worklog.md)

## 4. 방법론 — 어떻게 일하나 (7단계 워크플로우)

팀이 따르는 일하는 순서다. 0 정하기 → 1 적어 두기 → 2 기능 정리 → 3 방법 고르기 → 4 뼈대 → 5 만들기 → 6 재 보기 → 7 돌아보기.

| 문서 | 무엇 |
|---|---|
| [개요](00-overview/README.md) | 7단계 전체 그림 |
| [규모 판단](00-overview/scope-tiers.md) · [게이트 규정](00-overview/gates.md) | 얼마나 무겁게 할지, 단계를 넘어갈 조건 |
| [세션 운영](00-overview/session-operations.md) · [성장 로그](00-overview/growth-log.md) | Claude 세션 나눠 쓰는 법, 리뷰 기록 |
| 단계별 폴더 | [1 문제 저장](01-problem-save/README.md) · [2 문제 분석](02-problem-analysis/README.md) · [3 패턴 분석](03-pattern-analysis/README.md) · [4 패턴 구현](04-pattern-implementation/README.md) · [5 구현](05-implementation/README.md) · [6 서비스](06-service/README.md) · [7 유지보수](07-maintenance/README.md) |
| [카탈로그](catalog/README.md) | 회고에서 쌓이는 체크리스트·패턴·외부 도구 목록 |

## 5. 참고 자료

[레프런스 창고](references/README.md) — 화면 테마·스타일 후보 등. 결정은 여기서 하지 않는다.

## 이 저장소의 다른 폴더

코드는 [frontend](../02-frontend/README.md)(화면) · [backend](../03-backend/README.md)(서버·판정 규칙), 시험은 [tests](../04-tests/README.md), 팀 제품 밖 프로젝트는 [projects](../05-projects/README.md).

Claude 초안 (2026-10-17, 두승현 요청). 틀린 곳은 담당이 고친다.
