<!-- claude-drafted: 2026-10-17 — 이재엽의 요청("각자의 토큰을 사용할 수 있도록")으로 Claude가 썼다. -->

# Floe 서버 — navigator (프로토타입)

단계 판정·설계도·알림을 보여 주는 로컬 화면의 **서버 쪽**이다. 서버는 이 컴퓨터(`127.0.0.1`)에서만 열린다.
화면 파일은 [`02-frontend/navigator/`](../../02-frontend/navigator/README.md), 시험은 [`04-tests/navigator/`](../../04-tests/README.md)에 있다(2026-10-17 폴더 정리).

화면·훅이 서버를 부르는 모양(주소·요청·응답·거절)은 **[로컬 API 약속](API.md)** 에 있다 — 시험 [`api-contract.test.js`](../../04-tests/navigator/api-contract.test.js)가 그대로 답하는지 확인한다. <!-- claude-drafted: 2026-10-18 -->

```bash
node server.js                          # → http://127.0.0.1:4317
python ../../04-tests/run_all_tests.py   # 테스트 (실제 AI 호출 없이)
```

## 누구의 토큰으로 부르나 — 각자 자기 것

키와 로그인은 **저장소에 없다.** 각자 컴퓨터의 환경에만 있고, 그래서 한도와 사용량도 각자 것이다.

| 내 컴퓨터 상태 | 어떻게 부르나 | 비용·한도 |
|---|---|---|
| `ANTHROPIC_API_KEY`가 있다 | **내 API 키**로 Claude API 호출 | 내 키의 한도 |
| 키는 없고 Claude Code에 로그인했다 | `claude -p` (이 컴퓨터의 로그인) | 내 구독 |
| 둘 다 없다 | 화면의 **연습용 예시** (미리 만든 응답, 전송 없음) | 없음 |

### 내 키로 쓰기 — 세 줄

```bash
cd 03-backend/navigator
npm install                      # 한 번만 (API 호출 도구를 받는다 — 키 없이 쓰면 필요 없다)
cp .env.example .env             # 그리고 .env의 ANTHROPIC_API_KEY= 뒤에 내 키를 붙여 넣는다
node --env-file=.env smoke.js    # 되는지 확인 (아주 작은 호출 1번)
node --env-file=.env server.js   # 화면 켜기
```

- `.env`는 `.gitignore`에 있고 커밋 때 `check-secrets.sh`가 한 번 더 막는다. **키를 채팅·이슈·PR·스크린샷에 붙이지 않는다.**
- `--env-file`은 Node 20.6 이상이다. 대신 `export ANTHROPIC_API_KEY=...`를 해도 된다.
- 시작할 때 `AI: 내 API 키(...)`라고 나오면 내 키로 부르는 중이다. 주소 `http://127.0.0.1:4317/api/usage`에서도 보인다(키 값은 없다).

## 한도 지키기

| 환경변수 | 뜻 | 기본 |
|---|---|---|
| `NAV_TOKEN_BUDGET` | 이 키로 쓸 토큰 한도. **80%에서 알리고 100%에서 멈춘다**(화면은 '연습용 예시'로 바꾸라고 안내) | 없음(막지 않음) |
| `ANTHROPIC_BASE_URL` | 중계 서버 주소(코디세이 가상 키를 쓸 때). 바꾸면 **호환 모드가 자동으로 켜진다** — SDK가 이 값을 읽는다 | 공식 주소 |
| `NAV_COMPAT` | `1`이면 새 기능(구조화 출력·effort·폴백) 없이 JSON만 요청한다. `0`이면 주소를 바꿔도 끈다 | 주소가 있으면 켜짐 |
| `NAV_MODEL` | 모델 | 공식 주소 `claude-opus-5-5` · 중계 서버 `claude-opus-4-8` |
| `NAV_EFFORT` | 생각의 깊이(`low`·`medium`·`high`…) — 높을수록 토큰이 더 든다 | `low` |
| `NAV_MAX_TOKENS` | 한 번에 받을 답의 최대 토큰 | `2048` |
| `NAV_FALLBACK` | `off`로 두면 거절 때 대체 모델로 다시 시도하는 기능을 끈다 | 켜짐 |
| `NAV_USAGE_FILE` | 사용량을 적는 파일 | `~/.navigator-usage.json` |

- 사용량은 **토큰 수만** 홈 폴더 파일에 남긴다(글 내용은 남기지 않는다). 키를 바꾸거나 새 한도로 시작하려면 그 파일을 지운다.
- 한 번 부를 때 대략 2,000~3,000토큰이다(추정 — 시작 로그와 `smoke.js`가 실제 값을 보여 준다).
- 모델은 더 싼 것(`claude-sonnet-5-5`, `claude-haiku-5-5`)으로 바꿔도 된다. 판정이 달라질 수 있으니 바꾼 뒤 한 번 확인한다.

## 예산 통 — 용도별로 몫을 나눠 쓰기

`.env`에 `NAV_PLAN=default`를 두면 한도가 **네 통**으로 나뉜다. 한 통을 다 쓰면 그 용도만 멈추고, **예비는 잠겨 있다.**

| 통 | 몫 | 하는 일 | 켜는 법 |
|---|---|---|---|
| `dev` 규칙·프롬프트 | 40만 | 판정 규칙·프롬프트 다듬기, `live-check` | (기본) `node --env-file=.env live-check.js` |
| `test` 사용자 테스트 | 20만 | 테스터 5명 — **한 명 몫 4만** | `NAV_PURPOSE=test NAV_TESTER=A node --env-file=.env server.js` |
| `demo` 리허설·녹화 | 20만 | 시연용 진짜 답 녹화, 리허설 | `NAV_PURPOSE=demo node --env-file=.env record-demo.js` |
| `reserve` 예비 | 20만 | 위 통이 다 찼을 때만 | `NAV_USE_RESERVE=1` 을 붙여야 쓴다 |

- `NAV_PLAN`은 직접 적을 수도 있다: `NAV_PLAN=dev=300000,test=150000,demo=150000,reserve=100000`. 합이 전체 한도가 되고, `NAV_TOKEN_BUDGET`을 따로 주면 그것이 전체 상한이다.
- **테스터**는 `NAV_TESTER=A`, `B`…로 이름을 줘서 사람마다 센다. 한 명이 자기 몫을 다 쓰면 그 사람만 막히고 다른 테스터는 계속된다(`NAV_TESTER_BUDGET`으로 직접 정할 수도 있다).
- Windows PowerShell: `$env:NAV_PURPOSE="test"; $env:NAV_TESTER="A"; node --env-file=.env server.js`
- 오타(`NAV_PURPOSE=dve`)는 "예산에 없어요"로 알려 준다.
- **얼마나 썼나:** `node --env-file=.env usage.js` — 전체·통별·테스터별.

## 녹화·재생 — 시연은 토큰 0으로

진짜 AI의 답을 **한 번 받아 파일에 두고**, 리허설·시연·팀원 시험에서는 그 답을 재생한다. 재생하는 동안은 **키도 토큰도 필요 없다**(대회 장소에서 네트워크가 불안할 때의 백업이기도 하다).

```bash
node --env-file=.env record-demo.js --list     # 무엇을 녹화할지만 보기 (호출 없음)
NAV_PURPOSE=demo node --env-file=.env record-demo.js   # 녹화 — 이미 한 것은 건너뜀, demo 통에서 차감
NAV_REPLAY=recordings/demo.json node server.js         # 재생 — 키 없이 진짜 AI 답으로 시연
```

- 녹화 대상: 판정 9개와 1~4단계 설계도 초안·리뷰. 파일은 `recordings/demo.json`이고 **AI의 답만** 들어간다(키·사용자 글 없음). 팀이 같이 쓰도록 커밋해도 된다.
- 재생은 **요청이 글자까지 같을 때만** 된다. 녹화에 없는 요청(직접 쓴 새 글, 직접 고친 설계도, 직접 한 질문)은 "녹화에 없는 요청이에요"로 알려 준다 → **시연 대본을 정해진 글로** 하면 된다.
- 프롬프트·판정 규칙을 고쳤다면 요청이 달라지므로 `--again`으로 다시 녹화한다.

## 실제 AI 점검 — 토큰으로 제품을 시험하기

```bash
node --env-file=.env live-check.js            # 앞의 3개만 (토큰 아끼기)
node --env-file=.env live-check.js --stage 2  # 2단계 예시만
node --env-file=.env live-check.js --all      # 글이 있는 예시 전부
node --env-file=.env live-check.js --all --report ../../docs/verification/live-check-2026-10-17.md   # 결과를 기록 파일로
```

연습 예시마다 "미리 만든 정답 판정"이 있다. 같은 글을 **실제 AI에 판정시켜** ① 우리 검증(형식)을 통과하는지 ② 정답과 몇 칸이 맞는지 ③ 한 번에 토큰이 얼마나 드는지 본다.
판정 규칙·프롬프트를 고친 뒤 같은 명령으로 다시 돌려 비교한다.

**`--report 파일`** 은 결과를 마크다운 기록(환경 · 결과표 · 요약)으로 만든다. "발견해 고친 것"과 "하지 못한 것" 두 칸은 **사람이 채운다**(우리 6단계 검증 기록 형식). 주소·키·글 내용은 담지 않고, 이미 있는 파일은 덮어쓰지 않는다(`--force`로만). 올리는 법은 [팀 작업 가이드](../../01-docs/00-overview/team-guide.md). 키(401)·한도 오류가 나면 남은 예시는 부르지 않는다. 출력에는 예시 라벨만 나오고 글 내용·키는 나오지 않는다.

## 코디세이 중계 서버(가상 키)로 쓰기

운영팀이 준 키가 **공식 Anthropic 키가 아니라 중계 서버용 "가상 키"** 라면, 공식 주소로 보내면 `API 키가 맞지 않아요 (401)`이 나온다. `.env`에 이렇게 둔다.

```
ANTHROPIC_API_KEY=<가상 키>
ANTHROPIC_BASE_URL=<운영팀이 알려 준 주소>
NAV_MODEL=claude-opus-4-8   # 또는 claude-opus-4-7. 비워 두면 claude-opus-4-8
```

- **중계 서버가 받는 모델은 `claude-opus-4-8`·`claude-opus-4-7` 두 개다**(운영팀 목록, 2026-10-17). `NAV_MODEL`을 비워 두면 `claude-opus-4-8`로 부른다 —
  공식 기본 모델(`claude-opus-5-5`)은 중계 서버에 없어서 그대로 두면 400/404가 난다. 목록이 바뀌면 `provider.js`의 `RELAY_MODELS`를 고친다.
- 중계 서버에서 400/404가 나면 오류 문구가 받는 모델 이름을 알려 준다.

- 주소를 두면 **호환 모드**가 자동으로 켜진다 — 옛 모델·중계 서버가 못 받는 새 기능을 빼고, 스키마를 글로 알려 줘서 JSON만 받는다.
- 시작 로그와 `smoke.js`의 첫 줄에 **보내는 곳(호스트)** 이 나온다. 중계 서버를 쓰면 **작업 글이 그 서버를 거친다**는 점을 알고 쓴다.

## 보내는 것

키가 있으면 **작업 글이 Claude(AI 서비스)로 전송된다**([기록·보안 기준](../../.claude/rules/security-records.md) 1절). 화면에도 그렇게 안내된다.
비밀번호·다른 사람 연락처는 넣지 않는다. 외부 호출은 `provider.js` 한 곳에서만 한다(`04-tests/navigator/navigator.test.js`가 확인).

## 시연 안전장치 — 시연 전 한 줄 점검

<!-- claude-drafted: 2026-10-18 — 이재엽의 요청("남은 요구사항 작업")으로 Claude가 S3~S5를 만들고 이 절을 썼다. 점검표 원본: navigator-prototype-rules-review.md 6절. -->

시연에서 실제 대화를 보이려면 [점검표](../../01-docs/00-overview/navigator-prototype-rules-review.md)(6절 S1~S6)가 모두 있어야 한다. 시험은 [`04-tests/navigator/demo-safety.test.js`](../../04-tests/navigator/demo-safety.test.js)(위반 시도부터).

**시연 직전에 한 번 읽고 체크한다 (S6):**

> ☐ 실제 모드 / ☐ 시연 프로젝트만 연결 / ☐ 토큰 있음 / ☐ 개인 세션 닫음 — 그리고 서버를 새로 켜서 기록을 비운다

| 체크 | 어떻게 확인하나 |
|---|---|
| 실제 모드 | 화면을 펼쳐 위쪽 줄 오른쪽이 `진짜 AI`인지 (`연습용 예시`면 톱니 → 보기 방식) |
| 시연 프로젝트만 연결 | `node connect.js <시연 폴더>`(미리보기)로 대상 파일을 보고 `--apply`. 내 작업 폴더에 단 적이 있으면 `node connect.js <내 폴더> --remove`. Codex는 전체에 걸리므로(`--codex`) 시연 때만 단다 |
| 토큰 있음 | 서버 시작 로그에 `알림 확인 값: …` 줄이 있고, 화면을 **서버 주소(`http://127.0.0.1:4317`)로 새로 열었다**(파일로 연 화면은 알림을 못 받는다) |
| 개인 세션 닫음 | 개인 작업을 하던 Claude Code·Codex 창을 닫았다 — 훅이 달린 창이면 그 대화가 알림으로 온다 |
| 기록 비움 | 서버를 껐다 켰다(아래 "기록 비우기") |

### 점검표 상태 (2026-10-18)

| # | 항목 | 상태 |
|---|---|---|
| S1 | 시연 프로젝트의 새 세션만 연결 | **사람이 확인** — 위 `connect.js` 미리보기. 코드가 막지는 않는다 |
| S2 | 연결 상태 배지·한 번에 해제 | **일부** — 펼친 화면 위쪽 줄에 `진짜 AI`/`연습용 예시`가 늘 보이고, 알림을 받으면 초록 불이 켜진다. 설정(톱니)에 "연결됨 · 프로젝트 · 마지막 알림" 또는 "기다리는 중". **빠진 것:** 접힌 띠·한 줄에는 보기 방식이 안 보이고, 화면에서 한 번에 해제하는 버튼이 없다 — `연습용 예시`로 바꿔도 알림은 계속 받아 글 칸을 채운다. 지금 해제는 `connect.js --remove`나 서버 끄기. 화면(`02-frontend/navigator/app.js`) 담당의 몫 |
| S3 | 이벤트 주소의 확인 값(토큰) | **됨** — 아래 |
| S4 | 받은 알림 글의 민감 패턴 검사 | **됨** — 아래 |
| S5 | 시연 뒤 기록 비우기 | **됨** — 서버 다시 켜기 또는 지우기 주소. 화면 버튼은 없다(화면의 `기록 지우기`는 이 브라우저의 기록만 지운다) |
| S6 | 시연 전 한 줄 점검 | **됨** — 위 |

### 확인 값(알림 토큰, S3)

AI 토큰(`NAV_TOKEN_BUDGET`)과는 다른 것이다 — 알림 주소를 부를 자격을 확인하는 값이다.

- 서버를 켜면 홈 폴더에 `~/.navigator-event-token`을 만든다(**나만 읽기, 600**). 저장소 밖이라 커밋되지 않는다. 자리를 바꾸려면 `NAV_EVENT_TOKEN_FILE`.
- **훅**(`hook.js`)은 부를 때마다 이 파일을 읽어 `X-Nav-Token` 머리글로 보낸다. **화면**은 서버가 페이지를 줄 때 주는 쿠키(`HttpOnly`·`SameSite=Strict`·`Path=/api` — 2026-10-18부터 AI 네 주소에도 같은 확인 값)로 보낸다 — 화면 코드는 바꾸지 않았다.
- 값이 없거나 틀리면 `/api/event`·`/api/events`·`/api/events/clear`는 **403** `{ "ok": false, "reason": "…" }`. 값은 로그·화면 어디에도 나오지 않는다.
- 파일이 있으면 그대로 쓴다(서버를 다시 켜도 열어 둔 화면이 계속 된다). **바꾸려면** 서버를 끄고 파일을 지운 뒤 다시 켜고, 화면을 새로 고친다.
- 파일 내용을 채팅·이슈·스크린샷에 붙이지 않는다. Windows에서는 600 대신 홈 폴더의 기본 권한(그 사용자만)에 기댄다.

### 받은 글 검사 (S4)

알림 글은 **저장하기 전에** [공유 규칙](../share/share-rules.js)과 같은 패턴으로 가린다 — 키·토큰 모양, 비밀번호 대입, 주민번호는 `[비밀값]`, 이메일·전화·IP는 `[이메일 가림]`처럼.
서버 메모리에도 원래 값이 남지 않으므로, 화면에서 AI로 보내는 글에도 없다. 패턴에 없는 모양(새 키 형식, 띄어 쓴 전화번호)은 못 잡으니 **시연 대본에 실제 비밀값·연락처를 넣지 않는다.**

### 기록 비우기 (S5)

- **서버를 다시 켠다** — 알림과 대화는 메모리에만 있어 다 빈다. 가장 간단하다.
- 켠 채로 비우기: `curl -X POST -H "X-Nav-Token: $(cat ~/.navigator-event-token)" http://127.0.0.1:4317/api/events/clear` → `{"ok":true,"cleared":3}`
  (PowerShell: `curl.exe -X POST -H "X-Nav-Token: $(Get-Content ~/.navigator-event-token)" http://127.0.0.1:4317/api/events/clear`). 알림 번호는 이어진다 — 열어 둔 화면이 새 알림을 놓치지 않게.
