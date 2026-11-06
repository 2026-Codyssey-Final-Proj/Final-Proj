import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFrame } from '../src/frame.mjs';

const f = renderFrame;
const noCaption = (ts) => { for (const t of ts) assert.doesNotMatch(f(t), /data-caption/, `t=${t}에 글자가 있음`); };

// ① 막막함
test('① 1a: 턱을 괴고 있고 아직 오류가 없다', () => {
  assert.match(f(1.0), /data-pose="chin"/);
  assert.match(f(1.0), /data-errors="0"/);
});
test('① 1b: 오류가 뜨고 머리를 감싸 쥔다', () => {
  assert.match(f(3.5), /data-pose="headgrab"/);
  assert.match(f(3.5), /data-errors="1"/);
});
test('① 플로로는 아직 없다', () => {
  for (const t of [0.5, 2.5, 4.9]) assert.doesNotMatch(f(t), /data-floro/);
});
test('① 글자 없음', () => noCaption([0, 1, 2, 3, 4, 4.97]));

// ② 만남
test('② 화면이 일렁이기 시작할 때는 아직 플로로가 없다', () => {
  assert.doesNotMatch(f(5.3), /data-floro/);
  assert.match(f(5.3), /data-laptop="glow"/);
});
test('② 플로로가 솟아오르면 깜짝, 눈이 마주친 뒤엔 기쁨', () => {
  assert.match(f(6.5), /data-floro="wow"/);
  assert.match(f(8.5), /data-floro="happy"/);
});
test('② 사람이 손을 내리고 고개를 돌린다', () => {
  assert.match(f(6.8), /data-pose="lower"/);
  assert.match(f(6.8), /data-face="surprised"/);
  assert.match(f(8.6), /data-face="smile"/);
});
test('② 끝에는 플로로가 화면 속으로 들어가 보이지 않는다', () => {
  assert.doesNotMatch(f(10.9), /data-floro/);
});
test('② 글자 없음', () => noCaption([5, 6, 7, 8, 9, 10, 10.97]));

// ③-1 화면 안으로 · ③-2 기능 4칸
test('영상은 흰 화면에서 밝아지며 시작한다', () => {
  assert.match(f(0.05), /data-fade/);
  assert.doesNotMatch(f(1.0), /data-fade/);
});
test('②→③ 플로로가 들어간 노트북 화면에서 둥근 물결이 퍼지며 ③이 열린다', () => {
  const near = f(10.9);
  assert.match(near, /data-laptop/);
  assert.ok(Number(near.match(/data-zoom="([\d.]+)"/)[1]) > 1.2, '노트북 쪽으로 다가감');
  assert.match(f(11.3), /data-wipe/);
  assert.doesNotMatch(f(12.2), /data-wipe/);
});
test('③-1 끝에는 기능 카드 4장이 보인다', () => {
  const s = f(12.8);
  for (let n = 1; n <= 4; n++) assert.match(s, new RegExp(`data-quad="${n}"`));
});
test('③-2 플로로가 도착한 칸만 켜진다: 1 → 2 → 3 → 4 → 모두', () => {
  assert.match(f(14.0), /data-active="1"/);
  assert.match(f(16.5), /data-active="2"/);
  assert.match(f(19.0), /data-active="3"/);
  assert.match(f(21.5), /data-active="4"/);
  assert.match(f(22.8), /data-active="all"/);
});
test('③-2 기능 이름 4개가 정확히 보인다', () => {
  const s = f(14.0);
  for (const label of ['① 8단계 길 안내', '② 초안은 플로로, 확정은 나', '③ 관문 · 이해하셨나요?', '④ 문서가 내 GitHub에']) assert.ok(s.includes(label), label);
});
test('③-2 칸마다 플로로 표정이 다르다', () => {
  assert.match(f(14.0), /data-floro="look"/);
  assert.match(f(16.5), /data-floro="happy"/);
  assert.match(f(18.8), /data-floro="think"/);
  assert.match(f(19.8), /data-floro="done"/);
  assert.match(f(21.8), /data-floro="done"/);
});
// ④ 성장
const zoomOf = (s) => Number(s.match(/data-zoom="([\d.]+)"/)[1]);
test('③→④ 플로로가 웅덩이로 들어가면 둥근 물결이 퍼지며 ④가 열린다', () => {
  const s = f(23.2);
  assert.match(s, /data-wipe/);
  assert.match(s, /data-person="user-standing"/);
  assert.doesNotMatch(f(24.0), /data-wipe/);
  assert.ok(zoomOf(f(24.5)) < 1.3, '사람이 잘 보이는 1.16배 근처');
});
test('④ 주인공이 손짓을 바꿔 가며 설명한다(펴기 → 가리키기)', () => {
  assert.match(f(24.8), /data-gesture="open"/);
  assert.match(f(26.0), /data-gesture="point"/);
});
test('④ 같은 사람이 서서 설명하고 평가자가 듣는다', () => {
  const s = f(25.0);
  assert.match(s, /data-person="user-standing"/);
  assert.match(s, /data-person="evaluator"/);
  assert.match(s, /data-bubble="code"/);
});
test('④ 27초에 평가자가 끄덕이고 체크 말풍선이 뜬다', () => {
  assert.doesNotMatch(f(26.5), /data-bubble="check"/);
  assert.match(f(27.3), /data-bubble="check"/);
});
test('④ 카메라가 다 빠져나온 뒤엔 글자 없음', () => noCaption([24, 25, 26, 27, 28, 29, 29.97]));

// ⑤ 여운
test('⑤ 처음엔 플로로가 없다가 노트북 화면 위로 빼꼼', () => {
  assert.doesNotMatch(f(31.0), /data-floro/);
  assert.match(f(32.2), /data-floro/);
});
test('⑤ 하트 눈으로 바라본다', () => {
  assert.match(f(33.5), /data-floro="love"/);
});
test('⑤ 카메라가 노트북 쪽으로 다가간다', () => {
  assert.ok(zoomOf(f(34.5)) > zoomOf(f(30.2)) + 0.5);
});
test('⑤ 글자 없음', () => noCaption([30, 31, 32, 33, 34, 34.97]));

// ⑥ 마무리
test('⑥ 마크 안에서 플로로가 고개를 내민다', () => {
  const s = f(36.8);
  assert.match(s, /data-mark/);
  assert.match(s, /data-floro="happy"/);
});
test('⑥ Floe 글자와 문구가 스펙 그대로', () => {
  assert.match(f(37.3), /data-caption="wordmark"[^>]*>Floe</);
  assert.ok(f(38.5).includes('당신을 위한 코딩 길잡이, Floe와 함께하세요'));
});
test('⑥ Floe 전에는 글자가 없고, 그 밖의 글자도 없다', () => {
  noCaption([35.2, 36.0, 36.8]);
  const captions = f(39.5).match(/data-caption="[^"]+"/g);
  assert.deepEqual(captions, ['data-caption="wordmark"', 'data-caption="tagline"']);
});

test('③-2 안 간 칸은 흐리고(0.3) 지나온 칸은 반쯤(0.6)', () => {
  const s = f(16.5);
  assert.match(s, /data-quad="1" opacity="0.6"/);
  assert.match(s, /data-quad="2" opacity="1"/);
  assert.match(s, /data-quad="3" opacity="0.3"/);
});
