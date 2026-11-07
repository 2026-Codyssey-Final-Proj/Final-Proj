// 45초 판 정지 그림 찍기 — claude-drafted: 2026-11-06
//   node video/render/stills45.mjs   →  keyframes/v45/kf45-*.png 11장 + storyboard45.png(한 장에 모은 판), 모두 1920×1080
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openPage, PROJECT } from './render.mjs';
import { STILLS, BOARD_FILE } from '../src/v45/stills.mjs';

const out = path.join(PROJECT, 'keyframes', 'v45');
mkdirSync(out, { recursive: true });
const page = await openPage('&v45=1');
try {
  for (let i = 0; i < STILLS.length; i++) {
    const file = path.join(out, STILLS[i].file);
    writeFileSync(file, await page.shot(i));
    console.log(file);
  }
  writeFileSync(path.join(out, BOARD_FILE), await page.shot(-1)); // 음수 = 한 장에 모은 판
  console.log(path.join(out, BOARD_FILE));
} finally {
  await page.close();
}
