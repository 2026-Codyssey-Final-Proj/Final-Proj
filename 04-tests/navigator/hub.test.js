// claude-drafted: 2026-10-20 — 이재엽 요청(C-11 모아 보기 창 — 바이브 코딩 고르기 · 알림, C-12 AI 진행의 화면 쪽). 페이블 넘김 문서 6절의 "모아 보기 창" 줄.
// 2026-10-23 모아 보기 창(화면)을 뺐다 — 남은 hub.js는 섬의 알림 · AI 진행 판이 쓰는 순수 함수다. 여기서는 ① 알림 한 줄을 alerts.js가 만드는 모양
// {at, kind, tool, line, hidden, done} 그대로 글로 만들고 ② 판정 주소를 부르지 않고 ③ AI 진행 모듈(NavSteps)이 없어도 멈추지 않는지 본다.
// 브라우저 없이 — hub.js는 window.FloeHub로도, Node에서는 require로도 열린다(alerts.js와 같은 방식).
// 실행: node --test 04-tests/navigator/hub.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const H = require("../../02-frontend/hub/hub.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const js = read("hub/hub.js");

test("판정 · 단계 넘어가기 · 토큰을 부르지 않는다 — 지켜보기만(C-12 '바이브 코딩이 아니야')", () => {
  for (const bad of ["api/judge", "api/answer", "api/usage", "api/doc"]) assert.ok(!js.includes(bad), `hub.js에 ${bad}가 없어야`);
});

const NOW = Date.UTC(2026, 9, 20, 3, 0, 0);
const base = { at: NOW - 3 * 60 * 1000, kind: "stop", tool: "claude", project: "demo", line: "src/app.js를 고쳤어요", hidden: false, sim: false, done: [] };

test("알림 한 줄 — alerts.js가 만드는 모양 그대로: 때(상대 시간) · 도구 이름 · 무엇 · 한 줄", () => {
  const l = H.alertLine(base, NOW);
  assert.equal(l.when, "3분 전");
  assert.equal(l.tool, "Claude Code");
  assert.equal(l.what, "작업을 마쳤어요");
  assert.equal(l.line, "src/app.js를 고쳤어요");
  assert.equal(l.done, "");
  assert.equal(H.alertLine({ ...base, tool: "codex", kind: "prompt" }, NOW).tool, "Codex");
  assert.equal(H.alertLine({ ...base, tool: "codex", kind: "prompt" }, NOW).what, "새 작업을 시작했어요");
  assert.equal(H.alertLine({ ...base, tool: "other", kind: "zzz" }, NOW).tool, "AI 코딩 도구");
  assert.equal(H.alertLine({ ...base, at: NOW - 20 * 1000 }, NOW).when, "20초 전");
  assert.equal(H.alertLine({ ...base, at: NOW - 3 * 3600 * 1000 }, NOW).when, "3시간 전");
});

test("알림 한 줄 — 비밀값 모양이면 내용 대신 숨겼다는 말, 끝낸 할 일이 있으면 '끝냈다고 표시: …'", () => {
  const hid = H.alertLine({ ...base, hidden: true, line: "" }, NOW);
  assert.equal(hid.line, "비밀값 모양이라 숨겼어요");
  const done = H.alertLine({ ...base, done: ["문제 한 줄 쓰기", "할 일 고르기"] }, NOW);
  assert.equal(done.done, "끝냈다고 표시: 문제 한 줄 쓰기, 할 일 고르기");
  const sim = H.alertLine({ ...base, sim: true }, NOW);
  assert.equal(sim.tool, "Claude Code · 연습 알림");
  // 그리는 HTML에 그 글이 들어가고, 원본 글은 escape된다
  const h = H.alertHTML({ ...base, line: "<b>x</b>" }, NOW);
  assert.ok(h.includes("&lt;b&gt;x&lt;/b&gt;") && !h.includes("<b>x</b>"));
});

test("빈 상태 글 — 아직 알림이 없을 때 무엇을 하면 쌓이는지 말한다", () => {
  assert.ok(H.EMPTY_ALERTS.includes("아직 알림이 없어요"));
  assert.ok(H.EMPTY_ALERTS.includes("프로젝트 폴더를 연결하면"));
  assert.ok(H.alertsHTML([], NOW).includes("아직 알림이 없어요"));
  assert.ok(H.alertsHTML([base], NOW).includes("Claude Code"));
});

test("읽지 않은 수 — 마지막으로 본 때보다 새로 온 알림만 센다. 기록이 깨져 있어도 0", () => {
  const list = [{ ...base, at: NOW - 1000 }, { ...base, at: NOW - 5000 }, { ...base, at: NOW - 9000 }];
  assert.equal(H.unread(list, NOW - 6000), 2);
  assert.equal(H.unread(list, NOW), 0);
  assert.equal(H.unread(list, 0), 3);
  assert.equal(H.unread(null, 0), 0);
  assert.equal(H.unread([{ at: "x" }], 0), 0);
  assert.equal(H.latestAt(list), NOW - 1000);
  assert.equal(H.latestAt([]), 0);
});

test("AI 진행 — NavSteps가 없으면 '아직 준비 중이에요', 예시면 '예시 데이터예요 · 시연용', 서버면 머리말 없음. 상태 말은 쉬운 말", () => {
  assert.equal(H.aiNote("none"), "아직 준비 중이에요");
  assert.ok(H.aiNote("example").includes("예시 데이터예요 · 시연용"));
  assert.equal(H.aiNote("live"), "");
  assert.equal(H.STATE_WORD.working, "일하는 중");
  assert.equal(H.STATE_WORD.done, "마쳤어요");
  assert.ok(H.aiHTML([], "none", null, NOW).includes("아직 준비 중이에요"));
});

test("AI 진행 — 세션의 줄을 seq로 합치고(같은 seq는 한 번) 최근 50줄만, 새것이 아래", () => {
  const old = [{ seq: 1, at: 1, verb: "read", what: "a" }, { seq: 2, at: 2, verb: "edit", what: "b" }];
  const merged = H.mergeSteps(old, [{ seq: 2, at: 2, verb: "edit", what: "b" }, { seq: 3, at: 3, verb: "bash", what: "c" }]);
  assert.deepEqual(merged.map((s) => s.seq), [1, 2, 3]);
  const many = H.mergeSteps([], Array.from({ length: 60 }, (_, i) => ({ seq: i + 1, at: i, verb: "read", what: `f${i}` })));
  assert.equal(many.length, 50);
  assert.equal(many[0].seq, 11);
  assert.equal(many[49].seq, 60);
  // 서버 답을 세션 목록에 합친다 — id로 찾고, 없으면 새로
  const s1 = H.mergeSessions([], [{ id: "a", project: "demo", tool: "claude", state: "working", at: 5, steps: old }]);
  assert.equal(s1.length, 1);
  const s2 = H.mergeSessions(s1, [{ id: "a", project: "demo", tool: "claude", state: "done", at: 9, steps: [{ seq: 3, at: 3, verb: "bash", what: "c" }] }]);
  assert.equal(s2[0].state, "done");
  assert.deepEqual(s2[0].steps.map((s) => s.seq), [1, 2, 3]);
  assert.equal(H.anyWorking(s2), false);
  assert.equal(H.anyWorking(s1), true);
});

test("AI 진행 — 줄 글은 NavSteps.line이 만들고(없으면 verb · what으로), HTML에는 프로젝트 · 상태 · 줄이 들어간다", () => {
  const fakeSteps = { line: (s) => `${s.verb}:${s.what}` };
  const sessions = [{ id: "a", project: "demo", tool: "claude", state: "working", at: NOW - 60000, steps: [{ seq: 1, at: NOW - 60000, verb: "edit", what: "src/app.js", add: 3, del: 1 }] }];
  const h = H.aiHTML(sessions, "live", fakeSteps, NOW);
  assert.ok(h.includes("demo") && h.includes("일하는 중") && h.includes("edit:src/app.js") && h.includes("1분 전"));
  assert.ok(!h.includes("예시 데이터예요"));
  const ex = H.aiHTML(sessions, "example", fakeSteps, NOW);
  assert.ok(ex.includes("예시 데이터예요 · 시연용"));
  const noLine = H.aiHTML(sessions, "live", {}, NOW);
  assert.ok(noLine.includes("src/app.js"), "line이 없어도 무엇을 했는지는 보인다");
  assert.equal(H.exampleSessions({ example: (now) => ({ project: "p", tool: "claude", state: "done", steps: [{ seq: 1, at: now, verb: "read", what: "x" }] }) }, NOW)[0].project, "p");
  assert.deepEqual(H.exampleSessions({}, NOW), []);
});
