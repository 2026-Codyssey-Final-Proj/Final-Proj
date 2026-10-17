<!-- claude-drafted: 2026-10-17 — 이재엽의 요청("각자의 토큰을 사용할 수 있도록")으로 Claude가 썼다. -->

# Navigator 서버 (프로토타입)

단계 판정·설계도·알림을 보여 주는 로컬 화면의 **서버 쪽**이다. 서버는 이 컴퓨터(`127.0.0.1`)에서만 열린다.
화면 파일은 [`02-frontend/navigator/`](../../02-frontend/navigator/README.md), 시험은 [`04-tests/navigator/`](../../04-tests/README.md)에 있다(2026-10-17 폴더 정리).

```bash
node server.js                          # → http://127.0.0.1:4317
python ../../tests/run_all_tests.py      # 테스트 (서버 없이, 실제 AI 호출 없이)
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
| `NAV_MODEL` | 모델 | `claude-opus-5-5` |
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
NAV_MODEL=<운영팀이 알려 준 모델 이름>
```

- 주소를 두면 **호환 모드**가 자동으로 켜진다 — 옛 모델·중계 서버가 못 받는 새 기능을 빼고, 스키마를 글로 알려 줘서 JSON만 받는다.
- 시작 로그와 `smoke.js`의 첫 줄에 **보내는 곳(호스트)** 이 나온다. 중계 서버를 쓰면 **작업 글이 그 서버를 거친다**는 점을 알고 쓴다.

## 보내는 것

키가 있으면 **작업 글이 Claude(AI 서비스)로 전송된다**([기록·보안 기준](../../.claude/rules/security-records.md) 1절). 화면에도 그렇게 안내된다.
비밀번호·다른 사람 연락처는 넣지 않는다. 외부 호출은 `provider.js` 한 곳에서만 한다(`04-tests/navigator/navigator.test.js`가 확인).
