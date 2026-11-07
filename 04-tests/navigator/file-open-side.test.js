// claude-drafted: 2026-11-07 — 임유정 "퀘스트창이 열린 상태에서 플로로가 전체 대화창일 때 왼쪽 사이드바에서 문서를 열면
//   플로로 대화창이 우측 사이드바 형태로 크기가 줄어들었으면 좋겠어". 섬이 가운데(st.islBig)면 작업실의 문서 칸(.wbody)이 CSS로 숨어
//   문서를 열어도 보이지 않았다 — 문서가 열리면 섬은 옆 칸으로.
// 실행: node --test 04-tests/navigator/file-open-side.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const a = fs.readFileSync(path.join(__dirname, "../../02-frontend/navigator/app.js"), "utf8");

function fnSrc(name) {
  const at = a.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(at >= 0, `${name}를 찾지 못했어요`);
  let i = a.indexOf(") {", at) + 2, d = 0;
  for (; i < a.length; i++) { if (a[i] === "{") d++; else if (a[i] === "}" && --d === 0) break; }
  return a.slice(at, i + 1);
}
const make = (src, name, env) => new Function(...Object.keys(env), `${src}; return ${name};`)(...Object.values(env));
const reply = (r) => async () => ({ json: async () => r });
const setup = (fetch, extra = {}) => {
  const st = { files: { list: [{ path: "docs/a.md", name: "a.md" }] }, openFiles: [], fileSel: -1, qtab: "quest", islBig: true, ...extra };
  return { st, openFile: make(fnSrc("openFile"), "openFile", { st, render() {}, say() {}, fetch }) };
};

test("섬이 가운데일 때 왼쪽 칸에서 문서를 새로 열면 — 문서 칸이 보이고 섬은 옆 칸으로", async () => {
  const { st, openFile } = setup(reply({ ok: true, path: "docs/a.md", name: "a.md", kind: "md", text: "글", mtime: 1 }));
  await openFile(0);
  assert.equal(st.qtab, "file");
  assert.equal(st.islBig, false);
});

test("섬이 저절로 가운데(islBig null)여도 — 문서를 열면 옆 칸으로", async () => {
  const { st, openFile } = setup(reply({ ok: true, path: "docs/a.md", name: "a.md", kind: "md", text: "글", mtime: 1 }), { islBig: null });
  await openFile(0);
  assert.equal(st.islBig, false);
});

test("이미 연 문서를 왼쪽 칸에서 다시 눌러도 — 섬은 옆 칸으로", async () => {
  const { st, openFile } = setup(async () => assert.fail("이미 열린 파일은 다시 받지 않는다"),
    { openFiles: [{ path: "docs/a.md", name: "a.md" }] });
  await openFile(0);
  assert.equal(st.fileSel, 0);
  assert.equal(st.islBig, false);
});

test("문서를 열지 못하면 — 섬은 가운데 그대로(보일 문서가 없으니)", async () => {
  const { st, openFile } = setup(reply({ ok: false, reason: "너무 커요" }));
  await openFile(0);
  assert.equal(st.qtab, "quest");
  assert.equal(st.islBig, true);
});
