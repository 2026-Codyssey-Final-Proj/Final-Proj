// claude-drafted: 2026-10-30 — C-52 '빼 둘 곳'(지식 퀘스트 PRD 6절 C-52 "사용자가 고른 폴더 · 파일은 Floe의 AI에 보내지 않는다 — 비밀값 파일 목록과 같은 목록에 사용자가 더한다",
//   9절 10번 "설정 창의 '빼 둘 곳'", 이재엽 버튼 2026-10-30 "10/31까지"). 사람이 적은 줄을 고르고(clean) 경로와 맞춰 본다(matcher). 순수 함수 — 서버(server.js)만 쓴다.
//   줄 모양(gitignore를 줄인 것 — **는 받지 않는다): 끝이 /면 폴더(그 안 전부), / 없는 이름은 어느 깊이에서든, / 있는 줄은 연결한 폴더의 맨 위부터, *는 한 칸(/ 사이) 안의 아무 글자. 대소문자는 보지 않는다(빼는 쪽으로).
//   자기 또는 위 폴더 하나라도 맞으면 뺀다. 받지 않는 것: 폴더 밖(..) · 절대 경로 · 드라이브 · *말고 다른 기호(? [ ] { } !) · 별 넷 이상 · 긴 줄 — 사람이 헷갈리거나 맞추기가 느려지지 않게.
//   *는 정규식으로 바꾸지 않고 직접 맞춘다(되돌아가기가 폭주하지 않게). 시험: 04-tests/navigator/exclude.test.js
"use strict";

const MAX_LINES = 30, LINE_MAX = 120, STARS_MAX = 3, MAX_KEYS = 200, RAW_MAX = 300;   // RAW_MAX — 서버가 받는 줄 수(빈 줄 · # 줄 포함). 세는 것은 다듬은 줄(MAX_LINES)
const KEY = /^[0-9a-f]{16}$/;   // 폴더 열쇠 — server.js folderKey(실제 경로의 지문 앞 16자). 경로 · 이름은 저장하지 않는다

// 사람이 적은 줄들(배열 또는 줄바꿈 글) → { list: 다듬은 줄, bad: [{ line, why }] }
function clean(lines) {
  const raw = typeof lines === "string" ? lines.split(/\r?\n/) : Array.isArray(lines) ? lines : [];
  const list = [], bad = [];
  for (const l of raw) {
    if (typeof l !== "string") { bad.push({ line: String(l), why: "글이 아니에요" }); continue; }
    let t = l.normalize("NFC").trim();   // macOS는 한글 이름을 NFD로 준다 — 적은 줄도 경로도 NFC로 맞춘다(새 맥락 리뷰)
    if (!t || t.startsWith("#")) continue;
    t = t.replace(/\\/g, "/");
    while (t.startsWith("./")) t = t.slice(2);
    const why = t.length > LINE_MAX ? `너무 길어요 — ${LINE_MAX}자까지`
      : /^\//.test(t) || /^[A-Za-z]:/.test(t) ? "연결한 폴더 안의 경로만 적어요(맨 앞의 / · C: 없이)"
      : /\*\*/.test(t) ? "**는 쓰지 않아요 — 폴더 전부는 끝에 /를 붙여요(예: secrets/)"
      : /[?[\]{}!\u0000-\u001f]/.test(t) ? "기호는 *만 써요"
      : t.replace(/\/$/, "").split("/").some((s) => !s || s === "." || s === "..") ? "폴더 밖(..)이나 빈 칸은 적을 수 없어요"
      : (t.match(/\*/g) || []).length > STARS_MAX ? `*는 ${STARS_MAX}개까지`
      : "";
    if (why) { bad.push({ line: l.slice(0, LINE_MAX + 10), why }); continue; }
    if (list.includes(t)) continue;
    if (list.length >= MAX_LINES) { bad.push({ line: t, why: `${MAX_LINES}줄까지` }); continue; }
    list.push(t);
  }
  return { list, bad };
}

// *만 있는 맞추기 — 한 칸(/ 없는 글) 안에서. 두 손가락으로 앞에서부터, 막히면 마지막 * 뒤로 되돌아간다(줄 길이 곱보다 느려지지 않는다)
function wild(p, s) {
  let i = 0, j = 0, star = -1, mark = 0;
  while (j < s.length) {
    if (i < p.length && p[i] === "*") { star = i++; mark = j; }
    else if (i < p.length && p[i] === s[j]) { i++; j++; }
    else if (star >= 0) { i = star + 1; j = ++mark; }
    else return false;
  }
  while (i < p.length && p[i] === "*") i++;
  return i === p.length;
}

// 다듬은 줄 → (rel, isDir) => 빼나. rel은 연결한 폴더 안의 상대 경로(/로 나눔)
function matcher(list) {
  const pats = (Array.isArray(list) ? list : []).map((x) => {
    const y = String(x).normalize("NFC"), dirOnly = y.endsWith("/"), body = (dirOnly ? y.slice(0, -1) : y).toLowerCase();
    return { dirOnly, parts: body.split("/"), anchored: body.includes("/") };
  });
  return (rel, isDir = false) => {
    if (!pats.length) return false;
    const segs = String(rel || "").normalize("NFC").toLowerCase().split("/").filter(Boolean);
    for (const p of pats) {
      if (!p.anchored) {
        for (let k = 0; k < segs.length; k++) {
          if (p.dirOnly && !(k < segs.length - 1 || isDir)) continue;
          if (wild(p.parts[0], segs[k])) return true;
        }
      } else {
        const L = p.parts.length;
        if (segs.length < L || (p.dirOnly && !(L < segs.length || isDir))) continue;
        if (p.parts.every((q, j) => wild(q, segs[j]))) return true;
      }
    }
    return false;
  };
}

// 저장 파일 { 폴더 열쇠: [줄] } → 모양이 맞는 것만(열쇠 모양 · 줄 다시 고르기 · 빈 목록은 버림 · 열쇠 200개까지)
function revive(book) {
  const out = {};
  if (!book || typeof book !== "object" || Array.isArray(book)) return out;
  for (const [k, v] of Object.entries(book)) {
    if (Object.keys(out).length >= MAX_KEYS) break;
    if (!KEY.test(k) || !Array.isArray(v)) continue;
    const { list } = clean(v.filter((x) => typeof x === "string"));
    if (list.length) out[k] = list;
  }
  return out;
}

module.exports = { MAX_LINES, LINE_MAX, STARS_MAX, MAX_KEYS, RAW_MAX, clean, matcher, revive };
