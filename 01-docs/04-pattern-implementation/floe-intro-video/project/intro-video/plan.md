# Floe 소개 영상 제작 계획 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스토리보드대로 40초 · 1920×1080 · 30fps 소개 영상을 코드로 그려 `final/floe-intro-40s-sfx-only.mp4`(효과음만)를 만들고, 다음 세션에서 Suno 배경음악을 섞을 수 있게 해 둔다.

**Architecture:** 화면 전체를 320×180 칸의 SVG 한 장으로 보고, `renderFrame(t)`가 시간 t(초)의 SVG 문자열을 돌려주는 순수 함수로 만든다. 브라우저 페이지가 그 문자열을 그리고, 크롬(CDP)이 1/30초마다 찍은 PNG를 ffmpeg에 바로 흘려 mp4로 묶는다. 효과음은 JS로 합성한 WAV 트랙을 ffmpeg로 섞는다.

**Tech Stack:** Node 24 내장 기능만(http · fs · child_process · 전역 WebSocket · node:test), 크롬 헤드리스(CDP), ffmpeg/ffprobe 8.1, 팀 저장소의 `seal.js` · `seal.css` · 글꼴(읽기만).

**Spec:** `codyssey/final-project/intro-video/storyboard.md`

## Global Constraints

- 출력: 1920×1080, 30fps, 정확히 40.0초(1,200프레임), H.264 `yuv420p` + AAC 48kHz 스테레오, `-movflags +faststart`.
- 화면 글자는 둘뿐: ③-2 기능 이름 `① 8단계 길 안내` · `② 초안은 플로로, 확정은 나` · `③ 관문 · 이해하셨나요?` · `④ 문서가 내 GitHub에`(+ 칸 안 단추 말 `맞아요` `고칠래요` `이해하셨나요?` `예` `아니요` `배운 것 한 줄` `내 저장소`), ⑥ `Floe` · `당신을 위한 코딩 길잡이, Floe와 함께하세요`. ①·②·④·⑤에는 글자 없음.
- 우리가 넣는 글자에는 모두 `data-caption` 속성을 붙인다(시험이 이것으로 센다). 말풍선의 `</>`는 글자가 아니라 path로 그린다.
- 플로로는 `Final-Proj/02-frontend/navigator/seal.js`의 `NavSeal.svg(mood, 120, opts)` + `seal.css` 그대로. 크기는 transform scale로만 바꾼다(120 미만으로 부르면 작은 모양으로 바뀜). `Final-Proj/` 아래 파일은 절대 쓰지 않는다.
- 글꼴: `Floe`는 "Bagel Fat One", 나머지 글자는 "Gowun Dodum" — `Final-Proj/02-frontend/assets/fonts/`의 woff.
- 색 · 효과음 시점 · 장면 시간은 스펙 값을 그대로 쓴다(Task 1 · 4에 옮겨 둠).
- `refs/`는 빌드가 읽지 않는다. 결과물에 레퍼런스 그림이 들어가지 않는다.
- 프레임 PNG를 OneDrive 폴더에 쌓지 않는다(ffmpeg 표준 입력으로 바로 보냄). 확인용 스틸만 `build/stills/`에.
- npm 의존성 없음. 크롬 경로 기본값 `C:/Program Files/Google/Chrome/Application/chrome.exe`(환경 변수 `CHROME_PATH`로 바꿈). 미리 보기 서버 포트 4410.
- 커밋하지 않는다(CLAUDE.md — 사용자가 요청할 때만). 각 Task 끝은 "확인"까지.

## Review Focus

1. 글꼴이 다 불러와지기 전에 찍힘 → 맑은 고딕으로 나온 프레임. 렌더 전에 `document.fonts.check`로 두 글꼴을 확인하고 아니면 멈춘다 (Task 2).
2. 프레임 수 · 길이 어긋남(1,199장, 40.033초, 소리와 영상 길이 차이) → ffprobe로 1,200프레임 · 40.0초 · 소리 길이 확인 (Task 2, 11).
3. seal.css의 CSS 애니메이션이 찍는 동안 돌아 프레임마다 다르게 나옴 → `animation: none` 덮어쓰기 + 렌더 중 `document.getAnimations().length === 0` 확인 (Task 2).
4. 효과음이 깨지거나(클리핑) 너무 큼 → 트랙 최대값 0.89(−1 dBFS) 이하 시험 (Task 3).
5. 발표 프로그램(PowerPoint · Google Slides)에서 안 열림 → h264 · yuv420p · aac 확인 (Task 11).

---

### Task 1: 시간표 · 효과음 시점

**Files:**
- Create: `video/src/timeline.mjs`, `video/src/cues.mjs`
- Test: `video/test/timeline.test.mjs`

**Interfaces:**
- Produces (`timeline.mjs`): `DURATION = 40`, `FPS = 30`, `UNIT = 6`(1칸 = 6px), `SCENES = [{id,start,end}]` — `1a 0–2`, `1b 2–5`, `2 5–11`, `3-1 11–13`, `3-2 13–23`, `4 23–30`, `5 30–35`, `6 35–40`; `sceneAt(t) → {id,start,end,local}`(끝은 다음 장면, t는 0 이상 40 미만으로 자름); `frameTimes() → number[]`(i/30, 1,200개); `clamp(x,a,b)`, `lerp(a,b,x)`, `prog(t,a,b)`(0..1로 자름), `easeOutCubic`, `easeInOutCubic`, `easeOutBack(x)`; `pop(t, at, dur = 0.35) → number`(at 전 0, 최대 1.12 이하로 살짝 넘쳤다가 at+dur부터 1); `hop(t, t0, t1, from, to, height) → {x,y,sx,sy}`(포물선, 뛰기 직전 · 착지 직후 sx>1·sy<1로 찌그러짐).
- Produces (`cues.mjs`): `SFX_CUES`(아래 11개 그대로), `NOTE_HZ = {C5:523.25, E5:659.25, G5:783.99, C6:1046.5}`, `FLORO_ARRIVALS = [13.3, 15.8, 18.3, 20.8]`(ding 시점에서 뽑음).

- [ ] **Step 1: 실패하는 시험 쓰기** — `sceneAt(0).id==='1a'`, `sceneAt(1.999).id==='1a'`, `sceneAt(2).id==='1b'`, `sceneAt(5).id==='2'`, `sceneAt(11).id==='3-1'`, `sceneAt(13).id==='3-2'`, `sceneAt(23).id==='4'`, `sceneAt(30).id==='5'`, `sceneAt(35).id==='6'`, `sceneAt(40).id==='6'`; `frameTimes().length===1200`, 마지막 값 `1199/30`; `easeOutBack(0)===0`, `easeOutBack(1)≈1`; `pop(0.9,1)===0`, `pop(1.35,1)===1`, 그 사이 최대값 ≤ 1.12; `hop`의 t0 · t1 위치가 from · to와 같음; `SFX_CUES`가 정확히:

```js
[{t:6.0,kind:'pop'},{t:8.0,kind:'sparkle'},
 {t:13.3,kind:'ding',note:'C5'},{t:15.8,kind:'ding',note:'E5'},{t:18.3,kind:'ding',note:'G5'},{t:20.8,kind:'ding',note:'C6'},
 {t:27.0,kind:'dong'},{t:31.5,kind:'boing'},{t:33.0,kind:'sparkle'},{t:35.9,kind:'plop'},{t:36.6,kind:'chime'}]
```

- [ ] **Step 2: 실패 확인** — Run: `node --test video/test/` → FAIL (모듈 없음)
- [ ] **Step 3: `timeline.mjs` · `cues.mjs` 구현**
- [ ] **Step 4: 통과 확인** — Run: `node --test video/test/` → PASS

### Task 2: 미리 보기 페이지 · 렌더 파이프라인 (빈 장면으로 40초 영상까지)

**Files:**
- Create: `video/serve.mjs`, `video/index.html`, `video/style.css`, `video/fonts.css`, `video/src/frame.mjs`, `video/src/main.mjs`, `video/render/cdp.mjs`, `video/render/render.mjs`
- Test: `video/test/serve.test.mjs`, `video/test/frame.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `sceneAt`, `frameTimes`, `DURATION`, `FPS`, `UNIT`
- Produces: `startServer({port = 4410}) → Promise<{url, port, close()}>` — 뿌리는 `codyssey/final-project/`(그래서 `/intro-video/...`와 `/Final-Proj/...`가 둘 다 열림), 뿌리 밖 경로는 404. `renderFrame(t) → string` — `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="1920" height="1080" data-scene="<id>">…</svg>`; 장면별 그리기는 `frame.mjs`의 `DRAW = {'1a': fn, …}`에 꽂는다(아직 없으면 장면 색 하나로 칠함). 브라우저 전역 `window.renderAt(t) → Promise<void>`(그린 뒤 다음 화면 갱신까지 기다림), `window.videoReady → Promise<{fonts: boolean}>`. CLI `node video/render/render.mjs [--from s] [--to s] [--out build/video-noaudio.mp4] [--stills t1,t2,…]`(`--stills`면 그 시점 PNG만 `build/stills/t-<초>.png`로 저장하고 끝).
- `index.html`은 `?render=1`이면 1920×1080 그대로 · 조작 막대 숨김, 아니면 창에 맞춰 줄이고 재생/멈춤 · 시간 막대 · 현재 시간 표시.
- `style.css`에 `#stage .cat, #stage .cat * { animation: none !important; transition: none !important; }`.

- [ ] **Step 1: 실패하는 시험 쓰기** — 서버: `/intro-video/video/index.html` 200, `/Final-Proj/02-frontend/navigator/seal.js` 200, `/../x` · `/%2e%2e/x` 404. 프레임: `renderFrame(0)`이 `<svg`로 시작, `viewBox="0 0 320 180"`, `data-scene="1a"`; `renderFrame(39.99)`의 `data-scene="6"`.
- [ ] **Step 2: 실패 확인** — `node --test video/test/` → FAIL
- [ ] **Step 3: 서버 · 페이지 · `renderFrame` 구현**
- [ ] **Step 4: CDP 렌더 구현** — 크롬을 `--headless=new --remote-debugging-port=<빈 포트> --user-data-dir=<임시> --hide-scrollbars`로 띄우고 `/json/list`의 page 웹소켓에 붙는다. `Emulation.setDeviceMetricsOverride {width:1920,height:1080,deviceScaleFactor:1,mobile:false}`, 페이지 연 뒤 `await videoReady`가 `{fonts:true}`가 아니면 에러로 멈춤. 프레임마다 `renderAt(t)` → `document.getAnimations().length === 0` 확인 → `Page.captureScreenshot {format:'png', clip:{x:0,y:0,width:1920,height:1080,scale:1}}` → ffmpeg `-f image2pipe -framerate 30 -i - -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart` 표준 입력에 씀. 끝나면 크롬 · 서버 닫기.
- [ ] **Step 5: 통과 확인** — `node --test video/test/` → PASS
- [ ] **Step 6: 빈 장면 40초 렌더 확인** — Run: `node video/render/render.mjs` 뒤 `ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_read_frames,pix_fmt -show_entries format=duration -of default=nw=1 build/video-noaudio.mp4` → `width=1920` `height=1080` `r_frame_rate=30/1` `nb_read_frames=1200` `pix_fmt=yuv420p` `duration=40.000000`

### Task 3: 효과음 합성 · 섞기

**Files:**
- Create: `video/audio/synth.mjs`, `video/audio/track.mjs`, `video/render/mux.mjs`
- Test: `video/test/synth.test.mjs`, `video/test/track.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `SFX_CUES`, `NOTE_HZ`, `DURATION`
- Produces: `SR = 48000`; `synth(kind, opts = {}) → Float32Array`(모노, kind는 `pop` `sparkle` `ding`(opts.note) `dong` `boing` `plop` `chime`); `encodeWav(channels: Float32Array[], sr) → Buffer`(16비트 PCM); `buildSfxTrack(cues = SFX_CUES, {duration = 40, sr = SR}) → Float32Array`(최대값 0.89 이하로 맞춤). CLI `node video/audio/track.mjs` → `build/sfx-track.wav`(스테레오). CLI `node video/render/mux.mjs --video build/video-noaudio.mp4 --sfx build/sfx-track.wav [--bgm <파일>] --out <mp4>` — `--bgm`이 있으면 40초로 자르고 0–1초 페이드 인 · 37–40초 페이드 아웃, 효과음보다 작게(배경음악 −14 dB) 섞음.
- 음색(재량): pop = 짧게 내려가는 사인, sparkle = 높은 음 3개 아르페지오, ding = 사인 + 배음 2개 종소리(지수 감쇠), dong = 낮은 종(G4), boing = 위로 미끄러지는 음, plop = 아래로 떨어지는 물방울 음, chime = 두 음(E6 → G6).

- [ ] **Step 1: 실패하는 시험 쓰기** — 소리마다 길이 0.05초 초과 1.2초 이하, 최대값 ≤ 1, RMS > 0.01; ding C5 · E5 · G5 · C6의 영점 교차로 잰 주파수가 `NOTE_HZ` ±2%; `encodeWav`의 머리 `RIFF` · `WAVE` · `fmt ` · 채널 2 · 48000 · 16비트 · data 길이; 트랙 길이 `40*48000`; 각 신호 시점 [t, t+0.15]의 RMS가 0–5초 구간 RMS의 10배 넘음, 0–5초는 RMS < 1e-4(①에는 효과음 없음); 트랙 최대값 ≤ 0.89.
- [ ] **Step 2: 실패 확인** — `node --test video/test/` → FAIL
- [ ] **Step 3: `synth.mjs` · `track.mjs` · `mux.mjs` 구현**
- [ ] **Step 4: 통과 확인** — `node --test video/test/` → PASS
- [ ] **Step 5: 섞기 확인** — `node video/audio/track.mjs && node video/render/mux.mjs --video build/video-noaudio.mp4 --sfx build/sfx-track.wav --out build/check-mux.mp4` 뒤 ffprobe → 오디오 `codec_name=aac` `sample_rate=48000` `channels=2`, 길이 40.0 ± 0.05

### Task 4: 그림 재료 (팔레트 · 사람 · 소품 · 플로로)

**Files:**
- Create: `video/src/art/palette.mjs`, `video/src/art/people.mjs`, `video/src/art/props.mjs`, `video/src/floro.mjs`
- Test: `video/test/art.test.mjs`

**Interfaces:**
- Produces: `C`(스펙 4절 색: `sky #CDEBFA` `blob #E2F4FD` `screen #EEF5FF` `navy #1F2A5A` `ink #16226A` `skin #EFA486` `skinShade #D9876B` `sweater #5B8FE8` `sweaterDark #3E6FD1` `collar #4A7DDB` `evalSweater #2F7D6D` `evalPants #E8D6B5` `laptop #5B8AD6` `mug #F2B33D` `err #FF5D5D` `f1 #2F6BFF` `f2 #14B8A6` `f3 #F5A524` `f4 #8B5CF6` `markA #3A5FE0` `markB #16226A`);
  `seatedBack({pose: 'chin'|'headgrab'|'lower', look = 0}) → string`(①·② 사람, 스케치 v3 좌표 — 몸 x 186–306 · 머리 중심 (243, 74), 뿌리 `<g data-person="user" data-pose="…">`);
  `standingUser({gesture = 0, talk = 0}) → string`(④·⑤, 발 y 152 · 몸 중심 x 140, `data-person="user-standing"`, 주인공과 같은 머리 · 스웨터 색);
  `evaluator({nod = 0}) → string`(④, 발 y 152 · 중심 x 236, 체크리스트, `data-person="evaluator"`);
  `windows({errors = 0}) → string`, `laptopSide({screen: 'plain'|'error'|'glow', ripple = 0}) → string`, `desk1() → string`, `laptopTable4({inner = ''}) → string`(화면 안에 inner를 끼움), `quadrant(n, {p = 0, dim = 1, active = false}) → string`(p는 칸 안 움직임 0..1, 기능 이름은 Global Constraints의 문자열 그대로 + `data-caption`), `mark({x, y, size, inner = ''}) → string`, `heart(x, y, s)`, `spark(x, y, s)`, `puddle(cx, cy, rx, o = 1)`, `codeBubble(x, y, s)`(`</>`를 path로), `checkBubble(x, y, s)`;
  `floro(mood, {x, y, size, rot = 0, flip = false, sx = 1, sy = 1, tail = false, clipY = null}) → string` — `NavSeal.svg(mood, 120, {noTail: !tail})`를 `translate(x y) rotate(rot) scale(±size/120·sx, size/120·sy)`로 감쌈(x, y는 그림의 아래 가운데). 브라우저에서는 `globalThis.NavSeal`, Node에서는 `createRequire`로 seal.js를 불러옴.

- [ ] **Step 1: 실패하는 시험 쓰기** — `C`의 값이 위와 같음; `floro('happy',{x:0,y:0,size:40})`에 `class="cat m-happy`가 있고 `scale(0.333` 포함; `quadrant(1)`부터 `quadrant(4)`까지 각 기능 이름 문자열과 `data-caption` 포함; `seatedBack({pose:'headgrab'})`에 `data-pose="headgrab"`; `codeBubble(0,0,1)`에 `<text` 없음.
- [ ] **Step 2: 실패 확인** — `node --test video/test/` → FAIL
- [ ] **Step 3: 구현** — 사람은 스케치 v3(`sketches/sketch-v3-scene1-style.png`)의 도형을 바탕으로 people style 느낌(테두리 없음, 주름선 한두 줄, 큼직한 손)을 살려 다듬는다.
- [ ] **Step 4: 통과 확인** — `node --test video/test/` → PASS

### Task 5–10: 장면 그리기 (장면마다 한 Task)

장면 모듈은 모두 `draw(t: number) → string`(t는 영상 전체 시간, 배경까지 포함한 SVG 조각)을 내보내고 `frame.mjs`의 `DRAW`에 꽂는다. 공통 확인: ① 장면 시험 통과 ② `node video/render/render.mjs --stills …`로 찍은 스틸을 Read로 직접 보고 스펙 3절 · 스케치와 맞는지 확인 — 어긋나면 고치고 다시 찍는다.

| Task | 파일 | 시험(`video/test/scenes.test.mjs`에 추가) | 스틸 시점 |
|---|---|---|---|
| 5 ① | `video/src/scenes/s1.mjs` | 1.0초 `data-pose="chin"` · 3.5초 `data-pose="headgrab"` · 3.5초 `data-errors="1"` · 0–5초 `data-caption` 없음 | 0.5, 1.5, 2.4, 4.5 |
| 6 ② | `video/src/scenes/s2.mjs` | 5.3초 플로로 없음 · 6.5초 `m-wow` · 8.5초 `m-happy` · 10.9초 플로로 없음(다시 들어감) · 글자 없음 | 5.6, 6.3, 8.2, 9.4, 10.5 |
| 7 ③ | `video/src/scenes/s3.mjs` | 14.0 · 16.5 · 19.0 · 21.5초에 `data-active` 1 · 2 · 3 · 4 · 22.8초 네 칸 모두 밝기 1 · 기능 이름 4개 정확 · 표정 14.0 `m-look` · 16.5 `m-happy` · 18.8 `m-think` · 19.8 `m-done` · 21.8 `m-done` | 11.4, 12.3, 12.8, 13.4, 14.8, 15.65, 17.0, 19.7, 21.9, 22.8 |
| 8 ④ | `video/src/scenes/s4.mjs` | 23.2초 `data-zoom` > 2 · 25.0초 코드 말풍선 · 27.3초 체크 말풍선 · 글자 없음 | 23.3, 23.8, 25.0, 27.2, 29.5 |
| 9 ⑤ | `video/src/scenes/s5.mjs` | 31.0초 플로로 없음 · 32.2초 플로로 있음 · 33.5초 `m-love` · 글자 없음 | 30.5, 31.6, 32.4, 33.4, 34.8 |
| 10 ⑥ | `video/src/scenes/s6.mjs` | 36.8초 마크 안 플로로 · 37.3초 `Floe`(`data-caption`) · 38.5초 문구 정확 · 그 밖 글자 없음 | 35.5, 35.8, 36.1, 36.8, 37.3, 38.5, 39.9 |

움직임 시점(스펙 3절을 프레임 단위로 옮긴 것 — Task 담당자가 그대로 씀):
- ① 0–2 턱 괴기(숨쉬기만) → 1.9–2.4 창에 오류가 톡톡(`pop`) → 2.2–2.6 팔이 머리로 → 2.6–5 낙서 흔들림 · 땀방울 · 머그 김.
- ② 5.0–5.6 화면이 밝아지며 물결 → 5.6–6.2 플로로 솟음(`wow`, 물방울, 6.0 뽁) → 6.2–7.6 사람이 손을 내리고 고개를 돌림(`lower`) → 8.0 눈맞춤 반짝 · 표정 `happy` → 9.6–10.6 플로로가 화면 속으로 쏙 · 물결.
- ③-1 11.0–11.9 ② 마지막 구도를 노트북 화면 중심으로 확대(화면이 프레임을 채울 때까지) → 11.6–12.1 앱 바탕으로 바뀜 → 12.0–12.4 겹친 카드 4장 등장 → 12.4–13.0 네 자리로 펼쳐짐(`easeOutBack`).
- ③-2 13.0–13.3 왼쪽 웅덩이에서 플로로 솟음 → 각 칸: 도착 시점(`FLORO_ARRIVALS`)부터 1.8초 동안 칸 안 움직임 p 0→1, 다음 칸으로 `hop`(도착 0.3초 전 출발) → 안 간 칸 0.3 · 간 칸 0.6 · 지금 칸 1 → 22.6–23.0 네 칸 모두 1.
- ④ 23.0–23.9 ④ 노트북 화면 안(③-2 마지막 모습)에서 시작해 카메라가 빠져나옴(`data-zoom` 약 5 → 1) → 24.0부터 손짓 · 24.3 코드 말풍선 → 27.0 평가자 끄덕임 · 27.1 체크 말풍선.
- ⑤ 30–35 노트북 쪽으로 천천히 확대(1 → 1.7, `easeInOutCubic`) → 31.3–31.8 화면 위로 플로로 빼꼼 → 32.2 갸웃 → 33.0 `love` · 하트가 떠오름.
- ⑥ 35.0–36.0 ⑤ 마지막 구도를 흐리게(가우스 0 → 6) + 흰 막 0 → 0.5 → 35.3–35.9 플로로가 가운데 마크로 `hop` · 35.4 마크 등장(`pop`) → 35.9 물 튀김 → 36.4–36.7 마크 안에서 플로로가 고개를 내밂(`happy`) → 37.0 `Floe` 등장(`pop`) → 37.6–38.1 문구가 살짝 올라오며 나타남 → 40까지 유지.

각 Task의 단계:
- [ ] **Step 1: 그 장면 시험 쓰기** (위 표)
- [ ] **Step 2: 실패 확인** — `node --test video/test/` → FAIL
- [ ] **Step 3: 장면 모듈 구현 · `DRAW`에 꽂기**
- [ ] **Step 4: 통과 확인** — `node --test video/test/` → PASS
- [ ] **Step 5: 스틸 찍어 직접 보기** — `node video/render/render.mjs --stills <표의 시점>` → `build/stills/*.png`를 Read로 확인

### Task 11: 전체 렌더 · 확인 · 문서 갱신

**Files:**
- Create: `final/floe-intro-40s-sfx-only.mp4`, `keyframes/kf-<장면>.png`
- Modify: `storyboard.md`(상태 · 10절에 최종 장면 그림 추가 · 실제 잰 값)

- [ ] **Step 1: 전체 시험** — `node --test video/test/` → PASS
- [ ] **Step 2: 렌더 · 섞기** — `node video/render/render.mjs && node video/audio/track.mjs && node video/render/mux.mjs --video build/video-noaudio.mp4 --sfx build/sfx-track.wav --out final/floe-intro-40s-sfx-only.mp4`
- [ ] **Step 3: 파일 확인** — ffprobe → 비디오 `h264` `yuv420p` 1920×1080 `30/1` 1,200프레임, 오디오 `aac` 48000 2채널, 길이 40.0 ± 0.05
- [ ] **Step 4: 처음부터 끝까지 확인** — 2초 간격 스틸 20장을 찍어 Read로 이어서 보고, 장면 사이가 끊기거나 튀는 곳을 찾아 고친다.
- [ ] **Step 5: 장면 그림 · 문서** — 장면마다 대표 스틸을 `keyframes/`로 복사하고, `storyboard.md`의 상태를 "효과음판 완성"으로 바꾸고 10절에 최종 장면 그림을 넣는다. ffprobe로 잰 값을 그대로 적는다.
- [ ] **Step 6: 다음 세션 안내** — `storyboard.md` 9절에 배경음악을 섞는 명령(`mux.mjs --bgm`)을 적는다.
