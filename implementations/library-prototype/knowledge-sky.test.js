// claude-drafted: 2026-10-17 — GitHub 저장소의 지식 파일(마크다운 + 머리말) → 은하(달 폴더) · 태양계(태그) · 별(책). 실제 GitHub은 부르지 않는다.
const test = require("node:test");
const assert = require("node:assert/strict");
const K = require("./knowledge-sky.js");

const md = (head, body = "본문은 하늘로 가져오지 않는다") => `---\n${head}\n---\n\n${body}\n`;
const FILES = [
  { path: "knowledge/2026-10/session-vs-token.md", commit: "a1b2c3d", text: md("title: 세션과 토큰의 차이\ndate: 2026-10-03\nline: 서버가 기억하느냐, 들고 다니느냐\ntags: [보안, 로그인]\nlevel: 3") },
  { path: "knowledge/2026-10/keys.md", commit: "a1b2c3e", text: md("title: 키는 환경변수에만\ndate: 2026-10-02\ntags: [보안]") },
  { path: "knowledge/2026-10/moscow.md", commit: "b2c3d4e", text: md("title: MoSCoW로 줄이기\ndate: 2026-10-01\ntags: [MoSCoW]") },
  { path: "knowledge/2026-02/ears.md", commit: "c3d4e5f", text: md("title: EARS로 한 줄씩\ndate: 2026-02-11\ntags: [EARS]\nlevel: 2") },
  { path: "knowledge/2026-03/late-note.md", commit: "c3d4e60", text: md("title: 2월 말에 쓰고 3월 폴더에 둔 것\ndate: 2026-02-28\ntags: [로그인]") },
  { path: "knowledge/2026-10/no-tag.md", commit: "c3d4e61", text: md("title: 태그 없는 메모\ndate: 2026-10-09") },
  { path: "knowledge/drafts/no-title.md", commit: "d4e5f60", text: md("date: 2026-10-05") },
  { path: "README.md", commit: "e5f6071", text: "# 내 지식 창고" },
];
const build = (files = FILES) => K.buildSky(files, { year: 2026, repo: "my-id/my-knowledge" });
const galaxy = (sky, m) => sky.galaxies[m - 1];
const system = (sky, m, tag) => galaxy(sky, m).systems.find((s) => s.tag === tag);

test("머리말을 읽는다 — 글자, 숫자, [목록]", () => {
  const h = K.parseFrontMatter(FILES[0].text);
  assert.equal(h.title, "세션과 토큰의 차이");
  assert.equal(h.level, 3);
  assert.deepEqual(h.tags, ["보안", "로그인"]);
  assert.equal(K.parseFrontMatter("# 머리말 없음"), null);
});

test("은하 = 달 폴더: 12개 은하, 파일은 자기 폴더의 은하에 뜬다", () => {
  const sky = build();
  assert.equal(sky.galaxies.length, 12);
  assert.equal(galaxy(sky, 10).folder, "knowledge/2026-10/");
  assert.equal(galaxy(sky, 2).count, 1);
  // 날짜는 2월이어도 3월 폴더에 두었으면 3월 은하다 — 폴더가 은하를 정한다
  assert.equal(galaxy(sky, 3).systems[0].items[0].title, "2월 말에 쓰고 3월 폴더에 둔 것");
});

test("폴더에 달이 없으면 날짜로 은하를 정한다", () => {
  const sky = build([{ path: "notes/a.md", commit: "1", text: md("title: 폴더 밖\ndate: 2026-05-02\ntags: [메모]") }]);
  assert.equal(galaxy(sky, 5).count, 1);
});

test("태양계 = 태그: 첫 태그의 태양계에 별로 뜨고, 날짜 순서로 별 번호를 준다", () => {
  const sky = build();
  const sec = system(sky, 10, "보안");
  assert.deepEqual(sec.items.map((x) => [x.star, x.title]), [[1, "키는 환경변수에만"], [2, "세션과 토큰의 차이"]]);
  // 큰 태양계가 먼저
  assert.equal(galaxy(sky, 10).systems[0].tag, "보안");
});

test("태그가 둘 이상이면 다른 태그의 태양계에는 손님 책으로 보인다", () => {
  const sky = build();
  const login = system(sky, 10, "로그인");
  assert.equal(login.items.length, 0);
  assert.deepEqual(login.guests.map((x) => x.title), ["세션과 토큰의 차이"]);
  // 은하 안에서 두 태양계를 잇는 다리
  assert.deepEqual(galaxy(sky, 10).bridges, [{ from: "보안", to: "로그인", title: "세션과 토큰의 차이" }]);
});

test("태그 없는 지식은 '태그 없음' 태양계에 모인다", () => {
  assert.equal(system(build(), 10, "태그 없음").items[0].title, "태그 없는 메모");
});

test("태그로 책 보기 — 모든 은하에서 그 태그의 책을 어디에 있는지와 함께", () => {
  const books = K.booksByTag(build(), "로그인");
  assert.deepEqual(books.map((b) => [b.title, b.where]), [
    ["2월 말에 쓰고 3월 폴더에 둔 것", "3월 은하 · 로그인 태양계 ★1"],
    ["세션과 토큰의 차이", "10월 은하 · 보안 태양계 ★2"],
  ]);
  assert.deepEqual(K.allTags(build()).slice(0, 2), [{ tag: "로그인", count: 2 }, { tag: "보안", count: 2 }]);
});

test("어디에 있는지 한 줄로 말한다 — 몇 월 은하 · 어느 태양계 · 몇 번째 별", () => {
  const sky = build();
  assert.equal(K.whereIs(sky, "세션과 토큰의 차이"), "10월 은하 · 보안 태양계 ★2");
  assert.equal(K.whereIs(sky, "없는 지식"), null);
});

test("GitHub 출처를 남긴다 — 저장소 · 경로 · 커밋 (본문은 남기지 않는다)", () => {
  const sky = build();
  assert.deepEqual(system(sky, 10, "보안").items[1].source, { repo: "my-id/my-knowledge", path: "knowledge/2026-10/session-vs-token.md", commit: "a1b2c3d" });
  assert.ok(!JSON.stringify(sky).includes("본문은 하늘로"), "본문 글은 하늘 데이터에 없다");
});

test("제목·머리말이 없거나 다른 해인 파일은 빼고, 뺀 것을 알려 준다", () => {
  assert.deepEqual(build().skipped.map((s) => s.path), ["knowledge/drafts/no-title.md", "README.md"]);
  const other = build([{ path: "knowledge/2025-10/a.md", commit: "1", text: md("title: 작년 것\ndate: 2025-10-01") }]);
  assert.equal(other.skipped[0].why, "다른 해");
});

test("별자리 모양: 해가 가운데, 별은 가지로 이어지고(빠진 별 없음), 같은 입력이면 같은 모양", () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ path: `knowledge/2026-04/${i}.md`, commit: String(i), text: md(`title: 지식 ${i + 1}\ndate: 2026-04-${String((i % 28) + 1).padStart(2, "0")}\ntags: [뼈대]`) }));
  const a = system(build(many), 4, "뼈대"), b = system(build(many), 4, "뼈대");
  assert.equal(a.items.length, 40, "별 수에 상한이 없다 — 대기 줄이 없다");
  assert.deepEqual(a.shape, b.shape, "같은 입력이면 같은 모양");
  const pts = [a.shape.sun, ...a.shape.stars];
  assert.equal(a.shape.stars.length, 40);
  assert.ok(pts.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100), "좌표는 0~100");
  // 이어짐: 해(0)에서 출발해 모든 별에 닿는다
  const seen = new Set([0]); let grew = true;
  while (grew) { grew = false; for (const [p, q] of a.shape.edges) { if (seen.has(p) !== seen.has(q)) { seen.add(p); seen.add(q); grew = true; } } }
  assert.equal(seen.size, 41);
  // 가지가 갈라진다 — 선이 셋 이상 모이는 점이 있다
  const deg = new Map(); for (const [p, q] of a.shape.edges) { deg.set(p, (deg.get(p) || 0) + 1); deg.set(q, (deg.get(q) || 0) + 1); }
  assert.ok([...deg.values()].some((d) => d >= 3));
});

test("은하 안 태양계 자리는 서로 떨어져 있다", () => {
  const files = ["가", "나", "다", "라", "마", "바"].map((t, i) => ({ path: `knowledge/2026-06/${i}.md`, commit: String(i), text: md(`title: ${t}\ndate: 2026-06-0${i + 1}\ntags: [${t}]`) }));
  const ps = galaxy(build(files), 6).systems.map((s) => s.at);
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) assert.ok(Math.hypot(ps[i][0] - ps[j][0], ps[i][1] - ps[j][1]) >= 18, `${i}-${j}`);
});
