// 45초 판 영상 — claude-drafted: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderFrame45, frameTimes45, DURATION45, CUES45, PASS, ARRIVE } from '../src/v45/film.mjs';
import { CAPTIONS, END_LINE } from '../src/v45/stills.mjs';
import { buildSfxTrack } from '../audio/track.mjs';
import { SR } from '../audio/synth.mjs';

const captionOf = (svg) => [...svg.matchAll(/data-caption45="1"[^>]*>([^<]*)</g)].map((m) => m[1]);

test('45초 · 1,350프레임이 모두 그려지고 숫자가 깨지지 않는다', () => {
  const times = frameTimes45();
  assert.equal(times.length, 1350);
  assert.equal(times[times.length - 1], 1349 / 30);
  for (const t of times) {
    const svg = renderFrame45(t);
    assert.ok(svg.startsWith('<svg') && svg.includes('viewBox="0 0 320 180"'), `t=${t}`);
    assert.ok(!/undefined|NaN|Infinity/.test(svg), `t=${t}`);
  }
});

test('자막은 12.2~31.9초에만, 한 번에 하나 — 21초 · 26.3초에 바뀐다', () => {
  for (const t of [0, 3, 8, 11.9, 32, 38, 44.9]) assert.deepEqual(captionOf(renderFrame45(t)), [], `t=${t}`);
  assert.deepEqual(captionOf(renderFrame45(14)), [CAPTIONS[0]]);
  assert.deepEqual(captionOf(renderFrame45(23)), [CAPTIONS[1]]);
  assert.deepEqual(captionOf(renderFrame45(29)), [CAPTIONS[2]]);
});

test('팻말을 지나는 간격이 점점 짧아지고, 카드는 여덟 장이 쌓인다', () => {
  const gaps = PASS.slice(2).map((p, i) => +(p - PASS[i + 1]).toFixed(2));
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] <= gaps[i - 1], `간격 ${gaps}`);
  assert.equal(ARRIVE.length, 8);
  assert.ok(renderFrame45(25.9).includes('data-sign="8"') && renderFrame45(25.9).includes('완성!'));
});

test('마지막 화면에 Floe와 한 줄이 남는다', () => {
  const svg = renderFrame45(DURATION45 - 1 / 30);
  assert.ok(svg.includes('>Floe<') && svg.includes(END_LINE));
});

test('효과음 시점은 0~45초 안이고, 트랙은 45초 · 깨지지 않는 크기', () => {
  for (const c of CUES45) assert.ok(c.t >= 0 && c.t < DURATION45 - 0.5, JSON.stringify(c));
  const track = buildSfxTrack(CUES45, { duration: DURATION45 });
  assert.equal(track.length, DURATION45 * SR);
  let peak = 0;
  for (const x of track) peak = Math.max(peak, Math.abs(x));
  assert.ok(peak > 0.3 && peak <= 0.8901, `최대 ${peak}`);
});
