#!/usr/bin/env node
// claude-drafted: 2026-10-19 — 한 줄로 켜기. 실사용(이재엽 2026-10-18 "실질적으로 테스트를 진행할 수 있도록")을 시작하는 데 세 단계가 따로였다 —
// 훅 연결(connect.js --apply) · 서버 켜기(server.js, 키가 있으면 .env와 함께) · 브라우저로 서버 주소 열기. 이 파일이 그 셋을 차례로 한다.
//
//   node 03-backend/navigator/floe.js [폴더]              그 폴더에서 Claude Code를 쓰면 Floe가 작업을 알아챈다 (폴더를 안 주면 지금 폴더)
//   node 03-backend/navigator/floe.js [폴더] --off        그 폴더의 훅을 뺀다 — 서버는 켜지 않는다
//   --codex       Codex(GPT) 훅도 같이 (전체에 걸린다 — connect.js 머리 참고)
//   --no-open     브라우저를 열지 않는다 (시험 · 원격)
//   --port 4317   서버 포트 (기본 4317 · 환경변수 NAV_PORT)
//
// 하지 않는 것: 키를 묻거나 저장하지 않는다 — .env는 각자 만든다(README "내 키로 쓰기"). 훅은 끝낼 때(Ctrl+C) 빼지 않는다 — 다음에 또 쓰니까. 빼려면 --off.
// 밖으로 나가는 것: 없다(서버가 AI를 부르는 것은 provider.js 한 곳 — 이 파일은 켜기만 한다). 값(토큰 · 키)은 어디에도 출력하지 않는다.
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const HERE = __dirname;
const SERVER = path.join(HERE, "server.js");
const CONNECT = path.join(HERE, "connect.js");
const ENV_FILE = path.join(HERE, ".env");
const DEFAULT_PORT = 4317;

// 명령줄 → {dir, off, codex, open, port, help}. 폴더는 --로 시작하지 않는 첫 낱말
function parseArgs(argv, cwd = process.cwd(), env = process.env) {
  const a = Array.isArray(argv) ? argv.slice() : [];
  const out = { off: a.includes("--off"), codex: a.includes("--codex"), open: !a.includes("--no-open"), help: a.includes("--help") || a.includes("-h") };
  const pi = a.indexOf("--port");
  const portArg = pi >= 0 ? a[pi + 1] : undefined;
  const port = Number(portArg !== undefined ? portArg : env.NAV_PORT) || DEFAULT_PORT;
  out.port = Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT;
  const words = a.filter((x, i) => !x.startsWith("--") && !(pi >= 0 && i === pi + 1));
  out.dir = path.resolve(cwd, words[0] || ".");
  return out;
}
// 서버를 켜는 인자 — .env가 있고 Node가 --env-file을 아는(20.6 이상) 때만 .env를 함께. 키 값은 서버 안에서만 읽힌다
function serverArgs({ envFile = fs.existsSync(ENV_FILE), nodeVersion = process.version } = {}) {
  const [maj, min] = String(nodeVersion).replace(/^v/, "").split(".").map(Number);
  const canEnv = maj > 20 || (maj === 20 && min >= 6);
  return envFile && canEnv ? ["--env-file=.env", "server.js"] : ["server.js"];
}
// 브라우저로 주소 열기 — 운영체제마다 명령이 다르다
function openCommand(platform, url) {
  if (platform === "darwin") return { cmd: "open", args: [url] };
  if (platform === "win32") return { cmd: "cmd", args: ["/c", "start", "", url] };
  return { cmd: "xdg-open", args: [url] };
}
// 사람에게 보일 안내 — 값(토큰 · 키)은 없다
function summary({ dir, url, codex = false, envFile = false, hooked = true }) {
  const lines = [
    `Floe 화면: ${url}`,
    hooked ? `연결한 폴더: ${dir} — 이 폴더에서 Claude Code${codex ? " · Codex" : ""}를 새로 열면 플로로가 작업을 알아채요.` : `연결한 폴더: 없음(훅을 더하지 못했어요) — 화면은 그대로 쓸 수 있어요.`,
    envFile ? "AI: .env의 내 API 키로 불러요 (시작 로그의 'AI:' 줄 참고)." : "AI: 이 컴퓨터에 로그인된 Claude Code(내 구독)로 불러요. 내 API 키로 쓰려면 .env — README '내 키로 쓰기'.",
    "느낀 점은 화면 톱니(설정) → '느낀 점'에 남기고, 'Jira용 복사'로 모아 붙여요.",
    "끄기: 이 터미널에서 Ctrl+C. 훅은 남아 있어요 — 빼려면 `node 03-backend/navigator/floe.js <폴더> --off`.",
  ];
  return lines.join("\n");
}
const HELP = `사용법: node floe.js [폴더] [--off] [--codex] [--no-open] [--port 4317]
  폴더       Claude Code로 작업하는 프로젝트 폴더 (기본: 지금 폴더)
  --off      그 폴더의 Floe 훅을 뺀다 (서버는 켜지 않는다)
  --codex    Codex 훅도 같이
  --no-open  브라우저를 열지 않는다
  --port N   서버 포트 (기본 4317)`;

// 서버가 열릴 때까지 기다린다 — /api/usage(확인 값 없이 되는 주소)가 200을 주면 됐다
function waitFor(url, ms = 8000, step = 150) {
  const end = Date.now() + ms;
  return new Promise((resolve) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => { res.resume(); if (res.statusCode === 200) return resolve(true); later(); });
      req.on("error", later);
      req.setTimeout(1000, () => { req.destroy(); });
    };
    const later = () => (Date.now() > end ? resolve(false) : setTimeout(tryOnce, step));
    tryOnce();
  });
}
// 훅 더하기/빼기 — connect.js를 그대로 부른다(같은 규칙 · 같은 백업). 돌려주는 것: 성공 여부
function connect(dir, { off = false, codex = false } = {}) {
  const flag = off ? "--remove" : "--apply";
  let ok = spawnSync(process.execPath, [CONNECT, dir, flag], { stdio: "inherit" }).status === 0;
  if (codex) ok = spawnSync(process.execPath, [CONNECT, "--codex", flag], { stdio: "inherit" }).status === 0 && ok;
  return ok;
}

async function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  if (o.help) { console.log(HELP); return 0; }
  if (!fs.existsSync(o.dir) || !fs.statSync(o.dir).isDirectory()) { console.error(`폴더가 없어요: ${o.dir}`); return 1; }
  if (o.off) { const ok = connect(o.dir, { off: true, codex: o.codex }); console.log(ok ? "Floe 훅을 뺐어요. 서버는 켜지 않았어요." : "훅을 빼지 못했어요 — 위 안내를 보세요."); return ok ? 0 : 1; }

  const hooked = connect(o.dir, { codex: o.codex });
  const envFile = fs.existsSync(ENV_FILE);
  const url = `http://127.0.0.1:${o.port}`;
  const child = spawn(process.execPath, serverArgs({ envFile }), { cwd: HERE, stdio: "inherit", env: { ...process.env, NAV_PORT: String(o.port) } });
  const stop = () => { if (!child.killed) child.kill("SIGINT"); };
  process.on("SIGINT", () => { stop(); process.exit(0); });
  process.on("SIGTERM", () => { stop(); process.exit(0); });
  child.on("exit", (code) => { if (code !== 0 && code !== null) console.error(`서버가 꺼졌어요(코드 ${code}). 같은 포트를 쓰는 서버가 이미 있다면 그쪽을 쓰거나 --port 를 바꿔요.`); process.exit(code === null ? 0 : code); });

  const up = await waitFor(`${url}/api/usage`);
  if (!up) { console.error(`서버가 ${url} 에서 열리지 않았어요. 위 로그를 보고 다시 켜 주세요.`); stop(); return 1; }
  console.log(`\n${summary({ dir: o.dir, url, codex: o.codex, envFile, hooked })}\n`);
  if (o.open) {
    const { cmd, args } = openCommand(process.platform, url);
    const b = spawn(cmd, args, { stdio: "ignore", detached: true });
    b.on("error", () => console.log(`브라우저를 못 열었어요 — 직접 ${url} 을 열어 주세요.`));
    b.unref();
  }
  return new Promise(() => {});   // 서버가 사는 동안 같이 산다 — Ctrl+C로 끈다
}

if (require.main === module) main().then((code) => { if (typeof code === "number") process.exitCode = code; });
module.exports = { parseArgs, serverArgs, openCommand, summary, waitFor, HELP, DEFAULT_PORT, ENV_FILE };
