// claude-drafted: 2026-10-30 — F-106(FR-14): API 키가 거절되면 쉬운 말로 알리고 '연습용 예시로 둘러보기' 단추를 같이 보인다
// (이재엽 버튼 2026-10-30 "오류에 연습 단추" — 저절로 바꾸지 않고 사람이 고른다). 실행: node --test 04-tests/navigator/key-reject.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const P = require("../../03-backend/navigator/provider.js");
const N = require("../../03-backend/navigator/navigator.js");

const ROOT = path.join(__dirname, "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("키 거절(401 · 403)은 정해진 앞말로 시작하고, keyKind가 그 말만 알아본다", () => {
  for (const status of [401, 403]) assert.deepEqual(P.keyKind(P.apiError({ status })), { kind: "key" });
  for (const other of [P.apiError({ status: 429 }), P.apiError({ status: 500 }), P.apiError({}), "", null, undefined, "답의 모양이 맞지 않음"]) assert.deepEqual(P.keyKind(other), {});
});

test("API로 부르다 401을 받으면 callClaude의 오류가 키 거절 말로 시작한다(서버가 kind: key를 싣는 근거)", async () => {
  const meter = P.createMeter(null, { load: () => 0, save: () => {} });
  const callClaude = P.createCaller({ env: { ANTHROPIC_API_KEY: "test-key-not-real" }, callCli: async () => ({}), meter,   // secret-check: allow — 가짜 키(시험)
    makeClient: () => ({ messages: { create: async () => { throw { status: 401 }; } }, beta: { messages: { create: async () => { throw { status: 401 }; } } } }) });
  const r = await callClaude("글", { type: "object" }, { label: "시험" });
  assert.ok(r.error && r.error.startsWith(P.KEY_REJECT), JSON.stringify(r));
});

test("서버 — AI 오류(r.error)는 모두 refuse로 나가고, refuse가 keyKind를 싣는다(다른 send로 새면 kind가 빠진다)", () => {
  const s = read("03-backend/navigator/server.js");
  assert.match(s, /const refuse = \(res, reason, code = 400\) => send\(res, code, \{ ok: false, reason, \.\.\.keyKind\(reason\) \}\)/);
  const leaks = s.split("\n").map((l) => l.replace(/refuse\([^;]*/g, "")).filter((l) => /\br\d?\.error\b/.test(l) && /send\(res/.test(l));   // refuse(…) 안은 빼고 본다
  assert.deepEqual(leaks, [], "r.error를 send로 바로 내보내는 줄");
});

test("화면 — 답마다 표시를 다시 정하고, 진짜 AI 모드에서만 키 카드, 연습으로 가는 길은 설정과 하나", () => {
  const ai = read("02-frontend/navigator/app/85-ai.js");
  assert.match(ai, /st\.keyBad = !!j && j\.kind === "key";/, "성공하면 꺼진다");
  assert.match(ai, /function toMode\(m\) \{ if \(m === "live"\) liveApprovals\(\); set\(\{ mode: m, keyBad: false, error: "", warn: null \}\); readmeAgain\(\); chatRecheck\(\); \}/);   // liveApprovals — 연습의 예시 허락 카드를 내린다(F-137) · readmeAgain — 옛 README를 잊는다(F-144-17)
  assert.match(ai, /"practice-now": \(\) => toMode\("fixture"\)/);
  assert.match(read("02-frontend/navigator/app/92-basecard.js"), /if \(a === "mode"\) toMode\(t\.value\);/, "설정의 보기 방식도 같은 길");
  assert.match(read("02-frontend/navigator/app/90-acts.js"), /dismiss: \(\) => set\(\{ error: "", keyBad: false \}\)/, "닫기 한 번에");
  const views = read("02-frontend/navigator/app/10-views.js");
  const at = views.indexOf('if (st.keyBad && st.mode === "live")');
  assert.ok(at > views.indexOf("if (st.warn)") && at < views.indexOf("if (st.error) return"), "비밀값 경고 다음, 오류 카드 앞");
  const card = views.slice(at, views.indexOf("\n", at));
  assert.match(card, /act: "practice-now"/);
  assert.match(card, /act: "dismiss"/);
  assert.deepEqual(N.JARGON.filter((w) => card.includes(w)), [], "쉬운 말");
});
