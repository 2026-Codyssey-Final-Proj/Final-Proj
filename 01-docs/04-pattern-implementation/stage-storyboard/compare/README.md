<!-- claude-drafted: 2026-10-27 — 페이블 세션(C-42, 넘김 문서 fable-handoff-2026-10-27-workspace.md 5절)이 묶음마다 스토리보드 3단계와 앱을 같은 화면 크기로 찍어 둔 비교 사진. 앱 쪽은 앱을 띄우지 않고 브라우저에서 같은 화면을 만들었다(섬이 작업실 창에 보내는 HTML을 win.html에 넣음 — e2e workspace-layout.test.js의 FLOE_SHOTS) -->

# 스토리보드 3단계 ↔ 앱 — 비교 사진 (C-42)

기준 그림은 [3단계 장면](../README.md)(`index.html#s3`), 앱 쪽은 `v2/workspace-storyboard` 브랜치의 작업실 창(3단계 연습 장면 `#ex=2&q=quest`, 캔버스 탭). 잰 값은 [fixes/workspace-storyboard.md](../../../07-maintenance/fixes/workspace-storyboard.md) 줄마다.

## ① 구조 — R-1 화면 가득 · R-11 줌 + 다시 배치 (2026-10-27)

| 화면 | 캔버스 칸 | 결과 | 사진 |
|---|---|---|---|
| 스토리보드 3단계(1440) | — | 기준 | [storyboard-stage3-1440.png](storyboard-stage3-1440.png) |
| 1440 × 860 · 섬 오른쪽 420 | 796 × 786 | 격자 두 줄(① ② ③ / ④ ⑤ 관문), 넘침 0 | [app-1440-right.png](app-1440-right.png) |
| 1280 × 760 · 섬 오른쪽 420 | 636 × 686 | 격자 세로 한 줄, 넘침 0 | [app-1280-right.png](app-1280-right.png) |
| 1728 × 1000 · 섬 아래 360 | 1504 × 565 | 줌 0.88, 넘침 0 | [app-1728-bottom.png](app-1728-bottom.png) |

그 밖에 1024 × 700(옆 580 → 한 줄 · 파일 칸 숨김, 아래 800 → 두 줄) · 1280 아래(1056 → 두 줄) · 1440 아래(1216 → 두 줄) · 1728 옆(1084 → 줌 0.99)도 넘침 0 — e2e가 매번 잰다.

## ② 칸 — R-5 칸의 내용 · R-9 단계 칩 (2026-10-27)

| 화면 | 결과 | 사진 |
|---|---|---|
| 1440 × 860 · 섬 오른쪽 | 격자 두 줄 — 칩 '시작 ✓ · 1 ✓ V.1 · 2 ✓ V.2 · 3 기능 정리 · 4 ~ 8', ③ 카드에 정한 줄, ④ 올라갈 파일 셋, 관문에 남은 기준 | [app2-1440-right.png](app2-1440-right.png) |
| 1728 × 1000 · 섬 아래 | 줌 0.88 — 칩이 판 오른쪽 끝 안에서 두 줄로 | [app2-1728-bottom.png](app2-1728-bottom.png) |

## ③ 파일 목록 — R-8 진짜 이름 (2026-10-27)

| 화면 | 결과 | 사진 |
|---|---|---|
| 1440 × 900 브라우저(서버를 다른 포트로 띄우고 시험 폴더를 연결) | 파일 칸에 진짜 이름 — `.env` · `secret.pem`은 없고, 지금 장 문서 '● 지금', `src`를 눌러 펼침 | [app3-files.png](app3-files.png) |

## C-46 켤 때는 알약 · 작업실 안의 섬 접기 (2026-10-27, 브랜치 `v2/pill-overlay`)

| 화면 | 결과 | 사진 |
|---|---|---|
| 켤 때(주소 없이, 1440) | 큰 인사 카드 없이 위 가운데 알약 — 플로로가 솟아 손을 흔들고 시간대 인사 한 줄(하루에 한 번) | [pill-greet.png](pill-greet.png) |
| 작업실 1440 × 860 · 섬 오른쪽 접음 | 세로 알약(두께 56) · 캔버스가 넓어져 줌 | [pill-col-right-folded.png](pill-col-right-folded.png) |
| 작업실 1440 × 860 · 섬 위 접음 | 가로 알약(두께 56) | [pill-col-top-folded.png](pill-col-top-folded.png) |

네 가장자리 모두 e2e [pill-overlay.test.js](../../../../04-tests/e2e/pill-overlay.test.js)가 잰다(두께 56 · 손잡이 없음 · 캔버스가 넓어짐 · 넘침 0).

## C-43 파일 보기 · 고치기 (2026-10-27, 브랜치 `v2/workspace-files`)

| 화면 | 결과 | 사진 |
|---|---|---|
| 1440 × 900 브라우저(서버를 다른 포트로, 시험 폴더) · README.md | 파일 칸의 파일을 눌러 열림 — md를 보기 좋게(제목 · 목록 · 표), 열린 파일 탭 | [files-md.png](files-md.png) |
| 같은 화면 · src/app.js 고치기 | 글 칸에서 고쳐 저장(⌘S) → 파일에 쓰임, 비밀값 모양이면 멈추고 묻기 → 그대로 저장 | [files-edit.png](files-edit.png) |
| 같은 화면 · '문서 지도' 탭(C-45) | docs/** · README를 상자로, 재료 링크(굵은 선) · md 링크를 선으로 — archi-board v1 사본(밖으로 요청 0), 상자 → '파일 보기에서 열기' | [files-docmap.png](files-docmap.png) |

## 목업 캔버스대로 — 파란 줄 · 넘긴 까닭 · 켤 때 바로 작업실 · 세 칸 · 지도 (2026-10-28, 브랜치 `v2/workspace-md`) <!-- claude-drafted: 2026-10-28 -->

[넘김 문서](../../../00-overview/기록/fable-handoff-2026-10-27-mdlayout.md) ⓐ ~ ⓔ. 목업 보드는 [캔버스](https://claude.ai/artifact/1To4aBVaPbF74QoBjy7Pf3)(이재엽 계정).

| 장면 | 목업 보드 | 사진 |
|---|---|---|
| 작업실 1440 × 860 · 섬 오른쪽 접음 — 칸 바탕이 작업실 바탕과 같고 남색은 세로 알약 하나(F-65) | ⑦ 섬 접힘 | [col-right-folded.png](col-right-folded.png) |
| 같은 것, 왼쪽 | ⑦ | [col-left-folded.png](col-left-folded.png) |
| 같은 것, 위 — 가운데 가로 알약 | ⑦ | [col-top-folded.png](col-top-folded.png) |
| 같은 것, 아래 | ⑦ | [col-bottom-folded.png](col-bottom-folded.png) |
| 켤 때(주소 없이, 1440 × 900, 브라우저 판) — 작업실(캔버스)이 바로 열리고 섬은 접힌 알약, 알약 옆 말풍선(시간대 인사 · 멈춘 곳 · 섬 펼치기 / 나중에) (C-55) | ① 켤 때 바로 작업실 | [boot-workspace.png](boot-workspace.png) |
| 작업실 세 칸(앱 창 재현 1440 × 900 — 파일 칸 · 작업 칸 · 오른쪽 칸, 섬은 오른쪽 접힌 알약) (C-53) | ② 문서 열고 고치기 | [ws-app-1440.png](ws-app-1440.png) · [1280](ws-app-1280.png) · [1728](ws-app-1728.png) |
| 문서를 열어 고치는 중(브라우저 판 920) — 도구 줄(서식 · 글 크기 · 목차 · 찾기) · 상태 줄 · 오른쪽 칸의 목차와 빈 절 (C-53) | ② | [ws-doc.png](ws-doc.png) |
| 도전과제 탭의 지도(1440 × 900) — 1 · 2단계 끝남, 3단계 지금, 4 ~ 8은 '2단계에서 그려져요', 아래 줄 문서 셋 (C-54) | ④ 지도 1단계 | [map-stage1.png](map-stage1.png) |
| 기획서로 3 ~ 8단계를 그린 뒤 '맞아요' — 준비된 퀘스트(근거 절) (C-54) | ⑤ 지도 2단계 끝 · ⑥ | [map-stage2.png](map-stage2.png) |

네 가장자리 모두 e2e [pill-overlay.test.js](../../../../04-tests/e2e/pill-overlay.test.js) R-2가 접힌 칸의 바탕이 비치는지(`rgba(0, 0, 0, 0)`)와 알약만 색이 있는지를 잰다. 위 C-46 절의 `pill-col-*-folded.png`가 고치기 전 모습이다.
F-62(넘긴 기준의 까닭)는 화면이 아니라 문서 — [flow-api.test.js](../../../../04-tests/navigator/flow-api.test.js)가 단계 문서의 '넘김(까닭: …)'과 결정 기록의 '넘김 n — 까닭'을 본다.
