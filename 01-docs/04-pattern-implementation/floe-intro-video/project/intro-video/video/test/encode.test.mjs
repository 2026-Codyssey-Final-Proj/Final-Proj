import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeArgs } from '../render/render.mjs';

test('영상으로 바꿀 때 색을 BT.709로 바꾸고 태그를 붙인다(안 붙이면 재생기에서 색이 탁해짐)', () => {
  const a = encodeArgs('out.mp4').join(' ');
  assert.match(a, /out_color_matrix=bt709/);
  for (const k of ['-colorspace bt709', '-color_primaries bt709', '-color_trc bt709', '-color_range tv']) assert.ok(a.includes(k), k);
});

test('발표 프로그램에서 열리게 H.264 · yuv420p · faststart, 30fps', () => {
  const a = encodeArgs('out.mp4').join(' ');
  for (const k of ['-c:v libx264', 'format=yuv420p', '-movflags +faststart', '-r 30']) assert.ok(a.includes(k), k);
});

test('그림 영상에 맞는 높은 품질(crf 14 이하, animation 튜닝)', () => {
  const args = encodeArgs('out.mp4');
  const crf = Number(args[args.indexOf('-crf') + 1]);
  assert.ok(crf <= 14, `crf ${crf}`);
  assert.ok(args.join(' ').includes('-tune animation'));
});
