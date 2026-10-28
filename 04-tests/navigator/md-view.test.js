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
  assert.equal(M.toHtml("<!-- 닫지 않음\n글"), "<p>&lt;!-- 닫지 않음 글</p>", "닫는 표시가 없으면 글로 — 나머지가 사라지지 않는다");
  assert.equal(M.toHtml("한 줄\n이어진 줄"), "<p>한 줄 이어진 줄</p>", "빈 줄 없이 이어지면 한 문단");
});

// C-53(2026-10-28, 이재엽 버튼 "서식 단추는 만든다"): 문서 도구 줄의 서식 단추(제목 · 굵게 · 목록 · 넣기 · 머리말)는 원문에 마크다운 기호를 넣는다 — 순수 함수 format(text, start, end, kind) → { text, start, end }.
//   앱의 작업실 창(win.js)과 브라우저 판(app.js)이 같은 함수로 글 칸의 고른 자리에 넣는다
test("format — 제목은 그 줄 앞의 '## '을 켜고 끄고, 굵게는 고른 글을 **로 감싸고(없으면 가운데에 커서), 목록은 고른 줄마다 '- ', 넣기는 [글](주소)에서 주소를 고른 채, 머리말은 맨 위에 한 번만", () => {
  assert.deepEqual(M.format("기능 정리\n둘째 줄", 2, 2, "h2"), { text: "## 기능 정리\n둘째 줄", start: 5, end: 5 }, "제목 켜기 — 커서는 그 줄 안에서 3칸 뒤");
  assert.deepEqual(M.format("## 기능 정리\n둘째 줄", 5, 5, "h2"), { text: "기능 정리\n둘째 줄", start: 2, end: 2 }, "다시 누르면 끄기");
  assert.deepEqual(M.format("가 나 다", 2, 3, "bold"), { text: "가 **나** 다", start: 4, end: 5 }, "고른 글을 감싼다 — 고른 자리는 그대로 그 글");
  assert.deepEqual(M.format("가 나", 3, 3, "bold"), { text: "가 나****", start: 5, end: 5 }, "고른 것이 없으면 ** ** 사이에 커서");
  assert.deepEqual(M.format("하나\n둘\n셋", 0, 6, "list"), { text: "- 하나\n- 둘\n- 셋", start: 0, end: 12 }, "고른 줄마다 '- '");
  assert.deepEqual(M.format("- 하나\n- 둘", 0, 8, "list"), { text: "하나\n둘", start: 0, end: 4 }, "모두 목록이면 끈다");
  assert.deepEqual(M.format("문서 보기", 0, 2, "link"), { text: "[문서](주소) 보기", start: 5, end: 7 }, "넣기 — 주소 자리를 고른 채 두어 바로 적게");
  const f = M.format("# 제목\n글", 3, 3, "front");
  assert.match(f.text, /^---\ntitle: 제목\ndate: \d{4}-\d{2}-\d{2}\n---\n\n# 제목\n글$/, "머리말 — 첫 제목을 title로, 날짜는 오늘");
  assert.deepEqual(M.format(f.text, 0, 0, "front").text, f.text, "머리말이 있으면 그대로");
  assert.deepEqual(M.format("가", 0, 0, "모르는 것"), { text: "가", start: 0, end: 0 }, "모르는 종류는 그대로");
});
test("outline — 글의 제목 줄(# ~ ###)을 차례로, 빈 절(제목 다음에 글이 없는 것)은 empty로 — 오른쪽 칸 '이 문서'의 목차 · 칸 채움", () => {
  assert.deepEqual(M.outline("# 3단계\n\n## 기능 문장\n1. 가\n\n## 나온 곳\n\n## 막을 일\n글\n### 깊이\n"), [
    { level: 1, text: "3단계", line: 1, empty: false }, { level: 2, text: "기능 문장", line: 3, empty: false }, { level: 2, text: "나온 곳", line: 6, empty: true }, { level: 2, text: "막을 일", line: 8, empty: false }, { level: 3, text: "깊이", line: 10, empty: true }]);
  assert.deepEqual(M.outline("```\n# 코드 안\n```\n글"), [], "코드 울타리 안의 #은 제목이 아니다");
});
