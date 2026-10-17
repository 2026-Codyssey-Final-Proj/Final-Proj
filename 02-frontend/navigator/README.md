# 02-frontend/navigator — 시연 화면

**이 폴더는:** 지금 시연에 쓰는 화면 파일이다. 마스코트 패널, 단계 안내, 이해 확인이 여기서 보인다.

## 안에 뭐가 있나

| 파일 | 무엇 |
|---|---|
| `index.html` | 화면 틀. 판정 규칙은 `../../backend/navigator/navigator.js`를 불러 쓴다 |
| `app.js` | 화면 동작 — 버튼, 단계 이동, 설계도 보기 |
| `app.css` | 모양(얼음 파랑 테마) |
| `seal.js` | 길잡이 물범 그림과 말풍선 |

## 여는 법 두 가지

| 방법 | 어떻게 | 무엇이 되나 |
|---|---|---|
| 서버로 | `node 03-backend/navigator/server.js` → http://127.0.0.1:4317 | 실제 AI 판정까지 |
| 파일로 바로 | 이 폴더의 `index.html`을 브라우저로 연다 | 연습 예시만 (서버·네트워크 없음) |

두 방법 모두 2026-10-17 폴더 정리 뒤 브라우저로 열어 확인했다.

## 누가 · 관련

- 담당: 임유정(프론트엔드) — 시험 기간 동안 두승현이 이어받아 진행
- 서버·켜는 법: [03-backend/navigator](../../03-backend/navigator/README.md) · 시험: [tests](../../04-tests/README.md) · 앞으로의 Next.js 계획: [02-frontend/README.md](../README.md)

Claude 초안 (2026-10-17, 두승현 요청). 틀린 곳은 담당이 고친다.
