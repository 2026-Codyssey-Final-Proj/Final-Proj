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

// 어느 운영체제에서 로그인 셸의 PATH를 합치나 — Mac(더블클릭 앱)과 Linux(앱 메뉴 · AppImage로 연 앱)는 PATH가 짧아 `claude`를 못 찾는다. Windows는 등록된 PATH를 그대로 받는다
const wantsShellPath = (platform) => platform === "darwin" || platform === "linux";
// 그 셸 — SHELL 환경이 있으면 그것, 없으면 Mac은 zsh · Linux는 bash
const loginShell = (platform, env = {}) => env.SHELL || (platform === "darwin" ? "/bin/zsh" : "/bin/bash");
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
// 플로로의 눈이 창 밖 커서도 따라오게(2026-10-19 이재엽 "플로로가 자기 오버레이가 아니면 마우스커서를 따라오지 못하는 문제") —
// 화면(브라우저)은 자기 창 안의 mousemove만 받는다. 창이 섬 크기로 줄어든 뒤(3.0.1)로는 커서가 거의 늘 창 밖이다.
// point: 바탕 화면 좌표(screen.getCursorScreenPoint), bounds: 창의 내용 영역(getContentBounds), last: 지난번에 보낸 점.
// 돌려주는 것: 화면 좌표(창 왼쪽 위가 0,0)로 바꾼 점. 창 안이면(화면의 mousemove가 맡는다) · 지난번과 같으면 null
function cursorMsg(point, bounds, last) {
  if (!point || !bounds) return null;
  const inside = point.x >= bounds.x && point.x < bounds.x + bounds.width && point.y >= bounds.y && point.y < bounds.y + bounds.height;
  if (inside) return null;
  const p = { x: Math.round(point.x - bounds.x), y: Math.round(point.y - bounds.y) };
  return last && last.x === p.x && last.y === p.y ? null : p;
}

// ── Mac 노치(다이내믹 아일랜드, 2026-10-19 이재엽 결정 "Swift 도우미로 정확히") ──
// Electron은 노치 크기를 안 알려 줘 Swift 도우미(notch/notch-probe.swift)가 JSON 한 줄을 찍는다: {"notch":{"x","width","height"}|null,"screen":{…},"menuBar"}.
// 그 줄을 읽어 모양을 확인한다 — 숫자가 아니거나 폭 · 높이가 0 이하면 null(도우미가 이상하면 노치 없이 켠다)
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
function parseNotchProbe(text) {
  let j;
  try { j = JSON.parse(String(text || "")); } catch { return null; }
  if (!j || typeof j !== "object" || Array.isArray(j) || !("notch" in j)) return null;
  let notch = null;
  if (j.notch !== null) {
    const n = j.notch || {}, x = num(n.x), width = num(n.width), height = num(n.height);
    if (x === null || width === null || height === null || width <= 0 || height <= 0) return null;
    notch = { x, width, height };
  }
  const s = j.screen || {};
  return { notch, menuBar: num(j.menuBar), screen: { width: num(s.width), height: num(s.height) } };
}
// 노치가 있으면 창(폭 w · 높이 h)을 노치 가운데 · 화면 맨 위(y=0, 메뉴 줄 위)에 — 레벨 screen-saver가 메뉴 줄보다 위다. cx는 그 뒤 크기가 바뀔 때 기준.
// display: 그 화면의 bounds(screen.getPrimaryDisplay().bounds — 두 번째 화면이 왼쪽이면 x가 0이 아니다). 노치가 없으면 null
function notchLayout(probe, display, w, h) {
  if (!probe || !probe.notch || !display) return null;
  const cx = display.x + probe.notch.x + probe.notch.width / 2;
  return { x: Math.round(cx - w / 2), y: display.y, width: w, height: h, level: "screen-saver", cx };
}
// 창 크기가 바뀔 때의 x — anchor "left"면 왼쪽 고정(설정 창이 옆에 열릴 때), 노치가 있으면(cx) 노치 가운데, 아니면 지금 창의 가운데를 지킨다. 화면(workArea) 밖이면 안쪽으로
function islandX(anchor, bounds, w, cx, wa) {
  let x = anchor === "left" ? bounds.x : typeof cx === "number" ? cx - w / 2 : bounds.x + (bounds.width - w) / 2;
  x = Math.round(x);
  return Math.max(wa.x, Math.min(x, wa.x + wa.width - w));
}

// 서고에 있는 동안의 창(2026-10-20) — 작업 영역 **위쪽** 가운데(세로 가운데가 아니다 — 섬이 있던 맨 위에서 잠수가 이어지게), 최대 1440×960.
// saved: 사람이 지난번에 조절한 크기({width, height}) — 있으면 그 크기(작업 영역 안으로 당김, 최소 640×480)
const LIB_MIN = { width: 640, height: 480 };
function libraryBounds(wa, saved) {
  const maxW = Math.max(LIB_MIN.width, wa.width - 24), maxH = Math.max(LIB_MIN.height, wa.height - 24);
  let width = Math.min(1440, maxW), height = Math.min(960, maxH);
  if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) {
    width = Math.max(LIB_MIN.width, Math.min(Math.round(saved.width), maxW));
    height = Math.max(LIB_MIN.height, Math.min(Math.round(saved.height), maxH));
  }
  return { x: wa.x + Math.round((wa.width - width) / 2), y: wa.y, width, height };
}

// 켜지는 중(C-10, 2026-10-20) — 서버가 켜지기 전에 창에 띄우는 작은 화면: 띠 자리에 물결 선이 숨 쉬듯 그어진다(투명 바탕, 노치가 있으면 노치 폭 · 검정).
// 글자 · 그림 파일 없이 한 장의 HTML — data: 주소로 연다. 화면(app.js)의 인사가 이 선에서 이어진다
function bootPage(notch) {
  const w = notch ? Math.max(150, notch.width + 28) : 150, h = notch ? notch.height + 18 : 52;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Floe</title><style>
html,body{margin:0;background:transparent;overflow:hidden}
.strip{position:fixed;left:50%;top:0;transform:translateX(-50%);width:${w}px;height:${h}px;${notch ? "background:#000;border-radius:0 0 18px 18px;" : ""}}
.wl{position:absolute;left:0;bottom:4px;width:100%;height:12px}
.wl path{stroke-dasharray:100;stroke-dashoffset:100;animation:draw 1.6s ease-in-out infinite alternate}
@keyframes draw{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){.wl path{animation:none;stroke-dashoffset:0}}
</style></head><body><div class="strip" aria-label="켜지는 중"><svg class="wl" viewBox="0 0 150 12" preserveAspectRatio="none" aria-hidden="true">
<path pathLength="100" d="M6 5 Q40 2 75 5 Q110 8 144 5" fill="none" stroke="#A9DDFF" stroke-width="2" stroke-linecap="round"></path></svg></div></body></html>`;
}
const bootUrl = (notch) => `data:text/html;charset=utf-8,${encodeURIComponent(bootPage(notch))}`;

// ── 모아 보기 창(2026-10-20, C-11 — 넘김 문서 4절 [제안] 900×600) ── 보통 창의 크기 · 자리.
// wa: 그 화면의 작업 영역(workArea — 메뉴 줄 · Dock을 뺀 곳), saved: 지난번 창의 {x, y, width, height}(이 앱이 켜져 있는 동안만 기억). 없으면 기본 크기를 가운데에.
// 작업 영역보다 크면 그만큼 줄이고, 밖으로 나갔으면 안으로 당긴다. 최소 480×420은 main.js의 minWidth · minHeight와 같다
const HUB = { width: 900, height: 600, minWidth: 480, minHeight: 420 };
function hubBounds(wa, saved) {
  const pick = (v, d) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : d);
  const width = Math.max(Math.min(HUB.minWidth, wa.width), Math.min(pick(saved && saved.width, HUB.width), wa.width));
  const height = Math.max(Math.min(HUB.minHeight, wa.height), Math.min(pick(saved && saved.height, HUB.height), wa.height));
  const has = (v) => typeof v === "number" && Number.isFinite(v);
  let x = saved && has(saved.x) ? saved.x : wa.x + Math.round((wa.width - width) / 2);
  let y = saved && has(saved.y) ? saved.y : wa.y + Math.round((wa.height - height) / 2);
  x = Math.max(wa.x, Math.min(Math.round(x), wa.x + wa.width - width));
  y = Math.max(wa.y, Math.min(Math.round(y), wa.y + wa.height - height));
  return { x, y, width, height };
}

module.exports = { paths, parseEnv, applyEnv, wantsShellPath, loginShell, mergePath, hookCommand, connectDir, setEnvLines, looksLikeKey, relayUrl, cursorMsg, parseNotchProbe, notchLayout, islandX, libraryBounds, LIB_MIN, bootPage, bootUrl, HUB, hubBounds };
