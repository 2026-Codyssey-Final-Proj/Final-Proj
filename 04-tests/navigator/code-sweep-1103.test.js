// claude-drafted: 2026-11-03 — 코드 훑어보기 2차(임유정 "전체 코드 살펴보면서 오류 날만한 부분들 체크해줘" → "먼저 볼 것에서 4, 8, 9번 빼고 수정해줘"). F-135 ~
// 실행: node --test 04-tests/navigator/code-sweep-1103.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const S = require(path.join(__dirname, "../../03-backend/navigator/sensitive.js"));

test("F-135 비밀값 — 환경 변수 이름 앞뒤에 붙은 키 · 접속 주소의 비밀번호 · Stripe 키도 가린다", () => {
  const leaks = [
    ["AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY", "wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY"],
    ['SECRET_KEY = "django-insecure-abc123xyz"', "django-insecure-abc123xyz"],
    ["SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZSJ9.abc", "eyJhbGciOiJIUzI1NiJ9"],
    ["PRIVATE_KEY=0x4c0883a69102937d6231471b5dbb6204fe512961", "0x4c0883a69102937d6231471b5dbb6204fe512961"],
    ["clientSecret: abcd1234efgh", "abcd1234efgh"],
    ["DATABASE_URL=postgres://admin:S3cretPw@localhost:5432/app", "S3cretPw"],
    ["mongodb://root:hunter22@db:27017", "hunter22"],
    ["stripe sk_live_51HxYzAbCdEfGhIjKlMnOp", "sk_live_51HxYzAbCdEfGhIjKlMnOp"],
  ];
  for (const [text, secret] of leaks) {
    assert.ok(S.scan(text).blocked, `막아야 해요: ${text}`);
    assert.ok(!S.redact(text).includes(secret), `가려야 해요: ${S.redact(text)}`);
  }
});

test("F-135 비밀값 — 흔한 코드 · 문장은 걸지 않는다", () => {
  for (const t of ["const tokenCount = 5", "secretary: 김비서", "https://example.com:8080/path", "http://localhost:3000/@user", "키보드(KEY) 배치", "PRIMARY KEY (id)"]) {
    assert.equal(S.scan(t).blocked, false, `걸면 안 돼요: ${t}`);
  }
});

test("F-135 전화번호 — 띄어 쓴 번호 · +82 꼴도 가린다", () => {
  for (const t of ["010 1234 5678", "+82-10-1234-5678", "+82 10 1234 5678"]) {
    assert.ok(!/\d{4}\D?\d{4}$/.test(S.redact(t)), `가려야 해요: ${S.redact(t)}`);
  }
});

test("F-135 비밀값 — 밑줄만 이어진 512KB 한 줄도 1초 안에 끝난다", () => {
  const long = "A_".repeat(256 * 1024);
  const t0 = Date.now(); S.scan(long); S.redact(long);
  assert.ok(Date.now() - t0 < 1000, `${Date.now() - t0}ms`);
});

// ── 화면(app.js) — code-sweep-1102.test.js처럼 함수를 글자에서 떼어 가짜 상태로 돌린다 ──
const fs = require("node:fs");
const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");
function fnSrc(name) {
  const at = a.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(at >= 0, `${name}를 찾지 못했어요`);
  let i = a.indexOf(") {", at) + 2, d = 0;
  for (; i < a.length; i++) { if (a[i] === "{") d++; else if (a[i] === "}" && --d === 0) break; }
  return a.slice(at, i + 1);
}

test("F-136 진짜 AI로 바꾸면 연습의 예시 허락 카드를 내려 서버에 다시 묻는다", () => {
  const run = new Function("st", `let approvals = [{ id: "ex1" }], apMode = "example"; ${fnSrc("liveApprovals")}; liveApprovals(); return { approvals, apMode };`);
  const st = { apWait: true };
  const r = run(st);
  assert.deepEqual(r.approvals, []);
  assert.notEqual(r.apMode, "example", "example이면 pollApprovals가 끝까지 서버에 묻지 않는다");
  assert.equal(st.apWait, false);
  const keep = new Function("st", `let approvals = [{ id: "live1" }], apMode = "live"; ${fnSrc("liveApprovals")}; liveApprovals(); return { approvals, apMode };`)({});
  assert.deepEqual(keep, { approvals: [{ id: "live1" }], apMode: "live" }, "진짜 카드는 그대로");
  const at = a.indexOf('addEventListener("floe:setup-done", (e)'), done = a.slice(at, at + 600);
  assert.match(done, /d\.via === "cli" \|\| d\.via === "api"\) && canLive\) \{[^}]*liveApprovals\(\)/, "처음 설정에서 진짜 AI를 고르면 부른다");
});

test("F-137 마지막 단계를 마치면 새 단계 구분선 · '가져온 것'을 다시 붙이지 않는다", () => {
  const src = fnSrc("advance");
  assert.doesNotMatch(src, /^\s*questStarted\(\);/m, "다음 단계가 없어도 부르면 8단계 구분선이 한 번 더 쌓이고 8단계 파일 목록이 비어 보였다");
  assert.match(src, /if \(nx\) questStarted\(\)/, "다음 단계가 있을 때만");
});

test("F-138 문서 지도 — 단계 문서가 아직 없으면 '흐름 따라가기'가 있는 틀을 가리킨다(없는 틀이면 board.js가 멈췄다)", () => {
  const D = require(path.join(__dirname, "../../03-backend/navigator/docmap.js"));
  const m = D.build([{ path: "README.md", text: "# 앱" }, { path: "docs/PRD.md", text: "# PRD" }]);
  const ids = new Set(m.frames.map((f) => f.id));
  assert.ok(m.tour.length > 0);
  for (const s of m.tour) {
    for (const f of s.f) assert.ok(ids.has(f), `투어가 없는 틀(${f})을 가리켜요 — 있는 틀: ${[...ids]}`);
    assert.ok(s.ids.length > 0, "비춰 줄 상자가 하나는 있다");
  }
  const withStages = D.build([{ path: "docs/01-idea/a.md", text: "# a" }, { path: "README.md", text: "# 앱" }]);
  assert.deepEqual(withStages.tour[0].f, ["stages"], "단계 문서가 있으면 전처럼 단계 차례로");
});

test("F-140 앱 — 작업실 · 설정 창을 새로 고치면 처음 열 때의 내용이 아니라 섬이 마지막으로 보낸 내용을 다시 보낸다", () => {
  const m = fs.readFileSync(path.join(__dirname, "../../02-frontend/electron/main.js"), "utf8");
  const load = (m.match(/w\.webContents\.on\("did-finish-load"[^\n]*/) || [""])[0];
  assert.ok(load, "did-finish-load 줄");
  assert.doesNotMatch(load, /opt\.html/, "만들 때 잡은 opt.html이면 새로 고친 뒤 옛 파일 목록 · 옛 단추가 남았다");
  assert.match(load, /w\.floeHtml/);
  const ipc = (m.match(/ipcMain\.on\("floe:win-html"[^\n]*/) || [""])[0];
  assert.match(ipc, /floeHtml = /, "섬이 새로 보낸 내용을 기억한다");
  const reuse = (m.match(/if \(w && !w\.isDestroyed\(\)\) \{ if \(opt\.place\)[^\n]*/) || [""])[0];
  assert.match(reuse, /floeHtml = /, "이미 열린 창을 다시 보일 때 보낸 내용도");
});
