  // ── 작업실의 첫 사용 안내(C-73, 2026-11-05 두승현 — 게임 온보딩처럼 눌러야 할 곳만 밝게 + 플로로 말풍선). 그리기 · 걸음 계산은 coach.js, 여기는 상태 · 신호 · 누르기(처음 설정의 안내는 setup.js) ──
  //   처음 설정을 '시작하기'로 끝낸 직후에만 시작한다 — 이미 쓰던 사람 · 주소 끝 장면 · 휴대폰에는 뜨지 않는다. 기록 지우기로 처음부터 하면 다시 나온다
  keep(["coach", "coachDone"]);
  if (!(st.coach && Array.isArray(st.coach.seen))) st.coach = null;
  // 95-boot의 같은 신호보다 먼저 듣는다(조각 차례) — 그쪽의 go("home")이 그릴 때 이미 켜져 있다
  document.addEventListener("floe:setup-done", ({ detail }) => { if (detail && detail.open && !st.coachDone && !st.coach && !st.j && !st.quest && !isPhone()) st.coach = { seen: [] }; });
  const coachNow = () => (window.FloeCoach ? window.FloeCoach.stepOf({ on: !!st.coach, ui: st.ui, busy: !!st.busy,
    blocked: !!(st.warn || st.error || st.apWait || st.settings || st.gacha || st.pane || st.openInput),
    hasQuest: !!(st.quest || st.j), draft: !!(st.quest && st.quest.draft),
    filled: st.quest ? st.quest.objs.filter((_, i) => QU.filled(st.quest, i)).length : 1, seen: st.coach ? st.coach.seen : [] }) : "");
  function coachTag() { const id = coachNow(); return id ? `<i hidden data-coach="${id}"></i>` : ""; }
  const coachEnd = (line) => { st.coach = null; st.coachDone = true; render(); say(line); };
  Object.assign(ACT, {
    "coach-next": () => { const id = coachNow(); if (id === "tabs") return coachEnd("이제 같이 만들어 봐요!"); if (id && st.coach) { st.coach.seen.push(id); render(); } },
    "coach-skip": () => { if (st.coach) coachEnd("안내는 여기까지 할게요. 궁금한 건 언제든 물어봐 주세요."); },
  });
  if (window.FloeCoach) window.FloeCoach.init((act) => clickAct({ dataset: { act } }));
