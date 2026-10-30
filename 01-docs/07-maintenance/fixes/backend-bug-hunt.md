<!-- claude-drafted: 2026-10-30 — 임유정 요청("내 담당 아닌 것들도 고쳐줘"). 팀 규칙대로 남의 담당 폴더도 동의를 기다리지 않고 고치고, 조각 파일의 '건드린 곳'이 알림이다. -->

# F-104 묶음 — 서버(`03-backend/navigator/`) 코드 점검에서 나온 오류

[고칠 목록](../fix-map.md) 2절 **F-104** 줄이 가리키는 묶음이다. 줄마다의 상태는 여기에만 적는다(fix-map 끝줄에서 PR끼리 부딪치지 않게).

- 어디서 나왔나: 2026-10-29 레포 전체 코드 점검(읽기만 — 영역별 리뷰어 여섯, 상위 항목은 코드를 다시 열어 확인). 화면 쪽은 [F-103](screen-bug-hunt.md), 훅 · CI 쪽은 [F-105](hooks-bug-hunt.md).
- 고친 사람: 임유정(Claude가 씀). 서버는 다른 담당의 폴더라 PR · 조각의 '건드린 곳'으로 알린다.
- 확신: **확실** = 코드로 원인이 분명함(일부는 실행해 재현) / **그럴듯함** = 조건이 맞아야 일어남. 줄 번호는 main이 자주 바뀌어 함수 이름으로 적는다.
- 시험: [backend-bug-hunt.test.js](../../../04-tests/navigator/backend-bug-hunt.test.js) — 모듈을 불러 실제로 돌린다(훅은 진짜로 띄워 보낸다). 고치기 전 13개 모두 빨강 확인.

| ID | 무엇이 문제인가 | 고칠 곳 | 깨지는 상황 | 확신 | 상태 |
|---|---|---|---|---|---|
| F-104-1 | 개인키는 `-----BEGIN … PRIVATE KEY-----` 머리 줄만 가리고 본문(base64) · 끝 줄은 남긴다 | `sensitive.js` | PEM 키가 든 글을 대화 · 계획 · 가져갈 것 · 문서 쓰기에 넣으면 키 본문이 AI로 간다 | 확실 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-2 | JSON 꼴 `"password": "…"`, `github_pat_` · `gho_` 등, `Authorization: Bearer …`를 못 잡는다 | `sensitive.js` | 설정 파일을 붙여 넣으면 경고도 가림도 안 된다 | 확실 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-3 | 훅이 포트를 `NAV_PORT \|\| 4317`로 고정, 앱은 4317이 차면 옆 포트를 쓴다 | `hook.js` · `approve-hook.js` · `server.js` · `electron/main.js` | 4317에 옛 서버가 떠 있으면 허락 요청 · 알림이 엉뚱한 서버로 간다 | 그럴듯함 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-4 | 본문을 다 읽은 뒤 `req.on("close")`를 걸어 Node 16+에서는 오지 않는다 | `server.js` `holdApproval` | 사람이 터미널에서 직접 답해 훅이 끊겨도 섬에 허락 카드가 90초 남는다 | 확실 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-5 | async `handle`에 catch가 없고 정적 파일 읽기 오류를 안 본다 | `server.js` `handle` | 잠긴 · 지워진 파일을 열면 답 없이 화면 fetch가 끝없이 기다린다 | 확실(원인) | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-6 | 제목 줄 정규식 `(.+?)\s*#*\s*$`가 공백이 길면 세제곱으로 느려진다(ReDoS) | `md-view.js` · `feed.js` | `# a` + 공백 2,000개 + `b` → 0.64초, 4,000개 → 약 5초(직접 측정) | 확실 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-7 | `spawnSync`(호출마다 4초)로 이벤트 루프를 붙잡는다. 서버는 Electron 메인 안에서 돈다 | `github.js` · `server.js`(`githubNow` · `githubCreate` · `shipDocs`) | 네트워크가 느리면 설정 · 문서 올리기 동안 앱 전체가 십수 초 멈춘다 | 확실(코드) | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-8 | `runCommand`가 출력을 `trim()`해 porcelain 첫 줄의 앞 공백이 사라진다 | `project.js` `runCommand` | 첫 수정 문서가 `ocs/a.md`처럼 잘려 '고친 문서' 표시가 틀린다 | 확실 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-9 | `end`가 선언 전인 `const timer`를 읽는다(TDZ) | `project.js` `runCommand` | `spawn`이 바로 던지면 `{ missing: true }` 대신 ReferenceError로 거부 | 확실(드묾) | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-10 | 셸 없이 `spawn("claude")` — Windows는 `claude.exe`만 찾는다 | `provider.js` | npm으로만 깐 PC(`claude.cmd`) → 판정 · 일 넘기기 전부 실패 | 그럴듯함 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-11 | Windows에서 `child.kill()`은 claude만 끝내고 자식은 남긴다 | `server.js` `stopTask` · `provider.js` | '멈춤' 뒤에도 하위 명령(npm · 개발 서버)이 파일을 고치거나 포트를 붙잡는다 | 그럴듯함 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-12 | 줄 안의 줄바꿈을 그대로 `- …`로 쓴다 | `docs.js` | 다시 읽으면 둘째 줄이 사라지고 문서가 '사람이 고친 것'으로 잡혀 이후 덮지 않는다 | 그럴듯함 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-13 | 첫 줄 매칭 전에 UTF-8 BOM을 떼지 않는다 | `docs.js` `parseStage` · `parseSource` | Windows 편집기가 BOM을 붙여 저장하면 그 단계 문서를 못 읽는다 | 그럴듯함 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-14 | 폴더 안 판정을 대소문자 구분 `startsWith`로 한다 | `steps.js` | cwd `c:/…` · 파일 `C:/…`이면 바뀐 파일이 대화 목록에 안 잡힌다 | 그럴듯함 | 고치는 중 — `v2/backend-bug-hunt` |
| F-104-15 | 폴더에서 되읽은 단계 결과를 서버 모양 검사 없이 돌려준다(F-103-9에서 넘김) | `server.js` `docsRead` | 사람이 단계 문서를 길게 고치면 화면이 그대로 보내 `/api/docs` · `/api/chat` 등이 계속 400 | 그럴듯함 | 고치는 중 — `v2/backend-bug-hunt` |

## 어떻게 고쳤나 — 한 줄씩

- **1 · 2** 개인키는 머리 줄 뒤의 머리말 · 빈 줄 · base64 줄과 끝 줄까지 한 덩이로(줄마다 줄바꿈으로 시작해 긴 줄에서도 느려지지 않음), GitHub 토큰은 `gh[pousr]_` · `github_pat_`, `Bearer` 값, 대입 꼴은 따옴표(`"password": "…"`)도.
- **3** 서버가 켠 포트를 확인 값 파일 옆 `<파일>.port`에 적고(`announcePort` — 앱 · 단독 서버 모두), 훅은 `NAV_PORT`가 없으면 그 파일을 읽는다. 시험은 hook.js를 진짜로 띄워 그 포트로 오는지 본다.
- **4** `res.on("close")` — 답을 다 보낸 뒤의 close(`writableFinished`)는 빼고.
- **5** `handle`을 감싸 예외면 500(이미 보내기 시작했으면 끊기), 정적 파일 스트림 오류면 끊기.
- **6** 정규식은 `\s+(.+)$`만, 끝의 # · 공백은 한 번 훑는 `headText`로(5만 칸도 300ms 안).
- **7** `github.js`를 `spawn` 기반 async로 — `status` · `originKey` · `visibility`가 Promise, 서버의 세 곳이 기다린다. 기존 시험(github-api · knowledge-guard)은 `await`로 맞춤.
- **8 · 9** `trimEnd()`, `timer`를 먼저 선언.
- **10** `claudeLaunch` — Windows에서 `claude.exe`가 없고 `claude.cmd`만 있으면 그 옆 `node_modules/@anthropic-ai/claude-code/cli.js`를 node로(앱이면 `ELECTRON_RUN_AS_NODE`). 셸을 쓰지 않아 인자 따옴표가 깨지지 않는다. 판 묻기 · 판정 · 일 넘기기 세 곳.
- **11** `killTree` — Windows는 `taskkill /pid … /T /F`.
- **12 · 13** 줄 안의 줄바꿈은 공백으로 한 줄, BOM은 떼고 읽는다.
- **14** Windows 드라이브 경로는 소문자로 견준다.
- **15** `fitResult` — 할 일 8 · 줄 5 · 줄 400자 · 이름 200자 · 준비할 것 · 기준 · 배운 것을 서버 모양으로 줄이고 줄였으면 `fitted: true`.

## 새 맥락 리뷰 — 2026-10-30

- **막힘 → 고침:** 되읽은 결과를 줄여도(`fitResult`) '덮어도 되는 문서'(`lossless`)를 줄이기 전 글로 정해, 길게 고친 문서를 다음 올리기에서 잘린 글로 덮을 수 있었다 — 줄였으면 `lossless`가 아니다. 줄이기는 가린 뒤에(가림 표시가 길어 다시 넘지 않게).
- **보완 → 고침:** 개인키가 남던 경우(짧은 마지막 줄 · 들여쓴 YAML · JSON 글 속 `\n` · 암호화된 키의 머리말) — 시험에 넣음 · gh를 기다리는 사이 일이 시작됐거나 폴더가 바뀌면 쓰지 않음 · npm claude는 PATH의 `node`로(앱의 `ELECTRON_RUN_AS_NODE`가 하위 명령에 물려지지 않게) · 앱을 끌 때 `.port`를 지움 · 처리 중 오류를 한 줄 남김 · BOM 문서도 같은 글로 견줌 · `one`은 있던 `oneLine`을 씀.
- **보완(남김):** `Bearer authentication-scheme` 같은 낱말과 JSON의 `"token": null`을 비밀값으로 잘못 잡는다(경고만 — 그대로 보낼 수 있다) · `github.js`는 시간 초과 뒤 손자 프로세스가 출력을 쥐면 `close`가 늦을 수 있다(드묾) · `fitResult`는 `from` · `skip.items`를 줄이지 않는다.
- **확인 못 함:** 브라우저 e2e 82개는 이 컴퓨터에 puppeteer가 없어 건너뜀 — 서버 HTTP 시험은 돌았다.
