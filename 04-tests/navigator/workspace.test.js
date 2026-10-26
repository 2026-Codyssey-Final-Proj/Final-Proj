// claude-drafted: 2026-10-26 — 작업실 창(C-41 PR①, 두승현 · 이재엽 · 두승현 결정 2026-10-26): 퀘스트 창을 테두리 있는 보통 창(늘 위 아님 · 파스텔)으로, 첫 탭 캔버스(지금 하는 일 · 단계 칩 · 지난 장 / 다음 장 · 다섯 칸).
// 기준은 스토리보드 01-docs/04-pattern-implementation/stage-storyboard/index.html(화면 기준 1 · 2 · 7 · 9). 글자 모양으로 본다 — electron 없이 돈다.
// 실행: node --test 04-tests/navigator/workspace.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend", f), "utf8");

test("main.js — 작업실 창은 테두리 있는 보통 창: 늘 위 아님 · 작업 표시줄에 뜸 · 640×480보다 작아지지 않음 · 제목 '작업실'. 설정 창의 모양은 그대로", () => {
  const m = read("electron/main.js");
  assert.match(m, /frame: ws, transparent: false, backgroundColor: ws \? "#E9EEF6" : "#16225E", alwaysOnTop: !ws, resizable: ws, minimizable: ws/);
  assert.match(m, /minWidth: ws \? 640 : 260, minHeight: ws \? 480 : 200, title: ws \? "Floe — 작업실" : "Floe — 설정"/);
  assert.match(m, /if \(!ws\) w\.setAlwaysOnTop\(true, "floating"\)/, "늘 위는 설정 창만");
});

test("lib.js workBounds — 작업실은 섬 아래 · 섬 가운데에 달라는 크기 그대로(옆자리에 끼워 줄이지 않는다), 가장 작게 640×480, 작업 영역 안으로", () => {
  const L = require("../../02-frontend/electron/lib.js");
  const ISL = { x: 524, y: 25, width: 952, height: 300 }, WA = { x: 0, y: 25, width: 2000, height: 1200 };
  assert.deepEqual(L.workBounds(ISL, WA, [920, 640]), { x: 540, y: 333, width: 920, height: 640 }, "섬 아래 8px · 섬 가운데");
  assert.deepEqual([L.workBounds(ISL, WA, [10, 10]).width, L.workBounds(ISL, WA, [10, 10]).height], [640, 480], "가장 작게");
  assert.deepEqual([L.workBounds(ISL, WA, null).width, L.workBounds(ISL, WA, null).height], [920, 640], "모르면 보통(M)");
  const wide = L.workBounds({ x: 0, y: 0, width: 1400, height: 60 }, { x: 0, y: 0, width: 1440, height: 900 }, [1600, 1000]);
  assert.deepEqual(wide, { x: 0, y: 68, width: 1440, height: 832 }, "작업 영역보다 크면 작업 영역만큼");
  assert.equal(L.workBounds({ x: 1800, y: 0, width: 300, height: 60 }, { x: 0, y: 0, width: 1920, height: 1080 }, [920, 640]).x, 1000, "오른쪽 끝을 넘으면 안으로");
  assert.deepEqual(L.workBounds({ x: 207, y: 0, width: 952, height: 325 }, { x: 0, y: 0, width: 1366, height: 728 }, [920, 640]), { x: 223, y: 248, width: 920, height: 480 }, "섬 아래가 480보다 좁으면 위로 올려 작업 표시줄 밑으로 나가지 않게(새 맥락 리뷰 2026-10-26)");
  assert.equal(L.workBounds({ x: -1800, y: 0, width: 952, height: 60 }, { x: -1920, y: 0, width: 1920, height: 1080 }, [920, 640]).x, -1784, "왼쪽 모니터(wa.x < 0)에서도 섬 가운데");
  assert.match(fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/win.js"), "utf8"), /document\.title = kind === "quest" \? "Floe — 작업실" : "Floe — 설정"/, "OS 제목 줄");
});

test("app.js — 작업실 창: 탭은 캔버스 → 노트북(옛 퀘스트) → 도전과제 → 책, 처음 여는 탭은 캔버스. 캔버스 판에 지금 하는 일 · 단계 칩 · 지난 장 / 다음 장 · 다섯 칸(생각 → 행동 → 기록 → 저장 → 버전 → 관문) 차례로", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const QTABS = \[\["canvas", "캔버스"\], \["quest", "노트북"\]/);
  assert.match(a, /qwin: false, qtab: "canvas"/);
  assert.match(a, /<span class="ttl">작업실<\/span>/);
  assert.match(a, /st\.qtab === "canvas" \? canvasPane\(\)/);
  const cv = a.slice(a.indexOf("function canvasPane"), a.indexOf("function qwinHTML"));
  const marks = ['"①", "생각"', '"②", "행동"', '"③", "기록"', '"④", "저장"', '"⑤", "버전"', '"", "관문"'];
  for (const s of marks.concat(['class="cv-now">지금 하는 일', 'class="cv-stg"', "관문을 넘으면 열려요", "지난 장 없음"])) assert.ok(cv.includes(s), s);
  const at = marks.map((s) => cv.lastIndexOf(s));   // 마지막 자리(칸은 셋 중 하나로 그려서 같은 이름이 여러 번) — 그래도 차례는 같다
  for (let i = 1; i < at.length; i++) assert.ok(at[i - 1] < at[i], `${marks[i - 1]} 다음에 ${marks[i]}`);
});

test("app.css · win.html — 작업실은 파스텔(네이비 면 없음), 보드는 줌 없이 너비 640 · 1000에서 칸 배치를 다시 잡는다. 설정 창의 네이비는 그대로", () => {
  const c = read("navigator/app.css"), w = read("navigator/win.html");
  assert.match(c, /html\.in-win:not\(\.win-quest\)\{/, "네이비 토큰은 작업실 밖에만");
  assert.match(c, /html\.in-win:not\(\.win-quest\) \.win\{background:#16225E\}/);
  assert.match(c, /html\.win-quest\{[^}]*--card:#F7F9FC/);
  for (const t of ["--ok:#1E7A47", "--okbg:#E3F4EA", "--acc-ink:#FFFFFF", "--mute:#525F84", "--win:#F7F9FC", "--t-blue-ink:#1E3F7A", "--bad:#A4262C"]) assert.ok(/html\.win-quest\{[^}]*\}/.exec(c)[0].includes(t), `${t} — 601px 이상의 네이비 토큰을 덮어야 ✓ 글씨가 파스텔 위에서 4.5:1(새 맥락 리뷰 2026-10-26: 빠지면 1.38:1)`);
  assert.match(c, /html\.win-quest \.win\{background:var\(--card\)\}/);
  assert.match(c, /@container cvboard \(min-width:640px\)/);
  assert.match(c, /@container cvboard \(min-width:1000px\)/);
  assert.match(w, /html\.in-win\.win-quest,html\.in-win\.win-quest body\{background:#E9EEF6\}/);
  assert.match(read("electron/main.js"), /backgroundColor: ws \? "#E9EEF6"/, "창 바탕색이 셋 다 같다");
});
