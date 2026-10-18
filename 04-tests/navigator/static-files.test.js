// claude-drafted: 2026-10-18 — 서버(server.js)가 내주는 화면이 부르는 파일을 서버가 모두 내주는가.
// 2026-10-18에 화면 빈칸 작업이 새 규칙 파일 다섯을 더했는데 server.js의 STATIC 목록에 없어서, `node server.js`로 열면 화면이 멈출 뻔했다.
// dive.js·dive.css(내비게이터와 서고가 같이 씀)도 같은 이유로 서버에서는 안 불려 오고 있었다. 이 시험이 다시는 조용히 지나가지 않게 막는다.
// 실행: node --test 04-tests/navigator/static-files.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { FILES } = require("../../03-backend/navigator/server.js");
const BACK = path.join(__dirname, "../../03-backend/navigator");

// 화면이 부르는 이 컴퓨터의 파일 — <script src> · <link href>. 주석 안과 밖 주소(http·https·//·data:)는 빼다
const localRefs = (html) => [...html.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1]).filter((u) => !/^(?:[a-z]+:|\/\/|#)/i.test(u));

test("서버가 내주는 화면마다, 그 화면이 부르는 파일(script·link)을 서버가 모두 내준다", () => {
  const pages = Object.entries(FILES).filter(([, [, type]]) => type === "text/html");
  assert.ok(pages.length >= 5, `화면이 너무 적다: ${pages.length}`);
  const missing = [];
  for (const [url, [file]] of pages) {
    const html = fs.readFileSync(path.resolve(BACK, file), "utf8");
    for (const ref of localRefs(html)) {
      const want = new URL(ref, `http://127.0.0.1${url}`).pathname;
      if (!FILES[want]) missing.push(`${url} → ${ref} (${want})`);
    }
  }
  assert.deepEqual(missing, []);
});

test("서버가 내주는 파일은 모두 실제로 있다", () => {
  for (const [url, [file]] of Object.entries(FILES)) assert.ok(fs.existsSync(path.resolve(BACK, file)), `${url} → ${file}`);
});

test("시험 도구: 화면이 부르는 파일을 제대로 골라낸다(주석·밖 주소는 뺀다)", () => {
  const html = `<link rel="stylesheet" href="a.css"><script src="../b.js"></script><!-- <script src="c.js"></script> -->
    <link href="https://fonts.example/x.css" rel="stylesheet"><script src="//cdn.example/y.js"></script><link rel="icon" href="data:,">`;
  assert.deepEqual(localRefs(html), ["a.css", "../b.js"]);
});
