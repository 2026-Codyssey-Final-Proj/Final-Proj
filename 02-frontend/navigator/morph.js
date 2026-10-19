// claude-drafted: 2026-10-20 — C-14 섬의 움직임(이재엽 "마우스를 가져다가 두면 조금 커져서 … 높이는 조금 높이고 옆으로 늘어나는 에니메이션" ·
// "오버레이가 켜지고 꺼질때 에니메이션도", 버튼 "섬이 접히고 펼쳐질 때"). 넘김 문서(fable-handoff-2026-10-20-modes.md) 4절 [제안]의 숫자 · 순서를 순수 함수로 — 그림 · 창은 app.js · app.css.
//   peekSize: 접힌 섬(띠 · 한 줄)에 마우스를 올리면 세로 +6 · 가로 +24 — 창은 바꾸지 않는다(접힌 창에 늘 여유 RESERVE를 둔다)
//   plan: 모양이 바뀔 때(띠 ↔ 한 줄 ↔ 펼침) 바탕이 늘어나고 줄어드는 길이 · 곡선과 창 크기 순서 — 커질 때는 창을 먼저 키우고 움직이고(resize-then-animate),
//         작아질 때는 움직임이 끝난 뒤 창을 줄인다(animate-then-resize). 움직임 줄이기면 0ms(바로)
//   flip: 처음 · 끝 상자에서 옮길 거리 · 늘릴 비율(FLIP) — 왼쪽 위를 붙든다(앱 안의 섬은 왼쪽 위에 붙어 있고, 노치 Mac은 위 가장자리를 붙든 채 아래 · 옆으로만 자란다)
// 브라우저(window.FloeMorph)와 Node(require — 04-tests/navigator/morph.test.js) 둘 다에서 읽힌다(greet.js와 같은 방식).
(function (root) {
  const PEEK = { w: 24, h: 6 };            // 올리면 커지는 크기(px)
  const RESERVE = { w: 24, h: 8 };         // 접힌 창에 늘 두는 여유(px) — 올림 커짐이 창 크기 IPC를 만들지 않게
  const MS = { expand: 300, collapse: 240, peek: 200, unpeek: 160, reveal: 0.6 };   // reveal: 바탕이 이만큼 자란 뒤 내용이 나타난다
  const EASE = { expand: "cubic-bezier(.3,1.4,.5,1)", collapse: "cubic-bezier(.4,0,.2,1)", peek: "cubic-bezier(.3,1.4,.5,1)", unpeek: "ease-out" };

  const peekSize = (w, h) => ({ w: Math.round(w + PEEK.w), h: Math.round(h + PEEK.h) });
  const peekScale = (w, h) => ({ sx: w > 0 ? (w + PEEK.w) / w : 1, sy: h > 0 ? (h + PEEK.h) / h : 1 });

  // from · to: {w, h}. still: 움직임 줄이기
  function plan(from, to, { still = false } = {}) {
    const a = (r) => Math.max(0, Number(r && r.w) || 0) * Math.max(0, Number(r && r.h) || 0);
    const growing = a(to) >= a(from);
    return {
      order: growing ? "resize-then-animate" : "animate-then-resize",
      ms: still ? 0 : growing ? MS.expand : MS.collapse,
      easing: growing ? EASE.expand : EASE.collapse,
      reveal: still ? 0 : growing ? MS.reveal : 0,   // 줄어들 때는 내용이 먼저 사라진다(0 — 처음부터)
    };
  }
  // FLIP — from · to: {x, y, w, h}(화면 좌표). 끝 상자에 둔 바탕이 처음 상자처럼 보이려면 얼마나 옮기고 늘려야 하나(왼쪽 위 기준)
  function flip(from, to) {
    const sx = to.w > 0 ? from.w / to.w : 1, sy = to.h > 0 ? from.h / to.h : 1;
    return { dx: from.x - to.x, dy: from.y - to.y, sx, sy };
  }

  const api = { PEEK, RESERVE, MS, EASE, peekSize, peekScale, plan, flip };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeMorph = api;
})(typeof window !== "undefined" ? window : globalThis);
