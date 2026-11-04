// claude-drafted: 2026-10-20 — 앱 9.0.0 섬 묶음(C-17 · C-18 · C-19 · C-20 · F-26 · F-45 · F-46)의 글 · 규칙 시험. 동작은 e2e modes-flow.test.js가 본다.
// 실행: node --test 04-tests/navigator/app-9.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const Seal = require(path.join(FRONT, "navigator/seal.js"));
const app = read("navigator/app.js"), css = read("navigator/app.css"), sealCss = read("navigator/seal.css");

// 테두리 빛(.glow)은 2026-10-29 두승현 결정으로 뺐다 — 접히는 기능 · '접히기까지' 설정은 그대로
test("C-20: 접히기까지 단추 다섯(5 · 10 · 15 · 30 · 60) · 기본 15 · 이 컴퓨터에 저장(floe:fold-delay). 아래 게이지바(.cd)도 테두리 빛(.glow)도 없다", () => {
  assert.match(app, /FOLD_CHOICES = \[5, 10, 15, 30, 60\]/);
  assert.match(app, /FOLD_KEY = "floe:fold-delay"/);
  assert.ok(!/class="cd"/.test(app) && !/\.cd\{/.test(css) && !/@keyframes shrink/.test(css), "옛 게이지바가 없다");
  assert.ok(!/class="glow"|countdown/.test(app) && !/\.glow|--glow-p|@keyframes glow/.test(css) && !/glow/.test(read("navigator/win.js")), "테두리 빛이 남아 있지 않다");
  assert.ok(!app.includes("테두리 빛"), "설정 안내 글에도 없다");
  assert.match(app, /st\.ui === "home" \? foldDelay\(\) : DELAY\[st\.ui\]/, "펼친 섬만 설정을 따른다 — 한 줄 → 띠는 그대로");
});

test("C-18: 파란 먹이 층 — 끌고 있는 동안만(dragenter · dragleave 횟수), 글 '플로로에게 먹이를 주세요', 폴더 안 물고기 그림, 움직임 줄이기면 나타남 움직임 없음", () => {
  assert.match(app, /addEventListener\("dragenter"/); assert.match(app, /addEventListener\("dragleave"/);
  assert.match(app, /dragDepth/);
  assert.ok(app.includes("플로로에게 먹이를 주세요") && app.includes("fl-fish") && app.includes("fl-folder"));
  assert.match(css, /\.feedlayer\.show\{/);
  assert.match(css, /\.feedlayer\.show\{animation:none\}/);
});

test("C-19: 막는 조건은 상태 둘(st.meal · st.busy)뿐 — 판정 규칙을 화면에서 다시 만들지 않는다. 플로로에 화난 표정(angry)과 X 표지판(s-sign)이 있고 막을 때만 보인다", () => {
  assert.match(app, /const mealWhy = \(\) => \(st\.meal \?/); assert.match(app, /const busyWhy = \(\) => \(st\.busy \?/);
  for (const act of ["judge", "draft", "review", '"lib-enter"']) assert.ok(new RegExp(`${act}: \\(\\) => \\{ if \\(refuse\\(mealWhy\\(\\)\\)\\) return;`).test(app), `${act}는 먹이 검사 중에 막힌다`);
  assert.match(app, /"feed-example": \(\) => \{ if \(refuse\(busyWhy\(\)\)\) return;/);
  assert.match(app, /if \(refuse\(busyWhy\(\)\)\) return;   \/\/ C-19: 살펴보는 중에는 먹이를 받지 않는다/);
  assert.ok(Seal.MOODS.includes("angry"));
  const svg = Seal.svg("angry", 100);
  assert.ok(svg.includes('class="cat m-angry"') && svg.includes("s-sign") && svg.includes("e-angry"));
  assert.match(sealCss, /\.m-angry \.e-angry,\.m-angry \.s-sign\{display:inline\}/);
  const hide = sealCss.indexOf('.cat [class^="s-"]{display:none}'), show = sealCss.indexOf(".m-angry .e-angry,.m-angry .s-sign{display:inline}");
  assert.ok(hide > 0 && show > hide, "보이는 규칙이 숨기는 규칙 뒤에 있다");
  assert.ok(!Seal.svg("idle", 36, { face: true }).includes("s-sign"), "얼굴만 그릴 때는 표지판이 없다");
});

// F-26(네 / 아니요가 밖의 칸 둘이 됨)은 2026-10-21 C-22로 레벨 오버레이(명령 네 칸)와 함께 뺐다 — 게이트의 네 / 아니요는 채팅의 칩 둘(y · n 키)
test("C-22: 게이트 장면의 네 / 아니요는 채팅의 칩 둘(y · n 키) — 명령 네 칸 · LV · EXP는 없다", () => {
  assert.match(app, /const yes = \{ label: "네, 이해했어요", act: "yes", key: "y", pri: true \}, no = \{ label: "아니요, 같이 풀어요", act: "no", key: "n" \}/);
  assert.match(app, /const chip = \(a\) => btn\(\{ \.\.\.a, chip: !a\.quiet \}\);/, "결정할 것의 단추가 칩이 된다(quiet — 초안 확인은 내 말로 쌓지 않음, C-37)");
  assert.match(app, /<div class="opts">\$\{answers\.map\(chip\)/, "답할 칩은 윗줄");
  assert.match(app, /const FIXED_ACTS = \["qwin-quest"\];/, "'공책 보기'는 답이 아니라 아랫줄(2026-10-22)");
  assert.match(app, /<div class="opts more" id="more-chips">\$\{moreOpen \? more\.map\(chip\)\.join\(""\) : ""\}/, "늘 있는 칩(바뀐 작업 · 어디쯤 · 알림 · 도전과제)은 아랫줄 — C-60(2026-10-29)부터 '더 보기' 뒤에 접혀 있다");
  for (const gone of ['class="cmds', "XP_EACH", "levelCard(", "pathsFor(", 'class="xp']) assert.ok(!app.includes(gone), `${gone}가 없어야`);
  assert.match(app, /<b>LV \$\{lv\}<\/b>/, "숫자 레벨은 설정 판에만(둘째 레프런스 — 2026-10-25 설정 창이 섬 안의 판으로)");
  assert.ok(!/\.lvc\b/.test(css), "옛 레벨 오버레이 CSS가 없다");
});

test("F-45: 기준점 하나 — 앱 안의 섬은 창 가운데(left:50% + translate), 설정 창이 옆에 열릴 때만 왼쪽 고정, 접힌 창 여유는 대칭. 움직임 키프레임에 -50% 가운데 맞춤이 없다", () => {
  assert.match(css, /\.in-app \.nav\{left:50%;top:0;transform:none;translate:-50% 0;/);
  assert.match(css, /\.in-app \.nav\.side\{[^}]*left:0;translate:0 0/);
  assert.match(css, /\.in-app \.nav\.peekroom\{padding:0 12px 8px\}/);
  assert.ok(!/@keyframes fly\{[^}]*translate\(-50%/.test(css), "fly 키프레임에 가운데 맞춤이 없다");
  const lib = read("library/library.css");
  assert.ok(!/@keyframes say-pop \{[^}]*translateX\(-50%\)/.test(lib) && !/@keyframes spin \{[^}]*translate\(-50%/.test(lib));
  assert.match(app, /const from = \$nav\.classList\.contains\("side"\) \? prev : \{ \.\.\.prev, x: to\.left \+ \(to\.width - prev\.w\) \/ 2 \}/, "가운데를 맞춘다");
  assert.match(app, /if \(p\.order === "resize-then-animate" && !morphHold\) measureSize\(\);/, "커질 때는 창을 먼저");
  assert.match(css, /--t-short:\.16s; --t-base:\.24s; --t-long:\.4s;/, "시간 · 곡선 묶음");
});

test("F-46: 배치를 바꾸는 움직임을 줄였다 — 보이지 않을 때 물범 움직임 멈춤(data-ui · page-hidden). (경험치 막대는 2026-10-21 C-22로 뺐다)", () => {
  assert.match(app, /document\.documentElement\.dataset\.ui = st\.ui;/);
  assert.match(sealCss, /html\[data-ui="hidden"\] \.cat \*, html\.page-hidden \.cat \* \{ animation-play-state: paused; \}/);
});

// C-22 뽑기 · 꾸미기 · AI 퀘스트 글 · 채팅의 '일하고 있어요' 띠(2026-10-21, 이재엽 "전부 해보자") — 글 · 규칙 시험. 동작은 e2e modes-flow.test.js가 본다
test("C-22: 뽑기는 조개 셋에 한 번(quest.js SHELL_COST · draw — 확률은 창에 늘 보인다), 얻은 것 · 입은 것은 기록에 남고(owned · wear), 입은 것은 플로로의 머리 안에 그린다(.c-wear), Esc는 뽑기 창부터 닫는다", () => {
  assert.match(app, /st\.shells -= QU\.SHELL_COST; st\.gacha = \{ phase: "rolling" \}; render\(\);/);
  // F-114(임유정 2026-11-01 "한번 뽑고 연속으로 뽑을 수 없는걸"): 나온 뒤(got)에도 조개가 남으면 바로 한 번 더 — 여는 중(rolling)만 막는다
  assert.match(app, /if \(!g \|\| !QU \|\| g\.phase === "rolling" \|\| st\.shells < QU\.SHELL_COST\) return;/, "gachaRoll — 여는 중만 막는다");
  assert.match(app, /const can = st\.shells >= QU\.SHELL_COST && g\.phase !== "rolling";/, "단추도 같은 조건");
  assert.match(app, /\$\{g\.phase === "got" \? "한 번 더 열기" : "조개 열기"\}/);
  assert.ok(!/g\.phase !== "ready"/.test(app), "ready에서만 열리던 조건은 없다");
  // F-115(임유정 2026-11-02): 섬이 접혀(알약) 있을 때 머리 줄의 조개를 누르면 섬을 옆 칸 크기로 펼치고 뽑기 창 — 뽑기 창은 섬 안이라 전에는 아무것도 안 보였다
  assert.match(app, /function openGacha\(\) \{ if \(colFolded\(\)\) \{ st\.islBig = false; st\.ui = "home"; clearIdle\(\); \} set\(\{ gacha: \{ phase: "ready" \} \}\); \}/);
  assert.match(app, /shells: \(\) => openGacha\(\),/); assert.match(app, /gacha: \(\) => openGacha\(\),/);
  assert.match(app, /const it = QU\.draw\(QU\.ITEMS, Math\.random\(\) \* 100\);/, "확률은 quest.js의 표");
  assert.match(app, /QU\.ITEMS\.map\(\(it\) => `<span><b>\$\{it\.emoji\} \$\{esc\(it\.name\)\}<\/b>\$\{esc\(it\.rar\)\} \$\{it\.p\}%<\/span>`\)/, "확률표가 창에 있다");
  assert.ok(app.includes("돈으로 사는 것은 없어요"), "돈으로 사지 않는다");
  const keep = /const KEEP = \[([^\]]+)\]/.exec(app)[1];
  assert.ok(keep.includes('"owned"') && keep.includes('"wear"') && keep.includes('"shells"'), "기록에 남는다");
  assert.match(app, /cat\(m, size, \{ extra: [^\n]*, hole: true, wear: Object\.values\(st\.wear\) \}\)/, "입은 것은 플로로 그림 안에(F-148)");
  assert.doesNotMatch(css, /\.deco\b/, "그림 밖에 따로 놓는 자리가 남지 않는다(F-148)");
  assert.match(app, /g\.phase === "got" \? cat\("happy", 124, \{ hole: true, wear: \[g\.item\.id\] \}\)/, "뽑기 창은 받은 물건을 플로로가 쓴 그림으로 보인다(F-148)");
  assert.match(app, /querySelector\("\.gacha \.stage svg\.cat"\)[\s\S]{0,80}classList\.add\("landing"\)/, "받는 순간은 뽑기 창 안의 플로로에서 — 섬의 플로로는 뽑기 층에 가려진다");
  assert.match(app, /if \(st\.gacha\) return set\(\{ gacha: st\.gacha\.phase === "rolling" \? st\.gacha : null \}\);/, "Esc — 여는 중에는 안 닫힌다");
  assert.match(app, /wear: \(i, el\) => \{ if \(!QU \|\| !el\) return; set\(\{ wear: QU\.toggleWear\(st\.wear, el\.dataset\.v\) \}\); \},/, "설정 창의 꾸미기 줄");
});

test("C-22: 퀘스트 글은 진짜 AI 모드에서만 /api/quest로 받고(연습 · 서버 없이는 기본 글), 못 받으면 기본 글로 두고 까닭만 말한다, 비밀값이 보이면 보내지 않는다. 판정의 쉬운 말(reason)과 Claude Code 알림은 채팅에 남는다", () => {
  assert.match(app, /const q = st\.quest; if \(!q \|\| !QU \|\| st\.mode !== "live" \|\| !canLive\) return;/);
  assert.match(app, /if \(sensitive\(idea\)\.length\) return say\(/);
  assert.match(app, /const r = await callAI\("\/api\/quest", \{ idea, stage: q\.chap, tier: st\.tier \}\);/);
  assert.match(app, /st\.quest = QU\.withAI\(st\.quest, r\.quest\)/);
  assert.match(app, /if \(!r\.ok\) say\(`퀘스트 글은 기본 글로 둘게요/);
  assert.match(app, /if \(j\.reason\) logMsg\("floro", esc\(j\.reason\)\);/, "쉬운 말 풀이");
  assert.match(app, /working\(\) \? `<div class="msg sys"><div class="b">Claude Code가 일하고 있어요/, "일하고 있어요 띠");
  assert.match(css, /\.msg\.sys \.bar i\{[^}]*animation:barrun/);
});

// claude-drafted: 2026-10-23 — 이재엽 "무지개 조개를 이미지를 만들어서 우리만의 재화를 보여줘 … 이렇게만 보이는 문제 해결"(위 줄에 동그라미 안 '0'만 보였다).
//   까닭: 재화 아이콘의 class 'shell'이 섬의 바탕 껍데기(.nav .shell — position:absolute · z-index:-1)와 겹쳐 단추 뒤로 숨었다. 재화는 class 'coin'에 무지개 조개 그림(SVG)
test("무지개 조개 — 재화 그림(SVG)은 class 'coin'으로 위 줄 · 보상 · 뽑기 · 설정에 같이 쓰고, 바탕 껍데기(.shell)와 이름이 겹치지 않는다", () => {
  const icons = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/icons.js"), "utf8");   // 그림은 icons.js로 옮겼다(2026-10-30 app.js 나누기 3차)
  assert.match(icons, /const SHELL_ICO = '<svg viewBox="0 0 24 24"/, "그림 하나");
  assert.match(icons, /const coin = \(\) => `<i class="coin" aria-hidden="true">\$\{SHELL_ICO\}<\/i>`;/);
  assert.match(css, /\.slots>i\{aspect-ratio:1;/, "보상 칸의 상자 모양은 바로 아래 i만 — 안쪽 조개 그림에 겹치지 않게");
  assert.ok(!/class="shell"/.test(app), "재화에 class 'shell'을 쓰지 않는다(바탕 껍데기 전용)");
  const tb = app.slice(app.indexOf("const tbRight = () =>"), app.indexOf("function stageBand()"));
  assert.match(tb, /data-act="shells"[^>]*>\$\{coin\(\)\}<span>\$\{st\.shells\}<\/span><\/button>/, "위 줄 — 조개 그림과 수");
  assert.ok((app.match(/\$\{coin\(\)\}/g) || []).length >= 3, "위 줄 · 뽑기 · 설정(보상 칸 · 보상 줄은 C-68 · C-70으로 글만 — 2026-10-30)");
  assert.match(app, /<i class="coin bigshell" aria-hidden="true">\$\{SHELL_ICO\}<\/i>/, "뽑기 창의 큰 조개도 같은 그림");
  assert.ok(!/conic-gradient\(from 200deg,#FF9AA2/.test(css), "옛 동그라미 무지개(원뿔 그라데이션)는 없다");
  assert.match(css, /\.coin\{[^}]*width:calc\(20px \* var\(--ui-scale,1\)\)/, "글자 크기 설정을 따른다");
  assert.match(css, /\.coin svg\{[^}]*width:100%;height:100%/);
  assert.ok(!/(^|\})\.shell\{/m.test(css), "재화용 .shell 규칙은 없다 — .nav .shell(바탕 껍데기)만");
});
