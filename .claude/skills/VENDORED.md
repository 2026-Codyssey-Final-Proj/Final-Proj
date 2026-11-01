# 외부에서 가져온 스킬

이 폴더의 스킬 중 아래 열다섯 개는 사용자가 직접 쓴 것이 아니라 외부 저장소에서 **그대로 복사한**
것이다(사용자 결정 2026-09-30·2026-10-01, 판정은 [external-tools.md](../../01-docs/catalog/external-tools.md)).

| 스킬 | 출처 | 커밋 | 라이선스 | 가져온 날 |
|---|---|---|---|---|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) `skills/frontend-design` | `8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4` | Apache 2.0 (`LICENSE.txt`) | 2026-09-30 |
| `theme-factory` | 같은 저장소 `skills/theme-factory` | 같음 | Apache 2.0 | 2026-09-30 |
| `canvas-design` | 같은 저장소 `skills/canvas-design` | 같음 | Apache 2.0, 글꼴은 각 `*-OFL.txt`(SIL Open Font License) | 2026-09-30 |
| `mcp-builder` | 같은 저장소 `skills/mcp-builder` | 같음 | Apache 2.0 | 2026-09-30 |
| `karpathy-guidelines` | [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) `skills/karpathy-guidelines` | `2c606141936f1eeef17fa3043a72095b4765b9c2` | MIT (SKILL.md 머리말·`plugin.json`에 표기, 저장소에 LICENSE 파일은 없음) | 2026-10-01 |
| `ponytail-review` | [dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail) `skills/ponytail-review` (플러그인의 스킬 6개·훅 3개 중 이것만) | `e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156` (v4.10.0) | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-01 |
| `emil-design-eng` | [emilkowalski/skills](https://github.com/emilkowalski/skills) `skills/emil-design-eng` (스킬 14개 중 6개만) | `2d228630ba1446365f614a108cb8252f1feda202` | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-14 |
| `review-animations` | 같은 저장소 `skills/review-animations` | 같음 | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-14 |
| `improve-animations` | 같은 저장소 `skills/improve-animations` | 같음 | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-14 |
| `find-animation-opportunities` | 같은 저장소 `skills/find-animation-opportunities` | 같음 | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-14 |
| `break-ui` | 같은 저장소 `skills/break-ui` | 같음 | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-14 |
| `animation-vocabulary` | 같은 저장소 `skills/animation-vocabulary` | 같음 | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-14 |
| `impeccable-review` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) `plugin/skills/impeccable` — **`reference/` 폴더만** 원본 그대로 (스크립트·훅·에이전트 제외). `SKILL.md`는 우리가 쓴 안내문이고 원본은 `UPSTREAM-SKILL.md`로 보관 | `4f956490f0056ae1ff5ea80372cf56e83c001d3c` (v4.8.0) <!-- claude-drafted: 2026-11-01 --> — 처음 `2f98774`(v4.5.2)에서 갱신, `reference/` 45개 중 바뀐 28개(+133 −88줄)와 `UPSTREAM-SKILL.md`. 파일 목록 · LICENSE · NOTICE는 그대로 | Apache 2.0 (`LICENSE`), 제3자 고지 `NOTICE.md`(ios·android 참고 파일은 ehmo/platform-design-skills MIT에서 가져온 것) | 2026-10-14, 갱신 2026-11-01 |
| `impeccable-review/extra/hallmark.md` <!-- claude-drafted: 2026-10-26 --> | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) `skills/hallmark/references/gates.md` · `redesign.md`에서 **impeccable · Emil 스킬 · 우리 규칙에 없는 것만 골라 우리 말로 옮긴 것** — 원본 복사가 아니라 우리 파일이다. 스킬 · 실행 파일 · 훅은 들이지 않았다 | `7ec868225c6caa040558c321ee0fefa0e73f83a8` (v2.0.0) | MIT (`extra/LICENSE-hallmark.txt`) | 2026-10-26 |
| `tdd` | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/engineering/tdd` (`SKILL.md`·`tests.md`·`mocking.md`만 — Codex용 `agents/openai.yaml` 제외) | `49dd158d1076134a641b33efb035946536778336` | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-14 |
| `owasp-security` | [agamm/claude-code-owasp](https://github.com/agamm/claude-code-owasp) `.claude/skills/owasp-security` (`SKILL.md` + `reference/` 4개) | `8ac7965caa212b4a850aff8d3df0081ab3fa9eed` | MIT (저장소 루트 `LICENSE`를 폴더에 같이 복사) | 2026-10-15 |

## 규칙

- **직접 고치지 않는다.** 원본이 바뀌면 위 커밋을 갱신하며 폴더째 다시 복사한다. 우리 식으로
  바꾸고 싶은 점은 이 파일이 아니라 [skill-authoring.md](../rules/skill-authoring.md)나
  [CLAUDE.md](../../CLAUDE.md)의 사용 규칙으로 적는다 — 그래야 다음 복사 때 사라지지 않는다.
- `dev-workflow`, `qa-prep`은 이 워크스페이스에서 만든 스킬이라 이 표에 없다.
