// ① 막막함 (0–5초): 흰 화면에서 밝아지며 턱을 괴고 보는 사람(1a) → 오류가 쏟아지면 팔이 중간 동작을 거쳐 머리로(1b)
import { C } from '../art/palette.mjs';
import { seatedBack, POSE_ARMS, lerpArms } from '../art/people.mjs';
import { windows, laptopSide, desk1 } from '../art/props.mjs';
import { pop, prog, lerp, easeInOutCubic, easeOutBack, easeOutCubic } from '../timeline.mjs';
import { sky, camera, fadeVeil } from './common.mjs';

const n2 = (v) => +v.toFixed(2);

// ①·②가 같이 쓰는 방 구도. person = seatedBack에 넘길 값
export function room({ t, errors = 0, laptop = {}, person = {}, over = '', bob = 0 }) {
  const breathe = 1 + 0.007 * Math.sin((t * 2 * Math.PI) / 3.2);
  return `${sky()}
    ${windows({ errors })}
    ${laptopSide({ errors, ...laptop })}
    ${desk1({ t })}
    <g transform="translate(0 ${n2(bob)}) translate(250 182) scale(1 ${n2(breathe)}) translate(-250 -182)">${seatedBack(person)}</g>
    ${over}`;
}

function stress(t) {
  const k = prog(t, 2.45, 2.75);
  if (k <= 0) return '';
  const w = Math.sin(t * 14) * 1.2;
  const drop = ((t - 2.6) % 1.6) / 1.6;
  return `<g opacity="${n2(k)}">
    <path transform="translate(${n2(w)} 0)" d="M232 38 q4 -6 8 0 t8 0 t8 0" fill="none" stroke="${C.navy}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M220 44 l-5 -5 M270 42 l5 -5 M245 32 v-5" stroke="${C.navy}" stroke-width="1.4" stroke-linecap="round" opacity="${n2(0.6 + 0.4 * Math.sin(t * 9))}"/>
    ${t >= 2.6 ? `<path transform="translate(${n2(lerp(0, 3, drop))} ${n2(lerp(0, 14, drop))})" d="M273 66 q-3 5 0 7 q3 -2 0 -7 Z" fill="#7FC4F0" opacity="${n2(1 - drop)}"/>` : ''}
  </g>`;
}

// ① 사람의 자세 — 2.12–2.42초에 턱 괴기 → 머리 감싸기 (살짝 넘쳤다 돌아옴)
export function person1(t) {
  const k = easeOutBack(prog(t, 2.12, 2.42));
  const grab = t >= 2.27;
  const shake = t > 2.45 ? 2.6 * Math.sin(t * 13) * Math.exp(-(t - 2.45) * 0.7) : 0;
  return {
    pose: grab ? 'headgrab' : 'chin',
    arms: lerpArms(POSE_ARMS.chin, POSE_ARMS.headgrab, k),
    turn: lerp(0.6, 0.35, Math.min(1, k)),
    face: grab ? 'grit' : 'think',
    headRot: grab ? shake : 1.6 * Math.sin(t * 1.3),
  };
}

export function draw(t) {
  const errors = pop(t, 1.9, 0.35);
  const jolt = -2.2 * Math.sin(Math.PI * prog(t, 2.15, 2.5));
  const scene = room({ t, errors, laptop: { screen: errors > 0 ? 'error' : 'plain' }, person: person1(t), over: stress(t), bob: jolt });
  const k = easeInOutCubic(t / 5);
  return `${camera(scene, { cx: lerp(160, 182, k), cy: lerp(90, 96, k), scale: lerp(1, 1.06, k) })}${fadeVeil(1 - easeOutCubic(prog(t, 0, 0.6)))}`;
}
