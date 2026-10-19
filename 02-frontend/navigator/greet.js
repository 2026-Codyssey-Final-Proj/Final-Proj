// claude-drafted: 2026-10-20 — 이재엽 요청(C-10 켜짐과 인사: "처음에 반갑다고 인사하고 하는 모습이랑 켜지는 모습들", 버튼 "켤 때마다").
// 켤 때 인사의 **시간표와 규칙**만 — 순수 함수라 Node 시험(04-tests/navigator/greet.test.js)이 돈다. 그림 · 움직임은 app.js(단계 class) · app.css(각 단계의 모양).
// 순서(넘김 문서 2026-10-20 3절): 띠의 물결 선이 그려짐(wave) → 섬이 인사 크기로 열림(open) → 플로로가 물속에서 솟음(pop) →
// 옆으로 살짝 가서 지느러미를 흔들며 시간대 인사말(hello) → 가운데로 돌아와 글과 단추가 나타남(settle) → 끝(done). 다 합쳐 3.4초, 상한 5초.
// coucou(MIT)의 "노치에서 나와 인사하고 돌아간다"는 **순서**만 참고했고 코드 · 그림 · 소리는 가져오지 않았다(legal.md D-1).
(function (root) {
  const TIMELINE = [
    { at: 0, phase: "wave" },
    { at: 400, phase: "open" },
    { at: 600, phase: "pop" },
    { at: 1100, phase: "hello" },
    { at: 2600, phase: "settle" },
    { at: 3400, phase: "done" },
  ];
  const LIMIT = 5000;   // 이보다 길면 안 된다(넘김 문서 9절 3번 기본값)
  const total = (timeline = TIMELINE) => (timeline.length ? timeline[timeline.length - 1].at : 0);

  // 인사를 할지 — 주소 끝(#…)이 있으면 녹화 · 시험 장면이라 안 한다(setup.js shouldOpen과 같은 규칙), 휴대폰 화면은 따로, 움직임 줄이기면 카드만
  function shouldGreet({ hash = "", still = false, phone = false } = {}) {
    if (hash && hash !== "#") return { greet: false, why: "주소 끝 장면" };
    if (phone) return { greet: false, why: "휴대폰 화면" };
    if (still) return { greet: false, why: "움직임 줄이기 — 인사 카드만" };
    return { greet: true, why: "" };
  }

  // 시간표를 돌린다 — onPhase(단계 이름)를 차례로 부른다. skip()은 남은 타이머를 모두 지우고 바로 "done"을 한 번만 부른다(누름 · Esc).
  // cancel()은 지우기만 한다(화면을 떠날 때). 타이머 함수는 시험이 가짜로 넣는다
  function play(timeline, { setTimeout: later = root.setTimeout, clearTimeout: cancelTimer = root.clearTimeout, onPhase } = {}) {
    let timers = [], finished = false;
    const done = () => { if (finished) return; finished = true; timers.forEach(cancelTimer); timers = []; onPhase && onPhase("done"); };
    for (const step of timeline) {
      if (step.phase === "done") { timers.push(later(done, step.at)); continue; }
      timers.push(later(() => { if (!finished && onPhase) onPhase(step.phase); }, step.at));
    }
    return { skip: done, cancel: () => { timers.forEach(cancelTimer); timers = []; finished = true; }, get finished() { return finished; } };
  }

  const api = { TIMELINE, LIMIT, total, shouldGreet, play };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeGreet = api;
})(typeof window !== "undefined" ? window : globalThis);
