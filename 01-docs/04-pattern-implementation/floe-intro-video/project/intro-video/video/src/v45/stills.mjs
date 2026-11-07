// 45초 판 — 전체 스토리보드의 정지 그림 11장(0~45초)과 한 장에 모은 판.
//   12~32초의 여섯 장(길 안내 → 배운 것이 쌓임 → 다음 프로젝트)은 Floe를 모르는 사람에게 보여 뜻이 통하는지 확인하는 용도이기도 하다.
// claude-drafted: 2026-11-06 — 두승현 요청. 영상을 만들기 전에 Floe를 모르는 사람에게 보여 뜻이 통하는지 확인하는 용도다.
// 사람 · 플로로 · 색은 40초 판(고한결)의 그림을 그대로 쓴다. 자막 문장은 예시 — 팀이 다듬는다.
// 화면의 글은 앱의 것을 옮겼다: 단계 이름(navigator.js의 short), 단추 말, 연습 예시 '동아리 행사 등록 앱', 배운 것(quest.js의 예시 문장).
import { C } from '../art/palette.mjs';
import { figure, USER_PAL, FRONT_ARM, seatedBack, evaluator } from '../art/people.mjs';
import { spark, laptopSide, desk1, laptopTable4, heart, mark } from '../art/props.mjs';
import { floro } from '../floro.mjs';
import { sky, camera } from '../scenes/common.mjs';

const n2 = (v) => +v.toFixed(2);
export const STAGES = ['정하기', '적어 두기', '기능 정리', '방법 고르기', '뼈대', '만들기', '재 보기', '돌아보기'];
export const CAPTIONS = ['다음에 할 일을, 한 단계씩 알려 주고', '넘어갈 때마다 배운 것이 쌓여', '다음 프로젝트는 더 앞에서 시작합니다'];
export const END_LINE = '처음이어도 길을 잃지 않게, 배운 것이 쌓이게'; // 마지막 한 줄 — 예시, 팀이 정한다

export const GROUND = 132; // 길 윗선
export const FEET = 139; // 발이 닿는 높이
export const HEAD = `font-family="'Bagel Fat One','Gowun Dodum',sans-serif"`;
export const GOLD = { fill: '#FFF8E8', line: '#F5C66A', ink: '#8A6A1F', num: '#D98C0E' };

export const tx = (x, y, size, fill, text, anchor = 'middle', extra = '') =>
  `<text x="${n2(x)}" y="${n2(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${extra}>${text}</text>`;

// 아래 자막 띠 — 프로젝터에서도 읽히게 흰 바탕에 큰 글씨(60px)
const caption = (text) => `<rect x="-10" y="152" width="340" height="40" fill="#FFFFFF" opacity=".95"/>
  <rect x="-10" y="151.4" width="340" height="1" fill="#C8DCF0"/>
  <text data-caption45="1" x="160" y="170.4" font-size="10" fill="${C.ink}" text-anchor="middle">${text}</text>`;

export function road() {
  let dash = '';
  for (let x = 2; x < 320; x += 16) dash += `<rect x="${x}" y="${GROUND + 5.2}" width="7" height="1.6" rx=".8" fill="#CFE3F5"/>`;
  return `<rect x="-10" y="${GROUND + 9.6}" width="340" height="4.4" fill="#9CCBEB" opacity=".55"/>
    <rect x="-10" y="${GROUND}" width="340" height="12" fill="#FFFFFF" opacity=".95"/>${dash}`;
}

// 길가의 팻말. state: next(아직) · now(지금) · done(지남). flag: true면 깃발, 글이면 그 글을 적은 깃발
export function sign(n, { x, cy = 58, w = 38, h = 19, fs = 6.2, state = 'next', accent = C.f1, flag = false }) {
  const now = state === 'now', done = state === 'done';
  const x0 = x - w / 2, y0 = cy - h / 2, r = fs * 0.78;
  const board = now
    ? `<rect x="${n2(x0 - 2.4)}" y="${n2(y0 - 2.4)}" width="${n2(w + 4.8)}" height="${n2(h + 4.8)}" rx="6.4" fill="${accent}" opacity=".22"/>
       <rect x="${n2(x0)}" y="${n2(y0)}" width="${w}" height="${h}" rx="4.4" fill="${accent}"/>`
    : `<rect x="${n2(x0)}" y="${n2(y0)}" width="${w}" height="${h}" rx="4.4" fill="${done ? '#FFFFFF' : '#F4F8FD'}" stroke="${done ? '#9DBBE0' : '#C9D9EE'}" stroke-width=".9"/>`;
  const badge = `<circle cx="${n2(x0 + 1.5)}" cy="${n2(y0 + 1.5)}" r="${n2(r)}" fill="${now ? '#FFFFFF' : done ? accent : '#DCE7F5'}"${now ? ` stroke="${accent}" stroke-width=".9"` : ''}/>
    ${tx(x0 + 1.5, y0 + 1.5 + r * 0.5, n2(r * 1.4), now ? accent : done ? '#FFFFFF' : '#5B6B85', String(n), 'middle', HEAD)}`;
  const check = done ? `<g transform="translate(${n2(x0 + w - 1.5)} ${n2(y0 + 1.5)})"><circle r="${n2(r * 0.9)}" fill="${C.ok}"/>
    <path d="M${n2(-r * 0.42)} 0 l${n2(r * 0.3)} ${n2(r * 0.3)} l${n2(r * 0.56)} ${n2(-r * 0.62)}" fill="none" stroke="#fff" stroke-width="${n2(r * 0.26)}" stroke-linecap="round" stroke-linejoin="round"/></g>` : '';
  const pole = `M${x} ${n2(y0)} V${n2(y0 - (typeof flag === 'string' ? 27 : 13))}`;
  const banner = typeof flag === 'string'
    ? `<path d="${pole}" stroke="${C.navy}" stroke-width="1.2" stroke-linecap="round"/><path d="M${x} ${n2(y0 - 27)} h-42 l4.6 8 l-4.6 8 h42 Z" fill="${C.f3}"/>${tx(x - 18.6, y0 - 15.6, 9.6, '#FFFFFF', flag, 'middle', HEAD)}`
    : flag ? `<path d="${pole}" stroke="${C.navy}" stroke-width="1.2" stroke-linecap="round"/><path d="M${x} ${n2(y0 - 13)} l10 3.4 l-10 3.4 Z" fill="${C.f3}"/>` : '';
  return `<g data-sign="${n}" data-state="${state}">
    <rect x="${n2(x - 1)}" y="${n2(cy + h / 2)}" width="2" height="${n2(GROUND - cy - h / 2 + 1)}" fill="${C.navy}" opacity=".8"/>
    ${banner}${board}
    ${tx(x + r * 0.35, cy + fs * 0.36, fs, now ? '#FFFFFF' : done ? C.ink : '#5B6B85', STAGES[n - 1])}
    ${badge}${check}</g>`;
}

// 주인공 — 40초 판의 서 있는 사람. (x, FEET)에 발을 두고 s배
export const ARM = {
  ...FRONT_ARM,
  press: { pts: [[152, 71.6], [164, 82], [178, 86]], kind: 'point', rot: 0 }, // 앞의 단추를 누름
  swing: { pts: [[152, 71.6], [160, 84], [170, 88]], kind: 'mitt', rot: 0 }, // 걸을 때 앞으로 흔든 팔
  cheer: { pts: [[152, 71.6], [162, 62.4], [165.4, 47.6]], kind: 'open', rot: 0 }, // 번쩍 든 팔
};
export const person = (opts, { x, s = 1 }) => `<ellipse cx="${x}" cy="${FEET + 0.8}" rx="${n2((15 + 8 * (opts.stride || 0)) * s)}" ry="${n2(2.3 * s)}" fill="#5FA6D8" opacity=".28"/>
  <g data-person="user" transform="translate(${x} ${FEET}) scale(${s}) translate(-142 -150.6)">${figure({ pal: USER_PAL, ...opts })}</g>`;

export const seal = (mood, { x, y = FEET, size, flip = false, rot = 0 }) => `${y === FEET ? `<ellipse cx="${x}" cy="${FEET + 0.8}" rx="${n2(size * 0.36)}" ry="${n2(size * 0.05)}" fill="#5FA6D8" opacity=".28"/>` : ''}${floro(mood, { x, y, size, flip, rot })}`;

export const qmark = (x, y, size, o = 1) => tx(x, y, size, C.sweaterDark, '?', 'middle', `${HEAD} opacity="${o}"`);

// 흰 카드 — 위에 색 띠
export const cardBox = (x, y, w, h, color) => `<rect x="${x}" y="${n2(y + 1.8)}" width="${w}" height="${h}" rx="6" fill="#7FB4DD" opacity=".28"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#FFFFFF" stroke="#D5E2F3" stroke-width=".8"/>
  <rect x="${x}" y="${y}" width="${w}" height="4.4" rx="2.2" fill="${color}"/>`;

export function btn(x, y, w, h, label, { fill = '#FFFFFF', stroke = null, color = C.ink, fs = 7, check = false, shift = -3.6 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1"` : ''}/>
    ${tx(x + w / 2 + (check ? shift : 0), y + h / 2 + fs * 0.36, fs, color, label)}
    ${check ? `<path d="M${n2(x + w - 12.4)} ${n2(y + h / 2)} l2.2 2.2 l4 -4.6" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`;
}

// AI가 쓴 초안 카드(126 × 72) — 사람이 '맞아요'를 눌러야 정해진다
const draftCard = (x, y) => `${cardBox(x, y, 126, 72, C.f2)}
  <rect x="${x + 8}" y="${y + 9.4}" width="54" height="12.4" rx="6.2" fill="#DDF5F1"/>${tx(x + 35, y + 18, 6.8, '#0B7F72', 'AI가 쓴 초안')}
  ${tx(x + 9, y + 34, 6.8, C.ink, '만들 것: 동아리 행사 등록 앱', 'start')}
  <rect x="${x + 9}" y="${y + 39}" width="92" height="2.8" rx="1.4" fill="#C9D8F0"/><rect x="${x + 9}" y="${y + 44.6}" width="66" height="2.8" rx="1.4" fill="#DDE7F5"/>
  ${btn(x + 8, y + 52, 56, 14, '맞아요', { fill: '#0E9384', color: '#FFFFFF', check: true, shift: 2.6 })}
  ${btn(x + 69, y + 52, 49, 14, '고칠래요', { stroke: C.f2, color: '#0F8C7E' })}`;

// 넘어가기 전 확인(90 × 40)
const askCard = (x, y) => `${cardBox(x, y, 90, 40, C.f3)}${tx(x + 9, y + 18.4, 7.6, C.ink, '이해하셨나요?', 'start')}
  ${btn(x + 8, y + 23.6, 32, 12, '예', { fill: '#D98C0E', color: '#FFFFFF', check: true })}${btn(x + 45, y + 23.6, 36, 12, '아니요', { stroke: C.f3, color: '#B7791F' })}`;

// 배운 것 한 줄 — 금색 카드(크게)
const learnCard = (x, y, { w = 92, h = 52, rot = -3, lines = ['다음엔 예시로', '먼저 써 보기'] } = {}) => `<g data-learn="1" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
  <rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="5" fill="#C99A2E" opacity=".25"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${GOLD.fill}" stroke="${GOLD.line}" stroke-width="1.2"/>
  ${spark(x + 11.5, y + 11.6, 5.6)}${tx(x + 19.6, y + 14.2, 6.8, GOLD.ink, '배운 것 한 줄', 'start')}
  <path d="M${x + 8} ${y + 20.4} H${x + w - 8}" stroke="${GOLD.line}" stroke-width=".8" stroke-dasharray="2 2"/>
  ${lines.map((l, i) => tx(x + w / 2, y + 33.4 + i * 11.6, 9, C.ink, l)).join('')}</g>`;

// 같은 카드의 작은 모양(26 × 17) — 쌓이고 날아다닌다
export const miniCard = (x, y, rot = 0, s = 1, o = 1) => `<g transform="translate(${n2(x)} ${n2(y)}) rotate(${n2(rot)}) scale(${s})" opacity="${o}">
  <rect x="-13" y="-8.5" width="26" height="17" rx="2.6" fill="${GOLD.fill}" stroke="${GOLD.line}" stroke-width=".9"/>
  <path d="M-4 -2.4 H9 M-4 2.6 H5" stroke="#E9C877" stroke-width="1.6" stroke-linecap="round"/>${spark(-8.4, -2.4, 3.6)}</g>`;

// 배운 것 모음 — 카드 더미와 큰 숫자. 숫자가 늘면 더미도 높아진다
function pilePanel(n, { x, y, w = 64, title = '배운 것' }) {
  const h = 52, px = x + 23, base = y + 47;
  let cards = '';
  for (let i = 0; i < n; i++) cards += miniCard(px + (((i * 37) % 7) - 3) * 0.6, base - 7 - i * 2.3, (((i * 53) % 11) - 5) * 1.5, 0.82);
  return `<g data-pile="${n}"><rect x="${x}" y="${n2(y + 1.8)}" width="${w}" height="${h}" rx="7" fill="#7FB4DD" opacity=".28"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="#FFFFFF" stroke="${GOLD.line}" stroke-width="1"/>
    ${tx(x + w / 2, y + 10.8, 6.6, GOLD.ink, title)}${cards}
    ${tx(x + w - 15, y + 42, 19, GOLD.num, String(n), 'middle', HEAD)}</g>`;
}

const fly = (d) => `<path d="${d}" fill="none" stroke="${GOLD.line}" stroke-width="1.3" stroke-dasharray="2.6 3" stroke-linecap="round" opacity=".95"/>`;
const speed = (x, y) => [0, 1, 2].map((i) => `<rect x="${x - i * 4}" y="${y + i * 9}" width="${18 - i * 3}" height="2" rx="1" fill="#FFFFFF" opacity=".95"/>`).join('');
const dots = (pts) => pts.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');

// ── 0~12초 · 막힘 → 까닭 → 만남 (40초 판의 사람 · 책상 · 평가자 그림을 다시 쓴다) ─────────
const CODE = [C.code, C.f1, C.code, C.f2, C.code, C.code, C.f1, C.code, C.f2, C.code];
const codeLines = (x, y, rows) => rows.map(([indent, w], i) => `<rect x="${x + indent}" y="${n2(y + i * 5.3)}" width="${w}" height="2.4" rx="1.2" fill="${CODE[i % CODE.length]}"/>`).join('');
// ②·③ 책상 위에 떠 있는 창 두 개 — AI가 코드를 줄줄 써 내려간 모습
const aiWindows = () => `<rect x="122" y="22" width="80" height="70" rx="4" fill="${C.winBack}" stroke="${C.navy}" stroke-width="1.2"/>
  ${codeLines(130, 29, [[0, 40], [4, 56], [8, 44], [34, 30], [32, 36], [36, 24], [32, 32], [36, 28], [32, 34], [34, 22], [32, 30]])}
  <rect x="70" y="42" width="88" height="76" rx="4" fill="${C.win}" stroke="${C.navy}" stroke-width="1.2"/>
  <rect x="77" y="47.4" width="17" height="9" rx="4.5" fill="#E3ECFF"/>${tx(85.5, 54.2, 5.6, C.f1, 'AI', 'middle', HEAD)}
  ${codeLines(78, 62, [[0, 46], [5, 58], [10, 40], [10, 62], [5, 34], [10, 52], [15, 44], [10, 56], [5, 38], [0, 22]])}
  <rect x="102" y="109.2" width="2.2" height="4" fill="${C.f1}"/>`;
const desk = (person, laptop, over, cam) => camera(`${sky()}${aiWindows()}${laptopSide(laptop)}${desk1({ t: 0 })}${seatedBack(person)}${over}`, cam);

// 평가자 앞 — 처음(①)과 끝(⑦)이 같은 자리 · 같은 구도. user = 주인공, judge = 평가자, behind = 노트북 뒤에 그릴 것
const evalRoom = ({ user, judge, behind = '', over = '' }) => camera(`${sky()}
  <ellipse cx="142" cy="151.5" rx="22" ry="3" fill="#5FA6D8" opacity=".3"/><ellipse cx="235" cy="151.5" rx="22" ry="3" fill="#5FA6D8" opacity=".3"/>
  ${behind}${laptopTable4({ inner: '', innerOpacity: 0 })}
  <g data-person="user">${figure({ pal: USER_PAL, ...user })}</g>${evaluator(judge)}${over}`, { cx: 150, cy: 88, scale: 1.16 }); // 40초 판 ④보다 조금 위를 본다 — 말풍선이 잘리지 않게
export const codeGlyph = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M-11 -4.5 L-16.5 0 L-11 4.5 M11 -4.5 L16.5 0 L11 4.5 M-3 6.5 L3 -6.5" fill="none" stroke="${C.f1}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;

// ① 0~4초: 평가자가 코드를 묻는데 주인공은 "…"만
function stuck() {
  return evalRoom({
    user: { front: FRONT_ARM.rest, smile: false, flat: true, tilt: 6 },
    judge: { checks: 0, tilt: -3.5 },
    // 말풍선 꼬리는 머리카락에 닿기 전에 끝난다(흰 꼬리가 머리를 파고들어 보이지 않게)
    over: `<path d="M213 35.4 L221 35.8 L221.6 42 Z" fill="#FFFFFF"/><rect x="177" y="15" width="48" height="21.6" rx="10.8" fill="#FFFFFF"/>${codeGlyph(194.5, 25.8, 0.8)}${tx(216, 30.6, 13, C.f1, '?', 'middle', HEAD)}
      <path d="M157 36 L163 36.4 L155 41.6 Z" fill="#FFFFFF"/><rect x="152" y="23.6" width="21.6" height="13.4" rx="6.7" fill="#FFFFFF"/>
      <circle cx="157.4" cy="30.3" r="1.5" fill="${C.navy}" opacity=".55"/><circle cx="162.8" cy="30.3" r="1.5" fill="${C.navy}" opacity=".55"/><circle cx="168.2" cy="30.3" r="1.5" fill="${C.navy}" opacity=".55"/>
      <path d="M131.4 41 q-2.6 4.4 0 6.4 q2.6 -2 0 -6.4 Z" fill="#7FC4F0"/>`,
  });
}

// ② 4~8초: 한 줄 부탁에 AI가 코드를 쏟아 내고, 물음표가 늘어난다
function flood() {
  return desk({ pose: 'chin', turn: 0.6, face: 'think' }, { screen: 'plain' },
    `<path d="M202 98 L213 90 L206 102 Z" fill="${C.sweater}"/><rect x="160" y="96" width="47" height="14.4" rx="7.2" fill="${C.sweater}"/>${tx(183.5, 105.6, 6.6, '#FFFFFF', '앱 만들어 줘')}
     ${qmark(266, 45, 14)}${qmark(278, 32, 9.6, 0.7)}${qmark(255, 32, 7.6, 0.5)}`,
    { cx: 172, cy: 95, scale: 1.05 });
}

// ③ 8~12초: 노트북 화면이 물처럼 일렁이고 플로로가 솟아 눈이 마주친다
function meet() {
  return desk({ pose: 'lower', turn: 1, face: 'smile', headRot: 1 }, { screen: 'glow', glow: 1, ripple: 0.35 },
    `${floro('happy', { x: 135, y: 150, size: 54, rot: 6, clipY: 151 })}
     <path d="M228 72 Q190 82 142 116" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-dasharray="2 3"/>${spark(186, 88, 7)}${spark(176, 80, 3.5)}`,
    { cx: 166, cy: 108, scale: 1.18 });
}

// ── 32~45초 · 다시 평가자 앞 → Floe ────────────────────────────
const proud = () => floro('love', { x: 76, y: 81, size: 30, rot: 12 }); // 노트북 뒤에서 고개를 내민 플로로
// ⑦ 32~39초: 이번엔 배운 것을 들어 술술 설명하고, 평가자가 끄덕인다
function explain() {
  return evalRoom({
    user: { front: FRONT_ARM.open, talk: 1 },
    judge: { checks: 3, nod: 0.5 },
    behind: proud(),
    over: `<path d="M158 38.6 L166 39 L155 44 Z" fill="#FFFFFF"/><rect x="144" y="15" width="57" height="25" rx="12.5" fill="#FFFFFF"/>${codeGlyph(162.5, 27.5, 0.78)}${miniCard(186, 27.5, -6, 0.6)}
      <path d="M216 34 L220 31.4 L221.8 40.6 Z" fill="#FFFFFF"/><circle cx="211.6" cy="27" r="9" fill="#FFFFFF"/><path d="M207.1 27 l3.2 3.2 l6 -6.6" fill="none" stroke="${C.ok}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      ${heart(91, 49, 1.25)}${heart(98, 40, 1, 0.8)}${heart(88, 35.6, 0.8, 0.55)}`,
  });
}

// ⑧ 39~45초: 앞 장면이 흐려지며 로고와 한 줄 — 이 화면에서 멈춰 발표의 표지가 된다
function endCard() {
  const base = evalRoom({ user: { front: FRONT_ARM.open }, judge: { checks: 3 } });
  return `<defs><filter id="blur45" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
    <g filter="url(#blur45)">${base}</g><rect x="-10" y="-10" width="340" height="200" fill="#FFFFFF" opacity=".7"/>
    ${mark({ x: 160, y: 56, size: 50, inner: floro('happy', { x: 160, y: 91, size: 43 }) })}
    ${tx(160, 116, 25, C.ink, 'Floe', 'middle', HEAD)}${tx(160, 135, 9, C.navy, END_LINE)}`;
}

// ── 12~21초 · 한 단계를 또박또박 ─────────────────────────────
// ① 길 전체: 팻말 여덟 개, 플로로가 첫 팻말에서 "다음은 여기!"
function guide() {
  let signs = '';
  for (let n = 8; n >= 1; n--) signs += sign(n, { x: n2(64 + 32.4 * (n - 1)), cy: n % 2 ? 58 : 86, state: n === 1 ? 'now' : 'next', flag: n === 8 });
  return `${road()}${signs}
    ${seal('happy', { x: 64, y: 49.6, size: 30 })}
    <path d="M89 26 L81 33.4 L97 28 Z" fill="#FFFFFF"/><rect x="85" y="11.6" width="53" height="17.4" rx="8.7" fill="#FFFFFF"/>${tx(111.5, 23, 7.2, C.ink, '다음은 여기!')}
    ${person({ front: ARM.rest, smile: false, flat: true }, { x: 23, s: 0.74 })}
    ${qmark(37.6, 49, 12)}${qmark(44.6, 41.6, 7.6, 0.55)}`;
}

// ② 1단계: AI가 쓴 초안을 주인공이 '맞아요'로 정한다
function confirm() {
  return `${road()}${sign(1, { x: 298, state: 'now' })}
    ${seal('happy', { x: 256, size: 46, flip: true })}
    <path d="M224 60 L224 74 L243 90 Z" fill="#FFFFFF"/>${draftCard(100, 18)}
    ${person({ front: ARM.press }, { x: 66 })}`;
}

// ③ 1단계 끝: "이해하셨나요?" → 예 → 배운 것 한 줄이 카드로 남는다
function learn() {
  return `${road()}${sign(1, { x: 298, state: 'now' })}
    ${seal('happy', { x: 246, size: 44, flip: true })}
    <path d="M232 59 L245 59 L243 71 Z" fill="#FFFFFF"/>${askCard(182, 20)}
    ${fly('M200 64 C196 72 190 76 184 78')}<path d="M188.6 73.6 L183.2 78.4 L190.2 79.4" fill="none" stroke="${GOLD.line}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    ${learnCard(86, 62)}
    ${person({ front: ARM.point, talk: 1 }, { x: 52 })}
    ${spark(84, 32, 9)}${spark(93, 44, 5)}`;
}

// ── 21~26초 · 점점 빠르게 ─────────────────────────────────
export const MID = { cy: 78, w: 46, h: 22, fs: 7 };
// ④ 팻말을 지날 때마다 카드가 한 장씩 모인다
function stack() {
  return `${road()}
    ${sign(4, { x: 32, state: 'done', ...MID })}${sign(5, { x: 104, state: 'done', ...MID })}${sign(6, { x: 205, state: 'now', ...MID })}${sign(7, { x: 274, state: 'next', ...MID })}
    ${fly('M104 63 C130 12 204 2 254 28')}${miniCard(131, 27, -24, 0.7, 0.5)}${miniCard(188, 11.6, 10, 0.86)}
    ${pilePanel(5, { x: 248, y: 6 })}
    ${speed(116, 96)}
    ${person({ front: ARM.swing, stride: 1, sway: 4 }, { x: 139, s: 0.86 })}
    <ellipse cx="240" cy="${FEET + 0.8}" rx="11" ry="1.6" fill="#5FA6D8" opacity=".22"/>${seal('happy', { x: 240, y: 129, size: 37, rot: 8 })}`;
}

// ⑤ 8단계까지 마침 — 여덟 장
function finish() {
  return `${road()}
    ${sign(6, { x: 32, state: 'done', ...MID })}${sign(7, { x: 106, state: 'done', ...MID })}${sign(8, { x: 180, state: 'done', flag: '완성!', ...MID })}
    ${pilePanel(8, { x: 248, y: 6 })}
    ${seal('done', { x: 143, size: 42 })}
    ${person({ front: ARM.cheer, talk: 1 }, { x: 220, s: 0.9 })}
    ${spark(196, 30, 8)}${spark(238, 22, 5)}${spark(120, 40, 6)}
    ${dots([[206, 18, 1.6, C.f1], [186, 40, 1.4, C.f2], [228, 34, 1.4, C.f4], [112, 26, 1.6, C.f3], [152, 30, 1.3, C.f1]])}`;
}

// ── 26~32초 · 다음 프로젝트 ────────────────────────────────
// ⑥ 새 길의 첫 팻말에 지난번에 배운 것이 돌아온다
function next() {
  const o = { ...MID, accent: C.f2 };
  return `${road()}
    ${fly('M77 44 C100 2 150 2 172 96')}
    ${sign(1, { x: 162, state: 'now', ...o })}${sign(2, { x: 230, state: 'next', ...o })}${sign(3, { x: 296, state: 'next', ...o })}
    <rect x="9" y="8" width="72" height="16.4" rx="8.2" fill="${C.f2}"/>${tx(45, 19.4, 8, '#FFFFFF', '다음 프로젝트')}
    ${pilePanel(8, { x: 9, y: 30, w: 70, title: '지난번에 배운 것' })}
    ${miniCard(127, 14, -8, 0.86)}
    ${miniCard(150, 106, -12, 0.9)}${miniCard(163, 102, 3, 0.9)}${miniCard(176, 107, 13, 0.9)}
    ${seal('happy', { x: 263, size: 42, flip: true })}
    ${person({ front: ARM.swing, stride: 0.45 }, { x: 98, s: 0.9 })}`;
}

// 영상 순서대로 11장. cap = 자막 번호(없으면 자막 띠 없음), time · title · note = 한 장에 모은 판의 설명
export const STILLS = [
  { file: 'kf45-0a-t02.png', cap: null, draw: stuck, time: '0~4초', title: '평가자 앞에서 막힘', note: '코드를 묻는데 대답하지 못한다' },
  { file: 'kf45-0b-t06.png', cap: null, draw: flood, time: '4~8초', title: '왜 막혔나', note: '한 줄 부탁에 AI가 코드를 쏟아 냈다' },
  { file: 'kf45-0c-t10.png', cap: null, draw: meet, time: '8~12초', title: '플로로를 만남', note: '화면에서 플로로가 나와 눈이 마주친다' },
  { file: 'kf45-1-t13.png', cap: 0, draw: guide, time: '12~21초', title: '한 단계씩 (1)', note: '플로로가 다음 할 일을 알려 준다' },
  { file: 'kf45-2-t16.png', cap: 0, draw: confirm, time: '12~21초', title: '한 단계씩 (2)', note: 'AI가 쓴 초안을 내가 정한다' },
  { file: 'kf45-3-t19.png', cap: 0, draw: learn, time: '12~21초', title: '한 단계씩 (3)', note: '이해를 확인하고 배운 것 한 줄을 남긴다' },
  { file: 'kf45-4-t23.png', cap: 1, draw: stack, time: '21~26초', title: '점점 빠르게 (1)', note: '단계를 넘을 때마다 카드가 모인다' },
  { file: 'kf45-5-t25.png', cap: 1, draw: finish, time: '21~26초', title: '점점 빠르게 (2)', note: '여덟 단계를 마치면 여덟 장' },
  { file: 'kf45-6-t29.png', cap: 2, draw: next, time: '26~32초', title: '다음 프로젝트', note: '지난번에 배운 것이 첫 단계에 돌아온다' },
  { file: 'kf45-7-t36.png', cap: null, draw: explain, time: '32~39초', title: '다시 평가자 앞', note: '이번엔 술술 설명한다 · 플로로는 뒤에서 흐뭇' },
  { file: 'kf45-8-t43.png', cap: null, draw: endCard, time: '39~45초', title: 'Floe', note: '로고와 한 줄에서 멈춰 발표의 표지가 된다' },
];
export const BOARD_FILE = 'storyboard45.png';

const body = (s) => `${s.cap == null ? '' : sky()}${s.draw()}${s.cap == null ? '' : caption(CAPTIONS[s.cap])}`;
const SVG = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="1920" height="1080" font-family="'Gowun Dodum','Malgun Gothic',sans-serif"`;

// 11장을 한 장에 — 4칸 × 3줄, 마지막 칸은 제목
function board() {
  const cw = 80, ch = 60, tw = 72, th = 40.5;
  const cells = STILLS.map((s, i) => {
    const x = (i % 4) * cw + 4, y = Math.floor(i / 4) * ch + 3.4;
    return `<svg x="${x}" y="${y}" width="${tw}" height="${th}" viewBox="0 0 320 180">${body(s)}</svg>
      <rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="none" stroke="#B9CDE6" stroke-width=".5"/>
      <circle cx="${x + 3.4}" cy="${n2(y + th + 6.2)}" r="3.2" fill="${C.f1}"/>${tx(x + 3.4, y + th + 7.5, 3.6, '#FFFFFF', String(i + 1), 'middle', HEAD)}
      ${tx(x + 8.6, y + th + 7.4, 3.5, C.ink, `${s.time} · ${s.title}`, 'start')}${tx(x + 0.4, y + th + 12.6, 2.8, '#4F5B80', s.note, 'start')}`;
  }).join('');
  const x = 3 * cw + 4, y = 2 * ch + 3.4;
  return `<svg ${SVG} data-still="${BOARD_FILE}"><rect width="320" height="180" fill="#FFFFFF"/>${cells}
    <rect x="${x}" y="${y}" width="${tw}" height="${th + 14}" rx="3" fill="#EEF5FD"/>
    ${tx(x + 5, y + 11, 6.4, C.ink, 'Floe 소개 영상', 'start', HEAD)}${tx(x + 5, y + 19.4, 4.6, C.f1, '45초 스토리보드 초안', 'start', HEAD)}
    ${tx(x + 5, y + 28.4, 2.8, '#4F5B80', '고한결의 40초 판 그림체 그대로', 'start')}${tx(x + 5, y + 33.4, 2.8, '#4F5B80', '자막은 4~9번(12~32초)에만', 'start')}
    ${tx(x + 5, y + 38.4, 2.8, '#4F5B80', '1번과 10번은 같은 자리 · 같은 구도', 'start')}${tx(x + 5, y + 43.4, 2.8, '#4F5B80', '자막 · 마지막 한 줄은 예시', 'start')}
    ${tx(x + 5, y + 50.6, 2.6, '#7C8BA6', '2026-11-06 · Claude 초안', 'start')}</svg>`;
}

// 번호(0부터)의 정지 그림 한 장을 SVG 문자열로. 음수면 한 장에 모은 판
export function renderStill(i) {
  if (i < 0) return board();
  const s = STILLS[Math.max(0, Math.min(STILLS.length - 1, Math.round(i)))];
  return `<svg ${SVG} data-still="${s.file}">
    ${body(s)}</svg>`;
}
