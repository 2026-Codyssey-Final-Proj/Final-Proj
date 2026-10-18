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

  // FR-6 일정 충돌 — 진행 중인 프로젝트의 지금 단계 마감(오늘~horizon일)을 서로 · 캘린더 일정 · 팀 핀과 맞대어 본다.
  // 끝난 프로젝트와 이미 지난 마감은 충돌이 아니라 "늦음"이라 여기서 세지 않는다. 옮기는 결정은 사람이 한다(보여 주기만).
  // 마감이 없는 프로젝트(2026-10-19 실사용의 '내 책' — dues가 비어 있다)는 충돌이 없다 — 던지지 않고 건너뛴다
  function findClashes({ projects, events = [], pins = [], today, horizon = 14 }) {
    const live = projects
      .filter((p) => !(p.stage === 7 && p.todos.every((t) => t.done)))
      .map((p) => ({ p, due: Array.isArray(p.dues) ? p.dues[p.stage] : undefined }))
      .filter(({ due }) => { if (!due) return false; const d = daysBetween(today, due); return d >= 0 && d <= horizon; });
    const out = [];
    const byDay = {};
    for (const x of live) (byDay[x.due] = byDay[x.due] || []).push(x.p);
    for (const [date, ps] of Object.entries(byDay)) if (ps.length > 1) out.push({ kind: "같은 날 마감", date, with: ps.map((p) => p.id), titles: ps.map((p) => p.title) });
    for (const { p, due } of live) {
      for (const e of events) if (toUtc(e.from) <= toUtc(due) && toUtc(due) <= toUtc(e.to || e.from)) out.push({ kind: "일정과 겹침", date: due, event: e.title, with: [p.id], titles: [p.title] });
      const pin = [...pins].sort((a, b) => toUtc(a.date) - toUtc(b.date)).find((x) => toUtc(due) > toUtc(x.date));
      if (pin) out.push({ kind: "팀 일정 뒤", date: due, pin: pin.label, pinDate: pin.date, with: [p.id], titles: [p.title] });
    }
    return out.sort((a, b) => toUtc(a.date) - toUtc(b.date));
  }

  const api = { dueStatus, alertsFor, pinClashes, pinsFrom, daysBetween, findClashes };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Schedule = api;
})(typeof window !== "undefined" ? window : globalThis);
