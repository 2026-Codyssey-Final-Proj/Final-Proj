종류: 작은 고침
누가: 이재엽
무엇: 섬 화면 app.js(4,300줄 · 530KB)를 기능 조각 16개(02-frontend/navigator/app/)로 나눔 — 조각이 원본, app.js는 묶은 릴리즈 파일(동작 · 다른 시험 그대로). 묶기 · 되돌리기 도구 app-parts.js(app.js에만 있는 고침은 덮지 않고 멈춤)와 둘이 같은지 보는 시험 · PR 검사
건드린 곳: `02-frontend/navigator/`(app.js · app/ · app-parts.js, 담당 임유정 — 이 줄이 알림) · `04-tests/navigator/app-parts.test.js` · `04-tests/navigator/navigator.test.js`(git을 읽는 도구 허용) · `02-frontend/electron/prebuild.js`(조각은 앱 묶음에서 뺌) · `.github/workflows/app-parts.yml` · `.claude/rules/code.md` · `.gitattributes`
