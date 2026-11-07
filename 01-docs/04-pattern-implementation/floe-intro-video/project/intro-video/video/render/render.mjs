// 영상 찍기: 크롬으로 1/30초마다 화면을 찍어 ffmpeg 표준 입력에 바로 흘린다(프레임 PNG를 OneDrive에 쌓지 않음).
//   node video/render/render.mjs [--from 0] [--to 40] [--out build/video-noaudio.mp4]
//   node video/render/render.mjs --stills 1.0,3.5        → build/stills/t-1.00.png …
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../serve.mjs';
import { launchChrome } from './cdp.mjs';
import { frameTimes, FPS } from '../src/timeline.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT = path.resolve(HERE, '..', '..'); // intro-video/

// PNG(RGB) → H.264. 색은 BT.709로 바꾸고 태그를 붙인다 — 기본값(BT.601, 태그 없음)이면 재생기가 709로 읽어 색이 탁해진다.
// crf 14 + animation 튜닝: 넓은 단색 면과 또렷한 경계가 많은 그림 영상에 맞춘 품질
export const encodeArgs = (out) => ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
  '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', '14',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-r', String(FPS), '-movflags', '+faststart', out];

function parseArgs(argv) {
  const a = { from: 0, to: Infinity, out: path.join(PROJECT, 'build', 'video-noaudio.mp4'), stills: null, stillsDir: path.join(PROJECT, 'build', 'stills') };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--from') { a.from = Number(v); i++; }
    else if (k === '--to') { a.to = Number(v); i++; }
    else if (k === '--out') { a.out = path.resolve(v); i++; }
    else if (k === '--stills') { a.stills = v.split(',').map(Number); i++; }
    else if (k === '--stills-dir') { a.stillsDir = path.resolve(v); i++; }
  }
  return a;
}

// query: 주소 뒤에 더 붙일 것(예: '&v45=1' — 45초 판 정지 그림, render/stills45.mjs가 쓴다)
export async function openPage(query = '') {
  const srv = await startServer({ port: 0 });
  const chrome = await launchChrome();
  await chrome.send('Page.enable');
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  const loaded = chrome.once('Page.loadEventFired');
  await chrome.send('Page.navigate', { url: `${srv.url}/intro-video/video/index.html?render=1${query}` });
  await loaded;
  const ready = await chrome.evaluate('window.videoReady');
  if (!ready || !ready.fonts) throw new Error('글꼴(Gowun Dodum · Bagel Fat One)을 불러오지 못해 멈춤');
  const shot = async (t) => {
    const anims = await chrome.evaluate(`window.renderAt(${t}).then(() => document.getAnimations().length)`);
    if (anims !== 0) throw new Error(`t=${t}: CSS 움직임 ${anims}개가 돌고 있음 — 프레임이 일정하지 않게 찍힘`);
    const { data } = await chrome.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } });
    return Buffer.from(data, 'base64');
  };
  const close = async () => { await chrome.close(); await srv.close(); };
  return { shot, close };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const page = await openPage();
  try {
    if (args.stills) {
      mkdirSync(args.stillsDir, { recursive: true });
      for (const t of args.stills) {
        const file = path.join(args.stillsDir, `t-${t.toFixed(2)}.png`);
        writeFileSync(file, await page.shot(t));
        console.log(file);
      }
      return;
    }
    const times = frameTimes().filter((t) => t >= args.from - 1e-9 && t < args.to - 1e-9);
    mkdirSync(path.dirname(args.out), { recursive: true });
    const ff = spawn('ffmpeg', encodeArgs(args.out), { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((resolve, reject) => ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg 종료 코드 ${code}`)))));
    const started = Date.now();
    for (let i = 0; i < times.length; i++) {
      const png = await page.shot(times[i]);
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
      if ((i + 1) % 60 === 0 || i === times.length - 1) console.log(`프레임 ${i + 1}/${times.length} (${((Date.now() - started) / 1000).toFixed(0)}초)`);
    }
    ff.stdin.end();
    await done;
    console.log(`완성: ${args.out}`);
  } finally {
    await page.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
