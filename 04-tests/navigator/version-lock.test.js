// claude-drafted: 2026-10-21 — 이재엽 요청("버전업 업그레이드는 못하도록 막아줘", 버튼: 지금부터 다시 풀 때까지).
// 02-frontend/electron/version-lock.json이 있으면 앱 버전은 그 값에 묶이고, Release 워크플로는 Release를 만들기 전에 멈춘다.
// 풀 때는 잠금 파일을 지운다 — 그러면 이 시험은 아무것도 확인하지 않고 지나간다.
// 실행: node --test 04-tests/navigator/version-lock.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
const LOCK = path.join(ROOT, "02-frontend/electron/version-lock.json");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const locked = fs.existsSync(LOCK);

test("잠금 중에는 앱 버전(package.json · package-lock.json)이 잠근 값과 같다", { skip: !locked && "잠금 파일 없음 — 풀린 상태" }, () => {
  const lock = JSON.parse(fs.readFileSync(LOCK, "utf8"));
  assert.match(lock.version, /^\d+\.\d+\.\d+$/);
  const pkg = JSON.parse(read("02-frontend/electron/package.json"));
  const pl = JSON.parse(read("02-frontend/electron/package-lock.json"));
  const msg = (v) => `앱 버전이 ${lock.version}에 잠겨 있다(지금 ${v}). 버전업은 잠금을 푼 뒤에 — version-lock.json을 지우는 PR`;
  assert.equal(pkg.version, lock.version, msg(pkg.version));
  assert.equal(pl.version, lock.version, msg(pl.version));
  assert.equal(pl.packages[""].version, lock.version, msg(pl.packages[""].version));
});

test("잠금 중에는 Release 워크플로가 Release를 만들기 전에 잠금 파일을 보고 멈춘다", { skip: !locked && "잠금 파일 없음 — 풀린 상태" }, () => {
  const yml = read(".github/workflows/app-release.yml");
  const guard = yml.indexOf("02-frontend/electron/version-lock.json ]"), create = yml.indexOf("gh release create");
  assert.ok(guard > 0, "잠금 확인 단계가 있다");
  assert.ok(create > guard, "잠금 확인이 Release 만들기보다 앞에 있다");
  assert.match(yml.slice(guard, create), /exit 1/, "잠겨 있으면 실패로 멈춘다");
});
