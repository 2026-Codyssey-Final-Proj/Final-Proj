<!-- claude-drafted: 2026-10-12 — 이재엽의 요청("지금 하는 내용과 전체 과정을 리드미로, 다이어그램 포함")으로 Claude가 requirements.md와 이전 기록을 모아 썼다. 원천은 requirements.md이고, 어긋나면 그쪽이 맞다. -->

# Project Navigator

> **AI로 바이브 코딩을 하는 사람**이 프로그램을 끝까지 만들고, 이해하고, 배움을 쌓도록 **길을 안내하는** 서비스.
> *"AI가 일하는 시대에도, 성장하는 건 사람이어야 한다."*

코디세이 AI 네이티브 응용 학습 Final-Project · 팀: 이재엽(총괄) · 고한결 · 임유정 · 두승현 — 역할은 [TEAM.md](TEAM.md)

| 알고 싶은 것 | 어디 |
|---|---|
| 무엇을 만드나, 요구사항 12개 | [requirements.md](docs/00-overview/requirements.md) — **요구의 원천** |
| 기획안 | [final-project-plan.md](docs/00-overview/final-project-plan.md) |
| **일정 · 역할 · 평가 기준** | [schedule.md](docs/00-overview/schedule.md) — 제출 11/8(일) 18:00, 평가 11/12~13 |
| **우선순위 · 누가 무엇을 이어 받나** | [team-priorities.md](docs/00-overview/team-priorities.md) — 길잡이(원천은 requirements.md 10절·이슈) |
| V1에서 무엇을 옮겼나 | [migration.md](docs/00-overview/migration.md) |
| 공유·보안 규칙 | [team-sharing-security.md](docs/00-overview/team-sharing-security.md) |
| Claude에게 일을 시킬 때 | [CLAUDE.md](CLAUDE.md) — 처음 세션이면 이름·역할부터 묻는다 |
| 이 시스템을 처음 쓰는 법 | [GETTING_STARTED.md](GETTING_STARTED.md) |

---

## 1. 전체 그림 — 개인 프로젝트에서 팀 프로젝트로

```mermaid
flowchart LR
    V1["V1 개인 프로젝트<br/>7단계 워크 프로세스<br/>세컨드 브레인 · 발표 준비"] -->|"승격 · 복사 + 출처 표시"| V2["V2 이 레포<br/>팀 프로젝트 (대회)"]
    CM["코딩마라톤 루틴<br/>의도명세 → EARS → 계획 → 작업"] -->|"7단계 안에 합침"| V2
    V2 -->|"대회 시연<br/>서버 없이 가상 데이터"| D["대회"]
    V2 -.->|"대회 후"| V3["개인 작업으로 복귀<br/>소유·라이선스 미정"]
    V1 -.->|"이력 · 개인 기록 · 계정 사실은<br/>가져가지 않음"| X(("V1에 남음"))

    classDef done fill:#E1F5EE,stroke:#0F6E56,color:#085041
    classDef open fill:#FFF3D6,stroke:#8A5A00,color:#5C3B00
    class V1,CM,V2 done
    class V3,D open
```

---

## 2. 제품이 하는 일 — 사용자가 한 번 쓰면 일어나는 일

Navigator는 사용자의 프로그램을 **직접 만들지 않는다.** 안내하고, 사용자가 쓰는 AI 코딩 도구로 넘겨 준다.

```mermaid
sequenceDiagram
    actor U as 사용자
    participant UI as Navigator UI
    participant C as Claude (워크 프로세스)
    participant T as AI 코딩 도구
    participant K as 지식 창고

    U->>UI: 만들고 싶은 프로그램 설명
    UI->>C: 작업 내용 전달
    C-->>UI: 지금 몇 단계 · 어디까지 해야 하나 · 다음 할 일
    loop 설계도 (명세 · 계획 · 설계서)
        C-->>UI: 초안
        U->>UI: 수정 · 작성
        UI->>C: 수정본
        C-->>UI: 리뷰 · 안내
    end
    C-->>T: 결정한 내용을 정리해 넘김 (실행)
    T-->>U: 사용자가 코드를 만든다
    C-->>UI: 게이트 — 다이어그램을 보이며 이해하셨나요?
    U->>UI: 예 또는 아니요
    UI->>K: 단계 기록 · 결정 · 이해 확인 결과
    K-->>UI: 역량 · 노력 기록, 한곳에서 보기
```

---

## 3. 워크 프로세스 — 7단계에 코딩마라톤 루틴을 합친 하나의 흐름

```mermaid
flowchart LR
    S0["0 원문제<br/>등급 정하기"] --> S1["1 문제 저장<br/>의도명세"]
    S1 --> S2["2 문제 분석<br/>EARS · 숫자 · 우선순위"]
    S2 --> S3["3 패턴 분석<br/>계획 · 설계서 · ADR"]
    S3 --> S4["4 패턴 구현<br/>스켈레톤 · 작업 분해"]
    S4 --> S5["5 구현<br/>테스트 먼저 · 수용 테스트"]
    S5 --> S6["6 서비스<br/>검증 기록"]
    S6 --> S7["7 유지보수<br/>회고 · 반영"]
    S7 --> KB[("지식 창고<br/>역량 · 노력")]
    KB -.->|"다음 프로젝트의 조언"| S0
```

| 단계 | 하는 일 | 나가는 것 |
|---|---|---|
| 0 원문제 | 문제·원하는 결과·적용 대상을 묻고 **규모(즉시/Lite/Xpress/Full)** 를 정한다 | 한 문장 정의, 등급 |
| 1 문제 저장 | 되묻기로 필드를 채운다 | 의도명세 캔버스, 문제 필드 |
| 2 문제 분석 | 요구 수집 → EARS → **모호한 말을 숫자로** → 우선순위 → 출처 추적 | 확정 요구 목록, 수용 테스트 명세 |
| 3 패턴 분석 | 후보 구조 → 대안 비교 → 결정 기록 | 계획, 설계서, ADR |
| 4 패턴 구현 | 가장 얇은 end-to-end 흐름을 연결, 작업 분해 | 최소 흐름, 작업 목록 |
| 5 구현 | 테스트 먼저, 수용 테스트 실행 | 통과한 코드 |
| 6 서비스 | 목표 수치를 실제로 재서 기록 | 검증 기록(고친 결함·못 한 것) |
| 7 유지보수 | 회고, 근본 원인 → 지식 창고 반영 | 역량·노력 기록 갱신 |

### 게이트 — 단계 사이마다 일어나는 일

완료 기준 충족(Claude 리뷰) **그리고** 사용자의 이해 "예"가 모두 있어야 다음 단계로 간다. "아니요"가 계속되면 막히지 않게 Hold를 고르고 해제 조건을 적는다.

```mermaid
flowchart TB
    A["단계 산출물 완성"] --> B{"Claude 리뷰<br/>완료 기준 충족?"}
    B -->|"아니요"| R["Recycle · 보완"]
    R --> A
    B -->|"예"| C["이번 단계 작업을<br/>다이어그램으로 보여 줌"]
    C --> D{"이해하셨나요?"}
    D -->|"예"| E["다음 할 일 정리<br/>우선순위는 사용자가 정함"]
    E --> G["Go · 다음 단계"]
    D -->|"아니요"| F["어디가 어려운지 확인"]
    F --> H["질문 받기 · 답하기"]
    H --> I["이 게이트 작업 요약 계획서 확인"]
    I --> D
    D -.->|"반복이 길어지면"| HD["Hold · 해제 조건 적기"]
```

---

## 4. 한곳에서 보기 — 알림

진행 상황, 내가 할 일, 다른 프로젝트·일정 충돌, Claude 토큰 사용을 한 화면에서 본다. **대회 시연에서는 가상 숫자**로 보여 준다.

```mermaid
flowchart LR
    P["진행 상황<br/>지금 단계 · 어디까지"] --> V["한곳에서 보기"]
    T["내가 할 일<br/>게이트에서 정리한 다음 할 일"] --> V
    S["다른 프로젝트 · 일정<br/>충돌 확인"] --> V
    K["Claude 토큰 사용"] -.-> V
    W["Claude에서 한 작업<br/>알림으로 기록 · 끝남 표시"] -.-> V
    V --> N["다음에 뭘 할지<br/>놓치지 않게"]
```

점선은 데이터원이 아직 확인되지 않은 것(토큰 사용량, Claude 작업 이벤트)이다 — 시연은 시뮬레이션, 실제 연동은 후속.

---

## 5. 공유와 보안 — 내 글이 누구에게 어떻게 보이는가

개인용일 때는 나만 읽었다. 팀이 되면 같은 글이 *읽는 사람이 있는 글*이 된다. 기본값은 **나만 보기**이고, 팀에 보이는 것은 규칙을 거친 공유본뿐이다.

```mermaid
flowchart LR
    W["내 원문<br/>나만 봄"] --> S{"공유 전 점검"}
    S -->|"키 · 토큰 · 비밀번호"| X["공유 불가"]
    S -->|"개인 서술 · 팀원 언급"| C["올리는 사람이<br/>한 번 더 확인"]
    S -->|"깨끗함"| L{"범위 선택"}
    C --> L
    L -->|"나만"| P["본인만"]
    L -->|"요약만"| M["요약만 보임<br/>원문은 새지 않음"]
    L -->|"팀 전체"| T["팀원에게 보임<br/>이메일 · 전화 · IP는 가림"]
    M --> R["받은 사람은<br/>다시 공유 못 함"]
    T --> R

    classDef stop fill:#FDEAEA,stroke:#A32D2D,color:#791F1F
    classDef ok fill:#E1F5EE,stroke:#0F6E56,color:#085041
    classDef ask fill:#FFF3D6,stroke:#8A5A00,color:#5C3B00
    class X stop
    class P,M,T,R ok
    class C ask
```

직접 써 볼 수 있다 — 서버 없이 브라우저로 연다. 가상 데이터만 쓴다.

```bash
open implementations/share-prototype/index.html
node --test implementations/share-prototype
```

---

## 6. 팀이 일하는 방식

```mermaid
flowchart TB
    subgraph TEAM["역할 — TEAM.md"]
        L["이재엽 · 총괄<br/>백엔드 · AI 에이전트"]
        D["고한결 · UI/UX · 인터뷰"]
        F["임유정 · 프론트엔드"]
        Q["두승현 · 테스트 · 검증 · 문서"]
    end
    L -->|"직접 푸시"| M["main"]
    D -->|"직접 푸시"| M
    F -->|"직접 푸시"| M
    Q -->|"직접 푸시"| M
    CL["Claude"] -->|"브랜치에만 푸시"| B["브랜치 · PR"]
    B -->|"병합은 사람이 한다"| M
    CL -.->|"훅이 막음<br/>main push · commit · 병합"| M

    classDef c fill:#EEEDFE,stroke:#534AB7,color:#3C3489
    class CL,B c
```

- **사람은 `main`에 직접 커밋·푸시한다. Claude는 `main`에 올리지 않는다** — `.claude/hooks/block-claude-main.sh`가 Claude의 명령만 막는다.
- 새 Claude가 이 레포를 처음 열면 **이름을 묻고 TEAM.md에서 역할을 찾아** 부여한다([CLAUDE.md](CLAUDE.md)).
- 작업물은 담당자가 만들고 Claude는 질문·리뷰·힌트를 준다. 단 세컨드 브레인 코드는 Claude가 짠다.
- 비밀값·서버 주소·인터뷰 응답자 이름은 올리지 않는다. 훅이 한 번 더 막는다.

---

## 7. 레포 구조

```
Final-Proj/
├── README.md · CLAUDE.md · TEAM.md · GETTING_STARTED.md
├── docs/
│   ├── 00-overview/      요구사항 · 기획안 · 이전 기록 · 게이트 · 등급 · 공유·보안
│   ├── 01~07-*/          7단계 방법론 문서 (템플릿 · 예시)
│   ├── catalog/          체크리스트 · 외부 도구 · 후보 장부
│   └── ACKNOWLEDGEMENTS.md   도와준 사람들 (이름은 이재엽이 채움)
├── .claude/              규칙 10 · 훅 9 · 스킬 · 에이전트 · settings.json
├── implementations/
│   ├── run_all_tests.py  전체 테스트
│   └── share-prototype/  공유 규칙 시험 화면 (서버 없음)
└── projects/second-brain/   지식 창고 + 마감 알림 (V1에서 이어 마무리)
```

---

## 8. 지금 어디까지 왔나

```mermaid
flowchart LR
    A["기획안 수정"] --> B["요구사항 12개"]
    B --> C["V1 워크 프로세스 이전"]
    C --> D["공유 시험 화면"]
    D --> E["2단계 마무리<br/>우선순위 · 숫자 · 추적표"]
    E --> F["시연 화면<br/>단계 안내 · 게이트 · 한곳에서 보기"]
    F --> G["세컨드 브레인 마무리<br/>5 → 6 → 7단계"]

    classDef done fill:#E1F5EE,stroke:#0F6E56,color:#085041
    classDef now fill:#FFF3D6,stroke:#8A5A00,color:#5C3B00
    class A,B,C,D done
    class E now
```

| 항목 | 상태 |
|---|---|
| 기획안·요구사항 | 초안 완료 — PR #1 병합 |
| V1 워크 프로세스·세컨드 브레인 이전 | 완료 — PR #2 병합 |
| 공유 규칙 시험 화면 | 완료 — 시나리오 10개, 테스트 17개 |
| **우리 작업의 위치** | **2단계 중간** — EARS 요구는 있고, 숫자 확정·우선순위·출처 추적표·유스케이스가 없다 |
| Navigator UI (시연 화면) | **아직 없음** — 미리 만든 응답으로 움직이게 만들 예정 |
| 세컨드 브레인 | 4→5단계 Go까지(V1). 5·6·7단계 남음, 데이터 저장 구조 결정 필요 |

### 정해야 할 것

| 칸 | 누가 |
|---|---|
| "Claude에서 작업하면 알림으로 끝남 표시"(FR-7)의 해석이 맞는가 | 이재엽 |
| "예"를 못 받는 사용자가 막히지 않게 하는 길 — Hold + 해제 조건 | 이재엽 |
| 7단계 "반영"의 범위 — 지식 창고만인가, 체크리스트까지인가 | 이재엽 |
| 역량·노력 기록의 항목과 단위 | 이재엽 + 고한결(인터뷰 뒤) |
| **라이선스·대회 후 소유** | 이재엽 + **팀원 동의** + 대회 규정 |
| 도와준 사람 명단 | 이재엽(추후) |

---

## 9. 시작하기

```bash
git clone https://github.com/2026-Codyssey-Final-Proj/Final-Proj.git
cd Final-Proj
python3 implementations/run_all_tests.py        # 전체 테스트
node --test implementations/share-prototype     # 공유 규칙 시험
```

Claude Code를 열면 이름과 역할을 묻는다. 대답하면 `.claude/identity.local.md`(커밋되지 않음)가 만들어지고, 그 뒤 역할에 맞게 돕는다.
