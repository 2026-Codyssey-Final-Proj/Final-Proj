# 5단계 작업 목록과 요구↔시험 대응표

<!-- claude-drafted: 2026-10-13 — 사용자 요청("1, 2번 모두 예", 5→6 준비)으로 Claude가 커밋 이력·시험 이름·V1 세션 파일의 EARS와 Q 값(원문은 이 레포에 없고 PROGRESS.md의 설정값 표만 있다)을 대조해 초안을 썼다. 상태 표기("✓", "절차", "해당 없음")의 확정과 5→6 게이트 판정은 사용자가 한다. -->

5→6 게이트의 완료 기준(`gates.md`)은 ① 단위 테스트 통과, ② EARS Unwanted 요구 전부 커버, ③ "4·5단계 구현 체크리스트" 확인이다.
이 문서는 ②와 ③을 사람이 대조할 수 있게 한 장으로 모은 것이다. 원천은 코드와 시험이고, 이 표는 그 결과를 옮긴 것이라
어긋나면 코드와 시험이 맞다. 상태의 원천(게이트 로그)은 [PROGRESS.md](../../PROGRESS.md)다(V1에서는 세션 파일이었다).

**읽는 법.** `✓` 코드와 시험이 있다 · `부분` 코드가 일부만 본다 · `절차` 코드로 증명되지 않고 세션에서 Claude가 지키는 약속이다 ·
`해당 없음` 이 프로젝트에는 그 동작이 없다(이유를 적음, 사용자 승인 대기) · `전` 구현 전.

## 1. 작업 목록

표기: **[P]** 다른 파일을 건드리고, 끝나지 않은 작업에 의존하지 않아 병렬로 할 수 있다 · **MVP** 첫 흐름(폰 이슈 → 문서 → 알람 → 기록)에 필요한 묶음 ·
**시험 먼저** 구현 전에 시험을 쓰고 실패를 본 뒤 구현했다.

> **한계(솔직하게):** "시험 먼저"는 세션에서 시험이 실패하는 것을 직접 보고 구현했다는 기록이다. git 이력에는 시험과 코드가 한 커밋에 같이
> 들어 있어 순서가 이력만으로는 증명되지 않는다. 커밋 제목에 "테스트 먼저"를 적어 둔 것이 유일한 흔적이다.

| # | 작업 | [P] | 요구 | 의존 | 시험 먼저 | 커밋·PR |
|---|---|---|---|---|---|---|
| T00 | **MVP** 이슈 제목 읽기 → 문서·알람 일정 값·번호·실행 기록 (`intake.py`), 할 일 목록 (`listing.py`) | — | F3·F8b·F11, S1b·S4, S2a·S2d, UC13 | — | ✓ | 4단계, V1 PR #54·#80 |
| T01 | 캘린더 일정 삭제 deny, 참석자 초대 확인 훅 (**V1 전용** — 개인 캘린더 연결이라 이 레포에는 없음) | [P] | S4, 4→5 보완 3 | — | ✓ | `4bea414` |
| T02 | 재시도 상한과 일부만 성공 표시 (`resilience.py`) | [P] | S2a·S2b·S2c·S2d, Q5 | T00(기록 함수) | ✓ | `f65889a` |
| T03 | 지식 줄기: 남기기·찾기·인용·세기·행동을 할 일로 잇기·태그 (`knowledge.py`), ADR-0008 | [P] | F3·F4a·F10a·F10b·F13a·F13b, Q3·Q4 | T00 | ✓ | `ae04963`, `502bc13` |
| T04 | 당일 마감 알림 오늘 20:00 (D11 바뀜) | [P] | F8b, Q2 | T00 | ✓ | `3789581` |
| T05 | 주간 점검 보고 생성 (`check_report.py`), 질문 카드 | | UC11, Q1·Q4, S4 | T03(주간 세기), T00 | ✓ | `55e090e`, `a3c6ca3` |
| T06 | 이번 주 일정 제안·일정 값·겹침 처리 (`planning.py`) | [P] | F17·F18a·F18b, Q11·Q12 | T00(목록 읽기) | ✓ | `82deb2e` |
| T07 | 묶음 나누기·추정 표시·가리기·맞는 근거 (`bundle.py`) | [P] | F15a·F15c·F16b·F16c·S9, Q9·Q10 | T00(민감 패턴) | ✓ | `502bc13` |
| T08 | 대화 시작 브리핑 (`briefing.py`) | | F7a·F8a, Q2 | T06(`load_tasks`) | ✓ | `d2b227a`, `e64cd80` |
| T09 | 세션 시작 브리핑 훅 (**V1 전용** — 이 레포에서는 `briefing.py`만 있고 훅은 팀원이 정함) | | F7a·F8a | T08 | ✓ | `fe747a6` |
| T10 | 요약 규칙: 원문 밖 값 표시·질문 2개·20줄 (`summary_rules.py`) | [P] | S1a·S1c, Q6·Q7 | — | ✓ | `8947880` |
| T11 | 아키텍처 규칙 강제: 코드는 밖으로 보내지 않는다 (`test_architecture.py`) | | S4, implementations.md 6번 | T00~T10(모듈 전부 검사) | ✓ | `8947880` |
| T12 | 지식 목록 (`knowledge_list.py`) | | F4a·Q4(다) | T03 | ✓ | `6fa320c` |
| T13 | 이 문서 | — | 5→6 게이트 ②③ | T00~T12 | — | (이 커밋) |
| T14 | 할 일 시간: 30분 단위 예상 시간, 완료 때 실제 시간 기록, 기록으로 묻기 (`duration.py`), 일정 제안이 할 일마다 시간을 씀 (`planning.py`), ADR-0009 | [P] | F17·F18a, Q11 | T06 | ✓ | `9790d76`, V1 PR #90 |

V1(`gamercross/my-workspace`)의 PR #85(T01~T07)·#86(T08·T09)·#88(T10~T13)·#90(T14)에 들어갔고, 이 레포에는 #24(T00~T08), #26(T10~T13)과 이 PR(T14·질문 답 문서)로 옮겼다. 개인 연결 설정은 옮기지 않았다.
커밋 해시는 **V1 이력**의 것이라 이 레포에서는 찾을 수 없다(출처 표시용).

## 2. 요구 ↔ 시험 대응표 — EARS Unwanted 16개 전부

| 요구 | 구현 | 시험 (파일 · 대표 이름) | Then의 수치·결과 | 상태 |
|---|---|---|---|---|
| **F13b** 사용자 태그를 바꾸거나 지우지 않음 | `knowledge.add_claude_tags` | `test_knowledge` · `test_claude_never_changes_or_removes_user_tags` | 사용자 태그 목록이 그대로, 같은 말은 Claude 태그로 또 붙지 않음 | ✓ |
| **S1a** 원문에 없는 정보를 쓰지 않음 | `summary_rules.ungrounded` | `test_summary_rules` 7개 · `test_date_not_in_the_source_is_flagged`, `test_number_inside_a_longer_number_does_not_count_as_grounded` | 원문에 없는 날짜·숫자·주소가 순서대로 한 번씩 표시됨 | **부분** — 사람 이름·사실 관계는 코드가 못 봄(절차) |
| **S1b** 기한이 없으면 "확인 필요" | `intake.parse_issue_title`, `knowledge.action_issue_title` | `test_intake` · `test_parse_rejects_missing_deadline_without_inventing_one` / `test_knowledge` · `test_action_without_a_deadline_is_not_turned_into_a_task` | 마감을 지어내지 않고 거부함 | ✓ |
| **S1c** 부족하면 질문 최대 Q6개 | `summary_rules.limit_questions` | `test_summary_rules` · `test_at_most_two_questions_are_asked_now` | Q6 = 2 (나머지는 뒤로 미룸) | **부분** — 질문을 만드는 쪽은 절차 |
| **S2a** 자동화가 실패하면 알림 | `intake.process_issue`(실패 결과·메시지), `resilience.retry` | `test_intake` · `test_failure_is_logged_and_reported_not_hidden` / `test_resilience` · `test_gives_up_after_three_retries_and_says_so` | 실패 결과와 이유가 반환되고 실행 기록에 "실패"로 남음 | ✓ (알리는 말은 세션) |
| **S2b** Q5 상한·간격 안에서만 재시도 | `resilience.retry` | `test_resilience` 5개 · `test_transient_errors_are_retried_with_growing_gaps`, `test_request_errors_fail_immediately_without_retry` | 1·2·4초, 첫 시도 뒤 3번, 4xx·모르는 오류는 바로 실패 | ✓ (모듈) — 세션의 캘린더 호출은 절차 |
| **S2c** 일부만 성공하면 빠진 부분 표시 | `resilience.run_steps` | `test_resilience` · `test_partial_success_names_what_is_missing` | "완료: … / 빠진 것: …(이유)" | ✓ (모듈) |
| **S3** 팀원은 이름·직책·한 줄만 | — | — | — | **절차** — 사용자 인정 여부 결정 필요 |
| **S4** 정해진 곳 밖으로 안 보냄 | `intake`(값을 다시 안 보임), `bundle.mask_sensitive`, 훅 | `test_intake` · `test_errors_never_echo_the_title` / `test_architecture` 3개 / `test_calendar_invite_hook` 8개(V1 전용) | 코드가 네트워크·외부 실행 모듈을 못 가져옴, 오류·기록에 값이 안 나옴, 참석자는 사용자 확인 | ✓ |
| **S5** 비밀값이 있으면 커밋을 막음 | `.claude/hooks/check-secrets.sh` | `test_check_secrets` 12개 | 막고 값을 가려서 알림 | ✓ |
| **S6** 인증 없이 밖에 공개하지 않음 | — | — | 서버·API·페이지를 공개하지 않음(ADR-0003) | **해당 없음** — 승인 대기 |
| **S8** 팀 저장소는 내 몫 중심 | — | — | F5(깃허브 진행도)가 없어 이 동작 자체가 없음 | **해당 없음(전)** — F5 구현 때 다시 |
| **F18b** 겹치면 기존 일정은 두고 새 일정만 다른 시간 | `planning.place_on` | `test_planning` · `test_overlapping_slot_is_refused_and_another_time_is_offered` | 기존 일정 목록이 그대로, 겹침 목록과 대안 시각 | ✓ (실제 캘린더 시험은 아직) |
| **F15c** 추정한 줄 표시와 개수 | `bundle.transcript_document` | `test_bundle` · `test_transcript_marks_estimated_lines_and_counts_them_in_the_header` | 줄 끝 `[추정]`, 머리 "추정 N줄" | ✓ |
| **F16c** 어느 목적에도 안 닿으면 "목적에 답하지 않음" | `bundle.fit_report` | `test_bundle` · `test_nothing_fits_means_not_answering_the_purpose_and_asks` | 표시하고 "저장할지" 사용자에게 물음 | ✓ |
| **S9** 키·도메인·IP·남의 정보는 가리고 기록 | `bundle.mask_sensitive`, `transcript_document` | `test_bundle` 4개 · `test_domains_ips_emails_urls_and_phones_are_masked` | 자리표시로 바꾸고 종류·개수를 적음 | **부분** — 남의 이름은 코드가 못 찾음(절차) |

**소계(16개):** ✓ 10개(F13b·S1b·S2a·S2b·S2c·S4·S5·F18b·F15c·F16c) · 부분 3개(S1a·S1c·S9) · 절차 1개(S3) · 해당 없음 2개(S6·S8). 별도로 S2b·S2c(✓는 모듈까지)를 실제 흐름에 끼우는 일은 아직이다.

## 3. 그 밖의 5단계 요구와 측정값 — Then의 수치가 확정 값과 같은가

| 요구·측정 | 확정 값 | 시험 | 상태 |
|---|---|---|---|
| F8b·Q2 알림 시점·시각 | 3일 전·1일 전·당일, 오전 8시, 최대 3번 | `test_intake` · `test_calendar_event_has_three_reminders_at_8am` | ✓ |
| D11 지난 알림 대체, 당일 마감 | 오늘 20:00 한 번 | `test_intake` · `test_a_past_reminder_is_replaced_by_tonight_8pm`, `test_deadline_today_after_8am_gets_one_tonight_reminder` | ✓ (폰 도착은 오늘 저녁 확인) |
| F7a·F8a 브리핑 | 3일 이내 빠짐없이, 다음 할 일 3개 | `test_briefing` · `test_every_soon_task_is_shown_without_a_cap`, `test_three_day_window_is_inclusive_and_four_days_is_not_soon` | ✓ |
| F17·Q11 | 하루 3시간(180분) 상한 | `test_planning` · `test_daily_limit_three_hours_q11` | ✓ (잠정 값) |
| F17 할 일마다 시간 | 30분 단위(문서 `예상 시간`), 하루 상한보다 길면 놓지 못함으로 알림 | `test_duration` · `test_estimate_must_be_a_positive_multiple_of_thirty`, `test_planning` · `test_a_task_longer_than_the_daily_limit_is_reported_not_forced` | ✓ (실제 기록은 첫 완료부터) |
| F17·Q12 | 한 주 최대 10개 | `test_planning` · `test_weekly_limit_ten_tasks_q12_and_the_rest_is_reported` | ✓ (잠정 값) |
| F15a·Q9 | 스크린샷 5장, 그 밖의 파일 10개 | `test_bundle` · `test_screenshots_are_split_into_batches_of_five`, `test_other_files_are_split_into_batches_of_ten` | ✓ |
| Q6 질문 수 | 2 | `test_summary_rules` · `test_at_most_two_questions_are_asked_now` | ✓ |
| Q7 요약 길이 | 20줄 이내 | `test_summary_rules` · `test_summary_of_twenty_lines_is_ok_and_twenty_one_is_not` | ✓ |
| Q5 재시도 | 1·2·4초, 최대 3번 | `test_resilience` · `test_transient_errors_are_retried_with_growing_gaps` | ✓ |
| UC11·Q1 목표 | 주 1개 이하 | `test_check_report` · `test_total_one_meets_the_goal`, `test_learned_late_items_and_causes_are_counted_with_the_total` | ✓ |
| F3·F10a·F10b·Q4 | 세 칸이 모두 찬 것만 센다 | `test_knowledge` · `test_all_three_columns_are_required`, `test_week_counts_new_complete_ones_and_cited_ones` | ✓ |
| F4a·Q3 | 10초·2번 이내 | (찾기는 있음 — `test_find_matches_all_words_in_name_or_columns`) | **6단계 실측** — 질문 10개로 잼 |
| F15b 문서 먼저 | 요약 전에 글자 옮기기 | `transcript_document`는 있음, 순서를 코드가 강제하지는 않음 | **절차** |
| F16a Q10 | 어느 단계에 닿는지 | 형식만 시험(`fit_report`), 판단은 사람 | **절차** |
| S7 확인 방법을 남김 | PR 본문·`claude-drafted` | 코드 시험 아님 | **절차** — PR #85 본문이 그 예 |
| F5·F6·F7b·F9·F12·F14 | — | — | **전** (Should·Could) |

## 4. 4·5단계 구현 체크리스트 대조 (`catalog/checklist.md`)

| 항목 | 상태 | 근거 |
|---|---|---|
| 작업 목록 표기 — `[P]`, 요구 연결, 테스트가 구현 앞, MVP 표시 | ✓ (이 문서 1절) | 한계: 시험 먼저의 증명은 이력이 아니라 기록 |
| EARS → Given-When-Then, Then의 수치가 확정 값과 같음 | ✓ (2·3절) | Q3·Q4 목표치는 6단계 실측 |
| 제약은 위반 시도로 확인 | ✓ | 시험 이름이 위반 시도를 먼저 보임(`..._is_refused`, `..._never_...`, `test_overlapping_slot...`). 멱등: 목록·점검·계획 시험이 "같은 입력 같은 결과" |
| 아키텍처 규칙은 도구로 강제 | ✓ | `test_architecture` — 코드가 네트워크·외부 실행을 못 가져옴 |
| (화면이 있으면) 접근성 검사 | **해당 없음** | 첫 버전은 화면 없이 대화·마크다운(3단계 판정). 승인 대기 |

## 5. 5→6 게이트 전에 남은 일

| 일 | 누가 | 비고 |
|---|---|---|
| S3(팀원은 한 줄)를 세션 절차로 인정할지 | 사용자 | 코드로 증명할 방법이 마땅치 않음 |
| S6·S8·접근성 "해당 없음" 승인 | 사용자 | 위 표의 이유가 맞는지 |
| S1a·S1c·S9 `부분`을 게이트에서 어떻게 볼지 | 사용자 | 이름·사실 관계는 코드 밖 |
| S2b·S2c를 실제 흐름에 끼울지, 세션 절차로 둘지 | 사용자 + Claude | 캘린더 호출이 세션(MCP)이라 코드에 걸 자리가 없음 |
| 실사용 확인 | 사용자 | 오늘 20:00 당일 알림 도착(D11), F18b 겹침을 실제 캘린더에서 시험, 지식 찾기·인용 한 번 |
| 5단계 종료일 | 사용자 | 관리계획서 부록 B에 미정으로 남음 |
| 자기 판정(Go/Recycle/Hold/Kill + 한 줄 근거) | 사용자 | 리뷰 모드: 사용자 판정을 먼저 적은 뒤 Claude 판정을 본다 |
