---
paths:
  - "02-frontend/**"
  - "03-backend/**"
  - "04-tests/**"
  - "05-projects/*/implementations/**"
---

# 코드 작업 규칙 (frontend · backend · tests)

`02-frontend/**`·`03-backend/**`·`04-tests/**` 또는 `05-projects/*/implementations/**` 아래 코드를 새로 쓰거나 고칠 때만 읽으세요.

## 반드시 지킬 것

1. **TDD Red-Green-Refactor** — 알고리즘 트랙은 "브루트포스로 먼저 정답 확인
   (Red 없어도 됨) → 최적화(Refactor 자리)"로 변형해서 적용한다
   (`01-docs/05-implementation/01-tdd-red-green-refactor.md`).
2. **벤치마크의 "최악 케이스"는 반드시 실행해서 확인한다.** 논리적으로
   최악처럼 보이는 입력이 실제로는 더 빨리 끝나는 경우가 있었다(Two Sum
   회고). 작은 크기 여러 개에서 추세(2배씩 늘렸을 때 몇 배씩 느는지)를 먼저
   확인한 뒤 제약조건 상한에서 측정한다.
3. **새 파일명 관례를 쓰는 트랙/프로젝트를 추가하면
   `04-tests/run_all_tests.py`가 그 관례도 자동으로 찾는지 확인한다**
   — `test_*.py` 글롭으로 이미 일반화돼 있지만, 새 규칙을 또 만들면 다시
   깨질 수 있다.
4. **저장소 자신의 상태(테스트 스위트, 파일 트리, git 이력)를 다루는 도구를
   만들 때는 그 도구 자신이 discovery 대상이 되어 자기 참조·무한 재귀를
   일으킬 수 있는지 먼저 따진다** (진행상황 대시보드 생성기 사례,
   `01-docs/catalog/checklist.md`의 "자기 참조 도구 체크리스트" 참고). 의존성
   주입으로 실제 파일시스템/재귀 경로를 피하고, 테스트는 격리해서 짠다.
5. 코드를 고친 뒤에는 **전체 테스트를 한 번에 돌려서** 다른 항목이 안 깨졌는지
   확인한다:

   ```bash
   python3 04-tests/run_all_tests.py
   ```

   출력이 길면 `verify` 서브에이전트에게 위임하고 요약만 받는다
   (`.claude/agents/verify.md`).
6. **아키텍처 규칙은 사람 기억이 아니라 도구로 강제한다.** "외부 API·LLM은 한 모듈에서만 부른다",
   "이 접두어 밖의 테이블은 건드리지 않는다" 같은 규칙을 정했으면 린트 규칙(예: ESLint `no-restricted-imports`)이나
   테스트로 막는다 (출처: Intent-Specify(코딩마라톤 팀 과제, 사용자 채택 2026-10-04), llm-contract.md·plan.md P4·P8). 워크스페이스 규칙을 훅으로 강제하는 것과 같은 생각이다.
7. <!-- claude-drafted: 2026-10-21 --> **Claude가 쓴 코드는 쓴 대화가 아닌 새 맥락에서 리뷰한다.** 사용자가 "써줘"라고 했거나
   프로젝트가 코드를 Claude에게 맡겼을 때(세컨드 브레인 등), PR을 열기 전에 대화 기록을 물려받지 않는 서브에이전트에게
   **요구(요구서 · 넘김 문서의 해당 줄)와 바뀐 코드(diff)만** 주고 리뷰를 맡긴다. 순서는 ① 요구에 맞나 ② 품질(karpathy 4원칙 ·
   ponytail 형식). 받은 지적과 고친 것을 PR 본문에 적는다. 쓴 대화 안의 자체 점검은 그 앞에 해도 되지만 이것을 대신하지 않는다 —
   왜 그렇게 썼는지 아는 쪽은 빠진 것을 당연하게 넘긴다. `verify` 에이전트는 시험 · 링크만 돌리므로 이 리뷰와 따로다
   (출처: [후보 장부](../../01-docs/catalog/reference-candidates.md) W-29 — 짧은 자료 promfit.ai, superpowers `subagent-driven-development`,
   ai-engineering-from-scratch 39강, 이재엽 채택 2026-10-21).

## 코드 위치 규칙

팀 제품(Floe)은 화면 `02-frontend/`, 서버·판정 규칙 `03-backend/`, 시험 `04-tests/`에 둔다.
<!-- claude-drafted: 2026-10-29 --> **섬 화면 `02-frontend/navigator/app.js`는 묶은 파일이다** — 원본은 `app/` 조각이고, 고친 뒤 `node 02-frontend/navigator/app-parts.js join`
(app.js를 직접 고쳤으면 `split`). 둘이 다르면 `app-parts.test.js`가 커밋 전 시험과 PR 검사(`.github/workflows/app-parts.yml`)에서 막고, `join`은 app.js에만 있는 고침을 덮지 않고 멈춘다. 자세히: [app/README.md](../../02-frontend/navigator/app/README.md) (이재엽 2026-10-29).
아래는 7단계 워크플로우로 푸는
알고리즘·학습 트랙 코드의 자리다(지금은 없음).

```
05-projects/<슬러그>/implementations/
  <트랙파일명>/<세션 슬러그>/
    solution.py       # 브루트포스 + 최적화 둘 다 남김
    test_solution.py  # 단위 테스트 + 경계값/차등 테스트
    benchmark.py       # 6단계 성능 실측, 선택
```
