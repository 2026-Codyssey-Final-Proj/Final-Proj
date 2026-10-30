// claude-drafted: 2026-10-28 — C-57 화면 디자인 바탕(이재엽 "지금 디자인이 너무 클로드 너가 만든 느낌 … 우리가 맞는 색감만 넣고 전체적으로 재작업해", 버튼 "앱 전체 한 번에" · 섬 "#363E62" · 글꼴 "자주 쓰는 한글만 남겨 작게"):
//   팀 웹사이트 초안의 색 토큰 · 글꼴 셋(앱에 파일로 — 바깥 주소 없이) · 글자 기호 대신 선 아이콘 · 대비 4.5:1. 코드보다 먼저 썼다(code.md 1번). 화면에서 재는 것은 04-tests/e2e/design.test.js
// 실행: node --test 04-tests/navigator/design.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");

// WCAG 대비 — 웹사이트 토큰 표(디자인 넘김 2절)의 '쓰는 곳'이 맞는지 숫자로
const lum = (hex) => { const c = hex.replace("#", "").match(/../g).map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test("글꼴 셋은 앱에 파일로(assets/fonts, OFL 함께) — fonts.css가 그 파일만 가리키고 바깥 주소가 없다, 자주 쓰는 한글만 남겨 글꼴당 700KB 아래", () => {
  const css = read("navigator/fonts.css");
  for (const fam of ["Bagel Fat One", "Gowun Dodum", "Nanum Gothic Coding"]) assert.match(css, new RegExp(`font-family:\\s*"${fam}"`), fam);
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/["']/g, ""));
  assert.ok(urls.length >= 4 && urls.every((u) => u.startsWith("../assets/fonts/") && u.endsWith(".woff")), `파일만: ${urls.join(",")}`);
  assert.ok(!/https?:/.test(css), "바깥 주소 없음");
  for (const u of urls) { const f = path.join(FRONT, "navigator", u); assert.ok(fs.existsSync(f), u); assert.ok(fs.statSync(f).size < 700 * 1024, `${u} 700KB 아래`); }
  for (const l of ["OFL-BagelFatOne.txt", "OFL-GowunDodum.txt", "OFL-NanumGothicCoding.txt"]) assert.ok(fs.existsSync(path.join(FRONT, "assets/fonts", l)), l);
  for (const h of ["navigator/index.html", "navigator/win.html"]) assert.match(read(h), /<link rel="stylesheet" href="fonts\.css">/, `${h}가 fonts.css를 연다`);
  assert.match(fs.readFileSync(path.join(FRONT, "assets/fonts/README.md"), "utf8"), /SIL Open Font License|OFL/, "출처 · 라이선스 한 줄");
});

test("app.css — 글은 Gowun Dodum, 제목 · 단계 숫자는 Bagel Fat One(--font-disp), 코드 · 파일 이름은 Nanum Gothic Coding; 옛 남색 · 쨍한 파랑은 없고 섬은 #363E62", () => {
  const c = read("navigator/app.css"), s = read("navigator/setup.css"), w = read("navigator/win.html"), m = read("electron/main.js");
  assert.match(c, /--font-text:"Gowun Dodum"/); assert.match(c, /--font-disp:"Bagel Fat One"/); assert.match(c, /--font-code:"Nanum Gothic Coding"/);
  assert.ok(!/-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo"/.test(c), "시스템 글꼴 묶음은 토큰(--font-text) 하나로");
  assert.ok(!/ui-monospace,"SF Mono"/.test(c), "코드 글꼴도 토큰(--font-code) 하나로");
  for (const [f, text] of [["app.css", c], ["setup.css", s], ["win.html", w], ["main.js", m]]) for (const old of ["#16225E", "#1A2766", "#0F1847", "#2860EE", "#A9DDFF"]) assert.ok(!text.includes(old), `${f}에 옛 색 ${old} 없음`);
  assert.match(c, /--isl:#363E62/, "섬 토큰"); assert.match(m, /backgroundColor: ws \? "#E9EEF6" : "#363E62"/, "앱 창 바탕도 섬 색");
  assert.match(c, /--desk:#E9EEF6; --win:#F2F5FA;/, "바탕 · 종이"); assert.match(c, /--acc-btn:#B8C9F0; --acc-ink:#263066/, "단추는 파스텔 + 남색 글씨");
  assert.ok(!/@media \(prefers-color-scheme:dark\)\{:root\{/.test(c), "다크 모드 토큰 묶음은 뺐다(요구서 C-57 ④ — 지금처럼 없음, 파스텔 하나)");
});

test("대비 — 토큰 표의 '쓰는 곳'대로면 본문 4.5:1 이상(흐린 글자는 종이 · 바탕 · 눈 위에서만, 단추 · 섬 · 금 · 볼 위의 글자)", () => {
  const pairs = [["#2B3463", "#F2F5FA"], ["#2B3463", "#E9EEF6"], ["#2B3463", "#D3E0F3"], ["#5B6491", "#F2F5FA"], ["#5B6491", "#E9EEF6"], ["#5B6491", "#E2E9F4"],
    ["#263066", "#B8C9F0"], ["#EEF1FA", "#363E62"], ["#AAB3D4", "#363E62"], ["#7A5E1E", "#EFE3C0"], ["#8E3A52", "#EFC3CB"], ["#2B3463", "#A9E2C4"], ["#4D66B5", "#F2F5FA"]];
  for (const [fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${fg} on ${bg} = ${ratio(fg, bg).toFixed(2)}`);
  assert.ok(ratio("#5B6491", "#D3E0F3") < 4.5, "흐린 글자는 얼음 위에서 4.5 아래 — 그래서 쓰지 않는다(표의 규칙이 빈말이 아님)");
});

test("app.js — 글자 기호(▲ ▼ ◀ ▶ ✓ ● 🗺 ⛩)를 아이콘으로 쓰지 않는다 — 섬 자리 넷 · 단계 칩 · 파일 칸 '지금' · 도전과제 탭 · 확인 표시는 선 아이콘(SVG) 또는 말", () => {
  const a = read("navigator/app.js");
  assert.ok(!/SIDE_UI = \{ top: \["위", "▲"\]/.test(a), "섬 자리 단추는 화살표 글자가 아니라 SVG");
  assert.ok(!a.includes('"● 지금"'), "파일 칸 '지금'은 말 + 모양(CSS)"); assert.ok(!a.includes("✓ V.") && !a.includes('"시작 ✓"'), "단계 칩의 ✓는 SVG(CHECK)");
  assert.ok(!a.includes("🗺") && !a.includes("⛩"), "도전과제 탭 · 관문은 선 아이콘");
  assert.match(a, /const OK_ICON = /, "확인 표시 아이콘 하나"); assert.ok(!/badge: "✓"/.test(a), "카드 뱃지도 OK_ICON");
  assert.ok(!/\$\{ok \? "✓" : "○"\}/.test(a), "점검 목록의 ✓ · ○도 아이콘");
});

// claude-drafted: 2026-10-30 — 퀘스트 탭 합치기 PRD C-68(두승현 목업 확정본 "공책 모양 — 모양까지 바꿈"): 공책 두 쪽 · 갈색 · 금색을 빼고 한 목록으로
test("C-68 — 퀘스트 카드 · 맡길 일은 한 목록: 공책 규칙(.book · .page · .toc)이 없고, 퀘스트 카드 규칙에 갈색 · 금색이 경고 밖에서 0곳, 얼음 면 위 글은 진한 남색", () => {
  const css = read("navigator/app.css");
  for (const sel of [".book{", ".book .", ".page{", ".page.l", ".page.r", ".toc{", ".toc button"]) assert.ok(!css.includes(sel), `${sel} — 공책 두 쪽 규칙은 뺐다`);
  // 퀘스트 카드 쪽 규칙(선택자에 .qcard · .ln · .pacts · .piece · .qhead · .qrows가 든 것)만 본다 — 도전과제의 갈색(.adv · .vtabs · .bn)은 ⓑ(C-66)에서
  const rules = css.split("}").map((r) => r.split("{")).filter((p) => p.length === 2).map(([s, b]) => [s.trim(), b]);
  const mine = rules.filter(([s]) => /\.(qcard|ln|pacts|piece|qhead|qrows|qprog|qfoot)\b/.test(s) && !/\.qs-skip|\.sm-ban/.test(s));
  assert.ok(mine.length >= 8, `퀘스트 카드 규칙이 있다(${mine.length})`);
  for (const [s, b] of mine) for (const hex of ["#E9DFC6", "#6B5E48", "#454E77", "#E6CB86", "#EFE3C0", "#7A5E1E", "#7A5B12"]) assert.ok(!b.toUpperCase().includes(hex), `${s} — ${hex}(갈색 · 금색)은 경고 밖에서 쓰지 않는다`);
  assert.match(css, /\.pacts button\.pri\{background:var\(--acc-btn\);border-color:var\(--acc-btn\);color:var\(--acc-ink\)\}/, "주 단추는 하늘색 알약 그대로(C-62)");
  assert.match(css, /\.ln\.st-now\{[^}]*background:var\(--acc-soft\)/, "지금 줄은 면의 색으로만(얼음)");
  assert.ok(!/\.ln\.st-now\{[^}]*(border-left|outline|box-shadow)/.test(css), "지금 줄에 왼쪽 막대 · 테두리 강조 없음");
  assert.match(css, /\.ln\.st-now[^{]*\.easy[^{]*\{[^}]*color:var\(--ink\)/, "얼음 면 위 흐린 글은 진한 남색으로(5B6491은 얼음 위 4.3:1)");
  assert.ok(ratio("#2B3463", "#D3E0F3") >= 4.5 && ratio("#2B3463", "#E2E9F4") >= 4.5 && ratio("#5B6491", "#E2E9F4") >= 4.5, "카드 면 위 글자 대비");
});
