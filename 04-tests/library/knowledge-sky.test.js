// claude-drafted: 2026-10-17 — GitHub 저장소의 지식 파일(마크다운 + 머리말) → 별자리 하늘. 실제 GitHub은 부르지 않는다.
const test = require("node:test");
const assert = require("node:assert/strict");
const K = require("../../02-frontend/library/knowledge-sky.js");

const md = (head, body = "본문은 하늘로 가져오지 않는다") => `---\n${head}\n---\n\n${body}\n`;
const FILES = [
  { path: "knowledge/2026-10/session-vs-token.md", commit: "a1b2c3d", text: md("title: 세션과 토큰의 차이\ndate: 2026-10-03\nline: 서버가 기억하느냐, 들고 다니느냐\ntags: [로그인, 보안]\nlevel: 3") },
  { path: "knowledge/2026-10/moscow.md", commit: "b2c3d4e", text: md("title: MoSCoW로 줄이기\ndate: 2026-10-01\ntags: [MoSCoW]") },
  { path: "knowledge/2026-02/ears.md", commit: "c3d4e5f", text: md("title: EARS로 한 줄씩\ndate: 2026-02-11\ntags: [EARS]\nlevel: 2") },
  { path: "knowledge/drafts/no-title.md", commit: "d4e5f60", text: md("date: 2026-10-05") },
  { path: "README.md", commit: "e5f6071", text: "# 내 지식 창고" },
];

test("머리말을 읽는다 — 글자, 숫자, [목록]", () => {
  const h = K.parseFrontMatter(FILES[0].text);
  assert.equal(h.title, "세션과 토큰의 차이");
  assert.equal(h.level, 3);
  assert.deepEqual(h.tags, ["로그인", "보안"]);
  assert.equal(K.parseFrontMatter("# 머리말 없음"), null);
});

test("하늘 만들기: 달마다 모으고, 날짜 순서로 별 번호를 준다", () => {
  const sky = K.buildSky(FILES, { year: 2026, repo: "my-id/my-knowledge" });
  assert.equal(sky.months.length, 12);
  const oct = sky.months[9];
  assert.equal(oct.month, 10);
  assert.equal(oct.sign, "천칭자리");
  assert.deepEqual(oct.items.map((x) => [x.star, x.title]), [[1, "MoSCoW로 줄이기"], [2, "세션과 토큰의 차이"]]);
  assert.equal(sky.months[1].items[0].title, "EARS로 한 줄씩");
  assert.equal(sky.months[1].sign, "물병자리");
});

test("어디에 있는지 한 줄로 말한다 — 몇 월 · 어느 별자리 · 몇 번째 별", () => {
  const sky = K.buildSky(FILES, { year: 2026, repo: "my-id/my-knowledge" });
  assert.equal(K.whereIs(sky, "세션과 토큰의 차이"), "10월 천칭자리 ★2");
  assert.equal(K.whereIs(sky, "없는 지식"), null);
});

test("GitHub 출처를 남긴다 — 저장소 · 경로 · 커밋 (본문은 남기지 않는다)", () => {
  const sky = K.buildSky(FILES, { year: 2026, repo: "my-id/my-knowledge" });
  const it = sky.months[9].items[1];
  assert.deepEqual(it.source, { repo: "my-id/my-knowledge", path: "knowledge/2026-10/session-vs-token.md", commit: "a1b2c3d" });
  assert.ok(!JSON.stringify(sky).includes("본문은 하늘로"), "본문 글은 하늘 데이터에 없다");
});

test("제목이 없거나 머리말이 없는 파일은 빼고, 뺀 것을 알려 준다", () => {
  const sky = K.buildSky(FILES, { year: 2026, repo: "my-id/my-knowledge" });
  assert.deepEqual(sky.skipped.map((s) => s.path), ["knowledge/drafts/no-title.md", "README.md"]);
});

test("다른 해의 지식은 이 하늘에 올리지 않는다", () => {
  const sky = K.buildSky([{ path: "k/a.md", commit: "1", text: md("title: 작년 것\ndate: 2025-10-01") }], { year: 2026, repo: "r" });
  assert.equal(sky.months.reduce((n, m) => n + m.items.length, 0), 0);
  assert.equal(sky.skipped[0].why, "다른 해");
});

test("별자리의 별보다 지식이 많으면 넘친 것은 '다음 별 대기'로 둔다", () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ path: `k/${i}.md`, commit: String(i), text: md(`title: 지식 ${i + 1}\ndate: 2026-04-${String(i + 1).padStart(2, "0")}`) }));
  const apr = K.buildSky(many, { year: 2026, repo: "r" }).months[3];
  assert.equal(apr.sign, "양자리");
  assert.equal(apr.items.length, apr.stars);
  assert.equal(apr.waiting.length, 9 - apr.stars);
});
