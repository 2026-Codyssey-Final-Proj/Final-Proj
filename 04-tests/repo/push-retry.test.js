// claude-drafted: 2026-10-29 — 변경 리뷰(성장 로그 2026-10-29) 이재엽 버튼 "이 리뷰 PR에서 같이"(F-80).
// 진짜 git은 부르지 않는다 — 가짜 git이 받은 명령을 적어 두고 정해 둔 답(성공 / 실패)을 돌려준다.
// 실행: node --test 04-tests/repo/push-retry.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../../.github/scripts/push-retry.js");

// answers: 명령 이름(push · pull · rebase)마다 차례로 돌려줄 성공 여부. 다 쓰면 성공
function fakeGit(answers = {}) {
  const calls = [];
  const git = (args) => {
    calls.push(args.join(" "));
    const q = answers[args[0]];
    return q && q.length ? q.shift() : true;
  };
  return { git, calls };
}
const quiet = () => {};

test("처음 push가 되면 한 번으로 끝난다", () => {
  const { git, calls } = fakeGit();
  assert.equal(P.pushWithRetry(git, { log: quiet }), 0);
  assert.deepEqual(calls, ["push origin HEAD:main"]);
});

test("main이 그새 바뀌어 거절되면 최신 main 위로 얹고 다시 올린다", () => {
  const { git, calls } = fakeGit({ push: [false, true] });
  const logs = [];
  assert.equal(P.pushWithRetry(git, { log: (s) => logs.push(s) }), 0);
  assert.deepEqual(calls, ["push origin HEAD:main", "pull --rebase origin main", "push origin HEAD:main"]);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /^::warning::/);
});

test("얹다가 부딪치면 되돌리고 실패로 끝낸다 — 다시 올리지 않는다", () => {
  const { git, calls } = fakeGit({ push: [false], pull: [false] });
  const logs = [];
  assert.equal(P.pushWithRetry(git, { log: (s) => logs.push(s) }), 1);
  assert.deepEqual(calls, ["push origin HEAD:main", "pull --rebase origin main", "rebase --abort"]);
  assert.match(logs.at(-1), /^::error::/);
});

test("세 번 다 거절되면 실패 — push 셋, 얹기 둘", () => {
  const { git, calls } = fakeGit({ push: [false, false, false] });
  assert.equal(P.pushWithRetry(git, { log: quiet }), 1);
  assert.equal(calls.filter((c) => c.startsWith("push")).length, 3);
  assert.equal(calls.filter((c) => c.startsWith("pull")).length, 2);
  assert.equal(calls.at(-1), "push origin HEAD:main");
});
