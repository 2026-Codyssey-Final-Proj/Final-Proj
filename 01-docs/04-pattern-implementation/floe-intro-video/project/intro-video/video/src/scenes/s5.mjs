// ⑤ 여운 (30–35초): 카메라가 설명하는 사람 뒤 노트북으로 다가가고, 화면 위로 플로로가 슬며시 고개를 내민다
import { floro } from '../floro.mjs';
import { heart } from '../art/props.mjs';
import { prog, lerp, easeInOutCubic, easeOutBack } from '../timeline.mjs';
import { composition4, cam4 } from './s4.mjs';
import { camera } from './common.mjs';

const FX = 76;          // 노트북 화면 오른쪽 위쪽
const HIDDEN_Y = 90;    // 화면 뒤에 숨은 자리(그림 아래 가운데)
const PEEK_Y = 79;      // 머리가 화면 위로 나온 자리
export const FLORO5 = { x: FX, y: PEEK_Y, size: 26 };

export function floro5(t) {
  if (t < 31.3) return null;
  const y = lerp(HIDDEN_Y, PEEK_Y, easeOutBack(prog(t, 31.3, 31.8)));
  const rot = lerp(0, 14, easeInOutCubic(prog(t, 32.0, 32.5)));
  const mood = t < 33.0 ? 'idle' : 'love';
  return { mood, x: FX, y: y + (t > 31.8 ? Math.sin((t - 31.8) * 2.6) * 0.4 : 0), size: 26, rot };
}

function hearts(t) {
  if (t < 33.0) return '';
  return [[84, 0], [90, 0.35], [80, 0.7]].map(([x, d]) => {
    const k = prog(t, 33.0 + d, 34.6 + d);
    return k > 0 && k < 1 ? heart(x + Math.sin(k * 6) * 1.5, 66 - k * 22, 1.1 + k * 0.4, 1 - k) : '';
  }).join('');
}

export function composition(t, { noFloro = false } = {}) {
  const f = floro5(t);
  const behind = !noFloro && f ? floro(f.mood, f) : '';
  // 하트는 noFloro여도 남긴다(⑥이 이 장면을 흐리게 깔 때 하트가 갑자기 사라지지 않게)
  return composition4(t, { behindLaptop: behind, over: hearts(t), bubbleFade: 1 - prog(t, 30, 30.6) });
}

export function cam5(t) {
  const s = cam4(30), k = easeInOutCubic(prog(t, 30, 35));
  return { cx: lerp(s.cx, 92, k), cy: lerp(s.cy, 76, k), scale: lerp(s.scale, 2.4, k) };
}

export const draw = (t) => camera(composition(t), cam5(t));
