// ③-1 화면 안으로 (11–13초): 플로로가 들어간 노트북 화면에서 둥근 물결이 퍼지며 앱 화면이 열림 → 카드 4장이 톡톡
// ③-2 (13–23초): 플로로가 네 칸을 지그재그로 찾아가며 소개 → 마지막에 웅덩이로 쏙(④로 넘어가는 물결의 시작점)
import { C } from '../art/palette.mjs';
import { quadrant, QPOS, QSIZE, puddle, LAPTOP1 } from '../art/props.mjs';
import { floro } from '../floro.mjs';
import { FLORO_ARRIVALS as A } from '../cues.mjs';
import { pop, prog, lerp, hop, easeOutBack, easeInOutCubic, blinkAt } from '../timeline.mjs';
import { composition as s2composition, cam2 } from './s2.mjs';
import { camera, wipe, toScreen } from './common.mjs';

const n2 = (v) => +v.toFixed(2);

// 노트북 화면 안(앱 바탕) — 옅은 칸 무늬 + 가장자리 은은한 그늘
export const surface = () => {
  let grid = '';
  for (let x = 20; x < 320; x += 20) grid += `M${x} 0 V180 `;
  for (let y = 20; y < 180; y += 20) grid += `M0 ${y} H320 `;
  return `<g data-surface="1"><rect x="-20" y="-20" width="360" height="220" fill="${C.screen}"/><path d="${grid}" stroke="#DCE7F7" stroke-width=".5"/>
    <rect x="-20" y="-20" width="360" height="220" fill="none" stroke="#D6E4F7" stroke-width="30" opacity=".5"/></g>`;
};

const center = (n) => [QPOS[n][0] + QSIZE[0] / 2, QPOS[n][1] + QSIZE[1] / 2];
const STACK_ROT = { 1: 0, 2: 4, 3: -7, 4: 8 };

// ── ③-1 ──────────────────────────────────────────────
function cards31(t) {
  return [4, 3, 2, 1].map((n, i) => {
    const appear = pop(t, 11.75 + i * 0.07, 0.4);
    if (appear <= 0) return '';
    const spread = easeOutBack(prog(t, 12.35 + (4 - n) * 0.05, 13.0));
    const [cx, cy] = center(n);
    const dx = lerp(160 - cx, 0, spread), dy = lerp(90 - cy, 0, spread);
    const r = lerp(STACK_ROT[n], 0, spread), s = lerp(0.9, 1, spread) * appear;
    return `<g transform="translate(${n2(dx)} ${n2(dy)}) rotate(${n2(r)} ${cx} ${cy}) translate(${cx} ${cy}) scale(${n2(s)}) translate(${-cx} ${-cy})">${quadrant(n, {})}</g>`;
  }).join('');
}

function draw31(t) {
  const cam = cam2(11);
  const r = 215 * easeInOutCubic(prog(t, 11.0, 11.65));
  if (r < 212) {
    const [sx, sy] = toScreen([LAPTOP1.cx, LAPTOP1.cy], cam);
    return `${camera(s2composition(11), cam)}${wipe(surface(), { cx: sx, cy: sy, r })}`;
  }
  return `${surface()}${cards31(t)}`;
}

// ── ③-2 ──────────────────────────────────────────────
export const SPOT = { 1: { x: 24, y: 74 }, 2: { x: 296, y: 74 }, 3: { x: 24, y: 158 }, 4: { x: 296, y: 158 } };
const HOP_H = { 2: 34, 3: 18, 4: 26 };
const FLIP = { 1: false, 2: true, 3: false, 4: true };
const DIVE = [22.7, 23.0]; // 마지막 웅덩이로 쏙

function activeAt(t) {
  if (t >= 22.6) return 'all';
  let a = 1;
  for (let i = 0; i < A.length; i++) if (t >= A[i] - 0.3) a = i + 1;
  return a;
}

function floroMood(t) {
  if (t < A[1] - 0.3) return 'look';
  if (t < A[2] - 0.3) return 'happy';
  if (t < A[3] - 0.3) return t < 19.5 ? 'think' : 'done';
  return 'done';
}

function floro32(t) {
  const mood = floroMood(t);
  const blink = (mood === 'look' || mood === 'think') && blinkAt(t, 1.7, 13.9);
  if (t < A[0]) {
    const y = lerp(SPOT[1].y + 34, SPOT[1].y, easeOutBack(prog(t, 13.0, A[0])));
    return floro(mood, { x: SPOT[1].x, y, size: 40, clipY: SPOT[1].y + 1 });
  }
  if (t >= DIVE[0]) {
    if (t >= DIVE[1]) return '';
    const y = lerp(SPOT[4].y, SPOT[4].y + 40, prog(t, DIVE[0], DIVE[1]) ** 2);
    return floro('happy', { x: SPOT[4].x, y, size: 40, flip: true, clipY: SPOT[4].y + 1 });
  }
  for (let n = 2; n <= 4; n++) {
    const t0 = A[n - 1] - 0.3, t1 = A[n - 1];
    if (t < t0 - 0.08) continue;
    if (t >= t0 - 0.08 && t <= t1 + 0.12 && (n === 4 || t < A[n] - 0.38)) {
      const h = hop(t, t0, t1, SPOT[n - 1], SPOT[n], HOP_H[n]);
      return floro(t < t1 ? 'happy' : mood, { x: h.x, y: h.y, size: 40, sx: h.sx, sy: h.sy, flip: t < t0 ? FLIP[n - 1] : FLIP[n] });
    }
  }
  const at = activeAt(t) === 'all' ? 4 : activeAt(t);
  return floro(mood, { x: SPOT[at].x, y: SPOT[at].y + Math.sin(t * 3) * 0.6, size: 40, flip: FLIP[at], blink });
}

// ④ 칸에서 문서가 폴더에 들어가면 물 뿜기
function spout(t) {
  const k = prog(t, 22.05, 22.65);
  if (k <= 0 || k >= 1) return '';
  const { x, y } = SPOT[4], top = y - 40, h = 14 * Math.sin(Math.PI * k);
  return `<g opacity="${n2(1 - k * 0.6)}"><path d="M${x} ${top} q-4 ${n2(-h * 0.6)} -10 ${n2(-h * 0.7)} M${x} ${top} q4 ${n2(-h * 0.6)} 10 ${n2(-h * 0.7)} M${x} ${top} v${n2(-h)}" fill="none" stroke="#8ECCF2" stroke-width="2" stroke-linecap="round"/>
    <circle cx="${x - 10}" cy="${n2(top - h * 0.75)}" r="1.6" fill="#8ECCF2"/><circle cx="${x + 10}" cy="${n2(top - h * 0.75)}" r="1.6" fill="#8ECCF2"/><circle cx="${x}" cy="${n2(top - h - 2)}" r="1.6" fill="#8ECCF2"/></g>`;
}

function dimOf(n, t, act) {
  if (act === 'all') return 1;
  if (t < A[0]) return lerp(1, n === 1 ? 1 : 0.3, prog(t, 13.0, A[0]));
  if (n === act) return 1;
  return n < act ? 0.6 : 0.3;
}

// ③-2 화면(배경 포함)
export function gridAt(t) {
  const act = activeAt(t);
  const quads = [1, 2, 3, 4].map((n) => {
    const p = prog(t, A[n - 1], A[n - 1] + 1.8);
    return quadrant(n, { p, dim: dimOf(n, t, act), active: (act === n || act === 'all') && t >= A[0] - 0.3 });
  }).join('');
  const pud = [1, 2, 3, 4].map((n) => {
    const shown = act === 'all' ? n === 4 : n === act;
    const ripple = n === 4 && t >= DIVE[0] ? 1 + 0.5 * prog(t, DIVE[0], DIVE[1]) : 1;
    return puddle(SPOT[n].x, SPOT[n].y, 16 * ripple, shown ? 1 : 0.25);
  }).join('');
  return `<g data-active="${act}">${surface()}${pud}${quads}${floro32(t)}${spout(t)}</g>`;
}

export function draw(t) {
  return t < 13 ? draw31(t) : gridAt(t);
}
