// claude-drafted: 2026-10-28 — C-56 R-1 기준 카드(이재엽 "사용자에 맞춰서 기준을 만들고 이미 있는 내용이라면 어떤식으로 작성할지", 버튼 "1단계 관문에서" · "'옮김' 새 값"):
//   1단계 관문을 지날 때 1단계 칸 · 받은 글 · (있으면) 2단계 칸으로 이 프로젝트의 기준 한 장 — 만드는 것 · 쓰는 사람 · 크기 · 이미 정해진 것 · 재료 · 다룰 정보 · 밖으로 · 성공.
//   지난 칸 · 받은 글에서 온 줄은 출처와 함께 '옮겨 옴'(moved), 사람만 아는 것(성공 숫자 등)은 빈칸(blank) — 지어내지 않는다. 사람이 채우면 '직접'(me). docs/기준.md로 남긴다(toMarkdown). 순수 함수 — 시험 04-tests/navigator/basecard.test.js
(function (root) {
  const FIELDS = [
    { key: "what", label: "만드는 것" }, { key: "who", label: "쓰는 사람" }, { key: "size", label: "크기" }, { key: "fixed", label: "이미 정해진 것" },
    { key: "materials", label: "재료" }, { key: "data", label: "다룰 정보" }, { key: "out", label: "밖으로" }, { key: "success", label: "성공" },
  ];
  const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ"];
  const UNMEASURED = /아직\s*(못|안|모름)|못\s*(잼|쟀|재)|재지\s*못|모르겠/;
  const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
  // 1 · 2단계의 칸은 기준 글로 찾는다(등급마다 칸 수가 달라 번호로 찍지 않는다)
  const L0 = ["어떤 불편을 풀고 싶은지 한 문장으로 쓰기", "다 만들면 무엇이 달라지는지 쓰기", "누가 쓰는지 쓰기", "얼마나 크게 만들지 정하기"];
  const L1_SUCCESS = "왜 만드는지, 어디까지 만들지, 언제 성공인지 답하기", L1_DATA = "다룰 정보에 남의 정보가 섞이는지, 무엇이 밖으로 나가는지 적기";
  const FIXED_RE = /(으로|로)\s*(만들|짜|구현)|써야\s*해|쓰기로|정해져|기한|까지(\s*(제출|내|마감))|마감|제출/;
  const SET_RE = /(.+?)[:：]\s*(.+(?:·|,|、).+(?:·|,|、).+)/;
  const stageOf = (results, n) => (results && (results[n] || results[String(n)])) || null;
  const cell = (results, n, name) => { const r = stageOf(results, n); if (!r || !Array.isArray(r.items)) return null; const i = r.items.findIndex((x) => x && x.name === name); const it = i >= 0 ? r.items[i] : null; const t = it && Array.isArray(it.lines) ? norm(it.lines[0]) : ""; return t ? { text: t, from: { s: n, i } } : null; };
  const field = (text, from, extra) => ({ text: text || "", from: from || [], by: text ? "moved" : null, blank: !text, ...(extra || {}) });

  function build({ results = {}, source = "" } = {}) {
    const pain = cell(results, 0, L0[0]), change = cell(results, 0, L0[1]), who = cell(results, 0, L0[2]), size = cell(results, 0, L0[3]);
    const succ = cell(results, 1, L1_SUCCESS), data = cell(results, 1, L1_DATA);
    const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n").map((l, i) => ({ text: norm(l), line: i + 1 })).filter((x) => x.text);
    const fixed = lines.filter((x) => FIXED_RE.test(x.text) && !SET_RE.test(x.text)), mats = lines.filter((x) => SET_RE.test(x.text));
    const whatText = change && pain ? `${change.text} — ${pain.text}` : (change || pain || {}).text || "";
    const card = {
      what: field(whatText, [change && change.from, pain && pain.from].filter(Boolean)),
      who: field(who && who.text, who ? [who.from] : []),
      size: field(size && size.text, size ? [size.from] : []),
      fixed: { ...field(fixed.map((x) => x.text).join(" · "), []), lines: fixed, src: fixed.length > 0 },
      materials: { ...field(mats.map((x) => x.text).join(" · "), []), lines: mats, src: mats.length > 0 },
      data: field(data && data.text, data ? [data.from] : []),
      out: field(data && data.text, data ? [data.from] : []),
      success: succ && /\d/.test(succ.text) && !UNMEASURED.test(succ.text) ? field(succ.text, [succ.from]) : { ...field("", []), note: succ && UNMEASURED.test(succ.text) ? "아직 모름 — 무엇이 막히는지 한 줄 적어요" : "" },
    };
    return card;
  }
  // 사람이 채운 칸 — 옮긴 칸은 덮지 않는다(비어 있거나 직접 적은 칸만)
  function withEdits(card, edits = {}) {
    const out = { ...card };
    for (const [k, v] of Object.entries(edits || {})) { const f = out[k]; if (!f || !FIELDS.some((x) => x.key === k)) continue; if (f.by === "moved" && f.text) continue; const t = norm(v).slice(0, 200); out[k] = { ...f, text: t, by: t ? "me" : null, blank: !t, note: t ? "" : f.note || "" }; }
    return out;
  }
  const fromWord = (f) => (f.by === "me" ? "직접" : f.src ? "옮겨 옴 — 받은 글" : f.from && f.from.length ? `옮겨 옴 — ${f.from.map((x) => `${x.s + 1}단계 ${ROMAN[x.i] || x.i + 1}`).join(" · ")}` : "—");
  const cellText = (f) => (f.lines && f.lines.length ? f.lines.map((x) => `${x.text} (${x.line}줄)`).join(" · ") : f.text || "(비었어요)");
  function toMarkdown(card, name = "") {
    const c = card || build();
    return [`# 이 프로젝트의 기준${name ? ` — ${name}` : ""}`, "", "1단계 관문에서 Floe가 1단계 칸 · 받은 글로 만든 한 장이에요. 옮겨 온 칸은 출처가 있고, 사람만 아는 칸은 비워 두었어요 — 지어내지 않아요. 카드를 고치면 아직 안 한 단계의 퀘스트를 다시 지어요.", "",
      "| 칸 | 내용 | 어디서 |", "|---|---|---|", ...FIELDS.map((f) => `| ${f.label} | ${cellText(c[f.key] || {}).replace(/\|/g, "／")} | ${fromWord(c[f.key] || {})} |`),
      ...(c.success && c.success.note ? ["", `> 성공: ${c.success.note}`] : []), ""].join("\n");
  }
  const api = { FIELDS, build, withEdits, toMarkdown };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.NavBaseCard = api;
})(typeof window !== "undefined" ? window : globalThis);
