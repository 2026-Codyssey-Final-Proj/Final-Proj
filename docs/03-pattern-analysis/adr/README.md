# ADR (Architecture Decision Record) 실무 가이드

3단계에서 프로젝트 트랙의 결정을 기록하는 방식. "왜 이렇게 만들었는지"를 미래의 나(또는
협업자)가 다시 물어보지 않게 남기는 것이 목적입니다.

## ADR이란

Michael Nygard가 2011년에 제안한 개념으로, **하나의 아키텍처적으로 중요한 결정**을
1~2페이지로 기록하는 문서입니다. AWS, Azure, Google Cloud를 비롯한 대부분의 엔지니어링
조직이 이 형식을 채택하고 있습니다. "아키텍처적으로 중요한 결정"이란 나중에 되돌리기
비싸거나, 여러 컴포넌트에 영향을 미치거나, 팀 전체가 알아야 하는 결정을 뜻합니다 —
사소한 구현 디테일은 ADR로 안 남겨도 됩니다.

## 기본(Nygard) 템플릿

```
# ADR-NNNN: <제목>
- Status:
- Date:

## Context
## Decision
## Considered Alternatives
## Consequences
```

## 경량판 — MADR (Markdown Architectural Decision Records)

결정 배경이 단순할 때는 Nygard 전체 양식 대신 **MADR**의 최소(minimal) 템플릿을 써도
됩니다. MADR은 2017년부터 쓰이기 시작한 커뮤니티 표준으로, 필수 섹션만 남긴 버전을
제공합니다.

```
# <제목>

- Status:
- Deciders:
- Date:

## Context and Problem Statement
## Considered Options
## Decision Outcome
```

**선택 기준**: 대안이 3개 이상이고 트레이드오프가 복잡하면 Nygard 풀버전, 대안이 2개
이하로 단순하면 MADR 최소판을 씁니다.

## 실무 규칙 (adr.github.io 커뮤니티 관행)

1. **번호는 0으로 채운 4자리 연번**을 쓴다 (`0001`, `0002`, ...). 대화에서 "ADR-3 봐줘"처럼
   바로 참조 가능해야 하기 때문.
2. **번호는 절대 재사용/재배치하지 않는다.** 시간순 이력 자체가 가치.
3. **한 번 Accepted된 ADR은 불변(immutable)이다.** 오탈자 수정 정도는 괜찮지만, 결론이나
   Consequences 내용을 나중에 고쳐 쓰지 않는다. 생각이 바뀌면 **새 ADR을 만들어 이전 ADR을
   대체(Superseded)** 시킨다 — 옛 ADR은 지우지 않고 상태만 바꾼다.
4. **상태(Status) 생애주기**: `Proposed` → `Accepted` → (필요 시) `Deprecated` 또는
   `Superseded by ADR-NNNN`. 상태 메타데이터만 갱신 가능, 본문은 갱신 불가.
5. **폐기된 ADR도 절대 삭제하지 않는다** — 아키텍처가 어떻게 진화했는지 보여주는
   타임라인 자체가 자산이다.

## 이 저장소의 ADR 목록

| ID | 제목 | 상태 |
|---|---|---|
| [0001](0001-storage-and-interface.md) | 워크플로우 인터페이스를 파일+Claude Code 스킬 하이브리드로 결정 | Accepted |
| 0002 *(V1에만 있음)* | (qa-prep-system) 발표 준비 시스템 조각 1의 슬롯·카드 저장 구조를 구조화 마크다운으로 결정 | Accepted |
| [0003](../../../projects/second-brain/docs/03-pattern-analysis/adr/0003-first-version-structure.md) | (second-brain) 첫 버전의 구조 — 서버 없이 파일 + Claude 세션, 폰 알람 빈틈 | Accepted |
| [0004](../../../projects/second-brain/docs/03-pattern-analysis/adr/0004-vault-location-and-layout.md) | (second-brain) 창고의 위치와 폴더 모양 — 이 저장소 안 `vault/` | Accepted |
| [0005](../../../projects/second-brain/docs/03-pattern-analysis/adr/0005-issue-format-and-vault-folders.md) | (second-brain) 이슈 제목 틀과 창고 폴더 — `목적 / 이름 / 내용 / 마감` | Accepted |
| [0006](../../../projects/second-brain/docs/03-pattern-analysis/adr/0006-serial-numbers.md) | (second-brain) 할 일 일련번호 — 목적마다 범위, 다시 쓰지 않음 | Accepted |
| [0007](../../../projects/second-brain/docs/03-pattern-analysis/adr/0007-data-branch.md) | (second-brain) 데이터는 `data` 브랜치에 바로 커밋 — 병합은 코드·규칙만 | Accepted |
| [0008](0008-sequential-coding-protocol.md) | (팀) 요구사항 하나씩 도는 순차 코딩 프로토콜("한 바퀴") | Accepted |
| [0009](0009-ai-provider-subscription-first.md) | (팀) AI 호출은 사용자 본인의 Claude 구독이 기본 — Claude만 구매한 사람도 쓴다 | Accepted |

> **번호가 두 갈래다.** 위 표의 `(second-brain)`·`(qa-prep-system)` 항목은 V1(개인) 번호이고, 이 폴더의 `0002-*`~`0006-*` 파일은 **팀 ADR**(시연 구조·AI 경계·장기 기억·저장 분리·통합, 모두 Accepted 2026-10-17)이다. 팀 ADR은 `(팀)`으로 구분하고, V1 ADR을 인용할 때는 `V1-ADR-NNNN`으로 쓴다.

ADR-0001은 이 시스템 자체(어떻게 만들어졌는지)를 설명하는 결정입니다. **번호는
워크스페이스 전체에서 하나의 연번**을 씁니다 — 프로젝트 전용 ADR은 파일을
`projects/<슬러그>/docs/03-pattern-analysis/adr/`에 두더라도 이 표에 행을 추가하고
다음 번호(지금은 `0010`)를 받습니다(실무 규칙 2번 — 한 번 쓴 번호는 재사용하지 않는다).

## 출처
- Nygard, M., *Documenting Architecture Decisions* (2011) — [템플릿 정리](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)
- [Architectural Decision Records — AD Practices](https://adr.github.io/ad-practices/)
- [About MADR](https://adr.github.io/madr/), [MADR GitHub](https://github.com/adr/madr)
