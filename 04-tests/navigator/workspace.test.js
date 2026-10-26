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
  assert.match(a, /st\.qtab === "canvas" \? canvasPane\(n\)/);
  const cv = a.slice(a.indexOf("function canvasPane"), a.indexOf("function qwinHTML"));
  const marks = ['"①", "생각"', '"②", "행동"', '"③", "기록"', '"④", "저장"', '"⑤", "버전"', '"", "관문"'];
  for (const s of marks.concat(['class="cv-now">지금 하는 일', 'class="cv-stg"', "관문을 넘으면 열려요", "지난 장 없음"])) assert.ok(cv.includes(s), s);
  const at = marks.map((s) => cv.lastIndexOf(s));   // 마지막 자리(칸은 셋 중 하나로 그려서 같은 이름이 여러 번) — 그래도 차례는 같다
  for (let i = 1; i < at.length; i++) assert.ok(at[i - 1] < at[i], `${marks[i - 1]} 다음에 ${marks[i]}`);
});

// ⑥(2026-10-27 두승현 "의도했던 것은 첨부한 이미지처럼 펼쳐져 있는 환경 … 3번은 이재엽 몫으로 남기고 더미 데이터로 UI 출력만"): 머리 한 줄(단계 · 탭 · LV · 조개) · 왼쪽 파일 칸(예시) · 캔버스는 목업의 1100×640 판을 줌
test("app.js · app.css — ⑥ 펼쳐진 환경: 머리 한 줄에 단계 · 탭 · LV · 조개, 왼쪽 파일 칸은 예시 데이터(API는 이재엽 몫), 캔버스 판은 1100×640을 --u로 줌(바닥 .75) · 포스트잇 · 파일 카드 · 배울 말 · 화살표 · 작은 플로로", () => {
  const a = read("navigator/app.js"), c = read("navigator/app.css");
  assert.match(a, /<span class="wst">\$\{LB\(n\)\} · \$\{esc\(N\.STAGES\[n\]\.title\)\}<\/span>/, "머리에 단계 이름");
  assert.match(a, /<span class="wlv" title="칭호 · \$\{esc\(QU\.rankOf\(Math\.min\(level, 7\)\)\)\}">LV \$\{level\} · \$\{coin\(\)\}\$\{st\.shells\}<\/span>/, "머리에 LV · 조개");
  assert.match(a, /<div class="wmain"><nav class="wnav" aria-label="파일">\$\{fileNav\(\)\}<\/nav><div class="wbody"/, "파일 칸은 탭에 상관없이 판 왼쪽");
  assert.match(a, /const FILES_DUMMY = \[\["README\.md", 0, "고침 · 책", "fix"\]/, "예시 데이터 — API가 생기면 지운다"); assert.match(a, /\$\{esc\(project\(\) \|\| "예시 프로젝트"\)\}/, "더미 이름이 진짜 프로젝트처럼 보이지 않게(새 맥락 리뷰 2026-10-27)");
  assert.match(a, /<em title="파일 목록은 아직 예시예요">예시<\/em>/, "화면에 예시 표시");
  const cv = a.slice(a.indexOf("function canvasPane"), a.indexOf("function fileCard"));
  for (const s of ['<div class="cv"><div class="cvb">', 'class="cv-frame"', 'class="cv-bh"', "${fileCard()}${learn}${ARROWS}", 'class="cv-flo" style="--fx:${fx};--fy:${fy}"', '>${N.STAGES[i0].n} ~ ${N.STAGES[last].n}</span>`', '>${x.n}${k === "done" ? " ✓" : ""}</span>`']) assert.ok(cv.includes(s), s);   // 칩은 번호만 — 이름까지면 6번째 장부터 판 밖(새 맥락 리뷰 2026-10-27)
  assert.match(cv, /if \(k === "now" && !floAt\) floAt = pos;/, "작은 플로로는 첫 '지금' 칸 옆");
  assert.match(c, /\.cv\{flex:1;min-height:0;min-width:0;overflow:auto;container-type:size;/);
  assert.match(c, /\.cvb\{--u:max\(calc\(\.75px \* var\(--ui-scale,1\)\),min\(calc\(100cqw \/ 1100\),calc\(100cqh \/ 640\),1px\)\);position:relative;width:calc\(1100 \* var\(--u\)\);height:calc\(640 \* var\(--u\)\)/, "판 1100×640, 칸에 맞춰 줌(스크립트 없이) — 바닥에도 글자 크기 설정이 먹는다");
  for (const s of [".cv-c.c1{left:calc(226 * var(--u));top:calc(110 * var(--u))", ".cv-c.c3{left:calc(716 * var(--u))", ".cv-c.c6{left:calc(962 * var(--u))", ".cv-file{left:calc(226 * var(--u));top:calc(256 * var(--u))", ".cv-learn{left:calc(226 * var(--u));top:calc(450 * var(--u))", ".cv-ar.a3{left:calc(640 * var(--u));top:calc(362 * var(--u))"]) assert.ok(c.includes(s), `${s} — 목업 좌표`);
  assert.match(c, /\.wnav\{width:200px;flex:none;/); assert.match(c, /\.qwin\{min-width:260px;container-type:inline-size\}/); assert.match(c, /@container \(max-width:760px\)\{\.wnav,\.wh \.wst\{display:none\}\}/, "좁은 작업실은 파일 칸 · 단계 이름을 숨긴다(760은 두승현 확인 전 — 출처 없는 값)");
  assert.ok(!c.includes("@container cvboard"), "너비로 칸 배치를 다시 잡던 길(① · 900)은 뺐다 — 줌이 대신한다");
  assert.match(a, /pop = qpop \? " winpop" : ""/, "처음 열 때의 움직임 class는 winpop"); assert.match(c, /\.win\.winpop\{animation:winpop/); assert.ok(!c.includes(".win.pop{"), "'pop'은 말풍선 판(.pop)의 이름 — 겹치면 작업실 창이 처음 열릴 때 14px 여백 · 아래 정렬 · 내용 높이(148px)로 뒤집어썼다(⑥ 앱에서 실측 2026-10-27)");
});

test("app.css · win.html — 작업실은 파스텔(네이비 면 없음). 설정 창의 네이비는 그대로", () => {
  const c = read("navigator/app.css"), w = read("navigator/win.html");
  assert.match(c, /html\.in-win:not\(\.win-quest\),html\.win-quest \.isl-col\{/, "네이비 토큰은 작업실 밖과 작업실 안의 섬 옆 칸에만");
  assert.match(c, /html\.in-win:not\(\.win-quest\) \.win\{background:#16225E\}/);
  assert.match(c, /html\.win-quest,\.nav\.side>\.qwin\{[^}]*--card:#F7F9FC/, "브라우저 판(.nav.side>.qwin)도 같은 파스텔 — ⑥ 캔버스의 밝은 면은 고정값이라 네이비 토큰 위에서는 흰 글씨가 흰 면에 왔다(새 맥락 리뷰 2026-10-27)");
  for (const t of ["--ok:#1E7A47", "--okbg:#E3F4EA", "--acc-ink:#FFFFFF", "--mute:#525F84", "--win:#F7F9FC", "--t-blue-ink:#1E3F7A", "--bad:#A4262C"]) assert.ok(/html\.win-quest,\.nav\.side>\.qwin\{[^}]*\}/.exec(c)[0].includes(t), `${t} — 601px 이상의 네이비 토큰을 덮어야 ✓ 글씨가 파스텔 위에서 4.5:1(새 맥락 리뷰 2026-10-26: 빠지면 1.38:1)`);
  assert.match(c, /html\.win-quest \.win,\.nav\.side>\.qwin\{background:var\(--card\)/);
  assert.match(w, /html\.in-win\.win-quest,html\.in-win\.win-quest body\{background:#E9EEF6\}/);
  assert.match(read("electron/main.js"), /backgroundColor: ws \? "#E9EEF6"/, "창 바탕색이 셋 다 같다");
});
