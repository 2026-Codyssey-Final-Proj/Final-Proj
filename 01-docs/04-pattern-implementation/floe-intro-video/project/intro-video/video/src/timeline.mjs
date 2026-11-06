// 영상의 시간표와 움직임 계산 — 스펙(storyboard.md 3절)의 장면 시간을 그대로 옮겼다.
export const DURATION = 40;
export const FPS = 30;
export const UNIT = 6; // 화면은 320×180칸, 1칸 = 6px → 1920×1080

export const SCENES = [
  { id: '1a', start: 0, end: 2 },
  { id: '1b', start: 2, end: 5 },
  { id: '2', start: 5, end: 11 },
  { id: '3-1', start: 11, end: 13 },
  { id: '3-2', start: 13, end: 23 },
  { id: '4', start: 23, end: 30 },
  { id: '5', start: 30, end: 35 },
  { id: '6', start: 35, end: 40 },
];

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

export function sceneAt(t) {
  const tt = clamp(t, 0, DURATION - 1e-9);
  const s = SCENES.find((sc) => tt >= sc.start && tt < sc.end) ?? SCENES[SCENES.length - 1];
  return { ...s, local: tt - s.start };
}

export const frameTimes = () => Array.from({ length: DURATION * FPS }, (_, i) => i / FPS);

export const easeOutCubic = (x) => 1 - (1 - x) ** 3;
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const C1 = 1.70158;
export const easeOutBack = (x) => 1 + (C1 + 1) * (x - 1) ** 3 + C1 * (x - 1) ** 2;

// 톡 튀어나오는 크기: at 전에는 0, dur 동안 살짝 넘쳤다가 1
export function pop(t, at, dur = 0.35) {
  if (t < at) return 0;
  if (t >= at + dur) return 1;
  return easeOutBack((t - at) / dur);
}

// 눈 깜빡임: period초마다 0.12초(약 4프레임) 감는다. phase로 사람마다 때를 어긋나게
export function blinkAt(t, period, phase = 0) {
  const m = (((t - phase) % period) + period) % period;
  return m < 0.12;
}

// 폴짝 뛰기: t0에 from을 떠나 t1에 to에 닿는 포물선. 뛰기 직전 · 착지 직후엔 납작하게, 공중에선 길쭉하게
const TAKEOFF = 0.08, LANDING = 0.12, SQUASH = 0.18;
export function hop(t, t0, t1, from, to, height) {
  const p = prog(t, t0, t1);
  const x = lerp(from.x, to.x, p);
  const y = lerp(from.y, to.y, p) - height * 4 * p * (1 - p);
  let s = 0;
  if (t >= t0 - TAKEOFF && t < t0) s = Math.sin(Math.PI * (t - (t0 - TAKEOFF)) / TAKEOFF);
  else if (t > t1 && t <= t1 + LANDING) s = Math.sin(Math.PI * (t - t1) / LANDING);
  else if (t > t0 && t < t1) s = -0.6 * Math.sin(Math.PI * p);
  return { x, y, sx: 1 + SQUASH * s, sy: 1 - SQUASH * s };
}
