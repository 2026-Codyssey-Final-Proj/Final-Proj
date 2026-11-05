// claude-drafted: 2026-11-05 — 첫 사용 안내(두승현 "게임의 온보딩 튜토리얼을 레퍼런스로 … 눌러야 하는 화면에 하이라이트 … 다른 화면은 어둡게 암전 … 마스코트 플로로가 말풍선으로 초심자의 시야로 친절하게 안내").
// 처음 설정을 '시작하기'로 끝낸 뒤 첫 퀘스트의 첫 칸까지 — 적기 → 보내기 → 퀘스트 판 → 첫 칸 확인 → 탭. 처음 적은 말은 진짜 프로젝트가 된다(버튼 "진짜 프로젝트로 시작").
// 앱은 작업실 창(win.js)이 섬이 보낸 HTML만 그리고, 브라우저 판은 한 문서다 — 섬은 걸음 이름(<i data-coach>, app/88-coach.js)만 보내고 층은 이 파일이 그 창의 body에 그린다.
// 처음 설정(setup.js)도 같은 층을 쓴다 — 걸음표는 define으로 등록하고, 앱의 설정 창은 투명해서 clip으로 카드 안만 어둡게 한다(창 전체를 어둡게 하면 바탕 화면 위에 회색 네모가 생긴다).
//   층을 body에 두는 까닭: 화면을 다시 그릴 때마다 root 안은 새로 만들어져 움직임이 끊긴다. 대상 자리는 requestAnimationFrame으로 따라간다(칸이 비키는 0.3초 · 창 크기 · 다시 그리기를 따로 챙기지 않게) —
//   ponytail: 안내가 켜진 동안 프레임마다 재기. 첫 사용 몇 분뿐이라 그대로 둔다
// 순수 함수는 04-tests/navigator/coach.test.js가 본다.
(function (root) {
  "use strict";
  // sel — 밝게 둘 곳(여럿이면 합친다). clip — 어둡게 할 범위(없으면 창 전체). dot — [번호, 전체](없으면 numberOf). prefer — 들어가면 이쪽에(①은 위에 두면 가운데의 큰 플로로와 질문을 가린다). look — 보기만(밝은 곳도 눌리지 않고 말풍선 단추로 넘어간다). typed · when — 말이 바뀌는 조건
  const STEPS = {
    say: { sel: ".cin", mood: "happy", focus: ".mc-input", prefer: "below", text: "만들고 싶은 걸 여기에 편하게 적어 보세요. 한 줄이어도 괜찮아요. 아직 몰라도 제가 같이 정해 드릴게요!", typed: "좋아요! '보내기'를 누르면 제가 읽고 할 일을 만들어 올게요." },
    board: { sel: ".qcard", mood: "look", look: true, next: "다음", text: "다 만들었어요! 이게 1단계에서 할 일이에요. 어렵게 생각하지 마세요. 저랑 한 칸씩 채우면 돼요." },
    ok: { sel: ".msg.floro.now, .opts, .cin", mood: "look", when: '[data-act="draft-ok"]', text: "제가 생각한 내용을 적어 봤어요. 맞으면 '맞아요', 다르면 '고칠래요'를 눌러 주세요.", otherwise: "이 칸에 들어갈 말을 한 줄로 적어 보거나, 제가 보여 드린 것 중에서 골라 주세요." },
    tabs: { sel: ".wtabs", mood: "happy", look: true, next: "시작해요", text: "잘했어요! 남은 칸도 똑같이 하면 돼요. 쌓인 기록은 여기 옆 탭에서 언제든 볼 수 있어요." },
  };
  const TOTAL = 5;
  // 지금 걸음 — 저장한 번호가 아니라 상태에서 계산한다(껐다 켜도, 다른 일이 끼어도 그 자리로 돌아온다). ""이면 암전하지 않는다
  function stepOf({ on, ui, blocked, busy, hasQuest, draft, filled, seen = [] }) {
    if (!on || ui !== "home" || blocked || busy) return "";
    if (!hasQuest) return "say";
    if (filled > 0) return "tabs";
    return draft && !seen.includes("board") ? "board" : "ok";   // 초안을 못 받았으면 섬이 가운데라 퀘스트 판이 보이지 않는다
  }
  const numberOf = (id, typed) => (id === "say" ? (typed ? 2 : 1) : { board: 3, ok: 4, tabs: 5 }[id]);
  // 칸들을 합친 자리 — 창 안으로 자른다. 보이는 곳이 없으면 null(그때는 암전도 막기도 하지 않는다)
  function unionRect(rects, view) {
    if (!rects.length) return null;
    const left = Math.max(0, Math.min(...rects.map((r) => r.left))), top = Math.max(0, Math.min(...rects.map((r) => r.top)));
    const right = Math.min(view.w, Math.max(...rects.map((r) => r.right))), bottom = Math.min(view.h, Math.max(...rects.map((r) => r.bottom)));
    return right > left && bottom > top ? { x: left, y: top, w: right - left, h: bottom - top } : null;
  }
  // 말풍선 자리 — prefer가 들어가면 거기, 아니면 들어가는 쪽 중 남는 공간이 가장 큰 쪽. 어디에도 안 들어가면 그나마 넓은 쪽에 두고 창 안으로 맞춘다
  function placeBubble(t, bub, view, prefer = "", gap = 16, margin = 12) {
    const need = { right: bub.w, left: bub.w, below: bub.h, above: bub.h };
    const room = { right: view.w - t.x - t.w, left: t.x, below: view.h - t.y - t.h, above: t.y };
    const side = prefer && room[prefer] >= need[prefer] + gap ? prefer : Object.keys(room).sort((a, b) => room[b] - need[b] - (room[a] - need[a]))[0];
    const x = side === "right" ? t.x + t.w + gap : side === "left" ? t.x - bub.w - gap : t.x + t.w / 2 - bub.w / 2;
    const y = side === "below" ? t.y + t.h + gap : side === "above" ? t.y - bub.h - gap : t.y + t.h / 2 - bub.h / 2;
    const fit = (v, size, max) => Math.max(0, Math.min(max - size, Math.max(margin, Math.min(v, max - size - margin))));
    return { x: Math.round(fit(x, bub.w, view.w)), y: Math.round(fit(y, bub.h, view.h)), side };
  }

  // ── 화면 ──
  const doc = root.document;
  let ready = false, onAct = () => {}, layer = null, dim = null, hole = null, bub = null, cat = null, words = null, dots = null, nextBtn = null;
  let cur = "", shown = "", raf = 0, placed = "";
  function build() {
    layer = doc.createElement("div"); layer.id = "floe-coach"; layer.hidden = true;
    layer.innerHTML = `<div class="coach-dim"><div class="coach-hole"></div></div><div class="coach-bub" role="dialog" aria-label="플로로의 안내"><div class="coach-cat"></div><div class="coach-paper"><p class="coach-words" aria-live="polite"></p>
      <div class="coach-foot"><span class="coach-dots" role="img"></span><span class="coach-btns"><button type="button" class="coach-skip">건너뛰기</button><button type="button" class="coach-next"></button></span></div></div></div>`;
    doc.body.appendChild(layer);
    dim = layer.querySelector(".coach-dim"); hole = layer.querySelector(".coach-hole"); bub = layer.querySelector(".coach-bub"); cat = layer.querySelector(".coach-cat");
    words = layer.querySelector(".coach-words"); dots = layer.querySelector(".coach-dots"); nextBtn = layer.querySelector(".coach-next");
    layer.querySelector(".coach-skip").addEventListener("click", () => send("coach-skip"));
    nextBtn.addEventListener("click", () => send("coach-next"));
    // 밝은 곳 · 말풍선 밖은 막는다 — 앞에서(캡처) 막아야 root의 data-act 손잡이 · 풍선 도움말에 닿지 않는다. Enter로 누르는 것도 keydown · click에서 같이 막힌다
    for (const type of ["click", "dblclick", "pointerdown", "mousedown", "contextmenu", "mouseover", "keydown"]) doc.addEventListener(type, guard, true);
  }
  const send = (act) => (STEPS[cur] && STEPS[cur].own ? STEPS[cur].own(act) : onAct(act));
  const allowed = (t) => !!t && !!t.closest && (!!t.closest("#floe-coach") || (!STEPS[cur].look && !!t.closest(STEPS[cur].sel)));
  function guard(e) {
    if (!cur || layer.hidden) return;
    if (e.type === "keydown" && e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); return send("coach-skip"); }
    if (e.type === "keydown" && e.key === "Tab") return;
    if (!allowed(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }
  const pulse = (on) => { const b = doc.querySelector('[data-act="send"]'); if (b) b.classList.toggle("coach-pulse", on); };
  function hide() { shown = ""; if (layer) { layer.hidden = true; layer.classList.remove("on"); } }
  function tick() {
    raf = 0;
    if (!cur) return;
    raf = requestAnimationFrame(tick);
    const s = STEPS[cur], view = { w: doc.documentElement.clientWidth, h: doc.documentElement.clientHeight };
    const rects = [...doc.querySelectorAll(s.sel)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
    const t = unionRect(rects, view);
    if (!t) return hide();   // 대상이 없으면(다른 카드 · 판) 막지 않는다 — 안내 때문에 앱이 멈추면 안 된다
    const input = s.typed ? doc.querySelector(s.focus) : null, typed = !!(input && input.value.trim());
    const text = typed ? s.typed : s.when && !doc.querySelector(s.when) ? s.otherwise : s.text;
    if (s.typed) pulse(typed);
    if (shown !== `${cur}|${text}`) {
      const first = !shown.startsWith(`${cur}|`);
      shown = `${cur}|${text}`; words.textContent = text;
      if (first) {
        cat.innerHTML = root.NavSeal ? root.NavSeal.svg(s.mood, 84, { hole: true }) : "";
        nextBtn.hidden = !s.next; nextBtn.textContent = s.next || "";
        layer.hidden = false;
        requestAnimationFrame(() => { if (!layer.hidden) layer.classList.add("on"); });
        const f = s.focus ? doc.querySelector(s.focus) : s.next ? nextBtn : null; if (f) f.focus();
        if (s.clip) { const o = doc.querySelector(s.sel); if (o) o.scrollIntoView({ block: "nearest" }); }   // 처음 설정 카드는 스크롤될 수 있다
      }
      const [n, all] = s.dot || [numberOf(cur, typed), TOTAL];
      dots.setAttribute("aria-label", `안내 ${n} / ${all}`);
      dots.innerHTML = Array.from({ length: all }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
      placed = "";   // 글 길이가 바뀌면 말풍선 높이도 바뀐다
    }
    const box = s.clip ? doc.querySelector(s.clip) : null, b = box ? box.getBoundingClientRect() : { left: 0, top: 0, width: view.w, height: view.h };
    const pad = 6, rx = t.x - pad, ry = t.y - pad, rw = t.w + pad * 2, rh = t.h + pad * 2, key = `${rx}|${ry}|${rw}|${rh}|${view.w}|${view.h}|${b.left}|${b.top}|${b.width}|${b.height}`;
    if (key === placed) return;
    placed = key;
    dim.style.cssText = `left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px;border-radius:${box ? 28 : 0}px`;
    hole.style.cssText = `left:${rx - b.left}px;top:${ry - b.top}px;width:${rw}px;height:${rh}px`;
    const p = placeBubble({ x: rx, y: ry, w: rw, h: rh }, { w: bub.offsetWidth, h: bub.offsetHeight }, view, s.prefer);
    bub.dataset.side = p.side; bub.style.transform = `translate(${p.x}px,${p.y}px)`;
  }
  // 화면을 그릴 때마다 — 신호를 읽어 걸음을 맞춘다. 앱의 섬 창처럼 작업실이 없는 쪽은 신호가 없어 아무것도 하지 않는다
  function sync() {
    if (!ready) return;
    const m = doc.querySelector("[data-coach]"), id = m && STEPS[m.dataset.coach] ? m.dataset.coach : "";
    if (id === cur) return;
    if (cur === "say") pulse(false);
    cur = id;
    if (!id) { hide(); if (raf) { cancelAnimationFrame(raf); raf = 0; } return; }
    if (!layer) build();
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function init(act) { ready = true; onAct = act; sync(); }
  // 걸음표 등록 — own: 그 걸음의 말풍선 단추를 받을 곳(처음 설정은 섬의 누르기 표 밖에 있다)
  function define(steps, own) { for (const id of Object.keys(steps)) STEPS[id] = { ...steps[id], own }; }

  const api = { STEPS, TOTAL, stepOf, numberOf, unionRect, placeBubble, init, define, sync };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeCoach = api;
})(typeof window !== "undefined" ? window : globalThis);
