# Alcovibe — 이재엽의 개인 프로젝트에서 가져온 것

<!-- claude-drafted: 2026-10-15 — 이재엽의 요청으로 Claude가 썼다. 가져온 범위와 가져오지 않은 범위를 팀원이 이해하도록 한 장으로 정리했다. -->

## 한 줄

**Alcovibe**는 이재엽이 이 저장소와 **별도로** 쓰는 개인 작업 환경의 이름이다. 개인 프로젝트·세션·요구를 한곳에서 관리하고,
이 팀 저장소(Project Navigator)와 같은 7단계 워크플로우·규칙·훅을 바탕으로 한다. 팀 제품(Project Navigator)과는 **다른 것**이다.

그 개인 환경에서 만든 것 중 **팀에도 쓸모가 있는 것**을 이 PR로 가져왔다. 가져온 것은 "개인 프로젝트 파일"로 표시하고, 팀 기준이 아니다.

## 가져온 것

| 묶음 | 어디에 있나 | 설명 |
|---|---|---|
| 화면 테마 제안 — 차원의 도서관 | [library-theme.md](library-theme.md), [library-theme-prompts.md](library-theme-prompts.md) | 보랏빛 아치형 분위기, 도서관어는 보조 자리에만. 이미지 생성 프롬프트 |
| 스타일 가이드 후보 | [style-guide-options.md](style-guide-options.md) | 토큰 형식, 대비 규칙, 어두운 제품 UI 참고, 정보 구조. 팀이 정할 5문항 |
| 이미지 | [images/](images/README.md) | 시안 이미지 8장 자리(이재엽이 업로드) |
| 프로젝트 소개 | [projects.md](projects.md) | 개인 환경 안의 프로젝트(세컨드 브레인, qa-prep-system, ai-os, Alcovibe 자체)를 한 장으로 |
| qa-prep-system 문서 | [qa-prep-system/](qa-prep-system/README.md) | 발표 질문 대비 시스템의 설명·시험 기록·ADR(`V1-ADR-0002`로 표기) — 세션 파일은 제외 |
| 기능 집약 | [features.md](features.md) | 개인 환경의 기능을 한 장으로 — 무엇을 가져왔고 무엇은 아닌지 |
| 기능 계획서 | `projects/second-brain/docs/05-implementation/feature-plan-usecases.md`, `feature-plan.md` | 세컨드 브레인 유즈케이스별 계획, 접수된 요구를 기능 단위로 묶은 계획 |
| 훅 3개와 시험 | `.claude/hooks/` — `calendar-owner-guard.sh`, `ask-calendar-invite.sh`, `session-briefing.sh` | 캘린더 일정 쓰기 보호, 초대 확인, 세션 시작 브리핑 |
| 스킬 9개 | `.claude/skills/` — `tdd`, `owasp-security`, `impeccable-review`, Emil Kowalski 스킬 6개 | 외부에서 가져온 것이라 출처·라이선스는 `VENDORED.md` |

## 가져오지 않은 것

| 것 | 이유 |
|---|---|
| 개인 세션 파일, 접수·성장 기록, `data` | 개인 기록(팀 CLAUDE.md "V1 → V2" 표) |
| `projects/ai-os`, `projects/alcovibe` | 개인 프로젝트. 팀 V2 결정("지금은 `second-brain` 하나") |
| `projects/qa-prep-system`·`ai-os` **폴더 자체** | 위와 같은 결정(`projects/`에는 `second-brain`만). qa-prep 문서는 참고 자료로 위에 두었다 |
| 개인 캘린더 연결 설정(커넥터 id 등) | 개인 계정 정보 — 훅은 가져오되 설정 값은 비웠다 |

## 이 폴더를 쓰는 법

- 읽고 쓸모 있으면 담당 역할에게 제안으로 가져가고, 결정은 해당 문서에 적는다.
- 이름 "Alcovibe"는 이 자료의 출처 이름이다. 팀 화면·문서의 이름 결정은 별도 안건이다.
