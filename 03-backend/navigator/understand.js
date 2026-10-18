// claude-drafted: 2026-10-18 — 이재엽 요청("화면 빈칸을 채워")으로 Claude가 썼다. 넘어가기 전 확인(FR-4·5)에 더하는 두 가지. 순수 함수만. 화면(app.js)이 쓴다.
// ① '예만 누르기' 대책 — "예"를 누르면 짧은 확인 질문 1개(이재엽 결정 2026-10-18 "짧은 확인 질문 1개").
//    정답은 그 단계에서 만든 것(gives), 오답 둘은 다른 단계에서 만든 것. 틀려도 막지 않고 정답과 한 줄 설명(does)을 보인 뒤 넘어간다.
// ② 보류(Hold, FR-5) — "아니요"가 길어지면 잠시 멈추고, 누가·언제 다시 볼지 적어 둔다. 보류해도 넘어가는 규칙(canAdvance)은 그대로다.
(function (root) {
  const N = typeof module !== "undefined" && module.exports ? require("./navigator.js") : root.NavRules;

  // ── ① 확인 질문 ──
  const ASK = "이번 단계가 끝나면 무엇이 남나요?";
  // 섞는 순서를 단계 번호로 정한다 — 같은 단계면 늘 같은 질문(시연·녹화가 매번 같다). mulberry32
  function seeded(seed) {
    let a = (seed * 2654435761) >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const shuffle = (list, rand) => { const out = list.slice(); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };
  // 돌려주는 것: {stage, ask, options(3개), answer(정답 자리), why(틀렸을 때 보일 한 줄)}. 오답 거리가 둘 안 되면 null(묻지 않는다)
  function checkQuestion(n, stages = N.STAGES) {
    const s = stages.find((x) => x.n === n);
    if (!s) return null;
    const others = [...new Set(stages.filter((x) => x.n !== n).map((x) => x.gives))].filter((g) => g && g !== s.gives);
    if (others.length < 2) return null;
    // 오답 둘은 섞어서 고르고, 정답 자리는 단계마다 돌아간다(0·1·2번째) — 늘 같은 자리면 읽지 않고 맞힐 수 있어서
    const options = shuffle(others, seeded(n + 1)).slice(0, 2), answer = n % 3;
    options.splice(answer, 0, s.gives);
    return { stage: n, ask: ASK, options, answer, why: s.does };
  }
  const grade = (q, i) => ({ ok: i === q.answer, right: q.options[q.answer], why: q.why });
  // 확인 질문 결과를 쌓는다 — {단계, 맞혔나, 날짜}. 원본은 바꾸지 않는다
  const record = (list, stage, ok, at) => [...(list || []), { stage, ok, at }];
  // 플로로의 [표정, 말풍선] — 묻는 중 / 맞힘 / 틀림. check: {q, pick, ok}
  const FACE = {
    ask: ["think", "하나만 더 물어볼게요. 가볍게 골라 보세요."],
    right: ["happy", "맞아요! 이번 단계를 잘 알고 있어요."],
    wrong: ["think", "괜찮아요. 정답을 같이 보고 넘어가요."],
    hold: ["idle", "괜찮아요. 쉬었다가 정한 날에 다시 같이 봐요."],   // 잠시 멈추기를 적는 중·멈춰 둔 동안
  };
  const face = (c) => (!c || c.pick === undefined || c.pick === null ? FACE.ask : c.ok ? FACE.right : FACE.wrong);

  // ── ② 보류 ──
  // "아니요" 몇 번 뒤에 '잠시 멈추기'를 권하나 — 3회. requirements.md 13-1 확정 기록(이재엽 2026-10-16 "3회").
  // 시연은 1회 루프(2026-10-14)이고 3회는 설계값이다. 넘어가기 전 확인을 다시 열면 처음부터 센다
  const HOLD_AFTER_NO = 3;
  const offerHold = (noCount) => noCount >= HOLD_AFTER_NO;
  const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
  const realDay = (d) => { const m = ISO.exec(String(d || "")); if (!m) return false; const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return t.getUTCMonth() === +m[2] - 1 && t.getUTCDate() === +m[3]; };
  // 보류 기록 — {단계, 누가 다시 볼지(비우면 '나', 20자까지), 언제(YYYY-MM-DD, 오늘이나 그 뒤), 적은 날}. 날짜가 틀리면 null
  function makeHold({ stage, who, when, today }) {
    if (!realDay(when) || String(when) < String(today)) return null;
    const name = String(who || "").trim().slice(0, 20) || "나";
    return { stage, who: name, when, at: today };
  }
  const md = (d) => { const m = ISO.exec(d); return `${+m[2]}/${+m[3]}`; };
  // 오늘 카드의 띠 한 줄
  function holdLine(h, today) {
    if (String(today) >= h.when) return `보류 중 · 다시 보기로 한 날이 됐어요 (${md(h.when)})`;
    return `보류 중 · ${md(h.when)}에 다시 보기${h.who && h.who !== "나" ? ` · 다시 볼 사람: ${h.who}` : ""}`;
  }

  const api = { ASK, checkQuestion, grade, record, FACE, face, HOLD_AFTER_NO, offerHold, makeHold, holdLine };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavUnderstand = api;
})(typeof window !== "undefined" ? window : globalThis);
