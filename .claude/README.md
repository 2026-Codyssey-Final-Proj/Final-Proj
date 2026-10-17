# .claude — Claude(AI)가 읽는 설정

**이 폴더는:** Claude Code가 이 저장소에서 일할 때 따르는 규칙과 자동 검사 장치다. **사람은 평소에 열어 보거나 고칠 필요가 없다.**

## 안에 뭐가 있나

| 이름 | 무엇 |
|---|---|
| `rules/` | Claude가 작업 종류별로 읽는 규칙 (문서 고치기, git, 보안, 리뷰 방식 등) |
| `hooks/` | 자동 검사 장치(훅) — Claude가 `main`에 올리거나, 비밀값을 커밋하거나, 시험이 실패한 채 커밋하려 하면 막는다 |
| `skills/` | Claude가 꺼내 쓰는 작업 절차. `dev-workflow`(7단계 진행)·`qa-prep`(발표 준비)·`reference-library`는 우리 것, 나머지는 외부에서 가져온 것(출처는 `skills/VENDORED.md`) |
| `agents/verify.md` | 전체 시험과 링크 검사를 맡기는 도우미 설정 |
| `settings.json` | 어떤 훅을 언제 돌릴지 |

## 사람이 알아 둘 것

- Claude에게 하는 안내의 시작점은 루트의 [CLAUDE.md](../CLAUDE.md)다. 사람용 안내는 각 폴더의 README.md다.
- 훅이 막으면 이유가 화면에 나온다. 막힌 이유를 고친 뒤 다시 하면 된다.
- 이 폴더를 고치는 것은 규칙을 바꾸는 일이라, 바꿀 때는 [consistency.md](rules/consistency.md)의 참조 지도대로 관련 파일을 같이 본다.

Claude 초안 (2026-10-17, 두승현 요청). 틀린 곳은 담당이 고친다.
