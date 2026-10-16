// claude-drafted: 2026-10-17
// 내 키(또는 로그인)로 실제 Claude가 답하는지 확인한다 — 아주 작은 호출 하나(수백 토큰). 키 값은 출력하지 않는다.
//   node --env-file=.env smoke.js
const { callClaude, usage } = require("./provider.js");

const SCHEMA = { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false };

(async () => {
  const u = usage();
  console.log(`공급자: ${u.provider === "api" ? `내 API 키 (${u.model})` : "이 컴퓨터에 로그인된 Claude Code"}`);
  const r = await callClaude("ok 칸을 true로 답하세요.", SCHEMA);
  if (r.error) { console.error(`실패: ${r.error}`); process.exit(1); }
  const after = usage();
  console.log(`성공 — 이번 호출 ${r.tokens}토큰${after.provider === "api" ? `, 지금까지 ${after.used.toLocaleString()}토큰${after.budget ? ` / 한도 ${after.budget.toLocaleString()}` : ""}` : ""}`);
})();
