// ⑥ 마무리 (35–40초): 화면이 흐려지는 사이 플로로가 가운데 마크 속으로 퐁당 → 마크 안에서 고개를 내밀어 로고 완성 → Floe → 문구
import { C } from '../art/palette.mjs';
import { mark } from '../art/props.mjs';
import { floro } from '../floro.mjs';
import { pop, prog, lerp, hop, easeOutBack } from '../timeline.mjs';
import { composition as s5composition, cam5, floro5 } from './s5.mjs';
import { camera } from './common.mjs';

const n2 = (v) => +v.toFixed(2);
const MARK = { x: 160, y: 56, size: 50 };
const TAGLINE = '당신을 위한 코딩 길잡이, Floe와 함께하세요';

// ⑤ 마지막 순간에 플로로가 있던 자리(화면 좌표)
function startSpot() {
  const c = cam5(35), f = floro5(35);
  return { x: 160 + (f.x - c.cx) * c.scale, y: 90 + (f.y - c.cy) * c.scale, size: f.size * c.scale, rot: f.rot };
}

// ⑤에서 플로로는 노트북 화면 뒤에 있었다 — 화면 위 가장자리(화면 좌표) 아래를 잘라 두고, 다 뛰어오른 뒤에 풀어 준다
function screenTopY() {
  const c = cam5(35);
  return 90 + (66 - c.cy) * c.scale;
}

function jumper(t) {
  if (t >= 35.9) return '';
  const s = startSpot();
  const clipY = t < 35.45 ? screenTopY() : null;
  if (t < 35.25) return floro('love', { x: s.x, y: s.y, size: s.size, rot: s.rot, clipY });
  const h = hop(t, 35.25, 35.9, { x: s.x, y: s.y }, { x: MARK.x, y: MARK.y + 6 }, 34);
  const k = prog(t, 35.25, 35.9);
  return floro('happy', { x: h.x, y: h.y, size: lerp(s.size, 30, k), rot: lerp(s.rot, 0, k), sx: h.sx, sy: h.sy, clipY });
}

function splash(t) {
  const k = prog(t, 35.9, 36.5);
  if (k <= 0 || k >= 1) return '';
  const top = MARK.y - MARK.size / 2;
  const drops = [[-12, -10], [0, -16], [12, -10]].map(([dx, dy]) =>
    `<circle cx="${n2(MARK.x + dx * k * 1.4)}" cy="${n2(top + dy * Math.sin(Math.PI * k))}" r="1.8" fill="#8ECCF2" opacity="${n2(1 - k)}"/>`).join('');
  return `<ellipse cx="${MARK.x}" cy="${n2(top + 1)}" rx="${n2(10 + 22 * k)}" ry="${n2(2 + 3 * k)}" fill="none" stroke="#8ECCF2" stroke-width="1.6" opacity="${n2(1 - k)}"/>${drops}`;
}

function logo(t) {
  const m = pop(t, 35.4, 0.4);
  if (m <= 0) return '';
  const rise = easeOutBack(prog(t, 36.35, 36.7));
  const inner = t >= 36.35 ? floro('happy', { x: MARK.x, y: lerp(MARK.y + 56, MARK.y + 35, rise), size: 43 }) : '';
  return `<g transform="translate(${MARK.x} ${MARK.y}) scale(${n2(m)}) translate(${-MARK.x} ${-MARK.y})">${mark({ ...MARK, inner })}</g>`;
}

function words(t) {
  const w = pop(t, 37.0, 0.4), tg = prog(t, 37.6, 38.1);
  let s = '';
  if (w > 0) {
    s += `<g transform="translate(160 108) scale(${n2(w)}) translate(-160 -108)"><text data-caption="wordmark" x="160" y="116" text-anchor="middle" font-family="'Bagel Fat One','Gowun Dodum',sans-serif" font-size="25" fill="${C.ink}">Floe</text></g>`;
  }
  if (tg > 0) {
    s += `<text data-caption="tagline" x="160" y="${n2(135 + 4 * (1 - tg))}" text-anchor="middle" font-size="9" fill="${C.navy}" opacity="${n2(tg)}">${TAGLINE}</text>`;
  }
  return s;
}

export function draw(t) {
  const b = prog(t, 35.0, 36.0);
  const base = camera(s5composition(35, { noFloro: true }), cam5(35));
  return `<defs><filter id="blur6" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${n2(3.2 * b)}"/></filter></defs>
    <g filter="url(#blur6)">${base}</g>
    <rect x="-10" y="-10" width="340" height="200" fill="#FFFFFF" opacity="${n2(0.7 * b)}"/>
    ${logo(t)}${splash(t)}${jumper(t)}${words(t)}`;
}
