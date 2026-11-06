// 40초짜리 효과음 트랙 — 신호 시점(cues.mjs)마다 합성한 소리를 놓는다.
//   node video/audio/track.mjs  →  build/sfx-track.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SR, synth, encodeWav } from './synth.mjs';
import { SFX_CUES } from '../src/cues.mjs';
import { DURATION } from '../src/timeline.mjs';

const GAIN = { pop: 0.9, sparkle: 0.7, ding: 0.85, dong: 0.8, boing: 0.85, plop: 0.8, chime: 0.85 };
const LIMIT = 0.89; // −1 dBFS

export function buildSfxTrack(cues = SFX_CUES, { duration = DURATION } = {}) {
  const out = new Float32Array(Math.round(duration * SR));
  for (const c of cues) {
    const s = synth(c.kind, c), start = Math.round(c.t * SR), g = GAIN[c.kind] ?? 0.8;
    for (let i = 0; i < s.length && start + i < out.length; i++) out[start + i] += s[i] * g;
  }
  let peak = 0;
  for (const x of out) peak = Math.max(peak, Math.abs(x));
  if (peak > LIMIT) for (let i = 0; i < out.length; i++) out[i] *= LIMIT / peak;
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const file = path.join(project, 'build', 'sfx-track.wav');
  mkdirSync(path.dirname(file), { recursive: true });
  const mono = buildSfxTrack();
  writeFileSync(file, encodeWav([mono, mono], SR));
  console.log(`효과음 트랙: ${file}`);
}
