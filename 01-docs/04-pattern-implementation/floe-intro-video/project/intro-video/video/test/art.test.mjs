import { test } from 'node:test';
import assert from 'node:assert/strict';
import { C } from '../src/art/palette.mjs';
import { seatedBack, standingUser, evaluator, POSE_ARMS, lerpArms } from '../src/art/people.mjs';
import { windows, laptopSide, desk1, laptopTable4, quadrant, mark, heart, spark, puddle, codeBubble, checkBubble, LABELS } from '../src/art/props.mjs';
import { floro } from '../src/floro.mjs';

test('색은 스펙 4절 값 그대로', () => {
  const spec = {
    sky: '#CDEBFA', blob: '#E2F4FD', screen: '#EEF5FF', navy: '#1F2A5A', ink: '#16226A',
    skin: '#EFA486', skinShade: '#D9876B', sweater: '#5B8FE8', sweaterDark: '#3E6FD1', collar: '#4A7DDB',
    evalSweater: '#2F7D6D', evalPants: '#E8D6B5', laptop: '#5B8AD6', mug: '#F2B33D', err: '#FF5D5D',
    f1: '#2F6BFF', f2: '#14B8A6', f3: '#F5A524', f4: '#8B5CF6', markA: '#3A5FE0', markB: '#16226A',
  };
  for (const [k, v] of Object.entries(spec)) assert.equal(C[k], v, k);
});

test('플로로는 팀 코드(NavSeal)로 그리고 크기는 scale로만 바꾼다', () => {
  const s = floro('happy', { x: 0, y: 0, size: 40 });
  assert.match(s, /class="cat m-happy"/);
  assert.match(s, /scale\(0\.333/);
  assert.match(s, /data-floro="happy"/);
  assert.doesNotMatch(s, /class="c-tail"/, '꼬리는 기본으로 뺀다');
});

test('플로로를 좌우로 뒤집을 수 있다', () => {
  assert.match(floro('idle', { x: 10, y: 20, size: 60, flip: true }), /scale\(-0\.500/);
});

test('플로로 아래를 잘라(물속에 잠긴 것처럼) 그릴 수 있다', () => {
  const s = floro('wow', { x: 50, y: 100, size: 40, clipY: 90 });
  assert.match(s, /<clipPath id="[^"]+"><rect[^>]*height="1090"/);
});

test('기능 칸 이름 4개가 스펙 글자 그대로, data-caption이 붙는다', () => {
  assert.deepEqual(LABELS, ['① 8단계 길 안내', '② 초안은 플로로, 확정은 나', '③ 관문 · 이해하셨나요?', '④ 문서가 내 GitHub에']);
  for (let n = 1; n <= 4; n++) {
    const q = quadrant(n, {});
    assert.ok(q.includes(LABELS[n - 1]), `칸 ${n}`);
    assert.match(q, /data-caption/);
    assert.match(q, new RegExp(`data-quad="${n}"`));
  }
});

test('기능 칸 밝기(dim)가 투명도로 들어간다', () => {
  assert.match(quadrant(2, { dim: 0.3 }), /opacity="0\.3"/);
});

test('칸 안 단추 말은 앱의 말 그대로', () => {
  const q2 = quadrant(2, { p: 1 }), q3 = quadrant(3, { p: 1 }), q4 = quadrant(4, { p: 1 });
  for (const w of ['맞아요', '고칠래요']) assert.ok(q2.includes(w), w);
  for (const w of ['이해하셨나요?', '예', '아니요', '배운 것 한 줄']) assert.ok(q3.includes(w), w);
  assert.ok(q4.includes('내 저장소'));
});

test('사람: 자세와 누구인지가 data 속성으로 남는다', () => {
  assert.match(seatedBack({ pose: 'headgrab' }), /data-pose="headgrab"/);
  assert.match(seatedBack({ pose: 'chin' }), /data-person="user"/);
  assert.match(standingUser({ gesture: 'open' }), /data-person="user-standing"/);
  assert.match(standingUser({ gesture: { from: 'open', to: 'point', k: 0.8 } }), /data-gesture="point"/);
  assert.match(evaluator({ nod: 0.5 }), /data-person="evaluator"/);
});

// 두 선분이 끝점이 아닌 곳에서 만나는지
const cross = ([a, b], [c, d]) => {
  const d1 = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
  if (Math.abs(d1) < 1e-9) return false;
  const s = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / d1;
  const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / d1;
  return s > 0 && s < 1 && u > 0 && u < 1;
};
const segs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);

test('뒤돌아 앉은 사람: 한 자세 안에서 팔끼리 교차하지 않는다(팔이 겹쳐 보이는 문제)', () => {
  for (const [pose, arms] of Object.entries(POSE_ARMS)) {
    for (let i = 0; i < arms.length; i++) {
      for (let j = i + 1; j < arms.length; j++) {
        for (const s1 of segs(arms[i].pts)) for (const s2 of segs(arms[j].pts)) {
          assert.ok(!cross(s1, s2), `${pose}: 팔 ${i}와 ${j}가 교차 (${JSON.stringify(s1)} × ${JSON.stringify(s2)})`);
        }
      }
    }
  }
});

test('자세 사이를 이어 주는 중간 동작: 끝점은 두 자세와 같다', () => {
  const a = POSE_ARMS.chin, b = POSE_ARMS.headgrab;
  assert.deepEqual(lerpArms(a, b, 0).map((x) => x.pts), a.map((x) => x.pts));
  assert.deepEqual(lerpArms(a, b, 1).map((x) => x.pts), b.map((x) => x.pts));
  const mid = lerpArms(a, b, 0.5)[0].pts[1];
  assert.ok(mid[1] > b[0].pts[1][1] && mid[1] < a[0].pts[1][1], '팔꿈치가 두 자세 사이에 있다');
});

test('자세가 바뀌어도 팔 수는 같다(사라졌다 생기지 않고 몸 뒤에서 나온다)', () => {
  const counts = Object.values(POSE_ARMS).map((x) => x.length);
  assert.ok(counts.every((c) => c === counts[0]), JSON.stringify(counts));
});

test('사람이 눈을 깜빡일 수 있다', () => {
  assert.match(standingUser({ blink: true }), /data-blink="1"/);
  assert.match(evaluator({ blink: true }), /data-blink="1"/);
  assert.match(standingUser({ blink: false }), /data-blink="0"/);
});

test('사람 그림에는 글자가 없다', () => {
  for (const s of [seatedBack({ pose: 'lower', turn: 1, face: 'surprised' }), standingUser({ gesture: 'point', talk: 1 }), evaluator({ nod: 1, checks: 3 })]) {
    assert.doesNotMatch(s, /<text/);
  }
});

test('말풍선의 </>는 글자가 아니라 선으로 그린다', () => {
  assert.doesNotMatch(codeBubble(0, 0, 1), /<text/);
  assert.doesNotMatch(checkBubble(0, 0, 1), /<text/);
});

test('소품은 SVG 조각을 돌려준다', () => {
  for (const s of [windows({ errors: 1 }), laptopSide({ screen: 'error' }), laptopSide({ screen: 'glow', ripple: 0.5 }), desk1({ t: 1 }),
    laptopTable4({ inner: '<rect/>' }), mark({ x: 160, y: 60, size: 44 }), heart(1, 2, 3), spark(1, 2, 3), puddle(10, 10, 5)]) {
    assert.ok(s.trim().startsWith('<'), s.slice(0, 30));
  }
  assert.match(windows({ errors: 1 }), /data-errors="1"/);
  assert.match(windows({ errors: 0 }), /data-errors="0"/);
});
