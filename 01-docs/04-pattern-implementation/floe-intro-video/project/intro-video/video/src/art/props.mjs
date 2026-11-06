// 소품 — 떠 있는 창 · 노트북 · 책상 · 기능 칸 · 마크 · 작은 효과(하트 · 반짝 · 물웅덩이 · 말풍선)
import { C } from './palette.mjs';

const n2 = (v) => +v.toFixed(2);
const cl = (x) => Math.max(0, Math.min(1, x));
const eo = (x) => 1 - (1 - cl(x)) ** 3;
let uid = 0;
const id = (p) => `${p}${++uid}`;
const at = (cx, cy, s) => `transform="translate(${n2(cx)} ${n2(cy)}) scale(${n2(s)}) translate(${n2(-cx)} ${n2(-cy)})"`;

// ① 노트북 뒤에 떠 있는 창 2개. errors 0 → 1: 빨간 오류 표시가 톡톡 커짐
export function windows({ errors = 0 } = {}) {
  const e = cl(errors) > 0 ? errors : 0;
  const err = e > 0;
  return `<g data-errors="${err ? 1 : 0}">
    <rect x="122" y="22" width="80" height="70" rx="4" fill="${C.winBack}" stroke="${C.navy}" stroke-width="1.2"/>
    <path d="M132 34 H170" stroke="${C.navy}" stroke-width="1"/>
    <path d="M132 50 H188 M132 58 H178 M132 66 H184" stroke="${C.line}" stroke-width="1.6" stroke-linecap="round"/>
    ${err ? `<g ${at(188, 34, e)}><circle cx="188" cy="34" r="4.5" fill="${C.err}"/><path d="M186 32 l4 4 M190 32 l-4 4" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></g>
      <path d="M132 72 q3 -3 6 0 t6 0 t6 0 t6 0" fill="none" stroke="${C.err}" stroke-width="1.2" opacity="${n2(cl(e))}"/>` : ''}
    <rect x="70" y="42" width="88" height="76" rx="4" fill="${C.win}" stroke="${C.navy}" stroke-width="1.2"/>
    <circle cx="150" cy="50" r="3.6" fill="none" stroke="${C.navy}" stroke-width="1"/>
    <rect x="80" y="58" width="22" height="22" fill="${C.laptop}"/>
    <path d="M108 61 H146 M108 69 H146 M108 77 H132" stroke="${C.laptop}" stroke-width="3" stroke-linecap="round"/>
    ${err ? `<g ${at(114, 94, e)}><rect x="80" y="88" width="68" height="12" rx="2" fill="${C.errSoft}"/>
      <circle cx="86" cy="94" r="3.6" fill="${C.err}"/><path d="M86 92 V94.4 M86 96 V96.2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M94 92 H138 M94 96.5 H124" stroke="${C.errLine}" stroke-width="1.6" stroke-linecap="round"/></g>`
    : `<path d="M80 92 H140 M80 99 H128" stroke="${C.lineDark}" stroke-width="1"/>`}
    <path d="M80 108 H140" stroke="${C.lineDark}" stroke-width="1"/>
  </g>`;
}

// ①·② 노트북 (스케치 v3 좌표, 화면 가운데 약 135,131)
export const LAPTOP1 = { cx: 135, cy: 131, poly: 'M100 112 L166 106 L170 152 L104 157 Z' };
export function laptopSide({ screen = 'plain', errors = 0, ripple = 0, glow = 0 } = {}) {
  const cp = id('ls');
  let inner = '';
  if (screen !== 'glow' || glow < 1) {
    inner += `<path d="M110 118 L146 115 M110 126 L138 123.6 M110 134 L152 130.4" stroke="${C.code}" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (errors > 0) {
    inner += `<path d="M110 139 q2.5 -2.5 5 0 t5 0 t5 0 t5 0 t5 0 t5 0" fill="none" stroke="${C.err}" stroke-width="1.2" opacity="${n2(cl(errors))}"/>
      <g ${at(158, 143, errors)}><circle cx="158" cy="143" r="4" fill="${C.err}"/><path d="M158 141 V143.6 M158 145.2 V145.4" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></g>`;
  }
  if (screen === 'glow' && glow > 0) {
    let rings = '';
    for (let k = 0; k < 3; k++) {
      const f = (ripple + k / 3) % 1;
      rings += `<ellipse cx="${LAPTOP1.cx}" cy="${LAPTOP1.cy + 6}" rx="${n2(6 + f * 40)}" ry="${n2((6 + f * 40) * 0.42)}" fill="none" stroke="#fff" stroke-width="1.4" opacity="${n2((1 - f) * glow * 0.9)}"/>`;
    }
    inner += `<rect x="96" y="100" width="80" height="62" fill="${C.waterLight}" opacity="${n2(glow)}"/>
      <ellipse cx="${LAPTOP1.cx}" cy="${LAPTOP1.cy + 6}" rx="30" ry="12" fill="#B8E2FF" opacity="${n2(glow * 0.6)}"/>${rings}`;
  }
  return `<g data-laptop="${screen}">
    <clipPath id="${cp}"><path d="${LAPTOP1.poly}"/></clipPath>
    <path d="${LAPTOP1.poly}" fill="#FFFFFF"/>
    <g clip-path="url(#${cp})">${inner}</g>
    <path d="${LAPTOP1.poly}" fill="none" stroke="${C.laptop}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M104 157 L170 152 L196 158 L128 163 Z" fill="${C.laptop}"/>
  </g>`;
}

// ①·② 책상 선 · 다리 · 머그컵(김이 흔들림)
export function desk1({ t = 0 } = {}) {
  const w = n2(Math.sin(t * 3) * 0.8);
  return `<g data-desk="1">
    <rect x="80" y="151" width="11" height="13" rx="2" fill="${C.mug}"/>
    <path d="M80 154 q-5 0 -5 4 q0 4 5 4" fill="none" stroke="${C.mug}" stroke-width="2"/>
    <path transform="translate(${w} 0)" d="M84 146 q-2 -3 0 -6 M88 146 q-2 -3 0 -6" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>
    <path d="M76 164 H268" stroke="${C.navy}" stroke-width="4" stroke-linecap="round"/>
    <path d="M96 164 V182" stroke="${C.navy}" stroke-width="4"/>
  </g>`;
}

// ④·⑤ 사람 뒤 책상 위 노트북 (화면 가운데 68,81, 화면 48×30). inner = 화면 안에 넣을 320×180칸 그림
export const LAPTOP4 = { cx: 68, cy: 81, x: 44, y: 66, w: 48, h: 30 };
export function laptopTable4({ inner = '', innerOpacity = 1 } = {}) {
  const cp = id('lt');
  const { x, y, w, h } = LAPTOP4;
  const k = w / 320, oy = y + (h - 180 * k) / 2;
  const code = `<path d="M50 72 h14 M54 77 h18 M54 82 h11 M50 87 h20 M50 92 h9" stroke-width="2" stroke-linecap="round" stroke="${C.code}"/>
    <path d="M50 72 h6" stroke="${C.f1}" stroke-width="2" stroke-linecap="round"/><path d="M54 82 h5" stroke="${C.f2}" stroke-width="2" stroke-linecap="round"/>`;
  return `<g data-laptop4="1">
    <path d="M22 100 H106" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 100 V154 M96 100 V154" stroke="${C.navy}" stroke-width="3"/>
    <clipPath id="${cp}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="#FFFFFF"/>
    <g clip-path="url(#${cp})">
      ${innerOpacity < 1 ? code : ''}
      ${inner && innerOpacity > 0 ? `<g opacity="${n2(innerOpacity)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.screen}"/><g transform="translate(${x} ${n2(oy)}) scale(${k})">${inner}</g></g>` : ''}
    </g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="none" stroke="${C.laptop}" stroke-width="2.2"/>
    <path d="M38 96 L98 96 L102 100 L34 100 Z" fill="${C.laptop}"/>
  </g>`;
}

// ③-2 기능 칸 — 자리와 이름
export const QPOS = { 1: [46, 12], 2: [164, 12], 3: [46, 94], 4: [164, 94] };
export const QSIZE = [110, 74];
export const LABELS = ['① 8단계 길 안내', '② 초안은 플로로, 확정은 나', '③ 관문 · 이해하셨나요?', '④ 문서가 내 GitHub에'];
const QCOLOR = { 1: C.f1, 2: C.f2, 3: C.f3, 4: C.f4 };
const ui = (x, y, size, fill, text, anchor = 'start') => `<text data-caption="ui" x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${text}</text>`;
const cursor = (x, y, s = 0.67) => `<path transform="translate(${n2(x)} ${n2(y)}) scale(${s})" d="M1 1 L1 13 L4 10 L6.5 15 L8.5 14 L6 9 L10.5 9 Z" fill="${C.navy}" stroke="#FFFFFF" stroke-width="1" stroke-linejoin="round"/>`;

function q1(p) {
  const moved = p >= 0.35;
  const hopUp = moved ? Math.sin(Math.PI * cl((p - 0.35) / 0.2)) * 3 : 0;
  let s = '';
  for (let i = 0; i < 8; i++) {
    const x = 6.25 + i * 12.5, cur = moved ? i === 2 : i === 1, done = moved ? i < 2 : i < 1;
    const y = cur ? 13 - hopUp : 16;
    s += `<rect x="${x}" y="${n2(y)}" width="10" height="12" rx="2.5" fill="${cur ? C.f1 : done ? '#CFE0FF' : '#E8EEF8'}"/>
      ${ui(x + 5, n2(y + 8.3), 6, cur ? '#FFFFFF' : done ? '#5B6B85' : '#9AA8BF', String(i + 1), 'middle')}`;
  }
  const rows = [[38, 70], [46, 52], [54, 60]].map(([yy, w], r) => {
    const k = eo((p - 0.45 - r * 0.12) / 0.25);
    return k > 0 ? `<circle cx="10" cy="${yy}" r="2.5" fill="${r === 0 ? C.f1 : 'none'}" stroke="${r === 0 ? 'none' : '#B9C7DD'}"/><rect x="16" y="${yy - 1.8}" width="${n2(w * k)}" height="3.6" rx="1.8" fill="${r === 0 ? '#C9D8F0' : '#E1E9F6'}"/>` : '';
  }).join('');
  return s + rows;
}

function q2(p) {
  const w1 = 70 * eo(p / 0.22), w2 = 54 * eo((p - 0.22) / 0.2), w3 = 30 * eo((p - 0.42) / 0.15);
  const caretX = 11 + (w3 > 0 ? w3 : w2 > 0 ? w2 : w1) + 1, caretY = w3 > 0 ? 24.5 : w2 > 0 ? 19 : 13.5;
  const pressed = p >= 0.8;
  const cx = 60 + (36 - 60) * eo((p - 0.6) / 0.18), cy = 30 + (42 - 30) * eo((p - 0.6) / 0.18);
  const ring = pressed && p < 0.95 ? `<circle cx="26" cy="43" r="${n2(4 + (p - 0.8) * 60)}" fill="none" stroke="${C.f2}" stroke-width="1" opacity="${n2(1 - (p - 0.8) / 0.15)}"/>` : '';
  return `<rect x="6" y="10" width="98" height="22" rx="3" fill="#F5F8FD" stroke="${C.cardLine}"/>
    <rect x="11" y="13.7" width="${n2(w1)}" height="2.6" rx="1.3" fill="#9FB4D6"/>
    <rect x="11" y="19.2" width="${n2(w2)}" height="2.6" rx="1.3" fill="#9FB4D6"/>
    <rect x="11" y="24.7" width="${n2(w3)}" height="2.6" rx="1.3" fill="#C9D8F0"/>
    ${p < 0.6 ? `<rect x="${n2(caretX)}" y="${caretY}" width="1" height="5" fill="${C.f2}"/>` : ''}
    <g ${at(26, 43, pressed && p < 0.86 ? 0.94 : 1)}><rect x="6" y="37" width="40" height="12" rx="6" fill="${pressed ? '#0E9384' : C.f2}"/>
    ${ui(26, 45.2, 6.5, '#FFFFFF', pressed ? '맞아요 ✓' : '맞아요', 'middle')}</g>
    <rect x="51" y="37" width="46" height="12" rx="6" fill="#FFFFFF" stroke="${C.f2}"/>${ui(74, 45.2, 6.5, '#0F8C7E', '고칠래요', 'middle')}
    ${ring}${p > 0.55 ? cursor(cx, cy) : ''}`;
}

function q3(p) {
  const pressed = p >= 0.42;
  const cx = 70 + (31 - 70) * eo((p - 0.15) / 0.25), cy = 44 + (29 - 44) * eo((p - 0.15) / 0.25);
  const lw = 46 * eo((p - 0.5) / 0.35);
  const sp = p >= 0.88 ? Math.min(1, (p - 0.88) / 0.08) : 0;
  return `<rect x="6" y="10" width="98" height="28" rx="4" fill="#FFF8E8" stroke="#F5C66A"/>
    ${ui(12, 20.5, 7, C.ink, '이해하셨나요?')}
    <g ${at(25, 30, pressed && p < 0.5 ? 0.92 : 1)}><rect x="12" y="25" width="26" height="10" rx="5" fill="${pressed ? '#D98C0E' : C.f3}"/>${ui(25, 32.2, 6, '#FFFFFF', '예', 'middle')}</g>
    <rect x="42" y="25" width="32" height="10" rx="5" fill="#FFFFFF" stroke="${C.f3}"/>${ui(58, 32.2, 6, '#B7791F', '아니요', 'middle')}
    ${p > 0.12 && p < 0.7 ? cursor(cx, cy) : ''}
    ${p >= 0.5 ? `${spark(10, 46, 4 * (sp > 0 ? 0.6 + 0.4 * sp : 0.6))}${ui(17, 48.6, 6, '#8A6A1F', '배운 것 한 줄')}<rect x="56" y="45.6" width="${n2(lw)}" height="3" rx="1.5" fill="#F5C66A"/>` : ''}`;
}

function q4(p) {
  const docs = [0, 1, 2].map((i) => {
    const k = eo((p - i * 0.15) / 0.45);
    const x0 = 8 + i * 4, y0 = 34 - i * 6, x1 = 82, y1 = 30;
    const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * 18;
    const s = k >= 1 ? 0 : 1 - k * 0.5;
    return s > 0 ? `<g transform="translate(${n2(x)} ${n2(y)}) rotate(${n2((1 - k) * (i - 1) * 10)}) scale(${n2(s)})">
      <path d="M-5.5 -7 H2 L5.5 -3.5 V7 H-5.5 Z" fill="#FFFFFF" stroke="#C8D6EA" stroke-width=".8"/><path d="M2 -7 V-3.5 H5.5" fill="#E8EEF8" stroke="#C8D6EA" stroke-width=".8"/>
      <path d="M-3.5 -1 H3.5 M-3.5 1.6 H3.5 M-3.5 4.2 H1" stroke="#B9C7DD" stroke-width=".9"/></g>` : '';
  }).join('');
  const chk = p >= 0.85 ? Math.min(1.1, (p - 0.85) / 0.08) : 0;
  return `<path d="M14 44 Q46 4 82 30" fill="none" stroke="${C.f4}" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>
    <rect x="76" y="24" width="11" height="6" rx="1.5" fill="#7C4DEB"/>
    <rect x="76" y="28" width="28" height="20" rx="2.5" fill="${C.f4}"/>
    ${docs}
    ${chk > 0 ? `<g ${at(103, 28, Math.min(1, chk))}><circle cx="103" cy="28" r="5" fill="${C.ok}"/><path d="M100.6 28 l1.8 1.8 l3.2 -3.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''}
    ${ui(90, 55, 5.5, '#5B3FC4', '내 저장소', 'middle')}`;
}

const QDRAW = { 1: q1, 2: q2, 3: q3, 4: q4 };
export function quadrant(n, { p = 0, dim = 1, active = false, scale = 1 } = {}) {
  const [x, y] = QPOS[n], [w, h] = QSIZE, col = QCOLOR[n];
  return `<g data-quad="${n}" opacity="${n2(dim)}" transform="translate(${x} ${y})${scale !== 1 ? ` translate(${w / 2} ${h / 2}) scale(${n2(scale)}) translate(${-w / 2} ${-h / 2})` : ''}">
    <rect x=".5" y=".5" width="109" height="73" rx="6" fill="${C.card}" stroke="${C.cardLine}"/>
    <rect x=".5" y=".5" width="109" height="4" rx="2" fill="${col}"/>
    ${QDRAW[n](cl(p))}
    <text data-caption="${n}" x="6" y="66" font-size="7.2" fill="${C.ink}">${LABELS[n - 1]}</text>
    ${active ? `<rect x="-1.5" y="-1.5" width="${w + 3}" height="${h + 3}" rx="7" fill="none" stroke="${col}" stroke-width="2"/>` : ''}
  </g>`;
}

// ⑥ 마크 — 둥근 네모 안에 inner(플로로)
export function mark({ x, y, size, inner = '' }) {
  const g = id('mg'), cp = id('mc'), r = size * 0.25;
  const box = `x="${n2(x - size / 2)}" y="${n2(y - size / 2)}" width="${n2(size)}" height="${n2(size)}" rx="${n2(r)}"`;
  return `<g data-mark="1"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.markA}"/><stop offset="1" stop-color="${C.markB}"/></linearGradient>
    <clipPath id="${cp}"><rect ${box}/></clipPath></defs>
    <rect ${box} fill="url(#${g})"/><g clip-path="url(#${cp})">${inner}</g></g>`;
}

export const heart = (x, y, s, o = 1) => `<path transform="translate(${n2(x)} ${n2(y)}) scale(${n2(s)})" d="M0 3.6 C-4.4 0.6 -4.4 -3.4 -1.6 -3.4 C-0.6 -3.4 0 -2.4 0 -1.8 C0 -2.4 0.6 -3.4 1.6 -3.4 C4.4 -3.4 4.4 0.6 0 3.6 Z" fill="#FF6F86" opacity="${n2(o)}"/>`;
export const spark = (x, y, s, o = 1) => `<path transform="translate(${n2(x)} ${n2(y)}) scale(${n2(s / 10)})" d="M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4 Z" fill="#FFD45C" opacity="${n2(o)}"/>`;
export const puddle = (cx, cy, rx, o = 1) => `<g data-puddle="1" opacity="${n2(o)}"><ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(rx)}" ry="${n2(rx * 0.24)}" fill="${C.water}" opacity=".55"/>
  <path d="M${n2(cx - rx * 0.6)} ${n2(cy - rx * 0.05)} Q${n2(cx)} ${n2(cy - rx * 0.2)} ${n2(cx + rx * 0.6)} ${n2(cy - rx * 0.05)}" fill="none" stroke="#FFFFFF" stroke-width=".9" opacity=".7"/></g>`;
export const bubbles = (pts) => pts.map(([x, y, r, o = 1]) => `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(r)}" fill="rgba(169,221,255,.35)" stroke="#CDE6FF" stroke-width=".8" opacity="${n2(o)}"/>`).join('');

// ④ 말풍선 — </>를 선으로
export const codeBubble = (x, y, s) => `<g data-bubble="code" transform="translate(${n2(x)} ${n2(y)}) scale(${n2(s)})">
  <rect x="-24" y="-11" width="48" height="22" rx="11" fill="#FFFFFF"/><path d="M-13 9 L-19 18 L-5 10 Z" fill="#FFFFFF"/>
  <path d="M-11 -4.5 L-16.5 0 L-11 4.5 M11 -4.5 L16.5 0 L11 4.5 M-3 6.5 L3 -6.5" fill="none" stroke="${C.f1}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
export const checkBubble = (x, y, s) => `<g data-bubble="check" transform="translate(${n2(x)} ${n2(y)}) scale(${n2(s)})">
  <circle r="9" fill="#FFFFFF"/><path d="M8 7 L12 13 L3 8.5 Z" fill="#FFFFFF"/>
  <path d="M-4.5 0 l3.2 3.2 l6 -6.6" fill="none" stroke="${C.ok}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
