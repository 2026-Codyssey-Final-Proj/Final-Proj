// 플로로 — 팀 앱의 NavSeal.svg를 그대로 쓰고(모양 · 색은 손대지 않음), 자리 · 크기 · 기울기만 바꾼다.
// 브라우저에서는 seal.js가 먼저 올린 window.NavSeal, Node(시험)에서는 seal.js를 require한다.
let NS = globalThis.NavSeal;
if (!NS) {
  const { createRequire } = await import('node:module');
  NS = createRequire(import.meta.url)('../../../Final-Proj/02-frontend/navigator/seal.js');
}

const n2 = (v) => +v.toFixed(2);
let clipN = 0;

// x, y = 그림의 아래 가운데(몸통 바닥). size = 그림 칸 120을 몇 칸으로 그릴지.
// 120보다 작게 부르면 NavSeal이 '작은 모양'(입 · 지느러미 생략)으로 바꾸므로 늘 120으로 부르고 scale로 줄인다.
// blink: 눈을 감는 순간(seal.css의 .blink 규칙 — 기본 · 살펴보는 중 · 생각 표정에서 점 눈이 선으로 바뀜)
export function floro(mood, { x = 0, y = 0, size = 40, rot = 0, flip = false, sx = 1, sy = 1, tail = false, clipY = null, extra, blink = false } = {}) {
  const k = size / 120;
  const inner = NS.svg(mood, 120, { noTail: !tail, extra });
  const g = `<g${blink ? ' class="blink"' : ''} transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(rot)}) scale(${(k * sx * (flip ? -1 : 1)).toFixed(3)} ${(k * sy).toFixed(3)}) translate(-56 -115)">${inner}</g>`;
  if (clipY == null) return `<g data-floro="${mood}">${g}</g>`;
  const id = `fc${++clipN}`;
  return `<g data-floro="${mood}"><clipPath id="${id}"><rect x="-1000" y="-1000" width="2320" height="${n2(clipY + 1000)}"/></clipPath><g clip-path="url(#${id})">${g}</g></g>`;
}
