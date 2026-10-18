// claude-drafted: 2026-10-18 — 고칠 목록 F-12(이재엽 "나는 계속 GO야"): 한곳에서 보기의 토큰 표. 순수 함수만. 화면(app.js)이 쓴다.
// 서버로 열면 /api/usage(API.md 3-5)의 실제 값을, 파일로 열었거나 서버가 답하지 않으면 미리 만든 가상 숫자(books.js의 TOKENS)를 보인다.
// 어느 쪽인지(source)를 늘 같이 돌려준다 — 가상 숫자는 화면에 가상이라고 적는다(원칙 P7). 키 값은 /api/usage에 없으므로 여기도 없다.
(function (root) {
  const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : 0);
  const lim = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" && Number(v) > 0 ? Number(v) : null);
  // usage: /api/usage 응답(없으면 null), fake: { plan, used, names } — 통 이름(dev·test·demo·reserve)의 쉬운 말도 여기서 빌린다
  function view(usage, fake) {
    const names = (fake && fake.names) || {};
    if (!usage || usage.ok !== true) {
      const keys = Object.keys((fake && fake.plan) || {});
      const rows = keys.map((k) => ({ name: names[k] || k, used: num(fake.used[k]), limit: lim(fake.plan[k]) }));
      return { source: "fake", label: "가상 숫자예요 · 시연용", note: "", rows, used: rows.reduce((n, r) => n + r.used, 0), limit: rows.reduce((n, r) => n + (r.limit || 0), 0) || null };
    }
    const buckets = usage.buckets && typeof usage.buckets === "object" ? Object.entries(usage.buckets) : [];
    const rows = buckets.length
      ? buckets.map(([k, b]) => ({ name: names[k] || k, used: num(b && b.used), limit: lim(b && b.limit) }))
      : [{ name: usage.provider === "cli" ? "내 Claude 구독" : "내 API 키", used: num(usage.used), limit: lim(usage.budget) }];
    const note = usage.replay ? "녹화를 재생하는 중이에요 — 토큰을 쓰지 않아요"
      : usage.provider === "cli" && !buckets.length ? "구독으로 부르면 토큰을 세지 않아요 — 한도는 Claude 앱에서 봐요"
      : usage.state === "full" ? "한도를 다 써서 멈췄어요"
      : usage.state === "warn" ? "한도의 80%를 넘었어요" : "";
    return { source: usage.replay ? "replay" : "live", label: "이 컴퓨터에서 잰 값", note, rows, used: num(usage.used), limit: lim(usage.budget) };
  }
  const api = { view };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavTokenView = api;
})(typeof window !== "undefined" ? window : globalThis);
