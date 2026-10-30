// claude-drafted: 2026-10-24 — 토큰 장부(이재엽 "내 테스트 레포는 … 테스트를 진행하면서 토큰값도 계산을 할거야" · 버튼 "이번 PR에 같이").
// 무엇을 세나: ① floe — Floe의 AI 호출(판정 · 퀘스트 · 정리 · 연결 확인, provider.js createCaller) ② task — Claude Code에 맡긴 일(일 넘기기 · 저장소 만들기, server.js startTask).
// 값은 Claude Code · API가 알려 준 usage(입력 · 출력 · 캐시 쓰기 · 캐시 읽기)와 Claude Code의 total_cost_usd뿐 — 비용을 모르면 null(지어내지 않는다).
// 한도(provider.js meter — 내 API 키의 예산)와 따로다: 구독(cli)으로 불러도 센다. 사용자가 터미널에서 직접 연 Claude Code는 Floe가 보지 못해 세지 않는다.
// 숫자와 이름(판정 · 맡긴 일 같은 정해진 말)만 남긴다 — 보낸 글 · 답 · 폴더 이름은 적지 않는다. 파일은 나만 읽기(600), '새로 재기'로 0부터.
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const KINDS = ["floe", "task"];
const RUNS_MAX = 30;
const LABEL = /^[가-힣0-9 ]{1,12}$/;   // 이름은 정해진 한국어 말(숫자까지 — "1단계 초안", F-107)만 — 그 밖은 "AI"
const n0 = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : 0);
const money = (v) => (Number.isFinite(Number(v)) && Number(v) >= 0 && v !== null && v !== "" ? Math.round(Number(v) * 1e6) / 1e6 : null);

function usageOf(u) {
  const x = u && typeof u === "object" ? u : {};
  const r = { input: n0(x.input_tokens), output: n0(x.output_tokens), cacheWrite: n0(x.cache_creation_input_tokens), cacheRead: n0(x.cache_read_input_tokens) };
  return { ...r, total: r.input + r.output + r.cacheWrite + r.cacheRead };
}

// claude -p --output-format json의 마지막 결과 한 덩이(날것) → 객체 | null. 앞에 다른 줄이 있어도 마지막 JSON
function resultOf(text) {
  const s = String(text || "").trim();
  if (!s) return null;
  for (const c of [s, s.slice(s.lastIndexOf("\n{") + 1)]) {
    let j; try { j = JSON.parse(c); } catch { continue; }
    return j && typeof j === "object" && !Array.isArray(j) && j.type === "result" ? j : null;
  }
  return null;
}
// 결과 한 덩이 → { usage, cost } — 장부에 쓰는 숫자만. 답 글(result)은 담지 않는다
const summarize = (j) => ({ usage: usageOf(j.usage), cost: money(j.total_cost_usd ?? j.cost_usd) });
const parseResult = (text) => { const j = resultOf(text); return j ? summarize(j) : null; };
// 허락을 못 받은 도구(F-69, 2026-10-28) — claude -p는 거절당해도 끝 코드 0 · subtype success라 이 목록만 남는다. 도구 이름 · 개수만 센다(도구 입력 — 명령 · 파일 글 — 은 읽지 않는다)
const TOOL_NAME = /^[A-Za-z0-9_.-]{1,60}$/;
function denialsOf(j) {
  const list = j && Array.isArray(j.permission_denials) ? j.permission_denials : [];
  const tools = {};
  for (const d of list) { const n = d && TOOL_NAME.test(String(d.tool_name || "")) ? String(d.tool_name) : "other"; tools[n] = (tools[n] || 0) + 1; }
  return { count: list.length, tools };
}

const blankKind = () => ({ count: 0, tokens: 0, cost: 0 });
const blank = (since) => ({ since, kinds: Object.fromEntries(KINDS.map((k) => [k, blankKind()])), runs: [] });
function normalize(x, now) {
  if (!x || typeof x !== "object") return blank(now);
  const s = blank(Number.isFinite(x.since) ? x.since : now);
  for (const k of KINDS) { const v = x.kinds && x.kinds[k]; if (v && typeof v === "object") s.kinds[k] = { count: n0(v.count), tokens: n0(v.tokens), cost: money(v.cost) || 0 }; }
  if (Array.isArray(x.runs)) s.runs = x.runs.filter((r) => r && KINDS.includes(r.kind)).slice(0, RUNS_MAX)
    .map((r) => ({ at: n0(r.at), kind: r.kind, label: LABEL.test(r.label || "") ? r.label : "AI", input: n0(r.input), output: n0(r.output), cacheWrite: n0(r.cacheWrite), cacheRead: n0(r.cacheRead), total: n0(r.total), cost: money(r.cost) }));
  return s;
}

function createLedger(store, now = Date.now) {
  let s = normalize(store.load(), now());
  const ledger = {
    add(kind, label, usage, cost) {
      if (!KINDS.includes(kind) || !usage || !(usage.total > 0)) return;
      const c = money(cost), k = s.kinds[kind];
      k.count += 1; k.tokens += usage.total; if (c !== null) k.cost = Math.round((k.cost + c) * 1e6) / 1e6;
      s.runs.unshift({ at: now(), kind, label: LABEL.test(label || "") ? label : "AI", input: usage.input, output: usage.output, cacheWrite: usage.cacheWrite, cacheRead: usage.cacheRead, total: usage.total, cost: c });
      s.runs = s.runs.slice(0, RUNS_MAX);
      store.save(s);
    },
    snapshot() {
      const kinds = Object.fromEntries(KINDS.map((k) => [k, { ...s.kinds[k] }]));
      const total = KINDS.reduce((t, k) => ({ count: t.count + kinds[k].count, tokens: t.tokens + kinds[k].tokens, cost: Math.round((t.cost + kinds[k].cost) * 1e6) / 1e6 }), blankKind());
      return { since: s.since, total, kinds, runs: s.runs.map((r) => ({ ...r })) };
    },
    reset() { s = blank(now()); store.save(s); },
  };
  return ledger;
}

const fileStore = (file) => ({
  load() { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } },
  save(state) { try { fs.writeFileSync(file, JSON.stringify(state), { mode: 0o600 }); fs.chmodSync(file, 0o600); } catch { /* 못 써도 호출은 계속 */ } },
});
// 자리 — NAV_TOKENS_FILE, 없으면 NAV_USAGE_FILE 옆(시험이 홈 폴더에 쓰지 않게), 없으면 홈의 .navigator-tokens.json
const fileOf = (env, home = os.homedir()) => env.NAV_TOKENS_FILE || (env.NAV_USAGE_FILE ? env.NAV_USAGE_FILE.replace(/(\.json)?$/, "-tokens.json") : path.join(home, ".navigator-tokens.json"));

module.exports = { KINDS, RUNS_MAX, usageOf, resultOf, summarize, parseResult, denialsOf, createLedger, fileStore, fileOf };
