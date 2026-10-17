// claude-drafted: 2026-10-17 — 시연 녹화 목록만 시험한다(실제 호출 없음)
const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("../../03-backend/navigator/record-demo.js");
const REC = require("../../03-backend/navigator/recording.js");

test("시연 녹화 목록: 판정 9개 + 설계도 초안 4개(1~4단계), 키는 모두 다르다", () => {
  const list = R.demoRequests();
  assert.equal(list.filter((x) => x.kind === "judge").length, 9);
  assert.deepEqual(list.filter((x) => x.kind === "draft").map((x) => x.stage), [1, 2, 3, 4]);
  const keys = list.map((x) => REC.keyOf(x.prompt, x.schema));
  assert.equal(new Set(keys).size, list.length);
  for (const x of list) assert.ok(x.label && x.prompt && x.schema, x.label);
});

test("리뷰 요청은 받아 둔 초안 글로 만든다 — 화면이 보내는 것과 같아야 재생된다", () => {
  const Nav = require("../../03-backend/navigator/navigator.js");
  const req = R.reviewRequest({ stage: 2, text: "작업 글", draftText: "초안 본문" });
  assert.equal(req.prompt, Nav.reviewPrompt(2, "작업 글", "초안 본문"));
  assert.equal(req.kind, "review");
});

test("녹화 이름표: 저장하면 이어서 읽히고, 항목을 다시 저장해도 이름표는 남는다", () => {
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "nav-lab-")), "r.json");
  REC.save(file, { aaaa: { ok: 1 } }, { aaaa: "2단계 판정" });
  REC.save(file, { aaaa: { ok: 1 }, bbbb: { ok: 2 } });          // labels를 안 주면 그대로
  assert.deepEqual(REC.loadLabels(file), { aaaa: "2단계 판정" });
  assert.deepEqual(Object.keys(REC.load(file)), ["aaaa", "bbbb"]);
});
