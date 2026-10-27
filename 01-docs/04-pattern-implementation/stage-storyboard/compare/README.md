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
