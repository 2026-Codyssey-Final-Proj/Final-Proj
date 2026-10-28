<!-- claude-drafted: 2026-10-18 — 이재엽의 요청("남은 요구사항 작업을 진행")으로 Claude가 썼다. 이슈 #7(API 계약) · 계약 시험 #19(담당 두승현)에 알린다. -->

# 로컬 API 약속 — navigator 서버

화면(`02-frontend/navigator/`)과 훅(`hook.js`)이 로컬 서버(`server.js`)를 **어떤 모양으로 부르고, 어떤 모양으로 받는지**의 약속이다.
코드와 이 문서가 다르면 **틀린 쪽을 고치고 시험을 같이 고친다** — 시험이 이 문서대로 답하는지 주소마다 확인한다.

| | |
|---|---|
| 판 | **v1.8 · 2026-10-26** — 4 ~ 8단계 초안 · 칸마다 예시 셋(`alts`) · 다른 예시(`avoid`) · 초안은 빠른 모델(3-21 · 3-22), 초안을 확인한 장은 3-6을 부르지 않는다(C-40). v1.7(2026-10-25) — 3단계 초안 · 칸마다 재료 · 준비할 것(3-22, `prev`가 단계마다 `{ stage, items }`로 바뀜) · 단계 문서의 증빙 칸 · 기획서 `docs/PRD.md` · 결정 기록 `docs/decisions.md`(3-23 — 결과에 `by` · `draft` · `from` · `prep` · `at` · `passed` · `check`, 본문에 `idea`, C-39). v1.6(같은 날) — 2단계 초안 `POST /api/stagedraft`(3-22) · 단계 문서를 작업 폴더에 쓰고 커밋 · 푸시를 Claude Code에 `POST /api/docs`(3-23, C-37). v1.5(같은 날) — 처음 한 바퀴의 1단계 초안 `POST /api/start`(3-21, C-36). v1.4(2026-10-24) — 준비 계획판 `POST /api/plan`(3-20, C-34) · 맡기기의 기준과 보고(3-16 `checks` → `task.report`, C-32). v1.3(같은 날) — 작업 폴더를 앱이 알려 준다(3-16 · 3-18 · 3-19 "폴더 고르기", C-31) · 토큰 장부(3-5 `ledger` · `POST /api/usage/reset`, 3-16 `tokens` · `cost`). v1.2(2026-10-20) — FR-17 섬에서 허용 · 거절 · 일 넘기기: 승인 셋(3-13 · 3-14 · 3-15)과 일 넘기기 셋(3-16). v1.1(같은 날) AI 진행(C-12): `/api/event`가 PostToolUse를 받고 `GET /api/steps`(3-12). v1은 2026-10-18 |
| 기준 코드 | `server.js` — 시연 안전장치(#94: 확인 값·받은 글 가림·기록 비우기)와 판정 규칙(#96: 등급별 할 일)을 합친 상태. **2026-10-18 F-04: AI 네 주소도 확인 값**, 6단계 할 일 넷(F-03). 2026-10-20 AI 진행(`steps.js` · `hook.js` PostToolUse) |
| 시험 | [`04-tests/navigator/api-contract.test.js`](../../04-tests/navigator/api-contract.test.js) — 실제 AI를 부르지 않는다(5절). FR-17 주소는 [`task-api.test.js`](../../04-tests/navigator/task-api.test.js)(가짜 claude · 재생) |
| 바꾸는 법 | 이 문서·시험·`server.js`를 한 PR에서 같이 고친다. 화면이 읽는 칸이 바뀌면 화면 담당에게 알린다 |
| 다루지 않는 것 | 본 제품(Next `src/app/api/`)의 API — 아직 없다. 그때 이 약속을 출발점으로 쓴다 |

## 1. 한눈에

| 주소 | 누가 부르나 | 확인 | 성공(200) | 거절 |
|---|---|---|---|---|
| `GET` 화면 파일 (`/`, `/index.html` …) | 브라우저 | 출처 | 파일 + html이면 확인 값 쿠키 | 403 · 404 |
| `POST /api/event` | 훅(`hook.js`) | 출처 · 확인 값(머리글) | `{ok, seq}` | 403 · 413 · 400 |
| `GET /api/events?since=N` | 화면(2초마다) | 출처 · 확인 값(쿠키) | `{ok, latest, project, events[]}` | 403 · 404 |
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
| `GET /api/files` | 섬 — 작업실을 열 때(C-42 R-8, 2026-10-27) | 출처 · 확인 값(쿠키) | `{ok, project, files:[{name, path, dir, depth}], total, cut, unread, depth, max, why}` — 연결한 폴더의 이름만, 깊이 3 · 200개 | 403 |
| `GET /api/file?i=N` | 섬 — 파일 칸에서 파일을 누를 때(C-43, 2026-10-27) | 출처 · 확인 값(쿠키) | `{ok, i, name, path, kind, text, size, mtime, changed}` — 목록의 N번 파일(글 파일 · 512KB까지), 바뀐 줄은 git과 다른 [시작, 개수]. `ok:false`면 `why`(big · binary) | 403 · 400 · 404 |
| `GET /api/find?q=<할 일 이름>` | 섬 — 묻는 카드 · 확인 카드의 '폴더에서 찾기' 칩(C-56 R-4, 2026-10-28) | 출처 · 확인 값(쿠키) | `{ok, found:[{i, path, line, text, hits}], files}` — 마지막 목록의 글 파일(md · txt, 64KB · 20개까지)에서 그 칸의 답 후보 줄 셋(원문 그대로, 가림). 목록을 모르면 `why:"folder"` | 403 · 400 |
| `GET /api/docmap?now=<경로>` | 작업실의 문서 지도 탭(C-45, 2026-10-27) | 출처 · 확인 값(쿠키) | `{ok, project, board}` — 문서(docs/** · README · CLAUDE.md)를 상자로, md 링크를 선으로 이은 archi-board 보드 데이터 | 403 |
| `POST /api/file` | 섬 — 연 파일을 저장할 때(C-43) | 출처 · 확인 값(쿠키) | `{i, path, text, mtime, eol?, force?, overwrite?, ignoreBusy?, commit?}` → `{ok, mtime, task, note}` — 그 파일에만 쓰고 commit이면 그 파일만 커밋 · 푸시를 Claude Code에 | 403 · 400 · 404 · 409(moved · sensitive · changed · busy) · 413 · 500 |
| `POST /api/preset` | 섬 — 연 파일 머리의 '틀로 맡기기' · 채팅 '문서 틀'(C-44, 2026-10-27) | 출처 · 확인 값(쿠키) | `{i 또는 path(docs/…md), preset, stage?, note?}` → 3-16과 같은 `{ok, task, preset, name}` — presets.js의 글 · 끝 조건으로 Claude Code에 | 403 · 400 · 404 · 409 · 502 |
| `POST /api/prepare` | 섬 — 2단계 끝 '기획서로 3 ~ 8단계 그리기'(C-56 R-2 · C-54, 2026-10-28), 진짜 AI 모드만 | 출처 · 확인 값(쿠키) | `{tier?, idea, prev[{stage, items}], base?}` → `{ok, prepare:{cards:{2..7:{title, think, act, from}}, say}, tokens}` — 빠른 모델 한 번 | 403 · 400 · 502 |
| `POST /api/start` | 섬 — 처음 채팅에 원하는 것을 보냈을 때(C-36, 2026-10-25) | 출처 · 확인 값(쿠키) | `{ok, start:{topic, pain, change, who, size, sizeWhy}, tokens}` | 403 · 413 · 400 · 502 |
| `POST /api/stagedraft` | 섬 — 1단계 관문을 지났을 때(C-37, 2026-10-25) | 출처 · 확인 값(쿠키) | `{ok, draft:{items[{text} 또는 {pick, why}], say}, tokens}` | 403 · 413 · 400 · 502 |
| `POST /api/docs` | 섬 — 2단계를 마치고 '올리기'를 눌렀을 때(C-37) | 출처 · 확인 값(쿠키) | `{ok, project, files[], task}` | 403 · 413 · 400 · 409 · 500 |
| `POST /mcp/<MCP 토큰>` | Claude Desktop의 중계 파일(`mcp-stdio.js`, 이 컴퓨터 안 — 늘) · 웹 GPT · 웹 Claude(터널로 — **`NAV_MCP=1`일 때만**)(C-38 시험판, 2026-10-25) | 주소 속 MCP 토큰(밖에서 올 때는 출처를 보지 않는다 — 터널이라 Host가 다르다) | JSON-RPC 답 · 알림이면 202 | 404(꺼짐 · 토큰 틀림) · 405 · 413 · 400 |
| `POST /api/state` | 화면 — 저장할 때마다, 바뀌었을 때만(C-38 시험판) | 출처 · 확인 값(쿠키) | `{ok}` | 403 · 400 |
| `GET /api/proposals` | 섬(2초마다, C-38 시험판) | 출처 · 확인 값(쿠키) | `{ok, items[]}` 웹 AI가 적자고 한 줄 | 403 |
| `POST /api/proposals/decide` | 섬 "맞아요, 적어요" · "아니요"(C-38 시험판) | 출처 · 확인 값(쿠키) | `{ok}` | 403 · 404 |
| `GET /api/apps` | 처음 설정 '같이 쓸 앱'(C-38 시험판) | 출처 | `{ok, claudeDesktop:{found, linked}}` — 경로는 보이지 않는다 | 403 |
| `POST /api/apps/link` | 처음 설정 'Claude Desktop과 잇기'(C-38 시험판) | 출처 · 확인 값(쿠키) | `{ok}` — Claude Desktop 설정 파일에 floe 한 칸 | 403 · 400 · 409 |
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
| `project` | 글 | 앱이 고른 작업 폴더의 이름(가림 규칙 적용), 없으면 `""`. 화면의 폴더 이름은 이것만 따른다 — 비었을 때만 전처럼 알림의 `project`(2026-10-28 임유정 "폴더를 바꿔 열기 전까지는 그냥 폴더 A") <!-- claude-drafted: 2026-10-28 --> |
| `events` | 목록(최대 20) | `seq`가 `since`보다 큰 알림, 오래된 것부터 |
| `events[].seq` | 정수 | 알림 번호 |
| `events[].at` | 숫자 | 받은 시각(밀리초, `Date.now()`) |
| `events[].kind` | `"prompt"` · `"stop"` | 요청 받음 · 작업 마침 |
| `events[].tool` | `"claude"` · `"codex"` | 어느 도구인지 |
| `events[].project` | 글 | 작업 폴더의 마지막 이름(가림 규칙 적용) |
| `events[].here` | 참/거짓 | 그 알림이 앱이 고른 폴더(또는 그 안의 폴더)에서 왔나. 앱이 고른 폴더가 없으면 늘 참. 거짓이면 화면은 연결 표시와 채팅 한 줄만 — 이름 · 글 칸 · 살펴보기 · 알림 기록은 건드리지 않는다(훅은 연결했던 폴더마다 남는다) |
| `events[].work` | 글 | 그 세션의 최근 대화. 줄마다 `[사용자] …` · `[Claude] …` · `[Codex] …`. 최근 말 20개 안에서 **글자 합 4,000자까지**(줄바꿈은 세지 않는다) — 넘치면 오래된 말부터 버리고, 경계에 걸린 말은 앞부분만 남긴다 |

- **화면이 읽는 칸:** `ok`, `latest`, `project`, 마지막 알림의 `at`·`project`·`here`·`tool`·`work`·`kind`.
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

> **C-40(2026-10-26):** 초안을 칸마다 확인한 장(1단계 초안 3-21 · 단계 초안 3-22)의 완료 보고는 이 주소를 부르지 않는다 — 화면이 확인한 대로 본다(`quest.js` `localJudgement` + `CONFIRM_REASON`, 단계 결과에 `checkBy: "confirm"`). 초안 없이 한 줄씩 적은 장 · 작업 글을 넣은 경우는 그대로 이 주소. <!-- claude-drafted: 2026-10-26 -->

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
| `sessions[].here` | 참/거짓 | 그 세션이 앱이 고른 폴더(또는 그 안)에서 도나. 앱이 고른 폴더가 없으면 늘 참, 연결을 뺀 폴더면 거짓. 거짓이면 화면은 판정의 '일한 증거' · 작업실 파일 카드 · '일하고 있어요'에 쓰지 않고, AI 진행 목록에만 그 폴더 이름과 함께 보인다(F-73) <!-- claude-drafted: 2026-10-28 --> |
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
- **기준과 보고(2026-10-24, C-32 — 이재엽 버튼 "Claude Code가 기준마다 보고"):** 본문에 `checks`(글 1~12줄, 한 줄 200자)를 같이 주면, 서버가 넘길 글 끝에 기준 목록과 보고하라는 말을 붙이고([navigator.js](navigator.js) `taskBrief`) `--json-schema REPORT_SCHEMA`로 연다 — Claude Code가 일을 마친 뒤 기준마다 `{ check, done, evidence }` · 초등학생도 아는 말 요약 `easy` · 물을 것 `ask`로 답한다. 서버는 그 답을 기준 순서대로 맞추고(빠진 줄은 안 됨, 근거가 빈 '해냄'은 안 됨 — `parseReport`) 비밀값 모양과 **경로**(작업 폴더 앞부분은 `.`, 홈 폴더는 `~`)를 가린 뒤 메모리에만 둔다. 거절: 400 `기준의 모양이 맞지 않음 — …`. `checks`가 없으면 전처럼(`--json-schema` 없음).
- **`/api/task`** — `{ ok, task }`: 넘긴 일의 상태 `running` · `done` · `failed`와 끝 코드, 끝났으면 이번 일의 `tokens` · `cost`(Claude Code가 알려 준 값, 모르면 `null`)와 `report`(위 — `{ items[{check, done, evidence}], easy, ask, done, total }`, 기준 없이 넘겼거나 모양이 틀리면 `null`). 없으면 `null`. 진행(한 일)은 3-12에, 허락은 3-14에 따로 온다.
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
- 화면: 퀘스트 창의 책 탭을 열 때 부른다(위 줄의 '퀘스트' 단추 → 책 탭 — 명령 칸의 **책**(C-29)은 2026-10-24 C-35로 뺐다). 서버 없이 · 연습 모드 · `book: null`이면 연습 예시 책(`readme-book.js` `EXAMPLE`)을 보이고 까닭을 한 줄로 적는다. 시험: `04-tests/navigator/readme-api.test.js` · `readme-book.test.js`.

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

### 3-20. `POST /api/plan` — 준비 계획판: 한 번에 넣은 글로 계획 · 기준 (C-34, 2026-10-24)

<!-- claude-drafted: 2026-10-24 — 이재엽 "한번에 내용들을 넣으면 어떻게 준비하고 기준들을 사람들이 확인해서 너한테 의견들을 바로바로" · 버튼 "Floe의 AI 한 번" -->
- 확인 값이 있어야 한다(AI를 부른다 — `AI_ROUTES`). AI 한 번([navigator.js](navigator.js) `planPrompt` · `PLAN_SCHEMA` · `parsePlan`) — **도구 없이**(`callClaude`): 저장소의 설정 · 훅은 돌지 않는다.
- 본문 `{ text, readme?, prev?, notes?, answers?, general? }`
  - `text` — 사용자가 한 번에 넣은 글(8,000자까지).
  - `readme` — `false`면 넣은 글만. 아니면 3-16 '폴더 고르기'의 작업 폴더에서 README(가림 · 앞 6,000자)와 맨 위 파일 이름(점으로 시작하는 것 · node_modules 빼고 60개)을 같이 보낸다. 폴더 경로는 보내지 않는다.
  - 다시 세울 때: `prev`(지난 계획 — 서버가 `parsePlan`으로 모양을 다시 확인) · `notes[{need, check, note}]`(고칠래요 줄의 의견, 12개까지) · `answers[{q, a}]`(물은 것의 답, 4개까지) · `general`(전체 의견). 글은 각 300자까지.
- 성공 `{ ok, plan, tokens }` — `plan = { problem, have, missing, items[{id, need, check}], prep[], ask[], say }`. 요구 줄의 `id`(p1…)는 코드가 붙인다. 말은 초등학생도 아는 말로(`FLORO_VOICE`, C-33). 넣은 글에 없는 것은 지어내지 않고 `ask`로 묻는다.
- 거절: 400 `넣은 글이 비어 있음` · 400 `넣은 글이 너무 김 — 8,000자까지` · 400 `지난 계획의 모양이 맞지 않음` · 400 `의견의 모양이 맞지 않음` · 502 `계획 형식이 맞지 않음`.
- 화면: 섬의 채팅에서 연다(C-35, 2026-10-24 — 채팅의 '계획 세우기' 칩. 처음 설정의 '계획' 칸은 2026-10-25 C-36으로 뺐다. 그 전에는 명령 칸의 **맡기기**가 여는 계획판). 줄마다 맞아요 / 고칠래요 · 의견 · 답 → '의견 보내고 다시 세우기' 또는 모두 맞아요면 '이대로 확정'. 확정한 줄은 퀘스트 창의 '맡길 일' 퀘스트가 되어 **순서대로** 하나씩 3-16에 `checks`와 함께 맡기고, 보고를 보고 맞아요를 눌러야 끝낸 것으로 친다. 보고 카드에서 **물어보기**는 그 보고(맡긴 일 · 기준 · 보고 글)를 3-7 `/api/answer`로 플로로에게 묻고, Claude Code가 물은 것(`ask`)에 답하면 그 질문과 답을 붙여 다시 맡긴다. 연습의 예시 계획은 판에 `example`로 남아 모드를 바꿔도 진짜 Claude Code로 넘기지 않는다. 판은 이 컴퓨터의 브라우저 저장소에만(규칙 [plan.js](plan.js)). 연습 · 서버 없이는 부르지 않고 예시 계획 · 예시 보고. 시험: `04-tests/navigator/plan-api.test.js` · `plan-rules.test.js` · `plan-board.test.js` · e2e `plan-flow.test.js`.

### 3-21. `POST /api/start` — 처음 한 바퀴: 받은 글 전체로 1단계 초안 (C-36, 2026-10-25)

<!-- claude-drafted: 2026-10-25 — 이재엽 "원하는 내용을 받으면 너가 전체적으로 글들을 확인해서 … 초안을 백엔드로 제작" · 버튼 "1단계는 확인만 → 관문 → 2단계" · "규모 판단표 scope-tiers" -->
- 확인 값이 있어야 한다(AI를 부른다 — `AI_ROUTES`). AI 한 번([navigator.js](navigator.js) `startPrompt` · `START_SCHEMA` · `parseStart`) — **도구 없이**(`callClaude`), 받은 글만 보낸다.
- 본문 `{ text }` — 사용자가 처음에 플로로에게 준 글 전체(8,000자까지, 계획 3-20과 같다). 비밀번호처럼 보이는 것은 화면이 보내기 전에 묻는다(`guard`).
- 성공 `{ ok, start, tokens }` — `start = { topic, pain, change, who, size, sizeWhy }`
  - `topic` — 무엇을 만드는지 30자 안쪽 이름. 1단계 퀘스트의 제목이 되고 다음 장에도 이어진다.
  - `pain` · `change` — 1단계 Ⅰ 불편 · Ⅱ 달라지는 것 한 문장씩. 화면이 "플로로가 생각한 내용인데 맞나요?"로 묻는다.
  - `who` — Ⅲ 누가: 글에 쓰는 사람이 나오면 그 사람, 없으면 `""`(지어내지 않는다 — 화면은 본인 · 소수 · 불특정다수를 고르게 한다).
  - `size` — Ⅳ 크기: `short` · `medium` · `long`(규모 판단표 [scope-tiers.md](../../01-docs/00-overview/scope-tiers.md) — 짧음 · 보통 · 긺 = Lite · Xpress · Full). `sizeWhy`는 그렇게 본 까닭. 사용자가 고른 것이 만드는 크기(`tier`)가 된다.
- 거절: 400 `받은 글이 비어 있음` · 400 `받은 글이 너무 김 — 8,000자까지` · 502 `1단계 초안 형식이 맞지 않음`(크기가 셋 밖이거나 칸이 빔).
- C-40: 빠른 모델 · 낮은 생각 깊이로 부른다(`provider.js` `FAST` — claude -p `--model sonnet --effort low`, API `claude-sonnet-5-5` · effort low, `NAV_DRAFT_MODEL`로 바꾼다 — 별명(sonnet · haiku · opus)이나 전체 이름, 중계 서버는 받는 모델 그대로).
- 화면: 처음 채팅(무엇을 만들지 아직 없을 때)에 보낸 말. 받으면 1단계 퀘스트를 받기 화면 없이 바로 열고 칸마다 확인만 한다. 넷 다 확인하면 저절로 완료 보고(3-6 `/api/judge` — 판정 규칙은 그대로) → 넘어가기 전 확인. 못 받으면 전처럼 1단계를 한 줄씩. 연습(서버 없이)은 예시 초안(`quest.js` `EXAMPLE_DRAFT`). 시험: [`start-api.test.js`](../../04-tests/navigator/start-api.test.js) · [`start-draft.test.js`](../../04-tests/navigator/start-draft.test.js) · E2E [`start-flow.test.js`](../../04-tests/e2e/start-flow.test.js)

### 3-22. `POST /api/stagedraft` — 2 ~ 8단계 초안: 받은 글 · 지난 단계 결과로 (C-37 · C-39 · C-40)

<!-- claude-drafted: 2026-10-25 — 이재엽 "1단계에서 받은 내용들을 2단계에서도 초안들을 진행하며 생각들을 2단계 진행하기 전에 먼저 생각하고 동의들을 구한후" -->
- 확인 값이 있어야 한다(AI를 부른다 — `AI_ROUTES`). AI 한 번([navigator.js](navigator.js) `stageDraftPrompt` · `STAGE_DRAFT_SCHEMA` · `parseStageDraft`) — 도구 없이, 글만.
<!-- claude-drafted: 2026-10-25 — C-39 이재엽 "지금까지 준비한 내용들을 초안들로 해서 정리해서 무엇들을 준비해야하는지 생각해서 초안들 보여줘" · 버튼 "할 일 초안 + 준비할 것" · "흐름 + 칸마다 재료까지" -->
- 본문 `{ stage, tier?, idea, prev }` — `stage`는 초안을 만드는 단계(`DRAFT_STAGES` — 1 ~ 7 = 2 ~ 8단계, C-40), `idea`는 처음 말한 것(400자까지), `prev`는 지난 단계 결과들 `[{ stage, items: [{ name, lines[] }] }]` — 이 단계보다 앞 단계만 · 한 번씩 · **바로 앞 단계는 꼭**(할 일 8개 · 줄 5개 · 줄 400자까지). AI에는 칸마다 번호 `[단계-칸]`(1부터)을 붙여 넘긴다.
- 성공 `{ ok, draft, tokens }` — `draft = { items, prep, say }`. `items`는 그 등급의 할 일 개수 · 순서 그대로, 칸마다 `{ text, from }`. 기획서로 키울지(PRD) 칸만 `{ pick: light|full|none, why, from }` — 권하기만 하고 고르는 것은 사람. `from`은 그 칸의 재료 `[{ s, i }]`(0부터, 4개까지) — AI가 말한 번호 중 넘긴 지난 단계에 있는 칸만, 한 번씩(맞는지는 확인하지 않는다). `prep`은 이 단계 전에 준비할 것(3줄까지 · 줄 160자).
  - C-40: 4 ~ 8단계(`ALT_STAGES` 3 ~ 7)는 칸마다 `alts` — 다른 길의 예시 2개까지(한 예시 150자, `text`와 같은 것은 버린다). `text`가 플로로가 권하는 것. 2 · 3단계는 `alts`를 버린다(칸 모양 `{ text, from }` 그대로).
  - 본문 `avoid`(다른 예시, C-40) — `{ i, texts }`: `i`번째 칸은 이미 본 예시(1~3개 · 300자)와 다르게. 화면은 그 칸만 바꾼다.
  - 빠른 모델 · 낮은 생각 깊이 · 글 길이 4,096(예시 셋은 길다)로 부른다 — 3-21과 같다.
- 거절: 400 `초안을 만드는 단계가 아님 — 지금은 2 · 3 · 4 · 5 · 6 · 7 · 8단계만` · 400 `다른 예시 요청의 모양이 맞지 않음` · 400 `모르는 등급` · 400 `받은 글이 비어 있음` · 400 `받은 글이 너무 김` · 400 `지난 단계 결과의 모양이 맞지 않음 — [{ stage, items }], 바로 앞 단계는 꼭 …` · 502 `단계 초안 형식이 맞지 않음`(개수가 다르거나 기획서 칸이 셋 밖).
- 화면: 관문을 지나면 부르고, 받으면 다음 장 퀘스트를 받기 화면 없이 칸마다 확인한다(맨 위에 준비할 것, 칸마다 '재료 — 2단계 Ⅲ …'). 4 ~ 8단계는 예시 셋 중 고르기 · 다른 예시, 어느 장이든 '남은 칸 모두 맞아요'. **미리 부르기**(C-40): 지금 장 초안을 받자마자 '모두 맞아요라면' 결과로, 지금 장을 다 적으면 실제 결과로 다음 장을 뒤에서 부르고, 관문 뒤 지난 결과가 같으면(등급 · 처음 말한 것 · prev) 그 답을 쓴다. 비밀값처럼 보이면 미리 보내지 않는다. `say`는 받았을 때 한 번 말한다. 화면은 한 줄을 400자까지만 적는다(`quest.js` `fill`) — 이 주소와 3-23이 받는 길이. 못 받으면 전처럼 받기 화면 · 한 줄씩. 연습은 예시 초안(`quest.js` `exampleStageDraft`). 시험: [`flow-api.test.js`](../../04-tests/navigator/flow-api.test.js) · [`stage-draft.test.js`](../../04-tests/navigator/stage-draft.test.js) · [`stage3-evidence.test.js`](../../04-tests/navigator/stage3-evidence.test.js) · [`stages-all.test.js`](../../04-tests/navigator/stages-all.test.js) · E2E [`quest-flow.test.js`](../../04-tests/e2e/quest-flow.test.js)
- <!-- claude-drafted: 2026-10-28 --> **C-56 R-5 작업을 따라(2026-10-28, 이재엽 버튼 "다음 단계 미리까지"):** 본문에 `work`(코딩 도구가 방금 한 일 — 훅 알림의 작업 글, `WORK_MAX` 600자)를 주면 요청문에 `<방금한일>`로 들어가고 "그 일로 달라지는 칸만 바꾼다"고 지시한다. 섬은 '일을 마쳤어요' 알림 뒤 몇 초(`REFIT_MS`) 모아 지금 단계 초안을 이걸로 다시 받고(`quest.js refit` — 사람이 적은 칸은 덮지 않고 '다시 볼까요?'만, 안 적은 칸만 바꿈), '방금 바뀜' 띠 한 줄을 보이고, 다음 단계 초안도 다시 미리 부른다(3-22 prefetch). 연습 모드는 하지 않는다.

### 3-23. `POST /api/docs` — 단계 문서를 작업 폴더에 쓰고, 커밋 · 푸시는 Claude Code에 (C-37, 2026-10-25)

<!-- claude-drafted: 2026-10-25 — 이재엽 "2단계가 끝나면 … docs와 같은 폴더들을 만들고 md들을 정리해서 깃허브에" · 버튼 "docs 단계 폴더 + CLAUDE.md" · "Floe가 만들고, 커밋 · 푸시는 Claude Code" -->
- 확인 값이 있어야 한다(파일을 쓰고 Claude Code를 연다 — `BOOK_ROUTES`). AI는 부르지 않는다.
- 본문 `{ topic, idea?, results }` — `results = { "0": {title, items[{name, lines[]}]}, "1": … }`, 1 · 2단계(0 · 1)가 다 있어야. `idea`는 처음 말한 것(400자까지 — 기획서 · 1단계 재료). `source`는 받은 글 **전부**(64KB까지 — F-68 2026-10-28, 이재엽 버튼 "통째로 파일에"): `idea`보다 길면 `docs/00-source/idea.md`에 줄 번호와 함께 통째로 쓰고(가림을 거침, 덮어씀) 1단계 문서 · 기획서의 '처음 말한 것'이 그 파일을 `1 ~ N줄`로 가리킨다. 넘으면 400 — 잘라 쓰지 않는다. `card`는 1단계 관문의 **기준 카드**(C-56 R-1 2026-10-28, basecard.js — 칸 여덟 `{ text(200자), by(moved · me), blank, lines?[{text, line}], from?, note? }`): 있으면 `docs/base.md`('이 프로젝트의 기준') 한 장을 쓴다(덮어씀). 모양이 틀리면 400.
  - C-40: 단계마다 `checkBy`(`confirm` — 초안을 칸마다 확인한 대로, AI 판정 없이. 없으면 AI가 살펴본 것). 문서의 완료 기준 머리에 그대로 적는다.
  - C-39 증빙(모두 없어도 된다): 칸마다 `by`(`ok` 그대로 · `edit` 고침 · `me` 직접 · `pick` 고름) · `draft`(플로로가 낸 것, 400자) · `from`(재료 `[{ s, i }]` 6개까지), 단계마다 `prep`(3줄 · 160자) · `at` · `passed`(`YYYY-MM-DD` — 칸을 다 확인한 날 · 관문을 지난 날) · `check`(완료 기준 `[{ text, met, evidence }]` 8개까지). 모르는 칸은 버린다. 화면은 **결과만** 보낸다 — 파일 이름 · 글은 서버가 [docs.js](docs.js) `files`로 만든다(받은 글이 경로가 되지 않는다). 글은 할 일 이름까지 `sensitive.js`로 가린다(공개 저장소일 수 있다).
- 쓰는 것: 3-16 '폴더 고르기'의 작업 폴더에 `docs/<01-idea … 08-retro>/`(끝낸 단계는 결과 md와 **증빙 칸**, 아직인 단계는 README 틀) · `docs/PRD.md`(**기획서** — 처음 말한 것 · 끝낸 단계마다 한 절 · 단계 상태 표) · `docs/decisions.md`(**결정 기록** — 칸마다 한 줄 · 지난 관문마다 한 줄) · `docs/README.md`(목차) · `README.md` · `CLAUDE.md`(기획서 · 결정 기록과 이 셋은 표시 `<!-- floe:start -->` ~ `<!-- floe:end -->` 사이 한 절만 — 내 글은 그대로). 가는 길에 바로가기가 있거나 파일 자리가 파일이 아니면 **하나도 쓰지 않는다**.
- 그다음 3-16처럼 사용자의 Claude Code에 맡긴다(`docs.js` `shipRequest` — 그 파일들만 `git add` · 커밋 · 지금 브랜치를 푸시, 강제 푸시 없음, 원격이 없으면 푸시하지 않고 까닭만). 허락 카드는 섬의 채팅에(3-13 ~ 3-15). 기준 둘(`docs.js` `SHIP_CHECKS` — 커밋했다 · 푸시했다)을 같이 넘겨 끝에 `task.report`로 보고받는다(C-32). 화면은 **둘째(푸시)가 해냄일 때만** '올리기를 마쳤어요'라고 말하고, 아니면 보고의 쉬운 말(`easy`)로 까닭을 말한다 — 일이 0으로 끝났다는 것만으로 올라갔다고 하지 않는다(푸시를 건너뛰거나 허락을 거절해도 0으로 끝난다).
- 성공 `{ ok, project, files[], task }` — `files`는 쓴 파일 이름(작업 폴더 기준), `task`는 3-16과 같은 모양.
- 거절: 400 `1 · 2단계 결과가 다 있어야 해요` · 400 `N단계 결과의 모양이 맞지 않음 — 할 일 8개 · 줄 5개 · 줄 400자까지` · 400 `주제는 60자까지` · 400 폴더를 모름 · 409 넘긴 일이 진행 중(쓰기 전에 본다) · 400 바로가기 · 폴더가 아님 · 500 `문서를 쓰지 못했어요`.
- 화면: 2단계부터 관문을 지날 때마다(C-39) '1 ~ N단계에서 정한 것을 문서로 묶었어요 — 내 GitHub에 올릴까요?'(어느 작업 폴더에 쓰는지 · 파일 목록 · 기획서 · 결정 기록 미리 보기) → 올리기. 같은 파일을 고쳐 쓰고 커밋 하나 더. 나중에는 도전과제의 한눈에 보기에서 다시. 연습은 올리지 않는다. 시험: [`flow-api.test.js`](../../04-tests/navigator/flow-api.test.js) · [`docs.test.js`](../../04-tests/navigator/docs.test.js) · [`stage3-evidence.test.js`](../../04-tests/navigator/stage3-evidence.test.js) · E2E [`quest-flow.test.js`](../../04-tests/e2e/quest-flow.test.js)

### 3-24. `POST /mcp/<MCP 토큰>` · `POST /api/state` · `GET /api/proposals` · `POST /api/proposals/decide` — 원격 MCP 시험판: 웹 AI가 지금 할 일을 읽고 한 줄을 제안 (C-38, 2026-10-25)

<!-- claude-drafted: 2026-10-25 — 두승현 "클로로랑 gpt 클로드 같이 썼을때 시너지가 나와야함" · "이 브랜치에서 시험용으로 만들자" -->
- **시험판.** 이 컴퓨터 안(Host가 `127.0.0.1` · `localhost`)에서는 늘 `/mcp/<MCP 토큰>`을 받는다 — Claude Desktop의 중계 파일이 부른다(아래 '같이 쓸 앱'). **밖(터널)에서는 `NAV_MCP=1`로 켤 때만.** 토큰이 틀리거나 밖인데 꺼져 있으면 404 — 있는지조차 알리지 않는다. C-38은 아직 이재엽 결정 대기다([결정 자료](../../01-docs/00-overview/기록/C-38-다른-AI-도구로-넘기기-2026-10-25.md)의 길 4).
- **이 주소만 이 컴퓨터 밖에서 받는다.** 웹 GPT(개발자 모드) · 웹 Claude(커넥터)는 각 회사의 서버에서 부르므로 터널(예: `cloudflared tunnel --url http://127.0.0.1:4317`)이 필요하고, 그러면 Host가 이 컴퓨터가 아니다. 그래서 `handle`이 `allowed()`보다 먼저 이 주소를 고른다. **나머지 주소는 지금처럼 터널에서 403**(시험이 판정 · 제안 목록으로 본다).
- MCP 토큰은 알림 확인 값과 **따로** — `~/.floe-mcp-token`(`NAV_MCP_TOKEN_FILE`), 나만 읽기. 웹 AI의 설정 화면에 주소째 붙여 넣는 값이라 새로 만들려면 파일을 지우고 다시 켠다. 서버는 켤 때 파일 자리만 말하고 값은 보이지 않는다. 비교는 `timingSafeEqual`.
- 방식: Streamable HTTP의 JSON 답만(SSE 없음 — GET은 405). 방법 넷 `initialize` · `tools/list` · `tools/call` · `ping`, 알림(id 없음)은 202. 묶음(배열)도 받는다. 규칙은 [mcp.js](mcp.js)(SDK 없이 직접 — 자원 · SSE가 필요해지면 `@modelcontextprotocol/sdk`로).
- **도구는 넷뿐** — `floe_now`(화면 단계 번호 · 퀘스트 · 할 일마다 ✓/○와 적은 줄 · 지금 할 일과 플로로의 질문. 앱이 꺼졌는지 · 퀘스트가 아직 없는지도 따로 말한다), `floe_style`(쉬운 말 규칙 · 일하는 순서), `floe_start({text})`(퀘스트가 **없을 때만**, 만들고 싶은 것을 적은 글로 시작을 **제안** — 1,000자까지, 같은 날 두승현 "floe_start 도구도 더해줘"), `floe_report({todo, text})`(할 일 하나에 적을 한 줄을 **제안**). 일 넘기기(3-16) · 문서 쓰기(3-23) · 허용 · 거절(3-15)은 없다 — 밖에서 이 컴퓨터의 Claude Code를 움직이는 길을 만들지 않는다.
- `POST /api/state` — 화면이 저장할 때마다 지금 상태 `{project, mode, stage, quest:{chap, title, phase, objs[{name, need}], lines, cur, ask}}`를 보낸다(바뀌었을 때만). 서버는 `Mcp.cleanState`로 칸마다 모양을 보고 `sensitive.js`로 가리고 자른다(할 일 12개 · 줄 5개 · 줄 200자). 모양이 아니면 400 `상태의 모양이 맞지 않음`. **메모리에만** — 서버를 다시 켜면 빈다.
- `GET /api/proposals` · `POST /api/proposals/decide {id}` — 섬이 2초마다 제안을 보고, 채팅의 허락 카드 위에 "웹 AI가 Ⅰ '…'에 이렇게 적자고 해요"를 띄운다. "맞아요, 적어요"를 눌러야 그 할 일에 적히고(`fillNow`), 판정은 그 뒤 평소대로 Floe의 코드가 한다(ADR-0003). 지금 퀘스트와 장 · 할 일이 맞지 않으면 적지 않는다. 시작 제안(`kind: "start"`)은 "웹 AI가 이 글로 퀘스트를 시작하자고 해요" → "맞아요, 시작해요"를 누르면 섬 채팅에 처음 한 줄을 보낸 것과 같은 길(`startDraft` → 3-21)로 1단계 초안을 만든다. 그사이 퀘스트가 생겼으면 시작하지 않는다. 화면은 2초마다 제안을 볼 때 상태도 보낸다(바뀌었을 때만) — 퀘스트가 없어도 켜자마자 서버가 안다. 제안은 20개까지, 메모리에만. 없는 id면 404.
- **같이 쓸 앱 — Claude Desktop(터널 없음, 같은 날 두승현 "같이 쓸 앱으로 연결으로 해줘").** 처음 설정의 AI 연결 다음 칸 '같이 쓸 앱이 있나요?'에서 'Claude Desktop과 잇기'를 누르면 서버가 [app-link.js](app-link.js)로 Claude Desktop 설정 파일(`claude_desktop_config.json` — Windows 스토어판 `%LOCALAPPDATA%\Claude-Data\claude_*`, 일반판 `%APPDATA%\Claude`, Mac `~/Library/Application Support/Claude`)의 `mcpServers`에 `floe` 한 칸만 넣는다. 다른 칸은 그대로, 처음 한 번 원본을 `.floe-bak`으로 남기고, 깨진 설정이면 쓰지 않는다(409). 넣는 칸은 지금 실행 파일(Electron이면 `ELECTRON_RUN_AS_NODE`)로 [mcp-stdio.js](mcp-stdio.js)를 켜고, 포트와 **토큰 파일 자리**만 담는다(값은 넣지 않는다). 중계 파일은 줄마다 `/mcp/<토큰>`에 넘기고, Floe가 꺼져 있으면 `mcp.js`가 직접 답한다(도구 목록 · 'Floe 앱이 열려 있지 않아요'). AI 연결을 대신하지 않는다 — Floe의 판정 · 초안은 여전히 Claude Code나 API 키. 잇고 나면 Claude Desktop을 다시 켠다.
- 웹으로 써 보는 법: ① `NAV_MCP=1 node server.js` ② 다른 창에서 터널 ③ 웹 AI에 `https://<터널 주소>/mcp/<~/.floe-mcp-token의 값>`을 MCP 서버로 더한다. **이 주소를 아는 사람은 지금 할 일 · 적은 줄을 읽고 제안을 띄울 수 있다** — 시험이 끝나면 터널을 닫는다. 밖으로 나가는 것: [security-records.md](../../.claude/rules/security-records.md) 3절.
- 시험: [`mcp.test.js`](../../04-tests/navigator/mcp.test.js)(가짜 웹 AI가 JSON-RPC를 직접 보낸다 — 진짜 웹 AI · 터널은 부르지 않는다). 2026-10-25 헤드리스 Chrome으로 상태 → `floe_now` → `floe_report` → 카드 → 맞아요 → Ⅰ에 적힘을, 퀘스트 없는 화면에서 `floe_start` → 시작 카드 → 맞아요 → 진짜 AI 초안으로 1단계 퀘스트 → `floe_report`까지 확인했다. 같은 날 Electron 실행 파일을 node로 켠 중계 파일이 켜져 있는 앱의 지금 상태를 읽는 것까지 확인했다. 진짜 웹 GPT · 웹 Claude · Claude Desktop 화면으로는 **확인 못 함**. 시험: [`app-link.test.js`](../../04-tests/navigator/app-link.test.js) · E2E [`setup-flow.test.js`](../../04-tests/e2e/setup-flow.test.js).

### 3-25. `GET /api/files` — 작업실 파일 칸: 연결한 폴더의 파일 · 폴더 이름만 (C-42 R-8, 2026-10-27)

<!-- claude-drafted: 2026-10-27 — 이재엽 버튼 "전부"(R-8을 페이블에) · "깊이 3 · 200개". 코드보다 시험(files-api.test.js)을 먼저 썼다 -->
- 확인 값(쿠키 · `X-Nav-Token`)이 있어야 한다. 본문 없음 — **경로를 받지 않는다**(물음표 뒤 값도 보지 않는다). 폴더는 3-18과 같다(앱이 고른 작업 폴더, 없으면 훅 알림의 cwd) — 서버 메모리의 그 폴더 안만 본다.
- **읽기만 · 이름만.** 파일 내용은 읽지 않는다. 바로가기(심볼릭 링크)는 따라가지 않고 목록에도 넣지 않는다(폴더 밖으로 나가는 길을 막는다). 빼는 것: 점으로 시작하는 것(`.git` · `.env` · `.claude` …) · `node_modules` · 비밀값 파일(`.claude/hooks/check-secrets.sh`의 금지 경로와 같은 모양 — `.env.*` · `id_rsa` · `id_ed25519` · `credentials.json` · `*.pem` · `*.key` · `*.p12` · `*.pfx`). 이름은 [sensitive.js](sensitive.js)로 한 번 더 가린다.
- 한계: 깊이 3(맨 위가 1 — `docs/03-requirements/requirements.md`까지), 200개(넘으면 `cut: true` — 화면은 "더 있어요"). 폴더마다 파일 먼저 · 이름순, 깊이 우선(폴더 안쪽이 바로 뒤에 온다). 규칙은 [files.js](files.js).
- 답(늘 200) `{ ok: true, project, files, total, cut, depth, max, why }` — `project`는 폴더 **이름**만, `files`는 `[{ name, path(폴더 안 상대 경로), dir, depth }]`. 폴더를 모르면 `files: null, why: "folder"`.
- 화면: 작업실 창을 열 때 부른다(`app.js loadFiles`) — 지금 장 문서(`docs/<장 폴더>/…`)는 '● 지금', 지난 장 문서는 '읽음', 폴더는 눌러 접고 펼친다(지금 장의 폴더는 펼쳐져 있다). 서버 없이 · 연습 모드 · 폴더를 모르면 예시 목록(`FILES_DUMMY`)에 '예시' 표시. 시험: `04-tests/navigator/files-api.test.js`.

### 3-26. `GET /api/file?i=N` · `POST /api/file` — 작업실 파일 보기 · 고치기 (C-43, 2026-10-27)

<!-- claude-drafted: 2026-10-27 — 이재엽 "orca를 인용해서 코드나 md 파일을 확인" · 버튼 "읽기 + 고치기" · "바로 저장 + 되돌리기" · "저장마다 커밋 맡기기" · "512KB · 내용을 이해하고 어떤 내용인지만 판단". 코드보다 시험(files-api.test.js)을 먼저 썼다 -->
- 확인 값(쿠키 · `X-Nav-Token`)이 있어야 한다. **경로를 받지 않는다** — 3-25 목록의 **번호(`i`)**로만 연다(목록은 서버 메모리에 마지막 것 하나. 폴더가 바뀌었거나 빠졌으면 옛 목록으로 열지 않는다 — 400). 번호가 없거나 범위 밖이면 404, 폴더면 400.
- **열기(GET)** — 그 폴더 안의 파일만(가는 길에 바로가기가 있으면 400, [files.js](files.js) `safePath`), 512KB(`FILE_MAX`)까지, **내용으로** 글 파일인지 본다(앞 8KB에 NUL이 없고 UTF-8로 읽힘 — 확장자 목록이 아니다, 이재엽 "내용을 이해하고 어떤 내용인지만 판단"). 그림 · 압축 · 실행 파일은 `ok:false, why:"binary"`, 크면 `why:"big"` — 까닭(`reason`)은 쉬운 말. `kind`는 보이는 방식만(md · code · text — 모르면 text).
  - `changed`: 작업 폴더가 git이면 `git diff -U0 HEAD -- <파일>`의 덩어리 머리에서 새 쪽의 [시작, 개수]만(내용은 받지 않는다), 아직 git에 없는 파일은 `"new"`, git이 아니거나 실패하면 `[]`. 지금 장 문서 · Claude Code가 고친 파일의 바뀐 줄이 여기서 온다.
- **저장(POST)** `{ i, path, text, mtime, eol?, force?, overwrite?, ignoreBusy?, commit? }` — 본문은 글 파일 크기만큼(`readJson` 한계 ≈ 1MB, 넘으면 413). 그 파일에만 쓴다(폴더 · 목록 밖 · 바로가기는 400 · 404). `path`(열 때 받은 가린 경로)가 목록의 그것과 다르면 409 `moved`(폴더가 바뀌었거나 다른 화면이 목록을 갈아끼움 — 다른 파일을 덮지 않게). `mtime`은 `overwrite`가 아니면 꼭(없으면 400). `eol: "crlf"`면 줄 끝을 CRLF로 되돌려 쓴다(화면의 글 칸은 LF — Windows 문서가 통째로 바뀌지 않게). 열기 답의 `eol`이 그것이다.
  - 비밀번호 · 키 모양(sensitive.js `scan` — block)이 있으면 **쓰지 않고** 409 `why:"sensitive"`(+ `labels`) — 화면이 "그대로 저장 / 고칠게요"를 묻고, `force: true`로 다시 보내면 쓴다(막지는 않는다 — security-records 6-3).
  - 연 뒤에 파일이 바뀌었으면(`mtime` 다름 — Claude Code가 고치는 중일 수 있다) 409 `why:"changed"`(+ 지금 `mtime`) → `overwrite: true`로 덮어쓴다. 맡긴 일이 돌고 있으면(앞선 '저장 커밋'은 빼고) 409 `why:"busy"` → `ignoreBusy: true`. 깃발은 따로다 — 비밀값 검사는 어느 쪽이든 그대로.
  - `commit: true`면 쓴 뒤 **그 파일만** 커밋 · 지금 브랜치를 푸시하도록 Claude Code에 맡긴다(`saveRequest` — 강제 푸시 없음, 원격이 없으면 푸시하지 않고 까닭만. 기준 둘 `SAVE_CHECKS`). 허락 카드는 섬의 채팅에(3-13 ~ 3-15). 넘긴 일이 이미 돌고 있으면 저장만 하고 `note`에 "저장했어요 · 커밋은 앞 일이 끝난 뒤 다시 저장하면 맡겨요"(6-1 — 무엇이 빠졌는지). 답 `{ ok, mtime, task, note }`.
  - 글 파일 판단: 앞 8KB에 NUL이 없고 UTF-8로 읽힘(8KB 경계에 걸린 글자는 떼고 본다). UTF-16(BOM)은 "글자 방식이 UTF-8이 아니에요"로.
- 화면(`app.js` `filePane` · `openFile` · `saveFile`): 파일 칸의 파일을 누르면 열린 파일 탭 · 판 — md는 보기 좋게([md-view.js](md-view.js) — 모든 글을 가려 태그가 살아나지 않는다, 링크는 http(s)만 새 창) · 원문, 코드 · 글은 줄 번호와 바뀐 줄 표시. 고치기 → 글 칸, 저장(단추 · ⌘/Ctrl+S)은 바로 쓰고, 저장 이력은 열린 파일마다 20번(이 켜짐 동안, 되돌리기). 이름 찾기. 서버 없이 · 연습 모드는 예시 목록이라 열지 않는다. 시험: `04-tests/navigator/files-api.test.js` · `md-view.test.js` · `file-view.test.js` · `e2e/file-view.test.js`.

### 3-27. `GET /api/docmap?now=<경로>` — 문서 지도: 문서가 이어진 모습을 보드 데이터로 (C-45, 2026-10-27)

<!-- claude-drafted: 2026-10-27 — 이재엽 "아치보드로 문서들이 이어지고 확인이 가능한 기능" · 버튼 "작업실의 새 탭" · "앱에 한 벌 넣기" -->
- 확인 값이 있어야 한다. 읽기만 — 연결한 폴더(3-18과 같은 '폴더 고르기')의 `docs/**` · `README.md` · `CLAUDE.md`(3-25 목록 규칙 — 숨김 · 비밀값 · 바로가기 제외, 깊이 3) md를 앞 64KB만 읽어 **링크만** 본다. `now`는 지금 장 문서의 폴더 안 상대 경로(화면이 준다 — 그 문서를 `part`로 표시).
- 만드는 것([docmap.js](docmap.js) `build`, archi-board format 1): 문서 하나 = 상자 하나(`dobject`, `c`에 경로), 창 셋(단계 문서 · 기획서/결정 기록 · 저장소), 선은 `## 재료` 절의 링크가 `realization`(1순위 — 어느 단계 칸에서 왔나), 그 밖의 md 링크가 `association`. git에서 바뀐 문서(`git status --porcelain`)는 `cand`. 없는 문서로 가는 선 · 폴더 밖 링크는 버린다. 답에 절대 경로 없음.
- 화면: 작업실 '문서 지도' 탭 → `navigator/docmap.html`(iframe)이 이 길을 불러 `window.BOARD`에 두고 **엔진 사본** [board/](board/README.md)(archi-board v1, MIT, 앱 안 — 밖으로 요청 없음)으로 그린다. 상자를 누르면 오른쪽 판에 '파일 보기에서 열기' — 부모에 `postMessage({ floe: "open", path })` → 파일 보기(3-26). 폴더를 모르면 `ok:false, why:"folder"`와 까닭. 시험: `04-tests/navigator/docmap.test.js` · `e2e/docmap.test.js`.

### 3-28. `POST /api/preset` — 문서 고치기 맡기기 틀 (C-44, 2026-10-27)

<!-- claude-drafted: 2026-10-27 — 이재엽 "md파일을 수정하거나 다른 문서들을 수정하기 위한 프리셋" · 버튼 "Floe의 맡기기 틀" · "지금 자리에 더한다" -->
- 확인 값이 있어야 한다. 본문 `{ i 또는 path, preset, stage?, note? }` — `i`는 3-25 목록의 번호(연 파일), `path`는 `docs/` 안의 md 이름(지금 장 문서 — 아직 없는 파일도 된다, 그 밖의 모양은 400). `preset`은 [presets.js](presets.js)의 id(없으면 400). 화면은 가린 경로를 보내지 않고 서버가 번호를 폴더 안 상대 경로로 바꾼다.
- 서버가 `presets.js` `requestOf`(틀 이름 · 파일 · 지금 단계 · 지시 · 쉬운 말 규칙(C-33) · 그 파일만 · 커밋 안 함)로 글을 만들어 3-16과 같이 `startTask`(label '틀로 맡기기', 끝 조건 = 틀의 `checks`)로 Claude Code에 맡긴다 — 허락은 섬(3-13 ~ 3-15), 끝에 기준마다 보고(C-32). 답은 3-16과 같은 `{ ok, task }` + `preset` · `name`; 넘긴 일이 돌고 있으면 409.
- 틀은 한 파일에 모아 사람이 더하고 고친다(시험은 모양만 본다 — 개수 · 이름을 고정하지 않는다). 화면(`app.js presetGo`): 연 파일 머리의 '틀로 맡기기' 고르기 · 채팅의 '문서 틀' 칩 → 보고가 오면 열린 파일의 바뀐 줄을 다시 읽는다.

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

### 3-29. `POST /api/prepare` — 2단계 끝에 3 ~ 8단계 준비된 퀘스트를 이 프로젝트의 말로 (C-56 R-2 · C-54, 2026-10-28)

<!-- claude-drafted: 2026-10-28 — questfit 넘김 ⓓ(이재엽 버튼 "이 프로젝트의 말 + 방법 이름 꼬리표"). #228이 규칙(stagemap.js)으로만 두었던 '준비된 퀘스트'를 AI 한 번으로 맞춘다 -->
- 본문 `{ tier?, idea, prev, base? }` — `idea` 받은 글(400자), `prev` 1 · 2단계 결과(`[{ stage, items }]`, 3-22와 같은 모양), `base` 기준 카드를 '칸: 내용' 줄로(1,500자까지, 3-22의 `base`와 같다 — 초안 요청에도 같이 간다).
- 답 `{ ok, prepare: { cards: { "2": { title, think, act, from }, … "7": … }, say }, tokens }` — 코드 2 ~ 7(앱 3 ~ 8단계)이 다 있어야 한다(빠지면 502). `title`은 이 프로젝트의 말로 된 이름(40자 — 전문 용어가 들면 비워 화면이 할 일 이름으로), `think` ① 생각, `act` ② 행동(맡길 일), `from` 근거(기획서 n절 / 없으면 '새로 정함'). ③ 기록 · ④ 저장 · ⑤ 버전은 화면이 규칙(stagemap.js)으로 더한다.
- 받은 글 · 기준 · 지난 단계 결과에 없는 숫자 · 사람 · 날짜는 지어내지 않는다(요청문). 빠른 모델. 연습 모드는 부르지 않는다 — 규칙으로만.


### 3-30. `GET /api/find?q=<할 일 이름>` — 이미 있는 내용 옮겨 적기: 폴더의 글 파일에서 칸의 답 후보 줄 (C-56 R-4, 2026-10-28)

<!-- claude-drafted: 2026-10-28 — questfit 넘김 ⓔ(이재엽 버튼 "'옮김' 새 값"). 기획서 · README에 이미 있는 답을 다시 적게 하지 않고, 그 줄을 보여 고르게 한다 -->
- `q`는 그 칸의 할 일 이름(+ 묻는 말), 200자까지. 없으면 400.
- 답 `{ ok, found: [{ i, path, line, text, hits }], files, why }` — 3-25의 마지막 목록 안에서 글 파일(md · txt — 내용이 글이고 64KB까지, 앞에서 20개)만 읽어 낱말이 겹치는 줄 셋(`findlines.js`: 조사를 떼고 틀 말을 뺀 낱말, 제목 줄이 맞으면 그 아래 첫 글 줄, 코드 · 표 · 200자 넘는 줄은 뺀다). `text`는 원문 그대로(목록 표시만 떼고, 비밀값 · 전화 · 이메일은 가림), `i`는 목록 번호(3-26으로 열 수 있다), `path`는 가린 상대 경로. 목록을 아직 안 받았거나 폴더가 바뀌었으면 `found:[]`에 `why:"folder"`.
- 화면: 묻는 카드 · 확인 카드에 '폴더에서 찾기' 칩 → 후보 줄 카드(파일 · 줄 · 원문) → '이 줄로'를 누르면 그 줄이 그대로 그 칸에 들어가고 누가 = **옮김**(quest.js BY `moved`), '원문 보기'는 파일 보기(3-26)로 연다. 원문끼리 다르면 셋 다 보여 사람이 고른다 — 서버는 합치거나 지어내지 않는다. 연습 모드 · 서버 없이는 칩이 없다.
