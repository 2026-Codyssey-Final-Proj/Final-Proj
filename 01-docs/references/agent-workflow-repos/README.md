# 에이전트 작업 방식 저장소 넷 — 우리와 맞대 보기

<!-- claude-drafted: 2026-10-21 — 이재엽이 이름 넷(ai-engineering-from-scratch / superpowers / andrej-karpathy-skills / multica-ai)을 주고 "확인해서 우리랑 맞는지 확인해줘"라고 해서 Claude가 저장소를 읽고 비교했다. 겹침 · 새로움 분류와 의견은 Claude의 것이고, 판정은 이재엽이 한다. -->

- 받은 날 2026-10-21 · 준 사람 이재엽 · 비교 Claude — 절차는 [참고 자료 받기](../../../.claude/rules/reference-intake.md) ①~③
- 확인 수준: **직접 열어 봄** — GitHub에서 README와 아래 "읽은 범위"의 파일만 읽었다. 설치 · 실행은 하지 않았다.
- 원문은 옮기지 않고 원칙만 적는다. 워크스페이스로 갈 후보의 **상태는 [후보 장부](../../catalog/reference-candidates.md)에만** 있다(W-29 · W-30~W-38). 도구로서의 판단은 [external-tools.md](../../catalog/external-tools.md) "필요할 때 꺼낼 후보".

## 받은 것

| 저장소 | 무엇 | 읽은 커밋 | 라이선스 | 읽은 범위 |
|---|---|---|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) | 코딩 에이전트에 얹는 스킬 15개 + 세션 시작 훅. 만들기 전에 묻고 → 계획하고 → 테스트 먼저 → 새 맥락이 리뷰 | `b739a8a` (2026-10-20) | MIT | README, 세션 시작 훅, 스킬 12개의 SKILL.md |
| [multica-ai/multica](https://github.com/multica-ai/multica) | 사람과 AI 코딩 에이전트가 한 보드에서 일하는 작업 공간(웹 · 데스크톱 · 모바일) | `2b64569` (2026-10-21) | Multica License — Apache 2.0 + 추가 조건 | README, VISION.md, LICENSE |
| [rohitg00/ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch) | AI 엔지니어링 공개 강의 542개(20단계) + 강의를 가르치는 튜터 스킬 | `fb55d86` (2026-10-21) | MIT | README, 학습 경로 둘("코딩 에이전트로 일하기" 16강 · "만들 것 정하기" 8강)의 강의 문서 24개 |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | 우리가 이미 들인 `karpathy-guidelines`의 원본 | `2c60614` (2026-04-20) | MIT | 우리 사본과 비교만 — **같다**(그 뒤 커밋 없음). 할 일 없음 |

## ① 보안 · 이용 조건

- 넷 다 공개 저장소다. 키 · 주소 · 다른 사람의 정보는 옮기지 않았다(옮긴 원문이 없다).
- **multica는 코드 · 화면을 가져다 쓰면 조건이 붙는다** — 남에게 호스팅하거나 상업 제품에 넣으려면 상업 라이선스, 그 화면에서 나온 UI는 로고 · 이름을 뺄 수 없다. 이 문서는 생각만 적는다.
- 밖으로 나가는 것(들일 때만 해당): superpowers의 그림 보조 기능은 회사 사이트에서 로고를 불러오며 버전을 보낸다(`SUPERPOWERS_DISABLE_TELEMETRY`로 끔). multica 자체 설치 서버는 하루 한 번 익명 집계를 보낸다(`DO_NOT_TRACK=1`로 끔). ai-engineering 튜터는 `npx skills add`가 고른 범위의 `.claude/skills/`에 쓴다.

## ③ 겹침 — 우리에게 이미 있는 것

| 그쪽 | 우리 쪽 근거 |
|---|---|
| superpowers `test-driven-development` — 테스트 먼저, 실패를 본다 | [code.md](../../../.claude/rules/code.md) 1번, `tdd` 스킬 |
| superpowers `verification-before-completion` — 실행한 증거 없이 "됐다"고 하지 않는다, 에이전트의 보고는 바뀐 내용으로 확인 | [security-records.md](../../../.claude/rules/security-records.md) 6-2("확인함"은 실제로 실행했을 때만), `verify` 에이전트 |
| superpowers `brainstorming` "일의 크기" — 바로 할 일 / 작은 변경 / 설계 문서가 필요한 프로젝트 | [scope-tiers.md](../../00-overview/scope-tiers.md)(즉시처리 · Lite · Xpress · Full) |
| superpowers `brainstorming` "되읽어 주기 — 짐작은 짐작이라고 표시", "보여 준 것만 승인된 것" | 요구서의 `[해석]` 표시, [review-mode.md](../../../.claude/rules/review-mode.md) 질문하는 법 2 · 6번 |
| superpowers `writing-plans` "명세의 값을 글자 그대로 옮긴다" | 장부 W-01(수치는 글자 그대로) |
| superpowers `brainstorming` "spike" · ai-engineering 53강 — 버리는 시험 구현 | [02-project-track-skeleton.md](../../04-pattern-implementation/02-project-track-skeleton.md) "3. Spike — 확인 후 버림" (**일부 겹침** — 새로운 부분만 W-32로. 처음 비교 때 놓쳤다가 반영하며 찾았다) |
| superpowers `using-git-worktrees` · `finishing-a-development-branch` | [git-workflow.md](../../../.claude/rules/git-workflow.md), [session-operations.md](../../00-overview/session-operations.md)(주제 하나 · 브랜치 하나 · 작업 폴더 하나) |
| ai-engineering 32~35강 — 안내 라우터 · 상태 파일 · 할 일 보드 · 규칙을 확인 가능한 제약으로 | 루트 `CLAUDE.md`(라우터), 훅, `PROGRESS.md`, Jira, code.md 6번 |
| ai-engineering 38강 — 에이전트가 스스로 끝났다고 표시하지 못한다(검증 게이트) | [gates.md](../../00-overview/gates.md) DoD, `verify` 에이전트 |
| ai-engineering 46강 — 고친 것을 시스템으로 올린다(테스트 > 경계 > 자동화 > 지침 순으로 이른 곳) | reference-intake ④ "후보의 모양 → 넣을 곳" 표, [growth-log](../../00-overview/growth-log.md) 승격 규칙 |
| ai-engineering `check-understanding` — 단계마다 퀴즈와 다시 볼 곳 | Floe FR-4 · 5 확인 질문, [요구서](../../00-overview/requirements.md) 11-1 "확인 질문 정답률" · "1분 설명 성공률" |
| multica — 일은 main이 아니라 리뷰로 간다 · 결정이 필요할 때만 부르는 알림 · 실행 기록 | Floe FR-17 승인 카드, C-12 AI 진행, git-workflow(Claude는 main에 올리지 않는다) |

## ③ 새로움 — 워크스페이스로 (장부에 후보로 적음)

| 장부 | 한 줄 | 출처 |
|---|---|---|
| W-29 (출처 더함) | 쓴 맥락이 아닌 새 맥락에서 리뷰한다 | superpowers `subagent-driven-development`(작업마다 새 리뷰어 — 명세에 맞나 먼저, 품질은 다음), ai-engineering 39강(만든 쪽과 채점하는 쪽을 나눈다) |
| W-30 | 1단계 질문에 "하지 않을 것"과 "돌아가도 실패인 것", 원하는 결과에 해결책이 섞였는지 | superpowers `brainstorming`, ai-engineering 47강 |
| W-31 | 설계서를 새 맥락이 "만드는 사람"으로 읽고 추측해야 할 질문만 낸다 → 셋으로 나눠 사람 몫만 한 번에 묻는다 | superpowers `brainstorming`(builder check) |
| W-32 | 버리는 시험 구현(스파이크)은 처음부터 표시하고, 남기려면 게이트를 다시 거친다 ("확인 후 버림"은 이미 있었다) | superpowers `brainstorming`, ai-engineering 53강 |
| W-33 | 규칙 · 체크리스트 · 훅에도 은퇴 조건 | ai-engineering 46 · 54강 |
| W-34 | 같은 문제에 고침이 세 번 실패하면 멈추고 구조를 의심한다 | superpowers `systematic-debugging` |
| W-35 | 성공 수치에 반대 지표, 재기 전에 통과 · 실패 · 애매를 적는다 | ai-engineering 52강 |
| W-36 | 가정 지도 — 가장 위험한 가정부터 가장 싼 실험으로 | ai-engineering 49강 |
| W-37 | 작업마다 범위 계약 — 고쳐도 되는 파일 · 건드리면 안 되는 파일 · 되돌리는 법 · 사람 확인이 필요한 일 | ai-engineering 36강, superpowers `writing-plans` |
| W-38 | 스킬도 행동 시험 — 스킬 없이 먼저 어기는 것을 보고, 스킬로 지키는 것을 본다 | superpowers `writing-skills` |

## ③ 새로움 — Floe 쪽 (제품 · 발표)

1. **superpowers는 Floe와 가장 가까운 선행 사례다.** 둘 다 "만들기 전에 묻고, 계획하고, 테스트하고, 리뷰한다"를 코딩 도구에 얹는다.
   차이: superpowers는 **에이전트**를 규율하고 사람은 승인만 한다(개발자 대상). Floe는 같은 길을 **사람에게** 보이고, 이해했는지 묻고(FR-4 · 5), 서재에 남긴다(FR-8, 비전공자 대상).
   → 발표 질문 "superpowers가 있는데 왜 Floe인가요?"의 답 재료가 지금 문서에 없다(**공백**). 채울지는 이재엽이 정한다 — 채운다면 `qa-prep` 스킬로 이어 갈 수 있다.
2. **multica는 섬의 AI 진행 · 승인과 같은 자리에 있다.** 실행 기록 다시 보기, 일하는 에이전트에게 바로 말 걸기, 결정이 필요할 때만 부르는 알림, 실행마다 비용.
   대상이 다르다 — 에이전트 여럿을 굴리는 개발 팀 대 혼자 만드는 비전공자. Floe 요구에 없는 것 둘: **일하는 중인 세션에 끼어들어 방향을 바꾸기**(FR-17의 "다루게"에 드는지는 `[해석]`이라 확인할 일), **실행 한 번마다의 비용**(FR-6은 토큰을 한 화면에 보일 뿐 작업 단위로 나누지 않는다). 넣을지는 요구 후보로 다룰 일이다.
3. **ai-engineering의 학습 규칙** "출력을 설명하고, 추측 없이 작은 것 하나를 바꿀 수 있을 때만 다음으로"는 11-1의 확인 질문 정답률 · 1분 설명과 같은 생각이고, **바꿔 보기** 한 걸음만 더 간다.
   FR-4는 이재엽이 "다이어그램을 보이며 예/아니요"로 정했다(2026-10-12) — 기본값은 그대로이고, 다른 근거로 여기 한 번만 적어 둔다.
4. **ai-engineering 47~54강의 순서가 우리 0~7단계와 거의 같다** — 결과 정하기 → 실제 흐름 → 가정 → 가장 작은 조각 → 명세 → 성공 수치 → 시제품 · 시범 · 운영 → 되먹임.
   발표에서 "우리 프로세스는 혼자 지어낸 순서가 아니다"의 근거로 쓸 수 있다.
5. **그대로 들이면 부딪치는 것.** superpowers 플러그인은 세션마다 "1%라도 맞으면 반드시 스킬을 부른다"를 넣고, 계획을 실행하는 동안에는 "애매하면 스스로 정하고 멈추지 않는다"를 따른다.
   우리 리뷰 모드(판정은 사람, 승인받지 않은 제안을 남기지 않는다) · Floe FR-3(사람이 승인한 것만 확정)과 정반대다. 설계 문서를 `docs/superpowers/`에 커밋하는 것도 우리 `01-docs/` 구조와 다르다.
   → 플러그인 전체는 들이지 않는 쪽이 맞다고 본다(ponytail · ECC와 같은 이유). [external-tools.md](../../catalog/external-tools.md) 후보 표에 적었다.
