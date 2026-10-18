// claude-drafted: 2026-10-19 — Floe 오버레이 앱(Electron 껍데기)의 순수 함수 — electron 모듈 없이 Node에서 시험한다(04-tests/navigator/electron-lib.test.js).
// 앱이 하는 일 중 "파일 · 글자"만 다루는 부분: 어디에 코드가 있나(개발 중 · 묶은 뒤), .env 읽기, 로그인 셸의 PATH 합치기, 훅 명령, 프로젝트 폴더 연결.
// AI를 부르지 않는다 — 그건 서버(provider.js) 하나다.
const fs = require("node:fs");
const path = require("node:path");

// 코드가 있는 자리 — 개발 중(electron .)은 저장소의 02-frontend · 03-backend, 묶은 뒤(app.asar)는 payload/ 아래(prebuild.js가 복사)
function paths(isPackaged, dirname) {
  const root = isPackaged ? path.join(dirname, "payload") : path.join(dirname, "../..");
  return { root, backend: path.join(root, "03-backend/navigator"), frontend: path.join(root, "02-frontend") };
}

// .env 글 → {KEY: VALUE}. 주석(#) · 빈 줄은 건너뛰고, 양끝 따옴표는 뗀다. 값은 돌려주기만 하고 어디에도 출력하지 않는다
function parseEnv(text) {
  const out = {};
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
// 환경에 더한다 — 이미 있는 값은 그대로(터미널에서 준 값이 .env보다 먼저)
function applyEnv(env, parsed) {
  for (const [k, v] of Object.entries(parsed)) if (env[k] === undefined || env[k] === "") env[k] = v;
  return env;
}

// Mac에서 더블클릭으로 연 앱은 PATH가 짧아 `claude`(~/.local/bin)를 못 찾는다 — 로그인 셸의 PATH를 합친다. 순서는 셸 것이 먼저, 겹치면 하나만
function mergePath(current, shellPath, sep = path.delimiter) {
  const parts = [...String(shellPath || "").split(sep), ...String(current || "").split(sep)].filter(Boolean);
  return [...new Set(parts)].join(sep);
}

// Claude Code 훅 명령 — 묶은 앱 안(app.asar)의 파일은 node가 못 읽으므로 풀어 둔 자리(app.asar.unpacked)를 가리킨다(package.json asarUnpack)
function hookCommand(hookPath) {
  const p = String(hookPath).replace(/app\.asar(?=[\\/])/, "app.asar.unpacked").replace(/\\/g, "/");
  return `node "${p}"`;
}

// 프로젝트 폴더에 훅을 더하거나(add=true) 뺀다 — connect.js와 같은 규칙 · 같은 자리(.claude/settings.local.json) · 백업 먼저.
// 돌려주는 것: 사람에게 보일 한 줄. 설정 파일이 JSON이 아니면 아무것도 바꾸지 않고 이유를 돌려준다
function connectDir(dir, backend, add = true, { now = new Date() } = {}) {
  const C = require(path.join(backend, "connect.js"));
  const file = path.join(dir, ".claude", "settings.local.json");
  let before = {};
  if (fs.existsSync(file)) {
    try { before = JSON.parse(fs.readFileSync(file, "utf8")); }
    catch { return { ok: false, message: `${file} 를 읽을 수 없어요(JSON 모양이 아니에요). 아무것도 바꾸지 않았어요.` }; }
  }
  const after = add ? C.addHooks(before, hookCommand(path.join(backend, "hook.js"))) : C.removeHooks(before);
  if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak-${now.toISOString().replace(/[:.]/g, "-")}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(after, null, 2) + "\n");
  return { ok: true, message: add ? `연결했어요: ${dir}\n이 폴더에서 Claude Code를 새로 열면 플로로가 작업을 알아채요.` : `연결을 뺐어요: ${dir}` };
}

// ── 처음 설정(2026-10-19) — 화면(setup.js)이 preload를 거쳐 키를 넣고 뺀다. 값은 어디에도 출력하지 않는다 ──
// .env 글에서 KEY를 바꾸거나(값) 지운다(null). 다른 줄 · 주석은 그대로, 같은 KEY가 여러 줄이면 하나로. 끝은 줄바꿈 하나
function setEnvLines(text, updates) {
  const seen = new Set(), out = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
    if (m && Object.prototype.hasOwnProperty.call(updates, m[1])) {
      if (!seen.has(m[1]) && updates[m[1]] != null) out.push(`${m[1]}=${updates[m[1]]}`);
      seen.add(m[1]);
      continue;
    }
    out.push(line);
  }
  while (out.length && out[out.length - 1].trim() === "") out.pop();   // 끝의 빈 줄은 덧붙이기 전에 걷는다
  for (const [k, v] of Object.entries(updates)) if (!seen.has(k) && v != null) out.push(`${k}=${v}`);
  return `${out.join("\n").replace(/\n+$/, "")}\n`.replace(/^\n$/, "");
}
// 키 모양 — 띄어쓰기 · 따옴표 없이 20~400자. 중계 서버(코디세이)의 가상 키도 받으려고 sk-ant-로 묶지 않는다
const looksLikeKey = (v) => typeof v === "string" && /^[^\s"'`]{20,400}$/.test(v.trim());
// 중계 서버 주소 — 비었으면 ""(공식 주소), https면 그 주소(끝 / 없이), 그 밖은 null(받지 않음)
function relayUrl(v) {
  const t = String(v || "").trim();
  if (!t) return "";
  try { const u = new URL(t); return u.protocol === "https:" && !u.username && !u.password ? u.href.replace(/\/+$/, "") : null; } catch { return null; }
}
// 같은 포트에 먼저 떠 있는 서버가 옛 코드인가 — /api/setup이 없거나(옛 판) 지문(build)이 다르면. build: 이 앱이 가진 코드의 지문
const staleServer = (info, build) => !info || info.ok !== true || typeof info.build !== "string" || !info.build || info.build !== build;
// 앱이 꺼도 되는 프로세스인가 — node로 띄운 Floe 서버(server.js · floe.js)만. 다른 프로그램 · 다른 Floe 앱은 끄지 않는다
const isFloeServer = (cmd) => /(^|[\s/\\])node(\.exe)?\s.*\b(server|floe)\.js\b/.test(String(cmd || ""));

module.exports = { paths, parseEnv, applyEnv, mergePath, hookCommand, connectDir, setEnvLines, looksLikeKey, relayUrl, staleServer, isFloeServer };
