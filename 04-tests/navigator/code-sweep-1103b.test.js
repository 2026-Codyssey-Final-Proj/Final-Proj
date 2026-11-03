// claude-drafted: 2026-11-03 — 코드 훑어보기 3차(임유정 "전체 코드 살펴보면서 오류 날만한 부분들 체크해줘" → "19, 20, 27번 제외하고 나머지 항목들 전부 순차적으로 수정하면서 커밋해줘"). F-144-n
// 묶음: 01-docs/07-maintenance/fixes/code-sweep-1103b.md
// 실행: node --test 04-tests/navigator/code-sweep-1103b.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const BACK = path.join(__dirname, "../../03-backend/navigator");

// ── 서버 ──

test("F-144-1 mergeSection — 끝 표시가 없거나 시작보다 앞에 있어도 사람이 쓴 글을 지우지 않고, 덩이를 쌓지 않는다", () => {
  const D = require(path.join(BACK, "docs.js"));
  const S = D.MARK_START, E = D.MARK_END, block = (v) => `${S}\nFloe ${v}\n${E}`;
  // 끝 표시만 빠진 README — 두 번 올려도 '내가 쓴 설치법'이 남는다
  let t = `# 내 앱\n${S}\nFloe v1\n## 내가 쓴 설치법\nnpm i\n`;
  t = D.mergeSection(t, block("v2"));
  t = D.mergeSection(t, block("v3"));
  assert.match(t, /## 내가 쓴 설치법\nnpm i/, t);
  assert.match(t, /Floe v3/);
  assert.doesNotMatch(t, /Floe v2/, "새 덩이로 바뀐다");
  // 끝 표시가 시작보다 앞 — 올릴 때마다 덩이가 하나씩 쌓이지 않는다
  let u = `${E}\n# 앱\n${S}\nFloe v1\n${E}\n끝\n`;
  u = D.mergeSection(u, block("v2"));
  u = D.mergeSection(u, block("v3"));
  assert.equal(u.split(S).length - 1, 1, u);
  assert.match(u, /Floe v3\n<!-- floe:end -->\n끝/);
  // 짝이 맞으면 전과 같다
  assert.equal(D.mergeSection(`앞\n${block("v1")}\n뒤`, block("v2")), `앞\n${block("v2")}\n뒤`);
});
