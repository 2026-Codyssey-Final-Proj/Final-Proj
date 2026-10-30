// claude-drafted: 2026-10-30 — 지식 창고(세컨드 브레인) 연결(작업 보드 '지식 창고 연결' — "책을 지식 창고와 얇은 경계로 잇는다", 이재엽 "보드에서 없음 부분 전부 제작").
// 얇은 경계 = 파일 모양만. 채택한 '가져갈 것'(C-48)을 세컨드 브레인의 지식 문서 한 장으로 바꾼다 — 모양은
//   05-projects/second-brain/implementations/skeleton/knowledge.py save_knowledge(ADR-0008)와 같다: vault/지식/<목적>/<이름>.md, 머리말 다섯 줄 · 관찰 · 해석 · 행동.
//   두 프로젝트는 서로의 코드를 부르지 않는다(세컨드 브레인 쪽이 이 파일을 다시 읽는 것은 시험이 본다). 쓰기는 server.js(데이터 폴더 SECOND_BRAIN_DATA — ADR-0010)
// 순수 함수. 시험 04-tests/navigator/knowledge-store.test.js
(function (root) {
  const PURPOSE = "작업";   // knowledge.py PURPOSES 중 — Floe에서 온 배움은 '작업'
  const NAME_MAX = 80;
  // 못 찍는 글자(제어 · C1 · 폭 없는 글자 · 방향 표시)는 빈칸으로 — knowledge.py _name의 isprintable()이 받지 않는다
  const one = (t) => String(t == null ? "" : t).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]+/g, " ").replace(/\s+/g, " ").trim();
  const label = (n) => `${n + 1}단계`;
  // 이름 — knowledge.py _name이 받는 꼴로: 슬래시 · 역슬래시 없음, 점으로 시작하지 않음, 80자까지, 찍을 수 있는 글자
  function nameOf(text) {
    const parts = one(String(text || "").replace(/[\/\\:?*"<>|]+/g, " ")).split(" ").filter((x) => x && !/^\.+$/.test(x));   // : ? * " < > | — Windows가 파일 이름에 받지 않는다
    return Array.from(parts.join(" ").replace(/^\.+/, "").trim()).slice(0, NAME_MAX).join("").trim();   // 글자 단위로 자른다 — 이모지 반쪽이 남지 않게
  }
  // item — 장부의 한 줄(carry.js decide) · today — YYYY-MM-DD. 채택한 것만, 이름이 비면 null
  function toKnowledge(item, { today = "" } = {}) {
    if (!item || item.state !== "adopted") return null;
    const name = nameOf(item.text); if (!name) return null;
    const from = Array.isArray(item.from) ? item.from.filter((n) => Number.isInteger(n)).map(label) : [];
    const when = Number.isInteger(item.stage) && item.stage >= 0 ? `${label(item.stage)}에서 다시 쓸 배움` : "다시 쓸 배움";
    const cols = [["관찰", one(item.why) || "미정"], ["해석", `${when}${from.length ? ` — 근거 ${from.join(" · ")}` : ""}${item.review ? `, 다시 볼 날 ${one(item.review)}` : ""}`], ["행동", one(item.text)]];
    const source = `Floe 가져갈 것${item.project ? ` · ${one(item.project)}` : ""}`;
    const text = `# ${name}\n- 목적: ${PURPOSE}\n- 출처: ${source}\n- 만든 날: ${today}\n- 인용: 0 (마지막 -)\n\n${cols.map(([l, v]) => `## ${l}\n${v}\n`).join("\n")}`;
    return { purpose: PURPOSE, name, text };
  }
  const api = { PURPOSE, nameOf, toKnowledge };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FloeSbKnow = api;
})(typeof window !== "undefined" ? window : globalThis);
