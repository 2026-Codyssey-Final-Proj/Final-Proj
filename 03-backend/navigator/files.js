// claude-drafted: 2026-10-27 — C-42 R-8(이재엽 버튼 "전부" · "깊이 3 · 200개"): 작업실 왼쪽 파일 칸에 연결한 폴더의 파일 · 폴더 **이름만** 보이기 위한 목록. 서버(server.js GET /api/files)만 쓴다.
//   읽기만 — 내용은 읽지 않는다. 폴더 밖으로 나가지 않는다(경로를 요청에서 받지 않고, 바로가기(심볼릭 링크)는 따라가지도 보이지도 않는다).
//   빼는 것: 점으로 시작하는 것(.git · .env · .claude …) · node_modules · 비밀값 파일(.claude/hooks/check-secrets.sh의 FORBIDDEN과 같은 모양 — .env.* · id_rsa · id_ed25519 · credentials.json · *.pem · *.key · *.p12 · *.pfx).
//   한계: 깊이 3(맨 위가 1 — docs/03-requirements/requirements.md까지), 200개(넘으면 cut). 폴더마다 파일 먼저 · 이름순. 순수 함수 — 시험은 04-tests/navigator/files-api.test.js
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const DEPTH = 3, MAX = 200;
const SECRET = /^(\.env(\.(?!example$|sample$|template$)[^/]+)?|id_rsa|id_ed25519|credentials\.json)$|\.(pem|key|p12|pfx)$/i;
const skip = (e) => e.name.startsWith(".") || e.isSymbolicLink() || SECRET.test(e.name) || (e.isDirectory() && e.name === "node_modules") || !(e.isDirectory() || e.isFile());

// { files: [{ name, path, dir, depth }](깊이 우선 — 폴더의 안쪽이 바로 뒤에), total, cut, unread }. redact: 이름을 가리는 함수(sensitive.js) — 폴더 경로(dir)는 답에 넣지 않는다
// exclude: (상대 경로, 폴더인가) => 빼나 — 사람이 고른 '빼 둘 곳'(C-52, exclude.js matcher). 맞으면 목록에 넣지도 그 안으로 내려가지도 않는다
function listFiles(dir, { depth = DEPTH, max = MAX, redact = (s) => s, exclude = () => false } = {}) {
  const files = []; let cut = false, unread = 0;   // unread: 읽지 못한 폴더 수(권한 등) — 빈 폴더와 구분해 알린다(security-records 6-1, 새 맥락 리뷰 2026-10-27)
  const walk = (d, lvl, rel) => {
    let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { unread++; return; }
    ents = ents.filter((e) => !skip(e)).sort((a, b) => Number(a.isDirectory()) - Number(b.isDirectory()) || a.name.localeCompare(b.name, "en"));   // F-78: 언어를 고정 — 컴퓨터 언어(ko-KR)를 따르면 한글이 영문 앞에 와 팀마다 순서가 달랐다(2026-10-29)
    for (const e of ents) {
      if (files.length >= max) { cut = true; return; }
      const isDir = e.isDirectory(), p = rel ? `${rel}/${e.name}` : e.name;
      if (exclude(p, isDir)) continue;
      files.push({ name: redact(e.name), path: redact(p), dir: isDir, depth: lvl, raw: p });   // raw — 가리지 않은 상대 경로(서버가 열 때 쓰고 답에는 넣지 않는다, C-43)
      if (isDir && lvl < depth) walk(path.join(d, e.name), lvl + 1, p);
      if (cut) return;
    }
  };
  walk(dir, 1, "");
  return { files, total: files.length, cut, unread };
}

// ── C-43 파일 보기 · 고치기(2026-10-27 이재엽 버튼 "읽기 + 고치기" · "512KB" · "내용을 이해하고 어떤 내용인지만 판단"): 확장자 목록이 아니라 **내용으로** 글 파일인지 본다 ──
const FILE_MAX = 512 * 1024;
// 글 파일인가 — 앞 8KB에 NUL이 없고 UTF-8로 읽힌다(그림 · 압축 · 실행 파일은 NUL이 있다). 종류는 보이는 방식을 고르기 위한 것일 뿐 — 모르면 글(text)
// 잘린 끝의 불완전한 UTF-8 꼬리(마지막 글자가 2~4바이트 중 끊김)는 떼고 본다 — 8KB 경계에 한글이 걸리면 글 파일을 거절했다(새 맥락 리뷰 2026-10-27 막힘)
function isText(buf) {
  let head = buf.subarray(0, 8192);
  if (head.includes(0)) return false;
  if (buf.length > head.length) { let cut = 0; for (let i = head.length - 1; i >= Math.max(0, head.length - 4); i--) { if ((head[i] & 0xC0) === 0x80) { cut++; continue; } if ((head[i] & 0xE0) === 0xC0 || (head[i] & 0xF0) === 0xE0 || (head[i] & 0xF8) === 0xF0) cut++; break; } head = head.subarray(0, head.length - cut); }
  try { new TextDecoder("utf-8", { fatal: true }).decode(head); return true; } catch { return false; }
}
const isUtf16 = (buf) => buf.length >= 2 && ((buf[0] === 0xFF && buf[1] === 0xFE) || (buf[0] === 0xFE && buf[1] === 0xFF));   // UTF-16 BOM — 글 파일이지만 UTF-8이 아니다(까닭을 맞게 말하려고)
const KIND_BY_EXT = { md: "md", markdown: "md", txt: "text", log: "text", csv: "text", json: "code", yaml: "code", yml: "code", toml: "code", ini: "code", env: "code", js: "code", mjs: "code", cjs: "code", ts: "code", tsx: "code", jsx: "code", py: "code", rb: "code", go: "code", rs: "code", java: "code", kt: "code", swift: "code", c: "code", h: "code", cpp: "code", cs: "code", php: "code", sh: "code", bash: "code", zsh: "code", html: "code", htm: "code", css: "code", scss: "code", sql: "code", xml: "code", svg: "code" };
const kindOf = (name) => { const m = /\.([A-Za-z0-9]+)$/.exec(String(name)); return (m && KIND_BY_EXT[m[1].toLowerCase()]) || "text"; };
// 폴더 안의 상대 경로를 안전하게 — 가는 길에 바로가기가 있으면 null(서버 docTargets와 같은 생각), 폴더 밖(..)도 null
function safePath(root, rel) {
  const parts = String(rel || "").split("/");
  if (!parts.length || parts.some((x) => !x || x === "." || x === "..")) return null;
  let cur = path.resolve(root);
  for (const part of parts) {
    cur = path.join(cur, part);
    let st = null; try { st = fs.lstatSync(cur); } catch { return null; }
    if (st.isSymbolicLink()) return null;
  }
  return cur;
}
// git diff의 덩어리 머리(@@ -a,b +c,d @@)에서 새 쪽의 바뀐 줄 [시작, 개수]만 — 내용은 받지 않는다
const changedLines = (diff) => [...String(diff || "").matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].map((m) => [Number(m[1]), m[2] === undefined ? 1 : Number(m[2])]).filter(([, n]) => n > 0);
module.exports = { listFiles, DEPTH, MAX, SECRET, FILE_MAX, isText, isUtf16, kindOf, safePath, changedLines };
