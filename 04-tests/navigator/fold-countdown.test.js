// claude-drafted: 2026-10-28 — 임유정 "일정시간 반응이 없으면 알약 형태로 변하잖아. 변하기 전에 주위에 흰색 줄이 생겨나면서 시간 지나갈 때 마우스로 움직이거나 클릭을 하면
//   시간 지나가는게 멈춰야 하는데 안 멈추고 그냥 줄어들어버려". 앱에서 퀘스트 창(작업실)이 열리면 섬은 그 창의 옆 칸(win.js)에 그려지는데, 그 창은 섬에게
//   '옆 칸에 마우스 올림' · '글 쓰는 중'만 알려서 작업실에서 움직이거나 눌러도 접히는 시계가 그대로 갔다.
//   2026-10-29 두승현 결정으로 흰 줄(테두리 빛)은 뺐다 — 시계를 되돌리는 알림은 섬이 펼쳐져 있으면 보낸다(전에는 흰 줄이 돌 때만)
// 실행: node --test 04-tests/navigator/fold-countdown.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (f) => fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator", f), "utf8");

test("작업실 창 — 움직이거나 누르거나 치거나 굴리면(1초에 한 번까지, 섬이 펼쳐져 있을 때만) 섬에 알린다", () => {
  const w = read("win.js");
  assert.ok(w.includes('for (const n of ["pointermove", "pointerdown", "keydown", "wheel"]) root.addEventListener(n, poke, { passive: true });'), "움직임 · 누름 · 키 · 굴림");
  assert.match(w, /if \(t - pokeAt < 1000\) return;/, "1초에 한 번까지");
  assert.match(w, /if \(!root\.querySelector\("\.isl"\)\) return;/, "섬이 펼쳐져 있을 때만 — 접힌 알약이면 섬에 보내지 않는다");
  assert.match(w, /F\.winEvent\(\{ type: "poke" \}\)/);
});

test("섬 — poke면 접히는 시계를 처음부터, 옆 칸에 마우스가 들어오고 나가면 시계를 멈추고 다시 센다", () => {
  const a = read("app.js");
  assert.ok(a.includes('if (p.type === "poke") { if (st.ui === "home" && timer) { clearIdle(); scheduleIdle(); } return; }'), "poke → 시계를 처음부터");
  assert.ok(a.includes("colHover = p.hover; if (p.hover) clearIdle(); else scheduleIdle(); }"), "들어오면 멈추고 나가면 다시 센다");
});
