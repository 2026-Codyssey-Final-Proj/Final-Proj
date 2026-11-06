# Floe 소개 영상 — 업그레이드용 전달 자료

최종 발표(11/12 · 13) 첫머리에 틀 40초 소개 영상의 **2차 판**과, 이어서 더 좋게 만들기 위한 자료 전부입니다. (2026-11-06, Claude와 함께 만듦)

> **저장소에는 `reference/`를 넣지 않았습니다.** 이 저장소는 공개이고, 5절대로 레퍼런스 파일은 공개 저장소에 넣을 수 없습니다. 아래에 나오는 `reference/` 경로는 원본 전달 폴더에만 있습니다.

## 1. 먼저 볼 것

1. `final/floe-intro-40s.mp4` — 지금 판(추천). 효과음 + 배경음악 A
2. `storyboard.pdf` — 9쪽. 장면별 완성 그림 · 시간 · 움직임 · 소리 · 그림체 규칙 · 지켜야 할 것
3. `reference/ad-reference-0-29s.mp4` — 연출을 참고한 광고 영상("캐릭터가 돌아다니며 기능 소개")

## 2. 들어 있는 것

```
floe-intro-video-handoff/
├── README.md                  이 문서
├── storyboard.pdf             스토리보드 (A4 가로 9쪽)
├── final/                     완성 영상 3판 — 추천 · 배경음악 B · 효과음만
├── svg-keyframes/             대표 장면 10개의 SVG(벡터) — 일러스트레이터 · 브라우저에서 열고 고칠 수 있음
├── reference/
│   ├── ad-reference-0-29s.mp4 연출 레퍼런스(강의 영상 속 "빈칸" 광고 녹화, 개인 화면이 찍힌 끝부분은 잘라 냄)
│   └── people-style/          사람 그림체 레퍼런스 18장 + SOURCES.md(출처)
└── project/                   지금 영상을 만든 코드 — 이 상태 그대로 다시 만들 수 있음
    ├── intro-video/
    │   ├── storyboard.md      스토리보드 원문(PDF와 같은 내용 + 결정 기록)
    │   ├── plan.md            제작 계획
    │   ├── video/             영상 코드 · 시험(75개)
    │   ├── keyframes/         완성 장면 PNG (v1/ = 1차 판)
    │   ├── sketches/          처음 구도 스케치
    │   └── build/bgm/         배경음악 원본 mp3 2곡(Suno)
    └── Final-Proj/            팀 저장소에서 필요한 파일만(플로로 seal.js · seal.css, 글꼴 2개, LICENSE)
```

## 3. 지금 판에서 아쉬운 점 (업그레이드할 곳)

지금 판은 **코드로 도형을 직접 그려** 만든 것이라 표현에 한계가 있습니다.

| 부분 | 지금 | 한계 |
|---|---|---|
| 사람 그림 | SVG 경로로 직접 그림(`project/intro-video/video/src/art/people.mjs`) | 손 · 얼굴 · 옷 주름이 단순하고, 몸을 돌리는 각도를 바꿀 수 없음 |
| 움직임 | 시간에 따른 계산으로 자세 사이를 이음(중간 동작 · 살짝 넘침 · 숨쉬기 · 깜빡임) | 옷 · 머리카락이 따라 흔들리는 움직임, 걷기 · 몸 회전 같은 동작이 없음 |
| 플로로 | 팀 앱의 SVG를 그대로 씀 | 정면 위주, 표정이 한 프레임에 바로 바뀜 |
| 효과음 | 사인파로 합성 | 소리가 단순함 — 효과음 라이브러리로 바꿔도 됨(시점은 그대로) |
| 배경음악 | Suno 2곡 중 소리 크기만 재서 A를 고름 | 직접 들어 보고 A · B 중 정하거나 다른 곡으로 |

**업그레이드 방법 두 가지**

- **A. 영상 툴로 다시 만들기**(After Effects · Rive · Jitter · Figma 등): `storyboard.pdf`의 장면 · 시간표와 `final/` 영상을 애니매틱(밑그림 영상)으로 삼고, `svg-keyframes/`를 열어 그림을 다듬어 쓰면 됩니다. 효과음 시점은 아래 표 그대로.
- **B. 지금 코드를 이어서 고치기**(Node): 6절의 명령으로 바로 다시 찍을 수 있습니다. 장면마다 파일이 나뉘어 있어 그 장면만 고치면 됩니다.

## 4. 고칠 때 지켜야 할 것

- **장면 순서와 시간**: ① 0–5초 · ② 5–11 · ③-1 11–13 · ③-2 13–23 · ④ 23–30 · ⑤ 30–35 · ⑥ 35–40
- **효과음 시점**: 6.0 뽁 · 8.0 반짝 · 13.3/15.8/18.3/20.8 띵(도 · 미 · 솔 · 높은 도) · 27.0 딩 · 31.5 뽀용 · 33.0 반짝 · 35.9 퐁당 · 36.6 띠링
- **플로로 모양 · 색은 바꾸지 않습니다** — 두승현의 작업물(팀 앱 `seal.js` · `seal.css`).
- **화면 글자**: ③-2 기능 이름 4개(`① 8단계 길 안내` · `② 초안은 플로로, 확정은 나` · `③ 관문 · 이해하셨나요?` · `④ 문서가 내 GitHub에`)와 칸 안 단추 말, ⑥ `Floe` · `당신을 위한 코딩 길잡이, Floe와 함께하세요`. 내레이션 · 자막 없음.
- **출력**: 1920×1080 · 30fps · 정확히 40초 · H.264(yuv420p, BT.709) + AAC 48kHz — 발표 프로그램에서 바로 재생되게.
- **레퍼런스 그림 · 영상은 직접 넣지 않습니다**(분위기만).

## 5. 레퍼런스 · 라이선스 주의

- `reference/`의 파일은 **팀 안 참고용**입니다. 광고 녹화는 다른 사람의 강의 영상, `people-style/`은 Unsplash+(Getty Images) 등 라이선스가 있는 그림이라 공개 저장소 · 발표 자료 · 영상에 넣지 마세요. 출처는 `reference/people-style/SOURCES.md`.
- 글꼴(Bagel Fat One · Gowun Dodum)은 OFL 라이선스, 팀 저장소 코드는 MIT(`project/Final-Proj/LICENSE`).
- 배경음악은 claude.ai의 Suno 커넥터(AceData Cloud 중계)로 만든 곡입니다.

## 6. 지금 코드로 다시 만들기

필요한 것: **Node 24 이상 · 크롬 · ffmpeg**(npm 설치 없음). `project/intro-video` 폴더에서 실행합니다.

| 하고 싶은 것 | 명령 |
|---|---|
| 미리 보기(재생 · 시간 막대) | `node video/serve.mjs` → 나온 주소를 브라우저로 |
| 시험 75개 | `node --test "video/test/*.test.mjs"` |
| 특정 순간만 찍기 | `node video/render/render.mjs --stills 8.2,26` → `build/stills/` |
| 영상 찍기(약 3–4분) | `node video/render/render.mjs` → `build/video-noaudio.mp4` |
| 효과음 트랙 | `node video/audio/track.mjs` → `build/sfx-track.wav` |
| 소리 섞어 완성 | `node video/render/mux.mjs --video build/video-noaudio.mp4 --sfx build/sfx-track.wav --bgm build/bgm/suno-a-feed6383.mp3 --out final/floe-intro-40s.mp4` |

- 크롬이 Windows 기본 위치(`C:/Program Files/Google/Chrome/Application/chrome.exe`)에 없으면 `CHROME_PATH` 환경 변수로 경로를 주세요. Mac이면 `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`.
- 코드 지도: 장면 시간 `video/src/timeline.mjs` · 효과음 시점 `video/src/cues.mjs` · 색 `video/src/art/palette.mjs` · 사람 `video/src/art/people.mjs` · 소품 · 기능 칸 `video/src/art/props.mjs` · 장면별 움직임 `video/src/scenes/s1.mjs`부터 `s6.mjs`까지.
- 다시 섞을 때는 이전 판을 `final/history/` 같은 곳으로 먼저 옮기세요(같은 이름이면 덮어씁니다).
