종류: 작은 고침
누가: 이재엽
무엇: PR #139 리뷰의 고침 셋 — F-37 서고로 잠수할 때 물이 화면 오른쪽을 다 덮지 못하던 것(판의 끝 자리 계산 `coverTransform` 한 줄), F-36 기본 화면에서 서재에 다녀오면 바이브 코딩 모드가 되던 것(돌아온 주소 `&back`은 장면이 아님 · 움직임 줄이기도 `&back` · 기본 화면이면 주소 끝을 통째로 지움), F-38 빠르게 펼쳤다 접으면 창이 움직임보다 먼저 줄어들던 것(마지막 움직임만 미룸을 풂). 셋 다 잡는 시험을 먼저 써서 지금 코드에서 실패하는 것을 본 뒤 고침(e2e `modes-flow.test.js` 새 파일, `dive.test.js` 숫자 시험)
건드린 곳: `02-frontend/navigator/`(app.js · dive.js, 담당 임유정 — 이 줄이 알림) · `02-frontend/library/`(library.js) · `04-tests/` · `01-docs/07-maintenance/`
