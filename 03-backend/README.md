# 03-backend — 서버 · AI 연결 · 판정 규칙

**이 폴더는:** 화면 뒤에서 도는 코드다. "지금 몇 단계인지"를 판정하는 규칙, Claude를 부르는 곳, 이 컴퓨터에서만 열리는 작은 서버가 있다.

## 안에 뭐가 있나

| 폴더 | 무엇 |
|---|---|
| [`navigator/`](navigator/README.md) | 시연 화면의 서버 쪽. **켜는 법 · 내 키 설정 · 토큰 한도는 이 폴더 README** |

`navigator/`에서 자주 보는 파일:

| 파일 | 하는 일 |
|---|---|
| `navigator.js` | **판정 규칙** — 몇 단계인지, 무엇이 끝났는지, 다음 할 일. 화면도 이 파일을 그대로 불러 쓴다(화면에서 규칙을 다시 만들지 않는다) |
| `scenario.js` | 시연용 연습 예시(미리 만든 답) — 키 없이도 화면이 돈다 |
| `provider.js` | Claude를 부르는 **유일한** 곳 (구조 결정 기록 ADR-0003) |
| `server.js` | 이 컴퓨터(`127.0.0.1:4317`)에서만 열리는 서버 |
| `connect.js` · `hook.js` | Claude Code·Codex와 연결 — 작업하면 화면에 알림이 온다 |

## 처음이면

```bash
node 03-backend/navigator/server.js      # 브라우저에서 http://127.0.0.1:4317
```

키가 없어도 연습 예시로 돈다. 내 키로 쓰려면 [navigator/README.md](navigator/README.md)의 "내 키로 쓰기".

- **2026-10-17 이전에 `connect.js --apply`로 연결했다면** 한 번 다시 실행한다: `node 03-backend/navigator/connect.js --apply`. 옛 경로(`implementations/navigator-prototype`)에 걸린 훅이 새 경로로 바뀐다.
- `.env`(내 키)를 옛 폴더에 만들어 뒀다면 `03-backend/navigator/`로 옮긴다. `.env`는 저장소에 올라가지 않는다.

## 누가 · 관련

- 판정 규칙 · API: 이재엽 / 프로토타입 서버: 두승현(이어받음)
- 화면: [frontend](../02-frontend/README.md) · 시험: [tests](../04-tests/README.md) · 구조 결정: [ADR 목록](../01-docs/03-pattern-analysis/adr/README.md)

Claude 초안 (2026-10-17, 두승현 요청). 틀린 곳은 담당이 고친다.
