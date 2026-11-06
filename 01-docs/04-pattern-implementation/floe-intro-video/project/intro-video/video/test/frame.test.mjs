import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFrame } from '../src/frame.mjs';

test('프레임은 320×180칸을 1920×1080으로 그리는 SVG', () => {
  const s = renderFrame(0);
  assert.ok(s.startsWith('<svg'), s.slice(0, 40));
  assert.match(s, /viewBox="0 0 320 180"/);
  assert.match(s, /width="1920"/);
  assert.match(s, /height="1080"/);
  assert.match(s, /data-scene="1a"/);
});

test('마지막 프레임은 ⑥ 장면', () => {
  assert.match(renderFrame(39.99), /data-scene="6"/);
});

test('장면마다 data-scene이 바뀐다', () => {
  assert.match(renderFrame(14), /data-scene="3-2"/);
  assert.match(renderFrame(25), /data-scene="4"/);
});
