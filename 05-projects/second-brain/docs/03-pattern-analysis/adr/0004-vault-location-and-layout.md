# ADR-0004: 창고(데이터)의 위치와 폴더 모양

- Status: **Accepted** — 폴더 모양은 [ADR-0005](0005-issue-format-and-vault-folders.md)가 대체(위치 결정 "이 저장소 안 `vault/`"은 그대로)
- Deciders: 사용자 (2026-10-08, "답: 가")
- Date: 2026-10-08
- 이어지는 결정: [ADR-0003](0003-first-version-structure.md)이 구조를 정했고, 창고를 어디에 둘지는 정하지 않았다(Accepted라 고치지 않고 새로 쓴다).

## Context and Problem Statement

4단계 Walking Skeleton에서 폰 이슈 한 줄이 문서가 되려면 문서가 놓일 자리가 있어야 한다. 프로젝트 안내(`CLAUDE.md`)는 "폴더·분류는 3단계 ADR에서 정한다"고 적어 두었다. 폰 입력용 이슈도 어느 저장소에 쌓일지 정해야 한다.

## Considered Options

1. **(가) 이 워크스페이스 저장소 안** — `projects/second-brain/vault/`, 이슈도 같은 저장소.
2. **(나) 새 비공개 저장소** — 데이터와 도구를 분리. 저장소 만들기, 훅·noreply 재설정, 백업(D4)도 따로.

## Decision Outcome

**(가)를 고른다.** Walking Skeleton은 얇게 시작해야 하고, 비밀값 검사·병합 확인 훅과 noreply 설정이 이미 있으며, 사본 둘(GitHub + 내 컴퓨터, D4)이 그대로 적용된다. 폴더는 나중에 `git mv`로 옮길 수 있고 데이터가 쌓이기 전에는 분리 비용이 작다.

**폴더 모양 (첫 버전):**

```
projects/second-brain/vault/<프로젝트>/<할 일>.md     할 일 하나 = 파일 하나
projects/second-brain/run-log.md                      자동화 실행 기록 (언제·무엇을·성공/실패, S2d)
```

- 문서의 위치는 `<프로젝트>/<할 일>`이고, 알람 한 줄에 이대로 들어간다(D2).
- 이름은 `/`·`\`·`..`·`.`으로 시작하는 이름을 거부한다 — 저장소 밖으로 쓰이는 것을 막는다(A01).
- 지식(배운 것, 관찰→해석→행동)이 쌓일 폴더는 이 ADR이 정하지 않는다. 할 일 파일에 붙이거나 따로 둘지는 P1을 구현할 때 새 ADR로 정한다.

## Consequences

- 공개 템플릿으로 보낼 때 `projects/**`는 제외하는 규칙([git-workflow](../../../../../.claude/rules/git-workflow.md))에 데이터가 기대게 된다. `vault/`가 `projects/second-brain/` 안에 있는 것이 그 규칙을 지키는 방법이다.
- 폰 입력 이슈는 이 저장소의 이슈로 쌓이므로 개발 이슈와 섞인다 — 이슈 제목 틀(`프로젝트 / 할 일 / 기한`)로 구분한다.
- 사용자가 저장소 분리를 원하면 이 ADR을 대체하는 새 ADR로 옮긴다.
