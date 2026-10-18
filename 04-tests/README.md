# 04-tests — 시험 모음

**이 폴더는:** Floe 코드가 제대로 도는지 확인하는 시험을 모아 둔 곳이다. 서버를 켜지 않고, 실제 AI도 부르지 않는다.

## 안에 뭐가 있나

| 이름 | 무엇을 확인하나 | 확인하는 코드 |
|---|---|---|
| `run_all_tests.py` | **이것 하나로 전부 돌린다** (파이썬 시험 + 노드 시험) | — |
| `navigator/` | 시연 화면과 서버 — 단계 판정, 쉬운 말, 키 보호, 녹화·재생, 한 줄로 켜기(`floe.test.js` — 임시 폴더에 진짜로 한 번 켠다, AI 호출 없음), 느낀 점(`notes.test.js`) | [03-backend/navigator](../03-backend/navigator/README.md), [02-frontend/navigator](../02-frontend/navigator/README.md) |
| `library/` | 도서관 시안 — 마감 계산, 역량 지도, 서고 검색, 별자리 하늘, 내 배움 기록 읽기, 내 책 · 예시 책 지우기(`my-books.test.js`) | [02-frontend/library](../02-frontend/library/README.md) |
| `share/` | "나만 보기" 공유 규칙 — 글이 누구에게 보이는지 | [03-backend/share](../03-backend/README.md) |
| `hooks/` | Claude가 커밋·푸시할 때 막는 자동 검사 장치(훅) | `.claude/hooks/` |
| `e2e/` | **브라우저로 연 화면** — 휴대폰 폭(390px)에서 가로 스크롤이 없는지(고칠 목록 F-15). puppeteer · Chrome이 없으면 **건너뜀**을 알리고 실패하지 않는다 | `02-frontend/` 페이지 (파일로 바로 염) |
| `repo/` | 저장소 자체의 약속 — 버전 기록(CHANGELOG.md)의 번호가 겹치거나 건너뛰지 않는지, 버전을 Jira 릴리스로 만드는 Action(가짜 Jira로) | [CHANGELOG.md](../CHANGELOG.md), [jira-release.js](../.github/scripts/jira-release.js) |
| `acceptance/` | **수용 테스트**(이슈 #17) — 요구(FR)마다 Given-When-Then 장면, 자동 시험과 사람이 화면으로 볼 것 | [acceptance/README.md](acceptance/README.md) |

수용 테스트는 2026-10-18에 Claude 초안으로 생겼다(이재엽 요청, 두승현 검토). 장면마다 상태(자동 통과 / 사람 확인 필요 / 아직 없음)가 적혀 있다.

## 처음이면

```bash
python 04-tests/run_all_tests.py      # Mac은 python3
```

맨 끝 줄에 `요약: N/M개 테스트 파일 전체 통과`가 나온다. 노드 시험 개수는 `ℹ tests` 줄에 나온다.

- 2026-10-17 이 저장소에서 잰 값: 파이썬 시험 19개 파일, 노드 시험 155개 모두 통과.
- Windows에서 한글을 cp949로 읽어 실패하던 시험 6개는 2026-10-17에 고쳤다(시험은 UTF-8로 읽는다).
- 세컨드 브레인의 시험은 `05-projects/second-brain/implementations/` 안에 있고, 이 명령이 같이 돌린다.

## 누가 · 관련

- 담당: 두승현 (테스트 · 검증)
- 코드: [backend](../03-backend/README.md) · [frontend](../02-frontend/README.md)
- 시험 작성 규칙(AI용): [.claude/rules/code.md](../.claude/rules/code.md)

Claude 초안 (2026-10-17, 두승현 요청). 틀린 곳은 담당이 고친다.
