# 02-frontend/electron — Floe 오버레이 앱 (Electron 껍데기, 알파)

<!-- claude-drafted: 2026-10-19 — 이재엽의 요청("dmg로 하나 만들어서 여기서라도 한번 테스트")으로 Claude가 만들고 썼다. 02-frontend/README.md 2절의 "Electron 오버레이" 계획(임유정 제안, #14)을 Next.js 없이 지금 화면 그대로 감싼 것이다. -->

**이 폴더는:** 지금 돌아가는 화면(`../navigator` · `../library` · `../share`)과 서버(`../../03-backend/navigator/server.js`)를 **그대로** 하나의 실행 파일로 감싼다. 화면 · 서버 코드는 손대지 않았다. 켜면 ① 앱 설정 폴더의 `.env`(내 키, 있으면) ② Mac이면 로그인 셸의 PATH(`claude` 명령) ③ 같은 프로세스에서 Floe 서버 ④ **항상 위에 뜨는 투명 창**으로 그 주소를 연다. 뒤의 예시 코딩 도구 창은 숨긴다 — 진짜 코딩 도구가 뒤에 있으니까(`app.css` `.in-app`).

| 파일 | 무엇 |
|---|---|
| `main.js` | 앱 — 서버 띄우기 · 창 · 메뉴(프로젝트 폴더 연결 / 빼기 · 설정 폴더 · 브라우저로 열기 · 끄기) |
| `preload.js` | 화면이 앱에게 부탁할 수 있는 셋(`window.floeApp`: connect · disconnect · openSettings). 화면은 Node를 못 쓴다(contextIsolation · sandbox) |
| `lib.js` | 순수 함수 — `.env` 읽기 · PATH 합치기 · 훅 명령(app.asar → app.asar.unpacked) · 폴더 연결(connect.js 규칙 그대로). 시험 [`electron-lib.test.js`](../../04-tests/navigator/electron-lib.test.js) |
| `prebuild.js` | 묶기 전에 화면 · 서버를 `payload/`로 복사(node_modules · `.env*` · 문서 제외). git에 올리지 않는다 |
| `package.json` | Electron 44.9.0 · electron-builder 26.15.3(3.0.2에서 33 · 25에서 올림 — 이 Mac은 macOS 26이라 옛 Electron의 입력 · 창 문제를 피하려고) · `@anthropic-ai/sdk`(내 키로 쓸 때) · 묶기 설정(`build`) |

## 켜기 · 묶기

```bash
cd 02-frontend/electron
npm install                 # 한 번 (Electron 100MB를 받는다)
npm start                   # 개발 중 — 저장소의 화면 · 서버 코드를 바로 읽는다
npm run dist                # Mac: dist/Floe-<버전>-arm64.dmg  (서명 없음 — 처음 열 때 우클릭 → 열기)
npm run dist:win            # Windows에서만: dist/Floe-Setup-<버전>.exe
```

- 포트는 `NAV_PORT`(기본 4317)부터 **빈 포트**를 찾아 앱이 늘 자기 서버를 켠다. 터미널에 다른 Floe 서버가 떠 있어도 거기 붙지 않는다(첫 알파의 "옛 화면" 문제).
- 내 API 키로 쓰려면 메뉴 **Floe → 설정 폴더 열기**에 `.env`를 둔다(모양은 [`../../03-backend/navigator/.env.example`](../../03-backend/navigator/.env.example)). 없으면 이 컴퓨터의 Claude Code 구독. 키는 앱 묶음 · 저장소에 들어가지 않는다.
- **프로젝트 폴더 연결**(메뉴 또는 톱니 → 연결 칸의 단추)은 그 폴더의 `.claude/settings.local.json`에 훅을 더한다 — `connect.js --apply`와 같은 규칙 · 백업. 훅은 `node`로 `app.asar.unpacked` 안의 `hook.js`를 부르므로 **그 컴퓨터에 node가 있어야 한다**(팀 알파에서는 모두 있다). node 없는 사람을 위한 길은 미정.
- 기록(내 책 · 느낀 점)은 앱 안의 브라우저 저장소에 남는다 — 브라우저로 연 화면과는 따로다.

## 받기 · 업데이트 — 자동화

묶은 파일은 저장소가 아니라 [GitHub Releases](https://github.com/2026-Codyssey-Final-Proj/Final-Proj/releases)에 올린다(비공개 레포라 팀원만 받는다). 지금 알파는 `app-v3.0.1`(2026-10-19, `Floe-3.0.1-arm64.dmg`, 100MB — 0.3.0 · 3.0.0은 위 문제로 내렸다).

**새 버전을 내는 법 — 사람이 할 일은 숫자 하나:** 이 폴더 `package.json`의 `version`을 올려 PR → main에 병합. 그러면 [`.github/workflows/app-release.yml`](../../.github/workflows/app-release.yml)이
① Release `app-v<버전>`을 만들고(이미 있으면 그대로) ② **Mac(arm64)과 Windows** 러너에서 `npm run dist` / `dist:win`을 돌려 ③ `.dmg` · `.exe`를 그 Release에 올린다. 비밀값 없음(저장소 기본 토큰), 서명 없음.
Actions 탭에서 손으로도 돌릴 수 있다(workflow_dispatch). 비용: 비공개 저장소 Actions 분 — macOS 러너는 10배로 세어 한 번에 약 50분어치(무료 2,000분/월).

**쓰는 사람 쪽:** 메뉴 **Floe → Floe <버전> · 새 버전 확인**이 Releases를 연다 — 받아서 덮어쓰면 된다. 기록(내 책 · 느낀 점)은 앱 설정 폴더에 남아 이어진다.
**앱 안 자동 업데이트(electron-updater)는 아직 안 한다** — 비공개 저장소의 Release를 앱이 직접 받으려면 토큰을 앱에 넣어야 해서(새는 길) 못 쓰고, Release를 공개로 하면 코드 없이 묶음만 보인다. 둘 중 무엇으로 갈지는 이재엽 결정 — 그때까지는 "새 버전 확인 → 받기".

## 확인한 것 (2026-10-19, 이재엽의 Mac · arm64)

- `npm run dist`로 `Floe-3.0.0-arm64.dmg`(100MB)가 나왔고, 묶은 앱을 켜서 서버가 켜지고(`/api/usage` 200) 화면이 확인 값 쿠키와 함께 오며(`/` 200), 앱 안에서 `window.floeApp`이 있고 뒤 창이 숨고 바탕이 투명하며 유리 흐림 · 굴절이 꺼진 것을 CDP로 봤다. 4317이 막혀 있을 때 4318로 켜지는 것도.
- **첫 알파(0.3.0)의 문제(이재엽 2026-10-19):** 같은 포트에 먼저 켜져 있던 옛 서버에 붙어 옛 화면 · 배경이 그대로 보였고, 투명 창 위의 유리 굴절 때문에 랙이 심했다. → 앱은 늘 자기 서버를 켜고(빈 포트), 앱 안에서는 굴절 · backdrop-filter를 끈다. 아이콘도 플로로로.
- **3.0.1 뒤에도 "클릭이 안 된다"(이재엽):** 렌더러 안의 클릭(CDP)은 정상이라 창 · 운영체제 쪽이다. 3.0.2에서 Electron을 33 → 44로 올리고 전체 화면 보조 창 옵션(`visibleOnFullScreen`)을 뺐다. **진짜 마우스 클릭은 Claude가 확인하지 못한다**(이 세션의 터미널에 손쉬운 사용 권한이 없어 AppleScript 클릭이 거부됨) — 사람이 3.0.2를 써 보고 알려 줘야 한다.
- **3.0.0의 문제(이재엽 2026-10-19 "아직도 랙 · 기능들이 클릭이 안 됨"):** 창이 1040×760인데 보이는 건 위쪽 섬뿐이라, 투명한 빈 영역이 뒤 창(VS Code · 터미널)의 클릭을 전부 가로챘고 큰 투명 창을 매 프레임 그려 무거웠다. 렌더러 자체는 121fps · 클릭 정상(CDP로 확인). → **3.0.1: 창이 지금 보이는 섬 크기를 따라간다**(`floe:resize` — 인사 946×186, 작업 카드 946×316, 설정 열면 946×1066, 접으면 540×60). 화면 높이에 기댄 CSS 제한(`100vh`)은 앱 안에서 푼다.
- 자동 시험에는 Electron을 넣지 않는다(묶음이 무겁다). `lib.js`만 Node 시험. 사람이 써 본 기록은 이재엽 1회(0.3.0, 위 문제 보고).

## 아직 아닌 것

- 서명 · 공증 없음(Apple 개발자 계정 필요 — 이재엽 결정). 아이콘은 `build/icon.png`(플로로 SVG를 1024px로 그린 것 — 원본 그림이 아니라 코드로 그린 플로로).
- 창 자리를 기억하지 않는다(켤 때마다 위쪽 가운데). 크기는 섬을 따라가지만, 설정 창을 열면 1,000px 넘게 길어져 작은 화면에서는 아래가 잘릴 수 있다.
- 접힌 띠 · 한 줄 상태에서는 창을 끌 수 없다(위쪽 줄이 있는 펼침 상태에서만).
- Windows `.exe`는 Windows에서 묶어야 한다(아직 안 해 봄). 노치 모양은 하지 않는다(Mac 전용).
- 자동 업데이트 없음 — 새 버전은 다시 내려받는다.
