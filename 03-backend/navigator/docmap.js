// claude-drafted: 2026-10-27 — C-45 문서 지도(이재엽 "아치보드로 문서들이 이어지고 확인이 가능한 기능" · 버튼 "작업실의 새 탭" · "엔진을 앱에 한 벌 넣기"):
//   프로젝트 문서(docs/** · README · CLAUDE.md)를 상자로, 문서 안의 md 링크를 선으로 이은 archi-board 보드 데이터(format 1)를 만든다. 순수 함수 — 파일은 서버(server.js /api/docmap)가 읽어 넘긴다.
//   이음의 근거: '## 재료' 절의 링크(어느 단계 칸에서 왔나)가 1순위(realization), 그 밖의 md 링크는 2순위(association). 지금 장 문서 · 바뀐 문서를 표시. 엔진은 03-backend/navigator/board/(archi-board v1 사본, MIT)
"use strict";
const LINK = /\[[^\]]*\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/g;
// 상대 경로 풀기 — 폴더 밖(..이 남음)은 null
function resolveRel(fromPath, href) {
  const base = fromPath.split("/").slice(0, -1);
  for (const part of String(href).replace(/^\.\//, "").split("/")) { if (part === "..") { if (!base.length) return null; base.pop(); } else if (part && part !== ".") base.push(part); }
  return base.join("/");
}
// 문서 하나의 링크 — { to, kind: "material" | "link" }(재료 절 안의 링크는 material)
function linksOf(doc) {
  const out = []; let material = false;
  for (const line of String(doc.text || "").replace(/\r\n?/g, "\n").split("\n")) {
    const h = /^##\s+(.+)/.exec(line); if (h) material = /재료/.test(h[1]);
    for (const m of line.matchAll(LINK)) { const to = resolveRel(doc.path, m[1]); if (to && to !== doc.path) out.push({ to, kind: material ? "material" : "link" }); }
  }
  return out;
}
const frameOf = (p) => (/^docs\/\d\d-[^/]+\//.test(p) ? "stages" : p.startsWith("docs/") ? "plan" : "repo");
const idOf = (p) => `do_${p.replace(/[^A-Za-z0-9]+/g, "_")}`;
const stageNo = (p) => { const m = /^docs\/(\d\d)-/.exec(p); return m ? Number(m[1]) : 99; };
// docs: [{ path, text }], opt: { now: 지금 장 문서 경로, changed: Set(바뀐 경로), project }
function build(docs, opt = {}) {
  const list = (docs || []).filter((d) => d && /\.md$/i.test(d.path)).sort((a, b) => stageNo(a.path) - stageNo(b.path) || a.path.localeCompare(b.path));
  const have = new Set(list.map((d) => d.path)), changed = opt.changed instanceof Set ? opt.changed : new Set(opt.changed || []);
  const elements = list.map((d) => ({ f: frameOf(d.path), id: idOf(d.path), t: "dobject", n: d.path.split("/").pop(), d: d.path === opt.now ? "지금 장의 문서예요" : changed.has(d.path) ? "고친 뒤 아직 저장하지 않은 문서예요" : "", s: d.path === opt.now ? "part" : changed.has(d.path) ? "cand" : "done", c: d.path }));
  const seen = new Set(), relations = [];
  for (const d of list) for (const l of linksOf(d)) { if (!have.has(l.to)) continue; const key = `${d.path}>${l.to}`; if (seen.has(key)) continue; seen.add(key); relations.push([idOf(d.path), idOf(l.to), l.kind === "material" ? "realization" : "association"]); }
  const frames = [
    { id: "stages", kicker: "단계 문서", title: "1단계부터 8단계까지", weight: 5, w: 1100, main: true, sub: "장마다 한 장 — 재료 줄이 앞 장을 가리킨다", desc: "상자를 누르면 오른쪽에 이 문서가 어디서 왔고 어디로 이어지는지 나와요. '파일 보기에서 열기'로 열어요.", why: "문서가 이어진 모습을 한눈에 보려고" },
    { id: "plan", kicker: "기획서 · 결정 기록", title: "한 장으로 모은 것", weight: 3, w: 700, sub: "기획서 · 결정 기록 · 목차", desc: "단계 문서를 모아 한 장으로 만든 문서들이에요." },
    { id: "repo", kicker: "저장소", title: "README · CLAUDE.md", weight: 2, w: 700, sub: "저장소 맨 위의 문서", desc: "Floe가 절만 바꾸는 문서예요." },
  ].filter((f) => elements.some((e) => e.f === f.id));
  const flows = [];
  if (frames.some((f) => f.id === "plan") && frames.some((f) => f.id === "stages")) flows.push(["stages", "plan", "단계 문서를 모아"]);
  if (frames.some((f) => f.id === "repo") && frames.some((f) => f.id === "stages")) flows.push(["stages", "repo", "절만 바꿔 넣어"]);
  return { format: 1, title: `${opt.project || "프로젝트"} 문서 지도`, sub: `문서 ${elements.length}개 · 이음 ${relations.length}개 — 재료 줄(굵은 선)은 어느 단계에서 왔는지, 나머지는 md 링크`, start: "stages", frames, elements, relations, flows,
    tour: elements.length ? [{ t: "단계 차례로", f: ["stages"], ids: elements.filter((e) => e.f === "stages").map((e) => e.id), p: "1단계부터 차례로 문서를 따라가요." }] : [] };
}
module.exports = { build, linksOf, resolveRel, frameOf, idOf };
