// ② 만남 (5–11초): 노트북 화면이 물웅덩이처럼 일렁이고 플로로가 솟아오른다 → 눈이 마주침 → 화면 속으로 다시 쏙 → 카메라가 화면으로 다가감
import { spark, bubbles } from '../art/props.mjs';
import { POSE_ARMS, lerpArms } from '../art/people.mjs';
import { floro } from '../floro.mjs';
import { pop, prog, lerp, easeInOutCubic, easeOutBack, clamp } from '../timeline.mjs';
import { room } from './s1.mjs';
import { camera } from './common.mjs';

const n2 = (v) => +v.toFixed(2);
const SCREEN_BOTTOM = 151; // 플로로 몸 아래를 자르는 선 — 화면 속에 잠긴 것처럼
const FX = 135;

function floroY(t) {
  if (t < 5.6) return null;
  if (t < 6.2) return lerp(178, 150, easeOutBack(prog(t, 5.6, 6.2)));
  if (t < 9.45) return 150 + Math.sin((t - 6.2) * 2.4) * 0.8;
  if (t < 9.6) return 150 - 3 * Math.sin(Math.PI * prog(t, 9.45, 9.6)); // 들어가기 전 살짝 솟음(예비 동작)
  if (t < 10.4) return lerp(150, 184, prog(t, 9.6, 10.4) ** 2);
  return null;
}

function floroArt(t) {
  const y = floroY(t);
  if (y == null) return '';
  const mood = t < 8.0 ? 'wow' : 'happy';
  const rot = t >= 9.1 && t < 9.6 ? -12 * Math.sin(Math.PI * prog(t, 9.1, 9.6)) : 6;
  const squash = t >= 6.2 && t < 6.45 ? Math.sin(Math.PI * prog(t, 6.2, 6.45)) * 0.1 : 0;
  const bub = t < 7.2 ? bubbles([[FX - 14, 140 - (t - 5.6) * 18, 1.6, 1 - prog(t, 6.6, 7.2)], [FX + 16, 146 - (t - 5.6) * 14, 1.2, 1 - prog(t, 6.6, 7.2)], [FX + 4, 136 - (t - 5.6) * 22, 1.3, 1 - prog(t, 6.6, 7.2)]]) : '';
  const splash = t >= 9.9 && t < 10.8 ? bubbles([[FX - 10, 140 - (t - 9.9) * 14, 1.4, 1 - prog(t, 10.2, 10.8)], [FX + 12, 144 - (t - 9.9) * 18, 1.1, 1 - prog(t, 10.2, 10.8)]]) : '';
  return `${floro(mood, { x: FX, y, size: 54, rot, sx: 1 + squash, sy: 1 - squash, clipY: SCREEN_BOTTOM })}${bub}${splash}`;
}

function eyeContact(t) {
  const k = pop(t, 8.0, 0.35), fade = 1 - prog(t, 8.9, 9.4);
  if (k <= 0 || fade <= 0) return '';
  return `<g opacity="${n2(fade)}"><path d="M228 72 Q190 82 142 116" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-dasharray="2 3" opacity="${n2(clamp(k, 0, 1))}"/>
    ${spark(186, 88, 7 * k)}${spark(176, 80, 3.5 * k)}</g>`;
}

// ② 사람: 6.15–6.45초에 머리에서 손을 내리며 고개를 돌림(중간 동작 + 살짝 넘침)
function person2(t) {
  const k = easeOutBack(prog(t, 6.15, 6.45));
  const lowered = t >= 6.3;
  const lean = t >= 6.15 && t < 7.2 ? -3 * Math.sin(Math.PI * prog(t, 6.15, 7.2)) : 0;
  return {
    pose: lowered ? 'lower' : 'headgrab',
    arms: lerpArms(POSE_ARMS.headgrab, POSE_ARMS.lower, k),
    turn: lerp(0.35, 1, Math.min(1, k)),
    face: t < 6.3 ? 'grit' : t < 8.15 ? 'surprised' : 'smile',
    headRot: lean + (t > 8.15 ? 1.2 * Math.sin((t - 8.15) * 2) : 0),
  };
}

export function composition(t) {
  const glow = prog(t, 5.0, 5.6);
  const errors = t < 8.2 ? 1 : 1 - prog(t, 8.2, 9.0);
  const jolt = -2 * Math.sin(Math.PI * prog(t, 6.1, 6.45));
  return room({ t, errors, laptop: { screen: 'glow', glow, ripple: (t * 0.7) % 1 }, person: person2(t), over: `${floroArt(t)}${eyeContact(t)}`, bob: jolt });
}

// 카메라: ①의 끝(182, 96, 1.06)에서 이어서 노트북 쪽으로 천천히 → 10.4초부터 화면으로 성큼
export const cam2 = (t) => {
  const k = easeInOutCubic(prog(t, 5, 10.4));
  const base = { cx: lerp(182, 160, k), cy: lerp(96, 112, k), scale: lerp(1.06, 1.22, k) };
  const p = prog(t, 10.4, 11.0) ** 2;
  return { cx: lerp(base.cx, 135, p), cy: lerp(base.cy, 131, p), scale: lerp(base.scale, 1.7, p) };
};

export const draw = (t) => camera(composition(t), cam2(t));
