// claude-drafted: 2026-10-27 — C-45 문서 지도(docmap.js): 문서 → archi-board 보드 데이터(format 1). 코드보다 먼저 썼다(code.md 1번)
// 실행: node --test 04-tests/navigator/docmap.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../../03-backend/navigator/docmap.js");

test("링크 — 상대 경로를 풀고(../ · ./), 폴더 밖은 버리며, '## 재료' 절 안의 링크는 material, 그 밖은 link", () => {
  assert.equal(D.resolveRel("docs/03-requirements/requirements.md", "../02-plan/plan.md"), "docs/02-plan/plan.md");
  assert.equal(D.resolveRel("docs/PRD.md", "./decisions.md"), "docs/decisions.md"); assert.equal(D.resolveRel("README.md", "docs/README.md"), "docs/README.md");
  assert.equal(D.resolveRel("docs/a.md", "../../outside.md"), null);
  const doc = { path: "docs/03-requirements/requirements.md", text: "# 3단계\n\n## 재료\n\n- 2단계에서 정한 것 — [plan.md](../02-plan/plan.md)\n\n## 할 일\n\n기획서는 [PRD](../PRD.md), 자기 자신 [x](requirements.md), 밖 [o](../../x.md), 그림 [p](a.png)" };
  assert.deepEqual(D.linksOf(doc), [{ to: "docs/02-plan/plan.md", kind: "material" }, { to: "docs/PRD.md", kind: "link" }, { to: "x.md", kind: "link" }], "../../x.md는 루트의 x.md — 폴더 안이다(없는 문서면 build가 버린다)");
});

test("보드 — 문서마다 상자(단계 · 기획서 · 저장소 창), 재료 링크는 realization · 나머지는 association, 지금 장은 part · 바뀐 문서는 cand, 없는 문서로 가는 선은 없다, 같은 선은 한 번", () => {
  const docs = [
    { path: "README.md", text: "# 앱\n[목차](docs/README.md)" }, { path: "docs/README.md", text: "[1](01-idea/idea.md) [2](02-plan/plan.md) [3](03-requirements/requirements.md)" },
    { path: "docs/PRD.md", text: "기획서 [결정](decisions.md)" }, { path: "docs/decisions.md", text: "" },
    { path: "docs/01-idea/idea.md", text: "# 1" }, { path: "docs/02-plan/plan.md", text: "## 재료\n[1](../01-idea/idea.md) [1 again](../01-idea/idea.md)\n## 본문\n[없음](../09-x/x.md)" },
    { path: "docs/03-requirements/requirements.md", text: "## 재료\n[2](../02-plan/plan.md)\n## 본문\n[PRD](../PRD.md)" }, { path: "src/app.js", text: "x" },
  ];
  const b = D.build(docs, { now: "docs/03-requirements/requirements.md", changed: ["docs/02-plan/plan.md"], project: "my-club-app" });
  assert.equal(b.format, 1); assert.equal(b.title, "my-club-app 문서 지도"); assert.equal(b.start, "stages");
  assert.deepEqual(b.frames.map((f) => f.id), ["stages", "plan", "repo"]);
  assert.equal(b.elements.length, 7, "md만"); assert.ok(b.elements.every((e) => e.t === "dobject" && e.c));
  const by = Object.fromEntries(b.elements.map((e) => [e.c, e]));
  assert.deepEqual([by["docs/03-requirements/requirements.md"].s, by["docs/02-plan/plan.md"].s, by["docs/01-idea/idea.md"].s], ["part", "cand", "done"]);
  assert.deepEqual([by["docs/01-idea/idea.md"].f, by["docs/PRD.md"].f, by["README.md"].f], ["stages", "plan", "repo"]);
  assert.deepEqual(b.elements.slice(0, 3).map((e) => e.n), ["idea.md", "plan.md", "requirements.md"], "단계 차례로");
  const rel = (a, c) => b.relations.find(([x, y]) => x === D.idOf(a) && y === D.idOf(c));
  assert.equal(rel("docs/02-plan/plan.md", "docs/01-idea/idea.md")[2], "realization"); assert.equal(rel("docs/03-requirements/requirements.md", "docs/PRD.md")[2], "association");
  assert.equal(b.relations.filter(([x, y]) => x === D.idOf("docs/02-plan/plan.md") && y === D.idOf("docs/01-idea/idea.md")).length, 1, "같은 선은 한 번");
  assert.ok(!b.relations.some(([, y]) => y === D.idOf("docs/09-x/x.md")), "없는 문서로 가는 선은 없다");
  assert.deepEqual(b.flows, [["stages", "plan", "단계 문서를 모아"], ["stages", "repo", "절만 바꿔 넣어"]]);
  assert.equal(b.tour[0].ids.length, 3);
  assert.deepEqual(D.build([]).frames, []); assert.deepEqual(D.build([]).tour, []);
  assert.ok(!JSON.stringify(b).includes("/Users/"), "절대 경로 없음");
});
