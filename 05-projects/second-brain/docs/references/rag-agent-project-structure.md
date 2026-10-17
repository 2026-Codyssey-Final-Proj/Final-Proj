# 참고 자료 — RAG·AI 에이전트 프로젝트 구조 (인포그래픽 2장)

<!-- claude-drafted: 2026-10-06 — 사용자 요청("두개 정리", "세컨드 브레인 references에 파일로 남기고")으로 Claude가 사용자가 준 인스타그램 스크린샷 2장을 읽고 썼다. 남이 만든 자료라 글자를 옮기지 않고 구조·원칙만 요약했다. "가져올 것"은 후보이고, 확정은 사용자가 한다. -->

## 무엇

- 인스타그램 @gauravgoyalai의 인포그래픽 2장 — "RAG Project Structure", "AI Agent Project Structure". 둘 다
  "모듈식·유지보수 쉬움·프로덕션 준비"를 내세운 **폴더 구조 예시**다. 공개 표준이 아니라 한 사람의 제안이다.
- 원본 스크린샷은 git에 넣지 않았다(사용자 결정 2026-10-04 "(다)"). 받은 날: 2026-10-06.

### 공통 뼈대

| 폴더 | 역할 |
|---|---|
| `config/` | 모델·로그 설정을 YAML로 분리, API 키는 환경변수 |
| `data/` | 원본(raw)과 가공본(processed), 예시 질문을 분리 |
| `src/` | 핵심 로직 — 아래 표에서 두 구조가 갈라진다 |
| `evaluation/` | 테스트 케이스·지표(faithfulness 등) |
| `app/` | 진입점(FastAPI 등, UI는 선택) |
| `scripts/` | 인덱스 만들기·실행·평가 스크립트 |
| `docs/` | README, SETUP |
| Docker·의존성 | 재현 가능한 환경 |

### 갈라지는 곳 — `src/`

| | RAG | AI 에이전트 |
|---|---|---|
| 흐름 | 문서 → 불러오기 → 자르기·정리 → 임베딩 → 벡터 DB → 검색·재순위 → LLM → 출처 붙은 답 | 사용자 → 에이전트 → 도구 → 기억 → 계획·흐름 → LLM → 응답 |
| 모듈 | ingestion, processing, embeddings, vector_store, retrieval, generation | agents, tools, memory, workflows, prompts |
| 중심 질문 | 무엇을 찾아서 답할까 | 무엇을 할지 정하고 도구를 쓸까 |
| 기억 | 벡터 DB가 곧 지식 | 단기(대화)·장기(벡터 DB·DB) 기억을 나눔 |

## 목적 연결

- **P1 지식 사이클** — RAG 흐름이 F1 넣기 → F4 찾기와 같다.
- **P2 프로젝트 진행** — 에이전트 흐름(계획·도구·기억)이 F7 기억·F8 알람·F10 "행동은 할 일이 된다"에 가깝다.

## 가져올 것 (후보)

| 단계 | 재료 | 쓰는 곳 |
|---|---|---|
| 3단계 ADR | 세컨드 브레인은 **RAG형(찾아서 답함)인가, 에이전트형(할 일을 정하고 알림)인가, 둘 다인가** | 창고 구조·기능 경계를 정하는 질문 |
| 3단계 저장 구조 | 원본(raw)과 가공본(processed)을 나눈다 | 넣은 원문과 요약을 따로 두는 안 — S1(원문에 없는 정보는 쓰지 않는다)을 원문 대조로 확인할 수 있다 |
| 5~6단계 | 답에 **출처를 붙인다**, faithfulness 지표 | S1, [LLM-Prompt-Engineering](LLM-Prompt-Engineering.md) ③ 환각 검증, patterns.md 근거 칩 카드 |
| 4단계 | 단기·장기 기억을 나눈다 | F7 — [Basic Memory](basic-memory.md)가 장기 기억 후보 |

## 교훈

- **처음부터 폴더 15개 이상을 만들지 않는다.** 1인용·로컬에서 시작하는 프로젝트에 빈 폴더가 쌓이면 과잉 설계다
  (karpathy-guidelines 2번, ponytail-review). 4단계 Walking Skeleton에서 실제로 필요해진 폴더만 연다.
- 마크다운 파일 창고라면 벡터 DB 없이 텍스트 검색부터 시작할 수 있다 — 임베딩은 검색이 부족하다는 측정이 나온 뒤에.
- `config/`의 API 키 환경변수 분리는 이미 있는 기준과 겹친다([Twelve-Factor Config](../../../../01-docs/06-service/01-twelve-factor-app.md), 6-3 비밀값 훅).

## 보안 메모

- 공개 게시물. 개인정보·팀원 정보 없음. 다른 사람이 만든 자료라 원문 글자는 옮기지 않았다.
