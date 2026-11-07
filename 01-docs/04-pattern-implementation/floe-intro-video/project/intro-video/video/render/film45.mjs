// 45초 판 영상 만들기 — claude-drafted: 2026-11-06
//   node video/render/film45.mjs --out <완성 mp4> [--work <중간 파일 폴더>] [--bgm build/bgm/suno-a-feed6383.mp3]
//   node video/render/film45.mjs --stills 2.5,13.1 --stills-dir <폴더>     확인용 정지 그림만
//   --reuse 1: 중간 폴더에 찍어 둔 그림(video-noaudio.mp4)이 있으면 다시 찍지 않고 소리만 다시 섞는다
// 차례: ① 크롬으로 1,350장을 찍어 ffmpeg로 묶고(소리 없음) ② 효과음 트랙을 합성하고 ③ 배경음악과 섞는다.
// 배경음악은 앞 45초만 쓰고 −23 LUFS로 맞춘 뒤 0~1초에 커지고 42~45초에 작아진다(40초 판 mux.mjs와 같은 방식).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openPage, encodeArgs, PROJECT } from './render.mjs';
import { SR, encodeWav } from '../audio/synth.mjs';
import { buildSfxTrack } from '../audio/track.mjs';
import { frameTimes45, DURATION45, CUES45 } from '../src/v45/film.mjs';

// 효과음을 2 dB 낮춘다 — 40초 판(11번)보다 효과음이 많아(30번) 그대로 섞으면 전체 −14.8 LUFS · 최고 −0.4 dBFS로 커진다(2026-11-06 잰 값). 40초 판은 −16.9 LUFS
const SFX_DB = -2;
const args = { reuse: false, out: null, work: path.join(PROJECT, 'build', 'v45'), bgm: path.join(PROJECT, 'build', 'bgm', 'suno-a-feed6383.mp3'), stills: null, stillsDir: null };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  const k = argv[i].replace(/^--/, ''), v = argv[i + 1];
  if (k === 'stills') args.stills = v.split(',').map(Number);
  else if (k === 'stills-dir') args.stillsDir = path.resolve(v);
  else if (k === 'out' || k === 'work' || k === 'bgm') args[k] = v === 'none' ? null : path.resolve(v);
  else if (k === 'reuse') args.reuse = v === '1';
}
const run = (cmd, a, stdin = 'ignore') => {
  const p = spawn(cmd, a, { stdio: [stdin, 'inherit', 'inherit'] });
  return { p, done: new Promise((resolve, reject) => p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} 종료 코드 ${code}`))))) };
};

const silent = path.join(args.work, 'video-noaudio.mp4'), sfx = path.join(args.work, 'sfx-track.wav');
const shoot = Boolean(args.stills) || !(args.reuse && existsSync(silent)); // 그림을 (다시) 찍을지
const page = shoot ? await openPage('&film45=1') : null;
try {
  if (args.stills) {
    const dir = args.stillsDir || path.join(args.work, 'stills');
    mkdirSync(dir, { recursive: true });
    for (const t of args.stills) writeFileSync(path.join(dir, `t-${t.toFixed(2)}.png`), await page.shot(t));
    console.log(`정지 그림 ${args.stills.length}장: ${dir}`);
  } else {
    if (!args.out) throw new Error('필요: --out <완성 mp4>');
    mkdirSync(args.work, { recursive: true });
    mkdirSync(path.dirname(args.out), { recursive: true });
    // ① 그림
    if (shoot) {
      const times = frameTimes45(), ff = run('ffmpeg', encodeArgs(silent), 'pipe'), started = Date.now();
      for (let i = 0; i < times.length; i++) {
        const png = await page.shot(times[i]);
        if (!ff.p.stdin.write(png)) await new Promise((r) => ff.p.stdin.once('drain', r));
        if ((i + 1) % 150 === 0 || i === times.length - 1) console.log(`프레임 ${i + 1}/${times.length} (${((Date.now() - started) / 1000).toFixed(0)}초)`);
      }
      ff.p.stdin.end();
      await ff.done;
    }
    // ② 효과음
    const mono = buildSfxTrack(CUES45, { duration: DURATION45 });
    writeFileSync(sfx, encodeWav([mono, mono], SR));
    // ③ 섞기
    const D = DURATION45;
    const filter = args.bgm
      ? `[2:a]atrim=0:${D},asetpts=PTS-STARTPTS,loudnorm=I=-23:TP=-3:LRA=11,aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=1,afade=t=out:st=${D - 3}:d=3[b];`
        + `[1:a]volume=${SFX_DB}dB,aformat=sample_rates=48000:channel_layouts=stereo[s];[s][b]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]`
      : `[1:a]volume=${SFX_DB}dB,aformat=sample_rates=48000:channel_layouts=stereo[a]`;
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', sfx, ...(args.bgm ? ['-i', args.bgm] : []), '-filter_complex', filter, '-map', '0:v', '-map', '[a]',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', String(D), '-movflags', '+faststart', args.out]).done;
    console.log(`완성: ${args.out}`);
  }
} finally {
  if (page) await page.close();
}
