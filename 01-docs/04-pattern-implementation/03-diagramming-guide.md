# 패턴을 다이어그램으로 구상하는 법 — 어떤 걸 고를지

패턴 구현(4단계)에서 코드를 짜기 전에 구조를 그려보고 싶을 때, "뭘 그릴지" 고르는
기준은 하나입니다: **어떤 질문에 답하고 싶은가.** 다이어그램 종류마다 답하는 질문이
다르고, 질문에 안 맞는 다이어그램을 고르면 오히려 헷갈립니다.

## 핵심 기준: 질문 → 다이어그램

| 답하고 싶은 질문 | 다이어그램 | 표준/출처 |
|---|---|---|
| 로직이 어떤 순서로 갈라지는가 (분기·반복) | **순서도 (Flowchart)** | ISO 5807 |
| 무엇으로 이루어져 있는가 (정적 구조) | **구조 다이어그램** (클래스/컴포넌트) | UML Structure Diagrams |
| 컴포넌트들이 어떤 순서로 상호작용하는가 (동적 흐름) | **행동 다이어그램** (시퀀스/액티비티) | UML Behavior Diagrams |
| 같은 아키텍처를 청중마다 어느 줌 레벨로 보여줄까 | **C4 모델** (Context/Container/Component/Code) | Simon Brown |
| 데이터가 어떻게 저장되고 서로 연결되는가 (데이터 구조) | **ERD (엔티티 관계 다이어그램)** — 개념 → 논리 → 물리로 정제 | ER (Chen/Crow's Foot) |
| 데이터가 어디서 와서 어디로 가는가, 밖으로 나가는 곳은 어디인가 (데이터 흐름) | **DFD (데이터 흐름도)** | Gane-Sarson / Yourdon-DeMarco |

UML은 이 표의 2·3번을 "정적 구조(What) vs 동적 행동(How)"로 크게 나눕니다 —
구조 다이어그램부터 시스템을 정의하고, 그 위에 행동 다이어그램으로 상호작용을
덧붙이는 순서를 권장합니다.

## 알고리즘 트랙

- **순서도 (ISO 5807)**: 분기·반복이 있는 로직(예: 이중 루프 브루트포스 vs 해시맵
  탐색)을 그릴 때 기본값. `if 조건 → 분기`, `while 반복 → 루프` 기호가 표준화돼 있어서
  다른 사람도 바로 읽을 수 있습니다.
- **재귀 트리 / 호출 그래프**: [3단계](../03-pattern-analysis/01-algorithm-paradigms.md)의
  분할정복·백트래킹처럼 재귀 구조인 패턴은 순서도보다 재귀 트리가 훨씬 직관적입니다
  (표준 규격은 아니지만 알고리즘 교재에서 관례적으로 씀).

## 프로젝트 트랙

**질문이 "청중마다 얼마나 자세히 보여줄까"라면 C4 모델부터 고릅니다.** Simon Brown이
제안한 4단계 줌 레벨:

| 레벨 | 보여주는 것 | 이 저장소에 적용하면 |
|---|---|---|
| Context | 전체 시스템이 외부와 어떻게 연결되는가 | "사용자 ↔ dev-workflow 시스템 ↔ GitHub" |
| Container | 배포/실행 단위 | `01-docs/`(파일 저장소) + `.claude/skills/dev-workflow/`(스킬) — [ADR-0001](../03-pattern-analysis/adr/0001-storage-and-interface.md)의 하이브리드가 정확히 이 레벨 |
| Component | 컨테이너 내부 구성 요소 | SKILL.md의 명령 1/2/3 |
| Code | 클래스/함수 수준 | 실제 구현 코드가 생기면 (UML 클래스 다이어그램과 동일 레벨) |

**질문이 "이게 뭘로 이루어져 있나(구조)" vs "어떻게 동작하나(행동)"라면 UML 분류를
씁니다**:
- 구조: 클래스/컴포넌트 다이어그램
- 행동: 시퀀스(시간순 상호작용)/액티비티(작업 흐름)/상태(State Machine)

## 이미 이 저장소에서 쓴 다이어그램을 이 기준으로 분류하면

| 위치 | 실제로는 |
|---|---|
| [00-overview 전체 방향 다이어그램](../00-overview/README.md) | Activity Diagram(작업 흐름)에 가까움 — mermaid flowchart 문법으로 그림 |
| [00-overview 유즈케이스 다이어그램](../00-overview/README.md) | UML Use Case Diagram (행동) |
| [03-pattern-analysis 파이프라인 다이어그램](../03-pattern-analysis/README.md) | Activity Diagram |

즉 지금까지는 "행동(어떻게 흘러가는가)" 계열만 썼고, **"구조(무엇으로 이루어져
있는가)" 계열(클래스/컴포넌트/C4 Container)은 아직 하나도 안 그렸습니다** — 이게
4~5단계에서 실제 코드/스킬 구조를 잡을 때 다음으로 채울 빈틈입니다.

**"데이터" 계열(ERD·DFD)도 아직 없습니다.** 다만 [기록·보안 기준](../../.claude/rules/security-records.md) 3절 "밖으로
나가는 것" 표가 이미 **글로 쓴 데이터 흐름도**입니다 — 무엇이 어디로 나가는지를 그림으로 볼 때 DFD로 옮기면 됩니다.
ERD는 DB(테이블)를 쓰는 프로젝트가 생길 때 필요합니다(지금 세컨드 브레인은 마크다운 파일이라 해당 없음).

## 결정 절차

```
1. "로직 분기/반복을 보여주고 싶다" → 순서도 (알고리즘 트랙)
2. "재귀/분할정복 구조를 보여주고 싶다" → 재귀 트리
3. "청중마다 다른 확대 수준으로 보여주고 싶다" → C4 (프로젝트 트랙)
4. "정적 구조(뭐로 이루어졌나)를 보여주고 싶다" → UML 구조 다이어그램(클래스/컴포넌트)
5. "동적 흐름(어떻게 상호작용하나)을 보여주고 싶다" → UML 행동 다이어그램(시퀀스/액티비티/상태)
6. "데이터가 어떻게 저장·연결되나" → ERD (개념 → 논리 → 물리)
7. "데이터가 어디서 어디로 가나, 밖으로 나가나" → DFD
```

## 도구 환경 — 원천은 하나, 나머지는 거기서 파생

위 절차가 **어떤 그림을 그릴지**라면, 이 절은 **어떤 도구로 그리고 어디에 둘지**다. 도구가
여럿이라 그림마다 도구가 제각각이면 관리가 안 되므로, 사용자가 정한 기준(2026-09-30):
**원천은 저장소 안의 Mermaid 텍스트 하나로 두고, 나머지는 거기서 파생한다.**

| 쓰는 곳 | 도구 | 원천·저장 | 비고 |
|---|---|---|---|
| 저장소 문서 (README, 세션 파일, 방법론) | **Mermaid** (GitHub이 그림으로 바꿔 줌) | ` ```mermaid ` 블록이 곧 원천 | `check-mermaid.sh` 훅이 문법을 검사한다 |
| 직접 그리고 고치는 그림 | **draw.io** (프로젝트 MCP `drawio`, 로컬 실행) | Mermaid를 `open_drawio_mermaid`로 불러와 편집 → `.drawio` 파일을 그 프로젝트 폴더에 저장 | 그림은 URL `#` 뒤에 실려 외부로 나가지 않는다. `set_page`는 로컬 `.drawio` 파일을 덮어쓰므로 사용자가 요청할 때만 쓴다 |
| 이미지(PNG·SVG)가 필요할 때 | **mermaid-cli** (로컬) | 이미지는 파생물 — 원천 텍스트와 같은 폴더에 둔다 | 그림을 공개 서버로 보내는 변환 도구(Kroki)는 쓰지 않는다 — 사용자 결정 2026-10-01. Mermaid로 안 되는 종류는 draw.io로 그린다 |
| 대화 안에서 설명할 때 | 대화 안 그림(SVG) | 저장하지 않음 | 남길 가치가 있으면 Mermaid로 옮겨 저장소에 넣는다 |

### 사용자가 다이어그램을 넣어 주면 — Claude가 먼저 고민하는 순서

1. **무슨 질문에 답하는 그림인가** — 위 "결정 절차"로 종류를 정한다(행동 계열인지 구조 계열인지).
2. **Mermaid로 원천을 만들 수 있는가** — 되면 Mermaid로 옮긴다. 안 되는 종류면 그 이유와 대신 쓸
   원천 형식(draw.io XML, PlantUML 등)을 말한다.
3. **어디에 둘 그림인가** — 프로젝트의 것이면 `05-projects/<슬러그>/` 아래, 방법론이면 `01-docs/` 아래.
4. **검증** — Mermaid면 훅이 문법을 본다. **배치(순서가 뒤집히는 등)는 훅이 못 본다** — 그려진 그림을
   한 번 눈으로 확인한다(2026-09-30 세컨드 브레인 README에서 되돌아가는 화살표 때문에 7단계가
   맨 위로 올라간 사례).
5. **파생** — 사용자가 직접 고쳐야 하면 draw.io로, 이미지가 필요하면 mermaid-cli로.

사용자가 넣어 준 그림 자체는 작업물이다 — 옮기거나 고치는 것은 사용자가 요청할 때만 하고, 먼저 위
순서로 **어떻게 만들지 제안**한다([review-mode.md](../../.claude/rules/review-mode.md)).

## 출처
- [ISO 5807:1985 - Information processing, flowchart symbols](https://www.iso.org/standard/11955.html)
- [Home - C4 model, Simon Brown](https://c4model.com/)
- ERD·DFD 줄: 코딩마라톤 가이드의 UML 다이어그램 목록(ER Chen/Crow's Foot, DFD Gane-Sarson/Yourdon-DeMarco 표기)과 [강의 자료 6 — 데이터베이스](../../05-projects/second-brain/docs/references/coding-marathon.md)(후보 장부 W-21, 사용자 채택 2026-10-08). 표준 원문은 쓸 때 열어 확인한다
- [UML - Behavioral Diagram vs Structural Diagram - Visual Paradigm](https://www.visual-paradigm.com/guide/uml-unified-modeling-language/behavior-vs-structural-diagram/)
- [draw.io MCP server (jgraph/drawio-mcp)](https://github.com/jgraph/drawio-mcp) — 데이터 경로("Does your diagram leave the machine?")
- [mermaid-cli](https://github.com/mermaid-js/mermaid-cli)
