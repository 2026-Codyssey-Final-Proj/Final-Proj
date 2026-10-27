// claude-drafted: 2026-10-27 — C-43 md 보기(md-view.js): 밖의 글을 안전하게 HTML로. 코드보다 먼저 썼다(code.md 1번)
// 실행: node --test 04-tests/navigator/md-view.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../../03-backend/navigator/md-view.js");

test("제목 · 문단 · 굵게 · 기울임 · 코드 · 링크 — 글은 모두 가려지고(태그가 살아나지 않음) 링크는 http(s)만 새 창으로", () => {
  const h = M.toHtml("# 제목\n\n글 **굵게** *기울임* `코드` [문서](https://example.com/a) <script>alert(1)</script>\n\n## 둘째");
  assert.match(h, /^<h1>제목<\/h1>\n<p>글 <b>굵게<\/b> <i>기울임<\/i> <code>코드<\/code> <a href="https:\/\/example.com\/a" target="_blank" rel="noopener noreferrer">문서<\/a> &lt;script&gt;alert\(1\)&lt;\/script&gt;<\/p>\n<h2>둘째<\/h2>$/);
  assert.ok(!h.includes("<script"), "스크립트는 글로만");
  assert.equal(M.toHtml("[x](javascript:alert(1))"), "<p>x <small>(javascript:alert(1))</small></p>", "http(s)가 아닌 주소는 글로");
  assert.equal(M.toHtml('<img src=x onerror="alert(1)">'), "<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>");
  assert.equal(M.toHtml(""), ""); assert.equal(M.toHtml(null), "");
});

test("목록(- · 1. · 할 일 칸) · 인용 · 코드 울타리 · 표 · 가로줄 · 주석", () => {
  assert.equal(M.toHtml("- 하나\n- **둘**\n\n1. 첫\n2) 둘"), "<ul><li>하나</li><li><b>둘</b></li></ul>\n<ol><li>첫</li><li>둘</li></ol>");
  assert.equal(M.toHtml("- [ ] 할 일\n- [x] 한 일"), '<ul><li class="task"><span class="ck">☐</span> 할 일</li><li class="task done"><span class="ck">☑</span> 한 일</li></ul>');
  assert.equal(M.toHtml("> 인용 *글*\n> 둘째"), "<blockquote><p>인용 <i>글</i> 둘째</p></blockquote>");
  assert.equal(M.toHtml("```js\nconst a = 1 < 2; // **아님**\n```"), '<pre class="mdv-code" data-lang="js"><code>const a = 1 &lt; 2; // **아님**</code></pre>');
  assert.equal(M.toHtml("| 이름 | 값 |\n|---|---|\n| a | **b** |\n| c |"), "<table><thead><tr><th>이름</th><th>값</th></tr></thead><tbody><tr><td>a</td><td><b>b</b></td></tr><tr><td>c</td><td></td></tr></tbody></table>");
  assert.equal(M.toHtml("위\n\n---\n\n아래"), "<p>위</p>\n<hr>\n<p>아래</p>");
  assert.equal(M.toHtml("<!-- claude-drafted: x -->\n글"), "<p>글</p>", "주석은 보이지 않는다");
  assert.equal(M.toHtml("한 줄\n이어진 줄"), "<p>한 줄 이어진 줄</p>", "빈 줄 없이 이어지면 한 문단");
});
