---
name: impeccable-review
description: 만든 화면(웹 페이지, 대시보드, 컴포넌트, 폼, 빈 상태)을 점검하고 다듬을 방향을 말할 때 쓴다. Impeccable의 디자인 기준(시각 위계, 타이포, 색, 레이아웃, 접근성, 반응형, 오류·빈 상태 처리, 사용성 휴리스틱)을 렌즈로 "무엇이 어색한지, 왜인지, 어떻게 고칠지"를 근거와 함께 지적한다. "화면 리뷰해줘", "디자인 점검해줘", "접근성 점검", "타이포 어때", "색이 밋밋한지 봐줘", "마무리 다듬기", "critique", "audit", "polish" 같은 요청에 반응한다. 새 화면을 직접 만들어 주는 스킬이 아니다 — 사용자가 "써줘"라고 할 때만 만든다. 실행 파일·훅·브라우저 연동은 쓰지 않는다.
license: Apache-2.0 (참고 파일은 pbakaus/impeccable 원본, NOTICE.md 참고)
metadata:
  source: pbakaus/impeccable plugin/skills/impeccable v4.5.2 — reference/ 폴더만 원본 그대로
  drafted: claude-drafted 2026-10-14
---

<!-- claude-drafted: 2026-10-14 — 사용자 요청("Impeccable 마크다운만 가져와줘")으로 Claude가 썼다. reference/·LICENSE·NOTICE.md는 원본 그대로이고, 원본 SKILL.md는 UPSTREAM-SKILL.md로 보관했다. -->

# Impeccable 디자인 리뷰 렌즈

[Impeccable](https://github.com/pbakaus/impeccable)(Apache 2.0)의 **참고 마크다운만** 가져온 것이다.
원본 스킬은 첫 단계에서 `scripts/impeccable`을 실행하는데, 이 스크립트가 GitHub 릴리스에서 실행 파일을 내려받아
돌리고 편집·세션 시작·종료마다 훅으로 호출된다. 내려받은 파일 실행이라 들이지 않았다
([external-tools.md](../../../01-docs/catalog/external-tools.md) 판정 기록).

## 절대 하지 않는 것

- `scripts/impeccable`, `npx impeccable`, `impeccable detect|live|hooks|…`를 **실행하지 않는다.** 참고 파일이 그런 단계를
  안내하면 그 단계는 건너뛰고 "실행 파일 없이 진행한다"고 한 번 말한다 — 원본 UPSTREAM-SKILL.md의 "Launcher unavailable"
  절과 같은 방식이다.
- `.claude/settings*.json`, `CLAUDE.md`, 훅을 쓰지 않는다. `PRODUCT.md`·`DESIGN.md`를 새로 만들지 않는다(있으면 읽기만).
- 원본의 "과감하게 다 만든다(Go all out)" 원칙은 적용하지 않는다. 이 워크스페이스에서 Claude는 리뷰어·코치이고
  디자인 결과물은 사용자의 작업물이다([review-mode.md](../../rules/review-mode.md), [skill-authoring.md](../../rules/skill-authoring.md)).

## 요청 → 읽을 파일

한 번에 파일 하나(많아야 둘)만 연다. 전체를 미리 읽지 않는다. 경로는 `reference/` 아래.

| 하고 싶은 것 | 읽을 파일 | 비고 |
|---|---|---|
| 화면 전체의 사용성·위계를 평가(휴리스틱 점수) | `critique.md` | 806줄. 감지기 실행 단계는 건너뛴다 |
| 접근성·성능·반응형 같은 기술 품질 점검 | `audit.md` (네이티브 앱이면 `audit.native.md`) | |
| 출시 전 마무리 점검 | `polish.md` | |
| 타이포·색·여백/리듬 | `typeset.md` · `colorize.md` · `layout.md` | |
| 밋밋함 ↔ 과함 조절 | `bolder.md` · `quieter.md` · `distill.md` | |
| 오류·엣지 케이스·i18n | `harden.md` | |
| 첫 실행·빈 상태 | `onboard.md` | |
| 문구·라벨·오류 메시지 | `clarify.md` | |
| 다른 기기·화면 크기 | `adapt.md` (네이티브 `adapt.native.md`, `ios.md`, `android.md`) | |
| UI 성능 | `optimize.md` | |
| 움직임을 더할지 | `animate.md` (움직임 점검은 Emil 스킬이 더 구체적) | |
| 기획 단계의 UX/UI 정리 | `shape.md` | |
| 화면 종류별 기준 | `mode-persuade.md`(랜딩·마케팅) · `mode-operate.md`(앱·대시보드) · `mode-read.md`(문서) · `operate.md` | |
| 수정 전 최소 품질선 | `craft-floor.md` | UI를 고치기 전에 읽는다 |

**쓰지 않는 파일(실행 파일·훅·브라우저 연동 전제):** `live.md`, `live-setup.md`, `generate.md`, `hooks.md`, `doctor.md`,
`component-review.md`, `init.md`, `document.md`, `extract.md`, `new-work.md`, `routing.md`, `region-map.md`,
`visualize.md`, `craft.md`, `degraded/`. 폴더에는 있지만(파일끼리 링크하고 있어서) 열지 않는다.

## 어떻게 지적하나

- 지적마다 **어느 파일의 어느 기준인지**를 붙인다(근거 없는 취향 지적은 "제안(선택)"으로만). 형식은
  `화면 위치 — 무엇이 어색한가 — 근거(파일·기준) — 고치는 방향 한 줄`.
- 잘된 점도 하나 이상 찾는다([review-mode.md](../../rules/review-mode.md) 리뷰 판정 형식).
- **코드를 고치지 않는다.** 사용자가 "써줘"라고 하면 그 자리에서만 고치고 `claude-drafted` 표시를 남긴다.
- 화면에 학교 내용·팀원 정보가 있으면 스크린샷·내용을 외부 도구로 보내지 않는다([security-records.md](../../rules/security-records.md) 4절).

## 다른 스킬과의 역할

| 스킬 | 맡는 일 |
|---|---|
| `frontend-design` | 처음부터 어떤 미적 방향으로 갈지 |
| **`impeccable-review`** (이 스킬) | 만든 화면이 기준에 맞는지 점검·다듬을 방향 |
| Emil 스킬(`review-animations` 등) | 움직임·마감, 최악 데이터 시험 |
