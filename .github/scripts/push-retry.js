// claude-drafted: 2026-10-29 — 변경 리뷰(성장 로그 2026-10-29)에서 이재엽 버튼 "이 리뷰 PR에서 같이"(fix-map F-80).
// 같은 분에 병합이 겹치면 합친 CHANGELOG 커밋의 push가 'fetch first'로 거절됐다(#244 · #252). concurrency는 Action 실행끼리만 줄을 세우고,
// 그사이 GitHub 화면에서 병합된 커밋은 막지 못한다. 그래서 거절되면 최신 main을 받아 그 위로 얹고(pull --rebase) 다시 올린다 — 최대 3번.
// 얹지 못하면(누가 CHANGELOG 맨 위를 직접 고침 · 받기 실패) 되돌리고 실패로 끝낸다 — 번호를 다시 매겨야 하므로 남은 조각은 다음 실행이 합친다.
// 시험: 04-tests/repo/push-retry.test.js
"use strict";

const TRIES = 3;

// git(args) → 성공했으면 true
function pushWithRetry(git, { log = console.log } = {}) {
  for (let i = 1; i <= TRIES; i++) {
    if (git(["push", "origin", "HEAD:main"])) return 0;
    if (i === TRIES) break;
    log(`::warning::push가 거절됨 — 최신 main을 받아 그 위로 얹고 다시 올린다 (${i}/${TRIES})`);
    if (!git(["pull", "--rebase", "origin", "main"])) {
      git(["rebase", "--abort"]);
      log("::error::최신 main 위로 얹지 못함(부딪침 또는 받기 실패) — CHANGELOG 맨 위를 직접 고친 커밋이 있는지 보세요. 남은 조각은 다음 실행이 합친다");
      return 1;
    }
  }
  log(`::error::${TRIES}번 올려도 거절됨`);
  return 1;
}

module.exports = { pushWithRetry };

if (require.main === module) {
  const { spawnSync } = require("node:child_process");
  process.exit(pushWithRetry((args) => spawnSync("git", args, { stdio: "inherit" }).status === 0));
}
