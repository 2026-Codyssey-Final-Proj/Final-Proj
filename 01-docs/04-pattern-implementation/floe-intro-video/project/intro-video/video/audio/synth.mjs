// 효과음을 코드로 합성한다(녹음 파일 없음). 모두 사인파를 겹치고 감쇠시켜 만든 밝고 짧은 소리.
import { NOTE_HZ } from '../src/cues.mjs';

export const SR = 48000;
const TAU = 2 * Math.PI;
const len = (sec) => Math.round(sec * SR);

function normalize(a, target) {
  let p = 0;
  for (const x of a) p = Math.max(p, Math.abs(x));
  if (p > 0) for (let i = 0; i < a.length; i++) a[i] *= target / p;
  return a;
}

// 종소리 같은 음: 부분음마다 [배수, 크기, 감쇠 시간]
function tone(out, start, f0, partials, attack = 0.003) {
  const n0 = Math.round(start * SR);
  for (const [ratio, amp, tau] of partials) {
    const w = (TAU * f0 * ratio) / SR;
    let ph = 0;
    for (let i = n0; i < out.length; i++) {
      const t = (i - n0) / SR;
      ph += w;
      out[i] += amp * Math.min(1, t / attack) * Math.exp(-t / tau) * Math.sin(ph);
    }
  }
}

// 음높이가 미끄러지는 음: fOf(t)는 Hz, envOf(t)는 크기
function sweep(out, start, dur, fOf, envOf) {
  const n0 = Math.round(start * SR), n1 = Math.min(out.length, n0 + len(dur));
  let ph = 0;
  for (let i = n0; i < n1; i++) {
    const t = (i - n0) / SR;
    ph += (TAU * fOf(t)) / SR;
    out[i] += envOf(t) * Math.sin(ph);
  }
}

const rise = (t, a) => Math.min(1, t / a);

const KINDS = {
  // 뽁 — 짧게 떨어지는 음
  pop: () => {
    const a = new Float32Array(len(0.16));
    sweep(a, 0, 0.16, (t) => 300 + 600 * Math.exp(-t / 0.025), (t) => rise(t, 0.002) * Math.exp(-t / 0.035));
    return normalize(a, 0.8);
  },
  // 반짝 — 높은 음 셋이 차례로
  sparkle: () => {
    const a = new Float32Array(len(0.7));
    for (const [f, s] of [[1567.98, 0], [2093.0, 0.06], [2637.02, 0.12]]) tone(a, s, f, [[1, 1, 0.18], [2, 0.15, 0.08]], 0.002);
    return normalize(a, 0.6);
  },
  // 띵 — 도 · 미 · 솔 · 높은 도
  ding: ({ note = 'C5', hz } = {}) => {
    const f0 = hz ?? NOTE_HZ[note];
    if (!f0) throw new Error(`모르는 음: ${note}`);
    const a = new Float32Array(len(1.0));
    tone(a, 0, f0, [[1, 1, 0.32], [2, 0.18, 0.2], [3, 0.06, 0.14]]);
    return normalize(a, 0.75);
  },
  // 딩 — 끄덕일 때, 낮고 부드러운 종(G4)
  dong: () => {
    const a = new Float32Array(len(1.1));
    tone(a, 0, 392.0, [[1, 1, 0.4], [2, 0.25, 0.25], [2.76, 0.08, 0.15]], 0.004);
    return normalize(a, 0.7);
  },
  // 뽀용 — 위로 미끄러지며 흔들리는 음
  boing: () => {
    const a = new Float32Array(len(0.45));
    sweep(a, 0, 0.45,
      (t) => (300 + 400 * rise(t, 0.18) ** 0.8) * (1 + 0.06 * Math.sin(TAU * 12 * t) * rise(t, 0.2)),
      (t) => rise(t, 0.01) * (t < 0.2 ? 1 : Math.exp(-(t - 0.2) / 0.08)));
    return normalize(a, 0.7);
  },
  // 퐁당 — 떨어지는 물방울 + 올라오는 거품
  plop: () => {
    const a = new Float32Array(len(0.35));
    sweep(a, 0, 0.09, (t) => 250 + 950 * Math.exp(-t / 0.02), (t) => rise(t, 0.002) * Math.exp(-t / 0.03));
    sweep(a, 0.08, 0.2, (t) => 400 + 500 * rise(t, 0.08), (t) => 0.7 * rise(t, 0.005) * Math.exp(-t / 0.05));
    return normalize(a, 0.7);
  },
  // 띠링 — 미(E6) → 솔(G6)
  chime: () => {
    const a = new Float32Array(len(0.9));
    tone(a, 0, 1318.51, [[1, 1, 0.28], [2, 0.12, 0.12]]);
    tone(a, 0.11, 1567.98, [[1, 1, 0.3], [2, 0.12, 0.12]]);
    return normalize(a, 0.7);
  },
};

export function synth(kind, opts = {}) {
  const make = KINDS[kind];
  if (!make) throw new Error(`모르는 소리: ${kind}`);
  return make(opts);
}

// 16비트 PCM WAV — channels는 채널마다 같은 길이의 Float32Array
export function encodeWav(channels, sr) {
  const n = channels[0].length, ch = channels.length, bytes = n * ch * 2;
  const b = Buffer.alloc(44 + bytes);
  b.write('RIFF', 0, 'ascii'); b.writeUInt32LE(36 + bytes, 4); b.write('WAVE', 8, 'ascii');
  b.write('fmt ', 12, 'ascii'); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(ch, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * ch * 2, 28); b.writeUInt16LE(ch * 2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36, 'ascii'); b.writeUInt32LE(bytes, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      b.writeInt16LE(Math.round(Math.min(1, Math.max(-1, channels[c][i])) * 32767), o);
      o += 2;
    }
  }
  return b;
}
