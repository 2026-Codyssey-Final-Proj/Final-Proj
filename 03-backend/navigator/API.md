<!-- claude-drafted: 2026-10-18 — 이재엽의 요청("남은 요구사항 작업을 진행")으로 Claude가 썼다. 이슈 #7(API 계약) · 계약 시험 #19(담당 두승현)에 알린다. -->

# 로컬 API 약속 — navigator 서버

화면(`02-frontend/navigator/`)과 훅(`hook.js`)이 로컬 서버(`server.js`)를 **어떤 모양으로 부르고, 어떤 모양으로 받는지**의 약속이다.
코드와 이 문서가 다르면 **틀린 쪽을 고치고 시험을 같이 고친다** — 시험이 이 문서대로 답하는지 주소마다 확인한다.

| | |
|---|---|
| 판 | **v1.3 · 2026-10-24** — 작업 폴더를 앱이 알려 준다(3-16 · 3-18 · 3-19 "폴더 고르기", C-31) · 토큰 장부(3-5 `ledger` · `POST /api/usage/reset`, 3-16 `tokens` · `cost`). v1.2(2026-10-20) — FR-17 섬에서 허용 · 거절 · 일 넘기기: 승인 셋(3-13 · 3-14 · 3-15)과 일 넘기기 셋(3-16). v1.1(같은 날) AI 진행(C-12): `/api/event`가 PostToolUse를 받고 `GET /api/steps`(3-12). v1은 2026-10-18 |
| 기준 코드 | `server.js` — 시연 안전장치(#94: 확인 값·받은 글 가림·기록 비우기)와 판정 규칙(#96: 등급별 할 일)을 합친 상태. **2026-10-18 F-04: AI 네 주소도 확인 값**, 6단계 할 일 넷(F-03). 2026-10-20 AI 진행(`steps.js` · `hook.js` PostToolUse) |
| 시험 | [`04-tests/navigator/api-contract.test.js`](../../04-tests/navigator/api-contract.test.js) — 실제 AI를 부르지 않는다(5절). FR-17 주소는 [`task-api.test.js`](../../04-tests/navigator/task-api.test.js)(가짜 claude · 재생) |
| 바꾸는 법 | 이 문서·시험·`server.js`를 한 PR에서 같이 고친다. 화면이 읽는 칸이 바뀌면 화면 담당에게 알린다 |
| 다루지 않는 것 | 본 제품(Next `src/app/api/`)의 API — 아직 없다. 그때 이 약속을 출발점으로 쓴다 |

## 1. 한눈에

| 주소 | 누가 부르나 | 확인 | 성공(200) | 거절 |
|---|---|---|---|---|
| `GET` 화면 파일 (`/`, `/index.html` …) | 브라우저 | 출처 | 파일 + html이면 확인 값 쿠키 | 403 · 404 |
| `POST /api/event` | 훅(`hook.js`) | 출처 · 확인 값(머리글) | `{ok, seq}` | 403 · 413 · 400 |
| `GET /api/events?since=N` | 화면(2초마다) | 출처 · 확인 값(쿠키) | `{ok, latest, events[]}` | 403 · 404 |
| `GET /api/steps?since=N` | 섬의 AI 진행 판(2026-10-20 C-12) | 출처 · 확인 값(쿠키) | `{ok, latest, sessions[]}` | 403 · 404 |
| `POST /api/events/clear` | 사람(curl) · 화면 '알림 기록 비우기' | 출처 · 확인 값(머리글 · 쿠키) | `{ok, cleared}` — 한 일(3-12)도 비운다 | 403 |
| `GET /api/usage` | 사람(주소창·curl) | 출처 | `{ok, provider, model, host, compat, used, budget, state, …}` | 403 |
| `GET /api/setup` | 화면 처음 설정, 앱(옛 서버 알아보기) | 출처 | `{ok, provider, apiKey, relay, claude:{found, version, signedIn}, replay, build}` | 403 |
| `POST /api/setup/check` | 화면 처음 설정 "연결 확인하기" | 출처 · 확인 값(쿠키) | `{ok, provider, tokens}` (재생 중이면 `replay: true`) | 403 · 502 |
| `POST /api/judge` | 화면 "어디쯤인지 살펴보기" | 출처 · 확인 값(쿠키) | `{ok, judgement:{stage, reason, criteria[], next}, tokens}` | 403 · 413 · 400 · 502 |
| `POST /api/answer` | 화면 "물어보기" | 출처 · 확인 값(쿠키) | `{ok, answer, tokens}` | 403 · 413 · 400 · 502 |
| `POST /api/draft` | 화면 설계도 "초안 받기" | 출처 · 확인 값(쿠키) | `{ok, draft, say, tokens}` | 403 · 413 · 400 · 502 |
| `POST /api/review` | 화면 설계도 "다시 봐 주세요" | 출처 · 확인 값(쿠키) | `{ok, review:{say, good[], fix[], ready}, tokens}` | 403 · 413 · 400 · 502 |
| `POST /api/approval` | 허락 훅(`approve-hook.js`) — **답을 기다린다**(FR-17, 2026-10-20) | 출처 · 확인 값(머리글) | `{ok, id, decision: "allow"\|"deny"\|"none"}` — 결정이 오거나 90초가 지나면 | 403 · 413 · 400 · 429 |
| `GET /api/approvals` | 섬(2초마다) | 출처 · 확인 값(쿠키) | `{ok, items[]}` 기다리는 승인 카드 | 403 |
| `POST /api/approvals/decide` | 섬 "허용" · "거절" | 출처 · 확인 값(쿠키) | `{ok, id, decision}` | 403 · 404 · 409 · 400 |
| `POST /api/task/tidy` | 섬 "요구 문장으로 정리" | 출처 · 확인 값(쿠키) | `{ok, lines[], say, tokens}` | 403 · 413 · 400 · 502 |
| `POST /api/task/start` | 섬 "허락하고 넘기기" | 출처 · 확인 값(쿠키) | `{ok, project, task:{state, project, at, code}}` — 연결한 폴더에서 `claude -p`를 연다 | 403 · 413 · 400 · 409 · 502 |
| `GET /api/task` | 섬 | 출처 · 확인 값(쿠키) | `{ok, task}` 넘긴 일의 상태(없으면 null) | 403 |
| `POST /api/quest` | 섬 — 퀘스트를 만들 때(C-22, 2026-10-21) | 출처 · 확인 값(쿠키) | `{ok, quest:{desc, why, qa[]}, tokens}` | 403 · 413 · 400 · 502 |
| 그 밖의 주소·방법 | — | 출처 | — | 404 `없는 주소` |

## 2. 공통 약속

- **주소:** `http://127.0.0.1:4317` (`NAV_PORT`로 바꾼다). 서버는 `127.0.0.1`에서만 듣는다 — 다른 컴퓨터는 닿지 않는다.
- **JSON만:** 요청 본문은 JSON 글이다(`Content-Type` 머리글은 보지 않는다). 응답은 화면 파일을 빼면 모두 `application/json; charset=utf-8`.
- **`ok` 칸이 결과다.** 성공은 `{ "ok": true, … }`(200), 거절은 언제나 **두 칸** `{ "ok": false, "reason": "…" }`. 화면(`app.js` `callAI`)은 상태 코드가 아니라 `ok`를 읽고 `reason`을 그대로 보여 준다 — 상태 코드는 사람과 시험이 원인을 가르는 데 쓴다.
- **물음표 뒤:** API 주소는 `?` 뒤를 떼고 본다(`/api/events`만 `since`를 읽는다). **화면 파일은 정확한 경로만** — `/app.js?v=2`는 404.
- **본문 크기:** JSON 글 전체가 **40,000자까지**(`MAX_BODY`, 자바스크립트 글자 단위 — 한글·영문 한 글자가 1, 이모지는 2). 넘으면 413. 넘은 본문도 끝까지 받은 뒤 답한다(중간에 끊으면 보내던 쪽이 이유를 못 받는다).
- **400·403·404·413이면 AI를 부르지 않는다** — 토큰을 쓰지 않는다. 502는 AI를 부르려 한 뒤에만 나온다.

### 2-1. 요청을 판정하는 순서 ([기록·보안 기준](../../.claude/rules/security-records.md) 6-3)

위에서부터 보고, 처음 걸린 곳에서 거절한다.

| 층 | 묻는 질문 | 코드 | 거절 | 왜 이 응답인가 |
|---|---|---|---|---|
| 인증 ① 출처 | 이 컴퓨터의 이 서버 주소로 왔나? `Host`가 `127.0.0.1:포트`·`localhost:포트`이고, `Origin`이 있으면 `http://`+그 둘 중 하나 | `allowed()` | **403** `이 컴퓨터의 화면에서만 부를 수 있음` | 다른 웹페이지가 내 키·구독으로 Claude를 부르거나(Origin) 주소 바꿔치기로 들어오지(Host) 못하게. 존재를 숨길 까닭이 없어 404가 아니라 403 |
| (화면 파일) | 목록에 있는 파일인가(GET) | `FILES` | — | 있으면 여기서 내준다(3-1) |
| 인증 ② 확인 값 — 알림 네 주소(`/api/steps`는 2026-10-20) + AI 네 주소(2026-10-18 F-04) | 서버가 만든 값을 갖고 있나? | `hasToken()` | **403** `확인 값이 없거나 맞지 않음 — …` | 남이 가짜 알림을 넣거나 대화 글을 읽지 못하게. 방법(메서드)이 틀려도 값부터 본다. 다시 로그인할 길을 주는 401이 아니다 — 값은 파일·쿠키로만 받는다 |
| 권한(역할) · 소유권 | — | — | — | **없다.** 한 사람의 컴퓨터에서 한 사람이 쓰는 서버라 역할도 자원의 주인도 없다. 서비스로 낼 때 채울 칸(기록·보안 기준 5절) |
| 주소 | 있는 주소·방법인가 | `handle()` | **404** `없는 주소` | 본문을 읽기 전에 거절한다 |
| 크기 · 형식 | 40,000자 안인가, JSON인가 | `readJson()` | **413** `보낸 글이 너무 김 — 40,000자까지` · JSON이 아니면 400(주소별 이유) | — |
| 짝 확인(FR-17, 2026-10-20) | 결정이 **기다리는 요청**과 짝이 맞나 — `id`가 기다리는 표에 있나(아니면 **404** `기다리는 요청이 아님` — 늦었거나 이미 정해짐), `sig`(세션 · 도구 · 입력의 지문)가 같나(아니면 **409** `짝이 맞지 않음`) | `decideApproval()` | 404 · 409 | 늦은 결정 · 다른 요청의 결정을 버린다(요구서 C-4 ③, 장부 W-25 · W-26). 존재를 숨길 까닭은 없지만 "그 요청은 이제 없다"가 404의 뜻이다 |
| 사업 조건 | 칸이 맞나(글·등급·단계·질문·설계도). FR-17: 되돌리기 어려운 일은 `sure:true`가 있어야 허용(**409** `한 번 더`), 넘긴 일이 진행 중이면 **409**, 연결한 폴더를 모르면 **400** | 주소별 | **400** (주소별 이유, 3절) | 고칠 칸을 쉬운 말로 알린다 |
| AI 답 | AI가 답했나, 모양이 맞나 | `ask()` · `provider.js` | **502** (2-2) | 서버 뒤의 AI가 실패했다는 뜻. 지어낸 답을 주지 않는다 |

### 2-2. AI가 실패하면 — 502

`reason`은 아래 중 하나다. 키 값·보낸 글·AI 오류 원문은 싣지 않는다(`provider.js`). 502 응답에는 `tokens` 칸이 없다 — 형식이 틀려 버린 답도 토큰은 썼을 수 있고, API 키로 불렀다면 그건 사용량(3-5)에 쌓인다.

| 이유(앞부분) | 언제 |
|---|---|
| `판정 형식이 맞지 않음` · `답 형식이 …` · `초안 형식이 …` · `다시 봐 준 결과의 형식이 …` | AI는 답했지만 서버의 모양 확인(3-6~3-9)을 못 넘었다 |
| `API 키가 맞지 않거나 권한이 없어요 (401)` · `요청이 받아들여지지 않았어요 (400)` · `잠시 너무 많이 불렀어요 (429)` · `AI에 연결하지 못했어요` · `API 호출 도구가 없어요 — … npm install` | API 키로 부를 때의 실패 |
| `이 키의 토큰 한도에 다다랐어요` · `'dev' 몫(…토큰)을 다 썼어요` · `테스터 'A'의 몫…` · `NAV_PURPOSE '…'는 예산에 없어요` | 한도(`NAV_TOKEN_BUDGET`·`NAV_PLAN`) — 부르지 않고 멈춘다 |
| `Claude가 이 글에는 답하지 않았어요` · `답이 길어서 잘렸어요` · `Claude가 정해진 형식으로 답하지 않음` | 답이 거절·잘림·JSON 아님 |
| `시간 초과` · `claude 명령을 찾지 못함 …` · `Claude 응답을 읽지 못함` | 키 없이 `claude -p`로 부를 때(90초) |
| `녹화에 없는 요청이에요 …` | 재생(`NAV_REPLAY`) 중인데 녹화에 없는 요청 — 부르지 않는다 |

### 2-3. 남지 않는 것

| 무엇 | 어디에도 없는 곳 |
|---|---|
| **키 값** | `/api/usage`, 거절 이유, 녹화 파일, 사용량 파일, 시작 로그. `/api/usage`는 보내는 곳의 **호스트만** 알린다(주소의 경로·쿼리 없음) |
| **보낸 글**(작업 글·질문·설계도) | 사용량 파일(`~/.navigator-usage.json`)은 토큰 수와 통·테스터 이름만. 녹화 파일(`NAV_RECORD`)은 요청의 지문(sha256 앞 16자리)과 **AI의 답**만 — 요청문은 없다. 단 AI의 답에는 판정 근거(`evidence`)처럼 보낸 글에서 따온 짧은 구절이 들어간다. 그래서 녹화는 연습 예시 글로만 한다(`record-demo.js`) — 서버를 `NAV_RECORD`로 켜 두면 사람이 직접 쓴 글의 답도 녹화되니 시연 녹화 때만 켠다 |
| **알림 글** | 디스크. 메모리에만 두고(서버를 끄면 사라진다) 저장하기 전에 가린다(3-2) |
| **확인 값** | 로그·페이지 글·응답 본문. 홈 폴더 파일(나만 읽기 600)과 `HttpOnly` 쿠키에만 있다 |

## 3. 주소별

예시는 연습 예시 "동아리 행사 등록 앱"(`scenario.js`)이다. 응답 예시는 연습 예시의 미리 만든 답을 AI 답 자리에 넣어 **재생한 실제 서버 출력**이라 `tokens`가 0이다(진짜 AI면 판정 한 번에 평균 4,729 — Claude Code 로그인으로 잰 값, 2026-10-24 [README](README.md)).

### 3-1. 화면 파일 — `GET`

- **누가:** 브라우저. 화면은 **서버 주소로 연다**(`http://127.0.0.1:4317`) — 파일로 연 화면(`file://`)은 알림을 받지 못한다.
- **경로:** `server.js`의 `STATIC` 목록에 있는 것만. 같은 파일을 세 모양으로 부를 수 있다(화면끼리 `../library/x`처럼 부르기 때문).

| 주소 | 파일 |
|---|---|
| `/` · `/<파일>` · `/navigator/<파일>` | `02-frontend/navigator/` (`/`는 `index.html`) |
| `/index.html` | `02-frontend/index.html` (시연 입구) |
| `/library/<파일>` | `02-frontend/library/` (지식 은하 `sky.*`는 2026-10-19부터 내주지 않음) |
| `/02-frontend/<화면>/<파일>` | 위와 같은 파일 |
| `/03-backend/navigator/{navigator.js, scenario.js, sensitive.js, …}` | 화면이 같이 쓰는 규칙 (공유 규칙 `/03-backend/share/`는 2026-10-19에 지움) |
| `/01-docs/04-pattern-implementation/bookmark-constellation-mock.html` | 입구의 설계 목업 링크 |

- **성공:** 200, 파일 그대로. `Content-Type`은 `text/html` · `text/css` · `text/javascript` + `; charset=utf-8`.
  **html이면** 두 머리글을 더한다:
  `Set-Cookie: nav_event_token=<확인 값>; Path=/api; HttpOnly; SameSite=Strict` · `Cache-Control: no-store`.
  쿠키는 `Path=/api`라 브라우저가 `/api/…` 요청(알림 · AI 주소)에만 싣는다. 화면 파일 · 스크립트에는 실리지 않는다(2026-10-18 F-04로 `/api/events`에서 넓힘).
  **그 밖의 파일**(스크립트 · 스타일)은 `Cache-Control: no-cache` — 고친 뒤에도 앱 · 브라우저가 옛 파일을 꺼내 쓰지 않게 늘 다시 묻는다(2026-10-19).
- **거절:** 403 출처 · 목록에 없는 경로, `?`가 붙은 경로, GET이 아닌 방법 → 404 JSON `없는 주소`.
- **약속:** 서버가 내주는 페이지가 `src`·`href`로 부르는 이 컴퓨터의 파일은 **모두** 목록에 있다(시험이 페이지를 읽어 확인한다).

### 3-2. `POST /api/event` — 훅이 알림을 보낸다

- **누가:** `hook.js` — Claude Code·Codex 훅이 요청을 받을 때(`UserPromptSubmit`)와 작업을 마칠 때(`Stop`). 실패해도 훅은 조용히 끝난다.
- **확인:** 출처 + 확인 값 머리글 `X-Nav-Token: <~/.navigator-event-token의 값>`. 머리글이 있으면 **머리글만** 본다(쿠키는 보지 않는다).
- **본문:**

| 칸 | 타입 | 꼭 | 뜻 |
|---|---|---|---|
| `hook_event_name` | `"UserPromptSubmit"` · `"Stop"` | ✓ | 그 밖이면 400 |
| `session_id` | 글 | | 세션 구분. 도구(`tool`)마다 따로 모은다 |
| `cwd` | 글 | | 작업 폴더 — 마지막 이름만 `project`로 쓴다 |
| `prompt` | 글 | | 사용자의 요청 |
| `last_assistant_message` | 글 | | AI의 마지막 답 |
| `tool` | `"codex"` · 그 밖 | | `"codex"`가 아니면 Claude Code |

- **서버가 하는 일:** 말을 **저장하기 전에 가린다**([sensitive.js](sensitive.js)의 패턴 — 키 모양·비밀번호 대입·주민번호는 `[비밀값]`, 이메일·전화·IP는 `[… 가림]`). 세션마다 최근 말 20개, 세션 10개, 알림 20개를 **메모리에만** 둔다.
  `UserPromptSubmit`이면 그 세션의 상태를 `"working"`, `Stop`이면 `"done"`으로 적는다(3-12의 `sessions[].state`, 2026-10-20).
- **성공:** `{ "ok": true, "seq": 7 }` — `seq`는 이 알림의 번호(정수, 하나씩 는다).
- **거절:** 403 출처 · 403 확인 값 · 413 · 400 `알 수 없는 알림`(JSON이 아님, `hook_event_name`이 다름).

```jsonc
// 요청 (X-Nav-Token 머리글과 함께)
{ "hook_event_name": "UserPromptSubmit", "session_id": "demo-1", "cwd": "/Users/me/club-app", "prompt": "행사 목록 화면 만들어 줘", "tool": "claude" }
// 응답
{ "ok": true, "seq": 1 }
```

<!-- claude-drafted: 2026-10-20 — AI 진행(C-12, 이재엽 "이건 바이브 코딩이 아니야") -->
#### 3-2-1. 도구를 쓴 뒤 — `hook_event_name: "PostToolUse"` (2026-10-20)

Claude Code가 도구(Read · Edit · Bash …)를 쓸 때마다 훅이 불린다. `hook.js`가 [steps.js](steps.js) `fromHook`으로 **이름 · 첫 줄 · 줄 수만** 뽑아 보내고, **답을 기다리지 않는다**(요청 상한 300ms — Claude Code를 느리게 하지 않는다).

| 칸 | 타입 | 꼭 | 뜻 |
|---|---|---|---|
| `hook_event_name` | `"PostToolUse"` | ✓ | |
| `session_id` · `cwd` · `tool` | 3-2와 같음 | | 세션은 `tool:session_id`로 나눈다 |
| `tool_name` | 글 | | 도구 이름(`Read` · `Edit` · `MultiEdit` · `Write` · `Bash` · `Grep` · `Glob` · 그 밖). `step.what`이 비면 이것을 보인다 |
| `step.verb` | `"읽었어요"` · `"고쳤어요"` · `"만들었어요"` · `"실행했어요"` · `"찾았어요"` · `"했어요"` | | 표에 없는 말은 `"했어요"`로 |
| `step.what` | 글(80자까지) | | Read · Edit · Write는 파일 경로(작업 폴더 안이면 상대 경로, 밖이면 이름만), Bash는 명령 첫 줄, Grep · Glob은 찾을 말, 그 밖은 `""` |
| `step.add` · `step.del` | 0 이상 정수 | | 고친 줄 수 — Edit · MultiEdit는 새 글 · 옛 글의 줄 수, Write는 글의 줄 수. 아니면 0 |

- **넣지 않는 것(훅이 싣지 않고, 서버도 받으면 버린다):** `tool_input`(파일 내용 `content`, 고친 글 `old_string` · `new_string`, 명령의 둘째 줄부터) · `tool_response`(도구 결과) · `prompt` · `last_assistant_message`. 시험 [`hook-steps.test.js`](../../04-tests/navigator/hook-steps.test.js)가 hook.js를 실제로 돌려 본문에 그 글이 없는지 본다.
- **서버가 하는 일:** `what`을 저장하기 전에 가리고(S4 — `export API_KEY=…` 같은 명령) 80자로 자른다. 세션마다 최근 **50줄**, 세션 **10개**, **메모리에만**. 알림 목록(3-3)에는 넣지 않고 번호도 따로 센다. 판정을 부르지 않고 토큰을 쓰지 않는다.
- **성공:** `{ "ok": true, "seq": 12 }` — 한 일의 번호(알림 번호와 다른 줄). **거절:** 3-2와 같다.

```jsonc
// 요청 — Edit 도구를 쓴 뒤
{ "hook_event_name": "PostToolUse", "session_id": "demo-1", "cwd": "/Users/me/club-app", "tool": "claude", "tool_name": "Edit",
  "step": { "verb": "고쳤어요", "what": "src/signup.js", "add": 12, "del": 3 } }
```

### 3-3. `GET /api/events?since=N` — 화면이 새 알림을 묻는다

- **누가:** 화면(`app.js` `poll`, 2초마다, 쿠키로). 처음에는 `since=0`으로 기준 번호만 잡고(지난 알림을 다시 띄우지 않는다), 그다음부터 받은 `latest`를 보낸다.
- **확인:** 출처 + 확인 값(쿠키 `nav_event_token` 또는 머리글).
- **요청:** `since` — 이 번호보다 뒤의 알림만. 없거나 숫자가 아니면 0(남아 있는 것 전부).
- **성공:**

| 칸 | 타입 | 뜻 |
|---|---|---|
| `latest` | 정수 | 지금까지 매긴 마지막 번호. 기록을 비워도 되돌리지 않는다 |
| `events` | 목록(최대 20) | `seq`가 `since`보다 큰 알림, 오래된 것부터 |
| `events[].seq` | 정수 | 알림 번호 |
| `events[].at` | 숫자 | 받은 시각(밀리초, `Date.now()`) |
| `events[].kind` | `"prompt"` · `"stop"` | 요청 받음 · 작업 마침 |
| `events[].tool` | `"claude"` · `"codex"` | 어느 도구인지 |
| `events[].project` | 글 | 작업 폴더의 마지막 이름(가림 규칙 적용) |
| `events[].work` | 글 | 그 세션의 최근 대화. 줄마다 `[사용자] …` · `[Claude] …` · `[Codex] …`. 최근 말 20개 안에서 **글자 합 4,000자까지**(줄바꿈은 세지 않는다) — 넘치면 오래된 말부터 버리고, 경계에 걸린 말은 앞부분만 남긴다 |

- **화면이 읽는 칸:** `ok`, `latest`, 마지막 알림의 `at`·`project`·`tool`·`work`·`kind`.
- **거절:** 403 출처 · 403 확인 값 · GET이 아니면 404(확인 값을 본 뒤).

```jsonc
// GET /api/events?since=1  (3-2의 요청 뒤에 Stop 알림이 하나 더 왔을 때)
{ "ok": true, "latest": 2, "events": [
  { "seq": 2, "at": 1792316180211, "kind": "stop", "tool": "claude", "project": "club-app",
    "work": "[사용자] 행사 목록 화면 만들어 줘\n[Claude] 행사 목록 화면을 만들었어요. 날짜순으로 보여 줘요." } ] }
```

### 3-4. `POST /api/events/clear` — 기록 비우기

- **누가:** 사람(시연 전, [README](README.md) "기록 비우기"의 curl 한 줄). 화면에는 아직 버튼이 없다.
- **확인:** 출처 + 확인 값. **본문:** 없음(보내도 읽지 않는다).
- **성공:** `{ "ok": true, "cleared": 3 }` — 지운 알림 수. 세션 대화도 같이 지운다. **한 일(3-12)과 세션 상태도 비운다**(2026-10-20 — `cleared`에는 세지 않는다). `latest`는 그대로다(열어 둔 화면이 새 알림을 놓치지 않게).
- **거절:** 403 출처 · 403 확인 값.

### 3-5. `GET /api/usage` — 어느 AI로, 얼마나 썼나

- **누가:** 사람(주소창·curl), 그리고 화면의 한곳에서 보기 토큰 칸(2026-10-18 F-12 — 서버로 열었을 때, 그 탭을 열거나 AI를 부른 뒤).
- **확인:** 출처만. **요청:** 없음.
- **성공:** 아래 칸만 있다. 키 값·주소의 경로·글 내용은 없다.

| 칸 | 타입 | 뜻 |
|---|---|---|
| `provider` | `"api"` · `"cli"` | 내 API 키로 · 이 컴퓨터의 `claude -p`로 |
| `model` | 글 | 부를 모델 |
| `host` | 글 | 보내는 곳의 호스트만(예: `api.anthropic.com`) |
| `compat` | 참/거짓 | 호환 모드(중계 서버) |
| `used` | 숫자 | API 키로 쓴 토큰 수(`claude -p`는 세지 않는다) |
| `budget` | 숫자 · `null` | 전체 한도(없으면 `null`) |
| `state` | `"ok"` · `"warn"` · `"full"` | 한도의 80% 이상이면 warn, 100%면 full |
| `buckets` | `{통: {used, limit}}` | `NAV_PLAN`이 있을 때만 |
| `testers` | `{이름: 토큰}` | 테스터별 기록이 있을 때만 |
| `replay` · `record` | `true` | 재생·녹화 중일 때만 |
| `ledger` | 객체 | **토큰 장부**(2026-10-24, [tokens.js](tokens.js)) — 아래 |

```jsonc
{ "ok": true, "provider": "cli", "model": "claude-opus-5-5", "host": "api.anthropic.com", "compat": false,
  "used": 0, "budget": null, "state": "ok", "replay": true,
  "ledger": { "since": 1761300000000, "total": { "count": 2, "tokens": 3000, "cost": 0.0234 },
    "kinds": { "floe": { "count": 1, "tokens": 1800, "cost": 0 }, "task": { "count": 1, "tokens": 1200, "cost": 0.0234 } },
    "runs": [{ "at": 1761300100000, "kind": "task", "label": "저장소 만들기", "input": 0, "output": 1200, "cacheWrite": 0, "cacheRead": 0, "total": 1200, "cost": 0.0234 }] } }
```

<!-- claude-drafted: 2026-10-24 — 이재엽 "테스트를 진행하면서 토큰값도 계산을 할거야" · 버튼 "이번 PR에 같이" -->
- **토큰 장부(`ledger`)** — 한도(`used` · `budget` — 내 API 키의 예산)와 **따로** 센다. `floe` = Floe의 AI 호출(판정 · 퀘스트 · 정리 · 연결 확인 — 구독(`cli`)이어도 Claude Code가 알려 준 usage), `task` = Claude Code에 맡긴 일(3-16 · 3-19 — `claude -p --output-format json`의 결과에서). `cost`는 Claude Code가 알려 준 `total_cost_usd`의 합 — API 키로 부른 Floe의 AI는 비용을 모르므로 0(지어내지 않는다), 줄마다는 `null`. `runs`는 새것부터 30줄, `label`은 정해진 한국어 이름만(그 밖은 `AI`). 보낸 글 · 답 · 폴더 이름은 담지 않는다. 사용자가 터미널에서 직접 연 Claude Code는 세지 않는다(Floe가 보지 못한다). 파일은 `NAV_TOKENS_FILE`, 없으면 `NAV_USAGE_FILE` 옆 `-tokens.json`, 없으면 `~/.navigator-tokens.json`(나만 읽기 600). 재생 중에는 쌓이지 않는다.
- **`POST /api/usage/reset`** — 장부를 0부터(`since`가 지금). 본문 없음, **확인 값**이 있어야 한다(지우는 일이라). 답 `{ ok: true, ledger }`. 화면: 설정의 **토큰** 칸 '새로 재기' — 테스트를 시작할 때.

### 3-6. `POST /api/judge` — 지금 단계에서 어디쯤인지

- **누가:** 화면 — "어디쯤인지 살펴보기"(`judge`), 선택지를 고른 뒤 다시 살펴보기(`decide`), 작업을 마친 알림에 자동 살펴보기(`onEvent`).
- **확인:** 출처 + 확인 값(화면은 쿠키 `nav_event_token`, 그 밖에는 머리글 `X-Nav-Token`) — 2026-10-18 F-04.
- **본문:**

| 칸 | 타입 | 꼭 | 뜻 |
|---|---|---|---|
| `text` | 글(공백만은 안 됨) | ✓ | 작업 글 |
| `stage` | 정수 0~7 | ✓ | 지금 단계 — **코드가 정한다.** AI가 다른 단계를 말해도 이 값을 쓴다 |
| `tier` | `"Full"` · `"Xpress"` · `"Lite"` · `null` | | 규모 등급. 없거나 `null`이면 Full(즉시 처리는 밟을 단계가 없어 받지 않는다) |

- **서버가 하는 일:** `judgePrompt(text, stage, tier)`로 묻고(스키마 `JUDGE_SCHEMA`), `parseJudgement`로 확인한 것만 준다.
- **성공:** `{ ok, judgement, tokens }`

| 칸 | 타입 | 약속 |
|---|---|---|
| `judgement.stage` | 정수 | 보낸 `stage` 그대로 |
| `judgement.reason` | 글(비지 않음) | 플로로 말풍선에 그대로 나온다. 길이는 요청문으로 부탁할 뿐 서버가 자르지 않는다 |
| `judgement.criteria` | 목록 | **개수 = `criteriaFor(stage, tier).length`**, 순서는 `navigator.js` `STAGES` 그대로 |
| `criteria[].text` · `term` | 글 | **서버 데이터**(AI가 보낸 문장은 쓰지 않는다). 용어가 없으면 `term`은 `""` |
| `criteria[].met` | 참/거짓 | AI가 했다고 하고 **근거 구절이 보낸 글에 실제로 있을 때만** 참 |
| `criteria[].evidence` | 글 | 근거 구절(띄어쓰기·줄바꿈을 한 칸으로 줄인 것). 글에 없으면 `""`. `met`이 거짓이어도 글에 있는 구절이면 남을 수 있다 |
| `judgement.next.what` · `why` · `question` · `action` | 글(비지 않음) | 다음에 할 일 하나 · 이유 · 사용자가 정할 질문 · 방법 |
| `judgement.next.options` | 글 2~4개 | 질문의 선택지 — 고르는 건 사용자 |
| `tokens` | 정수 | 이번 호출에 쓴 토큰(입력+출력+캐시). 재생이면 0 |

  단계별 할 일 개수(2026-10-18 확정 후보 — 바뀌면 `navigator.js`가 기준이고 시험은 거기서 센다):

  | 단계 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
  |---|---|---|---|---|---|---|---|---|
  | Full · Xpress · Lite | 4·4·4 | 5·4·2 | 5·5·5 | 5·5·5 | 4·4·4 | 5·4·4 | 3·3·3 | 5·5·4 |

- **거절:** 403 출처 · 413 · 400 `작업 내용이 비어 있음`(JSON이 아님, `text`가 없거나 비거나 글이 아님) · 400 `모르는 등급` · 400 `지금 단계가 없음`(정수 0~7이 아님 — `"2"` 같은 글자도) · 502 `판정 형식이 맞지 않음`(할 일 개수가 등급과 다름, 선택지가 1개 이하·5개 이상, 빈 칸) · 502 공급자의 이유(2-2).

```jsonc
// 요청
{ "text": "동아리 행사 등록 앱을 만들고 있어요. 회원이 행사를 보고 신청하는 앱이에요.\n필요한 기능을 6개 문장으로 썼어요. 예) '회원이 신청 버튼을 누르면, 앱은 신청서를 보여 준다.'\n'등록은 빠르게 끝나야 한다'는 아직 얼마나 빨라야 하는지 정하지 않았어요. 무엇부터 만들지도 아직 안 정했어요.",
  "stage": 2 }
// 응답 (criteria 5개 중 앞의 2개만 옮김)
{ "ok": true, "judgement": {
    "stage": 2,
    "reason": "기능 문장은 잘 써 두셨어요! 아직 숫자와 순서가 없어서 2단계를 하는 중이에요.",
    "criteria": [
      { "text": "기능을 '~하면, 앱은 ~한다' 문장으로 쓰기", "term": "EARS", "met": true, "evidence": "필요한 기능을 6개 문장으로 썼어요" },
      { "text": "'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')", "term": "Planguage", "met": false, "evidence": "" }
    ],
    "next": { "what": "'빠르게'를 숫자로 바꾸기",
      "why": "'빠르게'는 사람마다 생각이 달라서, 다 만든 뒤에 됐는지 안 됐는지 알 수 없어요",
      "question": "'등록은 빠르게'는 얼마나 빨라야 할까요?",
      "action": "하나를 고르면 작업 글에 적어 두고 다시 살펴볼게요",
      "options": ["신청서를 연 뒤 30초 안에 끝나기", "버튼 3번 안에 끝나기", "아직 모름 — 회원에게 물어보고 정하기"] } },
  "tokens": 0 }
```

### 3-7. `POST /api/answer` — 헷갈린 것을 묻는다

- **누가:** 화면 — 넘어가기 전 확인에서 "잘 모르겠어요"를 고른 뒤 "물어보기"(`answer`).
- **확인:** 출처 + 확인 값(화면은 쿠키 `nav_event_token`, 그 밖에는 머리글 `X-Nav-Token`) — 2026-10-18 F-04.
- **본문:**

| 칸 | 타입 | 꼭 | 뜻 |
|---|---|---|---|
| `text` | 글 | ✓ | 작업 글 |
| `stage` | 정수 0~7 | ✓ | 마친 단계 |
| `question` | 글 | ✓ | 사용자의 질문 |
| `hard` | 글 목록 | | 헷갈린다고 고른 할 일 문장. 목록이 아니면 고르지 않은 것으로 본다 |
| `tier` | 3-6과 같음 | | 검사만 한다 — 답 요청문에는 쓰지 않는다 |

- **성공:** `{ "ok": true, "answer": "<글, 비지 않음>", "tokens": 0 }` — 다섯 문장 이내를 요청문으로 부탁한다.
- **거절:** 403 · 413 · 400 `작업 내용이 비어 있음` · `모르는 등급` · `지금 단계가 없음` · `질문이 비어 있음`(이 순서로 본다) · 502 `답 형식이 맞지 않음`(답이 없거나 글이 아님) · 502 공급자의 이유.

```jsonc
// 요청 (text는 3-6과 같은 글)
{ "stage": 2, "hard": ["'빠르게' 같은 애매한 말을 숫자로 바꾸기 (모르면 '아직 모름')"], "question": "'30초 안에'면 충분히 빠른 건가요?", "text": "동아리 행사 등록 앱을 만들고 있어요. …" }
// 응답
{ "ok": true, "answer": "'빠르게'는 사람마다 생각이 달라서 됐는지 확인할 수 없어요. '30초 안에 제출'처럼 숫자로 쓰면 나중에 실제로 재 볼 수 있어요. 아직 모르면 '아직 모름'과 언제 정할지를 적어요.", "tokens": 0 }
```

### 3-8. `POST /api/draft` — 설계도 초안 (FR-3)

- **누가:** 화면 설계도 탭 "초안 받기"(`draft`). 초안은 AI, 고치기·확정은 사람.
- **확인:** 출처 + 확인 값(화면은 쿠키 `nav_event_token`, 그 밖에는 머리글 `X-Nav-Token`) — 2026-10-18 F-04.
- **본문:** `text` 글 ✓ · `stage` 정수 ✓ — **설계도가 있는 1~4단계만** · `tier`(3-6과 같음 — 요청문의 "챙길 것"이 그 등급의 할 일이 된다).
- **성공:** `{ ok, draft, say, tokens }` — `draft`는 글(**4,000자까지**, 넘으면 서버가 자른다), 모르는 자리는 `[채워 주세요: 무엇을]`. `say`는 건네는 말(빈칸이 몇 개인지).
- **거절:** 403 · 413 · 400 `작업 내용이 비어 있음` · `모르는 등급` · `설계도를 만드는 단계가 아님`(0·5·6·7단계, 정수가 아님) · 502 `초안 형식이 맞지 않음`(`draft`나 `say`가 비었음) · 502 공급자의 이유.

```jsonc
// 요청 (text는 3-6과 같은 글)
{ "stage": 2, "text": "동아리 행사 등록 앱을 만들고 있어요. …" }
// 응답 (draft는 앞 세 줄만 옮김)
{ "ok": true,
  "draft": "꼭 필요한 기능 목록 — 동아리 행사 등록 앱\n\n1. 회원이 신청 버튼을 누르면, 앱은 신청서를 보여 준다. (꼭 필요)\n…\n4. 마감 [채워 주세요: 몇 시간] 전이 되면, 앱은 신청한 회원에게 마감 알림을 보낸다. (있으면 좋음)\n…",
  "say": "초안을 써 봤어요. 빈칸 3개는 직접 채워 주세요.", "tokens": 0 }
```

### 3-9. `POST /api/review` — 고친 설계도를 다시 봐 준다

- **누가:** 화면 설계도 "다시 봐 주세요"(`review`). 대신 고쳐 쓰지 않고 고칠 곳과 방향만 말한다.
- **확인:** 출처 + 확인 값(화면은 쿠키 `nav_event_token`, 그 밖에는 머리글 `X-Nav-Token`) — 2026-10-18 F-04.
- **본문:** `text` 글 ✓ · `stage` 정수 1~4 ✓ · `doc` 글 ✓(사용자가 고친 설계도) · `tier`(3-8과 같음).
- **성공:** `{ ok, review, tokens }`

| 칸 | 타입 | 약속 |
|---|---|---|
| `review.say` | 글(비지 않음) | 플로로의 말 |
| `review.good` | 글 0~3개 | 잘한 점(넘치면 앞의 3개) |
| `review.fix` | 0~3개 `{where, why, hint}` | 고칠 곳 — 설계도에서 따온 구절 · 이유 · 방향. 그 밖의 칸은 버린다 |
| `review.ready` | 참/거짓 | **고칠 곳이 없을 때만** 참(AI가 참이라고 해도 `fix`가 있으면 거짓) |

- **거절:** 403 · 413 · 400 `작업 내용이 비어 있음` · `모르는 등급` · `설계도를 만드는 단계가 아님` · `설계도가 비어 있음` · 502 `다시 봐 준 결과의 형식이 맞지 않음` · 502 공급자의 이유.

```jsonc
// 요청 (doc는 3-8의 초안 그대로)
{ "stage": 2, "text": "동아리 행사 등록 앱을 만들고 있어요. …", "doc": "꼭 필요한 기능 목록 — 동아리 행사 등록 앱\n…" }
// 응답 (fix 3개 중 1개만 옮김)
{ "ok": true, "review": {
    "say": "빈칸이 3개 남았어요. 하나씩 채워 봐요.",
    "good": ["기능을 '~하면, 앱은 ~한다' 문장으로 썼어요"],
    "fix": [ { "where": "[채워 주세요: 몇 시간]", "why": "아직 정하지 않은 자리예요",
               "hint": "정해서 적어 보세요: 몇 시간. 모르면 '아직 모름'과 언제 정할지를 써도 돼요" } ],
    "ready": false },
  "tokens": 0 }
```

<!-- claude-drafted: 2026-10-19 — 처음 설정(이재엽 "플로로가 켜졌을때 초기 세팅을 도와주는 내용 … api키를 받든 아니면 클로드코드로 연동이 되도록 하든") -->
### 3-10. `GET /api/setup` — 이 컴퓨터는 어떻게 AI를 부를 수 있나

- **누가:** 화면의 처음 설정([`setup.js`](../../02-frontend/navigator/setup.js)) — 고르기 카드의 한 줄과 할 일 체크. 그리고 앱(Electron)이 같은 포트에 먼저 떠 있는 서버를 알아볼 때(`build`).
- **확인:** 출처만. **요청:** 없음. claude 명령은 `--version`만 묻는다(토큰 0, 10초 동안 지난 답을 씀 — `provider.js`의 `claudeVersion`).
- **성공:** 아래 칸만 있다. **키 값 · 중계 서버 주소 · 계정 이름 · 파일 내용은 없다** — 있다 / 없다만.

| 칸 | 타입 | 뜻 |
|---|---|---|
| `provider` | `"api"` · `"cli"` | 지금 부르는 길 — 키가 있으면 api(`provider.js`와 같은 규칙) |
| `apiKey` · `relay` | 참/거짓 | 키가 있나 · 중계 서버 주소(`ANTHROPIC_BASE_URL`)가 있나 |
| `claude.found` · `claude.version` | 참/거짓 · 글 | claude 명령을 찾았나 · 판(못 읽으면 `""`) |
| `claude.signedIn` | 참/거짓 · `null` | `~/.claude.json`에 계정 칸이 있나. 파일이 없거나 claude를 못 찾으면 `null`(모름) |
| `replay` | 참/거짓 | 녹화 재생 중 |
| `build` | 글(12자) | 서버 코드의 지문 — 화면 · 서버 파일 내용으로 만든다. 같은 코드면 저장소에서 켜든 앱 묶음에서 켜든 같다(`setup-status.js` `buildId`) |

```jsonc
{ "ok": true, "provider": "cli", "apiKey": false, "relay": false,
  "claude": { "found": true, "version": "2.1.302", "signedIn": true }, "replay": false, "build": "9d9dd5cd0b87" }
```

### 3-11. `POST /api/setup/check` — 연결 확인

- **누가:** 처음 설정의 "연결 확인하기". **확인:** 출처 · 확인 값(쿠키) — AI를 부르므로 판정 네 주소와 같다(F-04). **요청:** 본문 없음.
- **하는 일:** 정해진 아주 작은 요청 하나(`{"ok": true}`만 답하라)를 `provider.js`로 보낸다 — 키면 수십 토큰, `claude -p`면 내 구독. 재생 중(`NAV_REPLAY`)이면 부르지 않는다.
- **성공:** `{ "ok": true, "provider": "cli", "tokens": 6374 }` · 재생 중이면 `{ "ok": true, "provider": "api", "replay": true, "tokens": 0 }`.
- **거절:** 403 출처 · 403 확인 값(본문 · AI 전에) · 502 AI가 실패(이유는 2-2와 같은 한 줄, 예: `claude 명령을 찾지 못함 — …`).
- 2026-10-19 이재엽의 Mac에서 `claude -p`로 한 번 불러 200(`tokens` 6,374 — CLI가 세는 값)을 봤다.

<!-- claude-drafted: 2026-10-20 — AI 진행(C-12, 이재엽 "이건 바이브 코딩이 아니야"): 단계 · 판정 · 토큰과 섞지 않는 지켜보기 전용 -->
### 3-12. `GET /api/steps?since=N` — 섬이 AI가 한 일을 묻는다

- **누가:** 섬(`02-frontend/navigator/app.js`)의 AI 진행 판 — 쿠키로. 따로 뜨던 모아 보기 창은 2026-10-23에 뺐다. 서버 없이 열면 부르지 않고 [steps.js](steps.js)의 `EXAMPLE`(예시 세션)을 보인다(FR-10).
- **확인:** 출처 + 확인 값(쿠키 `nav_event_token` 또는 머리글 `X-Nav-Token`).
- **요청:** `since` — 이 번호보다 뒤의 한 일만. 없거나 숫자가 아니면 0(남아 있는 것 전부). 번호는 3-2-1의 `seq`(알림 번호 3-3과 다른 줄).
- **성공:**

| 칸 | 타입 | 뜻 |
|---|---|---|
| `latest` | 정수 | 지금까지 매긴 한 일의 마지막 번호. 기록을 비워도 되돌리지 않는다 |
| `sessions` | 목록(최대 10) | 세션(프로젝트), **최근에 쓴 것부터**. 한 일이 `since` 뒤에 없어도 세션은 보인다(상태를 보이려고) |
| `sessions[].id` | 글 | `tool:session_id` (예: `claude:demo-1`) |
| `sessions[].project` | 글 | 작업 폴더의 마지막 이름(가림 규칙 적용) |
| `sessions[].tool` | `"claude"` · `"codex"` | 어느 도구인지 |
| `sessions[].state` | `"working"` · `"done"` · `""` | 요청 받음 뒤 · 작업 마침 뒤 · 아직 둘 다 안 옴(한 일만 왔다) |
| `sessions[].at` | 숫자 | 이 세션에 마지막으로 무엇이든 온 시각(밀리초) |
| `sessions[].steps` | 목록(최대 50) | `seq`가 `since`보다 큰 한 일, 오래된 것부터 |
| `steps[].seq` · `at` | 정수 · 숫자 | 번호 · 받은 시각(밀리초) |
| `steps[].verb` · `what` · `add` · `del` | 3-2-1과 같음 | 가린 뒤의 글(80자까지). `what`이 비었으면 도구 이름 |

- **화면이 그리는 법:** `NavSteps.line(step)` → `"고쳤어요 · src/signup.js (+12 −3)"`. 비밀값 모양은 이미 `[비밀값]`으로 와 있다.
- **거절:** 403 출처 · 403 확인 값 · GET이 아니면 404(확인 값을 본 뒤).

```jsonc
// GET /api/steps?since=0
{ "ok": true, "latest": 12, "sessions": [
  { "id": "claude:demo-1", "project": "club-app", "tool": "claude", "state": "working", "at": 1792316180211,
    "steps": [
      { "seq": 11, "at": 1792316170004, "verb": "읽었어요", "what": "src/signup.js", "add": 0, "del": 0 },
      { "seq": 12, "at": 1792316180211, "verb": "고쳤어요", "what": "src/signup.js", "add": 12, "del": 3 } ] } ] }
```

<!-- claude-drafted: 2026-10-20 — FR-17 대화로 일 넘기기 · 섬에서 허용 · 거절(C-4, 이재엽 버튼 "섬에서 진짜 승인" · "허락하면 세션이 진행하는 내용을 오버레이에서도"). 넘김 문서 fable-handoff-2026-10-20-c4-views.md 2절 ② · 3절 -->
### 3-13. `POST /api/approval` — 허락 훅이 승인 카드를 보내고 **답을 기다린다** (FR-17, 2026-10-20)

- **누가:** [`approve-hook.js`](approve-hook.js) — Claude Code의 **PermissionRequest** 훅(파일을 고치거나 명령을 쓰기 전에 허락을 구할 때). 지켜보기 훅(`hook.js`)과 따로다 — 이 훅만 기다린다.
- **확인:** 출처 + 확인 값 머리글.
- **본문:** `id`(훅이 만든 임의 글 8~64자), `sig`(세션 · 도구 · 입력의 지문 — sha256 64자, [approve.js](approve.js) `sig`), `session_id` · `cwd` · `tool` · `tool_name`, `card`([approve.js](approve.js) `card` — `tool_name` · `verb` · `what` · `kind` · `lines[]` · `danger`). **`tool_input` 원문은 보내지 않는다.**
- **서버가 하는 일:** 카드를 믿지 않는다 — 칸마다 모양을 보고 **다시 가리고**(S4) 자른다(줄 40개 · 한 줄 200자). 기다리는 표(메모리, 20개까지)에 넣고 **응답을 붙들어 둔다.** 섬이 결정하면(3-15) 그 결정을, 아무도 누르지 않고 90초(`NAV_APPROVAL_WAIT`)가 지나면 `"none"`을 답하고 표에서 지운다. 훅이 먼저 끊어도 지운다. `POST /api/events/clear`(3-4)는 기다리던 요청 모두에 `"none"`.
- **성공:** `{ "ok": true, "id", "decision": "allow" | "deny" | "none" }`. 훅은 `allow` · `deny`일 때만 Claude Code에 JSON을 출력하고, `none` · 오류 · 서버 꺼짐이면 아무것도 출력하지 않아 Claude Code가 **스스로 묻는다**(터미널) — 대신 허용하는 길이 없다.
- **거절:** 403 출처 · 403 확인 값 · 413 · 400 `승인 요청 모양이 아님`(id · sig · card) · 429 `기다리는 승인 요청이 너무 많음`.
- **남지 않는 것:** 카드(바뀔 내용)는 메모리에만 있고 결정하면 지운다. 디스크 · 녹화 · 알림 목록(3-3) · AI 진행(3-12)에 들어가지 않는다.

```jsonc
// 요청 (X-Nav-Token 머리글)
{ "id": "k3Jd…", "sig": "9f1c…(64자)", "session_id": "s-1", "cwd": "/Users/me/club-app", "tool": "claude", "tool_name": "Bash",
  "card": { "tool_name": "Bash", "verb": "실행했어요", "what": "git push --force origin main", "kind": "run", "lines": ["git push --force origin main"], "danger": "강제로 올리는 명령이에요 — 다른 사람의 것이 사라질 수 있어요" } }
// 응답 — 섬이 누른 뒤(또는 90초 뒤 "none")
{ "ok": true, "id": "k3Jd…", "decision": "deny" }
```

### 3-14. `GET /api/approvals` — 섬이 기다리는 승인 카드를 본다

- **누가:** 섬(`app.js`, 2초마다, 쿠키로). 서버 없이 열면 부르지 않고 [approve.js](approve.js) `EXAMPLE`을 보인다(FR-10, 주소 끝 `&approve=1`).
- **성공:** `{ "ok": true, "items": [ { "id", "sig", "at", "project", "tool", "tool_name", "card" } ] }` — 오래된 것부터. `sig`는 결정(3-15)에 그대로 돌려보낸다.
- **거절:** 403.

### 3-15. `POST /api/approvals/decide` — 섬이 허용 · 거절을 누른다

- **본문:** `id` · `sig`(3-14에서 받은 것 그대로) · `decision`(`"allow"` · `"deny"`) · `sure`(되돌리기 어려운 일을 허용할 때만 `true`).
- **판정 차례(2-1):** 확인 값 → `id`가 기다리는 표에 있나(아니면 **404** `기다리는 요청이 아님 — 늦었거나 이미 정해졌어요`) → `sig`가 같나(아니면 **409** `결정이 요청과 짝이 맞지 않음 — 버렸어요`) → `decision`(아니면 **400** `decision은 allow 또는 deny`) → `card.danger`가 있는데 `allow`이고 `sure`가 없으면 **409** `되돌리기 어려운 일이에요 — … 한 번 더 확인(sure)해 주세요`(섬은 '정말 허용' 단추를 한 번 더 보인다).
- **성공:** `{ "ok": true, "id", "decision" }` — 같은 순간 붙들어 둔 훅(3-13)에도 같은 답이 간다. 요청은 표에서 빠진다.

### 3-16. 일 넘기기 — `POST /api/task/tidy` · `POST /api/task/start` · `GET /api/task`

- **`/api/task/tidy`** — 섬에 적은 할 일(`text`, 4,000자까지)을 요구 문장으로 정리한다. AI 한 번(`provider.js`, [navigator.js](navigator.js) `taskPrompt` · `TASK_SCHEMA`). 성공 `{ ok, lines, say, tokens }` — `lines`는 1~12줄 · 한 줄 200자. 거절: 400 `작업 내용이 비어 있음` · 400 `넘긴 글이 너무 김 — 4,000자까지` · 502 `정리 형식이 맞지 않음`. 연습 모드 · 서버 없이는 섬이 부르지 않고 `taskLines`(줄 · 문장 나누기)만 쓴다.
- **폴더 고르기(2026-10-24, C-31 · F-49):** 앱이 처음 설정 · 메뉴에서 고른 **작업 폴더**가 있으면 그 폴더, 없으면 훅 알림(3-2)이 알려 준 **가장 최근 세션의 폴더**. 앱은 같은 프로세스에서 `server.js` `useProject(dir)`로 알려 준다(절대 경로의 있는 폴더만) — **HTTP 주소는 없다**(화면 · 다른 프로그램이 경로를 넣지 못하게). 3-18 · 3-19도 같은 규칙.
- **`/api/task/start`** — 사람이 고쳐 확정한 요구 문장(`text`)을 **사용자의 Claude Code**에 넘긴다. 서버는 위의 폴더에서 `claude -p --output-format json`을 **셸 없이** 열고 글은 표준 입력으로 준다([provider.js](provider.js) `startTask` — 외부 AI 호출은 그 파일 한 곳). 권한 건너뛰기 · 설정 끄기 · 세션 잇기 옵션은 쓰지 않는다 — 그 세션이 허락을 구하면 3-13의 훅이 섬에 묻는다. 화면이 보낸 폴더 경로는 받지 않는다. 한 번에 하나.
  성공 `{ ok, project, task: { state: "running", project, at, code: null, tokens: null, cost: null } }`. 끝나면 결과 한 덩이에서 **토큰 · 비용만** 읽어 3-5 장부(`task`, 이름 `맡긴 일`)에 쌓는다 — 답 글은 받지 않는다(4MB까지만 모은다). 거절: 400 `연결한 프로젝트 폴더를 아직 몰라요 — …`(앱이 고른 폴더도 훅 알림도 없음) · 400 비어 있음 · 400 4,000자 · 409 `넘긴 일이 아직 진행 중이에요` · 502 `claude를 열지 못함`.
- **`/api/task`** — `{ ok, task }`: 넘긴 일의 상태 `running` · `done` · `failed`와 끝 코드, 끝났으면 이번 일의 `tokens` · `cost`(Claude Code가 알려 준 값, 모르면 `null`). 없으면 `null`. 진행(한 일)은 3-12에, 허락은 3-14에 따로 온다.
- **남지 않는 것:** 폴더 경로는 서버 메모리에만 — 3-12 `sessions[]`에 내지 않는다(`project` 이름만).

### 3-17. `POST /api/quest` — 플로로가 퀘스트 글을 만든다 (C-22, 2026-10-21)

<!-- claude-drafted: 2026-10-21 -->
- 본문 `{ idea, stage, tier? }` — `idea`는 사용자가 "무엇을 만들고 싶은지" 말한 글(400자까지), `stage`는 코드가 정한 지금 단계(0~7), `tier`는 등급(없으면 Full).
- AI 한 번([navigator.js](navigator.js) `questPrompt` · `QUEST_SCHEMA` · `parseQuest`). **할 일 이름 · 개수는 코드(`criteriaFor`)가 정하고 AI는 글만 만든다** — `desc`(무엇을 하는지, 400자) · `why`(왜, 200자) · `qa[]`(할 일과 같은 개수 · 같은 순서, 각 `{question, examples[1~3]}`). 플로로 말투는 `FLORO_VOICE` 한 줄 — 이재엽이 다듬는 자리.
- 성공 `{ ok, quest: { desc, why, qa }, tokens }`. 거절: 400 `만들고 싶은 것이 비어 있음` · 400 `만들고 싶은 것이 너무 김 — 400자까지` · 400 `모르는 등급` · 400 `지금 단계가 없음` · 502 `퀘스트 형식이 맞지 않음`(qa 개수가 할 일과 다르거나 칸이 빔).
- 화면: 퀘스트를 만들 때(처음 시작 · 장을 넘어갈 때) 진짜 AI 모드에서만 부르고, 못 받으면 [quest.js](quest.js)의 기본 글(할 일 이름 그대로 묻기)로 둔다. 연습 모드 · 서버 없이는 부르지 않는다(FR-10). `idea`에 비밀번호 같은 것이 보이면 보내지 않는다.

### 3-18. `GET /api/readme` — 내 작업 책: 연결한 폴더의 README를 책으로 (C-26, 2026-10-23)

<!-- claude-drafted: 2026-10-23 -->
- 확인 값(쿠키 · `X-Nav-Token`)이 있어야 한다. 본문 없음 — **경로를 받지 않는다.** 폴더는 3-16의 '폴더 고르기'와 같다(앱이 고른 작업 폴더, 없으면 훅 알림의 cwd).
- 그 폴더의 `README.md`를 **읽기만** 한다 — 바로가기(심볼릭 링크)는 따라가지 않고, 앞의 256KB만 읽고, 나누기 전에 비밀값을 가린다([sensitive.js](sensitive.js)). 나누기는 [readme-book.js](readme-book.js) `parse` — `#` 제목 · 그 아래 한 줄 · `## 버전` 줄(`- V.n · YYYY-MM-DD · 제목`) · `##`마다 한 장(코드 칸 안의 `##`는 제목이 아님).
- 답(늘 200) `{ ok: true, project, book, why }` — `project`는 폴더 **이름**만(경로는 주지 않는다). 책이 있으면 `book = { title, intro, versions[{v, date, title}], chapters[{id, title, body}], cut }`, `why = ""`. 폴더를 모르면 `book: null, why: "folder"`, README가 없으면 `book: null, why: "none"`.
- 화면: 명령 칸의 **책**(C-29)이 퀘스트 창의 책 탭을 열 때 부른다. 서버 없이 · 연습 모드 · `book: null`이면 연습 예시 책(`readme-book.js` `EXAMPLE`)을 보이고 까닭을 한 줄로 적는다. 시험: `04-tests/navigator/readme-api.test.js` · `readme-book.test.js`.

### 3-19. `GET /api/github` · `POST /api/github/create` — 설정의 GitHub 칸 (C-25, 2026-10-24)

<!-- claude-drafted: 2026-10-24 — 이재엽 "지금 깃허브을 연동하는 곳을 설정창에 만들어줘" -->
- 둘 다 확인 값(쿠키 · `X-Nav-Token`)이 있어야 한다. **Floe는 GitHub 토큰 · 비밀번호를 받지도 두지도 않는다** — 이 컴퓨터의 `git` · `gh`(GitHub CLI)에게 묻는다([github.js](github.js)). 폴더는 3-16의 '폴더 고르기'와 같고(앱이 고른 작업 폴더, 없으면 훅 알림의 cwd), 경로는 받지도 주지도 않는다.
- **`GET /api/github`** — 읽기만. `gh --version` · `gh auth status --hostname github.com`(끝 코드 0이면 로그인) · `git rev-parse --is-inside-work-tree` · `git remote get-url origin`을 셸 없이 · 4초 제한 · 비밀번호를 묻지 않게(`GIT_TERMINAL_PROMPT=0`) 부른다.
  답(늘 200) `{ ok: true, project, gh: { found, signedIn }, git, remote, why }` — `remote`는 `{ kind: "github" | "other", owner, repo, web }` 또는 `null`. 원격 주소 안의 토큰 · 비밀번호는 버리고, `owner` · `repo` · `web`은 github.com일 때만 채운다(그 밖은 빈 글). GitHub 계정 이름은 주지 않는다.
  `why`: `""`(원격 있음) · `"folder"`(폴더를 모름) · `"no-git"`(git 명령 없음) · `"not-repo"`(git 저장소가 아님) · `"no-remote"`(origin 없음). `gh`가 없으면 `signedIn: null`.
- **`POST /api/github/create`** — 본문 `{ visibility? }`(`private` 기본 · `public`). 저장소를 **Floe가 만들지 않고** 3-16 일 넘기기(`startTask`)로 사용자의 Claude Code에 맡긴다. 맡길 글은 서버가 정한다(`github.js` `createRequest` — 화면이 글을 보내지 않는다): git init · README 첫 장(`## 버전` 줄) · 비밀값 파일과 `.claude/settings.local.json*`(이 컴퓨터의 훅 설정과 그 백업)은 `.gitignore`로 빼기 · 첫 커밋 · `gh repo create <폴더 이름> --private|--public --source . --remote origin --push` · 같은 이름이면 멈추고 묻기 · 강제 푸시 · 지우기 금지. 그 세션이 허락을 구하면 3-13 훅이 섬에 묻는다.
  성공은 3-16과 같다(장부 이름은 `저장소 만들기`). 거절: 400 `공개 범위는 private · public 중 하나` · 400 `연결한 프로젝트 폴더를 아직 몰라요 — …` · 409 `이 폴더는 이미 원격 저장소와 이어져 있어요` · 409 · 502는 3-16과 같다.
- 화면: 설정의 **GitHub** 묶음(연결 아래). 열 때마다 다시 묻고, 서버 없이 열면 안내 한 줄만. 맡기기 단추는 gh 로그인 + 진짜 AI 모드일 때만 눌린다(Claude Code가 움직이니까). 처음 설정의 **GitHub** 칸(gh 찾기 · 로그인)도 `GET /api/github`를 묻고, 처음 설정에서 **새로 만든** 폴더면 '준비 끝'에서 저장소도 만들지 물어 시작할 때 `POST /api/github/create`를 부른다(2026-10-24, C-31). 시험: `04-tests/navigator/github-api.test.js` · `project-api.test.js` · e2e `setup-flow.test.js`.
- **앱만 하는 일(HTTP 주소 없음, 2026-10-24 C-31):** 홈/Floe/이름에 새 폴더 · 내 GitHub 저장소 가져오기(`gh repo clone` — gh 로그인이 먼저) · 내 저장소 목록(`gh repo list`)은 Electron 앱이 [project.js](project.js)로 한다 — 화면은 이름 · 주소 글만 preload(`newProject` · `cloneProject` · `myRepos`)로 보낸다. **가져오기는 내가 쓸 수 있는(push) 저장소만**(`gh api repos/주인/이름 --jq .permissions.push`) — 3-16이 여는 `claude -p`는 폴더를 믿는지 묻지 않아서(Claude Code 보안 문서 "A `-p` session shows neither prompt") 남의 저장소의 `.claude` 설정 · 훅 · `.mcp.json`이 확인 없이 돌 수 있다. 남의 저장소는 내 계정으로 fork한 뒤 가져온다. 가져온 저장소에 `.claude/settings.json` · `.mcp.json`이 있으면 화면이 알린다(`config: true`). 고른 폴더에는 훅을 더하고(connect.js), git 저장소면 `.git/info/exclude`에 `.claude/settings.local.json*`(그 백업 `.bak-시각`까지)을 더해 훅 경로가 커밋되지 않게 한 뒤 `useProject`로 서버에 알린다. 앱 설정 폴더의 `project.json`(나만 읽기)에 남겨 다시 켜도 그 폴더로. 메뉴의 '연결 빼기'로 그 폴더를 빼면 서버(`dropProject` — 앱이 고른 폴더 · 훅 알림으로 안 같은 폴더 모두)와 `project.json`에서도 잊는다. '이 컴퓨터에 있는 폴더'를 고를 때도 그 폴더의 `.claude/settings.json` · `.mcp.json`을 알린다(같은 까닭 — 고른 폴더가 맡긴 일이 도는 자리가 되므로).

## 4. 화면과 맞대어 본 결과 (2026-10-18)

`02-frontend/navigator/app.js`가 보내는 칸·읽는 칸을 서버와 맞대었다. 화면 코드는 고치지 않았다.

| # | 어긋난 것 | 한 일 |
|---|---|---|
| 1 | 서버의 화면 파일 목록에 `dive.js`·`dive.css`(물속 전환, #93)가 빠져 서버로 연 화면에서 404였다 — 전환 없이 바로 넘어갔다 | **서버 고침** — 목록에 더함. 시험: 페이지가 부르는 파일은 모두 200 |
| 2 | 40,000자가 넘는 본문에 서버가 연결을 끊어, 화면이 "server.js를 켜거나…"로 잘못 안내했다 | **서버 고침** — 413과 이유. 화면은 그 이유를 그대로 보인다 |
| 3 | 64KB 조각 경계에 걸린 한글이 깨져, 긴 글에서 판정 근거·녹화 지문이 어긋났다 | **서버 고침** — 글자 단위로 읽는다 |
| 4 | 없는 주소에 본문이 비면 404가 아니라 400 `작업 내용이 비어 있음`이었다 | **서버 고침** — 주소를 먼저 본다 |
| 5 | `/api/answer`가 단계 `"length"`를 받아 `undefined단계`로 AI를 불렀고, 답의 모양을 보지 않았다(호환 모드는 스키마를 강제하지 않는다) | **서버 고침** — 단계는 네 주소 모두 정수만, 답은 비지 않은 글만 |
| 6 | 한 알림에 두 말이 오면 세션 대화가 20개를 넘어 계속 자랐다 | **서버 고침** — 20개를 지킨다 |
| 7 | 화면은 `tier`를 보내지 않는다 → 판정·초안·다시 보기가 늘 Full이다 | **화면 고침(#99)** — 설정의 "만드는 크기"(작게·보통·크게)를 네 요청에 `tier`로 싣는다. 기본 Full이라 요청문·녹화는 그대로 맞는다 |
| 8 | 화면의 "물어보기"는 질문만 확인하고 작업 글이 비어도 보낸다 → 400 `작업 내용이 비어 있음` | **화면 고침(F-11, 2026-10-18)** — 글 칸이 비었으면 마지막으로 살펴본 글을 보내고, 그것도 없으면 보내지 않고 쉬운 말로 이유를 보인다(`understand.js` `askText`). 시험: screen-gaps "물어보기(F-11)" |
| 9 | 화면은 `/api/usage`를 부르지 않는다 — 설정의 토큰 표는 미리 만든 값이다 | **화면 고침(2026-10-18, F-12)** — 서버로 열면 이 주소의 값을 보인다(`token-view.js`). 파일로 열면 그대로 가상 숫자와 "가상" 표시 |
| 10 | 40,000자가 넘는 알림(아주 긴 마지막 답)은 413으로 버려지고 훅은 조용히 끝난다 | **훅 고침** — `hook.js`가 말마다 앞 16,000자만 보낸다. 4,000자가 아니라 16,000자인 까닭: 서버는 가린 **뒤** 앞 4,000자만 쓰므로, 자른 자리에 걸친 키 조각이 화면까지 오지 않는다. 시험: `demo-safety.test.js` "아주 긴 마지막 답" |
| 11 | AI 네 주소는 확인 값을 보지 않는다 — 남의 웹페이지는 못 부르지만 **같은 컴퓨터의 프로그램**(curl 등)은 부를 수 있다 | **서버 고침(2026-10-18, 이재엽 "네 주소에도 거름")** — 알림과 같은 확인 값, 쿠키 범위 `/api`. 화면 코드는 그대로(쿠키가 저절로 실림). 시험: `api-contract.test.js` "AI 네 주소도 값이 없거나 틀리면 403". 서버로 연 화면 200 · curl 403 확인 |

## 5. 시험 — 실제 AI 없이

[`api-contract.test.js`](../../04-tests/navigator/api-contract.test.js)는 `python3 04-tests/run_all_tests.py`가 같이 돌린다.

- **재생 모드로 돈다.** 시험이 임시 녹화 파일을 만들어 `NAV_REPLAY`로 준다. 녹화 키는 서버가 만들 요청문(`navigator.js`의 `judgePrompt` 등)과 스키마로 `recording.js`의 `keyOf`가 만든다 — 서버가 쓰는 함수와 같아서 같은 요청이면 재생된다. AI 답 자리에는 연습 예시의 미리 만든 답을 넣는다.
- 녹화에 없는 요청은 AI를 부르지 않고 502로 끝난다. 그래서 시험에서 400이 나오면 "AI를 부르기 전에 거절했다"는 뜻이다.
- 재생이 깨져도 돈이 들지 않게 가짜 키와 닫힌 로컬 주소를 둔다(`claude -p`로도 새지 않는다). 확인 값·사용량 파일은 임시 폴더에만 만든다.
- 할 일 문장은 시험에 적지 않는다 — `criteriaFor`로 세고 서버 데이터와 맞댄다. 판정 규칙이 바뀌어도 시험은 그대로다.
- 확인하는 것: 주소마다 성공 모양(칸 이름·타입·개수), 거절마다 상태 코드와 이유, 등급(안 보냄·`null`·`Full`이 같음, Xpress·Lite는 그 등급의 개수), 확인 값(머리글·쿠키·머리글 먼저), 크기(40,000자 경계), 화면 파일 목록, 키·글이 사용량·녹화에 남지 않는 것.
- 처음 설정(3-10 · 3-11)은 [`setup-api.test.js`](../../04-tests/navigator/setup-api.test.js) — 칸과 값이 새지 않는 것, 확인 값, 재생 중 확인, 스크립트 · 스타일의 `no-cache`(2026-10-19).
- AI 진행(3-2-1 · 3-12, 2026-10-20)은 `api-contract.test.js`(403 · 모양 · since · 가림 · 50줄 · 비우기 · 상태)와 [`hook-steps.test.js`](../../04-tests/navigator/hook-steps.test.js)(hook.js를 실제로 돌려 — 본문에 내용이 없고, 서버가 꺼져 있을 때 600ms 안에 끝남).
