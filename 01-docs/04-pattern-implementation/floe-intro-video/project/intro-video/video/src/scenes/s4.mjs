// ④ 성장 (23–30초): ③의 마지막 웅덩이에서 둥근 물결이 퍼지며 열리면, ①의 그 사람이 서서 평가자에게 설명하고 있다
import { standingUser, evaluator } from '../art/people.mjs';
import { laptopTable4, codeBubble, checkBubble } from '../art/props.mjs';
import { pop, prog, lerp, easeInOutCubic, easeOutBack, blinkAt } from '../timeline.mjs';
import { gridAt, SPOT } from './s3.mjs';
import { sky, camera, wipe } from './common.mjs';

const n2 = (v) => +v.toFixed(2);

// 주인공 손짓 시간표 — [시작, 끝, 앞 자세, 뒤 자세]
const GESTURES = [[24.0, 24.4, 'rest', 'open'], [25.5, 25.85, 'open', 'point'], [26.9, 27.3, 'point', 'open']];
export function gestureAt(t) {
  let g = { from: 'rest', to: 'rest', k: 1 };
  for (const [a, b, from, to] of GESTURES) {
    if (t >= a) g = { from, to, k: Math.min(1.08, easeOutBack(prog(t, a, b))) };
  }
  return g;
}
const taps = (t, ts) => ts.reduce((s, tc) => s + Math.sin(Math.PI * prog(t, tc, tc + 0.22)), 0);

// ④ · ⑤가 같이 쓰는 방 구도. behindLaptop = 노트북 화면 뒤에 그릴 것(⑤의 플로로)
export function composition4(t, { behindLaptop = '', over = '', bubbleFade = 1 } = {}) {
  const talking = t >= 24.2 && t < 29.6 && !(t > 26.6 && t < 27.6);
  const talk = talking && Math.sin(t * 15) > 0 ? 1 : 0;
  const userNod = talking ? 0.22 * Math.max(0, Math.sin(t * 4.6)) : 0;
  const evalNod = Math.sin(Math.PI * prog(t, 26.85, 27.35)) + 0.5 * Math.sin(Math.PI * prog(t, 27.4, 27.8));
  const listen = -3.5 * easeInOutCubic(prog(t, 24.4, 25.4)) * (1 - prog(t, 26.7, 27.0));
  const checks = t >= 28.1 ? 3 : t >= 27.6 ? 2 : t >= 27.1 ? 1 : 0;
  const codeK = pop(t, 24.3, 0.4), checkK = pop(t, 27.1, 0.35);
  const floatY = Math.sin(t * 2.2) * 1.2;
  const g = gestureAt(t);
  return `${sky()}
    <ellipse cx="142" cy="151.5" rx="22" ry="3" fill="#5FA6D8" opacity=".3"/><ellipse cx="235" cy="151.5" rx="22" ry="3" fill="#5FA6D8" opacity=".3"/>
    ${behindLaptop}
    ${laptopTable4({ inner: '', innerOpacity: 0 })}
    ${standingUser({ gesture: g, talk, nod: userNod, blink: blinkAt(t, 3.3, 0.4), sway: 0.8 * Math.sin(t * 1.7), breathe: Math.sin(t * 2.2) })}
    ${evaluator({ nod: evalNod, checks, tilt: listen, blink: blinkAt(t, 2.9, 1.1), sway: 0.6 * Math.sin(t * 1.5 + 1), breathe: Math.sin(t * 2 + 0.7), tap: taps(t, [27.1, 27.6, 28.1]) })}
    ${bubbleFade > 0 ? `<g opacity="${n2(bubbleFade)}">${codeK > 0 ? codeBubble(178, 28 + floatY, codeK) : ''}${checkK > 0 ? checkBubble(212, 30 - floatY * 0.6, checkK) : ''}</g>` : ''}
    ${over}`;
}

const END = { cx: 150, cy: 92, scale: 1.16 }; // 두 사람이 화면을 넉넉히 채우게
export function cam4(t) {
  const k = prog(t, 23, 30);
  return { cx: END.cx, cy: lerp(END.cy, END.cy - 2, k), scale: lerp(END.scale, END.scale * 1.03, k) };
}

export function draw(t) {
  const scene = camera(composition4(t), cam4(t));
  const r = 400 * easeInOutCubic(prog(t, 23.0, 23.65));
  if (r >= 395) return scene;
  return `${gridAt(23.0)}${wipe(scene, { cx: SPOT[4].x, cy: SPOT[4].y - 6, r })}`;
}
