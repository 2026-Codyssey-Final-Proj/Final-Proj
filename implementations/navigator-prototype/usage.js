// claude-drafted: 2026-10-17
// 토큰을 얼마나 썼는지 보여 준다 — 서버를 켜지 않아도 된다.
//   node --env-file=.env usage.js
// 통(용도)별로 몫을 나눠 쓰려면 .env에 NAV_PLAN=default (규칙·프롬프트 40만 / 사용자 테스트 20만 / 리허설·녹화 20만 / 예비 20만).
const NAMES = { dev: "규칙·프롬프트", test: "사용자 테스트", demo: "리허설·녹화", reserve: "예비" };
const n = (v) => Number(v).toLocaleString();

function format(u) {
  const lines = [`공급자: ${u.provider === "api" ? `내 API 키 (${u.model}) · 보내는 곳 ${u.host}${u.compat ? " · 호환 모드" : ""}` : "이 컴퓨터에 로그인된 Claude Code (여기서는 세지 않음)"}`];
  if (u.replay) lines.push("지금은 녹화본 재생 설정이에요 — 재생하는 동안은 토큰을 쓰지 않아요");
  lines.push(u.budget ? `전체  ${n(u.used)} / ${n(u.budget)} (${Math.round((u.used / u.budget) * 100)}%)` : `전체  ${n(u.used)} (한도 없음 — NAV_TOKEN_BUDGET이나 NAV_PLAN으로 정할 수 있어요)`);
  if (u.buckets) {
    for (const [k, b] of Object.entries(u.buckets)) {
      const name = NAMES[k] || k;
      const note = k === "reserve" && b.used === 0 ? " — 잠겨 있음 (NAV_USE_RESERVE=1일 때만 씀)" : b.used >= b.limit ? " — 다 씀" : "";
      lines.push(`  ${name.padEnd(8, "　")} ${n(b.used)} / ${n(b.limit)}${note}`);
    }
  }
  for (const [name, used] of Object.entries(u.testers || {})) lines.push(`  테스터 ${name}  ${n(used)}`);
  return lines.join("\n");
}

if (require.main === module) console.log(format(require("./provider.js").usage()));
module.exports = { format };
