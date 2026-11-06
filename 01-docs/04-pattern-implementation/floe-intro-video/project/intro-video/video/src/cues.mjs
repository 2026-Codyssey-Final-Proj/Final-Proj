// 효과음 시점 — 스펙(storyboard.md 5절) 그대로. 그림 쪽도 이 값을 읽어 소리와 움직임이 어긋나지 않게 한다.
export const SFX_CUES = [
  { t: 6.0, kind: 'pop' },
  { t: 8.0, kind: 'sparkle' },
  { t: 13.3, kind: 'ding', note: 'C5' },
  { t: 15.8, kind: 'ding', note: 'E5' },
  { t: 18.3, kind: 'ding', note: 'G5' },
  { t: 20.8, kind: 'ding', note: 'C6' },
  { t: 27.0, kind: 'dong' },
  { t: 31.5, kind: 'boing' },
  { t: 33.0, kind: 'sparkle' },
  { t: 35.9, kind: 'plop' },
  { t: 36.6, kind: 'chime' },
];

export const NOTE_HZ = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5 };

// ③-2에서 플로로가 칸에 닿는 시점 = 띵 시점
export const FLORO_ARRIVALS = SFX_CUES.filter((c) => c.kind === 'ding').map((c) => c.t);
