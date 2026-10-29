// claude-drafted: 2026-10-29 — app.js 나누기 1차(이재엽 "기능들을 나뉘게 하면 더 효율적으로" · 버튼 "가장 문제가 덜하고 유지보수가 가능한 작업" · "지금 바로").
// 원본은 02-frontend/navigator/app/ 조각, app.js는 그 조각을 차례대로 묶은 릴리즈 파일이다(동작 · 다른 시험은 그대로 app.js를 본다).
// 이 시험이 지키는 것: ① app.js가 조각을 묶은 것과 같다(한쪽만 고치면 실패) ② app.js를 직접 고쳐도 split으로 조각에 되돌릴 수 있다(왕복)
//   ③ 표시 줄이 없거나 모르는 글이 앞에 있으면 split이 멈춘다 ④ join이 app.js에만 있는 고침을 덮지 않는다 ⑤ 이름이 틀린 조각은 빠지지 않고 멈춘다
//   ⑥ 묶은 app.js는 문법이 맞다 ⑦ 조각 하나는 한 번에 읽을 수 있는 크기
// 사람의 터미널 커밋 · GitHub 병합은 커밋 전 시험을 거치지 않아 .github/workflows/app-parts.yml이 PR과 main에서 이 시험을 돈다
// 실행: node --test 04-tests/navigator/app-parts.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const NAV = path.join(__dirname, "../../02-frontend/navigator");
const vm = require("node:vm");
const AP = require(path.join(NAV, "app-parts.js"));

const FIX = "app.js와 app/ 조각이 다르다 — `node 02-frontend/navigator/app-parts.js join`을 먼저 돌리세요. app.js에만 있는 고침(직접 고침 · 옛 브랜치 병합)이면 join이 멈추고 그 칸과 split을 알려 줍니다. 그 뒤 둘 다 커밋";

test("app.js는 app/ 조각을 이름 차례로 묶은 것과 같다", () => {
  const parts = AP.readParts(path.join(NAV, "app"));
  assert.ok(parts.length >= 10, "조각이 열 개 이상");
  const app = fs.readFileSync(path.join(NAV, "app.js"), "utf8");
  assert.ok(AP.join(parts) === app, FIX);
  assert.doesNotThrow(() => new vm.Script(app, { filename: "app.js" }), "묶은 app.js의 문법 — 조각을 잘못 자르거나 지우면 여기서");
});

test("split → join 왕복 — app.js를 직접 고친 것도 조각으로 돌아간다", () => {
  const parts = [{ name: "00-a.js", text: "(() => {\n  const a = 1;\n" }, { name: "10-b.js", text: "  // ── 둘째 ──\n  a;\n})();\n" }];
  const out = AP.join(parts);
  assert.match(out.split("\n")[0], /묶은 파일/, "맨 첫 줄은 고칠 곳을 알리는 머리 줄");
  assert.deepEqual(AP.split(out), parts);
  assert.deepEqual(AP.split(out.replace("a;", "a + 1;"))[1].text, "  // ── 둘째 ──\n  a + 1;\n})();\n", "고친 줄이 그 조각에");
  assert.equal(AP.join([{ name: "00-a.js", text: "x" }]), AP.join([{ name: "00-a.js", text: "x\n" }]), "끝 줄바꿈이 없으면 붙인다");
  const blank = [{ name: "00-a.js", text: "a\n\n" }, { name: "10-b.js", text: "b\n\n" }];
  assert.deepEqual(AP.split(AP.join(blank)), blank, "끝의 빈 줄도 잃지 않는다");
});

test("표시 줄이 없거나 앞에 모르는 글이 있으면 split이 멈춘다 — 조각을 잃지 않게", () => {
  assert.throws(() => AP.split("(() => {})();\n"), /조각 표시/);
  const out = AP.join([{ name: "00-a.js", text: "a\n" }]);
  assert.throws(() => AP.split(out.replace(/^.*\n/, "$&누가 쓴 줄\n")), /조각 표시/);
});

test("split을 파일에 쓰면 없어진 조각 파일은 지우고 README 같은 다른 파일은 둔다", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "app-parts-"));
  try {
    fs.writeFileSync(path.join(dir, "50-old.js"), "old\n");
    fs.writeFileSync(path.join(dir, "README.md"), "# 조각\n");
    AP.writeParts(dir, [{ name: "00-a.js", text: "a\n" }]);
    assert.deepEqual(fs.readdirSync(dir).sort(), ["00-a.js", "README.md"]);
    assert.deepEqual(AP.readParts(dir), [{ name: "00-a.js", text: "a\n" }]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("join이 덮으면 잃는 칸 — app.js의 그 칸이 지금 조각과도, 마지막 커밋의 조각과도 다를 때만", () => {
  const committed = { "00-a.js": "a\n", "10-b.js": "b\n" };
  assert.deepEqual(AP.lostByJoin({ "00-a.js": "a\n", "10-b.js": "b\n" }, { "00-a.js": "a2\n", "10-b.js": "b\n" }, committed), [], "조각을 고쳤다 — 묶어도 된다");
  assert.deepEqual(AP.lostByJoin({ "00-a.js": "a\n", "10-b.js": "b9\n" }, { "00-a.js": "a\n", "10-b.js": "b\n" }, committed), ["10-b.js"], "app.js를 직접 고쳤다(또는 옛 브랜치 병합)");
  assert.deepEqual(AP.lostByJoin({ "00-a.js": "a9\n" }, { "00-a.js": "a2\n" }, { "00-a.js": "a\n" }), ["00-a.js"], "둘 다 고쳤다");
  assert.deepEqual(AP.lostByJoin({ "00-a.js": "a9\n" }, { "00-a.js": "a\n" }, { "00-a.js": "a9\n" }), [], "옛 브랜치 고침이 이미 커밋된 조각에도 있다");
  assert.deepEqual(AP.lostByJoin({ "00-a.js": "a\n" }, { "00-a.js": "a\n", "05-n.js": "n\n" }, { "00-a.js": "a\n" }), [], "새 조각을 더했다");
  assert.deepEqual(AP.lostByJoin({ "00-a.js": "a\n", "10-b.js": "b\n" }, { "00-a.js": "a\n" }, committed), [], "조각을 지웠다");
});

test("이름이 틀린 .js 조각은 조용히 빠지지 않고 멈춘다", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "app-parts-"));
  try {
    fs.writeFileSync(path.join(dir, "00-a.js"), "a\n");
    fs.writeFileSync(path.join(dir, "README.md"), "# 조각\n");
    assert.deepEqual(AP.readParts(dir).map((p) => p.name), ["00-a.js"]);
    fs.writeFileSync(path.join(dir, "47-myFeature.js"), "x\n");
    assert.throws(() => AP.readParts(dir), /47-myFeature\.js/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("조각 하나는 100,000자 이하 — 한 기능을 한 번에 읽을 수 있게(넘으면 기능 경계에서 조각을 하나 더 만든다)", () => {
  for (const p of AP.readParts(path.join(NAV, "app"))) assert.ok(p.text.length <= 100000, `${p.name} ${p.text.length}자`);
});
