# 04-tests — 시험 모음

**이 폴더는:** Floe 코드가 제대로 도는지 확인하는 시험을 모아 둔 곳이다. 서버를 켜지 않고, 실제 AI도 부르지 않는다.

## 안에 뭐가 있나

| 이름 | 무엇을 확인하나 | 확인하는 코드 |
|---|---|---|
| `run_all_tests.py` | **이것 하나로 전부 돌린다** (파이썬 시험 + 노드 시험) | — |
| `navigator/` | 시연 화면과 서버 — 단계 판정, 쉬운 말, 키 보호, 녹화·재생 | [03-backend/navigator](../03-backend/navigator/README.md), [02-frontend/navigator](../02-frontend/navigator/README.md) |
| `share/` | "나만 보기" 공유 규칙 — 글이 누구에게 보이는지 | [03-backend/share](../03-backend/README.md) |
| `navigator-demo/` | 첫 시연 화면 초안이 서버 없이 도는지 | `02-frontend/navigator-demo/` |
| `hooks/` | Claude가 커밋·푸시할 때 막는 자동 검사 장치(훅) | `.claude/hooks/` |

수용 테스트(요구사항대로 되는지 사람 눈높이로 적은 시험, 이슈 #17)는 아직 없다. 생기면 여기에 폴더를 더한다.

## 처음이면

```bash
python 04-tests/run_all_tests.py      # Mac은 python3
```

맨 끝 줄에 `요약: N/M개 테스트 파일 전체 통과`가 나온다. 노드 시험 개수는 `ℹ tests` 줄에 나온다.

- 2026-10-17 이 저장소에서 잰 값: 노드 시험 122개 모두 통과.
- 같은 날 Windows 컴퓨터에서 파이썬 시험 6개(훅 시험 5개 + 세컨드 브레인 1개)가 실패했다. 폴더를 옮기기 전 `main`에서도 똑같이 실패한 것이라 이 정리 때문은 아니다. 원인은 아직 확인하지 못했다(훅 시험 하나는 한글 인코딩 오류).
- 세컨드 브레인의 시험은 `05-projects/second-brain/implementations/` 안에 있고, 이 명령이 같이 돌린다.

## 누가 · 관련

- 담당: 두승현 (테스트 · 검증)
- 코드: [backend](../03-backend/README.md) · [frontend](../02-frontend/README.md)
- 시험 작성 규칙(AI용): [.claude/rules/implementations.md](../.claude/rules/implementations.md)

Claude 초안 (2026-10-17, 두승현 요청). 틀린 곳은 담당이 고친다.
