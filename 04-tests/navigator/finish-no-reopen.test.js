// claude-drafted: 2026-11-04 — F-153(임유정 "8단계에서 끝까지 관문을 통과했는데도 플로로가 종료 같이 되지 않고 계속 루프가 돈다").
//   다 마친 뒤 Claude Code 알림(문서 올리기의 커밋 · 푸시도) → '어디쯤인지 볼까요?' → 살펴보기(landed)가 finished를 풀어 8단계 관문이 다시 열렸다
//   → 관문을 또 지나면 조개 +1 · '문서로 묶어 GitHub에' 다시 → 올리면 또 알림 … 의 고리.
// 함수를 app.js 글자에서 떼어 가짜 상태로 돌린다(code-sweep-1103b.test.js와 같은 방식). 실행: node --test 04-tests/navigator/finish-no-reopen.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const APP = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
function fnSrc(name) {
  const at = APP.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(at >= 0, `${name}를 찾지 못했어요`);
  let i = APP.indexOf(") {", at) + 2, d = 0;
  for (; i < APP.length; i++) { if (APP[i] === "{") d++; else if (APP[i] === "}" && --d === 0) break; }
  return APP.slice(at, i + 1);
}
const LAST = 7;   // 8단계(0부터)
const met = (stage) => ({ stage, reason: "돌아보기를 다 했어요.", criteria: [{ text: "회고", met: true }, { text: "git 커밋", met: true }], next: null });

// onEvent를 가짜 이웃과 함께 만든다 — 무엇이 불렸는지 calls에 남긴다
function makeOnEvent(st) {
  const calls = { look: 0, peek: 0, logs: [] };
  const make = new Function("st", "A", "logMsg", "esc", "toolName", "fetchUsage", "twTick", "sensitive", "scheduleRefit", "render", "activity", "lookAfterWork", "view", "peek",
    `let appName = "", tw = null, lastPing = null; const changesRefresh = () => {}, loadFiles = () => {}; ${fnSrc("onEvent")} return onEvent;`);   // changesRefresh — F-157-6
  const onEvent = make(st, { accept: () => true, notifies: () => true, add: (a) => a || [] }, (who, t) => calls.logs.push(t), (s) => s, () => "Claude Code",
    () => {}, () => {}, () => [], () => {}, () => {}, () => {}, async () => { calls.look++; }, () => {}, () => { calls.peek++; });
  return { onEvent, calls };
}

test("F-153 다 마친 뒤 Claude Code 알림 — 채팅에 한 줄만, '어디쯤인지 볼까요?' 카드 · 살펴보기는 없다", async () => {
  const st = { finished: true, mode: "live", auto: true, screen: "main", busy: false, alerts: [], j: met(LAST), text: "" };
  const { onEvent, calls } = makeOnEvent(st);
  await onEvent({ kind: "stop", tool: "claude", at: 1, project: "p", here: true, work: "커밋하고 푸시했어요" });
  assert.ok(!st.ping, `다 마친 뒤에는 살펴볼까요 카드를 띄우지 않는다: ${st.ping}`);
  assert.equal(calls.look, 0, "자동 살펴보기도 하지 않는다(AI를 부르지 않는다)");
  assert.ok(calls.logs.some((t) => /일을 마쳤어요/.test(t)), "무슨 일이 있었는지는 채팅에 남긴다");
});

test("F-153 아직 하는 중이면 전과 같다 — 자동이 꺼져 있으면 카드, 켜져 있으면 바로 살펴본다", async () => {
  const off = { finished: false, mode: "live", auto: false, screen: "main", busy: false, alerts: [], j: met(3), text: "" };
  const a = makeOnEvent(off); await a.onEvent({ kind: "stop", tool: "claude", at: 1, project: "p", here: true });
  assert.match(String(off.ping), /어디쯤인지/);
  const on = { ...off, auto: true, ping: "" };
  const b = makeOnEvent(on); await b.onEvent({ kind: "stop", tool: "claude", at: 1, project: "p", here: true });
  assert.equal(b.calls.look, 1);
});

// landed를 가짜 이웃과 함께 만든다
function makeLanded(st) {
  const make = new Function("st", "N", "gateApply", "allDone", "QU", "logMsg", "esc", "learn", "view", "peek", "celebrate", "say", "requestAnimationFrame", "checkOf", "ymd", "skipOf",
    `let pendingNotice = ""; ${fnSrc("landed")} return landed;`);
  const allDone = () => !!(st.j && st.j.criteria.every((c) => c.met));
  return make(st, { STAGES: new Array(8).fill({}) }, (j) => j, allDone, null, () => {}, (s) => s, () => [], () => {}, () => {}, () => {}, () => {}, (cb) => cb(), () => [], () => "2026-11-04", () => null);
}

test("F-153 다 마친 뒤 8단계 살펴보기 결과가 와도 끝난 상태를 풀지 않는다(관문이 다시 열리지 않는다)", () => {
  const st = { finished: true, j: met(LAST), results: { [LAST]: { passed: "2026-11-04" } }, text: "", quest: null };
  makeLanded(st)(met(LAST), 100, "글");
  assert.equal(st.finished, true);
});

test("F-153 아직 하는 중이면 전과 같다 — 살펴보기 결과가 오면 finished는 false", () => {
  const st = { finished: false, j: met(3), results: {}, text: "", quest: null };
  makeLanded(st)(met(3), 100, "글");
  assert.equal(st.finished, false);
});

test("F-153 새 맥락 리뷰 — 웹 AI 제안도 다 마친 뒤에는 '눌러서 볼까요?' 카드를 띄우지 않는다", () => {
  assert.match(fnSrc("pollProposals"), /proposals\.length && st\.ui !== "home" && !st\.finished\) \{ st\.ping = /);
});
