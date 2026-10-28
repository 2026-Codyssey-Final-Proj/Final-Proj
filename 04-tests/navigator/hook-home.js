// claude-drafted: 2026-10-28 — 시험 도우미(F-69): 맡기기 전에 서버가 허락 훅이 있는지 본다(connect.js hookReady).
// 시험의 가짜 claude가 도는 폴더마다 훅을 달지 않고, Claude Code의 사용자 설정 자리(CLAUDE_CONFIG_DIR)를 시험 폴더로 돌려 거기 한 번 단다.
// 돌려주는 것: 그 폴더 경로 — process.env.CLAUDE_CONFIG_DIR에 넣는다. *.test.js가 아니라 혼자 돌지 않는다
const fs = require("node:fs");
const path = require("node:path");
const C = require(path.join(__dirname, "../../03-backend/navigator/connect.js"));

module.exports = function hookHome(tmp) {
  const dir = path.join(tmp, "claude-home");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify(C.addHooks({}, C.COMMAND)));
  return dir;
};
