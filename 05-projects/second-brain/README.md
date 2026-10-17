# 세컨드 브레인

학교생활 동안 쓰는 개인 지식 창고를 이 워크스페이스의 기능으로 만드는 프로젝트입니다.
무엇을 왜 만드는지는 사용자가 [세션 파일](PROGRESS.md)에
직접 씁니다.

**상태는 이 문서에 적지 않습니다.** 진행 상태의 원천은 세션 파일의 게이트 로그입니다.

## 어떻게 만들어지는가

이 프로젝트는 워크스페이스의 7단계 워크플로우를 **Full 등급**으로 밟습니다. 작업물은 내가
쓰고, Claude는 질문·리뷰·도구 안내를 맡습니다([리뷰 모드](../../.claude/rules/review-mode.md)).
지금 어느 단계인지는 이 그림에 적지 않습니다 — [게이트 로그](PROGRESS.md)를
보세요.

### 재료가 요구사항이 되기까지

대화에서 나온 말은 세션 파일의 "재료 표"에 원문으로 모이고, 내가 1단계 필드로 옮긴 뒤 2단계에서
요구사항으로 확정됩니다. 워크스페이스에 들인 스킬·명세는 요구사항이 아니라 만들 때 쓰는
도구입니다.

```mermaid
flowchart LR
    M["재료 표<br/>(사용자 발언 원문)"] --> F["1단계 필드<br/>내가 작성"]
    F --> P["PRD 결정<br/>단독 질문"]
    P --> R["2단계 요구사항<br/>EARS로 확정"]
    R --> D["3단계 이후<br/>설계·구현"]
    W["워크스페이스 능력<br/>(요구사항 아님)<br/>명세 · 디자인 스킬 · MCP 안내"] -.-> D

    classDef me fill:#E1F5EE,stroke:#0F6E56,color:#085041
    classDef claude fill:#EEEDFE,stroke:#534AB7,color:#3C3489
    classDef rec fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    class F,R me
    class P,W claude
    class M,D rec
```

### Full 등급 7단계

단계마다 왼쪽이 내가 쓰는 작업물, 오른쪽이 Claude의 질문·리뷰와 도구입니다. 단계 사이의
모든 화살표에서 게이트 리뷰를 합니다(내 자기 판정을 먼저 적고, 그다음 리뷰 판정).

```mermaid
flowchart TB
    subgraph S1["1 문제 저장"]
        direction LR
        U1["필드 5개 작성<br/>등급 근거 · PRD 답"] --- C1["되묻기<br/>PRD 단독 질문"]
    end
    subgraph S2["2 문제 분석"]
        direction LR
        U2["요구사항 문장<br/>재료 표 → EARS"] --- C2["얕음 3조건 질문<br/>숫자·날짜 되묻기"]
    end
    subgraph S3["3 패턴 분석"]
        direction LR
        U3["구조 결정 ADR<br/>저장 · 그래프 · 화면"] --- C3["대안 비교 안내<br/>디자인 스킬 · 청중 질문 렌즈"]
    end
    subgraph S4["4 패턴 구현"]
        direction LR
        U4["최소 골격<br/>주요 부분 연결"] --- C4["자기 참조 점검<br/>체크리스트 항목"]
    end
    subgraph S5["5 구현"]
        direction LR
        U5["코드 · 테스트<br/>TDD · 경계값"] --- C5["변경 리뷰<br/>verify · 명세 검사"]
    end
    subgraph S6["6 서비스"]
        direction LR
        U6["스킬로 묶어 사용<br/>학교생활에 실사용"] --- C6["트리거 평가 후보<br/>skill-creator (명령 4)"]
    end
    subgraph S7["7 유지보수"]
        direction LR
        U7["회고<br/>5 Whys"] --- C7["성장 로그 정리<br/>체크리스트 승격"]
    end

    S1 -->|게이트 리뷰| S2 -->|게이트 리뷰| S3 -->|게이트 리뷰| S4
    S4 -->|게이트 리뷰| S5 -->|게이트 리뷰| S6 -->|게이트 리뷰| S7
    S7 -.-> N["↻ 배운 것이 다음 작업의 기준이 된다<br/>(catalog · 체크리스트 · 성장 로그)"]

    classDef me fill:#E1F5EE,stroke:#0F6E56,color:#085041
    classDef claude fill:#EEEDFE,stroke:#534AB7,color:#3C3489
    class U1,U2,U3,U4,U5,U6,U7 me
    class C1,C2,C3,C4,C5,C6,C7 claude
    classDef rec fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    class N rec
```

초록은 내가 쓰는 것, 보라는 Claude의 질문·리뷰와 도구입니다. 3단계 이후의 구체적인 내용
(학교 내용을 어디에 둘지, 그래프를 직접 만들지 외부 도구를 쓸지, 화면 형태)은 그 단계에서
정합니다 — 이 그림은 누가 무엇을 하는지만 보여 줍니다.

## 문서 지도

| 무엇을 보고 싶은가 | 어디에 있나 |
|---|---|
| 문제·PRD·명세·게이트 | [세션 파일](PROGRESS.md) |
| 프로젝트 안내(Claude용) | [CLAUDE.md](CLAUDE.md) |
| 진행 중인 항목 한눈에 | [트래커](../../01-docs/01-problem-save/sessions/README.md) |
