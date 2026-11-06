import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SR, synth, encodeWav } from '../audio/synth.mjs';
import { NOTE_HZ } from '../src/cues.mjs';

const peak = (a) => a.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
// 아래에서 위로 0을 지나는 횟수로 기본음 높이를 잰다
const upHz = (a) => { let n = 0; for (let i = 1; i < a.length; i++) if (a[i - 1] < 0 && a[i] >= 0) n++; return n / (a.length / SR); };

test('소리마다 길이 0.05초 초과 1.2초 이하, 깨지지 않고(≤1), 들리는 크기', () => {
  for (const [kind, opts] of [['pop'], ['sparkle'], ['ding', { note: 'C5' }], ['dong'], ['boing'], ['plop'], ['chime']]) {
    const a = synth(kind, opts);
    assert.ok(a instanceof Float32Array, kind);
    assert.ok(a.length > 0.05 * SR && a.length <= 1.2 * SR, `${kind} 길이 ${a.length / SR}초`);
    assert.ok(peak(a) <= 1, `${kind} peak ${peak(a)}`);
    assert.ok(rms(a) > 0.01, `${kind} rms ${rms(a)}`);
  }
});

test('띵의 음 높이가 도 · 미 · 솔 · 높은 도 (±2%)', () => {
  for (const [note, hz] of Object.entries(NOTE_HZ)) {
    const f = upHz(synth('ding', { note }).subarray(0, Math.floor(0.25 * SR)));
    assert.ok(Math.abs(f - hz) / hz < 0.02, `${note}: ${f.toFixed(1)}Hz, 기대 ${hz}`);
  }
});

test('모르는 소리 이름은 에러', () => {
  assert.throws(() => synth('meow'));
});

test('WAV 머리: PCM 16비트 · 2채널 · 48kHz · data 길이', () => {
  const ch = [new Float32Array(480), new Float32Array(480)];
  const b = encodeWav(ch, 48000);
  assert.equal(b.toString('ascii', 0, 4), 'RIFF');
  assert.equal(b.readUInt32LE(4), b.length - 8);
  assert.equal(b.toString('ascii', 8, 12), 'WAVE');
  assert.equal(b.toString('ascii', 12, 16), 'fmt ');
  assert.equal(b.readUInt16LE(20), 1);
  assert.equal(b.readUInt16LE(22), 2);
  assert.equal(b.readUInt32LE(24), 48000);
  assert.equal(b.readUInt16LE(34), 16);
  assert.equal(b.toString('ascii', 36, 40), 'data');
  assert.equal(b.readUInt32LE(40), 480 * 2 * 2);
  assert.equal(b.length, 44 + 480 * 4);
});

test('WAV 값: 1.0은 32767, -1.0은 -32768 근처로 잘림 없이', () => {
  const b = encodeWav([Float32Array.from([1, -1, 0.5, 2])], 48000);
  assert.equal(b.readInt16LE(44), 32767);
  assert.equal(b.readInt16LE(46), -32767);
  assert.equal(b.readInt16LE(48), 16384);
  assert.equal(b.readInt16LE(50), 32767); // 1 넘는 값은 1로 자른다
});
