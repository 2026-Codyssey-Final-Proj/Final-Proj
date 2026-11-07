// 브라우저 쪽: renderAt(t)로 한 장을 그리고, 미리 보기에서는 재생 · 시간 막대를 단다.
import { renderFrame } from './frame.mjs';
import { DURATION } from './timeline.mjs';
import { renderStill } from './v45/stills.mjs';
import { renderFrame45, DURATION45 } from './v45/film.mjs';

const stage = document.getElementById('stage');
const QUERY = new URLSearchParams(location.search);
const RENDER = QUERY.get('render') === '1';
if (RENDER) document.documentElement.classList.add('render');
// claude-drafted: 2026-11-06 — 45초 판: ?film45=1은 움직이는 영상(미리 보기도 됨), ?v45=1은 스토리보드 정지 그림(번호 0부터)
const FILM45 = QUERY.get('film45') === '1';
const draw = FILM45 ? renderFrame45 : QUERY.get('v45') === '1' ? renderStill : renderFrame;
const LENGTH = FILM45 ? DURATION45 : DURATION;

const nextPaint = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

window.renderAt = (t) => {
  stage.innerHTML = draw(t);
  return nextPaint();
};

// 두 글꼴이 실제로 불러와졌는지 — document.fonts.check는 글꼴이 아예 없어도 true라 상태로 확인한다
window.videoReady = (async () => {
  await Promise.all([
    document.fonts.load('40px "Gowun Dodum"', '가나다'),
    document.fonts.load('40px "Bagel Fat One"', 'Floe'),
  ]).catch(() => {});
  await document.fonts.ready;
  const loaded = new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')));
  return { fonts: loaded.has('Gowun Dodum') && loaded.has('Bagel Fat One') };
})();

if (!RENDER) {
  const wrap = document.getElementById('wrap');
  const play = document.getElementById('play');
  const scrub = document.getElementById('scrub');
  const time = document.getElementById('time');
  let t = 0, playing = false, last = 0;
  const fit = () => {
    const k = Math.min(innerWidth / 1920, (innerHeight - 56) / 1080);
    stage.style.transform = `scale(${k})`;
    wrap.style.width = `${1920 * k}px`; wrap.style.height = `${1080 * k}px`;
  };
  scrub.max = LENGTH - 0.01;
  const show = () => { stage.innerHTML = draw(t); scrub.value = t; time.textContent = `${t.toFixed(2)}초`; };
  const loop = (now) => {
    if (!playing) return;
    t += (now - last) / 1000; last = now;
    if (t >= LENGTH) t = 0;
    show();
    requestAnimationFrame(loop);
  };
  play.onclick = () => {
    playing = !playing; play.textContent = playing ? '멈춤' : '재생';
    if (playing) { last = performance.now(); requestAnimationFrame(loop); }
  };
  scrub.oninput = () => { t = Number(scrub.value); show(); };
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); play.click(); } });
  addEventListener('resize', fit);
  const start = Number(QUERY.get('t'));
  if (start) t = start;
  fit(); window.videoReady.then(show);
}
