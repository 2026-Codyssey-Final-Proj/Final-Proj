// claude-drafted: 2026-10-20 — C-15 플로로에게 먹이 주기(이재엽 "파일을 오버레이에 주면 … 분석을 시작하는거야 어떤 내용인지 확인하고 구간을 나눠야겠네 개인적인 일인지 혹시나 비밀번호는 없는지
// 그리고 어떤 내용이 주제인지 그런것들을 확인하고 정리해야해 그렇게 기능을 한곳에 통합시켜줘", 버튼 "파일 + 붙여 넣기" · "그 구간만 빼고 보냄"). 넘김 문서 fable-handoff-2026-10-20-feed.md 3절 1번 [제안].
// 받은 글(파일 · 붙여 넣기)을 AI에게 보내기 **전에** 이 컴퓨터에서만 — 구간으로 나누고(split), 구간마다 비밀값 · 개인적인 일 · 주제를 표시하고(check), 빠지지 않은 구간만 이어 붙인다(pack).
// 비밀값 · 개인적인 일 구간의 글은 AI로 보내는 글에 들어가지 않는다 — pack이 돌려주는 left에는 수 · 주제 · 까닭만 있고 글은 없다(보안 기준 6-1 · 6-3).
// 비밀값 찾기는 sensitive.js(scan)를 그대로 쓴다. 브라우저(window.NavFeed) · Node(require — 04-tests/navigator/feed.test.js) 둘 다.
(function (root) {
  const Sensitive = typeof module !== "undefined" && module.exports ? require("./sensitive.js") : root.NavSensitive;
  const MAX_FILE = 1_000_000;                      // 1MB [제안]
  const ACCEPT = [".md", ".txt", ".markdown"];     // 글 파일만 [제안] — 다른 파일은 "아직 글 파일만 먹을 수 있어요"
  const TOPIC_MAX = 40;
  // 제목 줄 — 마크다운 머리(#), 번호(1. · 1)), 밑줄 제목은 다루지 않는다
  //   끝의 # · 공백은 headText가 — 정규식으로 떼면(.+?\s*#*\s*$) 공백이 길 때 세제곱으로 느려졌다(F-104-6). 1: 머리 글 · 3: 번호 글
  const HEAD = /^\s{0,3}(?:#{1,6}\s+(.+)|(\d{1,2})[.)]\s+(.+))$/;
  const headText = (s) => { const t = String(s).trimEnd(); let e = t.length; while (e > 1 && t[e - 1] === "#") e--; return (e < t.length ? t.slice(0, e) : t).trim(); };
  // 개인적인 일 — 이메일 · 전화번호 · IP(sensitive.js의 mask)와 흔한 말 [제안]. 사람이 구간마다 고칠 수 있으니 맞히는 비율은 미정(넘김 문서 5절)
  const PERSONAL = /(일기|가족|연애|병원|진료|월급|연봉|계좌|통장|집 ?주소|개인적인|사적인)/;
  const WHY = { secret: "이건 못 먹어요 — 비밀번호 같아요", personal: "이건 안 먹을게요 — 개인적인 일 같아요" };
  // 종류 다섯(FR-15 더함 2026-10-20 — C-8의 분류): 빠지지 않은 구간마다 하나. 글의 말로 고르고(이 컴퓨터에서, AI 없이 [제안 — 요구서 C-15 ⑥]) 사람이 고친다. 모르면 참고
  const KINDS = [["req", "요구"], ["decision", "결정"], ["learned", "배운 것"], ["todo", "할 일"], ["ref", "참고"]];
  const KIND_RULES = [
    ["todo", /(^|\n)\s*(-\s*\[[ x]\]|☐|TODO|할 일)|(해야|하기)\s*$|(붙이기|만들기|넣기|고치기|정하기)\s*(\n|$)/m],
    ["decision", /(정했|정함|로 한다|로 했|결정|하기로|골랐|고르기로|확정)/],
    ["learned", /(배웠|배운|알게|깨달|인사이트|느낀|느꼈|배움)/],
    ["req", /(하면|한다\.?|해요\.?|필요|기능|화면|사용자|회원|시스템|앱은)/],
  ];
  const INBOX_MAX = 2000;

  const str = (v) => (typeof v === "string" ? v : "");
  const cut = (t) => (t.length > TOPIC_MAX ? `${t.slice(0, TOPIC_MAX - 1)}…` : t);
  const firstLine = (t) => str(t).split(/\r?\n/).map((l) => l.trim()).find(Boolean) || "";

  // 글 → 구간 [{ title, text }]. 제목 줄이 있으면 제목마다, 없으면 빈 줄 문단마다. 제목 앞의 글은 '시작' 구간. 빈 글이면 []
  function split(text) {
    const lines = str(text).replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let cur = null;
    const push = () => { if (cur && (cur.title || cur.lines.some((l) => l.trim()))) out.push({ title: cur.title, text: cur.lines.join("\n").trim() }); cur = null; };
    const hasHead = lines.some((l) => HEAD.test(l));
    if (hasHead) {
      for (const l of lines) {
        const m = HEAD.exec(l);
        if (m) { push(); cur = { title: m[1] != null ? headText(m[1]) : (m[3] || "").trim(), lines: [] }; continue; }
        if (!cur) cur = { title: "", lines: [] };
        cur.lines.push(l);
      }
      push();
    } else {
      for (const l of lines) {
        if (!l.trim()) { push(); continue; }
        if (!cur) cur = { title: "", lines: [] };
        cur.lines.push(l);
      }
      push();
    }
    return out.filter((s) => s.text || s.title);
  }

  // 구간 하나 → { secret, personal, topic, why }. secret: 비밀값 모양(보내면 안 됨), personal: 개인적인 일 같음, topic: 제목 또는 첫 줄 앞부분
  function check(section) {
    const title = str(section && section.title).trim(), text = str(section && section.text);
    const whole = `${title}\n${text}`;
    const scan = Sensitive && typeof Sensitive.scan === "function" ? Sensitive.scan(whole) : { findings: [], blocked: false };
    const secret = scan.findings.some((f) => f.severity === "block");
    const personal = !secret && (scan.findings.some((f) => f.severity === "mask") || PERSONAL.test(whole));
    const topic = cut(title || firstLine(text) || "(빈 구간)");
    return { secret, personal, topic, why: secret ? WHY.secret : personal ? WHY.personal : "" };
  }

  // 구간들과 사람의 표시(marks[i]: "keep" | "skip" | 없음)로 보낼 글을 만든다. 표시가 없으면 check대로(비밀값 · 개인적인 일은 뺀다).
  // 돌려주는 것: { text, kept, left: [{ i, topic, why }] } — 빠진 구간의 글은 어디에도 넣지 않는다
  function pack(sections, marks = []) {
    const list = Array.isArray(sections) ? sections : [];
    const parts = [], left = [];
    let kept = 0;
    list.forEach((s, i) => {
      const c = check(s), mark = Array.isArray(marks) ? marks[i] : marks && marks[i];
      const skip = mark === "skip" || (mark !== "keep" && (c.secret || c.personal));
      if (skip) { left.push({ i, topic: c.topic, why: c.why || "빼 달라고 하셨어요" }); return; }
      kept++;
      parts.push([s.title ? `# ${s.title}` : "", str(s.text)].filter(Boolean).join("\n"));
    });
    return { text: parts.join("\n\n").trim(), kept, left };
  }
  // 파일을 먹을 수 있나 — 이름(.md · .txt)과 크기. 돌려주는 것: "" (괜찮음) 또는 쉬운 말 이유
  function accept(name, size) {
    const n = str(name).toLowerCase();
    if (!ACCEPT.some((ext) => n.endsWith(ext))) return "아직 글 파일(.md · .txt)만 먹을 수 있어요";
    if (Number(size) > MAX_FILE) return "너무 커요 — 1MB 아래 파일만 먹을 수 있어요";
    return "";
  }

  // 서버 없이(FR-10) 보일 예시 먹이 — 구간 셋: 주제 · 개인적인 일 · 비밀번호 모양(진짜 값이 아닌 자리표시)
  const EXAMPLE = [
    "# 동아리 행사 등록 앱",
    "회원이 행사를 보고 신청하는 앱을 만들고 있어요. 지금은 단톡방으로 신청을 받아서 누가 신청했는지 놓쳐요.",
    "행사 목록 · 신청서 · 마감 알림 세 화면이 필요해요.",
    "",
    "# 오늘 일기",
    "오늘은 가족이랑 저녁을 먹었다. 개인적인 일이라 앱이랑은 상관없다.",
    "",
    "# 서버 메모",
    "테스트 서버 비밀번호: 예시용-자리표시",
  ].join("\n");

  // 구간 하나 → 종류 key. 제목 + 글의 말로 차례로 본다(할 일 → 결정 → 배운 것 → 요구), 아무것도 아니면 참고
  function guessKind(section) {
    const whole = `${str(section && section.title)}\n${str(section && section.text)}`;
    if (/^\s*$/.test(whole)) return "ref";
    for (const [k, re] of KIND_RULES) if (re.test(whole)) return k;
    return "ref";
  }
  const kindLabel = (k) => (KINDS.find(([key]) => key === k) || KINDS[KINDS.length - 1])[1];
  // 확인하면 책에 넣기 전 '확인할 먹이'로 — 빠지지 않은 구간만 {topic, kind, text}. 빠진 구간의 글은 없다. kinds[i]: 사람이 고친 종류(없으면 guessKind)
  function inbox(sections, marks = [], kinds = []) {
    const list = Array.isArray(sections) ? sections : [];
    const out = [];
    list.forEach((s, i) => {
      const c = check(s), mark = Array.isArray(marks) ? marks[i] : undefined;
      if (mark === "skip" || (mark !== "keep" && (c.secret || c.personal))) return;
      const k = Array.isArray(kinds) && KINDS.some(([key]) => key === kinds[i]) ? kinds[i] : guessKind(s);
      out.push({ topic: c.topic, kind: k, text: str(s.text).slice(0, INBOX_MAX) });
    });
    return out;
  }

  const api = { MAX_FILE, ACCEPT, TOPIC_MAX, WHY, KINDS, INBOX_MAX, split, check, pack, accept, guessKind, kindLabel, inbox, EXAMPLE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NavFeed = api;
})(typeof window !== "undefined" ? window : globalThis);
