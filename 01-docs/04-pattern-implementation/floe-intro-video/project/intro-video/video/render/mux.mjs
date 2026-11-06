// 영상 + 효과음 (+ 배경음악)을 섞어 mp4 한 개로.
//   node video/render/mux.mjs --video build/video-noaudio.mp4 --sfx build/sfx-track.wav [--bgm build/bgm.mp3] --out final/floe-intro-40s.mp4
// 배경음악은 40초로 자르고 크기를 −23 LUFS로 맞춘 뒤(효과음 약 −13 LUFS보다 10 dB쯤 작게) 0–1초 페이드 인, 37–40초 페이드 아웃.
// (처음 계획은 '−14 dB 깎기'였지만 Suno 곡이 −14.6 LUFS라 그러면 −28 LUFS로 너무 작아져서, 곡이 바뀌어도 같은 크기가 되도록 목표 크기로 맞춘다)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BGM_LUFS = -23;

export function muxArgs({ video, sfx, bgm, out }) {
  const inputs = ['-i', video, '-i', sfx, ...(bgm ? ['-i', bgm] : [])];
  const filter = bgm
    ? `[2:a]atrim=0:40,asetpts=PTS-STARTPTS,loudnorm=I=${BGM_LUFS}:TP=-3:LRA=11,aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=1,afade=t=out:st=37:d=3[b];`
      + '[1:a]aformat=sample_rates=48000:channel_layouts=stereo[s];[s][b]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]'
    : '[1:a]aformat=sample_rates=48000:channel_layouts=stereo[a]';
  return ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', '40', '-movflags', '+faststart', out];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) a[argv[i].replace(/^--/, '')] = argv[i + 1];
  if (!a.video || !a.sfx || !a.out) { console.error('필요: --video --sfx --out [--bgm]'); process.exit(2); }
  mkdirSync(path.dirname(path.resolve(a.out)), { recursive: true });
  const ff = spawn('ffmpeg', muxArgs(a), { stdio: 'inherit' });
  ff.on('close', (code) => { if (code === 0) console.log(`완성: ${a.out}`); else { console.error(`ffmpeg 종료 코드 ${code}`); process.exitCode = 1; } });
}
