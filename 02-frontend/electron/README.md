# 02-frontend/electron — Floe 오버레이 앱 (Electron 껍데기, 알파)

<!-- claude-drafted: 2026-10-19 — 이재엽의 요청("dmg로 하나 만들어서 여기서라도 한번 테스트")으로 Claude가 만들고 썼다. 02-frontend/README.md 2절의 "Electron 오버레이" 계획(임유정 제안, #14)을 Next.js 없이 지금 화면 그대로 감싼 것이다. -->

**이 폴더는:** 지금 돌아가는 화면(`../navigator` · `../library` · `../share`)과 서버(`../../03-backend/navigator/server.js`)를 **그대로** 하나의 실행 파일로 감싼다. 화면 · 서버 코드는 손대지 않았다. 켜면 ① 앱 설정 폴더의 `.env`(내 키, 있으면) ② Mac이면 로그인 셸의 PATH(`claude` 명령) ③ 같은 프로세스에서 Floe 서버 ④ **항상 위에 뜨는 투명 창**으로 그 주소를 연다. 뒤의 예시 코딩 도구 창은 숨긴다 — 진짜 코딩 도구가 뒤에 있으니까(`app.css` `.in-app`).

| 파일 | 무엇 |
|---|---|
| `main.js` | 앱 — 서버 띄우기 · 창 · 메뉴(프로젝트 폴더 연결 / 빼기 · 설정 폴더 · 브라우저로 열기 · 끄기) |
| `preload.js` | 화면이 앱에게 부탁할 수 있는 다섯(`window.floeApp`: connect · disconnect · openSettings · **saveKey · clearKey** — 처음 설정, 2026-10-19). 화면은 Node를 못 쓴다(contextIsolation · sandbox) |
| `lib.js` | 순수 함수 — `.env` 읽기 · PATH 합치기 · 훅 명령(app.asar → app.asar.unpacked) · 폴더 연결(connect.js 규칙 그대로). 시험 [`electron-lib.test.js`](../../04-tests/navigator/electron-lib.test.js) |
| `prebuild.js` | 묶기 전에 화면 · 서버를 `payload/`로 복사(node_modules · `.env*` · 문서 제외). git에 올리지 않는다 |
| `package.json` | Electron 33.2.1 · electron-builder 25.1.8 · `@anthropic-ai/sdk`(내 키로 쓸 때) · 묶기 설정(`build`) |

## 켜기 · 묶기

```bash
cd 02-frontend/electron
npm install                 # 한 번 (Electron 100MB를 받는다)
npm start                   # 개발 중 — 저장소의 화면 · 서버 코드를 바로 읽는다
npm run dist                # Mac: dist/Floe-<버전>-arm64.dmg  (서명 없음 — 처음 열 때 우클릭 → 열기)
npm run dist:win            # Windows에서만: dist/Floe-Setup-<버전>.exe
```

- 포트는 `NAV_PORT`(기본 4317). **같은 포트에 Floe 서버가 이미 켜져 있으면** 그 서버의 지문(`/api/setup`의 `build`)을 이 앱의 코드와 맞대어 본다(2026-10-19). 같으면 그대로 쓰고, **다르거나 지문이 없으면(옛 판)** 묻는다 — **옛 서버 끄고 새로 켜기**(node로 켠 `server.js` · `floe.js`만 끈다, Mac · Linux) · 그대로 쓰기 · Floe 끄기. 2026-10-19에 dmg가 옛 화면을 보인 까닭이 이것이었다(전날 다른 폴더에서 켠 `server.js`가 4317을 잡고 있었다).
- **처음 켜면 플로로가 반기고 연결을 돕는다**(2026-10-19, 화면 `../navigator/setup.js`): Claude Code로 연결(찾기 · 로그인 · 폴더 연결 · 연결 확인) 또는 API 키 넣기 중 하나를 고른다. 키는 화면이 `floeApp.saveKey`로 앱에 넘기고, **앱이 설정 폴더의 `.env`에 쓴다(나만 읽기 600)** — 화면 · 브라우저 저장소 · 서버 주소에는 남지 않는다. 앱 안의 서버라 다시 켜지 않아도 다음 호출부터 그 키로 부른다. 다시 고르려면 톱니 → **처음 설정 다시 하기**.
- 손으로 넣어도 된다: 메뉴 **Floe → 설정 폴더 열기**에 `.env`(모양은 [`../../03-backend/navigator/.env.example`](../../03-backend/navigator/.env.example)). 없으면 이 컴퓨터의 Claude Code 구독. 키는 앱 묶음 · 저장소에 들어가지 않는다.
- **프로젝트 폴더 연결**(메뉴 또는 톱니 → 연결 칸의 단추)은 그 폴더의 `.claude/settings.local.json`에 훅을 더한다 — `connect.js --apply`와 같은 규칙 · 백업. 훅은 `node`로 `app.asar.unpacked` 안의 `hook.js`를 부르므로 **그 컴퓨터에 node가 있어야 한다**(팀 알파에서는 모두 있다). node 없는 사람을 위한 길은 미정.
- 기록(내 책 · 느낀 점)은 앱 안의 브라우저 저장소에 남는다 — 브라우저로 연 화면과는 따로다.

## 확인한 것 (2026-10-19, 이재엽의 Mac · arm64)

- **0.4.0(처음 설정 · 옛 서버 알아보기):** `npm run dist`로 `Floe-0.4.0-arm64.dmg`. 묶은 앱을 포트 4398로 켜서 `/api/setup`의 지문이 저장소 코드의 지문과 같은 것(`9d9dd5cd0b87`), 첫 화면에 처음 설정("반가워요! 저는 길잡이 물범 플로로예요.")이 뜨고 `window.floeApp.saveKey`가 있는 것을 CDP로 봤다(누르지는 않았다 — 처음 설정 기록이 남지 않게). 옛 서버가 먼저 떠 있을 때의 묻는 창은 **사람이 아직 눌러 보지 않았다**(판단 함수만 시험: `electron-setup.test.js`).

- `npm run dist`로 `Floe-0.3.0-arm64.dmg`(100MB)가 나왔고, 묶은 앱을 포트 4399로 켜서 서버가 켜지고(`/api/usage` 200) 화면이 확인 값 쿠키와 함께 오며(`/` 200), 앱 안에서 `window.floeApp`이 있고 뒤 창이 숨고 바탕이 투명한 것을 CDP로 봤다.
- 자동 시험에는 Electron을 넣지 않는다(묶음이 무겁다). `lib.js`만 Node 시험. 사람이 써 본 기록은 아직 없다.

## 아직 아닌 것

- 서명 · 공증 없음(Apple 개발자 계정 필요 — 이재엽 결정). 앱 아이콘은 Electron 기본.
- 창 크기 · 자리를 기억하지 않는다. 접힌 띠 크기로 창을 줄이는 것은 아직 — 창은 1040×760 고정 시작.
- Windows `.exe`는 Windows에서 묶어야 한다(아직 안 해 봄). 노치 모양은 하지 않는다(Mac 전용).
- 자동 업데이트 없음 — 새 버전은 다시 내려받는다.
