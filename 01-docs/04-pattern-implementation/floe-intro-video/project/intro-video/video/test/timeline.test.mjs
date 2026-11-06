import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DURATION, FPS, UNIT, SCENES, sceneAt, frameTimes,
  clamp, lerp, prog, easeOutCubic, easeInOutCubic, easeOutBack, pop, hop, blinkAt,
} from '../src/timeline.mjs';
import { SFX_CUES, NOTE_HZ, FLORO_ARRIVALS } from '../src/cues.mjs';

test('영상 기본값: 40초 · 30fps · 1칸 6px', () => {
  assert.equal(DURATION, 40);
  assert.equal(FPS, 30);
  assert.equal(UNIT, 6);
});

test('장면 경계: 시작 시점은 그 장면, 끝은 다음 장면', () => {
  const cases = [[0, '1a'], [1.999, '1a'], [2, '1b'], [4.99, '1b'], [5, '2'], [11, '3-1'],
    [13, '3-2'], [22.99, '3-2'], [23, '4'], [30, '5'], [35, '6'], [39.999, '6'], [40, '6'], [-1, '1a']];
  for (const [t, id] of cases) assert.equal(sceneAt(t).id, id, `t=${t}`);
});

test('장면표는 스펙의 시간 그대로', () => {
  assert.deepEqual(SCENES.map((s) => [s.id, s.start, s.end]), [
    ['1a', 0, 2], ['1b', 2, 5], ['2', 5, 11], ['3-1', 11, 13], ['3-2', 13, 23],
    ['4', 23, 30], ['5', 30, 35], ['6', 35, 40],
  ]);
});

test('sceneAt는 장면 안에서의 시간(local)을 준다', () => {
  const s = sceneAt(14.5);
  assert.equal(s.id, '3-2');
  assert.ok(Math.abs(s.local - 1.5) < 1e-9);
});

test('프레임 시각: 1,200장, 마지막은 1199/30초', () => {
  const ts = frameTimes();
  assert.equal(ts.length, 1200);
  assert.equal(ts[0], 0);
  assert.equal(ts[1199], 1199 / 30);
});

test('수학 도우미: clamp · lerp · prog', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(prog(0.5, 1, 2), 0);
  assert.equal(prog(1.5, 1, 2), 0.5);
  assert.equal(prog(3, 1, 2), 1);
});

test('이징: 끝점이 0과 1', () => {
  for (const f of [easeOutCubic, easeInOutCubic, easeOutBack]) {
    assert.ok(Math.abs(f(0)) < 1e-9, f.name);
    assert.ok(Math.abs(f(1) - 1) < 1e-9, f.name);
  }
  assert.ok(easeOutBack(0.7) > 1, 'easeOutBack은 살짝 넘쳤다 돌아온다');
});

test('pop: 시작 전 0, 살짝 넘쳤다가(1.12 이하) 끝나면 1', () => {
  assert.equal(pop(0.9, 1), 0);
  assert.equal(pop(1.35, 1), 1);
  assert.equal(pop(5, 1), 1);
  let max = 0;
  for (let t = 1; t <= 1.35; t += 0.005) max = Math.max(max, pop(t, 1));
  assert.ok(max > 1 && max <= 1.12, `max=${max}`);
});

test('hop: 출발 · 도착 위치가 from · to와 같고, 가운데는 위로 뜬다', () => {
  const from = { x: 10, y: 50 }, to = { x: 100, y: 50 };
  const a = hop(1, 1, 2, from, to, 30);
  const b = hop(2, 1, 2, from, to, 30);
  const mid = hop(1.5, 1, 2, from, to, 30);
  assert.deepEqual([a.x, a.y], [10, 50]);
  assert.deepEqual([b.x, b.y], [100, 50]);
  assert.ok(mid.y < 50 - 25, `mid.y=${mid.y}`);
  const before = hop(0.5, 1, 2, from, to, 30);
  assert.deepEqual([before.x, before.y], [10, 50]);
});

test('hop: 뛰기 직전과 착지 직후에 몸이 찌그러진다', () => {
  const from = { x: 0, y: 0 }, to = { x: 50, y: 0 };
  const takeoff = hop(0.98, 1, 2, from, to, 20);
  const land = hop(2.05, 1, 2, from, to, 20);
  assert.ok(takeoff.sx > 1 && takeoff.sy < 1, 'takeoff squash');
  assert.ok(land.sx > 1 && land.sy < 1, 'landing squash');
  const rest = hop(3, 1, 2, from, to, 20);
  assert.deepEqual([rest.sx, rest.sy], [1, 1]);
});

test('눈 깜빡임: 주기마다 0.12초만 감고, 시간이 같으면 늘 같은 답', () => {
  assert.equal(blinkAt(0.05, 3, 0), true);
  assert.equal(blinkAt(0.2, 3, 0), false);
  assert.equal(blinkAt(3.05, 3, 0), true);
  assert.equal(blinkAt(1.55, 3, 1.5), true);
  let n = 0;
  for (let i = 0; i < 300; i++) if (blinkAt(i / 30, 3, 0)) n++;
  assert.ok(n >= 12 && n <= 16, `10초 동안 감은 프레임 ${n} (4번 × 3–4프레임)`);
});

test('효과음 시점 11개가 스펙 그대로', () => {
  assert.deepEqual(SFX_CUES, [
    { t: 6.0, kind: 'pop' }, { t: 8.0, kind: 'sparkle' },
    { t: 13.3, kind: 'ding', note: 'C5' }, { t: 15.8, kind: 'ding', note: 'E5' },
    { t: 18.3, kind: 'ding', note: 'G5' }, { t: 20.8, kind: 'ding', note: 'C6' },
    { t: 27.0, kind: 'dong' }, { t: 31.5, kind: 'boing' }, { t: 33.0, kind: 'sparkle' },
    { t: 35.9, kind: 'plop' }, { t: 36.6, kind: 'chime' },
  ]);
});

test('음 높이와 플로로 도착 시점(= 띵 시점)', () => {
  assert.deepEqual(NOTE_HZ, { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 });
  assert.deepEqual(FLORO_ARRIVALS, [13.3, 15.8, 18.3, 20.8]);
});
