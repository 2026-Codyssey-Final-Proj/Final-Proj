// 시간 t(초)의 화면 한 장을 SVG 문자열로 — 영상 전체가 이 순수 함수 하나로 그려진다.
import { sceneAt } from './timeline.mjs';
import * as s1 from './scenes/s1.mjs';
import * as s2 from './scenes/s2.mjs';
import * as s3 from './scenes/s3.mjs';
import * as s4 from './scenes/s4.mjs';
import * as s5 from './scenes/s5.mjs';
import * as s6 from './scenes/s6.mjs';

// 장면별 그리기(draw(t) → 배경까지 포함한 SVG 조각)
export const DRAW = { '1a': s1.draw, '1b': s1.draw, '2': s2.draw, '3-1': s3.draw, '3-2': s3.draw, '4': s4.draw, '5': s5.draw, '6': s6.draw };

const PLACEHOLDER = { '1a': '#CDEBFA', '1b': '#BFE3F8', '2': '#CDEBFA', '3-1': '#EEF5FF', '3-2': '#E4EEFF', '4': '#CDEBFA', '5': '#BFE3F8', '6': '#FFFFFF' };

export function renderFrame(t) {
  const s = sceneAt(t);
  const body = DRAW[s.id] ? DRAW[s.id](t) : `<rect width="320" height="180" fill="${PLACEHOLDER[s.id]}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="1920" height="1080" data-scene="${s.id}" data-t="${t.toFixed(3)}" font-family="'Gowun Dodum','Malgun Gothic',sans-serif">${body}</svg>`;
}
