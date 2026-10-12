# 외부에서 가져온 스킬

이 폴더의 스킬 중 아래 여섯 개는 사용자가 직접 쓴 것이 아니라 외부 저장소에서 **그대로 복사한**
것이다(사용자 결정 2026-09-30·2026-10-01, 판정은 [external-tools.md](../../docs/catalog/external-tools.md)).

| 스킬 | 출처 | 커밋 | 라이선스 | 가져온 날 |
|---|---|---|---|---|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) `skills/frontend-design` | `8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4` | Apache 2.0 (`LICENSE.txt`) | 2026-09-30 |
| `theme-factory` | 같은 저장소 `skills/theme-factory` | 같음 | Apache 2.0 | 2026-09-30 |
| `canvas-design` | 같은 저장소 `skills/canvas-design` | 같음 | Apache 2.0, 글꼴은 각 `*-OFL.txt`(SIL Open Font License) | 2026-09-30 |
| `mcp-builder` | 같은 저장소 `skills/mcp-builder` | 같음 | Apache 2.0 | 2026-09-30 |
| `karpathy-guidelines` | [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) `skills/karpathy-guidelines` | `2c606141936f1eeef17fa3043a72095b4765b9c2` | MIT (SKILL.md 머리말·`plugin.json`에 표기, 저장소에 LICENSE 파일은 없음) | 2026-10-01 |
| `ponytail-review` | [dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail) `skills/ponytail-review` (플러그인의 스킬 6개·훅 3개 중 이것만) | `e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156` (v4.10.0) | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-01 |

## 규칙

- **직접 고치지 않는다.** 원본이 바뀌면 위 커밋을 갱신하며 폴더째 다시 복사한다. 우리 식으로
  바꾸고 싶은 점은 이 파일이 아니라 [skill-authoring.md](../rules/skill-authoring.md)나
  [CLAUDE.md](../../CLAUDE.md)의 사용 규칙으로 적는다 — 그래야 다음 복사 때 사라지지 않는다.
- `dev-workflow`, `qa-prep`은 이 워크스페이스에서 만든 스킬이라 이 표에 없다.
