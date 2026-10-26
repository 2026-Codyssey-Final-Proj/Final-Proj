<!-- claude-drafted: 2026-10-27 — 이재엽 요청("스토리보드랑 지금 진행된 앱이랑 비교해서 어떤 점들이 다르고 수정해야하는 부분이 있는지 요구사항을 만들어서")으로 Claude가 앱과 스토리보드를 비교해 적었다. 고치는 것은 페이블 세션이다. -->

# F-61 묶음 — 앱을 스토리보드처럼 (작업실 · 섬)

[고칠 목록](../fix-map.md) 2절 **F-61** 줄이 가리키는 묶음이다. 요구 문장은 [요구서](../../00-overview/requirements.md) 2-2 **C-42**(R-1 ~ R-10), 할 일 차례와 꼭 지킬 것은 [넘김 문서](../../00-overview/기록/fable-handoff-2026-10-27-workspace.md).
**줄마다의 상태는 여기에만 적는다.** 페이블 세션은 브랜치 `v2/workspace-storyboard` 하나에서 차례대로 고치고 PR 하나로 올린다(이재엽 버튼 "한 PR · 차례대로").

- 기준 그림: [0~8단계 스토리보드](../../04-pattern-implementation/stage-storyboard/README.md) — 특히 **3단계 장면**(이재엽이 준 디자인 캔버스 스크린샷과 같은 순간).
- 상태 이름은 fix-map.md 2절과 같다 — **열림** → **고치는 중** → **고침**(PR 번호) / **안 고침**(이유).

| ID | 무엇이 다른가 (스토리보드 → 지금 앱) | 고칠 곳 | 근거 · 잰 값 (2026-10-27, `main` 4a7668c) | 요구 | 상태 |
|---|---|---|---|---|---|
| F-61-1 | **작업실이 화면 가득이 아니다.** 스토리보드는 작업실이 화면을 채우고 섬이 그 가장자리에 붙는다. 앱은 작업실이 S 720 · M 920 · L 1120 창이고 섬(420)이 그 안에 붙어 내용 폭을 빼앗는다 | [lib.js](../../../02-frontend/electron/lib.js) `workBounds` · [main.js](../../../02-frontend/electron/main.js) `boundsFor` · [quest.js](../../../03-backend/navigator/quest.js) `SIZES` · [app.js](../../../02-frontend/navigator/app.js) `qwinHTML`(S/M/L 단추) | 퀘스트 보드 너비 — 섬 없이 520 · 720 · 920, **섬이 붙으면 89 · 289 · 489 → 세 크기 모두 세로 한 줄**(#211 본문은 M · L에서 254 · 456). 스토리보드 1500 화면은 662(두 줄) | C-42 R-1 | 열림 — 페이블 세션에서 |
| F-61-2 | **섬을 접을 수 없다.** 작업실이 열린 동안 섬이 접히지 않아(pinned) 가장자리 띠가 나오지 않는다 | [app.js](../../../02-frontend/navigator/app.js) `pinned` · `nextView` · [main.js](../../../02-frontend/electron/main.js) `placeIsland` · [win.js](../../../02-frontend/navigator/win.js) `onDock` | #209 본문 "지금은 작업실이 열린 동안 섬이 접히지 않아(pinned) 띠가 나올 일이 없다" | C-42 R-2 | **안 고침** — 두승현 결정(#211 "접힌 띠는 만들지 않음") · 이재엽 2026-10-27 버튼 "만들지 않음" |
| F-61-3 | **칸이 뮤즈형이 아니다.** 같은 모양 카드 여섯 — 손글씨 쪽지 · 칸 사이 화살표 · 지금 칸 위 플로로가 없다('● 지금' 글씨만) | [app.js](../../../02-frontend/navigator/app.js) `canvasPane` · [app.css](../../../02-frontend/navigator/app.css) `.cv-g` · `.cv-c` | 재현 화면 | C-42 R-3 | 열림 — 페이블 세션에서 |
| F-61-4 | **파일 카드(바뀐 줄)가 없다** — 화면 기준 2에 있다 | [app.js](../../../02-frontend/navigator/app.js) `canvasPane` · [docs.js](../../../03-backend/navigator/docs.js)(단계 문서 글) | #207 본문 "파일 카드(바뀐 줄)는 다음 묶음" | C-42 R-4 | **고침 — #211**(Claude Code 세션이 고친 파일 다섯의 이름 · +/− 줄 수만) · 이재엽 2026-10-27 버튼 "이름 · 줄 수만" — 스토리보드의 '바뀐 줄'은 넣지 않는다 |
| F-61-5 | **칸에 내용 대신 상태 글** — "비었어요 — 채팅에서 같이 적어요" · "적은 칸 0/5" · "아직 — 관문 뒤에" | [app.js](../../../02-frontend/navigator/app.js) `canvasPane`(think · act · rec · save · gate) | 재현 화면 · 코드 | C-42 R-5 | 열림 — 페이블 세션에서 |
| F-61-6 | **배울 말 카드가 없다** — 용어는 `STAGES` criteria의 term에 이미 있다 | [app.js](../../../02-frontend/navigator/app.js) `canvasPane` · [navigator.js](../../../03-backend/navigator/navigator.js) `STAGES` | 코드 | C-42 R-6 | 열림 — 페이블 세션에서 |
| F-61-7 | **작업실 머리에 프로젝트 · 단계 · LV · 조개가 없다** — S/M/L과 닫기만(머리 글은 OS 제목과 겹쳐 숨겼다, #207) | [app.js](../../../02-frontend/navigator/app.js) `qwinHTML` · [win.html](../../../02-frontend/navigator/win.html) | #207 리뷰 표 "머리띠 글만 숨김" | C-42 R-7 | 열림 — 페이블 세션에서 |
| F-61-8 | **왼쪽 파일 목록이 없다** | 새 서버 길 — [server.js](../../../03-backend/navigator/server.js) · [API.md](../../../03-backend/navigator/API.md) · [app.js](../../../02-frontend/navigator/app.js) | 스토리보드 그림 | C-42 R-8 | 열림 — 페이블 세션에서(보안 먼저) |
| F-61-9 | **단계 칩에 '시작' · V.n이 없다** | [app.js](../../../02-frontend/navigator/app.js) `canvasPane` chips | 스토리보드 그림 | C-42 R-9 | 열림 — 페이블 세션에서 |
| F-61-10 | **관문이 '안 됨' · 빈칸 · 증거 없음을 막지 못한다** — [F-60](../fix-map.md)과 같은 일 | F-60 줄의 고칠 곳 | F-60 · 스토리보드 2 · 5 · 6 · 7단계 | C-42 R-10 | 열림 — 페이블 세션에서 |

**고치지 않는 것 [제안]:** 플로로 밑 기분 글(스토리보드에는 있지만 F-52에서 뺐다) · Windows에서 섬 창이 0.3초 움직이지 않는 것(Electron은 Mac에서만 창 움직임을 그린다, #209) · 브라우저로 열었을 때(서버 · 파일) 작업실이 섬 옆 네이비 판인 것(앱이 기준).
