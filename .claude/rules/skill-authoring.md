# 스킬 작성 규칙 — Agent Skills 명세

`.claude/skills/**`에 스킬을 새로 만들거나 고칠 때만 읽으세요.

이 워크스페이스의 스킬은 **[Agent Skills 명세](https://agentskills.io/specification)**를
따른다(사용자 채택, 2026-09-30 — 판정 기록은
[external-tools.md](../../01-docs/catalog/external-tools.md)). Anthropic이 만들고 여러 AI
도구가 함께 쓰는 공개 형식이라, 여기서 만든 스킬을 다른 도구에서도 그대로 읽을 수 있다.

## 반드시 지킬 것 (어기면 `check-skills.sh` 훅이 막는다)

1. 스킬은 폴더 하나이고, 그 안에 `SKILL.md`가 있다. `SKILL.md`는 YAML 머리말로 시작한다.
2. `name`은 소문자·숫자·하이픈 1~64자, 하이픈으로 시작·끝나거나 연속되면 안 되고,
   **폴더 이름과 같아야 한다**.
3. `description`은 1~1024자. **무엇을 하는지와 언제 쓰는지**를 둘 다 쓰고, 사용자가 실제로
   할 말(트리거 문구)을 넣는다 — 모든 스킬의 이름과 설명은 항상 불러와져 있고, Claude는
   이것만 보고 스킬을 쓸지 정한다.
4. `compatibility`를 쓰면 1~500자. 명세 필드는 `name`, `description`, `license`,
   `compatibility`, `metadata`, `allowed-tools`뿐이다 — 그 밖의 필드는 경고로 알린다.

## 권장 (경고만 한다)

- **세 단계로 나눠 불러오기를 활용한다.** 이름·설명(항상) → `SKILL.md` 본문(스킬을 쓸 때,
  500줄·약 5,000토큰 이하) → `scripts/`·`references/`·`assets/`(필요할 때만).
  `dev-workflow`의 SKILL.md(트리거)와 PROCEDURE.md(절차) 분리가 이 원칙의 적용 사례다.
- 파일 참조는 `SKILL.md`에서 한 단계 깊이까지만 한다.
- 폴더 관례: 실행 코드는 `scripts/`, 필요할 때 읽는 문서는 `references/`, 템플릿·데이터는
  `assets/`.

## 외부에서 가져온 스킬

`frontend-design`, `theme-factory`, `canvas-design`, `mcp-builder`는 anthropics/skills에서,
`karpathy-guidelines`는 multica-ai/andrej-karpathy-skills에서, `ponytail-review`는 dietrichgebert/ponytail에서
그대로 복사했다 — 출처·커밋·라이선스는 [VENDORED.md](../skills/VENDORED.md). **직접 고치지
않고**, 우리 식 사용 규칙은 아래와 `CLAUDE.md`에 적는다.

- **디자인 스킬끼리 겹칠 때:** claude.ai 아티팩트로 내보내는 페이지는 `artifact-design`의
  약속(제목, 색 토큰, 다크 모드, 휴대폰 폭)을 먼저 지키고, `frontend-design`은 그 안에서
  미적 방향을 정하는 데 쓴다. 발표 자료·문서의 색과 글꼴은 `theme-factory`의 테마에서 고른다
  (그 스킬 절차대로 사용자가 테마를 고른 뒤에만 적용).
- **`canvas-design`이 만드는 파일**(.png/.pdf/.md)은 요청한 프로젝트 폴더
  `05-projects/<슬러그>/assets/`에 저장한다. 저장소 루트나 스킬 폴더에 두지 않는다.
- **디자인 결과물은 사용자의 작업물이다.** 발표 자료, 과제 결과물, 화면 디자인은 사용자가
  그 자리에서 요청할 때만 만들고 `claude-drafted` 표시를 남긴다([review-mode.md](review-mode.md)).
  디자인 **리뷰**(대비, 위계, 일관성 지적)는 언제든 한다.
- **`karpathy-guidelines`는 코드 변경 리뷰의 기준으로 쓴다**(사용자 결정 2026-10-01). 원문은 Claude가
  코드를 직접 쓰는 상황을 전제하지만, 이 워크스페이스에서는 코드를 사용자가 쓰므로 2번(단순하게)과
  3번(필요한 곳만 고치기)을 사용자 코드를 볼 때의 **보완** 근거로 쓴다(DoD가 아니라 막힘은 아니다).
  사용자가 "써줘"라고 하거나 프로젝트가 코드를 Claude에게 맡겼을 때(세컨드 브레인)는 Claude가 4개 원칙을
  그대로 따르고, PR을 열기 전에 이 원칙으로 스스로 검수한 결과를 PR 본문에 적는다. 원문 README의 설치 방법 B
  (`CLAUDE.md`에 덧붙이기)는 쓰지 않는다 — 외부 도구가 우리 기준 파일을 고치는 것이다
  ([external-integration.md](external-integration.md) 2번).
- **`ponytail-review`는 karpathy-guidelines 2번(단순하게)을 지적하는 형식이다**(사용자 결정 2026-10-01).
  한 줄에 지적 하나(`L<줄>: delete:/stdlib:/native:/yagni:/shrink: …`)와 마지막 `net: -N lines`로 쓴다.
  세컨드 브레인 코드 PR의 자체 검수에서 이 결과를 PR 본문에 붙인다. 이 스킬은 과잉 설계만 보므로
  정확성·보안·테스트는 karpathy-guidelines와 code.md(TDD)로 따로 본다. **ponytail 플러그인
  전체(훅 3개, 나머지 스킬)는 들이지 않았다** — 모든 프로젝트에 세션마다 규칙을 주입하고, "묻지 말고 먼저
  만든다"·"확인 하나면 충분"이 우리 질문 규칙·TDD와 정반대라서다(external-tools.md).
- **Emil Kowalski 스킬은 화면의 움직임·마감을 리뷰할 때 쓴다**(이재엽 결정 2026-10-14). `review-animations`(모션 코드 리뷰),
  `improve-animations`·`find-animation-opportunities`(읽기 전용 점검 — 코드를 고치지 않고 계획·제안만),
  `break-ui`(긴 이름·빈 목록 같은 최악 데이터로 시험), `animation-vocabulary`(움직임을 정확한 용어로 말하기),
  `emil-design-eng`(판단 기준). 리뷰 모드와 같은 방향이라 그대로 쓴다. **움직임을 직접 만들어 주는 스킬은 들이지 않았다** —
  디자인 결과물은 사용자의 작업물이므로 "써줘"라고 할 때만 Claude가 쓴다. `frontend-design`과 겹치면: 전체 미적 방향은
  `frontend-design`, 움직임·마감 점검은 Emil 스킬. 원본 README의 `npx skills add`는 쓰지 않는다(무엇을 쓰는지 문서에 없음).
  `emil-design-eng`는 674줄·`review-animations`는 명세 밖 필드가 있어 `check-skills.sh` 경고가 나지만 원본을 고치지 않는다.
- **`impeccable-review`는 만든 화면을 점검할 때 쓴다**(이재엽 결정 2026-10-14). 원본 스킬은 첫 단계가 내려받은 실행 파일을 돌려서
  들이지 않고, **참고 마크다운(`reference/`)만 복사하고 `SKILL.md`는 우리가 새로 썼다.** 이 스킬은 원본을 "그대로 복사"하는
  다른 외부 스킬과 달리 안내문이 우리 것이다. 실행 파일(`scripts/impeccable`)·`npx impeccable`·훅·`live`는 실행하지 않는다.
  디자인 결과물은 사용자의 작업물이라 **지적·제안만 하고 "써줘"라고 할 때만 고친다.** 역할 분담은 `frontend-design`(미적 방향) /
  `impeccable-review`(점검) / Emil 스킬(움직임·마감).
- **`tdd`는 테스트를 먼저 쓰는 코드 작업에서 쓴다**(이재엽 결정 2026-10-14). 코드를 Claude에게 맡긴 프로젝트(세컨드 브레인)에서는
  Claude가 이 스킬의 루프를 따르고, 이재엽이 코드를 쓰는 곳에서는 **변경 리뷰의 렌즈**(경계에서 테스트하는가, 구현에 묶인 테스트·
  같은 값을 되풀이하는 단언이 없는가)로만 쓴다. 원본과 우리 규칙의 차이: ① 원본은 "리팩터링은 루프 밖(리뷰 단계)"인데
  [code.md](code.md)는 Red-Green-Refactor라 **우리 규칙이 우선**이다(리팩터링을 루프 끝에서 한다).
  ② 원본이 부르는 `codebase-design`·`code-review` 스킬과 `GLOSSARY.md`는 우리에 없으므로 부르지 않고, 용어는 해당 프로젝트
  문서·ADR을 읽는다. ③ 테스트 경계를 사용자와 먼저 합의하라는 원본 문구는 [review-mode.md](review-mode.md)와 같은 방향이라 그대로 따른다.
- **`owasp-security`는 보안 점검과 변경 리뷰에서 쓴다**(이재엽 결정 2026-10-15). [security-records.md](security-records.md) 6-4의
  "Top 10 + ASVS 둘 다"를 코드에 대어 보는 용도다. 사용 규칙: ① 스킬 안의 **ASVS 장 번호·항목은 요약일 뿐이다 — 쓸 때 원문을
  열어 확인한다**(6-4가 이미 정한 규칙이고, 표준 버전이 바뀐다). ② `reference/`(약 2,200줄)는 필요한 부분만 읽는다 — SKILL.md의
  안내대로 언어 절·해당 항목만. ③ **출처가 개인 한 명이므로**(미확인 출처) 점검 결과를 그대로 믿지 않고 지적마다 근거 항목을
  붙이게 하며, "문제 없음"을 안전 보증으로 쓰지 않는다. ④ 지적만 하고 **코드를 고치지 않는다** — 고치는 일은 이재엽이 "써줘"라고 할
  때 또는 코드를 Claude에게 맡긴 프로젝트(세컨드 브레인)에서만 한다. ⑤ `allowed-tools`가 선언돼 있지 않아 도구 제한이 없으므로,
  이 스킬로 점검할 때도 우리 쓰기 금지·외부 전송 금지 규칙이 그대로 적용된다.
- **`mcp-builder/scripts/evaluation.py`는 Anthropic API를 직접 호출한다**(API 키 필요, 호출마다
  요금). 사용자가 그 자리에서 명시적으로 동의하기 전에는 실행하지 않는다.

## 스킬을 만들거나 고친 뒤

- 검증: `bash .claude/hooks/check-skills.sh` (훅이 `SKILL.md` 편집 뒤 자동으로도 돌린다).
- **자연어 트리거가 실제로 반응하는지는 이 검증이 확인하지 않는다.** 형식만 본다. 트리거
  평가는 `skill-creator` 스킬의 평가 기능으로 한다 — 쓰기 전에 명령 4(외부 통합 분석)를
  거친다.
  다만 **skill-creator의 평가 숫자는 실제보다 낮게 나올 수 있다** — 설명을 임시 명령 파일로 만들어 재기
  때문이다(`reference-library`: 도구는 반응 비율 0~17%, 같은 스킬을 설치한 사본에서는 반응해야 할 10개 중
  9개 통과). 그래서 **스킬이 설치된 워크스페이스 사본**에서 질문(반응해야 할 10개 + 비슷하지만 반응하면
  안 되는 10개)을 `claude -p`로 보내 첫 동작이 그 스킬 호출인지로 센다. 스킬 한 건 기준이다.
- 이 워크스페이스에서는 스킬도 작업물이다 — 사용자가 쓰고 Claude는 리뷰한다
  ([review-mode.md](review-mode.md)). 이 파일과 검증 스크립트 같은 메커니즘만 Claude가 고친다.
