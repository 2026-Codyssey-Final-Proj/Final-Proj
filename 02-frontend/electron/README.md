# 02-frontend/electron — Floe 오버레이 앱 (Electron 껍데기, 알파)

<!-- claude-drafted: 2026-10-19 — 이재엽의 요청("dmg로 하나 만들어서 여기서라도 한번 테스트")으로 Claude가 만들고 썼다. 02-frontend/README.md 2절의 "Electron 오버레이" 계획(임유정 제안, #14)을 Next.js 없이 지금 화면 그대로 감싼 것이다. -->

**이 폴더는:** 지금 돌아가는 화면(`../navigator` · `../library` · `../share`)과 서버(`../../03-backend/navigator/server.js`)를 **그대로** 하나의 실행 파일로 감싼다. 화면 · 서버 코드는 손대지 않았다. 켜면 ① 앱 설정 폴더의 `.env`(내 키, 있으면) ② Mac이면 로그인 셸의 PATH(`claude` 명령) ③ 같은 프로세스에서 Floe 서버 ④ **항상 위에 뜨는 투명 창**으로 그 주소를 연다. 뒤의 예시 코딩 도구 창은 숨긴다 — 진짜 코딩 도구가 뒤에 있으니까(`app.css` `.in-app`).

| 파일 | 무엇 |
|---|---|
| `main.js` | 앱 — 서버 띄우기 · 창 · 메뉴(프로젝트 폴더 연결 / 빼기 · 설정 폴더 · 브라우저로 열기 · 끄기). Mac은 위 메뉴 줄, **Windows · Linux는 창 우클릭과 트레이 아이콘**에 같은 메뉴(테두리 없는 창엔 메뉴 줄이 없다, 6.0.0) |
| `preload.js` | 화면이 앱에게 부탁할 수 있는 것(`window.floeApp`: connect · disconnect · openSettings · **saveKey · clearKey** — 처음 설정, 2026-10-19 · resize(anchor) · **expand** — 서고로 들어갈 때 창을 화면만큼, 6.2.0). 화면은 Node를 못 쓴다(contextIsolation · sandbox) |
| `lib.js` | 순수 함수 — `.env` 읽기 · PATH 합치기(Mac · Linux, 셸 고르기) · 훅 명령(app.asar → app.asar.unpacked) · 폴더 연결(connect.js 규칙 그대로). 시험 [`electron-lib.test.js`](../../04-tests/navigator/electron-lib.test.js) |
| `prebuild.js` | 묶기 전에 화면 · 서버를 `payload/`로 복사(node_modules · `.env*` · 문서 제외). git에 올리지 않는다 |
| `package.json` | Electron 44.9.0 · electron-builder 26.15.3(4.0.0에서 33 · 25에서 올림 — 이 Mac은 macOS 26이라 옛 Electron의 입력 · 창 문제를 피하려고) · `@anthropic-ai/sdk`(내 키로 쓸 때) · 묶기 설정(`build`: mac dmg · win nsis · **linux AppImage + deb**, `homepage` · `author`는 deb가 요구하는 칸 — 사람 메일은 없다) |

> **플로로의 눈(2026-10-19, 앱 6.0.1):** 화면은 자기 창 안의 마우스만 안다 — 창이 섬 크기라 커서는 거의 늘 창 밖이어서, `main.js`가 바탕 화면 커서를 1초에 30번까지 읽어 **창 밖일 때만** 화면에 보낸다(`preload.js` `onCursor`, `lib.js` `cursorMsg`). 눈만 따라오고 졸음은 깨우지 않는다. 화면은 받은 점으로 바로 뛰지 않고 프레임마다 미끄러져 간다(`seal.js` `glide`, F-27 — 바로 뛰면 1초 20~30번의 계단이 보인다). 이 창은 거의 늘 포커스가 없으니 `backgroundThrottling`을 꺼 프레임이 느려지지 않게 했다.

## 켜기 · 묶기

```bash
cd 02-frontend/electron
npm install                 # 한 번 (Electron 100MB를 받는다)
npm start                   # 개발 중 — 저장소의 화면 · 서버 코드를 바로 읽는다
npm run dist                # Mac: dist/Floe-<버전>-arm64.dmg  (서명 없음 — 처음 열 때 우클릭 → 열기)
npm run dist:win            # Windows에서만: dist/Floe-Setup-<버전>.exe
npm run dist:linux          # 우분투용(Mac · Linux에서 됨): dist/Floe-<버전>-x86_64.AppImage · -amd64.deb · -arm64.AppImage · -arm64.deb
```

- 포트는 `NAV_PORT`(기본 4317)부터 **빈 포트**를 찾아 앱이 늘 자기 서버를 켠다. 터미널에 다른 Floe 서버가 떠 있어도 거기 붙지 않는다(첫 알파의 "옛 화면" 문제).
- **처음 켜면 플로로가 반기고 연결을 돕는다**(2026-10-19, 화면 `../navigator/setup.js`): Claude Code로 연결(찾기 · 로그인 · 폴더 연결 · 연결 확인) 또는 API 키 넣기 중 하나를 고른다. 키는 화면이 `floeApp.saveKey`로 앱에 넘기고, **앱이 설정 폴더의 `.env`에 쓴다(나만 읽기 600)** — 화면 · 브라우저 저장소 · 서버 주소에는 남지 않는다. 앱 안의 서버라 다시 켜지 않아도 다음 호출부터 그 키로 부른다. 다시 고르려면 톱니 → **처음 설정 다시 하기**.
- 손으로 넣어도 된다: 메뉴 **Floe → 설정 폴더 열기**에 `.env`(모양은 [`../../03-backend/navigator/.env.example`](../../03-backend/navigator/.env.example)). 없으면 이 컴퓨터의 Claude Code 구독. 키는 앱 묶음 · 저장소에 들어가지 않는다.
- **프로젝트 폴더 연결**(메뉴 또는 톱니 → 연결 칸의 단추)은 그 폴더의 `.claude/settings.local.json`에 훅을 더한다 — `connect.js --apply`와 같은 규칙 · 백업. 훅은 `node`로 `app.asar.unpacked` 안의 `hook.js`를 부르므로 **그 컴퓨터에 node가 있어야 한다**(팀 알파에서는 모두 있다). node 없는 사람을 위한 길은 미정.
- 기록(내 책 · 느낀 점)은 앱 안의 브라우저 저장소에 남는다 — 브라우저로 연 화면과는 따로다.

### 우분투 Linux (6.0.0부터 — 이재엽 2026-10-19 "우분투 리눅스에서도 돌아가는 버전", 발표용)

- **받기:** `Floe-<버전>-x86_64.AppImage`(보통 PC) — `chmod +x` 뒤 실행(또는 파일 속성 → "프로그램으로 실행 허용" → 더블클릭). 설치하고 싶으면 `sudo apt install ./Floe-<버전>-amd64.deb` → 앱 메뉴의 Floe. ARM 컴퓨터는 `-arm64`.
- AppImage가 "FUSE"를 찾으면: 우분투 24.04는 `sudo apt install libfuse2t64`, 22.04는 `libfuse2`. 아니면 `./Floe-*.AppImage --appimage-extract` 뒤 `squashfs-root/floe-app`.
- **메뉴:** 테두리 없는 창이라 메뉴 줄이 없다 → **창 우클릭** 또는 알림 영역(트레이)의 Floe 아이콘. (GNOME에 트레이가 안 보이면 우클릭만 쓴다 — 우분투 기본에는 트레이 확장이 들어 있다.)
- **투명 · 항상 위:** `enable-transparent-visuals`를 켜고 창을 ready 뒤 잠깐 기다려 만든다. 우분투 기본(GNOME, Wayland 세션)에서는 Electron이 XWayland로 뜨고 항상-위가 먹는다. 합성기 없는 가벼운 데스크톱에서는 투명 대신 검게 나올 수 있다 — 그러면 Floe 창 뒤가 검게 보이는 것이지 기능은 그대로다.
- `claude` 찾기: 앱 메뉴로 연 앱의 PATH는 짧아 Mac처럼 **로그인 셸의 PATH**(`$SHELL -ilc`, 없으면 bash)를 합친다. 훅은 `node`로 돈다 — 그 컴퓨터에 node가 있어야 한다(Mac · Windows와 같음).
- 서명 없음(Linux는 원래 서명 경고가 없다). 자동 업데이트 없음 — 새 버전은 다시 받는다.

## 받기 · 업데이트 — 자동화

묶은 파일은 저장소가 아니라 [GitHub Releases](https://github.com/2026-Codyssey-Final-Proj/Final-Proj/releases)에 올린다(비공개 레포라 팀원만 받는다). 지금 알파는 `app-v7.0.0`(2026-10-19 — Mac `.dmg` · Windows `.exe` · 우분투 `.AppImage` / `.deb`, 각 100~130MB. 0.3.0 · 3.0.0은 위 문제로 내렸다).

**언제 새 버전을 내나 — 팀이 버전업을 정할 때만**(이재엽 2026-10-19 "지금 작업들에서 릴리즈는 나중에 우리가 버전업을 할때 해줘"). 작업 PR은 CHANGELOG 한 줄만 넣고 아래 `version`은 그대로 둔다 — 그사이 고친 것을 앱으로 써 보려면 각자 `npm run dist`로 묶는다.

**새 버전을 내는 법 — 사람이 할 일은 숫자 하나:** 이 폴더 `package.json`의 `version`을 올려 PR → main에 병합. 그러면 [`.github/workflows/app-release.yml`](../../.github/workflows/app-release.yml)이
① Release `app-v<버전>`을 만들고(이미 있으면 그대로) ② **Mac(arm64) · Windows · Linux** 러너에서 `npm run dist` / `dist:win` / `dist:linux`를 돌려 ③ `.dmg` · `.exe` · `.AppImage` · `.deb`를 그 Release에 올린다. 비밀값 없음(저장소 기본 토큰), 서명 없음.
6.0.0부터 **Linux(ubuntu 러너, `dist:linux`)**도 같이 — `.AppImage` · `.deb`(x86_64 · arm64). Actions 탭에서 손으로도 돌릴 수 있다(workflow_dispatch). 비용: 비공개 저장소 Actions 분 — macOS 러너는 10배로 세어 한 번에 약 50분어치(무료 2,000분/월).

**쓰는 사람 쪽:** 메뉴 **Floe → Floe <버전> · 새 버전 확인**이 Releases를 연다 — 받아서 덮어쓰면 된다. 기록(내 책 · 느낀 점)은 앱 설정 폴더에 남아 이어진다.
**앱 안 자동 업데이트(electron-updater)는 아직 안 한다** — 비공개 저장소의 Release를 앱이 직접 받으려면 토큰을 앱에 넣어야 해서(새는 길) 못 쓰고, Release를 공개로 하면 코드 없이 묶음만 보인다. 둘 중 무엇으로 갈지는 이재엽 결정 — 그때까지는 "새 버전 확인 → 받기".

## 확인한 것 (2026-10-19, 이재엽의 Mac · arm64)

- **Mac 노치 도우미(2026-10-19, 아직 앱 버전 안 올림 — 다음 버전업에 들어간다):** `notch/notch-probe.swift`를 `swiftc -O`로 묶어 돌리니 이 Mac(14인치)에서 `{"menuBar":39,"notch":{"height":38,"width":220,"x":918},"screen":{"height":1329,"width":2056}}`가 찍혔다 — 노치 220×38pt, 화면 가운데(918 + 110 = 1028). 명령줄 도구의 기본 SDK(27.0)는 컴파일러(Swift 6.3.3)와 안 맞아 실패해, `prebuild.js`가 설치된 SDK를 새것부터 대 본다(26.5에서 성공). 창 자리 계산(`lib.js` `parseNotchProbe` · `notchLayout` · `islandX`)은 노드 시험(`04-tests/navigator/electron-notch.test.js`)으로만 봤다. **못 본 것:** 앱을 실제로 켜서 띠가 노치 위에 검게 덮이는지, 메뉴 줄 위 창이 클릭을 받는지, 전체 화면 앱 위에 보이는지 — 이재엽이 `npm start`나 `npm run dist`로 켜 보고 알려 줘야 한다.
- **6.2.0(설정 옆 · 따라오기 · 서고 넓히기):** 묶은 앱을 CDP로 열어 설정을 켜면 창이 오른쪽으로만 넓어지고(x 그대로), 서고 주소로 넘어가면 창이 화면만큼 커지고 돌아오면 다시 섬 크기가 되는 것을 봤다 — 섬 947×513 → 설정 열림 1338×826(x 그대로, 글자 '아주 크게' 1452) → 닫으면 946×512 → 서고 1440×960 → 돌아오면 937×177. 버벅임은 사람이 느끼는 것이라 **이재엽이 다시 써 보고** 말해 줘야 한다.
- **6.0.0 Linux(도커의 우분투 24.04, arm64, 화면은 Xvfb):** `Floe-6.0.0-arm64.deb`를 `apt install`로 넣고 `/opt/Floe/floe-app`을 켜니 서버가 켜지고(`/` · `/api/usage` 200), 앱 화면이 `in-app`으로 뜨며(`window.floeApp` 있음) 창이 섬 크기를 따라가고(947×187, 섬 940×180) 휴대폰 탭 막대가 없는 것을 CDP로 봤다. 처음엔 `libasound2`가 없어 켜지지 않아 deb 의존 목록에 더했다(`package.json` `deb.depends`). **못 본 것:** 진짜 마우스 클릭 · 투명 · 항상-위 · 트레이(합성기 있는 데스크톱이 필요) — 이재엽이 우분투 PC(x86_64)에서 확인.
- **0.4.0(처음 설정 · 옛 서버 알아보기, #113 브랜치에서만 — 병합 때 #115의 "늘 자기 서버"로 합쳐 옛 서버 알아보기는 뺐고 앱은 5.0.0):** `npm run dist`로 `Floe-0.4.0-arm64.dmg`. 묶은 앱을 포트 4398로 켜서 `/api/setup`의 지문이 저장소 코드의 지문과 같은 것(`9d9dd5cd0b87`), 첫 화면에 처음 설정("반가워요! 저는 길잡이 물범 플로로예요.")이 뜨고 `window.floeApp.saveKey`가 있는 것을 CDP로 봤다(누르지는 않았다 — 처음 설정 기록이 남지 않게). 옛 서버가 먼저 떠 있을 때의 묻는 창은 **사람이 아직 눌러 보지 않았다**(판단 함수만 시험: `electron-setup.test.js`).

- `npm run dist`로 `Floe-3.0.0-arm64.dmg`(100MB)가 나왔고, 묶은 앱을 켜서 서버가 켜지고(`/api/usage` 200) 화면이 확인 값 쿠키와 함께 오며(`/` 200), 앱 안에서 `window.floeApp`이 있고 뒤 창이 숨고 바탕이 투명하며 유리 흐림 · 굴절이 꺼진 것을 CDP로 봤다. 4317이 막혀 있을 때 4318로 켜지는 것도.
- **첫 알파(0.3.0)의 문제(이재엽 2026-10-19):** 같은 포트에 먼저 켜져 있던 옛 서버에 붙어 옛 화면 · 배경이 그대로 보였고, 투명 창 위의 유리 굴절 때문에 랙이 심했다. → 앱은 늘 자기 서버를 켜고(빈 포트), 앱 안에서는 굴절 · backdrop-filter를 끈다. 아이콘도 플로로로.
- **3.0.1 뒤에도 "클릭이 안 된다"(이재엽):** 렌더러 안의 클릭(CDP)은 정상이라 창 · 운영체제 쪽이다. 4.0.0에서 Electron을 33 → 44로 올리고 전체 화면 보조 창 옵션(`visibleOnFullScreen`)을 뺐다. **진짜 마우스 클릭은 Claude가 확인하지 못한다**(이 세션의 터미널에 손쉬운 사용 권한이 없어 AppleScript 클릭이 거부됨) — 사람이 4.0.0를 써 보고 알려 줘야 한다.
- **3.0.0의 문제(이재엽 2026-10-19 "아직도 랙 · 기능들이 클릭이 안 됨"):** 창이 1040×760인데 보이는 건 위쪽 섬뿐이라, 투명한 빈 영역이 뒤 창(VS Code · 터미널)의 클릭을 전부 가로챘고 큰 투명 창을 매 프레임 그려 무거웠다. 렌더러 자체는 121fps · 클릭 정상(CDP로 확인). → **3.0.1: 창이 지금 보이는 섬 크기를 따라간다**(`floe:resize` — 인사 946×186, 작업 카드 946×316, 설정 열면 946×1066, 접으면 540×60). 화면 높이에 기댄 CSS 제한(`100vh`)은 앱 안에서 푼다.
- 자동 시험에는 Electron을 넣지 않는다(묶음이 무겁다). `lib.js`만 Node 시험. 사람이 써 본 기록은 이재엽 1회(0.3.0, 위 문제 보고).

> **모아 보기 창(2026-10-20, C-11 · C-12 — 아직 앱 버전 안 올림):** 섬과 따로 뜨는 **보통 창**(테두리 있음 · 항상 위 아님 · Dock에 앉음, 900×600 · 최소 480×420, 하나만) — 메뉴 "모아 보기 열기" · 트레이 클릭 · Mac Dock 클릭 · 섬 위쪽 줄의 격자 단추로 연다(`main.js` `openHub`, `preload.js` `openHub` · `enter` · `onEnter`, `lib.js` `hubBounds`). 바이브 코딩 '들어가기'는 섬 창을 앞으로 보내고 '이번 단계'로(IPC `floe:enter`). 닫아도 섬 · 서버는 그대로. **사람이 아직 켜 보지 않았다** — 시험은 `04-tests/navigator/electron-hub.test.js`(글로 맞대기 · `hubBounds`)뿐이다. 기능 설명: [`01-docs/features/11-hub/`](../../01-docs/features/11-hub/README.md).

## 아직 아닌 것

- 서명 · 공증 없음(Apple 개발자 계정 필요 — 이재엽 결정). 아이콘은 `build/icon.png`(플로로 SVG를 1024px로 그린 것 — 원본 그림이 아니라 코드로 그린 플로로).
- 창 자리를 기억하지 않는다(켤 때마다 위쪽 가운데). 크기는 섬을 따라가지만, 설정 창을 열면 1,000px 넘게 길어져 작은 화면에서는 아래가 잘릴 수 있다.
- 접힌 띠 · 한 줄 상태에서는 창을 끌 수 없다(위쪽 줄이 있는 펼침 상태에서만).
- **설정 창은 섬 오른쪽에**(6.2.0) — 창이 오른쪽으로 넓어지고 섬은 제자리(anchor left). 화면 오른쪽 끝에 붙어 있으면 창을 안쪽으로 당긴다. **서고로 들어가면**(`/library/`) 창이 화면만큼(최대 1440×960) 넓어지고, 내비게이터로 돌아오면 다시 섬 크기로 줄어든다.
- **휴대폰 화면은 없다** — 앱 안에서는 창이 600px보다 좁아져도 PC 화면 그대로다(5.2.0, 이재엽 "모바일 화면은 아직 만들지 않도록"). 휴대폰 화면은 브라우저에서 좁게 열 때만 나온다.
- **Mac 노치(다이내믹 아일랜드) 모양은 사람이 아직 켜 보지 않았다**(2026-10-19 이재엽 결정 "Swift 도우미로 정확히" — 아래 "확인한 것"). 메뉴 줄 위(`screen-saver` 레벨)에 둔 창의 **실제 클릭 · 끌기**, 전체 화면 앱(VS Code 전체 화면) 위에 보이는지는 확인 못 했다 — 전체 화면 보조 창 옵션(`visibleOnFullScreen`)은 3.0.2에서 입력 문제로 뺀 채 그대로다. 도우미는 주 화면(`NSScreen.main`) 하나만 읽는다 — 외부 모니터를 주 화면으로 쓰면 노치가 없다고 본다. Windows · Linux에는 노치 모양이 없다(위쪽 가운데 띠 그대로).
- Windows `.exe`는 Windows에서 묶어야 한다(CI가 묶는다, 사람이 써 본 기록은 아직). **Linux는 이 Mac의 도커(우분투 24.04, arm64)에서 deb를 설치해 켜 본 것까지다** — 진짜 우분투 PC(x86_64)에서 화면 · 클릭 · 트레이는 이재엽이 확인해야 한다(아래 "확인한 것").
- 자동 업데이트 없음 — 새 버전은 다시 내려받는다.
