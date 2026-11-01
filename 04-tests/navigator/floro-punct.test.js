// claude-drafted: 2026-11-01 — 임유정 "문장이 끝나면 꼭 마침표(.)를 찍고, 띄어쓰기를 해 … 플로로가 말하는 작업환경 부분만"(F-113)
// 플로로 말풍선의 글: ① 지금 말(title · sub · foot · banner)의 글자 문장은 문장부호로 끝난다 ② 안내(say) · 말풍선은 끝을 한 번 더 맞춘다(endDot)
// ③ 저장한 대화를 글자로 뽑을 때(textOf) 제목과 아랫줄 사이에 띄어쓰기 — "…드릴까요?최근 …"처럼 붙지 않게
// 실행: node --test 04-tests/navigator/floro-punct.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");

const DIR = path.join(__dirname, "../../02-frontend/navigator/app/");
const parts = fs.readdirSync(DIR).filter((f) => f.endsWith(".js")).map((f) => [f, fs.readFileSync(DIR + f, "utf8")]);
const all = parts.map(([, s]) => s).join("\n");

// title: · sub: · foot: · banner: 다음의 따옴표 글(삼항이면 둘까지) — ${…} 안의 따옴표 글은 그 안에서 끝난다
function bareEnds(src) {
  const out = [];
  src.split("\n").forEach((l, i) => {
    const re = /\b(title|sub|banner|foot):/g; let m;
    while ((m = re.exec(l))) {
      let j = m.index + m[0].length, seen = 0;
      while (j < l.length && seen < 3) {
        const c = l[j];
        if (c === "," && seen) break;
        if (c === '"' || c === "`") {
          let k = j + 1, depth = 0;
          while (k < l.length) { if (l[k] === "\\") { k += 2; continue; } if (c === "`" && l[k] === "$" && l[k + 1] === "{") depth++; if (c === "`" && l[k] === "}" && depth) depth--; if (l[k] === c && !depth) break; k++; }
          const t = l.slice(j + 1, k); seen++;
          const end = t.replace(/\$\{[^}]*\}\s*$/, "").trim();
          if (/[가-힣]{2}/.test(t) && /[가-힣]$/.test(end) && !/\$\{dots\}$/.test(t)) out.push(`${i + 1}: …${t.slice(-40)}`);
          j = k + 1; continue;
        }
        j++;
      }
    }
  });
  return out;
}

test("플로로의 지금 말(title · sub · foot · banner) — 글자로 쓴 문장은 . ? ! 로 끝난다('…'가 움직이는 기다림 말은 빼고)", () => {
  for (const [f, s] of parts) assert.deepEqual(bareEnds(s), [], `${f}에 문장부호 없이 끝나는 플로로 말`);
  assert.match(all, /관문 앞에서 멈췄어요\.`/, "스크린샷의 그 말");
});

test("endDot — 한글로 끝나면 마침표, 이미 문장부호 · 따옴표 · 괄호 · 태그로 끝나면 그대로. 안내(say)와 말풍선의 제목 · 아랫줄이 거친다", () => {
  const src = /const endDot = (\(s\) => \{[^\n]*\});/.exec(all);
  assert.ok(src, "00-base.js에 endDot");
  const endDot = eval(src[1]);
  assert.equal(endDot("멈췄어요"), "멈췄어요.");
  assert.equal(endDot("멈췄어요  "), "멈췄어요.");
  for (const t of ["알려 드릴까요?", "다시 같이 봐요!", "됐어요.", "살펴보고 있어요…", "새 줄 “고침”", "(docs/idea.md)", "<b>굵게</b>", "V.2"]) assert.equal(endDot(t), t);
  assert.equal(endDot("마쳤습니다"), "마쳤습니다.");
  // 할 일 이름 같은 제목은 문장이 아니다 — 마침표를 붙이지 않는다(새 맥락 리뷰 2026-11-02: "Ⅰ. 꼭 필요한 기능 정리하기."가 됐다)
  for (const t of ["Ⅰ. 꼭 필요한 기능 정리하기", "지금 할 일 · 기능 목록", "1단계 · 무엇을 만들지 정하기"]) assert.equal(endDot(t), t);
  assert.match(all, /<h2 class="mc-title" aria-live="polite">\$\{endDot\(v\.title\)\}<\/h2>/, "다른 카드 모양도 같이");
  assert.match(all, /logMsg\("floro", esc\(endDot\(text\)\)\)/, "say");
  assert.match(all, /<b class="say">\$\{endDot\(v\.title\)\}<\/b>\$\{v\.sub \? `<span class="mc-sub">\$\{endDot\(v\.sub\)\}<\/span>`/, "말풍선");
});

test("textOf — 제목(.say)과 아랫줄(.mc-sub) 사이에 띄어쓰기, br은 줄바꿈. 되살릴 때(fromTurn) 줄바꿈은 br로", () => {
  assert.match(all, /const textOf = \(html\) => \{[^\n]*replace\(\/<br\\s\*\\\/\?>\/gi, "\\n"\)[^\n]*querySelectorAll\("\.say, \.mc-sub, \.mc-hold, p, li"\)\.forEach\(\(e\) => e\.after\(" "\)\)/);
  assert.match(all, /\{ who: t\.who, n: t\.stage, at: t\.at, html: esc\(t\.text\)\.replace\(\/\\n\/g, "<br>"\) \}/);
});
