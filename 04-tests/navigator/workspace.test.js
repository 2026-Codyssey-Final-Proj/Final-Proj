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

// R-1(C-42, 이재엽 2026-10-27 버튼 "화면을 채움"): 작업실은 섬이 있는 화면의 작업 영역 가득 — 사람이 줄이거나 옮긴 크기 · 자리(saved)가 있으면 그대로(작업 영역 안으로 당김, 가장 작게 640×480). 섬 아래에 S/M/L로 두던 길은 뺐다
test("lib.js workBounds — 작업실은 작업 영역 가득, 기억한 크기 · 자리가 있으면 그대로(작업 영역 안으로 · 가장 작게 640×480)", () => {
  const L = require("../../02-frontend/electron/lib.js");
  const WA = { x: 0, y: 25, width: 1440, height: 875 };
  assert.deepEqual(L.workBounds(WA), { x: 0, y: 25, width: 1440, height: 875 }, "처음 열면 작업 영역 가득");
  assert.deepEqual(L.workBounds(WA, null), { x: 0, y: 25, width: 1440, height: 875 });
  assert.deepEqual(L.workBounds(WA, { x: 100, y: 80, width: 900, height: 600 }), { x: 100, y: 80, width: 900, height: 600 }, "기억한 크기 · 자리 그대로");
  assert.deepEqual(L.workBounds(WA, { x: 900, y: 600, width: 900, height: 600 }), { x: 540, y: 300, width: 900, height: 600 }, "작업 영역 밖이면 안으로 당긴다");
  assert.deepEqual(L.workBounds(WA, { x: 10, y: 30, width: 100, height: 100 }), { x: 10, y: 30, width: 640, height: 480 }, "가장 작게 640×480");
  assert.deepEqual(L.workBounds(WA, { x: 0, y: 25, width: 3000, height: 3000 }), { x: 0, y: 25, width: 1440, height: 875 }, "작업 영역보다 크면 작업 영역만큼");
  assert.deepEqual(L.workBounds(WA, { x: "a", width: 900 }), { x: 0, y: 25, width: 1440, height: 875 }, "모양이 안 맞는 저장값은 없는 것으로");
  assert.deepEqual(L.workBounds({ x: -1920, y: 0, width: 1920, height: 1080 }), { x: -1920, y: 0, width: 1920, height: 1080 }, "왼쪽 모니터(wa.x < 0)에서도 그 화면 가득");
  assert.deepEqual(L.workBounds({ x: 0, y: 0, width: 500, height: 300 }), { x: 0, y: 0, width: 640, height: 480 }, "작업 영역이 640×480보다 작아도 창은 그보다 작아지지 않는다(main.js minWidth · minHeight와 같다)");
  assert.match(fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/win.js"), "utf8"), /document\.title = kind === "quest" \? "Floe — 작업실" : "Floe — 설정"/, "OS 제목 줄");
});

test("main.js — 작업실 창: 처음은 작업 영역 가득(workBounds(wa, 기억)), 사람이 옮기거나 늘리면 기억(설정 폴더 workspace.json), '화면 가득'(floe:win-size \"full\")은 다시 작업 영역만큼 — S/M/L은 없다", () => {
  const m = read("electron/main.js");
  assert.match(m, /const workFile = \(\) => path\.join\(app\.getPath\("userData"\), "workspace\.json"\);/, "기억은 설정 폴더의 workspace.json(project.json과 같은 자리)");
  assert.match(m, /const boundsFor = \(kind, side, isl, wa, size\) => \(kind === "quest" \? L\.workBounds\(wa, savedWork\(\)\) : L\.sideWinBounds\(kind, side, isl, wa, size\)\);/, "작업실은 작업 영역 가득 · 기억한 자리(R-1), 설정 창은 옆자리");
  assert.match(m, /w\.on\("resize", rememberWork\); w\.on\("move", rememberWork\);/, "사람이 바꾼 크기 · 자리를 기억한다");
  assert.match(m, /if \(kind === "quest"\) \{ if \(size === "full"\)[^\n]*L\.workBounds\(wa\)/, "'화면 가득'은 작업 영역만큼");
  assert.ok(!m.includes("floeSize: opt.size"), "작업실 · 설정 창 모두 S/M/L 크기 기억(floeSize)은 없다 — 설정 창은 2026-10-25부터 열리지 않고, 작업실은 자리 · 크기를 workspace.json에");
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
  for (const s of ['<div class="cv"><div class="cvb" style="--fa:', 'class="cv-frame"', 'class="cv-bh"', "${fileCard()}${learn}${ARROWS}", 'class="cv-flo" style="--fx:${fx};--fy:${fy}"', '>${dn(N.STAGES[i0])} ~ ${dn(N.STAGES[last])}</span>`']) assert.ok(cv.includes(s), s);   // 칩은 앱 번호(R-9, 2026-10-27 — 전에는 코드 번호만이었다)터 판 밖(새 맥락 리뷰 2026-10-27)
  assert.match(cv, /if \(k === "now" && !floAt\) floAt = pos;/, "작은 플로로는 첫 '지금' 칸 옆");
  assert.match(c, /\.cv\{flex:1;min-height:0;min-width:0;overflow:auto;container-type:size;/);
  assert.match(c, /@container \(min-width:935px\) and \(min-height:544px\)\{\.cvb\{--u:min\(calc\(100cqw \/ 1100\),calc\(100cqh \/ 640\),1px\);display:block;width:calc\(1100 \* var\(--u\)\);height:calc\(640 \* var\(--u\)\)/, "판 1100×640을 칸에 맞춰 줌하는 것은 0.85배 이상 담을 수 있을 때만(935 = 1100 × .85 · 544 = 640 × .85) — R-11(이재엽 버튼 \"줌 + 모자라면 다시 배치\")");
  for (const s of [".cv-c.c1{left:calc(226 * var(--u));top:calc(110 * var(--u))", ".cv-c.c3{left:calc(716 * var(--u))", ".cv-c.c6{left:calc(962 * var(--u))", ".cv-file{left:calc(226 * var(--u));top:calc(256 * var(--u))", ".cv-learn{left:calc(226 * var(--u));top:calc(450 * var(--u))", ".cv-ar.a3{left:calc(640 * var(--u));top:calc(362 * var(--u))"]) assert.ok(c.includes(s), `${s} — 목업 좌표`);
  assert.match(c, /\.wnav\{width:200px;flex:none;/); assert.match(c, /\.qwin\{min-width:260px;container-type:inline-size\}/); assert.match(c, /@container \(max-width:760px\)\{\.wnav,\.wh \.wst\{display:none\}\}/, "좁은 작업실은 파일 칸 · 단계 이름을 숨긴다(760은 두승현 확인 전 — 출처 없는 값)");
  assert.ok(!c.includes("@container cvboard"), "너비로 칸 배치를 다시 잡던 길(① · 900)은 뺐다 — 줌이 대신한다");
  assert.ok(!a.includes('data-act="qsize"') && !a.includes("작업실 처음 크기"), "S/M/L 단추 · 설정 줄은 없다(R-1, 이재엽 버튼 2026-10-27 \"'화면 가득' 하나로\")");
  assert.match(a, /<button type="button" class="ti wfull" data-act="qfull" aria-label="작업실을 화면 가득" title="화면 가득">/, "머리에 '화면 가득' 하나");
  assert.match(a, /qfull: \(\) => \{ if \(WINS && winOpen\.quest\) window\.floeApp\.sizeWin\("quest", "full"\); \},/);
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

// R-11(C-42, 이재엽 2026-10-27 버튼 "줌 + 모자라면 다시 배치"): 캔버스 칸이 판을 0.85배 이상으로 담지 못하면 줌하지 않고 칸 배치를 다시 잡는다 — 두 줄(① ② ③ / ④ ⑤ 관문), 640 미만은 세로 한 줄(스토리보드 기준 7), 글자 크기는 그대로(--ui-scale). 어느 쪽이든 옆으로 넘치지 않는다
test("app.css — R-11 다시 배치: 기본은 격자(두 줄 — 640 미만은 한 열), 줌은 935×544 이상의 컨테이너 질의 안에서만. 쪽지 · 화살표 · 플로로 · 파일 카드 · 배울 말은 다시 배치에서도 남는다", () => {
  const c = read("navigator/app.css"), a = read("navigator/app.js");
  const zoom = c.indexOf("@container (min-width:935px) and (min-height:544px){");
  assert.ok(zoom > 0, "줌 블록");
  const base = c.slice(c.indexOf(".cvb{"), zoom);
  assert.match(base, /\.cvb\{--u:calc\(1px \* var\(--ui-scale,1\)\);position:relative;display:grid;/, "기본(다시 배치)은 격자 · 글자 크기 설정 그대로");
  assert.match(base, /grid-template-areas:"now now now now now" "stg stg stg stg stg" "bh bh bh bh bh" "c1 a1 c2 a2 c3" "file file a3 a3 a3" "c4 a4 c5 a5 c6" "learn learn prev prev next"/, "두 줄 — ① ② ③ / ④ ⑤ 관문, 쪽지 아래 파일 카드 · 배울 말, 보드는 아래");
  assert.match(base, /@container \(max-width:639px\)\{\.cvb\{grid-template-columns:minmax\(0,1fr\);grid-template-areas:"now" "stg" "bh" "c1" "a1" "c2" "a2" "c3" "a3" "c4" "a4" "c5" "a5" "c6" "file" "learn" "prev" "next"\}/, "640 미만은 세로 한 줄");
  for (const s of [".cv-frame{display:none}", ".cv-flo{grid-area:var(--fa,c1)", "max-width:100%", "overflow-wrap:anywhere"]) assert.ok(base.includes(s), s);
  assert.match(a, /<div class="cvb" style="--fa:\$\{floAt \|\| "c1"\}"/, "작은 플로로가 설 칸은 격자 영역 이름으로도(다시 배치에서 '지금' 칸 모서리에)");
  const zb = c.slice(zoom);
  for (const s of [".cvb>*{position:absolute}", ".cv-frame{display:block;left:calc(204 * var(--u))", ".cv-c.c1{left:calc(226 * var(--u));top:calc(110 * var(--u))", ".cv-flo{left:calc(var(--fx) * var(--u))"]) assert.ok(zb.includes(s), `줌 블록 안: ${s}`);
  assert.ok(!c.includes(".75px"), "0.75 바닥은 없다 — 그 아래는 다시 배치가 맡는다");
});

test("app.js render — 브라우저 판의 작업실 몸통(.qwin .wbody)은 같은 화면이면 스크롤을 되돌린다(마우스가 섬에 들어오면 mouseenter가 다시 그린다 — 받기 화면이 맨 위로 튀던 것, 2026-10-27)", () => {
  const a = read("navigator/app.js");
  assert.match(a, /const ob = \$nav\.querySelector\("\.qwin \.wbody"\), bodyWas = ob \? \{ view: ob\.dataset\.view, top: ob\.scrollTop \} : null;/);
  assert.match(a, /const nb = bodyWas && \$nav\.querySelector\("\.qwin \.wbody"\); if \(nb && nb\.dataset\.view === bodyWas\.view\) nb\.scrollTop = bodyWas\.top;/);
});

// R-9(단계 칩은 앱 번호로) · R-5(칸에는 상태 대신 내용) — C-42, 넘김 문서 3절 ② 묶음(2026-10-27)
test("app.js canvasPane — R-9 단계 칩: '시작 ✓' · 지난 장 'n ✓ V.n' · 지금 장 'n 짧은 이름' · 뒤 장 'n+1 ~ 8'(머리와 같은 번호 1~8). R-5: ② 맡길 일 이름, ③ 정한 줄, ④ 올라갈 파일 이름, 관문에 남은 기준 수와 '안 됨'인 기준 이름", () => {
  const a = read("navigator/app.js"), c = read("navigator/app.css");
  const cv = a.slice(a.indexOf("function canvasPane"), a.indexOf("function fileCard"));
  assert.ok(cv.includes('${k === "done" ? `${dn(x)} ✓ V.${dn(x)}` : k === "cur" ? `${dn(x)} ${esc(x.short)}` : dn(x)}'), "칩 — 지난 장 n ✓ V.n · 지금 장 n 짧은 이름 · 뒤 장 번호(dn = n + 1)");
  assert.ok(cv.includes('"시작 ✓" : "시작"'), "시작 칩");
  assert.ok(cv.includes("${dn(N.STAGES[i0])} ~ ${dn(N.STAGES[last])}"), "뒤 장은 'n+1 ~ 8'로 묶음");
  assert.ok(!cv.includes(">${x.n}${k"), "코드 번호(0~7)는 화면에 없다");
  assert.ok(cv.includes("const curItem = ") && cv.includes("맡긴 일 ${pg.done}/${pg.total}"), "② 행동 — 지금 맡긴 일의 이름과 진행");
  assert.ok(cv.includes('class="cv-files"') && cv.includes("`docs/${slug}/${slug.slice(3)}.md`") && cv.includes("FDOCS.MAIN_DOC, FDOCS.LOG_DOC"), "④ 저장 — 올라갈 파일 이름(단계 문서 · 기획서 · 결정 기록)");
  assert.ok(cv.includes("const unmet = ") && cv.includes("남은 기준 ${left()}") && cv.includes('class="cv-unmet"'), "관문 — 남은 기준 수와 '안 됨'인 기준 이름");
  assert.ok(cv.includes("정한 줄 ${") && cv.includes("QU.filled(q, i) && ln ? ln : QU.shortOf(o.name)"), "③ 기록 — 적은 칸은 그 줄(정한 것)을 보인다");
  assert.match(c, /\.cv-files,\.cv-unmet\{list-style:none;padding:0;/); assert.match(c, /\.cv-unmet li\{color:var\(--bad\)/);
  assert.match(c, /@container \(min-width:935px\) and \(min-height:544px\)\{[\s\S]*\.cv-stg\{left:calc\(672 \* var\(--u\)\);top:calc\(8 \* var\(--u\)\);width:calc\(412 \* var\(--u\)\);flex-wrap:wrap\}/, "줌에서는 칩이 판 오른쪽 끝 안에서 줄 바꿈(이름이 붙어 길어진다)");
});
