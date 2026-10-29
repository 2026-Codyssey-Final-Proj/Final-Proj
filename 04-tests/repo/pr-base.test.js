// claude-drafted: 2026-10-29 — 변경 리뷰(성장 로그 2026-10-29) 이재엽 버튼 "체크리스트 + 기계 확인"(F-79).
// PR의 base가 main이 아니면 빨갛게 — .github/workflows/pr-base.yml의 모양을 본다(셸은 돌리지 않는다 — Windows에서도 같게).
// 실행: node --test 04-tests/repo/pr-base.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const yml = fs.readFileSync(path.join(__dirname, "../../.github/workflows/pr-base.yml"), "utf8");
const code = yml.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");   // 주석 줄 뺌

test("어느 base로 연 PR이든 돌고, base를 바꾸면 다시 돈다", () => {
  assert.match(code, /^on:\s*\n\s+pull_request:/m);
  assert.doesNotMatch(code.split(/^jobs:/m)[0], /branches/, "branches를 걸면 main이 아닌 base의 PR에서 안 돈다");
  assert.match(code, /types:.*\bedited\b/, "edited가 없으면 base를 main으로 바꿔도 다시 돌지 않는다");
});

test("base 이름은 env로만 받는다 — ${{ }}는 BASE 줄 하나뿐(브랜치 이름이 셸 명령이 되지 않게), 권한은 비움", () => {
  const exprs = code.split("\n").filter((l) => l.includes("${{"));
  assert.deepEqual(exprs.map((l) => l.trim()), ["BASE: ${{ github.base_ref }}"]);
  assert.match(code, /permissions:\s*\{\}/);
});

test("main이 아니면 이유 한 줄과 함께 실패한다", () => {
  assert.match(code, /\[ "\$BASE" = "main" \]/);
  assert.match(code, /::error::[^\n]*\$BASE[^\n]*main/);
  assert.match(code, /exit 1/);
});
