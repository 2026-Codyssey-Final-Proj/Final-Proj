// claude-drafted: 2026-10-29 — 지식 퀘스트 C-47 · C-52(지식 퀘스트 PRD 6절 · 9절 10번, 결정 모음 A-13 · A-14) — 기록을 쓰는 PR의 조건 시험.
//   ① 배운 것은 사람만 쓴다(플로로 · AI가 채우는 길이 없다) ② 쓰기 전에 가린다 ③ 공개 저장소면 저장소마다 처음 한 번 묻는다(github.js visibility · publicok.js)
// 실행: node --test 04-tests/navigator/knowledge-guard.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const BACK = path.join(__dirname, "../../03-backend/navigator"), FRONT = path.join(__dirname, "../../02-frontend/navigator");
const GH = require(path.join(BACK, "github.js"));
const PO = require(path.join(BACK, "publicok.js"));
const D = require(path.join(BACK, "docs.js"));
const Sensitive = require(path.join(BACK, "sensitive.js"));
const read = (p) => fs.readFileSync(p, "utf8");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "floe-kguard-"));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const fake = (table) => (cmd, args) => table[`${cmd} ${args.join(" ")}`] || { found: true, code: 1, out: "" };
const ORIGIN = "git remote get-url origin", VIEW = (repo) => `gh repo view ${repo} --json isPrivate -q .isPrivate`;

test("C-52 공개 저장소 — 푸시할 곳(origin)의 열쇠: 없으면 null, GitHub면 owner/repo로(https · ssh · 토큰 칸 붙은 주소가 같은 열쇠), 아니면 주소로. 주소 · 토큰을 내지 않는다", () => {
  assert.equal(GH.originKey("", fake({})), null, "폴더를 모르면");
  assert.equal(GH.originKey("/p", fake({})), null, "원격이 없으면 묻지 않는다");
  const tok = "ghp_" + "Q7w6".repeat(9);   // secret-check: allow — 시험 안에서만, 실행할 때 만든다
  const keys = ["https://github.com/mina/club.git", "git@github.com:Mina/Club.git", `https://${tok}@github.com/mina/club`].map((u) => GH.originKey("/p", fake({ [ORIGIN]: { found: true, code: 0, out: u } })));
  assert.equal(keys[0].repo, "mina/club"); assert.match(keys[0].key, /^[0-9a-f]{16}$/);
  assert.ok(keys.every((k) => k.key === keys[0].key), "같은 저장소면 같은 열쇠");
  assert.ok(!JSON.stringify(keys[2]).includes(tok), "토큰을 내지 않는다");
  const other = GH.originKey("/p", fake({ [ORIGIN]: { found: true, code: 0, out: "git@gitlab.com:a/b.git" } }));
  assert.equal(other.repo, ""); assert.notEqual(other.key, keys[0].key);
});

test("C-52 공개 범위 — gh에게 origin의 이름으로 묻는다(gh가 고르는 upstream이 아니라). GitHub가 아니거나 gh가 답하지 못하면 모름", () => {
  const o = { key: "k", repo: "mina/club" };
  assert.equal(GH.visibility(o, fake({ [VIEW("mina/club")]: { found: true, code: 0, out: "false" } })), "public");
  assert.equal(GH.visibility(o, fake({ [VIEW("mina/club")]: { found: true, code: 0, out: "true" } })), "private");
  assert.equal(GH.visibility(o, fake({})), "", "gh가 없거나 로그인 전");
  assert.equal(GH.visibility({ key: "k", repo: "" }, () => { throw new Error("gh를 부르면 안 된다"); }), "", "GitHub가 아니면 gh를 부르지 않는다");
});

test("C-52 허락 기억 — 저장소마다 처음 한 번(9절 10번): 열쇠만 이 컴퓨터의 파일(600)에, 깨진 파일이면 다시 묻는다", () => {
  const file = path.join(TMP, "public-ok.json");
  assert.equal(PO.has("bbbb", file), false);
  PO.remember("bbbb", file); PO.remember("bbbb", file);
  assert.equal(PO.has("bbbb", file), true); assert.equal(PO.has("dddd", file), false, "다른 저장소는 처음 한 번 다시");
  assert.deepEqual(JSON.parse(read(file)), { v: 1, keys: ["bbbb"] }, "열쇠만 한 번");
  if (process.platform !== "win32") assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  fs.writeFileSync(file, "{깨짐"); assert.equal(PO.has("bbbb", file), false, "깨진 파일이면 지나가지 않는다");
  assert.match(PO.say("public"), /누구나 볼 수 있어요 — 올리면 지워도 이력에 남아요/); assert.match(PO.say(""), /공개인지 확인하지 못했어요/);
  assert.equal(PO.fileOf({ NAV_USAGE_FILE: "/x/usage.json" }), "/x/usage-public-ok.json");
});

test("C-47 · C-52 배운 것 · 바뀐 뜻도 쓰기 전에 가린다(공개 저장소일 수 있다)", () => {
  const key = "sk-ant-" + "a1B2".repeat(10);   // secret-check: allow — 시험 안에서만
  const it = (name, line) => ({ name, lines: [line], by: "me" });
  const results = { 0: { title: "t", passed: "2026-10-29", learned: `열쇠 ${key}를 넣었더니 됐다`, items: [it("다 만들면 무엇이 달라지는지 쓰기", "모인다")] },
    1: { title: "t", passed: "2026-10-29", learned: "", goal: { changed: `열쇠 ${key}로 출석까지` }, items: [it("왜", "헷갈려서")] } };
  const all = D.files({ topic: "t", idea: "", results, redact: Sensitive.redact }).map((f) => f.text).join("\n");
  assert.ok(!all.includes(key), "열쇠가 문서에 남지 않는다");
  assert.match(all, /## 배운 것\n\n> 열쇠 .+를 넣었더니 됐다/);
});

test("C-47 배운 것은 사람만 쓴다 — 화면은 관문의 글 칸(learned)에서만 받고, AI 묻는 글 · 답 모양 어디에도 배운 것 칸이 없다", () => {
  const app = read(path.join(FRONT, "app.js"));
  assert.deepEqual(app.match(/learnDraft = [^;]+;/g), ['learnDraft = "";', "learnDraft = t.value.slice(0, 400);"], "글 칸에서 받고 · 관문을 지나면 비운다 — 다른 곳에서 채우지 않는다");
  assert.equal((app.match(/learnDraft/g) || []).length, 4, "learnDraft가 나오는 곳 넷(보이기 · 읽기 · 비우기 · 글 칸) — 새로 쓰는 곳이 생기면 이 시험이 깨져 리뷰를 받는다(set · Object.assign 모양도)");
  assert.equal((app.match(/\blearned, \.\.\./g) || []).length, 1, "단계 결과에 넣는 곳은 advance 한 곳");
  assert.equal((app.match(/\blearned: (?!\[\])/g) || []).length, 0, "다른 곳에서 단계 결과의 learned를 채우지 않는다(st.learned: []는 배운 말 — 다른 칸)");
  assert.match(app, /passed: ymd\(\), learned, \.\.\.\(goal && s\.n >= 1 \? \{ goal \} : \{\}\)/);
  for (const f of ["navigator.js", "provider.js", "quest.js", "plan.js", "build.js"]) assert.ok(!/learned/.test(read(path.join(BACK, f))), `${f} — AI 쪽에 배운 것 칸이 없다`);
  const srv = read(path.join(BACK, "server.js"));
  assert.ok(!/learned/.test(srv.replace(/^.*(LEARNED_MAX|v\.learned|지식 퀘스트 C-47).*$/gm, "")), "서버는 받은 것을 검사해 넘기기만 한다");
});

test("C-52 화면 — /api/docs가 why 'public'으로 막으면 한 번 더 묻는 카드(올릴게요 · 나중에), 올릴게요면 publicOk와 함께 다시 보낸다. API.md 3-23에 적었다", () => {
  const app = read(path.join(FRONT, "app.js")), api = read(path.join(BACK, "API.md"));
  assert.match(app, /r\.why === "public"/); assert.match(app, /phase: "public"/); assert.match(app, /"ship-public": \(\) => shipGo\(true\)/);
  assert.match(app, /publicOk: true/);
  assert.match(api, /why: "public"/); assert.match(api, /publicOk/);
});
