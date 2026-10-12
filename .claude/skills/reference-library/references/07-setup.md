<!-- claude-drafted: 2026-10-06 — "우리 워크스페이스 상태 / 쓸 만한 곳" 칸과 VoltAgent 분류는 Claude가 덧붙였다. 이름·설명은 원문. -->

# 프로젝트 셋업 — Claude 스킬·플러그인·MCP·서브에이전트

원문: `~/proj/coding_marathon_result/코딩마라톤 가이드/7. 프로젝트 셋업/<폴더>/README.md` (폴더 4개). 원 라이브러리에서는 모든 탭의 사이드바에 있다.

**이 표는 들이는 목록이 아니다.** 하나라도 쓰려면 `dev-workflow` 명령 4로 분석하고
[external-integration.md](../../../rules/external-integration.md)에 따라 판정해
[external-tools.md](../../../../docs/catalog/external-tools.md)에 남긴다. 사용자는 **개인 데이터를 밖으로 보내는
도구를 원하지 않는다** — 데이터가 나가는 도구는 그 점을 먼저 말한다.

## Claude 스킬 (16)

| 이름 | 하는 일 (원문 요약) | 우리 워크스페이스 상태 (2026-10-06) |
|---|---|---|
| canvas-design | .png/.pdf 시각 디자인 | **들임** — VENDORED.md |
| frontend-design | 완성도 높은 프론트엔드 화면 | **들임** — VENDORED.md |
| mcp-builder | MCP 서버 만들기 안내 | **들임** — VENDORED.md |
| theme-factory | 결과물에 테마 입히기 | **들임** — VENDORED.md |
| docx · pdf · pptx · xlsx | 문서·PDF·발표·표 파일 다루기 | 저장소에는 없음. 이 Claude Code 환경에는 `anthropic-skills:` 기본 스킬로 켜져 있음 |
| skill-creator | 스킬 만들기·평가 | 위와 같음. 트리거 평가에 쓰려면 명령 4를 먼저([skill-authoring.md](../../../rules/skill-authoring.md)) |
| webapp-testing | Playwright로 로컬 웹앱 테스트 | 판정 없음 — 화면이 있는 프로젝트의 5·6단계 후보 |
| doc-coauthoring | 문서 공동 작성 흐름 | 판정 없음 — 리뷰 모드("사용자가 쓴다")와 부딪칠 수 있음 |
| web-artifacts-builder | 여러 부품으로 된 claude.ai HTML 아티팩트 | 판정 없음 |
| algorithmic-art | p5.js 생성 예술 | 판정 없음 |
| brand-guidelines | Anthropic 브랜드 색·글꼴 적용 | 우리 용도와 맞지 않음(남의 브랜드) |
| internal-comms | 사내 공지·보고 글쓰기 | 판정 없음 |
| slack-gif-creator | Slack용 움직이는 GIF | 판정 없음 |

## Claude Code 플러그인 (13)

| 이름 | 하는 일 (원문 요약) | 우리 쪽에서 볼 점 |
|---|---|---|
| frontend-design | 일반적이지 않은 프론트엔드 생성 | 같은 이름의 스킬을 이미 들였다 — 플러그인은 필요 없음 |
| code-review | 여러 에이전트로 PR 자동 리뷰 | 이 환경에 `/code-review`가 이미 있음. 리뷰 판정 형식은 [review-mode.md](../../../rules/review-mode.md)가 우선 |
| pr-review-toolkit | PR 리뷰 전문 에이전트 묶음 | code-review와 겹침 |
| security-guidance | 보안 지침 | 보안 기준([security-records.md](../../../rules/security-records.md))과 겹치는지 먼저 |
| commit-commands | 커밋·푸시 명령 | **주의** — 병합은 사용자가 한다는 규칙, 훅과 부딪치는지 확인 |
| hookify | 원치 않는 행동을 막는 훅 생성 | 우리 훅(`.claude/hooks/`)을 건드릴 수 있음 — 기준 파일 변경은 사람이 검토 |
| feature-dev | 기능 개발 구조화 흐름 | `dev-workflow`와 겹침 — 둘을 같이 쓰면 절차가 둘이 된다 |
| plugin-dev | 플러그인 개발 도구 | 플러그인을 만들 때만 |
| agent-sdk-dev | Claude Agent SDK 앱 만들기·검증 | Agent SDK 프로젝트일 때만 |
| claude-opus-4-5-migration | Sonnet 4.x·Opus 4.1 → Opus 4.5 이전 | 지난 모델 이전용 — 지금은 해당 없음 |
| explanatory-output-style | 설명형 출력 스타일 | 출력 스타일은 앱 설정으로도 바꿀 수 있음 |
| learning-output-style | 학습형 출력 스타일 | 원문제("배운 게 재사용되지 않는다")와 맞닿음 — 명령 4 후보 |
| ralph-wiggum | 반복·자기참조 실행 기법 | 자기 참조 도구 체크리스트(implementations.md 4번)와 같이 본다 |

## MCP 서버 (4)

| 이름 | 하는 일 (원문 요약) | 데이터가 나가나 | 우리 쪽에서 볼 점 |
|---|---|---|---|
| context7 | 라이브러리 공식 문서 실시간 조회 | 검색어가 외부 서비스로 나감 | 코드 내용을 넣지 않는 한 위험은 작음 — 점검표의 "데이터" 줄 |
| playwright | 브라우저 자동화·E2E 테스트 | 로컬 실행 | 390px·접근성 E2E(장부 W-15)에 쓸 수 있음 |
| serena | 시맨틱 코드 작업·심볼 검색 | 로컬 실행 | 코드가 커졌을 때 |
| gitlab | GitLab 이슈·MR·파이프라인 | GitLab으로 | 우리는 GitHub — 해당 없음 |

## VoltAgent 서브에이전트 (127) — 분야별

원문은 알파벳 순 이름 목록이다. 분야는 이름과 카드 설명으로 Claude가 나눈 것이다.

| 분야 | 에이전트 |
|---|---|
| 요구·기획·관리 | `business-analyst`, `product-manager`, `project-manager`, `scrum-master`, `ux-researcher`, `research-analyst`, `market-researcher`, `competitive-analyst`, `trend-analyst`, `data-researcher`, `search-specialist` |
| 설계·아키텍처 | `architect-reviewer`, `api-designer`, `graphql-architect`, `microservices-architect`, `cloud-architect`, `llm-architect`, `java-architect`, `angular-architect`, `powershell-module-architect`, `powershell-ui-architect` |
| 프론트엔드·화면 | `frontend-developer`, `react-specialist`, `nextjs-developer`, `vue-expert`, `ui-designer`, `accessibility-tester`, `electron-pro` |
| 백엔드·언어 | `backend-developer`, `fullstack-developer`, `python-pro`, `typescript-pro`, `javascript-pro`, `golang-pro`, `rust-engineer`, `java-architect`, `kotlin-specialist`, `swift-expert`, `cpp-pro`, `csharp-developer`, `php-pro`, `elixir-expert`, `django-developer`, `rails-expert`, `laravel-specialist`, `spring-boot-engineer`, `dotnet-core-expert`, `dotnet-framework-4.8-expert`, `wordpress-master` |
| 모바일·기타 플랫폼 | `mobile-developer`, `mobile-app-developer`, `flutter-expert`, `game-developer`, `embedded-systems`, `iot-engineer`, `blockchain-developer` |
| 데이터·AI | `data-analyst`, `data-engineer`, `data-scientist`, `database-administrator`, `database-optimizer`, `postgres-pro`, `sql-pro`, `ai-engineer`, `machine-learning-engineer`, `ml-engineer`, `mlops-engineer`, `nlp-engineer`, `prompt-engineer`, `quant-analyst` |
| 인프라·운영 | `devops-engineer`, `deployment-engineer`, `platform-engineer`, `sre-engineer`, `kubernetes-specialist`, `terraform-engineer`, `network-engineer`, `azure-infra-engineer`, `windows-infra-admin`, `m365-admin`, `build-engineer`, `dependency-manager`, `git-workflow-manager`, `tooling-engineer`, `dx-optimizer`, `cli-developer`, `websocket-engineer`, `payment-integration`, `fintech-engineer`, `slack-expert`, `mcp-developer`, `powershell-5.1-expert`, `powershell-7-expert` |
| 품질·디버깅 | `code-reviewer`, `qa-expert`, `test-automator`, `debugger`, `error-detective`, `error-coordinator`, `performance-engineer`, `performance-monitor`, `refactoring-specialist`, `legacy-modernizer`, `chaos-engineer` |
| 보안·규정 | `security-auditor`, `security-engineer`, `penetration-tester`, `ad-security-reviewer`, `powershell-security-hardening`, `compliance-auditor`, `legal-advisor`, `risk-manager` |
| 장애 대응 | `incident-responder`, `devops-incident-responder` |
| 문서·글 | `technical-writer`, `documentation-engineer`, `api-documenter`, `content-marketer`, `seo-specialist` |
| 고객·영업 | `customer-success-manager`, `sales-engineer` |
| 에이전트 조율 | `agent-organizer`, `multi-agent-coordinator`, `workflow-orchestrator`, `task-distributor`, `context-manager`, `knowledge-synthesizer`, `it-ops-orchestrator` |

`java-architect`는 설계와 백엔드 두 줄에 있다. 이 저장소에는 서브에이전트가 `verify` 하나뿐이다
([.claude/agents/verify.md](../../../agents/verify.md)). 하나를 들이면 `.claude/agents/`에 새 기준 파일이 생기므로
[consistency.md](../../../rules/consistency.md) 지도에 행을 더한다.
