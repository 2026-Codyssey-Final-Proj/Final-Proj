// claude-drafted: 2026-10-18 — 이재엽 결정 "GitHub Action + API 토큰": main에 올라오면 CHANGELOG 맨 위 버전을 Jira 릴리스로(jira.md 3절).
// 진짜 Jira는 부르지 않는다 — 가짜 fetch가 받은 요청을 적어 두고 정해 둔 답을 돌려준다. 기다림(sleep)도 가짜.
// 실행: node --test 04-tests/repo/jira-release.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const J = require("../../.github/scripts/jira-release.js");

const ROOT = path.join(__dirname, "../..");
const CHANGELOG = "| 버전 | 날짜 | 누가 | 무엇이 달라졌나 | 건드린 곳 |\n|---|---|---|---|---|\n" +
  "| v1.3 | 2026-10-20 | 임유정 | **게이트** 문구 `고침` | `02-frontend/` |\n| v1.2 | 2026-10-19 | 이재엽 | 앞 | 루트 |\n";
const ENV = { JIRA_BASE_URL: "https://team-x.atlassian.net", JIRA_EMAIL: "bot@example.com", JIRA_API_TOKEN: "fake-token-value-123", JIRA_PROJECT_KEY: "FLO", GITHUB_EVENT_PATH: "event.json" };
const EVENT = { commits: [
  { message: "Merge pull request #110 from org/v2/FLO-12-gate\n\n[v1.3] FLO-12 fix(navigator): 게이트 문구" },
  { message: "fix(navigator): FR-13 풀이 · F-03 고침 FLO-7" },
  { message: "docs: FLO-12 다시 · FLO-123x는 키가 아님 · AFLO-9도 아님" },
] };

// answers: "METHOD path" → [{status, body}, …] 순서대로(마지막 것을 되풀이)
function fakeIo(answers, files = { "CHANGELOG.md": CHANGELOG, "event.json": JSON.stringify(EVENT) }) {
  const calls = [], logs = [], sleeps = [];
  const io = {
    calls, logs, sleeps,
    read: (p) => files[p] || "",
    log: (s) => logs.push(s),
    sleep: async (ms) => { sleeps.push(ms); },
    fetch: async (url, opt) => {
      const key = `${opt.method} ${url.replace(/^https:\/\/[^/]+/, "")}`;
      calls.push({ key, url, opt, body: opt.body ? JSON.parse(opt.body) : null });
      const list = answers[key] || [{ status: 404 }];
      const a = list.length > 1 ? list.shift() : list[0];
      if (a.throw) throw new Error("network");
      return { status: a.status, ok: a.status >= 200 && a.status < 300, json: async () => a.body };
    },
  };
  return io;
}
const PROJECT = { "GET /rest/api/3/project/FLO": [{ status: 200, body: { id: "10000", key: "FLO" } }] };
const OK_ISSUES = { "PUT /rest/api/3/issue/FLO-7": [{ status: 204 }], "PUT /rest/api/3/issue/FLO-12": [{ status: 204 }] };

test("CHANGELOG 맨 위 줄을 읽는다 — 버전 · 날짜 · '무엇'(굵게 · 코드 표시는 뗀다)", () => {
  assert.deepEqual(J.topVersion(CHANGELOG), { version: "v1.3", date: "2026-10-20", what: "게이트 문구 고침" });
  assert.equal(J.topVersion("| 버전 | 날짜 |\n|---|---|"), null);
  const real = J.topVersion(fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8"));
  assert.match(real.version, /^v\d+\.\d+$/, "저장소의 CHANGELOG.md도 읽힌다");
});

test("이 프로젝트의 키만 고른다 — 겹치면 하나, 문서 번호(FR-13 · F-03)와 비슷한 글자는 빼고, 번호 순으로", () => {
  assert.deepEqual(J.issueKeys(EVENT.commits.map((c) => c.message), "FLO"), ["FLO-7", "FLO-12"]);
  assert.deepEqual(J.issueKeys(["FLO-1"], "flo"), [], "키가 대문자가 아니면 아무것도 고르지 않는다");
  assert.deepEqual(J.issueKeys([null, undefined, ""], "FLO"), []);
});

test("비밀값이 하나라도 없으면 Jira를 부르지 않고 건너뛴다 — 설정 전에도 실패가 아니다", async () => {
  for (const k of ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY"]) {
    const io = fakeIo({});
    assert.equal(await J.run({ ...ENV, [k]: "" }, io), 0);
    assert.equal(io.calls.length, 0);
    assert.match(io.logs.join("\n"), new RegExp(`건너뜀.*${k}`));
  }
});

test("주소가 https://…atlassian.net이 아니면 토큰을 보내지 않고 실패한다 — 주소 값은 찍지 않는다", async () => {
  for (const bad of ["http://team-x.atlassian.net", "https://atlassian.net.evil.example", "https://evil.example/?team-x.atlassian.net", "주소 아님"]) {
    const io = fakeIo({});
    assert.equal(await J.run({ ...ENV, JIRA_BASE_URL: bad }, io), 1, bad);
    assert.equal(io.calls.length, 0, bad);
    assert.ok(!io.logs.join("\n").includes(bad), "로그에 주소가 없다");
  }
});

test("버전이 없으면 만들면서 바로 릴리스하고, 키가 적힌 이슈마다 그 버전을 붙인다", async () => {
  const io = fakeIo({ ...PROJECT, "GET /rest/api/3/project/FLO/versions": [{ status: 200, body: [{ id: "1", name: "v1.2", released: true }] }],
    "POST /rest/api/3/version": [{ status: 201, body: { id: "2" } }], ...OK_ISSUES });
  assert.equal(await J.run(ENV, io), 0);
  const post = io.calls.find((c) => c.key === "POST /rest/api/3/version");
  assert.deepEqual(post.body, { name: "v1.3", projectId: 10000, description: "게이트 문구 고침", released: true, releaseDate: "2026-10-20" });
  const puts = io.calls.filter((c) => c.key.startsWith("PUT /rest/api/3/issue/"));
  assert.deepEqual(puts.map((c) => c.key.split("/").pop()), ["FLO-7", "FLO-12"]);
  assert.deepEqual(puts[0].body, { update: { fixVersions: [{ add: { name: "v1.3" } }] } });
  assert.ok(io.calls.every((c) => c.url.startsWith("https://team-x.atlassian.net/rest/api/3/")));
  assert.equal(io.calls[0].opt.headers.Authorization, "Basic " + Buffer.from("bot@example.com:fake-token-value-123").toString("base64"));
});

test("이미 있는 버전이면 다시 만들지 않는다 — 릴리스 전이면 릴리스만, 릴리스됐으면 이슈만 붙인다", async () => {
  const pending = fakeIo({ ...PROJECT, "GET /rest/api/3/project/FLO/versions": [{ status: 200, body: [{ id: "5", name: "v1.3", released: false }] }],
    "PUT /rest/api/3/version/5": [{ status: 200, body: {} }], ...OK_ISSUES });
  assert.equal(await J.run(ENV, pending), 0);
  assert.ok(!pending.calls.some((c) => c.key === "POST /rest/api/3/version"));
  assert.deepEqual(pending.calls.find((c) => c.key === "PUT /rest/api/3/version/5").body, { released: true, releaseDate: "2026-10-20" });

  const done = fakeIo({ ...PROJECT, "GET /rest/api/3/project/FLO/versions": [{ status: 200, body: [{ id: "5", name: "v1.3", released: true }] }], ...OK_ISSUES });
  assert.equal(await J.run(ENV, done), 0);
  assert.ok(done.calls.every((c) => !/^(POST|PUT) .*\/version/.test(c.key)), "버전을 만들거나 고치지 않는다");
  assert.equal(done.calls.filter((c) => c.key.startsWith("PUT /rest/api/3/issue/")).length, 2);
});

test("이슈 하나가 실패해도 나머지는 붙이고, 빠진 이슈를 적은 뒤 실패로 끝낸다(조용히 멈추지 않는다)", async () => {
  const io = fakeIo({ ...PROJECT, "GET /rest/api/3/project/FLO/versions": [{ status: 200, body: [] }], "POST /rest/api/3/version": [{ status: 201, body: {} }],
    "PUT /rest/api/3/issue/FLO-7": [{ status: 404 }], "PUT /rest/api/3/issue/FLO-12": [{ status: 204 }] });
  assert.equal(await J.run(ENV, io), 1);
  assert.ok(io.calls.some((c) => c.key === "PUT /rest/api/3/issue/FLO-12"), "실패 뒤에도 다음 이슈를 한다");
  assert.match(io.logs.join("\n"), /::error::.*FLO-7\(404\)/);
});

test("429 · 500대 · 연결 끊김은 1 · 2 · 4초 뒤 3번까지 다시 해 보고, 그래도 안 되면 실패한다", async () => {
  const flaky = fakeIo({ "GET /rest/api/3/project/FLO": [{ status: 503 }, { throw: true }, { status: 200, body: { id: "1" } }],
    "GET /rest/api/3/project/FLO/versions": [{ status: 200, body: [{ id: "5", name: "v1.3", released: true }] }], ...OK_ISSUES });
  assert.equal(await J.run(ENV, flaky), 0);
  assert.deepEqual(flaky.sleeps, [1000, 2000]);

  const down = fakeIo({ "GET /rest/api/3/project/FLO": [{ status: 500 }] });
  assert.equal(await J.run(ENV, down), 1);
  assert.deepEqual(down.sleeps, [1000, 2000, 4000]);
  assert.equal(down.calls.length, 4, "처음 1번 + 다시 3번");
  assert.match(down.logs.join("\n"), /::error::Jira 버전을 만들지 못했어요 — GET \/rest\/api\/3\/project\/FLO: 500/);

  const denied = fakeIo({ "GET /rest/api/3/project/FLO": [{ status: 401 }] });
  assert.equal(await J.run(ENV, denied), 1);
  assert.deepEqual(denied.sleeps, [], "401 · 403 · 404는 다시 해 봐도 같으니 바로 멈춘다");
});

test("로그 어디에도 토큰 · 이메일 · 사이트 주소가 없다", async () => {
  const io = fakeIo({ ...PROJECT, "GET /rest/api/3/project/FLO/versions": [{ status: 200, body: [] }], "POST /rest/api/3/version": [{ status: 500 }] });
  await J.run(ENV, io);
  const all = io.logs.join("\n");
  for (const secret of [ENV.JIRA_API_TOKEN, ENV.JIRA_EMAIL, "team-x", Buffer.from(`${ENV.JIRA_EMAIL}:${ENV.JIRA_API_TOKEN}`).toString("base64")]) assert.ok(!all.includes(secret), secret);
});

test("워크플로는 main push에서만 돌고, 저장소 쓰기는 CHANGELOG · changes/만 main에 커밋하며, 비밀값을 Jira 스크립트에만 넘기고, 액션을 커밋 해시로 고정한다", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/jira-release.yml"), "utf8");
  assert.match(wf, /on:\s*\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.doesNotMatch(wf, /pull_request_target|pull_request:/, "PR 이벤트에서는 비밀값을 쓰지 않는다");
  // 2026-10-19: 조각(changes/*.md)을 CHANGELOG에 합쳐 main에 커밋하므로 contents: write — 그 대신 add 하는 경로를 둘로 못 박고 main에만 push 한다
  assert.match(wf, /permissions:\s*\n\s*contents:\s*write/);
  assert.match(wf, /git add CHANGELOG\.md changes\n/);
  assert.match(wf, /git push origin HEAD:main\n/);
  assert.doesNotMatch(wf, /--force/);
  assert.ok(wf.indexOf("changelog-fold.js") < wf.indexOf("jira-release.js"), "조각을 먼저 합친 뒤 Jira 릴리스");
  for (const m of wf.matchAll(/uses:\s*(\S+)/g)) assert.match(m[1], /@[0-9a-f]{40}$/, `${m[1]}은 커밋 해시로 고정`);
  assert.match(wf, /node \.github\/scripts\/jira-release\.js/);
  for (const k of ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN"]) assert.match(wf, new RegExp(`${k}: \\$\\{\\{ secrets\\.${k} \\}\\}`));
  assert.match(wf, /JIRA_PROJECT_KEY: \$\{\{ vars\.JIRA_PROJECT_KEY \}\}/);
});
