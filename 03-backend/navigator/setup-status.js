// claude-drafted: 2026-10-19 — 이재엽 요청("플로로가 켜졌을때 초기 세팅을 도와주는 내용 … api키를 받든 아니면 클로드코드로 연동이 되도록 하든 둘중 하나를 선택해서 설정").
// 처음 설정 화면(02-frontend/navigator/setup.js)이 묻는 "이 컴퓨터는 지금 어떻게 AI를 부를 수 있나"를 답한다 — 서버가 GET /api/setup으로 내준다(API.md 3-10).
// 키 값 · 계정 이름 · 파일 내용은 내주지 않는다. 있다 / 없다와 claude 명령의 판(版)만.
// 그리고 서버 코드의 지문(build): 앱(Electron)이 같은 포트에 먼저 떠 있는 서버가 옛 코드인지 알아본다(2026-10-19 — 옛 서버 때문에 dmg가 옛 화면을 보였다).
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");

// provider.js의 providerOf와 같은 규칙(키가 있으면 내 키, 없으면 claude -p) — provider.js를 불러오면 사용량 파일을 여는 일이 따라와서 한 줄을 옮겼다. 시험이 둘을 맞대어 본다
const providerOf = (env) => (env.ANTHROPIC_API_KEY ? "api" : "cli");

// claude 명령이 있는지와 판(claudeVersion)은 provider.js에 있다 — claude를 띄우는 곳은 그 파일 하나라는 규칙(navigator.test.js "provider.js 한 곳에서만")

// Claude Code에 로그인했나 — ~/.claude.json에 계정 칸(oauthAccount)이 있는지만 본다. 파일이 없거나 못 읽으면 모른다(null).
// 계정 칸이 없다고 꼭 로그인 안 한 것은 아니다(API 키 로그인 등) — 화면은 false를 "필요해 보여요"로만 말하고, 확실한 것은 연결 확인으로 본다
function signedIn(home = os.homedir(), read = fs.readFileSync) {
  let j;
  try { j = JSON.parse(read(path.join(home, ".claude.json"), "utf8")); } catch { return null; }
  return !!(j && typeof j === "object" && j.oauthAccount && typeof j.oauthAccount === "object");
}

// /api/setup의 답 — 값 없이 있다 · 없다만
function status(env = process.env, { claude = { found: false, version: "" }, login = null, build = "" } = {}) {
  return {
    provider: providerOf(env), apiKey: !!env.ANTHROPIC_API_KEY, relay: !!env.ANTHROPIC_BASE_URL,
    claude: { found: !!claude.found, version: claude.version || "", signedIn: claude.found ? login : null },
    replay: !!env.NAV_REPLAY, build,
  };
}

// 서버 코드의 지문 — 파일 내용과 끝 두 칸의 경로(02-frontend/navigator/app.js → navigator/app.js)로. 저장소에서 켜든 앱 묶음(payload/)에서 켜든 같은 코드면 같다
function buildId(files, read = fs.readFileSync) {
  const h = crypto.createHash("sha256");
  for (const f of [...new Set(files)].sort((a, b) => tail(a).localeCompare(tail(b)))) {
    h.update(tail(f));
    try { h.update(read(f)); } catch { h.update("(없음)"); }
  }
  return h.digest("hex").slice(0, 12);
}
const tail = (f) => String(f).split(/[\\/]/).slice(-2).join("/");

// 연결 확인 — 아주 작은 요청 하나(API 키면 수십 토큰). 답의 모양만 본다
const CHECK_PROMPT = "Floe 연결 확인이에요. 아무 일도 하지 말고 JSON으로 {\"ok\": true}만 답하세요.";
const CHECK_SCHEMA = { type: "object", required: ["ok"], properties: { ok: { type: "boolean" } } };

module.exports = { providerOf, signedIn, status, buildId, CHECK_PROMPT, CHECK_SCHEMA };
