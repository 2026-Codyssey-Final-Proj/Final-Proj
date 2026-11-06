// claude-drafted: 2026-11-06 — 두승현의 요청("이대로 영상 만들어줘 최대한 빨리", 같은 날 "30초 버전으로 만들어줘")으로 Claude가 쓴, 영상 원본 페이지(index.html)를 영상 파일로 굽는 스크립트.
// 헤드리스 Chrome을 띄워 1/30초씩 찍고 ffmpeg로 묶는다. 설치하는 것은 없다 — Chrome과 ffmpeg는 이 컴퓨터의 것을 쓴다.
//
//   node make-video.js                     → 이 폴더의 5초판: floe-promo-5s.mp4
//   node make-video.js ../promo-30s        → 그 폴더의 페이지: floe-promo-30s.mp4 (소리 있음) + floe-promo-30s-silent.mp4 (소리 없음)
//   node make-video.js [폴더] --stills=<폴더> → 확인용으로 장면마다 몇 장만 PNG로 (ffmpeg 없이)
//
// 길이 · 파일 이름 · 확인할 시각은 페이지가 window.film으로 알려 준다(없으면 5초판). 페이지에 window.renderSound가 있으면 그 소리를 같이 묶는다.
// CHROME_PATH · FFMPEG_PATH 환경변수로 실행 파일 자리를 준다(없으면 Windows의 기본 Chrome, PATH의 ffmpeg).
// ponytail: Chrome 조종은 내장 WebSocket으로 직접(DevTools 규약) — 찍을 것이 늘면 puppeteer로 바꾼다.
const { spawn } = require("node:child_process");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { pathToFileURL } = require("node:url");

const FPS = 30, W = 1920, H = 1080, PORT = 9339;
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FILM5 = { seconds: 5, name: "floe-promo-5s", stills: [.3, .56, .66, .9, 1.3, 1.6, 1.76, 1.86, 2.06, 2.3, 2.6, 2.88, 3.1, 3.45, 3.9, 4.16, 4.4, 4.6, 4.97] };
const args = process.argv.slice(2);
const pageDir = path.resolve(args.find((a) => !a.startsWith("--")) || __dirname);
const stillsDir = (args.find((a) => a.startsWith("--stills=")) || "").slice(9);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "floe-promo-"));
const ffmpeg = (a) => new Promise((ok, no) => {
  const p = spawn(FFMPEG, ["-y", "-loglevel", "error", ...a], { stdio: ["ignore", "inherit", "inherit"] });
  p.on("error", () => no(new Error("ffmpeg를 실행하지 못했습니다 — FFMPEG_PATH를 확인하세요")));
  p.on("exit", (c) => (c ? no(new Error(`ffmpeg가 실패했습니다(${c})`)) : ok()));
});

(async () => {
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(tmp, "profile")}`, `--window-size=${W},${H}`,
    "--hide-scrollbars", "--no-first-run", "--allow-file-access-from-files", "about:blank"], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 100 && !target; i++) {
      await new Promise((r) => setTimeout(r, 100));
      target = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).then((l) => l.find((x) => x.type === "page")).catch(() => null);
    }
    if (!target) throw new Error("Chrome을 열지 못했습니다 — CHROME_PATH를 확인하세요");
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("Chrome에 붙지 못했습니다")); });
    let id = 0;
    const waits = new Map(), events = new Map();
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id) { const w = waits.get(d.id); waits.delete(d.id); d.error ? w.no(new Error(d.error.message)) : w.ok(d.result); }
      else if (events.has(d.method)) { events.get(d.method)(d.params); events.delete(d.method); }
    };
    const send = (method, params = {}) => new Promise((ok, no) => { waits.set(++id, { ok, no }); ws.send(JSON.stringify({ id, method, params })); });
    const once = (method) => new Promise((ok) => events.set(method, ok));
    const run = async (expression) => {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    };
    const shot = async (t, file) => {
      await run(`window.seek(${t})`);
      fs.writeFileSync(file, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
    };

    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url: `${pathToFileURL(path.join(pageDir, "index.html")).href}?capture=1` });
    await loaded;
    console.log("받은 글꼴:", await run("window.ready.then(() => window.fontsUsed())"));
    const film = (await run("window.film || null")) || FILM5;

    if (stillsDir) {
      fs.mkdirSync(stillsDir, { recursive: true });
      for (const [i, t] of film.stills.entries()) await shot(t, path.join(stillsDir, `s${String(i + 1).padStart(2, "0")}.png`));
      console.log(`확인용 ${film.stills.length}장: ${stillsDir}  (시각: ${film.stills.join(" · ")})`);
      return;
    }
    const sound = await run("typeof window.renderSound === 'function' ? window.renderSound() : null"), wav = path.join(tmp, "sound.wav");
    if (sound) fs.writeFileSync(wav, Buffer.from(sound, "base64"));
    const total = FPS * film.seconds, out = path.join(pageDir, `${film.name}.mp4`);
    for (let i = 0; i < total; i++) {
      await shot(i / FPS, path.join(tmp, `f${String(i).padStart(4, "0")}.png`));
      if (i && i % 150 === 0) console.log(`${i} / ${total}장`);
    }
    console.log(`${total}장 찍음 — 영상으로 묶는 중`);
    // 색은 HD 표준(bt709)으로 바꿔 적는다 — 그냥 두면 재생기마다 색이 조금 달라진다
    await ffmpeg(["-framerate", String(FPS), "-i", path.join(tmp, "f%04d.png"), ...(sound ? ["-i", wav] : []),
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      ...(sound ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : ["-an"]), "-movflags", "+faststart", out]);
    console.log(`만듦: ${out}  (${(fs.statSync(out).size / 1024).toFixed(0)}KB${sound ? ", 소리 있음" : ""})`);
    if (sound) {   // 소리를 뺀 판도 같이 — 그림은 다시 굽지 않고 그대로 옮긴다
      const silent = path.join(pageDir, `${film.name}-silent.mp4`);
      await ffmpeg(["-i", out, "-an", "-c:v", "copy", "-movflags", "+faststart", silent]);
      console.log(`만듦: ${silent}  (소리 없음)`);
    }
  } finally {
    chrome.kill();
    await new Promise((r) => setTimeout(r, 300));
    try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* 임시 폴더는 남아도 된다 */ }
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
