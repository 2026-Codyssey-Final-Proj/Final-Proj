<!-- claude-drafted: 2026-10-20 — 이재엽 요청("페이블 세션에서 받아온 내용들 보고" → "페이블 세션에 넘길 수 있게 준비해줘")으로 Claude가 PR #139 리뷰에서 찾은 것을 넘김 문서로 썼다. 코드는 고치지 않았다. -->

# 넘김 — PR #139 리뷰에서 나온 고침 셋 (F-36 · F-37 · F-38)

> **기록 문서.** 2026-10-20 `main` 13be7fc(PR #139 병합 뒤, 앱 버전 8.0.0) 기준이다. 고칠 목록은 [fix-map.md](../../07-maintenance/fix-map.md) **F-36 · F-37 · F-38**, 앞선 넘김 문서는 [fable-handoff-2026-10-20-modes.md](fable-handoff-2026-10-20-modes.md)(C-13 · C-14 · F-35). 셋 다 **지금 시험(21/21 파일 · 노드 422/423 · e2e 3/3)이 못 잡았다** — 그래서 고치기 전에 **잡는 시험부터** 쓴다. `[제안]`은 Claude가 정한 기본값이다.

## 0. 먼저

1. 이름 확인(CLAUDE.md "처음 세션이면") → 이 문서.
2. **이 문서와 F-38 줄을 담은 PR이 병합된 뒤** 최신 `main`에서 브랜치를 딴다 — 안 그러면 고칠 목록 줄이 부딪친다. F-36 · F-37 줄은 #140으로 먼저 들어갔다.
3. **한 PR [제안]** — 브랜치 `v2/review-139-fixes`, base `main`, 조각 `changes/review-139-fixes.md`(종류 **작은 고침**). 셋 다 몇 줄이고 F-36 · F-38이 같은 `app.js`를 건드린다(#139 때 이재엽 "한 PR에 셋 다"와 같은 까닭).
4. 순서: **F-37(한 줄) → F-36 → F-38.** 하나마다 시험을 먼저 써서 **지금 코드에서 실패하는 것을 본 뒤** 고친다(code.md 1번).
5. 앱 버전은 올리지 않는다 — 팀이 "버전업"이라고 할 때만.
6. **끝남(2026-10-20, 이재엽 "F-37 → F-36 → F-38 순서로 고쳐 줘"):** 3 · 4번대로 한 PR(브랜치 v2/review-139-fixes)에서 셋을 고쳤다. 시험을 먼저 써서 고치기 전 코드에서 실패하는 것을 봤다 — F-36 e2e 둘, F-37 숫자 시험 · e2e, **F-38도 재현됐다**(안 고침이 아니라 고침). 결과는 [fix-map.md](../../07-maintenance/fix-map.md) F-36 · F-37 · F-38. 5절(한 줄 올림 때 글자도 늘어남)은 손대지 않았다 — 이재엽이 정한다. <!-- claude-drafted: 2026-10-20 -->

## 1. 정하신 것 — 원문

- 리뷰 요청: "페이블 세션에서 받아온 내용들 보고"
- 넘김: "페이블 세션에 넘길 수 있게 준비해줘"
- 앞선 결정(그대로): C-13 "처음 시작했을때는 기본으로 두지만 사람들이 바이브 코딩 환경에 들어가면 기본 화면에 나오지 않는 이상 그 오버레이는 바이브 코딩 오버레이로 계속 남는거야" — 서고에 다녀와도 **떠난 모드로** 돌아온다(앞선 넘김 문서 3절 그림 `lib --> base: 기본 모드에서 왔으면`).

## 2. F-37 — 서고로 들어갈 때 물이 화면 오른쪽을 다 덮지 못한다

**보이는 것.** 섬에서 서고로 잠수할 때 물이 다 커진 순간(약 0.7초) 오른쪽에 띠가 남는다 — 1440×900 브라우저에서 96px. 앱은 창이 투명해 그 띠로 바탕 화면이 비친다(화면 1512 · 서고 창 1440이면 약 90px [계산]).

**재현(헤드리스 Chrome, 파일로 열기, 1440×900):** `navigator/index.html#base`를 열고 `FloeDive.out(document.querySelector(".isl"), "#stay")`, 0.76초 뒤 `.dive.out .pane`의 `getBoundingClientRect()`. 섬 상자 left 250 · top 14 · 940×335 → 물 끝 상자 left −256 · top −110 · **right 1344** · bottom 950.

**까닭.** [dive.js](../../../02-frontend/navigator/dive.js) `out()`의 판 끝 transform(60번 줄 안팎):

```js
translate(${-OVER - r.left * sx}px, ${-OVER - r.top * sy}px) scale(${sx}, ${sy})   // 지금
```

`transform-origin: 0 0`에서 `translate(tx) scale(sx)`는 판의 왼쪽 위를 `r.left + tx`로 옮긴다. 화면 왼쪽 위(−OVER)에 두려면 `tx = −OVER − r.left`여야 하는데, 지금 식은 판을 `r.left × (sx − 1)`만큼 더 왼쪽으로 보내 오른쪽이 모자란다(위아래도 `r.top × (sy − 1)`만큼 — 지금은 `r.top`이 작아 드러나지 않을 뿐).

**고침:**

```js
translate(${-OVER - r.left}px, ${-OVER - r.top}px) scale(${sx}, ${sy})
```

**먼저 쓸 시험 [제안]:**
- 계산을 순수 함수로 뺀다 — 예: `FloeDive.coverTransform(r, W, H, over)` → `{ tx, ty, sx, sy }`. `04-tests/navigator/dive.test.js`에서 섬이 **가운데 · 왼쪽 끝 · 오른쪽 끝**에 있을 때 `r.left + tx ≤ 0`, `r.left + tx + r.width × sx ≥ W`, 위아래도 같게. 지금 식으로는 가운데 · 오른쪽 끝에서 실패해야 한다.
- e2e(`responsive.test.js`) 하나: `#base`에서 `out()` 뒤 0.76초에 `.pane` 상자가 화면을 덮는다.

## 3. F-36 — 기본 화면에서 서재에 다녀오면 바이브 코딩 모드가 된다

**보이는 것.** 기본 화면 → **서재** 단추 → 서고 → '← 작업 화면으로' → 섬이 **바이브 코딩 모드의 도서관 탭**으로 돌아온다(집 단추가 눌려 있지 않다).

**재현(헤드리스 Chrome):** `#base` → `[data-act="lib-enter"]` 누름 → 서고(`library/index.html#lib`) → `a.lib-out` 누름 → 주소 `navigator/index.html#tab=lib&back`, `sessionStorage` `floe:place` = `vibe`, `.ti.home[aria-pressed]` = `false`.

**까닭.**
- 서고의 돌아가기 링크는 늘 `../navigator/index.html#tab=lib`([library/index.html](../../../02-frontend/library/index.html) 75번 줄 `a.lib-out`, 60번 줄 `a.go`), [library.js](../../../02-frontend/library/library.js) 52~59번 줄이 끝에 `&back`을 붙인다.
- [app.js](../../../02-frontend/navigator/app.js) `fromHash()`(1860번 줄 안팎)는 주소 끝이 있으면 '주소로 연 장면'으로 보고 `setPlace("scene")` → 바이브 코딩(1867번 줄).
- **움직임 줄이기**면 `library.js` 55번 줄이 `leave()`를 건너뛰어 `&back` 없이 같은 주소로 가므로 똑같이 바이브 코딩이 된다.
- 돌아온 뒤 `startSurfacing()`(1917번 줄)이 `&back`만 지워 주소가 `#tab=lib`로 남는다 — **새로 고침하면** 다시 장면으로 읽혀 바이브 코딩이 된다.

**고침 [제안]:**
1. `fromHash()` — 서고에서 돌아온 주소(`q.back`)는 장면이 아니다: `setPlace(q.back ? "library" : "scene")`. `navigator.js nextPlace`는 `library`에 모드를 그대로 둔다(이미 그렇게 시험된다 — `modes.test.js` 15번 줄).
2. `library.js` — 움직임 줄이기에서도 `&back`을 붙여 같은 주소로 간다(움직임만 없이). 내비게이터 쪽은 `surface()`가 움직임 줄이기면 바로 끝낸다(`!CAN → finish`).
3. `startSurfacing()` — 기본 화면이면 주소 끝을 통째로 지운다(`location.pathname`만). 바이브 코딩이면 지금처럼 `#tab=lib`를 남긴다(새로 고침해도 바이브 코딩 · 도서관 탭).
4. 녹화 · 시험이 쓰는 `navigator/index.html#tab=lib`(e2e `PAGES`)는 `&back`이 없으니 지금처럼 바이브 코딩이다 — 바뀌지 않는다.

**먼저 쓸 시험 [제안]** — e2e(puppeteer, `responsive.test.js` 옆에 새 파일도 좋다 — 예: `04-tests/e2e/modes-flow.test.js`):

| # | 길 | 끝에서 볼 것 |
|---|---|---|
| 1 | `#base` → 서재 → '← 작업 화면으로' | 집 단추 눌림 · 단추 넷(`.grid4`) · `floe:place` = `base` |
| 2 | 1과 같되 움직임 줄이기(`page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])`) | 같음 |
| 3 | 1 뒤 새로 고침 | 여전히 기본 화면 |
| 4 | 바이브 코딩 → 도서관 탭 → 서고 → 돌아가기 | 바이브 코딩 · 도서관 탭(지금 그대로) |
| 5 | `navigator/index.html#tab=lib`를 바로 열기(녹화 · e2e 장면) | 바이브 코딩(지금 그대로) |

1 · 2 · 3은 지금 코드에서 실패해야 한다.

## 4. F-38 — 섬을 빠르게 펼쳤다 접으면 창이 움직임보다 먼저 줄어든다

**까닭(코드를 읽어 찾음 — 아직 재현하지 않았다).** [app.js](../../../02-frontend/navigator/app.js) `morphFrom()`(987번 줄 안팎)의 끝 처리(1004번 줄):

```js
const done = () => { if (morphShell === shell) morphShell = null; shell.remove(); el.classList.remove("morph-bg"); if (morphHold) { morphHold = false; lastSize = ""; queueSize(); } };
```

`morphHold`(작아질 때 창 줄이기를 미룸)는 하나뿐인데, **앞선 움직임의 `done`도 이 값을 푼다.** 펼치기(0.3초)가 끝나기 전에 접기를 시작하면, 펼치기의 `done`이 접기가 걸어 둔 미룸을 풀어 창이 접기 움직임보다 먼저 줄어든다 — 줄어드는 바탕이 창에 잘린다(F-24 · C-14가 막으려던 것).

**고침 [제안]:** 마지막 움직임만 미룸을 푼다.

```js
const done = () => { const last = morphShell === shell; if (last) morphShell = null; shell.remove(); el.classList.remove("morph-bg"); if (last && morphHold) { morphHold = false; lastSize = ""; queueSize(); } };
```

**먼저 쓸 시험 [제안]:** 브라우저에서 앱인 척 — `page.evaluateOnNewDocument`로 `window.floeApp`을 둔다 — `resize: (w, h) => calls.push([performance.now(), w, h])`, 나머지(app.js가 부르는 `connect` · `disconnect` · `expand` · `onCursor` · `onEnter` · `onExpanded` · `onNotch` · `openHub` · `openSettings`)는 빈 함수. `#ex=1`을 열고 Esc(한 줄로) → 0.5초 뒤 한 줄을 누름(펼침) → 0.1초 뒤 Esc(접힘). 접힘을 시작한 뒤 **0.24초 안에는** 작은 크기로의 `resize`가 없어야 한다. 지금 코드에서 실패하는지 먼저 본다 — **실패하지 않으면** 이 줄은 "재현 안 됨"으로 닫고 고치지 않는다.

## 5. 사람이 보고 정할 것 (고치지 않는다)

- **한 줄에 마우스를 올릴 때 글자도 늘어난다.** `app.css`의 `.pill:hover`가 한 줄 전체를 `scale(1.07, 1.12)` 안팎으로 늘린다 — 앞선 넘김 문서 4절은 **바탕만** 늘리자고 했다. 앱에서 보고 이재엽이 정한다: 그대로 / 바탕만(예: `.pill::before`에 바탕을 두고 그것만 늘리기). 기본은 **그대로** — 정하기 전에는 손대지 않는다.
- #139의 "사람이 볼 것"은 그대로 남는다: 접고 펼 때 창 크기 순서, 올림 커짐이 창에 잘리지 않는지, 앱에서 서고 전환 프레임 재기(앞선 넘김 문서 5절 0번), '크게 보기', C-13 · C-14 등급.

## 6. 끝내기 전에

- `python3 04-tests/run_all_tests.py` — e2e가 **건너뛰지 않고** 돌았는지 출력에서 본다(puppeteer · Chrome · axe가 있어야 한다).
- 고칠 목록 F-36 · F-37 · F-38을 **고침**(PR 번호) — F-38이 재현되지 않았으면 **안 고침**(재현 안 됨)으로.
- PR 본문에: 고치기 전 실패한 시험 이름, 고친 뒤 통과, 2절의 물 끝 상자 숫자(고친 뒤).

## 7. 함정

- **F-36 고침이 녹화 · e2e를 바꾸지 않게.** `#tab=lib` · `#ex=…`처럼 `&back`이 없는 주소는 지금처럼 바이브 코딩이어야 한다(GIF `record-demo-gifs.py`와 e2e `PAGES`가 기댄다).
- `nextPlace`에 새 일을 더하지 않아도 된다 — 모르는 일(`library`)은 모드를 그대로 둔다. 더한다면 `modes.test.js` 15번 줄의 시험도 같이.
- `dive.test.js`처럼 **코드 글을 맞대어 보는 시험만으로는 이번 셋을 못 잡았다** — 상자 크기 · 주소 · 저장값을 실제로 재는 시험을 쓴다.
- `.dive.out`은 바탕이 없다(`background: none`) — 판이 모자라면 뒤가 그대로 보인다. 덮는지 재는 시험이 그래서 필요하다.
