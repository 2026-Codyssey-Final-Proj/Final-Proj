// claude-drafted: 2026-10-30 — 지식 퀘스트 C-47 남은 몫(이재엽 버튼 "10/31까지"): 재료는 저절로 · ③ 기록 칸의 한 장은 확인만(지식 퀘스트 PRD 3 · 6 · 7절, 9절 5번).
// 재료 — 퀘스트를 하는 동안 섬이 모은다: 내가 적어 보낸 말 · 맡긴 일 보고 · 허락 결정 · 먹이 구간의 종류. 가린 뒤(sensitive.js) 이름 · 한 줄 · 수만 —
//   대화 원문 · 도구 입력은 남기지 않는다. 이 컴퓨터(화면의 저장소)에만, 단계마다. 바뀐 파일은 모으지 않고 한 장을 만들 때 그 단계의 훅 알림에서 읽는다.
//   가리는 함수가 없으면 모으지도 초안을 만들지도 않는다(실패하면 닫힌 쪽 — 새 맥락 리뷰 2026-10-30).
// 한 장 — ③ 기록 칸(완료 보고 뒤)에서 재료 · 적은 칸 · 용어로 다섯 칸(생각 · 한 일 · 정한 것 · 배운 말 · 다음 할 일)을 **규칙으로** 만든다(AI를 부르지 않는다 —
//   연습 모드에서도 서버 없이, FR-10). 사람은 맞아요 / 고칠래요만. 확인한 한 장은 단계 결과(sheet)로 단계 문서의 '한 장' 절 · README의 그 단계 절에 쓰이고(docs.js),
//   폴더에서 다시 읽힌다(C-49 — 다시 읽을 때 잘라서 모양을 맞춘다: 손으로 길게 고쳐도 다음 올리기가 막히지 않게).
// 순수 함수 — 화면(app/48-sheet.js) · 문서(docs.js) · 서버(server.js 모양 검사)가 같이 쓴다. 시험: 04-tests/navigator/knowledge-sheet.test.js
(function (root) {
  const KINDS = ["chat", "report", "approve", "feed"];
  const LINE_MAX = 80, PER_KIND = 6, FIELD_MAX = 300, STAGES = 8;
  const DRAFT_MAX = 100;   // 플로로가 만드는 초안 칸의 길이 — 카드가 한눈에 읽히게(2026-10-30 이재엽 "퀘스트 내용에서 내용들이 너무 긴"). 사람이 고쳐 쓴 칸은 FIELD_MAX까지
  const FIELDS = [["think", "생각"], ["did", "한 일"], ["decided", "정한 것"], ["words", "배운 말"], ["next", "다음 할 일"]];
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const one = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim();
  const clip = (t, n) => { const s = one(t); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
  const stageOk = (n) => Number.isInteger(Number(n)) && Number(n) >= 0 && Number(n) < STAGES;

  // 재료 하나 더하기 — 새 묶음을 돌려준다(받은 것은 그대로). 같은 종류 · 같은 줄이면 수만 늘고, 종류마다 처음 하나 + 최근 것으로 PER_KIND개
  function add(store, n, kind, text, redact) {
    const base = store && typeof store === "object" && !Array.isArray(store) ? store : {};
    if (typeof redact !== "function" || !KINDS.includes(kind) || !stageOk(n)) return base;
    const t = clip(redact(one(text)), LINE_MAX);
    if (!t) return base;
    const list = Array.isArray(base[n]) ? base[n] : [], same = list.findIndex((x) => x.k === kind && x.t === t);
    let next = same >= 0 ? [...list.slice(0, same), ...list.slice(same + 1), { k: kind, t, c: (list[same].c || 1) + 1 }] : [...list, { k: kind, t, c: 1 }];
    const mine = next.filter((x) => x.k === kind);
    if (mine.length > PER_KIND) { const drop = mine[1]; next = next.filter((x) => x !== drop); }   // 처음 것(한 장의 '처음 한 말')은 남긴다
    return { ...base, [n]: next };
  }
  // 저장된 재료 → 모양이 맞는 줄만
  function fromSaved(v) {
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out = {};
    for (const [n, list] of Object.entries(v)) {
      if (!stageOk(n) || !Array.isArray(list)) continue;
      const ok = list.filter((x) => x && KINDS.includes(x.k) && typeof x.t === "string" && x.t && Number.isInteger(x.c) && x.c > 0).map((x) => ({ k: x.k, t: clip(x.t, LINE_MAX), c: x.c }));
      if (ok.length) out[n] = ok;
    }
    return out;
  }

  // 한 장 초안 — 다섯 칸, 칸마다 쉬운 말 한 줄(비어도). 칸마다 가린 뒤 자른다. 가리는 함수가 없으면 null
  function draft({ title = "", mats = [], cells = [], terms = [], files = [], next = "" } = {}, { redact } = {}) {
    if (typeof redact !== "function") return null;
    const of = (k) => mats.filter((x) => x.k === k), sum = (list) => list.reduce((a, x) => a + (x.c || 1), 0);
    const chat = of("chat"), rep = of("report"), feed = of("feed");
    const allow = sum(of("approve").filter((x) => x.t.startsWith("허용"))), deny = sum(of("approve").filter((x) => x.t.startsWith("거절")));
    const written = cells.filter((c) => c && one(c.line));
    const think = chat[0] ? `${title ? `${one(title)} — ` : ""}처음 한 말: “${chat[0].t}”` : written[0] ? `${one(title)} — ${one(written[0].line)}` : `${one(title) || "이 단계"}를 했어요`;
    const fileNames = [...new Set(files.map(one).filter(Boolean))];
    // 칸마다 부분이 여럿이면 몫을 나눠 자른다 — 합친 글 전체를 자르면 뒤쪽(허락 결정 · 먹인 글)이 통째로 사라졌다(2026-10-30 새 맥락 리뷰)
    const share = (parts, sep) => { const xs = parts.filter(Boolean), per = Math.floor((DRAFT_MAX - sep.length * (xs.length - 1)) / Math.max(1, xs.length)); return xs.map((x) => clip(x, per)).join(sep); };
    const did = share([rep.length ? `맡긴 일 보고 ${sum(rep)}개 — ${rep[rep.length - 1].t}` : "",
      fileNames.length ? `바뀐 파일 ${fileNames.length}개(${fileNames.slice(0, 3).join(", ")}${fileNames.length > 3 ? ` 외 ${fileNames.length - 3}` : ""})` : "",
      feed.length ? `먹인 글 — ${feed.map((x) => `${x.t} ${x.c}`).join(" · ")}` : ""], " · ") || "맡긴 일 · 바뀐 파일은 없었어요";
    const decided = share([written.slice(0, 3).map((c) => `${clip(c.name, 30)}: ${one(c.line)}`).join(" / "),
      allow || deny ? `허락 결정 — 허용 ${allow} · 거절 ${deny}` : ""], " · ") || "아직 정한 칸이 없어요";
    const w = [...new Set(terms.map(one).filter(Boolean))].slice(0, 5);
    const cut = (t) => clip(redact(one(t)), DRAFT_MAX);
    return { think: cut(think), did: cut(did), decided: cut(decided), words: cut(w.length ? w.join(" · ") : "새로 쓴 말은 없어요"), next: cut(next) || "관문에서 이해했는지 확인해요" };
  }

  // 한 장 모양 — 다섯 칸(글, FIELD_MAX자까지, 비면 안 됨) + 확인한 날(있으면 YYYY-MM-DD). 다른 칸은 받지 않는다
  function ok(s) {
    if (!s || typeof s !== "object" || Array.isArray(s)) return false;
    const keys = Object.keys(s).filter((k) => s[k] !== undefined), want = FIELDS.map(([k]) => k);
    if (!keys.every((k) => want.includes(k) || k === "at")) return false;
    return want.every((k) => typeof s[k] === "string" && one(s[k]) && s[k].length <= FIELD_MAX) && (s.at === undefined || (typeof s.at === "string" && DATE.test(s.at)));
  }
  // 문서 줄 — '- 생각: …' 다섯 + '- 확인한 날: …'. parse는 그 거꾸로(다섯이 다 있어야 한 장). 손으로 길게 고친 칸은 잘라서 — 돌려주는 것은 늘 ok()
  const toLines = (s) => [...FIELDS.map(([k, w]) => `- ${w}: ${one(s[k])}`), ...(s.at ? [`- 확인한 날: ${s.at}`] : [])];
  function parse(lines) {
    const out = {};
    for (const l of lines || []) {
      const m = /^- ([^:]+): (.*)$/.exec(l); if (!m) continue;
      const f = FIELDS.find(([, w]) => w === m[1]);
      if (f) out[f[0]] = clip(m[2], FIELD_MAX); else if (m[1] === "확인한 날" && DATE.test(m[2])) out.at = m[2];
    }
    return ok(out) ? out : null;
  }

  const api = { KINDS, LINE_MAX, PER_KIND, FIELD_MAX, DRAFT_MAX, FIELDS, add, fromSaved, draft, ok, toLines, parse };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeSheet = api;
})(typeof window !== "undefined" ? window : globalThis);
