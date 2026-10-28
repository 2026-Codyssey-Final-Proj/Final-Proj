// claude-drafted: 2026-10-28 — C-56 R-4 이미 있는 내용 옮겨 적기(questfit 넘김 ⓔ, 이재엽 버튼 "'옮김' 새 값"): 연결한 폴더의 글 파일(md · txt)에서 그 칸의 답이 될 만한 줄을 찾아
//   원문 그대로 · 파일 · 줄 번호로 돌려준다. 사람이 고르면 그 줄이 '옮김'으로 들어간다 — 지어내지 않고(숫자 · 사람 · 날짜는 원문 그대로), 원문끼리 다르면 여럿을 보여 고르게.
//   서버(server.js GET /api/find)만 쓴다. 순수 함수 — 시험은 04-tests/navigator/findlines.test.js
"use strict";
const { kindOf } = require("./files.js");

// 틀 말 — 할 일 이름 · 묻는 말에 늘 나오는 말은 낱말로 치지 않는다(어떤 칸이든 다 맞아 버린다)
const STOP = new Set(["쓰기", "적기", "정하기", "하기", "만들기", "고르기", "찾기", "보기", "하면", "한다", "해요", "어떤", "무엇", "무슨", "어디", "언제", "누가", "있나요", "없나요", "하나요", "되나요", "인가요", "그리고", "또는", "대해", "위해", "그것", "이것", "지금", "먼저", "다음", "한줄", "한 줄"]);
const PARTICLE = /(으로|에서|에게|까지|부터|이나|이든|인지|처럼|보다|은|는|이|가|을|를|의|에|와|과|도|만|로)$/;
const stem = (w) => w.replace(PARTICLE, "");   // 조사를 뗀 뒤 한 글자면 낱말로 치지 않는다(앱은 → 앱)

// 할 일 이름 · 묻는 말 → 뜻 있는 낱말(두 글자 이상, 조사를 떼고, 틀 말을 빼고, 겹치지 않게 — 나온 순서대로)
function keywordsOf(name, ask) {
  const out = [];
  for (const raw of `${name || ""} ${ask || ""}`.split(/[^0-9A-Za-z가-힣]+/)) {
    if (!raw || STOP.has(raw)) continue;
    const w = stem(raw);
    if (w.length < 2 || STOP.has(w) || out.includes(w)) continue;
    out.push(w);
  }
  return out;
}

const LINE_MAX = 200;   // 이보다 긴 줄은 한 칸의 답이 아니다(붙여 넣은 덩어리 · 표)
const HEAD = /^\s{0,3}#{1,6}\s+(.*)$/;
const skipLine = (t) => !t.trim() || t.length > LINE_MAX || /^\s*(```|\||<!--|---)/.test(t);
const hitsOf = (text, kws) => { const t = text.toLowerCase(); return kws.filter((k) => t.includes(k.toLowerCase())); };
const tidy = (t) => t.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").replace(/\*\*|__/g, "").trim();   // 목록 표시 · 굵게는 떼고 원문 그대로

// files: [{ path, text, i? }] → [{ path, line, text, hits, i? }] 점수 높은 순(같으면 파일 · 줄 순서), max개. 글 파일(md · text)만 — 코드 · 표 · 제목 줄은 뺀다.
//   제목 줄이 맞으면 그 제목 아래 첫 글 줄이 후보(제목은 답이 아니라 자리이니까)
function find(files, { name = "", ask = "", max = 3 } = {}) {
  const kws = keywordsOf(name, ask);
  if (!kws.length) return [];
  const out = [];
  (files || []).forEach((f, fi) => {
    if (!f || typeof f.text !== "string" || !["md", "text"].includes(kindOf(f.path))) return;
    const lines = f.text.split(/\r?\n/);
    const push = (n, hits, text) => { const had = out.find((x) => x.path === f.path && x.line === n); if (had) { had.hits = [...new Set([...had.hits, ...hits])]; return; } out.push({ path: f.path, line: n, text, hits, ...(f.i !== undefined ? { i: f.i } : {}), _o: [fi, n] }); };
    lines.forEach((raw, k) => {
      const h = HEAD.exec(raw);
      if (h) { const hits = hitsOf(h[1], kws); if (!hits.length) return;
        for (let j = k + 1; j < lines.length; j++) { if (HEAD.test(lines[j])) break; if (skipLine(lines[j])) continue; push(j + 1, [...new Set([...hits, ...hitsOf(lines[j], kws)])], tidy(lines[j])); break; }   // 제목의 낱말 + 그 줄의 낱말
        return; }
      if (skipLine(raw)) return;
      const hits = hitsOf(raw, kws); if (hits.length) push(k + 1, hits, tidy(raw));
    });
  });
  return out.sort((a, b) => b.hits.length - a.hits.length || a._o[0] - b._o[0] || a._o[1] - b._o[1]).slice(0, max).map(({ _o, ...x }) => x);
}

module.exports = { keywordsOf, find, STOP, LINE_MAX };
