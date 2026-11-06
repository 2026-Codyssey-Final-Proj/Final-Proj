// 사람 — Getty 계열 기업용 플랫 벡터 그림체(레퍼런스 16장에서 정리, storyboard.md 4절):
// 작은 머리 · 긴 다리 · 끝으로 가늘어지는 팔다리, 겹쳐 입은 옷(셔츠 깃 + 스웨터/카디건), 옷마다 두 톤 그늘,
// 얇은 주름선 1–2개, 엄지가 있는 손, 밑창이 있는 신발, 볼륨 있는 머리카락에 밝은 결 한 줄, 점 눈 · 튀어나온 코.
import { C } from './palette.mjs';

const lerp = (a, b, k) => a + (b - a) * k;
const n2 = (v) => +v.toFixed(2);
const P = (pts) => pts.map(([x, y]) => `${n2(x)} ${n2(y)}`);

// 끝으로 가늘어지는 팔다리 — 마디마다 굵기(ws)를 주고 마디는 둥글게
export function limb(pts, ws, color) {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    const a = ws[i] / 2, b = ws[i + 1] / 2;
    s += `<path d="M${n2(x0 + nx * a)} ${n2(y0 + ny * a)} L${n2(x1 + nx * b)} ${n2(y1 + ny * b)} L${n2(x1 - nx * b)} ${n2(y1 - ny * b)} L${n2(x0 - nx * a)} ${n2(y0 - ny * a)} Z" fill="${color}"/>`;
  }
  pts.forEach(([x, y], i) => { s += `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(ws[i] / 2)}" fill="${color}"/>`; });
  return s;
}
// 소매 끝단 — 마지막 마디의 끝 15%를 진한 색으로
function cuff(pts, ws, color) {
  const [x0, y0] = pts[pts.length - 2], [x1, y1] = pts[pts.length - 1];
  const k = 0.82, cx = lerp(x0, x1, k), cy = lerp(y0, y1, k), w = ws[ws.length - 1] + 0.6;
  return limb([[cx, cy], [x1, y1]], [w, w], color);
}
const angle = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

// 손 — 손목(0,0)에서 +x 쪽으로. kind: mitt(가볍게 쥔 손) · open(손바닥을 펴 내민 손) · point(검지로 가리킴) · grip(물건을 쥔 손)
export function hand(x, y, rot, s, skin, shade, kind = 'mitt') {
  let d;
  if (kind === 'open') {
    d = `<path d="M0 -2.4 C2.6 -3 5.4 -3.4 7.6 -2.8 C8.6 -2.4 8.6 -1.2 7.6 -1 L5.8 -0.8 C7.4 -0.6 8.8 0 8.6 1 C8.4 1.8 7.2 1.8 5.6 1.6 C6.8 2 7.4 2.8 6.8 3.4 C6.2 3.9 4.6 3.6 3 3.2 C1.6 3 0.6 2.8 0 2.4 Z" fill="${skin}"/>
      <path d="M1.8 -2.2 C2.4 -4.6 4.2 -5.8 5.4 -5.2 C6.2 -4.8 5.6 -3.6 4.2 -2.6 Z" fill="${skin}"/>`;
  } else if (kind === 'point') {
    d = `<path d="M0 -2.6 C2 -3.2 4 -3 5.2 -2.4 L10.6 -2.2 C11.6 -2.2 11.8 -0.8 10.8 -0.6 L5.8 -0.4 C6.6 0.6 6.6 2.2 5.4 2.8 C3.6 3.6 1.4 3.4 0 2.6 Z" fill="${skin}"/>
      <path d="M1.6 -2.4 C1.8 -4.4 3.4 -5.2 4.4 -4.6 C5 -4.2 4.4 -3.2 3.4 -2.4 Z" fill="${skin}"/>`;
  } else {
    // 가볍게 쥔 손: 손바닥이 손목만큼 넓고, 엄지는 옆에 붙인 채, 손가락 마디 홈 셋
    d = `<path d="M-0.4 -3 C2.4 -3.8 6 -3.8 7.8 -2.4 C9.2 -1.2 9.2 1.6 7.8 2.8 C6 4.2 2.4 4 -0.4 3 Z" fill="${skin}"/>
      <path d="M1.4 -2.8 C2.2 -4.4 4.2 -4.8 5.2 -4.2 C5.8 -3.8 5.2 -3 4 -2.6 Z" fill="${skin}"/>
      <path d="M6.2 -1.6 h2.2 M6.4 0.4 h2.4 M6.2 2.2 h2" stroke="${shade}" stroke-width=".5" stroke-linecap="round"/>`;
  }
  return `<g transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(rot)}) scale(${n2(s)})">${d}</g>`;
}

// ── ①·② 뒤돌아 앉은 주인공 ──────────────────────────────────
// 자세마다 팔 2개(어깨 → 팔꿈치 → 손목). 안 보이는 팔은 몸통 뒤(오른쪽 안)에 접혀 있다가 자세가 바뀌면 몸 뒤에서 나온다.
const HIDDEN = { pts: [[282, 112], [288, 146], [276, 168]], w: [12, 11, 10], hand: 0 };
export const POSE_ARMS = {
  // 턱 괴기: 팔꿈치를 책상에 대고 손이 턱으로 — 보이는 팔은 하나
  chin: [{ pts: [[210, 118], [188, 157], [223, 92]], w: [12.4, 11.4, 9.6], hand: 1, kind: 'mitt', rot: 15 }, HIDDEN],
  // 머리 감싸 쥐기: 두 팔꿈치가 밖으로
  headgrab: [{ pts: [[214, 116], [190, 86], [224, 66]], w: [12.4, 11.2, 9.6], hand: 1, kind: 'mitt', rot: 0 },
    { pts: [[280, 112], [300, 82], [263, 61]], w: [12.4, 11.2, 9.6], hand: 1, kind: 'mitt', rot: 0 }],
  // 손을 내려 키보드에
  lower: [{ pts: [[210, 126], [192, 150], [176, 154]], w: [12, 11, 9.6], hand: 1, kind: 'mitt', rot: 0 }, HIDDEN],
};
export function lerpArms(a, b, k) {
  return a.map((arm, i) => ({
    pts: arm.pts.map((p, j) => [lerp(p[0], b[i].pts[j][0], k), lerp(p[1], b[i].pts[j][1], k)]),
    w: arm.w.map((w, j) => lerp(w, b[i].w[j], k)),
    hand: lerp(arm.hand, b[i].hand, k),
    kind: k < 0.5 ? arm.kind : b[i].kind,
    rot: lerp(arm.rot ?? 0, b[i].rot ?? 0, k),
  }));
}

const SHADE = '#4F82DD', HAIR_LIGHT = '#33438A';

// pose: 이름표(시험용), arms: 실제 팔 좌표(없으면 pose의 것), turn 0 → 1: 뒤통수만 → 옆얼굴, face: think · grit · surprised · smile
export function seatedBack({ pose = 'chin', arms = null, turn = null, face = 'think', headRot = 0 } = {}) {
  const A = arms || POSE_ARMS[pose];
  const tr = turn == null ? (pose === 'headgrab' ? 0.35 : pose === 'chin' ? 0.6 : 0) : turn;
  const torso = `<path d="M198 182 C196 150 199 124 212 112 C224 102 268 99 283 106 C297 114 303 140 306 182 Z" fill="${C.sweater}"/>
    <path d="M283 106 C297 114 303 140 306 182 L287 182 C289 150 288 126 279 110 Z" fill="${SHADE}"/>
    <path d="M230 126 C234 142 234 160 232 176 M276 124 C272 140 272 158 275 174 M250 120 q5 3 10 1" fill="none" stroke="${C.sweaterDark}" stroke-width="1.3" stroke-linecap="round"/>`;
  const neck = `<path d="M235 88 L250 88 L253 106 L232 106 Z" fill="${C.skinShade}"/>
    <path d="M223 105 C232 113 253 113 263 103 C255 99 231 99 223 105 Z" fill="${C.collar}"/>
    <path d="M227 104.6 C235 110 251 110 259 103.4" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>`;
  const earX = lerp(233, 239.5, tr);
  const head = `<ellipse cx="243" cy="74" rx="16" ry="18" fill="${C.skin}"/>
    <path d="M${n2(earX - 2.6)} 76 C${n2(earX - 4.6)} 79 ${n2(earX - 2.6)} 84.4 ${n2(earX + 0.6)} 83.6 C${n2(earX + 3)} 83 ${n2(earX + 3)} 77 ${n2(earX)} 75.6 Z" fill="${C.skinShade}"/>
    <path d="M${n2(earX - 1)} 78.4 q-1 2.2 0.6 3.6" fill="none" stroke="#C7735A" stroke-width=".7" stroke-linecap="round"/>`;
  const hx = n2(7 * tr);
  const hair = `<g transform="translate(${hx} 0)">
    <path d="M226.6 75 C221.4 58 230 47.6 244 47.2 C252 47 259.4 50 263.4 56.6 C267.4 63.4 266.6 74 263.6 81.4 C261.6 87 257 91.6 251.6 93 C253.4 85 251.8 77 246 72.6 C240 69 233 70.4 226.6 75 Z" fill="${C.hair}"/>
    <path d="M228.4 61 C233 50.4 245.6 46 256 50.6 C250 49 240.4 50.8 234.6 57.2 Z" fill="${HAIR_LIGHT}"/>
    <path d="M236 55.4 C242 51.6 251.6 51.4 258.6 55.6" fill="none" stroke="${HAIR_LIGHT}" stroke-width="1.1" stroke-linecap="round"/>
  </g>`;
  let faceArt = '';
  if (tr > 0.05) {
    const o = Math.min(1, (tr - 0.05) / 0.4);
    const eye = face === 'grit' ? `<path d="M229 70.6 l3.4 1.8 l-3.4 1.8" fill="none" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`
      : face === 'surprised' ? `<circle cx="230.8" cy="71.8" r="1.8" fill="${C.ink}"/><circle cx="231.4" cy="71.1" r=".6" fill="#fff"/>`
      : face === 'smile' ? `<path d="M228.8 72.4 q2 -2.2 4 0" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/>`
      : `<circle cx="230.4" cy="72.6" r="1.35" fill="${C.ink}"/>`;
    const brow = face === 'surprised' ? 'M228 66.2 q2.6 -1.8 5.2 -0.2' : face === 'grit' ? 'M228.4 68.4 l5 1.4' : 'M228.4 67.8 q2.4 -1.2 4.8 0';
    const mouth = face === 'surprised' ? `<ellipse cx="230.4" cy="83" rx="1.3" ry="1.7" fill="${C.lip}"/>`
      : face === 'smile' ? `<path d="M228.6 82.2 q1.8 1.4 3.6 0" fill="none" stroke="${C.lip}" stroke-width="1.1" stroke-linecap="round"/>`
      : face === 'grit' ? `<path d="M228.6 83 q1.8 -1.2 3.6 0" fill="none" stroke="${C.lip}" stroke-width="1.1" stroke-linecap="round"/>`
      : `<path d="M228.8 82.6 h2.8" stroke="${C.lip}" stroke-width="1" stroke-linecap="round"/>`;
    faceArt = `<g opacity="${n2(o)}"><path d="M227.6 73.2 Q223.4 76.8 227.8 78.8 Z" fill="${C.skin}"/>
      <path d="${brow}" fill="none" stroke="${C.hair}" stroke-width="1.2" stroke-linecap="round"/>${eye}${mouth}
      ${face === 'smile' ? `<ellipse cx="233" cy="78.4" rx="2" ry="1.2" fill="${C.blush}" opacity=".75"/>` : ''}</g>`;
  }
  const armArt = A.map((a) => `${limb(a.pts, a.w, C.sweater)}${cuff(a.pts, a.w, C.sweaterDark)}
    <path d="M${n2(a.pts[1][0] + 3)} ${n2(a.pts[1][1] - 1)} l5 -1.4" stroke="${C.sweaterDark}" stroke-width="1.2" stroke-linecap="round" opacity="${n2(a.hand)}"/>`).join('');
  const hands = A.filter((a) => a.hand > 0.02).map((a) => {
    const w = a.pts[2], r = angle(a.pts[1], a.pts[2]) + (a.rot || 0);
    return `<g opacity="${n2(Math.min(1, a.hand * 1.5))}">${hand(w[0], w[1], r, 1.45, C.skin, C.skinShade, a.kind)}</g>`;
  }).join('');
  return `<g data-person="user" data-pose="${pose}" data-face="${tr > 0.05 ? face : 'none'}">
    ${armArt}${torso}${neck}<g transform="rotate(${n2(headRot)} 243 92)">${head}${hair}${faceArt}</g>${hands}</g>`;
}

// ── ④·⑤ 서 있는 사람 (오른쪽을 봄, 발 y 151, 몸 가운데 x 142) ──────────
// 팔 자세(앞팔: 어깨 → 팔꿈치 → 손목)
const FRONT_ARM = {
  rest: { pts: [[152, 71.6], [154.6, 87.4], [155.4, 99.4]], kind: 'mitt', rot: 0 },
  open: { pts: [[152, 71.6], [161, 85.4], [170.4, 78]], kind: 'open', rot: -6 },
  point: { pts: [[152, 71.6], [160.4, 81.6], [165, 68.4]], kind: 'point', rot: 0 },
  hold: { pts: [[152, 71.6], [151.4, 87], [158.6, 91.4]], kind: 'mitt', rot: -70 },
};
export function mixArm(a, b, k) {
  const A = FRONT_ARM[a], B = FRONT_ARM[b];
  return { pts: A.pts.map((p, i) => [lerp(p[0], B.pts[i][0], k), lerp(p[1], B.pts[i][1], k)]), kind: k < 0.5 ? A.kind : B.kind, rot: lerp(A.rot, B.rot, k) };
}

function figure({ pal, hairStyle = 'quiff', glasses = false, top = 'sweater', front = FRONT_ARM.rest, blink = false, talk = 0, smile = true, nod = 0, tilt = 0, sway = 0, breathe = 0, prop = '' }) {
  const legs = `${limb([[136, 103], [135, 126.5], [136, 146.4]], [10, 8, 6.6], pal.pantsB)}
    ${limb([[146.4, 103], [147.6, 126], [148, 146.4]], [10.6, 8.4, 7], pal.pantsA)}
    <path d="M148.6 108 L148.2 144" stroke="${pal.pantsB}" stroke-width=".7" opacity=".7"/>
    <path d="M144.4 127 q2 1.4 4.4 0.4" fill="none" stroke="${pal.pantsB}" stroke-width=".8" stroke-linecap="round"/>`;
  const shoe = (x, c) => `<path d="M${x - 4.6} 145 C${x - 4.6} 143.6 ${x - 3.2} 143.2 ${x - 1.8} 143.6 L${x + 3.4} 144.6 C${x + 7.4} 145.4 ${x + 9.4} 146.8 ${x + 9.6} 149.4 L${x + 9.6} 150.6 L${x - 4.6} 150.6 Z" fill="${c}"/>
    <path d="M${x - 4.8} 150.8 H${x + 9.8}" stroke="${pal.sole}" stroke-width="1.6" stroke-linecap="round"/>`;
  const shoes = `${shoe(136.2, pal.shoeB)}${shoe(148.2, pal.shoeA)}`;
  const torso = `<path d="M128 104.6 C126.2 93 126.6 79 130.6 71.4 C133.6 66.4 139 64.6 144 64.8 C150 65 154.6 68.4 156.2 73.6 C158 81 158.4 94 156.6 104.6 Z" fill="${pal.top}"/>
    <path d="M128 104.6 C126.2 93 126.6 79 130.6 71.4 C131.8 69.4 133.2 68 134.8 67 C132 76 131.6 92 133 104.6 Z" fill="${pal.topShade}"/>
    ${top === 'cardigan' ? `<path d="M145.6 68 L146.6 104.6" stroke="${pal.topDark}" stroke-width="1"/>
      <circle cx="147.8" cy="78" r=".9" fill="${pal.button}"/><circle cx="148" cy="85.4" r=".9" fill="${pal.button}"/><circle cx="148.2" cy="92.8" r=".9" fill="${pal.button}"/>`
      : `<path d="M141 81 q1.6 9 0 17" fill="none" stroke="${pal.topDark}" stroke-width="1.1" stroke-linecap="round"/>`}
    <rect x="128" y="100.8" width="28.6" height="4" rx="1.8" fill="${pal.topDark}"/>`;
  const collar = `<path d="M137.2 65.6 L140.6 70.2 L142.4 66.6 Z M147.8 65.2 L144.6 70 L142.8 66.6 Z" fill="#FFFFFF"/>
    <path d="M136 66.2 C138.6 70.6 146 70.6 148.8 65.8" fill="none" stroke="${pal.topDark}" stroke-width="1.6" stroke-linecap="round"/>`;
  const neck = `<path d="M138.8 57.2 L145.4 57.2 L146 66.6 L138.2 66.6 Z" fill="${pal.skinShade}"/>`;
  const eye = blink ? `<path d="M145.6 47.2 h2.4" stroke="${C.ink}" stroke-width="1" stroke-linecap="round"/>`
    : smile ? `<path d="M145.4 47.6 q1.5 -1.6 3 0" fill="none" stroke="${C.ink}" stroke-width="1" stroke-linecap="round"/>`
      : `<circle cx="146.8" cy="47" r=".95" fill="${C.ink}"/>`;
  const mouth = talk > 0.5 ? `<path d="M145.8 53 q1.8 2.6 3.6 0 Z" fill="${C.lip}"/>`
    : `<path d="M145.8 53.2 q1.8 1.3 3.6 0" fill="none" stroke="${C.lip}" stroke-width=".95" stroke-linecap="round"/>`;
  const hair = hairStyle === 'curly'
    ? `<path d="M133.6 49.4 C131.8 42 135.8 36.4 142.6 36.4 C148.6 36.4 152.4 39.6 152 43.6 C149 42.2 145.6 42 143.4 43 C141.8 43.8 141 45.6 140.2 47.4 C139 46.6 137.6 46.8 137 48.2 C136.4 49.8 136.6 51.6 136 53 C135 54.2 134 52.6 133.6 49.4 Z" fill="${pal.hair}"/>
      ${[[134.6, 41.6, 3.2], [138.4, 37.6, 3.4], [143.4, 36, 3.4], [148.4, 37.4, 3.1], [151.6, 40.8, 2.6], [133.6, 46.4, 2.6], [135.4, 51, 2.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${pal.hair}"/>`).join('')}
      <path d="M137.4 37.8 q2.6 -1.6 5.2 -0.6 M143.8 36.6 q2.6 -0.4 4.6 1.2" fill="none" stroke="${pal.hairLight}" stroke-width=".9" stroke-linecap="round"/>`
    : `<path d="M133.2 49.6 C131.4 41.4 136 35.4 143 35.6 C148.8 35.8 152.6 38.6 152.4 43 C150.2 41.6 147 41.4 144.8 42.4 C143.4 43.2 142.6 44.6 142 46.2 C141 45.4 139.4 45.4 138.6 46.6 C137.8 47.8 138 49.6 137.4 51.6 C136.6 53.6 134.2 53.4 133.2 49.6 Z" fill="${pal.hair}"/>
      <path d="M137 38.6 C139.8 36.6 145 36.2 149 38.2" fill="none" stroke="${pal.hairLight}" stroke-width="1.1" stroke-linecap="round"/>`;
  const head = `<g transform="rotate(${n2(nod * 7 + tilt)} 142 57)">
    <path d="M133.8 49 C133.6 42.2 138.4 39.4 142.6 39.6 C147.6 39.8 150.4 43.4 150.4 48.4 C150.4 53.6 147.4 57.6 142.6 57.6 C137.8 57.6 134 54.4 133.8 49 Z" fill="${pal.skin}"/>
    <path d="M136.4 47.6 C134.2 46.8 133.2 50 134.8 51.8 C135.6 52.8 137.2 52.4 137.4 51.2 Z" fill="${pal.skinShade}"/>
    <path d="M150 46.6 C152.4 48 152.6 50 150.2 50.8 Z" fill="${pal.skin}"/>
    <path d="M144.8 44.4 q1.6 -1 3.2 0" fill="none" stroke="${pal.hair}" stroke-width=".9" stroke-linecap="round"/>
    ${eye}${mouth}
    <ellipse cx="146.2" cy="50.8" rx="1.5" ry=".8" fill="${C.blush}" opacity=".6"/>
    ${glasses ? `<circle cx="146.8" cy="47.2" r="2.4" fill="none" stroke="${C.ink}" stroke-width=".7"/><path d="M144.4 47 L137.4 47.4" stroke="${C.ink}" stroke-width=".55"/>` : ''}
    ${hair}</g>`;
  const backArm = [[131.6, 72], [129, 87.6], [131.4, 99.4]], bw = [7.4, 6.6, 5.8];
  const fw = [7.8, 6.8, 6];
  const arms = (layer) => layer === 'back'
    ? `${limb(backArm, bw, pal.topShade)}${cuff(backArm, bw, pal.topDark)}${hand(131.4, 99.4, 95, 1, pal.skinShade, pal.skinShade, 'mitt')}`
    : `${limb(front.pts, fw, pal.top)}${cuff(front.pts, fw, pal.topDark)}
       <path d="M${n2(front.pts[1][0] - 1.6)} ${n2(front.pts[1][1] + 1.6)} l2.6 2" stroke="${pal.topDark}" stroke-width=".9" stroke-linecap="round"/>
       ${hand(front.pts[2][0], front.pts[2][1], angle(front.pts[1], front.pts[2]) + front.rot, 1.05, pal.skin, pal.skinShade, front.kind)}`;
  const body = `<g transform="translate(142 104) scale(1 ${n2(1 + breathe * 0.012)}) translate(-142 -104)">${arms('back')}${torso}${collar}${neck}${head}${prop}${arms('front')}</g>`;
  return `${legs}${shoes}<g transform="rotate(${n2(sway)} 142 150)">${body}</g>`;
}

const USER_PAL = { top: C.sweater, topShade: SHADE, topDark: C.sweaterDark, skin: C.skin, skinShade: C.skinShade, hair: C.hair, hairLight: HAIR_LIGHT,
  pantsA: C.pants, pantsB: C.pantsDark, shoeA: C.shoe, shoeB: '#D48E2E', sole: '#FFFFFF' };
const EVAL_PAL = { top: C.evalSweater, topShade: '#286D60', topDark: C.evalSweaterDark, skin: C.evalSkin, skinShade: C.evalSkinShade, hair: C.evalHair, hairLight: '#7A5338',
  pantsA: C.evalPants, pantsB: C.evalPantsDark, shoeA: C.evalShoe, shoeB: '#2C2F5E', sole: '#1B1D3D', button: '#CFE7DF' };

// 주인공: gesture는 { from, to, k } 또는 자세 이름 하나
export function standingUser({ gesture = 'rest', blink = false, talk = 0, nod = 0, sway = 0, breathe = 0 } = {}) {
  const front = typeof gesture === 'string' ? mixArm(gesture, gesture, 1) : mixArm(gesture.from, gesture.to, gesture.k);
  const label = typeof gesture === 'string' ? gesture : gesture.k < 0.5 ? gesture.from : gesture.to;
  return `<g data-person="user-standing" data-gesture="${label}" data-blink="${blink ? 1 : 0}">${figure({ pal: USER_PAL, front, blink, talk, nod, sway, breathe, smile: true })}</g>`;
}

// 평가자: 같은 그림체를 좌우로 뒤집어 왼쪽을 보게(x 142 → 235). 체크리스트를 가슴 앞에 든다
export function evaluator({ nod = 0, checks = 0, blink = false, tilt = 0, sway = 0, breathe = 0, tap = 0 } = {}) {
  const marks = [0, 1, 2].filter((i) => i < checks)
    .map((i) => `<path d="M160.6 ${83.6 + i * 4.6} l1.2 1.2 l2.2 -2.4" fill="none" stroke="${C.ok}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const board = `<g transform="translate(0 ${n2(-tap * 1.2)}) rotate(-6 162 89)">
    <rect x="155" y="78" width="15" height="20" rx="1.6" fill="${C.paper}" stroke="${C.paperLine}" stroke-width=".8"/>
    <rect x="159.5" y="76.4" width="6" height="3" rx="1" fill="${C.lineDark}"/>
    <path d="M163.6 84 h4.4 M163.6 88.6 h4.4 M163.6 93.2 h3" stroke="${C.paperLine}" stroke-width="1" stroke-linecap="round"/>${marks}</g>`;
  const front = { ...FRONT_ARM.hold };
  return `<g data-person="evaluator" data-blink="${blink ? 1 : 0}" transform="translate(377 0) scale(-1 1)">
    ${figure({ pal: EVAL_PAL, hairStyle: 'curly', glasses: true, top: 'cardigan', front, blink, nod, tilt, sway, breathe, smile: false, prop: board })}</g>`;
}
