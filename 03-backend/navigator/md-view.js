// claude-drafted: 2026-10-27 — C-43 파일 보기(이재엽 버튼 "읽기 + 고치기"): md를 보기 좋게 보이기 위한 작은 변환기. 순수 함수 — 밖의 글을 받으므로 **모든 글은 HTML로 가린다**(태그 · 스크립트가 살아나지 않게).
//   제목(#~######) · 목록(- · * · 1.) · 인용(>) · 코드 울타리(```) · 표(| |) · 가로줄 · 굵게(**) · 기울임(*) · 코드(`) · 링크([글](주소) — 주소는 보이기만, 누르면 밖으로 안 나감 — rel=noopener · http(s)만)
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
      if (/^\s*<!--/.test(line)) { flush(); while (i < lines.length && !/-->/.test(lines[i])) i++; i++; continue; }   // 주석은 보이지 않는다(글에 섞인 HTML은 가려서 보인다)
      if (!line.trim()) { flush(); i++; continue; }
      para.push(line.trim()); i++;
    }
    flush();
    return out.join("\n");
  }
  const api = { toHtml, inline, esc };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.FloeMd = api;
})(typeof window !== "undefined" ? window : globalThis);
