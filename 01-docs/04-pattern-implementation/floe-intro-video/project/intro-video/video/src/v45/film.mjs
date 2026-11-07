// 45초 판 — 움직이는 영상. renderFrame45(t)가 시간 t(초)의 화면 한 장을 SVG 문자열로 돌려준다(40초 판의 renderFrame과 같은 방식).
// claude-drafted: 2026-11-06 — 두승현 요청("이 스토리보드로 45초짜리 소개 영상"). 장면 · 자막 · 화면 글은 스토리보드(stills.mjs, keyframes/v45) 그대로.
// 시간표: ① 0~4 평가자 앞에서 막힘 · ② 4~8 AI가 코드를 쏟아 냄 · ③ 8~12 플로로를 만남 · ④ 12~21 한 단계씩
//         ⑤ 21~26 점점 빠르게 · ⑥ 26~32 다음 프로젝트 · ⑦ 32~39 다시 평가자 앞 · ⑧ 39~45 Floe
import { C } from '../art/palette.mjs';
import { figure, USER_PAL, FRONT_ARM, seatedBack, evaluator, POSE_ARMS, lerpArms } from '../art/people.mjs';
import { spark, laptopSide, desk1, laptopTable4, heart, mark, bubbles } from '../art/props.mjs';
import { floro } from '../floro.mjs';
import { sky, camera, wipe, toScreen, fadeVeil } from '../scenes/common.mjs';
import { clamp, lerp, prog, pop, easeOutCubic as oc, easeInOutCubic as io, easeOutBack as ob, blinkAt, hop } from '../timeline.mjs';
import { CAPTIONS, END_LINE, tx, HEAD, GOLD, FEET, MID, sign, ARM, qmark, cardBox, btn, miniCard, codeGlyph } from './stills.mjs';

export const DURATION45 = 45;
export const FPS45 = 30;
export const frameTimes45 = () => Array.from({ length: DURATION45 * FPS45 }, (_, i) => i / FPS45);

// ── 도우미 ──────────────────────────────────────────────
const n2 = (v) => +v.toFixed(2);
let uidN = 0;
const uid = (p) => `${p}${++uidN}`;
// (cx, cy)를 가운데로 s배 · r도
const at = (svg, cx, cy, s, r = 0) => (!svg ? '' : s === 1 && !r ? svg
  : `<g transform="translate(${n2(cx)} ${n2(cy)})${r ? ` rotate(${n2(r)})` : ''} scale(${n2(Math.max(0, s))}) translate(${n2(-cx)} ${n2(-cy)})">${svg}</g>`);
const fade = (svg, o) => (!svg || o <= 0.004 ? '' : o >= 0.996 ? svg : `<g opacity="${n2(o)}">${svg}</g>`);
const move = (svg, dx, dy = 0) => (!svg ? '' : `<g transform="translate(${n2(dx)} ${n2(dy)})">${svg}</g>`);
const armMix = (a, b, k) => ({ pts: a.pts.map((p, i) => [lerp(p[0], b.pts[i][0], k), lerp(p[1], b.pts[i][1], k)]), kind: k < 0.5 ? a.kind : b.kind, rot: lerp(a.rot, b.rot, k) });
const bez = (a, c, b, p) => [(1 - p) ** 2 * a[0] + 2 * (1 - p) * p * c[0] + p * p * b[0], (1 - p) ** 2 * a[1] + 2 * (1 - p) * p * c[1] + p * p * b[1]];
const taps = (t, ts) => ts.reduce((s, tc) => s + Math.sin(Math.PI * prog(t, tc, tc + 0.22)), 0);
const pulse = (t, a, d = 0.3, amp = 0.15) => 1 + amp * Math.sin(Math.PI * prog(t, a, a + d)); // a초에 잠깐 커졌다 돌아옴
const shadow = (x, rx, o = 0.28) => `<ellipse cx="${n2(x)}" cy="${FEET + 0.8}" rx="${n2(rx)}" ry="2.2" fill="#5FA6D8" opacity="${n2(o)}"/>`;
// 서 있는 주인공 — (x, y)에 발, s배
const actor = (opts, { x, s = 1, y = FEET }) => `${shadow(x, (15 + 7 * Math.abs(opts.stride || 0)) * s)}
  <g data-person="user" transform="translate(${n2(x)} ${n2(y)}) scale(${n2(s)}) translate(-142 -150.6)">${figure({ pal: USER_PAL, ...opts })}</g>`;
const WALK_F = ARM.swing; // 걸을 때 앞으로 흔든 팔
const WALK_B = { pts: [[152, 71.6], [150.4, 86.6], [146, 98]], kind: 'mitt', rot: 0 }; // 뒤로 흔든 팔

// ── ① · ⑦ 평가자 앞 (같은 자리 · 같은 구도) ───────────────────────
const evalCam = (k) => ({ cx: 150, cy: 88, scale: lerp(1.12, 1.2, k) });
const evalRoom = ({ user, judge, behind = '', over = '', k = 0.5 }) => camera(`${sky()}
  <ellipse cx="142" cy="151.5" rx="22" ry="3" fill="#5FA6D8" opacity=".3"/><ellipse cx="235" cy="151.5" rx="22" ry="3" fill="#5FA6D8" opacity=".3"/>
  ${behind}${laptopTable4({ inner: '', innerOpacity: 0 })}
  <g data-person="user">${figure({ pal: USER_PAL, ...user })}</g>${evaluator(judge)}${over}`, evalCam(k));
// 평가자의 질문 말풍선: </> ?
const askBubble = (k, q = 1) => at(`<path d="M213 35.4 L221 35.8 L221.6 42 Z" fill="#FFFFFF"/><rect x="177" y="15" width="48" height="21.6" rx="10.8" fill="#FFFFFF"/>
  ${codeGlyph(194.5, 25.8, 0.8)}${at(tx(216, 30.6, 13, C.f1, '?', 'middle', HEAD), 216, 26, q)}`, 221.6, 42, k);

function scene1(t) {
  const tilt = 7 * io(prog(t, 1.2, 2.2)) + 0.5 * Math.sin(t * 11) * prog(t, 2.2, 2.6); // 고개를 떨군다
  const dots = [0, 1, 2].map((i) => {
    const a = 1.45 + i * 0.25;
    return t < a ? '' : `<circle cx="${157.4 + i * 5.4}" cy="${n2(30.3 - 1.1 * Math.max(0, Math.sin((t - a) * 5.2 - i * 0.8)))}" r="1.5" fill="${C.navy}" opacity=".55"/>`;
  }).join('');
  const dotsBubble = at(`<path d="M157 36 L163 36.4 L155 41.6 Z" fill="#FFFFFF"/><rect x="152" y="23.6" width="21.6" height="13.4" rx="6.7" fill="#FFFFFF"/>${dots}`, 155, 41.6, pop(t, 1.3, 0.3));
  const drop = (a) => {
    const k = prog(t, a, a + 1.3);
    return k <= 0 || k >= 1 ? '' : `<path transform="translate(0 ${n2(7 * k)})" d="M131.4 41 q-2.6 4.4 0 6.4 q2.6 -2 0 -6.4 Z" fill="#7FC4F0" opacity="${n2(Math.min(1, k * 8) * (1 - k ** 3))}"/>`;
  };
  return evalRoom({
    user: { front: FRONT_ARM.rest, smile: false, flat: true, tilt, blink: blinkAt(t, 2.7, 0.9), sway: 0.5 * Math.sin(t * 1.6), breathe: Math.sin(t * 2.2) },
    judge: { checks: 0, tilt: -3.5 * io(prog(t, 0.2, 0.9)), blink: blinkAt(t, 3.1, 1.4), sway: 0.5 * Math.sin(t * 1.4 + 1), breathe: Math.sin(t * 2 + 0.7), tap: taps(t, [2.7, 3.05, 3.4]) },
    over: `${askBubble(pop(t, 0.5, 0.35), pulse(t, 2.5, 0.4, 0.22) * pulse(t, 3.3, 0.4, 0.22))}${dotsBubble}${drop(2.0)}${drop(3.1)}`,
    k: 0.5 * io(prog(t, 0, 4.2)),
  });
}

// ── ② · ③ 책상: AI가 코드를 쏟아 내고 → 플로로가 나온다 ────────────────────
const ROWH = 5.3;
const rowSpec = (i) => [[0, 5, 10, 15, 10, 5, 0][i % 7], 22 + ((i * 37 + 11) % 41), i % 6 === 1 ? C.f1 : i % 6 === 4 ? C.f2 : C.code];
// 줄이 나타나는 때 — 갈수록 빨라진다(쏟아지는 느낌)
const rowTimes = (t0, n) => { const a = []; let t = t0; for (let i = 0; i < n; i++) { a.push(t); t += Math.max(0.045, 0.13 - 0.004 * i); } return a; };
const T_FRONT = rowTimes(4.8, 70), T_BACK = rowTimes(5.3, 70);
const FREEZE = 8.3; // 플로로가 나오면 코드가 멈춘다
function codeScroll(t, times, { x, y, cap, clip, ws = 1, seed = 0 }) {
  const tt = Math.min(t, FREEZE);
  let n = 0;
  while (n < times.length && times[n] <= tt) n++;
  if (n === 0) return '';
  const frac = n < times.length ? clamp((tt - times[n - 1]) / (times[n] - times[n - 1]), 0, 1) : 1;
  const s = Math.max(0, n - 1 + frac - cap); // 위로 밀려 올라간 줄 수
  const grow = clamp((tt - times[n - 1]) / 0.1, 0, 1);
  let rows = '';
  for (let i = Math.max(0, Math.floor(s) - 1); i < n; i++) {
    const [ind, w, col] = rowSpec(i + seed);
    rows += `<rect x="${n2(x + ind * ws)}" y="${n2(y + (i - s) * ROWH)}" width="${n2(w * ws * (i === n - 1 ? grow : 1))}" height="2.4" rx="1.2" fill="${col}"/>`;
  }
  const [ind, w] = rowSpec(n - 1 + seed);
  const cursor = t < FREEZE && Math.sin(t * 12) > -0.3 ? `<rect x="${n2(x + (ind + w * grow) * ws + 1.2)}" y="${n2(y + (n - 1 - s) * ROWH - 0.8)}" width="1.6" height="4" fill="${C.f1}"/>` : '';
  const id = uid('cw');
  return `<clipPath id="${id}"><rect x="${clip[0]}" y="${clip[1]}" width="${clip[2]}" height="${clip[3]}"/></clipPath><g clip-path="url(#${id})">${rows}${cursor}</g>`;
}
const aiWindows = (t) => `<rect x="122" y="22" width="80" height="70" rx="4" fill="${C.winBack}" stroke="${C.navy}" stroke-width="1.2"/>
  ${[[0, 40], [4, 56]].map(([ind, w], i) => `<rect x="${130 + ind}" y="${29 + i * ROWH}" width="${n2(w * oc(prog(t, 5.1 + i * 0.12, 5.3 + i * 0.12)))}" height="2.4" rx="1.2" fill="${i ? C.f1 : C.code}"/>`).join('')}
  ${codeScroll(t, T_BACK, { x: 162, y: 46, cap: 8, clip: [159.4, 43.4, 41.4, 46.4], ws: 0.56, seed: 23 })}
  <rect x="70" y="42" width="88" height="76" rx="4" fill="${C.win}" stroke="${C.navy}" stroke-width="1.2"/>
  <rect x="77" y="47.4" width="17" height="9" rx="4.5" fill="#E3ECFF"/>${tx(85.5, 54.2, 5.6, C.f1, 'AI', 'middle', HEAD)}
  ${codeScroll(t, T_FRONT, { x: 78, y: 62, cap: 10, clip: [72, 59.6, 84, 56.6] })}`;

function camDesk(t) {
  const k1 = io(prog(t, 4.0, 8.0)), k2 = io(prog(t, 8.0, 9.6)); // 물음표가 화면 위로 잘리지 않게, 플로로가 나온 뒤에 다가간다
  const base = { cx: lerp(lerp(172, 170, k1), 166, k2), cy: lerp(lerp(95, 98, k1), 108, k2), scale: lerp(lerp(1.05, 1.08, k1), 1.18, k2) };
  const p = prog(t, 11.0, 11.8) ** 2; // 플로로를 따라 노트북 화면 속으로
  return { cx: lerp(base.cx, 135, p), cy: lerp(base.cy, 131, p), scale: lerp(base.scale, 1.75, p) };
}

function floroDesk(t) {
  if (t < 8.3 || t >= 11.2) return '';
  let y;
  if (t < 8.9) y = lerp(178, 150, ob(prog(t, 8.3, 8.9)));
  else if (t < 10.35) y = 150 + Math.sin((t - 8.9) * 2.4) * 0.8;
  else if (t < 10.5) y = 150 - 3 * Math.sin(Math.PI * prog(t, 10.35, 10.5)); // 들어가기 전 살짝 솟음
  else y = lerp(150, 184, prog(t, 10.5, 11.2) ** 2);
  const mood = t < 9.6 ? 'wow' : 'happy';
  const rot = t >= 10.0 && t < 10.5 ? 6 - 14 * Math.sin(Math.PI * prog(t, 10.0, 10.5)) : 6;
  const sq = t >= 8.9 && t < 9.15 ? Math.sin(Math.PI * prog(t, 8.9, 9.15)) * 0.1 : 0;
  const up = t < 9.9 ? bubbles([[121, 140 - (t - 8.3) * 18, 1.6, 1 - prog(t, 9.3, 9.9)], [151, 146 - (t - 8.3) * 14, 1.2, 1 - prog(t, 9.3, 9.9)], [139, 136 - (t - 8.3) * 22, 1.3, 1 - prog(t, 9.3, 9.9)]]) : '';
  const down = t >= 10.7 ? bubbles([[125, 140 - (t - 10.7) * 14, 1.4, 1 - prog(t, 11.0, 11.2)], [147, 144 - (t - 10.7) * 18, 1.1, 1 - prog(t, 11.0, 11.2)]]) : '';
  return `${floro(mood, { x: 135, y, size: 54, rot, sx: 1 + sq, sy: 1 - sq, clipY: 151 })}${up}${down}`;
}

function desk(t) {
  const kLower = ob(prog(t, 8.55, 8.95)); // 턱 괸 손을 내리며 돌아본다
  const person = {
    pose: kLower > 0.5 ? 'lower' : 'chin',
    arms: lerpArms(POSE_ARMS.chin, POSE_ARMS.lower, kLower),
    turn: lerp(0.6, 1, io(prog(t, 8.55, 9.0))),
    face: t < 8.7 ? 'think' : t < 9.7 ? 'surprised' : 'smile',
    headRot: t < 8.55 ? 1.6 * Math.sin(t * 1.3) + 2.5 * io(prog(t, 6.6, 7.6)) : 2.5 * (1 - prog(t, 8.55, 8.8)) + (t > 9.7 ? 1.2 * Math.sin((t - 9.7) * 2) : 0),
  };
  const bob = -2 * Math.sin(Math.PI * prog(t, 8.5, 8.85)), breathe = 1 + 0.007 * Math.sin((t * 2 * Math.PI) / 3.2);
  const ask = fade(at(`<path d="M202 98 L213 90 L206 102 Z" fill="${C.sweater}"/><rect x="160" y="96" width="47" height="14.4" rx="7.2" fill="${C.sweater}"/>${tx(183.5, 105.6, 6.6, '#FFFFFF', '앱 만들어 줘')}`, 213, 90, pop(t, 4.35, 0.3)), 1 - prog(t, 8.4, 8.8));
  const qs = [[266, 45, 14, 1, 5.9], [278, 32, 9.6, 0.7, 6.6], [255, 32, 7.6, 0.5, 7.2]].map(([x, y, size, o, a], i) =>
    at(qmark(x, y, size, o), x, y - size * 0.3, pop(t, a, 0.3) * (1 - prog(t, 8.5, 8.8)), 7 * Math.sin(t * 3 + i * 2))).join('');
  const k = pop(t, 9.6, 0.35), eyeFade = 1 - prog(t, 10.3, 10.7);
  const eye = k > 0 && eyeFade > 0 ? fade(`<path d="M228 72 Q190 82 142 116" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-dasharray="2 3" opacity="${n2(clamp(k, 0, 1))}"/>${spark(186, 88, 7 * k)}${spark(176, 80, 3.5 * k)}`, eyeFade) : '';
  const laptop = t < 7.7 ? { screen: 'plain' } : { screen: 'glow', glow: prog(t, 7.7, 8.3), ripple: (t * 0.7) % 1 };
  return camera(`${sky()}${fade(aiWindows(t), lerp(1, 0.62, prog(t, 8.6, 9.2)))}${laptopSide(laptop)}${desk1({ t })}
    <g transform="translate(0 ${n2(bob)}) translate(250 182) scale(1 ${n2(breathe)}) translate(-250 -182)">${seatedBack(person)}</g>
    ${floroDesk(t)}${eye}${ask}${qs}`, camDesk(t));
}

// ── ④ 한 단계씩 (12~21초) ────────────────────────────────────
// 자막 띠가 아래를 덮으므로 그림은 위쪽 152칸 안에 그린다
function road(offset = 0) {
  let dash = '';
  const o = ((offset % 16) + 16) % 16;
  for (let x = 2 - o; x < 324; x += 16) dash += `<rect x="${n2(x)}" y="137.2" width="7" height="1.6" rx=".8" fill="#CFE3F5"/>`;
  return `<rect x="-10" y="141.6" width="340" height="4.4" fill="#9CCBEB" opacity=".55"/><rect x="-10" y="132" width="340" height="12" fill="#FFFFFF" opacity=".95"/>${dash}`;
}

// 넓게: 팻말 여덟 개가 차례로 서고, 플로로가 첫 팻말에 올라 "다음은 여기!"
const WX = (n) => 64 + 32.4 * (n - 1);
function wide(t) {
  let signs = '';
  for (let n = 8; n >= 1; n--) {
    const k = pop(t, 11.3 + 0.07 * n, 0.3);
    if (k <= 0) continue;
    const lit = n === 1 && t >= 12.75;
    signs += at(sign(n, { x: n2(WX(n)), cy: n % 2 ? 58 : 86, state: lit ? 'now' : 'next', flag: n === 8 }), WX(n), 132, k * (lit ? pulse(t, 12.75, 0.3, 0.12) : 1) * pulse(t, 13.35 + 0.07 * n, 0.26, 0.1));
  }
  let fl = '';
  if (t >= 11.85 && t < 12.2) fl = at(`${shadow(44, 10)}${floro('happy', { x: 44, y: FEET, size: 30 })}`, 44, FEET, pop(t, 11.85, 0.3));
  else if (t >= 12.2 && t < 12.8) { const h = hop(t, 12.2, 12.65, { x: 44, y: FEET }, { x: 64, y: 49.6 }, 24); fl = floro('happy', { x: h.x, y: h.y, size: 30, sx: h.sx, sy: h.sy }); }
  else if (t >= 12.8) fl = floro('happy', { x: 64, y: 49.6 + 0.5 * Math.sin((t - 12.8) * 3), size: 30 });
  const say = at(`<path d="M89 26 L81 33.4 L97 28 Z" fill="#FFFFFF"/><rect x="85" y="11.6" width="53" height="17.4" rx="8.7" fill="#FFFFFF"/>${tx(111.5, 23, 7.2, C.ink, '다음은 여기!')}`, 81, 33.4, pop(t, 12.85, 0.3));
  // 주인공이 걸어 들어온다 — 물음표는 길 안내가 나오면 사라진다
  const px = lerp(-14, 23, oc(prog(t, 11.5, 12.6)));
  const walk = Math.sin(px * 0.55) * (1 - prog(t, 12.3, 12.6));
  const glad = t >= 13.2, q = 1 - prog(t, 13.0, 13.25);
  const who = actor({ front: armMix(WALK_B, WALK_F, 0.5 - 0.5 * walk), stride: walk, smile: glad, flat: !glad, blink: blinkAt(t, 2.9, 0.6), sway: 2 * (1 - prog(t, 12.3, 12.6)), tilt: -5 * io(prog(t, 13.2, 13.6)) },
    { x: px, s: 0.74, y: FEET - 0.6 * Math.abs(walk) });
  return `${sky()}${road()}${signs}${fl}${say}${who}${at(qmark(px + 14.6, 49, 12), px + 14.6, 46, q)}${at(qmark(px + 21.6, 41.6, 7.6, 0.55), px + 21.6, 40, q)}`;
}

// AI가 쓴 초안 카드(126 × 72). press 0 → 1: '맞아요'를 누른 직후 퍼지는 고리
function draftCard(x, y, { line = 1, b1 = 1, b2 = 1, pressed = false, press = 1 } = {}) {
  const ring = pressed && press < 1 ? `<circle cx="${x + 20}" cy="${y + 59}" r="${n2(4 + 13 * press)}" fill="none" stroke="#0E9384" stroke-width="1.3" opacity="${n2(1 - press)}"/>` : '';
  return `<path d="M${x + 124} ${y + 42} L${x + 124} ${y + 56} L${x + 143} ${y + 72} Z" fill="#FFFFFF"/>${cardBox(x, y, 126, 72, C.f2)}
    <rect x="${x + 8}" y="${y + 9.4}" width="54" height="12.4" rx="6.2" fill="#DDF5F1"/>${tx(x + 35, y + 18, 6.8, '#0B7F72', 'AI가 쓴 초안')}
    ${fade(tx(x + 9, y + 34, 6.8, C.ink, '만들 것: 동아리 행사 등록 앱', 'start'), line)}
    <rect x="${x + 9}" y="${y + 39}" width="${n2(92 * b1)}" height="2.8" rx="1.4" fill="#C9D8F0"/><rect x="${x + 9}" y="${y + 44.6}" width="${n2(66 * b2)}" height="2.8" rx="1.4" fill="#DDE7F5"/>
    ${pressed ? btn(x + 8, y + 52, 56, 14, '맞아요', { fill: '#0E9384', color: '#FFFFFF', check: true, shift: 2.6 }) : btn(x + 8, y + 52, 56, 14, '맞아요', { fill: C.f2, color: '#FFFFFF' })}
    ${btn(x + 69, y + 52, 49, 14, '고칠래요', { stroke: C.f2, color: '#0F8C7E' })}${ring}`;
}
// 넘어가기 전 확인(90 × 40)
function askCard(x, y, { pressed = false, press = 1 } = {}) {
  const ring = pressed && press < 1 ? `<circle cx="${x + 24}" cy="${y + 29.6}" r="${n2(4 + 13 * press)}" fill="none" stroke="#D98C0E" stroke-width="1.3" opacity="${n2(1 - press)}"/>` : '';
  return `<path d="M${x + 56} ${y + 39} L${x + 69} ${y + 39} L${x + 67} ${y + 51} Z" fill="#FFFFFF"/>${cardBox(x, y, 90, 40, C.f3)}${tx(x + 9, y + 18.4, 7.6, C.ink, '이해하셨나요?', 'start')}
    ${pressed ? btn(x + 8, y + 23.6, 32, 12, '예', { fill: '#D98C0E', color: '#FFFFFF', check: true }) : btn(x + 8, y + 23.6, 32, 12, '예', { fill: C.f3, color: '#FFFFFF' })}
    ${btn(x + 45, y + 23.6, 36, 12, '아니요', { stroke: C.f3, color: '#B7791F' })}${ring}`;
}
// 배운 것 한 줄 — r1 · r2: 두 줄이 왼쪽부터 써지는 정도
function learnCard(x, y, { r1 = 1, r2 = 1, rot = -3 } = {}) {
  const w = 92, h = 52;
  const line = (text, i, r) => {
    if (r <= 0) return '';
    const id = uid('lw');
    return `<clipPath id="${id}"><rect x="${x + 6}" y="${n2(y + 23.6 + i * 11.6)}" width="${n2((w - 12) * r)}" height="12.6"/></clipPath><g clip-path="url(#${id})">${tx(x + w / 2, y + 33.4 + i * 11.6, 9, C.ink, text)}</g>`;
  };
  return `<g transform="rotate(${n2(rot)} ${x + w / 2} ${y + h / 2})">
    <rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="5" fill="#C99A2E" opacity=".25"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${GOLD.fill}" stroke="${GOLD.line}" stroke-width="1.2"/>
    ${spark(x + 11.5, y + 11.6, 5.6)}${tx(x + 19.6, y + 14.2, 6.8, GOLD.ink, '배운 것 한 줄', 'start')}
    <path d="M${x + 8} ${y + 20.4} H${x + w - 8}" stroke="${GOLD.line}" stroke-width=".8" stroke-dasharray="2 2"/>
    ${line('다음엔 예시로', 0, r1)}${line('먼저 써 보기', 1, r2)}</g>`;
}
const ARROW = `<path d="M200 64 C196 72 190 76 184 78" fill="none" stroke="${GOLD.line}" stroke-width="1.3" stroke-dasharray="2.6 3" stroke-linecap="round"/>
  <path d="M188.6 73.6 L183.2 78.4 L190.2 79.4" fill="none" stroke="${GOLD.line}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;

// 가까이: 첫 단계에서 일어나는 일 — 초안 확인 → 이해 확인 → 배운 것 한 줄
function close(t) {
  let arm = ARM.rest;
  if (t >= 15.8 && t < 17.2) arm = armMix(ARM.rest, ARM.press, t < 16.85 ? ob(prog(t, 15.8, 16.15)) : 1 - io(prog(t, 16.85, 17.2)));
  if (t >= 18.8) arm = armMix(ARM.rest, ARM.point, t < 20.5 ? ob(prog(t, 18.8, 19.15)) : 1 - io(prog(t, 20.5, 20.85)));
  const nod = 0.5 * Math.sin(Math.PI * prog(t, 15.2, 15.7)) + Math.sin(Math.PI * prog(t, 18.05, 18.45)) + 0.6 * Math.sin(Math.PI * prog(t, 19.75, 20.15));
  const talk = (t >= 18.15 && t < 18.35) || (t >= 18.9 && t < 20.3 && Math.sin(t * 15) > 0) ? 1 : 0;
  const who = actor({ front: arm, nod, talk, blink: blinkAt(t, 3.1, 0.5), sway: 0.5 * Math.sin(t * 1.5), breathe: Math.sin(t * 2.1) }, { x: 60 });
  const fh = 5 * Math.sin(Math.PI * prog(t, 16.35, 16.7)) + 5 * Math.sin(Math.PI * prog(t, 18.7, 19.05)) + 7 * Math.sin(Math.PI * prog(t, 19.65, 20.0));
  const fl = `${shadow(252, 15)}${floro(t >= 17.45 && t < 18.2 ? 'think' : 'happy', { x: 252, y: FEET - fh + 0.4 * Math.sin(t * 2.6), size: 45, flip: true, blink: blinkAt(t, 2.4, 0.2) })}`;
  let draft = '';
  if (t >= 14.6 && t < 17.4) {
    const out = prog(t, 17.05, 17.4);
    draft = fade(move(at(draftCard(94, 18, { line: prog(t, 14.9, 15.15), b1: oc(prog(t, 15.05, 15.35)), b2: oc(prog(t, 15.25, 15.55)), pressed: t >= 16.25, press: prog(t, 16.25, 16.65) }), 237, 90, pop(t, 14.6, 0.35)), 0, -14 * io(out)), 1 - out);
  }
  const gone = 1 - prog(t, 20.15, 20.4);
  const ask = t >= 17.45 && t < 20.4 ? fade(at(askCard(176, 20, { pressed: t >= 18.2, press: prog(t, 18.2, 18.6) }), 243, 71, pop(t, 17.45, 0.35)), gone) : '';
  const arrow = t >= 18.5 && t < 20.4 ? fade(ARROW, prog(t, 18.5, 18.7) * gone) : '';
  const learn = t >= 18.65 && t < 20.45 ? at(at(learnCard(82, 62, { r1: prog(t, 18.9, 19.25), r2: prog(t, 19.25, 19.6) }), 128, 88, pulse(t, 19.6, 0.3, 0.06)), 184, 78, pop(t, 18.65, 0.35)) : '';
  const tw = (ph) => (1 + 0.24 * Math.sin((t - 19) * 10 + ph)) * (1 - prog(t, 20.4, 20.7)); // 반짝임이 깜빡인다
  const sp = t >= 19.0 ? `${spark(80, 32, 9 * pop(t, 19.0, 0.3) * tw(0))}${spark(89, 44, 5 * pop(t, 19.15, 0.3) * tw(2))}${spark(180, 58, 6.4 * pop(t, 19.6, 0.3) * tw(4))}` : '';
  return `${sky()}${road()}${sign(1, { x: 298, cy: 92, state: 'now' })}${fl}${draft}${ask}${arrow}${learn}${who}${sp}`;
}

// ── ⑤ 점점 빠르게 · ⑥ 다음 프로젝트 (21~32초) ─────────────────────────
export const PASS = [0, 21.0, 21.9, 22.7, 23.4, 24.0, 24.5, 24.9, 25.3]; // PASS[n] = n번째 팻말을 지나는 때 — 간격이 점점 짧아진다
const FLY = 0.4; // 카드가 모음까지 날아가는 시간
export const ARRIVE = [20.9, ...[2, 3, 4, 5, 6, 7, 8].map((n) => +(PASS[n] + FLY).toFixed(2))]; // 카드가 모음에 닿는 때(= 숫자가 오르는 때)
const REACH = 170; // 팻말이 주인공 바로 앞(화면 x 170)에 오면 그 단계를 지난 것
const KNOT1 = PASS.slice(1).map((tt, i) => [tt, 80 * (i + 1) - REACH]);
function scroll1(t) { // 첫 프로젝트의 길이 왼쪽으로 흐른 거리
  if (t <= 21.0) return KNOT1[0][1] - (21.0 - t) * 60;
  for (let i = 0; i < KNOT1.length - 1; i++) if (t < KNOT1[i + 1][0]) return lerp(KNOT1[i][1], KNOT1[i + 1][1], prog(t, KNOT1[i][0], KNOT1[i + 1][0]));
  return lerp(640 - REACH, 536, oc(prog(t, 25.3, 25.85))); // 여덟째 팻말을 지나 등 뒤에 두고 멈춘다
}
const PASS2 = [0, 30.2, 30.8, 31.4];
const KNOT2 = [[29.6, 0], [30.2, 30], [30.8, 98], [31.4, 166], [32.3, 268]]; // 새 길의 팻말은 화면 x 132에서 닿는다
function scroll2(t) { // 다음 프로젝트의 길
  if (t <= 29.6) return 0;
  if (t < 30.2) return 30 * prog(t, 29.6, 30.2) ** 2;
  for (let i = 1; i < KNOT2.length - 1; i++) if (t < KNOT2[i + 1][0]) return lerp(KNOT2[i][1], KNOT2[i + 1][1], prog(t, KNOT2[i][0], KNOT2[i + 1][0]));
  return 268;
}
const LEAVE = [27.3, 27.6, 27.9], LAND = LEAVE.map((a) => +(a + 0.55).toFixed(2)); // 지난번에 배운 것 세 장이 모음을 떠나는 때 · 첫 팻말에 붙는 때
const lands = (t, d, amp) => LAND.reduce((s, a) => s + amp * Math.sin(Math.PI * prog(t, a, a + d)), 0);
const whip = (t) => io(prog(t, 26.15, 26.8)); // 첫 길이 왼쪽으로 빠지고 새 길이 들어온다
const dist = (t) => scroll1(Math.min(t, 25.85)) + 120 * whip(t) + scroll2(t); // 주인공이 걸은 거리 — 걸음을 여기에 맞춘다
const speedAt = (t) => (dist(t + 0.03) - dist(t - 0.03)) / 0.06;

function hero(t) {
  const v = speedAt(t), amp = clamp(v / 60, 0, 1), ph = dist(t) * ((2 * Math.PI) / 26), st = Math.sin(ph) * amp;
  const k = io(prog(t, 26.15, 26.9));
  let arm = armMix(WALK_B, WALK_F, 0.5 - 0.5 * st);
  const cheer = ob(prog(t, 25.6, 25.9)) * (1 - io(prog(t, 26.15, 26.4)));
  if (cheer > 0) arm = armMix(arm, ARM.cheer, cheer);
  const hello = io(prog(t, 27.1, 27.5)) * (1 - io(prog(t, 29.2, 29.6)));
  if (hello > 0) arm = armMix(arm, ARM.open, hello);
  const nod = lands(t, 0.3, 0.45) + 0.6 * Math.sin(Math.PI * prog(t, 29.0, 29.3));
  return actor({ front: arm, stride: st, sway: 6 * clamp(v / 200, 0, 1), talk: t >= 25.65 && t < 26.15 ? 1 : 0, nod, blink: blinkAt(t, 2.8, 0.4) },
    { x: lerp(139, 98, k), s: lerp(0.86, 0.9, k), y: FEET - 1.1 * Math.abs(Math.sin(ph)) * amp });
}
function guideSeal(t) {
  const v = speedAt(t), amp = clamp(v / 60, 0, 1), hp = dist(t) / 40, k = io(prog(t, 26.15, 26.9));
  const x = lerp(lerp(226, 196, io(prog(t, 25.3, 25.85))), 263, k);
  const h = 13 * Math.abs(Math.sin(Math.PI * hp)) * amp + 9 * Math.sin(Math.PI * prog(t, 25.65, 26.0)) + lands(t, 0.28, 7) + 9 * Math.sin(Math.PI * prog(t, 28.85, 29.2));
  const mood = t >= 25.55 && t < 26.2 ? 'done' : t >= 28.5 && t < 29.5 ? 'love' : 'happy';
  return `${shadow(x, 14 - h * 0.25, 0.28 - h * 0.006)}${floro(mood, { x, y: FEET - h, size: 40, rot: 8 * Math.cos(Math.PI * hp) * amp, flip: k > 0.5 })}`;
}
const banner = (x, y0, text, k) => at(`<path d="M${x} ${y0} V${y0 - 27}" stroke="${C.navy}" stroke-width="1.2" stroke-linecap="round"/><path d="M${x} ${y0 - 27} h-42 l4.6 8 l-4.6 8 h42 Z" fill="${C.f3}"/>${tx(x - 18.6, y0 - 15.6, 9.6, '#FFFFFF', text, 'middle', HEAD)}`, x, y0, k);
const CONFETTI = [[176, 30, 8, 0], [226, 20, 5, 0.08], [128, 40, 6, 0.14]];
const DOTS = [[190, 18, 1.6, C.f1], [168, 42, 1.4, C.f2], [214, 36, 1.4, C.f4], [116, 24, 1.6, C.f3], [150, 28, 1.3, C.f1]];

function world1(t) { // 첫 프로젝트의 팻말 여덟 개
  const sc = scroll1(t), next = PASS.findIndex((p, n) => n >= 1 && t < p);
  let s = '';
  for (let n = 1; n <= 8; n++) {
    const x = 80 * n - sc;
    if (x < -40 || x > 360) continue;
    const done = t >= PASS[n];
    s += at(sign(n, { x: n2(x), state: done ? 'done' : n === next ? 'now' : 'next', ...MID }), x, 67, done ? pulse(t, PASS[n], 0.25, 0.1) : 1);
  }
  if (t >= 25.6) s += banner(n2(640 - sc), 67, '완성!', pop(t, 25.6, 0.35));
  for (let n = 2; n <= 8; n++) { // 팻말을 지날 때마다 카드 한 장이 모음으로
    const p = prog(t, PASS[n], PASS[n] + FLY);
    if (p > 0 && p < 1) { const [cx, cy] = bez([REACH, 60], [228, -10], [271, 38], io(p)); s += miniCard(cx, cy, lerp(-22, 6, p), lerp(0.55, 0.86, p)); }
  }
  if (t >= 25.65) {
    s += CONFETTI.map(([x, y, size, d]) => spark(x, y, size * pop(t, 25.65 + d, 0.3))).join('');
    s += DOTS.map(([x, y, r, c], i) => { const k = prog(t, 25.65 + i * 0.05, 26.85 + i * 0.05); return k > 0 ? `<circle cx="${x}" cy="${n2(y + 12 * k)}" r="${r}" fill="${c}" opacity="${n2(1 - 0.7 * k)}"/>` : ''; }).join('');
  }
  return s;
}
function world2(t) { // 다음 프로젝트의 팻말(청록)
  const sc = scroll2(t), next = PASS2.findIndex((p, n) => n >= 1 && t < p), X = (n) => 162 + 68 * (n - 1) - sc;
  let s = '';
  for (let n = 1; n <= 7; n++) {
    const x = X(n);
    if (x < -40 || x > 360) continue;
    const done = n < PASS2.length && t >= PASS2[n], now = t >= 27.0 && n === (next === -1 ? PASS2.length : next);
    s += at(sign(n, { x: n2(x), state: done ? 'done' : now ? 'now' : 'next', ...MID, accent: C.f2 }), x, 67, n === 1 && !done ? pulse(t, 27.0, 0.3, 0.12) * (1 + lands(t, 0.22, 0.06)) : done ? pulse(t, PASS2[n], 0.25, 0.1) : 1);
  }
  [[-12, 106, -12], [1, 102, 3], [14, 107, 13]].forEach(([dx, y, r], j) => { // 지난번에 배운 것 세 장이 첫 팻말로 돌아온다
    const a = LEAVE[j], p = prog(t, a, a + 0.55), to = [X(1) + dx, y];
    if (p <= 0) return;
    if (p < 1) { const [cx, cy] = bez([50, 60], [(50 + to[0]) / 2, -10], to, io(p)); s += miniCard(cx, cy, lerp(-30, r, p), lerp(0.6, 0.9, p)); }
    else s += miniCard(to[0], to[1], r, 0.9 * pulse(t, a + 0.55, 0.25, 0.18));
  });
  return s;
}
const chip = (t) => at(`<rect x="9" y="8" width="72" height="16.4" rx="8.2" fill="${C.f2}"/>${tx(45, 19.4, 8, '#FFFFFF', '다음 프로젝트')}`, 45, 16, pop(t, 26.45, 0.3));
function speedLines(t) {
  const o = clamp((speedAt(t) - 95) / 80, 0, 1);
  if (o <= 0) return '';
  const x = lerp(139, 98, io(prog(t, 26.15, 26.9))) - 23;
  return fade([0, 1, 2].map((i) => `<rect x="${n2(x - i * 4 - 3 * Math.sin(t * 30 + i))}" y="${96 + i * 9}" width="${18 - i * 3}" height="2" rx="1" fill="#FFFFFF"/>`).join(''), 0.95 * o);
}
function journey(t) {
  const e = whip(t);
  return `${sky()}${road(dist(t))}${e < 1 ? move(world1(t), -340 * e) : ''}${e > 0 ? move(world2(t), 340 * (1 - e)) : ''}
    ${t >= 26.45 ? chip(t) : ''}${speedLines(t)}${guideSeal(t)}${hero(t)}`;
}

// 배운 것 모음 — 오른쪽 위에 있다가, 다음 프로젝트에서는 왼쪽으로 옮겨 '지난번에 배운 것'이 된다
const count = (t) => ARRIVE.filter((a) => t >= a).length;
function hud(t) {
  if (t < 20.5) return '';
  const k = io(prog(t, 26.15, 26.75)), arc = Math.sin(Math.PI * k), w = lerp(64, 70, k), h = 52;
  const x = lerp(248, 9, k), y = lerp(6, 30, k) - 26 * arc; // 옮겨 가는 동안에는 위로 돌아서(작아진 채) 간다
  const n = count(t), last = ARRIVE[n - 1];
  let cards = '';
  for (let i = 0; i < n; i++) cards += miniCard(x + 23 + (((i * 37) % 7) - 3) * 0.6, y + 40 - i * 2.3, (((i * 53) % 11) - 5) * 1.5, 0.82);
  return at(`<rect x="${n2(x)}" y="${n2(y + 1.8)}" width="${n2(w)}" height="${h}" rx="7" fill="#7FB4DD" opacity=".28"/>
    <rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${h}" rx="7" fill="#FFFFFF" stroke="${GOLD.line}" stroke-width="1"/>
    ${fade(tx(x + w / 2, y + 10.8, 6.6, GOLD.ink, k < 0.5 ? '배운 것' : '지난번에 배운 것'), k <= 0 || k >= 1 ? 1 : Math.abs(2 * k - 1))}${cards}
    ${n ? at(tx(x + w - 15, y + 42, 19, GOLD.num, String(n), 'middle', HEAD), x + w - 15, y + 35, pulse(t, last, 0.3, 0.3)) : ''}`, x + w / 2, y + h / 2, pop(t, 20.5, 0.3) * (1 - 0.5 * arc) * LEAVE.reduce((s, a) => s * pulse(t, a, 0.2, 0.05), 1));
}
// 가까이 본 장면은 천천히 다가간다 — 글을 읽는 동안에도 화면이 멈춰 보이지 않게
const closeZoom = (t) => lerp(1, 1.05, io(prog(t, 14.6, 20.6)));
const closeUp = (t) => at(close(t), 150, 84, closeZoom(t));
// 첫 카드는 크게 써 보인 그 카드가 줄어들며 모음으로 날아간다
function cardToHud(t) {
  const p = prog(t, 20.45, 20.9), z = closeZoom(20.45);
  if (p <= 0 || p >= 1) return '';
  const [cx, cy] = bez([150 + (128 - 150) * z, 84 + (88 - 84) * z], [205, 6], [271, 38], io(p));
  return `<g transform="translate(${n2(cx)} ${n2(cy)}) scale(${n2(lerp(z, 0.25, io(p)))}) translate(-128 -88)">${learnCard(82, 62, { rot: lerp(-3, 4, p) })}</g>`;
}

function path(t) {
  if (t < 14.0) return wide(t);
  if (t < 14.6) { const k = io(prog(t, 14.0, 14.6)); return `${at(wide(t), 64, 66, lerp(1, 2.4, k))}${fade(at(close(t), 160, 90, lerp(1.08, 1, k)), k)}`; } // 첫 팻말로 다가간다
  if (t < 20.75) return `${closeUp(t)}${hud(t)}${cardToHud(t)}`;
  if (t < 21.25) return `${closeUp(t)}${fade(journey(t), io(prog(t, 20.75, 21.25)))}${hud(t)}${cardToHud(t)}`;
  return `${journey(t)}${hud(t)}`;
}

// ── ⑦ 다시 평가자 앞 (32~39초) ────────────────────────────────
const GESTURES = [[33.3, 33.7, 'rest', 'open'], [35.0, 35.35, 'open', 'point'], [36.4, 36.8, 'point', 'open'], [38.7, 39.1, 'open', 'rest']];
function gesture(t) {
  let a = ARM.rest;
  for (const [t0, t1, from, to] of GESTURES) if (t >= t0) a = armMix(ARM[from], ARM[to], Math.min(1.08, ob(prog(t, t0, t1))));
  return a;
}
function scene7(t, { peek = true } = {}) {
  const talking = t >= 33.5 && t < 38.7 && !(t > 35.6 && t < 36.2) && !(t > 36.9 && t < 37.4);
  const checks = t >= 37.3 ? 3 : t >= 36.5 ? 2 : t >= 35.7 ? 1 : 0;
  const ask = fade(askBubble(pop(t, 32.5, 0.35)), 1 - prog(t, 33.3, 33.6));
  // 대답: </> 옆에서 배운 것 카드가 한 장씩 넘어간다
  const u = Math.max(0, (t - 33.6) / 0.6), idx = Math.floor(u), flip = talking ? 0.8 + 0.2 * ob(Math.min(1, (u % 1) * 3)) : 1;
  const say = t >= 33.45 ? at(`<path d="M158 38.6 L166 39 L155 44 Z" fill="#FFFFFF"/><rect x="144" y="15" width="57" height="25" rx="12.5" fill="#FFFFFF"/>${codeGlyph(162.5, 27.5, 0.78)}
    ${at(miniCard(186, 27.5, -6 + (idx % 3) * 5, 0.6), 186, 27.5, flip)}`, 155, 44, pop(t, 33.45, 0.35)) : '';
  const ok = t >= 37.3 ? at(`<path d="M216 34 L220 31.4 L221.8 40.6 Z" fill="#FFFFFF"/><circle cx="211.6" cy="27" r="9" fill="#FFFFFF"/>
    <path d="M207.1 27 l3.2 3.2 l6 -6.6" fill="none" stroke="${C.ok}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`, 221.8, 40.6, pop(t, 37.3, 0.35)) : '';
  const behind = peek && t >= 34.4 ? floro(t < 36.0 ? 'idle' : 'love', { x: 76, y: lerp(98, 81, ob(prog(t, 34.4, 34.9))) + (t > 34.9 ? 0.4 * Math.sin((t - 34.9) * 2.6) : 0), size: 30, rot: 12 * io(prog(t, 35.2, 35.8)), blink: blinkAt(t, 2.2, 0.1) }) : '';
  const hearts = t >= 36.0 ? [[91, 0], [98, 0.6], [88, 1.2]].map(([x, d]) => {
    if (t < 36.0 + d) return '';
    const k = ((t - 36.0 - d) % 1.8) / 1.8;
    return heart(x + 1.5 * Math.sin(k * 6), 52 - 22 * k, 0.9 + 0.4 * k, (1 - k) * Math.min(1, k * 6));
  }).join('') : '';
  return evalRoom({
    user: { front: gesture(t), talk: talking && Math.sin(t * 15) > 0 ? 1 : 0, nod: talking ? 0.22 * Math.max(0, Math.sin(t * 4.6)) : 0, blink: blinkAt(t, 3.3, 0.4), sway: 0.7 * Math.sin(t * 1.7), breathe: Math.sin(t * 2.2) },
    judge: { checks, tilt: -3.5 * io(prog(t, 32.6, 33.4)) * (1 - prog(t, 35.4, 35.7)), nod: Math.sin(Math.PI * prog(t, 35.6, 36.1)) + 0.6 * Math.sin(Math.PI * prog(t, 36.9, 37.3)),
      blink: blinkAt(t, 2.9, 1.1), sway: 0.5 * Math.sin(t * 1.5 + 1), breathe: Math.sin(t * 2 + 0.7), tap: taps(t, [35.7, 36.5, 37.3]) },
    behind,
    over: fade(`${ask}${say}${ok}${hearts}`, 1 - prog(t, 39.0, 39.5)), // ⑧로 넘어가며 말풍선 · 하트가 사라진다
    k: lerp(0.25, 1, io(prog(t, 32, 39))),
  });
}

// ── ⑧ Floe (39~45초): 앞 장면이 흐려지며 로고와 한 줄 — 여기서 멈춰 발표의 표지가 된다 ──────────
const MARK = { x: 160, y: 56, size: 50 };
function scene8(t) {
  const b = prog(t, 39.0, 40.0), cam = evalCam(1), top = MARK.y - MARK.size / 2;
  // 노트북 뒤에 있던 플로로가 마크 속으로 뛰어든다 — 다 뛰어오르기 전에는 노트북 화면 위 가장자리 아래를 가린다
  let jumper = '';
  if (t >= 39.65 && t < 40.3) {
    const from = toScreen([76, 81], cam), k = prog(t, 39.65, 40.3), h = hop(t, 39.65, 40.3, { x: from[0], y: from[1] }, { x: MARK.x, y: MARK.y + 6 }, 34);
    jumper = floro('happy', { x: h.x, y: h.y, size: lerp(30 * cam.scale, 30, k), rot: lerp(12, 0, k), sx: h.sx, sy: h.sy, clipY: t < 39.85 ? toScreen([0, 66], cam)[1] : null });
  }
  const sp = prog(t, 40.3, 40.9);
  const splash = sp > 0 && sp < 1 ? `<ellipse cx="${MARK.x}" cy="${n2(top + 1)}" rx="${n2(10 + 22 * sp)}" ry="${n2(2 + 3 * sp)}" fill="none" stroke="#8ECCF2" stroke-width="1.6" opacity="${n2(1 - sp)}"/>
    ${[[-12, -10], [0, -16], [12, -10]].map(([dx, dy]) => `<circle cx="${n2(MARK.x + dx * sp * 1.4)}" cy="${n2(top + dy * Math.sin(Math.PI * sp))}" r="1.8" fill="#8ECCF2" opacity="${n2(1 - sp)}"/>`).join('')}` : '';
  const m = pop(t, 39.4, 0.4), rise = ob(prog(t, 40.75, 41.1));
  const inner = t >= 40.75 ? floro('happy', { x: MARK.x, y: lerp(MARK.y + 56, MARK.y + 35, rise), size: 43 }) : '';
  const w = pop(t, 41.2, 0.4), line = prog(t, 41.9, 42.4), id = uid('bl');
  return `<defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${n2(3.2 * b)}"/></filter></defs>
    <g${b > 0 ? ` filter="url(#${id})"` : ''}>${scene7(t, { peek: t < 39.65 })}</g><rect x="-10" y="-10" width="340" height="200" fill="#FFFFFF" opacity="${n2(0.7 * b)}"/>
    ${m > 0 ? at(mark({ ...MARK, inner }), MARK.x, MARK.y, m) : ''}${splash}${jumper}
    ${w > 0 ? at(tx(160, 116, 25, C.ink, 'Floe', 'middle', HEAD), 160, 108, w) : ''}${line > 0 ? fade(tx(160, 135 + 4 * (1 - line), 9, C.navy, END_LINE), line) : ''}`;
}

// ── 자막 띠 (12.2~31.9초) ───────────────────────────────────
const SWAPS = [21.0, 26.3]; // 자막이 바뀌는 때
function captionBand(t) {
  if (t < 12.2 || t >= 31.9) return '';
  const k = t < 20 ? oc(prog(t, 12.2, 12.6)) : 1 - io(prog(t, 31.5, 31.9));
  let idx = SWAPS.filter((s) => t >= s).length, o = 1, dy = 0;
  for (const [i, s] of SWAPS.entries()) {
    if (t >= s - 0.2 && t < s) { idx = i; o = 1 - prog(t, s - 0.2, s); dy = -2 * (1 - o); }
    else if (t >= s && t < s + 0.25) { o = prog(t, s, s + 0.25); dy = 2 * (1 - o); }
  }
  return `<g transform="translate(0 ${n2(30 * (1 - k))})"><rect x="-10" y="152" width="340" height="40" fill="#FFFFFF" opacity=".95"/><rect x="-10" y="151.4" width="340" height="1" fill="#C8DCF0"/>
    <text data-caption45="1" x="160" y="${n2(170.4 + dy)}" font-size="10" fill="${C.ink}" text-anchor="middle" opacity="${n2(o)}">${CAPTIONS[idx]}</text></g>`;
}

// ── 효과음 시점 — 그림의 움직임과 같은 숫자를 쓴다 ───────────────────────
const SCALE = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5]; // 도레미파솔라시도 — 카드가 쌓일 때마다 한 음씩
export const CUES45 = [
  { t: 0.5, kind: 'pop' }, { t: 4.35, kind: 'pop' }, { t: 8.3, kind: 'pop' }, { t: 9.6, kind: 'sparkle' }, { t: 10.9, kind: 'plop' },
  { t: 12.65, kind: 'pop' }, { t: 16.25, kind: 'pop' }, { t: 18.2, kind: 'pop' }, { t: 18.8, kind: 'sparkle' },
  ...ARRIVE.map((t, i) => ({ t, kind: 'ding', hz: SCALE[i] })),
  { t: 25.8, kind: 'chime' }, { t: 26.45, kind: 'pop' },
  ...LAND.map((t, i) => ({ t, kind: 'ding', hz: SCALE[[2, 4, 7][i]] })),
  { t: 31.5, kind: 'plop' }, { t: 32.5, kind: 'pop' }, { t: 33.45, kind: 'pop' }, { t: 34.5, kind: 'boing' }, { t: 35.7, kind: 'dong' }, { t: 37.3, kind: 'sparkle' },
  { t: 40.3, kind: 'plop' }, { t: 41.0, kind: 'chime' },
];

// 시간 t(초)의 화면 한 장
export function renderFrame45(time) {
  const t = clamp(time, 0, DURATION45 - 1e-6);
  let s;
  if (t < 3.8) s = scene1(t);
  else if (t < 4.2) s = `${scene1(t)}${fade(desk(t), io(prog(t, 3.8, 4.2)))}`;
  else if (t < 11.2) s = desk(t);
  else if (t < 12.0) { const c = toScreen([135, 131], camDesk(t)); s = `${desk(t)}${wipe(path(t), { cx: c[0], cy: c[1], r: 400 * io(prog(t, 11.2, 12.0)) })}`; } // 노트북 화면에서 물결이 퍼지며 길이 열린다
  else if (t < 31.5) s = path(t);
  else if (t < 32.2) s = `${path(t)}${wipe(scene7(t), { cx: 263, cy: 122, r: 400 * io(prog(t, 31.5, 32.2)) })}`; // 플로로 자리에서 물결이 퍼지며 평가자 앞으로
  else if (t < 39) s = scene7(t);
  else s = scene8(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="1920" height="1080" data-film45="${t.toFixed(3)}" font-family="'Gowun Dodum','Malgun Gothic',sans-serif">
    ${s}${captionBand(t)}${fadeVeil(1 - oc(prog(t, 0, 0.6)))}</svg>`;
}
