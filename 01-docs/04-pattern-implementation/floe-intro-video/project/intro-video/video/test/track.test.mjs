import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSfxTrack } from '../audio/track.mjs';
import { SR } from '../audio/synth.mjs';
import { SFX_CUES } from '../src/cues.mjs';

const track = buildSfxTrack();
const win = (a, t0, t1) => a.subarray(Math.round(t0 * SR), Math.round(t1 * SR));
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / Math.max(1, a.length));

test('효과음 트랙은 정확히 40초', () => {
  assert.equal(track.length, 40 * SR);
});

test('①(0–5초)에는 효과음이 없다', () => {
  assert.ok(rms(win(track, 0, 5)) < 1e-4);
});

test('신호마다 바로 그 시점에 소리가 시작된다(앞은 조용하고 뒤는 들림)', () => {
  for (const c of SFX_CUES) {
    const after = rms(win(track, c.t, c.t + 0.15));
    const before = rms(win(track, c.t - 0.2, c.t - 0.02));
    assert.ok(after > 0.02, `${c.kind}@${c.t}: 소리 ${after}`);
    assert.ok(before < after / 3, `${c.kind}@${c.t}: 앞 ${before} / 뒤 ${after}`);
  }
});

test('트랙 최대값은 0.89(−1 dBFS) 이하 — 깨지지 않게', () => {
  const peak = track.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
  assert.ok(peak <= 0.89 + 1e-6, `peak ${peak}`);
});
