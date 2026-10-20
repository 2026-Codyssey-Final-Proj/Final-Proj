// claude-drafted: 2026-10-20 — C-15 플로로에게 먹이 주기(넘김 문서 fable-handoff-2026-10-20-feed.md 4절 1번). 순수 모듈 feed.js —
// 구간 나누기(제목 줄 · 빈 줄 · 제목 없음), 표시(비밀값 → secret, 전화번호 · 흔한 말 → personal, 주제), 보낼 글 만들기(빠진 구간의 글이 결과에 없다, 사람의 표시가 규칙보다 우선),
// 파일 받기 규칙(.md · .txt, 1MB), 예시 먹이. 그리고 C-16 셋째 문장 — 화면 글에 '설계도'가 없다.
// 실행: node --test 04-tests/navigator/feed.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const F = require("../../03-backend/navigator/feed.js");
const Nav = require("../../03-backend/navigator/navigator.js");
const S = require("../../03-backend/navigator/scenario.js");
const FRONT = path.join(__dirname, "../../02-frontend");
const read = (f) => fs.readFileSync(path.join(FRONT, f), "utf8");
const noComment = (code) => code.replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

test("split — 제목 줄(# · 1.)마다 구간, 제목 앞의 글은 제목 없는 구간, 제목이 없으면 빈 줄 문단마다. 빈 글은 []", () => {
  const s = F.split("# 앱\n회원이 신청해요.\n\n## 화면\n목록 · 신청서\n1. 메모\n줄");
  assert.deepEqual(s.map((x) => x.title), ["앱", "화면", "메모"]);
  assert.equal(s[0].text, "회원이 신청해요.");
  assert.equal(s[2].text, "줄");
  assert.deepEqual(F.split("앞글\n# 제목\n본문").map((x) => [x.title, x.text]), [["", "앞글"], ["제목", "본문"]]);
  assert.deepEqual(F.split("문단 하나\n둘째 줄\n\n\n문단 둘").map((x) => x.text), ["문단 하나\n둘째 줄", "문단 둘"]);
  assert.deepEqual(F.split(""), []); assert.deepEqual(F.split("   \n\n"), []); assert.deepEqual(F.split(null), []);
  assert.equal(F.split("a\r\nb\r\n\r\nc").length, 2, "CRLF도");
});

test("check — 비밀값 모양이면 secret(보내면 안 됨), 전화번호 · 이메일 · 흔한 말이면 personal, 주제는 제목 또는 첫 줄 40자", () => {
  const sec = F.check({ title: "서버", text: "비밀번호: 예시용-자리표시" });   // secret-check: allow
  assert.equal(sec.secret, true); assert.equal(sec.personal, false); assert.equal(sec.why, F.WHY.secret);
  const key = F.check({ title: "", text: "token = abcdefghijklmnop1234" });   // secret-check: allow
  assert.equal(key.secret, true);
  const ph = F.check({ title: "", text: "연락은 010-1234-5678로 주세요" });
  assert.equal(ph.secret, false); assert.equal(ph.personal, true); assert.equal(ph.why, F.WHY.personal);
  assert.equal(F.check({ title: "오늘 일기", text: "가족이랑 저녁" }).personal, true);
  const ok = F.check({ title: "행사 목록", text: "회원이 행사를 보고 신청해요" });
  assert.deepEqual([ok.secret, ok.personal, ok.topic, ok.why], [false, false, "행사 목록", ""]);
  assert.equal(F.check({ title: "", text: "가".repeat(60) }).topic.length, F.TOPIC_MAX);
  assert.equal(F.check({ title: "", text: "" }).topic, "(빈 구간)");
  assert.equal(F.check(null).secret, false, "이상한 값도 던지지 않는다");
});

test("pack — 비밀값 · 개인적인 일 구간은 보낼 글에 없고 left에 수 · 주제 · 까닭만, 사람의 표시(keep · skip)가 규칙보다 우선", () => {
  const sections = F.split(F.EXAMPLE);
  assert.equal(sections.length, 3, "예시 먹이는 구간 셋");
  const p = F.pack(sections);
  assert.equal(p.kept, 1);
  assert.deepEqual(p.left.map((l) => [l.i, l.topic, l.why]), [[1, "오늘 일기", F.WHY.personal], [2, "서버 메모", F.WHY.secret]]);
  assert.ok(p.text.includes("행사 목록") && p.text.startsWith("# 동아리 행사 등록 앱"));
  assert.ok(!p.text.includes("자리표시") && !p.text.includes("가족"), "빠진 구간의 글이 보낼 글에 없다");
  assert.ok(!JSON.stringify(p.left).includes("자리표시"), "left에도 글이 없다");
  const keep = F.pack(sections, ["keep", "keep", "skip"]);
  assert.equal(keep.kept, 2); assert.ok(keep.text.includes("가족")); assert.deepEqual(keep.left.map((l) => l.i), [2]);
  const skipAll = F.pack(sections, ["skip"]);
  assert.equal(skipAll.kept, 0); assert.equal(skipAll.text, ""); assert.equal(skipAll.left[0].why, "빼 달라고 하셨어요");
  assert.deepEqual(F.pack(null), { text: "", kept: 0, left: [] });
});

test("accept — 글 파일(.md · .txt)만, 1MB 아래. 아니면 쉬운 말 이유", () => {
  assert.equal(F.accept("notes.md", 100), "");
  assert.equal(F.accept("MEMO.TXT", 100), "");
  assert.ok(F.accept("photo.png", 100).includes("글 파일"));
  assert.ok(F.accept("big.md", F.MAX_FILE + 1).includes("1MB"));
  assert.equal(F.MAX_FILE, 1_000_000);
});

test("예시 먹이 — 비밀번호 모양은 진짜 값이 아닌 자리표시이고, 화면 · 서버 목록 · 시험 입력이 같은 모듈을 쓴다", () => {
  assert.ok(F.EXAMPLE.includes("자리표시"));
  assert.doesNotMatch(F.EXAMPLE, /sk-|ghp_|AKIA|BEGIN/, "진짜 키 모양은 없다");
  const html = read("navigator/index.html");
  assert.ok(html.indexOf("sensitive.js") < html.indexOf("feed.js"), "feed.js는 sensitive.js 뒤에");
  const { FILES } = require("../../03-backend/navigator/server.js");
  assert.ok(Object.keys(FILES).some((u) => u.endsWith("/feed.js")), "서버가 feed.js를 내준다");
});

// C-16 셋째 문장(이재엽 "설계도는 너무 어려운 말 같아") — 화면에 보이는 글에 '설계도'가 없다. AI에게 보내는 지시문(navigator.js의 프롬프트)은 화면 글이 아니라 본다
test("쉬운 말 — 화면 글(app.js · index.html · notes.js · 연습용 예시 · 플로로의 말)에 '설계도'가 없다(주석 빼고)", () => {
  for (const f of ["navigator/app.js", "navigator/index.html", "navigator/notes.js", "index.html", "library/my-books.js", "library/index.html", "library/library.js"]) {
    assert.ok(!noComment(read(f)).includes("설계도"), `${f}에 '설계도'`);
  }
  const scenario = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/scenario.js"), "utf8");
  assert.ok(!noComment(scenario).includes("설계도"), "연습용 예시(scenario.js)");
  for (const v of [{}, { done: true }, { busy: true }, { review: { ready: true, say: "좋아요" } }]) assert.ok(!Nav.docFace(v)[1].includes("설계도"), `docFace ${JSON.stringify(v)}`);
  for (const s of Nav.STAGES) if (s.doc) assert.ok(!s.doc.includes("설계도"), s.doc);
  const rec = fs.readFileSync(path.join(__dirname, "../../03-backend/navigator/recordings/demo.json"), "utf8");
  assert.ok(!rec.includes("설계도"), "녹화된 연습 응답(화면에 보인다)");
});
