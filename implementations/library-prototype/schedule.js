// claude-drafted: 2026-10-17 — 마감이 붙은 단계 지도의 날짜 계산(순수 함수, schedule.test.js가 시험).
// 프로젝트 일정을 따로 만들지 않고 단계마다 마감 날짜를 붙인다. 알림 시점은 세컨드 브레인에서 정한 3일 전 · 1일 전 · 당일 아침 8시(Q2)를 그대로 쓴다.
(function (root) {
  const DAY = 864e5;
  function toUtc(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).slice(0, 10));
    if (!m) throw new Error(`날짜는 YYYY-MM-DD로 적어요: ${s}`);
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }
  const ymd = (t) => new Date(t).toISOString().slice(0, 10);
  const daysBetween = (from, to) => Math.round((toUtc(to) - toUtc(from)) / DAY);

  function dueStatus(due, today) {
    const days = daysBetween(today, due);
    if (days < 0) return { days, state: "late", label: `${-days}일 지남` };
    if (days === 0) return { days, state: "today", label: "오늘 마감" };
    if (days <= 3) return { days, state: "soon", label: days === 1 ? "내일 마감" : `${days}일 남음` };
    return { days, state: "ok", label: `${days}일 남음` };
  }

  function alertsFor(due, today) {
    const d = toUtc(due);
    return [[3, "3일 전"], [1, "1일 전"], [0, "당일 아침"]].map(([n, label]) => {
      const day = ymd(d - n * DAY);
      return { when: n ? day : `${day} 08:00`, label, past: daysBetween(today, day) < 0 };
    });
  }

  // 팀 일정 핀(기능 동결 · 제출)보다 늦게 끝나는 단계 — 가장 이른 핀 하나만 알린다
  function pinClashes(dues, pins) {
    const sorted = [...pins].sort((a, b) => toUtc(a.date) - toUtc(b.date));
    const out = [];
    dues.forEach((due, stage) => {
      const pin = sorted.find((p) => toUtc(due) > toUtc(p.date));
      if (pin) out.push({ stage, due, pin: pin.label, pinDate: pin.date });
    });
    return out;
  }

  const pinsFrom = (pins, today) => pins.map((p) => ({ ...p, days: daysBetween(today, p.date) }));

  const api = { dueStatus, alertsFor, pinClashes, pinsFrom, daysBetween };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Schedule = api;
})(typeof window !== "undefined" ? window : globalThis);
