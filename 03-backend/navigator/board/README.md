<!-- claude-drafted: 2026-10-27 -->
# archi-board 엔진 v1 사본 (C-45 문서 지도)

`board.js` · `board.css`는 이재엽의 공개 저장소 [gamercross/archi-board](https://github.com/gamercross/archi-board) `engine/v1/`을 복사한 것이다(MIT — `LICENSE`). 다른 점 하나: `board.css` 첫 줄의 `@import`(Google Fonts)를 뺐다 — 앱이 밖으로 요청하지 않게. 글꼴은 시스템 글꼴. **여기서 고치지 않는다** — 엔진을 고치려면 그 저장소에 PR을 내고, 좋아지면 이 사본을 바꾸는 PR을 낸다(이재엽 버튼 2026-10-27 "앱에 한 벌 넣기" — 인터넷 없이도 보이고 앱이 밖으로 요청을 보내지 않게).

엔진이 보이는 말(상자 종류 '데이터 객체 · Data Object', 선 이름 '…와 관련된다' 같은 ArchiMate 말)은 사본이라 그대로다 — 쉬운 말 규칙(FR-13)의 예외로 둔다.

쓰는 곳: `02-frontend/navigator/docmap.html`(작업실의 '문서 지도' 탭이 iframe으로 연다) — 데이터는 서버 `GET /api/docmap`([API.md 3-27](../API.md))이 [docmap.js](../docmap.js)로 만든다.

<!-- claude-drafted: 2026-10-30 --> **사본에 더한 줄(2026-10-30, C-67):** `board.js` 맨 끝 `window.ArchiBoard.centerOn(match, k)` — 고른 상자를 가운데에 두고 배율 k로. 원본에는 없다. `docmap.html`이 켠 뒤 지금 장 상자를 100%로 올리는 데 쓴다(처음 맞춤은 상자 이름이 안 읽혔다 — 1440에서 8.6px). 원본을 새로 받아 오면 이 줄을 다시 붙인다.
