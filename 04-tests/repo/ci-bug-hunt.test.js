// claude-drafted: 2026-10-30 — F-105-5 · 6(버전 기록 Action): 01-docs/07-maintenance/fixes/hooks-bug-hunt.md
// 실행: node --test 04-tests/repo/ci-bug-hunt.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const F = require("../../.github/scripts/changelog-fold.js");
const J = require("../../.github/scripts/jira-release.js");
const ROOT = path.join(__dirname, "../..");

const HEAD = "| 버전 | 날짜 | 누가 | 무엇이 달라졌나 | 건드린 곳 |\n|---|---|---|---|---|\n";
const frag = (kind, what) => `종류: ${kind}\n누가: 임유정\n무엇: ${what}\n건드린 곳: \`02-frontend/\`\n`;

test("F-105-5 틀린 조각이 하나 있어도 정상 조각은 합치고 지운다 — 틀린 것은 남기고 실패로 알린다, 합친 버전은 출력으로", () => {
  const files = { "CHANGELOG.md": `${HEAD}| v1.0 | 2026-10-20 | 이재엽 | 처음 | 루트 |\n`, "changes/a.md": frag("작은 고침", "고침 하나"), "changes/b.md": "엉터리" };
  const removed = [], logs = [], out = {};
  const io = { list: () => ["a.md", "b.md", "README.md"], read: (p) => files[p] || "", write: (p, t) => { files[p] = t; }, remove: (p) => removed.push(p), log: (s) => logs.push(s), output: (k, v) => { out[k] = v; } };
  assert.equal(F.run(io), 1, "틀린 조각은 실패로 알린다");
  assert.match(files["CHANGELOG.md"], /\| v1\.1 \| .* 고침 하나/, "정상 조각은 합쳤다");
  assert.deepEqual(removed, ["changes/a.md"], "정상 조각만 지운다");
  assert.equal(out.versions, "v1.1", "합친 버전을 Jira 단계에 넘긴다");
  assert.ok(logs.some((l) => l.startsWith("::error::") && l.includes("b")), "틀린 조각을 적는다");

  const y = fs.readFileSync(path.join(ROOT, ".github/workflows/jira-release.yml"), "utf8");
  assert.match(y, /id: fold\n\s+continue-on-error: true/, "합치기가 실패해도 다음 단계(커밋 · Jira)가 돈다");
  assert.match(y, /FOLDED_VERSIONS: \$\{\{ steps\.fold\.outputs\.versions \}\}/);
  assert.match(y, /if: steps\.fold\.outcome == 'failure'\n\s+run: \|?[\s\S]*?exit 1/, "그래도 실행은 빨갛게");
});

test("F-105-6 같은 브랜치 끝 이름이 여러 번 병합됐으면 가장 새 PR 번호를 붙인다(커밋 순서와 상관없이)", () => {
  const newestFirst = F.prNumbers(["Merge pull request #282 from o/v2/backend-bug-hunt", "Merge pull request #120 from o/v1/backend-bug-hunt"]);
  const oldestFirst = F.prNumbers(["Merge pull request #120 from o/v1/backend-bug-hunt", "Merge pull request #282 from o/v2/backend-bug-hunt"]);
  assert.equal(newestFirst.byBranch["backend-bug-hunt"], "282");
  assert.equal(oldestFirst.byBranch["backend-bug-hunt"], "282");
});

test("F-105-6 한 번에 합친 버전이 여럿이면 버전마다 Jira 릴리스를 만든다(이슈는 맨 위 버전에)", async () => {
  const CL = `${HEAD}| v2.1 | 2026-10-30 | 임유정 | 둘 | 루트 |\n| v2.0 | 2026-10-30 | 두승현 | 하나 | 루트 |\n| v1.9 | 2026-10-29 | 이재엽 | 앞 | 루트 |\n`;
  const calls = [];
  const io = { read: (p) => (p === "CHANGELOG.md" ? CL : "{}"), log() {}, sleep: async () => {},
    fetch: async (url, opt) => { const key = `${opt.method} ${url.replace(/^https:\/\/[^/]+/, "")}`; calls.push({ key, body: opt.body ? JSON.parse(opt.body) : null });
      const body = key.endsWith("/project/FLO") ? { id: "1" } : key.endsWith("/versions") ? [] : {}; return { status: 200, ok: true, json: async () => body }; } };
  const env = { JIRA_BASE_URL: "https://t.atlassian.net", JIRA_EMAIL: "b@example.com", JIRA_API_TOKEN: "x", JIRA_PROJECT_KEY: "FLO", FOLDED_VERSIONS: "v2.0,v2.1" };
  assert.equal(await J.run(env, io), 0);
  const made = calls.filter((c) => c.key === "POST /rest/api/3/version").map((c) => c.body.name);
  assert.deepEqual(made.sort(), ["v2.0", "v2.1"], "v2.0도 빠지지 않는다");
  assert.equal(calls.find((c) => c.body && c.body.name === "v2.0").body.description, "하나", "그 버전의 줄로");
});
