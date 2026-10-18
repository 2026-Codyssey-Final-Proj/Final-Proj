// claude-drafted: 2026-10-18 — F-05(PRD 2-7, 이재엽 결정 "내배움 지우기 … 내용들은 서재에서 확인이 가능하도록"): 오버레이의 '내 배움' 탭을 없애고,
// 지나온 단계 · 배운 말 · 확정한 설계도를 서재(library.js)에서 본다. 서재는 내비게이터가 이 브라우저에 남긴 기록(localStorage)을 learn.js로 읽는다.
// 기록이 없거나 고장 나도(사생활 보호 창, 손으로 고친 기록) 서재 화면이 멈추지 않아야 한다.
// 실행: node --test 04-tests/library/learn.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../../02-frontend/library/learn.js");
const FRONT = path.join(__dirname, "../../02-frontend");

test("내비게이터가 기록을 남기는 열쇠와 서재가 읽는 열쇠가 같다", () => {
  const app = fs.readFileSync(path.join(FRONT, "navigator/app.js"), "utf8");
  const key = /const KEY = "([^"]+)"/.exec(app);
  assert.ok(key, "app.js에 기록 열쇠가 있다");
  assert.equal(L.KEY, key[1]);
});

test("기록에서 지나온 단계 · 배운 말 · 확정한 설계도와 처음 만난 날 · 프로젝트를 꺼낸다", () => {
  const saved = {
    mode: "fixture", project: "동아리 행사 등록 앱", since: "2026-10-01", finished: false, pets: 3,
    history: [{ short: "0단계 마침", text: "0단계 \"문제 정하기\" → 1단계로 넘어갔어요 · 2026-10-02" }],
    learned: [{ term: "EARS", text: "기능을 문장으로 썼어요" }],
    docs: [{ stage: 1, name: "기능 목록", text: "1. 회원이 …", at: "2026-10-03" }],
  };
  const d = L.fromSaved(JSON.stringify(saved));
  assert.deepEqual(d.history, [{ text: saved.history[0].text }]);
  assert.deepEqual(d.learned, [{ term: "EARS", text: "기능을 문장으로 썼어요" }]);
  assert.deepEqual(d.docs, [{ stage: 1, name: "기능 목록", text: "1. 회원이 …", at: "2026-10-03" }]);
  assert.equal(d.since, "2026-10-01");
  assert.equal(d.project, "동아리 행사 등록 앱");
  assert.equal(d.practice, true, "연습용 예시로 쌓은 기록이면 화면이 그렇다고 말한다");
  assert.equal(d.finished, false);
  assert.equal(d.empty, false);
});

test("기록이 없거나 고장 나면 빈 배움을 돌려준다 — 던지지 않는다", () => {
  for (const raw of [null, undefined, "", "{", "[]", "3", "\"x\"", "null", JSON.stringify({ history: "x", learned: 5, docs: {} })]) {
    const d = L.fromSaved(raw);
    assert.deepEqual([d.history, d.learned, d.docs], [[], [], []], String(raw));
    assert.equal(d.empty, true, String(raw));
    assert.equal(d.practice, false, String(raw));
  }
});

test("모양이 틀린 줄은 버리고 맞는 줄만 남긴다", () => {
  const d = L.fromSaved(JSON.stringify({
    history: [null, { text: 3 }, { text: "  " }, { text: "1단계를 마쳤어요" }],
    learned: [{ term: "" }, { term: "MoSCoW·Kano" }, "EARS"],
    docs: [{ stage: "2", text: "글" }, { stage: 2, text: "" }, { stage: 3, name: 7, text: "설계" }],
  }));
  assert.deepEqual(d.history, [{ text: "1단계를 마쳤어요" }]);
  assert.deepEqual(d.learned, [{ term: "MoSCoW·Kano", text: "" }]);
  assert.deepEqual(d.docs, [{ stage: 3, name: "", text: "설계", at: "" }]);
});

test("read: 저장소를 못 쓰는 브라우저(사생활 보호 창 등)면 빈 배움", () => {
  const broken = { getItem() { throw new Error("막힘"); } };
  assert.equal(L.read(broken).empty, true);
  const ok = { getItem: (k) => (k === L.KEY ? JSON.stringify({ learned: [{ term: "TDD", text: "확인 먼저" }] }) : null) };
  assert.deepEqual(L.read(ok).learned, [{ term: "TDD", text: "확인 먼저" }]);
  assert.equal(L.read(undefined).empty, true, "저장소가 아예 없어도");
});

test("서재 화면이 learn.js를 부르고 '내 배움'을 #lib-learn으로 연다", () => {
  const html = fs.readFileSync(path.join(FRONT, "library/index.html"), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  assert.match(html, /<script src="learn\.js"><\/script>/);
  assert.match(html, /id="learn"/, "내 배움 창");
  const js = fs.readFileSync(path.join(FRONT, "library/library.js"), "utf8");
  assert.match(js, /"lib-learn"/, "주소 #lib-learn");
});
