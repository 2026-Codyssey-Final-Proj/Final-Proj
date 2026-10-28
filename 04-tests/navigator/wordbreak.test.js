// claude-drafted: 2026-10-29 — F-76(작업실 개편 PRD · TASK T01 · T02, 두승현): 작업실 · 섬의 한국어는 낱말 사이에서만 줄을 바꾼다(word-break: keep-all).
//   긴 영문 · 경로는 칸 안에서 끊는다(overflow-wrap: anywhere). 글자 모양으로 본다(브라우저 없이) — 화면에서 계산 스타일로 재는 것은 04-tests/e2e/responsive.test.js
// 실행: node --test 04-tests/navigator/wordbreak.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const css = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.css"), "utf8");

test("app.css — 섬(.isl · .pill) · 작업실(.win) · 섬 옆 칸(.isl-col) · 말풍선(.hello-bub)은 keep-all, 긴 영문 · 경로는 anywhere로 칸 안에서 끊는다", () => {
  const m = [...css.matchAll(/^([^{\n]*)\{([^}]*)\}/gm)].find((x) => /word-break:keep-all/.test(x[2]) && /overflow-wrap:anywhere/.test(x[2]));   // 두 선언이 든 블록(순서 · 다른 선언은 상관없이 — 새 맥락 리뷰 2026-10-29)
  assert.ok(m, "keep-all + anywhere가 함께 든 규칙 하나");
  const sels = m[1].split(",").map((s) => s.trim());
  for (const s of [".isl", ".pill", ".win", ".isl-col", ".hello-bub"]) assert.ok(sels.includes(s), `${s}가 그 규칙에 든다 — 있는 것: ${sels.join(" ")}`);
  assert.ok(!/word-break:break-all/.test(css), "break-all은 한국어를 낱말 중간에서 끊는다 — 쓰지 않는다");
});
