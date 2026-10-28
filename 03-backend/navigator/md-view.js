// claude-drafted: 2026-10-27 — C-43 파일 보기(이재엽 버튼 "읽기 + 고치기"): md를 보기 좋게 보이기 위한 작은 변환기. 순수 함수 — 밖의 글을 받으므로 **모든 글은 HTML로 가린다**(태그 · 스크립트가 살아나지 않게).
//   제목(#~######) · 목록(- · * · 1.) · 인용(>) · 코드 울타리(```) · 표(| |) · 가로줄 · 굵게(**) · 기울임(*) · 코드(`) · 링크([글](주소) — http(s)만 새 창(앱은 기본 브라우저, main.js), 그 밖의 주소는 글로 보인다)
//   시험: 04-tests/navigator/md-view.test.js. 섬(index.html)이 읽어 작업실 창에 보낸다
(function (root) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const SAFE_URL = /^https?:\/\/[^\s"'<>]+$/i;
  function inline(s) {
    let out = "", i = 0;
    const parts = [];
    // 코드(`…`)는 먼저 떼어 둔다 — 안의 * · [는 그대로
    const codeRe = /`([^`\n]+)`/g; let m, last = 0;
    while ((m = codeRe.exec(s))) { parts.push(["t", s.slice(last, m.index)], ["c", m[1]]); last = m.index + m[0].length; }
    parts.push(["t", s.slice(last)]);
    for (const [k, v] of parts) {
      if (k === "c") { out += `<code>${esc(v)}</code>`; continue; }
      let t = esc(v);
      t = t.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (all, text, href) => (SAFE_URL.test(href) ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>` : `${text} <small>(${esc(href)})</small>`));
      t = t.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<i>$2</i>").replace(/~~([^~\n]+)~~/g, "<s>$1</s>");
      out += t;
    }
    return out;
  }
  const row = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const isSep = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
  function toHtml(text) {
    const lines = String(text == null ? "" : text).replace(/\r\n?/g, "\n").split("\n");
    const out = []; let i = 0, para = [];
    const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
    while (i < lines.length) {
      const line = lines[i];
      const fence = /^\s*(```|~~~)\s*([A-Za-z0-9_-]*)/.exec(line);
      if (fence) { flush(); const code = []; i++; while (i < lines.length && !/^\s*(```|~~~)/.test(lines[i])) code.push(lines[i++]); i++; out.push(`<pre class="mdv-code"${fence[2] ? ` data-lang="${esc(fence[2])}"` : ""}><code>${esc(code.join("\n"))}</code></pre>`); continue; }
      const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (h) { flush(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); out.push("<hr>"); i++; continue; }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && isSep(lines[i + 1])) {
        flush(); const head = row(line); i += 2; const body = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) body.push(row(lines[i++]));
        out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${head.map((_, k) => `<td>${inline(r[k] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
        continue;
      }
      const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (li) {
        flush(); const ordered = /\d/.test(li[2]); const items = [];
        while (i < lines.length) { const m2 = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]); if (!m2 || /\d/.test(m2[2]) !== ordered) break; const chk = /^\[([ xX])\]\s+(.*)$/.exec(m2[3]); items.push(chk ? `<li class="task${chk[1] === " " ? "" : " done"}"><span class="ck">${chk[1] === " " ? "☐" : "☑"}</span> ${inline(chk[2])}</li>` : `<li>${inline(m2[3])}</li>`); i++; }
        out.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`); continue;
      }
      if (/^\s*>\s?/.test(line)) { flush(); const q = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, "")); out.push(`<blockquote>${toHtml(q.join("\n"))}</blockquote>`); continue; }
      if (/^\s*<!--/.test(line)) { let j = i; while (j < lines.length && !/-->/.test(lines[j])) j++; if (j < lines.length) { flush(); i = j + 1; continue; } }   // 주석은 보이지 않는다 — 닫는 표시가 없으면 글로 보인다(문서 나머지가 사라지지 않게)
      if (!line.trim()) { flush(); i++; continue; }
      para.push(line.trim()); i++;
    }
    flush();
    return out.join("\n");
  }
  // C-53(2026-10-28 이재엽 버튼 "서식 단추는 만든다"): 문서 도구 줄의 서식 — 원문에 마크다운 기호를 넣는다. 순수: (글, 고른 시작, 고른 끝, 종류) → { text, start, end }. 글 칸의 고른 자리는 앱의 작업실 창(win.js) · 브라우저 판(app.js)이 넘긴다
  const lineRange = (t, a, b) => { const ls = t.lastIndexOf("\n", a - 1) + 1, e = t.indexOf("\n", Math.max(a, b - (b > a && t[b - 1] === "\n" ? 1 : 0))); return [ls, e < 0 ? t.length : e]; };
  function format(text, start, end, kind) {
    const t = String(text); let a = Math.max(0, Math.min(start | 0, t.length)), b = Math.max(a, Math.min(end | 0, t.length));
    const sel = t.slice(a, b);
    if (kind === "h2") {
      const [ls, le] = lineRange(t, a, a), line = t.slice(ls, le), on = line.startsWith("## ");
      const next = on ? line.slice(3) : `## ${line}`, d = on ? -3 : 3;
      return { text: t.slice(0, ls) + next + t.slice(le), start: Math.max(ls, a + d), end: Math.max(ls, b + d) };
    }
    if (kind === "bold") return sel ? { text: `${t.slice(0, a)}**${sel}**${t.slice(b)}`, start: a + 2, end: b + 2 } : { text: `${t.slice(0, a)}****${t.slice(b)}`, start: a + 2, end: a + 2 };
    if (kind === "list") {
      const [ls, le] = lineRange(t, a, b), lines = t.slice(ls, le).split("\n"), all = lines.every((l) => !l.trim() || l.startsWith("- "));
      const out = lines.map((l) => (all ? l.replace(/^- /, "") : l.trim() ? `- ${l}` : l)).join("\n");
      return { text: t.slice(0, ls) + out + t.slice(le), start: ls, end: ls + out.length };
    }
    if (kind === "link") { const label = sel || "글"; return { text: `${t.slice(0, a)}[${label}](주소)${t.slice(b)}`, start: a + label.length + 3, end: a + label.length + 5 }; }
    if (kind === "front") {
      if (t.startsWith("---\n")) return { text: t, start: a, end: b };
      const h = t.match(/^#\s+(.+)$/m), head = `---\ntitle: ${h ? h[1].trim() : ""}\ndate: ${new Date().toLocaleDateString("sv")}\n---\n\n`;
      return { text: head + t, start: a + head.length, end: b + head.length };
    }
    return { text: t, start: a, end: b };
  }
  // 목차 — 제목 줄(# ~ ###, 코드 울타리 밖)을 차례로. empty: 다음 제목(또는 끝)까지 글이 없는 절 — 오른쪽 칸 '이 문서'의 칸 채움(C-53)
  // 비었나: 다음 같은 깊이(또는 더 얕은) 제목까지 글이 없으면 — 더 깊은 절(###)은 그 절의 내용으로 친다
  function outline(text) {
    const out = [], open = []; let fence = false;
    String(text).split("\n").forEach((l, i) => {
      if (/^```/.test(l)) { fence = !fence; return; }
      if (fence) return;
      const m = l.match(/^(#{1,3})\s+(.+?)\s*$/);
      if (m) {
        const h = { level: m[1].length, text: m[2], line: i + 1, empty: true };
        while (open.length && open[open.length - 1].level >= h.level) open.pop();
        for (const o of open) o.empty = false;
        out.push(h); open.push(h); return;
      }
      if (l.trim()) for (const o of open) o.empty = false;
    });
    return out;
  }
  const api = { toHtml, inline, esc, format, outline };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.FloeMd = api;
})(typeof window !== "undefined" ? window : globalThis);
