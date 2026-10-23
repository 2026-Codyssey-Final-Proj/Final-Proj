// claude-drafted: 2026-10-23 — 내 작업 책은 README를 받아 와 보여 주기만(C-26, 이재엽 "책의 작업들은 readme 에서 작업해서 우리가 그 내용들을 받아서 오고 책에서 보여주는 역할만 수행하면 돼").
// README.md 글을 책으로 나누는 순수 함수 — # 제목 · 그 아래 한 줄 · '## 버전' 줄 · ## 마다 한 장. 고치지 않고 나누기만 한다(고치는 곳은 README).
// 서버(GET /api/readme, API.md 3-18)가 연결한 폴더의 README를 읽어 쓰고, 화면(app.js 책 탭)은 연습 예시(EXAMPLE)에 쓴다. 시험: 04-tests/navigator/readme-book.test.js
(function (root) {
  const MAX = 200_000, MAX_CHAPTERS = 60;   // 너무 긴 README는 잘라 읽는다 [제안 2026-10-23]
  const VERSION_TITLES = ["버전", "버전 기록"];
  const VERSION_LINE = /^[-*]\s*(V\.\d+)\s*·\s*(\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/;
  const empty = () => ({ title: "", intro: "", versions: [], chapters: [], cut: false });

  function parse(text) {
    if (typeof text !== "string" || !text) return empty();
    const book = empty();
    book.cut = text.length > MAX;
    const lines = (book.cut ? text.slice(0, MAX) : text).replace(/\r\n/g, "\n").split("\n");
    let fence = false, cur = null, intro = [], inVersions = false;
    for (const line of lines) {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence;
      const h1 = !fence && /^#\s+(.+)/.exec(line), h2 = !fence && /^##\s+(.+)/.exec(line);
      if (h1 && !book.title && !cur && !inVersions) { book.title = h1[1].trim(); continue; }
      if (h2) {
        const t = h2[1].trim();
        inVersions = VERSION_TITLES.includes(t);
        cur = null;
        if (!inVersions && book.chapters.length >= MAX_CHAPTERS) book.cut = true;
        else if (!inVersions) { cur = { id: `ch-${book.chapters.length + 1}`, title: t, body: [] }; book.chapters.push(cur); }
        continue;
      }
      if (inVersions) { const m = VERSION_LINE.exec(line.trim()); if (m) book.versions.push({ v: m[1], date: m[2], title: m[3].trim() }); continue; }
      if (cur) cur.body.push(line);
      else if (!book.chapters.length && book.title) intro.push(line);
    }
    book.intro = intro.join("\n").trim();
    for (const c of book.chapters) c.body = c.body.join("\n").trim();
    return book;
  }

  // 연습 예시 — 동아리 행사 등록 앱(scenario.js의 가상 사용자)이 두 바퀴 돈 README. 진짜 README가 없을 때 책 탭이 보여 준다
  const EXAMPLE = [
    "# 동아리 행사 등록 앱",
    "동아리 회장이 행사를 올리면 부원이 신청하는 앱 — 연습 예시예요",
    "",
    "## 버전",
    "- V.3 · 2026-10-26 · 꼭 필요한 기능 셋",
    "- V.2 · 2026-10-25 · 누가 쓰는지 적기",
    "- V.1 · 2026-10-24 · 어떤 불편을 풀지 한 문장",
    "",
    "## 1단계 · 어떤 불편을 풀지 한 문장",
    "생각: 회장이 신청을 카톡으로 하나하나 받아서 자주 빠뜨린다.",
    "한 일: 불편을 한 문장으로 적었다 — \"회장이 신청을 손으로 모으다 빠뜨린다.\"",
    "정한 것: 신청은 앱에서만 받는다.",
    "배운 말: 범위 — 이번에 만들 것과 안 만들 것의 경계",
    "다음 할 일: 누가 쓰는지 적기",
    "",
    "## 1단계 · 누가 쓰는지 적기",
    "생각: 회장 한 명과 부원 서른 명 정도.",
    "한 일: 쓰는 사람을 둘로 나눴다 — 행사를 올리는 사람, 신청하는 사람.",
    "정한 것: 처음에는 동아리 하나만.",
    "다음 할 일: 꼭 필요한 기능 고르기",
    "",
    "## 2단계 · 꼭 필요한 기능 셋",
    "생각: 다 만들면 시간이 모자란다.",
    "한 일: 행사 올리기 · 신청하기 · 마감 알림, 셋만 골랐다.",
    "정한 것: 결제는 이번에 안 만든다.",
    "배운 말: 우선순위 — 무엇을 먼저 할지 정한 순서",
    "다음 할 일: 화면 하나를 그려 보기",
  ].join("\n");

  const api = { parse, EXAMPLE, MAX, MAX_CHAPTERS };
  root.NavReadme = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
