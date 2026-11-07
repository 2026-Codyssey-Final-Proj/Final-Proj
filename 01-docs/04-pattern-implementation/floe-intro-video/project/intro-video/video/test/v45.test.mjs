// 45초 판 정지 그림 — claude-drafted: 2026-11-06
import test from 'node:test';
import assert from 'node:assert/strict';
import { STILLS, CAPTIONS, STAGES, renderStill } from '../src/v45/stills.mjs';

test('45초 판 정지 그림 열한 장 — 자막은 12~32초의 여섯 장에만 하나씩, 팻말은 앱의 여덟 단계만', () => {
  assert.equal(STILLS.length, 11);
  assert.equal(STAGES.length, 8);
  assert.deepEqual(STILLS.map((s) => s.cap), [null, null, null, 0, 0, 0, 1, 1, 2, null, null]);
  STILLS.forEach((s, i) => {
    const svg = renderStill(i);
    assert.ok(svg.startsWith('<svg') && svg.includes('viewBox="0 0 320 180"'), s.file);
    const caps = [...svg.matchAll(/data-caption45="1"[^>]*>([^<]*)</g)].map((m) => m[1]);
    assert.deepEqual(caps, s.cap == null ? [] : [CAPTIONS[s.cap]], s.file);
    const signs = [...svg.matchAll(/data-sign="(\d+)"/g)].map((m) => Number(m[1]));
    assert.ok(signs.every((n) => n >= 1 && n <= 8) && (s.cap == null || signs.length > 0), s.file);
    assert.ok(!svg.includes('undefined') && !svg.includes('NaN'), s.file);
  });
});

test('한 장에 모은 판 — 열한 장이 다 들어 있다', () => {
  const svg = renderStill(-1);
  assert.equal((svg.match(/<svg x="/g) || []).length, 11);
  assert.ok(!svg.includes('undefined') && !svg.includes('NaN'));
});
