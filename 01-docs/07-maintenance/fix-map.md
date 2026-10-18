<!-- claude-drafted: 2026-10-18 — 이재엽의 요청("다른 사람들도 이게 문제라고 하면 너가 어느 곳에 어느 곳을 고쳐야할지 알도록 해줘")으로 Claude가 썼다.
     지도는 2026-10-18 main의 파일에서만 옮겼다. 파일을 옮기거나 이름을 바꾸면 이 지도의 링크도 같이 고친다 — 링크 검사(check-links.sh)가 깨진 칸을 잡는다. -->

# 고칠 곳 지도 · 고칠 목록 — "이게 문제예요"를 받았을 때

**이재엽 결정(2026-10-18):** 게이트에서 나온 문제는 게이트를 막지 않고 이 목록에 모아 **7단계(유지보수)에서 고치며 간다.** 11/3 뒤에는 새 기능을 받지 않고 고침만 한다(schedule.md 2절).

## 0. Claude가 하는 순서 — 팀원 누구의 세션이든 같다

1. **증상을 사람 말 그대로 받는다.** 어느 화면 · 어느 주소(`#ex=1&gate` 같은 끝부분) · 무엇을 눌렀고 · 무엇이 보였나. 모르면 이것만 묻는다(한 번에 2개 이하).
2. **아래 1절 지도에서 증상에 맞는 줄을 찾는다.** "고칠 파일"을 열기 전에 "같이 볼 시험"을 먼저 연다 — 시험이 그 동작의 약속이다.
3. **2절 고칠 목록에 한 줄을 더한다**(`F-번호`). 이미 같은 줄이 있으면 새로 만들지 않고 "찾은 날"에 더한다.
4. **등급을 정한다**([scope-tiers.md](../00-overview/scope-tiers.md)): 2~5분이면 즉시처리, 한 파일 수준이면 Lite(한 줄 기록 → 고침 → 짧은 회고), 여러 파일 · 동작이 바뀌면 Xpress. 새 기능이면 11/3 뒤에는 받지 않는다 — 대회 뒤로 적는다.
5. **고친다:** 시험을 먼저 쓰고([code.md](../../.claude/rules/code.md)), 고친 뒤 `python3 04-tests/run_all_tests.py`. 브랜치에서 하고 PR을 연다(Claude는 `main`에 올리지 않는다).
6. **담당에게 알린다** — 1절의 "담당" 칸. 남의 폴더를 고치면 커밋 메시지에 무엇을 왜 적는다.
7. 같은 유형이 세 번 나오면 7단계 회고에서 [checklist.md](../catalog/checklist.md)로 올린다.

## 1. 고칠 곳 지도 — 증상 → 고칠 곳

| 이런 말을 들으면 | 영역 | 고칠 파일 | 같이 볼 시험 | 같이 고칠 문서 · 할 일 | 담당 |
|---|---|---|---|---|---|
| "단계를 잘못 알려 줘요", "다 했는데 안 했대요", "할 일 문장이 이상해요" | 판정 규칙(단계 · 완료 기준 · 등급) | [navigator.js](../../03-backend/navigator/navigator.js)(`STAGES` · `criteriaFor` · 요청문) | [navigator.test.js](../../04-tests/navigator/navigator.test.js) | 연습 예시 [scenario.js](../../03-backend/navigator/scenario.js)를 같은 순서로, **요청문이 바뀌면 녹화를 다시**([record-demo.js](../../03-backend/navigator/record-demo.js)), [판정 규칙 검토](../00-overview/navigator-prototype-rules-review.md) 7절 | 이재엽 · 두승현 |
| "연습 예시가 이상해요", "살펴보지 못했어요가 떠요(연습 모드)" | 연습 예시 · 등급별 거르기 | [scenario.js](../../03-backend/navigator/scenario.js), [tiers.js](../../03-backend/navigator/tiers.js) | [demo-flow.test.js](../../04-tests/acceptance/demo-flow.test.js), [screen-gaps.test.js](../../04-tests/navigator/screen-gaps.test.js) | — | 두승현 |
| "진짜 AI가 답을 안 해요", "토큰이 너무 들어요", "키가 안 먹어요" | AI 호출 창구 · 사용량 | [provider.js](../../03-backend/navigator/provider.js)(**외부 호출은 여기 한 곳만**), [usage.js](../../03-backend/navigator/usage.js) | [provider.test.js](../../04-tests/navigator/provider.test.js) | 실측: [live-check.js](../../03-backend/navigator/live-check.js) `--report` → `01-docs/verification/` | 이재엽 |
| "시연에서 녹화가 재생 안 돼요" | 녹화 · 재생 | [recordings/demo.json](../../03-backend/navigator/recordings/demo.json), [record-demo.js](../../03-backend/navigator/record-demo.js) | — | 요청문이 글자 하나라도 바뀌면 재생이 안 된다 — 바뀐 단계만 다시 녹화 | 이재엽 |
| "서버로 열면 화면이 깨져요", "파일이 404예요" | 서버가 내주는 파일 목록 | [server.js](../../03-backend/navigator/server.js)(`STATIC`) | [static-files.test.js](../../04-tests/navigator/static-files.test.js) | 새 파일을 화면에 넣으면 이 목록에도 | 이재엽 |
| "서버가 이상한 답을 줘요", "400/403/502가 떠요" | 로컬 API | [server.js](../../03-backend/navigator/server.js) | [api-contract.test.js](../../04-tests/navigator/api-contract.test.js) | 약속 문서 [API.md](../../03-backend/navigator/API.md)를 먼저 고치고 코드를 맞춘다 | 이재엽 · 두승현 |
| "Claude Code 알림이 안 와요", "개인 대화가 화면에 보여요" | 작업 알림 · 시연 안전장치 | [hook.js](../../03-backend/navigator/hook.js), [connect.js](../../03-backend/navigator/connect.js), [server.js](../../03-backend/navigator/server.js)(확인 값 · 가림 · 비우기) | [demo-safety.test.js](../../04-tests/navigator/demo-safety.test.js) | [backend README](../../03-backend/navigator/README.md) "시연 안전장치"(시연 전 한 줄 점검) | 두승현 |
| "글자가 어려워요", "이 말이 뭐예요" | 쉬운 말 · 용어 풀이 | [glossary.js](../../03-backend/navigator/glossary.js), [navigator.js](../../03-backend/navigator/navigator.js)(`JARGON`), [app.js](../../02-frontend/navigator/app.js) | [navigator.test.js](../../04-tests/navigator/navigator.test.js)(쉬운 말), [screen-gaps.test.js](../../04-tests/navigator/screen-gaps.test.js)(용어마다 풀이) | 인터뷰에서 멈춘 단어는 용어 목록으로(#11) | 고한결(문구) · 두승현 |
| "'예' 뒤 질문이 이상해요", "답이 미리 보여요" | 이해 확인 · 확인 질문 | [understand.js](../../03-backend/navigator/understand.js), [app.js](../../02-frontend/navigator/app.js) | [screen-gaps.test.js](../../04-tests/navigator/screen-gaps.test.js) | — | 두승현 |
| "잠시 멈추기가 안 떠요", "꼭/나중에가 안 먹어요", "알림 기록이 이상해요" | 보류 · 우선순위 · 알림 기록 | [app.js](../../02-frontend/navigator/app.js)(`HOLD_AFTER_NO`), [priority.js](../../03-backend/navigator/priority.js), [alerts.js](../../03-backend/navigator/alerts.js) | [screen-gaps.test.js](../../04-tests/navigator/screen-gaps.test.js) | 보류 3회는 13-1 결정 — 바꾸려면 이재엽 | 두승현 |
| "오버레이가 이상해요", "탭이 이상해요", "버튼이 안 눌려요" | 내비게이터 화면 | [app.js](../../02-frontend/navigator/app.js), [app.css](../../02-frontend/navigator/app.css), [library-tab.css](../../02-frontend/navigator/library-tab.css) | [navigator.test.js](../../04-tests/navigator/navigator.test.js), [수용 테스트](../../04-tests/acceptance/README.md)의 사람 확인 줄 | 화면 흐름 [와이어](../04-pattern-implementation/screen-flow-wireframe.md) | 임유정 · 두승현 |
| "플로로가 이상해요(그림 · 표정 · 움직임)" | 마스코트 | [seal.js](../../02-frontend/navigator/seal.js), [seal.css](../../02-frontend/navigator/seal.css) | [navigator.test.js](../../04-tests/navigator/navigator.test.js) | 이미지 원본은 고한결 | 고한결 · 임유정 |
| "서재로 넘어갈 때 이상해요(물속 전환)" | 물속 전환 | [dive.js](../../02-frontend/navigator/dive.js), [dive.css](../../02-frontend/navigator/dive.css), [library.js](../../02-frontend/library/library.js)(`arrive`) | [static-files.test.js](../../04-tests/navigator/static-files.test.js) | 움직임 줄이기에서는 바로 넘어가야 한다 | 임유정 |
| "서재 · 책 · 책 펼치기가 이상해요" | 서재(서고) | [library.js](../../02-frontend/library/library.js), [library.css](../../02-frontend/library/library.css), [books.js](../../02-frontend/library/books.js)(가상 데이터) | [04-tests/library/](../../04-tests/library/search.test.js) | — | 임유정 |
| "역량 지도 · 레벨이 이상해요" | 역량 지도 | [skills.js](../../02-frontend/library/skills.js) | [skills.test.js](../../04-tests/library/skills.test.js) | 레벨 규칙은 가설 — 항목 · 단위는 인터뷰 뒤(FR-8) | 이재엽 · 고한결 |
| "일정 충돌 · 마감이 이상해요" | 한곳에서 보기 | [schedule.js](../../02-frontend/library/schedule.js), [app.js](../../02-frontend/navigator/app.js)(`deskAll`) | [schedule.test.js](../../04-tests/library/schedule.test.js), [one-place.test.js](../../04-tests/acceptance/one-place.test.js) | 숫자는 가상 — 화면에 "가상 숫자" 표시 유지 | 임유정 |
| "지식 은하가 이상해요" | 지식 은하 | [sky.js](../../02-frontend/library/sky.js), [sky-data.js](../../02-frontend/library/sky-data.js) | [knowledge-sky.test.js](../../04-tests/library/knowledge-sky.test.js) | — | 이재엽 |
| "공유하면 비밀이 보여요", "나만 보기가 안 돼요" | 공유 규칙 | [share-rules.js](../../03-backend/share/share-rules.js), 화면 [share/index.html](../../02-frontend/share/index.html) | [share-rules.test.js](../../04-tests/share/share-rules.test.js) | 기준: [기록 · 보안 기준](../../.claude/rules/security-records.md) | 두승현 |
| "시연 길잡이(‹ ›)가 엉뚱한 데로 가요" | 시연 길잡이 | [tour.js](../../02-frontend/navigator/tour.js) | — | [3분 시연 스토리](../04-pattern-implementation/demo-story-3min.md) | 고한결 |
| "기능 GIF가 지금 화면과 달라요" | 시연 GIF | [record-demo-gifs.py](../features/record-demo-gifs.py) | — | [기능별 README](../features/README.md) | 임유정 |
| "요구 · 결정이 문서마다 달라요" | 요구 · 결정 기록 | [requirements.md](../00-overview/requirements.md)(원천, 13-1 확정 기록), [Floe 세션 파일](../01-problem-save/sessions/project-track/2026-10-18-floe.md)(PRD · 게이트 로그) | — | 상태 문구를 하나 고치면 같은 문구를 다른 파일에서도 찾는다([docs-editing.md](../../.claude/rules/docs-editing.md) 3번) | 이재엽 |
| "일정 · 누가 뭘 하는지 헷갈려요" | 일정 · 역할 | [schedule.md](../00-overview/schedule.md), [team-priorities.md](../00-overview/team-priorities.md) | — | 역할 자체는 [TEAM.md](../../TEAM.md) | 이재엽 |
| "문서 링크가 깨졌어요", "그림이 안 그려져요" | 문서 검사 훅 | [check-links.sh](../../.claude/hooks/check-links.sh), [check-mermaid.sh](../../.claude/hooks/check-mermaid.sh) | — | 훅을 고치면 [consistency.md](../../.claude/rules/consistency.md) 지도를 따른다 | 이재엽 |
| "커밋이 비밀값 때문에 막혀요" | 비밀값 검사 | [check-secrets.sh](../../.claude/hooks/check-secrets.sh) | [04-tests/hooks/](../../04-tests/hooks/test_check_secrets.py) | 값을 지우고 다시 커밋 — 훅을 우회하지 않는다 | 이재엽 |

## 2. 고칠 목록 — 7단계에서 고치며 간다

상태: **열림** → **고치는 중**(브랜치 · PR) → **고침**(PR 번호) / **안 고침**(이유). 사람 이름은 "담당" 칸에만, 인터뷰 응답자는 적지 않는다.

| ID | 무엇이 문제인가 | 고칠 곳(1절 영역) | 근거 · 찾은 곳 | 찾은 날 | 등급 | 상태 |
|---|---|---|---|---|---|---|
| F-01 | 성공 수치 다섯 칸의 **목표 숫자가 없다** — 5→6(11/3) 전에 없으면 5→6은 Recycle | 요구 · 결정 기록(requirements.md 11-1) | 2→3 리뷰 판정 | 2026-10-18 | Lite | 열림 — 10/26 이재엽 · 두승현 |
| F-02 | 판정 규칙 확정 질문 4개(Xpress의 5 Whys · ADR, Lite 1단계 2개, 1단계 꼬리표) | 판정 규칙 | PR #96 본문 | 2026-10-18 | Lite | **고침** — "다 GO"로 지금 고른 그대로 확정(navigator.js 머리 · 검토 문서 · 13-1, 브랜치 v2/fix-docs) |
| F-03 | 6단계 2번 "잰 값과 못 한 것 적어 두기"가 두 가지를 묶어 AI와 예시 정답이 갈림 — 둘로 나눌지 | 판정 규칙(바뀌면 6단계만 다시 녹화) | 실제 AI 점검 2026-10-18 | 2026-10-18 | Lite | 열림 — 이재엽 |
| F-04 | AI 네 주소(`/api/judge` 등)는 확인 값을 보지 않아 같은 컴퓨터의 다른 프로그램이 부를 수 있다 | 로컬 API · 시연 안전장치 | PR #100 본문, API.md 4절 11번 | 2026-10-18 | Xpress | 열림 — 범위는 이재엽이 정함 |
| F-05 | PRD 2-7: 오버레이의 **'내 배움' 탭을 없애고** 지나온 길 · 배운 말 · 확정한 설계도는 서재에서, '플로로와 나'는 설정 맨 위로, 오버레이는 간단히 | 내비게이터 화면 · 서재(주소 `#tab=learn`, 시연 길잡이, 수용 테스트 줄도) | PRD 2-7(이재엽 2026-10-18) | 2026-10-18 | Xpress | 열림 — **5단계 할 일(11/3 전)** |
| F-06 | 원칙표(P1~)를 **설계를 마친 뒤 한 번 더 대조**하지 않았다 | 요구 · 결정 기록([3단계 초안](../03-pattern-analysis/navigator-architecture-draft.md) 1절) | 3→4 리뷰 판정 | 2026-10-18 | Lite | **고침** — 3단계 초안 1절에 "설계 뒤 대조" 열(P1~P10), P7은 일부 → F-17 (브랜치 v2/fix-docs) |
| F-07 | 3단계 초안 문서 머리가 아직 "초안, 결정 전 · 모든 ADR이 Proposed"라고 적혀 있다(ADR은 10/17 Accepted) | 요구 · 결정 기록 | 3→4 리뷰(상태 문구) | 2026-10-18 | 즉시처리 | **고침** — 3단계 초안 머리 상태를 "결정됨"으로 (브랜치 v2/fix-docs) |
| F-08 | 3단계 보안: 위협(무엇으로부터 지키나)을 대안 비교 · ADR에 표로 적지 않았다 | 요구 · 결정 기록 | checklist.md 보안 3단계 | 2026-10-18 | Lite | **고침** — 3단계 초안 1-1절 위협 표 T1~T7 · 권한 · 인증 · 저장 위치 (브랜치 v2/fix-docs) |
| F-09 | `check-mermaid.sh`가 공용 도우미 `lib.sh`를 불러오지 않아, 파일 하나를 볼 때(훅 모드) **검사 없이 통과**한다 | 문서 검사 훅 | 2026-10-18 일정표 수정 때 발견 | 2026-10-18 | 즉시처리 | **고침** — `lib.sh`를 불러옴, 시험 `04-tests/hooks/test_hooks_source_lib.py`(옛 훅에서 실패 확인) (브랜치 v2/fix-docs) |
| F-10 | 서고 · 지식 은하 화면의 큰 글씨에 "EARS" · "MoSCoW" 같은 배운 말이 나오고 쉬운 말 시험이 이 화면을 보지 않는다 — 의도인지 정하기 | 쉬운 말 · 서재 | PR #95 본문 | 2026-10-18 | Lite | 열림 — 팀이 정함 |
| F-11 | 화면의 "물어보기"가 작업 글이 비어도 보내 400 | 내비게이터 화면 | API.md 4절 8번 | 2026-10-18 | 즉시처리 | 열림 |
| F-12 | 설정의 토큰 표가 미리 만든 값이다(화면이 `/api/usage`를 부르지 않음) | 내비게이터 화면 · AI 호출 창구 | API.md 4절 9번 | 2026-10-18 | Lite | 열림 — 대회 뒤 후보 |
| F-13 | 기능별 GIF 중 게이트 · 쉬운 말 · 서고 장면이 지금 화면과 다를 수 있다 | 시연 GIF | 이슈 #16 알림 | 2026-10-18 | Lite | 열림 — 11/4 GIF 일정과 함께 |
| F-14 | 내부 제출 목표(11/6)가 사용 테스트 · 버그 수정(11/4~7)보다 앞선다 | 일정 · 역할 | schedule.md 2절 | 2026-10-18 | 즉시처리 | 열림 — 이재엽이 정함 |
| F-15 | 휴대폰 폭(390px) 가로 스크롤 · 접근성 자동 검사(axe, WCAG 2 AA)를 **E2E 하나로** 확인하는 시험이 없다 | 내비게이터 화면 · 서재 | checklist.md 4·5단계 5번 — **5→6 전에 볼 것** | 2026-10-18 | Xpress | 열림 |
| F-16 | 1단계 산출물(세션 파일 · PRD) · 게이트 로그가 코드보다 늦게(10/18) 모였다 — 회고 거리 | 7단계 회고 | 1→2 리뷰 보완 | 2026-10-18 | — | 열림 — 7단계 회고에서 5 Whys |
| F-17 | 서재 · 지식 은하 화면이 더미 데이터인데 **화면에 가상이라는 표시가 없다**(코드 주석에만) — 원칙 P7 | 서재(서고) · 지식 은하 | 원칙표 설계 뒤 대조(F-06) | 2026-10-18 | 즉시처리 | 열림 |
