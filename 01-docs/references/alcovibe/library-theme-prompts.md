# 차원의 도서관(Alcovibe) — 이미지 생성 프롬프트 모음

> **출처: 이재엽의 개인 프로젝트 "Alcovibe" 파일에서 가져온 것.** 팀 기준이 아니라 **제안·참고 자료**이며, 팀 결정은 각 담당 역할과 합의로 한다. 개인 프로젝트 소개: [alcovibe/README.md](README.md)


<!-- claude-drafted: 2026-10-15 — 이재엽의 개인 프로젝트(Alcovibe) 파일에서 가져온 초안. 팀 기준 확인 전. -->

차원의 도서관을 **전체 테마**로 한 디자인 시안을 다른 이미지 AI(예: Nano Banana)로 만들 때 쓰는 프롬프트다. 방향과 결정은
[library-theme.md](library-theme.md)의 "전제"를 따른다(분위기는 전체에, 도서관어는 빈 상태·로딩·보조 라벨·아이콘에만).

## 쓰는 방법

1. **공통 앞부분(아래)**을 모든 프롬프트 맨 앞에 붙인다.
2. `[대괄호]` 칸은 아래 "시작값"으로 채우고, 시안을 보며 바꾼다.
3. 순서는 **① 스타일 앵커 → ② 입구 → ③ 서가 → ④ 전시 카드 화면 → ⑤ 빈 상태 → ⑥ 로딩 → ⑦ 아이콘 → ⑧ 문서 표지**.
   구조(색·구도)를 먼저 정하고 장식(아이콘·로딩)은 나중에 한다.
4. 마음에 드는 한 장을 **참조 이미지로 첨부**하고 "같은 스타일 유지" 문장(맨 아래)을 쓴다.

## 시작값 (제안 — 이재엽이 확정)

글자 대비는 WCAG 계산식으로 구했다(본문 4.5:1 이상이 기준).

| 역할 | 값 | 바탕 `#130F2A` 위 | 패널 `#1D1840` 위 | 쓰임 |
|---|---|---|---|---|
| 바탕 (깊은 남색) | `#130F2A` | — | — | 화면 배경 |
| 패널 | `#1D1840` | — | — | 카드·서랍 면 |
| 빛 (본문 글자) | `#EDE7FF` | 15.47 | 13.90 | 본문·제목 |
| 보조 글자 | `#B9B0DC` | 9.13 | 8.20 | 설명·날짜 |
| 주색 (보라) | `#8B6CFF` | 5.04 | **4.52** | 링크·강조 면·선 |
| 포인트 (황동) | `#D9B36A` | 9.39 | 8.44 | 한 곳에만 쓰는 강조 |
| 경고 | `#FF8A7A` | 8.12 | 7.29 | 오류 표시 |

주의: 주색 보라는 패널 위에서 **간신히 통과**(4.52)한다. 글자보다 면·선·아이콘에 쓰고, 글자는 빛 색을 쓴다.

| 슬롯 | 시작값 |
|---|---|
| `[MAIN VIOLET]` | `#8B6CFF` |
| `[DEEP INDIGO]` | `#130F2A` |
| `[GLOW WHITE]` | `#EDE7FF` |
| `[BRASS]` | `#D9B36A` |
| `[ONE-WORD FEEL]` | quiet (조용한) — 다른 단어로 바꿔도 된다 |

## 공통 앞부분 (모든 프롬프트 맨 앞)

```
Original design, not copied from any existing game or brand. A dreamlike "dimensional library" visual style: deep indigo ([DEEP INDIGO]) backgrounds with soft violet ([MAIN VIOLET]) and lavender ([GLOW WHITE]) light, tall arched doorways as the recurring motif, thin brass ([BRASS]) line details, a few drifting particles of light, calm and quiet mood ([ONE-WORD FEEL]), generous empty space. Clean and uncluttered, not ornate. No wood texture, no heavy drop shadows, no skeuomorphism, no characters, no logos, no readable text.
```

## ① 스타일 앵커

```
[공통 앞부분] A 16:9 presentation style board: color swatches for the five palette colors, a small type-specimen area with a serif headline and a sans-serif body line (shown as gray placeholder bars), and six simple outline icons (book, arched door, lantern, key, bookmark, index card).
```

## ② 입구 화면 (시작 화면)

```
[공통 앞부분] A portrait 9:19.5 mobile splash screen: one tall arched doorway at the center filled with soft violet light, a faint staircase of light leading into it, bookshelves fading into darkness on both sides, empty dark space in the lower third for a title.
```

## ③ 서가 내부 (배경)

```
[공통 앞부분] Inside the library: towering curved bookshelves that continue into violet mist, a few books floating gently with faint light trails, rim lighting, wide establishing shot, 16:9, painterly but clean.
```

## ④ 전시 카드 화면 (목록 — 지나온 기록)

```
[공통 앞부분] A portrait 9:19.5 mobile app screen mockup: a vertical list of record cards styled like small glass display cases with a soft violet glow, each with a thumbnail area, a title bar and a small date tag drawn as gray placeholder bars, a simple top bar with a search field, dark indigo background with generous spacing. All text areas are plain gray bars — the interface itself looks like an ordinary clean app list. No device frame.
```

## ⑤ 빈 상태

```
[공통 앞부분] A square 1:1 empty-state illustration: an empty bookshelf with a single bookend and a soft light from the left, minimal flat vector style, centered with wide margins, plain dark indigo background.
```

변형: `a shelf with one book being placed` (저장 완료), `a closed arched door with a small lantern beside it` (권한 없음).

## ⑥ 로딩·전환

```
[공통 앞부분] A square 1:1 loading illustration: an open book on a small pedestal with a violet portal rising from its pages, tiny particles of light drifting upward, centered, minimal and elegant.
```

## ⑦ 아이콘 세트

```
[공통 앞부분] A 4x3 grid of 12 consistent outline icons on a plain dark indigo background: arched door, floating book, lantern, key, star chart, hourglass, index card, stamp, compass, bookmark ribbon, scroll, crystal. Uniform 2px stroke, rounded caps, 24px grid, brass line color with one tiny violet glow dot on each. No text.
```

## ⑧ 문서·보고서 표지 (밝은 변형 — 인쇄·공유용)

```
Original design. A report cover in a calm "dimensional library" style on a light lavender-white background: a thin brass-line arched doorway outline at the top, a soft violet gradient glow inside it, a large empty area for the title, quiet and uncluttered, A4 portrait. No text, no logos.
```

문서는 어두운 면이 인쇄·공유에 불리할 수 있어 밝은 변형을 따로 둔다.

## 같은 스타일로 고칠 때

```
Keep exactly the same visual style, palette, line weight and level of detail as the reference image. Change only: [WHAT TO CHANGE]. Do not add new decorative elements.
```

## 시안을 가져올 때

- **기록:** 시안마다 프롬프트·모델·날짜를 파일 이름이나 메모에 남긴다.
- **색:** 이미지 자체가 아니라 **뽑은 색 값(hex)**을 토큰 후보로 옮긴다. 대비는 위 표처럼 계산해 4.5:1 이상인지 본다.
- **글자:** 이미지 모델은 한글을 자주 깨뜨린다. 시안은 분위기·구도·색 용도이고, 실제 글자와 배치는 코드로 만든다.
- **저장:** 원본 이미지는 저장소 밖에 두고, 쓸 시안만 용량을 확인해 넣는다.
- **개인정보:** 프롬프트에 학교·팀원 정보나 비밀값을 넣지 않는다(이미지 생성 서비스는 입력을 외부로 보낸다).
- **원작:** 메이플스토리 등 게임 화면을 참조 이미지로 올리지 않는다. 결과가 원작에 가까워지고, 공개할 때 문제가 될 수 있다.
